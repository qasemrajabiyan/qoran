/**
 * ============================================================
 * FILE: pwa.js
 * ROLE: PWA Manager — نصب، آفلاین، نوتیفیکیشن، آپدیت
 * PROJECT: MediaHub — پلتفرم رسانه‌ای چندزبانه
 * VERSION: 1.0.0
 *
 * USAGE:
 *   import { PWA } from './pwa.js';
 *   const pwa = new PWA();
 *   pwa.init();
 * ============================================================
 */

import { i18n } from './i18n.js';

export class PWA {
  constructor() {
    this._deferredPrompt = null;   /* برای نصب */
    this._registration   = null;   /* Service Worker registration */
    this._isInstalled    = false;
  }

  /* ── Init همه چیز ── */
  async init() {
    this._detectInstalled();
    await this._registerSW();
    this._listenInstallPrompt();
    this._listenOnlineStatus();
    this._checkUpdate();
  }

  /* ── آیا نصب شده؟ ── */
  _detectInstalled() {
    this._isInstalled =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;
  }

  /* ── ثبت Service Worker ── */
  async _registerSW() {
    if (!('serviceWorker' in navigator)) return;
    try {
      this._registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });
      console.log('[PWA] Service Worker registered ✓');
    } catch (err) {
      console.warn('[PWA] SW registration failed:', err);
    }
  }

  /* ── گوش دادن به رویداد نصب ── */
  _listenInstallPrompt() {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this._deferredPrompt = e;

      /* نمایش بنر فقط اگر نصب نشده ── */
      if (!this._isInstalled) {
        setTimeout(() => this._showInstallBanner(), 3000);
      }
    });

    window.addEventListener('appinstalled', () => {
      this._isInstalled = true;
      this._deferredPrompt = null;
      this._hideInstallBanner();
      this._showToast('✓ ' + this._t('pwa.installed'));
      console.log('[PWA] App installed ✓');
    });
  }

  /* ── نمایش بنر نصب ── */
  _showInstallBanner() {
    let banner = document.getElementById('pwa-banner');
    if (!banner) {
      banner = document.createElement('div');
      banner.id = 'pwa-banner';
      banner.className = 'pwa-banner';
      banner.setAttribute('role', 'dialog');
      banner.setAttribute('aria-label', this._t('pwa.installTitle'));
      banner.innerHTML = `
        <div class="pwa-banner__icon" aria-hidden="true">
          <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="8" fill="white"/>
            <path d="M8 22V10l8 6 8-6v12" stroke="#2a9d8f" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <div class="pwa-banner__content">
          <div class="pwa-banner__title">${this._t('pwa.installTitle')}</div>
          <div class="pwa-banner__desc">${this._t('pwa.installDesc')}</div>
        </div>
        <div class="pwa-banner__actions">
          <button class="btn btn--primary btn--sm" id="pwa-install-btn">
            ${this._t('pwa.install')}
          </button>
          <button class="btn btn--ghost btn--sm" id="pwa-dismiss-btn" aria-label="بستن">✕</button>
        </div>
      `;
      document.body.appendChild(banner);

      document.getElementById('pwa-install-btn')?.addEventListener('click', () => this.install());
      document.getElementById('pwa-dismiss-btn')?.addEventListener('click', () => {
        this._hideInstallBanner();
        /* ۷ روز دیگر دوباره نشان بده */
        try { localStorage.setItem('pwa_dismissed', Date.now()); } catch {}
      });
    }

    /* بررسی اگر قبلاً dismiss شده */
    try {
      const dismissed = localStorage.getItem('pwa_dismissed');
      if (dismissed && Date.now() - Number(dismissed) < 7 * 24 * 60 * 60 * 1000) return;
    } catch {}

    requestAnimationFrame(() => banner.classList.add('pwa-banner--visible'));
  }

  _hideInstallBanner() {
    const banner = document.getElementById('pwa-banner');
    if (banner) {
      banner.classList.remove('pwa-banner--visible');
      setTimeout(() => banner.remove(), 400);
    }
  }

  /* ── نصب اپ ── */
  async install() {
    if (!this._deferredPrompt) return false;
    this._deferredPrompt.prompt();
    const { outcome } = await this._deferredPrompt.userChoice;
    this._deferredPrompt = null;
    return outcome === 'accepted';
  }

  /* ── آنلاین / آفلاین ── */
  _listenOnlineStatus() {
    const showOffline = () => this._showOfflineBadge(true);
    const showOnline  = () => {
      this._showOfflineBadge(false);
      this._showToast('🌐 ' + this._t('pwa.backOnline'));
    };

    window.addEventListener('offline', showOffline);
    window.addEventListener('online',  showOnline);

    if (!navigator.onLine) showOffline();
  }

  _showOfflineBadge(offline) {
    let badge = document.getElementById('offline-badge');
    if (offline) {
      if (!badge) {
        badge = document.createElement('div');
        badge.id = 'offline-badge';
        badge.setAttribute('role', 'status');
        badge.setAttribute('aria-live', 'polite');
        badge.style.cssText = `
          position: fixed;
          top: calc(var(--navbar-height) + 8px);
          inset-inline-end: 16px;
          background: var(--color-error);
          color: white;
          padding: 6px 14px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 600;
          z-index: 9999;
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
          animation: fadeIn 0.3s ease;
        `;
        badge.textContent = '📵 ' + this._t('pwa.offline');
        document.body.appendChild(badge);
      }
    } else {
      badge?.remove();
    }
  }

  /* ── بررسی آپدیت ── */
  _checkUpdate() {
    if (!this._registration) return;
    this._registration.addEventListener('updatefound', () => {
      const newWorker = this._registration.installing;
      newWorker?.addEventListener('statechange', () => {
        if (
          newWorker.state === 'installed' &&
          navigator.serviceWorker.controller
        ) {
          this._showUpdateBanner();
        }
      });
    });
  }

  _showUpdateBanner() {
    const banner = document.createElement('div');
    banner.style.cssText = `
      position: fixed;
      bottom: 80px;
      inset-inline-start: 50%;
      transform: translateX(-50%);
      background: var(--color-primary-600);
      color: white;
      padding: 12px 20px;
      border-radius: 999px;
      font-size: 14px;
      z-index: 9999;
      display: flex;
      align-items: center;
      gap: 12px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.25);
      animation: fadeIn 0.3s ease;
      white-space: nowrap;
    `;
    banner.innerHTML = `
      <span>${this._t('pwa.updateAvailable')}</span>
      <button style="
        background: white;
        color: var(--color-primary-700);
        border: none;
        padding: 4px 14px;
        border-radius: 999px;
        font-weight: 700;
        cursor: pointer;
        font-size: 13px;
      " id="pwa-update-btn">${this._t('pwa.update')}</button>
    `;
    document.body.appendChild(banner);
    document.getElementById('pwa-update-btn')?.addEventListener('click', () => {
      this._registration?.waiting?.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    });
  }

  /* ── Helper: ترجمه ── */
  _t(key) {
    const map = {
      'pwa.installTitle':   { fa: 'مدیاهاب را نصب کنید', ar: 'ثبّت تطبيق مدياهاب', ur: 'میڈیاہب انسٹال کریں', az: 'MediaHub-u quraşdırın', tr: 'MediaHub\'u Yükle', ru: 'Установить MediaHub', en: 'Install MediaHub' },
      'pwa.installDesc':    { fa: 'دسترسی سریع، کار آفلاین، بدون مرورگر', ar: 'وصول سريع وعمل دون إنترنت', ur: 'تیز رسائی، آف لائن کام', az: 'Sürətli giriş, oflayn iş', tr: 'Hızlı erişim, çevrimdışı çalışma', ru: 'Быстрый доступ, работа офлайн', en: 'Fast access, offline support' },
      'pwa.install':        { fa: 'نصب', ar: 'تثبيت', ur: 'انسٹال', az: 'Quraşdır', tr: 'Yükle', ru: 'Установить', en: 'Install' },
      'pwa.installed':      { fa: 'اپ با موفقیت نصب شد', ar: 'تم تثبيت التطبيق', ur: 'ایپ کامیابی سے انسٹال ہوئی', az: 'Proqram quraşdırıldı', tr: 'Uygulama yüklendi', ru: 'Приложение установлено', en: 'App installed successfully' },
      'pwa.offline':        { fa: 'آفلاین', ar: 'غير متصل', ur: 'آف لائن', az: 'Oflayn', tr: 'Çevrimdışı', ru: 'Офлайн', en: 'Offline' },
      'pwa.backOnline':     { fa: 'اتصال برقرار شد', ar: 'تم الاتصال', ur: 'کنکشن بحال ہوا', az: 'Bağlantı bərpa edildi', tr: 'Bağlantı yeniden kuruldu', ru: 'Соединение восстановлено', en: 'Back online' },
      'pwa.updateAvailable':{ fa: 'نسخه جدید موجود است', ar: 'تحديث متاح', ur: 'نیا ورژن دستیاب ہے', az: 'Yeni versiya mövcuddur', tr: 'Güncelleme mevcut', ru: 'Доступно обновление', en: 'Update available' },
      'pwa.update':         { fa: 'بروزرسانی', ar: 'تحديث', ur: 'اپ ڈیٹ', az: 'Yenilə', tr: 'Güncelle', ru: 'Обновить', en: 'Update' },
    };
    const lang = i18n.lang;
    return map[key]?.[lang] ?? map[key]?.['fa'] ?? key;
  }

  /* ── Helper: Toast ── */
  _showToast(msg) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.style.cssText = `
      pointer-events: all;
      background: var(--bg-surface);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 10px 16px;
      font-size: 13px;
      box-shadow: var(--shadow-lg);
      animation: fadeIn 0.3s ease;
      color: var(--text-primary);
    `;
    toast.textContent = msg;
    container.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 300); }, 3500);
  }
}

/* ── Singleton & Auto-init ── */
export const pwa = new PWA();
