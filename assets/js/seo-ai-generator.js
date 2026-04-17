/**
 * ============================================================
 * FILE: seo-ai-generator.js
 * ROLE: موتور سئوی هوشمند — تولید کامل و خودکار سئو
 *       به ۸ زبان مستقل با Claude API
 * VERSION: 2026.2.0 — Full Autonomous SEO Engine
 * ============================================================
 *
 * جریان کار:
 *   ۱. محتوا در ادمین ذخیره می‌شود
 *   ۲. این موتور خودکار فعال می‌شود
 *   ۳. برای هر ۸ زبان مستقل تولید می‌کند:
 *      - Title tag بهینه (زیر ۶۰ کاراکتر)
 *      - Meta description (زیر ۱۵۵ کاراکتر)
 *      - OG/Twitter tags
 *      - Schema JSON-LD کامل
 *      - FAQ schema (۳ سوال)
 *      - Keywords + Intent clustering
 *      - Voice search + Featured snippet
 *      - Internal linking
 *   ۴. در داشبورد نمایش داده می‌شود
 *   ۵. ادمین نگاه می‌کند و تأیید می‌زند
 *   ۶. سایت آپدیت می‌شود
 * ============================================================
 */

import {
  LANGUAGES, PLATFORM_NAMES, DOMAIN, PAGES,
} from './seo-config.js';

/* ── ثابت‌ها ───────────────────────────────────────────────── */
const SEO_CACHE_KEY    = 'mh_seo_full_cache';
const SEO_OVERRIDE_KEY = 'mh_seo_overrides';
const SEO_QUEUE_KEY    = 'mh_seo_queue';
const CACHE_TTL_MS     = 30 * 24 * 60 * 60 * 1000; /* ۳۰ روز */

/* نقشه نوع صفحه به Schema type */
const PAGE_SCHEMA_MAP = {
  home:         'WebPage',
  quran:        'Course',
  prayer:       'Service',
  consultation: 'Service',
  istikhara:    'Service',
  meeting:      'Event',
  about:        'AboutPage',
  payment:      'WebPage',
  messages:     'WebPage',
};

/* Internal links هر صفحه */
const INTERNAL_LINKS = {
  home:         ['quran', 'prayer', 'consultation', 'meeting'],
  quran:        ['prayer', 'consultation', 'istikhara', 'meeting'],
  prayer:       ['quran', 'consultation', 'istikhara', 'meeting'],
  consultation: ['quran', 'prayer', 'istikhara', 'about'],
  istikhara:    ['consultation', 'prayer', 'quran', 'meeting'],
  meeting:      ['quran', 'prayer', 'consultation', 'about'],
  about:        ['quran', 'prayer', 'consultation', 'meeting'],
};

/* ════════════════════════════════════════════════════════════
   ۱. CLAUDE API CALLER
   ════════════════════════════════════════════════════════════ */
async function _callClaude(userPrompt, systemPrompt, maxTokens = 6000) {
  const apiKey = localStorage.getItem('mh_claude_api_key');
  if (!apiKey) throw new Error('Claude API Key تنظیم نشده');

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model:      'claude-sonnet-4-20250514',
      max_tokens: maxTokens,
      system:     systemPrompt,
      messages:   [{ role: 'user', content: userPrompt }],
    }),
  });

  if (!res.ok) throw new Error(`API Error: ${res.status}`);
  const data = await res.json();
  const text = data.content?.filter(c => c.type === 'text').map(c => c.text).join('').trim();
  if (!text) throw new Error('پاسخ خالی از API');
  return text;
}

function _parseJSON(raw) {
  try {
    return JSON.parse(raw.replace(/```json\n?|\n?```/g, '').trim());
  } catch {
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error('JSON parse failed');
  }
}

/* ════════════════════════════════════════════════════════════
   ۲. SYSTEM PROMPT — بهترین SEO prompt 2026
   ════════════════════════════════════════════════════════════ */
