/**
 * ============================================================
 * FILE: theme.js
 * ROLE: Theme Manager — Dark / Light Mode Toggle
 * PROJECT: MediaHub — پلتفرم رسانه‌ای چندزبانه
 * VERSION: 1.0.0
 *
 * USAGE:
 *   import { Theme } from './theme.js';
 *   const theme = new Theme();
 *   theme.toggle();          // تغییر بین dark/light
 *   theme.set('dark');       // تنظیم مستقیم
 *   theme.current            // 'dark' | 'light'
 *
 * این فایل مستقل است و به هیچ کتابخانه خارجی نیاز ندارد.
 * ============================================================
 */

export class Theme {
  constructor(options = {}) {
    this._storageKey  = options.storageKey  ?? 'mediahub_theme';
    this._attribute   = options.attribute   ?? 'data-theme';
    this._target      = options.target      ?? document.documentElement;
    this._listeners   = [];
    this._current     = this._detect();
  }

  /* ── Current theme ── */
  get current() { return this._current; }
  get isDark()  { return this._current === 'dark'; }
  get isLight() { return this._current === 'light'; }

  /* ── Detect theme: localStorage → system → default ── */
  _detect() {
    try {
      const stored = localStorage.getItem(this._storageKey);
      if (stored === 'dark' || stored === 'light') return stored;
    } catch {}

    /* System preference */
    if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  }

  /* ── Apply theme to DOM ── */
  _apply(theme) {
    this._target.setAttribute(this._attribute, theme);
    this._target.classList.remove('theme-dark', 'theme-light');
    this._target.classList.add(`theme-${theme}`);

    /* Meta theme-color برای مرورگرهای موبایل */
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.content = theme === 'dark' ? '#100d0a' : '#faf9f7';
    }
  }

  /* ── Set specific theme ── */
  set(theme) {
    if (theme !== 'dark' && theme !== 'light') return;
    const prev = this._current;
    this._current = theme;
    this._apply(theme);

    try { localStorage.setItem(this._storageKey, theme); } catch {}

    this._listeners.forEach(fn => fn(theme, prev));
  }

  /* ── Toggle between dark/light ── */
  toggle() {
    this.set(this._current === 'dark' ? 'light' : 'dark');
  }

  /* ── Subscribe to changes ── */
  onChange(fn) {
    this._listeners.push(fn);
    return () => { this._listeners = this._listeners.filter(f => f !== fn); };
  }

  /* ── Watch system preference changes ── */
  watchSystem() {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', (e) => {
      /* فقط اگر کاربر خودش تنظیم نکرده باشد */
      try {
        if (!localStorage.getItem(this._storageKey)) {
          this.set(e.matches ? 'dark' : 'light');
        }
      } catch {
        this.set(e.matches ? 'dark' : 'light');
      }
    });
  }

  /* ── Init: detect + apply + watch ── */
  init() {
    this._apply(this._current);
    this.watchSystem();
    return this;
  }

  /* ── Bind a toggle button ── */
  bindToggleBtn(btn) {
    if (!btn) return;
    const update = () => {
      btn.setAttribute('aria-pressed', String(this.isDark));
      btn.setAttribute('aria-label', this.isDark ? 'Switch to light mode' : 'Switch to dark mode');
      btn.dataset.theme = this._current;
    };
    btn.addEventListener('click', () => this.toggle());
    this.onChange(update);
    update();
  }
}

/* ── Singleton ── */
export const theme = new Theme().init();
