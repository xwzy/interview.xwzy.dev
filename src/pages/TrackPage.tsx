import { Link, useParams } from 'react-router'
import { useBank } from '../context/BankContext'
import { useMastery } from '../context/MasteryContext'
import { countMastered, cx, trackThemes } from '../lib/utils'
import { difficultyMeta } from '../types'
import ProgressBar from '../components/ProgressBar'
import NotFoundPage from './NotFoundPage'

export default function TrackPage() {
  const { trackId } = useParams()
  const { tracks } = useBank()
  const track = tracks.find((t) => t.id === trackId)
  const { mastered } = useMastery()

  if (!track) return <NotFoundPage />

  const theme = trackThemes[track.color]
  const allQuestions = track.topics.flatMap((t) => t.questions)
  const done = countMastered(allQuestions, mastered)
  const pct = allQuestions.length ? (done / allQuestions.length) * 100 : 0
  const topicIndex = tracks.findIndex((t) => t.id === track.id)

  return (
    <div className="space-y-6">
      <nav className="flex items-center gap-1.5 text-sm text-slate-400 dark:text-slate-500">
        <Link to="/" className="hover:text-blue-600 dark:hover:text-blue-400">
          题库
        </Link>
        <span>/</span>
        <span className="text-slate-600 dark:text-slate-300">{track.name}</span>
      </nav>

      <header className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-white/10 dark:bg-white/[0.03]">
        <div className="flex flex-wrap items-start gap-4">
          <span
            className={cx(
              'flex h-14 w-14 items-center justify-center rounded-2xl text-3xl',
              theme.iconBox,
            )}
          >
            {track.icon}
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold sm:text-2xl">{track.name}</h1>
            <p className="mt-1 leading-relaxed text-slate-600 dark:text-slate-300">
              {track.description}
            </p>
          </div>
          <div className="w-full max-w-56">
            <div className="mb-1 flex justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>
                总进度 {done}/{allQuestions.length}
              </span>
              <span className="font-medium">{Math.round(pct)}%</span>
            </div>
            <ProgressBar value={pct} barClass={theme.bar} />
          </div>
        </div>
      </header>

      <ul className="space-y-3">
        {track.topics.map((topic, i) => {
          const tDone = countMastered(topic.questions, mastered)
          const tPct = topic.questions.length ? (tDone / topic.questions.length) * 100 : 0
          const counts = {
            basic: topic.questions.filter((q) => q.difficulty === 'basic').length,
            intermediate: topic.questions.filter((q) => q.difficulty === 'intermediate').length,
            advanced: topic.questions.filter((q) => q.difficulty === 'advanced').length,
          }
          return (
            <li key={topic.id}>
              <Link
                to={`/tracks/${track.id}/${topic.id}`}
                className={cx(
                  'group block rounded-2xl border border-slate-200 bg-white p-5 transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-white/[0.03]',
                  theme.ring,
                )}
              >
                <div className="flex items-baseline gap-3">
                  <span className="font-mono text-sm text-slate-300 dark:text-slate-600">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <h2 className="font-semibold group-hover:text-blue-600 dark:group-hover:text-blue-400">
                    {topic.name}
                  </h2>
                  <span className="ml-auto text-xs text-slate-400 dark:text-slate-500">
                    {topic.questions.length} 题
                  </span>
                </div>
                {topic.description && (
                  <p className="mt-1.5 pl-8 text-sm text-slate-600 dark:text-slate-300">
                    {topic.description}
                  </p>
                )}
                <div className="mt-3 flex flex-wrap items-center gap-2 pl-8">
                  {(['basic', 'intermediate', 'advanced'] as const).map((d) =>
                    counts[d] > 0 ? (
                      <span
                        key={d}
                        className={cx(
                          'rounded px-1.5 py-0.5 text-[11px] font-medium',
                          difficultyMeta[d].className,
                        )}
                      >
                        {difficultyMeta[d].label} {counts[d]}
                      </span>
                    ) : null,
                  )}
                  <div className="ml-auto flex w-40 items-center gap-2">
                    <ProgressBar value={tPct} barClass={theme.bar} className="flex-1" />
                    <span className="text-[11px] tabular-nums text-slate-400 dark:text-slate-500">
                      {tDone}/{topic.questions.length}
                    </span>
                  </div>
                </div>
              </Link>
            </li>
          )
        })}
      </ul>

      <div className="flex justify-between gap-4 pt-2 text-sm">
        {topicIndex > 0 ? (
          <Link
            to={`/tracks/${tracks[topicIndex - 1]!.id}`}
            className="text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400"
          >
            ← {tracks[topicIndex - 1]!.name}
          </Link>
        ) : (
          <span />
        )}
        {topicIndex < tracks.length - 1 ? (
          <Link
            to={`/tracks/${tracks[topicIndex + 1]!.id}`}
            className="text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400"
          >
            {tracks[topicIndex + 1]!.name} →
          </Link>
        ) : (
          <span />
        )}
      </div>
    </div>
  )
}
