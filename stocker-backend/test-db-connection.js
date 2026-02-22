const mysql = require('mysql2/promise');
require('dotenv').config();

async function testConnection() {
    console.log('Testing MySQL Connection...');
    console.log('Host:', process.env.DB_HOST);
    console.log('User:', process.env.DB_USER);
    console.log('Database:', process.env.DB_NAME);
    console.log('Port:', process.env.DB_PORT);

    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: process.env.DB_PORT
        });

        console.log('\nSUCCESS! Connected to MySQL database.');

        // Test simple query
        const [rows] = await connection.execute('SELECT 1 + 1 AS result');
        console.log('Query Test (1+1):', rows[0].result);

        // Check tables
        const [tables] = await connection.execute('SHOW TABLES');
        console.log('\nTables in database:');
        tables.forEach(table => {
            console.log(`- ${Object.values(table)[0]}`);
        });

        await connection.end();
    } catch (err) {
        console.error('\nCONNECTION FAILED:', err.message);
    }
}

testConnection();
