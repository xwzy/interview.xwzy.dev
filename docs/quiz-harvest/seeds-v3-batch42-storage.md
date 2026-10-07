# 批 42 种子（下） · Grokking Advanced SD 存储系统（Dynamo/Cassandra/BigTable/GFS/HDFS）

> 来源 agent 收割于 2026-10-07。出处：`/Users/wzy/Downloads/private-notes/工作学习/【00】面试/【8】educative.io/Grokking the Advanced System Design Interview/` 下 Dynamo（10 篇精读 6 篇）、Cassandra（10 篇精读 5 篇）、BigTable（13 篇精读 7 篇）、GFS（13 篇精读 8 篇）、HDFS（10 篇精读 4 篇 + interview.txt）。
> 定位：**论文级机制深挖**。查重基准：sd-classic-distributed-kv（分布式 KV 设计概览）、sd-classic-object-storage（对象存储/EC/checksum）、be-distributed-quorum（已一句话提到 sloppy quorum/hinted handoff/read repair/Merkle）、be-distributed-consistent-hash、cs-db-lsm（LSM 原理 + 三放大 + 墓碑至最后一层）、sd-paper-*（Chubby/Gossip/WAL）。本批与批 47（分布式数据库 30 讲）零重叠：47 批讲 NewSQL 产品语境，本批讲四大存储系统的**内部机制原文**，整合时可互为追问链。

## 一、候选新题（现有题库未覆盖）

### S1. Dynamo 的向量时钟是怎么裁决冲突的？为什么把"合并"丢给客户端？
- 来源：Dynamo · Vector Clocks and Conflicting Data + Replication + The Life of put()/get()
- 核心素材：
  - 为什么不能用墙钟：分布式下 clock skew，NTP 也无法保证任意时刻全同步，没有 GPS/原子钟硬件时时间戳不可信——向量时钟用 **(node, counter) 对**代替时间，为每个对象的每个版本挂一个时钟。
  - 裁决规则：若版本一的各计数器 ≤ 版本二对应节点全部计数器，则一为二的祖先，**可被直接覆盖**（如 [A:2] 覆盖 [A:1]）；否则两条分支**并发冲突**，系统不猜，把所有版本一起返回。经典序列：分区前 [A:2]，分区内 A 写出 [A:3]、B 写出 [A:2][B:1]，网络愈合后读请求看到两个互不支配的版本。
  - **读时裁决、客户端合并（semantic reconciliation）**：put 流程 = 协调者生成新版本 + 向量时钟分量 → 本地存 → 发 N−1 个最高优先级健康节点 → 收 W−1 个确认即成功；get 流程 = 问 N−1 个节点 → 等 R−1 个回复 → 按向量时钟做语法归并 → **返回所有相关版本**让客户端收敛（官方类比 Git：能自动 merge 就自动，不能就人来解冲突）。
  - 购物车案例的两个副作用：add 一定不丢（合并=并集），但**已删除的商品可能复活**；这正是催生 CRDT 的原因——把数据建模成"任意顺序合并结果相同"（删除建模为负数 add），达到 strong eventual consistency（Riak 内建 CRDT）。
  - 向量时钟的工程边界：版本分支多时时钟膨胀，Dynamo **从最老的开始截断**；若截掉的时钟恰是收敛所需的祖先，最终一致性就破了——论文作者承认是隐患但称生产未出过事。服务端自动裁决的替代方案是 **LWW（按墙钟时间戳）**，两个并发写撞车相当于抛硬币丢数据。
- 建议追问：① [A:3] 和 [A:2][B:1] 谁更新？系统为什么不替用户选？（互不支配 → 并发；语义只有应用知道）→ ② 时钟膨胀截断为什么可能破坏最终一致？（丢了判祖先的依据，并发分支会被误判成新版本覆盖）→ ③ 什么数据适合 LWW、什么必须多版本？（可容忍回退的元数据 vs 购物车/协同编辑）
- 建议难度：advanced

