/**
 * ============================================================
 * FILE: admin-messages.js
 * ROLE: پیام‌های کاربران در داشبورد — با کشور و زبان
 * PROJECT: MediaHub — پلتفرم رسانه‌ای کربلا
 * VERSION: 1.0.0
 * ============================================================
 */

import { i18n } from './i18n.js';

const LANG_INFO = {
  fa: { name:'فارسی',    flag:'🇮🇷' },
  ar: { name:'عربی',     flag:'🇸🇦' },
  ur: { name:'اردو',     flag:'🇵🇰' },
  az: { name:'آذری',     flag:'🇦🇿' },
  tr: { name:'ترکی',     flag:'🇹🇷' },
  ru: { name:'روسی',     flag:'🇷🇺' },
  en: { name:'انگلیسی',  flag:'🇺🇸' },
};

/* ── ذخیره پیام کاربر ── */
export function saveUserMessage(msg) {
  try {
    const user = JSON.parse(localStorage.getItem('mh_user') || 'null');
    const messages = JSON.parse(localStorage.getItem('mh_user_messages') || '[]');
    messages.unshift({
      id:        'msg_' + Date.now(),
      userId:    user?.id ?? 'guest',
      userName:  user?.name ?? '—',
      userLang:  user?.lang ?? i18n.lang,
      userCountry: user?.country ?? '—',
      type:      msg.type,      /* 'consultation' | 'istikhara' | 'other' */
      content:   msg.content,   /* متن یا URL صوت */
      isAudio:   msg.isAudio ?? false,
      status:    'unread',
      createdAt: new Date().toISOString(),
    });
    localStorage.setItem('mh_user_messages', JSON.stringify(messages));
    return true;
  } catch { return false; }
}

