/**
 * ============================================================
 * FILE: about.js
 * ROLE: صفحه درباره ما — کاربر + ادمین
 * PROJECT: MediaHub — پلتفرم رسانه‌ای کربلا
 * VERSION: 1.0.0
 * ============================================================
 */

import { i18n } from './i18n.js';
import { translateText } from './auto-translate.js';

const ABOUT_KEY = 'mh_about_content';

/* ────────────────────────────────────────────────────────────
   1. CONTENT MANAGER
   ──────────────────────────────────────────────────────────── */
export const AboutContent = {
  get() {
    try {
      return JSON.parse(localStorage.getItem(ABOUT_KEY) || 'null') || {
        /* عنوان */
        title: {
          fa: 'درباره مدیاهاب',
          ar: 'عن ميدياهاب',
          ur: 'میڈیاہب کے بارے میں',
          az: 'MediaHub haqqında',
          tr: 'MediaHub Hakkında',
          ru: 'О MediaHub',
          en: 'About MediaHub',
          id: 'Tentang MediaHub',
        },
        /* زیرعنوان */
        subtitle: {
          fa: 'پلی میان شما و کربلا',
          ar: 'جسر بينك وبين كربلاء',
          ur: 'آپ اور کربلا کے درمیان پل',
          en: 'Your Bridge to Karbala',
          id: 'Jembatan Anda menuju Karbala',
        },
        /* متن اصلی — ادمین می‌نویسد */
        body: {
          fa: `مدیاهاب یک پلتفرم رسانه‌ای اسلامی است که با هدف ایجاد ارتباط معنوی میان مسلمانان سراسر جهان و حرم مطهر امام حسین علیه‌السلام در کربلای معلی تأسیس شده است.

ما با بهره‌گیری از فناوری روز دنیا، خدماتی از قبیل تدبر در قرآن کریم، قرائت دعا و ختم قرآن نیابتی، مشاوره دینی و روانشناختی، استخاره به قرآن کریم و دیدار با شیخ را در اختیار کاربران خود در هشت زبان مختلف قرار می‌دهیم.

هدف ما ایجاد یک بستر معنوی، علمی و فرهنگی است که بتواند پیوند عمیق‌تری میان مؤمنان و آستان مقدس ابا عبدالله الحسین علیه‌السلام برقرار سازد.`,
        },
        /* آمار */
        stats: [
          { icon: '🌍', value: '8', label: { fa:'زبان فعال', ar:'لغات نشطة', ur:'فعال زبانیں', en:'Active Languages', id:'Bahasa Aktif' } },
          { icon: '🕌', value: '6', label: { fa:'سرویس',    ar:'خدمات',        ur:'خدمات',        en:'Services',        id:'Layanan'       } },
          { icon: '🤲', value: '∞', label: { fa:'ارتباط با کربلا', ar:'تواصل مع كربلاء', ur:'کربلا سے رابطہ', en:'Connection to Karbala', id:'Hubungan ke Karbala' } },
        ],
        /* مدارک — ادمین آپلود می‌کند */
        credentials: [],
        /* آخرین ویرایش */
        updatedAt: null,
      };
    } catch { return { title:{fa:'درباره ما', ar:'من نحن', ur:'ہمارے بارے میں', az:'Haqqımızda', tr:'Hakkımızda', ru:'О нас', en:'About Us', id:'Tentang Kami'}, body:{fa:''}, stats:[], credentials:[] }; }
  },

  set(content) {
    content.updatedAt = new Date().toISOString();
    try { localStorage.setItem(ABOUT_KEY, JSON.stringify(content)); } catch {}
  },
};

/* ────────────────────────────────────────────────────────────
   2. USER PAGE
   ──────────────────────────────────────────────────────────── */
