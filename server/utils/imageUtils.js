const path = require("path");
const fs = require("fs");

const ensureImageDirectory = () => {
  const uploadPath = path.join(__dirname, "../../src/assets/mountain_photos");
  if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
  }
  return uploadPath;
};

const isImageValid = (filename) => {
  const validExtensions = [".jpg", ".jpeg", ".png", ".webp"];
  const ext = path.extname(filename).toLowerCase();
  return validExtensions.includes(ext);
};

module.exports = { ensureImageDirectory, isImageValid };
