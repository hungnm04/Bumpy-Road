const Client = require("pg").Client;
require("dotenv").config();
async function getMountainsByName(name) {
    const client = new Client({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT,
    });
  
    try {
      await client.connect();
  
      let query = 'SELECT * FROM mountains WHERE 1=1';
      const queryParams = [];
  
      if (name) {
        queryParams.push(`%${name}%`);
        query += ' AND name LIKE $1'; 
      }
  
      const result = await client.query(query, queryParams);
  
      return result.rows;
    } catch (error) {
      console.error("Error getting mountains:", error);
      throw error;
    } finally {
      await client.end();
    }
  }

    async function getPlaceById(id) {
      const client = new Client({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT,
      });
    
      try {
        await client.connect();
    
        const query = 'SELECT * FROM mountains WHERE id = $1'; 
        const queryParams = [id]; 
    
        const result = await client.query(query, queryParams);
    
        if (result.rows.length === 0) {
          return null; 
        }
    
        return result.rows[0]; 
      } catch (error) {
        console.error("Error getting place by ID:", error);
        throw error;
      } finally {
        await client.end();
      }
    }
  
  module.exports = {
    getMountainsByName, getPlaceById
  };
  