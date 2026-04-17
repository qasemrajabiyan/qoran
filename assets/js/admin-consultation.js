/**
 * ============================================================
 * FILE: admin-consultation.js
 * ROLE: داشبورد مدیریت مشاوره
 * PROJECT: MediaHub — پلتفرم رسانه‌ای کربلا
 * VERSION: 1.0.0
 * ============================================================
 */

import { ConsultConfig, ConsultOrders, sendSheikhReply } from './consultation.js';
import { AudioPlayer } from './audio-player.js';

/* نقشه کد کشور به نام فارسی — همه کشورهای دنیا */
const COUNTRY_NAMES = {
  IR:'ایران', IQ:'عراق', SA:'عربستان سعودی', AE:'امارات متحده عربی', KW:'کویت',
  BH:'بحرین', QA:'قطر', OM:'عمان', YE:'یمن', SY:'سوریه',
  LB:'لبنان', JO:'اردن', PS:'فلسطین', IL:'اسرائیل',
  EG:'مصر', LY:'لیبی', TN:'تونس', DZ:'الجزایر', MA:'مراکش',
  SD:'سودان', SS:'سودان جنوبی', SO:'سومالی', ET:'اتیوپی', ER:'اریتره',
  DJ:'جیبوتی', MR:'موریتانی', ML:'مالی', NE:'نیجر', TD:'چاد',
  NG:'نیجریه', SN:'سنگال', GN:'گینه', GW:'گینه بیسائو', GM:'گامبیا',
  SL:'سیرالئون', LR:'لیبریا', CI:'ساحل عاج', GH:'غنا', TG:'توگو',
  BJ:'بنین', BF:'بورکینافاسو', CM:'کامرون', CF:'آفریقای مرکزی',
  GA:'گابن', GQ:'گینه استوایی', CG:'کنگو', CD:'کنگو دموکراتیک',
  AO:'آنگولا', ZM:'زامبیا', ZW:'زیمبابوه', MZ:'موزامبیک',
  MW:'مالاوی', TZ:'تانزانیا', KE:'کنیا', UG:'اوگاندا', RW:'رواندا',
  BI:'بوروندی', MG:'ماداگاسکار', MU:'موریس', SC:'سیشل',
  ZA:'آفریقای جنوبی', NA:'نامیبیا', BW:'بوتسوانا', LS:'لسوتو', SZ:'سوازیلند',
  KM:'کومور', CV:'کاپ ورد', ST:'سائوتومه و پرینسیپه',
  PK:'پاکستان', IN:'هند', BD:'بنگلادش', LK:'سریلانکا', NP:'نپال',
  BT:'بوتان', MV:'مالدیو', AF:'افغانستان', MM:'میانمار', TH:'تایلند',
  VN:'ویتنام', KH:'کامبوج', LA:'لائوس', MY:'مالزی', SG:'سنگاپور',
  BN:'برونئی', ID:'اندونزی', PH:'فیلیپین', TL:'تیمور شرقی',
  CN:'چین', TW:'تایوان', HK:'هنگ کنگ', MO:'ماکائو',
  JP:'ژاپن', KR:'کره جنوبی', KP:'کره شمالی', MN:'مغولستان',
  TJ:'تاجیکستان', UZ:'ازبکستان', TM:'ترکمنستان', KZ:'قزاقستان',
  KG:'قرقیزستان', AZ:'آذربایجان', GE:'گرجستان', AM:'ارمنستان',
  TR:'ترکیه', CY:'قبرس',
  RU:'روسیه', UA:'اوکراین', BY:'بلاروس', PL:'لهستان', CZ:'جمهوری چک',
  SK:'اسلواکی', HU:'مجارستان', RO:'رومانی', BG:'بلغارستان',
  MD:'مولداوی', RS:'صربستان', HR:'کرواسی', BA:'بوسنی و هرزگوین',
  SI:'اسلوونی', MK:'مقدونیه شمالی', AL:'آلبانی', ME:'مونته‌نگرو',
  XK:'کوزوو', GR:'یونان', IT:'ایتالیا', ES:'اسپانیا', PT:'پرتغال',
  FR:'فرانسه', DE:'آلمان', AT:'اتریش', CH:'سوئیس', LI:'لیختن‌اشتاین',
  BE:'بلژیک', NL:'هلند', LU:'لوکزامبورگ', GB:'انگلستان',
  IE:'ایرلند', IS:'ایسلند', NO:'نروژ', SE:'سوئد', FI:'فنلاند',
  DK:'دانمارک', EE:'استونی', LV:'لتونی', LT:'لیتوانی',
  MT:'مالت', MC:'موناکو', SM:'سان مارینو', VA:'واتیکان', AD:'آندورا',
  US:'آمریکا', CA:'کانادا', MX:'مکزیک', GT:'گواتمالا', BZ:'بلیز',
  HN:'هندوراس', SV:'السالوادور', NI:'نیکاراگوئه', CR:'کاستاریکا',
  PA:'پاناما', CU:'کوبا', JM:'جامائیکا', HT:'هائیتی', DO:'دومینیکن',
  PR:'پورتوریکو', TT:'ترینیداد و توباگو', BB:'باربادوس',
  CO:'کلمبیا', VE:'ونزوئلا', GY:'گویان', SR:'سورینام', BR:'برزیل',
  EC:'اکوادور', PE:'پرو', BO:'بولیوی', CL:'شیلی', AR:'آرژانتین',
  UY:'اروگوئه', PY:'پاراگوئه',
  AU:'استرالیا', NZ:'نیوزیلند', FJ:'فیجی', PG:'پاپوآ گینه نو',
  SB:'جزایر سلیمان', VU:'وانواتو', WS:'ساموآ', TO:'تونگا',
};

