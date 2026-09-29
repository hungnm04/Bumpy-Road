const adminService = require("../services/adminService");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const sharp = require("sharp");
const crypto = require("crypto");
const { z } = require("zod");
const { isValidImageBuffer, processImage } = require("../utils/imageUtils");
const logger = require("../utils/logger");

// Zod schemas for validation
const addMountainSchema = z.object({
  name: z.string().min(1).max(255),
  location: z.string().min(1).max(255),
  description: z.string().min(1),
  continent: z.string().min(1).max(40),
  photo_url: z.string().url().optional(),
  region: z.string().max(100).optional(),
  country_code: z.string().length(2).optional(),
  elevation_m: z.number().int().min(0).optional(),
  destination_type: z.enum(["mountain_town", "mountain_resort", "ski_area", "mountain_pass", "mountain_hut"]).optional(),
  editorial_tags: z.array(z.string()).max(12).optional(),
  traveler_fit: z.array(z.string()).max(12).optional(),
  avoid_if: z.array(z.string()).max(12).optional(),
  best_seasons: z.array(z.string()).max(12).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  photo_verified: z.boolean().optional(),
  guide_status: z.enum(["preview", "guide_ready"]).optional(),
  stay_style: z.string().optional(),
  transport_notes: z.string().optional(),
  planning_notes: z.string().optional(),
});

const addUserSchema = z.object({
  username: z.string().min(3).max(50).regex(/^[a-zA-Z0-9_]+$/),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  first_name: z.string().max(50).optional(),
  last_name: z.string().max(50).optional(),
});

const updateUserSchema = z.object({
  email: z.string().email().optional(),
  first_name: z.string().max(50).optional(),
  last_name: z.string().max(50).optional(),
  new_password: z.string().min(8).max(128).optional(),
  username: z.string().min(3).max(50).regex(/^[a-zA-Z0-9_]+$/).optional(),
});

// Configure multer for file upload - memory storage for Sharp processing
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
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

// Verify uploaded image with magic byte validation and Sharp re-encoding
const verifyUploadedImage = async (req, res, next) => {
  if (!req.file) return next();

  try {
    const fileBuffer = req.file.buffer;

    // Security: Validate magic bytes (not just MIME header)
    const validation = isValidImageBuffer(fileBuffer);
    if (!validation.valid) {
      logger.warn({ reason: validation.reason }, "Admin photo upload rejected: invalid content");
      return res.status(400).json({ success: false, message: validation.reason });
    }

    // Re-encode through Sharp (strips EXIF, normalizes format)
    const processed = await processImage(fileBuffer, {
      maxWidth: 1920,
      maxHeight: 1080,
      quality: 85,
      format: "jpeg",
    });

    // Generate secure filename
    const timestamp = Date.now();
    const token = crypto.randomBytes(8).toString("hex");
    const filename = `mountain_${timestamp}_${token}.jpg`;
    const uploadPath = path.join(__dirname, "../../storage/mountain-photos");

    // Ensure directory exists
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    // Write processed image
    const filePath = path.join(uploadPath, filename);
    await fs.promises.writeFile(filePath, processed.buffer);

    // Attach processed file info to request
    req.processedFile = {
      path: filePath,
      filename,
      url: `/storage/mountain-photos/${filename}`,
    };

    logger.info({ filename, size: processed.buffer.length }, "Admin photo processed successfully");

    next();
  } catch (error) {
    logger.error({ err: error }, "Admin photo verification failed");
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlink(req.file.path, () => {});
    }
    return res.status(400).json({ success: false, message: "Invalid image file" });
  }
};

const getTotalLocations = async (req, res) => {
  try {
    const totalLocations = await adminService.getTotalLocations();
    res.status(200).json({ totalLocations });
  } catch (error) {
    logger.error({ err: error }, "Error fetching total locations");
    res.status(500).json({ message: "Failed to retrieve total locations" });
  }
};

const getActiveUsers = async (req, res) => {
  try {
    const activeUsers = await adminService.getActiveUsers();
    res.status(200).json({ activeUsers });
  } catch (error) {
    logger.error({ err: error }, "Error fetching active users");
    res.status(500).json({ message: "Failed to retrieve active users" });
  }
};

const getAllMountains = async (req, res) => {
  try {
    const mountains = await adminService.getAllMountains();
    res.status(200).json({ mountains });
  } catch (error) {
    logger.error({ err: error }, "Error fetching mountains");
    res.status(500).json({ message: "Failed to retrieve mountains" });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const users = await adminService.getAllUsers();
    res.status(200).json({ users });
  } catch (error) {
    logger.error({ err: error }, "Error fetching users");
    res.status(500).json({ message: "Failed to retrieve users" });
  }
};

