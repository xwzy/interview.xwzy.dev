import type { Track } from '../types';

export const opsTrack: Track = {
  id: 'ops',
  name: '运维与云原生',
  icon: '☸️',
  tagline: 'Linux 生产排障、容器编排、CI/CD 与可观测性',
  description: '运维 / SRE / DevOps 岗位的面试考点：Linux 排障肌肉记忆、Docker 与 Kubernetes 核心机制、CI/CD 流水线、监控告警与 SRE 实践。',
  color: 'teal',
  topics: [
    {
      id: 'ops-linux',
      name: 'Linux 与常用运维',
      description: '从 CPU/内存/磁盘/端口排查到日志分析、Nginx 配置，考察生产环境动手排障的肌肉记忆。',
      references: [
        { label: 'Linux man pages（man7.org）', url: 'https://man7.org/linux/man-pages/' },
        { label: 'Nginx 官方文档', url: 'https://nginx.org/en/docs/' },
        { label: 'GNU Bash Reference Manual', url: 'https://www.gnu.org/software/bash/manual/' },
      ],
      questions: [
        {
          id: 'ops-linux-permission',
          title: 'Linux 文件权限 rwx 怎么理解？chmod 755、644 分别是什么意思？',
          difficulty: 'basic',
          tags: ['文件权限', 'chmod'],
          points: [
            '三组角色：**属主（u）/ 属组（g）/ 其他（o）**，每种角色三种权限：**r=4（读）、w=2（写）、x=1（执行）**，相加得到三位八进制。`ls -l` 第一列如 `-rwxr-xr--`：第一个字符是类型（- 文件，d 目录，l 软链），后面九位就是三组 rwx。',
            '**755 = rwxr-xr-x**：属主全权，组和其他人只读+执行——常用于目录和可执行程序；**644 = rw-r--r--**：属主可读写，其他人只读——常用于普通文件；**600**：仅属主可读写——私钥文件的正确姿势。',
            '目录的 **x 权限是“进入”**：目录没有 r 无法列内容，没有 x 无法 cd 进入或访问其中文件——“能看目录名但打不开”的现象就是缺 x。改属主属组用 `chown user:group file`，递归加 `-R`。',
            '实用补充：**umask** 决定新建文件的默认权限（默认 022 → 文件 644、目录 755）；`chmod +x script.sh` 给脚本加执行权是“Permission denied”最常见解法；生产环境纪律——**最小权限原则**，应用不用 root 跑，配置文件 640 且收敛属组。',
          ],
          followUps: [
            {
              question: '用 root 启动的服务写了文件，普通用户删不掉或覆盖不了，通常是什么原因？',
              points: [
                '删除/覆盖文件看的是**所在目录的 w 权限**而不是文件本身——目录属主是你就能删；覆盖写（vim 保存、> 重定向）可能触发文件本身的 w 限制或产生新 inode。',
                '另一种常见情况是**文件被进程占用**且位于只读挂载或被 chattr +i 锁定，用 `lsattr` 查看隐藏属性，`chattr -i` 解锁。',
              ],
            },
          ],
        },
        {
          id: 'ops-linux-cpu-high',
          title: '服务器 CPU 使用率飙高，你怎么排查？top 里的 us、sy、wa 分别是什么意思？',
          difficulty: 'basic',
          tags: ['CPU', 'top', '排查'],
          points: [
            '排查路径：`top`（按 P 按 CPU 排序）找到**进程** → `top -Hp <pid>` 或 `ps -mp <pid> -o THREAD,tid,time` 找到**线程** → 若是 Java，`printf "%x\\n" <tid>` 转十六进制后 `jstack <pid> | grep -A 20 <nid>` 精确定位到代码行。',
            'top 里各列含义是读懂问题的钥匙：**us**（用户态，高 = 业务代码在算，死循环/正则回溯/序列化）、**sy**（内核态，高 = 系统调用频繁/上下文切换，配合 `vmstat 1` 看 cs 列）、**wa**（等待 IO，高 = CPU 在等磁盘，瓶颈在 IO 不在 CPU）、**si/st**（软中断/被虚拟化偷走的 CPU，云主机 st 高说明宿主机超卖）。',
            '**load average 与 CPU 使用率的区别**必考：load 是“**正在运行 + 等待运行 + 不可中断等待（D 状态）**”的任务数，对比核数判断拥挤程度（4 核 load 长期 > 4 就是过载）；CPU 100% 但 load 不高可能是算力型任务，load 高但 CPU 低常见于大量 D 状态（IO 卡住）。',
            '常见元凶清单：代码死循环、低效正则、频繁 Full GC（us 高且伴随 GC 线程活跃）、大文件序列化、log4j 同步刷盘、密码/加密计算；**恶意场景**：挖矿病毒（陌生进程、CPU 长期满载）——查 `crontab -l`、陌生启动项。',
          ],
          followUps: [
            {
              question: 'load 很高但 CPU 使用率很低，可能是什么情况？',
              points: [
                'load 统计的是“**运行 + 等待运行 + 不可中断睡眠（D 状态）**”的任务数——大量线程卡在 **D 状态**（磁盘/NFS/存储挂起）时 load 飙高而 CPU 空闲；用 `ps -eo stat,pid,cmd | grep "^D"` 或 `vmstat 1` 的 b 列确认。',
                '这类场景的排查方向是**存储层**：`iostat -x 1` 看 util 与 await、`dmesg` 看磁盘报错、检查 NFS 挂载是否僵死——“load 高 CPU 低”恰恰提醒不能只盯着 CPU 指标看问题。',
              ],
            },
          ],
        },
        {
          id: 'ops-linux-memory',
          title: 'free 命令的输出怎么读？内存不足时怎么排查？available 和 free 有什么区别？',
          difficulty: 'basic',
          tags: ['内存', 'free', '排查'],
          points: [
            '关键看 **available** 而不是 free：`free` 是完全未被使用的内存；`buff/cache` 是内核拿来缓存磁盘数据的内存，**应用需要时可以回收**；available ≈ free + 可回收的 cache，才是“还能给新进程用多少”。所以“free 很小”本身不说明内存不足，Linux 拿空闲内存做缓存是正常且良性的。',
            'top/ps 里的内存列：**VIRT** 虚拟地址空间（可能远大于实际占用，Java 尤其夸张）、**RES** 常驻物理内存（真正关注的数字）、**SHR** 共享内存；`%MEM`、以及 `pmap -x <pid>` 看进程内存分布。',
            '内存不足的信号链：available 持续走低 → 系统开始 **swap**（`vmstat 1` 的 si/so 列持续非零，性能急剧劣化）→ 仍不够时触发 **OOM Killer**（`dmesg | grep -i "killed process"` 或 `/var/log/messages` 找到被杀进程与当时的内存快照）。',
            '排查思路：先分辨**谁在吃内存**（top 按 M 排序 / `ps aux --sort=-rss | head`）；再分辨是**泄漏还是水位高**——观察 RSS 趋势：只涨不跌且持续增长是泄漏（Java 用 jmap dump 堆分析，Native 用 valgrind/ASan），水位高但稳定可能只是缓存配置过大（如 JVM 堆外、数据库 buffer pool）。',
            '常用处置：临时释放页缓存 `echo 3 > /proc/sys/vm/drop_caches`（生产慎用，治标）；调小应用内存配置；**加内存或限流**才是根治；swap 建议保留但 swappiness 调低（数据库机器通常 `vm.swappiness=1`）。',
          ],
          followUps: [
            {
              question: 'swap 里有数据就说明内存不足吗？swappiness 到底在调什么？',
              points: [
                '不一定：swappiness 较高时内核会**主动把不活跃页换出**给页缓存腾地方；判断真缺内存要看 `vmstat 1` 的 **si/so 是否持续非零**、available 是否持续走低——偶发换入换出无需紧张。',
                'swappiness（0~100）调节的是“倾向用 swap 还是回收缓存”：**数据库/延迟敏感服务调到 10 甚至 1**，宁可回收页缓存也别换出热页；设成极端值不如配套做好**应用内存上限与容量规划**——swap 是安全垫，不是堆内存的续命手段。',
              ],
            },
          ],
        },
        {
          id: 'ops-linux-disk',
          title: '磁盘满了怎么排查？为什么删了大文件空间还不释放？',
          difficulty: 'basic',
          tags: ['磁盘', 'df', 'du'],
          points: [
            '标准三连：`df -h` 看整体使用率与挂载点 → `du -sh /* 2>/dev/null` 逐层下钻找大目录（或 `du -h --max-depth=1 . | sort -rh | head`）→ `find / -size +1G -type f 2>/dev/null` 定位大文件。日志目录、临时目录、docker 占用（`docker system df`）是三大惯犯。',
            '**删了文件空间不释放**的经典原因：文件**仍被进程持有句柄**，删除只是移除目录项，inode 与数据块要等进程关闭才释放。定位：`lsof | grep deleted` 或 `lsof +D /var/log`；处置：重启/重载对应进程（nginx 日志场景用 `kill -USR1` 配合 logrotate），或对还在写的大文件用 `> bigfile.log` 清空而非 rm。',
            '**df 和 du 对不上的两个原因**：① 上面说的已删除未释放文件（du 看不到但 df 占着）；② **inode 耗尽**——海量小文件（邮件队列、session 文件、图片缩略图）把 inode 用光，`df -h` 还有空间但写入报 “No space left on device”，用 `df -i` 确认，清理小文件或格式化时调大 inode 数。',
            '预防机制（答出这层体现生产意识）：**logrotate 轮转压缩日志**（按天切割 + 保留 N 份 + copytruncate 或信号重载）、磁盘告警阈值（80% 预警 90% 告警）、临时文件与上传目录的定期清理脚本、容器环境的镜像/卷清理（`docker system prune`）。',
          ],
          followUps: [
            {
              question: 'df -h 显示还有空间但写入报 No space left on device，怎么排查？',
              points: [
                '第一嫌疑是 **inode 耗尽**：`df -i` 看 IUse%，接近 100% 就是它——海量小文件（邮件队列、session、缩略图、crontab 输出堆积）是惯犯；逐目录数文件量下钻定位。',
                '处理分两层：**应急**清理小文件目录（批量 find -delete 前先抽样确认）；**根治**改应用写法（合并小文件、轮转清理）或重新格式化时调大 inode 密度（mkfs.ext4 -i），XFS 动态管理 inode 通常无此困扰。',
              ],
            },
          ],
        },
        {
          id: 'ops-linux-port-process',
          title: '怎么查一个端口被哪个进程占用？netstat 和 ss 有什么区别？',
          difficulty: 'basic',
          tags: ['端口', 'ss', 'lsof'],
          points: [
            '三条常用命令：`ss -tlnp | grep 8080`（-t TCP -l 监听 -n 数字端口 -p 进程）、`lsof -i:8080`（最直观，直接给出进程名/PID/用户）、老系统用 `netstat -tlnp | grep 8080`。**“Address already in use” 起不来服务**就用这三条查，还要注意 IPv6（`*:8080` 可能是 :::8080）与 TIME_WAIT 占用。',
            '**ss 优于 netstat**：netstat 走 /proc 逐个读取，连接量大时很慢；ss 直接通过 **netlink 接口与内核通信**，快几个数量级，且信息更全（`ss -s` 总览各状态连接数）。面试金句：“netstat 是历史遗产，ss 是现在进行时”。',
            '看连接状态分布排障：`ss -ant | awk \'{print $1}\' | sort | uniq -c`——**TIME_WAIT 大量堆积**通常是本机主动发起大量短连接（该上连接池或长连接）；**CLOSE_WAIT 堆积是代码 bug**（对端关闭后本机没调 close，句柄泄漏）；SYN_RECV 高可能是半连接攻击。',
            '进程排查配套：`ps aux | grep xxx`（aux 含 CPU/内存/启动时间，ef 看父子关系）、`pgrep -f` / `pkill -f`、`lsof -p <pid>` 看进程打开的所有文件与端口；僵尸进程（STAT 为 Z）：父进程没 wait 子进程，杀父进程或修代码回收，`ps -ef | grep defunct` 可发现。',
          ],
          followUps: [
            {
              question: '线上出现大量 TIME_WAIT，要不要紧张？怎么缓解？',
              points: [
                '先定性：TIME_WAIT 是**主动关闭方**的必经状态（停留 2MSL），单机几千个通常无害；要警惕的是它**耗尽本地端口**（默认范围约 3 万个）或集中在网关/代理层——用 `ss -ant | awk \'{print $1}\' | sort | uniq -c` 看分布再下结论。',
                '缓解按层来：应用层**上连接池或长连接**（治本，先定位谁在大量短连接）；内核层 `net.ipv4.tcp_tw_reuse=1` 配合时间戳安全复用出方向端口——**不要开 tcp_tw_recycle**（NAT 环境丢包，新内核已移除）。',
              ],
            },
          ],
        },
        {
          id: 'ops-linux-net-debug',
          title: '线上「网络不通 / 连接异常」，你的排查工具链和顺序是什么？',
          difficulty: 'intermediate',
          tags: ['网络排障', 'tcpdump', 'ss', 'mtr'],
          points: [
            '**分层排查的顺序（先粗后细，别上来就抓包）**：① **DNS**（`dig +trace` / `nslookup`——解析对不对、走了哪个 DNS）；② **连通性**（`ping` 目标 IP——注意 ICMP 可能被防火墙禁，ping 不通不等于不可达）；③ **路径**（`mtr` 比 traceroute 好：实时逐跳看**丢包与延迟**，哪一跳开始坏一目了然）；④ **端口与服务**（`curl -v` 带超时探测七层、`telnet/nc` 探四层）；⑤ 还不通才**抓包看真相**（tcpdump/Wireshark）。',
            '**tcpdump 的实用语法（现场功夫）**：过滤三件套——`tcpdump -i any host 10.0.0.5 and port 8080`（host/port/and or not 组合）；`-nn` 禁止域名与端口名解析（快且干净）、`-w file.pcap` 落盘给 Wireshark 深挖、`-c 100` 限量；生产注意：**抓包有性能成本**（高流量接口加过滤条件与时长限制），容器环境用 `kubectl exec` 或 sidecar 抓。',
            '**看懂抓包里的三种典型病灶**：**重传风暴**（同一个 seq 反复出现——丢包或拥塞，结合 `ss -ti` 看单连接重传统计）；**RST**（连接被硬拆：端口没监听、防火墙 reject、进程崩溃半路退出——RST 的来源方向指向责任方）；**三次握手后立即 FIN**（连上了但应用层立刻断——问题在七层：协议错、认证拒、后端健康检查失败）；**零窗口**（接收方处理不过来——对端慢不是网络问题，是应用问题）。能按"症状 → 层次 → 责任方"读包，排障就从玄学变科学。',
            '**主机侧的连接账本**：`ss -s` 看总量分布（TIME_WAIT/CLOSE_WAIT 堆积的含义见 TCP 题分工）；**conntrack 表满**（`nf_conntrack: table full` 日志 + `cat /proc/sys/net/netfilter/nf_conntrack_count`——NAT/防火墙连接跟踪表溢出会**静默丢新建连接**，高并发短连接场景的经典"偶发不通"；缓解：调大表、调低超时、或业务上连接池）；本机防火墙 iptables/nftables 规则与**安全组**（云环境第一大嫌疑）逐层确认。',
            '收束：网络排障的方法论 = **从分层模型的下层往上收敛，每层选最便宜的验证工具**，抓包是最后手段不是第一反应；能说清"这个工具验证的是哪一层的哪个假设"，就不会在工具堆里迷路。',
          ],
          followUps: [
            {
              question: '服务 A 调服务 B 偶发超时，监控上 B 的 RT 正常，你怎么查？',
              points: [
                '**中间层假设清单**：A 侧连接池耗尽（拿连接排队的时间算进了 RT——查池水位与等待指标）；**DNS 偶发解析慢/失败**（A 侧 `dig` 统计、ndots/search 域导致的多次解析）；网络**重传**（mtr 长跑 + `ss -ti` 重传统计，偶发丢包在平均 RT 上不可见）；conntrack/安全组限流（新建连接被丢）；B 的**软限流**（B 的应用层限流拒绝了一部分，但监控只统计成功的 RT——被拒请求不算进 B 的 RT 分布，这个盲区要点破）。',
                '定位手段：A 与 B 两侧**同时抓包**对同一批请求 ID（时间戳对齐看包在哪一跳消失/变慢）、用 **trace**（链路追踪的 span 看时间花在哪一段——排障工具优先级：trace > 指标 > 日志 > 抓包）；能说出"偶发问题靠长跑统计与双侧对拍，不靠盯屏"，就是排障老手。',
              ],
            },
          ],
        },
        {
          id: 'ops-linux-log-analysis',
          title: '给你一个几百 GB 的访问日志，怎么用命令行快速分析？grep、awk、sed 的典型组合用法？',
          difficulty: 'intermediate',
          tags: ['日志分析', 'awk', 'grep'],
          points: [
            'grep 精确检索：`-c` 只数数量、`-v` 反选、`-E` 扩展正则、`-A/-B/-C` 带上下文（异常堆栈必用）、`-r` 递归目录、`-i` 忽略大小写；大文件用 **zgrep** 直接搜 .gz，避免解压占盘。先缩小时间范围（按天滚动的日志先选对文件）再搜，是几百 GB 场景的第一原则。',
            'awk 做统计（按列处理，Nginx 默认日志 $1=IP、$7=URI、$9=状态码）：',
            '```bash\n# 访问量 top10 的 IP\nawk \'{print $1}\' access.log | sort | uniq -c | sort -rn | head\n\n# 5xx 状态码的占比\nawk \'$9 >= 500 {n++} END {printf "%.2f%%\\n", n/NR*100}\' access.log\n\n# 每分钟的请求量分布\nawk \'{print substr($4, 2, 17)}\' access.log | sort | uniq -c\n```',
            'sed 做提取与替换：`sed -n \'5,10p\'` 打印区间、`sed \'s/old/new/g\'` 替换（配合 `-i` 直接改文件，改配置前先备份）；提取时间片段日志 `sed -n \'/10:00:00/,/10:05:00/p\'`。',
            '组合拳思路与性能意识：管道顺序影响速度——**先用 grep 过滤掉 99% 的行再做 awk 统计**；`sort | uniq -c | sort -rn` 是计数统计万能模板；不需要完整分析时用 `tail -n 100000` 抽样近似。这些命令是面试现场手写的高频题，练习到不查资料能写。',
          ],
          followUps: [
            {
              question: '统计 499 状态码最多的前 20 个 URL（去掉查询参数），写出命令。',
              points: [
                '管道拆解：先 `grep " 499 "` 预过滤（大文件先砍掉 99% 的行），再用 awk 去参并取 URL、计数排序：`grep " 499 " access.log | awk \'{split($7, a, "?"); print a[1]}\' | sort | uniq -c | sort -rn | head -20`。',
                '要点：**split 按 ? 切**去掉查询参数才能正确聚合；`sort | uniq -c | sort -rn` 是计数万能模板；现场手写时先说思路（过滤 → 提取 → 聚合 → 排序）再落命令，比直接背命令更稳。',
              ],
            },
            {
              question: '日志是按天滚动的 .gz 压缩包，怎么高效跨文件分析？',
              points: [
                '**z 系列工具直接操作压缩文件**，不解压落盘：`zgrep -c "ERROR" app.log.2026-*.gz` 计数、`zcat *.gz | awk ...` 管道串联统计——避免“先全量解压”的磁盘峰值与等待。',
                '注意口径：gzip 不支持随机读，**跨文件统计要按文件粒度合并**（每个文件单独算再加总）；如果这类分析是常态，正确解法是把日志进 ELK/Loki 建索引——命令行是应急利器，不是长期方案。',
              ],
            },
          ],
        },
        {
          id: 'ops-linux-process-signal',
          title: 'kill -9 和 kill -15 有什么区别？僵尸进程是什么、怎么处理？',
          difficulty: 'intermediate',
          tags: ['进程', '信号', 'kill'],
          points: [
            '`kill` 发的是**信号**不是强制杀死：**-15（SIGTERM）**是默认信号，“请你退出”——进程可捕获，执行**清理逻辑**（释放锁、落盘、关闭连接、通知注册中心下线）后退出；**-9（SIGKILL）**内核直接终止，**不可捕获不可忽略**——数据可能没落盘、临时文件残留、注册中心要等心跳超时才发现节点下线。正确姿势：**先 -15，等待宽限期（如 30s）没退再 -9**。这也是 K8s 的 terminate 流程（SIGTERM → terminationGracePeriodSeconds → SIGKILL）。',
            '常用信号补充：**SIGHUP**（老守护进程用之重载配置，nginx reload 的底层机制）、SIGINT（Ctrl+C）、SIGSTOP/SIGCONT（暂停/恢复）；`kill -l` 查全部。优雅重启服务 = 发 TERM + 健康检查确认，而不是无脑 -9。',
            '**僵尸进程（Zombie）**：子进程已退出，但**父进程没有调用 wait() 回收它的退出状态**，进程表项残留（STAT 为 Z，命令名带 <defunct>）。它不占 CPU/内存但**占用 PID**，大量堆积会耗尽 PID 空间。',
            '处理：杀掉僵尸的**父进程**（僵尸会被 init/systemd 接管并回收）——`ps -ef | grep defunct` 找到 PPID 后 `kill <ppid>`；根治是修复父进程代码（wait/waitpid、信号处理 SIGCHLD）。容器里还有个经典坑：**PID 1 进程不转发信号、不回收子进程**，所以应用镜像要用 `tini`/`dumb-init` 或让应用自己当好 PID 1。',
            '后台运行三件套：`nohup cmd &`（挂断不退出，输出到 nohup.out）、`disown`、`setsid`；临时会话用 tmux/screen；生产服务统一交给 **systemd** 管理（自动重启、日志 journald、依赖编排），这是“运维规范”层面的标准答案。',
          ],
          followUps: [
            {
              question: 'K8s 里 Pod 停机时应用没处理完请求就被 SIGKILL，可能是什么原因？',
              points: [
                '两个高频原因：① **terminationGracePeriodSeconds（默认 30s）内没退完**——优雅停机（排空连接、处理存量请求）耗时超过宽限期；② 应用**根本没收到信号**——shell 形式的 CMD（脚本里再启动 java）会让 SIGTERM 发给 shell 而不是业务进程。',
                '解决组合：镜像用 **exec 形式 CMD 或 tini** 保证信号直达；调大宽限期匹配真实停机时长；配 **preStop 钩子**先等 endpoints 摘除传播——这几件事凑齐，滚动发布才能零错误。',
              ],
            },
            {
              question: '为什么有时 kill -9 也杀不死一个进程？',
              points: [
                'SIGKILL 由内核处理、进程无法拦截——但如果进程卡在**不可中断的系统调用（D 状态）**（NFS/存储 IO、某些驱动操作），要等系统调用返回后内核才能处理信号，表现为“kill -9 无反应”。',
                '处理路径：`ps` 确认 D 状态 → `cat /proc/<pid>/stack`、`lsof` 看卡在哪个挂载或设备——多数只能等 IO 超时或重启；**僵死的 NFS/存储链路**是这类问题的惯犯，这也解释了“load 高 CPU 低”的另一种成因。',
              ],
            },
          ],
        },
        {
          id: 'ops-linux-ebpf',
          title: 'eBPF 是什么？为什么说它改变了内核观测与网络的方式？',
          difficulty: 'advanced',
          tags: ['eBPF', '内核', '可观测性', '性能分析'],
          points: [
            '一句话定位：**内核里的安全沙箱虚拟机**——把受限字节码动态加载进内核执行，挂在各种钩子上（系统调用、tracepoint、kprobe、网卡收包 XDP、cgroup），用户态程序通过 map（环形缓冲/哈希表）取回数据；加载前必须过 **verifier 验证器**的静态检查（证明内存访问不越界、程序必然终止），这是"敢让人往内核注入代码"的安全前提。',
            '**它解决的矛盾**：内核观测原本两难——/proc 这类静态接口信息有限，而想拿更细的数据要么改内核要么装内核模块（危险且随内核升级失效）；eBPF **不改内核、动态注入探针**，观测从"内核给了什么计数器"升级为"我想问什么就现场编一个程序"——这个范式转变是本题的题眼。',
            '**杀手级应用三族**：① **可观测**（bcc/bpftrace：任意系统调用的延迟直方图、TCP 重传统计、文件 IO 热点；配合火焰图做 on-CPU/**off-CPU 分析**——off-cpu 回答"线程在等谁"，是 strace/perf 传统工具覆盖不了的盲区）；② **网络**（**XDP 在网卡驱动层**做 DDoS 清洗与负载均衡，比 iptables/netfilter 快一个量级；Cilium 用 eBPF 造 Service Mesh 数据面，无 sidecar）；③ **安全**（运行时行为审计、容器逃逸检测）。',
            '与传统工具的性能对比要有数：strace 基于 ptrace 每次系统调用两次陷入，被跟踪进程可**慢 10~100 倍**（只能临时排障用）；eBPF 在内核内聚合（只回传统计结果），开销个位数百分比——这就是"生产环境可常驻"与"救火才敢用"的差别。',
            '边界与治理（主动讲才可信）：verifier 的限制（循环有界、栈仅 512B、不能随意调内核函数）、内核版本兼容（CO-RE 重定位机制缓解）、加载需要 CAP_BPF 权限——**威力越大越是审计面**；收束谈资：eBPF 的历史意义是"内核从不可编程的基础设施变成可编程平台"，类比容器之于部署。',
          ],
          followUps: [
            {
              question: 'verifier 是怎么保证一段 eBPF 程序不会搞挂内核的？',
              points: [
                '**加载时静态证明**：对程序所有执行路径做抽象解释——每个寄存器在每个点的类型与取值范围可推、每次内存访问的边界已检查（指针必须验证过才能解引用）、循环必须可证明终止（有界迭代）、栈上未初始化数据不可读；任何一条路径证明不了就**拒绝加载**——把运行时风险前置到加载时。',
                '对比视角：这与 type checker、与 Wasm 验证器是同一哲学——**用加载时验证换运行时安全**，代价是某些编程模式写不出来（动态跳转、无界循环要改写成有界形式）。能把这个共性点出来，说明对"安全沙箱"的理解是体系化的。',
              ],
            },
            {
              question: 'kprobe、tracepoint、uprobe 有什么区别？生产上怎么选？',
              points: [
                '**tracepoint**：内核源码里预埋的稳定钩子（带版本 ABI 承诺），稳定但覆盖点由内核开发者决定；**kprobe**：可挂在几乎任意内核函数入口（动态断点），灵活但内核版本一变/函数被内联优化就消失——适合临时排障不适合长期依赖；**uprobe**：挂用户态二进制的函数（如某个库的调用），做应用层黑盒分析。',
                '生产选型顺序：优先 tracepoint/uprobe（稳定），kprobe 做补充与应急；上了 Cilium 这类 eBPF 平台后，平台已经封装好探针管理——自写 bpftrace 脚本定位"这一次的疑难杂症"，平台化探针做"日常常驻观测"，两者是分工不是替代。',
              ],
            },
          ],
        },
        {
          id: 'ops-linux-nginx',
          title: 'Nginx 的 location 匹配优先级是怎样的？502、504 分别代表什么问题？',
          difficulty: 'intermediate',
          tags: ['Nginx', '反向代理'],
          points: [
            'location 匹配优先级（高频考点，要能按序说出）：① `=` **精确匹配**，命中即停；② `^~` **前缀匹配**，命中后**不再尝试正则**；③ `~` / `~*` **正则匹配**（区分/不区分大小写），按配置文件**顺序**取第一个命中的；④ 普通前缀 `location /xxx/`——都没命中时取**最长前缀**。一句话记忆：**精确 > ^~ 前缀 > 正则 > 最长前缀**。',
            '反向代理最小配置要会手写：',
            '```nginx\nupstream app {\n  server 10.0.0.1:8080 weight=2;\n  server 10.0.0.2:8080;          # 默认轮询；备选 ip_hash/least_conn\n}\nserver {\n  location / {\n    proxy_pass http://app;\n    proxy_set_header Host $host;                 # 透传域名\n    proxy_set_header X-Real-IP $remote_addr;     # 透传真实客户端 IP\n    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\n    proxy_read_timeout 60s;                      # 默认 60s，长接口要调\n  }\n}\n```',
            '**错误码诊断**（排障高频）：**502 Bad Gateway**——Nginx 连不上上游：应用挂了/端口不对/防火墙，看 upstream 报错 `connect() failed`；**504 Gateway Timeout**——连上了但上游在 `proxy_read_timeout` 内没回包：慢查询、接口阻塞；**499**——客户端（或上游 LB）等不及主动断开，常见于用户狂点刷新或前置超时小于后端耗时。',
            '负载均衡策略与要点：轮询（默认）、weight 加权、ip_hash（会话粘滞，破坏均匀性，最好用 Redis session 替代）、least_conn；健康检查用 `max_fails` + `fail_timeout`（开源版被动探测）。运维要点：改配置先 `nginx -t` 语法检查再 `nginx -s reload`（平滑重载，老 worker 处理完存量请求再退出）；**client_max_body_size** 默认 1M，上传大文件必调；access_log 按天切割防止单文件过大。',
          ],
          followUps: [
            {
              question: '线上突然大面积 502，你的排查顺序是什么？',
              points: [
                '第一步看 **Nginx error_log** 定方向：`connect() refused`——上游进程没了（应用崩溃/发布中/端口不对）；`connect() timeout`——上游不响应（卡死/防火墙）；`upstream prematurely closed connection`——应用处理中崩溃重启。三种报错指向三个方向。',
                '第二步验证上游：登录上游机器 `curl 127.0.0.1:8080/healthz` 直接探活、`ss -tlnp | grep 8080` 确认监听；常见根因还有 OOM 被杀、线程池/连接池打满拒绝连接——**error_log 定性 + 上游探活定位**，两步解决九成 502。',
              ],
            },
            {
              question: 'nginx -s reload 为什么能不断流？配置写错了 reload 会怎样？',
              points: [
                '基于 **master-worker 多进程模型**：master 先用新配置 fork 新 worker 接流量，通知老 worker **处理完存量连接后退出**——新旧并存、平滑过渡；长连接（WebSocket、keepalive）会拖住老 worker，可用 `worker_shutdown_timeout` 兜底。',
                '配置错误的保护：reload 前会先做**语法检查，失败则继续用旧配置运行**，不影响线上——所以正确姿势是 `nginx -t` 先行、再 reload、再 curl 验证；systemd 下 `systemctl reload nginx` 走同一机制。',
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'ops-cicd',
      name: '容器与 CI/CD',
      description: 'Docker 分层与镜像优化、K8s 核心对象与发布策略，覆盖从代码到上线的交付全链路。',
      references: [
        { label: 'Docker 官方 · Dockerfile 最佳实践', url: 'https://docs.docker.com/build/building/best-practices/' },
        { label: 'Kubernetes 官方 · 概念文档', url: 'https://kubernetes.io/docs/concepts/' },
      ],
      questions: [
        {
          id: 'ops-cicd-image-layers',
          title: 'Docker 镜像的分层原理是什么？为什么它能做到多处共享、秒级启动？',
          difficulty: 'basic',
          tags: ['Docker', '镜像分层', 'UnionFS'],
          points: [
            '镜像由一系列**只读层（layer）**堆叠而成，每条 Dockerfile 指令生成一层；运行时在顶部加一个**可写层（container layer）**，容器销毁可写层即丢弃，镜像不变——这就是“**镜像不可变**”的基础。',
            '底层技术是 **UnionFS（overlay2）**：把多层目录联合挂载成一个视图，**同名文件上层覆盖下层**；**写时复制（Copy-on-Write）**——修改下层文件时先把它拷到可写层再改，所以容器内改文件会越用越慢、镜像内的文件原则上不该改。',
            '共享与传输的收益：多个镜像共用同一基础层（如都是 node:20-alpine），**磁盘上只存一份**；拉取镜像时本地已存在的层跳过，只下载差异层；推送同理按层去重。每层有内容寻址的 hash（DiffID/ChainID），内容变则 hash 变。',
            '**层缓存与构建的关系**（衔接 Dockerfile 优化）：构建时 Docker 逐层比对缓存——**某层失效，它之后的所有层全部重建**。所以指令顺序要按“变化频率”排：依赖清单 → 装依赖 → 源码 → 构建，改一行代码不该触发重装 npm 包。',
            '辨析题备用：容器不是“轻量虚拟机”，镜像 ≠ 虚拟机磁盘（分层共享 + COW）；可写层数据不持久，持久化用 **Volume**；`docker commit` 手工做镜像不可复现，生产必须用 Dockerfile 构建产出不可变制品。',
          ],
          followUps: [
            {
              question: '容器里改了文件，重启容器还在吗？删除重建呢？怎么正确持久化？',
              points: [
                '**重启（stop/start）保留**可写层；**删除重建（docker rm 后 run、K8s 重建 Pod）可写层丢弃**——“改了配置重启就好、一重建就没了”的疑惑都源于可写层的生命周期。',
                '正确姿势：持久数据用 **Volume/挂载**，配置外置到 ConfigMap/环境变量；原则上**容器内一切状态视为临时**、有状态数据落存储层——这也是“不可变基础设施”的核心含义：变的是新镜像/新配置，不是容器现场。',
              ],
            },
          ],
        },
        {
          id: 'ops-cicd-container-vs-vm',
          title: '容器和虚拟机的区别是什么？Docker 靠什么实现隔离？',
          difficulty: 'basic',
          tags: ['Docker', 'namespace', 'cgroups'],
          points: [
            '核心区别：**虚拟机通过 Hypervisor 虚拟出一整套硬件，每个 VM 跑独立内核**，隔离强但重（GB 级、分钟级启动）；**容器共享宿主机内核**，只隔离进程视图，MB 级镜像、秒级启动、密度高一个数量级。宿主机内核版本即容器的内核版本（所以 Linux 容器不能原生跑在 Windows 内核上，需要 VM 中转）。',
            '隔离靠两大内核机制：**Namespace**——让进程“看不见”系统其他部分，常用六种：**PID**（进程号隔离，容器内自己的 1 号进程）、**NET**（独立网卡/端口/路由）、**MNT**（挂载点/文件系统）、**UTS**（主机名）、**IPC**（信号量/共享内存）、**USER**（用户映射）。',
            '**Cgroups**——管“能用多少”：限制 CPU 配额、内存上限（超限触发 OOM kill）、块设备 IO、PID 数量等，是资源配额与防“邻居噪声”的基石。K8s 的 requests/limits 最终也落在 cgroups 上。',
            '安全边界要能说清：容器隔离**弱于 VM**（共享内核，内核漏洞可能容器逃逸），所以生产要——**不以 root 运行**、最小镜像、只读根文件系统、seccomp/AppArmor 加固，强隔离场景用 **Kata/gVisor**（容器体验 + 独立内核/拦截层）。答题落点：容器 = **进程级隔离 + 资源限额 + 不可变交付**，虚拟机 = 硬件级隔离，两者解决不同威胁模型。',
          ],
          followUps: [
            {
              question: '容器里的进程能看到宿主机的其他进程吗？宿主机怎么进入容器的网络空间排查？',
              points: [
                '默认不能——**PID Namespace 隔离**：容器内的 1 号进程是它自己的主进程，`ps aux` 只能看到容器内视图；宿主机则能看到全部（`docker top`、`ps auxf`）。',
                '宿主机排查利器 **nsenter**：`nsenter -t <容器主进程pid> -n ss -antp` 进入容器的网络命名空间看连接，`-m` 进挂载空间——容器里没装工具时，从宿主机借道 namespace 排查是容器网络排障的常用招。',
              ],
            },
          ],
        },
        {
          id: 'ops-cicd-k8s-core',
          title: 'K8s 的 Pod、Deployment、Service 分别是什么？它们怎么协作？',
          difficulty: 'basic',
          tags: ['Kubernetes', 'Pod', 'Deployment'],
          points: [
            '**Pod**：最小调度单元，包含**一个或多个共享网络与存储的容器**（同 Pod 容器共享 IP、可 localhost 互访、共享 Volume）；多容器用于 **sidecar 模式**（日志收集、代理、init 容器做前置检查）。Pod 是**易逝的（ephemeral）**——被调度、被重建后 IP 变，所以不能直接依赖 Pod IP。',
            '**Deployment**：声明“我要 N 个副本的某版本应用”，通过管理 **ReplicaSet** 实现副本数维持（挂了自动拉起）与**滚动更新**（新版 ReplicaSet 逐步扩、旧版逐步缩）；配套 **revision 历史支持回滚（rollout undo）**。它体现 K8s 的核心思想：**声明式 API + 控制循环**——用户声明期望状态，控制器持续把实际状态向期望状态调谐（reconcile）。',
            '**Service**：给一组（标签选择的）Pod 提供稳定的**虚拟 IP + DNS 名**，解决“Pod 会死会漂移”的访问问题；类型：**ClusterIP**（集群内访问，默认）、**NodePort**（每节点开端口）、**LoadBalancer**（接云厂商 LB）。转发由 kube-proxy 用 **iptables/IPVS 规则**实现。',
            '串起来的协作链路（答题收尾必说）：Deployment 创建 ReplicaSet → ReplicaSet 拉起 Pod → **Service 通过 label selector 选中这批 Pod**，自动维护 endpoints（Pod 上下线动态增删）→ 客户端访问 Service 域名（CoreDNS 解析）被转发到健康 Pod。配置用 **ConfigMap/Secret** 注入，与镜像解耦。',
            '常见追问：Pod 为什么不直接用（缺副本管理/自愈/更新编排）；label 与 selector 是 K8s 一切关联的粘合剂；探针（liveness/readiness）属于 Pod spec，衔接下一题。',
          ],
          followUps: [
            {
              question: 'Pod 重建后 IP 变了，客户端靠什么稳定访问？中间有哪些环节可能出错？',
              points: [
                '靠 **Service 的稳定 VIP + DNS**：Pod 上下线时 endpoints 自动增删、kube-proxy 同步更新 iptables/IPVS 规则，客户端只认 Service 域名——这就是“永远不要直连 Pod IP”的原因。',
                '可能出错的环节：**label 与 selector 不匹配**（Service 找不到 Pod，endpoints 为空）、**readiness 未通过**（Pod 存在但不接流量）、CoreDNS 解析异常——排查口诀是先看 `kubectl get endpoints` 有没有地址，再往前查 label 与探针。',
              ],
            },
          ],
        },
        {
          id: 'ops-k8s-gateway-api',
          title: 'K8s 的 Ingress 有什么问题？Gateway API 解决了什么？',
          difficulty: 'intermediate',
          tags: ['Kubernetes', 'Gateway API', 'Ingress', '流量管理'],
          points: [
            '**Ingress 的历史包袱**：核心 API 只有"host + path → service"这一种表达，**所有高级能力（金丝雀、权重分流、header 匹配、重写、超时）都靠 annotation 塞**——而 annotation 是各控制器自定义方言（nginx 一个写法、ALB 另一个），不可移植、无法校验、多团队共用一个 Ingress 对象互相踩；与 Service/Ingress 原理题分工：那题讲 Service 转发与 Ingress 基础，本题讲**入口标准的演进**。',
            '**Gateway API 的模型重构（答题主线）**：把一个大对象拆成**角色分工的三层**——**GatewayClass**（基础设施团队：定义实现类型，如 nginx/envoy/云厂商）、**Gateway**（平台团队：实例化一个入口，绑定 VIP/域名与证书策略）、**HTTPRoute/GRPCRoute/TCPRoute**（业务团队：自己的路由规则挂到 Gateway 上）——**角色分离 + 权限分离**（业务只能改自己的 Route，不能再碰全站入口对象），这是 Ingress 时代"所有人共改一个 YAML"痛点的根治。',
            '**表达能力原生化的要点**：**跨命名空间的路由挂载**（Route 可挂到别的 Namespace 的 Gateway，平台统一管入口、业务散管路由）；**原生字段**：header/path 多重匹配、**后端权重**（金丝雀 90/10 不再是 annotation）、**请求重写/镜像/超时/重试**进 API 规范；**GatewayClass 的实现生态**已是事实标准（Envoy Gateway、NGINX Gateway Fabric、Cilium、云厂商 CRD 纷纷落地）。',
            '**迁移与共存（工程判断力）**：Ingress 不会消失（存量巨大）；迁移路径：**控制器双读**（同时支持两种 API 的实现，如 NGINX Ingress → NGINX Gateway Fabric 分批迁）或 **Ingress-Translation 工具**批量转换；决策因素：是否需要多团队分权、是否重度依赖某控制器特有 annotation（迁移 = 重写这些方言）。收束：Gateway API 的本质是**把"入口"从单一资源对象升级为可组合的角色协议**——与 RBAC、CRD 一样，都是 K8s "API 即平台合同"哲学的延伸。',
          ],
          followUps: [
            {
              question: '灰度发布在 Gateway API 上怎么做？和 Nginx annotation 时代比强在哪？',
              points: [
                '**权重后端原生支持**：一个 HTTPRoute 挂两个 backendRef（stable 服务 weight 90、canary 服务 weight 10），**规范字段意味着任何实现行为一致**——迁移实现不再重写灰度逻辑；再叠 **header 匹配做定向灰度**（内部员工 header=x 走 canary，其余走 stable），两段规则声明即得。',
                '强在哪的总结口径：annotation 时代的灰度是"某控制器的私有方言"（换实现全重来、无法用 kubectl 校验、权重与匹配规则没法做 GitOps 的 schema 校验）；Gateway API 是**可校验、可移植、可分权**的标准——把灰度从运维技巧变成平台能力。若再用 **Argo Rollouts/Flagger** 联动（分析指标自动推进或回滚），就是"声明式流量 + 渐进式交付"的完整现代答案（与发布策略题衔接）。',
              ],
            },
          ],
        },
        {
          id: 'ops-cicd-dockerfile-optimize',
          title: '怎么把一个 1GB 的 Docker 镜像优化到 200MB？写出优化后的 Dockerfile 要点。',
          difficulty: 'intermediate',
          tags: ['Dockerfile', '多阶段构建', '镜像优化'],
          points: [
            '**换更小的基础镜像**：`ubuntu/debian` → `alpine` 或 `distroless/slim`，基础层从几百 MB 降到几 MB；语言运行时选官方 slim 变体（python:3.12-slim）。**多阶段构建**是最大杀器——编译期装全套工具链，运行期只拷贝**构建产物 + 运行时依赖**，gcc、node_modules 的 devDependencies 全部留在 builder 层。示例：',
            '```dockerfile\nFROM node:20-alpine AS builder\nWORKDIR /app\nCOPY package*.json ./\nRUN npm ci                       # 先拷清单再装依赖，命中层缓存\nCOPY . .\nRUN npm run build\n\nFROM node:20-alpine\nWORKDIR /app\nENV NODE_ENV=production\nCOPY --from=builder /app/dist ./dist\nCOPY --from=builder /app/node_modules ./node_modules\nUSER node                        # 不以 root 运行\nCMD ["node", "dist/main.js"]\n```',
            '**层缓存友好**：先 COPY 依赖清单（package.json/go.mod）再装依赖、后 COPY 源码——代码热改不触发依赖重装；**合并 RUN**（`apt-get update && apt-get install -y ... && rm -rf /var/lib/apt/lists/*` 同层清理，跨层清理无效——层是只读快照，删除只是覆盖标记）。',
            '**清理与瘦身细节**：`.dockerignore` 排除 .git、node_modules、日志（构建上下文小，构建才快）；不装推荐包（`--no-install-recommends`）；静态资源、字体、模型文件用对象存储 + 启动时拉取或直接 CDN 化，不塞进镜像。',
            '度量与纪律：`docker images` + `dive` 分析每层构成，找到“哪一层最大”再针对性砍；镜像优化不仅是省仓库空间——**拉取时间直接决定发布速度与弹性扩容速度**；同时保证“一次构建、多环境部署”：构建产物不可变，配置全部外置（环境变量/配置中心）。',
          ],
          followUps: [
            {
              question: '为什么 COPY package.json 要放在 COPY . . 之前？层缓存失效怎么传播？',
              points: [
                '缓存规则：**某层一旦失效，它之后的所有层全部重建**——把“经常变的源码”放在“很少变的依赖安装”之后，改代码时依赖层照常命中缓存，安装几分钟变秒级。',
                '细节决定成败：COPY 的缓存按**文件内容 hash** 判断；RUN 层按**指令字符串**判断（`npm install` 字符串不变就永远命中——哪怕 lock 文件变了，所以要 COPY lock 后用 `npm ci`）；这也是“依赖清单先行”写法成为标准的底层原因。',
              ],
            },
            {
              question: '镜像瘦身后，还能从“分发与启动”角度继续提速吗？',
              points: [
                '分发侧：**就近仓库/镜像加速 + P2P 分发**（如 Dragonfly）解决大规模并发拉取；**基础镜像统一精简**让所有业务镜像共享基础层，节点缓存复用率决定实际下载量。',
                '度量口径：盯**镜像体积、拉取耗时、Pod Ready 时间**三个数——目标是端到端交付最快而不是体积最小；有时粗一点的分层比极限压缩更有效，用数据说话。',
              ],
            },
          ],
        },
        {
          id: 'ops-cicd-k8s-service-ingress',
          title: 'K8s 的 Service 和 Ingress 有什么区别？liveness、readiness、startup 探针分别干什么？',
          difficulty: 'intermediate',
          tags: ['Kubernetes', 'Ingress', '健康检查'],
          points: [
            '分工：**Service 是四层（TCP/UDP）负载均衡**——给 Pod 组一个稳定 VIP；**Ingress 是七层（HTTP/HTTPS）路由**——按**域名/路径**把外部流量转发到不同 Service（`api.example.com/v1 → svc-a`，`web.example.com → svc-b`），并统一做 **TLS 终止**。Ingress 只是规则声明，需要 **Ingress Controller**（如 ingress-nginx）实际执行；对外暴露的主流方案就是 Ingress + LoadBalancer。',
            '**为什么不用 NodePort 暴露一切**：端口管理混乱、没有七层路由与统一证书管理；Ingress 是“统一入口 + 路由表”，配合外部 LB 只暴露 80/443。Headless Service（clusterIP: None）常被追问——不分配 VIP，DNS 直接解析出所有 Pod IP，供 StatefulSet/客户端自选节点。',
            '**探针三兄弟**：**liveness**——活不活着？失败则**重启容器**（防死锁假死）；**readiness**——能不能接流量？失败则**从 Service endpoints 摘除但不重启**（防把流量打进没就绪/过载的实例，滚动发布不 502 靠它）；**startup**——启动保护：慢启动应用（JVM 大堆、大模型加载）在 startup 探针通过前禁用另外两个，避免“启动慢被 liveness 误杀进入重启循环”。',
            '探针设计要点：liveness 检查项要**只反映进程健康**（比如本地 /healthz 不依赖下游），检查项过重会引发重启风暴；readiness 可以包含依赖检查（DB 可用）；**延迟启动期间靠 startup 而不是把 initialDelaySeconds 调到很大**。失败阈值、间隔、超时是调参三件套。',
            '衔接加分：graceful shutdown 配置（SIGTERM 后先从 endpoints 摘除再处理完存量请求，preStop sleep 几秒覆盖摘除传播延迟）——这是“滚动发布零 502”的完整答案。',
          ],
          followUps: [
            {
              question: '滚动发布偶发 502，把根因链完整讲一遍，再给出对应解法。',
              points: [
                '根因链三条：① 旧 Pod 收到 SIGTERM **立刻退出**，存量请求被掐断（没做 graceful shutdown）；② 新 Pod **没过 readiness 就进了 endpoints**（探针缺失或过松）；③ **endpoints 摘除有传播延迟**——Service 规则更新慢于 Pod 死亡，流量打进已死实例。',
                '解法一一对应：应用**处理完存量请求再退**（宽限期匹配）+ **preStop sleep 几秒**等摘除传播 + readiness 只在真正可服务时通过 + maxUnavailable 保守设置——四件事凑齐，滚动发布可以做到零 502。',
              ],
            },
            {
              question: 'liveness 探针配置过重会引发什么事故？安全的设计原则是什么？',
              points: [
                '典型事故：liveness 检查**依赖下游 DB**——DB 抖动导致全部实例 liveness 失败，**全量重启风暴**（重启还叠加预热），把下游抖动放大成全局雪崩；本质是把“依赖不健康”误判为“进程不健康”。',
                '原则：liveness **只反映进程自身健康**（本地无依赖检查）；依赖健康交给 readiness（摘流量不重启）；慢启动应用用 **startup 探针**兜住，而不是调大 liveness 的 initialDelay——职责分离是探针设计的核心。',
              ],
            },
          ],
        },
        {
          id: 'ops-k8s-resources',
          title: 'K8s 的 requests 和 limits 是什么？QoS 等级如何影响资源紧张时的驱逐顺序？',
          difficulty: 'intermediate',
          tags: ['Kubernetes', '资源管理', 'QoS'],
          points: [
            '两个语义先分清：**requests 是"调度承诺"**——Pod 声明需要的最低资源，**调度器按它算节点余量**（sum(requests) ≤ 节点可分配量），同时它是 cgroup 共享权重的依据；**limits 是"运行上限"**——CPU 超限被 **CFS 限流（throttle，进程被暂停等下一个周期）**，内存超限直接 **OOMKill**。关键字：**CPU 是可压缩资源（慢但不死），内存是不可压缩资源（超了就杀）**。',
            '**QoS 三级由 requests/limits 组合决定**：**Guaranteed**（每个容器 CPU 与内存都设了且 requests == limits）最高级；**Burstable**（设了但不相等，或部分没设）中间；**BestEffort**（啥都不设）最低。**节点资源紧张时的驱逐顺序从低到高**：BestEffort 先死，Burstable 按超用比例排，Guaranteed 最后——系统守护进程级别的保障来自这个排序。',
            '典型事故与配置纪律：**没设 limits 的服务**在突发流量时吃光节点内存，同节点的邻居被连坐 OOM（吵闹邻居问题）——所以**内存 limits 必须设**（不可压缩资源必须封顶）；**CPU limits 则有争议**——设了会在突发时被 CFS 节流造成延迟尖刺（P99 恶化），很多团队的做法是"内存设 limits，CPU 只设 requests 不设 limits"让 CPU 弹性共享。**requests 设多少**看真实水位（压测 P99 × 余量），虚高浪费资源费，虚低调度后被 OOM。',
            '体系化收束：requests/limits 是**资源管理的地基**，往上是 **LimitRange**（命名空间默认值与边界）、**ResourceQuota**（命名空间总额度，多团队共享集群的配额墙）、**HPA**（按 CPU/内存/自定义指标自动伸缩副本）、VPA（自动调 requests）——面试能把"容器 → 节点 → 命名空间 → 集群"四层资源治理串起来就是体系化答案。',
          ],
          followUps: [
            {
              question: 'Pod 频繁被 OOMKilled，你的排查路径是什么？',
              points: [
                '先分清两种 OOM：**超 limits 被杀**（exit code 137，OOMKilled）与**节点内存压力驱逐**（事件是 Evicted）——前者查应用，后者查节点与 QoS 等级。',
                '超 limits 的排查链：`kubectl describe pod` 看 last state 与重启次数 → 看**内存使用曲线 vs limits**（监控里 metrics-server/Prometheus 的 working set）是缓慢爬升（泄漏，见内存排查题的思路）还是尖刺超限（limit 设太低/突发批处理）→ 检查 JVM 类应用：**堆外内存**（元空间、DirectBuffer、glibc arena）常让"堆设对了还是被杀"——JDK 8u191+ / JDK 10+ 的容器感知（MaxRAMPercentage）要显式配置。',
                '根治动作：按**真实水位 + 安全余量（如 P99 × 1.3）**重设 requests/limits；泄漏型加内存只是续命，回代码侧定位；反复 OOM 的应用接 **NativeMemoryTracking**（JVM）或 pprof（Go）下钻。',
              ],
            },
          ],
        },
        {
          id: 'ops-cicd-pipeline',
          title: '一条合格的 CI/CD 流水线应该怎么设计？有哪些关键阶段和质量门禁？',
          difficulty: 'intermediate',
          tags: ['CI/CD', '流水线', 'DevOps'],
          points: [
            'CI 阶段（每次提交触发，分钟级反馈）：**代码检查**（lint、静态扫描）→ **编译/构建** → **单元测试 + 覆盖率** → **安全扫描**（依赖漏洞 SCA、镜像扫描 Trivy）→ **构建镜像**（提交即建镜像，tag 用 commit hash，**制品不可变**）。原则：**失败即停、快速反馈**，最贵的阶段放最后。',
            'CD 阶段（按环境递进）：自动部署 **dev → test/staging → 生产（需审批）**；部署前跑**接口自动化冒烟**，部署后跑**健康检查与冒烟**；staging 尽量与生产同构。**一次构建的制品贯穿所有环境**——禁止各环境重新构建（重新构建 = 不可复现）。',
            '质量门禁（Gate）：单测覆盖率低于阈值不合并；关键分支强制 Code Review + CI 绿；镜像扫描有高危漏洞拦截；生产发布需要审批人与发布单。门禁的价值是**把规范固化进流水线**，不依赖人的自觉。',
            '工程效率设计：依赖缓存（npm/maven 缓存层）、并行化（测试分片）、流水线即代码（Jenkinsfile/.gitlab-ci.yaml 进仓库、可评审）、制品库管理（Harbor/Nexus，版本可追溯：镜像 ← commit ← PR 一条线）。',
            '回答时体现权衡：流水线时长是**反馈速度与检查完备度**的权衡（>15 分钟开发就不愿小步提交）；CD 的自动化程度是**风险与效率**的权衡——核心服务可以“自动部署到预发 + 人工审批生产 + 自动化金丝雀”。',
          ],
          followUps: [
            {
              question: '流水线越跑越慢、影响小步提交，你会从哪些方向优化？',
              points: [
                '**并行与缓存**：无依赖阶段并行、测试按耗时均衡分片、依赖缓存（npm/maven/pip、Docker layer cache）、CI 资源规格与并发匹配——这些是分钟级的直接收益。',
                '**分层取舍**：提交流水线只跑 lint + 单测 + 编译（目标 10 分钟内），安全扫描、集成测试放合并前或 nightly；**增量思维**——变更影响分析决定跑哪些套件，而不是每次全量；慢的检查往后放，反馈快的留在最前。',
              ],
            },
            {
              question: '怎么保证“一次构建、处处一致”？从制品角度讲讲可追溯链。',
              points: [
                'CI 构建的镜像以 **commit hash tag** 推入制品库（Harbor），所有环境部署**引用同一个 digest**——digest 不可变、比可覆盖的 tag 可靠；禁止任何环境重新构建。',
                '追溯链要能一口气说出来：**线上镜像 digest ← 制品库 ← CI 构建 ← commit ← PR**——出问题分钟级定位代码版本；再配镜像签名与准入控制（cosign + K8s 准入策略），防未审计镜像进生产。',
              ],
            },
          ],
        },
        {
          id: 'ops-k8s-operator',
          title: 'K8s Operator 和 CRD 是什么？为什么说「一切皆 reconcile」？',
          difficulty: 'advanced',
          tags: ['Operator', 'CRD', '控制循环', 'Kubernetes'],
          points: [
            '**两个概念一句话**：**CRD（自定义资源定义）**让你向 K8s API 注册自己的资源类型（`MySQLCluster` 这样的对象，kubectl get 直接能看）；**Operator = CRD + 控制器**——一个死循环程序 watch 你的自定义资源，**不断把实际状态向声明里的期望状态拉齐（reconcile）**。K8s 本身的一切（Deployment 调 Pod 副本数、Node 控制器摘除坏节点）都是这个模式，Operator 把它开放成了**平台扩展的官方姿势**——把运维知识（怎么部署、扩容、备份、故障转移一个数据库/中间件）代码化成控制器。',
            '**reconcile 循环的正确写法（与写普通 Web 服务的思维差异）**：你的函数会被**随时、可能重复地**调用（水平触发的，不是事件只来一次）——所以必须**幂等**：不假设"上次跑到哪"，每次都从 API 读实际状态 → diff 期望 → 补差 → 更新 status；**不要在 reconcile 里做长操作**（超过阈值没返回会重入，你应该发起一个 Job 再返回，下轮 reconcile 检查 Job 结果）；**错误要区分**（可重试的错误返回 error 让 controller-runtime 退避重试，不可重试的要打事件让人看见）。',
            '**Day-2 运维是 Operator 的真正价值**：装个软件 Helm 就够（一次性渲染模板），Operator 管的是**生命周期**——扩缩容改 replicas 字段即生效、**故障转移**（主挂了自动提升从库 + 改服务指向）、**备份恢复**（CronJob 定期备份 + 声明 Restore 对象一键恢复）、版本升级（逐个滚动替换带检查点）；**与 Helm 的分工**：Helm 管"装"，Operator 管"活着的每一天"，两者常配合（Helm 装 Operator，Operator 管自定义资源）。',
            '**开发路径与选型**：kubebuilder / Operator SDK 生成脚手架（CRD 的 Go 类型 → OpenAPI schema → 深拷贝/informer 全套生成）；成熟度五级（ Helm → 基础安装 → 无缝升级 → 备份恢复 → 自动扩容 → 自动故障转移）用来评估**用别人的 Operator 还是自研**——数据库类优先用厂商/社区成熟 Operator（etcd/Prometheus/云数据库），业务特有编排才自写；**权限最小化**（RBAC 只给需要的资源操作）与 Webhook 校验（CRD 写错字段在准入时就拦）是生产必配。',
            '收束格局：Operator 的哲学是**声明式 API + 水平触发 + 收敛循环**——把"运维操作手册"变成"持续运行的纠偏程序"；这个模式已溢出 K8s（Argo CD 的 GitOps reconcile、控制平面设计的通用范式）——能说出「我在任何期望状态 vs 实际状态的场景都会想到 reconcile」，说明吃到精髓了。',
          ],
          followUps: [
            {
              question: 'reconcile 里发起的 Job 还没跑完，下一轮 reconcile 又被触发了，怎么办？',
              points: [
                '**用 status 字段做状态机而非内存状态**：第一次发现"该备份了"→ 创建 Job 并把 `status.backupJob = jobName` 写回 CR → 下一轮 reconcile 看到 status 里有 Job 就**查它状态**：Running 就直接 return（什么都不做等下轮）、Succeeded 就清理并记录时间、Failed 就按策略重试——**循环每轮都从零判断，status 是唯一记忆**。',
                '这正是"幂等 + 水平触发"的活用：不记住"我做过什么"，只比较"现在是什么、该是什么"；进阶细节：**OwnerReference** 让 Job 随 CR 删除自动清理、**finalizer** 处理删除前的清理（先把外部资源注销再允许删除）——这两个机制答出来，就是写过 Operator 的人。',
              ],
            },
          ],
        },
        {
          id: 'ops-cicd-release-strategies',
          title: '滚动、蓝绿、金丝雀发布各自的原理和优缺点？生产上怎么选？',
          difficulty: 'advanced',
          tags: ['发布策略', '金丝雀', '蓝绿部署'],
          points: [
            '**滚动发布（Rolling）**：分批替换旧实例（K8s Deployment 默认），资源省、流程简单；缺点：**新旧版本共存**（要求接口/数据结构向后兼容）、出问题影响已切流量的用户、回滚是反向滚动较慢、无流量比例控制。配合 maxSurge/maxUnavailable 与 readiness 探针可以做到基本平滑。',
            '**蓝绿发布（Blue-Green）**：两套完整环境，新版（绿）验证后**流量一次性切换**，蓝保留待命。优点：**切换与回滚都是秒级**（切回旧 LB 即可）、验证环境与线上一比一；缺点：**资源双倍成本**、数据库 schema 变更是坑（新旧代码要同时兼容两版 schema）、切流是“全量跳变”——问题也是全量暴露。',
            '**金丝雀发布（Canary）**：把**小比例真实流量**（1% → 10% → 50% → 100%）导到新版，观察**错误率、P99 延迟、业务指标**，达标才继续放量，异常自动回滚。优点：爆炸半径最小、可自动化的渐进式风险控制；缺点：需要**流量精确控制能力**（Istio/网关权重）+ **指标监控闭环**，基础设施成本高。K8s 原生做法是新旧 Deployment 副本数比例模拟，精确控流要上服务网格。',
            '共同的隐含要求（说出这层是高级感所在）：**API 与数据向后兼容**——新旧版本共存期间，读旧数据、写新字段都要兼容（数据库变更走 expand-contract：先加列兼容发布，回填数据，确认后再删旧列）；**发布 ≠ 部署**：用 feature flag 把“代码上线”与“功能开放”解耦，出问题关开关即可，不用回滚代码。',
            '选型话术：无状态普通业务 → **滚动 + 健康检查**足够；核心链路/大版本重构 → **金丝雀 + 指标自动分析**；需要秒级回滚能力且资源富余 → 蓝绿。答到“根据业务风险分级选策略，并把回滚演练当日常”即满分姿态。',
          ],
          followUps: [
            {
              question: '金丝雀发布的“自动回滚”具体怎么实现？',
              points: [
                '指标闭环：灰度期间持续对比**新旧版本的错误率、P99、核心业务指标**（Prometheus 查询 + 判定规则，或直接用 Argo Rollouts/Flagger 的 Analysis），任一指标越线**自动把流量权重切回旧版**并告警。',
                '实现要点：流量权重精确可控（网格/网关）是前提；判定窗口要**长于指标聚合延迟**（避免毛刺误杀）；回滚动作本身要**演练过**——自动回滚失败比没有回滚更可怕；成熟团队还会在放量节点保留人工确认作为双保险。',
              ],
            },
            {
              question: '数据库 schema 变更怎么和发布策略配合才不翻车？',
              points: [
                '**expand-contract 两阶段**：第一版发布只加不改（新列可空或带默认值），旧代码照常运行；灰度完成后**回填数据**；第二版发布切换读写，稳定后再删旧列——任何一步回滚都保持兼容。',
                '红线清单：schema 变更与代码发布**不同时上线**；大表 DDL 走 online DDL（gh-ost/pt-osc）防锁表；删字段前确认所有消费方（含离线任务/报表）已迁移——记住“**代码可以回滚，删掉的数据回不来**”。',
              ],
            },
          ],
        },
        {
          id: 'ops-cicd-pod-troubleshoot',
          title: 'Pod 起不来或一直重启（Pending / ImagePullBackOff / CrashLoopBackOff / OOMKilled），你的排查思路是什么？',
          difficulty: 'intermediate',
          tags: ['Kubernetes', '故障排查'],
          points: [
            '第一步永远是 `kubectl describe pod <name>` 看 **Events**——每种状态对应卡在不同环节：**Pending**（调度失败）、**ImagePullBackOff**（拉镜像失败）、**CrashLoopBackOff**（启动即退出）、**OOMKilled**（超内存限额被内核杀）、Running 但不接流量（探针失败）——先定位"卡在哪一环"，再按环下钻。',
            '**CrashLoopBackOff**：`kubectl logs --previous` 看上一次崩溃日志；高频根因——配置错误（环境变量/配置中心连不上）、依赖不可用（DB/注册中心）、应用启动即 fail、**探针配置不当**（慢启动应用没配 startup 探针被 liveness 误杀，重启循环）。',
            '**OOMKilled（退出码 137）**：limits < 真实内存峰值，JVM 场景堆外内存（DirectBuffer/元空间/线程栈）最常背锅；压测确认真实水位后再调 limits；反复 OOM 要区分容器级 OOM（cgroup）与节点级（dmesg）。',
            '**Pending**：describe 事件里看拒绝原因——`Insufficient cpu/memory`（节点资源不足，扩容或调 requests）、nodeSelector/亲和性不匹配、taint 未容忍、PVC Pending（查 StorageClass）；`kubectl top nodes` 验证资源余量。',
            '方法论收尾：排查链 = **调度 → 拉镜像 → 启动 → 探针**四环，Events 报错文本直接指向对应环节；沉淀成 runbook，并给 CrashLoopBackOff / ImagePullBackOff 配告警。',
          ],
          followUps: [
            {
              question: '怎么快速区分"应用自己崩"和"liveness 探针误杀"导致的重启循环？',
              points: [
                '看日志与退出码：应用崩溃有业务异常栈、退出码非 0；探针误杀则业务日志干净，describe Events 出现 "Killing container ... failed liveness probe"——证据在 kubelet 侧不在应用侧。',
                '验证与修复：临时放宽/摘掉 liveness 观察是否停止重启；正确解法是 **startup 探针保护慢启动**——误杀放大会把小抖动变成重启风暴。',
              ],
            },
            {
              question: '容器被 OOM 杀了，但 JVM 从没抛过 OutOfMemoryError，为什么？',
              points: [
                'JVM 的 OOM 只管**堆内**；堆外（DirectBuffer/Netty）、Metaspace、线程栈不受 -Xmx 约束，而容器 limits 按**整个进程 RSS** 算——堆内健康但 RSS 超 cgroup 上限，内核直接 OOM kill（137）。',
                '解法：容器化 JVM 用 `-XX:MaxRAMPercentage` 而非写死 -Xmx，给堆外留额度；开 NativeMemoryTracking 分析分布——"容器内存 = 堆 + 堆外 + Metaspace + 线程栈"一起算账。',
              ],
            },
          ],
        },

      ],
    },
    {
      id: 'ops-observability',
      name: '可观测性与 SRE 实践',
      description: 'Metrics/Logging/Tracing 三支柱的体系化建设、OpenTelemetry 统一埋点与 SLO 错误预算落地——从"能看监控"到"用数据管可靠性"。',
      references: [
        { label: 'Google SRE Books', url: 'https://sre.google/books/' },
        { label: 'Prometheus 官方文档', url: 'https://prometheus.io/docs/introduction/overview/' },
        { label: 'OpenTelemetry 官方文档', url: 'https://opentelemetry.io/docs/' },
        { label: 'Grafana Loki 官方文档', url: 'https://grafana.com/docs/loki/latest/' },
      ],
      questions: [
        {
          id: 'ops-obs-vs-monitoring',
          title: '监控和可观测性是一回事吗？新服务上线，第一步应该建哪些监控告警？',
          difficulty: 'intermediate',
          tags: ['可观测性', '监控', '告警'],
          points: [
            '概念区分（面试高频）：**监控**回答"**已知未知**"——针对预知的故障模式预建仪表盘与阈值告警（CPU 高、5xx 多）；**可观测性**回答"**未知未知**"——通过高基数、高维度的遥测数据（metrics/logs/traces），支持对**没预料到的问题**提出任意查询与探索。一句话：监控是"看着已知仪表盘"，可观测性是"有能力调查任何新问题"。',
            '新服务上线的最小起步（按序）：① **四个黄金信号**——延迟（分位数）、流量、错误率、饱和度（连接池/队列深度）；② **资源层**（CPU/内存/磁盘/网络）；③ **依赖健康**（DB 连接池、下游接口成功率）；④ **业务指标**（下单量、支付成功率）——技术指标全绿而业务指标异常是最常见的漏报场景。',
            '告警的最小纪律：每条告警必须**可行动**（收到知道干什么，否则删）；用"持续时长 + 阈值"而不是瞬时值（P99 > 500ms 持续 5 分钟）；**先建监控再放流量**——把可观测性当交付物的一部分，而不是上线后补的" nice to have"。',
          ],
          followUps: [
            {
              question: '"高基数、高维度"到底是什么意思？为什么监控做不到而可观测性做得到？',
              points: [
                '**高维度**：一条遥测数据带多个属性（user_id、region、endpoint、版本……），可以按任意组合切片；**高基数**：某个维度的取值几乎无限（每个 user_id 一个唯一标签）。传统指标监控（Prometheus 模式）对高基数支持有限——每个标签组合都是一条时间序列，组合爆炸会打爆存储。',
                '工程含义：错误日志 + trace 按具体用户/请求维度追溯（高基数是 tracing/logging 的强项），聚合趋势看 metrics——**三类数据各管一段**，这就是三支柱分工的底层原因。',
              ],
            },
          ],
        },
        {
          id: 'ops-cicd-monitoring',
          title: 'Prometheus + Grafana 的监控体系怎么搭建？应该监控哪些指标？',
          difficulty: 'advanced',
          tags: ['Prometheus', 'Grafana', '可观测性'],
          points: [
            '体系架构：**Prometheus 拉模型**——定时抓取各目标的 `/metrics` 端点（exporter 暴露：node_exporter 机器层、kube-state-metrics K8s 对象层、应用埋点用 client 库）；数据存 TSDB；**PromQL** 查询聚合；**Alertmanager** 负责告警的分组、去重、静默、路由（分级发到钉钉/飞书/PagerDuty）；**Grafana** 出大盘。长期存储与高可用用 Thanos/VictoriaMetrics。',
            '指标方法论（背熟两套就够）：**RED**（服务维度：Rate 请求量、Errors 错误率、Duration 耗时分位）+ **USE**（资源维度：Utilization 使用率、Saturation 饱和度、Errors 错误）；谷歌**四个黄金指标**：延迟、流量、错误、饱和度。应用内部再埋**业务指标**（下单成功率、支付回调延迟）——技术全绿业务挂掉是最痛的教训。',
            '告警质量是灵魂：告警必须**可行动**（收到后知道该干什么）、有**分级**（P0 电话叫醒、P1 群消息、P2 日报）、防**告警风暴**（依赖告警聚合：机房挂了只报一次根因）、基于**分位数与持续时长**（P99 > 500ms 持续 5 分钟）而不是瞬时毛刺。告警噪音太大等于没有监控。',
            '三大支柱关联：**Metrics**（Prometheus，知道出问题）+ **Logging**（ELK/Loki，知道为什么）+ **Tracing**（OpenTelemetry/Jaeger/SkyWalking，知道慢在哪一环）；三者用 traceId/requestId 串起来，从告警到根因的路径才是顺畅的。K8s 场景标配：Prometheus Operator + kube-prometheus-stack 一键部署。',
            '落地回答模板：先盘资源（CPU/内存/磁盘/网络）→ 再盘服务（QPS/错误率/P99）→ 再盘中间件（Redis 命中率、MQ 堆积、DB 连接池）→ 最后业务大盘；新服务上线前**先建监控告警再放流量**，把“可观测性”当交付物的一部分。',
          ],
          followUps: [
            {
              question: 'PromQL 里 rate 和 irate 有什么区别？为什么告警一般用 rate？',
              points: [
                '**irate** 只取区间内最后两个样本算瞬时增速，灵敏但毛刺大，适合看突发；**rate** 对整个区间求平均增速并做**外推与计数器重置补偿**，曲线平滑——告警要的是“持续趋势”而不是瞬时尖峰，所以用 rate。',
                '配套细节：counter 类型必须先 rate 再看（直接画原始值永远是单调上涨的线）；区间长度要 **≥ 2 倍抓取间隔**（15s 采集配 `rate(x[5m])`），否则算不出数据——新手告警“无数据”的第一原因就在这。',
              ],
            },
            {
              question: '告警老是半夜误报、团队开始免疫，怎么系统性治理？',
              points: [
                '**分级与降噪**：P0 只留“业务受损 + 需要人立即行动”的（电话），其余降级为工作消息；条件用**持续时长 + 分位数**（P99 > 500ms 持续 5 分钟）而非瞬时值；做**根因聚合**——DB 挂了只报 DB，不把它上游 20 个服务的报错各发一遍。',
                '闭环治理：每条告警必须**可行动**（附 runbook），“收到也不知道干嘛”的告警直接删；每月统计**告警到真实故障的命中率**，持续偏低的规则下线调优——告警质量和代码一样需要持续重构，免疫了的告警等于没有告警。',
              ],
            },
          ],
        },
        {
          id: 'ops-obs-logging',
          title: '日志体系怎么搭建？ELK 和 Loki 怎么选？日志规范与成本治理怎么做？',
          difficulty: 'advanced',
          tags: ['日志', 'ELK', 'Loki', '可观测性'],
          points: [
            '现代日志链路四段：**采集**（Filebeat/Fluent Bit/Vector，K8s 用 DaemonSet 收节点级 stdout 与文件日志）→ **传输缓冲**（Kafka 削峰，防日志洪峰打挂存储）→ **存储检索**（Elasticsearch/Loki）→ **展示告警**（Kibana/Grafana）。“应用直接写 ES”是反面教材——检索方抖动会反压业务方。',
            'ELK vs Loki 的本质差异：ELK 对**日志全文建倒排索引**，检索能力强大、生态成熟，代价是索引成本高（存储翻倍、写入重）；Loki 只索引**标签**（服务、实例、级别），日志体不建索引——成本便宜一个数量级、吞吐高，查询是“标签过滤后按时间暴力扫”，匹配“先定服务/时间段、再肉眼找”的真实排障路径。选型：复杂全文检索与存量生态选 ELK；云原生、成本敏感、Grafana 一体化选 Loki。',
            '日志规范是体系的根基（没有它，存储再好也是垃圾场）：**结构化 JSON 输出**，统一字段（时间戳、级别、服务名、实例、traceId）；**级别语义严格**——ERROR 必须值得被告警、WARN 需要人看、INFO 只描关键路径；**traceId 全链路贯穿**——没有它日志只是散落字符串，有了它才能与 Tracing、Metrics 串成排障路径。',
            '成本治理（高级感所在）：日志是“写得多、查得少”的数据——**分级保留**（ERROR 30 天、INFO 7 天、冷数据压对象存储）、健康检查与心跳日志不打、大字段截断、按服务的量基线配额；ES 场景配 ILM 索引生命周期。真实教训：**“日志存储比业务数据库还贵”不是段子，是没做治理的必然结果。**',
          ],
          followUps: [
            {
              question: '日志量突然暴涨、把存储打爆了，应急与根治分别怎么做？',
              points: [
                '应急三步：动态把最吵服务的日志级别降到 WARN、检索侧对非核心索引限流保命、扩容存储争取时间——先止血，避免日志存储雪崩连累整条排障链路。',
                '根治看根因：暴涨十有八九是**异常风暴**（每条请求打全栈异常）或 **Debug 级别误发布到生产**——配“日志量偏离基线”告警、发布流水线加日志配置检查，把日志洪峰当成一类正式故障对待。',
              ],
            },
            {
              question: 'ERROR 日志该不该直接触发告警？怎么避免告警风暴？',
              points: [
                '不能一刀切：正确姿势是基于**基线突增**告警（如 5 分钟错误量超基线 10 倍），单条 ERROR 静默落盘；循环重试场景一个根因能刷出海量 ERROR——按条告警等于告警洪水。',
                '降噪靠**指纹聚合**：对错误栈/错误码聚类，同指纹 1 万条收敛成 1 条告警并带计数；再靠 traceId 抽样看代表案例——告警的目的让人行动，不是让人麻木。',
              ],
            },
          ],
        },
        {
          id: 'ops-obs-otel',
          title: 'OpenTelemetry 是什么？它解决了可观测性的什么问题？',
          difficulty: 'advanced',
          tags: ['OpenTelemetry', '可观测性', '埋点'],
          points: [
            '是什么：CNCF 的**可观测性统一标准**，把 **traces/metrics/logs 三种信号**的 API、SDK、数据模型与传输协议（OTLP）统一到一套，由 OpenTracing 与 OpenCensus 合并而来——可观测性领域的“USB 接口”。',
            '解决的问题——**埋点与厂商解耦**：此前 Jaeger 一套 SDK、Prometheus 一套、换 APM 厂商就要全量改代码；OTel 让代码只面向 OTel API 编写，后端（Jaeger/Tempo/商业 APM）按配置切换——“**埋点一次，任意后端**”，锁定的风险从代码层挪到了配置层。',
            '架构三件套：**API**（Span/Meter/Logger 接口定义）→ **SDK**（采样、批处理、导出的实现）→ **Collector**（独立代理进程：接收遥测数据，做重试、脱敏、尾采样，再分发到多个后端）。业务服务只管把数据发给本机 Collector，后端切换与采样调整完全不动业务代码。',
            '自动插桩是普及关键：Java 用 `-javaagent` 零侵入注入、K8s 用 OpenTelemetry Operator 自动注入 SDK 与 sidecar——**存量服务不改一行代码就能出 trace**。落地建议：新服务直接用 OTel API 埋点，trace 优先（排障收益最高）；采样用“头部采样控成本 + 错误与慢请求 100% 保留”的组合。',
          ],
          followUps: [
            {
              question: '头部采样和尾部采样有什么区别？生产上怎么组合？',
              points: [
                '**头部采样**：请求入口处掷骰子决定记不记（如采 10%），实现简单、成本可控，但可能**恰好丢掉出问题的那次请求**；**尾部采样**：全量收集后在 Collector 按**结果**决策——错误请求、P99 慢请求、带特殊标记的请求 100% 保留，可观测价值最高，代价是全量传输成本。',
                '生产组合拳：常态流量头部采样 10% 控成本 + 尾部规则对 error/slow/关键业务全保；采样策略集中在 Collector 配置，业务无感知——“采样是成本与观测性的杠杆，策略要可运营而不是拍一次完事”。',
              ],
            },
            {
              question: '三支柱用同一个 traceId 串起来之后，一次真实排障的路径长什么样？',
              points: [
                '完整闭环：**Metrics 告警**（下单成功率突降）→ 按服务与时间窗过滤 **Tracing**，看到错误集中在“调库存服务的这一环”、P99 从 20ms 涨到 2s → 拿 traceId 去 **Logging** 精确翻出当时上下文（下游返回超时、重试耗尽）——从“发现问题”到“定位环节”再到“看到现场”，几分钟走完。',
                '反面对照：三套孤立系统里，同样的排障要分别在 Grafana、Jaeger、Kibana 里手工对时间戳，跨团队猜服务边界——可观测性的价值不是三个工具，是**数据互相关联**这件事本身。',
              ],
            },
          ],
        },
        {
          id: 'ops-obs-slo-budget',
          title: 'SLO 和错误预算怎么从“贴在墙上的数字”变成驱动决策的机制？',
          difficulty: 'advanced',
          tags: ['SLO', '错误预算', 'SRE'],
          points: [
            '概念链条一口气说清：**SLI**（对用户可测量的指标：下单成功率、P99 延迟）→ **SLO**（目标线：30 天滚动窗口成功率 ≥ 99.9%）→ **错误预算**（1 − SLO = 0.1%，即 30 天约 43 分钟的“可失败额度”）。SLA 是对外违约条款，SLO 是对内工程目标——**SLO 必须严于 SLA**，留出缓冲。',
            '核心理念：错误预算是**可靠性与迭代速度的兑换券**——预算充足就大胆发布，预算耗尽就踩刹车。它把“开发想多发、SRE 想稳住”的永恒矛盾，从会议室吵架变成看数字决策，这是 Google SRE 最核心的机制设计。',
            '落地四级响应：**预算充足**（剩余 > 50%）→ 正常迭代；**告急**（< 20%）→ 收紧发布门槛、减少非必要变更；**耗尽** → 冻结非修复类发布，可靠性改进优先，直到预算回补；配合**烧尽率告警**（如 1 小时烧掉 2% 预算）比月底统计更早发现问题。',
            '落地步骤与常见坑：SLI 从**用户旅程**定义（“用户能成功下单”，而不是 CPU 使用率）；初版 SLO 放宽松（99.5% 起步），跑一个月用真实数据校准再收紧；预算消耗大盘**公开透明**。反面清单：所有服务一刀切同一个 SLO、SLO 定在进程存活率上、只定目标不配预算机制——最后都沦为“贴在墙上的数字”。',
          ],
          followUps: [
            {
              question: '错误预算耗尽了，业务说“功能必须按时上”，怎么办？',
              points: [
                '这是**事先的机制问题**，不是临场的博弈问题：SLO 政策（含预算耗尽后的发布规则）要**提前由管理层签署**，例外流程也预先定义——业务负责人可以显式接受风险强行发布，但必须留痕（谁批准的、接受了什么风险）。机制的尊严来自事先约定，而不是事后翻脸。',
                'SRE 的正确姿态：提供带预算影响评估的选项（延后 / 灰度小流量 / 带兜底开关发布），决策权交给业务——和测试岗“风险清单 + 决策留痕”是同构的专业主义。',
              ],
            },
            {
              question: '多服务依赖的链路里 SLO 怎么定？下游故障算谁的错误预算？',
              points: [
                '面向用户旅程定**端到端 SLO**（下单成功率），各服务再分解自己的内部 SLO；计账规则：下游故障消耗的是**调用方的预算**——对用户而言没有“是下游的锅”这个选项。',
                '这个规则的深意：倒逼上游做**熔断、降级、冗余与依赖治理**，而不是把故障外包给下游；配套要求下游提供细粒度错误分类（自身错误 vs 透传上游），让预算消耗可归因——不然上游总在背锅，机制就失去公信力。',
              ],
            },
          ],
        },
        {
          id: 'ops-finops',
          title: '云成本治理（FinOps）怎么做？有哪些立竿见影的降本手段？',
          difficulty: 'advanced',
          tags: ['FinOps', '成本治理', '云计算'],
          points: [
            '定位先说清：FinOps 是**把云支出当工程问题与业务问题**，不是财务砍价；经典三阶段循环：**告知（可见性）→ 优化（动作）→ 运营（预算与问责）**。第一步永远是**分账可视化**——tag 规范是地基（没有按团队/服务/环境的分账就没有问责），看总额没用，要看**单位成本**（每千次请求成本、每 DAU 成本）——单位成本上升才说明效率在恶化，总额上涨可能只是业务增长（那该高兴）。',
            '**立竿见影四板斧（通常先省 10~30%）**：① **闲置清理**（没绑定负载均衡的弹性 IP、僵尸磁盘与快照、空转的 NAT 网关与测试环境——每家没治理过的公司都能扫出一堆）；② **right-sizing**（按 P95 而非峰值配资源，与 K8s requests/limits 题的"真实水位"方法论同源）；③ **存储分层**（生命周期策略热转冷、快照保留期复查——与日志成本治理同一思想）；④ **承诺折扣**（包年/节省计划/RI 覆盖稳定基线，Spot 扛可中断任务——CI 与大数据就是天然 Spot 场景）。',
            '**架构侧的省钱（第二曲线）**：弹性（HPA + 定时伸缩贴合峰谷曲线，大促扩平时缩）；**混部提密度**（把离线任务填进在线机器的谷段）；**流量拓扑**（跨区/出口流量费是隐形大户——CDN 回源链路、对象存储跨区复制要算账）；**按量 vs 包年的算术**：长期稳定负载包机/预留反而便宜，突发业务才适合按量——不是信仰题是数学题。',
            '**机制与文化（区分度所在）**：成本也有"监控"——预算 + 基线偏离告警（成本异常波动往往意味着故障或泄漏，比如死循环脚本拉起上千实例）；**成本进设计评审**（新方案必须回答单位成本与容量测算——与容量规划题衔接）；月度成本例会 + top 服务榜（点名找根因，不是罚款文化）。',
            '收束口径：FinOps 的成熟度标志是**工程师做资源决策时自带成本意识**（上线前算账），而不是月底财务追着砍；经验曲线："省 30% 靠治理，再省 30% 靠架构"——能把降本从"砍预算"讲成"提效率"，就是甲方想要的答案。',
          ],
          followUps: [
            {
              question: '老板要求整体降本 20% 且不能伤稳定性，你给出什么行动计划？',
              points: [
                '分阶段路线图（节奏感是评分点）：第 1~2 周分账盘点找 top5 支出 → 第 2~4 周**快赢**（闲置清理 + right-sizing，预期 10~20%）→ 同步锁定**承诺折扣**覆盖已验证的稳定基线 → 长期项（弹性、混部、架构优化）排季度路线。',
                '两条护栏：每一步用**单位成本与业务指标双验证**（降本后请求成本下降且 P99/错误率不劣化——证明没伤稳定性）；对"砍了会伤"的项（如安全与容灾冗余）明确列出并说明为什么不砍——**敢说"这几项不能动"比全盘照砍更显专业判断**。',
              ],
            },
            {
              question: 'Spot/抢占式实例中断业务怎么办？哪些负载适合？',
              points: [
                '**适合的负载天生可中断**：CI/CD（任务失败重跑）、批处理与大数据（Spark/Flink 配 checkpoint 断点续跑——与 Flink 题的容错衔接）、无状态 web 的突发扩容层；**不适合**：有状态核心服务、长连接网关、强 SLA 在线业务。',
                '工程化要点：**实例类型多元化**（单一型号被回收就大面积中断）；云的中断通知（一般提前 2 分钟）接到优雅排水流程（摘流量、落 checkpoint、换节点续跑）；把 Spot 当"波动供给"设计容量（基础容量按需/包年 + 峰值 Spot），而不是全押——供给波动本身就是这个折扣的价格。',
              ],
            },
          ],
        },
        {
          id: 'ops-obs-chaos',
          title: '混沌工程是什么？一次安全的故障演练怎么做？',
          difficulty: 'advanced',
          tags: ['混沌工程', '故障演练', '高可用'],
          points: [
            '**混沌工程的定位**：监控告诉你"出了事多快知道"，混沌工程回答"**坏事还没发生时，主动验证系统能不能扛住**"——在生产或准生产环境**受控注入故障**（杀 Pod、断网、延迟注入、磁盘打满、依赖宕机），观察系统表现是否符合预案（优雅降级、自动切换、熔断生效），把"我们认为它高可用"变成"**我们验证过它高可用**"。与测试的分工：测试验证**功能对不对**（确定性输入输出），混沌验证**未知的失效模式**（系统性涌现问题）。',
            '**价值来自真实事故**：Netflix 的 Chaos Monkey（随机杀实例，逼出"任何实例都可能死"的设计假设）——没有混沌演练的"高可用架构"常见翻车点：**哨兵/切换脚本从来没真跑过**（参数过期、权限丢失）、**备用机房容量是纸面的**（真切过去扛不住）、**降级开关从未打开过**（一打开发现降级逻辑也是坏的）、**重试风暴**（依赖恢复瞬间被重试流量二次打垮）。这些只能靠演练暴露。',
            '**安全演练的完整流程（必须讲纪律）**：① **假设定义**——明确"稳态假设"（如"杀掉 1/3 实例 P99 仍达标"）与中止条件（错误率超阈值立即停止）；② **影响面控制**——最小爆炸半径起步（先测试环境/单实例/低峰期，灰度放大），**演练对象可一键回滚**，通知相关方（避免当成真实故障误操作）；③ **执行观察**——不只看指标恢复，看**告警有没有响、值班响应流程走没走通**（演练是预案的全链路验收，包括人）；④ **复盘沉淀**——发现的每个失效模式转成改进项与新的自动化检查，演练结论归档。',
            '进阶与边界：**故障注入的平台化**（ChaosBlade/Chaos Mesh/Litmus，K8s 原生 CRD 定义实验）、**红蓝对抗式演练**（蓝队不知情的突发演练，验证的是组织响应）、**容量演练**（全链路压测是它的近亲，见后端容量规划题）。边界要主动说：**未做基础高可用的系统别玩混沌**（没有熔断/冗余的系统，注入就是纯事故）——混沌工程是验证韧性的工具，不是制造韧性的工具，这个判断本身就是高级答案。',
          ],
          followUps: [
            {
              question: '生产环境演练和测试环境演练的差别在哪？第一次上生产演练怎么设计？',
              points: [
                '差别的本质是**真实性与风险的同涨**：测试环境演练安全但验不出生产特有问题（数据量、流量模式、多租户、真实依赖链、配置差异）；生产演练才验真，但影响真实用户——所以核心不是"选哪边"而是**按成熟度递进**。',
                '第一次上生产的经典设计：**对内部服务/影子流量先做**（调用方少的边缘服务、可降级的读路径）、**选业务低峰 + 陪跑式执行**（SRE 全程盯盘、一键中止脚本就位）、从"杀一个无状态 Pod"这种**已经被 K8s 原生兜底**的故障开始（验证的是重启后服务是否真健康——探针、预热、连接池恢复），确认流程跑通后再进阶到网络延迟、依赖故障等更大爆炸半径。首秀目标是**验证演练机制本身**，而不是制造大新闻。',
              ],
            },
          ],
        },
      ],
    },
  ],
};
