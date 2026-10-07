# 批 38 种子 · Kafka 核心技术与实战（来源课程笔记 47 篇）

> 语料：胡夕《Kafka核心技术与实战》（极客时间，42 讲正文 + 开篇词/加餐/期末测试）。
> 查重基准：`src/data/backend.ts` be-mq 7 题（选型 / 不丢失 / 幂等 / 顺序 / 堆积 / 延迟事务 / Kafka 高吞吐）。
> 相邻查重：批 39（消息队列高手课 + RocketMQ）已收通用 MQ 与 Kafka/RocketMQ 对比主题；其 S2/S3/E6 已标注
> 「Kafka 存储细节 / ISR 与 Controller 细节 / Kafka 事务」与 Kafka 专项批次撞车——本批正是接盘方，
> 故本批不再出「Kafka vs RocketMQ 对比」类题，只做 Kafka 单边机制。
> 顺序写/零拷贝/批量压缩等与 be-mq-kafka-throughput 正面重复的内容一律归入「二、增强」或「三、丢弃」。

## 一、候选新题（现有题库未覆盖）

### S1. Kafka 的高水位是什么？为什么说它有缺陷，Leader Epoch 又是怎么补救的？
- 来源：27 _ 关于高水位和Leader Epoch的讨论、23 _ Kafka副本机制详解
- 核心素材：
  - 定义：LEO（Log End Offset）是副本「下一条待写入消息」的位移；高水位 HW 是分区层面界定消息可见性的位移——**位移 < HW 才是已提交消息，位移 = HW 的那条也不可见**；分区 HW = 其 Leader 副本的 HW，且任何副本 HW ≤ LEO。事务消息例外：消费可见性由 LSO（Log Stable Offset）判定，不只看 HW。
  - HW 推进规则：Leader 每次写入或收到 Follower 的 FETCH 后，取「所有 ISR 副本（含远程副本）LEO 的最小值」与当前 HW 取 max 更新；Follower 端则把自己的 HW 更新为 min(Leader 发来的 HW, 自己刚更新的 LEO)。Leader 所在 Broker 上保存全部远程副本的 LEO（不保存其 HW）。
  - 反直觉：Follower 的 HW 更新**天然滞后一轮 FETCH**——本轮拉取写入消息、下轮 FETCH 才能把上一轮的 HW 带回来，Leader 与 Follower 的 HW 更新在时间上错配，这是一系列「数据丢失/不一致」问题的根源。
  - 丢失场景（前提 min.insync.replicas=1）：A 是 Leader 收到 2 条消息，B 已写入但 HW 未及更新时 B 宕机；B 重启按旧 HW=1 截断日志删掉第 2 条；紧接着 A 宕机、B 被选为新 Leader；A 重启后同样截断到 1——位移 1 的消息在所有副本中被永久抹掉。
  - Leader Epoch（0.11 引入）：<epoch 单调递增版本号, start offset 该版本首条消息位移>，Broker 内存缓存 + checkpoint 文件持久化；副本重启后先向 Leader 发特殊请求取 Leader 当前 LEO，再结合 Epoch 条目判断**是否需要截断**，不再盲目按 HW 截断——上述丢失场景中 B 发现 Leader LEO 不小于自己 LEO 且无更大 Epoch 条目，跳过截断，消息保住。
  - 效果：0.11 后副本数据不一致类 Bug 明显减少。
- 建议追问：
  - 原理：手推一遍「1 Leader + 2 Follower」下一条消息的 HW 推进时序，说出为什么 HW 更新要多轮 FETCH。
  - 边界：min.insync.replicas=2 时上述丢失场景还成立吗？（写入需 ISR≥2 确认，单副本截断切主不会成为已提交消息的唯一天花板）——把参数组合与机制串起来。
  - 权衡：为什么社区不直接改成同步复制/多数派？（吞吐取舍；可延伸对比 Raft 类系统的 commit index 与 Kafka HW 的差异，接 be-distributed-consensus 相邻）
- 建议难度：advanced

### S2. ISR 是怎么动态伸缩的？「同步副本」的判定标准为什么是时间而不是消息条数？
- 来源：23 _ Kafka副本机制详解、36 _ 你应该怎么监控Kafka？
- 核心素材：
  - ISR（In-sync Replicas）是「与 Leader 保持同步的副本集合」，**必然包含 Leader 自己**，极端情况下 ISR 只剩 Leader 一个。
  - 判定标准：Broker 端参数 `replica.lag.time.max.ms`（默认 10 秒）——Follower 落后 Leader 的**时间间隔**不连续超过该值即算同步，哪怕它保存的消息条数明显少；同步过程持续慢于 Leader 写入速度、超时后即被踢出 ISR（收缩）；之后追上进度可自动加回（扩张）。ISR 是动态集合。
  - 与高水位的联动：分区 HW 计算要求副本「在 ISR 中」且 LEO 落后不超过 replica.lag.time.max.ms 两个条件同时成立——刚重启追上进度但尚未入 ISR 的副本不算，防止出现 HW > LEO。
  - Unclean 选举：ISR 全挂（含 Leader）时需要选主，把「所有不在 ISR 中的存活副本」（非同步副本）选为 Leader 即 Unclean Leader Election，由 Broker 端 `unclean.leader.election.enable` 控制——开启换可用性、必然可能丢数据；关闭保一致性、分区不可用。课程强烈建议保持 false，新版本默认即 false。
  - 这是一致性与可用性的用户自选开关：CAP 落到 Kafka 参数上的具体体现（呼应 be-distributed-cap）。
  - 运维信号：JMX 指标 `ISRShrink/ISRExpand` 频次——频繁高低抖动说明副本反复进出 ISR，要查网络/Follower 所在 Broker 负载（期末测试第 1 题：副本长期不在 ISR = Follower 追不上，查它与 Leader 的连接及其 Broker 负载）。
