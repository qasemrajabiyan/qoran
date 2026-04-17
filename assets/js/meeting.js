/**
 * ============================================================
 * FILE: meeting.js
 * ROLE: دیدار با شیخ — سیستم کامل وقت‌دهی
 * PROJECT: MediaHub — پلتفرم رسانه‌ای کربلا
 * VERSION: 1.0.0
 * DEPENDS ON: i18n.js, auth.js
 * ============================================================
 */

import { i18n, formatNum } from './i18n.js';
import { AuthState }       from './auth.js';

/* ────────────────────────────────────────────────────────────
   1. ترجمه‌های اختصاصی
   ──────────────────────────────────────────────────────────── */
const MC = {
  pageTitle:    { fa:'دیدار با شیخ در کربلا', ar:'لقاء الشيخ في كربلاء', ur:'کربلا میں شیخ سے ملاقات', az:'Kərbəlada Şeyxlə görüş', tr:'Kerbela\'da Şeyh ile Buluşma', ru:'Встреча с шейхом в Кербеле', en:'Meeting the Sheikh in Karbala', id:'Bertemu Syaikh di Karbala' },
  pageSubtitle: { fa:'', ar:'', ur:'', az:'', tr:'', ru:'', en:'', id:'' },
  activeLabel:  { fa:'وقت‌های دیدار فعال است', ar:'مواعيد اللقاء متاحة', ur:'ملاقات کے اوقات فعال ہیں', az:'Görüş vaxtları aktivdir', tr:'Görüşme zamanları aktif', ru:'Время встречи активно', en:'Meeting slots are active', id:'Waktu pertemuan aktif' },
  attendees:    { fa:'نفر تأیید کرده‌اند', ar:'شخصاً أكدوا الحضور', ur:'افراد نے تصدیق کی', az:'nəfər təsdiqlədi', tr:'kişi onayladı', ru:'подтвердили', en:'confirmed attendance', id:'orang mengkonfirmasi' },
  yesBtn:       { fa:'✓ بله، می‌آیم', ar:'✓ نعم، سأحضر', ur:'✓ ہاں، آؤں گا', az:'✓ Bəli, gələcəm', tr:'✓ Evet, geleceğim', ru:'✓ Да, приду', en:'✓ Yes, I\'ll come', id:'✓ Ya, saya akan datang' },
  noBtn:        { fa:'✕ نه، نمی‌آیم', ar:'✕ لا، لن أحضر', ur:'✕ نہیں، نہیں آؤں گا', az:'✕ Xeyr, gəlməyəcəm', tr:'✕ Hayır, gelmeyeceğim', ru:'✕ Нет, не приду', en:'✕ No, I won\'t come', id:'✕ Tidak, saya tidak akan datang' },
  confirmed:    { fa:'✓ ثبت شد — می‌آیم', ar:'✓ تم التسجيل — سأحضر', ur:'✓ درج ہوگیا — آؤں گا', az:'✓ Qeydə alındı — gələcəm', tr:'✓ Kaydedildi — geleceğim', ru:'✓ Записано — приду', en:'✓ Registered — coming', id:'✓ Terdaftar — akan datang' },
  declined:     { fa:'ثبت شد — نمی‌آیم', ar:'تم التسجيل — لن أحضر', ur:'درج ہوگیا — نہیں آؤں گا', az:'Qeydə alındı — gəlməyəcəm', tr:'Kaydedildi — gelmeyeceğim', ru:'Записано — не приду', en:'Registered — not coming', id:'Terdaftar — tidak datang' },
  timeLabel:    { fa:'ساعت', ar:'الوقت', ur:'وقت', az:'Vaxt', tr:'Saat', ru:'Время', en:'Time', id:'Waktu' },
  loginRequired:{ fa:'برای ثبت دیدار ابتدا وارد شوید', ar:'يرجى تسجيل الدخول لتأكيد اللقاء', ur:'ملاقات درج کرنے کے لیے پہلے لاگ ان کریں', az:'Görüşü qeyd etmək üçün daxil olun', tr:'Buluşmayı kaydetmek için giriş yapın', ru:'Войдите, чтобы записаться на встречу', en:'Please login to confirm the meeting', id:'Silakan login untuk konfirmasi pertemuan' },
  myMeeting:    { fa:'دیدار من', ar:'لقائي', ur:'میری ملاقات', az:'Mənim görüşüm', tr:'Benim Buluşmam', ru:'Моя встреча', en:'My Meeting', id:'Pertemuan Saya' },
  cancelBtn:    { fa:'انصراف از دیدار', ar:'إلغاء اللقاء', ur:'ملاقات منسوخ کریں', az:'Görüşdən imtina et', tr:'Buluşmayı İptal Et', ru:'Отменить встречу', en:'Cancel Meeting', id:'Batalkan Pertemuan' },
  cancelConfirm:{ fa:'آیا از انصراف دیدار مطمئن هستید؟', ar:'هل أنت متأكد من إلغاء اللقاء؟', ur:'کیا آپ واقعی ملاقات منسوخ کرنا چاہتے ہیں؟', az:'Görüşdən imtina etmək istədiyinizə əminsiniz?', tr:'Buluşmayı iptal etmek istediğinizden emin misiniz?', ru:'Вы уверены, что хотите отменить встречу?', en:'Are you sure you want to cancel the meeting?', id:'Apakah Anda yakin ingin membatalkan pertemuan?' },
};

