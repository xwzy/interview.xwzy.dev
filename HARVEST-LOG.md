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
| 5c | 数学基础（新领域） | cs-fundamentals.ts 新增 cs-math | 10 | — | ✅ 已推送 | 见 git log |
| 6 | 后端增厚（C++/MySQL/Java/SQL） | backend.ts + cs-db | 12 | 12 条 | ✅ 已推送 | 见 git log |
| 7 | AI / 机器学习 | ai.ts | 7 | 9 条 | ✅ 已推送 | 见 git log |
| 8 | qa 增厚（软件工程试卷） | qa.ts + backend 追问 | 5 | 2 条 | ✅ 已推送 | 见 git log |
| 9 | 语料缺口补采（B+树计算/矩阵论/ML系统设计） | cs-fund/ai | 3 | 2 条 | ✅ 已推送 | 见 git log |
| 10 | 计算机体系结构增厚 | computer-architecture.ts | 4 | 6 条 | ✅ 已推送 | 见 git log |
| 11 | 二期·数据库深挖 | backend.ts + cs-db | 1 | 4 条 | ✅ 已完成 | 见 git log |
| 12 | 二期·计算机系统/CSAPP 补强 | network.ts + os.ts + computer-organization.ts | 1 | 6 条 | ✅ 已完成 | 见 git log |
| 13 | 二期·计算机视觉新领域 | ai.ts 新增 ai-cv | 10 | 10 条（含新题内） | ✅ 已完成 | 见 git log |
| 14 | 二期·存量优化 pass（os/co/ca） | os.ts + computer-organization.ts + computer-architecture.ts | 0 | 44 条 | ✅ 已完成 | 见 git log |
| 15 | 二期·全库事实审查 | 全库 7 题 | 0 | 修复 14 处 | ✅ 已完成 | 见 git log |
| 16 | 二期·ai-cv 第二批（DIP/3D DL/计算摄影） | ai.ts ai-cv | 8 | 8 条（含新题内） | ✅ 已完成 | 见 git log |
| 17 | 二期·ai-cv 第三批（NeRF/MVS/单目深度） | ai.ts ai-cv | 5 | 5 条（含新题内） | ✅ 已完成 | 见 git log |
| 18 | 二期·qa 存量增强（软工试卷剩余语料） | qa.ts | 0 | 6 条 | ✅ 已完成 | 见 git log |
| 19 | 二期·第二轮事实审查（批 16~18 新增内容） | ai.ts + qa.ts + backend.ts | 0 | 修复 4 处 | ✅ 已完成 | 见 git log |
| 20 | 三期·核心方向第二轮事实审查（backend/frontend 全量） | backend.ts + frontend.ts | 0 | 修复 10 处 | ✅ 已完成 | 见 git log |
| 21 | 三期·核心方向第二轮事实审查（network/os/cs-fundamentals 全量） | network.ts + os.ts + cs-fundamentals.ts | 0 | 修复 11 处 | ✅ 已完成 | 见 git log |
| 22 | 三期·剩余方向第二轮事实审查（system-design/co/ca/mobile/big-data/ops/career 全量） | 7 个数据文件 | 0 | 修复 11 处 | ✅ 已完成 | 见 git log |
| 23 | 四期·新方向开荒（音视频开发 / 嵌入式与物联网） | audio-video.ts + embedded.ts（新建） | 42 | 78 条（含新题内） | ✅ 已完成 | 见 git log |
| 24 | 四期·新方向开荒（游戏开发 / 信息安全） | game.ts + security.ts（新建） | 37 | 37 条（含新题内） | ✅ 已完成 | 见 git log |
| 25 | 四期·新方向事实审查 + career 衔接题 | 四个新数据文件全量 + career.ts | 1 | 修复 8 处 | ✅ 已完成 | 见 git log |
| 26 | 四期·存量增厚（大数据 +6 / 移动端 +6） | big-data.ts + mobile.ts | 12 | 13 条（含新题内） | ✅ 已完成 | 见 git log |
| 27 | 四期·存量增厚（qa +4 / ops +4） | qa.ts + ops.ts | 8 | 8 条（含新题内） | ✅ 已完成 | 见 git log |
| 28 | 四期·批 26~27 新题事实审查 | big-data/mobile/qa/ops 四文件新题 | 0 | 修复 3 处 | ✅ 已完成 | 见 git log |

题库总量：656（起点）→ **870**（当前）。真题改编题统一打 `tags: ['真题改编']`，可全局搜索筛选。
二期方案见 `docs/quiz-expansion-plan-v2.md`（批号自 11 起续编）。

> 批 8 范围说明：原计划的"大数据/移动端/运维各 +3~4"在参考库中无对口语料（无对应课程材料），如实跳过；批 8 聚焦有真实试卷支撑的 qa 方向。

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

## 批 5c · 数学基础 ✅（来源：概率统计 13 份 + 线代 5 份 + 运筹 4 份，42 条种子）

**新题 10**（cs-fundamentals.ts 新领域 cs-math）：cs-math-bayes（贝叶斯+基础率谬误）、cs-math-expectation-covariance（独立 vs 不相关）、cs-math-distributions（常见分布+无记忆性）、cs-math-lln-clt（LLN vs CLT+√n 尺度）、cs-math-estimation（三标准+MSE 分解）、cs-math-hypothesis-testing（p 值+两类错误+A/B 内核）、cs-math-linear-geometry（秩/特征值/谱定理/正定）、cs-math-projection-least-squares（投影+最小二乘几何）、cs-math-convex-optimization（凸性+鞍点+KKT 影子价格）、cs-math-multivariate-normal（边缘 vs 联合+马氏距离）。

**分工**：ML 应用层数学（交叉熵/偏差方差/优化器/PCA）在 ai.ts；随机算法在 cs-algo-random——正文互相注明。丢弃：χ²、MLE 相合证明、合同惯性、古典概型等应试细节。详见 docs/quiz-harvest/seeds-batch5c-math.md。

## 批 6 · 后端增厚 ✅（来源：C/C++ 试卷 40 条 + 数据库课程 30 条 + Java 试卷 10 条）

**新题 12**：C++ 4（be-cpp-stl-internals / be-cpp-copy-control / be-cpp-binding-slicing / be-cpp-object-layout——STL 值语义与迭代器、拷贝控制与 RVO、对象切割与动态绑定、vptr 对象布局）；MySQL 3（be-mysql-query-execution / be-mysql-serializability / be-mysql-crash-recovery——连接算法与代价估计、前趋图与 2PL、ARIES 三阶段）；Java 4（be-java-equals-hashcode / be-java-string / be-java-exception / be-java-object-lifecycle——equals 重载陷阱、常量池 intern、checked 边界、构造器多态陷阱）；SQL 语义 1（cs-fundamentals.ts 的 cs-db-sql-patterns——关系除法/分组语义/去嵌套）。

**追问 12 条**：stl（++it）、copy-control（explicit + 构造次数算例）、binding（构造期多态 C++/Java 对照）、object-layout（const 重载）、equals（Integer 缓存/包装 equals）、string（+= 与 StringBuilder）、exception（finally 覆盖返回值）、generics（List<?> 不可写）、synchronized-lock（wait/notify 归属+双对象死锁）、query-execution（Hash Join vs INL）、serializability（冲突 vs 视图可串行化）、crash-recovery（group commit）、cs-db-normalization（候选键求法+BCNF 分解原题）、cs-db-join（NULL 三值逻辑）。

