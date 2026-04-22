/**
 * ============================================================
 * FILE: auth.js
 * ROLE: ثبت‌نام، ورود، OTP، Google Login
 * PROJECT: BarakatHub — پلتفرم رسانه‌ای کربلا
 * VERSION: 1.0.0
 * DEPENDS ON: i18n.js, theme.js
 * ============================================================
 */

import { i18n, t } from './i18n.js';

/* ────────────────────────────────────────────────────────────
   ترجمه‌های اختصاصی این ماژول
   ──────────────────────────────────────────────────────────── */
const AUTH_COPY = {
  login:         { fa:'ورود', ar:'تسجيل الدخول', ur:'لاگ ان', az:'Daxil ol', tr:'Giriş', ru:'Войти', en:'Login', id:'Masuk' },
  register:      { fa:'ثبت‌نام', ar:'التسجيل', ur:'رجسٹر', az:'Qeydiyyat', tr:'Kayıt Ol', ru:'Регистрация', en:'Register', id:'Daftar' },
  fullName:      { fa:'نام کامل', ar:'الاسم الكامل', ur:'پورا نام', az:'Tam adınız', tr:'Tam Adınız', ru:'Полное имя', en:'Full Name', id:'Nama Lengkap' },
  email:         { fa:'آدرس ایمیل', ar:'البريد الإلكتروني', ur:'ای میل', az:'E-poçt', tr:'E-posta', en:'Email', ru:'Эл. почта', id:'Email' },
  country:       { fa:'کشور (اختیاری)', ar:'الدولة (اختياري)', ur:'ملک (اختیاری)', az:'Ölkə (ixtiyari)', tr:'Ülke (İsteğe Bağlı)', ru:'Страна (необязательно)', en:'Country (Optional)', id:'Negara (Opsional)' },
  sendOtp:       { fa:'ارسال کد تأیید', ar:'إرسال رمز التحقق', ur:'تصدیقی کوڈ بھیجیں', az:'Doğrulama kodu göndər', tr:'Doğrulama Kodu Gönder', ru:'Отправить код', en:'Send Verification Code', id:'Kirim Kode Verifikasi' },
  verifyOtp:     { fa:'تأیید کد', ar:'تأكيد الرمز', ur:'کوڈ تصدیق کریں', az:'Kodu təsdiqlə', tr:'Kodu Doğrula', ru:'Подтвердить код', en:'Verify Code', id:'Verifikasi Kode' },
  otpSent:       { fa:'کد به ایمیل شما ارسال شد', ar:'تم إرسال الرمز إلى بريدك', ur:'کوڈ آپ کے ای میل پر بھیجا گیا', az:'Kod e-poçtunuza göndərildi', tr:'Kod e-postanıza gönderildi', ru:'Код отправлен на вашу почту', en:'Code sent to your email', id:'Kode dikirim ke email Anda' },
  resendOtp:     { fa:'ارسال مجدد کد', ar:'إعادة إرسال الرمز', ur:'کوڈ دوبارہ بھیجیں', az:'Kodu yenidən göndər', tr:'Kodu Yeniden Gönder', ru:'Отправить снова', en:'Resend Code', id:'Kirim Ulang Kode' },
  continueGoogle:{ fa:'ادامه با گوگل', ar:'المتابعة بجوجل', ur:'گوگل سے جاری رہیں', az:'Google ilə davam et', tr:'Google ile Devam Et', ru:'Войти через Google', en:'Continue with Google', id:'Lanjutkan dengan Google' },
  orEmail:       { fa:'یا با ایمیل', ar:'أو بالبريد الإلكتروني', ur:'یا ای میل سے', az:'Və ya e-poçtla', tr:'veya E-posta ile', ru:'или по Email', en:'or with Email', id:'atau dengan Email' },
  namePlaceholder:{ fa:'مثلاً: علی محمدی', ar:'مثال: محمد أحمد', ur:'مثلاً: احمد علی', az:'Məs: Əli Əliyev', tr:'Örn: Ahmet Yılmaz', ru:'Напр: Алексей Иванов', en:'e.g. John Smith', id:'cth. Ahmad Budi' },
  emailInvalid:  { fa:'ایمیل معتبر وارد کنید', ar:'أدخل بريداً صحيحاً', ur:'درست ای میل درج کریں', az:'Düzgün e-poçt daxil edin', tr:'Geçerli e-posta girin', ru:'Введите корректный email', en:'Enter a valid email', id:'Masukkan email yang valid' },
  nameRequired:  { fa:'نام الزامی است', ar:'الاسم مطلوب', ur:'نام ضروری ہے', az:'Ad tələb olunur', tr:'Ad zorunludur', ru:'Имя обязательно', en:'Name is required', id:'Nama wajib diisi' },
  otpInvalid:    { fa:'کد اشتباه است', ar:'الرمز خاطئ', ur:'غلط کوڈ', az:'Kod yanlışdır', tr:'Hatalı kod', ru:'Неверный код', en:'Invalid code', id:'Kode tidak valid' },
  welcomeBack:   { fa:'خوش برگشتید', ar:'مرحباً بعودتك', ur:'خوش آمدید واپس', az:'Xoş gəldiniz', tr:'Tekrar Hoş Geldiniz', ru:'С возвращением', en:'Welcome Back', id:'Selamat Datang Kembali' },
  visualTitle:   { fa:'به خانواده برکت‌هاب خوش آمدید', ar:'مرحباً بك في عائلة بركت هاب', ur:'برکت‌ہب خاندان میں خوش آمدید', az:'BarakatHub ailəsinə xoş gəldiniz', tr:'BarakatHub Ailesine Hoş Geldiniz', ru:'Добро пожаловать в BarakatHub', en:'Welcome to BarakatHub Family', id:'Selamat Datang di Keluarga BarakatHub' },
  visualDesc:    { fa:'تدبر در قرآن، دعا، زیارت و ارتباط با کربلا — همه در یک پلتفرم', ar:'التدبر في القرآن والدعاء والزيارة والتواصل مع كربلاء', ur:'قرآن تدبر، دعا، زیارت اور کربلا سے رابطہ', az:'Quran təfəkkürü, dua, ziyarət', tr:'Kuran tefekkürü, dua, ziyaret', ru:'Размышление над Кораном, молитвы, паломничество', en:'Quran reflection, prayer, pilgrimage — all in one platform', id:'Refleksi Quran, doa, ziarah — semua dalam satu platform' },
};

function tx(obj) {
  return obj[i18n.lang] ?? obj['fa'] ?? obj['en'] ?? '';
}

/* ────────────────────────────────────────────────────────────
   1. AUTH STATE (ذخیره در localStorage)
   ──────────────────────────────────────────────────────────── */
export const AuthState = {
  getUser()  {
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
    try {
      localStorage.removeItem('mh_user');
      localStorage.removeItem('mh_token');
    } catch {}
  },
  isLoggedIn() { return !!this.getToken() && !!this.getUser(); },
};

/* ────────────────────────────────────────────────────────────
   2. OTP TIMER
   ──────────────────────────────────────────────────────────── */
