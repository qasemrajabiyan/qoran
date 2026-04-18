/**
 * ============================================================
 * FILE: admin-router.js
 * ROLE: روتر مرکزی داشبورد — اتصال همه ماژول‌ها
 * PROJECT: BarakatHub — پلتفرم رسانه‌ای کربلا
 * VERSION: 2.0.0
 *
 * این فایل جایگزین admin.js می‌شود و همه ماژول‌ها را
 * به صورت lazy load وصل می‌کند
 * ============================================================
 */

import { adminLogin, adminLogout, requireAdmin } from './admin.js';

/* نقشه کد کشور به نام فارسی — همه کشورهای دنیا */
const COUNTRY_NAMES = {
  IR:'ایران', IQ:'عراق', SA:'عربستان سعودی', AE:'امارات متحده عربی', KW:'کویت',
  BH:'بحرین', QA:'قطر', OM:'عمان', YE:'یمن', SY:'سوریه',
  LB:'لبنان', JO:'اردن', PS:'فلسطین', IL:'اسرائیل',
  EG:'مصر', LY:'لیبی', TN:'تونس', DZ:'الجزایر', MA:'مراکش',
  SD:'سودان', SS:'سودان جنوبی', SO:'سومالی', ET:'اتیوپی', ER:'اریتره',
  DJ:'جیبوتی', MR:'موریتانی', ML:'مالی', NE:'نیجر', TD:'چاد',
  NG:'نیجریه', SN:'سنگال', GN:'گینه', GW:'گینه بیسائو', GM:'گامبیا',
  SL:'سیرالئون', LR:'لیبریا', CI:'ساحل عاج', GH:'غنا', TG:'توگو',
  BJ:'بنین', BF:'بورکینافاسو', CM:'کامرون', CF:'آفریقای مرکزی',
  GA:'گابن', GQ:'گینه استوایی', CG:'کنگو', CD:'کنگو دموکراتیک',
  AO:'آنگولا', ZM:'زامبیا', ZW:'زیمبابوه', MZ:'موزامبیک',
  MW:'مالاوی', TZ:'تانزانیا', KE:'کنیا', UG:'اوگاندا', RW:'رواندا',
  BI:'بوروندی', MG:'ماداگاسکار', MU:'موریس', SC:'سیشل',
  ZA:'آفریقای جنوبی', NA:'نامیبیا', BW:'بوتسوانا', LS:'لسوتو', SZ:'سوازیلند',
  KM:'کومور', CV:'کاپ ورد', ST:'سائوتومه و پرینسیپه',
  PK:'پاکستان', IN:'هند', BD:'بنگلادش', LK:'سریلانکا', NP:'نپال',
  BT:'بوتان', MV:'مالدیو', AF:'افغانستان', MM:'میانمار', TH:'تایلند',
  VN:'ویتنام', KH:'کامبوج', LA:'لائوس', MY:'مالزی', SG:'سنگاپور',
  BN:'برونئی', ID:'اندونزی', PH:'فیلیپین', TL:'تیمور شرقی',
  CN:'چین', TW:'تایوان', HK:'هنگ کنگ', MO:'ماکائو',
  JP:'ژاپن', KR:'کره جنوبی', KP:'کره شمالی', MN:'مغولستان',
  TJ:'تاجیکستان', UZ:'ازبکستان', TM:'ترکمنستان', KZ:'قزاقستان',
  KG:'قرقیزستان', AZ:'آذربایجان', GE:'گرجستان', AM:'ارمنستان',
  TR:'ترکیه', CY:'قبرس',
  RU:'روسیه', UA:'اوکراین', BY:'بلاروس', PL:'لهستان', CZ:'جمهوری چک',
  SK:'اسلواکی', HU:'مجارستان', RO:'رومانی', BG:'بلغارستان',
  MD:'مولداوی', RS:'صربستان', HR:'کرواسی', BA:'بوسنی و هرزگوین',
  SI:'اسلوونی', MK:'مقدونیه شمالی', AL:'آلبانی', ME:'مونته‌نگرو',
  XK:'کوزوو', GR:'یونان', IT:'ایتالیا', ES:'اسپانیا', PT:'پرتغال',
  FR:'فرانسه', DE:'آلمان', AT:'اتریش', CH:'سوئیس', LI:'لیختن‌اشتاین',
  BE:'بلژیک', NL:'هلند', LU:'لوکزامبورگ', GB:'انگلستان',
  IE:'ایرلند', IS:'ایسلند', NO:'نروژ', SE:'سوئد', FI:'فنلاند',
  DK:'دانمارک', EE:'استونی', LV:'لتونی', LT:'لیتوانی',
  MT:'مالت', MC:'موناکو', SM:'سان مارینو', VA:'واتیکان', AD:'آندورا',
  US:'آمریکا', CA:'کانادا', MX:'مکزیک', GT:'گواتمالا', BZ:'بلیز',
  HN:'هندوراس', SV:'السالوادور', NI:'نیکاراگوئه', CR:'کاستاریکا',
  PA:'پاناما', CU:'کوبا', JM:'جامائیکا', HT:'هائیتی', DO:'دومینیکن',
  PR:'پورتوریکو', TT:'ترینیداد و توباگو', BB:'باربادوس',
  CO:'کلمبیا', VE:'ونزوئلا', GY:'گویان', SR:'سورینام', BR:'برزیل',
  EC:'اکوادور', PE:'پرو', BO:'بولیوی', CL:'شیلی', AR:'آرژانتین',
  UY:'اروگوئه', PY:'پاراگوئه',
  AU:'استرالیا', NZ:'نیوزیلند', FJ:'فیجی', PG:'پاپوآ گینه نو',
  SB:'جزایر سلیمان', VU:'وانواتو', WS:'ساموآ', TO:'تونگا',
};

function _countryLabel(code) {
  if (!code) return '—';
  const upper = code.toUpperCase();
  const name  = COUNTRY_NAMES[upper];
  return name ? `${upper} ${name}` : upper;
}

/* ────────────────────────────────────────────────────────────
   1. ROUTE MAP — نقشه صفحات
   ──────────────────────────────────────────────────────────── */
const ROUTES = {
  overview:   { label:'نمای کلی',       icon:'📊', section:'اصلی',   badge: null },
  users:      { label:'کاربران',         icon:'👥', section:'اصلی',   badge: null },
  quran:      { label:'تدبرات قرآن',     icon:'📖', section:'محتوا',  badge: null },
  prayers:    { label:'دعا و ختم قرآن', icon:'🤲', section:'محتوا',  badge: 'orders' },
  meeting:    { label:'دیدار با شیخ',    icon:'🕌', section:'محتوا',  badge: null },
  consult:    { label:'مشاوره',          icon:'💬', section:'محتوا',  badge: 'consult' },
  istikhara:  { label:'استخاره',         icon:'⭐', section:'محتوا',  badge: null },
  messages:   { label:'پیام‌های من',     icon:'📨', section:'مدیریت', badge: 'messages' },
  referral:   { label:'معرفی و جایزه',   icon:'🎁', section:'مدیریت', badge: null },
  gifts:      { label:'جوایز و پیام‌ها', icon:'🕌', section:'مدیریت', badge: null },
  payments:   { label:'پرداخت‌ها',       icon:'💳', section:'مدیریت', badge: 'payments' },
  scheduler:  { label:'پیام زمان‌بندی', icon:'⏰', section:'مدیریت', badge: null },
  about:      { label:'درباره ما',       icon:'🕌', section:'مدیریت', badge: null },
  seo:        { label:'داشبورد سئو',      icon:'🔍', section:'مدیریت', badge: 'seo' },
  revenue:    { label:'گزارش درآمد',      icon:'💰', section:'مدیریت', badge: null },
  settings:   { label:'تنظیمات',         icon:'⚙️', section:'مدیریت', badge: null },
};

const SECTIONS = ['اصلی', 'محتوا', 'مدیریت'];

/* ────────────────────────────────────────────────────────────
   2. BADGE COUNTER — شمارنده badge هر بخش
   ──────────────────────────────────────────────────────────── */
function _getBadges() {
  const badges = {};
  try {
    const orders   = JSON.parse(localStorage.getItem('mh_orders')              || '[]');
    const consults = JSON.parse(localStorage.getItem('mh_consult_orders')      || '[]');
    const msgs     = JSON.parse(localStorage.getItem('mh_user_messages')       || '[]');
    const payments = JSON.parse(localStorage.getItem('mh_donations')           || '[]');
    const notifs   = JSON.parse(localStorage.getItem('mh_notifications')       || '[]');

    badges.orders   = orders.filter(o   => o.status === 'pending' && o.paid).length;
    /* badge سئو = صفحاتی که سئو ندارند */
    try {
      const seoOverrides = JSON.parse(localStorage.getItem('mh_seo_overrides') || '{}');
      const totalPages   = ['home','quran','prayer','consultation','istikhara','meeting','about'];
      badges.seo = totalPages.filter(p => !seoOverrides[p]).length;
    } catch { badges.seo = 0; }
    badges.consult  = consults.filter(c => c.status === 'waiting_sheikh' || c.status === 'need_review').length;
    badges.messages = msgs.filter(m     => m.status === 'unread').length;
    badges.payments = payments.filter(p => p.status === 'pending').length;
    badges.notifs   = notifs.filter(n   => !n.read).length;
  } catch {}
  return badges;
}

/* ────────────────────────────────────────────────────────────
   3. LAZY PAGE LOADER — بارگذاری صفحات بر اساس نیاز
   ──────────────────────────────────────────────────────────── */
async function _loadPage(pageId, contentEl) {
  /* نشان دادن loading */
  contentEl.innerHTML = `
    <div style="
      display:flex;align-items:center;justify-content:center;
      min-height:400px;flex-direction:column;gap:var(--space-4);
    ">
      <div style="
        width:48px;height:48px;border-radius:50%;
        border:3px solid var(--border-color);
        border-top-color:var(--color-primary-500);
        animation:spin 0.8s linear infinite;
      "></div>
      <p style="color:var(--text-muted);font-size:var(--text-sm)">در حال بارگذاری...</p>
    </div>
    <style>@keyframes spin{to{transform:rotate(360deg)}}</style>
  `;

  try {
    switch (pageId) {

      /* ── نمای کلی ── */
      case 'overview': {
        const { renderAdminShell } = await import('./admin.js');
        /* از تابع داخلی overview استفاده می‌کنیم */
        _renderOverviewPage(contentEl);
        break;
      }

      /* ── کاربران ── */
      case 'users': {
        const { renderUsersAnalytics } = await import('./admin-complete.js');
        contentEl.innerHTML = renderUsersAnalytics();
        break;
      }

      /* ── تدبرات قرآن ── */
      case 'quran': {
        /* رندر مستقیم با _renderQuranAdminDirect که ویدیو و دوبله را هم دارد */
        contentEl.innerHTML = await _renderQuranAdminDirect();
        _bindQuranAdminEvents(contentEl);
        break;
      }

      /* ── دعا و ختم قرآن ── */
      case 'prayers': {
        const { renderPrayerAdminPage } = await import('./admin-prayer-orders.js');
        renderPrayerAdminPage(contentEl);
        break;
      }

      /* ── دیدار با شیخ ── */
      case 'meeting': {
        _renderMeetingAdminPage(contentEl);
        break;
      }

      /* ── مشاوره ── */
      case 'consult': {
        const { renderConsultAdminPage } = await import('./admin-consultation.js');
        renderConsultAdminPage(contentEl);
        break;
      }

      /* ── استخاره ── */
      case 'istikhara': {
        const { renderIstikharaAdminPage } = await import('./admin-istikhara.js');
        renderIstikharaAdminPage(contentEl);
        break;
      }

      /* ── پیام‌ها ── */
      case 'messages': {
        const { renderMessagesPage, bindMessagesEvents } = await import('./admin-messages.js');
        contentEl.innerHTML = renderMessagesPage();
        bindMessagesEvents(contentEl);
        break;
      }

      /* ── معرفی و جایزه ── */
      case 'referral': {
        const { renderReferralAdminPanel, bindReferralAdminEvents } = await import('./referral.js');
        contentEl.innerHTML = renderReferralAdminPanel();
        bindReferralAdminEvents(contentEl);
        break;
      }

      /* ── جوایز و پیام‌های نیابتی ── */
      case 'gifts': {
        _renderGiftsPage(contentEl);
        break;
      }

      /* ── پرداخت‌ها ── */
      case 'payments': {
        const { renderPaymentsAdminPage } = await import('./admin-payments.js');
        renderPaymentsAdminPage(contentEl);
        break;
      }

      /* ── پیام زمان‌بندی ── */
      case 'scheduler': {
        const { renderSchedulerAdminPanel, bindSchedulerAdminEvents } = await import('./referral-banner.js');
        contentEl.innerHTML = renderSchedulerAdminPanel();
        bindSchedulerAdminEvents(contentEl);
        break;
      }

      /* ── داشبورد سئو ── */
      case 'seo': {
        const { renderSEOMonitorDashboard } = await import('./seo-monitor.js');
        await renderSEOMonitorDashboard(contentEl);
        break;
      }

      /* ── گزارش درآمد ── */
      case 'revenue': {
        _renderRevenuePage(contentEl);
        break;
      }

      /* ── تنظیمات ── */
      case 'settings': {
        _renderSettingsPage(contentEl);
        break;
      }

      /* ── درباره ما ── */
      case 'about': {
        const { renderAboutAdminPage } = await import('./about.js');
        renderAboutAdminPage(contentEl);
        break;
      }

      default:
        contentEl.innerHTML = `
          <div class="empty-state">
            <span class="empty-state__icon">🚧</span>
            <h3 class="empty-state__title">در حال ساخت</h3>
          </div>
        `;
    }
  } catch (err) {
    console.error(`[AdminRouter] Error loading page "${pageId}":`, err);
    contentEl.innerHTML = `
      <div class="empty-state">
        <span class="empty-state__icon">⚠️</span>
        <h3 class="empty-state__title">خطا در بارگذاری</h3>
        <p class="empty-state__desc" style="direction:ltr;font-size:var(--text-xs)">${err.message}</p>
        <button class="btn btn--primary btn--sm" onclick="location.reload()">تلاش دوباره</button>
      </div>
    `;
  }
}

/* ────────────────────────────────────────────────────────────
   4. MAIN SHELL RENDERER
   ──────────────────────────────────────────────────────────── */

