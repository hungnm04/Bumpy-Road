const express = require("express");
const router = express.Router();
const pool = require("../config/db");

// Get all notifications (both read and unread)
router.get("/all", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM notifications ORDER BY created_at DESC"
    );
    res.json({ notifications: result.rows });
  } catch (error) {
    console.error("Error fetching all notifications:", error);
    res.status(500).json({ message: "Failed to fetch notifications" });
  }
});

// Get unread notifications
router.get("/unread", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM notifications WHERE is_read = false ORDER BY created_at DESC"
    );
    res.json({ notifications: result.rows });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ message: "Failed to fetch notifications" });
  }
});

// Mark notification as read
router.put("/:id/read", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      "UPDATE notifications SET is_read = true WHERE id = $1 RETURNING *",
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Notification not found" });
    }
    res.json({ notification: result.rows[0] });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ message: "Failed to update notification" });
  }
});

// Mark all as read
router.put("/mark-all-read", async (req, res) => {
  try {
    await pool.query(
      "UPDATE notifications SET is_read = true WHERE is_read = false"
    );
    res.json({ message: "All notifications marked as read" });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    res.status(500).json({ message: "Failed to update notifications" });
  }
});

module.exports = router;
