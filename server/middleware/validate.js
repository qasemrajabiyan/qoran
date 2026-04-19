/**
 * ============================================================
 * FILE: middleware/validate.js
 * ROLE: اعتبارسنجی ورودی‌ها — تمام روت‌های quran.js
 * PROJECT: BarakatHub Karbala Backend
 * VERSION: 1.0.0
 * ============================================================
 */

import { CONFIG } from '../config.js';

/* ════════════════════════════════════════════════════════════
   ۱. ابزارهای کمکی
   ════════════════════════════════════════════════════════════ */

/* خطای استاندارد اعتبارسنجی */
function validationError(res, errors) {
  return res.status(422).json({
    success: false,
    error:   'داده‌های ورودی معتبر نیستند',
    code:    'VALIDATION_ERROR',
    fields:  errors,
  });
}

/* بررسی رشته غیرخالی */
function isNonEmptyString(val) {
  return typeof val === 'string' && val.trim().length > 0;
}

/* بررسی عدد صحیح مثبت */
function isPositiveInt(val) {
  const n = Number(val);
  return Number.isInteger(n) && n > 0;
}

/* بررسی URL معتبر */
function isValidUrl(val) {
  try { new URL(val); return true; } catch { return false; }
}

/* بررسی فرمت ayahId — مثال: surah2_ayah5 */
function isValidAyahId(val) {
  return isNonEmptyString(val) && /^[a-zA-Z0-9_\-]{1,100}$/.test(val.trim());
}

/* بررسی jobId */
function isValidJobId(val) {
  return isNonEmptyString(val) && /^job_[a-zA-Z0-9_\-]{1,120}$/.test(val.trim());
}

/* ════════════════════════════════════════════════════════════
   ۲. POST /api/quran/upload-video
   فیلدهای الزامی: ayahId + فایل ویدیو
   ════════════════════════════════════════════════════════════ */
export function validateUploadVideo(req, res, next) {
  const errors = {};
  const { ayahId } = req.body;

  if (!isValidAyahId(ayahId)) {
    errors.ayahId = 'ayahId الزامی است و فقط حروف، اعداد، خط تیره و زیرخط مجاز است';
  }

  if (Object.keys(errors).length) return validationError(res, errors);
  next();
}

/* ════════════════════════════════════════════════════════════
   ۳. POST /api/quran/extract-audio
   فیلدهای الزامی: ayahId + (فایل یا videoUrl)
   ════════════════════════════════════════════════════════════ */
export function validateExtractAudio(req, res, next) {
  const errors = {};
  const { ayahId, videoUrl } = req.body;

  if (!isValidAyahId(ayahId)) {
    errors.ayahId = 'ayahId الزامی است';
  }

  /* فایل یا URL باید یکی وجود داشته باشه */
  if (!req.file && !videoUrl) {
    errors.videoUrl = 'فایل ویدیو یا videoUrl الزامی است';
  } else if (videoUrl && !isValidUrl(videoUrl)) {
    errors.videoUrl = 'آدرس URL ویدیو معتبر نیست';
  }

  if (Object.keys(errors).length) return validationError(res, errors);
  next();
}

/* ════════════════════════════════════════════════════════════
   ۴. POST /api/quran/dub-video
   فیلدهای الزامی: ayahId + persianText + (فایل یا videoUrl)
   ════════════════════════════════════════════════════════════ */
export function validateDubVideo(req, res, next) {
  const errors = {};
  const { ayahId, videoUrl, persianText } = req.body;

  if (!isValidAyahId(ayahId)) {
    errors.ayahId = 'ayahId الزامی است';
  }

  if (!req.file && !videoUrl) {
    errors.videoUrl = 'فایل ویدیو یا videoUrl الزامی است';
  } else if (videoUrl && !isValidUrl(videoUrl)) {
    errors.videoUrl = 'آدرس URL ویدیو معتبر نیست';
  }

  if (!isNonEmptyString(persianText)) {
    errors.persianText = 'persianText الزامی است';
  } else if (persianText.trim().length > 5000) {
    errors.persianText = 'persianText نباید بیشتر از ۵۰۰۰ کاراکتر باشد';
  }

  if (Object.keys(errors).length) return validationError(res, errors);
  next();
}

