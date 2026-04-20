import express from 'express';
import { uploadFile } from '../services/storage.js';
import multer from 'multer';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'فایلی ارسال نشده' });
    }
    const url = await uploadFile(req.file.buffer, req.file.originalname, req.file.mimetype);
    res.json({ success: true, url });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;