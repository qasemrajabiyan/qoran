/**
 * ============================================================
 * FILE: referral-banner.js
 * ROLE: بنر contextual معرفی (۳۰ ثانیه) + پیام‌های زمان‌بندی‌شده
 * PROJECT: BarakatHub — پلتفرم رسانه‌ای کربلا
 * VERSION: 1.0.0
 *
 * شامل:
 *   ۱. بنر referral — ۳۰ ثانیه — هر بار ورود به قسمت پولی
 *   ۲. پیام شب جمعه — هفتگی — برای اعضای فعال تدبر
 *   ۳. پیام ماهیانه — هر روز از ماه — برای اعضای فعال تدبر
 * ============================================================
 */

import { i18n } from './i18n.js';
import { AuthState } from './auth.js';
import { ReferralManager, ReferralConfig } from './referral.js';
import { NotifCenter } from './notifications.js';
import { translateText } from './auto-translate.js';

/* ────────────────────────────────────────────────────────────
   1. ترجمه‌ها
   ──────────────────────────────────────────────────────────── */
const COPY = {
  referralTitle:  { fa:'🎁 با معرفی دوستان جایزه بگیرید', ar:'🎁 احصل على مكافأة بإحالة الأصدقاء', ur:'🎁 دوستوں کو ریفر کرکے انعام پائیں', az:'🎁 Dostları dəvət et, mükafat qazan', tr:'🎁 Arkadaş davet et, ödül kazan', ru:'🎁 Приглашайте друзей и получайте награды', en:'🎁 Refer friends and earn rewards' },
  yourCode:       { fa:'کد معرفی شما', ar:'كود الإحالة الخاص بك', ur:'آپ کا ریفرل کوڈ', az:'Referral kodunuz', tr:'Referans Kodunuz', ru:'Ваш реферальный код', en:'Your Referral Code' },
  copyCode:       { fa:'کپی', ar:'نسخ', ur:'کاپی', az:'Kopyala', tr:'Kopyala', ru:'Копировать', en:'Copy' },
  copied:         { fa:'✓ کپی شد', ar:'✓ تم النسخ', ur:'✓ کاپی', az:'✓ Kopyalandı', tr:'✓ Kopyalandı', ru:'✓ Скопировано', en:'✓ Copied' },
  shareWhatsapp:  { fa:'واتساپ', ar:'واتساب', ur:'واٹس ایپ', az:'WhatsApp', tr:'WhatsApp', ru:'WhatsApp', en:'WhatsApp' },
  shareTelegram:  { fa:'تلگرام', ar:'تيليغرام', ur:'ٹیلیگرام', az:'Telegram', tr:'Telegram', ru:'Telegram', en:'Telegram' },
  progress:       { fa:'نفر تا جایزه', ar:'أشخاص حتى الجائزة', ur:'افراد انعام تک', az:'nəfər mükafata qədər', tr:'kişi ödüle kaldı', ru:'человек до награды', en:'more to prize' },
  closeIn:        { fa:'بستن در', ar:'الإغلاق في', ur:'بند ہوگا', az:'Bağlanır', tr:'Kapanıyor', ru:'Закрытие через', en:'Closes in' },
  seconds:        { fa:'ثانیه', ar:'ثانية', ur:'سیکنڈ', az:'saniyə', tr:'saniye', ru:'с', en:'s' },
};

function tx(obj) {
  return obj?.[i18n.lang] ?? obj?.fa ?? obj?.en ?? '';
}

/* ────────────────────────────────────────────────────────────
   2. REFERRAL BANNER — ۳۰ ثانیه auto-dismiss
   ──────────────────────────────────────────────────────────── */
