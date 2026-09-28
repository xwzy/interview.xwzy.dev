import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react'
import { LS_KEYS } from '../lib/storageKeys'
import { usePersistentState } from '../lib/usePersistentState'

interface MasteryValue {
  mastered: ReadonlySet<string>
  isMastered: (id: string) => boolean
  toggle: (id: string) => void
  /** 一次性清空（设置页用），避免逐条 toggle 造成 O(n) 次写盘 */
  clear: () => void
}

const MasteryContext = createContext<MasteryValue | null>(null)

function parseMastered(raw: string | null): ReadonlySet<string> {
  if (!raw) return new Set()
  try {
    const parsed: unknown = JSON.parse(raw)
    return new Set(
      Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : [],
    )
  } catch {
    return new Set()
  }
}

const stringifyMastered = (value: ReadonlySet<string>): string => JSON.stringify([...value])

export function MasteryProvider({ children }: { children: ReactNode }) {
  const [mastered, setMastered] = usePersistentState<ReadonlySet<string>>(
    LS_KEYS.mastery,
    parseMastered,
    stringifyMastered,
  )

  const toggle = useCallback(
    (id: string) => {
      setMastered((prev) => {
        const next = new Set(prev)
        if (next.has(id)) {
          next.delete(id)
        } else {
          next.add(id)
        }
        return next
      })
    },
    [setMastered],
  )

  const clear = useCallback(() => setMastered(new Set()), [setMastered])

  const value = useMemo<MasteryValue>(
    () => ({
      mastered,
      isMastered: (id) => mastered.has(id),
      toggle,
      clear,
    }),
    [mastered, toggle, clear],
  )

  return <MasteryContext.Provider value={value}>{children}</MasteryContext.Provider>
}

export function useMastery(): MasteryValue {
  const ctx = useContext(MasteryContext)
  if (!ctx) throw new Error('useMastery 必须在 MasteryProvider 内使用')
  return ctx
}
