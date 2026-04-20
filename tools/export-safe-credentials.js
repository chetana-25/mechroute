const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(process.cwd(), '.env') });
const { Pool } = require('pg');

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : false,
  });

  const { rows } = await pool.query(
    `SELECT email, role, created_at, password_hash
     FROM users
     ORDER BY created_at DESC
     LIMIT 20`
  );

  const safeRows = rows.map((row) => ({
    email: row.email,
    role: row.role,
    created_at: row.created_at,
    password_hash_prefix: String(row.password_hash || '').slice(0, 12),
    password_hash_len: String(row.password_hash || '').length,
    password_looks_bcrypt: String(row.password_hash || '').startsWith('$2a$') || String(row.password_hash || '').startsWith('$2b$') || String(row.password_hash || '').startsWith('$2y$'),
  }));

  const output = {
    note: 'Passwords are intentionally not exported in plaintext.',
    generated_at: new Date().toISOString(),
    source: 'PostgreSQL users table',
    users: safeRows,
  };

  const outputPath = path.join(process.cwd(), 'tools', 'credentials-audit.json');
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
  console.log(`WROTE ${outputPath}`);
  await pool.end();
}

main().catch((error) => {
  console.error('EXPORT_FAILED', error.message);
  process.exit(1);
});
