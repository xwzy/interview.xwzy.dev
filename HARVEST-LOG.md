# 题库扩充总账（HARVEST LOG）

> 本文件记录从参考资料库（`/Users/wzy/Desktop/thu-cs-parse/structured`，清华/浙大/北大/南大/中科大课程资料）
> 搬运转化为面试题的全部内容：每批的新增题、追问增强、主动丢弃项。
> **维护约定：每完成一批，同步更新本文件**（清单 + 状态），详细种子原文见 `docs/quiz-harvest/` 分批文件。
> 总方案见 `docs/quiz-expansion-plan.md`。

## 进度总览

| 批次 | 方向 | 落点 | 新题 | 追问增强 | 状态 | commit |
|---|---|---|---|---|---|---|
| 1 | 计算机组成原理 | computer-organization.ts 19→31 | 12 | 8 条 | ✅ 已推送 | 32250b1 |
| 2 | 操作系统 | os.ts 34→43 | 9 | 11 条 | ✅ 已推送 | 2087d5e |
| 3 | 计算机网络 | network.ts 41→46 | 5 | 7 条 | ✅ 已推送 | 95ba8b1 |
| 4 | 数据结构与算法 | cs-fundamentals.ts 21→24 | 3 | 12 条 | ✅ 已推送 | c0995d6 |
| 5a | 编译原理（新领域） | cs-fundamentals.ts 新增 cs-compiler | 11 | — | ✅ 已推送 | 80bcf08 |
| 5b | 网络安全与密码学（新领域） | network.ts 新增 net-security | 10 | — | ✅ 已推送 | 见 git log |
| 5c | 数学基础（新领域） | cs-fundamentals.ts | — | — | ⬜ 未开始 | — |
| 6 | 后端增厚（MySQL/C++/Java） | backend.ts | — | — | ⬜ 未开始 | — |
| 7 | AI / 机器学习 | ai.ts | — | — | ⬜ 未开始 | — |
| 8 | qa/大数据/移动端/运维扫尾 | 各文件 | — | — | ⬜ 未开始 | — |

题库总量：656（起点）→ **705**（当前）。真题改编题统一打 `tags: ['真题改编']`，可全局搜索筛选。

## 批 1 · 计算机组成原理（来源：组成原理 43 套试卷 + 清华 912）

**新题 12**（computer-organization.ts）：co-scene-overflow-float-edge（补码/浮点反直觉断言）、co-cpu-hardwire-microprogram（微程序 vs 硬布线）、co-cpu-pipeline-depth（流水线深度与主频）、co-cpu-precise-exception（精确异常）、co-cpu-add-instruction（新增指令设计）、co-mem-sram-dram（SRAM/DRAM+ECC）、co-mem-vm-vs-cache（虚存 vs Cache+包含性）、co-io-raid-levels（RAID 对比）、co-io-disk-access-time（磁盘访问时间）、co-io-control-methods（五种 IO 控制方式）、co-bus-arbitration（总线仲裁）、co-bus-interrupt-mask（中断屏蔽字）。

**追问 8 条**（→现有题）：co-data-float（IEEE754 编码设计+浮点五步）、co-cpu-instruction-cycle（可见寄存器）、co-mem-hierarchy-locality（循环交换命中率）、co-mem-cache-mapping（1024B 交替访问计算）、co-bus-dma（周期挪用+中断供需核算）、co-bus-interrupt（硬件隐指令边界）、co-cpu-risc-cisc / co-scene-ipc-cpi 各 1 条。

**丢弃**：阿姆达尔（体系结构已有）、分支预测状态机（归体系结构）、操作码编码/芯片扩展等笔试计算、海明码独立成题（并入 SRAM/DRAM 追问）、段页式（留 OS 批）。

## 批 2 · 操作系统（来源：清华 912 + OS 试卷 18 份/作业 5 份）

**新题 9**（os.ts）：os-sched-classic-algorithms（经典调度算法与饥饿）、os-sched-semaphore-impl（P/V 实现与管程）、os-sched-philosophers（哲学家就餐）、os-scene-readers-writers-variant（读写者变体与换课死锁）、os-mem-segmentation（分段 vs 分页）、os-io-file-allocation（文件物理分配三方式）、os-io-open-file-table（open 与两级文件表）、os-io-journaling-fsck（日志文件系统）、os-io-vfs（VFS 四大对象+overlayfs）。

**追问 11 条**：os-sched-deadlock（银行家+最少资源数）、os-mem-page-fault（Belady 反例）、os-io-inode（软硬链接引用计数·912 三年两考）、os-mem-page-table（PTE 64bit 重设计+反置页表）、os-process-context-switch-cost（switch_to 换栈）、os-mem-buddy-slab（addr XOR size）、os-mem-virtual-memory（局部性依赖）、os-mem-malloc（内外碎片）、os-io-page-cache-fsync（buffer vs cache）、os-sched-cas-atomic / os-io-zero-copy 各 1 条。

**丢弃**：RAID/磁盘调度（组成原理批已落）、僵尸孤儿/syscall 路径/fork（原有题已覆盖）、工作集量化、SPOOLing、TCB、Bernstein 条件。

