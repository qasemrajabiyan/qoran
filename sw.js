/**
 * ============================================================
 * FILE: sw.js  (Service Worker)
 * ROLE: PWA — کش، آفلاین، نوتیفیکیشن
 * PROJECT: MediaHub — پلتفرم رسانه‌ای چندزبانه
 * VERSION: 1.0.0
 * قرار دادن: ریشه پروژه (کنار index.html)
 * ============================================================
 */

const STATIC_CACHE  = 'mediahub-static-v1';
const DYNAMIC_CACHE = 'mediahub-dynamic-v1';

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
];

/* ── Install ── */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

/* ── Activate ── */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== STATIC_CACHE && k !== DYNAMIC_CACHE)
            .map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

/* ── Fetch ── */
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;

  /* API — Network Only */
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkOnly(request));
    return;
  }

  /* Static assets — Cache First */
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(cacheFirst(request));
    return;
  }

  /* HTML pages — Network First */
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(networkFirstHTML(request));
    return;
  }

  /* Others — Stale While Revalidate */
  event.respondWith(staleWhileRevalidate(request));
});

async function cacheFirst(req) {
  const cached = await caches.match(req);
  if (cached) return cached;
  const resp = await fetch(req).catch(() => null);
  if (resp?.ok) {
    const c = await caches.open(STATIC_CACHE);
    c.put(req, resp.clone());
  }
  return resp || new Response('', { status: 503 });
}

async function networkOnly(req) {
  try { return await fetch(req); }
  catch {
    return new Response(
      JSON.stringify({ error: 'offline', offline: true }),
      { headers: { 'Content-Type': 'application/json' }, status: 503 }
    );
  }
}

async function networkFirstHTML(req) {
  try {
    const resp = await fetch(req);
    if (resp.ok) {
      const c = await caches.open(DYNAMIC_CACHE);
      c.put(req, resp.clone());
    }
    return resp;
  } catch {
    const cached = await caches.match(req);
    return cached || caches.match('/offline.html');
  }
}

async function staleWhileRevalidate(req) {
  const cache  = await caches.open(DYNAMIC_CACHE);
  const cached = await cache.match(req);
  const fresh  = fetch(req).then(r => { if (r.ok) cache.put(req, r.clone()); return r; }).catch(() => null);
  return cached || fresh;
}

/* ── Push Notifications ── */
self.addEventListener('push', event => {
  if (!event.data) return;
  let data;
  try { data = event.data.json(); }
  catch { data = { title: 'برکت‌هاب', body: event.data.text() }; }

  event.waitUntil(
    self.registration.showNotification(data.title || 'برکت‌هاب', {
      body:    data.body || '',
      icon:    '/assets/img/icon-192.png',
      badge:   '/assets/img/icon-192.png',
      tag:     data.tag || 'mediahub',
      vibrate: [100, 50, 100],
      data:    { url: data.url || '/' },
      actions: [
        { action: 'open',    title: data.actionOpen    || 'باز کردن' },
        { action: 'dismiss', title: data.actionDismiss || 'بستن'     },
      ],
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  if (event.action === 'dismiss') return;
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(list => {
        for (const c of list) {
          if (c.url === url && 'focus' in c) return c.focus();
        }
        return clients.openWindow(url);
      })
  );
});

/* ── Background Sync ── */
self.addEventListener('sync', event => {
  if (event.tag === 'sync-orders') {
    event.waitUntil(Promise.resolve()); /* پیاده‌سازی در قسمت ۴ */
  }
});
