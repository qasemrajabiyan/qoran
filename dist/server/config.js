/**
 * ============================================================
 * FILE: config.js
 * ROLE: تنظیمات مرکزی سرور — کلیدهای API و پیکربندی
 * PROJECT: BarakatHub Karbala Backend
 * VERSION: 2.0.0
 * ============================================================
 */

import dotenv from 'dotenv';
dotenv.config();

export const CONFIG = {

  /* ── سرور ── */
  PORT:     process.env.PORT     || 3001,
  NODE_ENV: process.env.NODE_ENV || 'development',
  BASE_URL: process.env.BASE_URL || 'http://localhost:3001',

  /* ── CORS — آدرس‌های مجاز ── */
  ALLOWED_ORIGINS: (process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://localhost:5500')
    .split(',').map(o => o.trim()),

  /* ── ElevenLabs — دوبله صدا ── */
  ELEVENLABS: {
    API_KEY:  process.env.ELEVENLABS_API_KEY  || '',   /* بعداً وارد کنید */
    VOICE_ID: process.env.ELEVENLABS_VOICE_ID || '',   /* Voice ID استاد */
    MODEL_ID: 'eleven_multilingual_v2',                /* بهترین مدل چندزبانه */
    BASE_URL: 'https://api.elevenlabs.io/v1',
  },

  /* ── OpenAI Whisper — تبدیل گفتار به متن ── */
  OPENAI: {
    API_KEY:  process.env.OPENAI_API_KEY || '',        /* بعداً وارد کنید */
    MODEL:    'whisper-1',
    BASE_URL: 'https://api.openai.com/v1',
  },

  /* ── Claude API — ترجمه متن ── */
  CLAUDE: {
    API_KEY:  process.env.CLAUDE_API_KEY || '',        /* بعداً وارد کنید */
    MODEL:    'claude-sonnet-4-20250514',
    BASE_URL: 'https://api.anthropic.com/v1',
  },

  /* ── Cloudflare R2 — ذخیره ویدیو و صوت ── */
  R2: {
    ACCOUNT_ID:        process.env.CF_ACCOUNT_ID        || '',
    ACCESS_KEY_ID:     process.env.CF_R2_ACCESS_KEY_ID  || '',
    SECRET_ACCESS_KEY: process.env.CF_R2_SECRET_KEY     || '',
    BUCKET_NAME:       process.env.CF_R2_BUCKET         || 'BarakatHub-media',
    PUBLIC_URL:        process.env.CF_R2_PUBLIC_URL      || '',  /* آدرس عمومی bucket */
  },

  /* ── زبان‌های پشتیبانی‌شده ── */
  SUPPORTED_LANGS: ['ar', 'ur', 'az', 'tr', 'ru', 'en', 'id'],

  /* ── دستورالعمل ترجمه برای هر زبان ── */
  LANG_INSTRUCTIONS: {
    ar: 'ترجم إلى العربية الفصحى المناسبة للمحتوى الديني الإسلامي.',
    ur: 'اردو میں ترجمہ کریں جو پاکستانی اسلامی ثقافت سے مناسب ہو۔',
    az: 'Azərbaycan dilinə çevirin. İslami mədəniyyəti nəzərə alın.',
    tr: 'Türkçeye çevirin. İslami kültüre uygun, akıcı olsun.',
    ru: 'Переведите на русский. Литературный стиль для исламского контента.',
    en: 'Translate to English. Formal, respectful Islamic religious content.',
    id: 'Terjemahkan ke Bahasa Indonesia. Sesuai dengan budaya Islam Indonesia.',
  },

  /* ── آپلود ── */
  UPLOAD: {
    MAX_VIDEO_SIZE_MB: 500,
    MAX_AUDIO_SIZE_MB: 50,
    TEMP_DIR:          '/tmp/BarakatHub',
    ALLOWED_VIDEO:     ['video/mp4', 'video/webm', 'video/quicktime'],
    ALLOWED_AUDIO:     ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/webm', 'audio/ogg'],
  },

  /* ── Rate Limiting ── */
  RATE_LIMIT: {
    WINDOW_MS:   15 * 60 * 1000,  /* ۱۵ دقیقه */
    MAX_GENERAL: 100,
    MAX_UPLOAD:  10,
    MAX_DUBBING: 5,
  },
};

/* بررسی کلیدهای ضروری */
export function checkConfig() {
  const warnings = [];
  if (!CONFIG.ELEVENLABS.API_KEY)  warnings.push('⚠  ELEVENLABS_API_KEY تنظیم نشده — دوبله غیرفعال');
  if (!CONFIG.OPENAI.API_KEY)      warnings.push('⚠  OPENAI_API_KEY تنظیم نشده — استخراج صوت غیرفعال');
  if (!CONFIG.CLAUDE.API_KEY)      warnings.push('⚠  CLAUDE_API_KEY تنظیم نشده — ترجمه متن غیرفعال');
  if (!CONFIG.R2.ACCESS_KEY_ID)    warnings.push('⚠  Cloudflare R2 تنظیم نشده — ذخیره فایل محلی');
  return warnings;
}
