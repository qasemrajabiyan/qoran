/**
 * FILE: app.js [v2.0 — جایگزین فایل قبلی]
 * ROLE: نقطه ورود — Auto Lang Init + Navbar + Footer
 * VERSION: 2.0.0
 */
import { i18n, t, setLang, initI18n } from './i18n.js';
import { theme } from './theme.js';

function renderNavbar() {
  const root = document.getElementById('navbar-root');
  if (!root) return;
  root.innerHTML = `
    <nav class="navbar" role="navigation">
      <div class="container">
        <div class="navbar__inner flex-between">
          <a href="./index.html" class="navbar__logo" aria-label="برکت هاب">
            <svg width="32" height="32" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
<defs>
<radialGradient id="nb_bg" cx="50%" cy="42%" r="55%"><stop offset="0%" stop-color="#1a0a2e"/><stop offset="100%" stop-color="#060612"/></radialGradient>
<radialGradient id="nb_lb" cx="50%" cy="15%" r="60%"><stop offset="0%" stop-color="#f5c842" stop-opacity="0.55"/><stop offset="100%" stop-color="#e8a020" stop-opacity="0"/></radialGradient>
<radialGradient id="nb_h1" cx="50%" cy="30%" r="70%"><stop offset="0%" stop-color="#f5d4a8"/><stop offset="100%" stop-color="#c49060"/></radialGradient>
<radialGradient id="nb_h2" cx="50%" cy="30%" r="70%"><stop offset="0%" stop-color="#e8c090"/><stop offset="100%" stop-color="#b07840"/></radialGradient>
</defs>
<rect width="512" height="512" rx="114" fill="url(#nb_bg)"/>
<ellipse cx="256" cy="0" rx="220" ry="200" fill="url(#nb_lb)"/>
<ellipse cx="256" cy="28" rx="20" ry="20" fill="#f5c842" opacity="0.9"/>
<ellipse cx="256" cy="28" rx="9" ry="9" fill="white" opacity="0.95"/>
<path d="M88,355 C81,325 75,295 78,270 C80,253 88,243 98,240 C108,237 118,243 123,255 L131,280 C133,265 135,247 141,233 C147,220 157,213 167,215 C177,217 183,227 183,243 L185,275 C188,260 191,243 198,231 C204,220 214,214 223,217 C232,220 236,231 235,247 L233,280 C237,265 242,249 250,239 C257,230 266,227 274,231 C282,235 286,247 284,263 L275,315 C281,303 287,293 295,287 C303,281 313,281 319,289 C325,297 323,313 315,329 L298,375 C291,391 281,403 268,409 C255,415 239,415 225,409 C208,402 191,389 178,373 C165,357 155,337 148,317 Z" fill="url(#nb_h1)"/>
<path d="M424,355 C431,325 437,295 434,270 C432,253 424,243 414,240 C404,237 394,243 389,255 L381,280 C379,265 377,247 371,233 C365,220 355,213 345,215 C335,217 329,227 329,243 L327,275 C324,260 321,243 314,231 C308,220 298,214 289,217 C280,220 276,231 277,247 L279,280 C275,265 270,249 262,239 C255,230 246,227 238,231 C230,235 226,247 228,263 L237,315 C231,303 225,293 217,287 C209,281 199,281 193,289 C187,297 189,313 197,329 L214,375 C221,391 231,403 244,409 C257,415 273,415 287,409 C304,402 321,389 334,373 C347,357 357,337 364,317 Z" fill="url(#nb_h2)"/>
<circle cx="256" cy="283" r="5" fill="#f5c842" opacity="0.9"/>
<circle cx="210" cy="295" r="4" fill="#c9a0e0" opacity="0.8"/>
<circle cx="302" cy="295" r="4" fill="#c9a0e0" opacity="0.8"/>
</svg>
            <span class="navbar__brand">برکت هاب</span>
          </a>
          <ul class="navbar__links hide-mobile" role="list">
            <li><a href="./index.html" class="navbar__link">${t('nav.home')}</a></li>
            <li><a href="./quran.html" class="navbar__link">${t('nav.quran')}</a></li>
            <li><a href="./prayer.html" class="navbar__link">${t('nav.prayer')}</a></li>
            <li><a href="./consultation.html" class="navbar__link">${{fa:'مشاوره',ar:'الاستشارة',ur:'مشاورہ',az:'Məsləhət',tr:'Danışmanlık',ru:'Консультация',en:'Consultation',id:'Konsultasi'}[i18n.lang]??'Consultation'}</a></li>
            <li><a href="./istikhara.html" class="navbar__link">${{fa:'استخاره',ar:'الاستخارة',ur:'استخارہ',en:'Istikhara',id:'Istikharah'}[i18n.lang]??'Istikhara'}</a></li>
            <li><a href="./meeting.html" class="navbar__link">${{fa:'دیدار با شیخ در کربلا',ar:'لقاء الشيخ في كربلاء',ur:'کربلا میں شیخ سے ملاقات',az:'Kərbəlada şeyxlə görüş',tr:'Kerbela\'da Şeyh Görüşmesi',ru:'Встреча с шейхом в Кербеле',en:'Meet the Sheikh in Karbala',id:'Bertemu Syaikh di Karbala'}[i18n.lang]??'Meeting'}</a></li>
            <li><a href="./about.html" class="navbar__link">${{fa:'درباره ما',ar:'من نحن',ur:'ہمارے بارے میں',en:'About',id:'Tentang'}[i18n.lang]??'About'}</a></li>
            <li><a href="./payment.html" class="navbar__link">${{fa:'پرداخت',ar:'الدفع',ur:'ادائیگی',en:'Payment',id:'Pembayaran'}[i18n.lang]??'Payment'}</a></li>
            <li><a href="./messages.html" class="navbar__link" id="notif-badge-link" style="position:relative">${{fa:'پیام‌های من',ar:'رسائلي',ur:'میرے پیغامات',en:'Messages',id:'Pesan'}[i18n.lang]??'Messages'}<span id="notif-badge" style="display:none;position:absolute;top:-6px;inset-inline-end:-8px;background:var(--color-error);color:white;font-size:10px;font-weight:700;padding:1px 5px;border-radius:999px;min-width:16px;text-align:center"></span></a></li>
          </ul>
          <div class="navbar__actions flex gap-2">
            <button class="btn btn--icon btn--ghost" id="search-toggle" aria-label="${t('nav.search')}">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            </button>
            <div class="lang-selector">
              <button class="btn btn--ghost btn--sm lang-selector__trigger" id="lang-btn" aria-haspopup="listbox" aria-expanded="false">
                <span class="lang-badge" id="current-lang-badge">${i18n.config.flag} ${i18n.lang.toUpperCase()}</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg>
              </button>
              <ul class="lang-selector__dropdown" id="lang-dropdown" role="listbox" hidden>
                ${i18n.languages.map(lang => `
                  <li role="option" aria-selected="${lang.code === i18n.lang}">
                    <button class="lang-selector__option ${lang.code === i18n.lang ? 'lang-selector__option--active' : ''}" data-lang="${lang.code}">
                      <span>${lang.flag}</span><span>${lang.nativeName}</span><span class="lang-badge">${lang.code.toUpperCase()}</span>
                    </button>
                  </li>`).join('')}
              </ul>
            </div>
            <button class="btn btn--icon btn--ghost" id="theme-toggle" aria-label="تم">
              <svg class="icon-moon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
              <svg class="icon-sun" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:none"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/></svg>
            </button>
            <button class="btn btn--icon btn--ghost show-mobile" id="menu-toggle" aria-label="منو" aria-expanded="false">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            </button>
          </div>
        </div>
      </div>
      <div id="mobile-menu" class="navbar__mobile" hidden>
        <ul role="list">
          <li><a href="./index.html" class="navbar__link">${t('nav.home')}</a></li>
          <li><a href="./quran.html" class="navbar__link">${t('nav.quran')}</a></li>
          <li><a href="./prayer.html" class="navbar__link">${t('nav.prayer')}</a></li>
          <li><a href="./consultation.html" class="navbar__link">${{fa:'مشاوره',ar:'الاستشارة',ur:'مشاورہ',en:'Consultation',id:'Konsultasi'}[i18n.lang]??'Consultation'}</a></li>
          <li><a href="./istikhara.html" class="navbar__link">${{fa:'استخاره',ar:'الاستخارة',ur:'استخارہ',en:'Istikhara',id:'Istikharah'}[i18n.lang]??'Istikhara'}</a></li>
          <li><a href="./meeting.html" class="navbar__link">${t('nav.meeting')}</a></li>
          <li><a href="./about.html" class="navbar__link">${{fa:'درباره ما',ar:'من نحن',ur:'ہمارے بارے میں',en:'About',id:'Tentang'}[i18n.lang]??'About'}</a></li>
            <li><a href="./payment.html" class="navbar__link">${{fa:'پرداخت',ar:'الدفع',ur:'ادائیگی',en:'Payment',id:'Pembayaran'}[i18n.lang]??'Payment'}</a></li>
        </ul>
      </div>
      <div id="search-overlay" class="search-overlay" hidden role="search">
        <div class="search-overlay__inner container">
          <input type="search" class="search-overlay__input" id="search-input" placeholder="${t('search.placeholder')}" autocomplete="off"/>
          <button class="btn btn--ghost" id="search-close">✕</button>
        </div>
      </div>
    </nav>`;
  _bindNavbarEvents();
}

