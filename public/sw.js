/* 面试宝典 Service Worker：网络优先、离线回退（静态站点缓存策略） */
const CACHE = 'interview-cache-v1'

/** 应用根目录（从 SW scope 派生，兼容根路径与子路径部署） */
const APP_ROOT = self.registration.scope

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll([APP_ROOT]))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  // 网络优先：在线拿最新（成功的响应写入缓存），离线时回退缓存；导航请求回退到应用根（SPA）
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const copy = response.clone()
          caches.open(CACHE).then((cache) => cache.put(request, copy))
        }
        return response
      })
      .catch(() =>
        caches.match(request).then((hit) => {
          if (hit) return hit
          if (request.mode === 'navigate') return caches.match(APP_ROOT)
          return Response.error()
        }),
      ),
  )
})
