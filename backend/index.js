const express = require('express');
const cors = require('cors');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(cors());
app.use(express.json());

const db = require('./db');
const qr = require('./qr');

// In-memory store (kept for compatibility/dev)
const records = [];
let idCounter = 1;

app.get('/health', (req, res) => res.json({ status: 'ok' }));

// List records (in-memory prototype)
app.get('/records', (req, res) => {
  res.json(records);
});

// Add manual record (in-memory prototype)
app.post('/records', (req, res) => {
  const { patientId, type, data } = req.body;
  if (!patientId || !type || !data) {
    return res.status(400).json({ error: 'patientId, type and data are required' });
  }
  const rec = { id: idCounter++, patientId, type, data, createdAt: new Date().toISOString() };
  records.push(rec);
  res.status(201).json(rec);
});

// Upload scanned report (multipart)
app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'file is required' });

  // NOTE: this is a stub. Integrate OCR (Tesseract or cloud Vision) here.
  const rec = {
    id: idCounter++,
    patientId: req.body.patientId || 'unknown',
    type: 'scan',
    filename: req.file.originalname,
    path: req.file.path,
    ocrText: 'OCR not configured in scaffold',
    createdAt: new Date().toISOString()
  };
  records.push(rec);
  res.status(201).json(rec);
});

// --- QR endpoints ---

// Helper: ensure patient exists (create minimal patient row if not present)
async function ensurePatient(uuid, name = null) {
  const r = await db.query('SELECT id FROM patients WHERE uuid = $1', [uuid]);
  if (r.rows.length) return r.rows[0];
  const ins = await db.query('INSERT INTO patients (uuid, name) VALUES ($1, $2) RETURNING id', [uuid, name]);
  return ins.rows[0];
}

// Generate QR for a patient (admin endpoint; add auth in real implementation)
app.post('/patients/:uuid/qr', async (req, res) => {
  try {
    const patientUuid = req.params.uuid;
    const ttl = parseInt(req.body.ttlMinutes || '60', 10);
    const purpose = req.body.purpose || 'default';

    // ensure patient exists
    await ensurePatient(patientUuid);

    const result = await qr.generatePatientQr(patientUuid, ttl, purpose);
    res.json({ ok: true, qrUrl: result.qrUrl, qrDataUrl: result.qrDataUrl, expiresAt: result.expiresAt });
  } catch (err) {
    console.error('Error generating QR', err);
    res.status(500).json({ error: 'failed to generate QR' });
  }
});

// Validate QR token (called by frontend after scan)
app.post('/qr/validate', async (req, res) => {
  try {
    const { uuid, token } = req.body;
    if (!uuid || !token) return res.status(400).json({ ok: false, error: 'uuid and token required' });
    const meta = { ip: req.ip, ua: req.get('User-Agent') };
    const result = await qr.validateQr(uuid, token, meta);
    if (!result.ok) return res.status(401).json({ ok: false });
    // For prototype, return patient id; in real app, require auth and return limited view
    res.json({ ok: true, patientId: result.patientId });
  } catch (err) {
    console.error('QR validate error', err);
    res.status(500).json({ ok: false, error: 'internal error' });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Backend listening on http://localhost:${PORT}`));
