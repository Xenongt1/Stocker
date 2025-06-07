const { pool } = require('./db');
const bcrypt = require('bcryptjs');

const initializeDatabase = async () => {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');

        // Create users table
        await client.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                username VARCHAR(50) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                role VARCHAR(20) NOT NULL DEFAULT 'user',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_login TIMESTAMP
            )
        `);

        // Create categories table
        await client.query(`
            CREATE TABLE IF NOT EXISTS categories (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create products table
        await client.query(`
            CREATE TABLE IF NOT EXISTS products (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                sku VARCHAR(50) UNIQUE,
                category_id INTEGER REFERENCES categories(id),
                price DECIMAL(10,2) NOT NULL,
                quantity INTEGER NOT NULL DEFAULT 0,
                reorder_point INTEGER DEFAULT 10,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create customers table for credit tracking
        await client.query(`
            CREATE TABLE IF NOT EXISTS customers (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255),
                phone VARCHAR(20),
                address TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create sales table with credit support
        await client.query(`
            CREATE TABLE IF NOT EXISTS sales (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id),
                customer_id INTEGER REFERENCES customers(id),
                subtotal DECIMAL(10,2) NOT NULL,
                tax DECIMAL(10,2) DEFAULT 0,
                discount DECIMAL(10,2) DEFAULT 0,
                total DECIMAL(10,2) NOT NULL,
                amount_paid DECIMAL(10,2) NOT NULL,
                payment_status VARCHAR(20) CHECK (payment_status IN ('paid', 'partial', 'credit')),
                payment_method VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create sale_items table
        await client.query(`
            CREATE TABLE IF NOT EXISTS sale_items (
                id SERIAL PRIMARY KEY,
                sale_id INTEGER REFERENCES sales(id),
                product_id INTEGER REFERENCES products(id),
                quantity INTEGER NOT NULL,
                price DECIMAL(10,2) NOT NULL,
                total DECIMAL(10,2) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create credit_payments table for tracking partial payments
        await client.query(`
            CREATE TABLE IF NOT EXISTS credit_payments (
                id SERIAL PRIMARY KEY,
                sale_id INTEGER REFERENCES sales(id),
                amount DECIMAL(10,2) NOT NULL,
                payment_method VARCHAR(50),
                payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                created_by INTEGER REFERENCES users(id)
            )
        `);

        // Create default admin user if not exists
        const adminPassword = await bcrypt.hash('admin123', 10);
        await client.query(`
            INSERT INTO users (email, username, password, role)
            VALUES ('admin@stalker.com', 'admin', $1, 'admin')
            ON CONFLICT (email) DO NOTHING
        `, [adminPassword]);

        // Create default categories
        const defaultCategories = ['Electronics', 'Clothing', 'Food', 'Beverages', 'Other'];
        for (const category of defaultCategories) {
            await client.query(`
                INSERT INTO categories (name)
                VALUES ($1)
                ON CONFLICT (name) DO NOTHING
            `, [category]);
        }

        await client.query('COMMIT');
        console.log('Database initialized successfully');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error initializing database:', err);
        throw err;
    } finally {
        client.release();
    }
};

module.exports = { initializeDatabase }; 