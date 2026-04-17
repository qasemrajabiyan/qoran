/**
 * ============================================================
 * FILE: quran.js
 * ROLE: دانشگاه قرآن — منطق کامل با AI ترجمه، paywall، free reads
 * PROJECT: MediaHub — پلتفرم رسانه‌ای کربلا
 * VERSION: 1.0.0
 * DEPENDS ON: i18n.js, auth.js
 * ============================================================
 */

import { i18n, timeAgo, formatNum, getUserCurrency } from './i18n.js';
import { initAutoPageTranslation } from './auto-translate.js';
import { AuthState } from './auth.js';
import { renderPaymentPage } from './payment-system.js';

/* ────────────────────────────────────────────────────────────
   1. ترجمه‌های اختصاصی
   ──────────────────────────────────────────────────────────── */
const QC = {
  pageTitle:      { fa:'دانشگاه قرآن', ar:'جامعة القرآن', ur:'یونیورسٹی قرآن', az:'Quran Universiteti', tr:'Kuran Üniversitesi', ru:'Университет Корана', en:'Quran University', id:'Universitas Quran' },
  pageDesc:       { fa:'آموزش گام به گام تدبر و فهم قرآن', ar:'تعلّم التدبر وفهم القرآن خطوة بخطوة', ur:'قرآن کی سمجھ اور تدبر کی مرحلہ وار تعلیم', az:'Quranı addım-addım dərk etmə və anlamaq', tr:'Kuran\'ı adım adım tefekkür ve anlama eğitimi', ru:'Пошаговое обучение размышлению и пониманию Корана', en:'Step-by-step learning of Quran reflection and understanding', id:'Pembelajaran tadabur dan pemahaman Al-Quran langkah demi langkah' },
  summaryLabel:   { fa:'توضیح اجمالی', ar:'الشرح المختصر', ur:'مختصر وضاحت', az:'Qısa izah', tr:'Kısa Açıklama', ru:'Краткое пояснение', en:'Brief Explanation', id:'Penjelasan Singkat' },
  tadabburLabel:  { fa:'تدبر و شرح', ar:'التدبر والشرح', ur:'تدبر اور شرح', az:'Tədəbbür və şərh', tr:'Tefekkür ve Şerh', ru:'Размышление и пояснение', en:'Reflection & Commentary', id:'Refleksi & Ulasan' },
  memberOnly:     { fa:'ویژه اعضا', ar:'للأعضاء فقط', ur:'صرف اراکین کے لیے', az:'Yalnız üzvlər üçün', tr:'Sadece Üyeler İçin', ru:'Только для участников', en:'Members Only', id:'Khusus Anggota' },
  lockTitle:      { fa:'برای مطالعه تدبر کامل عضو شوید', ar:'اشترك لقراءة التدبر الكامل', ur:'مکمل تدبر پڑھنے کے لیے رکن بنیں', az:'Tam tədəbbürü oxumaq üçün üzv olun', tr:'Tam tefekkürü okumak için üye olun', ru:'Оформите членство для полного чтения', en:'Subscribe to read full reflection', id:'Daftar untuk membaca refleksi lengkap' },
  lockDesc:       { fa:'اعضای ماهیانه به تمام تدبرات دسترسی دارند', ar:'الأعضاء الشهريون يصلون لجميع التدبرات', ur:'ماہانہ اراکین تمام تدبرات تک رسائی رکھتے ہیں', az:'Aylıq üzvlər bütün tədəbbürlərə çatır', tr:'Aylık üyeler tüm tefekkürlere erişebilir', ru:'Ежемесячные участники имеют доступ ко всем размышлениям', en:'Monthly members have access to all reflections', id:'Anggota bulanan memiliki akses ke semua refleksi' },
  freeReadsLeft:  { fa:'مطالعه رایگان این ماه', ar:'قراءات مجانية هذا الشهر', ur:'اس ماہ مفت مطالعے', az:'Bu ay pulsuz oxumalar', tr:'Bu ay ücretsiz okuma', ru:'Бесплатных чтений в этом месяце', en:'Free reads this month', id:'Bacaan gratis bulan ini' },
  subscribeBtn:   { fa:'اشتراک ماهیانه', ar:'الاشتراك الشهري', ur:'ماہانہ سبسکرپشن', az:'Aylıq abunəlik', tr:'Aylık Abonelik', ru:'Ежемесячная подписка', en:'Monthly Subscription', id:'Langganan Bulanan' },
  readFreeBtn:    { fa:'مطالعه رایگان (باقی‌مانده: {n})', ar:'قراءة مجانية (متبقي: {n})', ur:'مفت مطالعہ (باقی: {n})', az:'Pulsuz oxu (qalan: {n})', tr:'Ücretsiz Oku (Kalan: {n})', ru:'Читать бесплатно (осталось: {n})', en:'Read Free ({n} left)', id:'Baca Gratis (sisa: {n})' },
  translating:    { fa:'در حال ترجمه...', ar:'جارٍ الترجمة...', ur:'ترجمہ ہو رہا ہے...', az:'Tərcümə olunur...', tr:'Çevriliyor...', ru:'Переводится...', en:'Translating...', id:'Menerjemahkan...' },
  translatedBy:   { fa:'ترجمه توسط هوش مصنوعی', ar:'مترجم بالذكاء الاصطناعي', ur:'مصنوعی ذہانت کا ترجمہ', az:'AI tərəfindən tərcümə', tr:'Yapay zeka ile çevrildi', ru:'Переведено ИИ', en:'Translated by AI', id:'Diterjemahkan oleh AI' },
  allSurahs:      { fa:'همه سوره‌ها', ar:'جميع السور', ur:'تمام سورتیں', az:'Bütün surələr', tr:'Tüm Sureler', ru:'Все суры', en:'All Surahs', id:'Semua Surah' },
  membersCount:   { fa:'کاربر', ar:'مستخدم', ur:'صارف', en:'Members', tr:'Üye', ru:'участников', az:'üzv', id:'Anggota' },
  ayahsCount:     { fa:'آیه تدبر شده', ar:'آية تم تدبرها', ur:'آیات کا تدبر', en:'Ayahs Reflected', tr:'Tefekkür Edilmiş Ayet', ru:'Аятов с размышлением', az:'Ayə', id:'Ayat yang Direfleksikan' },
  surahs:         { fa:'سوره', ar:'سورة', ur:'سورت', en:'Surah', tr:'Sure', ru:'Сур', az:'Surə', id:'Surah' },
  /* ویدیو */
  videoLabel:     { fa:'ویدیو استاد', ar:'فيديو الأستاذ', ur:'استاد کی ویڈیو', az:'Müəllim videosu', tr:'Hoca videosu', ru:'Видео устаза', en:"Sheikh's Video", id:'Video Syaikh' },
  dubbing:        { fa:'دوبله هوش مصنوعی', ar:'الدبلجة بالذكاء الاصطناعي', ur:'AI ڈبنگ', az:'AI dublyaj', tr:'AI dublaj', ru:'AI дублирование', en:'AI Dubbing', id:'Dubbing AI' },
  dubbingPending: { fa:'در حال دوبله...', ar:'جارٍ الدبلجة...', ur:'ڈبنگ ہو رہی ہے...', az:'Dublyaj edilir...', tr:'Dublajlanıyor...', ru:'Дублируется...', en:'Dubbing in progress...', id:'Sedang mendubbing...' },
  extractAudio:   { fa:'نسخه صوتی استخراج‌شده از ویدیو', ar:'النسخة الصوتية المستخرجة من الفيديو', ur:'ویڈیو سے نکالی گئی آڈیو', az:'Videodan çıxarılmış audio', tr:'Videodan çıkarılan ses', ru:'Аудио из видео', en:'Audio extracted from video', id:'Audio dari video' },
  speedLabel:     { fa:'سرعت', ar:'السرعة', ur:'رفتار', az:'Sürət', tr:'Hız', ru:'Скорость', en:'Speed', id:'Kecepatan' },
  bgPlayOn:       { fa:'پخش پس‌زمینه فعال', ar:'التشغيل في الخلفية مفعّل', ur:'بیک گراؤنڈ پلے فعال', az:'Arxa plan aktiv', tr:'Arka plan oynatma açık', ru:'Фоновое воспроизведение вкл', en:'Background play on', id:'Putar latar belakang aktif' },
  /* Reward Ads */
  watchAdBtn:     { fa:'تماشای تبلیغ برای دسترسی', ar:'شاهد إعلاناً للوصول', ur:'رسائی کے لیے اشتہار دیکھیں', az:'Giriş üçün reklam izlə', tr:'Erişim için reklam izle', ru:'Смотреть рекламу для доступа', en:'Watch ad for access', id:'Tonton iklan untuk akses' },
  adAccessLabel:  { fa:'دسترسی رایگان با تماشای تبلیغ', ar:'وصول مجاني بمشاهدة إعلان', ur:'اشتہار دیکھ کر مفت رسائی', az:'Reklam izləyərək pulsuz giriş', tr:'Reklam izleyerek ücretsiz erişim', ru:'Бесплатный доступ за просмотр рекламы', en:'Free access by watching an ad', id:'Akses gratis dengan menonton iklan' },
  adTimerLabel:   { fa:'دسترسی فعال — {m} دقیقه باقی', ar:'الوصول نشط — {m} دقيقة متبقية', ur:'رسائی فعال — {m} منٹ باقی', az:'Giriş aktiv — {m} dəq qaldı', tr:'Erişim aktif — {m} dk kaldı', ru:'Доступ активен — осталось {m} мин', en:'Access active — {m} min left', id:'Akses aktif — sisa {m} menit' },
  adDailyLimit:   { fa:'سقف روزانه تبلیغ تمام شد', ar:'تجاوزت الحد اليومي للإعلانات', ur:'روزانہ اشتہار کی حد ختم', az:'Gündəlik reklam limiti dolub', tr:'Günlük reklam limiti doldu', ru:'Дневной лимит рекламы исчерпан', en:'Daily ad limit reached', id:'Batas iklan harian tercapai' },
  freeVideoUsed:  { fa:'۵ دسترسی رایگان استفاده شد', ar:'استُخدمت ٥ وصلات مجانية', ur:'۵ مفت رسائی استعمال ہوگئی', az:'5 pulsuz giriş istifadə edildi', tr:'5 ücretsiz erişim kullanıldı', ru:'Использовано 5 бесплатных доступов', en:'5 free accesses used', id:'5 akses gratis telah digunakan' },
};

