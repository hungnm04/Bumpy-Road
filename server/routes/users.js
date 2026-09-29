const express = require("express");
const router = express.Router();
const { authenticateJWT } = require("../middlewares/auth");
const userController = require("../controllers/userControllers");

router.get("/profile", authenticateJWT, userController.getProfile);
router.put("/profile", authenticateJWT, userController.updateProfile);

module.exports = router;
