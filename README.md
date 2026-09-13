# Patients Health Records

A starter project to let patients store health records by scanning reports (file upload) and by adding records manually.

This repository contains a minimal backend (Node + Express) and a minimal frontend (React + Vite) so you can run and iterate quickly.

Important notes
- This scaffold is for development and prototyping only. Do NOT use this as-is for production or to store real patient data.
- Before collecting or storing real medical data, design for encryption, access controls, audit logs, and consult privacy/regulatory experts (HIPAA/GDPR).

Quick start (development)

1) Clone

   git clone https://github.com/LaksahanWijerathne/patients-health-records.git
   cd patients-health-records

2) Backend (port 4000)

   cd backend
   npm install
   node index.js

   API endpoints:
   - GET  /health         -> healthcheck
   - GET  /records        -> list records (in-memory)
   - POST /records        -> add manual record (JSON)
   - POST /upload         -> upload a file (multipart/form-data)

3) Frontend (port 5173)

   cd frontend
   npm install
   npm run dev

4) Visit the frontend at http://localhost:5173 and try adding a manual record or uploading a file.

What I added
- backend/ minimal Express app with endpoints and a placeholder upload flow (multer)
- frontend/ minimal React + Vite app with forms to add a record and upload a file
- Root README with setup instructions

Next suggestions
- Replace in-memory storage with PostgreSQL or similar and add authentication
- Add server-side OCR integration (Google Vision, AWS Textract) for scanned reports
- Harden security, add audit logs, and plan compliance controls

If you'd like, I can:
- Wire the backend to PostgreSQL and add Docker + docker-compose
- Add JWT-based auth and user scaffold
- Add CI/CD workflow to run tests and build the frontend
