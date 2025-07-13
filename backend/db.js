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
  port: parseInt(process.env.SUPABASE_PORT || '6543', 10),
  user: process.env.SUPABASE_USER,
  password: process.env.SUPABASE_PASSWORD,
  database: process.env.SUPABASE_DATABASE || 'postgres',
  ssl: {
    rejectUnauthorized: false,
    sslmode: 'require'
  },
  max: 10, // Set max pool size
  idleTimeoutMillis: 30000 // Close idle clients after 30 seconds
});

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
  const client = await pool.connect();
  try {
    // Try to create a test table
    await client.query(`
      CREATE TABLE IF NOT EXISTS test_connection (
        id SERIAL PRIMARY KEY,
        test_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Insert a test record
    await client.query('INSERT INTO test_connection DEFAULT VALUES');

    // Query the record
    const result = await client.query('SELECT * FROM test_connection ORDER BY id DESC LIMIT 1');
    console.log('Test query result:', result.rows[0]);

    // Clean up - drop the test table
    await client.query('DROP TABLE test_connection');
    
    console.log('Database operations test successful!');
    return true;
  } catch (error) {
    console.error('Error in test query:', error);
    return false;
  } finally {
    client.release();
  }
}

// Export pool and test function
module.exports = { pool, testQuery };
