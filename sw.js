const CACHE_NAME = 'shop-online-v4';
const URLS_TO_CACHE = ['/', '/index.html', '/manifest.json'];

self.addEventListener('install', event => {
  console.log('[SW] Install');
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(URLS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  console.log('[SW] Activate');
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)));
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if(event.request.method !== 'GET') return;
  if(event.request.url.includes('supabase') || event.request.url.includes('/api/')) return;
  
  event.respondWith(
    caches.match(event.request).then(cached => {
      const networkFetch = fetch(event.request).then(networkResponse => {
        if(networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic'){
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return networkResponse;
      }).catch(() => cached);
      
      return cached || networkFetch;
    })
  );
});

self.addEventListener('push', event => {
  const data = event.data ? event.data.text() : 'Nouvelle notif SHOP ONLINE';
  event.waitUntil(
    self.registration.showNotification('SHOP ONLINE Cameroun', {
      body: data,
      icon: 'https://cdn-icons-png.flaticon.com/512/3081/3081559.png',
      badge: 'https://cdn-icons-png.flaticon.com/512/3081/3081559.png'
    })
  );
});
