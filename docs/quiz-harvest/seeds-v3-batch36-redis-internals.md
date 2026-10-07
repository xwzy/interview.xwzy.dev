# 批 36 种子 · Redis源码剖析与实战（来源课程笔记 46 篇）

> 来源：极客时间《Redis 源码剖析与实战》课程笔记（00~32 讲 + 加餐 + 答疑），课程源码基准 Redis 5.0.8（第 13 讲起用 6.0.15）。
> 查重基准：be-redis 现有 10 题 + 同批《Redis 核心技术与实战》种子（seeds-v3-batch36-redis-core.md，S1 单线程卡点/lazy free、S3 碎片、S7 Stream MQ、S10 六 6.0 特性等已占坑）。
> 分工边界：本批专注**源码与数据结构实现层**——结构体字段、复杂度断言、连锁更新/渐进式 rehash 等"缺陷与修补"故事、内存账。与工程课撞车的主题已在条目上标注，交整合者裁决。
> 收割原则：为什么这样设计（对比取舍）、实现缺陷与修补、内存与系统调用开销账优先；纯源码行号走读、工具清单丢弃。

## 一、候选新题（现有题库未覆盖）

### S1. Redis 的 String 底层为什么不直接用 C 语言的 char*？SDS 到底精打细算在哪？
- 来源：02 _ 键值对中字符串的实现（辅：04 _ 内存友好的数据结构、答疑1 第 4 讲）
- 核心素材：
  - char* 三宗罪：以 `\0` 判结束 → 天然**非二进制安全**（数据本身含 `\0` 会被截断）；strlen 需遍历 O(N)；strcat 不检查空间、要开发者自己保证/扩容，忘了就是缓冲区溢出。
  - SDS = 字符数组 buf + 元数据 **len（现有长度）/ alloc（已分配长度）/ flags（类型）**：长度类操作直接读元数据 O(1)；追加前由 sdsMakeRoomFor 统一做空间检查与扩容（扩容逻辑被封装，调用方不可能忘）；仍保留末尾 `\0` 只是为了兼容 C 字符串函数，判长不靠它。
  - 五种结构头 sdshdr5/8/16/32/64（5 已弃用）：len/alloc 分别用 uint8/16/32/64_t——短字符串用小头，避免"10 字节的内容配 16 字节元数据"的浪费。
  - 编译技巧：结构体声明加 `__attribute__((packed))` 取消字节对齐——char+int 两个成员从默认 8 字节压到 5 字节，是内存敏感型结构的通用手法。
  - 嵌入式字符串 embstr：**len ≤ 44** 时 redisObject 与 sdshdr8 一次分配在一块连续内存（`zmalloc(sizeof(robj)+sizeof(sdshdr8)+len+1)`）；>44 走 raw，robj 与 SDS 各分配一次，多一次分配还多碎片。
- 建议追问：
  1. 44 这个阈值是怎么算出来的？（→ jemalloc 按 2 的幂分桶（8/16/32/64B）；robj 头 16B（type:4+encoding:4+lru:24 位域压成 4B + refcount 4B + ptr 8B）+ sdshdr8 元数据 3B + 结尾 `\0` 1B = 20B；64−20=44，正好塞进一个 64B 分配块）
  2. redisObject 自己省内存的手法是什么？（→ 位域定义：type 4bit + encoding 4bit + lru 24bit 共用一个 32bit，比三个 unsigned 省 8B；这个 24bit 的 lru 还被 LFU 复用）
  3. embstr 有什么代价或限制？（→ 只读友好：任何修改都要转 raw 重新分配，embstr 是不可变的；这也是"读多写少小 value 最划算"的边界）
- 建议难度：basic（讲到 44 字节推导与位域时进 intermediate）

### S2. Redis 渐进式 rehash 具体是怎么"渐进"的？什么触发、一次迁多少、迁完怎么办？
- 来源：03 _ 如何实现一个性能优异的Hash表（辅：17 讲 dictGenericDelete、答疑1 第 3 讲）
- 核心素材：
  - 结构：dictht{table, size, sizemask, used}；dict{**ht[2]**, rehashidx}。平时全写 ht[0]；rehash 时逐桶搬去 ht[1]，搬完释放旧表、ht[0]=ht[1]、ht[1] 清空、rehashidx=-1 归位。
  - 触发（_dictExpandIfNeeded 三条件）：ht[0].size==0（初始化扩到默认大小）；**负载因子 used/size ≥ 1 且 dict_can_resize=1**（扩到 used*2，_dictNextPower 向上取 2 的幂）；负载因子 **> 5（dict_force_resize_ratio）强制扩**（绕过 can_resize 限制）。
  - dict_can_resize 由 updateDictResizePolicy 控制：**存在 RDB 子进程或 AOF 重写子进程时禁扩容**——fork 出的子进程靠写时复制共享内存，rehash 大量搬数据会放大父进程 COW，这是"持久化与 rehash 联动"的经典细节。
  - 执行（dictRehash(d,n)）：按桶粒度搬 n 个桶，桶内链表逐项重算 hash&ht[1].sizemask 头插；**empty_visits = n*10**：连续扫到 10n 个空桶就收手返回，避免空桶太多时一次占用主线程过久。
  - "渐进"入口：dictAddRaw / dictGenericDelete / dictFind / dictGetRandomKey / dictGetSomeKeys 都先调 _dictRehashStep（n=1）——**每次增删查顺带迁一个桶**；rehash 期间查找先查 ht[0] 再查 ht[1]，删除/更新必须两表都顾；有迭代器（d->iterators!=0）时暂停分步迁移。
  - 哈希函数是 **siphash**（dictGenHashFunction → siphash.c），且启动时 main 里用随机 hex 设置 dictSetHashFunctionSeed——哈希种子随机化，防哈希碰撞 DoS。
  - dictEntry 的值是**联合体** `union v {void *val; uint64_t u64; int64_t s64; double d;}`：整数/浮点直接内嵌，免一次指针与分配。
