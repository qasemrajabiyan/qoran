/**
 * ============================================================
 * FILE: prayer.js
 * ROLE: سفارش دعا و ختم قرآن — منطق کامل با سیستم پیام هوشمند
 * PROJECT: BarakatHub — پلتفرم رسانه‌ای کربلا
 * VERSION: 1.0.0
 * DEPENDS ON: i18n.js, auth.js
 * ============================================================
 */

import { i18n, formatNum, getUserCurrency } from './i18n.js';
import { initAutoPageTranslation } from './auto-translate.js';
import { AuthState }       from './auth.js';
import { renderPaymentPage } from './payment-system.js';

/* ────────────────────────────────────────────────────────────
   1. ترجمه‌های اختصاصی
   ──────────────────────────────────────────────────────────── */
const PC = {
  pageTitle:     { fa:'سفارش دعا', ar:'طلب الدعاء', ur:'دعا کا آرڈر', az:'Dua sifarişi', tr:'Dua Siparişi', ru:'Заказ молитвы', en:'Prayer Order', id:'Pesan Doa' },
  pageDesc:      { fa:'قرائت ادعیه به نیابت از شما و عزیزان و امواتتان در حرم مطهر امام حسین علیه السلام', ar:'قراءة الأدعية نيابةً عنك وعن أحبائك وأمواتك في الروضة الحسينية المقدسة', ur:'آپ، آپ کے پیاروں اور فوت شدگان کی طرف سے حرم امام حسین علیہ السلام میں ادعیہ کی قرائت', az:'Sizin, sevdiklərinizin və mərhumlarınızın adından İmam Hüseyn (ə) hərəmində duaların oxunması', tr:'Sizin, sevdiklerinizin ve merhumlarınızın adına İmam Hüseyin (a.s.) türbesinde dua okunması', ru:'Чтение молитв от вашего имени, ваших близких и усопших в святыне Имама Хусейна (мир ему)', en:'Recitation of prayers on behalf of you, your loved ones and the deceased at the Holy Shrine of Imam Hussein (peace be upon him)', id:'Pembacaan doa atas nama Anda, orang-orang terkasih dan almarhum di Makam Suci Imam Hussein (as)' },
  prayerTab:     { fa:'دعا', ar:'الدعاء', ur:'دعا', az:'Dua', tr:'Dua', ru:'Молитва', en:'Prayer', id:'Doa' },
  khatmTab:      { fa:'ختم قرآن', ar:'ختم القرآن', ur:'ختم قرآن', az:'Quran Khatmi', tr:'Hatim', ru:'Завершение Корана', en:'Quran Khatm', id:'Khatam Quran' },
  forMyself:     { fa:'به نیت خودم', ar:'بنيتي الخاصة', ur:'اپنی نیت سے', az:'Özüm üçün', tr:'Kendim İçin', ru:'За себя', en:'For Myself', id:'Untuk Diri Sendiri' },
  forOther:      { fa:'به نیابت از دیگری', ar:'نيابةً عن شخص آخر', ur:'کسی اور کی طرف سے', az:'Başqası üçün', tr:'Başkası İçin', ru:'За другого', en:'For Someone Else', id:'Untuk Orang Lain' },
  personName:    { fa:'نام شخص', ar:'اسم الشخص', ur:'شخص کا نام', az:'Şəxsin adı', tr:'Kişinin Adı', ru:'Имя человека', en:'Person\'s Name', id:'Nama Orang' },
  namePlaceholder:{ fa:'نام کامل را بنویسید', ar:'اكتب الاسم الكامل', ur:'پورا نام لکھیں', az:'Tam adı yazın', tr:'Tam adı yazın', ru:'Напишите полное имя', en:'Write the full name', id:'Tulis nama lengkap' },
  isAlive:       { fa:'در قید حیات', ar:'على قيد الحياة', ur:'زندہ ہیں', az:'Sağdır', tr:'Hayatta', ru:'Живой', en:'Alive', id:'Masih hidup' },
  isDeceased:    { fa:'از دنیا رفته', ar:'متوفى', ur:'فوت شدہ', az:'Vəfat etmiş', tr:'Vefat etmiş', ru:'Усопший/ая', en:'Deceased', id:'Almarhum' },
  purposeLabel:  { fa:'هدف دعا', ar:'الغرض من الدعاء', ur:'دعا کا مقصد', az:'Dua məqsədi', tr:'Dua Amacı', ru:'Цель молитвы', en:'Prayer Purpose', id:'Tujuan Doa' },
  purposeHealing:{ fa:'شفا از مریضی', ar:'الشفاء من المرض', ur:'بیماری سے شفا', az:'Xəstəlikdən şəfa', tr:'Hastalıktan şifa', ru:'Исцеление от болезни', en:'Healing from illness', id:'Kesembuhan' },
  purposeSins:   { fa:'بخشش گناهان', ar:'مغفرة الذنوب', ur:'گناہوں کی بخشش', az:'Günahların bağışlanması', tr:'Günahların affı', ru:'Прощение грехов', en:'Forgiveness of sins', id:'Pengampunan dosa' },
  purposeSuccess:{ fa:'توفیق در کارها', ar:'التوفيق في الأعمال', ur:'کاموں میں توفیق', az:'İşlərdə müvəffəqiyyət', tr:'İşlerde başarı', ru:'Успех в делах', en:'Success in matters', id:'Sukses dalam pekerjaan' },
  purposeThanks: { fa:'شکر خدای تعالی', ar:'شكر الله تعالى', ur:'اللہ کا شکر', az:'Allaha şükür', tr:'Allah\'a şükür', ru:'Благодарность Аллаху', en:'Gratitude to Allah', id:'Syukur kepada Allah' },
  paymentLabel:  { fa:'روش پرداخت', ar:'طريقة الدفع', ur:'ادائیگی کا طریقہ', az:'Ödəniş üsulu', tr:'Ödeme Yöntemi', ru:'Способ оплаты', en:'Payment Method', id:'Metode Pembayaran' },
  summaryTitle:  { fa:'خلاصه سفارش', ar:'ملخص الطلب', ur:'آرڈر کا خلاصہ', az:'Sifariş xülasəsi', tr:'Sipariş Özeti', ru:'Итог заказа', en:'Order Summary', id:'Ringkasan Pesanan' },
  submitBtn:     { fa:'ثبت و پرداخت', ar:'الحجز والدفع', ur:'رجسٹر اور ادائیگی', az:'Qeydiyyat və ödəniş', tr:'Kaydet ve Öde', ru:'Оформить и оплатить', en:'Place & Pay', id:'Pesan & Bayar' },
  successTitle:  { fa:'سفارش شما ثبت شد ✓', ar:'تم تسجيل طلبك ✓', ur:'آپ کا آرڈر درج ہوگیا ✓', az:'Sifarişiniz qeydə alındı ✓', tr:'Siparişiniz Alındı ✓', ru:'Ваш заказ принят ✓', en:'Order Placed ✓', id:'Pesanan Diterima ✓' },
  successDesc:   { fa:'سفارش شما با موفقیت ثبت شد. پس از انجام دعا از طریق پروفایل خود اطلاع‌رسانی خواهید شد.', ar:'تم تسجيل طلبك بنجاح. ستُعلَم بعد تنفيذ الدعاء عبر ملفك الشخصي.', ur:'آپ کا آرڈر کامیابی سے درج ہوگیا۔ دعا کے بعد پروفائل سے مطلع کیا جائے گا۔', az:'Sifarişiniz uğurla qeydə alındı. Dua yerinə yetirildikdən sonra profildən xəbər veriləcəksiniz.', tr:'Siparişiniz başarıyla alındı. Dua yapıldıktan sonra profilinizden bilgilendirileceksiniz.', ru:'Ваш заказ успешно принят. После выполнения молитвы вы получите уведомление в профиле.', en:'Your order has been placed successfully. You will be notified via your profile after the prayer is performed.', id:'Pesanan Anda berhasil diterima. Anda akan diberitahu melalui profil setelah doa selesai dilakukan.' },
  trackingCode:  { fa:'کد پیگیری', ar:'رمز المتابعة', ur:'ٹریکنگ کوڈ', az:'İzləmə kodu', tr:'Takip Kodu', ru:'Код отслеживания', en:'Tracking Code', id:'Kode Pelacakan' },
  goProfile:     { fa:'مشاهده پروفایل', ar:'عرض الملف الشخصي', ur:'پروفائل دیکھیں', az:'Profili gör', tr:'Profile Git', ru:'Перейти в профиль', en:'Go to Profile', id:'Ke Profil' },
  newOrder:      { fa:'سفارش جدید', ar:'طلب جديد', ur:'نیا آرڈر', az:'Yeni sifariş', tr:'Yeni Sipariş', ru:'Новый заказ', en:'New Order', id:'Pesanan Baru' },
  selectPrayer:  { fa:'ابتدا یک دعا انتخاب کنید', ar:'اختر دعاءً أولاً', ur:'پہلے ایک دعا منتخب کریں', az:'Əvvəlcə bir dua seçin', tr:'Önce bir dua seçin', ru:'Сначала выберите молитву', en:'First select a prayer', id:'Pilih doa terlebih dahulu' },
  selectPurpose: { fa:'حداقل یک هدف انتخاب کنید', ar:'اختر هدفاً واحداً على الأقل', ur:'کم از کم ایک مقصد منتخب کریں', az:'Ən azı bir məqsəd seçin', tr:'En az bir amaç seçin', ru:'Выберите хотя бы одну цель', en:'Select at least one purpose', id:'Pilih setidaknya satu tujuan' },
  nameRequired:  { fa:'نام شخص الزامی است', ar:'اسم الشخص مطلوب', ur:'شخص کا نام ضروری ہے', az:'Şəxsin adı tələb olunur', tr:'Kişi adı zorunludur', ru:'Имя человека обязательно', en:'Person\'s name is required', id:'Nama orang wajib diisi' },
  khatmCount:    { fa:'تعداد ختم', ar:'عدد الختمات', ur:'ختم کی تعداد', az:'Xətimlər sayı', tr:'Hatim Sayısı', ru:'Количество хатмов', en:'Number of Khatms', id:'Jumlah Khatam' },
  step1:         { fa:'انتخاب دعا', ar:'اختيار الدعاء', ur:'دعا منتخب کریں', az:'Dua seçin', tr:'Dua Seçin', ru:'Выбор молитвы', en:'Select Prayer', id:'Pilih Doa' },
  step2:         { fa:'جزئیات', ar:'التفاصيل', ur:'تفصیلات', az:'Təfərrüatlar', tr:'Detaylar', ru:'Детали', en:'Details', id:'Detail' },
  step3:         { fa:'پرداخت', ar:'الدفع', ur:'ادائیگی', az:'Ödəniş', tr:'Ödeme', ru:'Оплата', en:'Payment', id:'Pembayaran' },
  notLoggedIn:   { fa:'برای سفارش ابتدا وارد شوید', ar:'يرجى تسجيل الدخول للطلب', ur:'آرڈر کے لیے پہلے لاگ ان کریں', az:'Sifariş üçün daxil olun', tr:'Sipariş için giriş yapın', ru:'Войдите для оформления заказа', en:'Please login to place an order', id:'Silakan login untuk memesan' },
};

