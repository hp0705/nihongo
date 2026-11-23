/**
 * sw.js - Service Worker hỗ trợ học Offline (PWA)
 */

const CACHE_VERSION = 'nihongo-adventure-v1.1.0';
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/style.css',
  './js/main.js',
  './js/core/data.js',
  './js/core/audio.js',
  './js/core/progress.js',
  './js/core/srs.js',
  './js/core/ui.js',
  './js/core/rng.js',
  './js/games/meet.js',
  './js/games/listen_pick.js',
  './js/games/bubble_pop.js',
  './js/games/karuta.js',
  './js/games/word_builder.js',
  './js/screens/home.js',
  './js/screens/station.js',
  './js/screens/result.js',
  './js/screens/stickers.js',
  './js/screens/parent.js'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_VERSION).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // 1. Với data/*.json: Chiến lược "Mạng trước, cache sau" (Network First)
  if (url.pathname.includes('/data/')) {
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(e.request, clone));
          }
          return res;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // 2. Với assets/audio: Chiến lược "Cache trước, bổ sung khi dùng" (Cache First)
  if (url.pathname.includes('/assets/audio/')) {
    e.respondWith(
      caches.match(e.request).then((cached) => {
        if (cached) return cached;
        return fetch(e.request).then((res) => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(e.request, clone));
          }
          return res;
        });
      })
    );
    return;
  }

  // 3. Với các file code JS, CSS, HTML: Dùng Network First khi online để luôn nhận code mới nhất
  if (url.pathname.endsWith('.js') || url.pathname.endsWith('.css') || url.pathname.endsWith('.html') || url.pathname.endsWith('/')) {
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(e.request, clone));
          }
          return res;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // 4. Với các tài nguyên khác: Cache first, fallback to network
  e.respondWith(
    caches.match(e.request).then((cached) => {
      return cached || fetch(e.request);
    })
  );
});
