/**
 * ============================================================
 * FILE: performance-seo.js
 * ROLE: بهینه‌سازی Core Web Vitals و performance برای سئو
 * VERSION: 2026.1.0
 * ============================================================
 */

import { LANGUAGES } from './seo-config.js';

/* ────────────────────────────────────────────────────────────
   1. preload و prefetch استراتژیک
   ──────────────────────────────────────────────────────────── */
export function generatePreloadTags(lang = 'fa') {
  const cfg = LANGUAGES[lang];
  const isRTL = cfg?.dir === 'rtl';

  const tags = [
    /* فونت اصلی — بر اساس زبان */
    `<link rel="preconnect" href="https://fonts.googleapis.com" />`,
    `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />`,

    /* فونت‌های RTL */
    ...(isRTL ? [
      `<link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;700;900&family=Noto+Naskh+Arabic:wght@400;700&display=swap" />`,
      `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;700;900&family=Noto+Naskh+Arabic:wght@400;700&display=swap" media="print" onload="this.media='all'" />`,
    ] : [
      `<link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&display=swap" />`,
      `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&display=swap" media="print" onload="this.media='all'" />`,
    ]),

    /* CSS های اصلی */
    `<link rel="preload" as="style" href="/assets/css/01-tokens.css" />`,
    `<link rel="preload" as="style" href="/assets/css/04-components.css" />`,

    /* JS اصلی */
    `<link rel="preload" as="script" href="/assets/js/app.js" />`,
    `<link rel="preload" as="script" href="/assets/js/i18n.js" />`,

    /* تصویر hero — LCP بهینه */
    `<link rel="preload" as="image" href="/assets/img/og-image.jpg" />`,

    /* DNS prefetch برای API ها */
    `<link rel="dns-prefetch" href="https://open.er-api.com" />`,
    `<link rel="dns-prefetch" href="https://ipapi.co" />`,
    `<link rel="dns-prefetch" href="https://api.anthropic.com" />`,
    `<link rel="dns-prefetch" href="https://api.elevenlabs.io" />`,
  ];

  return tags.join('\n');
}

/* ────────────────────────────────────────────────────────────
   2. Lazy Loading بهینه تصاویر
   ──────────────────────────────────────────────────────────── */
export function initLazyLoading() {
  if (!document || !('IntersectionObserver' in window)) {
    /* fallback — بارگذاری مستقیم */
    document?.querySelectorAll('img[data-src]').forEach(img => {
      img.src = img.dataset.src;
    });
    return;
  }

  const imgObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;

      const img = entry.target;
      if (img.dataset.src)    { img.src    = img.dataset.src;    delete img.dataset.src;    }
      if (img.dataset.srcset) { img.srcset = img.dataset.srcset; delete img.dataset.srcset; }

      img.classList.add('loaded');
      imgObserver.unobserve(img);
    });
  }, {
    rootMargin: '200px 0px', /* 200px قبل از ورود به viewport */
    threshold:  0.01,
  });

  document.querySelectorAll('img[data-src], img[loading="lazy"]').forEach(img => {
    imgObserver.observe(img);
  });

  /* ویدیوها */
  const videoObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const video = entry.target;
      if (video.dataset.src) {
        video.src = video.dataset.src;
        delete video.dataset.src;
        video.load();
      }
      videoObserver.unobserve(video);
    });
  }, { rootMargin: '300px 0px' });

  document.querySelectorAll('video[data-src]').forEach(v => videoObserver.observe(v));
}

/* ────────────────────────────────────────────────────────────
   3. بهینه‌سازی فونت‌های عربی/فارسی (LCP)
   ──────────────────────────────────────────────────────────── */
export function optimizeFontLoading(lang = 'fa') {
  if (!document) return;
  const cfg = LANGUAGES[lang];
  if (!cfg) return;

  /* اضافه کردن font-display: swap به همه فونت‌ها */
  const style = document.createElement('style');
  style.textContent = `
    @font-face {
      font-family: 'Vazirmatn';
      font-display: swap;
    }
    @font-face {
      font-family: 'Noto Naskh Arabic';
      font-display: swap;
    }
    @font-face {
      font-family: 'Gulzar';
      font-display: swap;
    }
    @font-face {
      font-family: 'DM Sans';
      font-display: swap;
    }
    /* جلوگیری از Layout Shift در زبان‌های RTL */
    html[dir="rtl"] body {
      text-align: right;
    }
    html[dir="ltr"] body {
      text-align: left;
    }
  `;
  document.head.appendChild(style);
}

/* ────────────────────────────────────────────────────────────
   4. اندازه‌گیری Core Web Vitals
   ──────────────────────────────────────────────────────────── */
