const pool = require("../config/db");
require("dotenv").config();

async function getMountainsByName(name) {
  let query = `
        SELECT 
            id, 
            name, 
            location,
            photo_url
        FROM mountains 
        WHERE 1=1
    `;
  const queryParams = [];

  if (name) {
    queryParams.push(`%${name}%`);
    query += " AND name LIKE $1";
  }

  try {
    const result = await pool.query(query, queryParams);
    return result.rows;
  } catch (error) {
    console.error("Error getting mountains:", error);
    throw error;
  }
}

async function getPlaceById(id) {
  const query = "SELECT * FROM mountains WHERE id = $1";
  const queryParams = [id];

  try {
    const result = await pool.query(query, queryParams);
    if (result.rows.length === 0) {
      return null;
    }
    return result.rows[0];
  } catch (error) {
    console.error("Error getting place by ID:", error);
    throw error;
  }
}

async function getFeaturedPlacesFromDB() {
  const query = `
        SELECT *
        FROM mountains
        ORDER BY RANDOM()
        LIMIT 3
    `;

  try {
    const result = await pool.query(query);
    return result.rows;
  } catch (error) {
    console.error("Error fetching featured places from DB:", error);
    throw error;
  }
}

module.exports = {
  getMountainsByName,
  getPlaceById,
  getFeaturedPlacesFromDB,
};
