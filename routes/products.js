const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

/**
 * @route   GET /api/products
 * @desc    Get all products
 * @access  Private
 */
router.get('/', auth, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                p.*,
                c.name as category_name,
                c.description as category_description
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            ORDER BY p.name
        `);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching products:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * @route   GET /api/products/:id
 * @desc    Get product by ID
 * @access  Private
 */
router.get('/:id', auth, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                p.*,
                c.name as category_name,
                c.description as category_description
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.id = $1
        `, [req.params.id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error fetching product:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * @route   POST /api/products
 * @desc    Create a new product
 * @access  Admin
 */
router.post('/', [auth, admin], async (req, res) => {
    try {
        const { name, description, price, quantity, category_id } = req.body;

        if (!name || !price || !quantity) {
            return res.status(400).json({ error: 'Name, price, and quantity are required' });
        }

        const result = await pool.query(`
            INSERT INTO products (name, description, price, quantity, category_id)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `, [name, description, price, quantity, category_id]);

        res.status(201).json(result.rows[0]);
    } catch (err) {
        if (err.code === '23505') { // Unique violation
            return res.status(400).json({ error: 'Product name already exists' });
        }
        console.error('Error creating product:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * @route   PUT /api/products/:id
 * @desc    Update a product
 * @access  Admin
 */
router.put('/:id', [auth, admin], async (req, res) => {
    try {
        const { name, description, price, quantity, category_id } = req.body;

        if (!name || !price || !quantity) {
            return res.status(400).json({ error: 'Name, price, and quantity are required' });
        }

        const result = await pool.query(`
            UPDATE products
            SET name = $1, description = $2, price = $3, quantity = $4, category_id = $5, updated_at = CURRENT_TIMESTAMP
            WHERE id = $6
            RETURNING *
        `, [name, description, price, quantity, category_id, req.params.id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        if (err.code === '23505') { // Unique violation
            return res.status(400).json({ error: 'Product name already exists' });
        }
        console.error('Error updating product:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * @route   DELETE /api/products/:id
 * @desc    Delete a product
 * @access  Admin
 */
router.delete('/:id', [auth, admin], async (req, res) => {
    try {
        const result = await pool.query('DELETE FROM products WHERE id = $1 RETURNING *', [req.params.id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }

        res.json({ message: 'Product deleted successfully' });
    } catch (err) {
        console.error('Error deleting product:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * @route   GET /api/products/low-stock
 * @desc    Get products with low stock
 * @access  Private
 */
router.get('/low-stock', auth, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                p.*,
                c.name as category_name,
                c.description as category_description
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.quantity <= 10
            ORDER BY p.quantity ASC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching low stock products:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router; 