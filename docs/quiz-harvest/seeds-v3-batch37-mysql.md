# 批 37 种子 · MySQL 实战 45 讲（来源课程笔记 49 篇）

## 一、候选新题（现有题库未覆盖）

### S1. 普通索引和唯一索引怎么选？change buffer 是怎么加速写入的？
- 来源：09 _ 普通索引和唯一索引，应该怎么选择？
- 核心素材：
  - change buffer 机制：更新时若目标数据页**不在内存**，InnoDB 不读盘，把"对这个页的修改"缓存进 change buffer（可持久化，内存+磁盘都有），等该页被读到内存或后台线程定期 merge、正常关闭时才真正应用。省掉的是**随机读盘**（数据库里成本最高的操作之一）。
  - **唯一索引用不上 change buffer**：插入前必须判断唯一性冲突，这要求把数据页读进内存——页都读进来了，直接改内存更快，缓存失去意义。所以只有普通索引能享受这个优化。
  - 适用场景判断：**写多读少**（账单、日志类，页写完很久才被访问）收益最大；写完马上要查的业务反而有副作用——立即触发 merge，随机 IO 一次没省，还多了 change buffer 维护代价。大小由 `innodb_change_buffer_max_size` 控制（占 buffer pool 的百分比上限，设 50 即最多占 50%）。
  - 可靠性：change buffer 的操作也记入 redo log，掉电不丢；merge 流程 = 从盘读旧页 → 依次应用 change buffer 记录 → 写 redo log，之后页作为脏页走正常刷盘。
  - 经典对比收束：**redo log 把随机写转顺序写，change buffer 把随机读推迟/摊薄**——两者是 WAL 体系里互补的两个优化。
  - 真实事故：某业务把普通索引改成唯一索引后，buffer pool 命中率从 99% 跌到 75%，大量插入阻塞——每条插入被迫读盘判重。
- 建议追问：① 为什么唯一索引判冲突必须读页？（B+ 树定位靠页，冲突判断无法只靠索引项）→ ② 什么业务模型下反而该关 change buffer？（写入后立查）→ ③ 归档库场景怎么选？（业务已保证不重复时，历史/归档库把唯一索引改普通索引 + 开大 change buffer 提升导入速度；业务靠数据库兜底约束则必须唯一索引）
- 建议难度：intermediate

### S2. MySQL 为什么会时不时"抖"一下？——刷脏页的触发与限速机制
- 来源：12 _ 为什么我的MySQL会"抖"一下？（含 13 篇上期问题）
- 核心素材：
  - WAL 的代价：更新只写内存+redo log 就返回，内存页与磁盘页不一致即为**脏页**；"抖"的瞬间往往在 flush 脏页。
  - 触发 flush 的四种场景：① **redo log 写满**（write pos 追上 checkpoint）——最糟，所有更新停止、TPS 跌 0，全力推进 checkpoint；② **buffer pool 不够**，淘汰页时撞上脏页要先刷盘（常态，但一次查询淘汰太多脏页会明显变慢）；③ 系统空闲；④ 正常关闭。
  - 刷盘限速：`innodb_io_capacity` 告诉 InnoDB 磁盘能力（应设为实测 IOPS，用 fio 测；SSD 误设 300 会导致刷脏慢于产脏、脏页堆积）；速度 = capacity × max(F1(脏页比例，上限 `innodb_max_dirty_pages_pct` 默认 75%), F2(redo 落后量))，两个因素取大。
  - **flush neighbors 连坐**：刷一个脏页时若相邻页也脏就一起刷，且可蔓延——机械盘时代减少随机 IO 的好设计；SSD（IOPS 富余）应设 `innodb_flush_neighbors=0` 只刷自己，8.0 默认已是 0。
  - 反直觉推论：redo log 配太小（如 100M）→ checkpoint 频繁推进 → 不停刷脏 + 连带触发 change buffer merge → "磁盘压力不大但间歇性性能下跌"；经验值是 4 个 1GB。
  - 监控口径：脏页比例 = `Innodb_buffer_pool_pages_dirty / pages_total`，别长期逼近 75%。
- 建议追问：① 为什么淘汰脏页必须先刷盘，不能丢弃等 redo 重放？（保证"页要么全在内存、要么全在盘"两态，读路径无需重放 redo）→ ② redo log 满和脏页比例高哪个更危险？→ ③ 换 SSD 后哪两个参数要重估？（io_capacity 调大、flush_neighbors 设 0）
- 建议难度：intermediate

