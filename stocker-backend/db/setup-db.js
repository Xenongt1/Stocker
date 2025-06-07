const { Pool } = require('pg');
const fs = require('fs').promises;
const path = require('path');

// Database connection for creating database
const adminPool = new Pool({
    user: 'postgres',
    host: 'localhost',
    password: 'karabum05',
    port: 5432,
    database: 'postgres' // Connect to default database first
});

async function setupDatabase() {
    try {
        // Create database if it doesn't exist
        await adminPool.query(`
            SELECT 'CREATE DATABASE stocker_db'
            WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'stocker_db')
        `).then(() => {
            console.log('Database checked/created successfully');
        });

        // Close admin connection
        await adminPool.end();

        // Connect to our new database
        const appPool = new Pool({
            user: 'postgres',
            host: 'localhost',
            password: 'karabum05',
            port: 5432,
            database: 'stocker_db'
        });

        // Read and execute schema file
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schema = await fs.readFile(schemaPath, 'utf8');
        
        await appPool.query(schema);
        console.log('Schema applied successfully');

        await appPool.end();
        console.log('Database setup completed successfully');
    } catch (error) {
        console.error('Error setting up database:', error);
        process.exit(1);
    }
}

setupDatabase(); 