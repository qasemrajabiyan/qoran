/**
 * auth.js — سیستم احراز هویت برکت‌هاب
 * ورود و ثبت‌نام با OTP ایمیل
 */

import { i18n, t } from './i18n.js';

/* ── متون چندزبانه ──────────────────────────────────────── */
const AUTH_COPY = {
  login:      { fa:'ورود', ar:'تسجيل الدخول', ur:'لاگ ان', az:'Daxil ol', tr:'Giriş', ru:'Войти', en:'Login', id:'Masuk' },
  register:   { fa:'ثبت‌نام', ar:'التسجيل', ur:'رجسٹریشن', az:'Qeydiyyat', tr:'Kayıt Ol', ru:'Регистрация', en:'Register', id:'Daftar' },
  fullName:   { fa:'نام کامل', ar:'الاسم الكامل', ur:'پورا نام', az:'Tam adınız', tr:'Tam Adınız', ru:'Полное имя', en:'Full Name', id:'Nama Lengkap' },
  email:      { fa:'آدرس ایمیل', ar:'البريد الإلكتروني', ur:'ای میل ایڈریس', az:'E-poçt', tr:'E-posta', en:'Email', ru:'Эл. почта', id:'Email' },
  country:    { fa:'کشور (اختیاری)', ar:'الدولة (اختياري)', ur:'ملک (اختیاری)', az:'Ölkə (ixtiyari)', tr:'Ülke (İsteğe Bağlı)', ru:'Страна (необязательно)', en:'Country (Optional)', id:'Negara (Opsional)' },
  sendOtp:    { fa:'ارسال کد تایید', ar:'إرسال رمز التحقق', ur:'تصدیق کوڈ بھیجیں', az:'Doğrulama Kodu Göndər', tr:'Doğrulama Kodu Gönder', ru:'Отправить код', en:'Send Verification Code', id:'Kirim Kode Verifikasi' },
  verifyOtp:  { fa:'تایید کد', ar:'تأكيد الرمز', ur:'کوڈ تصدیق کریں', az:'Kodu təsdiqlə', tr:'Kodu Doğrula', ru:'Подтвердить код', en:'Verify Code', id:'Verifikasi Kode' },
  otpSent:    { fa:'کد به ایمیل شما ارسال شد', ar:'تم إرسال الرمز إلى بريدك', ur:'کوڈ آپ کے ای میل پر بھیجا گیا', az:'Kod e-poçtunuza göndərildi', tr:'Kod e-postanıza gönderildi', ru:'Код отправлен на вашу почту', en:'Code sent to your email', id:'Kode dikirim ke email Anda' },
  resendOtp:  { fa:'ارسال مجدد کد', ar:'إعادة إرسال الرمز', ur:'دوباره کوڈ بھیجیں', az:'Yenidən göndər', tr:'Yeniden Gönder', ru:'Отправить снова', en:'Resend Code', id:'Kirim Ulang Kode' },
  continueGoogle: { fa:'ادامه با گوگل', ar:'الاستمرار بحساب Google', ur:'گوگل سے جاری رکھیں', az:'Google ilə davam et', tr:'Google ile Devam Et', ru:'Войти через Google', en:'Continue with Google', id:'Lanjutkan dengan Google' },
  orEmail:    { fa:'یا با ایمیل', ar:'أو بالبريد الإلكتروني', ur:'یا ای میل سے', az:'Və ya e-poçtla', tr:'veya E-posta ile', ru:'или по Email', en:'or with Email', id:'atau dengan Email' },
  namePlaceholder: { fa:'مثال: علی محمدی', ar:'مثال: محمد أحمد', ur:'مثال: احمد علی', az:'örn: Əhməd Yılmaz', tr:'örn: Ahmet Yılmaz', ru:'напр: Иван Иванов', en:'e.g. John Smith', id:'cth. Ahmad Budi' },
  emailInvalid: { fa:'یک آدرس ایمیل معتبر وارد کنید', ar:'أدخل بريداً إلكترونياً صحيحاً', ur:'درست ای میل درج کریں', az:'Düzgün e-poçt daxil edin', tr:'Geçerli e-posta girin', ru:'Введите корректный email', en:'Enter a valid email', id:'Masukkan email yang valid' },
  nameRequired: { fa:'نام الزامی است', ar:'الاسم مطلوب', ur:'نام ضروری ہے', az:'Ad tələb olunur', tr:'Ad zorunludur', ru:'Имя обязательно', en:'Name is required', id:'Nama wajib diisi' },
  otpInvalid: { fa:'کد وارد شده اشتباه است', ar:'الرمز غير صحيح', ur:'غلط کوڈ', az:'Yanlış kod', tr:'Hatalı kod', ru:'Неверный код', en:'Invalid code', id:'Kode tidak valid' },
  welcomeBack: { fa:'خوش برگشتید', ar:'مرحباً بعودتك', ur:'واپسی پر خوش آمدید', az:'Xoş gəldiniz', tr:'Tekrar Hoş Geldiniz', ru:'С возвращением', en:'Welcome Back', id:'Selamat Datang Kembali' },
  visualTitle: { fa:'به خانواده برکت‌هاب خوش آمدید', ar:'مرحباً بك في عائلة بركت هاب', ur:'برکت ہاب خاندان میں خوش آمدید', az:'BarakatHub ailəsinə xoş gəldiniz', tr:'BarakatHub Ailesine Hoş Geldiniz', ru:'Добро пожаловать в BarakatHub', en:'Welcome to BarakatHub Family', id:'Selamat Datang di Keluarga BarakatHub' },
  visualDesc: { fa:'تدبر در قرآن، دعا، زیارت و ارتباط با کربلا ✨ همه در یک پلتفرم', ar:'التدبر في القرآن والدعاء والزيارة والتواصل مع كربلاء', ur:'قرآن تدبر، دعا، زیارت اور کربلا سے رابطہ', az:'Quran təfəkkürü, dua, ziyarət', tr:'Kuran tefekkürü, dua, ziyaret', ru:'Размышления над Кораном, молитвы, паломничество', en:'Quran reflection, prayer, pilgrimage ✨ all in one platform', id:'Refleksi Quran, doa, ziarah ✨ semua dalam satu platform' },
};

function tx(obj) {
  return obj[i18n.lang] ?? obj['fa'] ?? obj['en'] ?? '';
}

