import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

const STORAGE_KEY = 'interview.theme'

/** 浅色 / 深色 / 跟随系统 */
export type ThemeMode = 'light' | 'dark' | 'system'

export const themeModeMeta: Record<ThemeMode, { label: string; icon: string }> = {
  light: { label: '浅色', icon: '☀️' },
  dark: { label: '深色', icon: '🌙' },
  system: { label: '跟随系统', icon: '🖥️' },
}

const MODES: ThemeMode[] = ['light', 'dark', 'system']

interface ThemeValue {
  mode: ThemeMode
  /** 实际生效的主题（system 时解析自 OS） */
  resolved: 'light' | 'dark'
  /** 循环切换：light → dark → system */
  cycleMode: () => void
}

const ThemeContext = createContext<ThemeValue | null>(null)

function loadInitialMode(): ThemeMode {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'light' || stored === 'dark' || stored === 'system') return stored
  } catch {
    // 隐私模式下 localStorage 不可用，回退到系统偏好
  }
  return 'system'
}

function systemPrefersDark(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

function resolve(mode: ThemeMode): 'light' | 'dark' {
  return mode === 'system' ? (systemPrefersDark() ? 'dark' : 'light') : mode
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>(loadInitialMode)
  const [resolved, setResolved] = useState<'light' | 'dark'>(() => resolve(mode))

  // 应用主题 + 持久化
  useEffect(() => {
    const r = resolve(mode)
    setResolved(r)
    document.documentElement.classList.toggle('dark', r === 'dark')
    try {
      localStorage.setItem(STORAGE_KEY, mode)
    } catch {
      // 忽略存储失败，仅当前会话生效
    }
  }, [mode])

  // 跟随系统模式下，OS 切换深浅色时站点实时跟随
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => {
      if (mode === 'system') {
        const r = resolve('system')
        setResolved(r)
        document.documentElement.classList.toggle('dark', r === 'dark')
      }
    }
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [mode])

  const value = useMemo<ThemeValue>(
    () => ({
      mode,
      resolved,
      cycleMode: () =>
        setMode((m) => MODES[(MODES.indexOf(m) + 1) % MODES.length]!),
    }),
    [mode, resolved],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme 必须在 ThemeProvider 内使用')
  return ctx
}
