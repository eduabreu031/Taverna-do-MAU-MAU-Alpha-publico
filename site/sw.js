/* Taverna do MAU MAU — atualização automática e modo offline.
   Rede primeiro: cada nova navegação procura o HTML mais recente.
   O jogo aberto nunca é recarregado à força durante uma partida. */
const CACHE = 'taverna-pwa-icon-refresh-20261020-1';
const PREFIXES = ['taverna-v73-pwa-', 'taverna-v84-', 'taverna-pwa-'];
const ASSETS = [
  './', './index.html', './manifest.webmanifest',
  './icons/icon-144.png', './icons/icon-180.png',
  './icons/icon-192.png?v=alpha-icon-20261020-1', './icons/icon-512.png?v=alpha-icon-20261020-1',
  './icons/icon-72.png', './icons/icon-96.png',
  './icons/icon-maskable-192.png?v=alpha-icon-20261020-1', './icons/icon-maskable-512.png?v=alpha-icon-20261020-1'
];
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(async cache => {
      // Uma falha pontual de download nao pode impedir a ativacao do novo SW.
      await Promise.allSettled(ASSETS.map(asset => cache.add(asset)));
    }).then(() => self.skipWaiting())
  );
});
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => PREFIXES.some(p => k.startsWith(p)) && k !== CACHE)
        .map(k => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin ||
      !url.pathname.startsWith(new URL(self.registration.scope).pathname)) return;

  // Sempre tenta rede primeiro, inclusive para index.html, quando há internet.
  // Em perda de conexão, usa a última versão armazenada para manter o modo offline.
  event.respondWith(
    fetch(event.request, (event.request.mode === 'navigate' || url.pathname.endsWith('/manifest.webmanifest')) ? { cache: 'no-store' } : undefined).then(response => {
      if (response.ok) {
        const copy = response.clone();
        event.waitUntil(caches.open(CACHE).then(cache => cache.put(event.request, copy)).catch(() => {}));
      }
      return response;
    }).catch(async () =>
      (await caches.match(event.request, { ignoreSearch: true })) ||
      (event.request.mode === 'navigate' ? await caches.match('./index.html') : undefined) ||
      Response.error()
    )
  );
});
