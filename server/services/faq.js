const pool = require("../config/db");
const socketIO = require("../config/socket");
require("dotenv").config();

async function submitFAQ(name, email, subject, message) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Insert FAQ with proper timezone
    const faqQuery = `
      INSERT INTO faqs (name, email, subject, message, created_at)
      VALUES ($1, $2, $3, $4, (now() AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Paris'))
      RETURNING id, created_at
    `;
    const faqResult = await client.query(faqQuery, [
      name,
      email,
      subject,
      message,
    ]);
    const { id: faqId, created_at } = faqResult.rows[0];

    // Create notification with proper timestamp
    const notificationQuery = `
      INSERT INTO notifications (type, title, content, data, created_at)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const notificationResult = await client.query(notificationQuery, [
      "FAQ",
      `New FAQ from ${name}`,
      subject,
      JSON.stringify({ faqId, name, email, subject, message, created_at }),
      created_at,
    ]);

    await client.query("COMMIT");

    const notification = notificationResult.rows[0];
    socketIO.getIO().emit("newNotification", notification);

    return { success: true, message: "FAQ submitted successfully" };
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error during FAQ submission:", error);
    return {
      success: false,
      message: "An error occurred during FAQ submission",
    };
  } finally {
    client.release();
  }
}

module.exports = { submitFAQ };
