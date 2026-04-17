/**
 * ============================================================
 * FILE: notifications.js
 * ROLE: سیستم Push Notification کامل
 *       سایت + PWA + APK — صدا، ویبره، badge، بنر موبایل
 * PROJECT: MediaHub — پلتفرم رسانه‌ای کربلا
 * VERSION: 1.0.0
 *
 * نحوه کار:
 *   - داخل سایت: فوری، بدون سرور
 *   - Push روی موبایل: نیاز به Firebase (رایگان)
 *   - Badge روی آرم: PWA + APK
 *   - صدا و ویبره: قابل تنظیم توسط کاربر
 * ============================================================
 */

import { i18n } from './i18n.js';
import { AuthState } from './auth.js';

/* ────────────────────────────────────────────────────────────
   1. NOTIFICATION SETTINGS (تنظیمات کاربر)
   ──────────────────────────────────────────────────────────── */
const SETTINGS_KEY = 'mh_notif_settings';

export const NotifSettings = {
  get() {
    try {
      return JSON.parse(localStorage.getItem(SETTINGS_KEY) || 'null') || {
        sound:    true,   /* صدا */
        vibrate:  true,   /* ویبره */
        enabled:  true,   /* کلاً فعال */
        mode:     'sound', /* 'sound' | 'vibrate' | 'silent' */
      };
    } catch {
      return { sound: true, vibrate: true, enabled: true, mode: 'sound' };
    }
  },

  set(settings) {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch {}
  },

  update(key, value) {
    const s = this.get();
    s[key] = value;
    this.set(s);
  },
};

/* ────────────────────────────────────────────────────────────
   2. NOTIFICATION SOUND ENGINE
   صدای اعلان با Web Audio API — بدون فایل خارجی
   ──────────────────────────────────────────────────────────── */
let _audioCtx = null;

function _getAudioCtx() {
  if (!_audioCtx) {
    _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return _audioCtx;
}

export function playNotifSound(type = 'default') {
  const settings = NotifSettings.get();
  if (!settings.enabled || settings.mode === 'silent') return;
  if (!settings.sound && settings.mode !== 'sound') return;

  try {
    const ctx = _getAudioCtx();

    /* انواع صدا */
    const sounds = {
      default: [
        { freq: 880, dur: 0.1, start: 0 },
        { freq: 1100, dur: 0.15, start: 0.12 },
      ],
      prize: [
        { freq: 523, dur: 0.1, start: 0 },
        { freq: 659, dur: 0.1, start: 0.1 },
        { freq: 784, dur: 0.1, start: 0.2 },
        { freq: 1047, dur: 0.2, start: 0.3 },
      ],
      prayer: [
        { freq: 440, dur: 0.2, start: 0 },
        { freq: 550, dur: 0.2, start: 0.22 },
      ],
      message: [
        { freq: 660, dur: 0.08, start: 0 },
        { freq: 880, dur: 0.08, start: 0.1 },
      ],
    };

    const notes = sounds[type] ?? sounds.default;

    notes.forEach(({ freq, dur, start }) => {
      const osc    = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.type      = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
      gainNode.gain.setValueAtTime(0.3, ctx.currentTime + start);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur);

      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + dur + 0.05);
    });
  } catch { /* AudioContext ممکن است در برخی مرورگرها محدود باشد */ }
}

/* ────────────────────────────────────────────────────────────
   3. VIBRATION
   ──────────────────────────────────────────────────────────── */
function _vibrate(pattern = [100, 50, 100]) {
  const settings = NotifSettings.get();
  if (!settings.enabled) return;
  if (settings.mode === 'vibrate' || settings.mode === 'sound') {
    navigator.vibrate?.(pattern);
  }
}

/* ────────────────────────────────────────────────────────────
   4. BADGE (عدد روی آرم برنامه)
   ──────────────────────────────────────────────────────────── */
let _badgeCount = 0;

