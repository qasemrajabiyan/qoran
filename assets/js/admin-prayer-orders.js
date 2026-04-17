/**
 * ============================================================
 * FILE: admin-prayer-orders.js
 * ROLE: داشبورد مدیریت سفارش‌های دعا و ختم قرآن
 * PROJECT: MediaHub — پلتفرم رسانه‌ای کربلا
 * VERSION: 1.0.0
 * ============================================================
 */

import { i18n } from './i18n.js';
import { PurposesConfig } from './prayer.js';
import { translateText } from './auto-translate.js';
import { NotifCenter } from './notifications.js';

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
   1. PRAYER TYPES DB (ادمین مدیریت می‌کند)
   ──────────────────────────────────────────────────────────── */
const PRAYER_DB_KEY   = 'mh_prayer_types';
const ORDERS_KEY      = 'mh_orders';
const MSG_TMPL_KEY    = 'mh_prayer_msg_templates';

export const PrayerTypesDB = {
  get() {
    try {
      return JSON.parse(localStorage.getItem(PRAYER_DB_KEY) || 'null') || _defaultPrayers();
    } catch { return _defaultPrayers(); }
  },

  set(prayers) {
    try { localStorage.setItem(PRAYER_DB_KEY, JSON.stringify(prayers)); } catch {}
  },

  add(prayer) {
    const list = this.get();
    prayer.id  = 'pr_' + Date.now();
    prayer.createdAt = new Date().toISOString();
    list.push(prayer);
    this.set(list);
    return prayer;
  },

  update(id, updates) {
    const list = this.get();
    const idx  = list.findIndex(p => p.id === id);
    if (idx !== -1) { list[idx] = { ...list[idx], ...updates }; this.set(list); }
  },

  remove(id) {
    const list = this.get().filter(p => p.id !== id);
    this.set(list);
  },

  getActive() { return this.get().filter(p => p.active); },
};

function _defaultPrayers() {
  return [
    { id:'pr_ziarat',   name:{ fa:'زیارت عاشورا',  ar:'زيارة عاشوراء',   ur:'زیارت عاشورا',   az:'Aşura Ziyarəti', tr:'Aşure Ziyareti', ru:'Зиярат Ашура', en:'Ziyarat Ashura', id:'Ziarah Asyura' }, price:{ IQD:5000,  IRR:50000,  PKR:500,  USD:5,   TRY:150, RUB:500, AZN:10, IDR:80000  }, active:true,  type:'prayer', icon:'🕌' },
    { id:'pr_kumayl',   name:{ fa:'دعای کمیل',      ar:'دعاء كميل',        ur:'دعائے کمیل',     az:'Kumeyl duası',   tr:'Kumeyl Duası',   ru:'Дуа Кумейл',  en:'Dua Kumayl',      id:'Doa Kumayl'   }, price:{ IQD:5000,  IRR:50000,  PKR:500,  USD:5,   TRY:150, RUB:500, AZN:10, IDR:80000  }, active:true,  type:'prayer', icon:'🤲' },
    { id:'pr_kisa',     name:{ fa:'حدیث کساء',      ar:'حديث الكساء',      ur:'حدیث کساء',      az:'Kisa hədisi',    tr:'Kisa Hadisi',    ru:'Хадис Киса',  en:'Hadith al-Kisa',  id:'Hadits Kisa'  }, price:{ IQD:5000,  IRR:50000,  PKR:500,  USD:5,   TRY:150, RUB:500, AZN:10, IDR:80000  }, active:true,  type:'prayer', icon:'📿' },
    { id:'pr_tawassul', name:{ fa:'دعای توسل',      ar:'دعاء التوسل',      ur:'دعائے توسل',     az:'Təvəssül duası', tr:'Tevessül Duası', ru:'Дуа Таваccуль', en:'Dua Tawassul',  id:'Doa Tawassul' }, price:{ IQD:5000,  IRR:50000,  PKR:500,  USD:5,   TRY:150, RUB:500, AZN:10, IDR:80000  }, active:true,  type:'prayer', icon:'🌙' },
    { id:'pr_faraj',    name:{ fa:'دعای فرج',        ar:'دعاء الفرج',       ur:'دعائے فرج',      az:'Fərəc duası',    tr:'Ferec Duası',    ru:'Дуа Фарадж',  en:'Dua Faraj',       id:'Doa Faraj'    }, price:{ IQD:5000,  IRR:50000,  PKR:500,  USD:5,   TRY:150, RUB:500, AZN:10, IDR:80000  }, active:true,  type:'prayer', icon:'⭐' },
    { id:'pr_nudba',    name:{ fa:'دعای ندبه',       ar:'دعاء الندبة',      ur:'دعائے ندبہ',     az:'Nüdbə duası',    tr:'Nüdbe Duası',    ru:'Дуа Нудба',   en:'Dua Nudba',       id:'Doa Nudba'    }, price:{ IQD:5000,  IRR:50000,  PKR:500,  USD:5,   TRY:150, RUB:500, AZN:10, IDR:80000  }, active:true,  type:'prayer', icon:'💫' },
    { id:'pr_khatm1',   name:{ fa:'ختم قرآن (۱ بار)', ar:'ختم القرآن (مرة)', ur:'ختم قرآن (۱ بار)', az:'Quran xətmi (1 dəfə)', tr:'Kuran hatmi (1 kez)', ru:'Хатм Корана (1 раз)', en:'Quran Khatm x1', id:'Khatam Quran (1x)' }, price:{ IQD:10000, IRR:100000, PKR:1000, USD:10,  TRY:300, RUB:1000,AZN:20, IDR:160000 }, active:false, type:'khatm',  icon:'📖' },
    { id:'pr_khatm3',   name:{ fa:'ختم قرآن (۳ بار)', ar:'ختم القرآن (٣ مرات)', ur:'ختم قرآن (۳ بار)', az:'Quran xətmi (3 dəfə)', tr:'Kuran hatmi (3 kez)', ru:'Хатм Корана (3 раза)', en:'Quran Khatm x3', id:'Khatam Quran (3x)' }, price:{ IQD:25000, IRR:250000, PKR:2500, USD:25,  TRY:750, RUB:2500,AZN:50, IDR:400000 }, active:false, type:'khatm',  icon:'📖' },
  ];
}

