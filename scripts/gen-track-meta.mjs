#!/usr/bin/env node
/**
 * 生成 src/data/trackMeta.generated.ts（首屏元数据）：
 * 用 esbuild 把 src/data/trackLoaders.ts 打成临时 CJS 包并执行，取出 15 个方向的
 * 题目 id + 难度（不含要点/追问内容，约为主包 +10KB gzip），内联进主包，
 * 让首页/方向页不等任何内容分包即可渲染。题目内容仍按方向分包后台加载。
 *
 * 由 `npm run build` 自动执行；也可以手动 `npm run gen:meta`。
 * 数据文件变更后忘记重新生成时，src/data/trackMeta.test.ts 会让 CI 失败。
 */
import { build } from 'esbuild'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'

const root = resolve(import.meta.dirname, '..')

// 题库数据是纯 TS 对象（无浏览器 API），打成临时 CJS 供 Node 直接执行
const tmp = mkdtempSync(join(tmpdir(), 'track-meta-'))
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
  if (!Array.isArray(tracks) || tracks.length === 0) {
    // loader 静默返回空（如数据文件 bug 导致 import 全部失败）时必须在此拦截，
    // 否则生成空 trackMeta 且构建"成功"，首页直接空白
    throw new Error('loadAllTracks() 返回空——请检查 src/data/ 下的数据文件')
  }

  const meta = tracks.map((t) => ({
    id: t.id,
    name: t.name,
    icon: t.icon,
    tagline: t.tagline,
    description: t.description,
    color: t.color,
    topics: t.topics.map((tp) => ({
      id: tp.id,
      name: tp.name,
      description: tp.description,
      questions: tp.questions.map((q) => ({ id: q.id, difficulty: q.difficulty })),
    })),
  }))

  const out = `// 由 scripts/gen-track-meta.mjs 自动生成，请勿手改。
// 数据文件（src/data/*.ts）变更后运行 \`npm run gen:meta\` 重新生成；
// 与真实题库不一致时 src/data/trackMeta.test.ts 会失败。
import type { MetaTrack } from '../types'

export const trackMeta: MetaTrack[] = ${JSON.stringify(meta)}
`
  const outFile = join(root, 'src/data/trackMeta.generated.ts')
  writeFileSync(outFile, out)
  const questions = meta.reduce((n, t) => n + t.topics.reduce((m, tp) => m + tp.questions.length, 0), 0)
  console.log(`[gen-track-meta] 已生成 ${outFile}（${meta.length} 个方向 · ${questions} 题元数据）`)
} finally {
  rmSync(tmp, { recursive: true, force: true })
}
