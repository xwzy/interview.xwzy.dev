import { useEffect, useState, type Dispatch, type SetStateAction } from 'react'

/**
 * localStorage 持久化 state：挂载时读取，变化时写回。
 * 写盘放在 effect 而非 setState updater——updater 必须是纯函数（StrictMode 下会执行两次）。
 * parse/stringify 需传模块级稳定引用，避免 stringify 变化反复触发写盘。
 */
export function usePersistentState<T>(
  key: string,
  parse: (raw: string | null) => T,
  stringify: (value: T) => string,
): [T, Dispatch<SetStateAction<T>>] {
  const [state, setState] = useState<T>(() => {
    try {
      return parse(localStorage.getItem(key))
    } catch {
      // 存储不可用时仅会话内生效
      return parse(null)
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(key, stringify(state))
    } catch {
      // 存储不可用时降级为会话内状态，但要让用户知道（静默丢进度比报错更糟）
      notifyStorageWriteFailed()
    }
  }, [key, state, stringify])

  return [state, setState]
}

// ---------- 写盘失败广播：Layout 监听后展示全局横幅 ----------

const STORAGE_FAIL_EVENT = 'interview:storage-write-failed'
/** 节流：连续多个键同时失败只广播一次，避免横幅反复弹出 */
const NOTIFY_INTERVAL_MS = 10_000
let lastNotifiedAt = 0

export function notifyStorageWriteFailed(): void {
  const now = Date.now()
  if (now - lastNotifiedAt < NOTIFY_INTERVAL_MS) return
  lastNotifiedAt = now
  window.dispatchEvent(new CustomEvent(STORAGE_FAIL_EVENT))
}

export function subscribeStorageWriteFailed(listener: () => void): () => void {
  window.addEventListener(STORAGE_FAIL_EVENT, listener)
  return () => window.removeEventListener(STORAGE_FAIL_EVENT, listener)
}
