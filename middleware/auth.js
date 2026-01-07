function ensureAuthenticated(req, res, next) {
    if (req.session.user_id) {
        return next();
    }
    req.flash('error_msg', 'Please log in to view that resource');
    res.redirect('/login');
}

// Optional: Redirects logged-in users away from Login/Register pages
function forwardAuthenticated(req, res, next) {
    if (!req.session.user_id) {
        return next();
    }
    res.redirect('/dashboard');
}

module.exports = { ensureAuthenticated, forwardAuthenticated };