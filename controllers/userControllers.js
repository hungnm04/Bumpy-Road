const { testLogin, createUser } = require("../db/users");

const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    const loginResult = await testLogin(email, password);

    if (loginResult.success) {
      res.status(200).json({ 
        message: loginResult.message,
        role: loginResult.role,
        token: loginResult.token 
      });
    } else {
      res.status(401).json({ message: loginResult.message });
    }
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ message: "An error occurred during login" });
  }
};

const createAccount = async (req, res) => {
  const { username, password, email } = req.body;

  if (!username || !password || !email) {
    return res.status(400).json({ message: "Username, email, and password are required" });
  }

  try {
    const result = await createUser(username, password, email); 

    if (result.success) {
      res.status(201).json({ message: result.message });
    } else {
      res.status(400).json({ message: result.message });
    }
  } catch (error) {
    console.error("Error during registration:", error);
    res.status(500).json({ message: "An error occurred during registration" });
  }
};

module.exports = { login, createAccount };
