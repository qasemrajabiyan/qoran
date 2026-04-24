/**
 * ============================================================
 * FILE: auth-extended.js
 * ROLE: Google Sign-in + ثبت‌نام اجباری + سیستم جایزه خودکار
 * PROJECT: BarakatHub — پلتفرم رسانه‌ای کربلا
 * VERSION: 1.0.0
 * DEPENDS ON: i18n.js, auth.js
 * ============================================================
 */

import { i18n } from './i18n.js';
import { AuthState } from './auth.js';
import { renderReferralInput, applyStoredReferral, initReferral } from './referral.js';

/* ────────────────────────────────────────────────────────────
   1. کشورها (برای dropdown ثبت‌نام)
   ──────────────────────────────────────────────────────────── */
export const COUNTRIES = [
  { code:'IQ', name:{ fa:'عراق',ar:'العراق',ur:'عراق',en:'Iraq',tr:'Irak',ru:'Ирак',az:'İraq',id:'Irak' }, flag:'🇮🇶', lang:'ar' },
  { code:'IR', name:{ fa:'ایران',ar:'إيران',ur:'ایران',en:'Iran',tr:'İran',ru:'Иран',az:'İran',id:'Iran' }, flag:'🇮🇷', lang:'fa' },
  { code:'PK', name:{ fa:'پاکستان',ar:'باكستان',ur:'پاکستان',en:'Pakistan',tr:'Pakistan',ru:'Пакистан',az:'Pakistan',id:'Pakistan' }, flag:'🇵🇰', lang:'ur' },
  { code:'AZ', name:{ fa:'آذربایجان',ar:'أذربيجان',ur:'آذربائیجان',en:'Azerbaijan',tr:'Azerbaycan',ru:'Азербайджан',az:'Azərbaycan',id:'Azerbaijan' }, flag:'🇦🇿', lang:'az' },
  { code:'TR', name:{ fa:'ترکیه',ar:'تركيا',ur:'ترکیہ',en:'Turkey',tr:'Türkiye',ru:'Турция',az:'Türkiyə',id:'Turki' }, flag:'🇹🇷', lang:'tr' },
  { code:'RU', name:{ fa:'روسیه',ar:'روسيا',ur:'روس',en:'Russia',tr:'Rusya',ru:'Россия',az:'Rusiya',id:'Rusia' }, flag:'🇷🇺', lang:'ru' },
  { code:'AF', name:{ fa:'افغانستان',ar:'أفغانستان',ur:'افغانستان',en:'Afghanistan',tr:'Afganistan',ru:'Афганистан',az:'Əfqanıstan',id:'Afghanistan' }, flag:'🇦🇫', lang:'fa' },
  { code:'TJ', name:{ fa:'تاجیکستان',ar:'طاجيكستان',ur:'تاجکستان',en:'Tajikistan',tr:'Tacikistan',ru:'Таджикистан',az:'Tacikistan',id:'Tajikistan' }, flag:'🇹🇯', lang:'fa' },
  { code:'UZ', name:{ fa:'ازبکستان',ar:'أوزبكستان',ur:'ازبکستان',en:'Uzbekistan',tr:'Özbekistan',ru:'Узбекистан',az:'Özbəkistan',id:'Uzbekistan' }, flag:'🇺🇿', lang:'uz' },
  { code:'SA', name:{ fa:'عربستان سعودی',ar:'المملكة العربية السعودية',ur:'سعودی عرب',en:'Saudi Arabia',tr:'Suudi Arabistan',ru:'Саудовская Аравия',az:'Səudiyyə Ərəbistanı',id:'Arab Saudi' }, flag:'🇸🇦', lang:'ar' },
  { code:'AE', name:{ fa:'امارات',ar:'الإمارات',ur:'امارات',en:'UAE',tr:'BAE',ru:'ОАЭ',az:'BƏƏ',id:'UEA' }, flag:'🇦🇪', lang:'ar' },
  { code:'KW', name:{ fa:'کویت',ar:'الكويت',ur:'کویت',en:'Kuwait',tr:'Kuveyt',ru:'Кувейт',az:'Küveyt',id:'Kuwait' }, flag:'🇰🇼', lang:'ar' },
  { code:'QA', name:{ fa:'قطر',ar:'قطر',ur:'قطر',en:'Qatar',tr:'Katar',ru:'Катар',az:'Qətər',id:'Qatar' }, flag:'🇶🇦', lang:'ar' },
  { code:'BH', name:{ fa:'بحرین',ar:'البحرين',ur:'بحرین',en:'Bahrain',tr:'Bahreyn',ru:'Бахрейн',az:'Bəhreyn',id:'Bahrain' }, flag:'🇧🇭', lang:'ar' },
  { code:'OM', name:{ fa:'عمان',ar:'عُمان',ur:'عمان',en:'Oman',tr:'Umman',ru:'Оман',az:'Oman',id:'Oman' }, flag:'🇴🇲', lang:'ar' },
  { code:'SY', name:{ fa:'سوریه',ar:'سوريا',ur:'شام',en:'Syria',tr:'Suriye',ru:'Сирия',az:'Suriya',id:'Suriah' }, flag:'🇸🇾', lang:'ar' },
  { code:'LB', name:{ fa:'لبنان',ar:'لبنان',ur:'لبنان',en:'Lebanon',tr:'Lübnan',ru:'Ливан',az:'Livan',id:'Lebanon' }, flag:'🇱🇧', lang:'ar' },
  { code:'JO', name:{ fa:'اردن',ar:'الأردن',ur:'اردن',en:'Jordan',tr:'Ürdün',ru:'Иордания',az:'Ürdün',id:'Yordania' }, flag:'🇯🇴', lang:'ar' },
  { code:'EG', name:{ fa:'مصر',ar:'مصر',ur:'مصر',en:'Egypt',tr:'Mısır',ru:'Египет',az:'Misir',id:'Mesir' }, flag:'🇪🇬', lang:'ar' },
  { code:'MA', name:{ fa:'مراکش',ar:'المغرب',ur:'مراکش',en:'Morocco',tr:'Fas',ru:'Марокко',az:'Mərakeş',id:'Maroko' }, flag:'🇲🇦', lang:'ar' },
  { code:'YE', name:{ fa:'یمن',ar:'اليمن',ur:'یمن',en:'Yemen',tr:'Yemen',ru:'Йемен',az:'Yəmən',id:'Yaman' }, flag:'🇾🇪', lang:'ar' },
  { code:'PS', name:{ fa:'فلسطین',ar:'فلسطين',ur:'فلسطین',en:'Palestine',tr:'Filistin',ru:'Палестина',az:'Fələstin',id:'Palestina' }, flag:'🇵🇸', lang:'ar' },
  { code:'SD', name:{ fa:'سودان',ar:'السودان',ur:'سوڈان',en:'Sudan',tr:'Sudan',ru:'Судан',az:'Sudan',id:'Sudan' }, flag:'🇸🇩', lang:'ar' },
  { code:'LY', name:{ fa:'لیبی',ar:'ليبيا',ur:'لیبیا',en:'Libya',tr:'Libya',ru:'Ливия',az:'Liviya',id:'Libya' }, flag:'🇱🇾', lang:'ar' },
  { code:'TN', name:{ fa:'تونس',ar:'تونس',ur:'تیونس',en:'Tunisia',tr:'Tunus',ru:'Тунис',az:'Tunis',id:'Tunisia' }, flag:'🇹🇳', lang:'ar' },
  { code:'DZ', name:{ fa:'الجزایر',ar:'الجزائر',ur:'الجزائر',en:'Algeria',tr:'Cezayir',ru:'Алжир',az:'Əlcəzair',id:'Aljazair' }, flag:'🇩🇿', lang:'ar' },
  { code:'IN', name:{ fa:'هند',ar:'الهند',ur:'ہندوستان',en:'India',tr:'Hindistan',ru:'Индия',az:'Hindistan',id:'India' }, flag:'🇮🇳', lang:'hi' },
  { code:'ID', name:{ fa:'اندونزی',ar:'إندونيسيا',ur:'انڈونیشیا',en:'Indonesia',tr:'Endonezya',ru:'Индонезия',az:'İndoneziya',id:'Indonesia' }, flag:'🇮🇩', lang:'id' },
  { code:'MY', name:{ fa:'مالزی',ar:'ماليزيا',ur:'ملائیشیا',en:'Malaysia',tr:'Malezya',ru:'Малайзия',az:'Malayziya',id:'Malaysia' }, flag:'🇲🇾', lang:'ms' },
  { code:'BD', name:{ fa:'بنگلادش',ar:'بنغلاديش',ur:'بنگلہ دیش',en:'Bangladesh',tr:'Bangladeş',ru:'Бангладеш',az:'Banqladeş',id:'Bangladesh' }, flag:'🇧🇩', lang:'bn' },
  { code:'US', name:{ fa:'آمریکا',ar:'الولايات المتحدة',ur:'امریکا',en:'United States',tr:'ABD',ru:'США',az:'ABŞ',id:'Amerika Serikat' }, flag:'🇺🇸', lang:'en' },
  { code:'GB', name:{ fa:'بریتانیا',ar:'المملكة المتحدة',ur:'برطانیہ',en:'United Kingdom',tr:'İngiltere',ru:'Великобритания',az:'Böyük Britaniya',id:'Inggris' }, flag:'🇬🇧', lang:'en' },
  { code:'DE', name:{ fa:'آلمان',ar:'ألمانيا',ur:'جرمنی',en:'Germany',tr:'Almanya',ru:'Германия',az:'Almaniya',id:'Jerman' }, flag:'🇩🇪', lang:'de' },
  { code:'FR', name:{ fa:'فرانسه',ar:'فرنسا',ur:'فرانس',en:'France',tr:'Fransa',ru:'Франция',az:'Fransa',id:'Prancis' }, flag:'🇫🇷', lang:'fr' },
  { code:'IT', name:{ fa:'ایتالیا',ar:'إيطاليا',ur:'اٹلی',en:'Italy',tr:'İtalya',ru:'Италия',az:'İtaliya',id:'Italia' }, flag:'🇮🇹', lang:'it' },
  { code:'ES', name:{ fa:'اسپانیا',ar:'إسبانيا',ur:'اسپین',en:'Spain',tr:'İspanya',ru:'Испания',az:'İspaniya',id:'Spanyol' }, flag:'🇪🇸', lang:'es' },
  { code:'PT', name:{ fa:'پرتغال',ar:'البرتغال',ur:'پرتگال',en:'Portugal',tr:'Portekiz',ru:'Португалия',az:'Portuqaliya',id:'Portugal' }, flag:'🇵🇹', lang:'pt' },
  { code:'NL', name:{ fa:'هلند',ar:'هولندا',ur:'نیدرلینڈ',en:'Netherlands',tr:'Hollanda',ru:'Нидерланды',az:'Niderland',id:'Belanda' }, flag:'🇳🇱', lang:'nl' },
  { code:'BE', name:{ fa:'بلژیک',ar:'بلجيكا',ur:'بیلجیم',en:'Belgium',tr:'Belçika',ru:'Бельгия',az:'Belçika',id:'Belgia' }, flag:'🇧🇪', lang:'nl' },
  { code:'CH', name:{ fa:'سوئیس',ar:'سويسرا',ur:'سوئٹزرلینڈ',en:'Switzerland',tr:'İsviçre',ru:'Швейцария',az:'İsveçrə',id:'Swiss' }, flag:'🇨🇭', lang:'de' },
  { code:'AT', name:{ fa:'اتریش',ar:'النمسا',ur:'آسٹریا',en:'Austria',tr:'Avusturya',ru:'Австрия',az:'Avstriya',id:'Austria' }, flag:'🇦🇹', lang:'de' },
  { code:'SE', name:{ fa:'سوئد',ar:'السويد',ur:'سویڈن',en:'Sweden',tr:'İsveç',ru:'Швеция',az:'İsveç',id:'Swedia' }, flag:'🇸🇪', lang:'sv' },
  { code:'NO', name:{ fa:'نروژ',ar:'النرويج',ur:'ناروے',en:'Norway',tr:'Norveç',ru:'Норвегия',az:'Norvec',id:'Norwegia' }, flag:'🇳🇴', lang:'no' },
  { code:'DK', name:{ fa:'دانمارک',ar:'الدنمارك',ur:'ڈنمارک',en:'Denmark',tr:'Danimarka',ru:'Дания',az:'Danimarka',id:'Denmark' }, flag:'🇩🇰', lang:'da' },
  { code:'FI', name:{ fa:'فنلاند',ar:'فنلندا',ur:'فن لینڈ',en:'Finland',tr:'Finlandiya',ru:'Финляндия',az:'Finlandiya',id:'Finlandia' }, flag:'🇫🇮', lang:'fi' },
  { code:'PL', name:{ fa:'لهستان',ar:'بولندا',ur:'پولینڈ',en:'Poland',tr:'Polonya',ru:'Польша',az:'Polşa',id:'Polandia' }, flag:'🇵🇱', lang:'pl' },
  { code:'CZ', name:{ fa:'چک',ar:'التشيك',ur:'چیک',en:'Czech Republic',tr:'Çekya',ru:'Чехия',az:'Çexiya',id:'Ceko' }, flag:'🇨🇿', lang:'cs' },
  { code:'RO', name:{ fa:'رومانی',ar:'رومانيا',ur:'رومانیہ',en:'Romania',tr:'Romanya',ru:'Румыния',az:'Rumıniya',id:'Rumania' }, flag:'🇷🇴', lang:'ro' },
  { code:'HU', name:{ fa:'مجارستان',ar:'المجر',ur:'ہنگری',en:'Hungary',tr:'Macaristan',ru:'Венгрия',az:'Macarıstan',id:'Hungaria' }, flag:'🇭🇺', lang:'hu' },
  { code:'GR', name:{ fa:'یونان',ar:'اليونان',ur:'یونان',en:'Greece',tr:'Yunanistan',ru:'Греция',az:'Yunanıstan',id:'Yunani' }, flag:'🇬🇷', lang:'el' },
  { code:'UA', name:{ fa:'اوکراین',ar:'أوكرانيا',ur:'یوکرین',en:'Ukraine',tr:'Ukrayna',ru:'Украина',az:'Ukrayna',id:'Ukraina' }, flag:'🇺🇦', lang:'uk' },
  { code:'KZ', name:{ fa:'قزاقستان',ar:'كازاخستان',ur:'قازقستان',en:'Kazakhstan',tr:'Kazakistan',ru:'Казахстан',az:'Qazaxıstan',id:'Kazakhstan' }, flag:'🇰🇿', lang:'kk' },
  { code:'KG', name:{ fa:'قرقیزستان',ar:'قيرغيزستان',ur:'قرغیزستان',en:'Kyrgyzstan',tr:'Kırgızistan',ru:'Кыргызстан',az:'Qırğızıstan',id:'Kirgistan' }, flag:'🇰🇬', lang:'ky' },
  { code:'TM', name:{ fa:'ترکمنستان',ar:'تركمانستان',ur:'ترکمانستان',en:'Turkmenistan',tr:'Türkmenistan',ru:'Туркменистан',az:'Türkmənistan',id:'Turkmenistan' }, flag:'🇹🇲', lang:'tk' },
  { code:'AM', name:{ fa:'ارمنستان',ar:'أرمينيا',ur:'آرمینیا',en:'Armenia',tr:'Ermenistan',ru:'Армения',az:'Ermənistan',id:'Armenia' }, flag:'🇦🇲', lang:'hy' },
  { code:'GE', name:{ fa:'گرجستان',ar:'جورجيا',ur:'جارجیا',en:'Georgia',tr:'Gürcistan',ru:'Грузия',az:'Gürcüstan',id:'Georgia' }, flag:'🇬🇪', lang:'ka' },
  { code:'BY', name:{ fa:'بلاروس',ar:'بيلاروسيا',ur:'بیلاروس',en:'Belarus',tr:'Beyaz Rusya',ru:'Беларусь',az:'Belarus',id:'Belarus' }, flag:'🇧🇾', lang:'be' },
  { code:'AU', name:{ fa:'استرالیا',ar:'أستراليا',ur:'آسٹریلیا',en:'Australia',tr:'Avustralya',ru:'Австралия',az:'Avstraliya',id:'Australia' }, flag:'🇦🇺', lang:'en' },
  { code:'CA', name:{ fa:'کانادا',ar:'كندا',ur:'کینیڈا',en:'Canada',tr:'Kanada',ru:'Канада',az:'Kanada',id:'Kanada' }, flag:'🇨🇦', lang:'en' },
  { code:'CN', name:{ fa:'چین',ar:'الصين',ur:'چین',en:'China',tr:'Çin',ru:'Китай',az:'Çin',id:'China' }, flag:'🇨🇳', lang:'zh' },
  { code:'JP', name:{ fa:'ژاپن',ar:'اليابان',ur:'جاپان',en:'Japan',tr:'Japonya',ru:'Япония',az:'Yaponiya',id:'Jepang' }, flag:'🇯🇵', lang:'ja' },
  { code:'KR', name:{ fa:'کره جنوبی',ar:'كوريا الجنوبية',ur:'جنوبی کوریا',en:'South Korea',tr:'Güney Kore',ru:'Южная Корея',az:'Cənubi Koreya',id:'Korea Selatan' }, flag:'🇰🇷', lang:'ko' },
  { code:'SG', name:{ fa:'سنگاپور',ar:'سنغافورة',ur:'سنگاپور',en:'Singapore',tr:'Singapur',ru:'Сингапур',az:'Sinqapur',id:'Singapura' }, flag:'🇸🇬', lang:'en' },
  { code:'PH', name:{ fa:'فیلیپین',ar:'الفلبين',ur:'فلپائن',en:'Philippines',tr:'Filipinler',ru:'Филиппины',az:'Filippin',id:'Filipina' }, flag:'🇵🇭', lang:'tl' },
  { code:'VN', name:{ fa:'ویتنام',ar:'فيتنام',ur:'ویتنام',en:'Vietnam',tr:'Vietnam',ru:'Вьетнам',az:'Vyetnam',id:'Vietnam' }, flag:'🇻🇳', lang:'vi' },
  { code:'TH', name:{ fa:'تایلند',ar:'تايلاند',ur:'تھائی لینڈ',en:'Thailand',tr:'Tayland',ru:'Таиланд',az:'Tailand',id:'Thailand' }, flag:'🇹🇭', lang:'th' },
  { code:'MM', name:{ fa:'میانمار',ar:'ميانمار',ur:'میانمار',en:'Myanmar',tr:'Myanmar',ru:'Мьянма',az:'Myanma',id:'Myanmar' }, flag:'🇲🇲', lang:'my' },
  { code:'NP', name:{ fa:'نپال',ar:'نيبال',ur:'نیپال',en:'Nepal',tr:'Nepal',ru:'Непал',az:'Nepal',id:'Nepal' }, flag:'🇳🇵', lang:'ne' },
  { code:'LK', name:{ fa:'سری‌لانکا',ar:'سريلانكا',ur:'سری لنکا',en:'Sri Lanka',tr:'Sri Lanka',ru:'Шри-Ланка',az:'Şri Lanka',id:'Sri Lanka' }, flag:'🇱🇰', lang:'si' },
  { code:'BR', name:{ fa:'برزیل',ar:'البرازيل',ur:'برازیل',en:'Brazil',tr:'Brezilya',ru:'Бразилия',az:'Braziliya',id:'Brasil' }, flag:'🇧🇷', lang:'pt' },
  { code:'MX', name:{ fa:'مکزیک',ar:'المكسيك',ur:'میکسیکو',en:'Mexico',tr:'Meksika',ru:'Мексика',az:'Meksika',id:'Meksiko' }, flag:'🇲🇽', lang:'es' },
  { code:'AR', name:{ fa:'آرژانتین',ar:'الأرجنتين',ur:'ارجنٹینا',en:'Argentina',tr:'Arjantin',ru:'Аргентина',az:'Argentina',id:'Argentina' }, flag:'🇦🇷', lang:'es' },
  { code:'CO', name:{ fa:'کلمبیا',ar:'كولومبيا',ur:'کولمبیا',en:'Colombia',tr:'Kolombiya',ru:'Колумбия',az:'Kolumbiya',id:'Kolombia' }, flag:'🇨🇴', lang:'es' },
  { code:'NG', name:{ fa:'نیجریه',ar:'نيجيريا',ur:'نائجیریا',en:'Nigeria',tr:'Nijerya',ru:'Нигерия',az:'Nigeriya',id:'Nigeria' }, flag:'🇳🇬', lang:'en' },
  { code:'ZA', name:{ fa:'آفریقای جنوبی',ar:'جنوب أفريقيا',ur:'جنوبی افریقہ',en:'South Africa',tr:'Güney Afrika',ru:'ЮАР',az:'Cənubi Afrika',id:'Afrika Selatan' }, flag:'🇿🇦', lang:'en' },
  { code:'KE', name:{ fa:'کنیا',ar:'كينيا',ur:'کینیا',en:'Kenya',tr:'Kenya',ru:'Кения',az:'Keniya',id:'Kenya' }, flag:'🇰🇪', lang:'sw' },
  { code:'ET', name:{ fa:'اتیوپی',ar:'إثيوبيا',ur:'ایتھوپیا',en:'Ethiopia',tr:'Etiyopya',ru:'Эфиопия',az:'Efiopiya',id:'Etiopia' }, flag:'🇪🇹', lang:'am' },
  { code:'GH', name:{ fa:'غنا',ar:'غانا',ur:'گھانا',en:'Ghana',tr:'Gana',ru:'Гана',az:'Qana',id:'Ghana' }, flag:'🇬🇭', lang:'en' },
  { code:'IL', name:{ fa:'اسرائیل',ar:'إسرائيل',ur:'اسرائیل',en:'Israel',tr:'İsrail',ru:'Израиль',az:'İsrail',id:'Israel' }, flag:'🇮🇱', lang:'he' },
  ,
];

