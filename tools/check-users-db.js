const path = require('path');
require('dotenv').config({ path: path.join(process.cwd(), '.env') });
const { Pool } = require('pg');

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : false,
  });

  const sql = `
    SELECT
      id,
      role,
      email,
      first_name,
      last_name,
      display_name,
      partner_type,
      credential_id,
      LEFT(password_hash, 12) AS password_hash_prefix,
      LENGTH(password_hash) AS password_hash_len,
      created_at
    FROM users
    WHERE role IN ('driver', 'partner')
    ORDER BY created_at DESC
    LIMIT 20
  `;

  const result = await pool.query(sql);
  console.log(JSON.stringify(result.rows, null, 2));
  await pool.end();
}

main().catch((err) => {
  console.error('DB_QUERY_FAILED', err.message);
  process.exit(1);
});
