require('dotenv').config(); // Load environment variables from .env file
const { Pool } = require('pg');

// Create a new pool instance using values from .env
const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

// Optional: Log when connected successfully (helps debugging)
pool.on('connect', () => {
    console.log('✅ Connected to the PostgreSQL database');
});

// Export the pool so other files can use it
module.exports = pool;