// ===== MOSHAVER SERVICE WORKER =====
const CACHE_NAME = 'moshaver-cache-v1';
const API_CACHE_NAME = 'moshaver-api-cache-v1';
const SYNC_TAG = 'moshaver-sync-messages';

// Static assets to pre-cache during install
const STATIC_ASSETS = [
  '/',
  '/favicon.ico',
  '/manifest.json',
];

// ===== INSTALL EVENT =====
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[SW] Pre-cache failed for some assets:', err);
      });
    })
  );
  // Activate immediately without waiting for existing tabs to close
  self.skipWaiting();
});

// ===== ACTIVATE EVENT =====
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== API_CACHE_NAME)
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    })
  );
  // Take control of all pages immediately
  self.clients.claim();
});

// ===== FETCH EVENT =====
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests (except for background sync)
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension, dev tools, etc
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // API requests → Network-first strategy
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstStrategy(request));
    return;
  }

  // Google Fonts → Cache-first with long TTL
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(cacheFirstStrategy(request));
    return;
  }

  // Static assets (JS, CSS, images, fonts) → Cache-first strategy
  if (isStaticAsset(url.pathname)) {
    event.respondWith(cacheFirstStrategy(request));
    return;
  }

  // HTML pages → Network-first (for fresh content)
  event.respondWith(networkFirstStrategy(request));
});

// ===== CACHE STRATEGIES =====

/**
 * Network-first: Try network, fall back to cache.
 * Used for API calls and HTML pages to get fresh data.
 */
async function networkFirstStrategy(request) {
  const isApi = new URL(request.url).pathname.startsWith('/api/');
  const cacheName = isApi ? API_CACHE_NAME : CACHE_NAME;

  try {
    const networkResponse = await fetch(request);

    // Only cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      // Clone the response since it can only be consumed once
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    // Network failed → try cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // If it's an HTML request, return offline fallback
    if (request.headers.get('accept')?.includes('text/html')) {
      return createOfflineResponse();
    }

    // For API requests, return a JSON error
    if (isApi) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'آفلاین هستید. لطفاً اتصال اینترنت را بررسی کنید.',
        }),
        {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Generic offline response
    return new Response('Offline', { status: 503 });
  }
}

/**
 * Cache-first: Try cache, fall back to network.
 * Used for static assets that rarely change (CSS, JS, fonts, images).
 */
async function cacheFirstStrategy(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    // Revalidate in background (stale-while-revalidate)
    refreshCache(request);
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    // Return a transparent 1x1 pixel for failed images
    if (request.headers.get('accept')?.includes('image')) {
      return new Response(
        new Uint8Array([
          0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00,
          0x00, 0x00, 0x00, 0x21, 0xf9, 0x04, 0x01, 0x00, 0x00, 0x00,
          0x00, 0x2c, 0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00,
          0x00, 0x02, 0x01, 0x00, 0x00,
        ]),
        { headers: { 'Content-Type': 'image/gif' } }
      );
    }

    return new Response('', { status: 408 });
  }
}

/**
 * Refresh cache in the background without blocking the response.
 */
async function refreshCache(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse);
    }
  } catch {
    // Silently fail — cache remains stale
  }
}

// ===== BACKGROUND SYNC =====
self.addEventListener('sync', (event) => {
  if (event.tag === SYNC_TAG) {
    event.waitUntil(syncPendingMessages());
  }
});

/**
 * Sync messages saved in IndexedDB/localStorage while offline.
 * Reads pending messages and sends them to the API.
 */
async function syncPendingMessages() {
  try {
    // Get all clients and ask them to sync
    const clients = await self.clients.matchAll({ type: 'window' });
    for (const client of clients) {
      client.postMessage({
        type: 'SYNC_PENDING_MESSAGES',
      });
    }
  } catch (error) {
    console.error('[SW] Background sync failed:', error);
  }
}