/* ── رندر مستقیم تدبرات قرآن (با ویدیو، دوبله و دانلود) ── */
async function _renderQuranAdminDirect() {
  const QURAN_DB_KEY = 'mh_quran_tadabbur';
  let ayahs = [];
  try { ayahs = JSON.parse(localStorage.getItem(QURAN_DB_KEY) || '[]'); } catch {}

  const DUB_LANGS = [
    {lang:'ar', flag:'🇸🇦', name:'عربی'},
    {lang:'ur', flag:'🇵🇰', name:'اردو'},
    {lang:'az', flag:'🇦🇿', name:'آذری'},
    {lang:'tr', flag:'🇹🇷', name:'ترکی'},
    {lang:'ru', flag:'🇷🇺', name:'روسی'},
    {lang:'en', flag:'🇺🇸', name:'انگلیسی'},
    {lang:'id', flag:'🇮🇩', name:'اندونزیایی'},
  ];

  return `
    <div>
      <div class="admin-page-header">
        <div>
          <h1 class="admin-page-title"><span class="admin-page-title__icon">📖</span> مدیریت تدبرات قرآن</h1>
          <p class="admin-page-desc">${ayahs.length} تدبر ثبت‌شده</p>
        </div>
        <button class="btn btn--primary" id="qr-new-btn">
          ➕ تدبر / ویدیو جدید
        </button>
      </div>

      <!-- ── فرم افزودن تدبر جدید ── -->
      <div class="admin-panel" id="qr-form-panel" style="margin-bottom:var(--space-5);display:none">
        <div class="admin-panel__header">
          <div class="admin-panel__title">✏️ افزودن تدبر و ویدیو جدید</div>
          <button class="btn btn--ghost btn--sm" id="qr-form-close">✕ بستن</button>
        </div>
        <div class="admin-panel__body">

          <div class="grid grid--2" style="gap:var(--space-4);margin-bottom:var(--space-4)">
            <div class="admin-field">
              <label class="admin-label" for="qr-surah-num">شماره سوره</label>
              <input type="number" class="admin-input" id="qr-surah-num" min="1" max="114" placeholder="۱ تا ۱۱۴"/>
            </div>
            <div class="admin-field">
              <label class="admin-label" for="qr-ayah-num">شماره آیه</label>
              <input type="number" class="admin-input" id="qr-ayah-num" min="1" placeholder="شماره آیه"/>
            </div>
            <div class="admin-field">
              <label class="admin-label" for="qr-surah-name">نام سوره <span class="admin-label-hint">به عربی</span></label>
              <input type="text" class="admin-input" id="qr-surah-name" dir="rtl" placeholder="مثلاً: الفاتحة"/>
            </div>
            <div class="admin-field">
              <label class="admin-label" for="qr-author">نام استاد</label>
              <input type="text" class="admin-input" id="qr-author" placeholder="شیخ احمد الکربلایی"/>
            </div>
          </div>

          <div class="admin-field">
            <label class="admin-label" for="qr-arabic">متن عربی آیه</label>
            <textarea class="admin-textarea admin-textarea--arabic" id="qr-arabic" dir="rtl" lang="ar" rows="3" placeholder="متن آیه..."></textarea>
          </div>
          <div class="admin-field">
            <label class="admin-label" for="qr-summary">توضیح اجمالی <span class="admin-label-hint">AI ترجمه می‌کند</span></label>
            <textarea class="admin-textarea" id="qr-summary" rows="3" placeholder="توضیح کوتاه به فارسی..."></textarea>
          </div>
          <div class="admin-field">
            <label class="admin-label" for="qr-tadabbur">تدبر مشروح <span class="admin-label-hint">AI ترجمه می‌کند</span></label>
            <textarea class="admin-textarea" id="qr-tadabbur" rows="6" placeholder="شرح و تدبر مفصل به فارسی..."></textarea>
          </div>

          <!-- صوت استاد -->
          <div class="admin-field">
            <label class="admin-label">صوت استاد <span class="admin-label-hint">آپلود یا URL مستقیم</span></label>
            <input type="url" class="admin-input" id="qr-audio-url" dir="ltr" placeholder="https://cdn.example.com/audio.mp3" style="margin-bottom:var(--space-2)"/>
            <label class="btn btn--outline btn--sm" style="cursor:pointer" for="qr-audio-upload">
              🎤 آپلود فایل صوتی
              <input type="file" id="qr-audio-upload" accept="audio/*" style="display:none"/>
            </label>
          </div>

          <!-- ── ویدیو استاد ── -->
          <div class="admin-field" style="margin-top:var(--space-4)">
            <label class="admin-label">
              🎬 ویدیو استاد
              <span class="admin-label-hint">فایل فارسی اصلی — AI خودکار دوبله و صوت استخراج می‌کند</span>
            </label>

            <!-- آپلود یا URL -->
            <input type="url" class="admin-input" id="qr-video-url" dir="ltr"
              placeholder="https://cdn.example.com/video.mp4"
              style="margin-bottom:var(--space-2)"/>
            <div style="display:flex;gap:var(--space-2);flex-wrap:wrap;margin-bottom:var(--space-3)">
              <label class="btn btn--outline btn--sm" style="cursor:pointer" for="qr-video-upload">
                📁 آپلود فایل ویدیو
                <input type="file" id="qr-video-upload" accept="video/mp4,video/webm,video/quicktime" style="display:none"/>
              </label>
              <button class="btn btn--primary btn--sm" id="qr-start-dub-btn" type="button" disabled>
                🤖 شروع دوبله خودکار
              </button>
              <button class="btn btn--outline btn--sm" id="qr-extract-audio-btn" type="button" disabled>
                🔊 استخراج صوت
              </button>
            </div>

            <!-- پیش‌نمایش ویدیو -->
            <div id="qr-video-preview-wrap" style="display:none;margin-bottom:var(--space-3)">
              <video id="qr-video-preview" controls
                style="width:100%;max-height:280px;border-radius:var(--radius-lg);background:#000"
              ></video>
              <button class="btn btn--ghost btn--sm" id="qr-video-remove" type="button" style="margin-top:var(--space-2)">🗑 حذف ویدیو</button>
            </div>

            <!-- وضعیت دوبله هر زبان -->
            <div style="
              background:var(--bg-surface-2);border:1px solid var(--border-color);
              border-radius:var(--radius-lg);padding:var(--space-4);margin-bottom:var(--space-3);
            ">
              <div style="font-size:var(--text-sm);font-weight:700;margin-bottom:var(--space-3)">
                🤖 وضعیت دوبله — ۷ زبان
              </div>
              <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:var(--space-2)">
                ${DUB_LANGS.map(l => `
                  <div style="
                    background:var(--bg-surface);border:1px solid var(--border-color);
                    border-radius:var(--radius-md);padding:var(--space-2) var(--space-3);
                    display:flex;align-items:center;justify-content:space-between;
                  ">
                    <span style="font-size:var(--text-sm)">${l.flag} ${l.name}</span>
                    <span class="qr-dub-status" data-lang="${l.lang}" style="
                      font-size:10px;color:var(--text-muted);
                      display:flex;align-items:center;gap:3px;
                    ">
                      <span style="width:6px;height:6px;border-radius:50%;background:var(--color-neutral-300);flex-shrink:0"></span>
                      انتظار
                    </span>
                  </div>
                `).join('')}
              </div>
            </div>

            <!-- دانلود نسخه‌های دوبله‌شده -->
            <div style="
              background:linear-gradient(135deg,rgba(42,157,143,0.06),rgba(42,157,143,0.02));
              border:1px solid rgba(42,157,143,0.2);border-radius:var(--radius-lg);
              padding:var(--space-4);
            ">
              <div style="font-size:var(--text-sm);font-weight:700;color:var(--color-primary-700);margin-bottom:var(--space-3)">
                📥 دانلود نسخه‌های دوبله‌شده
              </div>
              <div style="display:flex;flex-direction:column;gap:var(--space-2)">
                ${[{lang:'fa',flag:'🇮🇷',name:'فارسی (اصلی)'},...DUB_LANGS].map(l => `
                  <div style="
                    display:flex;align-items:center;gap:var(--space-3);
                    padding:var(--space-2) var(--space-3);
                    background:var(--bg-surface);border:1px solid var(--border-color);
                    border-radius:var(--radius-md);
                  ">
                    <span>${l.flag}</span>
                    <span style="flex:1;font-size:var(--text-sm);font-weight:600">${l.name}</span>
                    <a href="#" class="btn btn--outline btn--sm qr-dl-video" data-lang="${l.lang}"
                      style="opacity:0.4;pointer-events:none" download>🎬 ویدیو</a>
                    <a href="#" class="btn btn--outline btn--sm qr-dl-audio" data-lang="${l.lang}"
                      style="opacity:0.4;pointer-events:none" download>🎤 صوت</a>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>

          <!-- دکمه‌های ذخیره -->
          <div class="flex gap-3" style="margin-top:var(--space-5)">
            <button class="btn btn--primary btn--lg" id="qr-save-btn" type="button">💾 ذخیره و انتشار</button>
            <button class="btn btn--outline btn--lg" id="qr-draft-btn" type="button">📝 پیش‌نویس</button>
          </div>

        </div>
      </div>

      <!-- ── جدول تدبرات موجود ── -->
      <div class="admin-table-wrap">
        <div class="admin-table-header">
          <div class="admin-table-title">📚 تدبرات و ویدیوهای منتشرشده</div>
        </div>
        <div class="admin-panel__body">
          ${ayahs.length === 0 ? `
            <div style="text-align:center;padding:var(--space-8);color:var(--text-muted)">
              <div style="font-size:48px;margin-bottom:12px">📖</div>
              <p>هنوز تدبری ثبت نشده</p>
            </div>
          ` : `
            <div style="overflow-x:auto">
              <table class="admin-table">
                <thead>
                  <tr>
                    <th>سوره / آیه</th>
                    <th>خلاصه</th>
                    <th>نویسنده</th>
                    <th>🎬 ویدیو</th>
                    <th>🤖 دوبله</th>
                    <th>وضعیت</th>
                    <th>عملیات</th>
                  </tr>
                </thead>
                <tbody>
                  ${ayahs.map(a => {
                    const hasVideo = !!(a.videoUrl);
                    const dubCount = Object.values(a.dubbedVideoUrls || {}).filter(Boolean).length;
                    return `
                      <tr>
                        <td>
                          <div style="font-weight:700;font-size:var(--text-sm)" lang="ar">${a.surahName || '—'}</div>
                          <div style="font-size:var(--text-xs);color:var(--text-muted)">آیه ${a.ayahNum || '—'}</div>
                        </td>
                        <td style="max-width:180px;font-size:var(--text-xs);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
                          ${a.summary?.fa?.slice(0,70) || '—'}
                        </td>
                        <td style="font-size:var(--text-xs)">${a.author || '—'}</td>
                        <td>
                          ${hasVideo
                            ? `<span class="admin-badge admin-badge--done">✓ دارد</span>`
                            : `<span class="admin-badge admin-badge--draft">ندارد</span>`}
                        </td>
                        <td>
                          ${dubCount > 0
                            ? `<span class="admin-badge admin-badge--active">${dubCount}/۷ زبان</span>`
                            : `<span class="admin-badge admin-badge--draft">—</span>`}
                        </td>
                        <td>
                          <span class="admin-badge admin-badge--${a.published ? 'done' : 'draft'}">
                            ${a.published ? 'منتشر' : 'پیش‌نویس'}
                          </span>
                        </td>
                        <td>
                          <div style="display:flex;gap:var(--space-1)">
                            <button class="btn btn--outline btn--sm qr-edit-btn"
                              data-ayah-id="${a.id || ''}" aria-label="ویرایش">✏️</button>
                            <button class="btn btn--ghost btn--sm qr-delete-btn"
                              data-ayah-id="${a.id || ''}" aria-label="حذف">🗑</button>
                          </div>
                        </td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          `}
        </div>
      </div>
    </div>
  `;
}

/* ── Event bindings برای صفحه quran ادمین ── */
function _bindQuranAdminEvents(container) {
  const formPanel   = container.querySelector('#qr-form-panel');
  const newBtn      = container.querySelector('#qr-new-btn');
  const closeBtn    = container.querySelector('#qr-form-close');
  const videoUrl    = container.querySelector('#qr-video-url');
  const videoUpload = container.querySelector('#qr-video-upload');
  const previewWrap = container.querySelector('#qr-video-preview-wrap');
  const previewEl   = container.querySelector('#qr-video-preview');
  const removeBtn   = container.querySelector('#qr-video-remove');
  const dubBtn      = container.querySelector('#qr-start-dub-btn');
  const extractBtn  = container.querySelector('#qr-extract-audio-btn');

  /* نمایش / مخفی فرم */
  newBtn?.addEventListener('click', () => {
    if (formPanel) formPanel.style.display = formPanel.style.display === 'none' ? 'block' : 'none';
    formPanel?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  closeBtn?.addEventListener('click', () => {
    if (formPanel) formPanel.style.display = 'none';
  });

  /* نمایش پیش‌نمایش ویدیو */
  function _showVideoPreview(src) {
    if (previewEl)   previewEl.src = src;
    if (previewWrap) previewWrap.style.display = 'block';
    if (dubBtn)      dubBtn.disabled = false;
    if (extractBtn)  extractBtn.disabled = false;
  }

  /* آپلود فایل ویدیو */
  videoUpload?.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 500 * 1024 * 1024) {
      _showToast('⚠ حجم فایل بیش از ۵۰۰ مگابایت است', false); return;
    }
    _showVideoPreview(URL.createObjectURL(file));
    if (videoUrl) videoUrl.value = `[فایل محلی: ${file.name}]`;
    _showToast(`✓ ویدیو "${file.name}" بارگذاری شد`);
  });

  /* URL مستقیم */
  videoUrl?.addEventListener('change', () => {
    const url = videoUrl.value.trim();
    if (url.startsWith('http')) { _showVideoPreview(url); _showToast('✓ URL ویدیو تنظیم شد'); }
  });

  /* حذف ویدیو */
  removeBtn?.addEventListener('click', () => {
    if (previewEl)   { previewEl.src = ''; }
    if (previewWrap)   previewWrap.style.display = 'none';
    if (videoUrl)      videoUrl.value = '';
    if (videoUpload)   videoUpload.value = '';
    if (dubBtn)        dubBtn.disabled = true;
    if (extractBtn)    extractBtn.disabled = true;
    container.querySelectorAll('.qr-dub-status').forEach(el => {
      el.innerHTML = '<span style="width:6px;height:6px;border-radius:50%;background:var(--color-neutral-300);flex-shrink:0"></span>انتظار';
    });
  });

  /* شروع دوبله */
  dubBtn?.addEventListener('click', () => {
    const url = videoUrl?.value?.trim();
    if (!url) { _showToast('⚠ ابتدا ویدیو را انتخاب کنید', false); return; }
    const langs = ['ar','ur','az','tr','ru','en','id'];
    langs.forEach((lang, i) => {
      setTimeout(() => {
        const el = container.querySelector(`.qr-dub-status[data-lang="${lang}"]`);
        if (el) el.innerHTML = '<span style="width:6px;height:6px;border-radius:50%;background:#f59e0b;flex-shrink:0;animation:pulse 1s infinite"></span>دوبله...';
      }, i * 250);
    });
    dubBtn.disabled = true;
    dubBtn.textContent = '⏳ در حال ارسال...';
    /* TODO: fetch('/api/quran/dub-video', { method:'POST', body:JSON.stringify({videoUrl:url,langs}) }) */
    setTimeout(() => {
      dubBtn.textContent = '🤖 شروع دوبله خودکار';
      dubBtn.disabled = false;
      _showToast('✓ درخواست دوبله ارسال شد');
    }, 2000);
  });

  /* استخراج صوت */
  extractBtn?.addEventListener('click', () => {
    const url = videoUrl?.value?.trim();
    if (!url) { _showToast('⚠ ابتدا ویدیو را انتخاب کنید', false); return; }
    extractBtn.disabled = true;
    extractBtn.textContent = '⏳ استخراج...';
    /* TODO: fetch('/api/quran/extract-audio', { method:'POST', body:JSON.stringify({videoUrl:url}) }) */
    setTimeout(() => {
      extractBtn.textContent = '🔊 استخراج صوت';
      extractBtn.disabled = false;
      /* فعال کردن دانلود صوت فارسی */
      const audioLink = container.querySelector('.qr-dl-audio[data-lang="fa"]');
      if (audioLink) { audioLink.style.opacity = '1'; audioLink.style.pointerEvents = 'auto'; }
      _showToast('✓ درخواست استخراج صوت ارسال شد');
    }, 1500);
  });

  /* ذخیره تدبر */
  container.querySelector('#qr-save-btn')?.addEventListener('click', () => {
    const surahNum = container.querySelector('#qr-surah-num')?.value;
    const ayahNum  = container.querySelector('#qr-ayah-num')?.value;
    const arabic   = container.querySelector('#qr-arabic')?.value;
    const summary  = container.querySelector('#qr-summary')?.value;
    const tadabbur = container.querySelector('#qr-tadabbur')?.value;

    if (!surahNum || !ayahNum || !arabic || !summary || !tadabbur) {
      _showToast('⚠ لطفاً فیلدهای اصلی را پر کنید', false); return;
    }

    const ayahId = `a${surahNum}_${ayahNum}`;
    const videoUrlVal = container.querySelector('#qr-video-url')?.value?.trim() || '';
    const audioUrlVal = container.querySelector('#qr-audio-url')?.value?.trim() || '';

    const ayahData = {
      id: ayahId, surahNum: parseInt(surahNum), ayahNum: parseInt(ayahNum),
      surahName: container.querySelector('#qr-surah-name')?.value || '',
      author: container.querySelector('#qr-author')?.value || '',
      arabic, summary: { fa: summary }, tadabbur: { fa: tadabbur },
      audioUrl: audioUrlVal, videoUrl: videoUrlVal,
      dubbedVideoUrls: { ar:'', ur:'', az:'', tr:'', ru:'', en:'', id:'' },
      extractedAudioUrl: '',
      published: true, date: new Date().toISOString(),
    };

    try {
      const all = JSON.parse(localStorage.getItem('mh_quran_tadabbur') || '[]');
      const idx = all.findIndex(a => a.id === ayahId);
      if (idx !== -1) all[idx] = ayahData; else all.push(ayahData);
      localStorage.setItem('mh_quran_tadabbur', JSON.stringify(all));
    } catch {}

    _showToast('✓ تدبر با موفقیت ذخیره شد');
    if (formPanel) formPanel.style.display = 'none';
  });

  /* پیش‌نویس */
  container.querySelector('#qr-draft-btn')?.addEventListener('click', () => {
    _showToast('✓ پیش‌نویس ذخیره شد');
  });

  /* حذف ردیف */
  container.querySelectorAll('.qr-delete-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (!confirm('آیا این تدبر حذف شود؟')) return;
      const id = btn.dataset.ayahId;
      try {
        const all = JSON.parse(localStorage.getItem('mh_quran_tadabbur') || '[]');
        localStorage.setItem('mh_quran_tadabbur', JSON.stringify(all.filter(a => a.id !== id)));
      } catch {}
      btn.closest('tr')?.remove();
      _showToast('✓ تدبر حذف شد');
    });
  });
}

