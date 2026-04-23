/**
 * ============================================================
 * FILE: assets/js/pwa.js
 * PROJECT: BarakatHub — پلتفرم رسانه‌ای چندزبانه
 * VERSION: 2.0.0  (2026-ready)
 * ============================================================
 *
 *  ① Service Worker registration + auto-update
 *  ② Install Banner  (beforeinstallprompt + iOS Safari fallback)
 *  ③ Update Banner   (وقتی نسخه جدید SW آماده‌ست)
 *  ④ Network Monitor (آنلاین / آفلاین Toast + pill)
 *  ⑤ Analytics hooks (GA4 + Plausible ready)
 *  ⑥ تمام استایل‌ها inline — بدون نیاز به CSS جداگانه
 * ============================================================
 */

/* ── CONFIG ── */
const CFG = {
  swPath:         '/sw.js',
  swScope:        '/',
  updateInterval: 60 * 60 * 1000,
  installDelay:   25 * 1000,
  toastDuration:  4000,
  debug:          location.hostname === 'localhost',
};

/* ── LOGGER ── */
const log = {
  i: (...a) => CFG.debug && console.info ('%c[PWA]', 'color:#2a9d8f;font-weight:700', ...a),
  w: (...a) => CFG.debug && console.warn ('%c[PWA]', 'color:#e9c46a;font-weight:700', ...a),
  e: (...a) =>               console.error('%c[PWA]', 'color:#e76f51;font-weight:700', ...a),
};

/* ── STATE ── */
let _deferredPrompt = null;
let _swReg          = null;
let _updateWorker   = null;
let _bannerShown    = false;

/* ═══════════════════════════════════════════════
   ① SERVICE WORKER
═══════════════════════════════════════════════ */
async function registerSW() {
  if (!('serviceWorker' in navigator)) { log.w('SW پشتیبانی نمی‌شود'); return; }
  try {
    const reg = await navigator.serviceWorker.register(CFG.swPath, {
      scope: CFG.swScope, updateViaCache: 'none',
    });
    _swReg = reg;
    log.i('SW ثبت شد ✓  scope:', reg.scope);

    if (reg.waiting) _onUpdateFound(reg.waiting);

    reg.addEventListener('updatefound', () => {
      const w = reg.installing;
      w.addEventListener('statechange', () => {
        if (w.state === 'installed' && navigator.serviceWorker.controller) _onUpdateFound(w);
      });
    });

    setInterval(() => reg.update().catch(log.w), CFG.updateInterval);

    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });
  } catch (err) { log.e('خطا در ثبت SW:', err); }
}

function _onUpdateFound(worker) {
  if (_updateWorker) return;
  _updateWorker = worker;
  log.i('نسخه جدید آماده ✓');
  _showUpdateBanner(worker);
}

/* ═══════════════════════════════════════════════
   ② INSTALL PROMPT
═══════════════════════════════════════════════ */
function _initInstall() {
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    _deferredPrompt = e;
    log.i('beforeinstallprompt ذخیره شد ✓');
    _track('pwa_prompt_available');
    const dismissed = localStorage.getItem('pwa_install_dismissed');
    const tooSoon   = dismissed && Date.now() - +dismissed < 7 * 24 * 60 * 60 * 1000;
    if (!_bannerShown && !_isInstalled() && !tooSoon) {
      setTimeout(_showInstallBanner, CFG.installDelay);
    }
  });

  window.addEventListener('appinstalled', () => {
    log.i('اپ نصب شد ✓');
    _deferredPrompt = null;
    _removeBanner('pwa-install-banner');
    _toast('\u2705 برکت‌هاب با موفقیت نصب شد!', 'success');
    localStorage.setItem('pwa_installed', '1');
    _track('pwa_installed');
  });
}

export async function triggerInstall() {
  if (_isIOS() && !_isStandalone()) { _showIOSGuide(); return; }
  if (!_deferredPrompt) { log.w('prompt در دسترس نیست'); return; }
  try {
    await _deferredPrompt.prompt();
    const { outcome } = await _deferredPrompt.userChoice;
    log.i('انتخاب کاربر:', outcome);
    _track('pwa_prompt_result', { outcome });
    if (outcome === 'accepted') { _deferredPrompt = null; _removeBanner('pwa-install-banner'); }
  } catch (err) { log.e(err); }
}

/* ═══════════════════════════════════════════════
   ③ NETWORK MONITOR
═══════════════════════════════════════════════ */
function _initNetwork() {
  const root = document.documentElement;
  window.addEventListener('online',  () => { root.removeAttribute('data-offline'); _toast('\uD83C\uDF10 اتصال اینترنت برقرار شد', 'success'); _track('network_online'); });
  window.addEventListener('offline', () => { root.setAttribute('data-offline',''); _toast('\uD83D\uDCF5 اتصال قطع شد — حالت آفلاین فعال است', 'warning', 6000); _track('network_offline'); });
  if (!navigator.onLine) root.setAttribute('data-offline', '');
}

