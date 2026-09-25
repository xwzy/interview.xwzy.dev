import { describe, expect, it } from 'vitest'
import { countMastered, cx, formatDuration, shuffle, stripMarkdown, trackThemes } from './utils'
import type { Question } from '../types'

describe('cx', () => {
  it('拼接非空类名并跳过假值', () => {
    expect(cx('a', 'b')).toBe('a b')
    const cond = false as boolean
    expect(cx('a', cond && 'b', null, undefined, 'c')).toBe('a c')
    expect(cx()).toBe('')
  })
})

describe('shuffle', () => {
  it('不改变元素集合与数量', () => {
    const input = [1, 2, 3, 4, 5]
    const output = shuffle(input)
    expect(output).toHaveLength(input.length)
    expect([...output].sort()).toEqual([...input].sort())
  })

  it('不修改原数组', () => {
    const input = [1, 2, 3]
    shuffle(input)
    expect(input).toEqual([1, 2, 3])
  })
})

describe('countMastered', () => {
  it('统计已掌握题数', () => {
    const questions = [
      { id: 'a' },
      { id: 'b' },
      { id: 'c' },
    ] as unknown as Question[]
    expect(countMastered(questions, new Set(['a', 'c']))).toBe(2)
    expect(countMastered(questions, new Set())).toBe(0)
  })
})

describe('formatDuration', () => {
  it('格式化 mm:ss', () => {
    expect(formatDuration(0)).toBe('0:00')
    expect(formatDuration(65)).toBe('1:05')
    expect(formatDuration(600)).toBe('10:00')
  })
})

describe('stripMarkdown', () => {
  it('去掉 markdown 记号并压缩空白', () => {
    expect(stripMarkdown('**加粗** 和 `代码`')).toBe('加粗 和 代码')
    expect(stripMarkdown('多行\n\n文本')).toBe('多行 文本')
  })
})

describe('trackThemes', () => {
  it('每种 TrackColor 都有配套样式', () => {
    const colors = ['blue', 'emerald', 'violet', 'amber', 'rose', 'cyan', 'orange', 'slate', 'indigo', 'pink']
    for (const color of colors) {
      expect(trackThemes[color as keyof typeof trackThemes].bar).toBeTruthy()
    }
    expect(Object.keys(trackThemes)).toHaveLength(colors.length)
  })
})