export async function setBadge(count) {
  _badgeCount = count;

  /* Badging API — PWA و APK */
  if ('setAppBadge' in navigator) {
    try {
      if (count > 0) await navigator.setAppBadge(count);
      else           await navigator.clearAppBadge();
    } catch {}
  }

  /* آپدیت title صفحه */
  const baseTitle = document.title.replace(/^\(\d+\)\s/, '');
  document.title  = count > 0 ? `(${count}) ${baseTitle}` : baseTitle;

  /* آپدیت UI داخل سایت */
  _updateBadgeUI(count);
}

export async function incrementBadge() {
  await setBadge(_badgeCount + 1);
}

export async function clearBadge() {
  await setBadge(0);
}

function _updateBadgeUI(count) {
  /* آپدیت badge در navbar */
  const badge = document.getElementById('notif-badge');
  if (badge) {
    badge.textContent = count > 99 ? '99+' : String(count);
    badge.style.display = count > 0 ? 'flex' : 'none';
  }
}

/* ────────────────────────────────────────────────────────────
   5. IN-APP NOTIFICATION (داخل سایت)
   ──────────────────────────────────────────────────────────── */
export function showInAppNotif(options) {
  const {
    title,
    body,
    icon    = '🔔',
    type    = 'default',
    onClick = null,
    duration = 5000,
  } = options;

  /* صدا و ویبره */
  playNotifSound(type);
  _vibrate();

  /* ساخت notification */
  const container = document.getElementById('notif-tray') || document.body;
  const el        = document.createElement('div');
  el.setAttribute('role', 'alert');
  el.setAttribute('aria-live', 'polite');
  el.style.cssText = `
    position: fixed;
    top: calc(var(--navbar-height, 64px) + 12px);
    inset-inline-end: 16px;
    max-width: 360px;
    width: calc(100vw - 32px);
    background: var(--bg-surface);
    border: 1px solid var(--border-color);
    border-radius: 14px;
    padding: 14px 16px;
    display: flex;
    align-items: flex-start;
    gap: 12px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.18);
    z-index: 99999;
    cursor: ${onClick ? 'pointer' : 'default'};
    animation: slideInRight 0.35s cubic-bezier(0.34,1.56,0.64,1);
    border-inline-start: 4px solid var(--color-primary-500);
    font-family: var(--font-rtl-body);
    direction: ${i18n.dir};
  `;

  el.innerHTML = `
    <span style="font-size:24px;flex-shrink:0;line-height:1" aria-hidden="true">${icon}</span>
    <div style="flex:1;min-width:0">
      <div style="font-weight:700;font-size:0.9rem;color:var(--text-primary);margin-bottom:3px;
        overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${title}</div>
      <div style="font-size:0.82rem;color:var(--text-secondary);line-height:1.5;
        display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${body}</div>
    </div>
    <button style="background:none;border:none;cursor:pointer;color:var(--text-muted);
      padding:2px;font-size:16px;flex-shrink:0;line-height:1" aria-label="بستن">✕</button>
  `;

  /* رویدادها */
  if (onClick) el.addEventListener('click', (e) => {
    if (e.target.tagName !== 'BUTTON') { onClick(); el.remove(); }
  });

  el.querySelector('button')?.addEventListener('click', () => {
    el.style.opacity    = '0';
    el.style.transition = 'opacity 0.2s';
    setTimeout(() => el.remove(), 200);
  });

  container.appendChild(el);

  /* حذف خودکار */
  setTimeout(() => {
    el.style.opacity    = '0';
    el.style.transition = 'opacity 0.3s';
    setTimeout(() => el.remove(), 300);
  }, duration);

  /* badge */
  incrementBadge();
}

/* ────────────────────────────────────────────────────────────
   6. FIREBASE PUSH NOTIFICATION
   ──────────────────────────────────────────────────────────── */
const FIREBASE_CONFIG_KEY = 'mh_firebase_config';
const FCM_TOKEN_KEY        = 'mh_fcm_token';

