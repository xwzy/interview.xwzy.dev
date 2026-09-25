import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useLocation, useParams } from 'react-router'
import { useBank } from '../context/BankContext'
import { useCustomQuestions } from '../context/BankContext'
import { useMastery } from '../context/MasteryContext'
import { useFavorites } from '../context/FavoritesContext'
import { countMastered, trackThemes } from '../lib/utils'
import { generateId } from '../lib/summary'
import { type CustomQuestion, type Difficulty } from '../types'
import ProgressBar from '../components/ProgressBar'
import QuestionItem from '../components/QuestionItem'
import Segmented from '../components/Segmented'
import NotFoundPage from './NotFoundPage'

type DiffFilter = 'all' | Difficulty
type StatusFilter = 'all' | 'unmastered' | 'mastered' | 'favorite'

interface FormState {
  id: string | null
  title: string
  difficulty: Difficulty
  tags: string
  points: string
  followUps: string
}

const emptyForm: FormState = {
  id: null,
  title: '',
  difficulty: 'basic',
  tags: '',
  points: '',
  followUps: '',
}

/** 领域刷题页：题目列表 + 自定义题目的新增/编辑/删除 */
export default function TopicPage() {
  const { trackId, topicId } = useParams()
  const location = useLocation()
  const { tracks } = useBank()
  const { addCustom, updateCustom, removeCustom, getCustom } = useCustomQuestions()
  const { mastered } = useMastery()
  const { favorites } = useFavorites()

  const track = tracks.find((t) => t.id === trackId)
  const topic = track?.topics.find((t) => t.id === topicId)

  const [keyword, setKeyword] = useState('')
  const [diff, setDiff] = useState<DiffFilter>('all')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [showAnswers, setShowAnswers] = useState(true)
  const [form, setForm] = useState<FormState | null>(null)
  const [formError, setFormError] = useState('')

  const filtered = useMemo(() => {
    if (!topic) return []
    const kw = keyword.trim().toLowerCase()
    return topic.questions.filter((q) => {
      if (diff !== 'all' && q.difficulty !== diff) return false
      const m = mastered.has(q.id)
      if (status === 'mastered' && !m) return false
      if (status === 'unmastered' && m) return false
      if (status === 'favorite' && !favorites.has(q.id)) return false
      if (kw && !(q.title + ' ' + (q.tags ?? []).join(' ')).toLowerCase().includes(kw)) return false
      return true
    })
  }, [topic, keyword, diff, status, mastered, favorites])

  // 带 hash 进入（搜索结果、随机一题）时滚动定位到目标题目
  useEffect(() => {
    if (!location.hash || !track || !topic) return
    const id = location.hash.slice(1)
    const timer = setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 120)
    return () => clearTimeout(timer)
  }, [location.hash, track, topic])

  // 稳定引用：配合 QuestionItem 的 memo，筛选输入时已渲染的题卡不重渲染
  const handleEdit = useCallback(
    (id: string) => {
      const cq = getCustom(id)
      if (!cq) return
      setFormError('')
      setForm({
        id: cq.id,
        title: cq.title,
        difficulty: cq.difficulty,
        tags: cq.tags.join(', '),
        points: cq.points.join('\n'),
        followUps: cq.followUps.map((f) => f.question).join('\n'),
      })
      window.scrollTo({ top: 120, behavior: 'smooth' })
    },
    [getCustom],
  )
  const handleDelete = useCallback((id: string) => removeCustom(id), [removeCustom])

  if (!track || !topic) return <NotFoundPage />

  const theme = trackThemes[track.color]
  const done = countMastered(topic.questions, mastered)
  const pct = topic.questions.length ? (done / topic.questions.length) * 100 : 0

  const topicIdx = track.topics.findIndex((t) => t.id === topic.id)
  const prevTopic = topicIdx > 0 ? track.topics[topicIdx - 1] : undefined
  const nextTopic =
    topicIdx >= 0 && topicIdx < track.topics.length - 1 ? track.topics[topicIdx + 1] : undefined

  const openCreate = () => {
    setFormError('')
    setForm({ ...emptyForm })
  }
  const closeForm = () => {
    setForm(null)
    setFormError('')
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!form || !trackId || !topicId) return
    const title = form.title.trim()
    const points = form.points
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
    if (!title || points.length === 0) {
      setFormError('题干和至少一条参考要点不能为空')
      return
    }
    const payload: CustomQuestion = {
      id: form.id ?? `custom-${generateId()}`,
      trackId,
      topicId,
      title,
      difficulty: form.difficulty,
      tags: form.tags
        .split(/[,，]/)
        .map((t) => t.trim())
        .filter(Boolean),
      points,
      followUps: form.followUps
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .map((question) => ({ question, points: [] })),
      createdAt: new Date().toISOString(),
    }
    if (form.id) updateCustom(payload)
    else addCustom(payload)
    closeForm()
  }

  return (
    <div className="space-y-5">
      <nav className="flex flex-wrap items-center gap-1.5 text-sm text-slate-400 dark:text-slate-500">
        <Link to="/" className="hover:text-blue-600 dark:hover:text-blue-400">
          题库
        </Link>
        <span>/</span>
        <Link
          to={`/tracks/${track.id}`}
          className="hover:text-blue-600 dark:hover:text-blue-400"
        >
          {track.name}
        </Link>
        <span>/</span>
        <span className="text-slate-600 dark:text-slate-300">{topic.name}</span>
      </nav>

      <header className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-white/10 dark:bg-white/[0.03]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold sm:text-2xl">
              {track.icon} {topic.name}
            </h1>
            {topic.description && (
              <p className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                {topic.description}
              </p>
            )}
          </div>
          <div className="w-full max-w-56">
            <div className="mb-1 flex justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>
                已掌握 {done}/{topic.questions.length}
              </span>
              <span className="font-medium">{Math.round(pct)}%</span>
            </div>
            <ProgressBar value={pct} barClass={theme.bar} />
          </div>
        </div>

        {topic.references && topic.references.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4 dark:border-white/5">
            <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
              📖 延伸资料
            </span>
            {topic.references.map((ref) => (
              <a
                key={ref.url}
                href={ref.url}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-slate-200 px-2.5 py-1 text-xs text-slate-600 transition-colors hover:border-blue-300 hover:text-blue-600 dark:border-white/10 dark:text-slate-300 dark:hover:border-blue-500/40 dark:hover:text-blue-400"
              >
                {ref.label} ↗
              </a>
            ))}
          </div>
        )}
      </header>

      {/* 自定义题目表单 */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-white/[0.03]">
        {!form ? (
          <button
            type="button"
            onClick={openCreate}
            className="w-full rounded-xl border border-dashed border-slate-300 py-3 text-sm font-medium text-slate-500 transition-colors hover:border-blue-400 hover:text-blue-600 dark:border-white/15 dark:text-slate-400 dark:hover:border-blue-500/40 dark:hover:text-blue-400"
          >
            ＋ 添加自定义题目
          </button>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">{form.id ? '✎ 编辑自定义题目' : '＋ 新增自定义题目'}</h2>
              <button
                type="button"
                onClick={closeForm}
                className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                取消
              </button>
            </div>
            <input
              value={form.title}
              onChange={(e) => setForm((f) => (f ? { ...f, title: e.target.value } : f))}
              placeholder="题干，如：什么是缓存雪崩？如何应对？"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:focus:border-blue-500/50"
            />
            <div className="flex flex-wrap items-center gap-3">
              <Segmented<Difficulty>
                value={form.difficulty}
                onChange={(difficulty) => setForm((f) => (f ? { ...f, difficulty } : f))}
                options={[
                  { value: 'basic', label: '基础' },
                  { value: 'intermediate', label: '进阶' },
                  { value: 'advanced', label: '高级' },
                ]}
              />
              <input
                value={form.tags}
                onChange={(e) => setForm((f) => (f ? { ...f, tags: e.target.value } : f))}
                placeholder="标签，逗号分隔：缓存, Redis"
                className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm outline-none transition focus:border-blue-400 dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:focus:border-blue-500/50"
              />
            </div>
            <textarea
              value={form.points}
              onChange={(e) => setForm((f) => (f ? { ...f, points: e.target.value } : f))}
              placeholder={'参考要点，每行一条（支持 markdown 加粗 **术语** 与代码块）：\n**雪崩**：大量 key 同时失效…\n应对：TTL 加随机抖动…'}
              rows={4}
              className="w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-400 dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:focus:border-blue-500/50"
            />
            <textarea
              value={form.followUps}
              onChange={(e) => setForm((f) => (f ? { ...f, followUps: e.target.value } : f))}
              placeholder="追问（可选），每行一条：\n如果 DB 顶不住回源流量怎么办？"
              rows={2}
              className="w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-400 dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:focus:border-blue-500/50"
            />
            {formError && <p className="text-xs text-rose-500">{formError}</p>}
            <div className="flex items-center gap-3">
              <button
                type="submit"
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                {form.id ? '保存修改' : '添加题目'}
              </button>
              <span className="text-xs text-slate-400 dark:text-slate-500">
                保存后立即生效于刷题、出题与搜索
              </span>
            </div>
          </form>
        )}
      </section>

      <div className="flex flex-wrap items-center gap-2.5">
        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="在本领域内筛选…"
          className="w-44 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:focus:border-blue-500/50 dark:focus:ring-blue-500/20"
        />
        <Segmented<DiffFilter>
          ariaLabel="按难度筛选"
          value={diff}
          onChange={setDiff}
          options={[
            { value: 'all', label: '全部难度' },
            { value: 'basic', label: '基础' },
            { value: 'intermediate', label: '进阶' },
            { value: 'advanced', label: '高级' },
          ]}
        />
        <Segmented<StatusFilter>
          ariaLabel="按掌握状态筛选"
          value={status}
          onChange={setStatus}
          options={[
            { value: 'all', label: '全部' },
            { value: 'unmastered', label: '未掌握' },
            { value: 'mastered', label: '已掌握' },
            { value: 'favorite', label: '★ 收藏' },
          ]}
        />
        <button
          type="button"
          onClick={() => setShowAnswers((s) => !s)}
          className="ml-auto rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:border-blue-300 hover:text-blue-600 dark:border-white/10 dark:text-slate-300 dark:hover:border-blue-500/40 dark:hover:text-blue-400"
        >
          {showAnswers ? '🙈 自测：收起全部要点' : '👁 显示全部要点'}
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-400 dark:border-white/15 dark:text-slate-500">
          没有符合条件的题目，换个筛选条件试试。
        </div>
      ) : (
        <ul className="space-y-3">
          {filtered.map((q, i) => {
            const isCustom = q.id.startsWith('custom-')
            return (
              <li key={q.id}>
                <QuestionItem
                  question={q}
                  index={i}
                  defaultOpen={showAnswers}
                  custom={isCustom}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              </li>
            )
          })}
        </ul>
      )}

      <div className="flex justify-between gap-4 pt-2 text-sm">
        {prevTopic ? (
          <Link
            to={`/tracks/${track.id}/${prevTopic.id}`}
            className="text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400"
          >
            ← {prevTopic.name}
          </Link>
        ) : (
          <span />
        )}
        {nextTopic ? (
          <Link
            to={`/tracks/${track.id}/${nextTopic.id}`}
            className="text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400"
          >
            {nextTopic.name} →
          </Link>
        ) : (
          <span />
        )}
      </div>
    </div>
  )
}
