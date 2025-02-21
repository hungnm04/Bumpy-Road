const blogServices = require("../services/blogServices");

const blogController = {
  async getBlogs(req, res) {
    try {
      const blogs = await blogServices.getAllBlogs();
      res.json({ 
        success: true,
        blogs 
      });
    } catch (error) {
      console.error('Blog service error:', error);
      res.status(500).json({ 
        success: false,
        message: "Error fetching blogs"
      });
    }
  },

  async getBlogById(req, res) {
    try {
      const blog = await blogServices.getBlogById(req.params.id);
      
      if (!blog) {
        return res.status(404).json({
          success: false,
          message: "Blog not found"
        });
      }

      res.json({
        success: true,
        blog
      });
    } catch (error) {
      console.error('Blog service error:', error);
      res.status(500).json({
        success: false,
        message: "Error fetching blog"
      });
    }
  },

  async createBlog(req, res) {
    try {
      const blogData = {
        ...req.body,
        author_username: req.user.username
      };
      
      const newBlog = await blogServices.createBlog(blogData);
      
      res.status(201).json({
        success: true,
        blog: newBlog
      });
    } catch (error) {
      console.error('Blog service error:', error);
      res.status(500).json({
        success: false,
        message: "Error creating blog"
      });
    }
  }
};

module.exports = blogController;
