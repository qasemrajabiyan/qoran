/**
 * ============================================================
 * FILE: auto-translate.js
 * ROLE: موتور ترجمه خودکار AI — متن، پیام ادمین، محتوای صفحات
 * PROJECT: BarakatHub — پلتفرم رسانه‌ای کربلا
 * VERSION: 1.0.0
 * DEPENDS ON: i18n.js, lang-detect.js
 *
 * استراتژی:
 *   - کش محلی (localStorage) برای ترجمه‌های تکراری
 *   - Claude API برای همه زبان‌ها (بهترین کیفیت برای متون دینی)
 *   - Queue برای جلوگیری از درخواست‌های موازی زیاد
 *   - Retry خودکار در صورت خطا
 * ============================================================
 */

import { i18n } from './i18n.js';

/* ────────────────────────────────────────────────────────────
   1. TRANSLATION CACHE (با TTL)
   ──────────────────────────────────────────────────────────── */
const CACHE_KEY = 'mh_trans_cache';
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000;  /* ۷ روز */
const MAX_CACHE_SIZE = 500;                   /* حداکثر ۵۰۰ ترجمه در کش */

class TranslationCache {
  constructor() {
    this._data = this._load();
  }

  _load() {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return {};
      const data = JSON.parse(raw);
      /* پاک‌سازی منقضی‌شده‌ها */
      const now = Date.now();
      Object.keys(data).forEach(k => {
        if (data[k].ts && now - data[k].ts > CACHE_TTL) delete data[k];
      });
      return data;
    } catch { return {}; }
  }

  _save() {
    try {
      /* اگر کش خیلی بزرگ شد، قدیمی‌ترین‌ها را حذف کن */
      const keys = Object.keys(this._data);
      if (keys.length > MAX_CACHE_SIZE) {
        const sorted = keys.sort((a, b) => (this._data[a].ts ?? 0) - (this._data[b].ts ?? 0));
        sorted.slice(0, keys.length - MAX_CACHE_SIZE).forEach(k => delete this._data[k]);
      }
      localStorage.setItem(CACHE_KEY, JSON.stringify(this._data));
    } catch {}
  }

  _key(text, targetLang, context) {
    /* کلید کش: hash ساده از متن */
    const hash = Array.from(text.slice(0, 100))
      .reduce((acc, ch) => (acc * 31 + ch.charCodeAt(0)) & 0xffffffff, 0)
      .toString(36);
    return `${targetLang}:${context}:${hash}`;
  }

  get(text, targetLang, context = 'general') {
    const key   = this._key(text, targetLang, context);
    const entry = this._data[key];
    if (entry && Date.now() - entry.ts < CACHE_TTL) return entry.text;
    return null;
  }

  set(text, targetLang, translated, context = 'general') {
    const key = this._key(text, targetLang, context);
    this._data[key] = { text: translated, ts: Date.now() };
    this._save();
  }

  clear() {
    this._data = {};
    try { localStorage.removeItem(CACHE_KEY); } catch {}
  }
}

const _cache = new TranslationCache();

/* ────────────────────────────────────────────────────────────
   2. REQUEST QUEUE (جلوگیری از flood)
   ──────────────────────────────────────────────────────────── */
class RequestQueue {
  constructor(maxConcurrent = 3) {
    this._queue    = [];
    this._running  = 0;
    this._max      = maxConcurrent;
  }

  add(fn) {
    return new Promise((resolve, reject) => {
      this._queue.push({ fn, resolve, reject });
      this._run();
    });
  }

  async _run() {
    if (this._running >= this._max || !this._queue.length) return;
    this._running++;
    const { fn, resolve, reject } = this._queue.shift();
    try   { resolve(await fn()); }
    catch (e) { reject(e); }
    finally {
      this._running--;
      this._run();
    }
  }
}

const _queue = new RequestQueue(3);

/* ────────────────────────────────────────────────────────────
   3. SYSTEM PROMPTS برای هر نوع محتوا
   ──────────────────────────────────────────────────────────── */
