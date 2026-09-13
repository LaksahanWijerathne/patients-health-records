# Project Plan — Patients Health Records (Laksahan branch)

This document extends the earlier PLAN.md with an improved QR strategy and the doctor-account access model you proposed. It adds concrete data-model changes, API endpoints, UX flows, and security/privacy controls for a production-ready design (still a plan — implement carefully).

---

## New: Doctor-access + QR policy (summary)

Goal: Let patients have a QR they can share for emergency or clinic use while ensuring only authenticated and authorized doctor accounts can read patient records via QR scans. Protect against mass scanning and misuse.

High-level policy:
- Patients have a persistent QR with an encoded patient UUID and a rotating/renewable secret token stored only hashed in the DB.
- Only authenticated doctor accounts can validate the token and read record data. The QR alone is not sufficient to fetch PHI without doctor authentication.
- Support an explicit "Emergency Access" mode: a patient can generate a time-limited emergency token (short TTL) that allows access without doctor account but requires a PIN and is strictly audited.
- Enforce rate limits, quotas, and anomaly detection on QR validation attempts to prevent large-scale scanning.
- Notify patients (email/SMS/app) when their QR is scanned or when emergency tokens are created or used.

---

## Data model additions

Add/adjust columns:
- patients
  - qr_public_enabled BOOLEAN DEFAULT true — whether a QR exists/is usable
  - qr_rate_limit_count INT DEFAULT 0 — rolling counter for quick throttling
  - qr_last_rate_reset TIMESTAMPTZ

- doctor_accounts (could reuse users with role='doctor')
  - verification_status ENUM('unverified','verified')
  - institution_id (optional)

- qr_audit (new table focused on QR activity)
  - id, patient_id, doctor_id (nullable), ip, user_agent, action ENUM('generate','scan','validate','emergency_use'), outcome BOOLEAN, note JSONB, created_at

- emergency_tokens (new)
  - id, patient_id, token_hash, expires_at, created_by (patient_user_id), created_at, uses INT, max_uses INT, revoked BOOLEAN

---

## API & flow changes

1) Normal QR (for doctor use)
- QR payload still encodes: https://app.example.com/p/{patient_uuid}?t={token}
- Scan flow (scanner app / web):
  - Scanner app extracts uuid and token and sends to backend /qr/validate with Bearer token (doctor JWT) and scan metadata.
  - Backend verifies doctor JWT and doctor verification_status == 'verified'.
  - Backend validates token against patient's stored hash and expiry.
  - On success, return patient summary + a short-lived access token for the doctor session to fetch full records for X minutes.
  - Log the scan in qr_audit and notify patient (configurable). Rate-limit validations per doctor and per IP.

2) Emergency QR (patient-generated)
- Patient via authenticated UI generates an emergency token (short TTL, optionally with a PIN). Backend stores hashed emergency token in emergency_tokens with max_uses and expiry.
- QR for emergency might be a separate printed code (emergency token embedded), or the scanner UI can request that patient shows the emergency token (scanned or typed).
- If emergency token used, backend presents limited read-only view and requires the emergency user to provide a reason and optionally a recorded PIN. Everything is logged and triggers an immediate notification to patient.

3) Revocation & rotation
- Patient or admin can rotate (re-generate) or revoke tokens. When rotated, the previous token(s) are invalidated (deleted or flagged revoked).
- Rotations are audit-logged.

---

## Rate limiting & abuse mitigation

- Per-doctor throttles: e.g., 100 validations per doctor per day by default.
- Per-IP throttles: e.g., 50 validations per IP per hour.
- Per-patient throttles: e.g., 200 scans for a single patient per day triggers alert.
- Global anomaly detection: spikes of scans across many patients from same IP/doctor -> temporarily block and alert security/admin.
- Use Redis for counters and sliding-window rate limiting.

---

## UX and notifications

- Patient UI: show current QR(s), last 10 scan events with metadata, ability to generate emergency token, revoke/rotate QR, and configure scan notifications (email/SMS/push).
- Doctor UI: after scan and validation, show a short confirmation screen including patient name (if allowed), last-updated timestamp, and a button to view records. Access token TTL is short (e.g., 5–15 minutes).
- Emergency workflow: show a warning about extraordinary access, require entering a short reason/PIN, and require acceptance of logging.

---

## Security, privacy & legal considerations

- Doctor accounts must be verified (institutional email and optional KYC/manual review).
- Enforce MFA for doctor accounts.
- Encrypt all PHI at rest; use envelope encryption for highest-sensitivity fields.
- Limit what data is returned via QR flows (consider returning a brief summary instead of full records unless explicitly requested and re-authorized).
- Implement detailed, tamper-evident audit logs for all QR actions. Provide exports for compliance.
- Regularly review and revoke compromised tokens and doctor accounts.
- Consider requiring signed clinician attestations for emergency accesses.

---

## Implementation tasks (to add to issues / milestone)

- Add DB migrations for new columns/tables: qr_audit, emergency_tokens, patient QR flags, doctor verification columns.
- Implement Redis-backed rate limiting middleware for /qr/validate.
- Implement doctor verification flow and admin UI to approve doctors.
- Implement endpoints:
  - POST /patients/:uuid/qr (generate/rotate) — doctor/admin or patient UI depending on use-case
  - POST /qr/validate (requires doctor JWT) — validate and return short-lived access token
  - POST /patients/:uuid/emergency (patient creates emergency token)
  - POST /qr/emergency-validate — validate emergency token without doctor JWT but with PIN/consent
  - GET /patients/:id/qr-audit — admin/patient view of recent scans
- Add notifications (email/SMS) on QR scan/emergency usage.
- Add frontend admin UI components and patient settings views.

---

## Metrics & monitoring

Track:
- QR validation success/failure rates
- Number of scans per doctor / per patient
- Rate-limited / blocked attempts
- Emergency token generation and uses
- Notifications delivered

Set up alerts when suspicious patterns detected (e.g., single doctor scanning > X patients in Y time).

---

If you want, I will now commit these changes by updating PLAN.md on the Laksahan branch (add the above sections). I can also create the DB migration files and start implementing the backend endpoints on Laksahan. Confirm and I will push the PLAN.md update and create a branch-scoped issue list and migrations on Laksahan.
