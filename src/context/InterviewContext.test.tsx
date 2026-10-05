// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { VerdictProvider, useVerdicts } from './InterviewContext'

function Probe() {
  const { verdicts, toggleVerdict } = useVerdicts()
  return (
    <div>
      <button type="button" onClick={() => toggleVerdict('q1', 'pass')}>
        toggle-q1
      </button>
      <span data-testid="q1">{verdicts['q1'] ?? 'none'}</span>
      <span data-testid="count">{Object.keys(verdicts).length}</span>
      <span data-testid="oldest">{'old-0' in verdicts ? 'kept' : 'dropped'}</span>
    </div>
  )
}

beforeEach(() => {
  localStorage.clear()
})
afterEach(() => {
  cleanup()
})

describe('VerdictProvider', () => {
  it('toggleVerdict：同结论再按一次取消（判断在 updater 内，连按不基于过期快照）', () => {
    render(
      <VerdictProvider>
        <Probe />
      </VerdictProvider>,
    )
    expect(screen.getByTestId('q1').textContent).toBe('none')
    fireEvent.click(screen.getByRole('button'))
    expect(screen.getByTestId('q1').textContent).toBe('pass')
    fireEvent.click(screen.getByRole('button'))
    expect(screen.getByTestId('q1').textContent).toBe('none')
  })

  it('评分表超过上限时淘汰最早条目，不无限膨胀', () => {
    const seeded = Object.fromEntries(
      Array.from({ length: 1000 }, (_, i) => [`old-${i}`, 'fail']),
    )
    localStorage.setItem('interview.verdicts.v1', JSON.stringify(seeded))
    render(
      <VerdictProvider>
        <Probe />
      </VerdictProvider>,
    )
    expect(screen.getByTestId('count').textContent).toBe('1000')
    fireEvent.click(screen.getByRole('button'))
    // 新评分写入，最早的 old-0 被挤出，总数封顶
    expect(screen.getByTestId('q1').textContent).toBe('pass')
    expect(screen.getByTestId('count').textContent).toBe('1000')
    expect(screen.getByTestId('oldest').textContent).toBe('dropped')
  })
})
