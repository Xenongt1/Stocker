module.exports = function (req, res, next) {
    // Check if user is admin
    // req.user is already the user object from auth middleware
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
    }
    next();
}; 