function _countryLabel(code) {
  if (!code) return '—';
  const upper = code.toUpperCase();
  const name  = COUNTRY_NAMES[upper];
  return name ? `${upper} ${name}` : upper;
}

const LANG_INFO = {
  fa:{name:'فارسی',flag:'🇮🇷'}, ar:{name:'عربی',flag:'🇸🇦'},
  ur:{name:'اردو',flag:'🇵🇰'}, az:{name:'آذری',flag:'🇦🇿'},
  tr:{name:'ترکی',flag:'🇹🇷'}, ru:{name:'روسی',flag:'🇷🇺'},
  en:{name:'انگلیسی',flag:'🇺🇸'}, id:{name:'اندونزیایی',flag:'🇮🇩'},
};

const CURRENCIES = ['IQD','IRR','PKR','USD','TRY','RUB','AZN','IDR'];

export function renderConsultAdminPage(container) {
  if (!container) return;

  let _activeTab     = 'orders';
  let _activeOrder   = null;  /* سفارش در حال پاسخ‌دهی */
  let _replyRecorder = null;
  let _replyBlob     = null;
  let _replyRecording= false;
  let _replySeconds  = 0;
  let _replyInterval = null;

  function _render() {
    const config = ConsultConfig.get();
    const orders = ConsultOrders.getAll();
    const cache  = (() => { try { return JSON.parse(localStorage.getItem('mh_consult_cache')||'[]'); } catch { return []; } })();

    const pending     = orders.filter(o => o.status === 'pending' || o.status === 'waiting_sheikh');
    const needReview  = orders.filter(o => o.status === 'need_review');
    const done        = orders.filter(o => o.status === 'done');

    container.innerHTML = `
      <div>
        <div class="admin-page-header">
          <div>
            <h1 class="admin-page-title"><span class="admin-page-title__icon">💬</span> مدیریت مشاوره</h1>
            <p class="admin-page-desc">
              ${pending.length} در انتظار —
              ${needReview.length > 0 ? `<span style="color:var(--color-error);font-weight:bold">${needReview.length} نیاز به بررسی</span> —` : ''}
              ${done.length} انجام‌شده
            </p>
          </div>
          <div class="flex gap-3 flex-wrap">
            ${['orders','review','settings','cache'].map(tab => `
              <button class="btn btn--${_activeTab===tab?'primary':'outline'} btn--sm tab-btn" data-tab="${tab}">
                ${{
                  orders:   '📋 سفارش‌ها',
                  review:   `⚠️ بررسی${needReview.length>0?` (${needReview.length})`:''}`,
                  settings: '⚙️ تنظیمات',
                  cache:    '🧠 حافظه',
                }[tab]}
              </button>
            `).join('')}
          </div>
        </div>

        <!-- Stats -->
        <div class="admin-stats-grid" style="margin-bottom:var(--space-5)">
          ${[
            {label:'کل مشاوره‌ها',    num:orders.length,       color:'teal',   icon:'💬'},
            {label:'در انتظار پاسخ',  num:pending.length,      color:'amber',  icon:'⏳'},
            {label:'نیاز به بررسی',   num:needReview.length,   color:'rose',   icon:'⚠️'},
            {label:'انجام‌شده',       num:done.length,         color:'green',  icon:'✓'},
            {label:'حافظه AI',        num:cache.length,        color:'purple', icon:'🧠'},
          ].map(s=>`
            <div class="admin-stat-card admin-stat-card--${s.color}">
              <div class="admin-stat-card__header">
                <span class="admin-stat-card__label">${s.label}</span>
                <div class="admin-stat-card__icon">${s.icon}</div>
              </div>
              <div class="admin-stat-card__num">${s.num}</div>
            </div>
          `).join('')}
        </div>

        ${_activeTab === 'orders'   ? _renderOrdersTab(orders, pending)   : ''}
        ${_activeTab === 'review'   ? _renderReviewTab(needReview)         : ''}
        ${_activeTab === 'settings' ? _renderSettingsTab(config)           : ''}
        ${_activeTab === 'cache'    ? _renderCacheTab(cache)               : ''}

        <!-- پنل پاسخ شیخ -->
        ${_activeOrder ? _renderReplyPanel() : ''}
      </div>
    `;
    _bindEvents();
  }

  /* ── تب سفارش‌ها ── */
  function _renderOrdersTab(orders, pending) {
    return `
      <div class="admin-table-wrap">
        <div class="admin-table-header">
          <div class="admin-table-title">📋 همه مشاوره‌ها</div>
          <div class="flex gap-3">
            <select class="admin-input" style="width:140px" id="filter-status">
              <option value="">همه وضعیت‌ها</option>
              <option value="pending">در انتظار</option>
              <option value="waiting_sheikh">انتظار شیخ</option>
              <option value="done">انجام‌شده</option>
            </select>
            <select class="admin-input" style="width:140px" id="filter-lang">
              <option value="">همه زبان‌ها</option>
              ${Object.entries(LANG_INFO).map(([k,v])=>`<option value="${k}">${v.flag} ${v.name}</option>`).join('')}
            </select>
          </div>
        </div>
        <div style="overflow-x:auto">
          <table class="admin-table" aria-label="سفارش‌های مشاوره">
            <thead>
              <tr>
                <th>کاربر</th>
                <th>زبان</th>
                <th>کشور</th>
                <th>صوت کاربر</th>
                <th>تحلیل AI</th>
                <th>وضعیت</th>
                <th>تاریخ</th>
                <th>چت</th>
                <th>پاسخ شیخ</th>
              </tr>
            </thead>
            <tbody>
              ${orders.length === 0
                ? `<tr><td colspan="8" style="text-align:center;color:var(--text-muted);padding:var(--space-8)">مشاوره‌ای وجود ندارد</td></tr>`
                : orders.map(o => `
                  <tr data-status="${o.status}" data-lang="${o.userLang}">
                    <td>
                      <div style="font-weight:600">${o.userName||'—'}</div>
                      <div style="font-size:var(--text-xs);color:var(--text-muted)">${o.id}</div>
                    </td>
                    <td>${LANG_INFO[o.userLang]?.flag??'🌐'} ${LANG_INFO[o.userLang]?.name??o.userLang}</td>
                    <td style="white-space:nowrap">${_countryLabel(o.userCountry)}</td>
                    <td>
                      <div style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:4px">
                        ${o.audioDuration ? `${Math.floor(o.audioDuration/60)}:${(o.audioDuration%60).toString().padStart(2,'0')}` : '—'}
                      </div>
                      ${o.transcript
                        ? `<button class="btn btn--ghost btn--sm view-transcript-btn"
                            data-text="${encodeURIComponent(o.transcript||'')}"
                            style="font-size:var(--text-xs)">📄 متن</button>`
                        : '<span style="color:var(--text-muted);font-size:var(--text-xs)">در انتظار</span>'
                      }
                    </td>
                    <td>
                      ${o.aiAnalysis
                        ? `<button class="btn btn--ghost btn--sm view-ai-btn"
                            data-text="${encodeURIComponent(o.aiAnalysis||'')}"
                            style="font-size:var(--text-xs)">🧠 تحلیل</button>`
                        : '<span style="color:var(--text-muted);font-size:var(--text-xs)">—</span>'
                      }
                    </td>
                    <td>
                      <span class="admin-badge admin-badge--${
                        o.status==='done'?'done':
                        o.status==='waiting_sheikh'?'active':
                        o.status==='need_review'?'rejected':'pending'
                      }">
                        ${o.status==='done'?'✓ انجام شد':o.status==='waiting_sheikh'?'انتظار شیخ':o.status==='need_review'?'⚠ بررسی':'در انتظار'}
                      </span>
                    </td>
                    <td style="font-size:var(--text-xs)">${new Date(o.createdAt).toLocaleDateString('fa-IR')}</td>
                    <td style="text-align:center">
                      <label style="display:inline-flex;align-items:center;gap:6px;cursor:pointer" title="${o.chatEnabled?'غیرفعال کردن چت':'فعال کردن چت'}">
                        <input type="checkbox" class="chat-toggle" data-order-id="${o.id}"
                          ${o.chatEnabled?'checked':''} style="width:16px;height:16px;cursor:pointer"/>
                        <span style="font-size:var(--text-xs);color:${o.chatEnabled?'var(--color-primary-500)':'var(--text-muted)'}">
                          ${o.chatEnabled?'✓ فعال':'غیرفعال'}
                        </span>
                      </label>
                    </td>
                    <td>
                      ${o.status === 'waiting_sheikh' ? `
                        <button class="btn btn--primary btn--sm reply-btn" data-order-id="${o.id}">
                          🎤 پاسخ
                        </button>
                      ` : o.replyAudioUrl ? `
                        <audio controls style="height:28px;width:100px">
                          <source src="${o.replyAudioUrl}"/>
                        </audio>
                      ` : '<span style="color:var(--text-muted);font-size:var(--text-xs)">—</span>'}
                    </td>
                  </tr>
                `).join('')
              }
            </tbody>
          </table>
        </div>
      </div>

      <!-- Modal متن / تحلیل AI -->
      <div id="text-modal" style="display:none;position:fixed;inset:0;background:var(--bg-overlay);z-index:var(--z-modal);align-items:center;justify-content:center;padding:24px">
        <div style="background:var(--bg-surface);border-radius:var(--radius-xl);max-width:780px;width:100%;padding:32px;box-shadow:var(--shadow-2xl);max-height:90vh;display:flex;flex-direction:column">

          <!-- هدر مودال -->
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-shrink:0">
            <h3 id="text-modal-title" style="font-size:var(--text-lg);font-weight:var(--weight-bold)"></h3>
            <button id="close-text-modal" style="background:none;border:none;cursor:pointer;font-size:20px">✕</button>
          </div>

          <!-- کنترل اندازه فونت — فقط برای تحلیل AI -->
          <div id="ai-font-controls" style="display:none;align-items:center;gap:12px;margin-bottom:16px;flex-shrink:0;background:var(--bg-surface-2);border-radius:var(--radius-md);padding:10px 16px">
            <span style="font-size:var(--text-xs);color:var(--text-muted)">اندازه متن:</span>
            <button id="font-decrease" style="background:var(--bg-surface);border:1px solid var(--border-color);border-radius:var(--radius-md);width:32px;height:32px;cursor:pointer;font-size:16px;font-weight:700;display:flex;align-items:center;justify-content:center" title="کوچک‌تر">A−</button>
            <span id="font-size-label" style="font-size:var(--text-xs);color:var(--text-secondary);min-width:36px;text-align:center">18px</span>
            <button id="font-increase" style="background:var(--bg-surface);border:1px solid var(--border-color);border-radius:var(--radius-md);width:32px;height:32px;cursor:pointer;font-size:16px;font-weight:700;display:flex;align-items:center;justify-content:center" title="بزرگ‌تر">A+</button>
            <button id="font-reset" style="background:none;border:none;cursor:pointer;font-size:var(--text-xs);color:var(--text-muted)" title="پیش‌فرض">↺ پیش‌فرض</button>
          </div>

          <!-- محتوای مودال -->
          <div id="text-modal-content" style="
            font-size:18px;
            line-height:1.9;
            color:var(--text-primary);
            white-space:pre-line;
            background:var(--bg-surface-2);
            border-radius:var(--radius-md);
            padding:var(--space-6);
            overflow-y:auto;
            flex:1;
            font-family:var(--font-rtl),var(--font-sans);
            direction:rtl;
            text-align:right;
          "></div>

        </div>
      </div>
    `;
  }

  /* ── تب بررسی مشابه‌ها ── */
  function _renderReviewTab(needReview) {
    if (!needReview.length) return `
      <div style="text-align:center;padding:var(--space-12);color:var(--text-muted)">
        <div style="font-size:48px;margin-bottom:12px">✅</div>
        <p>همه موارد بررسی شده‌اند</p>
      </div>
    `;

    return `
      <div style="display:flex;flex-direction:column;gap:var(--space-5)">
        ${needReview.map(o => `
          <div class="admin-panel">
            <div class="admin-panel__header">
              <div class="admin-panel__title">
                ⚠️ شباهت ${Math.round((o.similarity||0)*100)}٪ با پرونده قبلی
              </div>
              <div class="flex gap-2">
                <span style="font-size:18px">${LANG_INFO[o.userLang]?.flag??'🌐'}</span>
                <span style="font-size:var(--text-sm);color:var(--text-muted)">${o.userName||'—'}</span>
              </div>
            </div>
            <div class="admin-panel__body">
              <div class="grid grid--2" style="gap:var(--space-4);margin-bottom:var(--space-4)">
                <div>
                  <div style="font-size:var(--text-xs);font-weight:bold;color:var(--text-muted);margin-bottom:8px">سوال جدید:</div>
                  <div style="font-size:var(--text-sm);background:var(--bg-surface-2);padding:var(--space-3);border-radius:var(--radius-md);max-height:100px;overflow-y:auto">
                    ${o.transcript||'—'}
                  </div>
                </div>
                <div>
                  <div style="font-size:var(--text-xs);font-weight:bold;color:var(--text-muted);margin-bottom:8px">جواب مشابه قبلی:</div>
                  <div style="font-size:var(--text-sm);background:var(--bg-surface-2);padding:var(--space-3);border-radius:var(--radius-md);max-height:100px;overflow-y:auto">
                    ${o.nearCache?.aiAnalysis?.slice(0,200)||'—'}...
                  </div>
                </div>
              </div>
              <div class="flex gap-3">
                <button class="btn btn--primary btn--sm approve-similar-btn" data-order-id="${o.id}">
                  ✓ تأیید — همین جواب برود
                </button>
                <button class="btn btn--outline btn--sm reply-btn" data-order-id="${o.id}">
                  🎤 پاسخ جدید ضبط کن
                </button>
                <button class="btn btn--ghost btn--sm reject-similar-btn" data-order-id="${o.id}" style="color:var(--color-error)">
                  ✕ رد
                </button>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  /* ── تنظیمات ── */
  function _renderSettingsTab(config) {
    return `
      <div>
        <div class="admin-panel" style="margin-bottom:var(--space-5)">
          <div class="admin-panel__header"><div class="admin-panel__title">⚙️ تنظیمات کلی</div></div>
          <div class="admin-panel__body" style="display:flex;flex-direction:column;gap:var(--space-4)">
            <label class="admin-toggle">
              <input type="checkbox" id="consult-active" ${config.active?'checked':''}/>
              <div class="admin-toggle__track"><div class="admin-toggle__thumb"></div></div>
              <span class="admin-toggle__label">مشاوره فعال باشد</span>
            </label>
            <label class="admin-toggle">
              <input type="checkbox" id="consult-fa-active" ${config.activeForFa?'checked':''}/>
              <div class="admin-toggle__track"><div class="admin-toggle__thumb"></div></div>
              <span class="admin-toggle__label">برای فارسی‌زبانان هم فعال باشد</span>
            </label>
            <div class="grid grid--2" style="gap:var(--space-4)">
              <div class="admin-field">
                <label class="admin-label" for="reply-delay">تأخیر ارسال پاسخ (ساعت)</label>
                <input type="number" class="admin-input" id="reply-delay" value="${config.replyDelayHours??4}" min="1" max="72"/>
              </div>
              <div class="admin-field">
                <label class="admin-label" for="similarity-thresh">
                  درصد شباهت برای حافظه AI
                  <span class="admin-label-hint">پیش‌فرض: ۹۲٪</span>
                </label>
                <div style="display:flex;align-items:center;gap:var(--space-3);margin-bottom:var(--space-2)">
                  <input type="range" id="similarity-thresh"
                    min="70" max="100"
                    value="${Math.round((config.similarityThreshold??0.92)*100)}"
                    style="flex:1;accent-color:var(--color-primary-500);cursor:pointer"
                  />
                  <span id="similarity-val" style="
                    font-weight:900;min-width:48px;text-align:center;
                    font-size:var(--text-lg);color:var(--color-primary-600);
                    background:var(--bg-surface-2);border:1px solid var(--border-color);
                    border-radius:var(--radius-md);padding:2px 8px;
                  ">${Math.round((config.similarityThreshold??0.92)*100)}%</span>
                </div>
                <div style="display:flex;justify-content:space-between;font-size:var(--text-xs);color:var(--text-muted)">
                  <span>۷۰٪ — حساس‌تر</span>
                  <span>۱۰۰٪ — دقیق‌تر</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="admin-panel" style="margin-bottom:var(--space-5)">
          <div class="admin-panel__header"><div class="admin-panel__title">💰 قیمت مشاوره</div></div>
          <div class="admin-panel__body">
            <div style="
              background:rgba(42,157,143,0.08);border:1px solid rgba(42,157,143,0.2);
              border-radius:var(--radius-md);padding:var(--space-3) var(--space-4);
              font-size:var(--text-sm);color:var(--text-secondary);margin-bottom:var(--space-4);
              display:flex;gap:6px;
            ">
              <span>ℹ️</span>
              <span>قیمت را به دلار وارد کنید — سایت خودکار به ارز هر کاربر تبدیل می‌کند</span>
            </div>
            <div class="admin-field">
              <label class="admin-label" for="price-USD">قیمت مشاوره (USD دلار)</label>
              <div style="display:flex;align-items:center;gap:var(--space-3)">
                <span style="font-size:1.5rem">$</span>
                <input type="number" class="admin-input" id="price-USD" value="${config.price?.USD??25}" min="1" style="max-width:200px"/>
              </div>
            </div>
          </div>
        </div>

        <div class="admin-panel" style="margin-bottom:var(--space-5)">
          <div class="admin-panel__header"><div class="admin-panel__title">📱 تلگرام — ارسال سوالات مشابه</div></div>
          <div class="admin-panel__body">
            <div class="grid grid--2" style="gap:var(--space-4)">
              <div class="admin-field">
                <label class="admin-label" for="tg-token">Bot Token</label>
                <input type="password" class="admin-input" id="tg-token" value="${config.telegramBotToken??''}" dir="ltr" placeholder="123456:ABC..."/>
              </div>
              <div class="admin-field">
                <label class="admin-label" for="tg-chat">Chat ID</label>
                <input type="text" class="admin-input" id="tg-chat" value="${config.telegramChatId??''}" dir="ltr" placeholder="-100123456789"/>
              </div>
            </div>
          </div>
        </div>

        <button class="btn btn--primary btn--lg" id="save-consult-settings">💾 ذخیره تنظیمات</button>
      </div>
    `;
  }

  /* ── حافظه ── */
  function _renderCacheTab(cache) {
    return `
      <div class="admin-table-wrap">
        <div class="admin-table-header">
          <div class="admin-table-title">🧠 حافظه AI (${cache.length} پرونده)</div>
          <button class="btn btn--outline btn--sm" id="clear-consult-cache" style="color:var(--color-error);border-color:var(--color-error)">🗑 پاک کردن</button>
        </div>
        <div style="overflow-x:auto">
          <table class="admin-table">
            <thead><tr><th>خلاصه سوال</th><th>تاریخ</th><th>صوت جواب</th></tr></thead>
            <tbody>
              ${cache.length===0
                ? `<tr><td colspan="3" style="text-align:center;color:var(--text-muted);padding:var(--space-6)">حافظه خالی</td></tr>`
                : cache.map(c=>`
                  <tr>
                    <td style="font-size:var(--text-sm);max-width:250px">${c.transcript?.slice(0,80)}...</td>
                    <td style="font-size:var(--text-xs)">${new Date(c.createdAt).toLocaleDateString('fa-IR')}</td>
                    <td>
                      ${c.replyAudioUrl
                        ? `<audio controls style="height:28px;width:120px"><source src="${c.replyAudioUrl}"/></audio>`
                        : '<span style="color:var(--text-muted);font-size:var(--text-xs)">—</span>'}
                    </td>
                  </tr>
                `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  /* ── پنل پاسخ شیخ ── */
  function _renderReplyPanel() {
    const order = ConsultOrders.getAll().find(o => o.id === _activeOrder);
    if (!order) return '';

    const rMins = Math.floor(_replySeconds/60).toString().padStart(2,'0');
    const rSecs = (_replySeconds%60).toString().padStart(2,'0');

    return `
      <div style="
        position:fixed;inset:0;background:var(--bg-overlay);
        backdrop-filter:blur(8px);z-index:var(--z-modal);
        display:flex;align-items:center;justify-content:center;padding:24px;
      " id="reply-overlay">
        <div style="
          background:var(--bg-surface);border-radius:var(--radius-xl);
          max-width:680px;width:100%;max-height:90vh;overflow-y:auto;
          box-shadow:var(--shadow-2xl);border:1px solid var(--border-color);
          animation:scaleIn 0.3s ease;
        ">
          <!-- Header -->
          <div style="
            background:linear-gradient(135deg,#0d1f2d,#1a3040);
            padding:var(--space-6);
            display:flex;align-items:center;justify-content:space-between;
          ">
            <div>
              <div style="font-size:var(--text-lg);font-weight:bold;color:white">پاسخ به مشاوره</div>
              <div style="font-size:var(--text-sm);color:rgba(255,255,255,0.6)">
                ${order.userName} — ${LANG_INFO[order.userLang]?.flag??'🌐'} ${LANG_INFO[order.userLang]?.name??order.userLang}
              </div>
            </div>
            <button id="close-reply-panel" style="background:rgba(255,255,255,0.1);border:none;width:32px;height:32px;border-radius:50%;color:white;cursor:pointer;font-size:16px" aria-label="بستن">✕</button>
          </div>

          <div style="padding:var(--space-6);display:flex;flex-direction:column;gap:var(--space-5)">

            <!-- تحلیل AI -->
            ${order.aiAnalysis ? `
              <div>
                <div style="font-size:var(--text-sm);font-weight:bold;color:var(--color-primary-600);margin-bottom:8px">🧠 تحلیل کارشناسانه AI:</div>
                <div style="
                  font-size:var(--text-sm);line-height:1.7;color:var(--text-secondary);
                  background:var(--bg-surface-2);border-radius:var(--radius-md);
                  padding:var(--space-4);max-height:200px;overflow-y:auto;
                  border-inline-start:3px solid var(--color-primary-500);
                ">${order.aiAnalysis}</div>
              </div>
            ` : ''}

            <!-- ضبط پاسخ شیخ -->
            <div style="text-align:center">
              <div style="font-size:var(--text-sm);font-weight:bold;margin-bottom:var(--space-3)">🎤 ضبط پاسخ شیخ:</div>

              <div style="
                font-family:'JetBrains Mono',monospace;font-size:2rem;font-weight:900;
                color:${_replyRecording?'var(--color-error)':'var(--text-primary)'};
                margin-bottom:var(--space-3);
              " aria-live="polite">${rMins}:${rSecs}</div>

              <button id="reply-record-btn" style="
                width:70px;height:70px;border-radius:50%;
                background:${_replyRecording?'linear-gradient(135deg,#e63946,#c1121f)':'linear-gradient(135deg,var(--color-primary-500),var(--color-primary-700))'};
                border:none;color:white;font-size:28px;cursor:pointer;
                box-shadow:${_replyRecording?'0 0 0 8px rgba(230,57,70,0.2)':'0 4px 16px rgba(42,157,143,0.35)'};
                transition:all 0.3s;display:flex;align-items:center;justify-content:center;margin:0 auto var(--space-4);
              " aria-label="${_replyRecording?'توقف':'شروع ضبط'}">
                ${_replyRecording?'⏹':'🎤'}
              </button>

              ${_replyBlob ? `
                <audio controls style="width:100%;margin-bottom:var(--space-4)">
                  <source src="${URL.createObjectURL(_replyBlob)}"/>
                </audio>
              ` : ''}
            </div>

            <!-- یا تایپ متن -->
            <div>
              <div style="font-size:var(--text-sm);font-weight:bold;margin-bottom:8px">✏️ یا متن پاسخ بنویسید:</div>
              <textarea id="reply-text-input" class="admin-textarea" rows="6"
                placeholder="متن پاسخ شیخ را اینجا بنویسید — AI به صوت تبدیل می‌کند..."
              ></textarea>
            </div>

            <!-- دکمه‌ها -->
            <div class="flex gap-3">
              <button id="send-reply-btn" class="btn btn--primary btn--lg" style="flex:1">
                📤 ارسال پاسخ به کاربر
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /* ── Events ── */
  function _bindEvents() {
    /* Tabs */
    /* Init پلیرهای صوت در جدول */
    setTimeout(() => {
      container.querySelectorAll('[id^="adm-player-"]').forEach(el => {
        const orderId = el.id.replace('adm-player-', '');
        const order   = ConsultOrders.getAll().find(o => o.id === orderId);
        if (order?.audioUrl) {
          const player = new AudioPlayer(el.id, order.audioUrl, { compact: true, accentColor: '#3b82f6' });
          player.render();
        }
      });
    }, 100);

    container.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => { _activeTab = btn.dataset.tab; _render(); });
    });

    /* فیلتر */
    ['filter-status','filter-lang'].forEach(id => {
      document.getElementById(id)?.addEventListener('change', () => {
        const st = document.getElementById('filter-status')?.value;
        const lg = document.getElementById('filter-lang')?.value;
        container.querySelectorAll('tr[data-status]').forEach(row => {
          const show = (!st||row.dataset.status===st) && (!lg||row.dataset.lang===lg);
          row.style.display = show ? '' : 'none';
        });
      });
    });

    /* مشاهده متن */
    container.querySelectorAll('.view-transcript-btn,.view-ai-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const modal       = document.getElementById('text-modal');
        const title       = document.getElementById('text-modal-title');
        const cont        = document.getElementById('text-modal-content');
        const fontControls= document.getElementById('ai-font-controls');
        const isAI        = btn.classList.contains('view-ai-btn');
        if (modal&&title&&cont) {
          title.textContent       = isAI ? '🧠 تحلیل کارشناسانه AI' : '📄 متن رونویسی';
          cont.textContent        = decodeURIComponent(btn.dataset.text);
          modal.style.display     = 'flex';
          /* کنترل فونت فقط برای تحلیل AI */
          if (fontControls) fontControls.style.display = isAI ? 'flex' : 'none';
          /* فونت پیش‌فرض بزرگ برای تحلیل AI */
          cont.style.fontSize = isAI ? '18px' : 'var(--text-sm)';
          if (document.getElementById('font-size-label'))
            document.getElementById('font-size-label').textContent = isAI ? '18px' : '';
        }
      });
    });

    document.getElementById('close-text-modal')?.addEventListener('click', () => {
      document.getElementById('text-modal').style.display = 'none';
    });

    /* کنترل اندازه فونت تحلیل AI */
    let _aiFS = 18;
    document.getElementById('font-increase')?.addEventListener('click', () => {
      _aiFS = Math.min(_aiFS + 2, 32);
      const el = document.getElementById('text-modal-content');
      const lb = document.getElementById('font-size-label');
      if (el) el.style.fontSize = _aiFS + 'px';
      if (lb) lb.textContent = _aiFS + 'px';
    });
    document.getElementById('font-decrease')?.addEventListener('click', () => {
      _aiFS = Math.max(_aiFS - 2, 12);
      const el = document.getElementById('text-modal-content');
      const lb = document.getElementById('font-size-label');
      if (el) el.style.fontSize = _aiFS + 'px';
      if (lb) lb.textContent = _aiFS + 'px';
    });
    document.getElementById('font-reset')?.addEventListener('click', () => {
      _aiFS = 18;
      const el = document.getElementById('text-modal-content');
      const lb = document.getElementById('font-size-label');
      if (el) el.style.fontSize = '18px';
      if (lb) lb.textContent = '18px';
    });

    /* Toggle چت برای هر کاربر */
    container.querySelectorAll('.chat-toggle').forEach(chk => {
      chk.addEventListener('change', () => {
        const orderId = chk.dataset.orderId;
        ConsultOrders.update(orderId, { chatEnabled: chk.checked });
        const label = chk.nextElementSibling;
        if (label) {
          label.textContent = chk.checked ? '✓ فعال' : 'غیرفعال';
          label.style.color = chk.checked ? 'var(--color-primary-500)' : 'var(--text-muted)';
        }
        _showToast(chk.checked ? '✓ چت برای این کاربر فعال شد' : '✓ چت غیرفعال شد');
      });
    });

    /* باز کردن پنل پاسخ */
    container.querySelectorAll('.reply-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        _activeOrder  = btn.dataset.orderId;
        _replyBlob    = null;
        _replySeconds = 0;
        _replyRecording = false;
        _render();
      });
    });

    /* بستن پنل پاسخ */
    document.getElementById('close-reply-panel')?.addEventListener('click', () => {
      _activeOrder = null; _replyBlob = null; _replyRecording = false;
      clearInterval(_replyInterval);
      _render();
    });

    /* ضبط پاسخ شیخ */
    document.getElementById('reply-record-btn')?.addEventListener('click', async () => {
      if (!_replyRecording) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio:true });
          _replyRecorder = new MediaRecorder(stream);
          const chunks = [];
          _replyRecorder.ondataavailable = e => chunks.push(e.data);
          _replyRecorder.onstop = () => {
            _replyBlob = new Blob(chunks, { type:'audio/webm' });
            stream.getTracks().forEach(t => t.stop());
            _render();
          };
          _replyRecorder.start();
          _replyRecording = true;
          _replySeconds   = 0;
          _replyInterval  = setInterval(() => {
            _replySeconds++;
            const el = document.querySelector('[aria-live="polite"]');
            if (el) {
              const m = Math.floor(_replySeconds/60).toString().padStart(2,'0');
              const s = (_replySeconds%60).toString().padStart(2,'0');
              el.textContent = `${m}:${s}`;
            }
          }, 1000);
          _render();
        } catch { alert('دسترسی به میکروفون رد شد'); }
      } else {
        _replyRecording = false;
        clearInterval(_replyInterval);
        _replyRecorder?.stop();
      }
    });

    /* ارسال پاسخ */
    document.getElementById('send-reply-btn')?.addEventListener('click', async () => {
      const btn      = document.getElementById('send-reply-btn');
      const textInput= document.getElementById('reply-text-input')?.value?.trim();
      if (!_replyBlob && !textInput) { alert('لطفاً پاسخ ضبط کنید یا متن بنویسید'); return; }

      if (btn) { btn.disabled=true; btn.textContent='⏳ در حال پردازش...'; }
      const ok = await sendSheikhReply(_activeOrder, textInput || '[صوت ضبط‌شده]');
      if (ok) {
        _showToast('✓ پاسخ ارسال شد — کاربر بعد از تأخیر تنظیم‌شده دریافت می‌کند');
        _activeOrder = null; _replyBlob = null; _replyRecording = false;
        _render();
      } else {
        _showToast('⚠ خطا در ارسال', false);
        if (btn) { btn.disabled=false; btn.textContent='📤 ارسال'; }
      }
    });

    /* تأیید مشابه */
    container.querySelectorAll('.approve-similar-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const order = ConsultOrders.getAll().find(o => o.id === btn.dataset.orderId);
        if (!order?.nearCache?.replyAudioUrl) return;
        ConsultOrders.update(order.id, { status:'done', replyAudioUrl: order.nearCache.replyAudioUrl, doneAt: new Date().toISOString() });
        _showToast('✓ جواب مشابه تأیید شد');
        _render();
      });
    });

    /* رد مشابه */
    container.querySelectorAll('.reject-similar-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        ConsultOrders.update(btn.dataset.orderId, { status:'waiting_sheikh', nearCache:null });
        _showToast('✓ به صف انتظار شیخ رفت');
        _render();
      });
    });

    /* ذخیره تنظیمات — باگ‌فیکس: استفاده از container.querySelector برای خواندن مقدار slider */
    container.querySelector('#save-consult-settings')?.addEventListener('click', () => {
      const usdPrice = parseFloat(container.querySelector('#price-USD')?.value) || 25;
      const price = { USD: usdPrice, IQD: Math.round(usdPrice*1310), IRR: Math.round(usdPrice*62000), PKR: Math.round(usdPrice*280), TRY: Math.round(usdPrice*32), RUB: Math.round(usdPrice*90), AZN: Math.round(usdPrice*1.7), IDR: Math.round(usdPrice*16200) };
      const sliderValue = parseInt(container.querySelector('#similarity-thresh')?.value ?? '92');
      ConsultConfig.set({
        active:              container.querySelector('#consult-active')?.checked ?? true,
        activeForFa:         container.querySelector('#consult-fa-active')?.checked ?? true,
        replyDelayHours:     parseInt(container.querySelector('#reply-delay')?.value||'4'),
        similarityThreshold: sliderValue / 100,
        price,
        telegramBotToken:    container.querySelector('#tg-token')?.value?.trim() ?? '',
        telegramChatId:      container.querySelector('#tg-chat')?.value?.trim() ?? '',
      });
      _showToast(`✓ تنظیمات ذخیره شد — درصد شباهت: ${sliderValue}٪`);
    });

    /* slider — باگ‌فیکس: استفاده از container.querySelector به جای document.getElementById */
    const sliderEl = container.querySelector('#similarity-thresh');
    const sliderVal = container.querySelector('#similarity-val');
    if (sliderEl && sliderVal) {
      /* نمایش مقدار فعلی هنگام بارگذاری */
      sliderVal.textContent = sliderEl.value + '%';
      /* آپدیت هنگام تغییر */
      sliderEl.addEventListener('input', () => {
        sliderVal.textContent = sliderEl.value + '%';
      });
    }

    /* پاک کردن کش */
    document.getElementById('clear-consult-cache')?.addEventListener('click', () => {
      if (!confirm('پاک شود؟')) return;
      localStorage.removeItem('mh_consult_cache');
      _showToast('✓ حافظه پاک شد');
      _render();
    });
  }

  function _showToast(msg, ok=true) {
    const t = document.createElement('div');
    t.setAttribute('role','alert');
    t.style.cssText=`position:fixed;bottom:24px;inset-inline-end:24px;background:${ok?'#16a34a':'#e63946'};color:white;padding:12px 20px;border-radius:8px;font-size:14px;font-weight:600;z-index:9999;box-shadow:0 8px 24px rgba(0,0,0,0.25)`;
    t.textContent=msg;
    document.body.appendChild(t);
    setTimeout(()=>{t.style.opacity='0';t.style.transition='opacity 0.3s';setTimeout(()=>t.remove(),300);},3000);
  }

  _render();
}
