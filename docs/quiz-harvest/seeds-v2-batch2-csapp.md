# 二期 · 批 2 · 计算机系统/CSAPP 补强（来源：北大 ICS 2013-2017 期中期末试卷带答案）

> 语料：`structured/06-计算机系统/计算机系统`（A 层 24 份，北大 ICS 16 份试卷为主）。
> 收割方式：agent 通读 4 份带答案试卷（2016 期中答案 / 2017 期中 / 2014 期末带答案 / 2015 期末带答案）提取 15 条种子。

## 新题 1（network.ts，net-security 领域）

- **net-sec-buffer-overflow**：缓冲区溢出攻防——strcpy 覆盖返回地址原理（2017 期中 myprint 原题）、
  金丝雀（%fs:40 / __stack_chk_fail 汇编指纹）、NX/ASLR/PIE 分层防御与 ROP 转向、金丝雀绕过面（泄露/堆溢出/fork 服务爆破）。

## 追问增强 6 条

1. **os-compile-link-load** ← 2014/2015 期末链接大题：静态库链接顺序与"未定义引用"、强弱符号三规则、
   链接器只看符号名不看类型（extern long long vs int[2] 照样链接通过）。
2. **os-process-fork** ← 2015 期末 printf/fork 原题：stdio 用户态缓冲被 fork 复制导致输出重复、
   write 无缓冲对照、"fork 前 fflush"工程规避。
3. **os-scene-signal-exit** ← 2015 期末信号三连：pending 位合并（阻塞十个同类只处理一次→waitpid 循环）、
   alarm+pause 自制 sleep 的竞态与 sigaction+sigsuspend 正解、信号处理器可重入约束。
4. **co-mem-vm-tlb**（从虚拟地址到物理地址题）← 2015 期末第六题：改页表项后必须 invlpg 失效 TLB
   否则读到旧映射、TLB shootdown 关联。
5. **co-data-complement** ← 2016 期中恒等式判断题：`(double)x+(double)y == (double)(x+y)` 不恒成立
   （int 溢出 vs double 不溢出）、浮点交换律成立结合律不成立、`(x&y)+((x^y)>>1)` 无溢出求均值。
6. **os-mem-malloc** ← 2014/2015 期末适配策略选择题：手写 malloc 设计题——块格式与边界标记、
   首次/下次/最佳适配的碎片分布、按大小排序与分离空闲链表、splitting/coalescing。

## 丢弃（与现有题重复或纯笔试）

- TLB/Cache/Page 命中组合不可能性（co-mem-vm-cache 已有，正文即此题）；dup/共享文件偏移（os-io-open-file-table 已覆盖）；
  PV 先 P(empty) 后 P(mutex)（os-sched-semaphore-impl 追问已有）；线程共享变量判定（os-process 基础题覆盖）；
  TCP 四元组与端口耗尽（network TCP 题覆盖）；socket pair 私有 IP/25 端口纠错题（trivia）。
- 纯笔试：cretXX 流水线寄存器补全、12-bit 浮点填表、Y86 HCL、cache 手工画表、手工地址翻译、反汇编补空、
  流水线吞吐率计算——不可口述化，全部丢弃。
- 结构体对齐 sizeof（co-scene-alignment 追问已有 padding 规则与成员重排，数值算例重复）。
