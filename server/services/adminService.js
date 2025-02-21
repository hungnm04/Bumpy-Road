const pool = require("../config/db");
const path = require("path");
const fs = require("fs");

const getTotalLocations = async () => {
  const query = "SELECT COUNT(*) AS total FROM mountains";
  const result = await pool.query(query);
  return parseInt(result.rows[0].total, 10);
};

const getActiveUsers = async () => {
  const query = "SELECT COUNT(*) AS total FROM users";
  const result = await pool.query(query);
  return parseInt(result.rows[0].total, 10);
};
const getAllMountains = async () => {
  const query = "SELECT * FROM mountains ORDER BY name ASC";
  const result = await pool.query(query);
  return result.rows;
};

const getAllUsers = async () => {
  const query =
    "SELECT username, email, first_name, last_name, created_at FROM users ORDER BY created_at DESC";
  const result = await pool.query(query);
  return result.rows;
};

const addMountain = async (mountainData) => {
  try {
    const { name, location, description, continent, photo_url } = mountainData;

    if (!name || !location || !description || !continent || !photo_url) {
      throw new Error("Missing required fields");
    }

    const query = `
      INSERT INTO mountains (name, location, description, continent, photo_url, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *
    `;

    const values = [name, location, description, continent, photo_url];
    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      throw new Error("Failed to insert mountain data");
    }

    return result.rows[0];
  } catch (error) {
    throw new Error("Failed to add mountain: " + error.message);
  }
};

const updateMountain = async (id, mountainData) => {
  try {
    const { name, location, description, continent, photo_url } = mountainData;

    if (!name || !location || !description || !continent) {
      throw new Error("Missing required fields");
    }

    const query = `
      UPDATE mountains 
      SET name = $1, location = $2, description = $3, continent = $4, 
          photo_url = $5, updated_at = CURRENT_TIMESTAMP
      WHERE id = $6
      RETURNING *
    `;

    const values = [name, location, description, continent, photo_url, id];
    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      throw new Error("Mountain not found");
    }

    return result.rows[0];
  } catch (error) {
    throw new Error("Failed to update mountain: " + error.message);
  }
};

const deleteMountain = async (id) => {
  try {
    const query = "DELETE FROM mountains WHERE id = $1 RETURNING *";
    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      throw new Error("Mountain not found");
    }

    // Optionally delete the photo file if it's local
    const mountain = result.rows[0];
    if (mountain.photo_url.startsWith("/src/assets/")) {
      const filePath = path.join(__dirname, "../..", mountain.photo_url);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
  } catch (error) {
    throw new Error("Failed to delete mountain: " + error.message);
  }
};

const getMountainById = async (id) => {
  try {
    const query = "SELECT * FROM mountains WHERE id = $1";
    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      throw new Error("Mountain not found");
    }

    return result.rows[0];
  } catch (error) {
    throw new Error("Failed to fetch mountain: " + error.message);
  }
};

const addUser = async (userData) => {
  try {
    const { username, email, password, first_name, last_name } = userData;

    if (!username || !email || !password) {
      throw new Error("Missing required fields");
    }

    // Check if user already exists
    const checkQuery = "SELECT username FROM users WHERE username = $1 OR email = $2";
    const checkResult = await pool.query(checkQuery, [username, email]);

    if (checkResult.rows.length > 0) {
      throw new Error("Username or email already exists");
    }

    const query = `
      INSERT INTO users (username, email, user_password, first_name, last_name, created_at)
      VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
      RETURNING username, email, first_name, last_name, created_at
    `;

    const values = [username, email, password, first_name || "", last_name || ""];
    const result = await pool.query(query, values);

    return result.rows[0];
  } catch (error) {
    throw new Error("Failed to add user: " + error.message);
  }
};

const deleteUser = async (username) => {
  try {
    const query = "DELETE FROM users WHERE username = $1 RETURNING username";
    const result = await pool.query(query, [username]);

    if (result.rows.length === 0) {
      throw new Error("User not found");
    }

    return result.rows[0];
  } catch (error) {
    throw new Error("Failed to delete user: " + error.message);
  }
};

const updateUser = async (username, userData) => {
  try {
    const { email, first_name, last_name, new_password, username: newUsername } = userData;

    // Start building the query dynamically
    let queryParts = [];
    let values = [username]; // First parameter is always the current username
    let valueCounter = 2; // Start from 2 since $1 is the WHERE clause

    if (email) queryParts.push(`email = $${valueCounter++}`);
    if (first_name) queryParts.push(`first_name = $${valueCounter++}`);
    if (last_name) queryParts.push(`last_name = $${valueCounter++}`);
    if (new_password) queryParts.push(`user_password = $${valueCounter++}`);
    if (newUsername) queryParts.push(`username = $${valueCounter++}`);

    queryParts.push(`updated_at = CURRENT_TIMESTAMP`);

    // If no fields to update
    if (queryParts.length === 1) {
      throw new Error("No fields to update");
    }

    // Build the values array
    const updateValues = [];
    if (email) updateValues.push(email);
    if (first_name) updateValues.push(first_name);
    if (last_name) updateValues.push(last_name);
    if (new_password) updateValues.push(new_password);
    if (newUsername) updateValues.push(newUsername);

    const query = `
      UPDATE users 
      SET ${queryParts.join(", ")}
      WHERE username = $1
      RETURNING username, email, first_name, last_name, created_at
    `;

    const result = await pool.query(query, [...values, ...updateValues]);

    if (result.rows.length === 0) {
      throw new Error("User not found");
    }

    return result.rows[0];
  } catch (error) {
    throw new Error("Failed to update user: " + error.message);
  }
};

const getUserById = async (username) => {
  try {
    const query = `
      SELECT username, email, first_name, last_name, created_at
      FROM users
      WHERE username = $1
    `;

    const result = await pool.query(query, [username]);

    if (result.rows.length === 0) {
      throw new Error("User not found");
    }

    return result.rows[0];
  } catch (error) {
    throw new Error(`Failed to fetch user: ${error.message}`);
  }
};

module.exports = {
  getTotalLocations,
  getActiveUsers,
  getAllMountains,
  getAllUsers,
  addMountain,
  updateMountain,
  deleteMountain,
  getMountainById,
  addUser,
  deleteUser,
  updateUser,
  getUserById,
};
