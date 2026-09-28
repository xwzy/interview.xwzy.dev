import { describe, expect, it } from 'vitest'
import { BACKUP_VERSION, sanitizeBackup } from './backup'

describe('sanitizeBackup', () => {
  it('清洗合法备份：剔除畸形条目、收敛字段类型、迁移旧版方向归属', () => {
    const result = sanitizeBackup({
      version: BACKUP_VERSION,
      exportedAt: '2026-01-01T00:00:00.000Z',
      mastery: ['q-a', 42, null],
      verdicts: { 'q-1': 'pass', 'q-2': 'bogus', 3: 'fail' },
      sessions: [
        {
          id: 's1',
          candidate: '张三',
          createdAt: '2026-01-01T00:00:00.000Z',
          items: [
            { questionId: 'q-1', verdict: 'fail', note: '答不上', duration: 12.7 },
            { verdict: 'pass' }, // 缺 questionId，整条剔除
            { questionId: 'q-2', verdict: 'bogus', duration: -5 }, // 非法评分收敛为 null，非法用时丢弃
          ],
        },
        'not-a-record',
      ],
      customQuestions: [
        {
          id: 'custom-1',
          trackId: 'qa-ops', // 旧版方向：按领域前缀迁移到 ops
          topicId: 'ops-linux',
          title: '自定义题',
          difficulty: 'weird', // 非法难度收敛为 basic
          tags: ['linux', 1],
          points: ['p1', 2],
          followUps: [{ question: '追问', points: ['fp'] }, { bad: true }],
          createdAt: '2026-01-01T00:00:00.000Z',
        },
        { id: 'custom-2', trackId: 'qa-ops', topicId: 'qa-basics', title: 't', points: ['p'] }, // 迁移到 qa
        { title: '缺 id 的直接丢弃' },
      ],
      favorites: ['q-9', null],
    })

    expect(result).not.toBeNull()
    expect(result!.mastery).toEqual(['q-a'])
    // 数字键经 Object.entries 会转成字符串 '3'——无对应题目 id，属无害数据，按设计保留
    expect(result!.verdicts).toEqual({ 'q-1': 'pass', 3: 'fail' })
    expect(result!.sessions).toHaveLength(1)
    // 用时在导出/导入往返中保留（历史总用时、面试小结都依赖它）；非法值收敛为缺省
    expect(result!.sessions[0]!.items[0]).toMatchObject({ questionId: 'q-1', duration: 12 })
    expect(result!.sessions[0]!.items[1]).toMatchObject({ questionId: 'q-2', duration: undefined })
    expect(result!.sessions[0]!.items).toEqual([
      { questionId: 'q-1', verdict: 'fail', note: '答不上', duration: 12 },
      { questionId: 'q-2', verdict: null, note: '' },
    ])
    expect(result!.customQuestions).toHaveLength(2)
    expect(result!.customQuestions[0]).toMatchObject({ trackId: 'ops', difficulty: 'basic', tags: ['linux'], points: ['p1'] })
    expect(result!.customQuestions[0]!.followUps).toEqual([{ question: '追问', points: ['fp'] }])
    expect(result!.customQuestions[1]!.trackId).toBe('qa')
    expect(result!.favorites).toEqual(['q-9'])
  })

  it('结构不符时整体拒绝（返回 null）', () => {
    expect(sanitizeBackup(null)).toBeNull()
    expect(sanitizeBackup('json')).toBeNull()
    expect(sanitizeBackup({ version: 999, mastery: [], verdicts: {}, sessions: [] })).toBeNull()
    expect(sanitizeBackup({ version: BACKUP_VERSION, verdicts: {}, sessions: [] })).toBeNull()
    expect(sanitizeBackup({ version: BACKUP_VERSION, mastery: [], sessions: [] })).toBeNull()
    expect(sanitizeBackup({ version: BACKUP_VERSION, mastery: [], verdicts: {} })).toBeNull()
  })

  it('缺省字段有安全默认值', () => {
    const result = sanitizeBackup({
      version: BACKUP_VERSION,
      mastery: [],
      verdicts: {},
      sessions: [],
    })
    expect(result).not.toBeNull()
    expect(result!.customQuestions).toEqual([])
    expect(result!.favorites).toEqual([])
    expect(typeof result!.exportedAt).toBe('string')
  })
})
