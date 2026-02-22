require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');
const { pool, initializeDatabase } = require('./config/db');
const productsRouter = require('./routes/products');
const salesRouter = require('./routes/sales');
const authRoutes = require('./routes/auth');
const categoriesRouter = require('./routes/categories');
const usersRouter = require('./routes/users');
const customersRouter = require('./routes/customers');
const settingsRouter = require('./routes/settings');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: [
        'http://localhost:3000', 
        'http://localhost:3001', 
        'http://localhost:3002', 
        /\.onrender\.com$/ // Allow all Render subdomains
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token']
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productsRouter);
app.use('/api/sales', salesRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/users', usersRouter);
app.use('/api/customers', customersRouter);
app.use('/api/settings', settingsRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Server is running' });
});



// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something broke!' });
});

// Test database connection and start server
const startServer = async () => {
    try {
        // Test database connection
        await pool.query('SELECT NOW()');
        console.log('Database connected successfully');

        // Try to initialize database (this will handle existing tables gracefully)
        try {
            await initializeDatabase();
            console.log('Database initialized successfully');
        } catch (err) {
            // If error is about existing tables/data, we can proceed
            if (err.code === '23505') { // Duplicate key error
                console.log('Database already initialized with default data');
            } else {
                throw err;
            }
        }

        // Start server
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    } catch (err) {
        console.error('Failed to start server:', err);
        process.exit(1);
    }
};

startServer();

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.error('Unhandled Rejection:', err);
    process.exit(1);
}); 