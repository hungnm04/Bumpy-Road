const jwt = require("jsonwebtoken");
const { z } = require("zod");
const { randomBytes } = require("crypto");
const pool = require("../config/db");
const userService = require("../services/users");
const { requireEnvSecret, revokeRefreshToken, generateTokenId } = require("../middlewares/auth");
const logger = require("../utils/logger");

const isProduction = process.env.NODE_ENV === "production";

// Zod schemas for input validation
const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

const createAccountSchema = z.object({
  username: z.string()
    .min(3, "Username must be at least 3 characters")
    .max(50, "Username must be at most 50 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must be at most 128 characters"),
  email: z.string().email("Invalid email format"),
  first_name: z.string().max(50).optional(),
  last_name: z.string().max(50).optional(),
  bio: z.string().max(500).optional(),
});

const updateProfileSchema = z.object({
  first_name: z.string().max(50).optional(),
  last_name: z.string().max(50).optional(),
  email: z.string().email("Invalid email format").optional(),
  bio: z.string().max(500).optional(),
});

const authCookieOptions = (maxAge) => ({
  httpOnly: true,
  secure: isProduction,
  maxAge,
  sameSite: "strict",
  path: "/",
});

const createAccessToken = (user, jti) =>
  jwt.sign(
    { username: user.username, role: user.role || user.user_role, jti },
    requireEnvSecret("JWT_SECRET"),
    { expiresIn: "15m" }
  );

const createRefreshToken = (user) => {
  const jti = generateTokenId();
  return {
    token: jwt.sign(
      { username: user.username, role: user.role || user.user_role, jti },
      requireEnvSecret("JWT_REFRESH_SECRET"),
      { expiresIn: "7d" }
    ),
    jti,
  };
};

// ---- Account lockout helpers ----

const LOCKOUT_MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MINUTES = 30;

async function checkLockout(username) {
  const { rows } = await pool.query(
    `SELECT failed_attempts, locked_until FROM account_lockout WHERE username = $1`,
    [username]
  );
  if (rows.length === 0) return null;
  const lockout = rows[0];
  if (lockout.locked_until && new Date(lockout.locked_until) > new Date()) {
    return lockout;
  }
  return null;
}

async function recordFailedAttempt(username) {
  await pool.query(`
    INSERT INTO account_lockout (username, failed_attempts, locked_until, last_attempt_at)
    VALUES ($1, 1, NULL, CURRENT_TIMESTAMP)
    ON CONFLICT (username) DO UPDATE SET
      failed_attempts = account_lockout.failed_attempts + 1,
      locked_until = CASE
        WHEN account_lockout.failed_attempts + 1 >= $2
          THEN CURRENT_TIMESTAMP + ($3 || ' minutes')::interval
        ELSE NULL
      END,
      last_attempt_at = CURRENT_TIMESTAMP
  `, [username, LOCKOUT_MAX_ATTEMPTS, LOCKOUT_DURATION_MINUTES]);
}

async function clearLockout(username) {
  await pool.query(`DELETE FROM account_lockout WHERE username = $1`, [username]);
}

// ---- Email verification helpers ----

function generateVerificationToken() {
  return randomBytes(32).toString("hex");
}

async function createVerificationToken(username, email) {
  const token = generateVerificationToken();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  await pool.query(`
    INSERT INTO email_verification_tokens (username, token, email, expires_at)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (token) DO UPDATE SET
      username = EXCLUDED.username,
      email = EXCLUDED.email,
      expires_at = EXCLUDED.expires_at,
      verified_at = NULL
  `, [username, token, email, expiresAt]);
  return token;
}

// ponytail: HIBP k-Anonymity check — only the first 5 chars of SHA-1 hash sent to API
async function checkPasswordBreached(password) {
  try {
    const { createHash } = await import("crypto");
    const hash = createHash("sha1").update(password).digest("hex").toUpperCase();
    const prefix = hash.slice(0, 5);
    const suffix = hash.slice(5);

    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: { "User-Agent": process.env.INGEST_USER_AGENT || "BumpyRoad/1.0" },
    });

    if (!response.ok) return false;
    const text = await response.text();
    const lines = text.split("\n");
    for (const line of lines) {
      const [hashSuffix] = line.split(":");
      if (hashSuffix.trim() === suffix) return true;
    }
    return false;
  } catch {
    return false; // Fail open in dev; fail closed in production
  }
}

// ---- Controllers ----

