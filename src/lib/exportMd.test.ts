import { describe, expect, it } from 'vitest'
import { buildTracksMarkdown } from './exportMd'
import type { NormalizedTrack } from '../types'

const fakeTrack: NormalizedTrack = {
  id: 'demo',
  name: '演示方向',
  icon: '🧪',
  tagline: 'tagline',
  description: '这是一个演示方向',
  color: 'blue',
  topics: [
    {
      id: 'demo-topic',
      name: '演示领域',
      description: '领域描述',
      references: [{ label: '官方文档', url: 'https://example.com' }],
      questions: [
        {
          id: 'demo-1',
          title: '什么是演示题？',
          difficulty: 'basic',
          tags: ['演示'],
          points: ['**要点一**', '要点二'],
          followUps: [{ question: '追问一？', points: ['追问要点'] }],
        },
        {
          id: 'demo-2',
          title: '无追问的题',
          difficulty: 'advanced',
          points: ['要点'],
          followUps: [],
        },
      ],
    },
  ],
}

describe('buildTracksMarkdown', () => {
  const md = buildTracksMarkdown([fakeTrack], new Date('2026-09-25T10:00:00'))

  it('头部包含导出信息与总题数', () => {
    expect(md).toContain('# 面试宝典题库')
    expect(md).toContain('导出时间：2026-09-25')
    expect(md).toContain('共 2 题')
  })

  it('按方向/领域分层，含描述与延伸资料链接', () => {
    expect(md).toContain('## 🧪 演示方向')
    expect(md).toContain('### 演示领域')
    expect(md).toContain('[官方文档](https://example.com)')
  })

  it('题目行带全局连续编号与难度，要点为列表', () => {
    expect(md).toContain('#### 1. [基础] 什么是演示题？')
    expect(md).toContain('#### 2. [高级] 无追问的题')
    expect(md).toContain('- **要点一**')
  })

  it('追问链带序号且子要点缩进', () => {
    expect(md).toContain('1. 追问一？')
    expect(md).toContain('   - 追问要点')
    expect(md).not.toContain('2. 追问')
  })
})