### S3. 线上给表加字段怎么做才安全？——MDL 锁事故与 Online DDL 原理
- 来源：06 _ 全局锁和表锁；13 _ 为什么表数据删掉一半，表文件大小不变？；19 _ 为什么我只查一行的语句，也执行这么慢？
- 核心素材：
  - MDL（metadata lock）：增删改查自动加 MDL 读锁，DDL 加 MDL 写锁；**读锁间不互斥、读写/写写互斥**；事务中的 MDL 到**事务提交才释放**（不是语句结束）。
  - 经典事故链条：长事务持 MDL 读锁 → DDL 等写锁被堵 → **后续所有新的读请求排在写锁后面全被堵** → 客户端重试雪上加霜，线程爆满、整库挂掉。小表也会出事。
  - 安全姿势：DDL 前查 `information_schema.innodb_trx` 杀长事务；热点表用 `ALTER TABLE ... NOWAIT / WAIT n`（MariaDB/AliSQL 语法）拿不到锁就放弃再重试；5.7+ 可用 `sys.schema_table_lock_waits` 直接定位阻塞源。
  - Online DDL（5.6+）重建表流程：建临时文件扫原表数据页生成 B+ 栆 → 期间的增删改记入 **row log** → 临时文件生成后重放 row log → 原子替换数据文件。启动时要 MDL 写锁但**拷数据前退化为读锁**（不阻塞 DML，同时禁止并发 DDL）——"Online" 指锁窗口短，不是全程无锁。
  - 概念辨析：**inplace ≠ online**——Online 的 DDL 一定 inplace；inplace 未必 online（加全文索引/空间索引 inplace 但阻塞 DML）。`alter table t engine=InnoDB` 隐含 ALGORITHM=inplace；analyze table 只重新统计（MDL 读锁）；optimize table = recreate + analyze。
  - 大表演进路线：原生 Online DDL 仍耗 IO/CPU（tmp_file 要占临时空间，1TB 表配 1.2TB 盘做不了 inplace）→ 生产首选 **gh-ost / pt-osc**；紧急补索引可用"备库 set sql_log_bin=off 做 DDL + 主备切换 + 另一台补做"的古老方案。
- 建议追问：① 为什么 MDL 写锁要退化成读锁而不是直接释放？（防并发 DDL 互踩）→ ② 重建表后空间反而变大的可能原因？（页留 1/16 给后续更新 + DDL 期间新写入产生空洞）→ ③ gh-ost 相比原生 Online DDL 解决了什么？（可限流可暂停可观察、主从延迟保护、可失败回退）
- 建议难度：intermediate

### S4. order by rand() 为什么慢？——内部临时表与排序算法的选择
- 来源：16 _ "order by"是怎么工作的？；17 _ 如何正确地显示随机消息？；37 _ 什么时候会使用内部临时表？
- 核心素材：
  - `order by rand() limit 3` explain 显示 **Using temporary + Using filesort**：建内存临时表（memory 引擎，无索引）→ 全表扫 word 并生成随机数写入（1 万行）→ 对临时表排序再全扫一遍（+1 万）→ 取 3 行（+3），Rows_examined = 20003。
  - 临时表排序选 **rowid 模式**（sort_buffer 只放随机值+位置信息）：因为 memory 引擎回表只是数组下标访问，不涉及磁盘，优化器优先选"排序行更小"；InnoDB 表则优先全字段排序（避免回表读盘）。这是"内存够就多利用内存"设计思想的镜像。
  - 数据量超 `tmp_table_size`（默认 16M）时内存临时表**转磁盘临时表**（引擎由 `internal_tmp_disk_storage_engine` 决定，默认 InnoDB），代价陡增。
  - **优先队列排序**：limit N 很小时（堆装得下 sort_buffer），不用归并排序把 1 万行全排完，而是维护 N 元堆只留最小/前 N——number_of_tmp_files=0；limit 1000 超过 sort_buffer 就退化回归并外部排序。
  - 替代方案：随机算法 1（min/max 主键间取随机点——id 有空洞时概率不均甚至接近 bug）、算法 2/3（count 后 `limit Y,1`，严格均匀但扫描 C+Y+1 行）；优化取 Y1..Y3 的 max/min 一条 `limit N, M-N+1` 扫 C+M+1 行。设计哲学：让数据库只做读写，业务逻辑放业务代码。
  - 延伸到 group by/union：union 去重靠临时表主键唯一约束，union all 免临时表；group by 无索引可用时也走临时表+排序，`order by null` 免排序、`SQL_BIG_RESULT` 提示直接走 sort_buffer 排序；有 generated column + 索引则完全免临时表。
- 建议追问：① 为什么 InnoDB 表和 memory 表的排序模式选择相反？（回表代价差异）→ ② 怎么验证一个语句用了几个临时文件？（optimizer_trace 的 number_of_tmp_files）→ ③ 生产上随机抽样还有什么工程替代？（预生成随机列/业务层抽样）
- 建议难度：advanced

