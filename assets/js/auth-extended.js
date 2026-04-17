/**
 * ============================================================
 * FILE: auth-extended.js
 * ROLE: Google Sign-in + ثبت‌نام اجباری + سیستم جایزه خودکار
 * PROJECT: MediaHub — پلتفرم رسانه‌ای کربلا
 * VERSION: 1.0.0
 * DEPENDS ON: i18n.js, auth.js
 * ============================================================
 */

import { i18n } from './i18n.js';
import { AuthState } from './auth.js';

/* ────────────────────────────────────────────────────────────
   1. کشورها (برای dropdown ثبت‌نام)
   ──────────────────────────────────────────────────────────── */
export const COUNTRIES = [
  { code:'IQ', name:{ fa:'عراق',       ar:'العراق',      ur:'عراق',      en:'Iraq',           tr:'Irak',        ru:'Ирак',       az:'İraq'       }, flag:'🇮🇶', lang:'ar' },
  { code:'IR', name:{ fa:'ایران',       ar:'إيران',       ur:'ایران',     en:'Iran',           tr:'İran',        ru:'Иран',       az:'İran'       }, flag:'🇮🇷', lang:'fa' },
  { code:'PK', name:{ fa:'پاکستان',     ar:'باكستان',     ur:'پاکستان',   en:'Pakistan',       tr:'Pakistan',    ru:'Пакистан',   az:'Pakistan'   }, flag:'🇵🇰', lang:'ur' },
  { code:'AZ', name:{ fa:'آذربایجان',   ar:'أذربيجان',    ur:'آذربائیجان',en:'Azerbaijan',     tr:'Azerbaycan',  ru:'Азербайджан',az:'Azərbaycan' }, flag:'🇦🇿', lang:'az' },
  { code:'TR', name:{ fa:'ترکیه',       ar:'تركيا',       ur:'ترکیہ',     en:'Turkey',         tr:'Türkiye',     ru:'Турция',     az:'Türkiyə'    }, flag:'🇹🇷', lang:'tr' },
  { code:'RU', name:{ fa:'روسیه',       ar:'روسيا',       ur:'روس',       en:'Russia',         tr:'Rusya',       ru:'Россия',     az:'Rusiya'     }, flag:'🇷🇺', lang:'ru' },
  { code:'AF', name:{ fa:'افغانستان',   ar:'أفغانستان',   ur:'افغانستان', en:'Afghanistan',    tr:'Afganistan',  ru:'Афганистан', az:'Əfqanıstan' }, flag:'🇦🇫', lang:'fa' },
  { code:'TJ', name:{ fa:'تاجیکستان',  ar:'طاجيكستان',   ur:'تاجکستان',  en:'Tajikistan',     tr:'Tacikistan',  ru:'Таджикистан',az:'Tacikistan' }, flag:'🇹🇯', lang:'fa' },
  { code:'SA', name:{ fa:'عربستان',     ar:'المملكة العربية',ur:'سعودی عرب',en:'Saudi Arabia',  tr:'Suudi Arabistan',ru:'Саудовская Аравия',az:'Səudiyyə Ərəbistanı'}, flag:'🇸🇦', lang:'ar' },
  { code:'US', name:{ fa:'آمریکا',      ar:'الولايات المتحدة',ur:'امریکہ', en:'United States',  tr:'Amerika',     ru:'США',        az:'ABŞ'        }, flag:'🇺🇸', lang:'en' },
  { code:'GB', name:{ fa:'انگلیس',      ar:'المملكة المتحدة',ur:'برطانیہ', en:'United Kingdom', tr:'Birleşik Krallık',ru:'Великобритания',az:'Böyük Britaniya'}, flag:'🇬🇧', lang:'en' },
  { code:'DE', name:{ fa:'آلمان',       ar:'ألمانيا',     ur:'جرمنی',     en:'Germany',        tr:'Almanya',     ru:'Германия',   az:'Almaniya'   }, flag:'🇩🇪', lang:'en' },
  { code:'OTHER', name:{ fa:'سایر کشورها',ar:'دول أخرى', ur:'دیگر ممالک', en:'Other',         tr:'Diğer',       ru:'Другие',     az:'Digər'      }, flag:'🌍', lang:'en' },
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
    title:    { fa:'خوش آمدید به مدیاهاب', ar:'مرحباً بك في ميدياهاب', ur:'میڈیاہب میں خوش آمدید', az:'MediaHub-a xoş gəldiniz', tr:'MediaHub\'a Hoş Geldiniz', ru:'Добро пожаловать в MediaHub', en:'Welcome to MediaHub' },
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
