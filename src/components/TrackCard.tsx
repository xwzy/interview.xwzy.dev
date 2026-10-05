import { memo } from 'react'
import { Link } from 'react-router'
import type { MetaTrack } from '../types'
import { cx, trackThemes } from '../lib/utils'
import ProgressBar from './ProgressBar'

interface TrackCardProps {
  track: MetaTrack
  /** 该方向已掌握题数：父级从状态 Context 算好传入——配合 memo，
   *  标记掌握时只有进度变化的那张卡重渲染，其余 14 张跳过 */
  done: number
}

function TrackCardImpl({ track, done }: TrackCardProps) {
  const theme = trackThemes[track.color]
  const allQuestions = track.topics.flatMap((t) => t.questions)
  const pct = allQuestions.length ? (done / allQuestions.length) * 100 : 0

  return (
    <Link
      to={`/tracks/${track.id}`}
      className={cx(
        'group flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg dark:border-white/10 dark:bg-white/[0.03]',
        theme.ring,
      )}
    >
      <div className="flex items-center gap-3">
        <span
          className={cx(
            'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-2xl',
            theme.iconBox,
          )}
        >
          {track.icon}
        </span>
        <div className="min-w-0">
          <h3 className="font-semibold">{track.name}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {track.topics.length} 个领域 · {allQuestions.length} 道题
          </p>
        </div>
      </div>

      <p className="line-clamp-2 text-sm text-slate-600 dark:text-slate-300">{track.tagline}</p>

      <div className="mt-auto">
        <div className="mb-1 flex items-center justify-between text-xs">
          <span className="text-slate-500 dark:text-slate-400">
            复习进度 {done}/{allQuestions.length}
          </span>
          <span
            className={cx(
              'font-medium',
              pct >= 100 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400',
            )}
          >
            {Math.round(pct)}%
          </span>
        </div>
        <ProgressBar value={pct} barClass={theme.bar} />
      </div>
    </Link>
  )
}

export default memo(TrackCardImpl)
