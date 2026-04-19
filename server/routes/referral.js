/**
 * ============================================================
 * FILE: routes/referral.js
 * ROLE: سیستم معرف — کد معرف، جوایز، آمار
 * PROJECT: BarakatHub Karbala Backend
 * VERSION: 1.0.0
 *
 * POST /api/referral/register      — ثبت کد معرف هنگام ثبت‌نام
 * GET  /api/referral/stats         — آمار معرف‌های کاربر
 * GET  /api/referral/code          — دریافت کد معرف کاربر
 * GET  /api/referral/prizes        — تنظیمات جوایز (از ادمین)
 * POST /api/referral/admin/prizes  — ذخیره تنظیمات جوایز (ادمین)
 * GET  /api/referral/admin/list    — لیست همه معرف‌ها (ادمین)
 * ============================================================
 */

import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { requireApiKey } from '../middleware/security.js';

const router = Router();

/* ════════════════════════════════════════════════════════════
   ۱. ذخیره در حافظه — در production از دیتابیس استفاده کنید
   ════════════════════════════════════════════════════════════ */

/* کاربران و کدهای معرف */
const USERS_DB = new Map();
/* {
     userId: {
       code:        'BRK-A7K2',
       referredBy:  'BRK-X9Z1' | null,
       referrals:   [ { userId, joinedAt, type:'visit'|'purchase', section:null|'quran' } ],
       rewards:     [ { type, section, grantedAt, expiresAt } ],
       joinedAt:    ISO string,
     }
   }
*/

/* تنظیمات جوایز — ادمین تغییر می‌دهد */
let PRIZE_CONFIG = {
  global: [
    /* هر x نفر ورودی از طرف کاربر → دسترسی ویژه */
    { id: 'g1', type: 'visit',    threshold: 10, reward: 'premium_1month',  section: null,    active: true },
    { id: 'g2', type: 'visit',    threshold: 25, reward: 'premium_3month',  section: null,    active: true },
    { id: 'g3', type: 'visit',    threshold: 50, reward: 'premium_6month',  section: null,    active: true },
  ],
  sections: [
    /* دانشگاه قرآنی — هر x نفر خریدار → ۱ ماه رایگان */
    { id: 's1', type: 'purchase', threshold: 3,  reward: 'quran_1month',    section: 'quran', active: true },
    { id: 's2', type: 'purchase', threshold: 10, reward: 'quran_3month',    section: 'quran', active: true },
  ],
  updatedAt: new Date().toISOString(),
};

/* ════════════════════════════════════════════════════════════
   ۲. ابزارهای کمکی
   ════════════════════════════════════════════════════════════ */

/* تولید کد معرف یکتا */
function generateReferralCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'BRK-';
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

/* دریافت یا ساخت کاربر */
function getOrCreateUser(userId) {
  if (!USERS_DB.has(userId)) {
    let code;
    let attempts = 0;
    do {
      code = generateReferralCode();
      attempts++;
    } while ([...USERS_DB.values()].some(u => u.code === code) && attempts < 100);

    USERS_DB.set(userId, {
      code,
      referredBy:  null,
      referrals:   [],
      rewards:     [],
      joinedAt:    new Date().toISOString(),
    });
  }
  return USERS_DB.get(userId);
}

/* پیدا کردن کاربر با کد معرف */
function findUserByCode(code) {
  for (const [userId, data] of USERS_DB.entries()) {
    if (data.code === code.toUpperCase().trim()) return { userId, ...data };
  }
  return null;
}

/* بررسی و اعطای جایزه */
function checkAndGrantRewards(referrerId) {
  const referrer = USERS_DB.get(referrerId);
  if (!referrer) return;

  const allConfigs = [...PRIZE_CONFIG.global, ...PRIZE_CONFIG.sections];

  for (const config of allConfigs) {
    if (!config.active) continue;

    /* شمارش معرف‌های مرتبط */
    const count = referrer.referrals.filter(r =>
      r.type === config.type &&
      (config.section === null || r.section === config.section)
    ).length;

    /* بررسی اینکه آیا این جایزه قبلاً داده شده */
    const alreadyGranted = referrer.rewards.some(
      r => r.configId === config.id && r.atCount === config.threshold
    );

    if (count >= config.threshold && !alreadyGranted) {
      const now     = new Date();
      const months  = parseInt(config.reward.match(/\d+/)?.[0] ?? '1');
      const expires = new Date(now);
      expires.setMonth(expires.getMonth() + months);

      referrer.rewards.push({
        configId:  config.id,
        atCount:   config.threshold,
        type:      config.reward,
        section:   config.section,
        grantedAt: now.toISOString(),
        expiresAt: expires.toISOString(),
      });

      console.log(`[Referral] 🎁 جایزه ${config.reward} به کاربر ${referrerId} اعطا شد`);
    }
  }
}

/* ════════════════════════════════════════════════════════════
   ۳. POST /api/referral/register
   ثبت کد معرف هنگام ثبت‌نام کاربر جدید
   ════════════════════════════════════════════════════════════ */
