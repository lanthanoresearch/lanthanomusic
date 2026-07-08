const CACHE_NAME = "lanthano-music-v1";

const APP_SHELL = [
  "/",
  "/index.html",
  "/music.js",
  "/music.json",
  "/manifest.webmanifest",
  "/file_000000000c40722f92b1fe6758cb4855.png",
  "/file_00000000c49c720ca711dcea689d14dd.png",
  "/file_00000000eadc720c974c32164d0af640.png"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      return (
        cached ||
        fetch(event.request).then(response => {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
          return response;
        }).catch(() => cached)
      );
    })
  );
});
