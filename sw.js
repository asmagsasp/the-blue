const CACHE_NAME = 'the-blue-cache-v6';
const urlsToCache = [
  '/',
  '/index.html',
  '/style.css',
  '/app.js?v=2.5',
  '/manifest.json',
  '/icon.svg'
];

self.addEventListener('install', event => {
  // Force waiting worker to become active
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('activate', event => {
  // Take control of all clients immediately
  event.waitUntil(self.clients.claim());
  
  // Clear old caches
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    // Network First strategy
    fetch(event.request)
      .then(response => {
        // Cache the new response if it's successful
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // Fallback to cache if network fails (offline mode)
        return caches.match(event.request);
      })
  );
});
