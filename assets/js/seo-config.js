/**
 * ============================================================
 * FILE: seo-config.js
 * ROLE: پیکربندی مرکزی سئوی چندزبانه — برکت هاب
 * VERSION: 2026.1.0
 * ============================================================
 * برای تغییر دامنه فقط DOMAIN را عوض کنید
 * ============================================================
 */

/* ── دامنه اصلی ─────────────────────────────────────────────── */
export const DOMAIN = 'https://barakahub.com';

/* ── تعریف کامل ۸ زبان ──────────────────────────────────────── */
export const LANGUAGES = {
  fa: {
    code:       'fa',
    hreflang:   'fa',
    locale:     'fa_IR',
    dir:        'rtl',
    font:       'Vazirmatn',
    dateLocale: 'fa-IR',
    flag:       '🇮🇷',
    nativeName: 'فارسی',
    englishName:'Persian',
    urlPrefix:  '/fa',
    ogLocale:   'fa_IR',
    bing:       'fa',
    googleBot:  'fa',
  },
  ar: {
    code:       'ar',
    hreflang:   'ar',
    locale:     'ar_IQ',
    dir:        'rtl',
    font:       'Noto Naskh Arabic',
    dateLocale: 'ar-IQ',
    flag:       '🇸🇦',
    nativeName: 'العربية',
    englishName:'Arabic',
    urlPrefix:  '/ar',
    ogLocale:   'ar_IQ',
    bing:       'ar',
    googleBot:  'ar',
  },
  ur: {
    code:       'ur',
    hreflang:   'ur',
    locale:     'ur_PK',
    dir:        'rtl',
    font:       'Gulzar',
    dateLocale: 'ur-PK',
    flag:       '🇵🇰',
    nativeName: 'اردو',
    englishName:'Urdu',
    urlPrefix:  '/ur',
    ogLocale:   'ur_PK',
    bing:       'ur',
    googleBot:  'ur',
  },
  en: {
    code:       'en',
    hreflang:   'en',
    locale:     'en_US',
    dir:        'ltr',
    font:       'DM Sans',
    dateLocale: 'en-US',
    flag:       '🇺🇸',
    nativeName: 'English',
    englishName:'English',
    urlPrefix:  '/en',
    ogLocale:   'en_US',
    bing:       'en',
    googleBot:  'en',
  },
  tr: {
    code:       'tr',
    hreflang:   'tr',
    locale:     'tr_TR',
    dir:        'ltr',
    font:       'DM Sans',
    dateLocale: 'tr-TR',
    flag:       '🇹🇷',
    nativeName: 'Türkçe',
    englishName:'Turkish',
    urlPrefix:  '/tr',
    ogLocale:   'tr_TR',
    bing:       'tr',
    googleBot:  'tr',
  },
  ru: {
    code:       'ru',
    hreflang:   'ru',
    locale:     'ru_RU',
    dir:        'ltr',
    font:       'DM Sans',
    dateLocale: 'ru-RU',
    flag:       '🇷🇺',
    nativeName: 'Русский',
    englishName:'Russian',
    urlPrefix:  '/ru',
    ogLocale:   'ru_RU',
    bing:       'ru',
    googleBot:  'ru',
  },
  az: {
    code:       'az',
    hreflang:   'az',
    locale:     'az_AZ',
    dir:        'ltr',
    font:       'DM Sans',
    dateLocale: 'az-AZ',
    flag:       '🇦🇿',
    nativeName: 'Azərbaycan',
    englishName:'Azerbaijani',
    urlPrefix:  '/az',
    ogLocale:   'az_AZ',
    bing:       'az',
    googleBot:  'az',
  },
  id: {
    code:       'id',
    hreflang:   'id',
    locale:     'id_ID',
    dir:        'ltr',
    font:       'DM Sans',
    dateLocale: 'id-ID',
    flag:       '🇮🇩',
    nativeName: 'Bahasa Indonesia',
    englishName:'Indonesian',
    urlPrefix:  '/id',
    ogLocale:   'id_ID',
    bing:       'id',
    googleBot:  'id',
  },
};

