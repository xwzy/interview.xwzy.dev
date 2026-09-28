// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import type { NormalizedQuestion } from '../types'
import AnswerBody from './AnswerBody'

/** 覆盖行内标记、多行要点、代码围栏等数据中真实出现的形态 */
const question: NormalizedQuestion = {
  id: 't-1',
  title: '测试题',
  difficulty: 'basic',
  points: [
    '**加粗**要点',
    '多行要点第一行\n第二行仍在同一条目',
    '带行内代码：`const x = 1`',
    '```js\nconsole.log(1)\n```',
  ],
  followUps: [
    { question: '追问一', points: ['追问要点 A', '追问要点 B'] },
    { question: '追问二', points: [] },
  ],
}

describe('AnswerBody', () => {
  it('要点合并为单次 markdown 解析，每条要点仍渲染为独立列表项', () => {
    const { container } = render(<AnswerBody question={question} />)
    const lis = container.querySelectorAll('.md-body > ul > li')
    expect(lis).toHaveLength(4)
    expect(lis[0].querySelector('strong')?.textContent).toBe('加粗')
    expect(lis[1].textContent).toContain('第二行仍在同一条目')
    expect(lis[2].querySelector('code')?.textContent).toBe('const x = 1')
    expect(lis[3].querySelector('pre code')?.textContent).toContain('console.log(1)')
  })

  it('无要点追问不显示要点按钮，有要点追问按需展开', () => {
    render(<AnswerBody question={question} />)
    expect(screen.getAllByText('追问一').length).toBeGreaterThan(0)
    expect(screen.queryByText('追问要点 A')).toBeNull()
    fireEvent.click(screen.getAllByText('查看要点')[0])
    expect(screen.getByText('追问要点 A')).toBeTruthy()
    expect(screen.getByText('追问要点 B')).toBeTruthy()
  })
})
