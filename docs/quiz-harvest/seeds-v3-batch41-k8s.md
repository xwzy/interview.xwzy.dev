# 批 41 种子 · Kubernetes 入门实战 + 深入剖析

> 来源：课程 A《Kubernetes 入门实战课-罗剑锋》（38 篇）、课程 B《深入剖析 Kubernetes》（张磊，57 篇）。
> 查重基准：`src/data/ops.ts` 全文（35 题）+ `src/data/os.ts` 中 cgroup 相关题（grep namespace/cgroup）。
> 收割原则：命令操作丢弃、机制与设计思想保留；宁丢不重。

## 一、候选新题（现有题库未覆盖）

### S1. Pod 底层是怎么实现的？pause（Infra）容器为什么必须存在？
- 来源：课程 B 13《为什么我们需要Pod？》、34《Kubernetes网络模型与CNI网络插件》
- 核心素材：
  - Pod 只是**逻辑概念**：K8s 真正操作的仍是 Linux Namespace/Cgroups，不存在"Pod 边界"这种隔离实体；Pod = 一组**共享同一个 Network Namespace、可声明共享同一组 Volume** 的容器。
  - Infra 容器（pause）是 Pod 里**第一个被创建**的容器：用汇编写成的"永远暂停"容器，镜像解压后仅 100~200KB；它 **hold 住 Network Namespace**，其他用户容器通过 Join Network Namespace 的方式加入——所以一个 Pod 只有一个 IP，容器间 localhost 互通，**Pod 的生命周期与 Infra 容器一致**、与用户容器无关。
  - 为什么不用 `docker run --net=container` 拼：那会让容器 B 必须先于容器 A 启动，容器之间是**拓扑关系**而非对等关系；Infra 容器让 Pod 内所有容器**对等**。
  - 对 CNI 的意义：网络插件**只需要配置 Infra 容器（即 Pod）的 Network Namespace**，完全不必关心用户容器——这是 CNI 设计的支点（pause 的 rootfs 几乎是空的，任何要在用户容器里装包配网的方案都不可取）。
  - 底层动因是**容器的单进程模型**：容器 = 进程，PID=1 就是应用本身，不具备 init/systemd 的进程管理能力（exec 起的后台进程死了没人知道）——所以紧密协作的一组进程应表达为 Pod 内多容器。
  - **Pod 是原子调度单位**：调度器按 Pod 整体的资源需求计算，从机制上根治了 Swarm/Mesos 时代的成组调度难题（Swarm 的 affinity 会出现"两个容器调度成功、第三个放不下"的半成品；Mesos 用资源囤积损效率，Omega 乐观调度太复杂——Pod 直接绕开）。
- 建议追问：① 原理——Pod 里容器共享的是哪些资源（netns + Volume），还能共享什么（IPC/PID namespace 的 shareProcessNamespace 场景：进程信号、共享内存）；② 边界——PHP 应用和 MySQL 有访问关系，为什么不该放同一个 Pod（超亲密关系判断：直接文件交换、localhost/Socket 通信、频繁调用、共享 ns）；③ 权衡——"把虚拟机应用无缝迁进一个容器"为什么与容器本质相悖（虚拟机里是 systemd 管理的一组进程，正解是把虚拟机想成 Pod、进程拆成容器）。
- 建议难度：intermediate

### S2. sidecar 与 init 容器：K8s 的「容器设计模式」怎么落地？
- 来源：课程 B 13《为什么我们需要Pod？》（容器设计模式三例）；课程 A 12《Pod》
- 核心素材：
  - sidecar = 在 Pod 里启动**辅助容器**完成主容器之外的工作，靠 Pod 的两大共享机制（Network Namespace、Volume）组合。
  - 经典三例：① **WAR 包 + Tomcat**——init 容器只装 WAR 包，启动时 `cp` 到 emptyDir 后退出，Tomcat 主容器挂同一 Volume 到 webapps；发布物与运行时镜像彻底解耦；② **日志收集**——应用写 /var/log，sidecar 挂同一 Volume 转发到 ES；③ **服务网格代理**——Istio 的 Envoy sidecar 借共享 netns + iptables 接管 Pod 全部进出流量，用户无感。
  - **init 容器的语义**：比 spec.containers 先启动、**按定义顺序逐个执行、必须全部成功退出后用户容器才开始**——适合做前置检查/初始化（等依赖、迁数据、拷产物）。
  - 设计判断口诀：功能不相关的进程，优先考虑"一个 Pod 多个容器"而不是塞进一个镜像——松耦合、独立发版、独立资源限额。
  - 查重说明：ops-cicd-k8s-core 仅一句"sidecar 模式（日志收集、代理、init 容器）"带过，本题专门考模式与生命周期，收录时与该题分工：那题讲三对象协作，本题讲多容器协作设计。
