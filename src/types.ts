export type Difficulty = 'basic' | 'intermediate' | 'advanced'

export type TrackColor =
  | 'blue'
  | 'emerald'
  | 'violet'
  | 'amber'
  | 'rose'
  | 'cyan'
  | 'orange'
  | 'slate'
  | 'indigo'
  | 'pink'

export interface Resource {
  label: string
  url: string
  note?: string
}

/** 追问链中的一步（归一化后的运行时形态） */
export interface FollowUp {
  question: string
  points: string[]
}

/** 数据文件中的追问写法：直接写字符串，或给 { question, points } 对象 */
export type FollowUpInput = string | { question: string; points?: string[] }

export interface Question {
  id: string
  title: string
  difficulty: Difficulty
  tags?: string[]
  /** 参考要点，markdown 格式，建议 3-6 条 */
  points: string[]
  /** 层层递进的追问链，面试官可逐步深入 */
  followUps?: FollowUpInput[]
}

export type NormalizedQuestion = Omit<Question, 'followUps'> & { followUps: FollowUp[] }

export interface Topic {
  id: string
  name: string
  description?: string
  references?: Resource[]
  questions: Question[]
}

export type NormalizedTopic = Omit<Topic, 'questions'> & { questions: NormalizedQuestion[] }

export interface Track {
  id: string
  name: string
  icon: string
  tagline: string
  description: string
  color: TrackColor
  topics: Topic[]
}

export type NormalizedTrack = Omit<Track, 'topics'> & { topics: NormalizedTopic[] }

/** 用户在本地新增的自定义题目（挂在某个方向的某个领域下） */
export interface CustomQuestion {
  id: string
  trackId: string
  topicId: string
  title: string
  difficulty: Difficulty
  tags: string[]
  /** markdown 要点，每条一条 */
  points: string[]
  /** 追问链（已归一化：对象形态） */
  followUps: { question: string; points: string[] }[]
  createdAt: string
}

/** 题库索引中的一条（携带所属方向/领域，供出题、搜索、记录回看使用） */
export interface IndexedQuestion {
  track: NormalizedTrack
  topic: NormalizedTopic
  question: NormalizedQuestion
  /** 参与全文匹配的小写字段集合 */
  haystack: string
}

export const difficultyMeta: Record<Difficulty, { label: string; className: string }> = {
  basic: {
    label: '基础',
    className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  },
  intermediate: {
    label: '进阶',
    className: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  },
  advanced: {
    label: '高级',
    className: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
  },
}
