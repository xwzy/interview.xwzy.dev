import { verdictMeta, type Verdict } from '../context/InterviewContext'
import { formatDuration } from './utils'

/** 一次考察中单道题的结论快照（评分 + 面试官备注 + 用时） */
export interface SessionItem {
  questionId: string
  verdict: Verdict | null
  note: string
  /** 该题累计用时（秒），旧记录可能缺失 */
  duration?: number
}

export interface ResolvedItem {
  title: string
  trackName: string
  topicName: string
}

export interface SummaryCounts {
  pass: number
  fail: number
  maybe: number
  unrated: number
}

export function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

/** 把整卷题目快照渲染成可复制的纯文本面试小结 */
export function buildSummaryText(
  items: SessionItem[],
  resolve: (questionId: string) => ResolvedItem | undefined,
  meta: { candidate?: string; date?: Date },
): { text: string; counts: SummaryCounts } {
  const date = meta.date ?? new Date()
  const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  const counts: SummaryCounts = { pass: 0, fail: 0, maybe: 0, unrated: 0 }

  const lines = items.map((item, i) => {
    counts[item.verdict ?? 'unrated'] += 1
    const label = item.verdict ? `【${verdictMeta[item.verdict].label}】` : '【未评】'
    const resolved = resolve(item.questionId)
    const where = resolved ? `（${resolved.trackName} · ${resolved.topicName}）` : ''
    const duration = item.duration && item.duration >= 5 ? `（用时 ${formatDuration(item.duration)}）` : ''
    const row = `${String(i + 1).padStart(2, '0')}. ${label}${where}${resolved?.title ?? item.questionId}${duration}`
    return item.note ? `${row}\n    💬 ${item.note}` : row
  })

  const titleLine = meta.candidate ? `面试考察小结 · ${meta.candidate} · ${dateStr}` : `面试考察小结 · ${dateStr}`
  const text = [
    titleLine,
    `共 ${items.length} 题：👍 通过 ${counts.pass} · 👎 不通过 ${counts.fail} · ➖ 待定 ${counts.maybe} · 未评 ${counts.unrated}`,
    '',
    ...lines,
  ].join('\n')
  return { text, counts }
}
