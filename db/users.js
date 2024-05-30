const { Client } = require("pg");
const jwt = require("jsonwebtoken");
require("dotenv").config();

async function testLogin(emailOrUsername, password) {
  const client = new Client({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
  });

  try {
    await client.connect();

    const res = await client.query(
      "SELECT user_password, user_role, email FROM users WHERE username = $1 OR email = $2",
      [emailOrUsername, emailOrUsername] 
    );

    if (res.rows.length === 0) {
      
      return { success: false, message: "User not found" };
    } else {
      const storedPassword = res.rows[0].user_password;
      const userRole = res.rows[0].user_role;
      const userEmail = res.rows[0].email;

      if (storedPassword === password) {
        const token = jwt.sign(
          { username: emailOrUsername, role: userRole, email: userEmail }, 
          process.env.SECRET_KEY,
          { expiresIn: '1h' }
        );
        
        return { success: true, message: "Login successful", token, role: userRole, email: userEmail };
      } else {

        return { success: false, message: "Incorrect password" };
      }
    }
  } catch (error) {
    console.error("Error during login:", error);
    return { success: false, message: `An error occurred: ${error.message}` };
  } finally {
    await client.end();
  }
}


async function createUser(username, password, email) {
  const client = new Client({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
  });

  await client.connect();

  try {
    const usernameCheck = await client.query(
      "SELECT * FROM users WHERE username = $1",
      [username],
    );
    if (usernameCheck.rows.length > 0) {
      console.error("Username already taken");
      return { success: false, message: "Username already taken" };
    }

    const emailCheck = await client.query(
      "SELECT * FROM users WHERE email = $1",
      [email],
    );
    if (emailCheck.rows.length > 0) {
      console.error("Email already registered");
      return { success: false, message: "Email already registered" };
    }

    const query =
      "INSERT INTO users (username, user_password, user_role, email) VALUES ($1, $2, $3, $4)";
    await client.query(query, [username, password, 'guest', email]); // default role is 'guest'

    return { success: true, message: "User registered successfully" };
  } catch (error) {
    console.error("Error during registration:", error);
    return { success: false, message: "An error occurred during registration" };
  } finally {
    await client.end();
  }
}

async function updateProfileInDB(currentUsername, newUsername, email, newPassword) {
  const client = new Client({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
  });

  await client.connect();

  try {
    // Check if the new username is already in use by another account
    const usernameCheck = await client.query(
      "SELECT * FROM users WHERE username = $1 AND username != $2",
      [newUsername, currentUsername]
    );
    if (usernameCheck.rows.length > 0) {
      console.error("Username already in use by another account");
      return { success: false, message: "Username already in use by another account" };
    }

    // Check if the new email is already in use by another account
    const emailCheck = await client.query(
      "SELECT * FROM users WHERE email = $1 AND username = $2",
      [email, currentUsername]
    );
    if (emailCheck.rows.length > 0) {
      console.error("Email already in use by another account");
      return { success: false, message: "Email already in use by another account" };
    }

    // Update the user's profile
    const query =
      "UPDATE users SET username = $1, email = $2, user_password = $3 WHERE username = $4";
    await client.query(query, [newUsername, email, newPassword, currentUsername]);

    return { success: true, message: "Profile updated successfully" };
  } catch (error) {
    console.error("Error during profile update:", error);
    return { success: false, message: "An error occurred during profile update" };
  } finally {
    await client.end();
  }
}



module.exports = { testLogin, createUser, updateProfileInDB };
