#!/usr/bin/env node
/**
 * 题库延伸资料链接巡检：抓取 src/data 全部 topic.references 的 URL，
 * 标记重定向与失效链接。外部站点有波动，不进 CI；改完资料或定期手动跑：
 *   npm run check:links
 * 退出码非零 = 存在失效链接。重定向仅提示（目标仍可达），建议顺手更新为规范地址。
 */
import { build } from 'esbuild'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'

const root = resolve(import.meta.dirname, '..')
const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36'

// 与 gen-track-meta 相同：题库数据打成临时 CJS 供 Node 执行
const tmp = mkdtempSync(join(tmpdir(), 'check-links-'))
const bundlePath = join(tmp, 'trackLoaders.cjs')
try {
  await build({
    entryPoints: [join(root, 'src/data/trackLoaders.ts')],
    outfile: bundlePath,
    bundle: true,
    format: 'cjs',
    platform: 'node',
    write: true,
    logLevel: 'silent',
  })
  const require = createRequire(import.meta.url)
  const { loadAllTracks } = await import(pathToFileURL(bundlePath).href)
  const tracks = await loadAllTracks()

  // 收集去重（同一 URL 可能被多个领域引用）
  const refs = new Map()
  for (const track of tracks) {
    for (const topic of track.topics) {
      for (const ref of topic.references ?? []) {
        const list = refs.get(ref.url) ?? []
        list.push(`${track.id}/${topic.id}`)
        refs.set(ref.url, list)
      }
    }
  }
  console.log(`[check-links] 共 ${refs.size} 个延伸资料链接\n`)

  /** 归一化：去掉地区参数与路径中的冗余斜杠——这类"重定向"对用户透明，视为直达 */
function normalizeUrl(u) {
  try {
    const parsed = new URL(u)
    parsed.searchParams.delete('hl')
    parsed.searchParams.delete('locale')
    parsed.pathname = parsed.pathname.replace(/\/{2,}/g, '/')
    return parsed.toString()
  } catch {
    return u
  }
}

let dead = 0
let redirected = 0
let blocked = 0
let unreachable = 0

  for (const [url, where] of refs) {
    let ok = false
    let status = 0
    let finalUrl = url
    // 失败重试一次：部分站点对突发请求限流
    for (let attempt = 0; attempt < 2 && !ok; attempt++) {
      try {
        const res = await fetch(url, {
          headers: { 'User-Agent': UA, Accept: 'text/html,*/*' },
          redirect: 'follow',
          signal: AbortSignal.timeout(15_000),
        })
        status = res.status
        finalUrl = res.url
        ok = res.status < 400
      } catch {
        ok = false
      }
      if (!ok && attempt === 0) await new Promise((r) => setTimeout(r, 1500))
    }

    if (status === 403 || status === 429) {
      // 反爬拦截：链接大概率存活（浏览器可访问），转人工核验，不算失效
      blocked += 1
      console.warn(`⚠ 反爬拦截（HTTP ${status}），请浏览器人工核验: ${url}\n    引用于: ${where.join(', ')}`)
    } else if (!ok) {
      // 网络错误（DNS 失效或本机网络限制）无法自动判定，转人工核验不算失效
      unreachable += 1
      console.warn(`⚠ ${status ? `HTTP ${status}` : '网络错误'}，请人工核验: ${url}\n    引用于: ${where.join(', ')}`)
    } else if (normalizeUrl(finalUrl) !== normalizeUrl(url)) {
      redirected += 1
      console.warn(`↷ 重定向 → ${finalUrl}\n    ${url}\n    引用于: ${where.join(', ')}`)
    }
  }

  console.log(
    `\n[check-links] 完成：${refs.size - redirected - blocked - unreachable - dead} 直达 · ${redirected} 重定向 · ${blocked + unreachable} 待人工核验 · ${dead} 失效`,
  )
  if (dead > 0) {
    console.error('[check-links] 存在失效链接，请更新或移除后重跑')
    process.exit(1)
  }
} finally {
  rmSync(tmp, { recursive: true, force: true })
}
