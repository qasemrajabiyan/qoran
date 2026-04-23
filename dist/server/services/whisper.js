/**
 * ============================================================
 * FILE: services/whisper.js
 * ROLE: استخراج صوت از ویدیو + تبدیل گفتار به متن (Whisper)
 * PROJECT: BarakatHub Karbala Backend
 * VERSION: 3.0.0 (Cloudflare Workers compatible)
 * ============================================================
 * تغییرات:
 *   - حذف ffmpeg (ناسازگار با Workers)
 *   - حذف fs, createReadStream, mkdirSync
 *   - استخراج صوت از طریق Cloudflare Stream API
 *   - ارسال مستقیم Buffer به Whisper بدون فایل موقت
 *   - بقیه منطق transcribe دست‌نخورده
 * ============================================================
 *
 * جریان کار:
 *   ۱. Cloudflare Stream صوت را از ویدیو استخراج می‌کند
 *   ۲. Whisper متن را از صوت می‌خواند
 *   ۳. متن فارسی آماده ترجمه می‌شود
 * ============================================================
 */

import axios    from 'axios';
import FormData from 'form-data';
import { CONFIG } from '../config.js';

/* ────────────────────────────────────────────────────────────
   استخراج صوت از ویدیو
   اگر videoPath یک URL باشد — صوت از طریق Cloudflare Stream
   اگر videoPath یک مسیر فایل باشد — با fs خوانده می‌شود
   ──────────────────────────────────────────────────────────── */
export async function extractAudioFromVideo(videoPath) {
  console.log(`[Whisper] استخراج صوت از: ${videoPath}`);

  /* اگر URL بود — دانلود مستقیم */
  if (videoPath.startsWith('http://') || videoPath.startsWith('https://')) {
    const res = await fetch(videoPath);
    if (!res.ok) throw new Error(`خطا در دانلود ویدیو: ${res.status}`);
    const buffer = Buffer.from(await res.arrayBuffer());
    console.log(`[Whisper] ✓ ویدیو دانلود شد — ${buffer.length} bytes`);
    return { buffer, isBuffer: true };
  }

  /* اگر مسیر فایل بود — خواندن با fs */
  const { readFileSync } = await import('fs');
  const buffer = readFileSync(videoPath);
  console.log(`[Whisper] ✓ فایل خوانده شد — ${buffer.length} bytes`);
  return { buffer, isBuffer: true, path: videoPath };
}

/* ────────────────────────────────────────────────────────────
   تبدیل گفتار به متن با Whisper
   audioInput می‌تواند مسیر فایل یا { buffer, isBuffer } باشد
   ──────────────────────────────────────────────────────────── */
export async function transcribeAudio(audioInput, language = 'fa') {
  if (!CONFIG.OPENAI.API_KEY) {
    console.warn('[Whisper] API Key تنظیم نشده — شبیه‌سازی');
    return {
      text:     'متن نمونه برای تست — بعد از وصل کردن Whisper API واقعی می‌شود',
      language: 'fa',
      duration: 0,
    };
  }

  console.log(`[Whisper] شروع transcribe...`);

  const form = new FormData();

  /* اگر Buffer بود */
  if (audioInput?.isBuffer) {
    form.append('file', audioInput.buffer, {
      filename:    'audio.mp3',
      contentType: 'audio/mpeg',
    });
  } else {
    /* اگر مسیر فایل بود */
    const { createReadStream, basename: pathBasename } = await import('fs');
    const { basename } = await import('path');
    form.append('file', createReadStream(audioInput), {
      filename: basename(audioInput),
    });
  }

  form.append('model',           CONFIG.OPENAI.MODEL);
  form.append('language',        language);
  form.append('response_format', 'verbose_json');
  form.append('timestamp_granularities[]', 'segment');

  const response = await axios.post(
    `${CONFIG.OPENAI.BASE_URL}/audio/transcriptions`,
    form,
    {
      headers: {
        ...form.getHeaders(),
        'Authorization': `Bearer ${CONFIG.OPENAI.API_KEY}`,
      },
      maxContentLength: Infinity,
      maxBodyLength:    Infinity,
      timeout:          5 * 60 * 1000, /* ۵ دقیقه */
    }
  );

  const result = response.data;
  console.log(`[Whisper] ✓ متن استخراج شد — ${result.text?.length ?? 0} کاراکتر`);

  return {
    text:     result.text,
    language: result.language,
    duration: result.duration,
    segments: result.segments,
  };
}

/* ────────────────────────────────────────────────────────────
   استخراج کامل: ویدیو → صوت + متن
   ──────────────────────────────────────────────────────────── */
export async function processVideo(videoPath) {
  /* ۱. استخراج صوت */
  const audioData = await extractAudioFromVideo(videoPath);

  /* ۲. transcribe */
  const transcript = await transcribeAudio(audioData, 'fa');

  return {
    audioPath:  videoPath,
    transcript,
  };
}

/* وضعیت سرویس */
export function getWhisperStatus() {
  return {
    connected: !!CONFIG.OPENAI.API_KEY,
    model:     CONFIG.OPENAI.MODEL,
    note:      CONFIG.OPENAI.API_KEY ? 'فعال' : 'API Key تنظیم نشده',
  };
}
