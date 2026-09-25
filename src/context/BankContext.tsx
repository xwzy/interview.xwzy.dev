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
import { loadAllTracks } from '../data/trackLoaders'

const STORAGE_KEY = 'interview.custom-questions.v1'

interface CustomQuestionsValue {
  customQuestions: CustomQuestion[]
  addCustom: (question: CustomQuestion) => void
  updateCustom: (question: CustomQuestion) => void
  removeCustom: (id: string) => void
  getCustom: (id: string) => CustomQuestion | undefined
}

const CustomQuestionsContext = createContext<CustomQuestionsValue | null>(null)

function loadCustomQuestions(): CustomQuestion[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? (JSON.parse(raw) as CustomQuestion[]) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function CustomQuestionsProvider({ children }: { children: ReactNode }) {
  const [customQuestions, setCustomQuestions] = useState<CustomQuestion[]>(loadCustomQuestions)

  const persist = (next: CustomQuestion[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch {
      // 存储不可用时静默降级为会话内状态
    }
  }

  const addCustom = useCallback((question: CustomQuestion) => {
    setCustomQuestions((prev) => {
      const next = [...prev, question]
      persist(next)
      return next
    })
  }, [])

  const updateCustom = useCallback((question: CustomQuestion) => {
    setCustomQuestions((prev) => {
      const next = prev.map((q) => (q.id === question.id ? question : q))
      persist(next)
      return next
    })
  }, [])

  const removeCustom = useCallback((id: string) => {
    setCustomQuestions((prev) => {
      const next = prev.filter((q) => q.id !== id)
      persist(next)
      return next
    })
  }, [])

  const value = useMemo<CustomQuestionsValue>(
    () => ({
      customQuestions,
      addCustom,
      updateCustom,
      removeCustom,
      getCustom: (id) => customQuestions.find((q) => q.id === id),
    }),
    [customQuestions, addCustom, updateCustom, removeCustom],
  )

  return <CustomQuestionsContext.Provider value={value}>{children}</CustomQuestionsContext.Provider>
}

export function useCustomQuestions(): CustomQuestionsValue {
  const ctx = useContext(CustomQuestionsContext)
  if (!ctx) throw new Error('useCustomQuestions 必须在 CustomQuestionsProvider 内使用')
  return ctx
}

// ---------- 合并后的动态题库（按方向分包异步加载） ----------

const BankContext = createContext<Bank | null>(null)

export function BankProvider({ children }: { children: ReactNode }) {
  const { customQuestions } = useCustomQuestions()
  const [rawTracks, setRawTracks] = useState<Track[] | null>(null)
  const [loadError, setLoadError] = useState(false)
  const [retryKey, setRetryKey] = useState(0)

  // 数据按方向分包异步加载，仅在挂载/手动重试时拉取一次
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

  // 加载完成与自定义题目变化时都会重建 Bank（纯函数，成本低）
  const bank = useMemo(
    () => (rawTracks ? buildBank(rawTracks, customQuestions) : null),
    [rawTracks, customQuestions],
  )

  // 加载失败提供重试入口，而不是永远卡在加载页
  if (loadError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        <p className="text-4xl">📡</p>
        <h1 className="text-lg font-bold">题库加载失败</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          网络异常导致题库分包下载失败，请检查网络后重试。
        </p>
        <button
          type="button"
          onClick={() => setRetryKey((k) => k + 1)}
          className="mt-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          重试
        </button>
      </div>
    )
  }

  // 加载完成前渲染加载页：保证子树消费方拿到的 Bank 始终是完整数据
  if (!bank) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 text-lg font-bold text-white">
          Q
        </span>
        <p className="text-sm text-slate-400 dark:text-slate-500">题库加载中…</p>
      </div>
    )
  }

  return <BankContext.Provider value={bank}>{children}</BankContext.Provider>
}

export function useBank(): Bank {
  const ctx = useContext(BankContext)
  if (!ctx) throw new Error('useBank 必须在 BankProvider 内使用')
  return ctx
}
