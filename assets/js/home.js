/**
 * ============================================================
 * FILE: home.js
 * ROLE: صفحه اصلی — Hero, Ticker, Featured, News Grid, Newsletter
 * PROJECT: BarakatHub — پلتفرم رسانه‌ای چندزبانه
 * VERSION: 1.0.0
 * DEPENDS ON: i18n.js, theme.js, pwa.js
 * ============================================================
 */

import { i18n, t, timeAgo, formatNum } from './i18n.js';
import { initAutoPageTranslation } from './auto-translate.js';
import { pwa } from './pwa.js';

/* ────────────────────────────────────────────────────────────
   داده‌های نمونه (بعداً از API می‌آید)
   ──────────────────────────────────────────────────────────── */
const SAMPLE_ARTICLES = [
  {
    id: 1,
    title: { fa: 'تدبر در آیات قرآن کریم — سوره بقره', ar: 'التدبر في آيات القرآن الكريم', ur: 'قرآن کریم کی آیات میں تدبر', az: 'Qurani-Kərim ayələrinin tədəbbürü', tr: 'Kur\'an-ı Kerim Ayetlerini Tefekkür', ru: 'Размышление над аятами Корана', en: 'Contemplating Verses of the Holy Quran' , id:'Merenungkan ayat-ayat Al-Quran — Surah Al-Baqarah'},
    excerpt: { fa: 'در این مقاله به تدبر و تأمل در آیات ابتدایی سوره بقره می‌پردازیم...', ar: 'في هذا المقال نتدبر في الآيات الأولى من سورة البقرة...', ur: 'اس مضمون میں سورۃ البقرہ کی ابتدائی آیات پر غور کریں گے...', en: 'In this article, we contemplate the opening verses of Surah Al-Baqarah...' , az:'Bu məqalədə Bəqərə surəsinin ilk ayələrini tədəbbür edirik...', tr:'Bu makalede Bakara suresinin ilk ayetlerini tefekkür edeceğiz...', ru:'В этой статье мы размышляем над начальными аятами суры Аль-Бакара...', id:'Dalam artikel ini kami merenungkan ayat-ayat awal surah Al-Baqarah...'},
    category: { fa: 'تدبر', ar: 'تدبر', ur: 'تدبر', en: 'Reflection', az:'Tədəbbür'}, tr:'Tefekkür'}, ru:'Размышление'}, id:'Refleksi' },
    image: 'https://images.unsplash.com/photo-1609599006353-e629aaabfeae?w=800&q=80',
    author: 'شیخ احمد',
    date: new Date(Date.now() - 2 * 60 * 60 * 1000),
    views: 4821,
    readTime: 8,
    featured: true,
  },
  {
    id: 2,
    title: { fa: 'اهمیت زیارت امام حسین (ع) در کربلای معلی', ar: 'أهمية زيارة الإمام الحسين في كربلاء', ur: 'کربلا میں امام حسین کی زیارت کی اہمیت', en: 'Importance of Visiting Imam Hussein in Karbala' , az:'İmam Hüseynin (ə) Kərbəlada ziyarətinin əhəmiyyəti', tr:'İmam Hüseyin\'in (as) Kerbela\'da ziyaretinin önemi', ru:'Важность посещения Имама Хусейна (а) в Кербеле', id:'Pentingnya ziarah Imam Hussein (as) di Karbala'},
    excerpt: { fa: 'کربلا، سرزمین عشق و فداکاری، همواره مقصد عاشقان اهل‌بیت بوده است...', en: 'Karbala, the land of love and sacrifice, has always been the destination of lovers of Ahlul Bayt...' , ar:'كربلاء، أرض الحب والتضحية، دائمًا ما كانت وجهة محبي أهل البيت...', ur:'کربلا، محبت اور قربانی کی سرزمین، ہمیشہ اہل بیت کے چاہنے والوں کی منزل رہی ہے...', az:'Kərbəla, sevgi və fədakarlıq diyarı, həmişə Əhli-Beyt aşiqlərinin məqsədi olmuşdur...', tr:'Kerbela, sevgi ve fedakarlık diyarı, her zaman Ehlibeyt sevdalılarının hedefi olmuştur...', ru:'Кербела, земля любви и жертвенности, всегда была целью любящих Ахл аль-Бейт...', id:'Karbala, tanah cinta dan pengorbanan, selalu menjadi tujuan para pecinta Ahlul Bayt...'},
    category: { fa: 'معارف', ar: 'معارف', ur:'معارف', az:'Mərifət', tr:'Marifet', ru:'Знание', en: 'Knowledge', id:'Pengetahuan'}, tr:'Marifet'}, ru:'Знание'}, id:'Pengetahuan' },
    image: 'https://images.unsplash.com/photo-1564769625905-50e93615e769?w=800&q=80',
    author: 'استاد محمدی',
    date: new Date(Date.now() - 5 * 60 * 60 * 1000),
    views: 7234,
    readTime: 6,
    featured: true,
  },
  {
    id: 3,
    title: { fa: 'ختم قرآن نیابتی — راهنمای کامل', ar: 'ختم القرآن نيابةً — دليل شامل', ur: 'نیابتی ختم قرآن — مکمل رہنما', en: 'Proxy Quran Completion — Complete Guide' , az:'Niyabət Quran xətmi — Tam bələdçi', tr:'Vekalet Kuran hatmi — Tam kılavuz', ru:'Завершение Корана по доверенности — Полное руководство', id:'Khatam Quran perwakilan — Panduan lengkap'},
    excerpt: { fa: 'ختم قرآن نیابتی به معنای قرائت قرآن از طرف دیگری است...', en: 'Proxy Quran completion means reciting the Quran on behalf of another person...' , ar:'ختم القرآن نيابةً يعني قراءة القرآن بالنيابة عن شخص آخر...', ur:'نیابتی ختم قرآن کا مطلب ہے کسی دوسرے کی طرف سے قرآن پڑھنا...', az:'Niyabət Quran xətmi başqası adından Quran oxumaq deməkdir...', tr:'Vekalet Kuran hatmi, başkası adına Kuran okumak anlamına gelir...', ru:'Завершение Корана по доверенности означает чтение Корана от имени другого...', id:'Khatam Quran perwakilan berarti membaca Quran atas nama orang lain...'},
    category: { fa: 'قرآن', ar: 'قرآن', ur:'قرآن', az:'Quran', tr:'Kuran', ru:'Коран', en: 'Quran', id:'Quran'}, tr:'Kuran'}, ru:'Коран'}, id:'Quran' },
    image: 'https://images.unsplash.com/photo-1585036156171-384164a8c675?w=800&q=80',
    author: 'قاری یوسف',
    date: new Date(Date.now() - 12 * 60 * 60 * 1000),
    views: 3102,
    readTime: 5,
  },
  {
    id: 4,
    title: { fa: 'دعا و نیایش در محضر امام (ع)', ar: 'الدعاء والمناجاة في حضرة الإمام', ur: 'امام کی بارگاہ میں دعا و مناجات', en: 'Prayer and Supplication in the Presence of the Imam' , az:'İmamın (ə) hüzurunda dua', tr:'İmam\'ın (as) huzurunda dua', ru:'Молитва и мольба в присутствии Имама (а)', id:'Doa dan permohonan di hadapan Imam (as)'},
    excerpt: { fa: 'دعا خواندن در اماکن مقدس از جمله اعمال مستحب بسیار مؤکد است...', en: 'Supplication in holy places is among the highly recommended acts...' , ar:'قراءة الدعاء في الأماكن المقدسة من الأعمال المستحبة المؤكدة جدًا...', ur:'مقدس مقامات میں دعا پڑھنا انتہائی مستحب اعمال میں سے ہے...', az:'Müqəddəs yerlərdə dua oxumaq çox tövsiyə edilən əməllərdəndir...', tr:'Kutsal yerlerde dua okumak son derece tavsiye edilen amellerdendir...', ru:'Чтение молитв в священных местах является очень рекомендуемым делом...', id:'Membaca doa di tempat-tempat suci termasuk amalan yang sangat dianjurkan...'},
    category: { fa: 'دعا', ar: 'دعاء', ur:'دعا', az:'Dua', tr:'Dua', ru:'Молитва', en: 'Prayer', id:'Doa'}, tr:'Dua'}, ru:'Молитва'}, id:'Doa' },
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80',
    author: 'علامه رضوی',
    date: new Date(Date.now() - 24 * 60 * 60 * 1000),
    views: 5640,
    readTime: 7,
  },
  {
    id: 5,
    title: { fa: 'برنامه دیدار با شیخ در ماه محرم', ar: 'برنامج لقاء الشيخ في شهر المحرم', ur: 'محرم میں شیخ سے ملاقات کا پروگرام', en: 'Schedule for Meeting with Sheikh in Muharram' , az:'Məhərrəm ayında şeyxlə görüş proqramı', tr:'Muharrem ayında şeyh buluşma programı', ru:'Программа встречи с шейхом в месяц Мухаррам', id:'Program pertemuan dengan syaikh di bulan Muharram'},
    excerpt: { fa: 'در ماه محرم فرصت ویژه‌ای برای دیدار با شیخ فراهم شده است...', en: 'A special opportunity has been arranged to meet with the Sheikh during Muharram...' , ar:'في شهر محرم أُتيحت فرصة خاصة للقاء الشيخ...', ur:'محرم کے مہینے میں شیخ سے ملاقات کا خصوصی موقع فراہم کیا گیا ہے...', az:'Məhərrəm ayında şeyxlə görüşmək üçün xüsusi imkan yaradılmışdır...', tr:'Muharrem ayında şeyh ile buluşma için özel bir fırsat sunulmuştur...', ru:'В месяц Мухаррам предоставляется особая возможность встретиться с шейхом...', id:'Di bulan Muharram telah disediakan kesempatan khusus untuk bertemu syaikh...'},
    category: { fa: 'دیدار', ar: 'لقاء', ur:'ملاقات', az:'Görüş', tr:'Buluşma', ru:'Встреча', en: 'Meeting', id:'Pertemuan'}, tr:'Buluşma'}, ru:'Встреча'}, id:'Pertemuan' },
    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80',
    author: 'دفتر شیخ',
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    views: 9870,
    readTime: 3,
  },
  {
    id: 6,
    title: { fa: 'آداب زیارت در حرم مطهر امام حسین (ع)', ar: 'آداب الزيارة في الروضة الحسينية', ur: 'حرم امام حسین میں زیارت کے آداب', en: 'Etiquette of Visiting the Holy Shrine of Imam Hussein' , az:'İmam Hüseynin (ə) müqəddəs hərəmini ziyarət ədəbləri', tr:'İmam Hüseyin\'in (as) kutsal türbesini ziyaret adabı', ru:'Этикет посещения священной усыпальницы Имама Хусейна (а)', id:'Adab berziarah ke makam suci Imam Hussein (as)'},
    excerpt: { fa: 'آداب زیارت در حرم مطهر شامل مجموعه‌ای از اعمال و رفتارهاست...', en: 'The etiquette of visiting the holy shrine includes a set of acts and behaviors...' , ar:'آداب الزيارة في الروضة المطهرة تشمل مجموعة من الأعمال والسلوكيات...', ur:'مقدس حرم میں زیارت کے آداب اعمال اور رویوں کا مجموعہ ہیں...', az:'Müqəddəs hərəmdə ziyarətin ədəbləri əməl və davranışlar toplusudur...', tr:'Kutsal türbede ziyaretin adabı, bir dizi amel ve davranışı kapsar...', ru:'Этикет посещения священной усыпальницы включает ряд деяний и поведений...', id:'Adab ziarah di makam suci mencakup serangkaian amalan dan perilaku...'},
    category: { fa: 'زیارت', ar: 'زيارة', ur:'زیارت', az:'Ziyarət', tr:'Ziyaret', ru:'Паломничество', en: 'Pilgrimage', id:'Ziarah'}, tr:'Ziyaret'}, ru:'Паломничество'}, id:'Ziarah' },
    image: 'https://images.unsplash.com/photo-1544986581-efac5e5d99a2?w=800&q=80',
    author: 'استاد حسینی',
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    views: 6543,
    readTime: 9,
  },
];

