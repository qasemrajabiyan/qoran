/**
 * ============================================================
 * FILE: audio-player.js
 * ROLE: پلیر صوت جهانی — سرعت ۱x/۱.۵x/۲x + کنترل فونت
 * PROJECT: MediaHub — پلتفرم رسانه‌ای کربلا
 * VERSION: 1.0.0
 * ============================================================
 */

/* ────────────────────────────────────────────────────────────
   1. FONT SIZE CONTROLLER (بزرگ/کوچک فونت — همه جا)
   ──────────────────────────────────────────────────────────── */
const FONT_KEY = 'mh_font_size';
const FONT_SIZES = [14, 16, 18, 20, 22];

export const FontController = {
  get() {
    return parseInt(localStorage.getItem(FONT_KEY) || '16');
  },
  set(size) {
    localStorage.setItem(FONT_KEY, String(size));
    document.documentElement.style.setProperty('--user-font-size', size + 'px');
    document.documentElement.style.fontSize = size + 'px';
  },
  increase() {
    const cur = this.get();
    const idx = FONT_SIZES.indexOf(cur);
    if (idx < FONT_SIZES.length - 1) this.set(FONT_SIZES[idx + 1]);
  },
  decrease() {
    const cur = this.get();
    const idx = FONT_SIZES.indexOf(cur);
    if (idx > 0) this.set(FONT_SIZES[idx - 1]);
  },
  init() {
    const saved = this.get();
    document.documentElement.style.setProperty('--user-font-size', saved + 'px');
    if (saved !== 16) document.documentElement.style.fontSize = saved + 'px';
  },
};

/* ────────────────────────────────────────────────────────────
   2. AUDIO PLAYER — پلیر حرفه‌ای با سرعت و پیشرفت
   ──────────────────────────────────────────────────────────── */
export class AudioPlayer {
  constructor(containerId, url, options = {}) {
    this.containerId = containerId;
    this.url         = url;
    this.audio       = null;
    this.speed       = 1;
    this.playing     = false;
    this.options     = {
      accentColor: options.accentColor || 'var(--color-primary-500)',
      label:       options.label || '',
      compact:     options.compact || false,
      speeds:      options.speeds || [1, 1.5, 2], /* قابلیت سفارشی‌سازی سرعت‌ها */
    };
  }

  render() {
    const container = document.getElementById(this.containerId);
    if (!container) return;

    container.innerHTML = `
      <div class="mh-audio-player" style="
        background:var(--bg-surface-2);
        border:1px solid var(--border-color);
        border-radius:var(--radius-lg);
        padding:${this.options.compact ? 'var(--space-3)' : 'var(--space-4) var(--space-5)'};
        direction:rtl;
      ">
        ${this.options.label ? `
          <div style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:var(--space-2);display:flex;align-items:center;gap:4px">
            <span>🎤</span> ${this.options.label}
          </div>
        ` : ''}

        <div style="display:flex;align-items:center;gap:var(--space-3)">

          <!-- دکمه play/pause -->
          <button id="${this.containerId}-play" style="
            width:${this.options.compact ? '36px' : '44px'};
            height:${this.options.compact ? '36px' : '44px'};
            border-radius:50%;
            background:${this.options.accentColor};
            color:white;border:none;cursor:pointer;
            font-size:${this.options.compact ? '14px' : '18px'};
            display:flex;align-items:center;justify-content:center;
            flex-shrink:0;transition:all 0.2s;
            box-shadow:0 2px 8px rgba(0,0,0,0.2);
          " aria-label="پخش / توقف">▶</button>

          <!-- progress و زمان -->
          <div style="flex:1;min-width:0">
            <div id="${this.containerId}-bar" style="
              height:5px;background:var(--border-color);
              border-radius:999px;overflow:hidden;cursor:pointer;
              margin-bottom:4px;
            ">
              <div id="${this.containerId}-fill" style="
                height:100%;width:0%;
                background:${this.options.accentColor};
                border-radius:999px;transition:width 0.1s linear;
              "></div>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:10px;color:var(--text-muted);font-family:'JetBrains Mono',monospace">
              <span id="${this.containerId}-cur">0:00</span>
              <span id="${this.containerId}-dur">--:--</span>
            </div>
          </div>

          <!-- سرعت -->
          <div style="display:flex;gap:3px;flex-shrink:0">
            ${[1, 1.5, 2].map(s => `
              <button class="${this.containerId}-speed" data-speed="${s}" style="
                padding:3px 7px;border-radius:var(--radius-sm);
                border:1.5px solid ${s === 1 ? this.options.accentColor : 'var(--border-color)'};
                background:${s === 1 ? this.options.accentColor + '15' : 'transparent'};
                color:${s === 1 ? this.options.accentColor : 'var(--text-muted)'};
                font-size:11px;font-weight:700;cursor:pointer;
                font-family:'JetBrains Mono',monospace;
                transition:all 0.15s;
              " aria-label="سرعت ${s}x">${s}x</button>
            `).join('')}
          </div>

        </div>
      </div>
    `;

    this._bindEvents();
    this._initAudio();
  }

