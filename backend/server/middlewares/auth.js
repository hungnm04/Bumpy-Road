const jwt = require("jsonwebtoken");
const pool = require("../config/db");
const logger = require("../utils/logger");

const requireEnvSecret = (name) => {
  const value = process.env[name];
  if (!value || value.length < 32) {
    throw new Error(`${name} must be set to at least 32 characters`);
  }
  return value;
};

const authenticateJWT = (req, res, next) => {
  const accessToken = req.cookies.accessToken;

  if (!accessToken) {
    return res.status(401).json({ message: "Access token missing, please log in" });
  }

  jwt.verify(accessToken, requireEnvSecret("JWT_SECRET"), (err, user) => {
    if (err) {
      if (err.name === "TokenExpiredError") {
        logger.info({ username: req.user?.username }, "Access token expired");
        return res.status(401).json({ message: "Access token expired" });
      } else {
        logger.warn({ err: err.message }, "Invalid access token");
        return res.status(403).json({ message: "Invalid access token" });
      }
    }
    req.user = user;
    next();
  });
};

// Centralized RBAC middleware - use this on every protected route
const requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    logger.warn({ username: req.user?.username, roles: req.user?.role, required: roles }, "Unauthorized role access attempt");
    return res.status(403).json({ message: "Forbidden" });
  }
  next();
};

// Ownership check middleware - prevents IDOR attacks
const checkOwnership = (resourceType) => async (req, res, next) => {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ message: "Authentication required" });
  }

  // Admins can access everything
  if (user.role === "admin") {
    return next();
  }

  const resourceId = req.params.id || req.params.username;
  if (!resourceId) {
    return next(); // No ownership check needed
  }

  try {
    let isOwner = false;

    switch (resourceType) {
      case "user":
        // Users can only modify their own profile
        isOwner = user.username === resourceId;
        break;

      case "review":
        // Users can only modify their own reviews
        const reviewResult = await pool.query(
          "SELECT username FROM reviews WHERE id = $1",
          [resourceId]
        );
        isOwner = reviewResult.rows.length > 0 && reviewResult.rows[0].username === user.username;
        break;

      case "blog":
        // Users can only modify their own blogs
        const blogResult = await pool.query(
          "SELECT author_username FROM blogs WHERE id = $1",
          [resourceId]
        );
        isOwner = blogResult.rows.length > 0 && blogResult.rows[0].author_username === user.username;
        break;

      default:
        // Default: deny if resourceType not recognized
        logger.warn({ resourceType, resourceId }, "Unknown resource type for ownership check");
        return res.status(403).json({ message: "Forbidden" });
    }

    if (!isOwner) {
      logger.warn({ username: user.username, resourceType, resourceId }, "IDOR attempt blocked");
      return res.status(403).json({ message: "Forbidden" });
    }

    next();
  } catch (error) {
    logger.error({ err: error }, "Ownership check failed");
    return res.status(500).json({ message: "Authorization check failed" });
  }
};

// Validate refresh token and check revocation list
const validateRefreshToken = async (token) => {
  try {
    const decoded = jwt.verify(token, requireEnvSecret("JWT_REFRESH_SECRET"));

    // Check if token has been revoked
    const revokedResult = await pool.query(
      "SELECT 1 FROM revoked_refresh_tokens WHERE token_jti = $1 AND expires_at > NOW()",
      [decoded.jti]
    );

    if (revokedResult.rows.length > 0) {
      return { valid: false, reason: "Token has been revoked" };
    }

    return { valid: true, user: decoded };
  } catch (error) {
    return { valid: false, reason: error.message };
  }
};

// Revoke a refresh token (add to revocation list)
const revokeRefreshToken = async (token) => {
  try {
    const decoded = jwt.decode(token);
    if (!decoded || !decoded.exp || !decoded.jti) {
      return false;
    }

    // Calculate expiration timestamp
    const expiresAt = new Date(decoded.exp * 1000);

    await pool.query(
      `INSERT INTO revoked_refresh_tokens (token_jti, expires_at)
       VALUES ($1, $2)
       ON CONFLICT (token_jti) DO NOTHING`,
      [decoded.jti, expiresAt]
    );

    logger.info({ jti: decoded.jti }, "Refresh token revoked");
    return true;
  } catch (error) {
    logger.error({ err: error }, "Failed to revoke refresh token");
    return false;
  }
};

// Generate a unique token ID (jti)
const generateTokenId = () => {
  const { randomBytes } = require("crypto");
  return randomBytes(16).toString("hex");
};

module.exports = {
  authenticateJWT,
  requireRole,
  checkOwnership,
  validateRefreshToken,
  revokeRefreshToken,
  generateTokenId,
  requireEnvSecret,
};
