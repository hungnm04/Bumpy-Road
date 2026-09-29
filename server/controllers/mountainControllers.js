const {
  getFeaturedPlacesFromDB,
  getPlaceById,
  searchMountains,
} = require("../services/mountains");

function boundedInteger(value, fallback, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) {
  const parsed = Number.parseInt(value, 10);

  if (!Number.isFinite(parsed)) return fallback;

  return Math.min(Math.max(parsed, min), max);
}

async function getPlaces(req, res) {
  try {
    const mountains = await searchMountains({
      q: req.query.q || req.query.name || "",
      continent: req.query.continent,
      countryCode: req.query.country_code,
      destinationType: req.query.destination_type,
      tags: req.query.tags,
      minElevationM: req.query.min_elevation_m
        ? boundedInteger(req.query.min_elevation_m, null)
        : null,
      maxElevationM: req.query.max_elevation_m
        ? boundedInteger(req.query.max_elevation_m, null)
        : null,
      limit: boundedInteger(req.query.limit, 20, { min: 1, max: 50 }),
      offset: boundedInteger(req.query.offset, 0, { min: 0, max: 10000 }),
    });

    res.status(200).json(mountains);
  } catch (error) {
    console.error("Error fetching mountains:", error);
    res.status(500).json({ message: "An error occurred while fetching mountains" });
  }
}

async function getMountainsById(req, res) {
  const mountainId = Number.parseInt(req.params.id, 10);

  if (!Number.isFinite(mountainId)) {
    return res.status(400).json({ error: "Invalid mountain ID" });
  }

  try {
    const place = await getPlaceById(mountainId);
    return place
      ? res.json(place)
      : res.status(404).json({ error: "Place not found" });
  } catch (error) {
    console.error("Error fetching place by ID:", error);
    return res.status(500).json({ error: "Server error" });
  }
}

async function getFeaturedPlaces(req, res) {
  try {
    const places = await getFeaturedPlacesFromDB();
    res.status(200).json(places);
  } catch (error) {
    console.error("Error fetching featured places:", error);
    res.status(500).json({ message: "An error occurred while fetching featured places" });
  }
}

module.exports = {
  getFeaturedPlaces,
  getMountainsById,
  getPlaces,
};
