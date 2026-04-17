/**
 * ============================================================
 * FILE: sadaqah.js
 * ROLE: سیستم صدقه و هدیه — ارسال وجه نقد داوطلبانه
 * PROJECT: MediaHub — پلتفرم رسانه‌ای کربلا
 * VERSION: 1.0.0
 *
 * روش‌های پرداخت:
 *   — OnRamper (ارز دیجیتال از هر روشی)
 *   — ارز دیجیتال مستقیم (USDT TRC20 / BTC / ETH)
 *   — کی‌کارد (عراق)
 *   — بانک ملی (ایران)
 * ============================================================
 */

import { i18n } from './i18n.js';
import { AuthState } from './auth.js';
import { translateText } from './auto-translate.js';
import { NotifCenter } from './notifications.js';

/* ────────────────────────────────────────────────────────────
   1. CONFIG (کیف پول‌ها و درگاه‌ها — ادمین تنظیم می‌کند)
   ──────────────────────────────────────────────────────────── */
const CONFIG_KEY   = 'mh_sadaqah_config';
const DONATIONS_KEY = 'mh_donations';

export const SadaqahConfig = {
  get() {
    try {
      return JSON.parse(localStorage.getItem(CONFIG_KEY) || 'null') || {
        /* کیف پول‌های ارز دیجیتال */
        wallets: {
          usdt_trc20: '',   /* آدرس USDT TRC20 */
          usdt_erc20: '',   /* آدرس USDT ERC20 */
          bitcoin:    '',   /* آدرس Bitcoin */
          ethereum:   '',   /* آدرس Ethereum */
        },
        /* OnRamper */
        onramper: {
          apiKey:    '',
          walletAddress: '',
        },
        /* کی‌کارد عراق */
        kikard: {
          active:    false,
          accountId: '',
          apiKey:    '',
        },
        /* بانک ملی ایران */
        bankMelli: {
          active:      false,
          cardNumber:  '',   /* شماره کارت */
          accountName: '',   /* نام صاحب حساب */
          shebaNumber: '',   /* شماره شبا */
        },
        /* تنظیمات کلی */
        suggestedAmounts: {
          USD: [5, 10, 25, 50, 100],
          IQD: [5000, 10000, 25000, 50000],
          IRR: [50000, 100000, 250000, 500000],
          PKR: [500, 1000, 2500, 5000],
        },
        thankYouMessageDefault: 'با تشکر از سخاوت شما — خداوند بهترین پاداش را نصیبتان کند 🤲',
      };
    } catch { return { wallets:{}, onramper:{}, kikard:{}, bankMelli:{} }; }
  },
  set(cfg) { try { localStorage.setItem(CONFIG_KEY, JSON.stringify(cfg)); } catch {} },
};

/* ────────────────────────────────────────────────────────────
   2. DONATIONS MANAGER
   ──────────────────────────────────────────────────────────── */
export const DonationsDB = {
  getAll() { try { return JSON.parse(localStorage.getItem(DONATIONS_KEY)||'[]'); } catch { return []; } },
  add(d) {
    const all = this.getAll();
    d.id = 'don_' + Date.now();
    d.createdAt = new Date().toISOString();
    d.status = 'pending'; /* pending | confirmed | rejected */
    all.unshift(d);
    localStorage.setItem(DONATIONS_KEY, JSON.stringify(all));
    return d;
  },
  update(id, u) {
    const all = this.getAll();
    const idx = all.findIndex(d => d.id === id);
    if (idx !== -1) { all[idx] = {...all[idx],...u}; localStorage.setItem(DONATIONS_KEY, JSON.stringify(all)); }
  },
};

/* ────────────────────────────────────────────────────────────
   3. COPY TO CLIPBOARD HELPER
   ──────────────────────────────────────────────────────────── */
async function _copyToClipboard(text, btn) {
  try { await navigator.clipboard.writeText(text); }
  catch { /* fallback */ }
  if (btn) {
    const original = btn.textContent;
    btn.textContent = '✓ کپی شد';
    btn.style.background = '#16a34a';
    setTimeout(() => { btn.textContent = original; btn.style.background = ''; }, 2000);
  }
}

/* ────────────────────────────────────────────────────────────
   4. PAGE RENDERER (صفحه کاربر)
   ──────────────────────────────────────────────────────────── */