/* ═══════════════════════════════════════════════
   ④ UI — UPDATE BANNER
═══════════════════════════════════════════════ */
function _showUpdateBanner(worker) {
  _removeBanner('pwa-update-banner');
  const el = _el('div', { id:'pwa-update-banner', role:'alert', 'aria-live':'polite' });
  el.innerHTML = `
    <div class="pu-inner">
      <span class="pu-msg">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true">
          <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
          <path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/>
          <path d="M16 16h5v5"/>
        </svg>
        نسخه جدید برکت‌هاب آماده است
      </span>
      <div class="pu-btns">
        <button class="pb pb-primary" id="pu-apply">به‌روزرسانی</button>
        <button class="pb pb-ghost"   id="pu-dismiss" aria-label="بستن">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>
        </button>
      </div>
    </div>`;
  document.body.appendChild(el);
  requestAnimationFrame(() => el.classList.add('pwa-in'));
  el.querySelector('#pu-apply').onclick   = () => { worker.postMessage({ type:'SKIP_WAITING' }); _removeBanner('pwa-update-banner'); _track('pwa_update_applied'); };
  el.querySelector('#pu-dismiss').onclick = () => { _removeBanner('pwa-update-banner'); _track('pwa_update_dismissed'); };
}

/* ═══════════════════════════════════════════════
   ⑤ UI — INSTALL BANNER
═══════════════════════════════════════════════ */
function _showInstallBanner() {
  if (_bannerShown || _isInstalled()) return;
  if (!_deferredPrompt && !_isIOS()) return;
  _bannerShown = true;
  const el = _el('div', { id:'pwa-install-banner', role:'complementary', 'aria-label':'نصب اپلیکیشن' });
  el.innerHTML = `
    <div class="pi-inner">
      <img src="/assets/img/icon-192.png" class="pi-icon" alt="آیکون برکت‌هاب" width="52" height="52" loading="lazy"/>
      <div class="pi-text">
        <strong class="pi-title">برکت‌هاب را نصب کن</strong>
        <span class="pi-sub">دسترسی سریع‌تر · حتی بدون اینترنت</span>
      </div>
      <div class="pi-btns">
        <button class="pb pb-install" id="pi-trigger">نصب</button>
        <button class="pb pb-ghost"   id="pi-dismiss" aria-label="بعداً">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>
        </button>
      </div>
    </div>`;
  document.body.appendChild(el);
  requestAnimationFrame(() => el.classList.add('pwa-in'));
  _track('pwa_banner_shown');
  el.querySelector('#pi-trigger').onclick = () => { triggerInstall(); _track('pwa_install_clicked'); };
  el.querySelector('#pi-dismiss').onclick = () => { _removeBanner('pwa-install-banner'); localStorage.setItem('pwa_install_dismissed', Date.now().toString()); _track('pwa_banner_dismissed'); };
}

/* ═══════════════════════════════════════════════
   ⑥ UI — iOS GUIDE
═══════════════════════════════════════════════ */
function _showIOSGuide() {
  _removeBanner('pwa-ios-guide');
  const el = _el('div', { id:'pwa-ios-guide', role:'dialog', 'aria-modal':'true', 'aria-label':'راهنمای نصب' });
  el.innerHTML = `
    <div class="ig-backdrop"></div>
    <div class="ig-sheet">
      <div class="ig-head">
        <strong>نصب برکت‌هاب روی iPhone</strong>
        <button class="pb pb-ghost" id="ig-close" aria-label="بستن">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>
        </button>
      </div>
      <ol class="ig-steps">
        <li><span class="ig-num">۱</span><span>روی <svg class="ig-share" viewBox="0 0 24 24" fill="none" stroke="#007AFF" stroke-width="2" width="17" height="17" aria-hidden="true"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg> <strong>Share</strong> در Safari بزن</span></li>
        <li><span class="ig-num">۲</span><span>گزینه <strong>«Add to Home Screen»</strong> را انتخاب کن</span></li>
        <li><span class="ig-num">۳</span><span>روی <strong>Add</strong> بزن — تمام!</span></li>
      </ol>
      <div class="ig-arrow" aria-hidden="true">
        <svg viewBox="0 0 24 32" width="24" height="32" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="0" x2="12" y2="24"/><polyline points="6,18 12,24 18,18"/>
        </svg>
        <span>نوار ابزار Safari در پایین</span>
      </div>
    </div>`;
  document.body.appendChild(el);
  requestAnimationFrame(() => el.classList.add('pwa-in'));
  _track('pwa_ios_guide');
  el.querySelector('#ig-close').onclick    = () => _removeBanner('pwa-ios-guide');
  el.querySelector('.ig-backdrop').onclick = () => _removeBanner('pwa-ios-guide');
}