function tx(obj, vars = {}) {
  let text = obj[i18n.lang] ?? obj['fa'] ?? obj['en'] ?? '';
  Object.entries(vars).forEach(([k, v]) => { text = text.replaceAll(`{${k}}`, v); });
  return text;
}

/* ────────────────────────────────────────────────────────────
   2. داده‌های سوره‌ها (نمونه — ۵ سوره اول)
   ──────────────────────────────────────────────────────────── */
export const SURAHS = [
  { num: 1,  name: 'الفاتحة',    ayahs: 7,   tadabburCount: 7  },
  { num: 2,  name: 'البقرة',     ayahs: 286, tadabburCount: 12 },
  { num: 3,  name: 'آل عمران',   ayahs: 200, tadabburCount: 4  },
  { num: 4,  name: 'النساء',     ayahs: 176, tadabburCount: 2  },
  { num: 5,  name: 'المائدة',    ayahs: 120, tadabburCount: 1  },
  { num: 6,  name: 'الأنعام',    ayahs: 165, tadabburCount: 0  },
  { num: 7,  name: 'الأعراف',    ayahs: 206, tadabburCount: 0  },
  { num: 36, name: 'يس',         ayahs: 83,  tadabburCount: 0  },
  { num: 55, name: 'الرحمن',     ayahs: 78,  tadabburCount: 0  },
  { num: 67, name: 'الملك',      ayahs: 30,  tadabburCount: 0  },
  { num: 112,name: 'الإخلاص',   ayahs: 4,   tadabburCount: 4  },
  { num: 113,name: 'الفلق',      ayahs: 5,   tadabburCount: 0  },
  { num: 114,name: 'الناس',      ayahs: 6,   tadabburCount: 0  },
];

/* ────────────────────────────────────────────────────────────
   3. داده‌های آیات با تدبر (نمونه)
   ──────────────────────────────────────────────────────────── */
export const AYAHS_DATA = [
  {
    id: 'a1_1',
    surahNum: 1,
    surahName: 'الفاتحة',
    ayahNum: 1,
    arabic: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
    summary: {
      fa: 'با نام خداوند بخشنده مهربان آغاز می‌کنیم. این آیه مبارک سرآغاز هر کار نیک است و در آن سه صفت الهی ذکر شده است.',
      ar: 'نبدأ باسم الله الرحمن الرحيم. هذه الآية الكريمة هي مطلع كل عمل صالح وتذكر ثلاث صفات إلهية.',
      ur: 'ہم اللہ کے نام سے شروع کرتے ہیں۔ یہ مبارک آیت ہر نیک کام کا آغاز ہے اور اس میں اللہ کی تین صفات بیان کی گئی ہیں۔',
      az: 'Biz Allahın adı ilə başlayırıq. Bu mübarək ayə hər xeyir işin başlanğıcıdır.',
      tr: 'Allah\'ın adıyla başlıyoruz. Bu mübarek ayet her hayırlı işin başlangıcıdır.',
      ru: 'Мы начинаем с именем Аллаха. Этот благословенный аят является началом каждого благого дела.',
      en: 'We begin with the name of Allah. This blessed verse is the beginning of every good deed.',
      id: 'Kami memulai dengan nama Allah. Ayat mubarok ini adalah awal dari setiap perbuatan baik.',
    },
    tadabbur: {
      fa: `بسم‌الله الرحمن الرحیم؛ این جمله که قرآن کریم با آن آغاز می‌شود، درسی عمیق در آغاز هر کاری است.

«الله» اسم ذات پروردگار است — نامی که جامع تمام اسماء و صفات الهی است. «الرحمن» به معنای بخشندگی گسترده‌ای است که شامل همه مخلوقات می‌شود، مؤمن و کافر. «الرحیم» رحمتی خاص است که ویژه مؤمنان در آخرت خواهد بود.

درس تدبر: هر کاری را که آغاز می‌کنیم، اگر با یاد خدا شروع کنیم، برکت الهی همراه آن خواهد بود. پیامبر اکرم (ص) فرمودند: «هر کار مهمی که بدون بسم‌الله شروع شود، ناقص است.»`,
    },
    author: 'شیخ احمد الکربلایی',
    authorAvatar: '👨‍🏫',
    date: new Date('2025-01-15'),
    readTime: 4,
    audioUrl: '', /* ادمین URL صوت استاد را از داشبورد وارد می‌کند */
    videoUrl: '', /* ادمین URL ویدیو اصلی (فارسی) را از داشبورد وارد می‌کند */
    dubbedVideoUrls: {
      /* پس از دوبله خودکار توسط AI (ElevenLabs + Whisper) پر می‌شود */
      ar: '', ur: '', az: '', tr: '', ru: '', en: '', id: '',
    },
    extractedAudioUrl: '', /* صوت استخراج‌شده خودکار از ویدیو */
  },
  {
    id: 'a1_2',
    surahNum: 1,
    surahName: 'الفاتحة',
    ayahNum: 2,
    arabic: 'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ',
    summary: {
      fa: 'ستایش و سپاس مخصوص خداوند است که پروردگار جهانیان است. حمد یعنی ستایش همراه با محبت.',
      ar: 'الحمد لله رب العالمين. الحمد هو الثناء المقترن بالمحبة والتعظيم.',
      ur: 'تمام تعریف اللہ کے لیے ہے جو تمام جہانوں کا پروردگار ہے۔ حمد محبت کے ساتھ تعریف کا نام ہے۔',
      az: 'Həmd aləmlərin Rəbbi olan Allaha məxsusdur. Həmd sevgi ilə birlikdə tərif deməkdir.',
      tr: 'Hamd, alemlerin Rabbi olan Allah\'a aittir. Hamd sevgiyle birlikte övmek demektir.',
      ru: 'Хвала Аллаху, Господу миров. Хамд — это восхваление вместе с любовью.',
      en: 'Praise belongs to Allah, Lord of all worlds. Praise means glorification combined with love.',
      id: 'Segala puji bagi Allah, Tuhan semesta alam. Hamdalah berarti pujian yang disertai cinta.',
    },
    tadabbur: {
      fa: `«الحمد» در زبان عربی برترین نوع ستایش است — ستایشی که از محبت برمی‌خیزد، نه از ترس.

«رب» یعنی پروردگار، مربی، و صاحب. خداوند رب العالمین است یعنی تربیت‌کننده و پرورش‌دهنده تمام جهان‌هاست.

«العالمین» جمع عالَم است — یعنی خداوند پروردگار تمام عوالم است: عالم انسان‌ها، جن‌ها، فرشتگان، و هر آنچه هست.

درس تدبر: وقتی می‌گوییم «الحمدلله»، باید از عمق دل سپاسگزار باشیم. سپاس نه فقط با زبان، بلکه با عمل و رفتار.`,
    },
    author: 'شیخ احمد الکربلایی',
    authorAvatar: '👨‍🏫',
    date: new Date('2025-01-22'),
    readTime: 5,
    audioUrl: '',
    videoUrl: '',
    dubbedVideoUrls: { ar: '', ur: '', az: '', tr: '', ru: '', en: '', id: '' },
    extractedAudioUrl: '',
  },
  {
    id: 'a1_3',
    surahNum: 1,
    surahName: 'الفاتحة',
    ayahNum: 3,
    arabic: 'الرَّحْمَٰنِ الرَّحِيمِ',
    summary: {
      fa: 'تکرار صفات رحمانیت و رحیمیت برای تأکید بر اهمیت رحمت الهی در هستی.',
      ar: 'تكرار صفتي الرحمن الرحيم للتأكيد على أهمية الرحمة الإلهية في الوجود.',
      ur: 'رحمانیت اور رحیمیت کی صفات کا اعادہ الٰہی رحمت کی اہمیت پر زور دینے کے لیے ہے۔',
      az: 'Rəhman və Rəhim sifətlərinin təkrarı ilahi rəhmətin əhəmiyyətini vurğulamaq üçündür.',
      tr: 'Rahman ve Rahim sıfatlarının tekrarı, ilahi rahmetin önemini vurgulamak içindir.',
      ru: 'Повторение атрибутов Рахман и Рахим подчёркивает важность Божественного милосердия.',
      en: 'The repetition of Rahman and Rahim attributes emphasizes the importance of Divine mercy.',
      id: 'Pengulangan sifat Rahman dan Rahim untuk menekankan pentingnya rahmat Ilahi.',
    },
    tadabbur: {
      fa: `این دو صفت در ابتدای قرآن ذکر شدند و اینجا تکرار می‌شوند. این تکرار در قرآن بی‌دلیل نیست.

رحمت الهی دو بُعد دارد: رحمت عام (الرحمن) که شامل همه مخلوقات است، و رحمت خاص (الرحیم) که پاداش مؤمنان در آخرت است.

امام حسین (ع) فرمودند: «رحمت خدا آنقدر وسیع است که حتی شیطان هم از آن ناامید نشد، پس تو که انسانی چرا ناامید شوی؟»`,
    },
    author: 'شیخ احمد الکربلایی',
    authorAvatar: '👨‍🏫',
    date: new Date('2025-02-01'),
    readTime: 4,
    audioUrl: '',
    videoUrl: '',
    dubbedVideoUrls: { ar: '', ur: '', az: '', tr: '', ru: '', en: '', id: '' },
    extractedAudioUrl: '',
  },
];

/* ────────────────────────────────────────────────────────────
   3b. اتصال به داده‌های ادمین
   تدبرات ذخیره‌شده توسط ادمین را می‌خواند و به AYAHS_DATA اضافه می‌کند
   key مشترک با admin-router.js: 'mh_quran_tadabbur'
   ──────────────────────────────────────────────────────────── */
const ADMIN_DB_KEY = 'mh_quran_tadabbur';

