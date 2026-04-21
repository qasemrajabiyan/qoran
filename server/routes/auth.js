/**
 * ============================================================
 * FILE: server/routes/auth.js
 * ROLE: Google OAuth 2.0 — ورود با گوگل + ذخیره در D1
 * PROJECT: BarakatHub Karbala Backend
 * VERSION: 2.0.0  (D1 integration)
 * ============================================================
 * تغییرات نسبت به نسخه قبل:
 *   - ذخیره کاربر در جدول users دیتابیس D1
 *   - بررسی وجود کاربر قبلی (upsert)
 *   - بلاک کاربران غیرفعال
 * بقیه کدها دست‌نخورده باقی مانده.
 * ============================================================
 */

import { Router }   from 'express';
import { createHash, randomBytes, timingSafeEqual } from 'crypto';
import passport     from 'passport';
import jwt          from 'jsonwebtoken';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { generateToken } from '../middleware/auth.js';
import { dbGet, dbRun }  from '../db/client.js';

const router = Router();

/* ═══════════════════════════════════════
   تنظیم Google Strategy
═══════════════════════════════════════ */
passport.use(new GoogleStrategy({
  clientID:     process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL:  process.env.GOOGLE_CALLBACK_URL,
},
async (accessToken, refreshToken, profile, done) => {
  try {
    const googleId = profile.id;
    const email    = profile.emails?.[0]?.value || '';
    const name     = profile.displayName        || '';
    const avatar   = profile.photos?.[0]?.value || '';

    /* ── ذخیره یا به‌روزرسانی کاربر در D1 ── */
    try {
      await dbRun(
        `INSERT INTO users (id, email, name, avatar, role, is_active)
         VALUES (?, ?, ?, ?, 'user', 1)
         ON CONFLICT(id) DO UPDATE SET
           email      = excluded.email,
           name       = excluded.name,
           avatar     = excluded.avatar,
           updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')`,
        [googleId, email, name, avatar]
      );
    } catch (dbErr) {
      /* اگر D1 در دسترس نبود، ادامه بده — سرور بدون DB هم کار می‌کند */
      console.warn('[Auth] D1 upsert failed (non-fatal):', dbErr.message);
    }

    /* ── بررسی بن بودن کاربر ── */
    let dbUser = null;
    try {
      dbUser = await dbGet('SELECT role, is_active FROM users WHERE id = ?', [googleId]);
    } catch {}

    if (dbUser && dbUser.is_active === 0) {
      return done(null, false, { message: 'حساب شما مسدود شده است' });
    }

    const user = {
      id:     googleId,
      email,
      name,
      avatar,
      role:   dbUser?.role || 'user',
    };

    done(null, user);
  } catch (err) {
    done(err, null);
  }
}));

passport.serializeUser((user, done)   => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

/* ═══════════════════════════════════════
   GET /api/auth/google — شروع ورود
═══════════════════════════════════════ */
router.get('/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    prompt: 'select_account',
  })
);

/* ═══════════════════════════════════════
   GET /api/auth/google/callback — بازگشت از گوگل
═══════════════════════════════════════ */
router.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/auth.html?error=google' }),
  async (req, res) => {
    try {
      const user  = req.user;
      const token = generateToken(user);

      /* ریدایرکت به frontend با توکن */
      res.redirect(`/auth-success.html?token=${token}&name=${encodeURIComponent(user.name)}&email=${encodeURIComponent(user.email)}&avatar=${encodeURIComponent(user.avatar)}&id=${user.id}`);

    } catch (err) {
      console.error('[Google Callback]', err);
      res.redirect('/auth.html?error=server');
    }
  }
);

/* ═══════════════════════════════════════
   GET /api/auth/me — اطلاعات کاربر جاری
═══════════════════════════════════════ */
router.get('/me', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ success: false, error: 'Unauthorized' });
  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);
    res.json({ success: true, user });
  } catch {
    res.status(401).json({ success: false, error: 'Invalid token' });
  }
});

/* ═══════════════════════════════════════
   POST /api/auth/logout
═══════════════════════════════════════ */
router.post('/logout', (req, res) => {
  res.json({ success: true, message: 'خروج موفق' });
});

/* ═══════════════════════════════════════
   توابع کمکی هش رمز ادمین (SHA-256 + salt)
═══════════════════════════════════════ */
const ADMIN_PASS_KEY = 'mh_admin_pass_hash';
const ADMIN_SALT_KEY = 'mh_admin_pass_salt';

/* ذخیره هش رمز در متغیر محیطی runtime (in-memory برای این نسخه) */
let _adminPassHash = process.env.ADMIN_PASS_HASH || null;
let _adminSalt     = process.env.ADMIN_PASS_SALT || null;

function _hashPassword(password, salt) {
  return createHash('sha256').update(salt + password + salt).digest('hex');
}

function _getAdminHash() {
  if (_adminPassHash && _adminSalt) return { hash: _adminPassHash, salt: _adminSalt };
  /* اگر هنوز رمز ست نشده، از ADMIN_API_KEY در .env استفاده می‌کنیم */
  const defaultPass = process.env.ADMIN_API_KEY || 'BarakatHub2026admin';
  const salt = randomBytes(16).toString('hex');
  const hash = _hashPassword(defaultPass, salt);
  _adminPassHash = hash;
  _adminSalt     = salt;
  return { hash, salt };
}

/* ═══════════════════════════════════════
   POST /api/auth/admin-login
═══════════════════════════════════════ */
router.post('/admin-login', (req, res) => {
  const { password } = req.body;
  if (!password) return res.status(400).json({ success: false, error: 'رمز الزامی است' });

  const { hash, salt } = _getAdminHash();
  const inputHash = _hashPassword(password, salt);

  const isValid = timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(inputHash, 'hex'));
  if (!isValid) return res.status(401).json({ success: false, error: 'رمز اشتباه است' });

  const token = 'admin_' + randomBytes(32).toString('hex');
  /* ذخیره توکن در حافظه (TTL: 8 ساعت) */
  if (!global._adminTokens) global._adminTokens = new Map();
  global._adminTokens.set(token, Date.now() + 8 * 60 * 60 * 1000);

  res.json({ success: true, token });
});

/* ═══════════════════════════════════════
   POST /api/auth/admin-change-password
═══════════════════════════════════════ */
router.post('/admin-change-password', (req, res) => {
  const token = req.headers['x-admin-token'];
  if (!token) return res.status(401).json({ success: false, error: 'احراز هویت نشده' });

  /* بررسی توکن */
  const tokens = global._adminTokens;
  if (!tokens || !tokens.has(token) || tokens.get(token) < Date.now()) {
    return res.status(401).json({ success: false, error: 'نشست منقضی شده، دوباره وارد شوید' });
  }

  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ success: false, error: 'همه فیلدها الزامی هستند' });
  }
  if (newPassword.length < 8) {
    return res.status(400).json({ success: false, error: 'رمز جدید باید حداقل ۸ کاراکتر باشد' });
  }

  /* بررسی رمز فعلی */
  const { hash, salt } = _getAdminHash();
  const currentHash = _hashPassword(currentPassword, salt);
  const isValid = timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(currentHash, 'hex'));
  if (!isValid) return res.status(401).json({ success: false, error: 'رمز فعلی اشتباه است' });

  /* ذخیره رمز جدید (هش‌شده) */
  const newSalt = randomBytes(16).toString('hex');
  const newHash = _hashPassword(newPassword, newSalt);
  _adminPassHash = newHash;
  _adminSalt     = newSalt;

  res.json({ success: true, message: 'رمز با موفقیت تغییر کرد' });
});

export default router;