/* ═══════════════════════════════════════════════
   ⑦ TOAST
═══════════════════════════════════════════════ */
function _toast(msg, type = 'info', dur = CFG.toastDuration) {
  const c = document.getElementById('toast-container');
  if (!c) return;
  const t = _el('div', { class:`pwa-toast pwa-toast--${type}`, role:'status' });
  t.style.pointerEvents = 'auto';
  t.textContent = msg;
  c.appendChild(t);
  requestAnimationFrame(() => t.classList.add('pwa-toast--in'));
  setTimeout(() => { t.classList.remove('pwa-toast--in'); t.addEventListener('transitionend', () => t.remove(), { once:true }); }, dur);
}

/* ═══════════════════════════════════════════════
   ⑧ ANALYTICS
═══════════════════════════════════════════════ */
function _track(name, params = {}) {
  log.i('event:', name, params);
  if (typeof window.gtag      === 'function') window.gtag('event', name, { event_category:'pwa', ...params });
  if (typeof window.plausible === 'function') window.plausible(name, { props: params });
  window.dispatchEvent(new CustomEvent('pwa:event', { detail:{ name, params } }));
}

/* ═══════════════════════════════════════════════
   ⑨ HELPERS
═══════════════════════════════════════════════ */
function _el(tag, attrs = {}) { const e = document.createElement(tag); Object.entries(attrs).forEach(([k,v]) => e.setAttribute(k,v)); return e; }
function _removeBanner(id) { const e = document.getElementById(id); if(!e) return; e.classList.remove('pwa-in'); e.addEventListener('transitionend', () => e.remove(), { once:true }); }
function _isIOS()        { return /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1); }
function _isStandalone() { return window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true; }
function _isInstalled()  { return localStorage.getItem('pwa_installed') === '1' || _isStandalone(); }

