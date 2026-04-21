/**
 * ============================================================
 * FILE: lang-detect.js
 * ROLE: تشخیص خودکار زبان — IP + مرورگر + ذخیره‌سازی
 * PROJECT: BarakatHub — پلتفرم رسانه‌ای کربلا
 * VERSION: 1.0.0
 *
 * الگوریتم اولویت‌بندی (از بالا به پایین):
 *   1. انتخاب دستی کاربر (localStorage)
 *   2. پارامتر URL (?lang=fa)
 *   3. IP Geolocation (کشور کاربر)
 *   4. زبان مرورگر/سیستم‌عامل
 *   5. فارسی (پیش‌فرض)
 *
 * USAGE:
 *   import { LangDetector } from './lang-detect.js';
 *   const lang = await LangDetector.detect();
 *
 * ============================================================
 */

/* ────────────────────────────────────────────────────────────
   1. نقشه کشور → زبان
   ──────────────────────────────────────────────────────────── */
const COUNTRY_LANG_MAP = {
  /* فارسی */
  IR: 'fa',   /* ایران */
  AF: 'fa',   /* افغانستان */
  TJ: 'fa',   /* تاجیکستان */

  /* عربی */
  IQ: 'ar',   /* عراق */
  SA: 'ar',   /* عربستان */
  AE: 'ar',   /* امارات */
  KW: 'ar',   /* کویت */
  BH: 'ar',   /* بحرین */
  QA: 'ar',   /* قطر */
  OM: 'ar',   /* عمان */
  YE: 'ar',   /* یمن */
  JO: 'ar',   /* اردن */
  LB: 'ar',   /* لبنان */
  SY: 'ar',   /* سوریه */
  EG: 'ar',   /* مصر */
  LY: 'ar',   /* لیبی */
  TN: 'ar',   /* تونس */
  DZ: 'ar',   /* الجزایر */
  MA: 'ar',   /* مراکش */
  SD: 'ar',   /* سودان */
  SO: 'ar',   /* سومالی */
  MR: 'ar',   /* موریتانی */

  /* اردو */
  ID: 'id',   /* اندونزی */
  MY: 'ms',   /* مالزی */
  PK: 'ur',   /* پاکستان */

  /* آذری */
  AZ: 'az',   /* آذربایجان */

  /* ترکی */
  TR: 'tr',   /* ترکیه */

  /* روسی */
  RU: 'ru',   /* روسیه */
  BY: 'ru',   /* بلاروس */
  KZ: 'ru',   /* قزاقستان */
  KG: 'ru',   /* قرقیزستان */
  UZ: 'ru',   /* ازبکستان */
  TM: 'ru',   /* ترکمنستان */
  UA: 'ru',   /* اوکراین */
  MD: 'ru',   /* مولداوی */
  GE: 'ru',   /* گرجستان */
  AM: 'ru',   /* ارمنستان */
};

/* ────────────────────────────────────────────────────────────
   2. نقشه زبان مرورگر → کد زبان ما
   ──────────────────────────────────────────────────────────── */
const BROWSER_LANG_MAP = {
  'fa':    'fa',
  'fa-IR': 'fa',
  'fa-AF': 'fa',
  'ar':    'ar',
  'ar-IQ': 'ar',
  'ar-SA': 'ar',
  'ar-AE': 'ar',
  'ur':    'ur',
  'ur-PK': 'ur',
  'az':    'az',
  'az-AZ': 'az',
  'tr':    'tr',
  'tr-TR': 'tr',
  'ru':    'ru',
  'ru-RU': 'ru',
  'en':    'en',
  'en-US': 'en',
  'en-GB': 'en',
  'id':    'id',
  'id-ID': 'id',
};

/* زبان‌های پشتیبانی‌شده */
const SUPPORTED_LANGS = ['fa', 'ar', 'ur', 'az', 'tr', 'ru', 'en', 'id'];
const DEFAULT_LANG    = 'fa';
const STORAGE_KEY     = 'mh_lang_manual';      /* انتخاب دستی کاربر */
const CACHE_KEY       = 'mh_lang_ip_cache';    /* کش IP */
const CACHE_TTL       = 0;  /* کش غیرفعال — هر بار از IP تازه می‌گیره */

/* ────────────────────────────────────────────────────────────
   3. LANG DETECTOR CLASS
   ──────────────────────────────────────────────────────────── */
export class LangDetector {

