# 批 42 种子 · Grokking Advanced SD（Chubby/Kafka 设计/设计模式/DoorDash）

> 来源目录：`Grokking the Advanced System Design Interview/`（Chubby 12 章、Kafka 11 章、System Design Patterns 21 篇）+ `../System Design Interview DoorDash/`（8 章）。
> 说明：DoorDash 目录中 03/05/06 三章同时存在 `.icloud` 占位与实体 PDF，实体均可读，无跳过章节；DoorDash 第 3 章的容量估算具体数字为图片，文本层提取不到，素材仅保留估算框架。
> 查重基准：system-design.ts（sd-classic-distributed-kv / sd-rate-limiter / sd-bloom-dedup / sd-task-scheduler）、backend.ts（be-distributed-consistent-hash / be-distributed-quorum / be-distributed-brain-split，另核对 be-distributed-raft / be-distributed-cap / be-redis-lock / be-redis-cluster / be-mq-* 全部 7 题）。

## 一、候选新题

### S1. 设计一个分布式锁服务（Chubby）：为什么需要专门的锁服务，而不是每个应用自己跑一套共识协议？
- 来源：Chubby 01 Introduction / 03 Design Rationale / 02 High-level Architecture
- 核心素材：
  - 目标：高可用 + 强一致 + 存小对象 + 提供锁；本质是**把共识问题转化为"发锁"**——谁拿到锁谁是 leader，应用只需几行代码接入，不必自己维护 Paxos 状态机。
  - 做成中心服务的四个理由：开发成本低（保留原有程序结构与通信模式）；锁接口开发者熟悉（Acquire/TryAcquire/Release）；**提供"通用选举人团体"**——客户端应用自己不用维护 quorum 服务器；事件广播机制（master 变更通知）只有中心服务才好做。
  - 只支持**粗粒度锁**（持有数小时/天，不用于秒级）：锁获取频率远低于客户端事务率 → 服务端负载小；锁服务短暂不可用时客户端不被明显卡住；少量服务器即可服务大量客户端。
  - **advisory lock（建议锁）而非 mandatory**：不持有锁也能访问对象，锁只是"记录 + 让请求者发现锁被持有"——强制锁需要深度改造被锁资源的服务，还妨碍调试访问，收益极小。
  - CAP 定位：所有读写走 master，强一致（CP）；分区时不可用；但优化"稳定 master + 无分区"的常见路径，常见情况下可用性非常高。
  - 不该用的场景：大批量存储、高频更新、细粒度频繁加解锁、pub/sub 模型（Chubby 自己的强一致缓存使其成为低效 pub/sub，Google 内部曾禁止这种用法）。
- 建议追问：① 为什么只做粗粒度锁？（原理：锁获取率 vs 事务率、可用性窗口）→ ② advisory 与 mandatory 锁的取舍（边界：锁的裁决权在应用侧）→ ③ 分区时行为与 CAP 定位（权衡：为何"常Case高可用 + 分区时拒绝服务"是元数据服务的正确选择）。
- 建议难度：advanced

### S2. 拿到锁的客户端 GC 停顿后"复活"，如何防止旧持有者破坏共享资源？——Sequencer 与 Lock-delay
- 来源：Chubby 06 Locks, Sequencers, and Lock-delays（与 interview.txt 呼应）
- 核心素材：
  - 问题：消息延迟/进程重启下，释放锁的旧持有者的请求可能晚到，误用已易主的锁（脑裂的锁服务版）。
  - **Sequencer**：持有锁的客户端可获取一个不透明字节串 = 锁名 + 锁模式（独占/共享）+ **锁世代号**（lock generation number）；应用 master 把 sequencer 附在每条内部指令上发给 worker，worker 向 Chubby 做 CheckSequencer 验证是否仍有效、是否属于过期的旧 primary。
  - **Lock-delay**（给无法改造、不能校验 sequencer 的服务兜底）：锁因持有者故障/失联而释放时，锁服务**阻止其他客户端立即获取该锁**一段预定期（默认 1 分钟，可设上限）——给"旧持有者的在途请求"留出过期时间。
  - 权衡：lock-delay 不完美但实用；上限 bound 防止故障客户端把锁（进而资源）无限期占成不可用；正常 Release 的锁立即可被获取（延迟只加在"异常释放"上）。
  - 与 fencing token 同构：锁世代号就是单调递增的 fencing 来源，裁决权交给下游资源。
