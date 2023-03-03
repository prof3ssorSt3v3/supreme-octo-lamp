const version = 6;
const cacheName = `giftrPwaSiteFiles${version}`;
const cacheList = [
  './',
  './index.html',
  './css/main.css',
  './js/app.js',
  './manifest.json',
  './img/favicon-16x16.png',
  './img/favicon-32x32.png',
  './img/android-chrome-192x192.png',
  './img/android-chrome-512x512.png',
  './img/apple-touch-icon.png',
  './img/favicon.ico',
  './img/gift-card.png',
  './img/gift-card.svg',
  './img/mstile-150x150.png',
  './img/safari-pinned-tab.svg',
  './browserconfig.xml',
];

self.addEventListener('install', (ev) => {
  ev.waitUntil(
    caches
      .open(cacheName)
      .then((cache) => {
        cache.addAll(cacheList);
      })
      .catch(console.warn)
  );
});

self.addEventListener('activate', (ev) => {
  ev.waitUntil(
    caches
      .keys()
      .then((keys) => {
        return Promise.all(
          keys
            .filter((key) => {
              return key !== cacheName && key !== 'GiftrPeopleCache';
            })
            .map((key) => caches.delete(key))
        );
      })
      .catch(console.warn)
  );
});

self.addEventListener('fetch', (ev) => {
  let isOnline = navigator.onLine;
  let url = new URL(ev.request.url);
  let isChromeExt = url.protocol.includes('chrome');

  if (isOnline) {
    if (isChromeExt) {
      ev.respondWith(fetchOnly(ev));
    } else {
      ev.respondWith(staleWhileRevalidate(ev));
    }
  } else {
    ev.respondWith(cacheOnly(ev));
  }
});

function staleWhileRevalidate(ev) {
  //return cache then fetch and save latest fetch
  return caches.match(ev.request).then((cacheResponse) => {
    let fetchResponse = fetch(ev.request).then((response) => {
      //handle 404 errors by returning the home page
      if (response.status === 404 && ev.request.mode === 'navigate') return caches.match('./');

      return caches.open(cacheName).then((cache) => {
        cache.put(ev.request, response.clone());
        return response;
      });
    });
    return cacheResponse || fetchResponse;
  });
}

function cacheOnly(ev) {
  //only the response from the cache
  return caches.match(ev.request);
}

function fetchOnly(ev) {
  //only the result of a fetch
  return fetch(ev.request).then((response) => {
    //return index.html if we get a 404 error for a web page
    if (response.status === 404 && ev.request.mode === 'navigate') return caches.match('./');
    //return valid fetch responses
    return response;
  });
}
