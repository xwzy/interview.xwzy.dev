#!/usr/bin/env node
/**
 * 构建后处理（vite build 之后、check-dist 之前执行）：
 * 1. 给 dist/sw.js 注入缓存版本：把 public/sw.js 里的 __SW_BUILD_ID__ 令牌替换为产物内容摘要。
 *    内容变化 → 新版本号 → SW 文件字节变化触发更新 → activate 按宽限期清理旧版本缓存。
 *    内容不变 → 版本号稳定（可重复构建），不会无谓地作废用户缓存。
 * 2. 子路径部署（VITE_BASE_PATH）时修补 dist/manifest.webmanifest：public/ 下的文件
 *    vite 原样拷贝、不做路径 rebase，start_url/scope/图标若仍是根绝对路径，
 *    子路径部署下 PWA 安装会静默损坏（scope 校验失败、图标 404）。
 */
import { createHash } from 'node:crypto'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

const TOKEN = '__SW_BUILD_ID__'
const dist = resolve('dist')
const swPath = join(dist, 'sw.js')
for (const f of [join(dist, 'index.html'), swPath]) {
  if (!existsSync(f)) {
    console.error(`[sw-version] 缺失 ${f}——构建顺序异常或 vite build 未成功`)
    process.exit(1)
  }
}
const html = readFileSync(join(dist, 'index.html'), 'utf8')

// index.html 引用了全部带 hash 的产物名，其内容摘要即可代表本次构建
const buildId = createHash('sha256').update(html).digest('hex').slice(0, 16)

const sw = readFileSync(swPath, 'utf8')
if (!sw.includes(TOKEN)) {
  console.error(`[sw-version] dist/sw.js 中未找到版本令牌 ${TOKEN}——请检查 public/sw.js 是否被改动`)
  process.exit(1)
}
writeFileSync(swPath, sw.replaceAll(TOKEN, buildId))
console.log(`[sw-version] Service Worker 缓存版本已注入: interview-cache-${buildId}`)

// ---------- 子路径部署的 manifest 修补 ----------

const rawBase = process.env.VITE_BASE_PATH
if (rawBase && rawBase !== '/') {
  const base = rawBase.endsWith('/') ? rawBase : `${rawBase}/`
  const manifestPath = join(dist, 'manifest.webmanifest')
  if (!existsSync(manifestPath)) {
    console.error('[sw-version] 子路径部署但 dist/manifest.webmanifest 不存在')
    process.exit(1)
  }
  const withBase = (p) => (p.startsWith('/') ? base.replace(/\/$/, '') + p : p)
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
  if (typeof manifest.start_url === 'string') manifest.start_url = withBase(manifest.start_url)
  if (typeof manifest.scope === 'string') manifest.scope = withBase(manifest.scope)
  if (typeof manifest.id === 'string' && manifest.id.startsWith('/')) manifest.id = withBase(manifest.id)
  if (Array.isArray(manifest.icons)) {
    manifest.icons = manifest.icons.map((icon) =>
      typeof icon?.src === 'string' ? { ...icon, src: withBase(icon.src) } : icon,
    )
  }
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`)
  console.log(`[sw-version] manifest 已按 base ${base} 修补 start_url/scope/id/icons`)
}