function tx(obj) {
  return obj[i18n.lang] ?? obj['fa'] ?? obj['en'] ?? '';
}

/* ────────────────────────────────────────────────────────────
   2. MEETING DATA STORAGE
   ──────────────────────────────────────────────────────────── */
export const MeetingData = {
  /* تنظیمات ادمین — در production از API می‌آید */
  _getConfig() {
    try {
      return JSON.parse(localStorage.getItem('mh_meeting_config') || 'null') || {
        isActive: true,
        inactiveMessage: {
          fa: 'در حال حاضر دیداری با شیخ برنامه‌ریزی نشده است. لطفاً بعداً مراجعه فرمایید.',
          ar: 'لا يوجد موعد مقرر للقاء الشيخ حالياً. يرجى التحقق لاحقاً.',
          ur: 'فی الحال شیخ سے ملاقات کا کوئی پروگرام نہیں۔ بعد میں دوبارہ چیک کریں۔',
          az: 'Hal-hazırda Şeyxlə görüş planlanmamışdır. Zəhmət olmasa, sonra yoxlayın.',
          tr: 'Şu anda şeyh ile bir buluşma planlanmamıştır. Lütfen daha sonra tekrar kontrol edin.',
          ru: 'В настоящее время встреча с шейхом не запланирована. Пожалуйста, проверьте позже.',
          en: 'No meeting with the Sheikh is currently scheduled. Please check back later.',
        },
        confirmationMessage: {
          fa: '',
          ar: '',
          ur: '',
          az: '',
          tr: '',
          ru: '',
          en: '',
        },
        slots: [
          {
            id:        'slot_001',
            date:      '2025-05-15',
            dayName:   { fa:'پنجشنبه', ar:'الخميس', ur:'جمعرات', az:'Cümə axşamı', tr:'Perşembe', ru:'Четверг', en:'Thursday', id:'Kamis' },
            timeStart: '19:00',
            timeEnd:   '23:00',
            isActive:  true,
          },
          {
            id:        'slot_002',
            date:      '2025-05-16',
            dayName:   { fa:'جمعه', ar:'الجمعة', ur:'جمعہ', az:'Cümə', tr:'Cuma', ru:'Пятница', en:'Friday', id:'Jumat' },
            timeStart: '20:00',
            timeEnd:   '23:30',
            isActive:  true,
          },
        ],
      };
    } catch { return { isActive: false, slots: [] }; }
  },

  getSlots()     { return this._getConfig().slots?.filter(s => s.isActive) ?? []; },
  isActive()     { return this._getConfig().isActive ?? false; },
  getInactiveMsg(){ return this._getConfig().inactiveMessage ?? {}; },
  getConfirmMsg() { return this._getConfig().confirmationMessage ?? {}; },

  /* ثبت پاسخ کاربر */
  saveResponse(slotId, response) {
    try {
      const user = AuthState.getUser();
      if (!user) return false;

      const responses = JSON.parse(localStorage.getItem('mh_meeting_responses') || '[]');
      /* جستجو بر اساس userId + slotId — هر slot مستقل است */
      const existing  = responses.findIndex(r => r.userId === user.id && r.slotId === slotId);

      const entry = {
        userId:    user.id,
        userName:  user.name,
        userLang:  i18n.lang,
        userEmail: user.email,
        slotId,
        response,   /* 'yes' | 'no' */
        timestamp:  new Date().toISOString(),
      };

      if (existing !== -1) responses[existing] = entry;
      else                 responses.push(entry);

      localStorage.setItem('mh_meeting_responses', JSON.stringify(responses));
      return true;
    } catch { return false; }
  },

  /* پاسخ کاربر برای یک slot خاص */
  getUserResponse(slotId) {
    try {
      const user = AuthState.getUser();
      if (!user) return null;
      const responses = JSON.parse(localStorage.getItem('mh_meeting_responses') || '[]');
      if (slotId) return responses.find(r => r.userId === user.id && r.slotId === slotId) ?? null;
      return responses.find(r => r.userId === user.id) ?? null;
    } catch { return null; }
  },

  /* تعداد تأییدکنندگان یک slot */
  getSlotCount(slotId) {
    try {
      const responses = JSON.parse(localStorage.getItem('mh_meeting_responses') || '[]');
      return responses.filter(r => r.slotId === slotId && r.response === 'yes').length;
    } catch { return 0; }
  },

  /* لغو دیدار برای یک slot خاص */
  cancelResponse(slotId) {
    try {
      const user = AuthState.getUser();
      if (!user) return false;
      const responses = JSON.parse(localStorage.getItem('mh_meeting_responses') || '[]');
      const filtered  = slotId
        ? responses.filter(r => !(r.userId === user.id && r.slotId === slotId))
        : responses.filter(r => r.userId !== user.id);
      localStorage.setItem('mh_meeting_responses', JSON.stringify(filtered));
      return true;
    } catch { return false; }
  },
};

