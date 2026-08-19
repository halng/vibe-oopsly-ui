// Oopsly Service Worker with Offline Caching & Background Sync
const STATIC_CACHE = 'oopsly-static-v1';
const API_CACHE = 'oopsly-api-v1';

const STATIC_ASSETS = [
  '/',
  '/index.html',
];

// Install: Precache shell assets and activate immediately
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[ServiceWorker] Precache failed, continuing:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate: Clean up older cache versions and claim clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== STATIC_CACHE && key !== API_CACHE) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Strategy:
// 1. Navigation requests -> Network first with cache fallback
// 2. Static scripts/styles/fonts -> Stale-while-revalidate / Cache first
// 3. API GET -> Network first, cache on success, return cached response if offline
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Ignore non-HTTP/HTTPS and Chrome extension requests
  if (!event.request.url.startsWith('http')) return;

  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    // Only cache GET requests
    if (event.request.method === 'GET') {
      event.respondWith(
        fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const clone = networkResponse.clone();
              caches.open(API_CACHE).then((cache) => {
                cache.put(event.request, clone);
              });
            }
            return networkResponse;
          })
          .catch(async () => {
            // Offline fallback: check cached API response
            const cachedResponse = await caches.match(event.request);
            if (cachedResponse) {
              const headers = new Headers(cachedResponse.headers);
              headers.set('X-Oopsly-Offline', 'true');
              return new Response(cachedResponse.body, {
                status: cachedResponse.status,
                statusText: cachedResponse.statusText,
                headers,
              });
            }

            // Return a fallback JSON response if not in cache
            return new Response(
              JSON.stringify({
                isSuccess: false,
                message: 'Offline: Network unavailable',
                data: null,
                timestamp: new Date().toISOString(),
                isOfflineFallback: true,
              }),
              {
                status: 200,
                headers: { 'Content-Type': 'application/json', 'X-Oopsly-Offline': 'true' },
              }
            );
          })
      );
    }
    return;
  }

  // Handle SPA navigation
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(async () => {
        const cache = await caches.open(STATIC_CACHE);
        const cached = await cache.match('/index.html') || await cache.match('/');
        return cached || new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
      })
    );
    return;
  }

  // Handle static assets (JS, CSS, images, fonts)
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(STATIC_CACHE).then((cache) => {
              cache.put(event.request, clone);
            });
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});

// Background Sync Event (Standard Web Background Sync API)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-oopsly-reviews') {
    event.waitUntil(
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: 'SYNC_TRIGGERED_FROM_SW' });
        });
      })
    );
  }
});

// Listen for client messages
self.addEventListener('message', (event) => {
  if (event.data) {
    if (event.data.type === 'SKIP_WAITING') {
      self.skipWaiting();
    } else if (event.data.type === 'SYNC_NOW') {
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: 'SYNC_TRIGGERED_FROM_SW' });
        });
      });
    }
  }
});
