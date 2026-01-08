const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const multer = require("multer");
const path = require("path");
const fs = require('fs');
const pdf = require('pdf-parse');
// AI Service Import
const { generateText } = require("../services/aiService");

const { parser } = require("../services/cloudinaryService");
const upload = parser;

// ==================================================
// 1. GET Request: Render the Dashboard
// ==================================================
router.get("/", async (req, res) => {
  if (!req.session || !req.session.user_id) return res.redirect("/login");
  const userId = req.session.user_id;

  try {
    const [profileRes, projectsRes, skillsRes, achievementsRes, socialsRes, qualRes] =
      await Promise.all([
        pool.query("SELECT * FROM profiles WHERE user_id = $1", [userId]),
        pool.query("SELECT * FROM projects WHERE user_id = $1", [userId]),
        pool.query("SELECT * FROM skills WHERE user_id = $1", [userId]),
        pool.query(
          "SELECT * FROM achievements WHERE user_id = $1 ORDER BY achievement_date DESC",
          [userId]
        ),
        pool.query("SELECT * FROM socials WHERE user_id = $1", [userId]),
        pool.query("SELECT * FROM qualifications WHERE user_id = $1 ORDER BY start_date DESC", [userId]),
      ]);

    const socialsMap = {};
    socialsRes.rows.forEach((row) => {
      socialsMap[row.platform_name] = row.platform_url;
    });

    const userProfile = profileRes.rows[0] || {
      full_name: "Student",
      theme_preference: "static_minimalist",
      bio: "",
    };

    const baseUrl = req.protocol + '://' + req.get('host');

    res.render("dashboard", {
      profile: userProfile,
      projects: projectsRes.rows,
      skills: skillsRes.rows,
      achievements: achievementsRes.rows,
      socialsMap: socialsMap,
      qualifications: qualRes.rows,
      username: req.session.username,
      user: { username: req.session.username }, // Ensure user object exists for header
      baseUrl: baseUrl
    });
  } catch (err) {
    console.error("Dashboard Crash:", err);
    res.status(500).send("Dashboard Error");
  }
});


// ==================================================
// 2. POST Actions
// ==================================================

// A. Save Socials
router.post('/save-socials', async (req, res) => {
    if (!req.session.user_id) return res.redirect('/login');
    const userId = req.session.user_id;
    const { public_email, phone, linkedin, github, instagram, facebook, youtube, naukri } = req.body;

    try {
        await pool.query('UPDATE profiles SET public_email = $1, phone = $2 WHERE user_id = $3', 
            [public_email, phone, userId]);

        await pool.query('DELETE FROM socials WHERE user_id = $1', [userId]);

        const platforms = { linkedin, github, instagram, facebook, youtube, naukri };
        for (const [name, url] of Object.entries(platforms)) {
            if (url && url.trim() !== "") {
                await pool.query(
                    'INSERT INTO socials (user_id, platform_name, platform_url) VALUES ($1, $2, $3)',
                    [userId, name, url]
                );
            }
        }
        res.redirect('/dashboard');
    } catch (err) {
        console.error(err);
        res.status(500).send("Error saving socials");
    }
});

// B. Save Skills (New Route)
router.post('/save-skills', async (req, res) => {
    if (!req.session.user_id) return res.redirect('/login');
    const userId = req.session.user_id;
    const { skills } = req.body; // Expecting array: skills[]

    try {
        await pool.query('DELETE FROM skills WHERE user_id = $1', [userId]);
        
        if (skills && Array.isArray(skills)) {
             for (const skill of skills) {
                if(skill.trim() !== "") {
                    await pool.query(
                        'INSERT INTO skills (user_id, skill_name, proficiency_level) VALUES ($1, $2, $3)',
                        [userId, skill.trim(), 'Intermediate']
                    );
                }
            }
        } else if (skills && typeof skills === 'string') {
             // Handle single skill case
              if(skills.trim() !== "") {
                await pool.query(
                    'INSERT INTO skills (user_id, skill_name, proficiency_level) VALUES ($1, $2, $3)',
                    [userId, skills.trim(), 'Intermediate']
                );
            }
        }

        res.redirect('/dashboard');
    } catch (err) {
        console.error("Save Skills Error:", err);
        res.status(500).send("Error saving skills");
    }
});