export function renderSadaqahPage(container) {
  if (!container) return;

  const config = SadaqahConfig.get();
  const lang   = i18n.lang;
  let _step    = 'form';    /* form | payment | confirm */
  let _method  = null;      /* 'crypto' | 'onramper' | 'kikard' | 'bankMelli' */
  let _amount  = '';
  let _currency = 'USD';
  let _intention = '';
  let _receiptFile = null;

  const COPY = {
    pageTitle:    { fa:'پرداخت', ar:'الدفع', ur:'ادائیگی', az:'Ödəniş', tr:'Ödeme', ru:'Платёж', en:'Payment', id:'Pembayaran' },
    pageDesc:     { fa:'ارسال وجه به پلتفرم مدیاهاب کربلا', ar:'إرسال مبلغ إلى منصة ميدياهاب كربلاء', ur:'میڈیاہب کربلا کو رقم بھیجیں', az:'MediaHub Kərbəlaya ödəniş göndər', tr:'MediaHub Kerbela platformuna ödeme gönder', ru:'Отправить платёж на платформу MediaHub Кербела', en:'Send payment to MediaHub Karbala platform', id:'Kirim pembayaran ke platform MediaHub Karbala' },
    intentLabel:  { fa:'موضوع پرداخت', ar:'موضوع الدفع', ur:'ادائیگی کا موضوع', az:'Ödəniş mövzusu', tr:'Ödeme konusu', ru:'Тема платежа', en:'Payment subject', id:'Subjek pembayaran' },
    intentHint:   { fa:'علت یا موضوع این پرداخت را بنویسید (اختیاری)', ar:'اكتب سبب أو موضوع هذا الدفع (اختياري)', ur:'اس ادائیگی کی وجہ یا موضوع لکھیں (اختیاری)', az:'Bu ödənişin mövzusunu yazın (ixtiyari)', tr:'Bu ödemenin konusunu yazın (isteğe bağlı)', ru:'Напишите тему или причину этого платежа (необязательно)', en:'Write the subject or reason for this payment (optional)', id:'Tulis subjek atau alasan pembayaran ini (opsional)' },
    amountLabel:  { fa:'مبلغ', ar:'المبلغ', ur:'رقم', az:'Məbləğ', tr:'Tutar', ru:'Сумма', en:'Amount', id:'Jumlah' },
    payWith:      { fa:'روش پرداخت', ar:'طريقة الدفع', ur:'ادائیگی کا طریقہ', az:'Ödəniş üsulu', tr:'Ödeme Yöntemi', ru:'Способ оплаты', en:'Payment Method', id:'Metode Pembayaran' },
    uploadReceipt:{ fa:'آپلود رسید', ar:'رفع الإيصال', ur:'رسید اپلوڈ کریں', az:'Qəbzi yükləyin', tr:'Makbuzu Yükle', ru:'Загрузить квитанцию', en:'Upload Receipt', id:'Unggah Tanda Terima' },
    confirmed:    { fa:'پرداخت شما ثبت شد', ar:'تم تسجيل دفعتك', ur:'آپ کی ادائیگی درج ہوگئی', az:'Ödənişiniz qeydə alındı', tr:'Ödemeniz kaydedildi', ru:'Ваш платёж зарегистрирован', en:'Your payment has been registered', id:'Pembayaran Anda telah terdaftar' },
  };

  const tx = (obj) => obj?.[lang] ?? obj?.fa ?? obj?.en ?? '';

  const CURRENCY_MAP = {
    fa:{k:'IRR',s:'تومان'}, ar:{k:'IQD',s:'IQD'}, ur:{k:'PKR',s:'PKR'},
    az:{k:'AZN',s:'AZN'}, tr:{k:'TRY',s:'₺'}, ru:{k:'RUB',s:'₽'},
    en:{k:'USD',s:'$'}, id:{k:'IDR',s:'IDR'},
  };
  const cur = CURRENCY_MAP[lang] ?? CURRENCY_MAP['en'];
  const suggestedAmounts = config.suggestedAmounts?.[cur.k] ?? config.suggestedAmounts?.USD ?? [5,10,25,50];

  function _render() {
    container.innerHTML = `
      <!-- Hero -->
      <div style="
        background:linear-gradient(145deg,#0d1f2d 0%,#1a3040 40%,#0a2a1a 100%);
        padding:calc(var(--navbar-height) + var(--space-10)) 0 var(--space-14);
        text-align:center;position:relative;overflow:hidden;
      ">
        <div style="position:absolute;inset:0;opacity:0.04;background-image:radial-gradient(gold 1px,transparent 1px);background-size:40px 40px" aria-hidden="true"></div>
        <div class="container" style="position:relative;z-index:1">
          <div style="font-size:72px;margin-bottom:var(--space-4);animation:float 4s ease-in-out infinite;filter:drop-shadow(0 4px 24px rgba(42,157,143,0.6))" aria-hidden="true">💳</div>
          <h1 style="font-family:var(--font-rtl-display);font-size:clamp(2rem,4vw,2.8rem);font-weight:900;color:white;margin-bottom:var(--space-3)">
            ${tx(COPY.pageTitle)}
          </h1>
          <p style="color:rgba(255,255,255,0.65);font-size:var(--text-md);max-width:52ch;margin:0 auto">
            ${tx(COPY.pageDesc)}
          </p>

        </div>
      </div>

      <div class="section">
        <div class="container" style="max-width:680px">
          ${_step === 'form'    ? _renderForm()    : ''}
          ${_step === 'payment' ? _renderPayment() : ''}
          ${_step === 'confirm' ? _renderConfirm() : ''}
        </div>
      </div>
    `;
    _bindPageEvents();
  }

  /* ── فرم اصلی ── */
  function _renderForm() {
    return `
      <div style="
        background:var(--bg-surface);border:1px solid var(--border-color);
        border-radius:var(--radius-xl);overflow:hidden;box-shadow:var(--shadow-lg);
      ">
        <div style="background:linear-gradient(135deg,#0d1f2d,#1a3040);padding:var(--space-6) var(--space-8)">
          <h2 style="font-size:var(--text-xl);font-weight:var(--weight-bold);color:white;display:flex;align-items:center;gap:var(--space-3)">
            <span aria-hidden="true">💝</span>
            ${tx(COPY.pageTitle)}
          </h2>
        </div>
        <div style="padding:var(--space-7) var(--space-8)">

          <!-- مبلغ -->
          <div style="margin-bottom:var(--space-6)">
            <label style="display:block;font-size:var(--text-sm);font-weight:var(--weight-bold);color:var(--text-primary);margin-bottom:var(--space-3)">
              ${tx(COPY.amountLabel)} <span style="color:var(--text-muted)">(${cur.s})</span> *
            </label>
            <!-- مبالغ پیشنهادی -->
            <div style="display:flex;gap:var(--space-2);flex-wrap:wrap;margin-bottom:var(--space-3)">
              ${suggestedAmounts.map(a => `
                <button class="amount-btn" data-amount="${a}" style="
                  padding:var(--space-2) var(--space-4);
                  background:${_amount==a?'var(--color-primary-500)':'var(--bg-surface-2)'};
                  color:${_amount==a?'white':'var(--text-primary)'};
                  border:1.5px solid ${_amount==a?'var(--color-primary-500)':'var(--border-color)'};
                  border-radius:var(--radius-full);cursor:pointer;font-size:var(--text-sm);
                  font-weight:var(--weight-semibold);transition:all 0.2s;
                  font-family:var(--font-rtl-body);
                ">${a.toLocaleString()} ${cur.s}</button>
              `).join('')}
            </div>
            <input type="number" id="amount-input" class="auth-input"
              value="${_amount}" placeholder="${tx({fa:'مبلغ دلخواه',ar:'مبلغ آخر',ur:'اپنی رقم',en:'Custom amount',id:'Jumlah lainnya'})}"
              min="1" dir="ltr" style="text-align:center;font-size:var(--text-xl);font-weight:700"
              aria-label="${tx(COPY.amountLabel)}"/>
          </div>

          <!-- نیت و پیام -->
          <div style="margin-bottom:var(--space-6)">
            <label style="display:block;font-size:var(--text-sm);font-weight:var(--weight-bold);color:var(--text-primary);margin-bottom:var(--space-2)">
              ${tx(COPY.intentLabel)}
              <span style="font-weight:normal;color:var(--text-muted);font-size:var(--text-xs);margin-inline-start:8px">
                ${tx({fa:'اختیاری',ar:'اختياري',ur:'اختیاری',en:'Optional',id:'Opsional'})}
              </span>
            </label>
            <textarea id="intention-input" class="auth-input"
              style="resize:vertical;min-height:100px;font-family:var(--font-rtl-body)"
              placeholder="${tx(COPY.intentHint)}"
              aria-label="${tx(COPY.intentLabel)}"
            >${_intention}</textarea>
          </div>

          <!-- روش پرداخت -->
          <div style="margin-bottom:var(--space-6)">
            <label style="display:block;font-size:var(--text-sm);font-weight:var(--weight-bold);color:var(--text-primary);margin-bottom:var(--space-3)">
              ${tx(COPY.payWith)} *
            </label>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-3)">

              <!-- ارز دیجیتال مستقیم -->
              <button class="method-btn" data-method="crypto" style="
                padding:var(--space-4);border-radius:var(--radius-lg);
                border:2px solid ${_method==='crypto'?'var(--color-primary-500)':'var(--border-color)'};
                background:${_method==='crypto'?'var(--color-primary-50)':'var(--bg-surface)'};
                cursor:pointer;text-align:center;transition:all 0.2s;
              ">
                <div style="font-size:28px;margin-bottom:4px" aria-hidden="true">₿</div>
                <div style="font-size:var(--text-sm);font-weight:var(--weight-semibold);color:var(--text-primary)">
                  ${tx({fa:'ارز دیجیتال',ar:'عملة رقمية',ur:'ڈیجیٹل کرنسی',en:'Crypto',id:'Kripto', az:'Kripto'}, tr:'Kripto'}, ru:'Крипто'}})}
                </div>
                <div style="font-size:var(--text-xs);color:var(--text-muted)">BTC · ETH · USDT</div>
              </button>

              <!-- OnRamper -->
              <button class="method-btn" data-method="onramper" style="
                padding:var(--space-4);border-radius:var(--radius-lg);
                border:2px solid ${_method==='onramper'?'var(--color-primary-500)':'var(--border-color)'};
                background:${_method==='onramper'?'var(--color-primary-50)':'var(--bg-surface)'};
                cursor:pointer;text-align:center;transition:all 0.2s;
              ">
                <div style="font-size:28px;margin-bottom:4px" aria-hidden="true">🌐</div>
                <div style="font-size:var(--text-sm);font-weight:var(--weight-semibold);color:var(--text-primary)">OnRamper</div>
                <div style="font-size:var(--text-xs);color:var(--text-muted)">
                  ${tx({fa:'کارت بانکی / PayPal',ar:'بطاقة مصرفية / PayPal',ur:'بینک کارڈ',en:'Bank card / PayPal',id:'Kartu bank / PayPal'})}
                </div>
              </button>

              <!-- کی‌کارد عراق -->
              ${config.kikard?.active ? `
                <button class="method-btn" data-method="kikard" style="
                  padding:var(--space-4);border-radius:var(--radius-lg);
                  border:2px solid ${_method==='kikard'?'var(--color-primary-500)':'var(--border-color)'};
                  background:${_method==='kikard'?'var(--color-primary-50)':'var(--bg-surface)'};
                  cursor:pointer;text-align:center;transition:all 0.2s;
                ">
                  <div style="font-size:28px;margin-bottom:4px" aria-hidden="true">🇮🇶</div>
                  <div style="font-size:var(--text-sm);font-weight:var(--weight-semibold);color:var(--text-primary)">کی‌کارد</div>
                  <div style="font-size:var(--text-xs);color:var(--text-muted)">
                    ${tx({fa:'عراق',ar:'العراق',ur:'عراق',en:'Iraq',id:'Irak', az:'İraq'}, tr:'Irak'}, ru:'Ирак'}})}
                  </div>
                </button>
              ` : ''}

              <!-- بانک ملی ایران -->
              ${config.bankMelli?.active ? `
                <button class="method-btn" data-method="bankMelli" style="
                  padding:var(--space-4);border-radius:var(--radius-lg);
                  border:2px solid ${_method==='bankMelli'?'var(--color-primary-500)':'var(--border-color)'};
                  background:${_method==='bankMelli'?'var(--color-primary-50)':'var(--bg-surface)'};
                  cursor:pointer;text-align:center;transition:all 0.2s;
                ">
                  <div style="font-size:28px;margin-bottom:4px" aria-hidden="true">🇮🇷</div>
                  <div style="font-size:var(--text-sm);font-weight:var(--weight-semibold);color:var(--text-primary)">
                    ${tx({fa:'بانک ملی',ar:'بنك ملي',ur:'بینک ملی',en:'Bank Melli',id:'Bank Melli'})}
                  </div>
                  <div style="font-size:var(--text-xs);color:var(--text-muted)">
                    ${tx({fa:'ایران',ar:'إيران',ur:'ایران',en:'Iran',id:'Iran', az:'İran'}, tr:'İran'}, ru:'Иран'}})}
                  </div>
                </button>
              ` : ''}

            </div>
          </div>

          <button id="proceed-btn" class="btn btn--primary btn--lg" style="width:100%;padding:var(--space-5)" ${!_method||!_amount?'disabled':''}>
            ${tx({fa:'ادامه',ar:'متابعة',ur:'جاری رکھیں',en:'Continue',id:'Lanjutkan'})} →
          </button>
        </div>
      </div>
    `;
  }

  /* ── صفحه پرداخت ── */
  function _renderPayment() {
    return `
      <div style="
        background:var(--bg-surface);border:1px solid var(--border-color);
        border-radius:var(--radius-xl);overflow:hidden;box-shadow:var(--shadow-lg);
      ">
        <div style="background:linear-gradient(135deg,#0d1f2d,#1a3040);padding:var(--space-5) var(--space-7);display:flex;align-items:center;gap:var(--space-3)">
          <button id="back-btn" style="background:rgba(255,255,255,0.1);border:none;width:32px;height:32px;border-radius:50%;color:white;cursor:pointer;font-size:16px" aria-label="برگشت">←</button>
          <h2 style="font-size:var(--text-lg);font-weight:700;color:white">${tx(COPY.payWith)}</h2>
        </div>
        <div style="padding:var(--space-7) var(--space-8)">

          <!-- خلاصه -->
          <div style="
            background:var(--bg-surface-2);border-radius:var(--radius-lg);
            padding:var(--space-4) var(--space-5);margin-bottom:var(--space-6);
            display:flex;justify-content:space-between;align-items:center;
          ">
            <span style="color:var(--text-muted);font-size:var(--text-sm)">${tx(COPY.amountLabel)}</span>
            <span style="font-size:var(--text-xl);font-weight:900;color:var(--color-primary-600)">${parseFloat(_amount).toLocaleString()} ${cur.s}</span>
          </div>

          ${_method === 'crypto'    ? _renderCryptoPayment()    : ''}
          ${_method === 'onramper'  ? _renderOnramperPayment()  : ''}
          ${_method === 'kikard'    ? _renderKikardPayment()    : ''}
          ${_method === 'bankMelli' ? _renderBankMelliPayment() : ''}

          <!-- آپلود رسید -->
          <div style="margin-top:var(--space-6)">
            <label style="display:block;font-size:var(--text-sm);font-weight:700;color:var(--text-primary);margin-bottom:8px">
              ${tx(COPY.uploadReceipt)}
              <span style="font-weight:normal;color:var(--text-muted);font-size:var(--text-xs);margin-inline-start:8px">
                ${tx({fa:'برای تأیید سریع‌تر',ar:'للتأكيد الأسرع',ur:'جلد تصدیق کے لیے',en:'For faster confirmation',id:'Untuk konfirmasi lebih cepat'})}
              </span>
            </label>
            <label style="
              display:flex;align-items:center;gap:var(--space-3);
              border:2px dashed var(--border-color);border-radius:var(--radius-lg);
              padding:var(--space-4);cursor:pointer;
              transition:border-color 0.2s;
            " id="receipt-label" for="receipt-upload">
              <span style="font-size:24px" aria-hidden="true">📎</span>
              <span style="font-size:var(--text-sm);color:var(--text-muted)">
                ${_receiptFile ? `✓ ${_receiptFile.name}` : tx({fa:'کلیک کنید یا فایل را اینجا بکشید',ar:'انقر أو اسحب الملف هنا',ur:'کلک کریں یا فائل یہاں کھینچیں',en:'Click or drag file here',id:'Klik atau seret file ke sini'})}
              </span>
              <input type="file" id="receipt-upload" accept="image/*,.pdf" style="display:none" aria-label="${tx(COPY.uploadReceipt)}"/>
            </label>
          </div>

          <button id="confirm-payment-btn" class="btn btn--primary btn--lg" style="width:100%;margin-top:var(--space-5);padding:var(--space-4)">
            ✓ ${tx({fa:'پرداخت کردم — ثبت کن',ar:'لقد دفعت — سجّل',ur:'ادائیگی کی — درج کریں',en:'I paid — Register it',id:'Saya sudah bayar — Daftarkan'})}
          </button>
        </div>
      </div>
    `;
  }

  function _renderCryptoPayment() {
    const wallets = config.wallets ?? {};
    return `
      <div style="display:flex;flex-direction:column;gap:var(--space-4)">
        ${[
          { key:'usdt_trc20', label:'USDT TRC20', icon:'💚', color:'#26a17b' },
          { key:'usdt_erc20', label:'USDT ERC20', icon:'🔵', color:'#627eea' },
          { key:'bitcoin',    label:'Bitcoin (BTC)', icon:'🟠', color:'#f7931a' },
          { key:'ethereum',   label:'Ethereum (ETH)', icon:'🔷', color:'#627eea' },
        ].filter(w => wallets[w.key]).map(w => `
          <div style="
            background:var(--bg-surface-2);border:1px solid var(--border-color);
            border-radius:var(--radius-lg);padding:var(--space-4);
          ">
            <div style="display:flex;align-items:center;gap:var(--space-2);margin-bottom:var(--space-3)">
              <span style="font-size:20px" aria-hidden="true">${w.icon}</span>
              <span style="font-weight:var(--weight-bold);color:${w.color}">${w.label}</span>
            </div>
            <div style="display:flex;align-items:center;gap:var(--space-2)">
              <code style="
                flex:1;background:var(--bg-base);border:1px solid var(--border-color);
                border-radius:var(--radius-md);padding:var(--space-2) var(--space-3);
                font-size:var(--text-xs);direction:ltr;word-break:break-all;
                color:var(--text-primary);font-family:'JetBrains Mono',monospace;
              ">${wallets[w.key]}</code>
              <button class="copy-wallet-btn btn btn--primary btn--sm"
                data-address="${wallets[w.key]}"
                style="flex-shrink:0;white-space:nowrap"
                aria-label="کپی آدرس ${w.label}">
                📋 ${tx({fa:'کپی',ar:'نسخ',ur:'کاپی',en:'Copy',id:'Salin'})}
              </button>
            </div>
          </div>
        `).join('')}
        ${!Object.values(wallets).some(Boolean) ? `
          <div style="text-align:center;color:var(--text-muted);padding:var(--space-6)">
            ⚠️ ${tx({fa:'آدرس کیف پول هنوز تنظیم نشده',ar:'لم يتم تعيين عنوان المحفظة بعد',ur:'والیٹ ایڈریس ابھی سیٹ نہیں',en:'Wallet address not set yet',id:'Alamat dompet belum diatur'})}
          </div>
        ` : ''}
      </div>
    `;
  }

  function _renderOnramperPayment() {
    return `
      <div style="
        background:var(--bg-surface-2);border:1px solid var(--border-color);
        border-radius:var(--radius-lg);padding:var(--space-6);text-align:center;
      ">
        <div style="font-size:48px;margin-bottom:var(--space-3)" aria-hidden="true">🌐</div>
        <div style="font-size:var(--text-base);font-weight:var(--weight-bold);margin-bottom:var(--space-3)">OnRamper</div>
        <p style="font-size:var(--text-sm);color:var(--text-muted);margin-bottom:var(--space-5)">
          ${tx({fa:'از طریق OnRamper می‌توانید با کارت بانکی، Google Pay، Apple Pay و بیش از ۱۰۰ روش پرداخت ارز دیجیتال خریداری کنید.',ar:'عبر OnRamper يمكنك الشراء ببطاقة مصرفية أو Google Pay أو أكثر من ١٠٠ طريقة.',ur:'OnRamper کے ذریعے بینک کارڈ، Google Pay سے خریدیں۔',en:'Via OnRamper you can buy crypto with bank card, Google Pay, Apple Pay, and 100+ methods.',id:'Melalui OnRamper Anda dapat membeli kripto dengan kartu bank, Google Pay, 100+ metode.'})}
        </p>
        <button id="open-onramper-btn" class="btn btn--primary" style="width:100%">
          🌐 ${tx({fa:'باز کردن OnRamper',ar:'فتح OnRamper',ur:'OnRamper کھولیں',en:'Open OnRamper',id:'Buka OnRamper'})}
        </button>
      </div>
    `;
  }

  function _renderKikardPayment() {
    return `
      <div style="
        background:var(--bg-surface-2);border:1px solid var(--border-color);
        border-radius:var(--radius-lg);padding:var(--space-6);text-align:center;
      ">
        <div style="font-size:48px;margin-bottom:var(--space-3)" aria-hidden="true">🇮🇶</div>
        <div style="font-size:var(--text-base);font-weight:var(--weight-bold);margin-bottom:var(--space-3)">کی‌کارد — Ki-Card</div>
        <p style="font-size:var(--text-sm);color:var(--text-muted);margin-bottom:var(--space-5)">
          ${tx({fa:'درگاه پرداخت عراقی — برای کاربران عراق',ar:'بوابة الدفع العراقية — للمستخدمين العراقيين',ur:'عراقی پیمنٹ گیٹ وے',en:'Iraqi payment gateway — for users in Iraq',id:'Gerbang pembayaran Irak'})}
        </p>
        <button class="btn btn--primary" style="width:100%">
          💳 ${tx({fa:'پرداخت با کی‌کارد',ar:'الدفع بـ Ki-Card',ur:'کی کارڈ سے ادائیگی',en:'Pay with Ki-Card',id:'Bayar dengan Ki-Card'})}
        </button>
      </div>
    `;
  }

  function _renderBankMelliPayment() {
    const b = config.bankMelli ?? {};
    return `
      <div style="
        background:var(--bg-surface-2);border:1px solid var(--border-color);
        border-radius:var(--radius-lg);padding:var(--space-5);
      ">
        <div style="font-size:20px;font-weight:700;color:var(--text-primary);margin-bottom:var(--space-4);display:flex;align-items:center;gap:8px">
          🇮🇷 بانک ملی ایران
        </div>
        ${[
          { label:'شماره کارت', value: b.cardNumber, icon:'💳' },
          { label:'نام صاحب حساب', value: b.accountName, icon:'👤' },
          { label:'شماره شبا', value: b.shebaNumber, icon:'🏦' },
        ].filter(f => f.value).map(f => `
          <div style="margin-bottom:var(--space-3)">
            <div style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:4px">${f.icon} ${f.label}</div>
            <div style="display:flex;align-items:center;gap:var(--space-2)">
              <code style="
                flex:1;background:var(--bg-base);border:1px solid var(--border-color);
                border-radius:var(--radius-md);padding:var(--space-2) var(--space-3);
                font-size:var(--text-base);direction:ltr;letter-spacing:0.05em;
                font-family:'JetBrains Mono',monospace;color:var(--text-primary);
              ">${f.value}</code>
              <button class="copy-wallet-btn btn btn--outline btn--sm" data-address="${f.value}">
                📋 کپی
              </button>
            </div>
          </div>
        `).join('')}
        <div style="
          background:rgba(244,162,97,0.1);border:1px solid rgba(244,162,97,0.3);
          border-radius:var(--radius-md);padding:var(--space-3) var(--space-4);
          font-size:var(--text-sm);color:var(--color-secondary-700);
          display:flex;gap:var(--space-2);margin-top:var(--space-3);
        ">
          <span>ℹ️</span>
          <span>بعد از واریز، رسید را آپلود کنید تا سریع‌تر تأیید شود.</span>
        </div>
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
          box-shadow:0 8px 24px rgba(244,162,97,0.4);
        " aria-hidden="true">🤝</div>
        <h2 style="font-size:var(--text-2xl);font-weight:900;color:var(--text-primary);margin-bottom:var(--space-4)">
          ${tx(COPY.confirmed)}
        </h2>
        <div style="
          background:var(--bg-surface);border:1px solid var(--border-color);
          border-radius:var(--radius-lg);padding:var(--space-5) var(--space-6);
          color:var(--text-secondary);font-size:var(--text-base);line-height:var(--leading-relaxed);
          margin-bottom:var(--space-6);border-inline-start:4px solid var(--color-secondary-400);
          text-align:start;
        ">
          ${tx({fa:'صدقه/هدیه شما دریافت شد و پس از تأیید برای شما پیام ارسال می‌شود.\nمی‌توانید پاسخ را در «پیام‌های من» ببینید.',ar:'تم استلام صدقتك/هديتك وسيُرسل لك رسالة بعد التأكيد.\nيمكنك رؤية الرد في «رسائلي».',en:'Your sadaqah/gift has been received. A message will be sent after confirmation.\nYou can see the reply in "My Messages".',id:'Sedekah/hadiah Anda diterima. Pesan akan dikirim setelah konfirmasi.\nLihat balasan di "Pesan Saya".'})}
        </div>
        <a href="/profile.html#messages" class="btn btn--primary btn--lg">
          📨 ${tx({fa:'پیام‌های من',ar:'رسائلي',ur:'میرے پیغامات',en:'My Messages',id:'Pesan Saya'})}
        </a>
      </div>
    `;
  }

  /* ── Events ── */
  function _bindPageEvents() {
    /* مبالغ پیشنهادی */
    container.querySelectorAll('.amount-btn').forEach(btn => {
      btn.addEventListener('click', () => { _amount = btn.dataset.amount; _render(); });
    });

    /* input مبلغ */
    document.getElementById('amount-input')?.addEventListener('input', (e) => { _amount = e.target.value; });

    /* روش پرداخت */
    container.querySelectorAll('.method-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        _method = btn.dataset.method;
        container.querySelectorAll('.method-btn').forEach(b => {
          b.style.borderColor = b.dataset.method === _method ? 'var(--color-primary-500)' : 'var(--border-color)';
          b.style.background  = b.dataset.method === _method ? 'var(--color-primary-50)'  : 'var(--bg-surface)';
        });
        const pb = document.getElementById('proceed-btn');
        if (pb) pb.disabled = !_method || !_amount;
      });
    });

    /* ادامه */
    document.getElementById('proceed-btn')?.addEventListener('click', () => {
      if (!_amount || parseFloat(_amount) <= 0) { alert(tx({fa:'مبلغ را وارد کنید',en:'Enter amount', ar:'أدخل المبلغ', ur:'رقم درج کریں', az:'Məbləği daxil edin', tr:'Tutarı girin', ru:'Введите сумму', id:'Masukkan jumlah'})); return; }
      _intention = document.getElementById('intention-input')?.value || '';
      _step = 'payment'; _render();
    });

    /* برگشت */
    document.getElementById('back-btn')?.addEventListener('click', () => { _step = 'form'; _render(); });

    /* کپی آدرس کیف پول */
    container.querySelectorAll('.copy-wallet-btn').forEach(btn => {
      btn.addEventListener('click', () => _copyToClipboard(btn.dataset.address, btn));
    });

    /* آپلود رسید */
    document.getElementById('receipt-upload')?.addEventListener('change', (e) => {
      _receiptFile = e.target.files?.[0] ?? null;
      const label = document.getElementById('receipt-label');
      if (label && _receiptFile) {
        label.style.borderColor = 'var(--color-primary-500)';
        label.querySelector('span:last-child').textContent = `✓ ${_receiptFile.name}`;
      }
    });

    /* OnRamper */
    document.getElementById('open-onramper-btn')?.addEventListener('click', () => {
      const walletAddr = config.onramper?.walletAddress || '';
      const onramperUrl = `https://widget.onramper.com?apiKey=${config.onramper?.apiKey}&wallets=USDT_TRC20:${walletAddr}&defaultCrypto=USDT_TRC20&amount=${_amount}`;
      window.open(onramperUrl, '_blank', 'width=450,height=700');
    });

    /* ثبت پرداخت */
    document.getElementById('confirm-payment-btn')?.addEventListener('click', async () => {
      const btn = document.getElementById('confirm-payment-btn');
      if (btn) { btn.disabled = true; btn.textContent = '⏳...'; }

      const user = AuthState.getUser();
      DonationsDB.add({
        userId:      user?.id ?? 'guest',
        userName:    user?.name ?? '',
        userLang:    lang,
        userCountry: user?.country ?? '',
        amount:      parseFloat(_amount),
        currency:    cur.k,
        method:      _method,
        intention:   _intention,
        hasReceipt:  !!_receiptFile,
      });

      /* نوتیفیکیشن کاربر */
      await NotifCenter.send({
        type:'donation', icon:'🤝',
        title:{ fa:'پرداخت ثبت شد ✓', [lang]:'پرداخت ثبت شد ✓' },
        text: { fa:'پرداخت شما دریافت شد. بعد از بررسی برایتان پیام می‌آید.', [lang]:'پرداخت شما دریافت شد.' },
      });

      _step = 'confirm'; _render();
    });
  }

  _render();
  i18n.onChange(() => _render());
}