const CATEGORIES = [
  { key: 'all',        label: { fa: 'همه', ar: 'الكل', ur: 'سب', az: 'Hamısı', tr: 'Tümü', ru: 'Все', en: 'All' } },
  { key: 'quran',      label: { fa: 'قرآن', ar: 'قرآن', ur: 'قرآن', en: 'Quran', az:'Quran'}, tr:'Kuran'}, ru:'Коран'}, id:'Quran'}} },
  { key: 'prayer',     label: { fa: 'دعا', ar: 'دعاء', ur: 'دعا', en: 'Prayer', az:'Dua'}, tr:'Dua'}, ru:'Молитва'}, id:'Doa'}} },
  { key: 'pilgrimage', label: { fa: 'زیارت', ar: 'زيارة', ur: 'زیارت', en: 'Pilgrimage', az:'Ziyarət'}, tr:'Ziyaret'}, ru:'Паломничество'}, id:'Ziarah'}} },
  { key: 'knowledge',  label: { fa: 'معارف', ar: 'معارف', ur: 'معارف', en: 'Knowledge', az:'Mərifət'}, tr:'Marifet'}, ru:'Знание'}, id:'Pengetahuan'}} },
  { key: 'meeting',    label: { fa: 'دیدار', ar: 'لقاء', ur: 'ملاقات', en: 'Meeting', az:'Görüş'}, tr:'Buluşma'}, ru:'Встреча'}, id:'Pertemuan'}} },
];