  /* ── تشخیص نهایی (اصلی) ── */
  static async detect() {
    /* ۱. انتخاب دستی کاربر — بالاترین اولویت */
    const manual = this._getManual();
    if (manual) return manual;

    /* ۲. پارامتر URL */
    const urlLang = this._fromURL();
    if (urlLang) return urlLang;

    /* ۳. IP Geolocation */
    try {
      const ipLang = await this._fromIP();
      if (ipLang) return ipLang;
    } catch { /* اگر API در دسترس نبود، ادامه */ }

    /* ۴. زبان مرورگر */
    const browserLang = this._fromBrowser();
    if (browserLang) return browserLang;

    /* ۵. پیش‌فرض */
    return DEFAULT_LANG;
  }

  /* ── انتخاب دستی ── */
  static _getManual() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && SUPPORTED_LANGS.includes(stored)) return stored;
    } catch {}
    return null;
  }

  static setManual(lang) {
    if (!SUPPORTED_LANGS.includes(lang)) return false;
    try {
      localStorage.setItem(STORAGE_KEY, lang);
      return true;
    } catch { return false; }
  }

  static clearManual() {
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  }

  /* ── از URL ── */
  static _fromURL() {
    try {
      const params = new URLSearchParams(window.location.search);
      const lang   = params.get('lang');
      if (lang && SUPPORTED_LANGS.includes(lang)) return lang;
    } catch {}
    return null;
  }

  /* ── از IP (با کش ۲۴ ساعته) ── */
  static async _fromIP() {
    /* بررسی کش */
    try {
      const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
      if (cached && Date.now() - cached.ts < CACHE_TTL) {
        return cached.lang;
      }
    } catch {}

    /* API های مختلف به ترتیب اولویت */
    const apis = [
      () => this._fetchIPAPI(),
      () => this._fetchIPWho(),
      () => this._fetchIPInfo(),
    ];

    for (const apiFn of apis) {
      try {
        const countryCode = await apiFn();
        if (countryCode) {
          const lang = COUNTRY_LANG_MAP[countryCode] ?? DEFAULT_LANG;
          /* ذخیره در کش */
          try {
            localStorage.setItem(CACHE_KEY, JSON.stringify({
              lang, countryCode, ts: Date.now()
            }));
          } catch {}
          return lang;
        }
      } catch { continue; }
    }
    return null;
  }

  /* ipapi.co — رایگان، بدون کلید، ۳۰۰۰ req/day */
  static async _fetchIPAPI() {
    const res  = await fetch('https://ipapi.co/json/', {
      signal: AbortSignal.timeout(3000)
    });
    const data = await res.json();
    return data.country_code ?? null;
  }

  /* ipwho.is — رایگان، بدون کلید */
  static async _fetchIPWho() {
    const res  = await fetch('https://ipwho.is/', {
      signal: AbortSignal.timeout(3000)
    });
    const data = await res.json();
    return data.country_code ?? null;
  }

  /* ipinfo.io — رایگان ۵۰k/month */
  static async _fetchIPInfo() {
    const res  = await fetch('https://ipinfo.io/json', {
      signal: AbortSignal.timeout(3000)
    });
    const data = await res.json();
    return data.country ?? null;
  }

  /* ── از مرورگر ── */
  static _fromBrowser() {
    const langs = [
      navigator.language,
      ...(navigator.languages ?? []),
    ].filter(Boolean);

    for (const lang of langs) {
      /* مطابقت کامل */
      if (BROWSER_LANG_MAP[lang]) return BROWSER_LANG_MAP[lang];
      /* مطابقت جزئی (فقط کد دوحرفی) */
      const short = lang.split('-')[0].toLowerCase();
      if (BROWSER_LANG_MAP[short]) return BROWSER_LANG_MAP[short];
    }
    return null;
  }

  /* ── کشور فعلی از کش ── */
  static getCachedCountry() {
    try {
      const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
      return cached?.countryCode ?? null;
    } catch { return null; }
  }

  /* ── اطلاعات debug ── */
  static getDebugInfo() {
    return {
      manual:      this._getManual(),
      url:         this._fromURL(),
      browser:     this._fromBrowser(),
      ipCache:     (() => {
        try { return JSON.parse(localStorage.getItem(CACHE_KEY) || 'null'); } catch { return null; }
      })(),
      supported:   SUPPORTED_LANGS,
    };
  }
}