export function measureCoreWebVitals() {
  if (!('PerformanceObserver' in window)) return;

  /* LCP — Largest Contentful Paint */
  new PerformanceObserver(list => {
    const entries = list.getEntries();
    const last    = entries[entries.length - 1];
    console.log('[CWV] LCP:', last.startTime.toFixed(0), 'ms',
      last.startTime < 2500 ? '✅ Good' : last.startTime < 4000 ? '⚠ Needs Improvement' : '❌ Poor');
  }).observe({ type: 'largest-contentful-paint', buffered: true });

  /* FID/INP — Interaction to Next Paint */
  new PerformanceObserver(list => {
    list.getEntries().forEach(entry => {
      if (entry.entryType === 'event') {
        const inp = entry.duration;
        console.log('[CWV] INP:', inp.toFixed(0), 'ms',
          inp < 200 ? '✅ Good' : inp < 500 ? '⚠ Needs Improvement' : '❌ Poor');
      }
    });
  }).observe({ type: 'event', buffered: true, durationThreshold: 16 });

  /* CLS — Cumulative Layout Shift */
  let cls = 0;
  new PerformanceObserver(list => {
    list.getEntries().forEach(entry => {
      if (!entry.hadRecentInput) cls += entry.value;
    });
    console.log('[CWV] CLS:', cls.toFixed(4),
      cls < 0.1 ? '✅ Good' : cls < 0.25 ? '⚠ Needs Improvement' : '❌ Poor');
  }).observe({ type: 'layout-shift', buffered: true });

  /* TTFB */
  const nav = performance.getEntriesByType('navigation')[0];
  if (nav) {
    console.log('[CWV] TTFB:', nav.responseStart.toFixed(0), 'ms',
      nav.responseStart < 800 ? '✅ Good' : nav.responseStart < 1800 ? '⚠ Needs Improvement' : '❌ Poor');
  }
}

/* ────────────────────────────────────────────────────────────
   5. Resource Hints پویا — prefetch صفحات بعدی
   ──────────────────────────────────────────────────────────── */
export function initPredictivePrefetch() {
  if (!document) return;

  /* صفحاتی که کاربر احتمالاً می‌رود */
  const prefetchMap = {
    '/':              ['/quran.html', '/prayer.html'],
    '/quran.html':    ['/prayer.html', '/consultation.html'],
    '/prayer.html':   ['/payment.html'],
    '/consultation.html': ['/payment.html'],
    '/istikhara.html':    ['/payment.html'],
    '/meeting.html':      ['/about.html'],
  };

  const currentPath = window.location.pathname;
  const toPreload   = prefetchMap[currentPath] ?? [];

  toPreload.forEach(url => {
    const link = document.createElement('link');
    link.rel  = 'prefetch';
    link.href = url;
    link.as   = 'document';
    document.head.appendChild(link);
  });
}

/* ────────────────────────────────────────────────────────────
   6. Critical CSS Inline برای LCP سریع‌تر
   ──────────────────────────────────────────────────────────── */
export function getCriticalCSS(lang = 'fa') {
  const isRTL = LANGUAGES[lang]?.dir === 'rtl';
  return `
    /* Critical CSS — inlined برای LCP */
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    html{background:#faf9f7;scroll-behavior:smooth}
    html[data-theme="dark"]{background:#100d0a}
    body{
      font-family:${isRTL ? "'Vazirmatn','Noto Naskh Arabic'" : "'DM Sans'"}, system-ui, sans-serif;
      direction:${isRTL ? 'rtl' : 'ltr'};
      text-align:${isRTL ? 'right' : 'left'};
      opacity:0;transition:opacity 0.2s ease;
      -webkit-font-smoothing:antialiased;
    }
    body.ready{opacity:1}
    .container{width:100%;max-width:1280px;margin:0 auto;padding:0 1rem}
    .navbar{position:sticky;top:0;z-index:100;background:#faf9f7}
  `;
}

/* ────────────────────────────────────────────────────────────
   7. راه‌اندازی همه بهینه‌سازی‌ها
   ──────────────────────────────────────────────────────────── */
export function initPerformanceSEO(lang = 'fa') {
  optimizeFontLoading(lang);
  initLazyLoading();
  initPredictivePrefetch();

  /* اندازه‌گیری فقط در development */
  if (window.location.hostname === 'localhost') {
    measureCoreWebVitals();
  }

  /* اجرا بعد از load کامل */
  window.addEventListener('load', () => {
    /* Image optimization */
    document.querySelectorAll('img:not([width]):not([height])').forEach(img => {
      if (img.naturalWidth) {
        img.setAttribute('width',  img.naturalWidth);
        img.setAttribute('height', img.naturalHeight);
      }
    });
  }, { once: true });
}