### S2. Sloppy quorum + hinted handoff：Dynamo 的"永远可写"是怎么实现的，代价是什么？
- 来源：Dynamo · Replication + The Life of put()/get()
- 核心素材：
  - preference list：负责一个 key 的节点列表，**比 N 长**以备故障，且**跳过虚拟节点**保证列表里是不同物理机；put/get 都发给"列表前 N 个**健康**节点"——不一定是最顺时针的前 N 个，这就是 sloppy quorum。
  - hinted handoff 机制链：Server 1 宕 → 副本写到 Server 4，元数据里带**hint 标明真正归属**；4 把 hint 副本放**独立本地库**周期扫描，发现 1 恢复就补送，送达后从本地删除——**系统总副本数不减**；极端情况全环只剩一台机器写请求照样受理（"always writeable"）。
  - 写协调者的选择技巧：不强制第一个节点协调（负载会倾斜），而是**选上一个读请求里响应最快的节点**来协调后续写（上下文里记着）——顺带提升 read-your-writes 命中率。
  - 代价（必须讲全）：sloppy 不是严格多数派，**两个并发写可能落到不相交的节点集合**，读到的就是分歧数据——所以 sloppy quorum 必须和向量时钟配对，收敛靠读修复/反熵兜底；另有持久性脆弱窗口（W 小时写确认只落在少数节点）。
  - (N,R,W) 配置语义：常用 (3,2,2)；(3,3,1) 写快读慢不耐用、(3,1,3) 读快写慢耐用；延迟取决于 R/W 个副本里**最慢的那个**，所以 R/W 通常配得比 N 小。
- 建议追问：① strict quorum 在节点宕机时为什么会不可用，sloppy 牺牲了什么换的？（不再保证读写集合相交 → 一致性窗口）→ ② hint 副本送达前那个节点又宕了，数据会怎样？（独立库随节点丢失 → 持久性靠 W 与反熵补）→ ③ "最快响应者协调写"为什么能提升 read-your-writes？（它刚读过最新值，写它会最快携带完整上下文）
- 建议难度：advanced

### S3. Cassandra 的一次写和一次读分别发生了什么？为什么"写便宜读贵"？
- 来源：Cassandra · Anatomy of Write/Read Operation + Compaction
- 核心素材：
  - 写路径四步：① append 到磁盘上的 **commit log（WAL，写不进就算失败）**；② 写入内存 **MemTable**（按 partition key + clustering columns **排序**存放，每张表一个，兼作 write-back cache）；③ 落 ack 回协调者；④ 周期性 flush 成不可变 **SSTable**（名字来自 BigTable 的 Sorted String Table），commit log 对应段随之清除。
  - 写便宜的本质：全程**只有顺序追加，没有任何"读出-改-写回"**；SSTable 不可变所以删改都是"再写一条"；compaction 用顺序 I/O 在后台摊销重整——"如果 Cassandra 俊乎乎地把每个值插到它最终该在的位置，客户端就得当场付 seek 的钱"。
  - 读路径逐层：Row cache（整行，命中即回）→ **每个 SSTable 的 Bloom filter**（内存中挡掉"肯定没有"）→ Key cache（partition key → SSTable 内 offset，极省内存）→ **Partition index summary**（内存，key range → 索引文件 offset）→ Partition index file（磁盘，有序 key → 数据 offset）→ Data file；最后还要**把 MemTable 与多个 SSTable 的结果做归并**——读的成本随 SSTable 个数增长，这是"读贵"的来源。
  - key=12 的三级跳实例：summary 查到 range 10-21 → offset 32 跳索引文件 → 索引查到 12 → offset 3914 跳数据文件——内存 summary 换磁盘随机读的典型分层。
  - compaction 策略三选：**SizeTiered**（默认，同尺寸 SSTable 凑批合并，插入型负载）；**Leveled**（分层每层 10 倍容量，读友好写放大高）；**Time Window**（时序数据按时间窗合并，过期后窗口整体不可变）。
- 建议追问：① 为什么读放大正比于"该 key 出现过的 SSTable 个数"，Bloom filter 能挡住什么挡不住什么？（假阳性仍要查盘，且命中的那几个文件全要归并）→ ② commit log 为什么不能在写 MemTable 后立刻删对应段？（flush 未完成时宕机要重放）→ ③ 读多写少的表该换哪种 compaction，为什么？
- 建议难度：intermediate

### S4. 在 Cassandra 里执行一次 DELETE，系统里到底发生了什么？
- 来源：Cassandra · Tombstones + Compaction + Consistency Levels（hinted handoff 细节）
- 核心素材：
  - 问题起点：删除发生在节点宕机时，该节点错过 delete；它恢复后参与 repair，会把"已被删的数据"当新数据**复活（resurrect）**给其他节点——必须有一种"我删过"的可传播标记。
  - tombstone = **一次 update 而不是物理删除**：给数据盖一个带过期时间的墓碑（默认 **10 天**）；10 天的存在期是给宕机节点留的恢复窗口——超过窗口没回来的节点按失败处理（换掉），而不是让它带着旧数据回来。
  - 真正清除在 compaction：墓碑过期后合并时**不再向下传播**，数据才物理消失。
  - 两个工程代价：① 删除反而**增加**存储（墓碑本身是记录，大批删除时可用空间骤减）；② 大量墓碑让读要扫过更多无效数据，严重时读超时——"删多了的表读不动"是 Cassandra 运维的经典事故。
  - 对照组：hinted handoff 只保留 **3 小时**（可配/可关），超时即丢弃、靠读修复补——hint 管"短期抖动"，墓碑管"删除语义"，两者时间窗口是两套设计。