- 建议追问：① 原理——init 容器和普通容器+启动脚本的差别（失败即阻塞启动、顺序保证、不占长期资源）；② 边界——sidecar 与主容器生命周期强绑定的缺陷（sidecar 先退会拖垮整个 Pod，K8s 1.28+ 原生 sidecar 用 init 容器 + restartPolicy: Always 解决）；③ 权衡——什么时候宁可拆两个 Pod（扩缩容节奏不同、故障域不同、资源画像不同）。
- 建议难度：intermediate

### S3. Deployment、ReplicaSet、Pod 为什么要分三层？滚动更新和回滚是怎么实现的？
- 来源：课程 B 16《谈谈"控制器"模型》、17《作业副本与水平扩展》
- 核心素材：
  - **Deployment 控制器操纵的是 ReplicaSet 而不是 Pod**；Pod 的 ownerReference 指向 ReplicaSet——"层层控制"：RS 保证 Pod 个数恒等 replicas，Deployment 再通过控制 RS 的个数与属性实现扩缩与滚动更新。
  - 控制循环（reconcile）伪代码三步：取实际状态（etcd/心跳）→ 对照期望状态（spec）→ diff 后执行编排写操作；K8s 一切控制器皆此模式。
  - **版本机制**：Pod 模板变化即新版本，RS 名字里带 pod-template-hash 区分；滚动更新 = 新版 RS 逐步扩、旧版 RS 逐步缩；`kubectl rollout undo` 回滚的本质是**把旧 RS 的副本数扩回来**（历史 RS 按 revisionHistoryLimit 保留）。
  - Deployment 的 AVAILABLE 状态要求 Pod 同时是"最新版本 + Ready"；restartPolicy=Always 是 Deployment 的隐含前提——容器自己保活，RS 调整个数才有意义。
  - 查重说明：ops-k8s-operator 已深讲 reconcile 写法与 Operator，本题只讲**原生控制器的分层设计与版本机制**，不重复收 reconcile 幂等素材。
- 建议追问：① 原理——控制循环和事件驱动的区别（水平触发：事件丢失/乱序都能被下一轮循环收敛，这是 K8s 弃"命令式回调"选循环的根本原因）；② 边界——直接改 RS 的 replicas 会怎样（被 Deployment 调回，owner 语义）；③ 权衡——为什么滚动更新要求接口向后兼容（新旧 RS 的 Pod 同时对外服务）。
- 建议难度：intermediate

### S4. StatefulSet 怎么同时保证「稳定网络标识」「有序部署」和「存储绑定」？
- 来源：课程 B 18《StatefulSet（一）拓扑状态》、19《（二）存储状态》、21 开头
- 核心素材：
  - 有状态应用的两类状态抽象：**拓扑状态**（实例不对等——主从/主备，启动有顺序）+ **存储状态**（实例与数据绑定，重建后还得读到同一份数据）。
  - **稳定标识三板斧**：① Pod 名带编号 `<name>-<ordinal>`（web-0/web-1），hostname 与 Pod 名一致；② 严格按编号顺序创建——web-0 未 Ready 前 web-1 一直 Pending；③ 配合 Headless Service（clusterIP: None）给每个 Pod 生成固定 DNS 记录 `<pod-name>.<svc-name>.<ns>.svc.cluster.local`——**网络身份不变、IP 可变**，所以访问必须走 DNS 不能记 IP。
  - **存储状态**：volumeClaimTemplates 为每个 Pod 生成同编号 PVC（www-web-0）；删 Pod 后 **PVC/PV 不删**，重建的同名 Pod 按名字找回旧 PVC，重新挂上原 PV、数据原样恢复。
  - StatefulSet 的滚动更新**按编号倒序**逐个更新；`updateStrategy.rollingUpdate.partition` 实现原生金丝雀——只有序号 ≥ partition 的 Pod 被更新，序号更小的删除重建后仍保持旧版本。
- 建议追问：① 原理——为什么有状态应用不能用 Deployment（Pod 完全对等、无序、无稳定身份、无专属存储）；② 边界——Headless Service 不分配 VIP，DNS 直接解析出全部 Pod IP，适合客户端自选节点；③ 权衡——"重建节点可从主库同步数据"的集群还要不要 PV 一对一绑定（关键看恢复是否依赖本地原数据，按项目而异）。
- 建议难度：advanced

