const express = require("express");
const router = express.Router();
const { handleFileUpload } = require("../middlewares/uploadMiddleware");
const { authenticateToken } = require("../middlewares/auth");
const userController = require("../controllers/userControllers");

router.get("/profile", authenticateToken, userController.getProfile);
router.put("/profile", authenticateToken, userController.updateProfile);
router.post(
  "/upload-avatar",
  authenticateToken,
  handleFileUpload,
  userController.uploadAvatar
);

module.exports = router;