function _buildSystemPrompt() {
  return `You are the world's most advanced multilingual SEO specialist in 2026.

Platform: Baraka Hub (برکت هاب) — Islamic Media Platform from Karbala, Iraq
Domain: ${DOMAIN}
Languages: Persian (fa/RTL), Arabic (ar/RTL), Urdu (ur/RTL), English (en/LTR), Turkish (tr/LTR), Russian (ru/LTR), Azerbaijani (az/LTR), Indonesian (id/LTR)

Your SEO philosophy for 2026:
1. INDEPENDENT optimization per language — cultural SEO, not translation
2. Search intent matching per language market
3. E-E-A-T signals (Experience, Expertise, Authoritativeness, Trustworthiness)
4. GEO (Generative Engine Optimization) for AI search engines (ChatGPT, Perplexity, Claude, Gemini)
5. NLP entity optimization — entities, relationships, semantic context
6. Zero-click optimization (featured snippets, knowledge panels, rich results)
7. Voice search optimization for Islamic queries
8. Passage ranking optimization (Google's passage indexing)

Cultural SEO rules per language:
- Arabic: Classical Arabic, formal Islamic terminology, target Saudi/Iraqi/Egyptian markets
- Persian: Farsi Islamic vocabulary, target Iran (Google + Yandex), avoid Arabic transliteration
- Urdu: Pakistani Islamic expressions, target Pakistan market
- Turkish: Turkish Islamic terminology with Ottoman roots, target Turkey + Central Asia
- Russian: Transliterated Islamic terms + Russian equivalents, target Russia + CIS
- Indonesian: Local Islamic vocabulary (pesantren culture), target Indonesia + Malaysia
- Azerbaijani: Mix of Turkish and Russian Islamic terms, target Azerbaijan

Schema requirements:
- 100% valid JSON-LD
- All required properties for rich results
- Connected to Organization via @id references
- inLanguage property on every schema
- isAccessibleForFree where applicable

Rules:
- Title: max 60 chars, primary keyword near start
- Description: max 155 chars, compelling CTA included
- Return ONLY valid JSON, no explanation, no markdown`;
}

/* ════════════════════════════════════════════════════════════
   ۳. USER PROMPT — جامع‌ترین prompt سئو
   ════════════════════════════════════════════════════════════ */
function _buildFullSEOPrompt({ pageId, contentFa, contentTitle, imageUrl, publishedAt, schemaType, pageInfo }) {
  const internalPages = (INTERNAL_LINKS[pageId] ?? [])
    .map(p => `${DOMAIN}${PAGES[p]?.path ?? ''} — ${PAGES[p]?.titles?.['en'] ?? p}`)
    .join('\n');

  return `Generate complete autonomous SEO package for all 8 languages.

PAGE INFO:
- Page ID: ${pageId}
- Schema type: ${schemaType}
- URL: ${DOMAIN}/${pageId}
- Published: ${publishedAt ?? new Date().toISOString()}
- Image: ${imageUrl ?? DOMAIN + '/assets/img/og-image.jpg'}

CONTENT (Persian/original):
Title: ${contentTitle ?? pageInfo?.titles?.fa ?? ''}
Body: ${contentFa ?? ''}

INTERNAL LINKING CANDIDATES:
${internalPages}

For EACH of the 8 languages, generate independently optimized SEO:

Return ONLY this exact JSON:
{
  "fa": {
    "title": "max 60 chars — primary keyword first — Persian market",
    "description": "max 155 chars — compelling CTA — Persian",
    "ogTitle": "OG title variation",
    "ogDescription": "OG description variation",
    "twitterTitle": "Twitter title max 70 chars",
    "twitterDescription": "Twitter description max 200 chars",
    "keywords": "5-7 comma-separated Persian keywords",
    "primaryKeyword": "single most important keyword",
    "lsiKeywords": "3-5 LSI/semantic keywords",
    "h1": "suggested H1 for page",
    "slug": "persian-seo-friendly-slug",
    "searchIntent": "informational|navigational|transactional|commercial",
    "voiceSearchQuery": "natural question users speak to assistant",
    "featuredSnippetTarget": "short 2-3 sentence answer for featured snippet",
    "entityMentions": ["Karbala", "Imam Hussein", "Quran"],
    "faq": [
      { "question": "...", "answer": "concise 2-3 sentence answer" },
      { "question": "...", "answer": "..." },
      { "question": "...", "answer": "..." }
    ],
    "internalLinks": [
      { "anchor": "link text", "url": "${DOMAIN}/page", "context": "why relevant" }
    ],
    "schema": {
      "@context": "https://schema.org",
      "@type": "${schemaType}",
      "@id": "${DOMAIN}/${pageId}#${schemaType.toLowerCase()}",
      "name": "...",
      "description": "...",
      "url": "${DOMAIN}/${pageId}",
      "inLanguage": "fa",
      "provider": { "@id": "${DOMAIN}/#organization" }
    }
  },
  "ar": { /* same structure, independently optimized for Arabic Islamic markets */ },
  "ur": { /* same structure, independently optimized for Pakistani Islamic market */ },
  "en": { /* same structure, independently optimized for English Islamic market */ },
  "tr": { /* same structure, independently optimized for Turkish Islamic market */ },
  "ru": { /* same structure, independently optimized for Russian-speaking Muslim market */ },
  "az": { /* same structure, independently optimized for Azerbaijani market */ },
  "id": { /* same structure, independently optimized for Indonesian Muslim market */ }
}`;
}

