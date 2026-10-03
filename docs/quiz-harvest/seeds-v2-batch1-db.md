# 二期 · 批 1 · 数据库深挖（来源：浙大数据库系统原理作业 hw9~hw14 + 清华数据库专题训练近似查询作业）

> 二期方案见 `docs/quiz-expansion-plan-v2.md`。语料：`structured/08-数据库与软件工程/数据库`（A 层 403 份，
> 一期批 6 仅用 ~30 条）。本批收割浙大 hw9 索引 / hw10 查询处理 / hw11 查询优化 / hw12 事务 / hw13 并发 / hw14 恢复
> 六份作业 + 清华《数据库专题训练》近似查询作业。

## 新题 1（cs-fundamentals.ts，cs-db 领域）

- **cs-db-approximate-matching**：数据库怎么实现模糊/近似查询（Jaccard/编辑距离怎么建索引）
  ——q-gram 签名倒排 + 计数过滤定理 + 度量选择 + pg_trgm/ES fuzzy/ngram/向量对照；追问 PPJoin 一族过滤。
  （种子：清华数据库专题训练 hw1 SimSearcher；打 `真题改编` 标记）

## 追问增强 4 条（backend.ts）

1. **be-mysql-btree** ← hw9 14.3/14.4：页分裂（均分 vs 顺序插入偏右分裂）、删除借/合并与级联、
   内部节点 ≥2 指针而叶子 1 key 合法的原题口径、InnoDB 不做激进合并（删除后表不变小的真相）。
2. **be-mysql-index-failure** ← hw11 15.6：否定谓词与索引——等值否定无区间可定位、范围否定先德摩根改写
   （真题 ¬(A∨B)=¬A∧¬B）、`!=` 改写 `IN` 的应用推论。
3. **be-mysql-query-execution** ← hw11 16.20：优化器基数估计——均匀分布默认公式、直方图分桶估算
   （真题原题）、MySQL 8.0 直方图语法、误差沿计划树复合放大与 EXPLAIN ANALYZE 排查。
4. **be-mysql-serializability** ← hw12 17.7 / hw13 18.18：可恢复 → cascadeless → strict 三级调度阶梯、
   级联回滚动机、"实现成本决定 strict 成为工业默认"的收束。

## 丢弃（与现有题重复或边缘）

- hw13 18.1 lock point 证明、18.2 T34/T35 加锁死锁、18.7 increment 锁、18.18 strict 三理由、
  hw12 17.6 前趋图判断、17.12 ACID、hw14 19.1 undo 反向/19.2 checkpoint/19.25 RecLSN —— **批 6 已覆盖**
  （be-mysql-serializability / be-mysql-crash-recovery 正文即按这些原题写的）。
- hw10 15.2/15.3 join 代价定量（块传输/seek 公式手算）—— 笔试计算，be-mysql-query-execution 已给口述版框架。
- hw10 15.19/15.20 混合 merge-join 变体 —— 过于小众。
- hw14 19.10 交互式事务恢复 —— 非面试核心。
- hw9 14.11/24.10 LSM 合并策略微调 —— cs-db-lsm 已覆盖 tiered/leveled 权衡，留给批 4 存量优化复查。