- 建议追问：① sequencer 的校验放在哪一侧、为什么？（原理：只有受影响的资源才能感知持有者暂停）→ ② 两种机制的适用边界：能改造下游用 sequencer，不能改造用 lock-delay（边界）→ ③ lock-delay 窗口怎么定、为什么不完美（权衡：窗口 vs 资源不可用时长 vs 安全性）。
- 建议难度：advanced

### S3. 锁/协调服务的客户端会话应该怎么设计？——KeepAlive、租约与 Grace Period
- 来源：Chubby 07 Sessions and Events / 08 Master Election
- 核心素材：
  - Session = cell 与 client 的关系，句柄/锁/缓存全部只在会话有效期内有效；会话靠周期性 **KeepAlive** 维持，空闲（无句柄无调用 1 分钟）自动结束。
  - **租约**：master 保证在租约期内不单方面终止会话；租约只在三个时机延长——建会话、master failover、响应 KeepAlive。
  - 效率设计：master **阻塞 KeepAlive RPC** 直到客户端当前租约临近过期才返回并带上新租约时长——客户端永远有一个 KeepAlive 挂在 master 上，请求数最小化；默认租约 12s，过载的 master 可调大以减少 KeepAlive 压力（12s→60s 是 Chubby 实际的扩容手段，KeepAlive 占实测流量 93%）。
  - **Jeopardy 与 grace period**：客户端维护**保守的本地租约近似**（考虑时钟偏差取更小值）；本地租约过期时客户端不知道 master 是否已终止自己 → 清空并禁用缓存，进入 jeopardy，开始 **grace period（默认 45s）**；期内 KeepAlive 成功 → 恢复 safe 并重新启用缓存；否则判定会话过期，上报应用。
  - Failover 时序：旧 master 丢弃内存态、租约定时器停表（等价于租约延长）；新 master 先拒旧 epoch 的包，再把租约**延长到前任可能用的最大值**，向每个会话发 failover 事件（客户端借此刷新可能丢失失效通知的缓存），等各会话确认后才放行全部操作。
- 建议追问：① 为什么 master 阻塞 KeepAlive 而不是客户端定时轮询？（原理：挂起式心跳把请求数压到每客户端 1 个）→ ② 本地租约为什么要保守近似、grace period 期间应用应该做什么（边界：时钟偏差 + 业务侧"暂停危险操作"）→ ③ grace period 太短/太长各发生什么（权衡：45s 覆盖典型 failover，太短会话被误杀，太长故障资源被旧客户端占着）。
- 建议难度：advanced

### S4. 客户端缓存与强一致如何兼得？——Chubby 的缓存失效协议
- 来源：Chubby 09 Caching + Chubby/interview.txt Q6
- 核心素材：
  - 读远多于写 → 客户端用**写穿（write-through）一致性缓存**缓存文件内容、节点元数据、打开的句柄、甚至"文件不存在"这一事实（负缓存）。
  - 失效协议：master 收到写请求 → **先阻塞修改** → 向所有缓存了该文件的客户端发失效通知（**捎带在 KeepAlive 应答里**，零额外请求）→ 等每个活跃客户端 ack 后才提交修改。
  - 等待 ack 窗口内文件标记为 **uncachable**：读照常服务但不再被缓存——读永远不被阻塞（读远多于写，这个设计把强一致的代价只压在写路径）。
  - 缓存由租约保护，租约到期即清空——失效协议与 S3 的会话租约咬合。
- 建议追问：① 为什么写要阻塞等全量 ack 而不是异步失效？（原理：这是"强一致读"的代价兑现点）→ ② uncachable 的巧思与滥用风险（边界：有人轰击读 uncachable 文件怎么办——阻塞读/混合方案）→ ③ master 要维护每个客户端的缓存清单，规模化瓶颈与代理方案（权衡：引出 E9 的 proxy 素材）。
- 建议难度：intermediate

