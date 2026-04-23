/**
 * ============================================================
 * FILE: server/routes/referral.js
 * ROLE: سیستم معرف — کد معرف، جوایز، آمار
 * PROJECT: BarakatHub Karbala Backend
 * VERSION: 2.0.0  (D1 integration)
 * ============================================================
 * تغییرات نسبت به نسخه قبل:
 *   - تمام Map های حافظه‌ای جایگزین D1 شدند
 *   - داده‌ها پایدار هستند و با restart پاک نمی‌شوند
 *   - تنظیمات جوایز در جدول prize_configs ذخیره می‌شود
 * API و منطق تجاری دست‌نخورده باقی مانده.
 * ============================================================
 */

import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { requireApiKey } from '../middleware/security.js';
import { dbGet, dbAll, dbRun, dbBatch } from '../db/client.js';

const router = Router();

/* ════════════════════════════════════════════════════════════
   ۱. ابزارهای کمکی
   ════════════════════════════════════════════════════════════ */

/** تولید کد معرف یکتا */
function generateReferralCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'BRK-';
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

/** دریافت یا ساخت رکورد کد معرف برای کاربر */
async function getOrCreateReferralCode(userId) {
  let row = await dbGet(
    'SELECT code, referred_by FROM referral_codes WHERE user_id = ?',
    [userId]
  );

  if (row) return row;

  /* ساخت کد یکتا */
  let code;
  let attempts = 0;
  do {
    code = generateReferralCode();
    const existing = await dbGet('SELECT 1 FROM referral_codes WHERE code = ?', [code]);
    if (!existing) break;
    attempts++;
  } while (attempts < 10);

  await dbRun(
    'INSERT OR IGNORE INTO referral_codes (user_id, code) VALUES (?, ?)',
    [userId, code]
  );

  return { code, referred_by: null };
}