### S5. kube-proxy 是怎么实现 Service 转发的？iptables 与 IPVS 模式的本质区别？
- 来源：课程 B 37《Service、DNS与服务发现》
- 核心素材：
  - **Endpoints 的准入条件**：selector 选中 + Running + readinessProbe 通过；Pod 异常时自动从 Endpoints 摘除——endpoints 由 kube-proxy 监听事件动态维护。
  - **iptables 模式**：Service VIP 只是 iptables 规则里的配置，**没有对应网络设备，所以 ping 不通 ClusterIP**；KUBE-SVC 链用 `statistic --mode random --probability` 随机分流，且 probability 必须递减（1/3、1/2、1）才能等概率（逐条匹配语义）；最终由 KUBE-SEP 链做 **DNAT** 改写目的地址到 Pod IP:Port。
  - **iptables 模式的瓶颈**：规则数 O(Pod 数) 线性增长 + kube-proxy 控制循环不断刷新，大规模下 CPU 空转甚至"卡住"——曾是 K8s 承载规模的头号障碍。
  - **IPVS 模式**：kube-proxy 创建 kube-ipvs0 虚拟网卡挂 VIP，用内核 IPVS 模块建虚拟主机做负载均衡（rr 等多种调度算法）——规则处理下沉内核态、代价与 Pod 数解耦；但包过滤/SNAT 等辅助动作仍靠 iptables（这些规则数不随 Pod 增长）。大集群建议 `--proxy-mode=ipvs`。
  - DNS 侧：ClusterIP Service 的 A 记录解析到 VIP；Headless Service 同名 A 记录解析出**所有后端 Pod IP 集合**。
- 建议追问：① 原理——为什么 ping 不通 Service IP（规则非设备）；② 边界——iptables 三条 probability 都写成 1/3 会怎样（递减失效、流量偏斜——可算概率）；③ 权衡——大规模集群为什么 IPVS 赢（内核态哈希表 vs 用户态逐条匹配，"重要操作放内核态"是通用性能原则）。
- 建议难度：advanced

### S6. Flannel 的 UDP、VXLAN、host-gw 三种后端怎么工作？性能差在哪？
- 来源：课程 B 33《深入解析容器跨主机网络》、35《解读Kubernetes三层网络方案》
- 核心素材：
  - 公共背景：容器 IP 包经 docker0/cni0 出现在宿主机后，由路由表决定进哪个"跨主设备"；flanneld 在 etcd 里维护**子网 ↔ 宿主机 IP** 映射（每台宿主机分一个 /24 子网）。
  - **UDP 模式（已弃用，教学价值最高）**：TUN 设备 flannel0，IP 包要在"内核→用户态 flanneld→内核"**来回三次拷贝**、封装解封装全在用户态——性能最差；由此得出系统编程原则：**减少态切换、核心逻辑放内核态**。
  - **VXLAN 模式（主流）**：VTEP 设备 flannel.1（VNI 默认 1），封装解封装全在内核；flanneld 维护三张表——**路由表**（目的子网→对端 VTEP IP）、**ARP 表**（对端 VTEP IP→MAC）、**FDB 表**（对端 VTEP MAC→宿主机 IP）；封包链条：原始 IP 包→加二层头成"内部数据帧"→加 VXLAN 头（VNI）→套 UDP→宿主机网络传输，对端按 VNI 逐层解包。
  - **host-gw 模式**：把每个远端子网路由的**下一跳直接设为目的宿主机 IP**（host 当 gateway），无封装开销；出帧时用下一跳的 MAC 作目的 MAC，所以**要求宿主机二层连通**（跨 VLAN 即失效）；实测性能损失约 10%，VXLAN 类隧道约 20%~30%。
- 建议追问：① 原理——UDP 模式为什么慢（三次态切换+用户态封包）；② 边界——host-gw 跨子网怎么办（需三层转发或退回 IPIP/VXLAN 隧道）；③ 权衡——Overlay（不依赖底层、MTU 损耗）vs 路由（性能好、要求网络配合）的选型逻辑，与 ops-k8s-cni 的结论层衔接。
- 建议难度：advanced