- 建议追问：
  1. 为什么要渐进？一次性 rehash 的代价具体是什么？（→ 搬 N 个键 O(N) 阻塞主线程，百万级 key 一次搬就是百毫秒级卡顿；分摊后单次只迁一桶，微秒级）
  2. rehash 期间内存和性能各有什么表现？（→ 两张表并存内存上涨；每次读写多一步迁移、查询可能查两表；负载因子 >5 强制扩说明"不扩的代价更大"——链越查越长）
  3. 为什么持久化期间干脆禁止扩容？（→ fork+COW：子进程复制页表后共享物理页，父进程改一页拷一页；rehash 把 key 搬得越散父进程写页越多，内存翻倍风险放大，见 S7/工程课 S2 的 fork 故事）
- 建议难度：intermediate

### S3. ZSet 的跳表里 span 是干嘛的？为什么层数用随机数而不是严格每层减半？
- 来源：05 _ 有序集合为何能同时支持点查询和范围查询（辅：答疑1 第 5 讲双索引的代价）
- 核心素材：
  - zskiplistNode{ele(sds), score(double), backward(后向指针，只 level0 有), **level[]{forward, span}**}；zskiplist{header, tail, length, level}。
  - **span 记录该层 forward 指针跨过了 level0 上几个节点**：查询路径上各层 span 累加 = 目标节点在有序集合中的排名——这就是 ZRANK/ZREVRANK 能 O(logN) 的实现依据（纯链表跳表做不到 rank）。
  - 查找两条件：forward->score 小于目标 → 本层继续前进；score 相等且 sdscmp(ele)<0 → 也前进；否则下降一层。比较永远是"score 优先、member 决胜"，所以同 score 元素也全局有序。
  - 为什么随机层数：若强制相邻层 2:1，插入/删除要**连锁调整后续所有节点的 level 数组**（重新分配层数、改指针），插一个节点动半个表；随机层数下插入只改前后相邻节点的指针，代价 O(1) 次指针修改，统计上仍保持对数查找复杂度。
  - zslRandomLevel：level 从 1 起，`while((random()&0xFFFF) < ZSKIPLIST_P*0xFFFF) level++`，**ZSKIPLIST_P=0.25（每升一层概率 25%，期望层高约 1.33），ZSKIPLIST_MAXLEVEL=64**（5.0 源码值）。取 0.25 而非 0.5：更高层节点更少，省指针内存（层数分布更矮胖）。
  - 双索引协作：zset{dict, zsl}——dict 管 O(1) ZSCORE；**dict 的 value 直接指向跳表节点的 &znode->score**，score 更新时 zslUpdateScore 改跳表、dict 无需改（同一份数据），zsetAdd 顺序调两个结构保持一致，两边操作保持独立不互相嵌套。
- 建议追问：
  1. 双索引的代价是什么？（→ 内存双份（每个 member 存两处 + dictEntry 24B+）；一致性要靠调用方顺序更新——Redis 单线程所以天然安全，多线程系统做双索引就得考虑加锁或异步同步的一致性方案）
  2. 对比红黑树/B+ 树，随机层数的跳表赢在哪？（→ 现有 be-redis-datatypes 已有结论：实现与调试简单、范围查询顺链表、span 支持 rank；补充：跳表按排名取范围也可 O(logN)+M）
  3. 把 P 从 0.25 调成 0.5 会怎样？（→ 层数期望翻倍（2 vs 1.33），指针内存涨、查找比较次数略降——Redis 选省内存，因为它是内存数据库）
- 建议难度：intermediate

### S4. 从 ziplist 的连锁更新到 listpack：Redis 是怎么一步步修掉这个设计缺陷的？
- 来源：06 _ 从ziplist到quicklist，再到listpack（辅：04 讲 prevlen 编码、答疑1 第 6 讲）
- 核心素材：
  - ziplist 布局：头 10B 固定（zlbytes 4B 总长 + zltail 4B 尾偏移 + zllen 2B 元素数）+ entries + 尾字节 0xFF；**entry = prevlen + encoding + data**。
  - prevlen 变长编码：前一项 **<254B 用 1 字节；否则 5 字节**（首字节固定 254 作标记 + 4 字节实际长度）。encoding 同理按长度分档（字符串 ≤63B 1 字节、≤16383B 2 字节、更大 5 字节）。
  - **连锁更新成因**：插入一个 ≥254B 的元素后，后一项的 prevlen 要从 1B 扩成 5B，它自身变大又可能让再后一项的 prevlen 超限……最坏整条链每项都要重分配，且每次插入都伴随 ziplistResize 整块 zrealloc + 数据拷贝。
  - 治标——**quicklist（3.2 引入）**：双向链表串起多个 ziplist 节点；quicklistNode{prev, next, zl, sz, count:16, encoding:2, container:2, recompress:1, attempted_compress:1, extra:10}；插入前 _quicklistNodeAllowInsert 判单节点 ziplist **≤8KB**（list-max-ziplist-size）否则新建节点——把连锁更新和 realloc 的爆炸半径限制在单个节点内，代价是每节点多一份链表指针开销。
  - 治本——**listpack（5.0 引入）**：头 6B（总字节数 4B + 元素数 2B）+ 尾 0xFF；**entry = encoding + data + backlen（只记自身总长度，1~5B 变长，每字节最高位是延续位）**，彻底不存 prevlen → 改任何一项都不影响别项，连锁更新从根上消失；反向遍历靠从右往左逐字节解 backlen 得到前一项总长。
  - 工程配套：hash-max-ziplist-entries / zset-max-ziplist-* 限制条目数与单值大小防 ziplist 过大；**一旦超限转 hashtable/skiplist 就不可逆**——所以用集合类型省内存时要主动按二级编码分桶（工程课 S3 已覆盖分桶案例）。
