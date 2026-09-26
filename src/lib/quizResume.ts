/** 出题会话现场快照（sessionStorage，防误刷新丢失） */
export interface QuizResumeState {
  candidate: string
  queueIds: string[]
  current: number
  notes: Record<string, string>
  savedAt: string
}

export const RESUME_KEY = 'interview.quiz-resume.v1'

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null
}

/** 解析并校验现场快照：剔除畸形数据、收敛字段类型（垃圾输入返回 null） */
export function parseResume(raw: string): QuizResumeState | null {
  let data: unknown
  try {
    data = JSON.parse(raw)
  } catch {
    return null
  }
  if (!isRecord(data)) return null
  if (!Array.isArray(data.queueIds) || data.queueIds.length === 0) return null
  const queueIds = data.queueIds.filter((id): id is string => typeof id === 'string')
  if (queueIds.length === 0) return null
  const current =
    typeof data.current === 'number' && Number.isFinite(data.current) && data.current >= 0
      ? Math.floor(data.current)
      : 0
  const notes: Record<string, string> = {}
  if (isRecord(data.notes)) {
    for (const [k, v] of Object.entries(data.notes)) {
      if (typeof k === 'string' && typeof v === 'string') notes[k] = v
    }
  }
  return {
    candidate: typeof data.candidate === 'string' ? data.candidate : '',
    queueIds,
    current: Math.min(current, queueIds.length - 1),
    notes,
    savedAt: typeof data.savedAt === 'string' ? data.savedAt : new Date(0).toISOString(),
  }
}

export function loadResume(): QuizResumeState | null {
  try {
    const raw = sessionStorage.getItem(RESUME_KEY)
    return raw ? parseResume(raw) : null
  } catch {
    return null
  }
}

export function saveResume(state: QuizResumeState): void {
  try {
    sessionStorage.setItem(RESUME_KEY, JSON.stringify(state))
  } catch {
    // 存储不可用时静默跳过
  }
}

export function clearResume(): void {
  try {
    sessionStorage.removeItem(RESUME_KEY)
  } catch {
    // 忽略
  }
}
