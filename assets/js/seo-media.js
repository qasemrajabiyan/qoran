/**
 * ============================================================
 * FILE: seo-media.js
 * ROLE: سئوی کامل و خودکار ویدیو، صوت و تصویر
 *       به ۸ زبان با Claude API + Schema JSON-LD
 * VERSION: 2026.1.0
 * ============================================================
 *
 * قابلیت‌ها:
 *   ۱. VideoObject schema کامل برای هر ویدیو
 *   ۲. AudioObject + PodcastEpisode schema برای صوت
 *   ۳. ImageObject schema با alt text هوشمند به ۸ زبان
 *   ۴. Video sitemap مجزا
 *   ۵. Open Graph video/audio tags
 *   ۶. Twitter Player Card برای ویدیو
 *   ۷. Auto alt-text با Claude Vision
 *   ۸. Transcript-based SEO (متن ویدیو/صوت → سئو)
 *   ۹. Thumbnail optimization
 *   ۱۰. Media sitemap
 * ============================================================
 */

import { DOMAIN, LANGUAGES, PLATFORM_NAMES, PAGES } from './seo-config.js';

/* ════════════════════════════════════════════════════════════
   ۱. VIDEO SEO — Schema + Tags کامل
   ════════════════════════════════════════════════════════════ */

/**
 * تولید VideoObject schema کامل برای یک ویدیو
 * @param {Object} video
 * @param {string} lang
 */
export function generateVideoSchema(video, lang = 'fa') {
  const langCfg = LANGUAGES[lang];
  const url     = `${DOMAIN}${langCfg?.urlPrefix ?? ''}${video.pageUrl ?? '/quran.html'}`;

  return {
    '@context':       'https://schema.org',
    '@type':          'VideoObject',
    '@id':            `${DOMAIN}/#video-${video.id ?? Date.now()}`,
    'name':           video.title?.[lang] ?? video.title?.fa ?? video.title ?? '',
    'description':    video.description?.[lang] ?? video.description?.fa ?? '',
    'thumbnailUrl':   video.thumbnailUrl ?? `${DOMAIN}/assets/img/og-image.jpg`,
    'uploadDate':     video.uploadDate ?? new Date().toISOString(),
    'duration':       video.duration ? `PT${Math.floor(video.duration/60)}M${video.duration%60}S` : undefined,
    'contentUrl':     video.url ?? '',
    'embedUrl':       video.embedUrl ?? video.url ?? '',
    'url':            url,
    'inLanguage':     lang,
    'isAccessibleForFree': video.isFree !== false,
    'potentialAction': {
      '@type':  'WatchAction',
      'target': url,
    },
    'author': {
      '@id': `${DOMAIN}/#sheikh`,
    },
    'publisher': {
      '@id': `${DOMAIN}/#organization`,
    },
    'transcript': video.transcript?.[lang] ?? video.transcript?.fa ?? undefined,
    'keywords':   video.keywords?.[lang] ?? '',
    'genre':      'Islamic Education',
    'about': {
      '@type': 'Thing',
      'name':  video.topic?.[lang] ?? 'Holy Quran Reflection',
    },
    'hasPart': video.chapters?.map((ch, i) => ({
      '@type':    'Clip',
      'name':     ch.title?.[lang] ?? ch.title ?? `Chapter ${i + 1}`,
      'startOffset': ch.startTime ?? 0,
      'endOffset':   ch.endTime ?? undefined,
      'url':      `${url}#t=${ch.startTime ?? 0}`,
    })),
    'interactionStatistic': {
      '@type':                'InteractionCounter',
      'interactionType':      'https://schema.org/WatchAction',
      'userInteractionCount': video.viewCount ?? 0,
    },
  };
}

/**
 * تولید Open Graph video tags
 */
export function generateVideoOGTags(video, lang = 'fa') {
  const title = video.title?.[lang] ?? video.title?.fa ?? '';
  const desc  = video.description?.[lang] ?? video.description?.fa ?? '';

  return [
    `<meta property="og:type"                  content="video.other" />`,
    `<meta property="og:title"                 content="${_esc(title)}" />`,
    `<meta property="og:description"           content="${_esc(desc)}" />`,
    `<meta property="og:video"                 content="${video.url ?? ''}" />`,
    `<meta property="og:video:url"             content="${video.url ?? ''}" />`,
    `<meta property="og:video:secure_url"      content="${video.url ?? ''}" />`,
    `<meta property="og:video:type"            content="video/mp4" />`,
    `<meta property="og:video:width"           content="${video.width ?? 1280}" />`,
    `<meta property="og:video:height"          content="${video.height ?? 720}" />`,
    `<meta property="og:image"                 content="${video.thumbnailUrl ?? ''}" />`,
    `<meta property="og:image:width"           content="1280" />`,
    `<meta property="og:image:height"          content="720" />`,
  ].join('\n');
}

/**
 * تولید Twitter Player Card برای ویدیو
 */
export function generateVideoTwitterCard(video, lang = 'fa') {
  const title = video.title?.[lang] ?? video.title?.fa ?? '';
  const desc  = video.description?.[lang] ?? video.description?.fa ?? '';

  return [
    `<meta name="twitter:card"          content="player" />`,
    `<meta name="twitter:title"         content="${_esc(title)}" />`,
    `<meta name="twitter:description"   content="${_esc(desc)}" />`,
    `<meta name="twitter:image"         content="${video.thumbnailUrl ?? ''}" />`,
    `<meta name="twitter:player"        content="${video.embedUrl ?? video.url ?? ''}" />`,
    `<meta name="twitter:player:width"  content="1280" />`,
    `<meta name="twitter:player:height" content="720" />`,
  ].join('\n');
}

