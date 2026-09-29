const { fetchJsonWithHeaders } = require("./httpClient");

const UNSPLASH_BASE = "https://api.unsplash.com";
const UNSPLASH_LICENSE = "Unsplash License";

function normalizeSearchResult(result) {
  if (!result?.id || !result?.urls?.small) return null;

  const { id, urls, user, links } = result;

  return {
    provider: "unsplash",
    externalId: id,
    sourceUrl: links?.html || `${UNSPLASH_BASE}/photos/${id}`,
    thumbnailUrl: urls.small,
    author: user?.name || "Unknown photographer",
    authorUrl: user?.links?.html || null,
    licenseCode: UNSPLASH_LICENSE,
    licenseUrl: "https://unsplash.com/license",
    attributionText: `${user?.name || "Photographer"} / Unsplash`,
    rawPayload: result,
  };
}

async function searchPhotos(query, { limit = 5 } = {}) {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;

  if (!accessKey) {
    console.warn("UNSPLASH_ACCESS_KEY is not set — skipping Unsplash search.");
    return [];
  }

  const params = new URLSearchParams({
    query,
    per_page: String(Math.min(Math.max(limit, 1), 30)),
    orientation: "landscape",
    content_filter: "high",
  });

  const url = `${UNSPLASH_BASE}/search/photos?${params}`;
  const payload = await fetchJsonWithHeaders(url, {
    Authorization: `Client-ID ${accessKey}`,
  });
  const results = Array.isArray(payload.results) ? payload.results : [];

  return results.map(normalizeSearchResult).filter(Boolean);
}

module.exports = { searchPhotos, normalizeSearchResult };