**分工与丢弃**：B+ 树主干在组成原理/已有 MySQL 题；四大读现象在隔离级别题；内联宏/static 五层/grant-LIKE trivia 等网课细节丢弃。详见 docs/quiz-harvest/seeds-batch6-backend.md。

## 批 7 · AI/机器学习 ✅（来源：清华 ML 期末卷 + 浙大 Review 习题课 + 模式识别作业，36 条种子）

**新题 7**（ai.ts，ai-ml 领域）：ai-ml-generative-discriminative（生成 vs 判别+MAP/ML+正则即先验；追问拉普拉斯平滑、NB 边界）、ai-ml-em-gmm（三硬币隐变量+收敛性质判断组+GMM vs K-Means；追问 HMM/Baum-Welch）、ai-ml-ensembling-diversity（多样性来源+不稳定学习器原题；追问公平对比实验设计）、ai-ml-dimensionality-reduction（维数灾难+PCA/LDA/t-SNE+SVD；追问谱定理衔接）、ai-ml-knn-clustering（懒学习+距离加权+鲁棒性三连；追问十字 Voronoi 反例、距离度量）、ai-ml-model-evaluation（K 折权衡+LOOCV 100% 反例+时间序列划分；追问 VC 维）、ai-ml-decision-theory（最小错误率 vs 最小风险+损失矩阵平移阈值原题+Neyman-Pearson）。

**追问 9 条**（含新题内）：tree-ensembles ← 预/后剪枝（浙大原题）+"集成不剪枝"路线对照；其余见上。

**分工与丢弃**：ML 应用层 10 题与 LLM/深度学习领域未动；数学推导（公式乱码）与网课 trivia 丢弃；推荐系统设计题暂不入库。详见 docs/quiz-harvest/seeds-batch7-ml.md。

## 批 8 · qa 增厚 ✅（来源：软件工程试卷 12 份带答案 + 题库/复习资料，30 条种子）

**新题 5**（qa.ts，qa-basics 领域）：qa-basics-whitebox-coverage（白盒覆盖强弱链+清华选组算例+浙大复合条件 5/6 用例两年连考+圈复杂度三公式与基本路径四步法）、qa-basics-blackbox-complement（黑盒/白盒互补双向反例原题+方法归属+双经典误判+好用例四属性；追问三角形等价类/边界值完整算例）、qa-basics-vv-acceptance（V&V 句式+确认 vs 验收+stub/driver+集成策略；追问测试 vs 调试三法）、qa-basics-review-economics（FTR 形式谱系+缺陷放大模型 260 vs 70 原题计算+会议纪律；追问配置审计与基线变更 CCA/ECO）。

**追问 2 条**：qa-basics-risk-priority ← 测试不可穷尽 + Pareto 80/20（浙大原题）；backend SOLID 题 ← 高内聚低耦合分级（浙大复习资料）。

**范围说明**：大数据/移动端/运维在参考库中无对口语料，如实跳过；软件过程类（瀑布/敏捷/度量/McCall）非测试岗面试核心，丢弃。详见 docs/quiz-harvest/seeds-batch8-qa.md。

## 批 9 · 语料缺口补采 ✅（来源：912 B 树计算 + 数据结构 B+ 树带答案卷 + 浙大矩阵论卷 + 清华 ML 2007 设计题，15 条种子）

**新题 3**：cs-algo-btree-math（B+ 树容量/高度/IO 推导，912 两年背靠背原题 + 清华 ZB 高度题）、cs-math-svd-conditioning（条件数/det=奇异值积/酉不变/白化/Rayleigh 商，矩阵论原题组；追问 Tikhonov 正则化）、ai-scene-ml-system-design（BBS 个性化推荐四问式设计，清华 2007 原题；追问迁移短视频）。

**范围**：此前审查标注的三处语料缺口全部补齐。详见 docs/quiz-harvest/seeds-batch9-gaps.md。

## 批 10 · 计算机体系结构增厚 ✅（来源：体系结构课程 11 份带答案卷 + 作业 5 份，34 条种子）

**新题 4**：ca-quant-roofline（算术强度判瓶颈+循环融合 2× 原题）、ca-ooo-scheduling（记分板→Tomasulo→硬件投机三代演进+单保留站时序原题；追问重命名边界、RISC-V 异常寄存器）、ca-branch-predictor-structure（(m,n) 两级预测器 8K bits 容量原题+BTB 降 CPI；追问分支延迟槽）、ca-sync-primitives（CAS→test-and-test-and-set→LL/SC→队列锁；追问最小写屏障原题）。

**追问 6 条**：ca-coh-directory（目录消息流原题大题+写无效 vs 写更新）、ca-par-smt（藏延迟 6 线程 CMU 原题）、ca-pw-ecc-ras（软错误翻转 MESI 状态位清华 2014 原题）、ca-ilp-window（2 发射升 3 发射无加速原题）+ 新题内 2 条。

**分工**：乱序机制总览/分支预测代价/MESI 状态机/SMT 资源划分等既有题未动。详见 docs/quiz-harvest/seeds-batch10-arch.md。

## 批 11 · 二期·数据库深挖 ✅（来源：浙大数据库作业 hw9~hw14 + 清华近似查询作业）

**新题 1**（cs-fundamentals.ts，cs-db）：cs-db-approximate-matching（模糊/近似查询——q-gram 签名倒排 + 计数过滤定理 + Jaccard/编辑距离度量选择 + pg_trgm/ES fuzzy/ngram/向量检索对照；追问 PPJoin 过滤一族）。

**追问 4 条**：be-mysql-btree（页分裂偏右优化/删除借与合并/内部 ≥2 指针 vs 叶子 1 key/InnoDB 不激进合并）；be-mysql-index-failure（否定谓词：等值否定无区间、范围否定德摩根改写——hw11 15.6 原题）；be-mysql-query-execution（基数估计均匀假设/直方图分桶——hw11 16.20 原题/误差复合放大与 EXPLAIN ANALYZE）；be-mysql-serializability（可恢复→cascadeless→strict 三级阶梯——hw12 17.7 + hw13 18.18）。

**丢弃**：hw13 的 lock point/T34T35/increment 锁/strict 三理由、hw12 前趋图与 ACID、hw14 undo 反向/checkpoint/RecLSN（批 6 已按原题写进 serializability/crash-recovery 正文）；hw10 join 代价手算与混合 merge-join（笔试细节）；hw14 交互式事务恢复（边缘）；hw9 LSM 合并微调（cs-db-lsm 已覆盖，留批 4 复查）。

详见 docs/quiz-harvest/seeds-v2-batch1-db.md。


## 批 12 · 二期·计算机系统/CSAPP 补强 ✅（来源：北大 ICS 2013-2017 期中期末带答案试卷）

**新题 1**（network.ts，net-security）：net-sec-buffer-overflow（缓冲区溢出攻防——strcpy 覆盖返回地址原题、金丝雀汇编指纹、NX/ASLR/ROP 分层防御、金丝雀绕过面；追问绕过与组合防御）。

