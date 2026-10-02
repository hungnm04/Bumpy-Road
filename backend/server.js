require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");
const http = require("http");
const helmet = require("helmet");
const pool = require("./server/config/db");
const setupStorage = require("./server/config/setupStorage");
const setupDefaultAvatar = require("./server/config/setupDefaultAvatar");
const logger = require("./server/utils/logger");
const jobQueue = require("./server/services/jobQueue");

// Import controllers
const userController = require("./server/controllers/userControllers");
const faqController = require("./server/controllers/faqController");
const mountainController = require("./server/controllers/mountainControllers");
const weatherWindowController = require("./server/controllers/weatherWindowController");
const reviewController = require("./server/controllers/reviewControllers");
const adminRoutes = require("./server/routes/adminRoutes");
const blogRoutes = require("./server/routes/blogRoutes");

// Import rate limiter
const { checkRateLimit } = require("./server/services/rateLimiter");

// Import middlewares
const { authenticateJWT, requireRole, requireEnvSecret, checkOwnership } = require("./server/middlewares/auth");
const { handleFileUpload } = require("./server/middlewares/uploadMiddleware");

const app = express();
const PORT = process.env.PORT || 5000;
const server = http.createServer(app);
const isProduction = process.env.NODE_ENV === "production";

const defaultClientOrigins = isProduction
  ? ""
  : "http://localhost:5000,http://localhost:5173,http://127.0.0.1:5173";

const allowedOrigins = (process.env.CLIENT_ORIGINS || defaultClientOrigins)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const requireEnv = (name) => {
  if (!process.env[name]) {
    throw new Error(`${name} must be set`);
  }
};

if (isProduction) {
  requireEnvSecret("JWT_SECRET");
  requireEnvSecret("JWT_REFRESH_SECRET");
  requireEnv("CLIENT_ORIGINS");

  if (!process.env.DATABASE_URL) {
    ["DB_USER", "DB_HOST", "DB_NAME", "DB_PASSWORD"].forEach(requireEnv);
  }

  if (allowedOrigins.length === 0) {
    throw new Error("CLIENT_ORIGINS must contain at least one origin in production");
  }
}

setupStorage();
setupDefaultAvatar().catch((error) => {
  logger.error({ err: error }, "Default avatar setup failed");
});

// Clean up any jobs left in RUNNING state by a crashed previous process
jobQueue.cleanupStaleJobs(30).catch((err) => {
  logger.warn({ err }, "Stale job cleanup skipped");
});

// Custom Helmet CSP - explicit, listing every third-party origin
const cspDirectives = {
  defaultSrc: ["'self'"],
  scriptSrc: ["'self'"],
  styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
  imgSrc: [
    "'self'",
    "data:",
    "https:",
    "blob:",
    // Third-party image sources
    "https://upload.wikimedia.org",       // Wikimedia Commons
    "https://*.wikimedia.org",            // Wikidata/Wikimedia
    "https://images.unsplash.com",        // Unsplash
    "https://*.unsplash.com",            // Unsplash CDN
    "https://*.pexels.com",              // Pexels
    "https://*.pexelsmedia.com",         // Pexels media
  ],
  fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
  connectSrc: [
    "'self'",
    "ws:",
    "wss:",
    // Third-party API endpoints
    "https://query.wikidata.org",         // Wikidata SPARQL
    "https://www.wikidata.org",            // Wikidata API
    "https://commons.wikimedia.org",       // Wikimedia Commons
    "https://api.open-meteo.com",         // Weather API
    "https://*.open-meteo.com",           // Weather API
  ],
  objectSrc: ["'none'"],
  baseUri: ["'self'"],
  frameAncestors: ["'none'"],
  formAction: ["'self'"],
  frameSrc: ["'none'"],
  workerSrc: ["'self'", "blob:"],
  mediaSrc: ["'self'", "https:", "blob:"],
};

app.use(helmet({
  contentSecurityPolicy: {
    directives: cspDirectives,
  },
  crossOriginEmbedderPolicy: false,
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  permissionsPolicy: {
    camera: [], microphone: [], geolocation: [], interestCohort: [],
  },
}));

app.set("trust proxy", 1);

// Force HTTPS in production
app.use((req, res, next) => {
  if (isProduction && req.headers["x-forwarded-proto"] === "http") {
    return res.redirect(301, `https://${req.headers.host}${req.originalUrl}`);
  }
  next();
});

// Body parsing
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false, limit: "1mb" }));

// CORS - locked to exact frontend origins (not wildcard)
app.use(
  cors({
    origin(origin, callback) {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) {
        return callback(null, true);
      }
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      logger.warn({ origin, allowedOrigins }, "CORS rejected origin");
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Accept", "Authorization"],
  })
);

app.use(cookieParser());

