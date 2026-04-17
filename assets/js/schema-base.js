/**
 * ============================================================
 * FILE: schema-base.js
 * ROLE: تولید Schema های JSON-LD اختصاصی محتوای اسلامی
 * VERSION: 2026.1.0
 * ============================================================
 */

import { DOMAIN, LANGUAGES, PLATFORM_NAMES, PLATFORM_DESCRIPTIONS, SOCIAL } from './seo-config.js';

/* ────────────────────────────────────────────────────────────
   1. Organization Schema — با Entity Depth کامل
   ──────────────────────────────────────────────────────────── */
export function generateOrganizationSchema(lang = 'fa') {
  return {
    '@context': 'https://schema.org',
    '@type': ['Organization', 'ReligiousOrganization'],
    '@id': `${DOMAIN}/#organization`,
    'name': PLATFORM_NAMES[lang],
    'alternateName': Object.values(PLATFORM_NAMES),
    'url': DOMAIN,
    'logo': {
      '@type': 'ImageObject',
      'url': `${DOMAIN}/assets/img/icon-512.png`,
      'width': 512,
      'height': 512,
    },
    'image': `${DOMAIN}/assets/img/og-image.jpg`,
    'description': PLATFORM_DESCRIPTIONS[lang],
    'foundingLocation': {
      '@type': 'Place',
      'name': 'Karbala',
      'address': {
        '@type': 'PostalAddress',
        'addressLocality': 'Karbala',
        'addressCountry': 'IQ',
        'addressRegion': 'Karbala Governorate',
      },
      'geo': {
        '@type': 'GeoCoordinates',
        'latitude': 32.6169,
        'longitude': 44.0244,
      },
    },
    'areaServed': Object.keys(LANGUAGES).map(l => ({
      '@type': 'Language',
      'name': LANGUAGES[l].englishName,
      'alternateName': LANGUAGES[l].nativeName,
    })),
    'knowsLanguage': Object.keys(LANGUAGES).map(l => LANGUAGES[l].englishName),
    'sameAs': [
      `https://twitter.com/${SOCIAL.twitter.replace('@','')}`,
      `https://www.facebook.com/${SOCIAL.facebook}`,
      `https://www.instagram.com/${SOCIAL.instagram}`,
      `https://t.me/${SOCIAL.telegram}`,
      `https://www.youtube.com/@${SOCIAL.youtube}`,
    ],
    'contactPoint': {
      '@type': 'ContactPoint',
      'contactType': 'customer support',
      'availableLanguage': Object.keys(LANGUAGES).map(l => LANGUAGES[l].englishName),
    },
  };
}

/* ────────────────────────────────────────────────────────────
   2. WebSite Schema با SearchAction
   ──────────────────────────────────────────────────────────── */
export function generateWebSiteSchema(lang = 'fa') {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${DOMAIN}/#website`,
    'url': DOMAIN,
    'name': PLATFORM_NAMES[lang],
    'description': PLATFORM_DESCRIPTIONS[lang],
    'inLanguage': Object.keys(LANGUAGES),
    'potentialAction': {
      '@type': 'SearchAction',
      'target': {
        '@type': 'EntryPoint',
        'urlTemplate': `${DOMAIN}/search?q={search_term_string}&lang=${lang}`,
      },
      'query-input': 'required name=search_term_string',
    },
    'publisher': { '@id': `${DOMAIN}/#organization` },
  };
}

/* ────────────────────────────────────────────────────────────
   3. Person Schema — شیخ (گوینده محتوا)
   ──────────────────────────────────────────────────────────── */
export function generateSheikhPersonSchema(lang = 'fa') {
  const names = {
    fa: 'شیخ احمد الکربلایی',
    ar: 'الشيخ أحمد الكربلائي',
    ur: 'شیخ احمد الکربلائی',
    en: 'Sheikh Ahmad Al-Karbalaei',
    tr: 'Şeyh Ahmet El-Kerbelai',
    ru: 'Шейх Ахмад Аль-Карбалаи',
    az: 'Şeyx Əhməd əl-Kərbalai',
    id: 'Syaikh Ahmad Al-Karbalaei',
  };

  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': `${DOMAIN}/#sheikh`,
    'name': names[lang] ?? names['en'],
    'alternateName': Object.values(names),
    'jobTitle': {
      fa: 'استاد قرآن و مرجع دینی',
      ar: 'مرجع ديني وأستاذ قرآن',
      en: 'Quran Scholar and Religious Authority',
    }[lang] ?? 'Quran Scholar',
    'worksFor': { '@id': `${DOMAIN}/#organization` },
    'knowsLanguage': ['Arabic', 'Persian', 'Urdu'],
    'address': {
      '@type': 'PostalAddress',
      'addressLocality': 'Karbala',
      'addressCountry': 'IQ',
    },
  };
}