/* ────────────────────────────────────────────────────────────
   2. MESSAGE TEMPLATES (متن‌های قابل تنظیم ادمین)
   ──────────────────────────────────────────────────────────── */
export const MsgTemplates = {
  get() {
    try {
      return JSON.parse(localStorage.getItem(MSG_TMPL_KEY) || 'null') || {
        /* پیام اول — بعد از ثبت سفارش و پرداخت */
        onOrder: `سفارش {دعا} شما با موفقیت ثبت شد.
به زودی این دعا در حرم مطهر امام حسین علیه‌السلام به نیابت از {نیابت} قرائت خواهد شد.
پس از قرائت، از طریق بخش «پیام‌های من» در همین برنامه به شما اطلاع داده خواهد شد.`,

        /* پیام انجام دعا — وقتی ادمین تأیید می‌کند */
        onDone: `{دعا} به نیابت از {نیابت} در حرم مطهر امام حسین علیه‌السلام با حضور قلب کامل قرائت شد.
انشاالله مورد قبول درگاه الهی واقع شده و حاجات شما برآورده گردد.
التماس دعا از حضور شما داریم. 🤲`,

        /* پیام اول ختم قرآن */
        onKhatmOrder: `سفارش {دعا} شما با موفقیت ثبت شد.
به زودی این ختم به نیابت از {نیابت} قرائت خواهد شد.
پس از اتمام، از طریق بخش «پیام‌های من» به شما اطلاع داده خواهد شد.`,

        /* پیام انجام ختم قرآن */
        onKhatmDone: `{دعا} به نیابت از {نیابت} به پایان رسید.
انشاالله این ختم مبارک مورد قبول درگاه الهی واقع شده و برکات آن شامل حال شما گردد.
التماس دعا. 🤲`,
      };
    } catch { return {}; }
  },

  set(templates) {
    try { localStorage.setItem(MSG_TMPL_KEY, JSON.stringify(templates)); } catch {}
  },
};

/* ────────────────────────────────────────────────────────────
   3. ORDER STATS (آمار سفارش‌ها به تفکیک دعا)
   ──────────────────────────────────────────────────────────── */
function _getOrderStats() {
  try {
    const orders  = JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]');
    const prayers = PrayerTypesDB.get();
    const stats   = {};

    prayers.forEach(p => {
      const pOrders = orders.filter(o =>
        (o.prayerId === p.id) && o.status !== 'cancelled'
      );
      stats[p.id] = {
        prayer:   p,
        total:    pOrders.length,
        paid:     pOrders.filter(o => o.paid).length,
        pending:  pOrders.filter(o => o.status === 'pending').length,
        done:     pOrders.filter(o => o.status === 'done').length,
        orders:   pOrders,
      };
    });

    return stats;
  } catch { return {}; }
}

/* ────────────────────────────────────────────────────────────
   4. MESSAGE SENDER (ارسال پیام به کاربران)
   ──────────────────────────────────────────────────────────── */
