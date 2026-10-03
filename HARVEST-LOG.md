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

题库总量：656（起点）→ **770**（当前）。真题改编题统一打 `tags: ['真题改编']`，可全局搜索筛选。
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