export const FirebasePush = {

  /* تنظیمات Firebase از داشبورد ادمین */
  getConfig() {
    try {
      return JSON.parse(localStorage.getItem(FIREBASE_CONFIG_KEY) || 'null');
    } catch { return null; }
  },

  setConfig(config) {
    try {
      localStorage.setItem(FIREBASE_CONFIG_KEY, JSON.stringify(config));
    } catch {}
  },

  /* درخواست مجوز و ثبت */
  async requestPermission() {
    if (!('Notification' in window)) {
      console.warn('[Push] Notifications not supported');
      return false;
    }

    const perm = await Notification.requestPermission();
    if (perm !== 'granted') return false;

    /* ثبت Service Worker */
    if ('serviceWorker' in navigator) {
      try {
        const reg = await navigator.serviceWorker.ready;
        console.log('[Push] SW ready:', reg);
        return true;
      } catch (err) {
        console.error('[Push] SW error:', err);
        return false;
      }
    }
    return false;
  },

  /* ارسال push از سرور (در production — backend) */
  async sendToUser(userId, payload) {
    /*
      در production این تابع روی سرور اجرا می‌شود:
      - سرور FCM Token کاربر را از دیتابیس می‌گیرد
      - پیام را به Firebase می‌فرستد
      - Firebase به موبایل کاربر می‌فرستد

      payload: {
        title: 'عنوان',
        body: 'متن پیام',
        icon: '/assets/img/icon-192.png',
        url: '/profile.html',
        tag: 'mediahub-msg',
        data: { type: 'prayer', orderId: '...' }
      }
    */
    console.log(`[Push] Would send to ${userId}:`, payload);
    /* فعلاً in-app نمایش داده می‌شود */
    showInAppNotif({
      title:   payload.title,
      body:    payload.body,
      icon:    payload.icon ?? '🔔',
      type:    payload.data?.type ?? 'default',
      onClick: () => { if (payload.url) window.location.href = payload.url; },
    });
  },

  /* ارسال به همه کاربران */
  async sendToAll(payload) {
    console.log('[Push] Broadcast:', payload);
    showInAppNotif({
      title: payload.title,
      body:  payload.body,
      icon:  payload.icon ?? '📢',
      type:  'message',
    });
  },
};

/* ────────────────────────────────────────────────────────────
   7. NOTIFICATION CENTER (مرکز اعلان‌ها)
   ──────────────────────────────────────────────────────────── */
export const NotifCenter = {

  /* ذخیره اعلان */
  save(notif) {
    try {
      const list = this.getAll();
      list.unshift({
        ...notif,
        id:     notif.id ?? ('n_' + Date.now()),
        read:   false,
        time:   notif.time ?? new Date().toISOString(),
      });
      /* حداکثر ۱۰۰ اعلان */
      if (list.length > 100) list.splice(100);
      localStorage.setItem('mh_notifications', JSON.stringify(list));
      setBadge(this.unreadCount());
    } catch {}
  },

  getAll() {
    try { return JSON.parse(localStorage.getItem('mh_notifications') || '[]'); }
    catch { return []; }
  },

  unreadCount() {
    return this.getAll().filter(n => !n.read).length;
  },

  markRead(id) {
    try {
      const list = this.getAll();
      const idx  = list.findIndex(n => n.id === id);
      if (idx !== -1) list[idx].read = true;
      localStorage.setItem('mh_notifications', JSON.stringify(list));
      setBadge(this.unreadCount());
    } catch {}
  },

  markAllRead() {
    try {
      const list = this.getAll().map(n => ({ ...n, read: true }));
      localStorage.setItem('mh_notifications', JSON.stringify(list));
      clearBadge();
    } catch {}
  },

  /* ارسال اعلان کامل (ذخیره + نمایش + صدا) */
  async send(notif) {
    /* ذخیره */
    this.save(notif);

    /* نمایش in-app */
    const lang = i18n.lang;
    const title = notif.title?.[lang] ?? notif.title?.fa ?? notif.title ?? '';
    const body  = notif.text?.[lang]  ?? notif.text?.fa  ?? notif.text  ?? '';

    showInAppNotif({
      title,
      body,
      icon:    notif.icon ?? '🔔',
      type:    notif.type ?? 'default',
      onClick: notif.url
        ? () => window.location.href = notif.url
        : null,
    });

    /* Push Notification (اگر مجوز داشت) */
    if (Notification.permission === 'granted') {
      try {
        const reg = await navigator.serviceWorker.ready;
        await reg.showNotification(title, {
          body,
          icon:    '/assets/img/icon-192.png',
          badge:   '/assets/img/icon-192.png',
          tag:     notif.id ?? 'mediahub',
          vibrate: [100, 50, 100],
          data:    { url: notif.url ?? '/' },
        });
      } catch {}
    }
  },
};

