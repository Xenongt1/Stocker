const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Create the connection pool
const poolConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'stocker_db',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  decimalNumbers: true, // Important for price calculations
  ssl: process.env.DB_SSL === 'true' ? {
    rejectUnauthorized: false
  } : undefined
};

// Create the connection pool
const mysqlPool = mysql.createPool(process.env.DATABASE_URL || poolConfig);

// Wrapper to mimic pg pool interface
const pool = {
  query: async (sql, params) => {
    try {
      const [results] = await mysqlPool.query(sql, params);
      return {
        rows: results,
        rowCount: Array.isArray(results) ? results.length : results.affectedRows,
        // For compatibility with insertId usage
        insertId: results.insertId
      };
    } catch (err) {
      console.error('Database Query Error:', err.message, sql);
      throw err;
    }
  },
  connect: async () => {
    const connection = await mysqlPool.getConnection();
    return {
      query: async (sql, params) => {
        try {
          const [results] = await connection.query(sql, params);
          return {
            rows: results,
            rowCount: Array.isArray(results) ? results.length : results.affectedRows,
            insertId: results.insertId
          };
        } catch (err) {
          console.error('Database Client Query Error:', err.message, sql);
          throw err;
        }
      },
      release: () => connection.release(),
      // Helper for transactions if needed, but manual query('BEGIN') works too
    };
  },
  on: (event, cb) => mysqlPool.on(event, cb),
  end: () => mysqlPool.end()
};

const query = pool.query;

const initializeDatabase = async () => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        role VARCHAR(20) NOT NULL DEFAULT 'user',
        status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP NULL
      )
    `);

    // Create categories table
    await client.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create products table
    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        sku VARCHAR(50) UNIQUE,
        category_id INT,
        price DECIMAL(10,2) NOT NULL,
        cost_price DECIMAL(10,2) DEFAULT 0,
        quantity INT NOT NULL DEFAULT 0,
        min_stock_level INT DEFAULT 10,
        reorder_point INT DEFAULT 10,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id)
      )
    `);

    // Create customers table
    await client.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(20),
        address TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create sales table
    await client.query(`
      CREATE TABLE IF NOT EXISTS sales (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        customer_id INT,
        subtotal DECIMAL(10,2) NOT NULL,
        tax DECIMAL(10,2) DEFAULT 0,
        discount DECIMAL(10,2) DEFAULT 0,
        total DECIMAL(10,2) NOT NULL,
        amount_paid DECIMAL(10,2) NOT NULL,
        payment_status ENUM('paid', 'partial', 'credit'),
        payment_method VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (customer_id) REFERENCES customers(id)
      )
    `);

    // Create sale_items table
    await client.query(`
      CREATE TABLE IF NOT EXISTS sale_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        sale_id INT,
        product_id INT,
        quantity INT NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        total DECIMAL(10,2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (sale_id) REFERENCES sales(id),
        FOREIGN KEY (product_id) REFERENCES products(id)
      )
    `);

    // Create credit_payments table
    await client.query(`
      CREATE TABLE IF NOT EXISTS credit_payments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        sale_id INT,
        amount DECIMAL(10,2) NOT NULL,
        payment_method VARCHAR(50),
        payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by INT,
        FOREIGN KEY (sale_id) REFERENCES sales(id),
        FOREIGN KEY (created_by) REFERENCES users(id)
      )
    `);

    // Create default admin user if not exists
    const adminPassword = await bcrypt.hash('admin123', 10);
    // MySQL INSERT IGNORE or ON DUPLICATE KEY UPDATE
    await client.query(`
      INSERT INTO users (email, username, password, role)
      VALUES (?, ?, ?, 'admin')
      ON DUPLICATE KEY UPDATE id=id
    `, ['admin@stalker.com', 'admin', adminPassword]);

    // Create settings table
    await client.query(`
      CREATE TABLE IF NOT EXISTS settings (
        id INT PRIMARY KEY,
        store_name VARCHAR(255) DEFAULT 'Stocker Store',
        currency VARCHAR(10) DEFAULT 'USD',
        tax_rate DECIMAL(5,2) DEFAULT 7.50,
        low_stock_threshold INT DEFAULT 5,
        max_discount DECIMAL(10,2) DEFAULT 0,
        receipt_footer TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Insert default settings if not exists
    await client.query(`
      INSERT INTO settings (id, store_name, currency, tax_rate, low_stock_threshold, max_discount, receipt_footer)
      VALUES (1, 'Stocker Store', 'USD', 7.50, 5, 20.00, 'Thank you for your purchase!')
      ON DUPLICATE KEY UPDATE id=id
    `);



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

module.exports = {
  query,
  pool,
  initializeDatabase,
  mysqlPool // Export raw pool if needed
};