  _initAudio() {
    this.audio = new Audio(this.url);
    this.audio.playbackRate = this.speed;

    this.audio.addEventListener('loadedmetadata', () => {
      const dur = document.getElementById(`${this.containerId}-dur`);
      if (dur) dur.textContent = this._formatTime(this.audio.duration);
    });

    this.audio.addEventListener('timeupdate', () => {
      const pct  = (this.audio.currentTime / this.audio.duration) * 100 || 0;
      const fill = document.getElementById(`${this.containerId}-fill`);
      const cur  = document.getElementById(`${this.containerId}-cur`);
      if (fill) fill.style.width = pct + '%';
      if (cur)  cur.textContent  = this._formatTime(this.audio.currentTime);
    });

    this.audio.addEventListener('ended', () => {
      this.playing = false;
      const btn = document.getElementById(`${this.containerId}-play`);
      if (btn) btn.textContent = '▶';
      if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'paused';
    });
  }

  _setupMediaSession() {
    if (!('mediaSession' in navigator)) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title:  this.options.label || 'MediaHub کربلا',
      artist: 'دانشگاه قرآن — MediaHub',
      album:  'پلتفرم رسانه‌ای کربلا',
    });
    navigator.mediaSession.setActionHandler('play',  () => { this.audio?.play(); });
    navigator.mediaSession.setActionHandler('pause', () => { this.audio?.pause(); });
    navigator.mediaSession.setActionHandler('seekbackward', () => {
      if (this.audio) this.audio.currentTime = Math.max(0, this.audio.currentTime - 10);
    });
    navigator.mediaSession.setActionHandler('seekforward', () => {
      if (this.audio) this.audio.currentTime = Math.min(this.audio.duration, this.audio.currentTime + 10);
    });
  }

  _bindEvents() {
    /* play/pause */
    document.getElementById(`${this.containerId}-play`)?.addEventListener('click', () => {
      if (this.playing) {
        this.audio?.pause();
        this.playing = false;
        const btn = document.getElementById(`${this.containerId}-play`);
        if (btn) btn.textContent = '▶';
        if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'paused';
      } else {
        this.audio?.play();
        this.playing = true;
        const btn = document.getElementById(`${this.containerId}-play`);
        if (btn) btn.textContent = '⏸';
        this._setupMediaSession();
        if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'playing';
      }
    });

    /* progress bar click */
    document.getElementById(`${this.containerId}-bar`)?.addEventListener('click', (e) => {
      if (!this.audio?.duration) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const pct  = (e.clientX - rect.left) / rect.width;
      this.audio.currentTime = pct * this.audio.duration;
    });

    /* سرعت */
    document.querySelectorAll(`.${this.containerId}-speed`).forEach(btn => {
      btn.addEventListener('click', () => {
        this.speed = parseFloat(btn.dataset.speed);
        if (this.audio) this.audio.playbackRate = this.speed;

        /* آپدیت استایل دکمه‌ها */
        document.querySelectorAll(`.${this.containerId}-speed`).forEach(b => {
          const isActive = parseFloat(b.dataset.speed) === this.speed;
          b.style.borderColor = isActive ? this.options.accentColor : 'var(--border-color)';
          b.style.background  = isActive ? this.options.accentColor + '15' : 'transparent';
          b.style.color       = isActive ? this.options.accentColor : 'var(--text-muted)';
        });
      });
    });
  }

  _formatTime(secs) {
    if (!secs || isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  destroy() {
    this.audio?.pause();
    this.audio = null;
  }
}

/* ────────────────────────────────────────────────────────────
   3. FONT CONTROL BAR — نوار بزرگ/کوچک فونت
   برای نمایش در navbar یا هر جایی
   ──────────────────────────────────────────────────────────── */
export function renderFontControlBar(container) {
  if (!container) return;

  container.innerHTML = `
    <div style="
      display:flex;align-items:center;gap:var(--space-2);
      background:var(--bg-surface-2);
      border:1px solid var(--border-color);
      border-radius:var(--radius-full);
      padding:4px 10px;
    " role="group" aria-label="اندازه فونت">
      <button id="font-decrease" style="
        width:28px;height:28px;border-radius:50%;border:none;
        background:transparent;cursor:pointer;font-size:14px;
        color:var(--text-muted);display:flex;align-items:center;justify-content:center;
        transition:all 0.15s;
      " aria-label="کوچک‌تر">A-</button>
      <span id="font-size-label" style="
        font-size:11px;color:var(--text-muted);min-width:28px;text-align:center;
        font-family:'JetBrains Mono',monospace;
      ">${FontController.get()}px</span>
      <button id="font-increase" style="
        width:28px;height:28px;border-radius:50%;border:none;
        background:transparent;cursor:pointer;font-size:18px;
        color:var(--text-muted);display:flex;align-items:center;justify-content:center;
        transition:all 0.15s;
      " aria-label="بزرگ‌تر">A+</button>
    </div>
  `;

  document.getElementById('font-decrease')?.addEventListener('click', () => {
    FontController.decrease();
    const label = document.getElementById('font-size-label');
    if (label) label.textContent = FontController.get() + 'px';
  });

  document.getElementById('font-increase')?.addEventListener('click', () => {
    FontController.increase();
    const label = document.getElementById('font-size-label');
    if (label) label.textContent = FontController.get() + 'px';
  });
}

/* ────────────────────────────────────────────────────────────
   4. HELPER — ساخت پلیر ساده برای هر صفحه
   ──────────────────────────────────────────────────────────── */
export function createSimplePlayer(url, options = {}) {
  const id = 'player_' + Math.random().toString(36).slice(2, 7);
  const div = document.createElement('div');
  div.id = id;
  const player = new AudioPlayer(id, url, options);
  return { element: div, player };
}

/* ────────────────────────────────────────────────────────────
   5. AUTO INIT
   ──────────────────────────────────────────────────────────── */
export function initAudioSystem() {
  FontController.init();
}
