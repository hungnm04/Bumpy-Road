require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");
const http = require("http");

// Import controllers
const userController = require("./server/controllers/userControllers");
const faqController = require("./server/controllers/faqController");
const mountainController = require("./server/controllers/mountainControllers");
const reviewController = require("./server/controllers/reviewControllers");
const adminRoutes = require("./server/routes/adminRoutes");

// Import middlewares
const { authenticateJWT } = require("./server/middlewares/auth");
const { handleFileUpload } = require("./server/middlewares/uploadMiddleware");

const app = express();
const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

// Initialize Socket.IO before routes
require("./server/config/socket").init(server);

// Middleware setup
app.use(bodyParser.json());
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(cookieParser());

// Serve static files BEFORE routes
app.use("/storage", express.static(path.join(__dirname, "storage")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(
  "/src/assets/mountain_photos",
  express.static(path.join(__dirname, "src/assets/mountain_photos"))
);

// Auth routes
app.post("/login", userController.login);
app.post("/create-account", userController.createAccount);
app.get("/auth-status", userController.authStatus);
app.post("/logout", authenticateJWT, userController.logout);
app.post("/refresh-token", userController.refreshToken);

// Profile routes
app.get("/profile", authenticateJWT, userController.getProfile);
app.put("/profile", authenticateJWT, userController.updateProfile);
app.post(
  "/upload-avatar",
  authenticateJWT,
  handleFileUpload,
  userController.uploadAvatar
);

// Mountain routes
app.get("/places", mountainController.getPlaces);
app.get("/places/:id", mountainController.getMountainsById);
app.get("/featured-places", mountainController.getFeaturedPlaces);

// Review routes
app.get("/mountains/:mountainId/reviews", reviewController.fetchReviews);
app.post(
  "/mountains/:mountainId/reviews",
  authenticateJWT,
  reviewController.submitReview
);

// Admin routes
app.use("/admin", authenticateJWT, adminRoutes);

// FAQ route
app.post("/faq", faqController.submitFaqForm);

// Add notification routes
app.use(
  "/notifications",
  authenticateJWT,
  require("./server/routes/notificationRoutes")
);

// Error handling
app.use((err, req, res, _next) => {
  res.status(500).json({
    success: false,
    message: "Internal Server Error",
  });
});

// Start server using the http server instance
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
