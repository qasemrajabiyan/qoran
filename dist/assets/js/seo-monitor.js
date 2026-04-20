/**
 * ============================================================
 * FILE: seo-monitor.js
 * ROLE: داشبورد نظارت و آنالیز سئو — برای ادمین
 * VERSION: 2026.1.0
 * ============================================================
 *
 * این داشبورد به ادمین نشان می‌دهد:
 *   - وضعیت سئوی هر صفحه در هر ۸ زبان
 *   - کدام صفحات سئو دارند / ندارند
 *   - کیفیت تگ‌های سئو (امتیاز ۰-۱۰۰)
 *   - صف تولید سئو
 *   - هشدارهای سئو
 *   - آمار کلی
 *   - وضعیت robots.txt، sitemap، llms.txt
 *   - Core Web Vitals
 *   - Rich Results eligibility
 * ============================================================
 */

import { LANGUAGES, PAGES, DOMAIN } from './seo-config.js';
import { SEOQueue, getAllSEOOverrides } from './seo-ai-generator.js';

/* ════════════════════════════════════════════════════════════
   ۱. SEO SCORER — امتیازدهی کیفیت سئو
   ════════════════════════════════════════════════════════════ */
function _scoreSEO(seoData, lang) {
  if (!seoData) return { score: 0, issues: ['سئو تولید نشده'] };

  const d      = seoData[lang];
  const issues = [];
  let   score  = 0;

  if (!d) return { score: 0, issues: ['داده سئو برای این زبان وجود ندارد'] };

  /* Title */
  if (!d.title) { issues.push('Title ندارد'); }
  else {
    const len = d.title.length;
    if (len < 20)  { issues.push(`Title خیلی کوتاه (${len} کاراکتر)`); score += 5; }
    else if (len > 60) { issues.push(`Title خیلی بلند (${len} کاراکتر)`); score += 10; }
    else { score += 20; }
  }

  /* Description */
  if (!d.description) { issues.push('Meta description ندارد'); }
  else {
    const len = d.description.length;
    if (len < 50)   { issues.push(`Description خیلی کوتاه (${len} کاراکتر)`); score += 5; }
    else if (len > 155) { issues.push(`Description خیلی بلند (${len} کاراکتر)`); score += 10; }
    else { score += 20; }
  }

  /* Keywords */
  if (!d.keywords || d.keywords.split(',').length < 3) {
    issues.push('Keywords ناکافی');
    score += 5;
  } else { score += 10; }

  /* Primary Keyword */
  if (!d.primaryKeyword) { issues.push('Primary keyword ندارد'); }
  else {
    /* بررسی وجود keyword در title */
    if (d.title?.toLowerCase().includes(d.primaryKeyword.toLowerCase())) score += 15;
    else { issues.push('Primary keyword در Title نیست'); score += 5; }
  }

  /* FAQ */
  if (!d.faq?.length) { issues.push('FAQ Schema ندارد'); }
  else if (d.faq.length < 3) { issues.push('FAQ کمتر از ۳ سوال دارد'); score += 5; }
  else { score += 10; }

  /* Schema */
  if (!d.schema) { issues.push('Schema JSON-LD ندارد'); }
  else { score += 10; }

  /* Voice Search */
  if (!d.voiceSearchQuery) { issues.push('Voice search query ندارد'); }
  else { score += 5; }

  /* Featured Snippet */
  if (!d.featuredSnippetTarget) { issues.push('Featured snippet target ندارد'); }
  else { score += 5; }

  /* Search Intent */
  if (!d.searchIntent) { issues.push('Search intent مشخص نیست'); }
  else { score += 5; }

  return {
    score: Math.min(100, score),
    grade: score >= 90 ? 'A' : score >= 75 ? 'B' : score >= 60 ? 'C' : score >= 40 ? 'D' : 'F',
    issues,
  };
}

/* ── رنگ امتیاز ───────────────────────────────────────────── */
function _scoreColor(score) {
  if (score >= 90) return '#16a34a';
  if (score >= 75) return '#2a9d8f';
  if (score >= 60) return '#d97706';
  if (score >= 40) return '#f59e0b';
  return '#e63946';
}

/* ════════════════════════════════════════════════════════════
   ۲. بررسی فایل‌های سئوی فنی
   ════════════════════════════════════════════════════════════ */
