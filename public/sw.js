// Minimal service worker to make Open Permit an installable PWA.
// Conservative by design: navigations are network-first (so users always get
// the latest app online) with a cached app-shell fallback when offline; hashed
// build assets are left to the browser/network, avoiding stale-cache bugs.
const CACHE = "open-permit-shell-v1";

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE).then((c) => c.add("/")));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  // App-shell navigations: try network, fall back to the cached shell offline.
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put("/", copy));
          return res;
        })
        .catch(() => caches.match("/")),
    );
  }
  // Other GETs fall through to the network (no respondWith) — keeps the SW
  // install-eligible without caching versioned assets.
});
