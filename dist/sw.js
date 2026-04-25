/**
 * ============================================================
 * FILE: sw.js  (Service Worker)
 * PROJECT: BarakatHub — پلتفرم رسانه‌ای چندزبانه
 * VERSION: 2.0.0  (2026-ready)
 * ============================================================
 */

const STATIC_CACHE  = 'bh-static-v3';
const DYNAMIC_CACHE = 'bh-dynamic-v3';
const IMAGE_CACHE   = 'bh-images-v3';
const ALL_CACHES    = [STATIC_CACHE, DYNAMIC_CACHE, IMAGE_CACHE];

const MAX_DYNAMIC = 60;
const MAX_IMAGES  = 40;

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/assets/css/01-tokens.css',
  '/assets/css/02-reset.css',
  '/assets/css/03-layout.css',
  '/assets/css/04-components.css',
  '/assets/css/05-navbar.css',
  '/assets/css/06-footer.css',
  '/assets/css/07-home.css',
  '/assets/js/i18n.js',
  '/assets/js/theme.js',
  '/assets/js/app.js',
  '/assets/js/home.js',
  '/assets/js/pwa.js',
  '/assets/img/icon-192.png',
  '/assets/img/icon-512.png',
  '/assets/img/favicon.svg',
  '/assets/img/apple-touch-icon.png',
];

/* ── Install ── */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(c => c.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

/* ── Activate ── */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => !ALL_CACHES.includes(k)).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

/* ── Message (SKIP_WAITING از pwa.js) ── */
self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

/* ── Fetch ── */
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;
  if (!url.protocol.startsWith('http')) return;

  /* API — Network Only */
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkOnly(request));
    return;
  }

  /* تصاویر — Cache First + trim */
  if (request.destination === 'image') {
    event.respondWith(cacheFirstLimited(request, IMAGE_CACHE, MAX_IMAGES));
    return;
  }

  /* Static assets — Cache First */
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(cacheFirst(request));
    return;
  }

  /* HTML — Network First + offline fallback */
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(networkFirstHTML(request));
    return;
  }

  /* بقیه — Stale While Revalidate */
  event.respondWith(staleWhileRevalidate(request));
});

/* ── Strategies ── */
async function cacheFirst(req) {
  const hit = await caches.match(req);
  if (hit) return hit;
  try {
    const res = await fetch(req);
    if (res.ok) (await caches.open(STATIC_CACHE)).put(req, res.clone());
    return res;
  } catch { return new Response('', { status: 503 }); }
}

async function cacheFirstLimited(req, name, max) {
  const hit = await caches.match(req);
  if (hit) return hit;
  try {
    const res = await fetch(req);
    if (res.ok) {
      const c = await caches.open(name);
      await trimCache(c, max);
      c.put(req, res.clone());
    }
    return res;
  } catch { return new Response('', { status: 503 }); }
}

async function networkOnly(req) {
  try { return await fetch(req); }
  catch {
    return new Response(JSON.stringify({ error: 'offline', offline: true }), {
      headers: { 'Content-Type': 'application/json' }, status: 503,
    });
  }
}

async function networkFirstHTML(req) {
  try {
    const res = await fetch(req);
    if (res.ok) (await caches.open(DYNAMIC_CACHE)).put(req, res.clone());
    return res;
  } catch {
    return (await caches.match(req)) || caches.match('/offline.html');
  }
}

async function staleWhileRevalidate(req) {
  const cache  = await caches.open(DYNAMIC_CACHE);
  const cached = await cache.match(req);
  const fresh  = fetch(req).then(async r => {
    if (r.ok) { await trimCache(cache, MAX_DYNAMIC); cache.put(req, r.clone()); }
    return r;
  }).catch(() => null);
  return cached || fresh;
}

async function trimCache(cache, max) {
  const keys = await cache.keys();
  if (keys.length >= max) await cache.delete(keys[0]);
}

/* ── Push Notifications ── */
self.addEventListener('push', event => {
  if (!event.data) return;
  let d;
  try { d = event.data.json(); } catch { d = { title: 'برکت‌هاب', body: event.data.text() }; }
  event.waitUntil(
    self.registration.showNotification(d.title || 'برکت‌هاب', {
      body:    d.body    || '',
      icon:    '/assets/img/icon-192.png',
      badge:   '/assets/img/icon-192.png',
      tag:     d.tag     || 'bh',
      vibrate: [100, 50, 100],
      data:    { url: d.url || '/' },
      actions: [
        { action: 'open',    title: d.actionOpen    || 'باز کردن' },
        { action: 'dismiss', title: d.actionDismiss || 'بستن'     },
      ],
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  if (event.action === 'dismiss') return;
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type:'window', includeUncontrolled:true }).then(list => {
      for (const c of list) if (c.url === url && 'focus' in c) return c.focus();
      return clients.openWindow(url);
    })
  );
});

/* ── Background Sync ── */
self.addEventListener('sync', event => {
  if (event.tag === 'sync-orders') event.waitUntil(Promise.resolve());
});