/* ════════════════════════════════════════════════════════════
   ۴. تولید کامل SEO برای یک صفحه — همه ۸ زبان
   ════════════════════════════════════════════════════════════ */
export async function generateFullSEO({
  pageId,
  contentFa,
  contentTitle = null,
  imageUrl     = null,
  publishedAt  = null,
  forceFresh   = false,
  onProgress   = null,
}) {
  const cacheKey = `${pageId}_${(contentFa ?? '').slice(0, 50)}`;

  if (!forceFresh) {
    const cached = _getFromCache(cacheKey);
    if (cached) { onProgress?.('done', 100); return cached; }
  }

  const schemaType = PAGE_SCHEMA_MAP[pageId] ?? 'WebPage';
  const pageInfo   = PAGES[pageId];

  onProgress?.('start', 5);

  const userPrompt = _buildFullSEOPrompt({
    pageId, contentFa, contentTitle, imageUrl,
    publishedAt, schemaType, pageInfo,
  });

  onProgress?.('generating', 15);

  let raw;
  try {
    raw = await _callClaude(userPrompt, _buildSystemPrompt(), 6000);
  } catch (err) {
    console.error('[SEO-AI] خطا در تولید:', err);
    return null;
  }

  onProgress?.('parsing', 85);

  try {
    const parsed = _parseJSON(raw);
    _saveToCache(cacheKey, parsed);
    onProgress?.('done', 100);
    return parsed;
  } catch (err) {
    console.error('[SEO-AI] خطا در parse:', err.message);
    return null;
  }
}

/* ════════════════════════════════════════════════════════════
   ۵. inject SEO به DOM
   ════════════════════════════════════════════════════════════ */