/* ────────────────────────────────────────────────────────────
   8. NOTIFICATION SETTINGS UI (در پروفایل کاربر)
   ──────────────────────────────────────────────────────────── */
export function renderNotifSettingsPanel() {
  const settings = NotifSettings.get();

  const COPY = {
    title:   { fa:'تنظیمات اعلان', ar:'إعدادات الإشعارات', ur:'نوٹیفکیشن سیٹنگز', az:'Bildiriş parametrləri', tr:'Bildirim Ayarları', ru:'Настройки уведомлений', en:'Notification Settings' },
    enable:  { fa:'دریافت اعلان', ar:'تلقّي الإشعارات', ur:'اطلاعات وصول کریں', az:'Bildirişlər alın', tr:'Bildirimleri Al', ru:'Получать уведомления', en:'Receive Notifications' },
    sound:   { fa:'صدای زنگ', ar:'صوت التنبيه', ur:'زنگ کی آواز', az:'Zəng səsi', tr:'Zil Sesi', ru:'Звук уведомления', en:'Notification Sound' },
    vibrate: { fa:'ویبره', ar:'الاهتزاز', ur:'وائبریشن', az:'Vibrasiya', tr:'Titreşim', ru:'Вибрация', en:'Vibration' },
    mode:    { fa:'حالت اعلان', ar:'وضع الإشعار', ur:'نوٹیفکیشن موڈ', az:'Bildiriş rejimi', tr:'Bildirim Modu', ru:'Режим уведомления', en:'Notification Mode' },
    modeSound:   { fa:'صدا', ar:'صوت', ur:'آواز', az:'Səs', tr:'Ses', ru:'Звук', en:'Sound' },
    modeVibrate: { fa:'ویبره', ar:'اهتزاز', ur:'وائبریشن', az:'Vibrasiya', tr:'Titreşim', ru:'Вибрация', en:'Vibrate' },
    modeSilent:  { fa:'بی‌صدا', ar:'صامت', ur:'خاموش', az:'Səssiz', tr:'Sessiz', ru:'Беззвучно', en:'Silent' },
    testBtn: { fa:'تست صدا', ar:'اختبار الصوت', ur:'آواز ٹیسٹ', az:'Səs testi', tr:'Ses Testi', ru:'Тест звука', en:'Test Sound' },
    allowPush: { fa:'اجازه اعلان موبایل', ar:'السماح بإشعارات الجوال', ur:'موبائل نوٹیفکیشن اجازت', az:'Mobil bildirişlərə icazə', tr:'Mobil Bildirimlere İzin Ver', ru:'Разрешить push-уведомления', en:'Allow Mobile Push' },
  };

  const tx = (obj) => obj?.[i18n.lang] ?? obj?.fa ?? obj?.en ?? '';

  return `
    <div class="profile-panel">
      <div class="profile-panel__header">
        <span aria-hidden="true">🔔</span>
        <h2 class="profile-panel__title">${tx(COPY.title)}</h2>
      </div>
      <div class="profile-panel__body" style="display:flex;flex-direction:column;gap:var(--space-5)">

        <!-- فعال/غیرفعال کلی -->
        <label class="admin-toggle" for="notif-enabled">
          <input type="checkbox" id="notif-enabled" ${settings.enabled ? 'checked' : ''}/>
          <div class="admin-toggle__track"><div class="admin-toggle__thumb"></div></div>
          <span class="admin-toggle__label">${tx(COPY.enable)}</span>
        </label>

        <!-- حالت اعلان -->
        <div>
          <div style="font-size:var(--text-sm);font-weight:var(--weight-semibold);
            color:var(--text-primary);margin-bottom:var(--space-3)">${tx(COPY.mode)}</div>
          <div style="display:flex;gap:var(--space-3);flex-wrap:wrap" role="radiogroup" aria-label="${tx(COPY.mode)}">
            ${[
              { val:'sound',   label: COPY.modeSound,   icon:'🔊' },
              { val:'vibrate', label: COPY.modeVibrate, icon:'📳' },
              { val:'silent',  label: COPY.modeSilent,  icon:'🔕' },
            ].map(m => `
              <label style="
                display:flex;align-items:center;gap:var(--space-2);
                padding:var(--space-3) var(--space-4);
                border:2px solid ${settings.mode===m.val?'var(--color-primary-500)':'var(--border-color)'};
                border-radius:var(--radius-lg);cursor:pointer;
                background:${settings.mode===m.val?'var(--color-primary-50)':'var(--bg-surface)'};
                transition:all 0.2s;font-size:var(--text-sm);
              ">
                <input type="radio" name="notif-mode" value="${m.val}"
                  ${settings.mode===m.val?'checked':''} style="display:none"/>
                <span aria-hidden="true">${m.icon}</span>
                <span>${tx(m.label)}</span>
              </label>
            `).join('')}
          </div>
        </div>

        <!-- تست صدا -->
        <div style="display:flex;gap:var(--space-3);flex-wrap:wrap">
          <button class="btn btn--outline btn--sm" id="test-sound-btn" type="button">
            🔊 ${tx(COPY.testBtn)}
          </button>
          <button class="btn btn--primary btn--sm" id="allow-push-btn" type="button">
            📱 ${tx(COPY.allowPush)}
          </button>
        </div>

      </div>
    </div>
  `;
}