/* ════════════════════════════════════════════════════════════
   ۵. GET /api/quran/status/:jobId
   پارامتر URL: jobId
   ════════════════════════════════════════════════════════════ */
export function validateJobId(req, res, next) {
  const { jobId } = req.params;

  if (!isValidJobId(jobId)) {
    return res.status(400).json({
      success: false,
      error:   'jobId معتبر نیست',
      code:    'INVALID_JOB_ID',
    });
  }
  next();
}

/* ════════════════════════════════════════════════════════════
   ۶. POST /api/quran/ayahs — ذخیره تدبر جدید
   فیلدهای الزامی: ayahId, arabic, summary, tadabbur
   فیلدهای اختیاری: surahNum, ayahNum, surahName, author, urlها
   ════════════════════════════════════════════════════════════ */
export function validateSaveAyah(req, res, next) {
  const errors = {};
  const {
    ayahId, arabic, summary, tadabbur,
    surahNum, ayahNum, surahName, author,
    audioUrl, videoUrl, extractedAudioUrl,
  } = req.body;

  /* الزامی */
  if (!isValidAyahId(ayahId)) {
    errors.ayahId = 'ayahId الزامی است';
  }
  if (!isNonEmptyString(arabic)) {
    errors.arabic = 'متن عربی آیه الزامی است';
  } else if (arabic.trim().length > 2000) {
    errors.arabic = 'متن عربی نباید بیشتر از ۲۰۰۰ کاراکتر باشد';
  }
  if (!isNonEmptyString(summary)) {
    errors.summary = 'خلاصه الزامی است';
  } else if (summary.trim().length > 1000) {
    errors.summary = 'خلاصه نباید بیشتر از ۱۰۰۰ کاراکتر باشد';
  }
  if (!isNonEmptyString(tadabbur)) {
    errors.tadabbur = 'تدبر الزامی است';
  } else if (tadabbur.trim().length > 10000) {
    errors.tadabbur = 'تدبر نباید بیشتر از ۱۰۰۰۰ کاراکتر باشد';
  }

  /* اختیاری — اگر وجود داشت معتبر باشه */
  if (surahNum !== undefined && !isPositiveInt(surahNum)) {
    errors.surahNum = 'شماره سوره باید عدد صحیح مثبت باشد';
  }
  if (ayahNum !== undefined && !isPositiveInt(ayahNum)) {
    errors.ayahNum = 'شماره آیه باید عدد صحیح مثبت باشد';
  }
  if (surahName !== undefined && !isNonEmptyString(surahName)) {
    errors.surahName = 'نام سوره معتبر نیست';
  }
  if (author !== undefined && typeof author !== 'string') {
    errors.author = 'نام مؤلف معتبر نیست';
  }
  if (audioUrl        && !isValidUrl(audioUrl))        errors.audioUrl        = 'آدرس صوت معتبر نیست';
  if (videoUrl        && !isValidUrl(videoUrl))        errors.videoUrl        = 'آدرس ویدیو معتبر نیست';
  if (extractedAudioUrl && !isValidUrl(extractedAudioUrl)) errors.extractedAudioUrl = 'آدرس صوت استخراج‌شده معتبر نیست';

  if (Object.keys(errors).length) return validationError(res, errors);
  next();
}

/* ════════════════════════════════════════════════════════════
   ۷. validateLang — بررسی زبان پشتیبانی‌شده (عمومی)
   برای استفاده در روت‌هایی که lang دریافت می‌کنند
   ════════════════════════════════════════════════════════════ */
export function validateLang(req, res, next) {
  const lang = req.params.lang || req.query.lang || req.body.lang;

  if (lang && !CONFIG.SUPPORTED_LANGS.includes(lang)) {
    return res.status(400).json({
      success: false,
      error:   `زبان نامعتبر — زبان‌های مجاز: ${CONFIG.SUPPORTED_LANGS.join(', ')}`,
      code:    'INVALID_LANG',
    });
  }
  next();
}
