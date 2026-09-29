const { fetchJson } = require("./httpClient");

const OVERPASS_BASE = "https://overpass-api.de/api/interpreter";
const OSM_LICENSE = "ODbL-1.0";

function pickTag(tags, ...keys) {
  for (const key of keys) {
    if (tags[key]) return tags[key];
  }
  return null;
}

function normalizeElement(element) {
  if (!element?.id || !element?.lat || !element?.lon) return null;
  const tags = element.tags || {};
  const name = pickTag(tags, "name:en", "name", "int_name");
  if (!name) return null;

  return {
    provider: "openstreetmap",
    externalId: `${element.type}/${element.id}`,
    sourceUrl: `https://www.openstreetmap.org/${element.type}/${element.id}`,
    name,
    location: pickTag(tags, "addr:country") || "Unknown",
    region: pickTag(tags, "addr:state") || null,
    countryCode: (pickTag(tags, "addr:country") || "").slice(0, 2).toUpperCase() || null,
    latitude: Number(element.lat),
    longitude: Number(element.lon),
    elevationM: tags.ele ? Number(tags.ele) : null,
    destinationType: tags.tourism || tags.natural || "mountain",
    licenseCode: OSM_LICENSE,
    attributionText: "OpenStreetMap contributors",
    attributionUrl: "https://www.openstreetmap.org/copyright",
    rawPayload: element,
  };
}

/**
 * Query Overpass for trail/peak nodes within ~25km of a given coord.
 * Returns normalized enrichment records that may match an existing mountain.
 */
async function enrichAroundCoords({ latitude, longitude, radiusKm = 25 } = {}) {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return [];

  const query = `[out:json][timeout:25];
(
  node(around:${radiusKm * 1000},${latitude},${longitude})["natural"="peak"];
  node(around:${radiusKm * 1000},${latitude},${longitude})["tourism"="alpine_hut"];
  way(around:${radiusKm * 1000},${latitude},${longitude})["highway"="path"];
);
out tags 50;`;

  const payload = await fetchJson(`${OVERPASS_BASE}?data=${encodeURIComponent(query)}`, {
    cacheTtlMs: 12 * 60 * 60 * 1000,
  });
  const elements = Array.isArray(payload.elements) ? payload.elements : [];
  return elements.map(normalizeElement).filter(Boolean);
}

module.exports = { enrichAroundCoords, normalizeElement };