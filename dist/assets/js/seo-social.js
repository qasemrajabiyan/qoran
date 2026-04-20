/**
 * ============================================================
 * FILE: seo-social.js
 * ROLE: بهینه‌سازی اشتراک‌گذاری در شبکه‌های اجتماعی
 *       واتساپ، تلگرام، توییتر، لینکدین، PWA Share API
 * VERSION: 2026.1.0
 * ============================================================
 *
 * قابلیت‌ها:
 *   ۱. پیش‌نمایش بهینه در واتساپ/تلگرام به زبان کاربر
 *   ۲. Twitter Card بهینه برای هر زبان
 *   ۳. LinkedIn Open Graph
 *   ۴. Web Share API برای PWA
 *   ۵. دکمه‌های اشتراک با متن بومی هر زبان
 *   ۶. Deep link برای APK
 *   ۷. Rich Preview برای هر نوع محتوا
 * ============================================================
 */

import { DOMAIN, LANGUAGES, PLATFORM_NAMES, PAGES } from './seo-config.js';

/* ════════════════════════════════════════════════════════════
   ۱. متون اشتراک‌گذاری به ۸ زبان
   ════════════════════════════════════════════════════════════ */
const SHARE_TEXTS = {
  shareBtn: {
    fa:'اشتراک‌گذاری', ar:'مشاركة', ur:'شیئر کریں',
    en:'Share', tr:'Paylaş', ru:'Поделиться', az:'Paylaş', id:'Bagikan',
  },
  shareVia: {
    fa:'اشتراک از طریق', ar:'مشاركة عبر', ur:'کے ذریعے شیئر کریں',
    en:'Share via', tr:'Şu yolla paylaş:', ru:'Поделиться через', az:'Vasitəsilə paylaş:', id:'Bagikan via',
  },
  copyLink: {
    fa:'کپی لینک', ar:'نسخ الرابط', ur:'لنک کاپی کریں',
    en:'Copy Link', tr:'Bağlantıyı Kopyala', ru:'Скопировать ссылку', az:'Linki kopyala', id:'Salin Tautan',
  },
  copied: {
    fa:'کپی شد ✓', ar:'تم النسخ ✓', ur:'کاپی ہوگیا ✓',
    en:'Copied ✓', tr:'Kopyalandı ✓', ru:'Скопировано ✓', az:'Kopyalandı ✓', id:'Disalin ✓',
  },
  shareMessage: {
    fa: (title, url) => `✨ ${title}\n\nاین محتوای ارزشمند را با شما به اشتراک می‌گذارم:\n${url}\n\n🌟 برکت هاب — پلتفرم رسانه‌ای اسلامی کربلا`,
    ar: (title, url) => `✨ ${title}\n\nأشارككم هذا المحتوى القيّم:\n${url}\n\n🌟 بركت هاب — منصة إعلامية إسلامية من كربلاء`,
    ur: (title, url) => `✨ ${title}\n\nیہ قیمتی مواد آپ کے ساتھ شیئر کر رہا ہوں:\n${url}\n\n🌟 برکت ہب — کربلا کا اسلامی میڈیا پلیٹ فارم`,
    en: (title, url) => `✨ ${title}\n\nSharing this valuable content with you:\n${url}\n\n🌟 Baraka Hub — Islamic Media Platform from Karbala`,
    tr: (title, url) => `✨ ${title}\n\nBu değerli içeriği sizinle paylaşıyorum:\n${url}\n\n🌟 Baraka Hub — Kerbela'dan İslami Medya Platformu`,
    ru: (title, url) => `✨ ${title}\n\nДелюсь с вами этим ценным материалом:\n${url}\n\n🌟 Baraka Hub — Исламская медиаплатформа из Кербелы`,
    az: (title, url) => `✨ ${title}\n\nBu dəyərli məzmunu sizinlə paylaşıram:\n${url}\n\n🌟 Baraka Hub — Kərbaladan İslam Media Platforması`,
    id: (title, url) => `✨ ${title}\n\nBerbagi konten berharga ini dengan Anda:\n${url}\n\n🌟 Baraka Hub — Platform Media Islam dari Karbala`,
  },
};

