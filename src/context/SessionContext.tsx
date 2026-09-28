import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react'
import { sanitizeSessions } from '../lib/backup'
import { LS_KEYS } from '../lib/storageKeys'
import { usePersistentState } from '../lib/usePersistentState'
import type { SessionItem } from '../lib/summary'

/** 本地存档上限：防止多年积累撑爆 localStorage */
const MAX_SESSIONS = 50

export interface InterviewSession {
  id: string
  /** 候选人姓名/标识，可为空 */
  candidate: string
  /** ISO 时间 */
  createdAt: string
  items: SessionItem[]
}

interface SessionValue {
  sessions: InterviewSession[]
  saveSession: (session: InterviewSession) => void
  removeSession: (id: string) => void
  /** 一次性清空（设置页用） */
  clear: () => void
}

const SessionContext = createContext<SessionValue | null>(null)

function parseSessions(raw: string | null): InterviewSession[] {
  if (!raw) return []
  try {
    // 与备份导入同一套清洗：畸形条目/字段逐项收敛，防止脏 localStorage 数据进入渲染层
    return sanitizeSessions(JSON.parse(raw))
  } catch {
    return []
  }
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [sessions, setSessions] = usePersistentState<InterviewSession[]>(
    LS_KEYS.sessions,
    parseSessions,
    JSON.stringify,
  )

  const saveSession = useCallback(
    (session: InterviewSession) => {
      // 同 id 覆盖，新记录排最前，超出上限丢弃最旧记录
      setSessions((prev) =>
        [session, ...prev.filter((s) => s.id !== session.id)].slice(0, MAX_SESSIONS),
      )
    },
    [setSessions],
  )

  const removeSession = useCallback(
    (id: string) => {
      setSessions((prev) => prev.filter((s) => s.id !== id))
    },
    [setSessions],
  )

  const clear = useCallback(() => setSessions([]), [setSessions])

  const value = useMemo<SessionValue>(
    () => ({ sessions, saveSession, removeSession, clear }),
    [sessions, saveSession, removeSession, clear],
  )

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export function useSessions(): SessionValue {
  const ctx = useContext(SessionContext)
  if (!ctx) throw new Error('useSessions 必须在 SessionProvider 内使用')
  return ctx
}
