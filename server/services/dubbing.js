/**
 * ============================================================
 * FILE: services/dubbing.js
 * ROLE: دوبله ویدیو با صدای استاد — ElevenLabs + Claude
 * PROJECT: BarakatHub Karbala Backend
 * ============================================================
 *
 * جریان کار برای هر زبان:
 *   ۱. Claude متن فارسی را ترجمه می‌کند
 *   ۲. ElevenLabs متن را با صدای کلون‌شده استاد می‌خواند
 *   ۳. ffmpeg صدای جدید را با ویدیو اصلی ادغام می‌کند
 *   ۴. فایل نهایی در R2 ذخیره می‌شود
 * ============================================================
 */

import axios    from 'axios';
import ffmpeg   from 'fluent-ffmpeg';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { CONFIG } from '../config.js';

const TEMP_DIR = CONFIG.UPLOAD.TEMP_DIR;
if (!existsSync(TEMP_DIR)) mkdirSync(TEMP_DIR, { recursive: true });

/* ────────────────────────────────────────────────────────────
   ترجمه متن با Claude
   ──────────────────────────────────────────────────────────── */
async function _translateText(persianText, targetLang) {
  if (!CONFIG.CLAUDE.API_KEY) {
    console.warn(`[Claude] API Key نیست — متن اصلی برگردانده می‌شود`);
    return persianText;
  }

  const instruction = CONFIG.LANG_INSTRUCTIONS[targetLang] || '';

  const response = await axios.post(
    `${CONFIG.CLAUDE.BASE_URL}/messages`,
    {
      model:      CONFIG.CLAUDE.MODEL,
      max_tokens: 2000,
      system: `You are an expert translator for Islamic religious content. ${instruction}
Rules:
- Preserve spiritual and religious meaning exactly
- Keep Quranic terms in Arabic (Allah, Quran, ayah, etc.)
- Natural, flowing speech suitable for voice dubbing
- Return ONLY the translated text, nothing else`,
      messages: [{
        role:    'user',
        content: `Translate this Persian Islamic text to ${targetLang}:\n\n${persianText}`,
      }],
    },
    {
      headers: {
        'x-api-key':         CONFIG.CLAUDE.API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Type':      'application/json',
      },
      timeout: 60_000,
    }
  );

  const translated = response.data.content?.[0]?.text || persianText;
  console.log(`[Claude] ✓ ترجمه ${targetLang}: ${translated.slice(0, 60)}...`);
  return translated;
}

/* ────────────────────────────────────────────────────────────
   تولید صوت با ElevenLabs (TTS)
   ──────────────────────────────────────────────────────────── */
async function _generateVoice(text, targetLang) {
  if (!CONFIG.ELEVENLABS.API_KEY || !CONFIG.ELEVENLABS.VOICE_ID) {
    console.warn('[ElevenLabs] API Key یا Voice ID نیست — فایل mock');
    /* فایل صوتی mock (سکوت ۳ ثانیه) */
    const mockPath = join(TEMP_DIR, `mock_audio_${targetLang}_${Date.now()}.mp3`);
    /* یک buffer خالی کوچک */
    writeFileSync(mockPath, Buffer.alloc(1024));
    return mockPath;
  }

  console.log(`[ElevenLabs] تولید صدا برای زبان ${targetLang}...`);

  const response = await axios.post(
    `${CONFIG.ELEVENLABS.BASE_URL}/text-to-speech/${CONFIG.ELEVENLABS.VOICE_ID}`,
    {
      text,
      model_id: CONFIG.ELEVENLABS.MODEL_ID,
      voice_settings: {
        stability:        0.75,
        similarity_boost: 0.85,
        style:            0.20,
        use_speaker_boost: true,
      },
    },
    {
      headers: {
        'xi-api-key':   CONFIG.ELEVENLABS.API_KEY,
        'Content-Type': 'application/json',
        'Accept':       'audio/mpeg',
      },
      responseType: 'arraybuffer',
      timeout:      120_000,
    }
  );

  const audioPath = join(TEMP_DIR, `voice_${targetLang}_${Date.now()}.mp3`);
  writeFileSync(audioPath, Buffer.from(response.data));
  console.log(`[ElevenLabs] ✓ صدا تولید شد: ${audioPath}`);
  return audioPath;
}

