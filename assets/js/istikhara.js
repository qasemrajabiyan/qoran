/**
 * ============================================================
 * FILE: istikhara.js
 * ROLE: سیستم استخاره — رایگان (متن) + پولی (صوت با صدای شیخ)
 * PROJECT: BarakatHub — پلتفرم رسانه‌ای کربلا
 * VERSION: 1.0.0
 * DEPENDS ON: i18n.js, auth.js, auto-translate.js, notifications.js
 *
 * استخاره رایگان:
 *   — کاربر نیت می‌کند
 *   — AI به قرآن استخاره می‌کند
 *   — ۱ ساعت بعد نتیجه (خوب/بد/متوسط) ارسال می‌شود (قابل تنظیم توسط ادمین)
 *
 * استخاره پولی:
 *   — کاربر موضوع می‌نویسد
 *   — AI مانند عالم ربانی پاسخ می‌دهد
 *   — پاسخ به صدای شیخ (ElevenLabs) تبدیل می‌شود
 *   — ۲ ساعت بعد صوت به کاربر ارسال می‌شود (قابل تنظیم توسط ادمین)
 *   — برای همه زبان‌ها فعال
 * ============================================================
 */

import { i18n, getUserCurrency } from './i18n.js';
import { AuthState } from './auth.js';
import { translateText } from './auto-translate.js';
import { NotifCenter, playNotifSound } from './notifications.js';
import { renderPaymentPage } from './payment-system.js';

/* ────────────────────────────────────────────────────────────
   1. CONFIG
   ──────────────────────────────────────────────────────────── */
const CONFIG_KEY    = 'mh_istikhara_config';
const ORDERS_KEY    = 'mh_istikhara_orders';
const CACHE_KEY     = 'mh_istikhara_cache';
/* تأخیر از config خوانده می‌شود — ادمین تنظیم می‌کند */
function _getFreeDelayMs()  { return (IstikharaConfig.get().freeDelayMinutes  ?? 60)  * 60 * 1000; }
function _getPaidDelayMs()  { return (IstikharaConfig.get().paidDelayMinutes  ?? 120) * 60 * 1000; }

export const IstikharaConfig = {
  get() {
    try {
      return JSON.parse(localStorage.getItem(CONFIG_KEY) || 'null') || {
        freeActive:  true,
        paidActive:  true,
        paidPrice:   { IQD:15000, IRR:150000, PKR:1500, USD:15, TRY:450, RUB:1500, AZN:30, IDR:240000 },
        similarityThreshold: 0.92, /* ۹۲٪ شباهت = همان پاسخ */
        freeDelayMinutes:  60,  /* ادمین تنظیم می‌کند — پیش‌فرض ۱ ساعت */
        paidDelayMinutes:  120, /* ادمین تنظیم می‌کند — پیش‌فرض ۲ ساعت */
      };
    } catch { return { freeActive:true, paidActive:true }; }
  },
  set(cfg) {
    try { localStorage.setItem(CONFIG_KEY, JSON.stringify(cfg)); } catch {}
  },
};

/* ────────────────────────────────────────────────────────────
   2. QURAN VERSES برای استخاره (۱۱۴ آیه نمونه)
   ──────────────────────────────────────────────────────────── */
const QURAN_VERSES = [
  /* خوب */
  { result:'good',    surahFa:'سوره بقره',    ayah:155, meaningFa:'خداوند بشارت می‌دهد به صابران — و این موضوع به خیر و برکت خواهد بود' },
  { result:'good',    surahFa:'سوره انشراح',  ayah:6,   meaningFa:'همانا با هر سختی آسانی است — خداوند گشایش را نزدیک می‌بیند' },
  { result:'good',    surahFa:'سوره طلاق',    ayah:3,   meaningFa:'هر کس بر خدا توکل کند، خداوند او را کافی است — نشانه خیر است' },
  { result:'good',    surahFa:'سوره بقره',    ayah:153, meaningFa:'خداوند با صابران است — این راه را با توکل طی کنید' },
  { result:'good',    surahFa:'سوره جمعه',    ayah:11,  meaningFa:'خداوند بهترین روزی‌رسان است — در این کار خیر و برکت می‌بینم' },
  { result:'good',    surahFa:'سوره ضحی',     ayah:5,   meaningFa:'پروردگارت به زودی به تو عطا می‌کند و راضی خواهی شد — نشانه بسیار خوب است' },
  { result:'good',    surahFa:'سوره انشراح',  ayah:5,   meaningFa:'با هر سختی آسانی است — خداوند این راه را هموار می‌کند' },
  { result:'good',    surahFa:'سوره آل عمران',ayah:173, meaningFa:'خدا ما را بس است و بهترین وکیل است — با اطمینان پیش بروید' },
  { result:'good',    surahFa:'سوره نساء',    ayah:175, meaningFa:'خداوند آنان را به رحمت و فضل خود در می‌آورد — نشانه خیر است' },
  /* بد */
  { result:'bad',     surahFa:'سوره بقره',    ayah:195, meaningFa:'خود را به دست خود به هلاکت نیندازید — در این موضوع احتیاط لازم است' },
  { result:'bad',     surahFa:'سوره بقره',    ayah:281, meaningFa:'از روزی بترسید که به سوی خدا بازمی‌گردید — نیاز به تأمل جدی است' },
  { result:'bad',     surahFa:'سوره نساء',    ayah:29,  meaningFa:'اموال یکدیگر را به باطل نخورید — در این کار خیری نمی‌بینم' },
  { result:'bad',     surahFa:'سوره اسراء',   ayah:32,  meaningFa:'به آنچه نهی شده‌اید نزدیک نشوید — این مسیر مناسب نیست' },
  { result:'bad',     surahFa:'سوره بقره',    ayah:168, meaningFa:'از گام‌های شیطان پیروی نکنید — در این کار احتیاط کنید' },
  /* متوسط */
  { result:'neutral', surahFa:'سوره آل عمران',ayah:159, meaningFa:'با آنان مشورت کن در کار — مشورت و تأمل بیشتر لازم است' },
  { result:'neutral', surahFa:'سوره شوری',    ayah:38,  meaningFa:'کارشان با مشورت میان خودشان است — مشورت با دیگران را فراموش نکنید' },
  { result:'neutral', surahFa:'سوره بقره',    ayah:201, meaningFa:'پروردگارا در دنیا و آخرت نیکی عطا کن — هنوز زمانش نرسیده، صبر کنید' },
  { result:'neutral', surahFa:'سوره هود',     ayah:49,  meaningFa:'صبر کن که عاقبت از آن پرهیزکاران است — شتاب نکنید، زمان بیشتری لازم است' },
  { result:'neutral', surahFa:'سوره رعد',     ayah:11,  meaningFa:'خداوند حال قومی را تغییر نمی‌دهد مگر آنکه خودشان تغییر دهند — تغییر در خودتان را مد نظر داشته باشید' },
];

function _getRandomVerse() {
  return QURAN_VERSES[Math.floor(Math.random() * QURAN_VERSES.length)];
}

