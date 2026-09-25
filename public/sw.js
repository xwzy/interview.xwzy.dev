/* 面试宝典 Service Worker：网络优先、离线回退（静态站点缓存策略） */
const CACHE = 'interview-cache-v1'

/** 应用根目录（从 SW scope 派生，兼容根路径与子路径部署） */
const APP_ROOT = self.registration.scope

/** 缓存条目上限：防止跨版本部署后旧 hash 资源无限累积撑大存储 */
const MAX_ENTRIES = 150

async function pruneCache() {
  const cache = await caches.open(CACHE)
  const keys = await cache.keys()
  if (keys.length <= MAX_ENTRIES) return
  // keys 按插入顺序，淘汰最早的超出部分
  await Promise.all(keys.slice(0, keys.length - MAX_ENTRIES).map((k) => cache.delete(k)))
}

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
      .then(pruneCache)
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
          caches
            .open(CACHE)
            .then((cache) => cache.put(request, copy))
            .then(pruneCache)
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
