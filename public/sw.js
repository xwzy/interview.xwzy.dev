/* 面试宝典 Service Worker：网络优先、离线回退（静态站点缓存策略） */
/* CACHE 名里的构建版本令牌由 scripts/inject-sw-version.mjs 在构建后替换——
   每次部署内容变化都会换新缓存名，activate 时整删旧版本缓存（跨版本清理真正生效） */
const CACHE = 'interview-cache-__SW_BUILD_ID__'

/** 应用根目录（从 SW scope 派生，兼容根路径与子路径部署） */
const APP_ROOT = self.registration.scope

/** 构建产物目录：Vite 输出的文件名带内容 hash，内容不变，可放心缓存优先 */
const ASSETS_PREFIX = new URL('assets/', APP_ROOT).href

/** 缓存条目上限：同版本内防止缓存无限增长（跨版本靠换缓存名整体清理） */
const MAX_ENTRIES = 150

/** 导航请求（HTML）网络优先的超时：超时后回退缓存，弱网挂起不再白屏等待 */
const NAV_TIMEOUT_MS = 4000

async function pruneCache() {
  const cache = await caches.open(CACHE)
  const keys = await cache.keys()
  if (keys.length <= MAX_ENTRIES) return
  // keys 按插入顺序；条目命中时会"删除重插"移到队尾（见 fetch 处理），近似 LRU 淘汰最久未用的
  await Promise.all(keys.slice(0, keys.length - MAX_ENTRIES).map((k) => cache.delete(k)))
}

/** 命中缓存后刷新位置：delete + put 把条目移到队尾，pruneCache 淘汰的才是"最久未使用" */
async function refreshCachePosition(request, response) {
  const cache = await caches.open(CACHE)
  const copy = response.clone()
  await cache.delete(request)
  await cache.put(request, copy)
  await pruneCache()
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE)
      // 逐项容错预缓存：单个资源失败不阻断 install（addAll 是原子的，一处失败全盘失败）
      const shell = [
        APP_ROOT,
        new URL('manifest.webmanifest', APP_ROOT).href,
        new URL('favicon.svg', APP_ROOT).href,
        new URL('icon-192.png', APP_ROOT).href,
        new URL('icon-512.png', APP_ROOT).href,
      ]
      await Promise.all(
        shell.map(async (url) => {
          try {
            await cache.add(url)
          } catch {
            // 单个壳资源失败：留给运行时按需再取
          }
        }),
      )
      await self.skipWaiting()
    })(),
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

function fetchWithTimeout(request) {
  // AbortSignal.timeout 需要较新浏览器；旧环境退回普通 fetch（无超时，行为同从前）
  if (typeof AbortSignal.timeout === 'function') {
    return fetch(request, { signal: AbortSignal.timeout(NAV_TIMEOUT_MS) })
  }
  return fetch(request)
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  // 带 hash 的构建产物：缓存优先（命中即零网络等待，离线亦可用），未命中回源并写入缓存。
  // 新版本部署后旧 hash 文件会随部署消失，届时命中失败自动回源拿到新 HTML 引用的新资源。
  if (url.href.startsWith(ASSETS_PREFIX)) {
    event.respondWith(
      (async () => {
        const hit = await caches.match(request)
        if (hit) {
          // 不 await：回位写缓存不应拖慢响应返回
          refreshCachePosition(request, hit).catch(() => {})
          return hit
        }
        const response = await fetch(request)
        if (response.ok) {
          const copy = response.clone()
          caches
            .open(CACHE)
            .then((cache) => cache.put(request, copy))
            .then(pruneCache)
            .catch(() => {})
        }
        return response
      })(),
    )
    return
  }

  // 其余（HTML 导航等）：网络优先，在线拿最新（成功的响应写入缓存）；
  // 离线或弱网超时（挂起超过 4s）回退缓存；导航请求回退到应用根（SPA）
  event.respondWith(
    (async () => {
      try {
        const response = await fetchWithTimeout(request)
        if (response.ok) {
          const copy = response.clone()
          caches
            .open(CACHE)
            .then((cache) => cache.put(request, copy))
            .then(pruneCache)
            .catch(() => {})
        }
        return response
      } catch {
        const hit = await caches.match(request)
        if (hit) return hit
        if (request.mode === 'navigate') {
          const root = await caches.match(APP_ROOT)
          if (root) return root
        }
        return Response.error()
      }
    })(),
  )
})
