const { Pool } = require('pg');
require('dotenv').config();

// Log database configuration (without password)
console.log('Database configuration:', {
  host: process.env.SUPABASE_HOST,
  port: process.env.SUPABASE_PORT,
  user: process.env.SUPABASE_USER,
  database: process.env.SUPABASE_DATABASE || 'postgres',
  ssl: true
});

// Connection pool manager
class ConnectionManager {
  constructor() {
    this.activePool = null;
    this.standbyPool = null;
    this.isFailingOver = false;
    this.createPools();
  }

  createPools() {
    const poolConfig = {
      host: process.env.SUPABASE_HOST,
      port: parseInt(process.env.SUPABASE_PORT || '5432', 10),
      user: process.env.SUPABASE_USER,
      password: process.env.SUPABASE_PASSWORD,
      database: process.env.SUPABASE_DATABASE || 'postgres',
      ssl: {
        rejectUnauthorized: false,
        sslmode: 'require'
      },
      // Remove timeouts to prevent timeout errors
      max: 10,
      min: 1,
      idleTimeoutMillis: 0, // Disable idle timeout
      connectionTimeoutMillis: 0, // Disable connection timeout
      allowExitOnIdle: false,
      statement_timeout: 0, // Disable statement timeout
      query_timeout: 0 // Disable query timeout
    };

    this.activePool = new Pool(poolConfig);
    this.standbyPool = new Pool(poolConfig);

    // Set up error handlers
    this.activePool.on('error', err => this.handlePoolError(err, 'active'));
    this.standbyPool.on('error', err => this.handlePoolError(err, 'standby'));
  }

  async handlePoolError(err, poolType) {
    console.error(`${poolType} pool error:`, err.message);
    if (!this.isFailingOver && poolType === 'active') {
      await this.failover();
    }
  }

  async failover() {
    if (this.isFailingOver) return;
    this.isFailingOver = true;

    console.log('Initiating failover...');
    try {
      // Swap pools
      const temp = this.activePool;
      this.activePool = this.standbyPool;
      this.standbyPool = temp;

      // End old connections
      try {
        await this.standbyPool.end();
      } catch (err) {
        console.error('Error ending old pool:', err.message);
      }

      // Create new standby
      this.standbyPool = new Pool(this.activePool.options);
      this.standbyPool.on('error', err => this.handlePoolError(err, 'standby'));

      console.log('Failover complete');
    } catch (err) {
      console.error('Failover failed:', err.message);
    } finally {
      this.isFailingOver = false;
    }
  }

  async query(text, params) {
    const maxRetries = 3;
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await this.activePool.query(text, params);
        return result;
      } catch (err) {
        lastError = err;
        console.error(`Query attempt ${attempt}/${maxRetries} failed:`, err.message);

        if (err.code === 'XX000' || err.code === '57P01') {
          if (attempt < maxRetries) {
            const delay = 1000 * Math.pow(2, attempt - 1); // Exponential backoff
            console.log(`Retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));

            // Try failover on connection errors
            if (!this.isFailingOver) {
              await this.failover();
            }
            continue;
          }
        }
        throw err;
      }
    }
    throw lastError;
  }
}

const connectionManager = new ConnectionManager();

// Health check with connection validation
let consecutiveFailures = 0;
const maxConsecutiveFailures = 3;

const healthCheck = async () => {
  try {
    await connectionManager.query('SELECT 1');
    console.log('Health check passed');
    consecutiveFailures = 0;
  } catch (err) {
    console.error('Health check failed:', err.message);
    consecutiveFailures++;
    
    if (consecutiveFailures >= maxConsecutiveFailures) {
      console.log('Too many consecutive failures, forcing failover...');
      try {
        await connectionManager.failover();
      } catch (failoverErr) {
        console.error('Failover failed:', failoverErr.message);
      }
      consecutiveFailures = 0;
    }
  } finally {
    setTimeout(healthCheck, 5000);
  }
};

// Start health checks
healthCheck();

// Test the connection
connectionManager.query('SELECT 1')
  .then(() => console.log('Successfully connected to Supabase PostgreSQL database'))
  .catch(err => console.error('Error testing connection:', err.message));

// Test query function
async function testQuery() {
  try {
    const { rows } = await connectionManager.query('SELECT NOW()');
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

// Export connection manager and helpers
module.exports = { pool: connectionManager, testQuery, formatDateString };