- 建议追问：① gc_grace 10 天和 hint 3 小时的窗口为什么差两个数量级？（hint 丢了丢的是"一次写"，墓碑丢了丢的是"删除语义"——复活比丢写更恶心）→ ② 批量删全表数据的正确姿势？（分批 + 调低 gc_grace + 主动 compaction/repair）→ ③ 和 cs-db-lsm 里"墓碑必须撑到最后一层"说法怎么统一？（LSM 讲合并层级维度，Cassandra 再叠加副本修复时间维度）
- 建议难度：intermediate

### S5. Cassandra 的读为什么会向"最快的节点"要全量数据、向"第二快的节点"只要一个哈希？
- 来源：Cassandra · Consistency Levels + Snitch
- 核心素材：
  - 一致性级别是**每次请求可调**的：ONE/TWO/THREE、QUORUM（floor(RF/2+1)）、ALL、LOCAL_QUORUM（只等本 DC 多数派，跨 DC 异步补）、EACH_QUORUM（每个 DC 各自多数派，写级独有——读不用因为太贵）、ANY（极端：所有副本都宕时**写进 hint 也算成功**，但在副本恢复前**读不到**，且协调者没了数据就丢了——应避免使用）。
  - **Snitch**：维护节点拓扑（DC/rack 归属）+ 读延迟监测，用于①路由（挑最快副本）②副本放置策略（同 rack 不放两个副本）。
  - digest 读（省带宽的关键设计）：QUORUM=2 时协调者向**最快的节点**要全量数据、向**第二快**的节点只要 **digest（数据哈希）**；一致 → 直接返回，省一份全量传输；**不一致 → 从所有副本重读**，按最新 write-timestamp 裁决，返回后顺手发起 **read repair**。
  - read repair 是**机会主义**的：级别小于 ALL 时按概率做（默认 10% 的请求），且一致性级别满足就先回客户端、修复**异步后台**进行——它是读路径的顺带产物，**主反熵手段仍是 anti-entropy repair**（Merkle 树，Cassandra 里是手动触发的 repair）。
- 建议追问：① R+W>RF 到底保证了什么、没保证什么？（读到"至少一份最新"，但并发写无全序、时钟偏差下"最新"可判错）→ ② digest 校验什么时候白费？（两个副本本来就一致——但一次哈希的代价换掉高概率全量传输，期望收益为正）→ ③ W=1,R=1 的日志类业务为什么敢配？（单条可容忍回退 + 反熵最终收敛）
- 建议难度：advanced

### S6. BigTable 是怎么找到一行数据所在的？三层元数据和 Dynamo 的无中心路由差在哪？
- 来源：BigTable · Partitioning and High-level Architecture + Working with Tablets + Bigtable Components
- 核心素材：
  - tablet = 表按**行边界**切的连续行区间（默认 100~200MB），是**分布与负载均衡的单元**；表按行有序，所以短范围读只碰少量 tablet——行 key 的局部性设计因此极重要。
  - 三层定位（类比 B+ 树）：**Chubby 文件存 Meta-0 位置** → Meta-0（根元数据 tablet，**永不分裂**，每行指向一个 Meta-1）→ Meta-1 tablets（每个数据 tablet 一行：key = 表 id + end row，value = tablet server 位置）→ 数据 tablet；客户端库**缓存 tablet 位置并 prefetch** 元数据，绝大多数读不碰元数据层。
  - 架构三分：一个 master（元数据操作、tablet 分配、负载均衡、GFS 文件 GC、建表建列族）+ 多个 tablet server（10~1000 tablets/台，真正服务读写）+ 客户端库；**master 完全不在数据路径上**——tablet→GFS 文件的映射由 tablet server 自己维护，客户端读写从不经过 master，master 瓶颈被结构性消除。
  - 与 Dynamo 的对照（出题亮点）：Dynamo 每个节点都存**全量路由表**（gossip 同步，对称但路由表随集群膨胀，被批评 scalability 隐患，还需要 seed 节点防逻辑分区、破坏了对称性）；BigTable 走**分层元数据 + 集中 master**，换来路由 O(1) 层级和全集群视图，代价是引入 Chubby 依赖与 master 故障域。