export function showReferralBanner(sectionId) {
  /* بررسی: کل سیستم فعال است؟ */
  const globalCfg = ReferralConfig.get();
  if (!globalCfg.systemActive) return;

  /* بررسی: ادمین این قسمت را فعال کرده؟ */
  const sectionCfg = ReferralConfig.getSection(sectionId);
  if (!sectionCfg?.active) return;

  /* بررسی: کاربر لاگین است؟ */
  const user = AuthState.getUser();
  if (!user) return;

  /* اگر بنر قبلاً روی صفحه است */
  if (document.getElementById('referral-banner')) return;

  const code  = ReferralManager.getMyCode(user.id);
  const stats = ReferralManager.getMyStats(user.id);
  const sec   = stats[sectionId];
  const lang  = i18n.lang;

  /* پیام سفارشی ادمین — announcementMsg اولویت دارد، fallback به announcement */
  const announceFa = sectionCfg.announcementMsg?.fa || sectionCfg.announcement?.fa || '';
  const announce   = sectionCfg.announcementMsg?.[lang] || sectionCfg.announcement?.[lang] || announceFa;

  /* لینک share */
  const shareUrl = `${window.location.origin}/?ref=${code}`;
  const shareText = {
    fa:  `${announce}\nکد معرفی: ${code}\n${shareUrl}`,
    ar:  `${announce}\nكود الإحالة: ${code}\n${shareUrl}`,
    ur:  `${announce}\nریفرل کوڈ: ${code}\n${shareUrl}`,
    en:  `${announce}\nReferral Code: ${code}\n${shareUrl}`,
    tr:  `${announce}\nReferans Kodu: ${code}\n${shareUrl}`,
    ru:  `${announce}\nРеферальный код: ${code}\n${shareUrl}`,
    az:  `${announce}\nReferral kodu: ${code}\n${shareUrl}`,
  };
  const msgText    = encodeURIComponent(shareText[lang] ?? shareText.en);
  const whatsappUrl = `https://wa.me/?text=${msgText}`;
  const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(announce)}`;

  /* پیشرفت */
  const progressText = sec
    ? `${sec.paid} / ${sec.threshold} — ${sec.nextIn} ${tx(COPY.progress)}`
    : '';

  /* بنر */
  const banner = document.createElement('div');
  banner.id    = 'referral-banner';
  banner.setAttribute('role', 'complementary');
  banner.setAttribute('aria-label', tx(COPY.referralTitle));
  banner.style.cssText = `
    position: fixed;
    bottom: 24px;
    inset-inline-start: 50%;
    transform: translateX(-50%);
    width: min(480px, calc(100vw - 32px));
    background: linear-gradient(135deg, #0f1923 0%, #1a3a2a 100%);
    border: 1px solid rgba(42,157,143,0.35);
    border-radius: 16px;
    padding: 16px 20px;
    z-index: 9000;
    box-shadow: 0 16px 48px rgba(0,0,0,0.4);
    direction: ${i18n.dir};
    font-family: var(--font-rtl-body);
    animation: slideInUp 0.4s cubic-bezier(0.34,1.56,0.64,1);
  `;

  banner.innerHTML = `
    <!-- Progress bar زمان -->
    <div id="banner-timer-bar" style="
      position: absolute;
      top: 0; inset-inline-start: 0;
      height: 3px;
      background: linear-gradient(90deg, var(--color-primary-400), var(--color-secondary-400));
      border-radius: 16px 16px 0 0;
      width: 100%;
      transition: width linear;
    "></div>

    <!-- Header -->
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
      <div style="font-size:1rem;font-weight:700;color:white">
        ${tx(COPY.referralTitle)}
      </div>
      <div style="display:flex;align-items:center;gap:8px">
        <span id="banner-countdown" style="
          font-size:11px;color:rgba(255,255,255,0.5);
          font-family:'JetBrains Mono',monospace;
          white-space:nowrap;
        ">30${tx(COPY.seconds)}</span>
        <button id="banner-close" style="
          background:rgba(255,255,255,0.1);border:none;
          width:24px;height:24px;border-radius:50%;
          color:rgba(255,255,255,0.7);cursor:pointer;
          display:flex;align-items:center;justify-content:center;
          font-size:12px;transition:all 0.2s;
        " aria-label="بستن">✕</button>
      </div>
    </div>

    <!-- متن اعلان -->
    ${announce ? `
      <div style="
        font-size:0.82rem;color:rgba(255,255,255,0.65);
        margin-bottom:12px;line-height:1.5;
      ">${announce}</div>
    ` : ''}

    <!-- کد -->
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">
      <div style="
        flex:1;background:rgba(255,255,255,0.08);
        border:1px solid rgba(255,255,255,0.15);
        border-radius:8px;padding:8px 14px;
        font-family:'JetBrains Mono',monospace;
        font-size:1.1rem;font-weight:700;color:white;
        letter-spacing:0.1em;text-align:center;direction:ltr;
      " id="banner-code">${code}</div>
      <button id="banner-copy" style="
        background:var(--color-primary-500);color:white;
        border:none;border-radius:8px;
        padding:8px 14px;cursor:pointer;
        font-size:0.82rem;font-weight:700;
        font-family:var(--font-rtl-body);
        transition:all 0.2s;white-space:nowrap;
      ">${tx(COPY.copyCode)}</button>
    </div>

    <!-- پیشرفت -->
    ${sec ? `
      <div style="margin-bottom:12px">
        <div style="
          height:5px;background:rgba(255,255,255,0.1);
          border-radius:999px;overflow:hidden;margin-bottom:4px;
        ">
          <div style="
            height:100%;
            width:${Math.round((sec.paid % sec.threshold) / sec.threshold * 100)}%;
            background:linear-gradient(90deg,var(--color-primary-400),var(--color-secondary-400));
            border-radius:999px;transition:width 0.8s ease;
          "></div>
        </div>
        <div style="font-size:0.75rem;color:rgba(255,255,255,0.5)">
          ${progressText}
        </div>
      </div>
    ` : ''}

    <!-- دکمه‌های share -->
    <div style="display:flex;gap:8px">
      <a href="${whatsappUrl}" target="_blank" rel="noopener" style="
        flex:1;display:flex;align-items:center;justify-content:center;gap:6px;
        background:rgba(37,211,102,0.15);color:#25d366;
        border:1px solid rgba(37,211,102,0.3);border-radius:8px;
        padding:8px;font-size:0.82rem;font-weight:600;
        text-decoration:none;transition:all 0.2s;
      ">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
          <path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.553 4.116 1.524 5.849L.049 23.953a.5.5 0 0 0 .608.61l6.258-1.641A11.95 11.95 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.87 0-3.62-.5-5.13-1.376l-.367-.214-3.803.997 1.014-3.706-.234-.381A9.956 9.956 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
        </svg>
        ${tx(COPY.shareWhatsapp)}
      </a>
      <a href="${telegramUrl}" target="_blank" rel="noopener" style="
        flex:1;display:flex;align-items:center;justify-content:center;gap:6px;
        background:rgba(0,136,204,0.15);color:#0088cc;
        border:1px solid rgba(0,136,204,0.3);border-radius:8px;
        padding:8px;font-size:0.82rem;font-weight:600;
        text-decoration:none;transition:all 0.2s;
      ">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
        </svg>
        ${tx(COPY.shareTelegram)}
      </a>
    </div>
  `;

  document.body.appendChild(banner);
  _startBannerTimer(banner, 30);

  /* کپی کد */
  document.getElementById('banner-copy')?.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(code); }
    catch { /* fallback */ }
    const btn = document.getElementById('banner-copy');
    if (btn) {
      btn.textContent = tx(COPY.copied);
      btn.style.background = '#16a34a';
      setTimeout(() => {
        btn.textContent     = tx(COPY.copyCode);
        btn.style.background = 'var(--color-primary-500)';
      }, 2000);
    }
  });

  /* بستن دستی */
  document.getElementById('banner-close')?.addEventListener('click', () => {
    _dismissBanner(banner);
  });
}

function _startBannerTimer(banner, seconds) {
  const bar         = document.getElementById('banner-timer-bar');
  const countdown   = document.getElementById('banner-countdown');
  let remaining     = seconds;

  const interval = setInterval(() => {
    remaining--;
    if (countdown) countdown.textContent = `${remaining}${tx(COPY.seconds)}`;
    if (bar) bar.style.width = `${(remaining / seconds) * 100}%`;

    if (remaining <= 0) {
      clearInterval(interval);
      _dismissBanner(banner);
    }
  }, 1000);

  banner._timerInterval = interval;
}

function _dismissBanner(banner) {
  clearInterval(banner._timerInterval);
  banner.style.opacity    = '0';
  banner.style.transform  = 'translateX(-50%) translateY(20px)';
  banner.style.transition = 'all 0.3s ease';
  setTimeout(() => banner.remove(), 300);
}

/* ────────────────────────────────────────────────────────────
   3. SCHEDULED MESSAGES SYSTEM
   پیام‌های زمان‌بندی‌شده برای اعضای فعال تدبر
   ──────────────────────────────────────────────────────────── */
const SCHEDULE_KEY = 'mh_schedule_config';

export const ScheduleConfig = {
  get() {
    try {
      return JSON.parse(localStorage.getItem(SCHEDULE_KEY) || 'null') || {
        friday: {
          active:  false,
          hour:    21,    /* ساعت ۲۱:۰۰ */
          minute:  0,
          message: '',    /* ادمین می‌نویسد */
          lastSent: null,
        },
        monthly: {
          active:  false,
          day:     26,   /* روز ۲۶ */
          hour:    20,
          minute:  0,
          message: '',
          lastSent: null,
        },
      };
    } catch {
      return { friday: { active:false }, monthly: { active:false } };
    }
  },

  set(config) {
    try {
      localStorage.setItem(SCHEDULE_KEY, JSON.stringify(config));
    } catch {}
  },

  update(key, updates) {
    const cfg = this.get();
    cfg[key]  = { ...cfg[key], ...updates };
    this.set(cfg);
  },
};

/* ────────────────────────────────────────────────────────────
   4. MESSAGE DISPATCHER
   ──────────────────────────────────────────────────────────── */
export const MessageDispatcher = {

  /* ارسال پیام به همه اعضای فعال تدبر */
  async sendToActiveQuranMembers(templateFa) {
    try {
      const users = JSON.parse(localStorage.getItem('mh_all_users') || '[]');

      /* فقط اعضای فعال تدبر */
      const targets = users.filter(u => {
        if (!u.isPremium) return false;
        if (!u.premiumExpiry) return false;
        return new Date(u.premiumExpiry) > new Date();
      });

      console.log(`[Scheduler] Sending to ${targets.length} active quran members`);

      for (const user of targets) {
        await this._sendPersonalized(templateFa, user);
        /* تأخیر کوچک بین هر پیام */
        await new Promise(r => setTimeout(r, 50));
      }

      return targets.length;
    } catch (err) {
      console.error('[Scheduler] Send error:', err);
      return 0;
    }
  },

  /* ارسال پیام شخصی‌سازی‌شده به یک کاربر */
  async _sendPersonalized(templateFa, user) {
    const lang     = user.lang ?? 'fa';
    const userName = user.name ?? '';

    /* اضافه کردن خطاب */
    const greeting = {
      fa: `کاربر گرامی جناب ${userName}،\n\n`,
      ar: `عزيزي ${userName}،\n\n`,
      ur: `محترم ${userName}،\n\n`,
      az: `Hörmətli ${userName},\n\n`,
      tr: `Değerli ${userName},\n\n`,
      ru: `Уважаемый(ая) ${userName},\n\n`,
      en: `Dear ${userName},\n\n`,
    };

    const greetText = greeting[lang] ?? greeting.fa;

    /* ترجمه متن اصلی */
    let bodyText = templateFa;
    if (lang !== 'fa') {
      bodyText = await translateText(templateFa, lang, 'admin');
    }

    const fullMessage = greetText + bodyText;

    /* ذخیره در اعلان‌های کاربر */
    const notifs = JSON.parse(localStorage.getItem('mh_notifications') || '[]');
    notifs.unshift({
      id:      'sched_' + user.id + '_' + Date.now(),
      type:    'quran',
      icon:    '📖',
      title:   {
        fa: 'پیام از برکت‌هاب — کربلا',
        ar: 'رسالة من بركت هاب — كربلاء',
        ur: 'برکت‌ہب کربلا کا پیغام',
        en: 'Message from BarakatHub — Karbala',
        tr: 'BarakatHub Kerbela\'dan mesaj',
        ru: 'Сообщение от BarakatHub — Кербела',
        az: 'BarakatHub Kərbaladan mesaj',
      },
      text:    { [lang]: fullMessage, fa: greetText + templateFa },
      time:    new Date().toISOString(),
      read:    false,
      userId:  user.id,
      isScheduled: true,
    });
    localStorage.setItem('mh_notifications', JSON.stringify(notifs));

    /* اگر کاربر الان آنلاین است — نمایش فوری */
    const currentUser = AuthState.getUser();
    if (currentUser?.id === user.id) {
      const { NotifCenter } = await import('./notifications.js');
      NotifCenter.send({
        type:  'quran',
        icon:  '📖',
        title: { fa:'پیام از کربلا', [lang]:'پیام از کربلا' },
        text:  { fa: greetText + templateFa, [lang]: fullMessage },
      });
    }
  },

  /* بررسی زمان‌بندی (هر دقیقه اجرا می‌شود) */
  async checkSchedule() {
    const config = ScheduleConfig.get();
    const now    = new Date();

    /* بررسی پیام جمعه */
    if (config.friday.active && config.friday.message) {
      const isFriday    = now.getDay() === 5; /* 5 = جمعه */
      const isRightTime = now.getHours() === config.friday.hour &&
                          now.getMinutes() === config.friday.minute;

      if (isFriday && isRightTime) {
        /* بررسی اینکه این هفته ارسال نشده */
        const weekKey = `${now.getFullYear()}_W${_getWeekNumber(now)}`;
        if (config.friday.lastSent !== weekKey) {
          console.log('[Scheduler] Sending Friday message...');
          await this.sendToActiveQuranMembers(config.friday.message);
          ScheduleConfig.update('friday', { lastSent: weekKey });
        }
      }
    }

    /* بررسی پیام ماهیانه */
    if (config.monthly.active && config.monthly.message) {
      const isRightDay  = now.getDate() === config.monthly.day;
      const isRightTime = now.getHours() === config.monthly.hour &&
                          now.getMinutes() === config.monthly.minute;

      if (isRightDay && isRightTime) {
        /* بررسی اینکه این ماه ارسال نشده */
        const monthKey = `${now.getFullYear()}_${now.getMonth()}`;
        if (config.monthly.lastSent !== monthKey) {
          console.log('[Scheduler] Sending monthly message...');
          await this.sendToActiveQuranMembers(config.monthly.message);
          ScheduleConfig.update('monthly', { lastSent: monthKey });
        }
      }
    }
  },
};

/* هفته شمار */
function _getWeekNumber(date) {
  const d   = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

/* ────────────────────────────────────────────────────────────
   5. ADMIN PANEL — پیام‌های زمان‌بندی‌شده
   ──────────────────────────────────────────────────────────── */
export function renderSchedulerAdminPanel() {
  const config = ScheduleConfig.get();

  const days  = Array.from({length:31}, (_,i) => i+1);
  const hours = Array.from({length:24}, (_,i) => i.toString().padStart(2,'0')+':00');

  return `
    <div>
      <div class="admin-page-header">
        <div>
          <h1 class="admin-page-title">
            <span class="admin-page-title__icon">⏰</span>
            پیام‌های زمان‌بندی‌شده
          </h1>
          <p class="admin-page-desc">
            پیام هفتگی شب جمعه و پیام ماهیانه — فقط برای اعضای فعال تدبر قرآن
          </p>
        </div>
      </div>

      <!-- پیام شب جمعه -->
      <div class="admin-panel" style="margin-bottom:var(--space-5)">
        <div class="admin-panel__header">
          <div class="admin-panel__title">🌙 پیام هفتگی — شب جمعه</div>
          <label class="admin-toggle">
            <input type="checkbox" id="friday-active" ${config.friday.active?'checked':''}/>
            <div class="admin-toggle__track"><div class="admin-toggle__thumb"></div></div>
            <span class="admin-toggle__label" style="font-size:var(--text-sm)">فعال</span>
          </label>
        </div>
        <div class="admin-panel__body">

          <div class="grid grid--2" style="gap:var(--space-4);margin-bottom:var(--space-4)">
            <div class="admin-field">
              <label class="admin-label" for="friday-hour">ساعت ارسال</label>
              <select class="admin-input" id="friday-hour">
                ${hours.map(h => `<option value="${parseInt(h)}" ${parseInt(h)===config.friday.hour?'selected':''}>${h}</option>`).join('')}
              </select>
            </div>
            <div class="admin-field">
              <label class="admin-label">آخرین ارسال</label>
              <div class="admin-input" style="background:var(--bg-surface-2);color:var(--text-muted)">
                ${config.friday.lastSent ?? 'هنوز ارسال نشده'}
              </div>
            </div>
          </div>

          <div class="admin-field">
            <label class="admin-label" for="friday-msg">
              متن پیام
              <span class="admin-label-hint">
                به فارسی بنویسید — AI به زبان هر کاربر ترجمه می‌کند —
                «کاربر گرامی جناب [نام]» اتوماتیک اضافه می‌شود
              </span>
            </label>
            <textarea class="admin-textarea" id="friday-msg" rows="6"
              placeholder="متن پیام شب جمعه را به فارسی بنویسید..."
            >${config.friday.message ?? ''}</textarea>
          </div>

          <div style="display:flex;gap:var(--space-3);flex-wrap:wrap">
            <button class="btn btn--primary" id="save-friday-btn" type="button">
              💾 ذخیره پیام جمعه
            </button>
            <button class="btn btn--outline" id="test-friday-btn" type="button">
              📤 ارسال تست (همین الان)
            </button>
          </div>

        </div>
      </div>

      <!-- پیام ماهیانه -->
      <div class="admin-panel">
        <div class="admin-panel__header">
          <div class="admin-panel__title">📅 پیام ماهیانه</div>
          <label class="admin-toggle">
            <input type="checkbox" id="monthly-active" ${config.monthly.active?'checked':''}/>
            <div class="admin-toggle__track"><div class="admin-toggle__thumb"></div></div>
            <span class="admin-toggle__label" style="font-size:var(--text-sm)">فعال</span>
          </label>
        </div>
        <div class="admin-panel__body">

          <div class="grid grid--2" style="gap:var(--space-4);margin-bottom:var(--space-4)">
            <div class="admin-field">
              <label class="admin-label" for="monthly-day">
                روز ماه
                <span class="admin-label-hint">هر ماه این روز پیام می‌رود</span>
              </label>
              <select class="admin-input" id="monthly-day">
                ${days.map(d => `<option value="${d}" ${d===config.monthly.day?'selected':''}>${d}</option>`).join('')}
              </select>
            </div>
            <div class="admin-field">
              <label class="admin-label" for="monthly-hour">ساعت ارسال</label>
              <select class="admin-input" id="monthly-hour">
                ${hours.map(h => `<option value="${parseInt(h)}" ${parseInt(h)===config.monthly.hour?'selected':''}>${h}</option>`).join('')}
              </select>
            </div>
          </div>

          <div class="admin-field">
            <label class="admin-label" for="monthly-msg">
              متن پیام ماهیانه
              <span class="admin-label-hint">
                به فارسی — AI ترجمه می‌کند — «کاربر گرامی جناب [نام]» اتوماتیک اضافه می‌شود
              </span>
            </label>
            <textarea class="admin-textarea" id="monthly-msg" rows="6"
              placeholder="متن پیام ماهیانه را به فارسی بنویسید..."
            >${config.monthly.message ?? ''}</textarea>
          </div>

          <div style="display:flex;gap:var(--space-3);flex-wrap:wrap">
            <button class="btn btn--primary" id="save-monthly-btn" type="button">
              💾 ذخیره پیام ماهیانه
            </button>
            <button class="btn btn--outline" id="test-monthly-btn" type="button">
              📤 ارسال تست (همین الان)
            </button>
          </div>

        </div>
      </div>

    </div>
  `;
}

export function bindSchedulerAdminEvents(container) {
  const showToast = (msg, ok=true) => {
    const t = document.createElement('div');
    t.setAttribute('role','alert');
    t.style.cssText=`position:fixed;bottom:24px;inset-inline-end:24px;background:${ok?'#16a34a':'#e63946'};color:white;padding:12px 20px;border-radius:8px;font-size:14px;font-weight:600;z-index:9999;box-shadow:0 8px 24px rgba(0,0,0,0.25)`;
    t.textContent=msg;
    document.body.appendChild(t);
    setTimeout(()=>t.remove(),3000);
  };

  /* ذخیره جمعه */
  container.querySelector('#save-friday-btn')?.addEventListener('click', () => {
    ScheduleConfig.update('friday', {
      active:  container.querySelector('#friday-active')?.checked ?? false,
      hour:    parseInt(container.querySelector('#friday-hour')?.value ?? '21'),
      message: container.querySelector('#friday-msg')?.value ?? '',
    });
    showToast('✓ پیام جمعه ذخیره شد');
  });

  /* ارسال تست جمعه */
  container.querySelector('#test-friday-btn')?.addEventListener('click', async () => {
    const msg = container.querySelector('#friday-msg')?.value?.trim();
    if (!msg) { showToast('⚠ متن پیام خالی است', false); return; }
    const btn = container.querySelector('#test-friday-btn');
    if (btn) { btn.textContent = '⏳ در حال ارسال...'; btn.disabled = true; }
    const count = await MessageDispatcher.sendToActiveQuranMembers(msg);
    if (btn) { btn.textContent = '📤 ارسال تست'; btn.disabled = false; }
    showToast(`✓ پیام برای ${count} کاربر ارسال شد`);
  });

  /* ذخیره ماهیانه */
  container.querySelector('#save-monthly-btn')?.addEventListener('click', () => {
    ScheduleConfig.update('monthly', {
      active:  container.querySelector('#monthly-active')?.checked ?? false,
      day:     parseInt(container.querySelector('#monthly-day')?.value ?? '26'),
      hour:    parseInt(container.querySelector('#monthly-hour')?.value ?? '20'),
      message: container.querySelector('#monthly-msg')?.value ?? '',
    });
    showToast('✓ پیام ماهیانه ذخیره شد');
  });

  /* ارسال تست ماهیانه */
  container.querySelector('#test-monthly-btn')?.addEventListener('click', async () => {
    const msg = container.querySelector('#monthly-msg')?.value?.trim();
    if (!msg) { showToast('⚠ متن پیام خالی است', false); return; }
    const btn = container.querySelector('#test-monthly-btn');
    if (btn) { btn.textContent = '⏳ در حال ارسال...'; btn.disabled = true; }
    const count = await MessageDispatcher.sendToActiveQuranMembers(msg);
    if (btn) { btn.textContent = '📤 ارسال تست'; btn.disabled = false; }
    showToast(`✓ پیام برای ${count} کاربر ارسال شد`);
  });

  /* Toggle‌ها */
  container.querySelector('#friday-active')?.addEventListener('change', (e) => {
    ScheduleConfig.update('friday', { active: e.target.checked });
  });
  container.querySelector('#monthly-active')?.addEventListener('change', (e) => {
    ScheduleConfig.update('monthly', { active: e.target.checked });
  });
}

/* ────────────────────────────────────────────────────────────
   6. AUTO INIT — بررسی زمان‌بندی هر دقیقه
   ──────────────────────────────────────────────────────────── */
export function initScheduler() {
  /* بررسی اول */
  MessageDispatcher.checkSchedule();
  /* هر دقیقه بررسی */
  setInterval(() => MessageDispatcher.checkSchedule(), 60 * 1000);
  console.log('[Scheduler] Started — checking every minute');
}