- 建议追问：
  - 原理：为什么 0.9 之后用「落后时间」而不是「落后条数」判定同步？（突发流量会误杀正常 Follower——条数阈值在瞬时高峰下把健康的 Follower 踢出 ISR，时间窗口天然容忍突发）
  - 边界：ISR 收缩到 1 时 acks=all 意味着什么？（退化为只等 Leader，等于 acks=1——引出 min.insync.replicas 联动，接 be-mq-no-loss）
  - 方案权衡：unclean 选举开还是关，什么业务敢开？（日志类可重推数据 vs 交易类）
- 建议难度：intermediate

### S3. Kafka 的 Controller 是怎么选出来的？它挂了怎么办，怎么防脑裂？
- 来源：26 _ 你一定不能错过的Kafka控制器、24 _ 请求是怎么被处理的？
- 核心素材：
  - 选举：集群中任意 Broker 启动时尝试在 ZooKeeper 创建 `/controller` 临时节点，**第一个创建成功的 Broker 成为 Controller**——抢占式而非投票式，任何时刻有且只有一个（对比批 39 S3 的「抢玉玺」说法与 Dledger Raft 投票）。
  - 职责五类：① 主题管理（创建/删除/增分区，kafka-topics 的后台执行者）② 分区重分配（kafka-reassign-partitions）③ Preferred 领导者选举（均衡 Leader 分布）④ 集群成员管理（Watch 监听 /brokers/ids 子节点变化感知新增；临时节点随会话消失感知宕机）⑤ 数据服务（Controller 持有最全集群元数据，推送给其他 Broker 更新缓存）。
  - 故障转移：Controller 宕机 → ZK 会话结束、/controller 临时节点被删 → 所有存活 Broker 重新抢占 → 新 Controller **从 ZK 重读全量元数据**初始化缓存后恢复工作，全程自动。
  - 0.11 重构：旧版多线程（每个 Broker 一条专属发送线程 + Watch 回调线程 + 主题删除 IO 线程）并发访问共享缓存，靠大量 ReentrantLock，Bug 丛生；重构为**单事件处理线程 + 事件队列**，缓存只被单线程碰，不再需要重量级同步；同时 ZK 写入从同步 API 改异步，写入性能提升约 10 倍。
  - 2.2 请求分级：控制类请求（LeaderAndIsr、StopReplica）会令数据类请求（PRODUCE/FETCH）失效，却和普通请求排队——Kafka 为两类请求建**两套独立的网络线程池 + IO 线程池 + 不同 listeners 端口**，控制请求可抢占处理（社区否决了「优先级队列」方案：队列满时高优先级请求照样进不来）。
  - 防脑裂：依托 ZK——监控指标 `ActiveControllerCount` 正常只能在某一台 Broker 上为 1；发现多台同时为 1 说明脑裂，先查网络连通性。运维窍门：主题删不掉、重分区卡住时不必重启 Broker，`rmr /controller` 删除节点即可触发重选举。
- 建议追问：
  - 原理：为什么用「ZK 临时节点抢占」就够，不需要 Raft 式多数派投票？（元数据最终以 ZK 为准，抢占只解决「谁来做」；对比 S4/批39 Dledger 投票的差异）
  - 边界：新 Controller 接管期间正在进行的分区重分配会怎样？（从 ZK 重读运维任务列表续做）
  - 权衡：KRaft/KIP-500 去 ZooKeeper 化的方向与代价（Controller 自治元数据 Quorum；课程开放讨论题方向）
- 建议难度：advanced

### S4. 一个 PRODUCE 请求到达 Broker 后是怎么被处理的？Purgatory 是干什么的？
- 来源：24 _ 请求是怎么被处理的？
- 核心素材：
  - Kafka 自定义二进制请求协议（2.3 版本已定义 45 种：PRODUCE/FETCH/METADATA/LeaderAndIsr/StopReplica…），全部走 TCP。
  - Reactor 架构：每 Broker 的 SocketServer 组件含 1 个 **Acceptor 线程**（只做分发，轮询公平派发）+ **网络线程池**（`num.network.threads`，默认 3，负责收发与解析）+ **共享请求队列** + **IO 线程池**（`num.io.threads`，默认 8，真正执行 PRODUCE 写日志 / FETCH 读页缓存或磁盘）+ 每个网络线程**专属响应队列**（请求共享、响应私有——分发线程不管回包）。
  - Purgatory（炼狱）：缓存**延时请求**——一时不能满足条件、不能立刻完成的请求。典型：acks=all 的 PRODUCE 要等 ISR 全部副本拉取后才能回；FETCH 在暂无新数据时 hold 住等消息到达（类似长轮询）。条件满足后 IO 线程继续处理并把响应放回对应网络线程的响应队列。
  - 控制类/数据类请求分离的原因：LeaderAndIsr 到达时，积压的 acks=all PRODUCE 只能在 Purgatory 里耗到超时；若控制请求优先，Broker 立刻抛 NOT_LEADER_FOR_PARTITION 让客户端快速失败。实现是复制一套完整组件（两套线程池 + 独立端口/listeners），而非优先级队列。
  - 调优落点：监控 `NetworkProcessorAvgIdlePercent` 与 `RequestHandlerAvgIdlePercent`，长期低于 30% 就要加线程或分流（接 S11）。
