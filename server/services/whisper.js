/**
 * ============================================================
 * FILE: services/whisper.js
 * ROLE: استخراج صوت از ویدیو + تبدیل گفتار به متن (Whisper)
 * PROJECT: MediaHub Karbala Backend
 * ============================================================
 *
 * جریان کار:
 *   ۱. ffmpeg صوت را از ویدیو استخراج می‌کند (MP3)
 *   ۲. Whisper متن را از صوت می‌خواند
 *   ۳. متن فارسی آماده ترجمه می‌شود
 * ============================================================
 */

import ffmpeg from 'fluent-ffmpeg';
import axios  from 'axios';
import FormData from 'form-data';
import { createReadStream, existsSync, mkdirSync } from 'fs';
import { join, basename } from 'path';
import { CONFIG } from '../config.js';

const TEMP_DIR = CONFIG.UPLOAD.TEMP_DIR;
if (!existsSync(TEMP_DIR)) mkdirSync(TEMP_DIR, { recursive: true });

/* ────────────────────────────────────────────────────────────
   استخراج صوت از ویدیو با ffmpeg
   ──────────────────────────────────────────────────────────── */
export function extractAudioFromVideo(videoPath) {
  return new Promise((resolve, reject) => {
    const outputPath = join(TEMP_DIR, `audio_${Date.now()}.mp3`);

    console.log(`[Whisper] استخراج صوت از: ${videoPath}`);

    ffmpeg(videoPath)
      .noVideo()
      .audioCodec('libmp3lame')
      .audioBitrate('192k')
      .audioFrequency(44100)
      .audioChannels(2)
      .output(outputPath)
      .on('start', cmd => {
        console.log(`[ffmpeg] شروع: ${cmd}`);
      })
      .on('progress', p => {
        if (p.percent) process.stdout.write(`\r[ffmpeg] پیشرفت: ${Math.round(p.percent)}%`);
      })
      .on('end', () => {
        console.log('\n[ffmpeg] ✓ استخراج صوت کامل شد');
        resolve(outputPath);
      })
      .on('error', err => {
        console.error('[ffmpeg] خطا:', err.message);
        reject(new Error(`خطای ffmpeg: ${err.message}`));
      })
      .run();
  });
}

/* ────────────────────────────────────────────────────────────
   تبدیل گفتار به متن با Whisper
   ──────────────────────────────────────────────────────────── */
export async function transcribeAudio(audioPath, language = 'fa') {
  if (!CONFIG.OPENAI.API_KEY) {
    console.warn('[Whisper] API Key تنظیم نشده — شبیه‌سازی');
    return {
      text:     'متن نمونه برای تست — بعد از وصل کردن Whisper API واقعی می‌شود',
      language: 'fa',
      duration: 0,
    };
  }

  console.log(`[Whisper] شروع transcribe: ${audioPath}`);

  const form = new FormData();
  form.append('file',            createReadStream(audioPath), { filename: basename(audioPath) });
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
  const audioPath = await extractAudioFromVideo(videoPath);

  /* ۲. transcribe */
  const transcript = await transcribeAudio(audioPath, 'fa');

  return {
    audioPath,
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
