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

        // 5. Create Skills, Projects, Socials, Achievements, Qualifications (Essentials)
        await pool.query(`CREATE TABLE IF NOT EXISTS skills (id SERIAL PRIMARY KEY, user_id INTEGER, skill_name VARCHAR(255), proficiency_level VARCHAR(50) DEFAULT 'Intermediate');`);
        await pool.query(`CREATE TABLE IF NOT EXISTS projects (id SERIAL PRIMARY KEY, user_id INTEGER, title VARCHAR(255), description TEXT, project_link TEXT, thumbnail_url TEXT);`);
        await pool.query(`CREATE TABLE IF NOT EXISTS socials (id SERIAL PRIMARY KEY, user_id INTEGER, platform_name VARCHAR(255), platform_url TEXT);`);
        await pool.query(`CREATE TABLE IF NOT EXISTS achievements (id SERIAL PRIMARY KEY, user_id INTEGER, title VARCHAR(255), description TEXT, image_url TEXT, achievement_date DATE DEFAULT CURRENT_DATE);`);
        await pool.query(`CREATE TABLE IF NOT EXISTS qualifications (id SERIAL PRIMARY KEY, user_id INTEGER, type VARCHAR(50), title VARCHAR(255), organization VARCHAR(255), description TEXT, start_date DATE, end_date DATE, link_url TEXT, file_url TEXT);`);
        
        console.log("✅ All data tables checked/created.");

        // 6. Add any missing columns to profiles
        const columns = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'profiles'");
        const existingColumns = columns.rows.map(r => r.column_name);
        
        const missingCols = {
            'is_published': 'BOOLEAN DEFAULT FALSE',
            'leetcode_username': 'VARCHAR(100)',
            'github_username': 'VARCHAR(100)',
            'public_email': 'VARCHAR(255)',
            'phone': 'VARCHAR(50)'
        };

        for (const [col, type] of Object.entries(missingCols)) {
            if (!existingColumns.includes(col)) {
                await pool.query(`ALTER TABLE profiles ADD COLUMN ${col} ${type}`);
                console.log(`➕ Added missing column: ${col}`);
            }
        }

        console.log("✨ Database Initialization Complete!");
        process.exit(0);
    } catch (err) {
        console.error("❌ Database Initialization Failed:", err);
        process.exit(1);
    }
}

initDB();
