import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { LS_KEYS } from '../lib/storageKeys'

/**
 * 访问口令的校验常量。支持两种格式（用 `node scripts/hash-password.mjs` 生成后者）：
 *  - '<sha256hex>'：历史格式，无盐快哈希，抗离线爆破弱
 *  - 'pbkdf2:<iterations>$<saltHex>$<hashHex>'：PBKDF2-HMAC-SHA256（600k 轮），推荐
 *
 * 换成 pbkdf2 格式后：登录验证不再走弱哈希（公开 bundle 里不再有密码的快速哈希），
 * 旧设备的登录态（存的是旧 sha256）会失效一次，需重新输入密码。
 * 注意这仍是客户端门禁，防的是随手访问，不是安全边界（见 README）。
 */
const CREDENTIALS = '8de1e564872c61f19bddd5cec6223167000de9d0ed2d21d12c093a333c5ed58f'

async function sha256Hex(text: string): Promise<string> {
  // 非安全上下文（如 http:// 非 localhost）下 crypto.subtle 不存在，抛错而非返回错误结果
  if (!crypto?.subtle) throw new Error('当前环境不支持安全加密接口（需 HTTPS 或 localhost）')
  const data = new TextEncoder().encode(text)
  const buf = await crypto.subtle.digest('SHA-256', data)
  return bytesToHex(new Uint8Array(buf))
}

async function pbkdf2Hex(password: string, saltHex: string, iterations: number): Promise<string> {
  if (!crypto?.subtle) throw new Error('当前环境不支持安全加密接口（需 HTTPS 或 localhost）')
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, [
    'deriveBits',
  ])
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: hexToBytes(saltHex), iterations },
    key,
    256,
  )
  return bytesToHex(new Uint8Array(bits))
}

function hexToBytes(hex: string): Uint8Array {
  if (hex.length % 2 !== 0 || /[^0-9a-f]/i.test(hex)) throw new Error('CREDENTIALS 盐值不是合法 hex')
  const out = new Uint8Array(hex.length / 2)
  for (let i = 0; i < out.length; i++) out[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16)
  return out
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

/** 常量时间比较：避免逐字符早退造成的时序侧信道（门禁场景收益有限，成本也低） */
function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

/** 按常量格式校验密码；格式不支持加密环境时抛错（由 AuthGate 转成用户可读提示） */
async function verifyPassword(password: string): Promise<boolean> {
  if (CREDENTIALS.startsWith('pbkdf2:')) {
    const [iterStr, saltHex, expectedHex] = CREDENTIALS.slice('pbkdf2:'.length).split('$')
    const iterations = Number(iterStr)
    if (!Number.isInteger(iterations) || iterations <= 0 || !saltHex || !expectedHex) {
      throw new Error('CREDENTIALS 的 pbkdf2 格式不正确，请用 scripts/hash-password.mjs 重新生成')
    }
    return timingSafeEqualHex(await pbkdf2Hex(password, saltHex, iterations), expectedHex)
  }
  return timingSafeEqualHex(await sha256Hex(password), CREDENTIALS)
}

interface AuthValue {
  authed: boolean
  login: (password: string) => Promise<boolean>
  logout: () => void
}

const AuthContext = createContext<AuthValue | null>(null)

function loadAuthed(): boolean {
  try {
    return localStorage.getItem(LS_KEYS.auth) === CREDENTIALS
  } catch {
    return false
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authed, setAuthed] = useState<boolean>(loadAuthed)

  const login = useCallback(async (password: string) => {
    // 非 HTTPS/localhost 环境或常量格式错误时 verifyPassword 抛错，由 AuthGate 展示具体原因
    const ok = await verifyPassword(password)
    if (!ok) return false
    try {
      // 登录成功后把校验常量写入本地作为会话令牌，后续访问免重复输入
      localStorage.setItem(LS_KEYS.auth, CREDENTIALS)
    } catch {
      // 存储不可用时仅当前会话保持登录
    }
    setAuthed(true)
    return true
  }, [])

  const logout = useCallback(() => {
    try {
      localStorage.removeItem(LS_KEYS.auth)
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
