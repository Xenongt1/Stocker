const db = require('../config/database');

class Sale {
  static async create(saleData) {
    // Start a transaction
    const client = await db.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Insert the sale record
      const saleQuery = `
        INSERT INTO sales (user_id, subtotal, discount, tax, total, payment_method)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `;
      
      const saleValues = [
        saleData.userId,
        saleData.subtotal,
        saleData.discount || 0,
        saleData.tax || 0,
        saleData.total,
        saleData.paymentMethod || 'Cash'
      ];

      const { rows: [sale] } = await client.query(saleQuery, saleValues);

      // Insert sale items and update product quantities
      for (const item of saleData.items) {
        // Insert sale item
        const itemQuery = `
          INSERT INTO sale_items (sale_id, product_id, name, quantity, price, total)
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING *
        `;
        
        const itemValues = [
          sale.id,
          item.productId,
          item.name,
          item.quantity,
          item.price,
          item.total
        ];

        await client.query(itemQuery, itemValues);

        // Update product quantity
        const updateProductQuery = `
          UPDATE products 
          SET quantity = quantity - $1
          WHERE id = $2 AND quantity >= $1
          RETURNING *
        `;

        const { rows: [updatedProduct] } = await client.query(updateProductQuery, [item.quantity, item.productId]);
        
        if (!updatedProduct) {
          throw new Error(`Insufficient stock for product ${item.name}`);
        }
      }

      await client.query('COMMIT');
      return await this.findById(sale.id); // Get complete sale with items
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async findById(id) {
    const saleQuery = 'SELECT * FROM sales WHERE id = $1';
    const itemsQuery = 'SELECT * FROM sale_items WHERE sale_id = $1';

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
      conditions.push(`s.user_id = $${paramCount}`);
      values.push(filters.userId);
      paramCount++;
    }

    if (filters.startDate) {
      conditions.push(`s.created_at >= $${paramCount}`);
      values.push(filters.startDate);
      paramCount++;
    }

    if (filters.endDate) {
      conditions.push(`s.created_at <= $${paramCount}`);
      values.push(filters.endDate);
      paramCount++;
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY s.created_at DESC';

    const { rows: sales } = await db.query(query, values);

    // Get items for all sales
    for (const sale of sales) {
      const { rows: items } = await db.query('SELECT * FROM sale_items WHERE sale_id = $1', [sale.id]);
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
        TO_CHAR(created_at, $1) as period,
        COUNT(*) as total_sales,
        SUM(total) as total_revenue,
        AVG(total) as average_sale,
        SUM(quantity) as total_items
      FROM sales s
      JOIN sale_items si ON s.id = si.sale_id
      GROUP BY TO_CHAR(created_at, $1)
      ORDER BY period DESC
      LIMIT 30
    `;

    const { rows } = await db.query(query, [timeFormat]);
    return rows;
  }

  static async delete(id) {
    const client = await db.pool.connect();
    
    try {
      await client.query('BEGIN');

      // Delete sale items first (cascade will handle this automatically)
      await client.query('DELETE FROM sales WHERE id = $1 RETURNING id', [id]);

      await client.query('COMMIT');
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = Sale; 