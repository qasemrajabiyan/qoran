/**
 * ============================================================
 * FILE: admin-istikhara.js
 * ROLE: داشبورد مدیریت استخاره
 * PROJECT: MediaHub — پلتفرم رسانه‌ای کربلا
 * VERSION: 1.0.0
 * ============================================================
 */

import { IstikharaConfig, IstikharaOrders } from './istikhara.js';

const LANG_INFO = {
  fa:{name:'فارسی',flag:'🇮🇷'}, ar:{name:'عربی',flag:'🇸🇦'},
  ur:{name:'اردو',flag:'🇵🇰'}, az:{name:'آذری',flag:'🇦🇿'},
  tr:{name:'ترکی',flag:'🇹🇷'}, ru:{name:'روسی',flag:'🇷🇺'},
  en:{name:'انگلیسی',flag:'🇺🇸'}, id:{name:'اندونزیایی',flag:'🇮🇩'},
};

/* نقشه کد کشور به نام فارسی */
const COUNTRY_NAMES = {
  /* خاورمیانه */
  IR:'ایران', IQ:'عراق', SA:'عربستان سعودی', AE:'امارات متحده عربی', KW:'کویت',
  BH:'بحرین', QA:'قطر', OM:'عمان', YE:'یمن', SY:'سوریه',
  LB:'لبنان', JO:'اردن', PS:'فلسطین', IL:'اسرائیل',
  /* آفریقا */
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
  /* آسیا */
  PK:'پاکستان', IN:'هند', BD:'بنگلادش', LK:'سریلانکا', NP:'نپال',
  BT:'بوتان', MV:'مالدیو', AF:'افغانستان', MM:'میانمار', TH:'تایلند',
  VN:'ویتنام', KH:'کامبوج', LA:'لائوس', MY:'مالزی', SG:'سنگاپور',
  BN:'برونئی', ID:'اندونزی', PH:'فیلیپین', TL:'تیمور شرقی',
  CN:'چین', TW:'تایوان', HK:'هنگ کنگ', MO:'ماکائو',
  JP:'ژاپن', KR:'کره جنوبی', KP:'کره شمالی', MN:'مغولستان',
  TJ:'تاجیکستان', UZ:'ازبکستان', TM:'ترکمنستان', KZ:'قزاقستان',
  KG:'قرقیزستان', AZ:'آذربایجان', GE:'گرجستان', AM:'ارمنستان',
  TR:'ترکیه', CY:'قبرس',
  /* اروپا */
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
  /* آمریکا */
  US:'آمریکا', CA:'کانادا', MX:'مکزیک', GT:'گواتمالا', BZ:'بلیز',
  HN:'هندوراس', SV:'السالوادور', NI:'نیکاراگوئه', CR:'کاستاریکا',
  PA:'پاناما', CU:'کوبا', JM:'جامائیکا', HT:'هائیتی', DO:'دومینیکن',
  PR:'پورتوریکو', TT:'ترینیداد و توباگو', BB:'باربادوس',
  CO:'کلمبیا', VE:'ونزوئلا', GY:'گویان', SR:'سورینام', BR:'برزیل',
  EC:'اکوادور', PE:'پرو', BO:'بولیوی', CL:'شیلی', AR:'آرژانتین',
  UY:'اروگوئه', PY:'پاراگوئه',
  /* اقیانوسیه */
  AU:'استرالیا', NZ:'نیوزیلند', FJ:'فیجی', PG:'پاپوآ گینه نو',
  SB:'جزایر سلیمان', VU:'وانواتو', WS:'ساموآ', TO:'تونگا',
  /* سایر */
  XX:'نامشخص',
};

/* نمایش نام کشور: کد + نام فارسی */
function _countryLabel(code) {
  if (!code) return '—';
  const name = COUNTRY_NAMES[code.toUpperCase()];
  return name ? `${code.toUpperCase()} ${name}` : code.toUpperCase();
}

/* نمایش جنسیت به فارسی */
function _genderLabel(g) {
  return g === 'male' ? 'مرد' : g === 'female' ? 'زن' : g || '—';
}

/* نمایش وضعیت تاهل به فارسی */
function _maritalLabel(m) {
  const map = { single:'مجرد', married:'متاهل', divorced:'مطلقه', widowed:'بیوه' };
  return map[m] || m || '—';
}

const CURRENCIES = ['IQD','IRR','PKR','USD','TRY','RUB','AZN','IDR'];