- 建议追问：
  - 原理：对照 Doug Lea 的 Reactor 模型说出 Kafka 各组件的对应关系（Acceptor=Dispatcher、网络线程池=工作线程池），以及为什么 IO 线程不直接做网络读写。
  - 边界：acks=all 的请求在 Purgatory 里等待期间 Leader 换人了会怎样？（控制请求分离前后行为对比——超时 vs 快速失败）
  - 权衡：为什么社区拒绝「优先级队列」方案？（队列满时高优先级饿死；整组件复制的代价是资源与复杂度）——与 be-network-io-multiplexing 相邻，本题主轴是 Kafka 线程模型与 Purgatory 语义。
- 建议难度：intermediate

### S5. 消费者组重平衡的全流程是什么？为什么说它是一次 STW、为什么这么慢？
- 来源：15 _ 消费者组到底是什么？、25 _ 消费者组重平衡全流程解析、17 _ 消费者组重平衡能避免吗？
- 核心素材：
  - 触发条件 3 个：组成员数变化（最常见的 99%）、订阅主题数变化（正则订阅匹配新主题）、订阅主题分区数增加。组每次启动必然触发一轮。
  - 协调者 Coordinator 是 Broker 端组件（每个 Broker 都有），定位算法两步：`partitionId = abs(groupId.hashCode() % offsetsTopicPartitionCount)`（默认 50 分区）→ 该分区 Leader 副本所在的 Broker 即 Coordinator。知道算法的意义：排查时能直接定位承载该组的 Broker 日志。
  - 两阶段：**JoinGroup**——所有成员上报订阅信息，Coordinator 选一个成员当 Leader Consumer（通常是第一个发请求的；注意与「Leader 副本」无关），由它**制定分区分配方案**；**SyncGroup**——Leader 把方案放进 SyncGroup 请求上交，Coordinator 统一下发给全部成员。分配逻辑在消费者端而非服务端执行。
  - 通知机制：Coordinator 决定重平衡后，把 REBALANCE_IN_PROGRESS 封装进**心跳响应**；心跳线程是 0.10.1.0 从主线程剥离出来的独立线程，`heartbeat.interval.ms` 的真实用途是控制重平衡通知的及时性。组状态机五态：Empty / Dead / PreparingRebalance / CompletingRebalance / Stable；组回到 Empty 且停超 7 天，其过期位移会被定期删除（日志常见 "Removed … expired offsets"）。
  - 为什么是 STW：重平衡期间**所有**成员停止消费等待，如同 GC 的 stop-the-world；为什么慢：全量参与且默认不保留旧分配方案（无局部性），有几百成员的组重平衡一次要几小时的案例，社区当时无解——0.11 的 StickyAssignor 只是缓解（尽量保留旧分配），但早期 Bug 多。
  - Broker 端四个场景：新成员入组（心跳响应强制触发全员重平衡）、主动离组（LeaveGroup 请求）、崩溃离组（等 session.timeout.ms 才感知）、重平衡前要求成员先快速上报位移再走 JoinGroup。
- 建议追问：
  - 原理：分配方案为什么放在消费者端（Leader Consumer）算而不是 Coordinator 算？（解耦分配策略演进与 Broker 版本；策略如 Range/RoundRobin/Sticky 均为客户端逻辑）
  - 边界：组内成员数 > 分区数会怎样？（多出的实例空转分不到分区）；Coordinator 所在 Broker 挂了呢？（该分区 Leader 迁移，组重新 FindCoordinator）
  - 权衡：允许「部分成员在重平衡期间继续消费」的增量协作式重平衡（CooperativeStickyAssignor，2.4+）为什么是演进方向、又难在哪？（开放讨论题：两轮重平衡、语义复杂）
- 建议难度：advanced

### S6. 线上消费者组频繁重平衡（重平衡风暴），你会怎么排查和治理？
- 来源：17 _ 消费者组重平衡能避免吗？、19 _ CommitFailedException异常怎么处理？、25
- 核心素材：
  - 治理目标：计划内的增减成员无法避免，要消灭的是「不必要重平衡」——绝大多数是被 Coordinator **误判死亡**或**消费超时**引发的。
  - 第一类：心跳不及时被踢。参数配方：`session.timeout.ms=6s`（课程推荐，默认 10s，越小越快揪出僵尸成员）+ `heartbeat.interval.ms=2s`，且保证 session.timeout.ms ≥ 3 × heartbeat.interval.ms（被判死前至少发 3 轮心跳）。
  - 第二类：消费太慢主动离组。`max.poll.interval.ms`（默认 5 分钟）内没消费完 poll 返回的一批 → 消费者主动离组。配方：下游单条处理最长 2s × max.poll.records 500 = 一批要 1000s，那 max.poll.interval.ms 就要调到 1000s 以上，或把 max.poll.records 降到 150。四板斧：缩短单条处理耗时 > 调大 max.poll.interval.ms > 调小 max.poll.records > 多线程加速消费（最难，位移提交易错，接 S9）。
  - 参数设计演进：0.10.1.0 前消费超时与存活判活共用 session.timeout.ms，两者诉求冲突；引入 max.poll.interval.ms 把「消费能力」从「存活性」中剥离。
  - CommitFailedException：组已重平衡、分区已归他人时提交位移必抛。经典文案就是排查线索（poll 间隔超 max.poll.interval.ms）；冷门场景——Standalone Consumer 与消费者组撞了相同 group.id，提交必抛且四板斧全部无效（大型公司多团队共用集群时的坑）。
  - 还有别踢人的：频繁 Full GC 的长停顿会让心跳线程/主线程停摆——参数都对还重平衡就去查 GC（kafkaServer-gc.log）。
  - 监控印证：消费者组 join rate / sync rate 指标持续偏高即重平衡频繁。
