# 批 6 收割种子存档（后端增厚：C++ / MySQL / Java / SQL 语义）

> 来源：① C 与 C++ 试卷（清华程设 15-17 选择/填空含答案 + OOP 期中期末 + OOP QA List）16 份 40 条种子；
> ② 数据库课程（清华 cs18/cs19 DB Final 带答案 + 浙大作业 9-14 + 南大 A/B 卷 + 课件）30 条；
> ③ Java 试卷 6 份（浙大/清华/信科含答案）10 条。2026-09-30 收割。
> 状态：✅ 已落地（backend.ts +12 新题 +10 追问；cs-fundamentals.ts cs-db +1 新题 +2 追问）

## ✅ C++ 新题 4（backend.ts，be-systems 领域）

- be-cpp-stl-internals（basic）：STL 值语义副本 + 迭代器类别与 std::sort 兼容性 + map 有序性 + deque 分段（种子 1-4）；追问：++it vs it++（种子 16）
- be-cpp-copy-control（intermediate）：拷贝构造 vs 赋值时机（原题）+ 浅拷贝 double free/三法则 + 构造析构顺序 + 初始化列表 + RVO（种子 5-9）；追问：explicit（种子 13/14）、构造次数 4 次算例（种子 37）
- be-cpp-binding-slicing（intermediate）：动态绑定必要条件（原题选择题）+ 对象切割两路径（原题输出题）+ 名字隐藏与 using（原题）；追问：C++/Java 构造期多态对照（种子 22 关联）
- be-cpp-object-layout（advanced）：vtable/vptr 位置 + 空类 sizeof=1/带虚 =8 + 构造期 vptr + 自引用成员（种子 22/31）；追问：const 成员函数重载 + static 为什么不能 const（种子 21）
- 追问：be-cpp-raii ←（未加，new/malloc 区别要点已由 RAII 正文覆盖，种子 20 放弃）

## ✅ MySQL 新题 3（backend.ts，be-mysql 领域）

- be-mysql-query-execution（intermediate）：查询处理四步 + EXPLAIN 字段 + 连接算法三代（NLJ/INL/BNL→Hash Join）+ 选择率估计公式 + 索引嵌套循环代价真题 + 驱动表选择（种子 7/8/9/32）；追问：Hash Join vs 索引 NLJ 适用场景
- be-mysql-serializability（advanced）：冲突可串行化与前趋图（原题调度推演）+ 2PL 不防死锁（锁升级死锁原题）+ strict 2PL 三理由 + 意向锁多粒度 + 隔离级别的实现视角收束（种子 10/11/13/17/22/29/30）；追问：冲突 vs 视图可串行化（NP-complete）
- be-mysql-crash-recovery（advanced）：WAL 前提 + ARIES 三阶段（南大原题推演：RecLSN/CLR/DPT）+ checkpoint 权衡 + undo 反向 redo 正向（种子 12/20/21/33）；追问：group commit

## ✅ Java 新题 4（backend.ts，be-java 领域）

- be-java-equals-hashcode（intermediate）：契约 + equals(Value) 重载陷阱（HashSet size=2 原题）+ @Override 纪律；追问：Integer 缓存 == / 包装类 equals 跨类型 false / 三元数值提升 1.0（种子 35/36）
- be-java-string（basic）：不可变三动机 + 常量池 + intern 四连判（原题 false/false/true）+ 编译期折叠边界；追问：+= 循环与 StringBuilder + invokedynamic
- be-java-exception（basic）：checked/unchecked 边界（原题四选一）+ 设计哲学 + finally 规则（吞 return 原题）+ try-with-resources；追问：finally 覆盖返回值
- be-java-object-lifecycle（intermediate）：构造器调可覆盖方法 NPE（信科原题）+ clone 浅拷贝/transient（原题）；追问：兄弟类强转编译错（清华原题）
- 追问：be-java-generics ← List<?> 不可写（浙大原题）；be-java-synchronized-lock ← wait/notify 归属 Object + 双对象交叉加锁死锁（信科原题）

## ✅ SQL 语义（cs-fundamentals.ts，cs-db 领域）

- cs-db-sql-patterns（intermediate 新题）：关系除法双重 NOT EXISTS（"所有供应商"原题）+ 分组 count(distinct)=1（"只在一个校区"原题）+ having >= all 分组最值（原题）+ 窗口函数现代写法；追问：IN 子查询去嵌套改 self-join（原题）
- 追问：cs-db-normalization ← 候选键求法 {C,E}（原题）+ 正则覆盖 + BCNF 分解与依赖保持（种子 4/5/6）
- 追问：cs-db-join ← NULL 三值逻辑 + count(distinct) 忽略 NULL（种子 16）

## ❌ 丢弃与理由

- 内联 vs 宏、static 五层语义、const 头文件定义、protected 边界、纯虚函数体、struct/class、模板语法、函数对象、ODR —— 网课基础细节，口试价值中低
- 引用 vs 指针、new/delete vs malloc/free —— 常识级，RAII/智能指针题已覆盖语境
- B+ 树节点上下界/扇出估算、稀疏/稠密索引 I/O 计算、B+ 树 LRU 读块计数 —— 组成原理/MySQL 已覆盖 B+ 树主干，计算细节价值低
- 四大读现象单独成题 —— transaction-isolation 题已按隔离级别覆盖
- grant/revoke、LIKE 转义、ON DELETE CASCADE、视图/动态 SQL 判断题 —— 网课 trivia
- LSM stepped-merge 权衡、χ² 类 —— cs-db-lsm/数学批已覆盖主干
- 反规范化权衡 —— cs-db-normalization 主答案已讲，未重复
