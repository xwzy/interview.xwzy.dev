#!/usr/bin/env node
/**
 * 构建产物完整性校验（npm run build 后自动执行）：
 * 1. index.html 引用的所有资源在 dist 内真实存在（曾经发生过子路径 base 配置错误导致线上全 404 白屏）
 * 2. PWA 关键文件（sw.js / manifest / 404 回退）已发布
 * 任一检查失败即以非零码退出，阻断 CI 发布。
 */
import { readFileSync, existsSync } from 'node:fs'
import { join, resolve } from 'node:path'

const dist = resolve('dist')
const htmlPath = join(dist, 'index.html')
if (!existsSync(htmlPath)) {
  console.error('[check-dist] dist/index.html 不存在，构建产物异常')
  process.exit(1)
}

const html = readFileSync(htmlPath, 'utf8')

// 从 vite.config.ts 读取 base（与构建时一致）
const viteCfg = readFileSync('vite.config.ts', 'utf8')
const baseMatch = viteCfg.match(/base:\s*(?:process\.env\.VITE_BASE_PATH\s*\?\?\s*)?'([^']*)'/)
const base = baseMatch ? baseMatch[1] : '/'
if (!base.endsWith('/')) {
  console.error('[check-dist] vite base 配置必须以 / 结尾，当前:', base)
  process.exit(1)
}

// 收集 index.html 引用的站内资源
const refs = [...html.matchAll(/(?:src|href)="(\/[^"]+)"/g)].map((m) => m[1].split('?')[0])
if (refs.length === 0) {
  console.error('[check-dist] index.html 未引用任何站内资源')
  process.exit(1)
}

let failures = 0
for (const ref of refs) {
  const rel = ref.startsWith(base) ? ref.slice(base.length) : ref.slice(1)
  const file = join(dist, rel)
  if (!existsSync(file)) {
    console.error(`[check-dist] 缺失资源: ${ref}（应为 ${file}）`)
    failures += 1
  }
}

// base 前缀一致性：所有引用必须同前缀，防止部分资源遗漏 base
const prefixes = new Set(refs.map((r) => r.slice(0, base.length)))
if (prefixes.size > 1) {
  console.error('[check-dist] 资源 base 前缀不一致:', [...prefixes])
  failures += 1
}

// PWA 关键文件
for (const f of ['sw.js', 'manifest.webmanifest', '404.html']) {
  if (!existsSync(join(dist, f))) {
    console.error(`[check-dist] 缺失 PWA 文件: ${f}`)
    failures += 1
  }
}

if (failures > 0) {
  console.error(`[check-dist] 校验失败，共 ${failures} 处`)
  process.exit(1)
}
console.log(`[check-dist] 校验通过：${refs.length} 个资源引用 + PWA 文件全部在位（base=${base}）`)
