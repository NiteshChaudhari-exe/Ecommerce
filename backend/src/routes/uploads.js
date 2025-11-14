const express = require('express');
let multer;
try {
  multer = require('multer');
} catch (err) {
  // multer not installed; we'll still provide base64 upload fallback
  multer = null;
}
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// If multer is available, setup multipart upload endpoint
if (multer) {
  // Setup multer storage
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
      const ext = path.extname(file.originalname);
      const name = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}${ext}`;
      cb(null, name);
    }
  });

  const upload = multer({ storage });

  // POST /api/uploads - upload single image
  router.post('/', upload.single('image'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    // Return publicly accessible URL
    const protocol = req.protocol;
    const host = req.get('host');
    const url = `${protocol}://${host}/uploads/${req.file.filename}`;
    res.json({ url });
  });
} else {
  // multer missing - respond with 501 for multipart endpoint; base64 fallback remains available
  router.post('/', (req, res) => {
    res.status(501).json({ error: 'Multipart upload not supported on this server (multer not installed). Use /api/uploads/base64 instead.' });
  });
}

// Fallback endpoint: accept base64 payload as JSON { filename, data }
router.post('/base64', express.json({ limit: '10mb' }), (req, res) => {
  const { filename, data } = req.body;
  if (!filename || !data) return res.status(400).json({ error: 'filename and data are required' });
  // data should be data URL or base64 string
  const matches = data.match(/^data:(image\/\w+);base64,(.+)$/);
  let buffer, ext;
  if (matches) {
    ext = matches[1].split('/')[1];
    buffer = Buffer.from(matches[2], 'base64');
  } else {
    // assume raw base64
    buffer = Buffer.from(data, 'base64');
    ext = path.extname(filename).replace('.', '') || 'png';
  }
  const saveName = `${Date.now()}-${Math.random().toString(36).substring(2,8)}.${ext}`;
  const savePath = path.join(uploadsDir, saveName);
  fs.writeFile(savePath, buffer, (err) => {
    if (err) return res.status(500).json({ error: 'Could not save file' });
    const url = `${req.protocol}://${req.get('host')}/uploads/${saveName}`;
    res.json({ url });
  });
});

module.exports = router;