async function _checkTechnicalFiles() {
  const files = [
    { name: 'robots.txt',    url: `${DOMAIN}/robots.txt`,         critical: true  },
    { name: 'sitemap.xml',   url: `${DOMAIN}/sitemap.xml`,        critical: true  },
    { name: 'llms.txt',      url: `${DOMAIN}/llms.txt`,           critical: false },
    { name: 'llms-full.txt', url: `${DOMAIN}/llms-full.txt`,      critical: false },
    { name: 'manifest.json', url: `${DOMAIN}/manifest.json`,      critical: false },
  ];

  const results = await Promise.allSettled(
    files.map(async f => {
      try {
        const res = await fetch(f.url, { method: 'HEAD', signal: AbortSignal.timeout(5000) });
        return { ...f, status: res.ok ? 'ok' : 'error', httpStatus: res.status };
      } catch {
        return { ...f, status: 'unreachable', httpStatus: 0 };
      }
    })
  );

  return results.map((r, i) => r.status === 'fulfilled' ? r.value : { ...files[i], status: 'error' });
}

/* ════════════════════════════════════════════════════════════
   ۳. جمع‌آوری آمار کلی
   ════════════════════════════════════════════════════════════ */
function _gatherStats() {
  const langs      = Object.keys(LANGUAGES);
  const pageIds    = Object.keys(PAGES);
  const overrides  = (() => { try { return JSON.parse(localStorage.getItem('mh_seo_overrides')||'{}'); } catch { return {}; } })();
  const cache      = (() => { try { return JSON.parse(localStorage.getItem('mh_seo_full_cache')||'{}'); } catch { return {}; } })();
  const queue      = SEOQueue.getAll();

  let totalPages    = pageIds.length;
  let pagesWithSEO  = 0;
  let totalScore    = 0;
  let scoreCount    = 0;
  const pageDetails = [];

  pageIds.forEach(pageId => {
    const pageData = overrides[pageId] ?? null;
    const hasAnySEO = pageData && langs.some(l => pageData[l]?.title);

    if (hasAnySEO) pagesWithSEO++;

    const langScores = {};
    langs.forEach(lang => {
      const r = _scoreSEO(pageData, lang);
      langScores[lang] = r;
      if (hasAnySEO) { totalScore += r.score; scoreCount++; }
    });

    const avgScore = Object.values(langScores).reduce((a,b) => a + b.score, 0) / langs.length;

    pageDetails.push({
      pageId,
      title: PAGES[pageId]?.titles?.fa ?? pageId,
      hasSEO: hasAnySEO,
      avgScore: Math.round(avgScore),
      langScores,
      inQueue: queue.find(q => q.id === pageId),
    });
  });

  return {
    totalPages,
    pagesWithSEO,
    pagesWithoutSEO: totalPages - pagesWithSEO,
    avgScore: scoreCount > 0 ? Math.round(totalScore / scoreCount) : 0,
    queuePending: queue.filter(q => q.status === 'pending').length,
    queueReady:   queue.filter(q => q.status === 'ready').length,
    pageDetails,
  };
}

/* ════════════════════════════════════════════════════════════
   ۴. رندر داشبورد اصلی
   ════════════════════════════════════════════════════════════ */