/* ────────────────────────────────────────────────────────────
   3. SIMILARITY CHECK (۹۰٪ شباهت = همان پاسخ)
   ──────────────────────────────────────────────────────────── */
function _similarity(a, b) {
  if (!a || !b) return 0;
  const s1 = a.toLowerCase().trim();
  const s2 = b.toLowerCase().trim();
  if (s1 === s2) return 1;
  const longer  = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  if (longer.length === 0) return 1;
  const editDist = _levenshtein(longer, shorter);
  return (longer.length - editDist) / longer.length;
}

function _levenshtein(s, t) {
  const m = s.length, n = t.length;
  const dp = Array.from({length: m+1}, (_, i) =>
    Array.from({length: n+1}, (_, j) => i === 0 ? j : j === 0 ? i : 0)
  );
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = s[i-1] === t[j-1]
        ? dp[i-1][j-1]
        : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
  return dp[m][n];
}

function _findSimilarCache(topic) {
  try {
    const cache   = JSON.parse(localStorage.getItem(CACHE_KEY) || '[]');
    const thresh  = IstikharaConfig.get().similarityThreshold ?? 0.90;
    const match   = cache.find(c => _similarity(c.topic, topic) >= thresh);
    return match ?? null;
  } catch { return null; }
}

function _saveToCache(topic, responseFa) {
  try {
    const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '[]');
    cache.unshift({ topic, responseFa, createdAt: new Date().toISOString() });
    if (cache.length > 200) cache.splice(200);
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {}
}

/* ────────────────────────────────────────────────────────────
   4. AI ISTIKHARA ENGINE
   ──────────────────────────────────────────────────────────── */

/* استخاره رایگان — فقط نتیجه */
async function _doFreeIstikhara() {
  const verse = _getRandomVerse();
  return { result: verse.result, verse };
}