/* ────────────────────────────────────────────────────────────
   3. DATE FORMATTER (بر اساس زبان کاربر)
   ──────────────────────────────────────────────────────────── */
function _formatSlotDate(dateStr, dayName) {
  const date = new Date(dateStr + 'T12:00:00');
  try {
    const formatted = new Intl.DateTimeFormat(i18n.config.locale, {
      year:  'numeric',
      month: 'long',
      day:   'numeric',
    }).format(date);
    return formatted;
  } catch {
    return dateStr;
  }
}

function _getMonthLabel(dateStr) {
  const date = new Date(dateStr + 'T12:00:00');
  try {
    return new Intl.DateTimeFormat(i18n.config.locale, { month: 'short' }).format(date);
  } catch { return ''; }
}

function _getDayNum(dateStr) {
  return new Date(dateStr + 'T12:00:00').getDate();
}

/* ────────────────────────────────────────────────────────────
   4. MEETING PAGE RENDERER
   ──────────────────────────────────────────────────────────── */
export function renderMeetingPage(container) {
  if (!container) return;

  let _showConfirmModal = false;
  let _confirmedSlotId  = null;

  function _render() {
    const isActive     = MeetingData.isActive();
    const slots        = MeetingData.getSlots();
    const userResponse = MeetingData.getUserResponse();
    const isLoggedIn   = AuthState.isLoggedIn();

    /* تولید ستاره‌های دکوراتیو */
    const stars = Array.from({ length: 30 }, (_, i) => {
      const size  = Math.random() * 3 + 1;
      const left  = Math.random() * 100;
      const top   = Math.random() * 100;
      const dur   = (Math.random() * 3 + 2).toFixed(1);
      const delay = (Math.random() * 3).toFixed(1);
      return `<div class="meeting-hero__star" style="
        width:${size}px;height:${size}px;
        left:${left}%;top:${top}%;
        --dur:${dur}s;--delay:${delay}s;
      "></div>`;
    }).join('');

    container.innerHTML = `

      <!-- Hero -->
      <div class="meeting-hero">
        <div class="meeting-hero__stars" aria-hidden="true">${stars}</div>
        <div class="container meeting-hero__inner">
          <span class="meeting-hero__dome" aria-hidden="true">🕌</span>
          <h1 class="meeting-hero__title">${tx(MC.pageTitle)}</h1>
          <p class="meeting-hero__subtitle">${tx(MC.pageSubtitle)}</p>
        </div>
      </div>

      <!-- Content -->
      <div class="section">
        <div class="container" style="max-width:860px">

          ${isActive && slots.length > 0
            ? _renderActiveSection(slots, userResponse, isLoggedIn)
            : _renderInactiveSection()
          }

        </div>
      </div>

      <!-- Confirmation Modal -->
      ${_showConfirmModal ? _renderConfirmModal(_confirmedSlotId) : ''}
    `;

    _bindEvents();
  }

  /* ── بخش فعال ── */
  function _renderActiveSection(slots, userResponse, isLoggedIn) {
    return `
      <!-- Badge فعال -->
      <div style="text-align:center;margin-bottom:var(--space-6)">
        <div class="meeting-active-badge" style="display:inline-flex">
          <div class="meeting-active-badge__dot" aria-hidden="true"></div>
          ${tx(MC.activeLabel)}
        </div>
      </div>

      <!-- اگر کاربر قبلاً ثبت کرده -->
      ${userResponse ? _renderUserResponse(userResponse) : ''}

      <!-- لیست slot ها -->
      <div class="slots-grid" role="list" aria-label="${tx(MC.pageTitle)}">
        ${slots.map(slot => _renderSlotCard(slot, userResponse, isLoggedIn)).join('')}
      </div>

      <!-- اگر لاگین نیست -->
      ${!isLoggedIn ? `
        <div style="text-align:center;margin-top:var(--space-4)">
          <p style="color:var(--text-muted);font-size:var(--text-sm);margin-bottom:var(--space-4)">
            ${tx(MC.loginRequired)}
          </p>
          <a href="/auth.html" class="btn btn--primary btn--lg">
            ${tx({ fa:'ورود / ثبت‌نام', ar:'دخول / تسجيل', ur:'لاگ ان / رجسٹر', en:'Login / Register', tr:'Giriş / Kayıt', ru:'Войти / Регистрация', az:'Daxil ol / Qeydiyyat', id:'Masuk / Daftar' })}
          </a>
        </div>
      ` : ''}
    `;
  }

  /* ── کارت هر slot ── */
  function _renderSlotCard(slot, userResponse, isLoggedIn) {
    const count          = MeetingData.getSlotCount(slot.id);
    /* پاسخ کاربر فقط برای این slot */
    const slotResponse   = MeetingData.getUserResponse(slot.id);
    const userCameYes    = slotResponse?.response === 'yes';
    const userCameNo     = slotResponse?.response === 'no';

    return `
      <div class="slot-card ${userCameYes ? 'slot-card--confirmed' : userCameNo ? 'slot-card--declined' : ''}"
        role="listitem"
        aria-label="${tx(slot.dayName)} — ${_formatSlotDate(slot.date, slot.dayName)}"
      >
        <!-- تاریخ -->
        <div class="slot-card__date-bar">
          <div>
            <div class="slot-card__day-name">${tx(slot.dayName)}</div>
            <div style="font-size:var(--text-sm);color:rgba(255,255,255,0.7);margin-top:4px">
              ${_formatSlotDate(slot.date, slot.dayName)}
            </div>
          </div>
          <div class="slot-card__date-num" aria-hidden="true">
            <span class="slot-card__date-day">${_getDayNum(slot.date)}</span>
            <span class="slot-card__date-month">${_getMonthLabel(slot.date)}</span>
          </div>
        </div>

        <!-- بدنه -->
        <div class="slot-card__body">

          <!-- ساعت -->
          <div class="slot-card__time" aria-label="${tx(MC.timeLabel)}: ${slot.timeStart} تا ${slot.timeEnd}">
            <div class="slot-card__time-icon" aria-hidden="true">🕐</div>
            <span>${slot.timeStart} — ${slot.timeEnd}</span>
          </div>

          <!-- تعداد حاضران فقط برای ادمین -->

          <!-- دکمه‌ها -->
          ${isLoggedIn ? `
            <div class="slot-card__actions">
              ${userCameYes
                ? `<div style="grid-column:1/-1;display:flex;flex-direction:column;gap:var(--space-2)">
                    <div class="slot-card__status-tag slot-card__status-tag--confirmed" role="status">
                      ✓ ${tx(MC.confirmed)}
                    </div>
                    <button class="slot-btn slot-btn--no" data-slot-id="${slot.id}" data-answer="no" style="font-size:var(--text-xs);opacity:0.7">
                      ${tx(MC.noBtn)}
                    </button>
                  </div>`
                : userCameNo
                  ? `<div style="grid-column:1/-1;display:flex;flex-direction:column;gap:var(--space-2)">
                      <div class="slot-card__status-tag slot-card__status-tag--declined" role="status">
                        ${tx(MC.declined)}
                      </div>
                      <button class="slot-btn slot-btn--yes" data-slot-id="${slot.id}" data-answer="yes" style="font-size:var(--text-xs);opacity:0.7">
                        ${tx(MC.yesBtn)}
                      </button>
                    </div>`
                  : `
                      <button class="slot-btn slot-btn--yes" data-slot-id="${slot.id}" data-answer="yes" aria-label="${tx(MC.yesBtn)}">
                        ${tx(MC.yesBtn)}
                      </button>
                      <button class="slot-btn slot-btn--no" data-slot-id="${slot.id}" data-answer="no" aria-label="${tx(MC.noBtn)}">
                        ${tx(MC.noBtn)}
                      </button>
                    `
              }
            </div>
          ` : `
            <div style="text-align:center;padding:var(--space-3);font-size:var(--text-sm);color:var(--text-muted)">
              <a href="/auth.html" style="color:var(--color-primary-600);font-weight:var(--weight-semibold)">
                ${tx({ fa:'ورود برای ثبت', ar:'دخول للتسجيل', ur:'درج کے لیے لاگ ان', en:'Login to register', tr:'Kayıt için giriş', ru:'Войти для записи', az:'Qeyd üçün daxil ol', id:'Login untuk mendaftar' })}
              </a>
            </div>
          `}

        </div>
      </div>
    `;
  }

  /* ── وضعیت ثبت کاربر ── */
  function _renderUserResponse(userResponse) {
    if (userResponse.response !== 'yes') return '';

    const slot = MeetingData.getSlots().find(s => s.id === userResponse.slotId);
    if (!slot) return '';

    return `
      <div class="meeting-profile-card" style="margin-bottom:var(--space-6)" role="status" aria-label="${tx(MC.myMeeting)}">
        <div class="meeting-profile-card__title">
          🕌 ${tx(MC.myMeeting)}
        </div>
        <div class="meeting-profile-card__date">
          ${tx(slot.dayName)} — ${_formatSlotDate(slot.date, slot.dayName)}
        </div>
        <div class="meeting-profile-card__time">
          ${slot.timeStart} — ${slot.timeEnd}
        </div>
        <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:var(--space-3)">
          <div class="meeting-profile-card__status">
            <span aria-hidden="true">✓</span>
            ${tx(MC.confirmed)}
          </div>
          <button class="btn btn--ghost btn--sm" id="cancel-meeting-btn"
            style="color:rgba(255,255,255,0.6);border:1px solid rgba(255,255,255,0.2)"
            aria-label="${tx(MC.cancelBtn)}">
            ${tx(MC.cancelBtn)}
          </button>
        </div>
      </div>
    `;
  }

  /* ── بخش غیرفعال ── */
  function _renderInactiveSection() {
    const msg = MeetingData.getInactiveMsg();
    const text = msg[i18n.lang] ?? msg['fa'] ?? msg['en'] ?? '';

    return `
      <div class="meeting-status-banner meeting-status-banner--inactive" role="status">
        <span class="meeting-status-banner__inactive-icon" aria-hidden="true">🌙</span>
        <p class="meeting-status-banner__inactive-text">${text}</p>
      </div>
    `;
  }

  /* ── مودال تأیید ── */
  function _renderConfirmModal(slotId) {
    const slot = MeetingData.getSlots().find(s => s.id === slotId);
    if (!slot) return '';

    const confirmMsg = MeetingData.getConfirmMsg();
    const msgText    = confirmMsg[i18n.lang] ?? confirmMsg['fa'] ?? confirmMsg['en'] ?? '';

    return `
      <div class="meeting-confirm-overlay" role="dialog" aria-modal="true" aria-label="${tx(MC.myMeeting)}" id="confirm-overlay">
        <div class="meeting-confirm-modal">

          <div class="meeting-confirm-modal__header">
            <span class="meeting-confirm-modal__icon" aria-hidden="true">✅</span>
            <h2 class="meeting-confirm-modal__title">
              ${tx({ fa:'دیدار شما ثبت شد', ar:'تم تسجيل لقاؤك', ur:'آپ کی ملاقات درج ہوگئی', az:'Görüşünüz qeydə alındı', tr:'Buluşmanız kaydedildi', ru:'Ваша встреча записана', en:'Your meeting is registered', id:'Pertemuan Anda terdaftar' })}
            </h2>
          </div>

          <div class="meeting-confirm-modal__body">

            <!-- اطلاعات دیدار -->
            <div style="background:var(--bg-surface-2);border:1px solid var(--border-color);border-radius:var(--radius-lg);padding:var(--space-4) var(--space-5);margin-bottom:var(--space-5);">
              <div style="display:flex;gap:var(--space-4);flex-wrap:wrap">
                <div>
                  <div style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:4px">📅 ${tx({ fa:'تاریخ', ar:'التاريخ', ur:'تاریخ', az:'Tarix', tr:'Tarih', ru:'Дата', en:'Date', id:'Tanggal'})}</div>
                  <div style="font-weight:var(--weight-bold);color:var(--text-primary)">${tx(slot.dayName)} — ${_formatSlotDate(slot.date, slot.dayName)}</div>
                </div>
                <div>
                  <div style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:4px">🕐 ${tx(MC.timeLabel)}</div>
                  <div style="font-weight:var(--weight-bold);color:var(--text-primary)" dir="ltr">${slot.timeStart} — ${slot.timeEnd}</div>
                </div>
              </div>
            </div>

            <!-- پیام ادمین -->
            ${msgText ? `
              <div class="meeting-confirm-modal__message" lang="${i18n.lang}" dir="${i18n.dir}">
                ${msgText}
              </div>
            ` : ''}

            <!-- دکمه بستن -->
            <button class="btn btn--primary btn--lg w-full" id="close-confirm-modal" style="margin-top:var(--space-2)">
              ${tx({ fa:'متوجه شدم', ar:'فهمت', ur:'سمجھ گیا', az:'Başa düşdüm', tr:'Anladım', ru:'Понял(а)', en:'Got it', id:'Mengerti' })}
            </button>

          </div>
        </div>
      </div>
    `;
  }

  /* ────────────────────────────────────────────────────────
     EVENT BINDINGS
     ──────────────────────────────────────────────────────── */
  function _bindEvents() {
    /* دکمه‌های بله/نه */
    container.querySelectorAll('.slot-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (!AuthState.isLoggedIn()) {
          window.location.href = '/auth.html';
          return;
        }

        const slotId = btn.dataset.slotId;
        const answer = btn.dataset.answer;

        const saved = MeetingData.saveResponse(slotId, answer);
        if (!saved) return;

        if (answer === 'yes') {
          _confirmedSlotId  = slotId;
          _showConfirmModal = true;
          _render();
        } else {
          _render();
        }
      });
    });

    /* بستن مودال */
    document.getElementById('close-confirm-modal')?.addEventListener('click', () => {
      _showConfirmModal = false;
      _confirmedSlotId  = null;
      _render();
    });

    /* کلیک خارج از مودال */
    document.getElementById('confirm-overlay')?.addEventListener('click', (e) => {
      if (e.target === document.getElementById('confirm-overlay')) {
        _showConfirmModal = false;
        _render();
      }
    });

    /* Escape key */
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && _showConfirmModal) {
        _showConfirmModal = false;
        _render();
      }
    }, { once: true });

    /* لغو دیدار */
    document.getElementById('cancel-meeting-btn')?.addEventListener('click', () => {
      const confirmed = confirm(tx(MC.cancelConfirm));
      if (confirmed) {
        MeetingData.cancelResponse();
        _render();
      }
    });
  }

  _render();
  i18n.onChange(() => _render());
}