- 建议追问：
  1. quicklist 和 listpack 各自的取舍？（→ quicklist 保住了"单节点内连续内存"又限制爆炸半径，但指针开销回来了；listpack 内存最省且无连锁更新，但整块连续内存仍不适合存太多/太大元素——所以 7.0 后 Hash/ZSet 小编码统一用 listpack，List 用 quicklist 节点内换 listpack）
  2. listpack 不存前项长度，反向遍历怎么实现？（→ backlen 按字节自描述长度（最高位延续位），从尾部即可解出前一项的总长；ziplist 反向靠 zltail+prevlen，listpack 反向靠 backlen）
  3. 为什么 ziplist→hashtable 转换不可逆？（→ 转回去没有收益触发点：连续内存布局只有在"元素少且小"时才省，Redis 不主动做缩小转换，避免来回抖动——配置阈值本质是单行道开关）
- 建议难度：intermediate（连锁更新推导讲透可标 advanced）

### S5. Stream 为什么用 Radix Tree 存消息 ID，而不是哈希表或跳表？
- 来源：07 _ 为什么Stream使用了Radix Tree（辅：答疑2 第 7 讲对比、28 讲 slots_to_keys）
- 核心素材：
  - 动机是**内存账**：消息 ID = 毫秒时间戳-序号，连续消息 ID 前缀高度相同（如前 8 位都是 16281725）；哈希表把每个 ID 完整存一遍，前缀冗余；消息内容里 field 名也高度重复。Stream 结构 `stream{rax *rax; uint64_t length; streamID last_id; rax *cgroups}`：ID 进 rax 作 key，**消息内容用 listpack 存作 value**，且同一 listpack 里用 master entry 把重复的 field 名只存一份。
  - rax = 压缩前缀树：普通 trie 每节点 1 字符，无分支的串行字符链合并成"压缩节点"；节点头 **raxNode{iskey:1, isnull:1, iscompr:1, size:29, data[]} 共 4B**：非压缩（分支）节点 data = N 个单字符 + N 个子指针；压缩节点 data = 合并字符串 + 1 个子指针；叶子 size=0 无子指针，仅 value 指针；iskey 表示"根到此节点的路径已是完整 key"。
  - 复杂度断言：**单 key 查询 O(K)，只与 key 长度相关、与数据量无关**；有序性天然支持按 ID 范围查。
  - 对比（答疑结论）：vs 哈希表——省前缀内存、有序；vs 跳表/B+ 树——**范围查询弱**（B+ 叶子可存多 key、跳表可顺链表遍历，rax 每到叶子都要回溯），且实现复杂度更高；同思路的先例：Linux 内核 page cache 用 radix tree 存"文件偏移→缓存页"。
  - 彩蛋：clusterState 里的 **slots_to_keys 也是 rax**（以 slot 编号为前缀的 key 索引），CLUSTER GETKEYSINSLOT 靠它快速列出某 slot 的 key。
- 建议追问：
  1. Stream 的消费组为什么也用 rax？（→ 消费组名同为字符串 key、数量少但可枚举，复用同一套有序前缀索引；PENDING List 等状态挂在对应结构下）
  2. 如果业务 key 毫无公共前缀，rax 还划算吗？（→ 前缀共享失效退化为近似 trie，节点多、指针开销大；rax 的收益与"key 前缀相似度"正相关——消息 ID 时间戳前缀是天然高相似场景）
  3. 为什么不干脆用跳表存 ID？（→ 跳表每节点要存完整 sds key，无前缀共享，内存更高；且 Stream 需要"按 ID 找 listpack"的点查为主，rax 的 O(K) 点查更贴合）
- 建议难度：advanced

