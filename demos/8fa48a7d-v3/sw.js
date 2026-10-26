const CACHE='app-v1792929250';
const FILES=["./", "./index.html", "./styles.css", "./app.js", "./pwa.js", "./manifest.webmanifest", "./icons/icon-192.png", "./icons/icon-512.png", "./assets/base.css", "./assets/fonts/Vazirmatn-Bold.woff2", "./assets/fonts/Vazirmatn-ExtraBold.woff2", "./assets/fonts/Vazirmatn-Medium.woff2", "./assets/fonts/Vazirmatn-Regular.woff2"];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)));self.skipWaiting();});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==CACHE).map(x=>caches.delete(x)))));self.clients.claim();});
self.addEventListener('fetch',e=>{e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)));});
