import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { LS_KEYS } from './storageKeys'

/**
 * index.html 的内联主题脚本无法引用 TS 常量，键名是手工同步的
 * （见 storageKeys.ts 注释）。此测试防止两边悄悄失配。
 */
describe('storageKeys 与 index.html 内联脚本一致', () => {
  it('index.html 以 LS_KEYS.theme 字面量读取主题', () => {
    const html = readFileSync(new URL('../../index.html', import.meta.url), 'utf8')
    expect(html).toContain(`localStorage.getItem('${LS_KEYS.theme}')`)
  })
})
