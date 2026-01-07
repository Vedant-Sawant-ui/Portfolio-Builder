const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const bcrypt = require('bcrypt');
const { sendOTPEmail } = require('../services/emailService');
const crypto = require('crypto');

const admin = require('../services/firebaseService');

// 1. GET Register Page
router.get('/register', (req, res) => {
    if (req.session.user_id) return res.redirect('/dashboard');
    res.render('register', { errors: [] });
});

// 2. POST Register (Step 1: Username & Email -> Send OTP)
router.post('/register', async (req, res) => {
    const { email, username } = req.body;
    let errors = [];

    if (!email || !username) {
        errors.push({ msg: 'Please fill in all fields' });
        return res.render('register', { errors, email, username });
    }

    try {
        // Check if user exists in DB
        const userCheck = await pool.query('SELECT * FROM users WHERE email = $1 OR username = $2', [email, username]);
        if (userCheck.rows.length > 0) {
            let msg = 'Email or Username already exists';
            if (userCheck.rows.some(u => u.email === email)) msg = 'Email already registered';
            if (userCheck.rows.some(u => u.username === username)) msg = 'Username already taken';
            
            return res.render('register', { 
                errors: [{ msg }],
                email,
                username 
            });
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes validity

        // Save OTP to DB for registration verification
        await pool.query(
            'INSERT INTO password_reset_otps (email, otp, expires_at) VALUES ($1, $2, $3)',
            [email, otp, expiresAt]
        );

        // Send OTP Email
        await sendOTPEmail(email, otp);

        // Store temp registration data in session
        req.session.temp_user = { email, username };

        res.redirect(`/verify-otp?mode=register&email=${encodeURIComponent(email)}`);

    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// 3. GET Login Page
router.get('/login', (req, res) => {
    if (req.session.user_id) return res.redirect('/dashboard');
    res.render('login');
});

// 4. POST Login Logic
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        
        if (result.rows.length === 0) {
            req.flash('error_msg', 'Alert: Email not found. Please Register first and then Login.');
            return res.redirect('/login');
        }

        try {
            if (admin.apps.length > 0) {
                await admin.auth().getUserByEmail(email);
                console.log(`✅ User ${email} verified in Firebase`);
            }
        } catch (fbErr) {
            console.warn('⚠️ Firebase Login Sync Warning:', fbErr.message);
        }

        const user = result.rows[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (isMatch) {
            req.session.user_id = user.id;
            req.session.username = user.username;
            return res.redirect('/dashboard');
        } else {
            req.flash('error_msg', 'Alert: Password incorrect. Please Register first if you don\'t have an account.');
            return res.redirect('/login');
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// 5. Logout
router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) throw err;
        res.redirect('/login');
    });
});

// --- PASSWORD RESET & REGISTRATION OTP FLOW ---

// GET Verify OTP
router.get('/verify-otp', (req, res) => {
    const { email, mode } = req.query;
    res.render('verify-otp', { email, mode });
});

// POST Verify OTP
router.post('/verify-otp', async (req, res) => {
    const { email, otp, mode } = req.body;
    try {
        const result = await pool.query(
            'SELECT * FROM password_reset_otps WHERE email = $1 AND otp = $2 AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1',
            [email, otp]
        );

        if (result.rows.length === 0) {
            if (mode === 'register') {
                req.flash('error', 'Invalid or expired OTP. Please start again.');
                return res.redirect('/register');
            }
            return res.render('verify-otp', { email, mode, error_msg: 'Invalid or expired OTP' });
        }

        if (mode === 'register') {
            req.session.verified_email = email;
            res.redirect('/set-password');
        } else {
            res.render('reset-password', { email, otp });
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// GET Set Password (for new users)
router.get('/set-password', (req, res) => {
    if (!req.session.verified_email || !req.session.temp_user) {
        return res.redirect('/register');
    }
    res.render('reset-password', { 
        email: req.session.verified_email, 
        otp: 'REGISTRATION', 
        is_new_user: true 
    });
});

// POST Set Password / Reset Password
router.post('/reset-password', async (req, res) => {
    const { email, otp, password, confirm_password, is_new_user } = req.body;
    
    if (password !== confirm_password) {
        return res.render('reset-password', { email, otp, is_new_user, error_msg: 'Passwords do not match' });
    }

    try {
        if (!is_new_user) {
            // Double check OTP validity for Reset flow
            const otpCheck = await pool.query(
                'SELECT * FROM password_reset_otps WHERE email = $1 AND otp = $2 AND expires_at > NOW()',
                [email, otp]
            );
            if (otpCheck.rows.length === 0) {
                req.flash('error_msg', 'Session expired. Please start again.');
                return res.redirect('/forgot-password');
            }
        } else {
            // New User Registration Finalization
            if (email !== req.session.verified_email) {
                return res.redirect('/register');
            }
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        if (is_new_user) {
            const { username } = req.session.temp_user;
            
            try {
                // --- FIREBASE SYNC ---
                try {
                    if (admin.apps.length > 0) {
                        await admin.auth().createUser({ email, password, displayName: username });
                        console.log(`✅ User ${email} created in Firebase`);
                    }
                } catch (fbErr) {
                    console.warn('⚠️ Firebase Sync Warning:', fbErr.message);
                }

                // Insert Local User
                const newUser = await pool.query(
                    'INSERT INTO users (email, username, password_hash) VALUES ($1, $2, $3) RETURNING id',
                    [email, username, passwordHash]
                );

                // Create Profile
                await pool.query('INSERT INTO profiles (user_id, full_name, theme_preference) VALUES ($1, $2, $3)', 
                    [newUser.rows[0].id, 'New Student', 'static_minimalist']);

                // Cleanup session
                delete req.session.temp_user;
                delete req.session.verified_email;

                req.flash('success_msg', 'Account created successfully! You can now log in.');
                return res.redirect('/login');
            } catch (dbErr) {
                if (dbErr.code === '23505') {
                    req.flash('error', 'Email or username already exists. Please start again.');
                    return res.redirect('/register');
                }
                throw dbErr; // Let the outer catch handle other errors
            }
        } else {
            // Reset Password logic
            await pool.query('UPDATE users SET password_hash = $1 WHERE email = $2', [passwordHash, email]);
            req.flash('success_msg', 'Password reset successfully! You can now log in.');
            return res.redirect('/login');
        }

        // Delete used OTP
        await pool.query('DELETE FROM password_reset_otps WHERE email = $1', [email]);
        res.redirect('/login');

    } catch (err) {
        console.error("Password Finalization Error:", err);
        res.status(500).send('Server Error');
    }
});

// GET Forgot Password
router.get('/forgot-password', (req, res) => {
    res.render('forgot-password');
});

// POST Forgot Password
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
    try {
        const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userResult.rows.length === 0) {
            req.flash('error_msg', 'Email not registered');
            return res.redirect('/forgot-password');
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
        await pool.query('INSERT INTO password_reset_otps (email, otp, expires_at) VALUES ($1, $2, $3)', [email, otp, expiresAt]);
        await sendOTPEmail(email, otp);

        res.redirect(`/verify-otp?mode=reset&email=${encodeURIComponent(email)}`);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;