/* ── نام پلتفرم به هر زبان ───────────────────────────────────── */
export const PLATFORM_NAMES = {
  fa: 'برکت هاب',
  ar: 'بركت هاب',
  ur: 'برکت ہب',
  en: 'Baraka Hub',
  tr: 'Baraka Hub',
  ru: 'Baraka Hub',
  az: 'Baraka Hub',
  id: 'Baraka Hub',
};

/* ── توضیف پلتفرم به هر زبان ────────────────────────────────── */
export const PLATFORM_DESCRIPTIONS = {
  fa: 'پلتفرم رسانه‌ای اسلامی کربلا — تدبر قرآن، سفارش دعا، مشاوره دینی و ارتباط با حرم امام حسین علیه‌السلام',
  ar: 'منصة إعلامية إسلامية من كربلاء — تدبر القرآن وطلب الدعاء والاستشارة الدينية والتواصل مع حرم الإمام الحسين',
  ur: 'کربلا کا اسلامی میڈیا پلیٹ فارم — قرآن تدبر، دعا کا آرڈر، دینی مشاورہ اور امام حسین کے حرم سے رابطہ',
  en: 'Islamic Media Platform from Karbala — Quran Reflection, Prayer Orders, Religious Consultation & Connection with Imam Hussein Holy Shrine',
  tr: 'Kerbela\'dan İslami Medya Platformu — Kuran Tefekkürü, Dua Siparişi, Dini Danışmanlık ve İmam Hüseyin Türbesi ile Bağlantı',
  ru: 'Исламская медиаплатформа из Кербелы — Размышления о Коране, Заказ молитв, Религиозные консультации и Связь со святыней Имама Хусейна',
  az: 'Kərbaladan İslam Media Platforması — Quran Tədəbbürü, Dua Sifarişi, Dini Məsləhət və İmam Hüseyn Hərəmi ilə Əlaqə',
  id: 'Platform Media Islam dari Karbala — Tadabur Quran, Pesan Doa, Konsultasi Agama dan Hubungan dengan Makam Imam Hussein',
};