function tx(obj) {
  return obj?.[i18n.lang] ?? obj?.['fa'] ?? obj?.['en'] ?? '';
}

/* ────────────────────────────────────────────────────────────
   2. REGISTRATION GATE — ثبت‌نام اجباری
   اگر کاربر ثبت‌نام نکرده، این صفحه نمایش داده می‌شود
   ──────────────────────────────────────────────────────────── */
export function showRegistrationGate(onComplete) {
  /* اگر قبلاً ثبت‌نام کرده */
  if (AuthState.isLoggedIn()) { onComplete?.(); return; }

  const overlay = document.createElement('div');
  overlay.id = 'reg-gate';
  overlay.style.cssText = `
    position:fixed;inset:0;
    background:rgba(10,14,20,0.96);
    backdrop-filter:blur(12px);
    z-index:99999;
    display:flex;align-items:center;justify-content:center;
    padding:24px;
    animation:fadeIn 0.4s ease;
  `;

  const COPY = {
    title:    { fa:'خوش آمدید به برکت‌هاب', ar:'مرحباً بك في بركت هاب', ur:'برکت‌ہب میں خوش آمدید', az:'BarakatHub-a xoş gəldiniz', tr:'BarakatHub\'a Hoş Geldiniz', ru:'Добро пожаловать в BarakatHub', en:'Welcome to BarakatHub' },
    subtitle: { fa:'برای ادامه لطفاً ثبت‌نام کنید', ar:'يرجى التسجيل للمتابعة', ur:'جاری رکھنے کے لیے رجسٹر کریں', az:'Davam etmək üçün qeydiyyatdan keçin', tr:'Devam etmek için kayıt olun', ru:'Для продолжения пожалуйста зарегистрируйтесь', en:'Please register to continue' },
    name:     { fa:'نام شما', ar:'اسمك', ur:'آپ کا نام', az:'Adınız', tr:'Adınız', ru:'Ваше имя', en:'Your Name' },
    email:    { fa:'ایمیل (اختیاری)', ar:'البريد الإلكتروني (اختياري)', ur:'ای میل (اختیاری)', az:'E-poçt (ixtiyari)', tr:'E-posta (isteğe bağlı)', ru:'Email (необязательно)', en:'Email (Optional)' },
    country:  { fa:'کشور شما', ar:'دولتك', ur:'آپ کا ملک', az:'Ölkəniz', tr:'Ülkeniz', ru:'Ваша страна', en:'Your Country' },
    submit:   { fa:'شروع کنید', ar:'ابدأ الآن', ur:'شروع کریں', az:'Başlayın', tr:'Başlayın', ru:'Начать', en:'Get Started' },
    orGoogle: { fa:'یا با گوگل وارد شوید', ar:'أو سجّل بحساب جوجل', ur:'یا گوگل سے داخل ہوں', az:'Və ya Google ilə daxil olun', tr:'veya Google ile giriş yapın', ru:'или войти через Google', en:'or sign in with Google' },
    nameReq:  { fa:'نام الزامی است', ar:'الاسم مطلوب', ur:'نام ضروری ہے', az:'Ad tələb olunur', tr:'Ad zorunludur', ru:'Имя обязательно', en:'Name is required' },
    countryReq:{ fa:'کشور را انتخاب کنید', ar:'اختر دولتك', ur:'ملک منتخب کریں', az:'Ölkəni seçin', tr:'Ülkeyi seçin', ru:'Выберите страну', en:'Select your country' },
  };

  overlay.innerHTML = `
    <div style="
      background:rgba(255,255,255,0.04);
      border:1px solid rgba(255,255,255,0.1);
      border-radius:24px;
      padding:40px 36px;
      width:100%;max-width:440px;
      box-shadow:0 32px 80px rgba(0,0,0,0.6);
    ">
      <!-- Header -->
      <div style="text-align:center;margin-bottom:28px">
        <div style="font-size:52px;margin-bottom:12px;filter:drop-shadow(0 4px 16px rgba(42,157,143,0.5))">🕌</div>
        <h2 style="font-family:var(--font-rtl-display);font-size:1.5rem;font-weight:900;color:white;margin-bottom:6px">${tx(COPY.title)}</h2>
        <p style="color:rgba(255,255,255,0.5);font-size:0.9rem">${tx(COPY.subtitle)}</p>
      </div>

      <!-- Google Button -->
      <button id="reg-google-btn" style="
        width:100%;display:flex;align-items:center;justify-content:center;gap:12px;
        padding:14px;background:white;color:#1f2937;
        border:none;border-radius:12px;font-size:1rem;font-weight:600;
        cursor:pointer;margin-bottom:20px;
        font-family:var(--font-rtl-body);
        transition:all 0.2s;box-shadow:0 4px 12px rgba(0,0,0,0.3);
      ">
        <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
          <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
        </svg>
        ${tx(COPY.orGoogle)}
      </button>

      <!-- Divider -->
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;color:rgba(255,255,255,0.3);font-size:0.8rem">
        <div style="flex:1;height:1px;background:rgba(255,255,255,0.1)"></div>
        ${tx({ fa:'یا با فرم', ar:'أو بالنموذج', ur:'یا فارم سے', en:'or with form', tr:'veya form ile', ru:'или через форму', az:'və ya forma ilə' })}
        <div style="flex:1;height:1px;background:rgba(255,255,255,0.1)"></div>
      </div>

      <!-- Form -->
      <div id="reg-form">
        <!-- نام -->
        <div style="margin-bottom:16px">
          <label style="display:block;font-size:0.85rem;font-weight:600;color:rgba(255,255,255,0.7);margin-bottom:8px" for="reg-name">
            ${tx(COPY.name)} *
          </label>
          <input id="reg-name" type="text"
            placeholder="${tx({ fa:'نام کامل', ar:'الاسم الكامل', ur:'پورا نام', en:'Full name', tr:'Tam adınız', ru:'Полное имя', az:'Tam adınız' })}"
            autocomplete="name"
            style="
              width:100%;padding:12px 14px;
              background:rgba(255,255,255,0.06);
              border:1.5px solid rgba(255,255,255,0.1);
              border-radius:10px;color:white;
              font-size:1rem;font-family:var(--font-rtl-body);
              box-sizing:border-box;transition:border-color 0.2s;
            "
          />
          <div id="reg-name-err" style="color:#fca5a5;font-size:0.8rem;margin-top:4px;display:none">⚠ ${tx(COPY.nameReq)}</div>
        </div>

        <!-- کشور -->
        <div style="margin-bottom:16px">
          <label style="display:block;font-size:0.85rem;font-weight:600;color:rgba(255,255,255,0.7);margin-bottom:8px" for="reg-country">
            ${tx(COPY.country)} *
          </label>
          <select id="reg-country"
            style="
              width:100%;padding:12px 14px;
              background:rgba(255,255,255,0.06);
              border:1.5px solid rgba(255,255,255,0.1);
              border-radius:10px;color:white;
              font-size:1rem;font-family:var(--font-rtl-body);
              box-sizing:border-box;cursor:pointer;
            "
            aria-label="${tx(COPY.country)}"
          >
            <option value="" style="background:#1a2332">${tx({ fa:'— کشور خود را انتخاب کنید —', ar:'— اختر دولتك —', ur:'— اپنا ملک منتخب کریں —', en:'— Select your country —', tr:'— Ülkenizi seçin —', ru:'— Выберите страну —', az:'— Ölkənizi seçin —' })}</option>
            ${COUNTRIES.map(c => `<option value="${c.code}" style="background:#1a2332">${c.flag} ${tx(c.name)}</option>`).join('')}
          </select>
          <div id="reg-country-err" style="color:#fca5a5;font-size:0.8rem;margin-top:4px;display:none">⚠ ${tx(COPY.countryReq)}</div>
        </div>

        <!-- ایمیل اختیاری -->
        <div style="margin-bottom:24px">
          <label style="display:block;font-size:0.85rem;font-weight:600;color:rgba(255,255,255,0.7);margin-bottom:8px" for="reg-email">
            ${tx(COPY.email)}
          </label>
          <input id="reg-email" type="email"
            placeholder="example@email.com"
            autocomplete="email"
            dir="ltr"
            style="
              width:100%;padding:12px 14px;
              background:rgba(255,255,255,0.06);
              border:1.5px solid rgba(255,255,255,0.1);
              border-radius:10px;color:white;
              font-size:1rem;
              box-sizing:border-box;transition:border-color 0.2s;
            "
          />
        </div>

        <!-- کد معرف اختیاری -->
        <div id="reg-referral-wrap" style="margin-bottom:16px"></div>

        <!-- Submit -->
        <button id="reg-submit-btn" style="
          width:100%;padding:14px;
          background:linear-gradient(135deg,var(--color-primary-500),var(--color-primary-700));
          color:white;border:none;border-radius:12px;
          font-size:1rem;font-weight:700;
          font-family:var(--font-rtl-body);
          cursor:pointer;transition:all 0.2s;
          box-shadow:0 4px 16px rgba(42,157,143,0.35);
        ">
          ${tx(COPY.submit)} →
        </button>
      </div>

    </div>
  `;

  document.body.appendChild(overlay);
  _bindRegGateEvents(overlay, onComplete);

  /* راه‌اندازی فیلد کد معرف */
  renderReferralInput(document.getElementById('reg-referral-wrap'));
  initReferral();

  /* Focus اول فیلد */
  setTimeout(() => document.getElementById('reg-name')?.focus(), 300);
}

