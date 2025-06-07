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

async function verifyAdmin() {
    try {
        // Check if admin exists
        const result = await pool.query(
            'SELECT * FROM users WHERE username = $1',
            ['admin']
        );

        console.log('Admin user check:', {
            exists: result.rows.length > 0,
            userData: result.rows[0]
        });

        if (result.rows.length > 0) {
            // Verify if password matches
            const validPassword = await bcrypt.compare('admin123', result.rows[0].password);
            console.log('Password verification:', {
                validPassword,
                storedHash: result.rows[0].password
            });

            if (!validPassword) {
                // Update password if it doesn't match
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash('admin123', salt);
                
                await pool.query(
                    'UPDATE users SET password = $1 WHERE username = $2',
                    [hashedPassword, 'admin']
                );
                console.log('Admin password updated');
            }
        } else {
            // Create admin if doesn't exist
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('admin123', salt);
            
            await pool.query(
                'INSERT INTO users (username, email, password, role) VALUES ($1, $2, $3, $4)',
                ['admin', 'admin@stocker.com', hashedPassword, 'admin']
            );
            console.log('Admin user created');
        }
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await pool.end();
    }
}

verifyAdmin(); 