import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

const STORAGE_KEY = 'interview.auth.v1'

/** 正确密码的 SHA-256（代码中不保存明文密码） */
const EXPECTED_HASH = '8de1e564872c61f19bddd5cec6223167000de9d0ed2d21d12c093a333c5ed58f'

async function sha256Hex(text: string): Promise<string> {
  const data = new TextEncoder().encode(text)
  const buf = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

interface AuthValue {
  authed: boolean
  login: (password: string) => Promise<boolean>
  logout: () => void
}

const AuthContext = createContext<AuthValue | null>(null)

function loadAuthed(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === EXPECTED_HASH
  } catch {
    return false
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authed, setAuthed] = useState<boolean>(loadAuthed)

  const login = useCallback(async (password: string) => {
    const hash = await sha256Hex(password)
    if (hash !== EXPECTED_HASH) return false
    try {
      // 登录成功后把密码哈希写入本地，后续访问免重复登录
      localStorage.setItem(STORAGE_KEY, hash)
    } catch {
      // 存储不可用时仅当前会话保持登录
    }
    setAuthed(true)
    return true
  }, [])

  const logout = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      // 忽略
    }
    setAuthed(false)
  }, [])

  const value = useMemo<AuthValue>(() => ({ authed, login, logout }), [authed, login, logout])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth 必须在 AuthProvider 内使用')
  return ctx
}
