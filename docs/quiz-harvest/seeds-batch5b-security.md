# 批 5b 收割种子存档（网络安全与密码学 · 新领域）

> 来源：现代密码学（试卷含答案 3 份 + 课件/复习 4 份 + 作业 4 份）+ 信息安全与密码（课件 8 份 + 期末卷含答案 + 例题），2026-09-29 收割，40 条种子。
> 状态：✅ 已落地（network.ts 新增 net-security 领域，10 题）

## ✅ 新题（10，领域：net-security）

- net-sec-principles（basic）：Kerckhoffs 原则 + CIAA 四要素与攻防不对称 + 攻击模型分级（种子 1/19/20 合并）
- net-sec-block-cipher-modes（basic）：ECB 危害 + CBC/CTR 选型 + IV/nonce 红线 + 填充预言（种子 3/4）
- net-sec-password-storage（basic）：加盐三目的（NOT performance 原题）+ 慢哈希 bcrypt + 彩虹表（种子 9）
- net-sec-hash-mac-signature（intermediate）：HMAC vs 签名（不可否认性来源）+ HMAC 结构防长度扩展 + hash-then-sign（种子 10/11）
- net-sec-publickey-math（intermediate）：RSA 数学（p=13,q=7,e=5 原题）+ DH 交换与中间人 + 能力矩阵（DH 不能加密原题）+ ECC（种子 12/13/14/25）
- net-sec-kerberos（intermediate）：两票流程 + 时间戳依赖 + 与 JWT 对照追问（种子 18）
- net-sec-access-control（intermediate）：RBAC 角色 vs 组（原题）+ BLP/Biba 镜像规则 + 授权级联回收追问（种子 21/36/35）
- net-sec-side-channel（advanced）：Flush+Reload（4096 对齐细节原题）+ Meltdown/Spectre 区分（边界检查防不住原题）+ 恒定时间（种子 15/16）
- net-scene-nonce-reuse（advanced 场景题）：GCM IV 重用事故定性与处置 + 三算法选型追问（种子 5 扩展）
- （新增）cs→net-sec-hash-properties 内容并入 hash-mac-signature 与 password-storage：三性质难度排序 + 生日攻击 + MD5/SHA-1 破坏史（种子 6/7/8/39）

## 与既有题的分工

- TLS 握手/证书链/ECDHE 前向安全 → net-https-handshake、net-scene-tls-certificate（未动）
- 重放/签名应用、JWT/OAuth/SSO、零信任 → backend 方向（未动）；Kerberos 题与 be-general-sso 注明分工（协议机制 vs 应用流程）
- DDoS/VPN/防火墙 → net-engineering 领域（未动）

## ❌ 丢弃/留待

- Feistel vs SPN、AES GF(2⁸) 域乘法手算、差分分析、DES 互补性、LFSR、ElGamal、3DES 中间相遇 —— 密码学专业课深度，通用面试价值中低（部分要点已穿插进工作模式/公钥题正文）
- 古典密码（维吉尼亚/仿射/Enigma）—— CTF 向，不入库
- OTP、隐通道、TPM、Chinese Wall/polyinstantiation、grant 级联（已并入 access-control 追问）、FAR/FRR —— 冷门或过于专门
- 挑战-应答并行会话攻击、公钥两大误解（要点已并入 publickey-math）、国密 SM（提一句在作业背景，无独立成题价值）
- 未找到材料：证书透明度、前向安全、后量子密码（课件未覆盖；前向安全在 TLS 题已点到）
