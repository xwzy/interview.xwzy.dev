import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { LS_KEYS } from '../lib/storageKeys'
import { usePersistentState } from '../lib/usePersistentState'

export interface MasteryActions {
  toggle: (id: string) => void
  /** 一次性清空（设置页用），避免逐条 toggle 造成 O(n) 次写盘 */
  clear: () => void
}

/**
 * 掌握进度按「状态 / 动作」拆成两个 Context：
 * - 状态 Context 随 mastered 集合变化，订阅者（页面级）重渲染做统计与筛选；
 * - 动作 Context 引用恒定，只订阅动作的组件（题卡）不因别人标记掌握而重渲染。
 *   题卡自身的"是否已掌握"由父级算好后以布尔 props 传入，配合 memo 精确更新。
 */
const MasteryStateContext = createContext<ReadonlySet<string> | null>(null)
const MasteryActionsContext = createContext<MasteryActions | null>(null)

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

  const actions = useMemo<MasteryActions>(
    () => ({
      toggle: (id: string) => {
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
      clear: () => setMastered(new Set()),
    }),
    [setMastered],
  )

  return (
    <MasteryStateContext.Provider value={mastered}>
      <MasteryActionsContext.Provider value={actions}>{children}</MasteryActionsContext.Provider>
    </MasteryStateContext.Provider>
  )
}

/** 订阅掌握状态集合：值变化时重渲染（页面级统计/筛选用） */
export function useMasteryState(): ReadonlySet<string> {
  const ctx = useContext(MasteryStateContext)
  if (!ctx) throw new Error('useMasteryState 必须在 MasteryProvider 内使用')
  return ctx
}

/** 只订阅动作：引用恒定，不随掌握状态变化重渲染（题卡等高频组件用） */
export function useMasteryActions(): MasteryActions {
  const ctx = useContext(MasteryActionsContext)
  if (!ctx) throw new Error('useMasteryActions 必须在 MasteryProvider 内使用')
  return ctx
}
