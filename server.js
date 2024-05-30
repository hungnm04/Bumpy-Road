require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { login, createAccount } = require("./controllers/userControllers");
const { submitFaqForm } = require("./controllers/faqController");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(bodyParser.json());
app.use(cors());

// Login endpoint
app.post("/login", login);

// Create-account endpoint
app.post("/create-account", createAccount);

// Faq endpoint
app.post("/faq", submitFaqForm)

// GET request for login
app.get('/login', (req, res) => {
  res.send('This is the login page.');
});

app.get('/create-account', (req, res) => {
  res.send('This is the create-account page.');
});

// Root endpoint
app.get("/", (req, res) => {
  res.send("Welcome to the backend server");
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
