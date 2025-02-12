const fs = require("fs");
const path = require("path");

const cleanupOldAvatar = (oldAvatarPath) => {
  if (oldAvatarPath && fs.existsSync(oldAvatarPath)) {
    try {
      fs.unlinkSync(oldAvatarPath);
    } catch (err) {
      console.error("Error deleting old avatar:", err);
    }
  }
};

const checkFileExists = async (filepath) => {
  try {
    const fullPath = path.join(__dirname, "../../", filepath);
    await fs.promises.access(fullPath);
    return true;
  } catch {
    return false;
  }
};

module.exports = { cleanupOldAvatar, checkFileExists };
