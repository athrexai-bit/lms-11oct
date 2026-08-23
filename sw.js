// ===== Athrexai — Service Worker =====
const CACHE_NAME = 'arthrex-ai-v2';

// Files to cache for offline use
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/auth.js',
  '/enroll.js',
  '/marketing-courses.js',
  '/masterclasses.js',
  '/liveclasses.js',
  '/trending.js',
  '/thumbnails.js',
  '/dashboard-courses.js',
  '/course-data.js',
  '/course-detail.js',
  '/course-detail.css',
  '/admin.html',
  '/admin.css',
  '/admin.js',
  '/admin-lms.html',
  '/admin-lms.css',
  '/admin-lms.js',
  '/lms.html',
  '/lms.css',
  '/lms.js',
  '/curriculum.html',
  '/curriculum.css',
  '/curriculum.js',
  '/manifest.json',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap'
];

// ── Install: cache all static assets ─────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[SW] Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// ── Activate: clean up old caches ────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== CACHE_NAME)
            .map(key => {
              console.log('[SW] Deleting old cache:', key);
              return caches.delete(key);
            })
      )
    ).then(() => self.clients.claim())
  );
});

// ── Fetch: cache-first for static, network-first for API ─────
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Always go network for Groq API calls
  if (url.hostname === 'api.groq.com') {
    event.respondWith(fetch(event.request));
    return;
  }

  // Network-first for YouTube API
  if (url.hostname.includes('youtube') || url.hostname.includes('googleapis')) {
    event.respondWith(
      fetch(event.request)
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Cache-first for everything else (static assets)
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        // Cache valid responses
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        // Offline fallback
        if (event.request.destination === 'document') {
          return caches.match('/index.html');
        }
      });
    })
  );
});