function tx(obj) {
  return obj[i18n.lang] ?? obj['fa'] ?? obj['en'] ?? '';
}


/* ────────────────────────────────────────────────────────────
   CONFIG: اهداف دعا — قابل تنظیم توسط ادمین
   ──────────────────────────────────────────────────────────── */
const PURPOSES_CONFIG_KEY = 'mh_prayer_purposes';

export const PurposesConfig = {
  getForMyself() {
    try {
      const saved = JSON.parse(localStorage.getItem(PURPOSES_CONFIG_KEY) || 'null');
      return saved?.forMyself ?? [
        { id:'healing', icon:'💊', label:{ fa:'شفا از مریضی', ar:'الشفاء من المرض', ur:'بیماری سے شفا', az:'Şəfa', tr:'Şifa', ru:'Исцеление', en:'Healing', id:'Kesembuhan' } },
        { id:'success', icon:'🌟', label:{ fa:'توفیق در کارها', ar:'التوفيق في الأعمال', ur:'کاموں میں توفیق', az:'Müvəffəqiyyət', tr:'Başarı', ru:'Успех', en:'Success', id:'Sukses' } },
        { id:'thanks',  icon:'🙏', label:{ fa:'شکر خدای تعالی', ar:'شكر الله تعالى', ur:'اللہ کا شکر', az:'Şükür', tr:'Şükür', ru:'Благодарность', en:'Gratitude', id:'Syukur' } },
        { id:'sins',    icon:'🌿', label:{ fa:'بخشش گناهان', ar:'مغفرة الذنوب', ur:'گناہوں کی بخشش', az:'Günahların bağışlanması', tr:'Günahların affı', ru:'Прощение грехов', en:'Forgiveness', id:'Pengampunan' } },
        { id:'hajat',   icon:'⭐', label:{ fa:'برآورده شدن حاجت', ar:'قضاء الحاجة', ur:'حاجت پوری ہونا', az:'Hacətin yerinə yetirilməsi', tr:'Hacet yerine getirilmesi', ru:'Исполнение желания', en:'Fulfillment of need', id:'Terpenuhi hajat' } },
      ];
    } catch { return []; }
  },
  getForDeceased() {
    try {
      const saved = JSON.parse(localStorage.getItem(PURPOSES_CONFIG_KEY) || 'null');
      return saved?.forDeceased ?? [
        { id:'sins',    icon:'🌿', label:{ fa:'بخشش گناهان', ar:'مغفرة الذنوب', ur:'گناہوں کی بخشش', az:'Günahların bağışlanması', tr:'Günahların affı', ru:'Прощение грехов', en:'Forgiveness of sins', id:'Pengampunan dosa' } },
        { id:'daraja',  icon:'✨', label:{ fa:'علو درجات', ar:'رفع الدرجات', ur:'درجات کی بلندی', az:'Dərəcələrin yüksəlməsi', tr:'Derecelerin yükselmesi', ru:'Возвышение степеней', en:'Elevation of ranks', id:'Peninggian derajat' } },
      ];
    } catch { return []; }
  },
  getForAliveOther() {
    try {
      const saved = JSON.parse(localStorage.getItem(PURPOSES_CONFIG_KEY) || 'null');
      return saved?.forAliveOther ?? [
        { id:'healing', icon:'💊', label:{ fa:'شفا از مریضی', ar:'الشفاء من المرض', ur:'بیماری سے شفا', az:'Şəfa', tr:'Şifa', ru:'Исцеление', en:'Healing', id:'Kesembuhan' } },
        { id:'success', icon:'🌟', label:{ fa:'توفیق در کارها', ar:'التوفيق في الأعمال', ur:'کاموں میں توفیق', az:'Müvəffəqiyyət', tr:'Başarı', ru:'Успех', en:'Success', id:'Sukses' } },
        { id:'sins',    icon:'🌿', label:{ fa:'بخشش گناهان', ar:'مغفرة الذنوب', ur:'گناہوں کی بخشش', az:'Günahların bağışlanması', tr:'Günahların affı', ru:'Прощение грехов', en:'Forgiveness', id:'Pengampunan' } },
        { id:'hajat',   icon:'⭐', label:{ fa:'برآورده شدن حاجت', ar:'قضاء الحاجة', ur:'حاجت پوری ہونا', az:'Hacətin yerinə yetirilməsi', tr:'Hacet yerine getirilmesi', ru:'Исполнение желания', en:'Need fulfillment', id:'Terpenuhi hajat' } },
      ];
    } catch { return []; }
  },
  set(config) {
    try { localStorage.setItem(PURPOSES_CONFIG_KEY, JSON.stringify(config)); } catch {}
  },
};

/* ────────────────────────────────────────────────────────────
   2. داده‌های دعاها (قابل تغییر توسط ادمین)
   ──────────────────────────────────────────────────────────── */
