import type { CustomQuestion, MetaTrack } from '../types'

/** 轻量题库：方向/领域/题目 id 与难度（不含要点、追问内容），同步可用 */
export interface MetaBank {
  tracks: MetaTrack[]
  /** 全站题目 id（含自定义题目），供掌握进度统计 */
  questionIds: string[]
  /** 扁平化的"随机一题"入口 */
  entries: Array<{ trackId: string; topicId: string; questionId: string }>
  totalTopicCount: number
  totalQuestionCount: number
}

/** 元数据 + 本地自定义题目 → 首页/方向页即时可用的轻量题库（纯函数，自定义变化时重建） */
export function buildMetaBank(meta: MetaTrack[], customQuestions: CustomQuestion[]): MetaBank {
  // 拷贝 topics/questions 数组：自定义题目要追加进去，不能改动模块级元数据
  const tracks: MetaTrack[] = meta.map((t) => ({
    ...t,
    topics: t.topics.map((tp) => ({ ...tp, questions: [...tp.questions] })),
  }))
  for (const cq of customQuestions) {
    tracks
      .find((t) => t.id === cq.trackId)
      ?.topics.find((tp) => tp.id === cq.topicId)
      ?.questions.push({ id: cq.id, difficulty: cq.difficulty })
  }

  const questionIds = tracks.flatMap((t) => t.topics.flatMap((tp) => tp.questions.map((q) => q.id)))
  const entries = tracks.flatMap((t) =>
    t.topics.flatMap((tp) =>
      tp.questions.map((q) => ({ trackId: t.id, topicId: tp.id, questionId: q.id })),
    ),
  )
  return {
    tracks,
    questionIds,
    entries,
    totalTopicCount: tracks.reduce((n, t) => n + t.topics.length, 0),
    totalQuestionCount: questionIds.length,
  }
}
