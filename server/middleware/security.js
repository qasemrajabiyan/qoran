/**
 * ============================================================
 * FILE: middleware/security.js
 * ROLE: لایه امنیتی جامع — محافظت در برابر تمام حملات شناخته‌شده
 * PROJECT: BarakatHub Karbala Backend
 * VERSION: 2.0.0
 * STANDARD: OWASP Top 10 2025 + Zero Trust Architecture
 * ============================================================
 */

import rateLimit       from 'express-rate-limit';
import slowDown        from 'express-slow-down';
import helmet          from 'helmet';
import { v4 as uuidv4 } from 'uuid';
import { CONFIG }      from '../config.js';

/* ════════════════════════════════════════════════════════════
   ۱. HELMET — هدرهای امنیتی HTTP
   ════════════════════════════════════════════════════════════ */
export const securityHeaders = helmet({

  /* Content Security Policy */
  contentSecurityPolicy: {
    directives: {
      defaultSrc:     ["'self'"],
      scriptSrc:      ["'self'", "'strict-dynamic'"],
      styleSrc:       ["'self'", 'https://fonts.googleapis.com'],
      fontSrc:        ["'self'", 'https://fonts.gstatic.com'],
      imgSrc:         ["'self'", 'data:', 'blob:', CONFIG.R2?.PUBLIC_URL].filter(Boolean),
      mediaSrc:       ["'self'", 'blob:', CONFIG.R2?.PUBLIC_URL].filter(Boolean),
      connectSrc:     ["'self'", CONFIG.BASE_URL],
      frameSrc:       ["'none'"],
      objectSrc:      ["'none'"],
      baseUri:        ["'self'"],
      formAction:     ["'self'"],
      upgradeInsecureRequests: CONFIG.NODE_ENV === 'production' ? [] : null,
    },
  },

  /* HSTS — اجبار HTTPS */
  strictTransportSecurity: {
    maxAge:            63072000,  /* ۲ سال */
    includeSubDomains: true,
    preload:           true,
  },

  /* جلوگیری از Clickjacking */
  frameguard:              { action: 'deny' },

  /* جلوگیری از MIME Sniffing */
  noSniff:                 true,

  /* Referrer Policy */
  referrerPolicy:          { policy: 'strict-origin-when-cross-origin' },

  /* Permissions Policy */
  permittedCrossDomainPolicies: { permittedPolicies: 'none' },

  /* حذف X-Powered-By */
  hidePoweredBy:           true,

  crossOriginResourcePolicy:  { policy: 'same-site' },
  crossOriginOpenerPolicy:    { policy: 'same-origin' },
  crossOriginEmbedderPolicy:  { policy: 'require-corp' },
});

/* ════════════════════════════════════════════════════════════
   ۲. REQUEST ID — شناسه یکتا برای هر درخواست
   ════════════════════════════════════════════════════════════ */
export function requestId(req, res, next) {
  req.id = uuidv4();
  res.setHeader('X-Request-ID', req.id);
  next();
}

/* ════════════════════════════════════════════════════════════
   ۳. RATE LIMITING — محدودیت نرخ درخواست
   ════════════════════════════════════════════════════════════ */

/* عمومی */
export const generalLimiter = rateLimit({
  windowMs:        15 * 60 * 1000,
  max:             CONFIG.RATE_LIMIT?.MAX_GENERAL || 100,
  standardHeaders: true,
  legacyHeaders:   false,
  keyGenerator:    req => req.ip,
  skip:            req => req.path === '/health',
  message: {
    success: false,
    error:   'درخواست‌های زیادی ارسال شده — لطفاً ۱۵ دقیقه صبر کنید',
    retryAfter: 15,
  },
});

/* آپلود */
export const uploadLimiter = rateLimit({
  windowMs:        60 * 60 * 1000,
  max:             CONFIG.RATE_LIMIT?.MAX_UPLOAD || 10,
  standardHeaders: true,
  legacyHeaders:   false,
  message: {
    success: false,
    error:   'حداکثر ۱۰ آپلود در ساعت مجاز است',
  },
});

