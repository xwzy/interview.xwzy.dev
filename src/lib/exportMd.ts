import type { NormalizedTrack } from '../types'
import { difficultyMeta } from '../types'

/** 把整站题库（含自定义题目）导出为可打印、可导入笔记工具的结构化 Markdown */
export function buildTracksMarkdown(tracks: NormalizedTrack[], exportedAt: Date): string {
  const dateStr = `${exportedAt.getFullYear()}-${String(exportedAt.getMonth() + 1).padStart(2, '0')}-${String(exportedAt.getDate()).padStart(2, '0')}`
  const lines: string[] = []
  let no = 0

  const total = tracks.reduce(
    (n, t) => n + t.topics.reduce((m, tp) => m + tp.questions.length, 0),
    0,
  )
  lines.push('# 面试宝典题库')
  lines.push('')
  lines.push(`> 导出时间：${dateStr} · ${tracks.length} 个方向 · 共 ${total} 题`)

  for (const track of tracks) {
    lines.push('')
    lines.push(`## ${track.icon} ${track.name}`)
    lines.push('')
    lines.push(`> ${track.description}`)

    for (const topic of track.topics) {
      lines.push('')
      lines.push(`### ${topic.name}`)
      if (topic.description) lines.push(`> ${topic.description}`)
      if (topic.references?.length) {
        lines.push(`延伸资料：${topic.references.map((r) => `[${r.label}](${r.url})`).join(' · ')}`)
      }

      for (const q of topic.questions) {
        no += 1
        lines.push('')
        lines.push(`#### ${no}. [${difficultyMeta[q.difficulty].label}] ${q.title}`)
        if (q.tags?.length) lines.push('`' + q.tags.join('` `') + '`')
        lines.push('')
        lines.push('**参考要点**')
        lines.push('')
        q.points.forEach((p) => lines.push(`- ${p}`))
        if (q.followUps.length > 0) {
          lines.push('')
          lines.push('**层层追问**')
          lines.push('')
          q.followUps.forEach((f, i) => {
            lines.push(`${i + 1}. ${f.question}`)
            f.points.forEach((p) => lines.push(`   - ${p}`))
          })
        }
      }
    }
  }

  lines.push('')
  lines.push('---')
  lines.push(`共 ${no} 题 · 由面试宝典导出于 ${dateStr}`)
  return lines.join('\n')
}
