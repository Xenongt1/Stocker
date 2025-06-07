const db = require('../config/database');

class Product {
  static async create(productData) {
    const query = `
      INSERT INTO products (name, sku, price, cost_price, quantity, category, description, min_stock_level)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    
    const values = [
      productData.name,
      productData.sku,
      productData.price,
      productData.costPrice || 0,
      productData.quantity || 0,
      productData.category,
      productData.description || '',
      productData.minStockLevel || 5
    ];

    const { rows } = await db.query(query, values);
    return rows[0];
  }

  static async findById(id) {
    const query = 'SELECT * FROM products WHERE id = $1';
    const { rows } = await db.query(query, [id]);
    return rows[0];
  }

  static async findBySku(sku) {
    const query = 'SELECT * FROM products WHERE sku = $1';
    const { rows } = await db.query(query, [sku]);
    return rows[0];
  }

  static async list(filters = {}) {
    let query = 'SELECT * FROM products';
    const values = [];
    const conditions = [];
    let paramCount = 1;

    if (filters.category) {
      conditions.push(`category = $${paramCount}`);
      values.push(filters.category);
      paramCount++;
    }

    if (filters.lowStock) {
      conditions.push(`quantity <= min_stock_level`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY name ASC';

    const { rows } = await db.query(query, values);
    return rows;
  }

  static async update(id, updates) {
    const validFields = [
      'name', 'sku', 'price', 'cost_price', 'quantity',
      'category', 'description', 'min_stock_level'
    ];
    
    const updateFields = [];
    const values = [];
    let paramCount = 1;

    for (const [key, value] of Object.entries(updates)) {
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      if (validFields.includes(snakeKey) && value !== undefined) {
        updateFields.push(`${snakeKey} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    }

    if (updateFields.length === 0) return null;

    values.push(id);
    const query = `
      UPDATE products 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const { rows } = await db.query(query, values);
    return rows[0];
  }

  static async updateStock(id, adjustment) {
    const query = `
      UPDATE products 
      SET quantity = quantity + $1
      WHERE id = $2 AND (quantity + $1) >= 0
      RETURNING *
    `;

    const { rows } = await db.query(query, [adjustment, id]);
    return rows[0];
  }

  static async delete(id) {
    const query = 'DELETE FROM products WHERE id = $1 RETURNING id';
    const { rows } = await db.query(query, [id]);
    return rows[0];
  }

  static async getLowStockProducts() {
    const query = 'SELECT * FROM products WHERE quantity <= min_stock_level ORDER BY quantity ASC';
    const { rows } = await db.query(query);
    return rows;
  }
}

module.exports = Product; 