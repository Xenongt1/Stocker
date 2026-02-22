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
    // Default amount_paid to total if not provided (assuming full payment)
    const amountPaid = req.body.amount_paid || total;

    const saleResult = await client.query(
      `INSERT INTO sales (user_id, subtotal, discount, tax, total, payment_method, amount_paid) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, subtotal, discount, tax, total, payment_method, amountPaid]
    );
    const saleId = saleResult.rows.insertId;

    // Add sale items and update product quantities
    for (const item of items) {
      const { product_id, quantity, price } = item;

      // Check product availability
      const productResult = await client.query(
        'SELECT quantity FROM products WHERE id = ? FOR UPDATE',
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
         VALUES (?, ?, ?, ?, ?)`,
        [saleId, product_id, quantity, price, quantity * price]
      );

      // Update product quantity
      await client.query(
        'UPDATE products SET quantity = quantity - ? WHERE id = ?',
        [quantity, product_id]
      );
    }

    await client.query('COMMIT');

    // Fetch the complete sale with items and user info
    const result = await pool.query(`
      SELECT 
        s.*,
        u.username as cashier_name,
        JSON_ARRAYAGG(
          IF(si.id IS NULL, NULL, JSON_OBJECT(
            'id', si.id,
            'product_id', si.product_id,
            'name', p.name,
            'quantity', si.quantity,
            'price', si.price,
            'total', si.total
          ))
        ) as items
      FROM sales s
      LEFT JOIN sale_items si ON s.id = si.sale_id
      LEFT JOIN products p ON si.product_id = p.id
      LEFT JOIN users u ON s.user_id = u.id
      WHERE s.id = ?
      GROUP BY s.id, s.created_at, s.payment_method,
               s.subtotal, s.tax, s.discount, s.total,
               u.username
    `, [saleId]);

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
        JSON_ARRAYAGG(
          IF(si.id IS NULL, NULL, JSON_OBJECT(
            'id', si.id,
            'product_id', si.product_id,
            'name', p.name,
            'quantity', si.quantity,
            'price', si.price,
            'total', si.total
          ))
        ) as items
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
 * @route   GET /api/sales/stats/summary
 * @desc    Get sales summary statistics
 * @access  Private
 */