### S6. Redis 6.0 的多 IO 线程到底并行了什么？命令执行为什么还在主线程？
- 来源：13 _ Redis 6.0多IO线程的效率提高了吗（辅：14 讲原子性、答疑3 第 13 讲锁停车）（**与工程课 S10 轻度撞车**：那边讲配置与客户端缓存，这边讲实现机制，交整合者裁决）
- 核心素材：
  - 初始化 initThreadedIO：io_threads_num==1 直接返回；> **IO_THREADS_MAX_NUM(128)** 报错退出；四组数据结构：io_threads（线程描述符）、io_threads_mutex、`_Atomic` io_threads_pending、io_threads_list（每线程一个待处理 client 链表）。**0 号线程就是主 IO 线程**。
  - 推迟读：readQueryFromClient → postponeClientRead **四条件**——io_threads_active=1 && **io-threads-do-reads=yes（默认 no）** && !ProcessingEventsWhileBlocked && 客户端无 CLIENT_MASTER/CLIENT_SLAVE/CLIENT_PENDING_READ 标记 → 打 CLIENT_PENDING_READ 标记进 server.clients_pending_read。
  - 推迟写：addReply → prepareClientToWrite → clientInstallWriteHandler：未打过 CLIENT_PENDING_WRITE 且（非复制客户端或从库 RDB 已传完）→ 进 clients_pending_write。
  - 分发：beforeSleep 里 handleClientsWithPendingReads/WritesUsingThreads 按 **item_id % io_threads_num 轮询**分给各线程；主线程亲自处理 io_threads_list[0]，然后 **while(1) 忙等** io_threads_pending 全部归零——一轮内所有线程只做同一种操作（全局 io_threads_op=READ 或 WRITE），天然无锁。
  - **IO 线程不执行命令**：解析阶段只解析第一条命令就把客户端标成 CLIENT_PENDING_COMMAND 退出循环；等全部线程读完，主线程统一 processCommandAndResetClient + processInputBuffer 执行——SET NX / Lua 的原子性因此不受多线程影响。
  - 弹性开关：待写客户端数 **< 2×线程数** 时 stopThreadedIOIfNeeded 回退单线程处理（线程少任务少时多线程调度反而亏）；空闲停车机制——IO 线程先自旋 100 万次查 pending，仍无任务就 pthread_mutex_lock 挂起；主线程 startThreadedIO 逐个 unlock 唤醒、stopThreadedIO 逐个 lock 冻结：**用互斥锁当启停开关，线程常驻不销毁**。
- 建议追问：
  1. 为什么 io-threads-do-reads 默认关闭？（→ 官方建议：写回是纯 send，多线程收益稳；读路径涉及解析且多数场景读带宽未成瓶颈，开多了白耗核；压测确认读是瓶颈再开）
  2. 为什么一轮内所有 IO 线程只做读或只做写，而不是各干各的？（→ io_threads_op 是全局标志，读写分组批次执行，免掉线程间对 client 的锁竞争；批次间由主线程做屏障（忙等 pending==0））
  3. 如果把命令执行也放进 IO 线程会怎样？（→ 多线程并发写共享数据结构必须加锁：性能被锁竞争吃掉 + 开发调试复杂度飙升；Redis 的选择是"IO 并行、执行串行"，执行瓶颈应靠切片集群水平扩展——答疑3 第 14 讲结论）
- 建议难度：advanced

### S7. AOF 重写期间的新写命令是怎么进重写文件的？三条管道 + 10MB 缓冲块
- 来源：19 _ AOF重写（上）、20 _ AOF重写（下）（辅：答疑4 第 19/20 讲）（**与工程课 E2"一个拷贝两处日志"概念撞车**，本条是管道/缓冲实现层，交整合者裁决）
- 核心素材：
  - 四个触发时机：手动 BGREWRITEAOF（已有 RDB 子进程则只置 aof_rewrite_scheduled=1）；CONFIG SET appendonly yes 及主从同步后 restartAOFAfterSYNC；serverCron 每 100ms 补调度 scheduled 标记；serverCron 自动判断：**AOF 开启 && 增长比例 ≥ auto-aof-rewrite-percentage（默认 100%）&& 当前大小 > auto-aof-rewrite-min-size（默认 64MB）**。
  - **有 RDB 子进程在跑就不并行重写**（答疑4）：两个子进程都要全量扫数据耗 CPU，更要命的是同时大量写盘互相抢磁盘 IO——子进程并行不等于免费。
  - fork 后父进程立刻 **updateDictResizePolicy 禁 rehash**：防父进程大量搬键放大 COW；子进程结束时 zmalloc_get_private_dirty 统计**实际 COW 脏页量**，经 child_info_pipe 管道报给父进程打日志——COW 是可观测的。
  - **三条管道**（aofCreatePipes，fds[6]）：①数据管道父→子（fds[0]/[1] 设非阻塞）；②子→父 ACK；③父→子 ACK。子进程完成重写后向②写"！"，父进程读事件回调 aofChildPipeReadable 回"！"，子进程 syncRead（5 秒超时）收到后收尾——一对"！"字符的双向确认。
  - 新写命令的去向：feedAppendOnlyFile 把命令**同时**写 aof_buf（正常 AOF）和 **aof_rewrite_buf_blocks**——10MB 一块的 aofrwblock{used, free, buf[10MB]} 链表；同时在数据管道写描述符上注册 AE_WRITABLE 事件，回调 aofChildWriteDiffData 逐块 write 给子进程。
  - 子进程侧 aofReadDiffFromParent 用 64KB buffer 持续读管道、追加进 server.aof_child_diff；rewriteAppendOnlyFileRio 遍历期间、主体函数结束后**各读多轮**，最后把 aof_child_diff 一并写入重写文件——混合持久化时 rdbSaveRio 里同样有这一步（RDB 头之后追加增量）。
- 建议追问：
  1. 重写为什么必须 fork 子进程而不是主线程自己做？（→ 全量遍历+写盘是长任务，主线程做等于停服；fork 拿到数据快照（COW），主线程只负责把增量"喂"过去）
  2. 重写期间内存为什么会双重放大？（→ aof_rewrite_buf_blocks 按写入速率无限增长 + COW 脏页随写放大；这正是 7.0 Multi-Part AOF 移除 aof_rewrite_buf 的动机——现有题 be-redis-persistence 已有 7.0 结论，此处补齐它删掉的到底是什么）
  3. ACK 握手为什么要两条管道？（→ 管道单向：子→父、父→子各一条才能双向确认；数据与控制信号分离，避免控制字节混进命令流）
