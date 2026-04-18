/**
 * ============================================================
 * FILE: i18n.js  [نسخه ۲.۰ — جایگزین فایل قبلی]
 * ROLE: موتور چندزبانگی + تشخیص خودکار + تغییر فوری
 * PROJECT: BarakaHub — پلتفرم رسانه‌ای کربلا
 * VERSION: 2.0.0
 * REPLACES: i18n.js v1.0.0
 * ============================================================
 */

import { LangDetector }  from './lang-detect.js';
import { DOMTranslator } from './auto-translate.js';

export const LANG_CONFIG = {
  fa: { name:'فارسی',      nativeName:'فارسی',            dir:'rtl', locale:'fa-IR', font:'rtl',     dateLocale:'fa-IR', flag:'🇮🇷', numberSystem:'arabext' },
  ar: { name:'العربية',    nativeName:'العربية',           dir:'rtl', locale:'ar-SA', font:'rtl',     dateLocale:'ar-SA', flag:'🇸🇦', numberSystem:'arab'    },
  ur: { name:'اردو',       nativeName:'اردو',              dir:'rtl', locale:'ur-PK', font:'urdu',    dateLocale:'ur-PK', flag:'🇵🇰', numberSystem:'arabext' },
  az: { name:'Azərbaycan', nativeName:'Azərbaycan dili',   dir:'ltr', locale:'az-AZ', font:'ltr',     dateLocale:'az-AZ', flag:'🇦🇿', numberSystem:'latn'    },
  tr: { name:'Türkçe',     nativeName:'Türkçe',            dir:'ltr', locale:'tr-TR', font:'ltr',     dateLocale:'tr-TR', flag:'🇹🇷', numberSystem:'latn'    },
  ru: { name:'Русский',    nativeName:'Русский',           dir:'ltr', locale:'ru-RU', font:'cyrillic',dateLocale:'ru-RU', flag:'🇷🇺', numberSystem:'latn'    },
  en: { name:'English',    nativeName:'English',           dir:'ltr', locale:'en-US', font:'ltr',     dateLocale:'en-US', flag:'🇺🇸', numberSystem:'latn'    },
  id: { name:'Indonesia',  nativeName:'Bahasa Indonesia',  dir:'ltr', locale:'id-ID', font:'ltr',     dateLocale:'id-ID', flag:'🇮🇩', numberSystem:'latn'    },
};

