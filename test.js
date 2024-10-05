require('dotenv').config();
const { Client } = require('pg');

const client = new Client({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
});

client.connect()
    .then(() => {
        console.log('Connected to PostgreSQL successfully!');
        
        // Perform the query here
        return client.query('SELECT * FROM mountains');
    })
    .then(res => {
        console.log('Mountains:', res.rows);
    })
    .catch(err => {
        console.error('Connection or query error', err.stack);
    })
    .finally(() => {
        client.end(); // Close the connection here, after the query has executed
    });