/* ── bind events ── */
export function bindNotifSettingsEvents(container) {
  /* فعال/غیرفعال */
  container.querySelector('#notif-enabled')?.addEventListener('change', (e) => {
    NotifSettings.update('enabled', e.target.checked);
  });

  /* حالت */
  container.querySelectorAll('input[name="notif-mode"]').forEach(radio => {
    radio.addEventListener('change', () => {
      NotifSettings.update('mode', radio.value);
      /* آپدیت UI */
      container.querySelectorAll('input[name="notif-mode"]').forEach(r => {
        const label = r.closest('label');
        if (label) {
          label.style.borderColor = r.checked ? 'var(--color-primary-500)' : 'var(--border-color)';
          label.style.background  = r.checked ? 'var(--color-primary-50)'  : 'var(--bg-surface)';
        }
      });
    });
  });

  /* تست صدا */
  container.querySelector('#test-sound-btn')?.addEventListener('click', () => {
    playNotifSound('prize');
  });

  /* درخواست مجوز push */
  container.querySelector('#allow-push-btn')?.addEventListener('click', async () => {
    const btn     = container.querySelector('#allow-push-btn');
    const granted = await FirebasePush.requestPermission();
    if (btn) {
      btn.textContent = granted ? '✓ مجوز داده شد' : '✕ مجوز رد شد';
      btn.style.background = granted ? '#16a34a' : '#e63946';
    }
  });
}

/* ────────────────────────────────────────────────────────────
   9. FIREBASE SETTINGS در داشبورد ادمین
   ──────────────────────────────────────────────────────────── */
