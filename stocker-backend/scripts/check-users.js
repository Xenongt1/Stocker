const { pool } = require('../config/db');

async function checkUsers() {
    try {
        const result = await pool.query('SELECT id, username, email, role FROM users');
        console.log('Users in database:', result.rows);
    } catch (err) {
        console.error('Error fetching users:', err);
    } finally {
        process.exit();
    }
}

checkUsers();
