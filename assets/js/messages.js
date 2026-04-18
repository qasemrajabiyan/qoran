/**
 * ============================================================
 * FILE: messages.js
 * ROLE: صفحه «پیام‌های من» — صندوق پیام یک‌طرفه کاربر
 * PROJECT: BarakatHub — پلتفرم رسانه‌ای کربلا
 * VERSION: 1.0.0
 *
 * انواع پیام:
 *   — prayer:       تأیید و انجام دعا
 *   — consultation: پاسخ مشاوره (صوت)
 *   — istikhara:    نتیجه استخاره (صوت یا متن)
 *   — quran:        پیام تدبر و شب جمعه
 *   — prize:        جایزه و referral
 *   — donation:     تأیید پرداخت
 *   — system:       اعلان عمومی
 *
 * نگه‌داری پیام‌ها:
 *   — مشاوره/استخاره/دعا: همیشه
 *   — اعلان عمومی: ۳ ماه
 *   — کاربر می‌تواند هر پیام را حذف کند
 * ============================================================
 */

import { i18n } from './i18n.js';
import { AudioPlayer, FontController } from './audio-player.js';
import { AuthState } from './auth.js';
import { NotifCenter, clearBadge } from './notifications.js';

/* ────────────────────────────────────────────────────────────
   1. CONFIG
   ──────────────────────────────────────────────────────────── */
const RETENTION = {
  prayer:       null,   /* همیشه */
  consultation: null,   /* همیشه */
  istikhara:    null,   /* همیشه */
  quran:        null,   /* همیشه */
  prize:        null,   /* همیشه */
  donation:     null,   /* همیشه */
  system:       90,     /* ۹۰ روز */
};

const TYPE_CONFIG = {
  prayer:       { icon:'🤲', color:'#2a9d8f', label:{ fa:'دعا', ar:'الدعاء', ur:'دعا', az:'Dua', tr:'Dua', ru:'Молитва', en:'Prayer', id:'Doa' } },
  consultation: { icon:'💬', color:'#3b82f6', label:{ fa:'مشاوره', ar:'الاستشارة', ur:'مشاورہ', az:'Məsləhət', tr:'Danışmanlık', ru:'Консультация', en:'Consultation', id:'Konsultasi' } },
  istikhara:    { icon:'⭐', color:'#8b5cf6', label:{ fa:'استخاره', ar:'الاستخارة', ur:'استخارہ', az:'İstixarə', tr:'İstihare', ru:'Истихара', en:'Istikhara', id:'Istikharah' } },
  quran:        { icon:'📖', color:'#059669', label:{ fa:'قرآن', ar:'القرآن', ur:'قرآن', az:'Quran', tr:'Kuran', ru:'Коран', en:'Quran', id:'Quran' } },
  prize:        { icon:'🎁', color:'#f59e0b', label:{ fa:'جایزه', ar:'جائزة', ur:'انعام', az:'Mükafat', tr:'Ödül', ru:'Приз', en:'Prize', id:'Hadiah' } },
  gift:         { icon:'🕌', color:'#10b981', label:{ fa:'زیارت نیابتی', ar:'الزيارة النيابية', ur:'نیابتی زیارت', az:'Niyabət ziyarəti', tr:'Vekâlet Ziyareti', ru:'Паломничество по доверенности', en:'Proxy Pilgrimage', id:'Ziarah Perwakilan' } },
  donation:     { icon:'💳', color:'#10b981', label:{ fa:'پرداخت', ar:'الدفع', ur:'ادائیگی', az:'Ödəniş', tr:'Ödeme', ru:'Платёж', en:'Payment', id:'Pembayaran' } },
  system:       { icon:'📢', color:'#64748b', label:{ fa:'اعلان', ar:'إعلان', ur:'اعلان', az:'Bildiriş', tr:'Duyuru', ru:'Уведомление', en:'Notice', id:'Pemberitahuan' } },
};

/* ────────────────────────────────────────────────────────────
   2. MESSAGES MANAGER
   ──────────────────────────────────────────────────────────── */
