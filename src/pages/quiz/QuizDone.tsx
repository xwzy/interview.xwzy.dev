import { Link } from 'react-router'
import { verdictMeta, type Verdict } from '../../lib/verdict'
import { difficultyMeta, type IndexedQuestion } from '../../types'
import { cx, formatDuration } from '../../lib/utils'
import type { SummaryCounts } from '../../lib/summary'
import AnswerBody from '../../components/AnswerBody'

interface QuizDoneProps {
  candidate: string
  queue: IndexedQuestion[]
  summary: { text: string; counts: SummaryCounts } | null
  /** 本次小结是否已自动存档 */
  saved: boolean
  copied: boolean
  notes: Record<string, string>
  /** 整卷总用时（秒）；早于该功能的旧记录可能为 0 */
  totalDuration: number
  verdictOf: (id: string) => Verdict | undefined
  onCopy: () => void
  onStartAgain: () => void
  onAdjust: () => void
}

/** 面试官模式完成态：小结统计 + 整卷回看 */
export default function QuizDone({
  candidate,
  queue,
  summary,
  saved,
  copied,
  notes,
  totalDuration,
  verdictOf,
  onCopy,
  onStartAgain,
  onAdjust,
}: QuizDoneProps) {
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
          {totalDuration > 0 && (
            <p className="mt-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
              ⏱ 总用时 {formatDuration(totalDuration)}
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
            onClick={onCopy}
            className={cx(
              'rounded-lg px-5 py-2 text-sm font-semibold text-white transition-colors',
              copied ? 'bg-emerald-700' : 'bg-blue-600 hover:bg-blue-700',
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
            onClick={onStartAgain}
            className="rounded-lg border border-slate-300 px-5 py-2 text-sm font-medium text-slate-600 hover:border-slate-400 dark:border-white/20 dark:text-slate-300"
          >
            再出一卷 🔄
          </button>
          <button
            type="button"
            onClick={onAdjust}
            className="rounded-lg border border-slate-300 px-5 py-2 text-sm font-medium text-slate-600 hover:border-slate-400 dark:border-white/20 dark:text-slate-300"
          >
            调整配置
          </button>
        </div>
      </header>

      <ul className="space-y-3">
        {queue.map((item, i) => {
          const v = verdictOf(item.question.id)
          const note = (notes[item.question.id] ?? '').trim()
          return (
            <li key={item.question.id}>
              <div className="rounded-xl border border-slate-200 bg-white dark:border-white/10 dark:bg-white/[0.03]">
                <div className="p-4">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
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
                  <summary className="cursor-pointer list-none px-4 py-2.5 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400">
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
