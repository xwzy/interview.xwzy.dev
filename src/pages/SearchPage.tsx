import { useMemo, useState, type ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router'
import { useBank } from '../context/BankContext'
import { useFavorites } from '../context/FavoritesContext'
import { cx, stripMarkdown } from '../lib/utils'
import { difficultyMeta, type IndexedQuestion } from '../types'

function matchRank(item: IndexedQuestion, kw: string): number {
  if (item.question.title.toLowerCase().includes(kw)) return 0
  if ((item.question.tags ?? []).some((t) => t.toLowerCase().includes(kw))) return 1
  if (item.topic.name.toLowerCase().includes(kw) || item.track.name.toLowerCase().includes(kw))
    return 2
  return 3
}

/** 把文本中命中的关键词片段包上 <mark>（大小写不敏感，全部命中处） */
function Highlight({ text, kw }: { text: string; kw: string }) {
  return useMemo(() => {
    if (!kw) return text
    const lower = text.toLowerCase()
    const needle = kw.toLowerCase()
    const parts: Array<string | ReactNode> = []
    let from = 0
    let hit = lower.indexOf(needle, from)
    let key = 0
    while (hit !== -1) {
      if (hit > from) parts.push(text.slice(from, hit))
      parts.push(
        <mark key={key++} className="rounded-sm bg-amber-200 px-0.5 text-inherit dark:bg-amber-500/40">
          {text.slice(hit, hit + needle.length)}
        </mark>,
      )
      from = hit + needle.length
      hit = lower.indexOf(needle, from)
    }
    if (from < text.length) parts.push(text.slice(from))
    return parts
  }, [text, kw])
}

export default function SearchPage() {
  const { questionIndex } = useBank()
  const { favorites } = useFavorites()
  const [searchParams, setSearchParams] = useSearchParams()
  const q = searchParams.get('q') ?? ''
  const favOnly = searchParams.get('fav') === '1'
  const [input, setInput] = useState(q)

  const results = useMemo(() => {
    const kw = q.trim().toLowerCase()
    let list = questionIndex
    if (favOnly) list = list.filter((item) => favorites.has(item.question.id))
    if (kw) {
      list = list.filter((item) => item.haystack.includes(kw))
      list = [...list].sort((a, b) => matchRank(a, kw) - matchRank(b, kw))
    }
    return list
  }, [questionIndex, q, favOnly, favorites])

  const updateQuery = (value: string) => {
    setInput(value)
    const next: Record<string, string> = {}
    if (value.trim()) next.q = value.trim()
    if (favOnly) next.fav = '1'
    setSearchParams(next, { replace: true })
  }

  const toggleFav = () => {
    const next: Record<string, string> = {}
    if (q.trim()) next.q = q.trim()
    if (!favOnly) next.fav = '1'
    setInput(q)
    setSearchParams(next, { replace: true })
  }

  const keyword = q.trim()

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <h1 className="text-xl font-bold sm:text-2xl">{favOnly ? '★ 我的收藏' : '搜索题库'}</h1>

      <div className="flex flex-wrap items-center gap-2">
        <input
          autoFocus={!favOnly}
          value={input}
          onChange={(e) => updateQuery(e.target.value)}
          placeholder="搜索题目、知识点、标签，如：索引、闭包、TCP…"
          className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:focus:border-blue-500/50 dark:focus:ring-blue-500/20"
        />
        <button
          type="button"
          onClick={toggleFav}
          aria-pressed={favOnly}
          className={cx(
            'rounded-xl border px-4 py-3 text-sm font-medium transition-colors',
            favOnly
              ? 'border-amber-400 bg-amber-400/90 text-white'
              : 'border-slate-200 bg-white text-slate-600 hover:border-amber-300 hover:text-amber-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300',
          )}
        >
          {favOnly ? '★ 收藏中' : '☆ 只看收藏'}
        </button>
      </div>

      {keyword === '' && !favOnly ? (
        <p className="text-sm text-slate-400 dark:text-slate-500">
          输入关键词，在全部方向的题目、要点、追问与标签中查找；或点「只看收藏」浏览星标题目。
        </p>
      ) : results.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-400 dark:border-white/15 dark:text-slate-500">
          {favOnly && keyword === '' ? (
            <>
              还没有收藏的题目。在
              <Link to="/" className="mx-1 font-medium text-blue-600 hover:underline dark:text-blue-400">
                题库
              </Link>
              中点「☆ 收藏」即可把重点题加入这里。
            </>
          ) : (
            <>没有找到与「{keyword}」相关的{favOnly ? '收藏' : ''}结果。</>
          )}
        </div>
      ) : (
        <>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            共 {results.length} 条结果{results.length > 50 ? '，仅显示前 50 条' : ''}
          </p>
          <ul className="space-y-3">
            {results.slice(0, 50).map((item) => {
              const kw = keyword.toLowerCase()
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
                    <h3 className="mt-1.5 font-medium leading-relaxed">
                      <Highlight text={item.question.title} kw={keyword} />
                    </h3>
                    {snippetPoint && (
                      <p className="mt-1 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">
                        <Highlight text={stripMarkdown(snippetPoint).slice(0, 120)} kw={keyword} />
                        …
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