- 建议追问：
  - 原理：为什么「调大 session.timeout.ms」是双刃剑？（真宕机的接管时间变长，消费中断窗口扩大——用 max.poll.interval.ms 承接消费慢，而不是放大 session）
  - 边界：max.poll.records 调小的副作用？（单次 poll 的批变小，吞吐下降、网络往返变多——吞吐与重平衡风险的折中）
  - 方案权衡：Static Membership（group.instance.id）为什么能从根上减少重平衡？（重启后 Broker 认识老实例 ID 不触发重分配；代价是故障接管变慢）——按 原理→边界→权衡 顺序追问完可自然引到版本演进。
- 建议难度：intermediate

### S7. __consumer_offsets 是个什么主题？为什么位移要放在 Kafka 自己身上？
- 来源：16 _ 揭开神秘的“位移主题”面纱、15、18
- 核心素材：
  - 演进动机：老版本 Consumer 位移存 ZooKeeper——ZK 是元协调框架，**不适合高频写**，位移提交恰恰是高频写操作，会拖垮 ZK；0.8.2.x 起改为存 Kafka 内部主题（Kafka 天然满足高持久 + 高频写，等于「用自己存储自己」）。
  - 本质：位移主题就是普通 Kafka 主题（可创建/修改/删除），但消息格式由 Kafka 定义、用户不可写——自己写 Producer 乱写会导致 Broker 解析失败崩溃。Key 三元组 `<Group ID, 主题名, 分区号>`，Value 为位移值+元数据（时间戳等）；另有注册组用的消息与 **tombstone 墓碑消息**（Value 为 null，组全员停止且位移删除后写入以彻底清除组）。
  - 自动创建时机：集群第一个 Consumer 启动时；分区数 `offsets.topic.num.partitions` 默认 50、副本数 `offsets.topic.replication.factor` 默认 3。不建议手动建（源码硬编码 50 的历史坑）。
  - 清理策略：自动提交下无新消息也会不停写入相同位移（如永远 100），必须去重——用 **Compact（压实）** 策略：同 Key 只留最新一条，由后台 Log Cleaner 线程巡检执行。位移主题无限膨胀的常见根因就是 Log Cleaner 线程静默挂掉（监控点：jstack 看 kafka-log-cleaner-thread）。
  - 位移提交的两条路径（自动 enable.auto.commit=true，默认 5s 一次；手动 commitSync/commitAsync）最终都是向位移主题写消息——位移提交的语义由用户负责（详见增强 E1）。
- 建议追问：
  - 原理：Compact 和 Compression 的区别？（压实=按 Key 保留最新值，压缩=编码压缩比——术语辨析本身就是考点；为什么位移主题适合 Compact 而不适合普通 retention）
  - 边界：位移主题分区数为什么默认 50？（承载组数量 × 每组写入频率的并行度；组定位取模依赖它，改了会乱）
  - 权衡：把内部元数据放「Kafka 自家主题」 vs 外部存储（ZK）各牺牲了什么？（内部主题自举依赖与 Compact 运维 vs ZK 的写瓶颈——「自己吃自己的狗粮」哲学）
- 建议难度：intermediate

### S8. Kafka 的幂等生产者和事务生产者分别解决什么问题？是一回事吗？
- 来源：14 _ 幂等生产者和事务生产者是一回事吗？
- 核心素材：
  - 交付语义三档：at most once（禁重试即可实现，宁丢不重）/ at least once（默认——消息已提交但 ack 网络抖动丢失时 Producer 只能重试，必然可能重复）/ exactly once。
  - 幂等生产者（0.11+）：`enable.idempotence=true` 一键开启，Broker 端多存字段（业界共识为 PID + 分区内序列号）识别重复消息并静默丢弃，可安全重试。**范围限制是考点：只保证单分区、单会话**——跨分区无能为力，Producer 进程重启（新会话）保证即失效。
  - 事务生产者：补齐跨分区、跨会话。两个配置：enable.idempotence=true + `transactional.id`（有意义的名字）；代码四步 initTransactions / beginTransaction / send… / commitTransaction，异常走 abortTransaction。保证多条消息**原子地**写入多个分区，且进程重启后依然保证。
  - 消费端配合：`isolation.level=read_uncommitted`（默认，什么都可见）/ `read_committed`（只见事务成功提交的消息 + 非事务消息）。注意：事务 abort 后消息**仍写入了底层日志**，只是靠控制消息与 LSO 对 read_committed 消费者隐藏——「精确一次」是消费可见性层面的。
  - 近似数据库 read committed：保证无脏读脏写；Kafka 事务主要服务 read-process-write 的流处理链路，性能开销大于幂等生产者，不要无脑开启。