// C. Save Profile (General & Theme)
router.post('/save-profile', upload.fields([{ name: 'profile_pic', maxCount: 1 }, { name: 'resume', maxCount: 1 }]), async (req, res) => {
    if (!req.session.user_id) return res.redirect('/login');
    const userId = req.session.user_id;
    
    // Note: 'theme_preference' comes from the form.
    const { full_name, bio, theme_preference } = req.body;
    
    let profile_pic_url = undefined; 
    let resume_url = undefined;

    // Check if req.files exists before accessing
    if (req.files) {
        if (req.files['profile_pic']) {
            profile_pic_url = req.files['profile_pic'][0].path;
        }
        if (req.files['resume']) {
            resume_url = req.files['resume'][0].path;
        }
    }

    try {
        // Fetch existing profile first
        const checkRes = await pool.query('SELECT * FROM profiles WHERE user_id = $1', [userId]);
        
        if (checkRes.rows.length === 0) {
            // Create new
            await pool.query(
                `INSERT INTO profiles (user_id, full_name, bio, theme_preference, profile_pic_url, resume_url)
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [
                    userId, 
                    full_name || '', 
                    bio || '', 
                    theme_preference || 'static_minimalist', // Default theme
                    profile_pic_url || null, 
                    resume_url || null
                ]
            );
        } else {
            // Update existing - Only update fields that are provided
            // This allows the Theme Form (only sends theme_preference) and Profile Form (sends name/bio) to work independently
            
            const current = checkRes.rows[0];
            
            await pool.query(
                `UPDATE profiles 
                 SET full_name = $1, 
                     bio = $2, 
                     theme_preference = $3, 
                     profile_pic_url = $4, 
                     resume_url = $5
                 WHERE user_id = $6`,
                [
                    full_name !== undefined ? full_name : current.full_name,
                    bio !== undefined ? bio : current.bio,
                    theme_preference !== undefined ? theme_preference : current.theme_preference,
                    profile_pic_url !== undefined ? profile_pic_url : current.profile_pic_url, // Only overwrite if new file
                    resume_url !== undefined ? resume_url : current.resume_url,
                    userId
                ]
            );
        }
        

        
        if (full_name !== undefined) { // Check if full_name was sent
             await pool.query('UPDATE profiles SET full_name = $1 WHERE user_id = $2', [full_name, userId]);
        }
        
        if (bio !== undefined) {
             await pool.query('UPDATE profiles SET bio = $1 WHERE user_id = $2', [bio, userId]);
        }

        if (profile_pic_url) {
            await pool.query('UPDATE profiles SET profile_pic_url = $1 WHERE user_id = $2', [profile_pic_url, userId]);
        }
        
        if (resume_url) {
            await pool.query('UPDATE profiles SET resume_url = $1 WHERE user_id = $2', [resume_url, userId]);
        }

        res.redirect('/dashboard');

    } catch (err) {
        console.error("Save Profile Error:", err);
        res.status(500).send("Error saving profile");
    }
});


// D. Projects: Add, Edit, Delete
router.post('/add-project', upload.single('project_image'), async (req, res) => {
    if (!req.session.user_id) return res.redirect('/login');
    const { title, description, project_link, thumbnail_url } = req.body;
    let finalThumbnail = thumbnail_url;
    if (req.file) finalThumbnail = req.file.path;

    try {
        await pool.query(
            'INSERT INTO projects (user_id, title, description, project_link, thumbnail_url) VALUES ($1, $2, $3, $4, $5)',
            [req.session.user_id, title, description, project_link, finalThumbnail]
        );
        res.redirect('/dashboard');
    } catch (e) {
        console.error(e);
        res.status(500).send('Error adding project');
    }
});

router.get('/edit-project/:id', async (req, res) => {
    if (!req.session.user_id) return res.redirect('/login');
    try {
        const r = await pool.query('SELECT * FROM projects WHERE id = $1 AND user_id = $2', [req.params.id, req.session.user_id]);
        if(r.rows.length === 0) return res.redirect('/dashboard');
        res.render('edit-project', { project: r.rows[0] });
    } catch(e) { console.error(e); res.redirect('/dashboard'); }
});

router.post('/edit-project/:id', upload.single('project_image'), async (req, res) => {
    if (!req.session.user_id) return res.redirect('/login');
    const { title, description, project_link } = req.body;
    try {
        let q = 'UPDATE projects SET title=$1, description=$2, project_link=$3';
        let p = [title, description, project_link];
        let idx = 4;
        if(req.file) {
            q += `, thumbnail_url=$${idx}`;
            p.push(req.file.path);
            idx++;
        }
        q += ` WHERE id=$${idx} AND user_id=$${idx+1}`;
        p.push(req.params.id, req.session.user_id);
        await pool.query(q, p);
        res.redirect('/dashboard');
    } catch(e) { console.error(e); res.status(500).send('Error'); }
});

router.post('/delete-project/:id', async (req, res) => {
    if (!req.session.user_id) return res.redirect('/login');
    await pool.query('DELETE FROM projects WHERE id=$1 AND user_id=$2', [req.params.id, req.session.user_id]);
    res.redirect('/dashboard');
});


// E. Achievements: Delete (Edit logic below if needed)
router.post('/delete-achievement/:id', async (req, res) => {
     if (!req.session.user_id) return res.redirect('/login');
    await pool.query('DELETE FROM achievements WHERE id=$1 AND user_id=$2', [req.params.id, req.session.user_id]);
    res.redirect('/dashboard');
});

// Edit Achievement Routes
router.get('/edit-achievement/:id', async (req, res) => {
    if (!req.session.user_id) return res.redirect('/login');
    try {
        const r = await pool.query('SELECT * FROM achievements WHERE id = $1 AND user_id = $2', [req.params.id, req.session.user_id]);
        if(r.rows.length === 0) return res.redirect('/dashboard');
        res.render('edit-achievement', { achievement: r.rows[0] });
    } catch(e) { console.error(e); res.redirect('/dashboard'); }
});

router.post('/edit-achievement/:id', upload.single('achievement_image'), async (req, res) => {
    if (!req.session.user_id) return res.redirect('/login');
    const { title, description, achievement_date } = req.body;
    try {
        let q = 'UPDATE achievements SET title=$1, description=$2, achievement_date=$3';
        let p = [title, description, achievement_date];
        let idx = 4;
        if(req.file) {
            q += `, image_url=$${idx}`;
            p.push(`/uploads/${req.file.filename}`);
            idx++;
        }
        q += ` WHERE id=$${idx} AND user_id=$${idx+1}`;
        p.push(req.params.id, req.session.user_id);
        await pool.query(q, p);
        res.redirect('/dashboard');
    } catch(e) { console.error(e); res.status(500).send('Error'); }
});


// F. Qualifications
router.post('/add-qualification', upload.single('qual_file'), async (req, res) => {
    if (!req.session.user_id) return res.redirect('/login');
    const { type, title, organization, description, start_date, end_date, link_url } = req.body;
    let file = null; if(req.file) file = req.file.path;
    try {
        await pool.query('INSERT INTO qualifications (user_id, type, title, organization, description, start_date, end_date, link_url, file_url) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)',
        [req.session.user_id, type, title, organization, description, start_date||null, end_date||null, link_url, file]);
        res.redirect('/dashboard');
    } catch(e) { console.error(e); res.status(500).send('Error'); }
});

router.post('/delete-qualification/:id', async(req,res)=>{
    if (!req.session.user_id) return res.redirect('/login');
    await pool.query('DELETE FROM qualifications WHERE id=$1 AND user_id=$2', [req.params.id, req.session.user_id]);
    res.redirect('/dashboard');
});


// G. Toggle Publish
router.post('/toggle-publish', async (req, res) => {
    if (!req.session.user_id) return res.redirect('/login');
    const r = await pool.query('SELECT is_published FROM profiles WHERE user_id=$1', [req.session.user_id]);
    await pool.query('UPDATE profiles SET is_published=$1 WHERE user_id=$2', [!r.rows[0].is_published, req.session.user_id]);
    res.redirect('/dashboard');
});


// ==================================================
// 3. AI Features
// ==================================================

// Upgrade Text
router.post('/api/upgrade-text', async (req, res) => {
    if (!req.session.user_id) return res.status(401).json({ error: 'Unauthorized' });
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'No text provided' });
    try {
        const prompt = `Upgrade or improve the following text in terms of english and grammar. Return ONLY the improved text, no explanation or conversational filler. Text: "${text}"`;
        
        let upgradedText = await generateText(prompt, req.session.user_id);
        upgradedText = upgradedText.trim();
        if (upgradedText.startsWith('"') && upgradedText.endsWith('"')) {
            upgradedText = upgradedText.slice(1, -1);
        }
        res.json({ upgradedText });
    } catch(e) { console.error(e); res.status(500).json({error: 'AI Error: ' + e.message}); }
});

// Parse Resume and Autofill
const memoryStorage = multer.memoryStorage();
const memoryUpload = multer({ storage: memoryStorage });

router.post('/api/parse-resume', memoryUpload.single('resume'), async (req, res) => {
    if (!req.session.user_id) return res.redirect('/dashboard');
    const userId = req.session.user_id;

    if (!req.file || !req.file.buffer) {
        console.error("❌ No file buffer received");
        return res.redirect('/dashboard');
    }

    // Capture buffer first
    const dataBuffer = req.file.buffer;
    console.log(`📦 Resume received in memory. Size: ${dataBuffer.byteLength} bytes`);

    // 1. Upload to Cloudinary in background (or wait if we need URL)
    // We already have the 'upload' (cloudinary parser) at the top of the file, 
    // but for Autofill we want the TEXT immediately.
    // Let's use the buffer for parsing and then save to Cloudinary.
    
    try {
        // Upload to Cloudinary (using memory buffer)
        const uploadResult = await new Promise((resolve, reject) => {
            const stream = require('../services/cloudinaryService').cloudinary.uploader.upload_stream(
                { folder: 'portfolio_builder', resource_type: 'auto' },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            );
            stream.end(dataBuffer);
        });

        const resumeUrl = uploadResult.secure_url;
        await pool.query('UPDATE profiles SET resume_url = $1 WHERE user_id = $2', [resumeUrl, userId]);
        console.log(`✅ Resume saved to Cloudinary: ${resumeUrl}`);

        // 2. Parse PDF Text
        const pdfData = await pdf(dataBuffer); 
        const extractedText = pdfData.text;

        if (!extractedText || extractedText.trim().length === 0) {
            console.warn("⚠️ PDF parsed but no text was extracted.");
            return res.redirect('/dashboard');
        }

        // Comprehensive Prompt
        const prompt = `
            You are an expert Resume Parser. Extract all possible information from this resume text into a valid JSON object.
            
            Required Keys:
            - "full_name": (string) The candidate's full name.
            - "bio": (string) A professional summary/bio (max 300 chars).
            - "public_email": (string) Email found in resume.
            - "phone": (string) Phone number found.
            - "skills": (array of strings) List of technical or professional skills.
            - "socials": (object) Map platform names to URLs (e.g., {"linkedin": "url", "github": "url", "portfolio": "url"}).
            - "projects": (array of objects) { "title": "...", "description": "..." }.
            - "achievements": (array of objects) { "title": "...", "description": "...", "date": "YYYY-MM-DD" (guess if missing) }.
            - "qualifications": (array of objects) { "title": "...", "type": "Education" or "Experience", "organization": "...", "description": "...", "start_date": "YYYY-MM-DD", "end_date": "YYYY-MM-DD" }.

            Resume Text:
            ${extractedText}

            Return ONLY raw JSON. No markdown formatting.
        `;
        
        const jsonResponse = await generateText(prompt, req.session.user_id);
        let jsonStr = jsonResponse.replace(/```json/g, '').replace(/```/g, '').trim();
        
        let data = {};
        try {
            data = JSON.parse(jsonStr);
        } catch (parseError) {
            console.error("AI JSON Parse Error:", parseError);
            console.log("Raw Response received:", jsonStr);
            data = {}; 
        }

        // 1. Update Profile (Name, Bio, Contact)
        if (data.full_name || data.bio || data.public_email || data.phone) {
             await pool.query(
                `UPDATE profiles 
                 SET full_name = COALESCE($1, full_name), 
                     bio = COALESCE($2, bio),
                     public_email = COALESCE($3, public_email),
                     phone = COALESCE($4, phone)
                 WHERE user_id = $5`,
                [data.full_name || null, data.bio || null, data.public_email || null, data.phone || null, userId]
             );
        }

        // 2. Update Skills (Replace existing)
        if (data.skills && Array.isArray(data.skills) && data.skills.length > 0) {
            await pool.query('DELETE FROM skills WHERE user_id = $1', [userId]);
            for (const skill of data.skills) {
                if (typeof skill === 'string' && skill.trim().length > 0) {
                    await pool.query(
                        'INSERT INTO skills (user_id, skill_name, proficiency_level) VALUES ($1, $2, $3)',
                        [userId, skill.trim(), 'Intermediate']
                    );
                }
            }
        }

        // 3. Update Socials (Replace existing)
        if (data.socials && typeof data.socials === 'object') {
            await pool.query('DELETE FROM socials WHERE user_id = $1', [userId]);
            for (const [platform, url] of Object.entries(data.socials)) {
                if (url && typeof url === 'string') {
                    let pName = platform.toLowerCase();
                    if(pName.includes('linked')) pName = 'linkedin';
                    else if(pName.includes('git')) pName = 'github';
                    
                    await pool.query(
                        'INSERT INTO socials (user_id, platform_name, platform_url) VALUES ($1, $2, $3)',
                        [userId, pName, url]
                    );
                }
            }
        }

        // 4. Insert Projects (Append)
        if(data.projects && Array.isArray(data.projects)) {
            for(const p of data.projects) {
                if(p.title) {
                    await pool.query('INSERT INTO projects (user_id, title, description) VALUES ($1,$2,$3)', [userId, p.title, p.description||'']);
                }
            }
        }

        // 5. Insert Achievements (Append)
        if(data.achievements && Array.isArray(data.achievements)) {
            for(const a of data.achievements) {
                if(a.title) {
                    await pool.query('INSERT INTO achievements (user_id, title, description, achievement_date) VALUES ($1,$2,$3,$4)', [userId, a.title, a.description||'', a.date || new Date()]);
                }
            }
        }

        // 6. Insert Qualifications (Append)
        if(data.qualifications && Array.isArray(data.qualifications)) {
             for(const q of data.qualifications) {
                if(q.title) {
                    await pool.query('INSERT INTO qualifications (user_id, type, title, organization, description, start_date, end_date) VALUES ($1,$2,$3,$4,$5,$6,$7)', 
                        [userId, q.type||'Education', q.title, q.organization||'School', q.description||'', q.start_date || null, q.end_date || null]);
                }
             }
        }
        
        console.log("✅ Autofill completed successfully.");

    } catch(e) { 
        console.error("❌ Autofill Error:", e.message); 
    }

    res.redirect('/dashboard');
});


// Forms
router.get("/add-project", (req, res) => { if (req.session.user_id) res.render("add-project"); else res.redirect("/login"); });
router.get("/add-qualification", (req, res) => { if (req.session.user_id) res.render("add-qualification"); else res.redirect("/login"); });

// API Setup
// API Setup: GET
router.get("/api-setup", async (req, res) => {
    if (!req.session.user_id) return res.redirect('/login');
    const userId = req.session.user_id;
    
    try {
        const result = await pool.query('SELECT leetcode_username, github_username FROM profiles WHERE user_id = $1', [userId]);
        const apiData = result.rows[0] || {};
        
        res.render("api-setup", { 
            apiData: apiData, 
            user: { username: req.session.username } 
        });
    } catch (err) {
        console.error("API Setup Data Fetch Error:", err);
        res.render("api-setup", { 
            apiData: {}, 
            user: { username: req.session.username } 
        });
    }
});

// API Setup: POST
router.post("/api-setup", async (req, res) => {
    if (!req.session.user_id) return res.redirect('/login');
    const userId = req.session.user_id;
    const { leetcode_username, github_username } = req.body;

    try {
        await pool.query(
            `UPDATE profiles 
             SET leetcode_username = $1, 
                 github_username = $2 
             WHERE user_id = $3`,
            [leetcode_username || null, github_username || null, userId]
        );
        res.redirect('/dashboard');
    } catch (err) {
        console.error("API Setup Save Error:", err);
        res.redirect('/dashboard/api-setup');
    }
});

module.exports = router;
