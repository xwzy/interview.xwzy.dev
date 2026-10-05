import { cx } from '../lib/utils'

interface Option<T extends string> {
  value: T
  label: string
}

interface SegmentedProps<T extends string> {
  options: Option<T>[]
  value: T
  onChange: (value: T) => void
  className?: string
  /** 无障碍分组描述 */
  ariaLabel?: string
}

export default function Segmented<T extends string>({
  options,
  value,
  onChange,
  className,
  ariaLabel,
}: SegmentedProps<T>) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={cx(
        'inline-flex rounded-lg border border-slate-200 bg-slate-100 p-0.5 dark:border-white/10 dark:bg-white/5',
        className,
      )}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          aria-pressed={value === option.value}
          className={cx(
            // 命中区纵向扩 4px：分段按钮横向相邻，只扩纵向避免相邻段命中区相互抢占
            'relative rounded-md px-2.5 py-1 text-xs font-medium transition-colors after:absolute after:inset-x-0 after:-inset-y-1 after:content-[""]',
            value === option.value
              ? 'bg-white text-slate-900 shadow-sm dark:bg-white/15 dark:text-white'
              : 'text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
