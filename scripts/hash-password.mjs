#!/usr/bin/env node
/**
 * 生成访问口令的 PBKDF2 校验常量（替换 src/context/AuthContext.tsx 里的 CREDENTIALS）：
 *   PBKDF2-HMAC-SHA256 · 600000 轮 · 16 字节随机盐 · 256 位派生
 *
 * 用法：node scripts/hash-password.mjs
 * 输入的密码只在本机内存中用于计算，不落盘、不回显之外保存。
 * 生成后把输出的 CREDENTIALS 行粘贴进 AuthContext 即完成升级；
 * 旧设备登录态（存的是旧 sha256）会失效一次，需重新输入密码。
 */
import { pbkdf2Sync, randomBytes } from 'node:crypto'
import { createInterface } from 'node:readline/promises'
import { stdin, stdout } from 'node:process'

const ITERATIONS = 600_000

const rl = createInterface({ input: stdin, output: stdout })
const password = await rl.question('输入访问密码: ')
rl.close()

if (!password) {
  console.error('[hash-password] 密码不能为空')
  process.exit(1)
}

const salt = randomBytes(16)
const hash = pbkdf2Sync(password, salt, ITERATIONS, 32, 'sha256')
const constant = `pbkdf2:${ITERATIONS}$${salt.toString('hex')}$${hash.toString('hex')}`

console.log('\n生成成功。把 src/context/AuthContext.tsx 里的这一行替换为：\n')
console.log(`const CREDENTIALS = '${constant}'`)
console.log('\n说明：')
console.log('- 公开 bundle 中将不再包含密码的 SHA-256 快哈希，离线爆破成本大幅上升')
console.log('- 已登录的旧设备会话失效一次，需重新输入密码')
console.log('- 门禁仍是客户端轻量防护，不是安全边界（见 README）')