/* ── لیست کامل کشورها ──────────────────────────────────── */
const COUNTRIES = {
  'IQ': { fa:'عراق', ar:'العراق', ur:'عراق', az:'İraq', tr:'Irak', ru:'Ирак', en:'Iraq', id:'Irak', flag:'🇮🇶' },
  'IR': { fa:'ایران', ar:'إيران', ur:'ایران', az:'İran', tr:'İran', ru:'Иран', en:'Iran', id:'Iran', flag:'🇮🇷' },
  'PK': { fa:'پاکستان', ar:'باكستان', ur:'پاکستان', az:'Pakistan', tr:'Pakistan', ru:'Пакистан', en:'Pakistan', id:'Pakistan', flag:'🇵🇰' },
  'AZ': { fa:'آذربایجان', ar:'أذربيجان', ur:'آذربائیجان', az:'Azərbaycan', tr:'Azerbaycan', ru:'Азербайджан', en:'Azerbaijan', id:'Azerbaijan', flag:'🇦🇿' },
  'TR': { fa:'ترکیه', ar:'تركيا', ur:'ترکیہ', az:'Türkiyə', tr:'Türkiye', ru:'Турция', en:'Turkey', id:'Turki', flag:'🇹🇷' },
  'RU': { fa:'روسیه', ar:'روسيا', ur:'روس', az:'Rusiya', tr:'Rusya', ru:'Россия', en:'Russia', id:'Rusia', flag:'🇷🇺' },
  'AF': { fa:'افغانستان', ar:'أفغانستان', ur:'افغانستان', az:'Əfqanıstan', tr:'Afganistan', ru:'Афганистан', en:'Afghanistan', id:'Afghanistan', flag:'🇦🇫' },
  'TJ': { fa:'تاجیکستان', ar:'طاجيكستان', ur:'تاجکستان', az:'Tacikistan', tr:'Tacikistan', ru:'Таджикистан', en:'Tajikistan', id:'Tajikistan', flag:'🇹🇯' },
  'UZ': { fa:'ازبکستان', ar:'أوزبكستان', ur:'ازبکستان', az:'Özbəkistan', tr:'Özbekistan', ru:'Узбекистан', en:'Uzbekistan', id:'Uzbekistan', flag:'🇺🇿' },
  'SA': { fa:'عربستان سعودی', ar:'المملكة العربية السعودية', ur:'سعودی عرب', az:'Səudiyyə Ərəbistanı', tr:'Suudi Arabistan', ru:'Саудовская Аравия', en:'Saudi Arabia', id:'Arab Saudi', flag:'🇸🇦' },
  'AE': { fa:'امارات متحده عربی', ar:'الإمارات العربية المتحدة', ur:'متحدہ عرب امارات', az:'BƏƏ', tr:'BAE', ru:'ОАЭ', en:'UAE', id:'UEA', flag:'🇦🇪' },
  'KW': { fa:'کویت', ar:'الكويت', ur:'کویت', az:'Küveyt', tr:'Kuveyt', ru:'Кувейт', en:'Kuwait', id:'Kuwait', flag:'🇰🇼' },
  'QA': { fa:'قطر', ar:'قطر', ur:'قطر', az:'Qətər', tr:'Katar', ru:'Катар', en:'Qatar', id:'Qatar', flag:'🇶🇦' },
  'BH': { fa:'بحرین', ar:'البحرين', ur:'بحرین', az:'Bəhreyn', tr:'Bahreyn', ru:'Бахрейн', en:'Bahrain', id:'Bahrain', flag:'🇧🇭' },
  'OM': { fa:'عمان', ar:'عُمان', ur:'عمان', az:'Oman', tr:'Umman', ru:'Оман', en:'Oman', id:'Oman', flag:'🇴🇲' },
  'SY': { fa:'سوریه', ar:'سوريا', ur:'شام', az:'Suriya', tr:'Suriye', ru:'Сирия', en:'Syria', id:'Suriah', flag:'🇸🇾' },
  'LB': { fa:'لبنان', ar:'لبنان', ur:'لبنان', az:'Livan', tr:'Lübnan', ru:'Ливан', en:'Lebanon', id:'Lebanon', flag:'🇱🇧' },
  'JO': { fa:'اردن', ar:'الأردن', ur:'اردن', az:'Ürdün', tr:'Ürdün', ru:'Иордания', en:'Jordan', id:'Yordania', flag:'🇯🇴' },
  'EG': { fa:'مصر', ar:'مصر', ur:'مصر', az:'Misir', tr:'Mısır', ru:'Египет', en:'Egypt', id:'Mesir', flag:'🇪🇬' },
  'MA': { fa:'مراکش', ar:'المغرب', ur:'مراکش', az:'Mərakeş', tr:'Fas', ru:'Марокко', en:'Morocco', id:'Maroko', flag:'🇲🇦' },
  'AL': { fa:'آلبانی', ar:'ألبانيا', ur:'البانیہ', az:'Albaniya', tr:'Arnavutluk', ru:'Албания', en:'Albania', id:'Albania', flag:'🇦🇱' },
  'DZ': { fa:'الجزایر', ar:'الجزائر', ur:'الجزائر', az:'Əlcəzair', tr:'Cezayir', ru:'Алжир', en:'Algeria', id:'Aljazair', flag:'🇩🇿' },
  'AD': { fa:'آندورا', ar:'أندورا', ur:'اندورا', az:'Andorra', tr:'Andorra', ru:'Андорра', en:'Andorra', id:'Andorra', flag:'🇦🇩' },
  'AO': { fa:'آنگولا', ar:'أنغولا', ur:'انگولا', az:'Angola', tr:'Angola', ru:'Ангола', en:'Angola', id:'Angola', flag:'🇦🇴' },
  'AR': { fa:'آرژانتین', ar:'الأرجنتين', ur:'ارجنٹینا', az:'Argentina', tr:'Arjantin', ru:'Аргентина', en:'Argentina', id:'Argentina', flag:'🇦🇷' },
  'AM': { fa:'ارمنستان', ar:'أرمينيا', ur:'آرمینیا', az:'Ermənistan', tr:'Ermenistan', ru:'Армения', en:'Armenia', id:'Armenia', flag:'🇦🇲' },
  'AU': { fa:'استرالیا', ar:'أستراليا', ur:'آسٹریلیا', az:'Avstraliya', tr:'Avustralya', ru:'Австралия', en:'Australia', id:'Australia', flag:'🇦🇺' },
  'AT': { fa:'اتریش', ar:'النمسا', ur:'آسٹریا', az:'Avstriya', tr:'Avusturya', ru:'Австрия', en:'Austria', id:'Austria', flag:'🇦🇹' },
  'BD': { fa:'بنگلادش', ar:'بنغلاديش', ur:'بنگلہ دیش', az:'Banqladeş', tr:'Bangladeş', ru:'Бангладеш', en:'Bangladesh', id:'Bangladesh', flag:'🇧🇩' },
  'BY': { fa:'بلاروس', ar:'بيلاروسيا', ur:'بیلاروس', az:'Belarus', tr:'Beyaz Rusya', ru:'Беларусь', en:'Belarus', id:'Belarus', flag:'🇧🇾' },
  'BE': { fa:'بلژیک', ar:'بلجيكا', ur:'بیلجیم', az:'Belçika', tr:'Belçika', ru:'Бельгия', en:'Belgium', id:'Belgia', flag:'🇧🇪' },
  'BJ': { fa:'بنین', ar:'بنين', ur:'بنین', az:'Benin', tr:'Benin', ru:'Бенин', en:'Benin', id:'Benin', flag:'🇧🇯' },
  'BO': { fa:'بولیوی', ar:'بوليفيا', ur:'بولیویا', az:'Boliviya', tr:'Bolivya', ru:'Боливия', en:'Bolivia', id:'Bolivia', flag:'🇧🇴' },
  'BA': { fa:'بوسنی', ar:'البوسنة والهرسك', ur:'بوسنیا', az:'Bosniya', tr:'Bosna Hersek', ru:'Босния', en:'Bosnia', id:'Bosnia', flag:'🇧🇦' },
  'BR': { fa:'برزیل', ar:'البرازيل', ur:'برازیل', az:'Braziliya', tr:'Brezilya', ru:'Бразилия', en:'Brazil', id:'Brasil', flag:'🇧🇷' },
  'BG': { fa:'بلغارستان', ar:'بلغاريا', ur:'بلغاریہ', az:'Bolqarıstan', tr:'Bulgaristan', ru:'Болгария', en:'Bulgaria', id:'Bulgaria', flag:'🇧🇬' },
  'BF': { fa:'بورکینافاسو', ar:'بوركينا فاسو', ur:'برکینا فاسو', az:'Burkina Faso', tr:'Burkina Faso', ru:'Буркина-Фасо', en:'Burkina Faso', id:'Burkina Faso', flag:'🇧🇫' },
  'KH': { fa:'کامبوج', ar:'كمبوديا', ur:'کمبوڈیا', az:'Kamboca', tr:'Kamboçya', ru:'Камбоджа', en:'Cambodia', id:'Kamboja', flag:'🇰🇭' },
  'CM': { fa:'کامرون', ar:'الكاميرون', ur:'کیمرون', az:'Kamerun', tr:'Kamerun', ru:'Камерун', en:'Cameroon', id:'Kamerun', flag:'🇨🇲' },
  'CA': { fa:'کانادا', ar:'كندا', ur:'کینیڈا', az:'Kanada', tr:'Kanada', ru:'Канада', en:'Canada', id:'Kanada', flag:'🇨🇦' },
  'TD': { fa:'چاد', ar:'تشاد', ur:'چاڈ', az:'Çad', tr:'Çad', ru:'Чад', en:'Chad', id:'Chad', flag:'🇹🇩' },
  'CL': { fa:'شیلی', ar:'تشيلي', ur:'چلی', az:'Çili', tr:'Şili', ru:'Чили', en:'Chile', id:'Chili', flag:'🇨🇱' },
  'CN': { fa:'چین', ar:'الصين', ur:'چین', az:'Çin', tr:'Çin', ru:'Китай', en:'China', id:'China', flag:'🇨🇳' },
  'CO': { fa:'کلمبیا', ar:'كولومبيا', ur:'کولمبیا', az:'Kolumbiya', tr:'Kolombiya', ru:'Колумбия', en:'Colombia', id:'Kolombia', flag:'🇨🇴' },
  'CD': { fa:'کنگو', ar:'الكونغو الديمقراطية', ur:'کانگو', az:'DR Konqo', tr:'DR Kongo', ru:'ДР Конго', en:'DR Congo', id:'Kongo', flag:'🇨🇩' },
  'CR': { fa:'کاستاریکا', ar:'كوستاريكا', ur:'کوسٹاریکا', az:'Kosta Rika', tr:'Kosta Rika', ru:'Коста-Рика', en:'Costa Rica', id:'Kosta Rika', flag:'🇨🇷' },
  'HR': { fa:'کرواسی', ar:'كرواتيا', ur:'کروشیا', az:'Xorvatiya', tr:'Hırvatistan', ru:'Хорватия', en:'Croatia', id:'Kroasia', flag:'🇭🇷' },
  'CU': { fa:'کوبا', ar:'كوبا', ur:'کیوبا', az:'Kuba', tr:'Küba', ru:'Куба', en:'Cuba', id:'Kuba', flag:'🇨🇺' },
  'CY': { fa:'قبرس', ar:'قبرص', ur:'قبرص', az:'Kipr', tr:'Kıbrıs', ru:'Кипр', en:'Cyprus', id:'Siprus', flag:'🇨🇾' },
  'CZ': { fa:'چک', ar:'التشيك', ur:'چیک', az:'Çexiya', tr:'Çekya', ru:'Чехия', en:'Czech Republic', id:'Ceko', flag:'🇨🇿' },
  'DK': { fa:'دانمارک', ar:'الدنمارك', ur:'ڈنمارک', az:'Danimarka', tr:'Danimarka', ru:'Дания', en:'Denmark', id:'Denmark', flag:'🇩🇰' },
  'DO': { fa:'دومینیکن', ar:'جمهورية الدومينيكان', ur:'ڈومینیکن', az:'Dominikan', tr:'Dominik', ru:'Доминиканa', en:'Dominican Rep.', id:'Dominika', flag:'🇩🇴' },
  'EC': { fa:'اکوادور', ar:'الإكوادور', ur:'ایکواڈور', az:'Ekvador', tr:'Ekvador', ru:'Эквадор', en:'Ecuador', id:'Ekuador', flag:'🇪🇨' },
  'SV': { fa:'السالوادور', ar:'السلفادور', ur:'ایل سیلواڈور', az:'Salvador', tr:'El Salvador', ru:'Сальвадор', en:'El Salvador', id:'El Salvador', flag:'🇸🇻' },
  'ET': { fa:'اتیوپی', ar:'إثيوبيا', ur:'ایتھوپیا', az:'Efiopiya', tr:'Etiyopya', ru:'Эфиопия', en:'Ethiopia', id:'Etiopia', flag:'🇪🇹' },
  'FI': { fa:'فنلاند', ar:'فنلندا', ur:'فن لینڈ', az:'Finlandiya', tr:'Finlandiya', ru:'Финляндия', en:'Finland', id:'Finlandia', flag:'🇫🇮' },
  'FR': { fa:'فرانسه', ar:'فرنسا', ur:'فرانس', az:'Fransa', tr:'Fransa', ru:'Франция', en:'France', id:'Prancis', flag:'🇫🇷' },
  'GE': { fa:'گرجستان', ar:'جورجيا', ur:'جارجیا', az:'Gürcüstan', tr:'Gürcistan', ru:'Грузия', en:'Georgia', id:'Georgia', flag:'🇬🇪' },
  'DE': { fa:'آلمان', ar:'ألمانيا', ur:'جرمنی', az:'Almaniya', tr:'Almanya', ru:'Германия', en:'Germany', id:'Jerman', flag:'🇩🇪' },
  'GH': { fa:'غنا', ar:'غانا', ur:'گھانا', az:'Qana', tr:'Gana', ru:'Гана', en:'Ghana', id:'Ghana', flag:'🇬🇭' },
  'GR': { fa:'یونان', ar:'اليونان', ur:'یونان', az:'Yunanıstan', tr:'Yunanistan', ru:'Греция', en:'Greece', id:'Yunani', flag:'🇬🇷' },
  'GT': { fa:'گواتمالا', ar:'غواتيمالا', ur:'گواٹیمالا', az:'Qvatemala', tr:'Guatemala', ru:'Гватемала', en:'Guatemala', id:'Guatemala', flag:'🇬🇹' },
  'HN': { fa:'هندوراس', ar:'هندوراس', ur:'ہونڈراس', az:'Honduras', tr:'Honduras', ru:'Гондурас', en:'Honduras', id:'Honduras', flag:'🇭🇳' },
  'HK': { fa:'هنگ‌کنگ', ar:'هونج كونج', ur:'ہانگ کانگ', az:'Honq Konq', tr:'Hong Kong', ru:'Гонконг', en:'Hong Kong', id:'Hong Kong', flag:'🇭🇰' },
  'HU': { fa:'مجارستان', ar:'المجر', ur:'ہنگری', az:'Macarıstan', tr:'Macaristan', ru:'Венгрия', en:'Hungary', id:'Hungaria', flag:'🇭🇺' },
  'IS': { fa:'ایسلند', ar:'آيسلندا', ur:'آئس لینڈ', az:'İslandiya', tr:'İzlanda', ru:'Исландия', en:'Iceland', id:'Islandia', flag:'🇮🇸' },
  'IN': { fa:'هند', ar:'الهند', ur:'ہندوستان', az:'Hindistan', tr:'Hindistan', ru:'Индия', en:'India', id:'India', flag:'🇮🇳' },
  'ID': { fa:'اندونزی', ar:'إندونيسيا', ur:'انڈونیشیا', az:'İndoneziya', tr:'Endonezya', ru:'Индонезия', en:'Indonesia', id:'Indonesia', flag:'🇮🇩' },
  'IE': { fa:'ایرلند', ar:'أيرلندا', ur:'آئرلینڈ', az:'İrlandiya', tr:'İrlanda', ru:'Ирландия', en:'Ireland', id:'Irlandia', flag:'🇮🇪' },
  'IL': { fa:'اسرائیل', ar:'إسرائيل', ur:'اسرائیل', az:'İsrail', tr:'İsrail', ru:'Израиль', en:'Israel', id:'Israel', flag:'🇮🇱' },
  'IT': { fa:'ایتالیا', ar:'إيطاليا', ur:'اٹلی', az:'İtaliya', tr:'İtalya', ru:'Италия', en:'Italy', id:'Italia', flag:'🇮🇹' },
  'JM': { fa:'جامائیکا', ar:'جامايكا', ur:'جمیکا', az:'Yamayka', tr:'Jamaika', ru:'Ямайка', en:'Jamaica', id:'Jamaika', flag:'🇯🇲' },
  'JP': { fa:'ژاپن', ar:'اليابان', ur:'جاپان', az:'Yaponiya', tr:'Japonya', ru:'Япония', en:'Japan', id:'Jepang', flag:'🇯🇵' },
  'KZ': { fa:'قزاقستان', ar:'كازاخستان', ur:'قازقستان', az:'Qazaxıstan', tr:'Kazakistan', ru:'Казахстан', en:'Kazakhstan', id:'Kazakhstan', flag:'🇰🇿' },
  'KE': { fa:'کنیا', ar:'كينيا', ur:'کینیا', az:'Keniya', tr:'Kenya', ru:'Кения', en:'Kenya', id:'Kenya', flag:'🇰🇪' },
  'KG': { fa:'قرقیزستان', ar:'قيرغيزستان', ur:'قرغیزستان', az:'Qırğızıstan', tr:'Kırgızistan', ru:'Кыргызстан', en:'Kyrgyzstan', id:'Kirgistan', flag:'🇰🇬' },
  'LA': { fa:'لائوس', ar:'لاوس', ur:'لاؤس', az:'Laos', tr:'Laos', ru:'Лаос', en:'Laos', id:'Laos', flag:'🇱🇦' },
  'LV': { fa:'لتونی', ar:'لاتفيا', ur:'لٹویا', az:'Latviya', tr:'Letonya', ru:'Латвия', en:'Latvia', id:'Latvia', flag:'🇱🇻' },
  'LY': { fa:'لیبی', ar:'ليبيا', ur:'لیبیا', az:'Liviya', tr:'Libya', ru:'Ливия', en:'Libya', id:'Libya', flag:'🇱🇾' },
  'LT': { fa:'لیتوانی', ar:'ليتوانيا', ur:'لتھوانیا', az:'Litva', tr:'Litvanya', ru:'Литва', en:'Lithuania', id:'Lituania', flag:'🇱🇹' },
  'LU': { fa:'لوکزامبورگ', ar:'لوكسمبورغ', ur:'لکسمبرگ', az:'Lüksemburq', tr:'Lüksemburg', ru:'Люксембург', en:'Luxembourg', id:'Luksemburg', flag:'🇱🇺' },
  'MY': { fa:'مالزی', ar:'ماليزيا', ur:'ملائیشیا', az:'Malayziya', tr:'Malezya', ru:'Малайзия', en:'Malaysia', id:'Malaysia', flag:'🇲🇾' },
  'MV': { fa:'مالدیو', ar:'المالديف', ur:'مالدیپ', az:'Maldiv', tr:'Maldivler', ru:'Мальдивы', en:'Maldives', id:'Maladewa', flag:'🇲🇻' },
  'ML': { fa:'مالی', ar:'مالي', ur:'مالی', az:'Mali', tr:'Mali', ru:'Мали', en:'Mali', id:'Mali', flag:'🇲🇱' },
  'MT': { fa:'مالت', ar:'مالطا', ur:'مالٹا', az:'Malta', tr:'Malta', ru:'Мальта', en:'Malta', id:'Malta', flag:'🇲🇹' },
  'MR': { fa:'موریتانی', ar:'موريتانيا', ur:'موریتانیا', az:'Mavritaniya', tr:'Moritanya', ru:'Мавритания', en:'Mauritania', id:'Mauritania', flag:'🇲🇷' },
  'MX': { fa:'مکزیک', ar:'المكسيك', ur:'میکسیکو', az:'Meksika', tr:'Meksika', ru:'Мексика', en:'Mexico', id:'Meksiko', flag:'🇲🇽' },
  'MD': { fa:'مولداوی', ar:'مولدوفا', ur:'مالڈووا', az:'Moldova', tr:'Moldova', ru:'Молдова', en:'Moldova', id:'Moldova', flag:'🇲🇩' },
  'MN': { fa:'مغولستان', ar:'منغوليا', ur:'منگولیا', az:'Monqoliya', tr:'Moğolistan', ru:'Монголия', en:'Mongolia', id:'Mongolia', flag:'🇲🇳' },
  'ME': { fa:'مونته‌نگرو', ar:'الجبل الأسود', ur:'مونٹی نیگرو', az:'Monteneqro', tr:'Karadağ', ru:'Черногория', en:'Montenegro', id:'Montenegro', flag:'🇲🇪' },
  'MZ': { fa:'موزامبیک', ar:'موزمبيق', ur:'موزمبیق', az:'Mozambik', tr:'Mozambik', ru:'Мозамбик', en:'Mozambique', id:'Mozambik', flag:'🇲🇿' },
  'MM': { fa:'میانمار', ar:'ميانمار', ur:'میانمار', az:'Myanma', tr:'Myanmar', ru:'Мьянма', en:'Myanmar', id:'Myanmar', flag:'🇲🇲' },
  'NP': { fa:'نپال', ar:'نيبال', ur:'نیپال', az:'Nepal', tr:'Nepal', ru:'Непал', en:'Nepal', id:'Nepal', flag:'🇳🇵' },
  'NL': { fa:'هلند', ar:'هولندا', ur:'نیدرلینڈ', az:'Niderland', tr:'Hollanda', ru:'Нидерланды', en:'Netherlands', id:'Belanda', flag:'🇳🇱' },
  'NZ': { fa:'نیوزیلند', ar:'نيوزيلندا', ur:'نیوزی لینڈ', az:'Yeni Zelandiya', tr:'Yeni Zelanda', ru:'Новая Зеландия', en:'New Zealand', id:'Selandia Baru', flag:'🇳🇿' },
  'NI': { fa:'نیکاراگوئه', ar:'نيكاراغوا', ur:'نکاراگوا', az:'Nikaraqua', tr:'Nikaragua', ru:'Никарагуа', en:'Nicaragua', id:'Nikaragua', flag:'🇳🇮' },
  'NE': { fa:'نیجر', ar:'النيجر', ur:'نائجر', az:'Niger', tr:'Nijer', ru:'Нигер', en:'Niger', id:'Niger', flag:'🇳🇪' },
  'NG': { fa:'نیجریه', ar:'نيجيريا', ur:'نائجیریا', az:'Nigeriya', tr:'Nijerya', ru:'Нигерия', en:'Nigeria', id:'Nigeria', flag:'🇳🇬' },
  'NO': { fa:'نروژ', ar:'النرويج', ur:'ناروے', az:'Norvec', tr:'Norveç', ru:'Норвегия', en:'Norway', id:'Norwegia', flag:'🇳🇴' },
  'PS': { fa:'فلسطین', ar:'فلسطين', ur:'فلسطین', az:'Fələstin', tr:'Filistin', ru:'Палестина', en:'Palestine', id:'Palestina', flag:'🇵🇸' },
  'PA': { fa:'پاناما', ar:'بنما', ur:'پانامہ', az:'Panama', tr:'Panama', ru:'Панама', en:'Panama', id:'Panama', flag:'🇵🇦' },
  'PY': { fa:'پاراگوئه', ar:'باراغواي', ur:'پیراگوئے', az:'Paraqvay', tr:'Paraguay', ru:'Парагвай', en:'Paraguay', id:'Paraguay', flag:'🇵🇾' },
  'PE': { fa:'پرو', ar:'بيرو', ur:'پیرو', az:'Peru', tr:'Peru', ru:'Перу', en:'Peru', id:'Peru', flag:'🇵🇪' },
  'PH': { fa:'فیلیپین', ar:'الفلبين', ur:'فلپائن', az:'Filippin', tr:'Filipinler', ru:'Филиппины', en:'Philippines', id:'Filipina', flag:'🇵🇭' },
  'PL': { fa:'لهستان', ar:'بولندا', ur:'پولینڈ', az:'Polşa', tr:'Polonya', ru:'Польша', en:'Poland', id:'Polandia', flag:'🇵🇱' },
  'PT': { fa:'پرتغال', ar:'البرتغال', ur:'پرتگال', az:'Portuqaliya', tr:'Portekiz', ru:'Португалия', en:'Portugal', id:'Portugal', flag:'🇵🇹' },
  'RO': { fa:'رومانی', ar:'رومانيا', ur:'رومانیہ', az:'Rumıniya', tr:'Romanya', ru:'Румыния', en:'Romania', id:'Rumania', flag:'🇷🇴' },
  'SN': { fa:'سنگال', ar:'السنغال', ur:'سینیگال', az:'Seneqal', tr:'Senegal', ru:'Сенегал', en:'Senegal', id:'Senegal', flag:'🇸🇳' },
  'RS': { fa:'صربستان', ar:'صربيا', ur:'سربیا', az:'Serbiya', tr:'Sırbistan', ru:'Сербия', en:'Serbia', id:'Serbia', flag:'🇷🇸' },
  'SG': { fa:'سنگاپور', ar:'سنغافورة', ur:'سنگاپور', az:'Sinqapur', tr:'Singapur', ru:'Сингапур', en:'Singapore', id:'Singapura', flag:'🇸🇬' },
  'SK': { fa:'اسلواکی', ar:'سلوفاكيا', ur:'سلوواکیا', az:'Slovakiya', tr:'Slovakya', ru:'Словакия', en:'Slovakia', id:'Slovakia', flag:'🇸🇰' },
  'SI': { fa:'اسلوونی', ar:'سلوفينيا', ur:'سلووینیا', az:'Sloveniya', tr:'Slovenya', ru:'Словения', en:'Slovenia', id:'Slovenia', flag:'🇸🇮' },
  'SO': { fa:'سومالی', ar:'الصومال', ur:'صومالیہ', az:'Somali', tr:'Somali', ru:'Сомали', en:'Somalia', id:'Somalia', flag:'🇸🇴' },
  'ZA': { fa:'آفریقای جنوبی', ar:'جنوب أفريقيا', ur:'جنوبی افریقہ', az:'Cənubi Afrika', tr:'Güney Afrika', ru:'ЮАР', en:'South Africa', id:'Afrika Selatan', flag:'🇿🇦' },
  'KR': { fa:'کره جنوبی', ar:'كوريا الجنوبية', ur:'جنوبی کوریا', az:'Cənubi Koreya', tr:'Güney Kore', ru:'Южная Корея', en:'South Korea', id:'Korea Selatan', flag:'🇰🇷' },
  'ES': { fa:'اسپانیا', ar:'إسبانيا', ur:'اسپین', az:'İspaniya', tr:'İspanya', ru:'Испания', en:'Spain', id:'Spanyol', flag:'🇪🇸' },
  'LK': { fa:'سری‌لانکا', ar:'سريلانكا', ur:'سری لنکا', az:'Şri Lanka', tr:'Sri Lanka', ru:'Шри-Ланка', en:'Sri Lanka', id:'Sri Lanka', flag:'🇱🇰' },
  'SD': { fa:'سودان', ar:'السودان', ur:'سوڈان', az:'Sudan', tr:'Sudan', ru:'Судан', en:'Sudan', id:'Sudan', flag:'🇸🇩' },
  'SE': { fa:'سوئد', ar:'السويد', ur:'سویڈن', az:'İsveç', tr:'İsveç', ru:'Швеция', en:'Sweden', id:'Swedia', flag:'🇸🇪' },
  'CH': { fa:'سوئیس', ar:'سويسرا', ur:'سوئٹزرلینڈ', az:'İsveçrə', tr:'İsviçre', ru:'Швейцария', en:'Switzerland', id:'Swiss', flag:'🇨🇭' },
  'TW': { fa:'تایوان', ar:'تايوان', ur:'تائیوان', az:'Tayvan', tr:'Tayvan', ru:'Тайвань', en:'Taiwan', id:'Taiwan', flag:'🇹🇼' },
  'TZ': { fa:'تانزانیا', ar:'تنزانيا', ur:'تنزانیہ', az:'Tanzaniya', tr:'Tanzanya', ru:'Танзания', en:'Tanzania', id:'Tanzania', flag:'🇹🇿' },
  'TH': { fa:'تایلند', ar:'تايلاند', ur:'تھائی لینڈ', az:'Tailand', tr:'Tayland', ru:'Таиланд', en:'Thailand', id:'Thailand', flag:'🇹🇭' },
  'TN': { fa:'تونس', ar:'تونس', ur:'تیونس', az:'Tunis', tr:'Tunus', ru:'Тунис', en:'Tunisia', id:'Tunisia', flag:'🇹🇳' },
  'TM': { fa:'ترکمنستان', ar:'تركمانستان', ur:'ترکمانستان', az:'Türkmənistan', tr:'Türkmenistan', ru:'Туркменистан', en:'Turkmenistan', id:'Turkmenistan', flag:'🇹🇲' },
  'UG': { fa:'اوگاندا', ar:'أوغندا', ur:'یوگنڈا', az:'Uqanda', tr:'Uganda', ru:'Уганда', en:'Uganda', id:'Uganda', flag:'🇺🇬' },
  'UA': { fa:'اوکراین', ar:'أوكرانيا', ur:'یوکرین', az:'Ukrayna', tr:'Ukrayna', ru:'Украина', en:'Ukraine', id:'Ukraina', flag:'🇺🇦' },
  'GB': { fa:'بریتانیا', ar:'المملكة المتحدة', ur:'برطانیہ', az:'Böyük Britaniya', tr:'İngiltere', ru:'Великобритания', en:'United Kingdom', id:'Inggris', flag:'🇬🇧' },
  'US': { fa:'آمریکا', ar:'الولايات المتحدة', ur:'امریکا', az:'ABŞ', tr:'ABD', ru:'США', en:'United States', id:'Amerika Serikat', flag:'🇺🇸' },
  'UY': { fa:'اروگوئه', ar:'أوروغواي', ur:'یوروگوائے', az:'Uruqvay', tr:'Uruguay', ru:'Уругвай', en:'Uruguay', id:'Uruguay', flag:'🇺🇾' },
  'VE': { fa:'ونزوئلا', ar:'فنزويلا', ur:'وینزویلا', az:'Venesuela', tr:'Venezuela', ru:'Венесуэла', en:'Venezuela', id:'Venezuela', flag:'🇻🇪' },
  'VN': { fa:'ویتنام', ar:'فيتنام', ur:'ویتنام', az:'Vyetnam', tr:'Vietnam', ru:'Вьетнам', en:'Vietnam', id:'Vietnam', flag:'🇻🇳' },
  'YE': { fa:'یمن', ar:'اليمن', ur:'یمن', az:'Yəmən', tr:'Yemen', ru:'Йемен', en:'Yemen', id:'Yaman', flag:'🇾🇪' },
  'ZM': { fa:'زامبیا', ar:'زامبيا', ur:'زامبیا', az:'Zambiya', tr:'Zambiya', ru:'Замбия', en:'Zambia', id:'Zambia', flag:'🇿🇲' },
  'ZW': { fa:'زیمبابوه', ar:'زيمبابوي', ur:'زمبابوے', az:'Zimbabve', tr:'Zimbabve', ru:'Зимбабве', en:'Zimbabwe', id:'Zimbabwe', flag:'🇿🇼' },
};

