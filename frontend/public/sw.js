const CACHE_NAME = "antigravity-static-v1";
const API_CACHE_NAME = "antigravity-api-v1";

const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/logo.svg",
  "/favicon.ico"
];

// Install Event - Pre-cache core shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[Service Worker] Pre-caching static app shell");
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event - Clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME && key !== API_CACHE_NAME) {
            console.log("[Service Worker] Removing old cache:", key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - Intercept and cache requests
self.addEventListener("fetch", (event) => {
  const requestUrl = new URL(event.request.url);

  // Skip non-GET requests
  if (event.request.method !== "GET") {
    return;
  }

  // Intercept API calls
  const isApiRequest = requestUrl.pathname.includes("/api/v1/") || requestUrl.port === "5000";
  if (isApiRequest) {
    event.respondWith(handleApiRequest(event.request));
    return;
  }

  // Intercept static assets & fonts
  event.respondWith(handleStaticRequest(event.request));
});

// Network-First with Cache-Fallback for API queries
async function handleApiRequest(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(API_CACHE_NAME);
      // Put cloned response in API cache
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log("[Service Worker] API Network request failed. Attempting offline cache fallback for:", request.url);
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return custom offline JSON response structure if query fails and has no cache
    return new Response(
      JSON.stringify({
        error: "Offline",
        message: "You are currently offline. Cache lookup for this item failed.",
        isOfflineError: true
      }),
      {
        status: 503,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}

// Stale-While-Revalidate for static resources (CSS, JS, Fonts, Images)
async function handleStaticRequest(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    // Fetch background update for stale resources
    fetch(request).then(async (networkResponse) => {
      if (networkResponse && networkResponse.status === 200) {
        const cache = await caches.open(CACHE_NAME);
        cache.put(request, networkResponse);
      }
    }).catch(() => {/* Ignore background network failures */});
    
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    // If navigating to page, fallback to root index.html (Client Routing fallback)
    if (request.mode === "navigate") {
      const rootCache = await caches.match("/index.html");
      if (rootCache) return rootCache;
    }
    throw error;
  }
}
