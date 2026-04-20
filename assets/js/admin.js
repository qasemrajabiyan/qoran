/**
 * ============================================================
 * FILE: admin.js
 * ROLE: داشبورد ادمین — ساختار، آمار، صفحه اصلی
 * PROJECT: BarakatHub — پلتفرم رسانه‌ای کربلا
 * VERSION: 1.0.0
 * ============================================================
 */

/* ────────────────────────────────────────────────────────────
   1. ADMIN AUTH GUARD
   ──────────────────────────────────────────────────────────── */
const ADMIN_KEY = 'mh_admin_token';

export function requireAdmin() {
  const token = localStorage.getItem(ADMIN_KEY);
  if (!token) { window.location.href = '/admin-login.html'; return false; }
  return true;
}

export function adminLogin(password) {
  /* در production: API call */
  const ADMIN_PASS = 'BarakatHub2026admin'; /* بعداً از سرور */
  if (password === ADMIN_PASS) {
    localStorage.setItem(ADMIN_KEY, 'admin_' + Date.now());
    return true;
  }
  return false;
}

export function adminLogout() {
  localStorage.removeItem(ADMIN_KEY);
  window.location.href = '/admin-login.html';
}

/* ────────────────────────────────────────────────────────────
   2. ADMIN DATA HELPERS
   ──────────────────────────────────────────────────────────── */
function _getUsers()     { try { return JSON.parse(localStorage.getItem('mh_all_users') || '[]'); } catch { return []; } }
function _getOrders()    { try { return JSON.parse(localStorage.getItem('mh_orders') || '[]'); } catch { return []; } }
function _getNotifs()    { try { return JSON.parse(localStorage.getItem('mh_notifications') || '[]'); } catch { return []; } }
function _getMeetings()  { try { return JSON.parse(localStorage.getItem('mh_meeting_responses') || '[]'); } catch { return []; } }

/* آمار کلی */
function _getStats() {
  const users    = _getUsers();
  const orders   = _getOrders();
  const meetings = _getMeetings();

  /* آمار بر اساس زبان */
  const byLang = {};
  users.forEach(u => { byLang[u.lang || 'fa'] = (byLang[u.lang || 'fa'] ?? 0) + 1; });

  /* آمار بر اساس کشور */
  const byCountry = {};
  users.forEach(u => {
    if (u.country) byCountry[u.country] = (byCountry[u.country] ?? 0) + 1;
  });

  /* سفارش‌های امروز */
  const today     = new Date().toDateString();
  const todayOrds = orders.filter(o => new Date(o.createdAt).toDateString() === today);

  /* سفارش‌های در انتظار */
  const pending = orders.filter(o => o.status === 'pending');

  return {
    totalUsers:     users.length,
    todayUsers:     users.filter(u => new Date(u.joinedAt).toDateString() === today).length,
    totalOrders:    orders.length,
    todayOrders:    todayOrds.length,
    pendingOrders:  pending.length,
    meetingYes:     meetings.filter(m => m.response === 'yes').length,
    byLang,
    byCountry,
    recentUsers:    users.slice(-5).reverse(),
    recentOrders:   orders.slice(0, 5),
  };
}

/* ────────────────────────────────────────────────────────────
   3. ADMIN NAVIGATION CONFIG
   ──────────────────────────────────────────────────────────── */
const ADMIN_NAV = [
  {
    section: 'اصلی',
    items: [
      { id: 'overview',   icon: '📊', label: 'نمای کلی',          badge: null },
      { id: 'users',      icon: '👥', label: 'کاربران',            badge: null },
    ]
  },
  {
    section: 'محتوا',
    items: [
      { id: 'quran',      icon: '📖', label: 'تدبرات قرآن',        badge: null },
      { id: 'prayers',    icon: '🤲', label: 'سفارش‌های دعا',      badge: '!' },
      { id: 'meeting',    icon: '🕌', label: 'دیدار با شیخ',       badge: null },
      { id: 'consult',    icon: '💬', label: 'مشاوره',             badge: null },
      { id: 'istikhara',  icon: '⭐', label: 'استخاره',            badge: null },
    ]
  },
  {
    section: 'مدیریت',
    items: [
      { id: 'messages',   icon: '📨', label: 'پیام‌ها',            badge: null },
      { id: 'prizes',     icon: '🎁', label: 'سیستم جایزه',        badge: null },
      { id: 'settings',   icon: '⚙️', label: 'تنظیمات',            badge: null },
    ]
  },
];

/* ────────────────────────────────────────────────────────────
   4. LANGUAGE CONFIG برای آمار
   ──────────────────────────────────────────────────────────── */
const LANG_INFO = {
  fa: { name: 'فارسی',      flag: '🇮🇷' },
  ar: { name: 'عربی',       flag: '🇸🇦' },
  ur: { name: 'اردو',       flag: '🇵🇰' },
  az: { name: 'آذری',       flag: '🇦🇿' },
  tr: { name: 'ترکی',       flag: '🇹🇷' },
  ru: { name: 'روسی',       flag: '🇷🇺' },
  en: { name: 'انگلیسی',    flag: '🇺🇸' },
};

/* ────────────────────────────────────────────────────────────
   5. ADMIN SHELL RENDERER
   ──────────────────────────────────────────────────────────── */
