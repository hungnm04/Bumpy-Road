const multer = require("multer");
const sharp = require("sharp");
const storageService = require("../services/storageService");
const UserModel = require("../models/userModel");
const { isValidImageBuffer, processImage } = require("../utils/imageUtils");
const logger = require("../utils/logger");

const handleFileUpload = async (req, res, next) => {
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: (req, file, cb) => {
      // Check MIME type header first (pre-filter)
      const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
      if (!allowedTypes.includes(file.mimetype)) {
        logger.warn({ mimetype: file.mimetype }, "Upload rejected: unsupported MIME type");
        return cb(new Error("Only image files (JPEG, PNG, GIF, WebP) are allowed!"), false);
      }
      cb(null, true);
    },
  }).single("avatar");

  try {
    await new Promise((resolve, reject) => {
      upload(req, res, (err) => {
        if (err) {
          reject(err);
        }
        resolve();
      });
    });

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    const fileBuffer = req.file.buffer;

    // Security: Validate magic bytes (not just MIME header)
    const validation = isValidImageBuffer(fileBuffer);
    if (!validation.valid) {
      logger.warn({ reason: validation.reason }, "Upload rejected: invalid file content");
      return res.status(400).json({
        success: false,
        message: validation.reason,
      });
    }

    // Security: Re-encode through Sharp (strips EXIF, ensures consistent format)
    const processed = await processImage(fileBuffer, {
      maxWidth: 512,
      maxHeight: 512,
      quality: 85,
      format: "jpeg",
    });

    // Save processed image
    const fileInfo = await storageService.saveAvatar(processed.buffer, "avatar.jpg");

    // Update avatar in database
    const result = await UserModel.updateAvatar(req.user.username, fileInfo);
    req.uploadedAvatar = result.avatar_url;

    logger.info({ username: req.user.username }, "Avatar uploaded successfully");

    next();
  } catch (error) {
    logger.error({ err: error }, "Avatar upload error");
    return res.status(500).json({
      success: false,
      message: error.message || "Error uploading file",
    });
  }
};

module.exports = { handleFileUpload };
