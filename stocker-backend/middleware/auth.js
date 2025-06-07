const jwt = require('jsonwebtoken');
const config = require('config');

module.exports = (req, res, next) => {
    try {
        // Get token from header
        const token = req.header('Authorization')?.replace('Bearer ', '') || 
                     req.header('x-auth-token');

        // Check if no token
        if (!token) {
            console.log('No token provided');
            return res.status(401).json({ error: 'No token, authorization denied' });
        }

        // Verify token
        const decoded = jwt.verify(token, config.get('jwtSecret'));
        
        // Log decoded token for debugging
        console.log('Decoded token:', decoded);
        
        // Set user info in request
        req.user = decoded.user || decoded;
        
        next();
    } catch (err) {
        console.error('Token verification failed:', err);
        res.status(401).json({ error: 'Token is not valid' });
    }
}; 