export const TRANSLATIONS = {
  'nav.home':         { fa:'خانه',          ar:'الرئيسية',     ur:'ہوم',             az:'Ana səhifə',    tr:'Ana Sayfa',    ru:'Главная',    en:'Home',          id:'Beranda'            },
  'nav.news':         { fa:'اخبار',         ar:'الأخبار',      ur:'خبریں',           az:'Xəbərlər',     tr:'Haberler',     ru:'Новости',    en:'News',          id:'Berita'             },
  'nav.articles':     { fa:'مقالات',        ar:'المقالات',     ur:'مضامین',          az:'Məqalələr',    tr:'Makaleler',    ru:'Статьи',     en:'Articles',      id:'Artikel'            },
  'nav.categories':   { fa:'دسته‌بندی‌ها', ar:'التصنيفات',    ur:'زمرے',            az:'Kateqoriyalar',tr:'Kategoriler',  ru:'Категории',  en:'Categories',    id:'Kategori'           },
  'nav.search':       { fa:'جستجو',         ar:'بحث',          ur:'تلاش',            az:'Axtar',         tr:'Ara',          ru:'Поиск',      en:'Search',        id:'Cari'               },
  'nav.about':        { fa:'درباره ما',     ar:'من نحن',       ur:'ہمارے بارے میں', az:'Haqqımızda',   tr:'Hakkımızda',   ru:'О нас',      en:'About',         id:'Tentang Kami'       },
  'nav.contact':      { fa:'تماس با ما',    ar:'اتصل بنا',     ur:'رابطہ کریں',      az:'Əlaqə',         tr:'İletişim',     ru:'Контакты',   en:'Contact',       id:'Hubungi'            },
  'nav.quran':        { fa:'دانشگاه قرآن', ar:'جامعة القرآن', ur:'یونیورسٹی قرآن', az:'Quran Universiteti', tr:'Kuran Üniversitesi', ru:'Университет Корана', en:'Quran University', id:'Universitas Quran' },
  'nav.quran.full':   { fa:'دانشگاه قرآن (آموزش گام به گام تدبر و فهم قرآن)', ar:'جامعة القرآن (التعلم خطوة بخطوة في التدبر وفهم القرآن)', ur:'یونیورسٹی قرآن (قرآن فہمی کی مرحلہ وار تعلیم)', az:'Quran Universiteti (Quranı addım-addım dərk etmə)', tr:'Kuran Üniversitesi (Adım adım Kuran tefekkürü)', ru:'Университет Корана (Пошаговое осмысление и понимание Корана)', en:'Quran University (Step-by-step Quran reflection & understanding)', id:'Universitas Quran (Refleksi & pemahaman Quran langkah demi langkah)' },
  'nav.prayer':       { fa:'سفارش دعا',     ar:'طلب الدعاء',   ur:'دعا آرڈر',        az:'Dua sifarişi',  tr:'Dua Siparişi', ru:'Заказ дуа',  en:'Prayer Order',  id:'Pesan Doa'          },
  'nav.meeting':      { fa:'دیدار با شیخ',  ar:'لقاء الشيخ',   ur:'شیخ ملاقات',      az:'Şeyxlə görüş',  tr:'Şeyh Görüşü',  ru:'Встреча',    en:'Sheikh Visit',  id:'Kunjungi Syaikh'    },
  'btn.readMore':     { fa:'ادامه مطلب',    ar:'اقرأ المزيد',  ur:'مزید پڑھیں',      az:'Daha çox',      tr:'Devamını Oku', ru:'Далее',      en:'Read More',     id:'Baca Selengkapnya'  },
  'btn.subscribe':    { fa:'عضویت',         ar:'اشترك',        ur:'سبسکرائب',        az:'Abunə ol',      tr:'Abone Ol',     ru:'Подписаться',en:'Subscribe',     id:'Berlangganan'       },
  'btn.share':        { fa:'اشتراک‌گذاری', ar:'مشاركة',       ur:'شیئر',             az:'Paylaş',        tr:'Paylaş',       ru:'Поделиться', en:'Share',         id:'Bagikan'            },
  'btn.save':         { fa:'ذخیره',         ar:'حفظ',          ur:'محفوظ',            az:'Saxla',         tr:'Kaydet',       ru:'Сохранить',  en:'Save',          id:'Simpan'             },
  'btn.login':        { fa:'ورود',          ar:'تسجيل الدخول', ur:'لاگ ان',          az:'Daxil ol',      tr:'Giriş',        ru:'Войти',      en:'Login',         id:'Masuk'              },
  'btn.register':     { fa:'ثبت‌نام',       ar:'تسجيل',        ur:'رجسٹر',           az:'Qeydiyyat',     tr:'Kayıt Ol',     ru:'Регистрация',en:'Register',      id:'Daftar'             },
  'btn.cancel':       { fa:'انصراف',        ar:'إلغاء',        ur:'منسوخ',           az:'Ləğv et',       tr:'İptal',        ru:'Отмена',     en:'Cancel',        id:'Batal'              },
  'btn.submit':       { fa:'ارسال',         ar:'إرسال',        ur:'جمع کروائیں',      az:'Göndər',        tr:'Gönder',       ru:'Отправить',  en:'Submit',        id:'Kirim'              },
  'article.readTime': { fa:'دقیقه مطالعه', ar:'دقائق قراءة',  ur:'منٹ پڑھنا',       az:'dəq oxuma',     tr:'dk okuma',     ru:'мин. чтения',en:'min read',      id:'menit baca'         },
  'article.author':   { fa:'نویسنده',       ar:'الكاتب',       ur:'مصنف',            az:'Müəllif',       tr:'Yazar',        ru:'Автор',      en:'Author',        id:'Penulis'            },
  'article.views':    { fa:'بازدید',        ar:'مشاهدات',      ur:'ملاحظات',         az:'Görünüş',       tr:'Görüntülenme', ru:'Просмотры',  en:'Views',         id:'Tampilan'           },
  'article.comments': { fa:'نظرات',         ar:'التعليقات',    ur:'تبصرے',           az:'Şərhlər',       tr:'Yorumlar',     ru:'Комментарии',en:'Comments',      id:'Komentar'           },
  'search.placeholder':{ fa:'جستجو کنید...',ar:'ابحث...',      ur:'تلاش کریں...',    az:'Axtar...',      tr:'Ara...',       ru:'Поиск...',   en:'Search...',     id:'Cari...'            },
  'search.noResults': { fa:'نتیجه‌ای یافت نشد',ar:'لم تتم العثور على نتائج',ur:'کوئی نتیجہ نہیں',az:'Nəticə tapılmadı',tr:'Sonuç bulunamadı',ru:'Нет результатов',en:'No results found', id:'Tidak ada hasil' },
  'theme.dark':       { fa:'تیره',          ar:'داكن',         ur:'تاریک',           az:'Tünd',          tr:'Koyu',         ru:'Тёмная',     en:'Dark',          id:'Gelap'              },
  'theme.light':      { fa:'روشن',          ar:'فاتح',         ur:'روشن',            az:'Açıq',          tr:'Açık',         ru:'Светлая',    en:'Light',         id:'Terang'             },
  'footer.copyright': { fa:'تمامی حقوق محفوظ است',ar:'جميع الحقوق محفوظة',ur:'تمام حقوق محفوظ ہیں',az:'Bütün hüquqlar qorunur',tr:'Tüm hakları saklıdır',ru:'Все права защищены',en:'All rights reserved', id:'Semua hak dilindungi' },
  'error.404':        { fa:'صفحه یافت نشد', ar:'الصفحة غير موجودة',ur:'صفحہ نہیں ملا',az:'Səhifə tapılmadı',tr:'Sayfa Bulunamadı',ru:'Страница не найдена',en:'Page Not Found', id:'Halaman Tidak Ditemukan' },
  'error.generic':    { fa:'خطایی رخ داده', ar:'حدث خطأ',      ur:'خرابی ہوئی',      az:'Xəta baş verdi',tr:'Bir hata oluştu',ru:'Произошла ошибка',en:'An error occurred', id:'Terjadi kesalahan' },
};