function _bindNavbarEvents() {
  const themeBtn = document.getElementById('theme-toggle');
  if (themeBtn) {
    theme.bindToggleBtn(themeBtn);
    const upd = (t) => {
      themeBtn.querySelector('.icon-moon').style.display = t==='dark' ? 'none' : 'block';
      themeBtn.querySelector('.icon-sun').style.display  = t==='dark' ? 'block' : 'none';
    };
    theme.onChange(upd); upd(theme.current);
  }
  const langBtn = document.getElementById('lang-btn');
  const dd = document.getElementById('lang-dropdown');
  if (langBtn && dd) {
    langBtn.addEventListener('click', () => { const h=dd.hidden; dd.hidden=!h; langBtn.setAttribute('aria-expanded',String(h)); });
    dd.addEventListener('click', async (e) => {
      const btn = e.target.closest('[data-lang]');
      if (!btn) return;
      const badge = document.getElementById('current-lang-badge');
      if (badge) badge.textContent = '⏳';
      await setLang(btn.dataset.lang);
      dd.hidden = true;
      renderNavbar(); renderFooter();
    });
    document.addEventListener('click', (e) => { if (!e.target.closest('.lang-selector')) { dd.hidden=true; langBtn.setAttribute('aria-expanded','false'); }});
  }
  const st=document.getElementById('search-toggle'), so=document.getElementById('search-overlay'), sc=document.getElementById('search-close');
  if (st&&so) { st.addEventListener('click',()=>{so.hidden=false;document.getElementById('search-input')?.focus();}); sc?.addEventListener('click',()=>{so.hidden=true;}); document.addEventListener('keydown',(e)=>{if(e.key==='Escape')so.hidden=true;}); }
  const mt=document.getElementById('menu-toggle'), mm=document.getElementById('mobile-menu');
  if (mt&&mm) { mt.addEventListener('click',()=>{const h=mm.hidden;mm.hidden=!h;mt.setAttribute('aria-expanded',String(h));}); }
  window.addEventListener('scroll',()=>{document.querySelector('.navbar')?.classList.toggle('navbar--scrolled',window.scrollY>10);},{passive:true});
}

