import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react'

/**
 * localStorage 持久化 state：挂载时读取，变化时写回。
 * 写盘放在 effect 而非 setState updater——updater 必须是纯函数（StrictMode 下会执行两次）。
 * parse/stringify 需传模块级稳定引用，避免 stringify 变化反复触发写盘。
 *
 * 跨标签页：监听 storage 事件同步其他标签页对同一 key 的修改。各 Provider 的写入都是
 * 「基于内存旧值的全量覆盖」，不同步的话后写的标签页会静默抹掉先写标签页的进度
 * （掌握标记/收藏/评分丢失）。同步后各标签页在毫秒级收敛到最新值，
 * 丢失窗口缩小到「两个标签页同一瞬间并发写」这一极小竞态。
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

  // 当前 state 的序列化结果（每次渲染刷新）：供写盘去重与 storage 事件回环抑制
  const serializedRef = useRef<string>('')
  serializedRef.current = stringify(state)
  // 本标签页最后一次写入的内容：与上次相同则跳过 setItem（外部同步引发的重渲染不再写盘）
  const lastWrittenRef = useRef<string | null>(null)

  useEffect(() => {
    if (serializedRef.current === lastWrittenRef.current) return
    try {
      localStorage.setItem(key, serializedRef.current)
      lastWrittenRef.current = serializedRef.current
    } catch {
      // 存储不可用时降级为会话内状态，但要让用户知道（静默丢进度比报错更糟）
      notifyStorageWriteFailed()
    }
  }, [key, state])

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== key) return
      // 其他标签页写入的内容与本地一致（回声）时忽略，避免无意义的重渲染
      if (e.newValue === serializedRef.current) return
      try {
        // newValue 为 null 表示其他标签页删除了该键（如清空数据）：一并跟随清空
        setState(parse(e.newValue))
      } catch {
        // 脏数据忽略，保持本地状态
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [key, parse])

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
