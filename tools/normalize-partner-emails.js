const path = require('path');
require('dotenv').config({ path: path.join(process.cwd(), '.env') });
const { Pool } = require('pg');

function normalizeNameSegment(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '.');
}

function generatePartnerEmail(row) {
  const firstName = normalizeNameSegment(row.first_name);
  const lastName = normalizeNameSegment(row.last_name);
  const base = [firstName, lastName].filter(Boolean).join('.');
  return `${base || 'partner'}.partner@mechroute.com`;
}

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : false,
  });

  const { rows } = await pool.query(
    `SELECT id, first_name, last_name, display_name, email
     FROM users
     WHERE role = 'partner'
     ORDER BY created_at ASC`
  );

  const desiredEmails = new Map();
  const updates = [];

  for (const row of rows) {
    let desiredEmail = generatePartnerEmail(row);
    let suffix = 1;
    while ([...desiredEmails.values()].includes(desiredEmail)) {
      suffix += 1;
      const base = desiredEmail.replace(/\.partner@mechroute\.com$/, '');
      desiredEmail = `${base}.${suffix}.partner@mechroute.com`;
    }
    desiredEmails.set(row.id, desiredEmail);

    if (row.email !== desiredEmail) {
      updates.push({ id: row.id, oldEmail: row.email, newEmail: desiredEmail, displayName: row.display_name });
    }
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const update of updates) {
      await client.query(
        `UPDATE users
         SET email = $1,
             updated_at = now()
         WHERE id = $2`,
        [update.newEmail, update.id]
      );
    }
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }

  console.log(JSON.stringify({
    totalPartners: rows.length,
    updatedCount: updates.length,
    updates,
  }, null, 2));

  await pool.end();
}

main().catch((error) => {
  console.error('NORMALIZE_FAILED', error.message);
  process.exit(1);
});
