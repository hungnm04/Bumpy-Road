const { z } = require("zod");
const blogServices = require("../services/blogServices");
const logger = require("../utils/logger");

// Zod schema for blog creation
const createBlogSchema = z.object({
  title: z.string().min(1).max(255),
  content: z.string().min(1),
  category: z.string().min(1).max(50),
  image_url: z.string().url().optional(),
});

const updateBlogSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  content: z.string().min(1).optional(),
  category: z.string().min(1).max(50).optional(),
  image_url: z.string().url().optional(),
});

async function getBlogs(req, res) {
  try {
    const blogs = await blogServices.getAllBlogs();
    res.status(200).json(blogs);
  } catch (error) {
    logger.error({ err: error }, "Error fetching blogs");
    res.status(500).json({ message: "Error fetching blogs" });
  }
}

async function getBlogById(req, res) {
  try {
    const { id } = req.params;
    const blog = await blogServices.getBlogById(id);

    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    res.status(200).json(blog);
  } catch (error) {
    logger.error({ err: error }, "Error fetching blog by ID");
    res.status(500).json({ message: "Error fetching blog" });
  }
}

async function createBlog(req, res) {
  try {
    const validated = createBlogSchema.parse(req.body);

    const blog = await blogServices.createBlog({
      ...validated,
      author_username: req.user.username,
    });

    logger.info({ blogId: blog.id, username: req.user.username }, "Blog created");

    res.status(201).json(blog);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.errors,
      });
    }
    logger.error({ err: error }, "Error creating blog");
    res.status(500).json({ message: "Error creating blog" });
  }
}

async function updateBlog(req, res) {
  try {
    const { id } = req.params;
    const validated = updateBlogSchema.parse(req.body);

    // Check ownership (only author can update)
    const blog = await blogServices.getBlogById(id);
    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    // Admins can update any blog, others can only update their own
    if (req.user.role !== "admin" && blog.author_username !== req.user.username) {
      logger.warn({ blogId: id, username: req.user.username }, "Unauthorized blog update attempt");
      return res.status(403).json({ message: "Forbidden" });
    }

    const updated = await blogServices.updateBlog(id, validated);

    logger.info({ blogId: id, username: req.user.username }, "Blog updated");

    res.status(200).json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.errors,
      });
    }
    logger.error({ err: error }, "Error updating blog");
    res.status(500).json({ message: "Error updating blog" });
  }
}

async function deleteBlog(req, res) {
  try {
    const { id } = req.params;

    // Check ownership
    const blog = await blogServices.getBlogById(id);
    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    // Admins can delete any blog, others can only delete their own
    if (req.user.role !== "admin" && blog.author_username !== req.user.username) {
      logger.warn({ blogId: id, username: req.user.username }, "Unauthorized blog delete attempt");
      return res.status(403).json({ message: "Forbidden" });
    }

    await blogServices.deleteBlog(id);

    logger.info({ blogId: id, username: req.user.username }, "Blog deleted");

    res.status(200).json({ message: "Blog deleted successfully" });
  } catch (error) {
    logger.error({ err: error }, "Error deleting blog");
    res.status(500).json({ message: "Error deleting blog" });
  }
}

module.exports = {
  getBlogs,
  getBlogById,
  createBlog,
  updateBlog,
  deleteBlog,
};
