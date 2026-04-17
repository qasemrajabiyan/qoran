/**
 * ============================================================
 * FILE: profile.js
 * ROLE: داشبورد پروفایل کاربر — سفارش‌ها، اعلان‌ها، bookmark، ویرایش
 * PROJECT: MediaHub — پلتفرم رسانه‌ای کربلا
 * VERSION: 1.0.0
 * DEPENDS ON: i18n.js, auth.js
 * ============================================================
 */

import { i18n, timeAgo, formatNum } from './i18n.js';
import { AuthState, logout, requireAuth } from './auth.js';

/* ────────────────────────────────────────────────────────────
   ترجمه‌های پروفایل
   ──────────────────────────────────────────────────────────── */
const PROFILE_COPY = {
  myProfile:    { fa:'پروفایل من', ar:'ملفي الشخصي', ur:'میرا پروفائل', az:'Profilim', tr:'Profilim', ru:'Мой профиль', en:'My Profile' },
  myOrders:     { fa:'سفارش‌های من', ar:'طلباتي', ur:'میرے آرڈرز', az:'Sifarişlərim', tr:'Siparişlerim', ru:'Мои заказы', en:'My Orders' },
  myMeetings:   { fa:'دیدار با شیخ', ar:'لقاءاتي مع الشيخ', ur:'شیخ سے ملاقات', az:'Şeyxlə görüşüm', tr:'Şeyh ile Görüşmem', ru:'Встречи с шейхом', en:'Sheikh Meetings' , id:'Pertemuan dengan syaikh'},
  bookmarks:    { fa:'مقالات ذخیره‌شده', ar:'مقالاتي المحفوظة', ur:'محفوظ مضامین', az:'Saxladığım məqalələr', tr:'Kayıtlı Makalelerim', ru:'Сохранённые статьи', en:'Saved Articles' },
  notifications:{ fa:'اعلان‌ها', ar:'الإشعارات', ur:'اطلاعات', az:'Bildirişlər', tr:'Bildirimler', ru:'Уведомления', en:'Notifications' },
  editProfile:  { fa:'ویرایش پروفایل', ar:'تعديل الملف', ur:'پروفائل ترمیم کریں', az:'Profili redaktə et', tr:'Profili Düzenle', ru:'Редактировать профиль', en:'Edit Profile' },
  logout:       { fa:'خروج', ar:'تسجيل الخروج', ur:'لاگ آؤٹ', az:'Çıxış', tr:'Çıkış Yap', ru:'Выйти', en:'Logout' },
  saveChanges:  { fa:'ذخیره تغییرات', ar:'حفظ التغييرات', ur:'تبدیلیاں محفوظ کریں', az:'Dəyişiklikləri saxla', tr:'Değişiklikleri Kaydet', ru:'Сохранить изменения', en:'Save Changes' },
  noOrders:     { fa:'هنوز سفارشی ندارید', ar:'لا توجد طلبات بعد', ur:'ابھی کوئی آرڈر نہیں', az:'Hələ sifariş yoxdur', tr:'Henüz sipariş yok', ru:'Заказов пока нет', en:'No orders yet' },
  noBookmarks:  { fa:'مقاله‌ای ذخیره نکرده‌اید', ar:'لا توجد مقالات محفوظة', ur:'کوئی مضمون محفوظ نہیں', az:'Saxlanılmış məqalə yoxdur', tr:'Kayıtlı makale yok', ru:'Нет сохранённых статей', en:'No saved articles' },
  noNotifs:     { fa:'اعلانی وجود ندارد', ar:'لا توجد إشعارات', ur:'کوئی اطلاع نہیں', az:'Bildiriş yoxdur', tr:'Bildirim yok', ru:'Нет уведомлений', en:'No notifications' },
  memberSince:  { fa:'عضو از', ar:'عضو منذ', ur:'رکنیت سے', az:'Üzv olduğu tarix', tr:'Üyelik tarihi', ru:'Участник с', en:'Member since' },
  markAllRead:  { fa:'همه را خوانده‌شده علامت بزن', ar:'تعليم الكل كمقروء', ur:'سب کو پڑھا ہوا نشان کریں', az:'Hamısını oxunmuş say', tr:'Tümünü okundu işaretle', ru:'Отметить всё прочитанным', en:'Mark all as read' },
};

