const path = require('path');
require('dotenv').config({ path: path.join(process.cwd(), '.env') });
const { Pool } = require('pg');

(async () => {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : false,
  });

  const { rows } = await pool.query(
    `SELECT id, first_name, last_name, display_name, email, created_at
     FROM users
     WHERE role = 'partner'
     ORDER BY created_at ASC`
  );

  console.log(JSON.stringify(rows, null, 2));
  await pool.end();
})().catch((error) => {
  console.error('LIST_FAILED', error.message);
  process.exit(1);
});
