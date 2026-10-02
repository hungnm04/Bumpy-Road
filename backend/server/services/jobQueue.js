// ponytail: DB-backed job queue — no new deps, works with existing PostgreSQL
// Upgrade path: Redis/BullMQ when job volume justifies it

const pool = require("../config/db");
const logger = require("../utils/logger");

const JOB_STATUS = { PENDING: "pending", RUNNING: "running", COMPLETED: "completed", FAILED: "failed" };
const JOB_TYPE = { INGESTION: "ingestion" };

// ponytail: activeJobs map is per-process. Valid for single-instance.
// Multi-instance: replace with Redis/BullMQ.

// ---- Enqueue a job — saved as PENDING first, claimed when worker picks it up ----
async function enqueue(type, payload = {}) {
  const { rows } = await pool.query(
    `INSERT INTO ingestion_runs (provider, mode, status)
     VALUES ($1, $2, $3)
     RETURNING id, started_at`,
    [type, payload.mode || "full", JOB_STATUS.PENDING]
  );
  return rows[0].id;
}

// ---- Worker claims a PENDING job — prevents stale jobs from blocking new work ----
async function claimJob(provider = "wikidata") {
  const { rows } = await pool.query(`
    UPDATE ingestion_runs
    SET status = $1
    WHERE id = (
      SELECT id FROM ingestion_runs
      WHERE provider = $2 AND status = $3
      ORDER BY started_at ASC
      LIMIT 1
      FOR UPDATE SKIP LOCKED
    )
    RETURNING id, mode, started_at
  `, [JOB_STATUS.RUNNING, provider, JOB_STATUS.PENDING]);
  return rows[0] || null;
}

// ---- Mark job complete ----
async function completeJob(runId, status, counts, errorCount, summary = {}) {
  await pool.query(
    `UPDATE ingestion_runs
     SET status = $2, fetched_count = $3, staged_count = $4,
         updated_count = $5, error_count = $6, summary = $7,
         completed_at = CURRENT_TIMESTAMP
     WHERE id = $1`,
    [runId, status, counts.fetched || 0, counts.staged || 0, counts.updated || 0, errorCount || 0, JSON.stringify(summary)]
  );
}

// ---- Get job status ----
async function getJobStatus(runId) {
  const { rows } = await pool.query(
    `SELECT id, provider, mode, status, fetched_count, staged_count,
            updated_count, error_count, summary, started_at, completed_at
     FROM ingestion_runs WHERE id = $1`,
    [runId]
  );
  return rows[0] || null;
}

// ---- Clean up stale RUNNING jobs from crashed processes on startup ----
async function cleanupStaleJobs(maxAgeMinutes = 30) {
  const { rows } = await pool.query(`
    UPDATE ingestion_runs
    SET status = $1, completed_at = CURRENT_TIMESTAMP,
        summary = jsonb_set(COALESCE(summary, '{}'), '{error}',
          '"Worker process terminated before completion"')
    WHERE status = $2
      AND started_at < NOW() - ($3 || ' minutes')::interval
    RETURNING id
  `, [JOB_STATUS.FAILED, JOB_STATUS.RUNNING, maxAgeMinutes]);
  if (rows.length > 0) {
    logger.warn({ count: rows.length }, "Cleaned up stale ingestion jobs");
  }
  return rows.length;
}

// ---- Fire-and-forget worker ----
// The HTTP handler calls this — work runs async, HTTP response returns immediately.
// ponytail: single-process worker. For multi-instance: replace with BullMQ.
function runBackground(jobId, fn) {
  setImmediate(() => {
    fn(jobId).catch((err) => {
      logger.error({ err, jobId }, "Background job failed");
    });
  });
}

module.exports = { enqueue, claimJob, completeJob, getJobStatus, cleanupStaleJobs, runBackground, JOB_STATUS, JOB_TYPE };