const STATS = [
  { key: 'articles', num: 1240, label: { fa: 'مقاله', ar: 'مقالة', ur: 'مضمون', en: 'Articles', az:'Məqalə'}, tr:'Makale'}, ru:'Статья'}, id:'Artikel'}} },
  { key: 'readers',  num: 82000, label: { fa: 'خواننده', ar: 'قارئ', ur: 'قاری', en: 'Readers' , az:'Oxucu', tr:'Okuyucu', ru:'Читатель', id:'Pembaca'} },
  { key: 'langs',    num: 7, label: { fa: 'زبان', ar: 'لغة', ur: 'زبان', en: 'Languages' , az:'Dil', tr:'Dil', ru:'Язык', id:'Bahasa'} },
];

/* ────────────────────────────────────────────────────────────
   Helper: متن به زبان فعلی
   ──────────────────────────────────────────────────────────── */
function tx(obj) {
  if (!obj) return '';
  return obj[i18n.lang] ?? obj['fa'] ?? obj['en'] ?? Object.values(obj)[0] ?? '';
}

/* ────────────────────────────────────────────────────────────
   1. HERO SECTION
   ──────────────────────────────────────────────────────────── */
function renderHero() {
  const el = document.getElementById('hero-root');
  if (!el) return;

  el.innerHTML = `
    <section class="hero" aria-labelledby="hero-heading">
      <div class="container hero__inner">
        <div class="hero__content">

          <div class="hero__eyebrow">
            <span class="hero__eyebrow-dot" aria-hidden="true"></span>
            ${_heroEyebrow()}
          </div>

          <h1 id="hero-heading" class="hero__title">
            ${_heroTitle()}
          </h1>

          <p class="hero__desc">${_heroDesc()}</p>

          <div class="hero__actions">
            <a href="/articles" class="btn btn--primary btn--lg">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path d="M4 6h16M4 12h16M4 18h7"/>
              </svg>
              ${t('btn.readMore')}
            </a>
            <a href="/subscribe" class="btn btn--outline btn--lg">${t('btn.subscribe')}</a>
          </div>

          <div class="hero__stats" role="list" aria-label="آمار سایت">
            ${STATS.map(s => `
              <div role="listitem">
                <span class="hero__stat-number" aria-label="${tx(s.label)}">
                  ${formatNum(s.num)}+
                </span>
                <span class="hero__stat-label">${tx(s.label)}</span>
              </div>
            `).join('')}
          </div>

        </div><!-- /.hero__content -->

        <!-- دکوراتیو -->
        <div class="hero__visual" aria-hidden="true">
          <div style="
            position: absolute;
            inset: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 120px;
            opacity: 0.18;
            user-select: none;
          ">🕌</div>
        </div>

      </div><!-- /.container -->
    </section>
  `;
}

