const { pool } = require('../config/db');

async function migrate() {
    try {
        console.log('Adding status column to users table...');

        // Check if column exists first to avoid error
        const { rows: columns } = await pool.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'users' 
      AND COLUMN_NAME = 'status'
    `);

        if (columns.length === 0) {
            await pool.query(`
        ALTER TABLE users
        ADD COLUMN status VARCHAR(20) DEFAULT 'active'
        AFTER role
      `);
            console.log('Successfully added status column.');
        } else {
            console.log('Status column already exists.');
        }

        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrate();
