const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const auditLog = require("../services/auditLog");
const logger = require("../utils/logger");

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

// Async job triggers — return immediately, work runs in background
router.post("/jobs/ingest", async (req, res) => {
  const { jobQueue } = require("../services/jobQueue");
  const { discoverDestinations, refreshExistingDestinations } = require("../ingestion/wikidata");
  const { getCommonsMedia } = require("../ingestion/wikimedia");
  const catalogRepo = require("../ingestion/catalogRepository");

  try {
    // Enqueue as PENDING — worker will claim it
    const jobId = await jobQueue.enqueue("wikidata", { mode: req.body.mode || "full" });

    // Fire-and-forget — response goes back immediately
    jobQueue.runBackground(jobId, async (claimedId) => {
      const counts = { fetched: 0, staged: 0, updated: 0 };
      let errorCount = 0;
      try {
        // claimJob uses FOR UPDATE SKIP LOCKED — safe for concurrent workers
        const claimed = await jobQueue.claimJob("wikidata");
        if (!claimed) {
          logger.info({ jobId: claimedId }, "No pending ingestion job found — skipping");
          return;
        }

        const destinations = await discoverDestinations(100, 20);
        for (const dest of destinations) {
          try {
            const media = dest.coordinate ? await getCommonsMedia(dest.coordinate.lat, dest.coordinate.lon) : [];
            const { upserted, updated } = await catalogRepo.upsertDestination(dest, media);
            if (upserted) counts.fetched++;
            if (updated) counts.updated++;
          } catch (e) {
            errorCount++;
          }
        }
        await jobQueue.completeJob(claimed.id, "completed", counts, errorCount);
      } catch (err) {
        logger.error({ err, jobId: claimedId }, "Ingestion job failed");
        await jobQueue.completeJob(claimedId, "failed", counts, errorCount, { error: err.message });
      }
    });

    res.status(202).json({ jobId, status: "accepted", message: "Ingestion job started" });
  } catch (error) {
    res.status(500).json({ message: "Failed to start ingestion: " + error.message });
  }
});

router.get("/jobs/:id", async (req, res) => {
  const { jobQueue } = require("../services/jobQueue");
  const job = await jobQueue.getJobStatus(Number(req.params.id));
  if (!job) return res.status(404).json({ message: "Job not found" });
  res.json(job);
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