export class I18n {
  constructor() {
    this._lang        = 'fa';
    this._config      = LANG_CONFIG;
    this._trans       = TRANSLATIONS;
    this._listeners   = [];
    this._domTrans    = null;
    this._initialized = false;
  }

  get lang()      { return this._lang; }
  get config()    { return this._config[this._lang]; }
  get isRTL()     { return this.config.dir === 'rtl'; }
  get dir()       { return this.config.dir; }
  get languages() { return Object.entries(this._config).map(([code, cfg]) => ({ code, ...cfg })); }
  get translator(){ return this._domTrans; }

  async init() {
    if (this._initialized) return this;
    try {
      const detected = await LangDetector.detect();
      this._lang     = detected;
      this._applyToDOM();
      this._domTrans = new DOMTranslator(this._lang);
      if (this._lang !== 'fa') {
        this._domTrans.observe();
        await this._domTrans.translatePage();
      }
    } catch (err) {
      console.warn('[i18n] Init fallback:', err);
      this._lang = 'fa';
      this._applyToDOM();
    }
    this._initialized = true;
    return this;
  }

  t(key, vars = {}) {
    const entry = this._trans[key];
    if (!entry) { console.warn(`[i18n] Missing key: "${key}"`); return key; }
    let text = entry[this._lang] ?? entry['en'] ?? key;
    Object.entries(vars).forEach(([k, v]) => { text = text.replaceAll(`{${k}}`, v); });
    return text;
  }

  async setLang(langCode) {
    if (!this._config[langCode]) return false;
    const prev = this._lang;
    this._lang = langCode;
    LangDetector.setManual(langCode);
    this._applyToDOM();

    this._domTrans?.disconnect();
    this._domTrans = new DOMTranslator(langCode);

    /* ریست متن‌های قبلی */
    document.querySelectorAll('[data-translate-original]').forEach(el => {
      el.textContent = el.dataset.translateOriginal;
    });

    if (langCode !== 'fa') {
      this._domTrans.observe();
      await this._domTrans.translatePage();
    }

    this._listeners.forEach(fn => fn(langCode, prev));
    document.dispatchEvent(new CustomEvent('langchange', {
      detail: { lang: langCode, prev, dir: this.config.dir }
    }));
    return true;
  }

  formatDate(date, options = {}) {
    const d   = date instanceof Date ? date : new Date(date);
    const def = { year:'numeric', month:'long', day:'numeric', ...options };
    try { return new Intl.DateTimeFormat(this.config.dateLocale, def).format(d); }
    catch { return d.toLocaleDateString(); }
  }

  formatNumber(num, options = {}) {
    try { return new Intl.NumberFormat(this.config.locale, options).format(num); }
    catch { return String(num); }
  }

  formatRelativeTime(date) {
    const d = date instanceof Date ? date : new Date(date);
    const diff = Date.now() - d.getTime();
    const s = Math.floor(diff/1000), m = Math.floor(s/60), h = Math.floor(m/60), days = Math.floor(h/24), mo = Math.floor(days/30), yr = Math.floor(days/365);
    try {
      const rtf = new Intl.RelativeTimeFormat(this.config.locale, { numeric:'auto' });
      if (yr > 0)   return rtf.format(-yr,   'year');
      if (mo > 0)   return rtf.format(-mo,   'month');
      if (days > 0) return rtf.format(-days, 'day');
      if (h > 0)    return rtf.format(-h,    'hour');
      if (m > 0)    return rtf.format(-m,    'minute');
      return rtf.format(-s, 'second');
    } catch { return d.toLocaleDateString(); }
  }

