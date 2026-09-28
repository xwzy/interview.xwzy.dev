import { useMemo, useState } from 'react'
import type { FollowUp, NormalizedQuestion } from '../types'
import Markdown from './Markdown'

/**
 * 把多条要点合成一份 markdown 一次性解析（原来每条要点各跑一遍解析管线）。
 * 首行挂列表标记，其余行统一缩进两格：要点内的多行内容与 ``` 代码围栏仍归属同一条目，
 * 渲染结果与逐条 <li> 包裹等价。前提：要点本身不以列表标记开头（content.test 保证风格）。
 */
function toListMarkdown(points: string[]): string {
  return points
    .map((p) =>
      p
        .split('\n')
        .map((line, i) => (i === 0 ? `- ${line}` : `  ${line}`))
        .join('\n'),
    )
    .join('\n')
}

/** 追问链中的一步：问题始终可见，参考要点按需展开 */
function FollowUpStep({ index, followUp }: { index: number; followUp: FollowUp }) {
  const [open, setOpen] = useState(false)
  const pointsMd = useMemo(() => toListMarkdown(followUp.points), [followUp.points])
  return (
    <div className="rounded-lg bg-amber-50 p-3 text-sm dark:bg-amber-500/10">
      <div className="flex items-start gap-2">
        <span className="shrink-0 rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-300">
          追问 {index + 1}
        </span>
        <p className="flex-1 leading-relaxed text-amber-900 dark:text-amber-100">
          {followUp.question}
        </p>
        {followUp.points.length > 0 && (
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="shrink-0 text-xs font-medium text-amber-700 underline-offset-2 hover:underline dark:text-amber-300"
            aria-expanded={open}
          >
            {open ? '收起要点' : '查看要点'}
          </button>
        )}
      </div>
      {open && followUp.points.length > 0 && (
        <div className="mt-2 border-t border-amber-200/70 pt-2 dark:border-amber-500/20">
          <div className="md-body">
            <Markdown>{pointsMd}</Markdown>
          </div>
        </div>
      )}
    </div>
  )
}

/** 用追问问题文本做 key（重复出现时加序号消歧）：编辑自定义题的追问后，
 *  展开状态跟着内容走而不是跟着数组下标错位 */
function followUpKeys(followUps: FollowUp[]): string[] {
  const seen = new Map<string, number>()
  return followUps.map((f) => {
    const nth = seen.get(f.question) ?? 0
    seen.set(f.question, nth + 1)
    return nth === 0 ? f.question : `${f.question}#${nth + 1}`
  })
}

/** 题目的参考要点 + 层层追问链。外层负责何时显示，内部管理追问展开状态 */
export default function AnswerBody({ question }: { question: NormalizedQuestion }) {
  const pointsMd = useMemo(() => toListMarkdown(question.points), [question.points])
  const keys = useMemo(() => followUpKeys(question.followUps), [question.followUps])
  return (
    <div>
      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
        参考要点
      </p>
      <div className="md-body">
        <Markdown>{pointsMd}</Markdown>
      </div>

      {question.followUps.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-amber-600/80 dark:text-amber-400/80">
            层层追问
          </p>
          <div className="space-y-2">
            {question.followUps.map((f, i) => (
              <FollowUpStep key={keys[i]} index={i} followUp={f} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