const SYSTEM_PROMPTS = {
  /* محتوای عمومی سایت */
  general: (targetLang) => `You are an expert translator for a multilingual Islamic media platform based in Karbala, Iraq. Translate from Persian to ${targetLang}. Rules:
- Preserve Islamic terms (Allah, Imam Hussein, Quran, etc.) in their original form or widely accepted transliteration
- Use natural, fluent language appropriate for the target culture
- Maintain a respectful, spiritual tone
- Return ONLY the translated text, no explanations or quotes`,

  /* تدبرات قرآنی */
  quran: (targetLang) => `You are a scholar specializing in Islamic Quranic studies and translation. Translate this Quranic reflection/commentary from Persian to ${targetLang}. Rules:
- Use classical religious terminology appropriate for Quran commentary
- Preserve the spiritual depth and scholarly tone
- Keep Arabic terms for Quranic concepts when culturally appropriate
- For Urdu: use traditional Nastaliq vocabulary
- For Russian: use formal literary language
- Return ONLY the translated text`,

  /* پیام‌های ادمین */
  admin: (targetLang) => `You are translating an admin message for users of an Islamic platform. Translate from Persian to ${targetLang}. Rules:
- Maintain a warm, respectful Islamic tone
- Adapt cultural expressions naturally (not literally)
- Preserve honorifics and respectful address forms appropriate to the culture
- For Arabic: use formal Modern Standard Arabic (فصحى)
- For Urdu: use respectful Pakistani cultural expressions
- Return ONLY the translated text`,

  /* پیام تأیید سفارش */
  order: (targetLang) => `Translate this order confirmation message from Persian to ${targetLang} for an Islamic prayer service. Rules:
- Keep a warm, spiritual tone
- Properly translate the tracking code label but keep the code itself unchanged
- Use culturally appropriate farewell phrases (may Allah accept, etc.)
- Return ONLY the translated text`,

  /* دیدار با شیخ */
  meeting: (targetLang) => `Translate this message about meeting with an Islamic Sheikh in Karbala from Persian to ${targetLang}. Rules:
- Use respectful, formal language appropriate for religious context
- Adapt Islamic etiquette expressions culturally
- Return ONLY the translated text`,

  /* مشاوره */
  consultation: (targetLang) => `Translate this Islamic consultation response from Persian to ${targetLang}. Rules:
- Maintain scholarly yet accessible tone
- Use culturally appropriate Islamic expressions
- Return ONLY the translated text`,

  /* استخاره */
  istikhara: (targetLang) => `Translate this Istikhara (Islamic divination) response from Persian to ${targetLang}. Rules:
- Use traditional spiritual vocabulary
- Maintain a reverent, contemplative tone
- For Arabic: classical Islamic phrasing
- Return ONLY the translated text`,
};

/* ────────────────────────────────────────────────────────────
   4. LANGUAGE CODE → نام کامل (برای Claude API)
   ──────────────────────────────────────────────────────────── */
const LANG_NAMES = {
  ar: 'Arabic (Modern Standard Arabic - فصحى)',
  ur: 'Urdu (Pakistani standard, Nastaliq script)',
  az: 'Azerbaijani (Standard Azerbaijani, Latin script)',
  tr: 'Turkish (Standard Turkish)',
  ru: 'Russian (Literary Russian)',
  en: 'English (formal, respectful)',
  id: 'Bahasa Indonesia (formal, Islamic context)',
};

/* ────────────────────────────────────────────────────────────
   5. CORE TRANSLATE FUNCTION
   ──────────────────────────────────────────────────────────── */
export async function translateText(text, targetLang, context = 'general') {
  /* اگر زبان مبدأ = مقصد، ترجمه لازم نیست */
  if (!text?.trim()) return text;
  if (targetLang === 'fa') return text;
  if (!['ar', 'ur', 'az', 'tr', 'ru', 'en', 'id'].includes(targetLang)) return text;

  /* بررسی کش */
  const cached = _cache.get(text, targetLang, context);
  if (cached) return cached;

  /* ترجمه از طریق queue */
  return _queue.add(() => _doTranslate(text, targetLang, context));
}

