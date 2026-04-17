/**
 * ============================================================
 * FILE: admin-complete.js
 * ROLE: داشبورد ادمین — نسخه کامل با پیام‌ها، جایزه، دوبله صدا
 * PROJECT: MediaHub — پلتفرم رسانه‌ای کربلا
 * VERSION: 2.0.0
 * این فایل admin.js را تکمیل می‌کند — هر دو با هم import شوند
 * ============================================================
 */

import { PrizeManager } from './auth-extended.js';
import { renderMessagesPage, bindMessagesEvents } from './admin-messages.js';

const LANG_INFO = {
  fa: { name:'فارسی',   flag:'🇮🇷' },
  ar: { name:'عربی',    flag:'🇸🇦' },
  ur: { name:'اردو',    flag:'🇵🇰' },
  az: { name:'آذری',    flag:'🇦🇿' },
  tr: { name:'ترکی',    flag:'🇹🇷' },
  ru: { name:'روسی',    flag:'🇷🇺' },
  en: { name:'انگلیسی', flag:'🇺🇸' },
};

/* ────────────────────────────────────────────────────────────
   PRIZE ADMIN PANEL (کامل‌شده)
   ──────────────────────────────────────────────────────────── */
export function renderPrizePage() {
  const config = PrizeManager.getConfig();
  const stats  = PrizeManager.getStats();

  return `
    <div>
      <div class="admin-page-header">
        <div>
          <h1 class="admin-page-title">
            <span class="admin-page-title__icon">🎁</span>
            سیستم جایزه
          </h1>
          <p class="admin-page-desc">جایزه هر زمان که بخواهید فعال یا غیرفعال می‌کنید</p>
        </div>
      </div>

      <!-- آمار جوایز -->
      <div class="admin-stats-grid" style="margin-bottom:var(--space-5)">
        <div class="admin-stat-card admin-stat-card--green">
          <div class="admin-stat-card__header">
            <span class="admin-stat-card__label">کل کاربران</span>
            <div class="admin-stat-card__icon">👥</div>
          </div>
          <div class="admin-stat-card__num">${stats.total}</div>
        </div>
        <div class="admin-stat-card admin-stat-card--amber">
          <div class="admin-stat-card__header">
            <span class="admin-stat-card__label">برندگان جایزه</span>
            <div class="admin-stat-card__icon">🏆</div>
          </div>
          <div class="admin-stat-card__num">${stats.winners}</div>
        </div>
        <div class="admin-stat-card admin-stat-card--purple">
          <div class="admin-stat-card__header">
            <span class="admin-stat-card__label">اعضای اشتراکی</span>
            <div class="admin-stat-card__icon">⭐</div>
          </div>
          <div class="admin-stat-card__num">${stats.premium}</div>
        </div>
      </div>

      <!-- تنظیمات جایزه -->
      <div class="admin-panel">
        <div class="admin-panel__header">
          <div class="admin-panel__title">⚙️ تنظیم جایزه جدید</div>
          <span class="admin-badge admin-badge--${config?.active ? 'active' : 'draft'}">
            ${config?.active ? 'جایزه فعال است' : 'جایزه غیرفعال'}
          </span>
        </div>
        <div class="admin-panel__body">

          <!-- وضعیت فعال/غیرفعال -->
          <div class="admin-field">
            <label class="admin-toggle" for="prize-toggle" aria-label="فعال بودن جایزه">
              <input type="checkbox" id="prize-toggle" ${config?.active ? 'checked' : ''}/>
              <div class="admin-toggle__track"><div class="admin-toggle__thumb"></div></div>
              <span class="admin-toggle__label">جایزه فعال باشد</span>
            </label>
          </div>

          <div class="grid grid--2" style="gap:var(--space-5);margin-top:var(--space-4)">

            <!-- تعداد عضویت -->
            <div class="admin-field">
              <label class="admin-label" for="prize-threshold">
                به ازای هر چند نفر عضو جدید
                <span class="admin-label-hint">ادمین تعیین می‌کند</span>
              </label>
              <input type="number" class="admin-input" id="prize-threshold"
                value="${config?.threshold ?? ''}"
                min="1" placeholder="مثلاً: ۱۰۰"/>
            </div>

            <!-- مدت اشتراک -->
            <div class="admin-field">
              <label class="admin-label" for="prize-duration">مدت اشتراک رایگان (ماه)</label>
              <input type="number" class="admin-input" id="prize-duration"
                value="${config?.duration ?? 1}"
                min="1" max="12"/>
            </div>

            <!-- قسمت جایزه -->
            <div class="admin-field">
              <label class="admin-label" for="prize-section">قسمت مشمول جایزه</label>
              <select class="admin-input" id="prize-section" aria-label="قسمت جایزه">
                <option value="quran"  ${config?.section==='quran'  ? 'selected':''}>📖 دانشگاه قرآن</option>
                <option value="prayer" ${config?.section==='prayer' ? 'selected':''}>🤲 سفارش دعا</option>
                <option value="all"    ${config?.section==='all'    ? 'selected':''}>🌟 همه قسمت‌ها</option>
              </select>
            </div>

          </div>

          <!-- متن اعلان جایزه در سایت -->
          <div class="admin-field">
            <label class="admin-label" for="prize-announcement">
              متن اعلان جایزه در سایت و اپ
              <span class="admin-label-hint">کاربران این متن را می‌بینند — AI ترجمه می‌کند</span>
            </label>
            <textarea class="admin-textarea" id="prize-announcement" rows="3"
              placeholder="به ازای هر ۱۰۰ نفر عضو جدید، یک ماه اشتراک رایگان قرآن دریافت کنید..."
              aria-label="متن اعلان جایزه"
            >${config?.announcement ?? ''}</textarea>
          </div>

          <button class="btn btn--primary btn--lg" id="save-prize-btn" type="button">
            💾 ذخیره تنظیمات جایزه
          </button>
        </div>
      </div>

      <!-- تاریخچه برندگان -->
      <div class="admin-table-wrap" style="margin-top:var(--space-5)">
        <div class="admin-table-header">
          <div class="admin-table-title">🏆 برندگان جایزه</div>
        </div>
        ${_renderPrizeWinners()}
      </div>

    </div>
  `;
}