function tx(obj) {
  return obj[i18n.lang] ?? obj['fa'] ?? obj['en'] ?? '';
}

/* ────────────────────────────────────────────────────────────
   داده‌های نمونه (بعداً از API)
   ──────────────────────────────────────────────────────────── */
const SAMPLE_ORDERS = [
  {
    id: 'ORD001',
    type: 'prayer',
    typeLabel: { fa:'دعای نیابتی', ar:'الدعاء النيابي', ur:'نیابتی دعا', en:'Proxy Prayer', az:'Niyabət duası'}, tr:'Vekalet duası'}, ru:'Молитва по доверенности'}, id:'Doa perwakilan' },
    typeIcon: '🤲',
    detail: { fa:'دعای فرج — از طرف حاج اکبر محمدی', ar:'دعاء الفرج — نيابةً عن الحاج أكبر', ur:'دعائے فرج — حاج اکبر کی طرف سے', en:'Dua al-Faraj — on behalf of Hajj Akbar' , az:'Fərəc duası — Hacı Əkbər adından', tr:'Ferec Duası — Hacı Ekber adına', ru:'Молитва Фарадж — от Хаджи Акбара', id:'Doa Faraj — atas nama Haji Akbar'},
    status: 'done',
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    adminMessage: { fa:'دعای نیابتی شما در حرم مطهر امام حسین (ع) با حضور قلب کامل قرائت شد. انشاالله مورد قبول درگاه الهی واقع شود.', ar:'تمت قراءة الدعاء النيابي في الروضة الحسينية. نسأل الله القبول.', ur:'آپ کی نیابتی دعا حرم امام حسین میں پڑھی گئی۔ اللہ قبول فرمائے۔', az:'Niyabət duanız İmam Hüseynin müqəddəs hərəmində oxundu. Allah qəbul etsin.', tr:'Vekalet duanız İmam Hüseyin\'in kutsal türbesinde okundu. Allah kabul etsin.', ru:'Ваша молитва по доверенности была прочитана в святой усыпальнице Имама Хусейна. Да примет Аллах.', en:'Your proxy prayer has been recited at the Holy Shrine of Imam Hussein. May Allah accept it.', id:'Doa perwakilan Anda telah dibacakan di Makam Suci Imam Hussein. Semoga Allah menerima.' },
  },
  {
    id: 'ORD002',
    type: 'quran',
    typeLabel: { fa:'ختم قرآن', ar:'ختم القرآن', ur:'ختم قرآن', en:'Quran Completion', az:'Quran xətmi'}, tr:'Kuran hatmi'}, ru:'Завершение Корана'}, id:'Khatam Quran' },
    typeIcon: '📖',
    detail: { fa:'ختم کامل قرآن — برای شفای مادر', ar:'ختم القرآن الكريم — لشفاء الأم', ur:'مکمل ختم قرآن — ماں کی شفا کے لیے', en:'Full Quran completion — for mother\'s healing' , az:'Tam Quran xətmi — ananın şəfası üçün', tr:'Tam Kuran hatmi — annenin şifası için', ru:'Полное завершение Корана — для исцеления матери', id:'Khatam Quran lengkap — untuk kesembuhan ibu'},
    status: 'active',
    date: new Date(Date.now() - 5 * 60 * 60 * 1000),
    adminMessage: null,
  },
  {
    id: 'ORD003',
    type: 'prayer',
    typeLabel: { fa:'دعای نیابتی', ar:'الدعاء النيابي', ur:'نیابتی دعا', en:'Proxy Prayer', az:'Niyabət duası'}, tr:'Vekalet duası'}, ru:'Молитва по доверенности'}, id:'Doa perwakilan' },
    typeIcon: '🤲',
    detail: { fa:'دعای توسل — از طرف خانواده رضایی', ar:'دعاء التوسل — نيابةً عن آل رضائي', ur:'دعائے توسل — رضائی خاندان کی طرف سے', en:'Dua al-Tawassul — on behalf of Rezaei family' , az:'Təvəssül duası — Rzai ailəsi adından', tr:'Tevessül Duası — Rezai ailesi adına', ru:'Молитва Таваccуль — от семьи Резаи', id:'Doa Tawassul — atas nama keluarga Rezai'},
    status: 'pending',
    date: new Date(Date.now() - 30 * 60 * 1000),
    adminMessage: null,
  },
];

