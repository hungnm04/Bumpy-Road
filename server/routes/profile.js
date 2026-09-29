const express = require("express");
const router = express.Router();
const { handleFileUpload } = require("../middlewares/uploadMiddleware");
const { authenticateJWT } = require("../middlewares/auth");
const userController = require("../controllers/userControllers");

router.get("/", authenticateJWT, userController.getProfile);
router.put("/", authenticateJWT, userController.updateProfile);
router.post("/upload-avatar", authenticateJWT, handleFileUpload, userController.uploadAvatar);

module.exports = router;