class OTPTimer {
  constructor(seconds, onTick, onDone) {
    this._remaining = seconds;
    this._onTick    = onTick;
    this._onDone    = onDone;
    this._interval  = null;
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
  reset(seconds = 120) {
    this.stop();
    this._remaining = seconds;
    this.start();
  }
  format() {
    const m = Math.floor(this._remaining / 60).toString().padStart(2, '0');
    const s = (this._remaining % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }
}

/* ────────────────────────────────────────────────────────────
   3. OTP INPUT CONTROLLER
   ──────────────────────────────────────────────────────────── */
function initOTPInputs(container, onComplete) {
  const inputs = container.querySelectorAll('.otp-input');

  inputs.forEach((input, i) => {
    input.addEventListener('input', (e) => {
      const val = e.target.value.replace(/\D/g, '');
      e.target.value = val.slice(-1);
      if (val) {
        input.classList.add('filled');
        if (i < inputs.length - 1) inputs[i + 1].focus();
      } else {
        input.classList.remove('filled');
      }
      /* همه پر شد؟ */
      const code = Array.from(inputs).map(inp => inp.value).join('');
      if (code.length === 6) onComplete(code);
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !input.value && i > 0) {
        inputs[i - 1].focus();
        inputs[i - 1].value = '';
        inputs[i - 1].classList.remove('filled');
      }
      if (e.key === 'ArrowLeft'  && i > 0)              inputs[i - 1].focus();
      if (e.key === 'ArrowRight' && i < inputs.length - 1) inputs[i + 1].focus();
    });

    /* Paste */
    input.addEventListener('paste', (e) => {
      e.preventDefault();
      const pasted = (e.clipboardData || window.clipboardData)
        .getData('text').replace(/\D/g, '').slice(0, 6);
      pasted.split('').forEach((ch, idx) => {
        if (inputs[idx]) {
          inputs[idx].value = ch;
          inputs[idx].classList.add('filled');
        }
      });
      if (pasted.length === 6) onComplete(pasted);
    });
  });

  inputs[0]?.focus();
}

/* ────────────────────────────────────────────────────────────
   4. AUTH PAGE RENDERER
   ──────────────────────────────────────────────────────────── */
export function renderAuthPage(container) {
  if (!container) return;

  /* اگر قبلاً لاگین است، ریدایرکت */
  if (AuthState.isLoggedIn()) {
    window.location.href = '/profile.html';
    return;
  }

  let _mode   = 'login';   /* 'login' | 'register' */
  let _step   = 'form';    /* 'form' | 'otp' */
  let _email  = '';
  let _name   = '';
  let _timer  = null;

  function _render() {
    container.innerHTML = `
      <div class="auth-page">

        <!-- Visual سمت چپ/راست -->
        <div class="auth-visual">
          <div class="auth-visual__pattern" aria-hidden="true"></div>
          <div class="auth-visual__content">
            <span class="auth-visual__icon" aria-hidden="true">🕌</span>
            <h2 class="auth-visual__title">${tx(AUTH_COPY.visualTitle)}</h2>
            <p class="auth-visual__desc">${tx(AUTH_COPY.visualDesc)}</p>
            <div class="auth-visual__stats" aria-label="آمار">
              <div class="auth-visual__stat">
                <span class="auth-visual__stat-num">۱۲۴۰+</span>
                <span class="auth-visual__stat-lbl">${{ fa:'مقاله', ar:'مقالة', ur:'مضمون', en:'Articles', tr:'Makale', ru:'Статей', az:'Məqalə', id:'Artikel' }[i18n.lang] ?? 'مقاله'}</span>
              </div>
              <div class="auth-visual__stat">
                <span class="auth-visual__stat-num">۸۲K</span>
                <span class="auth-visual__stat-lbl">${{ fa:'کاربر', ar:'مستخدم', ur:'صارف', en:'Users', tr:'Kullanıcı', ru:'Пользователей', az:'İstifadəçi', id:'Pengguna' }[i18n.lang] ?? 'کاربر'}</span>
              </div>
              <div class="auth-visual__stat">
                <span class="auth-visual__stat-num">۷</span>
                <span class="auth-visual__stat-lbl">${{ fa:'زبان', ar:'لغة', ur:'زبان', en:'Languages', tr:'Dil', ru:'Языков', az:'Dil', id:'Bahasa' }[i18n.lang] ?? 'زبان'}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Form سمت راست -->
        <div class="auth-form-side">
          <div class="auth-card">

            <!-- Logo -->
            <a href="/" class="auth-card__logo" aria-label="برکت‌هاب">
              <svg width="36" height="36" viewBox="0 0 32 32" fill="none" aria-hidden="true">
                <rect width="32" height="32" rx="8" fill="var(--color-primary-500)"/>
                <path d="M8 22V10l8 6 8-6v12" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <span class="auth-card__logo-text">برکت‌هاب</span>
            </a>

            ${_step === 'form' ? _renderForm() : _renderOTP()}

          </div>
        </div>

      </div>
    `;

    /* Events */
    if (_step === 'form') _bindFormEvents();
    else                  _bindOTPEvents();
  }

  /* ── فرم اصلی ── */
  function _renderForm() {
    return `
      <!-- Tabs -->
      <div class="auth-tabs" role="tablist">
        <button class="auth-tab ${_mode === 'login' ? 'auth-tab--active' : ''}"
          role="tab" aria-selected="${_mode === 'login'}" id="tab-login"
          data-mode="login">${tx(AUTH_COPY.login)}</button>
        <button class="auth-tab ${_mode === 'register' ? 'auth-tab--active' : ''}"
          role="tab" aria-selected="${_mode === 'register'}" id="tab-register"
          data-mode="register">${tx(AUTH_COPY.register)}</button>
      </div>

      <h1 class="auth-card__heading">
        ${_mode === 'login' ? tx(AUTH_COPY.welcomeBack) : tx(AUTH_COPY.register)}
      </h1>
      <p class="auth-card__sub">
        ${_mode === 'login'
          ? tx({ fa:'خوشحالیم که برگشتید 🙏', ar:'يسعدنا عودتك 🙏', ur:'واپسی پر خوش آمدید 🙏', en:'Welcome back 🙏', tr:'Tekrar hoş geldiniz 🙏', ru:'Рады видеть вас снова 🙏', az:'Xoş gəldiniz 🙏' })
          : tx({ fa:'حساب رایگان بسازید', ar:'أنشئ حساباً مجانياً', ur:'مفت اکاؤنٹ بنائیں', en:'Create a free account', tr:'Ücretsiz hesap oluşturun', ru:'Создайте бесплатный аккаунт', az:'Pulsuz hesab yaradın' })
        }
      </p>

      <!-- Google Button -->
      <button class="auth-google-btn" id="google-btn" type="button">
        <svg width="22" height="22" viewBox="0 0 48 48" aria-hidden="true">
          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
          <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
        </svg>
        ${tx(AUTH_COPY.continueGoogle)}
      </button>

      <div class="auth-divider" aria-hidden="true">${tx(AUTH_COPY.orEmail)}</div>

      <!-- فیلدها -->
      ${_mode === 'register' ? `
        <div class="auth-field">
          <label class="auth-label" for="auth-name">${tx(AUTH_COPY.fullName)}</label>
          <input
            class="auth-input"
            id="auth-name"
            type="text"
            placeholder="${tx(AUTH_COPY.namePlaceholder)}"
            autocomplete="name"
            value="${_name}"
            aria-required="true"
          />
          <div class="auth-error-msg" id="name-error" style="display:none" role="alert">
            ⚠ ${tx(AUTH_COPY.nameRequired)}
          </div>
        </div>
      ` : ''}

      <div class="auth-field">
        <label class="auth-label" for="auth-email">${tx(AUTH_COPY.email)}</label>
        <input
          class="auth-input"
          id="auth-email"
          type="email"
          placeholder="example@email.com"
          autocomplete="email"
          value="${_email}"
          dir="ltr"
          aria-required="true"
        />
        <div class="auth-error-msg" id="email-error" style="display:none" role="alert">
          ⚠ ${tx(AUTH_COPY.emailInvalid)}
        </div>
      </div>

      ${_mode === 'register' ? `
        <div class="auth-field">
          <label class="auth-label" for="auth-country">${tx(AUTH_COPY.country)}</label>
          <select class="auth-input" id="auth-country" autocomplete="country">
            <option value="">— ${tx({fa:'کشور را انتخاب کنید',ar:'اختر الدولة',ur:'ملک منتخب کریں',az:'Ölkəni seçin',tr:'Ülke seçin',ru:'Выберите страну',en:'Select country',id:'Pilih negara'})} —</option>
            ${(()=>{
              const lang = (typeof i18n !== 'undefined' ? i18n.lang : null) || document.documentElement.lang || 'en';
              const COUNTRIES = {
                AF:{fa:'افغانستان',ar:'أفغانستان',ur:'افغانستان',az:'Əfqanıstan',tr:'Afganistan',ru:'Афганистан',en:'Afghanistan',id:'Afghanistan'},
                AL:{fa:'آلبانی',ar:'ألبانيا',ur:'البانیہ',az:'Albaniya',tr:'Arnavutluk',ru:'Албания',en:'Albania',id:'Albania'},
                DZ:{fa:'الجزایر',ar:'الجزائر',ur:'الجزائر',az:'Cəzayir',tr:'Cezayir',ru:'Алжир',en:'Algeria',id:'Aljazair'},
                AD:{fa:'آندورا',ar:'أندورا',ur:'انڈورا',az:'Andorra',tr:'Andorra',ru:'Андорра',en:'Andorra',id:'Andorra'},
                AO:{fa:'آنگولا',ar:'أنغولا',ur:'انگولا',az:'Anqola',tr:'Angola',ru:'Ангола',en:'Angola',id:'Angola'},
                AR:{fa:'آرژانتین',ar:'الأرجنتين',ur:'ارجنٹائن',az:'Argentina',tr:'Arjantin',ru:'Аргентина',en:'Argentina',id:'Argentina'},
                AM:{fa:'ارمنستان',ar:'أرمينيا',ur:'آرمینیا',az:'Ermənistan',tr:'Ermenistan',ru:'Армения',en:'Armenia',id:'Armenia'},
                AU:{fa:'استرالیا',ar:'أستراليا',ur:'آسٹریلیا',az:'Avstraliya',tr:'Avustralya',ru:'Австралия',en:'Australia',id:'Australia'},
                AT:{fa:'اتریش',ar:'النمسا',ur:'آسٹریا',az:'Avstriya',tr:'Avusturya',ru:'Австрия',en:'Austria',id:'Austria'},
                AZ:{fa:'آذربایجان',ar:'أذربيجان',ur:'آذربائیجان',az:'Azərbaycan',tr:'Azerbaycan',ru:'Азербайджан',en:'Azerbaijan',id:'Azerbaijan'},
                BH:{fa:'بحرین',ar:'البحرين',ur:'بحرین',az:'Bəhreyn',tr:'Bahreyn',ru:'Бахрейн',en:'Bahrain',id:'Bahrain'},
                BD:{fa:'بنگلادش',ar:'بنغلاديش',ur:'بنگلہ دیش',az:'Banqladeş',tr:'Bangladeş',ru:'Бангладеш',en:'Bangladesh',id:'Bangladesh'},
                BY:{fa:'بلاروس',ar:'بيلاروسيا',ur:'بیلاروس',az:'Belarus',tr:'Beyaz Rusya',ru:'Беларусь',en:'Belarus',id:'Belarus'},
                BE:{fa:'بلژیک',ar:'بلجيكا',ur:'بیلجیم',az:'Belçika',tr:'Belçika',ru:'Бельгия',en:'Belgium',id:'Belgia'},
                BJ:{fa:'بنین',ar:'بنين',ur:'بینن',az:'Benin',tr:'Benin',ru:'Бенин',en:'Benin',id:'Benin'},
                BO:{fa:'بولیوی',ar:'بوليفيا',ur:'بولیویا',az:'Boliviya',tr:'Bolivya',ru:'Боливия',en:'Bolivia',id:'Bolivia'},
                BA:{fa:'بوسنی و هرزگوین',ar:'البوسنة والهرسك',ur:'بوسنیا',az:'Bosniya',tr:'Bosna Hersek',ru:'Босния',en:'Bosnia',id:'Bosnia'},
                BR:{fa:'برزیل',ar:'البرازيل',ur:'برازیل',az:'Braziliya',tr:'Brezilya',ru:'Бразилия',en:'Brazil',id:'Brasil'},
                BG:{fa:'بلغارستان',ar:'بلغاريا',ur:'بلغاریہ',az:'Bolqarıstan',tr:'Bulgaristan',ru:'Болгария',en:'Bulgaria',id:'Bulgaria'},
                BF:{fa:'بورکینافاسو',ar:'بوركينا فاسو',ur:'برکینا فاسو',az:'Burkina Faso',tr:'Burkina Faso',ru:'Буркина-Фасо',en:'Burkina Faso',id:'Burkina Faso'},
                KH:{fa:'کامبوج',ar:'كمبوديا',ur:'کمبوڈیا',az:'Kamboca',tr:'Kamboçya',ru:'Камбоджа',en:'Cambodia',id:'Kamboja'},
                CM:{fa:'کامرون',ar:'الكاميرون',ur:'کیمرون',az:'Kamerun',tr:'Kamerun',ru:'Камерун',en:'Cameroon',id:'Kamerun'},
                CA:{fa:'کانادا',ar:'كندا',ur:'کینیڈا',az:'Kanada',tr:'Kanada',ru:'Канада',en:'Canada',id:'Kanada'},
                TD:{fa:'چاد',ar:'تشاد',ur:'چاڈ',az:'Çad',tr:'Çad',ru:'Чад',en:'Chad',id:'Chad'},
                CL:{fa:'شیلی',ar:'تشيلي',ur:'چلی',az:'Çili',tr:'Şili',ru:'Чили',en:'Chile',id:'Chili'},
                CN:{fa:'چین',ar:'الصين',ur:'چین',az:'Çin',tr:'Çin',ru:'Китай',en:'China',id:'China'},
                CO:{fa:'کلمبیا',ar:'كولومبيا',ur:'کولمبیا',az:'Kolumbiya',tr:'Kolombiya',ru:'Колумбия',en:'Colombia',id:'Kolombia'},
                CD:{fa:'کنگو دموکراتیک',ar:'الكونغو الديمقراطية',ur:'کانگو',az:'Kongo',tr:'Kongo',ru:'Конго',en:'DR Congo',id:'Kongo'},
                CR:{fa:'کاستاریکا',ar:'كوستاريكا',ur:'کوسٹا ریکا',az:'Kosta Rika',tr:'Kosta Rika',ru:'Коста-Рика',en:'Costa Rica',id:'Kosta Rika'},
                HR:{fa:'کرواسی',ar:'كرواتيا',ur:'کروشیا',az:'Xorvatiya',tr:'Hırvatistan',ru:'Хорватия',en:'Croatia',id:'Kroasia'},
                CU:{fa:'کوبا',ar:'كوبا',ur:'کیوبا',az:'Kuba',tr:'Küba',ru:'Куба',en:'Cuba',id:'Kuba'},
                CY:{fa:'قبرس',ar:'قبرص',ur:'قبرص',az:'Kipr',tr:'Kıbrıs',ru:'Кипр',en:'Cyprus',id:'Siprus'},
                CZ:{fa:'جمهوری چک',ar:'التشيك',ur:'چیک',az:'Çexiya',tr:'Çekya',ru:'Чехия',en:'Czech Republic',id:'Ceko'},
                DK:{fa:'دانمارک',ar:'الدنمارك',ur:'ڈنمارک',az:'Danimarka',tr:'Danimarka',ru:'Дания',en:'Denmark',id:'Denmark'},
                DO:{fa:'دومینیکن',ar:'الدومينيكان',ur:'ڈومینیکن',az:'Dominikan',tr:'Dominik',ru:'Доминикана',en:'Dominican Rep.',id:'Dominika'},
                EC:{fa:'اکوادور',ar:'الإكوادور',ur:'ایکواڈور',az:'Ekvador',tr:'Ekvador',ru:'Эквадор',en:'Ecuador',id:'Ekuador'},
                EG:{fa:'مصر',ar:'مصر',ur:'مصر',az:'Misir',tr:'Mısır',ru:'Египет',en:'Egypt',id:'Mesir'},
                SV:{fa:'السالوادور',ar:'السلفادور',ur:'ایل سیلواڈور',az:'Salvador',tr:'El Salvador',ru:'Сальвадор',en:'El Salvador',id:'El Salvador'},
                ET:{fa:'اتیوپی',ar:'إثيوبيا',ur:'ایتھوپیا',az:'Efiopiya',tr:'Etiyopya',ru:'Эфиопия',en:'Ethiopia',id:'Etiopia'},
                FI:{fa:'فنلاند',ar:'فنلندا',ur:'فن لینڈ',az:'Finlandiya',tr:'Finlandiya',ru:'Финляндия',en:'Finland',id:'Finlandia'},
                FR:{fa:'فرانسه',ar:'فرنسا',ur:'فرانس',az:'Fransa',tr:'Fransa',ru:'Франция',en:'France',id:'Prancis'},
                GE:{fa:'گرجستان',ar:'جورجيا',ur:'جارجیا',az:'Gürcüstan',tr:'Gürcistan',ru:'Грузия',en:'Georgia',id:'Georgia'},
                DE:{fa:'آلمان',ar:'ألمانيا',ur:'جرمنی',az:'Almaniya',tr:'Almanya',ru:'Германия',en:'Germany',id:'Jerman'},
                GH:{fa:'غنا',ar:'غانا',ur:'گھانا',az:'Qana',tr:'Gana',ru:'Гана',en:'Ghana',id:'Ghana'},
                GR:{fa:'یونان',ar:'اليونان',ur:'یونان',az:'Yunanıstan',tr:'Yunanistan',ru:'Греция',en:'Greece',id:'Yunani'},
                GT:{fa:'گواتمالا',ar:'غواتيمالا',ur:'گوئٹے مالا',az:'Qvatemala',tr:'Guatemala',ru:'Гватемала',en:'Guatemala',id:'Guatemala'},
                HN:{fa:'هندوراس',ar:'هندوراس',ur:'ہنڈوراس',az:'Honduras',tr:'Honduras',ru:'Гондурас',en:'Honduras',id:'Honduras'},
                HK:{fa:'هنگ کنگ',ar:'هونج كونج',ur:'ہانگ کانگ',az:'Honq Konq',tr:'Hong Kong',ru:'Гонконг',en:'Hong Kong',id:'Hong Kong'},
                HU:{fa:'مجارستان',ar:'المجر',ur:'ہنگری',az:'Macarıstan',tr:'Macaristan',ru:'Венгрия',en:'Hungary',id:'Hongaria'},
                IS:{fa:'ایسلند',ar:'آيسلندا',ur:'آئس لینڈ',az:'İslandiya',tr:'İzlanda',ru:'Исландия',en:'Iceland',id:'Islandia'},
                IN:{fa:'هند',ar:'الهند',ur:'بھارت',az:'Hindistan',tr:'Hindistan',ru:'Индия',en:'India',id:'India'},
                ID:{fa:'اندونزی',ar:'إندونيسيا',ur:'انڈونیشیا',az:'İndoneziya',tr:'Endonezya',ru:'Индонезия',en:'Indonesia',id:'Indonesia'},
                IQ:{fa:'عراق',ar:'العراق',ur:'عراق',az:'İraq',tr:'Irak',ru:'Ирак',en:'Iraq',id:'Irak'},
                IR:{fa:'ایران',ar:'إيران',ur:'ایران',az:'İran',tr:'İran',ru:'Иран',en:'Iran',id:'Iran'},
                IE:{fa:'ایرلند',ar:'أيرلندا',ur:'آئرلینڈ',az:'İrlandiya',tr:'İrlanda',ru:'Ирландия',en:'Ireland',id:'Irlandia'},
                IL:{fa:'اسرائیل',ar:'إسرائيل',ur:'اسرائیل',az:'İsrail',tr:'İsrail',ru:'Израиль',en:'Israel',id:'Israel'},
                IT:{fa:'ایتالیا',ar:'إيطاليا',ur:'اٹلی',az:'İtaliya',tr:'İtalya',ru:'Италия',en:'Italy',id:'Italia'},
                JM:{fa:'جامائیکا',ar:'جامايكا',ur:'جمیکا',az:'Yamayka',tr:'Jamaika',ru:'Ямайка',en:'Jamaica',id:'Jamaika'},
                JP:{fa:'ژاپن',ar:'اليابان',ur:'جاپان',az:'Yaponiya',tr:'Japonya',ru:'Япония',en:'Japan',id:'Jepang'},
                JO:{fa:'اردن',ar:'الأردن',ur:'اردن',az:'İordaniya',tr:'Ürdün',ru:'Иордания',en:'Jordan',id:'Yordania'},
                KZ:{fa:'قزاقستان',ar:'كازاخستان',ur:'قازقستان',az:'Qazaxıstan',tr:'Kazakistan',ru:'Казахстан',en:'Kazakhstan',id:'Kazakhstan'},
                KE:{fa:'کنیا',ar:'كينيا',ur:'کینیا',az:'Keniya',tr:'Kenya',ru:'Кения',en:'Kenya',id:'Kenya'},
                KW:{fa:'کویت',ar:'الكويت',ur:'کویت',az:'Küveyt',tr:'Kuveyt',ru:'Кувейт',en:'Kuwait',id:'Kuwait'},
                KG:{fa:'قرقیزستان',ar:'قيرغيزستان',ur:'کرغیزستان',az:'Qırğızıstan',tr:'Kırgızistan',ru:'Кыргызстан',en:'Kyrgyzstan',id:'Kirgistan'},
                LA:{fa:'لائوس',ar:'لاوس',ur:'لاؤس',az:'Laos',tr:'Laos',ru:'Лаос',en:'Laos',id:'Laos'},
                LV:{fa:'لتونی',ar:'لاتفيا',ur:'لٹویا',az:'Latviya',tr:'Letonya',ru:'Латвия',en:'Latvia',id:'Latvia'},
                LB:{fa:'لبنان',ar:'لبنان',ur:'لبنان',az:'Livan',tr:'Lübnan',ru:'Ливан',en:'Lebanon',id:'Lebanon'},
                LY:{fa:'لیبی',ar:'ليبيا',ur:'لیبیا',az:'Liviya',tr:'Libya',ru:'Ливия',en:'Libya',id:'Libya'},
                LT:{fa:'لیتوانی',ar:'ليتوانيا',ur:'لتھوانیا',az:'Litva',tr:'Litvanya',ru:'Литва',en:'Lithuania',id:'Lituania'},
                LU:{fa:'لوکزامبورگ',ar:'لوكسمبورغ',ur:'لکسمبرگ',az:'Lüksemburq',tr:'Lüksemburg',ru:'Люксембург',en:'Luxembourg',id:'Luksemburg'},
                MY:{fa:'مالزی',ar:'ماليزيا',ur:'ملائیشیا',az:'Malayziya',tr:'Malezya',ru:'Малайзия',en:'Malaysia',id:'Malaysia'},
                MV:{fa:'مالدیو',ar:'المالديف',ur:'مالدیپ',az:'Maldiv',tr:'Maldivler',ru:'Мальдивы',en:'Maldives',id:'Maladewa'},
                ML:{fa:'مالی',ar:'مالي',ur:'مالی',az:'Mali',tr:'Mali',ru:'Мали',en:'Mali',id:'Mali'},
                MT:{fa:'مالت',ar:'مالطا',ur:'مالٹا',az:'Malta',tr:'Malta',ru:'Мальта',en:'Malta',id:'Malta'},
                MR:{fa:'موریتانی',ar:'موريتانيا',ur:'موریطانیہ',az:'Mavritaniya',tr:'Moritanya',ru:'Мавритания',en:'Mauritania',id:'Mauritania'},
                MX:{fa:'مکزیک',ar:'المكسيك',ur:'میکسیکو',az:'Meksika',tr:'Meksika',ru:'Мексика',en:'Mexico',id:'Meksiko'},
                MD:{fa:'مولداوی',ar:'مولدوفا',ur:'مالدووا',az:'Moldova',tr:'Moldova',ru:'Молдова',en:'Moldova',id:'Moldova'},
                MN:{fa:'مغولستان',ar:'منغوليا',ur:'منگولیا',az:'Monqoliya',tr:'Moğolistan',ru:'Монголия',en:'Mongolia',id:'Mongolia'},
                ME:{fa:'مونته‌نگرو',ar:'الجبل الأسود',ur:'مونٹینیگرو',az:'Monteneqro',tr:'Karadağ',ru:'Черногория',en:'Montenegro',id:'Montenegro'},
                MA:{fa:'مراکش',ar:'المغرب',ur:'مراکش',az:'Mərakeş',tr:'Fas',ru:'Марокко',en:'Morocco',id:'Maroko'},
                MZ:{fa:'موزامبیک',ar:'موزمبيق',ur:'موزمبیق',az:'Mozambik',tr:'Mozambik',ru:'Мозамбик',en:'Mozambique',id:'Mozambik'},
                MM:{fa:'میانمار',ar:'ميانمار',ur:'میانمار',az:'Myanma',tr:'Myanmar',ru:'Мьянма',en:'Myanmar',id:'Myanmar'},
                NP:{fa:'نپال',ar:'نيبال',ur:'نیپال',az:'Nepal',tr:'Nepal',ru:'Непал',en:'Nepal',id:'Nepal'},
                NL:{fa:'هلند',ar:'هولندا',ur:'نیدرلینڈ',az:'Niderland',tr:'Hollanda',ru:'Нидерланды',en:'Netherlands',id:'Belanda'},
                NZ:{fa:'نیوزیلند',ar:'نيوزيلندا',ur:'نیوزی لینڈ',az:'Yeni Zelandiya',tr:'Yeni Zelanda',ru:'Новая Зеландия',en:'New Zealand',id:'Selandia Baru'},
                NI:{fa:'نیکاراگوئه',ar:'نيكاراغوا',ur:'نکاراگوا',az:'Nikaraqua',tr:'Nikaragua',ru:'Никарагуа',en:'Nicaragua',id:'Nikaragua'},
                NE:{fa:'نیجر',ar:'النيجر',ur:'نائیجر',az:'Niger',tr:'Nijer',ru:'Нигер',en:'Niger',id:'Niger'},
                NG:{fa:'نیجریه',ar:'نيجيريا',ur:'نائیجیریا',az:'Nigeriya',tr:'Nijerya',ru:'Нигерия',en:'Nigeria',id:'Nigeria'},
                NO:{fa:'نروژ',ar:'النرويج',ur:'ناروے',az:'Norveç',tr:'Norveç',ru:'Норвегия',en:'Norway',id:'Norwegia'},
                OM:{fa:'عمان',ar:'عُمان',ur:'عمان',az:'Oman',tr:'Umman',ru:'Оман',en:'Oman',id:'Oman'},
                PK:{fa:'پاکستان',ar:'باكستان',ur:'پاکستان',az:'Pakistan',tr:'Pakistan',ru:'Пакистан',en:'Pakistan',id:'Pakistan'},
                PS:{fa:'فلسطین',ar:'فلسطين',ur:'فلسطین',az:'Fələstin',tr:'Filistin',ru:'Палестина',en:'Palestine',id:'Palestina'},
                PA:{fa:'پاناما',ar:'بنما',ur:'پانامہ',az:'Panama',tr:'Panama',ru:'Панама',en:'Panama',id:'Panama'},
                PY:{fa:'پاراگوئه',ar:'باراغواي',ur:'پیراگوئے',az:'Paraqvay',tr:'Paraguay',ru:'Парагвай',en:'Paraguay',id:'Paraguay'},
                PE:{fa:'پرو',ar:'بيرو',ur:'پیرو',az:'Peru',tr:'Peru',ru:'Перу',en:'Peru',id:'Peru'},
                PH:{fa:'فیلیپین',ar:'الفلبين',ur:'فلپائن',az:'Filippin',tr:'Filipinler',ru:'Филиппины',en:'Philippines',id:'Filipina'},
                PL:{fa:'لهستان',ar:'بولندا',ur:'پولینڈ',az:'Polşa',tr:'Polonya',ru:'Польша',en:'Poland',id:'Polandia'},
                PT:{fa:'پرتغال',ar:'البرتغال',ur:'پرتگال',az:'Portuqaliya',tr:'Portekiz',ru:'Португалия',en:'Portugal',id:'Portugal'},
                QA:{fa:'قطر',ar:'قطر',ur:'قطر',az:'Qətər',tr:'Katar',ru:'Катар',en:'Qatar',id:'Qatar'},
                RO:{fa:'رومانی',ar:'رومانيا',ur:'رومانیہ',az:'Rumıniya',tr:'Romanya',ru:'Румыния',en:'Romania',id:'Rumania'},
                RU:{fa:'روسیه',ar:'روسيا',ur:'روس',az:'Rusiya',tr:'Rusya',ru:'Россия',en:'Russia',id:'Rusia'},
                SA:{fa:'عربستان سعودی',ar:'المملكة العربية السعودية',ur:'سعودی عرب',az:'Səudiyyə Ərəbistanı',tr:'Suudi Arabistan',ru:'Саудовская Аравия',en:'Saudi Arabia',id:'Arab Saudi'},
                SN:{fa:'سنگال',ar:'السنغال',ur:'سینیگال',az:'Seneqal',tr:'Senegal',ru:'Сенегал',en:'Senegal',id:'Senegal'},
                RS:{fa:'صربستان',ar:'صربيا',ur:'سربیا',az:'Serbiya',tr:'Sırbistan',ru:'Сербия',en:'Serbia',id:'Serbia'},
                SG:{fa:'سنگاپور',ar:'سنغافورة',ur:'سنگاپور',az:'Sinqapur',tr:'Singapur',ru:'Сингапур',en:'Singapore',id:'Singapura'},
                SK:{fa:'اسلواکی',ar:'سلوفاكيا',ur:'سلوواکیہ',az:'Slovakiya',tr:'Slovakya',ru:'Словакия',en:'Slovakia',id:'Slovakia'},
                SI:{fa:'اسلوونی',ar:'سلوفينيا',ur:'سلووینیا',az:'Sloveniya',tr:'Slovenya',ru:'Словения',en:'Slovenia',id:'Slovenia'},
                SO:{fa:'سومالی',ar:'الصومال',ur:'صومالیہ',az:'Somali',tr:'Somali',ru:'Сомали',en:'Somalia',id:'Somalia'},
                ZA:{fa:'آفریقای جنوبی',ar:'جنوب أفريقيا',ur:'جنوبی افریقہ',az:'Cənubi Afrika',tr:'Güney Afrika',ru:'ЮАР',en:'South Africa',id:'Afrika Selatan'},
                KR:{fa:'کره جنوبی',ar:'كوريا الجنوبية',ur:'جنوبی کوریا',az:'Cənubi Koreya',tr:'Güney Kore',ru:'Южная Корея',en:'South Korea',id:'Korea Selatan'},
                ES:{fa:'اسپانیا',ar:'إسبانيا',ur:'ہسپانیہ',az:'İspaniya',tr:'İspanya',ru:'Испания',en:'Spain',id:'Spanyol'},
                LK:{fa:'سریلانکا',ar:'سريلانكا',ur:'سری لنکا',az:'Şri Lanka',tr:'Sri Lanka',ru:'Шри-Ланка',en:'Sri Lanka',id:'Sri Lanka'},
                SD:{fa:'سودان',ar:'السودان',ur:'سوڈان',az:'Sudan',tr:'Sudan',ru:'Судан',en:'Sudan',id:'Sudan'},
                SE:{fa:'سوئد',ar:'السويد',ur:'سویڈن',az:'İsveç',tr:'İsveç',ru:'Швеция',en:'Sweden',id:'Swedia'},
                CH:{fa:'سوئیس',ar:'سويسرا',ur:'سوئٹزرلینڈ',az:'İsveçrə',tr:'İsviçre',ru:'Швейцария',en:'Switzerland',id:'Swiss'},
                SY:{fa:'سوریه',ar:'سوريا',ur:'شام',az:'Suriya',tr:'Suriye',ru:'Сирия',en:'Syria',id:'Suriah'},
                TW:{fa:'تایوان',ar:'تايوان',ur:'تائیوان',az:'Tayvan',tr:'Tayvan',ru:'Тайвань',en:'Taiwan',id:'Taiwan'},
                TJ:{fa:'تاجیکستان',ar:'طاجيكستان',ur:'تاجکستان',az:'Tacikistan',tr:'Tacikistan',ru:'Таджикистан',en:'Tajikistan',id:'Tajikistan'},
                TZ:{fa:'تانزانیا',ar:'تنزانيا',ur:'تنزانیہ',az:'Tanzaniya',tr:'Tanzanya',ru:'Танзания',en:'Tanzania',id:'Tanzania'},
                TH:{fa:'تایلند',ar:'تايلاند',ur:'تھائی لینڈ',az:'Tailand',tr:'Tayland',ru:'Таиланд',en:'Thailand',id:'Thailand'},
                TN:{fa:'تونس',ar:'تونس',ur:'تیونس',az:'Tunis',tr:'Tunus',ru:'Тунис',en:'Tunisia',id:'Tunisia'},
                TR:{fa:'ترکیه',ar:'تركيا',ur:'ترکی',az:'Türkiyə',tr:'Türkiye',ru:'Турция',en:'Turkey',id:'Turki'},
                TM:{fa:'ترکمنستان',ar:'تركمانستان',ur:'ترکمانستان',az:'Türkmənistan',tr:'Türkmenistan',ru:'Туркменистан',en:'Turkmenistan',id:'Turkmenistan'},
                UG:{fa:'اوگاندا',ar:'أوغندا',ur:'یوگنڈا',az:'Uqanda',tr:'Uganda',ru:'Уганда',en:'Uganda',id:'Uganda'},
                UA:{fa:'اوکراین',ar:'أوكرانيا',ur:'یوکرین',az:'Ukrayna',tr:'Ukrayna',ru:'Украина',en:'Ukraine',id:'Ukraina'},
                AE:{fa:'امارات متحده عربی',ar:'الإمارات العربية المتحدة',ur:'متحدہ عرب امارات',az:'BƏƏ',tr:'BAE',ru:'ОАЭ',en:'UAE',id:'UEA'},
                GB:{fa:'انگلستان',ar:'المملكة المتحدة',ur:'برطانیہ',az:'Böyük Britaniya',tr:'İngiltere',ru:'Великобритания',en:'United Kingdom',id:'Inggris'},
                US:{fa:'آمریکا',ar:'الولايات المتحدة',ur:'امریکہ',az:'ABŞ',tr:'ABD',ru:'США',en:'United States',id:'Amerika Serikat'},
                UY:{fa:'اروگوئه',ar:'أوروغواي',ur:'یوراگوئے',az:'Uruqvay',tr:'Uruguay',ru:'Уругвай',en:'Uruguay',id:'Uruguay'},
                UZ:{fa:'ازبکستان',ar:'أوزبكستان',ur:'ازبکستان',az:'Özbəkistan',tr:'Özbekistan',ru:'Узбекистан',en:'Uzbekistan',id:'Uzbekistan'},
                VE:{fa:'ونزوئلا',ar:'فنزويلا',ur:'وینزویلا',az:'Venesuela',tr:'Venezuela',ru:'Венесуэла',en:'Venezuela',id:'Venezuela'},
                VN:{fa:'ویتنام',ar:'فيتنام',ur:'ویتنام',az:'Vyetnam',tr:'Vietnam',ru:'Вьетнам',en:'Vietnam',id:'Vietnam'},
                YE:{fa:'یمن',ar:'اليمن',ur:'یمن',az:'Yəmən',tr:'Yemen',ru:'Йемен',en:'Yemen',id:'Yaman'},
                ZM:{fa:'زامبیا',ar:'زامبيا',ur:'زیمبیا',az:'Zambiya',tr:'Zambiya',ru:'Замбия',en:'Zambia',id:'Zambia'},
                ZW:{fa:'زیمبابوه',ar:'زيمبابوي',ur:'زمبابوے',az:'Zimbabve',tr:'Zimbabve',ru:'Зимбабве',en:'Zimbabwe',id:'Zimbabwe'},
              };
              const FLAGS = {AF:'🇦🇫',AL:'🇦🇱',DZ:'🇩🇿',AD:'🇦🇩',AO:'🇦🇴',AR:'🇦🇷',AM:'🇦🇲',AU:'🇦🇺',AT:'🇦🇹',AZ:'🇦🇿',BH:'🇧🇭',BD:'🇧🇩',BY:'🇧🇾',BE:'🇧🇪',BJ:'🇧🇯',BO:'🇧🇴',BA:'🇧🇦',BR:'🇧🇷',BG:'🇧🇬',BF:'🇧🇫',KH:'🇰🇭',CM:'🇨🇲',CA:'🇨🇦',TD:'🇹🇩',CL:'🇨🇱',CN:'🇨🇳',CO:'🇨🇴',CD:'🇨🇩',CR:'🇨🇷',HR:'🇭🇷',CU:'🇨🇺',CY:'🇨🇾',CZ:'🇨🇿',DK:'🇩🇰',DO:'🇩🇴',EC:'🇪🇨',EG:'🇪🇬',SV:'🇸🇻',ET:'🇪🇹',FI:'🇫🇮',FR:'🇫🇷',GE:'🇬🇪',DE:'🇩🇪',GH:'🇬🇭',GR:'🇬🇷',GT:'🇬🇹',HN:'🇭🇳',HK:'🇭🇰',HU:'🇭🇺',IS:'🇮🇸',IN:'🇮🇳',ID:'🇮🇩',IQ:'🇮🇶',IR:'🇮🇷',IE:'🇮🇪',IL:'🇮🇱',IT:'🇮🇹',JM:'🇯🇲',JP:'🇯🇵',JO:'🇯🇴',KZ:'🇰🇿',KE:'🇰🇪',KW:'🇰🇼',KG:'🇰🇬',LA:'🇱🇦',LV:'🇱🇻',LB:'🇱🇧',LY:'🇱🇾',LT:'🇱🇹',LU:'🇱🇺',MY:'🇲🇾',MV:'🇲🇻',ML:'🇲🇱',MT:'🇲🇹',MR:'🇲🇷',MX:'🇲🇽',MD:'🇲🇩',MN:'🇲🇳',ME:'🇲🇪',MA:'🇲🇦',MZ:'🇲🇿',MM:'🇲🇲',NP:'🇳🇵',NL:'🇳🇱',NZ:'🇳🇿',NI:'🇳🇮',NE:'🇳🇪',NG:'🇳🇬',NO:'🇳🇴',OM:'🇴🇲',PK:'🇵🇰',PS:'🇵🇸',PA:'🇵🇦',PY:'🇵🇾',PE:'🇵🇪',PH:'🇵🇭',PL:'🇵🇱',PT:'🇵🇹',QA:'🇶🇦',RO:'🇷🇴',RU:'🇷🇺',SA:'🇸🇦',SN:'🇸🇳',RS:'🇷🇸',SG:'🇸🇬',SK:'🇸🇰',SI:'🇸🇮',SO:'🇸🇴',ZA:'🇿🇦',KR:'🇰🇷',ES:'🇪🇸',LK:'🇱🇰',SD:'🇸🇩',SE:'🇸🇪',CH:'🇨🇭',SY:'🇸🇾',TW:'🇹🇼',TJ:'🇹🇯',TZ:'🇹🇿',TH:'🇹🇭',TN:'🇹🇳',TR:'🇹🇷',TM:'🇹🇲',UG:'🇺🇬',UA:'🇺🇦',AE:'🇦🇪',GB:'🇬🇧',US:'🇺🇸',UY:'🇺🇾',UZ:'🇺🇿',VE:'🇻🇪',VN:'🇻🇳',YE:'🇾🇪',ZM:'🇿🇲',ZW:'🇿🇼'};
              /* کشورهای اولویت‌دار بالای لیست */
              const PRIORITY = ['IQ','IR','PK','AZ','TR','RU','AF','TJ','UZ','SA','AE','KW','QA','BH','OM','SY','LB','JO','EG','MA'];
              const allCodes = Object.keys(COUNTRIES);
              const rest = allCodes.filter(c => !PRIORITY.includes(c)).sort((a,b) => (COUNTRIES[a][lang]||COUNTRIES[a].en).localeCompare(COUNTRIES[b][lang]||COUNTRIES[b].en));
              const ordered = [...PRIORITY.filter(c=>COUNTRIES[c]), ...rest];
              return ordered.map(code => {
                const name = COUNTRIES[code][lang] || COUNTRIES[code].en;
                const flag = FLAGS[code] || '🌐';
                return `<option value="${code}">${flag} ${name}</option>`;
              }).join('');
            })()}
          </select>
        </div>
      ` : ''}

      <button class="auth-submit-btn" id="auth-submit-btn" type="button">
        ${tx(AUTH_COPY.sendOtp)}
      </button>
    `;
  }

  /* ── OTP صفحه ── */
  function _renderOTP() {
    return `
      <div class="otp-section">
        <div class="otp-header">
          <span class="otp-email-icon" aria-hidden="true">📧</span>
          <h2 class="auth-card__heading">${tx(AUTH_COPY.verifyOtp)}</h2>
          <p class="otp-sent-to">
            ${tx(AUTH_COPY.otpSent)}<br/>
            <strong>${_email}</strong>
          </p>
        </div>

        <!-- ۶ کادر OTP -->
        <div class="otp-inputs" role="group" aria-label="کد تأیید ۶ رقمی" dir="ltr">
          ${Array.from({length: 6}).map((_, i) => `
            <input
              type="text"
              inputmode="numeric"
              maxlength="1"
              class="otp-input"
              aria-label="رقم ${i + 1}"
              autocomplete="${i === 0 ? 'one-time-code' : 'off'}"
            />
          `).join('')}
        </div>

        <!-- تایمر -->
        <div class="otp-timer" aria-live="polite">
          <span id="otp-timer-text"></span>
          <button class="otp-resend-btn" id="otp-resend-btn" disabled type="button">
            ${tx(AUTH_COPY.resendOtp)}
          </button>
        </div>

        <div class="auth-error-msg" id="otp-error" style="display:none" role="alert">
          ⚠ ${tx(AUTH_COPY.otpInvalid)}
        </div>

        <button class="auth-submit-btn" id="otp-verify-btn" type="button">
          ${tx(AUTH_COPY.verifyOtp)}
        </button>

        <!-- برگشت -->
        <div style="text-align:center; margin-top: var(--space-5);">
          <button id="otp-back-btn" type="button" style="
            background:none; border:none; color:var(--text-muted);
            font-size:var(--text-sm); cursor:pointer; text-decoration:underline;
            text-underline-offset:3px;
          ">
            ← ${tx({ fa:'تغییر ایمیل', ar:'تغيير البريد', ur:'ای میل تبدیل کریں', en:'Change Email', tr:'E-postayı Değiştir', ru:'Изменить email', az:'E-poçtu dəyişdir', id:'Ganti Email' })}
          </button>
        </div>
      </div>
    `;
  }

  /* ── Bind form events ── */
  function _bindFormEvents() {
    /* Tabs */
    container.querySelectorAll('.auth-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        _mode = tab.dataset.mode;
        _render();
      });
    });

    /* Google */
    document.getElementById('google-btn')?.addEventListener('click', _handleGoogleLogin);

    /* Submit */
    document.getElementById('auth-submit-btn')?.addEventListener('click', _handleEmailSubmit);

    /* Enter */
    container.querySelectorAll('.auth-input').forEach(inp => {
      inp.addEventListener('keydown', e => { if (e.key === 'Enter') _handleEmailSubmit(); });
    });
  }

  /* ── Bind OTP events ── */
  function _bindOTPEvents() {
    let _code = '';

    initOTPInputs(
      container.querySelector('.otp-inputs'),
      (code) => { _code = code; }
    );

    /* Timer ۱۲۰ ثانیه */
    const timerEl  = document.getElementById('otp-timer-text');
    const resendBtn = document.getElementById('otp-resend-btn');
    const timer = new OTPTimer(
      120,
      (rem) => {
        if (timerEl) timerEl.textContent = `${tx({ fa:'ارسال مجدد تا', ar:'إعادة الإرسال بعد', ur:'دوبارہ بھیجیں', en:'Resend in', tr:'Yeniden gönder', ru:'Отправить снова через', az:'Yenidən göndər', id:'Kirim ulang dalam' })} ${Math.floor(rem/60).toString().padStart(2,'0')}:${(rem%60).toString().padStart(2,'0')} `;
      },
      () => {
        if (resendBtn) resendBtn.disabled = false;
        if (timerEl)  timerEl.textContent = '';
      }
    );
    timer.start();

    resendBtn?.addEventListener('click', async () => {
      resendBtn.disabled = true;
      await _sendOTP(_email);
      timer.reset(120);
    });

    document.getElementById('otp-verify-btn')?.addEventListener('click', () => _handleOTPVerify(_code));
    document.getElementById('otp-back-btn')?.addEventListener('click', () => {
      timer.stop();
      _step = 'form';
      _render();
    });
  }

  /* ── Handlers ── */
  async function _handleEmailSubmit() {
    const emailEl  = document.getElementById('auth-email');
    const nameEl   = document.getElementById('auth-name');
    const emailErr = document.getElementById('email-error');
    const nameErr  = document.getElementById('name-error');
    const submitBtn = document.getElementById('auth-submit-btn');

    _email = emailEl?.value?.trim() ?? '';
    _name  = nameEl?.value?.trim()  ?? '';

    let valid = true;

    /* Validate */
    if (_mode === 'register' && !_name) {
      if (nameErr) nameErr.style.display = 'flex';
      nameEl?.classList.add('auth-input--error');
      valid = false;
    } else {
      if (nameErr) nameErr.style.display = 'none';
      nameEl?.classList.remove('auth-input--error');
    }

    if (_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(_email)) {
      if (emailErr) emailErr.style.display = 'flex';
      emailEl?.classList.add('auth-input--error');
      valid = false;
    } else {
      if (emailErr) emailErr.style.display = 'none';
      emailEl?.classList.remove('auth-input--error');
    }

    if (!valid) return;

    /* Loading */
    if (submitBtn) {
      submitBtn.classList.add('auth-submit-btn--loading');
      submitBtn.textContent = '...';
    }

    await _sendOTP(_email).catch(err => {
      if (submitBtn) {
        submitBtn.classList.remove('auth-submit-btn--loading');
        submitBtn.textContent = tx({ fa:'ارسال کد تأیید', ar:'إرسال رمز التحقق', ur:'تصدیقی کوڈ بھیجیں', en:'Send Verification Code', tr:'Doğrulama Kodu Gönder', ru:'Отправить код', az:'Doğrulama kodu göndər', id:'Kirim Kode' });
      }
      if (emailErr) {
        emailErr.style.display = 'flex';
        const span = emailErr.querySelector('span');
        if (span) span.textContent = err.message;
      }
      throw err;
    });
    _step = 'otp';
    _render();
  }

  async function _sendOTP(email) {
    const res = await fetch('/api/auth/send-otp', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email, lang: i18n.lang }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || tx({ fa:'خطا در ارسال کد', en:'Failed to send code', ar:'خطأ في إرسال الرمز', ur:'کوڈ بھیجنے میں خطا', tr:'Kod gönderilemedi', ru:'Ошибка отправки кода', az:'Kod göndərilmədi', id:'Gagal kirim kode' }));
    }
    return data;
  }

  async function _handleOTPVerify(code) {
    const verifyBtn = document.getElementById('otp-verify-btn');
    const otpErr    = document.getElementById('otp-error');
    const inputs    = container.querySelectorAll('.otp-input');

    if (code.length !== 6) {
      inputs.forEach(i => i.classList.add('error'));
      if (otpErr) otpErr.style.display = 'flex';
      setTimeout(() => inputs.forEach(i => i.classList.remove('error')), 600);
      return;
    }

    if (verifyBtn) {
      verifyBtn.classList.add('auth-submit-btn--loading');
      verifyBtn.textContent = '...';
    }

    /* API call واقعی */
    let data;
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          email:   _email,
          code,
          name:    _name,
          country: document.getElementById('auth-country')?.value || '',
        }),
      });
      data = await res.json();

      if (!res.ok) {
        /* کد اشتباه */
        inputs.forEach(i => i.classList.add('error'));
        if (otpErr) {
          otpErr.style.display = 'flex';
          otpErr.querySelector?.('span') && (otpErr.querySelector('span').textContent = data.error || tx({ fa:'کد اشتباه است', ar:'الرمز خاطئ', ur:'غلط کوڈ', en:'Invalid code', tr:'Hatalı kod', ru:'Неверный код', az:'Kod yanlışdır', id:'Kode salah' }));
        }
        setTimeout(() => inputs.forEach(i => i.classList.remove('error')), 600);
        if (verifyBtn) {
          verifyBtn.classList.remove('auth-submit-btn--loading');
          verifyBtn.textContent = tx({ fa:'تأیید کد', ar:'تأكيد الرمز', ur:'کوڈ تصدیق کریں', en:'Verify Code', tr:'Kodu Doğrula', ru:'Подтвердить', az:'Kodu təsdiqlə', id:'Verifikasi' });
        }
        return;
      }
    } catch {
      if (verifyBtn) {
        verifyBtn.classList.remove('auth-submit-btn--loading');
        verifyBtn.textContent = tx({ fa:'تأیید کد', ar:'تأكيد الرمز', ur:'کوڈ تصدیق کریں', en:'Verify Code', tr:'Kodu Doğrula', ru:'Подтвердить', az:'Kodu təsdiqlə', id:'Verifikasi' });
      }
      return;
    }

    /* ذخیره توکن و کاربر */
    AuthState.setToken(data.token);
    AuthState.setUser({ ...data.user, lang: i18n.lang, avatar: null });

    /* ریدایرکت به پروفایل */
    window.location.href = '/profile.html';
  }

  async function _handleGoogleLogin() {
    /* در production: Google OAuth redirect */
    console.log('[Auth] Google login initiated');
    alert(tx({ fa:'Google Login در نسخه production فعال می‌شود', ar:'Google Login سيُفعَّل في نسخة الإنتاج', en:'Google Login will be enabled in production', tr:'Google Login üretimde aktif olacak', ru:'Google Login будет активен в production', az:'Google Login tezliklə aktivləşdiriləcək', ur:'Google Login جلد فعال ہوگا', id:'Google Login akan aktif di versi produksi' }));
  }

  _render();
}

/* ────────────────────────────────────────────────────────────
   5. LOGOUT
   ──────────────────────────────────────────────────────────── */
export function logout() {
  AuthState.clear();
  window.location.href = '/auth.html';
}

/* ────────────────────────────────────────────────────────────
   6. AUTH GUARD (محافظت از صفحات)
   ──────────────────────────────────────────────────────────── */
export function requireAuth(redirectTo = '/auth.html') {
  if (!AuthState.isLoggedIn()) {
    window.location.href = redirectTo;
    return false;
  }
  return true;
}