/* ────────────────────────────────────────────────────────────
   4. BreadcrumbList Generator
   ──────────────────────────────────────────────────────────── */
export function generateBreadcrumbSchema(lang = 'fa', items = []) {
  const langCfg = LANGUAGES[lang];
  const base    = `${DOMAIN}${langCfg?.urlPrefix ?? ''}`;

  const homeNames = {
    fa:'خانه', ar:'الرئيسية', ur:'ہوم', en:'Home',
    tr:'Ana Sayfa', ru:'Главная', az:'Ana səhifə', id:'Beranda',
  };

  const listItems = [
    {
      '@type': 'ListItem',
      'position': 1,
      'name': homeNames[lang] ?? 'Home',
      'item': base || `${DOMAIN}/`,
    },
    ...items.map((item, idx) => ({
      '@type': 'ListItem',
      'position': idx + 2,
      'name': item.name,
      'item': item.url ?? `${base}/${item.slug}`,
    })),
  ];

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': listItems,
  };
}

/* ────────────────────────────────────────────────────────────
   5. Course Schema — دانشگاه قرآن
   ──────────────────────────────────────────────────────────── */
export function generateQuranCourseSchema(lang = 'fa') {
  const names = {
    fa: 'دانشگاه قرآن — آموزش گام به گام تدبر',
    ar: 'جامعة القرآن — التعلم خطوة بخطوة في التدبر',
    ur: 'یونیورسٹی قرآن — مرحلہ وار تدبر کی تعلیم',
    en: 'Quran University — Step-by-Step Reflection Learning',
    tr: 'Kuran Üniversitesi — Adım Adım Tefekkür Eğitimi',
    ru: 'Университет Корана — Пошаговое обучение размышлению',
    az: 'Quran Universiteti — Addım-addım tədəbbür təhsili',
    id: 'Universitas Quran — Pembelajaran Tadabur Langkah demi Langkah',
  };

  return {
    '@context': 'https://schema.org',
    '@type': 'Course',
    '@id': `${DOMAIN}/quran.html#course`,
    'name': names[lang] ?? names['en'],
    'description': PLATFORM_DESCRIPTIONS[lang],
    'url': `${DOMAIN}${LANGUAGES[lang]?.urlPrefix ?? ''}/quran`,
    'provider': { '@id': `${DOMAIN}/#organization` },
    'instructor': { '@id': `${DOMAIN}/#sheikh` },
    'inLanguage': Object.keys(LANGUAGES),
    'isAccessibleForFree': true,
    'educationalLevel': 'Beginner to Advanced',
    'about': {
      '@type': 'Thing',
      'name': 'Holy Quran',
      'sameAs': 'https://www.wikidata.org/wiki/Q428',
    },
    'hasCourseInstance': {
      '@type': 'CourseInstance',
      'courseMode': 'online',
      'courseWorkload': 'PT30M',
    },
  };
}

/* ────────────────────────────────────────────────────────────
   6. Service Schema — سفارش دعا
   ──────────────────────────────────────────────────────────── */
export function generatePrayerServiceSchema(lang = 'fa') {
  const names = {
    fa: 'سفارش دعا — قرائت ادعیه در حرم امام حسین',
    ar: 'طلب الدعاء — قراءة الأدعية في حرم الإمام الحسين',
    ur: 'دعا کا آرڈر — امام حسین کے حرم میں ادعیہ',
    en: 'Prayer Order — Prayers at Imam Hussein Holy Shrine',
    tr: 'Dua Siparişi — İmam Hüseyin Türbesinde Dua',
    ru: 'Заказ молитвы — Молитвы в святыне Имама Хусейна',
    az: 'Dua Sifarişi — İmam Hüseyn Hərəmində Dua',
    id: 'Pesan Doa — Doa di Makam Imam Hussein',
  };

  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    '@id': `${DOMAIN}/prayer.html#service`,
    'name': names[lang] ?? names['en'],
    'serviceType': 'Religious Prayer Service',
    'provider': { '@id': `${DOMAIN}/#organization` },
    'areaServed': 'Worldwide',
    'availableLanguage': Object.keys(LANGUAGES).map(l => LANGUAGES[l].englishName),
    'url': `${DOMAIN}${LANGUAGES[lang]?.urlPrefix ?? ''}/prayer`,
    'offers': {
      '@type': 'Offer',
      'availability': 'https://schema.org/InStock',
      'priceCurrency': 'USD',
    },
  };
}