export function injectFullSEO(seoData, lang, pageId) {
  if (!seoData?.[lang] || !document) return;

  const d   = seoData[lang];
  const cfg = LANGUAGES[lang];
  const url = `${DOMAIN}${cfg.urlPrefix}${PAGES[pageId]?.path?.replace('.html','') ?? ''}`;

  document.querySelectorAll('[data-seo-auto]').forEach(el => el.remove());

  const _inject = (html) => {
    const frag = document.createRange().createContextualFragment(html);
    document.head.appendChild(frag);
  };

  /* Title */
  let titleEl = document.querySelector('title');
  if (!titleEl) { titleEl = document.createElement('title'); document.head.appendChild(titleEl); }
  titleEl.textContent = d.title;

  _inject(`
    <meta name="description"      content="${_esc(d.description)}"    data-seo-auto="true"/>
    <meta name="keywords"         content="${_esc(d.keywords)}"        data-seo-auto="true"/>
    <meta name="language"         content="${cfg.englishName}"          data-seo-auto="true"/>
    <meta name="content-language" content="${lang}"                     data-seo-auto="true"/>
    <link rel="canonical"         href="${url}"                         data-seo-auto="true"/>
    <meta property="og:title"       content="${_esc(d.ogTitle ?? d.title)}"              data-seo-auto="true"/>
    <meta property="og:description" content="${_esc(d.ogDescription ?? d.description)}" data-seo-auto="true"/>
    <meta property="og:url"         content="${url}"                                     data-seo-auto="true"/>
    <meta property="og:locale"      content="${cfg.ogLocale}"                            data-seo-auto="true"/>
    <meta property="og:type"        content="website"                                    data-seo-auto="true"/>
    <meta property="og:site_name"   content="${PLATFORM_NAMES[lang]}"                   data-seo-auto="true"/>
    <meta name="twitter:card"        content="summary_large_image"                       data-seo-auto="true"/>
    <meta name="twitter:title"       content="${_esc(d.twitterTitle ?? d.title)}"        data-seo-auto="true"/>
    <meta name="twitter:description" content="${_esc(d.twitterDescription ?? d.description)}" data-seo-auto="true"/>
  `);

  /* hreflang */
  const hreflangs = Object.entries(LANGUAGES).map(([l, c]) =>
    `<link rel="alternate" hreflang="${l}" href="${DOMAIN}${c.urlPrefix}${PAGES[pageId]?.path?.replace('.html','') ?? ''}" data-seo-auto="true"/>`
  ).join('\n');
  _inject(hreflangs);
  _inject(`<link rel="alternate" hreflang="x-default" href="${DOMAIN}${LANGUAGES['fa'].urlPrefix}${PAGES[pageId]?.path?.replace('.html','') ?? ''}" data-seo-auto="true"/>`);

  /* Schema */
  if (d.schema) {
    let el = document.getElementById('schema-page-main');
    if (!el) { el = document.createElement('script'); el.type='application/ld+json'; el.id='schema-page-main'; el.setAttribute('data-seo-auto','true'); document.head.appendChild(el); }
    el.textContent = JSON.stringify(d.schema, null, 2);
  }

  /* FAQ Schema */
  if (d.faq?.length) {
    let el = document.getElementById('schema-faq-auto');
    if (!el) { el = document.createElement('script'); el.type='application/ld+json'; el.id='schema-faq-auto'; el.setAttribute('data-seo-auto','true'); document.head.appendChild(el); }
    el.textContent = JSON.stringify({
      '@context':'https://schema.org', '@type':'FAQPage',
      mainEntity: d.faq.map(f => ({ '@type':'Question', name:f.question, acceptedAnswer:{ '@type':'Answer', text:f.answer } })),
    }, null, 2);
  }
}

