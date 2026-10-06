/* NAMUNA SHOP — Service Worker (офлайн) */
const VERSION = "namuna-v3";
const STATIC = VERSION + "-static";
const RUNTIME = VERSION + "-runtime";
const PRECACHE = [
  "./",
  "index.html",
  "catalog.html",
  "product.html",
  "favorites.html",
  "cart.html",
  "checkout.html",
  "404.html",
  "manifest.json",
  "config.js",
  "css/style.css",
  "css/responsive.css",
  "css/animations.css",
  "js/app.js",
  "js/cart.js",
  "js/catalog.js",
  "js/checkout.js",
  "js/favorites.js",
  "js/product-page.js",
  "js/products.js",
  "js/search.js",
  "js/utils.js",
  "assets/logo/favicon.svg",
  "assets/logo/favicon.png",
  "assets/icons/icon-192.png",
  "assets/icons/icon-512.png",
  "assets/banners/hero.jpg"
];

self.addEventListener("install", (e) => {
  e.waitUntil((async () => {
    const c = await caches.open(STATIC);
    await Promise.all(PRECACHE.map((u) => c.add(u).catch(() => {})));
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  const isCode = /\.(js|css|json)$/.test(url.pathname);
  const isHTML = req.mode === "navigate" || (req.headers.get("accept") || "").includes("text/html");

  if (isHTML || (isCode && url.origin === location.origin)) {
    e.respondWith((async () => {
      try {
        const res = await fetch(req);
        if (res.ok && url.origin === location.origin) (await caches.open(RUNTIME)).put(req, res.clone());
        return res;
      } catch (_) {
        return (await caches.match(req, { ignoreSearch: true })) ||
               (await caches.match("index.html")) ||
               (isHTML ? await caches.match("404.html") : null) ||
               new Response("Офлайн", { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } });
      }
    })());
    return;
  }

  const isFont = url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com";
  if (url.origin !== location.origin && !isFont) return;

  e.respondWith((async () => {
    const cached = await caches.match(req);
    if (cached) return cached;
    try {
      const res = await fetch(req);
      if (res && (res.ok || res.type === "opaque")) (await caches.open(RUNTIME)).put(req, res.clone());
      return res;
    } catch (_) {
      return new Response("", { status: 504 });
    }
  })());
});
  