/* ═══════════════════════════════════════════════
   ⑩ STYLES  (inline — بدون فایل جداگانه)
═══════════════════════════════════════════════ */
function _injectStyles() {
  if (document.getElementById('pwa-css')) return;
  const s = document.createElement('style');
  s.id = 'pwa-css';
  s.textContent = `
[id^="pwa-"],[id^="pwa-"] *{box-sizing:border-box}
[id^="pwa-"]{font-family:var(--font-ui,'Vazirmatn',sans-serif);direction:rtl}

/* Update Banner */
#pwa-update-banner{position:fixed;top:0;inset-inline:0;z-index:9999;transform:translateY(-110%);transition:transform .45s cubic-bezier(.34,1.56,.64,1)}
#pwa-update-banner.pwa-in{transform:translateY(0)}
.pu-inner{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:11px 20px;background:#16213e;border-bottom:1px solid rgba(255,255,255,.07);backdrop-filter:blur(16px)}
.pu-msg{display:flex;align-items:center;gap:9px;color:#dde4ff;font-size:.875rem;font-weight:500}
.pu-btns{display:flex;align-items:center;gap:8px;flex-shrink:0}

/* Install Banner */
#pwa-install-banner{position:fixed;bottom:0;inset-inline:0;z-index:9990;transform:translateY(110%);transition:transform .45s cubic-bezier(.34,1.56,.64,1)}
#pwa-install-banner.pwa-in{transform:translateY(0)}
.pi-inner{display:flex;align-items:center;gap:14px;padding:15px 18px calc(15px + env(safe-area-inset-bottom,0px));background:rgba(250,249,247,.97);border-top:1px solid rgba(0,0,0,.07);backdrop-filter:blur(24px) saturate(180%);box-shadow:0 -6px 28px rgba(0,0,0,.11)}
[data-theme="dark"] .pi-inner{background:rgba(18,15,12,.97);border-top-color:rgba(255,255,255,.06);box-shadow:0 -6px 28px rgba(0,0,0,.45)}
.pi-icon{border-radius:13px;flex-shrink:0;box-shadow:0 2px 10px rgba(0,0,0,.14)}
.pi-text{flex:1;display:flex;flex-direction:column;gap:2px;overflow:hidden}
.pi-title{font-size:.9375rem;font-weight:700;color:var(--text-primary,#1a1a1a);white-space:nowrap}
[data-theme="dark"] .pi-title{color:#f0ede8}
.pi-sub{font-size:.8rem;color:var(--text-secondary,#777);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
[data-theme="dark"] .pi-sub{color:#9a9590}
.pi-btns{display:flex;align-items:center;gap:8px;flex-shrink:0}

/* iOS Guide */
#pwa-ios-guide{position:fixed;inset:0;z-index:10000;opacity:0;transition:opacity .3s ease}
#pwa-ios-guide.pwa-in{opacity:1}
.ig-backdrop{position:absolute;inset:0;background:rgba(0,0,0,.52);backdrop-filter:blur(5px)}
.ig-sheet{position:absolute;bottom:0;inset-inline:0;background:var(--bg-surface,#fff);border-radius:22px 22px 0 0;padding:22px 20px calc(34px + env(safe-area-inset-bottom,0px));box-shadow:0 -4px 40px rgba(0,0,0,.18);transform:translateY(18px);transition:transform .4s cubic-bezier(.34,1.56,.64,1)}
[data-theme="dark"] .ig-sheet{background:#1c1814}
#pwa-ios-guide.pwa-in .ig-sheet{transform:translateY(0)}
.ig-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;font-size:1rem;font-weight:700;color:var(--text-primary,#111)}
[data-theme="dark"] .ig-head{color:#f0ede8}
.ig-steps{list-style:none;margin:0 0 18px;padding:0;display:flex;flex-direction:column;gap:15px}
.ig-steps li{display:flex;align-items:center;gap:12px;font-size:.9375rem;line-height:1.5;color:var(--text-primary,#222)}
[data-theme="dark"] .ig-steps li{color:#ddd8d0}
.ig-num{display:flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:50%;background:var(--color-primary-500,#2a9d8f);color:#fff;font-size:.8125rem;font-weight:700;flex-shrink:0}
.ig-share{display:inline-block;vertical-align:middle;margin:0 3px}
.ig-arrow{display:flex;flex-direction:column;align-items:center;gap:5px;color:var(--text-secondary,#999);font-size:.8rem;animation:ig-bounce 1.6s ease-in-out infinite}
@keyframes ig-bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(7px)}}

/* Buttons */
.pb{display:inline-flex;align-items:center;justify-content:center;gap:5px;border:none;cursor:pointer;font-family:inherit;font-weight:600;border-radius:9px;line-height:1;transition:all .18s ease;-webkit-tap-highlight-color:transparent}
.pb-primary{padding:7px 15px;font-size:.8125rem;background:#2a9d8f;color:#fff}
.pb-primary:hover{background:#22887b}
.pb-primary:active{transform:scale(.97)}
.pb-install{padding:9px 22px;font-size:.875rem;background:var(--color-primary-500,#2a9d8f);color:#fff;border-radius:11px;box-shadow:0 2px 14px rgba(42,157,143,.32)}
.pb-install:hover{background:#22887b;box-shadow:0 4px 18px rgba(42,157,143,.42);transform:translateY(-1px)}
.pb-install:active{transform:scale(.97)}
.pb-ghost{padding:6px;background:transparent;color:currentColor;opacity:.55;border-radius:7px}
.pb-ghost:hover{opacity:1;background:rgba(128,128,128,.1)}

/* Toast */
.pwa-toast{padding:11px 17px;border-radius:10px;font-size:.875rem;font-weight:500;color:#fff;opacity:0;transform:translateX(16px);transition:opacity .28s ease,transform .32s cubic-bezier(.34,1.56,.64,1);max-width:300px;min-width:180px;box-shadow:0 4px 22px rgba(0,0,0,.18);backdrop-filter:blur(10px)}
.pwa-toast--in{opacity:1;transform:translateX(0)}
.pwa-toast--success{background:rgba(34,197,94,.93)}
.pwa-toast--warning{background:rgba(245,158,11,.93)}
.pwa-toast--info{background:rgba(59,130,246,.93)}
.pwa-toast--error{background:rgba(239,68,68,.93)}

/* Offline pill */
[data-offline] body::before{content:'📵  آفلاین';position:fixed;top:10px;left:50%;transform:translateX(-50%);background:rgba(239,68,68,.92);color:#fff;font-family:var(--font-ui,'Vazirmatn',sans-serif);font-size:.75rem;font-weight:700;padding:4px 14px;border-radius:999px;z-index:9998;pointer-events:none;backdrop-filter:blur(8px);white-space:nowrap}

/* Reduced motion */
@media(prefers-reduced-motion:reduce){[id^="pwa-"],.pwa-toast,.ig-arrow{transition:none!important;animation:none!important}}
  `;
  document.head.appendChild(s);
}

/* ═══════════════════════════════════════════════
   ⑪ INIT
═══════════════════════════════════════════════ */
export async function initPWA() {
  _injectStyles();
  _initInstall();
  _initNetwork();
  if (document.readyState === 'loading') {
    await new Promise(r => document.addEventListener('DOMContentLoaded', r, { once:true }));
  }
  await registerSW();
  log.i('PWA Manager آماده است ✓');
}

initPWA();