  _applyToDOM() {
    if (!document) return;
    const cfg = this._config[this._lang];
    document.documentElement.lang = this._lang;
    document.documentElement.dir  = cfg.dir;
    document.body.dataset.lang    = this._lang;
    document.body.dataset.dir     = cfg.dir;
    document.body.dataset.font    = cfg.font;
    document.querySelector('meta[property="og:locale"]')?.setAttribute('content', cfg.locale.replace('-','_'));
  }

  onChange(fn) {
    this._listeners.push(fn);
    return () => { this._listeners = this._listeners.filter(f => f !== fn); };
  }
}

export const i18n       = new I18n();
export const t          = (key, vars) => i18n.t(key, vars);
export const setLang    = (code)      => i18n.setLang(code);
export const formatDate = (d, opts)   => i18n.formatDate(d, opts);
export const formatNum  = (n, opts)   => i18n.formatNumber(n, opts);
export const timeAgo    = (d)         => i18n.formatRelativeTime(d);
export const initI18n   = ()          => i18n.init();

/* ────────────────────────────────────────────────────────────
   تابع مرکزی تشخیص ارز کاربر
   اولویت: ۱) کش IP  ۲) زبان دستی  ۳) زبان فعلی
   همه فایل‌ها باید از این تابع import کنند
   ──────────────────────────────────────────────────────────── */
const _CURRENCY_BY_LANG = {
  fa:'IRR', ar:'IQD', ur:'PKR', az:'AZN', tr:'TRY', ru:'RUB', en:'USD', id:'IDR',
};
const _CURRENCY_BY_COUNTRY = {
  IR:'IRR', IQ:'IQD', SA:'SAR', AE:'AED', KW:'KWD', BH:'BHD', QA:'QAR', OM:'OMR',
  JO:'JOD', LB:'LBP', SY:'SYP', EG:'EGP', LY:'LYD', DZ:'DZD', MA:'MAD', TN:'TND',
  PK:'PKR', IN:'INR', BD:'BDT', AF:'AFN', NP:'NPR',
  AZ:'AZN', TR:'TRY', RU:'RUB', UA:'UAH', KZ:'KZT', UZ:'UZS',
  ID:'IDR', MY:'MYR', SG:'SGD', PH:'PHP', TH:'THB', VN:'VND',
  US:'USD', CA:'CAD', AU:'AUD', NZ:'NZD',
  GB:'GBP', FR:'EUR', DE:'EUR', IT:'EUR', ES:'EUR', NL:'EUR', BE:'EUR',
  AT:'EUR', PT:'EUR', CH:'CHF', SE:'SEK', NO:'NOK', DK:'DKK', PL:'PLN',
  CN:'CNY', JP:'JPY', KR:'KRW',
  BR:'BRL', MX:'MXN', ZA:'ZAR', NG:'NGN', KE:'KES',
};
const _CURRENCY_SYMBOLS = {
  IRR:'تومان', IQD:'IQD', PKR:'PKR', AZN:'₼', TRY:'₺', RUB:'₽',
  USD:'$', IDR:'IDR', SAR:'﷼', AED:'AED', KWD:'KWD', EUR:'€',
  GBP:'£', CAD:'CA$', AUD:'A$', JPY:'¥', CNY:'¥',
};

export function getUserCurrency() {
  /* ۱) کش IP — دقیق‌ترین */
  try {
    const c = JSON.parse(localStorage.getItem('mh_user_country_currency') || 'null');
    if (c?.currency && Date.now() - c.ts < 24 * 60 * 60 * 1000) {
      return { k: c.currency, s: _CURRENCY_SYMBOLS[c.currency] ?? c.currency, country: c.country ?? '' };
    }
  } catch {}

  /* ۲) زبان دستی کاربر */
  const manualLang = localStorage.getItem('mh_lang_manual');
  if (manualLang && _CURRENCY_BY_LANG[manualLang]) {
    const k = _CURRENCY_BY_LANG[manualLang];
    return { k, s: _CURRENCY_SYMBOLS[k] ?? k, country: '' };
  }

  /* ۳) زبان فعلی — fallback */
  const k = _CURRENCY_BY_LANG[i18n.lang] ?? 'USD';
  return { k, s: _CURRENCY_SYMBOLS[k] ?? k, country: '' };
}

/* فراخوانی async برای بروزرسانی کش IP در پس‌زمینه */
export async function refreshIPCurrency() {
  try {
    const cacheKey = 'mh_user_country_currency';
    const cached   = JSON.parse(localStorage.getItem(cacheKey) || 'null');
    if (cached && Date.now() - cached.ts < 24 * 60 * 60 * 1000) return;
    const res  = await fetch('https://ipapi.co/json/');
    const data = await res.json();
    const cur  = _CURRENCY_BY_COUNTRY[data?.country_code];
    if (cur) {
      localStorage.setItem(cacheKey, JSON.stringify({
        currency: cur, country: data.country_code, ts: Date.now(),
      }));
    }
  } catch {}
}
