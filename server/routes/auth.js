/**
 * FILE: server/routes/auth.js
 * Google OAuth 2.0 — ورود با گوگل + ذخیره در D1
 */

import { Router }   from 'express';
import passport     from 'passport';
import jwt          from 'jsonwebtoken';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { generateToken } from '../middleware/auth.js';

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
    const user = {
      id:        profile.id,
      email:     profile.emails?.[0]?.value || '',
      name:      profile.displayName || '',
      avatar:    profile.photos?.[0]?.value || '',
      role:      'user',
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

export default router;
