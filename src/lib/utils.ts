import type { TrackColor } from '../types'

export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

export function shuffle<T>(items: readonly T[]): T[] {
  const arr = [...items]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j]!, arr[i]!]
  }
  return arr
}

export function countMastered(
  questions: ReadonlyArray<{ id: string }>,
  mastered: ReadonlySet<string>,
): number {
  return questions.reduce((n, q) => n + (mastered.has(q.id) ? 1 : 0), 0)
}

/** 秒数格式化为 mm:ss（整卷总用时可能超过 1 小时，此时显示 h:mm:ss） */
export function formatDuration(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}

/** 去掉 markdown 记号，用于搜索摘要等纯文本场景 */
export function stripMarkdown(text: string): string {
  return text.replace(/[#*`>[\]()]/g, '').replace(/\s+/g, ' ').trim()
}

/** 弱网 / 省流判断：决定是否做后台预取（内容分包、路由分包），避免替用户花流量 */
export function isLowBandwidth(): boolean {
  const conn = (
    navigator as Navigator & {
      connection?: { saveData?: boolean; effectiveType?: string }
    }
  ).connection
  if (!conn) return false
  return Boolean(conn.saveData) || conn.effectiveType === 'slow-2g' || conn.effectiveType === '2g'
}

/** 系统"减少动态效果"偏好：JS 驱动的滚动/动画应据此降级（CSS 媒体查询覆盖不到的路径）。
 *  matchMedia 用可选链调用——jsdom 等测试环境未实现时安全回退为 false */
export function prefersReducedMotion(): boolean {
  try {
    return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
  } catch {
    return false
  }
}

export interface TrackTheme {
  /** 图标底色 */
  iconBox: string
  /** 小徽章 */
  chip: string
  /** 进度条颜色 */
  bar: string
  /** 卡片 hover 边框 */
  ring: string
  /** 实心按钮 */
  solid: string
}

export const trackThemes: Record<TrackColor, TrackTheme> = {
  blue: {
    iconBox: 'bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300',
    chip: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300',
    bar: 'bg-blue-500',
    ring: 'group-hover:border-blue-300 dark:group-hover:border-blue-500/40',
    solid: 'bg-blue-700 border-blue-700 text-white',
  },
  emerald: {
    iconBox: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300',
    chip: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
    bar: 'bg-emerald-500',
    ring: 'group-hover:border-emerald-300 dark:group-hover:border-emerald-500/40',
    solid: 'bg-emerald-700 border-emerald-700 text-white',
  },
  violet: {
    iconBox: 'bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300',
    chip: 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300',
    bar: 'bg-violet-500',
    ring: 'group-hover:border-violet-300 dark:group-hover:border-violet-500/40',
    solid: 'bg-violet-700 border-violet-700 text-white',
  },
  amber: {
    iconBox: 'bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300',
    chip: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
    bar: 'bg-amber-500',
    ring: 'group-hover:border-amber-300 dark:group-hover:border-amber-500/40',
    solid: 'bg-amber-700 border-amber-700 text-white',
  },
  rose: {
    iconBox: 'bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300',
    chip: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
    bar: 'bg-rose-500',
    ring: 'group-hover:border-rose-300 dark:group-hover:border-rose-500/40',
    solid: 'bg-rose-700 border-rose-700 text-white',
  },
  cyan: {
    iconBox: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-500/15 dark:text-cyan-300',
    chip: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-300',
    bar: 'bg-cyan-500',
    ring: 'group-hover:border-cyan-300 dark:group-hover:border-cyan-500/40',
    solid: 'bg-cyan-700 border-cyan-700 text-white',
  },
  orange: {
    iconBox: 'bg-orange-100 text-orange-600 dark:bg-orange-500/15 dark:text-orange-300',
    chip: 'bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300',
    bar: 'bg-orange-500',
    ring: 'group-hover:border-orange-300 dark:group-hover:border-orange-500/40',
    solid: 'bg-orange-700 border-orange-700 text-white',
  },
  slate: {
    iconBox: 'bg-slate-200 text-slate-600 dark:bg-white/10 dark:text-slate-300',
    chip: 'bg-slate-200 text-slate-700 dark:bg-white/10 dark:text-slate-300',
    bar: 'bg-slate-500',
    ring: 'group-hover:border-slate-400 dark:group-hover:border-slate-400/50',
    solid: 'bg-slate-600 border-slate-600 text-white',
  },
  indigo: {
    iconBox: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300',
    chip: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300',
    bar: 'bg-indigo-500',
    ring: 'group-hover:border-indigo-300 dark:group-hover:border-indigo-500/40',
    solid: 'bg-indigo-700 border-indigo-700 text-white',
  },
  pink: {
    iconBox: 'bg-pink-100 text-pink-600 dark:bg-pink-500/15 dark:text-pink-300',
    chip: 'bg-pink-100 text-pink-700 dark:bg-pink-500/15 dark:text-pink-300',
    bar: 'bg-pink-500',
    ring: 'group-hover:border-pink-300 dark:group-hover:border-pink-500/40',
    solid: 'bg-pink-700 border-pink-700 text-white',
  },
  teal: {
    iconBox: 'bg-teal-100 text-teal-600 dark:bg-teal-500/15 dark:text-teal-300',
    chip: 'bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300',
    bar: 'bg-teal-500',
    ring: 'group-hover:border-teal-300 dark:group-hover:border-teal-500/40',
    solid: 'bg-teal-700 border-teal-700 text-white',
  },
  fuchsia: {
    iconBox: 'bg-fuchsia-100 text-fuchsia-600 dark:bg-fuchsia-500/15 dark:text-fuchsia-300',
    chip: 'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-500/15 dark:text-fuchsia-300',
    bar: 'bg-fuchsia-500',
    ring: 'group-hover:border-fuchsia-300 dark:group-hover:border-fuchsia-500/40',
    solid: 'bg-fuchsia-700 border-fuchsia-700 text-white',
  },
}
