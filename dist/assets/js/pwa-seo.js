/**
 * ============================================================
 * FILE: pwa-seo.js
 * ROLE: سئو مخصوص PWA + APK — manifest چندزبانه
 * VERSION: 2026.1.0
 * ============================================================
 */

import { DOMAIN, LANGUAGES, PLATFORM_NAMES, PLATFORM_DESCRIPTIONS, PAGES } from './seo-config.js';

/* ────────────────────────────────────────────────────────────
   1. تولید manifest.json چندزبانه (پویا)
   ──────────────────────────────────────────────────────────── */
export function generateManifest(lang = 'fa') {
  const cfg = LANGUAGES[lang];
  return {
    'name':             PLATFORM_NAMES[lang],
    'short_name':       'برکت هاب',
    'description':      PLATFORM_DESCRIPTIONS[lang],
    'lang':             lang,
    'dir':              cfg.dir,
    'start_url':        `${cfg.urlPrefix}/`,
    'scope':            '/',
    'display':          'standalone',
    'display_override': ['window-controls-overlay', 'standalone', 'minimal-ui'],
    'background_color': '#faf9f7',
    'theme_color':      '#2a9d8f',
    'orientation':      cfg.dir === 'rtl' ? 'portrait' : 'any',
    'categories':       ['education', 'religion', 'social'],
    'iarc_rating_id':   'e84b072d-71b3-4d3e-86ae-31a8ce4e53b7',
    'icons': [
      { 'src': '/assets/img/icon-72.png',   'sizes': '72x72',   'type': 'image/png' },
      { 'src': '/assets/img/icon-96.png',   'sizes': '96x96',   'type': 'image/png' },
      { 'src': '/assets/img/icon-128.png',  'sizes': '128x128', 'type': 'image/png' },
      { 'src': '/assets/img/icon-144.png',  'sizes': '144x144', 'type': 'image/png' },
      { 'src': '/assets/img/icon-152.png',  'sizes': '152x152', 'type': 'image/png' },
      { 'src': '/assets/img/icon-192.png',  'sizes': '192x192', 'type': 'image/png', 'purpose': 'any' },
      { 'src': '/assets/img/icon-384.png',  'sizes': '384x384', 'type': 'image/png' },
      { 'src': '/assets/img/icon-512.png',  'sizes': '512x512', 'type': 'image/png', 'purpose': 'maskable' },
      { 'src': '/assets/img/favicon.svg',   'sizes': 'any',     'type': 'image/svg+xml' },
    ],
    'screenshots': [
      {
        'src':   '/assets/img/screenshot-wide.jpg',
        'sizes': '1280x720',
        'type':  'image/jpeg',
        'form_factor': 'wide',
        'label': PLATFORM_NAMES[lang],
      },
      {
        'src':   '/assets/img/screenshot-narrow.jpg',
        'sizes': '390x844',
        'type':  'image/jpeg',
        'form_factor': 'narrow',
        'label': PLATFORM_NAMES[lang],
      },
    ],
    'shortcuts': Object.entries(PAGES)
      .filter(([k]) => k !== 'home')
      .slice(0, 4)
      .map(([key, page]) => ({
        'name':  page.titles[lang] ?? page.titles['en'] ?? key,
        'url':   `${cfg.urlPrefix}${page.path.replace('.html', '')}`,
        'icons': [{ 'src': '/assets/img/icon-96.png', 'sizes': '96x96' }],
      })),
    'related_applications': [
      {
        'platform': 'play',
        'url':      `https://play.google.com/store/apps/details?id=com.barakahub.app`,
        'id':       'com.barakahub.app',
      },
      {
        'platform': 'itunes',
        'url':      `https://apps.apple.com/app/barakahub/id000000000`,
      },
    ],
    'prefer_related_applications': false,
    'share_target': {
      'action':  '/share',
      'method':  'GET',
      'params':  { 'title': 'title', 'text': 'text', 'url': 'url' },
    },
    'protocol_handlers': [
      { 'protocol': 'web+barakahub', 'url': '/?url=%s' },
    ],
    'file_handlers': [],
    'handle_links': 'preferred',
  };
}

/* ────────────────────────────────────────────────────────────
   2. meta tags مخصوص PWA
   ──────────────────────────────────────────────────────────── */
