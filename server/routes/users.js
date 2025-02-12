const express = require("express");
const router = express.Router();
const { upload } = require("../middlewares/uploadMiddleware");
const { authenticateToken } = require("../middlewares/auth");
const { updateUserProfile } = require("../services/users");

router.put(
  "/profile",
  authenticateToken,
  upload.single("avatar"),
  async (req, res) => {
    try {
      const username = req.user.username;
      const updatedData = {
        ...req.body,
        avatar_url: req.file ? `/uploads/${req.file.filename}` : undefined,
      };

      const updatedProfile = await updateUserProfile(username, updatedData);
      res.json({ success: true, profile: updatedProfile });
    } catch (error) {
      console.error("Profile update error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

module.exports = router;