export async function initAdminDashboard(container) {
  if (!container) return;
  if (!requireAdmin()) return;

  /* خواندن صفحه از URL hash */
  let _activePage = window.location.hash.slice(1) || 'overview';
  if (!ROUTES[_activePage]) _activePage = 'overview';

  let _sidebarOpen = window.innerWidth >= 1024;

  /* ── رندر shell ── */
  function _renderShell() {
    const badges = _getBadges();
    const totalBadge = badges.notifs || 0;

    container.innerHTML = `
      <div class="admin-shell ${!_sidebarOpen ? 'admin-shell--collapsed' : ''}" id="admin-shell">

        <!-- ══ SIDEBAR ══ -->
        <aside class="admin-sidebar" id="admin-sidebar" role="navigation" aria-label="منوی ادمین">

          <!-- Logo -->
          <a href="/" class="admin-sidebar__logo" aria-label="بازگشت به سایت">
            <div class="admin-sidebar__logo-icon" aria-hidden="true">🕌</div>
            <div style="overflow:hidden">
              <div class="admin-sidebar__logo-text">برکت‌هاب</div>
              <span class="admin-sidebar__logo-sub">پنل مدیریت ۲۰۲۶</span>
            </div>
          </a>

          <!-- Nav -->
          <nav class="admin-nav" aria-label="بخش‌های داشبورد">
            ${SECTIONS.map(section => {
              const items = Object.entries(ROUTES).filter(([,r]) => r.section === section);
              return `
                <div class="admin-nav__section">
                  <div class="admin-nav__section-label">${section}</div>
                  ${items.map(([id, route]) => {
                    const badgeCount = route.badge ? (badges[route.badge] || 0) : 0;
                    return `
                      <button
                        class="admin-nav__item ${id === _activePage ? 'admin-nav__item--active' : ''}"
                        data-page="${id}"
                        aria-current="${id === _activePage ? 'page' : 'false'}"
                        aria-label="${route.label}${badgeCount > 0 ? ` — ${badgeCount} مورد جدید` : ''}"
                      >
                        <span class="admin-nav__icon" aria-hidden="true">${route.icon}</span>
                        <span class="admin-nav__label">${route.label}</span>
                        ${badgeCount > 0 ? `
                          <span class="admin-nav__badge" aria-hidden="true">
                            ${badgeCount > 99 ? '99+' : badgeCount}
                          </span>
                        ` : ''}
                      </button>
                    `;
                  }).join('')}
                </div>
              `;
            }).join('')}
          </nav>

          <!-- Profile -->
          <div class="admin-sidebar__profile">
            <div class="admin-sidebar__avatar" aria-hidden="true">👨‍💼</div>
            <div style="overflow:hidden;flex:1">
              <div class="admin-sidebar__name">ادمین ارشد</div>
              <div class="admin-sidebar__role">برکت‌هاب کربلا</div>
            </div>
          </div>

        </aside>

        <!-- ══ HEADER ══ -->
        <header class="admin-header" role="banner">
          <div class="admin-header__left">

            <!-- Hamburger -->
            <button
              class="admin-header__collapse-btn"
              id="sidebar-toggle"
              aria-label="${_sidebarOpen ? 'بستن' : 'باز کردن'} منو"
              aria-expanded="${_sidebarOpen}"
              aria-controls="admin-sidebar"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <line x1="3" y1="6" x2="21" y2="6"/>
                <line x1="3" y1="12" x2="21" y2="12"/>
                <line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>

            <!-- Breadcrumb -->
            <nav aria-label="مسیر فعلی">
              <ol style="display:flex;align-items:center;gap:var(--space-2);list-style:none;margin:0;padding:0;font-size:var(--text-sm)">
                <li style="color:var(--text-muted)">مدیریت</li>
                <li aria-hidden="true" style="color:var(--text-muted)">›</li>
                <li>
                  <span style="font-weight:var(--weight-semibold);color:var(--text-primary)" id="breadcrumb-current">
                    ${ROUTES[_activePage]?.icon} ${ROUTES[_activePage]?.label}
                  </span>
                </li>
              </ol>
            </nav>

          </div>

          <div class="admin-header__right">

            <!-- وضعیت سایت -->
            <div class="admin-site-status" aria-label="وضعیت سایت: آنلاین">
              <div class="admin-site-status__dot" aria-hidden="true"></div>
              آنلاین
            </div>

            <!-- اعلان‌ها -->
            <button class="admin-notif-btn" id="admin-notif-btn" aria-label="${totalBadge} اعلان خوانده‌نشده">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              ${totalBadge > 0 ? `<span class="admin-notif-btn__dot" aria-hidden="true"></span>` : ''}
            </button>

            <!-- تم -->
            <button class="admin-header__collapse-btn" id="admin-theme-btn" aria-label="تغییر تم">
              🌙
            </button>

            <!-- خروج -->
            <button class="btn btn--ghost btn--sm" id="admin-logout-btn" aria-label="خروج از پنل">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              خروج
            </button>

          </div>
        </header>

        <!-- ══ CONTENT ══ -->
        <main class="admin-content" id="admin-content" role="main" tabindex="-1">
          <!-- صفحه اینجا بارگذاری می‌شود -->
        </main>

      </div>

      <!-- Overlay برای موبایل -->
      <div id="sidebar-overlay" style="
        display:none;position:fixed;inset:0;
        background:rgba(0,0,0,0.5);z-index:calc(var(--z-fixed) - 1);
        backdrop-filter:blur(4px);
      " aria-hidden="true"></div>
    `;

    _bindShellEvents();

    /* بارگذاری صفحه اول */
    _navigateTo(_activePage, false);
  }

  /* ── ناوبری ── */
  async function _navigateTo(pageId, pushHistory = true) {
    if (!ROUTES[pageId]) return;
    _activePage = pageId;

    /* آپدیت URL hash */
    if (pushHistory) {
      window.history.pushState({ page: pageId }, '', `#${pageId}`);
    }

    /* آپدیت sidebar */
    container.querySelectorAll('.admin-nav__item').forEach(btn => {
      const isActive = btn.dataset.page === pageId;
      btn.classList.toggle('admin-nav__item--active', isActive);
      btn.setAttribute('aria-current', isActive ? 'page' : 'false');
    });

    /* آپدیت breadcrumb */
    const bc = document.getElementById('breadcrumb-current');
    if (bc) bc.innerHTML = `${ROUTES[pageId].icon} ${ROUTES[pageId].label}`;

    /* بارگذاری محتوا */
    const contentEl = document.getElementById('admin-content');
    if (contentEl) {
      contentEl.style.opacity = '0';
      await _loadPage(pageId, contentEl);
      contentEl.style.opacity = '1';
      contentEl.style.transition = 'opacity 0.2s ease';
      contentEl.focus();
    }

    /* بستن sidebar در موبایل */
    if (window.innerWidth < 1024) {
      _closeMobileSidebar();
    }
  }

  /* ── Event bindings ── */
  function _bindShellEvents() {
    /* Navigation clicks */
    container.querySelectorAll('[data-page]').forEach(btn => {
      btn.addEventListener('click', () => _navigateTo(btn.dataset.page));
    });

    /* Sidebar toggle */
    document.getElementById('sidebar-toggle')?.addEventListener('click', () => {
      _sidebarOpen = !_sidebarOpen;
      const shell   = document.getElementById('admin-shell');
      const sidebar = document.getElementById('admin-sidebar');
      const overlay = document.getElementById('sidebar-overlay');
      const toggle  = document.getElementById('sidebar-toggle');

      if (window.innerWidth >= 1024) {
        shell?.classList.toggle('admin-shell--collapsed', !_sidebarOpen);
      } else {
        if (_sidebarOpen) {
          sidebar?.classList.add('admin-sidebar--open');
          if (overlay) overlay.style.display = 'block';
          toggle?.setAttribute('aria-expanded', 'true');
        } else {
          _closeMobileSidebar();
        }
      }
    });

    /* Overlay click — بستن sidebar در موبایل */
    document.getElementById('sidebar-overlay')?.addEventListener('click', () => {
      _sidebarOpen = false;
      _closeMobileSidebar();
    });

    /* خروج */
    document.getElementById('admin-logout-btn')?.addEventListener('click', () => {
      if (confirm('آیا می‌خواهید از پنل ادمین خارج شوید؟')) {
        adminLogout();
      }
    });

    /* تم */
    document.getElementById('admin-theme-btn')?.addEventListener('click', () => {
      const html = document.documentElement;
      const isDark = html.getAttribute('data-theme') === 'dark';
      html.setAttribute('data-theme', isDark ? 'light' : 'dark');
      const btn = document.getElementById('admin-theme-btn');
      if (btn) btn.textContent = isDark ? '🌙' : '☀️';
    });

    /* Browser back/forward */
    window.addEventListener('popstate', (e) => {
      const page = e.state?.page || window.location.hash.slice(1) || 'overview';
      if (ROUTES[page]) _navigateTo(page, false);
    });

    /* Keyboard shortcuts */
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (window.innerWidth < 1024 && _sidebarOpen) {
          _sidebarOpen = false;
          _closeMobileSidebar();
        }
      }
    });

    /* آپدیت badge هر ۳۰ ثانیه */
    setInterval(() => {
      const badges = _getBadges();
      container.querySelectorAll('.admin-nav__item').forEach(btn => {
        const route = ROUTES[btn.dataset.page];
        if (!route?.badge) return;
        const count = badges[route.badge] || 0;
        const existing = btn.querySelector('.admin-nav__badge');
        if (count > 0) {
          if (existing) {
            existing.textContent = count > 99 ? '99+' : String(count);
          } else {
            const badge = document.createElement('span');
            badge.className = 'admin-nav__badge';
            badge.setAttribute('aria-hidden', 'true');
            badge.textContent = count > 99 ? '99+' : String(count);
            btn.appendChild(badge);
          }
        } else if (existing) {
          existing.remove();
        }
      });
    }, 30000);
  }

  function _closeMobileSidebar() {
    const sidebar = document.getElementById('admin-sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    const toggle  = document.getElementById('sidebar-toggle');
    sidebar?.classList.remove('admin-sidebar--open');
    if (overlay) overlay.style.display = 'none';
    toggle?.setAttribute('aria-expanded', 'false');
  }

  /* رندر اولیه */
  _renderShell();
}

/* ────────────────────────────────────────────────────────────
   5. INLINE PAGE RENDERERS (صفحاتی که import نیاز ندارند)
   ──────────────────────────────────────────────────────────── */

