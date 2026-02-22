const db = require('../db');

class Category {
    static async getAll() {
        const query = 'SELECT * FROM categories ORDER BY name';
        const { rows } = await db.query(query);
        return rows;
    }

    static async getById(id) {
        const query = 'SELECT * FROM categories WHERE id = ?';
        const { rows } = await db.query(query, [id]);
        return rows[0];
    }

    static async create(categoryData) {
        const { name, description } = categoryData;
        const query = `
            INSERT INTO categories (name, description)
            VALUES (?, ?)
        `;
        const result = await db.query(query, [name, description]);
        const newCategory = await db.query('SELECT * FROM categories WHERE id = ?', [result.insertId]);
        return newCategory.rows[0];
    }

    static async update(id, categoryData) {
        const { name, description } = categoryData;
        const query = `
            UPDATE categories
            SET name = ?, description = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `;
        await db.query(query, [name, description, id]);
        const updatedCategory = await db.query('SELECT * FROM categories WHERE id = ?', [id]);
        return updatedCategory.rows[0];
    }

    static async delete(id) {
        // First, update any products that use this category to have null category_id
        await db.query('UPDATE products SET category_id = NULL WHERE category_id = ?', [id]);

        const query = 'DELETE FROM categories WHERE id = ?';
        await db.query(query, [id]);
        return { message: 'Deleted successfully' };
    }

    static async getProductCount(categoryId) {
        const query = 'SELECT COUNT(*) as count FROM products WHERE category_id = ?';
        const { rows } = await db.query(query, [categoryId]);
        return parseInt(rows[0].count);
    }

    static async getSalesStats(categoryId, period = 'all') {
        let timeFilter = '';
        if (period !== 'all') {
            const periods = {
                'monthly': 'MONTH',
                'weekly': 'WEEK',
                'daily': 'DAY',
                'yearly': 'YEAR'
            };
            const unit = periods[period] || 'MONTH';
            timeFilter = `AND s.created_at >= NOW() - INTERVAL 1 ${unit}`;
        }

        const query = `
            SELECT 
                c.id,
                c.name,
                COUNT(DISTINCT s.id) as total_sales,
                SUM(si.quantity) as items_sold,
                SUM(si.quantity * si.price) as revenue
            FROM categories c
            LEFT JOIN products p ON p.category_id = c.id
            LEFT JOIN sale_items si ON si.product_id = p.id
            LEFT JOIN sales s ON s.id = si.sale_id
            WHERE c.id = ? ${timeFilter}
            GROUP BY c.id, c.name
        `;

        const { rows } = await db.query(query, [categoryId]);
        return rows[0];
    }

    static async getAllWithStats(period = 'all') {
        let timeFilter = '';
        if (period !== 'all') {
            const periods = {
                'monthly': 'MONTH',
                'weekly': 'WEEK',
                'daily': 'DAY',
                'yearly': 'YEAR'
            };
            const unit = periods[period] || 'MONTH';
            timeFilter = `AND s.created_at >= NOW() - INTERVAL 1 ${unit}`;
        }

        const query = `
            SELECT 
                c.id,
                c.name,
                c.description,
                COUNT(DISTINCT s.id) as total_sales,
                SUM(si.quantity) as items_sold,
                SUM(si.quantity * si.price) as revenue,
                COUNT(DISTINCT p.id) as product_count
            FROM categories c
            LEFT JOIN products p ON p.category_id = c.id
            LEFT JOIN sale_items si ON si.product_id = p.id
            LEFT JOIN sales s ON s.id = si.sale_id
            GROUP BY c.id, c.name, c.description
            ORDER BY revenue DESC
        `;

        const { rows } = await db.query(query);
        return rows.map(row => ({
            ...row,
            revenue: parseFloat(row.revenue) || 0,
            items_sold: parseInt(row.items_sold) || 0,
            total_sales: parseInt(row.total_sales) || 0,
            product_count: parseInt(row.product_count) || 0
        }));
    }
}

module.exports = Category; 