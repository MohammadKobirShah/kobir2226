// VideasyPro service worker — hand-rolled Workbox-style strategies.
// - App shell: precache-ish, network-first with cache fallback
// - TMDB images: cache-first, 30-day expiry, max 200 entries (~50MB guard)
// - TMDB API: stale-while-revalidate, 24h expiry, max 100 entries
// - CDN embed pages: no-store (always fresh)

const IMAGE_CACHE = "tmdb-images-v1";
const API_CACHE = "tmdb-api-v1";
const SHELL_CACHE = "app-shell-v1";

const IMAGE_MAX_AGE = 30 * 24 * 60 * 60 * 1000;
const API_MAX_AGE = 24 * 60 * 60 * 1000;
const IMAGE_MAX_ENTRIES = 200;
const API_MAX_ENTRIES = 100;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(["/", "/index.html"]))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter(
            (k) => ![IMAGE_CACHE, API_CACHE, SHELL_CACHE].includes(k)
          )
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

async function trimCache(cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length > maxEntries) {
    // Evict oldest (insertion order)
    for (let i = 0; i < keys.length - maxEntries; i++) {
      await cache.delete(keys[i]);
    }
  }
}

function isExpired(response, maxAge) {
  const date = response.headers.get("sw-cached-at");
  if (!date) return true;
  return Date.now() - Number(date) > maxAge;
}

async function withTimestamp(response) {
  const headers = new Headers(response.headers);
  headers.set("sw-cached-at", String(Date.now()));
  const blob = await response.blob();
  return new Response(blob, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

async function cacheFirst(request, cacheName, maxAge, maxEntries) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached && !isExpired(cached, maxAge)) return cached;

  const fetchPromise = fetch(request)
    .then(async (res) => {
      if (res.ok) {
        await cache.put(request, await withTimestamp(res.clone()));
        await trimCache(cacheName, maxEntries);
      }
      return res;
    })
    .catch(() => cached);

  // Stale-while-revalidate for expired entries
  if (cached) {
    fetchPromise.catch(() => undefined);
    return cached;
  }
  return fetchPromise;
}

async function staleWhileRevalidate(request, cacheName, maxAge, maxEntries) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then(async (res) => {
      if (res.ok) {
        await cache.put(request, await withTimestamp(res.clone()));
        await trimCache(cacheName, maxEntries);
      }
      return res;
    })
    .catch(() => cached);
  if (cached && !isExpired(cached, maxAge)) {
    network.catch(() => undefined);
    return cached;
  }
  return network;
}

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET") return;

  // CDN embed pages — never cache
  const cdnHosts = [
    "videasy.to",
    "vidlink.pro",
    "blackvid.space",
    "moviesapi.club",
    "multiembed.mov",
    "embed.su",
    "suwayu.com",
  ];
  if (cdnHosts.some((h) => url.hostname.endsWith(h))) return;

  if (url.hostname === "image.tmdb.org") {
    event.respondWith(
      cacheFirst(event.request, IMAGE_CACHE, IMAGE_MAX_AGE, IMAGE_MAX_ENTRIES)
    );
    return;
  }

  if (url.hostname === "api.themoviedb.org") {
    event.respondWith(
      staleWhileRevalidate(event.request, API_CACHE, API_MAX_AGE, API_MAX_ENTRIES)
    );
    return;
  }

  // App shell: network-first, fallback to cache (offline support)
  if (url.origin === self.location.origin) {
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          if (res.ok && event.request.mode === "navigate") {
            const clone = res.clone();
            caches.open(SHELL_CACHE).then((c) => c.put("/index.html", clone));
          }
          return res;
        })
        .catch(async () => {
          const cached = await caches.match(event.request);
          if (cached) return cached;
          if (event.request.mode === "navigate") {
            return caches.match("/index.html");
          }
          return Response.error();
        })
    );
  }
});
