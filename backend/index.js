const express = require('express');
const cors = require('cors');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

const app = express();
app.use(cors());
app.use(express.json());

// In-memory store (development only)
const records = [];
let idCounter = 1;

app.get('/health', (req, res) => res.json({ status: 'ok' }));

// List records
app.get('/records', (req, res) => {
  res.json(records);
});

// Add manual record
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

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Backend listening on http://localhost:${PORT}`));
