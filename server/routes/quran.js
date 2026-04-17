/**
 * ============================================================
 * FILE: routes/quran.js
 * ROLE: API مسیرهای دانشگاه قرآن — دوبله، صوت، مدیریت
 * PROJECT: MediaHub Karbala Backend
 * ============================================================
 *
 * POST /api/quran/upload-video      — آپلود ویدیو اصلی
 * POST /api/quran/dub-video         — شروع دوبله ۷ زبان
 * POST /api/quran/extract-audio     — استخراج صوت از ویدیو
 * GET  /api/quran/status/:jobId     — وضعیت پردازش
 * GET  /api/quran/ayahs             — لیست تدبرات
 * POST /api/quran/ayahs             — ذخیره تدبر جدید
 * GET  /api/quran/health            — وضعیت سرویس‌ها
 * ============================================================
 */

import { Router }               from 'express';
import { unlink }               from 'fs/promises';
import { existsSync }           from 'fs';
import { join }                 from 'path';
import rateLimit                from 'express-rate-limit';
import { uploadVideo, uploadAudio, handleUpload } from '../middleware/upload.js';
import { extractAudioFromVideo, transcribeAudio } from '../services/whisper.js';
import { dubVideoAllLangs, getDubbingStatus }     from '../services/dubbing.js';
import { uploadFile, uploadBuffer, makeKey, getStorageStatus } from '../services/storage.js';
import { CONFIG }               from '../config.js';

const router = Router();

/* ── در حافظه برای ردیابی وضعیت job ها ── */
/* در production از Redis استفاده کنید */
const JOBS = new Map();

/* ── Rate limiters ── */
const uploadLimiter  = rateLimit({ windowMs: CONFIG.RATE_LIMIT.WINDOW_MS, max: CONFIG.RATE_LIMIT.MAX_UPLOAD,  message: { error: 'درخواست زیاد است' } });
const dubbingLimiter = rateLimit({ windowMs: CONFIG.RATE_LIMIT.WINDOW_MS, max: CONFIG.RATE_LIMIT.MAX_DUBBING, message: { error: 'محدودیت دوبله' } });

/* ── تابع کمکی پاک‌سازی فایل موقت ── */
async function _cleanup(filePath) {
  try { if (filePath && existsSync(filePath)) await unlink(filePath); } catch {}
}

/* ────────────────────────────────────────────────────────────
   GET /api/quran/health
   وضعیت همه سرویس‌ها
   ──────────────────────────────────────────────────────────── */
router.get('/health', (req, res) => {
  const dubStatus     = getDubbingStatus();
  const storageStatus = getStorageStatus();

  res.json({
    success:   true,
    timestamp: new Date().toISOString(),
    services: {
      elevenlabs: {
        status: dubStatus.elevenlabs.connected ? '✅ متصل' : '⚠️ API Key نیست',
        model:  dubStatus.elevenlabs.model,
        voice:  dubStatus.elevenlabs.voiceId,
      },
      whisper: {
        status: dubStatus.claude.connected ? '✅ متصل' : '⚠️ API Key نیست',
        model:  CONFIG.OPENAI.MODEL,
      },
      claude: {
        status: dubStatus.claude.connected ? '✅ متصل' : '⚠️ API Key نیست',
        model:  CONFIG.CLAUDE.MODEL,
      },
      storage: {
        status: storageStatus.connected ? '✅ R2 متصل' : '⚠️ ذخیره محلی',
        type:   storageStatus.type,
        bucket: storageStatus.bucket,
      },
    },
    supportedLangs: CONFIG.SUPPORTED_LANGS,
    activeJobs:     JOBS.size,
  });
});

/* ────────────────────────────────────────────────────────────
   POST /api/quran/upload-video
   آپلود ویدیو اصلی فارسی
   ──────────────────────────────────────────────────────────── */