function _esc(s) { return (s??'').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

/* ════════════════════════════════════════════════════════════
   ۶. QUEUE SYSTEM
   ════════════════════════════════════════════════════════════ */
export const SEOQueue = {
  add(item) {
    try {
      const q = JSON.parse(localStorage.getItem(SEO_QUEUE_KEY)||'[]');
      if (!q.find(i=>i.id===item.id)) { q.push({...item, addedAt:Date.now(), status:'pending'}); localStorage.setItem(SEO_QUEUE_KEY, JSON.stringify(q)); }
    } catch {}
  },
  getAll()     { try { return JSON.parse(localStorage.getItem(SEO_QUEUE_KEY)||'[]'); } catch { return []; } },
  getPending() { return this.getAll().filter(i=>i.status==='pending'); },
  getReady()   { return this.getAll().filter(i=>i.status==='ready'); },
  updateStatus(id, status, data=null) {
    try {
      const q=this.getAll(); const idx=q.findIndex(i=>i.id===id);
      if (idx!==-1) { q[idx].status=status; q[idx].updatedAt=Date.now(); if(data) q[idx].seoData=data; localStorage.setItem(SEO_QUEUE_KEY, JSON.stringify(q)); }
    } catch {}
  },
  remove(id) { try { const q=this.getAll().filter(i=>i.id!==id); localStorage.setItem(SEO_QUEUE_KEY,JSON.stringify(q)); } catch {} },
};

/* ════════════════════════════════════════════════════════════
   ۷. AUTO-TRIGGER — خودکار فعال می‌شود
   ════════════════════════════════════════════════════════════ */
export async function autoGenerateSEO({ pageId, contentFa, contentTitle, contentId, imageUrl, publishedAt, onProgress }) {
  SEOQueue.add({ id:contentId, pageId, contentFa, contentTitle, status:'pending' });
  onProgress?.('start', 5);
  const seoData = await generateFullSEO({ pageId, contentFa, contentTitle, imageUrl, publishedAt, onProgress });
  if (seoData) { SEOQueue.updateStatus(contentId, 'ready', seoData); return seoData; }
  else { SEOQueue.updateStatus(contentId, 'failed'); return null; }
}

/* ════════════════════════════════════════════════════════════
   ۸. داشبورد ادمین — نمایش + نظارت + تأیید
   ════════════════════════════════════════════════════════════ */
export function renderSEODashboard(container, { contentId, pageId, contentFa, contentTitle, onApprove }) {
  if (!container) return;

  const existing = _getFromCache(`${pageId}_${(contentFa??'').slice(0,50)}`);

  container.innerHTML = `
    <div class="admin-panel" style="margin-top:var(--space-5);border:2px solid rgba(42,157,143,0.3)">
      <div class="admin-panel__header" style="background:linear-gradient(135deg,rgba(42,157,143,0.12),rgba(42,157,143,0.04))">
        <div class="admin-panel__title" style="display:flex;align-items:center;gap:8px">
          <span>🔍</span> سئوی هوشمند — ۸ زبان مستقل
        </div>
        <div style="display:flex;gap:var(--space-2);align-items:center">
          ${existing ? '<span class="admin-badge admin-badge--done">✓ موجود در کش</span>' : ''}
          <button class="btn btn--primary btn--sm" id="seo-gen-btn" type="button">🤖 تولید خودکار</button>
        </div>
      </div>
      <div class="admin-panel__body">

        <!-- Progress -->
        <div id="seo-progress-wrap" style="display:none;margin-bottom:var(--space-4)">
          <div id="seo-progress-lbl" style="font-size:var(--text-sm);color:var(--text-secondary);margin-bottom:var(--space-2)">در حال تولید...</div>
          <div style="background:var(--bg-surface-2);border-radius:var(--radius-full);height:10px;overflow:hidden">
            <div id="seo-progress-bar" style="height:100%;background:linear-gradient(90deg,var(--color-primary-500),var(--color-secondary-500));width:0%;transition:width 0.4s ease;border-radius:var(--radius-full)"></div>
          </div>
        </div>

        <!-- نتایج -->
        <div id="seo-results" style="display:${existing?'block':'none'}">

          <!-- تب زبان‌ها -->
          <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:var(--space-4);padding-bottom:var(--space-3);border-bottom:1px solid var(--border-color)">
            ${Object.entries(LANGUAGES).map(([lang,cfg],i)=>`
              <button class="btn btn--${i===0?'primary':'outline'} btn--sm seo-tab" data-lang="${lang}" style="font-size:var(--text-xs)">
                ${cfg.flag} ${cfg.nativeName}
              </button>
            `).join('')}
          </div>

          <!-- پنل هر زبان -->
          ${Object.entries(LANGUAGES).map(([lang,cfg],i)=>`
            <div class="seo-panel" data-lang="${lang}" style="display:${i===0?'block':'none'}">

              <div class="grid grid--2" style="gap:var(--space-3);margin-bottom:var(--space-4)">
                <div class="admin-field">
                  <label class="admin-label">Title <span id="tc-${lang}" style="font-size:10px;font-weight:400;color:var(--text-muted)">0/60</span></label>
                  <input type="text" class="admin-input s-title" data-lang="${lang}" id="st-${lang}" dir="${cfg.dir}" maxlength="60"/>
                </div>
                <div class="admin-field">
                  <label class="admin-label">Primary Keyword</label>
                  <input type="text" class="admin-input" id="spk-${lang}" dir="${cfg.dir}"/>
                </div>
                <div class="admin-field" style="grid-column:1/-1">
                  <label class="admin-label">Meta Description <span id="dc-${lang}" style="font-size:10px;font-weight:400;color:var(--text-muted)">0/155</span></label>
                  <textarea class="admin-textarea s-desc" data-lang="${lang}" id="sd-${lang}" dir="${cfg.dir}" rows="2" maxlength="155"></textarea>
                </div>
                <div class="admin-field">
                  <label class="admin-label">Keywords</label>
                  <input type="text" class="admin-input" id="sk-${lang}" dir="${cfg.dir}"/>
                </div>
                <div class="admin-field">
                  <label class="admin-label">H1 Suggestion</label>
                  <input type="text" class="admin-input" id="sh1-${lang}" dir="${cfg.dir}"/>
                </div>
                <div class="admin-field">
                  <label class="admin-label">Search Intent</label>
                  <input type="text" class="admin-input" id="si-${lang}" dir="ltr" readonly style="color:var(--color-primary-600);font-weight:600"/>
                </div>
                <div class="admin-field">
                  <label class="admin-label">Voice Search Query</label>
                  <input type="text" class="admin-input" id="sv-${lang}" dir="${cfg.dir}"/>
                </div>
                <div class="admin-field" style="grid-column:1/-1">
                  <label class="admin-label">Featured Snippet (هدف rich result)</label>
                  <textarea class="admin-textarea" id="ss-${lang}" dir="${cfg.dir}" rows="2"></textarea>
                </div>
              </div>

              <!-- FAQ -->
              <div style="margin-bottom:var(--space-4)">
                <div style="font-size:var(--text-sm);font-weight:700;margin-bottom:var(--space-2)">❓ FAQ Schema</div>
                <div id="sf-${lang}" style="display:flex;flex-direction:column;gap:var(--space-2)"></div>
              </div>

              <!-- Schema preview -->
              <details style="margin-bottom:var(--space-2)">
                <summary style="cursor:pointer;font-size:var(--text-sm);font-weight:600;color:var(--color-primary-600)">🔧 Schema JSON-LD</summary>
                <pre id="ssch-${lang}" style="font-size:10px;background:var(--bg-surface-2);border-radius:var(--radius-md);padding:var(--space-3);overflow-x:auto;direction:ltr;max-height:180px;margin-top:6px"></pre>
              </details>
            </div>
          `).join('')}

          <!-- تأیید نهایی -->
          <div style="margin-top:var(--space-5);padding-top:var(--space-4);border-top:2px solid rgba(42,157,143,0.2)">
            <div style="background:rgba(42,157,143,0.08);border:1px solid rgba(42,157,143,0.2);border-radius:var(--radius-md);padding:var(--space-3) var(--space-4);font-size:var(--text-sm);color:var(--text-secondary);margin-bottom:var(--space-3);display:flex;gap:8px">
              <span>✅</span>
              <span>سئوی ۸ زبان آماده است. بررسی کنید و تأیید بزنید تا سایت آپدیت شود.</span>
            </div>
            <button class="btn btn--primary btn--lg" id="seo-approve-btn" type="button" style="min-width:220px">
              ✅ تأیید و انتشار سئو
            </button>
          </div>
        </div>

      </div>
    </div>
  `;

  if (existing) _fill(container, existing);
  _bindDashboardEvents(container, { contentId, pageId, contentFa, contentTitle, onApprove });
}

function _bindDashboardEvents(container, { contentId, pageId, contentFa, contentTitle, onApprove }) {
  /* تب‌ها */
  container.querySelectorAll('.seo-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.seo-tab').forEach(b => b.className = b.className.replace('btn--primary','btn--outline'));
      btn.className = btn.className.replace('btn--outline','btn--primary');
      container.querySelectorAll('.seo-panel').forEach(p => { p.style.display = p.dataset.lang===btn.dataset.lang ? 'block':'none'; });
    });
  });

  /* شمارنده */
  container.querySelectorAll('.s-title,.s-desc').forEach(inp => {
    const isTitle = inp.classList.contains('s-title');
    const max     = isTitle ? 60 : 155;
    const lang    = inp.dataset.lang;
    const cntId   = isTitle ? `tc-${lang}` : `dc-${lang}`;
    const update  = () => {
      const el  = container.querySelector(`#${cntId}`);
      const len = inp.value.length;
      if (!el) return;
      el.textContent = `${len}/${max}`;
      el.style.color = len>max ? 'var(--color-error)' : len>max*0.9 ? '#d97706' : 'var(--text-muted)';
    };
    inp.addEventListener('input', update);
  });

  /* تولید خودکار */
  container.querySelector('#seo-gen-btn')?.addEventListener('click', async () => {
    const pw  = container.querySelector('#seo-progress-wrap');
    const pb  = container.querySelector('#seo-progress-bar');
    const pl  = container.querySelector('#seo-progress-lbl');
    const res = container.querySelector('#seo-results');
    const btn = container.querySelector('#seo-gen-btn');

    if (btn) { btn.disabled=true; btn.textContent='⏳ در حال تولید...'; }
    if (pw) pw.style.display='block';

    const steps = { start:'شروع تولید سئو...', generating:'تولید سئو برای ۸ زبان مستقل...', parsing:'پردازش و اعتبارسنجی...', done:'✓ سئو با موفقیت تولید شد' };
    const seoData = await autoGenerateSEO({
      pageId, contentFa, contentTitle, contentId,
      onProgress: (step, pct) => {
        if (pb) pb.style.width=`${pct}%`;
        if (pl) pl.textContent = steps[step]??step;
      },
    });

    if (btn) { btn.disabled=false; btn.textContent='🔄 تولید مجدد'; }
    if (seoData) { _fill(container, seoData); if(res) res.style.display='block'; }
    else { if(pl) pl.style.color='var(--color-error)'; if(pl) pl.textContent='❌ خطا — Claude API Key را بررسی کنید'; }
  });

  /* تأیید */
  container.querySelector('#seo-approve-btn')?.addEventListener('click', () => {
    const approved = _collect(container);
    try {
      const store = JSON.parse(localStorage.getItem(SEO_OVERRIDE_KEY)||'{}');
      store[contentId] = approved;
      localStorage.setItem(SEO_OVERRIDE_KEY, JSON.stringify(store));
      SEOQueue.remove(contentId);
    } catch {}
    onApprove?.(approved);

    const t = document.createElement('div');
    t.setAttribute('role','alert');
    t.style.cssText='position:fixed;bottom:24px;inset-inline-end:24px;background:#16a34a;color:white;padding:14px 24px;border-radius:10px;font-size:14px;font-weight:700;z-index:9999;box-shadow:0 8px 32px rgba(0,0,0,0.3)';
    t.textContent='✅ سئوی ۸ زبان تأیید و در سایت منتشر شد';
    document.body.appendChild(t);
    setTimeout(()=>{ t.style.opacity='0'; t.style.transition='opacity 0.3s'; setTimeout(()=>t.remove(),300); }, 3500);
  });
}