function _bindRegGateEvents(overlay, onComplete) {
  /* استایل focus */
  overlay.querySelectorAll('input,select').forEach(el => {
    el.addEventListener('focus', () => { el.style.borderColor = 'var(--color-primary-400)'; });
    el.addEventListener('blur',  () => { el.style.borderColor = 'rgba(255,255,255,0.1)'; });
  });

  /* Google Sign-in */
  document.getElementById('reg-google-btn')?.addEventListener('click', () => {
    _handleGoogleSignIn(overlay, onComplete);
  });

  /* Submit */
  document.getElementById('reg-submit-btn')?.addEventListener('click', () => {
    _handleRegSubmit(overlay, onComplete);
  });

  /* Enter */
  overlay.querySelectorAll('input').forEach(inp => {
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') _handleRegSubmit(overlay, onComplete); });
  });
}

async function _handleRegSubmit(overlay, onComplete) {
  const name    = document.getElementById('reg-name')?.value?.trim();
  const country = document.getElementById('reg-country')?.value;
  const email   = document.getElementById('reg-email')?.value?.trim();

  let valid = true;

  if (!name) {
    document.getElementById('reg-name-err').style.display = 'block';
    document.getElementById('reg-name').style.borderColor = '#f87171';
    valid = false;
  } else {
    document.getElementById('reg-name-err').style.display = 'none';
  }

  if (!country) {
    document.getElementById('reg-country-err').style.display = 'block';
    document.getElementById('reg-country').style.borderColor = '#f87171';
    valid = false;
  } else {
    document.getElementById('reg-country-err').style.display = 'none';
  }

  if (!valid) return;

  /* ذخیره کاربر */
  const countryData = COUNTRIES.find(c => c.code === country);
  const user = {
    id:        'u_' + Math.random().toString(36).slice(2, 10),
    name,
    email:     email || null,
    country,
    countryName: countryData ? tx(countryData.name) : country,
    lang:      i18n.lang,
    isPremium: false,
    joinedAt:  new Date().toISOString(),
    signInMethod: 'form',
  };

  AuthState.setUser(user);
  AuthState.setToken('token_' + Date.now());

  /* ذخیره در لیست همه کاربران (برای داشبورد ادمین) */
  _saveToAllUsers(user);

  /* بررسی جایزه */
  await _checkPrize(user);

  /* ثبت کد معرف اگر وارد شده */
  await applyStoredReferral();

  /* بستن overlay */
  overlay.style.opacity = '0';
  overlay.style.transition = 'opacity 0.3s';
  setTimeout(() => { overlay.remove(); onComplete?.(); }, 300);
}

