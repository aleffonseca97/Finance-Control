import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

export async function query(text, params) {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
}

export async function checkConnection() {
  const client = await pool.connect();
  try {
    await client.query('SELECT 1');
    return true;
  } catch (err) {
    return false;
  } finally {
    client.release();
  }
}

export { pool };
