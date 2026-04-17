/**
 * ============================================================
 * obfuscate.js — پنهان‌ساز کد برکت هاب
 * ============================================================
 * نحوه استفاده:
 *   ۱. این فایل را در Desktop\qoran\ بگذارید
 *   ۲. یک بار اجرا کنید:  node obfuscate.js
 *   ۳. پوشه dist/ ساخته می‌شود — این را آپلود کنید
 * ============================================================
 * نصب یک بار (در ترمینال):
 *   npm install javascript-obfuscator
 * ============================================================
 */

const JavaScriptObfuscator = require('javascript-obfuscator');
const fs   = require('fs');
const path = require('path');

/* ── تنظیمات ─────────────────────────────────────────────── */
const SRC_DIR  = path.join(__dirname, 'assets/js');
const DIST_DIR = path.join(__dirname, 'dist/assets/js');

/* فایل‌هایی که باید obfuscate شوند */
const TARGET_FILES = [
  'istikhara.js',
  'consultation.js',
  'payment-system.js',
  'prayer.js',
  'quran.js',
  'auto-translate.js',
  'auth.js',
  'messages.js',
  'meeting.js',
  'audio-player.js',
];

/* فایل‌هایی که obfuscate نمی‌شوند (فقط کپی می‌شوند) */
const COPY_ONLY = [
  'app.js',
  'i18n.js',
  'theme.js',
  'seo-config.js',
  'seo-manager.js',
  'seo-init.js',
  'seo-monitor.js',
  'seo-media.js',
  'seo-social.js',
  'seo-ai-generator.js',
  'schema-base.js',
  'sitemap-generator.js',
  'pwa-seo.js',
  'performance-seo.js',
];

/* ── تنظیمات obfuscation ─────────────────────────────────── */
const OBFUSCATOR_OPTIONS = {
  /* ── پایه ── */
  compact:                            true,
  simplify:                           true,

  /* ── پنهان کردن رشته‌ها ── */
  stringArray:                        true,
  stringArrayEncoding:                ['rc4'],  /* رمزگذاری رشته‌ها */
  stringArrayIndexShift:              true,
  stringArrayRotate:                  true,
  stringArrayShuffle:                 true,
  stringArrayWrappersCount:           5,
  stringArrayWrappersChainedCalls:    true,
  stringArrayWrappersParametersMaxCount: 5,
  stringArrayWrappersType:            'function',
  stringArrayThreshold:               0.85,

  /* ── پنهان کردن نام متغیرها و توابع ── */
  identifierNamesGenerator:           'hexadecimal',
  renameGlobals:                      false,  /* global نه — ES module مشکل می‌شود */
  renameProperties:                   false,  /* property نه — ممکن است بشکند */

  /* ── گمراه‌کننده ── */
  deadCodeInjection:                  true,
  deadCodeInjectionThreshold:         0.3,
  controlFlowFlattening:              true,
  controlFlowFlatteningThreshold:     0.4,

  /* ── محافظت در برابر debug ── */
  debugProtection:                    true,
  debugProtectionInterval:            4000,
  disableConsoleOutput:               true,  /* console.log غیرفعال */

  /* ── محافظت از منبع ── */
  selfDefending:                      true,  /* اگر کسی دستکاری کند، خراب می‌شود */
  transformObjectKeys:                true,

  /* ── تارگت ── */
  target:                             'browser',
  sourceMap:                          false,  /* source map نه — قرار است پنهان باشد */
};

/* ── ساخت پوشه ───────────────────────────────────────────── */
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`📁 ساخته شد: ${dir}`);
  }
}

