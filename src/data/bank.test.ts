import { describe, expect, it } from 'vitest'
import { buildBank } from './bank'
import type { CustomQuestion, Track } from '../types'

function makeTrack(id: string, questions: Array<Record<string, unknown>>): Track {
  return {
    id,
    name: id,
    icon: '🧪',
    tagline: '',
    description: '',
    color: 'blue',
    topics: [
      {
        id: `${id}-topic`,
        name: `${id} 领域`,
        questions: questions as never,
      },
    ],
  }
}

const custom: CustomQuestion = {
  id: 'custom-test-1',
  trackId: 'demo',
  topicId: 'demo-topic',
  title: '自定义测试题：MySQL 索引设计',
  difficulty: 'intermediate',
  tags: ['测试'],
  points: ['**要点**：唯一索引兜底'],
  followUps: [{ question: '如果索引失效怎么办？', points: ['检查隐式转换'] }],
  createdAt: '2026-09-25T00:00:00.000Z',
}

describe('buildBank', () => {
  it('空自定义题目时只包含原始数据', () => {
    const raw = [makeTrack('demo', [{ id: 'demo-1', title: '题一', difficulty: 'basic', points: ['p'] }])]
    const bank = buildBank(raw, [])
    expect(bank.tracks).toHaveLength(1)
    expect(bank.totalQuestionCount).toBe(1)
    expect(bank.questionById.size).toBe(bank.totalQuestionCount)
  })

  it('自定义题目合并进对应方向与领域，并进入索引', () => {
    const raw = [makeTrack('demo', [{ id: 'demo-1', title: '题一', difficulty: 'basic', points: ['p'] }])]
    const bank = buildBank(raw, [custom])
    expect(bank.totalQuestionCount).toBe(2)

    const added = bank.questionById.get('custom-test-1')
    expect(added?.track.name).toBe('demo')
    expect(added?.topic.name).toBe('demo 领域')
    expect(added?.question.followUps).toHaveLength(1)
  })

  it('自定义题目进入搜索索引（题干与追问均参与匹配）', () => {
    const raw = [makeTrack('demo', [{ id: 'demo-1', title: '题一', difficulty: 'basic', points: ['p'] }])]
    const bank = buildBank(raw, [custom])
    const indexed = bank.questionById.get('custom-test-1')!
    expect(indexed.haystack).toContain('自定义测试题：mysql 索引设计')
    expect(indexed.haystack).toContain('如果索引失效怎么办')
  })

  it('指向不存在领域的自定义题目被安全忽略', () => {
    const raw = [makeTrack('demo', [{ id: 'demo-1', title: '题一', difficulty: 'basic', points: ['p'] }])]
    const bank = buildBank(raw, [{ ...custom, id: 'custom-test-2', topicId: 'no-such-topic' }])
    expect(bank.questionById.has('custom-test-2')).toBe(false)
    expect(bank.totalQuestionCount).toBe(1)
  })

  it('领域内题目按 基础→进阶→高级 归一化排序，字符串追问被归一化', () => {
    const raw = [
      makeTrack('demo', [
        { id: 'd-adv', title: '高级题', difficulty: 'advanced', points: ['p'], followUps: ['裸字符串追问'] },
        { id: 'd-basic', title: '基础题', difficulty: 'basic', points: ['p'] },
      ]),
    ]
    const bank = buildBank(raw, [])
    const topic = bank.tracks[0]!.topics[0]!
    expect(topic.questions.map((q) => q.id)).toEqual(['d-basic', 'd-adv'])
    expect(topic.questions[1]!.followUps[0]).toEqual({
      question: '裸字符串追问',
      points: [],
    })
  })
})