export function renderFirebaseAdminPanel() {
  const config = FirebasePush.getConfig();

  return `
    <div class="admin-panel">
      <div class="admin-panel__header">
        <div class="admin-panel__title">🔥 تنظیمات Firebase Push</div>
        <span class="admin-badge admin-badge--${config ? 'active' : 'draft'}">
          ${config ? '✓ تنظیم شده' : 'تنظیم نشده'}
        </span>
      </div>
      <div class="admin-panel__body">

        <div style="
          background:rgba(59,130,246,0.08);
          border:1px solid rgba(59,130,246,0.2);
          border-radius:var(--radius-md);
          padding:var(--space-4);
          margin-bottom:var(--space-5);
          font-size:var(--text-sm);
          color:var(--text-secondary);
          display:flex;gap:var(--space-3);align-items:flex-start;
        ">
          <span style="font-size:20px">ℹ️</span>
          <div>
            برای فعال‌سازی Push Notification روی موبایل و کامپیوتر کاربران،
            باید در <strong>firebase.google.com</strong> یک پروژه رایگان بسازید و کلیدها را اینجا وارد کنید.
            تا ماهیانه ۵۰۰,۰۰۰ پیام رایگان است.
          </div>
        </div>

        <div class="grid grid--2" style="gap:var(--space-4)">
          <div class="admin-field">
            <label class="admin-label" for="fb-api-key">API Key</label>
            <input type="password" class="admin-input" id="fb-api-key"
              value="${config?.apiKey ?? ''}" dir="ltr" autocomplete="off"
              placeholder="AIzaSy..."/>
          </div>
          <div class="admin-field">
            <label class="admin-label" for="fb-project-id">Project ID</label>
            <input type="text" class="admin-input" id="fb-project-id"
              value="${config?.projectId ?? ''}" dir="ltr"
              placeholder="mediahub-xxxxx"/>
          </div>
          <div class="admin-field">
            <label class="admin-label" for="fb-messaging-id">Messaging Sender ID</label>
            <input type="text" class="admin-input" id="fb-messaging-id"
              value="${config?.messagingSenderId ?? ''}" dir="ltr"
              placeholder="123456789"/>
          </div>
          <div class="admin-field">
            <label class="admin-label" for="fb-vapid-key">VAPID Key</label>
            <input type="password" class="admin-input" id="fb-vapid-key"
              value="${config?.vapidKey ?? ''}" dir="ltr" autocomplete="off"
              placeholder="BK..."/>
          </div>
        </div>

        <!-- ارسال پیام تست -->
        <div class="admin-field" style="margin-top:var(--space-4)">
          <label class="admin-label" for="test-push-msg">ارسال پیام تست به همه کاربران</label>
          <div style="display:flex;gap:var(--space-3)">
            <input type="text" class="admin-input" id="test-push-msg"
              placeholder="متن پیام تست..." style="flex:1"/>
            <button class="btn btn--outline btn--sm" id="send-test-push" type="button">
              📤 ارسال
            </button>
          </div>
        </div>

        <div style="display:flex;gap:var(--space-3);margin-top:var(--space-4)">
          <button class="btn btn--primary" id="save-firebase-btn" type="button">
            💾 ذخیره تنظیمات Firebase
          </button>
          <a href="https://firebase.google.com" target="_blank" rel="noopener"
            class="btn btn--outline btn--sm">
            راهنمای Firebase ↗
          </a>
        </div>

      </div>
    </div>
  `;
}

export function bindFirebaseAdminEvents(container) {
  container.querySelector('#save-firebase-btn')?.addEventListener('click', () => {
    FirebasePush.setConfig({
      apiKey:            document.getElementById('fb-api-key')?.value,
      projectId:         document.getElementById('fb-project-id')?.value,
      messagingSenderId: document.getElementById('fb-messaging-id')?.value,
      vapidKey:          document.getElementById('fb-vapid-key')?.value,
    });
    const t = document.createElement('div');
    t.setAttribute('role','alert');
    t.style.cssText='position:fixed;bottom:24px;inset-inline-end:24px;background:#16a34a;color:white;padding:12px 20px;border-radius:8px;font-size:14px;font-weight:600;z-index:9999';
    t.textContent = '✓ تنظیمات Firebase ذخیره شد';
    document.body.appendChild(t);
    setTimeout(()=>t.remove(),2500);
  });

  container.querySelector('#send-test-push')?.addEventListener('click', () => {
    const msg = document.getElementById('test-push-msg')?.value?.trim();
    if (!msg) return;
    FirebasePush.sendToAll({
      title: 'پیام از مدیاهاب',
      body:  msg,
      icon:  '📢',
    });
    document.getElementById('test-push-msg').value = '';
  });
}

/* ────────────────────────────────────────────────────────────
   10. AUTO INIT — شروع خودکار هنگام لود صفحه
   ──────────────────────────────────────────────────────────── */
export async function initNotifications() {
  /* بارگذاری تعداد خوانده‌نشده */
  const count = NotifCenter.unreadCount();
  await setBadge(count);

  /* گوش دادن به پیام‌های Service Worker */
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data?.type === 'NEW_NOTIFICATION') {
        NotifCenter.send(event.data.payload);
      }
    });
  }

  /* آپدیت badge هر ۳۰ ثانیه */
  setInterval(() => {
    const c = NotifCenter.unreadCount();
    setBadge(c);
  }, 30000);
}
