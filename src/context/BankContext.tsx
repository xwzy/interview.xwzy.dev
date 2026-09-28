import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { CustomQuestion, Track } from '../types'
import { buildBank, type Bank } from '../data/bank'
import { buildMetaBank, type MetaBank } from '../data/metaBank'
import { trackMeta } from '../data/trackMeta.generated'
import { loadAllTracks } from '../data/trackLoaders'
import { LS_KEYS } from '../lib/storageKeys'
import { usePersistentState } from '../lib/usePersistentState'

interface CustomQuestionsValue {
  customQuestions: CustomQuestion[]
  addCustom: (question: CustomQuestion) => void
  updateCustom: (question: CustomQuestion) => void
  removeCustom: (id: string) => void
  /** 一次性清空（设置页用） */
  clearCustom: () => void
  getCustom: (id: string) => CustomQuestion | undefined
}

const CustomQuestionsContext = createContext<CustomQuestionsValue | null>(null)

function parseCustomQuestions(raw: string | null): CustomQuestion[] {
  if (!raw) return []
  try {
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as CustomQuestion[]) : []
  } catch {
    return []
  }
}

export function CustomQuestionsProvider({ children }: { children: ReactNode }) {
  const [customQuestions, setCustomQuestions] = usePersistentState<CustomQuestion[]>(
    LS_KEYS.customQuestions,
    parseCustomQuestions,
    JSON.stringify,
  )

  const addCustom = useCallback(
    (question: CustomQuestion) => {
      setCustomQuestions((prev) => [...prev, question])
    },
    [setCustomQuestions],
  )

  const updateCustom = useCallback(
    (question: CustomQuestion) => {
      setCustomQuestions((prev) => prev.map((q) => (q.id === question.id ? question : q)))
    },
    [setCustomQuestions],
  )

  const removeCustom = useCallback(
    (id: string) => {
      setCustomQuestions((prev) => prev.filter((q) => q.id !== id))
    },
    [setCustomQuestions],
  )

  const clearCustom = useCallback(() => setCustomQuestions([]), [setCustomQuestions])

  const value = useMemo<CustomQuestionsValue>(
    () => ({
      customQuestions,
      addCustom,
      updateCustom,
      removeCustom,
      clearCustom,
      getCustom: (id) => customQuestions.find((q) => q.id === id),
    }),
    [customQuestions, addCustom, updateCustom, removeCustom, clearCustom],
  )

  return <CustomQuestionsContext.Provider value={value}>{children}</CustomQuestionsContext.Provider>
}

export function useCustomQuestions(): CustomQuestionsValue {
  const ctx = useContext(CustomQuestionsContext)
  if (!ctx) throw new Error('useCustomQuestions 必须在 CustomQuestionsProvider 内使用')
  return ctx
}

// ---------- 双层题库：元数据（内联主包，即时可用）+ 全量内容（分包后台加载） ----------

interface BankContextValue {
  metaBank: MetaBank
  /** 全量题库（含要点/追问内容），内容分包就绪前为 null */
  bank: Bank | null
  loadError: boolean
  retry: () => void
}

const BankContext = createContext<BankContextValue | null>(null)

export function BankProvider({ children }: { children: ReactNode }) {
  const { customQuestions } = useCustomQuestions()
  const [rawTracks, setRawTracks] = useState<Track[] | null>(null)
  const [loadError, setLoadError] = useState(false)
  const [retryKey, setRetryKey] = useState(0)

  // 内容分包仅在挂载/手动重试时拉取一次；加载期间页面照常渲染（列表页用元数据）
  useEffect(() => {
    let cancelled = false
    setLoadError(false)
    loadAllTracks()
      .then((tracks) => {
        if (!cancelled) setRawTracks(tracks)
      })
      .catch(() => {
        if (!cancelled) setLoadError(true)
      })
    return () => {
      cancelled = true
    }
  }, [retryKey])

  // 元数据与全量 Bank 都随自定义题目变化重建（纯函数，成本低）
  const metaBank = useMemo(() => buildMetaBank(trackMeta, customQuestions), [customQuestions])
  const bank = useMemo(
    () => (rawTracks ? buildBank(rawTracks, customQuestions) : null),
    [rawTracks, customQuestions],
  )

  const retry = useCallback(() => setRetryKey((k) => k + 1), [])
  const value = useMemo<BankContextValue>(
    () => ({ metaBank, bank, loadError, retry }),
    [metaBank, bank, loadError, retry],
  )

  return <BankContext.Provider value={value}>{children}</BankContext.Provider>
}

export function useBankContext(): BankContextValue {
  const ctx = useContext(BankContext)
  if (!ctx) throw new Error('useBankContext 必须在 BankProvider 内使用')
  return ctx
}

/** 轻量题库（方向/领域/题目 id/难度）：同步可用，不等待内容分包 */
export function useBankMeta(): MetaBank {
  return useBankContext().metaBank
}

/** 全量题库：仅在 FullBankGate 内使用（内容分包就绪后才有值） */
export function useBank(): Bank {
  const { bank } = useBankContext()
  if (!bank) throw new Error('useBank 必须在 FullBankGate 内使用（内容分包未就绪）')
  return bank
}

const gateScreenClass =
  'flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100'

/** 全量内容门禁：搜索/出题/考察记录/领域页等需要完整题目内容的路由包在它里面 */
export function FullBankGate({ children }: { children: ReactNode }) {
  const { bank, loadError, retry } = useBankContext()

  if (loadError) {
    return (
      <div className={gateScreenClass}>
        <p className="text-4xl">📡</p>
        <h1 className="text-lg font-bold">题库加载失败</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          网络异常导致题库分包下载失败，请检查网络后重试。
        </p>
        <button
          type="button"
          onClick={retry}
          className="mt-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          重试
        </button>
      </div>
    )
  }

  if (!bank) {
    return (
      <div className={gateScreenClass}>
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 text-lg font-bold text-white">
          Q
        </span>
        <p className="text-sm text-slate-400 dark:text-slate-500">题库加载中…</p>
      </div>
    )
  }

  return <>{children}</>
}
