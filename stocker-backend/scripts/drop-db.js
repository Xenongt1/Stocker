const { pool } = require('../config/db');

async function dropTables() {
    const client = await pool.connect();
    try {
        console.log('Dropping tables...');
        await client.query('SET FOREIGN_KEY_CHECKS = 0');

        const tables = ['sale_items', 'credit_payments', 'sales', 'products', 'customers', 'categories', 'users'];
        for (const table of tables) {
            await client.query(`DROP TABLE IF EXISTS ${table}`);
            console.log(`Dropped ${table}`);
        }

        await client.query('SET FOREIGN_KEY_CHECKS = 1');
        console.log('Tables dropped. Restart server to recreate them.');
        process.exit(0);
    } catch (err) {
        console.error('Error dropping tables:', err);
        process.exit(1);
    } finally {
        client.release();
    }
}

dropTables();
