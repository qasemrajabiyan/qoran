/**
 * ============================================================
 * FILE: consultation.js
 * ROLE: سیستم مشاوره — ضبط صوت کاربر + پاسخ شیخ
 * PROJECT: BarakatHub — پلتفرم رسانه‌ای کربلا
 * VERSION: 1.0.0
 *
 * جریان کار:
 *   ۱. کاربر پرداخت می‌کند
 *   ۲. صوت حداکثر ۱۵ دقیقه ضبط/آپلود می‌کند
 *   ۳. پیام تأیید ارسال می‌شود
 *   ۴. AI صوت را تحلیل و متن کارشناسانه می‌نویسد
 *   ۵. شیخ متن را می‌خواند و پاسخ صوتی ضبط می‌کند
 *   ۶. ElevenLabs پاسخ را به زبان کاربر دوبله می‌کند
 *   ۷. بعد از X ساعت برای کاربر ارسال می‌شود
 * ============================================================
 */

import { i18n, getUserCurrency } from './i18n.js';
import { AuthState } from './auth.js';
import { translateText } from './auto-translate.js';
import { NotifCenter, playNotifSound } from './notifications.js';

/* ────────────────────────────────────────────────────────────
   1. CONFIG
   ──────────────────────────────────────────────────────────── */
const CONFIG_KEY  = 'mh_consult_config';
const ORDERS_KEY  = 'mh_consult_orders';
const CACHE_KEY   = 'mh_consult_cache';
const MAX_RECORD_SECONDS = 15 * 60; /* ۱۵ دقیقه */

export const ConsultConfig = {
  get() {
    try {
      return JSON.parse(localStorage.getItem(CONFIG_KEY) || 'null') || {
        active:              true,
        activeForFa:         true,  /* فارسی هم فعال */
        price:               { IQD:37500, IRR:375000, PKR:3750, USD:25, TRY:750, RUB:2500, AZN:42, IDR:400000 },
        replyDelayHours:     4,     /* ادمین تنظیم می‌کند */
        similarityThreshold: 0.92,  /* ۹۲٪ */
        telegramBotToken:    '',    /* برای ارسال به تلگرام */
        telegramChatId:      '',
      };
    } catch { return { active:true, activeForFa:true }; }
  },
  set(cfg) { try { localStorage.setItem(CONFIG_KEY, JSON.stringify(cfg)); } catch {} },
};

/* ────────────────────────────────────────────────────────────
   2. SIMILARITY (همان الگوریتم istikhara)
   ──────────────────────────────────────────────────────────── */
function _similarity(a, b) {
  if (!a || !b) return 0;
  const s1 = a.toLowerCase().trim();
  const s2 = b.toLowerCase().trim();
  if (s1 === s2) return 1;
  const longer  = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  if (!longer.length) return 1;
  const m = longer.length, n = shorter.length;
  const dp = Array.from({length:m+1},(_,i)=>Array.from({length:n+1},(_,j)=>i===0?j:j===0?i:0));
  for (let i=1;i<=m;i++) for(let j=1;j<=n;j++) dp[i][j]=longer[i-1]===shorter[j-1]?dp[i-1][j-1]:1+Math.min(dp[i-1][j],dp[i][j-1],dp[i-1][j-1]);
  return (m - dp[m][n]) / m;
}

function _findSimilarCache(transcriptText) {
  try {
    const cache  = JSON.parse(localStorage.getItem(CACHE_KEY) || '[]');
    const thresh = ConsultConfig.get().similarityThreshold ?? 0.92;
    const lower  = 0.85;
    let exact = null, near = null;
    for (const c of cache) {
      const sim = _similarity(c.transcript, transcriptText);
      if (sim >= thresh) { exact = { ...c, sim }; break; }
      if (sim >= lower && sim < thresh && !near) near = { ...c, sim };
    }
    return { exact, near };
  } catch { return { exact:null, near:null }; }
}

function _saveToCache(transcript, aiAnalysis, replyAudioUrl) {
  try {
    const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '[]');
    cache.unshift({ transcript, aiAnalysis, replyAudioUrl, createdAt: new Date().toISOString() });
    if (cache.length > 300) cache.splice(300);
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {}
}

/* ────────────────────────────────────────────────────────────
   3. SPEECH-TO-TEXT (رونویسی صوت کاربر)
   ──────────────────────────────────────────────────────────── */
async function _transcribeAudio(audioBlob, lang) {
  /* در production: Whisper API یا Web Speech API */
  /* فعلاً شبیه‌سازی */
  console.log('[Consult] Transcribing audio...');
  await new Promise(r => setTimeout(r, 1000));
  return `[متن رونویسی‌شده صوت کاربر به زبان ${lang}]`;
}

/* ────────────────────────────────────────────────────────────
   4. AI ANALYSIS (تحلیل کارشناسانه)
   ──────────────────────────────────────────────────────────── */