/* دوبله */
export const dubbingLimiter = rateLimit({
  windowMs:        60 * 60 * 1000,
  max:             CONFIG.RATE_LIMIT?.MAX_DUBBING || 5,
  standardHeaders: true,
  legacyHeaders:   false,
  message: {
    success: false,
    error:   'حداکثر ۵ درخواست دوبله در ساعت مجاز است',
  },
});

/* Auth — جلوگیری از Brute Force */
export const authLimiter = rateLimit({
  windowMs:        15 * 60 * 1000,
  max:             10,
  standardHeaders: true,
  legacyHeaders:   false,
  skipSuccessfulRequests: true,
  message: {
    success: false,
    error:   'تلاش‌های ورود بیش از حد — ۱۵ دقیقه صبر کنید',
  },
});

/* ════════════════════════════════════════════════════════════
   ۴. SLOW DOWN — کاهش سرعت پس از تعداد درخواست مشخص
   ════════════════════════════════════════════════════════════ */
export const speedLimiter = slowDown({
  windowMs:          15 * 60 * 1000,
  delayAfter:        50,
  delayMs:           hits => hits * 100,
  maxDelayMs:        5000,
});

/* ════════════════════════════════════════════════════════════
   ۵. INPUT SANITIZATION — پاک‌سازی ورودی‌ها
   ════════════════════════════════════════════════════════════ */

/* حذف کاراکترهای خطرناک از رشته */
function sanitizeString(str) {
  if (typeof str !== 'string') return str;
  return str
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/\0/g, '')
    .trim();
}

/* بازدید بازگشتی از آبجکت */
function sanitizeObject(obj, depth = 0) {
  if (depth > 10) return obj;
  if (typeof obj === 'string') return sanitizeString(obj);
  if (Array.isArray(obj))      return obj.map(v => sanitizeObject(v, depth + 1));
  if (obj && typeof obj === 'object') {
    const clean = {};
    for (const [k, v] of Object.entries(obj)) {
      clean[sanitizeString(k)] = sanitizeObject(v, depth + 1);
    }
    return clean;
  }
  return obj;
}

export function sanitizeInput(req, res, next) {
  if (req.body)   req.body   = sanitizeObject(req.body);
  if (req.query)  req.query  = sanitizeObject(req.query);
  if (req.params) req.params = sanitizeObject(req.params);
  next();
}

/* ════════════════════════════════════════════════════════════
   ۶. SQL/NoSQL INJECTION DETECTION
   ════════════════════════════════════════════════════════════ */