### S5. 一条 insert 语句会牵扯哪些锁？——insert…select、唯一键冲突与 on duplicate key
- 来源：40 _ insert语句的锁为什么这么多？（配合 15 篇、20 篇）
- 核心素材：
  - 普通 insert 很轻（自增 id 申请后立即释放自增锁），但三类场景例外。
  - **insert … select**：RR + binlog=statement 下，要对**源表**扫描到的记录和间隙加共享 next-key lock——否则并发 insert 先执行后写 binlog，备库重放顺序颠倒会把多出来的行也复制进目标表，主从不一致。同表 insert…select 会**全表扫描 + 循环写入风险**（靠用户临时表中转优化）。
  - **唯一键冲突**：insert 撞唯一键不只是报错，还会在冲突值上加**共享 next-key lock（S 锁）**（主键/唯一索引都如此，官方文档曾有描述错误）。经典死锁：事务 A insert 持记录锁未提交，B、C 冲突各拿 S 锁等 A；A 回滚释放写锁后，B、C 都要升级写锁、互等对方 S 锁 → 死锁。教训：唯一键冲突报错后**尽快提交或回滚**，别让锁挂着。
  - **insert ... on duplicate key update**：冲突时对冲突索引加**排他 next-key lock**；多列同时冲突按索引顺序改第一处；affected rows 返回 2 有误导（insert+update 各计 1，实际只改一行）。
  - 锁的执行真相：next-key lock 是**先加间隙锁、再加记录锁**两段执行——分析用 next-key 抽象，现场分析要看两段。
- 建议追问：① 为什么唯一冲突要加 S 锁而不是直接返回？（防冲突行被并发删除，保证语义可继续）→ ② "检查不存在就插入，存在就更新"为什么 for update 也会死锁？（不存在的行锁不住 → 间隙锁可共存 → 双 insert 互等，引出 insert intention）→ ③ 这类防重业务更稳的姿势？（insert on duplicate / 唯一索引兜底 + 冲突重试）
- 建议难度：advanced

### S6. 自增主键为什么不连续？自增值存在哪、用完了会怎样？
- 来源：39 _ 自增主键为什么不是连续的？；45 _ 自增id用完怎么办？
- 核心素材：
  - 自增值不在表结构文件里：MyISAM 存数据文件；**InnoDB 5.7 及以前只存内存**，重启后取 max(id)+1（重启可能改变 AUTO_INCREMENT 值）；**8.0 起把自增值变更写入 redo log**，重启可恢复。
  - 修改时机：**真正执行插入之前**就把自增值 +1，且不回退——唯一键冲突、事务回滚都会留下空洞（前两种不连续原因）。
  - 为什么不回退：回退需在申请时判重（每次申请多一次主键树查找）或把自增锁扩大到事务结束（并发骤降）——InnoDB 选择"只保证递增、不保证连续"换性能。
  - 自增锁三档 `innodb_autoinc_lock_mode`：0 语句级（5.0 老）、1 默认（普通 insert 申请即放，insert…select 等批量语句到语句结束）、2 全部申请即放。批量插入用**1→2→4 翻倍申领**，用不完浪费（第三种不连续原因）。生产推荐 **mode=2 + binlog_format=row**：并发放开且 row 格式记录实际值，statement 格式下备库重放无法复现不连续的 id。
  - 用完行为对比：表自增 id 到 2^32-1 上限后**保持不变** → 再插入报主键冲突（插入失败，可用性问题）；无主键表的隐藏 **row_id 只写 6 字节**，到 2^48 归 0 循环、**后写覆盖先写**（数据丢失，可靠性问题）——所以应主动建自增主键，可靠性优先于可用性。
- 建议追问：① 双 M 双写怎么避免主键冲突？（auto_increment_offset/increment 奇偶错开）→ ② 为什么批量插入不能精确申领 id？（insert…select 事先不知道会插多少行）→ ③ 依赖自增 id 连续性的业务设计错在哪？（回滚/冲突即出洞，判断"新增条数"不能靠 max(id) 差值）
- 建议难度：intermediate

### S7. 误删数据了怎么救？——从 Flashback 到延迟复制备库
- 来源：31 _ 误删数据后除了跑路，还能怎么办？（用 24 篇 row 格式原理）
- 核心素材：
  - 四类误删分级处理：误删行 → **Flashback**；误删表/库 → 全量备份 + binlog PITR；rm 单节点 → HA 切换后重建；全集群覆灭 → 只能靠跨机房/跨城备份。
  - Flashback 原理：解析 binlog 把 event 反转（insert↔delete 的 Write_rows/Delete_rows 对调、update 前后镜像对调），**多事务要倒序重放**；前提 `binlog_format=row` + `binlog_row_image=FULL`。truncate/drop 记的还是 statement，Flashback 救不了。不要直接在主库回放，先在临时库确认再导回（晚发现时业务已在错误数据上继续演化，直接补数据可能二次破坏）。
  - PITR 加速：mysqlbinlog 单线程应用且不能按表过滤 → 恢复出临时实例后 **change replication filter replicate_do_table 挂到备库当从库**，复用并行复制 + 只同步误操作表；GTID 模式下用"空事务占位 gtid_next"优雅跳过误操作语句。
  - **延迟复制备库**（5.6+，`CHANGE MASTER TO MASTER_DELAY=N`）：核心库挂一个延迟 1 小时的备库，1 小时内发现误删，stop slave 后跳过那条语句即可恢复，把"按天级恢复"压到分钟级。
  - 事前预防比事后抢救重要：`sql_safe_updates=on`（无 where/无索引列 where 的 update/delete 直接报错）、账号分离（业务账号无 drop/truncate）、删表先改名加 `_to_be_deleted` 后缀观察期、备份有效性定期演练、变更脚本"备份/执行/验证/回滚"四件套。