/* کشورهای اولویت‌دار */
const PRIORITY = ['IQ','IR','PK','AZ','TR','RU','AF','TJ','UZ','SA','AE','KW','QA','BH','OM','SY','LB','JO','EG','MA'];

function buildCountryOptions() {
  const lang = (typeof i18n !== 'undefined' ? i18n.lang : null) || document.documentElement.lang || 'en';
  const rest = Object.keys(COUNTRIES)
    .filter(c => !PRIORITY.includes(c))
    .sort((a, b) => (COUNTRIES[a][lang] || COUNTRIES[a].en).localeCompare(COUNTRIES[b][lang] || COUNTRIES[b].en));
  return [...PRIORITY, ...rest]
    .map(code => {
      const c = COUNTRIES[code];
      const name = c[lang] || c.en;
      return `<option value="${code}">${c.flag} ${name}</option>`;
    }).join('');
}

/* ── مدیریت وضعیت احراز هویت ───────────────────────────── */
export const AuthState = {
  getUser() {
    try { return JSON.parse(localStorage.getItem('mh_user') || 'null'); } catch { return null; }
  },
  setUser(u) {
    try { localStorage.setItem('mh_user', JSON.stringify(u)); } catch {}
  },
  getToken() {
    try { return localStorage.getItem('mh_token') || null; } catch { return null; }
  },
  setToken(t) {
    try { localStorage.setItem('mh_token', t); } catch {}
  },
  clear() {
    try { localStorage.removeItem('mh_user'); localStorage.removeItem('mh_token'); } catch {}
  },
  isLoggedIn() {
    return !!this.getToken() && !!this.getUser();
  }
};