async function _handleGoogleSignIn(overlay, onComplete) {
  /* در production: Google OAuth 2.0 */
  /* شبیه‌سازی برای demo */
  const btn = document.getElementById('reg-google-btn');
  if (btn) { btn.textContent = '⏳ در حال اتصال...'; btn.disabled = true; }

  await new Promise(r => setTimeout(r, 1200));

  /* در production این داده‌ها از Google OAuth می‌آید */
  const mockGoogleUser = {
    id:          'g_' + Math.random().toString(36).slice(2, 10),
    name:        'کاربر گوگل',
    email:       'user@gmail.com',
    country:     LangDetector_getCountry() || 'IR',
    lang:        i18n.lang,
    isPremium:   false,
    joinedAt:    new Date().toISOString(),
    signInMethod:'google',
    googleId:    'mock_' + Date.now(),
  };

  AuthState.setUser(mockGoogleUser);
  AuthState.setToken('google_token_' + Date.now());
  _saveToAllUsers(mockGoogleUser);
  await _checkPrize(mockGoogleUser);

  overlay.style.opacity = '0';
  overlay.style.transition = 'opacity 0.3s';
  setTimeout(() => { overlay.remove(); onComplete?.(); }, 300);
}

function LangDetector_getCountry() {
  try {
    const cached = JSON.parse(localStorage.getItem('mh_lang_ip_cache') || 'null');
    return cached?.countryCode ?? null;
  } catch { return null; }
}

