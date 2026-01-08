const pool = require('../config/db');

const LIMITS = {
    GEMINI: 3,
    GITHUB: 3
};

/**
 * Checks if a user has reached their daily limit for a specific API.
 * @param {number} userId 
 * @param {string} apiType 
 * @returns {Promise<boolean>} - True if they have remaining quota.
 */
async function checkQuota(userId, apiType) {
    if (!userId) return true; 
    
    try {
        const limit = LIMITS[apiType] || 3;
        const result = await pool.query(
            'SELECT count FROM api_usage WHERE user_id = $1 AND api_type = $2 AND usage_date = CURRENT_DATE',
            [userId, apiType]
        );

        if (result.rows.length === 0) return true;
        return result.rows[0].count < limit;
    } catch (err) {
        console.warn("⚠️ Usage tracking failed (Table missing?):", err.message);
        return true; // Fail-open: allow the request
    }
}

/**
 * Increments the usage count for a user.
 */
async function incrementUsage(userId, apiType) {
    if (!userId) return;
    
    try {
        await pool.query(
            `INSERT INTO api_usage (user_id, api_type, count) 
             VALUES ($1, $2, 1) 
             ON CONFLICT (user_id, api_type, usage_date) 
             DO UPDATE SET count = api_usage.count + 1`,
            [userId, apiType]
        );
    } catch (err) {
        console.warn("⚠️ Failed to increment usage:", err.message);
    }
}

module.exports = {
    checkQuota,
    incrementUsage,
    LIMITS
};