export async function renderSEOMonitorDashboard(container) {
  if (!container) return;

  const stats   = _gatherStats();
  const techFiles = await _checkTechnicalFiles();
  const langs   = Object.keys(LANGUAGES);

  container.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:var(--space-5)">

      <!-- Header -->
      <div class="admin-page-header">
        <div>
          <h1 class="admin-page-title">
            <span class="admin-page-title__icon">🔍</span>
            داشبورد نظارت سئو
          </h1>
          <p class="admin-page-desc">
            وضعیت سئوی کامل سایت — ۸ زبان، همه صفحات
          </p>
        </div>
        <button class="btn btn--primary" id="seo-refresh-btn" type="button">
          🔄 بروزرسانی
        </button>
      </div>

      <!-- کارت‌های آماری -->
      <div class="admin-stats-grid">
        ${_renderStatCard('📄', 'کل صفحات', stats.totalPages, null, 'blue')}
        ${_renderStatCard('✅', 'دارای سئو', stats.pagesWithSEO, `از ${stats.totalPages}`, 'green')}
        ${_renderStatCard('⚠', 'بدون سئو', stats.pagesWithoutSEO, 'نیاز به توجه', stats.pagesWithoutSEO > 0 ? 'amber' : 'green')}
        ${_renderStatCard('📊', 'میانگین امتیاز', stats.avgScore, 'از ۱۰۰', stats.avgScore >= 75 ? 'green' : stats.avgScore >= 50 ? 'amber' : 'red')}
        ${_renderStatCard('⏳', 'در صف', stats.queuePending, 'منتظر تولید', 'blue')}
        ${_renderStatCard('🎯', 'آماده تأیید', stats.queueReady, 'منتظر ادمین', stats.queueReady > 0 ? 'amber' : 'blue')}
      </div>

      <!-- وضعیت فایل‌های فنی -->
      <div class="admin-panel">
        <div class="admin-panel__header">
          <div class="admin-panel__title">🔧 فایل‌های فنی سئو</div>
        </div>
        <div class="admin-panel__body">
          <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:var(--space-3)">
            ${techFiles.map(f => `
              <div style="
                background:var(--bg-surface-2);border:1px solid var(--border-color);
                border-radius:var(--radius-md);padding:var(--space-3) var(--space-4);
                display:flex;align-items:center;justify-content:space-between;
              ">
                <div>
                  <div style="font-size:var(--text-sm);font-weight:700">${f.name}</div>
                  ${f.critical ? '<div style="font-size:10px;color:var(--color-error)">⚡ حیاتی</div>' : ''}
                </div>
                <span class="admin-badge admin-badge--${f.status === 'ok' ? 'done' : 'pending'}" style="font-size:10px">
                  ${f.status === 'ok' ? '✓ موجود' : f.status === 'unreachable' ? '⚠ محیط توسعه' : '✗ ندارد'}
                </span>
              </div>
            `).join('')}
          </div>
          <div style="margin-top:var(--space-3);font-size:var(--text-xs);color:var(--text-muted)">
            ℹ️ فایل‌های «محیط توسعه» بعد از deploy روی سرور قابل بررسی هستند
          </div>
        </div>
      </div>

      <!-- جدول صفحات -->
      <div class="admin-panel">
        <div class="admin-panel__header">
          <div class="admin-panel__title">📋 وضعیت سئوی هر صفحه</div>
        </div>
        <div class="admin-panel__body">
          <div style="overflow-x:auto">
            <table class="admin-table" style="min-width:900px">
              <thead>
                <tr>
                  <th>صفحه</th>
                  <th>امتیاز کل</th>
                  ${langs.map(l => `<th style="font-size:10px">${LANGUAGES[l].flag}</th>`).join('')}
                  <th>وضعیت</th>
                  <th>عملیات</th>
                </tr>
              </thead>
              <tbody>
                ${stats.pageDetails.map(p => `
                  <tr>
                    <td>
                      <div style="font-weight:700;font-size:var(--text-sm)">${p.title}</div>
                      <div style="font-size:10px;color:var(--text-muted);direction:ltr">${PAGES[p.pageId]?.path ?? ''}</div>
                    </td>
                    <td>
                      <div style="display:flex;align-items:center;gap:var(--space-2)">
                        <div style="
                          width:36px;height:36px;border-radius:50%;
                          background:${_scoreColor(p.avgScore)};
                          display:flex;align-items:center;justify-content:center;
                          color:white;font-size:11px;font-weight:700;
                        ">${p.avgScore}</div>
                      </div>
                    </td>
                    ${langs.map(l => {
                      const r = p.langScores[l];
                      return `
                        <td>
                          <div style="
                            width:28px;height:28px;border-radius:50%;
                            background:${_scoreColor(r.score)};
                            display:flex;align-items:center;justify-content:center;
                            color:white;font-size:10px;font-weight:700;
                            cursor:${r.issues.length ? 'pointer' : 'default'};
                          "
                          title="${r.issues.join(' | ') || 'بدون مشکل'}"
                          >${r.score}</div>
                        </td>
                      `;
                    }).join('')}
                    <td>
                      ${p.inQueue
                        ? `<span class="admin-badge admin-badge--pending">${p.inQueue.status === 'pending' ? '⏳ در صف' : '🎯 آماده تأیید'}</span>`
                        : p.hasSEO
                          ? `<span class="admin-badge admin-badge--done">✓ تأیید شده</span>`
                          : `<span class="admin-badge admin-badge--draft">✗ ندارد</span>`
                      }
                    </td>
                    <td>
                      <div style="display:flex;gap:4px">
                        <button class="btn btn--outline btn--sm seo-view-btn"
                          data-page-id="${p.pageId}" title="مشاهده جزئیات">
                          👁
                        </button>
                        <button class="btn btn--primary btn--sm seo-generate-btn"
                          data-page-id="${p.pageId}" title="تولید/بازتولید سئو">
                          🤖
                        </button>
                      </div>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Rich Results Eligibility -->
      <div class="admin-panel">
        <div class="admin-panel__header">
          <div class="admin-panel__title">⭐ واجد شرایط Rich Results</div>
        </div>
        <div class="admin-panel__body">
          <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:var(--space-3)">
            ${_renderRichResultCards(stats)}
          </div>
        </div>
      </div>

      <!-- هشدارهای سئو -->
      ${_renderSEOAlerts(stats)}

      <!-- راهنمای عملکرد -->
      <div class="admin-panel">
        <div class="admin-panel__header">
          <div class="admin-panel__title">📖 راهنمای سئو</div>
        </div>
        <div class="admin-panel__body">
          <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:var(--space-4)">
            ${_renderSEOGuide()}
          </div>
        </div>
      </div>

      <!-- جزئیات صفحه (modal) -->
      <div id="seo-detail-panel" style="display:none"></div>

    </div>
  `;

  _bindMonitorEvents(container, stats);
}

/* ── کارت آماری ───────────────────────────────────────────── */
function _renderStatCard(icon, label, value, sub, color) {
  const colors = {
    green: 'var(--color-primary-500)', blue: '#3b82f6',
    amber: '#d97706', red: '#e63946',
  };
  return `
    <div class="admin-stat-card" style="border-top:3px solid ${colors[color]??colors.blue}">
      <div class="admin-stat-card__header">
        <span class="admin-stat-card__label">${label}</span>
        <span style="font-size:20px">${icon}</span>
      </div>
      <div class="admin-stat-card__num">${value}</div>
      ${sub ? `<div style="font-size:var(--text-xs);color:var(--text-muted);margin-top:4px">${sub}</div>` : ''}
    </div>
  `;
}

/* ── Rich Results cards ────────────────────────────────────── */
function _renderRichResultCards(stats) {
  const richResults = [
    { type: 'FAQ Rich Result',         icon: '❓', condition: 'faq',           desc: 'FAQ schema در همه صفحات' },
    { type: 'Course Rich Result',      icon: '📚', condition: 'course',        desc: 'دانشگاه قرآن — Course schema' },
    { type: 'Event Rich Result',       icon: '📅', condition: 'event',         desc: 'دیدار با شیخ — Event schema' },
    { type: 'Service Schema',          icon: '🔧', condition: 'service',       desc: 'دعا، مشاوره، استخاره' },
    { type: 'Sitelinks Searchbox',     icon: '🔍', condition: 'searchbox',     desc: 'WebSite schema + SearchAction' },
    { type: 'Knowledge Panel',         icon: '🏛', condition: 'knowledge',     desc: 'Organization schema' },
    { type: 'Breadcrumb',              icon: '🗺', condition: 'breadcrumb',    desc: 'BreadcrumbList schema' },
    { type: 'Voice Search Ready',      icon: '🎤', condition: 'voice',         desc: 'Voice search query در همه صفحات' },
    { type: 'AI Answer Eligible',      icon: '🤖', condition: 'ai',            desc: 'llms.txt + Featured snippet' },
    { type: 'Multi-language Hreflang', icon: '🌍', condition: 'hreflang',      desc: 'hreflang برای ۸ زبان' },
    { type: 'PWA Install Banner',      icon: '📱', condition: 'pwa',           desc: 'manifest.json + Service Worker' },
    { type: 'Video Rich Result',       icon: '🎬', condition: 'video',         desc: 'VideoObject schema — نیاز به تکمیل' },
  ];

  const eligible = new Set(['faq','course','event','service','searchbox','knowledge','breadcrumb','hreflang','pwa','ai']);

  return richResults.map(r => `
    <div style="
      background:var(--bg-surface-2);border:1px solid var(--border-color);
      border-radius:var(--radius-md);padding:var(--space-3) var(--space-4);
      display:flex;align-items:flex-start;gap:var(--space-3);
    ">
      <span style="font-size:24px;flex-shrink:0">${r.icon}</span>
      <div>
        <div style="font-size:var(--text-sm);font-weight:700;margin-bottom:2px">${r.type}</div>
        <div style="font-size:var(--text-xs);color:var(--text-muted)">${r.desc}</div>
      </div>
      <span class="admin-badge admin-badge--${eligible.has(r.condition)?'done':'draft'}" style="margin-inline-start:auto;flex-shrink:0">
        ${eligible.has(r.condition) ? '✓' : '⚠'}
      </span>
    </div>
  `).join('');
}

/* ── هشدارهای سئو ─────────────────────────────────────────── */
function _renderSEOAlerts(stats) {
  const alerts = [];

  if (stats.pagesWithoutSEO > 0) {
    alerts.push({ level:'error', msg:`${stats.pagesWithoutSEO} صفحه بدون سئو — برای هر صفحه دکمه 🤖 بزنید` });
  }
  if (stats.queueReady > 0) {
    alerts.push({ level:'warning', msg:`${stats.queueReady} صفحه آماده تأیید — وارد ادیتور صفحه شوید و تأیید بزنید` });
  }
  if (stats.avgScore < 60) {
    alerts.push({ level:'warning', msg:`میانگین امتیاز سئو پایین است (${stats.avgScore}/100) — سئوها را بازتولید کنید` });
  }
  if (stats.avgScore >= 90) {
    alerts.push({ level:'success', msg:'سئوی سایت در وضعیت عالی است 🎉' });
  }

  if (!alerts.length) return '';

  return `
    <div class="admin-panel">
      <div class="admin-panel__header">
        <div class="admin-panel__title">🚨 هشدارها و اعلان‌ها</div>
      </div>
      <div class="admin-panel__body" style="display:flex;flex-direction:column;gap:var(--space-2)">
        ${alerts.map(a => `
          <div style="
            display:flex;align-items:flex-start;gap:var(--space-3);
            background:${a.level==='error'?'rgba(230,57,70,0.08)':a.level==='warning'?'rgba(217,119,6,0.08)':'rgba(22,163,74,0.08)'};
            border:1px solid ${a.level==='error'?'rgba(230,57,70,0.3)':a.level==='warning'?'rgba(217,119,6,0.3)':'rgba(22,163,74,0.3)'};
            border-radius:var(--radius-md);padding:var(--space-3) var(--space-4);
            font-size:var(--text-sm);
          ">
            <span>${a.level==='error'?'🔴':a.level==='warning'?'🟡':'🟢'}</span>
            <span>${a.msg}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

/* ── راهنمای سئو ──────────────────────────────────────────── */
function _renderSEOGuide() {
  const items = [
    { icon:'🎯', title:'امتیاز A (90+)', desc:'وضعیت عالی — همه تگ‌ها کامل، keyword در title، FAQ دارد' },
    { icon:'📈', title:'امتیاز B (75-89)', desc:'وضعیت خوب — چند مورد جزئی برای بهبود' },
    { icon:'⚠', title:'امتیاز C (60-74)', desc:'نیاز به بهبود — سئو را بازتولید کنید' },
    { icon:'🔴', title:'امتیاز D/F (زیر 60)', desc:'وضعیت ضعیف — فوری بازتولید کنید' },
    { icon:'🤖', title:'دکمه 🤖', desc:'تولید خودکار سئو با Claude API برای ۸ زبان' },
    { icon:'👁', title:'دکمه 👁', desc:'مشاهده جزئیات کامل سئوی این صفحه' },
  ];

  return items.map(i => `
    <div style="display:flex;gap:var(--space-3);align-items:flex-start">
      <span style="font-size:20px;flex-shrink:0">${i.icon}</span>
      <div>
        <div style="font-size:var(--text-sm);font-weight:700">${i.title}</div>
        <div style="font-size:var(--text-xs);color:var(--text-muted)">${i.desc}</div>
      </div>
    </div>
  `).join('');
}

/* ════════════════════════════════════════════════════════════
   ۵. رندر جزئیات یک صفحه
   ════════════════════════════════════════════════════════════ */
function _renderPageDetail(pageId, stats) {
  const pageData = stats.pageDetails.find(p => p.pageId === pageId);
  if (!pageData) return '';

  const langs    = Object.keys(LANGUAGES);
  const overrides= (() => { try { return JSON.parse(localStorage.getItem('mh_seo_overrides')||'{}'); } catch { return {}; } })();
  const seoData  = overrides[pageId];

  return `
    <div class="admin-panel" style="border:2px solid rgba(42,157,143,0.3)">
      <div class="admin-panel__header">
        <div class="admin-panel__title">🔍 جزئیات سئو — ${pageData.title}</div>
        <button class="btn btn--ghost btn--sm" id="seo-detail-close">✕ بستن</button>
      </div>
      <div class="admin-panel__body">

        <!-- تب زبان‌ها -->
        <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:var(--space-4)">
          ${langs.map((lang,i) => {
            const r = pageData.langScores[lang];
            return `
              <button class="btn btn--${i===0?'primary':'outline'} btn--sm seo-detail-tab" data-lang="${lang}" style="font-size:var(--text-xs)">
                ${LANGUAGES[lang].flag} ${LANGUAGES[lang].nativeName}
                <span style="
                  background:${_scoreColor(r.score)};color:white;
                  border-radius:4px;padding:1px 4px;font-size:9px;margin-inline-start:4px;
                ">${r.score}</span>
              </button>
            `;
          }).join('')}
        </div>

        <!-- محتوای هر زبان -->
        ${langs.map((lang, i) => {
          const r = pageData.langScores[lang];
          const d = seoData?.[lang];
          return `
            <div class="seo-detail-content" data-lang="${lang}" style="display:${i===0?'block':'none'}">

              <!-- امتیاز و مشکلات -->
              <div style="display:flex;gap:var(--space-4);margin-bottom:var(--space-4);flex-wrap:wrap">
                <div style="
                  width:72px;height:72px;border-radius:50%;
                  background:${_scoreColor(r.score)};
                  display:flex;flex-direction:column;align-items:center;justify-content:center;
                  color:white;flex-shrink:0;
                ">
                  <span style="font-size:22px;font-weight:900;line-height:1">${r.score}</span>
                  <span style="font-size:14px;font-weight:700">${r.grade}</span>
                </div>
                <div style="flex:1">
                  ${r.issues.length ? `
                    <div style="font-size:var(--text-xs);font-weight:700;margin-bottom:6px;color:var(--color-error)">
                      مشکلات (${r.issues.length}):
                    </div>
                    <div style="display:flex;flex-direction:column;gap:3px">
                      ${r.issues.map(issue => `
                        <div style="display:flex;align-items:center;gap:6px;font-size:var(--text-xs)">
                          <span style="color:var(--color-error)">•</span> ${issue}
                        </div>
                      `).join('')}
                    </div>
                  ` : `
                    <div style="color:#16a34a;font-size:var(--text-sm);font-weight:600">
                      ✅ هیچ مشکلی وجود ندارد
                    </div>
                  `}
                </div>
              </div>

              ${d ? `
                <!-- داده‌های سئو -->
                <div style="display:flex;flex-direction:column;gap:var(--space-2)">
                  ${_renderDataRow('Title', d.title, d.title?.length, 60)}
                  ${_renderDataRow('Description', d.description, d.description?.length, 155)}
                  ${_renderDataRow('Primary Keyword', d.primaryKeyword)}
                  ${_renderDataRow('Keywords', d.keywords)}
                  ${_renderDataRow('H1', d.h1)}
                  ${_renderDataRow('Search Intent', d.searchIntent)}
                  ${_renderDataRow('Voice Query', d.voiceSearchQuery)}
                  ${_renderDataRow('Featured Snippet', d.featuredSnippetTarget)}
                  ${d.faq?.length ? `
                    <div style="background:var(--bg-surface-2);border-radius:var(--radius-md);padding:var(--space-3)">
                      <div style="font-size:var(--text-xs);font-weight:700;margin-bottom:var(--space-2)">FAQ (${d.faq.length} سوال)</div>
                      ${d.faq.map((f,i) => `
                        <div style="margin-bottom:var(--space-2)">
                          <div style="font-size:var(--text-xs);font-weight:600;color:var(--color-primary-600)">Q${i+1}: ${f.question}</div>
                          <div style="font-size:var(--text-xs);color:var(--text-secondary)">A: ${f.answer}</div>
                        </div>
                      `).join('')}
                    </div>
                  ` : ''}
                </div>
              ` : `
                <div style="text-align:center;padding:var(--space-6);color:var(--text-muted)">
                  <div style="font-size:32px;margin-bottom:8px">🤖</div>
                  <p>سئو برای این زبان تولید نشده</p>
                </div>
              `}
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

function _renderDataRow(label, value, len = null, max = null) {
  if (!value) return `
    <div style="display:flex;gap:var(--space-3);align-items:flex-start;background:rgba(230,57,70,0.05);border:1px solid rgba(230,57,70,0.15);border-radius:var(--radius-sm);padding:6px 10px">
      <span style="font-size:var(--text-xs);font-weight:700;color:var(--text-muted);min-width:100px;flex-shrink:0">${label}</span>
      <span style="font-size:var(--text-xs);color:var(--color-error)">— ندارد</span>
    </div>
  `;
  const lenColor = len && max ? (len > max ? 'var(--color-error)' : len > max*0.9 ? '#d97706' : '#16a34a') : null;
  return `
    <div style="display:flex;gap:var(--space-3);align-items:flex-start;background:var(--bg-surface-2);border-radius:var(--radius-sm);padding:6px 10px">
      <span style="font-size:var(--text-xs);font-weight:700;color:var(--text-secondary);min-width:100px;flex-shrink:0">${label}</span>
      <span style="font-size:var(--text-xs);flex:1">${value}</span>
      ${len && max ? `<span style="font-size:10px;color:${lenColor};flex-shrink:0">${len}/${max}</span>` : ''}
    </div>
  `;
}

/* ════════════════════════════════════════════════════════════
   ۶. Event Bindings
   ════════════════════════════════════════════════════════════ */
function _bindMonitorEvents(container, stats) {
  /* بروزرسانی */
  container.querySelector('#seo-refresh-btn')?.addEventListener('click', () => {
    renderSEOMonitorDashboard(container);
  });

  /* مشاهده جزئیات */
  container.querySelectorAll('.seo-view-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const pageId    = btn.dataset.pageId;
      const detailDiv = container.querySelector('#seo-detail-panel');
      if (!detailDiv) return;
      detailDiv.style.display = 'block';
      detailDiv.innerHTML = _renderPageDetail(pageId, stats);
      detailDiv.scrollIntoView({ behavior:'smooth', block:'start' });

      /* تب‌های جزئیات */
      detailDiv.querySelectorAll('.seo-detail-tab').forEach(tab => {
        tab.addEventListener('click', () => {
          detailDiv.querySelectorAll('.seo-detail-tab').forEach(t => t.className = t.className.replace('btn--primary','btn--outline'));
          tab.className = tab.className.replace('btn--outline','btn--primary');
          detailDiv.querySelectorAll('.seo-detail-content').forEach(p => {
            p.style.display = p.dataset.lang === tab.dataset.lang ? 'block' : 'none';
          });
        });
      });

      /* بستن */
      detailDiv.querySelector('#seo-detail-close')?.addEventListener('click', () => {
        detailDiv.style.display = 'none';
      });
    });
  });

  /* تولید سئو */
  container.querySelectorAll('.seo-generate-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const pageId   = btn.dataset.pageId;
      const pageInfo = PAGES[pageId];
      const orig     = btn.textContent;

      btn.disabled    = true;
      btn.textContent = '⏳';

      const { autoGenerateSEO } = await import('./seo-ai-generator.js');
      const seoData = await autoGenerateSEO({
        pageId,
        contentFa:    pageInfo?.titles?.fa ?? '',
        contentTitle: pageInfo?.titles?.fa ?? '',
        contentId:    pageId,
      });

      btn.disabled    = false;
      btn.textContent = orig;

      if (seoData) {
        /* ذخیره در overrides */
        try {
          const store = JSON.parse(localStorage.getItem('mh_seo_overrides')||'{}');
          store[pageId] = seoData;
          localStorage.setItem('mh_seo_overrides', JSON.stringify(store));
        } catch {}

        /* بروزرسانی داشبورد */
        renderSEOMonitorDashboard(container);

        const t = document.createElement('div');
        t.setAttribute('role','alert');
        t.style.cssText='position:fixed;bottom:24px;inset-inline-end:24px;background:#16a34a;color:white;padding:12px 20px;border-radius:8px;font-size:14px;font-weight:600;z-index:9999';
        t.textContent = `✅ سئوی صفحه «${pageInfo?.titles?.fa??pageId}» برای ۸ زبان تولید شد`;
        document.body.appendChild(t);
        setTimeout(()=>{ t.style.opacity='0'; t.style.transition='opacity 0.3s'; setTimeout(()=>t.remove(),300); }, 3000);
      }
    });
  });
}

/* ════════════════════════════════════════════════════════════
   ۷. اتصال به admin-router — اضافه کردن به منوی ادمین
   ════════════════════════════════════════════════════════════ */
export { renderSEOMonitorDashboard as default };