- 建议追问：① 为什么 row 格式才能 Flashback？（statement 只记语句无法反演，且 delete 的行数据都在 row event 里）→ ② 一天一备 vs 一周一备影响什么指标？（最长恢复时间 = RTO，备份周期越短 RTO 越短但存储成本越高）→ ③ 半个月"可恢复到任意秒"承诺背后是什么？（全量备份 + 至少半月 binlog 归档）
- 建议难度：intermediate

### S8. 200G 的表全表扫描，100G 内存会爆吗？——InnoDB 对 LRU 的改造
- 来源：33 _ 我查这么多数据，会不会把数据库内存打爆？；35 _ join语句怎么优化？（BNL 部分）
- 核心素材：
  - Server 层**边读边发**：结果逐行写 `net_buffer`（默认 16k）写满即发，socket send buffer 写满就暂停等客户端——服务端不保存完整结果集，内存占用与结果集大小无关。副作用：客户端收得慢，语句一直处于执行态（占内存连接、若是事务还持锁/堵 undo 回收）。
  - 状态名辨析：**"Sending to client"** = 服务端网络栈写满、在等客户端收数据；**"Sending data"** = 只表示"正在执行器阶段"，可能是在等锁，极易误读。
  - Buffer Pool 用 LRU 管理页，但朴素 LRU 会被一次冷数据全表扫描把热点全部冲掉（命中率骤降、磁盘压力大）。InnoDB 改造：按 **5:3 分 young/old 区**，新读入页先插 old 区头部；old 区页要**停留超过 `innodb_old_blocks_time`（默认 1000ms）再次被访问**才晋升 young——顺序扫描中一个页的多次访问间隔必然小于 1 秒，永远留在 old 区很快被淘汰，热点零打扰。
  - 破坏者：执行超 1 秒的 BNL join 反复扫冷表，会把冷页顶进 young 区；join_buffer 分段扫描让冷数据持续污染命中率——BNL 三宗罪（被驱动表多次扫 IO、M×N 次内存比较 CPU、LRU 污染是**持续性**伤害，语句结束后命中率要慢慢养回来）。
  - 稳定服务 buffer pool 命中率应在 **99% 以上**（show engine innodb status），`innodb_buffer_pool_size` 建议物理内存 60%~80%。
- 建议追问：① 为什么 1 秒阈值能区分顺序扫描和正常访问？（扫描页间隔必小于 1s；热点页会反复跨秒访问）→ ② 线上大量 Sending to client 说明什么？（返回结果集过大/客户端处理慢，该优化查询了）→ ③ 为什么说 BNL 对命中率的影响比 IO 影响更持久？
- 建议难度：advanced

### S9. 都说 InnoDB 好，Memory 引擎为什么不能上生产？
- 来源：38 _ 都说InnoDB好，那还要不要使用Memory引擎？
- 核心素材：
  - 数据组织分歧：InnoDB 是**索引组织表**（数据在主键 B+ 树叶子，二级索引存主键）；Memory 是**堆组织表**（数据按写入顺序存数组，索引存位置）——所有索引地位平等、无回表概念；varchar 按 char(N) 定长存、不支持 Blob/Text；主键默认 hash 索引（范围查询用不上，要 B-Tree 需显式建）。
  - 两个致命伤：① **只支持表锁**，一个更新堵住全表读写，并发能力反而不如 InnoDB 行锁；② **重启数据全丢**，且高可用下是放大器——备库重启清空后同步线程报"找不到更新的行"直接断开；更诡异的是主库重启时 MySQL 主动往 binlog 写一行 `DELETE FROM t1` 防不一致，**双 M 结构下这行 delete 会传回主库把主库数据也清了**。
  - 结论：普通业务表一律 InnoDB（数据量不大的读热点本来也全在 buffer pool 里，读性能不差）；Memory 唯一合理场景是**用户临时表**——无并发访问、重启丢失无所谓、备库临时表不影响主库，且 hash 索引 + 不落盘对 join 中转/小结果集聚合有明显速度优势（对应 37 篇内部内存临时表）。
- 建议追问：① 为什么内存表 delete 后新插入能立刻复用空洞？（数据数组 + 索引存位置，无需保持有序）→ ② 内存表"快"的直觉错在哪？（更新并发瓶颈 + 数据本来就能全缓存进 buffer pool）→ ③ 发现生产已有内存表怎么止血？（备库 set sql_log_bin=off 批量 alter engine=innodb + 建表审核规则拦截）
- 建议难度：intermediate

## 二、既有题增强素材（13 题的追问可加内容）

