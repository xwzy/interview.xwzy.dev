// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, screen } from '@testing-library/react'
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

    const masteryBtn = await screen.findByRole('button', { name: '清空（2）' })
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
})
