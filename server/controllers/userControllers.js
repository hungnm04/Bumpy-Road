const jwt = require("jsonwebtoken");
const userService = require("../services/users");

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
    const accessToken = jwt.sign(
      { username: user.username, role: user.user_role },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    const refreshToken = jwt.sign(
      { username: user.username, role: user.user_role },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "7d" }
    );

    // Set tokens in HTTP-only cookies
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: true,
      maxAge: 15 * 60 * 1000,
      sameSite: "none",
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: "none",
    });

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
    const user = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    // Generate new access token
    const accessToken = jwt.sign(
      { username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    // Set new access token in cookie
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 15 * 60 * 1000,
      sameSite: "Strict",
    });

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

  if (!accessToken) {
    return res.status(200).json({ authenticated: false });
  }

  jwt.verify(accessToken, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(200).json({ authenticated: false });
    }
    res.status(200).json({
      authenticated: true,
      user: {
        username: user.username,
        role: user.role,
      },
    });
  });
};

const logout = (req, res) => {
  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");
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