router.get('/stats/summary', auth, async (req, res) => {
  try {
    const { period = 'daily' } = req.query;
    let timeFilter = '';

    // MySQL date format strings for grouping/filtering
    // But for summary we typically filter WHERE date within current period
    // AdminDashboard uses 'monthly', meaning "Current Month"? 
    // Or just all time aggregated by month?
    // AdminDashboard fetchDashboardData seems to want "totals for the current period" (e.g. this month's revenue)

    // Let's assume it wants the stats FOR the specific period (e.g. THIS month).
    // The previous dashboard route used: WHERE DATE_FORMAT(created_at, '%Y-%m-01') = DATE_FORMAT(CURRENT_DATE, '%Y-%m-01')

    let whereClause = '';
    if (period === 'monthly') {
      whereClause = "WHERE DATE_FORMAT(created_at, '%Y-%m-01') = DATE_FORMAT(CURRENT_DATE, '%Y-%m-01')";
    } else if (period === 'daily') {
      whereClause = "WHERE DATE(created_at) = CURRENT_DATE";
    } else if (period === 'yearly') {
      whereClause = "WHERE YEAR(created_at) = YEAR(CURRENT_DATE)";
    }
    // If 'all', no filter.

    const result = await pool.query(`
      SELECT 
        CAST(COALESCE(SUM(total), 0) AS FLOAT) as totalSales,
        CAST(COALESCE(SUM(tax), 0) AS FLOAT) as totalTax,
        CAST(COALESCE(SUM(discount), 0) AS FLOAT) as totalDiscount,
        CAST(COALESCE(AVG(total), 0) AS FLOAT) as averageSale
      FROM sales
      ${whereClause}
    `);

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching summary stats:', err);
    res.status(500).json({ error: 'Failed to fetch summary statistics' });
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
        COUNT(CASE WHEN payment_status IN ('partial', 'credit') THEN 1 END) as credit_sales_count,
        CAST(SUM(CASE WHEN DATE_FORMAT(created_at, '%Y-%m-01') = DATE_FORMAT(CURRENT_DATE, '%Y-%m-01') THEN total ELSE 0 END) AS FLOAT) as monthly_sales,
        COUNT(CASE WHEN DATE_FORMAT(created_at, '%Y-%m-01') = DATE_FORMAT(CURRENT_DATE, '%Y-%m-01') THEN 1 END) as monthly_sales_count
      FROM sales
    `);

    const productStats = await pool.query(`
      SELECT COUNT(*) as total_products,
      COUNT(CASE WHEN quantity <= reorder_point THEN 1 END) as low_stock_count
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

/**
 * @route   GET /api/sales/stats/chart
 * @desc    Get sales stats over time for charts
 * @access  Private
 */
router.get('/stats/chart', auth, async (req, res) => {
  try {
    const { period = 'daily', startDate, endDate } = req.query;

    // Date formatting for grouping
    let dateFormat;
    switch (period) {
      case 'monthly': dateFormat = '%Y-%m'; break;
      case 'yearly': dateFormat = '%Y'; break;
      default: dateFormat = '%Y-%m-%d';
    }

    // Base usage of time filter if provided
    let dateFilter = '';
    const params = [dateFormat];

    if (startDate && endDate) {
      dateFilter = 'WHERE created_at BETWEEN ? AND ?';
      params.push(startDate, endDate);
    }

    // Push the group by param
    params.push(dateFormat);

    const result = await pool.query(`
      SELECT 
        DATE_FORMAT(created_at, ?) as date,
        COUNT(*) as count,
        SUM(total) as amount,
        SUM(total - tax - cost_amount) as profit -- Approximate profit calculation
      FROM (
        SELECT s.*, 
               (SELECT SUM(p.cost_price * si.quantity) 
                FROM sale_items si 
                JOIN products p ON si.product_id = p.id 
                WHERE si.sale_id = s.id) as cost_amount
        FROM sales s
      ) as sales_with_cost
      ${dateFilter}
      GROUP BY date
      ORDER BY date ASC
    `, params);

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching chart stats:', err);
    res.status(500).json({ error: 'Failed to fetch chart statistics' });
  }
});

/**
 * @route   GET /api/sales/stats/products
 * @desc    Get product performance stats
 * @access  Private
 */
router.get('/stats/products', auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let dateFilter = '';
    const params = [];

    if (startDate && endDate) {
      dateFilter = 'WHERE s.created_at BETWEEN ? AND ?';
      params.push(startDate, endDate);
    }

    const result = await pool.query(`
      SELECT 
        p.name as product,
        SUM(si.quantity) as quantity,
        SUM(si.total) as amount,
        SUM(si.total - (p.cost_price * si.quantity)) as profit
      FROM sale_items si
      JOIN products p ON si.product_id = p.id
      JOIN sales s ON si.sale_id = s.id
      ${dateFilter}
      GROUP BY p.id, p.name
      ORDER BY amount DESC
    `, params);

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching product stats:', err);
    res.status(500).json({ error: 'Failed to fetch product statistics' });
  }
});

/**
 * @route   GET /api/sales/stats/sidebar
 * @desc    Get usage statistics for sidebar notifications (low stock, pending orders)
 * @access  Private
 */
router.get('/stats/sidebar', auth, async (req, res) => {
  try {
    // Count low stock products
    // Assuming low stock is when quantity <= min_stock_level
    // Use COALESCE to handle potentially null min_stock_level, defaulting to 10 if null
    const lowStockQuery = `
            SELECT COUNT(*) as count 
            FROM products 
            WHERE quantity <= COALESCE(min_stock_level, 10)
        `;
    const lowStockResult = await pool.query(lowStockQuery);

    // Count pending orders (not paid)
    // payment_status != 'paid'
    const pendingOrdersQuery = `
            SELECT COUNT(*) as count 
            FROM sales 
            WHERE payment_status != 'paid'
        `;
    const pendingOrdersResult = await pool.query(pendingOrdersQuery);

    res.json({
      lowStock: parseInt(lowStockResult.rows[0].count) || 0,
      pendingOrders: parseInt(pendingOrdersResult.rows[0].count) || 0
    });
  } catch (err) {
    console.error('Error fetching sidebar stats:', err);
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
        s.id,
        s.created_at,
        s.payment_method,
        s.subtotal,
        s.tax,
        s.discount,
        s.total,
        u.username as cashier_name,
        JSON_ARRAYAGG(
          IF(si.id IS NULL, NULL, JSON_OBJECT(
            'id', si.id,
            'product_id', si.product_id,
            'name', p.name,
            'quantity', si.quantity,
            'price', si.price,
            'total', si.total
          ))
        ) as items
      FROM sales s
      LEFT JOIN sale_items si ON s.id = si.sale_id
      LEFT JOIN products p ON si.product_id = p.id
      LEFT JOIN users u ON s.user_id = u.id
      WHERE s.id = ?
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

// ... (moved content will be inserted earlier)

module.exports = router; 