export function renderIstikharaAdminPage(container) {
  if (!container) return;

  let _activeTab = 'orders'; /* 'orders' | 'settings' | 'cache' */

  function _render() {
    const config = IstikharaConfig.get();
    const orders = IstikharaOrders.getAll();
    const cache  = (() => { try { return JSON.parse(localStorage.getItem('mh_istikhara_cache')||'[]'); } catch { return []; } })();

    const freeOrders = orders.filter(o => o.type === 'free');
    const paidOrders = orders.filter(o => o.type === 'paid');
    const doneOrders = orders.filter(o => o.status === 'done');

    container.innerHTML = `
      <div>
        <!-- Header -->
        <div class="admin-page-header">
          <div>
            <h1 class="admin-page-title">
              <span class="admin-page-title__icon">⭐</span>
              مدیریت استخاره
            </h1>
            <p class="admin-page-desc">
              ${orders.length} درخواست — ${freeOrders.length} رایگان — ${paidOrders.length} پولی
            </p>
          </div>
          <div class="flex gap-3">
            ${['orders','settings','cache'].map(tab => `
              <button class="btn btn--${_activeTab===tab?'primary':'outline'} btn--sm tab-btn" data-tab="${tab}">
                ${{orders:'📋 درخواست‌ها', settings:'⚙️ تنظیمات', cache:'🧠 حافظه AI'}[tab]}
              </button>
            `).join('')}
          </div>
        </div>

        <!-- Stat Cards -->
        <div class="admin-stats-grid" style="margin-bottom:var(--space-5)">
          ${[
            {label:'کل درخواست‌ها', num:orders.length,     color:'teal',   icon:'⭐'},
            {label:'رایگان',         num:freeOrders.length, color:'green',  icon:'🕌'},
            {label:'پولی',           num:paidOrders.length, color:'purple', icon:'🎤'},
            {label:'انجام‌شده',      num:doneOrders.length, color:'blue',   icon:'✓'},
            {label:'حافظه AI',       num:cache.length,      color:'amber',  icon:'🧠'},
          ].map(s => `
            <div class="admin-stat-card admin-stat-card--${s.color}">
              <div class="admin-stat-card__header">
                <span class="admin-stat-card__label">${s.label}</span>
                <div class="admin-stat-card__icon">${s.icon}</div>
              </div>
              <div class="admin-stat-card__num">${s.num}</div>
            </div>
          `).join('')}
        </div>

        <!-- Content -->
        ${_activeTab === 'orders'   ? _renderOrdersTab(orders)   : ''}
        ${_activeTab === 'settings' ? _renderSettingsTab(config)  : ''}
        ${_activeTab === 'cache'    ? _renderCacheTab(cache)      : ''}
      </div>
    `;

    _bindEvents();
  }

  /* ── تب درخواست‌ها ── */
  function _renderOrdersTab(orders) {
    return `
      <div class="admin-table-wrap">
        <div class="admin-table-header">
          <div class="admin-table-title">📋 همه درخواست‌های استخاره</div>
          <div class="flex gap-3">
            <select class="admin-input" style="width:140px" id="filter-type">
              <option value="">همه</option>
              <option value="free">رایگان</option>
              <option value="paid">پولی</option>
            </select>
            <select class="admin-input" style="width:140px" id="filter-lang">
              <option value="">همه زبان‌ها</option>
              ${Object.entries(LANG_INFO).map(([k,v])=>`<option value="${k}">${v.flag} ${v.name}</option>`).join('')}
            </select>
          </div>
        </div>
        <div style="overflow-x:auto">
          <table class="admin-table" aria-label="درخواست‌های استخاره">
            <thead>
              <tr>
                <th>کاربر</th>
                <th>نوع</th>
                <th>زبان</th>
                <th>کشور</th>
                <th>سن</th>
                <th>جنسیت</th>
                <th>وضعیت تاهل</th>
                <th>موضوع</th>
                <th>جواب AI</th>
                <th>صوت</th>
                <th>وضعیت</th>
                <th>تاریخ</th>
              </tr>
            </thead>
            <tbody id="orders-tbody">
              ${orders.length === 0
                ? `<tr><td colspan="12" style="text-align:center;color:var(--text-muted);padding:var(--space-8)">درخواستی وجود ندارد</td></tr>`
                : orders.map(o => `
                  <tr data-type="${o.type}" data-lang="${o.userLang}">
                    <td>
                      <div style="font-weight:600;font-size:var(--text-sm)">${o.userName || '—'}</div>
                      <div style="font-size:var(--text-xs);color:var(--text-muted)">${o.userId}</div>
                    </td>
                    <td>
                      <span class="admin-badge admin-badge--${o.type==='paid'?'purple':'active'}">
                        ${o.type==='paid'?'🎤 پولی':'🕌 رایگان'}
                      </span>
                    </td>
                    <td>${LANG_INFO[o.userLang]?.flag??'🌐'} ${LANG_INFO[o.userLang]?.name??o.userLang}</td>
                    <td style="white-space:nowrap">${_countryLabel(o.userCountry)}</td>
                    <td style="text-align:center;font-size:var(--text-xs)">${o.userAge || '—'}</td>
                    <td style="font-size:var(--text-xs)">${_genderLabel(o.userGender)}</td>
                    <td style="font-size:var(--text-xs)">${_maritalLabel(o.userMarital)}</td>
                    <td style="max-width:180px;font-size:var(--text-xs);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
                      ${o.topic || '<span style="color:var(--text-muted)">—</span>'}
                    </td>
                    <td>
                      ${o.resultText || o.finalText
                        ? `<button class="btn btn--ghost btn--sm view-response-btn"
                            data-text="${encodeURIComponent(o.resultText||o.finalText||'')}"
                            style="font-size:var(--text-xs)">
                            👁 مشاهده
                          </button>`
                        : '<span style="color:var(--text-muted);font-size:var(--text-xs)">—</span>'
                      }
                    </td>
                    <td>
                      ${o.audioUrl
                        ? `<audio controls style="height:32px;width:120px" aria-label="صوت استخاره">
                            <source src="${o.audioUrl}"/>
                           </audio>`
                        : '<span style="color:var(--text-muted);font-size:var(--text-xs)">—</span>'
                      }
                    </td>
                    <td>
                      <span class="admin-badge admin-badge--${o.status==='done'?'done':o.status==='error'?'rejected':'pending'}">
                        ${o.status==='done'?'✓ انجام شد':o.status==='error'?'خطا':'در انتظار'}
                      </span>
                    </td>
                    <td style="font-size:var(--text-xs)">${new Date(o.createdAt).toLocaleDateString('fa-IR')}</td>
                  </tr>
                `).join('')
              }
            </tbody>
          </table>
        </div>
      </div>

      <!-- Modal متن جواب -->
      <div id="response-modal" style="display:none;position:fixed;inset:0;background:var(--bg-overlay);z-index:var(--z-modal);align-items:center;justify-content:center;padding:24px">
        <div style="background:var(--bg-surface);border-radius:var(--radius-xl);max-width:560px;width:100%;padding:32px;box-shadow:var(--shadow-2xl);max-height:80vh;overflow-y:auto">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
            <h3 style="font-size:var(--text-lg);font-weight:var(--weight-bold)">جواب استخاره</h3>
            <button id="close-response-modal" style="background:none;border:none;cursor:pointer;font-size:20px;color:var(--text-muted)">✕</button>
          </div>
          <div id="response-text" style="font-size:var(--text-base);line-height:var(--leading-relaxed);color:var(--text-secondary);white-space:pre-line;background:var(--bg-surface-2);border-radius:var(--radius-md);padding:var(--space-5)"></div>
        </div>
      </div>
    `;
  }

  /* ── تب تنظیمات ── */
  function _renderSettingsTab(config) {
    return `
      <div>
        <!-- فعال/غیرفعال -->
        <div class="admin-panel" style="margin-bottom:var(--space-5)">
          <div class="admin-panel__header">
            <div class="admin-panel__title">⚙️ تنظیمات کلی</div>
          </div>
          <div class="admin-panel__body" style="display:flex;flex-direction:column;gap:var(--space-4)">
            <label class="admin-toggle">
              <input type="checkbox" id="free-active" ${config.freeActive?'checked':''}/>
              <div class="admin-toggle__track"><div class="admin-toggle__thumb"></div></div>
              <span class="admin-toggle__label">استخاره رایگان فعال باشد</span>
            </label>
            <label class="admin-toggle">
              <input type="checkbox" id="paid-active" ${config.paidActive?'checked':''}/>
              <div class="admin-toggle__track"><div class="admin-toggle__thumb"></div></div>
              <span class="admin-toggle__label">استخاره پولی فعال باشد (همه زبان‌ها)</span>
            </label>
            <!-- تأخیر ارسال -->
            <div class="grid grid--2" style="gap:var(--space-4);margin-bottom:var(--space-4)">
              <div class="admin-field">
                <label class="admin-label" for="free-delay">
                  تأخیر استخاره رایگان (دقیقه)
                  <span class="admin-label-hint">پیش‌فرض: ۶۰ دقیقه = ۱ ساعت</span>
                </label>
                <input type="number" class="admin-input" id="free-delay"
                  value="${config.freeDelayMinutes??60}" min="1" max="1440"/>
              </div>
              <div class="admin-field">
                <label class="admin-label" for="paid-delay">
                  تأخیر استخاره پولی (دقیقه)
                  <span class="admin-label-hint">پیش‌فرض: ۱۲۰ دقیقه = ۲ ساعت</span>
                </label>
                <input type="number" class="admin-input" id="paid-delay"
                  value="${config.paidDelayMinutes??120}" min="1" max="1440"/>
              </div>
            </div>

            <div class="admin-field">
              <label class="admin-label" for="similarity-threshold">
                درصد شباهت برای استفاده از حافظه AI
                <span class="admin-label-hint">اگر موضوع جدید X٪ شبیه موضوع قبلی بود، همان جواب ارسال می‌شود</span>
              </label>
              <div style="display:flex;align-items:center;gap:var(--space-3)">
                <input type="range" id="similarity-threshold" min="70" max="100" value="${Math.round((config.similarityThreshold??0.9)*100)}"
                  style="flex:1" aria-label="درصد شباهت"/>
                <span id="similarity-value" style="font-weight:bold;min-width:40px">${Math.round((config.similarityThreshold??0.9)*100)}%</span>
              </div>
            </div>
          </div>
        </div>

        <!-- قیمت‌گذاری — فقط USD، سایت خودکار به ارز کاربر تبدیل می‌کند -->
        <div class="admin-panel" style="margin-bottom:var(--space-5)">
          <div class="admin-panel__header">
            <div class="admin-panel__title">💰 قیمت استخاره پولی</div>
          </div>
          <div class="admin-panel__body">
            <div class="admin-field" style="max-width:280px">
              <label class="admin-label" for="price-USD">
                قیمت (USD — دلار)
                <span class="admin-label-hint" style="color:var(--text-muted);font-weight:400;margin-inline-start:8px">
                  ℹ️ سایت خودکار به ارز کاربر تبدیل می‌کند
                </span>
              </label>
              <div style="display:flex;align-items:center;gap:var(--space-3)">
                <span style="font-size:1.4rem">$</span>
                <input type="number" class="admin-input" id="price-USD"
                  value="${config.paidPrice?.USD ?? 0}" min="0" step="0.5" style="max-width:160px"/>
              </div>
            </div>
          </div>
        </div>

        <!-- ElevenLabs -->
        <div class="admin-panel">
          <div class="admin-panel__header">
            <div class="admin-panel__title">🎤 تنظیمات صدا (ElevenLabs)</div>
          </div>
          <div class="admin-panel__body">
            <div class="grid grid--2" style="gap:var(--space-4)">
              <div class="admin-field">
                <label class="admin-label" for="elevenlabs-key">ElevenLabs API Key</label>
                <input type="password" class="admin-input" id="elevenlabs-key"
                  value="${localStorage.getItem('mh_elevenlabs_key')??''}"
                  placeholder="sk_..." dir="ltr" autocomplete="off"/>
              </div>
              <div class="admin-field">
                <label class="admin-label" for="voice-id">Voice ID استاد</label>
                <input type="text" class="admin-input" id="voice-id"
                  value="${localStorage.getItem('mh_voice_id')??''}"
                  placeholder="Voice ID از ElevenLabs" dir="ltr"/>
              </div>
            </div>
          </div>
        </div>

        <button class="btn btn--primary btn--lg" id="save-istikhara-settings" style="margin-top:var(--space-5)">
          💾 ذخیره همه تنظیمات
        </button>
      </div>
    `;
  }

  /* ── تب حافظه AI ── */
  function _renderCacheTab(cache) {
    return `
      <div class="admin-table-wrap">
        <div class="admin-table-header">
          <div class="admin-table-title">🧠 حافظه AI (${cache.length} پاسخ ذخیره‌شده)</div>
          <button class="btn btn--outline btn--sm" id="clear-cache-btn" style="color:var(--color-error);border-color:var(--color-error)">
            🗑 پاک کردن حافظه
          </button>
        </div>
        <div style="overflow-x:auto">
          <table class="admin-table">
            <thead>
              <tr><th>موضوع</th><th>تاریخ ذخیره</th><th>پاسخ</th></tr>
            </thead>
            <tbody>
              ${cache.length === 0
                ? `<tr><td colspan="3" style="text-align:center;color:var(--text-muted);padding:var(--space-6)">حافظه خالی است</td></tr>`
                : cache.map(c => `
                  <tr>
                    <td style="font-size:var(--text-sm);max-width:200px">${c.topic}</td>
                    <td style="font-size:var(--text-xs)">${new Date(c.createdAt).toLocaleDateString('fa-IR')}</td>
                    <td>
                      <div style="max-width:300px;font-size:var(--text-xs);color:var(--text-muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
                        ${c.responseFa?.slice(0,80)}...
                      </div>
                    </td>
                  </tr>
                `).join('')
              }
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  /* ── Events ── */
  function _bindEvents() {
    container.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => { _activeTab = btn.dataset.tab; _render(); });
    });

    /* فیلتر */
    ['filter-type','filter-lang'].forEach(id => {
      document.getElementById(id)?.addEventListener('change', () => {
        const type = document.getElementById('filter-type')?.value;
        const lang = document.getElementById('filter-lang')?.value;
        container.querySelectorAll('#orders-tbody tr[data-type]').forEach(row => {
          const show = (!type || row.dataset.type === type) && (!lang || row.dataset.lang === lang);
          row.style.display = show ? '' : 'none';
        });
      });
    });

    /* مشاهده پاسخ */
    container.querySelectorAll('.view-response-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const text  = decodeURIComponent(btn.dataset.text);
        const modal = document.getElementById('response-modal');
        const el    = document.getElementById('response-text');
        if (modal && el) { el.textContent = text; modal.style.display = 'flex'; }
      });
    });

    document.getElementById('close-response-modal')?.addEventListener('click', () => {
      document.getElementById('response-modal').style.display = 'none';
    });

    /* slider */
    document.getElementById('similarity-threshold')?.addEventListener('input', (e) => {
      const el = document.getElementById('similarity-value');
      if (el) el.textContent = e.target.value + '%';
    });

    /* ذخیره تنظیمات */
    document.getElementById('save-istikhara-settings')?.addEventListener('click', () => {
      const usdPrice = parseFloat(document.getElementById('price-USD')?.value) || 0;
      /* تبدیل خودکار به سایر ارزها با نرخ تقریبی — سایت نرخ لحظه‌ای را جایگزین می‌کند */
      const price = {
        USD: usdPrice,
        IQD: Math.round(usdPrice * 1310),
        IRR: Math.round(usdPrice * 62000),
        PKR: Math.round(usdPrice * 280),
        TRY: Math.round(usdPrice * 32),
        RUB: Math.round(usdPrice * 90),
        AZN: Math.round(usdPrice * 1.7),
        IDR: Math.round(usdPrice * 16200),
      };
      const threshold = parseInt(document.getElementById('similarity-threshold')?.value || '90') / 100;
      IstikharaConfig.set({
        freeActive:           document.getElementById('free-active')?.checked ?? true,
        paidActive:           document.getElementById('paid-active')?.checked ?? true,
        paidPrice:            price,
        similarityThreshold:  threshold,
        freeDelayMinutes:     parseInt(document.getElementById('free-delay')?.value || '60'),
        paidDelayMinutes:     parseInt(document.getElementById('paid-delay')?.value || '120'),
      });
      /* ذخیره ElevenLabs */
      const key     = document.getElementById('elevenlabs-key')?.value?.trim();
      const voiceId = document.getElementById('voice-id')?.value?.trim();
      if (key)     localStorage.setItem('mh_elevenlabs_key', key);
      if (voiceId) localStorage.setItem('mh_voice_id', voiceId);
      _showToast('✓ تنظیمات ذخیره شد');
    });

    /* پاک کردن حافظه */
    document.getElementById('clear-cache-btn')?.addEventListener('click', () => {
      if (!confirm('آیا از پاک کردن حافظه AI مطمئن هستید؟')) return;
      localStorage.removeItem('mh_istikhara_cache');
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
    setTimeout(()=>{t.style.opacity='0';t.style.transition='opacity 0.3s';setTimeout(()=>t.remove(),300);},2500);
  }

  _render();
}
