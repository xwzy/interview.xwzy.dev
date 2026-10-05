import { verdictMeta, type Verdict } from '../../lib/verdict'
import { difficultyMeta, type IndexedQuestion } from '../../types'
import { cx } from '../../lib/utils'
import ProgressBar from '../../components/ProgressBar'
import AnswerBody from '../../components/AnswerBody'
import ElapsedTimer from './ElapsedTimer'

const VERDICT_ORDER = ['pass', 'fail', 'maybe'] as const

interface QuizRunningProps {
  item: IndexedQuestion
  /** 当前题下标（从 0 开始） */
  index: number
  total: number
  candidate: string
  revealed: boolean
  verdict: Verdict | undefined
  note: string
  /** 双击确认退出：第一次点击置 true */
  confirmExit: boolean
  /** 本题计时起点（切题时同步重置） */
  startTs: number
  onReveal: () => void
  onCollapse: () => void
  onRate: (v: Verdict) => void
  onNoteChange: (value: string) => void
  onExit: () => void
  onPrev: () => void
  onNext: () => void
}

/** 面试官模式答题态：逐题展示题目/要点/追问，现场评分与备注 */
export default function QuizRunning({
  item,
  index,
  total,
  candidate,
  revealed,
  verdict,
  note,
  confirmExit,
  startTs,
  onReveal,
  onCollapse,
  onRate,
  onNoteChange,
  onExit,
  onPrev,
  onNext,
}: QuizRunningProps) {
  const meta = difficultyMeta[item.question.difficulty]
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onExit}
          className={cx(
            'rounded-lg border px-3 py-1.5 text-sm transition-colors',
            confirmExit
              ? 'border-rose-400 bg-rose-500 text-white'
              : 'border-slate-200 text-slate-400 hover:border-rose-300 hover:text-rose-500 dark:border-white/10 dark:hover:border-rose-500/40',
          )}
        >
          {confirmExit ? '再点一次确认返回（进度已存草稿，可恢复）' : '← 结束并返回'}
        </button>
        <span className="ml-auto flex items-center gap-3 text-sm font-medium tabular-nums text-slate-500 dark:text-slate-400">
          <ElapsedTimer key={item.question.id} startTs={startTs} />
          {candidate.trim() && <span className="text-slate-400">{candidate.trim()}</span>}
          <span>
            第 {index + 1} / {total} 题
          </span>
        </span>
      </div>
      <ProgressBar value={((index + 1) / total) * 100} label="考察进度" />

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
            <div className="mt-4 text-right">
              <button
                type="button"
                onClick={onCollapse}
                className="text-xs font-medium text-slate-400 transition-colors hover:text-blue-600 dark:text-slate-500 dark:hover:text-blue-400"
              >
                🙈 收起要点
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-6 flex flex-col items-start gap-3 border-t border-dashed border-slate-200 pt-5 dark:border-white/10">
            <p className="text-sm text-slate-400 dark:text-slate-500">
              先让候选人作答，再对照参考要点与追问链（快捷键：空格 展示要点）。
            </p>
            <button
              type="button"
              onClick={onReveal}
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
                onClick={() => onRate(v)}
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
          value={note}
          onChange={(e) => onNoteChange(e.target.value)}
          aria-label="面试备注：记录候选人回答要点或你的评价"
          placeholder="记录候选人回答要点 / 你的评价（可选，会写入面试小结）"
          rows={2}
          className="mt-3 w-full resize-y rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100 dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:focus:border-blue-500/50 dark:focus:ring-blue-500/20"
        />
      </article>

      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onPrev}
          disabled={index === 0}
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:border-slate-400 disabled:opacity-40 dark:border-white/10 dark:text-slate-300"
        >
          ← 上一题
        </button>
        <button
          type="button"
          onClick={onNext}
          className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
        >
          {index + 1 >= total ? '完成考察，生成小结 ✓' : '下一题 →'}
        </button>
      </div>
    </div>
  )
}
