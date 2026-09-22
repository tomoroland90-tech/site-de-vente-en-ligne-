const CACHE_NAME = 'shop-online-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(name => {
          if (name !== CACHE_NAME) return caches.delete(name);
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  // Ne pas cacher les API Supabase, Vercel, PeerJS
  if (event.request.url.includes('supabase') || event.request.url.includes('/api/') || event.request.url.includes('peerjs')) {
    return;
  }
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) return response;
        return fetch(event.request).then(res => {
          if (!res || res.status !== 200 || res.type !== 'basic') return res;
          const resToCache = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, resToCache));
          return res;
        });
      })
      .catch(() => caches.match('/index.html'))
  );
});