/* ════════════════════════════════════════════════════════════
   ۲. تولید Open Graph tags بهینه برای پیش‌نمایش
   ════════════════════════════════════════════════════════════ */
export function generateSocialPreviewTags({
  lang        = 'fa',
  pageId      = 'home',
  title       = null,
  description = null,
  image       = null,
  url         = null,
  type        = 'website',
  videoUrl    = null,
  audioUrl    = null,
}) {
  const cfg       = LANGUAGES[lang];
  const pageInfo  = PAGES[pageId];
  const _title    = title       ?? pageInfo?.titles?.[lang]       ?? PLATFORM_NAMES[lang];
  const _desc     = description ?? `${_title} — ${PLATFORM_NAMES[lang]}`;
  const _image    = image ?? `${DOMAIN}/assets/img/og-image.jpg`;
  const _url      = url   ?? `${DOMAIN}${cfg.urlPrefix}${pageInfo?.path?.replace('.html','') ?? ''}`;

  const tags = [
    /* ── Open Graph (واتساپ، فیسبوک، تلگرام) ── */
    `<meta property="og:type"                  content="${type}" />`,
    `<meta property="og:url"                   content="${_url}" />`,
    `<meta property="og:title"                 content="${_esc(_title)}" />`,
    `<meta property="og:description"           content="${_esc(_desc)}" />`,
    `<meta property="og:image"                 content="${_image}" />`,
    `<meta property="og:image:secure_url"      content="${_image}" />`,
    `<meta property="og:image:width"           content="1200" />`,
    `<meta property="og:image:height"          content="630" />`,
    `<meta property="og:image:alt"             content="${_esc(_title)}" />`,
    `<meta property="og:locale"                content="${cfg.ogLocale}" />`,
    `<meta property="og:site_name"             content="${PLATFORM_NAMES[lang]}" />`,

    /* ── Twitter/X Card ── */
    `<meta name="twitter:card"                 content="${videoUrl ? 'player' : 'summary_large_image'}" />`,
    `<meta name="twitter:site"                 content="@barakahub" />`,
    `<meta name="twitter:creator"              content="@barakahub" />`,
    `<meta name="twitter:title"                content="${_esc(_title)}" />`,
    `<meta name="twitter:description"          content="${_esc(_desc)}" />`,
    `<meta name="twitter:image"                content="${_image}" />`,
    `<meta name="twitter:image:alt"            content="${_esc(_title)}" />`,
    ...(videoUrl ? [
      `<meta name="twitter:player"             content="${videoUrl}" />`,
      `<meta name="twitter:player:width"       content="1280" />`,
      `<meta name="twitter:player:height"      content="720" />`,
    ] : []),

    /* ── تلگرام (از OG استفاده می‌کند) ── */
    /* ── واتساپ (از OG استفاده می‌کند) ── */

    /* ── لینکدین ── */
    `<meta property="linkedin:owner"           content="baraka-hub" />`,

    /* ── Telegram Channel ── */
    `<meta name="telegram:channel"             content="@barakahub" />`,
  ];

  /* ویدیو */
  if (videoUrl) {
    tags.push(
      `<meta property="og:video"               content="${videoUrl}" />`,
      `<meta property="og:video:secure_url"    content="${videoUrl}" />`,
      `<meta property="og:video:type"          content="video/mp4" />`,
      `<meta property="og:video:width"         content="1280" />`,
      `<meta property="og:video:height"        content="720" />`,
    );
  }

  /* صوت */
  if (audioUrl) {
    tags.push(
      `<meta property="og:audio"               content="${audioUrl}" />`,
      `<meta property="og:audio:type"          content="audio/mpeg" />`,
    );
  }

  return tags.join('\n');
}

/* ════════════════════════════════════════════════════════════
   ۳. Web Share API — برای PWA و موبایل
   ════════════════════════════════════════════════════════════ */
