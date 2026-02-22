const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const auth = require('../middleware/auth');

// Debug middleware
router.use((req, res, next) => {
    console.log(`[PRODUCTS ROUTE] ${req.method} ${req.path}`);
    console.log('Request body:', req.body);
    next();
});

// Parse numeric fields from PostgreSQL
const parseNumericFields = (product) => ({
    ...product,
    price: typeof product.price === 'string' ? parseFloat(product.price) : product.price,
    cost_price: typeof product.cost_price === 'string' ? parseFloat(product.cost_price) : product.cost_price,
    quantity: typeof product.quantity === 'string' ? parseInt(product.quantity) : product.quantity,
    min_stock_level: typeof product.min_stock_level === 'string' ? parseInt(product.min_stock_level) : product.min_stock_level
});

// Get all products
router.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM products ORDER BY created_at DESC');
        // Parse numeric fields before sending response
        const parsedProducts = result.rows.map(parseNumericFields);
        res.json(parsedProducts);
    } catch (err) {
        console.error('Error fetching products:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get a single product
router.get('/:id', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM products WHERE id = ?', [req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }
        // Parse numeric fields before sending response
        const parsedProduct = parseNumericFields(result.rows[0]);
        res.json(parsedProduct);
    } catch (err) {
        console.error('Error fetching product:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Create a new product
router.post('/', async (req, res) => {
    const { name, description, sku, price, costPrice, quantity, category, minStockLevel } = req.body;

    try {
        // Validate required fields
        if (!name || !sku || !price) {
            return res.status(400).json({ error: 'Name, SKU, and price are required' });
        }

        // Validate numeric fields
        const numericPrice = parseFloat(price);
        const numericCostPrice = parseFloat(costPrice || 0);
        const numericQuantity = parseInt(quantity || 0);
        const numericMinStockLevel = parseInt(minStockLevel || 5);

        if (isNaN(numericPrice) || numericPrice <= 0) {
            return res.status(400).json({ error: 'Price must be a positive number' });
        }

        if (isNaN(numericCostPrice) || numericCostPrice < 0) {
            return res.status(400).json({ error: 'Cost price must be a non-negative number' });
        }

        if (isNaN(numericQuantity) || numericQuantity < 0) {
            return res.status(400).json({ error: 'Quantity must be a non-negative number' });
        }

        // Check if SKU already exists
        const skuCheck = await pool.query('SELECT id FROM products WHERE sku = ?', [sku]);
        if (skuCheck.rows.length > 0) {
            return res.status(400).json({ error: 'SKU already exists' });
        }

        // Resolve category_id from name
        let categoryId = null;
        if (category) {
            const catResult = await pool.query('SELECT id FROM categories WHERE name = ?', [category]);
            if (catResult.rows.length > 0) {
                categoryId = catResult.rows[0].id;
            } else {
                return res.status(400).json({ error: `Category '${category}' not found. Please create it first.` });
            }
        }

        const result = await pool.query(
            `INSERT INTO products (
                name, description, sku, price, cost_price, 
                quantity, category_id, min_stock_level
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                name,
                description || '',
                sku,
                numericPrice,
                numericCostPrice,
                numericQuantity,
                categoryId,
                numericMinStockLevel
            ]
        );

        const newProduct = await pool.query('SELECT * FROM products WHERE id = ?', [result.rows.insertId]);

        // Parse numeric fields before sending response
        const parsedProduct = parseNumericFields(newProduct.rows[0]);
        console.log('Product created successfully:', parsedProduct);
        res.status(201).json(parsedProduct);
    } catch (err) {
        console.error('Error creating product:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update a product
router.put('/:id', async (req, res) => {
    const { name, description, sku, price, costPrice, quantity, category, minStockLevel } = req.body;

    try {
        // Validate required fields
        if (!name || !sku || !price) {
            return res.status(400).json({ error: 'Name, SKU, and price are required' });
        }

        // Validate numeric fields
        const numericPrice = parseFloat(price);
        const numericCostPrice = parseFloat(costPrice || 0);
        const numericQuantity = parseInt(quantity || 0);
        const numericMinStockLevel = parseInt(minStockLevel || 5);

        if (isNaN(numericPrice) || numericPrice <= 0) {
            return res.status(400).json({ error: 'Price must be a positive number' });
        }

        if (isNaN(numericCostPrice) || numericCostPrice < 0) {
            return res.status(400).json({ error: 'Cost price must be a non-negative number' });
        }

        if (isNaN(numericQuantity) || numericQuantity < 0) {
            return res.status(400).json({ error: 'Quantity must be a non-negative number' });
        }

        // Check if SKU already exists for other products
        const skuCheck = await pool.query('SELECT id FROM products WHERE sku = ? AND id != ?', [sku, req.params.id]);
        if (skuCheck.rows.length > 0) {
            return res.status(400).json({ error: 'SKU already exists' });
        }

        // Resolve category_id from name
        let categoryId = null;
        if (category) {
            const catResult = await pool.query('SELECT id FROM categories WHERE name = ?', [category]);
            if (catResult.rows.length > 0) {
                categoryId = catResult.rows[0].id;
            } else {
                return res.status(400).json({ error: `Category '${category}' not found. Please create it first.` });
            }
        }

        const result = await pool.query(
            `UPDATE products SET 
                name = ?, 
                description = ?, 
                sku = ?, 
                price = ?, 
                cost_price = ?, 
                quantity = ?, 
                category_id = ?, 
                min_stock_level = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?`,
            [
                name,
                description || '',
                sku,
                numericPrice,
                numericCostPrice,
                numericQuantity,
                categoryId,
                numericMinStockLevel,
                req.params.id
            ]
        );

        if (result.rows.affectedRows === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }

        const updatedProduct = await pool.query('SELECT * FROM products WHERE id = ?', [req.params.id]);

        // Parse numeric fields before sending response
        const parsedProduct = parseNumericFields(updatedProduct.rows[0]);
        console.log('Product updated successfully:', parsedProduct);
        res.json(parsedProduct);
    } catch (err) {
        console.error('Error updating product:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Delete a product
router.delete('/:id', async (req, res) => {
    try {
        const result = await pool.query('DELETE FROM products WHERE id = ?', [req.params.id]);
        if (result.rows.affectedRows === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.json({ message: 'Product deleted successfully' });
    } catch (err) {
        console.error('Error deleting product:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router; 