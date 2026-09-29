const jwt = require("jsonwebtoken");
const { z } = require("zod");
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

const login = async (req, res) => {
  try {
    const validated = loginSchema.parse(req.body);
    const { username, password } = validated;

    const result = await userService.verifyLogin(username, password);

    if (!result.success) {
      logger.warn({ username }, "Failed login attempt");
      return res.status(401).json({ message: result.message });
    }

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

    logger.info({ username }, "Account created");

    res.status(201).json(result);
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
};