function _heroEyebrow() {
  const map = { fa: 'پلتفرم رسانه‌ای کربلا', ar: 'منصة إعلام كربلاء', ur: 'کربلا میڈیا پلیٹ فارم', az: 'Kərbəla Media Platforması', tr: 'Kerbela Medya Platformu', ru: 'Медиаплатформа Кербелы', en: 'Karbala Media Platform' };
  return map[i18n.lang] ?? map.fa;
}

function _heroTitle() {
  const map = {
    fa: `پلی میان شما و <span class="hero__title-accent">کربلا</span>`,
    ar: `جسر بينك وبين <span class="hero__title-accent">كربلاء</span>`,
    ur: `آپ اور <span class="hero__title-accent">کربلا</span> کے درمیان پل`,
    az: `Siz və <span class="hero__title-accent">Kərbəla</span> arasında körpü`,
    tr: `Sizi <span class="hero__title-accent">Kerbela</span>'ya Bağlayan Köprü`,
    ru: `Мост между вами и <span class="hero__title-accent">Кербелой</span>`,
    en: `Your Bridge to <span class="hero__title-accent">Karbala</span>`,
  };
  return map[i18n.lang] ?? map.fa;
}

function _heroDesc() {
  const map = {
    fa: 'برکت‌هاب؛ بستری برای تدبر در قرآن، معارف اهل‌بیت، دعا و ارتباط معنوی با حرم مطهر امام حسین (علیه‌السلام)',
    ar: 'ميدياهاب؛ منصة للتدبر في القرآن ومعارف أهل البيت والدعاء والتواصل الروحي مع الروضة الحسينية',
    ur: 'میڈیاہب؛ قرآن میں تدبر، اہل بیت کی معارف، دعا اور امام حسین کے حرم سے روحانی رابطے کا پلیٹ فارم',
    az: 'BarakatHub; Quranı dərk etmək, Əhli-Beyt biliklərini öyrənmək, dua etmək üçün platforma',
    tr: 'BarakatHub; Kur\'an\'ı düşünmek, Ehl-i Beyt bilgilerini öğrenmek ve dua için platform',
    ru: 'BarakatHub — платформа для размышления над Кораном, знаний Ахл аль-Бейт и духовной связи со святыней',
    en: 'BarakatHub — a platform for Quranic reflection, Ahlul Bayt knowledge, prayer, and spiritual connection with the holy shrine',
  };
  return map[i18n.lang] ?? map.fa;
}

/* ────────────────────────────────────────────────────────────
   2. BREAKING NEWS TICKER
   ──────────────────────────────────────────────────────────── */
function renderTicker() {
  const el = document.getElementById('ticker-root');
  if (!el) return;

  const tickerLabel = { fa: '🔴 خبر فوری', ar: '🔴 عاجل', ur: '🔴 فوری خبر', az: '🔴 Son xəbər', tr: '🔴 Son Dakika', ru: '🔴 Срочно', en: '🔴 Breaking' };
  const items = SAMPLE_ARTICLES.slice(0, 5);
  const tickerItems = [...items, ...items]; /* دوبار برای loop بی‌پایان */

  el.innerHTML = `
    <div class="ticker" aria-label="${tickerLabel[i18n.lang] ?? tickerLabel.fa}" role="marquee">
      <span class="ticker__label" aria-hidden="true">${tickerLabel[i18n.lang] ?? tickerLabel.fa}</span>
      <div class="ticker__track" aria-live="off">
        ${tickerItems.map(a => `
          <a href="/article/${a.id}" class="ticker__item">
            ${tx(a.title)}
          </a>
        `).join('')}
      </div>
    </div>
  `;
}

/* ────────────────────────────────────────────────────────────
   3. FEATURED ARTICLES
   ──────────────────────────────────────────────────────────── */
function renderFeatured() {
  const el = document.getElementById('featured-root');
  if (!el) return;

  const featured = SAMPLE_ARTICLES.filter(a => a.featured);
  const [main, ...sides] = featured;
  if (!main) return;

  el.innerHTML = `
    <section class="section section--sm" aria-labelledby="featured-heading">
      <div class="container">
        <div class="section-header">
          <h2 id="featured-heading" class="section-header__title">
            ${{ fa:'ویژه', ar:'مميز', ur:'خصوصی', az:'Seçilmiş', tr:'Öne Çıkan', ru:'Избранное', en:'Featured' }[i18n.lang] ?? 'Featured'}
          </h2>
          <a href="/news" class="section-header__more">
            ${{ fa:'همه اخبار', ar:'كل الأخبار', ur:'تمام خبریں', en:'All News' , az:'Bütün xəbərlər', tr:'Tüm haberler', ru:'Все новости', id:'Semua berita'}[i18n.lang] ?? 'All News'}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path d="${i18n.isRTL ? 'M15 18l-6-6 6-6' : 'M9 18l6-6-6-6'}"/>
            </svg>
          </a>
        </div>

        <div class="featured-grid">
          <!-- مقاله اصلی -->
          <article class="featured-main" onclick="location.href='/article/${main.id}'" role="link" tabindex="0" aria-label="${tx(main.title)}">
            <img src="${main.image}" alt="${tx(main.title)}" class="featured-main__img" loading="eager" />
            <div class="featured-main__overlay" aria-hidden="true"></div>
            <div class="featured-main__body">
              <span class="featured-main__category">${tx(main.category)}</span>
              <h3 class="featured-main__title">${tx(main.title)}</h3>
              <div class="featured-main__meta">
                <span>${main.author}</span>
                <span>•</span>
                <span>${timeAgo(main.date)}</span>
                <span>•</span>
                <span>${formatNum(main.readTime)} ${t('article.readTime')}</span>
              </div>
            </div>
          </article>

          <!-- مقاله‌های کوچک -->
          ${sides.slice(0, 2).map(a => `
            <article class="featured-side" onclick="location.href='/article/${a.id}'" role="link" tabindex="0" aria-label="${tx(a.title)}">
              <img src="${a.image}" alt="${tx(a.title)}" class="featured-side__img" loading="lazy" />
              <div class="featured-side__overlay" aria-hidden="true"></div>
              <div class="featured-side__body">
                <span class="featured-main__category" style="margin-bottom:var(--space-2);display:inline-block">${tx(a.category)}</span>
                <h3 class="featured-side__title">${tx(a.title)}</h3>
              </div>
            </article>
          `).join('')}
        </div>
      </div>
    </section>
  `;
}

