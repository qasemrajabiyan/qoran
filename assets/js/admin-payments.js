/**
 * ============================================================
 * FILE: admin-payments.js
 * ROLE: داشبورد مدیریت پرداخت‌ها و تراکنش‌ها
 * PROJECT: MediaHub — پلتفرم رسانه‌ای کربلا
 * VERSION: 1.0.0
 * ============================================================
 */

import { PaymentConfig, PaymentsDB } from './payment-system.js';
import { translateText }              from './auto-translate.js';
import { NotifCenter }                from './notifications.js';

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
  fa:{name:'فارسی',flag:'🇮🇷'}, ar:{name:'عربی',flag:'🇸🇦'}, ur:{name:'اردو',flag:'🇵🇰'},
  az:{name:'آذری',flag:'🇦🇿'}, tr:{name:'ترکی',flag:'🇹🇷'}, ru:{name:'روسی',flag:'🇷🇺'},
  en:{name:'انگلیسی',flag:'🇺🇸'}, id:{name:'اندونزیایی',flag:'🇮🇩'},
};

const METHOD_META = {
  bankMelli: { label:'بانک ملی',    icon:'🏦', color:'#16a34a' },
  kikard:    { label:'کی‌کارد',     icon:'🇮🇶', color:'#2563eb' },
  onramper:  { label:'OnRamper',    icon:'🌐', color:'#7c3aed' },
  crypto:    { label:'ارز دیجیتال', icon:'₿',  color:'#f59e0b' },
};

const CURRENCIES = ['IQD','IRR','PKR','USD','TRY','RUB','AZN','IDR'];
const WALLETS_META = [
  {key:'usdt_trc20', label:'USDT TRC20', placeholder:'TXxx...'},
  {key:'usdt_bep20', label:'USDT BEP20', placeholder:'0x...'},
  {key:'bitcoin',    label:'Bitcoin (BTC)', placeholder:'bc1...'},
  {key:'ethereum',   label:'Ethereum (ETH)', placeholder:'0x...'},
];

