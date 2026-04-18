/**
 * ============================================================
 * FILE: referral.js
 * ROLE: سیستم معرفی و جایزه — کاملاً خودکار بدون دخالت انسان
 * PROJECT: BarakatHub — پلتفرم رسانه‌ای کربلا
 * VERSION: 1.0.0
 *
 * منطق کار:
 *   ۱. هر کاربر یک کد اختصاصی دارد
 *   ۲. دوستش موقع ثبت‌نام کد را وارد می‌کند
 *   ۳. وقتی دوست اشتراک می‌خرد — به حساب معرف اضافه می‌شود
 *   ۴. هر X نفر = یک جایزه رایگان — اتوماتیک فعال می‌شود
 *   ۵. ادمین فقط X و نوع جایزه را تنظیم می‌کند
 * ============================================================
 */

import { i18n } from './i18n.js';
import { AuthState } from './auth.js';

/* ────────────────────────────────────────────────────────────
   1. STORAGE KEYS
   ──────────────────────────────────────────────────────────── */
const KEYS = {
  referralConfig:  'mh_referral_config',   /* تنظیمات ادمین */
  referralLinks:   'mh_referral_links',    /* کد هر کاربر */
  referralHistory: 'mh_referral_history',  /* تاریخچه معرفی‌ها */
  prizes:          'mh_prizes',            /* جوایز اعطاشده */
};

/* ────────────────────────────────────────────────────────────
   2. CONFIG — تنظیمات ادمین (هر قسمت جداگانه)
   ──────────────────────────────────────────────────────────── */
export const DEFAULT_REFERRAL_CONFIG = {
  systemActive:    true,    /* روشن/خاموش کل سیستم توسط ادمین */
  threshold:       3,       /* هر X نفر عضو = ۱ جایزه */
  prizes: [
    /* ادمین می‌تواند هر تعداد جایزه تعریف کند */
    { type:'months', amount:1, sectionId:'quran',        active:true  },
    { type:'uses',   amount:1, sectionId:'prayer',       active:false },
    { type:'uses',   amount:1, sectionId:'consultation', active:false },
    { type:'uses',   amount:1, sectionId:'istikhara',    active:false },
  ],
  announcementMsg: { fa:'', ar:'', ur:'', az:'', tr:'', ru:'', en:'', id:'' },
  updatedAt:       null,
};

/* ────────────────────────────────────────────────────────────
   3. CONFIG MANAGER
   ──────────────────────────────────────────────────────────── */
export const ReferralConfig = {
  get() {
    try {
      const stored = localStorage.getItem(KEYS.referralConfig);
      if (stored) return { ...JSON.parse(JSON.stringify(DEFAULT_REFERRAL_CONFIG)), ...JSON.parse(stored) };
    } catch {}
    return JSON.parse(JSON.stringify(DEFAULT_REFERRAL_CONFIG));
  },

  set(config) {
    try {
      config.updatedAt = new Date().toISOString();
      localStorage.setItem(KEYS.referralConfig, JSON.stringify(config));
      return true;
    } catch { return false; }
  },

  /* سازگاری با کد قدیمی */
  getSection(sectionId) {
    const cfg = this.get();
    const prize = (cfg.prizes || []).find(p => p.sectionId === sectionId && p.active);
    if (!prize) return null;
    return {
      active:       true,
      threshold:    cfg.threshold,
      prizeType:    prize.type,
      prizeAmount:  prize.amount,
      announcementMsg: cfg.announcementMsg || {},
      icon: { quran:'📖', prayer:'🤲', consultation:'💬', istikhara:'⭐' }[sectionId] || '🎁',
      prizeLabel: {
        fa: prize.type==='months' ? `${prize.amount} ماه رایگان` : `${prize.amount} بار رایگان`,
        en: prize.type==='months' ? `${prize.amount} free month` : `${prize.amount} free use`,
      },
    };
  },
};

/* ────────────────────────────────────────────────────────────
   4. REFERRAL CODE GENERATOR
   ──────────────────────────────────────────────────────────── */
function _generateCode(userId) {
  /* کد ۶ کاراکتری — ترکیب حروف و عدد */
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const seed  = userId.slice(-4);
  let code    = 'MH-';
  for (let i = 0; i < 6; i++) {
    const idx = (seed.charCodeAt(i % seed.length) + i * 7) % chars.length;
    code += chars[idx];
  }
  return code;
}