export function renderAdminShell(container, initialPage = 'overview') {
  if (!container) return;
  if (!requireAdmin()) return;

  let _activePage   = initialPage;
  let _sidebarOpen  = window.innerWidth >= 1024;
  const stats       = _getStats();

  function _render() {
    container.innerHTML = `
      <div class="admin-shell ${!_sidebarOpen ? 'admin-shell--collapsed' : ''}" id="admin-shell">

        <!-- Sidebar -->
        <aside class="admin-sidebar ${_sidebarOpen || window.innerWidth >= 1024 ? '' : ''}" id="admin-sidebar" aria-label="منوی ادمین">

          <!-- Logo -->
          <a href="/" class="admin-sidebar__logo" aria-label="برکت‌هاب">
            <div class="admin-sidebar__logo-icon" aria-hidden="true">🕌</div>
            <div class="overflow-hidden">
              <div class="admin-sidebar__logo-text">برکت‌هاب</div>
              <span class="admin-sidebar__logo-sub">پنل مدیریت</span>
            </div>
          </a>

          <!-- Navigation -->
          <nav class="admin-nav" role="navigation" aria-label="ناوبری ادمین">
            ${ADMIN_NAV.map(section => `
              <div class="admin-nav__section">
                <div class="admin-nav__section-label">${section.section}</div>
                ${section.items.map(item => `
                  <button
                    class="admin-nav__item ${item.id === _activePage ? 'admin-nav__item--active' : ''}"
                    data-page="${item.id}"
                    aria-current="${item.id === _activePage ? 'page' : 'false'}"
                  >
                    <span class="admin-nav__icon" aria-hidden="true">${item.icon}</span>
                    <span class="admin-nav__label">${item.label}</span>
                    ${item.badge ? `<span class="admin-nav__badge" aria-label="نیاز به توجه">${item.badge}</span>` : ''}
                  </button>
                `).join('')}
              </div>
            `).join('')}
          </nav>

          <!-- Profile -->
          <div class="admin-sidebar__profile">
            <div class="admin-sidebar__avatar" aria-hidden="true">👨‍💼</div>
            <div class="overflow-hidden">
              <div class="admin-sidebar__name">ادمین</div>
              <div class="admin-sidebar__role">مدیر ارشد</div>
            </div>
          </div>

        </aside>

        <!-- Header -->
        <header class="admin-header" role="banner">
          <div class="admin-header__left">
            <button class="admin-header__collapse-btn" id="sidebar-toggle" aria-label="تغییر sidebar">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
            <div class="admin-header__breadcrumb">
              <span>مدیریت</span>
              <span aria-hidden="true">›</span>
              <span class="admin-header__breadcrumb-current" id="breadcrumb-current">
                ${ADMIN_NAV.flatMap(s => s.items).find(i => i.id === _activePage)?.label ?? 'نمای کلی'}
              </span>
            </div>
          </div>
          <div class="admin-header__right">
            <div class="admin-site-status" aria-label="وضعیت سایت: آنلاین">
              <div class="admin-site-status__dot" aria-hidden="true"></div>
              سایت آنلاین
            </div>
            <button class="admin-notif-btn" aria-label="اعلان‌ها">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              ${stats.pendingOrders > 0 ? `<span class="admin-notif-btn__dot" aria-label="${stats.pendingOrders} سفارش در انتظار"></span>` : ''}
            </button>
            <button class="btn btn--ghost btn--sm" id="admin-logout-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              خروج
            </button>
          </div>
        </header>

        <!-- Content -->
        <main class="admin-content" id="admin-content" role="main">
          ${_renderPage(_activePage, stats)}
        </main>

      </div>
    `;

    _bindEvents();
  }

  /* ────────────────────────────────────────────────────────
     PAGE ROUTER
     ──────────────────────────────────────────────────────── */
  function _renderPage(pageId, stats) {
    switch (pageId) {
      case 'overview':   return _renderOverview(stats);
      case 'users':      return _renderUsers(stats);
      case 'quran':      return _renderQuranAdmin();
      case 'prayers':    return _renderPrayersAdmin();
      case 'meeting':    return _renderMeetingAdmin();
      case 'messages':   return _renderMessages();
      case 'prizes':     return _renderPrizes();
      case 'settings':   return _renderSettings();
      default:           return `<div class="empty-state"><span class="empty-state__icon">🚧</span><h3 class="empty-state__title">این بخش در حال ساخت است</h3></div>`;
    }
  }

  /* ────────────────────────────────────────────────────────
     OVERVIEW PAGE
     ──────────────────────────────────────────────────────── */
  function _renderOverview(stats) {
    const totalLangUsers = Object.values(stats.byLang).reduce((a,b)=>a+b, 0) || 1;

    return `
      <div>
        <div class="admin-page-header">
          <div>
            <h1 class="admin-page-title">
              <span class="admin-page-title__icon" aria-hidden="true">📊</span>
              نمای کلی
            </h1>
            <p class="admin-page-desc">${new Date().toLocaleDateString('fa-IR', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}</p>
          </div>
          <a href="/" target="_blank" class="btn btn--outline btn--sm">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            مشاهده سایت
          </a>
        </div>

        <!-- Stat Cards -->
        <div class="admin-stats-grid">
          ${[
            { label:'کل کاربران',      num: stats.totalUsers,   change:'+' + stats.todayUsers, trend:'up',   color:'teal',   icon:'👥' },
            { label:'کل سفارش‌ها',     num: stats.totalOrders,  change:'+' + stats.todayOrders,trend:'up',   color:'amber',  icon:'🤲' },
            { label:'در انتظار تأیید', num: stats.pendingOrders,change:'',                     trend:'same', color:'rose',   icon:'⏳' },
            { label:'دیدار تأییدشده',  num: stats.meetingYes,   change:'',                     trend:'same', color:'green',  icon:'🕌' },
            { label:'کاربران امروز',   num: stats.todayUsers,   change:'جدید',                 trend:'up',   color:'purple', icon:'✨' },
            { label:'سفارش امروز',     num: stats.todayOrders,  change:'',                     trend:'same', color:'blue',   icon:'📋' },
          ].map(s => `
            <div class="admin-stat-card admin-stat-card--${s.color}">
              <div class="admin-stat-card__header">
                <span class="admin-stat-card__label">${s.label}</span>
                <div class="admin-stat-card__icon" aria-hidden="true">${s.icon}</div>
              </div>
              <div class="admin-stat-card__num">${s.num.toLocaleString('fa-IR')}</div>
              ${s.change ? `<span class="admin-stat-card__change admin-stat-card__change--${s.trend}">${s.trend === 'up' ? '↑' : ''} ${s.change}</span>` : ''}
            </div>
          `).join('')}
        </div>

        <!-- دو ستون: نمودار + آمار زبان -->
        <div class="grid grid--2" style="margin-bottom:var(--space-5)">

          <!-- نمودار میله‌ای ساده -->
          <div class="admin-chart-card">
            <div class="admin-chart-header">
              <div class="admin-chart-title">📈 آمار کاربران بر اساس زبان</div>
            </div>
            <div class="simple-bar-chart" role="img" aria-label="نمودار آمار زبان‌ها">
              ${Object.entries(stats.byLang).map(([lang, count]) => {
                const pct = Math.round((count / totalLangUsers) * 100);
                const info = LANG_INFO[lang] ?? { name: lang, flag: '🌐' };
                return `
                  <div class="chart-bar-wrap">
                    <div class="chart-bar" style="height:${Math.max(pct, 3)}%" aria-label="${info.name}: ${count} کاربر">
                      <div class="chart-bar__tooltip">${count}</div>
                    </div>
                    <span class="chart-bar__label">${info.flag}</span>
                  </div>
                `;
              }).join('')}
            </div>
          </div>

          <!-- آمار زبان -->
          <div class="admin-panel">
            <div class="admin-panel__header">
              <div class="admin-panel__title">🌍 کاربران به تفکیک زبان</div>
            </div>
            <div class="admin-panel__body">
              <div class="lang-stats-grid">
                ${Object.entries(stats.byLang).map(([lang, count]) => {
                  const pct  = Math.round((count / totalLangUsers) * 100);
                  const info = LANG_INFO[lang] ?? { name: lang, flag: '🌐' };
                  return `
                    <div class="lang-stat-item">
                      <span class="lang-stat-item__flag" aria-hidden="true">${info.flag}</span>
                      <div class="lang-stat-item__info">
                        <div class="lang-stat-item__name">${info.name}</div>
                        <div class="lang-stat-item__count">${count.toLocaleString('fa-IR')} نفر • ${pct}%</div>
                        <div class="lang-stat-item__bar">
                          <div class="lang-stat-item__bar-fill" style="width:${pct}%"></div>
                        </div>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          </div>

        </div>

        <!-- آخرین سفارش‌ها -->
        <div class="admin-table-wrap">
          <div class="admin-table-header">
            <div class="admin-table-title">🤲 آخرین سفارش‌های دعا</div>
            <button class="btn btn--primary btn--sm" data-page="prayers">مشاهده همه</button>
          </div>
          <div style="overflow-x:auto">
            <table class="admin-table" aria-label="آخرین سفارش‌ها">
              <thead>
                <tr>
                  <th>کد سفارش</th>
                  <th>دعا</th>
                  <th>نیابت</th>
                  <th>زبان</th>
                  <th>روش پرداخت</th>
                  <th>وضعیت</th>
                  <th>عملیات</th>
                </tr>
              </thead>
              <tbody>
                ${stats.recentOrders.length === 0
                  ? `<tr><td colspan="7" style="text-align:center;color:var(--text-muted);padding:var(--space-8)">سفارشی وجود ندارد</td></tr>`
                  : stats.recentOrders.map(o => `
                    <tr>
                      <td><code style="font-size:var(--text-xs);direction:ltr">${o.id}</code></td>
                      <td>${o.prayerName || o.type}</td>
                      <td>${o.personName || '—'}</td>
                      <td>${LANG_INFO[o.userLang]?.flag ?? '🌐'} ${LANG_INFO[o.userLang]?.name ?? o.userLang}</td>
                      <td>${o.paymentMethod || '—'}</td>
                      <td><span class="admin-badge admin-badge--${o.status === 'done' ? 'done' : o.status === 'active' ? 'active' : 'pending'}">${o.status === 'done' ? 'انجام شد' : o.status === 'active' ? 'در حال انجام' : 'در انتظار'}</span></td>
                      <td>
                        <button class="btn btn--primary btn--sm mark-done-btn" data-order-id="${o.id}">✓ انجام شد</button>
                      </td>
                    </tr>
                  `).join('')
                }
              </tbody>
            </table>
          </div>
        </div>

      </div>
    `;
  }

  /* ────────────────────────────────────────────────────────
     USERS PAGE
     ──────────────────────────────────────────────────────── */
  function _renderUsers(stats) {
    const users = _getUsers();
    return `
      <div>
        <div class="admin-page-header">
          <div>
            <h1 class="admin-page-title"><span class="admin-page-title__icon">👥</span> مدیریت کاربران</h1>
            <p class="admin-page-desc">مجموع ${users.length.toLocaleString('fa-IR')} کاربر ثبت‌نام‌شده</p>
          </div>
          <div class="flex gap-3">
            <input type="search" class="admin-input" style="width:220px" placeholder="جستجو در کاربران..." aria-label="جستجو"/>
            <select class="admin-input" style="width:140px" aria-label="فیلتر زبان">
              <option value="">همه زبان‌ها</option>
              ${Object.entries(LANG_INFO).map(([k,v]) => `<option value="${k}">${v.flag} ${v.name}</option>`).join('')}
            </select>
          </div>
        </div>

        <!-- آمار خلاصه -->
        <div class="admin-stats-grid" style="margin-bottom:var(--space-5)">
          ${Object.entries(stats.byLang).map(([lang, count]) => {
            const info = LANG_INFO[lang] ?? { name: lang, flag: '🌐' };
            return `
              <div class="admin-stat-card admin-stat-card--teal">
                <div class="admin-stat-card__header">
                  <span class="admin-stat-card__label">${info.name}</span>
                  <div class="admin-stat-card__icon">${info.flag}</div>
                </div>
                <div class="admin-stat-card__num">${count.toLocaleString('fa-IR')}</div>
              </div>
            `;
          }).join('')}
        </div>

        <!-- جدول کاربران -->
        <div class="admin-table-wrap">
          <div class="admin-table-header">
            <div class="admin-table-title">لیست کاربران</div>
          </div>
          <div style="overflow-x:auto">
            <table class="admin-table" aria-label="کاربران">
              <thead>
                <tr>
                  <th>نام</th>
                  <th>ایمیل</th>
                  <th>کشور</th>
                  <th>زبان</th>
                  <th>تاریخ عضویت</th>
                  <th>اشتراک</th>
                </tr>
              </thead>
              <tbody>
                ${users.length === 0
                  ? `<tr><td colspan="6" style="text-align:center;color:var(--text-muted);padding:var(--space-8)">کاربری ثبت‌نام نکرده</td></tr>`
                  : users.slice(0,20).map(u => `
                    <tr>
                      <td>
                        <div class="flex gap-2" style="align-items:center">
                          <div class="avatar avatar--sm">${(u.name||'?').charAt(0)}</div>
                          <span>${u.name || '—'}</span>
                        </div>
                      </td>
                      <td style="direction:ltr;font-size:var(--text-xs)">${u.email || '—'}</td>
                      <td>${u.country || '—'}</td>
                      <td>${LANG_INFO[u.lang]?.flag ?? '🌐'} ${LANG_INFO[u.lang]?.name ?? u.lang ?? '—'}</td>
                      <td style="font-size:var(--text-xs)">${u.joinedAt ? new Date(u.joinedAt).toLocaleDateString('fa-IR') : '—'}</td>
                      <td><span class="admin-badge admin-badge--${u.isPremium ? 'active' : 'draft'}">${u.isPremium ? 'اشتراک فعال' : 'رایگان'}</span></td>
                    </tr>
                  `).join('')
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }

  /* ────────────────────────────────────────────────────────
     QURAN ADMIN PAGE
     ──────────────────────────────────────────────────────── */
  function _renderQuranAdmin() {
    return `
      <div>
        <div class="admin-page-header">
          <div>
            <h1 class="admin-page-title"><span class="admin-page-title__icon">📖</span> مدیریت تدبرات قرآن</h1>
            <p class="admin-page-desc">افزودن و ویرایش تدبرات آیات قرآن کریم</p>
          </div>
          <button class="btn btn--primary" id="new-ayah-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            تدبر جدید
          </button>
        </div>

        <!-- فرم افزودن تدبر -->
        <div class="admin-panel" id="ayah-form-panel">
          <div class="admin-panel__header">
            <div class="admin-panel__title">✏️ افزودن/ویرایش تدبر آیه</div>
            <div class="flex gap-2">
              <span class="admin-badge admin-badge--draft">پیش‌نویس</span>
            </div>
          </div>
          <div class="admin-panel__body">
            <div class="grid grid--2" style="gap:var(--space-4);margin-bottom:var(--space-5)">

              <!-- سوره -->
              <div class="admin-field">
                <label class="admin-label" for="surah-num">شماره سوره <span class="admin-label-hint">مثلاً ۱ برای فاتحه</span></label>
                <input type="number" class="admin-input" id="surah-num" min="1" max="114" placeholder="۱ تا ۱۱۴"/>
              </div>

              <!-- آیه -->
              <div class="admin-field">
                <label class="admin-label" for="ayah-num">شماره آیه</label>
                <input type="number" class="admin-input" id="ayah-num" min="1" placeholder="شماره آیه"/>
              </div>

              <!-- نام سوره -->
              <div class="admin-field">
                <label class="admin-label" for="surah-name">نام سوره <span class="admin-label-hint">به عربی</span></label>
                <input type="text" class="admin-input" id="surah-name" dir="rtl" placeholder="مثلاً: الفاتحة" style="font-family:'Noto Naskh Arabic',serif"/>
              </div>

              <!-- تعداد کل آیات سوره -->
              <div class="admin-field">
                <label class="admin-label" for="surah-total">تعداد کل آیات سوره</label>
                <input type="number" class="admin-input" id="surah-total" min="1"/>
              </div>
            </div>

            <!-- متن عربی آیه -->
            <div class="admin-field">
              <label class="admin-label" for="ayah-arabic">
                متن عربی آیه
                <span class="admin-label-hint">این قسمت تغییر نمی‌کند — همان عربی برای همه کاربران نمایش داده می‌شود</span>
              </label>
              <textarea
                class="admin-textarea admin-textarea--arabic"
                id="ayah-arabic"
                dir="rtl"
                lang="ar"
                rows="3"
                placeholder="متن آیه را به عربی وارد کنید..."
                aria-label="متن عربی آیه"
              ></textarea>
            </div>

            <!-- توضیح اجمالی -->
            <div class="admin-field">
              <label class="admin-label" for="ayah-summary">
                توضیح اجمالی
                <span class="admin-label-hint">همه کاربران می‌بینند — AI ترجمه می‌کند</span>
              </label>
              <textarea
                class="admin-textarea"
                id="ayah-summary"
                rows="3"
                placeholder="توضیح کوتاه آیه را به فارسی بنویسید..."
                aria-label="توضیح اجمالی"
              ></textarea>
            </div>

            <!-- تدبر مشروح -->
            <div class="admin-field">
              <label class="admin-label" for="ayah-tadabbur">
                تدبر و شرح مشروح
                <span class="admin-label-hint">فقط اعضای اشتراکی می‌بینند — AI ترجمه می‌کند</span>
              </label>
              <textarea
                class="admin-textarea"
                id="ayah-tadabbur"
                rows="8"
                placeholder="تدبر و شرح مفصل آیه را به فارسی بنویسید..."
                aria-label="تدبر مشروح"
              ></textarea>
            </div>

            <!-- ضبط صوت استاد -->
            <div class="admin-field">
              <label class="admin-label">
                صوت استاد
                <span class="admin-label-hint">برای فارسی‌زبانان همین فایل — برای بقیه AI دوبله می‌کند</span>
              </label>
              <div class="audio-recorder" id="audio-recorder" role="region" aria-label="ضبط صوت">
                <button class="audio-recorder__btn" id="record-btn" type="button" aria-label="شروع ضبط">
                  🎤
                </button>
                <div class="audio-recorder__timer" id="record-timer" aria-live="polite">00:00</div>
                <div class="audio-waveform" id="audio-waveform" aria-hidden="true">
                  ${Array.from({length: 20}).map(() => `<div class="audio-waveform__bar" style="height:${Math.random()*24+4}px"></div>`).join('')}
                </div>
                <p class="audio-recorder__hint">برای شروع ضبط کلیک کنید یا فایل صوتی آپلود کنید</p>
                <label class="btn btn--outline btn--sm" style="margin-top:var(--space-3);cursor:pointer" for="audio-upload">
                  📁 آپلود فایل صوتی
                  <input type="file" id="audio-upload" accept="audio/*" style="display:none" aria-label="آپلود فایل صوتی"/>
                </label>
              </div>
              <!-- Player برای فایل آپلود‌شده -->
              <div class="audio-player" id="audio-player" style="display:none" role="region" aria-label="پخش صوت">
                <button class="audio-player__btn" id="play-btn" type="button" aria-label="پخش">▶</button>
                <div class="audio-player__progress" id="audio-progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">
                  <div class="audio-player__progress-fill" id="progress-fill"></div>
                </div>
                <span class="audio-player__time" id="audio-time" aria-live="polite">00:00</span>
                <button class="btn btn--icon btn--ghost btn--sm" id="delete-audio-btn" type="button" aria-label="حذف صوت">🗑</button>
              </div>
            </div>

            <!-- ────── ویدیو استاد ────── -->
            <div class="admin-field" style="margin-top:var(--space-5)">
              <label class="admin-label">
                ویدیو استاد
                <span class="admin-label-hint">فایل اصلی فارسی — سایت خودکار دوبله و صوت استخراج می‌کند</span>
              </label>

              <!-- آپلود ویدیو -->
              <div style="
                border:2px dashed var(--border-color);border-radius:var(--radius-lg);
                padding:var(--space-5);text-align:center;margin-bottom:var(--space-4);
                transition:border-color 0.2s;
              " id="video-drop-zone">
                <div style="font-size:36px;margin-bottom:var(--space-2)" aria-hidden="true">🎬</div>
                <div style="font-size:var(--text-sm);font-weight:600;color:var(--text-primary);margin-bottom:var(--space-1)">
                  ویدیو را اینجا بکشید یا انتخاب کنید
                </div>
                <div style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:var(--space-3)">
                  فرمت‌های پشتیبانی: MP4، WebM، MOV — حداکثر ۵۰۰ مگابایت
                </div>
                <label class="btn btn--outline btn--sm" style="cursor:pointer" for="video-upload">
                  📁 انتخاب فایل ویدیو
                  <input type="file" id="video-upload" accept="video/mp4,video/webm,video/quicktime" style="display:none" aria-label="آپلود فایل ویدیو"/>
                </label>
              </div>

              <!-- یا URL مستقیم -->
              <div class="admin-field" style="margin-bottom:var(--space-3)">
                <label class="admin-label" for="video-url-input" style="font-size:var(--text-xs)">
                  یا URL مستقیم ویدیو (CDN / سرور)
                </label>
                <input type="url" class="admin-input" id="video-url-input"
                  dir="ltr" placeholder="https://cdn.example.com/videos/ayah-1-1.mp4"
                  aria-label="URL ویدیو"/>
              </div>

              <!-- پیش‌نمایش ویدیو آپلودشده -->
              <div id="video-preview-wrap" style="display:none;margin-bottom:var(--space-4)">
                <div style="font-size:var(--text-xs);color:var(--color-primary-600);font-weight:600;margin-bottom:var(--space-2);display:flex;align-items:center;gap:6px">
                  <span>✅</span> ویدیو آماده است
                </div>
                <video id="video-preview" controls
                  style="width:100%;max-height:300px;border-radius:var(--radius-lg);background:#000;display:block"
                  aria-label="پیش‌نمایش ویدیو"
                ></video>
                <div style="margin-top:var(--space-2);display:flex;gap:var(--space-2)">
                  <button class="btn btn--ghost btn--sm" id="video-remove-btn" type="button">🗑 حذف ویدیو</button>
                </div>
              </div>

              <!-- وضعیت دوبله -->
              <div style="
                background:var(--bg-surface-2);border:1px solid var(--border-color);
                border-radius:var(--radius-lg);padding:var(--space-4);
              ">
                <div style="font-size:var(--text-sm);font-weight:700;color:var(--text-primary);margin-bottom:var(--space-3);display:flex;align-items:center;gap:6px">
                  🤖 وضعیت دوبله خودکار
                  <span style="font-size:var(--text-xs);color:var(--text-muted);font-weight:400">(بعد از ذخیره، AI خودکار شروع می‌کند)</span>
                </div>
                <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:var(--space-2)" id="dubbing-status-grid">
                  ${[
                    {lang:'ar', flag:'🇸🇦', name:'عربی'},
                    {lang:'ur', flag:'🇵🇰', name:'اردو'},
                    {lang:'az', flag:'🇦🇿', name:'آذری'},
                    {lang:'tr', flag:'🇹🇷', name:'ترکی'},
                    {lang:'ru', flag:'🇷🇺', name:'روسی'},
                    {lang:'en', flag:'🇺🇸', name:'انگلیسی'},
                    {lang:'id', flag:'🇮🇩', name:'اندونزیایی'},
                  ].map(l => `
                    <div class="dubbing-lang-card" data-lang="${l.lang}" style="
                      background:var(--bg-surface);border:1px solid var(--border-color);
                      border-radius:var(--radius-md);padding:var(--space-3);
                      display:flex;align-items:center;justify-content:space-between;gap:var(--space-2);
                    ">
                      <div style="display:flex;align-items:center;gap:var(--space-2)">
                        <span style="font-size:18px">${l.flag}</span>
                        <span style="font-size:var(--text-sm);font-weight:600">${l.name}</span>
                      </div>
                      <div class="dubbing-lang-status" data-lang="${l.lang}" style="display:flex;align-items:center;gap:4px">
                        <span style="width:8px;height:8px;border-radius:50%;background:var(--color-neutral-300)" aria-hidden="true"></span>
                        <span style="font-size:var(--text-xs);color:var(--text-muted)">در انتظار</span>
                      </div>
                    </div>
                  `).join('')}
                </div>

                <!-- دکمه شروع دوبله دستی -->
                <div style="margin-top:var(--space-3);display:flex;gap:var(--space-2);flex-wrap:wrap">
                  <button class="btn btn--primary btn--sm" id="start-dubbing-btn" type="button" disabled>
                    🎙 شروع دوبله خودکار
                  </button>
                  <button class="btn btn--outline btn--sm" id="extract-audio-btn" type="button" disabled>
                    🔊 استخراج صوت از ویدیو
                  </button>
                </div>
              </div>

              <!-- دانلود نسخه‌های دوبله‌شده -->
              <div style="
                margin-top:var(--space-4);
                background:linear-gradient(135deg,rgba(42,157,143,0.06),rgba(42,157,143,0.02));
                border:1px solid rgba(42,157,143,0.2);
                border-radius:var(--radius-lg);padding:var(--space-4);
              " id="dubbed-downloads-wrap" style="display:none">
                <div style="font-size:var(--text-sm);font-weight:700;color:var(--color-primary-700);margin-bottom:var(--space-3);display:flex;align-items:center;gap:6px">
                  📥 دانلود نسخه‌های دوبله‌شده
                </div>
                <div style="display:flex;flex-direction:column;gap:var(--space-2)" id="dubbed-download-list">
                  ${[
                    {lang:'fa', flag:'🇮🇷', name:'فارسی (اصلی)'},
                    {lang:'ar', flag:'🇸🇦', name:'عربی'},
                    {lang:'ur', flag:'🇵🇰', name:'اردو'},
                    {lang:'az', flag:'🇦🇿', name:'آذری'},
                    {lang:'tr', flag:'🇹🇷', name:'ترکی'},
                    {lang:'ru', flag:'🇷🇺', name:'روسی'},
                    {lang:'en', flag:'🇺🇸', name:'انگلیسی'},
                    {lang:'id', flag:'🇮🇩', name:'اندونزیایی'},
                  ].map(l => `
                    <div style="
                      display:flex;align-items:center;gap:var(--space-3);
                      padding:var(--space-2) var(--space-3);
                      background:var(--bg-surface);border:1px solid var(--border-color);
                      border-radius:var(--radius-md);
                    " id="download-row-${l.lang}">
                      <span style="font-size:18px">${l.flag}</span>
                      <span style="flex:1;font-size:var(--text-sm);font-weight:600">${l.name}</span>
                      <div style="display:flex;gap:var(--space-2)">
                        <!-- دانلود ویدیو -->
                        <a href="#" class="btn btn--outline btn--sm dubbed-video-download" data-lang="${l.lang}"
                          style="pointer-events:none;opacity:0.4"
                          aria-label="دانلود ویدیو ${l.name}"
                          download>
                          🎬 ویدیو
                        </a>
                        <!-- دانلود صوت -->
                        <a href="#" class="btn btn--outline btn--sm dubbed-audio-download" data-lang="${l.lang}"
                          style="pointer-events:none;opacity:0.4"
                          aria-label="دانلود صوت ${l.name}"
                          download>
                          🎤 صوت
                        </a>
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>

            </div>

            <!-- دکمه‌ها -->
            <div class="flex gap-3 flex-wrap" style="margin-top:var(--space-4)">
              <button class="btn btn--primary btn--lg" id="save-ayah-btn" type="button">
                💾 ذخیره و انتشار
              </button>
              <button class="btn btn--outline btn--lg" id="draft-ayah-btn" type="button">
                📝 ذخیره پیش‌نویس
              </button>
              <button class="btn btn--ghost btn--lg" id="preview-ayah-btn" type="button">
                👁 پیش‌نمایش
              </button>
            </div>

          </div>
        </div>

        <!-- لیست تدبرات موجود -->
        <div class="admin-table-wrap">
          <div class="admin-table-header">
            <div class="admin-table-title">📚 تدبرات منتشرشده</div>
          </div>
          <div id="ayah-list-container">
            <div style="text-align:center;padding:var(--space-8);color:var(--text-muted)">
              تدبری منتشر نشده است
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /* ────────────────────────────────────────────────────────
     PRAYERS ADMIN PAGE
     ──────────────────────────────────────────────────────── */
  function _renderPrayersAdmin() {
    const orders  = _getOrders();
    const pending = orders.filter(o => o.status === 'pending');

    return `
      <div>
        <div class="admin-page-header">
          <div>
            <h1 class="admin-page-title"><span class="admin-page-title__icon">🤲</span> مدیریت سفارش‌های دعا</h1>
            <p class="admin-page-desc">${pending.length} سفارش در انتظار تأیید</p>
          </div>
        </div>

        <!-- پیام تأیید سفارش (قابل تنظیم) -->
        <div class="admin-panel" style="margin-bottom:var(--space-5)">
          <div class="admin-panel__header">
            <div class="admin-panel__title">📨 متن پیام تأیید سفارش <span style="font-size:var(--text-sm);color:var(--text-muted);font-weight:normal">(۱۵ دقیقه بعد از ثبت)</span></div>
          </div>
          <div class="admin-panel__body">
            <p style="font-size:var(--text-sm);color:var(--text-muted);margin-bottom:var(--space-3)">
              متغیرها: <code>{نام}</code> نام کاربر | <code>{دعا}</code> نام دعا | <code>{کد}</code> کد پیگیری
            </p>
            <textarea class="admin-textarea" id="confirm-msg-template" rows="5"
              placeholder="سلام {نام} عزیز، سفارش شما برای {دعا} با کد {کد} دریافت شد..."
              aria-label="متن پیام تأیید سفارش"
            ></textarea>
            <button class="btn btn--primary btn--sm" style="margin-top:var(--space-3)" id="save-confirm-msg">💾 ذخیره متن پیام</button>
          </div>
        </div>

        <!-- پیام انجام دعا (قابل تنظیم) -->
        <div class="admin-panel" style="margin-bottom:var(--space-5)">
          <div class="admin-panel__header">
            <div class="admin-panel__title">✅ متن پیام «دعا انجام شد»</div>
          </div>
          <div class="admin-panel__body">
            <p style="font-size:var(--text-sm);color:var(--text-muted);margin-bottom:var(--space-3)">
              متغیرها: <code>{نام}</code> | <code>{دعا}</code>
            </p>
            <textarea class="admin-textarea" id="done-msg-template" rows="5"
              placeholder="{نام} عزیز، {دعا} به نیابت از شما در حرم مطهر قرائت شد..."
              aria-label="متن پیام انجام دعا"
            ></textarea>
            <button class="btn btn--primary btn--sm" style="margin-top:var(--space-3)" id="save-done-msg">💾 ذخیره</button>
          </div>
        </div>

        <!-- جدول سفارش‌ها با ارسال دسته‌جمعی -->
        <div class="admin-table-wrap">
          <div class="admin-table-header">
            <div class="admin-table-title">📋 سفارش‌های در انتظار</div>
            <div class="flex gap-2">
              <!-- دکمه دسته‌جمعی برای هر دعا -->
              ${_buildBulkButtons(orders)}
            </div>
          </div>
          <div style="overflow-x:auto">
            <table class="admin-table" aria-label="سفارش‌های دعا">
              <thead>
                <tr>
                  <th><input type="checkbox" id="select-all" aria-label="انتخاب همه"/></th>
                  <th>کاربر</th>
                  <th>دعا</th>
                  <th>نیابت</th>
                  <th>هدف</th>
                  <th>زبان</th>
                  <th>تاریخ</th>
                  <th>وضعیت</th>
                  <th>عملیات</th>
                </tr>
              </thead>
              <tbody>
                ${orders.length === 0
                  ? `<tr><td colspan="9" style="text-align:center;color:var(--text-muted);padding:var(--space-8)">سفارشی وجود ندارد</td></tr>`
                  : orders.map(o => `
                    <tr data-order-id="${o.id}">
                      <td><input type="checkbox" class="order-checkbox" value="${o.id}" aria-label="انتخاب سفارش ${o.id}"/></td>
                      <td>
                        <div style="font-size:var(--text-sm);font-weight:var(--weight-semibold)">${o.personName || '—'}</div>
                        <div style="font-size:var(--text-xs);color:var(--text-muted)">${o.userId}</div>
                      </td>
                      <td>${o.prayerName || o.type}</td>
                      <td>${o.intentType === 'myself' ? '🙋 خودم' : '👤 دیگری'}</td>
                      <td style="font-size:18px">${(o.purposes || []).map(p => ({healing:'💊',sins:'🌿',success:'🌟',thanks:'🙏'})[p] ?? p).join(' ')}</td>
                      <td>${LANG_INFO[o.userLang]?.flag ?? '🌐'}</td>
                      <td style="font-size:var(--text-xs)">${new Date(o.createdAt).toLocaleDateString('fa-IR')}</td>
                      <td><span class="admin-badge admin-badge--${o.status === 'done' ? 'done' : o.status === 'active' ? 'active' : 'pending'}">${o.status === 'done' ? 'انجام شد' : o.status === 'active' ? 'در حال انجام' : 'در انتظار'}</span></td>
                      <td>
                        ${o.status !== 'done' ? `
                          <button class="btn btn--primary btn--sm mark-done-btn" data-order-id="${o.id}" aria-label="تأیید انجام سفارش">✓ انجام شد</button>
                        ` : '<span style="color:var(--text-muted);font-size:var(--text-xs)">تکمیل شد</span>'}
                      </td>
                    </tr>
                  `).join('')
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }

  function _buildBulkButtons(orders) {
    const prayerGroups = {};
    orders.filter(o => o.status !== 'done').forEach(o => {
      const key = o.prayerName || o.type;
      if (!prayerGroups[key]) prayerGroups[key] = [];
      prayerGroups[key].push(o.id);
    });
    return Object.entries(prayerGroups).map(([name, ids]) => `
      <button class="btn btn--outline btn--sm bulk-done-btn"
        data-prayer="${name}"
        data-ids="${ids.join(',')}"
        aria-label="ارسال پیام انجام دعا برای همه ${name}">
        ✓ همه ${name} (${ids.length})
      </button>
    `).join('');
  }

  /* ────────────────────────────────────────────────────────
     MEETING ADMIN PAGE
     ──────────────────────────────────────────────────────── */
  function _renderMeetingAdmin() {
    const meetings = _getMeetings();
    const confirmed = meetings.filter(m => m.response === 'yes');

    return `
      <div>
        <div class="admin-page-header">
          <div>
            <h1 class="admin-page-title"><span class="admin-page-title__icon">🕌</span> مدیریت دیدار با شیخ</h1>
            <p class="admin-page-desc">${confirmed.length} نفر تأیید کرده‌اند</p>
          </div>
        </div>

        <!-- وضعیت فعال/غیرفعال -->
        <div class="admin-panel" style="margin-bottom:var(--space-5)">
          <div class="admin-panel__header">
            <div class="admin-panel__title">⚙️ تنظیمات دیدار</div>
          </div>
          <div class="admin-panel__body">
            <div class="flex gap-6 flex-wrap" style="margin-bottom:var(--space-5)">
              <label class="admin-toggle" for="meeting-active-toggle" aria-label="فعال بودن دیدار">
                <input type="checkbox" id="meeting-active-toggle" checked/>
                <div class="admin-toggle__track"><div class="admin-toggle__thumb"></div></div>
                <span class="admin-toggle__label">دیدار فعال است</span>
              </label>
            </div>

            <!-- متن غیرفعال -->
            <div class="admin-field">
              <label class="admin-label" for="inactive-msg">متن هنگام غیرفعال بودن دیدار</label>
              <textarea class="admin-textarea" id="inactive-msg" rows="3"
                placeholder="در حال حاضر دیداری با شیخ برنامه‌ریزی نشده است..."
                aria-label="متن غیرفعال بودن دیدار"
              ></textarea>
            </div>

            <!-- متن پیام تأیید -->
            <div class="admin-field">
              <label class="admin-label" for="meeting-confirm-msg">متن پیام تأیید دیدار <span class="admin-label-hint">بعد از زدن «بله می‌آیم»</span></label>
              <textarea class="admin-textarea" id="meeting-confirm-msg" rows="6"
                placeholder="کاربر گرامی، خوش آمدید..."
                aria-label="متن پیام تأیید دیدار"
              ></textarea>
            </div>

            <button class="btn btn--primary" id="save-meeting-settings" type="button">💾 ذخیره تنظیمات</button>
          </div>
        </div>

        <!-- لیست تأییدکنندگان -->
        <div class="admin-table-wrap">
          <div class="admin-table-header">
            <div class="admin-table-title">✅ کاربران تأییدکننده (${confirmed.length} نفر)</div>
          </div>
          <div style="overflow-x:auto">
            <table class="admin-table" aria-label="تأییدکنندگان دیدار">
              <thead>
                <tr><th>نام</th><th>ایمیل</th><th>زبان</th><th>تاریخ ثبت</th></tr>
              </thead>
              <tbody>
                ${confirmed.length === 0
                  ? `<tr><td colspan="4" style="text-align:center;color:var(--text-muted);padding:var(--space-6)">هنوز کسی تأیید نکرده</td></tr>`
                  : confirmed.map(m => `
                    <tr>
                      <td>${m.userName || '—'}</td>
                      <td style="direction:ltr;font-size:var(--text-xs)">${m.userEmail || '—'}</td>
                      <td>${LANG_INFO[m.userLang]?.flag ?? '🌐'} ${LANG_INFO[m.userLang]?.name ?? '—'}</td>
                      <td style="font-size:var(--text-xs)">${new Date(m.timestamp).toLocaleDateString('fa-IR')}</td>
                    </tr>
                  `).join('')
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }

  /* ────────────────────────────────────────────────────────
     MESSAGES PAGE
     ──────────────────────────────────────────────────────── */
  function _renderMessages() {
    return `
      <div>
        <div class="admin-page-header">
          <h1 class="admin-page-title"><span class="admin-page-title__icon">📨</span> مدیریت پیام‌ها</h1>
        </div>
        <div class="empty-state">
          <span class="empty-state__icon">📨</span>
          <h3 class="empty-state__title">پیام‌های مشاوره و استخاره اینجا نمایش داده می‌شود</h3>
          <p class="empty-state__desc">بعد از ساخت قسمت مشاوره و استخاره فعال می‌شود</p>
        </div>
      </div>
    `;
  }

  /* ────────────────────────────────────────────────────────
     PRIZES PAGE
     ──────────────────────────────────────────────────────── */
  function _renderPrizes() {
    return `
      <div>
        <div class="admin-page-header">
          <div>
            <h1 class="admin-page-title"><span class="admin-page-title__icon">🎁</span> سیستم جایزه</h1>
            <p class="admin-page-desc">تنظیم شرایط جایزه برای کاربرانی که دوستان معرفی می‌کنند</p>
          </div>
          <button class="btn btn--outline btn--sm" id="prizes-refresh-btn">↺ بارگذاری مجدد</button>
        </div>

        <!-- آمار کلی معرف‌ها -->
        <div id="prizes-stats-wrap" style="margin-bottom:var(--space-5)">
          <div style="color:var(--text-muted);font-size:var(--text-sm);padding:12px">در حال بارگذاری آمار...</div>
        </div>

        <!-- جوایز عمومی — بازدید سایت -->
        <div class="admin-panel" style="margin-bottom:var(--space-5)">
          <div class="admin-panel__header">
            <div class="admin-panel__title">🌐 جوایز بازدید — هر X نفر ورودی از طرف کاربر</div>
          </div>
          <div class="admin-panel__body">
            <div id="global-prizes-list"></div>
            <button class="btn btn--outline btn--sm" id="add-global-prize-btn" style="margin-top:12px">+ افزودن جایزه جدید</button>
          </div>
        </div>

        <!-- جوایز بخشی — خرید اشتراک -->
        <div class="admin-panel" style="margin-bottom:var(--space-5)">
          <div class="admin-panel__header">
            <div class="admin-panel__title">📖 جوایز اشتراک — هر X نفر خریدار از طرف کاربر</div>
          </div>
          <div class="admin-panel__body">
            <div id="section-prizes-list"></div>
            <button class="btn btn--outline btn--sm" id="add-section-prize-btn" style="margin-top:12px">+ افزودن جایزه بخشی</button>
          </div>
        </div>

        <button class="btn btn--primary btn--lg" id="save-prizes-btn">💾 ذخیره همه تنظیمات جوایز</button>
      </div>
    `;
  }

  function _bindPrizesEvents() {
    const ADMIN_KEY = localStorage.getItem('mh_admin_token') || '';
    let prizeConfig = { global: [], sections: [] };

    /* بارگذاری تنظیمات -->  */
    async function _loadPrizes() {
      try {
        const res  = await fetch('/api/referral/prizes');
        const data = await res.json();
        if (data.success) {
          prizeConfig = data.prizes;
          _renderPrizeLists();
        }
      } catch { _showAdminToast('خطا در بارگذاری جوایز', false); }

      /* آمار -->  */
      try {
        const res  = await fetch('/api/referral/admin/list', {
          headers: { 'x-api-key': ADMIN_KEY },
        });
        const data = await res.json();
        const wrap = document.getElementById('prizes-stats-wrap');
        if (wrap && data.success) {
          wrap.innerHTML = `
            <div class="admin-stats-grid">
              ${[
                { label: 'کل کاربران معرف', num: data.totalUsers,  color: 'teal',   icon: '👥' },
                { label: 'کل جوایز داده‌شده', num: data.referrals?.reduce((a,r)=>a+r.totalRewards,0)??0, color: 'green', icon: '🎁' },
                { label: 'کل معرفی‌ها', num: data.referrals?.reduce((a,r)=>a+r.totalReferrals,0)??0, color: 'purple', icon: '🔗' },
              ].map(s => `
                <div class="admin-stat-card admin-stat-card--${s.color}">
                  <div class="admin-stat-card__header">
                    <span class="admin-stat-card__label">${s.label}</span>
                    <div class="admin-stat-card__icon">${s.icon}</div>
                  </div>
                  <div class="admin-stat-card__num">${s.num}</div>
                </div>
              `).join('')}
            </div>
          `;
        }
      } catch {}
    }

    function _prizeRow(prize, type) {
      const sections = { quran: 'دانشگاه قرآن', prayer: 'سفارش دعا', meeting: 'دیدار شیخ' };
      return `
        <div class="admin-panel" style="margin-bottom:10px;background:var(--bg-surface-2)" data-prize-id="${prize.id}" data-prize-type="${type}">
          <div class="admin-panel__body">
            <div class="grid grid--2" style="gap:var(--space-3);align-items:end">
              <div class="admin-field">
                <label class="admin-label">تعداد معرفی برای جایزه</label>
                <input type="number" class="admin-input prize-threshold" value="${prize.threshold}" min="1" placeholder="مثلاً: ۱۰"/>
              </div>
              <div class="admin-field">
                <label class="admin-label">جایزه (ماه اشتراک رایگان)</label>
                <input type="number" class="admin-input prize-duration" value="${parseInt(prize.reward.match(/\d+/)?.[0]??'1')}" min="1" max="12" placeholder="۱"/>
              </div>
              ${type === 'section' ? `
                <div class="admin-field">
                  <label class="admin-label">بخش</label>
                  <select class="admin-input prize-section">
                    ${Object.entries(sections).map(([k,v])=>`<option value="${k}" ${prize.section===k?'selected':''}>${v}</option>`).join('')}
                  </select>
                </div>
              ` : ''}
              <div class="admin-field">
                <label class="admin-label">وضعیت</label>
                <label class="admin-toggle">
                  <input type="checkbox" class="prize-active" ${prize.active ? 'checked' : ''}/>
                  <div class="admin-toggle__track"><div class="admin-toggle__thumb"></div></div>
                  <span class="admin-toggle__label">${prize.active ? 'فعال' : 'غیرفعال'}</span>
                </label>
              </div>
              <div style="display:flex;align-items:flex-end">
                <button class="btn btn--ghost btn--sm remove-prize-btn" style="color:var(--color-error)" data-id="${prize.id}" data-type="${type}">✕ حذف</button>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    function _renderPrizeLists() {
      const gList = document.getElementById('global-prizes-list');
      const sList = document.getElementById('section-prizes-list');
      if (gList) gList.innerHTML = prizeConfig.global.map(p => _prizeRow(p, 'global')).join('') || '<div style="color:var(--text-muted);font-size:13px">جایزه‌ای تعریف نشده</div>';
      if (sList) sList.innerHTML = prizeConfig.sections.map(p => _prizeRow(p, 'section')).join('') || '<div style="color:var(--text-muted);font-size:13px">جایزه‌ای تعریف نشده</div>';
      _bindPrizeRowEvents();
    }

    function _bindPrizeRowEvents() {
      document.querySelectorAll('.remove-prize-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const { id, type } = btn.dataset;
          if (type === 'global') prizeConfig.global = prizeConfig.global.filter(p => p.id !== id);
          else prizeConfig.sections = prizeConfig.sections.filter(p => p.id !== id);
          _renderPrizeLists();
        });
      });
    }

    function _newId() { return 'p_' + Math.random().toString(36).slice(2, 8); }

    /* افزودن جایزه عمومی -->  */
    document.getElementById('add-global-prize-btn')?.addEventListener('click', () => {
      prizeConfig.global.push({ id: _newId(), type: 'visit', threshold: 10, reward: 'premium_1month', section: null, active: true });
      _renderPrizeLists();
    });

    /* افزودن جایزه بخشی -->  */
    document.getElementById('add-section-prize-btn')?.addEventListener('click', () => {
      prizeConfig.sections.push({ id: _newId(), type: 'purchase', threshold: 3, reward: 'quran_1month', section: 'quran', active: true });
      _renderPrizeLists();
    });

    /* ذخیره -->  */
    document.getElementById('save-prizes-btn')?.addEventListener('click', async () => {
      /* جمع‌آوری مقادیر از فرم */
      const updatedGlobal = [];
      document.querySelectorAll('[data-prize-type="global"]').forEach(row => {
        const id       = row.dataset.prizeId;
        const orig     = prizeConfig.global.find(p => p.id === id) ?? {};
        const threshold = parseInt(row.querySelector('.prize-threshold')?.value ?? '10');
        const duration  = parseInt(row.querySelector('.prize-duration')?.value ?? '1');
        const active    = row.querySelector('.prize-active')?.checked ?? true;
        updatedGlobal.push({ ...orig, threshold, reward: `premium_${duration}month`, active });
      });

      const updatedSections = [];
      document.querySelectorAll('[data-prize-type="section"]').forEach(row => {
        const id       = row.dataset.prizeId;
        const orig     = prizeConfig.sections.find(p => p.id === id) ?? {};
        const threshold = parseInt(row.querySelector('.prize-threshold')?.value ?? '3');
        const duration  = parseInt(row.querySelector('.prize-duration')?.value ?? '1');
        const section   = row.querySelector('.prize-section')?.value ?? 'quran';
        const active    = row.querySelector('.prize-active')?.checked ?? true;
        updatedSections.push({ ...orig, threshold, reward: `${section}_${duration}month`, section, active });
      });

      try {
        const res  = await fetch('/api/referral/admin/prizes', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json', 'x-api-key': ADMIN_KEY },
          body:    JSON.stringify({ global: updatedGlobal, sections: updatedSections }),
        });
        const data = await res.json();
        if (data.success) {
          prizeConfig = data.prizes;
          _renderPrizeLists();
          _showAdminToast('✓ تنظیمات جوایز ذخیره شد');
        } else {
          _showAdminToast('خطا در ذخیره', false);
        }
      } catch { _showAdminToast('خطای شبکه', false); }
    });

    /* بارگذاری مجدد -->  */
    document.getElementById('prizes-refresh-btn')?.addEventListener('click', _loadPrizes);

    _loadPrizes();
  }

  /* ────────────────────────────────────────────────────────
     SETTINGS PAGE
     ──────────────────────────────────────────────────────── */
  function _renderSettings() {
    return `
      <div>
        <div class="admin-page-header">
          <h1 class="admin-page-title"><span class="admin-page-title__icon">⚙️</span> تنظیمات سایت</h1>
        </div>

        <div class="grid grid--2" style="gap:var(--space-5)">

          <!-- تنظیمات عمومی -->
          <div class="admin-panel">
            <div class="admin-panel__header">
              <div class="admin-panel__title">🌐 تنظیمات عمومی</div>
            </div>
            <div class="admin-panel__body">
              <div class="admin-field">
                <label class="admin-label">وضعیت سایت</label>
                <label class="admin-toggle">
                  <input type="checkbox" checked/>
                  <div class="admin-toggle__track"><div class="admin-toggle__thumb"></div></div>
                  <span class="admin-toggle__label">سایت آنلاین است</span>
                </label>
              </div>
              <div class="admin-field">
                <label class="admin-label">ثبت‌نام کاربر جدید</label>
                <label class="admin-toggle">
                  <input type="checkbox" checked/>
                  <div class="admin-toggle__track"><div class="admin-toggle__thumb"></div></div>
                  <span class="admin-toggle__label">ثبت‌نام باز است</span>
                </label>
              </div>
            </div>
          </div>

          <!-- تنظیمات AI -->
          <div class="admin-panel">
            <div class="admin-panel__header">
              <div class="admin-panel__title">🤖 تنظیمات هوش مصنوعی</div>
            </div>
            <div class="admin-panel__body">
              <div class="admin-field">
                <label class="admin-label" for="claude-api-key">Claude API Key <span class="admin-label-hint">(ترجمه متن)</span></label>
                <input type="password" class="admin-input" id="claude-api-key" placeholder="sk-ant-..." dir="ltr" autocomplete="off"/>
              </div>
              <div class="admin-field">
                <label class="admin-label" for="elevenlabs-key">ElevenLabs API Key <span class="admin-label-hint">(دوبله صدا)</span></label>
                <input type="password" class="admin-input" id="elevenlabs-key" placeholder="بعداً وارد کنید" dir="ltr" autocomplete="off"/>
              </div>
              <div class="admin-field">
                <label class="admin-label" for="voice-id">Voice ID استاد <span class="admin-label-hint">(از ElevenLabs)</span></label>
                <input type="text" class="admin-input" id="voice-id" placeholder="بعد از ثبت‌نام در ElevenLabs" dir="ltr"/>
              </div>
              <button class="btn btn--primary btn--sm" type="button">💾 ذخیره API Keys</button>
            </div>
          </div>

        </div>
      </div>
    `;
  }

  /* ────────────────────────────────────────────────────────
     EVENT BINDINGS
     ──────────────────────────────────────────────────────── */
  function _bindEvents() {
    /* Sidebar navigation */
    container.querySelectorAll('[data-page]').forEach(btn => {
      btn.addEventListener('click', () => {
        _activePage = btn.dataset.page;
        container.querySelectorAll('[data-page]').forEach(b => {
          b.classList.toggle('admin-nav__item--active', b.dataset.page === _activePage);
        });
        const contentEl = document.getElementById('admin-content');
        const breadcrumb = document.getElementById('breadcrumb-current');
        const label = ADMIN_NAV.flatMap(s=>s.items).find(i=>i.id===_activePage)?.label ?? '';
        if (breadcrumb) breadcrumb.textContent = label;
        if (contentEl) {
          contentEl.style.opacity = '0';
          setTimeout(() => {
            contentEl.innerHTML = _renderPage(_activePage, _getStats());
            contentEl.style.opacity = '1';
            contentEl.style.transition = 'opacity 0.2s ease';
            _bindContentEvents();
          }, 150);
        }
      });
    });

    /* Sidebar toggle */
    document.getElementById('sidebar-toggle')?.addEventListener('click', () => {
      _sidebarOpen = !_sidebarOpen;
      document.getElementById('admin-shell')?.classList.toggle('admin-shell--collapsed', !_sidebarOpen);
    });

    /* Logout */
    document.getElementById('admin-logout-btn')?.addEventListener('click', () => {
      if (confirm('آیا می‌خواهید از پنل ادمین خارج شوید؟')) adminLogout();
    });

    _bindContentEvents();
  }

  function _bindContentEvents() {
    /* Mark done single order */
    container.querySelectorAll('.mark-done-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.orderId;
        _markOrderDone(id);
        btn.textContent = '✓ انجام شد';
        btn.disabled = true;
        btn.closest('tr')?.querySelector('.admin-badge')?.setAttribute('class', 'admin-badge admin-badge--done');
        btn.closest('tr')?.querySelector('.admin-badge') && (btn.closest('tr').querySelector('.admin-badge').textContent = 'انجام شد');
        _showAdminToast('✓ سفارش تأیید شد و پیام ارسال شد', 'success');
      });
    });

    /* Bulk done */
    container.querySelectorAll('.bulk-done-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const ids      = btn.dataset.ids.split(',');
        const prayer   = btn.dataset.prayer;
        if (!confirm(`آیا مطمئن هستید که برای ${ids.length} نفر پیام «${prayer} انجام شد» ارسال شود؟`)) return;
        ids.forEach(id => _markOrderDone(id));
        _showAdminToast(`✓ برای ${ids.length} نفر پیام ارسال شد`, 'success');
        /* refresh */
        setTimeout(() => {
          const el = document.getElementById('admin-content');
          if (el) { el.innerHTML = _renderPage('prayers', _getStats()); _bindContentEvents(); }
        }, 800);
      });
    });

    /* Audio recorder */
    _initAudioRecorder();

    /* Save meeting settings */
    document.getElementById('save-meeting-settings')?.addEventListener('click', () => {
      _showAdminToast('✓ تنظیمات دیدار ذخیره شد', 'success');
    });

    /* ── ویدیو آپلود و مدیریت دوبله ── */
    _initVideoManager();

    /* Save quran ayah */
    document.getElementById('save-ayah-btn')?.addEventListener('click', () => {
      const surahNum = document.getElementById('surah-num')?.value;
      const ayahNum  = document.getElementById('ayah-num')?.value;
      const arabic   = document.getElementById('ayah-arabic')?.value;
      const summary  = document.getElementById('ayah-summary')?.value;
      const tadabbur = document.getElementById('ayah-tadabbur')?.value;

      if (!surahNum || !ayahNum || !arabic || !summary || !tadabbur) {
        _showAdminToast('⚠ لطفاً همه فیلدها را پر کنید', 'error');
        return;
      }

      /* ذخیره URL ویدیو در localStorage برای این آیه */
      const videoUrl = document.getElementById('video-url-input')?.value?.trim() || '';
      const ayahKey  = `quran_ayah_${surahNum}_${ayahNum}`;
      try {
        const existing = JSON.parse(localStorage.getItem(ayahKey) || '{}');
        existing.videoUrl = videoUrl;
        existing.surahNum = surahNum;
        existing.ayahNum  = ayahNum;
        existing.updatedAt = new Date().toISOString();
        localStorage.setItem(ayahKey, JSON.stringify(existing));
      } catch {}

      _showAdminToast('✓ تدبر با موفقیت منتشر شد', 'success');
    });

    /* prizes page */
    if (document.getElementById('save-prizes-btn')) _bindPrizesEvents();
  }

  /* Mark order as done */
  function _markOrderDone(orderId) {
    try {
      const orders = JSON.parse(localStorage.getItem('mh_orders') || '[]');
      const idx    = orders.findIndex(o => o.id === orderId);
      if (idx !== -1) {
        orders[idx].status    = 'done';
        orders[idx].doneAt    = new Date().toISOString();
        localStorage.setItem('mh_orders', JSON.stringify(orders));
      }
    } catch {}
  }

  /* ────────────────────────────────────────────────────────
     AUDIO RECORDER
     ──────────────────────────────────────────────────────── */
  function _initAudioRecorder() {
    let mediaRecorder = null;
    let recordingInterval = null;
    let seconds = 0;
    let isRecording = false;

    const recordBtn   = document.getElementById('record-btn');
    const timerEl     = document.getElementById('record-timer');
    const recorderEl  = document.getElementById('audio-recorder');
    const playerEl    = document.getElementById('audio-player');
    const audioUpload = document.getElementById('audio-upload');

    if (!recordBtn) return;

    recordBtn.addEventListener('click', async () => {
      if (!isRecording) {
        /* شروع ضبط */
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          mediaRecorder = new MediaRecorder(stream);
          const chunks  = [];
          mediaRecorder.ondataavailable = e => chunks.push(e.data);
          mediaRecorder.onstop = () => {
            const blob = new Blob(chunks, { type: 'audio/webm' });
            _showAudioPlayer(blob);
          };
          mediaRecorder.start();
          isRecording = true;
          recorderEl?.classList.add('audio-recorder--recording');
          recordBtn.textContent = '⏹';
          recordBtn.classList.add('audio-recorder__btn--recording');
          recordBtn.setAttribute('aria-label', 'توقف ضبط');
          seconds = 0;
          recordingInterval = setInterval(() => {
            seconds++;
            const m = Math.floor(seconds/60).toString().padStart(2,'0');
            const s = (seconds%60).toString().padStart(2,'0');
            if (timerEl) timerEl.textContent = `${m}:${s}`;
          }, 1000);
        } catch {
          _showAdminToast('⚠ دسترسی به میکروفون رد شد', 'error');
        }
      } else {
        /* توقف ضبط */
        mediaRecorder?.stop();
        mediaRecorder?.stream?.getTracks().forEach(t => t.stop());
        isRecording = false;
        clearInterval(recordingInterval);
        recorderEl?.classList.remove('audio-recorder--recording');
        recordBtn.textContent = '🎤';
        recordBtn.classList.remove('audio-recorder__btn--recording');
        recordBtn.setAttribute('aria-label', 'شروع ضبط');
      }
    });

    /* آپلود فایل */
    audioUpload?.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (file) _showAudioPlayer(file);
    });

    function _showAudioPlayer(source) {
      const url = URL.createObjectURL(source);
      const audio = new Audio(url);
      if (playerEl) playerEl.style.display = 'flex';

      const playBtn   = document.getElementById('play-btn');
      const fillEl    = document.getElementById('progress-fill');
      const timeEl    = document.getElementById('audio-time');
      const deleteBtn = document.getElementById('delete-audio-btn');
      const progressEl = document.getElementById('audio-progress');

      playBtn?.addEventListener('click', () => {
        if (audio.paused) { audio.play(); playBtn.textContent = '⏸'; }
        else              { audio.pause(); playBtn.textContent = '▶'; }
      });

      audio.addEventListener('timeupdate', () => {
        const pct = (audio.currentTime / audio.duration) * 100 || 0;
        if (fillEl) fillEl.style.width = pct + '%';
        if (progressEl) progressEl.setAttribute('aria-valuenow', Math.round(pct));
        const m = Math.floor(audio.currentTime/60).toString().padStart(2,'0');
        const s = Math.floor(audio.currentTime%60).toString().padStart(2,'0');
        if (timeEl) timeEl.textContent = `${m}:${s}`;
      });

      audio.addEventListener('ended', () => { if (playBtn) playBtn.textContent = '▶'; });

      deleteBtn?.addEventListener('click', () => {
        audio.pause();
        URL.revokeObjectURL(url);
        if (playerEl) playerEl.style.display = 'none';
        if (audioUpload) audioUpload.value = '';
      });
    }
  }

  /* ────────────────────────────────────────────────────
     VIDEO MANAGER — مدیریت ویدیو، دوبله و دانلود
     ──────────────────────────────────────────────────── */
  function _initVideoManager() {
    const videoUpload   = document.getElementById('video-upload');
    const videoUrlInput = document.getElementById('video-url-input');
    const previewWrap   = document.getElementById('video-preview-wrap');
    const previewEl     = document.getElementById('video-preview');
    const removeBtn     = document.getElementById('video-remove-btn');
    const startDubBtn   = document.getElementById('start-dubbing-btn');
    const extractAudBtn = document.getElementById('extract-audio-btn');
    const dropZone      = document.getElementById('video-drop-zone');
    const downloadsWrap = document.getElementById('dubbed-downloads-wrap');

    if (!videoUpload) return; /* فقط در صفحه quran ادمین */

    /* تابع نمایش پیش‌نمایش ویدیو */
    function _showVideoPreview(src) {
      if (!previewEl || !previewWrap) return;
      previewEl.src = src;
      previewWrap.style.display = 'block';
      if (startDubBtn) startDubBtn.disabled = false;
      if (extractAudBtn) extractAudBtn.disabled = false;
      if (dropZone) dropZone.style.borderColor = 'var(--color-primary-500)';
      /* نمایش بخش دانلود */
      if (downloadsWrap) downloadsWrap.style.display = 'block';
    }

    /* آپلود فایل ویدیو */
    videoUpload?.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (file.size > 500 * 1024 * 1024) {
        _showAdminToast('⚠ حجم فایل بیش از ۵۰۰ مگابایت است', 'error');
        return;
      }
      const url = URL.createObjectURL(file);
      _showVideoPreview(url);
      /* URL input هم پر شود */
      if (videoUrlInput) videoUrlInput.value = `[فایل محلی: ${file.name}]`;
      _showAdminToast(`✓ ویدیو "${file.name}" بارگذاری شد`, 'success');
    });

    /* URL مستقیم */
    videoUrlInput?.addEventListener('change', () => {
      const url = videoUrlInput.value.trim();
      if (url && url.startsWith('http')) {
        _showVideoPreview(url);
        _showAdminToast('✓ URL ویدیو تنظیم شد', 'success');
      }
    });

    /* Drag & Drop */
    dropZone?.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.style.borderColor = 'var(--color-primary-500)';
      dropZone.style.background  = 'rgba(42,157,143,0.04)';
    });
    dropZone?.addEventListener('dragleave', () => {
      dropZone.style.borderColor = 'var(--border-color)';
      dropZone.style.background  = '';
    });
    dropZone?.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.style.borderColor = 'var(--border-color)';
      dropZone.style.background  = '';
      const file = e.dataTransfer?.files?.[0];
      if (file && file.type.startsWith('video/')) {
        const url = URL.createObjectURL(file);
        _showVideoPreview(url);
        if (videoUrlInput) videoUrlInput.value = `[فایل محلی: ${file.name}]`;
        _showAdminToast(`✓ ویدیو "${file.name}" بارگذاری شد`, 'success');
      }
    });

    /* حذف ویدیو */
    removeBtn?.addEventListener('click', () => {
      if (previewEl)  { previewEl.src = ''; previewEl.pause?.(); }
      if (previewWrap) previewWrap.style.display = 'none';
      if (videoUrlInput) videoUrlInput.value = '';
      if (videoUpload)   videoUpload.value = '';
      if (startDubBtn)   startDubBtn.disabled = true;
      if (extractAudBtn) extractAudBtn.disabled = true;
      if (dropZone) dropZone.style.borderColor = 'var(--border-color)';
      /* غیرفعال کردن دکمه‌های دانلود */
      document.querySelectorAll('.dubbed-video-download,.dubbed-audio-download').forEach(a => {
        a.style.opacity = '0.4';
        a.style.pointerEvents = 'none';
      });
      /* ریست وضعیت دوبله */
      document.querySelectorAll('.dubbing-lang-status').forEach(el => {
        el.innerHTML = '<span style="width:8px;height:8px;border-radius:50%;background:var(--color-neutral-300)" aria-hidden="true"></span><span style="font-size:var(--text-xs);color:var(--text-muted)">در انتظار</span>';
      });
      _showAdminToast('ویدیو حذف شد', 'success');
    });

    /* شروع دوبله */
    startDubBtn?.addEventListener('click', () => {
      const videoUrl = videoUrlInput?.value?.trim();
      if (!videoUrl) { _showAdminToast('⚠ ابتدا ویدیو را انتخاب کنید', 'error'); return; }

      /* نمایش وضعیت در حال پردازش برای هر زبان */
      const langs = ['ar','ur','az','tr','ru','en','id'];
      langs.forEach((lang, i) => {
        setTimeout(() => {
          const statusEl = document.querySelector(`.dubbing-lang-status[data-lang="${lang}"]`);
          if (statusEl) {
            statusEl.innerHTML = '<span style="width:8px;height:8px;border-radius:50%;background:#f59e0b;animation:pulse 1s infinite" aria-hidden="true"></span><span style="font-size:var(--text-xs);color:#f59e0b">در حال دوبله...</span>';
          }
        }, i * 300);
      });

      startDubBtn.disabled = true;
      startDubBtn.textContent = '⏳ در حال ارسال درخواست...';

      fetch('/api/quran/dub-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoUrl,
          langs,
          voiceCloneId: localStorage.getItem('mh_voice_id') || '',
          whisperModel: 'whisper-1',
        }),
      }).then(r => r.json()).then(data => {
        if (data.jobId) {
          _showAdminToast('✓ دوبله شروع شد — وضعیت را پیگیری کنید', 'success');
          _pollJobStatus(data.jobId);
        }
      }).catch(() => {
        startDubBtn.disabled = false;
        startDubBtn.textContent = '🎙 شروع دوبله ۷ زبان';
        _showAdminToast('⚠ خطا در ارسال درخواست', 'error');
      });
    });

    /* استخراج صوت از ویدیو */
    extractAudBtn?.addEventListener('click', () => {
      const videoUrl = videoUrlInput?.value?.trim();
      if (!videoUrl) { _showAdminToast('⚠ ابتدا ویدیو را انتخاب کنید', 'error'); return; }

      extractAudBtn.disabled = true;
      extractAudBtn.textContent = '⏳ در حال استخراج...';

      fetch('/api/quran/extract-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoUrl }),
      }).then(r => r.json()).then(data => {
        if (data.success) {
          _activateDownload('fa', null, data.audioUrl);
          extractAudBtn.textContent = '✓ صوت استخراج شد';
          _showAdminToast('✓ صوت فارسی استخراج شد', 'success');
        } else {
          throw new Error(data.error);
        }
      }).catch(() => {
        extractAudBtn.textContent = '🔊 استخراج صوت از ویدیو';
        extractAudBtn.disabled = false;
        _showAdminToast('⚠ خطا در استخراج صوت', 'error');
      });
    });

    /* پیگیری وضعیت job دوبله */
    function _pollJobStatus(jobId) {
      const interval = setInterval(async () => {
        try {
          const res  = await fetch(`/api/quran/status/${jobId}`);
          const data = await res.json();
          if (!data.success) return;

          /* آپدیت نوار پیشرفت */
          if (startDubBtn) startDubBtn.textContent = `⏳ دوبله... ${data.percent}%`;

          /* آپدیت وضعیت هر زبان */
          if (data.progress) _updateDubbingStatus(data.progress, data.results);

          if (data.status === 'completed' || data.status === 'failed') {
            clearInterval(interval);
            if (startDubBtn) {
              startDubBtn.disabled = false;
              startDubBtn.textContent = '🎙 شروع دوبله ۷ زبان';
            }
            if (data.status === 'completed') {
              _showAdminToast('✅ دوبله همه زبان‌ها کامل شد', 'success');
            } else {
              _showAdminToast('⚠ دوبله با خطا مواجه شد', 'error');
            }
          }
        } catch { clearInterval(interval); }
      }, 5000);
    }

    /* فعال کردن لینک دانلود یک زبان */
    function _activateDownload(lang, videoUrl, audioUrl) {
      if (videoUrl) {
        const videoLink = document.querySelector(`.dubbed-video-download[data-lang="${lang}"]`);
        if (videoLink) {
          videoLink.href = videoUrl;
          videoLink.style.opacity = '1';
          videoLink.style.pointerEvents = 'auto';
          videoLink.setAttribute('download', `quran-${lang}.mp4`);
        }
      }
      if (audioUrl) {
        const audioLink = document.querySelector(`.dubbed-audio-download[data-lang="${lang}"]`);
        if (audioLink) {
          audioLink.href = audioUrl;
          audioLink.style.opacity = '1';
          audioLink.style.pointerEvents = 'auto';
          audioLink.setAttribute('download', `quran-audio-${lang}.mp3`);
        }
      }
    }

    /* آپدیت وضعیت دوبله بعد از پردازش */
    function _updateDubbingStatus(results) {
      if (!results) return;
      Object.entries(results).forEach(([lang, data]) => {
        const statusEl = document.querySelector(`.dubbing-lang-status[data-lang="${lang}"]`);
        if (statusEl) {
          statusEl.innerHTML = data.success
            ? '<span style="width:8px;height:8px;border-radius:50%;background:#16a34a" aria-hidden="true"></span><span style="font-size:var(--text-xs);color:#16a34a">تکمیل شد</span>'
            : '<span style="width:8px;height:8px;border-radius:50%;background:#e63946" aria-hidden="true"></span><span style="font-size:var(--text-xs);color:#e63946">خطا</span>';
        }
        if (data.success) _activateDownload(lang, data.videoUrl, data.audioUrl);
      });
    }
  }

  /* ── Toast ادمین ── */
  function _showAdminToast(msg, type = 'success') {
    const existing = document.getElementById('admin-toast');
    if (existing) existing.remove();
    const t = document.createElement('div');
    t.id = 'admin-toast';
    t.setAttribute('role', 'alert');
    t.style.cssText = `
      position:fixed;bottom:24px;inset-inline-end:24px;
      background:${type==='success'?'#16a34a':'#e63946'};
      color:white;padding:12px 20px;border-radius:8px;
      font-size:14px;font-weight:600;z-index:9999;
      box-shadow:0 8px 24px rgba(0,0,0,0.25);
      animation:fadeIn 0.3s ease;
    `;
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => { t.style.opacity='0'; t.style.transition='opacity 0.3s'; setTimeout(()=>t.remove(),300); }, 3500);
  }

  _render();
}
