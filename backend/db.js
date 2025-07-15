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

// Create a connection pool with retry capabilities
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
  // Aggressive settings for Supabase's pooler
  max: 3, // Keep pool small
  min: 0, // Allow pool to empty
  idleTimeoutMillis: 5000, // Release connections after 5s idle
  connectionTimeoutMillis: 3000, // Fail fast on connection attempts
  allowExitOnIdle: true,
  statement_timeout: 5000, // 5s query timeout
  query_timeout: 5000,
  keepAlive: true,
  keepAliveInitialDelayMillis: 5000
});

// Wrap the pool's query method with retry logic
const originalQuery = pool.query.bind(pool);
pool.query = async function retryingQuery(text, params) {
  const maxRetries = 3;
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await originalQuery(text, params);
      return result;
    } catch (err) {
      lastError = err;
      console.error(`Query attempt ${attempt}/${maxRetries} failed:`, err.message);
      
      // Only retry on connection-related errors
      if (err.code === 'XX000' || err.code === '57P01') {
        if (attempt < maxRetries) {
          const delay = 1000 * attempt; // Exponential backoff
          console.log(`Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      }
      throw err; // Throw immediately for other errors
    }
  }
  throw lastError;
};

// Handle unexpected errors on idle clients so the app does not crash
pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL client error:', err);
});

// Health check with shorter intervals and connection recovery
let consecutiveFailures = 0;
const maxConsecutiveFailures = 3;

const healthCheck = async () => {
  try {
    await pool.query('SELECT 1');
    console.log('Health check passed');
    consecutiveFailures = 0; // Reset on success
  } catch (err) {
    console.error('Health check failed:', err.message);
    consecutiveFailures++;
    
    if (consecutiveFailures >= maxConsecutiveFailures) {
      console.log('Too many consecutive failures, attempting to end and recreate pool...');
      try {
        await pool.end();
        // The next query will create a new connection automatically
      } catch (endErr) {
        console.error('Error while ending pool:', endErr.message);
      }
      consecutiveFailures = 0; // Reset counter after recovery attempt
    }
  } finally {
    setTimeout(healthCheck, 5000); // Check every 5 seconds
  }
};

// Start health checks
healthCheck();

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
