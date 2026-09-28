import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { LS_KEYS } from '../lib/storageKeys'
import { usePersistentState } from '../lib/usePersistentState'

export interface FavoritesActions {
  toggleFavorite: (id: string) => void
  /** 一次性清空（设置页用），避免逐条 toggle 造成 O(n) 次写盘 */
  clear: () => void
}

/** 收藏夹：星标重点题目，供刷题筛选与定向出题。
 *  与 MasteryContext 同样按「状态 / 动作」拆分，原因见彼处注释。 */
const FavoritesStateContext = createContext<ReadonlySet<string> | null>(null)
const FavoritesActionsContext = createContext<FavoritesActions | null>(null)

function parseFavorites(raw: string | null): ReadonlySet<string> {
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

const stringifyFavorites = (value: ReadonlySet<string>): string => JSON.stringify([...value])

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = usePersistentState<ReadonlySet<string>>(
    LS_KEYS.favorites,
    parseFavorites,
    stringifyFavorites,
  )

  const actions = useMemo<FavoritesActions>(
    () => ({
      toggleFavorite: (id: string) => {
        setFavorites((prev) => {
          const next = new Set(prev)
          if (next.has(id)) {
            next.delete(id)
          } else {
            next.add(id)
          }
          return next
        })
      },
      clear: () => setFavorites(new Set()),
    }),
    [setFavorites],
  )

  return (
    <FavoritesStateContext.Provider value={favorites}>
      <FavoritesActionsContext.Provider value={actions}>{children}</FavoritesActionsContext.Provider>
    </FavoritesStateContext.Provider>
  )
}

/** 订阅收藏状态集合：值变化时重渲染（页面级统计/筛选用） */
export function useFavoritesState(): ReadonlySet<string> {
  const ctx = useContext(FavoritesStateContext)
  if (!ctx) throw new Error('useFavoritesState 必须在 FavoritesProvider 内使用')
  return ctx
}

/** 只订阅动作：引用恒定，不随收藏状态变化重渲染（题卡等高频组件用） */
export function useFavoritesActions(): FavoritesActions {
  const ctx = useContext(FavoritesActionsContext)
  if (!ctx) throw new Error('useFavoritesActions 必须在 FavoritesProvider 内使用')
  return ctx
}