/* ────────────────────────────────────────────────────────────
   4. CATEGORY TABS + NEWS GRID
   ──────────────────────────────────────────────────────────── */
let _activeCategory = 'all';

function renderNewsSection() {
  const el = document.getElementById('news-section-root');
  if (!el) return;

  el.innerHTML = `
    <section class="section" aria-labelledby="news-heading">
      <div class="container">

        <div class="section-header">
          <h2 id="news-heading" class="section-header__title">
            ${t('nav.news')}
          </h2>
        </div>

        <!-- Category Tabs -->
        <nav aria-label="${t('nav.categories')}" style="margin-bottom: var(--space-6);">
          <div class="category-tabs" role="tablist">
            ${CATEGORIES.map(c => `
              <button
                class="category-tab ${c.key === _activeCategory ? 'category-tab--active' : ''}"
                role="tab"
                aria-selected="${c.key === _activeCategory}"
                data-cat="${c.key}"
              >
                ${tx(c.label)}
              </button>
            `).join('')}
          </div>
        </nav>

        <!-- News Grid -->
        <div class="grid grid--cards" id="news-grid" role="list" aria-label="${t('nav.news')}">
          ${renderNewsCards(SAMPLE_ARTICLES)}
        </div>

        <!-- Load More -->
        <div style="text-align:center; margin-top: var(--space-10);">
          <button class="btn btn--outline btn--lg" id="load-more-btn">
            ${{ fa:'مشاهده بیشتر', ar:'عرض المزيد', ur:'مزید دیکھیں', az:'Daha çox', tr:'Daha Fazla', ru:'Показать ещё', en:'Load More' }[i18n.lang] ?? 'Load More'}
          </button>
        </div>

      </div>
    </section>
  `;

  /* Category filter events */
  el.querySelectorAll('.category-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      _activeCategory = btn.dataset.cat;
      el.querySelectorAll('.category-tab').forEach(b => {
        b.classList.toggle('category-tab--active', b.dataset.cat === _activeCategory);
        b.setAttribute('aria-selected', b.dataset.cat === _activeCategory);
      });
      const grid = document.getElementById('news-grid');
      if (grid) grid.innerHTML = renderNewsCards(SAMPLE_ARTICLES);
    });
  });
}

function renderNewsCards(articles) {
  return articles.map((a, i) => `
    <article
      class="news-card"
      role="listitem"
      onclick="location.href='/article/${a.id}'"
      style="animation: fadeIn 0.4s ease ${i * 0.07}s both; cursor:pointer;"
      aria-label="${tx(a.title)}"
    >
      <div class="news-card__image-wrap">
        <img
          src="${a.image}"
          alt="${tx(a.title)}"
          class="news-card__image"
          loading="lazy"
        />
        <span class="news-card__category">${tx(a.category)}</span>
      </div>

      <div class="news-card__body">
        <div class="news-card__meta">
          <time datetime="${a.date.toISOString()}">${timeAgo(a.date)}</time>
          <span class="news-card__meta-dot" aria-hidden="true"></span>
          <span>${formatNum(a.readTime)} ${t('article.readTime')}</span>
        </div>
        <h3 class="news-card__title">${tx(a.title)}</h3>
        <p class="news-card__excerpt">${tx(a.excerpt)}</p>
      </div>

      <div class="news-card__footer">
        <div class="news-card__author">
          <div class="avatar avatar--xs" aria-hidden="true">${a.author.charAt(0)}</div>
          <span class="news-card__author-name">${a.author}</span>
        </div>
        <div class="news-card__actions">
          <button
            class="news-card__action-btn"
            aria-label="${t('btn.share')}"
            data-tooltip="${t('btn.share')}"
            onclick="event.stopPropagation(); shareArticle(${a.id})"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
            </svg>
          </button>
          <button
            class="news-card__action-btn"
            aria-label="${t('btn.save')}"
            data-tooltip="${t('btn.save')}"
            onclick="event.stopPropagation(); saveArticle(this, ${a.id})"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path d="m19 21-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>
            </svg>
          </button>
          <span style="font-size:var(--text-xs);color:var(--text-muted);display:inline-flex;align-items:center;gap:4px">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
            </svg>
            ${formatNum(a.views)}
          </span>
        </div>
      </div>
    </article>
  `).join('');
}

/* ────────────────────────────────────────────────────────────
   5. MOST READ (پربازدیدترین)
   ──────────────────────────────────────────────────────────── */