async function _doTranslate(text, targetLang, context, retries = 2) {
  const systemPrompt = (SYSTEM_PROMPTS[context] ?? SYSTEM_PROMPTS.general)(LANG_NAMES[targetLang] ?? targetLang);

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model:      'claude-sonnet-4-20250514',
        max_tokens: 1500,
        system:     systemPrompt,
        messages: [{
          role:    'user',
          content: `Translate to ${LANG_NAMES[targetLang] ?? targetLang}:\n\n${text}`,
        }],
      }),
    });

    if (!response.ok) {
      throw new Error(`API ${response.status}`);
    }

    const data       = await response.json();
    const translated = data.content
      ?.filter(c => c.type === 'text')
      ?.map(c => c.text)
      ?.join('')
      ?.trim()
      ?? text;

    /* ذخیره در کش */
    _cache.set(text, targetLang, translated, context);
    return translated;

  } catch (err) {
    if (retries > 0) {
      /* صبر ۱ ثانیه و تلاش دوباره */
      await new Promise(r => setTimeout(r, 1000));
      return _doTranslate(text, targetLang, context, retries - 1);
    }
    console.warn('[AutoTranslate] Failed:', err.message);
    return text;  /* متن اصلی (فارسی) در صورت خطا */
  }
}

/* ────────────────────────────────────────────────────────────
   6. BATCH TRANSLATE (ترجمه چند متن با هم)
   ──────────────────────────────────────────────────────────── */
export async function translateBatch(items, targetLang, context = 'general') {
  /* items: آرایه‌ای از { key, text } */
  if (targetLang === 'fa') {
    return Object.fromEntries(items.map(({ key, text }) => [key, text]));
  }

  const results = await Promise.allSettled(
    items.map(({ text }) => translateText(text, targetLang, context))
  );

  return Object.fromEntries(
    items.map(({ key }, i) => [
      key,
      results[i].status === 'fulfilled' ? results[i].value : items[i].text
    ])
  );
}

/* ────────────────────────────────────────────────────────────
   7. DOM AUTO-TRANSLATOR
   متن‌های data-translate را خودکار ترجمه می‌کند
   ──────────────────────────────────────────────────────────── */
export class DOMTranslator {
  constructor(targetLang) {
    this._lang     = targetLang;
    this._observer = null;
  }

  /* ترجمه همه المان‌های data-translate در صفحه */
  async translatePage() {
    if (this._lang === 'fa') return;

    const elements = document.querySelectorAll('[data-translate]');
    const tasks    = [];

    elements.forEach(el => {
      const context  = el.dataset.translateContext ?? 'general';
      const original = el.dataset.translateOriginal ?? el.textContent.trim();

      if (!el.dataset.translateOriginal) {
        el.dataset.translateOriginal = original;
      }

      tasks.push(
        translateText(original, this._lang, context).then(translated => {
          el.textContent = translated;
        })
      );
    });

    await Promise.allSettled(tasks);
  }

  /* ترجمه پیام خاص ادمین با name placeholder */
  async translateAdminMessage(template, userName, options = {}) {
    const {
      prayerName  = '',
      trackingCode = '',
      date        = '',
      context     = 'admin',
    } = options;

    /* جایگزینی placeholder های فارسی قبل از ترجمه */
    let prepared = template
      .replace(/{نام}/g,         userName)
      .replace(/{دعا}/g,         prayerName)
      .replace(/{کد}/g,          trackingCode)
      .replace(/{تاریخ}/g,       date);

    if (this._lang === 'fa') return prepared;

    /* ترجمه */
    const translated = await translateText(prepared, this._lang, context);
    return translated;
  }

