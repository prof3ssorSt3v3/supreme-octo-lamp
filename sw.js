const version = 1;
const cacheName = `giftrpwasitefiles${version}`;
const cacheList = [
  './',
  './index.html',
  './css/main.css',
  './js/main.js',
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
        return Promise.all(keys.filter((key) => key !== cacheName).map((key) => caches.delete(key)));
      })
      .catch(console.warn)
  );
});

self.addEventListener('fetch', (ev) => {});
