/**
 * ============================================================
 * FILE: middleware/auth.js
 * ROLE: احراز هویت JWT — محافظت از روت‌های محدود
 * PROJECT: BarakatHub Karbala Backend
 * VERSION: 1.0.0
 * ============================================================
 */

import jwt from 'jsonwebtoken';

/* ════════════════════════════════════════════════════════════
   ۱. ثابت‌ها
   ════════════════════════════════════════════════════════════ */
const JWT_SECRET      = process.env.JWT_SECRET      || 'change-this-secret-in-production';
const JWT_EXPIRES_IN  = process.env.JWT_EXPIRES_IN  || '7d';
const TOKEN_HEADER    = 'authorization';
const TOKEN_PREFIX    = 'Bearer ';

/* ════════════════════════════════════════════════════════════
   ۲. استخراج token از هدر
   ════════════════════════════════════════════════════════════ */
function extractToken(req) {
  const header = req.headers[TOKEN_HEADER] || '';
  if (header.startsWith(TOKEN_PREFIX)) {
    return header.slice(TOKEN_PREFIX.length).trim();
  }
  /* پشتیبانی از cookie برای درخواست‌های browser */
  if (req.cookies?.token) {
    return req.cookies.token;
  }
  return null;
}

/* ════════════════════════════════════════════════════════════
   ۳. requireAuth — روت‌های محافظت‌شده (الزامی)
   ════════════════════════════════════════════════════════════ */
export function requireAuth(req, res, next) {
  const token = extractToken(req);

  if (!token) {
    return res.status(401).json({
      success: false,
      error:   'دسترسی غیرمجاز — توکن یافت نشد',
      code:    'TOKEN_MISSING',
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error:   'توکن منقضی شده — دوباره وارد شوید',
        code:    'TOKEN_EXPIRED',
      });
    }
    return res.status(401).json({
      success: false,
      error:   'توکن نامعتبر است',
      code:    'TOKEN_INVALID',
    });
  }
}

/* ════════════════════════════════════════════════════════════
   ۴. optionalAuth — روت‌هایی که لاگین اختیاریه
   ════════════════════════════════════════════════════════════ */
export function optionalAuth(req, res, next) {
  const token = extractToken(req);

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    req.user = jwt.verify(token, JWT_SECRET);
  } catch {
    req.user = null;
  }
  next();
}

/* ════════════════════════════════════════════════════════════
   ۵. requireRole — بررسی نقش کاربر
   ════════════════════════════════════════════════════════════ */
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error:   'دسترسی غیرمجاز — ابتدا وارد شوید',
        code:    'TOKEN_MISSING',
      });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error:   'دسترسی ممنوع — سطح دسترسی کافی ندارید',
        code:    'FORBIDDEN',
      });
    }
    next();
  };
}

/* ════════════════════════════════════════════════════════════
   ۶. generateToken — ساخت توکن جدید
   ════════════════════════════════════════════════════════════ */
export function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/* ════════════════════════════════════════════════════════════
   ۷. verifyToken — تأیید توکن بدون middleware (برای موارد خاص)
   ════════════════════════════════════════════════════════════ */
export function verifyToken(token) {
  try {
    return { valid: true, decoded: jwt.verify(token, JWT_SECRET) };
  } catch (err) {
    return { valid: false, error: err.name };
  }
}