router.post('/upload-video', uploadLimiter, handleUpload(uploadVideo), async (req, res) => {
  const videoFile = req.file;
  const { ayahId } = req.body;

  if (!videoFile) return res.status(400).json({ success: false, error: 'فایل ویدیو ارسال نشده' });
  if (!ayahId)    return res.status(400).json({ success: false, error: 'ayahId الزامی است' });

  try {
    /* آپلود به R2 */
    const destKey  = makeKey(ayahId, 'fa', 'video');
    const videoUrl = await uploadFile(videoFile.path, destKey, videoFile.mimetype);

    await _cleanup(videoFile.path);

    res.json({
      success:  true,
      ayahId,
      videoUrl,
      message:  'ویدیو با موفقیت آپلود شد',
    });

  } catch (err) {
    await _cleanup(videoFile?.path);
    console.error('[/upload-video]', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/* ────────────────────────────────────────────────────────────
   POST /api/quran/extract-audio
   استخراج صوت از ویدیو
   ──────────────────────────────────────────────────────────── */
router.post('/extract-audio', uploadLimiter, handleUpload(uploadVideo), async (req, res) => {
  const videoFile = req.file;
  const { ayahId, videoUrl: existingVideoUrl } = req.body;

  if (!videoFile && !existingVideoUrl) {
    return res.status(400).json({ success: false, error: 'ویدیو یا URL ویدیو الزامی است' });
  }
  if (!ayahId) return res.status(400).json({ success: false, error: 'ayahId الزامی است' });

  const videoPath = videoFile?.path || existingVideoUrl;

  try {
    /* استخراج صوت */
    const audioPath = await extractAudioFromVideo(videoPath);

    /* آپلود صوت به R2 */
    const destKey  = makeKey(ayahId, 'fa', 'audio');
    const audioUrl = await uploadFile(audioPath, destKey, 'audio/mpeg');

    await _cleanup(videoFile?.path);
    await _cleanup(audioPath);

    res.json({
      success:  true,
      ayahId,
      audioUrl,
      message:  'صوت با موفقیت استخراج شد',
    });

  } catch (err) {
    await _cleanup(videoFile?.path);
    console.error('[/extract-audio]', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/* ────────────────────────────────────────────────────────────
   POST /api/quran/dub-video
   دوبله ویدیو به ۷ زبان (async با job tracking)
   ──────────────────────────────────────────────────────────── */
router.post('/dub-video', dubbingLimiter, handleUpload(uploadVideo), async (req, res) => {
  const videoFile = req.file;
  const { ayahId, videoUrl: existingVideoUrl, persianText } = req.body;

  if (!videoFile && !existingVideoUrl) {
    return res.status(400).json({ success: false, error: 'ویدیو یا URL ویدیو الزامی است' });
  }
  if (!ayahId)      return res.status(400).json({ success: false, error: 'ayahId الزامی است' });
  if (!persianText) return res.status(400).json({ success: false, error: 'persianText الزامی است' });

  /* ساخت Job ID */
  const jobId = `job_${ayahId}_${Date.now()}`;
  JOBS.set(jobId, {
    id:        jobId,
    ayahId,
    status:    'processing',
    progress:  {},
    results:   {},
    startedAt: new Date().toISOString(),
  });

  /* پاسخ فوری — پردازش در پس‌زمینه */
  res.json({
    success: true,
    jobId,
    message: 'دوبله شروع شد — وضعیت را با jobId پیگیری کنید',
    statusUrl: `/api/quran/status/${jobId}`,
  });

  /* ── پردازش در پس‌زمینه ── */
  const videoPath = videoFile?.path || existingVideoUrl;

  dubVideoAllLangs(videoPath, persianText, async (lang, result) => {

    const job = JOBS.get(jobId);
    if (!job) return;

    if (result.success) {
      try {
        /* آپلود ویدیو دوبله‌شده */
        const videoDestKey  = makeKey(ayahId, lang, 'video');
        const dubbedVideoUrl = await uploadFile(result.dubbedVideoPath, videoDestKey, 'video/mp4');

        /* آپلود صوت دوبله‌شده */
        const audioDestKey  = makeKey(ayahId, lang, 'audio');
        const dubbedAudioUrl = await uploadFile(result.audioPath, audioDestKey, 'audio/mpeg');

        job.results[lang] = {
          success:  true,
          videoUrl: dubbedVideoUrl,
          audioUrl: dubbedAudioUrl,
        };
        job.progress[lang] = 'done';

        /* پاک‌سازی فایل‌های موقت */
        await _cleanup(result.dubbedVideoPath);
        await _cleanup(result.audioPath);

      } catch (uploadErr) {
        job.results[lang]  = { success: false, error: uploadErr.message };
        job.progress[lang] = 'error';
      }
    } else {
      job.results[lang]  = { success: false, error: result.error };
      job.progress[lang] = 'error';
    }

    /* بررسی اتمام همه زبان‌ها */
    const doneCount = Object.keys(job.progress).length;
    if (doneCount === CONFIG.SUPPORTED_LANGS.length) {
      job.status      = 'completed';
      job.completedAt = new Date().toISOString();
      await _cleanup(videoFile?.path);
      console.log(`\n[Job ${jobId}] ✅ کامل شد`);
    }

  }).catch(async (err) => {
    const job = JOBS.get(jobId);
    if (job) { job.status = 'failed'; job.error = err.message; }
    await _cleanup(videoFile?.path);
    console.error(`[Job ${jobId}] ✗ خطا:`, err.message);
  });
});

/* ────────────────────────────────────────────────────────────
   GET /api/quran/status/:jobId
   وضعیت پردازش دوبله
   ──────────────────────────────────────────────────────────── */
router.get('/status/:jobId', (req, res) => {
  const job = JOBS.get(req.params.jobId);
  if (!job) return res.status(404).json({ success: false, error: 'Job پیدا نشد' });

  const totalLangs = CONFIG.SUPPORTED_LANGS.length;
  const doneLangs  = Object.keys(job.progress).length;

  res.json({
    success:    true,
    jobId:      job.id,
    ayahId:     job.ayahId,
    status:     job.status,
    percent:    Math.round((doneLangs / totalLangs) * 100),
    progress:   job.progress,
    results:    job.results,
    startedAt:  job.startedAt,
    completedAt:job.completedAt || null,
    error:      job.error || null,
  });
});

/* ────────────────────────────────────────────────────────────
   GET /api/quran/ayahs
   لیست تدبرات (در production از دیتابیس)
   ──────────────────────────────────────────────────────────── */
router.get('/ayahs', (req, res) => {
  /* TODO: در production از دیتابیس بخوانید */
  res.json({
    success: true,
    ayahs:   [],
    note:    'در production به دیتابیس وصل کنید',
  });
});

/* ────────────────────────────────────────────────────────────
   POST /api/quran/ayahs
   ذخیره تدبر جدید
   ──────────────────────────────────────────────────────────── */
router.post('/ayahs', async (req, res) => {
  const { ayahId, surahNum, ayahNum, surahName, arabic, summary, tadabbur,
          author, audioUrl, videoUrl, dubbedVideoUrls, extractedAudioUrl } = req.body;

  if (!ayahId || !arabic || !summary || !tadabbur) {
    return res.status(400).json({ success: false, error: 'فیلدهای اصلی الزامی هستند' });
  }

  const ayahData = {
    id: ayahId, surahNum, ayahNum, surahName, arabic,
    summary:     { fa: summary },
    tadabbur:    { fa: tadabbur },
    author,
    audioUrl:           audioUrl           || '',
    videoUrl:           videoUrl           || '',
    dubbedVideoUrls:    dubbedVideoUrls    || { ar:'', ur:'', az:'', tr:'', ru:'', en:'', id:'' },
    extractedAudioUrl:  extractedAudioUrl  || '',
    published:   true,
    date:        new Date().toISOString(),
  };

  /* TODO: در production در دیتابیس ذخیره کنید */
  console.log('[/ayahs] تدبر جدید:', ayahData.id);

  res.json({
    success:  true,
    ayah:     ayahData,
    message:  'تدبر ذخیره شد',
  });
});

export default router;
