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
  { code:'AF', name:{ fa:'افغانستان',ar:'أفغانستان',ur:'افغانستان',en:'Afghanistan',tr:'Afganistan',ru:'Афганистан',az:'Əfqanıstan',id:'Afghanistan' }, flag:'🇦🇫', lang:'fa' },
  { code:'AL', name:{ fa:'آلبانی',ar:'ألبانيا',ur:'البانیہ',en:'Albania',tr:'Arnavutluk',ru:'Албания',az:'Albaniya',id:'Albania' }, flag:'🇦🇱', lang:'sq' },
  { code:'DZ', name:{ fa:'الجزایر',ar:'الجزائر',ur:'الجزائر',en:'Algeria',tr:'Cezayir',ru:'Алжир',az:'Əlcəzair',id:'Aljazair' }, flag:'🇩🇿', lang:'ar' },
  { code:'AD', name:{ fa:'آندورا',ar:'أندورا',ur:'انڈورا',en:'Andorra',tr:'Andorra',ru:'Андорра',az:'Andorra',id:'Andorra' }, flag:'🇦🇩', lang:'ca' },
  { code:'AO', name:{ fa:'آنگولا',ar:'أنغولا',ur:'انگولا',en:'Angola',tr:'Angola',ru:'Ангола',az:'Angola',id:'Angola' }, flag:'🇦🇴', lang:'pt' },
  { code:'AR', name:{ fa:'آرژانتین',ar:'الأرجنتين',ur:'ارجنٹینا',en:'Argentina',tr:'Arjantin',ru:'Аргентина',az:'Argentina',id:'Argentina' }, flag:'🇦🇷', lang:'es' },
  { code:'AM', name:{ fa:'ارمنستان',ar:'أرمينيا',ur:'آرمینیا',en:'Armenia',tr:'Ermenistan',ru:'Армения',az:'Ermənistan',id:'Armenia' }, flag:'🇦🇲', lang:'hy' },
  { code:'AU', name:{ fa:'استرالیا',ar:'أستراليا',ur:'آسٹریلیا',en:'Australia',tr:'Avustralya',ru:'Австралия',az:'Avstraliya',id:'Australia' }, flag:'🇦🇺', lang:'en' },
  { code:'AT', name:{ fa:'اتریش',ar:'النمسا',ur:'آسٹریا',en:'Austria',tr:'Avusturya',ru:'Австрия',az:'Avstriya',id:'Austria' }, flag:'🇦🇹', lang:'de' },
  { code:'AZ', name:{ fa:'آذربایجان',ar:'أذربيجان',ur:'آذربائیجان',en:'Azerbaijan',tr:'Azerbaycan',ru:'Азербайджан',az:'Azərbaycan',id:'Azerbaijan' }, flag:'🇦🇿', lang:'az' },
  { code:'BH', name:{ fa:'بحرین',ar:'البحرين',ur:'بحرین',en:'Bahrain',tr:'Bahreyn',ru:'Бахрейн',az:'Bəhreyn',id:'Bahrain' }, flag:'🇧🇭', lang:'ar' },
  { code:'BD', name:{ fa:'بنگلادش',ar:'بنغلاديش',ur:'بنگلہ دیش',en:'Bangladesh',tr:'Bangladeş',ru:'Бангладеш',az:'Banqladeş',id:'Bangladesh' }, flag:'🇧🇩', lang:'bn' },
  { code:'BY', name:{ fa:'بلاروس',ar:'بيلاروسيا',ur:'بیلاروس',en:'Belarus',tr:'Belarus',ru:'Беларусь',az:'Belarus',id:'Belarusia' }, flag:'🇧🇾', lang:'be' },
  { code:'BE', name:{ fa:'بلژیک',ar:'بلجيكا',ur:'بیلجیم',en:'Belgium',tr:'Belçika',ru:'Бельгия',az:'Belçika',id:'Belgia' }, flag:'🇧🇪', lang:'fr' },
  { code:'BJ', name:{ fa:'بنین',ar:'بنين',ur:'بینن',en:'Benin',tr:'Benin',ru:'Бенин',az:'Benin',id:'Benin' }, flag:'🇧🇯', lang:'fr' },
  { code:'BO', name:{ fa:'بولیوی',ar:'بوليفيا',ur:'بولیویا',en:'Bolivia',tr:'Bolivya',ru:'Боливия',az:'Boliviya',id:'Bolivia' }, flag:'🇧🇴', lang:'es' },
  { code:'BA', name:{ fa:'بوسنی',ar:'البوسنة',ur:'بوسنیا',en:'Bosnia',tr:'Bosna',ru:'Босния',az:'Bosniya',id:'Bosnia' }, flag:'🇧🇦', lang:'bs' },
  { code:'BR', name:{ fa:'برزیل',ar:'البرازيل',ur:'برازیل',en:'Brazil',tr:'Brezilya',ru:'Бразилия',az:'Braziliya',id:'Brasil' }, flag:'🇧🇷', lang:'pt' },
  { code:'BG', name:{ fa:'بلغارستان',ar:'بلغاريا',ur:'بلغاریہ',en:'Bulgaria',tr:'Bulgaristan',ru:'Болгария',az:'Bolqarıstan',id:'Bulgaria' }, flag:'🇧🇬', lang:'bg' },
  { code:'BF', name:{ fa:'بورکینافاسو',ar:'بوركينا فاسو',ur:'برکینا فاسو',en:'Burkina Faso',tr:'Burkina Faso',ru:'Буркина-Фасо',az:'Burkina-Faso',id:'Burkina Faso' }, flag:'🇧🇫', lang:'fr' },
  { code:'KH', name:{ fa:'کامبوج',ar:'كمبوديا',ur:'کمبوڈیا',en:'Cambodia',tr:'Kamboçya',ru:'Камбоджа',az:'Kamboca',id:'Kamboja' }, flag:'🇰🇭', lang:'km' },
  { code:'CM', name:{ fa:'کامرون',ar:'الكاميرون',ur:'کیمرون',en:'Cameroon',tr:'Kamerun',ru:'Камерун',az:'Kamerun',id:'Kamerun' }, flag:'🇨🇲', lang:'fr' },
  { code:'CA', name:{ fa:'کانادا',ar:'كندا',ur:'کینیڈا',en:'Canada',tr:'Kanada',ru:'Канада',az:'Kanada',id:'Kanada' }, flag:'🇨🇦', lang:'en' },
  { code:'TD', name:{ fa:'چاد',ar:'تشاد',ur:'چاڈ',en:'Chad',tr:'Çad',ru:'Чад',az:'Çad',id:'Chad' }, flag:'🇹🇩', lang:'fr' },
  { code:'CL', name:{ fa:'شیلی',ar:'تشيلي',ur:'چلی',en:'Chile',tr:'Şili',ru:'Чили',az:'Çili',id:'Chile' }, flag:'🇨🇱', lang:'es' },
  { code:'CN', name:{ fa:'چین',ar:'الصين',ur:'چین',en:'China',tr:'Çin',ru:'Китай',az:'Çin',id:'China' }, flag:'🇨🇳', lang:'zh' },
  { code:'CO', name:{ fa:'کلمبیا',ar:'كولومبيا',ur:'کولمبیا',en:'Colombia',tr:'Kolombiya',ru:'Колумбия',az:'Kolumbiya',id:'Kolombia' }, flag:'🇨🇴', lang:'es' },
  { code:'CD', name:{ fa:'کنگو',ar:'الكونغو',ur:'کانگو',en:'Congo DR',tr:'Kongo',ru:'Конго',az:'Konqo',id:'Kongo' }, flag:'🇨🇩', lang:'fr' },
  { code:'CR', name:{ fa:'کاستاریکا',ar:'كوستاريكا',ur:'کوسٹاریکا',en:'Costa Rica',tr:'Kosta Rika',ru:'Коста-Рика',az:'Kosta-Rika',id:'Kosta Rika' }, flag:'🇨🇷', lang:'es' },
  { code:'HR', name:{ fa:'کرواسی',ar:'كرواتيا',ur:'کروشیا',en:'Croatia',tr:'Hırvatistan',ru:'Хорватия',az:'Xorvatiya',id:'Kroasia' }, flag:'🇭🇷', lang:'hr' },
  { code:'CU', name:{ fa:'کوبا',ar:'كوبا',ur:'کیوبا',en:'Cuba',tr:'Küba',ru:'Куба',az:'Kuba',id:'Kuba' }, flag:'🇨🇺', lang:'es' },
  { code:'CY', name:{ fa:'قبرس',ar:'قبرص',ur:'قبرص',en:'Cyprus',tr:'Kıbrıs',ru:'Кипр',az:'Kipr',id:'Siprus' }, flag:'🇨🇾', lang:'el' },
  { code:'CZ', name:{ fa:'چک',ar:'التشيك',ur:'چیک',en:'Czech Republic',tr:'Çekya',ru:'Чехия',az:'Çexiya',id:'Ceko' }, flag:'🇨🇿', lang:'cs' },
  { code:'DK', name:{ fa:'دانمارک',ar:'الدنمارك',ur:'ڈنمارک',en:'Denmark',tr:'Danimarka',ru:'Дания',az:'Danimarka',id:'Denmark' }, flag:'🇩🇰', lang:'da' },
  { code:'DO', name:{ fa:'دومینیکن',ar:'الدومينيكان',ur:'ڈومینیکن',en:'Dominican Republic',tr:'Dominik',ru:'Доминикана',az:'Dominikan',id:'Dominika' }, flag:'🇩🇴', lang:'es' },
  { code:'EC', name:{ fa:'اکوادور',ar:'الإكوادور',ur:'ایکواڈور',en:'Ecuador',tr:'Ekvador',ru:'Эквадор',az:'Ekvador',id:'Ekuador' }, flag:'🇪🇨', lang:'es' },
  { code:'EG', name:{ fa:'مصر',ar:'مصر',ur:'مصر',en:'Egypt',tr:'Mısır',ru:'Египет',az:'Misir',id:'Mesir' }, flag:'🇪🇬', lang:'ar' },
  { code:'SV', name:{ fa:'السالوادور',ar:'السلفادور',ur:'ایل سلواڈور',en:'El Salvador',tr:'El Salvador',ru:'Сальвадор',az:'Salvador',id:'El Salvador' }, flag:'🇸🇻', lang:'es' },
  { code:'ET', name:{ fa:'اتیوپی',ar:'إثيوبيا',ur:'ایتھوپیا',en:'Ethiopia',tr:'Etiyopya',ru:'Эфиопия',az:'Efiopiya',id:'Ethiopia' }, flag:'🇪🇹', lang:'am' },
  { code:'FI', name:{ fa:'فنلاند',ar:'فنلندا',ur:'فن لینڈ',en:'Finland',tr:'Finlandiya',ru:'Финляндия',az:'Finlandiya',id:'Finlandia' }, flag:'🇫🇮', lang:'fi' },
  { code:'FR', name:{ fa:'فرانسه',ar:'فرنسا',ur:'فرانس',en:'France',tr:'Fransa',ru:'Франция',az:'Fransa',id:'Prancis' }, flag:'🇫🇷', lang:'fr' },
  { code:'GE', name:{ fa:'گرجستان',ar:'جورجيا',ur:'جارجیا',en:'Georgia',tr:'Gürcistan',ru:'Грузия',az:'Gürcüstan',id:'Georgia' }, flag:'🇬🇪', lang:'ka' },
  { code:'DE', name:{ fa:'آلمان',ar:'ألمانيا',ur:'جرمنی',en:'Germany',tr:'Almanya',ru:'Германия',az:'Almaniya',id:'Jerman' }, flag:'🇩🇪', lang:'de' },
  { code:'GH', name:{ fa:'غنا',ar:'غانا',ur:'گھانا',en:'Ghana',tr:'Gana',ru:'Гана',az:'Qana',id:'Ghana' }, flag:'🇬🇭', lang:'en' },
  { code:'GR', name:{ fa:'یونان',ar:'اليونان',ur:'یونان',en:'Greece',tr:'Yunanistan',ru:'Греция',az:'Yunanıstan',id:'Yunani' }, flag:'🇬🇷', lang:'el' },
  { code:'GT', name:{ fa:'گواتمالا',ar:'غواتيمالا',ur:'گوئٹے مالا',en:'Guatemala',tr:'Guatemala',ru:'Гватемала',az:'Qvatemala',id:'Guatemala' }, flag:'🇬🇹', lang:'es' },
  { code:'HN', name:{ fa:'هندوراس',ar:'هندوراس',ur:'ہونڈوراس',en:'Honduras',tr:'Honduras',ru:'Гондурас',az:'Honduras',id:'Honduras' }, flag:'🇭🇳', lang:'es' },
  { code:'HK', name:{ fa:'هنگ‌کنگ',ar:'هونغ كونغ',ur:'ہانگ کانگ',en:'Hong Kong',tr:'Hong Kong',ru:'Гонконг',az:'Honq Konq',id:'Hong Kong' }, flag:'🇭🇰', lang:'zh' },
  { code:'HU', name:{ fa:'مجارستان',ar:'المجر',ur:'ہنگری',en:'Hungary',tr:'Macaristan',ru:'Венгрия',az:'Macarıstan',id:'Hungaria' }, flag:'🇭🇺', lang:'hu' },
  { code:'IS', name:{ fa:'ایسلند',ar:'آيسلندا',ur:'آئس لینڈ',en:'Iceland',tr:'İzlanda',ru:'Исландия',az:'İslandiya',id:'Islandia' }, flag:'🇮🇸', lang:'is' },
  { code:'IN', name:{ fa:'هند',ar:'الهند',ur:'بھارت',en:'India',tr:'Hindistan',ru:'Индия',az:'Hindistan',id:'India' }, flag:'🇮🇳', lang:'hi' },
  { code:'ID', name:{ fa:'اندونزی',ar:'إندونيسيا',ur:'انڈونیشیا',en:'Indonesia',tr:'Endonezya',ru:'Индонезия',az:'İndoneziya',id:'Indonesia' }, flag:'🇮🇩', lang:'id' },
  { code:'IR', name:{ fa:'ایران',ar:'إيران',ur:'ایران',en:'Iran',tr:'İran',ru:'Иран',az:'İran',id:'Iran' }, flag:'🇮🇷', lang:'fa' },
  { code:'IQ', name:{ fa:'عراق',ar:'العراق',ur:'عراق',en:'Iraq',tr:'Irak',ru:'Ирак',az:'İraq',id:'Irak' }, flag:'🇮🇶', lang:'ar' },
  { code:'IE', name:{ fa:'ایرلند',ar:'أيرلندا',ur:'آئرلینڈ',en:'Ireland',tr:'İrlanda',ru:'Ирландия',az:'İrlandiya',id:'Irlandia' }, flag:'🇮🇪', lang:'en' },
  { code:'IL', name:{ fa:'اسرائیل',ar:'إسرائيل',ur:'اسرائیل',en:'Israel',tr:'İsrail',ru:'Израиль',az:'İsrail',id:'Israel' }, flag:'🇮🇱', lang:'he' },
  { code:'IT', name:{ fa:'ایتالیا',ar:'إيطاليا',ur:'اٹلی',en:'Italy',tr:'İtalya',ru:'Италия',az:'İtaliya',id:'Italia' }, flag:'🇮🇹', lang:'it' },
  { code:'JM', name:{ fa:'جامائیکا',ar:'جامايكا',ur:'جمیکا',en:'Jamaica',tr:'Jamaika',ru:'Ямайка',az:'Yamayka',id:'Jamaika' }, flag:'🇯🇲', lang:'en' },
  { code:'JP', name:{ fa:'ژاپن',ar:'اليابان',ur:'جاپان',en:'Japan',tr:'Japonya',ru:'Япония',az:'Yaponiya',id:'Jepang' }, flag:'🇯🇵', lang:'ja' },
  { code:'JO', name:{ fa:'اردن',ar:'الأردن',ur:'اردن',en:'Jordan',tr:'Ürdün',ru:'Иордания',az:'İordaniya',id:'Yordania' }, flag:'🇯🇴', lang:'ar' },
  { code:'KZ', name:{ fa:'قزاقستان',ar:'كازاخستان',ur:'قازقستان',en:'Kazakhstan',tr:'Kazakistan',ru:'Казахстан',az:'Qazaxıstan',id:'Kazakhstan' }, flag:'🇰🇿', lang:'kk' },
  { code:'KE', name:{ fa:'کنیا',ar:'كينيا',ur:'کینیا',en:'Kenya',tr:'Kenya',ru:'Кения',az:'Keniya',id:'Kenya' }, flag:'🇰🇪', lang:'sw' },
  { code:'KG', name:{ fa:'قرقیزستان',ar:'قيرغيزستان',ur:'کرغزستان',en:'Kyrgyzstan',tr:'Kırgızistan',ru:'Киргизия',az:'Qırğızıstan',id:'Kirgizstan' }, flag:'🇰🇬', lang:'ky' },
  { code:'KW', name:{ fa:'کویت',ar:'الكويت',ur:'کویت',en:'Kuwait',tr:'Kuveyt',ru:'Кувейт',az:'Küveyt',id:'Kuwait' }, flag:'🇰🇼', lang:'ar' },
  { code:'LA', name:{ fa:'لائوس',ar:'لاوس',ur:'لاؤس',en:'Laos',tr:'Laos',ru:'Лаос',az:'Laos',id:'Laos' }, flag:'🇱🇦', lang:'lo' },
  { code:'LV', name:{ fa:'لتونی',ar:'لاتفيا',ur:'لٹویا',en:'Latvia',tr:'Letonya',ru:'Латвия',az:'Latviya',id:'Latvia' }, flag:'🇱🇻', lang:'lv' },
  { code:'LB', name:{ fa:'لبنان',ar:'لبنان',ur:'لبنان',en:'Lebanon',tr:'Lübnan',ru:'Ливан',az:'Livan',id:'Lebanon' }, flag:'🇱🇧', lang:'ar' },
  { code:'LY', name:{ fa:'لیبی',ar:'ليبيا',ur:'لیبیا',en:'Libya',tr:'Libya',ru:'Ливия',az:'Liviya',id:'Libya' }, flag:'🇱🇾', lang:'ar' },
  { code:'LT', name:{ fa:'لیتوانی',ar:'ليتوانيا',ur:'لتھوانیا',en:'Lithuania',tr:'Litvanya',ru:'Литва',az:'Litva',id:'Lituania' }, flag:'🇱🇹', lang:'lt' },
  { code:'LU', name:{ fa:'لوکزامبورگ',ar:'لكسمبورغ',ur:'لکسمبرگ',en:'Luxembourg',tr:'Lüksemburg',ru:'Люксембург',az:'Lüksemburq',id:'Luksemburg' }, flag:'🇱🇺', lang:'fr' },
  { code:'MY', name:{ fa:'مالزی',ar:'ماليزيا',ur:'ملائیشیا',en:'Malaysia',tr:'Malezya',ru:'Малайзия',az:'Malayziya',id:'Malaysia' }, flag:'🇲🇾', lang:'ms' },
  { code:'MV', name:{ fa:'مالدیو',ar:'جزر المالديف',ur:'مالدیپ',en:'Maldives',tr:'Maldivler',ru:'Мальдивы',az:'Maldiv',id:'Maladewa' }, flag:'🇲🇻', lang:'dv' },
  { code:'ML', name:{ fa:'مالی',ar:'مالي',ur:'مالی',en:'Mali',tr:'Mali',ru:'Мали',az:'Mali',id:'Mali' }, flag:'🇲🇱', lang:'fr' },
  { code:'MT', name:{ fa:'مالت',ar:'مالطا',ur:'مالٹا',en:'Malta',tr:'Malta',ru:'Мальта',az:'Malta',id:'Malta' }, flag:'🇲🇹', lang:'mt' },
  { code:'MR', name:{ fa:'موریتانی',ar:'موريتانيا',ur:'موریطانیہ',en:'Mauritania',tr:'Moritanya',ru:'Мавритания',az:'Mavritaniya',id:'Mauritania' }, flag:'🇲🇷', lang:'ar' },
  { code:'MX', name:{ fa:'مکزیک',ar:'المكسيك',ur:'میکسیکو',en:'Mexico',tr:'Meksika',ru:'Мексика',az:'Meksika',id:'Meksiko' }, flag:'🇲🇽', lang:'es' },
  { code:'MD', name:{ fa:'مولداوی',ar:'مولدوفا',ur:'مالدووا',en:'Moldova',tr:'Moldova',ru:'Молдова',az:'Moldova',id:'Moldova' }, flag:'🇲🇩', lang:'ro' },
  { code:'MN', name:{ fa:'مغولستان',ar:'منغوليا',ur:'منگولیا',en:'Mongolia',tr:'Moğolistan',ru:'Монголия',az:'Monqoliya',id:'Mongolia' }, flag:'🇲🇳', lang:'mn' },
  { code:'ME', name:{ fa:'مونته‌نگرو',ar:'الجبل الأسود',ur:'مونٹی نیگرو',en:'Montenegro',tr:'Karadağ',ru:'Черногория',az:'Monteneqro',id:'Montenegro' }, flag:'🇲🇪', lang:'sr' },
  { code:'MA', name:{ fa:'مراکش',ar:'المغرب',ur:'مراکش',en:'Morocco',tr:'Fas',ru:'Марокко',az:'Mərakeş',id:'Maroko' }, flag:'🇲🇦', lang:'ar' },
  { code:'MZ', name:{ fa:'موزامبیک',ar:'موزمبيق',ur:'موزمبیق',en:'Mozambique',tr:'Mozambik',ru:'Мозамбик',az:'Mozambik',id:'Mozambik' }, flag:'🇲🇿', lang:'pt' },
  { code:'MM', name:{ fa:'میانمار',ar:'ميانمار',ur:'میانمار',en:'Myanmar',tr:'Myanmar',ru:'Мьянма',az:'Myanma',id:'Myanmar' }, flag:'🇲🇲', lang:'my' },
  { code:'NP', name:{ fa:'نپال',ar:'نيبال',ur:'نیپال',en:'Nepal',tr:'Nepal',ru:'Непал',az:'Nepal',id:'Nepal' }, flag:'🇳🇵', lang:'ne' },
  { code:'NL', name:{ fa:'هلند',ar:'هولندا',ur:'نیدرلینڈ',en:'Netherlands',tr:'Hollanda',ru:'Нидерланды',az:'Niderland',id:'Belanda' }, flag:'🇳🇱', lang:'nl' },
  { code:'NZ', name:{ fa:'نیوزیلند',ar:'نيوزيلندا',ur:'نیوزی لینڈ',en:'New Zealand',tr:'Yeni Zelanda',ru:'Новая Зеландия',az:'Yeni Zelandiya',id:'Selandia Baru' }, flag:'🇳🇿', lang:'en' },
  { code:'NI', name:{ fa:'نیکاراگوئه',ar:'نيكاراغوا',ur:'نکاراگوا',en:'Nicaragua',tr:'Nikaragua',ru:'Никарагуа',az:'Nikaraqua',id:'Nikaragua' }, flag:'🇳🇮', lang:'es' },
  { code:'NE', name:{ fa:'نیجر',ar:'النيجر',ur:'نائجر',en:'Niger',tr:'Nijer',ru:'Нигер',az:'Niger',id:'Niger' }, flag:'🇳🇪', lang:'fr' },
  { code:'NG', name:{ fa:'نیجریه',ar:'نيجيريا',ur:'نائجیریا',en:'Nigeria',tr:'Nijerya',ru:'Нигерия',az:'Nigeriya',id:'Nigeria' }, flag:'🇳🇬', lang:'en' },
  { code:'NO', name:{ fa:'نروژ',ar:'النرويج',ur:'ناروے',en:'Norway',tr:'Norveç',ru:'Норвегия',az:'Norveç',id:'Norwegia' }, flag:'🇳🇴', lang:'no' },
  { code:'OM', name:{ fa:'عمان',ar:'عُمان',ur:'عمان',en:'Oman',tr:'Umman',ru:'Оман',az:'Oman',id:'Oman' }, flag:'🇴🇲', lang:'ar' },
  { code:'PK', name:{ fa:'پاکستان',ar:'باكستان',ur:'پاکستان',en:'Pakistan',tr:'Pakistan',ru:'Пакистан',az:'Pakistan',id:'Pakistan' }, flag:'🇵🇰', lang:'ur' },
  { code:'PS', name:{ fa:'فلسطین',ar:'فلسطين',ur:'فلسطین',en:'Palestine',tr:'Filistin',ru:'Палестина',az:'Fələstin',id:'Palestina' }, flag:'🇵🇸', lang:'ar' },
  { code:'PA', name:{ fa:'پاناما',ar:'بنما',ur:'پانامہ',en:'Panama',tr:'Panama',ru:'Панама',az:'Panama',id:'Panama' }, flag:'🇵🇦', lang:'es' },
  { code:'PY', name:{ fa:'پاراگوئه',ar:'باراغواي',ur:'پیراگوئے',en:'Paraguay',tr:'Paraguay',ru:'Парагвай',az:'Paraqvay',id:'Paraguay' }, flag:'🇵🇾', lang:'es' },
  { code:'PE', name:{ fa:'پرو',ar:'بيرو',ur:'پیرو',en:'Peru',tr:'Peru',ru:'Перу',az:'Peru',id:'Peru' }, flag:'🇵🇪', lang:'es' },
  { code:'PH', name:{ fa:'فیلیپین',ar:'الفلبين',ur:'فلپائن',en:'Philippines',tr:'Filipinler',ru:'Филиппины',az:'Filippin',id:'Filipina' }, flag:'🇵🇭', lang:'tl' },
  { code:'PL', name:{ fa:'لهستان',ar:'بولندا',ur:'پولینڈ',en:'Poland',tr:'Polonya',ru:'Польша',az:'Polşa',id:'Polandia' }, flag:'🇵🇱', lang:'pl' },
  { code:'PT', name:{ fa:'پرتغال',ar:'البرتغال',ur:'پرتگال',en:'Portugal',tr:'Portekiz',ru:'Португалия',az:'Portuqaliya',id:'Portugal' }, flag:'🇵🇹', lang:'pt' },
  { code:'QA', name:{ fa:'قطر',ar:'قطر',ur:'قطر',en:'Qatar',tr:'Katar',ru:'Катар',az:'Qətər',id:'Qatar' }, flag:'🇶🇦', lang:'ar' },
  { code:'RO', name:{ fa:'رومانی',ar:'رومانيا',ur:'رومانیہ',en:'Romania',tr:'Romanya',ru:'Румыния',az:'Rumıniya',id:'Rumania' }, flag:'🇷🇴', lang:'ro' },
  { code:'RU', name:{ fa:'روسیه',ar:'روسيا',ur:'روس',en:'Russia',tr:'Rusya',ru:'Россия',az:'Rusiya',id:'Rusia' }, flag:'🇷🇺', lang:'ru' },
  { code:'SA', name:{ fa:'عربستان',ar:'المملكة العربية السعودية',ur:'سعودی عرب',en:'Saudi Arabia',tr:'Suudi Arabistan',ru:'Саудовская Аравия',az:'Səudiyyə Ərəbistanı',id:'Arab Saudi' }, flag:'🇸🇦', lang:'ar' },
  { code:'SN', name:{ fa:'سنگال',ar:'السنغال',ur:'سینیگال',en:'Senegal',tr:'Senegal',ru:'Сенегал',az:'Seneqal',id:'Senegal' }, flag:'🇸🇳', lang:'fr' },
  { code:'RS', name:{ fa:'صربستان',ar:'صربيا',ur:'سربیا',en:'Serbia',tr:'Sırbistan',ru:'Сербия',az:'Serbiya',id:'Serbia' }, flag:'🇷🇸', lang:'sr' },
  { code:'SG', name:{ fa:'سنگاپور',ar:'سنغافورة',ur:'سنگاپور',en:'Singapore',tr:'Singapur',ru:'Сингапур',az:'Sinqapur',id:'Singapura' }, flag:'🇸🇬', lang:'en' },
  { code:'SK', name:{ fa:'اسلواکی',ar:'سلوفاكيا',ur:'سلوواکیہ',en:'Slovakia',tr:'Slovakya',ru:'Словакия',az:'Slovakiya',id:'Slovakia' }, flag:'🇸🇰', lang:'sk' },
  { code:'SI', name:{ fa:'اسلوونی',ar:'سلوفينيا',ur:'سلووینیا',en:'Slovenia',tr:'Slovenya',ru:'Словения',az:'Sloveniya',id:'Slovenia' }, flag:'🇸🇮', lang:'sl' },
  { code:'SO', name:{ fa:'سومالی',ar:'الصومال',ur:'صومالیہ',en:'Somalia',tr:'Somali',ru:'Сомали',az:'Somali',id:'Somalia' }, flag:'🇸🇴', lang:'so' },
  { code:'ZA', name:{ fa:'آفریقای جنوبی',ar:'جنوب أفريقيا',ur:'جنوبی افریقہ',en:'South Africa',tr:'Güney Afrika',ru:'ЮАР',az:'Cənubi Afrika',id:'Afrika Selatan' }, flag:'🇿🇦', lang:'en' },
  { code:'KR', name:{ fa:'کره جنوبی',ar:'كوريا الجنوبية',ur:'جنوبی کوریا',en:'South Korea',tr:'Güney Kore',ru:'Южная Корея',az:'Cənubi Koreya',id:'Korea Selatan' }, flag:'🇰🇷', lang:'ko' },
  { code:'ES', name:{ fa:'اسپانیا',ar:'إسبانيا',ur:'ہسپانیہ',en:'Spain',tr:'İspanya',ru:'Испания',az:'İspaniya',id:'Spanyol' }, flag:'🇪🇸', lang:'es' },
  { code:'LK', name:{ fa:'سریلانکا',ar:'سريلانكا',ur:'سری لنکا',en:'Sri Lanka',tr:'Sri Lanka',ru:'Шри-Ланка',az:'Şri Lanka',id:'Sri Lanka' }, flag:'🇱🇰', lang:'si' },
  { code:'SD', name:{ fa:'سودان',ar:'السودان',ur:'سوڈان',en:'Sudan',tr:'Sudan',ru:'Судан',az:'Sudan',id:'Sudan' }, flag:'🇸🇩', lang:'ar' },
  { code:'SE', name:{ fa:'سوئد',ar:'السويد',ur:'سویڈن',en:'Sweden',tr:'İsveç',ru:'Швеция',az:'İsveç',id:'Swedia' }, flag:'🇸🇪', lang:'sv' },
  { code:'CH', name:{ fa:'سوئیس',ar:'سويسرا',ur:'سوئٹزرلینڈ',en:'Switzerland',tr:'İsviçre',ru:'Швейцария',az:'İsveçrə',id:'Swiss' }, flag:'🇨🇭', lang:'de' },
  { code:'SY', name:{ fa:'سوریه',ar:'سوريا',ur:'شام',en:'Syria',tr:'Suriye',ru:'Сирия',az:'Suriya',id:'Suriah' }, flag:'🇸🇾', lang:'ar' },
  { code:'TW', name:{ fa:'تایوان',ar:'تايوان',ur:'تائیوان',en:'Taiwan',tr:'Tayvan',ru:'Тайвань',az:'Tayvan',id:'Taiwan' }, flag:'🇹🇼', lang:'zh' },
  { code:'TJ', name:{ fa:'تاجیکستان',ar:'طاجيكستان',ur:'تاجکستان',en:'Tajikistan',tr:'Tacikistan',ru:'Таджикистан',az:'Tacikistan',id:'Tajikistan' }, flag:'🇹🇯', lang:'tg' },
  { code:'TZ', name:{ fa:'تانزانیا',ar:'تنزانيا',ur:'تنزانیہ',en:'Tanzania',tr:'Tanzanya',ru:'Танзания',az:'Tanzaniya',id:'Tanzania' }, flag:'🇹🇿', lang:'sw' },
  { code:'TH', name:{ fa:'تایلند',ar:'تايلاند',ur:'تھائی لینڈ',en:'Thailand',tr:'Tayland',ru:'Таиланд',az:'Tailand',id:'Thailand' }, flag:'🇹🇭', lang:'th' },
  { code:'TN', name:{ fa:'تونس',ar:'تونس',ur:'تونس',en:'Tunisia',tr:'Tunus',ru:'Тунис',az:'Tunis',id:'Tunisia' }, flag:'🇹🇳', lang:'ar' },
  { code:'TR', name:{ fa:'ترکیه',ar:'تركيا',ur:'ترکی',en:'Turkey',tr:'Türkiye',ru:'Турция',az:'Türkiyə',id:'Turki' }, flag:'🇹🇷', lang:'tr' },
  { code:'TM', name:{ fa:'ترکمنستان',ar:'تركمانستان',ur:'ترکمانستان',en:'Turkmenistan',tr:'Türkmenistan',ru:'Туркменистан',az:'Türkmənistan',id:'Turkmenistan' }, flag:'🇹🇲', lang:'tk' },
  { code:'UG', name:{ fa:'اوگاندا',ar:'أوغندا',ur:'یوگنڈا',en:'Uganda',tr:'Uganda',ru:'Уганда',az:'Uqanda',id:'Uganda' }, flag:'🇺🇬', lang:'sw' },
  { code:'UA', name:{ fa:'اوکراین',ar:'أوكرانيا',ur:'یوکرین',en:'Ukraine',tr:'Ukrayna',ru:'Украина',az:'Ukrayna',id:'Ukraina' }, flag:'🇺🇦', lang:'uk' },
  { code:'AE', name:{ fa:'امارات',ar:'الإمارات',ur:'متحدہ عرب امارات',en:'UAE',tr:'BAE',ru:'ОАЭ',az:'BƏƏ',id:'UEA' }, flag:'🇦🇪', lang:'ar' },
  { code:'GB', name:{ fa:'انگلستان',ar:'المملكة المتحدة',ur:'برطانیہ',en:'United Kingdom',tr:'İngiltere',ru:'Великобритания',az:'Böyük Britaniya',id:'Inggris' }, flag:'🇬🇧', lang:'en' },
  { code:'US', name:{ fa:'آمریکا',ar:'الولايات المتحدة',ur:'امریکہ',en:'United States',tr:'ABD',ru:'США',az:'ABŞ',id:'Amerika Serikat' }, flag:'🇺🇸', lang:'en' },
  { code:'UY', name:{ fa:'اروگوئه',ar:'أوروغواي',ur:'یوروگوئے',en:'Uruguay',tr:'Uruguay',ru:'Уругвай',az:'Uruqvay',id:'Uruguay' }, flag:'🇺🇾', lang:'es' },
  { code:'UZ', name:{ fa:'ازبکستان',ar:'أوزبكستان',ur:'ازبکستان',en:'Uzbekistan',tr:'Özbekistan',ru:'Узбекистан',az:'Özbəkistan',id:'Uzbekistan' }, flag:'🇺🇿', lang:'uz' },
  { code:'VE', name:{ fa:'ونزوئلا',ar:'فنزويلا',ur:'وینزویلا',en:'Venezuela',tr:'Venezuela',ru:'Венесуэла',az:'Venesuela',id:'Venezuela' }, flag:'🇻🇪', lang:'es' },
  { code:'VN', name:{ fa:'ویتنام',ar:'فيتنام',ur:'ویتنام',en:'Vietnam',tr:'Vietnam',ru:'Вьетнам',az:'Vyetnam',id:'Vietnam' }, flag:'🇻🇳', lang:'vi' },
  { code:'YE', name:{ fa:'یمن',ar:'اليمن',ur:'یمن',en:'Yemen',tr:'Yemen',ru:'Йемен',az:'Yəmən',id:'Yaman' }, flag:'🇾🇪', lang:'ar' },
  { code:'ZM', name:{ fa:'زامبیا',ar:'زامبيا',ur:'زامبیا',en:'Zambia',tr:'Zambiya',ru:'Замбия',az:'Zambiya',id:'Zambia' }, flag:'🇿🇲', lang:'en' },
  { code:'ZW', name:{ fa:'زیمبابوه',ar:'زيمبابوي',ur:'زمبابوے',en:'Zimbabwe',tr:'Zimbabve',ru:'Зимбабве',az:'Zimbabve',id:'Zimbabwe' }, flag:'🇿🇼', lang:'en' },
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
  const email   = document.getElementById('reg-email')?.value?.trim();

  let valid = true;

  if (!name) {
    document.getElementById('reg-name-err').style.display = 'block';
    document.getElementById('reg-name').style.borderColor = '#f87171';
    valid = false;
  } else {
    document.getElementById('reg-name-err').style.display = 'none';
  }


  if (!valid) return;

  /* ذخیره کاربر */
  const user = {
    id:        'u_' + Math.random().toString(36).slice(2, 10),
    name,
    email:     email || null,
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
