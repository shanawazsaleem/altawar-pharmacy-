self.addEventListener('install', (event) => {
  // activate immediately
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Cache name for static assets (if you add more later)
const CACHE_NAME = 'al-tawar-cache-v1';

// Simple fetch handler: try network first, fall back to cache, cache responses for GET
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Provide an offline fallback for the joke page
  if (url.pathname === '/' || url.pathname.endsWith('joke-generator.html')) {
    event.respondWith(
      fetch(event.request)
        .then((resp) => {
          // Update cache with latest response
          const copy = resp.clone();
          caches.open(CACHE_NAME).then((c) => c.put(event.request, copy));
          return resp;
        })
        .catch(() => caches.match(event.request).then((r) => r || caches.match('/')))
    );
    return;
  }

  // Default: try cache, then network
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request)
        .then((resp) => {
          // cache static assets
          if (resp && resp.status === 200 && resp.type === 'basic') {
            const copy = resp.clone();
            caches.open(CACHE_NAME).then((c) => c.put(event.request, copy));
          }
          return resp;
        })
        .catch(() => cached);
    })
  );
});
