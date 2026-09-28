import type {
  CustomQuestion,
  FollowUp,
  FollowUpInput,
  IndexedQuestion,
  NormalizedQuestion,
  NormalizedTopic,
  NormalizedTrack,
  Question,
  Track,
} from '../types'

export interface Bank {
  tracks: NormalizedTrack[]
  questionIndex: IndexedQuestion[]
  questionById: Map<string, IndexedQuestion>
  totalTopicCount: number
  totalQuestionCount: number
}

/** 仅由原始题库数据构建的中间层：题库内容分包加载后构建一次，不随自定义题目变化重建 */
export interface BaseBank {
  tracks: NormalizedTrack[]
  questionIndex: IndexedQuestion[]
  /** 按 topic.id 分组的索引条目：增量合并时未受影响的领域直接整组复用 */
  topicEntries: Map<string, IndexedQuestion[]>
}

/** 课程规划约定：每个领域内按 基础→进阶→高级 排序（稳定排序，同难度保持原有顺序） */
const DIFFICULTY_ORDER: Record<string, number> = { basic: 0, intermediate: 1, advanced: 2 }

function normalizeFollowUps(inputs: FollowUpInput[]): FollowUp[] {
  return inputs.map((input) =>
    typeof input === 'string'
      ? { question: input, points: [] }
      : { question: input.question, points: input.points ?? [] },
  )
}

function normalizeQuestion(question: Question): NormalizedQuestion {
  return {
    ...question,
    followUps: question.followUps ? normalizeFollowUps(question.followUps) : [],
  }
}

function normalizeTrack(track: Track): NormalizedTrack {
  return {
    ...track,
    topics: track.topics.map((topic) => ({
      ...topic,
      questions: topic.questions
        .map(normalizeQuestion)
        .sort((a, b) => DIFFICULTY_ORDER[a.difficulty] - DIFFICULTY_ORDER[b.difficulty]),
    })),
  }
}

function customToNormalized(cq: CustomQuestion): NormalizedQuestion {
  return {
    id: cq.id,
    title: cq.title,
    difficulty: cq.difficulty,
    tags: cq.tags,
    points: cq.points,
    followUps: cq.followUps,
  }
}

function toIndexed(
  track: NormalizedTrack,
  topic: NormalizedTopic,
  question: NormalizedQuestion,
): IndexedQuestion {
  return {
    track,
    topic,
    question,
    haystack: [
      question.title,
      ...(question.tags ?? []),
      topic.name,
      track.name,
      ...question.points,
      ...question.followUps.flatMap((f) => [f.question, ...f.points]),
    ]
      .join('\n')
      .toLowerCase(),
  }
}

/** 原始题库 → 基础层：归一化 + 全量全文索引（全文拼接是重开销，只随数据加载执行一次） */
export function buildBaseBank(rawTracks: Track[]): BaseBank {
  const tracks = rawTracks.map(normalizeTrack)
  const questionIndex: IndexedQuestion[] = []
  const topicEntries = new Map<string, IndexedQuestion[]>()
  for (const track of tracks) {
    for (const topic of track.topics) {
      const entries = topic.questions.map((question) => toIndexed(track, topic, question))
      topicEntries.set(topic.id, entries)
      questionIndex.push(...entries)
    }
  }
  return { tracks, questionIndex, topicEntries }
}

/**
 * 基础层 + 自定义题目 → 全量题库。自定义题目增删改时重建此层是轻量操作：
 * 只有受影响领域的条目重新计算 haystack，其余条目复用基础层对象（引用不变，
 * 也让下游 memo/依赖比较保持稳定）。
 */
export function mergeCustomBank(base: BaseBank, customQuestions: CustomQuestion[]): Bank {
  if (customQuestions.length === 0) {
    const { tracks, questionIndex } = base
    return {
      tracks,
      questionIndex,
      questionById: new Map(questionIndex.map((r) => [r.question.id, r])),
      totalTopicCount: tracks.reduce((n, t) => n + t.topics.length, 0),
      totalQuestionCount: questionIndex.length,
    }
  }

  // 按 trackId/topicId 归组自定义题目（指向不存在的方向/领域时安全忽略）
  const extras = new Map<string, NormalizedQuestion[]>()
  for (const cq of customQuestions) {
    const key = `${cq.trackId}/${cq.topicId}`
    const list = extras.get(key) ?? []
    list.push(customToNormalized(cq))
    extras.set(key, list)
  }
  const customIds = new Set(customQuestions.map((q) => q.id))

  // base.tracks.map 保持顺序，tracks[i] 与 base.tracks[i] 一一对应，可直接比对引用
  const tracks: NormalizedTrack[] = base.tracks.map((track) => {
    if (!track.topics.some((topic) => extras.has(`${track.id}/${topic.id}`))) return track
    const topics: NormalizedTopic[] = track.topics.map((topic) => {
      const extra = extras.get(`${track.id}/${topic.id}`)
      return extra ? { ...topic, questions: [...topic.questions, ...extra] } : topic
    })
    return { ...track, topics }
  })

  // 复用基础层条目，仅在所属方向/领域对象被替换时克隆换引用；自定义题重算全文匹配串
  const questionIndex: IndexedQuestion[] = []
  tracks.forEach((track, i) => {
    const trackChanged = track !== base.tracks[i]
    for (const topic of track.topics) {
      const extra = extras.get(`${track.id}/${topic.id}`)
      const baseEntries = base.topicEntries.get(topic.id) ?? []
      if (!extra && !trackChanged) {
        questionIndex.push(...baseEntries)
        continue
      }
      if (!extra) {
        for (const entry of baseEntries) questionIndex.push({ ...entry, track })
        continue
      }
      for (const question of topic.questions) {
        if (customIds.has(question.id)) {
          questionIndex.push(toIndexed(track, topic, question))
        } else {
          const entry = baseEntries.find((e) => e.question.id === question.id)
          questionIndex.push(entry ? { ...entry, track, topic } : toIndexed(track, topic, question))
        }
      }
    }
  })

  return {
    tracks,
    questionIndex,
    questionById: new Map(questionIndex.map((r) => [r.question.id, r])),
    totalTopicCount: tracks.reduce((n, t) => n + t.topics.length, 0),
    totalQuestionCount: questionIndex.length,
  }
}

/** 原始题库数据 + 本地自定义题目 → 全站可用的合并题库（数据加载与自定义变化时重建） */
export function buildBank(rawTracks: Track[], customQuestions: CustomQuestion[]): Bank {
  return mergeCustomBank(buildBaseBank(rawTracks), customQuestions)
}
