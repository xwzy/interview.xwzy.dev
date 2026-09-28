import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { buildBank } from './bank'
import { loadAllTracks } from './trackLoaders'

const repoRoot = new URL('../../', import.meta.url).pathname

/**
 * 首页 og 描述与 README 中的题量/追问统计以前是手工同步的，历史上已漂移过（385 vs 651）。
 * 这里把文档里的数字锁到真实题库上：加题后测试会失败，提示同步 index.html 与 README。
 */
describe('文档统计与题库一致', () => {
  it('index.html og:description 与 README 的统计数字与实际题库一致', async () => {
    const bank = buildBank(await loadAllTracks(), [])
    const total = bank.totalQuestionCount
    const followUpSteps = bank.questionIndex.reduce((n, r) => n + r.question.followUps.length, 0)
    const withFollowUps = bank.questionIndex.filter((r) => r.question.followUps.length > 0).length
    const pct = Math.round((withFollowUps / total) * 100)

    const indexHtml = readFileSync(`${repoRoot}index.html`, 'utf8')
    const readme = readFileSync(`${repoRoot}README.md`, 'utf8')

    const og = indexHtml.match(/(\d+) 道深度面试题/)
    expect(og, 'index.html 应包含「N 道深度面试题」的 og:description').toBeTruthy()
    expect(
      Number(og![1]),
      `index.html og:description 的题数已过期（实际 ${total} 题），请同步`,
    ).toBe(total)

    const readmeStats = readme.match(/全站 (\d+) 题中 (\d+)% 配有层层递进的追问链（共 (\d+) 步）/)
    expect(
      readmeStats,
      'README 应包含「全站 N 题中 N% 配有层层递进的追问链（共 N 步）」一句',
    ).toBeTruthy()
    expect(Number(readmeStats![1]), `README 题数已过期（实际 ${total} 题），请同步`).toBe(total)
    expect(
      Number(readmeStats![2]),
      `README 追问链覆盖率已过期（实际 ${pct}%），请同步`,
    ).toBe(pct)
    expect(
      Number(readmeStats![3]),
      `README 追问步数已过期（实际 ${followUpSteps} 步），请同步`,
    ).toBe(followUpSteps)
  })
})
