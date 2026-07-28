const CACHE_NAME = "khandesh-admin-v1";
const urlsToCache = [
  "/admin/",
  "/admin/index.html",
  "/admin/css/admin.css",
  "/admin/js/admin.js",
  "/images/logo.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => response || fetch(event.request))
  );
});
