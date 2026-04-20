const path = require('path');
require('dotenv').config({ path: path.join(process.cwd(), '.env') });

const { Pool } = require('pg');

const baseUrl = process.env.APP_BASE_URL || `http://localhost:${process.env.PORT || 3000}`;

async function httpJson(url, options = {}) {
  const response = await fetch(url, {
    method: options.method || 'GET',
    headers: { 'content-type': 'application/json', ...(options.headers || {}) },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const text = await response.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }

  return { ok: response.ok, status: response.status, data };
}

async function main() {
  const seed = Date.now();
  const driverEmail = `e2e.driver.${seed}@mechroute.com`;
  const partnerEmail = `e2e.partner.${seed}@mechroute.com`;
  const password = 'Pass@1234';

  const driverPayload = {
    firstName: 'E2E',
    lastName: `Driver${seed}`,
    email: driverEmail,
    password,
  };

  const partnerPayload = {
    fullName: `E2E Partner ${seed}`,
    email: partnerEmail,
    password,
    partnerType: 'Expert',
    credentialId: `E2E-CR-${seed}`,
    phone: '9999999999',
  };

  const driverRes = await httpJson(`${baseUrl}/api/auth/register/driver`, {
    method: 'POST',
    body: driverPayload,
  });

  const partnerRes = await httpJson(`${baseUrl}/api/auth/register/partner`, {
    method: 'POST',
    body: partnerPayload,
  });

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : false,
  });

  const dbResult = await pool.query(
    `SELECT id, email, role, display_name, partner_type, credential_id, created_at,
            password_hash,
            LENGTH(password_hash) AS password_hash_len
     FROM users
     WHERE email = ANY($1::text[])
     ORDER BY created_at DESC`,
    [[driverEmail, partnerEmail]]
  );
  await pool.end();

  const users = dbResult.rows.map((u) => ({
    id: u.id,
    email: u.email,
    role: u.role,
    display_name: u.display_name,
    partner_type: u.partner_type,
    credential_id: u.credential_id,
    created_at: u.created_at,
    password_hash_prefix: String(u.password_hash || '').slice(0, 12),
    password_hash_len: u.password_hash_len,
    password_is_plaintext: u.password_hash === password,
  }));

  const output = {
    endpointValidation: {
      driverEndpoint: '/api/auth/register/driver',
      partnerEndpoint: '/api/auth/register/partner',
      driverResponse: driverRes,
      partnerResponse: partnerRes,
    },
    dbValidation: {
      searchedEmails: [driverEmail, partnerEmail],
      foundCount: users.length,
      users,
    },
  };

  console.log(JSON.stringify(output, null, 2));

  const ok =
    driverRes.ok &&
    partnerRes.ok &&
    driverRes.data?.success === true &&
    partnerRes.data?.success === true &&
    users.length === 2 &&
    users.every((u) => u.password_hash_len >= 60 && u.password_is_plaintext === false && String(u.password_hash_prefix).startsWith('$2'));

  if (!ok) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('VALIDATION_FAILED', err.message);
  process.exit(1);
});