function _renderPrizeWinners() {
  try {
    const users   = JSON.parse(localStorage.getItem('mh_all_users') || '[]');
    const winners = users.filter(u => u.prizeWon);
    if (!winners.length) {
      return `<div style="text-align:center;padding:var(--space-8);color:var(--text-muted)">هنوز برنده‌ای نبوده است</div>`;
    }
    return `
      <div style="overflow-x:auto">
        <table class="admin-table">
          <thead><tr><th>نام</th><th>زبان</th><th>کشور</th><th>قسمت</th><th>تاریخ عضویت</th></tr></thead>
          <tbody>
            ${winners.map(w => `
              <tr>
                <td>${w.name}</td>
                <td>${LANG_INFO[w.lang]?.flag ?? '🌐'} ${LANG_INFO[w.lang]?.name ?? '—'}</td>
                <td>${w.country ?? '—'}</td>
                <td>${w.prizeSection ?? '—'}</td>
                <td>${new Date(w.joinedAt).toLocaleDateString('fa-IR')}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  } catch { return ''; }
}

/* ── bind prize events ── */
export function bindPrizeEvents(container) {
  container.querySelector('#save-prize-btn')?.addEventListener('click', () => {
    const threshold    = parseInt(document.getElementById('prize-threshold')?.value);
    const duration     = parseInt(document.getElementById('prize-duration')?.value);
    const section      = document.getElementById('prize-section')?.value;
    const announcement = document.getElementById('prize-announcement')?.value;
    const active       = document.getElementById('prize-toggle')?.checked;

    if (!threshold || threshold < 1) {
      alert('لطفاً تعداد عضویت را وارد کنید'); return;
    }

    PrizeManager.setConfig({ threshold, duration, section, announcement, active });
    _showToast('✓ تنظیمات جایزه ذخیره شد');
  });

  container.querySelector('#prize-toggle')?.addEventListener('change', (e) => {
    PrizeManager.toggle(e.target.checked);
    _showToast(e.target.checked ? '✓ جایزه فعال شد' : '✓ جایزه غیرفعال شد');
  });
}

