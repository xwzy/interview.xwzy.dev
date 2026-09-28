import { describe, expect, it } from 'vitest'
import { trackMeta } from './trackMeta.generated'
import { loadAllTracks } from './trackLoaders'

/**
 * 首页/方向页靠内联元数据即时渲染，元数据必须与 src/data 真实题库保持一致。
 * 漂移（改了数据忘重新生成）时此测试失败：运行 `npm run gen:meta` 并提交产物。
 */
describe('trackMeta.generated 与题库数据同步', () => {
  it('元数据（方向/领域结构、题目 id 与难度）与实际数据一致', async () => {
    const tracks = await loadAllTracks()
    const expected = tracks.map((t) => ({
      id: t.id,
      name: t.name,
      icon: t.icon,
      tagline: t.tagline,
      description: t.description,
      color: t.color,
      topics: t.topics.map((tp) => ({
        id: tp.id,
        name: tp.name,
        description: tp.description,
        questions: tp.questions.map((q) => ({ id: q.id, difficulty: q.difficulty })),
      })),
    }))
    expect(trackMeta, '元数据过期：请运行 npm run gen:meta 并提交 trackMeta.generated.ts').toEqual(
      expected,
    )
  })
})