const addMountain = async (req, res) => {
  try {
    const validated = addMountainSchema.parse(req.body);
    const mountain = await adminService.addMountain(validated);

    logger.info({ mountainId: mountain.id, name: mountain.name }, "Mountain added by admin");

    res.status(201).json({
      success: true,
      message: "Mountain added successfully",
      mountain,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.errors,
      });
    }
    logger.error({ err: error }, "Error adding mountain");
    res.status(error.status || 500).json({
      success: false,
      message: "Failed to add mountain: " + error.message,
    });
  }
};

const uploadPhoto = async (req, res) => {
  try {
    if (!req.processedFile) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    res.status(200).json({
      success: true,
      message: "File uploaded successfully",
      filename: req.processedFile.filename,
      url: req.processedFile.url,
    });
  } catch (error) {
    logger.error({ err: error }, "Error uploading photo");
    res.status(error.status || 500).json({
      success: false,
      message: error.message || "Failed to upload file",
    });
  }
};

const updateMountain = async (req, res) => {
  try {
    const { id } = req.params;
    const validated = addMountainSchema.partial().parse(req.body);
    const mountain = await adminService.updateMountain(id, validated);

    logger.info({ mountainId: id, username: req.user?.username }, "Mountain updated by admin");

    res.status(200).json({
      success: true,
      message: "Mountain updated successfully",
      mountain,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.errors,
      });
    }
    logger.error({ err: error }, "Error updating mountain");
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

    logger.info({ mountainId: id, username: req.user?.username }, "Mountain deleted by admin");

    res.status(200).json({
      success: true,
      message: "Mountain deleted successfully",
    });
  } catch (error) {
    logger.error({ err: error }, "Error deleting mountain");
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
    logger.error({ err: error }, "Error fetching mountain");
    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

const addUser = async (req, res) => {
  try {
    const validated = addUserSchema.parse(req.body);
    const user = await adminService.addUser(validated);

    logger.info({ username: user.username, adminUsername: req.user?.username }, "User added by admin");

    res.status(201).json({
      success: true,
      message: "User added successfully",
      user,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.errors,
      });
    }
    logger.error({ err: error }, "Error adding user");
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

    logger.info({ deletedUsername: username, adminUsername: req.user?.username }, "User deleted by admin");

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    logger.error({ err: error }, "Error deleting user");
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const updateUser = async (req, res) => {
  try {
    const { username } = req.params;
    const validated = updateUserSchema.parse(req.body);
    const user = await adminService.updateUser(username, validated);

    logger.info({ updatedUsername: username, adminUsername: req.user?.username }, "User updated by admin");

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      user,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.errors,
      });
    }
    logger.error({ err: error }, "Error updating user");
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
    logger.error({ err: error }, "Error fetching user");
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
    logger.error({ err: error }, "Error fetching ingestion runs");
    res.status(500).json({ message: "Failed to retrieve ingestion runs" });
  }
};

const getIngestionCandidates = async (req, res) => {
  try {
    const candidates = await adminService.getIngestionCandidates(req.query.status || "draft");
    res.status(200).json({ candidates });
  } catch (error) {
    logger.error({ err: error }, "Error fetching ingestion candidates");
    res.status(400).json({ message: error.message });
  }
};

const publishIngestionCandidate = async (req, res) => {
  try {
    const candidate = await adminService.setCandidateStatus(req.params.id, "published", req.body);

    logger.info({ candidateId: req.params.id, username: req.user?.username }, "Ingestion candidate published");

    res.status(200).json({ success: true, candidate });
  } catch (error) {
    logger.error({ err: error }, "Error publishing ingestion candidate");
    res.status(400).json({ success: false, message: error.message });
  }
};

const rejectIngestionCandidate = async (req, res) => {
  try {
    const candidate = await adminService.setCandidateStatus(req.params.id, "rejected");

    logger.info({ candidateId: req.params.id, username: req.user?.username }, "Ingestion candidate rejected");

    res.status(200).json({ success: true, candidate });
  } catch (error) {
    logger.error({ err: error }, "Error rejecting ingestion candidate");
    res.status(400).json({ success: false, message: error.message });
  }
};

const bulkPublishIngestionCandidates = async (req, res) => {
  try {
    const publishedCount = await adminService.bulkPublishCandidates(req.body.ids || []);

    logger.info({ count: publishedCount, ids: req.body.ids, username: req.user?.username }, "Bulk publish candidates");

    res.status(200).json({ success: true, publishedCount });
  } catch (error) {
    logger.error({ err: error }, "Error bulk publishing ingestion candidates");
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
  upload,
  verifyUploadedImage,
  updateMountain,
  deleteMountain,
  getMountainById,
  addUser,
  deleteUser,
  updateUser,
  getUserById,
  getIngestionRuns,
  getIngestionCandidates,
  publishIngestionCandidate,
  rejectIngestionCandidate,
  bulkPublishIngestionCandidates,
};
