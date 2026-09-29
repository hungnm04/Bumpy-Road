const path = require("path");
const fs = require("fs").promises;
const crypto = require("crypto");

class StorageService {
  constructor() {
    this.storageDir = path.join(__dirname, "..", "..", "storage");
    this.avatarsDir = path.join(this.storageDir, "avatars");
    this.initStorage();
  }

  async initStorage() {
    try {
      await fs.mkdir(this.storageDir, { recursive: true });
      await fs.mkdir(this.avatarsDir, { recursive: true });
    } catch (error) {
      console.error("Error creating storage directories:", error);
    }
  }

  async saveAvatar(buffer, originalName) {
    try {
      const hash = this.getFileHash(buffer);
      const ext = path.extname(originalName).toLowerCase();
      const allowedExtensions = new Set([".jpg", ".jpeg", ".png", ".gif", ".webp"]);
      if (!allowedExtensions.has(ext)) {
        throw new Error("Unsupported image extension");
      }
      const relativePath = path.join("avatars", `${hash}${ext}`);
      const fullPath = path.join(this.storageDir, relativePath);

      // Check if file exists
      try {
        await fs.access(fullPath);
      } catch {
        // File doesn't exist, save it
        await fs.writeFile(fullPath, buffer);
      }

      return {
        hash,
        path: relativePath,
        url: `/storage/${relativePath.replace(/\\/g, "/")}`,
      };
    } catch (error) {
      throw new Error(`Failed to save avatar: ${error.message}`);
    }
  }

  getFileHash(buffer) {
    return crypto.createHash("sha256").update(buffer).digest("hex");
  }

  async deleteFile(relativePath) {
    if (!relativePath) return;

    const fullPath = path.join(this.storageDir, relativePath);
    const resolvedPath = path.resolve(fullPath);
    const resolvedStorageDir = path.resolve(this.storageDir);
    if (resolvedPath !== resolvedStorageDir && !resolvedPath.startsWith(resolvedStorageDir + path.sep)) {
      throw new Error("Invalid storage path");
    }
    try {
      await fs.access(resolvedPath);
      await fs.unlink(resolvedPath);
    } catch (error) {
      // Log the error and continue
      console.log(`File deletion failed: ${error.message}`);
    }
  }
}

module.exports = new StorageService();
