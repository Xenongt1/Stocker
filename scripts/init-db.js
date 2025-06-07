const { pool } = require('../config/db');
const bcrypt = require('bcryptjs');

async function initializeDatabase() {
    try {
        // Create users table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                role VARCHAR(20) DEFAULT 'user',
                first_name VARCHAR(100),
                last_name VARCHAR(100),
                active BOOLEAN DEFAULT true,
                last_login TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            -- Create categories table
            CREATE TABLE IF NOT EXISTS categories (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL UNIQUE,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            -- Create products table
            CREATE TABLE IF NOT EXISTS products (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                sku VARCHAR(50) UNIQUE NOT NULL,
                price DECIMAL(10,2) NOT NULL,
                cost_price DECIMAL(10,2) NOT NULL,
                quantity INTEGER NOT NULL DEFAULT 0,
                min_stock_level INTEGER DEFAULT 5,
                category_id INTEGER REFERENCES categories(id),
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            -- Create sales table
            CREATE TABLE IF NOT EXISTS sales (
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

            -- Create sale_items table
            CREATE TABLE IF NOT EXISTS sale_items (
                id SERIAL PRIMARY KEY,
                sale_id INTEGER REFERENCES sales(id) ON DELETE CASCADE,
                product_id INTEGER REFERENCES products(id),
                quantity INTEGER NOT NULL,
                price DECIMAL(10,2) NOT NULL,
                total DECIMAL(10,2) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            -- Create trigger function for updating timestamps
            CREATE OR REPLACE FUNCTION update_updated_at_column()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.updated_at = CURRENT_TIMESTAMP;
                RETURN NEW;
            END;
            $$ language 'plpgsql';

            -- Create triggers for updating timestamps
            DROP TRIGGER IF EXISTS update_users_updated_at ON users;
            CREATE TRIGGER update_users_updated_at
                BEFORE UPDATE ON users
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column();

            DROP TRIGGER IF EXISTS update_products_updated_at ON products;
            CREATE TRIGGER update_products_updated_at
                BEFORE UPDATE ON products
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column();

            DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
            CREATE TRIGGER update_categories_updated_at
                BEFORE UPDATE ON categories
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column();
        `);

        // Create default admin user
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('admin123', salt);

        await pool.query(`
            INSERT INTO users (username, email, password, role, first_name, last_name, active)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (username) DO NOTHING
            RETURNING id, username, email, role;
        `, [
            'admin',
            'admin@stocker.com',
            hashedPassword,
            'admin',
            'Admin',
            'User',
            true
        ]);

        // Create some default categories
        await pool.query(`
            INSERT INTO categories (name, description)
            VALUES 
                ('Electronics', 'Electronic devices and accessories'),
                ('Office Supplies', 'General office supplies and stationery'),
                ('Furniture', 'Office furniture and fixtures'),
                ('Software', 'Software licenses and subscriptions')
            ON CONFLICT (name) DO NOTHING;
        `);

        console.log('Database tables created successfully');
        console.log('\nDefault admin user created:');
        console.log('Username: admin');
        console.log('Password: admin123');
        console.log('\nDefault categories created');
    } catch (err) {
        console.error('Error creating database tables:', err);
        throw err;
    }
}

initializeDatabase()
    .then(() => {
        console.log('Database initialization completed');
        process.exit(0);
    })
    .catch(err => {
        console.error('Database initialization failed:', err);
        process.exit(1);
    }); 