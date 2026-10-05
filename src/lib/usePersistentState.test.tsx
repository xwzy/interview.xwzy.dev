// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { usePersistentState } from './usePersistentState'

const KEY = 'test.use-persistent-state'
const parseNum = (raw: string | null) => (raw === null ? 0 : Number(raw))
const stringifyNum = (v: number) => String(v)

function Probe() {
  const [v, setV] = usePersistentState(KEY, parseNum, stringifyNum)
  return (
    <button type="button" onClick={() => setV((p) => p + 1)}>
      value:{v}
    </button>
  )
}

function dispatchStorage(key: string, newValue: string | null) {
  window.dispatchEvent(new StorageEvent('storage', { key, newValue }))
}

beforeEach(() => {
  localStorage.clear()
})
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('usePersistentState', () => {
  it('挂载读取已有值，状态变化时写回', () => {
    localStorage.setItem(KEY, '7')
    render(<Probe />)
    expect(screen.getByRole('button').textContent).toBe('value:7')
    fireEvent.click(screen.getByRole('button'))
    expect(screen.getByRole('button').textContent).toBe('value:8')
    expect(localStorage.getItem(KEY)).toBe('8')
  })

  it('存储不可用时降级为会话内状态', () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota')
    })
    render(<Probe />)
    fireEvent.click(screen.getByRole('button'))
    expect(screen.getByRole('button').textContent).toBe('value:1')
    setItemSpy.mockRestore()
  })

  it('其他标签页的 storage 事件同步到本地（跨 tab 不再互相覆盖）', () => {
    localStorage.setItem(KEY, '7')
    render(<Probe />)
    act(() => dispatchStorage(KEY, '9'))
    expect(screen.getByRole('button').textContent).toBe('value:9')
    expect(localStorage.getItem(KEY)).toBe('9')
  })

  it('事件回声（与本地一致）不触发无谓更新，也不形成跨标签页写循环', () => {
    localStorage.setItem(KEY, '7')
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem')
    render(<Probe />)
    // 挂载写盘一次；此后外部写入与本地一致的值应被忽略
    const writesAfterMount = setItemSpy.mock.calls.length
    act(() => dispatchStorage(KEY, '7'))
    expect(screen.getByRole('button').textContent).toBe('value:7')
    expect(setItemSpy.mock.calls.length).toBe(writesAfterMount)
    setItemSpy.mockRestore()
  })

  it('其他标签页删除键（newValue 为 null）时跟随回到默认值', () => {
    localStorage.setItem(KEY, '7')
    render(<Probe />)
    act(() => dispatchStorage(KEY, null))
    expect(screen.getByRole('button').textContent).toBe('value:0')
  })

  it('其他键的 storage 事件不响应', () => {
    localStorage.setItem(KEY, '7')
    render(<Probe />)
    act(() => dispatchStorage('some.other.key', '99'))
    expect(screen.getByRole('button').textContent).toBe('value:7')
  })
})