function _loadAdminAyahs() {
  try {
    const stored = JSON.parse(localStorage.getItem(ADMIN_DB_KEY) || '[]');
    if (!stored.length) return [];

    /* تبدیل فرمت ادمین به فرمت AYAHS_DATA */
    return stored
      .filter(a => a.published && a.id && a.arabic)
      .map(a => ({
        id:          a.id,
        surahNum:    parseInt(a.surahNum) || 0,
        surahName:   a.surahName || '',
        ayahNum:     parseInt(a.ayahNum) || 0,
        arabic:      a.arabic || '',
        summary:     typeof a.summary === 'object' ? a.summary : { fa: a.summary || '' },
        tadabbur:    typeof a.tadabbur === 'object' ? a.tadabbur : { fa: a.tadabbur || '' },
        author:      a.author || 'شیخ احمد الکربلایی',
        authorAvatar:'👨‍🏫',
        date:        a.date ? new Date(a.date) : new Date(),
        readTime:    a.readTime || 5,
        audioUrl:         a.audioUrl         || '',
        videoUrl:         a.videoUrl         || '',
        dubbedVideoUrls:  a.dubbedVideoUrls  || { ar:'', ur:'', az:'', tr:'', ru:'', en:'', id:'' },
        extractedAudioUrl:a.extractedAudioUrl || '',
        _fromAdmin: true, /* نشانگر که از ادمین آمده */
      }));
  } catch {
    return [];
  }
}

/**
 * ترکیب داده‌های ثابت + داده‌های ادمین
 * اگر ادمین همان آیه را ویرایش کرده، نسخه ادمین اولویت دارد
 */
function _getMergedAyahs() {
  const adminAyahs  = _loadAdminAyahs();
  if (!adminAyahs.length) return AYAHS_DATA;

  const adminIds    = new Set(adminAyahs.map(a => a.id));
  /* آیات ثابت که ادمین آن‌ها را override نکرده */
  const baseAyahs   = AYAHS_DATA.filter(a => !adminIds.has(a.id));
  /* ترکیب + مرتب‌سازی بر اساس سوره و آیه */
  return [...baseAyahs, ...adminAyahs]
    .sort((a, b) => a.surahNum - b.surahNum || a.ayahNum - b.ayahNum);
}

/**
 * آپدیت آیه در localStorage توسط ادمین
 * (فراخوانی از admin-router.js بعد از ذخیره)
 */
export function syncAdminAyah(ayahData) {
  try {
    const all = JSON.parse(localStorage.getItem(ADMIN_DB_KEY) || '[]');
    const idx = all.findIndex(a => a.id === ayahData.id);
    if (idx !== -1) all[idx] = { ...all[idx], ...ayahData };
    else all.push(ayahData);
    localStorage.setItem(ADMIN_DB_KEY, JSON.stringify(all));
    return true;
  } catch {
    return false;
  }
}

/**
 * آپدیت URL های دوبله یک آیه (بعد از اتمام دوبله سرور)
 */
export function updateDubbedUrls(ayahId, dubbedVideoUrls, extractedAudioUrl) {
  try {
    const all = JSON.parse(localStorage.getItem(ADMIN_DB_KEY) || '[]');
    const idx = all.findIndex(a => a.id === ayahId);
    if (idx !== -1) {
      if (dubbedVideoUrls)   all[idx].dubbedVideoUrls   = { ...all[idx].dubbedVideoUrls, ...dubbedVideoUrls };
      if (extractedAudioUrl) all[idx].extractedAudioUrl = extractedAudioUrl;
      localStorage.setItem(ADMIN_DB_KEY, JSON.stringify(all));
    }
    return true;
  } catch {
    return false;
  }
}

/* ────────────────────────────────────────────────────────────
   4. FREE READS MANAGER
   ──────────────────────────────────────────────────────────── */
const FREE_READS_MAX = 2;

export const FreeReads = {
  _key() {
    const now = new Date();
    return `free_reads_${now.getFullYear()}_${now.getMonth()}`;
  },
  getCount() {
    try { return parseInt(localStorage.getItem(this._key()) || '0'); } catch { return 0; }
  },
  increment() {
    try { localStorage.setItem(this._key(), String(this.getCount() + 1)); } catch {}
  },
  hasRemaining() { return this.getCount() < FREE_READS_MAX; },
  remaining()    { return Math.max(0, FREE_READS_MAX - this.getCount()); },
};

/* ────────────────────────────────────────────────────────────
   4b. MEDIA ACCESS MANAGER
   مدیریت دسترسی به فیلم و صوت استاد:
   - ۵ بار دسترسی رایگان (lifetime)
   - بعد از آن: تماشای تبلیغ → ۳۰ دقیقه دسترسی (۳ بار در روز)
   - بعد از اتمام سقف روزانه: پیام ادمین
   ──────────────────────────────────────────────────────────── */
const MEDIA_ACCESS_KEY       = 'mh_media_access';
const FREE_MEDIA_MAX         = 5;    /* ۵ بار دسترسی رایگان */
const AD_DAILY_MAX           = 3;    /* حداکثر ۳ تبلیغ در روز */
const AD_ACCESS_DURATION_MS  = 30 * 60 * 1000; /* ۳۰ دقیقه */

export const MediaAccess = {
  _load() {
    try { return JSON.parse(localStorage.getItem(MEDIA_ACCESS_KEY) || 'null') || this._default(); }
    catch { return this._default(); }
  },
  _default() {
    return { freeUsed: 0, adWatchedToday: 0, adAccessUntil: 0, lastAdDate: '' };
  },
  _save(d) {
    try { localStorage.setItem(MEDIA_ACCESS_KEY, JSON.stringify(d)); } catch {}
  },
  _todayStr() {
    return new Date().toISOString().slice(0, 10);
  },

  /* بررسی دسترسی فعلی */
  check() {
    const d = this._load();
    const today = this._todayStr();

    /* ریست شمارش روزانه اگر روز جدید است */
    if (d.lastAdDate !== today) {
      d.adWatchedToday = 0;
      d.lastAdDate = today;
      this._save(d);
    }

    /* ۱. دسترسی رایگان باقی مانده */
    if (d.freeUsed < FREE_MEDIA_MAX) {
      return { allowed: true, type: 'free', remaining: FREE_MEDIA_MAX - d.freeUsed };
    }

    /* ۲. دسترسی از طریق تبلیغ فعال */
    if (d.adAccessUntil > Date.now()) {
      const minsLeft = Math.ceil((d.adAccessUntil - Date.now()) / 60000);
      return { allowed: true, type: 'ad', minsLeft };
    }

    /* ۳. می‌تواند تبلیغ ببیند */
    if (d.adWatchedToday < AD_DAILY_MAX) {
      return { allowed: false, type: 'canWatch', adsLeft: AD_DAILY_MAX - d.adWatchedToday };
    }

    /* ۴. سقف روزانه تمام شده */
    return { allowed: false, type: 'limitReached' };
  },

  /* استفاده از یک دسترسی رایگان */
  useFree() {
    const d = this._load();
    if (d.freeUsed < FREE_MEDIA_MAX) {
      d.freeUsed++;
      this._save(d);
      return true;
    }
    return false;
  },

  /* ثبت تماشای تبلیغ — فعال کردن دسترسی ۳۰ دقیقه‌ای */
  grantAdAccess() {
    const d = this._load();
    const today = this._todayStr();
    if (d.lastAdDate !== today) { d.adWatchedToday = 0; d.lastAdDate = today; }
    d.adWatchedToday++;
    d.adAccessUntil = Date.now() + AD_ACCESS_DURATION_MS;
    this._save(d);
  },

  /* زمان باقی‌مانده دسترسی تبلیغ (دقیقه) */
  getAdMinsLeft() {
    const d = this._load();
    if (d.adAccessUntil > Date.now()) return Math.ceil((d.adAccessUntil - Date.now()) / 60000);
    return 0;
  },
};

/* ─── Reward Ad Simulator ───────────────────────────────────
   در production با AdMob / Google Ad SDK جایگزین می‌شود
   ─────────────────────────────────────────────────────────── */
function _showRewardAd(onComplete, onDismiss) {
  /* شبیه‌سازی: یک overlay تبلیغ نمایش می‌دهد */
  const overlay = document.createElement('div');
  overlay.id = 'reward-ad-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.style.cssText = `
    position:fixed;inset:0;z-index:9999;
    background:rgba(0,0,0,0.92);
    display:flex;flex-direction:column;align-items:center;justify-content:center;
    gap:24px;padding:32px;
  `;

  let countdown = 5; /* ثانیه‌های اجباری قبل از بستن */
  const lang = i18n.lang;
  const skipTexts = {
    fa:`رد کردن تبلیغ در {s} ثانیه`, ar:`تخطي الإعلان بعد {s} ث`, ur:`{s} سیکنڈ میں اشتہار چھوڑیں`,
    az:`{s} san sonra atla`, tr:`{s} saniye sonra atla`, ru:`Пропустить через {s} сек`,
    en:`Skip ad in {s}s`, id:`Lewati iklan dalam {s} dtk`,
  };

  overlay.innerHTML = `
    <div style="
      background:linear-gradient(135deg,#1a0a2e,#0d1f2d);
      border:1px solid rgba(255,255,255,0.1);
      border-radius:20px;max-width:420px;width:100%;
      padding:32px;text-align:center;
    ">
      <div style="font-size:48px;margin-bottom:16px">📺</div>
      <div style="color:white;font-size:18px;font-weight:700;margin-bottom:8px">
        ${{fa:'تبلیغ حمایتی',ar:'إعلان داعم',ur:'حمایتی اشتہار',az:'Dəstək reklamı',tr:'Destek reklamı',ru:'Реклама поддержки',en:'Sponsored Ad',id:'Iklan Sponsor'}[lang]??'Sponsored Ad'}
      </div>
      <div style="color:rgba(255,255,255,0.6);font-size:14px;margin-bottom:24px">
        ${{fa:'با تماشای این تبلیغ به ما کمک می‌کنید و ۳۰ دقیقه دسترسی رایگان دریافت می‌کنید',ar:'بمشاهدة هذا الإعلان تساعدنا وتحصل على 30 دقيقة وصول مجاني',ur:'یہ اشتہار دیکھ کر ہماری مدد کریں اور ۳۰ منٹ مفت رسائی پائیں',az:'Bu reklamı izləyərək bizə kömək edin və 30 dəqiqə pulsuz giriş alın',tr:'Bu reklamı izleyerek bize yardım edin ve 30 dakika ücretsiz erişim kazanın',ru:'Посмотрите рекламу, помогите нам и получите 30 минут бесплатного доступа',en:'Watch this ad to support us and get 30 minutes of free access',id:'Tonton iklan ini untuk mendukung kami dan dapatkan 30 menit akses gratis'}[lang]??'Watch this ad to support us and get 30 minutes free access'}
      </div>
      <div style="
        background:rgba(42,157,143,0.15);border:1px solid rgba(42,157,143,0.3);
        border-radius:12px;padding:20px;margin-bottom:24px;
        color:rgba(255,255,255,0.4);font-size:12px;
      ">
        [ ${{fa:'فضای تبلیغ',en:'Ad Space',ar:'مساحة الإعلان',ur:'اشتہار کی جگہ',az:'Reklam sahəsi',tr:'Reklam alanı',ru:'Рекламное место',id:'Ruang Iklan'}[lang]??'Ad Space'} — AdMob / Google Ads ]
      </div>
      <div id="ad-skip-btn" style="
        display:inline-block;
        background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.2);
        border-radius:8px;padding:10px 24px;
        color:rgba(255,255,255,0.5);font-size:14px;cursor:not-allowed;
        transition:all 0.3s;
      " aria-live="polite">
        ${(skipTexts[lang]??skipTexts['en']).replace('{s}', countdown)}
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  const interval = setInterval(() => {
    countdown--;
    const btn = document.getElementById('ad-skip-btn');
    if (btn) {
      if (countdown <= 0) {
        clearInterval(interval);
        btn.textContent = ({fa:'دریافت دسترسی ✓',ar:'احصل على الوصول ✓',ur:'رسائی حاصل کریں ✓',az:'Girişi al ✓',tr:'Erişimi al ✓',ru:'Получить доступ ✓',en:'Get Access ✓',id:'Dapatkan Akses ✓'})[lang] ?? 'Get Access ✓';
        btn.style.background = 'var(--color-primary-500,#2a9d8f)';
        btn.style.color = 'white';
        btn.style.cursor = 'pointer';
        btn.style.borderColor = 'transparent';
        btn.onclick = () => {
          document.body.removeChild(overlay);
          onComplete();
        };
      } else {
        btn.textContent = (skipTexts[lang]??skipTexts['en']).replace('{s}', countdown);
      }
    }
  }, 1000);

  /* دکمه بستن زودهنگام (قبل از اتمام — بدون پاداش) */
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      clearInterval(interval);
      document.body.removeChild(overlay);
      onDismiss?.();
    }
  });
}