/* ════════════════════════════════════════════════════════════
   ۲. AUDIO SEO — Schema + Tags کامل
   ════════════════════════════════════════════════════════════ */

/**
 * تولید AudioObject schema
 */
export function generateAudioSchema(audio, lang = 'fa') {
  const langCfg = LANGUAGES[lang];
  const url     = `${DOMAIN}${langCfg?.urlPrefix ?? ''}${audio.pageUrl ?? '/quran.html'}`;

  return {
    '@context':    'https://schema.org',
    '@type':       ['AudioObject', 'PodcastEpisode'],
    '@id':         `${DOMAIN}/#audio-${audio.id ?? Date.now()}`,
    'name':        audio.title?.[lang] ?? audio.title?.fa ?? '',
    'description': audio.description?.[lang] ?? audio.description?.fa ?? '',
    'contentUrl':  audio.url ?? '',
    'duration':    audio.duration ? `PT${Math.floor(audio.duration/60)}M${audio.duration%60}S` : undefined,
    'encodingFormat': audio.format ?? 'audio/mpeg',
    'inLanguage':  lang,
    'url':         url,
    'uploadDate':  audio.uploadDate ?? new Date().toISOString(),
    'isAccessibleForFree': audio.isFree !== false,
    'author': { '@id': `${DOMAIN}/#sheikh` },
    'publisher': { '@id': `${DOMAIN}/#organization` },
    'transcript': audio.transcript?.[lang] ?? audio.transcript?.fa ?? undefined,
    'keywords':   audio.keywords?.[lang] ?? '',
    'genre':      'Islamic Education',
    'about': {
      '@type': 'Thing',
      'name':  audio.topic?.[lang] ?? 'Holy Quran Recitation',
    },
    'partOfSeries': {
      '@type':     'PodcastSeries',
      '@id':       `${DOMAIN}/#podcast-series`,
      'name':      PLATFORM_NAMES[lang],
      'url':       `${DOMAIN}${langCfg?.urlPrefix ?? ''}`,
      'inLanguage': lang,
    },
    'interactionStatistic': {
      '@type':           'InteractionCounter',
      'interactionType': 'https://schema.org/ListenAction',
      'userInteractionCount': audio.listenCount ?? 0,
    },
    'potentialAction': {
      '@type':  'ListenAction',
      'target': url,
    },
  };
}

/**
 * تولید Open Graph audio tags
 */
export function generateAudioOGTags(audio, lang = 'fa') {
  const title = audio.title?.[lang] ?? audio.title?.fa ?? '';
  const desc  = audio.description?.[lang] ?? audio.description?.fa ?? '';

  return [
    `<meta property="og:type"        content="music.song" />`,
    `<meta property="og:title"       content="${_esc(title)}" />`,
    `<meta property="og:description" content="${_esc(desc)}" />`,
    `<meta property="og:audio"       content="${audio.url ?? ''}" />`,
    `<meta property="og:audio:type"  content="${audio.format ?? 'audio/mpeg'}" />`,
  ].join('\n');
}

/* ════════════════════════════════════════════════════════════
   ۳. IMAGE SEO — Schema + Alt Text هوشمند
   ════════════════════════════════════════════════════════════ */

/**
 * تولید ImageObject schema
 */
export function generateImageSchema(image, lang = 'fa') {
  return {
    '@context':   'https://schema.org',
    '@type':      'ImageObject',
    '@id':        `${DOMAIN}/#image-${image.id ?? Date.now()}`,
    'url':        image.url ?? '',
    'contentUrl': image.url ?? '',
    'name':       image.title?.[lang] ?? image.title?.fa ?? '',
    'description':image.description?.[lang] ?? image.description?.fa ?? '',
    'alternateName': image.altText?.[lang] ?? image.altText?.fa ?? '',
    'width':      image.width ?? 1200,
    'height':     image.height ?? 630,
    'inLanguage': lang,
    'encodingFormat': image.format ?? 'image/jpeg',
    'uploadDate': image.uploadDate ?? new Date().toISOString(),
    'author':     { '@id': `${DOMAIN}/#organization` },
    'publisher':  { '@id': `${DOMAIN}/#organization` },
    'license':    `${DOMAIN}/license`,
    'acquireLicensePage': `${DOMAIN}/contact`,
  };
}

/**
 * تولید خودکار alt text با Claude API
 * برای تصاویر آپلود‌شده توسط ادمین
 */
export async function generateSmartAltText(imageUrl, contextFa = '', lang = 'all') {
  const apiKey = localStorage.getItem('mh_claude_api_key');
  if (!apiKey) return null;

  const systemPrompt = `You are an SEO specialist generating alt text for an Islamic media platform from Karbala.
Rules:
- Alt text must be descriptive, concise (max 125 chars per language)
- Must be relevant to Islamic/Quranic context when applicable
- Return ONLY valid JSON`;

  const langs   = lang === 'all' ? Object.keys(LANGUAGES) : [lang];
  const prompt  = `Generate SEO-optimized alt text for this image.
Image URL: ${imageUrl}
Context (Persian): ${contextFa}
Languages: ${langs.join(', ')}

Return ONLY this JSON:
{
  ${langs.map(l => `"${l}": "alt text in ${LANGUAGES[l]?.englishName ?? l}"`).join(',\n  ')}
}`;

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model:      'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system:     systemPrompt,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'url', url: imageUrl } },
            { type: 'text',  text: prompt },
          ],
        }],
      }),
    });
    const data = await res.json();
    const text = data.content?.[0]?.text?.trim();
    if (!text) return null;
    return JSON.parse(text.replace(/```json\n?|\n?```/g, '').trim());
  } catch (err) {
    console.error('[SEO-Media] Alt text error:', err);
    return null;
  }
}

