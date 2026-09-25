import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

const STORAGE_KEY = 'interview.mastery.v1'

interface MasteryValue {
  mastered: ReadonlySet<string>
  isMastered: (id: string) => boolean
  toggle: (id: string) => void
}

const MasteryContext = createContext<MasteryValue | null>(null)

function loadMastered(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return new Set(raw ? (JSON.parse(raw) as string[]) : [])
  } catch {
    return new Set()
  }
}

export function MasteryProvider({ children }: { children: ReactNode }) {
  const [mastered, setMastered] = useState<Set<string>>(loadMastered)

  const toggle = useCallback((id: string) => {
    setMastered((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]))
      } catch {
        // 存储不可用时静默降级为会话内状态
      }
      return next
    })
  }, [])

  const value = useMemo<MasteryValue>(
    () => ({
      mastered,
      isMastered: (id) => mastered.has(id),
      toggle,
    }),
    [mastered, toggle],
  )

  return <MasteryContext.Provider value={value}>{children}</MasteryContext.Provider>
}

export function useMastery(): MasteryValue {
  const ctx = useContext(MasteryContext)
  if (!ctx) throw new Error('useMastery 必须在 MasteryProvider 内使用')
  return ctx
}
