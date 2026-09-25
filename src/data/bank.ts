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

/** 原始题库数据 + 本地自定义题目 → 全站可用的合并题库（数据加载与自定义变化时重建） */
export function buildBank(rawTracks: Track[], customQuestions: CustomQuestion[]): Bank {
  // 按 trackId/topicId 归组自定义题目
  const extras = new Map<string, NormalizedQuestion[]>()
  for (const cq of customQuestions) {
    const key = `${cq.trackId}/${cq.topicId}`
    const list = extras.get(key) ?? []
    list.push(customToNormalized(cq))
    extras.set(key, list)
  }

  const tracks: NormalizedTrack[] = rawTracks.map((raw) => {
    const track = normalizeTrack(raw)
    if (!track.topics.some((topic) => extras.has(`${track.id}/${topic.id}`))) return track
    const topics: NormalizedTopic[] = track.topics.map((topic) => {
      const extra = extras.get(`${track.id}/${topic.id}`)
      return extra ? { ...topic, questions: [...topic.questions, ...extra] } : topic
    })
    return { ...track, topics }
  })

  const questionIndex: IndexedQuestion[] = tracks.flatMap((track) =>
    track.topics.flatMap((topic) =>
      topic.questions.map((question) => ({
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
      })),
    ),
  )

  const questionById = new Map(questionIndex.map((r) => [r.question.id, r]))

  return {
    tracks,
    questionIndex,
    questionById,
    totalTopicCount: tracks.reduce((n, t) => n + t.topics.length, 0),
    totalQuestionCount: questionIndex.length,
  }
}
