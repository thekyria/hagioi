// Offline support for the installed app. Same-origin files are fetched
// network-first (the cache is only a fallback), because the pages, script.js,
// i18n.js and style.css change together on every deploy and must not be
// mixed across versions. The Google font is served from the cache and
// refreshed in the background. /api/ responses, Vercel Web Analytics
// (/_vercel/) and Google Maps itself are never cached, so the map still needs a
// connection.
const CACHE = 'hagioi-v1';
const CORE = [
    '/',
    '/en/',
    '/el/',
    '/style.css',
    '/i18n.js',
    '/script.js',
    '/data/saints.json',
    '/data/saints.el.json',
    '/manifest.webmanifest',
    '/assets/logo.svg',
    '/assets/avatar-placeholder.svg',
    '/assets/app-icons/icon-192.png',
    '/assets/app-icons/icon.svg',
];

self.addEventListener('install', (event) => {
    event.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
            .then(() => self.clients.claim()),
    );
});

const cacheable = (res) => res && (res.ok || res.type === 'opaque');

self.addEventListener('fetch', (event) => {
    const req = event.request;
    if (req.method !== 'GET') return;
    const url = new URL(req.url);
    const sameOrigin = url.origin === location.origin;
    const isFont = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';

    if (sameOrigin && !url.pathname.startsWith('/api/') && !url.pathname.startsWith('/_vercel/')) {
        // ?lang=… and other settings live in the query; any of them can use the cached page.
        event.respondWith(
            fetch(req)
                .then((res) => {
                    if (res.ok) caches.open(CACHE).then((c) => c.put(req, res.clone()));
                    return res;
                })
                .catch(() => caches.match(req, { ignoreSearch: req.mode === 'navigate' })),
        );
        return;
    }

    if (!isFont) return;
    event.respondWith(
        caches.open(CACHE).then(async (cache) => {
            const cached = await cache.match(req);
            const fresh = fetch(req)
                .then((res) => {
                    if (cacheable(res)) cache.put(req, res.clone());
                    return res;
                })
                .catch(() => cached);
            if (cached) {
                event.waitUntil(fresh);
                return cached;
            }
            return fresh;
        }),
    );
});
