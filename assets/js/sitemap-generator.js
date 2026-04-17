/**
 * ============================================================
 * FILE: sitemap-generator.js
 * ROLE: تولید sitemap.xml چندزبانه و robots.txt بهینه
 * VERSION: 2026.1.0
 * ============================================================
 * این فایل در Node.js/سرور اجرا می‌شود — نه browser
 * ============================================================
 */

import { DOMAIN, LANGUAGES, PAGES } from './seo-config.js';

/* ────────────────────────────────────────────────────────────
   1. تولید sitemap.xml اصلی با hreflang
   ──────────────────────────────────────────────────────────── */
export function generateSitemapXML() {
  const now = new Date().toISOString().split('T')[0];
  const langs = Object.keys(LANGUAGES);

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:xhtml="http://www.w3.org/1999/xhtml"
  xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
  xmlns:video="http://www.google.com/schemas/sitemap-video/1.1"
  xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
`;

  /* برای هر صفحه */
  Object.entries(PAGES).forEach(([pageKey, page]) => {
    /* برای هر زبان یک URL entry */
    langs.forEach(lang => {
      const langCfg = LANGUAGES[lang];
      const url     = `${DOMAIN}${langCfg.urlPrefix}${page.path === '/' ? '' : page.path.replace('.html', '')}`;

      xml += `
  <url>
    <loc>${url}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${pageKey === 'home' ? 'daily' : 'weekly'}</changefreq>
    <priority>${pageKey === 'home' ? '1.0' : pageKey === 'quran' ? '0.9' : '0.8'}</priority>
`;

      /* hreflang برای همه زبان‌ها */
      langs.forEach(altLang => {
        const altCfg = LANGUAGES[altLang];
        const altUrl = `${DOMAIN}${altCfg.urlPrefix}${page.path === '/' ? '' : page.path.replace('.html', '')}`;
        xml += `    <xhtml:link rel="alternate" hreflang="${altLang}" href="${altUrl}" />\n`;
      });
      /* x-default */
      const defaultUrl = `${DOMAIN}${LANGUAGES['fa'].urlPrefix}${page.path === '/' ? '' : page.path.replace('.html', '')}`;
      xml += `    <xhtml:link rel="alternate" hreflang="x-default" href="${defaultUrl}" />\n`;

      xml += `  </url>\n`;
    });
  });

  xml += `</urlset>`;
  return xml;
}

/* ────────────────────────────────────────────────────────────
   2. تولید sitemap index (یک فایل برای هر زبان)
   ──────────────────────────────────────────────────────────── */
export function generateSitemapIndex() {
  const now  = new Date().toISOString();
  const langs = Object.keys(LANGUAGES);

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

  /* sitemap اصلی */
  xml += `  <sitemap>
    <loc>${DOMAIN}/sitemap.xml</loc>
    <lastmod>${now}</lastmod>
  </sitemap>\n`;

  /* یک sitemap برای هر زبان */
  langs.forEach(lang => {
    xml += `  <sitemap>
    <loc>${DOMAIN}/sitemap-${lang}.xml</loc>
    <lastmod>${now}</lastmod>
  </sitemap>\n`;
  });

  /* sitemap ویدیوها */
  xml += `  <sitemap>
    <loc>${DOMAIN}/sitemap-video.xml</loc>
    <lastmod>${now}</lastmod>
  </sitemap>\n`;

  xml += `</sitemapindex>`;
  return xml;
}

/* ────────────────────────────────────────────────────────────
   3. تولید sitemap یک زبان خاص
   ──────────────────────────────────────────────────────────── */
export function generateLangSitemap(lang) {
  const now    = new Date().toISOString().split('T')[0];
  const langCfg= LANGUAGES[lang];
  if (!langCfg) return '';

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

  Object.entries(PAGES).forEach(([pageKey, page]) => {
    const url = `${DOMAIN}${langCfg.urlPrefix}${page.path === '/' ? '' : page.path.replace('.html', '')}`;
    xml += `  <url>
    <loc>${url}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${pageKey === 'home' ? 'daily' : 'weekly'}</changefreq>
    <priority>${pageKey === 'home' ? '1.0' : '0.8'}</priority>
  </url>\n`;
  });

  xml += `</urlset>`;
  return xml;
}

/* ────────────────────────────────────────────────────────────
   4. robots.txt بهینه ۲۰۲۶
   ──────────────────────────────────────────────────────────── */
export function generateRobotsTxt() {
  return `# ═══════════════════════════════════════
# robots.txt — Baraka Hub
# Generated: ${new Date().toISOString()}
# ═══════════════════════════════════════

# همه bot ها
User-agent: *
Allow: /
Allow: /fa/
Allow: /ar/
Allow: /ur/
Allow: /en/
Allow: /tr/
Allow: /ru/
Allow: /az/
Allow: /id/
Allow: /assets/
Allow: /manifest.json

# جلوگیری از ایندکس admin و API
Disallow: /admin/
Disallow: /admin.html
Disallow: /api/
Disallow: /server/
Disallow: /*.json$
Allow: /manifest.json

# Google
User-agent: Googlebot
Allow: /
Crawl-delay: 1

# Googlebot Image
User-agent: Googlebot-Image
Allow: /assets/img/

# Googlebot Video
User-agent: Googlebot-Video
Allow: /assets/video/

# Bing
User-agent: Bingbot
Allow: /
Crawl-delay: 2

# Yandex (برای کاربران روسی)
User-agent: YandexBot
Allow: /
Crawl-delay: 2

# AI Crawlers — برای GEO (Generative Engine Optimization)
User-agent: GPTBot
Allow: /
Allow: /quran.html
Allow: /about.html

User-agent: ChatGPT-User
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: CCBot
Allow: /

User-agent: anthropic-ai
Allow: /

User-agent: Claude-Web
Allow: /

User-agent: PerplexityBot
Allow: /

# Sitemap ها
Sitemap: ${DOMAIN}/sitemap-index.xml
Sitemap: ${DOMAIN}/sitemap.xml
${Object.keys(LANGUAGES).map(l => `Sitemap: ${DOMAIN}/sitemap-${l}.xml`).join('\n')}
Sitemap: ${DOMAIN}/sitemap-video.xml

# Host
Host: ${DOMAIN.replace('https://', '')}
`;
}

/* ────────────────────────────────────────────────────────────
   5. خروجی همه فایل‌ها (برای استفاده در سرور Node.js)
   ──────────────────────────────────────────────────────────── */
export function generateAllSitemapFiles() {
  const files = {};

  files['sitemap-index.xml'] = generateSitemapIndex();
  files['sitemap.xml']       = generateSitemapXML();
  files['robots.txt']        = generateRobotsTxt();

  Object.keys(LANGUAGES).forEach(lang => {
    files[`sitemap-${lang}.xml`] = generateLangSitemap(lang);
  });

  return files;
}
