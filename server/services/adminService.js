const pool = require("../config/db");
const path = require("path");
const fs = require("fs");
const { hashPassword, validatePassword } = require("./users");
const { evaluateGuideQuality } = require("./destinationQuality");

const normalizeList = (value) => {
  if (!value) return [];
  const list = Array.isArray(value) ? value : String(value).split(",");

  return list.map((item) => String(item).trim().toLowerCase()).filter(Boolean).slice(0, 12);
};

const normalizeGuideData = (mountainData) => ({
  ...mountainData,
  editorial_tags: normalizeList(mountainData.editorial_tags),
  traveler_fit: normalizeList(mountainData.traveler_fit),
  avoid_if: normalizeList(mountainData.avoid_if),
  best_seasons: normalizeList(mountainData.best_seasons),
  photo_verified: mountainData.photo_verified === true || mountainData.photo_verified === "true",
  guide_status: mountainData.guide_status === "guide_ready" ? "guide_ready" : "preview",
});

const withGuideQuality = (mountainData) => {
  const normalized = normalizeGuideData(mountainData);
  const quality = evaluateGuideQuality(normalized);

  if (normalized.guide_status === "guide_ready" && !quality.ready) {
    const error = new Error(`Guide is not ready: ${quality.issues.join(", ")}`);
    error.status = 400;
    throw error;
  }

  return { ...normalized, ...quality };
};

const deleteStoredMountainPhoto = (photoUrl) => {
  if (!photoUrl || !photoUrl.startsWith("/storage/mountain-photos/")) {
    return;
  }

  const relativePath = photoUrl.replace(/^\/storage\//, "");
  const storageDir = path.resolve(__dirname, "../../storage");
  const filePath = path.resolve(storageDir, relativePath);

  if (filePath.startsWith(storageDir + path.sep) && fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

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
    const guideData = withGuideQuality(mountainData);
    const {
      name,
      location,
      description,
      continent,
      photo_url,
      region,
      country_code,
      elevation_m,
      destination_type,
      editorial_tags,
      latitude,
      longitude,
      traveler_fit,
      avoid_if,
      best_seasons,
      stay_style,
      transport_notes,
      planning_notes,
      photo_verified,
      guide_status,
      score,
      issues,
    } = guideData;

    if (!name || !location || !description || !continent || !photo_url) {
      throw new Error("Missing required fields");
    }

    const query = `
      INSERT INTO mountains (
        name,
        location,
        description,
        continent,
        photo_url,
        region,
        country_code,
        elevation_m,
        destination_type,
        editorial_tags,
        latitude,
        longitude,
        traveler_fit,
        avoid_if,
        best_seasons,
        stay_style,
        transport_notes,
        planning_notes,
        photo_verified,
        guide_status,
        guide_quality_score,
        guide_quality_issues,
        editorial_reviewed_at,
        guide_updated_at,
        created_at,
        updated_at
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, COALESCE($9, 'mountain_town'),
        $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20::varchar, $21, $22,
        CASE WHEN $20::varchar = 'guide_ready' THEN CURRENT_TIMESTAMP ELSE NULL END,
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      )
      RETURNING *
    `;

    const values = [
      name,
      location,
      description,
      continent,
      photo_url,
      region || null,
      country_code || null,
      elevation_m ?? null,
      destination_type || null,
      editorial_tags,
      latitude ?? null,
      longitude ?? null,
      traveler_fit,
      avoid_if,
      best_seasons,
      stay_style || null,
      transport_notes || null,
      planning_notes || null,
      photo_verified,
      guide_status,
      score,
      issues,
    ];
    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      throw new Error("Failed to insert mountain data");
    }

    return result.rows[0];
  } catch (error) {
    const wrapped = new Error("Failed to add mountain: " + error.message);
    wrapped.status = error.status;
    throw wrapped;
  }
};

