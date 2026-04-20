/**
 * ============================================================
 * FILE: seo-manager.js
 * ROLE: موتور مرکزی تولید تگ‌های سئو — چندزبانه
 * VERSION: 2026.1.0
 * ============================================================
 */

import {
  DOMAIN, LANGUAGES, PLATFORM_NAMES, PLATFORM_DESCRIPTIONS,
  PAGES, KEYWORDS, SOCIAL, DEFAULT_OG_IMAGE,
  OG_IMAGE_WIDTH, OG_IMAGE_HEIGHT,
} from './seo-config.js';

/* ────────────────────────────────────────────────────────────
   1. تولید URL کامل برای هر زبان و صفحه
   ──────────────────────────────────────────────────────────── */
export function buildUrl(lang, path = '/') {
  const prefix = LANGUAGES[lang]?.urlPrefix ?? '';
  const cleanPath = path === '/' ? '' : path.replace('.html', '');
  return `${DOMAIN}${prefix}${cleanPath}`;
}

/* ────────────────────────────────────────────────────────────
   2. تولید hreflang tags برای همه زبان‌ها
   ──────────────────────────────────────────────────────────── */
export function generateHreflangTags(currentPath = '/') {
  const tags = [];

  /* هر زبان */
  Object.keys(LANGUAGES).forEach(lang => {
    const url = buildUrl(lang, currentPath);
    tags.push(`<link rel="alternate" hreflang="${lang}" href="${url}" />`);
  });

  /* x-default — زبان پیش‌فرض فارسی */
  tags.push(`<link rel="alternate" hreflang="x-default" href="${buildUrl('fa', currentPath)}" />`);

  /* عربی‌زبانان کل جهان */
  tags.push(`<link rel="alternate" hreflang="ar-001" href="${buildUrl('ar', currentPath)}" />`);

  return tags.join('\n');
}

/* ────────────────────────────────────────────────────────────
   3. تولید canonical URL صحیح
   ──────────────────────────────────────────────────────────── */
export function generateCanonical(lang, path = '/') {
  const url = buildUrl(lang, path);
  return `<link rel="canonical" href="${url}" />`;
}

/* ────────────────────────────────────────────────────────────
   4. تولید Open Graph tags چندزبانه
   ──────────────────────────────────────────────────────────── */
export function generateOpenGraph({
  lang       = 'fa',
  path       = '/',
  title      = null,
  description= null,
  image      = null,
  type       = 'website',
  publishedAt= null,
  modifiedAt = null,
  author     = null,
} = {}) {
  const locale  = LANGUAGES[lang]?.ogLocale ?? 'fa_IR';
  const url     = buildUrl(lang, path);
  const _title  = title       ?? PLATFORM_NAMES[lang]       ?? PLATFORM_NAMES['en'];
  const _desc   = description ?? PLATFORM_DESCRIPTIONS[lang] ?? PLATFORM_DESCRIPTIONS['en'];
  const _image  = image ?? DEFAULT_OG_IMAGE;
  const siteName= PLATFORM_NAMES[lang] ?? PLATFORM_NAMES['en'];

  const tags = [
    `<meta property="og:type"        content="${type}" />`,
    `<meta property="og:url"         content="${url}" />`,
    `<meta property="og:locale"      content="${locale}" />`,
    `<meta property="og:site_name"   content="${siteName}" />`,
    `<meta property="og:title"       content="${_title}" />`,
    `<meta property="og:description" content="${_desc}" />`,
    `<meta property="og:image"       content="${_image}" />`,
    `<meta property="og:image:width" content="${OG_IMAGE_WIDTH}" />`,
    `<meta property="og:image:height"content="${OG_IMAGE_HEIGHT}" />`,
    `<meta property="og:image:alt"   content="${_title}" />`,
  ];

  /* Alternate locale برای هر زبان دیگر */
  Object.keys(LANGUAGES).filter(l => l !== lang).forEach(l => {
    tags.push(`<meta property="og:locale:alternate" content="${LANGUAGES[l].ogLocale}" />`);
  });

  if (publishedAt) tags.push(`<meta property="article:published_time" content="${publishedAt}" />`);
  if (modifiedAt)  tags.push(`<meta property="article:modified_time"  content="${modifiedAt}" />`);
  if (author)      tags.push(`<meta property="article:author"         content="${author}" />`);

  return tags.join('\n');
}

/* ────────────────────────────────────────────────────────────
   5. تولید Twitter Card tags
   ──────────────────────────────────────────────────────────── */
export function generateTwitterCard({
  lang       = 'fa',
  title      = null,
  description= null,
  image      = null,
  cardType   = 'summary_large_image',
} = {}) {
  const _title = title       ?? PLATFORM_NAMES[lang]        ?? PLATFORM_NAMES['en'];
  const _desc  = description ?? PLATFORM_DESCRIPTIONS[lang] ?? PLATFORM_DESCRIPTIONS['en'];
  const _image = image ?? DEFAULT_OG_IMAGE;

  return [
    `<meta name="twitter:card"        content="${cardType}" />`,
    `<meta name="twitter:site"        content="${SOCIAL.twitter}" />`,
    `<meta name="twitter:creator"     content="${SOCIAL.twitter}" />`,
    `<meta name="twitter:title"       content="${_title}" />`,
    `<meta name="twitter:description" content="${_desc}" />`,
    `<meta name="twitter:image"       content="${_image}" />`,
    `<meta name="twitter:image:alt"   content="${_title}" />`,
  ].join('\n');
}

