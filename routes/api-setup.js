const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// 1. GET Route: Display the API Setup Form
router.get('/', async (req, res) => {
    try {
        // Use session ID (or hardcoded 1 for testing)
        const userId = req.session.user_id; 

        // Fetch existing data to pre-fill the form
        const result = await pool.query(
            'SELECT leetcode_username, github_username FROM profiles WHERE user_id = $1', 
            [userId]
        );

        res.render('api-setup', { 
            apiData: result.rows[0] || {} 
        });

    } catch (err) {
        console.error("Error fetching API data:", err);
        res.status(500).send("Server Error");
    }
});

// 2. POST Route: Save Usernames
router.post('/', async (req, res) => {
    if (!req.session || !req.session.user_id) {
        return res.redirect('/login');
    }
    try {
        const { leetcode_username, github_username } = req.body;
        const userId = req.session.user_id;

        // Update the profiles table
        // We use COALESCE to keep existing values if the user leaves a field blank
        const query = `
            UPDATE profiles 
            SET leetcode_username = $1, 
                github_username = $2 
            WHERE user_id = $3
        `;

        await pool.query(query, [leetcode_username, github_username, userId]);

        // Success! Redirect back to the main dashboard
        res.redirect('/dashboard');

    } catch (err) {
        console.error("Error saving API settings:", err);
        res.status(500).send("Server Error");
    }
});

module.exports = router;