- 建议追问：
  - 原理：为什么幂等生产者只能在单分区单会话内防重，事务加一个 transactional.id 就能跨会话？（transactional.id 让 Broker 能把新会话与旧 PID 关联并 fencing 旧会话）
  - 边界：事务保证的是「写 Kafka 原子可见」，它和「本地事务与发消息的原子性」是两个问题——后者是 RocketMQ 事务消息/本地消息表的事（与批 39 E6 的对比素材互认，衔接 be-mq-idempotent「跨系统无传输层 EOS」结论）。
  - 权衡：什么场景值得上事务？（Kafka Streams 状态变更与输出同事务；普通业务消息用幂等 + 消费端幂等通常够，事务的吞吐代价要先测）
- 建议难度：advanced

### S9. KafkaConsumer 不是线程安全的，那消费者怎么做多线程？两种方案怎么选？
- 来源：20 _ 多线程开发消费者实例
- 核心素材：
  - 设计前提：KafkaConsumer 是线程安全的反面教材级单线程设计（0.10.1.0 后仅额外有心跳线程），网络 IO 全在用户主线程；跨线程共享实例抛 ConcurrentModificationException，唯一例外是 `wakeup()`（用于安全关闭）。单线程的原因：非阻塞轮询模型（流处理 filter/join 需要非阻塞）、处理逻辑多线程化交由用户决定、便于移植。
  - 方案一「每线程一个 Consumer 实例」：粗粒度，线程完整执行获取+处理。优点：实现简单、无线程安全问题、**天然保证分区内顺序**（分区与线程一一对应）。缺点：资源开销大（连接/内存）；线程数受总分区数上限约束；消息处理重了容易触发非预期重平衡（整组停滞）。
  - 方案二「poll + Worker 线程池」：细粒度，poll 线程把消息 submit 给处理线程池。优点：获取与处理独立伸缩，高吞吐。缺点：①**破坏分区内顺序**（Worker 并发处理）；②位移提交困难——poll 线程提前自动提交时 Worker 还没做完就是「假完成」，多线程异步处理下自动提交位移是隐蔽丢消息场景；③实现复杂度高（Flink 集成 Kafka 就是自建 KafkaConsumerThread 多线程，位移处理是最难的部分）。
  - 选型口诀：在意顺序/逻辑轻 → 方案一；吞吐瓶颈在处理逻辑且不在乎顺序 → 方案二 + 手动提交位移（且位移提交时机要等 Worker 完成）。
- 建议追问：
  - 原理：为什么 KafkaConsumer 要做成非线程安全/单线程？（简化设计、把并行策略留给用户；老版本 Scala Consumer 的多 Fetcher 线程 + 阻塞迭代器教训）
  - 边界：方案二怎么把「丢/重」都兜住？（关自动提交 + Worker 完成后按分区收集最小位移手动提交 + 消费幂等兜底——接 be-mq-idempotent）
  - 权衡：多线程 vs 直接多进程多实例？（受分区数约束时多机扩展更自然；单机内多线程省资源但共享重平衡风险）
- 建议难度：intermediate

### S10. Kafka 集群你应该监控什么？Lag 和 Lead 为什么要一起看？
- 来源：36 _ 你应该怎么监控Kafka？、22 _ 消费者组消费进度监控都怎么实现？、37
- 核心素材：
  - 三维监控：①主机（Load/CPU/磁盘 IO/网络/TCP 连接数/文件句柄/inode）②JVM（Full GC 频率与时长、**Full GC 后活跃对象大小**——堆大小=该值×1.5~2 的依据、应用线程总数；Broker 堆 6-8GB 就够，16GB 堆的 GC 反而是灾难）③Kafka 集群本身。
  - 集群层四个动作：进程与端口、关键日志（server.log / controller.log / state-change.log）、关键线程（kafka-log-cleaner-thread 静默挂掉 → 位移主题膨胀；ReplicaFetcherThread 挂掉 → Follower Lag 持续增大）、关键 JMX。
  - 关键 JMX 清单：BytesIn/Out（接近网卡带宽即打满）；`UnderReplicatedPartitions` > 0（有分区副本未同步，可能丢数据的高危信号）；ISRShrink/ISRExpand 频次（副本反复进出 ISR）；`ActiveControllerCount`（必须恰好一台为 1，多台为 1 = 脑裂）；NetworkProcessorAvgIdlePercent / RequestHandlerAvgIdlePercent < 30% 要扩线程或分流。
  - 消费进度：Lag = 分区最新位移 − 组提交位移（分区级统计再汇总）；Lead = 消费位移 − 分区最早位移，与 Lag 一体两面。**引入 Lead 的动机**：Lag 增大只说明慢，Lead 逼近 0 说明要消费的消息快被 retention（默认 7 天）删了——一旦触发会位移重置（从头重放或直接跳丢），比「慢」严重得多。所以 Lag 100 万→200 万远不如 Lead 200→100 紧急。
  - Lag 恶性循环：Lag 大 → 要读的数据已不在页缓存 → 落盘读更慢 → Lag 更大（马太效应）。
  - 监控落地三法：kafka-consumer-groups.sh --describe（无 active 成员时 LAG 仍有效）/ AdminClient.listConsumerGroupOffsets + endOffsets 程序化计算 / JMX（records-lag-max、records-lead-min，分区级还有 avg），优先 JMX 接入 Zabbix/Grafana，Burrow、Kafka Manager 等框架为辅。
  - 客户端维度：先 ping RTT——真实案例 RTT 1s，调任何 Kafka 参数都没用；join rate/sync rate 反映重平衡频率。
