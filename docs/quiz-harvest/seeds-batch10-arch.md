# 批 10 收割种子存档（计算机体系结构增厚）

> 来源：体系结构课程 11 份带答案试卷（清华十年题 2001-2014、浙大 22-23 带详解卷、高级体系结构 2013、CMU 风格并行作业答案）+ 作业 5 份，34 条种子。2026-09-30 收割。
> 状态：✅ 已落地（computer-architecture.ts +4 新题 +6 追问）

## ✅ 新题 4

- ca-quant-roofline（basic，ca-quantitative 领域）：算术强度 = 运算/字节、对照机器平衡点判瓶颈（作业原题：16GB/s 需求 vs 8GB/s → 50%）；循环融合 2× 原题；强度直觉值（向量加 0.08 / GEMM n/3 / LLM decode 0.25）；追问：矩阵乘 vs 向量加的复用度本质
- ca-ooo-scheduling（advanced，ca-ilp 领域）：动态调度三代演进——记分板（集中检测/按序发射/结果互锁）→ Tomasulo（分布保留站/发射即重命名/CDB 广播）→ 硬件投机（ROB 按序提交/精确异常）+ 单保留站时序对比原题；追问：重命名能力边界（WAR/WAW 可消 RAW 不可，原题）、RISC-V mtvec/mepc/mtval 分工（原题）
- ca-branch-predictor-structure（intermediate，ca-ilp 领域）：(m,n) 两级预测器结构与容量算术（8K bits = 2048 项 × 4×2bit 原题）+ 局部 vs 全局历史 + 锦标赛/TAGE 谱系 + BTB 降 CPI 原题；追问：分支延迟槽与被放弃的原因
- ca-sync-primitives（intermediate，ca-coherence 领域）：CAS 自旋锁 → test-and-test-and-set（读自旋省写）→ LL/SC（原题对比 EXCH）→ 队列锁/barrier 谱系；追问：宽松内存模型最小写屏障（CMU 作业原题，一条 wfence 恢复 publish 顺序）

## ✅ 追问增强（6 条）

- ca-coh-directory ← 目录协议读/写失配消息流（浙大原题大题，Fetch/DataReply/Invalidate 序列）+ 写无效 vs 写更新权衡（原题判断）
- ca-par-smt ← ILP vs TLP：load 延迟 20 拍需 6 硬件线程（CMU 原题）
- ca-pw-ecc-ras ← 软错误翻转 MESI 状态位：低效 vs 错误的判据（清华 2014 原题大题）
- ca-ilp-window ← 2 发射升 3 发射无加速（依赖图临界路径，浙大作业原题）
- ca-ilp-ooo（随新题：重命名边界 + RISC-V 寄存器）
- ca-quant-roofline（随新题：矩阵乘 vs 向量加）

## 与既有题的分工

- 乱序执行怎么工作（ca-ilp-ooo）讲机制总览；本题专攻三代动态调度的实现对比
- 分支预测 95%+（ca-ilp-branch-prediction）讲准确率与代价；本题专攻预测器结构与容量
- MESI 基础（ca-coh-mesi）讲协议状态机；目录协议题（ca-coh-directory）讲扩展；追问补消息流细节
- SMT 收益（ca-par-smt）讲资源划分；追问补藏延迟线程数计算

## ❌ 丢弃与理由

- 3C 失配分类/失配率 vs 失配代价/L1-L2 目标/TLB tag-data/虚存设计对照/分离 I-D cache —— 组成原理与既有题已覆盖
- 非线性流水线预约表调度、定向 bypass RTL 逻辑、扩展操作码编码 —— 体系结构课程细节，通用面试价值中低
- 软件流水/GCD 判相关/VLIW 对照/poison 位/写分配搭配 —— 价值中，部分要点已穿插正文
- 语料缺口（agent 标注）：TAGE 细节、EPT/NPT 二维翻译、一致性协议形式化验证无真题素材
- 乱码：浙大《课程要点》前半 PPT 乱码仅用后半；两处答案分歧已按题库答案佐证
