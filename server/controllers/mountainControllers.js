require("dotenv").config();
const { getMountainsByName } = require("../services/mountains");
const { getPlaceById } = require("../services/mountains");
const { getFeaturedPlacesFromDB } = require("../services/mountains");

async function getPlaces(req, res) {
  const name = req.query.name || "";

  try {
    const mountains = await getMountainsByName(name);

    if (mountains.length > 0) {
      res.status(200).json(mountains);
    } else {
      res.status(404).json({ message: "No mountains found" });
    }
  } catch (error) {
    console.error("Error fetching mountains:", error);
    res.status(500).json({ message: "An error occurred while fetching mountains" });
  }
}

async function getMountainsById(req, res) {
  const { id } = req.params;
  const mountainId = parseInt(id, 10);

  if (isNaN(mountainId)) {
    return res.status(400).json({ error: "Invalid mountain ID" });
  }

  try {
    const place = await getPlaceById(mountainId);
    if (place) {
      res.json(place);
    } else {
      res.status(404).json({ error: "Place not found" });
    }
  } catch (error) {
    console.error("Error fetching place by ID:", error);
    res.status(500).json({ error: "Server error: " + error.message });
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
  getPlaces,
  getMountainsById,
  getFeaturedPlaces,
};