- 建议难度：advanced

### S8. UNLINK 一定是异步的吗？——lazy free 的阈值与开销评估
- 来源：17 _ Lazy Free会影响缓存替换吗（辅：12 讲 bio 线程、答疑3 第 17 讲）（**与工程课 S1 撞车**：那边讲"哪些操作卡主线程 + UNLINK 用法"，这边讲删除的内部实现与阈值，交整合者裁决）
- 核心素材：
  - 删除 = 两步：**从哈希表摘除（必须主线程做，保证后续读不可见）+ 释放内存（可异步）**。dictGenericDelete(d, key, nofree)：dictDelete（nofree=0，摘除即释放）与 dictUnlink（nofree=1，只摘除返回 dictEntry）是同一个函数的两个门面。
  - dbAsyncDelete 流程：先同步删 expires 表 → dictUnlink 主表 → **lazyfreeGetFreeEffort 评估释放开销**：List=quicklist 长度、Set（哈希表编码）=元素数、Hash/ZSet 同理按元素数，非集合或紧凑编码 =1 → **开销 > LAZYFREE_THRESHOLD（64）且 refcount==1** 才 bioCreateBackgroundJob(BIO_LAZY_FREE) 扔后台线程，并把该 entry 的 value 置 NULL；否则 dictFreeUnlinkedEntry 在主线程当场释放——**UNLINK 对小 key 就是同步 DEL**。
  - refcount==1 的判断：共享对象（shared.integers、回复对象）和被事务/模块引用的对象不能由后台线程 free。
  - 四个惰性删除开关（默认全 no）：lazyfree-lazy-eviction（淘汰）、lazyfree-lazy-expire（过期）、lazyfree-lazy-server-del（隐式删除如 RENAME 覆盖）、replica-lazy-flush（全量同步前清库）。
  - 淘汰与惰性删除的联动：freeMemoryIfNeeded 选定 key 后 propagateExpire——按配置把删除命令定为 **shared.unlink 或 shared.del**（共享命令对象），先写 AOF 再 replicationFeedSlaves 同步从库；随后 dbAsyncDelete/dbSyncDelete 前后各调一次 zmalloc_used_memory 差值记账 mem_freed；**异步释放不能立刻到账，所以每淘汰 16 个 key 主动复查一次 getMaxmemoryState**，达标即提前结束淘汰循环。
  - 后台线程侧：bioProcessBackgroundJobs 按类型分派，lazy free 对应 lazyfreeFreeObjectFromBioThread / lazyfreeFreeDatabaseFromBioThread / lazyfreeFreeSlotsMapFromBioThread，内部同样是 decrRefCount；任务队列 bio_jobs[3] + bio_pending，互斥锁+条件变量同步，**取任务本身有锁开销**——这正是小对象不值得异步的原因。
- 建议追问：
  1. 为什么"摘除"必须留在主线程？（→ 内存可见性：摘除后客户端立刻查不到该 key，语义才算完成；释放只是内存回收，晚点无妨——关键路径判断和工程课 S1 的"是否返回数据"是同一原理的两种表述）
  2. 开了 lazyfree-lazy-expire，过期 key 占的内存会立刻降吗？（→ 不会，监控上要理解惰性释放的滞后；lazyfree_objects 可看后台待释放对象数）
  3. 什么配置组合下异步删除反而伤性能？（→ 大量小 key + 开了各路 lazyfree：每个删除都要走"评估→入队/释放"路径与后台线程同步，锁开销超过收益；阈值 64 就是这个权衡的显式化）
- 建议难度：intermediate

### S9. 从客户端连上来到收到回复，Redis 的事件循环一帧里都发生了什么？
- 来源：08/10/11 讲（事件驱动框架上中下）、答疑2 第 9/11 讲
- 核心素材：
  - 骨架：main 末尾 aeSetBeforeSleepProc / aeSetAfterSleepProc 后进入 **aeMain**：`while(!stop){ beforesleep(); aeProcessEvents(AE_ALL_EVENTS|AE_CALL_AFTER_SLEEP); }`——每轮循环 = 一帧。
  - aeProcessEvents：以**最近的待触发时间事件的到期时刻作为 aeApiPoll 的超时**（既不空转也不睡过头）；aeApiPoll 封装 epoll_wait（ae_epoll/ae_kqueue/ae_evport/ae_select 四个实现按平台**条件编译**选择——config.h 依据编译器预定义宏 `__linux__`/`__APPLE__` 定义 HAVE_EPOLL/HAVE_KQUEUE，Redis 没封装 poll：poll 相比 select 只是去掉 1024 限制、仍要 O(n) 扫描，在 Linux 有 epoll、其他平台有 select 的夹缝中没有独特价值；ae 内部 aeWait 倒是用 poll）；就绪事件填 fired 数组，按 mask 回调 rfileProc/wfileProc；最后 processTimeEvents 遍历时间事件链表触发到期任务。
  - 连接与读：监听 fd 注册 AE_READABLE→acceptTcpHandler→createClient 时**再注册 AE_READABLE→readQueryFromClient**（客户端发"写"请求，服务端视角都是"可读"）；readQueryFromClient 一次最多读 **PROTO_IOBUF_LEN=16KB** 进 querybuf。
  - 写回：beforeSleep → handleClientsWithPendingWrites 直接 writeToClient 尽力写；**没写完才注册 AE_WRITABLE→sendReplyToClient** 继续写——多数小回复一轮内直接写完，省一轮 epoll_wait。AE_BARRIER 屏障事件可反转"先读后写"的默认顺序，让写盘先于回复（AOF always 场景）。
  - 时间事件：aeTimeEvent{when_sec, when_ms, timeProc} 双向链表；initServer 注册 `aeCreateTimeEvent(el, 1, serverCron)`；**serverCron 默认 hz=10（可配 1~500）每 100ms 跑一次**，内部用 run_with_period(ms) 分频执行：更新全局 lruclock、databaseCron（过期删除+渐进 rehash）、触发 RDB（serverCron 里 rdbSaveBackground 有 2 次直接调用：save 条件命中 / rdb_bgsave_scheduled，加 replicationCron 与子进程结束善后共 4 条路径）、replicationCron（1s）、clusterCron（100ms）等。
  - 容量账：aeCreateEventLoop(server.maxclients + CONFIG_FDSET_INCR)，**INCR = 32+96 = 128**——事件数组大小决定连接上限，"max number of clients reached" 先查 maxclients。