- 建议追问：① Meta-0 为什么设计成永不分裂？（它是寻址树根，分裂会改变根的键空间，所有客户端缓存的根位置全部失效）→ ② 客户端缓存的 tablet 位置过期了怎么办？（打到错节点会被纠正并更新缓存——与批 47 CRDB"二次路由收敛元数据"同构）→ ③ 为什么 BigTable 敢用单 master 而 GFS master 会成为瓶颈？（master 不碰数据流 + tablet 元数据不在 master 内存里全量维护）
- 建议难度：intermediate

### S7. BigTable 的 tablet server 宕机后，tablet 搬到新机器为什么要做"两次 minor compaction"？
- 来源：BigTable · Working with Tablets + Fault Tolerance and Compaction + BigTable Refinements
- 核心素材：
  - 活性判定全靠 Chubby：tablet server 启动时在 "servers" 目录**建文件并拿排他锁**；master 监控目录与锁状态——锁丢且 master 能抢到 → 判定 server 故障，**删文件作为自杀信号**并重新分配其 tablets；server 自己丢锁会停服重试，抢回锁当临时网络抖动继续服务，文件被删则自我了断。
  - master 重启四步：抢 master 锁（防双主）→ 扫 servers 目录得活节点 → 逐个询问当前 tablet 分配 → 扫 METADATA 表得全集，差集即未分配 tablets。
  - 统一 commit log 的两难：**每个 tablet server 一个日志文件**（而非每 tablet 一个）——写是海量小追加，多日志文件会带来海量磁盘 seek；代价是 tablet 的变更和别人的**混在同一物理日志**里。
  - 恢复难题与解法：100 台机器各分到一个 tablet 时，若各自读全量日志要读 100 遍——BigTable 先把日志按 **<table, row name, log sequence number> 排序**，排序后同一 tablet 的变更全部连续，各机器只读自己那段；另配**双日志线程写两个文件**（同时只有一个活跃），网络劣化就切换，序列号保证恢复正确。
  - tablet 快速搬迁三步：源 server 先做一次 **minor compaction**（MemTable→SSTable，commit log 相应缩短）→ **停止服务该 tablet** → 再做一次很快的 minor compaction（补上间隙期的新日志）→ 目标机器**完全不用重放日志**即可加载。三个 compaction 层级：minor（MemTable→SSTable，省内存+缩短恢复日志）、merging（几个 SSTable+MemTable→一个）、major（全部→一个，**不含任何删除信息**——敏感数据可被确定性抹掉）。
- 建议追问：① 统一日志省了写侧什么、付了读侧什么？（省每 tablet 一文件的 seek；付恢复期的排序/多读）→ ② 两次 compaction 之间的窗口里新写入去哪了？（写入仍在旧 server 的 MemTable/日志，第二次 minor compaction 收尾——搬迁是"先排水再关阀"）→ ③ master 怎么知道该把故障 server 的 tablet 给谁？（周期性问各 server 负载，全集群视图做分配）
- 建议难度：advanced

### S8. GFS 的 chunk lease：master 为什么不亲自编排每次写？
- 来源：GFS · Anatomy of a Write Operation + Metadata + Master Operations
- 核心素材：
  - lease 机制：对 chunk 的每个变更，master 给持有该 chunk 的某个 ChunkServer 发 **60 秒租约**，持有者即 **primary**，负责给该 chunk 所有并发变更**分配序列号、定全序**；一个 chunk 任一时刻只有一个租约，两个写请求到 master 看到的是同一个 primary；primary 可申请续租；master 每次发租约**递增 chunk version number** 并通知所有副本——这是后续判 stale 的依据。
  - 全序的构成 = **租约顺序（master 授予的时间线）× 租约内 primary 定的序**——master 只花一次授权的成本就 outsourced 了并发控制。
  - **数据流 ≠ 控制流**（GFS 最核心的图）：数据流是 client → 最近的 replica → **链式**传给其他 replica（最大化利用每台机器的出口带宽，数据先落在 LRU 缓存不落盘）；控制流是 client → primary → secondaries，primary 按序列号逐个下发——多个客户端并发写也被 primary 排成同一个序。
  - 两阶段写：① Sending：client 把数据推到所有副本（链式）收 ack；② Writing：client 向 primary 发写请求 → primary 定序应用 → 按同序转发 secondaries → 收齐 ack 才回客户端；任何一步失败 → 客户端重试直至报错。
  - 边界情况：primary 宕机/分区，master 等**租约过期**（防止旧 primary 还在服务）才发新租约；旧 primary 复活后凭 version number 被识别为 stale，其副本被替换并 GC。租约不是共识——它只是"一段变更窗口的授权"，正确性靠版本号事后甄别。