/* ════════════════════════════════════════════════════════════
   ۴. MEDIA SITEMAP — sitemap ویدیو و تصویر
   ════════════════════════════════════════════════════════════ */

/**
 * تولید video sitemap
 */
export function generateVideoSitemap(videos = []) {
  const now = new Date().toISOString().split('T')[0];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
`;

  videos.forEach(video => {
    Object.keys(LANGUAGES).forEach(lang => {
      const langCfg = LANGUAGES[lang];
      const pageUrl = `${DOMAIN}${langCfg.urlPrefix}${video.pageUrl?.replace('.html','') ?? '/quran'}`;
      const title   = video.title?.[lang] ?? video.title?.fa ?? '';
      const desc    = (video.description?.[lang] ?? video.description?.fa ?? '').slice(0, 2048);

      if (!video.url) return;

      xml += `
  <url>
    <loc>${pageUrl}</loc>
    <lastmod>${now}</lastmod>
    <video:video>
      <video:thumbnail_loc>${video.thumbnailUrl ?? DOMAIN + '/assets/img/og-image.jpg'}</video:thumbnail_loc>
      <video:title>${_xmlEsc(title)}</video:title>
      <video:description>${_xmlEsc(desc)}</video:description>
      <video:content_loc>${video.url}</video:content_loc>
      ${video.embedUrl ? `<video:player_loc>${video.embedUrl}</video:player_loc>` : ''}
      ${video.duration ? `<video:duration>${video.duration}</video:duration>` : ''}
      <video:publication_date>${video.uploadDate ?? now}</video:publication_date>
      <video:family_friendly>yes</video:family_friendly>
      <video:live>no</video:live>
      ${video.isFree !== false ? '<video:requires_subscription>no</video:requires_subscription>' : '<video:requires_subscription>yes</video:requires_subscription>'}
      <video:uploader info="${DOMAIN}/about.html">${PLATFORM_NAMES['en']}</video:uploader>
      <video:platform relationship="allow">web mobile tv</video:platform>
    </video:video>
  </url>
`;
    });
  });

  xml += `</urlset>`;
  return xml;
}

/**
 * تولید image sitemap
 */
export function generateImageSitemap(images = []) {
  const now = new Date().toISOString().split('T')[0];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
`;

  images.forEach(image => {
    Object.keys(LANGUAGES).forEach(lang => {
      const langCfg = LANGUAGES[lang];
      const pageUrl = `${DOMAIN}${langCfg.urlPrefix}${image.pageUrl?.replace('.html','') ?? ''}`;
      const caption = image.altText?.[lang] ?? image.altText?.fa ?? image.title?.[lang] ?? '';
      const title   = image.title?.[lang] ?? image.title?.fa ?? '';

      xml += `
  <url>
    <loc>${pageUrl}</loc>
    <lastmod>${now}</lastmod>
    <image:image>
      <image:loc>${image.url}</image:loc>
      <image:caption>${_xmlEsc(caption)}</image:caption>
      <image:title>${_xmlEsc(title)}</image:title>
      <image:license>${DOMAIN}/license</image:license>
    </image:image>
  </url>
`;
    });
  });

  xml += `</urlset>`;
  return xml;
}

/* ════════════════════════════════════════════════════════════
   ۵. AUTO-MEDIA-SEO — تولید خودکار هنگام آپلود
   ════════════════════════════════════════════════════════════ */

/**
 * پردازش خودکار ویدیو آپلود‌شده
 * هنگام آپلود ویدیو توسط ادمین فراخوانی می‌شود
 */