- 建议追问：
  1. Reactor 三角色在 Redis 里对应什么？（→ reactor=aeMain/aeProcessEvents 的事件分发，acceptor=acceptTcpHandler，handler=readQueryFromClient/sendReplyToClient；Redis 是"单 Reactor 单线程"型，Netty 是主从 Reactor 多线程型——两三句讲清自己项目框架的类型定位）
  2. 为什么写回要放 beforeSleep 统一做，而不是读完立刻写？（→ 命令处理完回复已在输出缓冲，进 poll 前顺手写掉多数能一次成功，避免为写事件多等一轮事件循环；写不完的才升级为 AE_WRITABLE 事件）
  3. serverCron 会不会被拖太久导致定时任务失准？（→ serverCron 内部任务都有分频与次数上限（如过期删除 25% 循环上限、rehash 每次一桶），设计上保证单轮有限时长；hz 调大只能提高调度精度，救不了任务本身慢）
- 建议难度：intermediate

## 二、既有题增强素材（对应 be-redis 现有题）

### E1. 目标题目：be-redis-datatypes（数据结构底层编码）
- 来源：02/04 讲、答疑1 第 4 讲
- 追问素材：
  - "SDS 和 char* 具体差在哪？" → len/alloc 元数据 O(1) 取长、二进制安全、sdsMakeRoomFor 封装扩容；五种结构头按大小适配 + __packed 紧凑布局。
  - "embstr 的 44 怎么来的？" → 64B jemalloc 块 − robj 16B − sdshdr8 头 3B − `\0` 1B = 44；embstr 一次分配零碎片，修改即转 raw。
  - "redisObject 怎么省内存？" → 位域 type:4/encoding:4/lru:24 共 4 字节；lru 24bit 一鱼两吃：LRU 存秒级时钟、LFU 存"16bit 分钟时间戳 + 8bit 计数器"。

### E2. 目标题目：be-redis-datatypes（共享对象池——现有题未覆盖，建议作追问）
- 来源：04 讲、17 讲 propagateExpire
- 追问素材：
  - "Redis 启动时预建了哪些共享对象？" → createSharedObjects：0~9999 整数（OBJ_SHARED_INTEGERS=10000 个）、"+OK\r\n"/"-ERR\r\n" 等常用回复、DEL/UNLINK 等命令对象——千个客户端 SET 3 只存一份 robj。
  - "共享对象什么时候失效？" → 只读场景；refcount 用 OBJ_SHARED_REFCOUNT 标记不可释放，客户端拿到写命令就会新造对象（int 值甚至直接内嵌在指针位，零分配）。

### E3. 目标题目：be-redis-persistence（RDB 触发时机与文件格式）
- 来源：18 讲、答疑3 第 18 讲
- 追问素材：
  - "RDB 一共有哪些触发点？" → SAVE（主线程）/BGSAVE/主从复制（落盘或无盘 rdbSaveToSlavesSockets，RDB 流前后加 `$EOF:`+40 字节随机标记）；FLUSHALL、正常 shutdown 也调 rdbSave；serverCron 条件触发（save 配置 m 秒 n 次修改）+ bgsave 失败调度重试。
  - "RDB 文件里长什么样？" → 魔数 REDIS0009 + 辅助字段（redis-ver/ctime/used-mem，操作码 0xFA）→ 0xFE SELECTDB 库号 → 0xFB RESIZEDB 两表大小 → 每条 KV：0xFC 过期时间、0xF8 LRU 空闲、0xF9 LFU 频率、类型码、长度+数据 → 0xFF EOF + 8 字节 CRC64；**自包含格式**（类型+长度+数据）——所以能离线解析 RDB 做 bigkey 分析。
  - "文件损坏了怎么办？" → redis-check-rdb 逐段校验 CRC；redis-check-aof 按 RESP 长度前缀解析，`--fix` 会**截断**保留完整前缀（先备份）。