export const MessagesManager = {
  /* دریافت همه پیام‌های کاربر — با پاکسازی منقضی‌شده */
  getAll(userId) {
    try {
      const all   = JSON.parse(localStorage.getItem('mh_notifications') || '[]');
      const now   = Date.now();
      const valid = all.filter(n => {
        /* فیلتر بر اساس userId */
        if (n.userId && n.userId !== userId) return false;
        /* بررسی انقضا */
        const days = RETENTION[n.type ?? 'system'];
        if (days === null) return true;
        const age = (now - new Date(n.time).getTime()) / (1000 * 60 * 60 * 24);
        return age <= days;
      });
      /* ذخیره مجدد بدون منقضی‌شده */
      if (valid.length < all.length) {
        localStorage.setItem('mh_notifications', JSON.stringify(valid));
      }
      return valid.sort((a, b) => new Date(b.time) - new Date(a.time));
    } catch { return []; }
  },

  markRead(id) {
    try {
      const all = JSON.parse(localStorage.getItem('mh_notifications') || '[]');
      const idx = all.findIndex(n => n.id === id);
      if (idx !== -1) { all[idx].read = true; localStorage.setItem('mh_notifications', JSON.stringify(all)); }
    } catch {}
  },

  markAllRead(userId) {
    try {
      const all = JSON.parse(localStorage.getItem('mh_notifications') || '[]');
      all.forEach(n => { if (!n.userId || n.userId === userId) n.read = true; });
      localStorage.setItem('mh_notifications', JSON.stringify(all));
      clearBadge();
    } catch {}
  },

  delete(id) {
    try {
      const all = JSON.parse(localStorage.getItem('mh_notifications') || '[]');
      const filtered = all.filter(n => n.id !== id);
      localStorage.setItem('mh_notifications', JSON.stringify(filtered));
    } catch {}
  },

  unreadCount(userId) {
    return this.getAll(userId).filter(n => !n.read).length;
  },
};

/* ────────────────────────────────────────────────────────────
   3. PAGE RENDERER
   ──────────────────────────────────────────────────────────── */
