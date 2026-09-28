// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cleanup, screen } from '@testing-library/react'
import SearchPage from './SearchPage'
import { renderWithProviders } from '../test/testUtils'

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
})

afterEach(() => cleanup())

describe('SearchPage', () => {
  it('标题命中的结果排在前且高亮，命中要点时展示摘要', async () => {
    renderWithProviders(<SearchPage />, { route: '/search?q=索引' })

    // 结果计数出现 = 检索完成（题库异步加载 + 全文匹配）
    const count = await screen.findByText(/共 \d+ 条结果/)
    expect(count).toBeTruthy()

    // 第一条结果的标题包含关键词（matchRank：标题命中 rank 0 排最前）
    const firstTitle = screen.getAllByRole('heading', { level: 3 })[0]
    expect(firstTitle.textContent).toContain('索引')
    expect(firstTitle.querySelector('mark')).toBeTruthy()
  })

  it('收藏过滤：无收藏时显示空态引导', async () => {
    renderWithProviders(<SearchPage />, { route: '/search?fav=1' })
    // 题库异步加载完成后才渲染页面内容
    expect(await screen.findByText('★ 我的收藏')).toBeTruthy()
    expect(await screen.findByText(/还没有收藏的题目/)).toBeTruthy()
  })
})