const updateMountain = async (id, mountainData) => {
  try {
    const existing = await getMountainById(id);
    const guideData = withGuideQuality({ ...existing, ...mountainData });
    const {
      name,
      location,
      description,
      continent,
      photo_url,
      region,
      country_code,
      elevation_m,
      destination_type,
      editorial_tags,
      latitude,
      longitude,
      traveler_fit,
      avoid_if,
      best_seasons,
      stay_style,
      transport_notes,
      planning_notes,
      photo_verified,
      guide_status,
      score,
      issues,
    } = guideData;

    if (!name || !location || !description || !continent) {
      throw new Error("Missing required fields");
    }

    const query = `
      UPDATE mountains 
      SET name = $1,
          location = $2,
          description = $3,
          continent = $4,
          photo_url = COALESCE($5, photo_url),
          region = $6,
          country_code = $7,
          elevation_m = $8,
          destination_type = COALESCE($9, destination_type),
          editorial_tags = COALESCE($10, editorial_tags),
          latitude = $11,
          longitude = $12,
          traveler_fit = $13,
          avoid_if = $14,
          best_seasons = $15,
          stay_style = $16,
          transport_notes = $17,
          planning_notes = $18,
          photo_verified = $19,
          guide_status = $20::varchar,
          guide_quality_score = $21,
          guide_quality_issues = $22,
          editorial_reviewed_at = CASE
            WHEN $20::varchar = 'guide_ready' THEN COALESCE(editorial_reviewed_at, CURRENT_TIMESTAMP)
            ELSE editorial_reviewed_at
          END,
          guide_updated_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $23
      RETURNING *
    `;

    const values = [
      name,
      location,
      description,
      continent,
      photo_url || null,
      region || null,
      country_code || null,
      elevation_m ?? null,
      destination_type || null,
      editorial_tags,
      latitude ?? null,
      longitude ?? null,
      traveler_fit,
      avoid_if,
      best_seasons,
      stay_style || null,
      transport_notes || null,
      planning_notes || null,
      photo_verified,
      guide_status,
      score,
      issues,
      id,
    ];
    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      throw new Error("Mountain not found");
    }

    return result.rows[0];
  } catch (error) {
    const wrapped = new Error("Failed to update mountain: " + error.message);
    wrapped.status = error.status;
    throw wrapped;
  }
};

const deleteMountain = async (id) => {
  try {
    const query = "DELETE FROM mountains WHERE id = $1 RETURNING *";
    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      throw new Error("Mountain not found");
    }

    const mountain = result.rows[0];
    deleteStoredMountainPhoto(mountain.photo_url);
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
    validatePassword(password);

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

    const values = [username, email, await hashPassword(password), first_name || "", last_name || ""];
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
    if (new_password) {
      validatePassword(new_password);
      queryParts.push(`user_password = $${valueCounter++}`);
    }
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
    if (new_password) updateValues.push(await hashPassword(new_password));
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

const getIngestionRuns = async () => {
  const { rows } = await pool.query(`
    SELECT *
    FROM ingestion_runs
    ORDER BY started_at DESC
    LIMIT 25
  `);

  return rows;
};

const getIngestionCandidates = async (status = "draft") => {
  if (!["draft", "published", "rejected"].includes(status)) {
    throw new Error("Invalid publication status");
  }

  const { rows } = await pool.query(
    `SELECT
       m.*,
       s.source_url,
       s.external_id,
       s.attribution_text AS source_attribution,
       s.license_code AS source_license_code,
       media.source_url AS media_source_url,
       media.thumbnail_url AS media_thumbnail_url,
       media.attribution_text AS media_attribution,
       media.license_code AS media_license_code,
       media.license_url AS media_license_url
     FROM mountains m
     JOIN mountain_sources s ON s.mountain_id = m.id
     LEFT JOIN LATERAL (
       SELECT source_url, thumbnail_url, attribution_text, license_code, license_url
       FROM mountain_media
       WHERE mountain_id = m.id AND is_primary = true
       ORDER BY fetched_at DESC
       LIMIT 1
     ) media ON true
     WHERE m.publication_status = $1
     ORDER BY m.updated_at DESC, m.name ASC`,
    [status]
  );

  return rows;
};

const setCandidateStatus = async (id, status, editorial = {}) => {
  if (!["published", "rejected"].includes(status)) {
    throw new Error("Invalid publication status");
  }

  const tags = Array.isArray(editorial.editorial_tags)
    ? editorial.editorial_tags.map((tag) => String(tag).trim().toLowerCase()).filter(Boolean).slice(0, 12)
    : null;
  const { rows } = await pool.query(
    `UPDATE mountains
     SET publication_status = $2,
         guide_status = CASE WHEN $2 = 'published' THEN 'preview' ELSE guide_status END,
         description = COALESCE(NULLIF($3, ''), description),
         editorial_tags = COALESCE($4, editorial_tags),
         photo_url = COALESCE(NULLIF($5, ''), photo_url),
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $1
       AND EXISTS (SELECT 1 FROM mountain_sources WHERE mountain_id = mountains.id)
     RETURNING *`,
    [id, status, editorial.description || null, tags, editorial.photo_url || null]
  );

  if (rows.length === 0) {
    throw new Error("Ingestion candidate not found");
  }

  return rows[0];
};

const bulkPublishCandidates = async (ids) => {
  const candidateIds = [...new Set(ids.map(Number).filter(Number.isInteger))].slice(0, 100);

  if (candidateIds.length === 0) {
    throw new Error("Select at least one ingestion candidate");
  }

  const { rows } = await pool.query(
    `UPDATE mountains
     SET publication_status = 'published', updated_at = CURRENT_TIMESTAMP
         , guide_status = 'preview'
     WHERE id = ANY($1::int[])
       AND publication_status = 'draft'
       AND EXISTS (SELECT 1 FROM mountain_sources WHERE mountain_id = mountains.id)
     RETURNING id`,
    [candidateIds]
  );

  return rows.length;
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
  getIngestionRuns,
  getIngestionCandidates,
  setCandidateStatus,
  bulkPublishCandidates,
};