/* ── تایمر OTP ───────────────────────────────────────────── */
class OTPTimer {
  constructor(seconds, onTick, onDone) {
    this._remaining = seconds;
    this._onTick = onTick;
    this._onDone = onDone;
    this._interval = null;
  }
  start() {
    this._onTick(this._remaining);
    this._interval = setInterval(() => {
      this._remaining--;
      this._onTick(this._remaining);
      if (this._remaining <= 0) { this.stop(); this._onDone(); }
    }, 1000);
  }
  stop() { clearInterval(this._interval); }
  reset(s = 120) { this.stop(); this._remaining = s; this.start(); }
  format() {
    const m = Math.floor(this._remaining / 60).toString().padStart(2, '0');
    const s = (this._remaining % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }
}

/* ── ورودی‌های OTP ───────────────────────────────────────── */
function initOTPInputs(container, onComplete) {
  const inputs = container.querySelectorAll('.otp-input');
  inputs.forEach((inp, i) => {
    inp.addEventListener('input', e => {
      const val = e.target.value.replace(/\D/g, '');
      e.target.value = val.slice(-1);
      if (val) {
        inp.classList.add('filled');
        if (i < inputs.length - 1) inputs[i + 1].focus();
      } else {
        inp.classList.remove('filled');
      }
      const code = Array.from(inputs).map(x => x.value).join('');
      if (code.length === 6) onComplete(code);
    });
    inp.addEventListener('keydown', e => {
      if (e.key === 'Backspace' && !inp.value && i > 0) {
        inputs[i - 1].focus();
        inputs[i - 1].value = '';
        inputs[i - 1].classList.remove('filled');
      }
      if (e.key === 'ArrowLeft' && i > 0) inputs[i - 1].focus();
      if (e.key === 'ArrowRight' && i < inputs.length - 1) inputs[i + 1].focus();
    });
    inp.addEventListener('paste', e => {
      e.preventDefault();
      const text = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '').slice(0, 6);
      text.split('').forEach((ch, j) => {
        if (inputs[j]) { inputs[j].value = ch; inputs[j].classList.add('filled'); }
      });
      if (text.length === 6) onComplete(text);
    });
  });
  inputs[0]?.focus();
}