/* نمای کلی */
function _renderOverviewPage(container) {
  const users    = (() => { try { return JSON.parse(localStorage.getItem('mh_all_users')||'[]'); } catch { return []; } })();
  const orders   = (() => { try { return JSON.parse(localStorage.getItem('mh_orders')||'[]'); } catch { return []; } })();
  const consults = (() => { try { return JSON.parse(localStorage.getItem('mh_consult_orders')||'[]'); } catch { return []; } })();
  const donations= (() => { try { return JSON.parse(localStorage.getItem('mh_donations')||'[]'); } catch { return []; } })();
  const today    = new Date().toDateString();

  const byLang = {};
  users.forEach(u => { byLang[u.lang||'fa'] = (byLang[u.lang||'fa']??0)+1; });
  const totalLang = Math.max(Object.values(byLang).reduce((a,b)=>a+b,0), 1);

  const LANG_INFO = {
    fa:{name:'فارسی',flag:'🇮🇷'}, ar:{name:'عربی',flag:'🇸🇦'}, ur:{name:'اردو',flag:'🇵🇰'},
    az:{name:'آذری',flag:'🇦🇿'}, tr:{name:'ترکی',flag:'🇹🇷'}, ru:{name:'روسی',flag:'🇷🇺'},
    en:{name:'انگلیسی',flag:'🇺🇸'}, id:{name:'اندونزیایی',flag:'🇮🇩'},
  };

  container.innerHTML = `
    <div>
      <div class="admin-page-header">
        <div>
          <h1 class="admin-page-title"><span class="admin-page-title__icon">📊</span> نمای کلی</h1>
          <p class="admin-page-desc">${new Date().toLocaleDateString('fa-IR',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}</p>
        </div>
        <a href="/" target="_blank" class="btn btn--outline btn--sm">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          مشاهده سایت
        </a>
      </div>

      <!-- Stat Cards -->
      <div class="admin-stats-grid">
        ${[
          {label:'کل کاربران',      num:users.length,                                                       color:'teal',   icon:'👥', sub:`+${users.filter(u=>new Date(u.joinedAt).toDateString()===today).length} امروز`},
          {label:'سفارش دعا',       num:orders.length,                                                      color:'amber',  icon:'🤲', sub:`${orders.filter(o=>o.status==='pending').length} در انتظار`},
          {label:'مشاوره',          num:consults.length,                                                    color:'blue',   icon:'💬', sub:`${consults.filter(c=>c.status==='waiting_sheikh').length} انتظار شیخ`},
          {label:'پرداخت‌ها',       num:donations.length,                                                   color:'green',  icon:'💳', sub:`${donations.filter(d=>d.status==='pending').length} در انتظار تأیید`},
          {label:'زبان‌ها',         num:Object.keys(byLang).length,                                         color:'purple', icon:'🌍', sub:'زبان فعال'},
          {label:'سرویس‌های فعال',  num:6,                                                                  color:'rose',   icon:'✨', sub:'قرآن، دعا، مشاوره...'},
        ].map(s=>`
          <div class="admin-stat-card admin-stat-card--${s.color}">
            <div class="admin-stat-card__header">
              <span class="admin-stat-card__label">${s.label}</span>
              <div class="admin-stat-card__icon">${s.icon}</div>
            </div>
            <div class="admin-stat-card__num">${s.num.toLocaleString('fa-IR')}</div>
            ${s.sub ? `<div style="font-size:var(--text-xs);color:var(--text-muted);margin-top:var(--space-2)">${s.sub}</div>` : ''}
          </div>
        `).join('')}
      </div>

      <!-- آمار زبان + نمودار -->
      <div class="grid grid--2" style="margin-bottom:var(--space-5);gap:var(--space-5)">
        <div class="admin-chart-card">
          <div class="admin-chart-header">
            <div class="admin-chart-title">🌍 کاربران به تفکیک زبان</div>
          </div>
          <div style="display:flex;flex-direction:column;gap:var(--space-3)">
            ${Object.entries(byLang).sort((a,b)=>b[1]-a[1]).map(([lang,count])=>{
              const pct = Math.round(count/totalLang*100);
              const info = LANG_INFO[lang]??{name:lang,flag:'🌐'};
              return `
                <div>
                  <div style="display:flex;justify-content:space-between;margin-bottom:4px;font-size:var(--text-sm)">
                    <span>${info.flag} ${info.name}</span>
                    <span style="font-weight:700;color:var(--color-primary-600)">${count} (${pct}%)</span>
                  </div>
                  <div style="height:6px;background:var(--border-color);border-radius:999px;overflow:hidden">
                    <div style="height:100%;width:${pct}%;background:linear-gradient(90deg,var(--color-primary-400),var(--color-primary-600));border-radius:999px;transition:width 1s ease"></div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- دسترسی سریع -->
        <div class="admin-chart-card">
          <div class="admin-chart-header">
            <div class="admin-chart-title">⚡ دسترسی سریع</div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-3)">
            ${Object.entries(ROUTES).slice(2,8).map(([id,r])=>`
              <button data-page="${id}" class="btn btn--outline btn--sm" style="display:flex;align-items:center;gap:6px;justify-content:flex-start">
                ${r.icon} ${r.label}
              </button>
            `).join('')}
          </div>
        </div>
      </div>

      <!-- آخرین کاربران -->
      <div class="admin-table-wrap">
        <div class="admin-table-header">
          <div class="admin-table-title">👥 آخرین کاربران ثبت‌نام‌شده</div>
          <button data-page="users" class="btn btn--primary btn--sm">مشاهده همه</button>
        </div>
        <div style="overflow-x:auto">
          <table class="admin-table">
            <thead><tr><th>نام</th><th>زبان</th><th>کشور</th><th>روش ورود</th><th>تاریخ</th></tr></thead>
            <tbody>
              ${users.slice(0,5).reverse().map(u=>`
                <tr>
                  <td style="font-weight:600">${u.name||'—'}</td>
                  <td>${LANG_INFO[u.lang]?.flag??'🌐'} ${LANG_INFO[u.lang]?.name??u.lang??'—'}</td>
                  <td style="white-space:nowrap">${_countryLabel(u.country)}</td>
                  <td><span class="admin-badge admin-badge--${u.signInMethod==='google'?'active':'draft'}">${u.signInMethod==='google'?'🔵 Google':'📧 فرم'}</span></td>
                  <td style="font-size:var(--text-xs)">${u.joinedAt?new Date(u.joinedAt).toLocaleDateString('fa-IR'):'—'}</td>
                </tr>
              `).join('') || '<tr><td colspan="5" style="text-align:center;color:var(--text-muted);padding:var(--space-6)">هنوز کاربری ثبت‌نام نکرده</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  /* دسترسی سریع */
  container.querySelectorAll('[data-page]').forEach(btn => {
    btn.addEventListener('click', () => {
      /* trigger navigation از router اصلی */
      window.location.hash = btn.dataset.page;
      window.dispatchEvent(new PopStateEvent('popstate', { state: { page: btn.dataset.page } }));
    });
  });
}

/* دیدار با شیخ */
function _renderMeetingAdminPage(container) {
  const meetings = (() => { try { return JSON.parse(localStorage.getItem('mh_meeting_responses')||'[]'); } catch { return []; } })();
  const config   = (() => { try { return JSON.parse(localStorage.getItem('mh_meeting_config')||'null'); } catch { return null; } })();
  const confirmed = meetings.filter(m => m.response === 'yes');

  container.innerHTML = `
    <div>
      <div class="admin-page-header">
        <div>
          <h1 class="admin-page-title"><span class="admin-page-title__icon">🕌</span> مدیریت دیدار با شیخ</h1>
          <p class="admin-page-desc">${confirmed.length} نفر تأیید کرده‌اند</p>
        </div>
      </div>

      <div class="admin-panel" style="margin-bottom:var(--space-5)">
        <div class="admin-panel__header">
          <div class="admin-panel__title">⚙️ تنظیمات دیدار</div>
        </div>
        <div class="admin-panel__body">
          <div style="display:flex;flex-direction:column;gap:var(--space-4)">
            <label class="admin-toggle">
              <input type="checkbox" id="meeting-active" ${config?.active!==false?'checked':''}/>
              <div class="admin-toggle__track"><div class="admin-toggle__thumb"></div></div>
              <span class="admin-toggle__label">دیدار فعال است</span>
            </label>
          </div>
          <div class="admin-field" style="margin-top:var(--space-4)">
            <label class="admin-label" for="inactive-msg">متن هنگام غیرفعال بودن</label>
            <textarea class="admin-textarea" id="inactive-msg" rows="3"
              placeholder="در حال حاضر دیداری برنامه‌ریزی نشده..."
            >${config?.inactiveMsg??''}</textarea>
          </div>
          <div class="admin-field">
            <label class="admin-label" for="confirm-msg">متن پیام تأیید دیدار</label>
            <textarea class="admin-textarea" id="confirm-msg" rows="5"
              placeholder="خوش آمدید — جزئیات دیدار..."
            >${config?.confirmMsg??''}</textarea>
          </div>
          <button class="btn btn--primary" id="save-meeting-btn">💾 ذخیره</button>
        </div>
      </div>

      <div class="admin-table-wrap">
        <div class="admin-table-header">
          <div class="admin-table-title">✅ تأییدکنندگان (${confirmed.length} نفر)</div>
        </div>
        <div style="overflow-x:auto">
          <table class="admin-table">
            <thead><tr><th>نام</th><th>زبان</th><th>کشور</th><th>ایمیل</th><th>تاریخ</th></tr></thead>
            <tbody>
              ${confirmed.length===0
                ? `<tr><td colspan="5" style="text-align:center;color:var(--text-muted);padding:var(--space-6)">هنوز کسی تأیید نکرده</td></tr>`
                : confirmed.map(m=>`
                  <tr>
                    <td>${m.userName||'—'}</td>
                    <td>${m.userLang||'—'}</td>
                    <td style="white-space:nowrap">${_countryLabel(m.userCountry)}</td>
                    <td style="direction:ltr;font-size:var(--text-xs)">${m.userEmail||'—'}</td>
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

  document.getElementById('save-meeting-btn')?.addEventListener('click', () => {
    const cfg = {
      active:      document.getElementById('meeting-active')?.checked,
      inactiveMsg: document.getElementById('inactive-msg')?.value,
      confirmMsg:  document.getElementById('confirm-msg')?.value,
    };
    localStorage.setItem('mh_meeting_config', JSON.stringify(cfg));
    _showToast('✓ تنظیمات ذخیره شد');
  });
}

/* ════════════════════════════════════════════════════════════
   گزارش درآمد ماهانه — جامع و کامل
   ════════════════════════════════════════════════════════════ */