/* ────────────────────────────────────────────────────────────
   5. REFERRAL LINK MANAGER
   ──────────────────────────────────────────────────────────── */
export const ReferralManager = {

  /* گرفتن کد کاربر — اگر ندارد می‌سازد */
  getMyCode(userId) {
    try {
      const links = JSON.parse(localStorage.getItem(KEYS.referralLinks) || '{}');
      if (links[userId]) return links[userId].code;
      const code = _generateCode(userId);
      links[userId] = { code, userId, createdAt: new Date().toISOString() };
      localStorage.setItem(KEYS.referralLinks, JSON.stringify(links));
      return code;
    } catch { return null; }
  },

  /* پیدا کردن userId صاحب کد */
  findUserByCode(code) {
    try {
      const links = JSON.parse(localStorage.getItem(KEYS.referralLinks) || '{}');
      const entry = Object.values(links).find(l => l.code === code.toUpperCase());
      return entry?.userId ?? null;
    } catch { return null; }
  },

  /* ثبت معرفی — وقتی کاربر جدید کد وارد می‌کند */
  registerReferral(newUserId, referralCode) {
    if (!referralCode) return false;
    if (!ReferralConfig.get().systemActive) return false;
    const referrerId = this.findUserByCode(referralCode);
    if (!referrerId || referrerId === newUserId) return false;

    try {
      const history = JSON.parse(localStorage.getItem(KEYS.referralHistory) || '[]');
      if (history.find(h => h.referredId === newUserId)) return false;

      history.push({
        id:           'ref_' + Date.now(),
        referrerId,
        referredId:   newUserId,
        referralCode,
        status:       'registered',
        registeredAt: new Date().toISOString(),
      });
      localStorage.setItem(KEYS.referralHistory, JSON.stringify(history));

      /* بررسی جایزه — صرف عضویت کافی است */
      this._checkAndAwardPrize(referrerId);
      return true;
    } catch { return false; }
  },

  /* ثبت پرداخت — برای سازگاری با کد قدیمی */
  markAsPaid(userId, sectionId) {
    try {
      const history = JSON.parse(localStorage.getItem(KEYS.referralHistory) || '[]');
      const entry   = history.find(h => h.referredId === userId && h.status === 'registered');
      if (!entry) return false;
      entry.status  = 'paid';
      entry.section = sectionId;
      entry.paidAt  = new Date().toISOString();
      localStorage.setItem(KEYS.referralHistory, JSON.stringify(history));
      return true;
    } catch { return false; }
  },

  /* بررسی و اعطای جایزه — بر اساس کل معرفی‌ها */
  _checkAndAwardPrize(referrerId) {
    const config = ReferralConfig.get();
    if (!config.systemActive) return;

    try {
      const history = JSON.parse(localStorage.getItem(KEYS.referralHistory) || '[]');

      /* شمارش کل معرفی‌های معتبر این کاربر */
      const validReferrals = history.filter(h =>
        h.referrerId === referrerId &&
        (config.requirePaid ? h.status === 'paid' : true)
      ).length;

      /* چند جایزه باید داشته باشد؟ */
      const earned = Math.floor(validReferrals / config.threshold);

      /* چند جایزه تاکنون گرفته؟ */
      const prizes = JSON.parse(localStorage.getItem(KEYS.prizes) || '[]');
      const given  = prizes.filter(p =>
        p.userId  === referrerId &&
        p.source  === 'referral'
      ).length;

      /* اگر جایزه جدیدی لازم است */
      if (earned > given) {
        const newPrizesCount = earned - given;
        for (let i = 0; i < newPrizesCount; i++) {
          this._grantAllPrizes(referrerId, config);
        }
      }
    } catch (err) {
      console.error('[Referral] Prize check error:', err);
    }
  },

  /* اعطای همه جوایز فعال به کاربر */
  _grantAllPrizes(userId, config) {
    const activePrizes = (config.prizes || []).filter(p => p.active);
    for (const prize of activePrizes) {
      this._grantPrize(userId, prize.sectionId, {
        prizeType:       prize.type,
        prizeAmount:     prize.amount,
        prizeLabel:      prize.label,
        icon:            '🎁',
        announcementMsg: config.announcementMsg || {},
      });
    }
  },

  /* اعطای جایزه */
  _grantPrize(userId, sectionId, config) {
    try {
      const prizes = JSON.parse(localStorage.getItem(KEYS.prizes) || '[]');
      const prize  = {
        id:         'prz_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
        userId,
        sectionId,
        source:     'referral',
        type:       config.prizeType,
        amount:     config.prizeAmount,
        used:       false,
        grantedAt:  new Date().toISOString(),
        expiresAt:  null,
      };

      /* محاسبه تاریخ انقضا برای اشتراک ماهیانه */
      if (config.prizeType === 'months') {
        /* اضافه کردن به اشتراک فعلی یا ایجاد اشتراک جدید */
        const user = this._getUser(userId);
        if (user) {
          const now      = new Date();
          const current  = user.premiumExpiry ? new Date(user.premiumExpiry) : now;
          const base     = current > now ? current : now;
          const expiry   = new Date(base);
          expiry.setMonth(expiry.getMonth() + config.prizeAmount);
          prize.expiresAt = expiry.toISOString();

          /* آپدیت کاربر */
          this._updateUser(userId, {
            isPremium:       true,
            premiumExpiry:   expiry.toISOString(),
            [`premium_${sectionId}`]: true,
          });
        }
      }

      prizes.push(prize);
      localStorage.setItem(KEYS.prizes, JSON.stringify(prizes));

      /* نوتیفیکیشن به کاربر */
      this._notifyUser(userId, sectionId, config);

      console.log(`[Referral] Prize granted to ${userId} for ${sectionId}`);
    } catch (err) {
      console.error('[Referral] Grant prize error:', err);
    }
  },

  /* بررسی دسترسی رایگان (uses) */
  hasFreeUse(userId, sectionId) {
    try {
      const prizes = JSON.parse(localStorage.getItem(KEYS.prizes) || '[]');
      return prizes.some(p =>
        p.userId    === userId &&
        p.sectionId === sectionId &&
        p.type      === 'uses' &&
        !p.used
      );
    } catch { return false; }
  },

  /* استفاده از جایزه uses */
  consumeFreeUse(userId, sectionId) {
    try {
      const prizes = JSON.parse(localStorage.getItem(KEYS.prizes) || '[]');
      const idx    = prizes.findIndex(p =>
        p.userId    === userId &&
        p.sectionId === sectionId &&
        p.type      === 'uses' &&
        !p.used
      );
      if (idx === -1) return false;
      prizes[idx].used   = true;
      prizes[idx].usedAt = new Date().toISOString();
      localStorage.setItem(KEYS.prizes, JSON.stringify(prizes));
      return true;
    } catch { return false; }
  },

  /* آمار معرفی‌های یک کاربر */
  getMyStats(userId) {
    try {
      const history = JSON.parse(localStorage.getItem(KEYS.referralHistory) || '[]');
      const prizes  = JSON.parse(localStorage.getItem(KEYS.prizes) || '[]');
      const config  = ReferralConfig.get();

      const myReferrals = history.filter(h => h.referrerId === userId);
      const valid       = myReferrals.filter(h => config.requirePaid ? h.status === 'paid' : true).length;
      const earned      = Math.floor(valid / config.threshold);
      const given       = prizes.filter(p => p.userId === userId && p.source === 'referral').length;
      const nextIn      = config.threshold - (valid % config.threshold);

      return {
        total:     myReferrals.length,
        valid,
        earned,
        given,
        nextIn:    valid % config.threshold === 0 && valid > 0 ? config.threshold : nextIn,
        threshold: config.threshold,
        prizes:    (config.prizes || []).filter(p => p.active),
      };
    } catch { return { total:0, valid:0, earned:0, given:0, nextIn:1, threshold:3, prizes:[] }; }
  },

  /* ── Helpers ── */
  _getUser(userId) {
    try {
      const all = JSON.parse(localStorage.getItem('mh_all_users') || '[]');
      return all.find(u => u.id === userId) ?? null;
    } catch { return null; }
  },

  _updateUser(userId, updates) {
    try {
      const all = JSON.parse(localStorage.getItem('mh_all_users') || '[]');
      const idx = all.findIndex(u => u.id === userId);
      if (idx !== -1) {
        all[idx] = { ...all[idx], ...updates };
        localStorage.setItem('mh_all_users', JSON.stringify(all));
      }
      /* اگر کاربر فعلی است */
      const current = AuthState.getUser();
      if (current?.id === userId) {
        AuthState.setUser({ ...current, ...updates });
      }
    } catch {}
  },

  _notifyUser(userId, sectionId, config) {
    try {
      const user = this._getUser(userId);
      const lang = user?.lang ?? i18n.lang;
      const name = user?.name ?? '';
      const prizeMsg = config.prizeLabel[lang] ?? config.prizeLabel['fa'] ?? '';

      /* متن سفارشی ادمین — اگر تنظیم شده باشد */
      const customFa = config.announcementMsg?.fa ?? '';

      const greetings = {
        fa:`کاربر عزیز ${name}،\n\n`, ar:`عزيزي ${name}،\n\n`,
        ur:`محترم ${name}،\n\n`, az:`Hörmətli ${name},\n\n`,
        tr:`Değerli ${name},\n\n`, ru:`Уважаемый ${name},\n\n`,
        en:`Dear ${name},\n\n`, id:`Yang terhormat ${name},\n\n`,
      };
      const greeting = greetings[lang] ?? greetings['fa'];

      /* ساخت متن نهایی به زبان کاربر */
      const buildText = async (targetLang) => {
        let body = customFa || `${config.icon} ${prizeMsg} به حساب شما اضافه شد.`;
        if (targetLang !== 'fa' && customFa) {
          try {
            const res = await fetch('https://api.anthropic.com/v1/messages', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 300,
                messages: [{ role: 'user', content: `Translate this Persian text to ${targetLang}. Return ONLY the translation:\n\n${customFa}` }],
              }),
            });
            const data = await res.json();
            body = data.content?.[0]?.text?.trim() || body;
          } catch {}
        } else if (targetLang !== 'fa') {
          body = config.announcementMsg?.[targetLang] || `${config.icon} ${config.prizeLabel[targetLang] ?? prizeMsg} added to your account.`;
        }
        return greeting + body;
      };

      buildText(lang).then(fullText => {
        const notifs = JSON.parse(localStorage.getItem('mh_notifications') || '[]');
        notifs.unshift({
          id:      'notif_' + Date.now(),
          type:    'prize',
          icon:    config.icon || '🎁',
          title:   {
            fa:`🎁 جایزه دریافت کردید!`, ar:`🎁 حصلت على جائزة!`,
            ur:`🎁 آپ نے جائزہ جیتا!`, en:`🎁 You won a prize!`,
            tr:`🎁 Ödül kazandınız!`, ru:`🎁 Вы получили приз!`,
            az:`🎁 Mükafat qazandınız!`, id:`🎁 Anda mendapat hadiah!`,
          },
          text:    { [lang]: fullText, fa: greeting + (customFa || `${config.icon} ${prizeMsg} به حساب شما اضافه شد.`) },
          time:    new Date().toISOString(),
          read:    false,
          userId,
        });
        localStorage.setItem('mh_notifications', JSON.stringify(notifs));
      });
    } catch {}
  },
};

