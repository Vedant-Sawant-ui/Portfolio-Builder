const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const multer = require("multer");
const path = require("path");

// 1. Configure Multer for Achievements
const storage = multer.diskStorage({
  destination: "./public/uploads/",
  filename: function (req, file, cb) {
    cb(null, "achievement-" + Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage: storage });

// GET: Show the form
router.get("/", (req, res) => {
  if (!req.session || !req.session.user_id) return res.redirect("/login");
  res.render("achievements");
});

// POST: Save achievements (Handles up to 10 files)
// We use 'achievement_files' to match the EJS input name
// POST: Save achievements (Handles up to 10 files)
// We use 'achievement_files' to match the EJS input name
// POST: Save achievements (Handles up to 20 files - Increased from 10)
router.post("/", (req, res, next) => {
    const uploadFunc = upload.array('achievement_files', 20);
    uploadFunc(req, res, async function(err) {
        if (err instanceof multer.MulterError) {
             console.error("Multer Error:", err);
             // Since this page uses separate render, we might need to pass error query or flash
             // Assuming dashboard handles flash messages if we redirect there? 
             // Ideally we should redirect back to /dashboard/achievements with error, but let's send to dashboard for simplicity or res.send
             return res.status(400).send(`Upload Error: ${err.message}. Please go back and try fewer files.`);
        } else if (err) {
             console.error("Unknown Upload Error:", err);
             return res.status(500).send("An unknown error occurred during file upload.");
        }

        // Proceed
        if (!req.session || !req.session.user_id) return res.redirect("/login");

        try {
            const userId = req.session.user_id;
            let { title, description, date } = req.body;

            // Handle potential array input if old form was used (robustness), but expect strings
            if (Array.isArray(title)) title = title[0];
            if (Array.isArray(description)) description = description[0];
            if (Array.isArray(date)) date = date[0];

            const safeDate = date ? date : null;
            let mainImageUrl = null;

            // Use first file as the main/thumbnail image
            if (req.files && req.files.length > 0) {
                mainImageUrl = `/uploads/${req.files[0].filename}`;
            }

            // 1. Insert Achievement
            const newAch = await pool.query(
                `INSERT INTO achievements (user_id, title, description, achievement_date, category, image_url) 
                 VALUES ($1, $2, $3, $4, 'General', $5) RETURNING id`,
                [userId, title, description, safeDate, mainImageUrl]
            );
            const achievementId = newAch.rows[0].id;

            // 2. Insert Additional Images (store ALL in achievement_images for completeness)
            if (req.files && req.files.length > 0) {
                for (const file of req.files) {
                    const imgUrl = `/uploads/${file.filename}`;
                    await pool.query(
                        'INSERT INTO achievement_images (achievement_id, image_url) VALUES ($1, $2)',
                        [achievementId, imgUrl]
                    );
                }
            }

            res.redirect("/dashboard");
        } catch (err) {
            console.error("Achievements Error:", err.message);
            res.status(500).send("Server Error: " + err.message);
        }
    });
});

module.exports = router;