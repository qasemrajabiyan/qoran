/**
 * ============================================================
 * FILE: assets/js/referral.js
 * ROLE: سیستم معرف فرانت‌اند — کد معرف، آمار، جوایز
 * PROJECT: BarakatHub — پلتفرم رسانه‌ای کربلا
 * VERSION: 1.0.0
 * DEPENDS ON: i18n.js, auth.js
 * ============================================================
 */

import { i18n } from './i18n.js';
import { AuthState } from './auth.js';

/* ════════════════════════════════════════════════════════════
   ۱. ترجمه‌ها
   ════════════════════════════════════════════════════════════ */
const COPY = {
  myReferral:    { fa:'معرفی دوستان', ar:'إحالة الأصدقاء', ur:'دوستوں کا تعارف', en:'Refer Friends', tr:'Arkadaş Davet Et', ru:'Пригласить друзей', az:'Dostları dəvət et' },
  yourCode:      { fa:'کد معرف شما', ar:'رمز الإحالة الخاص بك', ur:'آپ کا ریفرل کوڈ', en:'Your Referral Code', tr:'Referans Kodunuz', ru:'Ваш реферальный код', az:'Referans kodunuz' },
  yourLink:      { fa:'لینک معرفی شما', ar:'رابط الإحالة الخاص بك', ur:'آپ کا ریفرل لنک', en:'Your Referral Link', tr:'Referans Bağlantınız', ru:'Ваша реферальная ссылка', az:'Referans linkiniз' },
  copyCode:      { fa:'کپی کد', ar:'نسخ الرمز', ur:'کوڈ کاپی کریں', en:'Copy Code', tr:'Kodu Kopyala', ru:'Скопировать код', az:'Kodu kopyala' },
  copyLink:      { fa:'کپی لینک', ar:'نسخ الرابط', ur:'لنک کاپی کریں', en:'Copy Link', tr:'Bağlantıyı Kopyala', ru:'Скопировать ссылку', az:'Linki kopyala' },
  copied:        { fa:'کپی شد!', ar:'تم النسخ!', ur:'کاپی ہوگیا!', en:'Copied!', tr:'Kopyalandı!', ru:'Скопировано!', az:'Kopyalandı!' },
  shareVia:      { fa:'اشتراک‌گذاری', ar:'مشاركة', ur:'شیئر', en:'Share', tr:'Paylaş', ru:'Поделиться', az:'Paylaş' },
  totalReferrals:{ fa:'کل معرفی‌ها', ar:'إجمالي الإحالات', ur:'کل تعارف', en:'Total Referrals', tr:'Toplam Davet', ru:'Всего приглашений', az:'Ümumi dəvətlər' },
  visits:        { fa:'بازدید', ar:'زيارات', ur:'وزٹ', en:'Visits', tr:'Ziyaretler', ru:'Посещения', az:'Ziyarətlər' },
  purchases:     { fa:'خرید', ar:'مشتريات', ur:'خریداری', en:'Purchases', tr:'Satın Almalar', ru:'Покупки', az:'Alışlar' },
  activeRewards: { fa:'جوایز فعال', ar:'المكافآت النشطة', ur:'فعال انعامات', en:'Active Rewards', tr:'Aktif Ödüller', ru:'Активные награды', az:'Aktiv mükafatlar' },
  nextPrize:     { fa:'تا جایزه بعدی', ar:'حتى الجائزة التالية', ur:'اگلے انعام تک', en:'Until Next Prize', tr:'Sonraki Ödüle', ru:'До следующей награды', az:'Növbəti mükafata qədər' },
  remaining:     { fa:'نفر مانده', ar:'أشخاص متبقون', ur:'افراد باقی', en:'remaining', tr:'kişi kaldı', ru:'осталось', az:'nəfər qaldı' },
  noRewards:     { fa:'هنوز جایزه‌ای ندارید', ar:'لا توجد مكافآت بعد', ur:'ابھی کوئی انعام نہیں', en:'No rewards yet', tr:'Henüz ödül yok', ru:'Пока нет наград', az:'Hələ mükafat yoxdur' },
  howItWorks:    { fa:'چطور کار می‌کند؟', ar:'كيف يعمل؟', ur:'یہ کیسے کام کرتا ہے؟', en:'How it works?', tr:'Nasıl çalışır?', ru:'Как это работает?', az:'Necə işləyir?' },
  step1:         { fa:'کد معرف خود را با دوستانتان به اشتراک بگذارید', ar:'شارك رمز الإحالة مع أصدقائك', ur:'اپنا ریفرل کوڈ دوستوں سے شیئر کریں', en:'Share your referral code with friends', tr:'Referans kodunuzu arkadaşlarınızla paylaşın', ru:'Поделитесь реферальным кодом с друзьями', az:'Referans kodunuzu dostlarınızla paylaşın' },
  step2:         { fa:'دوستانتان هنگام ثبت‌نام کد شما را وارد می‌کنند', ar:'يدخل أصدقاؤك رمزك عند التسجيل', ur:'دوست رجسٹریشن کے وقت کوڈ درج کریں', en:'Friends enter your code when signing up', tr:'Arkadaşlarınız kayıt sırasında kodunuzu girer', ru:'Друзья вводят ваш код при регистрации', az:'Dostlarınız qeydiyyatda kodunuzu daxil edir' },
  step3:         { fa:'با رسیدن به تعداد مشخص، جایزه می‌گیرید', ar:'عند الوصول للعدد المحدد، تحصل على جائزة', ur:'مقررہ تعداد تک پہنچنے پر انعام ملتا ہے', en:'Reach the target number and get your reward', tr:'Hedef sayıya ulaşınca ödülünüzü alırsınız', ru:'Достигните целевого числа и получите награду', az:'Hədəf sayına çatanda mükafatınızı alın' },
  enterRefCode:  { fa:'کد معرف دارید؟', ar:'هل لديك رمز إحالة؟', ur:'کیا آپ کے پاس ریفرل کوڈ ہے؟', en:'Have a referral code?', tr:'Referans kodunuz var mı?', ru:'Есть реферальный код?', az:'Referans kodunuz varmı?' },
  expiresOn:     { fa:'انقضا', ar:'تنتهي في', ur:'ختم', en:'Expires', tr:'Bitiş', ru:'Истекает', az:'Bitmə tarixi' },
};

