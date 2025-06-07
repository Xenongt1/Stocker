require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'stocker_db',
    password: 'karabum05',
    port: 5432,
});

async function createAdminUser() {
    try {
        // Hash the admin password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('admin123', salt);

        // Create admin user if it doesn't exist
        const adminUser = {
            username: 'admin',
            email: 'admin@stocker.com',
            password: hashedPassword,
            role: 'admin'
        };

        // First try to update existing admin user's password
        const updateResult = await pool.query(
            'UPDATE users SET password = $1 WHERE username = $2 RETURNING *',
            [adminUser.password, adminUser.username]
        );

        if (updateResult.rows.length === 0) {
            // If no user was updated, create a new admin user
            await pool.query(
                'INSERT INTO users (username, email, password, role) VALUES ($1, $2, $3, $4)',
                [adminUser.username, adminUser.email, adminUser.password, adminUser.role]
            );
            console.log('Admin user created successfully');
        } else {
            console.log('Admin password updated successfully');
        }
    } catch (err) {
        console.error('Error creating/updating admin user:', err);
    } finally {
        await pool.end();
    }
}

createAdminUser(); 