# 批 2 收割种子存档（操作系统）

> 来源：① 清华 912 真题（批 1 收割）；② 操作系统课程试卷 18 份 + 作业 5 份（浙大/清华，2026-09-29 收割）。
> 状态：✅ 已落地（os.ts，34 → 43 题）｜❌ 丢弃

## ✅ 新题（9）

- os-sched-classic-algorithms：FCFS/SJF/HRRN/RR/MLFQ + 饥饿与老化（912 + 调度作业 1-7、38）
- os-sched-semaphore-impl：P/V 伪代码实现 + 管程等价 + 死循环陷阱（912 2018/2019/2020）
- os-sched-philosophers：哲学家就餐三修法 ↔ 破坏哪个死锁条件（2004-2005 卷）
- os-scene-readers-writers-variant：读写者变体组间互斥 + 第一/二类饥饿方向 + 换课持锁事故（912 2006/2005 + 郝家辉 A4）
- os-mem-segmentation：分段 vs 分页 + 段表翻译 + 段页式（hwChap8、2003-2004/2005-2006 卷）
- os-io-file-allocation：连续/链接/索引 + FAT/extent + 两级索引速算 64MB + 插入记录 59/31 次（2003-2004 卷、文件系统作业）
- os-io-open-file-table：FCB 无文件名 + open 本质 + 两级打开文件表 + 目录 x 权限（文件系统作业、final_review04、2000 卷）
- os-io-journaling-fsck：fsck 对账 vs 日志重放 + ext4 data 模式（郝家辉 A4、Quiz3）
- os-io-vfs：VFS 四大对象 + overlayfs 上下层（郝家辉 A4、final_review04）

## ✅ 追问增强（9 条进现有题，2 条进新题）

- os-sched-deadlock ← 银行家安全序列判定 + 最少资源数 N×(max−1)+1（2005-2006 卷）
- os-mem-page-fault ← Belady 异常反例串 + 栈式算法（912 三年两考）
- os-io-inode ← 软硬链接引用计数推演（912 三年两考：删 F1 后 F2/F3 计数）
- os-mem-page-table ← PTE 64bit 重设计 + 反置页表（912 2017/2018/2019）
- os-process-context-switch-cost ← switch_to 换栈 + popl 存 eip（912 2019 ucore）
- os-mem-buddy-slab ← 伙伴 = addr XOR size，1664 XOR 128 = 1536（912 2018/96 年题）
- os-mem-virtual-memory ← 局部性依赖 + 哈希表/二分是最差客户（2005-2006 卷）
- os-mem-malloc ← 内碎片 vs 外碎片归属（Quiz2/3）
- os-io-page-cache-fsync ← buffer vs cache 语义（2004-2005 卷）
- （新题内）classic-algorithms ← 抢占的定义 + 时钟中断 15% 开销（Quiz3）
- （新题内）semaphore-impl ← S=-3 阻塞 3 人 + 互斥量初值与进程数无关（hwChap6）

## ❌ 丢弃与理由

- RAID/磁盘调度 SCAN 家族 —— 组成原理批 1 已落（co-io-raid-levels、co-io-disk-access-time 追问）
- 僵尸/孤儿、系统调用路径、fork/exec —— os.ts 原有题已覆盖
- 阿姆达尔/分支预测 —— 体系结构方向（同批 1）
- 工作集量化（D=ΣWSSi）、交换时间构成、周期扫描页框回收 —— thrashing/伙伴题已传达核心，独立成题价值不足
- SPOOLing、设备驱动层、TCB 存什么、Bernstein 条件竞态推导、单层目录双射 —— 面试口试价值中低
- OCR 风险卷（《2005-2006 答案》纯字母串、《2003-2004 答案》疑似错位）只采信可独立验算的结果