function renderFooter() {
  const root = document.getElementById('footer-root');
  if (!root) return;
  const year = new Date().getFullYear();
  root.innerHTML = `
    <footer class="footer">
      <div class="container">
        <div class="footer__top grid grid--4">
          <div class="footer__brand">
            <a href="./index.html" class="navbar__logo" style="margin-bottom:var(--space-4);display:inline-flex">
              <svg width="28" height="28" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
<defs>
<radialGradient id="ft_bg" cx="50%" cy="42%" r="55%"><stop offset="0%" stop-color="#1a0a2e"/><stop offset="100%" stop-color="#060612"/></radialGradient>
<radialGradient id="ft_lb" cx="50%" cy="15%" r="60%"><stop offset="0%" stop-color="#f5c842" stop-opacity="0.55"/><stop offset="100%" stop-color="#e8a020" stop-opacity="0"/></radialGradient>
<radialGradient id="ft_h1" cx="50%" cy="30%" r="70%"><stop offset="0%" stop-color="#f5d4a8"/><stop offset="100%" stop-color="#c49060"/></radialGradient>
<radialGradient id="ft_h2" cx="50%" cy="30%" r="70%"><stop offset="0%" stop-color="#e8c090"/><stop offset="100%" stop-color="#b07840"/></radialGradient>
</defs>
<rect width="512" height="512" rx="114" fill="url(#ft_bg)"/>
<ellipse cx="256" cy="0" rx="220" ry="200" fill="url(#ft_lb)"/>
<ellipse cx="256" cy="28" rx="20" ry="20" fill="#f5c842" opacity="0.9"/>
<ellipse cx="256" cy="28" rx="9" ry="9" fill="white" opacity="0.95"/>
<path d="M88,355 C81,325 75,295 78,270 C80,253 88,243 98,240 C108,237 118,243 123,255 L131,280 C133,265 135,247 141,233 C147,220 157,213 167,215 C177,217 183,227 183,243 L185,275 C188,260 191,243 198,231 C204,220 214,214 223,217 C232,220 236,231 235,247 L233,280 C237,265 242,249 250,239 C257,230 266,227 274,231 C282,235 286,247 284,263 L275,315 C281,303 287,293 295,287 C303,281 313,281 319,289 C325,297 323,313 315,329 L298,375 C291,391 281,403 268,409 C255,415 239,415 225,409 C208,402 191,389 178,373 C165,357 155,337 148,317 Z" fill="url(#ft_h1)"/>
<path d="M424,355 C431,325 437,295 434,270 C432,253 424,243 414,240 C404,237 394,243 389,255 L381,280 C379,265 377,247 371,233 C365,220 355,213 345,215 C335,217 329,227 329,243 L327,275 C324,260 321,243 314,231 C308,220 298,214 289,217 C280,220 276,231 277,247 L279,280 C275,265 270,249 262,239 C255,230 246,227 238,231 C230,235 226,247 228,263 L237,315 C231,303 225,293 217,287 C209,281 199,281 193,289 C187,297 189,313 197,329 L214,375 C221,391 231,403 244,409 C257,415 273,415 287,409 C304,402 321,389 334,373 C347,357 357,337 364,317 Z" fill="url(#ft_h2)"/>
<circle cx="256" cy="283" r="5" fill="#f5c842" opacity="0.9"/>
</svg>
              <span class="navbar__brand">برکت هاب</span>
            </a>
          </div>
          <div>
            <h3 class="footer__heading">${t('nav.quran')}</h3>
            <ul class="footer__list" role="list">
              <li><a href="./quran.html" class="footer__link">${t('nav.quran')}</a></li>
              <li><a href="./prayer.html" class="footer__link">${t('nav.prayer')}</a></li>
              <li><a href="./meeting.html" class="footer__link">${t('nav.meeting')}</a></li>
            </ul>
          </div>
          <div>
            <h3 class="footer__heading">${t('nav.news')}</h3>
            <ul class="footer__list" role="list">
              <li><a href="/news.html" class="footer__link">${t('nav.news')}</a></li>
            </ul>
          </div>
          <div>
            <h3 class="footer__heading">${t('nav.about')}</h3>
            <ul class="footer__list" role="list">
              <li><a href="./about.html" class="footer__link">${t('nav.about')}</a></li>
              <li><a href="/contact.html" class="footer__link">${t('nav.contact')}</a></li>
            </ul>
          </div>
        </div>
        <hr/>
        <div class="footer__bottom flex-between flex-wrap gap-4">
          <p style="color:var(--text-muted);font-size:var(--text-sm)">&copy; ${year} برکت هاب. ${t('footer.copyright')}</p>
          <div class="flex gap-2 flex-wrap">
            ${i18n.languages.map(l=>`<button class="btn btn--ghost btn--sm footer__lang-btn ${l.code===i18n.lang?'footer__lang-btn--active':''}" data-lang="${l.code}">${l.flag} ${l.code.toUpperCase()}</button>`).join('')}
          </div>
        </div>
      </div>
    </footer>`;
  root.querySelectorAll('[data-lang]').forEach(btn => {
    btn.addEventListener('click', async () => { await setLang(btn.dataset.lang); renderNavbar(); renderFooter(); });
  });
}

export function showToast(msg, type='info', dur=4000) {
  const c = document.getElementById('toast-container');
  if (!c) return;
  const t = document.createElement('div');
  t.setAttribute('role','alert');
  t.style.cssText='pointer-events:all;background:var(--bg-surface);border:1px solid var(--border-color);border-radius:8px;padding:10px 16px;box-shadow:var(--shadow-lg);font-size:13px;animation:fadeIn 0.3s ease;color:var(--text-primary)';
  if (type==='error') t.style.borderColor='var(--color-error)';
  t.textContent = msg;
  c.appendChild(t);
  setTimeout(()=>{t.style.opacity='0';t.style.transition='opacity 0.3s';setTimeout(()=>t.remove(),300);},dur);
}

async function init() {
  theme.init?.();
  await initI18n();
  renderNavbar();
  renderFooter();
  document.body.classList.add('ready');
  i18n.onChange(() => { renderNavbar(); renderFooter(); });
  console.log(`%c[BarakaHub v2] ✓ Lang:${i18n.lang} | Dir:${i18n.dir} | Theme:${theme.current}`,'color:#2a9d8f;font-weight:bold');
}

init();
