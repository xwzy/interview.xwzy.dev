import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react'
import { LS_KEYS } from '../lib/storageKeys'
import { usePersistentState } from '../lib/usePersistentState'

interface FavoritesValue {
  favorites: ReadonlySet<string>
  isFavorite: (id: string) => boolean
  toggleFavorite: (id: string) => void
  /** 一次性清空（设置页用），避免逐条 toggle 造成 O(n) 次写盘 */
  clear: () => void
}

const FavoritesContext = createContext<FavoritesValue | null>(null)

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

/** 收藏夹：星标重点题目，供刷题筛选与定向出题 */
export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = usePersistentState<ReadonlySet<string>>(
    LS_KEYS.favorites,
    parseFavorites,
    stringifyFavorites,
  )

  const toggleFavorite = useCallback(
    (id: string) => {
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
    [setFavorites],
  )

  const clear = useCallback(() => setFavorites(new Set()), [setFavorites])

  const value = useMemo<FavoritesValue>(
    () => ({
      favorites,
      isFavorite: (id) => favorites.has(id),
      toggleFavorite,
      clear,
    }),
    [favorites, toggleFavorite, clear],
  )

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>
}

export function useFavorites(): FavoritesValue {
  const ctx = useContext(FavoritesContext)
  if (!ctx) throw new Error('useFavorites 必须在 FavoritesProvider 内使用')
  return ctx
}