export const PRAYERS_DB = [
  {
    id:      'ziarat_ashura',
    icon:    '🕌',
    name:    { fa:'زیارت عاشورا', ar:'زيارة عاشوراء', ur:'زیارت عاشورا', az:'Aşura Ziyarəti', tr:'Aşure Ziyareti', ru:'Зиярат Ашура', en:'Ziyarat Ashura', id:'Ziarah Asyura' },
    desc:    { fa:'زیارت مخصوص امام حسین (ع) که ثواب بسیار دارد', ar:'الزيارة الخاصة للإمام الحسين ذات الثواب العظيم', ur:'امام حسین کی خاص زیارت جس کا بہت ثواب ہے', en:'Special visitation prayer for Imam Hussein with great reward' , az:'İmam Hüseyn (ə) üçün xüsusi ziyarət — böyük savablı', tr:'İmam Hüseyin (as) için özel ziyaret — büyük sevaplı', ru:'Особое посещение для Имама Хусейна (а) — с великой наградой', id:'Ziarah khusus untuk Imam Hussein (as) — berpahala besar'},
    price:   { IQD: 5000, IRR: 50000, PKR: 500, USD: 5, TRY: 150, RUB: 500, AZN: 10, IDR: 80000 },
    active:  true,
    duration:{ fa:'۱ روز', ar:'يوم واحد', ur:'۱ دن', en:'1 day', az:'1 gün', tr:'1 gün', ru:'1 день', id:'1 hari' },
  },
  {
    id:      'dua_kumayl',
    icon:    '🤲',
    name:    { fa:'دعای کمیل', ar:'دعاء كميل', ur:'دعائے کمیل', az:'Kumeyl duası', tr:'Kumeyl Duası', ru:'Дуа Кумейл', en:'Dua Kumayl', id:'Doa Kumail' },
    desc:    { fa:'دعای مأثور از امیرالمؤمنین علی (ع)', ar:'الدعاء المأثور عن أمير المؤمنين علي', ur:'امیر المومنین علی سے منقول دعا', en:'Supplication narrated from Imam Ali (as)' , az:'Əmirəlmöminin Əli (ə)-dan rəvayət edilən dua', tr:'Emiru\'l-Müminin Ali (as)\'dan rivayet edilen dua', ru:'Молитва, переданная от Повелителя Верующих Али (а)', id:'Doa yang diriwayatkan dari Amirul Mukminin Ali (as)'},
    price:   { IQD: 5000, IRR: 50000, PKR: 500, USD: 5, TRY: 150, RUB: 500, AZN: 10, IDR: 80000 },
    active:  true,
    duration:{ fa:'۱ روز', ar:'يوم واحد', ur:'۱ دن', en:'1 day', az:'1 gün', tr:'1 gün', ru:'1 день', id:'1 hari' },
  },
  {
    id:      'hadith_kisa',
    icon:    '📿',
    name:    { fa:'حدیث کساء', ar:'حديث الكساء', ur:'حدیث کساء', az:'Kisa hədisi', tr:'Kisa Hadisi', ru:'Хадис Киса', en:'Hadith al-Kisa', id:'Hadits Kisa' },
    desc:    { fa:'حدیث شریف کساء مربوط به اهل‌بیت پیامبر (ص)', ar:'حديث الكساء الشريف المتعلق بأهل بيت النبي', ur:'اہل بیت نبی سے متعلق حدیث کساء', en:'The noble hadith of the cloak relating to the Prophet\'s household' , az:'Peyğəmbərin (s) Əhli-Beytinə aid müqəddəs Kisa hədisi', tr:'Peygamber\'in (sav) Ehlibeyt\'ine ait şeref hadisi Kisa', ru:'Благородный хадис Кисы, связанный с Ахл аль-Бейт Пророка (с)', id:'Hadist Kisa yang mulia terkait Ahlul Bayt Nabi (saw)'},
    price:   { IQD: 5000, IRR: 50000, PKR: 500, USD: 5, TRY: 150, RUB: 500, AZN: 10, IDR: 80000 },
    active:  true,
    duration:{ fa:'۱ روز', ar:'يوم واحد', ur:'۱ دن', en:'1 day', az:'1 gün', tr:'1 gün', ru:'1 день', id:'1 hari' },
  },
  {
    id:      'dua_tawassul',
    icon:    '🌙',
    name:    { fa:'دعای توسل', ar:'دعاء التوسل', ur:'دعائے توسل', az:'Təvəssül duası', tr:'Tevessül Duası', ru:'Дуа Таваccуль', en:'Dua Tawassul', id:'Doa Tawassul' },
    desc:    { fa:'دعای توسل به ائمه معصومین (ع)', ar:'دعاء التوسل بالأئمة المعصومين', ur:'ائمہ معصومین کے توسل کی دعا', en:'Supplication through the intercession of the Imams' , az:'Məsum imamlara (ə) təvəssül duası', tr:'Masum imamlara (as) tevessül duası', ru:'Молитва о заступничестве к непорочным имамам (а)', id:'Doa tawassul kepada para imam maksum (as)'},
    price:   { IQD: 5000, IRR: 50000, PKR: 500, USD: 5, TRY: 150, RUB: 500, AZN: 10, IDR: 80000 },
    active:  true,
    duration:{ fa:'۱ روز', ar:'يوم واحد', ur:'۱ دن', en:'1 day', az:'1 gün', tr:'1 gün', ru:'1 день', id:'1 hari' },
  },
  {
    id:      'dua_faraj',
    icon:    '⭐',
    name:    { fa:'دعای فرج', ar:'دعاء الفرج', ur:'دعائے فرج', az:'Fərəc duası', tr:'Ferec Duası', ru:'Дуа Фарадж', en:'Dua Faraj', id:'Doa Faraj' },
    desc:    { fa:'دعا برای تعجیل در فرج امام زمان (عج)', ar:'الدعاء لتعجيل فرج الإمام المهدي', ur:'امام مہدی کی جلد ظہور کے لیے دعا', en:'Prayer for the hastening of Imam Mahdi\'s reappearance' , az:'İmam Zamanın (əc) fərəcinin tezləşməsi üçün dua', tr:'İmam Zaman\'ın (af) fereci için acele dua', ru:'Молитва о ускорении пришествия Имама Времени (аф)', id:'Doa untuk mempercepat faraj Imam Zaman (af)'},
    price:   { IQD: 5000, IRR: 50000, PKR: 500, USD: 5, TRY: 150, RUB: 500, AZN: 10, IDR: 80000 },
    active:  true,
    duration:{ fa:'۱ روز', ar:'يوم واحد', ur:'۱ دن', en:'1 day', az:'1 gün', tr:'1 gün', ru:'1 день', id:'1 hari' },
  },
  {
    id:      'dua_nudba',
    icon:    '💫',
    name:    { fa:'دعای ندبه', ar:'دعاء الندبة', ur:'دعائے ندبہ', az:'Nüdbə duası', tr:'Nüdbe Duası', ru:'Дуа Нудба', en:'Dua Nudba', id:'Doa Nudba' },
    desc:    { fa:'دعای ندبه در روزهای جمعه خوانده می‌شود', ar:'دعاء الندبة يُقرأ أيام الجمعة', ur:'جمعے کے دن پڑھی جانے والی دعا', en:'Supplication recited on Fridays' , az:'Nüdbə duası cümə günlərinde oxunur', tr:'Nüdbe duası Cuma günleri okunur', ru:'Молитва Нудба читается по пятницам', id:'Doa Nudba dibaca pada hari Jumat'},
    price:   { IQD: 5000, IRR: 50000, PKR: 500, USD: 5, TRY: 150, RUB: 500, AZN: 10, IDR: 80000 },
    active:  true,
    duration:{ fa:'۱ روز', ar:'يوم واحد', ur:'۱ دن', en:'1 day', az:'1 gün', tr:'1 gün', ru:'1 день', id:'1 hari' },
  },
];

/* ختم قرآن */
export const KHATM_OPTIONS = [
  { count: 1,  price: { IQD: 10000, IRR: 100000, PKR: 1000, USD: 10, TRY: 300, RUB: 1000, AZN: 20 } },
  { count: 3,  price: { IQD: 25000, IRR: 250000, PKR: 2500, USD: 25, TRY: 750, RUB: 2500, AZN: 50 } },
  { count: 7,  price: { IQD: 50000, IRR: 500000, PKR: 5000, USD: 50, TRY: 1500, RUB: 5000, AZN: 100 } },
  { count: 40, price: { IQD: 250000, IRR: 2500000, PKR: 25000, USD: 250, TRY: 7500, RUB: 25000, AZN: 500 } },
];

/* ────────────────────────────────────────────────────────────
   3. CURRENCY MAPPER (بر اساس زبان — fallback)
   ──────────────────────────────────────────────────────────── */
const CURRENCY_MAP = {
  fa: { key: 'IRR', symbol: 'تومان', name: 'تومان' },
  ar: { key: 'IQD', symbol: 'IQD',   name: 'دینار عراقی' },
  ur: { key: 'PKR', symbol: 'PKR',   name: 'روپیہ' },
  az: { key: 'AZN', symbol: 'AZN',   name: 'Manat' },
  tr: { key: 'TRY', symbol: '₺',     name: 'Türk Lirası' },
  ru: { key: 'RUB', symbol: '₽',     name: 'Рублей' },
  en: { key: 'USD', symbol: '$',     name: 'US Dollar' },
  id: { key: 'IDR', symbol: 'IDR',   name: 'Rupiah' },
};

/* نقشه کشور → ارز */
const COUNTRY_CURRENCY_MAP = {
  IR:'IRR', IQ:'IQD', SA:'SAR', AE:'AED', KW:'KWD', BH:'BHD', QA:'QAR', OM:'OMR',
  JO:'JOD', LB:'LBP', EG:'EGP', LY:'LYD', DZ:'DZD', MA:'MAD', TN:'TND', YE:'YER',
  PK:'PKR', IN:'INR', BD:'BDT', AF:'AFN', NP:'NPR', LK:'LKR',
  AZ:'AZN', TR:'TRY', RU:'RUB', UA:'UAH', KZ:'KZT', UZ:'UZS', TJ:'TJS', TM:'TMT', KG:'KGS',
  ID:'IDR', MY:'MYR', SG:'SGD', PH:'PHP', TH:'THB', VN:'VND',
  US:'USD', CA:'CAD', AU:'AUD', NZ:'NZD',
  GB:'GBP', IE:'EUR', FR:'EUR', DE:'EUR', IT:'EUR', ES:'EUR', NL:'EUR',
  BE:'EUR', AT:'EUR', PT:'EUR', CH:'CHF', SE:'SEK', NO:'NOK', DK:'DKK', PL:'PLN',
  CN:'CNY', JP:'JPY', KR:'KRW', BR:'BRL', MX:'MXN', AR:'ARS', ZA:'ZAR', NG:'NGN',
};