export async function autoProcessVideoSEO({
  videoUrl,
  ayahId,
  titleFa,
  descriptionFa,
  thumbnailUrl = null,
  transcript   = null,  /* اگر قبلاً transcribe شده */
  duration     = null,
  onProgress   = null,
}) {
  const result = { schemas: {}, ogTags: {}, twitterCards: {}, transcriptData: null };

  onProgress?.('start', 5);

  /* ── مرحله ۱: Transcription با Whisper ──────────────────
     اگر transcript ندارد، از Whisper استفاده می‌کند
     تا محتوای واقعی استاد را بخواند
  ─────────────────────────────────────────────────────── */
  let transcriptData = transcript;
  if (!transcriptData && videoUrl) {
    onProgress?.('transcribing', 10);
    transcriptData = await transcribeWithWhisper(videoUrl, 'video');
    if (transcriptData) {
      console.log('[SEO-Media] ✓ Whisper transcript:', transcriptData.text?.slice(0, 100) + '...');
    }
  }
  result.transcriptData = transcriptData;

  /* ── مرحله ۲: تولید سئو از محتوای واقعی ────────────────
     اگر transcript داریم → سئو از محتوای واقعی استاد
     اگر ندارید → سئو از عنوان و توضیح ادمین
  ─────────────────────────────────────────────────────── */
  let transcriptSEO = null;
  if (transcriptData?.text) {
    onProgress?.('analyzing', 25);
    transcriptSEO = await _generateSEOFromTranscript(transcriptData, 'video');
  }

  onProgress?.('translating', 45);

  /* ترجمه عنوان و توضیح پایه */
  const titles = typeof titleFa === 'string'
    ? await _translateMedia(titleFa, 'title')
    : titleFa;

  const descriptions = typeof descriptionFa === 'string'
    ? await _translateMedia(descriptionFa, 'description')
    : descriptionFa;

  onProgress?.('keywords', 65);

  /* keywords — از transcript اگر موجود است، وگرنه از عنوان */
  const keywords = transcriptSEO
    ? Object.fromEntries(Object.keys(LANGUAGES).map(l => [l, transcriptSEO[l]?.keywords ?? '']))
    : await _generateMediaKeywords(titleFa, descriptionFa);

  onProgress?.('schema', 80);

  /* ادغام: title/desc از ادمین + محتوای غنی از transcript */
  const videoData = {
    id:           ayahId,
    url:          videoUrl,
    thumbnailUrl: thumbnailUrl ?? `${DOMAIN}/assets/img/og-image.jpg`,
    /* عنوان: از transcript اگر بهتر است، وگرنه از ادمین */
    title: Object.fromEntries(Object.keys(LANGUAGES).map(l => [
      l,
      transcriptSEO?.[l]?.title || titles[l] || titleFa,
    ])),
    /* توضیح: از transcript (محتوای واقعی) */
    description: Object.fromEntries(Object.keys(LANGUAGES).map(l => [
      l,
      transcriptSEO?.[l]?.description || descriptions[l] || descriptionFa,
    ])),
    keywords,
    /* خلاصه واقعی از transcript */
    transcriptSummary: transcriptSEO
      ? Object.fromEntries(Object.keys(LANGUAGES).map(l => [l, transcriptSEO[l]?.transcript_summary ?? '']))
      : {},
    /* موضوعات کلیدی از transcript */
    keyTopics: transcriptSEO
      ? Object.fromEntries(Object.keys(LANGUAGES).map(l => [l, (transcriptSEO[l]?.key_topics ?? []).join(', ')]))
      : {},
    featuredSnippet: transcriptSEO
      ? Object.fromEntries(Object.keys(LANGUAGES).map(l => [l, transcriptSEO[l]?.featured_snippet ?? '']))
      : {},
    transcript: transcriptData
      ? { fa: transcriptData.text }
      : null,
    duration: duration ?? transcriptData?.duration ?? null,
    pageUrl:     '/quran.html',
    uploadDate:  new Date().toISOString(),
    isFree:      false,
  };

  /* تولید schema و tags برای هر ۸ زبان */
  Object.keys(LANGUAGES).forEach(lang => {
    result.schemas[lang]      = generateVideoSchema(videoData, lang);
    result.ogTags[lang]       = generateVideoOGTags(videoData, lang);
    result.twitterCards[lang] = generateVideoTwitterCard(videoData, lang);
  });

  /* ذخیره اطلاعات transcript هم در result */
  result.transcriptSEO = transcriptSEO;

  onProgress?.('done', 100);
  _saveMediaSEO(ayahId, 'video', result);
  return result;
}

/**
 * پردازش خودکار صوت آپلود‌شده
 */
export async function autoProcessAudioSEO({
  audioUrl,
  ayahId,
  titleFa,
  descriptionFa,
  transcript = null,
  duration   = null,
  format     = 'audio/mpeg',
  onProgress = null,
}) {
  const result = { schemas: {}, ogTags: {}, transcriptData: null };

  onProgress?.('start', 10);

  /* ── Whisper: استخراج متن از صوت استاد ─────────────── */
  let transcriptData = transcript;
  if (!transcriptData && audioUrl) {
    onProgress?.('transcribing', 20);
    transcriptData = await transcribeWithWhisper(audioUrl, 'audio');
  }
  result.transcriptData = transcriptData;

  /* ── سئو از محتوای واقعی صوت ────────────────────────── */
  let transcriptSEO = null;
  if (transcriptData?.text) {
    onProgress?.('analyzing', 35);
    transcriptSEO = await _generateSEOFromTranscript(transcriptData, 'audio');
  }

  onProgress?.('translating', 55);

  const titles = typeof titleFa === 'string'
    ? await _translateMedia(titleFa, 'title')
    : titleFa;

  const descriptions = typeof descriptionFa === 'string'
    ? await _translateMedia(descriptionFa, 'description')
    : descriptionFa;

  onProgress?.('schema', 80);

  const audioData = {
    id: ayahId, url: audioUrl, format,
    title: Object.fromEntries(Object.keys(LANGUAGES).map(l => [
      l, transcriptSEO?.[l]?.title || titles[l] || titleFa,
    ])),
    description: Object.fromEntries(Object.keys(LANGUAGES).map(l => [
      l, transcriptSEO?.[l]?.description || descriptions[l] || descriptionFa,
    ])),
    transcript: transcriptData ? { fa: transcriptData.text } : null,
    duration: duration ?? transcriptData?.duration ?? null,
    pageUrl: '/quran.html',
    uploadDate: new Date().toISOString(),
    isFree: false,
  };

  Object.keys(LANGUAGES).forEach(lang => {
    result.schemas[lang] = generateAudioSchema(audioData, lang);
    result.ogTags[lang]  = generateAudioOGTags(audioData, lang);
  });

  result.transcriptSEO = transcriptSEO;

  onProgress?.('done', 100);
  _saveMediaSEO(ayahId, 'audio', result);
  return result;
}

