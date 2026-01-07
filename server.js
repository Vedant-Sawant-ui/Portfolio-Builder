require('dotenv').config(); 
const express = require('express');
const app = express();
const path = require('path');
const session = require('express-session'); // NEW
const flash = require('connect-flash');     // NEW

// ... (Your DB import remains here) ...

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// 1. Session Configuration (NEW)
if (!process.env.SESSION_SECRET) {
    console.error('❌ FATAL: SESSION_SECRET must be set in .env');
    process.exit(1);
}

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}));

// 2. Connect Flash Middleware (NEW)
app.use(flash());

// 3. Global Variables for Flash Messages (NEW)
app.use((req, res, next) => {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error');
    
    // Make user available to all views
    if (req.session && req.session.user_id) {
        res.locals.user = { 
            id: req.session.user_id, 
            username: req.session.username 
        };
    } else {
        res.locals.user = null;
    }
    
    next();
});

// Add this route to server.js
app.get('/', (req, res) => {
    res.redirect('/login');
});

// 4. Routes
const authRoutes = require('./routes/auth'); // NEW
const dashboardRoutes = require('./routes/dashboard');
const achievementsRoutes = require('./routes/achievements');
const apiSetupRoutes = require('./routes/api-setup'); // Ensure this is imported
const portfolioRoutes = require('./routes/portfolio');

app.use('/', authRoutes); // Login/Register routes (NEW)
app.use('/dashboard', dashboardRoutes);
app.use('/dashboard/achievements', achievementsRoutes);
app.use('/dashboard/api-setup', apiSetupRoutes); // Ensure this line exists
app.use('/', portfolioRoutes);


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});