/**
 * ============================================================
 * FILE: auth.js
 * ROLE: ثبت‌نام، ورود، OTP، Google Login
 * PROJECT: MediaHub — پلتفرم رسانه‌ای کربلا
 * VERSION: 1.0.0
 * DEPENDS ON: i18n.js, theme.js
 * ============================================================
 */

import { i18n, t } from './i18n.js';

/* ────────────────────────────────────────────────────────────
   ترجمه‌های اختصاصی این ماژول
   ──────────────────────────────────────────────────────────── */
const AUTH_COPY = {
  login:         { fa:'ورود', ar:'تسجيل الدخول', ur:'لاگ ان', az:'Daxil ol', tr:'Giriş', ru:'Войти', en:'Login' },
  register:      { fa:'ثبت‌نام', ar:'التسجيل', ur:'رجسٹر', az:'Qeydiyyat', tr:'Kayıt Ol', ru:'Регистрация', en:'Register' },
  fullName:      { fa:'نام کامل', ar:'الاسم الكامل', ur:'پورا نام', az:'Tam adınız', tr:'Tam Adınız', ru:'Полное имя', en:'Full Name' },
  email:         { fa:'آدرس ایمیل', ar:'البريد الإلكتروني', ur:'ای میل', az:'E-poçt', tr:'E-posta', en:'Email', ru:'Эл. почта' },
  country:       { fa:'کشور (اختیاری)', ar:'الدولة (اختياري)', ur:'ملک (اختیاری)', az:'Ölkə (ixtiyari)', tr:'Ülke (İsteğe Bağlı)', ru:'Страна (необязательно)', en:'Country (Optional)' },
  sendOtp:       { fa:'ارسال کد تأیید', ar:'إرسال رمز التحقق', ur:'تصدیقی کوڈ بھیجیں', az:'Doğrulama kodu göndər', tr:'Doğrulama Kodu Gönder', ru:'Отправить код', en:'Send Verification Code' },
  verifyOtp:     { fa:'تأیید کد', ar:'تأكيد الرمز', ur:'کوڈ تصدیق کریں', az:'Kodu təsdiqlə', tr:'Kodu Doğrula', ru:'Подтвердить код', en:'Verify Code' },
  otpSent:       { fa:'کد به ایمیل شما ارسال شد', ar:'تم إرسال الرمز إلى بريدك', ur:'کوڈ آپ کے ای میل پر بھیجا گیا', az:'Kod e-poçtunuza göndərildi', tr:'Kod e-postanıza gönderildi', ru:'Код отправлен на вашу почту', en:'Code sent to your email' },
  resendOtp:     { fa:'ارسال مجدد کد', ar:'إعادة إرسال الرمز', ur:'کوڈ دوبارہ بھیجیں', az:'Kodu yenidən göndər', tr:'Kodu Yeniden Gönder', ru:'Отправить снова', en:'Resend Code' },
  continueGoogle:{ fa:'ادامه با گوگل', ar:'المتابعة بجوجل', ur:'گوگل سے جاری رہیں', az:'Google ilə davam et', tr:'Google ile Devam Et', ru:'Войти через Google', en:'Continue with Google' },
  orEmail:       { fa:'یا با ایمیل', ar:'أو بالبريد الإلكتروني', ur:'یا ای میل سے', az:'Və ya e-poçtla', tr:'veya E-posta ile', ru:'или по Email', en:'or with Email' },
  namePlaceholder:{ fa:'مثلاً: علی محمدی', ar:'مثال: محمد أحمد', ur:'مثلاً: احمد علی', az:'Məs: Əli Əliyev', tr:'Örn: Ahmet Yılmaz', ru:'Напр: Алексей Иванов', en:'e.g. John Smith' },
  emailInvalid:  { fa:'ایمیل معتبر وارد کنید', ar:'أدخل بريداً صحيحاً', ur:'درست ای میل درج کریں', az:'Düzgün e-poçt daxil edin', tr:'Geçerli e-posta girin', ru:'Введите корректный email', en:'Enter a valid email' },
  nameRequired:  { fa:'نام الزامی است', ar:'الاسم مطلوب', ur:'نام ضروری ہے', az:'Ad tələb olunur', tr:'Ad zorunludur', ru:'Имя обязательно', en:'Name is required' },
  otpInvalid:    { fa:'کد اشتباه است', ar:'الرمز خاطئ', ur:'غلط کوڈ', az:'Kod yanlışdır', tr:'Hatalı kod', ru:'Неверный код', en:'Invalid code' },
  welcomeBack:   { fa:'خوش برگشتید', ar:'مرحباً بعودتك', ur:'خوش آمدید واپس', az:'Xoş gəldiniz', tr:'Tekrar Hoş Geldiniz', ru:'С возвращением', en:'Welcome Back' },
  visualTitle:   { fa:'به خانواده مدیاهاب خوش آمدید', ar:'مرحباً بك في عائلة ميدياهاب', ur:'میڈیاہب خاندان میں خوش آمدید', az:'MediaHub ailəsinə xoş gəldiniz', tr:'MediaHub Ailesine Hoş Geldiniz', ru:'Добро пожаловать в MediaHub', en:'Welcome to MediaHub Family' },
  visualDesc:    { fa:'تدبر در قرآن، دعا، زیارت و ارتباط با کربلا — همه در یک پلتفرم', ar:'التدبر في القرآن والدعاء والزيارة والتواصل مع كربلاء', ur:'قرآن تدبر، دعا، زیارت اور کربلا سے رابطہ', az:'Quran təfəkkürü, dua, ziyarət', tr:'Kuran tefekkürü, dua, ziyaret', ru:'Размышление над Кораном, молитвы, паломничество', en:'Quran reflection, prayer, pilgrimage — all in one platform' },
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
                <span class="auth-visual__stat-lbl">${{ fa:'مقاله', ar:'مقالة', ur:'مضمون', en:'Articles', tr:'Makale', ru:'Статей', az:'Məqalə' }[i18n.lang] ?? 'مقاله'}</span>
              </div>
              <div class="auth-visual__stat">
                <span class="auth-visual__stat-num">۸۲K</span>
                <span class="auth-visual__stat-lbl">${{ fa:'کاربر', ar:'مستخدم', ur:'صارف', en:'Users', tr:'Kullanıcı', ru:'Пользователей', az:'İstifadəçi', id:'Pengguna' }[i18n.lang] ?? 'کاربر'}</span>
              </div>
              <div class="auth-visual__stat">
                <span class="auth-visual__stat-num">۷</span>
                <span class="auth-visual__stat-lbl">${{ fa:'زبان', ar:'لغة', ur:'زبان', en:'Languages', tr:'Dil', ru:'Языков', az:'Dil' }[i18n.lang] ?? 'زبان'}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Form سمت راست -->
        <div class="auth-form-side">
          <div class="auth-card">

            <!-- Logo -->
            <a href="/" class="auth-card__logo" aria-label="مدیاهاب">
              <svg width="36" height="36" viewBox="0 0 32 32" fill="none" aria-hidden="true">
                <rect width="32" height="32" rx="8" fill="var(--color-primary-500)"/>
                <path d="M8 22V10l8 6 8-6v12" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <span class="auth-card__logo-text">مدیاهاب</span>
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
            <option value="">—</option>
            <option value="IQ">🇮🇶 العراق</option>
            <option value="IR">🇮🇷 ایران</option>
            <option value="PK">🇵🇰 Pakistan</option>
            <option value="AZ">🇦🇿 Azərbaycan</option>
            <option value="TR">🇹🇷 Türkiye</option>
            <option value="RU">🇷🇺 Россия</option>
            <option value="US">🇺🇸 United States</option>
            <option value="GB">🇬🇧 United Kingdom</option>
            <option value="DE">🇩🇪 Deutschland</option>
            <option value="OTHER">${tx({ fa:'سایر کشورها', ar:'دول أخرى', ur:'دیگر ممالک', en:'Other Countries', tr:'Diğer Ülkeler', ru:'Другие страны', az:'Digər ölkələr' })}</option>
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
            ← ${tx({ fa:'تغییر ایمیل', ar:'تغيير البريد', ur:'ای میل تبدیل کریں', en:'Change Email', tr:'E-postayı Değiştir', ru:'Изменить email', az:'E-poçtu dəyişdir' })}
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
        if (timerEl) timerEl.textContent = `${tx({ fa:'ارسال مجدد تا', ar:'إعادة الإرسال بعد', ur:'دوبارہ بھیجیں', en:'Resend in', tr:'Yeniden gönder', ru:'Отправить снова через', az:'Yenidən göndər' })} ${Math.floor(rem/60).toString().padStart(2,'0')}:${(rem%60).toString().padStart(2,'0')} `;
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

    if (!_email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(_email)) {
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

    await _sendOTP(_email);
    _step = 'otp';
    _render();
  }

  async function _sendOTP(email) {
    /* اینجا API call واقعی قرار می‌گیرد */
    console.log(`[Auth] Sending OTP to ${email}`);
    /* شبیه‌سازی تأخیر */
    await new Promise(r => setTimeout(r, 800));
    /* در production: await fetch('/api/auth/send-otp', { method:'POST', body: JSON.stringify({email}) }) */
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

    /* شبیه‌سازی تأیید */
    await new Promise(r => setTimeout(r, 900));

    /* در production: const res = await fetch('/api/auth/verify-otp', {...}) */
    /* شبیه‌سازی موفق */
    const fakeUser = {
      id:      'u_' + Math.random().toString(36).slice(2),
      name:    _name || tx({ fa:'کاربر', ar:'مستخدم', ur:'صارف', en:'User', tr:'Kullanıcı', ru:'Пользователь', az:'İstifadəçi', id:'Pengguna' }),
      email:   _email,
      lang:    i18n.lang,
      country: document.getElementById('auth-country')?.value || '',
      avatar:  null,
      joinedAt: new Date().toISOString(),
    };
    AuthState.setUser(fakeUser);
    AuthState.setToken('fake_token_' + Date.now());

    /* ریدایرکت به پروفایل */
    window.location.href = '/profile.html';
  }

  async function _handleGoogleLogin() {
    /* در production: Google OAuth redirect */
    console.log('[Auth] Google login initiated');
    alert(tx({ fa:'Google Login در نسخه production فعال می‌شود', ar:'Google Login سيُفعَّل في نسخة الإنتاج', en:'Google Login will be enabled in production', tr:'Google Login üretimde aktif olacak', ru:'Google Login будет активен в production', az:'Google Login tezliklə aktivləşdiriləcək', ur:'Google Login جلد فعال ہوگا' }));
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
