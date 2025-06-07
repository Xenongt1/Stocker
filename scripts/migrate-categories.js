const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'stocker_db',
    password: 'karabum05',
    port: 5432
});

async function migrateCategoriesTable() {
    try {
        // Create categories table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS categories (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL UNIQUE,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            -- Add category_id to products table if it doesn't exist
            DO $$ 
            BEGIN 
                IF NOT EXISTS (
                    SELECT 1 
                    FROM information_schema.columns 
                    WHERE table_name='products' AND column_name='category_id'
                ) THEN 
                    ALTER TABLE products 
                    ADD COLUMN category_id INTEGER REFERENCES categories(id);
                END IF;
            END $$;

            -- Create trigger function if it doesn't exist
            CREATE OR REPLACE FUNCTION update_updated_at_column()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.updated_at = CURRENT_TIMESTAMP;
                RETURN NEW;
            END;
            $$ language 'plpgsql';

            -- Drop trigger if it exists
            DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;

            -- Create trigger
            CREATE TRIGGER update_categories_updated_at
                BEFORE UPDATE ON categories
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column();
        `);

        console.log('Categories migration completed successfully!');
    } catch (error) {
        console.error('Error running migration:', error);
    } finally {
        await pool.end();
    }
}

migrateCategoriesTable(); 