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


async function createUser(username, password, email, first_name, last_name, bio = '') {
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
      [username]
    );
    if (usernameCheck.rows.length > 0) {
      console.error("Username already taken");
      return { success: false, message: "Username already taken" };
    }

    const emailCheck = await client.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );
    if (emailCheck.rows.length > 0) {
      console.error("Email already registered");
      return { success: false, message: "Email already registered" };
    }

    const query = `
      INSERT INTO users (username, user_password, user_role, email, first_name, last_name, bio) 
      VALUES ($1, $2, $3, $4, $5, $6, $7)`;
    await client.query(query, [username, password, 'guest', email, first_name, last_name, bio]);

    return { success: true, message: "User registered successfully" };
  } catch (error) {
    console.error("Error during registration:", error);
    return { success: false, message: "An error occurred during registration" };
  } finally {
    await client.end();
  }
}

const updateUserProfile = async (userProfileData) => {
  const client = new Client({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
  });

  try {
    await client.connect();
    await client.query("BEGIN");

    const { updatedProfileData, oldUsername } = userProfileData;

    // Initialize query components
    let updateQuery = 'UPDATE users SET ';
    const updateValues = [];
    let valueIndex = 1;

    // Dynamically build the query based on the provided fields
    for (const [key, value] of Object.entries(updatedProfileData)) {
      updateQuery += `${key} = $${valueIndex}, `;
      updateValues.push(value);
      valueIndex++;
    }

    // Remove the trailing comma and space, and add the WHERE clause
    updateQuery = updateQuery.slice(0, -2) + ` WHERE username = $${valueIndex} RETURNING *`;
    updateValues.push(oldUsername);

    const result = await client.query(updateQuery, updateValues);

    // Commit the transaction
    await client.query("COMMIT");

    // Check if any rows were updated
    if (result.rowCount === 0) {
      throw new Error('No user found with the provided username');
    }

    // Return the updated profile data
    return result.rows[0];
  } catch (error) {
    console.error("Error updating user profile:", error);
    // Rollback the transaction in case of an error
    await client.query("ROLLBACK");
    throw error;
  } finally {
    await client.end();
  }
};



async function getUserByUsername(username) {
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
      "SELECT first_name, last_name, email, bio FROM users WHERE username = $1",
      [username]
    );

    if (res.rows.length === 0) {
      return null; // No user found
    }

    return res.rows[0]; 
  } catch (error) {
    console.error("Error getting user by username:", error);
    throw error; 
  } finally {
    await client.end(); 
  }
}




module.exports = { testLogin, createUser, updateUserProfile, getUserByUsername};
