#!/usr/bin/env node
/**
 * 构建后给 dist/sw.js 注入缓存版本（vite build 之后、check-dist 之前执行）：
 * 把 public/sw.js 里的 __SW_BUILD_ID__ 令牌替换为产物内容摘要。
 * 内容变化 → 新版本号 → SW 文件字节变化触发更新 → activate 整删旧版本缓存。
 * 内容不变 → 版本号稳定（可重复构建），不会无谓地作废用户缓存。
 */
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

const TOKEN = '__SW_BUILD_ID__'
const dist = resolve('dist')
const swPath = join(dist, 'sw.js')
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
