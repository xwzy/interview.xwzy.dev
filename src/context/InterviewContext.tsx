import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react'
import { LS_KEYS } from '../lib/storageKeys'
import { usePersistentState } from '../lib/usePersistentState'

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

const VALID_VERDICTS: readonly string[] = ['pass', 'fail', 'maybe']

interface VerdictValue {
  verdicts: Readonly<Record<string, Verdict>>
  getVerdict: (id: string) => Verdict | undefined
  /** 传入 null 表示清除该题评分 */
  setVerdict: (id: string, verdict: Verdict | null) => void
  /** 一次性清空（设置页用） */
  clear: () => void
}

const VerdictContext = createContext<VerdictValue | null>(null)

function parseVerdicts(raw: string | null): Readonly<Record<string, Verdict>> {
  if (!raw) return {}
  try {
    const parsed: unknown = JSON.parse(raw)
    const out: Record<string, Verdict> = {}
    if (typeof parsed === 'object' && parsed !== null) {
      for (const [id, v] of Object.entries(parsed)) {
        if (typeof id === 'string' && typeof v === 'string' && VALID_VERDICTS.includes(v)) {
          out[id] = v as Verdict
        }
      }
    }
    return out
  } catch {
    return {}
  }
}

const stringifyVerdicts = (value: Readonly<Record<string, Verdict>>): string =>
  JSON.stringify(value)

export function VerdictProvider({ children }: { children: ReactNode }) {
  const [verdicts, setVerdicts] = usePersistentState<Readonly<Record<string, Verdict>>>(
    LS_KEYS.verdicts,
    parseVerdicts,
    stringifyVerdicts,
  )

  const setVerdict = useCallback(
    (id: string, verdict: Verdict | null) => {
      setVerdicts((prev) => {
        const next = { ...prev }
        if (verdict === null) {
          delete next[id]
        } else {
          next[id] = verdict
        }
        return next
      })
    },
    [setVerdicts],
  )

  const clear = useCallback(() => setVerdicts({}), [setVerdicts])

  const value = useMemo<VerdictValue>(
    () => ({
      verdicts,
      getVerdict: (id) => verdicts[id],
      setVerdict,
      clear,
    }),
    [verdicts, setVerdict, clear],
  )

  return <VerdictContext.Provider value={value}>{children}</VerdictContext.Provider>
}

export function useVerdicts(): VerdictValue {
  const ctx = useContext(VerdictContext)
  if (!ctx) throw new Error('useVerdicts 必须在 VerdictProvider 内使用')
  return ctx
}
