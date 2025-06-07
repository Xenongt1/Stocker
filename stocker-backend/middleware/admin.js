module.exports = function(req, res, next) {
    // Check if user is admin
    if (!req.user || !req.user.user || req.user.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
    }
    next();
}; 