const db = require('../config/database');

class Sale {
  static async create(saleData) {
    // Start a transaction
    const client = await db.pool.connect();

    try {
      await client.query('BEGIN');

      // Insert the sale record
      const saleQuery = `
        INSERT INTO sales (user_id, subtotal, discount, tax, total, payment_method, amount_paid)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;

      const saleValues = [
        saleData.userId,
        saleData.subtotal,
        saleData.discount || 0,
        saleData.tax || 0,
        saleData.total,
        saleData.paymentMethod || 'Cash',
        saleData.amountPaid || saleData.total // Default to total if not provided
      ];

      const saleResult = await client.query(saleQuery, saleValues);
      const saleId = saleResult.insertId;

      // Insert sale items and update product quantities
      for (const item of saleData.items) {
        // Insert sale item
        const itemQuery = `
          INSERT INTO sale_items (sale_id, product_id, quantity, price, total)
          VALUES (?, ?, ?, ?, ?)
        `;

        const itemValues = [
          saleId,
          item.productId,
          item.quantity,
          item.price,
          item.total
        ];

        await client.query(itemQuery, itemValues);

        // Update product quantity
        const updateProductQuery = `
          UPDATE products 
          SET quantity = quantity - ?
          WHERE id = ? AND quantity >= ?
        `;

        const updateResult = await client.query(updateProductQuery, [item.quantity, item.productId, item.quantity]);

        if (updateResult.rowCount === 0) {
          throw new Error(`Insufficient stock for product ${item.name}`);
        }
      }

      await client.query('COMMIT');
      return await this.findById(saleId); // Get complete sale with items
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async findById(id) {
    const saleQuery = 'SELECT * FROM sales WHERE id = ?';
    const itemsQuery = 'SELECT * FROM sale_items WHERE sale_id = ?';

    const { rows: [sale] } = await db.query(saleQuery, [id]);
    if (!sale) return null;

    const { rows: items } = await db.query(itemsQuery, [id]);
    return { ...sale, items };
  }

  static async list(filters = {}) {
    let query = `
      SELECT s.*, u.username as user_name
      FROM sales s
      JOIN users u ON s.user_id = u.id
    `;
    const values = [];
    const conditions = [];
    let paramCount = 1;

    if (filters.userId) {
      conditions.push(`s.user_id = ?`);
      values.push(filters.userId);
    }

    if (filters.startDate) {
      conditions.push(`s.created_at >= ?`);
      values.push(filters.startDate);
    }

    if (filters.endDate) {
      conditions.push(`s.created_at <= ?`);
      values.push(filters.endDate);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY s.created_at DESC';

    const { rows: sales } = await db.query(query, values);

    // Get items for all sales
    for (const sale of sales) {
      const { rows: items } = await db.query('SELECT * FROM sale_items WHERE sale_id = ?', [sale.id]);
      sale.items = items;
    }

    return sales;
  }

  static async getSalesStats(period = 'daily') {
    let timeFormat;
    switch (period) {
      case 'hourly':
        timeFormat = 'YYYY-MM-DD HH24';
        break;
      case 'daily':
        timeFormat = 'YYYY-MM-DD';
        break;
      case 'weekly':
        timeFormat = 'YYYY-IW';
        break;
      case 'monthly':
        timeFormat = 'YYYY-MM';
        break;
      default:
        timeFormat = 'YYYY-MM-DD';
    }

    const query = `
      SELECT
        DATE_FORMAT(created_at, ?) as period,
        COUNT(*) as total_sales,
        SUM(total) as total_revenue,
        AVG(total) as average_sale,
        SUM(quantity) as total_items
      FROM sales s
      JOIN sale_items si ON s.id = si.sale_id
      GROUP BY DATE_FORMAT(created_at, ?)
      ORDER BY period DESC
      LIMIT 30
      `;

    // Map format strings
    const formatMap = {
      'YYYY-MM-DD HH24': '%Y-%m-%d %H',
      'YYYY-MM-DD': '%Y-%m-%d',
      'YYYY-IW': '%Y-%u',
      'YYYY-MM': '%Y-%m'
    };

    // Use mapped format or default
    const mysqlFormat = formatMap[timeFormat] || '%Y-%m-%d';

    const { rows } = await db.query(query, [mysqlFormat, mysqlFormat]);
    return rows;
  }

  static async delete(id) {
    const client = await db.pool.connect();

    try {
      await client.query('BEGIN');

      // Delete sale items first (cascade will handle this automatically)
      const deleteResult = await client.query('DELETE FROM sales WHERE id = ?', [id]);

      await client.query('COMMIT');
      return deleteResult.rowCount > 0;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = Sale; 