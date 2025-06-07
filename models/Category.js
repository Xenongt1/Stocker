const { query } = require('../stocker-backend/config/db');

class Category {
    static async getAll() {
        const sql = 'SELECT * FROM categories ORDER BY name';
        const { rows } = await query(sql);
        return rows;
    }

    static async getById(id) {
        const sql = 'SELECT * FROM categories WHERE id = $1';
        const { rows } = await query(sql, [id]);
        return rows[0];
    }

    static async create(categoryData) {
        const { name, description } = categoryData;
        const sql = `
            INSERT INTO categories (name, description)
            VALUES ($1, $2)
            RETURNING *
        `;
        const { rows } = await query(sql, [name, description]);
        return rows[0];
    }

    static async update(id, categoryData) {
        const { name, description } = categoryData;
        const sql = `
            UPDATE categories
            SET name = $1, description = $2, updated_at = CURRENT_TIMESTAMP
            WHERE id = $3
            RETURNING *
        `;
        const { rows } = await query(sql, [name, description, id]);
        return rows[0];
    }

    static async delete(id) {
        // First, update any products that use this category to have null category_id
        await query('UPDATE products SET category_id = NULL WHERE category_id = $1', [id]);
        
        const sql = 'DELETE FROM categories WHERE id = $1 RETURNING *';
        const { rows } = await query(sql, [id]);
        return rows[0];
    }

    static async getProductCount(categoryId) {
        const sql = 'SELECT COUNT(*) as count FROM products WHERE category_id = $1';
        const { rows } = await query(sql, [categoryId]);
        return parseInt(rows[0].count);
    }

    static async getSalesStats(categoryId, period = 'all') {
        let timeFilter = '';
        if (period !== 'all') {
            timeFilter = `AND s.created_at >= NOW() - INTERVAL '1 ${period}'`;
        }

        const sql = `
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
            WHERE c.id = $1 ${timeFilter}
            GROUP BY c.id, c.name
        `;
        
        const { rows } = await query(sql, [categoryId]);
        return rows[0];
    }

    static async getAllWithStats(period = 'all') {
        let timeFilter = '';
        if (period !== 'all') {
            timeFilter = `AND s.created_at >= NOW() - INTERVAL '1 ${period}'`;
        }

        const sql = `
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
            ORDER BY revenue DESC NULLS LAST
        `;
        
        const { rows } = await query(sql);
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