// Trusted origin check for mutations in production
app.use((req, res, next) => {
  if (!isProduction || !["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
    return next();
  }

  const source = req.headers.origin || req.headers.referer;
  if (!source) {
    return res.status(403).json({ message: "Missing request origin" });
  }

  try {
    const requestOrigin = new URL(source).origin;
    if (allowedOrigins.includes(requestOrigin)) {
      return next();
    }
  } catch {
    return res.status(403).json({ message: "Invalid request origin" });
  }

  return res.status(403).json({ message: "Untrusted request origin" });
});

// Initialize Socket.IO before routes
require("./server/config/socket").init(server);

// Health check
app.get("/healthz", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.status(200).json({ status: "ok" });
  } catch {
    res.status(503).json({ status: "error" });
  }
});

// Security.txt — RFC 9116
app.get("/.well-known/security.txt", (req, res) => {
  res.set("Content-Type", "text/plain");
  res.send(
    "Contact: mailto:security@" + (process.env.ADMIN_EMAIL?.replace("admin@", "") || "bumpyroad.example.com") + "\n" +
    "Expires: " + new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toUTCString() + "\n" +
    "Preferred-Languages: en\n" +
    "Policy: https://" + (process.env.CLIENT_ORIGINS?.split(",")[0] || "bumpyroad.example.com") + "/security\n" +
    "Hiring: https://" + (process.env.CLIENT_ORIGINS?.split(",")[0] || "bumpyroad.example.com") + "/about\n"
  );
});

app.get("/security.txt", (req, res) => {
  res.redirect(301, "/.well-known/security.txt");
});

// Serve static files BEFORE routes
app.use(express.static(path.join(__dirname, "dist"), { index: false }));
app.use("/storage", express.static(path.join(__dirname, "storage")));

// Rate limiting middleware
const AUTH_MAX_ATTEMPTS = 25;
const REFRESH_MAX_ATTEMPTS = 50;

const rateLimitAuth = async (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress || "unknown";
  const result = await checkRateLimit(ip, "auth");
  res.set("X-RateLimit-Limit", String(AUTH_MAX_ATTEMPTS));
  res.set("X-RateLimit-Remaining", String(result.remaining));
  res.set("X-RateLimit-Reset", String(Math.floor(result.resetAt / 1000)));
  if (!result.allowed) {
    logger.warn({ ip }, "Auth rate limit exceeded");
    return res.status(429).json({
      message: "Too many requests. Please wait before trying again.",
      retryAfter: Math.ceil((result.resetAt - Date.now()) / 1000),
    });
  }
  next();
};

const rateLimitRefresh = async (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress || "unknown";
  const result = await checkRateLimit(ip, "refresh");
  res.set("X-RateLimit-Limit", String(REFRESH_MAX_ATTEMPTS));
  res.set("X-RateLimit-Remaining", String(result.remaining));
  res.set("X-RateLimit-Reset", String(Math.floor(result.resetAt / 1000)));
  if (!result.allowed) {
    return res.status(429).json({
      message: "Too many token refresh requests.",
      retryAfter: Math.ceil((result.resetAt - Date.now()) / 1000),
    });
  }
  next();
};

// Auth routes
app.post("/login", rateLimitAuth, userController.login);
app.post("/create-account", rateLimitAuth, userController.createAccount);
app.get("/auth-status", userController.authStatus);
app.get("/verify-email", userController.verifyEmail);
app.post("/logout", authenticateJWT, userController.logout);
app.post("/refresh-token", rateLimitRefresh, userController.refreshToken);

// Profile routes - with ownership check
app.get("/profile", authenticateJWT, userController.getProfile);
app.put("/profile", authenticateJWT, userController.updateProfile);
app.post("/upload-avatar", authenticateJWT, handleFileUpload, userController.uploadAvatar);

// Mountain routes
app.get("/places", mountainController.getPlaces);
app.get("/places/:id", mountainController.getMountainsById);
app.get("/featured-places", mountainController.getFeaturedPlaces);
app.get("/api/weather-window", weatherWindowController.getWeatherWindow);
app.get("/api/places/:id/conditions", weatherWindowController.getConditions);

// Review routes - with ownership check for submission
app.get("/mountains/:mountainId/reviews", reviewController.fetchReviews);
app.post("/mountains/:mountainId/reviews", authenticateJWT, reviewController.submitReview);

// Admin routes - centralized RBAC
app.use("/admin", authenticateJWT, requireRole("admin"), adminRoutes);

// FAQ route
app.post("/faq", faqController.submitFaqForm);

// Notification routes - centralized RBAC
app.use("/notifications", authenticateJWT, requireRole("admin"), require("./server/routes/notificationRoutes"));

// Blog routes
app.use("/api/blog", blogRoutes);

// Catch-all for SPA
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

// Error handling
app.use((err, req, res, _next) => {
  logger.error({ err, method: req.method, path: req.path }, "Server error");
  res.status(err.status || 500).json({
    success: false,
    message: isProduction ? "Internal server error" : err.message,
  });
});

// Start server
server.listen(PORT, () => {
  logger.info({ port: PORT }, "Server started");
});
