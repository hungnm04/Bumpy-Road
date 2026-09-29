// Admin audit logging — immutable trail of privileged actions
// Every mutation by an admin is logged with actor, resource, and context

const pool = require("../config/db");
const logger = require("../utils/logger");

/**
 * Log an admin action. Parameters intentionally separate to enforce structured logging.
 * @param {Object} opts
 * @param {string} opts.actorUsername - who did it
 * @param {string} opts.action - what they did (e.g. 'delete_destination', 'update_user_role')
 * @param {string} [opts.resourceType] - e.g. 'mountain', 'user', 'blog', 'notification'
 * @param {string|number} [opts.resourceId] - the affected resource's ID or slug
 * @param {Object} [opts.details] - extra context (before/after state hashes, counts, etc.)
 * @param {string} [opts.ipAddress] - request IP
 * @param {string} [opts.userAgent] - request user agent
 */
async function logAdminAction({ actorUsername, action, resourceType, resourceId, details = {}, ipAddress, userAgent }) {
  try {
    await pool.query(`
      INSERT INTO admin_audit_log (actor_username, action, resource_type, resource_id, details, ip_address, user_agent)
      VALUES ($1, $2, $3, $4, $5, $6::inet, $7)
    `, [
      actorUsername,
      action,
      resourceType || null,
      resourceId ? String(resourceId) : null,
      JSON.stringify(details),
      ipAddress || null,
      userAgent || null,
    ]);
  } catch (error) {
    // Audit log failures should NOT block the action — log to stderr and continue
    logger.error({ err: error, actorUsername, action, resourceType, resourceId }, "Audit log write failed");
  }
}

// ---- Convenience wrappers for common admin actions ----

async function logDestinationAction(actorUsername, action, mountainId, details = {}, req = {}) {
  await logAdminAction({
    actorUsername,
    action,
    resourceType: "mountain",
    resourceId: mountainId,
    details,
    ipAddress: req.ip || req.headers?.["x-forwarded-for"] || null,
    userAgent: req.headers?.["user-agent"] || null,
  });
}

async function logUserAction(actorUsername, action, targetUsername, details = {}, req = {}) {
  await logAdminAction({
    actorUsername,
    action,
    resourceType: "user",
    resourceId: targetUsername,
    details,
    ipAddress: req.ip || req.headers?.["x-forwarded-for"] || null,
    userAgent: req.headers?.["user-agent"] || null,
  });
}

async function logBlogAction(actorUsername, action, blogId, details = {}, req = {}) {
  await logAdminAction({
    actorUsername,
    action,
    resourceType: "blog",
    resourceId: blogId,
    details,
    ipAddress: req.ip || req.headers?.["x-forwarded-for"] || null,
    userAgent: req.headers?.["user-agent"] || null,
  });
}

async function logRoleChange(actorUsername, targetUsername, newRole, reason = null, req = {}) {
  await logAdminAction({
    actorUsername,
    action: newRole === "admin" ? "promote_to_admin" : "demote_to_guest",
    resourceType: "user",
    resourceId: targetUsername,
    details: { reason, previous_role: newRole === "admin" ? "guest" : "admin" },
    ipAddress: req.ip || null,
    userAgent: req.headers?.["user-agent"] || null,
  });
}

/**
 * Fetch recent audit log entries — for the admin dashboard
 */
async function getAuditLog({ limit = 50, offset = 0, actor, resourceType } = {}) {
  const conditions = [];
  const params = [];
  let paramIndex = 1;

  if (actor) {
    conditions.push(`actor_username = $${paramIndex++}`);
    params.push(actor);
  }
  if (resourceType) {
    conditions.push(`resource_type = $${paramIndex++}`);
    params.push(resourceType);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const { rows } = await pool.query(`
    SELECT
      id, actor_username, action, resource_type, resource_id,
      details, ip_address, user_agent, created_at
    FROM admin_audit_log
    ${where}
    ORDER BY created_at DESC
    LIMIT $${paramIndex++} OFFSET $${paramIndex}
  `, [...params, limit, offset]);

  const countResult = await pool.query(`
    SELECT COUNT(*) as total FROM admin_audit_log ${where}
  `, params);

  return {
    entries: rows,
    total: Number(countResult.rows[0].total),
    limit,
    offset,
  };
}

module.exports = {
  logAdminAction,
  logDestinationAction,
  logUserAction,
  logBlogAction,
  logRoleChange,
  getAuditLog,
};
