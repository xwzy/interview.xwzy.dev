// @vitest-environment jsdom
import { cleanup, fireEvent, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import TopicPage from './TopicPage'
import { renderWithProviders } from '../test/testUtils'

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  window.scrollTo = vi.fn()
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('TopicPage 自定义题编辑', () => {
  it('编辑保存时追问要点按问题文本回填，不会保存一次就被清空', async () => {
    // 预置一条带追问要点的自定义题（模拟备份导入——站内表单建不出这种数据）
    localStorage.setItem(
      'interview.custom-questions.v1',
      JSON.stringify([
        {
          id: 'custom-imported-1',
          trackId: 'backend',
          topicId: 'be-general',
          title: '导入的带追问要点题',
          difficulty: 'basic',
          tags: [],
          points: ['要点 p'],
          followUps: [{ question: '追问一？', points: ['要点 A', '要点 B'] }],
          createdAt: '2026-01-01T00:00:00.000Z',
        },
      ]),
    )
    renderWithProviders(<TopicPage />, {
      route: '/tracks/backend/be-general',
      routePattern: '/tracks/:trackId/:topicId',
    })
    // CI 机器较慢：等题库分包加载完成、题卡渲染（整体测试预算同步放大）
    await screen.findByText('导入的带追问要点题', {}, { timeout: 15_000 })

    // 打开编辑表单并原样保存（不改任何字段）
    fireEvent.click(screen.getByTitle('编辑此题'))
    fireEvent.click(screen.getByRole('button', { name: '保存修改' }))

    // 回归（批 20 前修复）：追问要点按 question 文本回填，不被置空
    const stored = JSON.parse(localStorage.getItem('interview.custom-questions.v1') ?? '[]')
    expect(stored).toHaveLength(1)
    expect(stored[0].followUps).toEqual([
      { question: '追问一？', points: ['要点 A', '要点 B'] },
    ])
  }, 20_000)
})