/* ────────────────────────────────────────────────────────────
   3. PRIZE SYSTEM — سیستم جایزه خودکار
   ──────────────────────────────────────────────────────────── */
async function _checkPrize(newUser) {
  try {
    const config = JSON.parse(localStorage.getItem('mh_prize_config') || 'null');
    if (!config?.active) return;

    const allUsers = JSON.parse(localStorage.getItem('mh_all_users') || '[]');
    const total    = allUsers.length;

    if (total > 0 && total % config.threshold === 0) {
      /* این کاربر برنده است */
      _activatePrize(newUser, config);
    }
  } catch {}
}

function _activatePrize(user, config) {
  /* فعال کردن اشتراک رایگان */
  const expiry = new Date();
  expiry.setMonth(expiry.getMonth() + (config.duration || 1));

  const updatedUser = {
    ...user,
    isPremium:     true,
    premiumExpiry: expiry.toISOString(),
    prizeWon:      true,
    prizeSection:  config.section,
  };

  AuthState.setUser(updatedUser);
  _saveToAllUsers(updatedUser);

  /* نوتیفیکیشن تبریک */
  setTimeout(() => {
    const msg = {
      fa: `🎁 تبریک! شما برنده ${config.duration} ماه اشتراک رایگان شدید!`,
      ar: `🎁 تهانينا! لقد فزت باشتراك مجاني لمدة ${config.duration} أشهر!`,
      ur: `🎁 مبارک ہو! آپ نے ${config.duration} ماہ مفت سبسکرپشن جیتا!`,
      en: `🎁 Congratulations! You won a ${config.duration}-month free subscription!`,
      tr: `🎁 Tebrikler! ${config.duration} aylık ücretsiz abonelik kazandınız!`,
      ru: `🎁 Поздравляем! Вы выиграли бесплатную подписку на ${config.duration} месяц(а)!`,
      az: `🎁 Təbriklər! ${config.duration} aylıq pulsuz abunəlik qazandınız!`,
    };
    const text = msg[i18n.lang] ?? msg['en'];
    const toast = document.createElement('div');
    toast.setAttribute('role', 'alert');
    toast.style.cssText = `
      position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);
      background:linear-gradient(135deg,#15803d,#166534);
      color:white;padding:24px 32px;border-radius:16px;
      font-size:1.1rem;font-weight:700;z-index:99999;
      box-shadow:0 16px 48px rgba(0,0,0,0.4);
      text-align:center;max-width:360px;width:90%;
      animation:scaleIn 0.4s ease;
      font-family:var(--font-rtl-body);
    `;
    toast.textContent = text;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 5000);
  }, 1000);
}

