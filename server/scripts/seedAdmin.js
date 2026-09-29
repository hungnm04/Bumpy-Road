const bcrypt = require("bcryptjs");
const pool = require("../config/db");

const required = ["ADMIN_USERNAME", "ADMIN_EMAIL", "ADMIN_PASSWORD"];

function validateEnv() {
  for (const name of required) {
    if (!process.env[name]) {
      throw new Error(`${name} is required to seed the production admin user`);
    }
  }

  if (process.env.ADMIN_PASSWORD.length < 12) {
    throw new Error("ADMIN_PASSWORD must be at least 12 characters");
  }
}

async function seedAdmin() {
  validateEnv();

  const username = process.env.ADMIN_USERNAME;
  const email = process.env.ADMIN_EMAIL;
  const passwordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD, 12);
  const assignEditorialBlogs = () =>
    pool.query("UPDATE blogs SET author_username = $1 WHERE author_username IS NULL", [username]);

  const existing = await pool.query("SELECT username FROM users WHERE username = $1", [username]);

  if (existing.rowCount > 0) {
    await pool.query(
      "UPDATE users SET user_role = 'admin', email = $2 WHERE username = $1",
      [username, email]
    );

    if (process.env.ADMIN_RESET_PASSWORD === "true") {
      await pool.query("UPDATE users SET user_password = $2 WHERE username = $1", [
        username,
        passwordHash,
      ]);
      await assignEditorialBlogs();
      console.log(`Admin ${username} exists; password reset because ADMIN_RESET_PASSWORD=true`);
      return;
    }

    await assignEditorialBlogs();
    console.log(`Admin ${username} already exists; role/email verified`);
    return;
  }

  await pool.query(
    `
      INSERT INTO users (
        username,
        user_password,
        user_role,
        email,
        first_name,
        last_name,
        avatar_url
      )
      VALUES ($1, $2, 'admin', $3, $4, $5, '/storage/avatars/default-avatar.png')
    `,
    [
      username,
      passwordHash,
      email,
      process.env.ADMIN_FIRST_NAME || "Bumpy",
      process.env.ADMIN_LAST_NAME || "Admin",
    ]
  );

  await assignEditorialBlogs();
  console.log(`Created admin user ${username}`);
}

seedAdmin()
  .catch((error) => {
    console.error("Admin seed failed:", error);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