### S7. Calico 的架构是什么？BGP 和 Route Reflector 解决什么问题？
- 来源：课程 B 35《解读Kubernetes三层网络方案》
- 核心素材：
  - 路由规则与 host-gw **同型**：`<目的容器网段> via <目的宿主机IP>`；差别在于路由信息的分发方式——Calico 用 **BGP**（边界网关协议：Linux 内核原生支持、为大规模"自治系统"间共享路由设计的无中心协议）取代 flanneld+etcd 的集中式维护。
  - **三组件**：CNI 插件（对接 K8s）、**Felix**（DaemonSet，把路由写入内核 FIB、维护网络设备）、**BIRD**（BGP Client，在集群内分发路由）；每个节点视作一台边界路由器（BGP Peer）。
  - **不用网桥**：每个容器一根 veth（cali 前缀）+ 一条 `/32` 主机路由直接指到设备——路由条目比 Flannel 多得多。
  - **规模问题**：默认 Node-to-Node Mesh 全互联，BGP 连接数 O(N²)，建议 **<100 节点**；更大规模用 **Route Reflector**——指定少数节点集中学习/分发全局路由，连接数降到 N。
  - **跨子网兜底**：宿主机二层不通时开 **IPIP 模式**（tunl0 设备，IP 包套 IP 包），性能与 VXLAN 相当；公有云网关不可控（无法把云上路由器加入 BGP mesh），所以云上要么接受 IPIP，要么用 Flannel host-gw/Overlay；私有数据中心可把宿主机网关配置为 BGP Peer（Dynamic Neighbors 或 Route Reflector 兼任）彻底避免隧道。
- 建议追问：① 原理——BGP 一句话（大规模网络中节点间路由信息共享协议）与"下一跳"语义；② 边界——Mesh 为什么 O(N²) 不可扩展；③ 权衡——公有云 vs 自建机房的网络方案选择（底层网络话语权决定选型）。
- 建议难度：advanced

### S8. K8s 调度器是怎么为一个 Pod 选出节点的？（Predicates 过滤 + Priorities 打分）
- 来源：课程 B 41《十字路口上的默认调度器》、42《调度策略解析》
- 核心素材：
  - **两个独立控制循环**：Informer Path（Watch Pod/Node 变化，把待调度 Pod 放进**优先级调度队列**、持续更新 scheduler cache）+ Scheduling Path（出队→过滤→打分→绑定）。
  - **Predicates（Filter，筛出可行节点）四大类**：GeneralPredicates（资源/端口冲突/主机名/nodeSelector）；Volume 类（NoDiskConflict、MaxPDVolumeCount、VolumeZone、**VolumeBinding——Local PV 的 nodeAffinity 在这一步就决定 Pod 必须去某个节点**）；宿主机类（**Taint/Toleration**、内存压力）；Pod 间类（Affinity/AntiAffinity，**topologyKey 决定作用域**）。执行时 16 个 goroutine 并发对所有节点计算，且有固定检查顺序（便宜的放前面）。
  - **Priorities（打分 0~10，最高分胜出）**：LeastRequestedPriority（空闲 CPU/内存最多的节点）、BalancedResourceAllocation（CPU/内存/卷使用率方差最小，防"CPU 被分光、内存大量剩余"）、ImageLocalityPriority（大镜像已存在的节点加分，且按镜像分布对冲调度堆叠）。
  - **性能三板斧**：集群信息全量 Cache 化；**Assume 乐观绑定**（先改本地 cache、再异步向 APIServer 真正 Bind——不在关键路径上做远程调用）；无锁化（只对队列和 cache 加锁，算法路径无锁）。kubelet 收到 Pod 后用 GeneralPredicates 做 **Admit 二次确认**，兜住乐观假设的漏洞。
- 建议追问：① 原理——PodFitsResources 按什么算（requests 而非 limits，与 ops-k8s-resources 衔接）；② 边界——怎么让 Pod 尽量分散（podAntiAffinity + topologyKey=hostname、调整打分权重）；③ 权衡——为什么要 kubelet 二次确认（调度与实际运行之间有时间差，资源可能已被占）。
- 建议难度：advanced

### S9. 节点污点（Taint）与容忍（Toleration）是什么？实际运维怎么用？
- 来源：课程 B 42（PodToleratesNodeTaints）、21《DaemonSet》；课程 A 19《DaemonSet》
- 核心素材：
  - 污点打在 **Node** 上、容忍写在 **Pod** 上；调度器的 PodToleratesNodeTaints 规则过滤不相容节点——Pod 侧没有对应容忍就进不去。
  - 三种 effect：**NoSchedule**（只拦新调度）、**PreferNoSchedule**（尽量不调度）、**NoExecute**（拦新调度 + **驱逐已在运行**的 Pod）。
  - 经典用途：master 默认打 `node-role.kubernetes.io/master:NoSchedule` 隔离控制面；**DaemonSet 模板自带对 master 污点的容忍**以覆盖全节点；GPU 等专用节点打污点只放行指定业务。
  - DaemonSet 的实现特殊性：它**不走调度器**——控制器直接给 Daemon Pod 写入 nodeAffinity 来落节点，所以新节点一加入 Pod 就自动创建（哪怕节点 NotReady 也能先起网络/存储 Agent——这正是 DaemonSet 运行时机常常早于集群可用的原因）。