**追问 6 条**：os-compile-link-load（静态库链接顺序/强弱符号/链接器不看类型——2014/2015 期末原题）；os-process-fork（stdio 缓冲被 fork 复制→输出重复——2015 期末原题）；os-scene-signal-exit（pending 位合并 waitpid 循环 + alarm/pause 竞态与 sigsuspend 正解——2015 期末信号三连）；co-mem-vm-tlb（改页表后必须 invlpg——2015 期末第六题）；co-data-complement（浮点/整数恒等式判断 + 无溢出求均值——2016 期中原题）；os-mem-malloc（手写 malloc：边界标记/适配策略/分离空闲链表——试卷选择题改设计题）。

**丢弃**：TLB/Cache/Page 命中组合、dup 共享偏移、PV 顺序、线程共享变量、TCP 四元组连接数（现有题已覆盖）；cretXX/浮点填表/Y86/cache 画表/手工翻译等纯笔试题；结构体对齐（co-scene-alignment 已有）。

详见 docs/quiz-harvest/seeds-v2-batch2-csapp.md。


## 批 13 · 二期·计算机视觉新领域 ✅（来源：浙大 CV 课件 53 份）

**新领域 ai-cv**（ai.ts，10 题）：image-formation（针孔/畸变/景深）、camera-calibration（DLT/张正友——回忆卷原题）、filtering-sampling（混叠/Nyquist/金字塔带通）、edge-canny（双阈值——回忆卷原题）、features-harris-sift（λ1λ2 分类/不变性账本/gradient vs raw patch——考纲原题）、ransac（迭代次数公式——回忆卷原题，课件缺页按通用教材口径补）、optical-flow-lk（孔径问题/与 Harris 同源）、epipolar-sfm（E/F 矩阵/八点法/PnP/BA；追问 GD-Newton-GN-LM 谱系——课件原题重点）、stereo-depth（z=fB/d/基线权衡/结构光 vs LiDAR）、detection-segmentation（两阶段 vs 单阶段——课件原话/FCN-U-Net-Mask R-CNN 谱系；追问 anchor-free）。每题带 1 条追问。

**丢弃**：CNN 基础（ai-dl 已覆盖）；ImageNet 年份时间线等 trivia；课件未覆盖主题（Hough/Mean-Shift/Eigenface/ICP）记入留白不硬写。

**分包体量**：ai 分包 173KB，远低于 frontend 282KB 先例，未触发拆分条件。

详见 docs/quiz-harvest/seeds-v2-batch3-cv.md。


## 批 14 · 二期·存量优化 pass（第一批：os/co/ca）✅

**做法**：脚本筛出追问 ≤1 的浅题 365 道；对语料可对口的 os（19）/组成原理（20）/体系结构（9）三个方向，
agent 通读浙大 OS 内核系列课件（Linux内存管理/内核/文件系统/系统调用/进程管理 + ch5~ch9）、
组成原理（L2/L4/L6a/L9 + 复习题带答案）、体系结构（CAQA6e + 2021 Arch 课件系列），逐题拟 1 条追问并落地。

**落地 44 条**（os 18、co 18、ca 8），素材为课件硬细节：EXIT_ZOMBIE=16/clone flags/monitor DP test() 条件/
kswapd 页帧生命周期链/ext2 i_block[15]/sys_open 四步/WAL redo-undo 判定/VFS 四对象函数指针表（os）；
1e20 NaN 原例/load-use 必停一拍/RISC philosophy 人名表/IBM 360/91 不精确异常史/7200RPM 半圈 4.17ms/RAID1 20TB vs RAID5 2.5TB/菊花链不公平/中断屏蔽字原题（co）；
CPI 1.2@2ns 算例/Roofline 公式/1-bit 循环错 2 次/(m,n) 预测器与锦标赛/SIMD 限制清单与 MMX→AVX-512 年份线/E 态省 invalidate/NUMA 数据放置归软件/LL-SC 与缓存副本自旋（ca）。

**跳过**：os-io-iouring、co-bus-boot（语料无支撑）；co-data-char-encoding、co-data-bitwise（素材太薄、价值低）。

**范围说明**：sd/fe/be/ai/ops/mob 等方向的浅题在参考库中无对口语料（语料以基础课程为主），
按二期方案"无对口语料如实记录"处理，不硬补；如需继续增厚，走批 5 事实审查或后续工程经验型专题（不属语料搬运）。


## 批 15 · 二期·全库事实审查 ✅

**做法**：3 个审查 agent 分方向通读（os/co/ca、backend/network、cs-fund/ai），审查数值算例、机制描述、
版本归属、概念区分，宁可漏报不可误报；另用脚本核对 91 道 `真题改编` 标记与总账的溯源（8 处只记简称，已补全 id）。

**修复 14 处**（1 P0 + 13 P1）：
- **P0**：co-mem-tlb——"TLB 命中几十纳秒"量级方向性错误 → 1~几周期（亚纳秒级，与 L1 同量级）。
- **P1 ×13**：i_pipe 是 inode 字段非 task_struct 字段；MESI 追问"写命中走 RFO"应为写缺失；ARM "DSM" 应为 DSB；
  zombie 追问 pid 32768 补版本口径（4.15 前默认）；AVX 年份 2010 → 2008 规范/2011 硬件；
  os-mem-oom 的 2.4 时代三链模型改为现代 anon/file 双 LRU + mglu；ai-cv-ransac "本质矩阵 8 对是最小数目"
  → 最小采样本质 5/基本 7，8 是八点法；cs-db-approximate-matching "一次编辑破坏 k 个 q-gram" → 至多 q 个；
  ai-cv-camera-calibration "QR 分解" → RQ 分解（K 上三角）；ai-llm-decoding 截断/调温顺序 → 先调温后截断（主流实现口径）；
  be-redis-persistence 的 aof_rewrite_buf 补"7.0 MP-AOF 已移除"；net-scene-mtu-blackhole 以太网头 18B → 14B（8+8+20+14=50 对齐）；
  net-scene-long-fat-pipe 同句 RTT 40ms 笔误统一为 35ms 口径。

**审查通过确认**（抽样复算无误）：B+ 树 2000 万行算例、BDP/Mathis/香农算例、ReadView 判定规则、ARIES、
Raft 投票约束、GCM nonce、GBN/SR 窗口、Amdahl 2.47、Roofline、MESIF/MOESI 阵营、贝叶斯疾病检测数值、
B 树高度公式、VC 维谱系、张正友 ≥3 姿态、F=K⁻ᵀEK⁻¹ 方向等。

**二期收尾**：批 11~15 共 +12 题（745 → 757）/ +64 条追问（1107 → 1173）；方案 doc 见 quiz-expansion-plan-v2.md。


## 批 16 · 二期·ai-cv 第二批 ✅（来源：数字图像处理系列 + 3D DL + 计算摄影课件）

