import { describe, expect, it } from 'vitest'
import { loadAllTracks } from './trackLoaders'
import { buildBank } from './bank'

/** 各方向允许的题目 id 前缀 */
const allowedPrefixes: Record<string, string[]> = {
  backend: ['be-'],
  frontend: ['fe-'],
  'cs-fundamentals': ['cs-'],
  os: ['os-'],
  'computer-organization': ['co-'],
  'system-design': ['sd-'],
  'big-data': ['bd-'],
  mobile: ['mo-'],
  ai: ['ai-'],
  qa: ['qa-'],
  ops: ['ops-'],
  career: ['career-'],
}

const rank: Record<string, number> = { basic: 0, intermediate: 1, advanced: 2 }

/** 内容完整性约束：防止未来扩充题库时引入脏数据 */
describe('题库内容完整性', () => {
  it('全部 12 个方向分包加载成功且结构完整', async () => {
    const rawTracks = await loadAllTracks()
    expect(rawTracks).toHaveLength(12)
    const bank = buildBank(rawTracks, [])
    expect(bank.tracks).toHaveLength(12)
    expect(bank.totalQuestionCount).toBeGreaterThan(300)
    expect(bank.questionById.size).toBe(bank.totalQuestionCount)
  })

  it('题目 id 全站唯一', async () => {
    const bank = buildBank(await loadAllTracks(), [])
    const ids = bank.tracks.flatMap((t) => t.topics.flatMap((tp) => tp.questions.map((q) => q.id)))
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('题目 id 使用所在方向允许的前缀', async () => {
    const bank = buildBank(await loadAllTracks(), [])
    for (const track of bank.tracks) {
      const prefixes = allowedPrefixes[track.id]
      expect(prefixes, `方向 ${track.id} 缺少前缀配置`).toBeTruthy()
      for (const topic of track.topics) {
        for (const q of topic.questions) {
          expect(
            prefixes.some((p) => q.id.startsWith(p)),
            `题目 ${q.id} 不匹配方向 ${track.id} 的前缀 ${prefixes.join('/')}`,
          ).toBe(true)
        }
      }
    }
  })

  it('每道题至少有一条参考要点，且要点与追问文本非空', async () => {
    const bank = buildBank(await loadAllTracks(), [])
    for (const track of bank.tracks) {
      for (const topic of track.topics) {
        for (const q of topic.questions) {
          expect(q.points.length, `题目 ${q.id} 没有参考要点`).toBeGreaterThanOrEqual(1)
          for (const p of q.points) {
            expect(p.trim().length, `题目 ${q.id} 存在空要点`).toBeGreaterThan(0)
          }
          for (const f of q.followUps) {
            expect(f.question.trim().length, `题目 ${q.id} 存在空追问`).toBeGreaterThan(0)
          }
        }
      }
    }
  })

  it('延伸资料链接必须为 https', async () => {
    const bank = buildBank(await loadAllTracks(), [])
    for (const track of bank.tracks) {
      for (const topic of track.topics) {
        for (const ref of topic.references ?? []) {
          expect(ref.url.startsWith('https://'), `领域 ${topic.id} 存在非 https 链接`).toBe(true)
        }
      }
    }
  })

  it('每个领域内题目按 基础→进阶→高级 排序', async () => {
    const bank = buildBank(await loadAllTracks(), [])
    for (const track of bank.tracks) {
      for (const topic of track.topics) {
        const ranks = topic.questions.map((q) => rank[q.difficulty])
        expect(ranks, `领域 ${track.id}/${topic.id} 难度未升序`).toEqual([...ranks].sort())
      }
    }
  })

  it('题目标题跨方向不重复（防止去重后回潮）', async () => {
    const bank = buildBank(await loadAllTracks(), [])
    // 归一化：去空白/标点/符号、转小写，让「手写 LRU 缓存」与「手写LRU缓存！」判等
    const normalize = (t: string) => t.toLowerCase().replace(/[\s\p{P}\p{S}]+/gu, '')
    const seen = new Map<string, string>()
    for (const track of bank.tracks) {
      for (const topic of track.topics) {
        for (const q of topic.questions) {
          const key = normalize(q.title)
          const prev = seen.get(key)
          expect(
            prev,
            `题目标题重复：「${q.title}」（${track.id}/${q.id} 与 ${prev}）——同一主题应差异化定位或只保留一处`,
          ).toBeUndefined()
          seen.set(key, `${track.id}/${q.id}`)
        }
      }
    }
  })
})