/* ── رندر صفحه احراز هویت ───────────────────────────────── */
export function renderAuthPage(root) {
  if (!root) return;
  if (AuthState.isLoggedIn()) { window.location.href = '/profile.html'; return; }

  let mode = 'login';
  let step = 'form';
  let email = '';
  let name = '';
  let timer = null;

  function render() {
    root.innerHTML = buildLayout(step === 'form' ? buildForm() : buildOTP());
    if (step === 'form') attachFormEvents();
    else attachOTPEvents();
  }

  function buildLayout(inner) {
    return `
<div class="auth-page">
  <div class="auth-visual">
    <div class="auth-visual__pattern" aria-hidden="true"></div>
    <div class="auth-visual__content">
      <span class="auth-visual__icon" aria-hidden="true">🕌</span>
      <h2 class="auth-visual__title">${tx(AUTH_COPY.visualTitle)}</h2>
      <p class="auth-visual__desc">${tx(AUTH_COPY.visualDesc)}</p>
      <div class="auth-visual__stats" aria-label="آمار">
        <div class="auth-visual__stat"><span class="auth-visual__stat-num">1234+</span><span class="auth-visual__stat-lbl">${tx({fa:'مقاله',ar:'مقالة',en:'Articles',tr:'Makale',ru:'Статья',az:'Məqalə',ur:'مقالے',id:'Artikel'})}</span></div>
        <div class="auth-visual__stat"><span class="auth-visual__stat-num">8</span><span class="auth-visual__stat-lbl">${tx({fa:'زبان',ar:'لغة',en:'Languages',tr:'Dil',ru:'Языки',az:'Dil',ur:'زبانیں',id:'Bahasa'})}</span></div>
        <div class="auth-visual__stat"><span class="auth-visual__stat-num">52K</span><span class="auth-visual__stat-lbl">${tx({fa:'کاربر',ar:'المستخدمون',en:'Users',tr:'Kullanıcı',ru:'Польз.',az:'İstifadəçi',ur:'صارفین',id:'Pengguna'})}</span></div>
      </div>
    </div>
  </div>
  <div class="auth-form-side">
    <div class="auth-card">
      <a href="/" class="auth-card__logo" aria-label="برکت‌هاب">
        <svg width="36" height="36" viewBox="0 0 32 32" fill="none" aria-hidden="true">
          <rect width="32" height="32" rx="8" fill="var(--color-primary-500)"/>
          <path d="M8 22V10l8 6 8-6v12" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span class="auth-card__logo-text">برکت‌هاب</span>
      </a>
      ${inner}
    </div>
  </div>
</div>`;
  }

  function buildForm() {
    return `
<div class="auth-tabs" role="tablist">
  <button class="auth-tab ${mode==='login'?'auth-tab--active':''}" role="tab" aria-selected="${mode==='login'}" id="tab-login" data-mode="login">${tx(AUTH_COPY.login)}</button>
  <button class="auth-tab ${mode==='register'?'auth-tab--active':''}" role="tab" aria-selected="${mode==='register'}" id="tab-register" data-mode="register">${tx(AUTH_COPY.register)}</button>
</div>
<h1 class="auth-card__heading">${mode==='login'?tx(AUTH_COPY.welcomeBack):tx(AUTH_COPY.register)}</h1>
<p class="auth-card__sub">${mode==='login'?tx({fa:'خوش برگشتید 🌙',ar:'مرحباً بعودتك 🌙',en:'Welcome back 🌙',tr:'Tekrar hoş geldiniz 🌙',ru:'С возвращением 🌙',az:'Xoş gəldiniz 🌙',ur:'واپسی پر خوش آمدید 🌙',id:'Selamat Datang Kembali 🌙'}):tx({fa:'حساب رایگان بسازید',ar:'أنشئ حساباً مجانياً',en:'Create a free account',tr:'Ücretsiz hesap oluşturun',ru:'Создайте бесплатный аккаунт',az:'Pulsuz hesab yaradın',ur:'مفت اکاؤنٹ بنائیں',id:'Buat akun gratis'})}</p>

<button class="auth-google-btn" id="google-btn" type="button">
  <svg width="22" height="22" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
  </svg>
  ${tx(AUTH_COPY.continueGoogle)}
</button>

<div class="auth-divider" aria-hidden="true"><span>${tx(AUTH_COPY.orEmail)}</span></div>

${mode==='register'?`
<div class="auth-field">
  <label class="auth-label" for="auth-name">${tx(AUTH_COPY.fullName)} *</label>
  <input class="auth-input" id="auth-name" type="text" placeholder="${tx(AUTH_COPY.namePlaceholder)}" autocomplete="name" value="${name}" aria-required="true"/>
  <div class="auth-error-msg" id="name-error" style="display:none" role="alert"><span>${tx(AUTH_COPY.nameRequired)}</span></div>
</div>`:''}

<div class="auth-field">
  <label class="auth-label" for="auth-email">${tx(AUTH_COPY.email)} *</label>
  <input class="auth-input" id="auth-email" type="email" placeholder="example@email.com" autocomplete="email" value="${email}" dir="ltr" aria-required="true"/>
  <div class="auth-error-msg" id="email-error" style="display:none" role="alert"><span>${tx(AUTH_COPY.emailInvalid)}</span></div>
</div>

${mode==='register'?`
<div class="auth-field">
  <label class="auth-label" for="auth-country">${tx(AUTH_COPY.country)}</label>
  <select class="auth-input" id="auth-country" autocomplete="country">
    <option value="">✤ ${tx({fa:'کشور خود را انتخاب کنید',ar:'اختر دولتك',en:'Select country',tr:'Ülke seçin',ru:'Выберите страну',az:'Ölkəni seçin',ur:'ملک منتخب کریں',id:'Pilih negara'})}</option>
    ${buildCountryOptions()}
  </select>
</div>`:''}

<button class="auth-submit-btn" id="auth-submit-btn" type="button">${tx(AUTH_COPY.sendOtp)}</button>`;
  }

  function buildOTP() {
    return `
<div class="otp-section">
  <div class="otp-header">
    <span class="otp-email-icon" aria-hidden="true">📧</span>
    <h2 class="auth-card__heading">${tx(AUTH_COPY.verifyOtp)}</h2>
    <p class="otp-sent-to">${tx(AUTH_COPY.otpSent)}<br/><strong>${email}</strong></p>
  </div>
  <div class="otp-inputs" role="group" aria-label="کد تایید ۶ رقمی" dir="ltr">
    ${Array.from({length:6}).map((_,i) => `
    <input type="text" inputmode="numeric" maxlength="1" class="otp-input" aria-label="رقم ${i+1}" autocomplete="${i===0?'one-time-code':'off'}"/>`).join('')}
  </div>
  <div class="auth-error-msg" id="otp-error" style="display:none" role="alert"><span></span></div>
  <div class="otp-timer" aria-live="polite">
    <span id="otp-timer-text"></span>
    <button class="otp-resend-btn" id="otp-resend-btn" disabled type="button">${tx(AUTH_COPY.resendOtp)}</button>
  </div>
  <button class="auth-submit-btn" id="otp-verify-btn" type="button">${tx(AUTH_COPY.verifyOtp)}</button>
  <div style="text-align:center;margin-top:var(--space-5);">
    <button id="otp-back-btn" type="button" style="background:none;border:none;color:var(--text-muted);font-size:var(--text-sm);cursor:pointer;text-decoration:underline;text-underline-offset:3px;">
      ← ${tx({fa:'تغییر ایمیل',ar:'تغيير البريد',en:'Change Email',tr:'E-postayı Değiştir',ru:'Изменить email',az:'Email dəyiş',ur:'ای میل تبدیل کریں',id:'Ganti Email'})}
    </button>
  </div>
</div>`;
  }

  function attachFormEvents() {
    root.querySelectorAll('.auth-tab').forEach(tab => {
      tab.addEventListener('click', () => { mode = tab.dataset.mode; render(); });
    });
    document.getElementById('google-btn')?.addEventListener('click', handleGoogle);
    document.getElementById('auth-submit-btn')?.addEventListener('click', handleSendOTP);
    root.querySelectorAll('.auth-input').forEach(inp => {
      inp.addEventListener('keydown', e => { if (e.key === 'Enter') handleSendOTP(); });
    });
  }

  function attachOTPEvents() {
    let otpCode = '';
    initOTPInputs(root.querySelector('.otp-inputs'), code => { otpCode = code; });
    const timerEl = document.getElementById('otp-timer-text');
    const resendBtn = document.getElementById('otp-resend-btn');
    timer = new OTPTimer(120, sec => {
      if (timerEl) timerEl.textContent = `${tx({fa:'ارسال مجدد تا',ar:'إعادة الإرسال في',en:'Resend in',tr:'Yeniden gönder',ru:'Повторить через',az:'Yenidən göndər',ur:'دوباره بھیجیں',id:'Kirim ulang dalam'})} ${Math.floor(sec/60).toString().padStart(2,'0')}:${(sec%60).toString().padStart(2,'0')} `;
    }, () => {
      if (resendBtn) resendBtn.disabled = false;
      if (timerEl) timerEl.textContent = '';
    });
    timer.start();
    resendBtn?.addEventListener('click', async () => {
      resendBtn.disabled = true;
      await sendOTP(email);
      timer.reset(120);
    });
    document.getElementById('otp-verify-btn')?.addEventListener('click', () => verifyOTP(otpCode));
    document.getElementById('otp-back-btn')?.addEventListener('click', () => { timer?.stop(); step = 'form'; render(); });
  }

  async function handleSendOTP() {
    const emailInput = document.getElementById('auth-email');
    const nameInput = document.getElementById('auth-name');
    const emailError = document.getElementById('email-error');
    const nameError = document.getElementById('name-error');
    const submitBtn = document.getElementById('auth-submit-btn');

    email = emailInput?.value?.trim() ?? '';
    name = nameInput?.value?.trim() ?? '';

    let valid = true;
    if (mode === 'register' && !name) {
      if (nameError) nameError.style.display = 'flex';
      nameInput?.classList.add('auth-input--error');
      valid = false;
    } else {
      if (nameError) nameError.style.display = 'none';
      nameInput?.classList.remove('auth-input--error');
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      if (emailError) emailError.style.display = 'flex';
      emailInput?.classList.add('auth-input--error');
      valid = false;
    } else {
      if (emailError) emailError.style.display = 'none';
      emailInput?.classList.remove('auth-input--error');
    }
    if (!valid) return;

    if (submitBtn) { submitBtn.classList.add('auth-submit-btn--loading'); submitBtn.textContent = '...'; }
    await sendOTP(email).catch(err => {
      if (submitBtn) { submitBtn.classList.remove('auth-submit-btn--loading'); submitBtn.textContent = tx(AUTH_COPY.sendOtp); }
      if (emailError) {
        emailError.style.display = 'flex';
        const span = emailError.querySelector('span');
        if (span) span.textContent = err.message;
      }
      throw err;
    });
    step = 'otp';
    render();
  }

  async function sendOTP(emailAddr) {
    const res = await fetch('/api/auth/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: emailAddr, lang: i18n.lang })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || tx({fa:'خطا در ارسال کد',en:'Failed to send code',ar:'فشل إرسال الرمز',ur:'کوڈ بھیجنے میں خطا',tr:'Kod gönderilemedi',ru:'Ошибка отправки кода',az:'Kod göndərilmədi',id:'Gagal kirim kode'}));
    return data;
  }

  async function verifyOTP(code) {
    const verifyBtn = document.getElementById('otp-verify-btn');
    const otpError = document.getElementById('otp-error');
    const inputs = root.querySelectorAll('.otp-input');

    if (code.length !== 6) {
      inputs.forEach(i => i.classList.add('error'));
      if (otpError) otpError.style.display = 'flex';
      setTimeout(() => inputs.forEach(i => i.classList.remove('error')), 600);
      return;
    }

    if (verifyBtn) { verifyBtn.classList.add('auth-submit-btn--loading'); verifyBtn.textContent = '...'; }

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, name, country: document.getElementById('auth-country')?.value || '' })
      });
      const data = await res.json();
      if (!res.ok) {
        inputs.forEach(i => i.classList.add('error'));
        if (otpError) {
          otpError.style.display = 'flex';
          const span = otpError.querySelector('span');
          if (span) span.textContent = data.message || tx(AUTH_COPY.otpInvalid);
        }
        setTimeout(() => inputs.forEach(i => i.classList.remove('error')), 600);
        if (verifyBtn) { verifyBtn.classList.remove('auth-submit-btn--loading'); verifyBtn.textContent = tx(AUTH_COPY.verifyOtp); }
        return;
      }
      AuthState.setToken(data.token);
      AuthState.setUser({ ...data.user, lang: i18n.lang, avatar: null });
      window.location.href = '/profile.html';
    } catch {
      if (verifyBtn) { verifyBtn.classList.remove('auth-submit-btn--loading'); verifyBtn.textContent = tx(AUTH_COPY.verifyOtp); }
    }
  }

  function handleGoogle() {
    console.log('[Auth] Google login initiated');
    alert(tx({fa:'ورود با گوگل در نسخه production فعال می‌شود',ar:'Google Login سيُفعَّل في نسخة الإنتاج',en:'Google Login will be enabled in production',tr:'Google Login üretimde aktif olacak',ru:'Google Login будет активен в production',az:'Google Login tezliklə aktivləşdirilər',ur:'Google Login جلد فعال کیا جائے گا',id:'Google Login akan aktif di versi produksi'}));
  }

  render();
}

export function logout() {
  AuthState.clear();
  window.location.href = '/auth.html';
}

export function requireAuth(redirect = '/auth.html') {
  if (!AuthState.isLoggedIn()) return window.location.href = redirect, false;
  return true;
}