/* نقشه کد ارز → مشخصات نمایش */
const CURRENCY_INFO_MAP = {
  IRR:{ key:'IRR', symbol:'تومان',  name:'تومان'         },
  IQD:{ key:'IQD', symbol:'IQD',    name:'دینار عراقی'   },
  SAR:{ key:'SAR', symbol:'﷼',      name:'ریال سعودی'     },
  AED:{ key:'AED', symbol:'AED',    name:'درهم امارات'    },
  KWD:{ key:'KWD', symbol:'KWD',    name:'دینار کویت'     },
  BHD:{ key:'BHD', symbol:'BHD',    name:'دینار بحرین'    },
  QAR:{ key:'QAR', symbol:'QAR',    name:'ریال قطر'       },
  OMR:{ key:'OMR', symbol:'OMR',    name:'ریال عمان'      },
  PKR:{ key:'PKR', symbol:'PKR',    name:'روپیہ پاکستان'  },
  INR:{ key:'INR', symbol:'₹',      name:'روپیه هند'      },
  BDT:{ key:'BDT', symbol:'BDT',    name:'تاکا بنگلادش'   },
  AZN:{ key:'AZN', symbol:'AZN',    name:'Manat'          },
  TRY:{ key:'TRY', symbol:'₺',      name:'Türk Lirası'    },
  RUB:{ key:'RUB', symbol:'₽',      name:'Рублей'         },
  USD:{ key:'USD', symbol:'$',      name:'US Dollar'      },
  CAD:{ key:'CAD', symbol:'CA$',    name:'Canadian Dollar'},
  AUD:{ key:'AUD', symbol:'A$',     name:'Australian Dollar'},
  NZD:{ key:'NZD', symbol:'NZ$',    name:'NZ Dollar'      },
  GBP:{ key:'GBP', symbol:'£',      name:'British Pound'  },
  EUR:{ key:'EUR', symbol:'€',      name:'Euro'           },
  CHF:{ key:'CHF', symbol:'CHF',    name:'Swiss Franc'    },
  IDR:{ key:'IDR', symbol:'IDR',    name:'Rupiah'         },
  MYR:{ key:'MYR', symbol:'RM',     name:'Ringgit'        },
  SGD:{ key:'SGD', symbol:'S$',     name:'Singapore Dollar'},
  JPY:{ key:'JPY', symbol:'¥',      name:'Japanese Yen'   },
  CNY:{ key:'CNY', symbol:'¥',      name:'Chinese Yuan'   },
  KRW:{ key:'KRW', symbol:'₩',      name:'Korean Won'     },
  BRL:{ key:'BRL', symbol:'R$',     name:'Brazilian Real' },
  ZAR:{ key:'ZAR', symbol:'R',      name:'South African Rand'},
  NGN:{ key:'NGN', symbol:'₦',      name:'Nigerian Naira' },
};

/* ارز فعال کاربر — از تابع مرکزی i18n.js (اولویت: IP → زبان دستی → زبان فعلی) */
let _userCurrencyKey = getUserCurrency().key ?? getUserCurrency().k ?? 'USD';

/* بروزرسانی کش IP در پس‌زمینه اگر منقضی شده */
(async () => {
  try {
    const cacheKey = 'mh_user_country_currency';
    const cached   = JSON.parse(localStorage.getItem(cacheKey) || 'null');
    if (cached && Date.now() - cached.ts < 24 * 60 * 60 * 1000) {
      if (cached.currency) _userCurrencyKey = cached.currency;
      return;
    }
    const res  = await fetch('https://ipapi.co/json/');
    const data = await res.json();
    const cc   = COUNTRY_CURRENCY_MAP[data?.country_code];
    if (cc) {
      _userCurrencyKey = cc;
      localStorage.setItem(cacheKey, JSON.stringify({ currency: cc, country: data.country_code, ts: Date.now() }));
    }
  } catch {}
})();

/* ────────────────────────────────────────────────────────────
   نرخ لحظه‌ای ارز — از ExchangeRate-API (رایگان، بدون کلید)
   ──────────────────────────────────────────────────────────── */
const _rateCache = { rates: null, ts: 0 };
const _RATE_TTL  = 30 * 60 * 1000; /* ۳۰ دقیقه */

async function _fetchRates() {
  const now = Date.now();
  if (_rateCache.rates && now - _rateCache.ts < _RATE_TTL) return _rateCache.rates;
  try {
    const res  = await fetch('https://open.er-api.com/v6/latest/USD');
    const data = await res.json();
    if (data?.result === 'success' && data?.rates) {
      _rateCache.rates = data.rates;
      _rateCache.ts    = now;
      return data.rates;
    }
  } catch { /* اگر API در دسترس نبود، از نرخ ذخیره‌شده استفاده می‌کنیم */ }
  return _rateCache.rates ?? null;
}

/* تبدیل قیمت USD به ارز کاربر با نرخ لحظه‌ای */
function _convertPrice(usdAmount, rates, currencyKey) {
  if (!rates || !usdAmount) return null;
  /* IRR به تومان تبدیل می‌شود (تقسیم بر ۱۰) */
  if (currencyKey === 'IRR') {
    const irr = usdAmount * (rates['IRR'] ?? 62000);
    return Math.round(irr / 10); /* تومان */
  }
  const rate = rates[currencyKey];
  if (!rate) return null;
  return Math.round(usdAmount * rate);
}

function _getCurrency() {
  /* اولویت: ۱) کش IP  ۲) زبان دستی  ۳) زبان فعلی */
  const cur = getUserCurrency();
  /* بروزرسانی _userCurrencyKey از تابع مرکزی */
  _userCurrencyKey = cur.k ?? cur.key ?? 'USD';
  return CURRENCY_INFO_MAP[_userCurrencyKey] ?? CURRENCY_MAP[i18n.lang] ?? CURRENCY_MAP['en'];
}

function _formatPrice(priceObj, liveRates = null) {
  const cur      = _getCurrency();
  const usdPrice = priceObj['USD'] ?? 0;

  /* اگر نرخ لحظه‌ای موجود است، از آن استفاده کن */
  if (liveRates && usdPrice) {
    const converted = _convertPrice(usdPrice, liveRates, cur.key);
    if (converted !== null) {
      const symbol = cur.key === 'IRR' ? 'تومان' : cur.symbol;
      return `$${usdPrice} <span style="font-size:0.8em;opacity:0.7">(${formatNum(converted)} ${symbol})</span>`;
    }
  }

  /* fallback: از قیمت ثابت ذخیره‌شده */
  const amount = priceObj[cur.key] ?? priceObj['USD'];
  if (usdPrice && cur.key !== 'USD') {
    return `$${usdPrice} <span style="font-size:0.8em;opacity:0.7">(${formatNum(amount)} ${cur.symbol})</span>`;
  }
  return `$${usdPrice}`;
}

/* بررسی کافی بودن مبلغ واریزی */
function _checkPaymentSufficient(paidUSD, priceObj, liveRates) {
  const usdPrice = priceObj['USD'] ?? 0;
  if (!usdPrice) return { ok: true };
  /* اگر مبلغ کمتر از ۹۵٪ قیمت است — اخطار بده */
  if (paidUSD < usdPrice * 0.95) {
    return {
      ok: false,
      msg: {
        fa: `مبلغ واریزی کافی نیست. حداقل $${usdPrice} معادل ${_formatPrice(priceObj, liveRates)} نیاز است.`,
        ar: `المبلغ المدفوع غير كافٍ. الحد الأدنى $${usdPrice} ما يعادل ${_formatPrice(priceObj, liveRates)}.`,
        ur: `ادا کردہ رقم کافی نہیں۔ کم از کم $${usdPrice} یعنی ${_formatPrice(priceObj, liveRates)} درکار ہے۔`,
        az: `Ödənilən məbləğ kifayət deyil. Minimum $${usdPrice} = ${_formatPrice(priceObj, liveRates)} tələb olunur.`,
        tr: `Ödenen tutar yetersiz. Minimum $${usdPrice} = ${_formatPrice(priceObj, liveRates)} gereklidir.`,
        ru: `Оплаченная сумма недостаточна. Минимум $${usdPrice} = ${_formatPrice(priceObj, liveRates)}.`,
        en: `Paid amount is insufficient. Minimum $${usdPrice} = ${_formatPrice(priceObj, liveRates)} required.`,
        id: `Jumlah yang dibayar tidak cukup. Minimum $${usdPrice} = ${_formatPrice(priceObj, liveRates)} diperlukan.`,
      },
    };
  }
  return { ok: true };
}

export { _fetchRates, _convertPrice, _checkPaymentSufficient };

/* ────────────────────────────────────────────────────────────
   4. روش‌های پرداخت
   ──────────────────────────────────────────────────────────── */