- 建议追问：
  - 原理：为什么监控 Lead 这么重要？（retention 删除 + 位移重置的两个灾难分支：全量重放 vs 静默跳丢）
  - 边界：UnderReplicatedPartitions 持续 > 0 的可能根因链？（Follower 追不上 → Broker 负载/网络 → replica.fetchers 不足，接 S11）
  - 方案权衡：自建Exporter 读 JMX vs 用 Burrow/三方框架？（接入成本 vs 定制性；大规模集群建议 JMX + 统一告警平台）
- 建议难度：intermediate

### S11. 给你一个 Kafka 集群做性能调优，从哪几层下手？吞吐和延时的参数方向为什么常常相反？
- 来源：38 _ 调优Kafka，你做到了吗？、08 _ 集群参数配置（下）、07（上）、06 _ 线上集群部署
- 核心素材：
  - 优化漏斗（效果自上而下衰减）：应用层代码 > 框架层参数 > JVM 层 > 操作系统层。
  - OS 层：文件系统 XFS（优于 ext4）+ 挂载 noatime；swappiness 设 1 而不是 0——留一丝 swap 避免内存耗尽时 OOM Killer 无预警杀进程，且性能劣化可观测；ulimit -n 调大（Too many open files）；vm.max_map_count=655360（主题多时防 OutOfMemoryError: Map failed）；**页缓存 ≥ 一个日志段大小（log.segment.bytes 默认 1GB）**，保证消费命中页缓存。
  - JVM 层：堆 6-8GB、G1（0.9 起默认，Full GC 单线程极慢必须避免，-XX:+PrintAdaptiveSizePolicy 查元凶；消息体大时防 humongous allocation 调 G1HeapRegionSize）。
  - 应用层三法则：Producer/Consumer 实例复用（构造开销大）、用完关闭防资源泄漏、Producer 线程安全可多线程共享而 Consumer 不行。
  - 吞吐 vs 延时方向相反的参数表：吞吐——batch.size 调大（默认 16KB 太小）+ linger.ms 攒批 + LZ4/zstd 压缩 + num.replica.fetchers 加大（**acks=all 吞吐的首要瓶颈是副本同步速度**）+ 不设 acks=all 不开重试；延时——linger.ms=0、不压缩、fetch.min.bytes=1、同样加大 num.replica.fetchers。微批的定量：等 8ms 攒 1000 条，单条延时 2ms→10ms（×5）但 TPS 500→10 万（×200）——批处理思想。
  - 版本一致性也是调优：客户端与 Broker 版本不一致会丢零拷贝（消息格式转换既重压缩又丢 sendfile）。
  - 1.1+ 动态参数（read-only / per-broker / cluster-wide 三档）：突发流量时在线调大 num.io.threads/num.network.threads，无需重启 Broker。
  - 排查案例：某天消费吞吐骤降、磁盘读 IO 飙升——一个测试 Console Consumer 污染了页缓存，主业务 Consumer 从页缓存命中跌落到物理磁盘。
- 建议追问：
  - 原理：为什么「页缓存大比堆大」对 Kafka 更重要？（Broker 主要内存诉求是页缓存不是堆，堆只放 ByteBuffer 等瞬时对象——呼应 be-mq-kafka-throughput 的页缓存设计但不重复原理）
  - 边界：swappiness=0 和 =1 的真实差别？（0 = 内存耗尽直接 OOM Kill 无预警；1 = 有可观测的劣化缓冲）
  - 方案权衡：容量规划速算——千兆网卡 1Gbps，Kafka 限用 70%（防丢包）再留 2/3 余量 ≈ 240Mbps/台 → 1 小时 1TB 目标需约 10 台，3 副本 ×3 = 30 台；磁盘容量 = 日增消息量 × 副本数 × 留存天数 × 1.1（索引余量） × 压缩比。让你从零规划集群，先算哪笔账？
- 建议难度：advanced

## 二、既有题增强素材（be-mq 7 题的追问可加内容）

