/**
 * ============================================================
 * FILE: server/routes/quran.js
 * ROLE: API مسیرهای دانشگاه قرآن — دوبله، صوت، مدیریت
 * PROJECT: BarakatHub Karbala Backend
 * VERSION: 2.0.0  (D1 integration)
 * ============================================================
 * تغییرات نسبت به نسخه قبل:
 *   - GET /api/quran/ayahs → خواندن از D1
 *   - POST /api/quran/ayahs → ذخیره در D1
 *   - PATCH /api/quran/ayahs/:id/urls → به‌روزرسانی URL های دوبله در D1
 *   - بقیه روت‌ها (upload، dub، extract، status، health) دست‌نخورده
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
import { dbGet, dbAll, dbRun }  from '../db/client.js';

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

    /* به‌روزرسانی URL در دیتابیس اگر آیه وجود دارد */
    try {
      await dbRun(
        `UPDATE ayahs SET video_url = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
         WHERE id = ?`,
        [videoUrl, ayahId]
      );
    } catch (dbErr) {
      console.warn('[/upload-video] D1 update skipped:', dbErr.message);
    }

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

    /* به‌روزرسانی در دیتابیس */
    try {
      await dbRun(
        `UPDATE ayahs SET extracted_audio_url = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
         WHERE id = ?`,
        [audioUrl, ayahId]
      );
    } catch (dbErr) {
      console.warn('[/extract-audio] D1 update skipped:', dbErr.message);
    }

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
        const videoDestKey   = makeKey(ayahId, lang, 'video');
        const dubbedVideoUrl = await uploadFile(result.dubbedVideoPath, videoDestKey, 'video/mp4');

        /* آپلود صوت دوبله‌شده */
        const audioDestKey   = makeKey(ayahId, lang, 'audio');
        const dubbedAudioUrl = await uploadFile(result.audioPath, audioDestKey, 'audio/mpeg');

        job.results[lang] = {
          success:  true,
          videoUrl: dubbedVideoUrl,
          audioUrl: dubbedAudioUrl,
        };
        job.progress[lang] = 'done';

        /* ذخیره URL دوبله در دیتابیس */
        try {
          await dbRun(
            `UPDATE ayahs
             SET dubbed_${lang} = ?, audio_${lang} = ?,
                 updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
             WHERE id = ?`,
            [dubbedVideoUrl, dubbedAudioUrl, ayahId]
          );
        } catch (dbErr) {
          console.warn(`[dub-video/${lang}] D1 update skipped:`, dbErr.message);
        }

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
    success:     true,
    jobId:       job.id,
    ayahId:      job.ayahId,
    status:      job.status,
    percent:     Math.round((doneLangs / totalLangs) * 100),
    progress:    job.progress,
    results:     job.results,
    startedAt:   job.startedAt,
    completedAt: job.completedAt || null,
    error:       job.error || null,
  });
});

/* ────────────────────────────────────────────────────────────
   GET /api/quran/ayahs
   لیست تدبرات از دیتابیس
   ──────────────────────────────────────────────────────────── */
router.get('/ayahs', async (req, res) => {
  try {
    const { surah, published = '1', limit = '50', offset = '0' } = req.query;

    let sql    = 'SELECT * FROM ayahs WHERE 1=1';
    const params = [];

    if (published !== 'all') {
      sql += ' AND published = ?';
      params.push(parseInt(published));
    }
    if (surah) {
      sql += ' AND surah_num = ?';
      params.push(parseInt(surah));
    }

    sql += ' ORDER BY surah_num ASC, ayah_num ASC';
    sql += ` LIMIT ? OFFSET ?`;
    params.push(Math.min(parseInt(limit), 100));
    params.push(parseInt(offset));

    const ayahs = await dbAll(sql, params);

    /* تبدیل فرمت برای سازگاری با frontend */
    const formatted = ayahs.map(a => ({
      id:        a.id,
      surahNum:  a.surah_num,
      ayahNum:   a.ayah_num,
      surahName: a.surah_name,
      arabic:    a.arabic,
      summary:   { fa: a.summary_fa },
      tadabbur:  { fa: a.tadabbur_fa },
      author:    a.author,
      audioUrl:           a.audio_url,
      videoUrl:           a.video_url,
      extractedAudioUrl:  a.extracted_audio_url,
      dubbedVideoUrls: {
        ar: a.dubbed_ar, ur: a.dubbed_ur, az: a.dubbed_az,
        tr: a.dubbed_tr, ru: a.dubbed_ru, en: a.dubbed_en, id: a.dubbed_id,
      },
      dubbedAudioUrls: {
        ar: a.audio_ar, ur: a.audio_ur, az: a.audio_az,
        tr: a.audio_tr, ru: a.audio_ru, en: a.audio_en, id: a.audio_id,
      },
      published: a.published === 1,
      date:      a.created_at,
    }));

    res.json({ success: true, ayahs: formatted, total: formatted.length });

  } catch (err) {
    console.error('[/ayahs GET]', err);
    res.status(500).json({ success: false, error: 'خطای داخلی سرور' });
  }
});

