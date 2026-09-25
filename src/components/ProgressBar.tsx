import { cx } from '../lib/utils'

interface ProgressBarProps {
  /** 0-100 */
  value: number
  barClass?: string
  className?: string
}

export default function ProgressBar({ value, barClass, className }: ProgressBarProps) {
  const pct = Math.max(0, Math.min(100, Math.round(value)))
  return (
    <div
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cx(
        'h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-white/10',
        className,
      )}
    >
      <div
        className={cx('h-full rounded-full transition-all duration-500', barClass ?? 'bg-blue-500')}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}
