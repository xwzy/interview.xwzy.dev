import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router'
import { useBank } from '../context/BankContext'
import { useFavoritesState } from '../context/FavoritesContext'
import { cx, stripMarkdown } from '../lib/utils'
import { difficultyMeta, type IndexedQuestion } from '../types'

/** 输入提交到 URL 的防抖间隔：过滤 656 题全文 + 排序是重操作，不该每个按键跑一次 */
const INPUT_DEBOUNCE_MS = 250

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
        <mark key={key++} className="rounded-sm bg-amber-200 px-0.5 text-slate-900 dark:bg-amber-500/40 dark:text-amber-100">
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

/** 真题改编题的统一标签（数据文件中以 tags: ['真题改编', ...] 标注） */
const EXAM_TAG = '真题改编'

export default function SearchPage() {
  const { questionIndex } = useBank()
  const favorites = useFavoritesState()
  const [searchParams, setSearchParams] = useSearchParams()
  const q = searchParams.get('q') ?? ''
  const favOnly = searchParams.get('fav') === '1'
  const examOnly = searchParams.get('exam') === '1'
  const [input, setInput] = useState(q)
  // 中文输入法组词期间不提交（组词的每个音节都会触发 onChange，直接提交会闪结果）
  const composingRef = useRef(false)
  // 组词结束时 input 值可能没变（onChange 已在组词中触发过），用 tick 强制重排一次提交
  const [composeTick, setComposeTick] = useState(0)

  // URL 上的 q 被外部改变（顶部搜索提交、前进/后退）时同步输入框；
  // 与输入框本身引起的变更互不打断（比较 trim 后的值）
  useEffect(() => {
    setInput((prev) => (prev.trim() === q.trim() ? prev : q))
  }, [q])

  // 输入防抖提交 URL：URL 是唯一真源，过滤与排序只对提交后的 q 执行
  useEffect(() => {
    const timer = setTimeout(() => {
      if (composingRef.current) return
      if (input.trim() === q.trim()) return
      const next: Record<string, string> = {}
      if (input.trim()) next.q = input.trim()
      if (favOnly) next.fav = '1'
      if (examOnly) next.exam = '1'
      setSearchParams(next, { replace: true })
    }, INPUT_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [input, q, favOnly, examOnly, composeTick, setSearchParams])

  const results = useMemo(() => {
    const kw = q.trim().toLowerCase()
    let list = questionIndex
    if (favOnly) list = list.filter((item) => favorites.has(item.question.id))
    if (examOnly) list = list.filter((item) => (item.question.tags ?? []).includes(EXAM_TAG))
    if (kw) {
      list = list.filter((item) => item.haystack.includes(kw))
      list = [...list].sort((a, b) => matchRank(a, kw) - matchRank(b, kw))
    }
    return list
  }, [questionIndex, q, favOnly, examOnly, favorites])

  const toggleFav = () => {
    const next: Record<string, string> = {}
    if (q.trim()) next.q = q.trim()
    if (!favOnly) next.fav = '1'
    if (examOnly) next.exam = '1'
    // 只切换收藏过滤，不回写输入框——保留用户输入到一半的内容
    setSearchParams(next, { replace: true })
  }

  const toggleExam = () => {
    const next: Record<string, string> = {}
    if (q.trim()) next.q = q.trim()
    if (favOnly) next.fav = '1'
    if (!examOnly) next.exam = '1'
    setSearchParams(next, { replace: true })
  }

  const keyword = q.trim()

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <h1 className="text-xl font-bold sm:text-2xl">
        {favOnly ? '★ 我的收藏' : examOnly ? '📜 真题改编' : '搜索题库'}
      </h1>

      <div className="flex flex-wrap items-center gap-2">
        <input
          autoFocus={!favOnly}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onCompositionStart={() => {
            composingRef.current = true
          }}
          onCompositionEnd={() => {
            composingRef.current = false
            setComposeTick((t) => t + 1)
          }}
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
        <button
          type="button"
          onClick={toggleExam}
          aria-pressed={examOnly}
          title="筛选全部标注「真题改编」的题目（源自清华 912、浙大/清华等课程真题）"
          className={cx(
            'rounded-xl border px-4 py-3 text-sm font-medium transition-colors',
            examOnly
              ? 'border-violet-400 bg-violet-400/90 text-white'
              : 'border-slate-200 bg-white text-slate-600 hover:border-violet-300 hover:text-violet-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300',
          )}
        >
          {examOnly ? '📜 真题改编中' : '📜 只看真题'}
        </button>
      </div>

      {keyword === '' && !favOnly && !examOnly ? (
        <p className="text-sm text-slate-400 dark:text-slate-500">
          输入关键词，在全部方向的题目、要点、追问与标签中查找；或点「只看收藏」「只看真题」按类浏览。
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
            <>没有找到与「{keyword}」相关的{favOnly ? '收藏' : examOnly ? '真题' : ''}结果。</>
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