**新题 8**（ai-cv）：histogram-gamma（CDF 均衡/伽马 2.2 物理来源/sRGB 线性空间追问）、median-morphology（椒盐/开闭/顶帽）、frequency-domain（卷积定理/振铃机制/同态滤波）、segmentation-classic（Otsu 算例/分水岭/图割 Ncut/SLIC）、hough-transform（参数空间投票算例/随机 Hough/车道线追问）、stitching-homography（8 自由度/两情形/圆柱投影/鬼影接缝追问）、point-cloud（PointNet 对称函数/PointNet++ FPS）、hdr-deconvolution（曝光包围合并/Wiener/病态与先验）。

**丢弃**：采样混叠（第一批已覆盖）、链码/不变矩 trivia。**留白**：NeRF/MVSNet、SRGAN 超分（可作第三批）。
**分包**：ai 191KB，低于 frontend 282KB 先例。

详见 docs/quiz-harvest/seeds-v2-batch4-dip3d.md。


## 批 17 · 二期·ai-cv 第三批 ✅（来源：3D 深度学习 + 计算摄影课件）

**新题 5**（ai-cv）：monocular-depth-scale（尺度歧义/scale-invariant loss/MegaDepth 13 万对）、implicit-representation（mesh 不可微→隐式表示→NeRF→NeuS SDF，advanced）、deep-matching（SuperPoint heatmap+度量学习）、mvsnet（cost volume 框架与端到端化）、srgan-perceptual（PSNR 23.53 vs 21.15 的感知权衡原数值）。

**边界纪律**：课件未覆盖的细节（NeRF 位置编码、MVSNet 概率体、monodepth 自监督）不出题、追问只标（通用补充）给方向。至此参考库 CV 方向高价值语料收割完毕。

详见 docs/quiz-harvest/seeds-v2-batch5-3d.md。


## 批 18 · 二期·qa 存量增强 ✅（来源：软工试卷/题库剩余语料）

**追问 6 条**：qa-basics-case-design（三角形 216 等价类/NextDate 2-28 原题——等价类保广度边界值保深度）、
qa-basics-test-levels（自底向上要驱动不要桩/Alpha 有开发在场 Beta 无——1997/2003 原题）、
qa-basics-smoke-regression（smoke=rolling integration/回归随集成滚动）、qa-automation-roi
（"自动化免除回归"判断题 False/加权设备平台矩阵）、qa-automation-appium（手势三难原题）、
qa-sec-pentest-boundary（WebApp 可测要素 Authentication/Encryption/Penetration，Firewalls 不是）。

**跳过**（语料无对口，如实记录）：bug-lifecycle、po-pattern、platform、stability、ai-browser、ssrf、fuzzing、
supply-chain——试卷以 1997-2008 传统软工为主，自动化平台/现代安全主题无素材。

至此参考库对题库 15 个方向的可贡献语料全部收割完毕。


## 批 19 · 二期·第二轮事实审查 ✅（对象：批 16~18 新增内容）

2 个审查 agent：A 审 ai-cv 全部 23 题（公式/年份/机制逐项核对：E=T×R 方向、形态学对偶式、Otsu 公式、
RANSAC 最小采样、K 公式、F 数算例、论文年份等均无误）；B 审 qa.ts 全文 + backend/os 批 11/12/14 新增追问
（ReadView/cascadeless 定义、pid_max、-fno-common、sigsuspend、适配策略等核对无误）。

**修复 4 处 P1（无 P0）**：
- ai-cv-srgan-perceptual：SRGAN 的 content loss 写成像素 MSE——论文从提出之日起就是 **VGG 特征空间 MSE**（像素 MSE 是 SRResNet 的目标函数），追问的"后来才换 VGG"一并改正；
- ai-cv-mvsnet：代价体构建写成"相关性计算"（那是传统 plane-sweep photo-consistency 的说法）——MVSNet 用的是 **warp 后跨视图特征的方差**一致性；
- be-mysql-btree：页分裂奇偶规则写反——分裂时参与分配的是 L+1 个 key，**容量 L 为奇数才恰好均分**；
- qa-basics-test-levels：Alpha 场所误写为"用户实际环境"——经典口径是 **Alpha 在开发方场所**（与 vv-acceptance 题一致），Beta 才在用户环境。

**通过确认**：216 等价类内部一致、NextDate 算例、ReadView 判定、直方图 1000 桶、8×ncores arena、
sigsuspend 竞态、适配策略与边界标记等复核无误。

## 批 20 · 三期·核心方向第二轮事实审查 ✅（对象：backend.ts 131 题 + frontend.ts 145 题 全量）

2 个审查 agent 逐题逐条核对（机制/数字/版本/公式/命令行为），主会话逐条独立裁决后才落改——错误的"修正"比漏报危害大。

**修复 10 处（backend 4 + frontend 6）**：
- be-mysql-serializability（P1）：多粒度锁相容矩阵写错——**IS 与 IX 是相容的**（意向锁彼此不冲突正是设计目的），S 只与 IS/S 相容；原文"IS 与 IX 冲突"会教出错误矩阵；
- be-java-string（P2）：字符串常量池位置过时——**JDK 7 起在堆中**（同文件 JVM 内存一问的追问原就写对了，两处自相矛盾），元空间放的是类元数据；
- be-go-escape：sync.Pool"GC 时清空"过时——Go 1.13 起 **victim 缓存，两次 GC 未复用才丢弃**；
- be-mysql-crash-recovery：ARIES Redo 跳过条件 LSN < PageLSN → **≤**（等号那条是最后一条已应用记录）；
- fe-ts-type-vs-interface（P1）：同句自相矛盾笔误——"type 无法表达联合类型"，实际受限的是 **interface**；
- fe-vue-nexttick（P2）：把 Vue 2 的 MutationObserver→setTimeout 降级链安到 Vue 3 头上——**Vue 3 纯 Promise.resolve().then，无降级**（已对照 runtime-core scheduler 源码）；
- fe-react-hooks-principle（P2）：useEffect deps 浅比较发生在 **render 阶段**（决定是否挂入副作用链），非"提交阶段之后"；
- fe-js-gc-memory（P2）：WeakMap 键"必须是对象"过时——**ES2023 起非注册 Symbol 也可**；
- fe-browser-process-thread（P2）：unload 与 bfcache 因果写反——**注册 unload 会使页面被排除出 bfcache**（web.dev 明确口径），不存在"进了 bfcache 但 unload 不执行"的场景；
- fe-css-modern：Baseline Widely Available"两大引擎"→ **Chrome/Edge/Firefox/Safari 四大浏览器连续 30 个月**。

**通过确认**：2 个 agent 共列 40+ 条核对无误项（HashMap 树化、CHM 分段、G1 Region、Redis 集群位图、Kafka 幂等、事件循环钳制、Vue3.5 响应式重写、RSC 可序列化集合等），另 12 条存疑项经裁决未达上报标准（如 Shenandoah 用 Brooks 指针而非着色指针的并列表述、fsync always 策略区分等），保持不动——宁缺毋滥。

结论：核心两方向二审后错误密度约 10/276 题 ≈ 3.6%（一轮后为 14/全库），题库事实质量持续收敛。

## 批 21 · 三期·核心方向第二轮事实审查 ✅（对象：network.ts 61 题 + os.ts 43 题 + cs-fundamentals.ts 65 题 全量）