export function generatePWAMetaTags(lang = 'fa') {
  const name = PLATFORM_NAMES[lang];
  const color = '#2a9d8f';

  return [
    /* PWA پایه */
    `<meta name="application-name"             content="${name}" />`,
    `<meta name="mobile-web-app-capable"       content="yes" />`,
    `<meta name="apple-mobile-web-app-capable" content="yes" />`,
    `<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />`,
    `<meta name="apple-mobile-web-app-title"   content="${name}" />`,
    `<meta name="theme-color"                  content="${color}" />`,
    `<meta name="msapplication-TileColor"      content="${color}" />`,
    `<meta name="msapplication-TileImage"      content="/assets/img/icon-144.png" />`,
    `<meta name="msapplication-config"         content="/browserconfig.xml" />`,
    `<meta name="format-detection"             content="telephone=no" />`,

    /* Apple Touch Icons */
    `<link rel="apple-touch-icon"              href="/assets/img/apple-touch-icon.png" />`,
    `<link rel="apple-touch-icon" sizes="76x76"   href="/assets/img/apple-touch-icon-76.png" />`,
    `<link rel="apple-touch-icon" sizes="120x120" href="/assets/img/apple-touch-icon-120.png" />`,
    `<link rel="apple-touch-icon" sizes="152x152" href="/assets/img/apple-touch-icon-152.png" />`,
    `<link rel="apple-touch-icon" sizes="180x180" href="/assets/img/apple-touch-icon-180.png" />`,

    /* Splash screens برای iOS */
    `<link rel="apple-touch-startup-image" media="(device-width: 390px)" href="/assets/img/splash-390.png" />`,
    `<link rel="apple-touch-startup-image" media="(device-width: 428px)" href="/assets/img/splash-428.png" />`,

    /* manifest */
    `<link rel="manifest" href="/manifest.json" />`,
  ].join('\n');
}

/* ────────────────────────────────────────────────────────────
   3. تولید browserconfig.xml برای Windows
   ──────────────────────────────────────────────────────────── */
export function generateBrowserConfig() {
  return `<?xml version="1.0" encoding="utf-8"?>
<browserconfig>
  <msapplication>
    <tile>
      <square70x70logo   src="/assets/img/icon-72.png"/>
      <square150x150logo src="/assets/img/icon-144.png"/>
      <square310x310logo src="/assets/img/icon-384.png"/>
      <wide310x150logo   src="/assets/img/icon-384.png"/>
      <TileColor>#2a9d8f</TileColor>
    </tile>
    <notification>
      <polling-uri src="/notifications/feed.xml"/>
    </notification>
  </msapplication>
</browserconfig>`;
}

/* ────────────────────────────────────────────────────────────
   4. Service Worker Hints برای SEO
   ──────────────────────────────────────────────────────────── */
export function generateServiceWorkerHints() {
  return `
/* ── SEO-aware Service Worker Hints ── */

/* صفحات مهم را pre-cache کن */
const SEO_CRITICAL_PAGES = [
  '/',
  '/quran.html',
  '/prayer.html',
  '/about.html',
  ${Object.keys(LANGUAGES).map(l => `'${LANGUAGES[l].urlPrefix}/'`).join(',\n  ')},
];

/* Cache strategy برای محتوای اسلامی */
const CACHE_STRATEGY = {
  pages:   'stale-while-revalidate',
  assets:  'cache-first',
  api:     'network-first',
  images:  'cache-first',
};

/* اعلام به Google که این صفحات offline هم در دسترس هستند */
self.addEventListener('fetch', event => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/offline.html'))
    );
  }
});
`;
}

/* ────────────────────────────────────────────────────────────
   5. تولید manifest پویا بر اساس زبان کاربر
   ──────────────────────────────────────────────────────────── */
export function initDynamicManifest(lang = 'fa') {
  if (!document) return;

  /* تولید manifest برای زبان جاری */
  const manifest    = generateManifest(lang);
  const manifestStr = JSON.stringify(manifest);
  const blob        = new Blob([manifestStr], { type: 'application/json' });
  const url         = URL.createObjectURL(blob);

  /* به‌روزرسانی link manifest در head */
  let linkEl = document.querySelector('link[rel="manifest"]');
  if (!linkEl) {
    linkEl = document.createElement('link');
    linkEl.rel = 'manifest';
    document.head.appendChild(linkEl);
  }

  /* آزاد کردن URL قدیمی */
  if (linkEl.href && linkEl.href.startsWith('blob:')) {
    URL.revokeObjectURL(linkEl.href);
  }
  linkEl.href = url;
}
