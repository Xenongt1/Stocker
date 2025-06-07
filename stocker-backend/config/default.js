module.exports = {
  port: process.env.PORT || 5000,
  jwtSecret: process.env.JWT_SECRET || 'your_temporary_secret_key_change_in_production',
  database: {
    url: process.env.DATABASE_URL || 'postgres://localhost:5432/stocker',
  },
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000'
}; 