### S5. 心跳 + 固定超时判故障有什么问题？——Phi Accrual 自适应故障检测
- 来源：System Design Patterns 11 Phi Accrual Failure Detection
- 核心素材：
  - 固定超时的两难：超时短 → 检测快但误报多（慢机器/网络抖动）；超时长 → 误报少但检测迟缓；心跳输出的是"活/死"布尔值，**没有中间地带**。
  - Phi Accrual：用**历史心跳到达间隔的分布**计算"怀疑级别 φ"——输出不再是布尔而是连续的怀疑度，φ 越高越可能已死。
  - 渐进降级：怀疑度升高过程中，系统可以**逐步减少发给它的请求**，而不是等到"宣判死亡"才切换——把故障检测从 0/1 变成可编排的概率决策。
  - 落地：Cassandra 用 phi accrual 判定节点状态；适应网络环境波动后再宣布死亡，减少误判引发的副本抖动。
- 建议追问：① φ 大致怎么算（原理：历史间隔分布 + 自上次心跳的经过时间 → 怀疑概率）→ ② 阈值怎么和下游动作挂钩：怀疑度低限流、中限切读、高才切主（边界）→ ③ 与固定超时/租约的关系：租约是"确定性版本"的故障判定，phi 是"统计版本"（权衡：确定性安全 vs 统计高效）。
- 建议难度：intermediate

### S6. 上千节点的去中心化集群，每个节点如何知道其他节点的状态？——Gossip 协议
- 来源：System Design Patterns 10 Gossip Protocol
- 核心素材：
  - 朴素方案两两互发心跳是 **O(N²) 消息/秒**，任何有规模的集群都扛不住；中心监控节点又是单点。
  - Gossip：每节点每秒把"自己 + 已知的所有节点状态"发给**一个随机节点**；状态变更以 epidemic 方式扩散，O(log N) 轮内全网收敛；消息有冗余但换来了无单点、抗抖动。
  - 携带内容（Dynamo/Cassandra）：节点可达性、负责的 key 范围等集群视图；每个节点维护完整(但可能略旧)的集群状态。
  - 配套要点：gossip 状态里带 **generation number**（重启一次加一），接收方据此区分"重启前后的旧状态"（与脑裂世代号素材打通）；gossip 是最终一致的集群状态传播，牺牲实时性换去中心化。
- 建议追问：① 收敛速度和消息冗余怎么权衡（原理：随机对等传播的 log N 轮收敛 + 重复消息代价）→ ② gossip 的状态是旧的，路由/决策基于旧视图会有什么问题（边界：最终一致视图 + 兜底机制如 hinted handoff）→ ③ 什么时候不该用 gossip 改用中心协调（权衡：小集群直接 ZK/etcd，简单可观测）。
- 建议难度：intermediate

### S7. "先写日志"为什么是横跨数据库与分布式系统的万能模式？——WAL、分段日志与快照
- 来源：System Design Patterns 5 Write-ahead Log / 6 Segmented Log + Chubby 10 Database + Kafka 02
- 核心素材：
  - WAL 定义：任何修改**先**追加写入磁盘上的日志（每条含 redo/undo 足量信息），再应用到系统状态；崩溃后重放日志恢复，按需 redo/undo。
  - 为什么快：只需刷日志文件即可保证事务持久，不必刷每个被改的数据文件；日志天然顺序追加，磁盘顺序写与 OS 预读/写合并友好。
  - 分布式化：每个节点维护**自己的日志**；每条日志有唯一 ID（支撑分段、清理、复制对齐）。
  - **Segmented Log**：单一巨型日志难以管理（启动重放慢、清理/合并困难）——按时间（每 4h）或大小（每 1GB）滚动分段；Kafka 分区、Cassandra commit log 都这么干；段内数据全部刷盘后可归档/删除/回收。
  - **快照 + 日志尾巴 = 完整状态**：Chubby 每 几小时把数据库快照写到另一栋楼的 GFS（顺便避免"GFS 依赖 Chubby 选主"的循环依赖），然后删旧日志——恢复 = 最后快照 + 其后日志重放。
  - 同一模式的出现面：MySQL redo log、Cassandra commit log、Kafka（整个系统就是分布式 commit log）、Chubby 事务日志——一道题串起四个系统。
- 建议追问：① WAL 与"直接改数据页"的成本/风险对比（原理：随机写 vs 顺序写、崩溃窗口）→ ② 快照点与日志怎么衔接、日志什么时候能删（边界：checkpoint 语义）→ ③ Kafka 把 WAL 从"恢复手段"升级为"产品本身"，思维差异在哪（权衡：日志从配角到主角）。
- 建议难度：intermediate