/* ────────────────────────────────────────────────────────────
   5. USER ACCESS CHECKER
   دانشگاه قرآن کاملاً رایگان است — همه کاربران دسترسی کامل دارند
   ──────────────────────────────────────────────────────────── */
function _userAccess() {
  const user = AuthState.getUser();
  return {
    isLoggedIn:   !!user,
    isPremium:    true,   /* دانشگاه قرآن رایگان — همه دسترسی کامل دارند */
    hasFreeRead:  true,
    freeRemaining:999,
  };
}

/* ────────────────────────────────────────────────────────────
   6. AI TRANSLATION ENGINE
   ──────────────────────────────────────────────────────────── */

/*
  استراتژی انتخاب AI برای هر زبان:
  ─────────────────────────────────
  فارسی  (fa): Claude API — بهترین برای فارسی محاوره‌ای
  عربی   (ar): Claude API — درک عمیق متون دینی
  اردو   (ur): Claude API — مناسب با فرهنگ اسلامی پاکستان
  آذری   (az): Claude API — fallback GPT-4
  ترکی   (tr): Claude API — درک فرهنگ اسلامی ترکی
  روسی   (ru): Claude API — روسی ادبی و روان
  انگلیسی(en): Claude API — انگلیسی رسمی و دینی
*/

const AI_CACHE = new Map();

/* ────────────────────────────────────────────────────────────
   6b. VIDEO DUBBING ENGINE
   وضعیت: آماده برای اتصال به ElevenLabs + Whisper
   جریان کار:
     ۱. ویدیو اصلی (فارسی) آپلود می‌شود توسط ادمین
     ۲. Whisper صدا را به متن تبدیل می‌کند (transcribe)
     ۳. Claude API متن را به ۸ زبان ترجمه می‌کند
     ۴. ElevenLabs با صدای کلون‌شده استاد TTS می‌سازد
     ۵. ffmpeg صدا را با ویدیو ادغام می‌کند
     ۶. URL نسخه دوبله شده در dubbedVideoUrls ذخیره می‌شود
   ──────────────────────────────────────────────────────────── */

const DUBBING_LANGS = ['ar', 'ur', 'az', 'tr', 'ru', 'en', 'id'];

/**
 * درخواست دوبله ویدیو — در production به backend ارسال می‌شود
 * @param {string} videoUrl - URL ویدیو اصلی فارسی
 * @param {string} ayahId   - شناسه آیه
 * @returns {Promise<Object>} - { ar: url, ur: url, ... }
 */
export async function requestVideoDubbing(videoUrl, ayahId) {
  if (!videoUrl) return {};

  /* TODO: در production این endpoint را فعال کنید
  const res = await fetch('/api/quran/dub-video', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      videoUrl,
      ayahId,
      langs: DUBBING_LANGS,
      voiceCloneId: 'YOUR_ELEVENLABS_VOICE_ID',  // صدای کلون‌شده استاد
      whisperModel: 'whisper-1',
    }),
  });
  const data = await res.json();
  return data.dubbedUrls; // { ar: '...', ur: '...', ... }
  */

  /* شبیه‌سازی — در production حذف می‌شود */
  console.log(`[VideoDubbing] درخواست دوبله برای آیه ${ayahId} ارسال شد`);
  return {};
}

/**
 * استخراج صوت از ویدیو — در production به backend ارسال می‌شود
 * @param {string} videoUrl
 * @param {string} ayahId
 * @returns {Promise<string>} - URL فایل صوتی
 */
export async function extractAudioFromVideo(videoUrl, ayahId) {
  if (!videoUrl) return '';

  /* TODO: در production فعال کنید
  const res = await fetch('/api/quran/extract-audio', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ videoUrl, ayahId }),
  });
  const data = await res.json();
  return data.audioUrl;
  */

  console.log(`[ExtractAudio] استخراج صوت از ویدیو آیه ${ayahId}`);
  return '';
}

/* ────────────────────────────────────────────────────────────
   6c. MEDIA SESSION — پخش پس‌زمینه (صفحه خاموش)
   از Media Session API برای جلوگیری از قطع صدا استفاده می‌شود
   ──────────────────────────────────────────────────────────── */
function _setupMediaSession(title, author, avatarUrl = '') {
  if (!('mediaSession' in navigator)) return;
  navigator.mediaSession.metadata = new MediaMetadata({
    title,
    artist: author,
    album: 'دانشگاه قرآن — MediaHub کربلا',
    artwork: avatarUrl ? [{ src: avatarUrl, sizes: '512x512', type: 'image/png' }] : [],
  });
}

/**
 * رندر ویدیو پلیر با دوبله و کنترل سرعت
 * @param {Object} ayah
 * @returns {string} HTML
 */
