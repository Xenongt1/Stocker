const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const auth = require('../middleware/auth');
const { check, validationResult } = require('express-validator');

/**
 * @route   GET /api/customers
 * @desc    Get all customers
 * @access  Private
 */
router.get('/', auth, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                c.*,
                COALESCE(SUM(s.total - s.amount_paid), 0) as total_credit,
                COUNT(DISTINCT CASE WHEN s.payment_status IN ('partial', 'credit') THEN s.id END) as pending_sales
            FROM customers c
            LEFT JOIN sales s ON c.id = s.customer_id AND s.payment_status IN ('partial', 'credit')
            GROUP BY c.id
            ORDER BY c.created_at DESC
        `);

        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching customers:', err);
        res.status(500).json({ error: 'Failed to fetch customers' });
    }
});

/**
 * @route   POST /api/customers
 * @desc    Create a new customer
 * @access  Private
 */
router.post('/', [
    auth,
    [
        check('name', 'Name is required').not().isEmpty(),
        check('email', 'Please include a valid email').optional().isEmail(),
        check('phone', 'Phone number is required').not().isEmpty()
    ]
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, phone, address } = req.body;

    try {
        const result = await pool.query(
            `INSERT INTO customers (name, email, phone, address)
             VALUES (?, ?, ?, ?)`,
            [name, email, phone, address]
        );

        const newCustomer = await pool.query('SELECT * FROM customers WHERE id = ?', [result.rows.insertId]);

        res.status(201).json(newCustomer.rows[0]);
    } catch (err) {
        console.error('Error creating customer:', err);
        res.status(500).json({ error: 'Failed to create customer' });
    }
});

/**
 * @route   GET /api/customers/:id
 * @desc    Get customer details with credit history
 * @access  Private
 */
router.get('/:id', auth, async (req, res) => {
    try {
        // Get customer details
        const customerResult = await pool.query(`
            SELECT 
                c.*,
                COALESCE(SUM(s.total - s.amount_paid), 0) as total_credit,
                COUNT(DISTINCT CASE WHEN s.payment_status IN ('partial', 'credit') THEN s.id END) as pending_sales
            FROM customers c
            LEFT JOIN sales s ON c.id = s.customer_id AND s.payment_status IN ('partial', 'credit')
            WHERE c.id = ?
            GROUP BY c.id
        `, [req.params.id]);

        if (customerResult.rows.length === 0) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        // Get credit history
        const creditHistoryResult = await pool.query(`
            SELECT 
                s.id as sale_id,
                s.created_at as sale_date,
                s.total,
                s.amount_paid,
                s.payment_status,
                JSON_ARRAYAGG(
                    IF(cp.id IS NULL, NULL, JSON_OBJECT(
                        'id', cp.id,
                        'amount', cp.amount,
                        'payment_date', cp.payment_date,
                        'payment_method', cp.payment_method
                    ))
                ) as payments
            FROM sales s
            LEFT JOIN credit_payments cp ON s.id = cp.sale_id
            WHERE s.customer_id = ? AND s.payment_status IN ('partial', 'credit')
            GROUP BY s.id
            ORDER BY s.created_at DESC
        `, [req.params.id]);

        res.json({
            customer: customerResult.rows[0],
            creditHistory: creditHistoryResult.rows
        });
    } catch (err) {
        console.error('Error fetching customer details:', err);
        res.status(500).json({ error: 'Failed to fetch customer details' });
    }
});

/**
 * @route   POST /api/customers/:id/payments
 * @desc    Record a payment for a customer's credit
 * @access  Private
 */
router.post('/:id/payments', [
    auth,
    [
        check('saleId', 'Sale ID is required').not().isEmpty(),
        check('amount', 'Amount is required').isNumeric(),
        check('paymentMethod', 'Payment method is required').not().isEmpty()
    ]
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const { saleId, amount, paymentMethod } = req.body;

        // Get sale details
        const saleResult = await client.query(
            'SELECT * FROM sales WHERE id = ? AND customer_id = ?',
            [saleId, req.params.id]
        );

        if (saleResult.rows.length === 0) {
            throw new Error('Sale not found');
        }

        const sale = saleResult.rows[0];
        const remainingAmount = sale.total - sale.amount_paid;

        if (amount > remainingAmount) {
            throw new Error('Payment amount exceeds remaining balance');
        }

        // Create payment
        // Record payment
        await client.query(
            `INSERT INTO credit_payments (sale_id, amount, payment_method, created_by)
             VALUES (?, ?, ?, ?)`,
            [saleId, amount, paymentMethod, req.user.id]
        );

        // Update sale
        const newAmountPaid = parseFloat(sale.amount_paid) + parseFloat(amount);
        const newPaymentStatus = newAmountPaid >= parseFloat(sale.total) ? 'paid' : 'partial';

        await client.query(
            `UPDATE sales 
             SET amount_paid = ?, payment_status = ?
             WHERE id = ?`,
            [newAmountPaid, newPaymentStatus, saleId]
        );

        await client.query('COMMIT');

        res.json({ message: 'Payment recorded successfully' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error recording payment:', err);
        res.status(500).json({ error: err.message || 'Failed to record payment' });
    } finally {
        client.release();
    }
});

module.exports = router; 