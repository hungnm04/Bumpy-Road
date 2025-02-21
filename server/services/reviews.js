const pool = require("../config/db");

async function getReviewsByMountainId(mountainId) {
  const query = `
    SELECT r.*, u.first_name, u.last_name, u.avatar_url
    FROM reviews r
    JOIN users u ON r.username = u.username
    WHERE r.mountain_id = $1
    ORDER BY r.created_at DESC
  `;
  const { rows } = await pool.query(query, [mountainId]);
  return rows;
}

async function addReview({ mountainId, username, rating, comment }) {
  const query = `
    INSERT INTO reviews (mountain_id, username, rating, comment)
    VALUES ($1, $2, $3, $4)
    RETURNING id, mountain_id, username, rating, comment, created_at
  `;
  const { rows } = await pool.query(query, [mountainId, username, rating, comment]);
  return rows[0];
}

module.exports = {
  getReviewsByMountainId,
  addReview,
};