function renderMostRead() {
  const el = document.getElementById('most-read-root');
  if (!el) return;

  const sorted = [...SAMPLE_ARTICLES].sort((a, b) => b.views - a.views).slice(0, 5);

  el.innerHTML = `
    <aside aria-labelledby="most-read-heading">
      <h3 id="most-read-heading" class="section-header__title" style="margin-bottom: var(--space-4);">
        ${{ fa:'پربازدیدترین', ar:'الأكثر قراءة', ur:'سب سے زیادہ پڑھا گیا', az:'Ən çox oxunan', tr:'En Çok Okunan', ru:'Самые читаемые', en:'Most Read' }[i18n.lang] ?? 'Most Read'}
      </h3>
      <div role="list">
        ${sorted.map((a, i) => `
          <div class="news-list-item" onclick="location.href='/article/${a.id}'" role="listitem" tabindex="0" aria-label="${tx(a.title)}">
            <span class="news-list-item__num" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span>
            <div class="news-list-item__content">
              <div class="news-list-item__title">${tx(a.title)}</div>
              <div class="news-list-item__meta">${timeAgo(a.date)} · ${formatNum(a.views)} ${t('article.views')}</div>
            </div>
            <img src="${a.image}" alt="" class="news-list-item__thumb" aria-hidden="true" loading="lazy"/>
          </div>
        `).join('')}
      </div>
    </aside>
  `;
}

/* ────────────────────────────────────────────────────────────
   6. NEWSLETTER
   ──────────────────────────────────────────────────────────── */
function renderNewsletter() {
  const el = document.getElementById('newsletter-root');
  if (!el) return;

  const copy = {
    title: { fa: 'همراه ما باشید', ar: 'كن معنا', ur: 'ہمارے ساتھ رہیں', az: 'Bizimlə olun', tr: 'Bizimle Kalın', ru: 'Оставайтесь с нами', en: 'Stay With Us' },
    desc:  { fa: 'مقالات و اخبار جدید را اول از همه دریافت کنید', ar: 'احصل على المقالات والأخبار الجديدة أولاً', ur: 'نئے مضامین اور خبریں سب سے پہلے پائیں', en: 'Get new articles and news first' , az:'Yeni məqalələri və xəbərləri ilk siz alın', tr:'Yeni makaleleri ve haberleri ilk siz alın', ru:'Получайте новые статьи и новости первыми', id:'Dapatkan artikel dan berita baru pertama kali'},
    btn:   { fa: 'عضویت رایگان', ar: 'اشتراك مجاني', ur: 'مفت رکنیت', en: 'Subscribe Free' , az:'Pulsuz üzvlük', tr:'Ücretsiz üyelik', ru:'Бесплатное членство', id:'Keanggotaan gratis'},
    email: { fa: 'آدرس ایمیل شما', ar: 'بريدك الإلكتروني', ur: 'آپ کا ای میل', en: 'Your email address' , az:'E-poçt ünvanınız', tr:'E-posta adresiniz', ru:'Ваш email', id:'Alamat email Anda'},
    success: { fa: '✓ با موفقیت عضو شدید!', ar: '✓ تم الاشتراك بنجاح!', ur: '✓ کامیابی سے رکن بن گئے!', en: '✓ Successfully subscribed!' , az:'✓ Uğurla üzv oldunuz!', tr:'✓ Başarıyla üye oldunuz!', ru:'✓ Вы успешно подписались!', id:'✓ Berhasil berlangganan!'},
  };

  el.innerHTML = `
    <section class="section" aria-labelledby="newsletter-heading">
      <div class="container">
        <div class="newsletter">
          <div class="newsletter__content">
            <h2 id="newsletter-heading" class="newsletter__title">${tx(copy.title)}</h2>
            <p class="newsletter__desc">${tx(copy.desc)}</p>
            <div class="newsletter__form" role="form" aria-label="${tx(copy.title)}">
              <input
                type="email"
                class="newsletter__input"
                id="newsletter-email"
                placeholder="${tx(copy.email)}"
                aria-label="${tx(copy.email)}"
                autocomplete="email"
                dir="${i18n.isRTL ? 'rtl' : 'ltr'}"
              />
              <button class="newsletter__btn" id="newsletter-submit" type="button">
                ${tx(copy.btn)}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  `;

  document.getElementById('newsletter-submit')?.addEventListener('click', () => {
    const email = document.getElementById('newsletter-email')?.value;
    if (!email || !email.includes('@')) return;
    const btn = document.getElementById('newsletter-submit');
    if (btn) {
      btn.textContent = tx(copy.success);
      btn.style.background = '#2d9e6b';
      btn.style.color = 'white';
    }
  });
}

/* ────────────────────────────────────────────────────────────
   7. READING PROGRESS BAR
   ──────────────────────────────────────────────────────────── */
function initReadingProgress() {
  const bar = document.querySelector('.reading-progress__bar');
  if (!bar) return;
  window.addEventListener('scroll', () => {
    const el   = document.documentElement;
    const pct  = (el.scrollTop / (el.scrollHeight - el.clientHeight)) * 100;
    bar.style.width = Math.min(pct, 100) + '%';
  }, { passive: true });
}

/* ────────────────────────────────────────────────────────────
   8. SCROLL TO TOP
   ──────────────────────────────────────────────────────────── */