export async function shareContent({
  lang      = 'fa',
  title     = null,
  text      = null,
  url       = null,
  pageId    = 'home',
  files     = null,
}) {
  const cfg      = LANGUAGES[lang];
  const pageInfo = PAGES[pageId];
  const _title   = title ?? pageInfo?.titles?.[lang] ?? PLATFORM_NAMES[lang];
  const _url     = url   ?? `${DOMAIN}${cfg.urlPrefix}${pageInfo?.path?.replace('.html','') ?? ''}`;
  const shareMsg = SHARE_TEXTS.shareMessage[lang] ?? SHARE_TEXTS.shareMessage['en'];
  const _text    = text  ?? shareMsg(_title, _url);

  /* Web Share API (موبایل و PWA) */
  if (navigator.share) {
    try {
      const shareData = { title: _title, text: _text, url: _url };
      if (files?.length && navigator.canShare?.({ files })) {
        shareData.files = files;
      }
      await navigator.share(shareData);
      return { success: true, method: 'native' };
    } catch (err) {
      if (err.name === 'AbortError') return { success: false, method: 'cancelled' };
    }
  }

  /* fallback: کپی لینک */
  try {
    await navigator.clipboard.writeText(_url);
    return { success: true, method: 'clipboard' };
  } catch {
    return { success: false, method: 'failed' };
  }
}

/* ════════════════════════════════════════════════════════════
   ۴. Deep Link برای APK
   ════════════════════════════════════════════════════════════ */
export function generateDeepLink(pageId, params = {}) {
  const path   = PAGES[pageId]?.path?.replace('.html','') ?? '/';
  const query  = Object.keys(params).length
    ? '?' + new URLSearchParams(params).toString()
    : '';
  return {
    web:    `${DOMAIN}${path}${query}`,
    app:    `barakahub://${path.slice(1)}${query}`,
    intent: `intent://${DOMAIN.replace('https://','')}${path}${query}#Intent;scheme=https;package=com.barakahub.app;end`,
  };
}

/* ════════════════════════════════════════════════════════════
   ۵. رندر دکمه‌های اشتراک‌گذاری
   ════════════════════════════════════════════════════════════ */
