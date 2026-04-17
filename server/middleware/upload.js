/**
 * ============================================================
 * FILE: middleware/upload.js
 * ROLE: مدیریت آپلود فایل ویدیو و صوت
 * PROJECT: MediaHub Karbala Backend
 * ============================================================
 */

import multer  from 'multer';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { CONFIG } from '../config.js';

const TEMP_DIR = CONFIG.UPLOAD.TEMP_DIR;
if (!existsSync(TEMP_DIR)) mkdirSync(TEMP_DIR, { recursive: true });

/* ── ذخیره موقت روی دیسک ── */
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, TEMP_DIR),
  filename:    (req, file, cb) => {
    const ext  = file.originalname.split('.').pop();
    const name = `upload_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
    cb(null, name);
  },
});

/* ── فیلتر نوع فایل ── */
function fileFilter(allowedTypes) {
  return (req, file, cb) => {
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`نوع فایل مجاز نیست: ${file.mimetype}`), false);
    }
  };
}

/* ── آپلود ویدیو ── */
export const uploadVideo = multer({
  storage,
  limits:     { fileSize: CONFIG.UPLOAD.MAX_VIDEO_SIZE_MB * 1024 * 1024 },
  fileFilter: fileFilter(CONFIG.UPLOAD.ALLOWED_VIDEO),
}).single('video');

/* ── آپلود صوت ── */
export const uploadAudio = multer({
  storage,
  limits:     { fileSize: CONFIG.UPLOAD.MAX_AUDIO_SIZE_MB * 1024 * 1024 },
  fileFilter: fileFilter(CONFIG.UPLOAD.ALLOWED_AUDIO),
}).single('audio');

/* ── Middleware wrapper با error handling ── */
export function handleUpload(uploadMiddleware) {
  return (req, res, next) => {
    uploadMiddleware(req, res, (err) => {
      if (!err) return next();
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({
          success: false,
          error:   `حجم فایل بیش از حد مجاز است`,
        });
      }
      return res.status(400).json({
        success: false,
        error:   err.message,
      });
    });
  };
}