/* ────────────────────────────────────────────────────────────
   4. ALL USERS STORAGE (برای داشبورد ادمین)
   ──────────────────────────────────────────────────────────── */
function _saveToAllUsers(user) {
  try {
    const all = JSON.parse(localStorage.getItem('mh_all_users') || '[]');
    const idx = all.findIndex(u => u.id === user.id);
    if (idx !== -1) all[idx] = user;
    else            all.push(user);
    localStorage.setItem('mh_all_users', JSON.stringify(all));
  } catch {}
}

/* ────────────────────────────────────────────────────────────
   5. AUTO GATE — بررسی خودکار هنگام لود صفحه
   ──────────────────────────────────────────────────────────── */
export function initAuthGate(onLoggedIn) {
  /* صفحه‌هایی که نیاز به ثبت‌نام ندارند */
  const excludedPaths = [
    '/admin.html', '/admin-login.html', '/auth.html'
  ];
  const currentPath = window.location.pathname;
  const isExcluded  = excludedPaths.some(p => currentPath.endsWith(p));

  if (isExcluded) { onLoggedIn?.(); return; }

  if (!AuthState.isLoggedIn()) {
    showRegistrationGate(onLoggedIn);
  } else {
    onLoggedIn?.();
  }
}

/* ────────────────────────────────────────────────────────────
   6. PRIZE CONFIG MANAGER (برای داشبورد ادمین)
   ──────────────────────────────────────────────────────────── */
export const PrizeManager = {
  getConfig() {
    try { return JSON.parse(localStorage.getItem('mh_prize_config') || 'null'); }
    catch { return null; }
  },

  setConfig(config) {
    try {
      localStorage.setItem('mh_prize_config', JSON.stringify({
        ...config,
        updatedAt: new Date().toISOString(),
      }));
      return true;
    } catch { return false; }
  },

  /* فعال/غیرفعال کردن جایزه */
  toggle(active) {
    const cfg = this.getConfig() ?? {};
    return this.setConfig({ ...cfg, active });
  },

  /* آمار جوایز داده‌شده */
  getStats() {
    try {
      const users = JSON.parse(localStorage.getItem('mh_all_users') || '[]');
      return {
        total:    users.length,
        winners:  users.filter(u => u.prizeWon).length,
        premium:  users.filter(u => u.isPremium).length,
      };
    } catch { return { total:0, winners:0, premium:0 }; }
  },
};
