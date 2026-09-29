const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const auditLog = require("../services/auditLog");

// Remove debug middleware

// Audit log
router.get("/audit-log", async (req, res) => {
  try {
    const { limit, offset, actor, resource_type } = req.query;
    const result = await auditLog.getAuditLog({
      limit: limit ? Number(limit) : 50,
      offset: offset ? Number(offset) : 0,
      actor,
      resourceType: resource_type,
    });
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch audit log" });
  }
});

// Mountains endpoints
router.get("/ingestion/runs", adminController.getIngestionRuns);
router.get("/ingestion/candidates", adminController.getIngestionCandidates);
router.post("/ingestion/candidates/bulk-publish", express.json(), adminController.bulkPublishIngestionCandidates);
router.post("/ingestion/candidates/:id/publish", express.json(), adminController.publishIngestionCandidate);
router.post("/ingestion/candidates/:id/reject", adminController.rejectIngestionCandidate);

router.post(
  "/upload-photo",
  adminController.upload.single("photo"),
  adminController.verifyUploadedImage,
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