/* ── رندر صفحه پیام‌ها در داشبورد ── */
export function renderMessagesPage() {
  const messages = (() => {
    try { return JSON.parse(localStorage.getItem('mh_user_messages') || '[]'); } catch { return []; }
  })();

  const unread = messages.filter(m => m.status === 'unread').length;

  const typeLabel = {
    consultation: '💬 مشاوره',
    istikhara:    '⭐ استخاره',
    other:        '📩 سایر',
  };

  return `
    <div>
      <div class="admin-page-header">
        <div>
          <h1 class="admin-page-title">
            <span class="admin-page-title__icon">📨</span>
            پیام‌های کاربران
          </h1>
          <p class="admin-page-desc">
            ${messages.length} پیام — ${unread} خوانده‌نشده
          </p>
        </div>
        <div class="flex gap-3">
          <select class="admin-input" style="width:160px" id="msg-filter-type" aria-label="فیلتر نوع">
            <option value="">همه پیام‌ها</option>
            <option value="consultation">مشاوره</option>
            <option value="istikhara">استخاره</option>
          </select>
          <select class="admin-input" style="width:140px" id="msg-filter-lang" aria-label="فیلتر زبان">
            <option value="">همه زبان‌ها</option>
            ${Object.entries(LANG_INFO).map(([k,v]) => `<option value="${k}">${v.flag} ${v.name}</option>`).join('')}
          </select>
        </div>
      </div>

      <!-- لیست پیام‌ها -->
      <div class="admin-table-wrap">
        <div class="admin-table-header">
          <div class="admin-table-title">
            📩 پیام‌های دریافتی
            ${unread > 0 ? `<span class="admin-nav__badge" style="margin-inline-start:8px">${unread}</span>` : ''}
          </div>
          ${unread > 0 ? `
            <button class="btn btn--outline btn--sm" id="mark-all-read-btn">
              ✓ همه را خوانده‌شده علامت بزن
            </button>
          ` : ''}
        </div>

        ${messages.length === 0 ? `
          <div style="text-align:center;padding:var(--space-12);color:var(--text-muted)">
            <div style="font-size:48px;margin-bottom:12px">📭</div>
            <p>هنوز پیامی دریافت نشده</p>
          </div>
        ` : `
          <div style="overflow-x:auto">
            <table class="admin-table" aria-label="پیام‌های کاربران">
              <thead>
                <tr>
                  <th>کاربر</th>
                  <th>کشور</th>
                  <th>زبان</th>
                  <th>نوع</th>
                  <th>پیام</th>
                  <th>تاریخ</th>
                  <th>وضعیت</th>
                  <th>پاسخ</th>
                </tr>
              </thead>
              <tbody id="messages-tbody">
                ${messages.map(m => `
                  <tr data-msg-id="${m.id}" style="${m.status==='unread'?'background:rgba(42,157,143,0.04)':''}">
                    <td>
                      <div style="font-weight:600;font-size:var(--text-sm)">${m.userName}</div>
                      <div style="font-size:var(--text-xs);color:var(--text-muted)">${m.userId}</div>
                    </td>
                    <td>${m.userCountry || '—'}</td>
                    <td>
                      <span style="font-size:18px">${LANG_INFO[m.userLang]?.flag ?? '🌐'}</span>
                      <span style="font-size:var(--text-xs);color:var(--text-muted)">${LANG_INFO[m.userLang]?.name ?? m.userLang}</span>
                    </td>
                    <td>${typeLabel[m.type] ?? '📩'}</td>
                    <td>
                      ${m.isAudio
                        ? `<button class="btn btn--outline btn--sm play-msg-btn" data-url="${m.content}">▶ پخش صوت</button>`
                        : `<div style="max-width:200px;font-size:var(--text-sm);overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${m.content}">${m.content}</div>`
                      }
                    </td>
                    <td style="font-size:var(--text-xs)">${new Date(m.createdAt).toLocaleDateString('fa-IR')}</td>
                    <td>
                      <span class="admin-badge admin-badge--${m.status==='unread'?'pending':'done'}">
                        ${m.status==='unread' ? 'جدید' : 'خوانده شد'}
                      </span>
                    </td>
                    <td>
                      <button class="btn btn--primary btn--sm reply-btn"
                        data-msg-id="${m.id}"
                        data-user-lang="${m.userLang}"
                        data-user-name="${m.userName}"
                        aria-label="پاسخ به ${m.userName}">
                        پاسخ
                      </button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `}
      </div>

      <!-- Modal پاسخ -->
      <div id="reply-modal" style="display:none;position:fixed;inset:0;background:var(--bg-overlay);z-index:var(--z-modal);display:none;align-items:center;justify-content:center;padding:24px">
        <div style="background:var(--bg-surface);border-radius:var(--radius-xl);max-width:520px;width:100%;padding:32px;box-shadow:var(--shadow-2xl)">
          <h3 style="font-size:var(--text-lg);font-weight:var(--weight-bold);margin-bottom:16px">
            📨 پاسخ به کاربر
            <span id="reply-user-info" style="font-size:var(--text-sm);color:var(--text-muted);font-weight:normal;margin-inline-start:8px"></span>
          </h3>
          <p style="font-size:var(--text-sm);color:var(--text-muted);margin-bottom:12px">
            متن پاسخ را به فارسی بنویسید — AI به زبان کاربر ترجمه می‌کند
          </p>
          <textarea id="reply-text"
            class="admin-textarea"
            rows="6"
            placeholder="پاسخ خود را به فارسی بنویسید..."
            aria-label="متن پاسخ"
          ></textarea>
          <div style="display:flex;gap:12px;margin-top:16px;justify-content:flex-end">
            <button class="btn btn--ghost" id="close-reply-modal">انصراف</button>
            <button class="btn btn--primary" id="send-reply-btn">📤 ارسال پاسخ</button>
          </div>
        </div>
      </div>

    </div>
  `;
}

/* ── Event bindings برای صفحه پیام‌ها ── */
export function bindMessagesEvents(container) {
  /* Mark all read */
  container.querySelector('#mark-all-read-btn')?.addEventListener('click', () => {
    try {
      const messages = JSON.parse(localStorage.getItem('mh_user_messages') || '[]');
      messages.forEach(m => { m.status = 'read'; });
      localStorage.setItem('mh_user_messages', JSON.stringify(messages));
      container.querySelectorAll('[data-msg-id]').forEach(row => {
        row.style.background = '';
        const badge = row.querySelector('.admin-badge');
        if (badge) { badge.className = 'admin-badge admin-badge--done'; badge.textContent = 'خوانده شد'; }
      });
    } catch {}
  });

  /* Reply modal */
  container.querySelectorAll('.reply-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const modal = document.getElementById('reply-modal');
      const info  = document.getElementById('reply-user-info');
      if (modal) {
        modal.style.display = 'flex';
        modal.dataset.msgId   = btn.dataset.msgId;
        modal.dataset.userLang = btn.dataset.userLang;
        if (info) info.textContent = `— ${btn.dataset.userName} — ${LANG_INFO[btn.dataset.userLang]?.flag ?? ''} ${LANG_INFO[btn.dataset.userLang]?.name ?? ''}`;
      }
    });
  });

  container.querySelector('#close-reply-modal')?.addEventListener('click', () => {
    const modal = document.getElementById('reply-modal');
    if (modal) modal.style.display = 'none';
  });

  container.querySelector('#send-reply-btn')?.addEventListener('click', async () => {
    const modal = document.getElementById('reply-modal');
    const text  = document.getElementById('reply-text')?.value?.trim();
    if (!text || !modal) return;

    const btn = container.querySelector('#send-reply-btn');
    if (btn) { btn.textContent = '⏳ در حال ترجمه...'; btn.disabled = true; }

    /* در production: ترجمه با AI و ارسال نوتیفیکیشن */
    await new Promise(r => setTimeout(r, 1000));

    modal.style.display = 'none';
    document.getElementById('reply-text').value = '';
    if (btn) { btn.textContent = '📤 ارسال پاسخ'; btn.disabled = false; }

    /* Toast */
    const t = document.createElement('div');
    t.setAttribute('role', 'alert');
    t.style.cssText = 'position:fixed;bottom:24px;inset-inline-end:24px;background:#16a34a;color:white;padding:12px 20px;border-radius:8px;font-size:14px;font-weight:600;z-index:9999;box-shadow:0 8px 24px rgba(0,0,0,0.25);animation:fadeIn 0.3s ease';
    t.textContent = '✓ پاسخ ترجمه و ارسال شد';
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 3000);
  });
}
