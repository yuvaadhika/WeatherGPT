// ============================================================================
// WeatherGPT Service Worker - 100% Offline Edge & PWA Support
// Allows WeatherGPT to launch and operate with Zero Cell Tower / Zero Network
// ============================================================================

const CACHE_NAME = 'weathergpt-core-v1.1';
const RUNTIME_CACHE = 'weathergpt-runtime-v1.1';

// Critical core assets to pre-cache on install
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/wyndra-logo.png',
  '/favicon.png',
  '/favicon.ico',
  '/manifest.webmanifest',
  '/manifest.json',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@400;500;600;700&display=swap',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
];

// 1. INSTALL EVENT: Pre-cache core app shell and immediately activate
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Use Promise.allSettled so external font/CDN glitches won't fail the entire SW install
      return Promise.allSettled(
        PRECACHE_ASSETS.map((url) =>
          cache.add(new Request(url, { cache: 'reload' })).catch((err) => {
            console.warn('[WeatherGPT SW] Pre-cache skipped asset:', url, err);
          })
        )
      );
    }).then(() => self.skipWaiting())
  );
});

// 2. ACTIVATE EVENT: Clean up stale old caches and claim active clients
self.addEventListener('activate', (event) => {
  const currentCaches = [CACHE_NAME, RUNTIME_CACHE];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!currentCaches.includes(cacheName)) {
            console.log('[WeatherGPT SW] Deleting stale cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. FETCH EVENT: Intelligent Caching Strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests (e.g. POST to backend)
  if (request.method !== 'GET') {
    return;
  }

  // A. Navigation requests (Opening the app / browser link)
  // Strategy: Try Network First, Fallback to cached index.html immediately if Offline
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          }
          return networkResponse;
        })
        .catch(async () => {
          console.log('[WeatherGPT SW] Offline navigation detected: serving cached app shell');
          const cache = await caches.open(CACHE_NAME);
          const cachedResponse = await cache.match(request) || await cache.match('/index.html') || await cache.match('/');
          if (cachedResponse) {
            return cachedResponse;
          }
          return new Response(
            `<!DOCTYPE html><html><head><meta charset="utf-8"><title>WeatherGPT Offline</title><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="font-family:sans-serif;background:#0f172a;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;padding:20px;text-align:center;"><div><h2>📡 WeatherGPT Offline</h2><p>Zero tower connection detected. Please reload once the app is cached, or check back when signal returns.</p><button onclick="location.reload()" style="background:#0284c7;color:#fff;border:none;padding:10px 20px;border-radius:10px;cursor:pointer;font-weight:bold;">Retry</button></div></body></html>`,
            { headers: { 'Content-Type': 'text/html' } }
          );
        })
    );
    return;
  }

  // B. Weather API Calls (Open-Meteo & Weather APIs)
  // Strategy: Network-First with Runtime Cache Fallback
  if (url.hostname.includes('open-meteo.com') || url.hostname.includes('rainviewer.com') || url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, responseClone));
          }
          return networkResponse;
        })
        .catch(async () => {
          const cachedResponse = await caches.match(request);
          if (cachedResponse) {
            console.log('[WeatherGPT SW] Returning cached weather API response:', request.url);
            return cachedResponse;
          }
          // Return empty fallback JSON
          return new Response(JSON.stringify({ offline: true, error: 'Network unavailable' }), {
            headers: { 'Content-Type': 'application/json' }
          });
        })
    );
    return;
  }

  // C. Static App Assets (JS, CSS, Images, Fonts, Icons)
  // Strategy: Stale-While-Revalidate / Cache-First
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          }
          return networkResponse;
        })
        .catch(() => {
          // Ignore network errors for background revalidation
        });

      return cachedResponse || fetchPromise;
    })
  );
});

// 4. PUSH NOTIFICATION EVENT: Show severe disaster alerts even when app is closed
self.addEventListener('push', (event) => {
  let data = { title: 'WeatherGPT Alert', body: 'Severe weather condition update.', url: '/' };
  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: '/wyndra-logo.png',
    badge: '/favicon.png',
    vibrate: [200, 100, 200, 100, 200],
    data: { url: data.url || '/' },
    actions: [
      { action: 'open', title: 'Open App' },
      { action: 'sos', title: 'Emergency SOS' }
    ]
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// 5. NOTIFICATION CLICK EVENT
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.action === 'sos' ? '/?view=sos' : (event.notification.data?.url || '/');

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
