const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { check, validationResult } = require('express-validator');
const { pool } = require('../config/db');
const auth = require('../middleware/auth');
const User = require('../models/User');

// @route   POST /api/auth/register
// @desc    Register a user
// @access  Public
router.post('/register', [
    check('username', 'Username is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 })
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const userData = {
            username: req.body.username,
            email: req.body.email,
            password: req.body.password,
            role: req.body.role || 'user',
            firstName: req.body.firstName,
            lastName: req.body.lastName
        };

        // Check if user exists
        let existingUser = await User.findByUsername(userData.username);
        if (existingUser) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        existingUser = await User.findByEmail(userData.email);
        if (existingUser) {
            return res.status(400).json({ error: 'Email already exists' });
        }

        // Create user
        const user = await User.create(userData);
        
        // Generate token
        const token = User.generateAuthToken(user);

        res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });
    } catch (err) {
        console.error('Error in register:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', [
    check('username', 'Username is required').not().isEmpty(),
    check('password', 'Password is required').not().isEmpty()
], async (req, res) => {
    console.log('Login attempt:', {
        body: req.body,
        headers: req.headers
    });

    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log('Validation errors:', errors.array());
        return res.status(400).json({ error: errors.array()[0].msg });
    }

    try {
        const { username, password } = req.body;
        
        // Get user from database
        const result = await pool.query(
            'SELECT * FROM users WHERE username = $1',
            [username]
        );

        console.log('Database query result:', {
            userFound: result.rows.length > 0,
            username
        });

        const user = result.rows[0];

        if (!user) {
            console.log('User not found');
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Check password
        const validPassword = await bcrypt.compare(password, user.password);
        console.log('Password check:', {
            validPassword,
            providedPassword: password,
            hashedPassword: user.password
        });

        if (!validPassword) {
            console.log('Invalid password');
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate token with correct structure
        const token = jwt.sign(
            { 
                user: {
                    id: user.id,
                    username: user.username,
                    role: user.role
                }
            },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
        );

        console.log('Login successful:', {
            userId: user.id,
            username: user.username,
            role: user.role
        });

        res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                firstName: user.first_name,
                lastName: user.last_name
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', auth, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, username, email, role, first_name, last_name FROM users WHERE id = $1',
            [req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Profile fetch error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router; 