/**
 * پردازش خودکار تصویر آپلود‌شده
 */
export async function autoProcessImageSEO({
  imageUrl,
  imageId,
  contextFa = '',
  pageUrl   = '/',
  width     = 1200,
  height    = 630,
  onProgress = null,
}) {
  onProgress?.('start', 10);

  /* تولید alt text با Claude Vision */
  const altTexts = await generateSmartAltText(imageUrl, contextFa) ?? {};

  onProgress?.('alt_text', 60);

  const titles = altTexts;

  const imageData = {
    id: imageId, url: imageUrl,
    altText: altTexts, title: titles,
    description: altTexts,
    width, height, pageUrl,
    uploadDate: new Date().toISOString(),
  };

  const schemas = {};
  Object.keys(LANGUAGES).forEach(lang => {
    schemas[lang] = generateImageSchema(imageData, lang);
  });

  onProgress?.('done', 100);
  _saveMediaSEO(imageId, 'image', { schemas, altTexts });
  return { schemas, altTexts };
}

/* ════════════════════════════════════════════════════════════
   ۶. inject Media SEO به DOM
   ════════════════════════════════════════════════════════════ */
export function injectMediaSEO(mediaId, mediaType, lang) {
  const data = _loadMediaSEO(mediaId, mediaType);
  if (!data) return;

  const d = data[lang];
  if (!d) return;

  /* Schema */
  if (data.schemas?.[lang]) {
    const id  = `schema-${mediaType}-${mediaId}`;
    let   el  = document.getElementById(id);
    if (!el) { el = document.createElement('script'); el.type='application/ld+json'; el.id=id; document.head.appendChild(el); }
    el.textContent = JSON.stringify(data.schemas[lang], null, 2);
  }

  /* OG Tags */
  if (data.ogTags?.[lang]) {
    document.querySelectorAll('[data-media-og]').forEach(e => e.remove());
    const frag = document.createRange().createContextualFragment(
      data.ogTags[lang].replace(/<meta/g, '<meta data-media-og="true"')
    );
    document.head.appendChild(frag);
  }

  /* Twitter Cards */
  if (mediaType === 'video' && data.twitterCards?.[lang]) {
    document.querySelectorAll('[data-media-twitter]').forEach(e => e.remove());
    const frag = document.createRange().createContextualFragment(
      data.twitterCards[lang].replace(/<meta/g, '<meta data-media-twitter="true"')
    );
    document.head.appendChild(frag);
  }
}

/* ════════════════════════════════════════════════════════════
   ۷. داشبورد ادمین — نمایش سئوی مدیا
   ════════════════════════════════════════════════════════════ */
export function renderMediaSEOPanel(container, {
  mediaId, mediaType, mediaUrl,
  titleFa, descriptionFa,
  thumbnailUrl, onApprove,
}) {
  if (!container) return;

  const existing = _loadMediaSEO(mediaId, mediaType);
  const langs    = Object.keys(LANGUAGES);

  container.innerHTML = `
    <div class="admin-panel" style="margin-top:var(--space-4);border:2px solid rgba(59,130,246,0.3)">
      <div class="admin-panel__header" style="background:linear-gradient(135deg,rgba(59,130,246,0.08),rgba(59,130,246,0.02))">
        <div class="admin-panel__title" style="display:flex;align-items:center;gap:8px">
          <span>${mediaType==='video'?'🎬':mediaType==='audio'?'🎵':'🖼'}</span>
          سئوی ${mediaType==='video'?'ویدیو':mediaType==='audio'?'صوت':'تصویر'} — ۸ زبان
        </div>
        <div style="display:flex;gap:var(--space-2);align-items:center">
          ${existing ? '<span class="admin-badge admin-badge--done" style="font-size:10px">✓ تولید شده</span>' : ''}
          <button class="btn btn--primary btn--sm" id="media-seo-gen-btn" type="button">
            🤖 تولید سئو خودکار
          </button>
        </div>
      </div>
      <div class="admin-panel__body">

        <!-- Progress -->
        <div id="media-seo-progress" style="display:none;margin-bottom:var(--space-4)">
          <div id="media-seo-lbl" style="font-size:var(--text-sm);color:var(--text-secondary);margin-bottom:var(--space-2)">در حال پردازش...</div>
          <div style="background:var(--bg-surface-2);border-radius:var(--radius-full);height:8px;overflow:hidden">
            <div id="media-seo-bar" style="height:100%;background:linear-gradient(90deg,#3b82f6,#2a9d8f);width:0%;transition:width 0.4s ease;border-radius:var(--radius-full)"></div>
          </div>
        </div>

        <!-- نتایج -->
        <div id="media-seo-results" style="display:${existing?'block':'none'}">

          <!-- تب‌ها -->
          <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:var(--space-3)">
            ${langs.map((lang,i)=>`
              <button class="btn btn--${i===0?'primary':'outline'} btn--sm media-seo-tab" data-lang="${lang}" style="font-size:10px">
                ${LANGUAGES[lang].flag} ${LANGUAGES[lang].nativeName}
              </button>
            `).join('')}
          </div>

          <!-- محتوای هر زبان -->
          ${langs.map((lang,i)=>`
            <div class="media-seo-panel" data-lang="${lang}" style="display:${i===0?'block':'none'}">
              <div style="display:flex;flex-direction:column;gap:var(--space-2)">

                <div class="admin-field">
                  <label class="admin-label" style="font-size:var(--text-xs)">
                    ${mediaType==='image'?'Alt Text':'Title'}
                  </label>
                  <input type="text" class="admin-input media-seo-title" data-lang="${lang}"
                    id="mt-${lang}" dir="${LANGUAGES[lang].dir}" style="font-size:var(--text-xs)"/>
                </div>

                <div class="admin-field">
                  <label class="admin-label" style="font-size:var(--text-xs)">Description</label>
                  <textarea class="admin-textarea media-seo-desc" data-lang="${lang}"
                    id="md-${lang}" dir="${LANGUAGES[lang].dir}" rows="2" style="font-size:var(--text-xs)"></textarea>
                </div>

                ${mediaType !== 'image' ? `
                  <div class="admin-field">
                    <label class="admin-label" style="font-size:var(--text-xs)">Keywords</label>
                    <input type="text" class="admin-input" id="mk-${lang}" dir="${LANGUAGES[lang].dir}" style="font-size:var(--text-xs)"/>
                  </div>
                ` : ''}

                <!-- Schema Preview -->
                <details>
                  <summary style="cursor:pointer;font-size:10px;color:var(--color-primary-600)">Schema JSON-LD</summary>
                  <pre id="msch-${lang}" style="font-size:9px;background:var(--bg-surface-2);border-radius:var(--radius-md);padding:var(--space-2);overflow-x:auto;direction:ltr;max-height:150px;margin-top:4px"></pre>
                </details>

              </div>
            </div>
          `).join('')}

          <div style="margin-top:var(--space-4);padding-top:var(--space-3);border-top:1px solid var(--border-color)">
            <button class="btn btn--primary" id="media-seo-approve-btn" type="button">
              ✅ تأیید و ذخیره سئوی ${mediaType==='video'?'ویدیو':mediaType==='audio'?'صوت':'تصویر'}
            </button>
          </div>
        </div>

      </div>
    </div>
  `;

  if (existing) _fillMediaDashboard(container, existing);
  _bindMediaEvents(container, { mediaId, mediaType, mediaUrl, titleFa, descriptionFa, thumbnailUrl, onApprove });
}