/* ────────────────────────────────────────────────────────────
   6. REFERRAL WIDGET — نمایش در پروفایل کاربر
   ──────────────────────────────────────────────────────────── */
export function renderReferralWidget(userId) {
  const code   = ReferralManager.getMyCode(userId);
  const stats  = ReferralManager.getMyStats(userId);
  const config = ReferralConfig.get();

  if (!config.systemActive) return '';

  const tx = (obj) => obj?.[i18n.lang] ?? obj?.['fa'] ?? obj?.['en'] ?? '';

  const COPY = {
    title:     { fa:'سیستم معرفی', ar:'نظام الإحالة', ur:'ریفرل سسٹم', az:'Referral sistemi', tr:'Referans Sistemi', ru:'Реферальная система', en:'Referral System' },
    myCode:    { fa:'کد معرفی شما', ar:'كود الإحالة الخاص بك', ur:'آپ کا ریفرل کوڈ', az:'Referral kodunuz', tr:'Referans Kodunuz', ru:'Ваш реферальный код', en:'Your Referral Code' },
    howTo:     { fa:'کد را به دوستانتان بدهید تا موقع ثبت‌نام وارد کنند', ar:'أعطِ الكود لأصدقائك ليدخلوه عند التسجيل', ur:'یہ کوڈ دوستوں کو دیں تا کہ رجسٹریشن پر استعمال کریں', en:'Share this code with friends to enter at registration', az:'Kodu dostlarınıza verin ki qeydiyyatda daxil etsinlər', tr:'Kodu arkadaşlarınıza verin, kayıt sırasında girsinler', ru:'Дайте код друзьям, чтобы они вводили его при регистрации', id:'Berikan kode kepada teman-teman untuk dimasukkan saat pendaftaran'},
    copy:      { fa:'کپی کد', ar:'نسخ الكود', ur:'کوڈ کاپی کریں', en:'Copy Code', az:'Kodu kopyala', tr:'Kodu kopyala', ru:'Скопировать код', id:'Salin kode'},
    nextPrize: { fa:'نفر تا جایزه بعدی', ar:'شخص حتى الجائزة التالية', ur:'افراد اگلے انعام تک', en:'more until next prize', az:'nəfər növbəti mükafata', tr:'kişi sonraki ödüle kadar', ru:'до следующей награды', id:'orang hingga hadiah berikutnya'},
    invited:   { fa:'نفر دعوت شده', ar:'مدعوون', ur:'مدعو افراد', en:'invited', az:'dəvət edildi', tr:'davet edildi', ru:'приглашено', id:'diundang'},
    earned:    { fa:'جایزه گرفته‌اید', ar:'جوائز حصلت عليها', ur:'انعامات حاصل', en:'prizes earned', az:'mükafat aldınız', tr:'ödül aldınız', ru:'наград получено', id:'hadiah diterima'},
  };

  const progress = stats.threshold > 0 ? ((stats.valid % stats.threshold) / stats.threshold * 100) : 0;

  return `
    <div style="
      background: linear-gradient(135deg, #0f1923 0%, #1a3a2a 100%);
      border-radius: var(--radius-xl);
      padding: var(--space-6);
      color: white;
      position: relative;
      overflow: hidden;
    ">
      <div style="position:absolute;top:-20px;inset-inline-end:-20px;font-size:80px;opacity:0.06" aria-hidden="true">🎁</div>

      <h3 style="font-size:var(--text-lg);font-weight:var(--weight-bold);margin-bottom:var(--space-4);display:flex;align-items:center;gap:var(--space-2)">
        🎁 ${tx(COPY.title)}
      </h3>

      <!-- کد معرفی -->
      <div style="margin-bottom:var(--space-5)">
        <div style="font-size:var(--text-xs);color:rgba(255,255,255,0.5);margin-bottom:var(--space-2)">${tx(COPY.myCode)}</div>
        <div style="display:flex;align-items:center;gap:var(--space-3)">
          <div style="background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);border-radius:var(--radius-md);padding:var(--space-3) var(--space-5);font-family:'JetBrains Mono',monospace;font-size:var(--text-xl);font-weight:var(--weight-bold);color:white;letter-spacing:0.1em;flex:1;text-align:center;direction:ltr"
            id="referral-code-display">${code}</div>
          <button id="copy-referral-code" style="background:var(--color-primary-500);color:white;border:none;padding:var(--space-3) var(--space-4);border-radius:var(--radius-md);cursor:pointer;font-size:var(--text-sm);font-weight:700;white-space:nowrap;font-family:var(--font-rtl-body)">${tx(COPY.copy)}</button>
        </div>
        <p style="font-size:var(--text-xs);color:rgba(255,255,255,0.45);margin-top:var(--space-2)">${tx(COPY.howTo)}</p>
      </div>

      <!-- آمار کلی -->
      <div style="display:flex;gap:var(--space-4);margin-bottom:var(--space-4);flex-wrap:wrap">
        <div style="background:rgba(255,255,255,0.08);border-radius:var(--radius-md);padding:var(--space-3) var(--space-4);text-align:center;flex:1;min-width:80px">
          <div style="font-size:var(--text-2xl);font-weight:900">${stats.total}</div>
          <div style="font-size:var(--text-xs);color:rgba(255,255,255,0.5)">${tx(COPY.invited)}</div>
        </div>
        <div style="background:rgba(255,255,255,0.08);border-radius:var(--radius-md);padding:var(--space-3) var(--space-4);text-align:center;flex:1;min-width:80px">
          <div style="font-size:var(--text-2xl);font-weight:900">${stats.given}</div>
          <div style="font-size:var(--text-xs);color:rgba(255,255,255,0.5)">${tx(COPY.earned)}</div>
        </div>
      </div>

      <!-- نوار پیشرفت -->
      <div style="margin-bottom:var(--space-2)">
        <div style="height:10px;background:rgba(255,255,255,0.1);border-radius:999px;overflow:hidden">
          <div style="height:100%;width:${progress}%;background:linear-gradient(90deg,var(--color-primary-400),var(--color-secondary-400));border-radius:999px;transition:width 0.8s ease"></div>
        </div>
        <div style="font-size:var(--text-xs);color:rgba(255,255,255,0.4);margin-top:6px">
          ${stats.nextIn} ${tx(COPY.nextPrize)}
        </div>
      </div>

    </div>
  `;
}