### S8. 主从复制下，消费者为什么只能读到 High-Water Mark？
- 来源：Kafka 04 Deep Dive + System Design Patterns 7 High-Water Mark
- 核心素材：
  - 问题：异步复制下 follower 落后 leader；若消费者从旧 leader 读到 offset 7，随后 leader 挂了、落后的 follower 上位，消费者在新 leader 上**找不到已读过的消息**——非重复读（non-repeatable read），等价于"读到了未持久到多数派的幻影数据"。
  - **HWM** = 某 partition 全部 ISR 共同达到的最大 offset；leader **只暴露 HWM 以内的消息**，并把 HWM 下发给 followers（可作为心跳的一部分传播）。
  - 通用化：leader-follower + WAL 架构里，"已被 quorum 复制的前缀"才是对客户端安全可见的前缀——Kafka HWM、Raft commitIndex 是同一思想的两个名字。
  - 权衡：可见性延迟 = 等待最慢 ISR 复制的延迟；acks 配置（async / leader / leader+quorum）是持久性与可见性延迟之间的显式旋钮。
- 建议追问：① HWM 与 acks=all、min.insync.replicas 的关系（原理：写确认档位决定 HWM 推进速度与 ISR 收缩风险）→ ② unclean leader election 开启会发生什么（边界：HWM 之外的丢数据路径）→ ③ 读可见性延迟对业务的影响与调优（权衡：ISR 收紧 = 更安全但可见性变慢）。
- 建议难度：intermediate

### S9. 设计一个外卖配送平台（DoorDash 案例全流程）
- 来源：System Design Interview DoorDash 03-07
- 核心素材：
  - **角色驱动需求**：消费者/骑手（DoorDasher）/商家/平台运营四类 actor，各自的功能需求分开列；非功能：搜索低延迟、下单低延迟、高可用、峰值高吞吐。
  - **一致性分级（本题灵魂）**：搜索/菜单/商家信息 → **最终一致**（新商家上榜晚几分钟没关系）；下单 → 消费者/商家/骑手三方必须看到**同一个订单**，强一致——同一系统内按数据域切一致性，是可迁移的答题范式。
  - **存储混搭**：餐厅/菜单等数据量大且 schema 因商家而异 → Cassandra；下单是事务流程 → MySQL/Postgres；图片 → S3；搜索 → Elasticsearch（geo-distance query 按半径筛附近餐厅）+ 队列 + Data Indexer 异步建索引。
  - **微服务 + pub/sub 解耦**：database-per-service；订单履约是一段 **14 步事件编排**（Ordering Service 发"订单已创建"→ Notification Service 通知商家 → Order Fulfilment Service 发"已接单"→ Dispatch Service 发区域消息通知骑手抢单/自动派单 → 取餐/送达逐级广播状态）——所有状态流转靠 MQ 事件驱动，服务间零直接依赖。
  - 支付走**外部支付网关且同步调用**（与事件驱动的其他流程刻意区分）；通知服务抽象推送/短信/邮件/站内信等渠道。
  - 故障与扩展：每个服务水平扩展 + LB；订阅型负载靠 **Kafka consumer group 分区分配实现负载均衡**；autoscaling + self-healing；热点搜索词/热门商品/图片进分布式缓存（LRU/LFU），CDN 在该场景判定为过度设计。
  - 安全：全链路 TLS、OAuth2、Kafka 开 SASL/SSL。
- 建议追问：① 14 步事件链里"通知丢了/重复了"怎么办（原理：对接 be-mq 的重试+幂等+对账三件套）→ ② 搜索索引与主库的最终一致窗口，索引落后时用户会看到什么（边界：Data Indexer 重放与幂等写 ES）→ ③ 骑手派单为什么先做"区域广播抢单"而不是全局最优分配（权衡：实时匹配的复杂度，属 out of scope 但要会说边界）。
- 建议难度：advanced

## 二、既有题增强素材

### E1. 目标题目：be-redis-lock（Redis 分布式锁；fencing token 追问）
- 追问素材：Chubby sequencer/lock-delay 是 fencing 思想的工业鼻祖，可作该追问的落地案例：① sequencer = 锁名 + 模式 + 锁世代号，由**下游 worker 主动向锁服务校验**；② lock-delay 面向"无法改造的下游"——锁异常释放后冻结 1 分钟（有上限），用时间窗消化旧持有者的在途请求；③ 强调"正常释放立即可抢，异常释放才延迟"，与 Redis 锁看门狗/过期时间的关系可对比展开。

