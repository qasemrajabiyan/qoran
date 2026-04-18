/**
 * ============================================================
 * FILE: admin-sadaqah.js
 * ROLE: داشبورد مدیریت پرداخت‌ها
 * PROJECT: BarakatHub — پلتفرم رسانه‌ای کربلا
 * VERSION: 1.0.0
 * ============================================================
 */

import { SadaqahConfig, DonationsDB } from './sadaqah.js';
import { translateText }               from './auto-translate.js';
import { NotifCenter }                 from './notifications.js';

const LANG_INFO = {
  fa:{name:'فارسی',flag:'🇮🇷'}, ar:{name:'عربی',flag:'🇸🇦'},
  ur:{name:'اردو',flag:'🇵🇰'}, az:{name:'آذری',flag:'🇦🇿'},
  tr:{name:'ترکی',flag:'🇹🇷'}, ru:{name:'روسی',flag:'🇷🇺'},
  en:{name:'انگلیسی',flag:'🇺🇸'}, id:{name:'اندونزیایی',flag:'🇮🇩'},
};

const METHOD_LABELS = { crypto:'₿ ارز دیجیتال', onramper:'🌐 OnRamper', kikard:'🇮🇶 کی‌کارد', bankMelli:'🇮🇷 بانک ملی' };

export function renderSadaqahAdminPage(container) {
  if (!container) return;

  let _activeTab    = 'donations';
  let _replyOrderId = null;

  function _render() {
    const config    = SadaqahConfig.get();
    const donations = DonationsDB.getAll();

    const pending   = donations.filter(d => d.status === 'pending');
    const confirmed = donations.filter(d => d.status === 'confirmed');

    /* آمار مالی */
    const totalUSD = donations.filter(d=>d.currency==='USD'&&d.status==='confirmed').reduce((a,d)=>a+d.amount,0);
    const totalIQD = donations.filter(d=>d.currency==='IQD'&&d.status==='confirmed').reduce((a,d)=>a+d.amount,0);

    container.innerHTML = `
      <div>
        <div class="admin-page-header">
          <div>
            <h1 class="admin-page-title">
              <span class="admin-page-title__icon">🤝</span>
              مدیریت پرداخت‌ها
            </h1>
            <p class="admin-page-desc">
              ${donations.length} پرداخت —
              ${pending.length > 0 ? `<span style="color:var(--color-error);font-weight:bold">${pending.length} در انتظار تأیید</span>` : '۰ در انتظار'}
            </p>
          </div>
          <div class="flex gap-3">
            ${['donations','settings'].map(tab => `
              <button class="btn btn--${_activeTab===tab?'primary':'outline'} btn--sm tab-btn" data-tab="${tab}">
                ${{donations:`📋 پرداخت‌ها${pending.length>0?` (${pending.length})`:''}`, settings:'⚙️ تنظیمات'}[tab]}
              </button>
            `).join('')}
          </div>
        </div>

        <!-- آمار -->
        <div class="admin-stats-grid" style="margin-bottom:var(--space-5)">
          ${[
            {label:'کل پرداخت‌ها',     num:donations.length,  color:'teal',   icon:'🤝'},
            {label:'در انتظار تأیید',  num:pending.length,    color:'amber',  icon:'⏳'},
            {label:'تأییدشده',         num:confirmed.length,  color:'green',  icon:'✓'},
            {label:'مجموع USD',        num:'$'+totalUSD.toFixed(0),  color:'purple', icon:'💵'},
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

        ${_activeTab === 'donations' ? _renderDonationsTab(donations) : ''}
        ${_activeTab === 'settings'  ? _renderSettingsTab(config)     : ''}

        ${_replyOrderId ? _renderReplyModal() : ''}
      </div>
    `;
    _bindEvents();
  }

  /* ── تب پرداخت‌ها ── */
  function _renderDonationsTab(donations) {
    return `
      <div class="admin-table-wrap">
        <div class="admin-table-header">
          <div class="admin-table-title">📋 همه پرداخت‌ها</div>
          <div class="flex gap-3">
            <select class="admin-input" style="width:140px" id="filter-status">
              <option value="">همه</option>
              <option value="pending">در انتظار</option>
              <option value="confirmed">تأیید‌شده</option>
              <option value="rejected">رد‌شده</option>
            </select>
            <select class="admin-input" style="width:140px" id="filter-method">
              <option value="">همه روش‌ها</option>
              ${Object.entries(METHOD_LABELS).map(([k,v])=>`<option value="${k}">${v}</option>`).join('')}
            </select>
          </div>
        </div>
        <div style="overflow-x:auto">
          <table class="admin-table" aria-label="پرداخت‌ها">
            <thead>
              <tr>
                <th>کاربر</th>
                <th>مبلغ</th>
                <th>روش</th>
                <th>زبان</th>
                <th>کشور</th>
                <th>نیت و پیام</th>
                <th>رسید</th>
                <th>وضعیت</th>
                <th>عملیات</th>
              </tr>
            </thead>
            <tbody>
              ${donations.length === 0
                ? `<tr><td colspan="9" style="text-align:center;color:var(--text-muted);padding:var(--space-8)">پرداخت وجود ندارد</td></tr>`
                : donations.map(d => `
                  <tr data-status="${d.status}" data-method="${d.method}">
                    <td>
                      <div style="font-weight:600">${d.userName||'—'}</div>
                      <div style="font-size:var(--text-xs);color:var(--text-muted)">${d.userId}</div>
                    </td>
                    <td>
                      <div style="font-weight:700;font-size:var(--text-base);color:var(--color-primary-600)">
                        ${d.amount?.toLocaleString()} ${d.currency}
                      </div>
                    </td>
                    <td>${METHOD_LABELS[d.method]??d.method}</td>
                    <td>${LANG_INFO[d.userLang]?.flag??'🌐'} ${LANG_INFO[d.userLang]?.name??d.userLang}</td>
                    <td>${d.userCountry||'—'}</td>
                    <td>
                      ${d.intention
                        ? `<div style="max-width:180px;font-size:var(--text-xs);color:var(--text-secondary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${d.intention}">${d.intention}</div>`
                        : '<span style="color:var(--text-muted);font-size:var(--text-xs)">—</span>'
                      }
                    </td>
                    <td>
                      ${d.hasReceipt
                        ? `<span class="admin-badge admin-badge--active">📎 دارد</span>`
                        : '<span style="color:var(--text-muted);font-size:var(--text-xs)">—</span>'
                      }
                    </td>
                    <td>
                      <span class="admin-badge admin-badge--${d.status==='confirmed'?'done':d.status==='rejected'?'rejected':'pending'}">
                        ${d.status==='confirmed'?'✓ تأیید':d.status==='rejected'?'✕ رد':'⏳ انتظار'}
                      </span>
                    </td>
                    <td>
                      <div style="display:flex;gap:var(--space-2);flex-wrap:wrap">
                        ${d.status === 'pending' ? `
                          <button class="btn btn--primary btn--sm confirm-donation-btn" data-id="${d.id}">✓ تأیید</button>
                          <button class="btn btn--ghost btn--sm reject-donation-btn" data-id="${d.id}" style="color:var(--color-error)">✕</button>
                        ` : ''}
                        <button class="btn btn--outline btn--sm reply-donation-btn" data-id="${d.id}">💌 پیام</button>
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

  /* ── تنظیمات ── */
  function _renderSettingsTab(config) {
    return `
      <div>
        <!-- کیف پول‌های ارز دیجیتال -->
        <div class="admin-panel" style="margin-bottom:var(--space-5)">
          <div class="admin-panel__header">
            <div class="admin-panel__title">₿ آدرس‌های کیف پول ارز دیجیتال</div>
          </div>
          <div class="admin-panel__body">
            <div class="grid grid--2" style="gap:var(--space-4)">
              ${[
                {key:'usdt_trc20', label:'USDT TRC20', placeholder:'TXxx...'},
                {key:'usdt_erc20', label:'USDT ERC20 (ETH)', placeholder:'0x...'},
                {key:'bitcoin',    label:'Bitcoin (BTC)', placeholder:'bc1...'},
                {key:'ethereum',   label:'Ethereum (ETH)', placeholder:'0x...'},
              ].map(w => `
                <div class="admin-field">
                  <label class="admin-label" for="wallet-${w.key}">${w.label}</label>
                  <input type="text" class="admin-input" id="wallet-${w.key}"
                    value="${config.wallets?.[w.key]??''}" dir="ltr" placeholder="${w.placeholder}"/>
                </div>
              `).join('')}
            </div>
          </div>
        </div>

        <!-- OnRamper -->
        <div class="admin-panel" style="margin-bottom:var(--space-5)">
          <div class="admin-panel__header">
            <div class="admin-panel__title">🌐 OnRamper</div>
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
                  value="${config.onramper?.walletAddress??''}" dir="ltr" placeholder="آدرس کیف پول..."/>
              </div>
            </div>
          </div>
        </div>

        <!-- کی‌کارد -->
        <div class="admin-panel" style="margin-bottom:var(--space-5)">
          <div class="admin-panel__header">
            <div class="admin-panel__title">🇮🇶 کی‌کارد عراق</div>
            <label class="admin-toggle">
              <input type="checkbox" id="kikard-active" ${config.kikard?.active?'checked':''}/>
              <div class="admin-toggle__track"><div class="admin-toggle__thumb"></div></div>
            </label>
          </div>
          <div class="admin-panel__body">
            <div class="grid grid--2" style="gap:var(--space-4)">
              <div class="admin-field">
                <label class="admin-label" for="kikard-id">Account ID</label>
                <input type="text" class="admin-input" id="kikard-id"
                  value="${config.kikard?.accountId??''}" dir="ltr"/>
              </div>
              <div class="admin-field">
                <label class="admin-label" for="kikard-key">API Key</label>
                <input type="password" class="admin-input" id="kikard-key"
                  value="${config.kikard?.apiKey??''}" dir="ltr"/>
              </div>
            </div>
          </div>
        </div>

        <!-- بانک ملی -->
        <div class="admin-panel" style="margin-bottom:var(--space-5)">
          <div class="admin-panel__header">
            <div class="admin-panel__title">🇮🇷 بانک ملی ایران</div>
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
                  value="${config.bankMelli?.cardNumber??''}" dir="ltr" placeholder="6037-XXXX-XXXX-XXXX"/>
              </div>
              <div class="admin-field">
                <label class="admin-label" for="bm-name">نام صاحب حساب</label>
                <input type="text" class="admin-input" id="bm-name" value="${config.bankMelli?.accountName??''}"/>
              </div>
              <div class="admin-field" style="grid-column:span 2">
                <label class="admin-label" for="bm-sheba">شماره شبا</label>
                <input type="text" class="admin-input" id="bm-sheba"
                  value="${config.bankMelli?.shebaNumber??''}" dir="ltr" placeholder="IR..."/>
              </div>
            </div>
          </div>
        </div>

        <button class="btn btn--primary btn--lg" id="save-sadaqah-settings">💾 ذخیره همه تنظیمات</button>
      </div>
    `;
  }

  /* ── Modal پیام تشکر ── */
  function _renderReplyModal() {
    const donation = DonationsDB.getAll().find(d => d.id === _replyOrderId);
    if (!donation) return '';

    return `
      <div style="position:fixed;inset:0;background:var(--bg-overlay);backdrop-filter:blur(8px);z-index:var(--z-modal);display:flex;align-items:center;justify-content:center;padding:24px" id="reply-modal">
        <div style="background:var(--bg-surface);border-radius:var(--radius-xl);max-width:540px;width:100%;padding:32px;box-shadow:var(--shadow-2xl)">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
            <h3 style="font-size:var(--text-lg);font-weight:bold">💌 پیام تشکر برای ${donation.userName||'کاربر'}</h3>
            <button id="close-reply-modal" style="background:none;border:none;cursor:pointer;font-size:20px">✕</button>
          </div>
          <div style="
            background:var(--bg-surface-2);border-radius:var(--radius-md);
            padding:var(--space-3) var(--space-4);margin-bottom:var(--space-4);
            font-size:var(--text-sm);color:var(--text-muted);
            display:flex;gap:8px;align-items:center;
          ">
            ${LANG_INFO[donation.userLang]?.flag??'🌐'}
            ${donation.userName} · ${donation.userCountry} ·
            ${donation.amount?.toLocaleString()} ${donation.currency} ·
            ${METHOD_LABELS[donation.method]??''}
          </div>
          <p style="font-size:var(--text-sm);color:var(--text-muted);margin-bottom:8px">
            متن پیام به فارسی بنویسید — AI به زبان کاربر ترجمه می‌کند
          </p>
          <textarea id="thank-you-text" class="admin-textarea" rows="6"
            placeholder="${SadaqahConfig.get().thankYouMessageDefault||'پیام تشکر...'}"
          ></textarea>
          <div style="display:flex;gap:12px;margin-top:16px">
            <button class="btn btn--ghost" id="close-reply-modal-2">انصراف</button>
            <button class="btn btn--primary" style="flex:1" id="send-thank-you-btn">📤 ارسال پیام</button>
          </div>
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
    ['filter-status','filter-method'].forEach(id => {
      document.getElementById(id)?.addEventListener('change', () => {
        const st = document.getElementById('filter-status')?.value;
        const mt = document.getElementById('filter-method')?.value;
        container.querySelectorAll('tr[data-status]').forEach(row => {
          const show = (!st||row.dataset.status===st) && (!mt||row.dataset.method===mt);
          row.style.display = show ? '' : 'none';
        });
      });
    });

    /* تأیید */
    container.querySelectorAll('.confirm-donation-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        DonationsDB.update(btn.dataset.id, { status:'confirmed', confirmedAt: new Date().toISOString() });
        _showToast('✓ پرداخت تأیید شد');
        _render();
      });
    });

    /* رد */
    container.querySelectorAll('.reject-donation-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (!confirm('رد شود؟')) return;
        DonationsDB.update(btn.dataset.id, { status:'rejected' });
        _render();
      });
    });

    /* پیام */
    container.querySelectorAll('.reply-donation-btn').forEach(btn => {
      btn.addEventListener('click', () => { _replyOrderId = btn.dataset.id; _render(); });
    });

    /* بستن modal */
    ['close-reply-modal','close-reply-modal-2'].forEach(id => {
      document.getElementById(id)?.addEventListener('click', () => { _replyOrderId = null; _render(); });
    });

    /* ارسال تشکر */
    document.getElementById('send-thank-you-btn')?.addEventListener('click', async () => {
      const text     = document.getElementById('thank-you-text')?.value?.trim();
      if (!text) return;
      const donation = DonationsDB.getAll().find(d => d.id === _replyOrderId);
      if (!donation) return;

      const btn = document.getElementById('send-thank-you-btn');
      if (btn) { btn.disabled = true; btn.textContent = '⏳ در حال ترجمه...'; }

      const lang = donation.userLang ?? 'fa';
      const greetings = { fa:`کاربر گرامی ${donation.userName}،\n\n`, ar:`عزيزي ${donation.userName}،\n\n`, en:`Dear ${donation.userName},\n\n` };
      const greet = greetings[lang] ?? greetings.fa;

      let finalText = greet + text;
      if (lang !== 'fa') {
        const translated = await translateText(text, lang, 'admin');
        finalText = (greetings[lang] ?? greet) + translated;
      }

      await NotifCenter.send({
        type:  'donation',
        icon:  '🤝',
        title: { fa:'پیام از برکت‌هاب', [lang]:'پیام از برکت‌هاب' },
        text:  { fa: greet + text, [lang]: finalText },
        url:   '/profile.html#messages',
      });

      _showToast('✓ پیام تشکر ارسال شد');
      _replyOrderId = null; _render();
    });

    /* ذخیره تنظیمات */
    document.getElementById('save-sadaqah-settings')?.addEventListener('click', () => {
      SadaqahConfig.set({
        wallets: {
          usdt_trc20: document.getElementById('wallet-usdt_trc20')?.value?.trim(),
          usdt_erc20: document.getElementById('wallet-usdt_erc20')?.value?.trim(),
          bitcoin:    document.getElementById('wallet-bitcoin')?.value?.trim(),
          ethereum:   document.getElementById('wallet-ethereum')?.value?.trim(),
        },
        onramper: {
          apiKey:        document.getElementById('onramper-key')?.value?.trim(),
          walletAddress: document.getElementById('onramper-wallet')?.value?.trim(),
        },
        kikard: {
          active:    document.getElementById('kikard-active')?.checked ?? false,
          accountId: document.getElementById('kikard-id')?.value?.trim(),
          apiKey:    document.getElementById('kikard-key')?.value?.trim(),
        },
        bankMelli: {
          active:      document.getElementById('bankmelli-active')?.checked ?? false,
          cardNumber:  document.getElementById('bm-card')?.value?.trim(),
          accountName: document.getElementById('bm-name')?.value?.trim(),
          shebaNumber: document.getElementById('bm-sheba')?.value?.trim(),
        },
        suggestedAmounts: SadaqahConfig.get().suggestedAmounts,
        thankYouMessageDefault: SadaqahConfig.get().thankYouMessageDefault,
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
    setTimeout(()=>{t.style.opacity='0';t.style.transition='opacity 0.3s';setTimeout(()=>t.remove(),300);},2500);
  }

  _render();
}
