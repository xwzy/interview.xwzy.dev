import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import type { SessionItem } from '../lib/summary'

const STORAGE_KEY = 'interview.sessions.v1'

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
}

const SessionContext = createContext<SessionValue | null>(null)

function loadSessions(): InterviewSession[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? (JSON.parse(raw) as InterviewSession[]) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [sessions, setSessions] = useState<InterviewSession[]>(loadSessions)

  const persist = (next: InterviewSession[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch {
      // 存储不可用时静默降级为会话内状态
    }
  }

  const saveSession = useCallback((session: InterviewSession) => {
    setSessions((prev) => {
      // 同 id 覆盖，新记录排最前，超出上限丢弃最旧记录
      const next = [session, ...prev.filter((s) => s.id !== session.id)].slice(0, MAX_SESSIONS)
      persist(next)
      return next
    })
  }, [])

  const removeSession = useCallback((id: string) => {
    setSessions((prev) => {
      const next = prev.filter((s) => s.id !== id)
      persist(next)
      return next
    })
  }, [])

  const value = useMemo<SessionValue>(
    () => ({ sessions, saveSession, removeSession }),
    [sessions, saveSession, removeSession],
  )

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export function useSessions(): SessionValue {
  const ctx = useContext(SessionContext)
  if (!ctx) throw new Error('useSessions 必须在 SessionProvider 内使用')
  return ctx
}
