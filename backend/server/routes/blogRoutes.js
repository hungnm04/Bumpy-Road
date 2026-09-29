const express = require("express");
const router = express.Router();
const blogController = require("../controllers/blogController");
const { authenticateJWT } = require("../middlewares/auth");

router.get("/", blogController.getBlogs);
router.get("/:id", blogController.getBlogById);
router.post("/", authenticateJWT, blogController.createBlog);
router.put("/:id", authenticateJWT, blogController.updateBlog);
router.delete("/:id", authenticateJWT, blogController.deleteBlog);

module.exports = router;
