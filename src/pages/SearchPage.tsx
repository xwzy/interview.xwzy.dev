import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { useBank } from '../context/BankContext'
import { cx, stripMarkdown } from '../lib/utils'
import { difficultyMeta, type IndexedQuestion } from '../types'

function matchRank(item: IndexedQuestion, kw: string): number {
  if (item.question.title.toLowerCase().includes(kw)) return 0
  if ((item.question.tags ?? []).some((t) => t.toLowerCase().includes(kw))) return 1
  if (item.topic.name.toLowerCase().includes(kw) || item.track.name.toLowerCase().includes(kw))
    return 2
  return 3
}

export default function SearchPage() {
  const { questionIndex } = useBank()
  const [searchParams, setSearchParams] = useSearchParams()
  const q = searchParams.get('q') ?? ''
  const [input, setInput] = useState(q)

  const results = useMemo(() => {
    const kw = q.trim().toLowerCase()
    if (!kw) return []
    return questionIndex
      .filter((item) => item.haystack.includes(kw))
      .sort((a, b) => matchRank(a, kw) - matchRank(b, kw))
  }, [questionIndex, q])

  const updateQuery = (value: string) => {
    setInput(value)
    setSearchParams(value.trim() ? { q: value.trim() } : {}, { replace: true })
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <h1 className="text-xl font-bold sm:text-2xl">搜索题库</h1>
      <input
        autoFocus
        value={input}
        onChange={(e) => updateQuery(e.target.value)}
        placeholder="搜索题目、知识点、标签，如：索引、闭包、TCP…"
        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:focus:border-blue-500/50 dark:focus:ring-blue-500/20"
      />

      {q.trim() === '' ? (
        <p className="text-sm text-slate-400 dark:text-slate-500">
          输入关键词，在全部方向的题目、要点与标签中查找。
        </p>
      ) : results.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-400 dark:border-white/15 dark:text-slate-500">
          没有找到与「{q}」相关的题目。
        </div>
      ) : (
        <>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            共 {results.length} 条结果{results.length > 50 ? '，仅显示前 50 条' : ''}
          </p>
          <ul className="space-y-3">
            {results.slice(0, 50).map((item) => {
              const kw = q.trim().toLowerCase()
              const snippetPoint = item.question.points.find((p) => p.toLowerCase().includes(kw))
              const meta = difficultyMeta[item.question.difficulty]
              return (
                <li key={item.question.id}>
                  <Link
                    to={`/tracks/${item.track.id}/${item.topic.id}#${item.question.id}`}
                    className="block rounded-xl border border-slate-200 bg-white p-4 transition-colors hover:border-blue-300 dark:border-white/10 dark:bg-white/[0.03] dark:hover:border-blue-500/40"
                  >
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
                      <span>
                        {item.track.icon} {item.track.name} · {item.topic.name}
                      </span>
                      <span className={cx('rounded px-1.5 py-0.5 font-medium', meta.className)}>
                        {meta.label}
                      </span>
                    </div>
                    <h3 className="mt-1.5 font-medium leading-relaxed">{item.question.title}</h3>
                    {snippetPoint && (
                      <p className="mt-1 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">
                        {stripMarkdown(snippetPoint).slice(0, 120)}…
                      </p>
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>
        </>
      )}
    </div>
  )
}
