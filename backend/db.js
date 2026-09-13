const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/patients_db'
});

async function query(text, params) {
  const res = await pool.query(text, params);
  return res;
}

async function close() {
  await pool.end();
}

module.exports = { query, close };