export async function renderAboutPage(container) {
  if (!container) return;

  const lang    = i18n.lang;
  const content = AboutContent.get();
  const tx      = (obj) => obj?.[lang] ?? obj?.fa ?? obj?.en ?? '';

  /* نمایش فوری — ترجمه async بعد از رندر اعمال می‌شود */
  let bodyText     = tx(content.body);
  let titleText    = tx(content.title);
  let subtitleText = tx(content.subtitle);

  /* ترجمه async — بعد از رندر صفحه اجرا می‌شود */
  const _translateAfterRender = () => {
    if (lang === 'fa') return;
    /* title */
    if (content.title?.fa && !content.title?.[lang]) {
      translateText(content.title.fa, lang, 'about').then(t => {
        const el = container.querySelector('[data-about-title]');
        if (el && t) el.textContent = t;
      }).catch(() => {});
    }
    /* subtitle */
    if (content.subtitle?.fa && !content.subtitle?.[lang]) {
      translateText(content.subtitle.fa, lang, 'about').then(t => {
        const el = container.querySelector('[data-about-subtitle]');
        if (el && t) el.textContent = t;
      }).catch(() => {});
    }
    /* body */
    if (content.body?.fa && !content.body?.[lang]) {
      translateText(content.body.fa, lang, 'about').then(t => {
        const el = container.querySelector('[data-about-body]');
        if (el && t) el.textContent = t;
      }).catch(() => {});
    }
    /* stats labels */
    content.stats?.forEach((s, i) => {
      if (s.label?.fa && !s.label?.[lang]) {
        translateText(s.label.fa, lang, 'about').then(t => {
          const el = container.querySelector(`[data-about-stat="${i}"]`);
          if (el && t) el.textContent = t;
        }).catch(() => {});
      }
    });
  };

  container.innerHTML = `
    <!-- Hero -->
    <div style="
      background:linear-gradient(145deg,#0a2a1a 0%,#1a4a2a 50%,#0d1f2d 100%);
      padding:calc(var(--navbar-height) + var(--space-12)) 0 var(--space-14);
      text-align:center;position:relative;overflow:hidden;
    ">
      <!-- نقش زمینه -->
      <div style="
        position:absolute;inset:0;opacity:0.04;
        background-image:repeating-linear-gradient(
          45deg,
          white 0px, white 1px,
          transparent 1px, transparent 50%
        );
        background-size:40px 40px;
      " aria-hidden="true"></div>

      <div class="container" style="position:relative;z-index:1;max-width:720px">
        <div style="
          display:inline-flex;align-items:center;justify-content:center;
          width:96px;height:96px;border-radius:50%;
          background:rgba(255,255,255,0.08);
          border:2px solid rgba(255,255,255,0.15);
          font-size:48px;margin-bottom:var(--space-6);
          animation:float 4s ease-in-out infinite;
          filter:drop-shadow(0 4px 24px rgba(42,157,143,0.4));
        " aria-hidden="true">🕌</div>

        <h1 data-about-title style="
          font-family:var(--font-rtl-display);
          font-size:clamp(2rem,5vw,3rem);
          font-weight:900;color:white;
          margin-bottom:var(--space-4);
          line-height:1.2;
        ">${titleText}</h1>

        <p data-about-subtitle style="
          font-size:var(--text-lg);
          color:rgba(255,255,255,0.65);
          max-width:52ch;margin:0 auto;
        ">${subtitleText}</p>
      </div>
    </div>

    <!-- آمار -->
    ${content.stats?.length ? `
      <div style="background:var(--bg-surface);border-bottom:1px solid var(--border-color)">
        <div class="container" style="max-width:720px">
          <div style="
            display:grid;
            grid-template-columns:repeat(${content.stats.length},1fr);
            gap:0;
          ">
            ${content.stats.map((s,i) => `
              <div style="
                text-align:center;
                padding:var(--space-7) var(--space-4);
                ${i < content.stats.length-1 ? 'border-inline-end:1px solid var(--border-color);' : ''}
              ">
                <div style="font-size:32px;margin-bottom:var(--space-2)" aria-hidden="true">${s.icon}</div>
                <div style="
                  font-family:'JetBrains Mono',monospace;
                  font-size:clamp(1.8rem,4vw,2.5rem);
                  font-weight:900;
                  color:var(--color-primary-600);
                  line-height:1;
                  margin-bottom:var(--space-2);
                ">${s.value}</div>
                <div data-about-stat="${i}" style="font-size:var(--text-sm);color:var(--text-muted);font-weight:500">
                  ${tx(s.label)}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    ` : ''}

    <!-- متن اصلی -->
    <div class="section">
      <div class="container" style="max-width:720px">
        ${bodyText ? `
          <div data-about-body style="
            font-size:var(--text-lg);
            line-height:2;
            color:var(--text-secondary);
            white-space:pre-line;
          ">${bodyText}</div>
        ` : `
          <div style="
            text-align:center;padding:var(--space-12);
            color:var(--text-muted);
          ">
            <div style="font-size:48px;margin-bottom:var(--space-4)">✏️</div>
            <p>${tx({fa:'محتوا هنوز تنظیم نشده',ar:'لم يتم إعداد المحتوى بعد',ur:'مواد ابھی ترتیب نہیں دیا گیا',en:'Content not set yet',id:'Konten belum diatur'})}</p>
          </div>
        `}

        <!-- مدارک -->
        ${content.credentials?.length ? `
          <div style="margin-top:var(--space-10)">
            <h2 style="
              font-size:var(--text-xl);font-weight:700;
              color:var(--text-primary);margin-bottom:var(--space-5);
              padding-bottom:var(--space-3);
              border-bottom:2px solid var(--color-primary-500);
              display:inline-block;
            ">
              📜 ${tx({fa:'مدارک و اعتبارنامه',ar:'الوثائق والاعتمادات',ur:'دستاویزات',en:'Documents & Credentials',id:'Dokumen & Kredensial'})}
            </h2>
            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:var(--space-4)">
              ${content.credentials.map(c => `
                <div style="
                  background:var(--bg-surface);
                  border:1px solid var(--border-color);
                  border-radius:var(--radius-lg);
                  padding:var(--space-5);
                  display:flex;align-items:center;gap:var(--space-3);
                  transition:box-shadow 0.2s;
                ">
                  <span style="font-size:28px" aria-hidden="true">📄</span>
                  <div>
                    <div style="font-weight:600;color:var(--text-primary);font-size:var(--text-sm)">${c.title ?? ''}</div>
                    ${c.date ? `<div style="font-size:var(--text-xs);color:var(--text-muted)">${c.date}</div>` : ''}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

      </div>
    </div>
  `;

  /* اجرای ترجمه async بعد از رندر */
  setTimeout(_translateAfterRender, 50);

  /* Re-render on lang change */
  i18n.onChange(() => renderAboutPage(container));
}

/* ────────────────────────────────────────────────────────────
   3. ADMIN EDITOR
   ──────────────────────────────────────────────────────────── */
export function renderAboutAdminPage(container) {
  if (!container) return;

  function _render() {
    const content = AboutContent.get();

    container.innerHTML = `
      <div>
        <div class="admin-page-header">
          <div>
            <h1 class="admin-page-title">
              <span class="admin-page-title__icon">🕌</span>
              مدیریت صفحه «درباره ما»
            </h1>
            <p class="admin-page-desc">
              ${content.updatedAt
                ? `آخرین ویرایش: ${new Date(content.updatedAt).toLocaleDateString('fa-IR')}`
                : 'هنوز ذخیره نشده'}
            </p>
          </div>
          <a href="/about.html" target="_blank" class="btn btn--outline btn--sm">
            👁 مشاهده صفحه
          </a>
        </div>

        <!-- عنوان -->
        <div class="admin-panel" style="margin-bottom:var(--space-5)">
          <div class="admin-panel__header">
            <div class="admin-panel__title">📝 عنوان و زیرعنوان</div>
          </div>
          <div class="admin-panel__body">
            <div class="admin-field">
              <label class="admin-label" for="about-title">عنوان (فارسی)</label>
              <input type="text" class="admin-input" id="about-title"
                value="${content.title?.fa ?? ''}"
                placeholder="مثلاً: درباره مدیاهاب"/>
            </div>
            <div class="admin-field">
              <label class="admin-label" for="about-subtitle">زیرعنوان (فارسی)</label>
              <input type="text" class="admin-input" id="about-subtitle"
                value="${content.subtitle?.fa ?? ''}"
                placeholder="مثلاً: پلی میان شما و کربلا"/>
            </div>
          </div>
        </div>

        <!-- متن اصلی -->
        <div class="admin-panel" style="margin-bottom:var(--space-5)">
          <div class="admin-panel__header">
            <div class="admin-panel__title">📄 متن اصلی صفحه</div>
          </div>
          <div class="admin-panel__body">
            <div style="
              background:rgba(42,157,143,0.08);
              border:1px solid rgba(42,157,143,0.2);
              border-radius:var(--radius-md);
              padding:var(--space-3) var(--space-4);
              font-size:var(--text-sm);
              color:var(--text-secondary);
              margin-bottom:var(--space-4);
              display:flex;gap:var(--space-2);
            ">
              <span>ℹ️</span>
              <span>متن را به فارسی بنویسید — سایت برای هر کاربر به زبان خودش ترجمه می‌کند</span>
            </div>
            <textarea class="admin-textarea" id="about-body" rows="12"
              placeholder="متن درباره ما را اینجا بنویسید..."
            >${content.body?.fa ?? ''}</textarea>
          </div>
        </div>

        <!-- آمار -->
        <div class="admin-panel" style="margin-bottom:var(--space-5)">
          <div class="admin-panel__header">
            <div class="admin-panel__title">📊 آمار نمایشی</div>
          </div>
          <div class="admin-panel__body">
            <div id="stats-list" style="display:flex;flex-direction:column;gap:var(--space-3)">
              ${content.stats.map((s,i) => `
                <div style="display:grid;grid-template-columns:60px 1fr 2fr auto;gap:var(--space-3);align-items:center">
                  <input type="text" class="admin-input stat-icon" data-idx="${i}"
                    value="${s.icon}" placeholder="آیکون" style="text-align:center;font-size:1.5rem"/>
                  <input type="text" class="admin-input stat-value" data-idx="${i}"
                    value="${s.value}" placeholder="عدد"/>
                  <input type="text" class="admin-input stat-label" data-idx="${i}"
                    value="${s.label?.fa ?? ''}" placeholder="برچسب (فارسی)"/>
                  <button class="btn btn--ghost btn--sm remove-stat-btn" data-idx="${i}"
                    style="color:var(--color-error)" aria-label="حذف">🗑</button>
                </div>
              `).join('')}
            </div>
            <button class="btn btn--outline btn--sm" id="add-stat-btn" style="margin-top:var(--space-3)">
              ➕ افزودن آمار
            </button>
          </div>
        </div>

        <!-- مدارک -->
        <div class="admin-panel" style="margin-bottom:var(--space-5)">
          <div class="admin-panel__header">
            <div class="admin-panel__title">📜 مدارک و اعتبارنامه</div>
          </div>
          <div class="admin-panel__body">
            <div id="creds-list" style="display:flex;flex-direction:column;gap:var(--space-3)">
              ${content.credentials.map((c,i) => `
                <div style="display:grid;grid-template-columns:2fr 1fr auto;gap:var(--space-3);align-items:center">
                  <input type="text" class="admin-input cred-title" data-idx="${i}"
                    value="${c.title ?? ''}" placeholder="نام مدرک"/>
                  <input type="text" class="admin-input cred-date" data-idx="${i}"
                    value="${c.date ?? ''}" placeholder="تاریخ"/>
                  <button class="btn btn--ghost btn--sm remove-cred-btn" data-idx="${i}"
                    style="color:var(--color-error)" aria-label="حذف">🗑</button>
                </div>
              `).join('')}
            </div>
            <button class="btn btn--outline btn--sm" id="add-cred-btn" style="margin-top:var(--space-3)">
              ➕ افزودن مدرک
            </button>
          </div>
        </div>

        <!-- پیش‌نمایش -->
        <div class="admin-panel" style="margin-bottom:var(--space-5)">
          <div class="admin-panel__header">
            <div class="admin-panel__title">👁 پیش‌نمایش</div>
          </div>
          <div class="admin-panel__body">
            <div id="preview-box" style="
              border:1px solid var(--border-color);border-radius:var(--radius-md);
              padding:var(--space-5);background:var(--bg-base);
              font-size:var(--text-base);line-height:2;color:var(--text-secondary);
              white-space:pre-line;min-height:120px;
            ">${content.body?.fa || '<span style="color:var(--text-muted)">متنی وارد نشده</span>'}</div>
          </div>
        </div>

        <button class="btn btn--primary btn--lg" id="save-about-btn" style="margin-bottom:var(--space-6)">
          💾 ذخیره همه تغییرات
        </button>
      </div>
    `;

    _bindEvents(content);
  }

  function _bindEvents(content) {
    /* پیش‌نمایش زنده */
    document.getElementById('about-body')?.addEventListener('input', (e) => {
      const preview = document.getElementById('preview-box');
      if (preview) preview.textContent = e.target.value || '';
    });

    /* افزودن آمار */
    document.getElementById('add-stat-btn')?.addEventListener('click', () => {
      const updated = AboutContent.get();
      updated.stats.push({ icon:'⭐', value:'0', label:{fa:'برچسب', ar:'تسمية', ur:'لیبل', az:'Etiket', tr:'Etiket', ru:'Метка', en:'Label', id:'Label'} });
      AboutContent.set(updated);
      _render();
    });

    /* حذف آمار */
    container.querySelectorAll('.remove-stat-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const updated = AboutContent.get();
        updated.stats.splice(parseInt(btn.dataset.idx), 1);
        AboutContent.set(updated);
        _render();
      });
    });

    /* افزودن مدرک */
    document.getElementById('add-cred-btn')?.addEventListener('click', () => {
      const updated = AboutContent.get();
      updated.credentials.push({ title:'', date:'' });
      AboutContent.set(updated);
      _render();
    });

    /* حذف مدرک */
    container.querySelectorAll('.remove-cred-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const updated = AboutContent.get();
        updated.credentials.splice(parseInt(btn.dataset.idx), 1);
        AboutContent.set(updated);
        _render();
      });
    });

    /* ذخیره */
    document.getElementById('save-about-btn')?.addEventListener('click', () => {
      const updated = AboutContent.get();

      updated.title    = { ...updated.title,    fa: document.getElementById('about-title')?.value?.trim() ?? '' };
      updated.subtitle = { ...updated.subtitle, fa: document.getElementById('about-subtitle')?.value?.trim() ?? '' };
      updated.body     = { fa: document.getElementById('about-body')?.value ?? '' };

      /* آمار */
      updated.stats = Array.from(container.querySelectorAll('.stat-icon')).map((el, i) => ({
        icon:  el.value,
        value: container.querySelector(`.stat-value[data-idx="${i}"]`)?.value ?? '',
        label: { fa: container.querySelector(`.stat-label[data-idx="${i}"]`)?.value ?? '' },
      }));

      /* مدارک */
      updated.credentials = Array.from(container.querySelectorAll('.cred-title')).map((el, i) => ({
        title: el.value,
        date:  container.querySelector(`.cred-date[data-idx="${i}"]`)?.value ?? '',
      }));

      AboutContent.set(updated);
      _showToast('✓ صفحه «درباره ما» ذخیره شد');
      _render();
    });
  }

  function _showToast(msg) {
    const t = document.createElement('div');
    t.setAttribute('role','alert');
    t.style.cssText = `position:fixed;bottom:24px;inset-inline-end:24px;background:#16a34a;color:white;padding:12px 20px;border-radius:8px;font-size:14px;font-weight:600;z-index:9999;box-shadow:0 8px 24px rgba(0,0,0,0.25)`;
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => { t.style.opacity='0'; t.style.transition='opacity 0.3s'; setTimeout(()=>t.remove(),300); }, 3000);
  }

  _render();
}
