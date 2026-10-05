import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router'
import { useBank } from '../context/BankContext'
import { useFavoritesState } from '../context/FavoritesContext'
import { useMasteryState } from '../context/MasteryContext'
import { copyText } from '../lib/clipboard'
import { clearResume, loadResume, saveResume, type QuizResumeState } from '../lib/quizResume'
import { LS_KEYS } from '../lib/storageKeys'
import { cx, shuffle, trackThemes } from '../lib/utils'
import { buildSummaryText, generateId, type SessionItem, type SummaryCounts } from '../lib/summary'
import { type Difficulty, type IndexedQuestion, type NormalizedTrack } from '../types'
import { useVerdicts } from '../context/InterviewContext'
import type { Verdict } from '../lib/verdict'
import { useSessions } from '../context/SessionContext'
import Segmented from '../components/Segmented'
import QuizRunning from './quiz/QuizRunning'
import QuizDone from './quiz/QuizDone'

type Phase = 'setup' | 'running' | 'done'
type DiffFilter = 'all' | Difficulty

const COUNT_OPTIONS = [5, 10, 15, 20, 30]

const DIFFICULTY_RANK: Record<Difficulty, number> = { basic: 0, intermediate: 1, advanced: 2 }

/** 上次组卷勾选的方向（数据文件改名后失效的 id 会被过滤掉） */
function loadStoredTopicIds(): string[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(LS_KEYS.quizTopics) ?? '[]')
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : []
  } catch {
    return []
  }
}

function persistTopicIds(ids: ReadonlySet<string>): void {
  try {
    localStorage.setItem(LS_KEYS.quizTopics, JSON.stringify([...ids]))
  } catch {
    // 存储不可用时跳过：下次进来退回默认选择
  }
}

/** 初始勾选：优先上次的选择，其次默认第一个方向的第一个领域（不硬编码具体 id，数据调整不会静默变空） */
function initialSelectedTopics(tracks: NormalizedTrack[]): Set<string> {
  const known = new Set(tracks.flatMap((t) => t.topics.map((tp) => tp.id)))
  const stored = loadStoredTopicIds().filter((id) => known.has(id))
  if (stored.length > 0) return new Set(stored)
  const first = tracks[0]?.topics[0]
  return first ? new Set([first.id]) : new Set()
}

/** 面试官模式：选方向 → 随机组卷 → 现场逐题考察、评分、记录 → 自动存档并生成面试小结。
 *  本文件持有组卷状态机；答题态与完成态 UI 见 quiz/ 子组件。 */
/** 真题改编题的统一标签（与搜索页的真题筛选共用同一数据标记） */
const EXAM_TAG = '真题改编'

