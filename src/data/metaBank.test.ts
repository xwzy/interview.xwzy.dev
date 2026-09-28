import { describe, expect, it } from 'vitest'
import type { CustomQuestion, MetaTrack } from '../types'
import { buildMetaBank } from './metaBank'

const meta: MetaTrack[] = [
  {
    id: 't1',
    name: '方向一',
    icon: '🧪',
    tagline: '',
    description: '',
    color: 'blue',
    topics: [
      {
        id: 'tp1',
        name: '领域一',
        questions: [
          { id: 'q1', difficulty: 'basic' },
          { id: 'q2', difficulty: 'advanced' },
        ],
      },
      { id: 'tp2', name: '领域二', questions: [{ id: 'q3', difficulty: 'intermediate' }] },
    ],
  },
]

function custom(partial: Partial<CustomQuestion>): CustomQuestion {
  return {
    id: 'custom-1',
    trackId: 't1',
    topicId: 'tp1',
    title: '自定义题',
    difficulty: 'intermediate',
    tags: [],
    points: [],
    followUps: [],
    createdAt: '2026-01-01T00:00:00.000Z',
    ...partial,
  }
}

describe('buildMetaBank', () => {
  it('自定义题目合入对应领域，计数与随机入口同步', () => {
    const bank = buildMetaBank(meta, [custom({})])
    expect(bank.totalQuestionCount).toBe(4)
    expect(bank.questionIds).toEqual(['q1', 'q2', 'custom-1', 'q3'])
    expect(bank.totalTopicCount).toBe(2)
    const target = bank.entries.find((e) => e.questionId === 'custom-1')
    expect(target).toEqual({ trackId: 't1', topicId: 'tp1', questionId: 'custom-1' })
  })

  it('指向不存在方向/领域的自定义题目被安全忽略', () => {
    const bank = buildMetaBank(meta, [
      custom({ id: 'c-x', trackId: 'no-track' }),
      custom({ id: 'c-y', topicId: 'no-topic' }),
    ])
    expect(bank.totalQuestionCount).toBe(3)
    expect(bank.questionIds).toEqual(['q1', 'q2', 'q3'])
  })

  it('不改动传入的元数据（可重复构建）', () => {
    buildMetaBank(meta, [custom({}), custom({ id: 'custom-2' })])
    expect(meta[0]!.topics[0]!.questions).toHaveLength(2)
    const again = buildMetaBank(meta, [custom({})])
    expect(again.totalQuestionCount).toBe(4)
  })
})