function _fill(container, data) {
  Object.keys(LANGUAGES).forEach(lang => {
    const d = data[lang]; if (!d) return;
    const s  = (id,v) => { const el=container.querySelector(`#${id}`); if(el) el.value=v??''; };
    const st = (id,v) => { const el=container.querySelector(`#${id}`); if(el) el.textContent=v??''; };
    s(`st-${lang}`,  d.title);
    s(`sd-${lang}`,  d.description);
    s(`sk-${lang}`,  d.keywords);
    s(`sh1-${lang}`, d.h1);
    s(`spk-${lang}`, d.primaryKeyword);
    s(`si-${lang}`,  d.searchIntent);
    s(`sv-${lang}`,  d.voiceSearchQuery);
    s(`ss-${lang}`,  d.featuredSnippetTarget);
    st(`tc-${lang}`, `${(d.title??'').length}/60`);
    st(`dc-${lang}`, `${(d.description??'').length}/155`);

    const faqEl = container.querySelector(`#sf-${lang}`);
    if (faqEl && d.faq?.length) {
      faqEl.innerHTML = d.faq.map((f,i)=>`
        <div style="background:var(--bg-surface-2);border-radius:var(--radius-md);padding:var(--space-3)">
          <div class="admin-field" style="margin-bottom:var(--space-2)">
            <label class="admin-label" style="font-size:10px">Q${i+1}</label>
            <input type="text" class="admin-input sfq-${lang}" data-idx="${i}" value="${_esc(f.question)}" dir="${LANGUAGES[lang].dir}" style="font-size:var(--text-xs)"/>
          </div>
          <div class="admin-field">
            <label class="admin-label" style="font-size:10px">A${i+1}</label>
            <textarea class="admin-textarea sfa-${lang}" data-idx="${i}" dir="${LANGUAGES[lang].dir}" rows="2" style="font-size:var(--text-xs)">${_esc(f.answer)}</textarea>
          </div>
        </div>`).join('');
    }

    const schEl = container.querySelector(`#ssch-${lang}`);
    if (schEl && d.schema) schEl.textContent = JSON.stringify(d.schema, null, 2);
  });
}