const SAMPLE_MEETINGS = [
  {
    id: 'MTG001',
    date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    timeSlot: '10:00 — 10:30',
    status: 'confirmed',
    note: { fa:'لطفاً ۱۰ دقیقه زودتر حضور داشته باشید', ar:'يرجى الحضور قبل ١٠ دقائق', ur:'براہ کرم ۱۰ منٹ پہلے پہنچیں', en:'Please arrive 10 minutes early' , az:'Zəhmət olmasa 10 dəqiqə əvvəl gəlin', tr:'Lütfen 10 dakika önce hazır bulunun', ru:'Пожалуйста, приходите за 10 минут до встречи', id:'Harap hadir 10 menit lebih awal'},
  },
];

const SAMPLE_NOTIFICATIONS = [
  {
    id: 'N001',
    type: 'prayer',
    icon: '🤲',
    title: { fa:'دعای نیابتی قرائت شد', ar:'تمت قراءة الدعاء', ur:'نیابتی دعا پڑھی گئی', en:'Proxy Prayer Recited' , az:'Niyabət duası oxundu', tr:'Vekalet duası okundu', ru:'Молитва по доверенности прочитана', id:'Doa perwakilan telah dibacakan'},
    text:  { fa:'دعای نیابتی شما با موفقیت در حرم مطهر قرائت شد', ar:'تمت قراءة دعائك النيابي في الروضة الحسينية', ur:'آپ کی نیابتی دعا حرم میں پڑھی گئی', en:'Your proxy prayer was successfully recited at the holy shrine' , az:'Niyabət duanız müqəddəs hərəmdə uğurla oxundu', tr:'Vekalet duanız kutsal türbede başarıyla okundu', ru:'Ваша молитва по доверенности успешно прочитана в святой усыпальнице', id:'Doa perwakilan Anda berhasil dibacakan di makam suci'},
    time:  new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    read:  false,
  },
  {
    id: 'N002',
    type: 'meeting',
    icon: '🕌',
    title: { fa:'وقت دیدار تأیید شد', ar:'تم تأكيد موعد اللقاء', ur:'ملاقات کا وقت تصدیق ہوا', en:'Meeting Confirmed' , az:'Görüş vaxtı təsdiqləndi', tr:'Görüşme vakti onaylandı', ru:'Время встречи подтверждено', id:'Waktu pertemuan dikonfirmasi'},
    text:  { fa:'دیدار شما با شیخ برای هفته آینده تأیید شد', ar:'تم تأكيد لقاؤك مع الشيخ للأسبوع القادم', ur:'شیخ سے آپ کی ملاقات اگلے ہفتے کے لیے تصدیق ہوئی', en:'Your meeting with the Sheikh has been confirmed for next week' , az:'Şeyxlə görüşünüz gələn həftəyə təsdiqləndi', tr:'Şeyh ile görüşmeniz gelecek haftaya onaylandı', ru:'Ваша встреча с шейхом подтверждена на следующую неделю', id:'Pertemuan Anda dengan syaikh dikonfirmasi minggu depan'},
    time:  new Date(Date.now() - 5 * 60 * 60 * 1000),
    read:  false,
  },
  {
    id: 'N003',
    type: 'quran',
    icon: '📖',
    title: { fa:'ختم قرآن در حال انجام است', ar:'جارٍ تلاوة ختم القرآن', ur:'ختم قرآن جاری ہے', en:'Quran Completion in Progress' , az:'Quran xətmi icra olunur', tr:'Kuran hatmi devam ediyor', ru:'Завершение Корана выполняется', id:'Khatam Quran sedang berlangsung'},
    text:  { fa:'ختم قرآن درخواستی شما آغاز شده است', ar:'بدأت تلاوة ختم القرآن المطلوب', ur:'آپ کا ختم قرآن شروع ہو گیا', en:'Your requested Quran completion has begun' , az:'Tələb etdiyiniz Quran xətmi başlanmışdır', tr:'Talep ettiğiniz Kuran hatmi başlamıştır', ru:'Запрошенное вами завершение Корана началось', id:'Khatam Quran yang Anda minta telah dimulai'},
    time:  new Date(Date.now() - 2 * 60 * 60 * 1000),
    read:  true,
  },
];