/* ── صفحات اصلی با slug هر زبان ─────────────────────────────── */
export const PAGES = {
  home: {
    path: '/',
    slugs: { fa:'', ar:'', ur:'', en:'', tr:'', ru:'', az:'', id:'' },
    titles: {
      fa: 'برکت هاب | پلتفرم رسانه‌ای اسلامی کربلا',
      ar: 'بركت هاب | منصة إعلامية إسلامية من كربلاء',
      ur: 'برکت ہب | کربلا کا اسلامی میڈیا پلیٹ فارم',
      en: 'Baraka Hub | Islamic Media Platform from Karbala',
      tr: 'Baraka Hub | Kerbela\'dan İslami Medya Platformu',
      ru: 'Baraka Hub | Исламская медиаплатформа из Кербелы',
      az: 'Baraka Hub | Kərbaladan İslam Media Platforması',
      id: 'Baraka Hub | Platform Media Islam dari Karbala',
    },
  },
  quran: {
    path: '/quran.html',
    slugs: { fa:'quran', ar:'quran', ur:'quran', en:'quran', tr:'quran', ru:'quran', az:'quran', id:'quran' },
    titles: {
      fa: 'دانشگاه قرآن | آموزش گام به گام تدبر — برکت هاب',
      ar: 'جامعة القرآن | التعلم خطوة بخطوة في التدبر — بركت هاب',
      ur: 'یونیورسٹی قرآن | مرحلہ وار تدبر کی تعلیم — برکت ہب',
      en: 'Quran University | Step-by-Step Reflection Learning — Baraka Hub',
      tr: 'Kuran Üniversitesi | Adım Adım Tefekkür Eğitimi — Baraka Hub',
      ru: 'Университет Корана | Пошаговое обучение размышлению — Baraka Hub',
      az: 'Quran Universiteti | Addım-addım tədəbbür təhsili — Baraka Hub',
      id: 'Universitas Quran | Pembelajaran Tadabur Langkah demi Langkah — Baraka Hub',
    },
  },
  prayer: {
    path: '/prayer.html',
    slugs: { fa:'prayer', ar:'prayer', ur:'prayer', en:'prayer', tr:'prayer', ru:'prayer', az:'prayer', id:'prayer' },
    titles: {
      fa: 'سفارش دعا | قرائت ادعیه به نیابت در حرم امام حسین — برکت هاب',
      ar: 'طلب الدعاء | قراءة الأدعية نيابةً في حرم الإمام الحسين — بركت هاب',
      ur: 'دعا کا آرڈر | امام حسین کے حرم میں نیابتی دعا — برکت ہب',
      en: 'Prayer Order | Prayers on Your Behalf at Imam Hussein Holy Shrine — Baraka Hub',
      tr: 'Dua Siparişi | İmam Hüseyin Türbesinde Vekaleten Dua — Baraka Hub',
      ru: 'Заказ молитвы | Молитвы от вашего имени в святыне Имама Хусейна — Baraka Hub',
      az: 'Dua Sifarişi | İmam Hüseyn Hərəmində Niyabətən Dua — Baraka Hub',
      id: 'Pesan Doa | Doa Perwakilan di Makam Imam Hussein — Baraka Hub',
    },
  },
  consultation: {
    path: '/consultation.html',
    slugs: { fa:'consultation', ar:'consultation', ur:'consultation', en:'consultation', tr:'consultation', ru:'consultation', az:'consultation', id:'consultation' },
    titles: {
      fa: 'مشاوره دینی | پاسخ تخصصی به سوالات دینی و روانشناختی — برکت هاب',
      ar: 'الاستشارة الدينية | إجابات متخصصة للأسئلة الدينية والنفسية — بركت هاب',
      ur: 'دینی مشاورہ | دینی اور نفسیاتی سوالوں کے ماہرانہ جوابات — برکت ہب',
      en: 'Religious Consultation | Expert Answers to Religious & Psychological Questions — Baraka Hub',
      tr: 'Dini Danışmanlık | Dini ve Psikolojik Sorulara Uzman Yanıtlar — Baraka Hub',
      ru: 'Религиозная консультация | Экспертные ответы на религиозные вопросы — Baraka Hub',
      az: 'Dini Məsləhət | Dini və Psixoloji Suallara Ekspert Cavablar — Baraka Hub',
      id: 'Konsultasi Agama | Jawaban Ahli untuk Pertanyaan Agama & Psikologi — Baraka Hub',
    },
  },
  istikhara: {
    path: '/istikhara.html',
    slugs: { fa:'istikhara', ar:'istikhara', ur:'istikhara', en:'istikhara', tr:'istikhara', ru:'istikhara', az:'istikhara', id:'istikhara' },
    titles: {
      fa: 'استخاره به قرآن کریم | استخاره رایگان و تخصصی — برکت هاب',
      ar: 'الاستخارة بالقرآن الكريم | استخارة مجانية وتخصصية — بركت هاب',
      ur: 'قرآن سے استخارہ | مفت اور تخصصی استخارہ — برکت ہب',
      en: 'Istikhara by Holy Quran | Free & Special Istikhara — Baraka Hub',
      tr: 'Kuran ile İstihare | Ücretsiz ve Özel İstihare — Baraka Hub',
      ru: 'Истихара по Корану | Бесплатная и специальная истихара — Baraka Hub',
      az: 'Quranla İstixarə | Pulsuz və Xüsusi İstixarə — Baraka Hub',
      id: 'Istikharah dengan Al-Quran | Istikharah Gratis & Khusus — Baraka Hub',
    },
  },
  meeting: {
    path: '/meeting.html',
    slugs: { fa:'meeting', ar:'meeting', ur:'meeting', en:'meeting', tr:'meeting', ru:'meeting', az:'meeting', id:'meeting' },
    titles: {
      fa: 'دیدار با شیخ در کربلا | ملاقات رایگان — برکت هاب',
      ar: 'لقاء الشيخ في كربلاء | لقاء مجاني — بركت هاب',
      ur: 'کربلا میں شیخ سے ملاقات | مفت ملاقات — برکت ہب',
      en: 'Meet the Sheikh in Karbala | Free Visit — Baraka Hub',
      tr: 'Kerbela\'da Şeyh ile Buluşma | Ücretsiz Ziyaret — Baraka Hub',
      ru: 'Встреча с шейхом в Кербеле | Бесплатная встреча — Baraka Hub',
      az: 'Kərbəlada Şeyxlə Görüş | Pulsuz Görüş — Baraka Hub',
      id: 'Bertemu Syaikh di Karbala | Kunjungan Gratis — Baraka Hub',
    },
  },
  about: {
    path: '/about.html',
    slugs: { fa:'about', ar:'about', ur:'about', en:'about', tr:'about', ru:'about', az:'about', id:'about' },
    titles: {
      fa: 'درباره برکت هاب | پلتفرم رسانه‌ای اسلامی کربلا',
      ar: 'عن بركت هاب | منصة إعلامية إسلامية من كربلاء',
      ur: 'برکت ہب کے بارے میں | کربلا کا اسلامی میڈیا پلیٹ فارم',
      en: 'About Baraka Hub | Islamic Media Platform from Karbala',
      tr: 'Baraka Hub Hakkında | Kerbela\'dan İslami Medya Platformu',
      ru: 'О Baraka Hub | Исламская медиаплатформа из Кербелы',
      az: 'Baraka Hub Haqqında | Kərbaladan İslam Media Platforması',
      id: 'Tentang Baraka Hub | Platform Media Islam dari Karbala',
    },
  },
};

