const pool = require("../config/db");

const blogServices = {
  async getAllBlogs() {
    const query = `
      SELECT b.*, u.username as author_username,
             u.first_name, u.last_name, u.avatar_url
      FROM blogs b
      LEFT JOIN users u ON b.author_username = u.username
      ORDER BY b.created_at DESC
    `;
    
    const { rows } = await pool.query(query);
    return rows.map(blog => ({
      ...blog,
      image_url: blog.image_url || 'placeholder-mountain.png'
    }));
  },

  async getBlogById(id) {
    const query = `
      SELECT b.*, u.username as author_username,
             u.first_name, u.last_name, u.avatar_url
      FROM blogs b
      LEFT JOIN users u ON b.author_username = u.username
      WHERE b.id = $1
    `;
    
    const { rows } = await pool.query(query, [id]);
    if (rows.length === 0) return null;
    
    return {
      ...rows[0],
      image_url: rows[0].image_url || 'placeholder-mountain.png'
    };
  },

  async createBlog(blogData) {
    const { title, content, author_username, category, image_url } = blogData;
    const query = `
      INSERT INTO blogs (title, content, author_username, category, image_url)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    
    const values = [title, content, author_username, category, image_url];
    const { rows } = await pool.query(query, values);
    return rows[0];
  }
};

module.exports = blogServices;
