const crypto = require('crypto');

// Generate a secure random JWT secret if one is not provided in environment variables
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex');

module.exports = {
    secret: JWT_SECRET,
    options: {
        expiresIn: '24h', // Token expiration time
        algorithm: 'HS256' // Signing algorithm
    }
}; 