/* ────────────────────────────────────────────────────────────
   6. تنظیم html lang و dir برای هر زبان
   ──────────────────────────────────────────────────────────── */
export function applyLangToDocument(lang) {
  const cfg = LANGUAGES[lang];
  if (!cfg || !document) return;

  document.documentElement.lang = lang;
  document.documentElement.dir  = cfg.dir;
  document.body?.setAttribute('data-lang', lang);
  document.body?.setAttribute('data-dir',  cfg.dir);

  /* تنظیم meta og:locale */
  let ogLocale = document.querySelector('meta[property="og:locale"]');
  if (!ogLocale) {
    ogLocale = document.createElement('meta');
    ogLocale.setAttribute('property', 'og:locale');
    document.head.appendChild(ogLocale);
  }
  ogLocale.setAttribute('content', cfg.ogLocale);
}

/* ────────────────────────────────────────────────────────────
   7. تولید meta tags پایه (title, description, keywords, robots)
   ──────────────────────────────────────────────────────────── */
export function generateBaseMeta({
  lang       = 'fa',
  path       = '/',
  title      = null,
  description= null,
  keywords   = null,
  robots     = 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
  noindex    = false,
} = {}) {
  const _title   = title       ?? PLATFORM_NAMES[lang]        ?? PLATFORM_NAMES['en'];
  const _desc    = description ?? PLATFORM_DESCRIPTIONS[lang] ?? PLATFORM_DESCRIPTIONS['en'];
  const _keywords= keywords    ?? KEYWORDS[lang]              ?? KEYWORDS['en'];
  const _robots  = noindex ? 'noindex, nofollow' : robots;
  const url      = buildUrl(lang, path);

  return [
    `<title>${_title}</title>`,
    `<meta name="description"        content="${_desc}" />`,
    `<meta name="keywords"           content="${_keywords}" />`,
    `<meta name="robots"             content="${_robots}" />`,
    `<meta name="googlebot"          content="${_robots}" />`,
    `<meta name="bingbot"            content="${_robots}" />`,
    `<meta name="language"           content="${LANGUAGES[lang]?.englishName ?? 'Persian'}" />`,
    `<meta name="content-language"   content="${lang}" />`,
    `<meta name="geo.region"         content="IQ-KA" />`,
    `<meta name="geo.placename"      content="Karbala" />`,
    `<meta name="geo.position"       content="32.6169;44.0244" />`,
    `<meta name="ICBM"               content="32.6169, 44.0244" />`,
    `<meta name="revisit-after"      content="3 days" />`,
    `<meta name="author"             content="${PLATFORM_NAMES[lang]}" />`,
    `<link rel="canonical"           href="${url}" />`,
  ].join('\n');
}

/* ────────────────────────────────────────────────────────────
   8. تولید کامل همه تگ‌های head برای یک صفحه
   ──────────────────────────────────────────────────────────── */
export function generateFullPageSEO({
  lang, path, title, description, keywords,
  image, type, publishedAt, modifiedAt, author, noindex,
} = {}) {
  return [
    '<!-- ═══ SEO: Base Meta ═══ -->',
    generateBaseMeta({ lang, path, title, description, keywords, noindex }),
    '',
    '<!-- ═══ SEO: Hreflang ═══ -->',
    generateHreflangTags(path),
    '',
    '<!-- ═══ SEO: Open Graph ═══ -->',
    generateOpenGraph({ lang, path, title, description, image, type, publishedAt, modifiedAt, author }),
    '',
    '<!-- ═══ SEO: Twitter Card ═══ -->',
    generateTwitterCard({ lang, title, description, image }),
  ].join('\n');
}

/* ────────────────────────────────────────────────────────────
   9. inject به DOM — برای استفاده در runtime
   ──────────────────────────────────────────────────────────── */
export function injectSEOToHead(seoHtml) {
  if (!document) return;

  /* حذف تگ‌های قدیمی سئو */
  document.querySelectorAll('[data-seo]').forEach(el => el.remove());

  /* ساخت fragment و inject */
  const fragment = document.createRange().createContextualFragment(
    seoHtml.replace(/<(link|meta|title)[^>]*>/g, match => {
      return match.replace('>', ' data-seo="true">');
    })
  );
  document.head.appendChild(fragment);
}

/* ────────────────────────────────────────────────────────────
   10. آپدیت خودکار سئو هنگام تغییر زبان
   ──────────────────────────────────────────────────────────── */
export function initDynamicSEO(i18nInstance) {
  if (!i18nInstance) return;

  const _update = () => {
    const lang = i18nInstance.lang;
    const path = window.location.pathname;

    applyLangToDocument(lang);

    const seo = generateFullPageSEO({ lang, path });
    injectSEOToHead(seo);
  };

  /* اجرای اولیه */
  _update();

  /* اجرا هنگام تغییر زبان */
  i18nInstance.onChange(_update);

  /* اجرا هنگام تغییر URL (SPA) */
  window.addEventListener('popstate', _update);
}
