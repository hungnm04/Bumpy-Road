const multer = require("multer");
const storageService = require("../services/storageService");
const UserModel = require("../models/userModel");

const handleFileUpload = async (req, res, next) => {
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 20 * 1024 * 1024,
    },
    fileFilter: (req, file, cb) => {
      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
      ];
      if (!allowedTypes.includes(file.mimetype)) {
        return cb(new Error("Only image files are allowed!"), false);
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

    const fileInfo = await storageService.saveAvatar(
      req.file.buffer,
      req.file.originalname
    );

    // Update avatar in database
    const result = await UserModel.updateAvatar(req.user.username, fileInfo);
    req.uploadedAvatar = result.avatar_url;
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Error uploading file",
    });
  }
};

module.exports = { handleFileUpload };