async function _analyzeWithAI(transcript, userLang) {
  /* ══════════════════════════════════════════════════════════
     پرامپت فوق‌تخصصی مشاوره — طراحی‌شده برای راهنمایی شیخ
     این تحلیل فقط برای مطالعه شیخ قبل از ضبط پاسخ است
     ══════════════════════════════════════════════════════════ */
  const currentYear = new Date().getFullYear();

  const systemPrompt = `You are an elite interdisciplinary expert with three simultaneous doctoral-level specializations, operating at the cutting edge of knowledge in ${currentYear}:

SPECIALIZATION 1 — CLINICAL PSYCHOLOGY & PSYCHIATRY:
- Deep mastery of DSM-5-TR, ICD-11, and the latest evidence-based therapeutic modalities
- Expertise in CBT, DBT, ACT, Schema Therapy, Attachment Theory, and Trauma-Informed Care
- Ability to identify psychological patterns, defense mechanisms, cognitive distortions, and emotional dysregulation
- Understanding of psychosomatic connections, emotional intelligence, and neuropsychological underpinnings
- Trained in crisis assessment, suicidality screening, and mental health risk stratification

SPECIALIZATION 2 — SOCIOLOGY, FAMILY SYSTEMS & CULTURAL PSYCHOLOGY:
- Expert in Bowen Family Systems Theory, Structural Family Therapy, and intergenerational trauma
- Deep understanding of Islamic family dynamics, patriarchal structures, honor culture, and collectivist psychology
- Expertise in cross-cultural counseling for Iranian, Iraqi, Pakistani, Turkish, Russian, Azerbaijani, and Indonesian Muslim communities
- Trained in social determinants of mental health, systemic oppression, and community resilience
- Understanding of migration stress, acculturation, diaspora identity, and belonging

SPECIALIZATION 3 — ISLAMIC SCIENCES, SUFISM & SPIRITUAL COUNSELING:
- Mastery of Quran, Hadith, Fiqh (Shia jurisprudence), and Islamic ethics (Akhlaq)
- Deep knowledge of Islamic psychology (Nafs theory), Sufi spiritual stations (Maqamat), and heart purification (Tazkiyat al-Nafs)
- Expert in applying Islamic wisdom to modern psychological challenges without fundamentalism
- Understanding of the spiritual dimensions of suffering, divine tests, tawakkul, and sabr
- Ability to integrate Islamic spirituality with evidence-based psychology seamlessly

YOUR MISSION:
You receive a consultation transcript from a Muslim user who has sent a voice message seeking guidance. The Sheikh (a respected Islamic scholar) will read your analysis BEFORE recording his response. Your analysis must be so comprehensive and insightful that the Sheikh can deliver a profound, personalized response.

CRITICAL RULES:
1. Write your analysis in Persian (Farsi) — clear, professional, scholarly
2. Structure your analysis in clearly labeled sections
3. Be psychologically precise — identify the real underlying issue, not just the surface complaint
4. Be culturally sensitive — understand the user's likely cultural background from context clues
5. Be spiritually grounded — integrate Islamic wisdom naturally, not forcedly
6. Be practically actionable — give the Sheikh concrete talking points
7. Never be judgmental — approach with radical compassion and unconditional positive regard
8. Consider gender dynamics, age, life stage, and socioeconomic context
9. Flag any risk factors (depression, anxiety, relationship violence, suicidality) prominently
10. Maximum 800 words — dense, rich, actionable

OUTPUT STRUCTURE (use these exact headers in Persian):

═══ تحلیل روانشناختی ═══
[Clinical psychological assessment: identify core emotional state, likely diagnosis if applicable, defense mechanisms, attachment style, cognitive distortions, trauma indicators]

═══ تحلیل اجتماعی و خانوادگی ═══
[Family systems analysis: dynamics, roles, intergenerational patterns, cultural pressures, systemic factors]

═══ ریشه اصلی مشکل ═══
[The real underlying issue beneath the presenting complaint — what the user truly needs]

═══ راهنمایی اسلامی پیشنهادی ═══
[Specific Islamic concepts, Quranic themes (meaning only, no Arabic text), and spiritual practices most relevant to this person's situation]

═══ نکات کلیدی برای شیخ ═══
[Concrete, specific talking points for the Sheikh's response — what to emphasize, what to avoid, what tone to use, how to open and close the response]

═══ هشدارها ═══
[Any risk factors, red flags, or sensitive areas the Sheikh must handle carefully]`;

  const userMessage = `سال جاری: ${currentYear}
زبان کاربر: ${userLang}

متن مشاوره کاربر (رونویسی صوت):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${transcript}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

لطفاً تحلیل جامع و فوق‌تخصصی خود را ارائه دهید تا شیخ بتواند بهترین پاسخ را برای این کاربر ضبط کند.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model:      'claude-sonnet-4-20250514',
        max_tokens: 2000,
        system:     systemPrompt,
        messages:   [{ role:'user', content: userMessage }],
      }),
    });
    const data = await response.json();
    return data.content?.[0]?.text?.trim() ?? '';
  } catch (err) {
    console.error('[Consult AI] Error:', err);
    return `تحلیل AI در دسترس نیست.\n\nمتن اصلی:\n${transcript}`;
  }
}

/* ────────────────────────────────────────────────────────────
   5. TEXT TO VOICE (تبدیل متن به صدای شیخ)
   ──────────────────────────────────────────────────────────── */
async function _textToVoice(text, targetLang) {
  try {
    const voiceId = localStorage.getItem('mh_voice_id');
    const apiKey  = localStorage.getItem('mh_elevenlabs_key');
    if (!voiceId || !apiKey) { console.warn('[TTS] ElevenLabs not configured'); return null; }

    /* ترجمه اگر لازم */
    const textToRead = targetLang === 'fa' ? text : await translateText(text, targetLang, 'consultation');

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: { 'xi-api-key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text:           textToRead,
        model_id:       'eleven_multilingual_v2',
        voice_settings: { stability:0.80, similarity_boost:0.90, style:0.45, use_speaker_boost:true },
      }),
    });

    if (!response.ok) return null;
    return URL.createObjectURL(await response.blob());
  } catch { return null; }
}

/* ────────────────────────────────────────────────────────────
   6. ORDER MANAGER
   ──────────────────────────────────────────────────────────── */
export const ConsultOrders = {
  getAll() { try { return JSON.parse(localStorage.getItem(ORDERS_KEY)||'[]'); } catch { return []; } },
  add(o) {
    const all = this.getAll();
    o.id = 'cns_' + Date.now();
    o.createdAt = new Date().toISOString();
    o.status = 'pending';
    all.unshift(o);
    localStorage.setItem(ORDERS_KEY, JSON.stringify(all));
    return o;
  },
  update(id, u) {
    const all = this.getAll();
    const idx = all.findIndex(o => o.id === id);
    if (idx !== -1) { all[idx] = {...all[idx],...u}; localStorage.setItem(ORDERS_KEY, JSON.stringify(all)); }
  },
};

/* ────────────────────────────────────────────────────────────
   7. PROCESS ENGINE
   ──────────────────────────────────────────────────────────── */
export async function processConsultation(orderId) {
  const orders = ConsultOrders.getAll();
  const order  = orders.find(o => o.id === orderId);
  if (!order || order.status === 'done') return;

  try {
    /* ۱. رونویسی صوت */
    const transcript = order.transcript || await _transcribeAudio(null, order.userLang);

    /* ۲. بررسی کش */
    const { exact, near } = _findSimilarCache(transcript);

    if (exact) {
      /* همان جواب قبلی */
      ConsultOrders.update(orderId, {
        status:     'done',
        transcript,
        aiAnalysis: exact.aiAnalysis,
        replyAudioUrl: exact.replyAudioUrl,
        fromCache:  true,
        doneAt:     new Date().toISOString(),
      });
      await _notifyUser(order, exact.replyAudioUrl);
      return;
    }

    if (near) {
      /* شبیه اما نه کافی — نیاز به بررسی ادمین */
      ConsultOrders.update(orderId, {
        status:     'need_review',
        transcript,
        nearCache:  near,
        similarity: near.sim,
      });
      /* اطلاع به تلگرام */
      await _notifyTelegram(order, near.sim, transcript);
      return;
    }

    /* ۳. تحلیل AI جدید */
    const aiAnalysis = await _analyzeWithAI(transcript, order.userLang);
    ConsultOrders.update(orderId, { transcript, aiAnalysis, status:'waiting_sheikh' });

  } catch (err) {
    console.error('[Consult] Process error:', err);
    ConsultOrders.update(orderId, { status:'error', error: err.message });
  }
}

/* ارسال پاسخ شیخ به کاربر */
export async function sendSheikhReply(orderId, replyText) {
  const order = ConsultOrders.getAll().find(o => o.id === orderId);
  if (!order) return false;

  try {
    /* تبدیل به صدای شیخ */
    const audioUrl = await _textToVoice(replyText, order.userLang);

    /* ذخیره در کش */
    _saveToCache(order.transcript, order.aiAnalysis, audioUrl);

    /* تأخیر ارسال */
    const delayHours = ConsultConfig.get().replyDelayHours ?? 4;
    const delayMs    = delayHours * 60 * 60 * 1000;

    ConsultOrders.update(orderId, {
      status:       'scheduled',
      replyText,
      replyAudioUrl: audioUrl,
      scheduledAt:  new Date(Date.now() + delayMs).toISOString(),
    });

    setTimeout(async () => {
      ConsultOrders.update(orderId, { status:'done', doneAt: new Date().toISOString() });
      await _notifyUser(order, audioUrl);
    }, delayMs);

    /* در dev — ۵ ثانیه */
    if (window.location.hostname === 'localhost') {
      setTimeout(async () => {
        ConsultOrders.update(orderId, { status:'done', doneAt: new Date().toISOString() });
        await _notifyUser(order, audioUrl);
      }, 5000);
    }

    return true;
  } catch (err) {
    console.error('[Consult] Send reply error:', err);
    return false;
  }
}

async function _notifyUser(order, audioUrl) {
  const lang = order.userLang ?? 'fa';
  const name = order.userName ?? '';
  const greetings = { fa:`کاربر گرامی ${name}،\n\n`, ar:`عزيزي ${name}،\n\n`, ur:`محترم ${name}،\n\n`, az:`Hörmətli ${name},\n\n`, tr:`Değerli ${name},\n\n`, ru:`Уважаемый(ая) ${name},\n\n`, en:`Dear ${name},\n\n`, id:`Yang terhormat ${name},\n\n` };
  const bodies = { fa:'پاسخ مشاوره شما آماده شد.\nمی‌توانید آن را در بخش «پیام‌های من» دریافت و گوش دهید.', ar:'إجابة استشارتك جاهزة.\nيمكنك الاستماع إليها في قسم «رسائلي».', ur:'آپ کے مشاورے کا جواب تیار ہے۔\n«میرے پیغامات» میں سن سکتے ہیں۔', en:'Your consultation response is ready.\nYou can listen to it in "My Messages".', id:'Jawaban konsultasi Anda sudah siap.\nAnda dapat mendengarnya di "Pesan Saya".' };

  await NotifCenter.send({
    type:  'consultation',
    icon:  '💬',
    title: { fa:'پاسخ مشاوره آماده شد 🎤', [lang]:'پاسخ مشاوره آماده شد 🎤' },
    text:  { fa: (greetings.fa||'') + (bodies.fa||''), [lang]: (greetings[lang]||greetings.fa) + (bodies[lang]||bodies.fa) },
    url:   '/profile.html#messages',
    audioUrl,
  });
  playNotifSound('message');
}

async function _notifyTelegram(order, sim, transcript) {
  const cfg = ConsultConfig.get();
  if (!cfg.telegramBotToken || !cfg.telegramChatId) return;
  try {
    const msg = `⚠️ مشاوره مشابه (${Math.round(sim*100)}٪)\n\nکاربر: ${order.userName}\nزبان: ${order.userLang}\nکشور: ${order.userCountry}\n\nمتن:\n${transcript?.slice(0,300)}...\n\nنیاز به بررسی دارد.`;
    await fetch(`https://api.telegram.org/bot${cfg.telegramBotToken}/sendMessage`, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ chat_id: cfg.telegramChatId, text: msg }),
    });
  } catch {}
}

