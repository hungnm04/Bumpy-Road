const adminService = require("../services/adminService");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const sharp = require("sharp");
const crypto = require("crypto");

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, "../../storage/mountain-photos");
    // Ensure directory exists
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const timestamp = Date.now();
    const token = crypto.randomBytes(8).toString("hex");
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `mountain_${timestamp}_${token}${ext}`);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5000000 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
    const allowedExtensions = new Set([".jpeg", ".jpg", ".png", ".webp"]);
    const extname = allowedExtensions.has(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.has(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error("Only JPEG, PNG, and WebP images are allowed"));
  },
});

const verifyUploadedImage = async (req, res, next) => {
  if (!req.file) return next();

  try {
    await sharp(req.file.path).metadata();
    next();
  } catch {
    fs.unlink(req.file.path, () => {});
    res.status(400).json({ success: false, message: "Invalid image file" });
  }
};

const getTotalLocations = async (req, res) => {
  try {
    const totalLocations = await adminService.getTotalLocations();
    res.status(200).json({ totalLocations });
  } catch (error) {
    console.error("Error fetching total locations:", error);
    res.status(500).json({ message: "Failed to retrieve total locations" });
  }
};

const getActiveUsers = async (req, res) => {
  try {
    const activeUsers = await adminService.getActiveUsers();
    res.status(200).json({ activeUsers });
  } catch (error) {
    console.error("Error fetching active users:", error);
    res.status(500).json({ message: "Failed to retrieve active users" });
  }
};
const getAllMountains = async (req, res) => {
  try {
    const mountains = await adminService.getAllMountains();
    res.status(200).json({ mountains });
  } catch (error) {
    console.error("Error fetching mountains:", error);
    res.status(500).json({ message: "Failed to retrieve mountains" });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const users = await adminService.getAllUsers();
    res.status(200).json({ users });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Failed to retrieve users" });
  }
};

const addMountain = async (req, res) => {
  try {
    const mountain = await adminService.addMountain(req.body);
    res.status(201).json({
      success: true,
      message: "Mountain added successfully",
      mountain,
    });
  } catch (error) {
    console.error("Error adding mountain:", error);
    res.status(error.status || 500).json({
      success: false,
      message: "Failed to add mountain: " + error.message,
    });
  }
};

const uploadPhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    res.status(200).json({
      success: true,
      message: "File uploaded successfully",
      filename: req.file.filename,
      url: `/storage/mountain-photos/${req.file.filename}`,
    });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || "Failed to upload file",
    });
  }
};

const updateMountain = async (req, res) => {
  try {
    const { id } = req.params;
    const mountain = await adminService.updateMountain(id, req.body);
    res.status(200).json({
      success: true,
      message: "Mountain updated successfully",
      mountain,
    });
  } catch (error) {
    console.error("Error updating mountain:", error);
    res.status(error.status || 500).json({
      success: false,
      message: "Failed to update mountain: " + error.message,
    });
  }
};

const deleteMountain = async (req, res) => {
  try {
    const { id } = req.params;
    await adminService.deleteMountain(id);
    res.status(200).json({
      success: true,
      message: "Mountain deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting mountain:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete mountain: " + error.message,
    });
  }
};

const getMountainById = async (req, res) => {
  try {
    const { id } = req.params;
    const mountain = await adminService.getMountainById(id);
    res.status(200).json({
      success: true,
      mountain,
    });
  } catch (error) {
    console.error("Error fetching mountain:", error);
    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

const addUser = async (req, res) => {
  try {
    const user = await adminService.addUser(req.body);
    res.status(201).json({
      success: true,
      message: "User added successfully",
      user,
    });
  } catch (error) {
    console.error("Error adding user:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { username } = req.params;
    await adminService.deleteUser(username);
    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const updateUser = async (req, res) => {
  try {
    const { username } = req.params;
    const user = await adminService.updateUser(username, req.body);
    res.status(200).json({
      success: true,
      message: "User updated successfully",
      user,
    });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getUserById = async (req, res) => {
  try {
    const { username } = req.params;
    const user = await adminService.getUserById(username);
    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

const getIngestionRuns = async (req, res) => {
  try {
    const runs = await adminService.getIngestionRuns();
    res.status(200).json({ runs });
  } catch (error) {
    console.error("Error fetching ingestion runs:", error);
    res.status(500).json({ message: "Failed to retrieve ingestion runs" });
  }
};

const getIngestionCandidates = async (req, res) => {
  try {
    const candidates = await adminService.getIngestionCandidates(req.query.status || "draft");
    res.status(200).json({ candidates });
  } catch (error) {
    console.error("Error fetching ingestion candidates:", error);
    res.status(400).json({ message: error.message });
  }
};

const publishIngestionCandidate = async (req, res) => {
  try {
    const candidate = await adminService.setCandidateStatus(req.params.id, "published", req.body);
    res.status(200).json({ success: true, candidate });
  } catch (error) {
    console.error("Error publishing ingestion candidate:", error);
    res.status(400).json({ success: false, message: error.message });
  }
};

const rejectIngestionCandidate = async (req, res) => {
  try {
    const candidate = await adminService.setCandidateStatus(req.params.id, "rejected");
    res.status(200).json({ success: true, candidate });
  } catch (error) {
    console.error("Error rejecting ingestion candidate:", error);
    res.status(400).json({ success: false, message: error.message });
  }
};

const bulkPublishIngestionCandidates = async (req, res) => {
  try {
    const publishedCount = await adminService.bulkPublishCandidates(req.body.ids || []);
    res.status(200).json({ success: true, publishedCount });
  } catch (error) {
    console.error("Error bulk publishing ingestion candidates:", error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// Export upload middleware along with controllers
module.exports = {
  getTotalLocations,
  getActiveUsers,
  getAllMountains,
  getAllUsers,
  addMountain,
  uploadPhoto,
  upload, // Add this export
  verifyUploadedImage,
  updateMountain,
  deleteMountain,
  getMountainById,
  addUser,
  deleteUser,
  updateUser,
  getUserById, // Add this export
  getIngestionRuns,
  getIngestionCandidates,
  publishIngestionCandidate,
  rejectIngestionCandidate,
  bulkPublishIngestionCandidates,
};
