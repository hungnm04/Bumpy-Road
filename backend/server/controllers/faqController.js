const { z } = require("zod");
const pool = require("../config/db");
const logger = require("../utils/logger");

// Zod schema for FAQ form submission
const submitFaqSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  subject: z.string().min(1).max(255),
  message: z.string().min(1).max(5000),
});

const submitFaqForm = async (req, res) => {
  try {
    const validated = submitFaqSchema.parse(req.body);
    const { name, email, subject, message } = validated;

    const query = `
      INSERT INTO faqs (name, email, subject, message)
      VALUES ($1, $2, $3, $4)
      RETURNING id, name, email, subject, created_at
    `;

    const { rows } = await pool.query(query, [name, email, subject, message]);

    logger.info({ name, email }, "FAQ form submitted");

    res.status(201).json({
      success: true,
      message: "Thank you for your message. We'll get back to you soon.",
      id: rows[0].id,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.errors,
      });
    }
    logger.error({ err: error }, "FAQ form submission error");
    res.status(500).json({
      success: false,
      message: "Failed to submit FAQ form. Please try again.",
    });
  }
};

module.exports = { submitFaqForm };