  /* شروع MutationObserver برای ترجمه خودکار المان‌های جدید */
  observe(targetNode = document.body) {
    if (this._lang === 'fa' || this._observer) return;

    this._observer = new MutationObserver((mutations) => {
      mutations.forEach(m => {
        m.addedNodes.forEach(node => {
          if (node.nodeType !== Node.ELEMENT_NODE) return;
          const els = [node, ...node.querySelectorAll('[data-translate]')]
            .filter(el => el.hasAttribute?.('data-translate'));
          els.forEach(async el => {
            const context  = el.dataset.translateContext ?? 'general';
            const original = el.dataset.translateOriginal ?? el.textContent.trim();
            if (!el.dataset.translateOriginal) el.dataset.translateOriginal = original;
            el.textContent = await translateText(original, this._lang, context);
          });
        });
      });
    });

    this._observer.observe(targetNode, { childList: true, subtree: true });
  }

  disconnect() {
    this._observer?.disconnect();
    this._observer = null;
  }
}

/* ────────────────────────────────────────────────────────────
   8. SMART MESSAGE BUILDER
   پیام‌های شخصی‌سازی‌شده با ترجمه خودکار
   ──────────────────────────────────────────────────────────── */
export class SmartMessage {

  /**
   * ساخت پیام تأیید سفارش دعا
   * @param {string} templateFa - متن فارسی (نوشته ادمین)
   * @param {object} vars - متغیرها
   * @param {string} targetLang - زبان مقصد
   */
  static async buildPrayerConfirmation(templateFa, vars, targetLang) {
    const {
      userName,
      prayerName,
      trackingCode,
      isDeceased = false,
      gender     = 'unknown',
    } = vars;

    /* پیشوند مرحوم/مرحومه برای متوفیان */
    let prefix = '';
    if (isDeceased) {
      const prefixes = {
        fa: gender === 'female' ? 'مرحومه ' : 'مرحوم ',
        ar: gender === 'female' ? 'المرحومة ' : 'المرحوم ',
        ur: gender === 'female' ? 'مرحومہ ' : 'مرحوم ',
        az: 'Mərhum ',
        tr: 'Merhum ',
        ru: gender === 'female' ? 'Покойная ' : 'Покойный ',
        en: 'Late ',
      };
      prefix = prefixes[targetLang] ?? prefixes['en'];
    }

    const fullName = `${prefix}${userName}`;

    /* جایگزینی placeholder */
    const prepared = templateFa
      .replace(/{نام}/g,    fullName)
      .replace(/{دعا}/g,    prayerName)
      .replace(/{کد}/g,     trackingCode);

    if (targetLang === 'fa') return prepared;
    return translateText(prepared, targetLang, 'order');
  }

  /**
   * ساخت پیام تکمیل دعا (وقتی ادمین «انجام شد» می‌زند)
   */
  static async buildPrayerDoneMessage(templateFa, vars, targetLang) {
    const { userName, prayerName, isDeceased, gender } = vars;

    let prefix = '';
    if (isDeceased) {
      const prefixes = {
        fa: gender === 'female' ? 'مرحومه ' : 'مرحوم ',
        ar: gender === 'female' ? 'المرحومة ' : 'المرحوم ',
        ur: gender === 'female' ? 'مرحومہ ' : 'مرحوم ',
        az: 'Mərhum ', tr: 'Merhum ',
        ru: gender === 'female' ? 'Покойная ' : 'Покойный ',
        en: 'Late ',
      };
      prefix = prefixes[targetLang] ?? prefixes['en'];
    }

    const prepared = templateFa
      .replace(/{نام}/g, `${prefix}${userName}`)
      .replace(/{دعا}/g, prayerName);

    if (targetLang === 'fa') return prepared;
    return translateText(prepared, targetLang, 'order');
  }

  /**
   * ساخت پیام دیدار با شیخ
   */
  static async buildMeetingMessage(templateFa, vars, targetLang) {
    const { userName, date, timeSlot } = vars;

    const prepared = templateFa
      .replace(/{نام}/g,    userName)
      .replace(/{تاریخ}/g,  date)
      .replace(/{ساعت}/g,   timeSlot);

    if (targetLang === 'fa') return prepared;
    return translateText(prepared, targetLang, 'meeting');
  }

