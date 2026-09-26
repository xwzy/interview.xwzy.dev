import type { Track } from '../types';

export const bigDataTrack: Track = {
  id: 'big-data',
  name: '大数据与数据工程',
  icon: '📊',
  tagline: '从 Hadoop/Spark/Flink 到数仓建模与湖仓一体的数据面试图谱',
  description: '大数据开发 / 数据工程师岗位的面试考点：Hadoop 生态、Hive 数仓与维度建模、Spark 批处理、Flink 实时计算、CDC 数据管道与数据湖。',
  color: 'fuchsia',
  topics: [
    {
      id: 'bd-hadoop',
      name: 'Hadoop 与离线数仓基础',
      description: 'HDFS 架构、MapReduce 执行模型与 Hive 使用是大数据面试的地基题，考察是否理解分布式存储与计算的本质。',
      references: [
        { label: 'Apache Hadoop 官方文档', url: 'https://hadoop.apache.org/docs/stable/' },
        { label: 'Apache Hive 官方文档', url: 'https://hive.apache.org/development/quickstart/' },
      ],
      questions: [
        {
          id: 'bd-hdfs-arch',
          title: 'HDFS 的架构与读写流程是怎样的？小文件问题为什么发生、怎么解决？',
          difficulty: 'basic',
          tags: ['HDFS', '分布式存储', '小文件'],
          points: [
            '架构：**NameNode**（元大脑，内存持有文件系统的元数据：目录树、文件→Block 映射、Block→DataNode 位置，不存实际数据）+ **多个 DataNode**（存数据块，周期心跳汇报块列表）+ **Secondary NameNode**（名字有误导性：它只定期把 fsimage 与 edits 合并出 checkpoint，**不是备份更不是热备**——热备靠 HA 的 Standby NN）。文件按 **Block（默认 128MB）** 切分，默认 **3 副本**分散在不同机架/节点。',
            '读流程：客户端向 NameNode 要**块位置**（NameNode 按"就近原则"排序副本）→ 直接从 DataNode **并行读取**各块拼装——读路径不经过 NameNode 传数据，元数据与数据流分离是 HDFS 扩展性的关键。写流程：向 NameNode 申请写 → DataNode 间形成**流水线**逐块复制（3 副本串行传递）→ 全部确认后提交。',
            '适用边界：HDFS 为**大文件、高吞吐、一次写多次读**（WORM）设计，不支持随机修改与低延迟访问——追加写（append）受限、小文件是灾难。',
            '**小文件问题**：每个文件/块在 NameNode 内存里都要占约 **150B 元数据**——1 亿个小文件 = 几十 GB 元数据，NameNode 内存与 RPC 压力爆炸；同时 Map 任务数 = 分片数，小文件导致大量碎任务。解法：**写入前合并**（Spark/Hive 产出一举写少量大文件，`coalesce`/`repartition`）、**存量合并**（HAR 归档、SequenceFile 打包、合并工具）、**NameNode Federation** 分摊元数据。',
          ],
          followUps: [
            {
              question: 'NameNode 挂了元数据会丢吗？它是靠什么保证元数据安全的？',
              points: [
                '两层机制：**fsimage**（内存元数据的快照落盘）+ **edits log**（快照之后的增量操作日志，先写日志再改内存）。Secondary/Standby NN 周期拉取 fsimage + edits **合并出新的 checkpoint**，故障恢复时加载 fsimage 后重放 edits。',
                '生产形态是 **NameNode HA**：两个 NameNode 共享 edits（JournalNode 集群，多数派写入），ZKFC 基于 ZooKeeper 做自动故障转移——数据不丢的本质是**日志先行 + 多副本一致**，和数据库 WAL 思想同源。',
              ],
            },
            {
              question: '为什么 HDFS 不适合低延迟随机读？那实时查询场景用什么？',
              points: [
                '设计取舍：HDFS 面向**高吞吐顺序扫描**（批处理喂大数据），块定位、RPC、流式读的开销在毫秒~秒级，且不支持行级随机修改——它追求的是"整个集群吞吐最大"，不是"单次请求最快"。',
                '实时查询换架构：低延迟 KV 读用 **HBase**（LSM 树，RegionServer 内存 + 布隆过滤定位）；交互式分析用 **ClickHouse/Doris/StarRocks**（列存 + MPP）；它们底层往往不再用 HDFS 而是对象存储——存储引擎是按访问模式选的，不是越通用越好。',
              ],
            },
          ],
        },
        {
          id: 'bd-mr-shuffle',
          title: 'MapReduce 的执行流程是怎样的？Shuffle 为什么是性能瓶颈、怎么优化？',
          difficulty: 'intermediate',
          tags: ['MapReduce', 'Shuffle', 'Spark 对比'],
          points: [
            '执行流程四段：**InputSplit**（按块切逻辑分片，一个分片一个 Map 任务）→ **Map**（逐条处理输出中间 KV，写入环形缓冲区，80% 满时溢写磁盘并**按分区排序**）→ **Shuffle**（Reduce 任务把属于自己分区的 Map 输出**通过 HTTP 拉取**、归并排序）→ **Reduce**（聚合后写入 HDFS）。',
            '**Shuffle 慢在三件事**：① 落盘——Map 端溢写、Reduce 端归并都要大量磁盘 IO；② 网络拉取——每个 Reduce 要从**所有** Map 拉数据，O(M×R) 的全互联流量；③ 排序——按 key 排序是 MR 编程模型的强制要求，即使业务不需要。三件全是"昂贵的物理动作"，这就是它成为瓶颈的原因。',
            '参数级优化：**Combiner**（Map 端先做一次本地聚合，把"map 后再 reduce"提前，网络量骤减）、**压缩**（中间数据 Snappy/LZO 压缩，CPU 换 IO）、**调缓冲区与合并因子**（`mapreduce.task.io.sort.mb`、`io.sort.factor`，减少溢写次数与归并轮数）、合理分区器避免数据倾斜。',
            '为什么 Spark 干掉了 MR 的痛点：MR 每个阶段都落盘（Map 中间结果写**本地磁盘**——刻意不进 HDFS 省副本开销，靠任务重跑容错；Reduce 拉取聚合后又写回 HDFS），**DAG 多阶段任务链被迫多轮落盘**；Spark 把整条 DAG 装进内存流水线，**Shuffle 只在必要时发生**（宽依赖）——这是两者性能差一个量级的根本原因，答题时能把 MR 的痛点讲成 Spark 的优点即闭环。',
          ],
          followUps: [
            {
              question: '为什么说"Map 数等于分片数而不是块数"？分片过大或过小有什么问题？',
              points: [
                'InputSplit 是**逻辑切分**：默认分片 = 块大小（本地性最好），但可被 `mapreduce.input.fileinputformat.split.minsize` 等调整；可压缩文件按压缩格式决定能否切分（gzip 不可切、bzip2 可切、ORC/Parquet 按块可切）。',
                '分片过小 → 任务数爆炸，调度与 JVM 启动开销吃掉算力；过大 → 单任务太慢、失败重试代价高、本地性变差（跨节点读）。经验值：任务时长落在分钟级、单任务处理量百 MB~GB 级。',
              ],
            },
          ],
        },
        {
          id: 'bd-hive-partition',
          title: 'Hive 的分区和分桶有什么区别？内部表和外部表怎么选？',
          difficulty: 'basic',
          tags: ['Hive', '分区', '分桶'],
          points: [
            '**分区（Partition）**：按业务列（日期、地区）把数据存成**目录层级**（`dt=2026-09-26/`），查询带分区条件时直接**裁剪掉无关目录**——解决"扫描量"问题。分区列是伪列，不存在数据文件里。**分桶（Bucket）**：按某列哈希把表/分区内数据**固定拆成 N 个文件**——解决"单文件过大、join 与采样效率"问题。',
            '分桶的核心红利是 **SMB Join（Sort Merge Bucket Join）**：两张表按 join key 分桶且桶数成倍数关系时，大表 join 可以桶对桶进行，免去全量 shuffle；`TABLESAMPLE` 也能基于桶做高效采样。一句话分工：**分区管目录裁剪（粗粒度），分桶管文件内组织（细粒度）**，生产常按 `dt` 分区 + 按用户 id 分桶组合。',
            '**内部表 vs 外部表**：内部表 Hive 管生命周期，`drop` 连数据一起删；外部表（`external`）Hive 只管元数据，删表数据仍在——**生产默认外部表**：多引擎共享（Hive/Spark/Presto 写同一份 HDFS 数据）、防误删、允许数据由上游管道直接写入。',
            '分区设计的工程纪律：**分区粒度要匹配查询模式**（日报表按天、小时级分析按小时），避免过度分区（小分区 = 小文件问题的变体，一天 24 个分区 × 高频上游任务 = 分区风暴）；动态分区插入要配上限与分布均匀度防护。',
          ],
          followUps: [
            {
              question: '查询明明带了分区条件却还是全表扫，可能是什么原因？',
              points: [
                '常见三类：① **分区列上套了函数或类型不匹配**（`dt = cast(...)`、string 与 int 比较）导致裁剪失效；② **谓词写法绕过了分区裁剪**（子查询/OR 条件里混了非分区列，某些引擎优化器推不下去）；③ **分区路径与元数据不一致**（数据是直接 hdfs put 的没 `msck repair`，或 `hive.mapred.partition.pruning` 相关配置关了）。',
                '排查路径：`explain` 看**扫描的分区列表**（标准输入里 Partition Count / partitionsOK），一眼定位有没有裁剪生效——"先看执行计划再下结论"与 SQL 调优是同一套方法论。',
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'bd-warehouse',
      name: '数仓建模与分层',
      description: '数仓分层与维度建模是数据工程师的看家方法论，面试常结合"你怎么建公司的数仓"这类开放题考察体系化思维。',
      references: [
        { label: '《数据仓库工具箱（Kimball）》官方站点', url: 'https://www.kimballgroup.com/data-warehouse-business-intelligence-resources/books/data-warehouse-dw-toolkit/' },
        { label: '阿里云 · OneData 数仓方法论公开资料', url: 'https://help.aliyun.com/document_detail/173133.html' },
      ],
      questions: [
        {
          id: 'bd-warehouse-layering',
          title: '数仓为什么要分层（ODS/DWD/DWS/ADS）？每一层解决什么问题？',
          difficulty: 'basic',
          tags: ['数仓分层', 'ODS', 'DWD', 'DWS'],
          points: [
            '分层的目的先说透：**空间换时间、复用换效率**——如果不分层，每个需求都从原始数据一路加工，重复计算、口径不一、一个上游变更炸一片下游。分层本质是**把"清洗与加工"做成可复用的中间层**，跟软件工程的分层抽象同构。',
            '经典五层：**ODS** 原始层（贴源存储，不做清洗只做格式规范，保留原始现场可回溯）；**DWD** 明细层（清洗、去重、脱敏、维度退化，一行 = 一次业务过程/事实，如一条订单明细）；**DWS** 汇总层（按主题轻度聚合，如用户天粒度的下单次数/金额，供下游复用）；**ADS** 应用层（直接对齐报表/看板/接口的最终口径）。有的体系还加 **DIM** 维度层（用户、商品维表）。',
            '分层的工程收益逐条对应痛点：**统一口径**（同指标只在 DWS 定义一次，全公司引用）；**复用计算**（DWS 层被 N 个 ADS 复用，上游改动只影响 DWD）；**问题定位快**（数据对不上时逐层比对，能定位是哪一层加工错了）；**血缘清晰**（任务依赖图随分层自然形成）。',
            '答题升华：分层不是教条——小团队可以 ODS+DWD+ADS 三层起步；关键是**口径唯一、职责单一、下游只读上游**的纪律，层数是手段不是目的。',
          ],
          followUps: [
            {
              question: '出现"同一个指标两个报表数字不一样"，你的排查与治理思路是什么？',
              points: [
                '排查沿链路下钻：先对**取数口径**（时间范围/过滤条件/去重口径差异占了八成）→ 再对**加工链路**（两个任务是否读不同层的表、join 键是否一致、增量与全量混用）→ 最后查**调度时序**（一个跑了增量一个跑了快照，时间窗错位）。',
                '治理靠机制而不是救火：指标**统一定义在 DWS/DIM 层**并登记到指标字典（口径、负责人、刷新频率），ADS 层只做引用；新报表上线前做口径评审——数据信任的建立要几个月，摧毁只要一次数字对不上。',
              ],
            },
          ],
        },
        {
          id: 'bd-dim-modeling',
          title: '维度建模是什么？星型模型和雪花模型怎么选？事实表有哪些类型？',
          difficulty: 'intermediate',
          tags: ['维度建模', '星型模型', '事实表'],
          points: [
            '维度建模（Kimball）是面向**分析易用性**的建模法，与面向事务的范式建模（3NF）相对：以**事实表（Fact）**为中心记录业务过程（下单、支付、点击），以**维度表（Dimension）**描述上下文（谁、在哪、买了什么、什么时候）——分析查询的本质是"从多个维度角度聚合事实"，维度建模就是为这个动作优化的。',
            '**星型模型**：维表**直接**挂事实表（一层，天然反范式，冗余但 join 少）；**雪花模型**：维表再拆分规范化（省份→国家，商品→类目→大类），省存储但 join 层数深。**分析型场景选星型**：BI 工具友好、查询路径短；雪花只在维表巨大且层级变更频繁时有价值——这是为查询效率对存储冗余的取舍。',
            '事实表类型（高频考点）：**事务事实表**（一行一次业务事件，最细粒度）；**周期快照事实表**（一行一个周期状态，如每日库存余额）；**累积快照事实表**（一行一个业务流程全生命周期，如订单从下单到签收的各里程碑时间）；**无事实事实表**（只有维度组合没有度量，如"当天用户浏览过哪些商品"的覆盖关系）。',
            '两个必考设计点：**退化维度**（订单号这类没有属性可查、直接放事实表的维度）；**缓慢变化维（SCD）**——维度属性会变（用户改了手机号/城市），Type1 直接覆盖（不保历史）、Type2 加版本行 + 生效时间（保历史，最常用）、Type3 加备选列（只保一次变更）。面试常给场景让你设计：能主动说出用 Type2 建代理键就是标准答案。',
          ],
          followUps: [
            {
              question: "'每天活跃的用户数'这个指标，用事务事实表算还是周期快照算？为什么？",
              points: [
                '能用**周期快照**就不要回扫明细：事务事实表算 DAU 是"每天扫全量明细按用户去重"，数据量随业务线性涨，成本越来越高；周期快照表每天落一行/用户（活跃标记），DAU 变成简单的 count，代价是每天一次轻量加工。',
                '权衡点：快照表占用额外存储但查询成本恒定——分析型指标的重复消费高时，快照是标准的**空间换时间**；只有回溯历史口径（按任意维度重算）才必须依赖明细层。这个答案同时展示了分层思维：明细保真在 DWD，聚合加速在 DWS。',
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'bd-spark',
      name: 'Spark 批处理',
      description: 'Spark 原理与调优是大数据面试的绝对高频：从 RDD/DAG 模型到数据倾斜的完整排障，直接决定面试评级。',
      references: [
        { label: 'Apache Spark 官方文档 · Tuning Guide', url: 'https://spark.apache.org/docs/latest/tuning.html' },
        { label: 'Apache Spark 官方文档 · SQL Performance Tuning', url: 'https://spark.apache.org/docs/latest/sql-performance-tuning.html' },
      ],
      questions: [
        {
          id: 'bd-spark-rdd',
          title: 'Spark 为什么比 MapReduce 快？RDD、DAG、宽窄依赖分别是什么？',
          difficulty: 'intermediate',
          tags: ['Spark', 'RDD', 'DAG'],
          points: [
            '快在四件事：① **内存计算**——中间结果不强制落盘，DAG 各 stage 流水线传递（MR 每阶段读写 HDFS）；② **DAG 调度**——一次作业声明整张有向无环图，框架全局优化（pipeline 化、shuffle 最小化），MR 只能一个 job 接一个 job；③ **线程级并行**——Executor 进程内多线程跑任务，启动开销毫秒级（MR 每任务一个 JVM 进程）；④ **Tungsten 引擎**——堆外内存、全阶段代码生成、向量化执行，逼近手写代码性能。',
            '**RDD**（弹性分布式数据集）是 Spark 的编程抽象：不可变的分区集合 + 血缘（lineage）。**弹性**体现在三处：分区可按需重分区、基于血缘可**容错重算**（某分区丢失只需重算它的父链，不必全量重跑）、存储位置可自动在内存/磁盘间流转。',
            '**宽窄依赖**是理解 Spark 执行的钥匙：**窄依赖**（父分区至多被一个子分区消费：map/filter/union）——分区可**流水线执行**且故障重算代价小；**宽依赖**（子分区依赖多个父分区：groupByKey/reduceByKey/join）——必须 **shuffle**，以此切分 stage。DAGScheduler 按**宽依赖切 stage**，stage 内管道化、stage 间 shuffle 隔离。',
            '加分收束：Spark 的优化史就是"减少 shuffle 与落盘"的历史——DataFrame API 让优化器（Catalyst）能做谓词下推、列裁剪，AQE（自适应执行）在运行时合并小分区、自动倾斜_join 拆分——回答时把"模型（RDD）→ 优化器（Catalyst）→ 运行时（AQE）"三层串起来就是体系化视角。',
          ],
          followUps: [
            {
              question: 'groupByKey 和 reduceByKey 底层有什么区别？为什么后者更推荐？',
              points: [
                'reduceByKey 在**map 端先做本地预聚合**（等价于 MR 的 Combiner），shuffle 传输的是聚合后的结果；groupByKey 不做预聚合，**每条原始记录都过 shuffle**——key 倾斜或基数高时网络与内存开销可能差几十倍。',
                '推论要会迁移：凡是"先 group 再聚合"的写法都该改成聚合算子（reduceByKey/aggregateByKey）；同理 SQL 里 `group by` 会被 Catalyst 自动下推部分聚合——**会选算子本身就是分布式思维**。',
              ],
            },
          ],
        },
        {
          id: 'bd-spark-skew',
          title: 'Spark 数据倾斜怎么定位和解决？给出你的完整排障套路。',
          difficulty: 'advanced',
          tags: ['数据倾斜', 'Spark 调优', 'Salt Join'],
          points: [
            '先会识别：症状是**绝大多数 task 秒完，个别 task 长时间卡住**甚至 OOM，stage 进度条停在 99%；`Spark UI` 看 stage 内 task 的**执行时长与处理数据量分布**（个别 task 是别人的百倍即倾斜），配合 `df.groupBy(key).count().orderBy(desc)` 定位热点 key。',
            '倾斜根源想清楚再动手：业务层——**key 分布天然不均**（null 值、默认值、超头部用户/爆款商品）；代码层——join/groupBy 的 shuffle 按 key 哈希，热点 key 全部落同一个 task。先问"这个热点是不是业务异常"（脏数据该清洗，null 该过滤），再谈技术方案。',
            '方案工具箱（按侵入性从低到高）：**过滤/单独处理异常 key**（null 直接过滤，超热点 key 拆出来单独 join 再 union 回去）；**提高并行度**（shuffle partitions 调大，轻度倾斜的止痛药）；**Salt 加盐**——给热点 key 拼随机前缀（1~N）打散成多个 task，另一张表按 1~N **膨胀复制**对应 join——把一个倾斜 join 变成 N 个均匀 join；**AQE 自动倾斜处理**（`spark.sql.adaptive.enabled` + skewJoin 配置，3.0+ 自动拆分倾斜分区）；**广播 join**——小表广播免 shuffle，倾斜直接消失（小表 < 几百 MB 时首选）。',
            '答题框架显专业：**定位（UI 证据 + 热点 key）→ 归因（业务还是代码）→ 选型（先免 shuffle，再打散，最后调参兜底）→ 验证（改后 UI 对比 task 耗时分布）**。说得出"AQE 原理是运行时检测分区大小超阈值后拆分成子分区再 join"，比背十条参数高一档。',
          ],
          followUps: [
            {
              question: '加盐 join 里，另一张表"膨胀复制"会不会把小表撑爆？什么时候不能用？',
              points: [
                '会：膨胀倍数 = 盐值 N，另一表数据量 × N——所以**只对识别出的热点 key 膨胀**（非热点 key 不加盐不膨胀），实际膨胀成本 ≈ 热点占比 × N，可控；N 取"热点 key 数据量 / 正常 task 均值"的量级。',
                '两个边界：① join 语义必须是**等值 join**（范围 join 无 key 可盐）；② 两表都巨大且热点占比极高时，加盐只是把倾斜摊平，总量不变——这时该考虑预处理聚合（先 group 到中间粒度再 join）或改存储设计，_shuffle 的物理成本不会被任何技巧凭空消灭_。',
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'bd-flink',
      name: 'Flink 实时计算',
      description: 'Flink 的 Checkpoint/Exactly-Once 与时间语义（水位线）是实时岗的两大必考题，直接区分"用过"与"理解"。',
      references: [
        { label: 'Apache Flink 官方文档', url: 'https://nightlies.apache.org/flink/flink-docs-stable/' },
        { label: 'Flink · Event Time / Watermarks', url: 'https://nightlies.apache.org/flink/flink-docs-stable/docs/concepts/time/' },
      ],
      questions: [
        {
          id: 'bd-flink-exactly-once',
          title: 'Flink 的 Exactly-Once 语义是怎么实现的？端到端还缺什么？',
          difficulty: 'advanced',
          tags: ['Flink', 'Checkpoint', 'Exactly-Once', '两阶段提交'],
          points: [
            '内部状态一致性靠 **Chandy-Lamport 分布式快照的变体**：JobManager 的 Checkpoint Coordinator 定期向 source 注入 **Barrier（屏障）**；Barrier 随数据流向下游传播，算子收到所有输入的 Barrier 后把**当前状态异步快照**到 StateBackend（RocksDB/HDFS），并向下游广播 Barrier——Barrier 对齐保证快照是"所有算子同一逻辑时刻"的一致切面，失败恢复时全部回滚到该快照重放。',
            '**Barrier 对齐的代价**：快的输入通道要等慢的（背压时对齐缓冲区膨胀），Flink 1.11+ 提供 **Unaligned Checkpoint**——Barrier 立即透传，来不及处理的输入数据作为快照一部分持久化，用 checkpoint 体积换稳定性（大状态/背压场景的救命选项）。',
            '**端到端 Exactly-Once 还差两段**——source 可重放（Kafka offset 存入 checkpoint，恢复时从记录的 offset 重读）与 sink 可幂等/可事务：**幂等写**（按主键 upsert 到 DB/ES，重放也不产生重复）；**事务写**（TwoPhaseCommitSinkFunction——预提交：数据写入外部事务但不提交，checkpoint 完成后**正式提交**；Kafka 0.11+ 事务、JDBC 幂等属此类）。',
            '答题收束点睛：Exactly-Once 的精确含义是"**状态 + 输出的效果恰好一次**"（effectively-once），不是"每条数据物理上只处理一次"——重放与去重无处不在，一致性是系统协作出来的协议，不是算子的开关。',
          ],
          followUps: [
            {
              question: 'checkpoint 很慢或经常失败，你怎么排查？',
              points: [
                '看 checkpoint 的**同步/异步耗时与对齐时间**：同步阶段长 → 状态太大（RocksDB 开增量 checkpoint、状态 TTL 清理）；对齐时间长 → 有算子背压（先解决反压，或上 Unaligned Checkpoint 应急）。',
                '再查 barrier 传播链：某个并发度卡住整个 checkpoint（数据倾斜的 task 处理慢）；以及外部存储抖动（HDFS/RocksDB 写入延迟）。checkpoint 是**全链路健康度的探针**——它慢，往往先于业务指标暴露问题。',
              ],
            },
            {
              question: 'Exactly-Once 和 At-Least-Once 怎么选？用幂等替代事务有什么代价？',
              points: [
                'At-Least-Once + 幂等/去重能覆盖绝大多数业务（计数用 upsert、告警带去重键），配置简单、吞吐高——**默认选择**；真 Exactly-Once（事务型 sink）有延迟代价（要等 checkpoint 才对外可见）与外部系统依赖（Kafka 事务、DB 支持度）。',
                '判断标准是**下游对重复的容忍度**：金融扣款必须事务或强幂等；统计大盘 At-Least-Once + 幂等写足够。"语义是业务选型不是技术炫耀"是这题的高级答案。',
              ],
            },
          ],
        },
        {
          id: 'bd-flink-watermark',
          title: 'Flink 的窗口与水位线是怎么处理乱序和迟到数据的？',
          difficulty: 'advanced',
          tags: ['Flink', '窗口', '水位线', '事件时间'],
          points: [
            '两种时间语义：**事件时间**（数据自带的业务时间戳，乱序场景的正确性基础）与**处理时间**（机器时钟，快但不可靠）。真实流必然乱序（网络抖动、上游重试、离线补传），所以生产按事件时间算——由此引出核心矛盾：**窗口不知道"数据都到齐了没有"，不可能无限等**。',
            '**水位线（Watermark）**就是这个矛盾的解法：一个单调递增的"时间进度声明"——`watermark = 已见最大事件时间 - 允许乱序度（如 5s）`，含义是"**事件时间 ≤ watermark 的数据应该都到了**"；窗口在其结束时间 ≥ watermark 时触发计算。本质是**正确性与延迟的显式权衡**：乱序度设得大，结果准但出数慢。',
            '窗口体系：滚动（Tumbling，不重叠）、滑动（Sliding，带步长重叠）、会话（Session，按活动间隙动态切）；触发后**迟到数据处理三板斧**——`allowedLateness`（窗口触发后不销毁，迟到数据来了**增量更新结果**）、**侧输出流（side output）**（超晚数据旁路收集，人工修正或另算）、直接丢弃（容忍度高的指标）。',
            '答题点睛：水位线不是"解决"乱序而是**界定乱序容忍度**——它是把业务问题（多晚的数据可以不算）翻译成参数的机制；面试常追问"watermark 设 5 分钟还是 5 秒"——答案永远是按业务对实时性与准确性的要求定，再配 allowedLateness 兜底。',
          ],
          followUps: [
            {
              question: '某个分区（如 Kafka 某个空闲 partition）长期不来数据，水位线会怎样？怎么解决？',
              points: [
                '多并行度下 watermark 取**各输入通道最小值**——一个空闲分区的水位线不动，全局水位线被卡死，窗口迟迟不触发（经典生产事故：夜间无流量的低峰业务分区拖住整条链路）。',
                '解法：Flink 1.11+ 的 **withIdleness**（分区空闲超时后将其排除出 watermark 计算，代价是空闲分区迟到数据算迟到）；或业务侧保证心跳/空数据流入。这题考的是"知道水位线是 per-channel 协调的"这个实现层细节。',
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'bd-pipeline',
      name: '数据采集与管道',
      description: 'CDC 与数据同步是数仓的入口工程，考察对一致性、延迟与改造成本的权衡能力。',
      references: [
        { label: 'Flink CDC 官方文档', url: 'https://nightlies.apache.org/flink/flink-cdc-docs-stable/' },
        { label: 'Debezium 官方文档', url: 'https://debezium.io/documentation/' },
      ],
      questions: [
        {
          id: 'bd-cdc-sync',
          title: '数据从 MySQL 同步到数仓，CDC 链路怎么设计？为什么不用定时全量扫描？',
          difficulty: 'intermediate',
          tags: ['CDC', '数据同步', 'Canal', 'Flink CDC'],
          points: [
            '方案演进三阶段：① **定时全量/增量扫表**（按 update_time 拉增量）——实现简单，但依赖业务表有时间戳字段、扫库压力、分钟级延迟、**捕获不了删除**；② **双写**（业务代码同时写库与 MQ）——侵入业务、**双写不一致**是老大难；③ **CDC（Change Data Capture）**——解析数据库日志（binlog）拿到变更流，对业务零侵入、秒级延迟、增删改全覆盖，是当前标准答案。',
            'CDC 工具链：**Canal**（伪装 MySQL slave 拉 binlog，投递 MQ，下游消费）与 **Flink CDC / Debezium**（基于 binlog 快照 + 增量，直接作为 Flink source 流式入仓）。设计要点：binlog 必须用 **ROW 格式**（才能拿到每行的前后镜像）；MySQL 主从切换、DDL 变更（加列/改列型）都要有处理预案。',
            '完整链路模板：MySQL binlog → **Flink CDC**（先做**全量快照 + 无缝切换增量**，无锁或低锁读取）→ Flink SQL 做轻量清洗/维度关联 → 写入 **DWD 层（Hudi/Paimon 湖表或 Kafka）**→ 下游批/流任务共用。关键设计点：**全量与增量的平滑衔接**（快照期间的新变更不能丢——基于 binlog 位点回放）与**幂等入湖**（按主键 upsert，重放安全）。',
            '一致性对照收束：全量扫描是"T+1 的一致性快照"，CDC 是"持续收敛到最终一致"——秒级延迟换来的复杂度（位点管理、乱序、幂等）必须有人接住；**同步方案的选型本质是延迟要求与工程成本的交换**，日报表没必要上 CDC，实时看板离不开它。',
          ],
          followUps: [
            {
              question: 'CDC 链路里下游怎么防止重复数据？（binlog 重放、任务重启都会带来重复）',
              points: [
                '三层防线：**位点管理**——offset/GTID 存入 Flink checkpoint，重启从位点续传而不是重头拉；**幂等写入**——下游按主键 upsert（同一条变更重放只会覆盖一次），这是兜底也是最可靠的一层；**去重窗口**——无法拿到主键的日志类数据，用窗口内按唯一键去重。',
                '核心思想：流式系统里重复是常态，**设计目标是"重复无副作用"而不是"杜绝重复"**——与 Exactly-Once 的 effectively-once 思想一脉相承。',
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'bd-lakehouse',
      name: '数据湖与架构演进',
      description: '数据湖三剑客与 Lambda/Kappa 架构是近两年面试的新热点，考察技术视野与架构演进理解。',
      references: [
        { label: 'Apache Iceberg 官方文档', url: 'https://iceberg.apache.org/docs/latest/' },
        { label: 'Apache Hudi 官方文档', url: 'https://hudi.apache.org/docs/overview/' },
      ],
      questions: [
        {
          id: 'bd-lambda-kappa',
          title: 'Lambda 和 Kappa 架构分别是什么？实时数仓怎么演进？',
          difficulty: 'intermediate',
          tags: ['Lambda 架构', 'Kappa 架构', '实时数仓'],
          points: [
            '**Lambda 架构**：同一条数据**双链路**处理——批层（Hive/Spark，T+1 全量准）+ 速度层（Storm/Flink，秒级增量）→ 服务层合并视图。优点：批层兜底，任一层出错可重算修复；缺点：**同一套业务逻辑写两遍**（Java 离线任务 + 实时任务），口径容易不一致，运维两套系统。',
            '**Kappa 架构**：只保留**流层**——一切数据进 Kafka，实时任务消费出结果；要重算历史时，把日志的**保留期内的数据从源头重放**（起一个新版本任务从 offset 0 消费，算完切换）。优点：一套代码一个口径；前提：**Kafka 要能长期保留数据**（分层存储进对象存储）且流处理引擎能覆盖批的能力。',
            '演进主线（答题的逻辑骨架）：批流分离（Lambda 双写）→ 批流统一引擎（Flink 一套代码两种模式）→ **批流统一存储**（数据湖表同时服务流式写入与批式查询）——第三步就是湖仓的使命：Hudi/Paimon/Iceberg 表作为统一存储，Flink 秒级写入 + Spark 离线回刷读同一份数据，Lambda 的双链路在**存储层合流**。',
            '务实收尾：多数公司的现状是"Lambda 起家 → 核心 Kafka 链路 Kappa 化 → 新建场景直接湖仓"。架构选型看三件事：**重算成本、口径一致性要求、团队维护能力**——没有一步到位，演进路线讲清楚比站队更值钱。',
          ],
          followUps: [
            {
              question: 'Kappa 架构"重放重算"听起来美好，落地时最大的坑是什么？',
              points: [
                '**Kafka 保留期与重放成本**：业务按 7 天保留，但"重算 90 天"的需求一出现，日志已经没了——所以 Kappa 的真前提是**原始日志进长期存储**（Kafka 分层存储/对象存储 + 事件时间可重放），否则重算只能回退批链路。',
                '第二个坑：**状态兼容**——新版任务重放时，窗口逻辑、维表 join 的口径必须与线上完全一致，否则重算结果与实时结果对不上；要靠"影子任务跑N天对账再切换"的灰度纪律。架构图很美，工程纪律才是落地成本。',
              ],
            },
          ],
        },
        {
          id: 'bd-lakehouse-format',
          title: '数据湖（Hudi/Iceberg/Paimon）到底解决什么问题？"湖仓一体"是什么？',
          difficulty: 'advanced',
          tags: ['数据湖', 'Iceberg', 'Hudi', '湖仓一体'],
          points: [
            '先说裸湖的痛点：数据直接以 Parquet/ORC 文件堆在对象存储（S3/OSS/HDFS）上便宜又灵活，但**没有事务、没有更新、没有元数据管理**——并发写互相覆盖、部分写入留下脏文件、删一条记录要全表重写、查询引擎各读各的快照。数据湖格式（table format）就是在文件之上补一层**表语义**。',
            '三剑客的核心机制（共同的底座）：**原子提交与快照隔离**（元数据版本化，写操作要么整体可见要么不可见）；**MVCC 快照读**（查询读到一致性快照，写入不阻塞读）；**upsert/增量消费**（Hudi 的 COW/MOR 表、Paimon 的 LSM 设计，让"改一条记录"成为可能）；**schema 演进**（加列/改类型不重写数据）；配合**小文件 compaction** 与**隐藏分区**提升运维与查询体验。差异一句话：Hudi 强在 upsert 与增量管道（CDC 场景），Iceberg 强在通用表格式与生态中立（多引擎标准），Paimon（原 Flink Table Store）为流式高频写入而生。',
            '为什么它们重要——**把"数仓的表语义"搬到廉价存储上**：存储与计算解耦后（对象存储 + 任意引擎），不需要搬迁进 Hive/ClickHouse 就能获得 ACID、时间旅行（查历史快照做审计/回溯）、增量读取（流式下游只消费变更）。',
            '"湖仓一体（Lakehouse）"的准确表述：在数据湖存储之上提供**数据仓库级的管理与性能**——统一元数据、事务、索引、缓存，让 BI/ML/实时共用一份数据，消除"湖里一份、仓里一份"的双拷贝与口径漂移。答题警惕：湖仓一体不是某个产品名，是**架构目标**；当前工程现实是"湖格式 + 查询引擎 + 缓存"的组合在逼近仓的体验。',
          ],
          followUps: [
            {
              question: '已经有 Hive 数仓了，什么场景值得引入湖格式？迁移成本在哪？',
              points: [
                '值得引入的信号：① **CDC 高频更新**入仓（Hive 分区覆盖重写扛不住）；② 需要**近实时查询**同一份数据（分钟级）；③ **多引擎争抢**一张表（Iceberg 的中立事务表）；④ 需要**时间旅行**做数据回溯与审计。纯 T+1 批处理存量场景没必要为了新而新。',
                '迁移成本清单：**小文件与 compaction 运维**（高频写入的必然代价，要配自动合并任务）；**元数据迁移与口径重建**（存量 Hive 表一次性迁移工具 + 双跑对账）；**平台配套**（catalog 统一、权限、血缘、监控都要重新接）——湖格式买的不是文件格式，是一整套运维体系。',
              ],
            },
          ],
        },
      ],
    },
  ],
};