/* ────────────────────────────────────────────────────────────
   7. REFERRAL ADMIN PANEL — داشبورد ادمین
   ──────────────────────────────────────────────────────────── */
export function renderReferralAdminPanel() {
  const config  = ReferralConfig.get();
  const history = (() => { try { return JSON.parse(localStorage.getItem(KEYS.referralHistory) || '[]'); } catch { return []; } })();
  const prizes  = (() => { try { return JSON.parse(localStorage.getItem(KEYS.prizes) || '[]'); } catch { return []; } })();

  const SECTION_OPTS = [
    { id:'quran',        label:'📖 دانشگاه قرآن' },
    { id:'prayer',       label:'🤲 سفارش دعا' },
    { id:'consultation', label:'💬 مشاوره' },
    { id:'istikhara',    label:'⭐ استخاره' },
  ];

  return `
    <div>
      <div class="admin-page-header">
        <div>
          <h1 class="admin-page-title"><span class="admin-page-title__icon">🎁</span> سیستم معرفی و جایزه</h1>
          <p class="admin-page-desc">هر کاربر که X نفر را دعوت کند، جایزه دریافت می‌کند — کاملاً خودکار</p>
        </div>
      </div>

      <!-- آمار کلی -->
      <div class="admin-stats-grid" style="margin-bottom:var(--space-5)">
        <div class="admin-stat-card admin-stat-card--teal">
          <div class="admin-stat-card__header"><span class="admin-stat-card__label">کل معرفی‌ها</span><div class="admin-stat-card__icon">🔗</div></div>
          <div class="admin-stat-card__num">${history.length}</div>
        </div>
        <div class="admin-stat-card admin-stat-card--green">
          <div class="admin-stat-card__header"><span class="admin-stat-card__label">پرداخت‌شده</span><div class="admin-stat-card__icon">✅</div></div>
          <div class="admin-stat-card__num">${history.filter(h=>h.status==='paid').length}</div>
        </div>
        <div class="admin-stat-card admin-stat-card--amber">
          <div class="admin-stat-card__header"><span class="admin-stat-card__label">جوایز اعطاشده</span><div class="admin-stat-card__icon">🏆</div></div>
          <div class="admin-stat-card__num">${prizes.filter(p=>p.source==='referral').length}</div>
        </div>
      </div>

      <!-- تنظیمات اصلی -->
      <div class="admin-panel" style="margin-bottom:var(--space-5)">
        <div class="admin-panel__header">
          <div class="admin-panel__title">⚙️ تنظیمات سیستم معرفی</div>
          <label class="admin-toggle">
            <input type="checkbox" id="system-active-toggle" ${config.systemActive?'checked':''}/>
            <div class="admin-toggle__track"><div class="admin-toggle__thumb"></div></div>
            <span class="admin-toggle__label">سیستم فعال است</span>
          </label>
        </div>
        <div class="admin-panel__body">
          <div class="grid grid--2" style="gap:var(--space-4);margin-bottom:var(--space-4)">

            <div class="admin-field">
              <label class="admin-label" for="global-threshold">
                به ازای هر چند نفر عضو جدید = ۱ جایزه
                <span class="admin-label-hint">صرف عضویت کافی است</span>
              </label>
              <input type="number" class="admin-input" id="global-threshold"
                value="${config.threshold ?? 3}" min="1" style="max-width:120px"/>
            </div>

            <div class="admin-field">
              <label class="admin-label">شرط معرفی</label>
              <label class="admin-toggle" style="margin-top:var(--space-2)">
                <input type="checkbox" id="require-paid-toggle" ${config.requirePaid?'checked':''}/>
                <div class="admin-toggle__track"><div class="admin-toggle__thumb"></div></div>
                <span class="admin-toggle__label" style="font-size:var(--text-sm)">فقط اگر پرداخت هم کرده باشد حساب شود</span>
              </label>
            </div>

          </div>

          <!-- متن پیام جایزه -->
          <div class="admin-field" style="margin-bottom:var(--space-4)">
            <label class="admin-label" for="announce-msg">
              متن پیام جایزه به کاربر
              <span class="admin-label-hint">به فارسی بنویسید — AI به زبان هر کاربر ترجمه می‌کند — نام کاربر اتوماتیک اضافه می‌شود</span>
            </label>
            <textarea class="admin-textarea" id="announce-msg" rows="3"
              placeholder="مثلاً: تبریک! شما با دعوت از دوستانتان جایزه دریافت کردید. اشتراک رایگان دانشگاه قرآن برای شما فعال شد."
            >${config.announcementMsg?.fa ?? ''}</textarea>
          </div>

          <!-- جوایز -->
          <div class="admin-field">
            <label class="admin-label" style="margin-bottom:var(--space-3)">جوایز (می‌توانید چند جایزه تعریف کنید)</label>
            <div id="prizes-list">
              ${(config.prizes || []).map((p, idx) => `
                <div class="admin-panel" style="margin-bottom:var(--space-3);border:1px solid var(--border-color)" data-prize-idx="${idx}">
                  <div class="admin-panel__header" style="padding:var(--space-3) var(--space-4)">
                    <span style="font-size:13px;font-weight:600">${SECTION_OPTS.find(s=>s.id===p.sectionId)?.label ?? p.sectionId}</span>
                    <div style="display:flex;align-items:center;gap:12px">
                      <label class="admin-toggle">
                        <input type="checkbox" class="prize-active-toggle" data-idx="${idx}" ${p.active?'checked':''}/>
                        <div class="admin-toggle__track"><div class="admin-toggle__thumb"></div></div>
                      </label>
                      <button class="btn btn--ghost btn--sm delete-prize-btn" data-idx="${idx}" style="color:#e63946">🗑</button>
                    </div>
                  </div>
                  <div class="admin-panel__body" style="padding:var(--space-3) var(--space-4)">
                    <div class="grid grid--2" style="gap:var(--space-3)">
                      <div class="admin-field">
                        <label class="admin-label">قسمت</label>
                        <select class="admin-input prize-section" data-idx="${idx}">
                          ${SECTION_OPTS.map(s=>`<option value="${s.id}" ${p.sectionId===s.id?'selected':''}>${s.label}</option>`).join('')}
                        </select>
                      </div>
                      <div class="admin-field">
                        <label class="admin-label">نوع جایزه</label>
                        <select class="admin-input prize-type" data-idx="${idx}">
                          <option value="months" ${p.type==='months'?'selected':''}>ماه اشتراک رایگان</option>
                          <option value="uses"   ${p.type==='uses'  ?'selected':''}>بار استفاده رایگان</option>
                        </select>
                      </div>
                      <div class="admin-field">
                        <label class="admin-label">مقدار</label>
                        <input type="number" class="admin-input prize-amount" data-idx="${idx}" value="${p.amount}" min="1" style="max-width:80px"/>
                      </div>
                      <div class="admin-field">
                        <label class="admin-label">برچسب (فارسی)</label>
                        <input type="text" class="admin-input prize-label" data-idx="${idx}" value="${p.label?.fa ?? ''}" placeholder="مثلاً: یک ماه رایگان"/>
                      </div>
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>
            <button class="btn btn--outline btn--sm" id="add-prize-btn" style="margin-top:var(--space-2)">+ افزودن جایزه جدید</button>
          </div>

          <button class="btn btn--primary" id="save-referral-config" style="margin-top:var(--space-4)">💾 ذخیره همه تنظیمات</button>
        </div>
      </div>

      <!-- تاریخچه معرفی‌ها -->
      <div class="admin-table-wrap">
        <div class="admin-table-header"><div class="admin-table-title">📋 تاریخچه معرفی‌ها</div></div>
        <div style="overflow-x:auto">
          <table class="admin-table">
            <thead><tr><th>معرف</th><th>معرفی‌شده</th><th>وضعیت</th><th>تاریخ</th></tr></thead>
            <tbody>
              ${history.length === 0
                ? `<tr><td colspan="4" style="text-align:center;color:var(--text-muted);padding:var(--space-6)">هنوز معرفی‌ای ثبت نشده</td></tr>`
                : history.slice(0,20).map(h => `
                  <tr>
                    <td style="font-size:var(--text-xs)">${h.referrerId}</td>
                    <td style="font-size:var(--text-xs)">${h.referredId}</td>
                    <td><span class="admin-badge admin-badge--${h.status==='paid'?'active':'pending'}">${h.status==='paid'?'✅ پرداخت':'⏳ ثبت‌نام'}</span></td>
                    <td style="font-size:var(--text-xs)">${new Date(h.registeredAt).toLocaleDateString('fa-IR')}</td>
                  </tr>`).join('')
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

/* ────────────────────────────────────────────────────────────
   8. BIND REFERRAL ADMIN EVENTS
   ──────────────────────────────────────────────────────────── */
export function bindReferralAdminEvents(container) {
  /* ذخیره همه تنظیمات */
  container.querySelector('#save-referral-config')?.addEventListener('click', () => {
    const config = ReferralConfig.get();
    config.systemActive  = container.querySelector('#system-active-toggle')?.checked ?? true;
    config.threshold     = parseInt(container.querySelector('#global-threshold')?.value) || 3;
    config.requirePaid   = container.querySelector('#require-paid-toggle')?.checked ?? false;
    config.announcementMsg = { ...config.announcementMsg, fa: container.querySelector('#announce-msg')?.value || '' };

    /* خواندن جوایز از DOM */
    const newPrizes = [];
    container.querySelectorAll('[data-prize-idx]').forEach(el => {
      const idx = parseInt(el.dataset.prizeIdx);
      newPrizes[idx] = {
        id:        config.prizes?.[idx]?.id || 'prize_' + Date.now() + '_' + idx,
        active:    el.querySelector('.prize-active-toggle')?.checked ?? true,
        sectionId: el.querySelector('.prize-section')?.value || 'quran',
        type:      el.querySelector('.prize-type')?.value || 'months',
        amount:    parseInt(el.querySelector('.prize-amount')?.value) || 1,
        label:     { ...config.prizes?.[idx]?.label, fa: el.querySelector('.prize-label')?.value || '' },
      };
    });
    config.prizes = newPrizes;
    ReferralConfig.set(config);
    const t = document.createElement('div');
    t.setAttribute('role','alert');
    t.style.cssText='position:fixed;bottom:24px;inset-inline-end:24px;background:#16a34a;color:white;padding:12px 20px;border-radius:8px;font-size:14px;font-weight:600;z-index:9999';
    t.textContent='✓ تنظیمات ذخیره شد';
    document.body.appendChild(t);
    setTimeout(()=>t.remove(),2500);
  });

  /* افزودن جایزه جدید */
  container.querySelector('#add-prize-btn')?.addEventListener('click', () => {
    const config = ReferralConfig.get();
    config.prizes = config.prizes || [];
    config.prizes.push({ id:'prize_'+Date.now(), active:true, sectionId:'quran', type:'months', amount:1, label:{ fa:'' } });
    ReferralConfig.set(config);
    container.innerHTML = renderReferralAdminPanel();
    bindReferralAdminEvents(container);
  });

  /* حذف جایزه */
  container.querySelectorAll('.delete-prize-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const config = ReferralConfig.get();
      config.prizes.splice(parseInt(btn.dataset.idx), 1);
      ReferralConfig.set(config);
      container.innerHTML = renderReferralAdminPanel();
      bindReferralAdminEvents(container);
    });
  });

  /* Copy referral code */
  container.querySelector('#copy-referral-code')?.addEventListener('click', async (e) => {
    const code = document.getElementById('referral-code-display')?.textContent;
    if (code) {
      try { await navigator.clipboard.writeText(code); } catch {}
      e.target.textContent = '✓ کپی شد!';
      setTimeout(() => { e.target.textContent = 'کپی کد'; }, 2000);
    }
  });
}