export default function QuizPage() {
  const [phase, setPhase] = useState<Phase>('setup')
  const [candidate, setCandidate] = useState('')
  const [ordered, setOrdered] = useState(false)
  const [onlyFavorites, setOnlyFavorites] = useState(false)
  const [onlyUnmastered, setOnlyUnmastered] = useState(false)
  const [onlyExam, setOnlyExam] = useState(false)
  const { tracks, questionIndex, questionById } = useBank()
  const [selectedTopics, setSelectedTopics] = useState<Set<string>>(() =>
    initialSelectedTopics(tracks),
  )
  const [diff, setDiff] = useState<DiffFilter>('all')
  const [count, setCount] = useState(10)

  const [queue, setQueue] = useState<IndexedQuestion[]>([])
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [current, setCurrent] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [summary, setSummary] = useState<{ text: string; counts: SummaryCounts } | null>(null)
  const [copied, setCopied] = useState(false)
  const [saved, setSaved] = useState(false)
  const [confirmExit, setConfirmExit] = useState(false)
  const [resumable, setResumable] = useState<QuizResumeState | null>(null)
  const startRef = useRef(Date.now())
  const durationsRef = useRef<Record<string, number>>({})
  /** 本次考察是否已结束存档：双击"完成"/键盘与按钮事件叠加时防止重复 saveSession */
  const finishedRef = useRef(false)
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { getVerdict, clearFor, toggleVerdict } = useVerdicts()
  const { saveSession } = useSessions()
  const favorites = useFavoritesState()
  const mastered = useMasteryState()

  const pool = useMemo(
    () =>
      questionIndex.filter(
        (r) =>
          selectedTopics.has(r.topic.id) &&
          (diff === 'all' || r.question.difficulty === diff) &&
          (!onlyFavorites || favorites.has(r.question.id)) &&
          (!onlyUnmastered || !mastered.has(r.question.id)) &&
          (!onlyExam || (r.question.tags ?? []).includes(EXAM_TAG)),
      ),
    [questionIndex, selectedTopics, diff, onlyFavorites, favorites, onlyUnmastered, onlyExam, mastered],
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
    // 开新卷前清掉这批题上一场遗留的评分，避免上一位候选人的评分带进新卷的小结
    clearFor(queueNext.map((item) => item.question.id))
    persistTopicIds(selectedTopics)
    finishedRef.current = false
    setQueue(queueNext)
    setNotes({})
    durationsRef.current = {}
    // 同步重置计时起点：ElapsedTimer 在渲染期就读 startRef，等 effect 重置会把组卷页停留时间计入第一题
    startRef.current = Date.now()
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
    finishedRef.current = false
    setCandidate(resumable.candidate)
    setNotes(resumable.notes)
    durationsRef.current = { ...resumable.durations }
    setQueue(restored)
    setCurrent(Math.min(resumable.current, restored.length - 1))
    startRef.current = Date.now()
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
    // 幂等守卫：低端机上 React 提交被长任务延迟时，双击"完成"或键盘+按钮叠加
    // 会进入两次 finish，saveSession 各生成一个新 id，考察记录出现重复存档
    if (finishedRef.current) return
    finishedRef.current = true
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
    startRef.current = Date.now()
    setCurrent((c) => Math.max(0, c - 1))
    setRevealed(false)
  }

  const goNext = () => {
    const item = queue[current]
    if (item) commitTime(item.question.id)
    if (current + 1 >= queue.length) {
      finish()
    } else {
      startRef.current = Date.now()
      setCurrent((c) => c + 1)
      setRevealed(false)
    }
  }

  /** 双击确认退出答题：第一次点击进入确认态（3 秒内再点生效）。
      退出保留草稿快照，回到组卷页可恢复——与 QuizRunning 的确认文案保持一致 */
  const handleExit = () => {
    if (confirmExit) {
      setPhase('setup')
    } else {
      setConfirmExit(true)
      if (exitTimerRef.current) clearTimeout(exitTimerRef.current)
      exitTimerRef.current = setTimeout(() => setConfirmExit(false), 3000)
    }
  }

  const rate = (verdict: Verdict) => {
    const item = queue[current]
    if (!item) return
    // toggle 判断在 context updater 内部完成：快捷键快速连按不基于过期快照
    toggleVerdict(item.question.id, verdict)
  }

  const currentNote = queue[current] ? (notes[queue[current]!.question.id] ?? '') : ''
  const updateNote = (value: string) => {
    const item = queue[current]
    if (!item) return
    setNotes((prev) => ({ ...prev, [item.question.id]: value }))
  }

  // 计时起点在各次状态迁移（start/resume/切题）中同步重置；
  // 不能放到 effect 里——ElapsedTimer 渲染期就读 startRef，effect 重置会晚一帧导致读数错误

  useEffect(
    () => () => {
      if (exitTimerRef.current) clearTimeout(exitTimerRef.current)
    },
    [],
  )

  // 回到组卷页时读取现场快照（供"恢复上次考察"）；进行中每次状态变化自动续存
  useEffect(() => {
    if (phase === 'setup') setResumable(loadResume())
  }, [phase])

  // 快照读取最新状态（定时器存续期间 state 可能变化，闭包不能停留在挂载时的值）
  const latestRef = useRef({ candidate, queue, current, notes })
  latestRef.current = { candidate, queue, current, notes }

  useEffect(() => {
    if (phase !== 'running' || queue.length === 0) return
    const persist = () => {
      const snap = latestRef.current
      if (snap.queue.length === 0) return
      // 快照把当前题"未提交"的停留时长一并计入：在某题上停留很久不切题、
      // 直接刷新/误关也能找回用时（15s 定时兜底，最多丢最后一段不足 15s 的部分）
      const item = snap.queue[snap.current]
      const durations = { ...durationsRef.current }
      if (item) {
        const secs = Math.floor((Date.now() - startRef.current) / 1000)
        if (secs > 0) durations[item.question.id] = (durations[item.question.id] ?? 0) + secs
      }
      saveResume({
        candidate: snap.candidate,
        queueIds: snap.queue.map((i) => i.question.id),
        current: snap.current,
        notes: snap.notes,
        durations,
        savedAt: new Date().toISOString(),
      })
    }
    persist()
    const timer = setInterval(persist, 15_000)
    // 15s 兜底之外的立即落盘：iOS Safari PWA 常忽略 beforeunload 的挽留弹窗且可能
    // 直接杀进程，用户切后台/关闭页面前先把快照写全
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') persist()
    }
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('pagehide', persist)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('pagehide', persist)
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
    // 队列为空时不再响应快捷键：避免 goNext 走 finish 分支写入空记录
    if (phase !== 'running' || queue.length === 0) return
    const handler = (e: KeyboardEvent) => {
      // 输入法组词确认的回车不是快捷键
      if (e.isComposing) return
      // 焦点在按钮/链接等可交互元素上时放行原生行为（空格/回车应激活按钮，不能被吞掉）
      if (e.target instanceof Element && e.target.closest('button, a, input, select, textarea, [contenteditable]'))
        return
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault()
        setRevealed(true)
      } else if (e.key === 'ArrowRight') {
        // 最后一题的"下一题"= 结束并存档，面试现场误触一次即定档——
        // 键盘切题到最后一题为止，生成小结必须显式点击按钮
        if (current + 1 < queue.length) goNext()
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

  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const copySummary = async () => {
    if (!summary) return
    const ok = await copyText(summary.text)
    setCopied(ok)
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current)
    copyTimerRef.current = setTimeout(() => setCopied(false), 2000)
  }

  useEffect(
    () => () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current)
    },
    [],
  )

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

        <section className="sticky bottom-4 z-10 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-lg backdrop-blur dark:border-white/10 dark:bg-slate-900/95 [padding-bottom:max(1rem,env(safe-area-inset-bottom))]">
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
                className="h-4 w-4 accent-blue-600"
              />
              由易到难
            </label>
            <label className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-300">
              <input
                type="checkbox"
                checked={onlyFavorites}
                onChange={(e) => setOnlyFavorites(e.target.checked)}
                className="h-4 w-4 accent-blue-600"
              />
              只抽收藏题
            </label>
            <label className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-300">
              <input
                type="checkbox"
                checked={onlyUnmastered}
                onChange={(e) => setOnlyUnmastered(e.target.checked)}
                className="h-4 w-4 accent-blue-600"
              />
              只抽未掌握
            </label>
            <label className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-300">
              <input
                type="checkbox"
                checked={onlyExam}
                onChange={(e) => setOnlyExam(e.target.checked)}
                className="h-4 w-4 accent-violet-600"
              />
              只抽真题
            </label>
            {selectedTopics.size > 0 && (
              <button
                type="button"
                onClick={() => setSelectedTopics(new Set())}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-500 transition-colors hover:border-rose-300 hover:text-rose-500 dark:border-white/10 dark:text-slate-400 dark:hover:border-rose-500/40"
              >
                清空选择
              </button>
            )}
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
    return (
      <QuizRunning
        item={queue[current]!}
        index={current}
        total={queue.length}
        candidate={candidate}
        revealed={revealed}
        verdict={getVerdict(queue[current]!.question.id)}
        note={currentNote}
        confirmExit={confirmExit}
        startTs={startRef.current}
        onReveal={() => setRevealed(true)}
        onCollapse={() => setRevealed(false)}
        onRate={rate}
        onNoteChange={updateNote}
        onExit={handleExit}
        onPrev={goPrev}
        onNext={goNext}
      />
    )
  }

  // phase === 'done'
  // 存档时已 commit 当前题用时，此时读取 durationsRef 即为整卷总用时
  const totalDuration = queue.reduce(
    (n, item) => n + (durationsRef.current[item.question.id] ?? 0),
    0,
  )
  return (
    <QuizDone
      candidate={candidate}
      queue={queue}
      summary={summary}
      saved={saved}
      copied={copied}
      notes={notes}
      totalDuration={totalDuration}
      verdictOf={getVerdict}
      onCopy={copySummary}
      onStartAgain={start}
      onAdjust={() => setPhase('setup')}
    />
  )
}
