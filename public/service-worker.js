// Pusher Beams service worker integration
importScripts('https://js.pusher.com/beams/service-worker.js');

// Minimal fetch handler for PWA installability
self.addEventListener('fetch', () => {});
