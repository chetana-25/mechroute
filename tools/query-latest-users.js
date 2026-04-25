const path = require('path');
require('dotenv').config({ path: path.join(process.cwd(), '.env') });
const { Pool } = require('pg');

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : false,
  });

  const tableCheck = await pool.query(
    `SELECT table_name
     FROM information_schema.tables
     WHERE table_schema = 'public'
       AND table_name IN ('users', 'drivers', 'service_partners')
     ORDER BY table_name`
  );

  const selectedTable = tableCheck.rows.find((r) => r.table_name === 'users')?.table_name || null;

  console.log('TABLES_FOUND:', tableCheck.rows.map((r) => r.table_name).join(', ') || 'none');
  console.log('SELECTED_TABLE:', selectedTable || 'none');

  if (!selectedTable) {
    await pool.end();
    process.exit(1);
  }

  const latestUsers = await pool.query(
    `SELECT *
     FROM ${selectedTable}
     ORDER BY created_at DESC
     LIMIT 5`
  );

  const specificUser = await pool.query(
    `SELECT *
     FROM ${selectedTable}
     WHERE email = $1`,
    ['rishitha.jinukuntla@mechroute.com']
  );

  console.log('\nLATEST_5_USERS:');
  console.log(JSON.stringify(latestUsers.rows, null, 2));

  console.log('\nUSER_LOOKUP_rishitha.jinukuntla@mechroute.com:');
  console.log(JSON.stringify(specificUser.rows, null, 2));

  await pool.end();
}

main().catch((err) => {
  console.error('QUERY_FAILED:', err.message);
  process.exit(1);
});
