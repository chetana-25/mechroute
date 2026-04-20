CREATE EXTENSION IF NOT EXISTS pgcrypto;

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

CREATE INDEX IF NOT EXISTS idx_service_requests_driver ON service_requests(driver_user_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_partner ON service_requests(partner_user_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_status ON service_requests(status);
CREATE INDEX IF NOT EXISTS idx_service_requests_created_at ON service_requests(created_at DESC);

CREATE TABLE IF NOT EXISTS request_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id uuid NOT NULL REFERENCES service_requests(id) ON DELETE CASCADE,
    event_type text NOT NULL,
    payload jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now()
);

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

CREATE TABLE IF NOT EXISTS partner_earnings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    request_id uuid NOT NULL REFERENCES service_requests(id) ON DELETE CASCADE,
    amount integer NOT NULL,
    note text,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reviews (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id uuid NOT NULL REFERENCES service_requests(id) ON DELETE CASCADE,
    driver_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    partner_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
    rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
    feedback text,
    created_at timestamptz NOT NULL DEFAULT now()
);