function _renderRevenuePage(container) {

  /* ── جمع‌آوری داده از همه منابع درآمدی ─────────────────── */
  function _collect() {
    const months = {};
    const SECTIONS = ['prayer','consultation','istikhara','quran_sub','quran_ads','payment_other'];
    const _add = (dateStr, section, usd) => {
      if (!dateStr || !usd || usd <= 0) return;
      try {
        const d = new Date(dateStr);
        if (isNaN(d)) return;
        const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
        if (!months[key]) {
          months[key] = { total:0 };
          SECTIONS.forEach(s => { months[key][s] = 0; months[key][s+'_count'] = 0; });
        }
        months[key][section]            = (months[key][section]            || 0) + usd;
        months[key][section + '_count'] = (months[key][section + '_count'] || 0) + 1;
        months[key].total               = (months[key].total               || 0) + usd;
      } catch {}
    };
    try {
      JSON.parse(localStorage.getItem('mh_orders') || '[]').filter(o => o.paid)
        .forEach(o => {
          const usd = o.paidUSD || (o.paidCurrency === 'USD' || o.paidCurrency === 'USDT' ? (o.paidAmount||0) : 0);
          _add(o.createdAt, 'prayer', usd);
        });
      JSON.parse(localStorage.getItem('mh_consult_orders') || '[]').filter(o => o.paid)
        .forEach(o => {
          const usd = o.paidUSD || (o.paidCurrency === 'USD' || o.paidCurrency === 'USDT' ? (o.paidAmount||0) : 0);
          _add(o.createdAt, 'consultation', usd);
        });
      JSON.parse(localStorage.getItem('mh_istikhara_orders') || '[]').filter(o => o.paid)
        .forEach(o => {
          const usd = o.paidUSD || (o.paidCurrency === 'USD' || o.paidCurrency === 'USDT' ? (o.paidAmount||0) : 0);
          _add(o.createdAt, 'istikhara', usd);
        });
      JSON.parse(localStorage.getItem('mh_quran_subscriptions') || '[]').filter(s => s.paid)
        .forEach(s => {
          const usd = s.paidUSD || (s.paidCurrency === 'USD' || s.paidCurrency === 'USDT' ? (s.paidAmount||0) : (s.amount||0));
          _add(s.createdAt, 'quran_sub', usd);
        });
      JSON.parse(localStorage.getItem('mh_ad_revenue') || '[]')
        .forEach(a => _add(a.date || a.createdAt, 'quran_ads', a.revenueUSD || a.amount || 0));
      JSON.parse(localStorage.getItem('mh_payments') || '[]').filter(p => p.status === 'confirmed')
        .forEach(p => {
          const sec = p.serviceId === 'prayer' ? 'prayer' : p.serviceId === 'consultation' ? 'consultation'
                    : p.serviceId === 'istikhara' ? 'istikhara' : p.serviceId === 'quran' ? 'quran_sub' : 'payment_other';
          const usd = p.currency === 'USD' ? (p.amount||0) : p.rateToUSD ? (p.amount||0)/p.rateToUSD : 0;
          _add(p.createdAt, sec, usd);
        });
    } catch(e) { console.error('[Revenue]', e); }
    return Object.entries(months).sort(([a],[b]) => b.localeCompare(a)).map(([key,data]) => ({ key, ...data }));
  }

  const _usd = n => `$${(n||0).toFixed(2)}`;

  /* ── گروه‌بندی ماه‌ها بر اساس سال ────────────────────────── */
  function _groupByYear(rows) {
    const years = {};
    rows.forEach(r => {
      const y = r.key.split('-')[0];
      if (!years[y]) years[y] = [];
      years[y].push(r);
    });
    return Object.entries(years).sort(([a],[b]) => b.localeCompare(a));
  }

  /* ── کارت‌های خلاصه ─────────────────────────────────────── */
  function _renderCards(rows) {
    const _sum = sec => rows.reduce((s,r) => s+(r[sec]||0), 0);
    const _cnt = sec => rows.reduce((s,r) => s+(r[sec+'_count']||0), 0);
    const gt   = _sum('total');
    return `
      <div class="admin-stats-grid" id="revenue-cards">
        <div class="admin-stat-card" style="border-top:3px solid #16a34a">
          <div class="admin-stat-card__header"><span class="admin-stat-card__label">💰 کل درآمد</span></div>
          <div class="admin-stat-card__num">${_usd(gt)}</div>
        </div>
        <div class="admin-stat-card" style="border-top:3px solid #2a9d8f">
          <div class="admin-stat-card__header"><span class="admin-stat-card__label">🤲 سفارش دعا</span></div>
          <div class="admin-stat-card__num">${_usd(_sum('prayer'))}</div>
          <div style="font-size:var(--text-xs);color:var(--text-muted)">${_cnt('prayer')} سفارش</div>
        </div>
        <div class="admin-stat-card" style="border-top:3px solid #3b82f6">
          <div class="admin-stat-card__header"><span class="admin-stat-card__label">💬 مشاوره</span></div>
          <div class="admin-stat-card__num">${_usd(_sum('consultation'))}</div>
          <div style="font-size:var(--text-xs);color:var(--text-muted)">${_cnt('consultation')} سفارش</div>
        </div>
        <div class="admin-stat-card" style="border-top:3px solid #8b5cf6">
          <div class="admin-stat-card__header"><span class="admin-stat-card__label">⭐ استخاره</span></div>
          <div class="admin-stat-card__num">${_usd(_sum('istikhara'))}</div>
          <div style="font-size:var(--text-xs);color:var(--text-muted)">${_cnt('istikhara')} سفارش</div>
        </div>
        <div class="admin-stat-card" style="border-top:3px solid #f59e0b">
          <div class="admin-stat-card__header"><span class="admin-stat-card__label">📖 اشتراک قرآن</span></div>
          <div class="admin-stat-card__num">${_usd(_sum('quran_sub'))}</div>
          <div style="font-size:var(--text-xs);color:var(--text-muted)">${_cnt('quran_sub')} اشتراک</div>
        </div>
        <div class="admin-stat-card" style="border-top:3px solid #ec4899">
          <div class="admin-stat-card__header"><span class="admin-stat-card__label">📺 تبلیغات قرآن</span></div>
          <div class="admin-stat-card__num">${_usd(_sum('quran_ads'))}</div>
          <div style="font-size:var(--text-xs);color:var(--text-muted)">${_cnt('quran_ads')} بازدید</div>
        </div>
        <div class="admin-stat-card" style="border-top:3px solid #6b7280">
          <div class="admin-stat-card__header"><span class="admin-stat-card__label">💳 سایر پرداخت‌ها</span></div>
          <div class="admin-stat-card__num">${_usd(_sum('payment_other'))}</div>
          <div style="font-size:var(--text-xs);color:var(--text-muted)">${_cnt('payment_other')} تراکنش</div>
        </div>
      </div>
    `;
  }

  /* ── ردیف‌های جدول ماه‌ها ────────────────────────────────── */
  function _renderMonthRows(rows) {
    return rows.map(r => {
      const mn = new Date(+r.key.split('-')[0], +r.key.split('-')[1]-1, 1)
                   .toLocaleDateString('en-US', { month:'long', year:'numeric' });
      return `
        <tr class="revenue-month-row" data-month-key="${r.key}" style="cursor:pointer"
          onmouseover="this.style.background='rgba(42,157,143,0.04)'"
          onmouseout="this.style.background=''">
          <td style="font-weight:600">${mn}</td>
          <td style="color:#2a9d8f"><span style="color:var(--text-muted);font-size:10px">${r.prayer_count||0}×</span> <strong>${_usd(r.prayer)}</strong></td>
          <td style="color:#3b82f6"><span style="color:var(--text-muted);font-size:10px">${r.consultation_count||0}×</span> <strong>${_usd(r.consultation)}</strong></td>
          <td style="color:#8b5cf6"><span style="color:var(--text-muted);font-size:10px">${r.istikhara_count||0}×</span> <strong>${_usd(r.istikhara)}</strong></td>
          <td style="color:#f59e0b"><span style="color:var(--text-muted);font-size:10px">${r.quran_sub_count||0}×</span> <strong>${_usd(r.quran_sub)}</strong></td>
          <td style="color:#ec4899"><span style="color:var(--text-muted);font-size:10px">${r.quran_ads_count||0}×</span> <strong>${_usd(r.quran_ads)}</strong></td>
          <td style="color:#6b7280"><span style="color:var(--text-muted);font-size:10px">${r.payment_other_count||0}×</span> <strong>${_usd(r.payment_other)}</strong></td>
          <td style="background:rgba(22,163,74,0.06);font-weight:900;color:#16a34a">${_usd(r.total)}</td>
        </tr>`;
    }).join('');
  }

  /* ── رندر اصلی ────────────────────────────────────────────── */
  const allRows   = _collect();
  const yearGroups = _groupByYear(allRows);

  const TABLE_HEADER = `
    <thead>
      <tr>
        <th>ماه</th>
        <th>🤲 دعا<br/><span style="font-weight:400;font-size:10px">(تعداد / $)</span></th>
        <th>💬 مشاوره<br/><span style="font-weight:400;font-size:10px">(تعداد / $)</span></th>
        <th>⭐ استخاره<br/><span style="font-weight:400;font-size:10px">(تعداد / $)</span></th>
        <th>📖 اشتراک قرآن<br/><span style="font-weight:400;font-size:10px">(تعداد / $)</span></th>
        <th>📺 تبلیغات<br/><span style="font-weight:400;font-size:10px">(بازدید / $)</span></th>
        <th>💳 سایر<br/><span style="font-weight:400;font-size:10px">(تعداد / $)</span></th>
        <th style="background:rgba(22,163,74,0.08)">💰 جمع</th>
      </tr>
    </thead>`;

  container.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:var(--space-5)">

      <!-- هدر -->
      <div class="admin-page-header">
        <div>
          <h1 class="admin-page-title">
            <span class="admin-page-title__icon">💰</span>
            گزارش درآمد
          </h1>
          <p class="admin-page-desc">همه منابع درآمدی به تفکیک سال و ماه — فقط قابل مشاهده توسط ادمین</p>
        </div>
      </div>

      <!-- کارت‌های خلاصه کل -->
      ${_renderCards(allRows)}

      <!-- جدول سال به سال -->
      <div class="admin-panel">
        <div class="admin-panel__header">
          <div class="admin-panel__title">📅 گزارش سال به سال</div>
        </div>
        <div class="admin-panel__body" style="padding:0">
          ${allRows.length === 0 ? `
            <div style="text-align:center;padding:var(--space-12);color:var(--text-muted)">
              <div style="font-size:48px;margin-bottom:12px">📊</div>
              <p>هنوز هیچ درآمدی ثبت نشده</p>
            </div>
          ` : `
            <div style="overflow-x:auto">
              <table class="admin-table" style="min-width:1000px">
                ${TABLE_HEADER}
                <tbody id="revenue-tbody">
                  ${yearGroups.map(([year, yRows]) => {
                    const yTotal = yRows.reduce((s,r) => s+r.total, 0);
                    const _ys = sec => yRows.reduce((s,r) => s+(r[sec]||0), 0);
                    const _yc = sec => yRows.reduce((s,r) => s+(r[sec+'_count']||0), 0);
                    return `
                      <!-- ردیف سال -->
                      <tr class="revenue-year-row" data-year="${year}"
                        style="background:rgba(42,157,143,0.1);cursor:pointer;font-weight:900"
                        onmouseover="this.style.background='rgba(42,157,143,0.18)'"
                        onmouseout="this.style.background='rgba(42,157,143,0.1)'">
                        <td style="font-size:var(--text-base);font-weight:900">
                          <span class="year-arrow" data-year="${year}" style="margin-inline-end:8px;display:inline-block;transition:transform 0.2s">▶</span>
                          📆 ${year}
                        </td>
                        <td style="color:#2a9d8f;font-weight:700">${_yc('prayer')}× ${_usd(_ys('prayer'))}</td>
                        <td style="color:#3b82f6;font-weight:700">${_yc('consultation')}× ${_usd(_ys('consultation'))}</td>
                        <td style="color:#8b5cf6;font-weight:700">${_yc('istikhara')}× ${_usd(_ys('istikhara'))}</td>
                        <td style="color:#f59e0b;font-weight:700">${_yc('quran_sub')}× ${_usd(_ys('quran_sub'))}</td>
                        <td style="color:#ec4899;font-weight:700">${_yc('quran_ads')}× ${_usd(_ys('quran_ads'))}</td>
                        <td style="color:#6b7280;font-weight:700">${_yc('payment_other')}× ${_usd(_ys('payment_other'))}</td>
                        <td style="background:rgba(22,163,74,0.15);font-weight:900;color:#16a34a;font-size:var(--text-base)">${_usd(yTotal)}</td>
                      </tr>
                      <!-- ردیف‌های ماه‌های این سال (پنهان) -->
                      <tr class="revenue-months-container" data-year="${year}" style="display:none">
                        <td colspan="8" style="padding:0">
                          <table style="width:100%;border-collapse:collapse">
                            ${TABLE_HEADER}
                            <tbody>
                              ${_renderMonthRows(yRows)}
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    `;
                  }).join('')}
                  <!-- ردیف جمع کل همه سال‌ها -->
                  <tr style="background:rgba(22,163,74,0.08);border-top:2px solid rgba(22,163,74,0.3)">
                    <td style="font-weight:900">💰 جمع کل</td>
                    <td style="color:#2a9d8f;font-weight:900">${allRows.reduce((s,r)=>s+(r.prayer_count||0),0)}× ${_usd(allRows.reduce((s,r)=>s+r.prayer,0))}</td>
                    <td style="color:#3b82f6;font-weight:900">${allRows.reduce((s,r)=>s+(r.consultation_count||0),0)}× ${_usd(allRows.reduce((s,r)=>s+r.consultation,0))}</td>
                    <td style="color:#8b5cf6;font-weight:900">${allRows.reduce((s,r)=>s+(r.istikhara_count||0),0)}× ${_usd(allRows.reduce((s,r)=>s+r.istikhara,0))}</td>
                    <td style="color:#f59e0b;font-weight:900">${allRows.reduce((s,r)=>s+(r.quran_sub_count||0),0)}× ${_usd(allRows.reduce((s,r)=>s+r.quran_sub,0))}</td>
                    <td style="color:#ec4899;font-weight:900">${allRows.reduce((s,r)=>s+(r.quran_ads_count||0),0)}× ${_usd(allRows.reduce((s,r)=>s+r.quran_ads,0))}</td>
                    <td style="color:#6b7280;font-weight:900">${allRows.reduce((s,r)=>s+(r.payment_other_count||0),0)}× ${_usd(allRows.reduce((s,r)=>s+r.payment_other,0))}</td>
                    <td style="background:rgba(22,163,74,0.15);font-weight:900;color:#16a34a;font-size:var(--text-lg)">${_usd(allRows.reduce((s,r)=>s+r.total,0))}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          `}
        </div>
      </div>

    </div>
  `;

  /* ── Events: کلیک روی سال → باز/بسته شدن ماه‌ها ────────── */
  container.querySelectorAll('.revenue-year-row').forEach(row => {
    row.addEventListener('click', () => {
      const year        = row.dataset.year;
      const monthsRow   = container.querySelector(`.revenue-months-container[data-year="${year}"]`);
      const arrow       = row.querySelector('.year-arrow');
      const isOpen      = monthsRow?.style.display !== 'none';

      if (monthsRow) monthsRow.style.display = isOpen ? 'none' : 'table-row';
      if (arrow)     arrow.style.transform   = isOpen ? 'rotate(0deg)' : 'rotate(90deg)';
    });
  });

  /* ── Events: کلیک روی ماه → آپدیت کارت‌های بالا ──────── */
  container.querySelectorAll('.revenue-month-row').forEach(row => {
    row.addEventListener('click', () => {
      const key     = row.dataset.monthKey;
      const monthRow= allRows.find(r => r.key === key);
      if (!monthRow) return;

      /* هایلایت ردیف انتخاب‌شده */
      container.querySelectorAll('.revenue-month-row').forEach(r => r.style.background = '');
      row.style.background = 'rgba(42,157,143,0.08)';

      /* آپدیت کارت‌ها با داده همان ماه */
      const cardsEl = container.querySelector('#revenue-cards');
      if (cardsEl) cardsEl.outerHTML = _renderCards([monthRow]);

      /* اسکرول به بالا */
      container.querySelector('#revenue-cards')?.scrollIntoView({ behavior:'smooth', block:'start' });
    });
  });
}

/* تنظیمات */
function _renderSettingsPage(container) {
  container.innerHTML = `
    <div>
      <div class="admin-page-header">
        <h1 class="admin-page-title"><span class="admin-page-title__icon">⚙️</span> تنظیمات سایت</h1>
      </div>
      <div class="grid grid--2" style="gap:var(--space-5)">

        <div class="admin-panel">
          <div class="admin-panel__header"><div class="admin-panel__title">🤖 هوش مصنوعی</div></div>
          <div class="admin-panel__body">
            <div class="admin-field">
              <label class="admin-label" for="claude-key">Claude API Key</label>
              <input type="password" class="admin-input" id="claude-key"
                value="${localStorage.getItem('mh_claude_key')||''}" dir="ltr" placeholder="sk-ant-..."/>
            </div>
            <div class="admin-field">
              <label class="admin-label" for="el-key">ElevenLabs API Key</label>
              <input type="password" class="admin-input" id="el-key"
                value="${localStorage.getItem('mh_elevenlabs_key')||''}" dir="ltr" placeholder="sk_..."/>
            </div>
            <div class="admin-field">
              <label class="admin-label" for="voice-id">Voice ID استاد</label>
              <input type="text" class="admin-input" id="voice-id"
                value="${localStorage.getItem('mh_voice_id')||''}" dir="ltr"/>
            </div>
            <button class="btn btn--primary btn--sm" id="save-ai-keys">💾 ذخیره</button>
          </div>
        </div>

        <div class="admin-panel">
          <div class="admin-panel__header"><div class="admin-panel__title">🔥 Firebase Push</div></div>
          <div class="admin-panel__body">
            <div class="admin-field">
              <label class="admin-label" for="fb-key">Firebase API Key</label>
              <input type="password" class="admin-input" id="fb-key"
                value="${(()=>{try{return JSON.parse(localStorage.getItem('mh_firebase_config')||'{}').apiKey||'';}catch{return '';}})()}"
                dir="ltr" placeholder="AIzaSy..."/>
            </div>
            <div class="admin-field">
              <label class="admin-label" for="fb-project">Project ID</label>
              <input type="text" class="admin-input" id="fb-project"
                value="${(()=>{try{return JSON.parse(localStorage.getItem('mh_firebase_config')||'{}').projectId||'';}catch{return '';}})()}"
                dir="ltr"/>
            </div>
            <button class="btn btn--primary btn--sm" id="save-firebase">💾 ذخیره</button>
          </div>
        </div>

        <div class="admin-panel">
          <div class="admin-panel__header"><div class="admin-panel__title">🌐 تنظیمات عمومی</div></div>
          <div class="admin-panel__body" style="display:flex;flex-direction:column;gap:var(--space-4)">
            <label class="admin-toggle">
              <input type="checkbox" id="site-active" checked/>
              <div class="admin-toggle__track"><div class="admin-toggle__thumb"></div></div>
              <span class="admin-toggle__label">سایت آنلاین است</span>
            </label>
            <label class="admin-toggle">
              <input type="checkbox" id="reg-active" checked/>
              <div class="admin-toggle__track"><div class="admin-toggle__thumb"></div></div>
              <span class="admin-toggle__label">ثبت‌نام کاربر جدید باز است</span>
            </label>
          </div>
        </div>

        <div class="admin-panel">
          <div class="admin-panel__header"><div class="admin-panel__title">🔥 Firebase (آپلود عکس و ویدیو)</div></div>
          <div class="admin-panel__body">
            <div style="background:rgba(59,130,246,0.08);border:1px solid rgba(59,130,246,0.2);border-radius:8px;padding:12px 16px;margin-bottom:16px;font-size:13px;color:var(--text-secondary)">
              ℹ️ از همان Firebase که دارید برای آپلود عکس و ویدیو استفاده می‌شود. فقط <strong>Storage Bucket</strong> را وارد کنید.
            </div>
            <div class="admin-field">
              <label class="admin-label" for="fb-storage-bucket">Storage Bucket</label>
              <input type="text" class="admin-input" id="fb-storage-bucket"
                value="${(()=>{try{return JSON.parse(localStorage.getItem('mh_firebase_config')||'{}').storageBucket||'';}catch{return '';}})()}"
                dir="ltr" placeholder="your-project.appspot.com"/>
              <div style="font-size:12px;color:var(--text-muted);margin-top:4px">در Firebase Console → Storage → نام bucket را کپی کنید</div>
            </div>
            <button class="btn btn--primary btn--sm" id="save-fb-storage">💾 ذخیره</button>
          </div>
        </div>

        <div class="admin-panel">
          <div class="admin-panel__header"><div class="admin-panel__title">🔐 تغییر رمز ادمین</div></div>
          <div class="admin-panel__body">
            <div class="admin-field">
              <label class="admin-label" for="new-pass">رمز جدید</label>
              <input type="password" class="admin-input" id="new-pass" autocomplete="new-password"/>
            </div>
            <button class="btn btn--outline btn--sm" id="change-pass-btn">🔒 تغییر رمز</button>
          </div>
        </div>

      </div>
    </div>
  `;

  document.getElementById('save-ai-keys')?.addEventListener('click', () => {
    localStorage.setItem('mh_claude_key',       document.getElementById('claude-key')?.value||'');
    localStorage.setItem('mh_elevenlabs_key',   document.getElementById('el-key')?.value||'');
    localStorage.setItem('mh_voice_id',         document.getElementById('voice-id')?.value||'');
    _showToast('✓ API Keys ذخیره شد');
  });

  document.getElementById('save-firebase')?.addEventListener('click', () => {
    const cfg = {
      apiKey:    document.getElementById('fb-key')?.value||'',
      projectId: document.getElementById('fb-project')?.value||'',
    };
    localStorage.setItem('mh_firebase_config', JSON.stringify(cfg));
    _showToast('✓ Firebase ذخیره شد');
  });

  document.getElementById('save-fb-storage')?.addEventListener('click', () => {
    try {
      const cfg = JSON.parse(localStorage.getItem('mh_firebase_config') || '{}');
      cfg.storageBucket = document.getElementById('fb-storage-bucket')?.value?.trim() || '';
      localStorage.setItem('mh_firebase_config', JSON.stringify(cfg));
      _showToast('✓ Storage Bucket ذخیره شد');
    } catch { _showToast('خطا در ذخیره', false); }
  });

  document.getElementById('change-pass-btn')?.addEventListener('click', () => {
    const pass = document.getElementById('new-pass')?.value?.trim();
    if (!pass || pass.length < 8) { _showToast('⚠ رمز باید حداقل ۸ کاراکتر باشد', false); return; }
    localStorage.setItem('mh_admin_pass_override', pass);
    _showToast('✓ رمز تغییر یافت');
  });
}

/* ── Toast ── */
function _showToast(msg, ok = true) {
  const t = document.createElement('div');
  t.setAttribute('role', 'alert');
  t.style.cssText = `
    position:fixed;bottom:24px;inset-inline-end:24px;
    background:${ok ? '#16a34a' : '#e63946'};
    color:white;padding:12px 20px;border-radius:8px;
    font-size:14px;font-weight:600;z-index:9999;
    box-shadow:0 8px 24px rgba(0,0,0,0.25);
    animation:fadeIn 0.3s ease;
    font-family:var(--font-rtl-body);
  `;
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => {
    t.style.opacity = '0';
    t.style.transition = 'opacity 0.3s';
    setTimeout(() => t.remove(), 300);
  }, 3000);
}

/* ════════════════════════════════════════════════════════════
   جوایز و پیام‌های نیابتی — سیستم کامل مدیریت
   ════════════════════════════════════════════════════════════ */
function _renderGiftsPage(container) {
  const GIFTS_KEY              = 'mh_gifts_config';
  const SCHEDULES_KEY          = 'mh_gift_schedules';
  const MONTHLY_SCHEDULES_KEY  = 'mh_gift_monthly_schedules';
  const SENT_KEY               = 'mh_gift_sent_log';
  const MEDIA_KEY              = 'mh_gift_current_media';

  function _getConfig()           { try { return JSON.parse(localStorage.getItem(GIFTS_KEY) || 'null') || {}; } catch { return {}; } }
  function _getSchedules()        { try { return JSON.parse(localStorage.getItem(SCHEDULES_KEY) || '[]'); } catch { return []; } }
  function _getMonthlySchedules() { try { return JSON.parse(localStorage.getItem(MONTHLY_SCHEDULES_KEY) || '[]'); } catch { return []; } }
  function _getSentLog()          { try { return JSON.parse(localStorage.getItem(SENT_KEY) || '[]'); } catch { return []; } }
  function _getUsers()            { try { return JSON.parse(localStorage.getItem('mh_all_users') || '[]'); } catch { return []; } }
  function _getCurrentMedia()     { try { return JSON.parse(localStorage.getItem(MEDIA_KEY) || 'null') || {}; } catch { return {}; } }
  function _clearCurrentMedia()   { localStorage.removeItem(MEDIA_KEY); }

  const DAYS_FA = ['یکشنبه','دوشنبه','سه‌شنبه','چهارشنبه','پنجشنبه','جمعه','شنبه'];
  const DAYS_EN = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

  /* ── فعال‌سازی زمان‌بند پس‌زمینه ── */
  function _startScheduler() {
    clearInterval(window._giftSchedulerInterval);
    window._giftSchedulerInterval = setInterval(() => {
      const now = new Date();

      /* هفتگی */
      _getSchedules().filter(s => s.active).forEach(s => {
        const [h, m] = (s.time || '20:00').split(':').map(Number);
        if (now.getDay() === s.dayOfWeek && now.getHours() === h && now.getMinutes() === m) {
          const lastSent = s.lastSent ? new Date(s.lastSent) : null;
          const sameMin  = lastSent && lastSent.getFullYear() === now.getFullYear()
            && lastSent.getMonth() === now.getMonth() && lastSent.getDate() === now.getDate()
            && lastSent.getHours() === now.getHours() && lastSent.getMinutes() === now.getMinutes();
          if (!sameMin) _sendGift(s, false);
        }
      });

      /* ماهانه */
      _getMonthlySchedules().filter(s => s.active).forEach(s => {
        const [h, m] = (s.time || '20:00').split(':').map(Number);
        if (now.getDate() === s.dayOfMonth && now.getHours() === h && now.getMinutes() === m) {
          const lastSent = s.lastSent ? new Date(s.lastSent) : null;
          const sameMonth = lastSent && lastSent.getFullYear() === now.getFullYear()
            && lastSent.getMonth() === now.getMonth();
          if (!sameMonth) _sendGift(s, true);
        }
      });
    }, 60000);
  }

  /* ── ارسال جایزه به همه کاربران ── */
  async function _sendGift(schedule, isMonthly = false) {
    const users = _getUsers();
    const sent  = _getSentLog();
    const now   = new Date().toISOString();
    let count   = 0;

    /* عکس/ویدیو هفته جاری — اگر نباشد null ارسال می‌شود */
    const currentMedia = _getCurrentMedia();
    const imageUrl = currentMedia.imageUrl || null;
    const videoUrl = currentMedia.videoUrl || null;

    for (const user of users) {
      const lang = user.lang || 'fa';
      const name = user.name || '';

      /* ترجمه خودکار متن به زبان کاربر */
      let body = schedule.message || '';
      if (lang !== 'fa' && body) {
        try {
          const res = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: 'claude-sonnet-4-20250514',
              max_tokens: 400,
              messages: [{ role: 'user', content: `Translate this Persian text to ${lang}. Return ONLY the translation, nothing else:\n\n${body}` }],
            }),
          });
          const data = await res.json();
          body = data.content?.[0]?.text?.trim() || body;
        } catch {}
      }

      /* ساخت پیام با نام کاربر */
      const greetings = { fa:`کاربر عزیز ${name}،\n\n`, ar:`عزيزي ${name}،\n\n`, ur:`محترم ${name}،\n\n`, en:`Dear ${name},\n\n`, tr:`Değerli ${name},\n\n`, ru:`Уважаемый ${name},\n\n`, az:`Hörmətli ${name},\n\n`, id:`Yang terhormat ${name},\n\n` };
      const fullText  = (greetings[lang] || `${name}،\n\n`) + body;

      /* ذخیره پیام برای کاربر */
      try {
        const msgs = JSON.parse(localStorage.getItem('mh_notifications') || '[]');
        msgs.unshift({
          id:         'gift_' + Date.now() + '_' + user.id,
          type:       'gift',
          icon:       schedule.icon || '🕌',
          title:      { [lang]: schedule.title || 'پیام از کربلا', fa: schedule.title || 'پیام از کربلا' },
          text:       { [lang]: fullText, fa: fullText },
          imageUrl:   imageUrl,
          videoUrl:   videoUrl,
          userId:     user.id,
          time:       now,
          read:       false,
          scheduleId: schedule.id,
        });
        localStorage.setItem('mh_notifications', JSON.stringify(msgs));
        count++;
      } catch {}
    }

    /* ثبت در لاگ ارسال */
    sent.unshift({ scheduleId: schedule.id, sentAt: now, count });
    localStorage.setItem(SENT_KEY, JSON.stringify(sent.slice(0, 100)));

    /* پاک کردن عکس/ویدیو هفته جاری بعد از ارسال */
    if (!isMonthly) _clearCurrentMedia();

    /* آپدیت lastSent */
    const storageKey = isMonthly ? MONTHLY_SCHEDULES_KEY : SCHEDULES_KEY;
    const schedules = JSON.parse(localStorage.getItem(storageKey) || '[]');
    const idx = schedules.findIndex(s => s.id === schedule.id);
    if (idx !== -1) { schedules[idx].lastSent = now; localStorage.setItem(storageKey, JSON.stringify(schedules)); }

    _showToast(`✓ پیام برای ${count} کاربر ارسال شد`);
  }

  /* ── رندر اصلی ── */
  let _activeTab = 'ziarat';

  function _render() {
    const schedules = _getSchedules();
    const sentLog   = _getSentLog();
    const users     = _getUsers();

    const tabs = [
      { id:'ziarat',  icon:'🕌', label:'هفتگی' },
      { id:'monthly', icon:'📅', label:'ماهانه' },
      { id:'manual',  icon:'📤', label:'ارسال دستی' },
      { id:'log',     icon:'📋', label:'تاریخچه ارسال' },
    ];

    container.innerHTML = `
      <style>
        .gift-tab-bar { display:flex; gap:8px; margin-bottom:24px; flex-wrap:wrap; }
        .gift-tab { padding:10px 20px; border-radius:12px; border:2px solid var(--border-color); background:var(--bg-surface); cursor:pointer; font-size:14px; font-weight:600; color:var(--text-secondary); transition:all 0.2s; display:flex; align-items:center; gap:8px; }
        .gift-tab--active { border-color:var(--color-primary-500); background:var(--color-primary-50); color:var(--color-primary-700); }
        .gift-card { background:var(--bg-surface); border:1px solid var(--border-color); border-radius:16px; overflow:hidden; box-shadow:0 2px 12px rgba(0,0,0,0.06); margin-bottom:16px; }
        .gift-card__head { padding:16px 20px; display:flex; align-items:center; justify-content:space-between; border-bottom:1px solid var(--border-color); background:linear-gradient(135deg,var(--bg-surface-2),var(--bg-surface)); }
        .gift-card__body { padding:20px; }
        .gift-toggle { position:relative; width:48px; height:26px; }
        .gift-toggle input { opacity:0; width:0; height:0; }
        .gift-toggle__track { position:absolute; inset:0; background:#ccc; border-radius:999px; transition:0.3s; cursor:pointer; }
        .gift-toggle input:checked + .gift-toggle__track { background:var(--color-primary-500); }
        .gift-toggle__thumb { position:absolute; width:20px; height:20px; background:white; border-radius:50%; top:3px; right:3px; transition:0.3s; box-shadow:0 2px 4px rgba(0,0,0,0.2); }
        .gift-toggle input:checked ~ .gift-toggle__thumb { right:auto; left:3px; }
        .schedule-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(280px,1fr)); gap:16px; margin-top:16px; }
        .day-picker { display:flex; gap:6px; flex-wrap:wrap; margin-top:8px; }
        .day-chip { padding:6px 14px; border-radius:999px; border:2px solid var(--border-color); cursor:pointer; font-size:13px; transition:all 0.2s; background:var(--bg-surface); }
        .day-chip--active { border-color:var(--color-primary-500); background:var(--color-primary-100); color:var(--color-primary-700); font-weight:700; }
        .stat-pill { display:inline-flex; align-items:center; gap:6px; padding:4px 12px; border-radius:999px; font-size:12px; font-weight:600; }
        .log-row { display:grid; grid-template-columns:1fr auto auto; gap:12px; align-items:center; padding:12px 0; border-bottom:1px solid var(--border-color); }
      </style>

      <div style="display:flex;align-items:center;gap:12px;margin-bottom:24px">
        <span style="font-size:32px">🕌</span>
        <div>
          <h2 style="font-size:1.4rem;font-weight:900;color:var(--text-primary);margin:0">جوایز و پیام‌های نیابتی</h2>
          <p style="font-size:13px;color:var(--text-muted);margin:4px 0 0">ارسال پیام زیارت نیابتی و جوایز به همه اعضا</p>
        </div>
        <div style="margin-inline-start:auto;display:flex;gap:8px">
          <div class="stat-pill" style="background:rgba(42,157,143,0.1);color:var(--color-primary-600)">👥 ${users.length} عضو</div>
          <div class="stat-pill" style="background:rgba(139,92,246,0.1);color:#7c3aed">📅 ${schedules.filter(s=>s.active).length} زمان‌بند فعال</div>
        </div>
      </div>

      <div class="gift-tab-bar">
        ${tabs.map(t => `<button class="gift-tab ${_activeTab===t.id?'gift-tab--active':''}" data-tab="${t.id}">${t.icon} ${t.label}</button>`).join('')}
      </div>

      <div id="gift-tab-content">
        ${_activeTab === 'ziarat'  ? _renderZiaratTab(schedules) : ''}
        ${_activeTab === 'monthly' ? _renderMonthlyTab()          : ''}
        ${_activeTab === 'manual'  ? _renderManualTab()           : ''}
        ${_activeTab === 'log'     ? _renderLogTab(sentLog)       : ''}
      </div>
    `;

    _bindGiftEvents(container);
    _startScheduler();
  }

  /* ── تب زیارت نیابتی (زمان‌بندشده) ── */
  function _renderZiaratTab(schedules) {
    const media = _getCurrentMedia();
    return `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
        <h3 style="font-size:1rem;font-weight:700;color:var(--text-primary);margin:0">زمان‌بندهای پیام زیارت</h3>
        <button class="btn btn--primary btn--sm" id="add-schedule-btn">+ افزودن زمان‌بند</button>
      </div>

      <!-- عکس/ویدیو هفته جاری -->
      <div class="gift-card" style="margin-bottom:20px;border:2px solid var(--color-primary-500)">
        <div class="gift-card__head">
          <span style="font-weight:700;color:var(--color-primary-700)">📎 عکس/ویدیو هفته جاری</span>
          <span style="font-size:12px;color:var(--text-muted)">بعد از ارسال اتوماتیک پاک می‌شود</span>
        </div>
        <div class="gift-card__body">
          <p style="font-size:12px;color:var(--text-muted);margin-bottom:12px">اگر چیزی آپلود نکنید، فقط متن پیام ارسال می‌شود.</p>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
            <div class="admin-field">
              <label class="admin-label">تصویر این هفته</label>
              <div style="display:flex;gap:6px;align-items:center">
                <input type="url" class="admin-input" id="current-image" value="${media.imageUrl||''}" placeholder="https://..." dir="ltr" style="flex:1;font-size:12px"/>
                <label class="btn btn--outline btn--sm" style="cursor:pointer;white-space:nowrap;flex-shrink:0">
                  📷
                  <input type="file" accept="image/*" style="display:none" onchange="window._cloudinaryUpload(this,'current-image')"/>
                </label>
              </div>
              ${media.imageUrl ? `<div style="font-size:11px;color:#16a34a;margin-top:4px">✓ تصویر آماده ارسال است</div>` : ''}
            </div>
            <div class="admin-field">
              <label class="admin-label">ویدیو این هفته</label>
              <div style="display:flex;gap:6px;align-items:center">
                <input type="url" class="admin-input" id="current-video" value="${media.videoUrl||''}" placeholder="https://..." dir="ltr" style="flex:1;font-size:12px"/>
                <label class="btn btn--outline btn--sm" style="cursor:pointer;white-space:nowrap;flex-shrink:0">
                  🎥
                  <input type="file" accept="video/*" style="display:none" onchange="window._cloudinaryUpload(this,'current-video')"/>
                </label>
              </div>
              ${media.videoUrl ? `<div style="font-size:11px;color:#16a34a;margin-top:4px">✓ ویدیو آماده ارسال است</div>` : ''}
            </div>
          </div>
          <button class="btn btn--primary btn--sm" id="save-current-media" style="margin-top:12px">💾 ذخیره</button>
          ${(media.imageUrl || media.videoUrl) ? `<button class="btn btn--ghost btn--sm" id="clear-current-media" style="margin-top:12px;margin-inline-start:8px;color:#e63946">🗑 پاک کردن</button>` : ''}
        </div>
      </div>

      ${schedules.length === 0 ? `
        <div style="text-align:center;padding:48px;color:var(--text-muted)">
          <div style="font-size:48px;margin-bottom:12px">📅</div>
          <p>هنوز زمان‌بندی تنظیم نشده.</p>
          <button class="btn btn--primary btn--sm" id="add-schedule-btn2" style="margin-top:8px">+ افزودن اولین زمان‌بند</button>
        </div>
      ` : `
        <div class="schedule-grid">
          ${schedules.map(s => `
            <div class="gift-card">
              <div class="gift-card__head">
                <div style="display:flex;align-items:center;gap:10px">
                  <span style="font-size:24px">${s.icon||'🕌'}</span>
                  <div>
                    <div style="font-weight:700;font-size:14px;color:var(--text-primary)">${s.title||'بدون عنوان'}</div>
                    <div style="font-size:12px;color:var(--text-muted)">${DAYS_FA[s.dayOfWeek]||'—'} ساعت ${s.time||'00:00'}</div>
                  </div>
                </div>
                <label class="gift-toggle" title="${s.active?'غیرفعال کردن':'فعال کردن'}">
                  <input type="checkbox" class="schedule-toggle" data-id="${s.id}" ${s.active?'checked':''}/>
                  <div class="gift-toggle__track"></div>
                  <div class="gift-toggle__thumb"></div>
                </label>
              </div>
              <div class="gift-card__body">
                <p style="font-size:13px;color:var(--text-secondary);line-height:1.7;margin:0 0 12px;max-height:60px;overflow:hidden">${s.message||'—'}</p>
                ${s.imageUrl ? `<div style="font-size:12px;color:var(--color-primary-600)">📷 تصویر پیوست</div>` : ''}
                ${s.videoUrl ? `<div style="font-size:12px;color:var(--color-primary-600)">🎥 ویدیو پیوست</div>` : ''}
                <div style="display:flex;gap:8px;margin-top:12px">
                  <button class="btn btn--outline btn--sm edit-schedule-btn" data-id="${s.id}">✏️ ویرایش</button>
                  <button class="btn btn--ghost btn--sm send-now-btn" data-id="${s.id}" style="color:var(--color-primary-600)">📤 ارسال همین الان</button>
                  <button class="btn btn--ghost btn--sm delete-schedule-btn" data-id="${s.id}" style="color:#e63946;margin-inline-start:auto">🗑</button>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      `}

      <!-- فرم افزودن/ویرایش -->
      <div id="schedule-form-container"></div>
    `;
  }

  /* ── فرم ساخت/ویرایش زمان‌بند ── */
  function _renderScheduleForm(existing = null) {
    const s = existing || { id: null, title:'', icon:'🕌', message:'', dayOfWeek:4, time:'20:00', active:true, imageUrl:'', videoUrl:'' };
    return `
      <div class="gift-card" style="margin-top:16px;border:2px solid var(--color-primary-500)">
        <div class="gift-card__head">
          <span style="font-weight:700;color:var(--color-primary-700)">${s.id ? '✏️ ویرایش زمان‌بند' : '+ زمان‌بند جدید'}</span>
          <button class="btn btn--ghost btn--sm" id="close-schedule-form">✕</button>
        </div>
        <div class="gift-card__body">
          <div class="grid grid--2" style="gap:16px">

            <div class="admin-field">
              <label class="admin-label">عنوان پیام</label>
              <input type="text" class="admin-input" id="sf-title" value="${s.title}" placeholder="مثلاً: زیارت شب جمعه"/>
            </div>

            <div class="admin-field">
              <label class="admin-label">آیکون</label>
              <div style="display:flex;gap:8px;flex-wrap:wrap" id="sf-icon-picker">
                ${['🕌','⭐','🌹','📿','🤲','💚','🌙','✨'].map(ic=>`
                  <button type="button" class="icon-pick-btn" data-icon="${ic}" style="font-size:24px;padding:6px 10px;border-radius:8px;border:2px solid ${s.icon===ic?'var(--color-primary-500)':'var(--border-color)'};background:${s.icon===ic?'var(--color-primary-50)':'var(--bg-surface)'};cursor:pointer">${ic}</button>
                `).join('')}
              </div>
              <input type="hidden" id="sf-icon" value="${s.icon||'🕌'}"/>
            </div>

            <div class="admin-field" style="grid-column:1/-1">
              <label class="admin-label">متن پیام (فارسی — خودکار به همه زبان‌ها ترجمه می‌شود)</label>
              <textarea class="admin-input" id="sf-message" rows="4" placeholder="کاربر عزیز، امشب در حرم مطهر امام حسین (ع) زیارت نیابتی برای شما انجام شد..." style="resize:vertical">${s.message}</textarea>
              <div style="font-size:12px;color:var(--text-muted);margin-top:4px">🌐 این متن به صورت خودکار به زبان هر کاربر ترجمه می‌شود و نام کاربر در ابتدای پیام درج می‌گردد.</div>
            </div>

            <div class="admin-field">
              <label class="admin-label">روز هفته</label>
              <div class="day-picker" id="sf-day-picker">
                ${DAYS_FA.map((d,i) => `<button type="button" class="day-chip ${s.dayOfWeek===i?'day-chip--active':''}" data-day="${i}">${d}</button>`).join('')}
              </div>
              <input type="hidden" id="sf-day" value="${s.dayOfWeek}"/>
            </div>

            <div class="admin-field">
              <label class="admin-label">ساعت ارسال</label>
              <input type="time" class="admin-input" id="sf-time" value="${s.time}" style="max-width:160px"/>
            </div>

            <div class="admin-field">
              <label class="admin-label">تصویر (اختیاری)</label>
              <div style="display:flex;gap:8px;align-items:center">
                <input type="url" class="admin-input" id="sf-image" value="${s.imageUrl||''}" placeholder="https://..." dir="ltr" style="flex:1"/>
                <label class="btn btn--outline btn--sm" style="cursor:pointer;white-space:nowrap;flex-shrink:0" title="آپلود از گوشی">
                  📷 آپلود
                  <input type="file" accept="image/*" style="display:none" onchange="window._cloudinaryUpload(this,'sf-image')"/>
                </label>
              </div>
            </div>

            <div class="admin-field">
              <label class="admin-label">ویدیو (اختیاری)</label>
              <div style="display:flex;gap:8px;align-items:center">
                <input type="url" class="admin-input" id="sf-video" value="${s.videoUrl||''}" placeholder="https://..." dir="ltr" style="flex:1"/>
                <label class="btn btn--outline btn--sm" style="cursor:pointer;white-space:nowrap;flex-shrink:0" title="آپلود از گوشی">
                  🎥 آپلود
                  <input type="file" accept="video/*" style="display:none" onchange="window._cloudinaryUpload(this,'sf-video')"/>
                </label>
              </div>
            </div>

          </div>

          <div style="display:flex;gap:10px;margin-top:20px">
            <button class="btn btn--primary" id="save-schedule-btn" data-id="${s.id||''}">💾 ذخیره</button>
            <button class="btn btn--ghost" id="close-schedule-form2">انصراف</button>
          </div>
        </div>
      </div>
    `;
  }

  /* ── تب ماهانه ── */
  function _renderMonthlyTab() {
    const schedules = _getMonthlySchedules();
    const days = Array.from({length:31}, (_,i) => i+1);
    return `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
        <h3 style="font-size:1rem;font-weight:700;color:var(--text-primary);margin:0">زمان‌بندهای پیام ماهانه</h3>
        <button class="btn btn--primary btn--sm" id="add-monthly-btn">+ افزودن زمان‌بند ماهانه</button>
      </div>

      ${schedules.length === 0 ? `
        <div style="text-align:center;padding:48px;color:var(--text-muted)">
          <div style="font-size:48px;margin-bottom:12px">📅</div>
          <p>هنوز زمان‌بند ماهانه‌ای تنظیم نشده.</p>
          <button class="btn btn--primary btn--sm" id="add-monthly-btn2" style="margin-top:8px">+ افزودن اولین زمان‌بند</button>
        </div>
      ` : `
        <div class="schedule-grid">
          ${schedules.map(s => `
            <div class="gift-card">
              <div class="gift-card__head">
                <div style="display:flex;align-items:center;gap:10px">
                  <span style="font-size:24px">${s.icon||'📅'}</span>
                  <div>
                    <div style="font-weight:700;font-size:14px;color:var(--text-primary)">${s.title||'بدون عنوان'}</div>
                    <div style="font-size:12px;color:var(--text-muted)">روز ${s.dayOfMonth} هر ماه — ساعت ${s.time||'00:00'}</div>
                  </div>
                </div>
                <label class="gift-toggle">
                  <input type="checkbox" class="monthly-toggle" data-id="${s.id}" ${s.active?'checked':''}/>
                  <div class="gift-toggle__track"></div>
                  <div class="gift-toggle__thumb"></div>
                </label>
              </div>
              <div class="gift-card__body">
                <p style="font-size:13px;color:var(--text-secondary);line-height:1.7;margin:0 0 12px;max-height:60px;overflow:hidden">${s.message||'—'}</p>
                <div style="display:flex;gap:8px;margin-top:12px">
                  <button class="btn btn--outline btn--sm edit-monthly-btn" data-id="${s.id}">✏️ ویرایش</button>
                  <button class="btn btn--ghost btn--sm send-monthly-now-btn" data-id="${s.id}" style="color:var(--color-primary-600)">📤 ارسال همین الان</button>
                  <button class="btn btn--ghost btn--sm delete-monthly-btn" data-id="${s.id}" style="color:#e63946;margin-inline-start:auto">🗑</button>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      `}
      <div id="monthly-form-container"></div>
    `;
  }

  /* ── فرم ماهانه ── */
  function _renderMonthlyForm(existing = null) {
    const s = existing || { id:null, title:'', icon:'📅', message:'', dayOfMonth:1, time:'20:00', active:true };
    const days = Array.from({length:31}, (_,i) => i+1);
    return `
      <div class="gift-card" style="margin-top:16px;border:2px solid var(--color-primary-500)">
        <div class="gift-card__head">
          <span style="font-weight:700;color:var(--color-primary-700)">${s.id ? '✏️ ویرایش زمان‌بند ماهانه' : '+ زمان‌بند ماهانه جدید'}</span>
          <button class="btn btn--ghost btn--sm" id="close-monthly-form">✕</button>
        </div>
        <div class="gift-card__body">
          <div class="grid grid--2" style="gap:16px">

            <div class="admin-field">
              <label class="admin-label">عنوان پیام</label>
              <input type="text" class="admin-input" id="mf-title" value="${s.title}" placeholder="مثلاً: ختم ماهانه قرآن"/>
            </div>

            <div class="admin-field">
              <label class="admin-label">آیکون</label>
              <div style="display:flex;gap:6px;flex-wrap:wrap" id="mf-icon-picker">
                ${['📅','🕌','⭐','🌹','📖','🤲','💚','🌙'].map(ic=>`
                  <button type="button" class="mf-icon-btn" data-icon="${ic}" style="font-size:22px;padding:5px 9px;border-radius:8px;border:2px solid ${s.icon===ic?'var(--color-primary-500)':'var(--border-color)'};background:${s.icon===ic?'var(--color-primary-50)':'var(--bg-surface)'};cursor:pointer">${ic}</button>
                `).join('')}
              </div>
              <input type="hidden" id="mf-icon" value="${s.icon||'📅'}"/>
            </div>

            <div class="admin-field" style="grid-column:1/-1">
              <label class="admin-label">متن پیام (فارسی — خودکار به همه زبان‌ها ترجمه می‌شود)</label>
              <textarea class="admin-input" id="mf-message" rows="4" placeholder="ختم ماهانه قرآن کریم در حرم مطهر امام رضا (ع) به نیابت از شما انجام شد..." style="resize:vertical">${s.message}</textarea>
              <div style="font-size:12px;color:var(--text-muted);margin-top:4px">🌐 نام کاربر اتوماتیک در ابتدای پیام درج می‌شود.</div>
            </div>

            <div class="admin-field">
              <label class="admin-label">روز ماه</label>
              <select class="admin-input" id="mf-day" style="max-width:120px">
                ${days.map(d=>`<option value="${d}" ${s.dayOfMonth===d?'selected':''}>${d}</option>`).join('')}
              </select>
            </div>

            <div class="admin-field">
              <label class="admin-label">ساعت ارسال</label>
              <input type="time" class="admin-input" id="mf-time" value="${s.time}" style="max-width:160px"/>
            </div>

          </div>

          <div style="display:flex;gap:10px;margin-top:20px">
            <button class="btn btn--primary" id="save-monthly-btn" data-id="${s.id||''}">💾 ذخیره</button>
            <button class="btn btn--ghost" id="close-monthly-form2">انصراف</button>
          </div>
        </div>
      </div>
    `;
  }

  /* ── تب ارسال دستی ── */
  function _renderManualTab() {
    const users = _getUsers();
    return `
      <div class="gift-card">
        <div class="gift-card__head">
          <span style="font-weight:700">📤 ارسال پیام دستی به همه اعضا</span>
          <span class="stat-pill" style="background:rgba(42,157,143,0.1);color:var(--color-primary-600)">👥 ${users.length} عضو</span>
        </div>
        <div class="gift-card__body">
          <div class="grid grid--2" style="gap:16px">

            <div class="admin-field">
              <label class="admin-label">عنوان پیام</label>
              <input type="text" class="admin-input" id="manual-title" placeholder="مثلاً: زیارت امام علی (ع)"/>
            </div>

            <div class="admin-field">
              <label class="admin-label">آیکون</label>
              <div style="display:flex;gap:6px;flex-wrap:wrap" id="manual-icon-picker">
                ${['🕌','⭐','🌹','📿','🤲','💚','🌙','✨'].map((ic,i)=>`
                  <button type="button" class="manual-icon-btn" data-icon="${ic}" style="font-size:22px;padding:5px 9px;border-radius:8px;border:2px solid ${i===0?'var(--color-primary-500)':'var(--border-color)'};background:${i===0?'var(--color-primary-50)':'var(--bg-surface)'};cursor:pointer">${ic}</button>
                `).join('')}
              </div>
              <input type="hidden" id="manual-icon" value="🕌"/>
            </div>

            <div class="admin-field" style="grid-column:1/-1">
              <label class="admin-label">متن پیام (فارسی — خودکار به همه زبان‌ها ترجمه می‌شود)</label>
              <textarea class="admin-input" id="manual-message" rows="5" placeholder="امشب در حرم مطهر امام علی (ع) زیارت نیابتی برای شما انجام شد..." style="resize:vertical"></textarea>
            </div>

            <div class="admin-field">
              <label class="admin-label">تصویر (اختیاری)</label>
              <div style="display:flex;gap:8px;align-items:center">
                <input type="url" class="admin-input" id="manual-image" placeholder="https://..." dir="ltr" style="flex:1"/>
                <label class="btn btn--outline btn--sm" style="cursor:pointer;white-space:nowrap;flex-shrink:0" title="آپلود از گوشی">
                  📷 آپلود
                  <input type="file" accept="image/*" style="display:none" onchange="window._cloudinaryUpload(this,'manual-image')"/>
                </label>
              </div>
            </div>

            <div class="admin-field">
              <label class="admin-label">ویدیو (اختیاری)</label>
              <div style="display:flex;gap:8px;align-items:center">
                <input type="url" class="admin-input" id="manual-video" placeholder="https://..." dir="ltr" style="flex:1"/>
                <label class="btn btn--outline btn--sm" style="cursor:pointer;white-space:nowrap;flex-shrink:0" title="آپلود از گوشی">
                  🎥 آپلود
                  <input type="file" accept="video/*" style="display:none" onchange="window._cloudinaryUpload(this,'manual-video')"/>
                </label>
              </div>
            </div>

          </div>

          <div style="margin-top:20px;padding:12px 16px;background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.3);border-radius:10px;font-size:13px;color:#92400e">
            ⚠️ این پیام بلافاصله برای <strong>همه ${users.length} عضو</strong> ارسال می‌شود و به زبان هر کاربر ترجمه خواهد شد.
          </div>

          <div style="margin-top:16px;display:flex;gap:10px">
            <button class="btn btn--primary" id="send-manual-btn">📤 ارسال فوری به همه</button>
          </div>
          <div id="manual-send-status" style="margin-top:12px"></div>
        </div>
      </div>
    `;
  }

  /* ── تب تاریخچه ── */
  function _renderLogTab(sentLog) {
    return `
      <div class="gift-card">
        <div class="gift-card__head">
          <span style="font-weight:700">📋 تاریخچه ارسال پیام‌ها</span>
          <span class="stat-pill" style="background:rgba(99,102,241,0.1);color:#4f46e5">${sentLog.length} ارسال</span>
        </div>
        <div class="gift-card__body">
          ${sentLog.length === 0 ? `<div style="text-align:center;padding:32px;color:var(--text-muted)">هنوز پیامی ارسال نشده</div>` : `
            ${sentLog.map(l => `
              <div class="log-row">
                <div>
                  <div style="font-size:13px;font-weight:600;color:var(--text-primary)">${l.scheduleId === 'manual' ? '📤 ارسال دستی' : `📅 ${l.scheduleId}`}</div>
                  <div style="font-size:12px;color:var(--text-muted)">${new Date(l.sentAt).toLocaleString('fa-IR')}</div>
                </div>
                <div class="stat-pill" style="background:rgba(42,157,143,0.1);color:var(--color-primary-600)">👥 ${l.count} نفر</div>
              </div>
            `).join('')}
          `}
        </div>
      </div>
    `;
  }

  /* ── Event Bindings ── */
  function _bindGiftEvents(el) {
    /* تب‌ها */
    el.querySelectorAll('.gift-tab').forEach(btn => {
      btn.addEventListener('click', () => { _activeTab = btn.dataset.tab; _render(); });
    });

    /* ── ماهانه ── */
    ['add-monthly-btn','add-monthly-btn2'].forEach(id => {
      el.querySelector(`#${id}`)?.addEventListener('click', () => {
        const fc = el.querySelector('#monthly-form-container');
        if (fc) { fc.innerHTML = _renderMonthlyForm(); _bindMonthlyFormEvents(el); }
      });
    });

    el.querySelectorAll('.edit-monthly-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const s = _getMonthlySchedules().find(x => x.id === btn.dataset.id);
        const fc = el.querySelector('#monthly-form-container');
        if (fc && s) { fc.innerHTML = _renderMonthlyForm(s); _bindMonthlyFormEvents(el); fc.scrollIntoView({behavior:'smooth'}); }
      });
    });

    el.querySelectorAll('.delete-monthly-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (!confirm('این زمان‌بند ماهانه حذف شود؟')) return;
        const updated = _getMonthlySchedules().filter(s => s.id !== btn.dataset.id);
        localStorage.setItem(MONTHLY_SCHEDULES_KEY, JSON.stringify(updated));
        _render();
      });
    });

    el.querySelectorAll('.monthly-toggle').forEach(chk => {
      chk.addEventListener('change', () => {
        const schedules = _getMonthlySchedules();
        const idx = schedules.findIndex(s => s.id === chk.dataset.id);
        if (idx !== -1) { schedules[idx].active = chk.checked; localStorage.setItem(MONTHLY_SCHEDULES_KEY, JSON.stringify(schedules)); }
      });
    });

    el.querySelectorAll('.send-monthly-now-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const s = _getMonthlySchedules().find(x => x.id === btn.dataset.id);
        if (!s) return;
        btn.disabled = true; btn.textContent = '⏳ در حال ارسال...';
        await _sendGift(s, true);
        btn.disabled = false; btn.textContent = '📤 ارسال همین الان';
        _render();
      });
    });

    /* ذخیره عکس/ویدیو هفته جاری */
    el.querySelector('#save-current-media')?.addEventListener('click', () => {
      const imageUrl = el.querySelector('#current-image')?.value?.trim() || '';
      const videoUrl = el.querySelector('#current-video')?.value?.trim() || '';
      localStorage.setItem(MEDIA_KEY, JSON.stringify({ imageUrl: imageUrl||null, videoUrl: videoUrl||null }));
      _showToast('✓ عکس/ویدیو هفته جاری ذخیره شد');
      _render();
    });

    /* پاک کردن عکس/ویدیو هفته جاری */
    el.querySelector('#clear-current-media')?.addEventListener('click', () => {
      _clearCurrentMedia();
      _showToast('✓ پاک شد');
      _render();
    });

    /* باز کردن فرم افزودن */
    ['add-schedule-btn','add-schedule-btn2'].forEach(id => {
      el.querySelector(`#${id}`)?.addEventListener('click', () => {
        const fc = el.querySelector('#schedule-form-container');
        if (fc) { fc.innerHTML = _renderScheduleForm(); _bindFormEvents(el); }
      });
    });

    /* ویرایش */
    el.querySelectorAll('.edit-schedule-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const schedules = _getSchedules();
        const s = schedules.find(x => x.id === btn.dataset.id);
        const fc = el.querySelector('#schedule-form-container');
        if (fc && s) { fc.innerHTML = _renderScheduleForm(s); _bindFormEvents(el); fc.scrollIntoView({behavior:'smooth'}); }
      });
    });

    /* حذف */
    el.querySelectorAll('.delete-schedule-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (!confirm('این زمان‌بند حذف شود؟')) return;
        const schedules = _getSchedules().filter(s => s.id !== btn.dataset.id);
        localStorage.setItem(SCHEDULES_KEY, JSON.stringify(schedules));
        _render();
      });
    });

    /* toggle فعال/غیرفعال */
    el.querySelectorAll('.schedule-toggle').forEach(chk => {
      chk.addEventListener('change', () => {
        const schedules = _getSchedules();
        const idx = schedules.findIndex(s => s.id === chk.dataset.id);
        if (idx !== -1) { schedules[idx].active = chk.checked; localStorage.setItem(SCHEDULES_KEY, JSON.stringify(schedules)); }
      });
    });

    /* ارسال همین الان */
    el.querySelectorAll('.send-now-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const s = _getSchedules().find(x => x.id === btn.dataset.id);
        if (!s) return;
        btn.disabled = true; btn.textContent = '⏳ در حال ارسال...';
        await _sendGift(s);
        btn.disabled = false; btn.textContent = '📤 ارسال همین الان';
        _render();
      });
    });

    /* ارسال دستی */
    el.querySelector('#send-manual-btn')?.addEventListener('click', async () => {
      const title   = el.querySelector('#manual-title')?.value?.trim();
      const message = el.querySelector('#manual-message')?.value?.trim();
      const icon    = el.querySelector('#manual-icon')?.value || '🕌';
      const imageUrl= el.querySelector('#manual-image')?.value?.trim() || '';
      const videoUrl= el.querySelector('#manual-video')?.value?.trim() || '';
      if (!message) { _showToast('متن پیام خالی است', false); return; }
      const btn = el.querySelector('#send-manual-btn');
      btn.disabled = true; btn.textContent = '⏳ در حال ارسال...';
      const statusEl = el.querySelector('#manual-send-status');
      if (statusEl) statusEl.innerHTML = `<div style="color:var(--text-muted);font-size:13px">در حال ترجمه و ارسال...</div>`;
      await _sendGift({ id:'manual', title: title||'پیام از کربلا', icon, message, imageUrl, videoUrl });
      btn.disabled = false; btn.textContent = '📤 ارسال فوری به همه';
      if (statusEl) statusEl.innerHTML = '';
    });

    /* icon picker دستی */
    el.querySelectorAll('.manual-icon-btn').forEach(b => {
      b.addEventListener('click', () => {
        el.querySelectorAll('.manual-icon-btn').forEach(x => { x.style.borderColor='var(--border-color)'; x.style.background='var(--bg-surface)'; });
        b.style.borderColor='var(--color-primary-500)'; b.style.background='var(--color-primary-50)';
        const inp = el.querySelector('#manual-icon'); if(inp) inp.value = b.dataset.icon;
      });
    });
  }

  /* ── Event Bindings فرم زمان‌بند ── */
  function _bindFormEvents(el) {
    /* بستن فرم */
    ['close-schedule-form','close-schedule-form2'].forEach(id => {
      el.querySelector(`#${id}`)?.addEventListener('click', () => {
        const fc = el.querySelector('#schedule-form-container'); if(fc) fc.innerHTML='';
      });
    });

    /* icon picker */
    el.querySelectorAll('.icon-pick-btn').forEach(b => {
      b.addEventListener('click', () => {
        el.querySelectorAll('.icon-pick-btn').forEach(x => { x.style.borderColor='var(--border-color)'; x.style.background='var(--bg-surface)'; });
        b.style.borderColor='var(--color-primary-500)'; b.style.background='var(--color-primary-50)';
        const inp = el.querySelector('#sf-icon'); if(inp) inp.value = b.dataset.icon;
      });
    });

    /* day picker */
    el.querySelectorAll('.day-chip').forEach(b => {
      b.addEventListener('click', () => {
        el.querySelectorAll('.day-chip').forEach(x => x.classList.remove('day-chip--active'));
        b.classList.add('day-chip--active');
        const inp = el.querySelector('#sf-day'); if(inp) inp.value = b.dataset.day;
      });
    });

    /* ذخیره */
    el.querySelector('#save-schedule-btn')?.addEventListener('click', () => {
      const id      = el.querySelector('#save-schedule-btn')?.dataset.id;
      const title   = el.querySelector('#sf-title')?.value?.trim();
      const icon    = el.querySelector('#sf-icon')?.value || '🕌';
      const message = el.querySelector('#sf-message')?.value?.trim();
      const day     = parseInt(el.querySelector('#sf-day')?.value ?? '4');
      const time    = el.querySelector('#sf-time')?.value || '20:00';
      const imageUrl= el.querySelector('#sf-image')?.value?.trim() || '';
      const videoUrl= el.querySelector('#sf-video')?.value?.trim() || '';
      if (!message) { _showToast('متن پیام خالی است', false); return; }
      const schedules = _getSchedules();
      if (id) {
        const idx = schedules.findIndex(s => s.id === id);
        if (idx !== -1) schedules[idx] = { ...schedules[idx], title, icon, message, dayOfWeek:day, time, imageUrl, videoUrl };
      } else {
        schedules.push({ id:'sch_'+Date.now(), title, icon, message, dayOfWeek:day, time, imageUrl, videoUrl, active:true, lastSent:null });
      }
      localStorage.setItem(SCHEDULES_KEY, JSON.stringify(schedules));
      _showToast('✓ زمان‌بند ذخیره شد');
      _render();
    });
  }

  /* ── Event Bindings فرم ماهانه ── */
  function _bindMonthlyFormEvents(el) {
    ['close-monthly-form','close-monthly-form2'].forEach(id => {
      el.querySelector(`#${id}`)?.addEventListener('click', () => {
        const fc = el.querySelector('#monthly-form-container'); if(fc) fc.innerHTML='';
      });
    });

    el.querySelectorAll('.mf-icon-btn').forEach(b => {
      b.addEventListener('click', () => {
        el.querySelectorAll('.mf-icon-btn').forEach(x => { x.style.borderColor='var(--border-color)'; x.style.background='var(--bg-surface)'; });
        b.style.borderColor='var(--color-primary-500)'; b.style.background='var(--color-primary-50)';
        const inp = el.querySelector('#mf-icon'); if(inp) inp.value = b.dataset.icon;
      });
    });

    el.querySelector('#save-monthly-btn')?.addEventListener('click', () => {
      const id      = el.querySelector('#save-monthly-btn')?.dataset.id;
      const title   = el.querySelector('#mf-title')?.value?.trim();
      const icon    = el.querySelector('#mf-icon')?.value || '📅';
      const message = el.querySelector('#mf-message')?.value?.trim();
      const day     = parseInt(el.querySelector('#mf-day')?.value ?? '1');
      const time    = el.querySelector('#mf-time')?.value || '20:00';
      if (!message) { _showToast('متن پیام خالی است', false); return; }
      const schedules = _getMonthlySchedules();
      if (id) {
        const idx = schedules.findIndex(s => s.id === id);
        if (idx !== -1) schedules[idx] = { ...schedules[idx], title, icon, message, dayOfMonth:day, time };
      } else {
        schedules.push({ id:'msch_'+Date.now(), title, icon, message, dayOfMonth:day, time, active:true, lastSent:null });
      }
      localStorage.setItem(MONTHLY_SCHEDULES_KEY, JSON.stringify(schedules));
      _showToast('✓ زمان‌بند ماهانه ذخیره شد');
      _render();
    });
  }

  _render();
}

