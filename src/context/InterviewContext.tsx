import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react'
import { LS_KEYS } from '../lib/storageKeys'
import { usePersistentState } from '../lib/usePersistentState'
import { VALID_VERDICTS, type Verdict } from '../lib/verdict'

interface VerdictValue {
  verdicts: Readonly<Record<string, Verdict>>
  getVerdict: (id: string) => Verdict | undefined
  /** 传入 null 表示清除该题评分 */
  setVerdict: (id: string, verdict: Verdict | null) => void
  /** 切换评分：已持有同结论则取消（消除连按/双击时基于过期快照的误判） */
  toggleVerdict: (id: string, verdict: Verdict) => void
  /** 批量清除指定题目的评分（开新卷时清掉上一场残留，避免跨候选人污染） */
  clearFor: (ids: readonly string[]) => void
  /** 一次性清空（设置页用） */
  clear: () => void
}

const VerdictContext = createContext<VerdictValue | null>(null)

/** 评分表上限：只增不减的全局表会随使用年限无限膨胀（存档里已有各卷快照，
    这里只需保住"进行中/最近"的评分），超出时按插入顺序淘汰最早的 */
const MAX_VERDICTS = 1000

function capVerdicts(next: Record<string, Verdict>): Record<string, Verdict> {
  const ids = Object.keys(next)
  if (ids.length <= MAX_VERDICTS) return next
  const out: Record<string, Verdict> = {}
  for (const id of ids.slice(ids.length - MAX_VERDICTS)) out[id] = next[id]
  return out
}

function parseVerdicts(raw: string | null): Readonly<Record<string, Verdict>> {
  if (!raw) return {}
  try {
    const parsed: unknown = JSON.parse(raw)
    const out: Record<string, Verdict> = {}
    if (typeof parsed === 'object' && parsed !== null) {
      for (const [id, v] of Object.entries(parsed)) {
        if (typeof id === 'string' && typeof v === 'string' && VALID_VERDICTS.includes(v as Verdict)) {
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
        return capVerdicts(next)
      })
    },
    [setVerdicts],
  )

  const toggleVerdict = useCallback(
    (id: string, verdict: Verdict) => {
      setVerdicts((prev) => {
        // 在 updater 内部基于最新值判断：快速连按/双击不会读到过期的 context 快照
        if (prev[id] === verdict) {
          const next = { ...prev }
          delete next[id]
          return next
        }
        return capVerdicts({ ...prev, [id]: verdict })
      })
    },
    [setVerdicts],
  )

  const clearFor = useCallback(
    (ids: readonly string[]) => {
      setVerdicts((prev) => {
        const next = { ...prev }
        let changed = false
        for (const id of ids) {
          if (id in next) {
            delete next[id]
            changed = true
          }
        }
        return changed ? next : prev
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
      toggleVerdict,
      clearFor,
      clear,
    }),
    [verdicts, setVerdict, toggleVerdict, clearFor, clear],
  )

  return <VerdictContext.Provider value={value}>{children}</VerdictContext.Provider>
}

export function useVerdicts(): VerdictValue {
  const ctx = useContext(VerdictContext)
  if (!ctx) throw new Error('useVerdicts 必须在 VerdictProvider 内使用')
  return ctx
}