3 个审查 agent 逐题逐条核对，主会话逐条独立裁决后落改（错误的"修正"比漏报危害大）。

**修复 11 处（network 3 + os 4 + cs-fundamentals 4）**：
- net-scene-long-fat-pipe（P1 数值）：Mathis 反推 130Mbps 所需丢包率 0.01% → **0.001%**（吞吐 ∝ 1/√p，快 10 倍要丢包低 100 倍；与同句前半的自洽算术对齐）；
- net-scene-tls-certificate（P2）：证书有效期演进链跳步——行业上限为 **5 年 → 39 个月 → 825 天 → 398 天**（2026 起继续缩短），"90 天"是 ACME 生态签发期而非上限，照背会被判错；
- net-http-semantics：笔误 0-RTL → 0-RTT；
- os-process-thread-model（P2）：GMP 解绑时机——**enteresyscall 时 M 仍持 P（_Psyscall）**，sysmon 超时才 retake 摘走；"进入 syscall 前解绑"与运行时无法预知阻塞的事实矛盾（且与同要点后半句自相矛盾）；
- os-io-file-allocation（P2 算术）：200 条记录插在第 30 条前应移动 **171 条**（原 170 条是经典差一错误），移动 342 次 + 写新记录 1 次 ≈ **343 次块访问**（原 341 与 170×2 都对不上；与链接分配 31 次的口径拉齐）；
- os-scene-cpu-usage（P2）：**us 不含 ni**——/proc/stat 中 user 与 nice 是互斥的独立计数器，top 也是分开两列；
- os-io-zero-copy：措辞自相矛盾——"CPU 全程搬运"改为"**其中 2 次由 CPU 搬运**，另 2 次是 DMA"（与括号枚举对齐）；
- cs-algo-btree-math（P1）：AVL 删除"旋转至多 O(1)"写反——**AVL 删除最坏 O(log n) 次旋转**（失衡沿祖先链传播），这正是与红黑树 O(1) 的经典对比；原句与同文件 red-black-tree 题直接矛盾；
- cs-algo-red-black-tree（P1）："AVL 插入/删除 O(log n) 次旋转"——**插入至多 1 次单旋/双旋**，删除才 O(log n)；红黑树"插入 ≤2、删除 ≤3"的数字本就正确；
- cs-algo-sort-compare（P2）：三路快排大量重复的复杂度——**期望 O(n log k)**（熵形式，Sedgewick），O(n·k) 是 pivot 总取极端值的最坏情况；
- cs-db-normalization（P2）：候选键题的属性归类与自带 F 集不符（B 两边都有非"只在右部"、E 不出现非"只在左部"、C 只在左部非"两边都有"）——按 F={A→B, BC→D, C→A} 修正归类为"只在左部→C、不出现→E、只在右部→D、两边都有→A、B"；**结论 {C,E} 本身正确**（CE⁺ 可验证覆盖全属性）。

**通过确认**：3 个 agent 共列 48 条核对无误项（TIME_WAIT/RTO/Reno、VXLAN MTU 算术、RSA/DH 手算、GCM nonce 界限、僵尸态内核位、Belady 反例 9/10、buddy XOR=1536、多级页表数学、零拷贝账目、卡特兰数、主定理、贝叶斯 32%/99.6%、编译器谱系与 LALR 冲突结论、912 判断题全对等）。存疑 20+ 条经裁决未达上报标准（LTE 切换术语、CTS 广播简化、SQLite 线程模式生态差异、io_uring 对 MySQL 的表述等），保持不动。

结论：三个方向合计 169 题，二轮错误密度 11/169 ≈ 6.5%（高于 backend/frontend 的 3.6%，crypto 与算法手算类题目更容易藏数值错误）。至此 5 个最大方向（backend/frontend/network/os/cs-fundamentals，共 445 题）全部完成第二轮事实审查。

## 批 22 · 三期·剩余方向第二轮事实审查 ✅（对象：system-design 41 + computer-architecture 42 + computer-organization 36 + mobile 33 + ops 34 + big-data 27 + career 36 = 249 题 全量）

3 个审查 agent 逐题逐条核对，主会话逐条独立裁决后落改。**零 P1 机制错误**——10 处确认全部是数值/版本/人名级。

**修复 11 处**：
- ca-quant-scene-amdahl：负向 Amdahl 算例 0.9+0.1×10=**1.9**（原写 1.8，把加速倍数错算成 9）；
- sd-bloom-dedup：布隆"误判率每降一个数量级内存翻倍"夸大——m/n=1.44·log₂(1/p)，每数量级约 **+4.8 bit/元素**（1%→0.1% 实际约 1.5 倍），改为"每降两个数量级约翻一倍"；
- ca-quant-benchmarks：TPC-E 指标名 tpmE → **tpsE**（不存在 tpmE）；
- co-cpu-precise-exception + ca-ilp-ooo（两处）：IBM 360/91 年份 **1969 → 1966–1967**（交付 1967、Tomasulo 论文 1967，与 H&P 教材口径一致）；
- mo-android-compose（面试误导最重的一处）：**Jetpack Compose 在 Android 上复用平台渲染管线（Canvas/RenderNode/HWUI），不是 Flutter 式自绘**——自带 Skia 的是 Compose Multiplatform（Skiko）；原句"与 Flutter 思路相同"会把资深岗常见追问题答错；
- bd-flink-state：key group rescale 版本 **1.11+ → 1.2+**（Flink 1.2 的主打特性）；
- bd-flink-watermark：withIdleness 版本 **1.11+ → 1.8+**（FLIP-22 随 WatermarkStrategy 落地）；
- ops-finops：Spot 中断通知"一般提前 2 分钟"以偏概全——**AWS 2 分钟，GCP/Azure 约 30 秒**；
- career-growth ×2：**Will Wilson → Will Larson**（staffeng.com 作者）、**Oswald → Gergely Orosz**（engguidebook.com 作者）。

**通过确认**：3 个 agent 共列 53 条核对无误项（布隆 12GB 算例、容量估算 QPS、Amdahl/Roofline 正向算例、MESI/MESIF/MOESI、SECDED 72/64、Android ANR 阈值全表、Binder 一次拷贝、KVC 取值序、RN 新架构、HDFS/JournalNode、Spark 宽窄依赖、Flink 2PC、法条 80%/6 个月等），另 25+ 条存疑经裁决保持不动。

**三期二轮审查总账（批 20~22）**：5+7=12 个数据文件、745 题全量完成第二轮事实审查，共修复 32 处（P1×5、P2/数值×22、笔误措辞×5），整体错误密度约 4.3%，无一处机制性硬伤漏网到二轮之后。至此全库 15 个方向均至少完成两轮事实审查。

## 批 23 · 四期·新方向开荒 ✅（来源：无参考库语料，工程经验自建——本批为自写方向题，非 thu-cs-parse 收割）

**背景**：参考库（高校课程试卷）已收割完毕（批 18 结语），且其覆盖以基础学科为主；音视频与嵌入式是两个语料库从未覆盖、但招聘市场体量大的岗位方向，故转为按既有内容约定（口试题 + 要点加粗 + 层层追问 + 跨方向分工注）自建题库。