function renderVideoPlayer(ayah) {
  const lang = i18n.lang;
  if (!ayah.videoUrl) return '';

  /* بررسی دسترسی کاربر به فیلم */
  const access = MediaAccess.check();

  /* اگر دسترسی ندارد — نمایش قفل با گزینه تبلیغ */
  if (!access.allowed) {
    const adminMsg = (() => {
      try {
        const cfg = JSON.parse(localStorage.getItem('mh_quran_config') || '{}');
        return cfg.mediaLimitMsg ?? null;
      } catch { return null; }
    })();

    const limitMsg = adminMsg ?? {
      fa:'سهمیه رایگان شما به پایان رسید. برای دسترسی به ویدیو و صوت استاد، یک تبلیغ کوتاه تماشا کنید یا اشتراک تهیه کنید.',
      ar:'انتهت حصتك المجانية. لمشاهدة فيديو وصوت الأستاذ، شاهد إعلاناً قصيراً أو اشترك.',
      ur:'آپ کی مفت حد ختم ہوگئی۔ استاد کی ویڈیو اور آواز کے لیے ایک مختصر اشتہار دیکھیں یا سبسکرائب کریں۔',
      az:'Pulsuz limitiniz bitmişdir. Müəllim videosuna və səsinə daxil olmaq üçün qısa bir reklam izləyin.',
      tr:'Ücretsiz limitiniz doldu. Hoca videosuna ve sesine erişmek için kısa bir reklam izleyin veya abone olun.',
      ru:'Ваш бесплатный лимит исчерпан. Чтобы получить доступ к видео и аудио устаза, посмотрите короткую рекламу или оформите подписку.',
      en:"Your free limit has ended. To access the Sheikh's video and audio, watch a short ad or subscribe.",
      id:'Batas gratis Anda telah habis. Untuk mengakses video dan audio ustaz, tonton iklan singkat atau berlangganan.',
    };
    const msgText = typeof limitMsg === 'object' ? (limitMsg[lang] ?? limitMsg['fa']) : limitMsg;

    const canWatch = access.type === 'canWatch';
    return `
      <div class="ayah-card__video-locked" style="
        margin-top:var(--space-4);
        border:1px solid rgba(42,157,143,0.2);
        border-radius:var(--radius-lg);
        overflow:hidden;
        background:linear-gradient(135deg,rgba(42,157,143,0.06),rgba(42,157,143,0.02));
        padding:var(--space-6);
        text-align:center;
      ">
        <div style="font-size:36px;margin-bottom:var(--space-3)" aria-hidden="true">🎬</div>
        <p style="font-size:var(--text-sm);color:var(--text-secondary);margin-bottom:var(--space-4);line-height:1.7">${msgText}</p>
        ${canWatch ? `
          <button class="btn btn--primary watch-ad-for-video-btn" data-ayah-id="${ayah.id}" style="margin-inline-end:var(--space-2)">
            📺 ${tx(QC.watchAdBtn)}
            <span style="font-size:var(--text-xs);opacity:0.8;margin-inline-start:6px">(${access.adsLeft} ${tx({fa:'باقی',ar:'متبقٍ',ur:'باقی',az:'qaldı',tr:'kaldı',ru:'осталось',en:'left',id:'tersisa'})})</span>
          </button>
        ` : `
          <div style="font-size:var(--text-sm);color:var(--color-warning-600,#d97706)">
            ⏳ ${tx(QC.adDailyLimit)}
          </div>
        `}
      </div>
    `;
  }

  /* انتخاب URL ویدیو: دوبله شده یا اصلی */
  const videoSrc = (lang !== 'fa' && ayah.dubbedVideoUrls?.[lang])
    ? ayah.dubbedVideoUrls[lang]
    : ayah.videoUrl;

  const isDubbed  = lang !== 'fa' && !!ayah.dubbedVideoUrls?.[lang];
  const isPending = lang !== 'fa' && !ayah.dubbedVideoUrls?.[lang] && !!ayah.videoUrl;

  /* نمایش تایمر دسترسی تبلیغ */
  const adTimer = access.type === 'ad' ? `
    <div style="font-size:var(--text-xs);color:var(--color-primary-500);margin-bottom:var(--space-2);text-align:center">
      ⏱ ${tx(QC.adTimerLabel, { m: access.minsLeft })}
    </div>
  ` : '';

  return `
    <div class="ayah-card__video" style="
      margin-top:var(--space-4);
      border:1px solid rgba(42,157,143,0.2);
      border-radius:var(--radius-lg);
      overflow:hidden;
      background:var(--color-neutral-950,#050505);
    ">
      ${adTimer}
      <!-- عنوان ویدیو -->
      <div style="
        padding:var(--space-3) var(--space-5);
        background:linear-gradient(135deg,rgba(42,157,143,0.12),rgba(42,157,143,0.04));
        display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:var(--space-2);
      ">
        <div style="font-size:var(--text-xs);color:var(--color-primary-600);font-weight:600;display:flex;align-items:center;gap:6px">
          <span>🎬</span>
          ${tx(QC.videoLabel)}
        </div>
        <div style="display:flex;align-items:center;gap:var(--space-2);flex-wrap:wrap">
          ${isDubbed ? `<span class="ai-badge"><span class="ai-badge__dot"></span>${tx(QC.dubbing)}</span>` : ''}
          ${isPending ? `<span style="font-size:var(--text-xs);color:var(--color-warning-500,#f59e0b);display:flex;align-items:center;gap:4px">
            <span style="width:6px;height:6px;border-radius:50%;background:currentColor;animation:pulse 1.5s infinite"></span>
            ${tx(QC.dubbingPending)}
          </span>` : ''}
        </div>
      </div>

      <!-- ویدیو -->
      <div style="position:relative">
        <video
          id="quran-video-${ayah.id}"
          src="${videoSrc}"
          style="width:100%;max-height:400px;display:block;background:#000"
          preload="metadata"
          playsinline
          webkit-playsinline
          aria-label="${tx(QC.videoLabel)} — ${ayah.surahName} آیه ${ayah.ayahNum}"
        ></video>

        <!-- کنترل‌های سفارشی -->
        <div class="quran-video-controls" id="quran-video-ctrl-${ayah.id}" style="
          position:absolute;bottom:0;left:0;right:0;
          padding:var(--space-2) var(--space-3);
          background:linear-gradient(transparent,rgba(0,0,0,0.75));
          display:flex;align-items:center;gap:var(--space-3);flex-wrap:wrap;
        ">
          <!-- دکمه پخش/توقف -->
          <button class="qv-play-btn" data-vid="${ayah.id}" style="
            background:none;border:none;color:white;cursor:pointer;
            font-size:22px;line-height:1;padding:0;flex-shrink:0;
          " aria-label="پخش/توقف">▶</button>

          <!-- نوار پیشرفت -->
          <div style="flex:1;min-width:80px">
            <input type="range" class="qv-progress" data-vid="${ayah.id}"
              min="0" max="100" value="0" step="0.1"
              style="width:100%;accent-color:var(--color-primary-500);cursor:pointer"
              aria-label="پیشرفت ویدیو"
            />
          </div>

          <!-- زمان -->
          <span class="qv-time" data-vid="${ayah.id}" style="
            font-size:var(--text-xs);color:rgba(255,255,255,0.8);white-space:nowrap;min-width:70px;text-align:center;
          ">0:00 / 0:00</span>

          <!-- کنترل سرعت -->
          <div style="display:flex;align-items:center;gap:4px">
            <span style="font-size:var(--text-xs);color:rgba(255,255,255,0.6)">${tx(QC.speedLabel)}:</span>
            ${['1', '1.5', '2'].map(s => `
              <button class="qv-speed-btn ${s === '1' ? 'qv-speed-btn--active' : ''}" data-vid="${ayah.id}" data-speed="${s}" style="
                background:${s === '1' ? 'var(--color-primary-500)' : 'rgba(255,255,255,0.15)'};
                border:none;color:white;border-radius:4px;
                padding:2px 6px;font-size:var(--text-xs);cursor:pointer;transition:background 0.2s;
              " aria-label="سرعت ${s}x">${s}x</button>
            `).join('')}
          </div>

          <!-- تمام‌صفحه -->
          <button class="qv-fullscreen-btn" data-vid="${ayah.id}" style="
            background:none;border:none;color:white;cursor:pointer;font-size:16px;padding:0;
          " aria-label="تمام‌صفحه">⛶</button>
        </div>
      </div>
    </div>
  `;
}

/**
 * رندر صوت پلیر با کنترل سرعت و background play
 * این تابع audio موجود را جایگزین می‌کند و قابلیت‌های جدید اضافه می‌کند
 */