const PAYMENT_METHODS = [
  {
    id:   'ki_card',
    logo: '🏦',
    name: { fa:'کی‌کارد عراق', ar:'Ki Card العراق', ur:'Ki Card عراق', az:'Ki Card İraq', tr:'Ki Card Irak', ru:'Ki Card Ирак', en:'Ki Card Iraq', id:'Ki Card Irak' },
    desc: { fa:'پرداخت از عراق', ar:'الدفع من العراق', ur:'عراق سے ادائیگی', en:'Payment from Iraq' , az:'İraqdan ödəniş', tr:'Irak\'tan ödeme', ru:'Оплата из Ирака', id:'Pembayaran dari Irak'},
    langs: ['ar'],
    active: true,
  },
  {
    id:   'bank_ir',
    logo: '🏛',
    name: { fa:'بانک ملی ایران', ar:'البنك الوطني الإيراني', ur:'ایران بینک', en:'Bank Melli Iran', az:'İran Milli Bankı', tr:'İran Milli Bankası', ru:'Банк Мелли Иран', id:'Bank Melli Iran' },
    desc: { fa:'درگاه بانکی ایران', ar:'بوابة البنك الإيراني', ur:'ایران بینک گیٹ وے', en:'Iranian bank gateway' , az:'İran bank şlüzü', tr:'İran bankası ağ geçidi', ru:'Иранский банковский шлюз', id:'Gerbang bank Iran'},
    langs: ['fa'],
    active: true,
  },
  {
    id:   'crypto',
    logo: '₿',
    name: { fa:'ارز دیجیتال (USDT)', ar:'العملة الرقمية (USDT)', ur:'ڈیجیٹل کرنسی (USDT)', az:'Kripto (USDT)', tr:'Kripto (USDT)', ru:'Крипто (USDT)', en:'Crypto (USDT)', id:'Kripto (USDT)' },
    desc: { fa:'شبکه TRC20 — کارمزد صفر', ar:'شبكة TRC20 — بدون رسوم', ur:'TRC20 نیٹ ورک — صفر فیس', en:'TRC20 Network — Zero fees' , az:'TRC20 şəbəkəsi — sıfır komisyon', tr:'TRC20 ağı — sıfır komisyon', ru:'Сеть TRC20 — нулевая комиссия', id:'Jaringan TRC20 — komisi nol'},
    langs: ['fa','ar','ur','az','tr','ru','en'],
    active: true,
  },
  {
    id:   'other',
    logo: '💳',
    name: { fa:'درگاه‌های واسط', ar:'بوابات الدفع الوسيطة', ur:'ادائیگی گیٹ وے', az:'Ödəniş şlüzləri', tr:'Ödeme Geçitleri', ru:'Платёжные шлюзы', en:'Payment Gateways', id:'Gateway Pembayaran' },
    desc: { fa:'بعداً معرفی می‌شود', ar:'ستُضاف لاحقاً', ur:'جلد آئے گا', en:'Coming soon' , az:'Tezliklə', tr:'Yakında', ru:'Скоро будет', id:'Segera hadir'},
    langs: ['fa','ar','ur','az','tr','ru','en'],
    active: false,
  },
];

/* ────────────────────────────────────────────────────────────
   5. ORDER STATE
   ──────────────────────────────────────────────────────────── */
function _createOrderState() {
  return {
    serviceType:    'prayer',    /* 'prayer' | 'khatm' */
    selectedPrayer: null,        /* prayer id */
    khatmCount:     1,
    intentType:     'myself',    /* 'myself' | 'other' */
    personName:     '',
    isAlive:        true,
    purposes:       [],          /* ['healing','sins','success','thanks'] */
    paymentMethod:  null,
    step:           1,           /* 1 | 2 | 3 */
  };
}

/* ────────────────────────────────────────────────────────────
   6. اعتبارسنجی سفارش
   ──────────────────────────────────────────────────────────── */
function _validate(state) {
  if (state.serviceType === 'prayer' && !state.selectedPrayer) {
    return { valid: false, msg: tx(PC.selectPrayer) };
  }
  if (state.purposes.length === 0) {
    return { valid: false, msg: tx(PC.selectPurpose) };
  }
  if (state.intentType === 'other' && !state.personName.trim()) {
    return { valid: false, msg: tx(PC.nameRequired) };
  }
  if (!state.paymentMethod) {
    return { valid: false, msg: tx({ fa:'روش پرداخت انتخاب کنید', ar:'اختر طريقة دفع', ur:'ادائیگی کا طریقہ منتخب کریں', en:'Select a payment method' , az:'Ödəniş üsulunu seçin', tr:'Ödeme yöntemini seçin', ru:'Выберите способ оплаты', id:'Pilih metode pembayaran'}) };
  }
  return { valid: true, msg: '' };
}

/* ────────────────────────────────────────────────────────────
   7. ساخت کد پیگیری منحصربه‌فرد
   ──────────────────────────────────────────────────────────── */