router.post('/register', requireAuth, (req, res) => {
  const { referralCode, type = 'visit', section = null } = req.body;
  const newUserId = req.user.id;

  /* ساخت پروفایل معرف برای کاربر جدید */
  const newUser = getOrCreateUser(newUserId);

  /* اگه کدی وارد نشده */
  if (!referralCode) {
    return res.json({
      success: true,
      code:    newUser.code,
      message: 'پروفایل معرف ساخته شد',
    });
  }

  /* پیدا کردن معرف */
  const referrer = findUserByCode(referralCode);

  if (!referrer) {
    return res.status(400).json({
      success: false,
      error:   'کد معرف معتبر نیست',
      code:    'INVALID_REFERRAL_CODE',
    });
  }

  /* جلوگیری از معرفی خود */
  if (referrer.userId === newUserId) {
    return res.status(400).json({
      success: false,
      error:   'نمی‌توانید خودتان را معرفی کنید',
      code:    'SELF_REFERRAL',
    });
  }

  /* بررسی اینکه قبلاً با کد دیگری ثبت‌نام نکرده */
  if (newUser.referredBy) {
    return res.status(400).json({
      success: false,
      error:   'قبلاً با یک کد معرف ثبت‌نام کرده‌اید',
      code:    'ALREADY_REFERRED',
    });
  }

  /* ثبت معرف */
  newUser.referredBy = referralCode;

  /* اضافه کردن به لیست معرف‌های referrer */
  const referrerData = USERS_DB.get(referrer.userId);
  referrerData.referrals.push({
    userId:   newUserId,
    joinedAt: new Date().toISOString(),
    type,
    section,
  });

  /* بررسی جوایز */
  checkAndGrantRewards(referrer.userId);

  res.json({
    success:    true,
    code:       newUser.code,
    referredBy: referralCode,
    message:    'کد معرف با موفقیت ثبت شد',
  });
});

/* ════════════════════════════════════════════════════════════
   ۴. GET /api/referral/code
   دریافت کد معرف کاربر جاری
   ════════════════════════════════════════════════════════════ */
router.get('/code', requireAuth, (req, res) => {
  const user = getOrCreateUser(req.user.id);

  res.json({
    success:     true,
    code:        user.code,
    referralUrl: `${process.env.BASE_URL || 'https://barakathub.com'}/?ref=${user.code}`,
  });
});

/* ════════════════════════════════════════════════════════════
   ۵. GET /api/referral/stats
   آمار معرف‌های کاربر جاری
   ════════════════════════════════════════════════════════════ */
router.get('/stats', requireAuth, (req, res) => {
  const user = getOrCreateUser(req.user.id);

  const totalVisits   = user.referrals.filter(r => r.type === 'visit').length;
  const totalPurchases = user.referrals.filter(r => r.type === 'purchase').length;
  const quranPurchases = user.referrals.filter(r => r.type === 'purchase' && r.section === 'quran').length;

  /* جوایز فعال */
  const now           = new Date();
  const activeRewards = user.rewards.filter(r => new Date(r.expiresAt) > now);

  /* پیشرفت تا جایزه بعدی */
  const nextPrizes = [];
  const allConfigs  = [...PRIZE_CONFIG.global, ...PRIZE_CONFIG.sections];

  for (const config of allConfigs) {
    if (!config.active) continue;
    const count = user.referrals.filter(r =>
      r.type === config.type &&
      (config.section === null || r.section === config.section)
    ).length;
    if (count < config.threshold) {
      nextPrizes.push({
        configId:  config.id,
        reward:    config.reward,
        section:   config.section,
        threshold: config.threshold,
        current:   count,
        remaining: config.threshold - count,
      });
      break; /* فقط نزدیک‌ترین جایزه */
    }
  }

  res.json({
    success: true,
    stats: {
      code:           user.code,
      referralUrl:    `${process.env.BASE_URL || 'https://barakathub.com'}/?ref=${user.code}`,
      totalReferrals: user.referrals.length,
      totalVisits,
      totalPurchases,
      quranPurchases,
      activeRewards,
      nextPrizes,
      allRewards:     user.rewards,
    },
  });
});

/* ════════════════════════════════════════════════════════════
   ۶. GET /api/referral/prizes
   تنظیمات جوایز — عمومی
   ════════════════════════════════════════════════════════════ */
router.get('/prizes', (req, res) => {
  res.json({
    success: true,
    prizes:  PRIZE_CONFIG,
  });
});

/* ════════════════════════════════════════════════════════════
   ۷. POST /api/referral/admin/prizes — فقط ادمین
   ذخیره تنظیمات جوایز
   ════════════════════════════════════════════════════════════ */
router.post('/admin/prizes', requireApiKey, (req, res) => {
  const { global: globalPrizes, sections: sectionPrizes } = req.body;

  if (!Array.isArray(globalPrizes) || !Array.isArray(sectionPrizes)) {
    return res.status(422).json({
      success: false,
      error:   'فرمت داده نامعتبر است',
      code:    'INVALID_FORMAT',
    });
  }

  PRIZE_CONFIG = {
    global:    globalPrizes,
    sections:  sectionPrizes,
    updatedAt: new Date().toISOString(),
  };

  res.json({
    success: true,
    message: 'تنظیمات جوایز ذخیره شد',
    prizes:  PRIZE_CONFIG,
  });
});

/* ════════════════════════════════════════════════════════════
   ۸. GET /api/referral/admin/list — فقط ادمین
   لیست همه معرف‌ها و آمار کلی
   ════════════════════════════════════════════════════════════ */
router.get('/admin/list', requireApiKey, (req, res) => {
  const list = [...USERS_DB.entries()].map(([userId, data]) => ({
    userId,
    code:           data.code,
    referredBy:     data.referredBy,
    totalReferrals: data.referrals.length,
    totalRewards:   data.rewards.length,
    joinedAt:       data.joinedAt,
  }));

  res.json({
    success:      true,
    totalUsers:   list.length,
    prizeConfig:  PRIZE_CONFIG,
    referrals:    list,
  });
});

export default router;