// ===== MESSAGE HANDLING =====
self.addEventListener('message', (event) => {
  const { type, payload } = event.data || {};

  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;

    case 'CACHE_URLS':
      if (payload?.urls) {
        event.waitUntil(
          caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(payload.urls).catch((err) => {
              console.warn('[SW] Failed to cache URLs:', err);
            });
          })
        );
      }
      break;

    case 'CLEAR_API_CACHE':
      event.waitUntil(caches.delete(API_CACHE_NAME));
      break;

    case 'GET_CACHE_SIZE':
      event.waitUntil(
        getCacheSize().then((size) => {
          event.source.postMessage({
            type: 'CACHE_SIZE',
            payload: { size },
          });
        })
      );
      break;

    default:
      break;
  }
});

// ===== PUSH NOTIFICATIONS =====
self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const options = {
      body: data.body || 'پیام جدید دریافت شد',
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      dir: 'rtl',
      lang: 'fa',
      tag: data.tag || 'moshaver-notification',
      renotify: true,
      data: {
        url: data.url || '/',
      },
      actions: [
        {
          action: 'open',
          title: 'مشاهده',
        },
        {
          action: 'dismiss',
          title: 'بستن',
        },
      ],
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'مشاور همراه', options)
    );
  } catch (error) {
    console.error('[SW] Push notification error:', error);
  }
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      // Focus existing tab if open
      for (const client of clients) {
        if (client.url.includes(urlToOpen) && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open new tab
      return self.clients.openWindow(urlToOpen);
    })
  );
});

// ===== HELPER FUNCTIONS =====

/**
 * Check if a URL path points to a static asset.
 */
function isStaticAsset(pathname) {
  const staticExtensions = [
    '.js', '.css', '.woff', '.woff2', '.ttf', '.eot', '.otf',
    '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.webp',
    '.avif', '.mp3', '.wav', '.ogg', '.mp4', '.webm',
  ];
  return staticExtensions.some((ext) => pathname.endsWith(ext));
}

/**
 * Create an offline fallback HTML page.
 */
function createOfflineResponse() {
  const html = `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>مشاور همراه - آفلاین</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;600;700&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Vazirmatn', system-ui, sans-serif;
      background: linear-gradient(160deg, #0f172a, #1e1b4b, #0f172a);
      color: #f1f5f9;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      direction: rtl;
    }
    .container {
      text-align: center;
      padding: 32px;
      max-width: 360px;
    }
    .icon { font-size: 64px; margin-bottom: 20px; }
    h1 { font-size: 22px; margin-bottom: 12px; font-weight: 700; }
    p { font-size: 15px; color: #94a3b8; line-height: 1.8; margin-bottom: 24px; }
    button {
      font-family: 'Vazirmatn', sans-serif;
      background: linear-gradient(135deg, #818cf8, #6366f1);
      color: white;
      border: none;
      padding: 14px 32px;
      border-radius: 14px;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
      box-shadow: 0 4px 16px rgba(129, 140, 248, 0.25);
    }
    button:hover { transform: scale(1.03); box-shadow: 0 6px 24px rgba(129, 140, 248, 0.3); }
    button:active { transform: scale(0.97); }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">📡</div>
    <h1>اتصال اینترنت قطع شده</h1>
    <p>در حال حاضر به اینترنت دسترسی ندارید. پیام‌هایی که ارسال کرده‌اید پس از اتصال مجدد ارسال خواهند شد.</p>
    <button onclick="location.reload()">تلاش مجدد</button>
  </div>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

/**
 * Calculate approximate total cache size.
 */
async function getCacheSize() {
  let totalSize = 0;

  const cacheNames = await caches.keys();
  for (const name of cacheNames) {
    const cache = await caches.open(name);
    const keys = await cache.keys();
    for (const key of keys) {
      const response = await cache.match(key);
      if (response) {
        const blob = await response.blob();
        totalSize += blob.size;
      }
    }
  }

  return totalSize;
}
