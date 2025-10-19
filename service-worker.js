// service-worker.js
const CACHE_NAME = 'todo-cache-v1';
const OFFLINE_PAGE = './offline.html';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './offline.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

// Install: cache core assets
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      );
      await self.clients.claim();
    })()
  );
});

// Fetch: navigation => network-first with fallback to cache/offline page
self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Handle navigation requests (pages) with network-first strategy
  if (req.mode === 'navigate' || (req.method === 'GET' && req.headers.get('accept')?.includes('text/html'))) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          // Put a copy in the cache
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          return res;
        })
        .catch(() =>
          caches.match(req).then((cached) => cached || caches.match(OFFLINE_PAGE))
        )
    );
    return;
  }

  // For other requests (CSS, JS, images) use cache-first then network
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req)
        .then((res) => {
          // Put a copy in the cache for next time
          if (req.method === 'GET') {
            const resClone = res.clone();
            caches.open(CACHE_NAME).then((cache) => {
              // ignore opaque responses (cross-origin) optionally
              try { cache.put(req, resClone); } catch (e) {}
            });
          }
          return res;
        })
        .catch(() => {
          // optional fallback for images or fonts could go here
          return;
        });
    })
  );
});
