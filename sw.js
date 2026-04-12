// GrowDoc Companion — Service Worker
//
// Section 09: PWA installability + offline support.
//
// Caching strategy:
//   - Static assets (.js, .css, .json, .png, .jpg, .svg, .ico, fonts):
//       cache-first, update in background (stale-while-revalidate).
//   - API calls (/api/*):
//       network-first, cache fallback. NEVER returns index.html.
//   - Docs (/docs/*):
//       network-first, cache fallback. NEVER returns index.html.
//   - Navigation requests (mode === 'navigate') for SPA routes:
//       try network first (so a fresh deploy is seen quickly), fall
//       back to cached /index.html, then to /offline.html.
//
// CRITICAL invariant: only request.mode === 'navigate' returns
// index.html. Static-extension and known-prefix exclusions guard
// against returning HTML for /docs/plant-doctor-data.js etc.
//
// VERSION is intended to be bumped on every deploy. The string below
// is a placeholder — a build script can sed-replace it pre-deploy.

const VERSION = '2026-04-stab1';
const STATIC_CACHE = `growdoc-static-${VERSION}`;
const RUNTIME_CACHE = `growdoc-runtime-${VERSION}`;

// Minimal app shell — only the synchronously-imported critical path.
// Lazy-loaded views populate the runtime cache on first visit.
const PRECACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/offline.html',
  '/css/variables.css',
  '/css/layout.css',
  '/css/components.css',
  '/css/dashboard.css',
  '/js/main.js',
  '/js/store.js',
  '/js/storage.js',
  '/js/router.js',
  '/js/utils.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE).catch((err) => {
        // Don't fail install if some assets are missing — they'll
        // populate the runtime cache on first visit.
        console.warn('[sw] precache partial failure:', err);
      }))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(
        names
          .filter((name) => name.startsWith('growdoc-') && name !== STATIC_CACHE && name !== RUNTIME_CACHE)
          .map((name) => caches.delete(name))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

const STATIC_EXTENSIONS = /\.(js|mjs|css|json|png|jpg|jpeg|svg|ico|woff|woff2|ttf)$/i;

function _isApi(url) {
  return url.pathname.startsWith('/api/');
}

function _isDocs(url) {
  return url.pathname.startsWith('/docs/');
}

function _isStaticAsset(url) {
  if (url.pathname.startsWith('/js/') || url.pathname.startsWith('/css/')) return true;
  return STATIC_EXTENSIONS.test(url.pathname);
}

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Skip non-GET (POST/PUT/DELETE bypass the SW entirely)
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Cross-origin (Google Fonts, etc.) — let the browser handle, with
  // a passive runtime cache for offline reuse.
  if (url.origin !== location.origin) {
    event.respondWith(_staleWhileRevalidate(request));
    return;
  }

  // API: network-first, cache fallback, JSON 503 on total failure.
  // MUST NOT return index.html.
  if (_isApi(url)) {
    event.respondWith(_networkFirstApi(request));
    return;
  }

  // Docs: network-first, cache fallback. MUST NOT return index.html.
  if (_isDocs(url)) {
    event.respondWith(_networkFirstNoFallback(request));
    return;
  }

  // Static assets: cache-first, stale-while-revalidate.
  // MUST NOT return index.html.
  if (_isStaticAsset(url)) {
    event.respondWith(_staleWhileRevalidate(request));
    return;
  }

  // SPA navigation: only request.mode === 'navigate' may receive
  // the cached index.html shell.
  if (request.mode === 'navigate') {
    event.respondWith(_navigationStrategy(request));
    return;
  }

  // Fallback: network with cache backup, then offline page.
  event.respondWith(_networkFallbackOffline(request));
});

async function _staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(request);
  const networkPromise = fetch(request)
    .then((response) => {
      if (response && response.status === 200 && response.type !== 'opaque') {
        cache.put(request, response.clone()).catch(() => {});
      }
      return response;
    })
    .catch(() => null);
  return cached || (await networkPromise) || new Response('', { status: 504 });
}

async function _networkFirstApi(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  try {
    const response = await fetch(request);
    if (response && response.status === 200) {
      cache.put(request, response.clone()).catch(() => {});
    }
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    return new Response(JSON.stringify({ ok: false, offline: true }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

async function _networkFirstNoFallback(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  try {
    const response = await fetch(request);
    if (response && response.status === 200) {
      cache.put(request, response.clone()).catch(() => {});
    }
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    return new Response('Offline and not cached', { status: 503 });
  }
}

async function _navigationStrategy(request) {
  try {
    // Try network first so fresh deploys propagate quickly
    const response = await fetch(request);
    return response;
  } catch {
    // Fall back to cached app shell, then offline page
    const cache = await caches.open(STATIC_CACHE);
    const shell = await cache.match('/index.html');
    if (shell) return shell;
    const offline = await cache.match('/offline.html');
    if (offline) return offline;
    return new Response('Offline', { status: 503 });
  }
}

async function _networkFallbackOffline(request) {
  try {
    const response = await fetch(request);
    return response;
  } catch {
    const cache = await caches.open(STATIC_CACHE);
    const offline = await cache.match('/offline.html');
    if (offline) return offline;
    return new Response('Offline', { status: 503 });
  }
}