function renderEnhancedAudioPlayer(ayah) {
  const audioSrc = ayah.audioUrl || ayah.extractedAudioUrl || '';
  if (!audioSrc) return '';

  /* بررسی دسترسی — همان منطق ویدیو */
  const access = MediaAccess.check();
  if (!access.allowed) return ''; /* اگر ویدیو هم قفل است، صوت هم نمایش داده نمی‌شود */

  const isExtracted = !ayah.audioUrl && !!ayah.extractedAudioUrl;

  return `
    <div class="ayah-card__audio" style="
      margin-top:var(--space-4);
      padding:var(--space-4) var(--space-5);
      background:linear-gradient(135deg,rgba(42,157,143,0.08),rgba(42,157,143,0.03));
      border:1px solid rgba(42,157,143,0.2);
      border-radius:var(--radius-lg);
    ">
      <div style="font-size:var(--text-xs);color:var(--color-primary-600);font-weight:600;margin-bottom:var(--space-3);display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:var(--space-2)">
        <span style="display:flex;align-items:center;gap:6px">
          <span>🎤</span>
          ${isExtracted ? tx(QC.extractAudio) : tx({fa:'صوت استاد', ar:'صوت الأستاذ', ur:'استاد کی آواز', az:'Müəllim səsi', tr:'Hoca sesi', ru:'Голос устаза', en:"Sheikh's voice"})}
        </span>
        <span class="qv-bg-status" data-aid="${ayah.id}" style="font-size:var(--text-xs);color:var(--color-neutral-500);display:none;align-items:center;gap:4px">
          <span style="width:6px;height:6px;border-radius:50%;background:var(--color-primary-500);animation:pulse 2s infinite"></span>
          ${tx(QC.bgPlayOn)}
        </span>
      </div>

      <!-- پلیر صوت سفارشی -->
      <audio id="quran-audio-${ayah.id}" src="${audioSrc}" preload="metadata" style="display:none"></audio>

      <div style="display:flex;align-items:center;gap:var(--space-3);flex-wrap:wrap">
        <!-- دکمه پخش/توقف -->
        <button class="qa-play-btn" data-aid="${ayah.id}" style="
          background:var(--color-primary-500);border:none;color:white;
          border-radius:50%;width:40px;height:40px;cursor:pointer;
          font-size:16px;display:flex;align-items:center;justify-content:center;flex-shrink:0;
        " aria-label="پخش/توقف">▶</button>

        <!-- نوار پیشرفت -->
        <div style="flex:1;min-width:80px">
          <input type="range" class="qa-progress" data-aid="${ayah.id}"
            min="0" max="100" value="0" step="0.1"
            style="width:100%;accent-color:var(--color-primary-500);cursor:pointer"
            aria-label="پیشرفت صوت"
          />
        </div>

        <!-- زمان -->
        <span class="qa-time" data-aid="${ayah.id}" style="
          font-size:var(--text-xs);color:var(--color-neutral-500);white-space:nowrap;min-width:70px;text-align:center;
        ">0:00 / 0:00</span>

        <!-- کنترل سرعت -->
        <div style="display:flex;align-items:center;gap:4px">
          <span style="font-size:var(--text-xs);color:var(--color-neutral-500)">${tx(QC.speedLabel)}:</span>
          ${['1', '1.5', '2'].map(s => `
            <button class="qa-speed-btn ${s === '1' ? 'qa-speed-btn--active' : ''}" data-aid="${ayah.id}" data-speed="${s}" style="
              background:${s === '1' ? 'var(--color-primary-100,#d1fae5)' : 'var(--color-neutral-100,#f3f4f6)'};
              color:${s === '1' ? 'var(--color-primary-700,#065f46)' : 'var(--color-neutral-600,#4b5563)'};
              border:none;border-radius:4px;padding:2px 6px;
              font-size:var(--text-xs);cursor:pointer;transition:background 0.2s;
            " aria-label="سرعت ${s}x">${s}x</button>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

export async function translateText(text, targetLang, context = 'general') {
  if (!text || targetLang === 'fa') return text;

  const cacheKey = `${targetLang}:${context}:${text.slice(0, 50)}`;
  if (AI_CACHE.has(cacheKey)) return AI_CACHE.get(cacheKey);

  /* دستورالعمل ترجمه بر اساس زبان */
  const langInstructions = {
    ar: 'ترجم إلى العربية الفصحى المناسبة للمحتوى الديني الإسلامي. حافظ على الأسلوب الرصين والعمق المعنوي.',
    ur: 'اردو میں ترجمہ کریں جو پاکستانی اسلامی ثقافت سے مناسب ہو۔ روانی اور وضاحت کا خیال رکھیں۔',
    az: 'Azərbaycan dilinə çevirin. İslami mədəniyyəti nəzərə alın.',
    tr: 'Türkçeye çevirin. İslami kültüre uygun, akıcı ve anlaşılır olsun.',
    ru: 'Переведите на русский язык. Используйте литературный стиль, подходящий для исламского религиозного контента.',
    en: 'Translate to English. Use formal, respectful language appropriate for Islamic religious content.',
  };

  const systemPrompt = `You are an expert translator specializing in Islamic religious texts. ${langInstructions[targetLang] || ''}
Rules:
- Preserve the spiritual and religious meaning
- Use culturally appropriate expressions for the target language
- Keep Quranic terms in their original Arabic form when appropriate (Allah, Quran, etc.)
- Be accurate and faithful to the original Persian text
- Return ONLY the translated text, no explanations`;

  try {
    /* در production این Claude API call خواهد بود */
    /* فعلاً شبیه‌سازی */
    await new Promise(r => setTimeout(r, 600 + Math.random() * 400));

    /* شبیه‌سازی ترجمه */
    const simulated = _simulateTranslation(text, targetLang);
    AI_CACHE.set(cacheKey, simulated);
    return simulated;

    /* کد واقعی API (در production فعال می‌شود):
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: systemPrompt,
        messages: [{ role: 'user', content: `Translate this Persian text to ${targetLang}:\n\n${text}` }],
      }),
    });
    const data = await response.json();
    const translated = data.content?.[0]?.text || text;
    AI_CACHE.set(cacheKey, translated);
    return translated;
    */
  } catch (err) {
    console.warn('[AI Translation] Failed:', err);
    return text;
  }
}

/* شبیه‌سازی ترجمه برای demo */
function _simulateTranslation(text, lang) {
  const prefixes = {
    ar: '[ترجمة: ] ',
    ur: '[ترجمہ: ] ',
    az: '[Tərcümə: ] ',
    tr: '[Çeviri: ] ',
    ru: '[Перевод: ] ',
    en: '[Translation: ] ',
  };
  return (prefixes[lang] || '') + text;
}

/* ────────────────────────────────────────────────────────────
   7. AYAH CARD RENDERER
   ──────────────────────────────────────────────────────────── */
async function renderAyahCard(ayah, container) {
  const access = _userAccess();
  const lang   = i18n.lang;

  /* ترجمه summary */
  let summaryText = ayah.summary[lang] || ayah.summary['fa'];
  if (!ayah.summary[lang] && lang !== 'fa') {
    summaryText = tx(QC.translating);
    /* بعد از رندر ترجمه */
    setTimeout(async () => {
      const el = container?.querySelector(`[data-summary="${ayah.id}"]`);
      if (el) {
        const translated = await translateText(ayah.summary['fa'], lang, 'quran-summary');
        el.innerHTML = translated;
        el.nextElementSibling?.remove(); /* حذف ai badge قدیمی */
        el.insertAdjacentHTML('afterend', `<span class="ai-badge" style="margin-top:var(--space-2);display:inline-flex"><span class="ai-badge__dot"></span>${tx(QC.translatedBy)}</span>`);
      }
    }, 100);
  }

  /* تدبر */
  let tadabburHTML = '';

  if (access.isPremium || (access.isLoggedIn && access.hasFreeRead)) {
    /* کاربر دسترسی دارد */
    let tadabburText = ayah.tadabbur[lang] || ayah.tadabbur['fa'];

    /* اگر ترجمه لازم است */
    const needsTranslation = !ayah.tadabbur[lang] && lang !== 'fa';

    tadabburHTML = `
      <div class="ayah-card__tadabbur">
        <div class="tadabbur-header">
          <div class="tadabbur-header__title">
            ✨ ${tx(QC.tadabburLabel)}
          </div>
          <div style="display:flex;gap:var(--space-2);align-items:center;flex-wrap:wrap">
            ${needsTranslation ? `<span class="ai-badge"><span class="ai-badge__dot"></span>AI</span>` : ''}
          </div>
        </div>
        <div class="tadabbur-content">
          ${needsTranslation
            ? `<div class="translation-loading">
                <div class="translation-loading__dots">
                  <div class="translation-loading__dot"></div>
                  <div class="translation-loading__dot"></div>
                  <div class="translation-loading__dot"></div>
                </div>
                ${tx(QC.translating)}
              </div>`
            : `<div class="tadabbur-text" data-tadabbur="${ayah.id}">${tadabburText.replace(/\n\n/g, '</p><p style="margin-top:var(--space-4)">').replace(/^/, '<p>').replace(/$/, '</p>')}</div>`
          }
          <div class="tadabbur-author">
            <div class="tadabbur-author__avatar" aria-hidden="true">${ayah.authorAvatar}</div>
            <div>
              <div class="tadabbur-author__name">${ayah.author}</div>
              <div class="tadabbur-author__date">${timeAgo(ayah.date)}</div>
            </div>
          </div>
        </div>
      </div>
    `;

    /* اگر ترجمه لازم است، async ترجمه کن */
    if (needsTranslation) {
      setTimeout(async () => {
        const el = container?.querySelector(`[data-tadabbur="${ayah.id}"]`);
        if (el) {
          const translated = await translateText(ayah.tadabbur['fa'], lang, 'quran-tadabbur');
          el.innerHTML = translated.replace(/\n\n/g, '</p><p style="margin-top:var(--space-4)">').replace(/^/, '<p>').replace(/$/, '</p>');
          el.previousElementSibling?.remove(); /* حذف loading */
        }
      }, 100);
    }

    /* دانشگاه قرآن رایگان است — نیازی به ثبت مصرف نیست */

  } else {
    /* کاربر دسترسی ندارد */
    const previewText = ayah.tadabbur['fa'].slice(0, 120) + '...';
    const isLoggedIn  = access.isLoggedIn;

    tadabburHTML = `
      <div class="ayah-card__tadabbur">
        <div class="tadabbur-header">
          <div class="tadabbur-header__title">✨ ${tx(QC.tadabburLabel)}</div>
          <span class="tadabbur-header__badge">🔒 ${tx(QC.memberOnly)}</span>
        </div>
        <div class="tadabbur-lock">
          <div class="tadabbur-lock__preview" aria-hidden="true">${previewText}</div>
          <div class="tadabbur-lock__overlay">
            <span class="tadabbur-lock__icon" aria-hidden="true">🔒</span>
            <h4 class="tadabbur-lock__title">${tx(QC.lockTitle)}</h4>
            <p class="tadabbur-lock__desc">${tx(QC.lockDesc)}</p>
            ${isLoggedIn && !access.hasFreeRead
              ? `<span class="free-reads-badge">
                  <span class="free-reads-badge__count">0</span>
                  ${tx(QC.freeReadsLeft)}
                </span>`
              : `<span class="free-reads-badge">
                  <span class="free-reads-badge__count">${FREE_READS_MAX}</span>
                  ${tx(QC.freeReadsLeft)}
                </span>`
            }
            <div style="display:flex;gap:var(--space-3);flex-wrap:wrap;justify-content:center">
              <button class="btn btn--outline btn--sm quran-subscribe-btn" style="color:white;border-color:rgba(255,255,255,0.5)">
                ${isLoggedIn ? tx(QC.subscribeBtn) : tx({ fa:'ورود / ثبت‌نام', ar:'دخول / تسجيل', ur:'لاگ ان / رجسٹر', en:'Login / Register', tr:'Giriş / Kayıt', ru:'Войти / Регистрация', az:'Daxil ol / Qeydiyyat' })}
              </button>
              ${isLoggedIn && access.hasFreeRead
                ? `<button class="btn btn--primary btn--sm unlock-btn" data-ayah-id="${ayah.id}">
                    📖 ${tx(QC.readFreeBtn, { n: access.freeRemaining })}
                  </button>`
                : ''
              }
            </div>
          </div>
        </div>
      </div>
    `;
  }

  return `
    <article class="ayah-card" id="ayah-${ayah.id}" aria-label="آیه ${ayah.ayahNum} — ${ayah.surahName}">

      <!-- Header -->
      <div class="ayah-card__header">
        <div class="ayah-card__ref">
          <div class="ayah-num" aria-label="شماره آیه ${ayah.ayahNum}">
            <div class="ayah-num__ring" aria-hidden="true"></div>
            <span class="ayah-num__text">${ayah.ayahNum}</span>
          </div>
          <div class="ayah-card__surah-info">
            <span class="ayah-card__surah-name">${ayah.surahName}</span>
            <div class="ayah-card__surah-sub">
              <span>${tx(QC.surahs)} ${ayah.surahNum}</span>
              <span aria-hidden="true">·</span>
              <span>${formatNum(ayah.readTime)} ${i18n.t('article.readTime')}</span>
              <span aria-hidden="true">·</span>
              <span class="ai-badge"><span class="ai-badge__dot"></span>AI</span>
            </div>
          </div>
        </div>
        <div class="ayah-card__actions">
          <button class="btn btn--icon btn--ghost bookmark-ayah-btn"
            data-ayah-id="${ayah.id}"
            aria-label="ذخیره آیه"
            data-tooltip="ذخیره">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path d="m19 21-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>
            </svg>
          </button>
          <button class="btn btn--icon btn--ghost share-ayah-btn"
            data-ayah-id="${ayah.id}"
            aria-label="اشتراک‌گذاری"
            data-tooltip="اشتراک">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- متن عربی -->
      <div class="ayah-card__arabic" lang="ar" dir="rtl">
        <div class="ayah-arabic-frame">
          <p class="ayah-arabic-text" aria-label="متن آیه به عربی">${ayah.arabic}</p>
        </div>
      </div>

      <!-- توضیح اجمالی -->
      <div class="ayah-card__summary">
        <div class="ayah-summary-label">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
            <circle cx="12" cy="12" r="10"/><path d="M12 16v-4m0-4h.01"/>
          </svg>
          ${tx(QC.summaryLabel)}
        </div>
        <p class="ayah-summary-text" data-summary="${ayah.id}">${summaryText}</p>
      </div>

      <!-- تدبر -->
      ${tadabburHTML}

      <!-- ویدیو استاد -->
      ${renderVideoPlayer(ayah)}

      <!-- صوت استاد (مستقیم یا استخراج‌شده از ویدیو) -->
      ${renderEnhancedAudioPlayer(ayah)}

    </article>
  `;
}

/* ────────────────────────────────────────────────────────────
   8. SURAH INDEX RENDERER
   ──────────────────────────────────────────────────────────── */
function renderSurahIndex() {
  return `
    <div class="surah-index-grid" role="list" aria-label="${tx(QC.pageTitle)}">
      ${SURAHS.map(s => {
        const pct = Math.round((s.tadabburCount / s.ayahs) * 100);
        const circumference = 2 * Math.PI * 14;
        const offset = circumference - (pct / 100) * circumference;
        return `
          <a class="surah-index-card" href="?surah=${s.num}" role="listitem" aria-label="${s.name}">
            <div class="surah-index-card__num" aria-hidden="true" lang="ar">${s.num}</div>
            <div class="surah-index-card__info">
              <span class="surah-index-card__name" lang="ar">${s.name}</span>
              <span class="surah-index-card__count">
                ${s.tadabburCount} / ${s.ayahs} ${tx(QC.ayahsCount)}
              </span>
            </div>
            <div class="surah-index-card__progress" aria-label="${pct}% تدبر شده">
              <div class="progress-ring" aria-hidden="true">
                <svg width="36" height="36" viewBox="0 0 36 36">
                  <circle class="progress-ring__bg" cx="18" cy="18" r="14" stroke-width="2.5"/>
                  <circle class="progress-ring__fill" cx="18" cy="18" r="14" stroke-width="2.5"
                    stroke-dasharray="${circumference}" stroke-dashoffset="${offset}"/>
                </svg>
                <div class="progress-ring__text">${pct}%</div>
              </div>
            </div>
          </a>
        `;
      }).join('')}
    </div>
  `;
}

/* ────────────────────────────────────────────────────────────
   9. MEMBERSHIP BANNER RENDERER
   ──────────────────────────────────────────────────────────── */
function renderMembershipBanner() {
  /* نرخ لحظه‌ای از کش */
  const liveRates = (() => { try { const c = JSON.parse(localStorage.getItem('mh_rates_cache')||'null'); return c?.rates ?? null; } catch { return null; } })();
  /* ارز کاربر از تابع مرکزی — اولویت: IP → زبان دستی → زبان فعلی */
  const cur = getUserCurrency();

  function _fmt(usd) {
    if (cur.k === 'USD') return `$${usd}`;
    if (liveRates) {
      if (cur.k === 'IRR') { const t = Math.round(usd * (liveRates['IRR'] ?? 62000) / 10); return `$${usd} <span style="font-size:0.75em;opacity:0.7">(${t.toLocaleString()} تومان)</span>`; }
      const rate = liveRates[cur.k]; if (rate) return `$${usd} <span style="font-size:0.75em;opacity:0.7">(${Math.round(usd*rate).toLocaleString()} ${cur.s})</span>`;
    }
    return `$${usd}`;
  }

  const plans = [
    {
      period: { fa:'ماهیانه', ar:'شهري', ur:'ماہانہ', en:'Monthly', tr:'Aylık', ru:'Ежемесячно', az:'Aylıq' },
      usd: 5,
      note:   { fa:'پرداخت ماهیانه', ar:'دفع شهري', ur:'ماہانہ ادائیگی', en:'Monthly billing', tr:'Aylık ödeme', ru:'Ежемесячная оплата', az:'Aylıq ödəniş' },
    },
    {
      period: { fa:'سالیانه', ar:'سنوي', ur:'سالانہ', en:'Yearly', tr:'Yıllık', ru:'Ежегодно', az:'İllik' },
      usd: 48,
      note:   { fa:'۲ ماه رایگان', ar:'شهران مجاناً', ur:'2 ماہ مفت', en:'2 months free', tr:'2 ay ücretsiz', ru:'2 месяца бесплатно', az:'2 ay pulsuz' },
      featured: true,
    },
  ];

  return `
    <div class="membership-banner">
      <div class="membership-banner__content">
        <span class="membership-banner__icon" aria-hidden="true">⭐</span>
        <h2 class="membership-banner__title">${tx(QC.subscribeBtn)}</h2>
        <p class="membership-banner__desc">${tx(QC.lockDesc)}</p>
        <div class="membership-plans">
          ${plans.map(p => `
            <div class="membership-plan ${p.featured ? 'membership-plan--featured' : ''}">
              <div class="membership-plan__period">${tx(p.period)}</div>
              <span class="membership-plan__price">${_fmt(p.usd)}</span>
              <div class="membership-plan__note">${tx(p.note)}</div>
            </div>
          `).join('')}
        </div>
        <button id="quran-subscribe-btn" class="btn btn--lg" style="background:var(--color-secondary-500);color:white;font-size:var(--text-md)">
          ${tx(QC.subscribeBtn)} ←
        </button>
      </div>
    </div>
  `;
}

/* ────────────────────────────────────────────────────────────
   10. MAIN PAGE RENDERER
   ──────────────────────────────────────────────────────────── */
export async function renderQuranPage(container) {
  if (!container) return;

  const urlParams  = new URLSearchParams(window.location.search);
  const activeSurah = parseInt(urlParams.get('surah') || '0');

  /* ترکیب داده‌های ثابت + داده‌های ادمین */
  const allAyahs = _getMergedAyahs();

  /* فیلتر آیات */
  const filteredAyahs = activeSurah
    ? allAyahs.filter(a => a.surahNum === activeSurah)
    : allAyahs;

  container.innerHTML = `

    <!-- Hero -->
    <div class="quran-hero" role="banner">
      <div class="quran-hero__pattern" aria-hidden="true"></div>
      <div class="container quran-hero__inner">
        <span class="quran-hero__bismillah" lang="ar" dir="rtl" aria-label="بسم الله الرحمن الرحیم">
          بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
        </span>
        <h1 class="quran-hero__title">${tx(QC.pageTitle)}</h1>
        <p class="quran-hero__desc">${tx(QC.pageDesc)}</p>
        <div style="margin-top:var(--space-6);background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);border-radius:var(--radius-xl);padding:var(--space-5) var(--space-7);display:inline-flex;align-items:center;gap:var(--space-4);flex-wrap:wrap;justify-content:center;">
          <span style="font-size:28px" aria-hidden="true">🌍</span>
          <div style="color:white;font-size:var(--text-base);line-height:1.7">
            ${(() => {
              const users = Math.floor(Math.random() * 40) + 60;
              const countries = Math.floor(Math.random() * 8) + 12;
              const lang = i18n.lang;
              if (lang === 'fa') return 'الان ' + users + ' نفر از ' + countries + ' کشور در کلاس دانشگاه قرآن حضور دارند و در حال تدبر در آیات قرآن هستند';
              if (lang === 'ar') return 'الآن ' + users + ' شخصًا من ' + countries + ' دولة يتدبرون آيات القرآن';
              if (lang === 'ur') return 'ابھی ' + users + ' افراد ' + countries + ' ممالک سے قرآن میں تدبر کر رہے ہیں';
              if (lang === 'az') return 'Hal-hazırda ' + countries + ' ölkədən ' + users + ' nəfər Quran Universitetindədir';
              if (lang === 'tr') return 'Su an ' + countries + ' ulkeden ' + users + ' kisi Kuran Universitesinde';
              if (lang === 'ru') return 'Сейчас ' + users + ' человек из ' + countries + ' стран в Университете Корана';
              if (lang === 'id') return 'Saat ini ' + users + ' orang dari ' + countries + ' negara di Universitas Quran';
              return 'Right now ' + users + ' people from ' + countries + ' countries are in the Quran University';
            })()}
          </div>
        </div>
      </div>
    </div>

    <!-- Surah Filter -->
    <div class="surah-filter" role="navigation" aria-label="فیلتر سوره">
      <div class="container">
        <div class="surah-filter__inner">
          <button class="surah-chip ${!activeSurah ? 'surah-chip--active' : ''}" data-surah="0">
            ${tx(QC.allSurahs)}
          </button>
          ${SURAHS.filter(s => s.tadabburCount > 0).map(s => `
            <button class="surah-chip ${activeSurah === s.num ? 'surah-chip--active' : ''}" data-surah="${s.num}">
              <span class="surah-chip__num">${s.num}</span>
              <span lang="ar">${s.name}</span>
            </button>
          `).join('')}
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="section">
      <div class="container">
        <div class="layout-article">

          <!-- آیات -->
          <div>
            <div id="ayahs-container" aria-label="آیات و تدبرات" aria-live="polite">
              <div class="skeleton skeleton--image" style="height:300px;border-radius:var(--radius-xl);margin-bottom:var(--space-6)"></div>
              <div class="skeleton skeleton--image" style="height:280px;border-radius:var(--radius-xl)"></div>
            </div>
          </div>

          <!-- Sidebar -->
          <aside class="hide-mobile" aria-label="فهرست سوره‌ها">
            <div class="sticky-sidebar">
              <div class="section-header__title" style="margin-bottom:var(--space-4)">
                ${tx(QC.surahs)}
              </div>
              ${renderSurahIndex()}
            </div>
          </aside>

        </div>

        <!-- دانشگاه قرآن رایگان است -->
      </div>
    </div>
  `;

  /* رندر آیات */
  const ayahsContainer = document.getElementById('ayahs-container');
  if (ayahsContainer) {
    if (!filteredAyahs.length) {
      ayahsContainer.innerHTML = `
        <div class="empty-state">
          <span class="empty-state__icon" aria-hidden="true">📖</span>
          <h3 class="empty-state__title">${tx({ fa:'تدبری برای این سوره نوشته نشده', ar:'لم يُكتب تدبر لهذه السورة بعد', ur:'اس سورت کا تدبر ابھی نہیں لکھا گیا', en:'No reflections written for this surah yet', az:'Bu surə üçün tədəbbür yazılmayıb', tr:'Bu sure için tefekkür yazılmamış', ru:'Для этой суры не написано размышления', id:'Belum ada refleksi untuk surah ini'})}</h3>
        </div>
      `;
    } else {
      /* ۱. اول همه HTML ها را آماده کن */
      const cards = await Promise.all(
        filteredAyahs.map(a => renderAyahCard(a, ayahsContainer))
      );
      /* ۲. همه را یکجا inject کن */
      ayahsContainer.innerHTML = cards.join('');

      /* ۳. راه‌اندازی ویدیو پلیرها و صوت پلیرهای سفارشی */
      _initVideoPlayers(ayahsContainer, filteredAyahs);
      _initAudioPlayers(ayahsContainer, filteredAyahs);

      /* ۴. حالا ترجمه‌های async را اعمال کن روی DOM واقعی */
      const lang = i18n.lang;
      if (lang !== 'fa') {
        filteredAyahs.forEach(ayah => {
          /* summary */
          if (!ayah.summary[lang]) {
            const summEl = ayahsContainer.querySelector(`[data-summary="${ayah.id}"]`);
            if (summEl) {
              summEl.textContent = tx(QC.translating);
              translateText(ayah.summary['fa'], lang, 'quran-summary').then(t => {
                if (summEl.isConnected) summEl.innerHTML = t;
              });
            }
          }
          /* tadabbur */
          if (!ayah.tadabbur[lang]) {
            const tadEl = ayahsContainer.querySelector(`[data-tadabbur="${ayah.id}"]`);
            if (tadEl) {
              translateText(ayah.tadabbur['fa'], lang, 'quran-tadabbur').then(t => {
                if (tadEl.isConnected) {
                  tadEl.innerHTML = t.replace(/\n\n/g,'</p><p style="margin-top:var(--space-4)">').replace(/^/,'<p>').replace(/$/,'</p>');
                  tadEl.previousElementSibling?.classList.contains('translation-loading') && tadEl.previousElementSibling.remove();
                }
              });
            }
          }
        });
      }
    }
  }

  /* Events */
  _bindQuranEvents(container);

  /* Language change */
  i18n.onChange(() => renderQuranPage(container));
}

/* ────────────────────────────────────────────────────────────
   10b. VIDEO & AUDIO PLAYER INITIALIZERS
   ──────────────────────────────────────────────────────────── */

function _formatTime(sec) {
  if (isNaN(sec)) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

/** راه‌اندازی همه ویدیو پلیرهای سفارشی */
function _initVideoPlayers(container, ayahs) {
  ayahs.filter(a => a.videoUrl || (a.dubbedVideoUrls && Object.values(a.dubbedVideoUrls).some(Boolean))).forEach(ayah => {
    const vid = container.querySelector(`#quran-video-${ayah.id}`);
    if (!vid) return;

    const playBtn    = container.querySelector(`.qv-play-btn[data-vid="${ayah.id}"]`);
    const progress   = container.querySelector(`.qv-progress[data-vid="${ayah.id}"]`);
    const timeEl     = container.querySelector(`.qv-time[data-vid="${ayah.id}"]`);
    const fsBtn      = container.querySelector(`.qv-fullscreen-btn[data-vid="${ayah.id}"]`);
    const speedBtns  = container.querySelectorAll(`.qv-speed-btn[data-vid="${ayah.id}"]`);

    /* Media Session برای background play */
    vid.addEventListener('play', () => {
      /* مصرف یک دسترسی رایگان */
      const _acc = MediaAccess.check();
      if (_acc.type === 'free') MediaAccess.useFree();
      _setupMediaSession(
        `${ayah.surahName} — آیه ${ayah.ayahNum}`,
        ayah.author
      );
      navigator.mediaSession && (navigator.mediaSession.playbackState = 'playing');
      if (playBtn) playBtn.textContent = '⏸';
    });
    vid.addEventListener('pause', () => {
      navigator.mediaSession && (navigator.mediaSession.playbackState = 'paused');
      if (playBtn) playBtn.textContent = '▶';
    });
    vid.addEventListener('ended', () => { if (playBtn) playBtn.textContent = '▶'; });

    /* پیشرفت */
    vid.addEventListener('timeupdate', () => {
      if (!vid.duration) return;
      const pct = (vid.currentTime / vid.duration) * 100;
      if (progress) progress.value = pct;
      if (timeEl) timeEl.textContent = `${_formatTime(vid.currentTime)} / ${_formatTime(vid.duration)}`;
    });

    /* دکمه پخش */
    if (playBtn) playBtn.addEventListener('click', () => {
      vid.paused ? vid.play() : vid.pause();
    });

    /* scrub */
    if (progress) progress.addEventListener('input', () => {
      if (vid.duration) vid.currentTime = (progress.value / 100) * vid.duration;
    });

    /* سرعت */
    speedBtns.forEach(btn => btn.addEventListener('click', () => {
      vid.playbackRate = parseFloat(btn.dataset.speed);
      speedBtns.forEach(b => {
        b.style.background = b === btn ? 'var(--color-primary-500)' : 'rgba(255,255,255,0.15)';
      });
    }));

    /* تمام‌صفحه */
    if (fsBtn) fsBtn.addEventListener('click', () => {
      const wrap = vid.closest('.ayah-card__video');
      if (document.fullscreenElement) document.exitFullscreen();
      else wrap?.requestFullscreen?.();
    });

    /* Media Session action handlers */
    if ('mediaSession' in navigator) {
      navigator.mediaSession.setActionHandler('play',  () => vid.play());
      navigator.mediaSession.setActionHandler('pause', () => vid.pause());
      navigator.mediaSession.setActionHandler('seekbackward', () => { vid.currentTime = Math.max(0, vid.currentTime - 10); });
      navigator.mediaSession.setActionHandler('seekforward',  () => { vid.currentTime = Math.min(vid.duration, vid.currentTime + 10); });
    }
  });
}

/** راه‌اندازی همه صوت پلیرهای سفارشی */
function _initAudioPlayers(container, ayahs) {
  ayahs.filter(a => a.audioUrl || a.extractedAudioUrl).forEach(ayah => {
    const aud      = container.querySelector(`#quran-audio-${ayah.id}`);
    if (!aud) return;

    const playBtn   = container.querySelector(`.qa-play-btn[data-aid="${ayah.id}"]`);
    const progress  = container.querySelector(`.qa-progress[data-aid="${ayah.id}"]`);
    const timeEl    = container.querySelector(`.qa-time[data-aid="${ayah.id}"]`);
    const bgStatus  = container.querySelector(`.qv-bg-status[data-aid="${ayah.id}"]`);
    const speedBtns = container.querySelectorAll(`.qa-speed-btn[data-aid="${ayah.id}"]`);

    /* Media Session */
    aud.addEventListener('play', () => {
      _setupMediaSession(`${ayah.surahName} — آیه ${ayah.ayahNum}`, ayah.author);
      navigator.mediaSession && (navigator.mediaSession.playbackState = 'playing');
      if (playBtn) playBtn.textContent = '⏸';
      if (bgStatus) { bgStatus.style.display = 'flex'; }
    });
    aud.addEventListener('pause', () => {
      navigator.mediaSession && (navigator.mediaSession.playbackState = 'paused');
      if (playBtn) playBtn.textContent = '▶';
      if (bgStatus) bgStatus.style.display = 'none';
    });
    aud.addEventListener('ended', () => {
      if (playBtn) playBtn.textContent = '▶';
      if (bgStatus) bgStatus.style.display = 'none';
    });

    /* پیشرفت */
    aud.addEventListener('timeupdate', () => {
      if (!aud.duration) return;
      const pct = (aud.currentTime / aud.duration) * 100;
      if (progress) progress.value = pct;
      if (timeEl) timeEl.textContent = `${_formatTime(aud.currentTime)} / ${_formatTime(aud.duration)}`;
    });

    /* دکمه پخش */
    if (playBtn) playBtn.addEventListener('click', () => {
      aud.paused ? aud.play() : aud.pause();
    });

    /* scrub */
    if (progress) progress.addEventListener('input', () => {
      if (aud.duration) aud.currentTime = (progress.value / 100) * aud.duration;
    });

    /* سرعت */
    speedBtns.forEach(btn => btn.addEventListener('click', () => {
      aud.playbackRate = parseFloat(btn.dataset.speed);
      speedBtns.forEach(b => {
        const isActive = b === btn;
        b.style.background = isActive ? 'var(--color-primary-100,#d1fae5)' : 'var(--color-neutral-100,#f3f4f6)';
        b.style.color = isActive ? 'var(--color-primary-700,#065f46)' : 'var(--color-neutral-600,#4b5563)';
      });
    }));

    /* Media Session action handlers */
    if ('mediaSession' in navigator) {
      navigator.mediaSession.setActionHandler('play',  () => aud.play());
      navigator.mediaSession.setActionHandler('pause', () => aud.pause());
      navigator.mediaSession.setActionHandler('seekbackward', () => { aud.currentTime = Math.max(0, aud.currentTime - 10); });
      navigator.mediaSession.setActionHandler('seekforward',  () => { aud.currentTime = Math.min(aud.duration, aud.currentTime + 10); });
    }
  });
}

/* ────────────────────────────────────────────────────────────
   11. EVENT BINDINGS
   ──────────────────────────────────────────────────────────── */
function _bindQuranEvents(container) {
  /* دکمه‌های اشتراک — باز کردن سیستم پرداخت */
  function _openPayment() {
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:99999;overflow-y:auto;padding:var(--space-6)';
    const inner = document.createElement('div');
    inner.style.cssText = 'max-width:640px;margin:0 auto;position:relative';
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '✕';
    closeBtn.style.cssText = 'position:absolute;top:-40px;inset-inline-end:0;background:rgba(255,255,255,0.15);border:none;color:white;width:32px;height:32px;border-radius:50%;cursor:pointer;font-size:16px;z-index:1';
    closeBtn.addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
    inner.appendChild(closeBtn);
    overlay.appendChild(inner);
    document.body.appendChild(overlay);
    renderPaymentPage(inner, 5, 'quran-subscription');
  }

  document.getElementById('quran-subscribe-btn')?.addEventListener('click', _openPayment);
  container.querySelectorAll('.quran-subscribe-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const isLoggedIn = AuthState.isLoggedIn();
      if (!isLoggedIn) { window.location.href = '/auth.html'; return; }
      _openPayment();
    });
  });
  /* دکمه تماشای تبلیغ برای دسترسی به ویدیو/صوت */
  container.querySelectorAll('.watch-ad-for-video-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const ayahId = btn.dataset.ayahId;
      _showRewardAd(
        /* onComplete — کاربر تبلیغ را کامل دید */
        () => {
          MediaAccess.grantAdAccess();
          renderQuranPage(container); /* رندر مجدد با دسترسی فعال */
        },
        /* onDismiss — کاربر تبلیغ را نیمه‌کاره بست */
        () => {
          /* هیچ دسترسی داده نمی‌شود */
        }
      );
    });
  });

  /* Surah filter */
  container.querySelectorAll('.surah-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      const surahNum = btn.dataset.surah;
      const url = surahNum === '0'
        ? window.location.pathname
        : `${window.location.pathname}?surah=${surahNum}`;
      window.history.pushState({}, '', url);
      renderQuranPage(container);
    });
  });

  /* Unlock با free read */
  container.querySelectorAll('.unlock-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      renderQuranPage(container);
    });
  });

  /* Bookmark */
  container.querySelectorAll('.bookmark-ayah-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.ayahId;
      try {
        const saved = JSON.parse(localStorage.getItem('saved_ayahs') || '[]');
        const idx   = saved.indexOf(id);
        if (idx === -1) { saved.push(id); btn.style.color = 'var(--color-primary-500)'; }
        else            { saved.splice(idx, 1); btn.style.color = ''; }
        localStorage.setItem('saved_ayahs', JSON.stringify(saved));
      } catch {}
    });
  });

  /* Share */
  container.querySelectorAll('.share-ayah-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id  = btn.dataset.ayahId;
      const url = `${location.origin}/quran.html#ayah-${id}`;
      try {
        if (navigator.share) await navigator.share({ url });
        else await navigator.clipboard.writeText(url);
      } catch {}
    });
  });

  /* Surah index cards */
  container.querySelectorAll('.surah-index-card').forEach(card => {
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        card.click();
      }
    });
  });
}
