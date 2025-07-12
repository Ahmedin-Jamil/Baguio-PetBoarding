/**
 * Database configuration and connection pool setup
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'pet_hotel',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Log connection attempt
console.log('Attempting to connect to database with following configuration:');
console.log(`- Host: ${dbConfig.host}`);
console.log(`- User: ${dbConfig.user}`);
console.log(`- Database: ${dbConfig.database}`);

// Create the connection pool
const pool = mysql.createPool(dbConfig);

// Test database connection
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('Database connection established successfully');
    console.log(`Connected to database: ${dbConfig.host}`);
    connection.release();
    return true;
  } catch (error) {
    console.error('Error connecting to database:', error.message);
    return false;
  }
};

// Format date helper function
const formatDateString = (dateString) => {
  if (!dateString) return null;
  
  const date = new Date(dateString);
  return date.toISOString().split('T')[0];
};

module.exports = {
  pool,
  testConnection,
  formatDateString
};