function initScrollTop() {
  const btn = document.getElementById('scroll-top-btn');
  if (!btn) return;
  window.addEventListener('scroll', () => {
    btn.classList.toggle('scroll-top--visible', window.scrollY > 400);
  }, { passive: true });
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

/* ────────────────────────────────────────────────────────────
   9. SHARE & SAVE
   ──────────────────────────────────────────────────────────── */
window.shareArticle = async (id) => {
  const article = SAMPLE_ARTICLES.find(a => a.id === id);
  if (!article) return;
  if (navigator.share) {
    try {
      await navigator.share({
        title: tx(article.title),
        url:   `${location.origin}/article/${id}`,
      });
    } catch {}
  } else {
    await navigator.clipboard.writeText(`${location.origin}/article/${id}`).catch(() => {});
  }
};

window.saveArticle = (btn, id) => {
  try {
    const saved = JSON.parse(localStorage.getItem('saved_articles') || '[]');
    const idx   = saved.indexOf(id);
    if (idx === -1) {
      saved.push(id);
      btn.classList.add('saved');
    } else {
      saved.splice(idx, 1);
      btn.classList.remove('saved');
    }
    localStorage.setItem('saved_articles', JSON.stringify(saved));
  } catch {}
};

/* ────────────────────────────────────────────────────────────
   SERVICES SECTION — دکمه‌های خدمات اصلی
   ──────────────────────────────────────────────────────────── */
function renderServices() {
  /* اگر div وجود ندارد آن را بساز */
  let el = document.getElementById('services-root');
  if (!el) {
    const newsletterEl = document.getElementById('newsletter-root');
    if (newsletterEl) {
      el = document.createElement('div');
      el.id = 'services-root';
      newsletterEl.before(el);
    }
  }
  if (!el) return;

  const SERVICES = [
    {
      id: 'quran',
      icon: '📖',
      color: 'teal',
      gradient: 'linear-gradient(135deg,#0a3d2e,#1a6b50)',
      href: '/quran.html',
      title: { fa:'دانشگاه قرآن', ar:'جامعة القرآن', ur:'یونیورسٹی قرآن', az:'Quran Universiteti', tr:'Kuran Üniversitesi', ru:'Университет Корана', en:'Quran University', id:'Universitas Quran' },
      desc:  { fa:'آموزش گام به گام تدبر و فهم قرآن', ar:'تعلم التدبر وفهم القرآن خطوة بخطوة', ur:'قرآن فہمی کی مرحلہ وار تعلیم', az:'Quranı addım-addım dərk etmə', tr:'Adım adım Kuran tefekkürü', ru:'Пошаговое изучение Корана', en:'Step-by-step Quran reflection', id:'Memahami Al-Quran langkah demi langkah' },
    },
    {
      id: 'prayer',
      icon: '🤲',
      color: 'amber',
      gradient: 'linear-gradient(135deg,#3d2000,#7a4000)',
      href: '/prayer.html',
      title: { fa:'دعا و ختم قرآن نیابتی', ar:'الدعاء وختم القرآن نيابةً', ur:'نیابتی دعا و ختم قرآن', az:'Dua və Quran xətmi', tr:'Dua ve Hatim', ru:'Молитва и хатм Корана', en:'Prayer & Quran Khatm', id:'Doa & Khatam Quran' },
      desc:  { fa:'در حرم مطهر امام حسین (ع)', ar:'في الروضة الحسينية المقدسة', ur:'امام حسین کے حرم میں', az:'İmam Hüseynin müqəddəs hərəmində', tr:'İmam Hüseyin'in kutsal türbesinde', ru:'В святыне Имама Хусейна', en:'At the Holy Shrine of Imam Hussein', id:'Di Makam Suci Imam Hussein' },
    },
    {
      id: 'consultation',
      icon: '💬',
      color: 'blue',
      gradient: 'linear-gradient(135deg,#0d1f2d,#1a3040)',
      href: '/consultation.html',
      title: { fa:'مشاوره با شیخ', ar:'الاستشارة مع الشيخ', ur:'شیخ سے مشاورہ', az:'Şeyxlə məsləhət', tr:'Şeyh ile Danışmanlık', ru:'Консультация с шейхом', en:'Consultation with Sheikh', id:'Konsultasi dengan Syaikh' },
      desc:  { fa:'پاسخ روانشناسانه، اجتماعی و دینی', ar:'إجابات نفسية واجتماعية ودينية', ur:'نفسیاتی، سماجی اور دینی جواب', az:'Psixoloji, sosial və dini cavablar', tr:'Psikolojik, sosyal ve dini cevaplar', ru:'Психологические, социальные и религиозные ответы', en:'Psychological, social, and religious answers', id:'Jawaban psikologis, sosial, dan agama' },
    },
    {
      id: 'istikhara',
      icon: '⭐',
      color: 'purple',
      gradient: 'linear-gradient(135deg,#1a0a2e,#2d1b4e)',
      href: '/istikhara.html',
      title: { fa:'استخاره', ar:'الاستخارة', ur:'استخارہ', az:'İstixarə', tr:'İstihare', ru:'Истихара', en:'Istikhara', id:'Istikharah' },
      desc:  { fa:'استخاره به قرآن کریم — رایگان و تخصصی', ar:'الاستخارة بالقرآن — مجانية ومتخصصة', ur:'قرآن سے استخارہ — مفت اور تخصصی', az:'Quranla istixarə — pulsuz və xüsusi', tr:'Kuran ile istihare — ücretsiz ve özel', ru:'Истихара по Корану — бесплатная и специальная', en:'Quran Istikhara — free and specialized', id:'Istikharah dengan Al-Quran — gratis dan khusus' },
    },
    {
      id: 'meeting',
      icon: '🕌',
      color: 'green',
      gradient: 'linear-gradient(135deg,#0a2a1a,#1a5a30)',
      href: '/meeting.html',
      title: { fa:'دیدار با شیخ', ar:'لقاء الشيخ', ur:'شیخ سے ملاقات', az:'Şeyxlə görüş', tr:'Şeyh Görüşmesi', ru:'Встреча с шейхом', en:'Meet the Sheikh', id:'Bertemu Syaikh' },
      desc:  { fa:'رایگان — با هماهنگی قبلی', ar:'مجاناً — بموعد مسبق', ur:'مفت — پہلے سے بکنگ', az:'Pulsuz — əvvəlcədən razılaşdırılmış', tr:'Ücretsiz — önceden randevu', ru:'Бесплатно — по записи', en:'Free — by prior appointment', id:'Gratis — dengan perjanjian' },
    },
    {
      id: 'payment',
      icon: '💳',
      color: 'rose',
      gradient: 'linear-gradient(135deg,#0d1f2d,#1a3040)',
      href: '/payment.html',
      title: { fa:'پرداخت', ar:'الدفع', ur:'ادائیگی', az:'Ödəniş', tr:'Ödeme', ru:'Платёж', en:'Payment', id:'Pembayaran' },
      desc:  { fa:'ارسال وجه به پلتفرم برکت‌هاب', ar:'إرسال مبلغ إلى منصة ميدياهاب', ur:'میڈیاہب کو رقم بھیجیں', az:'BarakatHub-a ödəniş göndər', tr:'BarakatHub'a ödeme gönder', ru:'Отправить платёж в BarakatHub', en:'Send payment to BarakatHub', id:'Kirim pembayaran ke BarakatHub' },
    },
  ];

  el.innerHTML = `
    <section class="section" aria-labelledby="services-heading" style="background:var(--bg-surface-2)">
      <div class="container">
        <div class="section-header">
          <h2 id="services-heading" class="section-header__title">
            ${{ fa:'خدمات ما', ar:'خدماتنا', ur:'ہماری خدمات', az:'Xidmətlərimiz', tr:'Hizmetlerimiz', ru:'Наши услуги', en:'Our Services', id:'Layanan Kami' }[i18n.lang] ?? 'Services'}
          </h2>
        </div>

        <div style="
          display:grid;
          grid-template-columns:repeat(auto-fill,minmax(280px,1fr));
          gap:var(--space-5);
        " role="list">
          ${SERVICES.map(s => `
            <a href="${s.href}" style="
              display:block;
              background:${s.gradient};
              border-radius:var(--radius-xl);
              padding:var(--space-7) var(--space-6);
              text-decoration:none;
              position:relative;overflow:hidden;
              transition:transform 0.25s ease, box-shadow 0.25s ease;
              box-shadow:var(--shadow-md);
            "
            class="service-card"
            aria-label="${tx(s.title)}"
            role="listitem"
            >
              <!-- دکوراتیو -->
              <div style="position:absolute;inset-inline-end:-20px;top:-20px;font-size:80px;opacity:0.08;user-select:none" aria-hidden="true">${s.icon}</div>

              <div style="font-size:40px;margin-bottom:var(--space-4);position:relative;z-index:1;filter:drop-shadow(0 2px 8px rgba(0,0,0,0.3))" aria-hidden="true">${s.icon}</div>
              <h3 data-fa-text="${s.title.fa}" style="
                font-family:var(--font-rtl-display);
                font-size:var(--text-lg);
                font-weight:var(--weight-bold);
                color:white;
                margin-bottom:var(--space-2);
                position:relative;z-index:1;
              ">${tx(s.title)}</h3>
              <p data-fa-text="${s.desc.fa}" style="
                font-size:var(--text-sm);
                color:rgba(255,255,255,0.7);
                line-height:var(--leading-relaxed);
                position:relative;z-index:1;
              ">${tx(s.desc)}</p>
              <div style="
                margin-top:var(--space-5);
                display:inline-flex;align-items:center;gap:var(--space-2);
                background:rgba(255,255,255,0.12);
                border:1px solid rgba(255,255,255,0.2);
                border-radius:var(--radius-full);
                padding:var(--space-2) var(--space-4);
                font-size:var(--text-sm);
                color:rgba(255,255,255,0.9);
                font-weight:var(--weight-semibold);
                position:relative;z-index:1;
              ">
                ${{ fa:'ورود', ar:'دخول', ur:'داخل ہوں', az:'Daxil ol', tr:'Giriş', ru:'Войти', en:'Enter', id:'Masuk' }[i18n.lang] ?? 'Enter'}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
                  <path d="${i18n.isRTL ? 'M15 18l-6-6 6-6' : 'M9 18l6-6-6-6'}"/>
                </svg>
              </div>
            </a>
          `).join('')}
        </div>

      </div>
    </section>
    <style>
      .service-card:hover { transform:translateY(-4px); box-shadow:var(--shadow-xl) !important; }
      .service-card:focus-visible { outline:3px solid white; outline-offset:3px; }
    </style>
  `;
}

/* ────────────────────────────────────────────────────────────
   10. INIT
   ──────────────────────────────────────────────────────────── */
export function initHomePage() {
  renderHero();
  renderTicker();
  renderFeatured();
  renderNewsSection();
  renderServices();
  renderMostRead();
  renderNewsletter();
  initReadingProgress();
  initScrollTop();

  /* PWA */
  pwa.init();

  /* Re-render on lang change */
  i18n.onChange(() => {
    renderHero();
    renderTicker();
    renderFeatured();
    renderNewsSection();
    renderServices();
    renderMostRead();
    renderNewsletter();
  });

  console.log('%c[Home] Page initialized ✓', 'color:#f4a261;font-weight:bold');
}