- 建议追问：① 数据为什么要链式流而不是 client 广播三份？（client 上行带宽是瓶颈，链式把扇出摊到机房内部大带宽链路）→ ② 租约过期但旧 primary 仍在写，会发生什么？（master 已发新租约+新版本号；旧 primary 的写入凭旧版本号被判 stale，最终被 GC——**可用性与一致性的窗口换法**）→ ③ 对比 Raft leader：leader 是多数派选出来的唯一写入者，GFS primary 只是 master 单方面指定的"排序员"——这决定了 GFS 只能给出 relaxed 一致性。
- 建议难度：advanced

### S9. GFS 的 record append 为什么敢说"至少一次、原子"，却不敢说"副本逐字节一致"？
- 来源：GFS · Anatomy of an Append Operation + Consistency Model + Fault Tolerance and Data Integrity
- 核心素材：
  - write 与 append 的分野：write 指定 offset——并发写同一区域**不可串行化**，区域可能混入多个客户端的数据碎片（undefined）；record append 客户端**只给数据不给偏移**，GFS 选定偏移**原子地（连续字节序列）至少写入一次**并返回真实偏移——类似 O_APPEND 但消除了多写者竞争。
  - append 的执行细节：primary 检查追加是否会顶破 64MB——超了就把当前 chunk **pad 到上限**、命令 secondaries 同样 pad，再让客户端**重试下一个 chunk**；没超就在自己的偏移写入，命令 secondaries **写到完全相同的偏移**。
  - at-least-once 的来源：任一副本失败客户端就重试 → 某些副本上**同一记录可能重复出现（整条或半条）**——副本之间不保证逐字节一致，只保证"数据作为原子单元至少出现一次"；**去重的责任上移给应用**（通常记录里带校验和/唯一号过滤）。
  - 一致性模型的分层：元数据操作原子（namespace 锁 + 操作日志全局定序）；写路径还有 stale 读窗口——客户端缓存了 chunk 位置，可能从 stale 副本读到旧数据，影响小是因为 append-only 场景 stale 副本通常表现为"**chunk 提前结束**"而不是"数据是旧的"。
- 建议追问：① 为什么 append 能做到原子而 write 不能？（原子性来自"偏移由 primary 单点决定"；write 的偏移是客户端各自意志）→ ② "至少一次"的重复记录该谁去重，为什么 GFS 不做？（系统不知道记录边界语义；去重要求精确一次的账只能应用记）→ ③ pad 再换 chunk 的设计牺牲了什么？（chunk 尾部空洞 + 空间浪费，换来写入永不被 64MB 边界卡住）
- 建议难度：advanced

### S10. 给 PB 级文件系统做快照，怎么做才能不拷贝数据？
- 来源：GFS · Consistency Model and Snapshotting
- 核心素材：
  - 快照 = 某时刻对命名空间子树的拷贝，GFS 用途是**低成本分支两份数据**；实现是 **copy-on-write，初始零拷贝**。
  - 快照执行三步：master **先撤销目标文件上所有 chunk 的租约**并等撤销/过期 → 把快照操作写入操作日志 → **只复制元数据**（子树命名空间），新快照文件指向**原来的 chunk**——O(元数据) 而不是 O(数据)。
  - COW 触发点在写：客户端要写某个 chunk 时，master 看到它**引用计数 > 1**（被快照共享），就让持有该副本的**每个 ChunkServer 在本地拖一份**（本机复制，不走网络！），拷贝完成后 master 给新副本发新租约，写在新 chunk 上进行——原 chunk 归快照所有。
  - 设计要点：先撤租约保证了快照时点的确定性（没有写入悬在半空）；本地拷贝避免了 64MB 数据在网络上走两遍。
- 建议追问：① 为什么快照前必须先收回租约？（不收回则 primary 可能正按旧序写——快照点不确定，COW 复制和写入竞争）→ ② 为什么让 ChunkServer 本地拷贝而不是 master 指挥网络复制？（省网络带宽、并行度高；master 只改元数据映射）→ ③ 引用计数什么时候减少？快照链很长时写性能怎么退化？（每次写共享 chunk 都付一次本地拷贝——COW 把快照的代价推迟并分摊到首次写）
- 建议难度：intermediate

