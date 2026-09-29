const pool = require("../config/db");
const argon2 = require("argon2");
const path = require("path");
const { cleanupOldAvatar } = require("../utils/fileUtils");
const logger = require("../utils/logger");

// Hash prefix detection
const BCRYPT_PREFIX = "$2";
const ARGON2_PREFIX = "$argon2";
const SALT_ROUNDS = 12;

const hashPassword = async (password) => {
  // Use argon2id by default for new hashes
  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 65536, // 64MB
    timeCost: 3,
    parallelism: 4,
  });
};

const verifyPassword = async (password, storedPassword) => {
  if (!storedPassword) return false;

  try {
    // Argon2 hash (new format)
    if (storedPassword.startsWith(ARGON2_PREFIX)) {
      return argon2.verify(storedPassword, password);
    }

    // Bcrypt hash (legacy format)
    if (storedPassword.startsWith(BCRYPT_PREFIX)) {
      const bcrypt = require("bcryptjs");
      return bcrypt.compare(password, storedPassword);
    }

    // Plain text — reject immediately; this should never exist in a properly seeded DB
    // Keeping the check but treating it as a failed verification (not a fallback success)
    logger.error({ username: "unknown" }, "Plaintext password detected — this is a security risk");
    return false;
  } catch (error) {
    logger.error({ err: error }, "Password verification error");
    return false;
  }
};

// Migrate bcrypt password to argon2 on next login
const migratePasswordIfNeeded = async (username, password, storedPassword) => {
  if (!storedPassword.startsWith(BCRYPT_PREFIX)) {
    return; // Already migrated or new format
  }

  try {
    const bcrypt = require("bcryptjs");
    const matches = await bcrypt.compare(password, storedPassword);
    if (matches) {
      // Migrate to argon2
      const newHash = await hashPassword(password);
      await pool.query(
        "UPDATE users SET user_password = $1 WHERE username = $2",
        [newHash, username]
      );
      logger.info({ username }, "Password migrated to argon2");
    }
  } catch (error) {
    logger.warn({ err: error, username }, "Password migration failed");
  }
};

const validatePassword = (password) => {
  if (typeof password !== "string" || password.length < 8) {
    throw new Error("Password must be at least 8 characters");
  }
  if (password.length > 128) {
    throw new Error("Password must be at most 128 characters");
  }
};

const verifyLogin = async (emailOrUsername, password) => {
  const query = `
    SELECT user_password, user_role, email, username
    FROM users
    WHERE username = $1 OR email = $1
  `;

  try {
    const { rows } = await pool.query(query, [emailOrUsername]);

    if (rows.length === 0) {
      return { success: false, message: "Invalid username or password" };
    }

    const user = rows[0];
    const passwordMatches = await verifyPassword(password, user.user_password);

    if (!passwordMatches) {
      return { success: false, message: "Invalid username or password" };
    }

    // Lazy migration: if bcrypt, migrate to argon2 on successful login
    if (user.user_password.startsWith(BCRYPT_PREFIX)) {
      await migratePasswordIfNeeded(user.username, password, user.user_password);
    }

    return {
      success: true,
      message: "Login successful",
      user: {
        username: user.username,
        user_role: user.user_role,
        email: user.email,
      },
    };
  } catch (error) {
    logger.error({ err: error }, "Login error");
    throw new Error(`Login error: ${error.message}`);
  }
};

const createUser = async ({
  username,
  password,
  email,
  first_name = "",
  last_name = "",
  bio = "",
}) => {
  try {
    validatePassword(password);

    const existingUser = await pool.query(
      "SELECT username, email FROM users WHERE username = $1 OR email = $2",
      [username, email]
    );

    if (existingUser.rows.length > 0) {
      const field = existingUser.rows[0].username === username ? "username" : "email";
      return { success: false, message: `${field} already exists` };
    }

    const defaultAvatarUrl = "/storage/avatars/default-avatar.png";
    const hashedPassword = await hashPassword(password);

    const query = `
      INSERT INTO users (
        username,
        user_password,
        user_role,
        email,
        first_name,
        last_name,
        bio,
        avatar_url
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING username, email, user_role, avatar_url
    `;

    const values = [
      username,
      hashedPassword,
      "guest",
      email,
      first_name,
      last_name,
      bio,
      defaultAvatarUrl,
    ];

    const result = await pool.query(query, values);

    return {
      success: true,
      message: "User registered successfully",
      user: result.rows[0],
    };
  } catch (error) {
    logger.error({ err: error }, "Registration error");
    throw new Error(`Registration error: ${error.message}`);
  }
};

