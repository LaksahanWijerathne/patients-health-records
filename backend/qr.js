const crypto = require('crypto');
const bcrypt = require('bcrypt');
const QRCode = require('qrcode');
const db = require('./db');

const SALT_ROUNDS = 12;
const APP_URL = process.env.APP_URL || 'http://localhost:5173';

async function generatePatientQr(patientUuid, ttlMinutes = 60, purpose = 'default') {
  const token = crypto.randomBytes(12).toString('hex');
  const hash = await bcrypt.hash(token, SALT_ROUNDS);
  const expiresAt = new Date(Date.now() + ttlMinutes * 60_000).toISOString();
  const now = new Date().toISOString();

  // store hash + expiry + purpose
  await db.query(
    `UPDATE patients SET qr_token_hash = $1, qr_token_expires_at = $2, qr_token_purpose = $3, qr_last_generated_at = $4, updated_at = now() WHERE uuid = $5`,
    [hash, expiresAt, purpose, now, patientUuid]
  );

  const qrUrl = `${APP_URL}/p/${patientUuid}?t=${token}`;
  const qrDataUrl = await QRCode.toDataURL(qrUrl);
  return { token, qrUrl, qrDataUrl, expiresAt };
}

async function validateQr(patientUuid, token, meta = {}) {
  const r = await db.query('SELECT id, qr_token_hash, qr_token_expires_at FROM patients WHERE uuid = $1', [patientUuid]);
  const patient = r.rows[0];
  if (!patient || !patient.qr_token_hash) return { ok: false };
  if (patient.qr_token_expires_at && new Date() > new Date(patient.qr_token_expires_at)) return { ok: false };
  const ok = await bcrypt.compare(token, patient.qr_token_hash);

  // log attempt
  await db.query(
    `INSERT INTO audit_logs (user_id, patient_id, action, resource_type, resource_id, ip, user_agent, success) VALUES (NULL, $1, $2, $3, $4, $5, $6, $7)`,
    [patient.id, 'qr_validate', 'patient', patient.id::text, meta.ip || null, meta.ua || null, ok]
  );

  return { ok, patientId: patient.id };
}

module.exports = { generatePatientQr, validateQr };