const SAMPLE_BOOKMARKS = [
  {
    id: 1,
    title: { fa:'تدبر در آیات قرآن کریم — سوره بقره', ar:'التدبر في آيات القرآن — سورة البقرة', ur:'قرآن کی آیات میں تدبر', en:'Contemplating Quran Verses — Surah Al-Baqarah' , az:'Qurani-Kərimin ayələrinin tədəbbürü — Bəqərə surəsi', tr:'Kur\'an-ı Kerim ayetlerinin tefekkürü — Bakara suresi', ru:'Размышление над аятами Священного Корана — Сура Аль-Бакара', id:'Merenungkan ayat-ayat Al-Quran — Surah Al-Baqarah'},
    category: { fa:'تدبر', ar:'تدبر', ur:'تدبر', az:'Tədəbbür', tr:'Tefekkür', ru:'Размышление', en:'Reflection', id:'Refleksi'}, tr:'Tefekkür'}, ru:'Размышление'}, id:'Refleksi' },
    image: 'https://images.unsplash.com/photo-1609599006353-e629aaabfeae?w=200&q=70',
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
  },
  {
    id: 2,
    title: { fa:'آداب زیارت در حرم مطهر امام حسین', ar:'آداب الزيارة في الروضة الحسينية', ur:'حرم امام حسین میں زیارت کے آداب', en:'Etiquette of Visiting Imam Hussein\'s Shrine' , az:'İmam Hüseynin müqəddəs hərəmini ziyarət ədəbləri', tr:'İmam Hüseyin\'in kutsal türbesini ziyaret adabı', ru:'Этикет посещения священной усыпальницы Имама Хусейна', id:'Adab ziarah di makam suci Imam Hussein'},
    category: { fa:'زیارت', ar:'زيارة', ur:'زیارت', az:'Ziyarət', tr:'Ziyaret', ru:'Паломничество', en:'Pilgrimage', id:'Ziarah'}, tr:'Ziyaret'}, ru:'Паломничество'}, id:'Ziarah' },
    image: 'https://images.unsplash.com/photo-1544986581-efac5e5d99a2?w=200&q=70',
    date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
  },
];

/* ────────────────────────────────────────────────────────────
   STATUS HELPERS
   ──────────────────────────────────────────────────────────── */
const STATUS_LABELS = {
  pending:  { fa:'در انتظار', ar:'قيد الانتظار', ur:'زیر غور', az:'Gözləmədə', tr:'Beklemede', ru:'В ожидании', en:'Pending', id:'Menunggu' },
  active:   { fa:'در حال انجام', ar:'جارٍ التنفيذ', ur:'جاری ہے', az:'İcra olunur', tr:'İşlemde', ru:'Выполняется', en:'In Progress', id:'Sedang diproses' },
  done:     { fa:'انجام شد ✓', ar:'تم ✓', ur:'مکمل ✓', az:'Tamamlandı ✓', tr:'Tamamlandı ✓', ru:'Выполнено ✓', en:'Done ✓' },
  confirmed:{ fa:'تأیید شد ✓', ar:'مؤكد ✓', ur:'تصدیق شدہ ✓', az:'Təsdiqləndi ✓', tr:'Onaylandı ✓', ru:'Подтверждено ✓', en:'Confirmed ✓' },
  rejected: { fa:'رد شد', ar:'مرفوض', ur:'مسترد', az:'Rədd edildi', tr:'Reddedildi', ru:'Отклонено', en:'Rejected' },
};

/* ────────────────────────────────────────────────────────────
   PROFILE PAGE RENDERER
   ──────────────────────────────────────────────────────────── */
