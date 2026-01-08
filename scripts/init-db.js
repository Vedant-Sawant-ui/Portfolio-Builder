const pool = require('../config/db');

async function initializeDatabase() {
    console.log("🚀 [DB-INIT] Starting Check...");
    try {
        // Core User Table (in case it's a fresh DB)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(255) UNIQUE NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                is_verified BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_DATE
            );
        `);

        // 1. Profiles Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS profiles (
                id SERIAL PRIMARY KEY,
                user_id INTEGER UNIQUE NOT NULL,
                full_name VARCHAR(255),
                bio TEXT,
                public_email VARCHAR(255),
                phone VARCHAR(50),
                profile_pic_url TEXT,
                resume_url TEXT,
                theme_preference VARCHAR(50) DEFAULT 'static_minimalist',
                is_published BOOLEAN DEFAULT FALSE,
                leetcode_username VARCHAR(100),
                github_username VARCHAR(100)
            );
        `);

        // 2. API Usage Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS api_usage (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL,
                api_type VARCHAR(50) NOT NULL,
                count INTEGER DEFAULT 0,
                usage_date DATE DEFAULT CURRENT_DATE,
                UNIQUE(user_id, api_type, usage_date)
            );
        `);

        // 3. Image Tables
        await pool.query(`CREATE TABLE IF NOT EXISTS project_images (id SERIAL PRIMARY KEY, project_id INTEGER NOT NULL, image_url TEXT NOT NULL);`);
        await pool.query(`CREATE TABLE IF NOT EXISTS achievement_images (id SERIAL PRIMARY KEY, achievement_id INTEGER NOT NULL, image_url TEXT NOT NULL);`);

        // 4. Content Tables
        await pool.query(`CREATE TABLE IF NOT EXISTS skills (id SERIAL PRIMARY KEY, user_id INTEGER, skill_name VARCHAR(255), proficiency_level VARCHAR(50) DEFAULT 'Intermediate');`);
        await pool.query(`CREATE TABLE IF NOT EXISTS projects (id SERIAL PRIMARY KEY, user_id INTEGER, title VARCHAR(255), description TEXT, project_link TEXT, thumbnail_url TEXT);`);
        await pool.query(`CREATE TABLE IF NOT EXISTS socials (id SERIAL PRIMARY KEY, user_id INTEGER, platform_name VARCHAR(255), platform_url TEXT);`);
        await pool.query(`CREATE TABLE IF NOT EXISTS achievements (id SERIAL PRIMARY KEY, user_id INTEGER, title VARCHAR(255), description TEXT, image_url TEXT, achievement_date DATE DEFAULT CURRENT_DATE);`);
        await pool.query(`CREATE TABLE IF NOT EXISTS qualifications (id SERIAL PRIMARY KEY, user_id INTEGER, type VARCHAR(50), title VARCHAR(255), organization VARCHAR(255), description TEXT, start_date DATE, end_date DATE, link_url TEXT, file_url TEXT);`);
        
        // 5. Column Hardening for Profiles
        const columns = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'profiles'");
        const existingCols = columns.rows.map(r => r.column_name);
        const repairs = {
            'is_published': 'BOOLEAN DEFAULT FALSE',
            'leetcode_username': 'VARCHAR(100)',
            'github_username': 'VARCHAR(100)',
            'public_email': 'VARCHAR(255)',
            'phone': 'VARCHAR(50)'
        };
        for (const [col, type] of Object.entries(repairs)) {
            if (!existingCols.includes(col)) {
                await pool.query(`ALTER TABLE profiles ADD COLUMN ${col} ${type}`);
            }
        }

        console.log("✅ [DB-INIT] All tables and columns are synchronized.");
    } catch (err) {
        console.warn("⚠️ [DB-INIT] Warning/Error during init:", err.message);
        // We don't exit(1) here to allow the server to try and run anyway
    }
}

module.exports = { initializeDatabase };

// Still allow running as a standalone script
if (require.main === module) {
    initializeDatabase().then(() => process.exit(0));
}