### E2. 目标题目：be-distributed-brain-split（脑裂）
- 追问素材：补三组工业实例：① **Kafka controller 僵尸**：controller 宕机 → ZK 选新 controller，旧 controller 若只是 GC 停顿复活即成 zombie——所有 controller 请求携带 **epoch number（存 ZK）**，broker 只信最大 epoch（世代 clock 的标准实现）；② **Chubby 新 master**：上任先取新 epoch number，拒绝一切旧 epoch 调用，防止响应发给前任 master 的迟到包；③ 世代号要**持久化**（可随每条 WAL 记录落盘），重启不回退；Cassandra 把 generation number 放进 gossip 消息，区分节点"重启前的旧状态"。另可补 fencing 的两分法：**resource fencing**（吊销旧主的共享存储访问/禁用网络端口）vs **node fencing（STONITH，直接断电重置）**，HDFS 对旧 NameNode 即用 fencing。

### E3. 目标题目：sd-rate-limiter（分布式限流器）
- 追问素材：MQ 场景的限流变体——**Kafka quota**：按 client-ID 的字节率阈值（一个 client-ID 跨多实例共享配额），超限时 broker **扣住响应不放、拖满时间把客户端拖到配额内**，而不是返回错误；超限对客户端透明，客户端无需退避重试逻辑——与限流题里 "429 + Retry-After 快速失败"哲学形成对照：**多租户隔离场景"减速"优于"拒绝"**，因为消费者拖慢不会丢数据只会滞后。

### E4. 目标题目：be-mq-no-loss（消息不丢失）
- 追问素材：用 **HWM 视角**重述存储端不丢：leader 只把"全部 ISR 都已复制"的前缀暴露给消费者（见 S8），因此 acks=all + min.insync.replicas≥2 的本质是控制 HWM 推进条件；可补课堂三档 ack 的表述（Async fire-and-forget / Committed to Leader / Committed to Leader and Quorum）作为"持久性旋钮"的标准答案话术。

### E5. 目标题目：sd-bloom-dedup（布隆过滤器判重）
- 追问素材：补一个存储引擎场景迁移——**BigTable/Cassandra 的 SSTable 读优化**：一次读要查 tablet 的所有 SSTable，不在内存就要多次磁盘访问；为每个 SSTable（locality group）建布隆过滤器，用少量 tablet server 内存预判"该 SSTable 可能含此行/列"→ 大幅减少无效磁盘寻道——与爬虫判重、缓存防穿透并列的第三个标准场景，且能衔接 LSM-Tree 读路径。

### E6. 目标题目：be-distributed-quorum（Quorum W+R>N）
- 追问素材：① **奇数节点论证**：5 节点容忍 2 故障、4 节点只容忍 1——偶数不增加容错还多一台成本；② 性能最优配置在 **1 < R < W < N**（读多于写的负载下微调 R）；③ R=1/W=N（write-all-read-one）在节点可宕机时不可取——写完成率被最差节点绑架；④ Read Repair 的**概率执行**变体：读一致性级别 < All 时（如只抽样 10% 请求），先满足一致性级别即刻返回，修复异步后台做；摘要（digest/checksum）比对省带宽，不一致才拉全量。

### E7. 目标题目：be-redis-cluster（Redis 集群；gossip 追问）
- 追问素材：gossip 消息内容的具体化——Dynamo/Cassandra 的 gossip 携带**节点可达性 + 负责的 key range**；并在其上叠加 **phi accrual 故障检测**（Cassandra）而非固定超时——形成"gossip 传播状态（最终一致）+ phi 判故障（统计怀疑度）"的完整去中心化故障感知链路，可把现有追问里"Gossip 是最终一致的集群状态传播"展开成完整答案。

### E8. 目标题目：sd-classic-object-storage（对象存储）
- 追问素材：**端到端 checksum 完整性链**：写入时用 MD5/SHA 系列算校验和与数据同存；读取时客户端校验，不匹配 → 换副本重取而不是返回坏数据（HDFS/Chubby 皆如此）；Chubby 还用 checksum 做**镜像追赶**——跨洲镜像断连恢复后逐文件比对 checksum 找出需同步的文件，世界范围内镜像延迟秒级；可反问"bit rot 静默损坏怎么发现"引出 scrubbing + checksum + 副本替换闭环。

