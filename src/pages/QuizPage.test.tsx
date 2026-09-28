// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import QuizPage from './QuizPage'
import { backendTrack } from '../data/backend'
import { renderWithProviders } from '../test/testUtils'

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  window.scrollTo = vi.fn()
})

afterEach(() => {
  cleanup()
  vi.useRealTimers()
  vi.restoreAllMocks()
})

/** 打开组卷页并等题库就绪（真实定时器下等待，之后各测试再按需切假定时器） */
async function openQuiz() {
  const view = renderWithProviders(<QuizPage />, { route: '/quiz' })
  // CI 机器较慢：题库 15 个分包在 jsdom 下的加载可能远超默认 1s 等待
  const startBtn = await screen.findByRole('button', { name: /开始出题/ }, { timeout: 15_000 })
  return { view, startBtn }
}

/** 连点"下一题"直到最后一题，返回"完成考察"按钮 */
function advanceToLastQuestion() {
  let finishBtn = screen.queryByRole('button', { name: /完成考察/ })
  while (!finishBtn) {
    fireEvent.click(screen.getByRole('button', { name: '下一题 →' }))
    finishBtn = screen.queryByRole('button', { name: /完成考察/ })
  }
  return finishBtn
}

describe('QuizPage 计时器', () => {
  it('第一题从 0:00 起跳（组卷页停留时间不计入），同题递增，切题归零', async () => {
    const { startBtn } = await openQuiz()
    // vitest 4 假定时器默认不伪造 Date，需显式包含，ElapsedTimer 才能随时钟推进
    vi.useFakeTimers({ now: Date.now(), toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Date'] })
    fireEvent.click(startBtn)
    expect(screen.getByTitle('本题用时').textContent).toBe('⏱ 0:00')

    // 同一题内秒表递增（act 包裹让 interval 触发的状态更新立即刷新渲染）
    act(() => vi.advanceTimersByTime(65_000))
    expect(screen.getByTitle('本题用时').textContent).toBe('⏱ 1:05')

    // 切到第二题：计时归零（回归：旧实现会带着上一题的 1:05 起跳）
    fireEvent.click(screen.getByRole('button', { name: '下一题 →' }))
    expect(screen.getByTitle('本题用时').textContent).toBe('⏱ 0:00')
  })
})

describe('QuizPage 现场快照', () => {
  it('刷新恢复后从 0:00 继续计时，已答题目用时计入最终存档', async () => {
    const { view, startBtn } = await openQuiz()
    vi.useFakeTimers({ now: Date.now(), toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Date'] })
    fireEvent.click(startBtn)

    // 第一题停留 12 秒后切到第二题（此刻 q1 的用时已提交并写入快照）
    act(() => vi.advanceTimersByTime(12_000))
    fireEvent.click(screen.getByRole('button', { name: '下一题 →' }))
    vi.useRealTimers()
    view.unmount()

    // 模拟刷新：重新挂载后应出现"恢复考察"入口
    renderWithProviders(<QuizPage />, { route: '/quiz' })
    const resumeBtn = await screen.findByRole('button', { name: /恢复考察/ }, { timeout: 15_000 })
    fireEvent.click(resumeBtn)
    expect(screen.getByTitle('本题用时').textContent).toBe('⏱ 0:00')

    // 连点到最后一只题后完成考察：存档中第一题应带 12s 用时（恢复快照后不丢失）
    fireEvent.click(advanceToLastQuestion())
    await waitFor(() => expect(screen.getByText(/本次考察完成/)).toBeTruthy())
    const sessions = JSON.parse(localStorage.getItem('interview.sessions.v1') ?? '[]')
    expect(sessions).toHaveLength(1)
    expect(sessions[0].items[0].duration).toBe(12)
  })
})

describe('QuizPage 评分与存档', () => {
  it('快捷键评分，完成考察后展示通过数并自动存档', async () => {
    const { startBtn } = await openQuiz()
    fireEvent.click(startBtn)
    fireEvent.keyDown(window, { key: '1' })

    fireEvent.click(advanceToLastQuestion())
    expect(screen.getByText(/本次考察完成/)).toBeTruthy()
    expect(screen.getByText('👍 通过 1')).toBeTruthy()

    const sessions = JSON.parse(localStorage.getItem('interview.sessions.v1') ?? '[]')
    expect(sessions).toHaveLength(1)
    expect(sessions[0].items[0].verdict).toBe('pass')
  })

  it('开新卷时清掉同题的上一场评分，不带入新候选人的小结', async () => {
    // 渲染前预置：上一场（候选人 A）把默认领域（be-general）全部题目评了 pass
    const generalIds =
      backendTrack.topics.find((t) => t.id === 'be-general')?.questions.map((q) => q.id) ?? []
    expect(generalIds.length).toBeGreaterThan(0)
    const seeded = Object.fromEntries(generalIds.map((id) => [id, 'pass']))
    localStorage.setItem('interview.verdicts.v1', JSON.stringify(seeded))

    const { startBtn } = await openQuiz()
    fireEvent.click(startBtn)

    // 本场（候选人 B）全程不评分：小结应全部未评，而不是继承 A 的"通过"
    fireEvent.click(advanceToLastQuestion())
    await waitFor(() => expect(screen.getByText(/本次考察完成/)).toBeTruthy())
    expect(screen.getByText('👍 通过 0')).toBeTruthy()
    const sessions = JSON.parse(localStorage.getItem('interview.sessions.v1') ?? '[]')
    expect(sessions).toHaveLength(1)
    for (const item of sessions[0].items) {
      expect(item.verdict).toBeNull()
    }
    // 全局评分表里本卷的题目已被清掉（只剩不在本卷的残留）
    const left = JSON.parse(localStorage.getItem('interview.verdicts.v1') ?? '{}')
    expect(Object.keys(left).length).toBeLessThan(generalIds.length)
  })
})

describe('QuizPage 快捷键', () => {
  it('焦点在按钮上时空格激活按钮（切题），不被"展示要点"快捷键吞掉', async () => {
    const { startBtn } = await openQuiz()
    fireEvent.click(startBtn)

    const nextBtn = screen.getByRole('button', { name: '下一题 →' })
    nextBtn.focus()
    await userEvent.keyboard(' ')

    await waitFor(() => expect(screen.getByText(/第 2 \/ \d+ 题/)).toBeTruthy())
  })
})
