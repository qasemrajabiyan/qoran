/**
 * ============================================================
 * FILE: seo-init.js
 * ROLE: نقطه ورود مرکزی — راه‌اندازی همه ماژول‌های سئو
 * VERSION: 2026.1.0
 *
 * استفاده در هر صفحه:
 *   import { initSEO } from '/assets/js/seo-init.js';
 *   initSEO({ lang: i18n.lang, pageId: 'quran' });
 * ============================================================
 */

import { generateFullPageSEO, injectSEOToHead, applyLangToDocument, initDynamicSEO } from './seo-manager.js';
import { initPageSchemas }   from './schema-base.js';
import { generatePreloadTags, initPerformanceSEO, getCriticalCSS } from './performance-seo.js';
import { generatePWAMetaTags, initDynamicManifest } from './pwa-seo.js';
import { PAGES }             from './seo-config.js';
import { getSEOOverride }    from './seo-ai-generator.js';

/* ────────────────────────────────────────────────────────────
   راه‌اندازی کامل سئو برای یک صفحه
   ──────────────────────────────────────────────────────────── */
export function initSEO({
  lang     = 'fa',
  pageId   = 'home',
  i18n     = null,
  extraData= {},
} = {}) {
  const page = PAGES[pageId];

  /* بررسی SEO override از ادمین */
  const override = getSEOOverride(pageId, lang);

  const title       = override?.title       ?? page?.titles?.[lang]       ?? null;
  const description = override?.description ?? null;
  const keywords    = override?.keywords    ?? null;
  const path        = page?.path ?? '/';

  /* ۱. تنظیم lang و dir روی document */
  applyLangToDocument(lang);

  /* ۲. تولید و inject تگ‌های پایه */
  const seoHtml = generateFullPageSEO({ lang, path, title, description, keywords });
  injectSEOToHead(seoHtml);

  /* ۳. PWA meta tags */
  const pwaMeta = generatePWAMetaTags(lang);
  const frag    = document.createRange().createContextualFragment(pwaMeta);
  document.head.appendChild(frag);

  /* ۴. Preload tags */
  const preloads    = generatePreloadTags(lang);
  const preloadFrag = document.createRange().createContextualFragment(preloads);
  document.head.insertBefore(preloadFrag, document.head.firstChild);

  /* ۵. Critical CSS */
  const criticalStyle = document.createElement('style');
  criticalStyle.textContent = getCriticalCSS(lang);
  document.head.insertBefore(criticalStyle, document.head.firstChild);

  /* ۶. Schema های JSON-LD */
  initPageSchemas(lang, pageId, extraData);

  /* ۷. manifest پویا بر اساس زبان */
  initDynamicManifest(lang);

  /* ۸. Performance بهینه‌سازی */
  initPerformanceSEO(lang);

  /* ۹. آپدیت خودکار هنگام تغییر زبان */
  if (i18n) {
    initDynamicSEO(i18n);
    i18n.onChange((newLang) => {
      initDynamicManifest(newLang);
      initPageSchemas(newLang, pageId, extraData);
    });
  }

  console.log(`[SEO] ✓ Initialized — Lang:${lang} | Page:${pageId}`);
}

/* ────────────────────────────────────────────────────────────
   نسخه async — برای صفحاتی که محتوا از ادمین می‌آید
   ──────────────────────────────────────────────────────────── */
export async function initSEOAsync({
  lang, pageId, i18n, extraData,
  contentFa = null, /* اگر محتوای پویا دارید */
} = {}) {
  /* ابتدا با داده‌های پایه init کن */
  initSEO({ lang, pageId, i18n, extraData });

  /* اگر محتوا پویا است و AI override دارد */
  if (contentFa) {
    const { generateSEOMeta } = await import('./seo-ai-generator.js');
    const meta = await generateSEOMeta({
      contentFa,
      pageType:  pageId,
      contentId: `${pageId}_${lang}`,
    });
    if (meta?.[lang]) {
      /* آپدیت title و description با نسخه AI */
      const titleEl = document.querySelector('title');
      const descEl  = document.querySelector('meta[name="description"]');
      if (titleEl && meta[lang].title)       titleEl.textContent = meta[lang].title;
      if (descEl  && meta[lang].description) descEl.setAttribute('content', meta[lang].description);
    }
  }
}