function _collect(container) {
  const result = {};
  Object.keys(LANGUAGES).forEach(lang => {
    const g = id => container.querySelector(`#${id}`)?.value?.trim()??'';
    const faqs = [];
    container.querySelectorAll(`.sfq-${lang}`).forEach((el,i)=>{
      const a = container.querySelector(`.sfa-${lang}[data-idx="${i}"]`);
      faqs.push({ question:el.value.trim(), answer:a?.value?.trim()??'' });
    });
    result[lang] = {
      title:g(`st-${lang}`), description:g(`sd-${lang}`), keywords:g(`sk-${lang}`),
      h1:g(`sh1-${lang}`), primaryKeyword:g(`spk-${lang}`), searchIntent:g(`si-${lang}`),
      voiceSearchQuery:g(`sv-${lang}`), featuredSnippetTarget:g(`ss-${lang}`), faq:faqs,
    };
  });
  return result;
}

/* ════════════════════════════════════════════════════════════
   ۹. CACHE MANAGER
   ════════════════════════════════════════════════════════════ */
function _getFromCache(key) {
  try {
    const c=JSON.parse(localStorage.getItem(SEO_CACHE_KEY)||'{}');
    const e=c[key]; if(!e||Date.now()-e.ts>CACHE_TTL_MS) return null; return e.data;
  } catch { return null; }
}

function _saveToCache(key, data) {
  try {
    const c=JSON.parse(localStorage.getItem(SEO_CACHE_KEY)||'{}');
    c[key]={data,ts:Date.now()};
    const keys=Object.keys(c);
    if(keys.length>500) keys.sort((a,b)=>c[a].ts-c[b].ts).slice(0,keys.length-500).forEach(k=>delete c[k]);
    localStorage.setItem(SEO_CACHE_KEY,JSON.stringify(c));
  } catch {}
}

/* ════════════════════════════════════════════════════════════
   ۱۰. دریافت SEO override
   ════════════════════════════════════════════════════════════ */
export function getSEOOverride(contentId, lang) {
  try { return JSON.parse(localStorage.getItem(SEO_OVERRIDE_KEY)||'{}')?.[contentId]?.[lang]??null; }
  catch { return null; }
}

export function getAllSEOOverrides(contentId) {
  try { return JSON.parse(localStorage.getItem(SEO_OVERRIDE_KEY)||'{}')?.[contentId]??null; }
  catch { return null; }
}
