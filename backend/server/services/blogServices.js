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
      image_url: blog.image_url || '/storage/mountain-photos/mountain_town_1.jpg'
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
      image_url: rows[0].image_url || '/storage/mountain-photos/mountain_town_1.jpg'
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
  },

  async updateBlog(id, blogData) {
    const { title, content, category, image_url } = blogData;

    // Build dynamic update query
    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (title !== undefined) {
      updates.push(`title = $${paramIndex++}`);
      values.push(title);
    }
    if (content !== undefined) {
      updates.push(`content = $${paramIndex++}`);
      values.push(content);
    }
    if (category !== undefined) {
      updates.push(`category = $${paramIndex++}`);
      values.push(category);
    }
    if (image_url !== undefined) {
      updates.push(`image_url = $${paramIndex++}`);
      values.push(image_url);
    }

    if (updates.length === 0) {
      return this.getBlogById(id);
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `
      UPDATE blogs
      SET ${updates.join(", ")}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const { rows } = await pool.query(query, values);
    return rows[0];
  },

  async deleteBlog(id) {
    const query = "DELETE FROM blogs WHERE id = $1 RETURNING *";
    const { rows } = await pool.query(query, [id]);
    return rows[0];
  }
};

module.exports = blogServices;