function _generateTrackingCode() {
  const prefix = 'MH';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random    = Math.random().toString(36).slice(2, 5).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

/* ────────────────────────────────────────────────────────────
   8. ذخیره سفارش (LocalStorage — در production: API)
   ──────────────────────────────────────────────────────────── */
function _saveOrder(state, trackingCode) {
  const prayer    = PRAYERS_DB.find(p => p.id === state.selectedPrayer);
  const user      = AuthState.getUser();
  const currency  = _getCurrency();

  const order = {
    id:            trackingCode,
    type:          state.serviceType,
    prayerId:      state.selectedPrayer,
    prayerName:    prayer ? tx(prayer.name) : '',
    khatmCount:    state.khatmCount,
    intentType:    state.intentType,
    personName:    state.intentType === 'myself'
                    ? (user?.name ?? '')
                    : state.personName,
    isAlive:       state.isAlive,
    purposes:      state.purposes,
    paymentMethod: state.paymentMethod,
    currency:      currency.key,
    price:         prayer
                    ? (prayer.price[currency.key] ?? prayer.price['USD'])
                    : 0,
    status:        'pending',
    userId:        user?.id ?? 'guest',
    userLang:      i18n.lang,
    createdAt:     new Date().toISOString(),
  };

  try {
    const orders = JSON.parse(localStorage.getItem('mh_orders') || '[]');
    orders.unshift(order);
    localStorage.setItem('mh_orders', JSON.stringify(orders));
  } catch {}

  return order;
}

/* ────────────────────────────────────────────────────────────
   9. سیستم پیام هوشمند (۱۵ دقیقه بعد)
   ──────────────────────────────────────────────────────────── */
function _scheduleConfirmationMessage(order) {
  /* در production: backend job scheduler */
  /* در اینجا با setTimeout شبیه‌سازی می‌شود */

  /* پیام پیش‌فرض تأیید سفارش (قابل تغییر توسط ادمین) */
  const confirmMessages = {
    fa: `${order.personName} عزیز،\n\nسفارش شما برای ${order.prayerName} با موفقیت دریافت شد.\nکد پیگیری: ${order.id}\n\nبه زودی انجام شده و به اطلاع شما خواهیم رساند.\n\nالتماس دعا 🤲`,
    ar: `عزيزي ${order.personName}،\n\nتم استلام طلبك لـ${order.prayerName} بنجاح.\nرمز المتابعة: ${order.id}\n\nسيتم التنفيذ قريباً وستُعلَم بذلك.\n\nفي رعاية الله 🤲`,
    ur: `عزیز ${order.personName}،\n\n${order.prayerName} کے لیے آپ کا آرڈر کامیابی سے موصول ہوا۔\nٹریکنگ کوڈ: ${order.id}\n\nجلد انجام دیا جائے گا اور آپ کو مطلع کیا جائے گا۔\n\nدعاؤں کی درخواست 🤲`,
    en: `Dear ${order.personName},\n\nYour order for ${order.prayerName} has been successfully received.\nTracking Code: ${order.id}\n\nIt will be performed soon and you will be notified.\n\nPrayers requested 🤲`,
    ru: `Уважаемый(ая) ${order.personName},\n\nВаш заказ на ${order.prayerName} успешно получен.\nКод отслеживания: ${order.id}\n\nВы будете уведомлены после выполнения.\n\nС молитвой 🤲`,
    tr: `Sevgili ${order.personName},\n\n${order.prayerName} için siparişiniz başarıyla alındı.\nTakip Kodu: ${order.id}\n\nYakında yapılacak ve bildirilecektir.\n\nDualarla 🤲`,
    az: `Hörmətli ${order.personName},\n\n${order.prayerName} üçün sifarişiniz uğurla alındı.\nİzləmə kodu: ${order.id}\n\nTezliklə yerinə yetirilərək xəbər veriləcəkdir.\n\nDualarla 🤲`,
  };

  const msg = confirmMessages[order.userLang] ?? confirmMessages['en'];

  /* در production: 15 دقیقه — اینجا فقط log */
  console.log('[Prayer] Confirmation message scheduled:', msg);

  /* شبیه‌سازی notification داخل سایت */
  setTimeout(() => {
    try {
      const notifs = JSON.parse(localStorage.getItem('mh_notifications') || '[]');
      notifs.unshift({
        id:    'N_' + Date.now(),
        type:  'prayer',
        icon:  '🤲',
        title: { fa: 'سفارش دریافت شد', en: 'Order Received' , ar:'تم استلام الطلب', ur:'آرڈر موصول ہوا', az:'Sifariş qəbul edildi', tr:'Sipariş alındı', ru:'Заказ получен', id:'Pesanan diterima'},
        text:  { fa: msg, en: msg },
        time:  new Date().toISOString(),
        read:  false,
        orderId: order.id,
      });
      localStorage.setItem('mh_notifications', JSON.stringify(notifs));
    } catch {}
  }, 900000); /* 15 دقیقه = 900000ms */
}

/* ────────────────────────────────────────────────────────────
   10. PRAYER PAGE RENDERER
   ──────────────────────────────────────────────────────────── */
export function renderPrayerPage(container) {
  if (!container) return;

  let state = _createOrderState();
  let _showSuccess = false;
  let _lastOrder   = null;
  let _liveRates   = null;

  /* دریافت نرخ لحظه‌ای هنگام بارگذاری */
  _fetchRates().then(rates => {
    if (rates) {
      _liveRates = rates;
      _render(); /* رندر مجدد با قیمت‌های به‌روز */
    }
  }).catch(() => {});

  function _render() {
    container.innerHTML = `

      <!-- Hero -->
      <div class="prayer-hero">
        <div class="prayer-hero__pattern" aria-hidden="true"></div>
        <div class="container prayer-hero__inner">
          <span class="prayer-hero__icon" aria-hidden="true">🤲</span>
          <h1 class="prayer-hero__title">${tx(PC.pageTitle)}</h1>
          <p class="prayer-hero__desc">${tx(PC.pageDesc)}</p>
        </div>
      </div>

      <!-- Main -->
      <div class="section">
        <div class="container">

          <!-- Service Tabs -->
          <div style="display:flex; justify-content:center; margin-bottom:var(--space-8)">
            <div class="service-tabs" role="tablist">
              <button class="service-tab ${state.serviceType==='prayer' ? 'service-tab--active' : ''}"
                role="tab" aria-selected="${state.serviceType==='prayer'}" data-service="prayer">
                <span class="service-tab__icon" aria-hidden="true">🤲</span>
                ${tx(PC.prayerTab)}
              </button>
              <button class="service-tab ${state.serviceType==='khatm' ? 'service-tab--active' : ''}"
                role="tab" aria-selected="${state.serviceType==='khatm'}" data-service="khatm">
                <span class="service-tab__icon" aria-hidden="true">📖</span>
                ${tx(PC.khatmTab)}
              </button>
            </div>
          </div>

          <!-- Steps -->
          <div class="order-steps" role="list" aria-label="مراحل سفارش">
            ${[PC.step1, PC.step2, PC.step3].map((step, i) => `
              ${i > 0 ? `<div class="order-step__line" aria-hidden="true"></div>` : ''}
              <div class="order-step order-step--${state.step > i+1 ? 'done' : state.step === i+1 ? 'active' : ''}" role="listitem">
                <div class="order-step__num" aria-label="مرحله ${i+1}">
                  ${state.step > i+1 ? '✓' : i+1}
                </div>
                <span class="hide-mobile">${tx(step)}</span>
              </div>
            `).join('')}
          </div>

          <!-- Layout -->
          <div class="layout-article" style="align-items:start">

            <!-- Left: Form -->
            <div>
              ${state.step === 1 ? _renderStep1() : ''}
              ${state.step === 2 ? _renderStep2() : ''}
              ${state.step === 3 ? _renderStep3() : ''}
            </div>

            <!-- Right: Summary -->
            <div class="hide-mobile">
              ${_renderSummary()}
            </div>

          </div>
        </div>
      </div>

      <!-- Success Modal -->
      ${_showSuccess ? _renderSuccess() : ''}
    `;

    _bindEvents();

    /* مرحله ۳: بارگذاری سیستم پرداخت */
    if (state.step === 3) {
      const payRoot = document.getElementById('prayer-payment-root');
      if (payRoot) {
        const prayer   = PRAYERS_DB.find(p => p.id === state.selectedPrayer);
        const khatmOpt = KHATM_OPTIONS.find(k => k.count === state.khatmCount);
        const priceObj = state.serviceType === 'prayer' ? prayer?.price : khatmOpt?.price;
        const usdAmount = priceObj?.USD ?? priceObj?.usd ?? 5;
        renderPaymentPage(payRoot, usdAmount, 'prayer');
        /* بررسی تأیید پرداخت */
        const checkInterval = setInterval(() => {
          const confirmH2 = Array.from(payRoot.querySelectorAll('h2')).find(el =>
            el.textContent.includes('ثبت شد') || el.textContent.includes('registered') || el.textContent.includes('تسجيل')
          );
          if (confirmH2) {
            clearInterval(checkInterval);
            const trackingCode = _generateTrackingCode();
            const order = _saveOrder(state, trackingCode);
            _scheduleConfirmationMessage(order);
            _lastOrder   = order;
            _showSuccess = true;
            _render();
          }
        }, 500);
      }
    }
  }

  /* ── مرحله ۱: انتخاب دعا ── */
  function _renderStep1() {
    if (state.serviceType === 'prayer') {
      return `
        <div>
          <div class="section-header">
            <h2 class="section-header__title">${tx(PC.step1)}</h2>
          </div>
          <div class="prayer-grid" role="list" aria-label="${tx(PC.prayerTab)}">
            ${PRAYERS_DB.filter(p => p.active).map(p => `
              <div class="prayer-card ${state.selectedPrayer === p.id ? 'prayer-card--selected' : ''} ${!p.active ? 'prayer-card--unavailable' : ''}"
                data-prayer-id="${p.id}"
                role="radio"
                aria-checked="${state.selectedPrayer === p.id}"
                tabindex="0"
                aria-label="${tx(p.name)}"
              >
                <div class="prayer-card__check" aria-hidden="true">
                  ${state.selectedPrayer === p.id ? '✓' : ''}
                </div>
                <span class="prayer-card__icon" aria-hidden="true">${p.icon}</span>
                <div>
                  <div class="prayer-card__name" data-fa-text="${p.name.fa}">${tx(p.name)}</div>
                  <div class="prayer-card__desc" data-fa-text="${p.desc.fa}">${tx(p.desc)}</div>
                </div>
                <div class="prayer-card__price">
                  <div>
                    <div class="prayer-card__price-amount">${_formatPrice(p.price, _liveRates)}</div>
                    <div class="prayer-card__price-currency">${_getCurrency().name}</div>
                  </div>
                  <div style="font-size:var(--text-xs);color:var(--text-muted)">${tx(p.duration)}</div>
                </div>
              </div>
            `).join('')}
          </div>
          <div style="display:flex; justify-content:flex-end; margin-top:var(--space-4)">
            <button class="btn btn--primary btn--lg" id="next-step-1" ${!state.selectedPrayer ? 'disabled' : ''}>
              ${tx({ fa:'مرحله بعد ←', ar:'التالي ←', ur:'اگلا مرحلہ ←', en:'Next →', tr:'İleri →', ru:'Далее →', az:'İrəli →', id:'Selanjutnya →' })}
            </button>
          </div>
        </div>
      `;
    } else {
      /* ختم قرآن */
      return `
        <div>
          <div class="section-header">
            <h2 class="section-header__title">${tx(PC.khatmTab)}</h2>
          </div>
          <div class="khatm-options" role="radiogroup" aria-label="${tx(PC.khatmCount)}">
            ${KHATM_OPTIONS.map(opt => `
              <div class="khatm-card ${state.khatmCount === opt.count ? 'khatm-card--selected' : ''}"
                data-khatm-count="${opt.count}" role="radio" aria-checked="${state.khatmCount === opt.count}" tabindex="0">
                <div class="khatm-card__check" aria-hidden="true">✓</div>
                <span class="khatm-card__num">${opt.count}</span>
                <span class="khatm-card__label">${tx(PC.khatmCount)}</span>
                <span class="khatm-card__price">${_formatPrice(opt.price, _liveRates)}</span>
              </div>
            `).join('')}
          </div>
          <div style="display:flex; justify-content:flex-end; margin-top:var(--space-4)">
            <button class="btn btn--primary btn--lg" id="next-step-1">
              ${tx({ fa:'مرحله بعد ←', ar:'التالي ←', ur:'اگلا ←', en:'Next →', tr:'İleri →', ru:'Далее →', az:'İrəli →' })}
            </button>
          </div>
        </div>
      `;
    }
  }

  /* ── مرحله ۲: جزئیات ── */
  function _renderStep2() {
    const purposeItems = [
      { id:'healing',  icon:'💊', label: PC.purposeHealing },
      { id:'sins',     icon:'🌿', label: PC.purposeSins    },
      { id:'success',  icon:'🌟', label: PC.purposeSuccess },
      { id:'thanks',   icon:'🙏', label: PC.purposeThanks  },
    ];

    return `
      <div class="order-form">
        <div class="order-form__header">
          <span class="order-form__header-icon" aria-hidden="true">📋</span>
          <div>
            <div class="order-form__header-title">${tx(PC.step2)}</div>
            <div class="order-form__header-sub">${state.selectedPrayer ? tx(PRAYERS_DB.find(p=>p.id===state.selectedPrayer)?.name ?? {}) : tx(PC.khatmTab)}</div>
          </div>
        </div>
        <div class="order-form__body">

          <!-- نیت -->
          <div class="intent-section">
            <div class="intent-label">
              <span aria-hidden="true">🎯</span>
              ${tx({ fa:'این دعا به چه نیتی است؟', ar:'ما نية هذا الدعاء؟', ur:'یہ دعا کس نیت سے ہے؟', en:'What is the intention of this prayer?', tr:'Bu dua hangi niyetle?', ru:'Каково намерение этой молитвы?', az:'Bu dua hansı niyyətlə?', id:'Apa niat doa ini?' })}
            </div>
            <div class="intent-options" role="radiogroup" aria-label="${tx({ fa:'انتخاب نیت', ar:'اختيار النية', en:'Select intention' , az:'Niyyət seçin', tr:'Niyet seçin', ru:'Выберите намерение', id:'Pilih niat'})}">
              <div class="intent-option ${state.intentType==='myself' ? 'intent-option--active' : ''}"
                data-intent="myself" role="radio" aria-checked="${state.intentType==='myself'}" tabindex="0">
                <div class="intent-option__radio" aria-hidden="true"></div>
                <span class="intent-option__icon" aria-hidden="true">🙋</span>
                ${tx(PC.forMyself)}
              </div>
              <div class="intent-option ${state.intentType==='other' ? 'intent-option--active' : ''}"
                data-intent="other" role="radio" aria-checked="${state.intentType==='other'}" tabindex="0">
                <div class="intent-option__radio" aria-hidden="true"></div>
                <span class="intent-option__icon" aria-hidden="true">👤</span>
                ${tx(PC.forOther)}
              </div>
            </div>
          </div>

          <!-- اطلاعات شخص دیگر -->
          ${state.intentType === 'other' ? `
            <div class="other-person-fields" id="other-fields">
              <!-- نام -->
              <div class="auth-field">
                <label class="auth-label" for="person-name">${tx(PC.personName)} *</label>
                <input class="auth-input" id="person-name" type="text"
                  placeholder="${tx(PC.namePlaceholder)}"
                  value="${state.personName}"
                  autocomplete="off"/>
                <div class="auth-error-msg" id="name-error" style="display:none" role="alert">
                  ⚠ ${tx(PC.nameRequired)}
                </div>
              </div>
              <!-- وضعیت -->
              <div>
                <div class="auth-label" style="margin-bottom:var(--space-3)">
                  ${tx({ fa:'وضعیت این شخص', ar:'حالة هذا الشخص', ur:'اس شخص کی حالت', en:'Status of this person', tr:'Bu kişinin durumu', ru:'Статус этого человека', az:'Bu şəxsin statusu', id:'Status orang ini' })}
                </div>
                <div class="alive-options" role="radiogroup">
                  <div class="alive-option ${state.isAlive ? 'alive-option--active' : ''}" data-alive="true" role="radio" aria-checked="${state.isAlive}" tabindex="0">
                    <span aria-hidden="true">💚</span> ${tx(PC.isAlive)}
                  </div>
                  <div class="alive-option ${!state.isAlive ? 'alive-option--active' : ''}" data-alive="false" role="radio" aria-checked="${!state.isAlive}" tabindex="0">
                    <span aria-hidden="true">🌹</span> ${tx(PC.isDeceased)}
                  </div>
                </div>
              </div>
            </div>
          ` : ''}

          <!-- هدف دعا — پویا بر اساس نیت و وضعیت -->
          <div class="purpose-section">
            <div class="intent-label">
              <span aria-hidden="true">💫</span>
              ${tx(PC.purposeLabel)}
            </div>
            <div class="purpose-grid" role="group" aria-label="${tx(PC.purposeLabel)}">
              ${(state.intentType === 'myself'
                ? PurposesConfig.getForMyself()
                : state.isAlive
                  ? PurposesConfig.getForAliveOther()
                  : PurposesConfig.getForDeceased()
              ).map(p => `
                <div class="purpose-option ${state.purposes.includes(p.id) ? 'purpose-option--checked' : ''}"
                  data-purpose="${p.id}"
                  role="checkbox"
                  aria-checked="${state.purposes.includes(p.id)}"
                  tabindex="0"
                >
                  <div class="purpose-checkbox" aria-hidden="true">
                    ${state.purposes.includes(p.id) ? '✓' : ''}
                  </div>
                  <span class="purpose-option__icon" aria-hidden="true">${p.icon}</span>
                  ${tx(p.label)}
                </div>
              `).join('')}
            </div>
            <div class="auth-error-msg" id="purpose-error" style="display:none" role="alert">
              ⚠ ${tx(PC.selectPurpose)}
            </div>
          </div>

          <!-- دکمه‌ها -->
          <div style="display:flex; gap:var(--space-3); justify-content:space-between; margin-top:var(--space-4)">
            <button class="btn btn--ghost btn--lg" id="back-step-2">
              ${tx({ fa:'→ مرحله قبل', ar:'→ السابق', ur:'→ پچھلا', en:'← Back', tr:'← Geri', ru:'← Назад', az:'← Geri', id:'← Kembali' })}
            </button>
            <button class="btn btn--primary btn--lg" id="next-step-2">
              ${tx({ fa:'مرحله بعد ←', ar:'التالي ←', ur:'اگلا ←', en:'Next →', tr:'İleri →', ru:'Далее →', az:'İrəli →' })}
            </button>
          </div>

        </div>
      </div>
    `;
  }

  /* ── مرحله ۳: پرداخت ── */
  function _renderStep3() {
    return `
      <div>
        <div id="prayer-payment-root"></div>
        <div style="margin-top:var(--space-4)">
          <button class="btn btn--ghost btn--lg" id="back-step-3">
            ${tx({ fa:'→ مرحله قبل', ar:'→ السابق', ur:'→ پچھلا', en:'← Back', tr:'← Geri', ru:'← Назад', az:'← Geri' })}
          </button>
        </div>
      </div>
    `;
  }

  /* ── خلاصه سفارش ── */
  function _renderSummary() {
    const prayer   = PRAYERS_DB.find(p => p.id === state.selectedPrayer);
    const khatmOpt = KHATM_OPTIONS.find(k => k.count === state.khatmCount);
    const priceObj = state.serviceType === 'prayer' ? prayer?.price : khatmOpt?.price;
    const user     = AuthState.getUser();

    const personDisplay = state.intentType === 'myself'
      ? (user?.name ?? tx({ fa:'شما', ar:'أنت', ur:'آپ', en:'You', tr:'Siz', ru:'Вы', az:'Siz', id:'Anda' }))
      : state.personName || '—';

    const deceased = state.intentType === 'other' && !state.isAlive;
    const genderTitle = deceased ? tx({ fa:'مرحوم/مرحومه', ar:'المرحوم/المرحومة', ur:'مرحوم/مرحومہ', en:'Late', tr:'Merhum/Merhume', ru:'Покойный/Покойная', az:'Mərhum/Mərhumə' }) : '';

    return `
      <div class="order-summary">
        <div class="order-summary__header">
          <span aria-hidden="true">📋</span>
          ${tx(PC.summaryTitle)}
        </div>
        <div class="order-summary__body">

          <div class="order-summary__row">
            <span class="order-summary__label">${tx({ fa:'نوع', ar:'النوع', ur:'قسم', en:'Type' , az:'Növ', tr:'Tür', ru:'Тип', id:'Jenis'})}</span>
            <span class="order-summary__value">
              ${state.serviceType === 'prayer' ? tx(PC.prayerTab) : tx(PC.khatmTab)}
            </span>
          </div>

          ${prayer ? `
            <div class="order-summary__row">
              <span class="order-summary__label">${tx({ fa:'دعا', ar:'الدعاء', ur:'دعا', az:'Dua', tr:'Dua', ru:'Молитва', en:'Prayer', id:'Doa'})}</span>
              <span class="order-summary__value">${tx(prayer.name)}</span>
            </div>
          ` : ''}

          ${state.serviceType === 'khatm' ? `
            <div class="order-summary__row">
              <span class="order-summary__label">${tx(PC.khatmCount)}</span>
              <span class="order-summary__value">${state.khatmCount}</span>
            </div>
          ` : ''}

          <div class="order-summary__row">
            <span class="order-summary__label">${tx({ fa:'نیابت', ar:'النيابة', ur:'نیابت', en:'On behalf of' , az:'Niyabət', tr:'Vekalet', ru:'Доверенность', id:'Perwakilan'})}</span>
            <span class="order-summary__value">${genderTitle} ${personDisplay}</span>
          </div>

          ${state.purposes.length > 0 ? `
            <div class="order-summary__row">
              <span class="order-summary__label">${tx(PC.purposeLabel)}</span>
              <span class="order-summary__value" style="text-align:end">
                ${state.purposes.map(p => {
                  const items = { healing:'💊', sins:'🌿', success:'🌟', thanks:'🙏' };
                  return items[p] ?? p;
                }).join(' ')}
              </span>
            </div>
          ` : ''}

          <hr class="order-summary__divider"/>

          <div class="order-summary__total">
            <span class="order-summary__total-label">${tx({ fa:'مبلغ', ar:'المبلغ', ur:'رقم', en:'Amount' , az:'Məbləğ', tr:'Tutar', ru:'Сумма', id:'Jumlah'})}</span>
            <span class="order-summary__total-amount">
              ${priceObj ? _formatPrice(priceObj, _liveRates) : '—'}
            </span>
          </div>

          <!-- دکمه موبایل -->
          <div class="show-mobile" style="margin-top:var(--space-4)">
            ${state.step === 3 ? `
              <button class="order-submit-btn" id="submit-order-mobile" ${!state.paymentMethod ? 'disabled' : ''}>
                ${tx(PC.submitBtn)}
              </button>
            ` : ''}
          </div>

        </div>
      </div>
    `;
  }

  /* ── Success Modal ── */
  function _renderSuccess() {
    return `
      <div class="success-overlay" role="dialog" aria-modal="true" aria-label="${tx(PC.successTitle)}">
        <div class="success-modal">
          <span class="success-modal__icon" aria-hidden="true">✅</span>
          <h2 class="success-modal__title">${tx(PC.successTitle)}</h2>
          <p class="success-modal__desc">${tx(PC.successDesc)}</p>
          <div>
            <div style="font-size:var(--text-sm);color:var(--text-muted);margin-bottom:var(--space-2)">${tx(PC.trackingCode)}</div>
            <div class="success-modal__code" dir="ltr">${_lastOrder?.id ?? ''}</div>
          </div>
          <div style="display:flex;gap:var(--space-3);justify-content:center;margin-top:var(--space-4);flex-wrap:wrap">
            <a href="/profile.html" class="btn btn--primary btn--lg">${tx(PC.goProfile)}</a>
            <button class="btn btn--outline btn--lg" id="new-order-btn">${tx(PC.newOrder)}</button>
          </div>
        </div>
      </div>
    `;
  }

  /* ────────────────────────────────────────────────────────
     EVENT BINDINGS
     ──────────────────────────────────────────────────────── */
  function _bindEvents() {
    /* Service tabs */
    container.querySelectorAll('[data-service]').forEach(btn => {
      btn.addEventListener('click', () => {
        state.serviceType    = btn.dataset.service;
        state.selectedPrayer = null;
        state.step           = 1;
        _render();
      });
    });

    /* Prayer cards */
    container.querySelectorAll('[data-prayer-id]').forEach(card => {
      card.addEventListener('click', () => {
        state.selectedPrayer = card.dataset.prayerId;
        container.querySelectorAll('[data-prayer-id]').forEach(c => {
          c.classList.toggle('prayer-card--selected', c.dataset.prayerId === state.selectedPrayer);
          c.setAttribute('aria-checked', c.dataset.prayerId === state.selectedPrayer);
          c.querySelector('.prayer-card__check').textContent = c.dataset.prayerId === state.selectedPrayer ? '✓' : '';
        });
        document.getElementById('next-step-1')?.removeAttribute('disabled');
        _refreshSummary();
      });
      card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); card.click(); } });
    });

    /* Khatm cards */
    container.querySelectorAll('[data-khatm-count]').forEach(card => {
      card.addEventListener('click', () => {
        state.khatmCount = parseInt(card.dataset.khatmCount);
        container.querySelectorAll('[data-khatm-count]').forEach(c => {
          c.classList.toggle('khatm-card--selected', parseInt(c.dataset.khatmCount) === state.khatmCount);
        });
        _refreshSummary();
      });
    });

    /* Next/Back buttons */
    document.getElementById('next-step-1')?.addEventListener('click', () => {
      state.step = 2; _render();
    });
    document.getElementById('next-step-2')?.addEventListener('click', () => {
      /* اعتبارسنجی جزئیات */
      let valid = true;
      if (state.intentType === 'other' && !state.personName.trim()) {
        const err = document.getElementById('name-error');
        if (err) err.style.display = 'flex';
        document.getElementById('person-name')?.classList.add('auth-input--error');
        valid = false;
      }
      if (state.purposes.length === 0) {
        const err = document.getElementById('purpose-error');
        if (err) err.style.display = 'flex';
        valid = false;
      }
      if (valid) { state.step = 3; _render(); }
    });
    document.getElementById('back-step-2')?.addEventListener('click', () => { state.step = 1; _render(); });
    document.getElementById('back-step-3')?.addEventListener('click', () => { state.step = 2; _render(); });

    /* Intent */
    container.querySelectorAll('[data-intent]').forEach(opt => {
      opt.addEventListener('click', () => {
        state.intentType = opt.dataset.intent;
        _render();
      });
    });

    /* Alive/Deceased */
    container.querySelectorAll('[data-alive]').forEach(opt => {
      opt.addEventListener('click', () => {
        state.isAlive = opt.dataset.alive === 'true';
        container.querySelectorAll('[data-alive]').forEach(o => {
          o.classList.toggle('alive-option--active', o.dataset.alive === String(state.isAlive));
        });
        _refreshSummary();
      });
    });

    /* Name input */
    document.getElementById('person-name')?.addEventListener('input', e => {
      state.personName = e.target.value;
      document.getElementById('name-error')?.style.removeProperty('display');
      e.target.classList.remove('auth-input--error');
      _refreshSummary();
    });

    /* Purpose checkboxes */
    container.querySelectorAll('[data-purpose]').forEach(opt => {
      opt.addEventListener('click', () => {
        const id  = opt.dataset.purpose;
        const idx = state.purposes.indexOf(id);
        if (idx === -1) state.purposes.push(id);
        else            state.purposes.splice(idx, 1);
        opt.classList.toggle('purpose-option--checked', state.purposes.includes(id));
        opt.setAttribute('aria-checked', state.purposes.includes(id));
        opt.querySelector('.purpose-checkbox').textContent = state.purposes.includes(id) ? '✓' : '';
        document.getElementById('purpose-error')?.style.removeProperty('display');
        _refreshSummary();
      });
      opt.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); opt.click(); } });
    });

    /* Submit mobile summary button */
    document.getElementById('submit-order-mobile')?.addEventListener('click', _handleSubmit);

    /* New order */
    document.getElementById('new-order-btn')?.addEventListener('click', () => {
      state        = _createOrderState();
      _showSuccess = false;
      _lastOrder   = null;
      _render();
    });
  }

  /* ────────────────────────────────────────────────────────
     SUBMIT HANDLER
     ──────────────────────────────────────────────────────── */
  async function _handleSubmit() {
    const { valid, msg } = _validate(state);
    if (!valid) { _showToast(msg, 'error'); return; }

    const btn = document.getElementById('submit-order') || document.getElementById('submit-order-mobile');
    if (btn) { btn.disabled = true; btn.classList.add('auth-submit-btn--loading'); btn.textContent = '...'; }

    /* شبیه‌سازی پرداخت */
    await new Promise(r => setTimeout(r, 1200));

    const trackingCode = _generateTrackingCode();
    const order        = _saveOrder(state, trackingCode);
    _scheduleConfirmationMessage(order);

    _lastOrder   = order;
    _showSuccess = true;
    _render();
  }

  /* ── Refresh فقط summary ── */
  function _refreshSummary() {
    const summaryEl = container.querySelector('.order-summary');
    if (summaryEl) summaryEl.outerHTML = _renderSummary();
  }

  /* ── Toast ── */
  function _showToast(msg, type = 'info') {
    const c = document.getElementById('toast-container');
    if (!c) return;
    const t = document.createElement('div');
    t.style.cssText = 'pointer-events:all;background:var(--bg-surface);border:1px solid var(--border-color);border-radius:8px;padding:10px 16px;font-size:13px;box-shadow:var(--shadow-lg);animation:fadeIn 0.3s ease;color:var(--text-primary)';
    if (type === 'error') t.style.borderColor = 'var(--color-error)';
    t.textContent = msg;
    c.appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 300); }, 3500);
  }

  _render();
  i18n.onChange((newLang) => {
    /* وقتی کاربر دستی زبان عوض کرد، ارز را بر اساس زبان جدید ریست کن */
    localStorage.setItem('mh_lang_manual', newLang);
    const langCur = CURRENCY_MAP[newLang];
    if (langCur) _userCurrencyKey = langCur.key;
    _liveRates = null; /* نرخ را هم ریست کن تا با ارز جدید دوباره دریافت شود */
    _fetchRates().then(rates => { _liveRates = rates; _render(); }).catch(() => {});
    _render();
  });
}