export function renderShareButtons({
  lang    = 'fa',
  pageId  = 'home',
  title   = null,
  url     = null,
  style   = 'icon', /* 'icon' | 'button' | 'mini' */
} = {}) {
  const cfg      = LANGUAGES[lang];
  const pageInfo = PAGES[pageId];
  const _title   = title ?? pageInfo?.titles?.[lang] ?? PLATFORM_NAMES[lang];
  const _url     = url   ?? `${DOMAIN}${cfg.urlPrefix}${pageInfo?.path?.replace('.html','') ?? ''}`;
  const shareMsg = (SHARE_TEXTS.shareMessage[lang] ?? SHARE_TEXTS.shareMessage['en'])(_title, _url);
  const copyLbl  = SHARE_TEXTS.copyLink[lang] ?? 'Copy';
  const shareLbl = SHARE_TEXTS.shareBtn[lang] ?? 'Share';

  const encodedUrl  = encodeURIComponent(_url);
  const encodedText = encodeURIComponent(shareMsg);
  const encodedTitle= encodeURIComponent(_title);

  const platforms = [
    {
      id:    'whatsapp',
      icon:  `<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>`,
      color: '#25D366',
      label: 'WhatsApp',
      href:  `https://api.whatsapp.com/send?text=${encodedText}`,
      target:'_blank',
    },
    {
      id:    'telegram',
      icon:  `<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>`,
      color: '#0088cc',
      label: 'Telegram',
      href:  `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`,
      target:'_blank',
    },
    {
      id:    'twitter',
      icon:  `<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>`,
      color: '#000000',
      label: 'X (Twitter)',
      href:  `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}&via=barakahub`,
      target:'_blank',
    },
    {
      id:    'linkedin',
      icon:  `<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>`,
      color: '#0A66C2',
      label: 'LinkedIn',
      href:  `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      target:'_blank',
    },
  ];

  /* دکمه Native Share (PWA) */
  const hasNativeShare = !!navigator.share;

  if (style === 'mini') {
    return `
      <div class="share-btns share-btns--mini" style="display:flex;gap:6px;align-items:center">
        ${platforms.slice(0,2).map(p => `
          <a href="${p.href}" target="${p.target}" rel="noopener noreferrer"
            style="color:${p.color};display:flex;align-items:center;padding:4px;"
            aria-label="${p.label}" title="${p.label}">
            ${p.icon}
          </a>
        `).join('')}
        ${hasNativeShare ? `
          <button class="share-native-btn" data-page-id="${pageId}" data-lang="${lang}"
            style="background:none;border:none;cursor:pointer;color:var(--text-secondary);padding:4px;"
            aria-label="${shareLbl}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
              <polyline points="16 6 12 2 8 6"/>
              <line x1="12" y1="2" x2="12" y2="15"/>
            </svg>
          </button>
        ` : ''}
        <button class="share-copy-btn" data-url="${_url}" data-lang="${lang}"
          style="background:none;border:none;cursor:pointer;color:var(--text-secondary);padding:4px;"
          aria-label="${copyLbl}" title="${copyLbl}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
          </svg>
        </button>
      </div>
    `;
  }

  return `
    <div class="share-panel" style="
      background:var(--bg-surface);border:1px solid var(--border-color);
      border-radius:var(--radius-xl);padding:var(--space-5);
    ">
      <div style="font-size:var(--text-sm);font-weight:700;color:var(--text-primary);margin-bottom:var(--space-4);display:flex;align-items:center;gap:8px">
        <span>🔗</span>
        <span>${SHARE_TEXTS.shareVia[lang] ?? 'Share via'}</span>
      </div>

      <!-- پلتفرم‌ها -->
      <div style="display:flex;gap:var(--space-3);flex-wrap:wrap;margin-bottom:var(--space-4)">
        ${platforms.map(p => `
          <a href="${p.href}" target="${p.target}" rel="noopener noreferrer"
            class="share-platform-btn"
            style="
              display:flex;flex-direction:column;align-items:center;gap:6px;
              background:var(--bg-surface-2);border:1px solid var(--border-color);
              border-radius:var(--radius-lg);padding:var(--space-3) var(--space-4);
              text-decoration:none;transition:all 0.2s;min-width:72px;
              color:${p.color};
            "
            aria-label="${p.label}"
            onmouseover="this.style.background='${p.color}22'"
            onmouseout="this.style.background=''"
          >
            ${p.icon}
            <span style="font-size:10px;font-weight:600;color:var(--text-secondary)">${p.label}</span>
          </a>
        `).join('')}

        ${hasNativeShare ? `
          <button class="share-native-btn" data-page-id="${pageId}" data-lang="${lang}"
            style="
              display:flex;flex-direction:column;align-items:center;gap:6px;
              background:var(--bg-surface-2);border:1px solid var(--border-color);
              border-radius:var(--radius-lg);padding:var(--space-3) var(--space-4);
              cursor:pointer;transition:all 0.2s;min-width:72px;color:var(--color-primary-500);
            "
            aria-label="${shareLbl}"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
              <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
            </svg>
            <span style="font-size:10px;font-weight:600;color:var(--text-secondary)">${shareLbl}</span>
          </button>
        ` : ''}
      </div>

      <!-- کپی لینک -->
      <div style="display:flex;align-items:center;gap:var(--space-2);background:var(--bg-surface-2);border:1px solid var(--border-color);border-radius:var(--radius-lg);padding:var(--space-2) var(--space-3)">
        <input type="text" value="${_url}" readonly
          style="flex:1;background:none;border:none;outline:none;font-size:var(--text-xs);color:var(--text-secondary);direction:ltr;min-width:0"
          aria-label="لینک صفحه"
        />
        <button class="share-copy-btn" data-url="${_url}" data-lang="${lang}"
          style="background:var(--color-primary-500);border:none;color:white;border-radius:var(--radius-md);padding:6px 14px;font-size:var(--text-xs);font-weight:600;cursor:pointer;white-space:nowrap;flex-shrink:0"
          aria-label="${copyLbl}"
        >
          📋 ${copyLbl}
        </button>
      </div>
    </div>
  `;
}

/* ════════════════════════════════════════════════════════════
   ۶. Event Bindings — اتصال دکمه‌ها
   ════════════════════════════════════════════════════════════ */
export function bindShareEvents(container, lang = 'fa') {
  if (!container) return;

  /* دکمه‌های کپی */
  container.querySelectorAll('.share-copy-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const url      = btn.dataset.url ?? window.location.href;
      const copyLbl  = SHARE_TEXTS.copyLink[lang]  ?? 'Copy';
      const copiedLbl= SHARE_TEXTS.copied[lang]    ?? 'Copied ✓';
      const orig     = btn.textContent;

      try {
        await navigator.clipboard.writeText(url);
        btn.textContent = copiedLbl;
        btn.style.background = '#16a34a';
        setTimeout(() => {
          btn.textContent   = orig;
          btn.style.background = '';
        }, 2000);
      } catch {
        /* fallback */
        const ta = document.createElement('textarea');
        ta.value = url;
        ta.style.position = 'fixed';
        ta.style.opacity  = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        btn.textContent = copiedLbl;
        setTimeout(() => { btn.textContent = orig; }, 2000);
      }
    });
  });

  /* دکمه Native Share */
  container.querySelectorAll('.share-native-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const pageId = btn.dataset.pageId ?? 'home';
      const lang   = btn.dataset.lang   ?? 'fa';
      const result = await shareContent({ lang, pageId });
      if (result.method === 'clipboard') {
        /* نمایش پیام کپی */
        const toast = document.createElement('div');
        toast.setAttribute('role','alert');
        toast.style.cssText = 'position:fixed;bottom:24px;inset-inline-end:24px;background:#2a9d8f;color:white;padding:10px 18px;border-radius:8px;font-size:13px;font-weight:600;z-index:9999';
        toast.textContent = SHARE_TEXTS.copied[lang] ?? 'Copied ✓';
        document.body.appendChild(toast);
        setTimeout(() => { toast.style.opacity='0'; toast.style.transition='opacity 0.3s'; setTimeout(()=>toast.remove(),300); }, 2500);
      }
    });
  });
}

/* ════════════════════════════════════════════════════════════
   ۷. inject Social Preview tags به DOM
   ════════════════════════════════════════════════════════════ */
export function injectSocialTags(options) {
  if (!document) return;

  const tags = generateSocialPreviewTags(options);
  document.querySelectorAll('[data-social-tag]').forEach(el => el.remove());

  const frag = document.createRange().createContextualFragment(
    tags.replace(/<(meta|link)[^>]*>/g, match =>
      match.replace('>', ' data-social-tag="true">')
    )
  );
  document.head.appendChild(frag);
}

/* ════════════════════════════════════════════════════════════
   ۸. آپدیت خودکار هنگام تغییر زبان
   ════════════════════════════════════════════════════════════ */
export function initSocialSEO(i18nInstance, pageId = 'home') {
  if (!i18nInstance) return;

  const _update = () => {
    const lang = i18nInstance.lang;
    injectSocialTags({ lang, pageId });
  };

  _update();
  i18nInstance.onChange(_update);
}

/* ════════════════════════════════════════════════════════════
   ۹. Structured Data برای Social Profile
   ════════════════════════════════════════════════════════════ */
export function generateSocialProfileSchema() {
  return {
    '@context': 'https://schema.org',
    '@type':    'Organization',
    '@id':      `${DOMAIN}/#organization`,
    'name':     'Baraka Hub',
    'url':      DOMAIN,
    'sameAs': [
      'https://twitter.com/barakahub',
      'https://www.facebook.com/barakahub',
      'https://www.instagram.com/barakahub',
      'https://t.me/barakahub',
      'https://www.youtube.com/@barakahub',
      'https://www.linkedin.com/company/barakahub',
    ],
    'contactPoint': {
      '@type':       'ContactPoint',
      'contactType': 'customer support',
      'url':         'https://t.me/barakahub',
    },
  };
}

/* ── helper ───────────────────────────────────────────────── */
function _esc(s) {
  return (s ?? '').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
