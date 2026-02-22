const { pool } = require('../config/db');
const bcrypt = require('bcryptjs');

async function resetForProduction() {
    const client = await pool.connect();
    try {
        console.log('Starting production reset...');
        await client.query('BEGIN');

        // Disable foreign key checks to allow truncation
        await client.query('SET FOREIGN_KEY_CHECKS = 0');

        console.log('Clearing tables...');
        const tables = ['sale_items', 'credit_payments', 'sales', 'products', 'customers', 'categories', 'users'];
        for (const table of tables) {
            await client.query(`TRUNCATE TABLE ${table}`);
            console.log(`Cleared ${table}`);
        }

        await client.query('SET FOREIGN_KEY_CHECKS = 1');

        console.log('Creating default admin user...');
        const adminPassword = await bcrypt.hash('admin123', 10);
        // Create admin
        await client.query(`
      INSERT INTO users (email, username, password, role)
      VALUES (?, ?, ?, 'admin')
    `, ['admin@stalker.com', 'admin', adminPassword]);

        await client.query('COMMIT');
        console.log('Production reset complete. Only admin user exists.');
        process.exit(0);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error resetting database:', err);
        process.exit(1);
    } finally {
        client.release();
    }
}

resetForProduction();