### E1. 目标题目：be-mq-no-loss（如何保证消息不丢失？完整链路）
- 来源：11 _ 无消息丢失配置怎么实现？、18 _ 位移提交、36
- 追问素材：
  - 责任边界的标准表述（先立规则再谈方案）：Kafka 只对「**已提交**的消息」做「**有限度**」的持久化保证——已提交=若干 Broker（由 acks 定义）成功写入并应答；有限度=保存该消息的 N 个副本至少 1 个存活。用这两把尺子判断「丢消息」到底是谁的锅。
  - 8 条配置最佳实践完整版（可整体搬进追问答案）：Producer 用 send(msg, callback) 杜绝 fire-and-forget；acks=all；retries 调大；Broker unclean.leader.election.enable=false；replication.factor≥3；min.insync.replicas>1；**replication.factor = min.insync.replicas + 1**（相等时挂一台整个分区即不可用）；Consumer 先消费后提交（enable.auto.commit=false）。
  - 隐蔽丢失场景「多线程异步处理」：Consumer 收到消息交给多线程处理，自动提交位移照常前移，某个线程处理失败 → 该消息已被「书签跳过」——多线程场景必须手动提交位移（10 个朋友帮你读书、有人撒谎的比喻可直接引用）。
  - 设计缺陷级角落：扩分区后 Producer 先于 Consumer 感知新分区 + auto.offset.reset=latest → 感知窗口内发到新分区的消息全部不可见（期末测试开放讨论，适合作为「acks=all 还有哪些角落」的进阶答案）。
  - 位移提交 API 的工程细节（追问「先消费后提交会不会影响 TPS」时用）：commitSync 阻塞且自动重试（适配瞬时错误）；commitAsync 不阻塞但**失败不自动重试**——重试提交的可能早已过期的位移，重试无意义；标准范式 = 循环内 commitAsync + finally 中最后一次 commitSync；大批量时用带 Map 参数的细粒度提交（每处理 100 条提交一次，把重放窗口缩小）；提交的是「下一条消息的位移」（record.offset()+1）。

### E2. 目标题目：be-mq-idempotent（消息为什么会重复？消费端幂等）
- 来源：14 _ 幂等生产者和事务生产者、11
- 追问素材：
  - 「Kafka 默认为什么是 at-least-once」的机制级回答：消息已提交但 Broker 应答在网络抖动中丢失 → Producer 无法区分「没写到」还是「写到没收到 ack」，唯一安全动作是重试 → 重复必然存在。
  - 反向选项：允许偶发丢失但绝不重复的场景（如 PV 统计）可关闭重试退化成 at-most-once——「语义档位是可以用重试开关换的」。
  - 传输层去重的范围边界：enable.idempotence=true 只保单分区单会话，Producer 重启或跨分区都不保——所以「Broker 端幂等」不能替代「消费端幂等」，与现有答案「跨系统永远做不到传输层精确一次」互相印证（详见 S8）。

### E3. 目标题目：be-mq-order（如何保证消息的顺序消费？）
- 来源：09 _ 生产者消息分区机制、20 _ 多线程开发消费者实例
- 追问素材：
  - 真实改造案例（量化收益）：国企因果序消息用单分区保全局序，牺牲全部吞吐；改为按消息体业务标志位提取成 Key + 自定义 Partitioner（同 Key 同分区），**吞吐提升 40 多倍**——「分区有序 + 业务键提取」的标准话术弹药。
  - 默认分区策略的准确描述：指定 Key 按 Key 哈希取模进同分区（保序），未指定 Key 轮询（均匀）；自定义实现 partitioner.class 实现 partition() 方法。
  - 消费端多线程对顺序的影响：方案一（每线程独占 Consumer）分区与线程一一对应天然有序；方案二（poll+线程池）Worker 并发破坏分区内序——顺序业务的消费端并行只能加实例/加分区，不能在实例内开 Worker 池（与现有答案「该分区单线程消费」呼应并给出实现级解释）。

### E4. 目标题目：be-mq-backlog（消息大量堆积怎么办？）
- 来源：22 _ 消费进度监控、30 _ 怎么重设消费者组位移、36
- 追问素材：
  - Lag 的标准定义与口径：分区级 Lag = LOG-END-OFFSET − CURRENT-OFFSET，主题级需手动汇总；kafka-consumer-groups --describe 输出里 CONSUMER-ID/HOST 为空 ≠ 命令失败，只是组内无 active 成员，LAG 仍有效（告警脚本要按此写）。
  - 紧急度排序：**Lead 逼近 0 比 Lag 增大更紧急**（消息即将被 retention 删除，随后位移重置导致全量重放或直接跳丢）；Lag 增大有马太效应（超出页缓存后落盘读更慢）。
  - 堆积止损后的回放工具箱：位移重设 7 策略——Earliest（重放全部，注意最早位移未必是 0）/ Latest（跳过全部历史）/ Current（回到已提交处）/ Specified-Offset（跳过毒消息）/ Shift-By-N（相对跳）/ DateTime（回到某时间点）/ Duration（PnDTnHnMnS ISO-8601）；API 用 seek 系列逐分区，命令行 kafka-consumer-groups --reset-offsets（Kafka 必须先停组，RocketMQ 可不停——与批 39 E5 互认）。
  - 扩分区的连带提醒：分区数变更会触发订阅该主题的所有消费者组重平衡，扩容窗口内消费会暂停（接 S5/S6）。

### E5. 目标题目：be-mq-kafka-throughput（Kafka 为什么吞吐这么高？）
- 来源：38 _ 调优Kafka、10 _ 压缩算法、08、36
- 追问素材：
  - 运维反例「页缓存污染」：测试 Consumer 从很旧的位置拉数据，把热数据页挤出页缓存，主业务消费从内存命中跌落到磁盘读、吞吐骤降——对应现有追问「页缓存会带来什么运维坑」的具体案例（与批 39 E8 的「挖坟」同构，可合并表述）。
  - acks=all 的吞吐瓶颈定位：首要因素是副本同步速度，`num.replica.fetchers`（Follower 拉取线程数，默认 1）调大常能直接提升 Producer 吞吐——「可靠性档位开最高后，性能优化对象从网络层转到复制层」。
  - Broker 端意外重压缩的两个触发点（Broker CPU 飙升排查项）：Broker 配置了与 Producer 不同的 compression.type（默认 producer 即尊重发送端）；消息格式转换（兼容老客户端 V1↔V2），后者还会丢零拷贝。京东曾提议去掉校验用解压（Broker CPU 可降 50%+）被社区拒绝——「正确性优先于性能」的论据。
  - 微批的定量表述：延迟 2ms→10ms（×5）换 TPS 500→10 万（×200）；消息在内存缓冲攒批（纳秒级）远快于网络发送（毫秒级），所以等一小会儿能攒很多——「为什么 linger.ms 值得开」的原理级答案。