## 批 3 · 计算机网络（来源：清华 912 + 网络试卷 17 份/作业 5 份）

**新题 5**（network.ts）：net-foundation-csmacd（CSMA/CD+64B 帧+ALOHA 追问）、net-tcp-gbn-sr（GBN/SR 窗口约束）、net-foundation-switch-stp（交换机自学习+STP+VLAN 追问）、net-foundation-nyquist-shannon（两定律+56K 猫追问）、net-engineering-token-bucket（令牌桶 vs 漏桶+分布式限流追问）。

**追问 7 条**：net-arp（逐跳 IP/MAC 变化·912 必考）、net-scene-mtu-blackhole（IP 分片字段）、net-foundation-igp（计数到无穷）、net-tcp-congestion（cwnd 演化表）、net-http-l4l7-lb（Host/SNI）、net-tcp-reliable（五类定时器）、net-foundation-csmacd（ALOHA 推导，随新题）。

**丢弃**：以太网 vs 802.11 定量、作弊网卡概率、锯齿吞吐、海明/CRC/成帧、CDMA、SNMP、虚电路、邮件/FTP、移动 IP、NAT 抓包题、Jacobson（已有 RTO 追问含公式）。

## 批 4 · 数据结构与算法（来源：清华 912 + DS 试卷/作业 45 条种子）

**新题 3**（cs-fundamentals.ts）：cs-algo-kmp（KMP+优势边界）、cs-algo-huffman（哈夫曼+交换论证）、cs-algo-mst（切分定理+Prim/Kruskal）。

**追问 12 条**：cs-algo-stack-queue（逆波兰式价值+栈混洗/卡特兰数）、cs-algo-hashmap（拉链 vs 开放定址）、cs-algo-sort-compare（基数排序稳定性+逆序对）、cs-algo-heap-topk（d 叉堆）、cs-algo-graph-bfs-dfs（DFS 四种边+两个最短路陷阱）、cs-algo-topo-sort（AOE 关键路径）、cs-algo-binary-tree-traversal（O(1) 祖先判断）、cs-algo-bst-handwrite（size 字段第 k 大）、cs-algo-union-find（树高界）、cs-algo-dp（贪心证明口径）、cs-algo-binary-search / cs-algo-massive-data 各 1 条。

**丢弃**：循环队列、稀疏矩阵转置、外部排序一族（置换选择/败者树/斐波那契分布）、树森林转换、n0=n2+1、希尔反推、跳表期望、停机问题、欧拉回路删边、并查集手工模拟。

## 批 5a · 编译原理新领域（来源：清华编译原理课件 12 份 + 试卷 14 份带答案）

**新题 11**（cs-fundamentals.ts 新领域 cs-compiler）：cs-compiler-re-cfg-boundary（RE/CFG 边界+Chomsky）、cs-compiler-lexer-dfa（词法三步流水线）、cs-compiler-ambiguity（二义性+悬空 else）、cs-compiler-ll1（LL(1) 判定+消左递归）、cs-compiler-lr-family（LR 四代+LALR 代价+句柄）、cs-compiler-ir-cfg（三地址码+基本块+数据流）、cs-compiler-stack-frame（栈帧+静态链/display+逃逸）、cs-compiler-param-passing（四种参数传递）、cs-compiler-gc-runtime（GC 四算法运行时视角）、cs-compiler-reg-alloc（图着色寄存器分配）、cs-scene-compiler-optimization（-O0/-O2 场景题）。

**分工**：cs-algo-compiler-basics（六阶段/AST/JIT/ReDoS）留在算法领域；JVM GC 在后端；链接加载在 OS；AI 编译器 IR 在 ai-infra——均未动。

**丢弃**：符号表、backpatch、YACC $ 编号、lex 文件结构、tiling/Maximal Munch、支配节点、FORTRAN 静态环境、C 变参、右递归栈增长（并入 LR 正文）、静态/动态作用域（并入栈帧追问）。

## 批 5b · 网络安全与密码学 ✅（来源：现代密码学 + 信息安全与密码，40 条种子）

**新题 10**（network.ts 新领域 net-security）：net-sec-principles（Kerckhoffs+CIAA+攻击模型）、net-sec-block-cipher-modes（ECB/CBC/CTR+IV 红线）、net-sec-password-storage（加盐慢哈希）、net-sec-hash-mac-signature（HMAC vs 签名+hash-then-sign）、net-sec-publickey-math（RSA/DH/ECC+能力矩阵+中间人）、net-sec-kerberos（两票+时间依赖）、net-sec-access-control（RBAC+BLP/Biba）、net-sec-side-channel（Flush+Reload+Meltdown/Spectre）、net-scene-nonce-reuse（GCM IV 重用场景题）。

**分工**：TLS/证书在 HTTP 领域、认证应用在后端、DDoS/VPN 在 net-engineering——均未动。丢弃：Feistel/域乘法手算/差分分析/古典密码/OTP/TPM 等。详见 docs/quiz-harvest/seeds-batch5b-security.md。

## 批 5c · 数学基础（未开始）

来源：概率论 127 + 线代 251 + 离散 154 + 运筹 82。规划领域：cs-fundamentals 新增 cs-math（概率统计/线代/凸优化，ML 岗标配）。
