/**
 * SMART WATT Premium Service Worker
 * Fully production-safe, with offline app shell support and secure caching layers.
 */

const CACHE_NAME = "smart-watt-cache-v1";

// Safe static assets and app shell to cache on install
const STATIC_ASSETS = [
  "/",
  "/robots.txt",
  "/manifest.webmanifest",
  "/tesla-splash.webp",
  "/splash-artwork.png",
  "/favicon.png",
  "/icon-192.png",
  "/icon-512.png",
  "/icon-maskable-192.png",
  "/icon-maskable-512.png",
  "/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("[SMART WATT SW] Caching application shell assets");
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log("[SMART WATT SW] Cleaning up old cache:", cacheName);
              return caches.delete(cacheName);
            }
          }),
        );
      })
      .then(() => self.clients.claim()),
  );
});

// Production-safe Fetch Strategy
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // 1. DO NOT CACHE: Supabase Auth, Web Sockets, Private User Data, ElevenLabs proxy streams
  const isSupabase = url.host.includes("supabase.co") || url.pathname.includes("/auth/");
  const isPrivateApi = url.pathname.includes("/api/") || url.pathname.includes("/functions/");
  const isElevenLabs = url.host.includes("elevenlabs.io") || url.pathname.includes("cypher-speech");
  const isRealtime = url.pathname.includes("/realtime/");

  if (isSupabase || isPrivateApi || isElevenLabs || isRealtime || event.request.method !== "GET") {
    event.respondWith(fetch(event.request));
    return;
  }

  // 2. Navigation Requests (App HTML Shell): Network-first falling back to Cached Root Shell
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() => {
        console.log("[SMART WATT SW] Serving offline app shell navigation fallback");
        return caches.match("/");
      }),
    );
    return;
  }

  // 3. Static Assets (JS, CSS, local fonts, images under assets/*): Cache-first with network fallback
  const isAsset =
    url.pathname.includes("/assets/") ||
    url.host.includes("fonts.googleapis.com") ||
    url.host.includes("fonts.gstatic.com") ||
    STATIC_ASSETS.includes(url.pathname);

  if (isAsset) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const cacheCopy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, cacheCopy);
            });
          }
          return networkResponse;
        });
      }),
    );
    return;
  }

  // 4. Fallback for other standard GET requests: Network-first
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Cache safe static GET responses
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === "basic") {
          const cacheCopy = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, cacheCopy);
          });
        }
        return networkResponse;
      })
      .catch(() => caches.match(event.request)),
  );
});

// Skip Waiting triggered by premium bottom banner update actions
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    console.log("[SMART WATT SW] skipWaiting command received");
    self.skipWaiting();
  }
});
