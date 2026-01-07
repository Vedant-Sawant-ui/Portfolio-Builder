const pool = require('../config/db');

async function migrate() {
    try {
        await pool.query("ALTER TABLE profiles ADD COLUMN IF NOT EXISTS resume_url TEXT;");
        console.log("Migration successful: Added resume_url to profiles.");
        process.exit(0);
    } catch (err) {
        console.error("Migration failed:", err);
        process.exit(1);
    }
}

migrate();
