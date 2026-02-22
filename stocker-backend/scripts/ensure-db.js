const mysql = require('mysql2/promise');
require('dotenv').config();

const ensureDatabase = async () => {
    // Create connection to initialized without database selected
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD,
        port: process.env.DB_PORT || 3306
    });

    try {
        // Check if database exists
        const [rows] = await connection.query(
            `SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ?`,
            [process.env.DB_NAME || 'stocker_db']
        );

        if (rows.length === 0) {
            console.log('Creating database...');
            await connection.query(`CREATE DATABASE \`${process.env.DB_NAME || 'stocker_db'}\``);
            console.log('Database created successfully');
        } else {
            console.log('Database already exists');
        }
    } catch (err) {
        console.error('Error ensuring database exists:', err);
        throw err;
    } finally {
        await connection.end();
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