/* ════════════════════════════════════════════════════════════
   آپلود به Firebase Storage — از همان Firebase موجود
   ════════════════════════════════════════════════════════════ */
window._cloudinaryUpload = async function(inputEl, targetId) {
  const file = inputEl.files?.[0];
  if (!file) return;

  const cfg = (() => { try { return JSON.parse(localStorage.getItem('mh_firebase_config') || '{}'); } catch { return {}; } })();
  const bucket  = cfg.storageBucket?.trim();
  const apiKey  = cfg.apiKey?.trim();

  if (!bucket || !apiKey) {
    alert('⚠️ ابتدا Firebase Storage Bucket و API Key را در تنظیمات وارد کنید.');
    inputEl.value = '';
    return;
  }

  const target = document.getElementById(targetId);
  if (!target) return;

  const label = inputEl.closest('label');
  if (label) label.style.opacity = '0.5';
  target.value    = '⏳ در حال آپلود...';
  target.disabled = true;

  try {
    /* آپلود به Firebase Storage REST API */
    const fileName    = `barakahub/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const encodedPath = encodeURIComponent(fileName);
    const uploadUrl   = `https://firebasestorage.googleapis.com/v0/b/${bucket}/o?uploadType=media&name=${encodedPath}&key=${apiKey}`;

    const res = await fetch(uploadUrl, {
      method:  'POST',
      headers: { 'Content-Type': file.type },
      body:    file,
    });

    if (!res.ok) throw new Error('آپلود ناموفق: ' + res.status);

    const data     = await res.json();
    const mediaUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodedPath}?alt=media&token=${data.downloadTokens}`;

    target.value    = mediaUrl;
    target.disabled = false;
    if (label) label.style.opacity = '1';

    target.style.borderColor = '#16a34a';
    setTimeout(() => { target.style.borderColor = ''; }, 2000);

  } catch (err) {
    target.value    = '';
    target.disabled = false;
    if (label) label.style.opacity = '1';
    alert('❌ آپلود ناموفق شد.\n\nمطمئن شوید:\n• Storage Bucket درست است\n• Rules در Firebase Storage روی public تنظیم شده\n\n' + err.message);
  }

  inputEl.value = '';
};