/* ────────────────────────────────────────────────────────────
   ادغام صدا با ویدیو با ffmpeg
   ──────────────────────────────────────────────────────────── */
function _mergeAudioVideo(videoPath, audioPath, outputPath) {
  return new Promise((resolve, reject) => {
    console.log(`[ffmpeg] ادغام ویدیو + صدا...`);

    ffmpeg()
      .input(videoPath)
      .input(audioPath)
      .outputOptions([
        '-c:v copy',           /* ویدیو بدون رمزگذاری مجدد */
        '-c:a aac',            /* صدا AAC */
        '-b:a 192k',
        '-map 0:v:0',          /* ویدیو از اول */
        '-map 1:a:0',          /* صدا از دومی */
        '-shortest',
        '-movflags +faststart', /* streaming بهتر */
      ])
      .output(outputPath)
      .on('progress', p => {
        if (p.percent) process.stdout.write(`\r[ffmpeg] ادغام: ${Math.round(p.percent)}%`);
      })
      .on('end', () => {
        console.log('\n[ffmpeg] ✓ ادغام کامل شد');
        resolve(outputPath);
      })
      .on('error', err => {
        reject(new Error(`خطای ادغام: ${err.message}`));
      })
      .run();
  });
}

/* ────────────────────────────────────────────────────────────
   دوبله یک زبان
   ──────────────────────────────────────────────────────────── */
export async function dubVideoForLang(videoPath, persianText, targetLang) {
  console.log(`\n${'═'.repeat(50)}`);
  console.log(`[Dubbing] شروع دوبله زبان: ${targetLang}`);
  console.log(`${'═'.repeat(50)}`);

  try {
    /* ۱. ترجمه */
    const translatedText = await _translateText(persianText, targetLang);

    /* ۲. تولید صدا */
    const audioPath = await _generateVoice(translatedText, targetLang);

    /* ۳. ادغام */
    const outputPath = join(TEMP_DIR, `dubbed_${targetLang}_${Date.now()}.mp4`);
    await _mergeAudioVideo(videoPath, audioPath, outputPath);

    return {
      success:         true,
      lang:            targetLang,
      dubbedVideoPath: outputPath,
      audioPath,
      translatedText,
    };

  } catch (err) {
    console.error(`[Dubbing] ✗ خطا در ${targetLang}:`, err.message);
    return {
      success: false,
      lang:    targetLang,
      error:   err.message,
    };
  }
}

/* ────────────────────────────────────────────────────────────
   دوبله همه ۷ زبان به صورت موازی
   ──────────────────────────────────────────────────────────── */
export async function dubVideoAllLangs(videoPath, persianText, onProgress) {
  const langs = CONFIG.SUPPORTED_LANGS;
  console.log(`\n[Dubbing] شروع دوبله ${langs.length} زبان به صورت موازی`);

  const results = {};

  /* اجرای موازی — همه زبان‌ها با هم */
  const promises = langs.map(async (lang) => {
    const result = await dubVideoForLang(videoPath, persianText, lang);
    results[lang] = result;
    if (onProgress) onProgress(lang, result);
    return result;
  });

  await Promise.allSettled(promises);

  const succeeded = Object.values(results).filter(r => r.success).length;
  const failed    = langs.length - succeeded;
  console.log(`\n[Dubbing] ✓ کامل شد — موفق: ${succeeded}/${langs.length} | خطا: ${failed}`);

  return results;
}

/* وضعیت سرویس */
export function getDubbingStatus() {
  return {
    elevenlabs: {
      connected: !!(CONFIG.ELEVENLABS.API_KEY && CONFIG.ELEVENLABS.VOICE_ID),
      voiceId:   CONFIG.ELEVENLABS.VOICE_ID ? '✓ تنظیم شده' : '✗ تنظیم نشده',
      model:     CONFIG.ELEVENLABS.MODEL_ID,
    },
    claude: {
      connected: !!CONFIG.CLAUDE.API_KEY,
      model:     CONFIG.CLAUDE.MODEL,
    },
    supportedLangs: CONFIG.SUPPORTED_LANGS,
  };
}
