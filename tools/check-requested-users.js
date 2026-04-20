const path = require('path');
require('dotenv').config({ path: path.join(process.cwd(), '.env') });
const { Pool } = require('pg');

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : false,
  });

  const emails = [
    'saharsh.bodakunta@mechroute.com',
    'akhil.kumar@gmail.com',
  ];

  const tableCheck = await pool.query(
    `SELECT table_name
     FROM information_schema.tables
     WHERE table_schema = 'public'
       AND table_name IN ('users', 'drivers', 'service_partners')
     ORDER BY table_name`
  );

  const users = await pool.query(
    `SELECT email, role, created_at, password_hash
     FROM users
     WHERE email = ANY($1::text[])
     ORDER BY created_at DESC`,
    [emails]
  );

  const normalized = users.rows.map((r) => ({
    email: r.email,
    role: r.role,
    created_at: r.created_at,
    password_hash_prefix: String(r.password_hash || '').slice(0, 12),
    password_hash_len: String(r.password_hash || '').length,
    password_is_plaintext: ['Pass@1234', 'password', '123456'].includes(String(r.password_hash || '')),
    password_looks_bcrypt: String(r.password_hash || '').startsWith('$2a$') || String(r.password_hash || '').startsWith('$2b$') || String(r.password_hash || '').startsWith('$2y$'),
  }));

  console.log(JSON.stringify({
    connected: true,
    databaseUrlHostInfo: process.env.DATABASE_URL ? process.env.DATABASE_URL.split('@')[1] || 'set' : 'missing',
    tablesFound: tableCheck.rows.map((r) => r.table_name),
    requestedEmails: emails,
    recordsFound: normalized.length,
    users: normalized,
  }, null, 2));

  await pool.end();
}

main().catch((error) => {
  console.error('CHECK_FAILED', error.message);
  process.exit(1);
});