**新方向 1 · 音视频开发**（`av`，20 题 / 37 追问，6 领域）：av-basics 音视频基础 4（采样量化 PCM/奈奎斯特、YUV 与 4:2:0、分辨率帧率码率关系、音视频同步与主时钟）；av-codec 编解码原理 5（I/P/B 与 GOP、H.264 编码流水线、HEVC/AV1 演进与专利经济学、AAC 感知编码、硬编软编选型与 MediaCodec 坑）；av-streaming 封装与流媒体 4（协议选型延迟谱系、HLS 切片与 LL-HLS、ABR 算法演进、MP4/FLV/TS 封装与 moov）；av-ffmpeg 转码工程 3（流水线与 -c copy、转码成本与架构、端到端延迟预算）；av-player 播放器与 QoE 2（首帧秒开、卡顿归因）；av-audio 实时音频 2（3A 与 AEC、音频故障症状指纹）。

**新方向 2 · 嵌入式与物联网**（`embedded`，22 题 / 41 追问，6 领域）：emb-c 嵌入式 C 与编译 4（volatile 三场景与两不保证、内存布局、启动文件、链接脚本与 map）；emb-mcu MCU 与外设 4（I2C/SPI/UART 选型与坑、DMA 与 UART+IDLE 不定长接收、定时器 PWM/输入捕获、NVIC 两级优先级）；emb-rtos RTOS 与并发 3（调度与裸机取舍、信号量/互斥量/任务通知选型、heap_1~5 与静态化）；emb-linux 嵌入式 Linux 4（initramfs 与根文件系统、BSP 移植流程、字符设备驱动框架、PREEMPT_RT 与双内核）；emb-iot 物联网与低功耗 4（无线选型画像、MQTT QoS、µA 级低功耗、OTA 双分区与回滚）；emb-debug 调试与可靠性 3（看门狗健康位图、HardFault 黑匣子、串口丢包分层排查）。

**跨方向分工（正文注明）**：WebRTC 连接建立/弱网对抗留前端 fe-browser-webrtc（av 题只讲协议选型与音频链）；视频平台架构与成本留系统设计 sd-classic-video（av 讲编码器/播放器内部）；优先级反转与火星探路者留操作系统（embedded 讲 RTOS 原语选型）；DMA 通用机制与零拷贝留组成原理（embedded 讲 MCU 外设工程与 D-Cache 一致性）；中断硬件机制留组成原理、Linux 中断留操作系统（embedded 讲 Cortex-M NVIC 工程写法）；硬件信任根/度量链留体系结构（embedded OTA 题只讲 bootloader 验签与回滚）；Java volatile 留后端（emb-c-volatile 明确注两层语义差异）。

**难度分布**：basic 16 / intermediate 20 / advanced 6（basic 38%，符合"每批 ≥30% basic"约定）；无真题改编 tag（无试卷来源，如实不标）。

**注册与同步**：trackLoaders 在 mobile 后插入两项；content.test 前缀 `av-`/`emb-`、方向数 15→17；gen:meta 重新生成；README（方向列表/题量 812/追问 1270 步/分包 17）与 index.html og:description 同步。

## 批 24 · 四期·新方向开荒 ✅（来源：无参考库语料，工程经验自建——延续批 23 的自建模式）

**背景**：批 23 结语列出的两个候选方向落地。游戏方向与系统设计 sd-classic-game-sync（帧同步/状态同步模型与确定性）、前端 Canvas/WebGL 可视化选型做了分工；安全方向与 qa-security-app（Web 安全测试"怎么测"视角）、network/net-security（密码学算法原理与侧信道）、后端 be-general（JWT/OAuth/零信任原理与选型）、qa-sec-supply-chain（依赖治理体系）逐一分工，正文互相注明。

**新方向 1 · 游戏开发**（`game`，18 题 / 18 追问，6 领域）：gd-engine 引擎与架构 3（引擎分层与固定时间步主循环、GoC vs ECS 与数据导向、热更新双线与 iOS W^X）；gd-render 图形与渲染 4（渲染管线阶段、前向 vs 延迟与移动端 TBDR、PBR 与 Shadow Map、CPU/GPU 瓶颈判定与 DrawCall）；gd-math-physics 游戏数学与物理 3（四元数 vs 欧拉角/矩阵、broad/narrow phase 碰撞检测、A* 与 NavMesh 工程化）；gd-server 游戏服务端与网络 3（KCP 选型、客户端预测与和解 + 延迟补偿、AOI 九宫格 vs 十字链表）；gd-opt 性能与资源 3（帧预算与优化流程、GC 治理与对象池、图集/LOD/剔除边界）；gd-ai 游戏AI与关卡 2（行为树 vs 状态机、程序化生成可控随机）。

**新方向 2 · 信息安全**（`security`，19 题 / 19 追问，5 领域）：sec-web Web 攻击深水区 5（OWASP 风险思维、渗透基本功与授权边界、上传两道防线、SQL 注入利用面与预编译根治、反序列化与 gadget chain）；sec-binary 二进制与逆向 3（逆向方法论、堆利用与 tcache、Fuzzing 覆盖率引导）；sec-auth 认证与协议实现安全 3（JWT 实现坑、OAuth 攻击面走查、密码学工程三坑 CSPRNG/时序比较/密钥管理）；sec-cloud 内网与云安全 3（横向移动路径与防御映射、AD 与 Kerberoasting、容器逃逸与 K8s 攻击面）；sec-sdl 安全建设与响应 5（STRIDE 威胁建模、SDL 卡点、Secret 治理、应急响应先取证再处置、入侵检测规则）。

**难度分布**：game basic 6 / intermediate 10 / advanced 2；security basic 5 / intermediate 10 / advanced 4（合计 basic 11/37 ≈ 30%，符合约定）。无真题改编 tag（无试卷来源，如实不标）。

**注册与同步**：trackLoaders 在 embedded 后插入两项；content.test 前缀 `gd-`/`sec-`、方向数 17→19；gen:meta 重新生成；README（方向列表/题量 849/追问 1307 步/分包 19）与 index.html og:description 同步。攻防内容保持面试知识定位：攻击机制均配防御映射与授权/法律边界提示。

**至此批 23 结语列出的候选方向全部落地，题库覆盖 19 个方向。**

## 批 25 · 四期·新方向事实审查 + career 衔接题 ✅（对象：批 23~24 新建的四个方向全量，79 题）

**做法**：沿用批 20~22 工序——4 个审查 agent 并行逐题逐条核对（机制/数字/版本/公式/协议行为），版本敏感条目（BT.1359、KCP 参数、safe-linking、PREEMPT_RT 6.12、gMSA、OSS-Fuzz）联网核实，主会话逐条独立裁决后落改。

