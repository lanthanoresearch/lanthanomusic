const CACHE_NAME = "lanthano-music-v1";

// Only cache the hero images.
const CACHED_IMAGES = [
  "/hero wide.png",
  "/hero tall.png"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(CACHED_IMAGES))
  );
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    )
  );

  self.clients.claim();
});

self.addEventListener("fetch", event => {
  // Only handle GET requests.
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // Ignore requests that aren't from this site.
  if (url.origin !== self.location.origin) return;

  // Only cache the hero images.
  if (!CACHED_IMAGES.includes(url.pathname)) return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) {
        return cached;
      }

      return fetch(event.request).then(response => {
        // Don't cache bad responses.
        if (!response || response.status !== 200) {
          return response;
        }

        const responseClone = response.clone();

        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseClone);
        });

        return response;
      });
    })
  );
});