- 建议追问：① 原理——Taint 在调度流程的哪一步生效（Predicates 宿主机类规则）；② 边界——Pod Pending 且 Events 出现 taint 相关信息怎么排（对照 tolerations，衔接 ops-cicd-pod-troubleshoot）；③ 权衡——NoExecute 驱逐与节点故障处理的配合（给关键组件留容忍窗口）。
- 建议难度：intermediate

### S10. K8s 的 RBAC 四种对象是什么？怎么给 Pod 里的程序授权？
- 来源：课程 B 26《基于角色的权限控制：RBAC》
- 核心素材：
  - **四种对象**：Role（Namespace 内的权限规则：apiGroups/resources/verbs）、RoleBinding（subject 与 Role 绑定）、ClusterRole/ClusterRoleBinding（集群级——作用于非 namespaced 对象如 Node，或跨全部 Namespace）。RoleBinding 只能引用同 ns 的 Role，但可以引用 ClusterRole。
  - 规则粒度：verbs 全集 get/list/watch/create/update/patch/delete；`resourceNames` 可细到**具体某个对象**（只许 get 名叫 my-config 的 ConfigMap）。
  - **ServiceAccount 是最常用的被作用者**（User 只是授权系统的逻辑概念，需外部认证提供）：SA 对应内置用户名 `system:serviceaccount:<ns>:<name>`、内置用户组 `system:serviceaccounts:<ns>`；SA 创建时自动生成 `kubernetes.io/service-account-token` 类型 Secret（Token），Pod 声明 serviceAccountName 后自动挂载到 `/var/run/secrets/kubernetes.io/serviceaccount`（ca.crt/namespace/token），容器内程序据此访问 APIServer。
  - **风险点**：Pod 不声明 SA 时用 default SA，而 default 未绑任何 Role、反而权限很大——生产应给所有 ns 的 default SA 绑只读 Role；内置四个预设 ClusterRole：cluster-admin（verbs=\*，慎用）/admin/edit/view；`system:` 开头的 ClusterRole 是给系统组件用的。
- 建议追问：① 原理——为什么所有组件都经 APIServer 做授权（etcd 不直接暴露，唯一入口统一鉴权）；② 边界——Namespace 是不是安全隔离（**否，仅逻辑隔离，K8s 只有 soft multi-tenancy**——这也是 RBAC 存在的意义）；③ 权衡——CI/CD 流水线怎么授权（专用 SA + 最小 verbs，不做 cluster-admin）。
- 建议难度：intermediate

### S11. 什么是声明式 API？「list-watch」机制在 K8s 架构里扮演什么角色？
- 来源：课程 B 23《声明式API与编程范式》、09《Kubernetes的本质》、41；课程 A 10《Kubernetes工作机制》
- 核心素材：
  - **命令式 vs 声明式的分水岭是 kubectl apply**：create/replace 是"一次处理一个写请求"的命令式配置文件操作；apply 是对 API 对象的 **PATCH**——APIServer 可同时处理多个写操作并具备**合并（Merge）能力**。
  - 声明式三要素：① 提交定义好的 API 对象声明期望状态；② 允许多个写端以 PATCH 修改、不依赖本地原始 YAML；③ 基于对 API 对象的增删改查**自动完成实际状态向期望状态的调谐**。
  - **架构支撑**：APIServer 是唯一入口（认证/授权后读写 etcd），**etcd 只与 APIServer 直接通信**，scheduler/controller-manager/kubelet 全部经 APIServer 取数——这是组件解耦与统一鉴权的关键设计。
  - **list-watch**：各组件用 Informer 对感兴趣的对象 List 全量 + Watch 增量，同步进本地 cache 后做决策（调度器的 Informer Path、各控制器、kubelet 同构）——配合"水平触发"的控制循环，错过事件也能靠下一轮 reconcile 补偿。
  - **落地案例**：Istio 用 Dynamic Admission Control（Initializer/热插拔 Admission）+ TwoWayMergePatch，在用户 Pod 提交时**自动注入 Envoy sidecar**——声明式 API 是"给平台写扩展"的基石；Istio 部署后会在 K8s 里创建约 43 个 API 对象，是声明式生态的集大成者。