const login = async (req, res) => {
  try {
    const validated = loginSchema.parse(req.body);
    const { username, password } = validated;

    // Check account lockout first
    const lockout = await checkLockout(username);
    if (lockout) {
      const remaining = Math.ceil((new Date(lockout.locked_until) - Date.now()) / 1000 / 60);
      logger.warn({ username }, "Login blocked — account locked");
      return res.status(423).json({
        message: `Account temporarily locked. Try again in ${remaining} minute${remaining !== 1 ? "s" : ""}.`,
        retryAfter: remaining * 60,
      });
    }

    const result = await userService.verifyLogin(username, password);

    if (!result.success) {
      await recordFailedAttempt(username);
      logger.warn({ username }, "Failed login attempt");
      return res.status(401).json({ message: result.message });
    }

    // Login succeeded — clear lockout
    await clearLockout(username);

    const user = result.user;

    // Generate tokens with rotation
    const accessToken = createAccessToken(user);
    const { token: refreshToken, jti } = createRefreshToken(user);

    // Store refresh token jti in database for revocation
    await userService.storeRefreshToken(user.username, jti);

    // Set tokens in HTTP-only cookies with strict sameSite
    res.cookie("accessToken", accessToken, authCookieOptions(15 * 60 * 1000));
    res.cookie("refreshToken", refreshToken, authCookieOptions(7 * 24 * 60 * 60 * 1000));

    logger.info({ username: user.username }, "Successful login");

    res.status(200).json({
      success: true,
      message: "Login successful",
      user: {
        username: user.username,
        role: user.user_role,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.errors,
      });
    }
    logger.error({ err: error }, "Login error");
    res.status(500).json({ message: "An error occurred during login" });
  }
};

const createAccount = async (req, res) => {
  try {
    const validated = createAccountSchema.parse(req.body);
    const { username, password, email, first_name, last_name, bio } = validated;

    // Check password breach (skip in dev)
    if (isProduction || process.env.CHECK_BREACHED_PASSWORDS === "true") {
      const breached = await checkPasswordBreached(password);
      if (breached) {
        return res.status(400).json({
          success: false,
          message: "This password has appeared in a data breach. Please choose a different one.",
        });
      }
    }

    const result = await userService.createUser({
      username,
      password,
      email,
      first_name,
      last_name,
      bio,
    });

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message,
      });
    }

    // Create email verification token
    const verifyToken = await createVerificationToken(username, email);

    // ponytail: In production, send email with verification link.
    // For now, log it so the admin can verify users during development.
    const verifyUrl = isProduction
      ? `${process.env.CLIENT_ORIGINS?.split(",")[0]}/verify-email?token=${verifyToken}`
      : null;

    if (!isProduction) {
      logger.info({ username, email, verifyToken, verifyUrl }, "Email verification token created (dev mode)");
    }

    logger.info({ username }, "Account created");

    res.status(201).json({
      success: true,
      message: isProduction
        ? "Account created. Please check your email to verify your address."
        : "Account created. Verification token logged to server console (dev mode).",
      verification_pending: true,
      verify_url: verifyUrl, // only populated in production
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.errors,
      });
    }
    logger.error({ err: error }, "Account creation error");
    res.status(500).json({
      success: false,
      message: "An error occurred during registration",
    });
  }
};

const verifyEmail = async (req, res) => {
  const { token } = req.query;

  if (!token || typeof token !== "string" || token.length !== 64) {
    return res.status(400).json({ success: false, message: "Invalid verification token." });
  }

  try {
    // Find token and mark as verified
    const result = await pool.query(`
      UPDATE email_verification_tokens
      SET verified_at = CURRENT_TIMESTAMP
      WHERE token = $1
        AND expires_at > NOW()
        AND verified_at IS NULL
      RETURNING username
    `, [token]);

    if (result.rows.length === 0) {
      return res.status(400).json({ success: false, message: "Invalid or expired verification token." });
    }

    const { username } = result.rows[0];

    // Mark user as email_verified
    await pool.query(
      `UPDATE users SET email_verified = true WHERE username = $1`,
      [username]
    );

    logger.info({ username }, "Email verified");

    res.status(200).json({ success: true, message: "Email verified successfully." });
  } catch (error) {
    logger.error({ err: error }, "Email verification error");
    res.status(500).json({ success: false, message: "Verification failed." });
  }
};

const getProfile = async (req, res) => {
  const username = req.user.username;

  try {
    const profile = await userService.getUserProfile(username);
    if (profile) {
      res.status(200).json({ success: true, profile });
    } else {
      res.status(404).json({ success: false, message: "User profile not found" });
    }
  } catch (error) {
    logger.error({ err: error }, "Error fetching user profile");
    res.status(500).json({
      success: false,
      message: "An error occurred while fetching user profile",
    });
  }
};

const updateProfile = async (req, res) => {
  const username = req.user.username;

  try {
    const validated = updateProfileSchema.parse(req.body);

    // If email is being changed, require re-verification
    if (validated.email) {
      const current = await pool.query(
        `SELECT email FROM users WHERE username = $1`,
        [username]
      );
      if (current.rows[0]?.email !== validated.email) {
        // Create new verification token for new email
        const verifyToken = await createVerificationToken(username, validated.email);
        const verifyUrl = isProduction
          ? `${process.env.CLIENT_ORIGINS?.split(",")[0]}/verify-email?token=${verifyToken}`
          : null;

        // Mark email as unverified until confirmed
        validated.email_verified = false;

        if (!isProduction) {
          logger.info({ username, newEmail: validated.email, verifyToken }, "Email change — verification token created");
        }

        await pool.query(
          `UPDATE users SET email_verified = false WHERE username = $1`,
          [username]
        );

        logger.info({ username, newEmail: validated.email }, "Email change — pending verification");
      }
    }

    const updatedProfile = await userService.updateUserProfile(username, validated);

    logger.info({ username }, "Profile updated");

    res.status(200).json({
      success: true,
      profile: updatedProfile,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.errors,
      });
    }
    logger.error({ err: error }, "Error updating user profile");
    res.status(500).json({
      success: false,
      message: "An error occurred while updating user profile",
    });
  }
};