const INJECTION_PATTERNS = [
  /(\$where|\$ne|\$gt|\$lt|\$gte|\$lte|\$in|\$nin|\$or|\$and|\$not|\$exists)/i,
  /(union\s+select|drop\s+table|insert\s+into|delete\s+from|update\s+set)/i,
  /(exec\s*\(|execute\s*\(|xp_cmdshell|sp_executesql)/i,
  /('|"|;|--|\/\*|\*\/|xp_|0x[0-9a-f]+)/i,
];

function checkInjection(value, depth = 0) {
  if (depth > 5) return false;
  if (typeof value === 'string') {
    return INJECTION_PATTERNS.some(p => p.test(value));
  }
  if (Array.isArray(value)) {
    return value.some(v => checkInjection(v, depth + 1));
  }
  if (value && typeof value === 'object') {
    return Object.values(value).some(v => checkInjection(v, depth + 1));
  }
  return false;
}

export function injectionGuard(req, res, next) {
  const inputs = [req.body, req.query, req.params];
  for (const input of inputs) {
    if (checkInjection(input)) {
      return res.status(400).json({
        success: false,
        error:   'ورودی نامعتبر شناسایی شد',
        code:    'INJECTION_DETECTED',
      });
    }
  }
  next();
}

/* ════════════════════════════════════════════════════════════
   ۷. PATH TRAVERSAL GUARD
   ════════════════════════════════════════════════════════════ */
export function pathTraversalGuard(req, res, next) {
  const path = decodeURIComponent(req.path);
  if (path.includes('..') || path.includes('%2e%2e') || path.includes('\x00')) {
    return res.status(400).json({
      success: false,
      error:   'مسیر نامعتبر',
      code:    'PATH_TRAVERSAL',
    });
  }
  next();
}

/* ════════════════════════════════════════════════════════════
   ۸. REQUEST SIZE GUARD — جلوگیری از DoS با payload بزرگ
   ════════════════════════════════════════════════════════════ */
export function requestSizeGuard(req, res, next) {
  const contentLength = parseInt(req.headers['content-length'] || '0', 10);
  const MAX = 10 * 1024 * 1024; /* ۱۰ مگابایت */
  if (contentLength > MAX) {
    return res.status(413).json({
      success: false,
      error:   'حجم درخواست بیش از حد مجاز است',
      code:    'PAYLOAD_TOO_LARGE',
    });
  }
  next();
}

/* ════════════════════════════════════════════════════════════
   ۹. API KEY VALIDATION — تأیید کلید API ادمین
   ════════════════════════════════════════════════════════════ */
export function requireApiKey(req, res, next) {
  const key = req.headers['x-api-key'] || req.headers.authorization?.replace('Bearer ', '');
  if (!key || key !== process.env.ADMIN_API_KEY) {
    return res.status(401).json({
      success: false,
      error:   'کلید API معتبر نیست',
      code:    'UNAUTHORIZED',
    });
  }
  next();
}

/* ════════════════════════════════════════════════════════════
   ۱۰. SECURITY AUDIT LOG — ثبت رویدادهای امنیتی
   ════════════════════════════════════════════════════════════ */
export function securityAuditLog(req, res, next) {
  const sensitivePatterns = [
    /\/admin/i,
    /\/api\/auth/i,
    /\/api\/upload/i,
  ];

  const isSensitive = sensitivePatterns.some(p => p.test(req.path));

  if (isSensitive) {
    console.log(JSON.stringify({
      type:      'SECURITY_AUDIT',
      requestId: req.id,
      timestamp: new Date().toISOString(),
      ip:        req.ip,
      method:    req.method,
      path:      req.path,
      userAgent: req.headers['user-agent'],
    }));
  }

  next();
}

/* ════════════════════════════════════════════════════════════
   ۱۱. CORS STRICT — جلوگیری از دسترسی غیرمجاز
   ════════════════════════════════════════════════════════════ */
export function strictCors(req, res, next) {
  const origin = req.headers.origin;
  if (!origin) return next();

  if (!CONFIG.ALLOWED_ORIGINS.includes(origin)) {
    return res.status(403).json({
      success: false,
      error:   'دسترسی از این منبع مجاز نیست',
      code:    'CORS_BLOCKED',
    });
  }
  next();
}

/* ════════════════════════════════════════════════════════════
   ۱۲. FINGERPRINT PROTECTION — جلوگیری از اثرانگشت سرور
   ════════════════════════════════════════════════════════════ */
export function fingerprintProtection(req, res, next) {
  res.removeHeader('X-Powered-By');
  res.removeHeader('Server');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-DNS-Prefetch-Control', 'off');
  next();
}

/* ════════════════════════════════════════════════════════════
   ۱۳. EXPORT — بسته‌بندی کامل برای index.js
   ════════════════════════════════════════════════════════════ */
export const securityMiddleware = [
  requestId,
  fingerprintProtection,
  securityHeaders,
  pathTraversalGuard,
  requestSizeGuard,
  sanitizeInput,
  injectionGuard,
  securityAuditLog,
  speedLimiter,
];
