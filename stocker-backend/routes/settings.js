const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const auth = require('../middleware/auth'); // Import appropriately based on file inspection

// Get global settings
router.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM settings WHERE id = 1');

        if (result.rows.length === 0) {
            // Should not happen due to init script, but fallback just in case
            return res.json({
                storeName: 'Stocker Store',
                currency: 'USD',
                taxRate: 7.5,
                lowStockThreshold: 5,
                maxDiscount: 20,
                receiptFooter: 'Thank you for your purchase!'
            });
        }

        const dbSettings = result.rows[0];

        // Map snake_case DB columns to camelCase frontend expectations
        const settings = {
            storeName: dbSettings.store_name,
            currency: dbSettings.currency,
            taxRate: parseFloat(dbSettings.tax_rate),
            lowStockThreshold: dbSettings.low_stock_threshold,
            maxDiscount: parseFloat(dbSettings.max_discount),
            receiptFooter: dbSettings.receipt_footer
        };

        res.json(settings);
    } catch (err) {
        console.error('Error fetching settings:', err);
        res.status(500).json({ error: 'Failed to fetch settings' });
    }
});

// Update global settings
// Protected to admins ideally, but let's check auth at least
router.put('/', auth, async (req, res) => {
    // Ideally check if req.user.role === 'admin'
    // but for now let's allow authenticated users or rely on frontend hiding it

    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied. Only admins can change global settings.' });
    }

    const { storeName, currency, taxRate, lowStockThreshold, maxDiscount, receiptFooter } = req.body;

    try {
        await pool.query(`
            UPDATE settings 
            SET store_name = ?, 
                currency = ?, 
                tax_rate = ?, 
                low_stock_threshold = ?, 
                max_discount = ?, 
                receipt_footer = ?
            WHERE id = 1
        `, [storeName, currency, taxRate, lowStockThreshold, maxDiscount, receiptFooter]);

        res.json({ message: 'Settings updated successfully' });
    } catch (err) {
        console.error('Error updating settings:', err);
        res.status(500).json({ error: 'Failed to update settings' });
    }
});

module.exports = router;