const getUserProfile = async (username) => {
  try {
    const { rows } = await pool.query(
      "SELECT username, first_name, last_name, email, bio, created_at AS joined_date, avatar_url FROM users WHERE username = $1",
      [username]
    );

    if (rows.length === 0) {
      return null;
    }

    const profile = rows[0];
    return {
      ...profile,
      username: profile.username,
    };
  } catch (error) {
    logger.error({ err: error }, "Profile fetch error");
    throw new Error(`Profile fetch error: ${error.message}`);
  }
};

const getUserByUsername = async (username) => {
  try {
    const { rows } = await pool.query(
      "SELECT username, user_role, email FROM users WHERE username = $1",
      [username]
    );

    if (rows.length === 0) {
      return null;
    }

    return rows[0];
  } catch (error) {
    logger.error({ err: error }, "User fetch error");
    throw new Error(`User fetch error: ${error.message}`);
  }
};

const updateUserProfile = async (username, updatedData) => {
  const { first_name, last_name, email, bio, avatar_url } = updatedData;
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const currentUser = await client.query("SELECT avatar_url FROM users WHERE username = $1", [
      username,
    ]);

    if (currentUser.rows[0]?.avatar_url && avatar_url) {
      const oldAvatarPath = path.join(__dirname, "..", currentUser.rows[0].avatar_url);
      cleanupOldAvatar(oldAvatarPath);
    }

    const query = `
      UPDATE users
      SET first_name = COALESCE($2, first_name),
          last_name = COALESCE($3, last_name),
          email = COALESCE($4, email),
          bio = COALESCE($5, bio),
          avatar_url = COALESCE($6, avatar_url),
          updated_at = CURRENT_TIMESTAMP
      WHERE username = $1
      RETURNING username, first_name, last_name, email, bio, created_at AS joined_date, avatar_url
    `;

    const values = [username, first_name, last_name, email, bio, avatar_url];
    const result = await client.query(query, values);

    await client.query("COMMIT");
    return result.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    logger.error({ err: error }, "Profile update error");
    throw new Error(`Profile update error: ${error.message}`);
  } finally {
    client.release();
  }
};

// Refresh token management
const storeRefreshToken = async (username, jti) => {
  try {
    await pool.query(
      `INSERT INTO refresh_tokens (username, token_jti, created_at)
       VALUES ($1, $2, CURRENT_TIMESTAMP)
       ON CONFLICT (username, token_jti) DO NOTHING`,
      [username, jti]
    );
  } catch (error) {
    logger.error({ err: error }, "Failed to store refresh token");
    throw error;
  }
};

const validateRefreshToken = async (jti) => {
  try {
    const result = await pool.query(
      `SELECT 1 FROM revoked_refresh_tokens
       WHERE token_jti = $1 AND expires_at > NOW()`,
      [jti]
    );

    if (result.rows.length > 0) {
      return false; // Token has been revoked
    }

    // Also check if token exists in active tokens
    const activeResult = await pool.query(
      `SELECT 1 FROM refresh_tokens WHERE token_jti = $1`,
      [jti]
    );

    return activeResult.rows.length > 0;
  } catch (error) {
    logger.error({ err: error }, "Refresh token validation error");
    return false;
  }
};

const revokeRefreshToken = async (jti) => {
  try {
    // Get expiration time from token (decoded separately)
    const decoded = await new Promise((resolve, reject) => {
      const jwt = require("jsonwebtoken");
      // Decode without verification to get exp
      const decoded = jwt.decode(req?.cookies?.refreshToken || "");
      if (decoded?.exp) {
        resolve(decoded);
      } else {
        // Default to 7 days from now if we can't decode
        resolve({ exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60 });
      }
    });

    const expiresAt = new Date(decoded.exp * 1000);

    // Add to revoked tokens table
    await pool.query(
      `INSERT INTO revoked_refresh_tokens (token_jti, expires_at)
       VALUES ($1, $2)
       ON CONFLICT (token_jti) DO NOTHING`,
      [jti, expiresAt]
    );

    // Remove from active tokens
    await pool.query(
      "DELETE FROM refresh_tokens WHERE token_jti = $1",
      [jti]
    );

    logger.info({ jti }, "Refresh token revoked");
    return true;
  } catch (error) {
    logger.error({ err: error }, "Failed to revoke refresh token");
    return false;
  }
};

// Clean up expired tokens (can be run as a scheduled task)
const cleanupExpiredTokens = async () => {
  try {
    const result = await pool.query(
      "DELETE FROM revoked_refresh_tokens WHERE expires_at < NOW()"
    );
    logger.info({ deleted: result.rowCount }, "Cleaned up expired revoked tokens");
    return result.rowCount;
  } catch (error) {
    logger.error({ err: error }, "Token cleanup error");
    return 0;
  }
};

module.exports = {
  verifyLogin,
  createUser,
  updateUserProfile,
  getUserProfile,
  getUserByUsername,
  hashPassword,
  validatePassword,
  storeRefreshToken,
  validateRefreshToken,
  revokeRefreshToken,
  cleanupExpiredTokens,
};
