const { pool } = require('../config/db');
const fs = require('fs').promises;
const path = require('path');

async function runMigration() {
    try {
        // Read the migration file
        const migrationPath = path.join(__dirname, '..', 'db', 'migrations', 'categories.sql');
        const migrationSQL = await fs.readFile(migrationPath, 'utf8');
        
        // Run the migration
        await pool.query(migrationSQL);
        
        console.log('Categories migration completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error running migration:', error);
        process.exit(1);
    }
}

runMigration(); 