/** اعطای جوایز بر اساس تعداد معرفی‌ها */
async function checkAndGrantRewards(referrerId) {
  const configs = await dbAll('SELECT * FROM prize_configs WHERE active = 1');

  for (const cfg of configs) {
    const count = await dbGet(
      `SELECT COUNT(*) AS cnt FROM referral_entries
       WHERE referrer_id = ? AND type = ?
         AND (? IS NULL OR section = ?)`,
      [referrerId, cfg.type, cfg.section, cfg.section]
    );

    const alreadyGranted = await dbGet(
      'SELECT 1 FROM referral_rewards WHERE user_id = ? AND config_id = ? AND at_count = ?',
      [referrerId, cfg.id, cfg.threshold]
    );

    if ((count?.cnt ?? 0) >= cfg.threshold && !alreadyGranted) {
      const months  = parseInt(cfg.reward.match(/\d+/)?.[0] ?? '1');
      const expires = new Date();
      expires.setMonth(expires.getMonth() + months);

      await dbRun(
        `INSERT OR IGNORE INTO referral_rewards
           (user_id, config_id, at_count, reward_type, section, expires_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [referrerId, cfg.id, cfg.threshold, cfg.reward, cfg.section ?? null, expires.toISOString()]
      );

      console.log(`[Referral] 🎁 جایزه ${cfg.reward} به کاربر ${referrerId} اعطا شد`);
    }
  }
}

/* ════════════════════════════════════════════════════════════
   ۲. POST /api/referral/register
   ثبت کد معرف هنگام ثبت‌نام کاربر جدید
   ════════════════════════════════════════════════════════════ */
router.post('/register', requireAuth, async (req, res) => {
  try {
    const { referralCode, type = 'visit', section = null } = req.body;
    const newUserId = req.user.id;

    /* ساخت یا دریافت پروفایل معرف */
    const newUserRef = await getOrCreateReferralCode(newUserId);

    if (!referralCode) {
      return res.json({
        success: true,
        code:    newUserRef.code,
        message: 'پروفایل معرف ساخته شد',
      });
    }

    /* پیدا کردن معرف */
    const referrerRow = await dbGet(
      'SELECT user_id FROM referral_codes WHERE code = ?',
      [referralCode.toUpperCase().trim()]
    );

    if (!referrerRow) {
      return res.status(400).json({
        success: false,
        error:   'کد معرف معتبر نیست',
        code:    'INVALID_REFERRAL_CODE',
      });
    }

    /* جلوگیری از معرفی خود */
    if (referrerRow.user_id === newUserId) {
      return res.status(400).json({
        success: false,
        error:   'نمی‌توانید خودتان را معرفی کنید',
        code:    'SELF_REFERRAL',
      });
    }

    /* بررسی اینکه قبلاً با کدی ثبت نشده */
    if (newUserRef.referred_by) {
      return res.status(400).json({
        success: false,
        error:   'قبلاً با یک کد معرف ثبت‌نام کرده‌اید',
        code:    'ALREADY_REFERRED',
      });
    }

    /* ثبت در دیتابیس (transaction) */
    await dbBatch([
      {
        sql:    'UPDATE referral_codes SET referred_by = ? WHERE user_id = ?',
        params: [referralCode.toUpperCase().trim(), newUserId],
      },
      {
        sql:    `INSERT OR IGNORE INTO referral_entries
                   (referrer_id, referred_id, type, section)
                 VALUES (?, ?, ?, ?)`,
        params: [referrerRow.user_id, newUserId, type, section ?? null],
      },
    ]);

    /* بررسی جوایز */
    await checkAndGrantRewards(referrerRow.user_id);

    res.json({
      success:    true,
      code:       newUserRef.code,
      referredBy: referralCode.toUpperCase().trim(),
      message:    'کد معرف با موفقیت ثبت شد',
    });

  } catch (err) {
    console.error('[/referral/register]', err);
    res.status(500).json({ success: false, error: 'خطای داخلی سرور' });
  }
});

/* ════════════════════════════════════════════════════════════
   ۳. GET /api/referral/code
   دریافت کد معرف کاربر جاری
   ════════════════════════════════════════════════════════════ */
router.get('/code', requireAuth, async (req, res) => {
  try {
    const ref = await getOrCreateReferralCode(req.user.id);

    res.json({
      success:     true,
      code:        ref.code,
      referralUrl: `${process.env.BASE_URL || 'https://barakathub.com'}/?ref=${ref.code}`,
    });
  } catch (err) {
    console.error('[/referral/code]', err);
    res.status(500).json({ success: false, error: 'خطای داخلی سرور' });
  }
});

/* ════════════════════════════════════════════════════════════
   ۴. GET /api/referral/stats
   آمار معرف‌های کاربر جاری
   ════════════════════════════════════════════════════════════ */
router.get('/stats', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const ref    = await getOrCreateReferralCode(userId);

    /* شمارش‌ها */
    const [totalRow, purchaseRow, quranRow] = await Promise.all([
      dbGet('SELECT COUNT(*) AS cnt FROM referral_entries WHERE referrer_id = ? AND type = ?',    [userId, 'visit']),
      dbGet('SELECT COUNT(*) AS cnt FROM referral_entries WHERE referrer_id = ? AND type = ?',    [userId, 'purchase']),
      dbGet('SELECT COUNT(*) AS cnt FROM referral_entries WHERE referrer_id = ? AND type = ? AND section = ?', [userId, 'purchase', 'quran']),
    ]);

    const totalVisits    = totalRow?.cnt    ?? 0;
    const totalPurchases = purchaseRow?.cnt ?? 0;
    const quranPurchases = quranRow?.cnt    ?? 0;

    /* جوایز فعال */
    const now = new Date().toISOString();
    const activeRewards = await dbAll(
      'SELECT * FROM referral_rewards WHERE user_id = ? AND expires_at > ?',
      [userId, now]
    );
    const allRewards = await dbAll(
      'SELECT * FROM referral_rewards WHERE user_id = ?',
      [userId]
    );

    /* پیشرفت تا جایزه بعدی */
    const configs    = await dbAll('SELECT * FROM prize_configs WHERE active = 1 ORDER BY threshold ASC');
    const nextPrizes = [];

    for (const cfg of configs) {
      const count = cfg.scope === 'global'
        ? (cfg.type === 'visit' ? totalVisits : totalPurchases)
        : quranPurchases;

      if (count < cfg.threshold) {
        nextPrizes.push({
          configId:  cfg.id,
          reward:    cfg.reward,
          section:   cfg.section,
          threshold: cfg.threshold,
          current:   count,
          remaining: cfg.threshold - count,
        });
        break;
      }
    }

    res.json({
      success: true,
      stats: {
        code:           ref.code,
        referralUrl:    `${process.env.BASE_URL || 'https://barakathub.com'}/?ref=${ref.code}`,
        totalReferrals: totalVisits + totalPurchases,
        totalVisits,
        totalPurchases,
        quranPurchases,
        activeRewards,
        nextPrizes,
        allRewards,
      },
    });
  } catch (err) {
    console.error('[/referral/stats]', err);
    res.status(500).json({ success: false, error: 'خطای داخلی سرور' });
  }
});

/* ════════════════════════════════════════════════════════════
   ۵. GET /api/referral/prizes
   تنظیمات جوایز — عمومی
   ════════════════════════════════════════════════════════════ */
router.get('/prizes', async (req, res) => {
  try {
    const all = await dbAll('SELECT * FROM prize_configs ORDER BY scope, threshold');

    res.json({
      success: true,
      prizes: {
        global:   all.filter(c => c.scope === 'global'),
        sections: all.filter(c => c.scope === 'section'),
      },
    });
  } catch (err) {
    console.error('[/referral/prizes]', err);
    res.status(500).json({ success: false, error: 'خطای داخلی سرور' });
  }
});

/* ════════════════════════════════════════════════════════════
   ۶. POST /api/referral/admin/prizes — فقط ادمین
   ذخیره تنظیمات جوایز
   ════════════════════════════════════════════════════════════ */
router.post('/admin/prizes', requireApiKey, async (req, res) => {
  try {
    const { global: globalPrizes, sections: sectionPrizes } = req.body;

    if (!Array.isArray(globalPrizes) || !Array.isArray(sectionPrizes)) {
      return res.status(422).json({
        success: false,
        error:   'فرمت داده نامعتبر است',
        code:    'INVALID_FORMAT',
      });
    }

    const allConfigs = [
      ...globalPrizes.map(c  => ({ ...c, scope: 'global' })),
      ...sectionPrizes.map(c => ({ ...c, scope: 'section' })),
    ];

    /* به‌روزرسانی در دیتابیس */
    const queries = allConfigs.map(c => ({
      sql: `INSERT INTO prize_configs (id, scope, type, threshold, reward, section, active, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, strftime('%Y-%m-%dT%H:%M:%fZ','now'))
            ON CONFLICT(id) DO UPDATE SET
              scope      = excluded.scope,
              type       = excluded.type,
              threshold  = excluded.threshold,
              reward     = excluded.reward,
              section    = excluded.section,
              active     = excluded.active,
              updated_at = excluded.updated_at`,
      params: [c.id, c.scope, c.type, c.threshold, c.reward, c.section ?? null, c.active ? 1 : 0],
    }));

    await dbBatch(queries);

    res.json({
      success: true,
      message: 'تنظیمات جوایز ذخیره شد',
    });
  } catch (err) {
    console.error('[/referral/admin/prizes]', err);
    res.status(500).json({ success: false, error: 'خطای داخلی سرور' });
  }
});

/* ════════════════════════════════════════════════════════════
   ۷. GET /api/referral/admin/list — فقط ادمین
   لیست همه معرف‌ها و آمار کلی
   ════════════════════════════════════════════════════════════ */
router.get('/admin/list', requireApiKey, async (req, res) => {
  try {
    const list = await dbAll(
      `SELECT
         rc.user_id,
         rc.code,
         rc.referred_by,
         rc.created_at AS joined_at,
         COUNT(DISTINCT re.referred_id) AS total_referrals,
         COUNT(DISTINCT rw.id)          AS total_rewards
       FROM referral_codes rc
       LEFT JOIN referral_entries re ON re.referrer_id = rc.user_id
       LEFT JOIN referral_rewards rw ON rw.user_id     = rc.user_id
       GROUP BY rc.user_id
       ORDER BY total_referrals DESC`
    );

    const configs = await dbAll('SELECT * FROM prize_configs ORDER BY scope, threshold');

    res.json({
      success:    true,
      totalUsers: list.length,
      prizeConfig: {
        global:   configs.filter(c => c.scope === 'global'),
        sections: configs.filter(c => c.scope === 'section'),
      },
      referrals: list,
    });
  } catch (err) {
    console.error('[/referral/admin/list]', err);
    res.status(500).json({ success: false, error: 'خطای داخلی سرور' });
  }
});

export default router;