### E1. 既有题目：be-mysql-btree（InnoDB 为什么选 B+ 树）
- 来源：04/05/13/14 篇及各篇答疑
- 追问素材：
  - 重建索引的正确姿势：`drop index + add index` 重建普通索引合理（去空洞提页利用率）；但**重建主键不能 drop+add 连做**——两步各重建整表，第一步白做，用 `alter table t engine=InnoDB` 一步完成。
  - 重建后并非"最紧凑"：InnoDB 重建时**每页留 1/16 空间**给后续更新；若重建后插入又用掉预留空间，再重建一次空间可能不降反升（解释"收缩反而变大 1.01TB"）。
  - 自增主键的例外：表只有一个唯一索引（KV 场景）时，应直接把它设为主键——省掉二级索引叶子冗余，也免了"主键查一次 + 二级查一次"的两棵树。
  - 主键/表行的估算内幕：优化器对主键扫描行数直接用 `show table status` 的 TABLE_ROWS（采样估算，官方承认误差 40%~50%），别拿它当精确值。

### E2. 既有题目：be-mysql-index-type（聚簇/二级索引、回表与覆盖索引）
- 来源：05/11 篇
- 追问素材：
  - **索引下推 ICP（5.6+）**：`where name like '张%' and age=10` 走 (name,age) 索引时，age 的过滤在**引擎内的索引层**完成，不合格记录直接跳过不回表（4 次回表降为 2 次）；判断标志是 explain Extra 无 ICP 字样但回表次数骤减。
  - **前缀索引**：`index(email(6))` 省空间但增加扫描次数（前缀撞车多回表几次）；长度选取用 `count(distinct left(email,n))` 对比总区分度，可接受损失比例（如 5%）内取最短。**前缀索引注定用不上覆盖索引**——系统不知道前缀是否截断了原值，必须回表。
  - 前缀区分度差的替代方案：**倒序存储 + 前缀索引**（身份证后 6 位区分度高，省空间、免加字段，每次读写多一次 reverse；仍不满足覆盖）vs **hash 字段**（crc32 单独列 + 索引，查询性能稳定接近 1 行，但要加字段且 where 需带回原列精确比对）；两者共同点：都只支持等值、放弃范围查询。
  - 联合索引去留实例：(a,b) 联合主键 + 索引 c 的表，`where c=N order by a` 和 `order by b` 两种语句——索引 ca 的数据与 c 完全相同（后缀只差主键 b），**ca 可删，cb 必须留**：判断依据是"去掉 c 后剩的主键列是否恰好补齐排序需求"。

### E3. 既有题目：be-mysql-index-failure（索引失效与慢查询排查）
- 来源：18/19/22 篇
- 追问素材：
  - 隐式**字符集**转换：utf8 表 join utf8mb4 表，转换方向是"向超集转"——被驱动表列被套上 `CONVERT(col USING utf8mb4)`，函数加在索引列上，树搜索废掉、全表扫描；修复优先改表字符集，改不动就在 SQL 里**主动把驱动表一侧转成被驱动表字符集**，把函数挪到输入参数上。
  - 优化器的"偷懒"：即使函数不破坏有序性（`where id+1=10000`），优化器也不做语句重写，仍放弃树搜索——规则统一为"索引列上出现函数/运算就走全索引扫描"，别指望引擎帮你改写。
  - 隐蔽案例：`where b='1234567890abcd'`（b 为 varchar(10)，10 万行同值）——引擎按定义截断成前 10 字节匹配索引命中 10 万行，回表后 server 层逐行判断全部不符，返回空集但代价是 10 万次回表；说明**截断匹配发生在引擎层、最终判断在 server 层**。
  - 查一行也慢的锁等待排查路径：show processlist 看状态 → 等 MDL 锁（sys.schema_table_lock_waits 直接给阻塞 pid）→ 等 flush（某长查询未结束，flush tables 堵在后面）→ 等行锁（`sys.innodb_lock_waits` 找到持锁线程后要 **KILL 连接而非 KILL QUERY**——持锁的是已执行完的语句，kill query 无效，断连才回滚释放）。
  - 上线前防线：测试环境 `long_query_time=0` 全量记录慢日志跑回归，逐条核对 Rows_examined 是否符合预期；分析工具 pt-query-digest；紧急治标用 query_rewrite 把坏语句在线改写。

### E4. 既有题目：be-mysql-transaction-isolation（ACID 与隔离级别）
- 来源：03/08 篇
- 追问素材：
  - RR 的正当场景不止"默认"两个字：**数据校对/对账**（月中对账时新交易不影响"余额差=明细和"的核对）、从 Oracle 迁移的系统要显式把隔离级别改回 RC 保持行为一致（`transaction_isolation=READ-COMMITTED`）。
  - 事务启动时机陷阱：`begin/start transaction` **不立即启动事务**，第一个操作 InnoDB 表的语句才真正启动并建一致性视图；要立刻固定视图用 `start transaction with consistent snapshot`（RC 下此语句无意义）。
  - 意外长事务的第一来源：框架/连接器默认 `set autocommit=0`，一个 select 也开着事务；排查用 general_log，治理建议 `set autocommit=1` + 显式 begin，频繁事务用 `commit work and chain` 省去 begin 且语义清晰。
  - 五年以下版本遗留风险：5.5 及以前回滚段与数据字典同放 ibdata，长事务即便提交清理后文件也不缩（见过 20G 数据配 200G 回滚段），只能重建整库——undo 独立表空间就是为这个准备的。

