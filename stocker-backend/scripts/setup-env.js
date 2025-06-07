const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Generate a secure random JWT secret
const generateJWTSecret = () => {
    return crypto.randomBytes(32).toString('hex');
};

// Create .env file content
const createEnvContent = (jwtSecret) => {
    return `PGUSER=postgres
PGHOST=localhost
PGDATABASE=stocker
PGPASSWORD=${process.env.PGPASSWORD || 'your_postgres_password'}
PGPORT=5432
JWT_SECRET=${jwtSecret}
`;
};

const setupEnv = () => {
    try {
        // Generate new JWT secret
        const jwtSecret = generateJWTSecret();
        
        // Create .env file content
        const envContent = createEnvContent(jwtSecret);
        
        // Write to .env file
        fs.writeFileSync(path.join(__dirname, '..', '.env'), envContent);
        
        console.log('New .env file created successfully!');
        console.log('JWT_SECRET has been generated.');
        console.log('\nIMPORTANT: Please make sure to:');
        console.log('1. Set your actual PostgreSQL password in the .env file');
        console.log('2. Keep your .env file secure and never commit it to version control');
        
    } catch (error) {
        console.error('Error creating .env file:', error);
        process.exit(1);
    }
};

setupEnv(); 