function tx(obj) {
  return obj?.[i18n.lang] ?? obj?.['fa'] ?? obj?.['en'] ?? '';
}

/* ════════════════════════════════════════════════════════════
   ۲. API calls
   ════════════════════════════════════════════════════════════ */
async function _apiGet(path) {
  const token = AuthState.getToken();
  const res   = await fetch(`/api/referral${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

async function _apiPost(path, body) {
  const token = AuthState.getToken();
  const res   = await fetch(`/api/referral${path}`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body:    JSON.stringify(body),
  });
  return res.json();
}

/* ════════════════════════════════════════════════════════════
   ۳. ثبت کد معرف
   ════════════════════════════════════════════════════════════ */
export async function registerReferral(referralCode) {
  if (!AuthState.isLoggedIn() || !referralCode) return null;
  try {
    return await _apiPost('/register', { referralCode, type: 'visit' });
  } catch { return null; }
}

export async function autoRegisterFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const ref    = params.get('ref');
  if (ref) sessionStorage.setItem('brk_ref', ref.toUpperCase().trim());
}

export async function applyStoredReferral() {
  const ref = sessionStorage.getItem('brk_ref');
  if (!ref) return;
  const result = await registerReferral(ref);
  if (result?.success) sessionStorage.removeItem('brk_ref');
  return result;
}

/* ════════════════════════════════════════════════════════════
   ۴. رندر بخش معرف در پروفایل
   ════════════════════════════════════════════════════════════ */
export async function renderReferralPanel(container) {
  if (!container || !AuthState.isLoggedIn()) return;

  container.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:center;padding:40px">
      <div style="width:32px;height:32px;border:3px solid #2d6a4f;border-top-color:transparent;border-radius:50%;animation:spin 0.8s linear infinite"></div>
    </div>`;

  let stats;
  try {
    const res = await _apiGet('/stats');
    if (!res.success) throw new Error();
    stats = res.stats;
  } catch {
    container.innerHTML = `<div style="padding:24px;text-align:center;color:var(--color-error,#e63946)">خطا در بارگذاری</div>`;
    return;
  }

  const activeRewards = stats.activeRewards ?? [];
  const nextPrize     = stats.nextPrizes?.[0] ?? null;

  container.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:20px">

      <!-- کد و لینک -->
      <div style="background:linear-gradient(135deg,#1a472a 0%,#2d6a4f 100%);border-radius:16px;padding:28px;color:white">
        <h3 style="font-size:18px;font-weight:700;margin-bottom:20px">🎁 ${tx(COPY.myReferral)}</h3>

        <div style="margin-bottom:16px">
          <div style="font-size:12px;opacity:0.7;margin-bottom:8px">${tx(COPY.yourCode)}</div>
          <div style="display:flex;align-items:center;gap:10px">
            <div style="background:rgba(255,255,255,0.15);border-radius:10px;padding:12px 20px;font-size:26px;font-weight:800;letter-spacing:6px;font-family:monospace;flex:1">${stats.code}</div>
            <button id="copy-code-btn" style="background:rgba(255,255,255,0.2);border:none;border-radius:10px;padding:12px 16px;color:white;cursor:pointer;font-size:13px;font-weight:600;white-space:nowrap">${tx(COPY.copyCode)}</button>
          </div>
        </div>

        <div style="margin-bottom:20px">
          <div style="font-size:12px;opacity:0.7;margin-bottom:8px">${tx(COPY.yourLink)}</div>
          <div style="display:flex;align-items:center;gap:10px">
            <div style="background:rgba(255,255,255,0.1);border-radius:10px;padding:10px 14px;font-size:12px;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-family:monospace;opacity:0.9">${stats.referralUrl}</div>
            <button id="copy-link-btn" style="background:rgba(255,255,255,0.2);border:none;border-radius:10px;padding:10px 16px;color:white;cursor:pointer;font-size:13px;font-weight:600;white-space:nowrap">${tx(COPY.copyLink)}</button>
          </div>
        </div>

        <div style="display:flex;gap:10px;flex-wrap:wrap">
          <button id="share-telegram" style="background:rgba(255,255,255,0.15);border:none;border-radius:8px;padding:8px 16px;color:white;cursor:pointer;font-size:13px;font-weight:600">✈️ تلگرام</button>
          <button id="share-whatsapp" style="background:rgba(255,255,255,0.15);border:none;border-radius:8px;padding:8px 16px;color:white;cursor:pointer;font-size:13px;font-weight:600">💬 واتساپ</button>
          <button id="share-native"   style="background:rgba(255,255,255,0.15);border:none;border-radius:8px;padding:8px 16px;color:white;cursor:pointer;font-size:13px;font-weight:600">↗ ${tx(COPY.shareVia)}</button>
        </div>
      </div>

      <!-- آمار -->
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px">
        ${[
          { label: tx(COPY.totalReferrals), num: stats.totalReferrals, icon: '👥' },
          { label: tx(COPY.visits),         num: stats.totalVisits,    icon: '👁' },
          { label: tx(COPY.purchases),      num: stats.totalPurchases, icon: '🛒' },
        ].map(s => `
          <div style="background:var(--bg-surface,#fff);border:0.5px solid var(--border-color,#e5e7eb);border-radius:12px;padding:16px;text-align:center">
            <div style="font-size:24px;margin-bottom:6px">${s.icon}</div>
            <div style="font-size:22px;font-weight:700;color:#1a472a">${s.num}</div>
            <div style="font-size:12px;color:var(--text-muted,#888);margin-top:2px">${s.label}</div>
          </div>
        `).join('')}
      </div>

      <!-- پیشرفت -->
      ${nextPrize ? `
        <div style="background:var(--bg-surface,#fff);border:0.5px solid var(--border-color,#e5e7eb);border-radius:12px;padding:20px">
          <div style="font-size:14px;font-weight:600;margin-bottom:12px">🎯 ${tx(COPY.nextPrize)}</div>
          <div style="background:var(--bg-surface-2,#f5f5f5);border-radius:8px;height:10px;overflow:hidden;margin-bottom:10px">
            <div style="background:linear-gradient(90deg,#2d6a4f,#52b788);height:100%;border-radius:8px;width:${Math.round((nextPrize.current/nextPrize.threshold)*100)}%;transition:width 0.6s ease"></div>
          </div>
          <div style="display:flex;justify-content:space-between;font-size:13px">
            <span style="color:var(--text-muted,#888)">${nextPrize.current} / ${nextPrize.threshold}</span>
            <span style="color:#1a472a;font-weight:600">${nextPrize.remaining} ${tx(COPY.remaining)}</span>
          </div>
        </div>
      ` : ''}

      <!-- جوایز فعال -->
      <div style="background:var(--bg-surface,#fff);border:0.5px solid var(--border-color,#e5e7eb);border-radius:12px;padding:20px">
        <div style="font-size:14px;font-weight:600;margin-bottom:14px">🏆 ${tx(COPY.activeRewards)}</div>
        ${activeRewards.length === 0
          ? `<div style="color:var(--text-muted,#888);font-size:13px;text-align:center;padding:12px 0">${tx(COPY.noRewards)}</div>`
          : activeRewards.map(r => `
            <div style="display:flex;align-items:center;justify-content:space-between;padding:12px;background:#f0faf4;border-radius:8px;margin-bottom:8px">
              <div style="display:flex;align-items:center;gap:10px">
                <span style="font-size:20px">🎁</span>
                <div>
                  <div style="font-size:13px;font-weight:600;color:#166534">${r.type}</div>
                  ${r.section ? `<div style="font-size:11px;color:var(--text-muted,#888)">${r.section}</div>` : ''}
                </div>
              </div>
              <div style="font-size:11px;color:var(--text-muted,#888)">
                ${tx(COPY.expiresOn)}: ${new Date(r.expiresAt).toLocaleDateString(i18n.lang === 'fa' ? 'fa-IR' : 'en-US')}
              </div>
            </div>
          `).join('')
        }
      </div>

      <!-- چطور کار می‌کند -->
      <div style="background:var(--bg-surface,#fff);border:0.5px solid var(--border-color,#e5e7eb);border-radius:12px;padding:20px">
        <div style="font-size:14px;font-weight:600;margin-bottom:16px">ℹ️ ${tx(COPY.howItWorks)}</div>
        ${[
          { num:'۱', text: tx(COPY.step1) },
          { num:'۲', text: tx(COPY.step2) },
          { num:'۳', text: tx(COPY.step3) },
        ].map(s => `
          <div style="display:flex;align-items:flex-start;gap:12px;margin-bottom:14px">
            <div style="width:28px;height:28px;border-radius:50%;background:#2d6a4f;color:white;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;flex-shrink:0">${s.num}</div>
            <div style="font-size:13px;color:var(--text-secondary,#555);line-height:1.6;padding-top:4px">${s.text}</div>
          </div>
        `).join('')}
      </div>

    </div>
  `;

  _bindEvents(container, stats);
}

function _bindEvents(container, stats) {
  container.querySelector('#copy-code-btn')?.addEventListener('click', async () => {
    await navigator.clipboard.writeText(stats.code);
    _flash('#copy-code-btn', container, tx(COPY.copied));
  });

  container.querySelector('#copy-link-btn')?.addEventListener('click', async () => {
    await navigator.clipboard.writeText(stats.referralUrl);
    _flash('#copy-link-btn', container, tx(COPY.copied));
  });

  container.querySelector('#share-telegram')?.addEventListener('click', () => {
    const text = encodeURIComponent(`${tx({ fa:'با این لینک در برکت‌هاب ثبت‌نام کن:', en:'Join BarakatHub:', ar:'سجّل في بركت هاب:' })} ${stats.referralUrl}`);
    window.open(`https://t.me/share/url?url=${encodeURIComponent(stats.referralUrl)}&text=${text}`, '_blank');
  });

  container.querySelector('#share-whatsapp')?.addEventListener('click', () => {
    const text = encodeURIComponent(`${tx({ fa:'با این لینک در برکت‌هاب ثبت‌نام کن:', en:'Join BarakatHub:', ar:'سجّل في بركت هاب:' })} ${stats.referralUrl}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  });

  container.querySelector('#share-native')?.addEventListener('click', async () => {
    if (navigator.share) {
      await navigator.share({ title: 'BarakatHub', url: stats.referralUrl });
    } else {
      await navigator.clipboard.writeText(stats.referralUrl);
      _flash('#share-native', container, tx(COPY.copied));
    }
  });
}

function _flash(selector, container, text) {
  const btn = container.querySelector(selector);
  if (!btn) return;
  const orig = btn.textContent;
  btn.textContent = text;
  setTimeout(() => { btn.textContent = orig; }, 2000);
}

/* ════════════════════════════════════════════════════════════
   ۵. فیلد کد معرف در فرم ثبت‌نام
   ════════════════════════════════════════════════════════════ */
export function renderReferralInput(container) {
  if (!container) return;
  const stored = sessionStorage.getItem('brk_ref') || '';

  container.innerHTML = `
    <div style="margin-top:16px">
      <button type="button" id="ref-toggle-btn" style="background:none;border:none;cursor:pointer;font-size:13px;color:#52b788;font-weight:600;padding:0;text-decoration:underline">
        ${tx(COPY.enterRefCode)}
      </button>
      <div id="ref-input-wrap" style="display:${stored ? 'block' : 'none'};margin-top:10px">
        <input id="ref-code-input" type="text"
          value="${stored}"
          placeholder="BRK-XXXX"
          maxlength="8"
          dir="ltr"
          style="width:100%;padding:10px 14px;background:rgba(255,255,255,0.06);border:1.5px solid rgba(255,255,255,0.15);border-radius:10px;color:inherit;font-size:16px;font-family:monospace;letter-spacing:2px;text-transform:uppercase;box-sizing:border-box"
        />
      </div>
    </div>
  `;

  container.querySelector('#ref-toggle-btn')?.addEventListener('click', () => {
    const wrap = container.querySelector('#ref-input-wrap');
    if (wrap) wrap.style.display = wrap.style.display === 'none' ? 'block' : 'none';
  });

  container.querySelector('#ref-code-input')?.addEventListener('input', (e) => {
    e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '');
    sessionStorage.setItem('brk_ref', e.target.value);
  });
}

/* ════════════════════════════════════════════════════════════
   ۶. init — اجرا در همه صفحات
   ════════════════════════════════════════════════════════════ */
export function initReferral() {
  autoRegisterFromUrl();
}
