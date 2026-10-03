import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { CustomQuestion, Track } from '../types'
import { buildBaseBank, mergeCustomBank, type Bank } from '../data/bank'
import { buildMetaBank, type MetaBank } from '../data/metaBank'
import { trackMeta } from '../data/trackMeta.generated'
import { loadAllTracks } from '../data/trackLoaders'
import { sanitizeCustomQuestions } from '../lib/backup'
import { isLowBandwidth } from '../lib/utils'
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
    // 与备份导入同一套清洗：畸形条目/字段逐项收敛，防止脏 localStorage 数据进入渲染层
    return sanitizeCustomQuestions(JSON.parse(raw))
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

// ---------- 双层题库：元数据（内联主包，即时可用）+ 全量内容（分包按需加载） ----------

interface BankContextValue {
  metaBank: MetaBank
  /** 全量题库（含要点/追问内容），内容分包就绪前为 null */
  bank: Bank | null
  loadError: boolean
  /** 幂等触发内容分包加载（FullBankGate 进入时调用，避免首页就拉全部题目内容） */
  ensureLoaded: () => void
  retry: () => void
}

const BankContext = createContext<BankContextValue | null>(null)

export function BankProvider({ children }: { children: ReactNode }) {
  const { customQuestions } = useCustomQuestions()
  const [rawTracks, setRawTracks] = useState<Track[] | null>(null)
  const [loadError, setLoadError] = useState(false)
  /** 进行中的加载 promise：去重并发的 ensureLoaded，失败后置空以便重试 */
  const loadPromiseRef = useRef<Promise<void> | null>(null)

  const ensureLoaded = useCallback((): void => {
    if (loadPromiseRef.current) return
    setLoadError(false)
    const promise = loadAllTracks()
      .then((tracks) => {
        setRawTracks(tracks)
      })
      .catch(() => {
        // 失败后清掉 promise，让下一次 ensureLoaded/retry 能重新发起
        loadPromiseRef.current = null
        setLoadError(true)
      })
    loadPromiseRef.current = promise
  }, [])

  const retry = useCallback(() => {
    // 失败路径已把 ref 置空；这里挡住连点重试导致的并发加载（弱网下放大失败面）
    if (loadPromiseRef.current) return
    ensureLoaded()
  }, [ensureLoaded])

  // 后台预取：等浏览器空闲再拉内容分包（首页/方向页只依赖元数据，不必立刻下载全部题目）；
  // 省流模式 / 弱网下跳过，进入需要内容的页面时由 FullBankGate 即时触发
  useEffect(() => {
    if (isLowBandwidth()) return
    const w = window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number
      cancelIdleCallback?: (handle: number) => void
    }
    const idle =
      w.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 3000))
    const handle = idle(() => ensureLoaded(), { timeout: 5000 })
    return () => {
      if (w.cancelIdleCallback) w.cancelIdleCallback(handle)
      else window.clearTimeout(handle)
    }
  }, [ensureLoaded])

  // 基础层只随内容分包构建一次；自定义题目增删改只重建轻量的合并层（全文索引不重算）
  const baseBank = useMemo(() => (rawTracks ? buildBaseBank(rawTracks) : null), [rawTracks])
  const metaBank = useMemo(() => buildMetaBank(trackMeta, customQuestions), [customQuestions])
  const bank = useMemo(
    () => (baseBank ? mergeCustomBank(baseBank, customQuestions) : null),
    [baseBank, customQuestions],
  )

  const value = useMemo<BankContextValue>(
    () => ({ metaBank, bank, loadError, ensureLoaded, retry }),
    [metaBank, bank, loadError, ensureLoaded, retry],
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
  'flex min-h-[50vh] flex-col items-center justify-center gap-3 text-slate-900 dark:text-slate-100'

/** 全量内容门禁：搜索/出题/考察记录/领域页等需要完整题目内容的路由包在它里面。
 *  挂载即触发内容分包加载——按需拉取，访问首页/方向页不下载题目内容。 */
export function FullBankGate({ children }: { children: ReactNode }) {
  const { bank, loadError, retry, ensureLoaded } = useBankContext()

  useEffect(() => {
    ensureLoaded()
  }, [ensureLoaded])

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
