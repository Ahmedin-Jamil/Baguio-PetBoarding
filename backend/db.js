const { Pool } = require('pg');
require('dotenv').config();

// Log environment variables (without sensitive data)
console.log('Database configuration:', {
  host: process.env.SUPABASE_HOST,
  port: process.env.SUPABASE_PORT,
  user: process.env.SUPABASE_USER,
  database: process.env.SUPABASE_DATABASE,
  ssl: true
});

const pool = new Pool({
  host: process.env.SUPABASE_HOST,
  port: parseInt(process.env.SUPABASE_PORT || '5432', 10),
  user: process.env.SUPABASE_USER,
  password: process.env.SUPABASE_PASSWORD,
  database: process.env.SUPABASE_DATABASE || 'postgres',
  ssl: {
    rejectUnauthorized: false,
    sslmode: 'require'
  },
  // Pool configuration tuned for Supabase's connection pooler
  max: 5, // Reduced pool size to prevent overwhelming the pooler
  idleTimeoutMillis: 1000, // Release idle connections quickly
  connectionTimeoutMillis: 5000, // Give more time for initial connection
  allowExitOnIdle: true,
  statement_timeout: 10000, // 10s query timeout
  query_timeout: 10000,
  keepAlive: true, // Enable TCP keepalive
  keepAliveInitialDelayMillis: 10000 // Start keepalive after 10s
});

// Handle unexpected errors on idle clients so the app does not crash
pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL client error:', err);
});

// Implement a more robust connection check with exponential backoff
let pingInterval = 10000; // Start with 10s
const maxPingInterval = 30000; // Max 30s

const checkConnection = async () => {
  try {
    await pool.query('SELECT 1');
    // On success, gradually reduce the interval
    pingInterval = Math.max(10000, pingInterval - 5000);
    console.log('Connection check successful');
  } catch (err) {
    console.error('Connection check failed:', err.code || err.message);
    // On failure, increase interval exponentially
    pingInterval = Math.min(maxPingInterval, pingInterval * 1.5);
    
    try {
      // Try to get a fresh client
      const client = await pool.connect();
      await client.query('SELECT 1');
      client.release();
      console.log('Successfully established new connection');
    } catch (reconnectErr) {
      console.error('Failed to establish new connection:', reconnectErr.code || reconnectErr.message);
    }
  } finally {
    // Schedule next check with current interval
    setTimeout(checkConnection, pingInterval);
  }
};

// Start connection checking
checkConnection();

// Test the connection
pool.connect((err, client, release) => {
  if (err) {
    console.error('Error connecting to the database:', err.stack);
  } else {
    console.log('Successfully connected to Supabase PostgreSQL database');
    release();
  }
});

// Test query function
async function testQuery() {
  try {
    const { rows } = await pool.query('SELECT NOW()');
    console.log('Database time:', rows[0].now);
    return true;
  } catch (error) {
    console.error('Error in test query:', error);
    return false;
  }
}

// Helper to format a Date or string to YYYY-MM-DD
function formatDateString(date) {
  if (!date) return null;
  const d = typeof date === 'string' ? new Date(date) : date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Export pool and helpers
module.exports = { pool, testQuery, formatDateString };
