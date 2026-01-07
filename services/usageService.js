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
    if (!userId) return true; // Bypass for non-logged-in (e.g. registration flow before user exists)
    
    const limit = LIMITS[apiType] || 3;
    const result = await pool.query(
        'SELECT count FROM api_usage WHERE user_id = $1 AND api_type = $2 AND usage_date = CURRENT_DATE',
        [userId, apiType]
    );

    if (result.rows.length === 0) return true;
    return result.rows[0].count < limit;
}

/**
 * Increments the usage count for a user.
 */
async function incrementUsage(userId, apiType) {
    if (!userId) return;
    
    await pool.query(
        `INSERT INTO api_usage (user_id, api_type, count) 
         VALUES ($1, $2, 1) 
         ON CONFLICT (user_id, api_type, usage_date) 
         DO UPDATE SET count = api_usage.count + 1`,
        [userId, apiType]
    );
}

module.exports = {
    checkQuota,
    incrementUsage,
    LIMITS
};