**修复 8 处（av 3 + game 3 + security 4 中的事实项 + 记号项，embedded 0）**：
- av-codec-h264-internal（标准硬事实）：H.264 帧内预测写成"4×4 有 9 种方向模式 + DC/平面模式"——实际 **9 种模式 = 8 方向 + DC**，4×4 无 Plane 模式（Plane 属于 16×16 帧内）；
- av-basics-sync（阈值标签错位）：BT.1359 的 90ms/185ms 是**可接受**边界（约半数观众不可接受），**可感知**阈值是超前 45ms/滞后 125ms——数字真实、归类说反；
- av-container-mp4（机制说反）：faststart 的括号注释写成"moov 索引不依赖 mdat 位置"——**stco 的 chunk 偏移是文件内绝对偏移**，moov 前移后必须整体重写，这正是需要二次封装的原因；
- gd-server-kcp（参数归名）：关闭拥塞退让写成"nodelay 模式"——KCP 里是 `ikcp_nodelay` 的第 4 参 **nc**（nodelay 只控 RTO 策略）；顺带把"选择性重传（SACK）"的 SACK 标注去掉（KCP 是逐包 ACK 的选择重传，非 TCP SACK 选项）；
- gd-engine-hotupdate（笔误）："地址化寻途"→"地址化寻址"；
- sec-binary-fuzzing（规模过时 + 拼写）：OSS-Fuzz"数百个项目"→**上千个**（2023 年即达约 1000 项目/万级漏洞）；"harnes"→harness；
- sec-cloud-ad（单位不准）：gMSA"密码 240 字符"→**240 字节随机数据、默认 30 天自动轮换**（Microsoft Learn 口径）；
- sec-sdl-incident（记号笔误）："TTD/TTD→TTK"→MTTD/MTTR。

**补充 1 处完善**：emb-rtos-memory 的 heap_1~5 谱系补上 **heap_3**（标准 malloc/free 包装、线程安全靠临时挂起调度器）——原列丢单漏了 3。

**审查通过确认**：embedded 全文件零确信错误（12/6 周期、压栈 8 寄存器、0xA5 高水位、heap 语义、9 脉冲恢复、BLE 7.5ms~4s、NB-IoT +20dB、PREEMPT_RT 6.12、initramfs cpio、misc 主设备号 10 等逐一核对无误）；av 的数值算例（CD 1411kbps、1080p30≈745Mbps、186:1、CABAC ~10%）、game 的图形学/同步机制、security 的版本类事实（safe-linking 2.32、AFL 2013、Debian 2008、PKCE RFC 7636、DirtyPipe、6443/2379、IMDSv2）均核对无误。4 个 agent 另列 9 条"存疑但按宁缺毋滥纪律保持不动"的边缘表述（如 No Man's Sky 对"纯生成无商业成功"的反例、Mali 上 blend 的粗化表述等）。

**新题 1**（career.ts，career-project）：career-project-direction-switch——转新方向（音视频/游戏/嵌入式/安全）没对口项目经验的破局路径（存量映射/侧项目证据/求职梯度），2 条追问（转方向动机话术、薪资重定价谈判）。题库总量 849 → **850**，README 与 index.html 同步。

至此批 23~24 新建的 79 题全部完成一轮事实审查，四个新方向的质量与存量方向拉齐。

## 批 26 · 四期·存量增厚 ✅（来源：无参考库语料，工程经验自建——延续批 23 自建模式；对象：批 8 因无语料跳过的 big-data 与 mobile）

**背景**：批 8 曾因参考库无对口语料跳过"大数据/移动端增厚"；两方向题量长期垫底（20/30 题），按批 23 的自建模式补齐。落点选择依据"高频考点 × 现有覆盖空白"，与既有题查重（Spark 倾斜/Flink 五题/ANR/Binder/跨端选型等既有题未动）。

**big-data +6（20 → 26）**：bd-hadoop +2——bd-yarn（YARN 架构/提交流程/Capacity vs Fair 调度器，basic）、bd-hive-slow-sql（Hive 慢 SQL 清单：执行计划/MapJoin/倾斜/向量化/换引擎）；bd-warehouse +1——bd-metadata-lineage（元数据与血缘的地基作用，basic）；bd-spark +2——bd-spark-memory（统一内存划分与 OOM 排查、Storage/Execution 驱逐不对称）、bd-spark-sql-aqe（Catalyst 全流程 + AQE 三大招，advanced）；bd-pipeline +1——bd-schema-evolution（CDC 上游 DDL 的分级演进、Iceberg field ID 解耦位置耦合）。

**mobile +6（30 → 36）**：mo-android +3——mo-android-glide（Bitmap 内存账 + 三级缓存 + 按 View 采样，basic）、mo-android-viewmodel（ViewModel vs SavedStateHandle：配置变更 vs 进程死亡）、mo-android-okhttp（拦截器责任链/连接池/证书锁定与 HTTPDNS）；mo-ios +3——mo-ios-autorelease（pool 页结构与 RunLoop 联动、手动加的两个场景）、mo-ios-swift-value（值/引用语义、COW、POP，basic）、mo-ios-crash（信号捕获/符号化/Watchdog 与 Jetsam 抓不到的崩溃，advanced）。

**难度分布**：basic 4 / intermediate 7 / advanced 1（basic 33%，符合约定）。无真题改编 tag（无试卷来源，如实不标）。

**注册与同步**：gen:meta 重新生成（19 方向 · 862 题）；README 与 index.html 统计同步（862 题/1321 步追问）。至此 19 个方向中最薄弱的两个（big-data/mobile）完成第一轮增厚；下一步可对两方向新题做一轮事实审查（工序同批 25）。

## 批 27 · 四期·存量增厚 ✅（来源：工程经验自建；对象：qa 与 ops——查重后确认两方向覆盖扎实，只补真实空白）

**qa +4（31 → 35）**：qa-basics +1——qa-basics-locate-bug（Bug 前后端归因：抓包分层取证/traceId 下沉/假 Bug 清单，basic）；qa-automation +3——qa-automation-contract（契约测试：Pact CDC 流程/can-i-deploy/与接口自动化和 OpenAPI diff 的分工）、qa-automation-env-data（测试环境三类病与造数/脱敏/数据隔离）、qa-automation-fullchain-perf（全链路压测：影子库/流量染色/挡板/多层防写穿设计，advanced）。

**ops +4（31 → 35）**：ops-linux +2——ops-linux-systemd（unit/After vs Requires vs Wants 语义/journald/timer vs cron）、ops-linux-backup-dr（RPO/RTO、3-2-1、PITR、快照 ≠ 备份，basic）；ops-cicd +2——ops-k8s-cni（网络模型三约定/overlay vs BGP 路由/NetworkPolicy 白名单语义与 Flannel 不支持策略，advanced）、ops-k8s-hpa（伸缩公式/按 CPU 伸缩翻车四因/缩容优雅终止链）。

**难度分布**：basic 3 / intermediate 4 / advanced 1。无真题改编 tag。题库总量 862 → **870**。

## 批 28 · 四期·批 26~27 新题事实审查 ✅（对象：20 题全量）

**做法**：2 个审查 agent 并行逐题核对，版本敏感条目对照一手来源（Spark 源码 SQLConf.scala 的 v3.0.0/v3.2.0 tag、Hadoop yarn-default.xml/mapred-default.xml、K8s 官方 Pod lifecycle 与 HPA 文档），主会话逐条裁决后落改。

