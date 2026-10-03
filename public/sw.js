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

/** 旧版本缓存的保留宽限期：刚激活时不立即删旧缓存——已打开的旧标签页仍会请求旧
    hash 资源（旧文件已不在新部署里），立刻删除会让旧页面断供 404。宽限后清理；
    若 SW 在宽限期内被终止，下次激活会重新走这套逻辑，最终仍会被清理 */
const OLD_CACHE_GRACE_MS = 60 * 60 * 1000

/** 离线壳资源永不淘汰：APP_ROOT 是离线导航回退，manifest/图标缺失会让 PWA 安装静默失败 */
const SHELL_URLS = new Set([
  APP_ROOT,
  new URL('manifest.webmanifest', APP_ROOT).href,
  new URL('favicon.svg', APP_ROOT).href,
  new URL('icon-192.png', APP_ROOT).href,
  new URL('icon-512.png', APP_ROOT).href,
])

async function pruneCache() {
  const cache = await caches.open(CACHE)
  const keys = await cache.keys()
  const evictable = keys.filter((k) => !SHELL_URLS.has(new URL(k.url).href))
  if (evictable.length <= MAX_ENTRIES) return
  // keys 按插入顺序；条目命中时会"删除重插"移到队尾（见 fetch 处理），近似 LRU 淘汰最久未用的
  const excess = evictable.length - MAX_ENTRIES
  await Promise.all(evictable.slice(0, excess).map((k) => cache.delete(k)))
}

/** 命中缓存后刷新位置：delete + put 把条目移到队尾，pruneCache 淘汰的才是"最久未使用"。
    注意必须传入"返回之前就 clone 好"的副本——等 await 之后再 clone，body 已被浏览器消费，会抛错 */
async function refreshCachePosition(request, copy) {
  const cache = await caches.open(CACHE)
  await cache.delete(request)
  await cache.put(request, copy)
  await pruneCache()
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE)
      // 逐项容错预缓存：单个资源失败不阻断 install（addAll 是原子的，一处失败全盘失败）
      await Promise.all(
        [...SHELL_URLS].map(async (url) => {
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
    (async () => {
      setTimeout(() => {
        caches
          .keys()
          .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
          .catch(() => {})
      }, OLD_CACHE_GRACE_MS)
      await pruneCache()
      await self.clients.claim()
    })(),
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
          // 同步 clone 后再交给回位逻辑（不 await）：既不拖慢响应，又保证 body 未被消费
          const copy = hit.clone()
          refreshCachePosition(request, copy).catch(() => {})
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
