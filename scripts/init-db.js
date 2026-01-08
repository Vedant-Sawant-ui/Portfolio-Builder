const pool = require('../config/db');

async function initDB() {
    console.log("🚀 Starting Database Initialization...");
    try {
        // 1. Create Profiles Table (if not exists)
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
        console.log("✅ Profiles table ready.");

        // 2. Create API Usage Table
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
        console.log("✅ API Usage table ready.");

        // 3. Create Project Images Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS project_images (
                id SERIAL PRIMARY KEY,
                project_id INTEGER NOT NULL,
                image_url TEXT NOT NULL
            );
        `);
        console.log("✅ Project Images table ready.");

        // 4. Create Achievement Images Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS achievement_images (
                id SERIAL PRIMARY KEY,
                achievement_id INTEGER NOT NULL,
                image_url TEXT NOT NULL
            );
        `);
        console.log("✅ Achievement Images table ready.");

        // 5. Add any missing columns to profiles (e.g. for updates)
        const columns = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'profiles'");
        const existingColumns = columns.rows.map(r => r.column_name);
        
        if (!existingColumns.includes('is_published')) {
            await pool.query("ALTER TABLE profiles ADD COLUMN is_published BOOLEAN DEFAULT FALSE");
            console.log("➕ Added 'is_published' column.");
        }

        console.log("✨ Database Initialization Complete!");
        process.exit(0);
    } catch (err) {
        console.error("❌ Database Initialization Failed:", err);
        process.exit(1);
    }
}

initDB();
