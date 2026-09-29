const jwt = require("jsonwebtoken");
const userService = require("../services/users");
const { requireEnvSecret } = require("../middlewares/auth");

const isProduction = process.env.NODE_ENV === "production";

const authCookieOptions = (maxAge) => ({
  httpOnly: true,
  secure: isProduction,
  maxAge,
  sameSite: "lax",
});

const createAccessToken = (user) =>
  jwt.sign(
    { username: user.username, role: user.role || user.user_role },
    requireEnvSecret("JWT_SECRET"),
    { expiresIn: "15m" }
  );

const createRefreshToken = (user) =>
  jwt.sign(
    { username: user.username, role: user.role || user.user_role },
    requireEnvSecret("JWT_REFRESH_SECRET"),
    { expiresIn: "7d" }
  );

const login = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required" });
  }

  try {
    const result = await userService.verifyLogin(username, password);

    if (!result.success) {
      return res.status(401).json({ message: result.message });
    }

    const user = result.user;

    // Generate tokens
    const accessToken = createAccessToken(user);
    const refreshToken = createRefreshToken(user);

    // Set tokens in HTTP-only cookies
    res.cookie("accessToken", accessToken, authCookieOptions(15 * 60 * 1000));
    res.cookie("refreshToken", refreshToken, authCookieOptions(7 * 24 * 60 * 60 * 1000));

    res.status(200).json({
      success: true,
      message: "Login successful",
      user: {
        username: user.username,
        role: user.user_role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "An error occurred during login" });
  }
};

const createAccount = async (req, res) => {
  const { username, password, email, first_name, last_name, bio } = req.body;

  if (!username || !password || !email) {
    return res.status(400).json({
      success: false,
      message: "Username, email, and password are required",
    });
  }

  try {
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

    res.status(201).json(result);
  } catch {
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
    console.error("Error fetching user profile:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while fetching user profile",
    });
  }
};

const updateProfile = async (req, res) => {
  const username = req.user.username;
  const { first_name, last_name, email, bio } = req.body;

  try {
    const updatedProfile = await userService.updateUserProfile(username, {
      first_name,
      last_name,
      email,
      bio,
    });

    res.status(200).json({
      success: true,
      profile: updatedProfile,
    });
  } catch (error) {
    console.error("Error updating user profile:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while updating user profile",
    });
  }
};

const refreshToken = (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({ message: "Refresh token not found, please log in again" });
  }

  try {
    // Verify refresh token
    const user = jwt.verify(refreshToken, requireEnvSecret("JWT_REFRESH_SECRET"));

    // Generate new access token
    const accessToken = createAccessToken(user);

    // Set new access token in cookie
    res.cookie("accessToken", accessToken, authCookieOptions(15 * 60 * 1000));

    res.status(200).json({ success: true, message: "Access token refreshed" });
  } catch (error) {
    console.error("Refresh token error:", error);
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
    console.error("Avatar upload error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update profile picture",
    });
  }
};

const authStatus = (req, res) => {
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
      res.clearCookie("accessToken", authCookieOptions(0));
    }
  }

  const refreshTokenCookie = req.cookies.refreshToken;

  if (!refreshTokenCookie) {
    return res.status(200).json({ authenticated: false });
  }

  try {
    const user = jwt.verify(refreshTokenCookie, requireEnvSecret("JWT_REFRESH_SECRET"));
    res.cookie("accessToken", createAccessToken(user), authCookieOptions(15 * 60 * 1000));
    return res.status(200).json({
      authenticated: true,
      user: {
        username: user.username,
        role: user.role,
      },
    });
  } catch {
    res.clearCookie("refreshToken", authCookieOptions(0));
    return res.status(200).json({ authenticated: false });
  }
};

const logout = (req, res) => {
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
