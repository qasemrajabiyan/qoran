/**
 * ============================================================
 * FILE: index.js
 * ROLE: سرور اصلی BarakatHub Karbala Backend
 * PROJECT: BarakatHub — پلتفرم رسانه‌ای اسلامی کربلا
 * VERSION: 2.0.0
 *
 * راه‌اندازی:
 *   npm install
 *   cp .env.example .env
 *   node index.js
 * ============================================================
 */

import express      from 'express';
import cors         from 'cors';
import morgan       from 'morgan';
import { join }     from 'path';
import { existsSync, mkdirSync } from 'fs';
import chalk        from 'chalk';

import { CONFIG, checkConfig }   from './config.js';
import quranRoutes               from './routes/quran.js';
import authRoutes                from './routes/auth.js';
import {
  securityMiddleware,
  generalLimiter,
  uploadLimiter,
  dubbingLimiter,
  authLimiter,
} from './middleware/security.js';

/* ── ساخت پوشه‌های موقت ── */
[CONFIG.UPLOAD.TEMP_DIR, join(process.cwd(), 'uploads')].forEach(dir => {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
});

/* ────────────────────────────────────────────────────────────
   راه‌اندازی Express
   ──────────────────────────────────────────────────────────── */
const app = express();

/* ── لایه امنیتی جامع ── */
app.use(securityMiddleware);

/* ── CORS ── */
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || CONFIG.ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: ${origin} مجاز نیست`));
  },
  methods:     ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
}));

/* ── Body parsers ── */
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

/* ── لاگ‌گذاری ── */
app.use(morgan(CONFIG.NODE_ENV === 'production' ? 'combined' : 'dev'));

/* ── Rate limiting عمومی ── */
app.use('/api/', generalLimiter);

/* ── Rate limiting اختصاصی ── */
app.use('/api/auth',           authLimiter);
app.use('/api/quran/upload',   uploadLimiter);
app.use('/api/quran/dubbing',  dubbingLimiter);

/* ── سرو فایل‌های آپلودشده (محلی) ── */
app.use('/uploads', express.static(join(process.cwd(), 'uploads'), {
  maxAge: '1y',
  setHeaders: (res, path) => {
    if (path.endsWith('.mp4') || path.endsWith('.webm')) res.setHeader('Accept-Ranges', 'bytes');
  },
}));

/* ────────────────────────────────────────────────────────────
   مسیرهای API
   ──────────────────────────────────────────────────────────── */
app.use('/api/auth',  authRoutes);
app.use('/api/quran', quranRoutes);

/* ── Health check ── */
app.get('/health', (req, res) => {
  res.json({
    status:    'online',
    project:   'BarakatHub Karbala Backend',
    version:   '2.0.0',
    timestamp: new Date().toISOString(),
    env:       CONFIG.NODE_ENV,
  });
});

/* ── 404 ── */
app.use('*', (req, res) => {
  res.status(404).json({ error: `مسیر پیدا نشد: ${req.originalUrl}` });
});

/* ── Error handler ── */
app.use((err, req, res, next) => {
  console.error(chalk.red('[Error]'), err.message);
  res.status(err.status || 500).json({
    success: false,
    error:   CONFIG.NODE_ENV === 'production' ? 'خطای داخلی سرور' : err.message,
  });
});

/* ────────────────────────────────────────────────────────────
   شروع سرور
   ──────────────────────────────────────────────────────────── */
app.listen(CONFIG.PORT, () => {
  console.log('\n' + chalk.green('═'.repeat(56)));
  console.log(chalk.green.bold('  🕌  BarakatHub Karbala — Backend Server v2.0.0'));
  console.log(chalk.green('═'.repeat(56)));
  console.log(chalk.cyan(`  ▶  آدرس:     ${CONFIG.BASE_URL}`));
  console.log(chalk.cyan(`  ▶  پورت:     ${CONFIG.PORT}`));
  console.log(chalk.cyan(`  ▶  محیط:     ${CONFIG.NODE_ENV}`));
  console.log(chalk.cyan(`  ▶  API:      ${CONFIG.BASE_URL}/api/quran/health`));
  console.log(chalk.green('─'.repeat(56)));

  const warnings = checkConfig();
  if (warnings.length > 0) {
    console.log(chalk.yellow('\n  تنظیمات ناقص:'));
    warnings.forEach(w => console.log(chalk.yellow(`  ${w}`)));
  } else {
    console.log(chalk.green('  ✓  همه سرویس‌ها تنظیم شده‌اند'));
  }

  console.log(chalk.green('\n  ✅  سرور آماده است\n'));
});

export default app;
