const express = require("express");
const router = express.Router();
const pool = require("../config/db");

// The "Magic" Link: career-boost.com/u/rahul
// The "Magic" Link: career-boost.com/rahul
router.get("/:username", async (req, res) => {
  const requestedUser = req.params.username;
  const viewerId = req.session ? req.session.user_id : null; // Who is looking?

  try {
    // 1. Find the User ID.
    // NOTE: This currently checks 'email'. If you want to check by a username column, change 'email' to 'username'
    const userResult = await pool.query(
      "SELECT id, username FROM users WHERE username = $1",
      [requestedUser]
    );
    if (userResult.rows.length === 0) {
      return res.status(404).send("Portfolio not found");
    }

    const userId = userResult.rows[0].id;

    // 2. Fetch all data in parallel (NOW INCLUDES SKILLS & ACHIEVEMENTS)
    let profileRes, projectsRes, socialsRes, skillsRes, achievementsRes, qualRes, projImgRes, achImgRes;

    try {
        [
            profileRes,
            projectsRes,
            socialsRes,
            skillsRes,
            achievementsRes,
            qualRes,
            projImgRes,
            achImgRes
        ] = await Promise.all([
            pool.query("SELECT * FROM profiles WHERE user_id = $1", [userId]),
            pool.query("SELECT * FROM projects WHERE user_id = $1", [userId]),
            pool.query("SELECT * FROM socials WHERE user_id = $1", [userId]),
            pool.query("SELECT * FROM skills WHERE user_id = $1", [userId]),
            pool.query("SELECT * FROM achievements WHERE user_id = $1 ORDER BY achievement_date DESC", [userId]),
            pool.query("SELECT * FROM qualifications WHERE user_id = $1 ORDER BY start_date DESC", [userId]),
            pool.query("SELECT pi.* FROM project_images pi JOIN projects p ON pi.project_id = p.id WHERE p.user_id = $1", [userId]).catch(e => { console.warn("Missing project_images table"); return { rows: [] }; }),
            pool.query("SELECT ai.* FROM achievement_images ai JOIN achievements a ON ai.achievement_id = a.id WHERE a.user_id = $1", [userId]).catch(e => { console.warn("Missing achievement_images table"); return { rows: [] }; })
        ]);
    } catch (dbErr) {
        console.error("Database Fetch Error:", dbErr.message);
        throw dbErr; // Still throw if core tables are missing
    }

    const userProfile = profileRes.rows[0];

    if (!userProfile) {
        return res.status(404).send("User profile not found. Please set up your profile in the dashboard.");
    }

    // --- SMART GATEKEEPING ---
    if (!userProfile.is_published && viewerId !== userId) {
       return res.render('private'); 
    }
    
    // Map images to projects
    const projects = projectsRes.rows.map(p => {
        p.images = projImgRes.rows.filter(img => img.project_id === p.id).map(i => i.image_url);
        return p;
    });

    // Map images to achievements
    const achievements = achievementsRes.rows.map(a => {
        a.images = achImgRes.rows.filter(img => img.achievement_id === a.id).map(i => i.image_url);
        return a;
    });

    // 3. Render the specific theme
    res.render("portfolio-template", {
      user: profileRes.rows[0],
      projects: projects,
      socials: socialsRes.rows,
      skills: skillsRes.rows,
      achievements: achievements,
      qualifications: qualRes.rows,
      theme: profileRes.rows[0].theme_preference || "minimalist",
    });
  } catch (err) {
    console.error("Portfolio Rendering Error:", err.stack);
    res.status(500).send("Server Error: " + err.message);
  }
});

module.exports = router;