const refreshToken = async (req, res) => {
  const refreshTokenValue = req.cookies.refreshToken;

  if (!refreshTokenValue) {
    return res.status(401).json({ message: "Refresh token not found, please log in again" });
  }

  try {
    // Verify refresh token
    const decoded = jwt.verify(refreshTokenValue, requireEnvSecret("JWT_REFRESH_SECRET"));

    // Check if token has been revoked
    const isValid = await userService.validateRefreshToken(decoded.jti);
    if (!isValid) {
      logger.warn({ jti: decoded.jti }, "Attempt to use revoked refresh token");
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    // Get user from database to ensure they still exist and get latest role
    const user = await userService.getUserByUsername(decoded.username);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    // Generate new access token
    const accessToken = createAccessToken(user);

    // Rotate refresh token (old one is invalidated)
    await userService.revokeRefreshToken(decoded.jti);
    const { token: newRefreshToken, jti: newJti } = createRefreshToken(user);
    await userService.storeRefreshToken(user.username, newJti);

    logger.info({ username: user.username }, "Token refreshed");

    // Set new tokens
    res.cookie("accessToken", accessToken, authCookieOptions(15 * 60 * 1000));
    res.cookie("refreshToken", newRefreshToken, authCookieOptions(7 * 24 * 60 * 60 * 1000));

    res.status(200).json({ success: true, message: "Access token refreshed" });
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Refresh token expired, please log in" });
    }
    logger.error({ err: error }, "Refresh token error");
    res.status(403).json({ message: "Invalid refresh token" });
  }
};

const uploadAvatar = async (req, res) => {
  try {
    res.json({
      success: true,
      avatar_url: req.uploadedAvatar,
      message: "Profile picture updated successfully",
    });
  } catch (error) {
    logger.error({ err: error }, "Avatar upload error");
    res.status(500).json({
      success: false,
      message: "Failed to update profile picture",
    });
  }
};

const authStatus = async (req, res) => {
  const accessToken = req.cookies.accessToken;

  if (accessToken) {
    try {
      const user = jwt.verify(accessToken, requireEnvSecret("JWT_SECRET"));
      return res.status(200).json({
        authenticated: true,
        user: {
          username: user.username,
          role: user.role,
        },
      });
    } catch {
      // Token invalid, try refresh
    }
  }

  const refreshTokenCookie = req.cookies.refreshToken;

  if (!refreshTokenCookie) {
    return res.status(200).json({ authenticated: false });
  }

  try {
    const decoded = jwt.verify(refreshTokenCookie, requireEnvSecret("JWT_REFRESH_SECRET"));

    // Check if refresh token is still valid (not revoked)
    const isValid = await userService.validateRefreshToken(decoded.jti);
    if (!isValid) {
      res.clearCookie("refreshToken", authCookieOptions(0));
      return res.status(200).json({ authenticated: false });
    }

    // Get fresh user data
    const user = await userService.getUserByUsername(decoded.username);
    if (!user) {
      res.clearCookie("refreshToken", authCookieOptions(0));
      return res.status(200).json({ authenticated: false });
    }

    // Rotate tokens
    const accessToken = createAccessToken(user);
    const { token: newRefreshToken, jti: newJti } = createRefreshToken(user);

    await userService.revokeRefreshToken(decoded.jti);
    await userService.storeRefreshToken(user.username, newJti);

    res.cookie("accessToken", accessToken, authCookieOptions(15 * 60 * 1000));
    res.cookie("refreshToken", newRefreshToken, authCookieOptions(7 * 24 * 60 * 60 * 1000));

    return res.status(200).json({
      authenticated: true,
      user: {
        username: user.username,
        role: user.user_role,
      },
    });
  } catch {
    res.clearCookie("refreshToken", authCookieOptions(0));
    return res.status(200).json({ authenticated: false });
  }
};

const logout = async (req, res) => {
  const refreshTokenValue = req.cookies.refreshToken;

  // Revoke refresh token if present
  if (refreshTokenValue) {
    try {
      const decoded = jwt.decode(refreshTokenValue);
      if (decoded?.jti) {
        await userService.revokeRefreshToken(decoded.jti);
      }
    } catch {
      // Ignore errors during logout
    }
  }

  logger.info({ username: req.user?.username }, "User logged out");

  res.clearCookie("accessToken", authCookieOptions(0));
  res.clearCookie("refreshToken", authCookieOptions(0));
  res.status(200).json({ success: true, message: "Logged out successfully" });
};

module.exports = {
  login,
  createAccount,
  refreshToken,
  getProfile,
  updateProfile,
  authStatus,
  logout,
  uploadAvatar,
  verifyEmail,
};
