const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");

// Remove debug middleware

// Mountains endpoints
router.post(
  "/upload-photo",
  adminController.upload.single("photo"),
  adminController.uploadPhoto
);
router.post("/mountains", express.json(), adminController.addMountain);
router.get("/mountains", adminController.getAllMountains);
router.get("/mountains/:id", adminController.getMountainById);
router.put("/mountains/:id", express.json(), adminController.updateMountain);
router.delete("/mountains/:id", adminController.deleteMountain);

// Other admin routes
router.get("/total-locations", adminController.getTotalLocations);
router.get("/active-users", adminController.getActiveUsers);
router.get("/users", adminController.getAllUsers);

// Add these new routes before the error handling middleware
router.post("/users", express.json(), adminController.addUser);
router.delete("/users/:username", adminController.deleteUser);
router.put("/users/:username", express.json(), adminController.updateUser);
router.get("/users/:username", adminController.getUserById);

// Error handling for this router
router.use((err, req, res, _next) => {
  console.error("Admin route error:", err);
  res.status(500).json({
    success: false,
    message: err.message || "Admin route error",
  });
});

module.exports = router;
