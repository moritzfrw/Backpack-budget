/* Service Worker: laedt die App einmal in den Zwischenspeicher,
   damit sie auch ohne Netz startet. Wenn du Dateien aenderst,
   erhoehe die Zahl in VERSION – sonst sieht das Handy die
   alte Version weiter. */

const VERSION = 'backpack-budget-v4';
const DATEIEN = [
  './', './index.html',
  './css/style.css',
  './js/store.js', './js/budget.js', './js/app.js',
  './manifest.json', './icon.svg'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(DATEIEN)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(namen =>
    Promise.all(namen.filter(n => n !== VERSION).map(n => caches.delete(n)))));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request)
      .then(antwort => {
        const kopie = antwort.clone();
        caches.open(VERSION).then(c => c.put(e.request, kopie));
        return antwort;
      })
      .catch(() => caches.match(e.request).then(t => t || caches.match('./index.html')))
  );
});