/* ── obfuscate یک فایل ───────────────────────────────────── */
function obfuscateFile(filename) {
  const srcPath  = path.join(SRC_DIR,  filename);
  const distPath = path.join(DIST_DIR, filename);

  if (!fs.existsSync(srcPath)) {
    console.warn(`⚠  پیدا نشد: ${filename}`);
    return;
  }

  try {
    const src    = fs.readFileSync(srcPath, 'utf8');
    const result = JavaScriptObfuscator.obfuscate(src, OBFUSCATOR_OPTIONS);
    fs.writeFileSync(distPath, result.getObfuscatedCode(), 'utf8');

    const srcSize  = Math.round(src.length / 1024);
    const distSize = Math.round(result.getObfuscatedCode().length / 1024);
    console.log(`✅ ${filename.padEnd(30)} ${srcSize}KB → ${distSize}KB`);
  } catch (err) {
    console.error(`❌ خطا در ${filename}:`, err.message);
    /* اگر obfuscation خطا داد — فقط کپی کن */
    fs.copyFileSync(srcPath, distPath);
    console.log(`   → کپی شد بدون obfuscation`);
  }
}

/* ── کپی یک فایل ─────────────────────────────────────────── */
function copyFile(filename) {
  const srcPath  = path.join(SRC_DIR,  filename);
  const distPath = path.join(DIST_DIR, filename);

  if (!fs.existsSync(srcPath)) return;

  fs.copyFileSync(srcPath, distPath);
  console.log(`📋 کپی شد: ${filename}`);
}

/* ── کپی همه فایل‌های دیگر ──────────────────────────────── */
function copyOtherFiles() {
  if (!fs.existsSync(SRC_DIR)) return;

  const allFiles   = fs.readdirSync(SRC_DIR);
  const knownFiles = [...TARGET_FILES, ...COPY_ONLY];

  allFiles.forEach(file => {
    if (!knownFiles.includes(file) && file.endsWith('.js')) {
      copyFile(file);
    }
  });
}

/* ── کپی assets دیگر (CSS، تصاویر، HTML) ──────────────────── */
function copyAssets() {
  const assetDirs = ['assets/css', 'assets/img', 'assets/fonts'];

  assetDirs.forEach(dir => {
    const src  = path.join(__dirname, dir);
    const dest = path.join(__dirname, 'dist', dir);
    if (!fs.existsSync(src)) return;

    ensureDir(dest);
    const files = fs.readdirSync(src);
    files.forEach(file => {
      fs.copyFileSync(path.join(src, file), path.join(dest, file));
    });
    console.log(`📁 کپی شد: ${dir}/ (${files.length} فایل)`);
  });

  /* کپی HTML ها */
  const htmlFiles = fs.readdirSync(__dirname).filter(f => f.endsWith('.html'));
  const distRoot  = path.join(__dirname, 'dist');
  ensureDir(distRoot);
  htmlFiles.forEach(file => {
    fs.copyFileSync(
      path.join(__dirname, file),
      path.join(distRoot, file)
    );
  });
  console.log(`📄 کپی شد: ${htmlFiles.length} فایل HTML`);

  /* کپی فایل‌های ریشه */
  ['manifest.json', 'sw.js', 'robots.txt', 'llms.txt', 'llms-full.txt',
   'sitemap.xml', 'offline.html'].forEach(file => {
    const src = path.join(__dirname, file);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, path.join(distRoot, file));
      console.log(`📄 کپی شد: ${file}`);
    }
  });
}

/* ── اجرای اصلی ──────────────────────────────────────────── */
async function main() {
  console.log('\n═══════════════════════════════════════');
  console.log('  پنهان‌ساز کد برکت هاب');
  console.log('═══════════════════════════════════════\n');

  const startTime = Date.now();

  /* ساخت پوشه dist */
  ensureDir(DIST_DIR);

  /* Obfuscate فایل‌های حساس */
  console.log('\n🔒 پنهان‌سازی فایل‌های حساس...');
  TARGET_FILES.forEach(obfuscateFile);

  /* کپی فایل‌های کم‌اهمیت */
  console.log('\n📋 کپی فایل‌های دیگر...');
  COPY_ONLY.forEach(copyFile);
  copyOtherFiles();

  /* کپی assets */
  console.log('\n🖼  کپی assets...');
  copyAssets();

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log('\n═══════════════════════════════════════');
  console.log(`✅ تمام شد در ${elapsed} ثانیه`);
  console.log(`📦 پوشه dist/ آماده آپلود است`);
  console.log('═══════════════════════════════════════\n');
}

main().catch(console.error);
