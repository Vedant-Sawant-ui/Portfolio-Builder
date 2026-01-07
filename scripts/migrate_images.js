const { Pool } = require('pg');
require('dotenv').config(); // Load from CWD

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

const migrate = async () => {
    try {
        console.log('Starting migration...');

        // 1. Create project_images table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS project_images (
                id SERIAL PRIMARY KEY,
                project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
                image_url TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('Created project_images table.');

        // 2. Create achievement_images table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS achievement_images (
                id SERIAL PRIMARY KEY,
                achievement_id INTEGER REFERENCES achievements(id) ON DELETE CASCADE,
                image_url TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('Created achievement_images table.');

        // 3. Migrate existing data (Optional but good practice)
        // Move existing images from main tables to new tables if they are not already moved.
        // For simplicity in this run, we won't do complex data migration, assuming users will just add new images or existing ones remain as "thumbnails".
        // Actually, let's keep the main 'image_url' / 'thumbnail_url' in projects/achievements as the "Main/Thumbnail" image.
        // The new tables will store *additional* images. This is safer and requires less code rewrite.
        
        console.log('Migration completed successfully.');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await pool.end();
    }
};

migrate();
