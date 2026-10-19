// StudyFlow service worker — cache de app shell para uso sin conexión.
// Estrategia: cache-first para los recursos propios de la app (todos locales, sin CDN).
// Al cambiar archivos, sube el número de versión para forzar la actualización.
const CACHE = 'studyflow-v1';

const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/styles.css',
  './vendor/ts-fsrs.mjs',
  './icons/icon.svg',
  './js/main.js',
  './js/router.js',
  './js/ui/dom.js',
  './js/ui/components.js',
  './js/store/db.js',
  './js/store/repo.js',
  './js/domain/scheduler.js',
  './js/domain/csv.js',
  './js/data/seed.js',
  './js/views/home.js',
  './js/views/decks.js',
  './js/views/deck-detail.js',
  './js/views/card-editor.js',
  './js/views/study.js',
  './js/views/profile.js',
  './js/views/transfer.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Solo gestionamos recursos del mismo origen (la app es 100% local).
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req)
        .then((res) => {
          // Guarda en caché las respuestas correctas para la próxima vez.
          if (res && res.status === 200 && res.type === 'basic') {
            const copy = res.clone();
            caches.open(CACHE).then((cache) => cache.put(req, copy));
          }
          return res;
        })
        .catch(() => {
          // Sin red y sin caché: si es navegación, devuelve el shell.
          if (req.mode === 'navigate') return caches.match('./index.html');
          return new Response('', { status: 504, statusText: 'offline' });
        });
    })
  );
});