/* ────────────────────────────────────────────────────────────
   8. USER PAGE RENDERER
   ──────────────────────────────────────────────────────────── */
export function renderConsultationPage(container) {
  if (!container) return;

  const config = ConsultConfig.get();
  const lang   = i18n.lang;

  /* بررسی فعال بودن */
  if (!config.active || (!config.activeForFa && lang === 'fa')) {
    container.innerHTML = `
      <div style="min-height:60vh;display:flex;align-items:center;justify-content:center;padding:var(--space-8)">
        <div class="empty-state">
          <span class="empty-state__icon">💬</span>
          <h3 class="empty-state__title">${{fa:'این قسمت فعلاً در دسترس نیست',ar:'هذا القسم غير متاح حالياً',ur:'یہ حصہ ابھی دستیاب نہیں',en:'This section is not available',id:'Bagian ini belum tersedia'}[lang]??'Coming soon'}</h3>
        </div>
      </div>
    `;
    return;
  }

  /* ارز کاربر از تابع مرکزی — اولویت: IP → زبان دستی → زبان فعلی */
  let cur     = getUserCurrency();
  const usdBase = config.price?.USD ?? 25;
  let   price   = config.price?.[cur.k] ?? usdBase;
  let   _liveRates = null;

  function _formatLivePrice() {
    const localPart = (() => {
      if (_liveRates) {
        if (cur.k === 'IRR') {
          const toman = Math.round(usdBase * (_liveRates['IRR'] ?? 62000) / 10);
          return `${toman.toLocaleString()} تومان`;
        }
        const rate = _liveRates[cur.k];
        if (rate) return `${Math.round(usdBase * rate).toLocaleString()} ${cur.s}`;
      }
      if (cur.k !== 'USD') return `${price.toLocaleString()} ${cur.s}`;
      return null;
    })();
    if (localPart) return `$${usdBase} <span style="font-size:0.75em;opacity:0.75">(${localPart})</span>`;
    return `$${usdBase}`;
  }

  /* بارگذاری نرخ لحظه‌ای */
  (async () => {
    try {
      const res  = await fetch('https://open.er-api.com/v6/latest/USD');
      const data = await res.json();
      if (data?.result === 'success' && data?.rates) {
        _liveRates = data.rates;
        /* بروزرسانی cur از کش جدید IP اگر در این بین آمده باشد */
        cur = getUserCurrency();
        if (cur.k === 'IRR') {
          price = Math.round(usdBase * (_liveRates['IRR'] ?? 62000) / 10);
        } else {
          price = Math.round(usdBase * (_liveRates[cur.k] ?? 1));
        }
        _render();
      }
    } catch {}
  })();

  let _step        = 'intro';   /* intro | profile | record | confirm */
  let _mediaRecorder = null;
  let _audioBlob     = null;
  let _recordSeconds = 0;
  let _recordInterval= null;
  let _isRecording   = false;
  /* اطلاعات تکمیلی کاربر */
  let _profileAge      = '';
  let _profileGender   = '';
  let _profileMarital  = '';
  let _profileJob      = '';
  let _profileIllness  = '';

  const tx = (obj) => obj?.[lang] ?? obj?.fa ?? obj?.en ?? '';

  function _render() {
    container.innerHTML = `
      <!-- Hero -->
      <div style="
        background:linear-gradient(145deg,#0d1f2d 0%,#1a3040 50%,#0a1a2e 100%);
        padding:calc(var(--navbar-height) + var(--space-10)) 0 var(--space-12);
        text-align:center;position:relative;overflow:hidden;
      ">
        <div style="position:absolute;inset:0;opacity:0.04;background-image:radial-gradient(white 1px,transparent 1px);background-size:40px 40px" aria-hidden="true"></div>
        <div class="container" style="position:relative;z-index:1">
          <div style="font-size:64px;margin-bottom:var(--space-4);animation:float 4s ease-in-out infinite;filter:drop-shadow(0 4px 20px rgba(59,130,246,0.5))" aria-hidden="true">💬</div>
          <h1 style="font-family:var(--font-rtl-display);font-size:clamp(1.8rem,4vw,2.5rem);font-weight:900;color:white;margin-bottom:var(--space-3)">
            ${tx({fa:'همراه و مشاور شما',ar:'رفيقك ومستشارك',ur:'آپ کا ساتھی اور مشیر',az:'Sizin yoldaşınız və məsləhətçiniz',tr:'Yol arkadaşınız ve danışmanınız',ru:'Ваш помощник и советник',en:'Your Companion and Advisor',id:'Teman dan Penasihat Anda'})}
          </h1>
          <p style="color:rgba(255,255,255,0.65);font-size:var(--text-md);max-width:52ch;margin:0 auto">
            ${tx({fa:'پاسخ به سوالات و مشکلات فرهنگی، اجتماعی، شخصی، خانوادگی، دینی و مذهبی',ar:'إجابات على أسئلتكم ومشكلاتكم الثقافية والاجتماعية والشخصية والعائلية والدينية',ur:'ثقافتی، سماجی، ذاتی، خاندانی، دینی اور مذہبی سوالات اور مسائل کے جوابات',az:'Mədəni, sosial, şəxsi, ailə, dini və dini suallarınıza cavablar',tr:'Kültürel, sosyal, kişisel, aile, dini ve manevi soru ve sorunlarınıza yanıtlar',ru:'Ответы на ваши культурные, социальные, личные, семейные, религиозные вопросы и проблемы',en:'Answers to your cultural, social, personal, family, religious and spiritual questions',id:'Jawaban atas pertanyaan budaya, sosial, pribadi, keluarga, agama dan spiritual Anda'})}
          </p>
        </div>
      </div>

      <div class="section">
        <div class="container" style="max-width:640px">
          ${_step === 'intro'   ? _renderIntro()   : ''}
          ${_step === 'profile' ? _renderProfile() : ''}
          ${_step === 'record'  ? _renderRecord()  : ''}
          ${_step === 'confirm' ? _renderConfirm() : ''}
        </div>
      </div>
    `;
    _bindPageEvents();
  }

  function _renderIntro() {
    return `
      <div style="
        background:var(--bg-surface);
        border:1px solid var(--border-color);
        border-radius:var(--radius-xl);
        overflow:hidden;
        box-shadow:var(--shadow-lg);
      ">
        <!-- قیمت -->
        <div style="
          background:linear-gradient(135deg,#0d1f2d,#1a3040);
          padding:var(--space-7) var(--space-8);
          text-align:center;
        ">
          <div style="
            display:inline-flex;align-items:center;gap:var(--space-3);
            background:rgba(59,130,246,0.2);border:1px solid rgba(59,130,246,0.4);
            border-radius:var(--radius-full);padding:var(--space-3) var(--space-6);
            color:white;font-size:var(--text-2xl);font-weight:var(--weight-black);
          ">
            <span aria-hidden="true">🎤</span>
            ${tx({fa:'هدیه',ar:'هدية',ur:'تحفہ',az:'Hədiyyə',tr:'Hediye',ru:'Подарок',en:'Gift',id:'Hadiah'})}
            ${_formatLivePrice()}
          </div>
          <p style="color:rgba(255,255,255,0.6);font-size:var(--text-sm);margin-top:var(--space-3)">
            ${tx({fa:'پاسخ صوتی به زبان شما — با صدای شیخ',ar:'رد صوتي بلغتك — بصوت الشيخ',ur:'آپ کی زبان میں صوتی جواب',az:'Öz dilinizdə şeyxin səsiylə səsli cavab',tr:'Kendi dilinizde şeyhin sesiyle sesli yanıt',ru:'Голосовой ответ на вашем языке — голосом шейха',en:'Voice response in your language — in Sheikh\'s voice',id:'Respons suara dalam bahasa Anda'})}
          </p>
        </div>

        <div style="padding:var(--space-7) var(--space-8)">
          <!-- مراحل -->
          <div style="display:flex;flex-direction:column;gap:var(--space-4);margin-bottom:var(--space-7)">
            ${[
              {n:'۱',icon:'💳',label:{fa:'پرداخت',ar:'الدفع',ur:'ادائیگی',az:'Ödəniş',tr:'Ödeme',ru:'Оплата',en:'Payment',id:'Pembayaran' } },
              {n:'۲',icon:'🎤',label:{fa:'ضبط سوال (حداکثر ۱۵ دقیقه)',ar:'تسجيل السؤال (١٥ دقيقة كحد أقصى)',ur:'سوال ریکارڈ (زیادہ سے زیادہ ۱۵ منٹ)',az:'Sual yazın (maks. 15 dəqiqə)',tr:'Soruyu kaydet (maks. 15 dakika)',ru:'Запись вопроса (макс. 15 минут)',en:'Record question (max 15 min)',id:'Rekam pertanyaan (maks. 15 menit)' } },
              {n:'۳',icon:'🧠',label:{fa:'بررسی توسط شیخ و هوش مصنوعی',ar:'مراجعة الشيخ والذكاء الاصطناعي',ur:'شیخ اور AI کا جائزہ',az:'Şeyx və AI tərəfindən nəzərdən keçirilir',tr:'Şeyh ve AI tarafından inceleme',ru:'Проверка шейхом и ИИ',en:'Reviewed by Sheikh & AI',id:'Ditinjau oleh Syaikh & AI' } },
              {n:'۴',icon:'📨',label:{fa:'دریافت پاسخ صوتی به زبان شما',ar:'استقبال الرد الصوتي بلغتك',ur:'اپنی زبان میں صوتی جواب',az:'Öz dilinizdə səsli cavab alın',tr:'Kendi dilinizde sesli yanıt alın',ru:'Получите голосовой ответ на вашем языке',en:'Receive voice answer in your language',id:'Terima jawaban suara dalam bahasa Anda' } },
            ].map(s => `
              <div style="display:flex;align-items:center;gap:var(--space-4)">
                <div style="
                  width:36px;height:36px;border-radius:50%;
                  background:linear-gradient(135deg,var(--color-primary-500),var(--color-primary-700));
                  color:white;display:flex;align-items:center;justify-content:center;
                  font-size:var(--text-sm);font-weight:700;flex-shrink:0;
                ">${s.n}</div>
                <div style="display:flex;align-items:center;gap:var(--space-2);font-size:var(--text-base);color:var(--text-secondary)">
                  <span>${s.icon}</span>
                  <span>${tx(s.label)}</span>
                </div>
              </div>
            `).join('')}
          </div>

          <button id="start-consult-btn" style="
            width:100%;padding:var(--space-5);
            background:linear-gradient(135deg,var(--color-primary-500),var(--color-primary-700));
            color:white;border:none;border-radius:var(--radius-lg);
            font-size:var(--text-md);font-weight:var(--weight-bold);
            cursor:pointer;transition:all 0.2s;
            font-family:var(--font-rtl-body);
            box-shadow:0 4px 16px rgba(42,157,143,0.35);
          ">
            ${tx({fa:'پرداخت و شروع مشاوره',ar:'ادفع وابدأ الاستشارة',ur:'ادائیگی اور مشاورہ شروع کریں',az:'Ödə və məsləhəti başla',tr:'Öde ve Danışmayı Başlat',ru:'Оплатить и начать консультацию',en:'Pay & Start Consultation',id:'Bayar & Mulai Konsultasi'})} →
          </button>
          <p style="font-size:var(--text-xs);color:var(--text-muted);margin-top:var(--space-2);text-align:center">
            ${tx({fa:'پس از پرداخت، چند سوال کوتاه برای بهتر کمک کردن به شما پرسیده می‌شود',ar:'بعد الدفع، ستُطرح عليك بعض الأسئلة القصيرة لمساعدتك بشكل أفضل',ur:'ادائیگی کے بعد، آپ کی بہتر مدد کے لیے چند مختصر سوالات پوچھے جائیں گے',en:'After payment, a few short questions will be asked to help you better',id:'Setelah pembayaran, beberapa pertanyaan singkat akan ditanyakan untuk membantu Anda'})}
          </p>
        </div>
      </div>
    `;
  }

  function _renderProfile() {
    return `
      <div style="
        background:var(--bg-surface);
        border:1px solid var(--border-color);
        border-radius:var(--radius-xl);
        overflow:hidden;
        box-shadow:var(--shadow-lg);
      ">
        <!-- هدر -->
        <div style="
          background:linear-gradient(135deg,#0d1f2d,#1a3040);
          padding:var(--space-6) var(--space-8);
        ">
          <div style="display:flex;align-items:center;gap:var(--space-3)">
            <span style="font-size:28px" aria-hidden="true">📋</span>
            <div>
              <div style="font-size:var(--text-lg);font-weight:700;color:white">
                ${tx({fa:'اطلاعات تکمیلی',ar:'معلومات إضافية',ur:'اضافی معلومات',az:'Əlavə məlumat',tr:'Ek Bilgiler',ru:'Дополнительная информация',en:'Additional Information',id:'Informasi Tambahan'})}
              </div>
              <div style="font-size:var(--text-xs);color:rgba(255,255,255,0.55);margin-top:2px">
                ${tx({fa:'این اطلاعات به شیخ کمک می‌کند پاسخ بهتری به شما بدهد',ar:'تساعد هذه المعلومات الشيخ على تقديم إجابة أفضل لك',ur:'یہ معلومات شیخ کو آپ کو بہتر جواب دینے میں مدد کرتی ہیں',en:'This information helps the Sheikh give you a better response',id:'Informasi ini membantu Syaikh memberikan respons yang lebih baik'})}
              </div>
            </div>
          </div>
        </div>

        <div style="padding:var(--space-7) var(--space-8)">

          <!-- ردیف اول: سن + جنسیت + وضعیت تاهل -->
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:var(--space-3);margin-bottom:var(--space-4)">

            <div>
              <label style="display:block;font-size:var(--text-xs);font-weight:700;color:var(--text-secondary);margin-bottom:6px">
                ${tx({fa:'سن',ar:'العمر',ur:'عمر',az:'Yaş',tr:'Yaş',ru:'Возраст',en:'Age',id:'Usia'})}
              </label>
              <input type="number" id="profile-age" value="${_profileAge}" min="1" max="120" dir="ltr"
                placeholder="—"
                style="width:100%;background:var(--bg-surface-2);border:1px solid var(--border-color);border-radius:var(--radius-md);padding:var(--space-3);font-size:var(--text-sm);color:var(--text-primary);text-align:center;box-sizing:border-box"
              />
            </div>

            <div>
              <label style="display:block;font-size:var(--text-xs);font-weight:700;color:var(--text-secondary);margin-bottom:6px">
                ${tx({fa:'جنسیت',ar:'الجنس',ur:'جنس',az:'Cins',tr:'Cinsiyet',ru:'Пол',en:'Gender',id:'Jenis Kelamin'})}
              </label>
              <select id="profile-gender" style="width:100%;background:var(--bg-surface-2);border:1px solid var(--border-color);border-radius:var(--radius-md);padding:var(--space-3);font-size:var(--text-sm);color:var(--text-primary);cursor:pointer;box-sizing:border-box">
                <option value="" ${!_profileGender?'selected':''}>—</option>
                <option value="male"   ${_profileGender==='male'?'selected':''}>${tx({fa:'مرد',ar:'ذكر',ur:'مرد',az:'Kişi',tr:'Erkek',ru:'Мужчина',en:'Male',id:'Laki-laki'})}</option>
                <option value="female" ${_profileGender==='female'?'selected':''}>${tx({fa:'زن',ar:'أنثى',ur:'عورت',az:'Qadın',tr:'Kadın',ru:'Женщина',en:'Female',id:'Perempuan'})}</option>
              </select>
            </div>

            <div>
              <label style="display:block;font-size:var(--text-xs);font-weight:700;color:var(--text-secondary);margin-bottom:6px">
                ${tx({fa:'وضعیت تاهل',ar:'الحالة الاجتماعية',ur:'ازدواجی حیثیت',az:'Ailə vəziyyəti',tr:'Medeni Durum',ru:'Семейное положение',en:'Marital Status',id:'Status Pernikahan'})}
              </label>
              <select id="profile-marital" style="width:100%;background:var(--bg-surface-2);border:1px solid var(--border-color);border-radius:var(--radius-md);padding:var(--space-3);font-size:var(--text-sm);color:var(--text-primary);cursor:pointer;box-sizing:border-box">
                <option value="" ${!_profileMarital?'selected':''}>—</option>
                <option value="single"   ${_profileMarital==='single'?'selected':''}>${tx({fa:'مجرد',ar:'أعزب',ur:'غیر شادی شدہ',az:'Subay',tr:'Bekar',ru:'Холост/Не замужем',en:'Single',id:'Lajang'})}</option>
                <option value="married"  ${_profileMarital==='married'?'selected':''}>${tx({fa:'متاهل',ar:'متزوج',ur:'شادی شدہ',az:'Evli',tr:'Evli',ru:'Женат/Замужем',en:'Married',id:'Menikah'})}</option>
                <option value="divorced" ${_profileMarital==='divorced'?'selected':''}>${tx({fa:'مطلقه',ar:'مطلق',ur:'طلاق یافتہ',az:'Boşanmış',tr:'Boşanmış',ru:'Разведён/Разведена',en:'Divorced',id:'Cerai'})}</option>
                <option value="widowed"  ${_profileMarital==='widowed'?'selected':''}>${tx({fa:'بیوه',ar:'أرمل',ur:'بیوہ',az:'Dul',tr:'Dul',ru:'Вдовец/Вдова',en:'Widowed',id:'Janda/Duda'})}</option>
              </select>
            </div>
          </div>

          <!-- شغل -->
          <div style="margin-bottom:var(--space-4)">
            <label style="display:block;font-size:var(--text-xs);font-weight:700;color:var(--text-secondary);margin-bottom:6px">
              ${tx({fa:'شغل',ar:'المهنة',ur:'پیشہ',az:'Peşə',tr:'Meslek',ru:'Профессия',en:'Occupation',id:'Pekerjaan'})}
            </label>
            <input type="text" id="profile-job" value="${_profileJob}"
              placeholder="${tx({fa:'مثلاً: معلم، مهندس، دانشجو، خانه‌دار...',ar:'مثلاً: مدرس، مهندس، طالب...',ur:'مثلاً: استاد، انجینئر، طالب علم...',en:'e.g. Teacher, Engineer, Student...',id:'mis. Guru, Insinyur, Mahasiswa...'})}"
              style="width:100%;background:var(--bg-surface-2);border:1px solid var(--border-color);border-radius:var(--radius-md);padding:var(--space-3) var(--space-4);font-size:var(--text-sm);color:var(--text-primary);box-sizing:border-box;font-family:inherit"
            />
          </div>

          <!-- سابقه بیماری -->
          <div style="margin-bottom:var(--space-6)">
            <label style="display:block;font-size:var(--text-xs);font-weight:700;color:var(--text-secondary);margin-bottom:6px">
              ${tx({fa:'سابقه بیماری خاص (اختیاری)',ar:'تاريخ مرضي خاص (اختياري)',ur:'خاص بیماری کی سابقہ تاریخ (اختیاری)',az:'Xüsusi xəstəlik tarixi (ixtiyari)',tr:'Özel Hastalık Geçmişi (İsteğe Bağlı)',ru:'История болезней (необязательно)',en:'Medical History (Optional)',id:'Riwayat Penyakit (Opsional)'})}
            </label>
            <textarea id="profile-illness" rows="3"
              placeholder="${tx({fa:'اگر بیماری خاصی دارید یا تحت درمان هستید بنویسید، در غیر اینصورت خالی بگذارید',ar:'إذا كان لديك مرض خاص أو تتلقى علاجاً اكتب ذلك، وإلا اتركه فارغاً',ur:'اگر کوئی خاص بیماری ہے یا علاج جاری ہے تو لکھیں، ورنہ خالی چھوڑیں',en:'If you have a special illness or are under treatment, write it here. Otherwise leave empty',id:'Jika Anda memiliki penyakit khusus atau sedang dalam pengobatan, tulis di sini'})}
              style="width:100%;background:var(--bg-surface-2);border:1px solid var(--border-color);border-radius:var(--radius-md);padding:var(--space-3) var(--space-4);font-size:var(--text-sm);color:var(--text-primary);resize:vertical;font-family:inherit;box-sizing:border-box"
            >${_profileIllness}</textarea>
          </div>

          <!-- دکمه‌ها -->
          <button id="profile-next-btn" class="btn btn--primary btn--lg" style="width:100%;margin-bottom:var(--space-3)">
            ${tx({fa:'ادامه — ضبط سوال',ar:'التالي — تسجيل السؤال',ur:'آگے — سوال ریکارڈ کریں',az:'Davam et — Sual yaz',tr:'Devam — Soruyu Kaydet',ru:'Далее — Записать вопрос',en:'Continue — Record Question',id:'Lanjutkan — Rekam Pertanyaan'})} →
          </button>
          <button id="profile-back-btn" class="btn btn--ghost btn--sm" style="width:100%;color:var(--text-muted)">
            ← ${tx({fa:'برگشت',ar:'رجوع',ur:'واپس',az:'Geri',tr:'Geri',ru:'Назад',en:'Back',id:'Kembali'})}
          </button>

        </div>
      </div>
    `;
  }

  function _renderRecord() {
    const mins = Math.floor(_recordSeconds / 60).toString().padStart(2,'0');
    const secs = (_recordSeconds % 60).toString().padStart(2,'0');
    const maxSecs = MAX_RECORD_SECONDS;
    const pct = (_recordSeconds / maxSecs * 100).toFixed(1);
    const remaining = maxSecs - _recordSeconds;
    const remMins = Math.floor(remaining / 60);
    const remSecs = remaining % 60;

    return `
      <div style="
        background:var(--bg-surface);
        border:1px solid var(--border-color);
        border-radius:var(--radius-xl);
        overflow:hidden;
        box-shadow:var(--shadow-lg);
      ">
        <div style="
          background:linear-gradient(135deg,#0d1f2d,#1a3040);
          padding:var(--space-6) var(--space-8);
          display:flex;align-items:center;gap:var(--space-3);
        ">
          <span style="font-size:28px" aria-hidden="true">🎤</span>
          <div>
            <div style="font-size:var(--text-lg);font-weight:700;color:white">
              ${tx({fa:'ضبط سوال مشاوره',ar:'تسجيل سؤال الاستشارة',ur:'مشاورے کا سوال ریکارڈ کریں',en:'Record Your Question',id:'Rekam Pertanyaan Anda'})}
            </div>
            <div style="font-size:var(--text-sm);color:rgba(255,255,255,0.6)">
              ${tx({fa:'حداکثر ۱۵ دقیقه',ar:'حد أقصى ١٥ دقيقة',ur:'زیادہ سے زیادہ ۱۵ منٹ',en:'Maximum 15 minutes',id:'Maksimal 15 menit'})}
            </div>
          </div>
        </div>

        <div style="padding:var(--space-8);text-align:center">

          <!-- تایمر -->
          <div style="
            font-family:'JetBrains Mono',monospace;
            font-size:3rem;font-weight:900;
            color:${_isRecording?'var(--color-error)':'var(--text-primary)'};
            margin-bottom:var(--space-5);
            letter-spacing:0.05em;
          " aria-live="polite" aria-label="زمان ضبط: ${mins}:${secs}">
            ${mins}:${secs}
          </div>

          <!-- Progress bar -->
          <div style="height:6px;background:var(--border-color);border-radius:999px;overflow:hidden;margin-bottom:var(--space-3)">
            <div style="
              height:100%;width:${pct}%;
              background:${pct > 80 ? 'var(--color-error)' : 'var(--color-primary-500)'};
              border-radius:999px;transition:width 1s linear;
            "></div>
          </div>
          <div style="font-size:var(--text-sm);color:${remaining < 120 ? 'var(--color-error)' : 'var(--text-muted)'};margin-bottom:var(--space-7)">
            ${remaining < 120 ? '⚠️ ' : ''}
            ${tx({fa:`${remMins} دقیقه و ${remSecs} ثانیه باقی مانده`,en:`${remMins}m ${remSecs}s remaining`,ar:`${remMins} دقيقة و ${remSecs} ثانية متبقية`,id:`${remMins} menit ${remSecs} detik tersisa`})}
          </div>

          <!-- دکمه ضبط -->
          <button id="record-toggle-btn" style="
            width:88px;height:88px;border-radius:50%;
            background:${_isRecording ? 'linear-gradient(135deg,#e63946,#c1121f)' : 'linear-gradient(135deg,var(--color-primary-500),var(--color-primary-700))'};
            border:none;color:white;font-size:32px;cursor:pointer;
            box-shadow:${_isRecording ? '0 0 0 8px rgba(230,57,70,0.2)' : '0 4px 20px rgba(42,157,143,0.4)'};
            transition:all 0.3s;display:flex;align-items:center;justify-content:center;margin:0 auto var(--space-5);
            ${_isRecording ? 'animation:recording-pulse 1.5s ease infinite;' : ''}
          " aria-label="${_isRecording ? 'توقف ضبط' : 'شروع ضبط'}">
            ${_isRecording ? '⏹' : '🎤'}
          </button>

          ${_audioBlob ? `
            <div style="
              background:var(--bg-surface-2);border:1px solid var(--border-color);
              border-radius:var(--radius-lg);padding:var(--space-4);
              margin-bottom:var(--space-5);
            ">
              <audio controls style="width:100%" aria-label="پیش‌نمایش صوت ضبط‌شده"></audio>
            </div>
            <button id="submit-consult-btn" style="
              width:100%;padding:var(--space-4);
              background:linear-gradient(135deg,#16a34a,#15803d);
              color:white;border:none;border-radius:var(--radius-lg);
              font-size:var(--text-md);font-weight:700;cursor:pointer;
              font-family:var(--font-rtl-body);
              box-shadow:0 4px 16px rgba(22,163,74,0.35);
            ">
              ✓ ${tx({fa:'ارسال مشاوره',ar:'إرسال الاستشارة',ur:'مشاورہ بھیجیں',en:'Submit Consultation',id:'Kirim Konsultasi'})}
            </button>
          ` : `
            <!-- آپلود فایل -->
            <label style="
              display:block;
              border:2px dashed var(--border-color);border-radius:var(--radius-lg);
              padding:var(--space-5);text-align:center;cursor:pointer;
              color:var(--text-muted);font-size:var(--text-sm);
              transition:all 0.2s;
            " for="audio-file-upload">
              📁 ${tx({fa:'یا فایل صوتی آپلود کنید',ar:'أو رفع ملف صوتي',ur:'یا آڈیو فائل اپلوڈ کریں',en:'Or upload an audio file',id:'Atau unggah file audio'})}
              <input type="file" id="audio-file-upload" accept="audio/*" style="display:none" aria-label="آپلود فایل صوتی"/>
            </label>
          `}

          <style>
            @keyframes recording-pulse {
              0%,100% { box-shadow: 0 0 0 8px rgba(230,57,70,0.2); }
              50%      { box-shadow: 0 0 0 16px rgba(230,57,70,0.05); }
            }
          </style>
        </div>
      </div>
    `;
  }

  function _renderConfirm() {
    return `
      <div style="text-align:center;padding:var(--space-8)">
        <div style="
          width:80px;height:80px;border-radius:50%;
          background:linear-gradient(135deg,var(--color-primary-500),var(--color-primary-700));
          display:flex;align-items:center;justify-content:center;
          font-size:40px;margin:0 auto var(--space-6);
          box-shadow:0 8px 24px rgba(42,157,143,0.4);
          animation:float 3s ease-in-out infinite;
        " aria-hidden="true">✓</div>
        <h2 style="font-size:var(--text-2xl);font-weight:var(--weight-black);color:var(--text-primary);margin-bottom:var(--space-4)">
          ${tx({fa:'صوت شما دریافت شد',ar:'تم استلام صوتك',ur:'آپ کی آواز موصول ہوگئی',en:'Your voice has been received',id:'Suara Anda telah diterima'})}
        </h2>
        <div style="
          background:var(--bg-surface);border:1px solid var(--border-color);
          border-radius:var(--radius-lg);padding:var(--space-5) var(--space-6);
          font-size:var(--text-base);color:var(--text-secondary);
          line-height:var(--leading-relaxed);text-align:start;
          margin-bottom:var(--space-6);
          border-inline-start:4px solid var(--color-primary-500);
          white-space:pre-line;
        ">${tx({
          fa:`صوت شما دریافت شد و در نوبت پاسخگویی قرار گرفت.\n\nبعد از اینکه نوبت شما رسید و استاد پاسخ گفتند، در بخش «پیام‌های من» می‌توانید پاسخ خود را دریافت کنید.\n\nهمچنین یک اعلان به گوشی شما ارسال خواهد شد.`,
          ar:`تم استلام صوتك وإدراجه في قائمة الانتظار.\n\nبعد مراجعة الشيخ وتسجيل الرد، يمكنك الاستماع إليه في قسم «رسائلي».\n\nكما سيصلك إشعار على هاتفك.`,
          ur:`آپ کی آواز موصول ہوگئی اور قطار میں لگ گئی۔\n\nشیخ کے جواب کے بعد «میرے پیغامات» میں سن سکتے ہیں۔\n\nآپ کے فون پر نوٹیفکیشن بھی آئے گی۔`,
          en:`Your voice has been received and added to the queue.\n\nOnce the Sheikh responds, you can listen to the reply in "My Messages".\n\nYou will also receive a notification on your device.`,
          id:`Suara Anda diterima dan masuk dalam antrian.\n\nSetelah Syaikh menjawab, dengarkan di "Pesan Saya".\n\nAnda juga akan menerima notifikasi di perangkat Anda.`,
        })}</div>
        <a href="/profile.html#messages" class="btn btn--primary btn--lg" style="display:inline-flex;align-items:center;gap:var(--space-2)">
          📨 ${tx({fa:'مشاهده پیام‌های من',ar:'عرض رسائلي',ur:'میرے پیغامات',en:'My Messages',id:'Pesan Saya'})}
        </a>
      </div>
    `;
  }

  function _bindPageEvents() {
    /* شروع مشاوره */
    document.getElementById('start-consult-btn')?.addEventListener('click', async () => {
      /* نمایش صفحه پرداخت — بعد از پرداخت موفق به profile می‌رود */
      const { renderPaymentPage } = await import('./payment-system.js');
      const payContainer = document.createElement('div');
      payContainer.style.cssText = 'position:fixed;inset:0;background:var(--bg-surface);z-index:9999;overflow-y:auto';
      document.body.appendChild(payContainer);

      await renderPaymentPage(payContainer, usdBase, 'consultation');

      /* دکمه بستن — اگر کاربر پشیمان شد */
      const closeBtn = document.createElement('button');
      closeBtn.textContent = '✕';
      closeBtn.setAttribute('aria-label', 'بستن');
      closeBtn.style.cssText = 'position:fixed;top:16px;inset-inline-start:16px;z-index:10000;background:var(--bg-surface-2);border:1px solid var(--border-color);border-radius:50%;width:36px;height:36px;font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center';
      document.body.appendChild(closeBtn);
      closeBtn.addEventListener('click', () => {
        clearInterval(checkInterval);
        document.body.removeChild(payContainer);
        document.body.removeChild(closeBtn);
      });

      /* بررسی تأیید پرداخت با interval */
      const checkInterval = setInterval(() => {
        const confirmH2 = Array.from(payContainer.querySelectorAll('h2')).find(el =>
          el.textContent.includes('ثبت شد') || el.textContent.includes('registered') || el.textContent.includes('تسجيل')
        );
        if (confirmH2) {
          clearInterval(checkInterval);
          document.body.removeChild(payContainer);
          if (document.body.contains(closeBtn)) document.body.removeChild(closeBtn);
          _step = 'profile'; _render();
        }
      }, 500);
    });

    /* profile events */
    document.getElementById('profile-next-btn')?.addEventListener('click', () => {
      _profileAge     = document.getElementById('profile-age')?.value?.trim()     ?? '';
      _profileGender  = document.getElementById('profile-gender')?.value           ?? '';
      _profileMarital = document.getElementById('profile-marital')?.value          ?? '';
      _profileJob     = document.getElementById('profile-job')?.value?.trim()      ?? '';
      _profileIllness = document.getElementById('profile-illness')?.value?.trim()  ?? '';
      _step = 'record'; _render();
    });

    document.getElementById('profile-back-btn')?.addEventListener('click', () => {
      _step = 'intro'; _render();
    });

    /* ضبط */
    document.getElementById('record-toggle-btn')?.addEventListener('click', async () => {
      if (!_isRecording) {
        /* شروع */
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio:true });
          _mediaRecorder = new MediaRecorder(stream);
          const chunks  = [];
          _mediaRecorder.ondataavailable = e => chunks.push(e.data);
          _mediaRecorder.onstop = () => {
            _audioBlob = new Blob(chunks, { type:'audio/webm' });
            stream.getTracks().forEach(t => t.stop());
            _render();
            /* اتصال audio */
            const aud = container.querySelector('audio');
            if (aud) aud.src = URL.createObjectURL(_audioBlob);
          };
          _mediaRecorder.start();
          _isRecording = true;
          _recordSeconds = 0;
          _recordInterval = setInterval(() => {
            _recordSeconds++;
            /* آپدیت تایمر بدون re-render کامل */
            const timerEl = container.querySelector('[aria-live="polite"]');
            if (timerEl) {
              const m = Math.floor(_recordSeconds/60).toString().padStart(2,'0');
              const s = (_recordSeconds%60).toString().padStart(2,'0');
              timerEl.textContent = `${m}:${s}`;
            }
            /* اگر به ۱۵ دقیقه رسید */
            if (_recordSeconds >= MAX_RECORD_SECONDS) {
              _stopRecording();
            }
          }, 1000);
          _render();
        } catch { alert(tx({fa:'دسترسی به میکروفون رد شد',en:'Microphone access denied', ar:'تم رفض الوصول إلى الميكروفون', ur:'مائیکروفون تک رسائی سے انکار', az:'Mikrofona giriş rədd edildi', tr:'Mikrofon erişimi reddedildi', ru:'Доступ к микрофону отклонен', id:'Akses mikrofon ditolak'})); }
      } else {
        _stopRecording();
      }
    });

    /* آپلود فایل */
    document.getElementById('audio-file-upload')?.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (file) {
        _audioBlob = file;
        _step = 'record';
        _render();
        const aud = container.querySelector('audio');
        if (aud) aud.src = URL.createObjectURL(file);
      }
    });

    /* ارسال */
    document.getElementById('submit-consult-btn')?.addEventListener('click', async () => {
      const btn = document.getElementById('submit-consult-btn');
      if (btn) { btn.disabled = true; btn.textContent = '⏳...'; }

      const user  = AuthState.getUser();
      const order = ConsultOrders.add({
        userId:      user?.id ?? 'guest',
        userName:    user?.name ?? '',
        userLang:    lang,
        userCountry: user?.country ?? localStorage.getItem('mh_user_country') ?? '',
        paid:        true,
        audioSize:   _audioBlob?.size ?? 0,
        audioDuration: _recordSeconds,
        userAge:     _profileAge,
        userGender:  _profileGender,
        userMarital: _profileMarital,
        userJob:     _profileJob,
        userIllness: _profileIllness,
      });

      /* ارسال پیام تأیید */
      await NotifCenter.send({
        type:'consultation', icon:'💬',
        title:{ fa:'مشاوره ثبت شد', [lang]:'مشاوره ثبت شد' },
        text:{ fa:`صوت شما دریافت شد. پاسخ در «پیام‌های من» خواهد آمد.`, [lang]:`صوت شما دریافت شد.` },
      });

      /* پردازش */
      setTimeout(() => processConsultation(order.id), 500);

      _step = 'confirm';
      _render();
    });
  }

  function _stopRecording() {
    _isRecording = false;
    clearInterval(_recordInterval);
    _mediaRecorder?.stop();
  }

  _render();
  i18n.onChange(() => _render());
}