export function renderMessagesPage(container) {
  if (!container) return;

  const user   = AuthState.getUser();
  const userId = user?.id ?? 'guest';
  const lang   = i18n.lang;

  let _filter       = 'all';
  let _activeMsg    = null;
  let _audioPlaying = null;

  const tx = (obj) => obj?.[lang] ?? obj?.fa ?? obj?.en ?? '';

  const COPY = {
    title:    { fa:'پیام‌های من', ar:'رسائلي', ur:'میرے پیغامات', az:'Mesajlarım', tr:'Mesajlarım', ru:'Мои сообщения', en:'My Messages', id:'Pesan Saya' },
    empty:    { fa:'هیچ پیامی وجود ندارد', ar:'لا توجد رسائل', ur:'کوئی پیغام نہیں', az:'Mesaj yoxdur', tr:'Henüz mesaj yok', ru:'Нет сообщений', en:'No messages yet', id:'Belum ada pesan' },
    emptyDesc:{ fa:'پیام‌های استخاره، مشاوره، دعا و اعلان‌های سایت اینجا نمایش داده می‌شود', ar:'ستظهر رسائل الاستخارة والاستشارة والدعاء والإعلانات هنا', ur:'استخارہ، مشاورہ، دعا اور سائٹ اطلاعات یہاں نظر آئیں گی', az:'İstixarə, məsləhət, dua və sayt bildirişləri burada göstəriləcək', tr:'İstihare, danışmanlık, dua ve site duyuruları burada görünecek', ru:'Сообщения об истихаре, консультациях, молитвах и уведомления сайта появятся здесь', en:'Istikhara, consultation, prayer, and site notices will appear here', id:'Istikharah, konsultasi, doa, dan pemberitahuan akan muncul di sini' },
    markAll:  { fa:'همه را خوانده‌شده', ar:'تحديد الكل كمقروء', ur:'سب پڑھا ہوا', az:'Hamısını oxunmuş işarələ', tr:'Tümünü okundu işaretle', ru:'Отметить все как прочитанные', en:'Mark all as read', id:'Tandai semua dibaca' },
    all:      { fa:'همه', ar:'الكل', ur:'سب', az:'Hamısı', tr:'Tümü', ru:'Все', en:'All', id:'Semua' },
    unread:   { fa:'خوانده‌نشده', ar:'غير مقروء', ur:'نہ پڑھا', az:'Oxunmamış', tr:'Okunmamış', ru:'Непрочитанные', en:'Unread', id:'Belum dibaca' },
    deleteMsg:{ fa:'حذف', ar:'حذف', ur:'حذف', az:'Sil', tr:'Sil', ru:'Удалить', en:'Delete', id:'Hapus' },
    listen:   { fa:'گوش دادن', ar:'استماع', ur:'سننا', az:'Dinlə', tr:'Dinle', ru:'Слушать', en:'Listen', id:'Dengarkan' },
    ago:      { fa:'پیش', ar:'مضى', ur:'پہلے', az:'əvvəl', tr:'önce', ru:'назад', en:'ago', id:'lalu' },
  };

  function _render() {
    const messages  = MessagesManager.getAll(userId);
    const unread    = messages.filter(m => !m.read).length;
    const filtered  = _filter === 'all' ? messages : messages.filter(m => !m.read);

    /* علامت‌گذاری همه به عنوان دیده‌شده هنگام باز شدن صفحه */
    if (unread > 0) MessagesManager.markAllRead(userId);

    container.innerHTML = `
      <!-- Hero کوچک -->
      <div style="
        background:linear-gradient(135deg,#0d1f2d 0%,#1a3040 100%);
        padding:calc(var(--navbar-height) + var(--space-8)) 0 var(--space-8);
        position:relative;overflow:hidden;
      ">
        <div style="position:absolute;inset:0;opacity:0.04;background-image:radial-gradient(white 1px,transparent 1px);background-size:32px 32px" aria-hidden="true"></div>
        <div class="container" style="position:relative;z-index:1">
          <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:var(--space-4)">
            <div>
              <h1 style="
                font-family:var(--font-rtl-display);
                font-size:clamp(1.5rem,3vw,2rem);
                font-weight:900;color:white;
                display:flex;align-items:center;gap:var(--space-3);
                margin-bottom:var(--space-2);
              ">
                <span aria-hidden="true">📨</span>
                ${tx(COPY.title)}
                ${unread > 0 ? `
                  <span style="
                    background:var(--color-error);color:white;
                    font-size:var(--text-sm);font-weight:700;
                    padding:2px 10px;border-radius:var(--radius-full);
                  " aria-label="${unread} پیام خوانده‌نشده">${unread}</span>
                ` : ''}
              </h1>
              <p style="color:rgba(255,255,255,0.55);font-size:var(--text-sm)">
                ${messages.length} ${tx({fa:'پیام',ar:'رسالة',ur:'پیغام',az:'mesaj',tr:'mesaj',ru:'сообщение',en:'message',id:'pesan'})}
              </p>
            </div>

            <!-- فیلتر -->
            <div style="display:flex;gap:var(--space-2)" role="tablist" aria-label="فیلتر پیام‌ها">
              ${['all','unread'].map(f => `
                <button
                  role="tab"
                  aria-selected="${_filter === f}"
                  class="filter-btn"
                  data-filter="${f}"
                  style="
                    padding:var(--space-2) var(--space-4);
                    border-radius:var(--radius-full);
                    border:1.5px solid ${_filter===f?'white':'rgba(255,255,255,0.3)'};
                    background:${_filter===f?'white':'transparent'};
                    color:${_filter===f?'#0d1f2d':'rgba(255,255,255,0.8)'};
                    font-size:var(--text-sm);font-weight:600;cursor:pointer;
                    font-family:var(--font-rtl-body);transition:all 0.2s;
                  "
                >${tx(COPY[f])}</button>
              `).join('')}
            </div>
          </div>
        </div>
      </div>

      <!-- محتوا -->
      <div class="container" style="padding-block:var(--space-6);max-width:860px">

        ${filtered.length === 0 ? `
          <!-- خالی -->
          <div style="
            text-align:center;padding:var(--space-16) var(--space-8);
            background:var(--bg-surface);border:1px solid var(--border-color);
            border-radius:var(--radius-xl);
          ">
            <div style="font-size:64px;margin-bottom:var(--space-4);opacity:0.5" aria-hidden="true">📭</div>
            <h2 style="font-size:var(--text-xl);font-weight:700;color:var(--text-primary);margin-bottom:var(--space-2)">${tx(COPY.empty)}</h2>
            <p style="color:var(--text-muted);font-size:var(--text-sm);max-width:40ch;margin:0 auto">${tx(COPY.emptyDesc)}</p>
          </div>
        ` : `
          <!-- لیست پیام‌ها -->
          <div style="display:flex;flex-direction:column;gap:var(--space-3)" role="list" aria-label="${tx(COPY.title)}">
            ${filtered.map(msg => _renderMessageCard(msg)).join('')}
          </div>
        `}

      </div>

      <!-- Modal جزئیات پیام -->
      <div id="msg-detail-modal" style="
        display:none;position:fixed;inset:0;
        background:rgba(10,14,20,0.92);backdrop-filter:blur(12px);
        z-index:var(--z-modal);align-items:center;justify-content:center;padding:24px;
      " role="dialog" aria-modal="true" aria-label="جزئیات پیام">
        <div id="msg-detail-content" style="
          background:var(--bg-surface);border-radius:var(--radius-xl);
          max-width:600px;width:100%;max-height:85vh;overflow-y:auto;
          box-shadow:var(--shadow-2xl);border:1px solid var(--border-color);
          animation:scaleIn 0.3s ease;
        "></div>
      </div>
    `;

    _bindEvents(messages, filtered);
  }

  /* ── کارت پیام ── */
  function _renderMessageCard(msg) {
    const cfg       = TYPE_CONFIG[msg.type ?? 'system'] ?? TYPE_CONFIG.system;
    const title     = tx(msg.title) || tx(cfg.label);
    const body      = tx(msg.text) || '';
    const timeStr   = _timeAgo(msg.time);
    const hasAudio  = !!msg.audioUrl;
    const isUnread  = !msg.read;

    return `
      <article
        class="msg-card"
        data-id="${msg.id}"
        role="listitem"
        aria-label="${title}"
        style="
          background:var(--bg-surface);
          border:1.5px solid ${isUnread ? cfg.color + '40' : 'var(--border-color)'};
          border-radius:var(--radius-xl);
          padding:var(--space-5) var(--space-6);
          cursor:pointer;
          transition:all 0.2s ease;
          position:relative;
          overflow:hidden;
          ${isUnread ? `border-inline-start:4px solid ${cfg.color};` : ''}
        "
      >
        <!-- نقطه خوانده‌نشده -->
        ${isUnread ? `
          <div style="
            position:absolute;top:var(--space-4);inset-inline-end:var(--space-4);
            width:9px;height:9px;border-radius:50%;
            background:${cfg.color};
          " aria-hidden="true"></div>
        ` : ''}

        <div style="display:flex;align-items:flex-start;gap:var(--space-4)">

          <!-- آیکون -->
          <div style="
            width:46px;height:46px;border-radius:var(--radius-lg);
            background:${cfg.color}18;
            border:1px solid ${cfg.color}30;
            display:flex;align-items:center;justify-content:center;
            font-size:22px;flex-shrink:0;
          " aria-hidden="true">${cfg.icon}</div>

          <!-- محتوا -->
          <div style="flex:1;min-width:0">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-2);gap:var(--space-3)">
              <h3 style="
                font-size:var(--text-base);font-weight:${isUnread?'700':'600'};
                color:var(--text-primary);
                overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
              ">${title}</h3>
              <div style="display:flex;align-items:center;gap:var(--space-3);flex-shrink:0">
                <span style="
                  background:${cfg.color}18;color:${cfg.color};
                  font-size:var(--text-xs);font-weight:600;
                  padding:2px 8px;border-radius:var(--radius-full);
                ">${tx(cfg.label)}</span>
                <span style="font-size:var(--text-xs);color:var(--text-muted);white-space:nowrap">${timeStr}</span>
              </div>
            </div>

            <!-- متن خلاصه -->
            <p style="
              font-size:var(--text-sm);color:var(--text-secondary);
              line-height:var(--leading-relaxed);
              display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;
              margin-bottom:${hasAudio ? 'var(--space-3)' : '0'};
            ">${body.slice(0, 200)}${body.length > 200 ? '...' : ''}</p>

            <!-- پلیر صوت -->
            ${hasAudio ? `
              <div id="player-${msg.id}" onclick="event.stopPropagation()"></div>
            ` : ''}
          </div>

        </div>

        <!-- دکمه‌های action -->
        <div style="
          display:flex;justify-content:flex-end;gap:var(--space-2);
          margin-top:var(--space-4);padding-top:var(--space-3);
          border-top:1px solid var(--border-color);
        " onclick="event.stopPropagation()">
          ${body.length > 200 || hasAudio ? `
            <button class="view-detail-btn btn btn--ghost btn--sm" data-id="${msg.id}"
              style="font-size:var(--text-xs)">
              👁 ${tx({fa:'مشاهده کامل',ar:'عرض كامل',ur:'مکمل دیکھیں',az:'Tam bax',tr:'Tamamını gör',ru:'Просмотреть полностью',en:'View full',id:'Lihat lengkap'})}
            </button>
          ` : ''}
          <button class="delete-msg-btn btn btn--ghost btn--sm" data-id="${msg.id}"
            style="font-size:var(--text-xs);color:var(--text-muted)">
            🗑 ${tx(COPY.deleteMsg)}
          </button>
        </div>
      </article>
    `;
  }

  /* ── Modal جزئیات ── */
  function _renderDetailModal(msg) {
    const cfg    = TYPE_CONFIG[msg.type ?? 'system'] ?? TYPE_CONFIG.system;
    const title  = tx(msg.title) || tx(cfg.label);
    const body   = tx(msg.text) || '';
    const time   = new Date(msg.time).toLocaleDateString('fa-IR', { weekday:'long', year:'numeric', month:'long', day:'numeric', hour:'2-digit', minute:'2-digit' });

    return `
      <!-- Header modal -->
      <div style="
        background:linear-gradient(135deg,${cfg.color}20,${cfg.color}08);
        border-bottom:1px solid var(--border-color);
        padding:var(--space-6);
        display:flex;align-items:center;justify-content:space-between;gap:var(--space-3);
      ">
        <div style="display:flex;align-items:center;gap:var(--space-3)">
          <div style="
            width:48px;height:48px;border-radius:var(--radius-lg);
            background:${cfg.color}20;border:1px solid ${cfg.color}40;
            display:flex;align-items:center;justify-content:center;font-size:24px;
          " aria-hidden="true">${cfg.icon}</div>
          <div>
            <h2 style="font-size:var(--text-lg);font-weight:700;color:var(--text-primary)">${title}</h2>
            <p style="font-size:var(--text-xs);color:var(--text-muted)">${time}</p>
          </div>
        </div>
        <button id="close-modal-btn" style="
          background:var(--bg-surface-2);border:none;width:32px;height:32px;
          border-radius:50%;cursor:pointer;font-size:16px;color:var(--text-muted);
          display:flex;align-items:center;justify-content:center;
        " aria-label="بستن">✕</button>
      </div>

      <!-- Body modal -->
      <div style="padding:var(--space-7)">

        <!-- پلیر صوت -->
        ${msg.audioUrl ? `
          <div style="
            background:linear-gradient(135deg,${cfg.color}12,${cfg.color}04);
            border:1px solid ${cfg.color}25;
            border-radius:var(--radius-lg);
            padding:var(--space-5);
            margin-bottom:var(--space-6);
          ">
            <div style="font-size:var(--text-sm);font-weight:600;color:${cfg.color};margin-bottom:var(--space-4);display:flex;align-items:center;gap:6px">
              <span>🎤</span>
              ${tx({fa:'پیام صوتی',ar:'رسالة صوتية',ur:'آواز پیغام',az:'Səsli mesaj',tr:'Sesli mesaj',ru:'Голосовое сообщение',en:'Voice message',id:'Pesan suara'})}
            </div>
            <div style="display:flex;align-items:center;gap:var(--space-3)">
              <button id="modal-play-btn" data-audio="${msg.audioUrl}" style="
                width:52px;height:52px;border-radius:50%;
                background:${cfg.color};color:white;border:none;cursor:pointer;
                font-size:20px;display:flex;align-items:center;justify-content:center;
                box-shadow:0 4px 12px ${cfg.color}50;transition:all 0.2s;flex-shrink:0;
              " aria-label="پخش صوت">▶</button>
              <div style="flex:1">
                <div id="modal-progress-bar" style="height:6px;background:var(--border-color);border-radius:999px;overflow:hidden;cursor:pointer;margin-bottom:6px">
                  <div id="modal-progress-fill" style="height:100%;width:0%;background:${cfg.color};border-radius:999px;transition:width 0.1s linear"></div>
                </div>
                <div style="display:flex;justify-content:space-between">
                  <span id="modal-current-time" style="font-size:11px;color:var(--text-muted);font-family:'JetBrains Mono',monospace">0:00</span>
                  <span id="modal-duration" style="font-size:11px;color:var(--text-muted);font-family:'JetBrains Mono',monospace">--:--</span>
                </div>
              </div>
            </div>
          </div>
        ` : ''}

        <!-- متن کامل -->
        ${body ? `
          <div style="
            font-size:var(--text-base);
            line-height:var(--leading-rtl);
            color:var(--text-secondary);
            white-space:pre-line;
            background:var(--bg-surface-2);
            border-radius:var(--radius-lg);
            padding:var(--space-5) var(--space-6);
            border-inline-start:3px solid ${cfg.color};
          ">${body}</div>
        ` : ''}

        <!-- تصویر پیوست -->
        ${msg.imageUrl ? `
          <div style="margin-top:var(--space-5)">
            <img src="${msg.imageUrl}" alt="تصویر پیام"
              style="width:100%;border-radius:var(--radius-lg);max-height:400px;object-fit:cover;border:1px solid var(--border-color)"
              loading="lazy" onerror="this.style.display='none'"/>
          </div>
        ` : ''}

        <!-- ویدیو پیوست -->
        ${msg.videoUrl ? `
          <div style="margin-top:var(--space-5)">
            <video controls src="${msg.videoUrl}"
              style="width:100%;border-radius:var(--radius-lg);max-height:400px;background:#000;border:1px solid var(--border-color)"
              preload="metadata">
            </video>
          </div>
        ` : ''}

      </div>
    `;
  }

  /* ── Events ── */
  function _bindEvents(messages, filtered) {
    /* فیلتر */
    container.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        _filter = btn.dataset.filter;
        _render();
      });
    });

    /* Init پلیرهای صوت */
    filtered.filter(m => m.audioUrl).forEach(msg => {
      const el = document.getElementById('player-' + msg.id);
      if (el) {
        const cfg = TYPE_CONFIG[msg.type ?? 'system'] ?? TYPE_CONFIG.system;
        const player = new AudioPlayer('player-' + msg.id, msg.audioUrl, {
          accentColor: cfg.color,
          compact: true,
        });
        player.render();
      }
    });

    /* کلیک روی کارت */
    container.querySelectorAll('.msg-card').forEach(card => {
      card.addEventListener('click', () => {
        const id  = card.dataset.id;
        const msg = messages.find(m => m.id === id);
        if (!msg) return;
        MessagesManager.markRead(id);
        _showDetailModal(msg);
      });
      /* hover effect */
      card.addEventListener('mouseenter', () => { card.style.transform = 'translateY(-2px)'; card.style.boxShadow = 'var(--shadow-md)'; });
      card.addEventListener('mouseleave', () => { card.style.transform = ''; card.style.boxShadow = ''; });
    });

    /* دکمه مشاهده کامل */
    container.querySelectorAll('.view-detail-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const msg = messages.find(m => m.id === btn.dataset.id);
        if (msg) _showDetailModal(msg);
      });
    });

    /* حذف پیام */
    container.querySelectorAll('.delete-msg-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id   = btn.dataset.id;
        const card = container.querySelector(`.msg-card[data-id="${id}"]`);
        if (card) {
          card.style.opacity = '0';
          card.style.transform = 'translateX(20px)';
          card.style.transition = 'all 0.3s ease';
          setTimeout(() => { MessagesManager.delete(id); _render(); }, 300);
        }
      });
    });

    /* پلیر صوت در لیست */
    container.querySelectorAll('.audio-play-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        _toggleAudio(btn.dataset.audio, btn.dataset.id, btn);
      });
    });
  }

  /* ── Modal ── */
  function _showDetailModal(msg) {
    _activeMsg = msg;
    const modal   = document.getElementById('msg-detail-modal');
    const content = document.getElementById('msg-detail-content');
    if (!modal || !content) return;
    content.innerHTML = _renderDetailModal(msg);
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';

    /* بستن */
    document.getElementById('close-modal-btn')?.addEventListener('click', _closeModal);
    modal.addEventListener('click', (e) => { if (e.target === modal) _closeModal(); });
    document.addEventListener('keydown', _escClose);

    /* پلیر modal */
    const playBtn = document.getElementById('modal-play-btn');
    if (playBtn) _bindModalPlayer(playBtn, msg.audioUrl);
  }

  function _closeModal() {
    const modal = document.getElementById('msg-detail-modal');
    if (modal) modal.style.display = 'none';
    document.body.style.overflow = '';
    document.removeEventListener('keydown', _escClose);
    /* توقف صوت */
    if (_audioPlaying) { _audioPlaying.pause(); _audioPlaying = null; }
  }

  function _escClose(e) { if (e.key === 'Escape') _closeModal(); }

  /* ── Audio Player ── */
  function _toggleAudio(url, msgId, btn) {
    /* اگر همین صوت در حال پخش است — توقف */
    if (_audioPlaying && _audioPlaying._msgId === msgId) {
      if (_audioPlaying.paused) { _audioPlaying.play(); btn.textContent = '⏸'; }
      else { _audioPlaying.pause(); btn.textContent = '▶'; }
      return;
    }
    /* توقف صوت قبلی */
    if (_audioPlaying) { _audioPlaying.pause(); _audioPlaying = null; }

    const audio = new Audio(url);
    audio._msgId = msgId;
    _audioPlaying = audio;
    btn.textContent = '⏸';

    audio.addEventListener('timeupdate', () => {
      const pct   = (audio.currentTime / audio.duration) * 100 || 0;
      const fill  = container.querySelector(`.audio-progress-fill[data-id="${msgId}"]`);
      const time  = container.querySelector(`.audio-time[data-id="${msgId}"]`);
      if (fill) fill.style.width = pct + '%';
      if (time) {
        const m = Math.floor(audio.currentTime / 60);
        const s = Math.floor(audio.currentTime % 60).toString().padStart(2, '0');
        time.textContent = `${m}:${s}`;
      }
    });

    audio.addEventListener('ended', () => { btn.textContent = '▶'; _audioPlaying = null; });
    audio.play().catch(() => { btn.textContent = '▶'; });
  }

  function _bindModalPlayer(btn, url) {
    const audio = new Audio(url);
    _audioPlaying = audio;
    let playing = false;

    audio.addEventListener('loadedmetadata', () => {
      const dur = document.getElementById('modal-duration');
      if (dur) {
        const m = Math.floor(audio.duration / 60);
        const s = Math.floor(audio.duration % 60).toString().padStart(2, '0');
        dur.textContent = `${m}:${s}`;
      }
    });

    audio.addEventListener('timeupdate', () => {
      const pct   = (audio.currentTime / audio.duration) * 100 || 0;
      const fill  = document.getElementById('modal-progress-fill');
      const cur   = document.getElementById('modal-current-time');
      if (fill) fill.style.width = pct + '%';
      if (cur) {
        const m = Math.floor(audio.currentTime / 60);
        const s = Math.floor(audio.currentTime % 60).toString().padStart(2, '0');
        cur.textContent = `${m}:${s}`;
      }
    });

    audio.addEventListener('ended', () => { btn.textContent = '▶'; playing = false; });

    btn.addEventListener('click', () => {
      if (playing) { audio.pause(); btn.textContent = '▶'; }
      else { audio.play(); btn.textContent = '⏸'; }
      playing = !playing;
    });

    /* Progress bar click */
    document.getElementById('modal-progress-bar')?.addEventListener('click', (e) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const pct  = (e.clientX - rect.left) / rect.width;
      audio.currentTime = pct * audio.duration;
    });
  }

  /* ── Time ago ── */
  function _timeAgo(dateStr) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    const hrs  = Math.floor(mins / 60);
    const days = Math.floor(hrs / 24);
    try {
      const rtf = new Intl.RelativeTimeFormat(i18n.config.locale, { numeric: 'auto' });
      if (days > 0)  return rtf.format(-days, 'day');
      if (hrs > 0)   return rtf.format(-hrs, 'hour');
      if (mins > 0)  return rtf.format(-mins, 'minute');
      return tx({fa:'همین الان',ar:'الآن',ur:'ابھی',az:'İndi',tr:'Şimdi',ru:'Только что',en:'Just now',id:'Baru saja'});
    } catch { return `${days} روز پیش`; }
  }

  /* اولین رندر */
  _render();

  /* آپدیت هنگام تغییر زبان */
  i18n.onChange(() => _render());
}