### S11. HDFS NameNode 挂了会怎样？从"冷启动半小时"到 active-standby 补上了哪些机制？
- 来源：HDFS · High Availability (HA) + Fault Tolerance + Deep Dive + interview.txt（Federation）
- 核心素材：
  - SPOF 现状：NameNode 是元数据与 file→block 映射的唯一repository，挂了全集群瘫痪；恢复 = 加载 FsImage → 重放 EditLog → **等 DataNode block report**，大集群冷启动 **30 分钟以上**——且计划内停机（升级维护）比意外故障更常见，冷启动连日常维护都撑不住。
  - HA 架构（Hadoop 2.0）：active-standby 双 NameNode；standby 是**热备 follower**：① 通过**共享存储**读 EditLog（NFS 挂载，或 **QJM**——通常 3 个 journal node，每条 edit 必须写到**多数派**才算成功；QJM 形似 ZooKeeper 但不用 ZK 实现，**ZooKeeper 只负责选主**）；② DataNode **向所有 NameNode 发 block report**（block 映射在内存里，不落盘，standby 只能靠上报重建）；③ 客户端用**逻辑主机名映射多个 NN 地址**，客户端库逐个尝试实现透明故障转移。
  - failover 两类：graceful（管理员发起，有序交接）与 **ungraceful**（网络慢/分区误判触发，**旧 active 可能还活着且自认为是 active**）——防 split-brain 靠 **fencing**：resource fencing（收回共享存储访问权/远程禁用网络端口）与 node fencing（直接断电重启，STONITH "Shoot The Other Node In The Head"）。
  - failover 时间账：standby 理论秒级接管（EditLog + block 映射都热着），实际约 1 分钟——**故障判定故意保守**，宁可慢不可误判。
  - 前置知识两件：FsImage（元数据快照）+ EditLog（增量事务日志）周期合并成新镜像；Secondary NameNode **名字骗人——它不是备份**，只负责周期性帮主节点合并镜像、防止 EditLog 无限膨胀，其状态滞后于 primary，主节点彻底丢失时数据损失几乎不可避免。横向瓶颈解法是 **Federation**：内存装不下元数据就加 NameNode，各管一段命名空间。
- 建议追问：① EditLog 为什么用 QJM 多数派而不是放 ZooKeeper？（EditLog 是高吞吐顺序写日志，ZK 是小状态协调服务，各司其职——ZK 只出"唯一 active"的判决）→ ② 不做 fencing 会发生什么？（旧 active 带着陈旧内存映射接受写 → 元数据分叉不可恢复，比 DataNode 丢块严重得多）→ ③ 为什么 standby 需要额外收 block report？（block→DataNode 映射只存在于主节点内存，磁盘上只有 FsImage/EditLog 的命名空间侧）
- 建议难度：advanced

### S12. GFS 的 master 敢把全部元数据放内存，凭什么？挂了怎么不丢？
- 来源：GFS · Metadata + Master Operations + Single Master and Large Chunk Size + Criticism on GFS + HDFS interview.txt（Federation 对照）
- 核心素材：
  - 三类元数据：命名空间、file→chunk 映射、chunk 副本位置。**前两类**在内存 + 本地盘持久化（操作日志 + checkpoint）；**第三类不持久化**——ChunkServer 才是副本位置的真相源：master 启动时问询 + 心跳持续更新。
  - 为什么副本位置敢不落盘：几百台机器的集群里磁盘坏、机器改名、ChunkServer 失联是**常态**，chunk 会"自发现象"——master 若维护一份持久副本集，它和现实**必然失配**，两份真相永远打架；不如以 ChunkServer 实测为准，"消除 master 与 ChunkServer 的同步问题"。
  - 内存化的两个红利：控制路径全内存 → 快；能**周期性全量扫描自身状态** → GC、re-replication、负载迁移都变成"后台扫一遍"的副产品。代价可控的原因：64MB chunk 只摊 <64B 元数据 + 命名空间前缀压缩。
  - 持久化细节：操作日志复制到多台远程机，**所有副本落盘前元数据变更对客户端不可见**；攒批 flush；checkpoint 用类 B-tree 紧凑格式**可直接 mmap 进内存做查找**（免解析）；checkpoint 耗时长 → master **切换新日志文件**、在独立线程做 checkpoint，不阻塞突变。
  - 上限与演化：内存终究有限——批评章指出 master 已成瓶颈（客户端 CPU + 元数据装不下内存），GFS 后继者 Colossus 走分布式元数据；HDFS 用 **Federation**（多个 NameNode 分管命名空间段）在开源侧给出同方向答案。
- 建议追问：① chunk 副本位置为什么不持久化，代价是什么？（重启后要等全量问询+首次 block 心跳才可信——换永久免同步）→ ② "全内存 + 全量扫描"白送了哪些功能？（孤儿 chunk GC / 低副本 chunk 重复制优先级排序 / 磁盘均衡迁移，全部无需额外索引）→ ③ 单 master 元数据上限的三条出路？（大 chunk 摊薄、Federation 分段、Colossus 式分布式元数据）
- 建议难度：intermediate

