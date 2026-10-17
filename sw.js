// Garfada — service worker: funciona offline e atualiza sozinho quando há ligação.
const CACHE = 'garfada-v15';
const FICHEIROS = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './fraunces.woff2'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FICHEIROS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  // Só a própria app; os pedidos ao Gemini passam diretos.
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  e.respondWith(
    fetch(e.request.url, {cache: 'no-cache', credentials: 'same-origin'})  // confirma sempre com o servidor: atualizações chegam logo
      .then(r => {
        const copia = r.clone();
        caches.open(CACHE).then(c => c.put(e.request, copia));
        return r;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true }).then(r => r || caches.match('./index.html')))
  );
});
