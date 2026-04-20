require('dotenv').config();

const path = require('path');
const crypto = require('crypto');
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'mechroute_dev_secret_change_me';
const ROOT_DIR = __dirname;
const allowedCorsOrigins = String(process.env.CORS_ORIGIN || process.env.CLIENT_ORIGIN || '')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);

const corsOptions = allowedCorsOrigins.length > 0
  ? {
      origin(origin, callback) {
        if (!origin || allowedCorsOrigins.includes(origin)) {
          return callback(null, true);
        }
        return callback(new Error(`CORS blocked for origin ${origin}`));
      },
      credentials: false,
    }
  : { origin: true, credentials: false };

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : undefined,
});

app.use(cors(corsOptions));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(ROOT_DIR));

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function makeDisplayName(firstName, lastName) {
  return [firstName, lastName].filter(Boolean).join(' ').trim();
}

function generatePartnerEmail(fullName) {
  const parts = String(fullName || '')
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) {
    return '';
  }

  const firstName = parts[0].replace(/[^a-z0-9]/g, '');
  const lastName = (parts[parts.length - 1] || '').replace(/[^a-z0-9]/g, '');
  return `${firstName}${lastName ? `.${lastName}` : ''}.partner@mechroute.com`;
}

function toInt(value, fallback = 0) {
  const parsed = Number.parseInt(String(value).replace(/[^0-9-]/g, ''), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function requestPrefix(mode) {
  return mode === 'emergency' ? 'SOS' : 'BK';
}

function generateRequestCode(mode) {
  return `${requestPrefix(mode)}-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
}

function generateOtp() {
  return String(crypto.randomInt(1000, 10000));
}

function signUser(user) {
  return jwt.sign(
    {
      sub: user.id,
      role: user.role,
      email: user.email,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function publicUser(user) {
  return {
    id: user.id,
    role: user.role,
    email: user.email,
    firstName: user.first_name,
    lastName: user.last_name,
    displayName: user.display_name,
    partnerType: user.partner_type,
    credentialId: user.credential_id,
    phone: user.phone,
  };
}

function mapRequest(row) {
  return {
    id: row.id,
    requestCode: row.request_code,
    driverUserId: row.driver_user_id,
    partnerUserId: row.partner_user_id,
    partnerName: row.partner_name_snapshot,
    serviceMode: row.service_mode,
    service: row.service_name,
    serviceType: row.service_type,
    issueDescription: row.issue_description,
    price: `₹${row.price_amount}`,
    priceAmount: row.price_amount,
    status: row.status,
    scheduledFor: row.scheduled_for,
    pickupLocation: row.pickup_location,
    latitude: row.latitude,
    longitude: row.longitude,
    otp: row.otp_code,
    paymentMethod: row.payment_method,
    paymentStatus: row.payment_status,
    cancelledBy: row.cancelled_by,
    cancellationReason: row.cancellation_reason,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    acceptedAt: row.accepted_at,
    arrivedAt: row.arrived_at,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    paidAt: row.paid_at,
  };
}

async function query(text, params = []) {
  const result = await pool.query(text, params);
  return result;
}

async function ensureSchema() {
  await query(`CREATE EXTENSION IF NOT EXISTS pgcrypto;`);
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      role text NOT NULL CHECK (role IN ('driver', 'partner')),
      email text NOT NULL UNIQUE,
      password_hash text NOT NULL,
      first_name text NOT NULL,
      last_name text,
      display_name text NOT NULL,
      phone text,
      partner_type text,
      credential_id text,
      status text NOT NULL DEFAULT 'active',
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS service_requests (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      request_code text NOT NULL UNIQUE,
      driver_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      partner_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
      service_mode text NOT NULL CHECK (service_mode IN ('scheduled', 'emergency')),
      service_name text NOT NULL,
      service_type text,
      issue_description text,
      price_amount integer NOT NULL DEFAULT 0,
      status text NOT NULL CHECK (status IN ('pending', 'accepted', 'arrived', 'in_progress', 'awaiting_payment', 'paid', 'completed', 'cancelled')),
      scheduled_for timestamptz,
      pickup_location text,
      latitude numeric(10, 7),
      longitude numeric(10, 7),
      otp_code text,
      partner_name_snapshot text,
      payment_method text,
      payment_status text NOT NULL DEFAULT 'unpaid',
      cancelled_by text,
      cancellation_reason text,
      accepted_at timestamptz,
      arrived_at timestamptz,
      started_at timestamptz,
      completed_at timestamptz,
      paid_at timestamptz,
      driver_rating integer CHECK (driver_rating BETWEEN 1 AND 5),
      driver_feedback text,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );
  `);

  await query(`CREATE INDEX IF NOT EXISTS idx_service_requests_driver ON service_requests(driver_user_id);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_service_requests_partner ON service_requests(partner_user_id);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_service_requests_status ON service_requests(status);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_service_requests_created_at ON service_requests(created_at DESC);`);

  await query(`
    CREATE TABLE IF NOT EXISTS request_events (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      request_id uuid NOT NULL REFERENCES service_requests(id) ON DELETE CASCADE,
      event_type text NOT NULL,
      payload jsonb NOT NULL DEFAULT '{}'::jsonb,
      created_at timestamptz NOT NULL DEFAULT now()
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS payments (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      request_id uuid NOT NULL REFERENCES service_requests(id) ON DELETE CASCADE,
      driver_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      partner_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
      amount integer NOT NULL,
      payment_method text NOT NULL,
      status text NOT NULL DEFAULT 'completed',
      transaction_ref text,
      created_at timestamptz NOT NULL DEFAULT now(),
      paid_at timestamptz NOT NULL DEFAULT now()
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS partner_earnings (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      partner_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      request_id uuid NOT NULL REFERENCES service_requests(id) ON DELETE CASCADE,
      amount integer NOT NULL,
      note text,
      created_at timestamptz NOT NULL DEFAULT now()
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS reviews (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      request_id uuid NOT NULL REFERENCES service_requests(id) ON DELETE CASCADE,
      driver_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      partner_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
      rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
      feedback text,
      created_at timestamptz NOT NULL DEFAULT now()
    );
  `);
}

function authRequired(role = null) {
  return async (req, res, next) => {
    try {
      const header = req.headers.authorization || '';
      const token = header.startsWith('Bearer ') ? header.slice(7) : null;
      if (!token) {
        return res.status(401).json({ error: 'Missing auth token' });
      }

      const payload = jwt.verify(token, JWT_SECRET);
      const { rows } = await query('SELECT * FROM users WHERE id = $1', [payload.sub]);
      const user = rows[0];
      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }
      if (role && user.role !== role) {
        return res.status(403).json({ error: 'Forbidden for this role' });
      }

      req.user = user;
      next();
    } catch (error) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
  };
}