export function renderProfilePage(container) {
  if (!container) return;
  if (!requireAuth()) return;

  const user = AuthState.getUser();
  let _activePanel = 'orders';
  const _unreadCount = SAMPLE_NOTIFICATIONS.filter(n => !n.read).length;

  const MENU_ITEMS = [
    { key: 'orders',        icon: '🤲', label: PROFILE_COPY.myOrders,      badge: null },
    { key: 'meetings',      icon: '🕌', label: PROFILE_COPY.myMeetings,    badge: null },
    { key: 'bookmarks',     icon: '🔖', label: PROFILE_COPY.bookmarks,     badge: null },
    { key: 'notifications', icon: '🔔', label: PROFILE_COPY.notifications, badge: _unreadCount || null },
    { key: 'edit',          icon: '✏️', label: PROFILE_COPY.editProfile,   badge: null },
  ];

  function _render() {
    container.innerHTML = `
      <div class="profile-page">

        <!-- Header -->
        <div class="profile-header">
          <div class="container">
            <div class="profile-header__inner">

              <!-- Avatar -->
              <div class="profile-avatar-wrap">
                <div class="profile-avatar" aria-label="${user?.name ?? ''}">
                  ${user?.avatar
                    ? `<img src="${user.avatar}" alt="${user?.name}" />`
                    : `<span aria-hidden="true">${(user?.name ?? 'U').charAt(0).toUpperCase()}</span>`
                  }
                </div>
                <button class="profile-avatar-edit" id="avatar-edit-btn" aria-label="تغییر تصویر پروفایل">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                </button>
                <input type="file" id="avatar-file-input" accept="image/*" style="display:none" aria-hidden="true"/>
              </div>

              <!-- Info -->
              <div class="profile-header__info">
                <h1 class="profile-header__name">${user?.name ?? '—'}</h1>
                <p class="profile-header__email">${user?.email ?? ''}</p>
                <div class="profile-header__badges">
                  ${user?.country ? `<span class="profile-badge">🌍 ${user.country}</span>` : ''}
                  <span class="profile-badge">🌐 ${i18n.config.nativeName}</span>
                  <span class="profile-badge">
                    📅 ${tx(PROFILE_COPY.memberSince)} ${user?.joinedAt ? new Date(user.joinedAt).getFullYear() : '—'}
                  </span>
                </div>
              </div>

              <!-- Logout -->
              <button class="btn btn--ghost" id="logout-btn" style="color:rgba(255,255,255,0.8); border:1px solid rgba(255,255,255,0.3);" aria-label="${tx(PROFILE_COPY.logout)}">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                ${tx(PROFILE_COPY.logout)}
              </button>

            </div>
          </div>
        </div>

        <!-- Content -->
        <div class="profile-content">
          <div class="container">
            <div class="profile-grid">

              <!-- Sidebar Menu -->
              <nav class="profile-menu" aria-label="منوی پروفایل">
                ${MENU_ITEMS.map(item => `
                  <button
                    class="profile-menu__item ${item.key === _activePanel ? 'profile-menu__item--active' : ''}"
                    data-panel="${item.key}"
                    role="tab"
                    aria-selected="${item.key === _activePanel}"
                    aria-controls="panel-${item.key}"
                  >
                    <span class="profile-menu__icon" aria-hidden="true">${item.icon}</span>
                    ${tx(item.label)}
                    ${item.badge ? `<span class="profile-menu__badge" aria-label="${item.badge} اعلان جدید">${item.badge}</span>` : ''}
                  </button>
                `).join('')}
              </nav>

              <!-- Main Panel -->
              <div id="profile-main-panel" role="tabpanel" id="panel-${_activePanel}">
                ${_renderPanel(_activePanel)}
              </div>

            </div>
          </div>
        </div>

      </div>
    `;

    _bindEvents();
  }

  /* ── Panels ── */
  function _renderPanel(key) {
    switch (key) {
      case 'orders':        return _renderOrders();
      case 'meetings':      return _renderMeetings();
      case 'bookmarks':     return _renderBookmarks();
      case 'notifications': return _renderNotifications();
      case 'edit':          return _renderEditProfile();
      default:              return '';
    }
  }

  /* ── سفارش‌ها ── */
  function _renderOrders() {
    if (!SAMPLE_ORDERS.length) return _emptyState('🤲', tx(PROFILE_COPY.noOrders));
    return `
      <div class="profile-panel">
        <div class="profile-panel__header">
          <span aria-hidden="true">🤲</span>
          <h2 class="profile-panel__title">${tx(PROFILE_COPY.myOrders)}</h2>
        </div>
        <div class="profile-panel__body">
          ${SAMPLE_ORDERS.map(order => `
            <div class="order-card order-card--${order.type}" role="article" aria-label="${tx(order.typeLabel)}">
              <div class="order-card__top">
                <div class="order-card__type">
                  <span class="order-card__type-icon" aria-hidden="true">${order.typeIcon}</span>
                  ${tx(order.typeLabel)}
                </div>
                <div class="order-status order-status--${order.status}" role="status">
                  <span class="order-status__dot" aria-hidden="true"></span>
                  ${STATUS_LABELS[order.status] ? tx(STATUS_LABELS[order.status]) : order.status}
                </div>
              </div>
              <div class="order-card__detail">${tx(order.detail)}</div>
              <div class="order-card__date">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                <time datetime="${order.date.toISOString()}">${timeAgo(order.date)}</time>
                <span aria-hidden="true">·</span>
                <span>#${order.id}</span>
              </div>
              ${order.adminMessage ? `
                <div class="order-card__message" role="note">
                  <span class="order-card__message-label">
                    💬 ${tx({ fa:'پیام از ادمین', ar:'رسالة الإدارة', ur:'ایڈمن کا پیغام', en:'Message from Admin', tr:'Yönetici Mesajı', ru:'Сообщение от администратора', az:'Admin mesajı' })}
                  </span>
                  ${tx(order.adminMessage)}
                </div>
              ` : ''}
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  /* ── دیدار با شیخ ── */
  function _renderMeetings() {
    if (!SAMPLE_MEETINGS.length) return _emptyState('🕌', tx(PROFILE_COPY.myMeetings));
    return `
      <div class="profile-panel">
        <div class="profile-panel__header">
          <span aria-hidden="true">🕌</span>
          <h2 class="profile-panel__title">${tx(PROFILE_COPY.myMeetings)}</h2>
        </div>
        <div class="profile-panel__body">
          ${SAMPLE_MEETINGS.map(m => `
            <div class="order-card order-card--meeting" role="article">
              <div class="order-card__top">
                <div class="order-card__type">
                  <span class="order-card__type-icon" aria-hidden="true">🕌</span>
                  ${tx({ fa:'دیدار با شیخ', ar:'لقاء مع الشيخ', ur:'شیخ سے ملاقات', en:'Sheikh Meeting' , az:'Şeyxlə görüş', tr:'Şeyh ile buluşma', ru:'Встреча с шейхом', id:'Pertemuan dengan syaikh'})}
                </div>
                <div class="order-status order-status--${m.status}">
                  <span class="order-status__dot" aria-hidden="true"></span>
                  ${STATUS_LABELS[m.status] ? tx(STATUS_LABELS[m.status]) : m.status}
                </div>
              </div>
              <div class="order-card__detail" style="display:flex;gap:var(--space-6);flex-wrap:wrap;margin-top:var(--space-2);">
                <div>
                  <div style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:4px">
                    ${tx({ fa:'تاریخ', ar:'التاريخ', ur:'تاریخ', en:'Date', az:'Tarix'}, tr:'Tarih'}, ru:'Дата'}, id:'Tanggal'}})}
                  </div>
                  <div style="font-weight:var(--weight-bold);font-size:var(--text-md);">
                    ${i18n.formatDate(m.date, { weekday:'long', year:'numeric', month:'long', day:'numeric' })}
                  </div>
                </div>
                <div>
                  <div style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:4px">
                    ${tx({ fa:'ساعت', ar:'الوقت', ur:'وقت', en:'Time' , az:'Saat', tr:'Saat', ru:'Часы', id:'Jam'})}
                  </div>
                  <div style="font-weight:var(--weight-bold);font-size:var(--text-md);" dir="ltr">${m.timeSlot}</div>
                </div>
              </div>
              ${m.note ? `
                <div class="order-card__message">
                  <span class="order-card__message-label">📌 ${tx({ fa:'یادداشت', ar:'ملاحظة', ur:'نوٹ', en:'Note' , az:'Qeyd', tr:'Not', ru:'Заметка', id:'Catatan'})}</span>
                  ${tx(m.note)}
                </div>
              ` : ''}
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  /* ── Bookmarks ── */
  function _renderBookmarks() {
    if (!SAMPLE_BOOKMARKS.length) return _emptyState('🔖', tx(PROFILE_COPY.noBookmarks));
    return `
      <div class="profile-panel">
        <div class="profile-panel__header">
          <span aria-hidden="true">🔖</span>
          <h2 class="profile-panel__title">${tx(PROFILE_COPY.bookmarks)}</h2>
        </div>
        <div class="profile-panel__body">
          ${SAMPLE_BOOKMARKS.map(b => `
            <div class="bookmark-card" onclick="location.href='/article/${b.id}'" role="link" tabindex="0" aria-label="${tx(b.title)}">
              <img src="${b.image}" alt="" class="bookmark-card__img" aria-hidden="true" loading="lazy"/>
              <div class="bookmark-card__content">
                <div class="bookmark-card__cat">${tx(b.category)}</div>
                <div class="bookmark-card__title">${tx(b.title)}</div>
                <div class="bookmark-card__meta">${timeAgo(b.date)}</div>
              </div>
              <button
                class="bookmark-remove"
                aria-label="حذف از ذخیره‌شده‌ها"
                onclick="event.stopPropagation(); this.closest('.bookmark-card').remove()"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                </svg>
              </button>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  /* ── Notifications ── */
  function _renderNotifications() {
    if (!SAMPLE_NOTIFICATIONS.length) return _emptyState('🔔', tx(PROFILE_COPY.noNotifs));
    return `
      <div class="profile-panel">
        <div class="profile-panel__header">
          <span aria-hidden="true">🔔</span>
          <h2 class="profile-panel__title">${tx(PROFILE_COPY.notifications)}</h2>
          <button class="btn btn--ghost btn--sm" id="mark-all-read" style="margin-inline-start:auto">
            ${tx(PROFILE_COPY.markAllRead)}
          </button>
        </div>
        <div class="profile-panel__body">
          <div role="list" aria-label="${tx(PROFILE_COPY.notifications)}">
            ${SAMPLE_NOTIFICATIONS.map(n => `
              <div class="notif-item ${!n.read ? 'notif-item--unread' : ''}" role="listitem" tabindex="0">
                <div class="notif-item__icon notif-item__icon--${n.type}" aria-hidden="true">${n.icon}</div>
                <div class="notif-item__body">
                  <div class="notif-item__title">${tx(n.title)}</div>
                  <div class="notif-item__text">${tx(n.text)}</div>
                  <div class="notif-item__time">
                    <time datetime="${n.time.toISOString()}">${timeAgo(n.time)}</time>
                  </div>
                </div>
                ${!n.read ? `<div class="notif-item__dot" aria-label="خوانده نشده"></div>` : ''}
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }

  /* ── Edit Profile ── */
  function _renderEditProfile() {
    return `
      <div class="profile-panel">
        <div class="profile-panel__header">
          <span aria-hidden="true">✏️</span>
          <h2 class="profile-panel__title">${tx(PROFILE_COPY.editProfile)}</h2>
        </div>
        <div class="profile-panel__body">

          <div class="profile-form-grid">
            <div class="auth-field">
              <label class="auth-label" for="edit-name">
                ${tx({ fa:'نام کامل', ar:'الاسم الكامل', ur:'پورا نام', en:'Full Name' , az:'Tam ad', tr:'Tam adı', ru:'Полное имя', id:'Nama lengkap'})}
              </label>
              <input class="auth-input" id="edit-name" type="text" value="${user?.name ?? ''}" autocomplete="name"/>
            </div>
            <div class="auth-field">
              <label class="auth-label" for="edit-email">
                ${tx({ fa:'ایمیل', ar:'البريد', ur:'ای میل', en:'Email' , az:'E-poçt', tr:'E-posta', ru:'Email', id:'Email'})}
              </label>
              <input class="auth-input" id="edit-email" type="email" value="${user?.email ?? ''}" dir="ltr" autocomplete="email"/>
            </div>
            <div class="auth-field col-full">
              <label class="auth-label">
                ${tx({ fa:'زبان رابط کاربری', ar:'لغة الواجهة', ur:'انٹرفیس زبان', en:'Interface Language' , az:'İnterfeys dili', tr:'Arayüz dili', ru:'Язык интерфейса', id:'Bahasa antarmuka'})}
              </label>
              <div class="lang-select-grid" role="radiogroup" aria-label="انتخاب زبان">
                ${i18n.languages.map(lang => `
                  <label class="lang-select-option ${lang.code === i18n.lang ? 'lang-select-option--active' : ''}" role="radio" aria-checked="${lang.code === i18n.lang}">
                    <input type="radio" name="profile-lang" value="${lang.code}" ${lang.code === i18n.lang ? 'checked' : ''} style="display:none"/>
                    <span class="lang-select-option__flag" aria-hidden="true">${lang.flag}</span>
                    <span>${lang.nativeName}</span>
                  </label>
                `).join('')}
              </div>
            </div>
          </div>

          <button class="auth-submit-btn" id="save-profile-btn" type="button" style="max-width:280px;margin-top:var(--space-4);">
            ${tx(PROFILE_COPY.saveChanges)}
          </button>

        </div>
      </div>
    `;
  }

  /* ── Empty State ── */
  function _emptyState(icon, title) {
    return `
      <div class="profile-panel">
        <div class="empty-state">
          <span class="empty-state__icon" aria-hidden="true">${icon}</span>
          <h3 class="empty-state__title">${title}</h3>
        </div>
      </div>
    `;
  }

  /* ── Events ── */
  function _bindEvents() {
    /* Menu */
    container.querySelectorAll('.profile-menu__item').forEach(btn => {
      btn.addEventListener('click', () => {
        _activePanel = btn.dataset.panel;
        container.querySelectorAll('.profile-menu__item').forEach(b => {
          b.classList.toggle('profile-menu__item--active', b.dataset.panel === _activePanel);
          b.setAttribute('aria-selected', b.dataset.panel === _activePanel);
        });
        const panel = document.getElementById('profile-main-panel');
        if (panel) {
          panel.style.opacity = '0';
          setTimeout(() => {
            panel.innerHTML = _renderPanel(_activePanel);
            panel.style.opacity = '1';
            panel.style.transition = 'opacity 0.25s ease';
            _bindPanelEvents();
          }, 150);
        }
      });
    });

    /* Logout */
    document.getElementById('logout-btn')?.addEventListener('click', () => {
      if (confirm(tx({ fa:'آیا می‌خواهید خارج شوید؟', ar:'هل تريد تسجيل الخروج؟', ur:'کیا آپ لاگ آؤٹ کرنا چاہتے ہیں؟', en:'Do you want to logout?' , az:'Çıxmaq istəyirsiniz?', tr:'Çıkış yapmak istiyor musunuz?', ru:'Вы хотите выйти?', id:'Apakah Anda ingin keluar?'}))) {
        logout();
      }
    });

    /* Avatar upload */
    document.getElementById('avatar-edit-btn')?.addEventListener('click', () => {
      document.getElementById('avatar-file-input')?.click();
    });

    _bindPanelEvents();
  }

  function _bindPanelEvents() {
    /* Mark all read */
    document.getElementById('mark-all-read')?.addEventListener('click', () => {
      container.querySelectorAll('.notif-item--unread').forEach(el => {
        el.classList.remove('notif-item--unread');
      });
      container.querySelectorAll('.notif-item__dot').forEach(el => el.remove());
      container.querySelectorAll('.profile-menu__badge').forEach(el => el.remove());
    });

    /* Save profile */
    document.getElementById('save-profile-btn')?.addEventListener('click', () => {
      const name  = document.getElementById('edit-name')?.value?.trim();
      const email = document.getElementById('edit-email')?.value?.trim();
      const lang  = document.querySelector('input[name="profile-lang"]:checked')?.value;

      if (name && email) {
        const updated = { ...AuthState.getUser(), name, email };
        AuthState.setUser(updated);
        if (lang && lang !== i18n.lang) {
          i18n.setLang(lang);
        }
        /* بازخورد */
        const btn = document.getElementById('save-profile-btn');
        if (btn) {
          btn.textContent = '✓ ' + tx({ fa:'ذخیره شد', ar:'تم الحفظ', ur:'محفوظ ہوگیا', en:'Saved', tr:'Kaydedildi', ru:'Сохранено', az:'Saxlandı' });
          btn.style.background = '#2d9e6b';
          setTimeout(() => _render(), 1200);
        }
      }
    });

    /* Language radio */
    container.querySelectorAll('input[name="profile-lang"]').forEach(input => {
      input.addEventListener('change', () => {
        container.querySelectorAll('.lang-select-option').forEach(opt => {
          const isActive = opt.querySelector('input')?.value === input.value;
          opt.classList.toggle('lang-select-option--active', isActive);
          opt.setAttribute('aria-checked', isActive);
        });
      });
    });
  }

  _render();
  i18n.onChange(() => _render());
}
