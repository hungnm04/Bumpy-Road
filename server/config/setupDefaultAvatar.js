const fs = require("fs").promises;
const path = require("path");

async function setupDefaultAvatar() {
  const storageDir = path.join(__dirname, "..", "..", "storage", "avatars");
  const defaultAvatarPath = path.join(storageDir, "default-avatar.png");

  try {
    // Create storage directory if it doesn't exist
    await fs.mkdir(storageDir, { recursive: true });

    // Check if default avatar exists
    try {
      await fs.access(defaultAvatarPath);
    } catch {
      // Create a simple white default avatar if it doesn't exist
      const defaultAvatarSvg = `
        <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
          <rect width="200" height="200" fill="#f0f0f0"/>
          <circle cx="100" cy="85" r="35" fill="#ddd"/>
          <path d="M100 135c-25 0-47 15-55 35h110c-8-20-30-35-55-35z" fill="#ddd"/>
        </svg>
      `;

      // Convert SVG to PNG or save as SVG
      await fs.writeFile(defaultAvatarPath, defaultAvatarSvg);
    }
  } catch (error) {
    console.error("Error setting up default avatar:", error);
  }
}

module.exports = setupDefaultAvatar;
