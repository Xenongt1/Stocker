const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const fs = require('fs').promises;
const path = require('path');

// First, connect to postgres to create the database
const initPool = new Pool({
    user: 'postgres',
    host: 'localhost',
    password: 'karabum05',
    port: 5432,
    database: 'postgres' // Connect to default postgres database first
});

async function createDatabase() {
    try {
        // Check if database exists
        const result = await initPool.query(
            "SELECT 1 FROM pg_database WHERE datname = 'stocker_db'"
        );
        
        if (result.rows.length === 0) {
            // Database doesn't exist, create it
            await initPool.query('CREATE DATABASE stocker_db');
            console.log('Database stocker_db created');
        }
    } catch (err) {
        console.error('Error creating database:', err);
        throw err;
    } finally {
        await initPool.end();
    }
}

// Now connect to our database for table creation
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    password: 'karabum05',
    port: 5432,
    database: 'stocker_db'
});

async function dropTables() {
    try {
        // Drop tables in correct order due to foreign key constraints
        await pool.query('DROP TABLE IF EXISTS sale_items CASCADE');
        await pool.query('DROP TABLE IF EXISTS sales CASCADE');
        await pool.query('DROP TABLE IF EXISTS products CASCADE');
        await pool.query('DROP TABLE IF EXISTS users CASCADE');
        console.log('Tables dropped successfully');
    } catch (err) {
        console.error('Error dropping tables:', err);
        throw err;
    }
}

async function createTables() {
    try {
        // Create users table first
        await pool.query(`
            CREATE TABLE users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                role VARCHAR(20) DEFAULT 'user',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Create products table
        await pool.query(`
            CREATE TABLE products (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                sku VARCHAR(50) UNIQUE NOT NULL,
                price DECIMAL(10,2) NOT NULL,
                cost_price DECIMAL(10,2) NOT NULL,
                quantity INTEGER NOT NULL DEFAULT 0,
                min_stock_level INTEGER DEFAULT 5,
                category VARCHAR(100),
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Create sales table
        await pool.query(`
            CREATE TABLE sales (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id),
                subtotal DECIMAL(10,2) NOT NULL,
                discount DECIMAL(10,2) DEFAULT 0,
                tax DECIMAL(10,2) DEFAULT 0,
                total DECIMAL(10,2) NOT NULL,
                payment_method VARCHAR(50) DEFAULT 'Cash',
                status VARCHAR(50) DEFAULT 'COMPLETED',
                refund_reason TEXT,
                refunded_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Create sale_items table
        await pool.query(`
            CREATE TABLE sale_items (
                id SERIAL PRIMARY KEY,
                sale_id INTEGER REFERENCES sales(id) ON DELETE CASCADE,
                product_id INTEGER REFERENCES products(id),
                quantity INTEGER NOT NULL,
                price DECIMAL(10,2) NOT NULL,
                total DECIMAL(10,2) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        console.log('Tables created successfully');

        // Create default admin user
        const hashedPassword = await bcrypt.hash('admin123', 10);
        await pool.query(
            'INSERT INTO users (username, password, role) VALUES ($1, $2, $3)',
            ['admin', hashedPassword, 'admin']
        );
        console.log('Default admin user created');

    } catch (err) {
        console.error('Error creating tables:', err);
        throw err;
    }
}

async function initializeDatabase() {
    try {
        await dropTables();
        await createTables();
        console.log('Database initialization completed');
    } catch (err) {
        console.error('Database initialization failed:', err);
    } finally {
        await pool.end();
    }
}

// Run the initialization
createDatabase()
    .then(() => initializeDatabase())
    .then(() => {
        console.log('Database initialization completed');
        process.exit(0);
    })
    .catch(err => {
        console.error('Database initialization failed:', err);
        process.exit(1);
    }); 