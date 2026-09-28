import { describe, expect, it } from 'vitest'
import { parseResume } from './quizResume'

const valid = JSON.stringify({
  candidate: '张三',
  queueIds: ['q1', 'q2', 'q3'],
  current: 1,
  notes: { q1: '备注' },
  durations: { q1: 42 },
  savedAt: '2026-09-26T00:00:00.000Z',
})

describe('parseResume', () => {
  it('解析合法快照', () => {
    const r = parseResume(valid)
    expect(r).not.toBeNull()
    expect(r!.candidate).toBe('张三')
    expect(r!.queueIds).toEqual(['q1', 'q2', 'q3'])
    expect(r!.current).toBe(1)
    expect(r!.notes).toEqual({ q1: '备注' })
    expect(r!.durations).toEqual({ q1: 42 })
  })

  it('畸形 JSON 返回 null', () => {
    expect(parseResume('{broken')).toBeNull()
  })

  it('非对象或缺少队列时返回 null', () => {
    expect(parseResume('null')).toBeNull()
    expect(parseResume('{}')).toBeNull()
    expect(parseResume(JSON.stringify({ queueIds: [] }))).toBeNull()
  })

  it('剔除非字符串的队列 id', () => {
    const r = parseResume(JSON.stringify({ queueIds: ['a', 3, null], current: 0 }))
    expect(r!.queueIds).toEqual(['a'])
  })

  it('current 越界时收敛到合法范围', () => {
    const r1 = parseResume(JSON.stringify({ queueIds: ['a'], current: 99 }))
    expect(r1!.current).toBe(0)
    const r2 = parseResume(JSON.stringify({ queueIds: ['a', 'b'], current: -5 }))
    expect(r2!.current).toBe(0)
  })

  it('畸形备注条目被剔除', () => {
    const r = parseResume(
      JSON.stringify({ queueIds: ['a'], current: 0, notes: { good: 'ok', bad: 42 } }),
    )
    expect(r!.notes).toEqual({ good: 'ok' })
  })

  it('非法用时条目被剔除（旧版快照缺 durations 时回退空表）', () => {
    const r1 = parseResume(
      JSON.stringify({
        queueIds: ['a', 'b'],
        current: 0,
        durations: { a: 10, b: -3, c: 'x', d: Infinity },
      }),
    )
    expect(r1!.durations).toEqual({ a: 10 })
    const r2 = parseResume(JSON.stringify({ queueIds: ['a'], current: 0 }))
    expect(r2!.durations).toEqual({})
  })

  it('缺省字段有安全默认值', () => {
    const r = parseResume(JSON.stringify({ queueIds: ['a'], current: 0 }))
    expect(r!.candidate).toBe('')
    expect(r!.notes).toEqual({})
  })
})