- 建议追问：① 原理——为什么 watch 断线不出错（Informer 重新 List 全量对齐）；② 边界——apply 和 replace 的冲突差异（merge 可多写端共存）；③ 权衡——命令式一步步写脚本 vs 声明式管"终态"的工程收益（幂等、可 GitOps、可审计）。
- 建议难度：advanced

### S12. Pod 的优先级与抢占（Preemption）机制是怎么设计的？
- 来源：课程 B 43《默认调度器的优先级与抢占机制》
- 核心素材：
  - 解决的问题：**高优先级 Pod 调度失败时**不进"搁置"状态，而是挤走节点上的低优先级 Pod 保自己上位（Borg/Mesos 均有此机制）。
  - **PriorityClass**：value 为 32bit 整数、**上限 10 亿**，超过 10 亿保留给系统 Pod（保证系统组件永不被用户抢占）；globalDefault 设默认值；Pod 用 priorityClassName 引用。
  - 调度队列是**优先级队列**（activeQ + unschedulableQ）：高优先级先出队；调度失败进 unschedulableQ，Pod 更新或集群变化后被移回 activeQ"重新做人"。
  - **抢占流程**：失败事件触发寻牺牲者→先判断抢占是否可能（PodFitsHost 类失败抢占无解）→复制 scheduler cache **模拟抢占**（从节点上最低优先级 Pod 逐个"删除"直到放得下）→在所有方案里选**系统影响最小**的（牺牲者越少越好、优先级越低越好）→真正执行只做三件事：清理牺牲者的 nominatedNodeName、把抢占者的 nominatedNodeName 指向目标节点、异步删牺牲者。
  - **两个精妙设计**：抢占者**不直接绑定**被抢占节点，回队列下一周期重新调度——因为牺牲者有默认 30s 优雅退出期，期间集群可调度性会变化；对含"潜在抢占者"的节点要把 Predicates **跑两遍**（假设抢占者已在场一遍 + 正常一遍），原因是 InterPodAntiAffinity 需要考虑抢占者占位。
- 建议追问：① 原理——为什么抢占后不立即绑定（优雅退出期的可调度性变化 + 允许更高优先级插队）；② 边界——哪些调度失败抢占救不了（nodeSelector 指定主机名类）；③ 权衡——优先级体系与 QoS 体系是两套账（抢占看 PriorityClass，驱逐看 QoS），别混为一谈。
- 建议难度：advanced

## 二、既有题增强素材（ops.ts 对应题）

### E1. 目标题目：ops-cicd-k8s-core（K8s 的 Pod、Deployment、Service 分别是什么？它们怎么协作？）
- 追问素材：为什么 K8s 需要 Pod 而不是直接编排容器？——要点：容器单进程模型（PID=1 管不了其他进程）+ 成组调度难题（Swarm affinity 的半成品调度、Mesos 资源囤积损效率、Omega 乐观调度太复杂，Pod 用"原子调度单位"根治）；kubelet 经 CRI 对接容器运行时、经 CNI/CSI 配网挂存储的插件分层（K8s 不绑定 Docker）。
- 追问素材：label/selector 在协作链路里怎么承重？——要点：Deployment→RS→Pod 靠模板与 ownerReference；Service→Pod 靠 selector 出 endpoints；Job 用 controller-uid 自动 Label 防止不同 Job 的 Pod 重合。

### E2. 目标题目：ops-k8s-operator（Operator 和 CRD 是什么？为什么说「一切皆 reconcile」？）
- 追问素材：控制器模式与事件驱动的区别是什么？——要点：控制循环是**水平触发（level-triggered）**：任何时刻只比较"期望 vs 实际"，事件丢失、乱序、组件重启都不影响最终收敛；事件驱动是边缘触发，错过即永久丢失——这是 K8s 可靠性的根基，也是 Operator 必须幂等的原因的更深层解释。
- 追问素材：ownerReference 与级联删除怎么用？——要点：Pod 的 owner 是 ReplicaSet 而非 Deployment（层层控制）；删除 Deployment 连带回收 RS 与 Pod；Operator 里给自建资源挂 OwnerReference 让垃圾回收自动清理（与已有 finalizer 素材互补）。

