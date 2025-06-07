const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

/**
 * @route   GET /api/sales
 * @desc    Get all sales
 * @access  Private
 */
router.get('/', auth, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                s.*,
                json_agg(json_build_object(
                    'id', si.id,
                    'product_id', si.product_id,
                    'product_name', p.name,
                    'quantity', si.quantity,
                    'price', si.price
                )) as items,
                SUM(si.quantity * si.price) as total_amount
            FROM sales s
            LEFT JOIN sale_items si ON s.id = si.sale_id
            LEFT JOIN products p ON si.product_id = p.id
            GROUP BY s.id
            ORDER BY s.created_at DESC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching sales:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * @route   GET /api/sales/:id
 * @desc    Get sale by ID
 * @access  Private
 */
router.get('/:id', auth, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                s.*,
                json_agg(json_build_object(
                    'id', si.id,
                    'product_id', si.product_id,
                    'product_name', p.name,
                    'quantity', si.quantity,
                    'price', si.price
                )) as items,
                SUM(si.quantity * si.price) as total_amount
            FROM sales s
            LEFT JOIN sale_items si ON s.id = si.sale_id
            LEFT JOIN products p ON si.product_id = p.id
            WHERE s.id = $1
            GROUP BY s.id
        `, [req.params.id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Sale not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error fetching sale:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * @route   POST /api/sales
 * @desc    Create a new sale
 * @access  Private
 */
router.post('/', auth, async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const { items } = req.body;
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: 'Sale items are required' });
        }

        // Create sale
        const saleResult = await client.query(
            'INSERT INTO sales (user_id) VALUES ($1) RETURNING *',
            [req.user.id]
        );
        const sale = saleResult.rows[0];

        // Add sale items and update product quantities
        for (const item of items) {
            const { product_id, quantity, price } = item;

            // Check product availability
            const productResult = await client.query(
                'SELECT quantity FROM products WHERE id = $1 FOR UPDATE',
                [product_id]
            );

            if (productResult.rows.length === 0) {
                throw new Error(`Product ${product_id} not found`);
            }

            const product = productResult.rows[0];
            if (product.quantity < quantity) {
                throw new Error(`Insufficient stock for product ${product_id}`);
            }

            // Add sale item
            await client.query(
                'INSERT INTO sale_items (sale_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)',
                [sale.id, product_id, quantity, price]
            );

            // Update product quantity
            await client.query(
                'UPDATE products SET quantity = quantity - $1 WHERE id = $2',
                [quantity, product_id]
            );
        }

        await client.query('COMMIT');

        // Fetch the complete sale with items
        const result = await pool.query(`
            SELECT 
                s.*,
                json_agg(json_build_object(
                    'id', si.id,
                    'product_id', si.product_id,
                    'product_name', p.name,
                    'quantity', si.quantity,
                    'price', si.price
                )) as items,
                SUM(si.quantity * si.price) as total_amount
            FROM sales s
            LEFT JOIN sale_items si ON s.id = si.sale_id
            LEFT JOIN products p ON si.product_id = p.id
            WHERE s.id = $1
            GROUP BY s.id
        `, [sale.id]);

        res.status(201).json(result.rows[0]);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error creating sale:', err);
        res.status(500).json({ error: err.message || 'Server error' });
    } finally {
        client.release();
    }
});

/**
 * @route   GET /api/sales/stats/recent
 * @desc    Get recent sales statistics
 * @access  Private
 */
router.get('/stats/recent', auth, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                COUNT(*) as total_sales,
                SUM(si.quantity * si.price) as total_revenue,
                SUM(si.quantity) as total_items_sold
            FROM sales s
            LEFT JOIN sale_items si ON s.id = si.sale_id
            WHERE s.created_at >= NOW() - INTERVAL '7 days'
        `);

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error fetching sales stats:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router; 