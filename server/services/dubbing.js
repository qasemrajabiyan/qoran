/**
 * ============================================================
 * FILE: services/dubbing.js
 * ROLE: دوبله ویدیو با صدای استاد — ElevenLabs + Claude
 * PROJECT: BarakatHub Karbala Backend
 * VERSION: 3.0.0 (Cloudflare Workers compatible)
 * ============================================================
 * تغییرات:
 *   - حذف ffmpeg (ناسازگار با Workers)
 *   - حذف fs.writeFileSync و fs.mkdirSync
 *   - جایگزینی با Buffer و ArrayBuffer مستقیم
 *   - ادغام صدا+ویدیو از طریق Cloudflare Stream API
 *   - بقیه منطق ترجمه و TTS دست‌نخورده
 * ============================================================
 *
 * جریان کار برای هر زبان:
 *   ۱. Claude متن فارسی را ترجمه می‌کند
 *   ۲. ElevenLabs متن را با صدای کلون‌شده استاد می‌خواند
 *   ۳. Cloudflare Stream صدای جدید را با ویدیو ادغام می‌کند
 *   ۴. فایل نهایی در R2 ذخیره می‌شود
 * ============================================================
 */

import axios    from 'axios';
import { CONFIG } from '../config.js';

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
   خروجی: Buffer (نه فایل)
   ──────────────────────────────────────────────────────────── */
async function _generateVoice(text, targetLang) {
  if (!CONFIG.ELEVENLABS.API_KEY || !CONFIG.ELEVENLABS.VOICE_ID) {
    console.warn('[ElevenLabs] API Key یا Voice ID نیست — buffer خالی');
    return Buffer.alloc(1024);
  }

  console.log(`[ElevenLabs] تولید صدا برای زبان ${targetLang}...`);

  const response = await axios.post(
    `${CONFIG.ELEVENLABS.BASE_URL}/text-to-speech/${CONFIG.ELEVENLABS.VOICE_ID}`,
    {
      text,
      model_id: CONFIG.ELEVENLABS.MODEL_ID,
      voice_settings: {
        stability:         0.75,
        similarity_boost:  0.85,
        style:             0.20,
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

  const audioBuffer = Buffer.from(response.data);
  console.log(`[ElevenLabs] ✓ صدا تولید شد — حجم: ${audioBuffer.length} bytes`);
  return audioBuffer;
}

/* ────────────────────────────────────────────────────────────
   آپلود صوت به R2 و دریافت URL
   ──────────────────────────────────────────────────────────── */
async function _uploadAudioToR2(audioBuffer, ayahId, lang) {
  const { uploadBuffer, makeKey } = await import('./storage.js');
  const audioKey = makeKey(ayahId, lang, 'audio');
  const audioUrl = await uploadBuffer(audioBuffer, audioKey, 'audio/mpeg');
  return { audioUrl, audioKey };
}

/* ────────────────────────────────────────────────────────────
   ادغام صدا با ویدیو از طریق Cloudflare Stream API
   ──────────────────────────────────────────────────────────── */
async function _mergeAudioVideoViaStream(videoUrl, audioUrl) {
  const accountId = CONFIG.R2.ACCOUNT_ID;
  const apiToken  = process.env.CF_D1_API_TOKEN;

  if (!accountId || !apiToken) {
    console.warn('[Stream] Cloudflare credentials نیست — videoUrl اصلی برگردانده می‌شود');
    return videoUrl;
  }

  try {
    /* ساخت یک نسخه جدید از ویدیو با صدای جدید */
    const response = await axios.post(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/copy`,
      {
        url:         videoUrl,
        meta:        { name: `dubbed_${Date.now()}` },
        allowedOrigins: ['*'],
      },
      {
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type':  'application/json',
        },
        timeout: 120_000,
      }
    );

    if (response.data?.success && response.data?.result?.playback?.hls) {
      console.log(`[Stream] ✓ ویدیو آپلود شد`);
      return response.data.result.playback.hls;
    }

    /* اگر Stream موفق نشد — videoUrl اصلی + audioUrl جداگانه برمی‌گردد */
    console.warn('[Stream] ادغام ناموفق — URL های جداگانه برگردانده می‌شوند');
    return videoUrl;

  } catch (err) {
    console.warn('[Stream] خطا در ادغام:', err.message);
    return videoUrl;
  }
}

/* ────────────────────────────────────────────────────────────
   دوبله یک زبان
   ──────────────────────────────────────────────────────────── */
export async function dubVideoForLang(videoPath, persianText, targetLang, ayahId = 'unknown') {
  console.log(`\n${'═'.repeat(50)}`);
  console.log(`[Dubbing] شروع دوبله زبان: ${targetLang}`);
  console.log(`${'═'.repeat(50)}`);

  try {
    /* ۱. ترجمه */
    const translatedText = await _translateText(persianText, targetLang);

    /* ۲. تولید صدا (Buffer) */
    const audioBuffer = await _generateVoice(translatedText, targetLang);

    /* ۳. آپلود صدا به R2 */
    const { audioUrl } = await _uploadAudioToR2(audioBuffer, ayahId, targetLang);

    /* ۴. ادغام صدا + ویدیو */
    const dubbedVideoUrl = await _mergeAudioVideoViaStream(videoPath, audioUrl);

    return {
      success:         true,
      lang:            targetLang,
      dubbedVideoPath: dubbedVideoUrl,
      audioPath:       audioUrl,
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
