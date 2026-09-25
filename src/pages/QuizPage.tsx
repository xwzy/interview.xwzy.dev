import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router'
import { useBank } from '../context/BankContext'
import { useFavorites } from '../context/FavoritesContext'
import { copyText } from '../lib/clipboard'
import { cx, formatDuration, shuffle, trackThemes } from '../lib/utils'
import { buildSummaryText, generateId, type SessionItem, type SummaryCounts } from '../lib/summary'
import { difficultyMeta, type Difficulty, type IndexedQuestion } from '../types'
import { useVerdicts, verdictMeta, type Verdict } from '../context/InterviewContext'
import { useSessions } from '../context/SessionContext'
import ProgressBar from '../components/ProgressBar'
import AnswerBody from '../components/AnswerBody'
import Segmented from '../components/Segmented'

type Phase = 'setup' | 'running' | 'done'
type DiffFilter = 'all' | Difficulty

/** 本题用时显示：秒级自跳的独立组件，把每秒重渲染限制在计时文本本身 */
function ElapsedTimer({ startTs }: { startTs: number }) {
  const [, setTick] = useState(0)
  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 1000)
    return () => clearInterval(timer)
  }, [])
  const elapsed = Math.max(0, Math.floor((Date.now() - startTs) / 1000))
  return (
    <span title="本题用时">⏱ {formatDuration(elapsed)}</span>
  )
}

const COUNT_OPTIONS = [5, 10, 15, 20, 30]

const VERDICT_ORDER = ['pass', 'fail', 'maybe'] as const

/** 进行中考察的现场快照（sessionStorage，防误刷新丢失） */
interface ResumeState {
  candidate: string
  queueIds: string[]
  current: number
  notes: Record<string, string>
  savedAt: string
}

const RESUME_KEY = 'interview.quiz-resume.v1'

function loadResume(): ResumeState | null {
  try {
    const raw = sessionStorage.getItem(RESUME_KEY)
    if (!raw) return null
    const data = JSON.parse(raw) as Partial<ResumeState>
    if (!Array.isArray(data.queueIds) || data.queueIds.length === 0 || typeof data.current !== 'number') {
      return null
    }
    return {
      candidate: typeof data.candidate === 'string' ? data.candidate : '',
      queueIds: data.queueIds.filter((id): id is string => typeof id === 'string'),
      current: Math.max(0, data.current),
      notes: data.notes && typeof data.notes === 'object' ? data.notes : {},
      savedAt: typeof data.savedAt === 'string' ? data.savedAt : new Date().toISOString(),
    }
  } catch {
    return null
  }
}

function clearResume() {
  try {
    sessionStorage.removeItem(RESUME_KEY)
  } catch {
    // 忽略存储不可用
  }
}

const DIFFICULTY_RANK: Record<Difficulty, number> = { basic: 0, intermediate: 1, advanced: 2 }