/* استخاره پولی — پاسخ کامل مانند عالم ربانی */
async function _doPaidIstikhara(topic, lang) {
  /* بررسی کش */
  const cached = _findSimilarCache(topic);
  if (cached) {
    console.log('[Istikhara] Using cached response');
    return { fromCache: true, responseFa: cached.responseFa };
  }

  const verse = _getRandomVerse();

  /* ═══════════════════════════════════════════════════════════
     پرامپت فوق‌حرفه‌ای استخاره — طراحی‌شده برای تبدیل به صدا
     هیچ متن عربی در پاسخ نمی‌آید تا صدا کاملاً طبیعی باشد
     ═══════════════════════════════════════════════════════════ */
  const resultLabel = verse.result === 'good'
    ? 'خیر است و می‌توانید اقدام کنید'
    : verse.result === 'bad'
    ? 'خیر نیست و باید با احتیاط بیشتری فکر کنید'
    : 'وسط است و مشورت و تأمل بیشتر لازم است';

  /* ── ترجمه اطلاعات آیه و نتیجه به زبان کاربر ──
     برای همه ۸ زبان — هرگز متن قرآنی عربی گفته نمی‌شود
     فقط معنا و مفهوم به زبان خود کاربر بیان می‌شود     */
  const langNames = {
    fa:'فارسی', ar:'العربية', ur:'اردو',
    en:'English', tr:'Türkçe', ru:'Русский', az:'Azərbaycan', id:'Bahasa Indonesia',
  };
  const greetings = {
    fa:'کاربر گرامی', ar:'أخي/أختي الكريم', ur:'محترم صارف',
    en:'Dear seeker', tr:'Değerli kardeşim', ru:'Уважаемый/ая', az:'Hörmətli dostum', id:'Saudara/i yang terhormat',
  };

  /* نتیجه استخاره به زبان کاربر */
  const resultByLang = {
    fa: verse.result === 'good' ? 'خیر است و می‌توانید اقدام کنید' : verse.result === 'bad' ? 'خیر نیست و باید با احتیاط بیشتری فکر کنید' : 'وسط است و مشورت و تأمل بیشتر لازم است',
    ar: verse.result === 'good' ? 'الأمر خير ويمكنك المضي قدماً' : verse.result === 'bad' ? 'الأمر غير مناسب وينبغي التأمل' : 'الأمر متوسط ويحتاج إلى مشاورة وتدبر',
    ur: verse.result === 'good' ? 'خیر ہے اور آپ آگے بڑھ سکتے ہیں' : verse.result === 'bad' ? 'خیر نہیں اور مزید سوچنا ضروری ہے' : 'درمیانہ ہے اور مشورہ ضروری ہے',
    en: verse.result === 'good' ? 'it is good and you may proceed' : verse.result === 'bad' ? 'it is not favorable and caution is needed' : 'it is neutral and more consultation is advised',
    tr: verse.result === 'good' ? 'hayırlıdır ve ilerleyebilirsiniz' : verse.result === 'bad' ? 'hayırlı değil, dikkatli düşünmelisiniz' : 'ortalamadır, istişare gereklidir',
    ru: verse.result === 'good' ? 'это благоприятно, можно действовать' : verse.result === 'bad' ? 'это неблагоприятно, нужна осторожность' : 'нейтрально, требуется совет и размышление',
    az: verse.result === 'good' ? 'xeyirlidir, irəliləyə bilərsiniz' : verse.result === 'bad' ? 'xeyirli deyil, ehtiyatlı olun' : 'ortalamadır, məsləhət lazımdır',
    id: verse.result === 'good' ? 'baik dan Anda bisa melanjutkan' : verse.result === 'bad' ? 'kurang baik dan perlu kehati-hatian' : 'netral dan perlu musyawarah lebih lanjut',
  };
  const resultInLang = resultByLang[lang] ?? resultByLang['en'];
  const greeting     = greetings[lang]    ?? greetings['en'];
  const langName     = langNames[lang]    ?? 'English';

  /* ── پرامپت پویا — زبان پاسخ = زبان کاربر ── */
  const systemPrompt = `You are a devout Islamic scholar and Quran istikhara specialist with over twenty years of experience.
People from around the world trust you for istikhara guidance.
You must respond ENTIRELY in ${langName} — this is critical, do not use any other language.

════════════════════════════════════════
ABSOLUTE RULES — NEVER VIOLATE:
════════════════════════════════════════

1. RESPOND ONLY IN ${langName}. Every single word must be in ${langName}.

2. NEVER write any Arabic text — not a single Arabic letter, not Quranic verses,
   not "bismillah", not any prayer in Arabic script.
   REASON: This response will be converted to audio. Arabic text sounds robotic.
   Instead, explain the MEANING of the Quranic message in ${langName} naturally.
   For Arabic-speaking users: Use modern conversational Arabic, NOT Quranic script.

3. Speaking style must be ORAL and CONVERSATIONAL — as if speaking aloud, not writing.
   Short sentences. Natural pauses with "..." where the Sheikh breathes.
   Avoid formal written vocabulary.

4. Tone: warm, fatherly, caring — like a trusted elder giving loving guidance.
   Address the user with "${greeting}" at start and once in the middle.

5. NEVER mention "AI", "computer", "algorithm", or anything suggesting a machine.
   You are a real human scholar with decades of experience.

6. Response structure — follow exactly:
   a) Warm personal greeting addressing the user by name, a brief prayer for them — 2-3 sentences
   b) Clear and compassionate announcement of the istikhara result — 1-2 sentences
   c) The Quranic message that came — explain the MEANING deeply in ${langName}, with reflection on its divine wisdom — 3-4 sentences
   d) Connect this divine message intimately to the user's specific situation — personalize completely, show empathy — 4-5 sentences
   e) Practical and spiritual guidance matching the result — offer concrete advice, steps to take, and what to avoid — 4-5 sentences
   f) Deeper spiritual reflection — remind the user of God's mercy and wisdom in all matters — 2-3 sentences
   g) End with a warm prayer, encouragement, and a blessing — 2-3 sentences

7. Minimum 400 words, maximum 550 words. Rich, detailed, and deeply personal.
   Every sentence must feel like it comes from a trusted father figure who knows the user's heart.

════════════════════════════════════════
ISTIKHARA DETAILS FOR THIS USER:
════════════════════════════════════════
Quranic chapter consulted: A verse from ${verse.surahFa}
The meaning and divine message of this verse: ${verse.meaningFa}
Overall istikhara result: ${resultInLang}`;

  const userMessage = `User greeting form: ${greeting}
Istikhara topic: ${topic}

Please deliver the istikhara response for this user entirely in ${langName}.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model:      'claude-sonnet-4-20250514',
        max_tokens: 2000,
        system:     systemPrompt,
        messages:   [{ role:'user', content: userMessage }],
      }),
    });
    const data       = await response.json();
    const responseFa = data.content?.[0]?.text?.trim() ?? '';
    _saveToCache(topic, responseFa);
    return { fromCache: false, responseFa, verse };
  } catch (err) {
    console.error('[Istikhara AI] Error:', err);
    /* پاسخ پشتیبان */
    const fallback = `با سلام و احترام، کاربر گرامی...\n\nاستخاره شما انجام شد.\n\nآیه‌ای از ${verse.surahFa} در استخاره شما آمد که پیام آن این است: ${verse.meaningFa}\n\nنتیجه استخاره: ${resultLabel}\n\nتوصیه می‌کنم در این تصمیم صبر و توکل داشته باشید و با اهل مشورت صحبت کنید.\n\nالتماس دعا`;
    _saveToCache(topic, fallback);
    return { fromCache: false, responseFa: fallback, verse };
  }
}

/* تبدیل متن به صوت با ElevenLabs */
async function _textToVoice(text, lang) {
  try {
    const config  = JSON.parse(localStorage.getItem('mh_firebase_config') || '{}');
    const voiceId = config.voiceId || localStorage.getItem('mh_voice_id');
    const apiKey  = localStorage.getItem('mh_elevenlabs_key');

    if (!voiceId || !apiKey) {
      console.warn('[TTS] ElevenLabs not configured');
      return null;
    }

    /* اگر زبان فارسی نیست — ترجمه کن */
    const textToRead = lang === 'fa' ? text : await translateText(text, lang, 'istikhara');

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'xi-api-key':    apiKey,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({
        text:           textToRead,
        model_id:       'eleven_multilingual_v2',
        voice_settings: {
          stability:         0.45,
          similarity_boost:  0.90,
          style:             0.25,
          use_speaker_boost: true,
        },
      }),
    });

    if (!response.ok) { console.error('[TTS] ElevenLabs error:', response.status); return null; }

    const blob = await response.blob();
    return URL.createObjectURL(blob);
  } catch (err) {
    console.error('[TTS] Error:', err);
    return null;
  }
}

/* ────────────────────────────────────────────────────────────
   5. ORDER MANAGER
   ──────────────────────────────────────────────────────────── */
export const IstikharaOrders = {
  getAll() {
    try { return JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]'); } catch { return []; }
  },

  add(order) {
    const all = this.getAll();
    order.id        = 'ist_' + Date.now();
    order.createdAt = new Date().toISOString();
    order.status    = 'pending';
    all.unshift(order);
    localStorage.setItem(ORDERS_KEY, JSON.stringify(all));
    return order;
  },

  update(id, updates) {
    const all = this.getAll();
    const idx = all.findIndex(o => o.id === id);
    if (idx !== -1) { all[idx] = { ...all[idx], ...updates }; localStorage.setItem(ORDERS_KEY, JSON.stringify(all)); }
  },
};

/* ────────────────────────────────────────────────────────────
   6. PROCESS ENGINE — پردازش استخاره
   ──────────────────────────────────────────────────────────── */
export async function processIstikhara(orderId) {
  const orders = IstikharaOrders.getAll();
  const order  = orders.find(o => o.id === orderId);
  if (!order || order.status === 'done') return;

  const lang = order.userLang ?? 'fa';
  const user = { name: order.userName ?? '', id: order.userId };

  try {
    if (order.type === 'free') {
      /* استخاره رایگان */
      const { result, verse } = await _doFreeIstikhara();

      const resultTexts = {
        good:    { fa:'✨ نتیجه خوب آمد', ar:'✨ النتيجة إيجابية', ur:'✨ نتیجہ اچھا آیا', az:'✨ Nəticə yaxşıdır', tr:'✨ Sonuç iyi çıktı', ru:'✨ Результат хороший', en:'✨ Result is good', id:'✨ Hasilnya baik' },
        bad:     { fa:'⚠️ نتیجه بد آمد', ar:'⚠️ النتيجة سلبية', ur:'⚠️ نتیجہ برا آیا', az:'⚠️ Nəticə pisdir', tr:'⚠️ Sonuç kötü çıktı', ru:'⚠️ Результат плохой', en:'⚠️ Result is not good', id:'⚠️ Hasilnya kurang baik' },
        neutral: { fa:'🔄 نتیجه وسط آمد', ar:'🔄 النتيجة متوسطة', ur:'🔄 نتیجہ درمیانہ آیا', az:'🔄 Nəticə ortaladır', tr:'🔄 Sonuç orta çıktı', ru:'🔄 Результат средний', en:'🔄 Result is neutral', id:'🔄 Hasilnya sedang' },
      };

      const resultText = resultTexts[result]?.[lang] ?? resultTexts[result]?.['fa'] ?? '';
      const verseText  = `\n\n📖 ${verse.ar}\n— ${verse.surah}، ${verse.ayah}`;

      const greet = _buildGreeting(user.name, lang);
      const body  = greet + resultText + verseText;

      /* ذخیره نتیجه */
      IstikharaOrders.update(orderId, { status:'done', result, resultText: body, doneAt: new Date().toISOString() });

      /* ارسال نوتیفیکیشن */
      await NotifCenter.send({
        type:  'istikhara',
        icon:  '⭐',
        title: { fa:'نتیجه استخاره شما آمد', [lang]: resultText },
        text:  { fa: body, [lang]: body },
        url:   '/profile.html#messages',
      });

    } else {
      /* استخاره پولی */
      const { responseFa, verse, fromCache } = await _doPaidIstikhara(order.topic, lang);

      /* ترجمه اگر لازم */
      let finalText = responseFa;
      if (lang !== 'fa') {
        finalText = await translateText(responseFa, lang, 'istikhara');
      }

      const greet = _buildGreeting(user.name, lang);
      const fullText = greet + finalText;

      /* تبدیل به صوت */
      const audioUrl = await _textToVoice(fullText, lang);

      /* ذخیره */
      IstikharaOrders.update(orderId, {
        status:    'done',
        responseFa,
        finalText,
        audioUrl,
        fromCache,
        doneAt:    new Date().toISOString(),
      });

      /* ارسال نوتیفیکیشن — با audioUrl اگر موجود باشد */
      await NotifCenter.send({
        type:     'istikhara',
        icon:     '⭐',
        title:    { fa:'استخاره شما آماده شد 🎤', [lang]:'استخاره شما آماده شد 🎤' },
        text:     audioUrl ? { fa:'صوت استخاره شما آماده است', [lang]:'صوت استخاره شما آماده است' } : { fa: fullText, [lang]: fullText },
        audioUrl: audioUrl || undefined,
        url:      '/profile.html#messages',
      });

      playNotifSound('prize');
    }
  } catch (err) {
    console.error('[Istikhara] Process error:', err);
    IstikharaOrders.update(orderId, { status:'error', error: err.message });
  }
}

function _buildGreeting(name, lang) {
  const greetings = {
    fa:`کاربر گرامی ${name}،\n\n`,
    ar:`عزيزي ${name}،\n\n`,
    ur:`محترم ${name}،\n\n`,
    az:`Hörmətli ${name},\n\n`,
    tr:`Değerli ${name},\n\n`,
    ru:`Уважаемый(ая) ${name},\n\n`,
    en:`Dear ${name},\n\n`,
    id:`Yang terhormat ${name},\n\n`,
  };
  return greetings[lang] ?? greetings['fa'];
}

/* ────────────────────────────────────────────────────────────
   7. PAGE RENDERER (صفحه استخاره برای کاربر)
   ──────────────────────────────────────────────────────────── */
export function renderIstikharaPage(container) {
  if (!container) return;

  const config  = IstikharaConfig.get();
  const lang    = i18n.lang;
  let _step     = 'select'; /* 'select' | 'free-intent' | 'paid-topic' | 'payment' | 'confirm' */
  let _pendingOrder = null;
  let _type     = null;     /* 'free' | 'paid' */
  let _topic    = '';
  let _age      = '';
  let _gender   = '';
  let _marital  = '';

  const COPY = {
    pageTitle:    { fa:'استخاره', ar:'الاستخارة', ur:'استخارہ', az:'İstixarə', tr:'İstihare', ru:'Истихара', en:'Istikhara', id:'Istikharah' },
    pageDesc:     { fa:'استخاره به قرآن کریم', ar:'الاستخارة بالقرآن الكريم', ur:'قرآن سے استخارہ', az:'Quranla istixarə', tr:'Kuran ile istihare', ru:'Истихара по Корану', en:'Istikhara by the Holy Quran', id:'Istikharah dengan Al-Quran' },
    freeTitle:    { fa:'استخاره رایگان', ar:'الاستخارة المجانية', ur:'مفت استخارہ', az:'Pulsuz istixarə', tr:'Ücretsiz İstihare', ru:'Бесплатная истихара', en:'Free Istikhara', id:'Istikharah Gratis' },
    freeDesc:     { fa:'نتیجه کلی: خوب، بد یا متوسط', ar:'النتيجة الإجمالية: خير، سيئ أو متوسط', ur:'مجموعی نتیجہ: اچھا، برا یا درمیانہ', az:'Ümumi nəticə: yaxşı, pis və ya orta', tr:'Genel sonuç: iyi, kötü veya orta', ru:'Общий результат: хорошо, плохо или нейтрально', en:'Overall result: good, bad, or neutral', id:'Hasil keseluruhan: baik, buruk, atau sedang' },
    paidTitle:    { fa:'استخاره تخصصی', ar:'الاستخارة التخصصية', ur:'تخصصی استخارہ', az:'Xüsusi istixarə', tr:'Özel İstihare', ru:'Специальная истихара', en:'Special Istikhara', id:'Istikharah Khusus' },
    paidDesc:     { fa:'با توضیحات کامل — به صورت صوت', ar:'مع شرح كامل — صوتياً', ur:'مکمل وضاحت کے ساتھ — آواز میں', az:'Tam izahatla — audio olaraq', tr:'Tam açıklama ile — ses olarak', ru:'С полным объяснением — в виде аудио', en:'With full explanation — as audio', id:'Dengan penjelasan lengkap — berupa audio' },
    intentLabel:  { fa:'نیت خود را در دل بکنید', ar:'انوِ في قلبك', ur:'دل میں نیت کریں', az:'Niyyətinizi ürəyinizdə edin', tr:'Niyetinizi kalbinizde yapın', ru:'Сделайте намерение в сердце', en:'Make your intention in your heart', id:'Niatkan dalam hati' },
    topicLabel:   { fa:'موضوع استخاره را بنویسید', ar:'اكتب موضوع الاستخارة', ur:'استخارے کا موضوع لکھیں', az:'İstixarə mövzusunu yazın', tr:'İstihare konusunu yazın', ru:'Напишите тему истихары', en:'Write the topic of istikhara', id:'Tuliskan topik istikharah' },
    topicPlaceholder: { fa:'مثلاً: آیا این شغل را قبول کنم؟', ar:'مثلاً: هل أقبل هذا العمل؟', ur:'مثلاً: کیا یہ نوکری قبول کروں؟', az:'Məsələn: Bu işi qəbul edimmi?', tr:'Örn: Bu işi kabul etmeli miyim?', ru:'Например: Принять ли эту работу?', en:'e.g. Should I accept this job?', id:'misal: Apakah saya harus menerima pekerjaan ini?' },
    submitFree:   { fa:'استخاره کن', ar:'استخر', ur:'استخارہ کریں', az:'İstixarə et', tr:'İstihare Yap', ru:'Выполнить истихару', en:'Perform Istikhara', id:'Lakukan Istikharah' },
    submitPaid:   { fa:'پرداخت و استخاره', ar:'ادفع واستخر', ur:'ادائیگی اور استخارہ', az:'Ödə və istixarə et', tr:'Öde ve İstihare Yap', ru:'Оплатить и выполнить', en:'Pay & Get Istikhara', id:'Bayar & Lakukan Istikharah' },
    confirmMsg:   { fa:'سفارش استخاره شما دریافت شد.\nبه زودی نتیجه از طریق بخش «پیام‌های من» برای شما ارسال می‌شود.', ar:'تم استلام طلب استخارتك.\nسيصلك الرد عبر قسم «رسائلي» قريباً.', ur:'آپ کا استخارہ آرڈر موصول ہوگیا۔\nجلد نتیجہ «میرے پیغامات» میں بھیجا جائے گا۔', az:'İstixarə sifarişiniz alındı.\nNəticə tezliklə «Mesajlarım» bölməsi vasitəsilə göndəriləcəkdir.', tr:'İstihare talebiniz alındı.\nSonuç kısa süre içinde «Mesajlarım» bölümü üzerinden gönderilecektir.', ru:'Ваш запрос на истихару получен.\nРезультат будет отправлен в раздел «Мои сообщения» в ближайшее время.', en:'Your istikhara request has been received.\nThe result will be sent via "My Messages" section soon.', id:'Permintaan istikharah Anda telah diterima.\nHasilnya akan dikirim melalui bagian "Pesan Saya" segera.' },
    gift:         { fa:'هدیه', ar:'هدية', ur:'تحفہ', az:'Hədiyyə', tr:'Hediye', ru:'Подарок', en:'Gift', id:'Hadiah' },
  };

  const tx = (obj) => obj?.[lang] ?? obj?.fa ?? obj?.en ?? '';

  /* ارز کاربر — fallback از زبان */
  /* ارز کاربر از تابع مرکزی — اولویت: IP → زبان دستی → زبان فعلی */
  let cur       = getUserCurrency();
  const usdBase = config.paidPrice?.USD ?? 15;

  /* نرخ لحظه‌ای */
  let _liveRates = null;
  let _paidPrice = config.paidPrice?.[cur.k] ?? usdBase;

  function _formatLivePrice(usdAmount) {
    if (!usdAmount) return '';
    if (_liveRates) {
      if (cur.k === 'IRR') {
        const toman = Math.round(usdAmount * (_liveRates['IRR'] ?? 62000) / 10);
        return `${toman.toLocaleString()} تومان`;
      }
      const rate = _liveRates[cur.k];
      if (rate) return `${Math.round(usdAmount * rate).toLocaleString()} ${cur.s}`;
    }
    return `${(_paidPrice).toLocaleString()} ${cur.s}`;
  }

  /* بارگذاری نرخ لحظه‌ای */
  (async () => {
    try {
      const res  = await fetch('https://open.er-api.com/v6/latest/USD');
      const data = await res.json();
      if (data?.result === 'success' && data?.rates) {
        _liveRates = data.rates;
        cur = getUserCurrency();
        if (cur.k === 'IRR') {
          _paidPrice = Math.round(usdBase * (_liveRates['IRR'] ?? 62000) / 10);
        } else {
          _paidPrice = Math.round(usdBase * (_liveRates[cur.k] ?? 1));
        }
        _render();
      }
    } catch {}
  })();

  function _render() {
    container.innerHTML = `
      <!-- Hero -->
      <div style="
        background:linear-gradient(145deg,#1a0a2e 0%,#2d1b4e 50%,#0a2a1a 100%);
        padding:calc(var(--navbar-height) + var(--space-10)) 0 var(--space-12);
        text-align:center;position:relative;overflow:hidden;
      ">
        <div style="position:absolute;inset:0;opacity:0.05;background-image:radial-gradient(white 1px,transparent 1px);background-size:30px 30px" aria-hidden="true"></div>
        <div class="container" style="position:relative;z-index:1">
          <div style="font-size:64px;margin-bottom:var(--space-4);filter:drop-shadow(0 4px 20px rgba(139,92,246,0.5));animation:float 4s ease-in-out infinite" aria-hidden="true">⭐</div>
          <h1 style="font-family:var(--font-rtl-display);font-size:clamp(1.8rem,4vw,2.5rem);font-weight:900;color:white;margin-bottom:var(--space-3)">${tx(COPY.pageTitle)}</h1>
          <p style="color:rgba(255,255,255,0.65);font-size:var(--text-md);max-width:48ch;margin:0 auto">${tx(COPY.pageDesc)}</p>
        </div>
      </div>

      <!-- Content -->
      <div class="section">
        <div class="container" style="max-width:640px">
          ${_step === 'select'      ? _renderSelect()      : ''}
          ${_step === 'free-intent' ? _renderFreeIntent()  : ''}
          ${_step === 'paid-topic'  ? _renderPaidTopic()   : ''}
          ${_step === 'payment'     ? '<div id="istikhara-payment-root"></div>' : ''}
          ${_step === 'confirm'     ? _renderConfirm()     : ''}
        </div>
      </div>
    `;
    _bindEvents();
    if (_step === 'payment') {
      const payRoot = document.getElementById('istikhara-payment-root');
      if (payRoot) {
        renderPaymentPage(payRoot, config.paidPrice?.USD ?? 15, 'istikhara');
        /* منتظر تأیید پرداخت — هر ۵۰۰ms بررسی می‌کنیم confirm نمایش داده شده یا نه */
        const checkInterval = setInterval(() => {
          const confirmEl = payRoot.querySelector('.payment-confirm-done, [data-step="confirm"]');
          const confirmH2 = Array.from(payRoot.querySelectorAll('h2')).find(el =>
            el.textContent.includes('ثبت شد') || el.textContent.includes('registered') || el.textContent.includes('تسجيل')
          );
          if (confirmEl || confirmH2) {
            clearInterval(checkInterval);
            if (_pendingOrder) {
              IstikharaOrders.update(_pendingOrder.id, { paid: true });
              const paidDelay = _getPaidDelayMs();
              setTimeout(() => processIstikhara(_pendingOrder.id), paidDelay);
              if (window.location.hostname === 'localhost') setTimeout(() => processIstikhara(_pendingOrder.id), 10000);
            }
            _step = 'confirm'; _render();
          }
        }, 500);
      }
    }
  }

  function _renderSelect() {
    return `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-5)" role="group">

        <!-- رایگان -->
        ${config.freeActive ? `
          <button class="istikhara-card" id="select-free" style="
            background:var(--bg-surface);
            border:2px solid var(--border-color);
            border-radius:var(--radius-xl);
            padding:var(--space-7) var(--space-5);
            text-align:center;cursor:pointer;
            transition:all var(--transition-base);
            position:relative;overflow:hidden;
          ">
            <div style="font-size:48px;margin-bottom:var(--space-4)" aria-hidden="true">🕌</div>
            <div style="font-size:var(--text-lg);font-weight:var(--weight-bold);color:var(--text-primary);margin-bottom:var(--space-2)">${tx(COPY.freeTitle)}</div>
            <div style="font-size:var(--text-sm);color:var(--text-muted);margin-bottom:var(--space-4)">${tx(COPY.freeDesc)}</div>
            <div style="
              display:inline-block;
              background:var(--color-primary-50);
              color:var(--color-primary-700);
              padding:var(--space-1) var(--space-4);
              border-radius:var(--radius-full);
              font-size:var(--text-sm);
              font-weight:var(--weight-bold);
            ">${tx({fa:'رایگان',ar:'مجاناً',ur:'مفت',az:'Pulsuz',tr:'Ücretsiz',ru:'Бесплатно',en:'Free',id:'Gratis'})}</div>
          </button>
        ` : ''}

        <!-- پولی -->
        ${config.paidActive ? `
          <button class="istikhara-card" id="select-paid" style="
            background:linear-gradient(135deg,#1a0a2e,#2d1b4e);
            border:2px solid rgba(139,92,246,0.4);
            border-radius:var(--radius-xl);
            padding:var(--space-7) var(--space-5);
            text-align:center;cursor:pointer;
            transition:all var(--transition-base);
            position:relative;overflow:hidden;
            color:white;
          ">
            <div style="font-size:48px;margin-bottom:var(--space-4);filter:drop-shadow(0 2px 8px rgba(139,92,246,0.5))" aria-hidden="true">🎤</div>
            <div style="font-size:var(--text-lg);font-weight:var(--weight-bold);margin-bottom:var(--space-2)">${tx(COPY.paidTitle)}</div>
            <div style="font-size:var(--text-sm);color:rgba(255,255,255,0.65);margin-bottom:var(--space-4)">${tx(COPY.paidDesc)}</div>
            <div style="
              display:inline-block;
              background:rgba(139,92,246,0.3);
              border:1px solid rgba(139,92,246,0.5);
              padding:var(--space-1) var(--space-4);
              border-radius:var(--radius-full);
              font-size:var(--text-sm);
              font-weight:var(--weight-bold);
            ">${tx(COPY.gift)} $${usdBase} <span style="font-size:var(--text-xs);opacity:0.75">(${_formatLivePrice(usdBase)})</span></div>
          </button>
        ` : ''}

      </div>

      <style>
        .istikhara-card:hover { transform:translateY(-4px); box-shadow:var(--shadow-xl); }
        .istikhara-card:focus-visible { outline:3px solid var(--color-primary-500); outline-offset:3px; }
      </style>
    `;
  }

  function _renderFreeIntent() {
    return `
      <div style="
        background:var(--bg-surface);
        border:1px solid var(--border-color);
        border-radius:var(--radius-xl);
        padding:var(--space-8);
        text-align:center;
        box-shadow:var(--shadow-md);
      ">
        <div style="font-size:56px;margin-bottom:var(--space-5);animation:float 4s ease-in-out infinite" aria-hidden="true">🌙</div>
        <h2 style="font-size:var(--text-xl);font-weight:var(--weight-bold);color:var(--text-primary);margin-bottom:var(--space-4)">${tx(COPY.intentLabel)}</h2>
        <p style="font-size:var(--text-base);color:var(--text-secondary);margin-bottom:var(--space-8);line-height:var(--leading-relaxed);max-width:40ch;margin-inline:auto">
          ${tx({fa:'چند لحظه صبر کنید، نیت خود را در دل بکنید و سپس دکمه استخاره را بزنید',ar:'انتظر لحظة، انوِ في قلبك ثم اضغط زر الاستخارة',ur:'چند لمحے رکیں، دل میں نیت کریں پھر بٹن دبائیں',az:'Bir an gözləyin, niyyətinizi ürəyinizdə edin, sonra düyməyə basın',tr:'Bir an bekleyin, niyetinizi kalbinizde yapın, sonra düğmeye basın',ru:'Подождите мгновение, сделайте намерение в сердце, затем нажмите кнопку',en:'Wait a moment, make your intention in your heart, then press the button',id:'Tunggu sejenak, niatkan dalam hati, lalu tekan tombol'})}
        </p>
        <!-- تسبیح انیمیشن -->
        <div style="display:flex;justify-content:center;gap:8px;margin-bottom:var(--space-8)" aria-hidden="true">
          ${Array.from({length:7}).map((_,i)=>`
            <div style="
              width:14px;height:14px;border-radius:50%;
              background:var(--color-primary-${300+i*50 > 700 ? 700 : 300+i*50});
              animation:pulse ${1+i*0.15}s ease infinite;
            "></div>
          `).join('')}
        </div>
        <button id="do-free-istikhara" class="btn btn--primary btn--lg" style="width:100%;padding:var(--space-5)">
          ${tx(COPY.submitFree)}
        </button>
        <button id="back-to-select" class="btn btn--ghost btn--sm" style="margin-top:var(--space-3);width:100%;color:var(--text-muted)">
          ← ${tx({fa:'برگشت',ar:'رجوع',ur:'واپس',az:'Geri',tr:'Geri',ru:'Назад',en:'Back',id:'Kembali'})}
        </button>
      </div>
    `;
  }

  function _renderPaidTopic() {
    return `
      <div style="
        background:var(--bg-surface);
        border:1px solid var(--border-color);
        border-radius:var(--radius-xl);
        overflow:hidden;
        box-shadow:var(--shadow-md);
      ">
        <div style="
          background:linear-gradient(135deg,#1a0a2e,#2d1b4e);
          padding:var(--space-6);
          display:flex;align-items:center;gap:var(--space-3);
        ">
          <span style="font-size:32px" aria-hidden="true">🎤</span>
          <div>
            <div style="font-size:var(--text-lg);font-weight:var(--weight-bold);color:white">${tx(COPY.paidTitle)}</div>
            <div style="font-size:var(--text-sm);font-weight:var(--weight-bold);color:white">$${usdBase}</div>
            <div style="font-size:var(--text-xs);color:rgba(255,255,255,0.55)">${tx({fa:'معادل',ar:'ما يعادل',ur:'مساوی',az:'ekvivalent',tr:'karşılığı',ru:'эквивалент',en:'equivalent',id:'setara'})} ${_formatLivePrice(usdBase)}</div>
          </div>
        </div>
        <div style="padding:var(--space-7)">
          <!-- موضوع استخاره -->
          <div class="admin-field">
            <label class="auth-label" for="istikhara-topic">${tx(COPY.topicLabel)} *</label>
            <textarea
              class="auth-input"
              id="istikhara-topic"
              rows="4"
              placeholder="${tx(COPY.topicPlaceholder)}"
              style="resize:vertical;font-family:inherit"
              aria-required="true"
            >${_topic}</textarea>
            <div id="topic-error" style="color:var(--color-error);font-size:var(--text-sm);margin-top:var(--space-2);display:none">
              ⚠ ${tx({fa:'لطفاً موضوع استخاره را بنویسید',ar:'الرجاء كتابة موضوع الاستخارة',ur:'استخارے کا موضوع لکھیں',az:'Xahiş edirik istixarə mövzusunu yazın',tr:'Lütfen istihare konusunu yazın',ru:'Пожалуйста, напишите тему истихары',en:'Please write the topic',id:'Harap tulis topik'})}
            </div>
          </div>

          <!-- اطلاعات تکمیلی کاربر -->
          <div style="margin-top:var(--space-4);display:grid;grid-template-columns:1fr 1fr 1fr;gap:var(--space-3)">

            <!-- سن -->
            <div class="admin-field">
              <label class="auth-label" for="istikhara-age">
                ${tx({fa:'سن',ar:'العمر',ur:'عمر',az:'Yaş',tr:'Yaş',ru:'Возраст',en:'Age',id:'Usia'})}
              </label>
              <input type="number" id="istikhara-age"
                value="${_age}"
                min="1" max="120" dir="ltr"
                placeholder="${tx({fa:'مثلاً ۳۰',ar:'مثلاً 30',ur:'مثلاً 30',az:'məs. 30',tr:'örn. 30',ru:'напр. 30',en:'e.g. 30',id:'mis. 30'})}"
                class="auth-input"
                style="text-align:center"
              />
            </div>

            <!-- جنسیت -->
            <div class="admin-field">
              <label class="auth-label" for="istikhara-gender">
                ${tx({fa:'جنسیت',ar:'الجنس',ur:'جنس',az:'Cins',tr:'Cinsiyet',ru:'Пол',en:'Gender',id:'Jenis Kelamin'})}
              </label>
              <select id="istikhara-gender" class="auth-input" style="cursor:pointer">
                <option value="" ${!_gender?'selected':''}>— ${tx({fa:'انتخاب',ar:'اختر',ur:'منتخب',az:'seçin',tr:'seçin',ru:'выбрать',en:'select',id:'pilih'})} —</option>
                <option value="male"   ${_gender==='male'?'selected':''}>${tx({fa:'مرد',ar:'ذكر',ur:'مرد',az:'Kişi',tr:'Erkek',ru:'Мужчина',en:'Male',id:'Laki-laki'})}</option>
                <option value="female" ${_gender==='female'?'selected':''}>${tx({fa:'زن',ar:'أنثى',ur:'عورت',az:'Qadın',tr:'Kadın',ru:'Женщина',en:'Female',id:'Perempuan'})}</option>
              </select>
            </div>

            <!-- وضعیت تاهل -->
            <div class="admin-field">
              <label class="auth-label" for="istikhara-marital">
                ${tx({fa:'وضعیت تاهل',ar:'الحالة الاجتماعية',ur:'ازدواجی حیثیت',az:'Ailə vəziyyəti',tr:'Medeni Durum',ru:'Семейное положение',en:'Marital Status',id:'Status Pernikahan'})}
              </label>
              <select id="istikhara-marital" class="auth-input" style="cursor:pointer">
                <option value="" ${!_marital?'selected':''}>— ${tx({fa:'انتخاب',ar:'اختر',ur:'منتخب',az:'seçin',tr:'seçin',ru:'выбрать',en:'select',id:'pilih'})} —</option>
                <option value="single"   ${_marital==='single'?'selected':''}>${tx({fa:'مجرد',ar:'أعزب',ur:'غیر شادی شدہ',az:'Subay',tr:'Bekar',ru:'Холост/Не замужем',en:'Single',id:'Lajang'})}</option>
                <option value="married"  ${_marital==='married'?'selected':''}>${tx({fa:'متاهل',ar:'متزوج',ur:'شادی شدہ',az:'Evli',tr:'Evli',ru:'Женат/Замужем',en:'Married',id:'Menikah'})}</option>
                <option value="divorced" ${_marital==='divorced'?'selected':''}>${tx({fa:'مطلقه',ar:'مطلق',ur:'طلاق یافتہ',az:'Boşanmış',tr:'Boşanmış',ru:'Разведён/Разведена',en:'Divorced',id:'Cerai'})}</option>
                <option value="widowed"  ${_marital==='widowed'?'selected':''}>${tx({fa:'بیوه',ar:'أرمل',ur:'بیوہ',az:'Dul',tr:'Dul',ru:'Вдовец/Вдова',en:'Widowed',id:'Janda/Duda'})}</option>
              </select>
            </div>

          </div>
          <button id="go-to-payment" class="btn btn--primary btn--lg" style="width:100%;margin-top:var(--space-4);padding:var(--space-4)">
            ${tx({fa:'ادامه — انتخاب روش پرداخت',ar:'متابعة — اختر طريقة الدفع',ur:'جاری رہیں — ادائیگی کا طریقہ',az:'Davam et — Ödəniş üsulunu seç',tr:'Devam — Ödeme yöntemi seç',ru:'Далее — Выбрать способ оплаты',en:'Continue — Select Payment Method',id:'Lanjut — Pilih Metode Pembayaran'})} →
          </button>
          <button id="back-to-select" class="btn btn--ghost btn--sm" style="margin-top:var(--space-3);width:100%;color:var(--text-muted)">
            ← ${tx({fa:'برگشت',ar:'رجوع',ur:'واپس',en:'Back',id:'Kembali'})}
          </button>
        </div>
      </div>
    `;
  }

  function _renderConfirm() {
    const msgText = tx(COPY.confirmMsg);
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
          ${tx({fa:'سفارش ثبت شد',ar:'تم التسجيل',ur:'آرڈر درج ہوگیا',az:'Sifariş qeydə alındı',tr:'Talep Kaydedildi',ru:'Запрос зарегистрирован',en:'Request Registered',id:'Permintaan Terdaftar'})}
        </h2>
        <div style="
          background:var(--bg-surface);
          border:1px solid var(--border-color);
          border-radius:var(--radius-lg);
          padding:var(--space-5) var(--space-6);
          font-size:var(--text-base);
          color:var(--text-secondary);
          line-height:var(--leading-relaxed);
          white-space:pre-line;
          text-align:start;
          margin-bottom:var(--space-6);
          border-inline-start:4px solid var(--color-primary-500);
        ">
          ${msgText}
        </div>
        <a href="/profile.html#messages" class="btn btn--primary btn--lg" style="display:inline-flex;align-items:center;gap:var(--space-2)">
          📨 ${tx({fa:'مشاهده پیام‌های من',ar:'عرض رسائلي',ur:'میرے پیغامات دیکھیں',az:'Mesajlarıma bax',tr:'Mesajlarımı Görüntüle',ru:'Посмотреть мои сообщения',en:'View My Messages',id:'Lihat Pesan Saya'})}
        </a>
      </div>
    `;
  }

  function _bindEvents() {
    container.querySelectorAll('.istikhara-card').forEach(card => {
      card.addEventListener('mouseenter', () => { card.style.transform = 'translateY(-4px)'; card.style.boxShadow = 'var(--shadow-xl)'; });
      card.addEventListener('mouseleave', () => { card.style.transform = ''; card.style.boxShadow = ''; });
    });

    document.getElementById('select-free')?.addEventListener('click', () => {
      _type = 'free'; _step = 'free-intent'; _render();
    });

    document.getElementById('select-paid')?.addEventListener('click', () => {
      _type = 'paid'; _step = 'paid-topic'; _render();
    });

    document.getElementById('back-to-select')?.addEventListener('click', () => {
      _step = 'select'; _render();
    });

    document.getElementById('do-free-istikhara')?.addEventListener('click', async () => {
      const btn  = document.getElementById('do-free-istikhara');
      if (btn) { btn.disabled = true; btn.textContent = '⏳...'; }
      const user = AuthState.getUser();
      const order = IstikharaOrders.add({
        type:     'free',
        userId:   user?.id ?? 'guest',
        userName: user?.name ?? '',
        userLang: lang,
        userCountry: user?.country ?? '',
        topic:    '',
      });
      /* پردازش بعد از تأخیر تنظیم‌شده توسط ادمین */
      const freeDelay = _getFreeDelayMs();
      setTimeout(() => processIstikhara(order.id), freeDelay);
      /* در dev — ۵ ثانیه */
      if (window.location.hostname === 'localhost') setTimeout(() => processIstikhara(order.id), 5000);
      _step = 'confirm'; _render();
    });

    /* live check مبلغ واریزی هنگام تایپ */
    document.getElementById('istikhara-paid-amount')?.addEventListener('input', () => {
      const paidVal  = parseFloat(document.getElementById('istikhara-paid-amount')?.value) || 0;
      const paidCur  = document.getElementById('istikhara-paid-currency')?.value ?? 'USD';
      const checkEl  = document.getElementById('istikhara-amount-check');
      if (!checkEl || !paidVal) { if(checkEl) checkEl.textContent=''; return; }

      /* مقایسه مبلغ واریزی با حداقل مورد نیاز
         _paidPrice همیشه معادل ارز کاربر است (از لحظه‌ای یا ثابت)
         اگر ارز انتخابی با ارز کاربر یکی است → مستقیم مقایسه
         اگر فرق دارد → هر دو را به USD تبدیل کن */
      let sufficient;
      const selectedCurKey = paidCur.toLowerCase();
      const userCurKey     = cur.k.toLowerCase();

      if (paidCur === 'USD' || paidCur === 'USDT') {
        /* کاربر دلار واریز کرده */
        sufficient = paidVal >= usdBase * 0.98;
      } else if (paidCur === cur.k) {
        /* ارز انتخابی = ارز کاربر — مستقیم با _paidPrice مقایسه کن */
        sufficient = paidVal >= _paidPrice * 0.98;
      } else if (_liveRates) {
        /* ارز متفاوت — هر دو را به USD تبدیل کن */
        let paidUSD = paidVal;
        if (paidCur === 'IRR') paidUSD = (paidVal * 10) / (_liveRates['IRR'] ?? 62000);
        else paidUSD = (_liveRates[selectedCurKey] ?? 0) > 0 ? paidVal / _liveRates[selectedCurKey] : 0;
        sufficient = paidUSD >= usdBase * 0.98;
      } else {
        /* هیچ نرخی موجود نیست — مستقیم با _paidPrice مقایسه کن */
        sufficient = paidVal >= _paidPrice * 0.98;
      }
      checkEl.style.color = sufficient ? '#16a34a' : '#e63946';
      checkEl.textContent  = sufficient
        ? `✓ ${tx({fa:'مبلغ کافی است',ar:'المبلغ كافٍ',ur:'رقم کافی ہے',az:'Məbləğ kifayətdir',tr:'Tutar yeterli',ru:'Суммы достаточно',en:'Amount is sufficient',id:'Jumlah mencukupi'})}`
        : `✗ ${tx({fa:'مبلغ ناکافی',ar:'المبلغ غير كافٍ',ur:'رقم ناکافی',az:'Məbləğ kifayət deyil',tr:'Tutar yetersiz',ru:'Суммы недостаточно',en:'Insufficient amount',id:'Jumlah tidak mencukupi'})} — ${tx({fa:'حداقل',ar:'الحد الأدنى',ur:'کم از کم',az:'Minimum',tr:'Minimum',ru:'Минимум',en:'Minimum',id:'Minimum'})}: ${_formatLivePrice(usdBase)}`;
    });

    /* ── validation موضوع با Claude — سریع و دقیق ── */
    async function _validateTopic(topic) {
      /* اول بررسی ساده — اگر خیلی کوتاه یا عدد محض است */
      if (!topic || topic.length < 3) return false;
      if (!/[\p{L}]/u.test(topic)) return false; /* اگر هیچ حرفی از هیچ زبانی ندارد — رد کن */

      const apiKey = localStorage.getItem('mh_claude_api_key');
      if (!apiKey) return true; /* اگر API Key نیست — قبول کن */

      try {
        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 10,
            system: `You validate if a text is a genuine istikhara topic (a real life decision or situation someone needs guidance on).
Reply with ONLY one word: "valid" or "invalid".
Be VERY lenient — if there's any chance it could be a real concern, say "valid".
Only say "invalid" for: random keyboard smashing, pure numbers, completely meaningless text, or clear spam.
Short topics like "marriage", "job", "travel" are all valid.`,
            messages: [{ role: 'user', content: `Is this a valid istikhara topic? "${topic}"` }],
          }),
        });
        const data = await res.json();
        const answer = data.content?.[0]?.text?.toLowerCase().trim() ?? 'valid';
        return !answer.includes('invalid');
      } catch { return true; } /* در صورت خطا — قبول کن */
    }

    document.getElementById('go-to-payment')?.addEventListener('click', async () => {
      const topic = document.getElementById('istikhara-topic')?.value?.trim();
      if (!topic) {
        document.getElementById('topic-error').style.display = 'block';
        return;
      }

      /* validation موضوع */
      const btn = document.getElementById('go-to-payment');
      const origText = btn?.textContent;
      if (btn) { btn.disabled = true; btn.textContent = '⏳...'; }

      const isValid = await _validateTopic(topic);

      if (!isValid) {
        if (btn) { btn.disabled = false; btn.textContent = origText; }
        const topicErrEl = document.getElementById('topic-error');
        if (topicErrEl) {
          topicErrEl.textContent = ({
            fa: '⚠ لطفاً موضوع استخاره خود را واضح‌تر بنویسید',
            ar: '⚠ يرجى كتابة موضوع الاستخارة بشكل أوضح',
            ur: '⚠ براہ کرم استخارے کا موضوع واضح لکھیں',
            az: '⚠ Xahiş edirik istixarə mövzusunu daha aydın yazın',
            tr: '⚠ Lütfen istihare konusunu daha açık yazın',
            ru: '⚠ Пожалуйста, напишите тему истихары более чётко',
            en: '⚠ Please write your istikhara topic more clearly',
            id: '⚠ Harap tulis topik istikharah dengan lebih jelas',
          })[lang] ?? '⚠ Please write your istikhara topic more clearly';
          topicErrEl.style.display = 'block';
        }
        return;
      }

      if (btn) btn.disabled = false;

      if (btn) btn.textContent = origText;
      _topic   = topic;
      _age     = document.getElementById('istikhara-age')?.value?.trim()     ?? '';
      _gender  = document.getElementById('istikhara-gender')?.value           ?? '';
      _marital = document.getElementById('istikhara-marital')?.value          ?? '';
      const user = AuthState.getUser();
      _pendingOrder = IstikharaOrders.add({
        type:        'paid',
        userId:      user?.id ?? 'guest',
        userName:    user?.name ?? '',
        userLang:    lang,
        userCountry: user?.country ?? localStorage.getItem('mh_user_country') ?? '',
        topic,
        userAge:     _age,
        userGender:  _gender,
        userMarital: _marital,
        paid:        false,
      });
      _step = 'payment'; _render();
    });
  }

  _render();
  i18n.onChange(() => _render());
}
