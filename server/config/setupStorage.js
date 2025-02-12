const fs = require("fs");
const path = require("path");

const setupStorage = () => {
  const photoDir = path.join(__dirname, "../../src/assets/mountain_photos");

  if (!fs.existsSync(photoDir)) {
    fs.mkdirSync(photoDir, { recursive: true });
    console.log("Created mountain photos directory");
  }
};

module.exports = setupStorage;