export async function sendPrayerDoneMessage(prayerId, orderIds = null) {
  try {
    const orders  = JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]');
    const prayer  = PrayerTypesDB.get().find(p => p.id === prayerId);
    const tmpl    = MsgTemplates.get();
    if (!prayer) return 0;

    /* اگر orderIds مشخص نشده، همه سفارش‌های پرداخت‌شده این دعا */
    const targets = orders.filter(o =>
      o.prayerId === prayerId &&
      o.paid &&
      o.status !== 'done' &&
      (!orderIds || orderIds.includes(o.id))
    );

    let sent = 0;
    for (const order of targets) {
      await _sendSingleDoneMsg(order, prayer, tmpl);
      /* علامت زدن به عنوان انجام‌شده */
      order.status = 'done';
      order.doneAt = new Date().toISOString();
      sent++;
    }

    /* ذخیره آپدیت */
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
    return sent;
  } catch (err) {
    console.error('[PrayerAdmin] Send done msg error:', err);
    return 0;
  }
}

async function _sendSingleDoneMsg(order, prayer, tmpl) {
  const lang       = order.userLang ?? 'fa';
  const userName   = order.intentType === 'myself'
    ? order.userName ?? order.personName ?? ''
    : order.personName ?? '';

  /* پیشوند مرحوم/مرحومه */
  let prefix = '';
  if (order.intentType === 'other' && !order.isAlive) {
    const prefixes = {
      fa:'مرحوم/مرحومه ', ar:'المرحوم/المرحومة ', ur:'مرحوم/مرحومہ ',
      az:'Mərhum ', tr:'Merhum ', ru:'Покойный/Покойная ', en:'Late ', id:'Almarhum/Almarhumah ',
    };
    prefix = prefixes[lang] ?? prefixes['fa'];
  }

  const prayerName = prayer.name[lang] ?? prayer.name['fa'];
  const niyabat    = prefix + userName;

  /* انتخاب template */
  const templateFa = prayer.type === 'khatm'
    ? tmpl.onKhatmDone
    : tmpl.onDone;

  /* جایگزینی placeholder */
  let msgFa = templateFa
    .replace(/{دعا}/g,    prayerName)
    .replace(/{نیابت}/g,  niyabat);

  /* خطاب شخصی */
  const greetings = {
    fa:`کاربر گرامی ${order.userName ?? ''}،\n\n`,
    ar:`عزيزي ${order.userName ?? ''}،\n\n`,
    ur:`محترم ${order.userName ?? ''}،\n\n`,
    az:`Hörmətli ${order.userName ?? ''},\n\n`,
    tr:`Değerli ${order.userName ?? ''},\n\n`,
    ru:`Уважаемый(ая) ${order.userName ?? ''},\n\n`,
    en:`Dear ${order.userName ?? ''},\n\n`,
    id:`Yang terhormat ${order.userName ?? ''},\n\n`,
  };
  const greet = greetings[lang] ?? greetings['fa'];

  /* ترجمه اگر لازم است */
  let finalMsg = greet;
  if (lang !== 'fa') {
    const translated = await translateText(msgFa, lang, 'order');
    finalMsg += translated;
  } else {
    finalMsg += msgFa;
  }

  /* ذخیره در اعلان‌های کاربر */
  try {
    const notifs = JSON.parse(localStorage.getItem('mh_notifications') || '[]');
    notifs.unshift({
      id:      'pn_' + order.id + '_done',
      type:    prayer.type === 'khatm' ? 'quran' : 'prayer',
      icon:    prayer.icon,
      title:   {
        fa: `${prayerName} انجام شد ✓`,
        [lang]: `${prayer.name[lang] ?? prayerName} ✓`,
      },
      text:    { fa: greet + msgFa, [lang]: finalMsg },
      time:    new Date().toISOString(),
      read:    false,
      orderId: order.id,
      userId:  order.userId,
    });
    localStorage.setItem('mh_notifications', JSON.stringify(notifs));
  } catch {}
}

/* ────────────────────────────────────────────────────────────
   5. ADMIN PAGE RENDERER
   ──────────────────────────────────────────────────────────── */
