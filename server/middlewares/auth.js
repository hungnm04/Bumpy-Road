// server/middlewares/auth.js

const jwt = require("jsonwebtoken");

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
        return res.status(401).json({ message: "Access token expired" });
      } else {
        return res.status(403).json({ message: "Invalid access token" });
      }
    }
    req.user = user;
    next();
  });
};

const requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ message: "Forbidden" });
  }
  next();
};

module.exports = { authenticateJWT, requireRole, requireEnvSecret };