### S13. 同出 Google 系，GFS 宽松一致、HDFS 强一致：两年之差为什么选了相反的路？
- 来源：GFS · Consistency Model + Criticism on GFS；HDFS · Deep Dive + High-level Architecture
- 核心素材：
  - HDFS 的强一致配方：**写入须所有副本成功才算成功** + **单写者**（一文件同时只允许一个 writer）+ **严格不可变语义**（早期版本写完不可再打开，现支持 append 但已写数据不能原地改）——三个约束叠加，强一致" relatively easy"。
  - 为什么付得起：MapReduce 是 write-once-read-many 的受限计算模型，reducer 各写各的输出文件，天然不需要并发写与原地改——**工作负载的形状决定一致性可以有多便宜**。
  - GFS 的相反选择：为多客户端**并发 append** 优化（at-least-once + 副本可不一致），换来海量小文件并发追加场景的吞吐；代价是 undefined 区域、重复记录、stale 读全部交给应用层消化。
  - 两者共同的 rack-aware 放置：HDFS 3 副本 = 第 1 副本在**写客户端本机**（不在集群则随机）、第 2 副本**跨 rack**、第 3 副本与第 2 同 rack 不同节点；约束：单节点 ≤1 副本、单 rack ≤2 副本；跨 rack 写变慢是**明码标价的可靠性换性能**（GFS 侧同一取舍的表述：跨 rack 读可吃多 rack 聚合带宽，写则吃亏，属 intentional tradeoff）。
  - 热点小文件的共同软肋与土办法：64MB/128MB 大块下小文件集中于个别节点 → 加副本 + 应用启动**随机延迟**错峰。
- 建议追问：① HDFS 为什么能"所有副本成功才返回"，GFS 不行？（HDFS 无并发写者、单主排序即可；GFS 要同时服务并发 append，全量确认的可用性代价不可接受）→ ② 不可变语义对运维和生态意味着什么？（无需并发控制与原地更新 → 简化恢复/快照；但改数据 = 删了重写）→ ③ 用一致性与工作负载匹配的框架，分析对象存储（S3）为什么选最终一致起步、后改强一致？
- 建议难度：advanced

## 二、既有题增强素材