### E4. 目标题目：be-redis-persistence（fork 子进程的保护与观测）
- 来源：19 讲、答疑4 第 19/20 讲
- 追问素材：
  - "bgsave 期间 Redis 帮你挡了哪些事？" → updateDictResizePolicy 禁 rehash（减少 COW）；不允许第二个 bgsave；有 RDB 子进程时 AOF 重写改调度（反之亦然——两个子进程抢磁盘写与 CPU）。
  - "COW 放大怎么观测？" → 子进程结束用 zmalloc_get_private_dirty 统计实际写时复制页，经 child_info_pipe 回传父进程打日志；配合 INFO 的 latest_fork_usec（现有题已提）定位大实例 fork 风险。
  - "重启恢复先读哪个文件？" → loadDataFromDisk **先 AOF 后 RDB**（AOF 更完整）——现有题没写这个顺序。

### E5. 目标题目：be-redis-eviction（近似 LRU 的实现细节）
- 来源：15 讲、答疑3 第 15 讲
- 追问素材：
  - "近似 LRU 的'钟'怎么走？" → 全局 server.lruclock，getLRUClock=(mstime/1000)&0xFFFFFF（**1 秒精度**、24bit）；serverCron 每 100ms 刷新；key 访问时 lookupKey 更新自身 o->lru。为什么不每次调 mstime？——**省 gettimeofday 系统调用**（微秒级×每秒几万 QPS 不划算），读全局变量即可。
  - "采样 5 个就淘汰这 5 个里最旧的吗？" → 不完全是：采样进的是 **EvictionPoolLRU 候选池（EVPOOL_SIZE=16）**，按 idle 升序维护、跨轮次复用，淘汰从池尾取——池让历史采样也能参与竞争，逼近真实 LRU 的效果更好。
  - "淘汰时内存怎么算？" → getMaxmemoryState：used−maxmemory 为待释放量，**主从复制缓冲区不计入 used**（freeMemoryGetNotCountedMemory）。

### E6. 目标题目：be-redis-eviction（LFU 的 8bit 计数器怎么装下百万访问）
- 来源：16 讲、答疑3 第 16 讲
- 追问素材：
  - "8bit 最大 255，怎么区分'访问 1 千次'和'访问 10 万次'？" → LFULogIncr 概率增长：p = 1/((counter−5)×lfu-log-factor+1)，随机数 r<p 才 +1，255 封顶——counter 越大越难涨，是对数刻度；lfu-log-factor 调节增长难度。
  - "新 key 一来 counter 是多少？" → **LFU_INIT_VAL=5**（不是 0/1：设小了 baseval 大 → p 小 → 更难涨，叠加衰减会让新 key 秒被淘汰）。
  - "长期不访问的 key 频率会自己降吗？" → 会：高 16bit 存分钟级时间戳，访问时 LFUDecrAndReturn 按 (now−ldt)/lfu-decay-time（默认 1）衰减；淘汰时 idle=255−衰减后 counter 进候选池。

### E7. 目标题目：be-redis-eviction（淘汰删除与惰性删除的联动）
- 来源：17 讲
- 追问素材：
  - "淘汰一个 key，从库和 AOF 怎么知道？" → propagateExpire 按配置发 DEL 或 UNLINK（共享命令对象），先 feedAppendOnlyFile 再 replicationFeedSlaves——保证副本端删除路径一致。
  - "异步删除时淘汰循环怎么知道内存够了？" → 删除前后 zmalloc_used_memory 差值记账；每 16 个 key 复查一次 getMaxmemoryState，达标提前收手（异步释放有延迟，不能只信本地记账）。

### E8. 目标题目：be-redis-lua-pipeline（6.0 多线程 followUp 的实现级补充）
- 来源：14 讲
- 追问素材：
  - "一条命令在服务端经过哪几站？" → readQueryFromClient（16KB 读入）→ processInputBuffer（首字节 `*` 判 RESP multibulk，否则 inline）→ processCommand（redisCommandTable 查表、MULTI 命令入队回 +QUEUED）→ call 执行 → addReply 写输出缓冲。
  - "多 IO 线程为什么没破坏 Lua/事务原子性？" → IO 线程只解析**第一条**命令（标 CLIENT_PENDING_COMMAND 即停），执行统一由主线程做；写回多线程发生在命令已执行完之后。

### E9. 目标题目：be-redis-lock（SET NX 原子性的服务端解释）
- 来源：14 讲
- 追问素材：
  - "SET NX EX 的原子性到底是命令特殊，还是执行模型保证？" → setCommand→setGenericCommand：NX 时 lookupKeyWrite 已存在即返回空，否则 setKey+setExpire——多条子逻辑在同一命令内、主线程串行执行表驱动派发，原子性与命令实现无关，是单线程事件循环给的（呼应 S6：IO 线程不碰执行）。
  - "释放锁的 Lua 同理" → EVAL 整体原子 = call 执行期间不插入其他客户端命令。

### E10. 目标题目：be-redis-cluster（主从复制的状态机实现）
- 来源：21 讲、答疑4 第 21 讲
- 追问素材：
  - "从库侧复制是怎么驱动的？" → redisServer.repl_state 状态机：NONE→CONNECT（replicaof 命令）→CONNECTING（replicationCron 每 1s 驱动 connectWithMaster）→握手串（SEND/RECEIVE_AUTH、PORT、IP、CAPA）→SEND_PSYNC→收 +FULLRESYNC 转 REPL_STATE_TRANSFER（注册 readSyncBulkPayload 收 RDB）/ +CONTINUE 走增量。
  - "为什么主库不需要状态机？" → 复制由从库发起，主库只被动响应；主库对多个从库各处于不同阶段，维护 N 份状态机纯增复杂度；主库自身还要故障切换，再背状态机更重。

