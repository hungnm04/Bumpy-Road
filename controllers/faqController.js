const { submitFAQ } = require("../db/faq");

const submitFaqForm = async (req, res) => {
  const { name, email, subject, message } = req.body;

  if (!name || !email || !subject || !message) {
    return res.status(400).json({ message: "Name, email, subject, and message are required" });
  }

  try {
    const result = await submitFAQ(name, email, subject, message);

    if (result.success) {
      res.status(200).json({ message: result.message });
    } else {
      res.status(500).json({ message: result.message });
    }
  } catch (error) {
    console.error("Error during FAQ submission:", error);
    res.status(500).json({ message: "An error occurred during FAQ submission" });
  }
};

module.exports = { submitFaqForm };