**修复 3 处（无机制性错误，1 版本事实 + 1 参数名虚构 + 1 命令笔误）**：
- bd-spark-sql-aqe（版本事实）：AQE"Spark 3.0 起默认开启"——3.0 只是引入（createWithDefault(false)），**3.2.0 起才默认开启**（源码核实）；
- bd-yarn（参数名虚构）：`max-app-attempts` 在官方默认配置中不存在——应为 **yarn.resourcemanager.am.max-attempts**（MR 侧 mapreduce.am.max-attempts，均已 grep 默认配置文件确认）；
- ops-linux-systemd（笔误）：`systemctl status/status` → `systemctl status`。

**通过确认**：qa/ops 8 题概念口径全部对照官方文档核实无误（Pact CDC 流程、systemd 依赖三语义、NetworkPolicy"选中即白名单"、HPA 期望副本数公式、preStop 先于 SIGTERM 的顺序、PITR/3-2-1/快照与备份的故障域差异）；bd/mo 其余 10 题无误（统一内存 0.6/0.5/300MB、AQE 三大招、Iceberg field ID、Glide 三级缓存、ViewModel 经 NonConfigurationInstances 存活、AutoreleasePoolPage 4KB 页与哨兵、Watchdog/Jetsam 抓不到信号等）。至此批 26~27 的 20 道新题完成一轮事实审查，四期全部增量（批 23~27 的 100 题）均已过审。

## 批 29 · 四期·新方向第二轮事实审查 ✅（对象：四个新方向 79 题全量——对齐批 20~22 确立的"每方向至少两轮"标准）

**做法**：4 个审查 agent 并行，审查重心区别于第一轮：独立复算数值算例（不采信文本自洽）、跨题口径一致性、第一轮修复的复查、面试场景误导性表述。版本敏感处全部对照一手来源（ITU-R BT.1359-1 官方 PDF、KCP ikcp.c 源码、Unity 2018.4/2019.4 官方文档、FreeRTOS-Kernel heap_3.c 源码、AFL ChangeLog、IETF OAuth 2.1 草案 v16、glibc MallocInternals、fastjson 官方 wiki）。

**修复 6 处（av 1 + game 4 + security 1 排版；embedded 零问题）**：
- av-basics-sync（第一轮修复的尾巴）：BT.1359 的"约一半观众开始不可接受"是原文不存在的统计——实际口径为 DSIS 五级损伤标度（可接受 ≈3.5 分、可察觉 ≈4.5 分），已对照官方 PDF 改正；
- gd-server-kcp（机制性误导，源码级确认）：KCP"不阻塞后文"与可靠有序语义矛盾——ikcp_parse_data 按 sn 连续才交付，丢包后应用层队头阻塞依然存在，KCP 的优势是修复快不是消除队头阻塞（正是实时输入走不可靠通道的原因，已改写并点破）；
- gd-ai-procedural（绝对化断言）：'纯生成的游戏内容至今没有商业成功案例'被《无人深空》等可查证反例击穿——改为"完全交给生成、没有手工骨架的头部商业成功极其罕见，反例也靠多年人工迭代补课"；
- gd-render-perf（以讹传讹）：合批失效源"不同缩放"——Unity 官方文档仅列**镜像缩放**（transform 含负缩放），一般缩放差异不破坏合批；
- gd-math-pathfinding（例句不严谨）：曼哈顿距离仅四向网格可采纳，八向网格会高估（dx=dy=10 时 20 > ≈14.14）——补 octile/欧氏与网格连通性限定；
- security 排版：清理"（ Immutable Backup"多余空格。

**通过确认**：av 的 10 组数值独立复算全部正确（CD 1411.2kbps、746.5Mbps/186:1、B 帧 33~66ms、YUV 全零呈绿的 RGB 换算等）；embedded 零问题（heap_3"临时挂起调度器"经 FreeRTOS 官方源码逐字核实、NVIC 12/6 周期与压栈 8 寄存器、低功耗算例复算成立、五组跨题口径一致）；security 的 9 个版本敏感点全部与权威来源一致（safe-linking 2.32/tcache key 2.29、AFL 0.21b 2013-11-12、fastjson safeMode 1.2.68、OAuth 2.1 v16 等）；game 其余 14 题通过（第一轮 nc 参数修复复核无误）。另有多条"存疑不报"按宁缺毋滥纪律保持原状（x265 单核算力口径、HLS 18~30s 简写、"量化为唯一有损入口"的教学简化等）。

**结论**：第二轮错误密度 6/79 ≈ 7.6%（低于老方向二轮的量级且以精度问题为主、无机制性硬伤），两个新方向经两轮审查达零问题。四期全部 100 题至此完成两轮事实审查，与存量方向的质检标准拉齐。

## 批 30 · 四期·增厚题第二轮事实审查 ✅（对象：批 26~27 的 20 道增厚题——四期增量全面达到"两轮"标准）

**做法**：2 个审查 agent 并行，重点独立复算、与同文件既有题交叉一致性核对，版本敏感处对照一手来源（OkHttp 4.12.0 RealCall.kt 源码、Hadoop 3.3.6 mapred-default.xml、systemd.unit(5)、K8s NetworkPolicy/HPA 官方文档）。

**修复 4 处（bd 零问题；mo 1 处机制性错误 + ops 2 处精度 + 1 处合并）**：
- mo-android-okhttp（机制性错误，源码级确认）：网络拦截器位置写成"Connect 之前"——实际在 **Connect 之后、CallServer 之前**（RealCall.kt 的拦截器顺序为 interceptors → RetryAndFollowUp → Bridge → Cache → Connect → networkInterceptors → CallServer），正文与 followUp 各改一处。这是"网络拦截器拿得到 Connection 吗"的面试高频陷阱，原表述会直接教错；
- ops-linux-systemd（语义精度）：`Requires=` 的"对方启动失败我也不启动"需**配合 After= 才在启动事务生效**，对方被显式停止/重启才无条件连带；运行中崩溃不连带停止（那是 BindsTo=）——对照 systemd.unit(5) 补限定；
- ops-k8s-cni（语义精度）：NetworkPolicy 白名单为**按方向独立生效**（ingress/egress 各自声明、policyTypes 决定），原"进出流量全部拒绝"过宽——对照 kubernetes.io 官方文档修正。

**通过确认**：bd 6 题零问题（首轮两处修复无残留旧口径，与既有 bd-spark-skew/bd-cdc-sync 交叉一致）；YARN/Hive/Spark/Iceberg 参数名与默认值全部对照默认配置文件核实（mapreduce.map.maxattempts=4、mapjoin.smalltable.filesize=25000000 字节）；mobile 其余 5 题与既有 memory-leak/arc/gcd/performance 交叉一致；HPA 全部数值与官方文档逐条一致、preStop/SIGTERM 链路与 ops-linux-process-signal 口径一致；qa 4 题与 platform/jmeter/bug-lifecycle 互补不重复。另有 2 条边缘观察（YARN 容器超时的两机制合写、快照失效场景的云盘语境）按宁缺毋滥纪律不列错。

**结论**：第二轮错误密度 4/20 = 20%（其中 1 处机制性、3 处措辞精度——20 题的小样本 + 二轮深挖符合预期），至此**四期全部增量（批 23~27 的 100 题）均完成两轮事实审查**，全站 870 题的质检标准完全拉齐。四期工作全面收官。
