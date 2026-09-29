const pool = require("../config/db");
const storageService = require("../services/storageService");

class UserModel {
  static async updateAvatar(username, fileInfo) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Get current avatar
      const currentAvatar = await this.getCurrentAvatar(username);

      // Update avatar
      const query = `
        UPDATE users 
        SET avatar_path = $1, 
            avatar_url = $2 
        WHERE username = $3 
        RETURNING avatar_url`;

      const { rows } = await client.query(query, [fileInfo.path, fileInfo.url, username]);

      // If successful and there was an old avatar, delete it
      if (rows[0] && currentAvatar && currentAvatar.path !== fileInfo.path) {
        await storageService.deleteFile(currentAvatar.path);
      }

      await client.query("COMMIT");
      return rows[0];
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  static async getCurrentAvatar(username) {
    const query = "SELECT avatar_path, avatar_url FROM users WHERE username = $1";
    const { rows } = await pool.query(query, [username]);
    return rows[0];
  }
}

module.exports = UserModel;