### E3. 目标题目：ops-cicd-k8s-service-ingress（Service 和 Ingress 的区别？三个探针分别干什么？）
- 追问素材：Ingress Controller 内部是怎么工作的？——要点：它本身是一个**监听 Ingress/Service/Endpoints 变化的控制器**，把规则渲染成 Nginx 配置启动；被代理 Service 的 endpoints 变化通过 **Nginx Lua 动态更新 upstream、无需 reload**（只有 Ingress 规则本身变化才重新生成配置）；ConfigMap 可定制 nginx.conf；未命中规则走 default-backend 可自定义 404；bare-metal 环境用 NodePort Service 暴露入口、云上用 LoadBalancer。
- 追问素材："Service 的 endpoints 是怎么来的？"——要点：selector 选中 + Running + readiness 通过三条件，动态增删（与探针题的 readiness 语义互为印证）。

### E4. 目标题目：ops-k8s-storage（PV、PVC、StorageClass 和 CSI 是什么关系？）
- 追问素材：PVC/PV 的设计除了"解耦"还防了什么？——要点：**接口/实现思想**防信息过度暴露——直接在 Pod 里写 Ceph RBD 的 monitors 地址、用户名、keyring 路径等于把基础设施秘密发给全公司开发者；职责分离还让事故定责更清晰。
- 追问素材：Local PV（本地盘）为什么调度起来更麻烦？——要点：Local PV 必须用 nodeAffinity 与具体节点绑定，调度器必须在 Predicates 阶段先检查 PV 的 nodeAffinity（VolumeBinding 规则），PVC 未绑定时还要预判"有哪些可绑的 PV 在哪个节点"——先算卷再选点，否则卷与 Pod 不同节点就废了。

### E5. 目标题目：ops-k8s-cni（Pod 之间怎么通信？CNI 和 NetworkPolicy 各解决什么问题？）
- 追问素材：CNI 插件被调用的完整流程是什么？——要点：插件二进制放宿主机 `/opt/cni/bin`，分三类——**Main 插件**（bridge/ptp/loopback 等创建具体网络设备）、**IPAM 插件**（host-local/dhcp 分配 IP）、**社区内置插件**（flannel/portmap 端口映射/bandwidth 限流）；K8s 用独立 **cni0 网桥**替代 docker0（不采用 Docker 的 CNM 模型，docker run 起的容器仍挂 docker0）；Pod 第一步创建 Infra 容器，CNI 对它的 netns 配网。
- 追问素材：Flannel VXLAN 在 K8s 里具体要维护哪些状态？——要点：路由表/ARP 表/FDB 表三件套由 flanneld 维护（细节见种子 S6，可作该题跨主机追问的素材池）。

### E6. 目标题目：ops-cicd-pod-troubleshoot（Pod 起不来或一直重启，排查思路是什么？）
- 追问素材：Job 的重试和容器重启循环怎么区分？——要点：Job Controller 的失败重试按 **backoffLimit**（默认 6）且间隔指数增长（10s/20s/40s…），Pod 换新不改写 restarts 计数；kubelet 的容器重启才是 RESTARTS 数字增长；`activeDeadlineSeconds` 超时后全部 Pod 以 DeadlineExceeded 终止——"谁的循环在重试"是定位第一问。
- 追问素材：滚动更新引发的 Pod 异常怎么快速止损？——要点：`kubectl rollout undo` 秒级回滚（旧 ReplicaSet 还在），先回滚再查根因。

### E7. 目标题目：ops-k8s-resources（requests 和 limits 是什么？QoS 如何影响驱逐顺序？）
- 追问素材：调度器算资源时看的是哪个字段？——要点：PodFitsResources 只看 **requests**（sum(requests) ≤ 节点可分配量），limits 不参与调度决策；GPU 等硬件用 **Extended Resource**（key-value，如 alpha.kubernetes.io/nvidia-gpu: 2）声明，调度器不认识 key 只算 value，数值由 Device Plugin 上报。
- 追问素材：QoS 和优先级（PriorityClass）是一回事吗？——要点：不是——**QoS（Guaranteed/Burstable/BestEffort）决定节点资源压力下的驱逐顺序；PriorityClass 决定调度优先与抢占牺牲者选择**，两套体系可组合。