export function renderPaymentsAdminPage(container) {
  if (!container) return;

  let _tab           = 'transactions'; /* transactions | stats | settings */
  let _filterStatus  = '';
  let _filterMethod  = '';
  let _filterLang    = '';
  let _replyId       = null;

  function _render() {
    const config  = PaymentConfig.get();
    const stats   = PaymentsDB.getStats();
    const all     = PaymentsDB.getAll();

    container.innerHTML = `
      <div>
        <!-- Header -->
        <div class="admin-page-header">
          <div>
            <h1 class="admin-page-title">
              <span class="admin-page-title__icon">💳</span>
              مدیریت پرداخت‌ها
            </h1>
            <p class="admin-page-desc">
              ${all.length} تراکنش —
              <span style="color:var(--color-error);font-weight:600">${stats.pending} در انتظار تأیید</span>
              — مجموع ≈ $${stats.totalUSD.toFixed(0)}
            </p>
          </div>
          <div class="flex gap-3 flex-wrap">
            ${['transactions','stats','settings'].map(t=>`
              <button class="btn btn--${_tab===t?'primary':'outline'} btn--sm tab-btn" data-tab="${t}">
                ${{transactions:`📋 تراکنش‌ها${stats.pending>0?` (${stats.pending})`:''}`, stats:'📊 آمار مالی', settings:'⚙️ تنظیمات'}[t]}
              </button>
            `).join('')}
          </div>
        </div>

        <!-- Stats Row -->
        <div class="admin-stats-grid" style="margin-bottom:var(--space-5)">
          ${[
            {label:'کل تراکنش‌ها',    num:all.length,         color:'teal',   icon:'💳'},
            {label:'در انتظار',        num:stats.pending,      color:'amber',  icon:'⏳'},
            {label:'تأییدشده',         num:stats.confirmed,    color:'green',  icon:'✓'},
            {label:'مجموع درآمد (USD)',num:'$'+stats.totalUSD.toFixed(0), color:'purple', icon:'💵'},
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

        ${_tab === 'transactions' ? _renderTransactions(all) : ''}
        ${_tab === 'stats'        ? _renderStats(stats, all)  : ''}
        ${_tab === 'settings'     ? _renderSettings(config)   : ''}

        ${_replyId ? _renderReplyModal(all) : ''}
      </div>
    `;

    _bindEvents();
  }

  /* ── تراکنش‌ها ── */
  function _renderTransactions(all) {
    let filtered = all;
    if (_filterStatus) filtered = filtered.filter(p => p.status === _filterStatus);
    if (_filterMethod) filtered = filtered.filter(p => p.method === _filterMethod);
    if (_filterLang)   filtered = filtered.filter(p => p.userLang === _filterLang);

    return `
      <div class="admin-table-wrap">
        <div class="admin-table-header">
          <div class="admin-table-title">📋 همه تراکنش‌ها (${filtered.length})</div>
          <div class="flex gap-3 flex-wrap">
            <!-- فیلترها -->
            <select class="admin-input" style="width:130px" id="filter-status">
              <option value="">همه وضعیت‌ها</option>
              <option value="pending" ${_filterStatus==='pending'?'selected':''}>در انتظار</option>
              <option value="confirmed" ${_filterStatus==='confirmed'?'selected':''}>تأیید</option>
              <option value="rejected" ${_filterStatus==='rejected'?'selected':''}>رد</option>
            </select>
            <select class="admin-input" style="width:130px" id="filter-method">
              <option value="">همه روش‌ها</option>
              ${Object.entries(METHOD_META).map(([k,v])=>`<option value="${k}" ${_filterMethod===k?'selected':''}>${v.icon} ${v.label}</option>`).join('')}
            </select>
            <select class="admin-input" style="width:130px" id="filter-lang">
              <option value="">همه زبان‌ها</option>
              ${Object.entries(LANG_INFO).map(([k,v])=>`<option value="${k}" ${_filterLang===k?'selected':''}>${v.flag} ${v.name}</option>`).join('')}
            </select>
            <!-- Export -->
            <button class="btn btn--outline btn--sm" id="export-btn">
              📥 Export CSV
            </button>
          </div>
        </div>
        <div style="overflow-x:auto">
          <table class="admin-table" aria-label="تراکنش‌های پرداخت">
            <thead>
              <tr>
                <th>کاربر</th>
                <th>مبلغ</th>
                <th>روش</th>
                <th>زبان</th>
                <th>کشور</th>
                <th>موضوع</th>
                <th>TX ID</th>
                <th>رسید</th>
                <th>وضعیت</th>
                <th>تاریخ</th>
                <th>عملیات</th>
              </tr>
            </thead>
            <tbody>
              ${filtered.length===0
                ? `<tr><td colspan="11" style="text-align:center;color:var(--text-muted);padding:var(--space-8)">تراکنشی یافت نشد</td></tr>`
                : filtered.map(p=>{
                  const meth = METHOD_META[p.method] ?? {label:p.method,icon:'💳',color:'#64748b'};
                  return `
                    <tr>
                      <td>
                        <div style="font-weight:600">${p.userName||'—'}</div>
                        <div style="font-size:var(--text-xs);color:var(--text-muted)">${p.userId||''}</div>
                      </td>
                      <td>
                        <div style="font-weight:700;color:var(--color-primary-600)">
                          ${p.amount?.toLocaleString()} ${p.currency??''}
                        </div>
                        ${p.amount&&p.rateToUSD&&p.currency!=='USD'
                          ? `<div style="font-size:var(--text-xs);color:var(--text-muted)">≈ $${(p.amount/p.rateToUSD).toFixed(2)}</div>`
                          : ''}
                      </td>
                      <td>
                        <span style="color:${meth.color};font-weight:600">
                          ${meth.icon} ${meth.label}
                        </span>
                      </td>
                      <td>${LANG_INFO[p.userLang]?.flag??'🌐'} ${LANG_INFO[p.userLang]?.name??p.userLang??'—'}</td>
                      <td style="white-space:nowrap">${_countryLabel(p.userCountry)}</td>
                      <td style="max-width:150px;font-size:var(--text-xs);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
                        ${p.intention||'<span style="color:var(--text-muted)">—</span>'}
                      </td>
                      <td>
                        ${p.txId
                          ? `<code style="font-size:var(--text-xs);direction:ltr;background:var(--bg-surface-2);padding:2px 6px;border-radius:4px">${p.txId.slice(0,12)}...</code>`
                          : '<span style="color:var(--text-muted);font-size:var(--text-xs)">—</span>'
                        }
                      </td>
                      <td>
                        ${p.hasReceipt
                          ? `<span class="admin-badge admin-badge--active">📎 دارد</span>`
                          : '<span style="color:var(--text-muted);font-size:var(--text-xs)">—</span>'
                        }
                      </td>
                      <td>
                        <span class="admin-badge admin-badge--${p.status==='confirmed'?'done':p.status==='rejected'?'rejected':'pending'}">
                          ${p.status==='confirmed'?'✓ تأیید':p.status==='rejected'?'✕ رد':'⏳ انتظار'}
                        </span>
                      </td>
                      <td style="font-size:var(--text-xs)">${new Date(p.createdAt).toLocaleDateString('fa-IR')}</td>
                      <td>
                        <div style="display:flex;gap:var(--space-2);flex-wrap:wrap">
                          ${p.status==='pending' ? `
                            <button class="confirm-pay-btn btn btn--primary btn--sm" data-id="${p.id}">✓</button>
                            <button class="reject-pay-btn btn btn--ghost btn--sm" data-id="${p.id}" style="color:var(--color-error)">✕</button>
                          ` : ''}
                          <button class="reply-pay-btn btn btn--outline btn--sm" data-id="${p.id}">💌</button>
                        </div>
                      </td>
                    </tr>
                  `;
                }).join('')
              }
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  /* ── آمار مالی ── */
  function _renderStats(stats, all) {
    /* آمار روزانه */
    const today     = new Date().toDateString();
    const todayPays = all.filter(p => new Date(p.createdAt).toDateString() === today);
    const thisMonth = new Date().getMonth();
    const monthPays = all.filter(p => new Date(p.createdAt).getMonth() === thisMonth);

    return `
      <div>
        <div class="grid grid--2" style="gap:var(--space-5);margin-bottom:var(--space-5)">

          <!-- روش‌های پرداخت -->
          <div class="admin-chart-card">
            <div class="admin-chart-header">
              <div class="admin-chart-title">💳 روش‌های پرداخت</div>
            </div>
            <div style="display:flex;flex-direction:column;gap:var(--space-3)">
              ${Object.entries(stats.byMethod).sort((a,b)=>b[1]-a[1]).map(([method,count])=>{
                const meth = METHOD_META[method]??{label:method,icon:'💳',color:'#64748b'};
                const pct  = stats.confirmed ? Math.round(count/stats.confirmed*100) : 0;
                return `
                  <div>
                    <div style="display:flex;justify-content:space-between;font-size:var(--text-sm);margin-bottom:4px">
                      <span>${meth.icon} ${meth.label}</span>
                      <span style="font-weight:700;color:${meth.color}">${count} (${pct}%)</span>
                    </div>
                    <div style="height:6px;background:var(--border-color);border-radius:999px;overflow:hidden">
                      <div style="height:100%;width:${pct}%;background:${meth.color};border-radius:999px;transition:width 0.8s ease"></div>
                    </div>
                  </div>
                `;
              }).join('') || '<div style="color:var(--text-muted)">داده‌ای وجود ندارد</div>'}
            </div>
          </div>

          <!-- تراکنش‌های دوره -->
          <div class="admin-chart-card">
            <div class="admin-chart-header">
              <div class="admin-chart-title">📅 آمار دوره</div>
            </div>
            <div style="display:flex;flex-direction:column;gap:var(--space-4)">
              ${[
                {label:'امروز',    count:todayPays.length},
                {label:'این ماه', count:monthPays.length},
                {label:'کل',       count:all.length},
              ].map(d=>`
                <div style="display:flex;justify-content:space-between;align-items:center">
                  <span style="font-size:var(--text-sm);color:var(--text-secondary)">${d.label}</span>
                  <span style="font-size:var(--text-xl);font-weight:800;color:var(--color-primary-600)">${d.count}</span>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- کشورها -->
          <div class="admin-chart-card">
            <div class="admin-chart-header">
              <div class="admin-chart-title">🌍 کشورهای پرداخت‌کننده</div>
            </div>
            <div style="display:flex;flex-direction:column;gap:var(--space-2)">
              ${Object.entries(stats.byCountry).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([c,n])=>`
                <div style="display:flex;justify-content:space-between;font-size:var(--text-sm)">
                  <span>${c}</span>
                  <span style="font-weight:700;color:var(--color-primary-600)">${n}</span>
                </div>
              `).join('') || '<div style="color:var(--text-muted)">داده‌ای وجود ندارد</div>'}
            </div>
          </div>

          <!-- کارت درآمد کل -->
          <div class="admin-chart-card" style="background:linear-gradient(135deg,var(--color-primary-600),var(--color-primary-800));border:none">
            <div style="text-align:center;padding:var(--space-4)">
              <div style="font-size:var(--text-sm);color:rgba(255,255,255,0.7);margin-bottom:var(--space-3)">مجموع درآمد تأیید‌شده</div>
              <div style="font-size:2.5rem;font-weight:900;color:white">${'$'+stats.totalUSD.toFixed(0)}</div>
              <div style="font-size:var(--text-xs);color:rgba(255,255,255,0.5);margin-top:var(--space-2)">
                ${stats.confirmed} تراکنش تأییدشده
              </div>
            </div>
          </div>

        </div>
      </div>
    `;
  }

  /* ── تنظیمات ── */
  function _renderSettings(config) {
    return `
      <div>
        <!-- کیف پول‌های ارز دیجیتال -->
        <div class="admin-panel" style="margin-bottom:var(--space-5)">
          <div class="admin-panel__header">
            <div class="admin-panel__title">₿ آدرس کیف پول‌های ارز دیجیتال</div>
          </div>
          <div class="admin-panel__body">
            <div class="grid grid--2" style="gap:var(--space-4)">
              ${WALLETS_META.map(w=>`
                <div class="admin-field">
                  <label class="admin-label" for="wallet-${w.key}">${w.label}</label>
                  <input type="text" class="admin-input wallet-input" id="wallet-${w.key}"
                    data-wallet="${w.key}"
                    value="${config.wallets?.[w.key]??''}"
                    dir="ltr" placeholder="${w.placeholder}"
                    autocomplete="off"/>
                </div>
              `).join('')}
            </div>
          </div>
        </div>

        <!-- OnRamper -->
        <div class="admin-panel" style="margin-bottom:var(--space-5)">
          <div class="admin-panel__header">
            <div class="admin-panel__title">🌐 OnRamper (جهانی — به جز ایران)</div>
          </div>
          <div class="admin-panel__body">
            <div class="grid grid--2" style="gap:var(--space-4)">
              <div class="admin-field">
                <label class="admin-label" for="onramper-key">API Key</label>
                <input type="password" class="admin-input" id="onramper-key"
                  value="${config.onramper?.apiKey??''}" dir="ltr" placeholder="pk_..."/>
              </div>
              <div class="admin-field">
                <label class="admin-label" for="onramper-wallet">آدرس دریافت</label>
                <input type="text" class="admin-input" id="onramper-wallet"
                  value="${config.onramper?.walletAddress??''}" dir="ltr"/>
              </div>
            </div>
          </div>
        </div>

        <!-- کی‌کارد عراق -->
        <div class="admin-panel" style="margin-bottom:var(--space-5)">
          <div class="admin-panel__header">
            <div class="admin-panel__title">🇮🇶 کی‌کارد / حساب بانکی عراق (فقط عراق)</div>
            <label class="admin-toggle">
              <input type="checkbox" id="kikard-active" ${config.kikard?.active?'checked':''}/>
              <div class="admin-toggle__track"><div class="admin-toggle__thumb"></div></div>
            </label>
          </div>
          <div class="admin-panel__body">
            <div class="grid grid--2" style="gap:var(--space-4)">
              <div class="admin-field">
                <label class="admin-label" for="kikard-id">Ki-Card ID / شماره حساب</label>
                <input type="text" class="admin-input" id="kikard-id"
                  value="${config.kikard?.accountId??''}" dir="ltr"/>
              </div>
              <div class="admin-field">
                <label class="admin-label" for="kikard-phone">شماره تلفن</label>
                <input type="text" class="admin-input" id="kikard-phone"
                  value="${config.kikard?.phone??''}" dir="ltr" placeholder="+964..."/>
              </div>
              <div class="admin-field">
                <label class="admin-label" for="kikard-name">نام صاحب حساب</label>
                <input type="text" class="admin-input" id="kikard-name"
                  value="${config.kikard?.accountName??''}"/>
              </div>
            </div>
          </div>
        </div>

        <!-- بانک ملی ایران -->
        <div class="admin-panel" style="margin-bottom:var(--space-5)">
          <div class="admin-panel__header">
            <div class="admin-panel__title">🇮🇷 بانک ملی ایران (فقط ایران)</div>
            <label class="admin-toggle">
              <input type="checkbox" id="bankmelli-active" ${config.bankMelli?.active?'checked':''}/>
              <div class="admin-toggle__track"><div class="admin-toggle__thumb"></div></div>
            </label>
          </div>
          <div class="admin-panel__body">
            <div class="grid grid--2" style="gap:var(--space-4)">
              <div class="admin-field">
                <label class="admin-label" for="bm-card">شماره کارت</label>
                <input type="text" class="admin-input" id="bm-card"
                  value="${config.bankMelli?.cardNumber??''}" dir="ltr" placeholder="6037-xxxx-xxxx-xxxx"/>
              </div>
              <div class="admin-field">
                <label class="admin-label" for="bm-name">نام صاحب حساب</label>
                <input type="text" class="admin-input" id="bm-name"
                  value="${config.bankMelli?.accountName??''}"/>
              </div>
              <div class="admin-field" style="grid-column:span 2">
                <label class="admin-label" for="bm-sheba">شماره شبا</label>
                <input type="text" class="admin-input" id="bm-sheba"
                  value="${config.bankMelli?.shebaNumber??''}" dir="ltr" placeholder="IR..."/>
              </div>
            </div>
          </div>
        </div>

        <button class="btn btn--primary btn--lg" id="save-payment-settings">💾 ذخیره همه تنظیمات</button>
      </div>
    `;
  }

  /* ── Modal پیام تأیید ── */
  function _renderReplyModal(all) {
    const pay = all.find(p => p.id === _replyId);
    if (!pay) return '';
    const meth = METHOD_META[pay.method] ?? {label:pay.method,icon:'💳'};

    return `
      <div id="reply-overlay" style="
        position:fixed;inset:0;background:var(--bg-overlay);backdrop-filter:blur(8px);
        z-index:var(--z-modal);display:flex;align-items:center;justify-content:center;padding:24px;
      ">
        <div style="
          background:var(--bg-surface);border-radius:var(--radius-xl);
          max-width:520px;width:100%;padding:32px;box-shadow:var(--shadow-2xl);
          animation:scaleIn 0.3s ease;
        ">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
            <h3 style="font-size:var(--text-lg);font-weight:bold">💌 پیام برای کاربر</h3>
            <button id="close-reply" style="background:none;border:none;cursor:pointer;font-size:20px">✕</button>
          </div>
          <div style="
            background:var(--bg-surface-2);border-radius:var(--radius-md);
            padding:var(--space-3) var(--space-4);margin-bottom:16px;
            font-size:var(--text-sm);color:var(--text-muted);
            display:flex;gap:8px;align-items:center;flex-wrap:wrap;
          ">
            ${LANG_INFO[pay.userLang]?.flag??'🌐'}
            ${pay.userName} · ${_countryLabel(pay.userCountry)} ·
            ${meth.icon} ${meth.label} ·
            ${pay.amount?.toLocaleString()} ${pay.currency??''}
          </div>
          <textarea id="reply-text" class="admin-textarea" rows="5"
            placeholder="متن پیام تأیید را بنویسید — AI به زبان کاربر ترجمه می‌کند..."
          >با تشکر از پرداخت شما — سرویس درخواستی به زودی برای شما فعال می‌شود.</textarea>
          <div style="display:flex;gap:12px;margin-top:16px">
            <button class="btn btn--ghost" id="close-reply-2">انصراف</button>
            <button class="btn btn--primary" style="flex:1" id="send-reply-btn">📤 ارسال پیام</button>
          </div>
        </div>
      </div>
    `;
  }

  /* ── Export CSV ── */
  function _exportCSV(all) {
    const headers = ['ID','نام','زبان','کشور','مبلغ','ارز','روش','TX ID','رسید','وضعیت','تاریخ','موضوع'];
    const rows = all.map(p => [
      p.id, p.userName, p.userLang, p.userCountry,
      p.amount, p.currency, p.method, p.txId??'',
      p.hasReceipt?'بله':'خیر', p.status,
      new Date(p.createdAt).toLocaleDateString('fa-IR'),
      (p.intention??'').replace(/,/g,' '),
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob(['\uFEFF'+csv], {type:'text/csv;charset=utf-8;'});
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `payments_${new Date().toISOString().slice(0,10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  }

  /* ── Events ── */
  function _bindEvents() {
    /* Tabs */
    container.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => { _tab = btn.dataset.tab; _render(); });
    });

    /* فیلترها */
    document.getElementById('filter-status')?.addEventListener('change', e => { _filterStatus = e.target.value; _render(); });
    document.getElementById('filter-method')?.addEventListener('change', e => { _filterMethod = e.target.value; _render(); });
    document.getElementById('filter-lang')?.addEventListener('change',   e => { _filterLang   = e.target.value; _render(); });

    /* Export */
    document.getElementById('export-btn')?.addEventListener('click', () => _exportCSV(PaymentsDB.getAll()));

    /* تأیید */
    container.querySelectorAll('.confirm-pay-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        PaymentsDB.update(btn.dataset.id, { status:'confirmed', confirmedAt: new Date().toISOString() });
        _showToast('✓ تراکنش تأیید شد');
        _render();
      });
    });

    /* رد */
    container.querySelectorAll('.reject-pay-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (!confirm('آیا این تراکنش رد شود؟')) return;
        PaymentsDB.update(btn.dataset.id, { status:'rejected' });
        _render();
      });
    });

    /* پیام */
    container.querySelectorAll('.reply-pay-btn').forEach(btn => {
      btn.addEventListener('click', () => { _replyId = btn.dataset.id; _render(); });
    });

    /* بستن reply modal */
    ['close-reply','close-reply-2'].forEach(id => {
      document.getElementById(id)?.addEventListener('click', () => { _replyId = null; _render(); });
    });
    document.getElementById('reply-overlay')?.addEventListener('click', e => {
      if (e.target.id === 'reply-overlay') { _replyId = null; _render(); }
    });

    /* ارسال پیام */
    document.getElementById('send-reply-btn')?.addEventListener('click', async () => {
      const text = document.getElementById('reply-text')?.value?.trim();
      if (!text) return;
      const pay  = PaymentsDB.getAll().find(p => p.id === _replyId);
      if (!pay) return;

      const btn = document.getElementById('send-reply-btn');
      if (btn) { btn.disabled=true; btn.textContent='⏳ ترجمه...'; }

      const lang  = pay.userLang ?? 'fa';
      const greet = {
        fa:`کاربر گرامی ${pay.userName}،\n\n`,
        ar:`عزيزي ${pay.userName}،\n\n`,
        ur:`محترم ${pay.userName}،\n\n`,
        en:`Dear ${pay.userName},\n\n`,
        id:`Yang terhormat ${pay.userName},\n\n`,
      };
      const g = greet[lang] ?? greet.fa;
      let body = text;
      if (lang !== 'fa') body = await translateText(text, lang, 'admin');

      await NotifCenter.send({
        type:'donation', icon:'💳',
        title:{ fa:'پیام از برکت‌هاب', [lang]:'پیام از برکت‌هاب' },
        text: { fa: greet.fa + text, [lang]: g + body },
        url:  '/messages.html',
      });

      _showToast('✓ پیام ارسال شد');
      _replyId = null; _render();
    });

    /* ذخیره تنظیمات */
    document.getElementById('save-payment-settings')?.addEventListener('click', () => {
      const wallets = {};
      container.querySelectorAll('.wallet-input').forEach(inp => {
        wallets[inp.dataset.wallet] = inp.value.trim();
      });
      PaymentConfig.set({
        wallets,
        onramper: {
          apiKey:        document.getElementById('onramper-key')?.value?.trim() ?? '',
          walletAddress: document.getElementById('onramper-wallet')?.value?.trim() ?? '',
        },
        kikard: {
          active:      document.getElementById('kikard-active')?.checked ?? false,
          accountId:   document.getElementById('kikard-id')?.value?.trim() ?? '',
          phone:       document.getElementById('kikard-phone')?.value?.trim() ?? '',
          accountName: document.getElementById('kikard-name')?.value?.trim() ?? '',
        },
        bankMelli: {
          active:      document.getElementById('bankmelli-active')?.checked ?? true,
          cardNumber:  document.getElementById('bm-card')?.value?.trim() ?? '',
          accountName: document.getElementById('bm-name')?.value?.trim() ?? '',
          shebaNumber: document.getElementById('bm-sheba')?.value?.trim() ?? '',
        },
        paymentExpiryMinutes: 15,
        confirmationRequired: true,
      });
      _showToast('✓ تنظیمات ذخیره شد');
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
