import { describe, expect, it } from 'vitest'
import { buildSummaryText, generateId, type SessionItem } from './summary'

const items: SessionItem[] = [
  { questionId: 'q1', verdict: 'pass', note: '', duration: 130 },
  { questionId: 'q2', verdict: 'fail', note: '答不出边界场景', duration: 45 },
  { questionId: 'q3', verdict: null, note: '', duration: 3 },
]

const resolve = (id: string) =>
  id === 'q1'
    ? { title: '标题一', trackName: '后端开发', topicName: 'MySQL' }
    : id === 'q2'
      ? { title: '标题二', trackName: '前端开发', topicName: 'React' }
      : undefined

describe('buildSummaryText', () => {
  const { text, counts } = buildSummaryText(items, resolve, {
    candidate: '张三',
    date: new Date('2026-09-25T10:00:00'),
  })

  it('标题行包含候选人与日期', () => {
    expect(text.split('\n')[0]).toBe('面试考察小结 · 张三 · 2026-09-25')
  })

  it('统计行数量正确', () => {
    expect(counts).toEqual({ pass: 1, fail: 1, maybe: 0, unrated: 1 })
    expect(text.split('\n')[1]).toContain('共 3 题：👍 通过 1 · 👎 不通过 1 · ➖ 待定 0 · 未评 1')
  })

  it('每题行包含评分、归属与题干', () => {
    expect(text).toContain('01. 【通过】（后端开发 · MySQL）标题一')
    expect(text).toContain('02. 【不通过】（前端开发 · React）标题二')
  })

  it('达到阈值的用时写入小结，过短的不写', () => {
    expect(text).toContain('（用时 2:10）')
    expect(text).not.toContain('（用时 0:03）')
  })

  it('备注以引用行展示', () => {
    expect(text).toContain('💬 答不出边界场景')
  })

  it('无法解析的题目回退显示题目 id', () => {
    expect(text).toContain('03. 【未评】q3')
  })

  it('无候选人时标题不含姓名段', () => {
    const { text: t2 } = buildSummaryText(items, resolve, { date: new Date('2026-09-25T10:00:00') })
    expect(t2.split('\n')[0]).toBe('面试考察小结 · 2026-09-25')
  })
})

describe('generateId', () => {
  it('生成带分隔符且不重复的 id', () => {
    const a = generateId()
    const b = generateId()
    expect(a).toContain('-')
    expect(a).not.toBe(b)
  })
})
