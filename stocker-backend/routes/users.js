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
            'SELECT id, username, email, role, first_name, last_name, status, last_login, created_at FROM users ORDER BY created_at DESC'
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
        const { username, email, password, role, firstName, lastName, status } = req.body;

        // Check if user exists
        const userExists = await pool.query(
            'SELECT * FROM users WHERE username = ? OR email = ?',
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
            'INSERT INTO users (username, email, password, role, first_name, last_name, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [username, email, hashedPassword, role, firstName, lastName, status || 'active']
        );

        const newUser = await pool.query(
            'SELECT id, username, email, role, first_name, last_name, status, created_at FROM users WHERE id = ?',
            [result.insertId]
        );

        res.status(201).json(newUser.rows[0]);
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
        const { email, password, role, firstName, lastName, status } = req.body;
        const userId = req.params.id;

        // Permission check: Admin can update anyone, User can only update themselves
        if (req.user.role !== 'admin' && String(req.user.id) !== String(userId)) {
            return res.status(403).json({ error: 'Access denied. You can only update your own profile.' });
        }

        // If not admin, ensure role and status are not processed even if sent
        const safeRole = req.user.role === 'admin' ? role : undefined;
        const safeStatus = req.user.role === 'admin' ? status : undefined;

        // Check if user exists
        const userExists = await pool.query(
            'SELECT * FROM users WHERE id = ?',
            [userId]
        );

        if (userExists.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Build update query
        let updateQuery = 'UPDATE users SET ';
        const updateValues = [];

        if (username) {
            // Check if username is taken by another user
            const usernameExists = await pool.query(
                'SELECT id FROM users WHERE username = ? AND id != ?',
                [username, userId]
            );

            if (usernameExists.rows.length > 0) {
                return res.status(400).json({ error: 'Username is already taken' });
            }

            updateQuery += `username = ?, `;
            updateValues.push(username);
        }

        if (email) {
            // Check if email is taken by another user
            const emailExists = await pool.query(
                'SELECT id FROM users WHERE email = ? AND id != ?',
                [email, userId]
            );

            if (emailExists.rows.length > 0) {
                return res.status(400).json({ error: 'Email is already taken' });
            }

            updateQuery += `email = ?, `;
            updateValues.push(email);
        }

        if (password) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            updateQuery += `password = ?, `;
            updateValues.push(hashedPassword);
        }

        if (safeRole) {
            updateQuery += `role = ?, `;
            updateValues.push(safeRole);
        }

        if (firstName !== undefined) {
            updateQuery += `first_name = ?, `;
            updateValues.push(firstName);
        }

        if (lastName !== undefined) {
            updateQuery += `last_name = ?, `;
            updateValues.push(lastName);
        }

        if (safeStatus) {
            updateQuery += `status = ?, `;
            updateValues.push(safeStatus);
        }

        // Remove trailing comma and space
        if (updateValues.length === 0) {
            return res.json(userExists.rows[0]);
        }

        updateQuery = updateQuery.slice(0, -2);
        updateQuery += ` WHERE id = ?`;
        updateValues.push(userId);

        // Execute update
        await pool.query(updateQuery, updateValues);

        // Fetch updated user
        const updatedUser = await pool.query(
            'SELECT id, username, email, role, first_name, last_name, status, created_at FROM users WHERE id = ?',
            [userId]
        );
        res.json(updatedUser.rows[0]);
    } catch (err) {
        console.error('Error updating user:', err);
        console.error('Update Query:', updateQuery || 'Not built');
        console.error('Update Values:', updateValues || 'Not built');
        res.status(500).json({
            error: 'Server error',
            details: err.message,
            sqlMessage: err.sqlMessage || undefined
        });
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
            'SELECT * FROM users WHERE id = ?',
            [userId]
        );

        if (userExists.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Delete user
        await pool.query('DELETE FROM users WHERE id = ?', [userId]);
        res.json({ message: 'User deleted successfully' });
    } catch (err) {
        console.error('Error deleting user:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router; 