function _fillMediaDashboard(container, data) {
  /* نمایش transcript اگر موجود است */
  if (data.transcriptData?.text) {
    let transcriptBox = container.querySelector('#media-transcript-box');
    if (!transcriptBox) {
      const resultsDiv = container.querySelector('#media-seo-results');
      if (resultsDiv) {
        const box = document.createElement('div');
        box.id = 'media-transcript-box';
        box.style.cssText = 'margin-bottom:var(--space-4)';
        box.innerHTML = `
          <details>
            <summary style="cursor:pointer;font-size:var(--text-sm);font-weight:700;color:var(--color-primary-600);margin-bottom:var(--space-2)">
              📝 متن واقعی استاد (Whisper Transcript)
              <span style="font-size:10px;font-weight:400;color:var(--text-muted);margin-inline-start:8px">
                سئو از این متن تولید شده
              </span>
            </summary>
            <div style="
              background:var(--bg-surface-2);border:1px solid rgba(42,157,143,0.2);
              border-radius:var(--radius-md);padding:var(--space-4);
              font-size:var(--text-sm);line-height:1.8;
              direction:rtl;text-align:right;max-height:200px;overflow-y:auto;
            " id="transcript-text"></div>
          </details>
        `;
        resultsDiv.insertBefore(box, resultsDiv.firstChild);
        transcriptBox = box;
      }
    }
    const textEl = container.querySelector('#transcript-text');
    if (textEl) textEl.textContent = data.transcriptData.text;
  }

  /* نمایش transcript SEO summary */
  if (data.transcriptSEO) {
    let summaryBox = container.querySelector('#media-transcript-seo-box');
    if (!summaryBox) {
      const transcriptBox = container.querySelector('#media-transcript-box');
      if (transcriptBox) {
        const box = document.createElement('div');
        box.id = 'media-transcript-seo-box';
        box.style.cssText = 'margin-bottom:var(--space-4);background:rgba(42,157,143,0.06);border:1px solid rgba(42,157,143,0.2);border-radius:var(--radius-md);padding:var(--space-3) var(--space-4)';
        box.innerHTML = `
          <div style="font-size:var(--text-xs);font-weight:700;color:var(--color-primary-600);margin-bottom:6px">
            🤖 سئو از محتوای واقعی فیلم/صوت استاد تولید شد
          </div>
          <div style="font-size:var(--text-xs);color:var(--text-secondary)">
            عنوان، توضیح و کلمات کلیدی بر اساس آنچه استاد در این درس گفته ساخته شده‌اند.
          </div>
        `;
        transcriptBox.insertAdjacentElement('afterend', box);
      }
    }
  }

  Object.keys(LANGUAGES).forEach(lang => {
    const schema = data.schemas?.[lang];
    /* اگر transcriptSEO موجود است، از آن استفاده کن */
    const title  = data.transcriptSEO?.[lang]?.title || schema?.name || '';
    const desc   = data.transcriptSEO?.[lang]?.description || schema?.description || '';

    const t  = container.querySelector(`#mt-${lang}`);
    const d  = container.querySelector(`#md-${lang}`);
    const sc = container.querySelector(`#msch-${lang}`);

    if (t)  t.value = title;
    if (d)  d.value = desc;
    if (sc && schema) sc.textContent = JSON.stringify(schema, null, 2);
  });
}

