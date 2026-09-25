import type { Verdict } from '../context/InterviewContext'
import type { CustomQuestion } from '../types'
import type { InterviewSession } from '../context/SessionContext'

export const BACKUP_VERSION = 1

export interface BackupFile {
  version: number
  exportedAt: string
  mastery: string[]
  verdicts: Record<string, string>
  sessions: InterviewSession[]
  customQuestions: CustomQuestion[]
  favorites: string[]
}

const VALID_VERDICTS: readonly string[] = ['pass', 'fail', 'maybe']

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null
}

function toVerdict(v: unknown): Verdict | null {
  return typeof v === 'string' && (VALID_VERDICTS as readonly string[]).includes(v)
    ? (v as Verdict)
    : null
}

function toCustomQuestion(v: Record<string, unknown>): CustomQuestion | null {
  if (
    typeof v.id !== 'string' ||
    typeof v.trackId !== 'string' ||
    typeof v.topicId !== 'string' ||
    typeof v.title !== 'string' ||
    !Array.isArray(v.points)
  ) {
    return null
  }
  return {
    id: v.id,
    trackId: v.trackId,
    topicId: v.topicId,
    title: v.title,
    difficulty: v.difficulty === 'advanced' || v.difficulty === 'intermediate' ? v.difficulty : 'basic',
    tags: Array.isArray(v.tags) ? v.tags.filter((t): t is string => typeof t === 'string') : [],
    points: v.points.filter((p): p is string => typeof p === 'string'),
    followUps: Array.isArray(v.followUps)
      ? v.followUps
          .filter(isRecord)
          .filter((f) => typeof f.question === 'string')
          .map((f) => ({
            question: f.question as string,
            points: Array.isArray(f.points) ? f.points.filter((p): p is string => typeof p === 'string') : [],
          }))
      : [],
    createdAt: typeof v.createdAt === 'string' ? v.createdAt : new Date(0).toISOString(),
  }
}

/** 清洗导入的备份数据：剔除畸形条目，字段类型逐一收敛（防止垃圾数据进入渲染层） */
export function sanitizeBackup(raw: unknown): BackupFile | null {
  if (!isRecord(raw) || raw.version !== BACKUP_VERSION) return null
  if (!Array.isArray(raw.mastery) || !isRecord(raw.verdicts) || !Array.isArray(raw.sessions)) {
    return null
  }

  const mastery = raw.mastery.filter((id): id is string => typeof id === 'string')

  const verdicts: Record<string, string> = {}
  for (const [id, v] of Object.entries(raw.verdicts)) {
    if (typeof id === 'string' && typeof v === 'string' && VALID_VERDICTS.includes(v)) {
      verdicts[id] = v
    }
  }

  const sessions: InterviewSession[] = (Array.isArray(raw.sessions) ? raw.sessions : [])
    .filter(isRecord)
    .filter((s) => typeof s.id === 'string' && Array.isArray(s.items))
    .map((s) => ({
      id: s.id as string,
      candidate: typeof s.candidate === 'string' ? s.candidate : '',
      createdAt: typeof s.createdAt === 'string' ? s.createdAt : new Date(0).toISOString(),
      items: (s.items as unknown[])
        .filter(isRecord)
        .filter((it) => typeof it.questionId === 'string')
        .map((it) => ({
          questionId: it.questionId as string,
          verdict: toVerdict(it.verdict),
          note: typeof it.note === 'string' ? it.note : '',
        })),
    }))

  const customQuestions = (Array.isArray(raw.customQuestions) ? raw.customQuestions : [])
    .filter(isRecord)
    .map(toCustomQuestion)
    .filter((q): q is CustomQuestion => q !== null)

  const favorites = (Array.isArray(raw.favorites) ? raw.favorites : []).filter(
    (id): id is string => typeof id === 'string',
  )

  return {
    version: BACKUP_VERSION,
    exportedAt: typeof raw.exportedAt === 'string' ? raw.exportedAt : new Date().toISOString(),
    mastery,
    verdicts,
    sessions,
    customQuestions,
    favorites,
  }
}
