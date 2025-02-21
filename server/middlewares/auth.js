// server/middlewares/auth.js

const jwt = require("jsonwebtoken");

const authenticateJWT = (req, res, next) => {
  const accessToken = req.cookies.accessToken;

  if (!accessToken) {
    return res.status(401).json({ message: "Access token missing, please log in" });
  }

  jwt.verify(accessToken, process.env.JWT_SECRET, (err, user) => {
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

module.exports = { authenticateJWT };