function _bindMediaEvents(container, { mediaId, mediaType, mediaUrl, titleFa, descriptionFa, thumbnailUrl, onApprove }) {
  /* تب‌ها */
  container.querySelectorAll('.media-seo-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.media-seo-tab').forEach(b => b.className=b.className.replace('btn--primary','btn--outline'));
      btn.className = btn.className.replace('btn--outline','btn--primary');
      container.querySelectorAll('.media-seo-panel').forEach(p => { p.style.display=p.dataset.lang===btn.dataset.lang?'block':'none'; });
    });
  });

  /* تولید */
  container.querySelector('#media-seo-gen-btn')?.addEventListener('click', async () => {
    const progressEl = container.querySelector('#media-seo-progress');
    const barEl      = container.querySelector('#media-seo-bar');
    const lblEl      = container.querySelector('#media-seo-lbl');
    const resultsEl  = container.querySelector('#media-seo-results');
    const btn        = container.querySelector('#media-seo-gen-btn');

    if (btn) { btn.disabled=true; btn.textContent='⏳ در حال پردازش...'; }
    if (progressEl) progressEl.style.display='block';

    const steps = {
      start:'شروع پردازش...',
      transcribing:'🎙 Whisper در حال خواندن محتوای استاد...',
      analyzing:'🤖 تحلیل محتوای واقعی فیلم/صوت با Claude...',
      translating:'🌍 ترجمه به ۸ زبان...',
      keywords:'🔑 تولید keywords از محتوای واقعی...',
      schema:'📋 ساخت Schema JSON-LD...',
      alt_text:'🖼 تولید alt text با Claude Vision...',
      done:'✅ سئو از محتوای واقعی استاد آماده شد',
    };
    const prog  = (step, pct) => { if(barEl) barEl.style.width=`${pct}%`; if(lblEl) lblEl.textContent=steps[step]??step; };

    let result = null;
    if (mediaType === 'video') {
      result = await autoProcessVideoSEO({ videoUrl:mediaUrl, ayahId:mediaId, titleFa, descriptionFa, thumbnailUrl, onProgress:prog });
    } else if (mediaType === 'audio') {
      result = await autoProcessAudioSEO({ audioUrl:mediaUrl, ayahId:mediaId, titleFa, descriptionFa, onProgress:prog });
    } else {
      result = await autoProcessImageSEO({ imageUrl:mediaUrl, imageId:mediaId, contextFa:titleFa, onProgress:prog });
    }

    if (btn) { btn.disabled=false; btn.textContent='🔄 بازتولید'; }
    if (result) { _fillMediaDashboard(container, result); if(resultsEl) resultsEl.style.display='block'; }
    else { if(lblEl) { lblEl.style.color='var(--color-error)'; lblEl.textContent='❌ خطا در تولید'; } }
  });

  /* تأیید */
  container.querySelector('#media-seo-approve-btn')?.addEventListener('click', () => {
    const saved = {};
    Object.keys(LANGUAGES).forEach(lang => {
      saved[lang] = {
        title: container.querySelector(`#mt-${lang}`)?.value?.trim()??'',
        description: container.querySelector(`#md-${lang}`)?.value?.trim()??'',
        keywords: container.querySelector(`#mk-${lang}`)?.value?.trim()??'',
      };
    });
    _saveMediaSEO(mediaId, mediaType, saved);
    onApprove?.(saved);

    const t = document.createElement('div');
    t.setAttribute('role','alert');
    t.style.cssText='position:fixed;bottom:24px;inset-inline-end:24px;background:#16a34a;color:white;padding:12px 20px;border-radius:8px;font-size:13px;font-weight:600;z-index:9999';
    t.textContent=`✅ سئوی ${mediaType==='video'?'ویدیو':mediaType==='audio'?'صوت':'تصویر'} تأیید و ذخیره شد`;
    document.body.appendChild(t);
    setTimeout(()=>{ t.style.opacity='0'; t.style.transition='opacity 0.3s'; setTimeout(()=>t.remove(),300); }, 3000);
  });
}

/* ════════════════════════════════════════════════════════════
   ۸. HELPER FUNCTIONS
   ════════════════════════════════════════════════════════════ */

/* ════════════════════════════════════════════════════════════
   WHISPER TRANSCRIPTION — استخراج متن از ویدیو/صوت
   محتوای واقعی استاد → سئو واقعی
   ════════════════════════════════════════════════════════════ */

/**
 * استخراج متن از ویدیو یا صوت با Whisper API
 * خروجی: متن کامل + timestamps برای هر جمله
 */
export async function transcribeWithWhisper(mediaUrl, mediaType = 'video') {
  const whisperKey = localStorage.getItem('mh_openai_key');
  if (!whisperKey) {
    console.warn('[Whisper] OpenAI API Key تنظیم نشده');
    return null;
  }

  try {
    /* دانلود فایل مدیا از URL */
    const mediaRes  = await fetch(mediaUrl);
    const mediaBlob = await mediaRes.blob();

    /* ساخت FormData برای Whisper */
    const formData = new FormData();
    formData.append('file', mediaBlob, mediaType === 'video' ? 'media.mp4' : 'media.mp3');
    formData.append('model',       'whisper-1');
    formData.append('language',    'fa'); /* زبان اصلی استاد فارسی است */
    formData.append('response_format', 'verbose_json');
    formData.append('timestamp_granularities[]', 'segment');

    const res  = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method:  'POST',
      headers: { 'Authorization': `Bearer ${whisperKey}` },
      body:    formData,
    });

    if (!res.ok) throw new Error(`Whisper API Error: ${res.status}`);

    const data = await res.json();

    return {
      text:     data.text ?? '',           /* متن کامل فارسی */
      segments: data.segments ?? [],        /* جملات با زمان */
      duration: data.duration ?? 0,         /* مدت کل */
      language: data.language ?? 'fa',
    };
  } catch (err) {
    console.error('[Whisper] خطا در transcription:', err);
    return null;
  }
}

