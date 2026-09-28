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
      // 存储不可用时静默降级为会话内状态
    }
  }, [key, state, stringify])

  return [state, setState]
}