/* ────────────────────────────────────────────────────────────
   VOICE DUBBING SECTION (در صفحه تدبر قرآن)
   ──────────────────────────────────────────────────────────── */
export function renderVoiceDubbingPanel() {
  return `
    <div class="admin-panel" style="margin-top:var(--space-5)">
      <div class="admin-panel__header">
        <div class="admin-panel__title">
          🎙️ مدیریت دوبله صدا
          <span style="font-size:var(--text-sm);font-weight:normal;color:var(--text-muted)">— ElevenLabs AI</span>
        </div>
        <span class="admin-badge admin-badge--draft" id="voice-api-status">API وصل نیست</span>
      </div>
      <div class="admin-panel__body">

        <!-- وضعیت API -->
        <div style="
          background:var(--bg-surface-2);
          border:1px solid var(--border-color);
          border-radius:var(--radius-lg);
          padding:var(--space-5);
          margin-bottom:var(--space-5);
          display:flex;align-items:center;gap:var(--space-4);flex-wrap:wrap;
        ">
          <div style="font-size:40px">🤖</div>
          <div style="flex:1">
            <div style="font-weight:var(--weight-bold);margin-bottom:4px">ElevenLabs Voice AI</div>
            <div style="font-size:var(--text-sm);color:var(--text-muted)">
              برای دوبله صدای استاد به ۶ زبان، API Key لازم است
            </div>
          </div>
          <a href="https://elevenlabs.io" target="_blank" rel="noopener" class="btn btn--outline btn--sm">
            ثبت‌نام در ElevenLabs ↗
          </a>
        </div>

        <!-- زبان‌هایی که دوبله می‌شوند -->
        <div class="admin-field">
          <label class="admin-label">وضعیت دوبله به هر زبان</label>
          <div class="grid grid--2" style="gap:var(--space-3)">
            ${[
              { lang:'ar', label:'عربی',    status:'pending' },
              { lang:'ur', label:'اردو',    status:'pending' },
              { lang:'az', label:'آذری',    status:'pending' },
              { lang:'tr', label:'ترکی',    status:'pending' },
              { lang:'ru', label:'روسی',    status:'pending' },
              { lang:'en', label:'انگلیسی', status:'pending' },
            ].map(l => `
              <div style="
                display:flex;align-items:center;gap:var(--space-3);
                padding:var(--space-3) var(--space-4);
                background:var(--bg-surface-2);
                border:1px solid var(--border-color);
                border-radius:var(--radius-md);
              ">
                <span style="font-size:22px">${LANG_INFO[l.lang]?.flag}</span>
                <span style="flex:1;font-size:var(--text-sm)">${l.label}</span>
                <span class="admin-badge admin-badge--${l.status==='ready'?'active':'draft'}">
                  ${l.status==='ready' ? '✓ آماده' : 'در انتظار API'}
                </span>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- توجه: فارسی دوبله نمی‌شود -->
        <div style="
          background:rgba(42,157,143,0.08);
          border:1px solid rgba(42,157,143,0.2);
          border-radius:var(--radius-md);
          padding:var(--space-4) var(--space-5);
          font-size:var(--text-sm);
          color:var(--color-primary-700);
          display:flex;align-items:center;gap:var(--space-3);
        ">
          <span style="font-size:20px">ℹ️</span>
          <span>
            🇮🇷 فارسی (ایران، افغانستان، تاجیکستان) — صوت اصلی استاد ارسال می‌شود
            <br/>
            🌍 سایر زبان‌ها — AI دوبله می‌کند (بعد از وصل شدن API)
          </span>
        </div>

      </div>
    </div>
  `;
}

/* ────────────────────────────────────────────────────────────
   USERS ANALYTICS PAGE (کامل‌شده با نقشه)
   ──────────────────────────────────────────────────────────── */
export function renderUsersAnalytics() {
  /* ── داده‌ها ───────────────────────────────────────────── */
  const users = (() => {
    try { return JSON.parse(localStorage.getItem('mh_all_users') || '[]'); } catch { return []; }
  })();

  /* نقشه کشورها */
  const COUNTRY_NAMES = {
    IR:'ایران', IQ:'عراق', SA:'عربستان سعودی', AE:'امارات', KW:'کویت',
    BH:'بحرین', QA:'قطر', OM:'عمان', YE:'یمن', SY:'سوریه',
    LB:'لبنان', JO:'اردن', PS:'فلسطین', IL:'اسرائیل',
    EG:'مصر', LY:'لیبی', TN:'تونس', DZ:'الجزایر', MA:'مراکش',
    SD:'سودان', SO:'سومالی', ET:'اتیوپی', NG:'نیجریه', GH:'غنا',
    KE:'کنیا', TZ:'تانزانیا', ZA:'آفریقای جنوبی', EG:'مصر',
    PK:'پاکستان', IN:'هند', BD:'بنگلادش', LK:'سریلانکا', NP:'نپال',
    AF:'افغانستان', MM:'میانمار', TH:'تایلند', VN:'ویتنام',
    MY:'مالزی', SG:'سنگاپور', ID:'اندونزی', PH:'فیلیپین',
    CN:'چین', JP:'ژاپن', KR:'کره جنوبی', MN:'مغولستان',
    TJ:'تاجیکستان', UZ:'ازبکستان', TM:'ترکمنستان', KZ:'قزاقستان',
    KG:'قرقیزستان', AZ:'آذربایجان', GE:'گرجستان', AM:'ارمنستان', TR:'ترکیه',
    RU:'روسیه', UA:'اوکراین', BY:'بلاروس', PL:'لهستان', DE:'آلمان',
    FR:'فرانسه', GB:'انگلستان', IT:'ایتالیا', ES:'اسپانیا', NL:'هلند',
    BE:'بلژیک', SE:'سوئد', NO:'نروژ', FI:'فنلاند', DK:'دانمارک',
    AT:'اتریش', CH:'سوئیس', GR:'یونان', PT:'پرتغال',
    US:'آمریکا', CA:'کانادا', MX:'مکزیک', BR:'برزیل', AR:'آرژانتین',
    CO:'کلمبیا', CL:'شیلی', PE:'پرو', VE:'ونزوئلا',
    AU:'استرالیا', NZ:'نیوزیلند',
  };
  const _cname = c => { if (!c) return '—'; const n = COUNTRY_NAMES[c.toUpperCase()]; return n ? `${c.toUpperCase()} ${n}` : c.toUpperCase(); };

  /* آمار زبان */
  const byLang    = {};
  users.forEach(u => { byLang[u.lang ?? 'fa'] = (byLang[u.lang ?? 'fa'] ?? 0) + 1; });
  const totalLang = Object.values(byLang).reduce((a,b)=>a+b,0) || 1;

  /* آمار کشور */
  const byCountry = {};
  users.forEach(u => { if (u.country) { const k = u.country.toUpperCase(); byCountry[k] = (byCountry[k]??0)+1; } });

  /* آمار پلتفرم */
  const byPlatform = { web:0, pwa:0, apk:0 };
  users.forEach(u => {
    const p = (u.platform || u.source || 'web').toLowerCase();
    if (p.includes('apk') || p.includes('android') || p.includes('twa')) byPlatform.apk++;
    else if (p.includes('pwa') || p.includes('installed') || p.includes('standalone')) byPlatform.pwa++;
    else byPlatform.web++;
  });

  /* آمار پلتفرم × کشور */
  const byCountryPlatform = {};
  users.forEach(u => {
    if (!u.country) return;
    const k = u.country.toUpperCase();
    const p = (u.platform || u.source || 'web').toLowerCase();
    if (!byCountryPlatform[k]) byCountryPlatform[k] = { web:0, pwa:0, apk:0 };
    if (p.includes('apk') || p.includes('android') || p.includes('twa')) byCountryPlatform[k].apk++;
    else if (p.includes('pwa') || p.includes('installed') || p.includes('standalone')) byCountryPlatform[k].pwa++;
    else byCountryPlatform[k].web++;
  });

  /* ثبت‌نام ۷ روز */
  const daily = {};
  const now   = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now); d.setDate(d.getDate() - i);
    const key = d.toLocaleDateString('fa-IR');
    daily[key] = users.filter(u => new Date(u.joinedAt).toDateString() === d.toDateString()).length;
  }
  const maxDay = Math.max(...Object.values(daily), 1);

  const totalCountries = Object.keys(byCountry).length;
  const sortedCountries = Object.entries(byCountry).sort((a,b)=>b[1]-a[1]);

  return `
    <div style="display:flex;flex-direction:column;gap:var(--space-5)">

      <!-- هدر -->
      <div class="admin-page-header">
        <div>
          <h1 class="admin-page-title"><span class="admin-page-title__icon">👥</span> تحلیل کاربران</h1>
          <p class="admin-page-desc">مجموع ${users.length.toLocaleString()} کاربر از ${totalCountries} کشور</p>
        </div>
        <button class="btn btn--outline btn--sm" id="export-users-btn">📥 خروجی Excel</button>
      </div>

      <!-- کارت‌های کلی -->
      <div class="admin-stats-grid">
        <div class="admin-stat-card" style="border-top:3px solid #2a9d8f">
          <div class="admin-stat-card__header"><span class="admin-stat-card__label">👥 کل کاربران</span></div>
          <div class="admin-stat-card__num">${users.length.toLocaleString()}</div>
        </div>
        <div class="admin-stat-card" style="border-top:3px solid #3b82f6">
          <div class="admin-stat-card__header"><span class="admin-stat-card__label">🌐 سایت</span></div>
          <div class="admin-stat-card__num">${byPlatform.web.toLocaleString()}</div>
          <div style="font-size:var(--text-xs);color:var(--text-muted)">${users.length?Math.round(byPlatform.web/users.length*100):0}٪ از کل</div>
        </div>
        <div class="admin-stat-card" style="border-top:3px solid #8b5cf6">
          <div class="admin-stat-card__header"><span class="admin-stat-card__label">📱 PWA</span></div>
          <div class="admin-stat-card__num">${byPlatform.pwa.toLocaleString()}</div>
          <div style="font-size:var(--text-xs);color:var(--text-muted)">${users.length?Math.round(byPlatform.pwa/users.length*100):0}٪ از کل</div>
        </div>
        <div class="admin-stat-card" style="border-top:3px solid #f59e0b">
          <div class="admin-stat-card__header"><span class="admin-stat-card__label">🤖 APK</span></div>
          <div class="admin-stat-card__num">${byPlatform.apk.toLocaleString()}</div>
          <div style="font-size:var(--text-xs);color:var(--text-muted)">${users.length?Math.round(byPlatform.apk/users.length*100):0}٪ از کل</div>
        </div>
        <div class="admin-stat-card" style="border-top:3px solid #ec4899">
          <div class="admin-stat-card__header"><span class="admin-stat-card__label">🗺 کشورها</span></div>
          <div class="admin-stat-card__num">${totalCountries}</div>
        </div>
      </div>

      <!-- نمودار ۷ روز -->
      <div class="admin-chart-card">
        <div class="admin-chart-header">
          <div class="admin-chart-title">📈 ثبت‌نام‌های ۷ روز اخیر</div>
        </div>
        <div class="simple-bar-chart" role="img" aria-label="نمودار ثبت‌نام روزانه" style="height:120px;display:flex;align-items:flex-end;gap:8px;padding:0 4px">
          ${Object.entries(daily).map(([day, count]) => {
            const pct = Math.round((count / maxDay) * 100);
            return `
              <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px">
                <span style="font-size:10px;font-weight:700;color:var(--color-primary-600)">${count||''}</span>
                <div style="
                  width:100%;height:${Math.max(pct,4)}px;min-height:4px;
                  background:linear-gradient(180deg,var(--color-primary-400),var(--color-primary-600));
                  border-radius:6px 6px 2px 2px;transition:height 0.5s ease;
                " title="${day}: ${count} کاربر"></div>
                <span style="font-size:9px;color:var(--text-muted)">${day.split('/').pop()}</span>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <!-- ردیف: پلتفرم + زبان -->
      <div class="grid grid--2" style="gap:var(--space-5)">

        <!-- توزیع پلتفرم -->
        <div class="admin-chart-card">
          <div class="admin-chart-header">
            <div class="admin-chart-title">📊 توزیع پلتفرم</div>
          </div>
          <div style="display:flex;flex-direction:column;gap:var(--space-4)">
            ${[
              { key:'web', label:'🌐 سایت',  color:'#3b82f6', val:byPlatform.web },
              { key:'pwa', label:'📱 PWA',   color:'#8b5cf6', val:byPlatform.pwa },
              { key:'apk', label:'🤖 APK',   color:'#f59e0b', val:byPlatform.apk },
            ].map(p => {
              const pct = users.length ? Math.round(p.val/users.length*100) : 0;
              return `
                <div>
                  <div style="display:flex;justify-content:space-between;margin-bottom:6px">
                    <span style="font-size:var(--text-sm);font-weight:600">${p.label}</span>
                    <span style="font-size:var(--text-sm);font-weight:700;color:${p.color}">${p.val.toLocaleString()} (${pct}٪)</span>
                  </div>
                  <div style="height:8px;background:var(--bg-surface-2);border-radius:999px;overflow:hidden">
                    <div style="height:100%;width:${pct}%;background:${p.color};border-radius:999px;transition:width 1s ease"></div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- توزیع زبان -->
        <div class="admin-chart-card">
          <div class="admin-chart-header">
            <div class="admin-chart-title">🌍 توزیع زبان</div>
          </div>
          <div style="display:flex;flex-direction:column;gap:var(--space-3)">
            ${Object.entries(byLang).sort((a,b)=>b[1]-a[1]).map(([lang, count]) => {
              const pct  = Math.round((count / totalLang) * 100);
              const info = LANG_INFO[lang] ?? { name:lang, flag:'🌐' };
              return `
                <div>
                  <div style="display:flex;justify-content:space-between;margin-bottom:4px">
                    <span style="font-size:var(--text-sm)">${info.flag} ${info.name}</span>
                    <span style="font-size:var(--text-sm);font-weight:700;color:var(--color-primary-600)">${count} (${pct}٪)</span>
                  </div>
                  <div style="height:6px;background:var(--bg-surface-2);border-radius:999px;overflow:hidden">
                    <div style="height:100%;width:${pct}%;background:linear-gradient(90deg,var(--color-primary-400),var(--color-primary-600));border-radius:999px"></div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

      </div>

      <!-- جدول کشورها با پلتفرم -->
      <div class="admin-panel">
        <div class="admin-panel__header">
          <div class="admin-panel__title">🗺 کاربران به تفکیک کشور و پلتفرم</div>
        </div>
        <div class="admin-panel__body" style="padding:0">
          ${sortedCountries.length === 0 ? `
            <div style="text-align:center;padding:var(--space-8);color:var(--text-muted)">هنوز کاربری ثبت‌نام نکرده</div>
          ` : `
            <div style="overflow-x:auto">
              <table class="admin-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>کشور</th>
                    <th>جمع کل</th>
                    <th>🌐 سایت</th>
                    <th>📱 PWA</th>
                    <th>🤖 APK</th>
                    <th>سهم</th>
                  </tr>
                </thead>
                <tbody>
                  ${sortedCountries.map(([code, total], idx) => {
                    const pp  = byCountryPlatform[code] ?? { web:0, pwa:0, apk:0 };
                    const pct = users.length ? Math.round(total/users.length*100) : 0;
                    return `
                      <tr>
                        <td style="color:var(--text-muted);font-size:var(--text-xs)">${idx+1}</td>
                        <td style="font-weight:600;white-space:nowrap">${_cname(code)}</td>
                        <td style="font-weight:900;color:var(--color-primary-600)">${total}</td>
                        <td style="color:#3b82f6">${pp.web}</td>
                        <td style="color:#8b5cf6">${pp.pwa}</td>
                        <td style="color:#f59e0b">${pp.apk}</td>
                        <td style="min-width:100px">
                          <div style="display:flex;align-items:center;gap:6px">
                            <div style="flex:1;height:6px;background:var(--bg-surface-2);border-radius:999px;overflow:hidden">
                              <div style="height:100%;width:${pct}%;background:linear-gradient(90deg,var(--color-primary-400),var(--color-primary-600));border-radius:999px"></div>
                            </div>
                            <span style="font-size:10px;color:var(--text-muted);min-width:28px">${pct}٪</span>
                          </div>
                        </td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          `}
        </div>
      </div>

      <!-- جدول کامل کاربران -->
      <div class="admin-table-wrap">
        <div class="admin-table-header">
          <div class="admin-table-title">👤 لیست کامل کاربران</div>
          <div class="flex gap-3">
            <input type="search" class="admin-input" style="width:200px" placeholder="جستجو..." aria-label="جستجو"/>
          </div>
        </div>
        <div style="overflow-x:auto">
          <table class="admin-table" aria-label="کاربران">
            <thead>
              <tr>
                <th>#</th>
                <th>نام</th>
                <th>ایمیل</th>
                <th>کشور</th>
                <th>پلتفرم</th>
                <th>زبان</th>
                <th>روش ورود</th>
                <th>اشتراک</th>
                <th>تاریخ</th>
              </tr>
            </thead>
            <tbody>
              ${users.length === 0
                ? `<tr><td colspan="9" style="text-align:center;color:var(--text-muted);padding:var(--space-8)">هنوز کاربری ثبت‌نام نکرده</td></tr>`
                : users.map((u, i) => {
                    const p = (u.platform || u.source || 'web').toLowerCase();
                    const platformLabel = p.includes('apk')||p.includes('android')||p.includes('twa')
                      ? '<span style="color:#f59e0b;font-size:12px;font-weight:600">🤖 APK</span>'
                      : p.includes('pwa')||p.includes('installed')||p.includes('standalone')
                      ? '<span style="color:#8b5cf6;font-size:12px;font-weight:600">📱 PWA</span>'
                      : '<span style="color:#3b82f6;font-size:12px;font-weight:600">🌐 سایت</span>';
                    return `
                      <tr>
                        <td style="color:var(--text-muted);font-size:var(--text-xs)">${i+1}</td>
                        <td>
                          <div style="display:flex;align-items:center;gap:8px">
                            <div class="avatar avatar--sm">${(u.name||'?').charAt(0)}</div>
                            <span style="font-size:var(--text-sm);font-weight:600">${u.name || '—'}</span>
                            ${u.prizeWon ? '<span style="font-size:14px" title="برنده جایزه">🏆</span>' : ''}
                          </div>
                        </td>
                        <td style="font-size:var(--text-xs);direction:ltr">${u.email || '—'}</td>
                        <td style="font-size:var(--text-sm);white-space:nowrap">${_cname(u.country)}</td>
                        <td>${platformLabel}</td>
                        <td>
                          <span style="font-size:18px">${LANG_INFO[u.lang]?.flag ?? '🌐'}</span>
                          <span style="font-size:var(--text-xs);color:var(--text-muted)">${LANG_INFO[u.lang]?.name ?? u.lang ?? '—'}</span>
                        </td>
                        <td>
                          <span class="admin-badge admin-badge--${u.signInMethod==='google'?'active':'draft'}">
                            ${u.signInMethod==='google' ? '🔵 Google' : '📧 فرم'}
                          </span>
                        </td>
                        <td>
                          <span class="admin-badge admin-badge--${u.isPremium?'active':'draft'}">
                            ${u.isPremium ? '⭐ فعال' : 'رایگان'}
                          </span>
                        </td>
                        <td style="font-size:var(--text-xs)">${u.joinedAt ? new Date(u.joinedAt).toLocaleDateString('fa-IR') : '—'}</td>
                      </tr>
                    `;
                  }).join('')
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

/* ── Toast ── */
function _showToast(msg, type = 'success') {
  const t = document.createElement('div');
  t.setAttribute('role','alert');
  t.style.cssText = `position:fixed;bottom:24px;inset-inline-end:24px;background:${type==='success'?'#16a34a':'#e63946'};color:white;padding:12px 20px;border-radius:8px;font-size:14px;font-weight:600;z-index:9999;box-shadow:0 8px 24px rgba(0,0,0,0.25);animation:fadeIn 0.3s ease`;
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(()=>{t.style.opacity='0';t.style.transition='opacity 0.3s';setTimeout(()=>t.remove(),300);},3000);
}

/* Export for use in admin.js */
export { renderMessagesPage, bindMessagesEvents };