### E9. 目标题目：be-distributed-config-registry（配置中心/注册中心）
- 追问素材：Chubby 的规模化经验对注册中心的迁移价值：① **ephemeral 节点做活性标记**——无客户端持有句柄即自动删除（服务发现"实例离开"的原型）；② KeepAlive 类心跳占实测流量 93% → **拉长租约（12s→60s）** 是第一扩容手段，其次 **proxy**（一个代理聚合 N 个客户端的 KeepAlive/读，流量除以 N，写与首次读仍回 master）；③ namespace 设计成**可按目录拆分到多个 cell**（ls/cell/foo 归 cell A、ls/cell/bar 归 cell B），但注意 ACL 集中存储与目录删除引发的跨分区调用是拆不掉的；④ 负缓存（缓存"文件不存在"）与配额缺失的教训（后来加 256KB 文件上限）。

### E10. 目标题目：be-distributed-raft（Raft 选主与日志复制）
- 追问素材：Raft 安全性与工业形态的互证素材：① 选主"多数派投票 + 日志不全者被拒"与 Kafka"只有 ISR 能当 leader"是同一条安全性约束的两种表述——**新 leader 必须拥有全部已提交（已复制到多数派）的日志**；② Lease Read 的现实原型是 Chubby 会话租约（租约内 master 保证不被单方面替换，读可走本地），但依赖时钟有界假设；③ Chubby 论文的立场：锁定/选主只是把共识"翻译成人人会的接口"，Raft 题答到"为什么工业界偏好把它包成 KV/锁服务"时可引用。

## 三、主动丢弃
- **Kafka 交付语义（at-most-once / at-least-once / exactly-once）**：be-mq-no-loss + be-mq-idempotent 已从生产/存储/消费三端完整覆盖，且现有答案比课程更工程化。
- **Kafka 高吞吐实现（顺序写/页缓存/零拷贝/批量）**：be-mq-kafka-throughput 逐条覆盖并带 sendfile 拷贝路径追问，课程内容为其子集。
- **Kafka workflow 的 pub-sub vs queue 步骤流水账**：教科书式流程描述，be-mq-why-and-choose 已覆盖两种模型的本质差异（consumer group 把 queue 语义叠在 pub-sub 之上）。
- **CAP / PACELC 章节**：be-distributed-cap 已覆盖定理表述、三种误读、PACELC 与 BASE；各系统分类（Dynamo PA/EL、BigTable PC/EC、MongoDB 默认 PA/EC）只值得一句带过，不单独成题。
- **一致性哈希章节**：be-distributed-consistent-hash 完整覆盖环、虚拟节点、有界负载演化。
- **Quorum 章节主体**：be-distributed-quorum 已覆盖 W+R>N 及不保证线性一致的边界，仅取奇数节点/配置优选作 E6 增强。
- **向量时钟章节**：sd-classic-distributed-kv 冲突裁决点已覆盖（版本向量/交应用裁决，Git 类比）。
- **Merkle Trees / Hinted Handoff / Read Repair 章节**：sd-classic-distributed-kv 追问与 be-distributed-quorum 衍生概念已覆盖三件套（读修复/反熵 Merkle/sloppy quorum + hinted handoff），仅概率读修复细节作 E6 增强。
- **Heartbeat 章节本体**：机制本身已被 be-distributed-config-registry（心跳续约/TTL）、sd-im（应用层心跳）覆盖，GFS/HDFS 心跳实例仅作 E 类背景，不单独成题（其理论短板由 S5 phi accrual 补位）。
- **Leader-Follower 章节本体**：be-distributed-raft 已覆盖选主/复制/安全性，课程内容是 Raft 题的通用化重述，仅互证素材进 E10。
- **Split-brain / Fencing 章节主体**：be-distributed-brain-split 已覆盖三件套（quorum/fencing/STONITH），工业实例细化进 E2。
- **Chubby 文件系统接口细节（handles/check digits/ACL 继承）**：过于贴近 Chubby 论文实现，面试考察概率低，仅 S1 素材带一句"类 Unix 树形命名"。
- **DoorDash 容量估算数字**：PDF 中数字为图片无法提取文本，只保留"四角色 + 功能/非功能拆分"的答题框架素材。
- **DoorDash 入门两章（SDI 应试技巧/公司历史）**：非技术语料。
