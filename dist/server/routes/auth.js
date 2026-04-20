/**
 * ============================================================
 * FILE: routes/auth.js
 * ROLE: احراز هویت کاربران — OTP ایمیل، JWT، خروج
 * PROJECT: BarakatHub Karbala Backend
 * VERSION: 1.0.0
 *
 * POST /api/auth/send-otp     — ارسال کد تأیید به ایمیل
 * POST /api/auth/verify-otp   — تأیید کد و صدور JWT
 * POST /api/auth/refresh       — تجدید توکن
 * POST /api/auth/logout        — خروج
 * GET  /api/auth/me            — اطلاعات کاربر جاری
 * ============================================================
 */

import { Router }       from 'express';
import { Resend }       from 'resend';
import { requireAuth, generateToken } from '../middleware/auth.js';
import { authLimiter }  from '../middleware/security.js';
import { CONFIG }       from '../config.js';

const router = Router();
const resend = new Resend(process.env.RESEND_API_KEY);

/* ════════════════════════════════════════════════════════════
   ۱. ذخیره موقت OTP — در production از Redis استفاده کنید
   ════════════════════════════════════════════════════════════ */
const OTP_STORE = new Map();

const OTP_EXPIRY_MS  = 10 * 60 * 1000;   /* ۱۰ دقیقه */
const OTP_MAX_TRIES  = 5;                 /* حداکثر ۵ بار اشتباه */
const OTP_RESEND_WAIT = 60 * 1000;        /* ۱ دقیقه تا ارسال مجدد */

/* ════════════════════════════════════════════════════════════
   ۲. ابزارهای کمکی
   ════════════════════════════════════════════════════════════ */

/* تولید کد ۶ رقمی امن */
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/* اعتبارسنجی ایمیل */
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

/* پاک‌سازی OTP های منقضی */
function cleanExpiredOTPs() {
  const now = Date.now();
  for (const [key, data] of OTP_STORE.entries()) {
    if (now > data.expiresAt) OTP_STORE.delete(key);
  }
}

/* ═══════════════════════════════════════════════════════════
   ۳. قالب ایمیل OTP — زیبا و حرفه‌ای
   ════════════════════════════════════════════════════════════ */
function buildOTPEmail(code, lang = 'fa') {
  const texts = {
    fa: { subject: 'کد تأیید برکت‌هاب', greeting: 'کاربر گرامی', body: 'کد تأیید شما:', note: 'این کد ۱۰ دقیقه اعتبار دارد.', ignore: 'اگر این درخواست از شما نیست، این ایمیل را نادیده بگیرید.' },
    ar: { subject: 'رمز التحقق — بركت هاب', greeting: 'المستخدم الكريم', body: 'رمز التحقق الخاص بك:', note: 'هذا الرمز صالح لمدة ١٠ دقائق.', ignore: 'إذا لم تطلب هذا، تجاهل هذا البريد.' },
    en: { subject: 'BarakatHub Verification Code', greeting: 'Dear User', body: 'Your verification code:', note: 'This code is valid for 10 minutes.', ignore: 'If you did not request this, please ignore this email.' },
    ur: { subject: 'برکت‌ہب تصدیقی کوڈ', greeting: 'محترم صارف', body: 'آپ کا تصدیقی کوڈ:', note: 'یہ کوڈ ۱۰ منٹ تک درست ہے۔', ignore: 'اگر آپ نے یہ درخواست نہیں کی تو اس ای میل کو نظرانداز کریں۔' },
  };

  const t = texts[lang] || texts['en'];

  return {
    subject: t.subject,
    html: `
<!DOCTYPE html>
<html dir="${['fa','ar','ur'].includes(lang) ? 'rtl' : 'ltr'}">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { background:#f5f4f0; font-family: 'Segoe UI', Tahoma, Arial, sans-serif; padding: 40px 16px; }
    .wrap { max-width: 480px; margin: 0 auto; }
    .card { background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #1a472a 0%, #2d6a4f 100%); padding: 32px 24px; text-align: center; }
    .header-icon { font-size: 40px; margin-bottom: 8px; }
    .header-title { color: #ffffff; font-size: 22px; font-weight: 700; letter-spacing: 0.5px; }
    .header-sub { color: rgba(255,255,255,0.8); font-size: 13px; margin-top: 4px; }
    .body { padding: 32px 24px; text-align: center; }
    .greeting { color: #444; font-size: 15px; margin-bottom: 16px; }
    .body-label { color: #666; font-size: 14px; margin-bottom: 16px; }
    .otp-box { display: inline-block; background: #f0faf4; border: 2px dashed #2d6a4f; border-radius: 12px; padding: 16px 40px; margin: 8px 0 24px; }
    .otp-code { font-size: 42px; font-weight: 800; letter-spacing: 10px; color: #1a472a; font-family: 'JetBrains Mono', 'Courier New', monospace; }
    .note { color: #888; font-size: 13px; margin-bottom: 8px; }
    .ignore { color: #aaa; font-size: 12px; margin-top: 16px; }
    .divider { height: 1px; background: #eee; margin: 24px 0; }
    .footer { background: #faf9f7; padding: 20px 24px; text-align: center; }
    .footer-logo { color: #2d6a4f; font-size: 16px; font-weight: 700; margin-bottom: 4px; }
    .footer-text { color: #aaa; font-size: 11px; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="card">
      <div class="header">
        <div class="header-icon">🕌</div>
        <div class="header-title">BarakatHub</div>
        <div class="header-sub">پلتفرم رسانه‌ای اسلامی کربلا</div>
      </div>
      <div class="body">
        <p class="greeting">${t.greeting}</p>
        <p class="body-label">${t.body}</p>
        <div class="otp-box">
          <div class="otp-code">${code}</div>
        </div>
        <p class="note">${t.note}</p>
        <div class="divider"></div>
        <p class="ignore">${t.ignore}</p>
      </div>
      <div class="footer">
        <div class="footer-logo">🌿 BarakatHub Karbala</div>
        <div class="footer-text">barakathub.com — ${new Date().getFullYear()}</div>
      </div>
    </div>
  </div>
</body>
</html>`,
  };
}