### E5. 既有题目：be-mysql-mvcc（Read View 与版本链）
- 来源：08/15/16/44/45 篇
- 追问素材：
  - 可见性三句话速记版：**版本未提交不可见；已提交但视图创建后才提交不可见；视图创建前已提交可见；自己的更新总可见**——人工分析比高低水位数字快。
  - "更新都是先读后写，且只能当前读"：B 在 C 提交后 update，是在 C 的新值 (1,2) 基础上 +1 得 3——MVCC 快照只管读，**更新永远作用在最新版本**，否则会覆盖丢失别人的更新。
  - 反直觉：`update set a=2 where a=2`（值没变）**真的会执行更新、加锁、写新版本**（statement 格式下 binlog 行为与锁验证可证），InnoDB 不做新旧值短路优化——直到 binlog_row_image=FULL 时因需读全字段才会顺手判断；写 SQL 去重别依赖引擎帮你跳过。
  - 只读事务**不分配 trx_id**：innodb_trx 里看到的大数 = 事务变量指针地址 + 2^48（同事务内保持一致、并行只读事务互不相同）；好处是视图活跃数组更小、普通 select 免申请 trx_id 减少锁冲突——这是"高并发只读下 MVCC 依然轻盈"的实现细节。
  - 100 万次 update 未提交后，`select * from t where id=1` 要沿 undo 链回放 100 万个版本耗时 800ms，而 `lock in share mode` 当前读 0.2ms——**一致性读的成本与版本链长度成正比**，是长事务危害最直观的演示。

### E6. 既有题目：be-mysql-lock（锁类型与死锁）
- 来源：07/19/20/21/30 篇
- 追问素材：
  - 两阶段锁协议的工程化应用：行锁**需要时才加、commit 才统一放**——事务里锁多行时，把**最可能冲突的更新放最后**（买票案例：扣个人余额→记账→最后更新影院余额），把影院行的锁持有时间压到最短。
  - 死锁检测的代价：每个被堵线程判断自己是否成环是 O(n)，1000 并发更新同一行 = 百万级检测，现象是 **CPU 100% 但 TPS 极低**；解法谱系：确保无死锁可临时关 `innodb_deadlock_detect`（风险：锁等待大量超时）、中间件对同行列队进入引擎、业务上把热点行**拆成多行分摊**（10 行随机加，冲突概率降为 1/10）。
  - 动态视角：**间隙由"右边那条记录"定义**——delete 掉 c=10 后，原 (5,10)、(10,15) 两间隙合并为 (5,15)，先前事务的加锁范围"凭空变大"；update 索引列 = 插入新值+删除旧值两步，会触发邻接间隙锁冲突。
  - delete 加 `limit` 不仅能控量，还能**缩小加锁范围**（遍历提前结束，后面的间隙不再加锁）——删数据尽量带 limit。
  - RC 下的锁优化：语句执行完就释放"不满足条件的行"上的行锁，不必等 commit（外键场景仍有间隙锁是例外）；RR 遵守 strict 2PL 全部到 commit 释放。
  - count(*) 增强衔接：InnoDB 无法存全局行数（不同 Read View 数出的行数不同）→ 把计数放 Redis 永远存在"先改表还是先改计数"的时序窗口（两个系统没有一致性视图）；**放 MySQL 计数表用同一事务包裹**，利用隔离性让"计数+1"与"插入记录"对外原子可见——用事务特性反杀 count 的痛点。

### E7. 既有题目：be-mysql-logs（redo/undo/binlog 与两阶段提交）
- 来源：02/15/23/24 篇
- 追问素材：
  - 崩溃恢复判定规则：redo 有 commit 标识直接提交；只有 prepare 则**拿共同字段 XID 去 binlog 找**，binlog 完整（statement 看 COMMIT、row 看 XID event，5.6.2+ 有 binlog-checksum）就提交、否则回滚——"binlog 写完就要对备库可见"是判定依据。
  - 为什么 binlog 干不了崩溃恢复：binlog 是逻辑日志**没有恢复数据页的能力**——WAL 下崩溃可能丢"数据页级"的更新，statement/row 都补不回来；要补就得记录页级物理变更，那就是再造一个 redo log。
  - 内存结构的不对称设计：**binlog cache 线程私有**（一个事务的 binlog 必须连续写不能拆）、**redo log buffer 全局共享**（redo 允许断续，还能搭其他事务提交的"便车"一起刷盘）。
  - 未提交事务的 redo 也可能落盘，三种途径：后台线程每秒轮询、buffer 占用超 `innodb_log_buffer_size` 一半时 write 到 page cache、并行事务提交时顺带持久化——都不影响正确性（崩溃时事务未提交，binlog 也没发出去）。
  - binlog 三格式的深层理由：statement 下 `delete ... limit 1` 是 unsafe（主备走不同索引删不同行）；mixed 判断可能不一致就转 row；恢复数据角度 row 完胜——delete 的 row event 含整行可反插、update 含前后镜像可对调（Flashback 与 MariaDB Flashback 工具的基础）；`now()` 这类函数靠 event 里的 `SET TIMESTAMP=` 保证重放一致，所以"手抄 binlog 里的语句执行"有风险，标准做法是 mysqlbinlog 整段管道回放。
  - "双 1"的现实口径：正常双 1（`innodb_flush_log_at_trx_commit=1` + `sync_binlog=1`，每事务两次刷盘靠组提交摊薄）；已知可主动改非双 1 的四场景——高峰预案、备库追延迟、备份恢复实例应用 binlog、批量导数（常见 `=2` + `sync_binlog=1000`）。