### E6. 目标题目：be-mq-why-and-choose（为什么要用消息队列？怎么选？）
- 来源：30 _ 怎么重设消费者组位移、02、期末测试
- 追问素材：
  - Kafka 特有维度「可重演（replayable）」：基于日志结构、消费是只读操作、位移由消费者控制，可反复重放历史——传统 MQ（RabbitMQ/ActiveMQ）消费即删除（destructive）不可重放。选型口诀（30 讲）：处理逻辑复杂/代价高/不在乎顺序 → 传统 MQ；高吞吐/单条处理短/在乎顺序 → Kafka。
  - 高频追问「Kafka 为什么不像 MySQL/Redis 做读写分离」的标准答案：①场景不是读多写少，Follower 抗读无收益；②异步拉取有滞后，开放读会破坏 Read-your-writes 与单调读——顺带把 23 讲「Follower 不对外服务」的两个设计理由（方便实现 Read-your-writes、单调读）背下来，这是一题两用的素材。

### E7. 目标题目：be-mq-delay-tx（延迟消息和事务消息的实现原理）
- 来源：14 _ 幂等生产者和事务生产者
- 追问素材：
  - 补齐「Kafka 事务」侧的使用面细节（与批 39 E6 的协调器对比素材配合）：transactional.id + initTransactions/beginTransaction/commitTransaction/abortTransaction 四步 API；abort 的消息仍会写入日志，靠 read_committed 隔离级别 + LSO 对消费者隐藏——「Kafka 事务的原子性是消费可见性层面的，RocketMQ 半消息的原子性是投递生命周期层面的」。
  - Kafka 没有延迟消息能力的表述弹药：延迟类需求在 Kafka 生态要靠上游调度或外层时间轮组件，这也常被用作「Kafka 不适合业务交易类消息」的论据（衔接现有答案的功能对比段）。

### E8. 目标题目：be-mq-no-loss 的追问「acks=all 就一定不丢吗？」
- 来源：27 _ 高水位和 Leader Epoch
- 追问素材：
  - 机制级深挖答案：acks=all 的「已提交」边界是高水位 HW，而 Follower 的 HW 更新滞后一轮 FETCH（时间错配）；min.insync.replicas=1 时，Follower 重启按旧 HW 截断 + 连锁切换 Leader，可使**已 ack 的消息**在所有副本中被抹掉——0.11 的 Leader Epoch 机制（先查 Leader LEO 再决定截断）堵住该窗口。把「配置组合答案」升级成「机制答案」，是这题的满分分水岭（完整推导见 S1）。

## 三、主动丢弃
- 10 _ 压缩算法主体（压缩发生位置/算法吞吐与压缩比排序 LZ4>Snappy>zstd>GZIP 等）：批 39 E7 已收「压缩即批 + 算法选择」，正面重复；仅 Broker 意外重压缩与京东 bugfix 两点保留进 E5。
- 13/21 _ 生产者/消费者 TCP 连接管理（连接创建时机、FindCoordinator 选负载最小 Broker、连接数计算）：客户端内部实现细节，面试考察率低；FindCoordinator 已并入 S5 素材。
- 12 _ 客户端拦截器：作者自述「从未在生产见到应用」，小众功能；端到端延时统计思路一句话可并入 E4/监控题，不独立出题。
- 28 _ 主题管理、31 _ 工具脚本大汇总、32 _ AdminClient：命令行运维教学，命令细节不适合面试题（运维操作能力 ≠ 面试考察点）。
- 29 _ 动态配置主体：低频运维知识点，仅「read-only/per-broker/cluster-wide 三档 + 在线调线程池」并入 S11。
- 33 _ 认证机制（SASL/SCRAM/Kerberos/OAUTHBEARER）、34 _ 云环境 ACL 授权：安全专项，与现有题库方向无对应领域题，宁丢不重。
- 35 _ MirrorMaker 跨集群备份：小众运维方案，无对应面试主题。
- 39/41/42 _ Kafka Connect/Streams DSL/金融案例 与 40 的 EOS、流表二元性、窗口：bd-flink 流处理批次撞车；40 讲最有价值的「Streams 是客户端库不是平台（无资源管理器、只连 Kafka）vs Flink 完整平台」选型对比转介 bd-flink。
- 01/03/04/05 _ 消息引擎定位、发行版选择（Apache/Confluent/云厂商）、版本号演进：基础认知与运营内容，选型已被 be-mq-why-and-choose 承载，版本演进无独立考察价值。
- 期末测试/开篇词/结束语/用户故事：测试题与运营内容；期末 5 道简答的可用素材（acks 三值、消费者组定义、读写分离、ISR 排查）已分别并入 E6/E8/S2。