### E8. 目标题目：ops-cicd-release-strategies（滚动、蓝绿、金丝雀发布怎么选？）
- 追问素材：K8s 原生有哪些"渐进式发布"旋钮？——要点：Pod 模板的 hash 即版本号（template 任何字段变化都生成新版本 RS）；`minReadySeconds` 控制新 Pod 就绪确认等待（不属于模板、不影响版本 hash）；StatefulSet 的 `partition` 是**原生金丝雀**（只有序号 ≥ partition 的 Pod 被更新）；`kubectl apply` 的声明式 PATCH 触发滚动更新，replace 不具备合并能力。
- 追问素材：为什么 StatefulSet 滚动更新天然比 Deployment 可控？——要点：按编号倒序逐个更新、出错即停、可 partition 灰度——有序性换来了发布粒度控制。

### E9. 目标题目：ops-obs-monitoring（Prometheus + Grafana 监控体系怎么搭建？）
- 追问素材：K8s 里监控数据的采集链路是什么？——要点：**Metrics Server**（kubelet 内 cAdvisor 汇集容器指标，内存中短周期保存，供 HPA 与 kubectl top）与 **Prometheus**（拉取 /metrics、存 TSDB、可查历史）分工；kube-state-metrics 把 API 对象状态（Deployment 副本、Pod 状态）转成指标。
- 追问素材：节点级日志采集为什么用 DaemonSet？——要点：fluentd/filebeat 以 DaemonSet 运行、hostPath 挂载 /var/log 与容器日志目录，新节点自动覆盖——DaemonSet"每节点恰好一个"的语义正是为 Agent 类负载设计的。

### E10. 目标题目：ops-cicd-container-vs-vm（容器和虚拟机的区别？Docker 靠什么实现隔离？）
- 追问素材：虚拟机里的应用怎么迁移到容器/K8s 才是正解？——要点：虚拟机里是 systemd/supervisord 管理的**一组进程**，"塞进一个容器"与容器单进程本质相悖；正确姿势：把虚拟机想象成 **Pod**、进程分别做成容器、有顺序依赖的定义为 **init 容器**（Swarm 败于无法表达这种关系）；Pod 提供的是编排思想而非具体技术（甚至可用虚拟机实现 Pod，如 virtlet）。

## 三、主动丢弃

- **kubectl/minikube/kubeadm/docker-compose 命令与环境搭建**（A09/15/17/加餐，B10/11/12）：命令记忆与操作演示，非机制题，按收割标准丢弃。
- **Docker Hub 镜像仓库使用**（A05）：工具操作，题库已有镜像分层/Dockerfile 题覆盖相关机制。
- **开篇词/视频课/实战演练/期末测试篇**：无独立机制内容。
- **Operator 工作原理专章**（B27）：ops-k8s-operator 已深度覆盖（reconcile 幂等/状态机/Helm 分工），不重收新题，仅留 E2 增强。
- **Prometheus/Metrics Server/Custom Metrics/日志收集专章**（A30，B48/49/50）：与 ops-obs-monitoring、ops-obs-logging 重复，仅以 E9 增强形式挂接。
- **GPU 管理与 Device Plugin**（B44）：场景过窄，核心结论并入 E7 一条素材，不设独立题。
- **Kata Containers 与 gVisor**（B47）：ops-cicd-container-vs-vm 已有"强隔离场景用 Kata/gVisor"结论层，深挖（虚拟化实现细节）收益低，丢弃。
- **Namespace 与 soft multi-tenancy 专章**（A29，B36）：核心结论"Namespace 仅逻辑隔离、无真实多租户"已并入 S10 素材，不设独立题。
- **容器底层 namespace/cgroup 详挖**（B05/06/07/08）：**裁决建议**——os.ts 已有相近题（fork 炸弹题覆盖 cgroup pids 控制器与 PodPidsLimit、CFS 题覆盖 cgroup bandwidth、OOM 题覆盖 memory.max 与 cgroup OOM），ops-cicd-container-vs-vm 已覆盖六种 namespace 与隔离对比；再收"namespace 详解"类新题构成双重重复，判不收，仅以 E10 挂增强。
- **CRI 与容器运行时详解、dockershim 演进**（B45/46）：偏基础设施平台开发视角，结论层（kubelet 经 CRI 解耦运行时）并入 E1 素材，不设独立题。
- **自定义控制器编写步骤**（B24/25 的 Initializer/CRD 代码细节）：ops-k8s-operator 已覆盖控制器编写范式，S11 只保留声明式思想层与 sidecar 注入案例。
- **ConfigMap/Secret 注入细节**（A14）：env 注入不可热更新、Volume 挂载可热更新但有延迟等要点与 ops-k8s-storage 题的"配置即卷"一条重合度较高，且本次高优先机制题已满额，暂弃（若后续扩容可作独立候选）。
