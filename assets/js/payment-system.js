/**
 * ============================================================
 * FILE: payment.js  [نسخه ۲ — جایگزین sadaqah.js]
 * ROLE: سیستم پرداخت — نرخ لحظه‌ای + درگاه‌های منطقه‌ای
 * PROJECT: BarakatHub — پلتفرم رسانه‌ای کربلا
 * VERSION: 2.0.0
 *
 * درگاه‌ها:
 *   ایران:    بانک ملی + ارز دیجیتال مستقیم
 *   عراق:     کی‌کارد / شماره حساب + ارز دیجیتال مستقیم
 *   جهان:     OnRamper + ارز دیجیتال مستقیم (به جز ایران)
 *
 * نرخ:
 *   CoinGecko API  — ارز دیجیتال (رایگان، بدون کلید)
 *   ExchangeRates  — ارز فیات (رایگان، بدون کلید)
 *   کش ۱۵ دقیقه  — برای کاهش درخواست‌ها
 * ============================================================
 */

import { i18n } from './i18n.js';
import { AuthState } from './auth.js';
import { NotifCenter } from './notifications.js';

/* ────────────────────────────────────────────────────────────
   1. CONFIG
   ──────────────────────────────────────────────────────────── */
const CONFIG_KEY    = 'mh_payment_config';
const PAYMENTS_KEY  = 'mh_payments';
const RATES_CACHE_KEY = 'mh_rates_cache';
const RATES_TTL_MS    = 15 * 60 * 1000; /* ۱۵ دقیقه */

export const PaymentConfig = {
  get() {
    try {
      return JSON.parse(localStorage.getItem(CONFIG_KEY) || 'null') || {
        /* کیف پول‌های ارز دیجیتال */
        wallets: {
          usdt_trc20: '',
          usdt_bep20: '',
          bitcoin:    '',
          ethereum:   '',
        },
        /* Transak */
        transak: { apiKey: '', environment: 'STAGING' },
        /* کی‌کارد عراق */
        kikard: { active: false, accountId: '', phone: '', accountName: '' },
        /* بانک ملی ایران */
        bankMelli: {
          active:      true,
          cardNumber:  '',
          accountName: '',
          shebaNumber: '',
        },
        /* تنظیمات */
        paymentExpiryMinutes: 15,
        confirmationRequired: true,
      };
    } catch { return { wallets:{}, transak:{}, kikard:{}, bankMelli:{} }; }
  },
  set(cfg) { try { localStorage.setItem(CONFIG_KEY, JSON.stringify(cfg)); } catch {} },
};

/* ────────────────────────────────────────────────────────────
   2. REGION DETECTION (از زبان و IP)
   ──────────────────────────────────────────────────────────── */
function _getRegion() {
  /* اولویت: ۱) کش IP  ۲) کش کشور  ۳) زبان */
  const ipCached = (() => { try { const c = JSON.parse(localStorage.getItem('mh_user_country_currency') || 'null'); return (c && Date.now() - c.ts < 24*60*60*1000) ? c : null; } catch { return null; } })();
  const country  = ipCached?.country ?? localStorage.getItem('mh_user_country') ?? '';
  const lang     = i18n.lang;
  if (country === 'IR') return 'IR';
  if (country === 'IQ') return 'IQ';
  /* اگر IP نداریم، زبان را fallback می‌کنیم */
  if (!country && lang === 'fa') return 'IR';
  if (!country && lang === 'ar') return 'IQ';
  return 'WORLD';
}

/* ────────────────────────────────────────────────────────────
   3. REAL-TIME EXCHANGE RATES
   دو منبع: CoinGecko (کریپتو) + ExchangeRatesAPI (فیات)
   ──────────────────────────────────────────────────────────── */
const FIAT_CURRENCIES = ['IQD','IRR','PKR','TRY','RUB','AZN','IDR','EUR','GBP'];
const CRYPTO_IDS      = { usdt:'tether', bitcoin:'bitcoin', ethereum:'ethereum' };

