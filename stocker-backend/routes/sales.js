const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const auth = require('../middleware/auth');
const { check, validationResult } = require('express-validator');

// Debug middleware to log all requests
router.use((req, res, next) => {
  console.log(`[SALES ROUTE] ${req.method} ${req.path}`);
  console.log('Request headers:', req.headers);
  console.log('Request user:', req.user);
  next();
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

    const { items, subtotal, discount = 0, tax = 0, total, payment_method = 'Cash' } = req.body;
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Sale items are required' });
    }

    // Create sale with user_id from auth middleware
    const saleResult = await client.query(
      `INSERT INTO sales (user_id, subtotal, discount, tax, total, payment_method) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [req.user.id, subtotal, discount, tax, total, payment_method]
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
        `INSERT INTO sale_items (sale_id, product_id, quantity, price, total) 
         VALUES ($1, $2, $3, $4, $5)`,
        [sale.id, product_id, quantity, price, quantity * price]
      );

      // Update product quantity
      await client.query(
        'UPDATE products SET quantity = quantity - $1 WHERE id = $2',
        [quantity, product_id]
      );
    }

    await client.query('COMMIT');

    // Fetch the complete sale with items and user info
    const result = await pool.query(`
      SELECT 
        s.*,
        u.username as cashier_name,
        json_agg(
          json_build_object(
            'id', si.id,
            'product_id', si.product_id,
            'name', p.name,
            'quantity', si.quantity,
            'price', si.price,
            'total', si.total
          )
        ) FILTER (WHERE si.id IS NOT NULL) as items
      FROM sales s
      LEFT JOIN sale_items si ON s.id = si.sale_id
      LEFT JOIN products p ON si.product_id = p.id
      LEFT JOIN users u ON s.user_id = u.id
      WHERE s.id = $1
      GROUP BY s.id, s.created_at, s.payment_method,
               s.subtotal, s.tax, s.discount, s.total,
               u.username
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
 * @route   GET /api/sales
 * @desc    Get all sales
 * @access  Private
 */
router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        s.id,
        s.created_at,
        s.payment_method,
        s.subtotal,
        s.tax,
        s.discount,
        s.total,
        u.username as cashier_name,
        json_agg(
          json_build_object(
            'id', si.id,
            'product_id', si.product_id,
            'name', p.name,
            'quantity', si.quantity,
            'price', si.price,
            'total', si.total
          )
        ) FILTER (WHERE si.id IS NOT NULL) as items
      FROM sales s
      LEFT JOIN sale_items si ON s.id = si.sale_id
      LEFT JOIN products p ON si.product_id = p.id
      LEFT JOIN users u ON s.user_id = u.id
      GROUP BY s.id, s.created_at, s.payment_method,
               s.subtotal, s.tax, s.discount, s.total,
               u.username
      ORDER BY s.created_at DESC
    `);

    const sales = result.rows.map(sale => ({
      ...sale,
      items: sale.items || [],
      cashier_name: sale.cashier_name || 'System'
    }));

    res.json(sales);
  } catch (err) {
    console.error('Error fetching sales:', err);
    res.status(500).json({ error: 'Failed to fetch sales: ' + err.message });
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
        s.id,
        s.created_at,
        s.payment_method,
        s.subtotal,
        s.tax,
        s.discount,
        s.total,
        u.username as cashier_name,
        json_agg(
          json_build_object(
            'id', si.id,
            'product_id', si.product_id,
            'name', p.name,
            'quantity', si.quantity,
            'price', si.price,
            'total', si.total
          )
        ) FILTER (WHERE si.id IS NOT NULL) as items
      FROM sales s
      LEFT JOIN sale_items si ON s.id = si.sale_id
      LEFT JOIN products p ON si.product_id = p.id
      LEFT JOIN users u ON s.user_id = u.id
      WHERE s.id = $1
      GROUP BY s.id, s.created_at, s.payment_method,
               s.subtotal, s.tax, s.discount, s.total,
               u.username
    `, [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Sale not found' });
    }

    const sale = {
      ...result.rows[0],
      items: result.rows[0].items || [],
      cashier_name: result.rows[0].cashier_name || 'System'
    };

    res.json(sale);
  } catch (err) {
    console.error('Error fetching sale:', err);
    res.status(500).json({ error: 'Failed to fetch sale: ' + err.message });
  }
});

/**
 * @route   GET /api/sales/stats/dashboard
 * @desc    Get sales statistics for dashboard
 * @access  Private
 */
router.get('/stats/dashboard', auth, async (req, res) => {
  try {
    const stats = await pool.query(`
      SELECT
        COUNT(*) as total_sales,
        CAST(SUM(total) AS FLOAT) as total_revenue,
        CAST(SUM(CASE WHEN payment_status IN ('partial', 'credit') THEN total - amount_paid ELSE 0 END) AS FLOAT) as total_credit,
        COUNT(*) FILTER (WHERE payment_status IN ('partial', 'credit')) as credit_sales_count,
        CAST(SUM(total) FILTER (WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)) AS FLOAT) as monthly_sales,
        COUNT(*) FILTER (WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)) as monthly_sales_count
      FROM sales
    `);

    const productStats = await pool.query(`
      SELECT COUNT(*) as total_products,
      COUNT(*) FILTER (WHERE quantity <= reorder_point) as low_stock_count
      FROM products
    `);

    res.json({
      sales: stats.rows[0],
      products: productStats.rows[0]
    });
  } catch (err) {
    console.error('Error fetching dashboard stats:', err);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
});

module.exports = router; 