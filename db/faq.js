const { Client } = require("pg");
require("dotenv").config();

async function submitFAQ(name, email, subject, message) {
  const client = new Client({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
  });

  await client.connect();

  try {
    const query =
      "INSERT INTO faqs (name, email, subject, message) VALUES ($1, $2, $3, $4)";
    await client.query(query, [name, email, subject, message]);

    return { success: true, message: "FAQ submitted successfully" };
    
  } catch (error) {
    console.error("Error during FAQ submission:", error);
    return { success: false, message: "An error occurred during FAQ submission" };
  } finally {
    await client.end();
  }
}

module.exports = { submitFAQ };