app.get('/api/health', async (_req, res) => {
  try {
    await query('SELECT 1');
    res.json({ ok: true, database: 'connected' });
  } catch (error) {
    res.status(500).json({ ok: false, error: 'database_unavailable' });
  }
});

app.get('/debug/users', async (req, res) => {
  try {
    const remoteAddress = String(req.ip || req.socket?.remoteAddress || '');
    const isLocal = remoteAddress.includes('127.0.0.1') || remoteAddress.includes('::1');
    if (!isLocal) {
      return res.status(403).json({ error: 'Debug endpoint is only available from localhost' });
    }

    const { rows } = await query(
      `SELECT email, role, created_at
       FROM users
       ORDER BY created_at DESC
       LIMIT 10`
    );

    return res.json({ success: true, count: rows.length, users: rows });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch debug users' });
  }
});

app.post('/api/auth/register/driver', async (req, res) => {
  try {
    const firstName = String(req.body.firstName || '').trim();
    const lastName = String(req.body.lastName || '').trim();
    const password = String(req.body.password || '');
    const email = normalizeEmail(req.body.email || `${firstName}.${lastName}@mechroute.com`);

    console.log('[auth][register][driver] request_received', { email, firstName, lastName });

    if (!firstName || !lastName || !password) {
      return res.status(400).json({ error: 'firstName, lastName, and password are required' });
    }

    const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rowCount > 0) {
      return res.status(409).json({ error: 'This Fleet ID already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const displayName = makeDisplayName(firstName, lastName);
    const insertResult = await query(
      `INSERT INTO users (role, email, password_hash, first_name, last_name, display_name)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      ['driver', email, passwordHash, firstName, lastName, displayName]
    );

    const user = insertResult.rows[0];
    console.log('[auth][register][driver] db_insert_success', { userId: user.id, email: user.email, role: user.role, createdAt: user.created_at });
    const token = signUser(user);
    res.status(201).json({ success: true, message: 'Driver registered successfully', token, user: publicUser(user) });
  } catch (error) {
    console.error('[auth][register][driver] failed', error);
    res.status(500).json({ error: 'Failed to register driver' });
  }
});

app.post('/api/auth/login/driver', async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || '');
    const { rows } = await query('SELECT * FROM users WHERE email = $1 AND role = $2', [email, 'driver']);
    const user = rows[0];
    if (!user) {
      return res.status(401).json({ error: 'Access denied: incorrect Fleet ID or password' });
    }

    const matches = await bcrypt.compare(password, user.password_hash);
    if (!matches) {
      return res.status(401).json({ error: 'Access denied: incorrect Fleet ID or password' });
    }

    const token = signUser(user);
    res.json({ token, user: publicUser(user) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to log in driver' });
  }
});

app.post('/api/auth/register/partner', async (req, res) => {
  try {
    const fullName = String(req.body.fullName || req.body.name || '').trim();
    const password = String(req.body.password || '');
    const partnerType = String(req.body.partnerType || 'Expert').trim();
    const credentialId = String(req.body.credentialId || '').trim();
    const phone = String(req.body.phone || '').trim();
    const email = normalizeEmail(req.body.email || generatePartnerEmail(fullName));

    console.log('[auth][register][partner] request_received', { email, fullName, partnerType, credentialId });

    if (!fullName || !email || !password || !credentialId) {
      return res.status(400).json({ error: 'fullName, email, password, and credentialId are required' });
    }

    const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rowCount > 0) {
      return res.status(409).json({ error: 'This partner account already exists' });
    }

    const [firstName, ...rest] = fullName.split(' ');
    const lastName = rest.join(' ');
    const passwordHash = await bcrypt.hash(password, 12);

    const insertResult = await query(
      `INSERT INTO users (role, email, password_hash, first_name, last_name, display_name, phone, partner_type, credential_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      ['partner', email, passwordHash, firstName || fullName, lastName || null, fullName, phone || null, partnerType, credentialId]
    );

    const user = insertResult.rows[0];
    console.log('[auth][register][partner] db_insert_success', { userId: user.id, email: user.email, role: user.role, createdAt: user.created_at });
    const token = signUser(user);
    res.status(201).json({ success: true, message: 'Partner registered successfully', token, user: publicUser(user) });
  } catch (error) {
    console.error('[auth][register][partner] failed', error);
    res.status(500).json({ error: 'Failed to register partner' });
  }
});

app.post('/api/auth/login/partner', async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || '');
    const { rows } = await query('SELECT * FROM users WHERE email = $1 AND role = $2', [email, 'partner']);
    const user = rows[0];
    if (!user) {
      return res.status(401).json({ error: 'Account not found' });
    }

    const matches = await bcrypt.compare(password, user.password_hash);
    if (!matches) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    const token = signUser(user);
    res.json({ token, user: publicUser(user) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to log in partner' });
  }
});

app.get('/api/me', authRequired(), async (req, res) => {
  res.json({ user: publicUser(req.user) });
});

app.post('/api/requests', authRequired('driver'), async (req, res) => {
  try {
    const serviceMode = String(req.body.serviceMode || 'scheduled').toLowerCase();
    const serviceName = String(req.body.serviceName || req.body.service || '').trim();
    const serviceType = String(req.body.serviceType || '').trim() || null;
    const issueDescription = String(req.body.issueDescription || '').trim() || null;
    const priceAmount = toInt(req.body.priceAmount ?? req.body.price, 0);
    const scheduledFor = req.body.scheduledFor ? new Date(req.body.scheduledFor) : null;
    const pickupLocation = String(req.body.pickupLocation || '').trim() || null;
    const latitude = req.body.latitude === undefined || req.body.latitude === '' ? null : Number(req.body.latitude);
    const longitude = req.body.longitude === undefined || req.body.longitude === '' ? null : Number(req.body.longitude);

    if (!serviceName || !Number.isFinite(priceAmount)) {
      return res.status(400).json({ error: 'serviceName and priceAmount are required' });
    }

    const requestCode = generateRequestCode(serviceMode === 'emergency' ? 'emergency' : 'scheduled');
    const status = 'pending';

    const insertResult = await query(
      `INSERT INTO service_requests (
         request_code, driver_user_id, service_mode, service_name, service_type,
         issue_description, price_amount, status, scheduled_for, pickup_location,
         latitude, longitude, partner_name_snapshot
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING *`,
      [
        requestCode,
        req.user.id,
        serviceMode === 'emergency' ? 'emergency' : 'scheduled',
        serviceName,
        serviceType,
        issueDescription,
        priceAmount,
        status,
        scheduledFor && !Number.isNaN(scheduledFor.getTime()) ? scheduledFor.toISOString() : null,
        pickupLocation,
        Number.isFinite(latitude) ? latitude : null,
        Number.isFinite(longitude) ? longitude : null,
        'Searching...'
      ]
    );

    const request = insertResult.rows[0];
    await query(
      `INSERT INTO request_events (request_id, event_type, payload)
       VALUES ($1, $2, $3)`,
      [request.id, 'created', { source: 'driver', status: request.status }]
    );

    res.status(201).json({ request: mapRequest(request) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create request' });
  }
});

app.get('/api/driver/dashboard', authRequired('driver'), async (req, res) => {
  try {
    const activeResult = await query(
      `SELECT * FROM service_requests
       WHERE driver_user_id = $1 AND status NOT IN ('completed', 'paid', 'cancelled')
       ORDER BY created_at DESC
       LIMIT 1`,
      [req.user.id]
    );
    const statsResult = await query(
      `SELECT
         COUNT(*)::int AS total_services,
         COALESCE(SUM(price_amount), 0)::int AS total_spent
       FROM service_requests
       WHERE driver_user_id = $1 AND status IN ('completed', 'paid')`,
      [req.user.id]
    );

    res.json({
      user: publicUser(req.user),
      activeRequest: activeResult.rows[0] ? mapRequest(activeResult.rows[0]) : null,
      stats: {
        totalServices: statsResult.rows[0].total_services,
        totalSpent: statsResult.rows[0].total_spent,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load driver dashboard' });
  }
});

app.get('/api/driver/requests', authRequired('driver'), async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT * FROM service_requests WHERE driver_user_id = $1 ORDER BY created_at DESC`,
      [req.user.id]
    );
    res.json({ requests: rows.map(mapRequest) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load request history' });
  }
});

app.patch('/api/driver/requests/:id/cancel', authRequired('driver'), async (req, res) => {
  try {
    const requestId = req.params.id;
    const reason = String(req.body.reason || 'Driver cancelled').trim();
    const currentResult = await query(
      `SELECT status FROM service_requests WHERE id = $1 AND driver_user_id = $2`,
      [requestId, req.user.id]
    );

    const currentRequest = currentResult.rows[0];
    if (!currentRequest) {
      return res.status(404).json({ error: 'Request not found' });
    }

    if (['completed', 'paid', 'cancelled'].includes(currentRequest.status)) {
      return res.status(400).json({ error: 'This request can no longer be cancelled' });
    }

    const { rows } = await query(
      `UPDATE service_requests
       SET status = 'cancelled', cancelled_by = 'driver', cancellation_reason = $1, updated_at = now()
       WHERE id = $2 AND driver_user_id = $3
       RETURNING *`,
      [reason, requestId, req.user.id]
    );

    await query('INSERT INTO request_events (request_id, event_type, payload) VALUES ($1, $2, $3)', [requestId, 'cancelled', { cancelledBy: 'driver', reason }]);
    res.json({ request: mapRequest(rows[0]) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to cancel request' });
  }
});

app.post('/api/driver/requests/:id/pay', authRequired('driver'), async (req, res) => {
  try {
    const requestId = req.params.id;
    const paymentMethod = String(req.body.paymentMethod || 'UPI').trim();
    const { rows } = await query(
      `SELECT * FROM service_requests WHERE id = $1 AND driver_user_id = $2`,
      [requestId, req.user.id]
    );
    const request = rows[0];
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    if (!['awaiting_payment', 'completed'].includes(request.status)) {
      return res.status(400).json({ error: 'Payment is only available after service completion' });
    }

    const transactionRef = `TX-${Date.now()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
    await query(
      `UPDATE service_requests
       SET status = 'paid', payment_status = 'paid', payment_method = $1, paid_at = now(), updated_at = now()
       WHERE id = $2`,
      [paymentMethod, requestId]
    );
    await query(
      `INSERT INTO payments (request_id, driver_user_id, partner_user_id, amount, payment_method, status, transaction_ref)
       VALUES ($1, $2, $3, $4, $5, 'completed', $6)`,
      [requestId, req.user.id, request.partner_user_id, request.price_amount, paymentMethod, transactionRef]
    );
    await query('INSERT INTO request_events (request_id, event_type, payload) VALUES ($1, $2, $3)', [requestId, 'paid', { amount: request.price_amount, paymentMethod, transactionRef }]);

    res.json({ ok: true, transactionRef });
  } catch (error) {
    res.status(500).json({ error: 'Failed to process payment' });
  }
});

app.get('/api/partner/dashboard', authRequired('partner'), async (req, res) => {
  try {
    const activeResult = await query(
      `SELECT * FROM service_requests
       WHERE partner_user_id = $1 AND status NOT IN ('completed', 'paid', 'cancelled')
       ORDER BY created_at DESC
       LIMIT 1`,
      [req.user.id]
    );
    const statsResult = await query(
      `SELECT
         COUNT(*)::int AS completed_jobs,
         COALESCE(SUM(amount), 0)::int AS total_earnings
       FROM partner_earnings
       WHERE partner_user_id = $1`,
      [req.user.id]
    );

    res.json({
      user: publicUser(req.user),
      activeJob: activeResult.rows[0] ? mapRequest(activeResult.rows[0]) : null,
      stats: {
        completedJobs: statsResult.rows[0].completed_jobs,
        totalEarnings: statsResult.rows[0].total_earnings,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load partner dashboard' });
  }
});

app.get('/api/partner/jobs', authRequired('partner'), async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT * FROM service_requests
       WHERE status = 'pending'
       ORDER BY created_at DESC`,
      []
    );
    res.json({ jobs: rows.map(mapRequest) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load jobs' });
  }
});

app.post('/api/partner/jobs/:id/accept', authRequired('partner'), async (req, res) => {
  try {
    const requestId = req.params.id;
    const { rows } = await query(
      `UPDATE service_requests
       SET status = 'accepted', partner_user_id = $1, partner_name_snapshot = $2, accepted_at = now(), updated_at = now()
       WHERE id = $3 AND status = 'pending'
       RETURNING *`,
      [req.user.id, req.user.display_name, requestId]
    );
    if (!rows[0]) {
      return res.status(404).json({ error: 'Request not found or already taken' });
    }

    await query('INSERT INTO request_events (request_id, event_type, payload) VALUES ($1, $2, $3)', [requestId, 'accepted', { partner: req.user.display_name }]);
    res.json({ request: mapRequest(rows[0]) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to accept job' });
  }
});

app.post('/api/partner/jobs/:id/arrive', authRequired('partner'), async (req, res) => {
  try {
    const requestId = req.params.id;
    const otp = generateOtp();
    const currentResult = await query(
      `SELECT status FROM service_requests WHERE id = $1 AND partner_user_id = $2`,
      [requestId, req.user.id]
    );
    const currentRequest = currentResult.rows[0];
    if (!currentRequest) {
      return res.status(404).json({ error: 'Request not found' });
    }
    if (currentRequest.status !== 'accepted') {
      return res.status(400).json({ error: 'Arrival can only be marked after acceptance' });
    }

    const { rows } = await query(
      `UPDATE service_requests
       SET status = 'arrived', otp_code = $1, arrived_at = now(), updated_at = now()
       WHERE id = $2 AND partner_user_id = $3
       RETURNING *`,
      [otp, requestId, req.user.id]
    );
    if (!rows[0]) {
      return res.status(404).json({ error: 'Request not found' });
    }

    await query('INSERT INTO request_events (request_id, event_type, payload) VALUES ($1, $2, $3)', [requestId, 'arrived', { otp }]);
    res.json({ request: mapRequest(rows[0]), otp });
  } catch (error) {
    res.status(500).json({ error: 'Failed to mark arrival' });
  }
});

app.post('/api/partner/jobs/:id/verify-otp', authRequired('partner'), async (req, res) => {
  try {
    const requestId = req.params.id;
    const otp = String(req.body.otp || '').trim();
    const { rows } = await query(
      `SELECT * FROM service_requests WHERE id = $1 AND partner_user_id = $2`,
      [requestId, req.user.id]
    );
    const request = rows[0];
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }
    if (request.status !== 'arrived') {
      return res.status(400).json({ error: 'OTP can only be verified after arrival' });
    }
    if (request.otp_code !== otp) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    const updated = await query(
      `UPDATE service_requests
       SET status = 'in_progress', started_at = now(), updated_at = now()
       WHERE id = $1
       RETURNING *`,
      [requestId]
    );
    await query('INSERT INTO request_events (request_id, event_type, payload) VALUES ($1, $2, $3)', [requestId, 'otp_verified', { verified: true }]);
    res.json({ request: mapRequest(updated.rows[0]) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to verify otp' });
  }
});

app.post('/api/partner/jobs/:id/complete', authRequired('partner'), async (req, res) => {
  try {
    const requestId = req.params.id;
    const currentResult = await query(
      `SELECT status FROM service_requests WHERE id = $1 AND partner_user_id = $2`,
      [requestId, req.user.id]
    );
    const currentRequest = currentResult.rows[0];
    if (!currentRequest) {
      return res.status(404).json({ error: 'Request not found' });
    }
    if (currentRequest.status !== 'in_progress') {
      return res.status(400).json({ error: 'Service can only be completed after work has started' });
    }

    const { rows } = await query(
      `UPDATE service_requests
       SET status = 'awaiting_payment', completed_at = now(), updated_at = now()
       WHERE id = $1 AND partner_user_id = $2
       RETURNING *`,
      [requestId, req.user.id]
    );
    const request = rows[0];
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    await query(
      `INSERT INTO partner_earnings (partner_user_id, request_id, amount, note)
       VALUES ($1, $2, $3, $4)`,
      [req.user.id, requestId, request.price_amount, 'Service completed and billed']
    );
    await query('INSERT INTO request_events (request_id, event_type, payload) VALUES ($1, $2, $3)', [requestId, 'completed', { amount: request.price_amount }]);
    res.json({ request: mapRequest(request) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to complete service' });
  }
});

app.get('/api/partner/earnings', authRequired('partner'), async (req, res) => {
  try {
    const summary = await query(
      `SELECT COALESCE(SUM(amount), 0)::int AS total_earnings
       FROM partner_earnings
       WHERE partner_user_id = $1`,
      [req.user.id]
    );
    const jobs = await query(
      `SELECT pe.amount, pe.note, pe.created_at, sr.request_code, sr.service_name
       FROM partner_earnings pe
       JOIN service_requests sr ON sr.id = pe.request_id
       WHERE pe.partner_user_id = $1
       ORDER BY pe.created_at DESC`,
      [req.user.id]
    );
    res.json({
      totalEarnings: summary.rows[0].total_earnings,
      entries: jobs.rows,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load earnings' });
  }
});

app.get('/api/driver/requests/:id', authRequired('driver'), async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT * FROM service_requests WHERE id = $1 AND driver_user_id = $2`,
      [req.params.id, req.user.id]
    );
    if (!rows[0]) {
      return res.status(404).json({ error: 'Request not found' });
    }
    res.json({ request: mapRequest(rows[0]) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load request' });
  }
});

app.get('/api/partner/jobs/:id', authRequired('partner'), async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT * FROM service_requests WHERE id = $1 AND (partner_user_id = $2 OR status = 'pending')`,
      [req.params.id, req.user.id]
    );
    if (!rows[0]) {
      return res.status(404).json({ error: 'Request not found' });
    }
    res.json({ request: mapRequest(rows[0]) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load job' });
  }
});

app.get('/api/debug/stats', async (_req, res) => {
  const [users, requests, payments] = await Promise.all([
    query('SELECT COUNT(*)::int AS count FROM users'),
    query('SELECT COUNT(*)::int AS count FROM service_requests'),
    query('SELECT COUNT(*)::int AS count FROM payments'),
  ]);
  res.json({
    users: users.rows[0].count,
    requests: requests.rows[0].count,
    payments: payments.rows[0].count,
  });
});

app.get('*', (_req, res) => {
  res.sendFile(path.join(ROOT_DIR, 'index.html'));
});

async function start() {
  await ensureSchema();
  app.listen(PORT, () => {
    console.log(`MechRoute API running on http://localhost:${PORT}`);
  });
}

start().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