/* ── کلمات کلیدی اصلی به هر زبان ────────────────────────────── */
export const KEYWORDS = {
  fa: 'برکت هاب، دانشگاه قرآن، سفارش دعا، مشاوره دینی، استخاره، دیدار با شیخ، کربلا، امام حسین، تدبر قرآن',
  ar: 'بركت هاب، جامعة القرآن، طلب الدعاء، استشارة دينية، استخارة، لقاء الشيخ، كربلاء، الإمام الحسين، تدبر القرآن',
  ur: 'برکت ہب، یونیورسٹی قرآن، دعا کا آرڈر، دینی مشاورہ، استخارہ، شیخ سے ملاقات، کربلا، امام حسین، تدبر قرآن',
  en: 'Baraka Hub, Quran University, Prayer Order, Islamic Consultation, Istikhara, Meet Sheikh, Karbala, Imam Hussein, Quran Reflection',
  tr: 'Baraka Hub, Kuran Üniversitesi, Dua Siparişi, İslami Danışmanlık, İstihare, Şeyh ile Buluşma, Kerbela, İmam Hüseyin, Kuran Tefekkürü',
  ru: 'Baraka Hub, Университет Корана, Заказ молитвы, Исламская консультация, Истихара, Встреча с шейхом, Кербела, Имам Хусейн, Размышление о Коране',
  az: 'Baraka Hub, Quran Universiteti, Dua Sifarişi, İslam Məsləhəti, İstixarə, Şeyxlə Görüş, Kərbəla, İmam Hüseyn, Quran Tədəbbürü',
  id: 'Baraka Hub, Universitas Quran, Pesan Doa, Konsultasi Islam, Istikharah, Bertemu Syaikh, Karbala, Imam Hussein, Tadabur Quran',
};

/* ── Social Media ─────────────────────────────────────────────── */
export const SOCIAL = {
  twitter:   '@barakahub',
  facebook:  'barakahub',
  instagram: 'barakahub',
  youtube:   'barakahub',
  telegram:  'barakahub',
};

/* ── تصویر پیش‌فرض OG ────────────────────────────────────────── */
export const DEFAULT_OG_IMAGE = `${DOMAIN}/assets/img/og-image.jpg`;
export const OG_IMAGE_WIDTH   = 1200;
export const OG_IMAGE_HEIGHT  = 630;
