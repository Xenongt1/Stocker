const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { check, validationResult } = require('express-validator');
const { pool } = require('../config/db');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

// Debug middleware
router.use((req, res, next) => {
  console.log(`[USERS ROUTE] ${req.method} ${req.path}`);
  next();
});

/**
 * @route   GET /api/users
 * @desc    Get all users
 * @access  Private/Admin
 */
router.get('/', [auth, admin], async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, username, email, role, created_at FROM users ORDER BY created_at DESC'
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching users:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * @route   POST /api/users
 * @desc    Create a new user
 * @access  Private/Admin
 */
router.post('/', [
    auth,
    admin,
    [
        check('username', 'Username is required').not().isEmpty(),
        check('email', 'Please include a valid email').isEmail(),
        check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
        check('role', 'Role must be either admin or user').isIn(['admin', 'user'])
    ]
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { username, email, password, role } = req.body;

        // Check if user exists
        const userExists = await pool.query(
            'SELECT * FROM users WHERE username = $1 OR email = $2',
            [username, email]
        );

        if (userExists.rows.length > 0) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        const result = await pool.query(
            'INSERT INTO users (username, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, username, email, role, created_at',
            [username, email, hashedPassword, role]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error creating user:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * @route   PUT /api/users/:id
 * @desc    Update a user
 * @access  Private/Admin
 */
router.put('/:id', [
    auth,
    admin,
    [
        check('email', 'Please include a valid email').optional().isEmail(),
        check('role', 'Role must be either admin or user').optional().isIn(['admin', 'user'])
    ]
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { email, password, role } = req.body;
        const userId = req.params.id;

        // Check if user exists
        const userExists = await pool.query(
            'SELECT * FROM users WHERE id = $1',
            [userId]
        );

        if (userExists.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Build update query
        let updateQuery = 'UPDATE users SET ';
        const updateValues = [];
        let valueCounter = 1;

        if (email) {
            updateQuery += `email = $${valueCounter}, `;
            updateValues.push(email);
            valueCounter++;
        }

        if (password) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            updateQuery += `password = $${valueCounter}, `;
            updateValues.push(hashedPassword);
            valueCounter++;
        }

        if (role) {
            updateQuery += `role = $${valueCounter}, `;
            updateValues.push(role);
            valueCounter++;
        }

        // Remove trailing comma and space
        updateQuery = updateQuery.slice(0, -2);
        updateQuery += ` WHERE id = $${valueCounter} RETURNING id, username, email, role, created_at`;
        updateValues.push(userId);

        const result = await pool.query(updateQuery, updateValues);
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error updating user:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete a user
 * @access  Private/Admin
 */
router.delete('/:id', [auth, admin], async (req, res) => {
    try {
        const userId = req.params.id;

        // Check if trying to delete admin user
        if (userId === '1') {
            return res.status(400).json({ error: 'Cannot delete main admin user' });
        }

        // Check if user exists
        const userExists = await pool.query(
            'SELECT * FROM users WHERE id = $1',
            [userId]
        );

        if (userExists.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Delete user
        await pool.query('DELETE FROM users WHERE id = $1', [userId]);
        res.json({ message: 'User deleted successfully' });
    } catch (err) {
        console.error('Error deleting user:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router; 