/* ────────────────────────────────────────────────────────────
   5. PROFILE WIDGET (برای صفحه پروفایل)
   ──────────────────────────────────────────────────────────── */
export function renderMeetingProfileWidget(container) {
  if (!container) return;

  const userResponse = MeetingData.getUserResponse();
  if (!userResponse || userResponse.response !== 'yes') {
    container.innerHTML = '';
    return;
  }

  const slots = MeetingData.getSlots();
  const slot  = slots.find(s => s.id === userResponse.slotId);
  if (!slot) { container.innerHTML = ''; return; }

  container.innerHTML = `
    <div class="meeting-profile-card" role="region" aria-label="${tx(MC.myMeeting)}">
      <div class="meeting-profile-card__title">
        🕌 ${tx(MC.myMeeting)}
      </div>
      <div class="meeting-profile-card__date">
        ${tx(slot.dayName)} — ${_formatSlotDate(slot.date, slot.dayName)}
      </div>
      <div class="meeting-profile-card__time" dir="ltr">
        ${slot.timeStart} — ${slot.timeEnd}
      </div>
      <div class="meeting-profile-card__status">
        ✓ ${tx(MC.confirmed)}
      </div>
    </div>
  `;
}

/* ────────────────────────────────────────────────────────────
   6. ADMIN DATA EXPORT (برای داشبورد ادمین)
   ──────────────────────────────────────────────────────────── */
export function getMeetingAdminData() {
  try {
    const responses = JSON.parse(localStorage.getItem('mh_meeting_responses') || '[]');
    const slots     = MeetingData.getSlots();

    return slots.map(slot => ({
      slot,
      date:         _formatSlotDate(slot.date, slot.dayName),
      timeRange:    `${slot.timeStart} — ${slot.timeEnd}`,
      confirmed:    responses.filter(r => r.slotId === slot.id && r.response === 'yes'),
      declined:     responses.filter(r => r.slotId === slot.id && r.response === 'no'),
      totalCount:   responses.filter(r => r.slotId === slot.id && r.response === 'yes').length,
    }));
  } catch { return []; }
}
