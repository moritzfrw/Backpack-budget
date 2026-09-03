/* Service Worker: laedt die App einmal in den Zwischenspeicher,
   damit sie auch ohne Netz startet. Wenn du Dateien aenderst,
   erhoehe die Zahl in VERSION – sonst sieht das Handy die
   alte Version weiter. */

const VERSION = 'backpack-budget-v9';
const DATEIEN = [
  './', './index.html',
  './css/style.css',
  './js/store.js', './js/budget.js', './js/sync.js', './js/app.js',
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

  /* Nur die eigenen Dateien anfassen. Ohne diese Zeile landen auch
     die Abrufe beim Speicherdienst im Zwischenspeicher - und ohne
     Netz bekaeme die App dann eine alte Antwort von dort geliefert,
     statt zu merken, dass der Server unerreichbar ist. Der Abgleich
     wuerde also mit veralteten Daten rechnen. */
  const ziel = new URL(e.request.url);
  if (ziel.origin !== self.location.origin) return;

  e.respondWith(
    /* 'no-cache' heisst nicht "gar kein Zwischenspeicher", sondern
       "immer beim Server rueckfragen". Hat sich nichts geaendert,
       antwortet der mit ein paar Bytes. Ohne das koennte das Handy
       bis zu zehn Minuten lang eine alte Fassung ausliefern, weil
       GitHub Pages max-age=600 mitschickt. */
    fetch(e.request, { cache: 'no-cache' })
      .then(antwort => {
        const kopie = antwort.clone();
        caches.open(VERSION).then(c => c.put(e.request, kopie));
        return antwort;
      })
      .catch(() => caches.match(e.request).then(t => t || caches.match('./index.html')))
  );
});