/**
 * تولید سئو از transcript واقعی استاد
 * این تابع محتوای واقعی فیلم را تحلیل می‌کند
 */
async function _generateSEOFromTranscript(transcript, mediaType, lang = 'all') {
  const apiKey = localStorage.getItem('mh_claude_api_key');
  if (!apiKey || !transcript?.text) return null;

  const targetLangs = lang === 'all' ? Object.keys(LANGUAGES) : [lang];

  const systemPrompt = `You are the world's best multilingual SEO specialist for Islamic content in 2026.
You are given a REAL transcript of a Sheikh's lesson from Karbala, Iraq.
Your job is to generate authentic, powerful SEO metadata based on what the Sheikh ACTUALLY said.
This is NOT translation — it is INDEPENDENT cultural SEO optimization per language market.
Return ONLY valid JSON.`;

  const prompt = `Analyze this real transcript of Sheikh's ${mediaType} lesson and generate SEO for each language.

REAL TRANSCRIPT (Persian — what Sheikh actually said):
${transcript.text.slice(0, 3000)}

Duration: ${Math.round((transcript.duration ?? 0) / 60)} minutes

For each language, generate SEO based on the ACTUAL CONTENT of this lesson.
Return ONLY this JSON:
{
  ${targetLangs.map(l => `"${l}": {
    "title": "compelling SEO title max 60 chars in ${LANGUAGES[l]?.englishName ?? l}",
    "description": "engaging description max 155 chars — what the Sheikh teaches in this lesson",
    "keywords": "5-7 keywords from actual lesson content",
    "transcript_summary": "2-3 sentence summary of what Sheikh said",
    "key_topics": ["topic1", "topic2", "topic3"],
    "quran_verses_mentioned": ["surah:ayah if mentioned"],
    "featured_snippet": "key teaching from this lesson in 2-3 sentences"
  }`).join(',
  ')}
}`;

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model:      'claude-sonnet-4-20250514',
        max_tokens: 4000,
        system:     systemPrompt,
        messages:   [{ role: 'user', content: prompt }],
      }),
    });
    const data = await res.json();
    const text = data.content?.[0]?.text?.trim();
    return JSON.parse(text.replace(/```json
?|
?```/g, '').trim());
  } catch (err) {
    console.error('[SEO-Media] خطا در تولید سئو از transcript:', err);
    return null;
  }
}

async function _translateMedia(textFa, field) {
  const apiKey = localStorage.getItem('mh_claude_api_key');
  if (!apiKey) {
    const result = {};
    Object.keys(LANGUAGES).forEach(l => { result[l] = textFa; });
    return result;
  }

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model:      'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system:     `Translate the given ${field} into 8 languages for an Islamic platform. Return ONLY JSON, no markdown.`,
        messages:   [{ role:'user', content:`Translate: "${textFa}"\nReturn: {"fa":"...","ar":"...","ur":"...","en":"...","tr":"...","ru":"...","az":"...","id":"..."}` }],
      }),
    });
    const data = await res.json();
    const text = data.content?.[0]?.text?.trim();
    return JSON.parse(text.replace(/```json\n?|\n?```/g,'').trim());
  } catch {
    const result = {};
    Object.keys(LANGUAGES).forEach(l => { result[l] = textFa; });
    return result;
  }
}

async function _generateMediaKeywords(titleFa, descFa) {
  const apiKey = localStorage.getItem('mh_claude_api_key');
  if (!apiKey) return {};

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model:      'claude-sonnet-4-20250514',
        max_tokens: 800,
        system:     'Generate SEO keywords for Islamic media content in 8 languages. Return ONLY JSON.',
        messages:   [{ role:'user', content:`Title: ${titleFa}\nDesc: ${descFa}\nReturn: {"fa":"kw1,kw2,kw3","ar":"...","ur":"...","en":"...","tr":"...","ru":"...","az":"...","id":"..."}` }],
      }),
    });
    const data = await res.json();
    const text = data.content?.[0]?.text?.trim();
    return JSON.parse(text.replace(/```json\n?|\n?```/g,'').trim());
  } catch { return {}; }
}

const MEDIA_SEO_KEY = 'mh_media_seo';

function _saveMediaSEO(id, type, data) {
  try {
    const store = JSON.parse(localStorage.getItem(MEDIA_SEO_KEY)||'{}');
    if (!store[type]) store[type] = {};
    store[type][id] = { data, ts: Date.now() };
    localStorage.setItem(MEDIA_SEO_KEY, JSON.stringify(store));
  } catch {}
}

function _loadMediaSEO(id, type) {
  try {
    return JSON.parse(localStorage.getItem(MEDIA_SEO_KEY)||'{}')?.[type]?.[id]?.data ?? null;
  } catch { return null; }
}

function _esc(s)    { return (s??'').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function _xmlEsc(s) { return (s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;'); }
