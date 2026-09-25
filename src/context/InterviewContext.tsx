import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

const STORAGE_KEY = 'interview.verdicts.v1'

/** 面试官对某道题的现场评分结论 */
export type Verdict = 'pass' | 'fail' | 'maybe'

export const verdictMeta: Record<
  Verdict,
  { label: string; icon: string; activeClass: string }
> = {
  pass: {
    label: '通过',
    icon: '👍',
    activeClass: 'border-emerald-500 bg-emerald-500 text-white',
  },
  fail: {
    label: '不通过',
    icon: '👎',
    activeClass: 'border-rose-500 bg-rose-500 text-white',
  },
  maybe: {
    label: '待定',
    icon: '➖',
    activeClass: 'border-amber-500 bg-amber-500 text-white',
  },
}

interface VerdictValue {
  verdicts: Readonly<Record<string, Verdict>>
  getVerdict: (id: string) => Verdict | undefined
  /** 传入 null 表示清除该题评分 */
  setVerdict: (id: string, verdict: Verdict | null) => void
}

const VerdictContext = createContext<VerdictValue | null>(null)

function loadVerdicts(): Record<string, Verdict> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Record<string, Verdict>) : {}
  } catch {
    return {}
  }
}

export function VerdictProvider({ children }: { children: ReactNode }) {
  const [verdicts, setVerdicts] = useState<Record<string, Verdict>>(loadVerdicts)

  const setVerdict = useCallback((id: string, verdict: Verdict | null) => {
    setVerdicts((prev) => {
      const next = { ...prev }
      if (verdict === null) {
        delete next[id]
      } else {
        next[id] = verdict
      }
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      } catch {
        // 存储不可用时静默降级为会话内状态
      }
      return next
    })
  }, [])

  const value = useMemo<VerdictValue>(
    () => ({
      verdicts,
      getVerdict: (id) => verdicts[id],
      setVerdict,
    }),
    [verdicts, setVerdict],
  )

  return <VerdictContext.Provider value={value}>{children}</VerdictContext.Provider>
}

export function useVerdicts(): VerdictValue {
  const ctx = useContext(VerdictContext)
  if (!ctx) throw new Error('useVerdicts 必须在 VerdictProvider 内使用')
  return ctx
}