### E8. 既有题目：be-mysql-replication（主从复制与延迟）
- 来源：24/25/26/27/28 篇
- 追问素材：
  - 主备切换两策略：**可靠性优先**（等 SBM<5s → 主库 readonly → 等追平 → 备库可写 → 切流量，代价是中间不可写窗口）vs **可用性优先**（不等同步直接切，案例：自增主键两库各插一行、mixed 格式下主备静悄悄各多一行；row 格式下报 duplicate key 停在明处）——结论：row 格式让不一致**可见**，可靠性一般优先于可用性（例外：可降级的日志库）。
  - 循环复制防线：binlog 记录首执实例的 **server_id**，备库重放生成的 binlog 沿用原 server_id，收到与自己相同 server_id 的日志直接丢弃；不完备场景——运行中改 server_id、三节点迁移拓扑——用 `CHANGE MASTER TO IGNORE_SERVER_IDS=(...)` 临时止血。
  - GTID 的本质：`server_uuid:gno`（提交时分配、连续、不回退）；切换协议 `master_auto_position=1`——备库把自己的 GTID 集合发给主库，主库算差集、**发现缺 binlog 直接拒绝**（位点协议则备库指哪发哪、不校验完整性），彻底免掉"找位点 + sql_slave_skip_counter/跳 1032/1062"的复杂操作。
  - 并行复制演进谱系（追问"为什么备库追不上"的高阶答案）：coordinator+worker 模型两条铁律（更新同一行的事务进同一 worker、事务不可拆）→ 按表分发（热点表退化单线程）→ 按行分发（需 row 格式 + 主键 + 无外键，大事务退化为单线程）→ 5.6 按库 → 5.7 LOGICAL_CLOCK（**同时处于 prepare 即可并行**——prepare 已通过锁冲突检验；binlog_group_commit_sync_delay 顺带提高备库并行度）→ 5.7.22 WRITESET（主库算好行 hash 写进 binlog，备库免解析、statement 也支持）。
  - 过期读的命令级方案：等位点 `select master_pos_wait(file,pos,timeout)`（返回 ≥0 才读，超时/异常退化读主库）；等 GTID `select wait_for_executed_gtid_set(gtid,1)` + `session_track_gtids=OWN_GTID` 让更新返回包自带 GTID 免一次 show master status；判"备库已收到的都执行完"仍不充分——semi-sync 补上"客户端确认过的事务备库必已收到"，但一主多从只保一个 ack、持续延迟时会过度等待，故工程上常与"请求分类"混合使用。

### E9. 既有题目：be-mysql-sharding（分库分表）
- 来源：36/43 篇
- 追问素材：
  - **分区表 vs 业务分表**的分层真相：引擎层看分区是 N 个独立表（间隙锁/表锁按分区隔离，Range 查询只锁命中分区）；Server 层看是 1 个表——**所有分区共用一个 MDL 锁**（一个分区的 DDL 堵所有分区查询）、第一次访问要打开全部分区（MyISAM 通用分区策略下超 1000 分区直接超 open_files_limit 报错；5.7.9+ InnoDB 本地分区策略解决，8.0 只允许本地策略引擎）。
  - 使用红线：分区不是越细越好（千万行单分区在现代硬件就是小表；见过按天分区预建 10 年的案例）、用前再建（按月分区年底建下一年 12 个）、无数据的历史分区及时 drop；`alter table t drop partition` 直接删文件，比 delete 清历史快得多、影响小——这是分区表最正当的场景。
  - 主键限制：分区表主键必须包含分区键，如 `PRIMARY KEY(ftime,id)`；配合最左前缀还能省掉按 ftime 查询的二级索引。
  - 跨库查询的汇总层技巧（proxy 路由失效时）：无分区键的 `where k>=M order by t_modified desc limit 100`，在各分库查Top-N 后**插入汇总库的用户临时表**再统一排序——临时表 session 隔离可重名、结束自动回收，天然适合多 session 并发的中间结果；实践中常直接把临时表建在 32 个分库中的某一个上。