### E11. 目标题目：be-redis-cluster（repl_backlog 环形缓冲的 offset 换算）
- 来源：29 讲
- 追问素材：
  - "全局 offset 怎么映射到环形缓冲区里的位置？" → repl_backlog_off 记录"仍在缓冲中的最早字节的**全局偏移**"（= master_repl_offset − histlen + 1）；从库 PSYNC 带来的 offset 先算 skip=offset−repl_backlog_off，再定位缓冲内起点 j=(idx+(size−histlen))%size，j+skip 再取模——两个全局量、两个本地量完成换算。
  - "多从库为什么能共享一个 backlog？" → 所有从库按各自 offset 从同一份环形数据里取，省内存；offset 落到 repl_backlog_off 之前（被覆盖）就退化全量——即工程课 S6 的"缓冲区太小退化全量同步"的实现面。

### E12. 目标题目：be-redis-cluster（哨兵源码增量）
- 来源：23/24 讲、答疑4 第 23/24 讲
- 追问素材：
  - "客观下线对从库也判吗？" → 只判主观下线；sentinelCheckObjectivelyDown 仅对主节点执行；且**主观下线的从库会被 sentinelSelectSlave 直接跳过**，不能升主——故障切换选源要先把病号排除。
  - "哨兵怎么防选票一直瓜分？" → sentinelTimer 末尾 `server.hz = 10 + rand()%10` 随机化自身调度频率，错开各哨兵发起投票的时机，降低一轮无人过半的概率（Raft 随机超时思想的工程化）。
  - "每纪元一票怎么实现？" → is-master-down-by-addr 命令携带 sentinel.current_epoch 与请求方 runid，sentinelVoteLeader 按纪元比较，一个纪元只投一票。

### E13. 目标题目：be-redis-cluster（数据迁移的同步阻塞与数据结构）
- 来源：27/28 讲
- 追问素材：
  - "MIGRATE 为什么会阻塞源节点？" → migrateCommand 用 **syncWrite/syncReadLine 同步收发**（64KB 分块、逐 key 等回复），期间源节点主线程卡住——迁移要控批量 key 数与单个 key 大小（与工程课 S11"Cluster 迁移同步"呼应，补 syncWrite 细节）。
  - "迁移状态记在哪？" → clusterState{migrating_slots_to[16384], importing_slots_from[16384], slots[16384], slots_to_keys(rax)}；MIGRATE 发 RESTORE-ASKING，value 用 DUMP 序列化（内嵌 RDB 版本号+CRC64，目的端 verifyDumpPayload 校验后才 dbAdd）。

### E14. 目标题目：be-redis-datatypes（数据结构选型的"内存账"通用心法）
- 来源：02~07 讲共性
- 追问素材：
  - "Redis 数据结构省内存的通用三板斧？" → ①连续内存（embstr/ziplist/listpack/intset）+ 变长元数据按需取大小；②位域/packed/联合体把元数据压进位（redisObject、raxNode 头 4B、dictEntry 的 v 联合体）；③共享与复用（shared 对象池、lru 字段一鱼两吃、rax 前缀共享、master entry 共享 field 名）——被问任何结构时都能落到这三条。

## 三、主动丢弃

- 01 _ 源码整体架构（deps/src/tests/utils 目录走读、123 个文件四条代码路径）：代码导览无独立考察点，文件名索引已按需并入各条素材。
- 08 _ server 启动五阶段主体（三轮参数赋值、initServer 初始化 db 数组等）：框架性流程，口述价值低；仅"先加载 AOF 后 RDB"与 aeCreateEventLoop/acceptTcpHandler 并入 S9/E4。
- 09 _ select/poll/epoll 机制详解：通用网络编程知识（cs 网络/OS 域更合适），Redis 侧结论（为何不用 poll、四实现条件编译）已并入 S9。
- 12 _ 守护进程创建（daemonize/fork 双分支、setsid、/dev/null 重定向）：OS 通用知识，非 Redis 考点。
- 22 _ 哨兵初始化、25 _ Pub/Sub 主从切换：源码走读 + 与工程课 E6（哨兵发现/__sentinel__:hello/+switch-master）重复。
- 23/24 _ 哨兵 Raft 选举主体：工程课 E6 已覆盖"筛选+打分、先到先得、quorum"结论，仅纪元一票/hz 随机化等增量并入 E12。
- 26 _ Gossip 协议主体：工程课 E6 已覆盖（单条约 12KB、5 选 1、cluster-node-timeout 调大），消息结构体走读丢弃。
- 29 _ 循环缓冲区主体（读写循环与三状态变量推导）：过于细节，offset 换算一条并入 E11。
- 30 _ 延迟监控框架与慢日志实现（latencyTimeSeries 160 槽、SLOWLOG_ENTRY_MAX_ARGC=32）：观测工具属性强、数字易忘，工程课 S2 的排查框架已覆盖上位结论。
- 31 _ Module 动态扩展、32 _ 单元测试（Tcl 测试集）：面向 Redis 二次开发者，面试口述价值低。
- 00/加餐1/加餐2/加餐3/用户故事/结束语/期中测试：学习方法、读码经验、压测工具清单与测验题，无硬考点。
- 期中/每课一问中纯 C 语言题（bio_job 传参、预定义宏、LRU_CLOCK 分支理由等）：并入对应条目或丢弃，不单独成题。
