// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react'
import SettingsPage from './SettingsPage'
import { renderWithProviders } from '../test/testUtils'

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  // 预置本地数据：2 条掌握记录、3 条收藏
  localStorage.setItem('interview.mastery.v1', JSON.stringify(['q-a', 'q-b']))
  localStorage.setItem('interview.favorites.v1', JSON.stringify(['q-1', 'q-2', 'q-3']))
  window.scrollTo = vi.fn()
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('SettingsPage', () => {
  it('双击确认后一次性清空对应类别的本地数据', async () => {
    renderWithProviders(<SettingsPage />, { route: '/settings' })

    const masteryBtn = await screen.findByRole('button', { name: '清空（2）' }, { timeout: 15_000 })
    screen.getByRole('button', { name: '清空（3）' }) // 收藏数正确显示

    // 第一次点击进入确认态，不删数据
    fireEvent.click(masteryBtn)
    expect(screen.getByRole('button', { name: '再次点击确认清空' })).toBeTruthy()
    expect(localStorage.getItem('interview.mastery.v1')).toBe('["q-a","q-b"]')

    // 第二次点击真正清空（页面存在多个"清空（0）"按钮，断言最初拿到的那一个节点）
    fireEvent.click(screen.getByRole('button', { name: '再次点击确认清空' }))
    expect(masteryBtn.textContent).toBe('清空（0）')
    expect(masteryBtn.hasAttribute('disabled')).toBe(true)
    expect(localStorage.getItem('interview.mastery.v1')).toBe('[]')
    // 其它类别不受影响
    expect(localStorage.getItem('interview.favorites.v1')).toBe('["q-1","q-2","q-3"]')
  })

  /** 触发隐藏 file input 的 onChange（绕过点击弹窗） */
  function submitImportFile(view: ReturnType<typeof renderWithProviders>, file: File) {
    const input = view.container.querySelector<HTMLInputElement>('input[type="file"]')!
    fireEvent.change(input, { target: { files: [file] } })
  }

  const validBackup = {
    version: 1,
    exportedAt: '2026-09-28T00:00:00.000Z',
    mastery: ['x-1', 'x-2'],
    verdicts: { 'x-1': 'pass' },
    sessions: [
      {
        id: 's1',
        candidate: '张三',
        createdAt: '2026-09-28T00:00:00.000Z',
        items: [{ questionId: 'x-1', verdict: 'pass', note: '', duration: 42 }],
      },
    ],
    customQuestions: [],
    favorites: ['x-9'],
  }

  it('导入非 JSON 文件：报格式错误且不动本地数据', async () => {
    const view = renderWithProviders(<SettingsPage />, { route: '/settings' })
    await screen.findByRole('button', { name: '清空（2）' }, { timeout: 15_000 })

    submitImportFile(view, new File(['这不是 json {{{'], 'bad.json'))
    expect(await screen.findByText(/导入失败：文件不是有效的 JSON/)).toBeTruthy()
    expect(localStorage.getItem('interview.mastery.v1')).toBe('["q-a","q-b"]')
    expect(localStorage.getItem('interview.favorites.v1')).toBe('["q-1","q-2","q-3"]')
  })

  it('导入时存储配额不足：回滚已写入的键并如实提示', async () => {
    const view = renderWithProviders(<SettingsPage />, { route: '/settings' })
    await screen.findByRole('button', { name: '清空（2）' }, { timeout: 15_000 })

    const originalSet = localStorage.setItem.bind(localStorage)
    const spy = vi.spyOn(Storage.prototype, 'setItem')
    spy.mockImplementation((key: string, value: string) => {
      // 第 3 个写入键（sessions）抛配额满：前 2 个键已被写入，考验回滚
      if (key === 'interview.sessions.v1') {
        throw new DOMException('quota exceeded', 'QuotaExceededError')
      }
      originalSet(key, value)
    })

    submitImportFile(view, new File([JSON.stringify(validBackup)], 'backup.json'))
    expect(await screen.findByText(/存储空间不足/)).toBeTruthy()
    spy.mockRestore()

    // 回滚完成：本地数据恢复为导入前的状态，没有半新半旧
    expect(localStorage.getItem('interview.mastery.v1')).toBe('["q-a","q-b"]')
    expect(localStorage.getItem('interview.favorites.v1')).toBe('["q-1","q-2","q-3"]')
    expect(localStorage.getItem('interview.sessions.v1') ?? '[]').toBe('[]')
  })

  it('合法备份导入成功：写入各键并提示即将刷新', async () => {
    const reload = vi.fn()
    Object.defineProperty(window, 'location', {
      value: { ...window.location, reload },
      writable: true,
    })
    const view = renderWithProviders(<SettingsPage />, { route: '/settings' })
    await screen.findByRole('button', { name: '清空（2）' }, { timeout: 15_000 })

    submitImportFile(view, new File([JSON.stringify(validBackup)], 'backup.json'))
    expect(await screen.findByText(/导入成功：2 条掌握记录 · 1 份考察记录/)).toBeTruthy()

    expect(localStorage.getItem('interview.mastery.v1')).toBe('["x-1","x-2"]')
    expect(localStorage.getItem('interview.favorites.v1')).toBe('["x-9"]')
    const sessions = JSON.parse(localStorage.getItem('interview.sessions.v1') ?? '[]')
    expect(sessions).toHaveLength(1)
    // 用时在导入往返中保留
    expect(sessions[0].items[0].duration).toBe(42)
    // 1.2s 后自动刷新让各 Context 重新加载
    await waitFor(() => expect(reload).toHaveBeenCalled(), { timeout: 3000 })
  })
})