async function _fetchRates() {
  /* بررسی کش */
  try {
    const cached = JSON.parse(localStorage.getItem(RATES_CACHE_KEY) || 'null');
    if (cached && Date.now() - cached.timestamp < RATES_TTL_MS) {
      return cached.rates;
    }
  } catch {}

  const rates = { usd: 1, timestamp: Date.now() };

  try {
    /* ۱. نرخ فیات به دلار — ExchangeRates (رایگان بدون کلید) */
    const fiatRes  = await fetch(
      `https://api.exchangerate-api.com/v4/latest/USD`
    );
    const fiatData = await fiatRes.json();
    if (fiatData?.rates) {
      FIAT_CURRENCIES.forEach(c => {
        if (fiatData.rates[c]) rates[c.toLowerCase()] = fiatData.rates[c];
      });
    }
  } catch (err) {
    console.warn('[Rates] Fiat fetch failed:', err.message);
    /* مقادیر پشتیبان */
    rates.iqd = 1310; rates.irr = 62000; rates.pkr = 280;
    rates.try = 32; rates.rub = 90; rates.azn = 1.7; rates.idr = 16200;
  }

  try {
    /* ۲. نرخ کریپتو — CoinGecko (رایگان، بدون کلید) */
    const cryptoRes  = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=tether,bitcoin,ethereum&vs_currencies=usd`
    );
    const cryptoData = await cryptoRes.json();
    if (cryptoData?.tether?.usd)   rates.usdt  = cryptoData.tether.usd;
    if (cryptoData?.bitcoin?.usd)  rates.btc   = cryptoData.bitcoin.usd;
    if (cryptoData?.ethereum?.usd) rates.eth   = cryptoData.ethereum.usd;
  } catch (err) {
    console.warn('[Rates] Crypto fetch failed:', err.message);
    rates.usdt = 1; rates.btc = 95000; rates.eth = 3500;
  }

  /* ذخیره کش */
  try {
    localStorage.setItem(RATES_CACHE_KEY, JSON.stringify({ rates, timestamp: Date.now() }));
  } catch {}

  return rates;
}

/* تبدیل مبلغ دلار به ارز مقصد */
function _convertUSD(usdAmount, targetCurrency, rates) {
  const key = targetCurrency.toLowerCase();
  const rate = rates[key] ?? 1;
  return {
    amount:   Math.round(usdAmount * rate),
    currency: targetCurrency,
    rate,
    symbol: _getCurrencySymbol(targetCurrency),
  };
}

function _getCurrencySymbol(c) {
  const map = { IQD:'IQD', IRR:'تومان', PKR:'PKR', TRY:'₺', RUB:'₽', AZN:'₼', IDR:'IDR', USD:'$', EUR:'€', GBP:'£', USDT:'USDT', BTC:'BTC', ETH:'ETH' };
  return map[c] ?? c;
}

/* ────────────────────────────────────────────────────────────
   4. PAYMENTS MANAGER
   ──────────────────────────────────────────────────────────── */
export const PaymentsDB = {
  getAll() { try { return JSON.parse(localStorage.getItem(PAYMENTS_KEY)||'[]'); } catch { return []; } },
  add(p) {
    const all = this.getAll();
    p.id = 'pay_' + Date.now();
    p.createdAt = new Date().toISOString();
    p.status = 'pending';
    all.unshift(p);
    localStorage.setItem(PAYMENTS_KEY, JSON.stringify(all));
    return p;
  },
  update(id, u) {
    const all = this.getAll();
    const idx = all.findIndex(p => p.id === id);
    if (idx !== -1) { all[idx] = {...all[idx],...u}; localStorage.setItem(PAYMENTS_KEY, JSON.stringify(all)); }
  },
  getStats() {
    const all = this.getAll();
    const confirmed = all.filter(p => p.status === 'confirmed');
    const byMethod  = {};
    const byCountry = {};
    confirmed.forEach(p => {
      byMethod[p.method]  = (byMethod[p.method]  ?? 0) + 1;
      byCountry[p.userCountry ?? '—'] = (byCountry[p.userCountry ?? '—'] ?? 0) + 1;
    });
    const totalUSD = confirmed.reduce((a, p) => {
      if (p.currency === 'USD') return a + (p.amount ?? 0);
      const rate = p.rateToUSD ?? 1;
      return a + (p.amount ?? 0) / rate;
    }, 0);
    return { total: all.length, confirmed: confirmed.length, pending: all.filter(p=>p.status==='pending').length, totalUSD, byMethod, byCountry };
  },
};

/* ────────────────────────────────────────────────────────────
   5. USER PAGE RENDERER
   ──────────────────────────────────────────────────────────── */
export async function renderPaymentPage(container, usdAmount = 0, serviceId = '') {
  if (!container) return;

  const lang    = i18n.lang;
  const region  = _getRegion();
  const config  = PaymentConfig.get();
  const user    = AuthState.getUser();

  let _rates        = null;
  let _ratesExpiry  = 0;
  let _selectedMethod = null;
  let _receiptFile  = null;
  let _txId         = '';
  let _intention    = '';
  let _step         = 'form'; /* form | payment | confirm */
  let _countdownInterval = null;

  /* نرخ ارز مناسب کاربر — بر اساس IP کشور کاربر */
  const CURRENCY_BY_LANG = {
    fa:'IRR', ar:'IQD', ur:'PKR', az:'AZN', tr:'TRY', ru:'RUB', en:'USD', id:'IDR',
  };
  /* نقشه کشور به ارز */
  const CURRENCY_BY_COUNTRY = {
    IR:'IRR', IQ:'IQD', SA:'SAR', AE:'AED', KW:'KWD', BH:'BHD', QA:'QAR', OM:'OMR', JO:'JOD', LB:'LBP', SY:'SYP', EG:'EGP', LY:'LYD', DZ:'DZD', MA:'MAD', TN:'TND',
    PK:'PKR', IN:'INR', BD:'BDT', AF:'AFN', NP:'NPR',
    AZ:'AZN', TR:'TRY', RU:'RUB', UA:'UAH', KZ:'KZT', UZ:'UZS', TJ:'TJS', TM:'TMT', KG:'KGS',
    ID:'IDR', MY:'MYR', SG:'SGD', PH:'PHP', TH:'THB', VN:'VND',
    US:'USD', CA:'CAD', AU:'AUD', NZ:'NZD',
    GB:'GBP', IE:'EUR', FR:'EUR', DE:'EUR', IT:'EUR', ES:'EUR', NL:'EUR', BE:'EUR', AT:'EUR', PT:'EUR', CH:'CHF', SE:'SEK', NO:'NOK', DK:'DKK', PL:'PLN',
    CN:'CNY', JP:'JPY', KR:'KRW',
    BR:'BRL', MX:'MXN', AR:'ARS',
    ZA:'ZAR', NG:'NGN', KE:'KES', GH:'GHS',
  };

  /* اگر کاربر دستی زبان عوض کرده، ارز آن زبان اولویت دارد */
  const _manualLang = localStorage.getItem('mh_lang_manual');

  /* اولویت: ۱) کش IP  ۲) زبان دستی  ۳) زبان فعلی */
  const _ipCacheKey = 'mh_user_country_currency';
  const _ipCached   = (() => { try { const c = JSON.parse(localStorage.getItem(_ipCacheKey) || 'null'); return (c && Date.now() - c.ts < 24*60*60*1000) ? c : null; } catch { return null; } })();

  let userCurrency = _ipCached?.currency
    ?? (_manualLang ? (CURRENCY_BY_LANG[_manualLang] ?? 'USD') : null)
    ?? (CURRENCY_BY_LANG[lang] ?? 'USD');

  /* تشخیص کشور از IP — اگر کش منقضی شده یا وجود ندارد */
  if (!_ipCached) {
    (async () => {
      try {
        const res  = await fetch('https://ipapi.co/json/');
        const data = await res.json();
        const countryCurrency = CURRENCY_BY_COUNTRY[data?.country_code];
        if (countryCurrency) {
          userCurrency = countryCurrency;
          localStorage.setItem(_ipCacheKey, JSON.stringify({ currency: countryCurrency, country: data.country_code, ts: Date.now() }));
          _updateRateDisplay();
        }
      } catch {}
    })();
  }

  const tx = (obj) => obj?.[lang] ?? obj?.fa ?? obj?.en ?? '';

  /* ── بارگذاری نرخ‌ها ── */
  async function _loadRates() {
    const cached = (() => {
      try {
        const c = JSON.parse(localStorage.getItem(RATES_CACHE_KEY)||'null');
        if (c && Date.now()-c.timestamp < RATES_TTL_MS) return c.rates;
      } catch {} return null;
    })();

    /* نمایش وضعیت loading */
    const rateEl = document.getElementById('rate-display');
    if (rateEl) rateEl.innerHTML = `<span style="color:var(--text-muted);font-size:var(--text-xs)">⏳ دریافت نرخ لحظه‌ای...</span>`;

    _rates = cached ?? await _fetchRates();
    _ratesExpiry = Date.now() + RATES_TTL_MS;
    _updateRateDisplay();
    _startRateCountdown();
  }

  function _updateRateDisplay() {
    if (!_rates || !usdAmount) return;
    const conv   = _convertUSD(usdAmount, userCurrency, _rates);
    const rateEl = document.getElementById('rate-display');
    if (!rateEl) return;
    rateEl.innerHTML = `
      <div style="
        display:flex;align-items:center;gap:var(--space-3);
        background:var(--bg-surface-2);border:1px solid var(--border-color);
        border-radius:var(--radius-lg);padding:var(--space-3) var(--space-5);
      ">
        <div>
          <div style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:2px">
            ${tx({fa:'معادل به ارز شما',ar:'المعادل بعملتك',ur:'آپ کی کرنسی میں',az:'Valyutanızda ekvivalent',tr:'Para biriminizde karşılığı',ru:'Эквивалент в вашей валюте',en:'Equivalent in your currency',id:'Setara dalam mata uang Anda'})}
          </div>
          <div style="font-size:var(--text-xl);font-weight:900;color:var(--color-primary-600)">
            ${conv.amount.toLocaleString()} ${conv.symbol}
          </div>
        </div>
        <div style="
          margin-inline-start:auto;text-align:end;
          font-size:var(--text-xs);color:var(--text-muted);
        ">
          <div>$1 = ${conv.rate.toLocaleString()} ${conv.symbol}</div>
          <div id="rate-timer" style="color:var(--color-primary-500);font-weight:600"></div>
        </div>
      </div>
    `;
  }

  function _startRateCountdown() {
    clearInterval(_countdownInterval);
    _countdownInterval = setInterval(() => {
      const remaining = Math.max(0, Math.floor((_ratesExpiry - Date.now()) / 1000));
      const timerEl   = document.getElementById('rate-timer');
      if (timerEl) {
        const m = Math.floor(remaining / 60);
        const s = remaining % 60;
        timerEl.textContent = `🔄 ${m}:${s.toString().padStart(2,'0')}`;
      }
      if (remaining === 0) {
        clearInterval(_countdownInterval);
        _loadRates();
      }
    }, 1000);
  }

  /* ── رندر ── */
  function _render() {
    container.innerHTML = `
      <!-- Hero -->
      <div style="
        background:linear-gradient(135deg,#0d1f2d 0%,#1a3040 100%);
        padding:calc(var(--navbar-height) + var(--space-8)) 0 var(--space-8);
        position:relative;overflow:hidden;
      ">
        <div style="position:absolute;inset:0;opacity:0.04;background-image:radial-gradient(white 1px,transparent 1px);background-size:32px 32px" aria-hidden="true"></div>
        <div class="container" style="position:relative;z-index:1;max-width:640px">
          <div style="display:flex;align-items:center;gap:var(--space-3);margin-bottom:var(--space-3)">
            <span style="font-size:40px" aria-hidden="true">💳</span>
            <h1 style="font-family:var(--font-rtl-display);font-size:clamp(1.5rem,3vw,2rem);font-weight:900;color:white">
              ${tx({fa:'پرداخت',ar:'الدفع',ur:'ادائیگی',az:'Ödəniş',tr:'Ödeme',ru:'Платёж',en:'Payment',id:'Pembayaran'})}
            </h1>
          </div>
          ${usdAmount > 0 ? `
            <div style="
              display:inline-flex;align-items:center;gap:var(--space-3);
              background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);
              border-radius:var(--radius-full);padding:var(--space-2) var(--space-6);
              color:white;font-size:var(--text-xl);font-weight:800;
            ">💵 $${usdAmount}</div>
          ` : ''}
        </div>
      </div>

      <div class="container" style="max-width:640px;padding-block:var(--space-6)">
        ${_step === 'form'    ? _renderForm()    : ''}
        ${_step === 'payment' ? _renderPayment() : ''}
        ${_step === 'confirm' ? _renderConfirm() : ''}
      </div>
    `;

    _bindEvents();
    _loadRates();
  }

  /* ── فرم ── */
  function _renderForm() {
    const methods = _getAvailableMethods();

    return `
      <div style="
        background:var(--bg-surface);border:1px solid var(--border-color);
        border-radius:var(--radius-xl);overflow:hidden;box-shadow:var(--shadow-md);
      ">
        <div style="padding:var(--space-6) var(--space-7)">

          <!-- نرخ لحظه‌ای -->
          ${usdAmount > 0 ? `
            <div id="rate-display" style="margin-bottom:var(--space-5)">
              <span style="color:var(--text-muted);font-size:var(--text-xs)">⏳ دریافت نرخ...</span>
            </div>
          ` : ''}

          <!-- موضوع پرداخت — فقط وقتی serviceId مشخص نیست نشان داده می‌شود -->
          ${!serviceId ? `
          <div style="margin-bottom:var(--space-5)">
            <label style="display:block;font-size:var(--text-sm);font-weight:700;color:var(--text-primary);margin-bottom:var(--space-2)" for="intention-input">
              ${tx({fa:'موضوع پرداخت',ar:'موضوع الدفع',ur:'ادائیگی کا موضوع',az:'Ödəniş mövzusu',tr:'Ödeme konusu',ru:'Тема платежа',en:'Payment subject',id:'Subjek pembayaran'})}
              <span style="color:var(--text-muted);font-weight:400;font-size:var(--text-xs);margin-inline-start:6px">
                ${tx({fa:'اختیاری',ar:'اختياري',ur:'اختیاری',az:'İstəyə bağlı',tr:'İsteğe bağlı',ru:'Необязательно',en:'optional',id:'opsional'})}
              </span>
            </label>
            <textarea id="intention-input" class="auth-input"
              style="resize:vertical;min-height:80px;font-family:var(--font-rtl-body)"
              placeholder="${tx({fa:'علت یا موضوع این پرداخت را بنویسید...',ar:'اكتب سبب أو موضوع هذا الدفع...',ur:'اس ادائیگی کی وجہ لکھیں...',az:'Ödənişin səbəbini yazın...',tr:'Ödemenin nedenini yazın...',ru:'Напишите причину платежа...',en:'Write the reason for this payment...',id:'Tulis alasan pembayaran ini...'})}"
            >${_intention}</textarea>
          </div>
          ` : ''}

          <!-- روش پرداخت -->
          <div style="margin-bottom:var(--space-5)">
            <div style="font-size:var(--text-sm);font-weight:700;color:var(--text-primary);margin-bottom:var(--space-3)">
              ${tx({fa:'روش پرداخت',ar:'طريقة الدفع',ur:'ادائیگی کا طریقہ',az:'Ödəniş üsulu',tr:'Ödeme yöntemi',ru:'Способ оплаты',en:'Payment method',id:'Metode pembayaran'})}
            </div>
            <div style="display:flex;flex-direction:column;gap:var(--space-3)">
              ${methods.map(m => `
                <button class="method-select-btn" data-method="${m.id}" style="
                  display:flex;align-items:center;gap:var(--space-4);
                  padding:var(--space-4) var(--space-5);
                  border-radius:var(--radius-lg);cursor:pointer;text-align:start;
                  border:2px solid ${_selectedMethod===m.id?'var(--color-primary-500)':'var(--border-color)'};
                  background:${_selectedMethod===m.id?'var(--color-primary-50)':'var(--bg-surface)'};
                  transition:all 0.2s;width:100%;
                ">
                  <span style="font-size:28px;flex-shrink:0" aria-hidden="true">${m.icon}</span>
                  <div style="flex:1;min-width:0">
                    <div style="font-weight:700;font-size:var(--text-base);color:var(--text-primary)">${m.label}</div>
                    <div style="font-size:var(--text-xs);color:var(--text-muted);margin-top:2px">${m.desc}</div>
                  </div>
                  ${m.badge ? `
                    <span style="
                      background:${m.badgeColor??'var(--color-primary-500)'};color:white;
                      font-size:var(--text-xs);font-weight:700;
                      padding:2px 8px;border-radius:var(--radius-full);flex-shrink:0;
                    ">${m.badge}</span>
                  ` : ''}
                  <div style="
                    width:20px;height:20px;border-radius:50%;
                    border:2px solid ${_selectedMethod===m.id?'var(--color-primary-500)':'var(--border-color)'};
                    background:${_selectedMethod===m.id?'var(--color-primary-500)':'transparent'};
                    display:flex;align-items:center;justify-content:center;flex-shrink:0;
                  " aria-hidden="true">
                    ${_selectedMethod===m.id?'<svg width="10" height="10" viewBox="0 0 12 12" fill="white"><polyline points="2,6 5,9 10,3" stroke="white" stroke-width="2" fill="none"/></svg>':''}
                  </div>
                </button>
              `).join('')}
            </div>
          </div>

          <button id="proceed-btn" class="btn btn--primary btn--lg" style="width:100%;padding:var(--space-4)" ${!_selectedMethod?'disabled':''}>
            ${tx({fa:'ادامه',ar:'متابعة',ur:'جاری رکھیں',az:'Davam et',tr:'Devam et',ru:'Продолжить',en:'Continue',id:'Lanjutkan'})} →
          </button>
        </div>
      </div>
    `;
  }

  /* ── صفحه پرداخت ── */
  function _renderPayment() {
    const method = _getAvailableMethods().find(m => m.id === _selectedMethod);

    return `
      <div style="
        background:var(--bg-surface);border:1px solid var(--border-color);
        border-radius:var(--radius-xl);overflow:hidden;box-shadow:var(--shadow-md);
      ">
        <!-- Header -->
        <div style="
          background:linear-gradient(135deg,#0d1f2d,#1a3040);
          padding:var(--space-5) var(--space-6);
          display:flex;align-items:center;gap:var(--space-3);
        ">
          <button id="back-btn" style="
            background:rgba(255,255,255,0.1);border:none;width:32px;height:32px;
            border-radius:50%;color:white;cursor:pointer;font-size:16px;
            display:flex;align-items:center;justify-content:center;
          " aria-label="برگشت">←</button>
          <span style="font-size:24px" aria-hidden="true">${method?.icon??'💳'}</span>
          <div>
            <div style="font-weight:700;color:white">${method?.label??''}</div>
            ${usdAmount>0?`<div style="font-size:var(--text-sm);color:rgba(255,255,255,0.6)">$${usdAmount}</div>`:''}
          </div>
          <div id="rate-display" style="margin-inline-start:auto"></div>
        </div>

        <div style="padding:var(--space-6) var(--space-7)">

          <!-- محتوای هر روش -->
          ${_selectedMethod === 'bankMelli'  ? _renderBankMelli()   : ''}
          ${_selectedMethod === 'kikard'     ? _renderKikard()      : ''}
          ${_selectedMethod === 'transak'     ? _renderTransak()     : ''}
          ${_selectedMethod === 'crypto'     ? _renderCrypto()      : ''}

          <!-- آپلود رسید -->
          <div style="margin-top:var(--space-6)">
            <label style="display:block;font-size:var(--text-sm);font-weight:700;color:var(--text-primary);margin-bottom:var(--space-2)" for="receipt-upload">
              📎 ${tx({fa:'آپلود رسید / اسکرین‌شات',ar:'رفع الإيصال / لقطة الشاشة',ur:'رسید اپلوڈ کریں',az:'Qəbz / ekran şəkli yükləyin',tr:'Makbuz / ekran görüntüsü yükle',ru:'Загрузить квитанцию / скриншот',en:'Upload receipt / screenshot',id:'Unggah tanda terima'})}
            </label>
            <label id="receipt-label" for="receipt-upload" style="
              display:flex;align-items:center;gap:var(--space-3);
              border:2px dashed var(--border-color);border-radius:var(--radius-lg);
              padding:var(--space-4);cursor:pointer;transition:border-color 0.2s;
            ">
              <span style="font-size:32px" aria-hidden="true">${_receiptFile?'✅':'📎'}</span>
              <span style="font-size:var(--text-sm);color:var(--text-muted)">
                ${_receiptFile ? _receiptFile.name : tx({fa:'کلیک کنید یا فایل را اینجا بکشید',ar:'انقر أو اسحب الملف هنا',ur:'کلک کریں یا فائل کھینچیں',az:'Klikləyin və ya faylı buraya sürükləyin',tr:'Tıklayın veya dosyayı buraya sürükleyin',ru:'Нажмите или перетащите файл сюда',en:'Click or drag file here',id:'Klik atau seret file ke sini'})}
              </span>
              <input type="file" id="receipt-upload" accept="image/*,.pdf" style="display:none"/>
            </label>
          </div>

          <!-- Transaction ID -->
          <div style="margin-top:var(--space-4)">
            <label style="display:block;font-size:var(--text-sm);font-weight:700;color:var(--text-primary);margin-bottom:var(--space-2)" for="txid-input">
              🔑 ${tx({fa:'شناسه تراکنش (TX ID)',ar:'معرّف المعاملة',ur:'ٹرانزیکشن ID',az:'Əməliyyat ID',tr:'İşlem ID',ru:'ID транзакции',en:'Transaction ID',id:'ID Transaksi'})}
              <span style="color:var(--text-muted);font-weight:400;font-size:var(--text-xs);margin-inline-start:6px">
                ${tx({fa:'اختیاری — برای تأیید سریع‌تر',ar:'اختياري — للتأكيد الأسرع',ur:'اختیاری — جلد تصدیق کیلئے',az:'İstəyə bağlı — daha sürətli təsdiq üçün',tr:'İsteğe bağlı — daha hızlı onay için',ru:'Необязательно — для более быстрого подтверждения',en:'Optional — for faster confirmation',id:'Opsional — untuk konfirmasi lebih cepat'})}
              </span>
            </label>
            <input type="text" id="txid-input" class="auth-input"
              value="${_txId}"
              placeholder="0x... / TXxxx..."
              dir="ltr" style="font-family:'JetBrains Mono',monospace;font-size:var(--text-sm)"/>
          </div>

          <!-- فیلد مبلغ واریزی — برای تأیید دقیق -->
          <div style="margin-top:var(--space-5);background:var(--bg-surface-2);border:2px solid var(--color-primary-500);border-radius:var(--radius-lg);padding:var(--space-4)">
            <div style="font-size:var(--text-sm);font-weight:700;color:var(--text-primary);margin-bottom:var(--space-2);display:flex;align-items:center;gap:6px">
              <span>💰</span>
              ${tx({fa:'مبلغ واریزی خود را وارد کنید',ar:'أدخل المبلغ الذي دفعته',ur:'ادا کردہ رقم درج کریں',az:'Ödədiyiniz məbləği daxil edin',tr:'Ödediğiniz tutarı girin',ru:'Введите сумму оплаты',en:'Enter the amount you paid',id:'Masukkan jumlah yang Anda bayar'})}
            </div>
            <div style="display:flex;align-items:center;gap:var(--space-3)">
              <input type="number" id="paid-amount-input"
                placeholder="${usdAmount > 0 ? usdAmount : '0'}"
                min="0" step="any" dir="ltr"
                style="flex:1;background:var(--bg-surface);border:1px solid var(--border-color);border-radius:var(--radius-md);padding:var(--space-3) var(--space-4);font-size:var(--text-base);font-family:'JetBrains Mono',monospace;color:var(--text-primary)"
              />
              <select id="paid-currency-select" style="background:var(--bg-surface);border:1px solid var(--border-color);border-radius:var(--radius-md);padding:var(--space-3) var(--space-4);font-size:var(--text-sm);color:var(--text-primary);cursor:pointer">
                <option value="USD">USD — دلار</option>
                <option value="USDT">USDT</option>
                <option value="${userCurrency}" ${userCurrency!=='USD'&&userCurrency!=='USDT'?'selected':''}>${userCurrency}</option>
                ${['IRR','IQD','PKR','AZN','TRY','RUB','IDR','EUR','GBP','CAD','AUD','INR','SAR','AED'].filter(c=>c!==userCurrency&&c!=='USD'&&c!=='USDT').map(c=>`<option value="${c}">${c}</option>`).join('')}
              </select>
            </div>
            <div id="paid-amount-check" style="margin-top:var(--space-2);font-size:var(--text-xs);color:var(--text-muted)"></div>
          </div>

          <button id="confirm-btn" class="btn btn--primary btn--lg" style="width:100%;margin-top:var(--space-4);padding:var(--space-4)">
            ✓ ${tx({fa:'پرداخت کردم — ثبت کن',ar:'لقد دفعت — سجّل',ur:'ادائیگی کی — درج کریں',az:'Ödədim — Qeyd et',tr:'Ödedim — Kaydet',ru:'Я оплатил — Зарегистрировать',en:'I paid — Register',id:'Saya sudah bayar — Daftarkan'})}
          </button>
        </div>
      </div>
    `;
  }

  /* ── روش‌های پرداخت ── */
  function _renderBankMelli() {
    const b = PaymentConfig.get().bankMelli;
    return `
      <div style="
        background:linear-gradient(135deg,#1a4a2a,#0a2a1a);
        border-radius:var(--radius-lg);padding:var(--space-5);
        margin-bottom:var(--space-2);
      ">
        <div style="font-size:var(--text-base);font-weight:700;color:white;margin-bottom:var(--space-4);display:flex;align-items:center;gap:8px">
          🇮🇷 بانک ملی ایران
        </div>
        ${[
          { label:'شماره کارت', value:b.cardNumber  },
          { label:'نام صاحب حساب', value:b.accountName },
          { label:'شماره شبا', value:b.shebaNumber  },
        ].filter(f=>f.value).map(f=>`
          <div style="margin-bottom:var(--space-3)">
            <div style="font-size:var(--text-xs);color:rgba(255,255,255,0.5);margin-bottom:4px">${f.label}</div>
            <div style="display:flex;align-items:center;gap:8px">
              <code style="
                flex:1;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);
                border-radius:var(--radius-md);padding:10px 14px;
                font-size:var(--text-base);font-family:'JetBrains Mono',monospace;
                color:white;letter-spacing:0.06em;direction:ltr;word-break:break-all;
              ">${f.value}</code>
              <button class="copy-btn btn btn--sm" data-copy="${f.value}"
                style="background:rgba(255,255,255,0.15);color:white;border:none;flex-shrink:0">
                📋
              </button>
            </div>
          </div>
        `).join('')}
        <div style="
          background:rgba(255,165,0,0.1);border:1px solid rgba(255,165,0,0.3);
          border-radius:var(--radius-md);padding:var(--space-3) var(--space-4);
          font-size:var(--text-xs);color:rgba(255,165,0,0.9);display:flex;gap:6px;
        ">
          <span>ℹ️</span>
          <span>بعد از واریز، رسید را آپلود کنید. مبلغ به تومان محاسبه می‌شود.</span>
        </div>
      </div>
    `;
  }

  function _renderKikard() {
    const k = PaymentConfig.get().kikard;
    return `
      <div style="
        background:linear-gradient(135deg,#1a2a4a,#0a1a3a);
        border-radius:var(--radius-lg);padding:var(--space-5);margin-bottom:var(--space-2);
      ">
        <div style="font-size:var(--text-base);font-weight:700;color:white;margin-bottom:var(--space-4);display:flex;align-items:center;gap:8px">
          🇮🇶 ${k.accountId ? 'Ki-Card' : 'حساب بانکی عراق'}
        </div>
        ${k.accountId ? `
          <div style="margin-bottom:var(--space-3)">
            <div style="font-size:var(--text-xs);color:rgba(255,255,255,0.5);margin-bottom:4px">Ki-Card ID</div>
            <div style="display:flex;align-items:center;gap:8px">
              <code style="flex:1;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);border-radius:var(--radius-md);padding:10px 14px;font-size:var(--text-base);font-family:'JetBrains Mono',monospace;color:white;direction:ltr">${k.accountId}</code>
              <button class="copy-btn btn btn--sm" data-copy="${k.accountId}" style="background:rgba(255,255,255,0.15);color:white;border:none;flex-shrink:0">📋</button>
            </div>
          </div>
        ` : ''}
        ${k.phone ? `
          <div style="margin-bottom:var(--space-3)">
            <div style="font-size:var(--text-xs);color:rgba(255,255,255,0.5);margin-bottom:4px">شماره تلفن</div>
            <div style="display:flex;align-items:center;gap:8px">
              <code style="flex:1;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);border-radius:var(--radius-md);padding:10px 14px;font-size:var(--text-base);font-family:'JetBrains Mono',monospace;color:white;direction:ltr">${k.phone}</code>
              <button class="copy-btn btn btn--sm" data-copy="${k.phone}" style="background:rgba(255,255,255,0.15);color:white;border:none;flex-shrink:0">📋</button>
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }

  function _renderTransak() {
    const cfg = PaymentConfig.get().transak;
    const hasKey = !!(cfg?.apiKey);
    return `
      <div style="
        background:linear-gradient(135deg,#0f2027,#203a43,#2c5364);
        border-radius:var(--radius-lg);padding:var(--space-5);margin-bottom:var(--space-2);
        text-align:center;
      ">
        <div style="font-size:48px;margin-bottom:var(--space-3)" aria-hidden="true">🌐</div>
        <div style="font-size:var(--text-lg);font-weight:700;color:white;margin-bottom:var(--space-2)">Transak</div>
        <p style="font-size:var(--text-sm);color:rgba(255,255,255,0.65);margin-bottom:var(--space-4)">
          ${tx({fa:'با کارت بانکی، Google Pay، Apple Pay و ۱۰۰+ روش پرداخت در سراسر جهان',ar:'ببطاقة مصرفية أو Google Pay أو أكثر من ١٠٠ طريقة حول العالم',ur:'بینک کارڈ، Google Pay اور 100+ طریقوں سے',az:'Bank kartı, Google Pay, Apple Pay və 100+ üsulla',tr:'Banka kartı, Google Pay, Apple Pay ve 100+ yöntemle',ru:'Банковская карта, Google Pay, Apple Pay и 100+ методов',en:'Via bank card, Google Pay, Apple Pay, and 100+ methods worldwide',id:'Dengan kartu bank, Google Pay, Apple Pay, dan 100+ metode'})}
        </p>
        ${hasKey
          ? `<button id="open-transak" class="btn btn--primary" style="width:100%">🌐 ${tx({fa:'پرداخت با Transak',ar:'الدفع عبر Transak',ur:'Transak سے ادائیگی',az:'Transak ilə ödə',tr:"Transak ile öde",ru:'Оплатить через Transak',en:'Pay with Transak',id:'Bayar dengan Transak'})}</button>`
          : `<div style="color:rgba(255,165,0,0.8);font-size:var(--text-sm)">⚠️ ${tx({fa:'Transak هنوز تنظیم نشده',ar:'لم يتم إعداد Transak بعد',en:'Transak not configured yet',ur:'Transak ابھی تنظیم نہیں ہوئی',tr:'Transak henüz yapılandırılmadı',ru:'Transak ещё не настроен',az:'Transak hələ qurulmayıb',id:'Transak belum dikonfigurasi'})}</div>`
        }
      </div>
    `;
  }

  function _renderCrypto() {
    const wallets = PaymentConfig.get().wallets;
    const networks = [
      { key:'usdt_trc20', label:'USDT TRC20 (Tron)', icon:'💚', color:'#26a17b' },
      { key:'usdt_bep20', label:'USDT BEP20 (BSC)',  icon:'💛', color:'#f0b90b' },
      { key:'bitcoin',    label:'Bitcoin (BTC)',       icon:'🟠', color:'#f7931a' },
      { key:'ethereum',   label:'Ethereum (ETH)',      icon:'🔷', color:'#627eea' },
    ].filter(n => wallets[n.key]);

    if (!networks.length) return `
      <div style="text-align:center;padding:var(--space-6);color:var(--text-muted)">
        ⚠️ آدرس کیف پول هنوز تنظیم نشده
      </div>
    `;

    return `
      <div style="display:flex;flex-direction:column;gap:var(--space-3);margin-bottom:var(--space-2)">
        ${networks.map(n => {
          const conv = _rates && usdAmount
            ? `≈ ${(usdAmount / (_rates[n.key.includes('usdt')?'usdt':n.key.replace('bitcoin','btc').replace('ethereum','eth')] ?? 1)).toFixed(6)} ${n.label.split(' ')[0]}`
            : '';
          return `
            <div style="
              background:var(--bg-surface-2);border:1px solid var(--border-color);
              border-radius:var(--radius-lg);padding:var(--space-4);
            ">
              <div style="display:flex;align-items:center;gap:var(--space-2);margin-bottom:var(--space-3)">
                <span style="font-size:20px" aria-hidden="true">${n.icon}</span>
                <span style="font-weight:700;color:${n.color}">${n.label}</span>
                ${conv ? `<span style="margin-inline-start:auto;font-size:var(--text-xs);color:var(--text-muted)">${conv}</span>` : ''}
              </div>
              <div style="display:flex;align-items:center;gap:8px">
                <code style="
                  flex:1;background:var(--bg-base);border:1px solid var(--border-color);
                  border-radius:var(--radius-md);padding:8px 12px;
                  font-size:var(--text-xs);direction:ltr;word-break:break-all;
                  color:var(--text-primary);font-family:'JetBrains Mono',monospace;
                ">${wallets[n.key]}</code>
                <button class="copy-btn btn btn--primary btn--sm" data-copy="${wallets[n.key]}" style="flex-shrink:0">
                  📋 ${tx({fa:'کپی',ar:'نسخ',ur:'کاپی',az:'Kopyala',tr:'Kopyala',ru:'Копировать',en:'Copy',id:'Salin'})}
                </button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  /* ── تأیید ── */
  function _renderConfirm() {
    return `
      <div style="text-align:center;padding:var(--space-10)">
        <div style="
          width:88px;height:88px;border-radius:50%;
          background:linear-gradient(135deg,var(--color-primary-500),var(--color-primary-700));
          display:flex;align-items:center;justify-content:center;font-size:44px;
          margin:0 auto var(--space-6);animation:float 3s ease-in-out infinite;
          box-shadow:0 8px 24px rgba(42,157,143,0.4);
        " aria-hidden="true">✓</div>
        <h2 style="font-size:var(--text-2xl);font-weight:900;color:var(--text-primary);margin-bottom:var(--space-4)">
          ${tx({fa:'پرداخت ثبت شد',ar:'تم تسجيل الدفع',ur:'ادائیگی درج ہوگئی',az:'Ödəniş qeydə alındı',tr:'Ödeme kaydedildi',ru:'Платёж зарегистрирован',en:'Payment registered',id:'Pembayaran terdaftar'})}
        </h2>
        <div style="
          background:var(--bg-surface);border:1px solid var(--border-color);
          border-radius:var(--radius-lg);padding:var(--space-5);
          font-size:var(--text-base);color:var(--text-secondary);
          line-height:var(--leading-relaxed);text-align:start;
          border-inline-start:4px solid var(--color-primary-500);
          white-space:pre-line;margin-bottom:var(--space-6);
        ">${tx({
          fa:'پرداخت شما دریافت شد.\n\nبعد از بررسی، سرویس درخواستی برای شما فعال می‌شود و در بخش «پیام‌های من» به شما اطلاع داده خواهد شد.',
          ar:'تم استلام دفعتك.\n\nبعد المراجعة، سيتم تفعيل الخدمة المطلوبة وإخطارك في قسم «رسائلي».',
          ur:'آپ کی ادائیگی موصول ہوگئی۔\n\nجانچ کے بعد سروس فعال کی جائے گی اور «میرے پیغامات» میں مطلع کیا جائے گا۔',
          az:'Ödənişiniz alındı.\n\nYoxlamadan sonra xidmət aktivləşdiriləcək və «Mesajlarım» bölməsində xəbər veriləcəksiniz.',
          tr:'Ödemeniz alındı.\n\nİncelemeden sonra hizmet etkinleştirilecek ve "Mesajlarım" bölümünden bilgilendirileceksiniz.',
          ru:'Ваш платёж получен.\n\nПосле проверки запрошенная услуга будет активирована, и вы получите уведомление в разделе «Мои сообщения».',
          en:'Your payment has been received.\n\nAfter review, the requested service will be activated and you will be notified in "My Messages".',
          id:'Pembayaran Anda telah diterima.\n\nSetelah ditinjau, layanan akan diaktifkan dan Anda akan diberitahu di "Pesan Saya".',
        })}</div>
        <a href="/messages.html" class="btn btn--primary btn--lg">
          📨 ${tx({fa:'پیام‌های من',ar:'رسائلي',ur:'میرے پیغامات',az:'Mesajlarım',tr:'Mesajlarım',ru:'Мои сообщения',en:'My Messages',id:'Pesan Saya'})}
        </a>
      </div>
    `;
  }

  /* ── روش‌های موجود بر اساس منطقه ── */
  function _getAvailableMethods() {
    const cfg     = PaymentConfig.get();
    const methods = [];

    /* بانک ملی — فقط ایران */
    if (region === 'IR' && cfg.bankMelli?.active && cfg.bankMelli?.cardNumber) {
      methods.push({
        id:    'bankMelli',
        icon:  '🏦',
        label: tx({fa:'بانک ملی ایران',ar:'بنك ملي إيران',ur:'ایران نیشنل بینک',az:'İran Milli Bankı',tr:'İran Milli Bankası',ru:'Банк Мелли Иран',en:'Bank Melli Iran',id:'Bank Melli Iran'}),
        desc:  tx({fa:'کارت به کارت — تومان',ar:'تحويل بطاقة — تومان',az:'Kart-kart — Toman',tr:'Kart-kart — Toman',ru:'Карта-карта — Томан',en:'Card transfer — Toman',id:'Transfer kartu — Toman',ur:'کارڈ سے کارڈ — تومان'}),
        badge: tx({fa:'ایران',ar:'إيران',ur:'ایران',az:'İran',tr:'İran',ru:'Иран',en:'Iran',id:'Iran'}),
        badgeColor: '#16a34a',
      });
    }

    /* کی‌کارد — فقط عراق */
    if (region === 'IQ') {
      methods.push({
        id:    'kikard',
        icon:  '🇮🇶',
        label: cfg.kikard?.accountId ? 'Ki-Card' : tx({fa:'حساب بانکی عراق',ar:'حساب مصرفي عراقي',en:'Iraqi Bank Account',id:'Rekening Bank Irak', ur:'عراقی بینک اکاؤنٹ', az:'İraq bank hesabı', tr:'Irak banka hesabı', ru:'Иракский банковский счет'}),
        desc:  tx({fa:'انتقال به حساب عراقی',ar:'تحويل إلى حساب عراقي',en:'Transfer to Iraqi account',id:'Transfer ke rekening Irak', ur:'عراقی اکاؤنٹ میں منتقلی', az:'İraq hesabına köçürmə', tr:'Irak hesabına transfer', ru:'Перевод на иракский счет'}),
        badge: tx({fa:'عراق',ar:'العراق',ur:'عراق',az:'İraq',tr:'Irak',ru:'Ирак',en:'Iraq',id:'Irak'}),
        badgeColor: '#16a34a',
      });
    }

    /* Transak — همه جا به جز ایران */
    if (region !== 'IR') {
      methods.push({
        id:    'transak',
        icon:  '🌐',
        label: 'Transak',
        desc:  tx({fa:'کارت بانکی، Google Pay، Apple Pay — جهانی',ar:'بطاقة مصرفية، Google Pay — عالمي',en:'Bank card, Google Pay, Apple Pay — worldwide',id:'Kartu bank, Google Pay — global', ur:'بینک کارڈ، Google Pay، Apple Pay — عالمی', az:'Bank kartı, Google Pay, Apple Pay — Qlobal', tr:'Banka kartı, Google Pay, Apple Pay — Dünya geneli', ru:'Банковская карта, Google Pay, Apple Pay — Глобальный'}),
        badge: tx({fa:'جهانی',ar:'عالمي',az:'Qlobal',tr:'Global',ru:'Глобальный',en:'Global',id:'Global',ur:'عالمی'}),
        badgeColor: '#0ea5e9',
      });
    }

    /* ارز دیجیتال مستقیم — همه جا */
    if (Object.values(cfg.wallets ?? {}).some(Boolean)) {
      methods.push({
        id:    'crypto',
        icon:  '₿',
        label: tx({fa:'ارز دیجیتال مستقیم',ar:'عملة رقمية مباشرة',ur:'ڈیجیٹل کرنسی',az:'Birbaşa Kripto',tr:'Doğrudan Kripto',ru:'Прямая криптовалюта',en:'Direct Crypto',id:'Kripto Langsung'}),
        desc:  'USDT · BTC · ETH',
        badge: tx({fa:'همه جا',ar:'في كل مكان',az:'Hər yerdə',tr:'Her yerde',ru:'Везде',en:'Everywhere',id:'Di mana saja',ur:'ہر جگہ'}),
        badgeColor: '#f59e0b',
      });
    }

    return methods;
  }

  /* ── Event Bindings ── */
  function _bindEvents() {
    /* انتخاب روش */
    container.querySelectorAll('.method-select-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        _selectedMethod = btn.dataset.method;
        container.querySelectorAll('.method-select-btn').forEach(b => {
          const isActive = b.dataset.method === _selectedMethod;
          b.style.borderColor = isActive ? 'var(--color-primary-500)' : 'var(--border-color)';
          b.style.background  = isActive ? 'var(--color-primary-50)'  : 'var(--bg-surface)';
        });
        const proceedBtn = document.getElementById('proceed-btn');
        if (proceedBtn) proceedBtn.disabled = false;
      });
    });

    /* ادامه */
    document.getElementById('proceed-btn')?.addEventListener('click', () => {
      _intention = document.getElementById('intention-input')?.value ?? '';
      _step = 'payment';
      _render();
    });

    /* برگشت */
    document.getElementById('back-btn')?.addEventListener('click', () => {
      _step = 'form';
      _render();
    });

    /* کپی */
    container.querySelectorAll('.copy-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        try { await navigator.clipboard.writeText(btn.dataset.copy); } catch {}
        const orig = btn.textContent;
        btn.textContent = '✓';
        btn.style.background = '#16a34a';
        setTimeout(() => { btn.textContent = orig; btn.style.background = ''; }, 1500);
      });
    });

    /* Transak */
    document.getElementById('open-transak')?.addEventListener('click', () => {
      const cfg = PaymentConfig.get().transak;
      const env = cfg.environment === 'PRODUCTION' ? 'global' : 'staging-global';
      const url = `https://${env}.transak.com/?apiKey=${cfg.apiKey}&defaultCryptoCurrency=USDT&network=tron${usdAmount ? '&fiatAmount='+usdAmount+'&fiatCurrency=USD' : ''}`;
      window.open(url, '_blank', 'width=460,height=700,resizable=yes');
    });

    /* آپلود رسید */
    document.getElementById('receipt-upload')?.addEventListener('change', (e) => {
      _receiptFile = e.target.files?.[0] ?? null;
      if (_receiptFile) {
        const label = document.getElementById('receipt-label');
        if (label) {
          label.style.borderColor = 'var(--color-primary-500)';
          label.querySelector('span:nth-child(2)').textContent = `✅ ${_receiptFile.name}`;
        }
      }
    });

    /* live check مبلغ واریزی هنگام تایپ */
    document.getElementById('paid-amount-input')?.addEventListener('input', () => {
      const paidVal  = parseFloat(document.getElementById('paid-amount-input')?.value) || 0;
      const paidCur  = document.getElementById('paid-currency-select')?.value ?? 'USD';
      const checkEl  = document.getElementById('paid-amount-check');
      if (!checkEl || !usdAmount || !paidVal) { if(checkEl) checkEl.textContent=''; return; }

      /* تبدیل مبلغ وارد‌شده به USD */
      let paidUSD = paidVal;
      if (paidCur !== 'USD' && paidCur !== 'USDT' && _rates) {
        const key = paidCur.toLowerCase();
        if (paidCur === 'IRR') paidUSD = (paidVal * 10) / (_rates['IRR'] ?? 62000);
        else paidUSD = _rates[key] ? paidVal / _rates[key] : paidVal;
      }

      const sufficient = paidUSD >= usdAmount * 0.98; /* تلرانس ۲٪ */
      const reqConv    = _rates ? _convertUSD(usdAmount, paidCur, _rates) : null;
      const reqLabel   = reqConv ? `${reqConv.amount.toLocaleString()} ${reqConv.symbol}` : `$${usdAmount}`;
      checkEl.style.color = sufficient ? '#16a34a' : '#e63946';
      checkEl.textContent = sufficient
        ? `✓ مبلغ کافی است ($${paidUSD.toFixed(2)} ≈ $${usdAmount})`
        : `✗ مبلغ ناکافی — باید حداقل ${reqLabel} ($${usdAmount}) باشد`;
    });

    /* ثبت پرداخت */
    document.getElementById('confirm-btn')?.addEventListener('click', async () => {
      const btn      = document.getElementById('confirm-btn');
      const paidVal  = parseFloat(document.getElementById('paid-amount-input')?.value) || 0;
      const paidCur  = document.getElementById('paid-currency-select')?.value ?? 'USD';

      /* بررسی دقیق مبلغ — تبدیل به USD و مقایسه */
      if (usdAmount && usdAmount > 0) {
        /* تبدیل مبلغ وارد‌شده به USD */
        let paidUSD = paidVal;
        if (paidCur !== 'USD' && paidCur !== 'USDT' && _rates) {
          const key = paidCur.toLowerCase();
          if (paidCur === 'IRR') paidUSD = (paidVal * 10) / (_rates['IRR'] ?? 62000);
          else paidUSD = _rates[key] ? paidVal / _rates[key] : paidVal;
        }

        /* اگر مبلغ وارد نشده یا کمتر از ۹۸٪ مبلغ مورد نیاز */
        if (!paidVal || paidUSD < usdAmount * 0.98) {
          const reqConv  = _rates ? _convertUSD(usdAmount, userCurrency, _rates) : null;
          const reqLabel = reqConv ? `${reqConv.amount.toLocaleString()} ${reqConv.symbol}` : `$${usdAmount}`;
          const errors = {
            fa: `⛔ مبلغ واریزی ناکافی است.

حداقل مبلغ مورد نیاز: ${reqLabel} (معادل $${usdAmount})
مبلغ وارد‌شده: ${paidVal} ${paidCur} ≈ $${paidUSD.toFixed(2)}

لطفاً مبلغ صحیح را وارد کنید.`,
            ar: `⛔ المبلغ المدفوع غير كافٍ.

الحد الأدنى المطلوب: ${reqLabel} (ما يعادل $${usdAmount})
المبلغ المُدخل: ${paidVal} ${paidCur} ≈ $${paidUSD.toFixed(2)}

الرجاء إدخال المبلغ الصحيح.`,
            ur: `⛔ ادا کردہ رقم ناکافی ہے۔

کم از کم ضروری رقم: ${reqLabel} ($${usdAmount} کے برابر)
درج کردہ رقم: ${paidVal} ${paidCur} ≈ $${paidUSD.toFixed(2)}

براہ کرم صحیح رقم درج کریں۔`,
            az: `⛔ Ödənilən məbləğ kifayət deyil.

Tələb olunan minimum: ${reqLabel} ($${usdAmount} ekvivalenti)
Daxil edilən məbləğ: ${paidVal} ${paidCur} ≈ $${paidUSD.toFixed(2)}

Zəhmət olmasa düzgün məbləği daxil edin.`,
            tr: `⛔ Ödenen tutar yetersiz.

Gerekli minimum: ${reqLabel} ($${usdAmount} karşılığı)
Girilen tutar: ${paidVal} ${paidCur} ≈ $${paidUSD.toFixed(2)}

Lütfen doğru tutarı girin.`,
            ru: `⛔ Оплаченная сумма недостаточна.

Минимальная сумма: ${reqLabel} (эквивалент $${usdAmount})
Введённая сумма: ${paidVal} ${paidCur} ≈ $${paidUSD.toFixed(2)}

Пожалуйста, введите правильную сумму.`,
            en: `⛔ The paid amount is insufficient.

Minimum required: ${reqLabel} (equivalent to $${usdAmount})
Entered amount: ${paidVal} ${paidCur} ≈ $${paidUSD.toFixed(2)}

Please enter the correct amount.`,
            id: `⛔ Jumlah yang dibayar tidak mencukupi.

Minimum yang diperlukan: ${reqLabel} (setara $${usdAmount})
Jumlah yang dimasukkan: ${paidVal} ${paidCur} ≈ $${paidUSD.toFixed(2)}

Silakan masukkan jumlah yang benar.`,
          };
          alert(errors[lang] ?? errors['en']);
          return; /* جلوگیری از ثبت */
        }
      }

      /* بررسی آپلود رسید — اجباری است */
      if (!_receiptFile) {
        const receiptErrors = {
          fa: '⛔ لطفاً رسید یا اسکرین‌شات پرداخت را آپلود کنید.',
          ar: '⛔ يرجى رفع إيصال الدفع أو لقطة الشاشة.',
          ur: '⛔ براہ کرم ادائیگی کی رسید یا اسکرین شاٹ اپلوڈ کریں۔',
          az: '⛔ Zəhmət olmasa ödəniş qəbzini və ya ekran şəklini yükləyin.',
          tr: '⛔ Lütfen ödeme makbuzunu veya ekran görüntüsünü yükleyin.',
          ru: '⛔ Пожалуйста, загрузите квитанцию или скриншот оплаты.',
          en: '⛔ Please upload a payment receipt or screenshot.',
          id: '⛔ Silakan unggah tanda terima atau tangkapan layar pembayaran.',
        };
        alert(receiptErrors[lang] ?? receiptErrors['en']);
        return;
      }

      if (btn) { btn.disabled = true; btn.textContent = '⏳ در حال ثبت...'; }

      _txId = document.getElementById('txid-input')?.value?.trim() ?? '';

      const payment = PaymentsDB.add({
        userId:      user?.id ?? 'guest',
        userName:    user?.name ?? '',
        userLang:    lang,
        userCountry: localStorage.getItem('mh_user_country') ?? '',
        method:      _selectedMethod,
        amount:      usdAmount,
        currency:    'USD',
        rateToUSD:   1,
        intention:   _intention,
        txId:        _txId,
        hasReceipt:  !!_receiptFile,
        serviceId,
      });

      /* نوتیفیکیشن */
      await NotifCenter.send({
        type:'donation', icon:'💳',
        title:{ fa:'پرداخت ثبت شد ✓', [lang]:'پرداخت ثبت شد ✓' },
        text: { fa:'پرداخت شما دریافت شد. بعد از تأیید برایتان اطلاع داده می‌شود.', [lang]:'پرداخت شما دریافت شد.' },
      });

      clearInterval(_countdownInterval);
      _step = 'confirm';
      _render();
    });
  }

  /* رندر اول */
  _render();
}