export function renderPrayerAdminPage(container) {
  if (!container) return;

  let _activeTab = 'orders'; /* 'orders' | 'manage' | 'templates' */
  let _viewPrayerId = null;   /* برای صفحه جزئیات */

  function _render() {
    const stats   = _getOrderStats();
    const prayers = PrayerTypesDB.get();
    const tmpl    = MsgTemplates.get();

    container.innerHTML = `
      <div>
        <!-- Header -->
        <div class="admin-page-header">
          <div>
            <h1 class="admin-page-title">
              <span class="admin-page-title__icon">🤲</span>
              مدیریت دعا و ختم قرآن
            </h1>
            <p class="admin-page-desc">
              ${prayers.filter(p=>p.active).length} دعا فعال —
              ${Object.values(stats).reduce((a,s)=>a+s.pending,0)} سفارش در انتظار
            </p>
          </div>
          <div class="flex gap-3">
            ${['orders','manage','templates'].map(tab => `
              <button class="btn btn--${_activeTab===tab?'primary':'outline'} btn--sm tab-btn" data-tab="${tab}">
                ${{orders:'📋 سفارش‌ها', manage:'⚙️ مدیریت دعاها', templates:'✏️ متن پیام‌ها'}[tab]}
              </button>
            `).join('')}
          </div>
        </div>

        <!-- Content -->
        ${_activeTab === 'orders'    ? _renderOrdersTab(stats)   : ''}
        ${_activeTab === 'manage'    ? _renderManageTab(prayers)  : ''}
        ${_activeTab === 'templates' ? _renderTemplatesTab(tmpl)  : ''}
        ${_activeTab === 'purposes'  ? _renderPurposesTab()       : ''}

        <!-- Detail Modal -->
        ${_viewPrayerId ? _renderDetailModal(_viewPrayerId, stats) : ''}
      </div>
    `;

    _bindEvents();
  }

  /* ── تب سفارش‌ها ── */
  function _renderOrdersTab(stats) {
    const prayers = PrayerTypesDB.get();
    const prayerStats = prayers.filter(p => stats[p.id]?.paid > 0 || stats[p.id]?.total > 0);

    return `
      <div>
        <!-- کارت‌های آماری -->
        <div class="admin-stats-grid" style="margin-bottom:var(--space-5)">
          ${['prayer','khatm'].map(type => {
            const typeOrders = Object.values(stats).filter(s => s.prayer.type === type);
            const total  = typeOrders.reduce((a,s) => a+s.total, 0);
            const paid   = typeOrders.reduce((a,s) => a+s.paid, 0);
            const done   = typeOrders.reduce((a,s) => a+s.done, 0);
            return `
              <div class="admin-stat-card admin-stat-card--${type==='prayer'?'teal':'amber'}">
                <div class="admin-stat-card__header">
                  <span class="admin-stat-card__label">${type==='prayer'?'دعاهای نیابتی':'ختم قرآن'}</span>
                  <div class="admin-stat-card__icon">${type==='prayer'?'🤲':'📖'}</div>
                </div>
                <div class="admin-stat-card__num">${total}</div>
                <div style="font-size:var(--text-xs);color:var(--text-muted);margin-top:var(--space-2)">
                  ${paid} پرداخت‌شده · ${done} انجام‌شده
                </div>
              </div>
            `;
          }).join('')}
        </div>

        <!-- جدول دعاها با دکمه ارسال دسته‌جمعی -->
        <div class="admin-table-wrap">
          <div class="admin-table-header">
            <div class="admin-table-title">📋 سفارش‌ها به تفکیک دعا</div>
          </div>
          <div style="overflow-x:auto">
            <table class="admin-table" aria-label="سفارش‌های دعا">
              <thead>
                <tr>
                  <th>دعا / ختم قرآن</th>
                  <th>کل سفارش</th>
                  <th>پرداخت‌شده</th>
                  <th>در انتظار</th>
                  <th>انجام‌شده</th>
                  <th>عملیات</th>
                </tr>
              </thead>
              <tbody>
                ${prayers.map(prayer => {
                  const s = stats[prayer.id] ?? { total:0, paid:0, pending:0, done:0 };
                  return `
                    <tr>
                      <td>
                        <div style="display:flex;align-items:center;gap:var(--space-3)">
                          <span style="font-size:24px">${prayer.icon}</span>
                          <div>
                            <div style="font-weight:var(--weight-bold)">${prayer.name?.fa ?? ''}</div>
                            <div style="font-size:var(--text-xs);color:var(--text-muted)">
                              <span class="admin-badge admin-badge--${prayer.active?'active':'draft'}">${prayer.active?'فعال':'غیرفعال'}</span>
                              <span class="admin-badge admin-badge--${prayer.type==='khatm'?'done':'pending'}" style="margin-inline-start:4px">
                                ${prayer.type==='khatm'?'ختم قرآن':'دعا'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td><strong>${s.total}</strong></td>
                      <td><span style="color:#16a34a;font-weight:600">${s.paid}</span></td>
                      <td><span style="color:#f59e0b;font-weight:600">${s.pending}</span></td>
                      <td><span style="color:var(--text-muted)">${s.done}</span></td>
                      <td>
                        <div style="display:flex;gap:var(--space-2);flex-wrap:wrap">
                          <!-- دکمه ارسال پیام دسته‌جمعی -->
                          <button class="btn btn--primary btn--sm send-done-btn"
                            data-prayer-id="${prayer.id}"
                            data-prayer-name="${prayer.name?.fa ?? ''}"
                            data-count="${s.paid - s.done}"
                            ${s.paid - s.done === 0 ? 'disabled' : ''}
                            aria-label="ارسال پیام انجام دعا به ${s.paid - s.done} نفر"
                          >
                            ✓ انجام شد (${s.paid - s.done} نفر)
                          </button>
                          <!-- دکمه مشاهده جزئیات -->
                          <button class="btn btn--outline btn--sm view-detail-btn"
                            data-prayer-id="${prayer.id}"
                            aria-label="مشاهده جزئیات"
                          >
                            👁 جزئیات
                          </button>
                        </div>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }

  /* ── تب مدیریت دعاها ── */
  function _renderManageTab(prayers) {
    return `
      <div>
        <!-- فرم افزودن دعای جدید -->
        <div class="admin-panel" style="margin-bottom:var(--space-5)">
          <div class="admin-panel__header">
            <div class="admin-panel__title">➕ افزودن دعا / ختم قرآن جدید</div>
          </div>
          <div class="admin-panel__body">
            <div class="grid grid--2" style="gap:var(--space-4)">
              <div class="admin-field">
                <label class="admin-label" for="new-prayer-name">نام دعا (فارسی)</label>
                <input type="text" class="admin-input" id="new-prayer-name" placeholder="مثلاً: دعای توکل"/>
              </div>
              <div class="admin-field">
                <label class="admin-label" for="new-prayer-name-ar">نام دعا (عربی)</label>
                <input type="text" class="admin-input" id="new-prayer-name-ar" dir="rtl"
                  style="font-family:'Noto Naskh Arabic',serif" placeholder="مثلاً: دعاء التوكل"/>
              </div>
              <div class="admin-field">
                <label class="admin-label" for="new-prayer-type">نوع</label>
                <select class="admin-input" id="new-prayer-type">
                  <option value="prayer">🤲 دعای نیابتی</option>
                  <option value="khatm">📖 ختم قرآن</option>
                </select>
              </div>
              <div class="admin-field">
                <label class="admin-label" for="new-prayer-icon">آیکون</label>
                <input type="text" class="admin-input" id="new-prayer-icon" placeholder="مثلاً: 🤲" style="font-size:1.5rem"/>
              </div>
              <!-- قیمت فقط به دلار — سایت به ارز کاربر تبدیل می‌کند -->
              <div class="admin-field" style="grid-column:1/-1">
                <label class="admin-label" for="price-USD">
                  قیمت (USD — دلار)
                  <span class="admin-label-hint" style="color:var(--text-muted);font-weight:400;margin-inline-start:8px">
                    ℹ️ سایت خودکار به ارز کاربر تبدیل می‌کند
                  </span>
                </label>
                <div style="display:flex;align-items:center;gap:var(--space-3)">
                  <span style="font-size:1.4rem">$</span>
                  <input type="number" class="admin-input price-input" id="price-USD"
                    data-currency="USD" placeholder="0" min="0" style="max-width:200px"/>
                </div>
              </div>
            </div>
            <button class="btn btn--primary" id="add-prayer-btn" type="button" style="margin-top:var(--space-4)">
              ➕ افزودن دعا
            </button>
          </div>
        </div>

        <!-- لیست دعاهای موجود -->
        <div class="admin-table-wrap">
          <div class="admin-table-header">
            <div class="admin-table-title">📋 دعاهای موجود</div>
          </div>
          <div style="overflow-x:auto">
            <table class="admin-table">
              <thead>
                <tr>
                  <th>دعا</th>
                  <th>نوع</th>
                  <th>قیمت (USD)</th>
                  <th>وضعیت</th>
                  <th>عملیات</th>
                </tr>
              </thead>
              <tbody>
                ${prayers.map(p => `
                  <tr>
                    <td>
                      <span style="font-size:20px;margin-inline-end:8px">${p.icon}</span>
                      ${p.name?.fa ?? ''}
                    </td>
                    <td>
                      <span class="admin-badge admin-badge--${p.type==='khatm'?'done':'pending'}">
                        ${p.type==='khatm'?'📖 ختم':'🤲 دعا'}
                      </span>
                    </td>
                    <td>${p.price?.USD ?? '—'} $</td>
                    <td>
                      <label class="admin-toggle">
                        <input type="checkbox" class="prayer-active-toggle"
                          data-prayer-id="${p.id}" ${p.active?'checked':''}/>
                        <div class="admin-toggle__track"><div class="admin-toggle__thumb"></div></div>
                      </label>
                    </td>
                    <td>
                      <button class="btn btn--ghost btn--sm delete-prayer-btn"
                        data-prayer-id="${p.id}"
                        style="color:var(--color-error)"
                        aria-label="حذف دعا">
                        🗑 حذف
                      </button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }

  /* ── تب متن پیام‌ها ── */
  function _renderTemplatesTab(tmpl) {
    const fields = [
      { key:'onOrder',     label:'متن پیام اول — بعد از ثبت سفارش دعا',     hint:'بعد از پرداخت — فوری ارسال می‌شود' },
      { key:'onDone',      label:'متن پیام انجام دعا',                        hint:'وقتی ادمین دکمه «انجام شد» می‌زند' },
      { key:'onKhatmOrder',label:'متن پیام اول — بعد از ثبت ختم قرآن',       hint:'بعد از پرداخت ختم قرآن' },
      { key:'onKhatmDone', label:'متن پیام انجام ختم قرآن',                   hint:'وقتی ادمین تأیید می‌کند' },
    ];

    return `
      <div>
        <div style="
          background:rgba(42,157,143,0.08);
          border:1px solid rgba(42,157,143,0.2);
          border-radius:var(--radius-md);
          padding:var(--space-4) var(--space-5);
          margin-bottom:var(--space-5);
          font-size:var(--text-sm);
          color:var(--text-secondary);
          display:flex;gap:var(--space-3);
        ">
          <span style="font-size:20px">ℹ️</span>
          <div>
            متغیرهای قابل استفاده در متن پیام:<br/>
            <code style="background:var(--bg-surface-2);padding:2px 6px;border-radius:4px">{دعا}</code> — نام دعا یا ختم قرآن &nbsp;
            <code style="background:var(--bg-surface-2);padding:2px 6px;border-radius:4px">{نیابت}</code> — نام شخص نیابت<br/>
            <strong>توجه:</strong> «کاربر گرامی [نام]» به صورت اتوماتیک در ابتدای پیام اضافه می‌شود.
            همه پیام‌ها به زبان کاربر ترجمه می‌شوند.
          </div>
        </div>

        ${fields.map(f => `
          <div class="admin-panel" style="margin-bottom:var(--space-4)">
            <div class="admin-panel__header">
              <div class="admin-panel__title">${f.label}</div>
              <span style="font-size:var(--text-xs);color:var(--text-muted)">${f.hint}</span>
            </div>
            <div class="admin-panel__body">
              <textarea class="admin-textarea template-input"
                data-key="${f.key}"
                rows="5"
                aria-label="${f.label}"
              >${tmpl[f.key] ?? ''}</textarea>
            </div>
          </div>
        `).join('')}

        <button class="btn btn--primary btn--lg" id="save-templates-btn" type="button">
          💾 ذخیره همه متن‌ها
        </button>
      </div>
    `;
  }

  /* ── مودال جزئیات ── */
  function _renderDetailModal(prayerId, stats) {
    const s = stats[prayerId];
    if (!s) return '';
    const prayer = s.prayer;
    const orders = s.orders.filter(o => o.paid);

    return `
      <div style="
        position:fixed;inset:0;background:var(--bg-overlay);
        backdrop-filter:blur(8px);z-index:var(--z-modal);
        display:flex;align-items:center;justify-content:center;
        padding:var(--space-6);animation:fadeIn 0.3s ease;
      " id="detail-overlay">
        <div style="
          background:var(--bg-surface);border-radius:var(--radius-xl);
          max-width:700px;width:100%;max-height:80vh;
          overflow-y:auto;box-shadow:var(--shadow-2xl);
          border:1px solid var(--border-color);
          animation:scaleIn 0.3s ease;
        ">
          <div style="
            background:linear-gradient(135deg,var(--color-primary-600),var(--color-primary-800));
            padding:var(--space-6);
            display:flex;align-items:center;justify-content:space-between;
          ">
            <div style="display:flex;align-items:center;gap:var(--space-3)">
              <span style="font-size:32px">${prayer.icon}</span>
              <div>
                <div style="font-size:var(--text-lg);font-weight:var(--weight-bold);color:white">
                  ${prayer.name?.fa ?? ''}
                </div>
                <div style="font-size:var(--text-sm);color:rgba(255,255,255,0.7)">
                  ${orders.length} سفارش پرداخت‌شده
                </div>
              </div>
            </div>
            <button id="close-detail" style="
              background:rgba(255,255,255,0.1);border:none;
              width:32px;height:32px;border-radius:50%;
              color:white;cursor:pointer;font-size:16px;
            " aria-label="بستن">✕</button>
          </div>
          <div style="padding:var(--space-6)">
            ${orders.length === 0 ? `
              <div style="text-align:center;padding:var(--space-8);color:var(--text-muted)">
                سفارش پرداخت‌شده‌ای وجود ندارد
              </div>
            ` : `
              <div style="overflow-x:auto">
                <table class="admin-table" aria-label="سفارش‌های ${prayer.name?.fa}">
                  <thead>
                    <tr>
                      <th>نام کاربر</th>
                      <th>نیابت</th>
                      <th>کشور</th>
                      <th>زبان</th>
                      <th>وضعیت</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${orders.map(o => `
                      <tr>
                        <td style="font-weight:600">${o.userName ?? '—'}</td>
                        <td>
                          ${o.intentType === 'myself'
                            ? '<span style="color:var(--text-muted)">خودشان</span>'
                            : `${!o.isAlive ? '<span style="color:#8b5cf6">مرحوم/مرحومه</span> ' : ''}${o.personName ?? '—'}`
                          }
                        </td>
                        <td style="white-space:nowrap">${_countryLabel(o.userCountry)}</td>
                        <td>
                          ${{fa:'🇮🇷',ar:'🇸🇦',ur:'🇵🇰',az:'🇦🇿',tr:'🇹🇷',ru:'🇷🇺',en:'🇺🇸',id:'🇮🇩'}[o.userLang] ?? '🌐'}
                          ${o.userLang ?? '—'}
                        </td>
                        <td>
                          <span class="admin-badge admin-badge--${o.status==='done'?'done':'active'}">
                            ${o.status==='done' ? '✓ انجام شد' : 'در انتظار'}
                          </span>
                        </td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            `}
          </div>
        </div>
      </div>
    `;
  }


  /* ── تب اهداف دعا ── */
  function _renderPurposesTab() {
    const myself     = PurposesConfig.getForMyself();
    const aliveOther = PurposesConfig.getForAliveOther();
    const deceased   = PurposesConfig.getForDeceased();

    function _purposeRows(items, groupId) {
      return items.map((p, i) => `
        <div style="display:grid;grid-template-columns:50px 1fr 2fr auto;gap:var(--space-3);align-items:center;margin-bottom:var(--space-3)">
          <input type="text" class="admin-input purpose-icon" data-group="${groupId}" data-idx="${i}"
            value="${p.icon}" style="text-align:center;font-size:1.4rem"/>
          <input type="text" class="admin-input purpose-id" data-group="${groupId}" data-idx="${i}"
            value="${p.id}" placeholder="شناسه" dir="ltr" style="font-size:var(--text-xs)"/>
          <input type="text" class="admin-input purpose-label" data-group="${groupId}" data-idx="${i}"
            value="${p.label?.fa ?? ''}" placeholder="برچسب فارسی"/>
          <button class="btn btn--ghost btn--sm remove-purpose-btn" data-group="${groupId}" data-idx="${i}"
            style="color:var(--color-error)">🗑</button>
        </div>
      `).join('');
    }

    return `
      <div>
        ${[
          { id:'myself',     label:'🙋 اهداف — به نیت خودم',     items: myself     },
          { id:'aliveOther', label:'👤 اهداف — به نیت دیگری (زنده)', items: aliveOther },
          { id:'deceased',   label:'🌹 اهداف — به نیت متوفی',    items: deceased   },
        ].map(group => `
          <div class="admin-panel" style="margin-bottom:var(--space-5)">
            <div class="admin-panel__header">
              <div class="admin-panel__title">${group.label}</div>
            </div>
            <div class="admin-panel__body">
              <div id="purposes-${group.id}">${_purposeRows(group.items, group.id)}</div>
              <button class="btn btn--outline btn--sm add-purpose-btn" data-group="${group.id}" style="margin-top:var(--space-3)">
                ➕ افزودن هدف
              </button>
            </div>
          </div>
        `).join('')}
        <button class="btn btn--primary btn--lg" id="save-purposes-btn">💾 ذخیره اهداف</button>
      </div>
    `;
  }

  /* ────────────────────────────────────────────────────────
     EVENT BINDINGS
     ──────────────────────────────────────────────────────── */
  function _bindEvents() {
    /* Tabs */
    container.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        _activeTab = btn.dataset.tab;
        _render();
      });
    });

    /* ارسال پیام انجام شد */
    container.querySelectorAll('.send-done-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id    = btn.dataset.prayerId;
        const name  = btn.dataset.prayerName;
        const count = parseInt(btn.dataset.count);
        if (count === 0) return;

        if (!confirm(`آیا مطمئن هستید که پیام «${name} انجام شد» برای ${count} نفر ارسال شود؟\n\nاین عملیات قابل بازگشت نیست.`)) return;

        btn.textContent = '⏳ در حال ارسال...';
        btn.disabled    = true;

        const sent = await sendPrayerDoneMessage(id);
        _showToast(`✓ پیام برای ${sent} کاربر ارسال شد`, 'success');
        setTimeout(() => _render(), 800);
      });
    });

    /* مشاهده جزئیات */
    container.querySelectorAll('.view-detail-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        _viewPrayerId = btn.dataset.prayerId;
        _render();
      });
    });

    /* بستن مودال */
    document.getElementById('detail-overlay')?.addEventListener('click', (e) => {
      if (e.target.id === 'detail-overlay' || e.target.id === 'close-detail') {
        _viewPrayerId = null;
        _render();
      }
    });

    /* Toggle فعال/غیرفعال دعا */
    container.querySelectorAll('.prayer-active-toggle').forEach(toggle => {
      toggle.addEventListener('change', () => {
        PrayerTypesDB.update(toggle.dataset.prayerId, { active: toggle.checked });
        _showToast(toggle.checked ? '✓ دعا فعال شد' : '✓ دعا غیرفعال شد');
      });
    });

    /* حذف دعا */
    container.querySelectorAll('.delete-prayer-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (!confirm('آیا از حذف این دعا مطمئن هستید؟')) return;
        PrayerTypesDB.remove(btn.dataset.prayerId);
        _showToast('✓ دعا حذف شد');
        _render();
      });
    });

    /* افزودن دعای جدید */
    document.getElementById('add-prayer-btn')?.addEventListener('click', () => {
      const name = document.getElementById('new-prayer-name')?.value?.trim();
      const nameAr = document.getElementById('new-prayer-name-ar')?.value?.trim();
      const type   = document.getElementById('new-prayer-type')?.value;
      const icon   = document.getElementById('new-prayer-icon')?.value?.trim() || '🤲';

      if (!name) { _showToast('⚠ نام دعا را وارد کنید', 'error'); return; }

      const usdPrice = parseFloat(container.querySelector('#price-USD')?.value) || 0;
      /* تبدیل خودکار به سایر ارزها بر اساس نرخ تقریبی */
      const price = {
        USD: usdPrice,
        IQD: Math.round(usdPrice * 1310),
        IRR: Math.round(usdPrice * 62000),
        PKR: Math.round(usdPrice * 280),
        TRY: Math.round(usdPrice * 32),
        RUB: Math.round(usdPrice * 90),
        AZN: Math.round(usdPrice * 1.7),
        IDR: Math.round(usdPrice * 16200),
      };

      PrayerTypesDB.add({ name:{ fa:name, ar:nameAr||name, en:name }, price, type, icon, active:true });
      _showToast('✓ دعای جدید اضافه شد');
      _render();
    });

    /* ذخیره متن‌های پیام */
    /* اهداف دعا */
    container.querySelectorAll('.add-purpose-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const group = btn.dataset.group;
        const cfg   = JSON.parse(localStorage.getItem('mh_prayer_purposes') || '{}');
        const key   = group;
        const arr   = cfg[key] ?? PurposesConfig['get' + group.charAt(0).toUpperCase() + group.slice(1)]?.() ?? [];
        arr.push({ id:'new_' + Date.now(), icon:'⭐', label:{ fa:'هدف جدید', ar:'هدف جديد', ur:'نیا مقصد', az:'Yeni məqsəd', tr:'Yeni amaç', ru:'Новая цель', en:'New purpose', id:'Tujuan baru' } });
        cfg[key] = arr;
        localStorage.setItem('mh_prayer_purposes', JSON.stringify(cfg));
        _render();
      });
    });

    container.querySelectorAll('.remove-purpose-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const { group, idx } = btn.dataset;
        const cfg = JSON.parse(localStorage.getItem('mh_prayer_purposes') || '{}');
        const getterName = 'get' + group.charAt(0).toUpperCase() + group.slice(1);
        const arr = cfg[group] ?? (PurposesConfig[getterName]?.() ?? []);
        arr.splice(parseInt(idx), 1);
        cfg[group] = arr;
        localStorage.setItem('mh_prayer_purposes', JSON.stringify(cfg));
        _render();
      });
    });

    document.getElementById('save-purposes-btn')?.addEventListener('click', () => {
      const cfg = {};
      ['myself','aliveOther','deceased'].forEach(group => {
        const icons  = container.querySelectorAll(`.purpose-icon[data-group="${group}"]`);
        const ids    = container.querySelectorAll(`.purpose-id[data-group="${group}"]`);
        const labels = container.querySelectorAll(`.purpose-label[data-group="${group}"]`);
        cfg[group]   = Array.from(icons).map((el, i) => ({
          icon:  el.value,
          id:    ids[i]?.value ?? 'p' + i,
          label: { fa: labels[i]?.value ?? '' },
        }));
      });
      PurposesConfig.set(cfg);
      _showToast('✓ اهداف دعا ذخیره شد');
    });

    document.getElementById('save-templates-btn')?.addEventListener('click', () => {
      const tmpl = MsgTemplates.get();
      container.querySelectorAll('.template-input').forEach(ta => {
        tmpl[ta.dataset.key] = ta.value;
      });
      MsgTemplates.set(tmpl);
      _showToast('✓ متن پیام‌ها ذخیره شد');
    });
  }

  function _showToast(msg, type = 'success') {
    const t = document.createElement('div');
    t.setAttribute('role','alert');
    t.style.cssText = `position:fixed;bottom:24px;inset-inline-end:24px;background:${type==='success'?'#16a34a':'#e63946'};color:white;padding:12px 20px;border-radius:8px;font-size:14px;font-weight:600;z-index:9999;box-shadow:0 8px 24px rgba(0,0,0,0.25);animation:fadeIn 0.3s ease`;
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => { t.style.opacity='0'; t.style.transition='opacity 0.3s'; setTimeout(()=>t.remove(),300); }, 3000);
  }

  _render();
}