/* ────────────────────────────────────────────────────────────
   POST /api/quran/ayahs
   ذخیره تدبر جدید در دیتابیس
   ──────────────────────────────────────────────────────────── */
router.post('/ayahs', async (req, res) => {
  const {
    ayahId, surahNum, ayahNum, surahName, arabic, summary, tadabbur,
    author, audioUrl, videoUrl, dubbedVideoUrls, extractedAudioUrl,
  } = req.body;

  if (!ayahId || !arabic || !summary || !tadabbur) {
    return res.status(400).json({ success: false, error: 'فیلدهای اصلی الزامی هستند' });
  }

  try {
    const dubbed = dubbedVideoUrls || {};

    await dbRun(
      `INSERT INTO ayahs
         (id, surah_num, ayah_num, surah_name, arabic,
          summary_fa, tadabbur_fa, author,
          audio_url, video_url, extracted_audio_url,
          dubbed_ar, dubbed_ur, dubbed_az, dubbed_tr, dubbed_ru, dubbed_en, dubbed_id,
          published)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
       ON CONFLICT(id) DO UPDATE SET
         surah_num           = excluded.surah_num,
         ayah_num            = excluded.ayah_num,
         surah_name          = excluded.surah_name,
         arabic              = excluded.arabic,
         summary_fa          = excluded.summary_fa,
         tadabbur_fa         = excluded.tadabbur_fa,
         author              = excluded.author,
         audio_url           = excluded.audio_url,
         video_url           = excluded.video_url,
         extracted_audio_url = excluded.extracted_audio_url,
         dubbed_ar           = excluded.dubbed_ar,
         dubbed_ur           = excluded.dubbed_ur,
         dubbed_az           = excluded.dubbed_az,
         dubbed_tr           = excluded.dubbed_tr,
         dubbed_ru           = excluded.dubbed_ru,
         dubbed_en           = excluded.dubbed_en,
         dubbed_id           = excluded.dubbed_id,
         updated_at          = strftime('%Y-%m-%dT%H:%M:%fZ','now')`,
      [
        ayahId, surahNum ?? null, ayahNum ?? null, surahName ?? '',
        arabic, summary, tadabbur, author ?? '',
        audioUrl ?? '', videoUrl ?? '', extractedAudioUrl ?? '',
        dubbed.ar ?? '', dubbed.ur ?? '', dubbed.az ?? '',
        dubbed.tr ?? '', dubbed.ru ?? '', dubbed.en ?? '', dubbed.id ?? '',
      ]
    );

    const saved = await dbGet('SELECT * FROM ayahs WHERE id = ?', [ayahId]);

    res.json({
      success: true,
      ayah:    saved,
      message: 'تدبر ذخیره شد',
    });

  } catch (err) {
    console.error('[/ayahs POST]', err);
    res.status(500).json({ success: false, error: 'خطای داخلی سرور' });
  }
});

/* ────────────────────────────────────────────────────────────
   PATCH /api/quran/ayahs/:id/urls
   به‌روزرسانی URL های دوبله پس از اتمام job
   ──────────────────────────────────────────────────────────── */
router.patch('/ayahs/:id/urls', async (req, res) => {
  const { id }  = req.params;
  const { lang, videoUrl, audioUrl } = req.body;

  if (!lang || !CONFIG.SUPPORTED_LANGS.includes(lang)) {
    return res.status(400).json({ success: false, error: 'زبان نامعتبر است' });
  }

  try {
    await dbRun(
      `UPDATE ayahs
       SET dubbed_${lang} = ?,
           audio_${lang}  = ?,
           updated_at     = strftime('%Y-%m-%dT%H:%M:%fZ','now')
       WHERE id = ?`,
      [videoUrl ?? '', audioUrl ?? '', id]
    );

    res.json({ success: true, message: `URL های زبان ${lang} به‌روز شد` });

  } catch (err) {
    console.error('[/ayahs/:id/urls]', err);
    res.status(500).json({ success: false, error: 'خطای داخلی سرور' });
  }
});

export default router;
