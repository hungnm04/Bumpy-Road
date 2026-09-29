const pool = require("../config/db");
const bcrypt = require("bcryptjs");
const path = require("path");
const { cleanupOldAvatar } = require("../utils/fileUtils");

const PASSWORD_HASH_PREFIX = "$2";
const SALT_ROUNDS = 12;

const hashPassword = (password) => bcrypt.hash(password, SALT_ROUNDS);

const verifyPassword = async (password, storedPassword) => {
  if (!storedPassword) return false;
  if (storedPassword.startsWith(PASSWORD_HASH_PREFIX)) {
    return bcrypt.compare(password, storedPassword);
  }
  return password === storedPassword;
};

const validatePassword = (password) => {
  if (typeof password !== "string" || password.length < 8) {
    throw new Error("Password must be at least 8 characters");
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

    if (!user.user_password.startsWith(PASSWORD_HASH_PREFIX)) {
      await pool.query("UPDATE users SET user_password = $1 WHERE username = $2", [
        await hashPassword(password),
        user.username,
      ]);
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
      password,
      "guest",
      email,
      first_name,
      last_name,
      bio,
      defaultAvatarUrl,
    ];
    values[1] = await hashPassword(password);

    const result = await pool.query(query, values);

    return {
      success: true,
      message: "User registered successfully",
      user: result.rows[0],
    };
  } catch (error) {
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

    // Ensure username is always included in the response
    const profile = rows[0];
    return {
      ...profile,
      username: profile.username, // Make sure username is included
    };
  } catch (error) {
    throw new Error(`Profile fetch error: ${error.message}`);
  }
};

const updateUserProfile = async (username, updatedData) => {
  const { first_name, last_name, email, bio, avatar_url } = updatedData;
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Get current user data to check for existing avatar
    const currentUser = await client.query("SELECT avatar_url FROM users WHERE username = $1", [
      username,
    ]);

    if (currentUser.rows[0]?.avatar_url && avatar_url) {
      // Clean up old avatar file
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
    throw new Error(`Profile update error: ${error.message}`);
  } finally {
    client.release();
  }
};

module.exports = {
  verifyLogin,
  createUser,
  updateUserProfile,
  getUserProfile,
  hashPassword,
  validatePassword,
};