/** 面试官模式：选方向 → 随机组卷 → 现场逐题考察、评分、记录 → 自动存档并生成面试小结 */
export default function QuizPage() {
  const [phase, setPhase] = useState<Phase>('setup')
  const [selectedTopics, setSelectedTopics] = useState<Set<string>>(() => new Set(['be-mysql']))
  const [diff, setDiff] = useState<DiffFilter>('all')
  const [count, setCount] = useState(10)

  const [candidate, setCandidate] = useState('')
  const [ordered, setOrdered] = useState(false)
  const [onlyFavorites, setOnlyFavorites] = useState(false)
  const [queue, setQueue] = useState<IndexedQuestion[]>([])
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [current, setCurrent] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [summary, setSummary] = useState<{ text: string; counts: SummaryCounts } | null>(null)
  const [copied, setCopied] = useState(false)
  const [saved, setSaved] = useState(false)
  const [confirmExit, setConfirmExit] = useState(false)
  const [resumable, setResumable] = useState<ResumeState | null>(null)
  const startRef = useRef(Date.now())
  const durationsRef = useRef<Record<string, number>>({})
  const { getVerdict, setVerdict } = useVerdicts()
  const { saveSession } = useSessions()
  const { favorites } = useFavorites()
  const { tracks, questionIndex, questionById } = useBank()

  const pool = useMemo(
    () =>
      questionIndex.filter(
        (r) =>
          selectedTopics.has(r.topic.id) &&
          (diff === 'all' || r.question.difficulty === diff) &&
          (!onlyFavorites || favorites.has(r.question.id)),
      ),
    [questionIndex, selectedTopics, diff, onlyFavorites, favorites],
  )

  const toggleTopic = (topicId: string) => {
    setSelectedTopics((prev) => {
      const next = new Set(prev)
      if (next.has(topicId)) next.delete(topicId)
      else next.add(topicId)
      return next
    })
  }

  const start = () => {
    if (pool.length === 0) return
    const picked = shuffle(pool).slice(0, count)
    // 由易到难：同难度内保持随机顺序
    const queueNext = ordered
      ? [...picked].sort((a, b) => DIFFICULTY_RANK[a.question.difficulty] - DIFFICULTY_RANK[b.question.difficulty])
      : picked
    setQueue(queueNext)
    setNotes({})
    durationsRef.current = {}
    setCurrent(0)
    setRevealed(false)
    setSummary(null)
    setCopied(false)
    setSaved(false)
    clearResume()
    setResumable(null)
    setPhase('running')
    window.scrollTo(0, 0)
  }

  /** 从现场快照恢复进行中的考察（题目可能已被删除的自动跳过） */
  const resumeQuiz = () => {
    if (!resumable) return
    const restored = resumable.queueIds
      .map((id) => questionById.get(id))
      .filter((item): item is NonNullable<ReturnType<typeof questionById.get>> => Boolean(item))
    if (restored.length === 0) {
      clearResume()
      setResumable(null)
      return
    }
    setCandidate(resumable.candidate)
    setNotes(resumable.notes)
    setQueue(restored)
    setCurrent(Math.min(resumable.current, restored.length - 1))
    setRevealed(false)
    setSummary(null)
    setCopied(false)
    setSaved(false)
    setPhase('running')
    window.scrollTo(0, 0)
  }

  const discardResume = () => {
    clearResume()
    setResumable(null)
  }

  /** 把当前题的停留时长累计进用时表（切题/结束时调用） */
  const commitTime = (questionId: string) => {
    const secs = Math.floor((Date.now() - startRef.current) / 1000)
    if (secs > 0) {
      durationsRef.current[questionId] = (durationsRef.current[questionId] ?? 0) + secs
    }
  }

  const finish = () => {
    const currentItem = queue[current]
    if (currentItem) commitTime(currentItem.question.id)
    const items: SessionItem[] = queue.map((item) => ({
      questionId: item.question.id,
      verdict: getVerdict(item.question.id) ?? null,
      note: (notes[item.question.id] ?? '').trim(),
      duration: durationsRef.current[item.question.id],
    }))
    const resolved = buildSummaryText(items, (id) => {
      const r = questionById.get(id)
      return r ? { title: r.question.title, trackName: r.track.name, topicName: r.topic.name } : undefined
    }, { candidate: candidate.trim(), date: new Date() })
    setSummary(resolved)
    saveSession({
      id: generateId(),
      candidate: candidate.trim(),
      createdAt: new Date().toISOString(),
      items,
    })
    setSaved(true)
    clearResume()
    setPhase('done')
    window.scrollTo(0, 0)
  }

  const goPrev = () => {
    const item = queue[current]
    if (item) commitTime(item.question.id)
    setCurrent((c) => Math.max(0, c - 1))
    setRevealed(false)
  }

  const goNext = () => {
    const item = queue[current]
    if (item) commitTime(item.question.id)
    if (current + 1 >= queue.length) {
      finish()
    } else {
      setCurrent((c) => c + 1)
      setRevealed(false)
    }
  }

  const rate = (verdict: Verdict) => {
    const item = queue[current]
    if (!item) return
    setVerdict(item.question.id, getVerdict(item.question.id) === verdict ? null : verdict)
  }

  const currentNote = queue[current] ? (notes[queue[current]!.question.id] ?? '') : ''
  const updateNote = (value: string) => {
    const item = queue[current]
    if (!item) return
    setNotes((prev) => ({ ...prev, [item.question.id]: value }))
  }

  // 计时起点：切题/开卷时同步重置（ElapsedTimer 组件负责秒级展示）
  useEffect(() => {
    if (phase !== 'running') return
    startRef.current = Date.now()
  }, [phase, current])

  // 回到组卷页时读取现场快照（供“恢复上次考察”）；进行中每次状态变化自动续存
  useEffect(() => {
    if (phase === 'setup') setResumable(loadResume())
  }, [phase])

  useEffect(() => {
    if (phase !== 'running' || queue.length === 0) return
    try {
      const data: ResumeState = {
        candidate,
        queueIds: queue.map((item) => item.question.id),
        current,
        notes,
        savedAt: new Date().toISOString(),
      }
      sessionStorage.setItem(RESUME_KEY, JSON.stringify(data))
    } catch {
      // 存储不可用时静默跳过
    }
  }, [phase, candidate, queue, current, notes])

  // 考察进行中离开页面（刷新/关闭）前给出挽留提示，避免评分与备注丢失
  useEffect(() => {
    if (phase !== 'running') return
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [phase])

  // 键盘快捷键：空格/回车展示要点，← → 切题，1/2/3 评分（每次渲染重挂载，避免闭包过期）
  useEffect(() => {
    if (phase !== 'running') return
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault()
        setRevealed(true)
      } else if (e.key === 'ArrowRight') {
        goNext()
      } else if (e.key === 'ArrowLeft') {
        goPrev()
      } else if (e.key === '1') {
        rate('pass')
      } else if (e.key === '2') {
        rate('fail')
      } else if (e.key === '3') {
        rate('maybe')
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  })

  const copySummary = async () => {
    if (!summary) return
    const ok = await copyText(summary.text)
    setCopied(ok)
    setTimeout(() => setCopied(false), 2000)
  }

  if (phase === 'setup') {
    return (
      <div className="space-y-6">
        <header className="rounded-2xl border border-blue-200 bg-blue-50/60 p-6 dark:border-blue-500/25 dark:bg-blue-500/10">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:flex-wrap">
            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-bold sm:text-2xl">🧑‍💼 面试官模式 · 组卷出题</h1>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                勾选考察方向，系统从共享题库随机抽题组卷。面试时逐题展示、评分并记录备注，结束后自动存入
                <Link to="/history" className="font-medium text-blue-600 hover:underline dark:text-blue-400">
                  考察记录
                </Link>
                ，并可一键复制面试小结。
              </p>
            </div>
            <label className="flex w-full items-center gap-2 text-sm text-slate-600 sm:w-auto sm:max-w-56 dark:text-slate-300">
              候选人
              <input
                value={candidate}
                onChange={(e) => setCandidate(e.target.value)}
                placeholder="姓名或标识（可选）"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 sm:w-40 dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:focus:border-blue-500/50 dark:focus:ring-blue-500/20"
              />
            </label>
          </div>
        </header>

        {resumable && (
          <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-amber-300 bg-amber-50/70 p-4 dark:border-amber-500/30 dark:bg-amber-500/10">
            <p className="min-w-0 flex-1 text-sm text-amber-800 dark:text-amber-200">
              检测到未完成的考察{resumable.candidate ? `（${resumable.candidate}）` : ''}：共{' '}
              {resumable.queueIds.length} 题，进行到第 {Math.min(resumable.current + 1, resumable.queueIds.length)} 题
            </p>
            <button
              type="button"
              onClick={resumeQuiz}
              className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-600"
            >
              恢复考察 →
            </button>
            <button
              type="button"
              onClick={discardResume}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-500 transition-colors hover:border-slate-400 dark:border-white/20 dark:text-slate-400"
            >
              放弃
            </button>
          </div>
        )}

        <div className="space-y-4">
          {tracks.map((track) => {
            const theme = trackThemes[track.color]
            const allSelected = track.topics.every((t) => selectedTopics.has(t.id))
            return (
              <section
                key={track.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-white/[0.03]"
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={cx(
                      'flex h-8 w-8 items-center justify-center rounded-lg text-lg',
                      theme.iconBox,
                    )}
                  >
                    {track.icon}
                  </span>
                  <h2 className="font-semibold">{track.name}</h2>
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedTopics((prev) => {
                        const next = new Set(prev)
                        track.topics.forEach((t) =>
                          allSelected ? next.delete(t.id) : next.add(t.id),
                        )
                        return next
                      })
                    }
                    className="ml-auto text-xs font-medium text-slate-400 hover:text-blue-600 dark:hover:text-blue-400"
                  >
                    {allSelected ? '取消该方向' : '全选该方向'}
                  </button>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {track.topics.map((topic) => {
                    const active = selectedTopics.has(topic.id)
                    return (
                      <button
                        key={topic.id}
                        type="button"
                        onClick={() => toggleTopic(topic.id)}
                        aria-pressed={active}
                        className={cx(
                          'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                          active
                            ? cx(theme.solid, 'shadow-sm')
                            : 'border-slate-200 text-slate-600 hover:border-slate-400 dark:border-white/10 dark:text-slate-300 dark:hover:border-white/25',
                        )}
                      >
                        {topic.name}
                        <span className={cx('ml-1', active ? 'opacity-80' : 'opacity-60')}>
                          {topic.questions.length}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </section>
            )
          })}
        </div>

        <section className="sticky bottom-4 z-10 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-lg backdrop-blur dark:border-white/10 dark:bg-slate-900/95">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
            <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
              题量
              <select
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm dark:border-white/10 dark:bg-white/5 dark:text-slate-100"
              >
                {COUNT_OPTIONS.map((n) => (
                  <option key={n} value={n}>
                    {n} 题
                  </option>
                ))}
              </select>
            </label>
            <Segmented<DiffFilter>
              ariaLabel="按难度抽题"
              value={diff}
              onChange={setDiff}
              options={[
                { value: 'all', label: '全部难度' },
                { value: 'basic', label: '基础' },
                { value: 'intermediate', label: '进阶' },
                { value: 'advanced', label: '高级' },
              ]}
            />
            <label className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-300">
              <input
                type="checkbox"
                checked={ordered}
                onChange={(e) => setOrdered(e.target.checked)}
                className="h-3.5 w-3.5 accent-blue-600"
              />
              由易到难
            </label>
            <label className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-300">
              <input
                type="checkbox"
                checked={onlyFavorites}
                onChange={(e) => setOnlyFavorites(e.target.checked)}
                className="h-3.5 w-3.5 accent-blue-600"
              />
              只抽收藏题
            </label>
            <span className="text-xs text-slate-400 dark:text-slate-500">
              当前题池 {pool.length} 题
            </span>
            <button
              type="button"
              onClick={start}
              disabled={pool.length === 0}
              className="ml-auto rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              开始出题 →
            </button>
          </div>
        </section>
      </div>
    )
  }

  if (phase === 'running' && queue.length > 0) {
    const item = queue[current]!
    const meta = difficultyMeta[item.question.difficulty]
    const verdict = getVerdict(item.question.id)
    return (
      <div className="mx-auto max-w-3xl space-y-5">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              if (confirmExit) {
                setPhase('setup')
              } else {
                setConfirmExit(true)
                setTimeout(() => setConfirmExit(false), 3000)
              }
            }}
            className={cx(
              'rounded-lg border px-3 py-1.5 text-sm transition-colors',
              confirmExit
                ? 'border-rose-400 bg-rose-500 text-white'
                : 'border-slate-200 text-slate-400 hover:border-rose-300 hover:text-rose-500 dark:border-white/10 dark:hover:border-rose-500/40',
            )}
          >
            {confirmExit ? '确认结束？（未存档的备注将丢失）' : '← 结束并返回'}
          </button>
          <span className="ml-auto flex items-center gap-3 text-sm font-medium tabular-nums text-slate-500 dark:text-slate-400">
            <ElapsedTimer key={item.question.id} startTs={startRef.current} />
            {candidate.trim() && <span className="text-slate-400">{candidate.trim()}</span>}
            <span>
              第 {current + 1} / {queue.length} 题
            </span>
          </span>
        </div>
        <ProgressBar value={((current + 1) / queue.length) * 100} />

        <article className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-white/10 dark:bg-white/[0.03]">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
            <span>
              {item.track.icon} {item.track.name} · {item.topic.name}
            </span>
            <span className={cx('rounded px-1.5 py-0.5 font-medium', meta.className)}>
              {meta.label}
            </span>
            {item.question.tags?.map((tag) => <span key={tag}>#{tag}</span>)}
          </div>
          <h1 className="mt-3 text-xl font-semibold leading-relaxed sm:text-2xl">
            {item.question.title}
          </h1>

          {revealed ? (
            <div className="mt-5 border-t border-slate-100 pt-4 dark:border-white/5">
              <AnswerBody question={item.question} />
            </div>
          ) : (
            <div className="mt-6 flex flex-col items-start gap-3 border-t border-dashed border-slate-200 pt-5 dark:border-white/10">
              <p className="text-sm text-slate-400 dark:text-slate-500">
                先让候选人作答，再对照参考要点与追问链（快捷键：空格 展示要点）。
              </p>
              <button
                type="button"
                onClick={() => setRevealed(true)}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
              >
                显示参考要点与追问
              </button>
            </div>
          )}

          <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4 dark:border-white/5">
            <span className="text-xs font-medium text-slate-400 dark:text-slate-500">现场评分</span>
            {VERDICT_ORDER.map((v) => {
              const vm = verdictMeta[v]
              const active = verdict === v
              return (
                <button
                  key={v}
                  type="button"
                  onClick={() => rate(v)}
                  aria-pressed={active}
                  className={cx(
                    'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                    active
                      ? vm.activeClass
                      : 'border-slate-300 text-slate-500 hover:border-slate-400 dark:border-white/20 dark:text-slate-400 dark:hover:border-white/35',
                  )}
                >
                  {vm.icon} {vm.label}
                </button>
              )
            })}
            <span className="ml-auto hidden text-[11px] text-slate-400 sm:inline dark:text-slate-500">
              快捷键：空格 要点 · 1/2/3 评分 · ← → 切题
            </span>
          </div>

          <textarea
            value={currentNote}
            onChange={(e) => updateNote(e.target.value)}
            aria-label="面试备注：记录候选人回答要点或你的评价"
            placeholder="记录候选人回答要点 / 你的评价（可选，会写入面试小结）"
            rows={2}
            className="mt-3 w-full resize-y rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100 dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:focus:border-blue-500/50 dark:focus:ring-blue-500/20"
          />
        </article>

        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={goPrev}
            disabled={current === 0}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:border-slate-400 disabled:opacity-40 dark:border-white/10 dark:text-slate-300"
          >
            ← 上一题
          </button>
          <button
            type="button"
            onClick={goNext}
            className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
          >
            {current + 1 >= queue.length ? '完成考察，生成小结 ✓' : '下一题 →'}
          </button>
        </div>
      </div>
    )
  }

  // phase === 'done'
  return (
    <div className="space-y-5">
      <header className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-6 dark:border-emerald-500/25 dark:bg-emerald-500/10">
        <div className="text-center">
          <p className="text-3xl">🎉</p>
          <h1 className="mt-2 text-xl font-bold">
            本次考察完成{candidate.trim() ? ` · ${candidate.trim()}` : ''}，共 {queue.length} 题
          </h1>
          {saved && (
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              已自动存入
              <Link to="/history" className="mx-0.5 font-medium text-blue-600 hover:underline dark:text-blue-400">
                考察记录
              </Link>
            </p>
          )}
          {summary && (
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-xs">
              <span className="rounded-full bg-emerald-500/15 px-3 py-1 font-medium text-emerald-700 dark:text-emerald-300">
                👍 通过 {summary.counts.pass}
              </span>
              <span className="rounded-full bg-rose-500/15 px-3 py-1 font-medium text-rose-700 dark:text-rose-300">
                👎 不通过 {summary.counts.fail}
              </span>
              <span className="rounded-full bg-amber-500/15 px-3 py-1 font-medium text-amber-700 dark:text-amber-300">
                ➖ 待定 {summary.counts.maybe}
              </span>
              <span className="rounded-full bg-slate-500/15 px-3 py-1 font-medium text-slate-600 dark:text-slate-300">
                未评 {summary.counts.unrated}
              </span>
            </div>
          )}
        </div>
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={copySummary}
            className={cx(
              'rounded-lg px-5 py-2 text-sm font-semibold text-white transition-colors',
              copied ? 'bg-emerald-500' : 'bg-blue-600 hover:bg-blue-700',
            )}
          >
            {copied ? '✓ 小结已复制' : '复制面试小结 📋'}
          </button>
          <Link
            to="/history"
            className="rounded-lg border border-slate-300 px-5 py-2 text-sm font-medium text-slate-600 hover:border-slate-400 dark:border-white/20 dark:text-slate-300"
          >
            查看考察记录 →
          </Link>
          <button
            type="button"
            onClick={start}
            className="rounded-lg border border-slate-300 px-5 py-2 text-sm font-medium text-slate-600 hover:border-slate-400 dark:border-white/20 dark:text-slate-300"
          >
            再出一卷 🔄
          </button>
          <button
            type="button"
            onClick={() => setPhase('setup')}
            className="rounded-lg border border-slate-300 px-5 py-2 text-sm font-medium text-slate-600 hover:border-slate-400 dark:border-white/20 dark:text-slate-300"
          >
            调整配置
          </button>
        </div>
      </header>

      <ul className="space-y-3">
        {queue.map((item, i) => {
          const v = getVerdict(item.question.id)
          const note = (notes[item.question.id] ?? '').trim()
          return (
            <li key={item.question.id}>
              <div className="rounded-xl border border-slate-200 bg-white dark:border-white/10 dark:bg-white/[0.03]">
                <div className="p-4">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
                    <span className="font-mono">{String(i + 1).padStart(2, '0')}</span>
                    <span>
                      {item.track.name} · {item.topic.name}
                    </span>
                    <span
                      className={cx(
                        'rounded px-1.5 py-0.5 font-medium',
                        difficultyMeta[item.question.difficulty].className,
                      )}
                    >
                      {difficultyMeta[item.question.difficulty].label}
                    </span>
                    {v && (
                      <span
                        className={cx(
                          'rounded-full border px-2 py-0.5 font-medium',
                          v === 'pass'
                            ? 'border-emerald-300 text-emerald-600 dark:border-emerald-500/40 dark:text-emerald-300'
                            : v === 'fail'
                              ? 'border-rose-300 text-rose-600 dark:border-rose-500/40 dark:text-rose-300'
                              : 'border-amber-300 text-amber-600 dark:border-amber-500/40 dark:text-amber-300',
                        )}
                      >
                        {verdictMeta[v].icon} {verdictMeta[v].label}
                      </span>
                    )}
                  </div>
                  <h3 className="mt-1.5 font-medium">{item.question.title}</h3>
                  {note && (
                    <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600 dark:bg-white/5 dark:text-slate-300">
                      💬 {note}
                    </p>
                  )}
                </div>
                <details className="group border-t border-slate-100 dark:border-white/5">
                  <summary className="cursor-pointer list-none px-4 py-2.5 text-xs font-medium text-slate-400 hover:text-blue-600 dark:text-slate-500 dark:hover:text-blue-400">
                    展开参考要点与追问
                  </summary>
                  <div className="border-t border-slate-100 px-4 pb-4 pt-3 dark:border-white/5">
                    <AnswerBody question={item.question} />
                  </div>
                </details>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
