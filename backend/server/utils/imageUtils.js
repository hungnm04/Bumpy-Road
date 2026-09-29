const sharp = require("sharp");

// Magic bytes for common image formats
const MAGIC_BYTES = {
  // JPEG: FF D8 FF
  "image/jpeg": [
    [0xFF, 0xD8, 0xFF],
  ],
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  "image/png": [
    [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A],
  ],
  // GIF: 47 49 46 38 (GIF8)
  "image/gif": [
    [0x47, 0x49, 0x46, 0x38, 0x37, 0x61], // GIF87a
    [0x47, 0x49, 0x46, 0x38, 0x39, 0x61], // GIF89a
  ],
  // WebP: 52 49 46 46 ... 57 45 42 50 (RIFF....WEBP)
  "image/webp": [
    [0x52, 0x49, 0x46, 0x46], // RIFF header
  ],
};

// WebP specific check - after RIFF header, skip 4 bytes, then check WEBP
const WEBP_SIGNATURE_OFFSET = 12;
const WEBP_SIGNATURE = [0x57, 0x45, 0x42, 0x50]; // WEBP

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

function checkMagicBytes(buffer, mimeType) {
  const signatures = MAGIC_BYTES[mimeType];
  if (!signatures) {
    return false;
  }

  for (const signature of signatures) {
    let match = true;

    if (mimeType === "image/webp") {
      // WebP: RIFF at 0, WEBP at offset 8
      if (buffer.length < WEBP_SIGNATURE_OFFSET + 4) {
        match = false;
      } else {
        for (let i = 0; i < 4; i++) {
          if (buffer[i] !== signature[i]) {
            match = false;
            break;
          }
        }
        if (match) {
          for (let i = 0; i < 4; i++) {
            if (buffer[WEBP_SIGNATURE_OFFSET + i] !== WEBP_SIGNATURE[i]) {
              match = false;
              break;
            }
          }
        }
      }
    } else {
      // Standard magic byte check
      for (let i = 0; i < signature.length; i++) {
        if (buffer[i] !== signature[i]) {
          match = false;
          break;
        }
      }
    }

    if (match) {
      return true;
    }
  }

  return false;
}

function detectMimeType(buffer) {
  for (const [mimeType] of Object.entries(MAGIC_BYTES)) {
    if (checkMagicBytes(buffer, mimeType)) {
      return mimeType;
    }
  }
  return null;
}

function isValidImageBuffer(buffer) {
  const detectedMime = detectMimeType(buffer);
  if (!detectedMime) {
    return { valid: false, reason: "File content does not match a known image format" };
  }
  return { valid: true, mimeType: detectedMime };
}

// Validate and re-encode image through Sharp
async function processImage(buffer, options = {}) {
  const {
    maxWidth = 2048,
    maxHeight = 2048,
    quality = 85,
    format = "jpeg",
  } = options;

  try {
    // First, validate magic bytes
    const validation = isValidImageBuffer(buffer);
    if (!validation.valid) {
      throw new Error(validation.reason);
    }

    // Re-encode through Sharp (this also strips EXIF and metadata)
    const processed = await sharp(buffer)
      .resize(maxWidth, maxHeight, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .toFormat(format, { quality })
      .toBuffer();

    return {
      buffer: processed,
      format,
      width: processed.length > 0 ? true : false, // Sharp handles dimensions internally
    };
  } catch (error) {
    throw new Error(`Image processing failed: ${error.message}`);
  }
}

module.exports = {
  ALLOWED_MIME_TYPES,
  checkMagicBytes,
  detectMimeType,
  isValidImageBuffer,
  processImage,
};
