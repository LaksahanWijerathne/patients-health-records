# Project Plan — Patients Health Records

This document outlines the plan for the project, decisions about OCR, and the QR-code feature idea. It includes architecture sketches, data model notes, security & compliance considerations, and an implementation roadmap with milestones.

---

## Summary / Decisions

- OCR strategy (chosen): Server-side Tesseract + OCRmyPDF as the primary, free/open-source OCR pipeline. Reasons:
  - Fully open-source and free to run on your own infrastructure.
  - OCRmyPDF handles PDF-specific workflows (deskew, cleanup, searchable PDFs) and uses Tesseract for text extraction.
  - Good community support, fast to prototype, low operational complexity compared to heavier DL stacks.
- Optional enhancements later: EasyOCR or PaddleOCR workers for documents where Tesseract fails (better accuracy on some modern layouts and non-Latin scripts).
- QR codes for patients: generate a unique, unguessable identifier (UUID v4 + secret token) per patient and encode a URL or token in a QR. Design to preserve privacy and enable quick lookups without exposing PHI.

---

## High-level architecture

1. Frontend (React/Vite):
   - Record entry UI (manual forms)
   - File upload UI (scanned PDFs / images)
   - Optionally: client-side OCR (tesseract.js) for privacy-first workflows
   - QR code scanner UI to scan patient QR and navigate to their record (requires auth)

2. Backend (Node/Express prototype):
   - REST API: auth, patients, records, upload endpoints
   - Upload handling: multer (dev) -> store file -> create OCR job
   - Background worker(s): queue system (Bull, Bee-Queue, or simple job runner) to process OCR jobs
   - OCR stack: OCRmyPDF (for PDFs) and Tesseract CLI for images
   - Storage: object store (S3 / MinIO / local for dev)
   - Database: PostgreSQL (with RLS for fine-grained control)

3. Worker & OCR pipeline:
   - Upload file -> store original in object store
   - Push job to queue with metadata (patientId, file path, mime)
   - Worker pulls job, performs image cleanup (if needed), runs OCRmyPDF or Tesseract
   - Worker persists OCR text, searchable PDF (if produced), and metadata (language, confidence) to DB and object store

4. QR code flow:
   - Generate patient QR token: {patient_uuid, short_token_hmac}
   - QR encodes a link like: https://app.example.com/p/{patient_uuid}?t=<short-token>
   - When scanned, the frontend asks the user to authenticate (or verify a short PIN), then frontend calls backend to validate token and load records
   - For use-cases requiring public access (e.g. emergency scanning at clinic), generate time-limited QR tokens or emergency-access tokens and log all accesses

---

## Data model (sketch)

- patients
  - id (pk)
  - uuid (unique, public id, UUIDv4)
  - name (nullable for privacy)
  - qr_token_salt / qr_secret_hash (to validate QR tokens without exposing token)
  - created_at, updated_at

- users (accounts / caregivers)
  - id, email, password_hash, role, created_at

- records
  - id
  - patient_id (fk)
  - type (note, lab_report, imaging, prescription, etc.)
  - data (jsonb) — structured fields for manual entries
  - created_by (user id or system)
  - created_at

- files
  - id
  - record_id
  - patient_id
  - filename
  - storage_path (S3 key)
  - mimetype
  - size
  - ocr_text (text, or link to text object)
  - searchable_pdf_path (optional)
  - created_at

- audit_logs
  - id, user_id (nullable), patient_id, action, resource_type, resource_id, ip, created_at

---

## Security & Privacy (must-haves)

- TLS for all traffic.
- Authentication: email/password + optional MFA; OAuth as optional convenience.
- Authorization: role-based access + per-patient access grants; implement PostgreSQL Row-Level Security (RLS) for DB-level enforcement.
- Encrypt sensitive data at rest (database encryption; S3 server-side encryption; consider envelope encryption for PHI).
- Audit logging for every access to patient records and files.
- Minimize PHI in URLs and QR codes — use unguessable IDs and short tokens.
- For QR workflows: prefer requiring authentication or use time-limited tokens and strong logging.
- Don’t enable public read of files/records by default.

Legal note: This scaffold is not compliant out-of-the-box. Consult privacy/HIPAA/GDPR counsel before collecting real medical data.

---

## Implementation roadmap & milestones (suggested)

Milestone 1 — MVP (1–2 weeks)
- Persist backend to PostgreSQL (replace in-memory store)
- Implement patient model and record model
- File upload -> store to local disk (dev) / MinIO (dev) or S3 (optional)
- Basic OCR integration: run Tesseract CLI or OCRmyPDF from worker; store extracted text
- Frontend: forms to add patient, add record, upload files; display OCR text
- Tests: basic API tests

Milestone 2 — Security & QR (1–2 weeks)
- Add authentication (JWT) and user scaffold; roles
- Add QR generation for patients (store QR metadata); QR display in frontend
- Add QR scanning UI and validation API endpoint
- Add audit logging for QR scans and accesses

Milestone 3 — Robustness & Deploy (1–2 weeks)
- Move file storage to S3 (or MinIO for self-hosted)
- Dockerize backend, worker, and frontend; docker-compose for local dev
- Add CI (build & test) + CD pipeline for deployments
- Add background queue (Redis + Bull) for OCR jobs

Milestone 4 — Accuracy & UX improvements (ongoing)
- Integrate EasyOCR / PaddleOCR worker for fallback cases
- Add manual verification and correction UI for OCR text
- Add OCR language detection
- Add exports (PDF/JSON) and sharing controls

---

## Tasks (initial set to create issues)

1. Wire PostgreSQL and migrate models (patients, users, records, files, audit_logs).
2. Implement file storage interface (local dev + S3 adapter).
3. Add background queue (Redis + Bull) and worker process.
4. Integrate OCRmyPDF for PDFs and Tesseract for images; store results and searchable PDF.
5. Create endpoints for QR token validation and QR generation.
6. Add basic auth (JWT) and an admin UI to manage patients and QR codes.
7. Add audit logging and an access log viewer (admin-only).

---

## Operational considerations

- Run OCR jobs asynchronously to avoid blocking uploads.
- Monitor OCR job failures; store confidence and problems to allow manual review.
- Throttle file sizes and types; scan for viruses before processing.
- Cost/control: OCRmyPDF + Tesseract run on CPU; consider GPU usage only if using deep-learning engines (EasyOCR/PaddleOCR) at scale.

---

## Next steps I can implement now

- Add this plan file (done)
- Create issues for the task list and the MVP milestones
- Wire a basic OCR worker using Tesseract + OCRmyPDF in the backend and add a Dockerfile
- Add QR code generation to the backend and a UI to show the QR for a patient

If you want I can create the initial issues and start implementing any of the Milestone 1 tasks on the repository. Tell me which task I should begin with (e.g., add PostgreSQL + migrations, or add OCR worker), and whether to commit changes to `main` or create a new feature branch (for example: `feature/ocr-worker` or on `Laksahan`).
