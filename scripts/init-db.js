const pool = require('../config/db');

async function initializeDatabase() {
    console.log("🚀 [DB-INIT] Starting Forced Synchronization...");
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Users
        await client.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(255) UNIQUE NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                is_verified BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_DATE
            );
        `);
        console.log("✅ [DB-INIT] users table verified.");

        // 2. Profiles
        await client.query(`
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
        console.log("✅ [DB-INIT] profiles table verified.");

        // 3. API Usage
        await client.query(`
            CREATE TABLE IF NOT EXISTS api_usage (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL,
                api_type VARCHAR(50) NOT NULL,
                count INTEGER DEFAULT 0,
                usage_date DATE DEFAULT CURRENT_DATE,
                UNIQUE(user_id, api_type, usage_date)
            );
        `);
        console.log("✅ [DB-INIT] api_usage table verified.");

        // 4. Content Tables
        await client.query(`CREATE TABLE IF NOT EXISTS project_images (id SERIAL PRIMARY KEY, project_id INTEGER NOT NULL, image_url TEXT NOT NULL);`);
        await client.query(`CREATE TABLE IF NOT EXISTS achievement_images (id SERIAL PRIMARY KEY, achievement_id INTEGER NOT NULL, image_url TEXT NOT NULL);`);
        await client.query(`CREATE TABLE IF NOT EXISTS skills (id SERIAL PRIMARY KEY, user_id INTEGER, skill_name VARCHAR(255), proficiency_level VARCHAR(50) DEFAULT 'Intermediate');`);
        await client.query(`CREATE TABLE IF NOT EXISTS projects (id SERIAL PRIMARY KEY, user_id INTEGER, title VARCHAR(255), description TEXT, project_link TEXT, thumbnail_url TEXT);`);
        await client.query(`CREATE TABLE IF NOT EXISTS socials (id SERIAL PRIMARY KEY, user_id INTEGER, platform_name VARCHAR(255), platform_url TEXT);`);
        await client.query(`CREATE TABLE IF NOT EXISTS achievements (id SERIAL PRIMARY KEY, user_id INTEGER, title VARCHAR(255), description TEXT, image_url TEXT, achievement_date DATE DEFAULT CURRENT_DATE);`);
        await client.query(`CREATE TABLE IF NOT EXISTS qualifications (id SERIAL PRIMARY KEY, user_id INTEGER, type VARCHAR(50), title VARCHAR(255), organization VARCHAR(255), description TEXT, start_date DATE, end_date DATE, link_url TEXT, file_url TEXT);`);
        
        console.log("✅ [DB-INIT] Content tables verified.");

        // 5. Column Verification
        const res = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'profiles'");
        const existing = res.rows.map(r => r.column_name);
        const missing = {
            'is_published': 'BOOLEAN DEFAULT FALSE',
            'leetcode_username': 'VARCHAR(100)',
            'github_username': 'VARCHAR(100)',
            'public_email': 'VARCHAR(255)',
            'phone': 'VARCHAR(50)'
        };

        for (const [col, info] of Object.entries(missing)) {
            if (!existing.includes(col)) {
                await client.query(`ALTER TABLE profiles ADD COLUMN ${col} ${info}`);
                console.log(`➕ [DB-INIT] Added missing column: ${col}`);
            }
        }

        await client.query('COMMIT');
        console.log("✨ [DB-INIT] Database is fully synchronized!");
    } catch (err) {
        await client.query('ROLLBACK');
        console.error("❌ [DB-INIT] Fatal Error during sync:", err.message);
        throw err;
    } finally {
        client.release();
    }
}

module.exports = { initializeDatabase };

if (require.main === module) {
    initializeDatabase().then(() => process.exit(0)).catch(() => process.exit(1));
}