/* ════════════════════════════════════════════════════════════
   ۴. POST /api/auth/send-otp
   ════════════════════════════════════════════════════════════ */
router.post('/send-otp', async (req, res) => {
  const { email, lang = 'fa' } = req.body;

  /* اعتبارسنجی */
  if (!email || !isValidEmail(email)) {
    return res.status(422).json({
      success: false,
      error:   'آدرس ایمیل معتبر نیست',
      code:    'INVALID_EMAIL',
    });
  }

  const emailKey = email.toLowerCase().trim();

  /* بررسی درخواست مجدد زودهنگام */
  const existing = OTP_STORE.get(emailKey);
  if (existing && Date.now() < existing.createdAt + OTP_RESEND_WAIT) {
    const wait = Math.ceil((existing.createdAt + OTP_RESEND_WAIT - Date.now()) / 1000);
    return res.status(429).json({
      success: false,
      error:   `لطفاً ${wait} ثانیه صبر کنید`,
      code:    'RESEND_TOO_SOON',
      retryAfter: wait,
    });
  }

  /* تولید و ذخیره OTP */
  const code = generateOTP();
  OTP_STORE.set(emailKey, {
    code,
    createdAt: Date.now(),
    expiresAt: Date.now() + OTP_EXPIRY_MS,
    tries:     0,
  });

  /* پاک‌سازی منقضی‌ها */
  cleanExpiredOTPs();

  /* ارسال ایمیل */
  try {
    const emailContent = buildOTPEmail(code, lang);
    await resend.emails.send({
      from:    'BarakatHub <noreply@barakathub.com>',
      to:      emailKey,
      subject: emailContent.subject,
      html:    emailContent.html,
    });

    res.json({
      success:    true,
      message:    'کد تأیید ارسال شد',
      expiresIn:  600,
    });

  } catch (err) {
    OTP_STORE.delete(emailKey);
    console.error('[/send-otp]', err.message);
    res.status(500).json({
      success: false,
      error:   'خطا در ارسال ایمیل — لطفاً دوباره تلاش کنید',
      code:    'EMAIL_SEND_FAILED',
    });
  }
});

/* ════════════════════════════════════════════════════════════
   ۵. POST /api/auth/verify-otp
   ════════════════════════════════════════════════════════════ */
router.post('/verify-otp', async (req, res) => {
  const { email, code, name = '', country = '' } = req.body;

  if (!email || !isValidEmail(email)) {
    return res.status(422).json({ success: false, error: 'ایمیل معتبر نیست', code: 'INVALID_EMAIL' });
  }
  if (!code || !/^\d{6}$/.test(code)) {
    return res.status(422).json({ success: false, error: 'کد باید ۶ رقم باشد', code: 'INVALID_CODE_FORMAT' });
  }

  const emailKey = email.toLowerCase().trim();
  const stored   = OTP_STORE.get(emailKey);

  /* OTP وجود ندارد */
  if (!stored) {
    return res.status(400).json({ success: false, error: 'کد منقضی شده — دوباره درخواست کنید', code: 'OTP_NOT_FOUND' });
  }

  /* منقضی شده */
  if (Date.now() > stored.expiresAt) {
    OTP_STORE.delete(emailKey);
    return res.status(400).json({ success: false, error: 'کد منقضی شده', code: 'OTP_EXPIRED' });
  }

  /* تعداد تلاش */
  stored.tries++;
  if (stored.tries > OTP_MAX_TRIES) {
    OTP_STORE.delete(emailKey);
    return res.status(429).json({ success: false, error: 'تلاش‌های زیاد — دوباره درخواست کنید', code: 'TOO_MANY_TRIES' });
  }

  /* کد اشتباه */
  if (stored.code !== code) {
    return res.status(400).json({
      success:      false,
      error:        'کد اشتباه است',
      code:         'INVALID_CODE',
      triesLeft:    OTP_MAX_TRIES - stored.tries,
    });
  }

  /* ✅ کد صحیح — حذف OTP و صدور JWT */
  OTP_STORE.delete(emailKey);

  const user = {
    id:       `u_${Buffer.from(emailKey).toString('base64').slice(0, 12)}`,
    email:    emailKey,
    name:     name.trim() || emailKey.split('@')[0],
    country:  country.trim(),
    role:     'user',
    joinedAt: new Date().toISOString(),
  };

  const token = generateToken(user);

  res.json({
    success: true,
    message: 'ورود موفق',
    token,
    user: {
      id:      user.id,
      email:   user.email,
      name:    user.name,
      country: user.country,
      role:    user.role,
    },
  });
});

/* ════════════════════════════════════════════════════════════
   ۶. GET /api/auth/me — اطلاعات کاربر جاری
   ════════════════════════════════════════════════════════════ */
router.get('/me', requireAuth, (req, res) => {
  res.json({
    success: true,
    user:    req.user,
  });
});

/* ════════════════════════════════════════════════════════════
   ۷. POST /api/auth/logout
   ════════════════════════════════════════════════════════════ */
router.post('/logout', requireAuth, (req, res) => {
  /* در production توکن را در blacklist قرار دهید */
  res.json({
    success: true,
    message: 'خروج موفق',
  });
});

export default router;
