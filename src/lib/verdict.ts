/** 面试官对某道题的现场评分结论（类型与展示元数据与评分上下文共用，故放 lib 层） */
export type Verdict = 'pass' | 'fail' | 'maybe'

export const verdictMeta: Record<
  Verdict,
  { label: string; icon: string; activeClass: string }
> = {
  pass: {
    label: '通过',
    icon: '👍',
    activeClass: 'border-emerald-700 bg-emerald-700 text-white',
  },
  fail: {
    label: '不通过',
    icon: '👎',
    activeClass: 'border-rose-700 bg-rose-700 text-white',
  },
  maybe: {
    label: '待定',
    icon: '➖',
    activeClass: 'border-amber-700 bg-amber-700 text-white',
  },
}

export const VALID_VERDICTS: readonly Verdict[] = ['pass', 'fail', 'maybe']
