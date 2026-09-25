import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router'
import { useBank } from '../context/BankContext'
import { useCustomQuestions } from '../context/BankContext'
import { useFavorites } from '../context/FavoritesContext'
import { useMastery } from '../context/MasteryContext'
import { useSessions } from '../context/SessionContext'
import { countMastered } from '../lib/utils'
import TrackCard from '../components/TrackCard'

const usageModes = [
  {
    icon: '🧑‍💼',
    title: '面试官模式',
    description: '按方向与难度随机组卷，现场逐题展示、评分，一键生成面试小结，追问链随取随用。',
    to: '/quiz',
    cta: '开始出题',
  },
  {
    icon: '📝',
    title: '刷题模式',
    description: '按领域逐题自测：先自己想，再展开要点对照，标记已掌握、追踪复习进度。',
    to: '#tracks',
    cta: '开始刷题',
  },
] as const

export default function HomePage() {
  const { tracks, totalTopicCount, totalQuestionCount, questionIndex } = useBank()
  const navigate = useNavigate()
  const { mastered } = useMastery()
  const { favorites } = useFavorites()
  const { customQuestions } = useCustomQuestions()
  const { sessions } = useSessions()
  const masteredTotal = useMemo(
    () => countMastered(tracks.flatMap((t) => t.topics.flatMap((tp) => tp.questions)), mastered),
    [tracks, mastered],
  )

  const goRandom = () => {
    const pick = questionIndex[Math.floor(Math.random() * questionIndex.length)]
    if (!pick) return
    navigate(`/tracks/${pick.track.id}/${pick.topic.id}#${pick.question.id}`)
  }
  const personalStats = [
    { icon: '✓', label: '已掌握', value: masteredTotal },
    { icon: '★', label: '收藏', value: favorites.size, to: '/search?fav=1' },
    { icon: '✎', label: '自定义题目', value: customQuestions.length },
    { icon: '🗂️', label: '考察记录', value: sessions.length, to: '/history' },
  ] as const
  return (
    <div className="space-y-12">
      <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white px-6 py-12 text-center sm:px-12 dark:border-white/10 dark:bg-white/[0.03]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,rgba(59,130,246,0.12),transparent)] dark:bg-[radial-gradient(60%_50%_at_50%_0%,rgba(59,130,246,0.2),transparent)]"
        />
        <div className="relative">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">面试宝典</h1>
          <p className="mx-auto mt-3 max-w-2xl leading-relaxed text-slate-600 dark:text-slate-300">
            互联网技术面试知识库：各岗位知识按领域分类整理，
            <span className="font-medium text-slate-900 dark:text-white">面试官出题</span>与
            <span className="font-medium text-slate-900 dark:text-white">个人刷题</span>
            共享同一套题库，一个站点全搞定。
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="rounded-full bg-slate-100 px-3 py-1 dark:bg-white/10">
              {tracks.length} 大方向
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1 dark:bg-white/10">
              {totalTopicCount} 个知识领域
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1 dark:bg-white/10">
              {totalQuestionCount} 道精选题目
            </span>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={goRandom}
              className="rounded-full bg-slate-900 px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
              title="从全站题库随机抽一道题"
            >
              🎲 随机一题
            </button>
            {personalStats.map((stat) =>
              'to' in stat && stat.to ? (
                <Link
                  key={stat.label}
                  to={stat.to}
                  className="rounded-full border border-blue-200 bg-blue-50/70 px-3 py-1.5 font-medium text-blue-700 transition-colors hover:border-blue-400 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300 dark:hover:border-blue-500/60"
                >
                  {stat.icon} {stat.label} {stat.value}
                </Link>
              ) : (
                <span
                  key={stat.label}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1.5 font-medium text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
                >
                  {stat.icon} {stat.label} {stat.value}
                </span>
              ),
            )}
          </div>

          <div className="mx-auto mt-8 grid max-w-3xl gap-4 sm:grid-cols-2">
            {usageModes.map((mode) =>
              mode.to.startsWith('#') ? (
                <a
                  key={mode.title}
                  href={mode.to}
                  className="group rounded-2xl border border-slate-200 bg-slate-50/50 p-5 text-left transition-all hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-lg dark:border-white/10 dark:bg-white/[0.02] dark:hover:border-blue-500/40"
                >
                  <ModeCardBody mode={mode} />
                </a>
              ) : (
                <Link
                  key={mode.title}
                  to={mode.to}
                  className="group rounded-2xl border border-slate-200 bg-slate-50/50 p-5 text-left transition-all hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-lg dark:border-white/10 dark:bg-white/[0.02] dark:hover:border-blue-500/40"
                >
                  <ModeCardBody mode={mode} />
                </Link>
              ),
            )}
          </div>
        </div>
      </section>

      <section id="tracks" className="scroll-mt-20">
        <h2 className="mb-5 text-lg font-semibold">按方向浏览题库</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tracks.map((track) => (
            <TrackCard key={track.id} track={track} />
          ))}
        </div>
      </section>
    </div>
  )
}

function ModeCardBody({ mode }: { mode: (typeof usageModes)[number] }) {
  return (
    <>
      <div className="flex items-center gap-2.5">
        <span className="text-2xl">{mode.icon}</span>
        <h3 className="font-semibold">{mode.title}</h3>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
        {mode.description}
      </p>
      <p className="mt-3 text-sm font-medium text-blue-600 group-hover:underline dark:text-blue-400">
        {mode.cta} →
      </p>
    </>
  )
}