### E1. be-distributed-quorum（Quorum W+R>N 保证了什么）
- 追问素材：现有题一句话带过 sloppy quorum/hinted handoff，可下钻：preference list **>N 且跳过虚拟节点**（保证物理机不同）；hint 副本存独立本地库周期扫描、送达后删除**不减少系统总副本数**；sloppy 的代价 = 并发写可落**不相交节点集合** → 必须配向量时钟（引 S1/S2 深度题）；(N,R,W)=(3,3,1)/(3,1,3) 的读写/持久性语义；Cassandra 'ANY' 级别 hint-only 成功但**恢复前不可读**。
### E2. be-distributed-consistent-hash（一致性哈希/虚拟节点）
- 追问素材：Dynamo 引 vnode 的三个原始动机——① 新节点加入时**从很多现有节点各收若干 vnode**（而非只压给环上邻居）② 重建节点时**多节点参与供数**而非固定副本集扛全量 ③ 异构机器按能力配 vnode 数；vnode 在环上**随机分布且不相邻**（相邻 vnode 不同物理机）；单 token 方案三宗罪（增删节点要重算全网 token、单段大范围易热点、重建压垮固定副本）。另：Merkle 树反熵的边界——**节点加入/离开导致 key range 重划 → 树整体重算**（Cassandra 干脆做成手动 repair）。
### E3. sd-classic-distributed-kv（设计一个分布式 KV 存储）
- 追问素材：现有 followUp 已讲 read repair/Merkle，可补：① **写协调者选上一个读响应最快的节点**（上下文携带，提升 read-your-writes）——读写亲和技巧；② Dynamo 每节点维护**全量路由表**的可扩展性批评 + seed 节点破坏对称性——"去中心化不是免费的"；③ Dynamo 的"leaky abstraction"批评：让客户端处理不一致，购物车里的"复活商品"会让用户以为网站有 bug——最终一致的 UX 成本。
### E4. cs-db-lsm（LSM 树与三放大）
- 追问素材：用 Cassandra/BigTable 做"LSM 活标本"：① Cassandra 三级读加速栈（bloom per SSTable → key cache 存 offset → 内存 partition index summary → 磁盘 partition index → data file）是"读放大治理"的工程清单；② BigTable compaction 三分类 minor/merging/**major**（major 产物不含删除信息 → 敏感数据可确定性消失——现有题讲墓碑留到最后一级，可补"隐私视角"）；③ 统一 commit log（每 server 一个日志文件 + 按 <table,row,LSN> 排序恢复）是"WAL 分段/合并"议题的分布式变体，可衔接 sd-paper-wal-segmented-log；④ SizeTiered/Leveled/TimeWindow 三策略 = 现有题 tiered vs leveled 权衡的产品级对应。
### E5. be-distributed-brain-split（脑裂）
- 追问素材：HDFS HA 给出 fencing 的**两级落地版**：resource fencing（收回共享存储访问、远程禁网络端口）与 node fencing（断电重启 STONITH）；触发场景具体化——**网络变慢/分区触发 failover，但旧 active 还活着且自认为 active**；QJM 用多数派写 EditLog 本身就是防脑裂设计（旧 active 写不进多数派）。旧题讲"为什么脑裂"，本素材讲"工业系统 fencing 的具体手段"。
### E6. sd-classic-object-storage（对象存储/checksum/端到端数据完整性）
- 追问素材：GFS checksum 章是现有 checksum 追问的机制细化：① **64KB 块 + 32bit 校验和**，校验和与用户数据分开持久化；② 读前校验、**损坏不向外传播**（报错给请求方 + 上报 master → 请求方换副本读 → master 另克隆一份 → 坏副本被指令删除）；③ append 场景优化：最后一个 partial 块**不做校验只增量更新**——若它已损坏，新校验和与数据不符，下次读必现形；④ 空闲期扫描不活跃 chunk，防"坏副本冒充好副本骗过副本数检查"；⑤ 低开销三原因（多块读摊薄、查找免 IO、计算可与 IO 重叠）。另可补 **GFS lazy GC**：删除 = 改隐藏名 + 时间戳，3 天窗口内可恢复，回收混入后台扫描与心跳批次摊销——对象存储生命周期管理的原型。
### E7. sd-paper-wal-segmented-log（WAL/分段日志/快照）
- 追问素材：GFS master 的 operation log 是"日志即全序"的又一实例：**日志复制到多台远程机、全部落盘前变更不可见**（比多数派更保守——全副本确认）；checkpoint 类 B-tree 格式 mmap 直载；**checkpoint 时切换新日志文件、后台线程做快照**——与 HDFS FsImage/EditLog + Secondary NameNode 合并完全同构，两例可并排进现有题的 followUp。
### E8. sd-paper-gossip（Gossip 协议）
- 追问素材：Cassandra 的 hint 交还与 gossip 联动——协调者从 Gossiper 获知目标节点恢复才转发 hint，且每 10 分钟主动复查一次；Dynamo 用 gossip 同步成员与 hash range，但需要 **seed 节点**（外部可发现）防止逻辑分区——"纯 gossip 集群如何 bootstrap"是现有题可加的边界追问。

## 三、主动丢弃

- Dynamo · Gossip Protocol / Cassandra · Gossiper 章节：sd-paper-gossip 已有专门成题，本批只取其与 hint 交还的联动细节进 E8。
- Dynamo · Introduction / High-level Architecture / Summary；Cassandra · Introduction / Replication / Summary：内容与已精读章节及既有题（sd-classic-distributed-kv、be-distributed-quorum）重叠，无新增机制。
- Cassandra · High-level Architecture：vnode/一致性哈希与 E2 重复，coordinator 路由细节已在 S3/S5 素材内覆盖。
- BigTable · Data Model / System APIs / Characteristics / Summary / GFS and Chubby：宽列模型与 API 属通识（sd-classic 系列已定位产品分层），GFS/Chubby 依赖关系已吸收进 S6/S7/S12 素材。
- GFS · Introduction / High-level Architecture / Read Operation / Summary：读路径平淡（客户端缓存位置 + 最近副本直读），单 master 论证已并入 S12，控制/数据流分离已并入 S8。
- HDFS · High-level Architecture / Read / Write anatomy：与 GFS 高度同构且课程深度不及 GFS 章节，pipeline 写对比已在 S13 收束；Data Integrity & Caching 章与 sd-classic-object-storage 的 checksum 追问重叠（如需 short-circuit read / centralized cache 细节可下批补读）。
- HDFS Erasure Coding / Hadoop 3 特性：本课程未覆盖，不虚构素材——EC 机制已有 sd-classic-object-storage 系统题承载。
- Kafka / Chubby / System Design Patterns 目录：超出本批四系统范围（Chubby 已有 sd-paper 五题，Kafka 已有批 39）。
