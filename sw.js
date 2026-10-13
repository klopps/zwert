// Service Worker: Alles vorab cachen, danach cache-first (offline lauffähig).
// Bei JEDER Änderung an einer gecachten Datei VERSION erhöhen, sonst bleiben alte Stände aktiv.
const VERSION = 'v9';
const CACHE = `zwert-${VERSION}`;

// Relativ zum Scope; neue Dateien hier eintragen.
const PRECACHE = [
  './',
  'index.html',
  'info.html',
  'impressum.html',
  'datenschutz.html',
  'app.css',
  'app.webmanifest',
  'js/zcalc.js',
  'js/ui.js',
  'js/pwa.js',
  'fonts/roboto-condensed-latin-300-normal.woff2',
  'fonts/roboto-condensed-latin-400-normal.woff2',
  'fonts/roboto-condensed-latin-700-normal.woff2',
  'icons/apple-touch-icon.png',
  'icons/favicon-16x16.png',
  'icons/favicon-32x32.png',
  'icons/android-chrome-192x192.png',
  'icons/android-chrome-512x512.png',
  'images/background.webp',
  'images/alter.png',
  'images/drucker.png',
  'images/fahrertyp.png',
  'images/fahrertyp1.png',
  'images/fahrertyp2.png',
  'images/fahrertyp3.png',
  'images/gewicht.png',
  'images/groesse.png',
  'images/my.png',
  'images/mz.png',
  'images/sohlenlaenge.png',
  'images/zwert.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) =>
      // cache: 'reload' umgeht den HTTP-Cache, damit wirklich der neue Stand gespeichert wird.
      cache.addAll(PRECACHE.map((u) => new Request(new URL(u, self.registration.scope), { cache: 'reload' }))),
    ),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('zwert-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

// Nutzer bestätigt das Update im Hinweis-Banner (siehe js/pwa.js).
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      // ignoreSearch: index.html?debug=1 trifft den Cache-Eintrag von index.html.
      const hit = await cache.match(req, { ignoreSearch: true });
      if (hit) return hit;
      try {
        return await fetch(req);
      } catch (err) {
        if (req.mode === 'navigate') return cache.match(new URL('index.html', self.registration.scope));
        throw err;
      }
    }),
  );
});