  /**
   * ساخت پیام استخاره
   */
  static async buildIstikharaMessage(responseFa, targetLang) {
    if (targetLang === 'fa') return responseFa;
    return translateText(responseFa, targetLang, 'istikhara');
  }

  /**
   * ساخت پیام مشاوره
   */
  static async buildConsultationResponse(responseFa, targetLang) {
    if (targetLang === 'fa') return responseFa;
    return translateText(responseFa, targetLang, 'consultation');
  }
}

/* ────────────────────────────────────────────────────────────
   9. پاکسازی کش (برای debug)
   ──────────────────────────────────────────────────────────── */
export function clearTranslationCache() {
  _cache.clear();
  console.log('[AutoTranslate] Cache cleared');
}

export function getCacheStats() {
  try {
    const raw   = localStorage.getItem('mh_trans_cache');
    const data  = raw ? JSON.parse(raw) : {};
    const keys  = Object.keys(data);
    const byLang = {};
    keys.forEach(k => {
      const lang = k.split(':')[0];
      byLang[lang] = (byLang[lang] ?? 0) + 1;
    });
    return { total: keys.length, byLang };
  } catch { return { total: 0, byLang: {} }; }
}

/* ────────────────────────────────────────────────────────────
   10. SMART CONTENT TRANSLATOR
   ترجمه خودکار محتوای ادمین هنگام تغییر زبان
   ──────────────────────────────────────────────────────────── */

/**
 * ترجمه هوشمند — اگر ترجمه در آبجکت موجود بود برمی‌گرداند
 * اگر نبود از AI می‌گیرد و در آبجکت ذخیره می‌کند
 */
export async function smartTx(obj, lang, context = 'general') {
  if (!obj) return '';
  /* اگر ترجمه آماده هست */
  if (obj[lang]) return obj[lang];
  if (lang === 'fa') return obj.fa ?? obj.en ?? '';
  /* متن فارسی برای ترجمه */
  const sourceFa = obj.fa ?? obj.en ?? '';
  if (!sourceFa) return '';
  /* ترجمه با AI */
  try {
    const translated = await translateText(sourceFa, lang, context);
    /* ذخیره در آبجکت برای دفعه بعد */
    obj[lang] = translated;
    return translated;
  } catch {
    return sourceFa;
  }
}

/**
 * ترجمه همه المان‌های [data-fa-text] در صفحه
 * استفاده: <span data-fa-text="متن فارسی"></span>
 */
export async function translateDataAttributes(lang) {
  if (lang === 'fa') {
    /* برگرداندن به فارسی */
    document.querySelectorAll('[data-fa-text]').forEach(el => {
      el.textContent = el.dataset.faText;
    });
    return;
  }

  const elements = Array.from(document.querySelectorAll('[data-fa-text]'));
  if (!elements.length) return;

  /* batch ترجمه */
  const texts = elements.map(el => el.dataset.faText);
  const context = 'general';

  const results = await Promise.allSettled(
    texts.map(t => translateText(t, lang, context))
  );

  elements.forEach((el, i) => {
    if (results[i].status === 'fulfilled') {
      el.textContent = results[i].value;
    }
  });
}

/**
 * init — اجرا هنگام تغییر زبان
 */
export function initAutoPageTranslation(i18nInstance) {
  if (!i18nInstance) return;

  const _doTranslation = async () => {
    const lang = i18nInstance.lang;
    if (lang === 'fa') {
      /* برگرداندن به فارسی */
      document.querySelectorAll('[data-fa-text]').forEach(el => {
        el.textContent = el.dataset.faText;
      });
      return;
    }
    await translateDataAttributes(lang);
  };

  /* اجرا فوری */
  _doTranslation();

  /* اجرا هنگام تغییر زبان */
  i18nInstance.onChange(() => {
    setTimeout(_doTranslation, 50); /* کمی صبر تا DOM آپدیت شود */
  });
}
