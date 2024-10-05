const { testLogin, createUser, updateUserProfile, getUserByUsername} = require("../services/users")
const jwt = require("jsonwebtoken");
require("dotenv").config();

const login = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required" });
  }

  try {
    const loginResult = await testLogin(username, password);

    if (loginResult.success) {
      res.status(200).json({ 
        message: loginResult.message,
        role: loginResult.role,
        token: loginResult.token 
      });
    } else {
      res.status(401).json({ message: loginResult.message });
    }
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ message: "An error occurred during login" });
  }
};

const createAccount = async (req, res) => {
  const { username, password, email } = req.body;

  if (!username || !password || !email) {
    return res.status(400).json({ message: "Username, email, and password are required" });
  }

  try {
    const result = await createUser(username, password, email); 

    if (result.success) {
      res.status(201).json({ message: result.message });
    } else {
      res.status(400).json({ message: result.message });
    }
  } catch (error) {
    console.error("Error during registration:", error);
    res.status(500).json({ message: "An error occurred during registration" });
  }
};

const getProfile = async (req, res) => {
  if (!req.headers.authorization) {
    return res.status(401).json({ message: "No authorization token provided" });
  }

  try {
    const token = req.headers.authorization.split(" ")[1];
    const decoded = jwt.verify(token, process.env.SECRET_KEY);

    const user = await getUserByUsername(decoded.username);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      username: user.username,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      bio: user.bio,
    });


  } catch (error) {
    console.error("Error decoding JWT token:", error);
    res.status(401).json({ message: "Invalid authorization token" });
  }
};

const updateProfile = async (req, res) => {
  if (!req.headers.authorization) {
    return res.status(401).json({ message: "No authorization token provided" });
  }

  try {
    const token = req.headers.authorization.split(" ")[1];
    const decoded = jwt.verify(token, process.env.SECRET_KEY);

    // Get the current user data
    const currentUser = await getUserByUsername(decoded.username);
    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Prepare the update object with only the provided fields
    const updatedProfileData = {};
    if (req.body) {
      if (req.body.email) updatedProfileData.email = req.body.email;
      if (req.body.first_name) updatedProfileData.first_name = req.body.first_name;
      if (req.body.last_name) updatedProfileData.last_name = req.body.last_name;
      if (req.body.bio) updatedProfileData.bio = req.body.bio;
    }

    // If no fields to update, return current profile
    if (Object.keys(updatedProfileData).length === 0) {
      return res.status(200).json({
        name: currentUser.username,
        email: currentUser.email,
        first_name: currentUser.first_name,
        last_name: currentUser.last_name,
        bio: currentUser.bio
      });
    }

    const userProfileData = {
      updatedProfileData,
      oldUsername: decoded.username,
    };

    const updatedProfile = await updateUserProfile(userProfileData);

    if (!updatedProfile) {
      return res.status(500).json({ message: "Failed to update profile" });
    }

    res.status(200).json({
      name: decoded.username,
      email: updatedProfile.email || currentUser.email,
      first_name: updatedProfile.first_name || currentUser.first_name,
      last_name: updatedProfile.last_name || currentUser.last_name,
      bio: updatedProfile.bio || currentUser.bio
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ message: error.message });
  }
};


module.exports = { login, createAccount, getProfile, updateProfile };
