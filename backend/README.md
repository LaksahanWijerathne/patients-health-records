# Backend

This directory contains an updated backend with DB migrations and QR API support.

Steps to run locally (development):

1) Install dependencies

   cd backend
   npm install

2) Start a local Postgres (example using Docker):

   docker run --name patients-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=patients_db -p 5432:5432 -d postgres:15

3) Run migrations

   npm run migrate

4) Start the server

   npm start

Endpoints added
- POST /patients/:uuid/qr    -> generate a QR code (body: { ttlMinutes, purpose })
- POST /qr/validate         -> validate a scanned QR (body: { uuid, token })

Notes
- This is a prototype: add authentication, rate limits, and stronger access controls before using with real data.
- The migrations create minimal tables: patients, users, records, files, audit_logs.
