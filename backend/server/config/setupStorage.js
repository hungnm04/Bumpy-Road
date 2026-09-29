const fs = require("fs");
const path = require("path");

const setupStorage = () => {
  const storageDir = path.join(__dirname, "../../storage");
  const avatarDir = path.join(storageDir, "avatars");
  const photoDir = path.join(storageDir, "mountain-photos");

  for (const dir of [storageDir, avatarDir, photoDir]) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
};

module.exports = setupStorage;
