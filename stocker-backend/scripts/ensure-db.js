const { Client } = require('pg');
require('dotenv').config();

const ensureDatabase = async () => {
    const client = new Client({
        user: process.env.DB_USER || 'postgres',
        host: process.env.DB_HOST || 'localhost',
        password: process.env.DB_PASSWORD || 'karabum05',
        port: process.env.DB_PORT || 5432,
        database: 'postgres' // Connect to default postgres database
    });

    try {
        await client.connect();
        
        // Check if our database exists
        const result = await client.query(
            "SELECT 1 FROM pg_database WHERE datname = $1",
            ['stocker_db']
        );

        // Create database if it doesn't exist
        if (result.rows.length === 0) {
            console.log('Creating database...');
            await client.query('CREATE DATABASE stocker_db');
            console.log('Database created successfully');
        } else {
            console.log('Database already exists');
        }
    } catch (err) {
        console.error('Error ensuring database exists:', err);
        throw err;
    } finally {
        await client.end();
    }
};

if (require.main === module) {
    ensureDatabase()
        .then(() => process.exit(0))
        .catch(err => {
            console.error(err);
            process.exit(1);
        });
} else {
    module.exports = { ensureDatabase };
} 