/* ────────────────────────────────────────────────────────────
   7. Event Schema — دیدار با شیخ
   ──────────────────────────────────────────────────────────── */
export function generateMeetingEventSchema(lang = 'fa', slots = []) {
  const names = {
    fa: 'دیدار با شیخ در کربلا',
    ar: 'لقاء الشيخ في كربلاء',
    ur: 'کربلا میں شیخ سے ملاقات',
    en: 'Meet the Sheikh in Karbala',
    tr: 'Kerbela\'da Şeyh ile Buluşma',
    ru: 'Встреча с шейхом в Кербеле',
    az: 'Kərbəlada Şeyxlə Görüş',
    id: 'Bertemu Syaikh di Karbala',
  };

  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    '@id': `${DOMAIN}/meeting.html#event`,
    'name': names[lang] ?? names['en'],
    'description': PLATFORM_DESCRIPTIONS[lang],
    'url': `${DOMAIN}${LANGUAGES[lang]?.urlPrefix ?? ''}/meeting`,
    'organizer': { '@id': `${DOMAIN}/#organization` },
    'performer': { '@id': `${DOMAIN}/#sheikh` },
    'location': {
      '@type': 'Place',
      'name': 'Karbala Holy Shrine',
      'address': {
        '@type': 'PostalAddress',
        'addressLocality': 'Karbala',
        'addressCountry': 'IQ',
      },
      'geo': {
        '@type': 'GeoCoordinates',
        'latitude': 32.6169,
        'longitude': 44.0244,
      },
    },
    'isAccessibleForFree': true,
    'inLanguage': Object.keys(LANGUAGES),
    'eventAttendanceMode': 'https://schema.org/OfflineEventAttendanceMode',
    'eventStatus': 'https://schema.org/EventScheduled',
  };
}

/* ────────────────────────────────────────────────────────────
   8. FAQPage Schema — برای سئوی سوال و جواب
   ──────────────────────────────────────────────────────────── */
export function generateFAQSchema(lang = 'fa', faqs = []) {
  if (!faqs.length) return null;

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': faqs.map(faq => ({
      '@type': 'Question',
      'name': faq.question,
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': faq.answer,
      },
    })),
  };
}

/* ────────────────────────────────────────────────────────────
   9. inject Schema به DOM
   ──────────────────────────────────────────────────────────── */
export function injectSchema(schemaObj, id = 'schema-main') {
  if (!document || !schemaObj) return;

  let el = document.getElementById(id);
  if (!el) {
    el = document.createElement('script');
    el.type = 'application/ld+json';
    el.id   = id;
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(schemaObj, null, 2);
}

/* ────────────────────────────────────────────────────────────
   10. تولید و inject همه Schema های صفحه
   ──────────────────────────────────────────────────────────── */
export function initPageSchemas(lang = 'fa', pageId = 'home', extraData = {}) {
  /* Schema های مشترک همه صفحات */
  injectSchema(generateOrganizationSchema(lang), 'schema-org');
  injectSchema(generateWebSiteSchema(lang),      'schema-website');

  /* Schema اختصاصی هر صفحه */
  switch (pageId) {
    case 'home':
      injectSchema(generateBreadcrumbSchema(lang), 'schema-breadcrumb');
      break;

    case 'quran':
      injectSchema(generateQuranCourseSchema(lang), 'schema-course');
      injectSchema(generateSheikhPersonSchema(lang), 'schema-sheikh');
      injectSchema(generateBreadcrumbSchema(lang, [
        { name: { fa:'دانشگاه قرآن', en:'Quran University' }[lang] ?? 'Quran', slug: 'quran' },
      ]), 'schema-breadcrumb');
      if (extraData.faqs?.length) injectSchema(generateFAQSchema(lang, extraData.faqs), 'schema-faq');
      break;

    case 'prayer':
      injectSchema(generatePrayerServiceSchema(lang), 'schema-service');
      injectSchema(generateBreadcrumbSchema(lang, [
        { name: { fa:'سفارش دعا', en:'Prayer Order' }[lang] ?? 'Prayer', slug: 'prayer' },
      ]), 'schema-breadcrumb');
      break;

    case 'meeting':
      injectSchema(generateMeetingEventSchema(lang, extraData.slots), 'schema-event');
      injectSchema(generateSheikhPersonSchema(lang), 'schema-sheikh');
      injectSchema(generateBreadcrumbSchema(lang, [
        { name: { fa:'دیدار با شیخ', en:'Meet the Sheikh' }[lang] ?? 'Meeting', slug: 'meeting' },
      ]), 'schema-breadcrumb');
      break;

    default:
      injectSchema(generateBreadcrumbSchema(lang), 'schema-breadcrumb');
  }
}