### E10. 既有题目：be-mysql-query-execution（SQL 执行流程与 join 算法）
- 来源：34/35/40 篇
- 追问素材：
  - **MRR**：回表逐行按索引序拿 id 是随机读；把主键 id 攒进 `read_rnd_buffer` 排序后再回表，逼近顺序读——收益前提是范围/多值查询能攒出足够多 id；需 `optimizer_switch="mrr=on,mrr_cost_based=off"` 才稳定启用（注意：若结果本就要按索引列排序，MRR 反而多一次排序，得不偿失）。
  - **BKA**：NLJ 的批量化——驱动表一批行进 join_buffer，配合 MRR 对被驱动表批量有序探测；依赖 MRR 开启（`batched_key_access=on`）。
  - "小表"的精确定义：按各自 where 过滤后，**计算参与 join 的字段总数据量**——100 行的 t1 只查 b 列可能比 50 行但 select * 的表更小；驱动表选择的成本模型 NLJ≈N+N·2·logM（N 权重远大于 M）。
  - BNL 的量化对比：join_buffer（默认 256k）装不下驱动表就分段，被驱动表被扫 K 遍（K=λ·N）；案例 1000×100 万无索引 join 要 10 亿次内存比较、1 分 11 秒——优化：给被驱动表建索引转 BKA；低频查询不值得建索引就用**临时表**（过滤出 2000 行 + 建索引再 join，3 条语句总耗时不到 1 秒）；8.0.18 hash join 从根上解决。
  - 扫描行数口径：`Rows_examined` 是执行器调引擎接口的累加，**引擎内部扫描行数 ≠ rows_examined**（覆盖索引读 3 条只算 2、limit 受临时表影响读 4 算 1……），对账时以慢日志为准并理解口径。

### E11. 既有题目：be-mysql-serializability（可串行化与 2PL）
- 来源：21/39/44 篇
- 追问素材：
  - RC 下的严格化特例：语句结束即释放不满足条件行的行锁（弱化 strict 2PL 换并发），但**外键场景 RC 仍保留间隙锁**——"RC 完全没有间隙锁"是常见错误表述。
  - statement 复制对加锁的隐性约束：RR 下 `insert … select` 对源表全表加共享 next-key lock，本质是给"语句级串行等价性"兜底——把并发调度的正确性理论与 binlog 串行重放串成一条线：**statement 格式成立的前提是主库并发调度可串行化且备库重放保序**。
  - insert 批量申领 id 的 1→2→4 翻倍策略，是"锁的粒度/持有时长换取批处理效率"的又一实例，可对照意向锁、组提交一起作为"并发度调节器"的设计例证。

### E12. 既有题目：be-mysql-crash-recovery（ARIES 与崩溃恢复）
- 来源：23 篇
- 追问素材：
  - redo log 三态与落盘时机：buffer（进程内存）→ write（文件系统 page cache）→ fsync（磁盘）；`innodb_flush_log_at_trx_commit` 0/1/2 分别停在第一/第三/第二态——设 2 与 0 性能几乎相同，但 MySQL 进程重启不丢（只有主机掉电才丢），**风险收益比显著优于 0**，不建议 0。
  - InnoDB 的 group commit 实现细节：并发事务在 prepare 阶段写满 redo buffer，先到者当选 **leader，携带当前最大 LSN 一次 fsync**，组内所有 LSN 更小的事务直接返回——组员越多摊薄越狠，单线程压测则无收益；MySQL 故意把 redo fsync 拖到 binlog write 之后，让 binlog 也能凑组（`binlog_group_commit_sync_delay` / `_no_delay_count` 或的关系控制延迟），但通常 binlog 组提交效果弱于 redo。
  - WAL 减写盘的完整答案 = 顺序写（redo/binlog 都追加）+ 组提交（fsync 摊薄），回应"每次提交都写两份日志，写盘次数没少"的质疑。

## 三、主动丢弃
- grant 与 flush privileges / 权限表两级存储（42）：偏权限管理操作细节，机制深度与考察频率均不足；仅"权限在连接建立时拷贝、改权限不影响存量连接"一句可并入 E7/执行流程类素材。
- kill 语句的实现（THD::KILL_QUERY 状态位 + 埋点 + 两类 kill 不掉的场景）与客户端 -A/--quick 误解（32）：运维冷知识，操作演示属性强。
- 实例健康检查五种方法演进（select 1 → 查表 → update 探活 → performance_schema 内部统计，29）：偏 DBA 监控体系，离后端面试主干较远。
- 三种导表方法对比（mysqldump / into outfile+load data / 可传输表空间，41）：纯操作演示；仅"row 格式可反演"原则已在 E7/S7 覆盖。
- count(字段)/count(1) 性能排序细节（14 后半）：已基本被 be-mysql-lock 的 count(*) 追问覆盖，残值低。
- 临时表重名的 table_def_key 实现与 binlog 线程 id 机制（36 后半）：实现细节过深，临时表的工程用法已并入 E9。
- 开篇词/直播回顾/结束语/结课测试：非技术内容。
- Xid/thread_id 等 ID 上限行为（45 剩余部分）：理论概率极低的边界，仅保留最有教学价值的"自增主键 vs row_id 覆盖"进入 S6。
