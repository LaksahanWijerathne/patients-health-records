-- 001_create_schema.sql

BEGIN;

CREATE TABLE IF NOT EXISTS patients (
  id SERIAL PRIMARY KEY,
  uuid UUID NOT NULL UNIQUE,
  name TEXT,
  qr_token_hash TEXT,
  qr_token_expires_at TIMESTAMPTZ,
  qr_token_purpose TEXT,
  qr_last_generated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS records (
  id SERIAL PRIMARY KEY,
  patient_id INT REFERENCES patients(id) ON DELETE CASCADE,
  type TEXT,
  data JSONB,
  created_by INT REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS files (
  id SERIAL PRIMARY KEY,
  record_id INT REFERENCES records(id) ON DELETE SET NULL,
  patient_id INT REFERENCES patients(id) ON DELETE CASCADE,
  filename TEXT,
  storage_path TEXT,
  mimetype TEXT,
  size BIGINT,
  ocr_text TEXT,
  searchable_pdf_path TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id),
  patient_id INT REFERENCES patients(id),
  action TEXT,
  resource_type TEXT,
  resource_id TEXT,
  ip TEXT,
  user_agent TEXT,
  success BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT now()
);

COMMIT;
