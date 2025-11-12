// Service Worker for offline support and caching
const CACHE_NAME = "attendance-v1"
const ASSETS_TO_CACHE = ["/", "/teacher", "/student", "/manifest.json"]

// Install event: cache key assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch(() => {
        // Continue even if some assets fail
        console.log("Some assets failed to cache, continuing...")
      })
    }),
  )
  self.skipWaiting()
})

// Activate event: clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter((cacheName) => cacheName !== CACHE_NAME).map((cacheName) => caches.delete(cacheName)),
      )
    }),
  )
  self.clients.claim()
})

// Fetch event: serve from cache, fallback to network
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response
      }

      return fetch(event.request)
        .then((response) => {
          // Don't cache non-GET or non-successful responses
          if (!response || response.status !== 200 || response.type === "basic") {
            return response
          }

          // Clone the response
          const responseToCache = response.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache)
          })

          return response
        })
        .catch(() => {
          // Return cached version or offline page
          return caches.match("/")
        })
    }),
  )
})
