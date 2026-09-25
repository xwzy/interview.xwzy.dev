import type { Track } from '../types'

export const osTrack: Track = {
  id: 'os',
  name: '操作系统',
  icon: '🖥️',
  tagline: '进程线程、内存管理、文件 IO 到并发控制的内核功',
  description:
    '操作系统是后端面试的硬通货：从进程线程模型、调度与并发控制，到虚拟内存和 IO 子系统，考察对程序在机器上真实运行方式的理解。',
  color: 'indigo',
  topics: [
    {
      id: 'os-process',
      name: '进程与线程',
      description: '进程/线程/协程模型、上下文切换、进程通信与生命周期，理解程序运行的骨架。',
      references: [
        { label: '《Operating Systems: Three Easy Pieces》（免费在线）', url: 'https://pages.cs.wisc.edu/~remzi/OSTEP/' },
        { label: 'Linux manual: fork(2)', url: 'https://man7.org/linux/man-pages/man2/fork.2.html' },
      ],
      questions: [
        {
          id: 'os-process-vs-thread-vs-coroutine',
          title: '进程、线程、协程的本质区别是什么？分别在什么场景下使用？',
          difficulty: 'basic',
          tags: ['进程', '线程', '协程'],
          points: [
            '**进程是资源分配的基本单位**：拥有独立的虚拟地址空间、文件描述符表等内核资源；**线程是 CPU 调度的基本单位**：同进程内线程共享地址空间，仅栈和寄存器上下文私有。',
            '**协程是用户态的轻量执行流**：切换由用户程序（运行时）完成，不经过内核，没有内核态/用户态切换和内核调度开销，单机可轻松支撑百万级协程。',
            '成本对比（数量级）：进程切换 ≈ 微秒级（需切页表、TLB 失效）；线程切换 ≈ 微秒级但不用换地址空间；协程切换 ≈ 纳秒~百纳秒（只保存少量寄存器）。',
            '选型：需要**隔离和故障隔离**用多进程（如 Nginx master-worker）；需要**共享数据、并发处理请求**用多线程；**超高并发 IO 密集**用协程（Go goroutine、Python asyncio、Kotlin coroutine）。',
          ],
          followUps: [
            {
              question: '线程切换比进程切换省在哪里？为什么还要刷新 TLB？',
              points: [
                '进程切换要**切换页表（CR3 寄存器）**，地址空间变了，TLB 里的旧映射全部失效，之后第一次访存都要 TLB miss 走页表，这是进程切换的最大隐性成本。',
                '线程切换只换栈指针和寄存器，页表不变，TLB 仍然有效——这也是"同进程多线程比多进程通信快"的根因。',
                '内核还通过 **PCID（ASID）** 给 TLB 条目打上地址空间标记，减少进程切换后的 TLB 全失效。',
              ],
            },
            {
              question: '协程为什么不能完全取代线程？阻塞式系统调用对协程意味着什么？',
              points: [
                '协程是**用户态协作式调度**：一个协程不主动 yield 就一直占着载体线程；而线程是内核**抢占式调度**。',
                '协程调用阻塞系统调用（如同步 read）会把**整个内核线程卡住**，挂在同一载体线程上的所有协程都无法运行——所以 Go 的 netpoller 把网络 IO 做成非阻塞+事件驱动，goroutine 阻塞时由运行时摘走并调度其他 goroutine。',
                'CPU 密集型任务也不适合协程：无法被抢占会饿死其他协程；runtime 只能靠抢占标记等手段兜底。',
              ],
            },
          ],
        },
        {
          id: 'os-process-state',
          title: '进程有哪些状态？进程状态转换的完整链路是怎样的？',
          difficulty: 'basic',
          tags: ['进程状态', '调度'],
          points: [
            '五态模型：**创建 → 就绪 → 运行 → 阻塞（等待）→ 终止**；Linux 里体现为 TASK_RUNNING（就绪/运行）、TASK_INTERRUPTIBLE、TASK_UNINTERRUPTIBLE、TASK_STOPPED、TASK_ZOMBIE 等。',
            '关键区别：**就绪态缺 CPU，阻塞态缺 CPU 也缺事件**。运行态时间片耗尽 → 就绪；等待 IO/锁 → 阻塞；IO 完成 → 就绪（而不是直接运行）。',
            'Linux 特有的 **TASK_UNINTERRUPTIBLE（D 状态）**：不可被信号打断，通常在等磁盘 IO，`kill -9` 杀不掉的就是它；其变体 TASK_KILLABLE 只响应致命信号。',
            '进程消亡经历 **ZOMBIE 状态**：内核保留退出码等元信息等父进程 wait 回收，之后才释放 PCB（task_struct）。',
          ],
          followUps: [
            {
              question: '区分可中断睡眠和不可中断睡眠的意义是什么？D 状态进程堆积说明什么？',
              points: [
                '可中断睡眠允许信号唤醒（如 Ctrl+C），适合普通等待；不可中断睡眠保证**关键内核操作（页错误回写、设备 IO）不被信号撕开**，避免半途而废导致数据不一致。',
                'D 状态进程堆积通常意味着**存储层故障或严重 IO 阻塞**（如 NFS 挂载失效、磁盘坏道），load average 升高但 CPU 使用率很低。',
              ],
            },
          ],
        },
        {
          id: 'os-process-fork',
          title: 'fork 的执行过程是怎样的？fork + exec 组合为什么这样设计？',
          difficulty: 'intermediate',
          tags: ['fork', '进程创建', 'COW'],
          points: [
            'fork 创建调用进程的**近乎完全副本**：复制 PCB，共享的只读资源（代码、文件表引用）不复制，内存页通过**写时复制（Copy-On-Write）**共享——父子先指向相同物理页并标记只读，任一方写入才触发缺页复制，现代 Linux fork 的主要成本只是复制页表。',
            'exec 用新程序**替换**当前进程的代码段、数据段、堆栈，但保留 PID 和已打开的文件描述符（除非设置了 FD_CLOEXEC）。',
            'fork + exec 的分离设计让"复制自己"（并发）和"变成新程序"（启动新程序）两个能力解耦：shell 管道、重定向正是利用 exec 前的间隙修改文件描述符表实现的。',
            'POSIX 提供 **posix_spawn**、Windows 只有 spawn 语义——fork 的 COW 设计是 Unix 的经典遗产，Linux 的 vfork 更激进：直接共享父进程地址空间直到 exec。',
          ],
          followUps: [
            {
              question: 'fork 之后父子进程的文件描述符偏移量会互相影响吗？为什么？',
              points: [
                '会。fork 复制的是**文件描述符表**，但指向同一份**系统级打开文件表项**（含偏移量），父子共享同一个 offset——这保证交替写同一文件不互相覆盖，是 shell 重定向的基础。',
                '对比：各自独立 open 同一文件则是不同表项，偏移量互不影响。',
              ],
            },
            {
              question: '高并发服务器为什么普遍"prefork/预创建线程"而不是每次请求 fork？',
              points: [
                '每次请求 fork + exec（或 fork + 处理）的固定成本（复制页表、建立 PCB、TLB 冷启动）在**高频短请求**下占比过高。',
                'prefork/thread pool 把创建成本从请求路径挪到启动时，请求只做 accept + 分发；Go/Java 等运行时则用 goroutine/线程池复用执行流。',
              ],
            },
          ],
        },
        {
          id: 'os-process-ipc',
          title: '进程间通信有哪些方式？各自的原理和适用场景？',
          difficulty: 'basic',
          tags: ['IPC', '管道', '共享内存', '信号'],
          points: [
            '**管道**：匿名管道（pipe）是内核环形缓冲区，只用于父子进程；命名管道（FIFO）路径可见可无亲缘通信；均为字节流、半双工。',
            '**共享内存**：shm/mmap 把同一段物理内存映射进多个进程地址空间，**零拷贝、最快**，但需要信号量/mutex 保证同步；适合高频大数据（数据库 buffer、音视频帧）。',
            '**消息队列**：内核维护的消息链表，天然有消息边界、可按类型收，适合低频控制消息；**Unix Domain Socket**：全双工字节流，接口同网络 socket，本机服务间通信标配（如 Docker daemon）。',
            '**信号**：异步事件通知机制（SIGKILL/SIGTERM/SIGUSR1…），不适合传数据，适合控制流；**事件机制还有 eventfd/epoll 中的唤醒**。',
            '选型心法：性能敏感大数据 → 共享内存；简单命令流 → 管道；服务化接口 → UDS；跨机 → 网络 socket + 序列化。',
          ],
          followUps: [
            {
              question: '为什么共享内存最快，却不是所有场景的首选？',
              points: [
                '共享内存只解决"数据可见"，**不解决同步与生命周期**：读写竞争要自己加锁，进程崩溃时锁可能永久丢失（需要 robust mutex / 文件锁兜底），数据结构兼容性也要双方约定。',
                '消息传递类 IPC 把同步隐含在内（内核保证原子投递），牺牲少量拷贝换来**安全性、隔离性和容错**——这正是微服务"消息即边界"的哲学。',
              ],
            },
          ],
        },
        {
          id: 'os-process-zombie',
          title: '什么是僵尸进程和孤儿进程？僵尸进程过多会有什么危害？如何治理？',
          difficulty: 'intermediate',
          tags: ['僵尸进程', '孤儿进程', 'wait'],
          points: [
            '**僵尸进程**：子进程已退出，父进程未 wait 回收其退出状态，残留 PCB（PID、退出码）占着 PID；**孤儿进程**：父进程先退出，子进程被 init（PID 1）或 subreaper 收养并负责回收，无害。',
            '危害：每个僵尸占一个 PID（64 位内核（4.15+）默认 pid_max 已是 4194304（2^22，这也是上限）），海量僵尸会**耗尽 PID 使 fork 失败**；同时是父进程 bug 的信号。',
            '治理：父进程正确 wait/waitpid 或安装 **SIGCHLD 处理器**（循环 waitpid(-1, ..., WNOHANG)）；无法改造父进程时，杀父进程让 init 收养回收，或由容器/进程管理器代管。',
            '容器场景：PID 1 特殊——**不安装 SIGCHLD handler 也不转发信号**就会产生僵尸，这是镜像里用 tini/dumb-init 做 init 的根因。',
          ],
          followUps: [
            {
              question: '为什么 kill -9 杀不掉僵尸进程？这说明 kill 的本质是什么？',
              points: [
                '僵尸进程**早已死亡**，没有任何执行上下文可接收信号；kill 只是把信号投递给仍能执行信号的进程，对 ZOMBIE 无效。',
                'kill 的本质是"向目标进程的 pending 队列投递信号"，由内核在目标进程被调度时交付——所以它治的是活进程，僵尸要靠**父进程 wait**或父进程死亡后收养解决。',
              ],
            },
          ],
        },
        {
          id: 'os-process-context-switch-cost',
          title: '一次上下文切换的开销由哪些部分组成？如何观测与降低？',
          difficulty: 'advanced',
          tags: ['上下文切换', '性能'],
          points: [
            '**直接成本**：保存/恢复寄存器上下文、切换内核栈、更新 task_struct 与调度器数据结构；进程切换额外切换 CR3 页表引发 **TLB 失效**。',
            '**间接成本**（往往更大）：TLB miss 后的页表遍历、CPU cache（L1/L2）被新进程的数据污染、分支预测器状态失效——真实开销可达直接成本的数倍，微秒级很常见。',
            '观测：`vmstat` 的 cs 列、`pidstat -w`（自愿/非自愿切换分开看）、perf 采样 `sched:sched_switch`；大量**非自愿切换**说明 CPU 打满在抢时间片，大量自愿切换说明在等锁/IO。',
            '降低手段：绑核+减少线程数（避免超卖）、批处理减少切换次数、IO 密集改事件驱动/协程、锁竞争改无锁或分片——本质都是**提高单次 CPU 驻留时间的工作密度**。',
          ],
          followUps: [
            {
              question: '自愿切换和非自愿切换分别说明什么问题？调优方向有何不同？',
              points: [
                '**非自愿切换多**：CPU 供不应求，时间片用尽被抢——方向是加资源、降并发度、提优先级或优化 CPU 热点。',
                '**自愿切换多**：线程主动让出（等 IO、等锁、sleep）——方向是优化锁粒度、IO 批量化、用异步/协程减少等待阻塞。',
              ],
            },
          ],
        },
        {
          id: 'os-process-thread-model',
          title: '用户级线程和内核级线程有什么区别？1:1、N:1、M:N 模型各有什么问题？',
          difficulty: 'advanced',
          tags: ['线程模型', '调度', '协程'],
          points: [
            '**1:1（内核级线程）**：一个用户线程对应一个内核调度实体，能利用多核、单线程阻塞不影响其他线程；代价是创建/切换都要进内核，线程数受内核栈内存（默认每线程 8MB 虚拟栈）限制。Java 传统线程、pthread 是代表。',
            '**N:1（用户级线程）**：运行时自己调度，切换极快；但**一个阻塞全卡**且无法利用多核，基本被淘汰（早期 green threads）。',
            '**M:N**：M 个用户协程复用 N 个内核线程，兼顾多核与轻量——Go runtime（GMP）、Erlang 调度器是代表；复杂度在于**运行时要自己处理抢占、阻塞系统调用剥离（hand off P 到其他 M）和负载均衡（work stealing）**。',
            '本质矛盾：调度职责放在内核（通用、抢占可靠）还是用户态（轻量、可定制），M:N 试图两全，于是有了双层调度（two-level scheduling）的所有麻烦。',
          ],
          followUps: [
            {
              question: 'Go 的 GMP 在系统调用阻塞时如何避免整个 P 上的 goroutine 饿死？',
              points: [
                '进入可能长时间阻塞的 syscall 前，goroutine 关联的 **M 会与 P 解绑（P 被摘走）**，sysmon 监控到 syscall 超时会把这个 P 交给（或创建）另一个 M 继续跑其他 goroutine。',
                'syscall 返回后 M 尝试重新获取 P，拿不到就进入休眠队列，goroutine 进入全局队列等待调度。',
                '网络 IO 则根本不阻塞 M：注册进 **netpoller（epoll/kqueue）**，goroutine 被 gopark，就绪后再放回运行队列。',
              ],
            },
          ],
        },
        {
          id: 'os-syscall-path',
          title: '一次系统调用的完整过程是怎样的？为什么比普通函数调用慢？',
          difficulty: 'intermediate',
          tags: ['系统调用', '用户态内核态', 'vDSO'],
          points: [
            '流程：调用号与参数按 ABI 放约定寄存器 → 执行**陷阱指令**（x86-64 的 `syscall`）切到内核态 → 内核查**系统调用表**分发到实现 → `sysret` 返回，返回值经寄存器带回（负值约定为 −errno）。',
            '慢在三处：**特权级切换**、**切内核栈并保存现场**、入口安全逻辑（seccomp 过滤/audit）——普通函数调用只是一次栈帧跳转（纳秒级），系统调用通常几百 ns ~ 1µs，差 1-2 个数量级。',
            '与中断的区别：系统调用是**同步主动陷入**（trap），中断是异步外设事件——共用“内核入口 + 现场保存”机制，但前者按调用号分发、后者按向量号分发。',
            '工程含义：**系统调用次数是显式性能指标**——io_uring 批量提交、writev 聚合写、buffered IO、epoll 一次等多个 fd，本质都是摊薄每次陷入的固定成本。',
            'vDSO：`clock_gettime` 等无副作用调用被内核映射一段用户态代码直接执行，完全跳过陷入——“最快的系统调用是不发生系统调用”。',
          ],
          followUps: [
            {
              question: '线程创建为什么用 clone 而不是 fork？',
              points: [
                'fork 是 clone 的特例：clone 用**标志位**精细控制共享什么（CLONE_VM/CLONE_FILES/CLONE_SIGHAND），全不共享≈fork，全共享≈pthread_create。',
                '内核里两者都是 task_struct，“进程 vs 线程”是共享程度不同的用户态视角。',
              ],
            },
            {
              question: 'Docker 默认 seccomp 对系统调用路径做了什么？有什么坑？',
              points: [
                'seccomp-BPF 在系统调用入口按调用号决定放行/返回 EPERM/杀死进程，默认白名单 300+ 个，收窄内核攻击面。',
                '典型坑：新版 glibc 改用 clone3（旧白名单只放行 clone），容器内创建线程直接 EPERM——“莫名 Operation not permitted”先查 seccomp。',
              ],
            },
          ],
        },
        {
          id: 'os-compile-link-load',
          title: '从源码到进程运行，编译、链接、加载各做了什么？静态库和动态库怎么选？',
          difficulty: 'intermediate',
          tags: ['编译链接', '动态库', '加载器'],
          points: [
            '工具链四步：**预处理**（宏/头文件展开）→ **编译**（生成汇编）→ **汇编**（生成可重定位 .o，符号地址未定）→ **链接**（合并 .o 与库，做**符号解析 + 重定位**）——链接错误的本质都是“符号找不到或定义冲突”。',
            '两种姿势：**静态库**（.a）把代码拷进可执行文件——自包含、无运行时依赖，代价是体积大、库升级要重编依赖方；**动态库**（.so）只记“我需要 libc.so 的 printf”，运行时由**动态链接器 ld.so** 统一加载——同一份库代码段全系统共享物理内存、库升级独立于应用。',
            '加载流程：execve 解析 ELF → 按 Program Header 建虚拟映射（.text 只读执行、.bss 零页）→ ld.so 递归装载依赖并绑定符号（函数默认**惰性绑定**：首次调用经 PLT/GOT 跳板解析）→ `_start` → main。',
            '选型口径：部署隔离/可复现（容器最小镜像、Go 默认静态）→ 静态；系统基础库独立升级、多进程省内存、插件/LD_PRELOAD → 动态——“共享与解耦”是动态库存在的根本理由。',
          ],
          followUps: [
            {
              question: '运行时报 GLIBC_2.xx not found 怎么排查？',
              points: [
                '`ldd` 看依赖树，查 `LD_LIBRARY_PATH` 与 `ldconfig` 缓存，容器场景多为构建/运行镜像环境不一致。',
                '`GLIBC_2.xx not found` 是**符号版本**问题：高版本 glibc 编译的二进制放到低版本环境，只能重编或升级运行环境——“我机器上能跑”的链接期根源。',
              ],
            },
            {
              question: 'PIE/ASLR 是什么？和动态链接什么关系？代价是什么？',
              points: [
                'PIE 让程序自身加载基址随机化，配合 ASLR 抬高 ROP 类攻击成本，现代发行版默认开启。',
                '位置无关代码访存要经 GOT 间接寻址，理论略慢（通常 <5%）——安全与性能的又一处权衡。',
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'os-scheduling',
      name: '调度与并发控制',
      description: 'CPU 调度策略、死锁、锁的实现与无锁编程，多线程正确性与性能的核心。',
      references: [
        { label: 'The Linux Scheduler — LWN 系列', url: 'https://lwn.net/Articles/720227/' },
        { label: 'Linux manual: pthreads(7)', url: 'https://man7.org/linux/man-pages/man7/pthreads.7.html' },
      ],
      questions: [
        {
          id: 'os-sched-deadlock',
          title: '死锁产生的四个必要条件是什么？有哪些处理策略，各自的代价？',
          difficulty: 'basic',
          tags: ['死锁', '锁'],
          points: [
            '四个必要条件：**互斥**（资源独占）、**持有并等待**（握着 A 等 B）、**不可剥夺**（不能强抢）、**循环等待**（形成环路）——破坏任意一个即可预防。',
            '**预防**：按序加锁破坏循环等待（最常用）；一次性申请全部资源破坏持有并等待；支持超时/可中断锁破坏不可剥夺。',
            '**避免**：运行时判断分配是否进入不安全状态（银行家算法），理论价值大于工程实践，因为需要预知最大需求。',
            '**检测与恢复**：允许死锁发生，通过资源分配图找环（如 MySQL 的 wait-for graph），发现后回滚牺牲者——数据库死锁检测就是这个路线；**忽略**（鸵鸟策略）适合死锁概率极低的场景。',
          ],
          followUps: [
            {
              question: 'MySQL 死锁了会发生什么？业务上如何减少死锁？',
              points: [
                'InnoDB 检测到环路后**回滚代价最小的事务**（undo 量少的），返回 Deadlock found 错误，业务需捕获重试；`show engine innodb status` 的 LATEST DETECTED DEADLOCK 可分析。',
                '业务侧：**以相同顺序访问表和索引行**、事务尽量短、给热点行更新用原子语句（update ... set x=x+1）代替 select-then-update、合理建索引避免锁升级为表级扫描加锁。',
              ],
            },
            {
              question: '活锁和死锁的区别？举一个工程上真实发生的活锁例子。',
              points: [
                '死锁是**互相等待卡死不动**；活锁是**没卡死但一直在无效重试**（互相让路又互相冲突），CPU 在消耗但没有进展。',
                '典型例子：两个事务冲突重试总在同一时刻（无退避），或分布式系统里故障节点反复重选主又反复失败。解法核心是**随机退避 + 抖动**打破同步性。',
              ],
            },
          ],
        },
        {
          id: 'os-sched-lock-impl',
          title: '从硬件视角讲讲一把互斥锁是怎么实现的？自旋锁和互斥锁如何选择？',
          difficulty: 'advanced',
          tags: ['锁', 'CAS', 'futex'],
          points: [
            '锁的底层是**原子指令 + 等待策略**：CAS（x86 的 cmpxchg/lock 前缀指令）或 test-and-set 修改锁字；竞争失败时的等待方式区分了不同锁。',
            '**自旋锁**：失败后忙等循环重试，不开销上下文切换，但烧 CPU；适合临界区极短（纳秒~微秒）且多核场景。单核自旋毫无意义（持有者根本没机会运行）。',
            '**互斥锁（futex 路线）**：先在用户态 CAS 尝试快路径；失败才 `futex(FUTEX_WAIT)` 陷入内核挂到等待队列，解锁方 `FUTEX_WAKE` 唤醒——**无竞争时零系统调用**，这是 Linux 互斥锁设计的精髓。',
            '工程折中是**自适应自旋**：先自旋若干次（赌临界区马上释放），失败再睡眠（Java synchronized 的轻量级锁→自适应自旋→重量级锁膨胀是同一思想）。',
            '公平性问题：CAS 排队天然不公平，饥饿线程可能一直抢不过；解决靠**排队锁（MCS/CLH）**——每个 CPU 在本地变量上自旋，由前驱显式移交锁，缓存友好且 FIFO。',
          ],
          followUps: [
            {
              question: '为什么 futex 的"用户态快路径"能成立？什么情况下会退化？',
              points: [
                '快路径成立的前提是**锁状态位保存在用户态内存**，CAS 由硬件保证原子性，无竞争时根本不需要内核介入（内核甚至不知道这把锁存在）。',
                '退化为内核路径的条件：锁被他人持有且持有者未及时释放（要睡眠等待），或等待队列上有唤醒要处理。高竞争下 futex 队列化、唤醒风暴（wake trampling）会成为瓶颈。',
              ],
            },
            {
              question: '读写锁解决什么问题？什么情况下读写锁反而不如普通互斥锁？',
              points: [
                '读写锁利用**读读不互斥**提升读多写少场景的并发度；但读锁也要维护读者计数/等待队列，本身有开销。',
                '临界区极短或写比例不低时，读写锁的额外开销 + **写饥饿**（读者源源不断）可能让它比普通 mutex 还慢；读极频繁且不改结构的场景，**RCU（读零开销、写者复制更新）** 是更好的答案。',
              ],
            },
          ],
        },
        {
          id: 'os-sched-scheduler',
          title: 'Linux 的 CPU 调度器是怎么设计的？CFS 的核心思想是什么？',
          difficulty: 'advanced',
          tags: ['CFS', '调度器', '红黑树'],
          points: [
            'CFS（完全公平调度器）放弃固定时间片，改用**虚拟运行时间 vruntime**：每个可运行任务记录 vruntime（按权重归一化的实际运行时间），调度时**永远挑 vruntime 最小的**——用红黑树维护，O(log n) 找最左节点。',
            '**权重即优先级**：nice 值映射为权重（nice 越低权重越高），权重高的任务 vruntime 增长慢、分到更多 CPU，实现"按比例共享"而非"时间片轮转"。',
            '新任务初始 vruntime 取当前 min_vruntime，避免新任务饿死队列；睡眠任务唤醒时 vruntime 会被校正（给一定补偿但不无限透支），防止睡眠作弊与过度惩罚之间平衡。',
            '多核扩展：**每 CPU 运行队列（per-CPU rq）** 避免全局锁，负载不均时周期性做 **load balance** 迁移任务；其后引入调度域（sched domain）按核簇/NUMA 层次迁移，能源感知的 EAS、后来的 EEVDF（替换 CFS 的公平队列+截止时间）是持续演进方向。',
            '实时任务走独立策略：**SCHED_FIFO/SCHED_RR** 优先级绝对高于普通任务，由 RT throttling 防止饿死普通任务。',
          ],
          followUps: [
            {
              question: '为什么用 vruntime 而不是直接比较真实运行时间？',
              points: [
                '真实时间对所有任务一视同仁，无法体现权重；vruntime 把运行时间**除以任务权重**归一化，使得"高权重任务跑更多真实时间"与"大家 vruntime 相等"同时成立。',
                '它还天然吸收了任务睡眠/唤醒的时间抖动：睡掉的时间不计入 vruntime，唤醒后自然优先得到补偿。',
              ],
            },
            {
              question: '容器里 CPU limit 是怎么实现的？为什么设置 limit 后应用延迟会变差？',
              points: [
                'CFS 通过 **cgroup bandwidth 控制**实现 limit：每个 period（默认 100ms）分配 quota（如 50ms），用尽后整组任务被 throttle 到下个周期——表现为周期性的延迟毛刺（100ms 内最多跑 50ms）。',
                '对延迟敏感服务，常以**调大 period + 提高 quota 余量**或干脆用 request-only（只保底不限顶）缓解；K8s 的 CPU limit 抖动问题正源于此。',
              ],
            },
          ],
        },
        {
          id: 'os-sched-cas-atomic',
          title: 'CAS 是如何保证原子性的？ABA 问题是怎么回事，如何解决？',
          difficulty: 'intermediate',
          tags: ['CAS', '原子操作', '无锁'],
          points: [
            'CAS（Compare-And-Swap）由 **CPU 的 lock 前缀指令**保证原子性：锁定缓存行（或总线），比较内存值与期望值，相等则写入新值并返回成功——单条指令不可被中断，是所有无锁结构的基石。',
            '**ABA 问题**：线程 1 读到 A 后被挂起，期间其他线程把值改成 B 又改回 A；线程 1 恢复后 CAS 成功，但**中间状态可能改变了一切**（如无锁栈中被弹出又压回的节点，next 指针已变）。',
            '解决：**版本号/stamp**（Java 的 AtomicStampedReference：值+版本一起 CAS）、**指针低位标记**、或用 hazard pointer/epoch 回收保证内存不被复用（依赖内存回收机制的方案）。',
            'CAS 的其他代价：竞争激烈时自旋重试烧 CPU（适合低竞争）、只能保证**单个变量**的原子性（多变量要合成一个字或改用锁）。',
          ],
          followUps: [
            {
              question: 'long 类型的"++"为什么不是原子操作？ x86 提供了什么指令直接做这件事？',
              points: [
                '自增是**读-改-写三步**：load 到寄存器、寄存器+1、store 回内存，多线程交错执行会丢失更新——这是最经典的竞态。',
                'x86 提供 `lock inc` / `lock xadd` 直接原子完成；跨平台语言（Java 的 AtomicInteger.incrementAndGet）底层就是这些指令。',
              ],
            },
            {
              question: '无锁就一定比加锁快吗？什么时候应该放弃无锁方案？',
              points: [
                '不一定：无锁把"排队睡眠"换成"原地重试"，**高竞争下重试风暴可能比锁的队列化更耗 CPU**；且无锁代码正确性极难证明（ABA、内存序、回收）。',
                '经验法则：临界区短、竞争低 → CAS/原子变量；竞争高或临界区长 → 普通锁（futex 睡眠反而省 CPU）；读多写少 → RCU/CopyOnWrite；追求吞吐可再考虑分片降低竞争而非硬上无锁。',
              ],
            },
          ],
        },
        {
          id: 'os-sched-producer-consumer',
          title: '如何实现一个线程安全的有界阻塞队列？有哪些关键设计点？',
          difficulty: 'intermediate',
          tags: ['生产者消费者', '条件变量', '阻塞队列'],
          points: [
            '三件套：**互斥锁**保护状态（缓冲区+读写指针/计数），**两个条件变量**（notFull/notEmpty）分别挂起"放不进"的生产者和"取不到"的消费者。',
            '核心是**条件变量必须配合 while 循环检查**（防虚假唤醒、防唤醒后被抢）：`while (队列满) notFull.wait(lock); 入队; notEmpty.notify_one();`——用 if 是经典错误。',
            '条件变量**不保存状态**：通知时无人等待则通知丢失，所以先改条件再 notify，且唤醒方向要正确（入队唤醒消费者，出队唤醒生产者）。',
            '工程增强：Java LinkedBlockingQueue 用两把锁（putLock/takeLock）分离读写端减少竞争，ArrayBlockingQueue 则是单锁 + 两个 Condition；LinkedTransferQueue 用 CAS 无锁实现；Go 的 channel 把 mutex + 环形缓冲 + sendx/recvx 封装成语言原语。',
            '必须处理**关闭语义**：close 后消费者取完剩余应返回"空"而不是永久阻塞，生产者要禁止再入队——阻塞队列的并发 bug 大多藏在关闭路径。',
          ],
          followUps: [
            {
              question: '为什么 wait 要在持有锁的前提下调用？能不能先解锁再 wait？',
              points: [
                'wait 的语义是"**原子地**释放锁并睡眠、被唤醒后重新拿锁"——若先手动解锁再 wait，解锁和睡眠之间状态可能被改掉（检查-等待的窗口被撕开），丢失唤醒。',
                '这也是虚假唤醒要用 while 复查条件的原因：从 wait 醒来到重新拿到锁之间，条件可能已被其他线程消费掉。',
              ],
            },
          ],
        },
        {
          id: 'os-sched-nice-priority-inversion',
          title: '什么是优先级反转？为什么火星探路者号会因此挂掉？如何解决？',
          difficulty: 'advanced',
          tags: ['优先级反转', '实时系统', '互斥锁'],
          points: [
            '优先级反转：**低优先级任务 L 持有互斥锁，高优先级任务 H 等锁阻塞，中等优先级任务 M 抢占 L**——结果 M 间接压住了 H，实际优先级顺序被颠倒。',
            '火星探路者（1997）：气象任务（高）与总线管理任务（低）共享互斥锁，通信任务（中）反复抢占持锁的低优先级任务，导致看门狗高频复位——经典的 Mars Pathfinder 事故。',
            '解决一：**优先级继承**——L 持有锁期间临时提升到等待者中最高优先级，防止被 M 抢占（pthread 的 PRIO_INHERIT、RTOS 常用）。',
            '解决二：**优先级天花板**——锁被赋予预设天花板优先级，持锁者立即提升到天花板，更保守、开销可静态分析。',
            '通用启发：**高优先级与低优先级任务不要共享同一把无保护的锁**，共享资源要么用无锁结构，要么把访问收敛到专门线程串行化。',
          ],
          followUps: [
            {
              question: '这个问题在通用服务器上以什么面貌出现？和实时系统里有什么不同？',
              points: [
                '服务器上没有显式优先级时，表现为**锁持有者被调度器饿死或被 cgroup 限流**：如持锁线程落在被 throttle 的 cgroup、或被绑核策略挤占，等待者集体超时——本质都是"关键等待路径依赖了一个不再运行的持锁者"。',
                '排查共性：看到大量线程等同一把锁但持锁者 CPU 时间不增长，就是它的变体。',
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'os-memory',
      name: '内存管理',
      description: '虚拟内存、页表与 TLB、缺页与页面置换、内存分配器，从地址空间到物理内存的全链路。',
      references: [
        { label: 'What every programmer should know about memory — LWN', url: 'https://lwn.net/Articles/250967/' },
        { label: 'Linux manual: mmap(2)', url: 'https://man7.org/linux/man-pages/man2/mmap.2.html' },
      ],
      questions: [
        {
          id: 'os-mem-virtual-memory',
          title: '虚拟内存解决了什么问题？它是如何工作的？',
          difficulty: 'basic',
          tags: ['虚拟内存', '页表', 'MMU'],
          points: [
            '虚拟内存给每个进程一个**独立的、连续的虚拟地址空间**，由 **MMU 通过页表把虚拟页映射到物理页框**，解决三大问题：进程隔离（互相摸不到）、地址冲突（程序按固定布局编译链接）、内存超卖（按需分配 + 交换）。',
            '翻译流程：CPU 发虚拟地址 → **TLB 命中**直接得物理地址（快）；miss 则遍历页表（多级页表是内存中的树），最终命中物理页框号 + 页内偏移拼出物理地址。',
            '页表项里还有**权限位（R/W/X）、存在位、脏位、访问位**：权限位支撑 NX 不可执行栈、COW；存在位为 0 触发缺页中断。',
            '虚拟内存 ≠ 交换：换页（swap）只是其中一环；mmap 映射文件、共享库、COW、按需零页都是虚拟内存机制的的不同玩法。',
          ],
          followUps: [
            {
              question: '既然虚拟内存这么好，为什么大数据/数据库程序仍会手写大页、绑核、mmap 优化？',
              points: [
                '通用机制的代价对**内存访问极密集**的程序变得显著：4KB 页导致 TLB 覆盖范围小（几十 MB 就 miss），大页（2MB/1GB）直接扩大 TLB 覆盖、降低 miss 率。',
                'NUMA 下本地/远端访存延迟差可达 1.5~2 倍，绑核+本地内存分配减少跨节点访问；mmap 则把文件的读路径从"read 系统调用+页缓存拷贝"变成"直接访存+缺页"，省一次拷贝和系统调用（代价是缺页毛刺和 page fault 处理成本）。',
              ],
            },
          ],
        },
        {
          id: 'os-mem-page-table',
          title: '为什么需要多级页表？一次访存最坏要几次内存访问？',
          difficulty: 'intermediate',
          tags: ['多级页表', 'TLB', '页错误'],
          points: [
            '单级页表按全地址空间预分配：64 位/48 位虚拟地址、4KB 页需要 2^36 个表项，每进程数百 GB 页表，**不可接受**；且进程实际只用了地址空间的零星几块。',
            '多级页表把页表变成树：**顶级页表常驻，深层页表按需分配**——未使用的区域连第二级都不存在，用"查表次数"换"存储空间"（典型的空间换时间反用：省空间、慢路径多几次访存）。',
            'x86-64 常规 4 级页表（PGD→PUD→PMD→PTE）：TLB miss 时**最坏 4 次额外内存访问**才能拿到物理地址；5 级页表（LA57）再 +1。',
            '缓解手段：**TLB** 缓存翻译结果（命中率 >99%）；**大页**减少页表层级和表项数；进程切换用 PCID 避免全量刷 TLB。',
          ],
          followUps: [
            {
              question: '大页有什么副作用？为什么数据库开启透明大页（THP）反而经常出问题？',
              points: [
                '大页放大**内碎片**（分配粒度 2MB）和**换页粒度**，THP 的后台整理还可能引入**分配延迟毛刺**（同步 compaction 阻塞缺页进程）。',
                'Redis/MongoDB/MySQL 官方都建议关闭 THP：COW 时复制的粒度从 4KB 变 2MB，fork 类操作的内存膨胀和延迟被放大数百倍。',
                '生产实践：关 THP，改用 madvise/显式 hugetlbfs 给确定受益的组件（如 DPDK、JVM 大堆）。',
              ],
            },
          ],
        },
        {
          id: 'os-mem-page-fault',
          title: '发生缺页中断后，内核的完整处理流程是怎样的？',
          difficulty: 'advanced',
          tags: ['缺页中断', 'page fault', '换页'],
          points: [
            'CPU 访问的页**存在位为 0 或权限不符** → 触发 page fault，陷入内核，拿到出错虚拟地址和访问类型（读/写/取指）。',
            '内核先做**合法性检查**：地址是否在该进程的 VMA 范围内、权限是否匹配——非法则发 SIGSEGV（野指针的由来）；合法则分类处理。',
            '**次要缺页（minor）**：页在 page cache 或缺 COW，直接建立映射（COW 则复制页并改写为可写），微秒级。**首次访问匿名页**：分配清零页（先共享 zero page，写入才真分配）。',
            '**主要缺页（major）**：从磁盘/swap 读回，进程睡眠等待 IO——这是性能事故的主要来源；内存压力大时还会先走**页面回收（kswapd/直接回收）** 腾地方。',
            '统计口径：`ps` 的 min_flt/maj_flt、`vmstat` 的 si/so（换入换出）； maj_flt 飙升说明内存不足在换页，吞吐断崖式下跌。',
          ],
          followUps: [
            {
              question: '页面置换算法有哪些？操作系统实际用的是什么？',
              points: [
                '理论：FIFO（有 Belady 异常）、OPT（不可实现，做 benchmark 基准）、LRU（理论好但硬件维护精确 LRU 太贵）、Clock（LRU 的环形数组近似）。',
                'Linux 实际用**双链近似 LRU（active/inactive 两个 lru 列表，现在拆分 anon/file 与 mglru）**：访问提升到 active，kswapd 从 inactive 尾部回收；访问位（PG_accessed/referenced）由硬件置位、软件定期清扫——用低成本的"位标记+周期扫描"逼近 LRU。',
              ],
            },
          ],
        },
        {
          id: 'os-mem-malloc',
          title: 'malloc 的底层实现机制是怎样的？brk 和 mmap 什么时候用哪个？',
          difficulty: 'advanced',
          tags: ['malloc', '内存分配器', 'ptmalloc'],
          points: [
            'malloc 是**库（用户态分配器）**：向内核批发（brk/mmap）大块内存，再零售给应用——glibc 的 ptmalloc 用 bin 链表管理不同尺寸的空闲块（fastbin/smallbin/largebin + tcache 线程缓存），小于 128KB（M_MMAP_THRESHOLD）走 brk 扩堆，大块直接 mmap。',
            '**brk** 推动程序断点扩展堆，适合小块、频繁分配；**mmap** 匿名映射独立区域，释放时立即归还内核（munmap），避免堆顶空洞，但每次有系统调用和缺页开销。',
            '**碎片**：ptmalloc 的痛点是**外部碎片**（空闲块尺寸不匹配无法合并，堆不缩回）——这就是"内存只涨不跌"的常见原因；free 后内存往往还在分配器手里没还给 OS（对比 RSS 与 malloc_trim）。',
            '多线程扩展性催生了 **tcmalloc/jemalloc**：每线程 cache 无锁分配、按 size class 切分、中心化 span/page 管理，Google/Facebook 系服务标配；换分配器常是低成本的性能优化。',
          ],
          followUps: [
            {
              question: '程序 RSS 很高但业务对象不多，可能是什么原因？如何排查？',
              points: [
                '候选原因：**分配器碎片**（free 了但没还 OS）、glibc arena 数量随线程数膨胀（64 位默认 8×ncores 个堆）、mmap 阈值附近反复分配导致地址空间碎片、堆内对象驻留但引用链未断（泄漏）。',
                '排查路径：对比 RSS 与活跃内存（malloc_info/jemalloc stats）→ pmap 看匿名段分布 → 堆分析（jemalloc prof、heaptrack、Go pprof heap）→ 必要时调 MALLOC_ARENA_MAX 或换 jemalloc/tcmalloc 验证。',
              ],
            },
          ],
        },
        {
          id: 'os-mem-stack-heap-layout',
          title: '进程的虚拟地址空间布局是怎样的？栈和堆各自如何生长？',
          difficulty: 'intermediate',
          tags: ['地址空间', '栈', '堆'],
          points: [
            '典型 64 位布局（低→高）：代码段 .text（只读执行）→ 只读数据 .rodata → 数据段 .data（已初始化）/ .bss（未初始化，映射零页）→ 堆（brk 向上生长）→ mmap 区域（共享库、文件映射、大 malloc，传统向下生长）→ 栈（向下生长，含环境变量）→ 内核空间（用户不可访问）。',
            '**栈**：编译器自动管理，函数调用时移动栈指针分配栈帧，返回即回收；默认大小固定（Linux 线程默认 8MB，ulimit -s 可查），**溢出**（深递归、超大局部数组）触发 SIGSEGV。',
            '**堆**：运行时按需分配，生命周期由程序员/GC 管；碎片和泄漏是两大风险。`.bss` 不占可执行文件体积：加载时映射匿名零页即可。',
            '查看手段：`pmap`/`/proc/pid/maps` 逐段核对，线上排查地址越界、段错误地址归属时必备。',
          ],
          followUps: [
            {
              question: '为什么函数返回局部变量的指针是未定义行为？返回大的结构体却可以？',
              points: [
                '局部变量在**栈帧**上，函数返回时栈指针回退、栈帧作废，指针指向的内存会被后续调用覆盖——悬垂指针，读它读到的是垃圾。',
                '返回结构体走的是**隐藏的返回值参数（RVO/NRVO 优化）**：调用方在调用前就准备好返回对象的地址，被调方直接在那块内存上构造，不存在悬垂；而返回"结构体的指针"仍然危险。',
              ],
            },
          ],
        },
        {
          id: 'os-mem-oom',
          title: 'Linux OOM Killer 是怎么选择牺牲者的？如何避免进程被误杀？',
          difficulty: 'intermediate',
          tags: ['OOM', '内存回收', 'cgroup'],
          points: [
            '内存耗尽（直接回收也挤不出页）时触发 OOM killer：按 **badness 评分**挑牺牲者——主要因子是**进程 RSS（含 swap）× oom_score_adj**，adj 范围 -1000（永不杀，如 init）到 +1000（优先杀），管理员可配置保护关键进程。',
            '容器里 OOM 常表现为 **cgroup OOM**：内存 limit 到顶触发组内杀，`dmesg` 里看到 "Memory cgroup out of memory" 和被杀进程的 oom-kill 计数。',
            '避免误杀：为关键进程设置负 oom_score_adj、合理 limit 留 headroom、限制单进程堆（JVM -Xmx 与容器 limit 对齐，否则 JVM 视角还有余量但 cgroup 已爆）。',
            '比 OOM 更早的信号：内存回收变活跃（sar -B 的 pgscan）、swap 用量攀升、maj_flt 上升——监控这些比等 OOM 告警有效得多。',
          ],
          followUps: [
            {
              question: '为什么说"配置了 swap 就安全"是个误解？数据库为什么常常禁 swap？',
              points: [
                'swap 只是延迟爆炸：回收/换页的 IO 成本会让进程在 OOM 前先经历**长时间假死**（maj_flt 风暴），对延迟敏感服务比快速失败更糟。',
                '数据库持有大量热点页，被换出后单次查询可能触发大量随机换入，性能雪崩；且 PostgreSQL 等依赖自己管理缓存，OS 缓存帮不上忙反添乱——常见做法 swapiness 调 0~1 或干脆禁用。',
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'os-io',
      name: '文件系统与 IO',
      description: 'VFS 与 inode、零拷贝、IO 多路复用与网络模型，高并发服务的 IO 底座。',
      references: [
        { label: 'Linux manual: epoll(7)', url: 'https://man7.org/linux/man-pages/man7/epoll.7.html' },
        { label: 'Linux manual: io_uring(7)', url: 'https://man7.org/linux/man-pages/man7/io_uring.7.html' },
      ],
      questions: [
        {
          id: 'os-io-inode',
          title: 'inode 是什么？软链接和硬链接的区别？删除文件后空间为什么有时不释放？',
          difficulty: 'basic',
          tags: ['inode', '文件系统', '软硬链接'],
          points: [
            '文件 = **inode（元数据：大小、权限、时间戳、数据块指针）+ 数据块**；目录本质是"文件名 → inode 号"的映射表。`ls -i` 可看 inode 号。',
            '**硬链接**：多个目录项指向同一 inode，引用计数 +1，删除任一名字只是计数 -1，计数归零（且无进程打开）才释放数据块；不能跨文件系统、不能对目录（防环）。',
            '**软链接**：独立 inode 存放"目标路径字符串"，类似快捷方式；可跨文件系统、可指目录，但目标被删后成悬空链接（dangling）。',
            '磁盘满的经典排查：`df -i` 看 **inode 用量**——海量小文件可能 inode 先耗尽（No space left on device 但 df 显示有空间）；已删除但仍被进程打开的文件，空间要到 **fd 关闭**才释放（`lsof | grep deleted` 定位）。',
          ],
          followUps: [
            {
              question: '日志文件删了但磁盘没释放，除了重启进程还有什么办法？',
              points: [
                '通过 `/proc/<pid>/fd/` 找到被删除文件的 fd，**truncate 该 fd**（`> /proc/pid/fd/N` 或 `: > file`）即可原地释放空间，业务无感。',
                '根因预防：日志轮转要用**重命名+信号重开（logrotate 的 copytruncate 或应用 reopen）**，避免删除正被写入的文件。',
              ],
            },
          ],
        },
        {
          id: 'os-io-zero-copy',
          title: '什么是零拷贝？sendfile/splice/mmap 分别把拷贝从几次降到几次？',
          difficulty: 'intermediate',
          tags: ['零拷贝', 'sendfile', 'DMA'],
          points: [
            '传统 read+write 发文件：**4 次拷贝（DMA 磁盘→页缓存、页缓存→用户缓冲、用户→socket 缓冲、socket→网卡 DMA）+ 4 次内核/用户态切换**，CPU 全程搬运数据。',
            '**mmap+write**：省掉"页缓存→用户缓冲"这次拷贝（直接映射页缓存），3 次拷贝 4 次切换；适合需要**修改数据**再发的场景。',
            '**sendfile**：数据全程在内核，页缓存→socket 缓冲（可避免）→网卡，**2 次 DMA 拷贝 0 次 CPU 拷贝**（配合 SG-DMA），2 次切换——Kafka、Nginx 静态文件高性能的关键之一。',
            '**splice** 基于管道在两个 fd 间移动数据不经过用户态；**io_uring** 进一步把提交/完成队列化，减少系统调用本身的开销。',
            '本质思想：**让 CPU 尽量不碰数据**（交给 DMA），并砍掉内核/用户间的冗余搬运——凡是"读进来原样发出去"的路径都该想到零拷贝。',
          ],
          followUps: [
            {
              question: '为什么 TLS 加密后就不能直接用 sendfile 了？Nginx 是怎么处理的？',
              points: [
                'sendfile 要求"文件字节原样进 socket"，而 TLS 要先**在 CPU 上做对称加密**改变字节——数据必须经过用户态（或至少经过加密引擎）处理后才能发出，零拷贝链条断裂。',
                'Nginx 对启用 SSL 的站点会提示 sendfile 不生效（kTLS 技术是解法：把对称加密下沉到内核，sendfile 出口加密，重新让路径变"零拷贝"）。',
              ],
            },
          ],
        },
        {
          id: 'os-io-epoll',
          title: 'select、poll、epoll 的区别？epoll 为什么高效？边缘触发和水平触发的区别？',
          difficulty: 'intermediate',
          tags: ['epoll', 'IO 多路复用', 'NIO'],
          points: [
            'select/poll 每次调用都要**把整个 fd 集合从用户态拷入内核并线性扫描**，O(n)，且 select 还有 1024 上限；连接数大但活跃少时（C10K 的典型形态）开销巨大。',
            '**epoll 三件套**：epoll_create 建实例（内核红黑树管理 fd）、epoll_ctl 注册/修改、epoll_wait 等就绪链表——注册一次常驻内核，等待时**只返回就绪的 fd**，O(活跃数) 而非 O(总连接数)；内核通过**回调把就绪 fd 挂入 rdllist**，无需遍历全部。',
            '**水平触发 LT**：只要还有数据就绪就一直报告，编程简单不会丢事件（默认）；**边缘触发 ET**：仅在状态变化时报告一次，必须**一次性把数据读到 EAGAIN**，配合非阻塞 fd，减少唤醒次数、吞吐更高（Nginx 用 ET；Redis 用 LT（靠自身循环读保证不丢事件））。',
            'epoll 不是万能：连接少而活跃高的场景 select 足够；epoll 高效的前提正是 **"海量连接 + 稀疏活跃"** 的互联网负载模型。',
          ],
          followUps: [
            {
              question: 'ET 模式下漏读数据是经典的线上 bug，正确的读写循环怎么写？',
              points: [
                'fd 必须设为**非阻塞**；读循环：反复 read 直到返回 -1 且 errno==EAGAIN/EWOULDBLOCK 才退出循环；写同理循环 write 直到缓冲满。',
                '配额保护：单次事件最多读 N 字节或循环 M 次后主动挂起等下次事件，防止单个大流量连接饿死 reactor 线程。',
              ],
            },
            {
              question: 'io_uring 相比 epoll+read 的异步模型，本质变化是什么？',
              points: [
                'epoll 只把"等待"异步化，数据搬运仍要 read 系统调用；io_uring 用**共享内存的提交队列 SQ/完成队列 CQ** 把系统调用本身也批量化、异步化（read/write/recv/send/fsync 全可提交）。',
                '收益：减少系统调用次数与上下文切换、天然适配 NVMe 等高并发块设备；代价：编程模型复杂、安全边界与版本兼容性问题。',
              ],
            },
          ],
        },
        {
          id: 'os-io-fd',
          title: '文件描述符是什么？"Too many open files" 报错如何排查和治理？',
          difficulty: 'basic',
          tags: ['文件描述符', 'ulimit', '连接泄漏'],
          points: [
            'fd 是进程打开"一切 IO 资源"（文件、socket、管道、epoll、eventfd）的**整数句柄**，指向内核打开文件表项；0/1/2 固定为标准输入/输出/错误。',
            '上限三层：**进程级**（ulimit -n / LimitNOFILE）、**用户级**（/etc/security/limits.conf）、**系统级**（fs.file-max）；容器里还有 cgroup 与 K8s 层配置。',
            '排查：`ulimit -n` 看上限；`lsof -p pid | wc -l` 对比用量；`lsof` 按类型聚合看泄漏源（常见：未关闭的 HTTP 响应体、连接池没还连接、每次请求新建 client）。',
            '治理：修复泄漏（defer/finally 关闭、连接池化）、上调 limit（systemd 的 LimitNOFILE、容器 runtime 配置）、对内向客户端库复用单例——fd 泄漏最终会演变为 accept 失败、全站拒绝服务。',
          ],
          followUps: [
            {
              question: 'TIME_WAIT 堆积导致端口耗尽和 fd 耗尽是同一类问题吗？',
              points: [
                '不是：**fd 耗尽是进程句柄表满**；TIME_WAIT 堆积是**四元组端口资源问题**（主动关闭方 2MSL 内不能复用五元组），表现为 connect 报 EADDRNOTAVAIL。',
                'TIME_WAIT 治理：用连接池/长连接减少主动关闭、增大端口范围、开启 `tcp_tw_reuse`（时间戳开启时安全）；`tcp_tw_recycle` 因 NAT 问题已从内核移除。',
              ],
            },
          ],
        },
        {
          id: 'os-io-sync-async',
          title: '阻塞、非阻塞、同步、异步 IO 到底怎么区分？Reactor 和 Proactor 的区别？',
          difficulty: 'intermediate',
          tags: ['BIO', 'NIO', 'AIO', 'Reactor'],
          points: [
            '**阻塞/非阻塞**讲"调用立刻返回还是挂起等待"；**同步/异步**讲"数据拷贝到用户缓冲区这一步由谁完成"——同步 IO（包括 epoll+read）最终要自己 read；异步 IO（io_uring/AIO）内核把数据备好再通知你。POSIX 定义下 epoll 属于同步非阻塞。',
            '**Reactor**：事件通知"fd 可读了"，应用自己执行 read+处理（I/O 多路复用 + 回调分发），Linux 主流（Redis 单 Reactor、Nginx/Netty 多 Reactor 主从结构）。',
            '**Proactor**：发起异步读，内核完成"等数据+拷贝"后通知"数据已在你的缓冲区"，应用只做业务处理；传统 Linux AIO 支持有限、Windows IOCP 是成熟实现，io_uring 让 Linux 有了实用化 Proactor 的条件。',
            '模型与线程的关系：Reactor 也要配线程池做业务（避免回调里做重活）；单 Reactor 单线程（Redis）吞吐瓶颈在单核，多 Reactor 解决但引入线程切换与共享状态问题。',
          ],
          followUps: [
            {
              question: 'Redis 6.0 为什么引入多线程？这会破坏它单线程无锁的简单性吗？',
              points: [
                '瓶颈从 CPU 计算变成**网络 IO（读写 socket、协议解析）**，引入 IO 线程并行处理网络读写，而**命令执行仍单线程**——并发安全模型不变，复杂度只加在网络层。',
                '这是通用规律：事件循环 + 单线程执行 + IO 并行化，是"保留简单性同时突破 IO 瓶颈"的折中范式。',
              ],
            },
          ],
        },
        {
          id: 'os-io-page-cache-fsync',
          title: 'Page Cache 在写入路径上扮演什么角色？write 返回成功数据就安全了吗？',
          difficulty: 'advanced',
          tags: ['Page Cache', 'fsync', '脏页', '持久化'],
          points: [
            'write 只是把数据写进**页缓存（脏页）**即返回——对应用"成功"，但对磁盘未落盘；由内核回写线程（writeback）按脏页比例/时间异步刷盘，掉电则丢。',
            '可靠性手段：**fsync/fdatasync** 强制刷该文件（fdatasync 省元数据）、O_SYNC 打开即同步写、O_DIRECT 绕过页缓存（数据库自管理缓存时避免双重缓存）。',
            'fsync 的成本与坑：机械盘一次 fsync 毫秒级，是 WAL、Kafka 刷盘、Redis AOF 的吞吐瓶颈；**还要 fsync 文件所在目录**才能保证新建文件本身的元数据持久（崩溃后文件可能消失）。',
            '性能与安全的权衡谱系：每条 fsync（最安全最慢）→ 每秒/每 N 条（group commit，数据库 redo log 的做法）→ 依赖副本冗余不刷盘（Kafka 默认靠多副本而非 fsync）。',
          ],
          followUps: [
            {
              question: 'Redis AOF 的 everysec 为什么能兼顾性能与安全？"丢失 1 秒"的边界在哪里？',
              points: [
                'everysec 由后台线程**每秒批量 fsync**，主线程写命令只追加 AOF 缓冲；即使阻塞也最多丢约 2 秒（本轮 fsync 进行中时的新写入顺延）。',
                '边界在于：fsync 阻塞超 2 秒会触发主线程延迟刷盘保护（aof_delayed_fsync 计数）；`no-appendfsync-on-rewrite` 则是 AOF 重写/BGSAVE 期间是否暂停 fsync 的开关——磁盘抖动时性能雪崩点在 fsync 排队，这正是生产上要求 AOF 落在低延迟盘（本地 NVMe）的原因。',
              ],
            },
          ],
        },
      ],
    },
  ],
}
