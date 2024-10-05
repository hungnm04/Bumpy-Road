require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { login, createAccount, getProfile, updateProfile } = require("./server/controllers/userControllers");
const { submitFaqForm } = require("./server/controllers/faqController");
const { getPlaces, getMountainsById } = require("./server/controllers/mountainControllers");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(bodyParser.json());
app.use(cors());

// Login endpoint
app.post("/login", login);

// Profile endpoint
app.get("/profile", getProfile);

app.put("/profile", updateProfile);

// Create-account endpoint
app.post("/create-account", createAccount);

// Faq endpoint
app.post("/faq", submitFaqForm);

// Mountain endpoints
app.get("/places/", getPlaces);
app.get("/places/:id", getMountainsById); 

// Define your main route
app.get("/", (req, res) => {
  res.send("Welcome to the backend server");
});

// Handle 404 - Page not found
app.use((req, res, next) => {
  res.status(404).send('404 Not Found - The page you are looking for does not exist.');
});

// Error handling middleware for internal server errors
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('500 Internal Server Error - Something went wrong on the server!');
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
