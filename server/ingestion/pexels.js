const { fetchJsonWithHeaders } = require("./httpClient");

const PEXELS_BASE = "https://api.pexels.com";
const PEXELS_LICENSE = "Pexels License";

function normalizePhoto(photo) {
  if (!photo?.id || !photo?.src?.landscape) return null;

  return {
    provider: "pexels",
    externalId: String(photo.id),
    sourceUrl: photo.url || `${PEXELS_BASE}/photo/${photo.id}`,
    thumbnailUrl: photo.src.landscape,
    author: photo.photographer || "Unknown photographer",
    authorUrl: photo.photographer_url || null,
    licenseCode: PEXELS_LICENSE,
    licenseUrl: "https://www.pexels.com/license/",
    attributionText: `${photo.photographer || "Photographer"} / Pexels`,
    rawPayload: photo,
  };
}

async function searchPhotos(query, { limit = 5 } = {}) {
  const apiKey = process.env.PEXELS_API_KEY;

  if (!apiKey) {
    console.warn("PEXELS_API_KEY is not set — skipping Pexels search.");
    return [];
  }

  const params = new URLSearchParams({
    query,
    per_page: String(Math.min(Math.max(limit, 1), 80)),
    orientation: "landscape",
  });

  const url = `${PEXELS_BASE}/v1/search?${params}`;
  const payload = await fetchJsonWithHeaders(url, { Authorization: apiKey });
  const photos = Array.isArray(payload.photos) ? payload.photos : [];

  return photos.map(normalizePhoto).filter(Boolean);
}

module.exports = { searchPhotos, normalizePhoto };