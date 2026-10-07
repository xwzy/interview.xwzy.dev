import type { Track } from '../types'

export const backendTrack: Track = {
  id: 'backend',
  name: '后端开发',
  icon: '⚙️',
  tagline: '语言、存储、中间件到分布式架构的服务端全景',
  description:
    '服务端面试旗舰题库：从 API 设计、语言运行时，到 MySQL/Redis/消息队列与分布式微服务，每题带层层追问链，适合出题与深挖。',
  color: 'emerald',
  topics: [
    {
      id: 'be-general',
      name: '服务端通用基础',
      description: 'API 设计、鉴权、幂等与安全——所有后端岗位绕不开的基本功。',
      references: [
        { label: 'MDN: HTTP 访问认证（Authorization）', url: 'https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Guides/Authentication' },
        { label: 'OAuth 2.0 RFC 6749', url: 'https://datatracker.ietf.org/doc/html/rfc6749' },
      ],
      questions: [
        {
          id: 'be-general-python',
          title: 'Python 的 GIL 是什么？为什么 IO 密集多线程还有效，CPU 密集要换多进程？',
          difficulty: 'intermediate',
          tags: ['Python', 'GIL', 'asyncio', '并发'],
          points: [
            '**GIL（全局解释器锁）**：CPython 里**同一时刻只允许一个线程执行 Python 字节码**的互斥锁（存在原因：CPython 的内存管理（引用计数）非线程安全，加细粒度锁的改造代价远大于收益）；推论一：**多线程无法利用多核跑 Python 代码**（4 核机器 CPU 密集多线程 ≈ 单核还更慢——切换开销）；推论二：**不是所有时间都握着 GIL**——IO（网络/文件/sleep）与多数 C 扩展（NumPy 的重计算、加密库）会**释放 GIL**，这就是 IO 密集多线程仍有效的原因。',
            '**三套并发模型怎么选（答题主干）**：**多线程**——IO 密集且不想改代码结构（阻塞库友好；GIL 在等 IO 时让出，吞吐照样涨）；**asyncio（协程）**——超高并发 IO（万级连接），但要求**全链路异步库**（aiohttp/asyncpg——混入一个阻塞调用就卡住整个事件循环，与 Node 单线程同病同药）；**多进程（multiprocessing）**——CPU 密集（绕开 GIL 各进程独立解释器；代价：内存与 IPC 序列化开销）；一句话速记：**IO 密集线程/协程、CPU 密集进程、两者混合用进程池 + 各自内协程**。',
            '**与 AI 工程的关联（AI 应用岗的高频引申）**：训练/推理的重活全在 **C/C++/CUDA 的原生扩展**里——NumPy/torch 的矩阵运算**持有 GIL 的时间极短**，所以 Python 是"指挥语言"时 GIL 不是瓶颈（数据加载与预处理环节除外——dataloader 用多进程正是为此）；GPU 推理同理（GIL 在等 GPU 时释放）；**FastAPI/uvicorn** 的高并发配方 = asyncio + uvloop + 异步驱动——能讲清"我的服务哪段握 GIL、哪段不握"，说明并发理解是结构化的。',
            '**工程细节与演进视野（加分）**：GIL 的经典坑——**CPU 密集线程拖慢所有线程**（长计算不释放 GIL，IO 线程也饿死；解法：计算切片主动让出或换进程）；subprocess/线程池混用的死锁陷阱；**PEP 703 的 free-threaded Python（no-GIL 分支）已进入主线实验**（3.13+ 可选构建）——单锁改细粒度，多线程终于能吃多核，代价是单线程略慢与扩展生态适配——知道这个演进方向说明跟得住语言动态。',
          ],
          followUps: [
            {
              question: 'asyncio 的事件循环里调了一个同步阻塞的库函数（比如 requests），会发生什么？怎么排查？',
              points: [
                '后果：**整个事件循环被这一个调用卡住**——所有协程、健康检查、超时定时器全部停摆（服务表现为整体 RT 尖刺、探活失败重启——"一个慢请求拖死全服"的经典事故）；根因：事件循环是**协作式调度**，协程不 await 让出就没人能跑（与 Rust async 题的"阻塞任务"同构、与 Node 同病）。',
                '排查与修复：py-spy dump 看事件循环线程卡在哪个栈帧（一眼定位阻塞调用）；修复三板斧——换异步库（requests → aiohttp/httpx async）、**loop.run_in_executor / asyncio.to_thread**（把阻塞调用丢线程池）、CPU 重活丢进程池；预防：**依赖评审卡同步库**（异步项目里引入同步 IO 库要过审）+ 事件循环卡顿监控（loop 每心跳检测延迟告警）。',
              ],
            },
          ],
        },
        {
          id: 'be-general-restful',
          title: '如何设计一套规范的 RESTful API？哪些地方最容易做错？',
          difficulty: 'basic',
          tags: ['RESTful', 'API 设计'],
          points: [
            '**资源为中心**：URL 是名词复数（`/users/123/orders`），HTTP 方法表达语义：GET 查、POST 增、PUT 全量替换、PATCH 部分更新、DELETE 删；**不要在 URL 里放动词**（`/getUser` 是反模式），动作类业务用子资源表达（`POST /orders/123/cancellation`）。',
            '**状态码要准确**：200 成功、201 已创建、204 无返回体、400 参数错误、401 未认证、403 无权限、404 不存在、409 冲突、429 限流、5xx 服务端错误——"全部返回 200 + code 字段"会丢失网关/监控/重试组件可用的语义。',
            '**过滤分页排序标准化**：`?page=&size=&sort=-created_at&status=paid`；返回结构统一：数据体 + 分页元信息（total、has_next）。',
            '常见坑：GET 带副作用（破坏可缓存与幂等语义）、PUT 不幂等（要保证重复提交结果一致）、嵌套过深（>2 层就该给子资源独立路由）、敏感信息放 URL（会被日志与 Referer 泄露）。',
          ],
          followUps: [
            {
              question: 'REST 的幂等性怎么理解？为什么 DELETE 和 PUT 幂等但 POST 不是？',
              points: [
                '幂等 = 同一请求执行一次和 N 次，**服务器状态结果相同**。DELETE 删一次和删多次（第一次删掉，后续 404）最终状态一致；PUT 是全量覆盖，重复覆盖无影响；POST 每次新建资源，状态会变，不幂等。',
                '幂等的工程价值：**网络重试的安全依据**——网关/客户端只应自动重试幂等请求，否则需要幂等键兜底。',
              ],
            },
          ],
        },
        {
          id: 'be-general-jwt-session',
          title: 'Cookie-Session 和 JWT 各自的原理与优劣？实际项目怎么选？',
          difficulty: 'basic',
          tags: ['鉴权', 'JWT', 'Session'],
          points: [
            '**Session**：状态存服务端（内存/Redis），客户端只持 SessionID（Cookie）。优点：可随时吊销、体积小；缺点：分布式需要集中存储/粘性会话，跨域与移动端接入不便。',
            '**JWT**：服务端签发的自包含令牌（Header.Payload.Signature），**无状态校验**——任何持有密钥的服务都能本地验签，天然适合分布式与多端。缺点：**签发后无法主动失效**（除非引入黑名单，又变回有状态）、Payload 明文可见（不能放敏感信息）、体积比 SessionID 大。',
            '典型事故：登出/封号后 JWT 仍然有效——应对：**短有效期 Access Token + Refresh Token**（refresh 可服务端吊销）、关键操作二次校验、黑名单只存未过期的 jti。',
            '选型口径：**单体会话管理用 Session+Redis 简单可靠；服务化/多端/跨域用 JWT；内部服务间调用优先 mTLS 或内网签名**，不要把用户 token 在服务间传来传去。',
          ],
          followUps: [
            {
              question: 'JWT 存哪里更安全？localStorage 和 HttpOnly Cookie 的 XSS/CSRF 权衡？',
              points: [
                'localStorage：方便但**任何 XSS 都能偷走 token**；HttpOnly Cookie：JS 读不到，抗 XSS，但带来 **CSRF 风险**（用 SameSite=Lax/Strict + CSRF token 防御）。',
                '综合最佳实践：HttpOnly + Secure + SameSite 的 Cookie 承载 token；如果必须放 header（多端），就要在 XSS 防护（CSP、输入过滤）上加倍投入。',
              ],
            },
          ],
        },
        {
          id: 'be-general-graphql',
          title: 'GraphQL 是什么？它和 REST 怎么选？N+1 问题怎么解？',
          difficulty: 'intermediate',
          tags: ['GraphQL', 'REST', 'DataLoader', 'BFF'],
          points: [
            '**核心模型**：客户端用**类 Schema 的查询语言**声明"要哪些字段"，服务端的 **Resolver 函数**按字段组织（每个字段一个解析函数）——响应 JSON 与查询**形状同构**；一次请求拿全多资源数据（客户端自定义聚合），天然适合"多端差异大"的场景（App 要 5 个字段、Web 要 20 个）。',
            '**最大工程坑：N+1 查询（必考）**：GraphQL 按字段解析——返回 100 篇文章、每篇的 author 字段都触发一次 Resolver，**默认打 100 次 DB 查询**；解法是 **DataLoader**：把同 tick 内的 100 个 author 请求**收集、按 key 去重、合并成一次 `WHERE id IN (...)`** 批查再分发（批处理 + 请求级缓存）——本质是把"字段级解析"的便利与"批量 IO"的效率缝合起来。',
            '**与 REST 的对比要讲透两面**：GraphQL 优势——**按需取字段**（移动端省流量）、一次请求免多跳、类型自省（Schema 即文档、代码生成友好）、前端迭代不用等后端加接口；劣势——**HTTP 缓存失效**（POST + 查询体，吃不到 GET 的 CDN/浏览器缓存语义，要自建 persisted query/网关缓存）、**复杂度与安全治理**（查询深度不限可能被恶意深嵌套打爆——要 depth limit、cost analysis、超时）、服务端实现与观测更复杂。',
            '**定位与选型口径**：GraphQL 的甜区是 **BFF 层**（聚合多个微服务/数据源，屏蔽前端多端差异——GraphQL for frontend 思想）；内部服务间通信 REST/gRPC 更直接（强契约、缓存友好、protobuf 二进制高效——与 RPC 题分工）；现实判断：**多数团队不需要全站 GraphQL**，一个聚合层 + REST 后端是务实组合；接口简单、端单一的场景上 GraphQL 是给自己找事。',
          ],
          followUps: [
            {
              question: 'GraphQL 的查询怎么缓存？persisted query 是什么？',
              points: [
                '**Persisted Queries**：构建期把查询文本注册到服务端拿一个**哈希 ID**，运行时只发 ID（GET 请求）——重新获得 HTTP GET 语义：**CDN 可缓存、请求体变小、白名单校验**（没注册的查询直接拒，顺带解决任意查询的安全面）；这是 Apollo 等生态的标准实践，答不出缓存方案的 GraphQL 讨论是不完整的。',
                '应用层补充：**响应缓存**按 query + 变量粒度（网关/服务端做）、**字段级 DataLoader 请求缓存**（同请求内去重）、订阅（Subscription）走 WebSocket 单独通道——GraphQL 的缓存是"每一层自己想辙"，这个治理成本正是它没通吃的根本原因。',
              ],
            },
          ],
        },
        {
          id: 'be-general-zero-trust',
          title: '零信任安全是什么？和传统边界防御有什么本质区别？怎么落地？',
          difficulty: 'intermediate',
          tags: ['零信任', '安全架构', 'ZTNA', '认证授权'],
          points: [
            '**一句话本质**：从"**城堡护城河**"（内网可信、外网危险——防火墙划边界，进了内网就放行）翻转为"**永不信任，始终验证**"——**位置不构成信任**（人在内网 ≠ 可信），每个请求都要验证身份与上下文。三大原则（必背）：**显式验证**（每次访问都认证授权，不只登录时）、**最小权限**（按身份只给必需的访问面，JIT 按需授权）、**假设已发生泄露**（设计就当攻击者已在内网——横向移动也要被拦）。',
            '**为什么边界模型失效了（讲清动机才有说服力）**：云与 SaaS 让"内网"不存在了（资产一半在别人机房）；远程办公让员工不在内网；**内网一旦被钓鱼突破，扁平网络里攻击者横向移动如入无人之境**（真实事故的常态是边界破了以后横着走）——边界模型的假设"内网=可信"在今天的架构下就是最大的漏洞。',
            '**落地四件套（工程视角）**：① **身份是新的边界**——强认证（MFA 必须）+ 短时效凭证（token 短期 + 持续风险评估，一次登录不再是永久门票）；② **ZTNA/SDP 替代 VPN 直连**——访问网关按"身份+设备+上下文"逐请求授权（VPN 是网络层打通整段内网，ZTNA 是应用级最小通道：你只能到你被授权的那个应用，**网络层不可见其他资产**）；③ **微分段**——内网按工作负载切小格子（东西向流量也要策略），拦横向移动；④ **设备信任**（设备合规状态——补丁/EDR 在线——参与授权决策：没打补丁的电脑即使密码对也降权或拒绝）。',
            '**与已有知识的衔接（答出层次感）**：零信任不是替换身份协议而是**消费它们**——OAuth2/OIDC（授权码题）做认证授权基座、JWT 短时效做凭证载体、mTLS 做服务间身份（服务身份与人身份同权重——零信任覆盖东西向）；**持续自适应评估**（会话中途发现异常——异地 IP、设备指纹突变——动态降权/踢线）是"始终验证"的技术兑现。',
            '收束口径：零信任是**架构原则不是一款产品**——买齐设备 ≠ 零信任，**每个访问决策都经过身份+设备+上下文的策略引擎**才是；落地是多年渐进（先保护皇冠资产、先 ZTNA 替 VPN、再微分段铺开），面试能给出优先级路径就是架构视角。',
          ],
          followUps: [
            {
              question: '微服务和云原生环境下，服务间的零信任怎么落地？',
              points: [
                '**服务身份优先**：每个服务有独立身份（SPIFFE/SPIRE 发证书或 K8s ServiceAccount），服务间调用走 **mTLS 双向认证**——不再"进了集群网络就互信"（Istio/Linkerd 的 sidecar 自动 mTLS，Cilium 走 eBPF 做 identity-aware 策略——与服务网格题衔接）；授权从网络 IP 白名单升级为**服务身份 + 方法级策略**（服务 A 可以调服务 B 的读接口但不能调写接口）。',
                '渐进路径：先把**东西向流量加密+身份化**（mTLS），再上**细粒度授权**（AuthorizationPolicy），最后做**运行时上下文**（镜像签名验证、工作负载行为基线）；"集群内默认全通"是云原生时代最常见的安全自欺——能点破这句，说明安全意识是真的。',
              ],
            },
          ],
        },
        {
          id: 'be-general-design-patterns',
          title: '常见设计模式的使用时机？SOLID 里哪条最有实战价值？',
          difficulty: 'intermediate',
          tags: ['设计模式', 'SOLID', '面向对象'],
          points: [
            '**面试的正确打开方式：按"解决什么问题"记模式，不按名词背**。高频四个：**单例**（全局唯一资源——连接池、配置；**DCL 双检锁**的线程安全细节与 volatile 的关系见并发题）；**工厂**（把"new 什么"集中起来——依赖注入容器就是工厂的系统化，Spring 的 BeanFactory 名字里就是答案）；**策略**（替换 if-else 分支膨胀——支付方式/折扣规则/重试策略，配 Spring 注入策略 Map 就是生产级解法）；**观察者**（一对多解耦——事件总线、MQ 的发布订阅都是它的分布式版）。',
            '**组合优于继承（最值得背的一条原则）**：继承是**编译期强绑定**（父类改动殃及所有子类，"脆弱基类问题"），组合是**运行时可插拔**——装饰器模式（Java IO 的 BufferedInputStream 包 FileInputStream）就是组合替代继承的经典：要 N 种能力组合，继承要 2^N 个类，组合只要按需层层包。能举 IO 流这个例子，说明模式不是背的。',
            '**SOLID 实战权重排序（有自己的判断）**：**开闭（O）与单一职责（S）日常最有价值**（新增靠扩展、每个类只有一个变化理由——直接降低改动风险）；**依赖倒置（D）是框架的基石**（业务依赖接口，容器装配实现——Spring/测验 testability 的根基）；里氏替换与接口隔离更多是 code review 的纠察工具（子类不能偷偷改语义、接口别强迫实现用不到的方法）。面试说"哪条最有价值 + 为什么"比背五条全称加分。',
            '**反模式警告（区分度所在）**：**为了模式而模式**是初级到中级的典型病——四人帮的 23 个模式诞生于无框架时代，**现代框架已经把大半模式做进了基础设施**（代理模式 = Spring AOP、模板方法 = JdbcTemplate、责任链 = 中间件/拦截器链、适配器 = 各类 *Adapter）；真正要手写的是**业务策略变化点**（if-else 三连就要想策略）与**解耦边界**（跨模块通知想事件）。答"我很少手写模式，但用框架时知道它在用什么模式、边界在哪"是高段位答案。',
          ],
          followUps: [
            {
              question: '策略模式怎么消除 if-else？Spring 里怎么优雅地组织一组策略？',
              points: [
                '结构：把每个分支变成实现同一接口的策略类 + 一个**按 key 派发的上下文**；Spring 的惯用法是**注入 Map 或 List**——`Map<String, PayStrategy>`（key = bean 名或自定义标识），运行时 `strategyMap.get(channel).pay()`——新增渠道只加一个类，派发逻辑零改动（这就是开闭原则的落地形态）。',
                '进一步的权衡话术：分支少于三四个且稳定，if-else 更直白（模式有类膨胀成本）；**分支里有组合逻辑**（渠道 × 会员等级交叉）时先考虑规则引擎而不是策略叠加——能说出模式适用的规模阈值，才是"用过"而不是"背过"。',
              ],
            },
            {
              question: '"高内聚、低耦合"的具体分级是什么？为什么它是设计的第一原则？（浙大软工真题考点）',
              points: [
                '**内聚从高到低**：功能内聚（模块只做一件事）> 通信/顺序内聚 > 过程内聚 > 暂时内聚 > 逻辑内聚（if-else 切换的杂烩）> 巧合内聚（毫无关系硬凑一起）；**耦合从差到好**：内容耦合（改别人内部/跳转）> 共用耦合（共享全局数据）> 控制耦合（传开关标志控制别人流程）> 印记耦合（传整个对象只用俩字段）> 数据耦合（只传必要值）。',
                '为什么是第一原则：**高内聚低耦合的模块易测试（mock 少）、易复用（依赖少）、易变更（改一处不扩散）**——设计模式的全部招式（策略消除控制耦合、依赖注入解耦构造、单一职责保证功能内聚）都是这对原则的局部实现；能把它与 SOLID 串成"原则 → 模式"的推导关系，就超过了背模式的层次。',
              ],
            },
          ],
        },
        {
          id: 'be-general-crypto',
          title: '密码学基础：对称/非对称怎么配合？数字签名、加盐、慢哈希分别解决什么？',
          difficulty: 'intermediate',
          tags: ['密码学', '加密', '数字签名', '哈希'],
          points: [
            '**两类算法的本质分工**：**对称加密**（AES：同一把钥匙加解密——快（硬件指令加速、GB/s 级），致命问题是**钥匙怎么安全给对方**）；**非对称加密**（RSA/ECC：公钥加密、私钥解密——解决分发问题，但**慢 3 个数量级**只能加密小数据）。所以真实系统永远是**混合加密**：非对称协商一把会话密钥，之后全用对称加密——**TLS 的整个握手就是在干这件事**（见 HTTPS 握手题的衔接）。**RSA vs ECC**：同安全强度下 ECC 密钥短得多（256 位 ECC ≈ 3072 位 RSA）——移动端、证书、区块链全在向 ECC 收敛。',
            '**哈希的三大特性与用途**：**单向性**（不可逆推原文）、**抗碰撞性**（找不到两个同哈希的输入）、**确定性**；用途：完整性校验（文件/消息摘要）、密码存储、数字签名前的压缩（签摘要不签原文——快且不受原文长度限制）；**它不是加密**（不可解密）——把"哈希"说成"加密"是面试减分项。',
            '**密码存储的正确姿势（高频且常答错）**：**不能明文、不能 MD5/SHA 裸哈希**（彩虹表预计算可批量反查）；**加盐**（每用户随机 salt 拼进密码再哈希——彩虹表失效，因为每条都要单独算）但普通哈希**太快**（GPU 每秒数十亿次，加盐也能被暴力枚举）；正解是**慢哈希/口令哈希**：**bcrypt/PBKDF2/scrypt/Argon2**——故意设计得慢（迭代/内存难题，每次校验几十~几百毫秒，GPU 并行优势被内存硬度抵消），**盐内建且自动处理**；验证走 `verify(password, hash)` 不需要（也不应该）存明文盐的对照表。',
            '**数字签名 vs 加密（最容易混的一对）**：**加密**是"保密"（公钥加密、私钥解密——只有你能读）；**签名**是"认证与不可否认"（**私钥签名、公钥验签**——证明是你发的且没被改）：对消息哈希摘要用私钥运算，任何人用你的公钥验证；HMAC 则是**对称世界的签名**（共享密钥 + 哈希，用于 API 签名/内部完整性——与防篡改签名题衔接，性能比非对称签名好得多，但没有"不可否认"（双方都有密钥））。**证书** = 公钥 + 身份 + CA 的签名（把"这是我的公钥"变成可信陈述——PKI 的全部）。',
            '收束口径：一张地图记全——**保密用混合加密（非对称换钥匙 + AES 干活）、完整与身份用签名（对外非对称/HMAC 对内）、口令用加盐慢哈希**；所有 web 安全机制（TLS/JWT/OAuth/HTTPS）都是这三块积木的组合——积木清楚了，上层协议就都能自己推。',
          ],
          followUps: [
            {
              question: 'JWT 的签名为什么用 HMAC（HS256）或 RSA/ECDSA（RS256/ES256）？怎么选？',
              points: [
                '**HS256（HMAC）**：签发与验证同一密钥——**简单、快**，但验证方也能签发（任何拿到 secret 的服务都能伪造 token）：只适合**单体或完全互信的服务群**（secret 泄露面 = 所有服务）；**RS256/ES256（非对称）**：私钥只在签发方（认证中心），验证方只有公钥——**职责分离**，微服务/开放平台（第三方要验你的 token）必须用它；ES256（ECC）比 RS256 签名更短更快，新系统首选。',
                '迁移与安全细节：HS256 的 secret 要足够长且定期轮换（弱 secret 可被离线爆破伪造）；JWT 的 payload 只是 Base64 不是加密（敏感信息不能放——与 JWT 题呼应）；能从"谁持有密钥、谁能伪造"的信任模型出发选算法，说明密码学题真懂了。',
              ],
            },
          ],
        },
        {
          id: 'be-general-unit-test',
          title: '后端单元测试怎么写才不是「覆盖率表演」？Mock 的边界在哪？',
          difficulty: 'intermediate',
          tags: ['单元测试', 'Mock', 'Testcontainers', '测试策略'],
          points: [
            '**测试什么分层（测试金字塔的后端版）**：**单元测试**（毫秒级，Mock 一切外部依赖——测纯逻辑：计算、状态机、规则引擎）；**集成测试**（真实依赖的"接口组合"——DB 操作、缓存、MQ 收发）；**端到端/契约测试**（一条业务链路 + 与下游的契约）。新手通病是两端失衡：全 Mock 的"单元测试"其实测的是 Mock 的行为（green but meaningless），或全集成跑得慢到没人跑——**比例按变更风险配**（核心资金逻辑多单测，CRUD 偏集成冒烟）。与前端测试题分工：那题讲组件层，本题讲服务端依赖处理。',
            '**Mock 的边界（本题的实践分水岭）**：**属于你的就 Mock，不属于你的就用真的**——业务逻辑里的协作者（自己写的服务/策略类）Mock 灵活合理；**基础设施别 Mock**（Mock 的 MySQL 行为 ≠ 真实 MySQL——事务隔离、锁、唯一约束、SQL 方言全是坑点：Mock 全绿的代码上线被唯一索引打脸是经典事故）；现代答案：**Testcontainers**（测试时用 Docker 起真 MySQL/Kafka/Redis，真依赖 + 隔离环境 + 可并行）——"不再 Mock 数据库"已经是成熟团队的标准姿势；时间/随机数这类环境因素**必须可控注入**（Clock 接口、随机种子——否则测试不稳定）。',
            '**好测试的三个特征**：**行为断言而非实现断言**（断言"下单成功后库存减一"，不断言"调用了 repository 的 save 三次"——后者改实现就崩，测试变成重构枷锁）；**Arrange-Act-Assert 结构**（准备-执行-断言三段清晰，一个测试聚焦一个行为）；**失败信息可诊断**（断言消息带上下文，跑挂了一眼知道差在哪）。**测试也要 review**：和业务代码同等标准进 CR（烂测试的维护成本会反过来拖死重构——与 Code Review 题呼应）。',
            '**数据准备与清理（工程细节，做过才懂）**：**每个测试自造数据自清理**（不依赖共享的"测试账号"——执行顺序耦合是脆弱之源）；用 **builder/工厂方法**造数（`makeOrder(status=PAID)` 一行造复杂对象——与测试平台题的造数工厂同构）；事务回滚或 truncate 清理（Testcontainers 里常用"每测试一个事务最后回滚"提速）；**flaky 零容忍**（偶尔红的测试要修或隔离——狼来了效应会杀死整个套件的可信度，与 QA 方向 flaky 治理同源）；覆盖率是**过程指标**（新代码 diff 覆盖率做门禁，全量数字不考核——考核必被表演）。',
          ],
          followUps: [
            {
              question: '团队说没时间写测试，你作为负责人怎么推动？',
              points: [
                '**从痛点切入而不是从理念**：找最近一次"改 A 坏 B"的线上事故复盘——"这类回归一个测试就能拦住，成本半小时"（用团队自己的伤疤说话）；从**最高变更频率 + 最高风险**的模块开始（热改模块的测试立竿见影，冷模块补测试是无效功）。', 
                '制度化而不是道德化：**新代码 diff 覆盖率门禁**（增量控制住，存量按触碰逐步补——童子军军规，与技术债题同构）；修 bug **先写复现测试再修**（每个 bug 变成永久的回归防线——这是性价比最高的测试来源）；CI 时长治理（分层执行：提交跑单测、合并跑集成、每日全量——快反馈与全覆盖兼得）。最后的心态话术：测试不是"额外的活"，是**把重复的手工验证自动化**——每次说"我测一下"超过三次的地方就该有测试了。',
              ],
            },
          ],
        },
        {
          id: 'be-general-oauth2',
          title: 'OAuth 2.0 的授权码模式流程是怎样的？为什么说它解决了"不给密码也能授权"？',
          difficulty: 'intermediate',
          tags: ['OAuth2', '授权'],
          points: [
            '四个角色：资源所有者（用户）、客户端、授权服务器、资源服务器。**授权码模式**：客户端 → 授权页（用户登录并同意）→ 重定向回回调地址并携带**一次性授权码 code** → 客户端**在服务端**用 code + client_secret 换 access_token → 用 token 访问资源。',
            '关键设计：code 只用一次且短时效，**换 token 的步骤在服务端完成（带 client_secret）**，避免 token 经过前端/重定向链路暴露；回调 redirect_uri 必须严格校验防授权码拦截。',
            '场景区分：**第三方登录/委托授权用 OAuth2**；"本系统自己的登录认证"用会话/JWT 即可——OAuth2 是授权协议，认证要配合 OIDC（ID Token）才完整。',
            'PKCE 扩展：无后端的 SPA/移动端存不了 client_secret，用 code_verifier/code_challenge 替代密钥，是当前推荐做法；隐式模式（implicit）已不推荐。',
          ],
          followUps: [
            {
              question: 'OIDC 和 OAuth2 的关系？ID Token 和 Access Token 有什么区别？',
              points: [
                'OIDC 是 OAuth2 之上的**认证层**：授权服务器额外签发 ID Token（JWT 格式，含 iss/sub/exp 等 claims），回答"这个用户是谁"；Access Token 回答"能访问什么"。',
                '不要用 Access Token 当身份凭证：它的 audience 是资源服务器，格式无稳定用户信息承诺。',
              ],
            },
          ],
        },
        {
          id: 'be-general-idempotency',
          title: '接口幂等性如何设计？从"前端防抖"到"数据库唯一约束"的完整方案有哪些？',
          difficulty: 'intermediate',
          tags: ['幂等', '分布式', '接口设计'],
          points: [
            '为什么需要：网络重试、用户重复点击、MQ 重复投递都会造成重复请求；**转账/下单/支付类接口不幂等会直接资损**。',
            '方案谱系（按可靠性排序）：① **唯一业务约束**：数据库唯一索引（订单号、流水号）天然幂等，是最终兜底；② **防重令牌**：进入页面先领 token，提交时携带，服务端 Redis `SET NX` 校验+删除；③ **状态机幂等**：更新带前置状态（`update orders set status=\'paid\' where id=? and status=\'unpaid\'`，影响行数=0 说明已处理）；④ **乐观锁版本号**；⑤ 前端防抖/按钮置灰——只是体验优化，不能作为正确性依赖。',
            '分布式锁方案要小心：锁内判断"是否已处理"再执行，锁超时/误删会造成并发窗口，**锁只减少并发，唯一约束才保证结果**。',
            'MQ 消费幂等：消息表（msg_id 唯一索引）或 Redis 记录已消费 id（注意设置过期与 DB 兜底），核心仍是"处理结果可去重"。',
          ],
          followUps: [
            {
              question: 'INSERT ... ON DUPLICATE KEY UPDATE 和"先查再插"哪个幂等更可靠？',
              points: [
                '"先查再插"有**检查-插入的并发窗口**：两个请求同时查到不存在，然后都插入——除非单行锁/分布式锁串行化，否则必重复。',
                '`ON DUPLICATE KEY UPDATE` / `INSERT IGNORE` 把判断和写入压成一条原子语句，靠唯一索引在行锁层面裁决，是首选；语义差异：前者会更新并影响行数，后者直接忽略。',
              ],
            },
          ],
        },
        {
          id: 'be-general-sign-replay',
          title: '开放接口如何做防篡改与防重放？签名方案的完整设计是什么？',
          difficulty: 'intermediate',
          tags: ['签名', '安全', '防重放'],
          points: [
            '**防篡改（签名）**：对"请求参数按 key 排序拼接 + 时间戳 + nonce"做 HMAC-SHA256，密钥只存双方服务端；服务端用同样规则重算比对——任何参数被中间人修改都会导致签名不符。',
            '**防重放**：时间戳窗口（±5 分钟，超出拒绝）+ **nonce 一次性校验**（Redis `SET NX EX` 存 nonce，重复即拒绝）；两者配合：窗口限制攻击时长，nonce 保证窗口内也不能重发。',
            '传输层仍需 **HTTPS**：签名防的是业务层篡改，不替代 TLS 的机密性；密钥定期轮换，错误信息不要区分"签名错/时间戳错"（防探测）。',
            '进阶：重要接口加**请求体摘要**（body 的 hash 进签名，防止只签 URL 不签 body 的漏网）、异步通知（支付回调）必须验签 + 幂等 + 主动查询对账。',
          ],
          followUps: [
            {
              question: 'nonce 存 Redis 挂了怎么办？签名方案的性能开销主要在哪？',
              points: [
                'nonce 校验依赖集中存储，Redis 不可用时策略要明确：**fail-open（可用性优先，仅HTTPS 防护）还是 fail-closed（安全优先，拒绝请求）** 按业务定，支付类建议 fail-closed + 多级缓存。',
                '性能开销主要是排序拼接与 HMAC 计算（微秒级，CPU 便宜）；真正要警惕的是把签名做成"读 DB 校验 appId/secret"——密钥校验要本地缓存或配置下发。',
              ],
            },
          ],
        },
        {
          id: 'be-general-api-versioning',
          title: 'API 为什么要版本化？有哪些版本管理策略？',
          difficulty: 'basic',
          tags: ['API 设计', '版本管理'],
          points: [
            '动因：接口破坏性变更（删字段、改语义、改枚举值）无法要求所有调用方同步升级，需要**新旧共存、平滑迁移**。',
            '策略对比：**URL 路径版本**（`/v1/users`：直观、网关路由简单，最常用）、**Header 版本**（`Accept: application/vnd.xx.v2+json`：URL 干净但调试难）、**查询参数**（`?version=2`：可缓存性差）。选哪种都行，关键是**全站统一**。',
            '更优雅的路线：**向后兼容的演进优先于加版本**——只加字段不删字段、枚举新增不改值义、错误码只增不改；移动端 API 因发版不可控必须版本化+强制升级策略，Web/服务间调用尽量做到不改客户端。',
            '治理：版本要有**生命周期**（废弃公告→返回 Warning/Sunset 头→下线），用网关统计各版本流量驱动下线决策。',
          ],
          followUps: [
            {
              question: '服务间（内部）RPC 接口也要版本化吗？和对外 API 的策略有什么不同？',
              points: [
                '内部接口发布节奏可控，策略是**兼容式升级 + 双写/灰度**：新字段可加，破坏性变更通过"新方法名（v2）/新 topic"并行，消费方迁移后下线旧方法。',
                '与对外 API 的差异：内部有强一致的部署编排能力（上下游一起发），不靠长期多版本共存；对外只能靠版本字段硬隔离。',
              ],
            },
          ],
        },
        {
          id: 'be-general-contract',
          title: '前后端如何高效联调？接口契约和 Mock 在工程里怎么落地？',
          difficulty: 'basic',
          tags: ['联调', '契约', '工程效率'],
          points: [
            '核心思想：**先契约后实现**。接口文档（OpenAPI/Swagger 或 Proto 文件）作为唯一事实来源，双方并行开发——前端基于 Mock 数据，后端按契约实现，联调时只对差异。',
            '工程化落地：契约即代码（OpenAPI yaml 进仓库并 review）、**类型生成**（openapi-typescript / proto 生成 TS 与服务端 stub）、CI 里做契约测试（schema 校验 + Provider/Consumer 契约测试防止破坏性变更合入）。',
            'Mock 分层：本地 dev server 静态 Mock（快）、契约生成的 Mock Server（与文档一致）、测试环境的真实依赖（准）；关键在于 Mock 由**契约自动生成**而不是手写 JSON（否则必然漂移）。',
            '联调效率细节：统一错误码与错误体格式、环境域名与网关代理配置（vite proxy/charles 映射）、接口变更走 changelog 通知——大多数"联调慢"是沟通协议问题而不是技术问题。',
          ],
          followUps: [
            {
              question: '契约测试和集成测试有什么区别？在微服务里解决什么问题？',
              points: [
                '集成测试验证"真调通"（慢、环境重）；契约测试验证"**双方对接口的理解一致**"（快、可 mock 运行）：Consumer 用例生成的交互快照与 Provider 的实现比对，任何一方破坏契约就失败。',
                '它把"联调才发现不兼容"左移到 CI，微服务几十个团队并行时的标准实践（Pact 是代表实现）。',
              ],
            },
          ],
        },
        {
          id: 'be-general-sso',
          title: '单点登录（SSO）是怎么实现的？多个系统怎么共享一次登录？',
          difficulty: 'intermediate',
          tags: ['SSO', '认证', '单点登录'],
          points: [
            '先说清它解决什么：**一次登录、全网通行**——用户在任意一个子系统登录后，访问同体系的其他系统不用再输密码；同时**账号收敛到统一的认证中心（IdP）**：密码只存一处、审计与封禁一个入口、入职离职一个开关。前提是认证中心与各业务系统（SP）分离，业务系统不再各自维护密码与会话真相。',
            '**经典 CAS 流程（答题主线，讲清票据怎么流转）**：用户访问子系统 A → A 无本地会话，**302 跳认证中心并带 returnUrl** → 认证中心发现无全局会话，展示登录页 → 登录成功后**种下认证中心域的全局会话 Cookie** → 重定向回 A 的回调地址并携带**一次性 ticket** → A 的后端拿 ticket **服务端到服务端**去认证中心验票（防前端伪造）→ 建立 A 自己的本地会话。**"单点"的本质在第二次访问**：进子系统 B 时 B 同样跳认证中心，但**全局会话 Cookie 还在，免密直接发新 ticket**——登录态收敛在认证中心一处，业务系统只持有各自由 ticket 换来的本地会话。',
            '与 OAuth2 的分工（本库另有 OAuth2 授权码模式专题，主动区分是加分项）：OAuth2 是**授权**框架，发 access_token 让第三方代用户访问资源，解决"不给密码也能授权"；**登录态共享要的是"认证"，标准答案是 OIDC**——在 OAuth2 之上定义 id_token（签名的 JWT 身份声明）与 UserInfo 接口，把"授权流程"复用成"登录流程"。工程细节：同顶级域的多个系统可以把会话 Cookie 直接种在顶级域共享（简单但耦合域规划）；**跨顶级域只能走跳转换票**（Cookie 域边界决定），或在网关层统一鉴权集中处理。',
            '三个必答的工程难点：**单点登出**——销毁全局会话只是第一步，还得通知所有子系统销毁各自的本地会话（前端广播各 iframe 发起、或后端 back-channel 回调），漏一个系统就是"登出了一半"；**票据安全**——ticket 一次性、秒级有效期、与回调地址白名单绑定（防 ticket 被钓鱼截获重放）；**认证中心故障的影响面**——票据验证只发生在"建立本地会话"时，已有会话的用户不受影响，短暂故障不等于全站不可用；但会话续期若依赖中心要设计降级窗口。',
          ],
          followUps: [
            {
              question: '一个账号在手机和两台电脑同时登录，产品要"同端互踢"，会话模型怎么设计？',
              points: [
                '从"一个用户一个 token"升级为**多设备会话表**：每个登录会话一条记录（sessionId + 设备类型 + 登录时间 + 最近活跃），互踢 = 删除目标设备的会话行，该设备下次请求校验会话时失败强制重登。',
                '关键取舍在 JWT：**无状态 JWT 天然无法撤销**（签发即有效），做不了互踢——要么改有状态会话（每请求查库/Redis），要么准无状态：JWT 里写入 sessionId（或版本号），校验时比对中心存储的存活状态，撤销即删记录。这本质是"无状态性能 vs 可撤销性"的权衡，能主动点破这层是加分项。',
              ],
            },
            {
              question: '用 JWT 做登录态，"退出登录"怎么真正生效？',
              points: [
                'JWT 签发后到过期前必然有效，登出本质是**把它纳入可撤销体系**：方案一是 **jti 黑名单**——登出时把该 token 的唯一 id 写进 Redis，TTL 设为 token 剩余有效期，网关校验时先查黑名单；方案二是**短 access + 长 refresh 双 token**——登出只作废 refresh token，access 等 5-15 分钟自然过期，安全窗口换零查询成本。',
                '清客户端存储只是辅助（可控性为零，token 可能已被截获）——**服务端侧的失效手段**才是登出的真相。顺带能讲清"为什么纯前端删 localStorage 的登出是假的"这类变体问法。',
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'be-network',
      name: '网络与 IO 基础',
      description: 'TCP 连接管理、IO 多路复用与 Reactor 模型——高并发服务的网络地基。',
      references: [
        { label: 'Linux manual: epoll(7)', url: 'https://man7.org/linux/man-pages/man7/epoll.7.html' },
        { label: 'MDN: HTTP 概述', url: 'https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Guides/Overview' },
      ],
      questions: [
        {
          id: 'be-network-tcp-handshake',
          title: '线上出现大量 TIME_WAIT 或 CLOSE_WAIT，怎么排查与治理？',
          difficulty: 'basic',
          tags: ['TCP', '网络', '连接管理'],
          points: [
            '先定性——**看分布再下结论**：`ss -ant | awk \'{print $1}\' | sort | uniq -c` 数各状态连接。**TIME_WAIT 属于主动关闭方**（停留 2MSL，Linux 默认 60s），堆积说明本端在大量主动关短连接；**CLOSE_WAIT 属于被动关闭方**收到 FIN 之后的状态，堆积不消退只有一个解释：**业务代码没调 close**（句柄泄漏）——是 bug，不是参数问题。',
            'TIME_WAIT 治理按层来：应用层**上长连接/连接池**（治本：HTTP client 未复用、DB/RPC 每次新建都是惯犯）；内核层温和开启 `tcp_tw_reuse`（仅出方向、依赖时间戳）；端口耗尽用 `ip_local_port_range` 扩大；**绝不要开 `tcp_tw_recycle`**（NAT 下丢包，内核 4.12 已移除）。',
            '为什么 2MSL 必要（一句话版）：① 最后一个 ACK 丢失后，对端重传 FIN 时本端仍有连接上下文可应答；② 让旧连接报文自然消亡，避免污染复用相同四元组的新连接——所以 TIME_WAIT 本身是**协议的自我保护**，单机几千个无害，要警惕的是它耗尽端口或集中在网关/代理层。',
            '保活辨析：TCP keepalive 默认约 2 小时才探测，形同虚设——长连接系统的探活必须在**应用层心跳**做；连接的释放责任同样在应用层（finally/try-with-resources），CLOSE_WAIT 就是漏了这一步的现场。',
            '答题定位：握手挥手**流程本身**是基础题（见"计算机基础 → 计算机网络"）；这题的分水岭是能否把 ss 的输出翻译成"**谁主动关的、该改代码还是改参数**"的运维判断。',
          ],
          followUps: [
            {
              question: '百万长连接网关在内核层要调哪些参数？',
              points: [
                'fd 上限（`ulimit -n` / `fs.file-max`，epoll 本身无上限但 fd 有）。',
                '`somaxconn` 与应用 listen backlog 对齐（打满则 SYN 被丢）。',
                '每连接内存：`tcp_rmem/tcp_wmem` 自动调优 + 用户态对象开销；`ss -s` 各状态计数作为基线监控。',
              ],
            },
            {
              question: '压测时 QPS 早早见顶，机器上几十万 TIME_WAIT，处理顺序是什么？',
              points: [
                '先确认瓶颈真的是它：端口耗尽的标志是 `connect: Cannot assign requested address`（出方向无可用端口）——没这个报错，TIME_WAIT 只是"看起来吓人"，QPS 见顶另有原因。',
                '确认后按序处理：压测工具与被测服务都启用**连接复用**（HTTP keep-alive 没开是最常见元凶）→ `tcp_tw_reuse=1` → 扩 `ip_local_port_range`；并把 TIME_WAIT 数纳入容量基线——压测报告里应该有这个数。',
              ],
            },
          ],
        },
        {
          id: 'be-network-timer',
          title: '网络库里的高性能定时器怎么实现？时间轮、最小堆、红黑树怎么选？',
          difficulty: 'advanced',
          tags: ['定时器', '时间轮', '最小堆', '网络编程'],
          points: [
            '**场景先行（为什么需要专门的定时器结构）**：一个长连接网关上有**百万级定时任务**（每个连接的心跳超时、读写超时、重试退避、延迟任务）——定时器的四大操作（增、删、找最近到期、到期触发）在高频下的复杂度决定组件上限；朴素方案（链表遍历找最近、每秒全量扫描）在 10 万级就崩。与任务调度系统题分工：那题讲分布式调度架构，本题讲**单机定时器组件的数据结构**。',
            '**三种实现的对比（背熟这张表）**：**最小堆（priority queue by expire time）**——插入/删除 O(log n)，**取最近到期 O(1)**（堆顶就是下一个），配合事件循环把"堆顶到期时间 - now"交给 epoll_wait 的 timeout 参数（到点前安心休眠——nginx 早期、libevent 用堆/红黑树变体）；**红黑树**（nginx 定时器）——有序结构，增删 O(log n)，支持范围查询（扫某段时间内到期的一批），比堆多的能力是**按到期区间批量取**；**时间轮（Hashed Timing Wheel）**——见下，增删 **O(1)**，海量任务的王。',
            '**时间轮原理（游戏/网关面试的硬通货）**：一个环形数组（如 512 槽）+ 指针每 tick（如 10ms）走一格，任务按 `到期时间/tick % 槽数` 挂到槽的链表上——插入删除都是**链表操作 O(1)**，指针走到槽就触发整槽；**单层轮的局限**是最大延时受轮长限制 → **层级时间轮**（Kafka 的做法：秒级轮走完一圈才让分钟级轮的格子"降级"到秒级轮——像时钟的时分秒针，O(1) 支持任意时长；Netty 的 HashedWheelTimer 则是单层时间轮 + remainingRounds 计数）；代价：到期精度受 tick 粒度限制（tick 越细轮转越快——精度与 CPU 的权衡）。',
            '**工程细节（做过的人才知道的点）**：**到期处理的节奏**——每 tick 处理当前槽任务要快（慢了任务堆积拖垮事件循环——重活丢队列异步做，定时器只做触发）；**删除的两段式**（惰性删除：任务标记取消，走到时跳过——省去链表摘除的锁竞争；Netty 的实现是 O(1) 摘除 + 状态校验）；**多线程**（时间轮单线程驱动 + 任务投递到 worker 池执行——数据结构不跨线程共享，与事件循环模型天然匹配）；**海量连接心跳**的优化：超时检查不必每连接一个定时器——**时间轮扫描 + 最近活跃时间戳比对**（惰性清理：连 10 万个连接只挂 60 个"每秒一格"的扫描任务）。',
            '选型收束：**百~万级任务、要精确** → 最小堆/红黑树（实现简单）；**十万~百万级、增删频繁** → 时间轮（心跳/重试/游戏 buff 的标配）；配合事件循环（epoll timeout 联动堆顶 / tick 驱动时间轮）是网络库 timer 的两种经典装配——答出"你用的库是哪种装配"（如 Kafka = 层级时间轮、Netty = 单层轮 + remainingRounds、nginx = 红黑树）是真实感的临门一脚。',
          ],
          followUps: [
            {
              question: '「小根堆定时器一次 pop 一个，高并发下会不会有问题」——这道真题怎么答？',
              points: [
                '问题拆两层：**单线程事件循环下**（多数网络库）堆操作在循环线程内完成无锁，一次 pop 一次 tick 本身不是瓶颈——真正的风险是**一次到期一大批**（如重启后百万任务同刻到期）：循环线程忙着 pop 执行，IO 事件被饿死（心跳全超时的连锁雪崩）——解法：**每 tick 批量取上限**（一次最多处理 N 个，余下下个 tick 继续）+ 到期任务投递异步执行。',
                '多线程场景：堆加锁会成为竞争点（所有线程的插入都抢一把锁）——**分片定时器**（按连接哈希到多个时间轮/堆，各自单线程驱动）是标准解；这题的考点本质是"**数据结构复杂度之外，还要想并发模型与批量边界**"——答出饥饿场景与分片方案就到顶了。',
              ],
            },
          ],
        },
        {
          id: 'be-network-io-multiplexing',
          title: 'Reactor 网络模型是什么？单 Reactor、主从 Reactor 与 Proactor 有什么区别？',
          difficulty: 'intermediate',
          tags: ['Reactor', 'IO 多路复用', '网络模型'],
          points: [
            '动机先行："一个连接一个线程"让线程数随连接数爆炸（内存 + 上下文切换双杀）；**IO 多路复用**让一个线程监听成千上万个 fd（select/poll/epoll 的内核机制细节见"操作系统 → 文件系统与 IO"）——但多路复用只解决"**等事件**"，**Reactor 解决的是事件到了之后怎么组织代码**：事件分发器把就绪事件派发给对应处理器。',
            '三种 Reactor 形态：**单 Reactor 单线程**（Redis 6.0 前：accept、读写、命令执行一个线程全包——简单无锁，但任何慢操作阻塞全局）；**单 Reactor 多工作线程**（Reactor 只管 IO，业务丢线程池）；**主从 Reactor + 工作线程池**（Netty 与主流网关：主 Reactor 只管 accept，子 Reactor 各管一批连接的 IO，业务线程池处理——accept 与 IO 分离、IO 与业务分离，才能吃满多核）。',
            'epoll 在其中的角色（应用视角）：`epoll_wait` 的就绪列表是 Reactor 的事件源；连接的注册/注销对应 `epoll_ctl`；**LT/ET 是 Reactor 实现的关键决策**——ET 只通知一次，必须一次读尽 + 非阻塞 fd（Nginx 选 ET），漏读 = 连接假死的经典事故。',
            'Proactor 辨析：Reactor 是**同步非阻塞**——内核通知"可以读了"，应用自己读；Proactor 是**异步 IO**——内核把数据读完放进缓冲区后才回调应用（Windows IOCP 是代表；Linux 原生 AIO 限制多，io_uring 正在改写格局）。**"通知就绪"与"通知完成"是两者的分水岭**。',
            '关系收束：Redis/Node(libuv)/Go(netpoller)/Java NIO 底层都是 epoll + Reactor 的封装——**epoll 是地基，Reactor 是建筑**；答出"内核机制 → 设计模式 → 框架实现"这个层次关系，比背名词高一档。',
          ],
          followUps: [
            {
              question: 'epoll 一定比 select/poll 快吗？什么场景会退化？',
              points: [
                '连接少且大部分活跃时，epoll 的回调维护开销可能反而不如直接遍历。',
                '多进程/线程竞争同一 listen fd 有**惊群**问题——`EPOLLEXCLUSIVE`（内核只唤醒一个）或 `SO_REUSEPORT`（每 worker 独立监听队列）是两种主流解。',
              ],
            },
            {
              question: '零拷贝和 IO 多路复用是什么关系？',
              points: [
                '多路复用解决"**何时**可读写"，零拷贝解决"数据**怎么**搬运"。',
                '传统 read+write 是 4 次拷贝 4 次上下文切换，`sendfile`（配 SG-DMA）页缓存直达网卡、0 次 CPU 拷贝；Kafka 消费路径用 sendfile、RocketMQ 用 mmap，是两条零拷贝路线的代表。',
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'be-java',
      name: 'Java 与 JVM',
      description: '集合原理、JVM 内存与 GC、并发编程与 Spring 核心机制，Java 后端面试的重中之重。',
      references: [
        { label: 'Java 官方文档：java.util.concurrent 包说明', url: 'https://docs.oracle.com/javase/8/docs/api/java/util/concurrent/package-summary.html' },
        { label: 'Spring Framework 官方文档：核心技术（IoC 容器）', url: 'https://docs.spring.io/spring-framework/reference/core.html' },
      ],
      questions: [
        {
          id: 'be-java-hashmap',
          title: 'HashMap 的底层实现和扩容机制是怎样的？为什么线程不安全还要设计它？',
          difficulty: 'basic',
          tags: ['HashMap', '集合', '扩容'],
          points: [
            '结构：**数组 + 链表 + 红黑树**（JDK8）。定位：`(n-1) & hash`（容量为 2 的幂时等价于取模，位运算更快）；hash 是高 16 位异或低 16 位，让高位也参与定位、减少碰撞。',
            '链表长度 ≥ 8 且数组长度 ≥ 64 时树化（退化为 O(log n)）；树节点数 ≤ 6 退化回链表。阈值 8 与泊松分布有关：理想散列下单桶链表到 8 的概率约亿分之六（6×10⁻⁸），**树化是防御散列退化的兜底而不是常态**。',
            '扩容：默认容量 16、负载因子 0.75，元素数超 `capacity × 0.75` 就 **2 倍扩容**并 rehash；JDK8 优化：rehash 时元素要么留在原下标，要么去"原下标 + oldCap"，只需看新增位是 0 还是 1，不用重算 hash。',
            '线程不安全表现：并发 put 丢失更新、JDK7 头插法扩容成环导致死循环（JDK8 改尾插修复成环但仍丢数据）、size 不准。并发场景用 **ConcurrentHashMap**。',
          ],
          followUps: [
            {
              question: '为什么负载因子是 0.75？为什么建议初始化时指定容量？',
              points: [
                '0.75 是**空间利用率与冲突概率的折中**：过高冲突多（链表变长查询退化），过低浪费内存且扩容频繁。泊松分布下这是经验最优。',
                '不指定容量时从 16 开始多次扩容，每次都要 rehash 全表（O(n) 且 STW 敏感）；已知规模时应设 `expectedSize / 0.75 + 1`（Guava 的 Maps.newHashMapWithExpectedSize 就这么算），把扩容压到 0 次。',
              ],
            },
            {
              question: 'key 用可变对象会发生什么？String 做 key 为什么合适？',
              points: [
                'put 后修改 key 的 hashCode 字段，get 时算出不同桶位——**数据"丢失"**（还在数组里但定位不到），这是经典事故。',
                'String 合适：不可变保证 hash 稳定、已缓存 hashCode、内部equals/hashCode 实现正确。原则：**equals 相等的对象必须 hash 相等**，重写 equals 必须重写 hashCode。',
              ],
            },
          ],
        },
        {
          id: 'be-java-generics',
          title: 'Java 泛型的类型擦除是什么？带来了哪些限制和坑？',
          difficulty: 'intermediate',
          tags: ['Java', '泛型', '类型擦除'],
          points: [
            '**类型擦除**：Java 泛型是**编译期的语法糖**——编译后 `List<String>` 与 `List<Integer>` 都是同一个 `List`（原始类型），类型参数在运行时被擦除（替换为上界或 Object）；证据链：`new ArrayList<String>().getClass() == new ArrayList<Integer>().getClass()` 为 true、运行时拿不到 `T.class`。',
            '**擦除带来的限制清单（必背）**：不能 `new T()`（运行时不知道 T）、不能 `new T[]` 与泛型数组的协变问题、**静态成员不能引用类的类型参数**、不能 `instanceof List<String>`（只判原始类型）、**基本类型不能做类型参数**（`List<int>` 非法 → 装箱开销，这是泛型性能的隐形坑）；**重载冲突**：`f(List<String>)` 与 `f(List<Integer>)` 签名相同编译不过。',
            '**桥方法（加分细节）**：擦除后接口/父类的抽象方法签名与子类实现不匹配时，编译器生成**合成桥方法**维持多态——`class MyComparator implements Comparator<String>` 擦除后父类方法是 `compare(Object,Object)`，子类的 `compare(String,String)` 之外会多一个委托的桥方法；反射看方法列表会见到 `bridge` 标记——讲得出桥方法说明真懂擦除的机制层。',
            '**通配符与 PECS**：`? extends T`（生产者，只读）与 `? super T`（消费者，只写）——**Producer Extends, Consumer Super**；为什么需要：泛型不变型（`List<String>` 不是 `List<Object>` 的子类型）的补偿机制，保证类型安全的同时保留协变/逆变表达。横向对比收尾：**Kotlin 的 reified 具化泛型、C# 的具化泛型（运行时保留 T，可 new T）证明擦除是 Java 的历史选择而非必然**（兼容 5.0 之前的海量字节码）。',
          ],
          followUps: [
            {
              question: '运行时真的完全拿不到泛型信息吗？那些框架是怎么解析泛型返回值的？',
              points: [
                '**部分场景能拿到**：擦除擦的是"对象实例"的类信息，但**字段、方法签名、类继承声明里的泛型被完整保留在 Class 元数据**（Signature 属性）——所以 `getGenericReturnType()` 能拿到 `List<User>`，Jackson/Fastjson 反序列化 `Result<User>` 靠的是方法签名而非运行时对象；匿名子类/子类继承（`new TypeReference<List<User>>(){}`）也是同理（超类签名保留）。',
                '边界：局部变量、运行时 new 出来的实例本体拿不到（`new ArrayList<String>()` 的实例不知道自己装 String）；这个"**声明处保留、实例处擦除**"的区别就是框架能做泛型解析而你不能 `new T()` 的完整解释——答到这一层基本到顶了。',
              ],
            },
            {
              question: 'List<?> 赋值后为什么不能 add 任何元素？（浙大真题：三行代码哪行编译错）',
              points: [
                '`List<Double> ls; List<?> lo = ls; lo.add(new Object());` ——第三行**编译错**：`?` 是未知类型（capture-of-?），编译器无法证明任何类型安全地写进去（除 null 外）——**通配符类型是只读的 producer**。读取侧 `ls.get(0)` 也只能得到 Object（不能赋给 String）。',
                '这就是 PECS 的实操面：`? extends` 只读、`? super` 只写（可写 T 及其子类，读出是 Object）——**编译器用"限制写"换"允许协变赋值"**。想又能读又能写，就用精确类型 `List<Double>`。',
              ],
            },
          ],
        },
        {
          id: 'be-java-concurrenthashmap',
          title: 'ConcurrentHashMap 在 JDK7 和 JDK8 中的实现有什么区别？size 怎么保证准确？',
          difficulty: 'intermediate',
          tags: ['ConcurrentHashMap', '并发', 'CAS'],
          points: [
            '**JDK7 分段锁**：16 个 Segment（继承 ReentrantLock），锁粒度是段，并发度默认 16（由 concurrencyLevel 决定，可配）；**JDK8 抛弃分段**：`Node 数组 + 链表/红黑树`，**锁粒度细化到每个桶头节点**（synchronized 锁头节点），未冲突的桶用 CAS 写入，并发度=数组长度。',
            '写路径：桶空 → CAS 放头节点；非空 → synchronized 锁头节点再链表/树操作；正在扩容的桶（ForwardingNode）→ 帮助迁移（**多线程协助扩容 helpTransfer**，按步长分桶）。',
            '**size 用 CounterCell 数组分散计数**（LongAdder 思想）：baseCAS 失败说明有竞争，改为给各线程哈希到不同 Cell 累加，size() 时求和——是弱一致的估计值（并发下本就没有全局精确时刻）。',
            '为什么用 synchronized 而不是 ReentrantLock：锁竞争激烈时 synchronized（自适应自旋+锁升级）已不弱，且省对象头外的内存、JVM 持续优化。',
          ],
          followUps: [
            {
              question: 'ConcurrentHashMap 的 get 需要加锁吗？它如何保证读到不完整结构的正确性？',
              points: [
                'get 全程无锁：Node 的 val 和 next 用 **volatile** 修饰，保证可见性与有序性；树化时链接关系通过并发安全的迁移步骤保证读侧不悬空（读到 TreeBin 时有读写锁保护旋转）。',
                '这正是"写时复制引用 + volatile 读"的典型组合：**写路径加锁，读路径靠 volatile**，读完全无阻塞。',
              ],
            },
          ],
        },
        {
          id: 'be-java-jvm-memory',
          title: 'JVM 内存区域是怎么划分的？哪些区域会 OOM，哪些会栈溢出？',
          difficulty: 'basic',
          tags: ['JVM', '内存模型', 'OOM'],
          points: [
            '**线程私有**：程序计数器、**虚拟机栈**（栈帧：局部变量表/操作数栈，-Xss 控制大小，递归过深抛 StackOverflowError）、本地方法栈。**线程共享**：堆（对象实例，-Xmx/-Xms）、方法区（JDK8 起为元空间 Metaspace，**用本地内存**存类元数据，-XX:MaxMetaspaceSize）。',
            '堆内部分区：新生代（Eden + 两个 Survivor，默认 8:1:1）+ 老年代；对象优先在 Eden 分配，Survivor 间每熬过一次 Minor GC 年龄 +1，默认 15 岁晋升（动态年龄判定：同龄对象超 Survivor 一半直接晋升）。',
            'OOM 场景对应区域：堆 OOM（`OutOfMemoryError: Java heap space`，大对象/泄漏）、元空间 OOM（动态生成类失控：CGLib、Groovy、反射滥用）、栈溢出 vs 栈内存耗尽（无法创建新线程：`unable to create native thread`——线程数×栈大小超过进程限制）、直接内存 OOM（NIO DirectByteBuffer）。',
            '大对象直接进老年代（Serial/ParNew 下超过 -XX:PretenureSizeThreshold；G1 按对象 ≥ Region 一半判定 Humongous）；长期存活对象、动态年龄判定也会提前晋升——**新生代调优的本质是让"朝生夕死"的对象都死在 Minor GC**。',
          ],
          followUps: [
            {
              question: '为什么 JDK8 用元空间替换永久代？字符串常量池在哪里？',
              points: [
                '永久代在堆内、大小固定（-XX:MaxPermSize），动态类加载容易 OOM 且 GC 调优复杂；元空间用本地内存，默认只受物理内存限制，类元数据随 Full GC 卸载（类加载器回收时）。',
                '字符串常量池 JDK7 起从方法区**移到堆**——因为 `String.intern()` 大量使用时永久代容易爆，移到堆可以参与正常的分代回收。',
              ],
            },
          ],
        },
        {
          id: 'be-java-virtual-thread',
          title: 'Java 虚拟线程是什么？它和平台线程、Go 协程有什么区别？',
          difficulty: 'intermediate',
          tags: ['虚拟线程', 'Java 21', '并发'],
          points: [
            '**虚拟线程（Java 21 正式，Project Loom）**是 JVM 管理的轻量线程：不再 1:1 映射操作系统线程，而是由 JVM 把大量虚拟线程**调度到少量载体线程（carrier，平台线程）**上运行。创建成本从"约 1MB 栈 + 内核调用"降到可百万级并发，`Thread.ofVirtual().start()` 或 `Executors.newVirtualThreadPerTaskExecutor()` 即可用。',
            '**解决的问题：阻塞的成本**。传统服务端"一请求一线程"受限于线程数（几百上千就到顶），于是催生了响应式编程（WebFlux/CompletableFuture 链）——性能好但代码难写难调。虚拟线程让**同步阻塞写法拥有异步的吞吐**：阻塞点由 JVM 感知，把虚拟线程**从载体线程上挂起（unmount）**，载体继续跑别人，恢复时再挂回来。',
            '**与 Go 协程的异同**：同为用户态调度的 M:N 模型；差异在**抢占与阻塞面**——Go 调度器有基于信号的**异步抢占**（防长循环饿死），且 runtime 把网络 IO 全部做成非阻塞集成进调度；**虚拟线程目前是协作式的**：I/O 与 JDK 阻塞点会让出载体，但 CPU 密集循环不让出（会占住载体线程），且 pinned 场景（synchronized 块内阻塞、native 方法，JDK 24 已大幅修复 synchronized pinning）不会释放载体。',
            '**适用与不适用**：适合 **IO 密集、高并发阻塞**场景（网关、爬虫、聚合调用、迁移老的 Thread-Per-Request 应用）；不适合 CPU 密集（就给核数那么多平台线程），也**不是"越多越好"**——下游连接池、数据库连接数才是新的瓶颈，无限并发只是把压垮点后移。',
          ],
          followUps: [
            {
              question: '有了虚拟线程还需要响应式编程（WebFlux）吗？ThreadLocal 在虚拟线程下还有效吗？',
              points: [
                '**绝大多数场景不需要了**：响应式的核心卖点是"用少量内核线程扛阻塞 IO"，虚拟线程用同步写法达成同样吞吐，可读性、调试、JVM 生态（阻塞式 JDBC/HTTP client）全面占优；响应式退守到**背压流处理**（真正需要 reactive streams 语义的数据流）这一细分场景。这是官方也认可的口径。',
                '**ThreadLocal 有效且更便宜**：每个虚拟线程有自己的 ThreadLocalMap，行为不变；而且虚拟线程海量创建，"池化复用 + ThreadLocal 脏状态"的老问题消失——新任务新线程，天然干净。跨虚拟线程传递仍用 ScopedValue（Scoped Values，不可变、有作用域，是 ThreadLocal 的现代替代）——能提到 ScopedValue 是 Java 21+ 的加分项。',
              ],
            },
          ],
        },
        {
          id: 'be-java-graalvm',
          title: 'GraalVM 原生镜像（Native Image）为什么启动只要几十毫秒？代价是什么？',
          difficulty: 'advanced',
          tags: ['GraalVM', 'AOT', '云原生', 'Java'],
          points: [
            '**原理一句话：把"运行时才做的工作"全部提前到构建期**——传统 JVM 启动要加载类、初始化、JIT 边跑边编译（预热期吞吐低）；Native Image 在**构建时做封闭世界分析（closed-world）**：从 main 出发静态可达的代码全部 AOT 编译成机器码，类初始化与堆初始状态**快照（heap snapshot）**进镜像——启动 = 把镜像映射进内存，几十毫秒级、**内存占用常降一半以上**、峰值性能无预热期（没有 JIT 也有 C2 级别的静态优化 + PGO 配合）。',
            '**代价清单（这题的区分度全在代价上）**：① **封闭世界假设与动态字节码冲突**——反射、动态代理、JNI、动态类加载（ServiceLoader）、字节码增强（CGLIB/ASM）运行时才确定类型，AOT 看不见 → 需要**reachability metadata 配置**（手动登记反射类/方法，社区 reachability metadata 仓库就是干这个的），漏配 = 运行时 ClassNotFound/反射失败类玄学错误，**配置成本是迁移的主要工作量**；② 构建慢（分钟级）且要大内存；③ **无 JIT 的峰值反优化风险**：激进去虚化、Profile-Guided Optimization（PGO）能补，但极端动态场景仍可能落后 JIT；④ 调试/监控工具链差异（堆 dump 格式、JFR 支持逐步完善）。',
            '**适用场景的清醒判断**：**Serverless/FaaS**（冷启动就是钱，按毫秒计费的场景 native 是质变）、**CLI 工具与本地脚本**（Java 做 CLI 一直被启动慢劝退，native 后与 Go 同台）、**K8s 弹性扩缩容密集**的场景（扩容快、镜像密度高）；**不适合**：长时间运行的重型服务（JIT 预热后的峰值与 GC 成熟度更优，收益小配置成本大）、强依赖运行时动态性的系统（老 ORM、老 RPC 框架）。',
            '**生态现状口径**：Spring Boot 3+ 的 **Spring AOT**（构建期做 bean 冗余消除与代理提示，为 native 做准备，`spring-boot:build-image` 一键）、Micronaut/Quarkus（从设计之初就少反射、编译期 DI，对 native 更友好——这也是它们诞生的重要动机）；**虚拟线程与 native 的关系**：虚拟线程解决"阻塞 IO 的吞吐"，native 解决"启动与内存"，两者正交可组合——把它们放在一起对比说明懂两条线的分工。',
            '收束格局：Java 在云原生时代对 Go 的劣势项（启动、内存、镜像大小）被 GraalVM 补齐，代价是放弃一部分"动态性自由"；判断标准回到业务形态——**生命周期越短（函数级）、实例越密（弹性扩缩），native 收益越大；生命周期越长（常驻服务），JIT 越香**。',
          ],
          followUps: [
            {
              question: '听说过 CRaC（Coordinated Restore at Checkpoint）吗？它和 AOT 是什么关系？',
              points: [
                '**CRaC 是另一条路线：运行时快照恢复**——先把应用在 JVM 上完整启动并预热（JIT 已优化、连接池已建好），然后**检查点转储整个 JVM 状态**（CRIU 技术），之后每次"启动"都是恢复快照——兼得"启动即预热"与 JIT 峰值性能，且**不需要封闭世界**（运行时动态性不受影响）；代价：依赖 Linux CRIU、快照恢复时机敏感（网络连接、时间相关状态要处理）。',
                '对比口径：AOT = 构建期优化（静态、可预测、丢动态性）；CRaC = 运行时快照（保留 JIT、依赖 OS 能力）；还有 **Leyden 项目**（OpenJDK 官方把 AOT 渐进引入 JVM 的长期路线）。三条路线并进说明"启动慢"是 JVM 的战略级补课——能把这个版图讲清楚，是 JVM 生态视野的直接证明。',
              ],
            },
          ],
        },
        {
          id: 'be-java-gc',
          title: '主流垃圾收集器的演进脉络是怎样的？CMS 为什么被 G1 取代？',
          difficulty: 'advanced',
          tags: ['GC', 'G1', 'ZGC'],
          points: [
            '算法基础：**标记-清除**（碎片）、**标记-复制**（新生代，空间换时间无碎片）、**标记-整理**（老年代）；判活用**可达性分析**（GC Roots：栈引用、静态变量、JNI 引用等），弥补不可达对象靠引用链遍历——这也是"循环引用不需要手动处理"的原因。',
            '演进主线是**缩短停顿（STW）**：Serial/Parallel（全停顿、吞吐优先）→ **CMS**（并发标记清除，首次把老年代停顿拆散）→ **G1**（区域化堆、可预测停顿）→ **ZGC/Shenandoah**（着色指针/读屏障实现并发整理，停顿 <1ms 与堆大小无关）。',
            '**CMS 被取代的原因**：① 标记-清除产生**内存碎片**，最后被迫 Full GC（Serial 整理）长停顿；② 并发阶段与用户线程抢 CPU；③ **并发失败（concurrent mode failure）**：老年代分配速度超过回收速度就退化为全停顿；④ 维护成本高，JDK14 移除。',
            '**G1 核心**：堆划成 2048 个等大 Region（Eden/Survivor/Old/Humongous 都是逻辑角色）；**按停顿目标（-XX:MaxGCPauseMillis，默认 200ms）优先回收"垃圾占比最高"的 Region**（垃圾优先 Garbage First 的由来）；Remembered Set 维护跨 Region 引用。',
          ],
          followUps: [
            {
              question: 'ZGC 为什么能把停顿做到亚毫秒且和堆大小无关？',
              points: [
                '关键在**着色指针 + 读屏障**：把 GC 元信息（标记、重定位状态）存进 64 位指针的高位 bit，并发搬移对象时，**用户线程访问旧地址会被读屏障捕获并自愈**（转发到新地址、修正指针），搬运全程并发。',
                '对比 G1：整理（搬对象）仍需 STW，堆越大搬得越久；ZGC 把"搬"也并发化，停顿只与**根扫描**相关，与堆规模解耦——代价是吞吐让渡（读屏障开销）。',
              ],
            },
            {
              question: '线上发生 Full GC 频繁/长停顿，你的排查路径是什么？',
              points: [
                '先定位类型：`jstat -gcutil` 看 FGC 频次与各代占用；开 `-Xlog:gc*`（JDK11+）或 GC 日志分析工具（gceasy）。',
                '常见根因：① 内存泄漏（老年代持续增长不回落）→ `jmap -histo:live` / MAT 分析支配树找泄漏对象；② 元空间不足（动态类生成）；③ 大对象/缓存无界（Humongous 区、老年代碎片）；④ 显式 System.gc() 或堆外内存间接触发。',
                '处置：修复泄漏源 > 调参（堆大小、G1 Region 大小、停顿目标）> 换收集器（大堆低延迟上 ZGC）。',
              ],
            },
          ],
        },
        {
          id: 'be-java-classloader',
          title: '类加载过程和双亲委派模型是怎样的？什么场景需要打破它？',
          difficulty: 'intermediate',
          tags: ['类加载', '双亲委派'],
          points: [
            '生命周期：**加载**（读字节流生成 Class 对象）→ **验证**（字节码合法性/安全性）→ **准备**（静态变量分配并赋零值）→ **解析**（符号引用转直接引用，可延迟）→ **初始化**（执行 `<clinit>`：静态变量赋值 + 静态块，保证线程安全由 JVM 加锁实现）。',
            '类初始化是**懒加载**：首次主动引用（new、访问静态变量/方法、反射）才触发；被动引用（子类引用父类静态字段、数组定义、常量）不触发——这是"类什么时候初始化"的经典考点。',
            '**双亲委派**：Application → Platform/Extension → Bootstrap 逐级向上委派，父加载器找不到才自己加载。价值：① **安全**（自定义 java.lang.String 不会替换核心类）；② **唯一性**（同一个类由同一加载器加载，类的相等性 = Class 对象相等，包括加载器相等）。',
            '打破场景：**SPI/线程上下文类加载器**（JDBC：核心库要加载 classpath 下厂商实现）、**热部署/热更新**（自定义加载器重新加载改动的类，配合卸载）、**容器隔离**（Tomcat 每个 webapp 独立加载器实现依赖隔离）、**模块化**（OSGi/JPMS 网状委派）。',
          ],
          followUps: [
            {
              question: '同一个类被两个加载器加载，instanceof 会怎样？这对热部署意味着什么？',
              points: [
                '不同加载器加载的同一个类是**两个不同的 Class**，互相 instanceof 为 false、赋值抛 ClassCastException——"类的身份 = 全限定名 + 定义类加载器"。',
                '热部署因此必须**整体替换旧加载器**：新代码用新加载器加载，旧加载器及其所有实例 Class 无引用后才能被 GC（这也是热部署残留内存泄漏的高发点：静态缓存、线程还持有旧类）。',
              ],
            },
          ],
        },
        {
          id: 'be-java-thread-pool',
          title: '线程池的核心参数有哪些？任务提交后的执行流程？为什么不建议用 Executors 快捷方法？',
          difficulty: 'basic',
          tags: ['线程池', '并发'],
          points: [
            '七参数：**corePoolSize**（常驻线程）、**maximumPoolSize**（上限）、**keepAliveTime**（非核心空闲存活时间）、**workQueue**（任务队列）、**threadFactory**（命名定制，排查必备）、**rejectedHandler**（拒绝策略）、（allowCoreThreadTimeOut）。',
            '提交流程（顺序易考错）：**当前线程数 < core → 建核心线程执行；否则入队；队列满 → 建非核心线程；达到 max → 执行拒绝策略**。注意是"先入队后扩容"，与直觉相反。',
            '拒绝策略：AbortPolicy（抛异常，默认）、CallerRunsPolicy（**调用者线程执行，天然反压**，常为最佳选择）、DiscardPolicy/DiscardOldestPolicy（静默丢弃，危险）。',
            '**不推荐 Executors 的原因**：newFixedThreadPool/newSingleThreadExecutor 用**无界 LinkedBlockingQueue**（任务堆积 → OOM）；newCachedThreadPool 最大线程数 Integer.MAX_VALUE（线程爆炸）。生产规范（阿里）要求手动 new ThreadPoolExecutor 明确每个参数。',
          ],
          followUps: [
            {
              question: 'corePoolSize 和 maxPoolSize 应该怎么设？队列选有界还是无界？',
              points: [
                '经验起点：**CPU 密集 ≈ 核数 + 1；IO 密集 ≈ 核数 × (1 + 等待/计算比)**，再靠压测校准——目标是 CPU 利用率打满且队列不积压导致超时。',
                '队列必须**有界**：无界队列 = 把 OOM 埋在后面，且 maxPoolSize 永远不生效、故障被延迟暴露；有界后配合 CallerRuns 反压或快速失败 + 降级。',
                '场景化：在线接口追求低延迟（小队列快速拒绝），离线批处理追求吞吐（大队列 + 高 max）。',
              ],
            },
            {
              question: '线程池里抛出的异常去哪了？怎么监控线程池健康度？',
              points: [
                'execute() 提交的任务异常会**打印栈到 stderr 后线程结束重建**；submit() 返回 Future，异常被**吞在 Future 里**，不 get 就永远看不到——"任务莫名失败"的高发原因。',
                '监控：活跃线程数/队列长度/已完成数（ThreadPoolExecutor 的 getter 接入指标）、任务执行时间分位数、拒绝次数告警；全局 UncaughtExceptionHandler 兜底记录。',
              ],
            },
          ],
        },
        {
          id: 'be-java-synchronized-lock',
          title: 'synchronized 的锁升级过程是怎样的？和 ReentrantLock 怎么选？',
          difficulty: 'advanced',
          tags: ['synchronized', '锁升级', 'AQS'],
          points: [
            '对象头 Mark Word 存锁状态：**无锁 → 偏向锁 → 轻量级锁 → 重量级锁**（只升不降）。偏向锁：只有一个线程反复进入，Mark Word 记线程 id，**零成本重入**（JDK15 起默认废弃——撤销成本高于收益）；轻量级锁：交替竞争时栈上 Lock Record + CAS 自旋获取，避免内核介入；竞争激烈自旋失败 → 膨胀为重量级锁（ObjectMonitor，依赖 OS mutex，涉及内核态切换）。',
            '字节码层面：同步方法用 ACC_SYNCHRONIZED 标志，同步块是 monitorenter/monitorexit（配对 + 异常出口也有一条 exit）。',
            '**ReentrantLock**：基于 AQS（volatile state + CLH 变体队列 + LockSupport.park/unpark），能力扩展：**公平锁、可中断、超时（tryLock）、多条件变量 Condition、读写锁**。',
            '选择：默认 synchronized（JVM 持续优化、不用手动解锁、内存更省）；需要上述高级语义或读写分离时用 ReentrantLock/ReentrantReadWriteLock。',
          ],
          followUps: [
            {
              question: 'AQS 的核心原理是什么？用 ReentrantLock 的加锁路径走一遍。',
              points: [
                'AQS = **volatile int state（语义由子类定义）+ CLH 双向队列（线程封装成 Node 自旋+park）+ 模板方法**：tryAcquire 由子类实现，获取失败由 AQS 负责入队挂起。',
                'NonfairSync.lock：先 CAS 抢 state（0→1，插队机会）；失败走 acquire → tryAcquire（可重入：同线程 state+1）→ addWaiter 入队 → acquireQueued（队列内自旋检查前驱是否 head，是则再抢，否则 park）。',
                '公平锁的区别就是跳过"先 CAS 插队"这一步，直接判断队列里有没有人排队。解锁：state-1 归零后 unpark 后继节点。',
              ],
            },
          ],
        },
        {
          id: 'be-java-volatile',
          title: 'volatile 的语义是什么？为什么它不能保证原子性？happens-before 是什么？',
          difficulty: 'intermediate',
          tags: ['volatile', 'JMM', '内存屏障'],
          points: [
            '两个语义：① **可见性**：写 volatile 变量立即刷回主存（缓存一致性协议使其他核缓存行失效），读总是最新值；② **禁止指令重排**：JMM 通过插入内存屏障（StoreStore/StoreLoad/LoadLoad/LoadStore）建立顺序约束。',
            '**不保证原子性**：`count++` 是读-改-写三步，volatile 只保证每一步读到最新值，但两线程交错执行仍会丢失更新——复合操作用 AtomicXxx（CAS）或锁。',
            '**happens-before**：JMM 给程序员的前趋关系承诺——程序顺序规则、监视器锁规则、**volatile 规则（写先于后续读）**、线程 start/join 规则、传递性等；满足 hb 关系就无需担心重排，JMM 对编译器/处理器的约束则按"尽可能少插入屏障"实现——同一模型，两种视角。',
            '经典应用：**DCL 单例**必须 volatile（防止"分配内存→初始化→赋引用"被重排为 1→3→2，另一线程拿到未初始化对象）；volatile 还常用于状态标志位、依赖变量发布（安全发布对象）。',
          ],
          followUps: [
            {
              question: 'AtomicLong 高并发下有什么问题？LongAdder 为什么快？',
              points: [
                'AtomicLong 所有线程 CAS 同一个 value，竞争激烈时**自旋重试风暴**，CAS 失败率高导致性能崩塌。',
                'LongAdder：**分散热点**——无竞争走 base CAS，有竞争给当前线程哈希到独立 Cell 累加，sum() 时求和；代价是 sum 是**瞬时非原子快照**（适合统计，不适合需要精确同步值的场景）。ConcurrentHashMap 的 size 用的是同一思想。',
              ],
            },
            {
              question: 'wait/notify 为什么定义在 Object 上而不是 Thread？两个对象交叉加锁为什么死锁？（浙大真题）',
              points: [
                '**锁在对象上**：Java 的监视器（synchronized）以**每个对象**为单位（锁信息在对象头 Mark Word）——wait/notify 操作的是"所属对象的等待队列"，自然定义在所有对象的根类 Object 上；**必须已持有该对象的锁才能调用**（IllegalMonitorStateException），且要在 synchronized 块内。',
                '**双对象死锁真题**：`synchronized void work(A other) { synchronized(other) {...} }`——t1 执行 a1.work(a2)（先锁 a1 再锁 a2），t2 执行 a2.work(a1)（先锁 a2 再锁 a1）——**加锁顺序相反**，互相持有对方要的锁 → 死锁。规避：全程序统一加锁顺序 / tryLock 超时 / 缩小锁粒度（与操作系统方向死锁题、MySQL 锁题同一套理论）。',
              ],
            },
          ],
        },
        {
          id: 'be-java-spring-ioc-aop',
          title: 'Spring IoC 和 AOP 的实现原理是什么？',
          difficulty: 'intermediate',
          tags: ['Spring', 'IoC', 'AOP'],
          points: [
            '**IoC 控制反转**：对象的创建与依赖装配由容器接管（依赖注入是手段）。容器核心是 **BeanFactory/ApplicationContext**：加载 BeanDefinition（配置元数据）→ 注册到 BeanDefinitionMap → refresh() 时对非懒加载单例走 getBean → **三级缓存解决字段/Setter 注入的循环依赖**（构造器注入不可解）→ 生命周期回调。',
            '依赖注入三种方式：构造器（**推荐**：不可变、依赖必填、利于测试与循环依赖暴露）、Setter、字段 @Autowired（隐藏依赖，不利测试）。',
            '**AOP 动态代理**：目标类有接口 → **JDK 动态代理**（实现 InvocationHandler，运行时生成接口实现类）；无接口 → **CGLIB**（生成目标类子类，方法拦截；final 类/方法无法代理；Spring Boot 2.0+ 默认 proxy-target-class=true，**有接口也走 CGLIB**）。代理链 = 拦截器链，按 @Order 排序递归执行（类似洋葱）。',
            'AOP 经典坑都是"**自调用不走代理**"：this.methodB() 不经过代理对象，@Transactional/@Async/@Cacheable 失效——解法：注入自身代理（AopContext.currentProxy）、拆类、或改用 AspectJ 编织。',
          ],
          followUps: [
            {
              question: 'Bean 的作用域有哪些？prototype 的 Bean 注入到 singleton 会有什么问题？',
              points: [
                'singleton（默认，容器内单例）、prototype（每次 getBean 新建）、request/session（Web 上下文）、application/websocket。',
                'singleton 注入 prototype：注入只发生一次，之后用的都是**同一实例**——prototype 语义丢失。解法：@Lookup 方法、ObjectFactory/Provider 延迟获取，或 scoped-proxy。',
              ],
            },
          ],
        },
        {
          id: 'be-java-spring-bean-lifecycle',
          title: 'Spring Bean 的生命周期是怎样的？三级缓存如何解决循环依赖？',
          difficulty: 'advanced',
          tags: ['Spring', 'Bean 生命周期', '循环依赖'],
          points: [
            '主线：实例化（构造器）→ 属性填充（依赖注入）→ **Aware 回调**（BeanNameAware/ApplicationContextAware…）→ **BeanPostProcessor 前置** → 初始化（@PostConstruct → InitializingBean.afterPropertiesSet → init-method）→ **BeanPostProcessor 后置（AOP 代理在此生成）** → 使用 → 销毁（@PreDestroy → DisposableBean.destroy）。',
            '**三级缓存**：① singletonObjects（成品）、② earlySingletonObjects（半成品实例）、③ singletonFactories（ObjectFactory）。A 创建中依赖 B：A 实例化后先把"获取早期引用的工厂"放三级缓存 → B 创建时通过工厂拿到 A 的早期引用 → B 完成 → A 继续。**只对字段/Setter 注入的单例有效，构造器注入无法解决**（实例化都没完成）。',
            '为什么需要工厂而不是直接放半成品：**AOP 代理应尽量在初始化后生成**；若 A 被 B 依赖，工厂保证需要时才提前生成代理（提前了就记录，避免重复创建），无循环依赖时走正常生命周期。',
            'Spring Boot 2.6+ 默认**禁止循环依赖**（启动报错）——官方态度：循环依赖是设计问题的信号，应重构（拆分职责、事件解耦、@Lazy 治标）。',
          ],
          followUps: [
            {
              question: '为什么构造器注入的循环依赖 Spring 不帮我们解决？',
              points: [
                '三级缓存的前提是"实例化"和"属性注入"分离——可以先用未注入属性的半成品给别人引用。构造器注入**创建对象本身就依赖对方**，鸡生蛋问题无解（除非提前暴露未初始化对象，破坏语义）。',
                '强制报错反而是设计约束：循环依赖意味着两个类职责纠缠，拆出公共依赖类或用事件/中间者解耦才是正解。',
              ],
            },
          ],
        },
        {
          id: 'be-java-spring-transaction',
          title: 'Spring 事务的传播行为有哪些？事务失效的常见场景你能列全吗？',
          difficulty: 'advanced',
          tags: ['Spring', '事务'],
          points: [
            '传播行为核心几个：**REQUIRED**（默认：有事务加入，没有新建）、**REQUIRES_NEW**（挂起当前，开新事务，两者独立提交回滚）、**NESTED**（保存点，外层回滚带动内层，内层可独立回滚）、SUPPORTS/NOT_SUPPORTED/MANDATORY/NEVER（语义组合）。',
            '失效场景清单：① **自调用**（this 调用不走代理，最高频）；② 方法非 public（代理拦截不到）；③ 异常被 try-catch 吞掉；④ **默认只回滚 RuntimeException/Error**，受检异常要 rollbackFor=Exception.class；⑤ 数据库引擎不支持（MyISAM）；⑥ 事务方法内新开线程操作数据库（不在同一连接）；⑦ 多线程调用事务方法；⑧ 传播行为配错（如 NOT_SUPPORTED）。',
            'REQUIRES_NEW 与 NESTED 的区别：前者**两个独立连接、独立事务**（外层回滚不影响内层已提交），后者**同一连接的保存点**（外层回滚全回滚，内层可局部回滚），性能也更好。',
            '`@Transactional` 大事务治理：事务内不做 RPC/不发 MQ/不查大量数据——**把 IO 移出事务**，否则长事务放大锁持有与连接池占用。',
          ],
          followUps: [
            {
              question: '事务里先 update 再发 MQ，如何保证"数据库和消息"的一致性？',
              points: [
                '绝不能先发后改（消息先出、事务回滚 = 假消息），也不该事务内直接发（发送成功后回滚 = 假消息，且拉长事务）。',
                '正确姿势是**事务性消息**：本地消息表（同库事务内写消息记录，事务提交后异步投递+对账重试）或 RocketMQ 半消息事务回查机制——都是"把「发消息」变成可重试的最终一致动作"。',
              ],
            },
          ],
        },
        {
          id: 'be-springboot-autoconfig',
          title: 'Spring Boot 的自动配置（@EnableAutoConfiguration）是怎么工作的？',
          difficulty: 'intermediate',
          tags: ['Spring Boot', '自动配置', '条件注解'],
          points: [
            '入口是 **@SpringBootApplication**，它是三个注解的组合：@SpringBootConfiguration（配置类）、@ComponentScan（扫当前包及子包）、**@EnableAutoConfiguration**——自动装配的核心在第三个。',
            '**加载机制**：@EnableAutoConfiguration 通过 @Import 引入 AutoConfigurationImportSelector，它从所有 jar 包的 **`META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports`** 文件（Boot 2.7 前是 spring.factories）里读出**候选配置类全名列表**，再逐一筛选。',
            '**筛选靠条件注解**：@ConditionalOnClass（类路径有这个类才生效——这就是"引入 starter 依赖即自动配置"的机制）、@ConditionalOnMissingBean（用户没自己定义才生效——**保证用户配置优先**）、@ConditionalOnProperty（开关属性）。最终只有满足条件的配置类里被 @Bean 标注的方法会注册进容器。',
            '**starter 的本质**：一个"依赖聚合 + 自动配置"包——引入 `spring-boot-starter-web` 就把 spring-mvc、tomcat、jackson 拉进来，对应的 WebMvcAutoConfiguration 因 @ConditionalOnClass(Servlet.class) 满足而生效。面试落地题：**自定义 starter** = 写配置类 + 条件注解 + 配置属性类（@ConfigurationProperties）+ 在 imports 文件登记。',
          ],
          followUps: [
            {
              question: '自动配置和自己写的 @Bean 冲突了怎么办？怎么排查某个自动配置没生效？',
              points: [
                '设计上**用户配置永远赢**：自动配置类都标了 @ConditionalOnMissingBean，容器先处理用户的 @Component/@Bean（@ComponentScan 阶段），再处理自动配置（按条件跳过已存在的）。真冲突时排查思路：看条件评估报告——启动加 **--debug** 输出**条件评估报告**（哪些自动配置匹配/不匹配、原因），或用 Spring Actuator 的 conditions 端点。',
                '加载顺序细节：@AutoConfigureBefore/After 控制自动配置之间的顺序；@Order/@AutoConfigureOrder 影响同类型 Bean 的优先级。能说出"先用户后自动配置"这条总原则加"conditions 报告"这个排查工具，基本就是生产经验答案。',
              ],
            },
          ],
        },
        {
          id: 'be-java-threadlocal',
          title: 'ThreadLocal 的实现原理是什么？为什么会内存泄漏？跨线程传递怎么解决？',
          difficulty: 'intermediate',
          tags: ['ThreadLocal', '内存泄漏', '并发'],
          points: [
            '结构：每个 **Thread 持有自己的 ThreadLocalMap**（不是 ThreadLocal 持有 map），key 是 ThreadLocal 的**弱引用**、value 是强引用；set/get 都以当前线程为入口，天然线程隔离、无竞争。',
            '泄漏机制：key 被回收后，stale entry 的 value 无人清除——**线程池里线程长期存活**，value（往往是大对象）一直挂着。设计上 set/get/remove 会顺带探测清理，但最可靠的是用完显式 `remove()`（try/finally）。',
            '实现细节：冲突处理是**开放地址法（线性探测）**，与 HashMap 链表法不同；`threadLocalHashCode` 用黄金分割数 0x61c88647 步进，在 2 的幂容量下散列均匀。',
            '跨线程传递：`InheritableThreadLocal` 只在**创建子线程那一刻**拷贝，线程池复用线程不生效——上下文丢失经典坑；生产解法是 TransmittableThreadLocal（TTL）：提交时抓快照、执行前回放，配 TtlRunnable 或 Javaagent。',
            '工程场景：用户上下文/traceId/MDC、SimpleDateFormat 线程安全包装、Spring 事务 Connection 绑定（TransactionSynchronizationManager 底层就是 ThreadLocal）。',
          ],
          followUps: [
            {
              question: '为什么 key 设计成弱引用而 value 是强引用？反过来行不行？',
              points: [
                'key 弱引用让外部不再持有的 ThreadLocal 能被回收，缩小泄漏面；value 若也弱引用，get 中途就可能被回收，功能错误。',
                '泄漏根源是"线程活得久 + 忘记 remove"，弱引用只是缓解不是根治。',
              ],
            },
            {
              question: '线程池 + InheritableThreadLocal 为什么"偶尔能拿到值偶尔拿不到"？',
              points: [
                '继承只发生在子线程创建那一刻——池里线程是早就建好的，拿到的是创建时的旧值；复用时不再继承，于是"第一次对、后面全错"。',
                '这类薛定谔上下文正是 TTL 要解决的：在提交/执行两个时机做抓取与回放。',
              ],
            },
          ],
        },
        {
          id: 'be-java-equals-hashcode',
          title: '重写 equals 为什么必须同时重写 hashCode？写错参数类型会怎样？',
          difficulty: 'intermediate',
          tags: ['真题改编', 'equals', 'hashCode', '集合'],
          points: [
            '**契约（必须背）**：equals 相等 ⇒ **hashCode 必须相等**；hashCode 相等 ⇏ equals 相等（哈希碰撞）。不守约的下场：只重写 equals 不重写 hashCode → 两个"相等"对象哈希到不同桶 → **HashSet 去重失效、HashMap get 不到**——存进去的对象换个"相等"的对象去取，返回 null。',
            '**真题陷阱：重载而非覆写（浙大原题）**：`public boolean equals(Value v)` 参数是 Value 不是 Object——这是**重载**，Object.equals(Object) 原版还在；HashSet 内部经 Object.equals 比较**仍是引用相等**，且 hashCode 未重写 → 两个 i=39 的对象 size = **2** 而不是 1。识别方法：@Override 注解会让这类错误编译报错——**重写 equals 必带 @Override**。',
            '**教科书实现三件套**：① `if (this == o) return true` 自反短路；② `instanceof`（或 getClass 严格模式）类型检查；③ 逐字段比较（float 用 Float.compare、double 用 Double.compare 处理 NaN/±0）；hashCode 用 **Objects.hash(...)** 生成。顺带：equals 对称/传递/一致性——写自定义 equals 时最容易破坏传递性（子类附加字段），用"组合代替继承"或 getClass 严格模式规避。',
            '**工程注脚**：Lombok @EqualsAndHashCode、Java record（自动生成并守约）就是为了让人类别再手写这套；能讲出"record 为什么天然守约"是现代 Java 的加分项。',
          ],
          followUps: [
            {
              question: '包装类 Integer 之间用 == 比较会怎样？equals 呢？',
              points: [
                '== 比引用：Integer.valueOf 对 **-128~127 有缓存**（同区间 == 为 true，超出为 false）——开关在 JVM 参数 IntegerCache.high；面试经典题 `127==127` true、`128==128` false。',
                'equals 比值但有**类型检查**：`Integer.valueOf(1).equals(Long.valueOf(1L))` 为 **false**（先 instanceof Integer 判断，直接返回 false）——跨包装类型比较数值要拆箱用 == 或 compareTo（浙大真题同款）。三元运算符混用 Integer/Double 还会触发**数值提升拆箱成 double**（真题输出 1.0）——装箱类型的"隐式惊喜"三连。',
              ],
            },
          ],
        },
        {
          id: 'be-java-string',
          title: 'String 为什么设计成不可变？字符串常量池和 intern 是怎么工作的？',
          difficulty: 'basic',
          tags: ['真题改编', 'String', '不可变', '常量池'],
          points: [
            '**不可变的三大动机**：① **安全性**——String 到处被用（类加载名、网络地址、文件路径、Map key），可变则任何持有引用的人都能篡改语义；② **hashCode 缓存**——String 的 hash 在首次计算后缓存（.hash 字段），作为 HashMap key 高频使用时免重复计算——不可变才敢缓存；③ **常量池共享**——同一字面量全局复用一份，不可变才安全可共享。实现上 final char[]（9 后 byte[]）+ 不暴露修改接口。',
            '**常量池与 == 判等（浙大原题）**：字面量 "ZJU" 编译期写入 class 文件常量池，运行期进入**字符串常量池（JDK 7 起位于堆中**——原因见 JVM 内存一问的追问）；元空间里放的是运行时常量池等**类元数据**，与字符串常量池不是一回事），s1 = "ZJU" 指向池中唯一实例；**new String("ZJU") 在堆上新开对象**——s1 == s2 为 **false**（内容相等要用 equals）。',
            '**原题四连判**：s1="ZJU"、s2=new String("ZJU")、s3="ZJ"、s4=s2.intern()——`s1==s2` **false**（池对象 vs 堆对象）；`s1==s3` **false**（s3 是 "ZJ"，内容就不同）；`s1==s4` **true**——intern() 返回池中的等值实例（堆中不存在则入池，存在则复用）。变体：`s3 += "U"` 是**运行期**用 StringBuilder 新建的堆对象，不进池——所以它 == 任何池字面量都 false。',
            '**编译期常量折叠的边界**：`final String a = "ZJ"; String s = a + "U";` 编译期折叠 → 指向池对象 == "ZJU" 为 true；但 a 若非 final（运行期拼接）就是堆新对象——**"编译期能确定" 是进池的前提**。工程口径：字符串比较一律 equals（或 Objects.equals 防 null），== 只用来讲常量池原理。',
          ],
          followUps: [
            {
              question: '大量字符串拼接为什么用 StringBuilder？"+=" 循环里发生了什么？',
              points: [
                'String 不可变 ⇒ 每次拼接都要**新建对象并拷贝全部内容**：循环拼接 n 段的代价是 O(n²)；编译器会把一条 `a+b+c` 优化成单个 StringBuilder，但**跨循环的 += 每轮都新建**——循环内拼接必须手动提 StringBuilder（append O(1) 均摊）。',
                '延伸：Java 9+ 的字符串拼接改用 invokedynamic（StringConcatFactory），运行期选择最优策略（比手写 StringBuilder 更快）——"编译器优化到什么程度"是动态的，但循环内 += 仍是坏味道。',
              ],
            },
          ],
        },
        {
          id: 'be-java-exception',
          title: 'checked 和 unchecked 异常的边界在哪？finally 一定执行吗？',
          difficulty: 'basic',
          tags: ['真题改编', '异常', 'finally', 'try-with-resources'],
          points: [
            '**两层分类（浙大原题判别）**：**unchecked** = Error + RuntimeException 及其子类（NPE/ClassCastException/IndexOutOfBounds……编译器不强制捕获或声明——多数是编程 bug，捕获反而掩盖问题）；**checked** = 其余（IOException/SQLException……编译器强制 try-catch 或 throws 声明——表示"可预期的外部故障，调用方必须表态"）。原题四选一：FileNotFoundException 是唯一的 checked。',
            '**设计哲学一句话**：checked 异常表达"**调用方应该处理的业务性失败**"（重试/提示用户），unchecked 表达"**程序 bug 或致命错误**"（修代码而不是捕获）。争议点：Spring/Data 层把 SQLException 包成 unchecked DataAccessException——**强制声明的外部故障在分层架构里变成了噪音**，这是 checked 异常被现代框架"架空"的原因；C++/Go/Python 干脆没有 checked 概念。',
            '**finally 的执行规则**：正常/异常路径**都执行**（用于释放资源）；**System.exit / JVM 崩溃 / 守护线程被杀时不会执行**。经典陷阱：finally 里 return 会**吞掉 try/catch 的异常与返回值**（finally 的 return 覆盖一切）——阿里规约明令禁止。真题输出题：try 抛 RuntimeException、catch 打印 B 后重抛、finally 打印 D → 结果 B、D 后异常上抛。',
            '**现代姿势：try-with-resources**：资源类实现 AutoCloseable，编译器生成的 close 调用保证执行且**异常抑制机制**（close 抛的异常挂到主异常 suppressed 数组，不丢失）——比手写 finally close 更安全（手写版 close 的异常会**顶掉**主异常）。多资源按声明的**逆序**关闭。',
          ],
          followUps: [
            {
              question: 'finally 里的代码会覆盖 try 的返回值吗？',
              points: [
                '会：finally 里 return 直接**替换** try/catch 的返回值；finally 里对基本类型局部变量赋值**不影响**已暂存的返回值（返回值在 finally 前已定）。这条规则 + "finally return 吞异常"是同一机制的两侧：finally 在"结果定稿"阶段拥有最终话语权。',
                '工程纪律：finally 只放清理逻辑，不放 return/赋值；清理用 try-with-resources，让编译器生成正确代码——靠规则而不是靠记忆力。',
              ],
            },
          ],
        },
        {
          id: 'be-java-object-lifecycle',
          title: '在构造器里调用可被覆盖的方法会发生什么？clone 的浅拷贝语义是什么？',
          difficulty: 'intermediate',
          tags: ['真题改编', '构造器', '多态', 'clone'],
          points: [
            '**经典事故（浙大信科原题）**：父类 A 构造器调用 print()，子类 B 覆写 print() 并访问自己的字段 array——`new B()` 抛 **NullPointerException**。机制：**父类构造器先于子类构造器体执行**，此时 this 的运行时类型已是 B（动态绑定到 B.print()），但 **B 的字段初始化还没发生**（array 为 null）——"方法派发按运行时类型，字段初始化按构造进度"的错位。',
            '**纪律与对照**：构造器只做构造——**不要调用可被覆盖的方法**（自己 final/private 化，或工厂方法后初始化）。C++ 相反（构造期 vptr 指当前类，调的是本层版本）——但两种语言的结论一致：构造期多态都是坑（C++ 方向的 binding-slicing 题追问有完整对照）。',
            '**clone 的浅拷贝语义（浙大原题）**：super.clone() 逐字段复制——**引用字段复制的是引用值**：c1.b == c.b 为 **true**（同一对象，setA(3) 双方可见）；对 c1.ii 重新赋值只改 c1 自己的引用。**transient 只对序列化生效，对 clone 无影响**（原题故意放 transient 干扰）。深拷贝要自己实现：重建引用字段或序列化往返——这就是为什么 Effective Java 说"优先用拷贝构造/工厂代替 clone"（Cloneable 接口甚至是空的）。',
            '**答题结构**：先讲构造顺序（父构造 → 子字段初始化 → 子构造体）→ 指出动态绑定与初始化进度的错位 → 给纪律 → 延伸 clone/序列化两类"对象复制"的浅拷贝共性——把"对象生命周期"串成一条线。',
          ],
          followUps: [
            {
              question: 'Teacher 和 Student 都是 Person 的子类，(Student) teacher 会怎样？',
              points: [
                '**编译错误**（不是运行时异常）：向下转型要求编译期就存在继承关系（Student 是 Teacher 的子类才行）——`instanceof Person` 为 true 也救不了，兄弟类之间没有转换通道（清华原题）。`instanceof` 为 true 只保证"是 Person"，不能推出跨分支转换合法。',
                '记忆锚：Java 的 cast 只沿**继承链**上下滑动，编译器静态检查链条存在性、运行时检查实际类型（ClassCastException）——兄弟分支在链条上不可达。',
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'be-go',
      name: 'Go 语言',
      description: 'GMP 调度、channel 与内存模型——Go 高并发服务端的原理内核。',
      references: [
        { label: 'Go 官方文档：Memory Model', url: 'https://go.dev/ref/mem' },
        { label: 'Go FAQ（并发与调度）', url: 'https://go.dev/doc/faq' },
      ],
      questions: [
        {
          id: 'be-go-interface',
          title: 'Go interface 的底层是怎么实现的？nil interface 陷阱是什么？',
          difficulty: 'intermediate',
          tags: ['Go', 'interface', 'duck typing'],
          points: [
            '**两字节结构**：interface 变量 = (**itab/类型信息, 数据指针**) 两字（16 字节）。**iface**（带方法的接口）：itab 里存**接口类型、动态类型、方法表**（接口要求的方法 → 具体类型实现的地址，调用即查表间接跳转）；**eface**（`interface{}` 空接口）：只有动态类型 + 数据指针，没有方法表。',
            '**动态派发的开销与内联**：接口调用要查 itab 方法表（间接调用 + 阻止内联），比直接调用慢（纳秒级，但热路径累积可见）；逃逸分析联动：值装入 interface 通常**逃逸到堆**（见逃逸分析题）。Go 后续版本靠**编译器去虚化 + 泛型约束**缓解，仍保留接口做灵活性，性能敏感处用泛型（编译期特化）或具体类型。',
            '**nil interface 陷阱（必考）**：`var p *MyType = nil; var i Iface = p` 此时 **i != nil**——interface 的 nil 判断要求**类型指针与数据指针都为 nil**，而这里类型信息是 *MyType（非空）、数据指针是 nil；错误返回时 `return err` 把 nil 具体类型包装成非 nil interface，调用方 `if err != nil` 误判——**Go 最著名的线上 bug 来源**，函数返回 error 前必须显式 `return nil` 而不是返回类型化的 nil。',
            '**隐式实现（结构化类型/duck typing）的设计权衡**：不需要 `implements` 声明——接口与实现解耦，**定义方不用预先知道接口存在**（这是标准库 io.Reader 生态爆发的原因：任何类型只要签名匹配就能插入整个 io 体系）；代价：**实现关系不显式**（重构方法签名时"悄悄不再实现某接口"，编译期才发现）、接口意外实现（方法撞名）；对比 Java/C# 显式声明（编译器立即校验，但实现耦合定义）。收束：Go 的选择服务于"**消费方定义接口**"（accept interfaces, return structs）——小接口 + 消费端声明的习惯用法要能说出来。',
          ],
          followUps: [
            {
              question: '类型断言和 type switch 的开销一样吗？怎么高效判断接口的具体类型？',
              points: [
                '单次断言 `i.(T)` 编译成对 itab/类型的比较（一次指针比较，非常便宜）；**type switch** 是一串比较的语法糖，Go 编译器会优化成类似哈希/二分的分派（对 interface 断言链效率不错）；真正贵的是**反射**（reflect.ValueOf 要遍历类型元数据）——断言是 O(1)，反射按结构遍历，差数量级。',
                '工程口径：热路径优先类型断言/type switch，反射只留给通用序列化这类没有静态信息的场景；接口中**缓存类型信息**（如先把 error 断言成已知错误类型再比较）也是常见优化——能讲清"断言 O(1)、type switch 优化分派、反射慢"三档，这题就完整了。',
              ],
            },
          ],
        },
        {
          id: 'be-go-gmp',
          title: 'Goroutine 的 GMP 调度模型是怎样的？相比线程池为什么能开百万个？',
          difficulty: 'intermediate',
          tags: ['Goroutine', 'GMP', '调度'],
          points: [
            '三个角色：**G**（goroutine，含栈与状态）、**M**（内核线程，真正执行者）、**P**（逻辑处理器，持本地运行队列，数量 = GOMAXPROCS）。**G 必须绑定 P 才能被 M 执行**，P 是中间的调度上下文与资源配额。',
            '调度流程：M 绑定 P，从 P 的**本地队列（256 容量）**取 G 执行；本地空了按**工作窃取（work stealing）**从其他 P 偷一半，再不行看全局队列与 netpoller。新建 G 优先放本地（满则转移一半到全局，保证公平）。',
            '省内存：goroutine 初始栈仅 **2KB 且按需增长**（连续栈，复制扩容），线程默认几 MB；省 CPU：**用户态切换 ~百 ns**，线程切换要陷入内核 ~1-2µs。百万 goroutine 的本质 = 可增长的小栈 + 用户态调度器复用少量线程。',
            '阻塞处理：syscall 阻塞 → **M 与 P 解绑**，P 被其他 M 接管继续跑；channel/锁阻塞 → G park 进等待队列，M 换下一个 G；**sysmon 监控**：syscall 超时（>20µs 检查）、G 运行超 10ms 置抢占标记（基于信号的异步抢占，Go 1.14+）防饿死。',
          ],
          followUps: [
            {
              question: 'GOMAXPROCS 设成多少合适？容器里默认值有什么坑？',
              points: [
                'CPU 密集 = 核数；IO 密集可以大于核数（阻塞让出时 P 不闲着）。它是并行度上限而非并发度上限。',
                '容器坑：Go 1.25 之前默认读宿主机核数（如 96 核），而 cgroup limit 只有 4 核 → 调度器以为有 96 个并行槽位，GC 后台线程过多、限流 throttling 严重。解法：Go 1.25 起原生感知 cgroup，更早版本用 automaxprocs 库 / 显式设置。',
              ],
            },
          ],
        },
        {
          id: 'be-go-channel',
          title: 'channel 的底层结构是什么？使用中有哪些致命陷阱？',
          difficulty: 'intermediate',
          tags: ['Channel', '并发'],
          points: [
            '底层是 **hchan 结构**：环形缓冲区（有缓冲时）+ sendx/recvx 索引 + **recvq/sendq 等待队列（sudog）** + 互斥锁。发送：有缓冲且未满 → 拷贝进 buffer；已满 → 当前 G 封装成 sudog 挂 sendq 并 **gopark**，接收方直接从发送方栈拷贝（**避免一次内存拷贝**）；无缓冲 channel 发送必然阻塞直到有接收者。',
            '核心语义：**通信即同步**——happens-before 由 channel 保证（第 n 次接收 happens-before 第 n+c 次发送完成之后…），这是 Go 内存模型的基石，比"共享变量+锁"的意图更清晰。',
            '陷阱清单：① **向 nil channel 发送/接收永久阻塞**（select 里可用 nil 禁用分支）；② **向已关闭 channel 发送 panic**；③ 关闭后接收立即返回零值+ok=false（**先关后收会读到"假数据"**）；④ **重复 close panic**；⑤ 无缓冲 channel 双方都在等就死锁（all goroutines are asleep）。',
            '所有权约定：**由发送方关闭** channel（接收方不知道是否还有数据，发送方知道）；多发送方时用额外 done/WaitGroup 协调再由协调者关闭，或干脆不关闭靠 context 取消。原则："Never close a channel from the receiver side"。',
          ],
          followUps: [
            {
              question: 'select 语句的调度语义是什么？如何实现"超时取消"与"优先级"？',
              points: [
                'select 随机打乱 case 顺序后加锁遍历，避免饥饿；全部阻塞时走 default 或挂起进所有相关 channel 的等待队列，任一就绪被唤醒。',
                '超时：`select { case v := <-ch: ...; case <-time.After(d): ... }`（注意 After 的 timer 不主动回收，高频用 NewTimer+Stop）；取消：case <-ctx.Done()。',
                '优先级：外层 for + 先 select 只看高优先 channel + default 落回普通逻辑——Go 没有 case 权重，模式组合实现。',
              ],
            },
          ],
        },
        {
          id: 'be-go-slice-map',
          title: 'slice 和 map 的底层实现是什么？各自有哪些容易踩的坑？',
          difficulty: 'basic',
          tags: ['Slice', 'Map'],
          points: [
            '**slice = 指向底层数组的指针 + len + cap**。追加：cap 足够原地写；不足则**扩容新数组**（<256 翻倍，之后约 1.25 倍渐进，Go 1.18+ 更平滑），copy 旧数据——**扩容后指针变了**，函数内 append 不会反映到调用方的旧 slice 头。',
            '经典坑：`s2 := s[1:3]` **共享底层数组**——改 s2 影响 s、append s2 可能覆盖 s 的元素；要用 `copy` 或三索引 `s[1:3:3]` 限制 cap 隔离。函数传参传的是 slice 头（值拷贝），len/cap 的修改不回传。',
            '**map 是哈希表**：hmap + 桶数组（bmap，每桶 8 个 key + 8 个 value + 溢出桶指针，**同桶 key/value 各自连续存储**省 padding）；渐进扩容（翻倍或等量整理），负载因子 6.5 触发，扩容中读写走新旧两表。',
            'map 坑：① **并发读写直接 fatal（不可 recover）**——并发场景必须 sync.Mutex 或 sync.Map；② map 遍历**故意随机化**（防止依赖顺序）；③ 元素不可寻址（`&m[k]` 编译错，因为扩容会搬家）。',
          ],
          followUps: [
            {
              question: 'sync.Map 和 mutex+map 各适合什么场景？sync.Map 为什么快？',
              points: [
                'sync.Map 为**读多写少、key 集合稳定**设计：读走无锁的 atomic read-only map（dirty 提升机制），写少时几乎零竞争；写多时反而比 mutex+map 慢。',
                'mutex+map 是通用解：写多/需要复合操作（check-then-act）必须它。选择信号：本地缓存、元数据表 → sync.Map；业务状态、频繁增删改 → mutex+map 或分片锁（shard map）。',
              ],
            },
          ],
        },
        {
          id: 'be-go-defer',
          title: 'defer 的执行机制是什么？defer 与 return 的配合有哪些经典陷阱？',
          difficulty: 'basic',
          tags: ['Defer'],
          points: [
            'defer 注册的函数调用在**所在函数返回前**（不是块结束）LIFO 执行；参数**注册时求值**（Go 1.14 前链表实现，之后开放式编码 open-coded defer 内联优化，开销从 ~50ns 降到 ~1ns，但循环里 defer 仍会累积）。',
            '经典陷阱一：`defer f.Close()` 在循环里——文件描述符**积压到函数结束才释放**，循环大文件直接 fd 耗尽；必须每个迭代显式 Close 或包一层函数。',
            '经典陷阱二：**命名返回值 + defer 可修改返回值**：`func f() (n int) { defer func(){ n++ }(); return 0 }` 返回 1——return 分两步（赋值给返回值槽、执行 defer、真正返回），匿名返回值则 defer 改不到。这也是 defer 实现事务回滚/资源清理修改错误值的原理。',
            'panic 与 defer：defer 函数在** panic 展开栈时执行**，recover 只能在 defer 函数**直接调用**才生效（隔着一层包装函数无效）；recover 后当前函数正常返回零值，panic 不再向上传播。',
          ],
          followUps: [
            {
              question: 'defer、panic、recover 的组合为什么能优雅处理资源释放？和 try-finally 比呢？',
              points: [
                'panic 展开时逐层执行 defer，保证每层资源逆序释放，recover 在任意层截断——错误处理与清理逻辑解耦在函数出口。',
                '对比 try-finally：defer 绑定"资源的作用域结束"而非"某段代码"，多资源时天然逆序、无嵌套缩进地狱；代价是 recover 的作用域语义更隐晦、误用（吞 panic）更常见。',
              ],
            },
          ],
        },
        {
          id: 'be-go-context',
          title: 'context 的设计原理是什么？取消信号是如何传播的？',
          difficulty: 'intermediate',
          tags: ['Context', '并发'],
          points: [
            'context 解决两个问题：**跨 API 边界传递取消信号与请求域数据**（traceId、鉴权信息）。设计约定：作为函数**第一个参数**显式传递、不可复用（每个请求独立）、只传"请求域"数据不传业务参数。',
            '树形传播：WithCancel/WithTimeout/WithDeadline 生成子 context，**父取消 → 所有子级级联取消**（内部 parent 字段构成树，cancel 时遍历 children 或惰性标记）。实现核心是 `Done()` 返回的 channel 被 close（close 广播，任意多等待者）。**超时 = deadline 比较**：子 ctx 取 min(父 deadline, 自身)。',
            '使用纪律：**必须检查 `ctx.Err()` / `<-ctx.Done()`** 才有取消效果——context 只是信号源，长循环、DB 查询（带 ctx 参数）、HTTP 请求（WithContext）都要真正传递下去；一层不透传，取消链就断了。',
            '取消后的清理：goroutine 退出前 `cancel()`（defer cancel）释放资源；value 链查找是**父向子上溯 O(n)**，热路径别放高频读取的大数据。',
          ],
          followUps: [
            {
              question: '为什么说"context 取消不了 goroutine"？如何彻底回收失控的协程？',
              points: [
                'Go 没有 kill goroutine 的机制：取消是**协作式**的——协程不主动检查 Done() 就永远运行。一个泄漏的 goroutine 会一直持有栈与引用。',
                '治理：所有长生命周期协程必须"出生即挂 context"并在 select 里响应；用 errgroup 管理成组生命周期；监控 runtime.NumGoroutine 趋势，泄漏用 pprof goroutine profile 按创建栈定位。',
              ],
            },
          ],
        },
        {
          id: 'be-go-escape',
          title: 'Go 的内存逃逸分析是什么？哪些写法会导致变量逃逸到堆？',
          difficulty: 'intermediate',
          tags: ['Go', '内存逃逸', '性能优化'],
          points: [
            '**逃逸分析是编译器的静态分析**：在编译期判断变量的生命周期是否能被函数外感知——确定"栈上活得到函数结束"就分配在**栈**（分配释放只是挪动栈指针，纳秒级，GC 不管），否则**逃逸到堆**（分配找 mcache/mheap，靠 GC 回收，带来分配开销与 GC 压力）。',
            '常见逃逸场景清单：① 返回**局部变量的指针**（生命周期超出函数）；② 赋值给**interface{} 参数**（fmt.Println、error 包装，接口里存指针且大小不可知）；③ **闭包捕获**被外部引用的变量；④ 变量大小**编译期不可知**（`make([]int, n)` 的 n 是变量）或超**栈分配上限**（约 64KB，大对象直接堆）；⑤ 存入 channel、被 map/slice 容器持有（容器本身可能在堆上）；⑥ 被 goroutine 闭包引用（生命周期无法静态界定）。',
            '**怎么验证**：`go build -gcflags="-m"` 输出 `escapes to heap` / `moved to heap`；压测配 `benchmem` 看 **allocs/op**——优化分配次数往往比优化单次大小收益更大。',
            '**优化的正确姿势与边界**：高 QPS 热路径减少无谓逃逸（预分配 slice 容量、避免不必要的接口装箱、strings.Builder 替代 fmt.Sprintf 拼接、sync.Pool 复用临时对象）；但要警惕**过度优化**——逃逸分析牺牲可读性换纳秒级收益，先有 profile 证据（pprof alloc_space）再动手，这是"性能优化要有数据支撑"的典型题眼。',
          ],
          followUps: [
            {
              question: 'sync.Pool 为什么能减少分配？它有什么坑？',
              points: [
                '**sync.Pool 是对象复用池**：Put 归还、Get 取出（可能新建），适合**高频创建的临时对象**（[]byte 缓冲、编解码上下文），把"反复分配"变"反复借用"，直接压 allocs/op 与 GC 扫描量。',
                '三个坑：① Get 出来的对象**状态不保证干净**，要 reset 再用；② 池对象**两次 GC 仍未复用才被真正丢弃**（Go 1.13 起有 victim 缓存：GC 后先移入 victim，下轮 GC 仍没用上才清掉），没有持久性，不能当缓存用——它是"临时对象再生"，不是存储；③ 存大对象反而增加 GC 根扫描负担。标准用法是配 `runtime.GC` 周期敏感的压测验证收益，而不是想当然上池。',
              ],
            },
          ],
        },
        {
          id: 'be-go-gc',
          title: 'Go 的 GC 是怎么工作的？为什么它不追求最低停顿也不追求最高吞吐？',
          difficulty: 'advanced',
          tags: ['GC', '三色标记'],
          points: [
            '并发**三色标记-清除**：白（未访问，最终回收）/灰（已访问未扫描）/黑（已扫描存活）。从 GC Roots 扫描，灰队列出队染黑其引用对象为灰——与用户 goroutine 并发运行。',
            '并发标记的正确性靠**写屏障（混合写屏障，Go 1.8+）**：指针写入时把新旧对象之一染灰，保证"黑色对象不会悄悄获得白色引用"——漏标会导致活对象被回收，这是三色标记并发运行的唯一不变量缺口，写屏障封死它。',
            '触发时机由 **pacer（GOGC，默认 100）** 控制：堆增长到上次存活堆的 2 倍时启动；GOMEMLIMIT（Go 1.19）提供内存上限软限制，防 OOM 与换页。STW 只有极短两段（开启/结束标记，<1ms）。',
            '设计哲学：**停顿极短（亚毫秒）但吞吐让渡**（写屏障 + 辅助标记 mark assist 会拖慢业务线程），且**不整理不压缩**（碎片由基于大小分类的分配器（size class + tcmalloc 思想）缓解）。对比 JVM：Java 有多种收集器按场景选，Go 一个 GC 服务云端 API 场景——延迟优先、堆可预估。',
          ],
          followUps: [
            {
              question: 'Go 怎么排查内存泄漏？哪些写法会造成"GC 收不走"？',
              points: [
                '常见根因：① goroutine 泄漏（阻塞在 channel/锁，栈与引用永不释放）——最高发；② 全局 map/slice 无界增长；③ `append` 截断子切片持有大底层数组（`s[:1]` 后原 100MB 数组不能回收）；④ time.Ticker 不 Stop、闭包捕获大对象、sync.Pool 滥用。',
                '工具链：pprof heap（inuse_space 看驻留、alloc_space 看累计）+ goroutine profile 对比两次采样的差集定位泄漏协程；GODEBUG=gctrace=1 看回收行为。',
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'be-node',
      name: 'Node.js',
      description: '事件循环、流与进程模型——Node 的高并发本质与能力边界。',
      references: [
        { label: 'Node.js 官方文档（含 Event Loop 机制）', url: 'https://nodejs.org/api/all.html' },
        { label: 'Node.js 官方文档：Stream', url: 'https://nodejs.org/api/stream.html' },
      ],
      questions: [
        {
          id: 'be-node-runtimes',
          title: 'Node.js、Bun、Deno 三个 JS 运行时怎么选？差别到底在哪？',
          difficulty: 'intermediate',
          tags: ['Node.js', 'Bun', 'Deno', '运行时'],
          points: [
            '**三者的出身与哲学**：Node（2009）——先行者，生态最厚，稳定压倒一切；**Deno（Node 作者的二次创业）**——修正 Node 的历史遗憾：**默认安全**（文件/网络/环境变量都要显式 `--allow-*` 授权）、TS/URL import 一等公民、标准库内置；**Bun（2022）**——"一体化性能怪兽"：**运行时 + 包管理器 + 打包器 + 测试器合一**，用 Zig 写核心、跑 **JavaScriptCore**（Safari 的引擎）而非 V8。',
            '**三个硬差异要记牢**：① **引擎**：Node/Deno 用 V8，Bun 用 JavaScriptCore——JSC 启动更快、内存占用更低，V8 峰值吞吐优化更深（Bun 快的名声一半来自启动与 IO 库的实现质量，不全是引擎）；② **TypeScript**：Deno/Bun 原生直接跑 TS，Node 从 22.6+ 用 type stripping 逐步原生支持（运行时剥离类型，不做类型检查——检查仍要 tsc）；③ **npm 兼容**：Node 原生生态，Bun 兼容 npm 包（bun install 快得惊人，硬链接 + 全局缓存），Deno 2 已全面支持 npm: 说明符——**生态隔阂正在消失，这是三方趋同的大趋势**。',
            '**选型的务实口径（2026 的现实答案）**：**生产服务默认 Node**（LTS 节奏、生态验证最深、监控/部署工具链成熟——生产要的是可预测不是 benchmark 分数）；**开发体验用 Bun**（装依赖、跑测试、起脚本快数倍——本地提速是真实的）；**Deno 的甜区**是安全敏感的脚本/边缘函数与喜欢其标准库哲学的团队；**边缘运行时**（Cloudflare Workers/Deno Deploy）遵循 WinterCG 标准化 Web API——写可移植代码（少用 Node 专属 API）是给未来留的选择权。',
            '**追问预备**：Bun 的风险面（相对年轻、少数 npm 包的兼容角落、被收购后的治理走向——选型要看长期维护承诺）；Deno 权限模型在容器时代的价值变化（容器本身也是隔离，运行时级沙箱更适合多租户/CLI 分发场景）；三者都遵循事件循环与单线程模型（Node 的事件循环题内容三家通用）。',
          ],
          followUps: [
            {
              question: '「开发用 Bun、生产用 Node」会不会带来两边行为不一致的问题？怎么控制？',
              points: [
                '会，这正是这个组合的真实成本：引擎差异（V8 vs JSC 的边缘行为/性能特征）、Bun 重新实现的 Node API 子集（少数模块行为有差）、工具链差异（bundler 与 esbuild/vite 输出不同）。控制手段：**CI 双跑**（测试矩阵在两个运行时都执行，差异提前暴露）、**少用冷门 API**（HTTP/crypto/fs 的主流路径三家行为一致）、关键路径以生产运行时为准做基准测试。',
                '更保守的分层策略：**Bun 只当工具链**（包管理器 + 测试运行器替代 npm/vitest——收益最大、风险最小），运行时仍统一 Node——很多团队的实际落地就是"bun install + node 运行"，既拿到十倍装包速度又不引入运行时分叉；能给出这个分层方案说明真在生产权衡过。',
              ],
            },
          ],
        },
        {
          id: 'be-node-event-loop',
          title: 'Node.js 事件循环分哪些阶段？微任务和宏任务的执行顺序是怎样的？',
          difficulty: 'intermediate',
          tags: ['事件循环', 'libuv', '微任务'],
          points: [
            'libuv 六阶段循环：**timers**（到期的 setTimeout/setInterval）→ **pending callbacks**（系统错误回调）→ idle/poll（**IO 轮询**，取 IO 事件并执行回调，等待时长由最近 timer 决定）→ **check**（setImmediate）→ **close callbacks**。每个阶段执行完进入下一阶段。',
            '微任务（**Promise.then / process.nextTick / queueMicrotask**）不在上述阶段里：**每个宏任务（阶段回调）执行完，立即清空微任务队列**——nextTick 队列优先于 Promise 队列。`setImmediate` vs `setTimeout(0)`：主模块内顺序不定（受进入循环时机影响），**在 IO 回调里 setImmediate 恒先执行**（check 阶段早于下一轮 timers）。',
            '经典考题顺序：`setTimeout`、`setImmediate`、`Promise.resolve().then`、`process.nextTick` 在主模块的输出顺序 = nextTick → Promise → （宏任务按 libuv 时机）。',
            '推论：**同步长计算会阻塞整个循环**（所有 IO 回调、定时器全部延后）——Node 适合 IO 密集不适合 CPU 密集的根因；CPU 任务应拆分（setImmediate 分片）或下沉 worker_threads / 子进程。',
          ],
          followUps: [
            {
              question: '浏览器的事件循环和 Node 有什么区别？',
              points: [
                '浏览器：每个宏任务后清微任务，宏任务源有优先级（渲染前会执行 rAF 与样式计算），没有阶段划分；setTimeout 精度受嵌套层级限制（4ms）。',
                'Node：多线程（libuv 线程池处理 fs/dns/crypto 等），有阶段与 nextTick 专属队列；Node 11+ 对齐浏览器语义：**每个 timer/宏任务后也清微任务**（之前是每阶段后清），跨环境代码要注意。',
              ],
            },
          ],
        },
        {
          id: 'be-node-stream-backpressure',
          title: 'Node.js 流的背压（backpressure）是什么问题？如何正确处理？',
          difficulty: 'advanced',
          tags: ['Stream', '背压', '高并发'],
          points: [
            '问题：`readable.pipe(writable)` 时若**读取速度 > 写入速度**（如读磁盘写网络），数据会在内存里无限堆积——不处理背压的大文件代理服务 OOM 是 Node 经典事故。',
            '机制：Writable 维护内部缓冲与 **highWaterMark**（Writable 基类默认 16KB，文件流为 64KB），write() 返回 false 表示缓冲已满；正确写法是收到 false 后**暂停读取，等 drain 事件再继续**。',
            '工程实践：优先用**管道抽象**（pipe/stream.pipeline/web 流）让框架自动处理背压；stream.pipeline（Node 10+）还解决了 pipe **错误不传播、不销毁流**的老问题（error 必须监听并 destroy 所有流）。',
            '异步迭代器写法（推荐）：`for await (const chunk of readable)` 配合 await once(writable, "drain")——语义直白且天然背压。',
          ],
          followUps: [
            {
              question: '为什么 `fs.readFile` 处理大文件是反模式？流式方案好在哪？',
              points: [
                'readFile 把整个文件读进 Buffer：1GB 文件 = 峰值 2-3GB 内存（原始 + 拷贝），并发请求直接 OOM，且首字节延迟 = 全文件读取时间。',
                '流式（createReadStream + pipeline 到响应）：内存恒定 O(highWaterMark)、首字节快、可与 zlib/加密流组合（transform 流），天然支持 Range/断点。',
              ],
            },
          ],
        },
        {
          id: 'be-node-cluster-worker',
          title: 'cluster 和 worker_threads 有什么区别？分别适合什么场景？',
          difficulty: 'intermediate',
          tags: ['Cluster', 'Worker Threads', '多进程'],
          points: [
            '**cluster**：多**进程**（fork 子进程各自独立 V8/堆），共享监听 socket（master 在内部轮询分发连接，默认 round-robin 分发——Windows 除外，Windows 交给 OS 分发）——用于**多核扩展 HTTP 服务**，进程隔离带来稳定性（子进程崩溃不影响其他 worker），但内存开销大、进程间只能 IPC 消息。',
            '**worker_threads**：单进程内多**线程**，各有独立 V8 实例与事件循环，通过 **SharedArrayBuffer/MessagePort** 高效共享与通信——用于**卸载 CPU 密集任务**（图像处理、加密、大 JSON 解析），内存共享省拷贝，但一个线程崩溃可能波及进程。',
            '选型：横向扩容 Web 服务 → cluster（或干脆容器多副本 + K8s，让编排层管扩缩）；CPU 热点函数 → worker_threads 或进程池（piscina）；两者都不是万金油：**能拆成独立服务/队列任务的，优先拆**。',
          ],
          followUps: [
            {
              question: 'PM2 的 cluster 模式和 Node 自带 cluster 什么关系？零停机重启怎么实现？',
              points: [
                'PM2 内置并封装了 cluster 模块（加日志、监控、守护、配置化）；本质同样是 fork + 共享端口。',
                '零停机重启：逐个 worker 重启——先起新 worker（监听同一 socket），健康后向旧 worker 发 SIGINT/SHUTDOWN 停止接受新连接并等存量请求完成（server.close），即 rolling restart；配合就绪探针避免流量打到未就绪实例。',
              ],
            },
          ],
        },
        {
          id: 'be-node-v8-memory',
          title: 'V8 的堆内存是怎么管理的？Node 服务内存持续增长如何排查？',
          difficulty: 'advanced',
          tags: ['V8', '内存泄漏', '排查'],
          points: [
            'V8 堆分**新生代**（Scavenger 半空间复制算法，空间小、速度快，默认 ~16MB 级别）与**老年代**（并发标记-清除+整理，Major GC）。Node 默认老年代上限按机器内存估算，容器里需显式 `--max-old-space-size`（对齐 cgroup limit）。',
            '晋升路径：对象在新生代两次 Scavenge 存活 → 晋升老年代；**大对象直接进老年代的大对象空间（LO）**——缓存大量大 Buffer/字符串会迅速撑爆老年代触发频繁 Major GC（服务表现为周期性卡顿）。',
            '排查工具链：`process.memoryUsage()`（rss/heapTotal/heapUsed/external 分清 JS 堆与堆外）、**heap snapshot 对比**（两次快照的 retained size 差集）、`--inspect` + Chrome DevTools、heapdump 定时快照、`node --heapsnapshot-signal=SIGUSR2` 线上安全触发。',
            'Node 特有泄漏点：**external 内存**（Buffer 在堆外，heapUsed 看不到）、全局闭包捕获大请求对象、事件监听器未移除（MaxListenersExceededWarning 是信号）、模块级缓存无 TTL、Promise 未决链持有上下文。',
          ],
          followUps: [
            {
              question: 'Buffer 为什么分配在堆外？这带来了什么优势与风险？',
              points: [
                '堆外分配让大块二进制数据**不参与 GC**（不增加新生代/老年代压力，拷贝少），且可直接传给 libuv 做 IO（零额外拷贝路径）；分配走预分配池（8KB池）+ slab 机制提效。',
                '风险：external 内存不受 V8 堆上限约束，`--max-old-space-size` 管不住它——容器 OOM 而 heapUsed 正常的"灵异现象"多源于此；要盯 rss 与 external 指标。',
              ],
            },
          ],
        },
        {
          id: 'be-node-koa-onion',
          title: 'Express 和 Koa 的中间件模型有什么区别？Koa 洋葱模型是怎么实现的？',
          difficulty: 'basic',
          tags: ['Koa', 'Express', '中间件'],
          points: [
            '**Express 线性模型**：中间件依次调用 next()，响应可能在任一环节结束；基于回调，错误要显式 next(err) 传给错误中间件；"进入路径"线性，无法天然获得"响应后"的时机。',
            '**Koa 洋葱模型**：中间件是 async 函数，await next() 之后还能继续执行——**请求按 1→2→3 进入，响应按 3→2→1 穿出**，日志耗时、错误捕获（try/catch 包住 await next()）天然可包裹全链路。',
            '实现核心：`compose` 函数把中间件数组递归串成链：`dispatch(i) => mw[i](context, () => dispatch(i+1))`；Koa 基于原生 Promise/async，无回调地狱；Express 5 也引入了 Promise 支持但模型仍是线性的。',
            '生态差异：Express 生态最大、心智简单；Koa 的 context 代理 + async 模型更适合写"横切关注点"（请求日志、统一错误、耗时上报），现代框架（Nest/Egg）的中间件思想多源于此。',
          ],
          followUps: [
            {
              question: 'compose 里如果不 await next() 会发生什么？多个中间件的执行顺序怎么推演？',
              points: [
                '不 await：控制流不进入后续中间件，响应可能在当前中间件 return 时就结束（相当于"短路"），后续代码不执行——用于鉴权失败提前返回。',
                '推演口诀：请求序 = 注册序；响应序 = 注册序的**逆序**；每个中间件里 await next() 前的逻辑在"进"时执行、后的逻辑在"出"时执行。',
              ],
            },
          ],
        },
        {
          id: 'be-node-boundary',
          title: 'Node.js 适合与不适合什么场景？边界判断的依据是什么？',
          difficulty: 'basic',
          tags: ['架构选型', 'Node.js'],
          points: [
            '适合：**IO 密集 + 高并发短请求**——BFF/网关聚合、REST/GraphQL API、实时推送（WebSocket/SSE）、工具链与 SSR。依据：单线程事件循环对"等待"零成本（回调挂起），成千上万并发连接不消耗线程资源。',
            '不适合：**CPU 密集**（长计算阻塞循环，所有请求排队）、重度多线程共享内存计算（需 worker_threads 复杂化架构）、对强事务/存储过程深度依赖的传统企业栈（生态成熟度）。',
            '工程视角的强项：**同构 JS**（前后端共享校验/类型/模板）、生态（npm）、开发效率、TypeScript 一等公民——很多团队选 Node 的第一原因是组织效率而非性能。',
            '补救手段要熟：CPU 热点用 worker_threads/子进程/队列外移；超大并发 IO 用 cluster/多副本；内存用流式处理；这些兜底会显著增加复杂度，评估时应计入成本。',
          ],
          followUps: [
            {
              question: '用 Node 写一个文件上传 + 视频转码服务，架构上你会怎么规避它的短板？',
              points: [
                '上传：流式接收（pipeline 到磁盘/对象存储），恒定内存不落全量 Buffer。',
                '转码：CPU 密集且长任务——**不入请求路径**：上传完成即返回任务 ID，转码丢给 FFmpeg worker 池或独立转码服务/消息队列，进度用轮询/推送。',
                '判断标准：把"请求内必须完成的工作"和"可以异步化的工作"切开，Node 只保留前者。',
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'be-systems',
      name: 'C++ / Rust 与系统编程',
      description: 'C++ 的 RAII、移动语义与内存模型，Rust 的所有权与无畏并发——系统级语言面试的核心机制题，兼谈与 GC 语言的工程取舍。',
      references: [
        { label: 'Cpp Core Guidelines', url: 'https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines' },
        { label: 'The Rust Programming Language（官方书）', url: 'https://doc.rust-lang.org/book/' },
        { label: 'Rust Nomicon（unsafe 黑魔法）', url: 'https://doc.rust-lang.org/nomicon/' },
      ],
      questions: [
        {
          id: 'be-cpp-raii',
          title: 'RAII 是什么？为什么说它是 C++ 资源管理的基石？',
          difficulty: 'basic',
          tags: ['C++', 'RAII', '异常安全'],
          points: [
            '**RAII（资源获取即初始化）**：把资源的生命周期绑定到对象生命周期——**构造函数获取、析构函数释放**。文件、锁、socket、内存一律用对象管理：正常返回、提前 return、异常传播（**栈展开**时已构造的局部对象一定被析构），任何路径都不会漏释放。',
            '与 GC 的本质差异：GC 只管**内存**，不管其他资源（句柄泄漏、锁不释放 GC 帮不了）；RAII 提供**确定性释放**——离开作用域立即执行，而不是等某个不确定的未来被 GC 批量回收。Java 的 try-with-resources、Go 的 defer 本质上是对 RAII 的手工模仿。',
            '标准库全是 RAII 载体：`std::lock_guard`（构造加锁析构解锁，杜绝忘记 unlock）、`fstream`、智能指针；自定义资源（如 C 的 FILE*/fd）要么包成类，要么给智能指针配**自定义删除器**——把 C 资源接入 RAII 体系。',
            '边界认知：RAII 管的是**确定性的成对操作**（获取/释放），不适合"谁最后用完谁释放"的共享语义——那正是 `shared_ptr`（引用计数）要解决的问题；两者是配合不是对立。',
          ],
          followUps: [
            {
              question: '异常安全的三个等级（基本/强/nothrow）分别是什么？各自的实现手段？',
              points: [
                '**基本保证**：异常抛出后不泄漏资源、对象仍处于合法（但可能变化了的）状态——RAII 直接给到这一级；**强保证**：异常时状态完全回滚，像没调用过——常用 copy-and-swap（先在副本上做完，再用不抛操作的 swap 提交）；**nothrow 保证**：绝不抛异常——移动构造、swap、析构都应做到。',
                '实践落点：先靠 RAII 拿基本保证（这是免费的），关键数据结构再补强保证；`noexcept` 不是装饰——它同时是**优化依据与接口契约**（见"vector 扩容只在移动构造 noexcept 时才用移动"）。',
              ],
            },
          ],
        },
        {
          id: 'be-cpp-smart-ptr',
          title: 'unique_ptr、shared_ptr、weak_ptr 的实现原理与使用边界是什么？',
          difficulty: 'intermediate',
          tags: ['C++', '智能指针', '引用计数'],
          points: [
            '**unique_ptr（独占所有权）**：禁拷贝、可移动，零开销（大小 ≈ 裸指针，删除器无状态时不占额外空间）——**默认选择**；表达"我拥有它，我走它亡"的所有权语义，天然防 double-free。',
            '**shared_ptr（共享所有权）**：控制块维护**强/弱两个引用计数**，拷贝时强计数 +1，归零时销毁对象；**线程安全要分两层说**：计数本身是原子的（多线程同时拷贝同一 shared_ptr 安全），但它**指向的对象没有任何保护**——这是最高频的误解。',
            '**weak_ptr（观察者）**：只增弱计数、不影响生命周期；`lock()` 临时提升为 shared_ptr（提升失败说明对象已亡）——**打破循环引用**的标准解法（双向引用、缓存、观察者列表）；检测悬垂的唯一安全途径。',
            '工程纪律：函数参数传 **裸指针或引用表达"借用"**（不传 shared_ptr——它暗示参与所有权）；所有权转移用 unique_ptr 传值；`make_shared` 一次分配对象+控制块（更快、异常安全），但弱点是 weak_ptr 长期存活时**整块内存延迟释放**——大对象高频创建场景要换回 `shared_ptr<T>(new T)`。',
          ],
          followUps: [
            {
              question: 'enable_shared_from_this 解决什么问题？在成员函数里用 this 构造 shared_ptr 会怎样？',
              points: [
                '问题场景：成员函数里需要把"自己"交给回调/异步任务持有——`shared_ptr<T>(this)` 会**为同一对象创建第二个独立控制块**，两个计数各自归零 → double-free。',
                '正解：类继承 `enable_shared_from_this<T>`（内部持有一个指向同一控制块的 weak_ptr），成员函数里调 `shared_from_this()` 拿到**共享同一控制块**的 shared_ptr；前提是对象本身已由 shared_ptr 管理。',
              ],
            },
            {
              question: 'shared_ptr 的引用计数为什么不用普通 int？计数递减为什么要特殊处理内存序？',
              points: [
                '计数必须**原子**（多线程拷贝/析构并发增减）；但归零判定不能只用 relaxed 递减——最后一个释放者要"看到"其他线程对该对象的所有写，标准实现是 **relaxed 递减 + 归零后 release fence、销毁侧 acquire fence** 的组合（cppreference 记载的经典优化模式）——呼应"操作系统/C++ 内存模型"里 release 计数递减的案例。',
                '引申：这就是为什么 shared_ptr 有可测量的开销（原子操作 + 控制块间接），性能敏感的热路径用 unique_ptr/裸借用——**共享所有权是有成本的语义声明，不是默认写法**。',
              ],
            },
          ],
        },
        {
          id: 'be-cpp-move-semantics',
          title: '移动语义和右值引用解决什么问题？std::move 到底做了什么？',
          difficulty: 'intermediate',
          tags: ['C++', '移动语义', '完美转发'],
          points: [
            '解决的两件事：**临时对象的深拷贝浪费**（函数返回 vector、容器扩容搬运元素）；**完美转发**（模板里把实参原封不动传下去，保持左/右值属性）。C++11 之前，"资源搬运"只能靠 swap 或 copy 换编译器优化（RVO）赌运气。',
            '**std::move 的真相**：它不移动任何东西——只是一个**无条件把表达式转成右值的 cast**（static_cast<T&&>）；真正的"移动"发生在**移动构造/移动赋值**里：接管源对象的资源（指针窃取 + 置空源），O(1) 代替 O(n) 深拷贝。移动后的源对象"有效但未定义状态"——只能析构或重新赋值，**这是与 Rust 的关键差异**（Rust 编译器直接禁止再用）。',
            '**与 noexcept 的联动**（高频考点）：`vector` 扩容搬运元素要求**强异常保证**——只有元素的移动构造标了 `noexcept` 才敢用移动（否则中途抛异常无法回滚），退化成逐个深拷贝。给移动构造写完忘标 noexcept，性能悄悄差一个数量级，这是最实用的一个细节。',
            '**完美转发三件套**：万能引用 `T&&`（类型推导中出现 && 才是万能引用，否则就是右值引用）+ **引用折叠**（& && → &）+ `std::forward<T>`（条件转换：实参原是左值转发后还是左值，是右值才转成右值）。`forward` 与 `move` 一字之差：**forward 按模板参数条件转换，move 无条件转换**。',
          ],
          followUps: [
            {
              question: '函数要返回一个局部对象，写 return std::move(x) 更快吗？',
              points: [
                '恰恰相反：**会变慢**。返回局部同名对象时编译器做 **RVO/NRVO**（直接在返回值位置上构造，零拷贝零移动）；`std::move(x)` 把表达式变成右值后**禁用了 NRVO**，反而强制走移动构造。',
                '规则：返回局部对象直接 `return x;`；需要区分"返回参数对象"和"返回局部对象"时才用 move（`return std::move(member)` 属于合法场景——成员不享受 NRVO）。这道题专治"背了 move 就到处贴"的候选人。',
              ],
            },
          ],
        },
        {
          id: 'be-cpp-vtable',
          title: '虚函数是怎么实现多态的？为什么基类析构函数必须是虚的？',
          difficulty: 'intermediate',
          tags: ['C++', '虚函数', '对象模型'],
          points: [
            '机制一句话：每个多态对象里藏一个 **vptr**（编译器自动插入，指向所属类的 **vtable**——函数指针表）；`p->f()` 编译成"从 vptr 找到 vtable → 取第 n 项 → 间接调用"。**动态绑定 = 两次内存间接 + 阻止内联**，这就是虚函数的全部运行时成本。',
            '**虚析构是生死线**：通过基类指针 `delete` 派生对象时，若析构非虚，行为是 **UB**——典型后果是只执行基类析构，派生类的资源（它管的内存/句柄）泄漏。准则：**多态基类的析构函数要么 public virtual，要么 protected non-virtual**（后者表达"不通过基类指针删除"）。',
            '构造/析构期间调用虚函数**不会**多态：构造从基类开始逐层进行，**vptr 逐层切换**——基类构造函数里调虚函数，派生类的重载还不存在（vptr 还指着基类的表），只调到基类版本。这不是 bug 是定义，但"构造函数里调虚函数做初始化"的写法多半是设计错误。',
            '工程细节：`override`/`final` 关键字让编译器替你核对签名（const/参数类型写错时裸写 virtual 是**新函数**而不是重写——经典静默 bug）；纯虚函数可以有实现（供派生类链式调用）；析构可以是纯虚（抽象类又需要基类逻辑时）。',
          ],
          followUps: [
            {
              question: '多继承时对象布局和 vtable 会发生什么？虚继承解决什么问题？',
              points: [
                '多继承：对象里有**多个 vptr**（每个带虚函数的基类子对象一个），cast 到不同基类时指针可能需要偏移（this 调整）；跨基类调用经 **thunk**（调整 this 再跳转）。',
                '**菱形继承**（D 继承 B、C，B/C 继承 A）：数据与函数**冗余两份 + 二义性**；虚继承让 A 子对象**共享一份**（虚基表指针间接定位），代价是访问虚基成员多一层间接、对象更大——所以准则仍是"优先组合，多继承只用于纯接口类（Java 风格）"。',
              ],
            },
          ],
        },
        {
          id: 'be-rust-async',
          title: 'Rust 的 async/await 是怎么工作的？为什么标准库没有运行时？',
          difficulty: 'advanced',
          tags: ['Rust', 'async', 'Future', 'tokio'],
          points: [
            '**Future 是惰性的状态机（与 JS Promise 的第一区别）**：`async fn` 编译成**匿名状态机类型**——每个 `.await` 点是一个状态分叉，字段保存跨 await 的局部变量；创建 future **什么都不执行**，直到被 executor **poll**；而 JS Promise 构造即执行、Go goroutine spawn 即跑——三种执行模型里 Rust 选了"显式驱动"。',
            '**poll 与 Waker 的契约**：`poll()` 返回 `Ready` 或 `Pending`——返回 Pending 时**必须登记 Waker**（异步事件的回调句柄），事件就绪时 executor 被 Waker 唤醒、重新 poll；**合同：没登记 Waker 就返回 Pending = 永远没人再叫醒你（死等）**——手写 Future 时最经典的 bug；这套"你告诉我怎么叫醒你"的回调式协作，正是零成本抽象：没事件时一个字节都不多花（对比 goroutine 每个几 KB 起步的栈）。',
            '**为什么标准库不带执行器（设计哲学题眼）**：Rust 支撑的场景横跨内核、嵌入式、WASM、服务端——**没有一种调度器适合所有场景**，所以标准库只定义 Future trait 与语法（编译器做状态机转换），执行器交给生态：**tokio** 事实标准（多线程 work-stealing）、async-std、embedded 专用单线程 executor——"语言管抽象、生态管策略"与 Go runtime 全家桶是两种哲学。',
            '**与 Go 的对比要成对地讲**：Go 无色并发（普通函数随便阻塞，runtime 调度一切，心智简单、生态无分裂）vs Rust 有色并发（async fn 与 sync fn 是两个世界，**传染性**——同步调用异步要 block_on、异步里禁长阻塞（会饿死 worker），跨界的痛苦真实存在）；换来的：**无 GC、确定性内存、单机百万连接级内存占用**——io 密集的极致场景（代理、数据库、边缘服务）Rust async 的密度优势才兑现。选型口径与 be-rust-tradeoff 题衔接：默认 Go，性能与内存密度是硬需求再上 Rust。',
            '**实用深水区清单**：**Send future**（跨 await 持有非 Send 类型如锁 guard 会让整个 future 非 Send——编译错误离根源很远，经典劝退点，解法 tokio 专用锁或缩小作用域）；**select! 与取消**（分支被 drop 即取消，注意清理副作用—— cancellation safety 是 tokio 使用的高频面试词）；block_in_place/block_on 的使用边界；async trait 的演进（async fn in trait 已稳定）。',
          ],
          followUps: [
            {
              question: '「在 async 里调用了一个阻塞函数（比如同步 IO 或重 CPU 循环）」会发生什么？怎么发现与修复？',
              points: [
                '后果：tokio 的 worker 线程被这个阻塞调用占住——**同队列的所有任务都跟着卡**（表现为整个服务 RT 尖刺、心跳超时，且监控上 CPU 不高——"看起来闲却卡死"的迷惑现场）；阻塞函数不会通知 executor，Waker 机制对它完全无效。',
                '发现：tokio-console / 任务级监控（task 运行时长分布）；修复三板斧：**spawn_blocking**（丢到专用阻塞线程池）、**rayon** 等 CPU 池（计算型）、换真正的异步库（std::fs → tokio::fs）；预防纪律：**第三方库是不是 async-native 要进依赖评审**（同步 DB 驱动进 async 服务 = 埋雷）——能主动提"阻塞审计"，说明真在生产踩过。',
              ],
            },
          ],
        },
        {
          id: 'be-cpp-memory-model',
          title: 'C++ 内存模型解决什么问题？六种 memory_order 怎么选？',
          difficulty: 'advanced',
          tags: ['C++', '内存模型', '无锁'],
          points: [
            '要解决的问题：**编译器重排 + CPU 乱序执行 + 多核缓存**三者叠加，单线程正确的代码在多线程下看到的顺序完全混乱；C++11 内存模型给出形式化契约——**数据竞争是 UB**，无锁代码必须声明同步关系（happens-before 的 C++ 表达：synchronizes-with）。',
            '六档记法（按强弱）：**seq_cst**（默认，全局全序，最强也最贵）；**acquire / release** 配对（release 写"广播"此前所有写，acquire 读"接收"——建立同步，是**自旋锁、发布-订阅数据**的标准档位）；**acq_rel**（读改写两用，CAS 用）；**relaxed**（只保证这个操作本身原子，不建立任何顺序——**只适合计数器**这类不需要同步其他数据的场景）。',
            '经典案例：**引用计数递减**——每次 `--count` 用 relaxed 就够（只关心最终归零），但**归零判定后要销毁对象**，需要 `atomic_thread_fence(release)`（最后一个递减者）+ acquire（判定者）配对，保证销毁时能看到其他线程的全部写入；标准库 shared_ptr 内部就是这么实现的。',
            '**volatile 在 C++ 不是线程同步工具**（与 Java 完全不同）：它只禁止编译器把读写优化掉，用途是 MMIO 寄存器访问；拿 volatile 当轻量 atomic 写多线程代码是经典事故——编译通过、单核测试通过、上多核/换编译器就炸。',
          ],
          followUps: [
            {
              question: '为什么一段 relaxed 的代码在 x86 上"跑起来没问题"，到 ARM 上就出错？',
              points: [
                'x86 是**强内存模型**（TSO）：load 具备 acquire 语义、store 具备 release 语义，只允许 store-load 重排——弱化成 relaxed 恰好等价于 acquire-release，测试发现不了问题；**ARM 是弱内存模型**：任意读写都可能重排，错误真正暴露。',
                '教训落点：内存序的正确性**不靠实测靠论证**（或 TSan）——在强模型硬件上测通过的弱内存序代码是"碰巧正确"；跨平台（服务器 ARM 化、Apple Silicon）让这类债集中爆雷。',
              ],
            },
            {
              question: '双重检查锁定（DCL）单例在 C++ 里怎么写才正确？',
              points: [
                '朴素 DCL 的坑：`instance_ = new Singleton` 不是原子的——**分配、构造、赋值指针**三步可能重排，另一线程拿到"非空但没构造完"的指针。需要 acquire/release：赋值用 `memory_order_release`，读取判空用 `memory_order_acquire`；裸 volatile 版本依旧是错的。',
                '工程正解两选：**C++11 起直接用函数内 static 局部变量**（标准保证初始化线程安全，编译器帮你做了正确的 DCL）；或 `std::call_once`。手写裸 new + 检查的现代代码里见到，基本可以直接判定作者内存模型不过关。',
              ],
            },
          ],
        },
        {
          id: 'be-rust-ownership',
          title: 'Rust 的所有权和借用规则是什么？为什么编译期就能保证内存安全？',
          difficulty: 'intermediate',
          tags: ['Rust', '所有权', '借用检查'],
          points: [
            '所有权三规则：每个值有**唯一所有者**；赋值/传参默认**移动**（源值立即失效，编译器禁止再用——与 C++ 移动后"有效但未定义"形成本质对比）；所有者出作用域自动 **drop**（确定性析构，即 Rust 版 RAII）。',
            '借用规则（核心中的核心）：任意时刻，一个值要么有**任意多个不可变借用 &T**，要么有**恰好一个可变借用 &mut T**——**别名与可变性互斥（aliasing XOR mutability）**。这一条规则同时消灭了：数据竞争（并发读写共享可变状态编译不过）、迭代器失效（遍历时改容器编译不过）、use-after-free（悬垂引用编译不过）。',
            '为什么编译期就够：GC 语言的内存安全靠**运行时追踪**（GC 扫描回收），Rust 把安全性转化为**编译期可判定的规则**（所有权的静态别名分析），运行时零成本——代价是学习曲线与"和借用检查器搏斗"的开发体验；NLL（非词法作用域生命周期）已让检查按真实使用点判定，大幅缓解了早期"作用域结束就算借用"的误伤。',
            '逃生舱与边界：需要共享可变时走**内部可变性**——`Cell/RefCell`（单线程，把借用检查挪到运行时、违规即 panic）、`Arc<Mutex<T>>`（多线程，运行时锁）；循环引用仍可能泄漏（Arc 循环），需要 Weak 打破——**与 shared_ptr 相同的结构性问题**，只是强计数不会 UB 只会泄漏。',
          ],
          followUps: [
            {
              question: '为什么 let s2 = s1 之后再用 s1 编译不过，而 i32 的赋值可以随便用？',
              points: [
                '堆上数据（String/Vec）默认**移动**：栈上的（指针、长度、容量）三件套拷给 s2，s1 被标记失效——避免两份栈数据指向同一块堆（双重释放风险）；**Copy 类型**（i32 等纯栈数据、无析构）赋值按位复制，两份独立，随便用。',
                '要共享堆数据就显式选择语义：`clone()`（深拷贝，显式付成本）、`&`（借用，受借用规则约束）、`Rc/Arc`（引用计数共享所有权）——**Rust 的设计哲学是让每一种共享都是显式选择**，C++ 里这些全部隐式发生。',
              ],
            },
          ],
        },
        {
          id: 'be-rust-lifetime',
          title: 'Rust 的生命周期标注在解决什么问题？什么时候必须写？',
          difficulty: 'advanced',
          tags: ['Rust', '生命周期', '借用检查'],
          points: [
            '解决的问题一句话：**引用不能活得比被引用的数据久**（防悬垂）——生命周期不是"延长对象寿命"的机制，而是**对引用存活期的约束与证明**；编译器的借用检查器用它们做静态验证，运行时零成本。',
            '为什么多数时候不用写：**省略规则（elision）**覆盖常见形态——每个引用参数获得独立生命周期；只有一个输入引用时输出借用它；方法里 &self 优先。必须显式标注的是编译器推不出的场景：返回的引用来自**多个输入**（`fn longest(\'a str...)` 太抽象？直接看：`fn longest<\'a>(a: &\'a str, b: &\'a str) -> &\'a str`，返回值存活期取两者交集）、**结构体持有引用**（Self 活多久引用就得活多久）。',
            '静态生命周期（\'static）的正确理解：字面量与 Box::leak 的数据活整个程序，`&\'static str` 表示"没有借任何更短命的东西"；trait bound 里的 `T: \'static` 表示"类型不借非静态数据"——两处语义不同，混着讲是面试减分点。',
            '与 GC 语言对比的落点：GC 用运行时扫描换"随手引用"自由；Rust 用编译期证明换零运行时成本——**自引用与图结构是成本集中区**（引用即约束，环与自指难表达），工程解法是用所有权图替代引用（arena + 索引/ id、Rc<RefCell>、Pin 稳定自引用）。',
          ],
          followUps: [
            {
              question: '自引用结构为什么是 Rust 的难点？Pin 解决什么？',
              points: [
                '自引用（结构体持有指向自己字段的引用）的问题是**移动即悬垂**：Rust 的值默认可移动（move 语义靠 memcpy），一搬家内引用仍指旧地址——借用检查器直接禁止这类结构裸写。',
                '**Pin** 是"承诺不被移动"的类型标记：`Pin<Box<T>>` 固定堆上位置，提供自引用安全（async/await 编译出的 future 内部自引用，靠 Pin 固定）——理解了"移动=memcpy 的默认权"就理解了 Pin 存在的理由；配套 Unpin 自动 trait 标记"随便搬"的普通类型。',
              ],
            },
            {
              question: '工程上什么时候宁可 clone 也不跟生命周期纠缠？',
              points: [
                '判断标准：**clone 是显式的局部成本，借用是全局的复杂度税**——数据小、路径不在热区、或生命周期把函数签名污染成 <\'a><\'b> 天书时，clone 更便宜（运行成本 + 人类理解成本一起算）。',
                '反过来的红线：大对象、每请求百万次的热路径，clone（尤其深拷贝）是真开销——这时用 Arc 共享、COW（Cow<str> 写时复制）、或重构数据所有权（arena 持有 + id 索引）替代纠缠。**"先 clone 让它跑，profiler 告诉你哪里值得借"是务实的 Rust 工程化路径**。',
              ],
            },
          ],
        },
        {
          id: 'be-rust-send-sync',
          title: 'Rust 的 Send 和 Sync 是什么？"无畏并发"是怎么做到的？',
          difficulty: 'advanced',
          tags: ['Rust', '并发', 'Send', 'Sync'],
          points: [
            '两个**标记 trait**（零大小的编译期标记）：**Send** = 所有权可以转移到另一个线程；**Sync** = `&T` 可以跨线程共享（T: Sync ⟺ &T: Send）。编译器对跨线程原语（thread::spawn、channel）要求参数满足 Send——**不是运行时检查，是类型系统门槛**。',
            '数据竞争被编译期排除的机制：竞态需要"两个线程访问同一可变状态且至少一个写"；Rust 里并发写需要 &mut 或内部可变性——而 `Rc` 是 !Send + !Sync（非原子计数），`RefCell` 是 Send 但 !Sync（非原子借用计数，不能跨线程共享引用）——两种方式放进 thread::spawn 或跨线程共享都直接编译失败。C++ 里同样的代码能编译通过、靠 memory model 事后治理——**这是两种范式：事后正确 vs 事前禁止**。',
            '共享可变的标准姿势：**Arc<Mutex<T>> / Arc<RwLock<T>>**——Mutex 提供"内部可变性 + Sync"（把 &Mutex<T> 变成合法的跨线程可变访问）；**死锁 Rust 不管**（锁排序、超时仍要自己防）——"无畏并发"防的是数据竞争，不是所有并发 bug，这句边界话是高级感所在。',
            'async 场景的延伸考点：future 在 .await 间跨线程调度，要求**整个 future 是 Send**——跨 await 持有 !Send 的东西（如 `std::sync::MutexGuard`）会让 future 整体 !Send，报错位置离根源很远（经典编译器劝退点）；解法是 `tokio::sync::Mutex`（跨 await 安全）或缩小 guard 作用域。',
          ],
          followUps: [
            {
              question: '为什么 Rc<Vec<i32>> 不能跨线程，Arc<Vec<i32>> 就可以？Vec<i32> 本身不是一直没变吗？',
              points: [
                '问题不在 Vec 在**计数器**：clone/drop 都要改引用计数，Rc 用普通整数——两个线程同时 clone 就是数据竞争（计数错乱 → 双重释放）；Arc 把计数换成**原子操作**，所有权转移安全，所以 Arc<T>: Send（当 T: Send + Sync）。',
                '再进一步：`T: Send` 还要求**内容可转移**——`Arc<RefCell<i32>>` 依然 !Send（RefCell 的借用计数非原子，且 &RefCell 共享可变无锁保护）；Arc 只解决"所有权的线程间转移"，**可变性必须再套 Mutex**——Arc + Mutex 的组合拳正是这套类型系统的正解。',
              ],
            },
          ],
        },
        {
          id: 'be-rust-tradeoff',
          title: '什么时候该选 Rust，什么时候不该？和 Go/C++ 怎么取舍？',
          difficulty: 'basic',
          tags: ['Rust', '技术选型', '工程权衡'],
          points: [
            '定位一句话：**C/C++ 级性能 + 编译期内存安全**——换来的代价是学习曲线（所有权/生命周期）、编译速度、生态与招聘池。选型先问两个问题：性能与内存安全是不是**硬约束**？团队愿不愿意付学习税？',
            '值得选的场景：**基础设施**（数据库、代理/网关、存储引擎）、**对漏洞敏感的组件**（解析器、协议栈——内存安全漏洞占比 70% 的历史数据是 Chromium/Rust 化的核心论据）、WASM、CLI 工具、嵌入式。**不占优的场景**：快速迭代的业务服务（Go 的开发效率 + GC 足够）、重生态的算法/CV（Python/C++ 现存量）。',
            '与 Go 的对比要说成互补：Go = GC + goroutine + 极简语言，**服务端业务交付速度**优先；Rust = 所有权 + 零成本抽象，**底层组件与极致性能**优先。工业界的主流形态是**组合**：Rust 写核心库/性能敏感组件，经 FFI/PyO3/CGo 供 Go/Python 调用（如 Polars、tikv、现代 codec）。',
            '与 C++ 的对比要说清迁移价值：Rust 用类型系统消灭了 C++ 的三大事故来源（悬垂/双重释放/数据竞争），同时保留了零开销抽象与确定性析构；但存量 C++ 生态（Qt/游戏引擎/HPC 库）短期不可替代——**绿地组件试水、渐进替代**是现实路径（cxx/autocxx 这类互操作库）。',
          ],
          followUps: [
            {
              question: 'Rust 的 unsafe 是什么？它推翻"内存安全"的承诺吗？',
              points: [
                'unsafe 是**受限的逃逸口**：unsafe 块/函数内解锁四种额外能力（解引用裸指针、调用 unsafe 函数/FFI、访问可变静态、实现 unsafe trait）——它不关闭检查，而是**把"维护这些操作的安全不变量"的责任显式交给作者**。',
                '承诺依然成立的原因：安全承诺是"**safe 代码不引发 UB**"——unsafe 内核被封装进 safe API（标准库大量如此：Vec 内部裸指针，外部借用规则保护），调用者无需 unsafe 就无法制造 UB；工程纪律是 unsafe 最小化 + 审计标注（#`#[deny(unsafe_code)]` 默认禁、逐块豁免）。',
              ],
            },
          ],
        },
        {
          id: 'be-cpp-stl-internals',
          title: 'STL 容器存放的是对象本身还是引用？为什么 list 不能用 std::sort？',
          difficulty: 'basic',
          tags: ['真题改编', 'STL', '迭代器', '容器'],
          points: [
            '**STL 是值语义（清华原题）**：往容器里放对象，放进去的是**副本**（拷贝构造或移动构造）——所以元素类型必须可拷贝；把派生类对象放进 `vector<Base>` 会发生**对象切割**（只拷贝基类子对象）；想共享同一对象要存指针/智能指针。这一条是理解 STL 一切行为的起点。',
            '**迭代器类别决定可用算法**：**vector/deque 是随机访问迭代器**（支持 it+n、it1<it2）；**list/set/map 只有双向迭代器**（只有 ++/--/*/==）；**std::sort 要求随机访问迭代器**——`sort(list.begin(), list.end())` **编译都过不了**（清华原题），list 必须用**成员函数 list::sort**（基于归并，指针链接不需要随机访问）；stack/queue 干脆没有迭代器。',
            '**map/set 的有序性**：红黑树实现，插入时即按键有序——“对 map 排序”是个伪需求（原题陷阱项）；要对 value 排序应拷到 `vector<pair<K,V>>` 再排。map 的迭代器是双向的：遍历天然有序，但 sort/nth_element 一律不可用。',
            '**deque 的分段结构（原题：头插谁最快）**：deque = 分段连续缓冲区 + 中央控制数组——**头尾插入都均摊 O(1)**（vector 头插要整体搬移 O(n)）；随机访问仍 O(1)（两级下标换算）。所以“频繁两端增删”选 deque，“频繁中间插删 + 遍历”选 list，“默认首选”是 vector（连续内存缓存友好——与 Cache 局部性题呼应）。',
          ],
          followUps: [
            {
              question: '为什么遍历习惯写 ++it 而不是 it++？',
              points: [
                '前置 ++ 返回自增后的 *this（引用）；后置 ++ 要用 int 哑参区分重载，**必须返回自增前的旧值副本**（清华原题实现：`int operator++(int) { return v; }`）——自定义类型后置版多一次拷贝构造。',
                '对 int 无所谓（编译器优化掉），对迭代器（含引用计数的结点对象）是真实的额外开销——习惯上循环一律写前置。',
              ],
            },
          ],
        },
        {
          id: 'be-cpp-copy-control',
          title: '什么时候调用拷贝构造、什么时候调用赋值运算符？默认浅拷贝为什么会 double free？',
          difficulty: 'intermediate',
          tags: ['真题改编', '拷贝控制', '浅拷贝', 'RVO', '三法则'],
          points: [
            '**触发时机的经典陷阱（清华原题）**：拷贝构造只在“**用已有对象初始化新对象**”时触发——`A b = a;`（定义时初始化，虽然有 = 号！）、按值传参、按值返回；`b = a;`（**已存在对象**赋值）走 operator=。一行代码区分：左边是“新声明的变量” → 拷贝构造；左边是“已有的变量” → 赋值。',
            '**默认拷贝是逐成员浅拷贝（OOP QA 原题）**：编译器生成的拷贝构造把指针成员**原样复制**——两个对象共享同一块堆内存，析构时 **double free**（或一方析构后另一方悬垂）。管理资源的类必须自定义深拷贝，或 `=delete` 禁止拷贝——这就是**三法则**（析构/拷贝构造/拷贝赋值要么全自定义要么全默认）的由来（五法则加上移动两个；RAII 与智能指针题是它的现代解法）。',
            '**构造与析构顺序（原题）**：构造 = **基类（按继承声明顺序）→ 成员（按类内声明顺序）→ 函数体**；析构严格逆序。成员真实初始化顺序**只由声明顺序决定**，与初始化列表的书写顺序无关——列表顺序与声明顺序不一致是隐蔽 bug 的经典来源（编译器 -Wreorder 会警告）。',
            '**初始化列表的必要性（原题）**：**const 成员、引用成员、没有默认构造函数的成员对象**只能在初始化列表里初始化（函数体内是“赋值”不是“初始化”，对这三类非法）。',
            '**RVO/拷贝消除（OOP 原题用 -fno-elide-constructors 验证）**：按值返回临时对象时编译器把“构造临时 → 拷贝到返回位”省略成直接在返回位构造（NRVO）；**C++17 起纯右值的拷贝消除是语言保证**。面试价值：能解释“为什么现代 C++ 按值返回 vector 不再昂贵”，说明你跟上了移动语义之后的语言演进。',
          ],
          followUps: [
            {
              question: 'explicit 关键字解决什么问题？单参构造函数为什么要警惕？',
              points: [
                '单参构造函数默认定义了一条**隐式转换路径**（`A a = 4;` 合法——4 被悄悄转成 A 临时对象）；转换构造 + 转换运算符（operator int()）同时存在还可能形成**二义性转换链**（OOP 原题：一条表达式串联多次用户定义转换）。',
                'explicit 禁止拷贝初始化式的隐式转换（保留直接初始化与显式 static_cast）——**单参构造默认加 explicit** 是现代 C++ 的评审纪律；C++11 起 conversion operator 也能 explicit。',
              ],
            },
            {
              question: '数一下这段代码调用了几次构造函数？（清华原题：A* a1[3]; A a2[2]; a2[0]=4; func(a2[0]);）',
              points: [
                '**4 次**：a2[2] 对象数组逐个默认构造 2 次；a2[0]=4 走单参转换构造生成临时对象 1 次（再拷贝赋值）；func 按值传参拷贝构造 1 次。**指针数组 a1[3] 一次都不调**（只分配 3 个指针）。',
                '考点本质：**隐式转换与传值都在悄悄调构造**——面试官用它检验你是否真的理解拷贝控制的每个触发点；能对每一步说出“哪一次、哪种构造”即满分。',
              ],
            },
          ],
        },
        {
          id: 'be-cpp-binding-slicing',
          title: '对象切割是怎么回事？动态绑定发生的必要条件是什么？',
          difficulty: 'intermediate',
          tags: ['真题改编', '多态', '对象切割', '静态绑定', '名字隐藏'],
          points: [
            '**动态绑定的必要条件（清华 OOP 原题选择题）**：只有通过**基类指针或引用**调用虚函数才走运行期绑定（经 vptr 查 vtable）；**对对象本身调用永远静态绑定**——“有时调 A 的 Do 有时调 B 的 Do”的 p 只能是 **A&**（A* 也行但 p.Do() 语法排除指针；对象/派生对象则永远静态）。',
            '**对象切割的两条路径（原题输出题）**：① **派生类赋值给基类对象**（`a = b; a.print()` 输出的是基类版本的值——派生新增成员全丢）；② **按值传参**（`void Call(B p)` 传派生对象 c，p.Fun() 输出 A::Fun——p 是被切割的 B 副本，但虚函数 B::Do 仍按 B 的 vtable 输出）。**保住多态的唯一方式：指针或引用传递**。',
            '**名字隐藏（原题 Hero/Priest）**：派生类定义同名函数会**隐藏基类的全部同名重载**（不是重载！是遮蔽）；函数是否动态绑定**只看基类声明是否 virtual**，与派生类是否再写 virtual 无关——非虚的 attack 即使派生“重定义”也静态绑定到基类版本。修复：`using Base::f;` 把基类重载集引入派生类作用域（原题：f(17.315) 才能命中基类的 f(double)）。',
            '**与 vtable 题的分工**：那题讲**机制**（虚表如何实现分派、虚析构为什么必要）；本题讲**使用陷阱**（什么时候你以为的多态悄悄失效）——评审 C++ 代码时这三类是高频 bug 源：值传递多态、同名隐藏、构造期调用虚函数。',
          ],
          followUps: [
            {
              question: 'C++ 构造函数里调用虚函数，会得到多态吗？和 Java 的行为一样吗？',
              points: [
                '**C++：不会**——构造期间 vptr 指向**当前正在构造的类**的 vtable（基类构造时 vptr 指基类表），调用的是当前层版本；且访问派生成员是未定义行为。',
                '**Java：会**（动态绑定始终生效）——但派生类字段尚未初始化，覆写方法读到 null/0（真题：父类构造器调 print()，子类覆写访问未初始化的 array → NullPointerException）。两种语言在“构造期多态”上都建议同一条纪律：**构造器只做构造，不调可被覆盖的方法**（Java 方向的构造器陷阱题同源）。',
              ],
            },
          ],
        },
        {
          id: 'be-cpp-object-layout',
          title: '一个带虚函数的类，sizeof 是多少？vtable 和 vptr 存在哪里？',
          difficulty: 'advanced',
          tags: ['真题改编', '对象模型', 'vptr', '内存布局'],
          points: [
            '**两个存储位置（OOP QA 原题）**：**vtable 每个多态类一张**（存虚函数地址 + RTTI 信息，放在只读数据段，全体对象共享）；**vptr 每个对象一个**（通常在对象头部，占一个指针宽度）。推论：**含虚函数的空类 sizeof = 8**（64 位下指针宽度），**普通空类 sizeof = 1**（保证不同对象地址唯一——数组元素不重址）。',
            '**对象布局推演**：无虚函数的类大小 = 成员之和（+对齐 padding）；加了虚函数 = 成员 + vptr（8B）；**多重继承下对象可能有多个 vptr**（**每个含虚函数的基类子对象各持一个**；虚继承在某些 ABI 下还会引入独立的 vbptr）——这就是“为什么多继承复杂”的具象化。静态成员不占对象大小（存静态区）；成员函数不占（代码段）。',
            '**构造期间 vptr 的变化（进阶考点）**：vptr 随构造进度逐层切换——基类构造时指向基类表、进入派生类构造才切到派生表；析构反向。这解释了“构造/析构中调虚函数得不到派生行为”（binding-slicing 题追问的机制根源）。',
            '**口试延伸题**：`class Node { Node* next; };` 合法吗？——**自身类型的指针/引用成员合法**（大小固定且可用前向声明的不完整类型），**自身类型的对象成员非法**（编译期要无限递归求大小）——链表/树节点全是自引用指针实现（清华原题选择题）。',
          ],
          followUps: [
            {
              question: 'const 成员函数重载是怎么回事？static 成员函数为什么不能是 const？',
              points: [
                '`void print()` 与 `void print() const` 是合法重载（this 指针类型不同：X* const vs const X* const）；**const 对象只能调 const 版本**，非常量对象优先非常量版本（清华原题输出 "23"）——const 参与重载决议。',
                'static 成员函数**没有 this**，无“常量与否”可言——不能是 const 也不能是 virtual；mutable 成员是 const 函数中唯一的可写例外（常用于缓存/计数）。',
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'be-mysql',
      name: 'MySQL',
      description: '索引、事务、锁与日志体系——后端面试出现频率最高的单一主题。',
      references: [
        { label: 'MySQL 8.0 Reference Manual: InnoDB', url: 'https://dev.mysql.com/doc/refman/8.0/en/innodb-storage-engine.html' },
        { label: 'MySQL 官方博客', url: 'https://blogs.oracle.com/mysql/' },
      ],
      questions: [
        {
          id: 'be-mysql-btree',
          title: 'InnoDB 为什么选择 B+ 树作为索引结构？',
          difficulty: 'basic',
          tags: ['MySQL', '索引', 'B+树'],
          points: [
            '**矮胖树形，IO 次数可控**：非叶子节点只存键与指针（不存数据），16KB 页能放约 1200 个指针，3 层可索引约 2000 万行——**等值查询最多 3 次页 IO**，且热点页常驻 buffer pool。',
            '**叶子节点有序且双向链表相连**：范围查询（BETWEEN、ORDER BY、前缀 LIKE）定位起点后顺序扫链表即可；B 树做范围要中序回溯父节点。',
            '对比：**Hash 索引**等值 O(1) 但不支持范围/排序/最左前缀；**红黑树/AVL** 二叉结构树高 O(log n) 且每个节点一次 IO，千万级数据 20+ 层不可接受；**跳表**（Redis zset 用）对内存友好但多层指针在磁盘上浪费页空间、IO 局部性差。',
            'B+ 树的另一个工程优势：**顺序插入（自增主键）总是写最右叶子页**，页分裂极少；随机主键（UUID）则频繁分裂与页缓存抖动——索引结构与写入模式强相关。',
          ],
          followUps: [
            {
              question: '为什么自增主键比 UUID 好？用业务字段（如手机号）做主键有什么问题？',
              points: [
                '自增：顺序写入页尾不分裂、主键短（所有二级索引叶子存主键值，主键长 → **每个二级索引都膨胀**）。',
                'UUID：随机插入导致页分裂（页利用率下降、产生碎片）、36 字节主键让二级索引集体变胖；确需分布式 ID 用趋势递增方案（雪花/号段）。',
                '业务字段做主键还有变更风险：主键一旦更新，所有二级索引连带维护。',
              ],
            },
            {
              question: 'B+ 树的页分裂与删除合并具体怎么工作？删除后的页会一直稀疏下去吗？',
              points: [
                '**分裂**：满页插入时（已有 L 个 key 再进一个，共 L+1 个参与分配）从中间点分成两页——**容量 L 为奇数时恰好左右均分**，L 为偶数时只能 ⌈L+1/2⌉/⌊ 偏置分，递增插入（自增主键）总有"只在最右页追加"的优化——InnoDB 对顺序插入会做**偏右分裂**（旧页留空、新页独占），避免反复平分导致页利用率一路掉到 50%；随机插入（UUID）只能 50-50 均分，页利用率 ~70% 且上层节点随之分裂、树高层写放大。',
                '**合并**：删除先尝试**向兄弟借**（rotation，重分发键），借不到才**与兄弟合并**并把父节点键下移——合并可能级联向上传播。有一条反直觉的规则（浙大作业原题口径）：**内部节点最少要有 2 个指针（1 个 key），叶子节点剩 1 个 key 也合法**——因为叶层只是数据链，内部层"单链"会退化成链表。',
                '**工程真相：InnoDB 不做激进合并**——merge 有阈值（MERGE_THRESHOLD 默认 50%），大量删除后页只是稀疏不还空间，表"删了但不变小"；回收靠 `OPTIMIZE TABLE`（在线重建）或 pt-osc。这也解释了"批量删除大表一半数据后磁盘没小"的常见疑问。',
              ],
            },
          ],
        },
        {
          id: 'be-mysql-index-type',
          title: '聚簇索引和二级索引的区别？什么是回表、覆盖索引？',
          difficulty: 'basic',
          tags: ['索引', '回表', '覆盖索引'],
          points: [
            '**聚簇索引（主键索引）**：叶子节点存**整行数据**，表本身就是按主键组织的 B+ 树（索引即数据）；**二级索引**：叶子存"索引列 + 主键值"，查询需要整行时**拿主键回聚簇索引再查一次——回表**。',
            '**覆盖索引**：查询所需列全在索引里（如 `select id, name from t where name=?` 走 name 索引），**免回表**；explain 的 Extra 显示 `Using index`。高频查询把 SELECT 列建进联合索引（避免 select *）是性价比最高的优化。',
            '推论：**二级索引不宜过多**——每个都要维护 B+ 树、叶子冗余主键；联合索引 (a,b,c) 一个顶三个，但也要评估写放大。',
            'MySQL 8.0 新形态：**倒序索引**（desc 真正落地）、**函数索引**、**不可见索引**（invisible：先隐形验证影响再决定删除，安全下线索引的利器）。',
          ],
          followUps: [
            {
              question: '联合索引 (a, b, c) 能响应哪些查询？最左前缀的确切含义是什么？',
              points: [
                '可走索引：a、a+b、a+b+c、a+c（a 走索引定位，c 在叶子层过滤不回表部分）、`a like \'x%\'`；不可走：b、c、b+c（缺少最左列，B+ 树有序性无从谈起）。',
                '本质：**联合索引的排序是字典序**——先按 a 排，a 相同再按 b 排；跳过前缀意味着数据对该列无序。范围查询（a>10）之后的列 b 失去有序性（只能过滤不能精确定位）——"范围查询会让后续列失效"是最常见的联合索引设计失误。',
              ],
            },
          ],
        },
        {
          id: 'be-mysql-vs-pg',
          title: 'MySQL 和 PostgreSQL 怎么选？两者 MVCC 和复制机制的差异是根本分歧吗？',
          difficulty: 'intermediate',
          tags: ['MySQL', 'PostgreSQL', 'MVCC', '选型'],
          points: [
            '**存储组织的第一差异**：MySQL InnoDB 是**聚簇索引**（数据即主键 B+ 树叶子，二级索引存主键回表——查询友好）；PG 是**堆表 + 全部独立索引**（插入只需追加堆 + 更新各索引，写友好、索引策略灵活但回表普遍）。衍生差异：PG 支持**部分索引、表达式索引、多种索引类型**（btree/gin/gist/brin——倒排 GIN 配 pgvector 全文与向量检索），InnoDB 索引形态单一但主键点查极快。',
            '**MVCC 实现是根本分歧（必考深水区）**：**PG**——**多版本留在堆内**：UPDATE 写新版本行、旧行打 xmax 标记，死元组靠 **VACUUM** 后台清理（autovacuum 按阈值触发）；风险是**表与索引膨胀**（死元组清不及时）、长事务阻塞 VACUUM 制造更多垃圾。**InnoDB**——旧版本放 **undo log 链**， purge 线程自动回收，用户无感；风险是**长事务导致 undo 膨胀与回滚段占用**。一句话：**PG 把清理责任显式交给运维（VACUUM 调优是真功夫），InnoDB 把它藏进引擎**——面试说出"谁清理旧版本"这个视角，说明对比是懂原理的对比。',
            '**复制与生态差异**：PG 逻辑复制是**发布/订阅 + 解析 WAL**，表级粒度、**不复制 DDL**、**复制槽不消费会保留 WAL 撑爆磁盘**（经典事故，要监控 pg_replication_slots；17/18 版本补 failover slots）；MySQL binlog 实例级、DDL 可复制、GTID 切换成熟——**高可用体系 MySQL 更省心，CDC 生态两者都有（Canal vs Debezium/_pgoutput）**。',
            '**PG 的独特武器（选型加分项）**：**JSONB**（二进制 JSON 带 GIN 索引，半结构化不用上 MongoDB）、**pgvector**（向量检索进数据库，中小规模 RAG 免独立向量库）、丰富扩展生态（PostGIS 地理、TimescaleDB 时序）、**窗口函数/CTE/物料化视图等 SQL 能力更强**（复杂分析一条 SQL 顶 MySQL 多条）；MySQL 的护城河：**国内生态与人才储备、运维经验沉淀、云厂商支持成熟度、简单场景的稳定省心**。',
            '**选型口径收束**：**复杂查询、GIS、向量、半结构化、扩展玩法 → PG**（近年在国内明显回潮）；**团队 MySQL 经验深、高可用要求成熟方案、典型 OLTP → MySQL**；新项目从零开始且无历史包袱，PG 值得认真评估——两都会用才是现实（不同服务按特征选库）。主动提一句 **PG 18 的异步 IO（io_method=worker/io_uring）让大表扫描吞吐大幅提升**，是版本视野的加分点（与操作系统方向 io_uring 题呼应）。',
          ],
          followUps: [
            {
              question: 'PG 的表膨胀了，怎么处理和预防？',
              points: [
                '应急：手动 **VACUUM**（可并发跑不锁写）/ 严重时 **VACUUM FULL**（锁表重写回收空间，一般只敢维护窗口做）或 pg_repack（在线重建，生产首选）；先查**元凶**：`pg_stat_activity` 里的长事务（最老的 xid 决定清理边界——一个跑几天的查询能让整个库的垃圾都清不掉）与**废弃的复制槽/未消费的槽**（同样钉住 WAL 边界）。',
                '预防：autovacuum 调优（大表调低 scale_factor 提高清理频率）、监控 `pg_stat_user_tables` 的 dead_tup 比例与**表年龄**（事务 ID 回卷防护：autovacuum_freeze）、长事务与复制槽的告警**必须在监控里**——"PG 运维 = 管 VACUUM 的边界条件"，这句经验总结能瞬间区分背书与实操。',
              ],
            },
          ],
        },
        {
          id: 'be-mysql-index-failure',
          title: '哪些情况会导致索引失效？线上 SQL 突然变慢你的排查路径是什么？',
          difficulty: 'intermediate',
          tags: ['索引失效', '慢查询', 'explain'],
          points: [
            '失效清单：① 对索引列做**函数/运算**（`where DATE(create_time)=...`、`where id+1=2`）——B+ 树存的是原值；② **隐式类型转换**（varchar 列 where phone=138xxx 按**数字**比较，等价于对列加函数；反之数字列用字符串查不失效）；③ 前导模糊 `like \'%xx\'`；④ **OR 两侧有非索引列**（除非 index merge）；⑤ 联合索引不满足最左前缀；⑥ 优化器判定**回表代价高于全表扫**（如回表行数占比 >20-30%）——这不算"失效"，是**优化器的理性选择**。',
            '排查路径：`explain`（重点 type：ALL<index<range<ref<const；rows 估算；key 实际用的索引；Extra：Using filesort/temporary 是坏信号）→ 看实际 rows 与统计信息是否失真（`analyze table`）→ 改写 SQL 或建/改索引 → 复测。',
            '线上突变常见外因：**统计信息过期**导致执行计划翻转（MySQL 8.0 可用直方图）、**数据量增长越过了优化器阈值**、索引被误删、隐式字符集转换（表与连接字符集不一致时 join 列失效）。',
            '兜底手段：force index 强制（治标）、SQL Plan Management 思想的计划固化、慢查询日志 + pt-query-digest 定期巡检。',
          ],
          followUps: [
            {
              question: '深分页 `limit 1000000, 10` 为什么慢？有哪几种优化方案？',
              points: [
                '慢因：offset 无索引意义——服务器**取出并丢弃前 100 万行**（若走二级索引还要回表 100 万次）。',
                '方案：① **游标/滚动分页**：`where id > #{last_id} limit 10`（只支持顺序翻页，性能恒定，首选）；② **延迟关联**：先在覆盖索引里定位主键再回表：`select * from t join (select id from t where ... limit 1000000,10) tmp using(id)`；③ 业务限制（只允许前 N 页，用搜索引擎解决深翻页）。',
              ],
            },
            {
              question: 'Using filesort 一定是把数据放到文件里排序吗？怎么消除？',
              points: [
                '**不是**。filesort 是 MySQL 对"**无法利用索引顺序完成排序**"的内部算法名：排序主要在内存的 **sort_buffer**（sort_buffer_size）里完成，只有数据量超限或含大字段时才写**临时文件**做多路归并——名字里的 file 有历史误导性。`Sort_merge_passes` 大于 0 说明真的发生过落盘归并。',
                    '**根因与治法**：filesort 说明 ORDER BY 没吃到索引序——建联合索引让索引本身有序（`WHERE user_id = ? ORDER BY created_at` 建 `(user_id, created_at)` 直接消除），或用覆盖索引减小排序数据体积；小结果集的内存 filesort 微不足道，**大表上的 filesort 才是要消灭的目标**。',
              ],
            },
            {
              question: '否定条件（!=、NOT IN、NOT LIKE）能用上索引吗？（真题：含 ¬ 谓词的选择怎么处理）',
              points: [
                '**等值否定无索引可用**：`¬(city = \'Brooklyn\')` 要的是"除它之外的全部"——B+ 树擅长**定位区间**，而补集不是任何一段有序区间，只能全表扫逐行过滤（浙大作业 15.6 原题口径）；`!=` 与 `NOT IN` 同理，"走不了索引"多数时候是**代价选择下的必然**，不是引擎缺陷。',
                '**范围否定要先做等价改写**：`¬(city < \'Brooklyn\')` ≡ `city >= \'Brooklyn\'`——德摩根展开把否定推到原子谓词上，能转成闭区间就**照样走范围扫描**（真题 15.6c：`¬(A ∨ B)` = `¬A ∧ ¬B`，改写后一段走索引、一段作为过滤条件）。这条"先改写再谈索引"的顺序是优化器与手写 SQL 共同的第一步。',
                '应用侧推论：`status != 1` 这类查询若占比小，可改写成 `status IN (0,2,3)`（枚举有限时）让优化器拿到精确区间；NOT LIKE \'%xx%\' 与前导模糊同罪，走全文/倒排才是正解。',
              ],
            },
          ],
        },
        {
          id: 'be-mysql-transaction-isolation',
          title: '事务的 ACID 分别靠什么实现？四种隔离级别能解决什么问题？',
          difficulty: 'basic',
          tags: ['事务', '隔离级别', 'ACID'],
          points: [
            'InnoDB 的实现拆解：**原子性 ← undo log**（记录反向操作，回滚重放）；**持久性 ← redo log**（WAL，先写日志后刷数据页，崩溃重放）；**隔离性 ← 锁 + MVCC**；**一致性 ← 前三者 + 业务约束**（一致性是目的，其余是手段）。',
            '并发问题阶梯：脏读（读到未提交）→ 不可重复读（同一事务两次读值不同，他人 update 提交）→ 幻读（两次读行数不同，他人 insert 提交）。',
            '隔离级别：**RU**（啥都不防）→ **RC**（防脏读，每条语句新快照）→ **RR**（防不可重复读，事务首读建快照 + 间隙锁防幻读，**InnoDB 默认**）→ **串行化**（读加锁，并发归零）。标准 SQL 里 RR 不防幻读，InnoDB 通过 MVCC + Next-Key Lock 基本做到。',
            '工程事实：很多大厂线上用 **RC**——间隙锁范围小、死锁少、锁并发好，业务用"更新带条件 + 唯一约束"自己挡幻读；选择隔离级别是并发度与正确性成本的工程权衡，不是默认即最优。',
          ],
          followUps: [
            {
              question: 'RR 下 MVCC 解决了快照读的幻读，那当前读呢？',
              points: [
                '当前读（select ... for update / update / insert）读**最新版本**，防幻读靠 **Next-Key Lock = 记录锁 + 间隙锁**：锁住已存在记录及记录间空隙，阻止事务内再次范围读时出现新行。',
                '局限：间隙锁只在 RR 有；且"先快照读后当前读"混用仍可能感知到新行——彻底一致要么全程加锁读，要么业务层防重。',
              ],
            },
            {
              question: '把线上 MySQL 从 RR 调成 RC，收益和改造注意清单是什么？',
              points: [
                '**收益来自锁**：RC 的当前读**没有间隙锁**，只锁命中的索引行——锁冲突范围小、**死锁概率显著下降**、并发写入吞吐更高；而 RC 放弃的"可重复读"对多数业务（下单、扣款、点赞）本来就用不到。Oracle/PG 默认 RC 也佐证了这是工业界主流。',
                '**改造注意清单**：① 排查依赖可重复读语义的逻辑（长事务里两次读同一行做比对、批量对账）；② RC 下 binlog **必须用 row 格式**——statement 格式在 RC 下可能主从不一致（新版默认 row 后此约束自然满足）；③ 没了间隙锁，防重复插入更要靠**唯一索引兜底**。',
                '答法落点：隔离级别不是越高越好，是**业务语义与锁代价的权衡**——给出"我们业务依赖什么、放弃什么"的具体判断，比背四个级别的名字高一档。',
              ],
            },
          ],
        },
        {
          id: 'be-mysql-mvcc',
          title: 'InnoDB 的 MVCC 是如何实现的？',
          difficulty: 'advanced',
          tags: ['MySQL', 'MVCC', 'Read View'],
          points: [
            '三个组件：**隐藏列**（DB_TRX_ID 最后修改事务 ID、DB_ROLL_PTR 回滚指针）、**Undo Log 版本链**（旧版本靠回滚指针串成链）、**Read View**（读事务的可见性判断器）。',
            'Read View 字段：m_ids（生成时刻**活跃未提交**事务集合）、low_limit_id（下一个待分配 ID）、up_limit_id（最小活跃 ID）。对版本链上某版本的 trx_id 判断：**< up_limit_id → 已提交可见；≥ low_limit_id → 不可见；在中间 → 在 m_ids 里不可见、不在则可见**；不可见就沿 roll_ptr 找上一版本重判。',
            '**RC 与 RR 的唯一实现差异**：Read View 的生成时机——RC **每条查询语句**新建（所以能读到别人新提交的 → 不可重复读）；RR **事务第一次快照读**生成并复用（全程同一视图 → 可重复读）。',
            '意义：读不加锁、读写不阻塞，InnoDB 并发能力的根基；代价是版本链维护（undo 膨胀风险）与"读到的是过去"的语义需要业务理解。',
          ],
          followUps: [
            {
              question: '长事务有什么危害？如何发现和治理？',
              points: [
                '长事务让 undo 版本链无法清理（所有晚于它的 Read View 都可能引用旧版本）→ **undo 膨胀、history list 增长**，查询变慢、磁盘暴涨；还长时间持锁，放大死锁与连接占用。',
                '发现：`information_schema.innodb_trx`（trx_started 很久的）、监控 history list length；治理：事务拆小、查询移出事务、避免事务里做 RPC、设置超时（innodb_lock_wait_timeout + 业务超时）。',
              ],
            },
          ],
        },
        {
          id: 'be-mysql-lock',
          title: 'InnoDB 有哪些锁？死锁是怎么发生的，如何排查和预防？',
          difficulty: 'advanced',
          tags: ['锁', '死锁', '间隙锁'],
          points: [
            '锁粒度/类型：**行锁**（记录锁 Record Lock）、**间隙锁 Gap Lock**（锁区间防插入）、**Next-Key Lock**（记录+间隙，RR 默认）、**插入意向锁**；表级：意向锁（IS/IX，快速判断表内有行锁）、MDL 元数据锁（DDL 与长查询互斥的经典事故源）、AUTO-INC 锁。',
            '锁的模式：共享锁 S（`lock in share mode`）/ 排他锁 X（`for update`）；加锁的基本单位是 Next-Key，**等值唯一索引命中退化为记录锁，等值未命中退化为间隙锁**——"锁住不存在的行"就靠间隙锁。',
            '死锁机制：两个事务以不同顺序持锁并互相等待，InnoDB **wait-for graph 主动检测**，回滚 undo 量小的事务（报 1213 错误）；`show engine innodb status` 的 LATEST DETECTED DEADLOCK 或开 `innodb_print_all_deadlocks` 记录全部。',
            '预防：**多行加锁按固定顺序**（如按主键排序后更新）、事务短小、索引正确（无索引 update 会锁全表扫描路径上的大量间隙）、用原子语句替代 select-then-update、降低隔离级别（RC 无间隙锁死锁少）。',
          ],
          followUps: [
            {
              question: '`select count(*)` 很慢是什么原因？为什么 InnoDB 没有存总行数？',
              points: [
                'MyISAM 存了总行数（无并发写时直接返回）；InnoDB 的 count 要**看事务视角**——不同 Read View 可见的行数不同，无法存一个全局准确的数，只能扫描（走最小的索引树）。',
                '优化：业务计数走**汇总表/Redis 计数器**（最终一致 + 对账）；`count(*) ≈ count(1) > count(主键)`（主键要取值，* 由优化器选最小索引）；8.0.14 后并行读加速。',
              ],
            },
          ],
        },
        {
          id: 'be-mysql-logs',
          title: 'redo log、undo log、binlog 各自的作用？两阶段提交解决了什么问题？',
          difficulty: 'advanced',
          tags: ['日志', '两阶段提交', 'WAL'],
          points: [
            '**redo log**（InnoDB 层）：物理日志（某页做了某改动），WAL 先写日志再异步刷脏页——保证**崩溃恢复**（持久性），循环写、空间固定；**undo log**：逻辑反向日志，用于回滚（原子性）与 MVCC 版本链；**binlog**（Server 层）：逻辑日志（语句/行格式），**追加写**，用于主从复制与归档恢复（配合全量备份做 PITR）。',
            '**两阶段提交（2PC）**：redo 写入并标记 prepare → 写 binlog → redo 标记 commit。解决"**redo 与 binlog 两个日志的一致性**"：崩溃恢复时 redo 处于 prepare，就看 binlog——binlog 完整则提交（从库已有这笔），不完整则回滚。没有 2PC，主库和从库会出现数据分叉。',
            '组提交（group commit）：binlog 与 redo 都支持多个事务合并刷盘，把 fsync 次数摊薄——高并发写入的关键优化（`binlog_group_commit_sync_delay` 可微调）。',
            'binlog 三种格式：statement（语句，可能主从不一致，如 now()）、**row（默认，行变更，量大但精确，配合 binlog_row_image）**、mixed（自动切换）。',
          ],
          followUps: [
            {
              question: '为什么有了 redo log 还要 binlog？为什么不用一种日志解决所有问题？',
              points: [
                '职责不同：redo 是 **InnoDB 私有的物理日志**，服务崩溃恢复，与主从/归档无关；binlog 是 **Server 层的逻辑日志**，所有引擎共享，服务复制与订阅（canal 同步 ES/缓存）。',
                '层次解耦：物理日志没法跨引擎/跨版本重放，逻辑日志没法高效恢复页损坏——两个工具各管一段，2PC 把它们粘成原子。',
              ],
            },
          ],
        },
        {
          id: 'be-mysql-replication',
          title: '主从复制的原理是什么？主从延迟怎么产生、怎么应对？',
          difficulty: 'intermediate',
          tags: ['主从复制', '高可用'],
          points: [
            '流程：主库写 **binlog** → 从库 IO 线程拉取写入本地 **relay log** → 从库 SQL 线程重放。MySQL 5.7+ 从库用**多线程重放（按库/写集并行，LOGICAL_CLOCK）**缓解单线程回放瓶颈。',
            '复制模式：**异步**（默认，主库不等从库，最快但可能丢数据）、**半同步**（至少一个从库收到 binlog 才返回客户端，折中）、**组复制 MGR**（Paxos 类多数派，强一致）。**GTID** 让事务全局唯一标识， failover 与搭建更可靠。',
            '延迟根因：从库单点回放慢（大事务、无主键的 row 更新）、从库机器差/承担读流量资源被挤、网络抖动、**大 DDL**（现在用 gh-ost/pt-osc 在线改表）。',
            '应对：监控 Seconds_Behind_Master（有坑，用 pt-heartbeat 更准）→ **关键读走主库**（写后立读，或业务上强制读主）；延迟敏感读用半同步/MGR；大事务拆小；读写分离中间件（ProxySQL/ShardingSphere）做延迟路由。',
          ],
          followUps: [
            {
              question: '为什么"写后立即读"在读写分离下会出问题？除了读主库还有什么办法？',
              points: [
                '写主库成功后立刻读从库，复制延迟窗口内读到旧值——用户改完昵称刷新看到旧昵称的典型体验事故。',
                '方案谱系：① 写后会话内 sticky 读主（网关按会话路由）；② 按业务键一致性哈希到"该键的主库读"；③ 客户端带时间戳，从库数据时间 < 时间戳则等待/转主库；④ 关键路径干脆读写都走主库，从库只服务报表类查询。',
              ],
            },
          ],
        },
        {
          id: 'be-mysql-sharding',
          title: '什么时候需要分库分表？分片键怎么选？分页、跨片查询、扩容怎么办？',
          difficulty: 'advanced',
          tags: ['分库分表', 'Sharding', '架构'],
          points: [
            '触发线（经验值，不是教条）：单表数据量过千万/磁盘 IO 与 B+ 树层高开始影响 P99、单实例写入瓶颈（QPS/连接数/主从延迟失控）。**先做能不分的优化**：索引优化、读写分离、归档冷数据、换列存/搜索引擎补位——分库分表是引入十年复杂度的决策。',
            '**分片键选择 = 让最高频的查询路由到单分片**：C 端业务几乎都用 user_id（用户维度数据聚合）；订单同时要商家维度查 → 冗余双写两套分片或异构索引表。哈希取模分布均匀但扩容难；**一致性哈希/基因法/范围分片**按场景选。',
            '连锁问题：**跨片分页**（各片取 N+offset 归并，深分页放大，改游标）、**跨片 join**（冗余字段/异构宽表/应用层聚合）、**分布式事务**（避强一致：本地消息表/SAGA）、**全局唯一 ID**（雪花/号段）。',
            '扩容路径：翻倍扩容（2→4 库，按位迁移一半数据）双写迁移方案：**双写新旧库 + 全量迁移 + 增量同步 + 数据校验 + 灰度切读 + 收尾**；成熟中间件：ShardingSphere、Vitess、TiDB 直接换分布式数据库的路线对比。',
          ],
          followUps: [
            {
              question: '为什么"用 TiDB 等分布式数据库"和"MySQL 分库分表"是两条路线？怎么选？',
              points: [
                '分库分表：复用 MySQL 成熟生态，性能可预期，但**应用层承担路由、跨片、扩容、分布式 ID 全部复杂度**；适合 SQL 模式稳定、超高频简单查询的海量 C 端场景。',
                'TiDB/CockroachDB 类：存算分离 + Raft 复制 + 分布式事务对应用透明、水平扩容免迁移；代价是资源占用高、特定负载（高并发点查、重事务）与 MySQL 有差距。选型看团队运维能力、SQL 复杂度与规模增速。',
              ],
            },
          ],
        },
        {
          id: 'be-mysql-query-execution',
          title: '一条 SQL 在数据库里是怎么执行的？join 的几种算法代价差多少？',
          difficulty: 'intermediate',
          tags: ['真题改编', '查询处理', '连接算法', 'EXPLAIN', '代价估计'],
          points: [
            '**查询处理四步（数据库课件框架）**：**解析**（SQL → 语法树）→ **优化**（关系代数等价改写 + 基于代价选计划：谓词/投影尽早下推、连接顺序、索引选择）→ **执行**（火山模型逐行拉取 / 批量向量化）→ 返回。EXPLAIN 展示的就是优化器的选择：**type**（访问方式：const > ref > range > index > ALL 全表扫描）、**rows**（预估扫描行数）、**key**（实际选用的索引）、**Extra**（Using index 覆盖索引 / Using filesort 排序 / Using temporary 临时表）。',
            '**连接算法三代**：**Nested Loop（朴素/块）**——双层循环；**索引嵌套循环（INL）**——外表逐行用内表索引探测（MySQL 最常用：驱动表小、内表连接列有索引时最优）；**Block Nested Loop（BNL）→ MySQL 8.0.18 起被 Hash Join 取代**——无索引连接把外表分块装进内存逐块配对，省掉内表的反复全扫。**选择率与基数估计是优化器的账本**（真题公式）：等值连接结果行数 ≈ n1·n2/max(V(列1),V(列2))，再乘过滤条件选择性（日期区间 3/12 就是 ×0.25）。',
            '**真题算例（南大卷）**：外表选择后剩 2 行，内表按 cno 的 B+ 树索引探测、每行约 8 个连续块——索引嵌套循环代价 ≈ 2×(2 次索引块读 + 8 次数据块读) + 少量 seek，**流水线执行免物化中间结果**。对比朴素 NLJ 需内表全扫（百万行），这就是"连接列必须有索引"的代价学根据。',
            '**驱动表选择原则**：小结果集驱动大结果集（外循环次数 = 驱动表行数）；STRAIGHT_JOIN 可人工指定顺序对抗优化器误判；三表连接（真题 r1⋈r2⋈r3）：**在连接属性上建索引、从最有选择性的一侧开始**用索引嵌套循环逐层探测——避免先物化大中间结果。',
          ],
          followUps: [
            {
              question: '为什么 MySQL 8.0 才有 Hash Join？它和索引嵌套循环各自适合什么场景？',
              points: [
                '**Hash Join**：对外表建哈希表、内表逐行探测——**一次构建、O(N+M)**，不要求任何索引；但哈希表要装内存（放不下就分区/落盘），且只支持等值连接。**索引 NLJ**：外表每行一次 B+ 树探测（log 级），外表很大时 O(N·logM) 仍优——**内表连接列有索引且外表过滤后行数不大**时它更好。',
                '8.0 前 MySQL 靠"没有索引就 BNL 全扫"硬扛，是" join 必须小表驱动 + 索引齐全"这类经验教条的根源；Hash Join 补齐后，"join 慢"更多要看统计信息是否过期（ANALYZE TABLE）与列类型是否一致（隐式转换废索引）。',
              ],
            },
            {
              question: '优化器怎么估算"一个条件过滤后剩多少行"？统计信息不准会出什么事？（真题：直方图估算）',
              points: [
                '**默认均匀分布假设（真题公式）**：对 `A <= v` 这类选择，只有 min/max 时估 `nr × (v−min)/(max−min)`；等值连接结果 ≈ n1·n2/max(V(A1),V(A2))。数据倾斜时这套估算离谱地错。',
                '**直方图（真题 16.20）**：把列值域切成等宽/等高频**桶**并记录每桶频度——范围选择 = v 所在桶及之前桶的频度求和占比 × nr；等值 = 所在桶频度。MySQL 8.0 支持 `ANALYZE TABLE t UPDATE HISTOGRAM ON col`（最多 1000 桶），专为"数据倾斜 + 无索引列"的基数估计兜底。',
                '**误差会沿计划树复合放大**：多表 join 的行数估算逐层相乘，上游估错 10 倍下游就错百倍——执行计划翻转、本该走索引的走了全表。排查武器：`EXPLAIN ANALYZE`（真实行数 vs 预估行数对比）、`optimizer_trace` 看代价算账过程、定时 `ANALYZE TABLE` 刷新统计——"统计信息过期"是线上 SQL 突然变慢的第一大外因。',
              ],
            },
          ],
        },
        {
          id: 'be-mysql-serializability',
          title: '怎么判断一个并发调度是"正确"的？前趋图、2PL 与隔离级别的关系是什么？',
          difficulty: 'advanced',
          tags: ['真题改编', '可串行化', '2PL', '意向锁', '并发控制'],
          points: [
            '**正确性的定义：等价于某个串行执行**（调度可串行化）。**冲突可串行化判别（清华原题套路）**：冲突 = 不同事务、同一数据项、至少一个写——交换两个**非冲突**操作不改变结果；按冲突画**前趋图**（Ti→Tj 表示 Ti 的操作先于 Tj 的冲突操作），**无环 ⇔ 冲突可串行化**（拓扑序即等价的串行顺序）。原题调度 r1(A) w2(A) … w3(B) w4(B) w3(C) w5(C)：T3↔T4 成环 → 不可串行化；**去掉 w3(B)（或 w4(B)）打破环**即恢复。',            '**2PL（两阶段锁）与它的保证**：事务分**增长阶段**（只加锁）与**收缩阶段**（只放锁，放了不能再拿）——**2PL 产生的调度必为冲突可串行化**（前趋图无环可证）。但 2PL **不防死锁**（原题：两个事务都先共享读对方的数据再升级排他写，交错升级互相等待）；死锁靠预防（一次锁全部/按序加锁/超时）或检测（等待图找环，InnoDB 的做法）。',            '**strict 2PL 为什么是工业默认（浙大作业原题三理由）**：① **避免级联回滚**——提交前不放写锁，别人读不到未提交数据（可恢复性/无级联调度的实现基础：真题"T1 写 B 未提交、T2 已读 B、T1 abort ⇒ T2 必须级联回滚，不是 cascadeless"）；② **实现简单**（统一提交时放锁）；③ 并发度损失可接受。InnoDB 的 2PL 就是 strict 变体（commit 时统一释放）。补充进阶：increment 锁模式（自增类操作互相兼容）说明**锁模式的设计空间就是并发度的调节器**。',            '**意向锁与多粒度（浙大复习考点）**：表级锁与行级锁共存需要**意向锁（IS/IX/SIX）**：给行加 S/X 前，先对**全部祖先**（表）加对应意向锁——这样"要锁全表"的事务只需看一眼表级意向锁就知道有没有行锁存在，**不必逐行检查**。规则：加锁自根向叶、释放自叶向根；**相容矩阵**：IS 与 {IS, IX, S, SIX} 全相容，IX 之间也相容（意向锁彼此不冲突——这正是"只表意向"的设计目的），S 只与 IS/S 相容（与 IX 冲突），X 与一切冲突。InnoDB 的表级意向锁就是这套协议的实现（官方口径：意向锁除全表锁请求外不阻塞任何操作）。',            '**隔离级别的实现视角收束**：RR/RC 下的 MVCC 管"读"，2PL 意义上的锁管"写与当前读"——可串行化（SERIALIZABLE）= 所有读升级为当前读 + 严格 2PL，理论上的可串行化才真正达成；MVCC 的 RR 严格说只是**快照隔离（SI）式的近似**（写偏斜问题——两事务各自读各自写不同行、组合起来不一致，因此不满足严格可串行化）。能把"隔离级别 ← 并发控制理论"这条线讲通，就超出了背八股的层次。',
          ],
          followUps: [
            {
              question: '冲突可串行化和视图可串行化是什么关系？为什么数据库只用前者？',
              points: [
                '视图等价三条件（同读初值、同读来源、同末写者）定义的**视图可串行化更宽松**——差异只出现在 blind write（不读就写）场景；**冲突可串行化 ⊂ 视图可串行化**（充分不必要）。',
                '实用取舍：判定视图可串行化是 **NP-complete**，判定冲突可串行化只要前趋图找环（多项式）——**用"够用的正确性 + 便宜的判定"换"完美的正确性 + 爆炸的判定"**，这是系统设计里反复出现的取舍模式。',
              ],
            },
            {
              question: '可恢复、cascadeless、strict 三级调度阶梯是什么？为什么工业实现都收敛到 strict？（浙大作业原题）',
              points: [
                '**可恢复（recoverable）**：读了 Ti 写的数据的 Tj，必须**等 Ti 提交后才能提交**——否则 Ti abort 而 Tj 已提交，读到的脏值无法撤销（真题 17.7 的定义核心）。这是"正确"的底线。',
                '**cascadeless**：更进一步——**只读已提交的值**（Tj 想读 Ti 写过的项就阻塞到 Ti 提交）。代价是并发度下降（读被写阻塞）；收益是一个 abort **不会引发级联回滚**（真题讨论点：故障很少时，允许 non-cascadeless 换并发在理论上可辩护——但工程上没人愿意赌）。',
                '**strict**：最严也最简单——**提交/中止前不释放任何写锁**。它天然 cascadeless、无需额外判断"谁读过谁的值"，实现只是一条"提交时统一放锁"的规则——**正确性阶梯与实现成本的交点**，这就是 strict 2PL 成为工业默认的深层原因（与正文三条理由互为表里）。InnoDB 的锁行为就是 strict 2PL + MVCC：写锁 strict 持有，读靠快照绕开阻塞——兼得 cascadeless 与读并发。',
              ],
            },
          ],
        },
        {
          id: 'be-mysql-crash-recovery',
          title: '数据库宕机重启后怎么恢复到一致状态？ARIES 的三个阶段各做什么？',
          difficulty: 'advanced',
          tags: ['真题改编', '崩溃恢复', 'ARIES', 'WAL', 'checkpoint'],
          points: [
            '**WAL（先写日志）是一切的前提**：日志记录先于数据页落盘（redo log 的 commit 语义，与正文两阶段提交题衔接）——**"改了页但日志没到盘"不可能发生**，恢复才有据可依。经典 WAL 规则 + **steal/no-force** 策略（允许脏页提前写盘、允许提交时不强制刷数据页）才带来缓冲管理的自由——代价是崩溃后必须有一套系统化恢复算法，这就是 **ARIES**。',            '**三阶段（南大真题推演题）**：① **Analysis 分析**——从最近的 checkpoint 开始扫日志，确定崩溃时的**脏页表 DPT** 与**未提交事务表 undo-list**；② **Redo 重做**——**从 DPT 中最小的 RecLSN 开始正向重放**（把所有页恢复到崩溃时刻的状态，包括未提交事务的修改——"重复历史"，重复应用是幂等的）；③ **Undo 回滚**——对 undo-list 里的事务**逆序**回滚，每回滚一条写一条 **CLR（补偿日志记录）**，保证恢复本身再崩溃也能继续。',            '**两个关键计数器（原题考点）**：**LSN**（日志序列号，单调递增）；**RecLSN**（页加入 DPT 时日志的当前末尾——该页上"此 LSN 之前的修改都已在盘"）——**Redo 遇到 LSN ≤ 页的 PageLSN/RecLSN 的记录直接跳过**（等号那条就是最后一条已应用的修改），这就是"减少不必要 redo"的机制（真题问答）。**checkpoint 的目的**：截断恢复需扫描的日志；频率权衡（真题）——越频繁，正常运行刷盘开销越大、崩溃恢复越快；**对介质故障恢复时间没有影响**（介质恢复靠备份 + 归档日志，不走这条路径）。',            '**undo 为什么反向、redo 为什么正向（浙大作业原题）**：同一数据可能被多次更新（1→2→3）——**undo 逆序**每步恢复"前像"，最终回到最早旧值（正向会停在中间值）；**redo 顺序**重放"后像"，最后一次写入即最终状态。配合 CLR 的"已回滚到哪"标记，恢复算法对"恢复途中再崩溃"幂等——**"正向重放历史、逆向撤销未竟"是 WAL 家族（InnoDB/SQL Server/DB2）的通用骨架**。',
          ],
          followUps: [
            {
              question: 'group commit 是什么？它解决高并发提交的什么问题？',
              points: [
                '瓶颈：每个事务提交都 fsync 一次 redo log，磁盘（尤其 SATA SSD）每秒 fsync 次数有限——高 TPS 下 fsync 排队成为瓶颈。',
                'group commit：**多个并发事务的日志凑成一批一次 fsync**——一次磁盘操作服务 N 个提交，吞吐近线性提升；binlog 与 redo log 的两阶段提交也要靠内部两阶段提交协调（binlog group commit）。代价是单个事务的提交延迟略增——**用延迟换吞吐**，与数据库批量写入、消息队列攒批是同一设计哲学。',
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'be-redis',
      name: 'Redis 缓存',
      description: '数据结构、持久化、缓存异常三板斧与分布式锁——缓存体系的完整闭环。',
      references: [
        { label: 'Redis 官方文档：Persistence', url: 'https://redis.io/docs/latest/operate/oss_and_stack/management/persistence/' },
        { label: 'Redis 官方文档：Topics（集群、复制等）', url: 'https://redis.io/docs/latest/operate/oss_and_stack/management/' },
      ],
      questions: [
        {
          id: 'be-redis-datatypes',
          title: 'Redis 常用数据结构的底层编码是什么？分别适合什么场景？',
          difficulty: 'basic',
          tags: ['Redis', '数据结构'],
          points: [
            '**String（SDS 简单动态字符串）**：len + alloc + buf，O(1) 取长度、二进制安全、预分配减少重分配；缓存、计数器（INCR 原子）、分布式锁。**List**：quicklist（双向链表串起的 ziplist/listpack 节点）；消息队列简易版、时间线。',
            '**Hash**：listpack（小）→ hashtable（渐进式 rehash：新旧两表同时存在，每次操作迁移一桶，避免一次性 rehash 阻塞——这是"渐进式"考点）。对象属性存储比 String 序列化省解包。**Set**：intset（纯整数小集合）→ hashtable；去重、共同好友（SINTER）。**ZSet**：listpack（小）→ **跳表 + dict**（跳表管排序范围查询 O(log n)，哈希表管 O(1) 按 member 查 score）；排行榜、延迟队列。',
            '高频新结构：**Bitmap**（签到、活跃标记，位级省内存）、**HyperLogLog**（UV 基数估算，12KB 固定误差 0.81%）、**GEO**（附近的人，底层 ZSet+geohash）、**Stream**（带消费组的消息队列，支持 ack/持久化）。',
            '设计心法：**value 别无脑 String 化 JSON**——频繁改单个字段用 Hash（免整包读写），排序计数用 ZSet；数据结构的差异往往决定内存数量级。',
          ],
          followUps: [
            {
              question: '为什么 ZSet 用跳表而不用红黑树或 B+ 树？',
              points: [
                '跳表 vs 红黑树：实现简单、范围查询（ZRANGE）链表直达、按 rank 查询通过 span 字段同样 O(log n)；并发修改（此处单线程）与旋转维护都更省事——作者 antirez 的公开答复核心是"实现与调试成本"。',
                'vs B+ 树：内存数据结构无需按页优化 IO，B+ 树为磁盘设计的矮胖结构在内存里没有优势，反而指针开销大。',
              ],
            },
            {
              question: '跳表节点的 span 字段是干嘛的？层数为什么用随机数而不是严格每层减半？',
              points: [
                '**span 记录该层 forward 指针跨过了 level0 上的几个节点**：查询路径上各层 span 累加 = 目标节点在有序集合中的排名——这就是 **ZRANK/ZREVRANK 能 O(logN)** 的实现依据（纯链表做不到 rank）；比较永远"score 优先、member 决胜"，同 score 元素也全局有序。（来源：极客时间·Redis源码剖析与实战 05）',
                '**随机层数**：zslRandomLevel 从 1 起，每升一层概率 **ZSKIPLIST_P=0.25**（期望层高约 1.33），上限 64 层。若强制相邻层 2:1，插入/删除要**连锁调整后续所有节点的层数数组**；随机层数下插入只改前后相邻节点的指针，统计上仍保持对数查找。取 0.25 而非 0.5 是**选省内存**（高层节点更少）——Redis 是内存数据库。',
                '双索引协作细节：zset{dict, zsl} 里 **dict 的 value 直接指向跳表节点的 &score**——score 更新时改跳表即可、dict 无需动（同一份数据）；代价是内存双份、一致性靠调用方顺序更新（单线程天然安全）。',
              ],
            },
            {
              question: 'Redis 省内存的通用手法有哪些？启动时预建的那批共享对象是干嘛的？',
              points: [
                '**共享对象池**：启动时预建 **0~9999 共 10000 个整数对象**、"+OK/-ERR" 等常用回复、DEL/UNLINK 等命令对象——千个客户端 SET 3 只存一份 robj；共享对象 refcount 用特殊标记**不可释放**，只在只读场景共享，客户端拿到写命令就新造对象。（来源：极客时间·Redis源码剖析与实战 04）',
                '**内存账三板斧**（被问任何结构都能落到这三条）：① **连续内存 + 变长元数据**（embstr/ziplist/listpack/intset）；② **位域、packed、联合体**（redisObject 头 4B、raxNode 头 4B、dictEntry 的值是联合体可内嵌整数）；③ **共享与复用**（shared 对象池、lru 字段一鱼两吃、rax 前缀共享）。（来源：极客时间·Redis源码剖析与实战 02~07）',
                '新类型 = 既有结构 + 编码方案：**GEO** 把经纬度分别做多次**二分区间编码**，组合成二进制串作为 **ZSet 的 score** 存成员——"附近的人"没有专用结构，就是 ZSet + geohash 编码。（来源：极客时间·Redis 核心技术与实战 13）',
              ],
            },
          ],
        },
        {
          id: 'be-redis-persistence',
          title: 'RDB 和 AOF 的原理与取舍？4.0 的混合持久化解决了什么？',
          difficulty: 'intermediate',
          tags: ['Redis', '持久化'],
          points: [
            '**RDB**：fork 子进程，利用**写时复制（COW）** 快照式落盘（SAVE/BGSAVE，或配置自动触发）。优点：紧凑二进制、恢复快、对主线程影响小；缺点：**两次快照之间的数据会丢**、fork 瞬间内存翻倍风险（大实例 + 写入高峰）。',
            '**AOF**：写命令追加到缓冲 → 按 **always/everysec/no** 策略 fsync；文件大后 **AOF 重写（bgrewriteaof）**：fork 子进程按当前数据生成最小命令集。优点：丢数据最多 1 秒（everysec）；缺点：文件大、恢复慢、fsync 抖动影响主线程（主线程负责写缓冲，fsync 在 bio 线程，但缓冲区积压会反压）。',
            'AOF 重写的坑（Redis 3.x~6.x 机制）：重写期间的新写入进 **aof_rewrite_buf**，结束后追加——大实例期间内存/磁盘双写峰值（**7.0 起 Multi-Part AOF 已移除该缓冲**：增量写入直接进 incr AOF 文件，不再有追加卡顿）；fork 后父进程持续写入会放大 COW 内存占用（监控 mem_fragmentation 与 fork 耗时 latest_fork_usec）。',
            '**混合持久化（aof-use-rdb-preamble）**：重写后的 AOF 文件 = RDB 全量头 + 增量 AOF——**恢复速度接近 RDB、丢数据接近 AOF**，是 4.0+ 生产默认推荐。',
          ],
          followUps: [
            {
              question: 'Redis 挂了重启，如何把丢失影响降到最低？缓存和持久化数据的策略应该分开吗？',
              points: [
                '分层策略：**纯缓存数据**（可回源）——不做持久化或仅 RDB，挂了靠预热与穿透防护扛回源风暴；**准状态数据**（会话、限流计数）——AOF everysec + 主从；**不能丢的**——根本不该只存 Redis，落库后 Redis 只是加速层。',
                '恢复风暴预案：实例重启后大量 key miss → 回源流量打爆 DB，用**分批预热、限流回源、空值缓存**组合，配合哨兵/集群让故障粒度尽量小。',
              ],
            },
            {
              question: 'AOF 为什么是写后日志？重写的完整流程和触发条件是怎样的？',
              points: [
                '**写后日志，与 MySQL 的 WAL 相反**：先执行命令、成功后才记录——① 避免记录错误命令阻塞恢复；② 不阻塞当前写操作。代价：命令执行后宕机才丢日志（最多最后一秒）。（来源：极客时间·Redis 核心技术与实战 04）',
                '**重写 = "一个拷贝、两处日志"**：主线程 fork 子进程按当前数据生成**最小命令集**（多变一：6 次 LPUSH 归并成 1 条）；重写期间新写入**同时**进旧 AOF 缓冲 aof_buf 和新重写缓冲（**10MB 一块的块链表** aof_rewrite_buf），重写完成后追加进新文件再原子替换。（来源：极客时间·Redis 核心技术与实战 04 / Redis源码剖析与实战 19/20）',
                '**触发与保护**：自动触发 = AOF 开启 && 增长比例 ≥ **auto-aof-rewrite-percentage（默认 100%）** && 大小 > **auto-aof-rewrite-min-size（默认 64MB）**；**有 RDB 子进程在跑就不并行重写**（两个子进程全量扫数据耗 CPU、互相抢磁盘 IO）；fork 后父进程立刻**禁止 rehash**——防止搬键放大 COW。7.0 Multi-Part AOF 移除的正是 aof_rewrite_buf 这份内存。',
              ],
            },
            {
              question: 'RDB 有哪些触发点？fork 的代价和 COW 放大怎么观测？重启先加载哪个文件？',
              points: [
                '**RDB 触发点全景**：SAVE（主线程执行，阻塞）/ BGSAVE / 主从全量同步（落盘或无盘直接传 RDB 流）/ FLUSHALL、正常 shutdown 也落盘 / serverCron 按 save 配置（m 秒 n 次修改）条件触发 + 失败调度重试。**已有 bgsave 在跑就不会再起第二个**。（来源：极客时间·Redis源码剖析与实战 18）',
                '**fork 的代价与观测**：fork 本身**阻塞主线程**且耗时与内存大小成正比（INFO 的 latest_fork_usec）；子进程结束用 zmalloc_get_private_dirty 统计**实际 COW 脏页量**回传父进程打日志——COW 是可观测的，大实例要控制 fork 频率与写入速率。（来源：极客时间·Redis源码剖析与实战 19）',
                '**恢复顺序：先 AOF 后 RDB**（AOF 更完整）；顺带一提 everysec 不是绝对只丢 1 秒——磁盘被 AOF 重写抢占时 fsync 变慢，**主线程发现上一次 fsync 未完成时会阻塞等待**（no-appendfsync-on-rewrite 用宕机多丢数据换性能）。',
              ],
            },
          ],
        },
        {
          id: 'be-redis-eviction',
          title: 'Redis 的过期删除和内存淘汰策略是怎样的？',
          difficulty: 'intermediate',
          tags: ['Redis', '内存管理'],
          points: [
            '过期删除（key 设置了 TTL）：**惰性删除**（访问时检查过期才删）+ **定期删除**（每 100ms 随机抽样带 TTL 的 key，过期即删，超时上限 25ms，不够就再抽）——在 CPU 与内存间折中。**已过期但未被删除的 key 仍占内存**，这是大 key 治理和内存监控要注意的盲区。',
            '内存满（达到 maxmemory）触发**淘汰策略**：noeviction（默认，写报错）、allkeys-lru / volatile-lru（有 TTL 的里面挑）、**allkeys-lfu（4.0+，访问频率优先，适合热点稳定场景）**、random 系列、volatile-ttl（优先 TTL 小的）。',
            'Redis 的 LRU 是**近似 LRU**：随机采样 N 个（maxmemory-samples，默认 5）淘汰其中最久未用的——省维护双向链表的内存；LFU 用 **Morris 计数器（对数衰减）+ 衰减周期**近似频率，解决"历史热点霸占内存"。',
            '工程提醒：**必须设置 maxmemory + 淘汰策略**（裸奔写满内存会 OOM 被系统杀）；缓存场景 allkeys-lru/lfu，有混合业务（一部分 key 绝不能丢）要么拆实例，要么给关键 key 绕开缓存语义。',
          ],
          followUps: [
            {
              question: '大 key 和热 key 分别有什么危害，怎么治理？',
              points: [
                '**大 key**（单 key 几 MB/集合百万级成员）：删除阻塞（用 UNLINK 异步删、lazyfree）、迁移/过期卡顿、网络带宽打爆、倾斜。治理：拆分（Hash 分桶）、压缩、冷热分离、定期扫描（redis-cli --bigkeys / RDB 离线分析）。',
                '**热 key**（单 key QPS 极高）：单节点 CPU/网卡瓶颈。治理：**本地缓存一层**（进程内 LRU + 短 TTL）、key 打散复制（key#1..N 随机读）、读写分离扩展副本。',
                '共同根因都是**单 key = 单点**：识别（监控 hotkey 命令、代理统计）比救火重要。',
              ],
            },
            {
              question: '近似 LRU 和 LFU 在源码里具体是怎么实现的？',
              points: [
                '**近似 LRU 的"钟"**：全局 server.lruclock（24bit、**1 秒精度**，serverCron 每 100ms 刷新），key 访问时更新自身的 lru 字段——为什么不每次调 mstime？**省 gettimeofday 系统调用**（每秒几万 QPS 下微秒级开销不划算）。（来源：极客时间·Redis源码剖析与实战 15）',
                '**采样 5 个不是直接淘汰**：采样结果进 **EvictionPoolLRU 候选池（16 个槽）**，按 idle 升序维护、跨轮次复用——历史采样也参与竞争，更逼近真实 LRU；淘汰时**主从复制缓冲区不计入 used**。',
                '**LFU 的 8bit 计数器**：概率对数增长——counter 越大越难 +1、255 封顶（对数刻度，lfu-log-factor 调节难度）；新 key 初始值 **LFU_INIT_VAL=5**（设 0/1 会让新 key 秒被淘汰）；高 16bit 存分钟时间戳，按 lfu-decay-time 衰减，长期不访问的 key 频率自己降。（来源：极客时间·Redis源码剖析与实战 16）',
              ],
            },
            {
              question: '大量 key 同一时刻过期为什么会卡住实例？淘汰一个 key 时从库和 AOF 怎么知道？',
              points: [
                '**定期删除的循环条件**：每 100ms 一轮、每轮采样 20 个 key，**过期比例 >25% 就再来一轮**——所以"大量 key 同一秒过期"会持续循环删除形成阻塞；元凶常是 EXPIREAT 用了相同时间戳，**过期时间加 1~3 分钟随机抖动**可解。（来源：极客时间·Redis 核心技术与实战 18）',
                '**淘汰的传播与记账**：选定 key 后按配置发 DEL 或 UNLINK（共享命令对象），**先写 AOF 再同步从库**——副本端删除路径一致；异步释放不能立刻到账，所以**每淘汰 16 个 key 复查一次内存状态**，达标提前结束淘汰循环。（来源：极客时间·Redis源码剖析与实战 17）',
                '**缓存污染**：一次大扫描把海量"只访问一次"的数据灌进缓存，LRU 按最近访问时间评估会被污染数据占满、热点被挤出；**LFU 按访问频率 + 衰减**才能把污染数据淘汰出去（allkeys-lfu/volatile-lfu）。',
              ],
            },
          ],
        },
        {
          id: 'be-redis-cache-3problems',
          title: '缓存穿透、击穿、雪崩的成因与解决方案分别是什么？',
          difficulty: 'basic',
          tags: ['缓存', '高可用'],
          points: [
            '**穿透**：查**不存在**的数据，缓存永远不命中，请求全打到 DB（恶意攻击/爬虫）。方案：**缓存空值**（短 TTL，防常规轰炸）、**布隆过滤器**（前置判断"一定不存在"，O(1) 内存，需评估误判率与重建）、接口层参数校验与风控限流。',
            '**击穿**：某个**热点 key 过期瞬间**，海量并发同时回源。方案：**互斥锁回源**（第一个请求 SETNX 抢锁查库写缓存，其他等待重试）、**逻辑过期**（物理不过期，value 里带过期时间，异步线程刷新，请求永不阻塞但可能短暂数据旧）、热点 key **预热 + 延长 TTL + 不过期**。',
            '**雪崩**：**大量 key 同时过期**或 Redis 实例集体宕机，DB 被冲垮。方案：TTL 加随机抖动打散、多级缓存（本地缓存挡一层）、集群高可用（哨兵/集群 + 双机房）、**限流熔断兜底**（数据库侧保护）、事前容量规划与压测。',
            '三者共同本质：**缓存的命中率瞬间塌了，DB 必须有自保手段**——所以限流、熔断、隔离不是可选项，是缓存体系的兜底结构件。',
          ],
          followUps: [
            {
              question: '布隆过滤器不能删除元素的问题怎么解决？',
              points: [
                '标准布隆过滤器位数组只能置 1 不能回滚（多个 key 共享位）——删除会误伤其他 key。',
                '变体：**计数布隆过滤器**（每位用计数器，支持删除但空间大数倍）、**布谷鸟过滤器**（支持删除、空间效率更好、误判率相当，是现代首选）；或者干脆用短 TTL 的"空值缓存"替代布隆（数据集不大时更简单可控）。',
              ],
            },
            {
              question: '布隆过滤器的"可能误判存在"具体是怎么回事？互斥锁和逻辑过期两种重建方案怎么选？',
              points: [
                '**布隆的实现**：初值全 0 的 bit 数组 + N 个哈希函数；插入 = N 个位置全置 1，查询 = N 个位置**有一个 0 就一定不存在**、全 1 则"可能存在"（可能误判）——课程例子：10 bit + 3 哈希，标记 X 置 1/3/7 位；误判率随位数组填充率上升，要按容量评估并支持重建。（来源：极客时间·Redis 核心技术与实战 26）',
                '**互斥锁重建**：miss 后 SETNX 抢锁 → 拿锁者查库回填 → 未拿到者 sleep 重试——强一致但请求在等；**逻辑过期**：value 内嵌过期时间、物理永不过期，发现逻辑过期后异步重建、请求先返回旧值——不阻塞但短暂数据旧。两者是**一致性 vs 可用性**的取舍，按业务容忍度选。',
              ],
            },
          ],
        },
        {
          id: 'be-redis-lock',
          title: '如何用 Redis 实现分布式锁？Redlock 的争议在哪里？',
          difficulty: 'advanced',
          tags: ['分布式锁', 'Redis'],
          points: [
            '单实例正确姿势：`SET lock_key unique_value NX EX 30`（**原子**地"不存在才设置 + 带过期 + 带唯一值"）；释放用 **Lua 脚本**先比对 unique_value 再 DEL（防止误删别人的锁——A 超时后 B 拿到锁，A 直接 DEL 会删掉 B 的锁）。',
            '三个经典问题：① **业务没执行完锁过期** → 续期（看门狗：后台线程定期 PEXPIRE 续命，Redisson watchdog）；② **锁过期后两个客户端同时持锁** → 业务侧还要幂等兜底，锁只是效率优化不是正确性保证；③ **主从切换丢锁**：主库写入锁未同步就宕机，从库升主 → 两个客户端各持一把锁。',
            '**Redlock**（多实例红锁）：向 N 个独立节点依次加锁，**多数派成功且总耗时 < 锁有效期**才算成功。争议：Martin Kleppmann 指出其依赖**时钟单调性假设**、GC 停顿/进程暂停期间锁已过期但客户端不知情，认为分布式锁的**正确性必须靠 fencing token（递增令牌 + 下游校验）**保证；antirez 反驳认为时钟假设可控。**工程结论**：Redis 锁适合"防重复执行的效率锁"；**强正确性场景用 ZooKeeper/etcd（会话过期自动释放 + 版本号 fencing）或直接数据库唯一约束**。',
            '选型速记：秒级容错 + 高性能 → Redis；强一致关键路径 → etcd/ZK；终极兜底 → 数据库约束（幂等永远要有）。',
          ],
          followUps: [
            {
              question: '什么是 fencing token？为什么说没有它，任何分布式锁都不完整？',
              points: [
                'fencing token = 锁附带**单调递增的令牌**，下游资源（存储/服务）拒绝小于已见过的最大令牌的请求——即使旧持有者因 GC 停顿"复活"，它的旧令牌也会被拒绝。',
                '本质：**把"互斥"的裁决权从锁服务移到真正受影响的资源**——锁服务无法感知客户端的暂停（GC、时钟漂移），只有资源的版本比较才能做到。ZK 的 zxid、etcd 的 mod_rev 都是天然的 fencing 来源，Redis 需自己构造（如 INCR 一个序号）。',
              ],
            },
            {
              question: 'fencing 思想的工业鼻祖长什么样？——Chubby 的 sequencer 和 lock-delay 各解决什么？',
              points: [
                '**Sequencer**：锁持有者拿到"锁名 + 模式 + 锁世代号"的凭证，**由下游 worker 主动向锁服务校验**有效性——裁决权在被保护的资源侧，而不是锁侧（与 fencing token 同方向）。（来源：Grokking Advanced System Design · Chubby）',
                '**Lock-delay 是给"无法改造的下游"的兜底**：锁异常释放（会话过期）后，锁服务冻结该锁 1 分钟（有上限）不发给新持有者——用时间窗消化旧持有者的在途请求；**正常释放立即可抢，异常释放才延迟**。与 Redis 锁对比：Redis 靠过期时间+看门狗续期，没有"冻结窗口"语义——这正是 Redlock 争论里缺 fencing 的语境补充。',
              ],
            },
            {
              question: 'Redlock 的执行细节是怎样的？锁的超时时间怎么定？',
              points: [
                '**Redlock 细节**：N 个**完全独立**（非主从）实例依次 SET NX PX + 唯一值；单实例加锁设**短超时**快速失败换下一个；**多数派成功且总耗时 < 锁有效期**才算拿到；释放要向**所有实例**发 Lua 释放（不只成功的那些）；失败后**随机延迟**再重试，避免多个客户端同时重试形成合谋。（来源：极客时间·Redis 核心技术与实战 30）',
                '**超时时间怎么定**：按业务执行时间评估（P99 预留余量）——太短会误释放别人的锁（引出看门狗续期），太长则持有者崩溃后其他客户端阻塞等待；与"业务没执行完锁过期"的经典问题闭环。',
              ],
            },
            {
              question: 'SET NX EX 的原子性是命令特殊，还是执行模型保证的？',
              points: [
                '**执行模型保证**：setCommand 的 NX 分支 = 先查 key 已存在即返回空、否则 setKey + setExpire——多条子逻辑在同一命令内、主线程串行执行表驱动派发；**原子性与命令实现无关，是单线程事件循环给的**（6.0 的 IO 线程也只解析不执行）。（来源：极客时间·Redis源码剖析与实战 14）',
                '同理：释放锁的 EVAL 整体原子 = call 执行期间不插入其他客户端命令——理解到这一层就明白，为什么"多命令拼原子"必须上 Lua 而不能靠客户端时序。',
              ],
            },
          ],
        },
        {
          id: 'be-redis-cluster',
          title: 'Redis 的主从、哨兵和集群分别解决什么问题？集群的原理是什么？',
          difficulty: 'intermediate',
          tags: ['Redis', '高可用', '集群'],
          points: [
            '**主从复制**：数据冗余 + 读写分离；**首次全量同步**（主库 bgsave RDB 传给从库 + 期间写命令缓冲）+ 之后**增量传播**（复制积压缓冲区 repl_backlog，断线重连可部分重同步，缓冲区太小会退化为全量——大实例要调大）。',
            '**哨兵（Sentinel）**：独立的监控进程集群（至少 3 个奇数），负责**故障检测（主观下线→多数派客观下线）→ Raft 式选领导哨兵 → 从库中挑新主 → 通知客户端**。解决的是"自动 failover"，不解决容量。',            '**Cluster 集群**：数据分片——**16384 个 slot 按 CRC16(key) mod 16384 分配到节点**，节点间 Gossip 协议交换状态；客户端可 MOVED/ASK 重定向或 smart client 直连。**多 key 命令要求同 slot**（hash tag `{user1000}.order` 强制同槽）。故障转移内置（节点互相 ping，多数派 master 判定失联后从其 slave 选主），**不再需要哨兵**。',
            '取舍：数据量单机放得下但要求高可用 → 主从+哨兵；**容量/写吞吐要水平扩展 → Cluster**；代价是多 key 操作受限、运维复杂、事务/Lua 限同槽。',
          ],
          followUps: [
            {
              question: '为什么 slot 是 16384 而不是更大的数？',
              points: [
                '作者回答：心跳包里携带 slot 位图，16384 = 2KB 恰好平衡信息量与带宽；集群设计上限 1000 节点，16384 足够分配；CRC16 取模本身对更大 slot 无收益。',
                '考点延伸：Gossip 是**最终一致**的集群状态传播，牺牲实时性换去中心化——理解这点就能理解集群脑裂窗口与 CLUSTER RESET 等运维行为。',
              ],
            },
            {
              question: 'gossip 消息里到底传什么？故障判定为什么不用固定超时？',
              points: [
                'gossip 携带的是**节点可达性 + 负责的 key range（slot 归属）**——不是简单心跳，而是"谁活着、谁管哪些数据"的状态合集；最终一致地收敛到全网。（来源：Grokking Advanced System Design · Gossip/Cassandra）',
                'Cassandra 在 gossip 之上叠加 **Phi Accrual 故障检测**：不输出"死/活"二元结论，而输出**怀疑度**（连续偏离正常到达间隔的程度）——阈值可按业务调；与 sd-paper-phi-accrual 题（原理）互链，构成"传播靠 gossip、判定靠 phi"的完整去中心化故障感知链路。',
              ],
            },
            {
              question: '哨兵怎么挑新主库？Leader 哨兵又是怎么选出来的？',
              points: [
                '**筛选 + 打分**：先过滤掉下线/断线的从库（**主观下线的从库直接跳过**，不能升主），再三轮打分取最高——① **从库优先级**（replica-priority，0 永不参选）→ ② **复制 offset 最大**（数据最全）→ ③ **runid 最小**（兜底随机）。（来源：极客时间·Redis 核心技术与实战 07）',
                '**Leader 选举**：哨兵发 is-master-down-by-addr 征集 Y/N，**达到 quorum** 判客观下线；随后每个哨兵先给自己一票、**先到先得**，拿到**半数以上且 ≥quorum** 者当 Leader 执行切换；一轮无 Leader 则等故障转移超时的 2 倍再选。哨兵集群靠订阅主库 **__sentinel__:hello** 频道互相发现，切换后客户端订阅 **+switch-master** 拿新地址。',
                '**防选票瓜分的工程细节**：每个哨兵把自身调度频率随机化（hz = 10 + rand()%10）错开发起投票的时机，降低一轮无人过半的概率——Raft 随机超时思想的工程化；投票按纪元（epoch）比较，**一个纪元只投一票**。（来源：极客时间·Redis源码剖析与实战 23/24）',
              ],
            },
            {
              question: '从库侧的复制是怎么驱动的？replication buffer 和 repl_backlog 到底什么区别？',
              points: [
                '**从库状态机**：repl_state 从 NONE→CONNECT→CONNECTING（replicationCron 每 1s 驱动连接）→握手（AUTH/PORT/IP/CAPA）→SEND_PSYNC→收 +FULLRESYNC 转 TRANSFER（接收 RDB）/ +CONTINUE 走增量。主库不需要状态机——复制由从库发起，主库只被动响应，为 N 个从库各维护一份纯增复杂度。（来源：极客时间·Redis源码剖析与实战 21）',
                '**两类缓冲区**（高频混淆）：**replication buffer**——全量复制期间主库为**每个从库单独**建的客户端输出缓冲区；**repl_backlog**——**所有从库共享**的环形 buffer，长期接收写命令、供断线增量补齐，offset 被覆盖就退化全量。（来源：极客时间·Redis 核心技术与实战 10）',
                '全量同步压力大的缓解：主库 fork 生成 RDB + 传 RDB 双重压力，用"**主-从-从**"级联复制（选高配从库当二级主）分散 fork 与带宽。',
              ],
            },
            {
              question: 'Cluster 的规模为什么有上限？数据倾斜怎么查怎么治？和 Codis 这类代理方案怎么选？',
              points: [
                '**心跳开销限制规模**：Gossip 的 PING/PONG 单条约 **12KB**（1/10 实例状态 + 2KB slot 位图）；每秒随机 5 选 1 发 PING，对 PONG 超时的实例**立即补发**——规模越大超时越频繁，心跳风暴挤占业务带宽；官方上限 1000 实例、实践建议 400~500，调大 cluster-node-timeout（15s→20~25s）缓解。（来源：极客时间·Redis 核心技术与实战 38）',
                '**数据倾斜**：三大成因——bigkey、**Slot 手工分配不均**（CLUSTER SLOTS 查看 + SETSLOT/GETKEYSINSLOT/MIGRATE 迁移）、Hash Tag 把业务 key 粘到同 slot；访问倾斜用**热点多副本**（key 加随机前缀打散到不同 slot），读写热点不能多副本（一致性开销）只能升级实例配置。',
                '**Codis vs Cluster**：Codis = proxy（RESP 兼容，客户端无感）+ **ZooKeeper 存路由表**（1024 slot）+ 二次开发的 Redis；对比 Cluster：路由集中存储 vs Gossip 自传播、客户端免改造 vs smart client、**迁移异步（bigkey 拆成逐元素指令 + 目标端临时过期时间保原子）vs 同步迁移（MIGRATE 逐 key 同步收发等回复，阻塞源实例）**、基于 3.2.8 不支持新命令。要新特性、少组件选 Cluster；存量客户端多、迁移频繁选代理型。（来源：极客时间·Redis 核心技术与实战 35 / Redis源码剖析与实战 27）',
              ],
            },
          ],
        },
        {
          id: 'be-redis-consistency',
          title: '缓存与数据库的双写一致性怎么保证？先删缓存还是先更新库？',
          difficulty: 'advanced',
          tags: ['缓存一致性', '架构'],
          points: [
            '结论先行：**Cache Aside（旁路缓存）是默认答案**——读：先读缓存，miss 读库回填；写：**先更新数据库，再删除缓存（不是更新缓存）**。删除而非更新：避免并发写导致旧值覆盖新值，也避免写多读少时白算缓存。',
            '为什么不能"先删缓存再更新库"：删后、库未更新前，读请求 miss 回源**把旧值写回缓存**，脏数据长期留存——高并发下必现。',
            '先更新库再删缓存的**残余窗口**：读请求 miss → 回源读到旧值 → 此时写请求完成更新并删缓存 → 读请求才把旧值写回。发生条件苛刻（读先于写、回源慢于写），概率低；**加固手段**：延迟双删（写后延迟几百 ms 再删一次）、**binlog 订阅（canal）异步删缓存**（把删除变成可靠重试的下游动作）、设置 TTL 兜底（脏数据有生存上限）。',
            '设计心法：缓存一致性只能做到**最终一致 + 有限窗口**，做不到强一致（除非锁串行化，得不偿失）；真正关键的数据不该依赖缓存做正确性来源。',
          ],
          followUps: [
            {
              question: '为什么大厂普遍用"订阅 binlog 删缓存"而不是业务代码里删？',
              points: [
                '业务代码删缓存有三个脆弱点：删除失败没有重试（丢一致性）、侵入所有写路径（容易漏）、事务提交前删了等于白删（异步化困难）。',
                'canal 订阅 binlog：**删除动作与数据变更天然绑定、失败可重试（投递 MQ）、业务代码零侵入**；代价是多一套组件与秒级延迟。TTL 兜底 + 监控不一致率是标准配套。',
              ],
            },
            {
              question: '删除缓存失败了怎么办？什么时候该用同步直写？',
              points: [
                '**删除失败兜底**：把目标 key 投入**消息队列重试**，删除成功才出队，超次数上报业务；对比 canal 订阅 binlog——**重试是业务内兜底，binlog 是旁路兜底，两者可组合**。（来源：极客时间·Redis 核心技术与实战 25）',
                '**读写缓存（写穿）的另一半**：要求强一致时用**同步直写**（缓存与库一起更新，需业务事务保证原子性）；异步写回（淘汰时才落库）只适合容忍丢失的非关键数据——前文"只读缓存 + 删缓存"之外的第二种模式。',
              ],
            },
            {
              question: '应用进程里的本地缓存，怎么做到数据一变就近乎实时失效？',
              points: [
                '**Redis 6.0 客户端缓存（Tracking）**：数据缓存在应用进程本地省网络 RTT，难点"变更后如何通知失效"由服务端协助解决——**普通模式**：服务端记录客户端读过的 key，key 被修改时发 **invalidate 消息**，**同一个 key 只报一次失效**（客户端再次读取才重新跟踪，省服务端记录表内存）。（来源：极客时间·Redis 核心技术与实战 39）',
                '**广播模式**：客户端注册 key **前缀**（CLIENT TRACKING ON BCAST PREFIX user），该前缀 key 一有修改就广播给所有注册客户端——**不需要客户端读过该 key**、不占服务端记录表，代价是修改频繁时广播耗带宽；与业务 key 命名前缀规范天然契合。协议依赖 **RESP3**，RESP2 客户端走重定向模式转发到失效频道。',
                '与业务自己写"本地缓存 + 短 TTL"相比：Tracking **主动失效近乎实时**，不用等 TTL 窗口内的脏读；它解决的是**应用层多级缓存一致性**，与 Redis-DB 间一致性（canal/延迟双删）是两层问题。',
              ],
            },
          ],
        },
        {
          id: 'be-redis-lua-pipeline',
          title: 'Redis 的事务、Lua 脚本和 Pipeline 分别解决什么问题？',
          difficulty: 'intermediate',
          tags: ['Redis', '事务', 'Lua'],
          points: [
            '**Pipeline**：纯客户端优化——**攒一批命令一次发送、一次读回**，省 N 次 RTT；服务端只是排队顺序执行，**不保证原子性**。批量读写、批量删除首选（注意分批，避免单次命令过大阻塞）。',
            '**MULTI/EXEC 事务**：命令入队、EXEC 一次性顺序执行（执行期间不插入其他客户端命令）；**不支持回滚**——某条命令运行时错误（如对 String 执行 LPUSH），前面已执行、后面继续执行；入队错误（语法）则整批拒绝。所以 Redis 事务是"打包执行"而非"原子失败回滚"。',
            '**Lua 脚本（EVAL）**：**脚本整体原子执行**（单线程模型天然保证），且能用中间结果写逻辑（比较后删除、限流器、分布式锁释放）——"check-then-act" 的唯一正解；注意脚本要短（执行期间阻塞其他命令）、用 SCRIPT LOAD + EVALSHA 复用、Cluster 下保证 key 同槽。',
            '选型：纯批量 → Pipeline；多命令原子 + 条件逻辑 → Lua；跨 key 大逻辑复杂 → 说明该上应用层锁或换存储了。',
          ],
          followUps: [
            {
              question: '为什么 Redis 单线程还能这么快？6.0 的多线程用在哪？',
              points: [
                '快的原因：**纯内存操作 + 单线程无锁无切换 + IO 多路复用（epoll）+ 高效数据结构**；瓶颈通常在网络 IO 而非 CPU。',
                '6.0 多线程只用于**网络读写与协议解析**（io-threads），命令执行仍是单线程——在不引入并发控制复杂度的前提下突破网络瓶颈，和 Redis 6 前用 Pipeline 榨 RTT 是同一目标的两个层次。',
              ],
            },
            {
              question: 'Redis 的事务到底满足 ACID 几条？Lua 原子扣库存怎么写？',
              points: [
                '**逐项对照**：**A 不满足**（运行时错误不回滚）；**C 不保证**（错误可能留下不一致中间态）；**I 满足**（单线程串行，EXEC 执行期间不插入其他命令；WATCH 提供 check-and-set 乐观锁）；**D 看配置**（RDB 丢快照间数据、AOF everysec 最多丢 1s）——"打包执行 ≠ 原子失败回滚"的逐项展开。（来源：极客时间·Redis 核心技术与实战 31）',
                '**Lua 原子扣库存**：Hash 存 {total, ordered}，脚本 HMGET 读两值 → 判断 ordered+k ≤ total → HINCRBY ordered——"查验+扣减"原子化防超售；库存 key **不设 TTL**（防击穿，等价热点 key 永不过期）；多商品秒杀用切片集群按商品分 slot，抢不到锁的请求根本不碰库存实例。（来源：极客时间·Redis 核心技术与实战 36）',
                '**脚本要短**：单线程执行脚本期间全程阻塞——**不需要并发控制的逻辑（纯计算、纯判断）别塞进脚本**，只放必须原子的读-判-写。',
              ],
            },
            {
              question: '一条命令在服务端内部经过哪几站？',
              points: [
                '链路：readQueryFromClient（一次最多 **16KB** 读入 querybuf）→ 解析 RESP（首字节 * 判 multibulk，否则 inline 命令）→ processCommand 查命令表（MULTI 内的命令入队回 +QUEUED）→ call 执行 → addReply 写客户端输出缓冲，多数小回复在 beforeSleep 一轮内直接写回。（来源：极客时间·Redis源码剖析与实战 14）',
                '这条链路解释两件事：为什么 **IO 多线程不破坏原子性**（解析与执行分离，执行统一在主线程）；为什么大 value / 大 Pipeline 会拖慢全体——每一步都在单线程里排队。',
              ],
            },
          ],
        },
        {
          id: 'be-redis-hotspot',
          title: '如何基于 Redis 实现一个高并发的限流器？',
          difficulty: 'advanced',
          tags: ['限流', 'Lua'],
          points: [
            '固定窗口计数器：`INCR key` + 首次 `EXPIRE`，超过阈值拒绝——简单但**临界突刺**（窗口交界处两倍流量）。改进用 Lua 把判断+自增+过期原子化（两步写法的坑：不带 NX 的 EXPIRE 会被每个请求反复重置 TTL，持续流量下窗口永不过期；EXPIRE NX 修了重置问题，但 INCR 与 EXPIRE 两条命令之间进程崩溃仍会留下无过期时间的 key——Lua 原子化才是正解）。',
            '**滑动窗口**：ZSet 记录每次请求时间戳，`ZREMRANGEBYSCORE` 清理窗口外、`ZCARD` 计数判断——精确但 O(n) 内存（按请求记条目，适合小 key 维度如"每用户"）。',
            '**令牌桶**：Lua 里按 `(now - last_refill) × rate` 计算应补充的令牌，惰性补充 + 扣减，**允许突发、平滑均值**，内存 O(1)——生产推荐；漏桶对应"恒定速率出口"（削峰整形），语义别混。',
            '分布式要点：**Lua 保证"读-判-写"原子**；key 按"限流维度"设计（接口+用户/IP）；Redis 挂了要 fail-open 还是 fail-closed 提前决策；超大规模用**本地预分配配额（二级限流）**减少 Redis 压力。',
          ],
          followUps: [
            {
              question: '如果限流维度是"全站每秒 10 万次"，单 Redis 会成为瓶颈吗？怎么办？',
              points: [
                '会：每次请求一次 Lua 执行，单实例约 10 万 QPS 上限，限流器自己成了单点热点。',
                '分层方案：网关层本地令牌桶 + **中心化批量补给**（每台机器每次向 Redis 领取一段配额，如 1000 个，本地消耗完再领）——Redis QPS 降两个数量级；精度损失换吞吐，配额段大小按流量动态调。',
              ],
            },
            {
              question: 'INCR 和 EXPIRE 分开写，竞态的具体时序长什么样？',
              points: [
                '时序推演：线程 1 INCR 后、还没来得及 EXPIRE，线程 2 也 INCR 并抢先判断"次数 >1 不设过期" → 该 key **永远没有 TTL**，计数只增不清 → 极端后果是用户被**永久封禁**——这是与"TTL 被反复重置"不同的第三种失败模式：TTL 根本没设置上。（来源：极客时间·Redis 核心技术与实战 29）',
                '修法：Lua 把 INCR + 判断 + EXPIRE 原子化，或 EXPIRE NX 只在无 TTL 时设置——把竞态窗口讲成具体时序，比一句"用 Lua"更有说服力。',
              ],
            },
          ],
        },
        {
          id: 'be-redis-blocking-async',
          title: 'Redis 是单线程的，哪些操作会把它卡住？哪些卡点能异步化？',
          difficulty: 'intermediate',
          tags: ['Redis', '单线程', 'lazy free'],
          points: [
            '**五大阻塞点**：① **集合全量查询与聚合**（HGETALL/SMEMBERS/SINTER 等 O(N) 读操作）；② **bigkey 删除**——删除本质是释放内存并把内存块插回空闲链表，实测 100 万元素的 Hash 删除耗时可达 **1.98s**（正常响应是微秒级）；③ **清空数据库** FLUSHDB/FLUSHALL；④ **AOF 日志同步写**——一次同步写盘约 **1~2ms**，always 策略下大量写阻塞主线程；⑤ **从库加载 RDB 文件**（文件越大越慢）。（来源：极客时间·Redis 核心技术与实战 16）',
            '**能否异步的判断标准：操作在不在关键路径上**（客户端是否要等它返回数据结果）——读操作、从库加载 RDB 在关键路径上**不能异步**；删除、清库、AOF 落盘不返回数据，**可以异步**。',
            '**异步子线程机制（4.0+）**：主线程启动时创建 **3 个后台子线程**（AOF 日志写、键值对惰性删除、文件关闭），主线程把操作封装成任务放入**任务队列**即返回 OK，由子线程实际执行——这就是 lazy free；对外命令：**UNLINK**、**FLUSHDB/FLUSHALL ASYNC**。',
            '**UNLINK 的内部边界**：删除 = **从哈希表摘除**（必须主线程做，保证后续读不可见）+ **释放内存**（可异步）；主线程先评估释放开销（List/Set/Hash 按元素数），开销 **> LAZYFREE_THRESHOLD（64）** 且无共享引用才扔给后台线程——**UNLINK 对小 key 就是同步 DEL**。四个惰性删除开关（淘汰/过期/隐式删除/全量同步清库）默认全关，按写入负载开启。（来源：极客时间·Redis源码剖析与实战 17）',
            '**4.0 之前的退化方案**：HSCAN 每批取 ~200 条再 HDEL，把删除压力分摊到多次操作；集合全量查询同样用 SCAN 系列渐进遍历、客户端聚合。',
          ],
          followUps: [
            {
              question: '为什么摘除键必须在主线程，释放内存却可以异步？',
              points: [
                '**内存可见性**：摘除后客户端立刻查不到该 key，删除的语义才算完成；释放只是内存回收，晚一点无妨——与"操作在不在关键路径（是否返回数据给客户端）"是同一原理的两种表述。',
                '推论：任何"把工作挪到后台"的设计都先问一句——**客户端要不要等它的结果**；要等就不能异步，这是判断单线程系统可优化点的通用框架。',
              ],
            },
            {
              question: '用了 UNLINK 就零成本吗？内存会立刻降下来吗？',
              points: [
                '不是零成本：主线程仍要**摘引用、评估开销、封装任务**（后台线程取任务本身还有锁开销）——大量小 key 场景每个删除都走"评估→入队/释放"路径，**锁开销反而超过收益**（阈值 64 就是这个权衡的显式化）。',
                '内存**不会立刻下降**：异步释放有滞后，监控内存时要理解惰性释放；INFO 里 lazyfree_objects 可看后台待释放对象数。开了 lazyfree-lazy-expire 后过期 key 占的内存同样是逐步下降的。',
              ],
            },
            {
              question: '线上发现 bigkey 又必须删，你的完整操作预案是什么？',
              points: [
                '步骤：**低峰期操作** → 判断版本（4.0+ 直接 UNLINK / FLUSHALL ASYNC；4.0 前 HSCAN 每批 ~200 条分批删）→ 全量查询类聚合操作换 SCAN 渐进遍历 → 观察延迟与客户端缓冲区确认无残留阻塞。',
                '配套：删除 bigkey 前评估其元素数量（决定是否真异步）、主库数据量控制 **2~4GB**、从库加载 RDB 时长与文件大小成正比——大实例本就该拆分。',
              ],
            },
          ],
        },
        {
          id: 'be-redis-slow-diagnosis',
          title: '生产环境 Redis 突然变慢，你的系统性排查思路是什么？',
          difficulty: 'advanced',
          tags: ['Redis', '性能排查', '延迟'],
          points: [
            '**第一步：先判断"真的变慢了吗"**——测**基线性能**：`redis-cli --intrinsic-latency 120` 在**服务端本机**跑（剥离网络变量，测低压力下软硬件本身的最大延迟）；**运行时延迟 ≥ 基线 2 倍**才算变慢。反例：虚拟机里基线本身可达 ~9.9ms，10ms 的运行时延迟只比基线高 1.3%，不是变慢。（来源：极客时间·Redis 核心技术与实战 18/19）',
            '**Redis 自身两查**：① **慢查询命令**——SMEMBERS/HGETALL 换 SCAN 系列、SORT/SUNION/SINTER 挪到客户端做、KEYS 禁止上生产；② **过期 key 集中删除**——定期删除每 100ms 一轮，过期比例超 25% 就持续循环删除形成阻塞，元凶常是大量 key 用同一 EXPIREAT 时间戳，修法是**过期时间加 1~3 分钟随机抖动**。',
            '**文件系统（AOF）**：everysec 的 fsync 在后台子线程做，但**主线程发现上一次 fsync 未完成时会阻塞等待**；AOF 重写大量抢磁盘 IO 会连锁拖慢主线程。缓解：`no-appendfsync-on-rewrite yes`（重写期间不 fsync，宕机多丢数据换性能）；高可靠 + 高性能就换 SSD。',
            '**操作系统两查之 swap**：实例 5000 万次 GET 从 300s 涨到近 4 小时（延迟约 48 倍）的真实案例；排查 `cat /proc/<pid>/smaps | egrep "Swap|Size"`，出现百 MB~GB 级 Swap 必须处理（加内存 / 拆实例 / 驱赶同机大内存邻居）。',
            '**操作系统两查之内存大页 THP**：大页 2MB vs 常规 4KB——持久化期间写时复制时改 100B 也要拷 2MB，`/sys/kernel/mm/transparent_hugepage/enabled` 应设 **never**。',
            '**收尾检查**：绑核与 NUMA（见追问）、主库数据量控制在 **2~4GB**、是否与大数据/采集类程序混部署（"吵闹邻居"抢 CPU/IO）。',
          ],
          followUps: [
            {
              question: '为什么基线要在服务端本机测？',
              points: [
                '目的：只考察 **Redis 自身与所在软硬件**的延迟水位，把网络这个变量剥离——网络问题另用 iPerf 等工具单独测。',
                '基线是判据不是摆设：**运行时延迟 ≥ 2 倍基线才叫变慢**——没有基线，"感觉变慢"会把你带进错误的方向（先怀疑 Redis，其实是网络抖动）。',
              ],
            },
            {
              question: 'swap 发生了，为什么不能重启了事？',
              points: [
                '重启后热数据重新加载，症状暂时消失，但**根因是内存不足**——不解决必然复发。要区分两种成因：**实例自身内存太大**（加内存/拆分数据）vs **同机其他进程挤占**（驱赶大内存邻居/隔离部署）。',
                '验证闭环：处理后再看 smaps 的 Swap 归零、延迟回到基线——排查题的加分点在于"定位→处置→验证"闭环，而不是报出关键词。',
              ],
            },
            {
              question: '内存大页明明减少了分配次数，为什么反而要关？',
              points: [
                '**权衡的两端**：收益在分配侧（2MB 一次分配减少缺页），代价在 **COW 拷贝粒度**——持久化 fork 后父进程每改一页就拷 2MB，写放大让内存翻倍风险与延迟尖刺远超收益。',
                '方法论：任何"默认优化项"都要放到**具体工作负载**下检验——Redis 的持久化负载让 THP 从优化变成毒药；没有持久化的纯缓存实例受影响就小得多。',
              ],
            },
            {
              question: '绑核为什么能降尾延迟？NUMA 架构下绑错核会怎样？',
              points: [
                '**为什么要绑**：L1/L2 是物理核私有缓存（访问 <10ns），内存访问约百 ns——多核来回调度 = 运行时信息重载 + 缓存冷启动。实测：24 核服务器关持久化纯 String 操作，GET/PUT 的 **99% 尾延迟 504μs/1175μs**，`taskset -c 0` 绑核后降到 **260μs/482μs**——绑核主要压缩长尾，不是平均值。（来源：极客时间·Redis 核心技术与实战 17）',
                '**NUMA 绑错核更糟**：跨 Socket 是远端内存访问（延迟 **+18%**）——常见做法把网络中断程序绑核提速，若 Redis 实例与中断程序**不在同一 Socket**，读网络数据要跨 Socket 总线反而更慢；`lscpu` 的逻辑核编号按"先各物理核第一个逻辑核"交错排（node0 = 0-5,12-17），想当然绑 0-11 会绑错 Socket。',
                '**绑核的风险与方案**：RDB/AOF 重写子进程、惰性删除后台线程会和主线程抢同一个核——① 一个实例绑**一个物理核的两个逻辑核**（`taskset -c 0,12`，两者共享 L1/L2）；② 6.0 起支持配置化绑核。',
              ],
            },
          ],
        },
        {
          id: 'be-redis-string-memory',
          title: 'Redis 的 String 底层为什么不用 C 字符串？几个字节的数据为什么实际占几十字节？',
          difficulty: 'intermediate',
          tags: ['Redis', 'SDS', '内存管理', '碎片'],
          points: [
            '**char* 的三宗罪**：以 \\0 判结束 → 天然**非二进制安全**（数据含 \\0 被截断）；strlen 要遍历 **O(N)**；strcat 不检查空间、靠开发者保证，忘了就缓冲区溢出。**SDS** = buf + **len/alloc/flags** 元数据：取长 O(1)、sdsMakeRoomFor 统一扩容（调用方不可能忘）、保留末尾 \\0 只为兼容 C 函数。（来源：极客时间·Redis源码剖析与实战 02）',
            '**三种编码**：**int**（Long 整数直接内嵌在指针位，零分配）、**embstr**（字符串 ≤**44B** 时 RedisObject 与 SDS 一次分配在一块连续内存）、**raw**（>44B 时 SDS 独立分配，多一次分配还多碎片）。**44 的推导**：jemalloc 按 2 的幂分桶——64B 块 − robj 头 16B（type:4+encoding:4+lru:24 位域压成 4B + refcount 4B + ptr 8B）− sdshdr8 元数据 3B − 结尾 \\0 1B = 44，正好塞满一个 64B 分配块。',
            '**String 的内存账**（课程案例：10 位图片 ID → 10 位对象 ID，有效数据 16B）：SDS + RedisObject（8B 元数据 + 8B 指针）+ **dictEntry**（3 个 8B 指针 = 24B，jemalloc 向上对齐到 **32B**）——实际占 **64B**；**1 亿条记录 = 6.4GB，其中 4.8GB 是元数据**。（来源：极客时间·Redis 核心技术与实战 11）',
            '**省内存方案：集合类型二级编码**——用 ziplist/listpack 布局省掉大量 dictEntry 开销：图片 ID 前 7 位做 Hash key、后 3 位 + 对象 ID 做 field/value，每条降到 **16B（原来的 1/4）**；配套把 hash-max-ziplist-entries 设为 1000 保证不转哈希表（**一旦转哈希表就不可逆**）。',
            '**内存碎片的成因与度量**：内因是分配器（jemalloc）按固定大小分桶（8B/16B/32B…），外因是键值大小不一 + 反复删改；`INFO memory` 的 **mem_fragmentation_ratio = used_memory_rss / used_memory**——**1~1.5 合理、>1.5 要处理、<1 说明发生 swap**（物理内存反而小于申请量）。（来源：极客时间·Redis 核心技术与实战 20）',
            '**碎片治理**：① 重启（粗暴，有不可用窗口与恢复成本）；② **activedefrag 自动清理（4.0-RC3+）**——"搬家让位、合并空间"，但内存拷贝会拖慢单线程：active-defrag-ignore-bytes（默认 100MB）、threshold-lower（10%）控制启动时机，cycle-min/max（**25%/75%**）限制清理占用的 CPU 比例。',
          ],
          followUps: [
            {
              question: 'embstr 有什么限制？redisObject 和 SDS 自己是怎么省内存的？',
              points: [
                '**embstr 只读友好**：任何修改都要转 raw 重新分配——embstr 实际不可变，这是"读多写少的小 value 最划算"的边界。',
                '**redisObject 用位域**：type 4bit + encoding 4bit + lru 24bit 共用一个 32bit（比三个独立字段省 8B），24bit 的 lru 还被 LFU 复用；**SDS 按长度适配五种结构头**（uint8/16/32/64_t，短字符串用小头），结构体加 `__attribute__((packed))` 取消字节对齐——char+int 两成员从 8B 压到 5B。（来源：极客时间·Redis源码剖析与实战 04）',
              ],
            },
            {
              question: 'mem_fragmentation_ratio 小于 1 说明什么？',
              points: [
                '说明**操作系统分配的物理内存已小于 Redis 申请量**——大概率发生 swap，部分数据被换出到磁盘，读写要走慢速 IO——这是"内存指标反常"最危险的信号，处理优先级高于碎片。',
                '对照记忆：>1.5 才处理碎片（activedefrag 或低峰重启），1~1.5 正常；一套指标三种解读，面试时能分层说出来才叫理解。',
              ],
            },
            {
              question: '碎片清理的代价是什么？怎么把影响压到最低？',
              points: [
                'activedefrag 在**主线程内做数据拷贝**（搬家让位），清理期间正常请求被拖慢——把 cycle-max 调低（限 CPU 占比）、避开业务高峰、按 ignore-bytes/threshold-lower 让它只在碎片真超标时启动。',
                '不着急的场景选**低峰重启**：彻底但要有从备份/主从恢复的预案——两种方案的共同前提是先确认 ratio 真的超标。',
              ],
            },
          ],
        },
        {
          id: 'be-redis-stats-collections',
          title: '要统计一亿用户的签到、UV 和留存，分别该用 Redis 的哪种结构？',
          difficulty: 'basic',
          tags: ['Redis', 'Bitmap', 'HyperLogLog', '选型'],
          points: [
            '**选型心法**：先问"要不要精确、要不要去重、要不要排序"，再算内存账——四大统计模式对号入座。（来源：极客时间·Redis 核心技术与实战 12）',
            '**聚合统计（留存/新增）**：累计用户 Set + 每日用户 Set，**SINTERSTORE 求留存、SDIFFSTORE 求新增**；注意聚合命令 O(N) 有阻塞风险——**放从库专做或拉到客户端算**。',
            '**排序统计（最新评论/排行榜）**：**List 不能用**——LRANGE 按位置取，新元素 LPUSH 插入后原有元素整体后移，**翻页会读到重复元素**；用 **ZSet 按权重 ZRANGEBYSCORE**，分页稳定。',
            '**二值状态统计（签到）**：**Bitmap** 的 SETBIT/GETBIT/BITCOUNT——**1 亿用户 1 天 ≈ 12MB**；"连续 10 天签到"用 **BITOP AND** 对十个 Bitmap 求与。',
            '**基数统计（UV 去重）**：**HyperLogLog** 固定 **12KB** 估算接近 2^64 的基数，标准误算率 **0.81%**；要精确数字退回 Set/Hash——但千万级 UV 要接受 **GB 级内存**，页面多时不可行。',
          ],
          followUps: [
            {
              question: '1 亿用户一天的签到，用 Set 和 Bitmap 分别要多少内存？',
              points: [
                '**Set：GB 级**（每成员几十字节，还要 dictEntry 开销）；**Bitmap：约 12.5MB**（1 亿 bit ≈ 12MB）——**差两个数量级**，这就是"二值状态用 Bitmap"的内存依据。',
                '推广：凡是"元素只有 存在/不存在 语义 + 可映射为整数偏移"的场景（签到、活跃标记、布隆过滤器）都优先位图思路。',
              ],
            },
            {
              question: '为什么 List 做分页会串页，ZSet 不会？',
              points: [
                '**位置序 vs 权重序**：List 靠下标定位，新元素 LPUSH 插入头部后**所有元素位置后移**，按"第 11~20 个"翻页自然读到重复；ZSet 按 score 定序，位置与插入顺序无关。',
                '教训：选结构先想清楚**数据的"序"由什么决定**——时间不断前插的流式数据用位置序必然串页。',
              ],
            },
            {
              question: 'HyperLogLog 的结果能删元素、能精确吗？什么场景必须放弃它？',
              points: [
                '都不能：HLL 只记基数不记成员，**无法删除单个元素、无法给出成员明细、有 0.81% 标准误算率**。',
                '必须精确或要明细时退回 Set/Hash（接受内存代价），或布谷鸟过滤器等支持删除的近似结构——先和业务确认"差 1% 要不要紧"，多数 UV 场景要紧的不是数字而是趋势。',
              ],
            },
          ],
        },
        {
          id: 'be-redis-replication-pitfalls',
          title: '主从架构下为什么会读到旧数据和过期数据？脑裂是怎么把数据弄丢的？',
          difficulty: 'advanced',
          tags: ['Redis', '主从复制', '哨兵', '脑裂'],
          points: [
            '**主从不一致的根因是异步复制**：主库本地执行完就回客户端、不等从库。缓解：主从同机房/低延迟网络；用 `INFO replication` 的 **master_repl_offset − slave_repl_offset 差值做监控**，超阈值就把客户端从该从库摘除。（来源：极客时间·Redis 核心技术与实战 32）',
            '**读到过期数据**：从库**不执行过期删除**（删除只在主库做）——3.2 起对过期 key 返回空但**不删除**。更隐蔽的坑：**EXPIRE/PEXPIRE 是"相对当前时间"的 TTL**，从库在全量同步完成后才执行该命令，过期时间被推后（同步花 2 分钟，60s TTL 的 key 在从库多活一分多钟）——修法：**EXPIREAT/PEXPIREAT 指定绝对时间点 + 主从与同一 NTP 对时**。',
            '**脑裂的过程**：主库"假故障"（同机采集程序吃满 CPU、bigkey/swap 阻塞）→ 哨兵超时判**客观下线**并完成切换 → 假故障恢复后旧主继续收写 → 集群里两个主并存。**数据丢失机制**：哨兵让旧主 slaveof 新主做**全量同步**，旧主要**清空本地数据**再加载 RDB——假故障期间写入它的数据全部丢失。（来源：极客时间·Redis 核心技术与实战 33）',
            '**防御**：**min-replicas-to-write（N）+ min-replicas-max-lag（T）**——至少 N 个从库的复制 ACK 延迟 ≤ T 秒，否则主库拒绝写入；经验值 N = 从库数 K/2+1（K=1 时取 1）、T = 10~20s。代价：牺牲一小部分可用性换数据安全。',
            '**配置坑**：哨兵 protected-mode=yes 会导致跨机哨兵无法互联、**永远切不了主**；cluster-node-timeout 太小 + 批量主从切换 → 超半数实例心跳超时判异常、整个集群挂掉（建议调大到 10~20s）。',
          ],
          followUps: [
            {
              question: 'min-replicas-to-write 为什么不能设成"全部从库"？',
              points: [
                '任一从库网络抖动就触发"不足数拒绝写入"，**可用性塌方**——防御参数本身成了新的故障点。',
                '多数派（K/2+1）是**鲁棒性与安全的折中**：容忍个别从库失联，又保证写入至少落到了多数从库——这套思维与 Quorum 读写、etcd 的多数派提交同源（与分布式方向互链）。',
              ],
            },
            {
              question: 'down-after-milliseconds 调大能减少误判吗？代价是什么？',
              points: [
                '能减少把"短暂阻塞"误判成宕机，但**故障发现变慢、切换窗口拉长**——真故障期间旧主可能还在收写，丢数据窗口反而变大。',
                '**所有哨兵实例必须配置一致**：课程实战坑——配置不一致导致各哨兵判定口径不同，始终无法形成共识、切不了主。',
              ],
            },
            {
              question: '主从异步复制在 CAP 里对应哪个取向？',
              points: [
                '**牺牲强一致保可用与分区容错**：主库不等从库就应答，换取写延迟不随从库数量增长——网络分区时选择继续服务（可能不一致）而不是停服。',
                '工程意义：理解了这个取向就明白 min-replicas 参数族是在**同一个光谱上往 CP 方向拧**，而不是消除问题——与分布式系统的"一致性可用性 sliders"是一回事。',
              ],
            },
          ],
        },
        {
          id: 'be-redis-buffers',
          title: 'Redis 有哪些缓冲区？它们分别是怎么把实例或主从同步搞挂的？',
          difficulty: 'intermediate',
          tags: ['Redis', '缓冲区', '复制'],
          points: [
            '**客户端输入缓冲区**：暂存客户端发来的命令；上限**硬编码 1GB、无参数可调**。写 bigkey、主线程阻塞导致命令积压会溢出 → 服务端**直接断开连接**。排查用 `CLIENT LIST` 看 qbuf/qbuf-free。（来源：极客时间·Redis 核心技术与实战 21）',
            '**客户端输出缓冲区**：16KB 固定缓冲（回 OK/错误）+ 动态缓冲（回大数据）；三类配置 `client-output-buffer-limit <class> <hard> <soft> <seconds>`：normal 默认 0 0 0 不限（阻塞式发送天然安全）、**pubsub 必须设限**（订阅是推模式，消费慢就积压——课程示例 8mb 2mb 60）、slave/replica 用于复制。**MONITOR 命令持续输出会打爆输出缓冲区**，只能调试用。',
            '**复制缓冲区**：全量复制期间主库为**每个从库单独**维护（本质就是从节点客户端的输出缓冲区），保存 RDB 传输期间的新写命令。多个从库同时全量同步 = **同步风暴**，主库内存 ≈ 缓冲区 × 从库数；溢出则断连、全量复制重来。缓解：数据量 2~4GB、调大 client-output-buffer-limit slave、**控制从库数量/级联复制**。',
            '**复制积压缓冲区 repl_backlog**：主库上**所有从库共享**的**环形缓冲区**，断线重连时按 offset 增量补发；写满会**覆盖旧命令** → 从库复制进度被覆盖就退化为全量复制。repl-backlog-size 按**断线时长 × 写入速率**调大。',
            '**两类后果总结**：断连型（normal/pubsub/复制缓冲区溢出 → 连接被关）vs 数据覆盖型（repl_backlog 溢出 → 退化全量同步）——一个是"当场翻脸"，一个是"悄悄放大开销"。',
          ],
          followUps: [
            {
              question: '为什么输入缓冲区不给参数调？',
              points: [
                '调大只会让**单连接吃更多内存**，多连接叠加把实例压垮——上限是防御而不是容量规划对象。',
                '正确方向是治根因：**bigkey 写入、主线程阻塞导致的命令积压**——命令发得慢了自然积压，把慢的原因解决掉缓冲区就安全了。',
              ],
            },
            {
              question: '为什么 pub/sub 客户端必须有缓冲区限制，而 normal 可以是 0？',
              points: [
                '**拉模式有天然背压**：normal 是请求-响应，客户端不收下一条服务端就不再发——不会积压；**推模式没有背压**：订阅客户端消费多慢，消息都照推不误，必须靠上限兜底。',
                '推论：凡是"服务端主动推"的通道（pub/sub、MONITOR、慢消费者场景）都要问一句"消费不动谁兜底"——这是消息系统设计的通用问题。',
              ],
            },
            {
              question: '新上一批从库时，主库内存为什么暴涨？',
              points: [
                '**复制缓冲区按从库数量线性放大**：每个从库全量同步期间独占一份缓冲区，N 个从库同时接入就是 N 份——叠加 fork RDB 的 COW 内存，主库内存轻松翻倍。',
                '缓解：**错峰接入**从库、用"主-从-从"级联复制（高配从库当二级主）、必要时调大 client-output-buffer-limit slave 防中途断连重来。',
              ],
            },
          ],
        },
        {
          id: 'be-redis-stream-mq',
          title: 'Redis 能当消息队列用吗？从 List 到 Stream 补了哪些课、还欠哪些债？',
          difficulty: 'intermediate',
          tags: ['Redis', 'Stream', '消息队列'],
          points: [
            '**消息队列三大需求**：**保序**（库存先扣 5 再扣 2 不能反）、**重复消息处理**（全局唯一 ID + 消费端幂等）、**可靠性**（消费者宕机后消息不丢、可重取）。（来源：极客时间·Redis 核心技术与实战 15）',
            '**List 方案**：LPUSH + BRPOP 天然 FIFO 保序，BRPOP 阻塞读替代 while(1) 轮询省 CPU；可靠性靠 **BRPOPLPUSH**——读走的同时把消息塞进备份 List，宕机重启从备份重取。缺陷：**不为消息生成 ID**（业务自己造全局唯一 ID）、**没有消费组**（无法多消费者分担）、消息堆积全在内存。',
            '**Streams（5.0+）**：XADD 自动生成全局唯一 ID（**毫秒时间戳-序号**，如 1599203861727-0）；**XREADGROUP 按消费组读**，组内一条消息只被一个消费者处理（负载分担）；**PENDING List** 自动留存"已读取未确认"的消息，处理完 **XACK** 确认移除——宕机重启用 XPENDING 查到未确认消息继续处理。',
            '**Stream 的存储设计**：消息 ID 进 **rax（压缩前缀树）**——连续消息 ID 前缀高度相同，前缀只存一份，单 key 查询 **O(K) 与数据量无关**；消息体用 **listpack** 存，且同一 listpack 里用 **master entry** 把重复的 field 名只存一份——处处是内存账。（来源：极客时间·Redis源码剖析与实战 07）',
            '**与专业 MQ 的差距**：Redis 堆积吃**内存**（有上限），Kafka/RabbitMQ 落盘、可水平扩分区；Redis 也没有事务性投递保证。**消息量不大、想要轻量**（一个进程 vs Kafka 还要配套组件）时 Redis 够用；大体量、高可靠场景用专业 MQ。',
          ],
          followUps: [
            {
              question: 'Streams 的 XACK 机制和"取走即删"差在哪？',
              points: [
                '**读与确认分离**：消息被消费者读走后进入 PENDING 态而不是消失——处理失败/宕机时，其他消费者（或重启后的自己）能用 XCLAIM/XPENDING 重新接管，天然支持失败重取。',
                '代价是消费端要**显式 XACK**，忘了确认消息会一直挂在 PENDING List——可靠性换来了纪律，与 MQ 的手动 ack 是同一设计。',
              ],
            },
            {
              question: 'Stream 的消息索引为什么用 Radix Tree，不用哈希表或跳表？',
              points: [
                '**内存账优先**：哈希表把每个 ID 完整存一遍（前缀冗余），跳表每节点要存完整 sds key 且无前缀共享；rax 把相同前缀合并，节点头仅 4B——消息 ID 的毫秒时间戳前缀是**天然高相似**场景。',
                '**边界**：rax 的收益与 **key 前缀相似度**正相关——业务 key 毫无公共前缀时退化为近似 trie，指针开销反而大；且 rax 范围查询弱（每到叶子要回溯），Stream 以"按 ID 找消息"的点查为主，O(K) 点查正贴合。（来源：极客时间·Redis源码剖析与实战 07/答疑）',
              ],
            },
            {
              question: '如果消息量涨了 100 倍，你什么时候必须换 Kafka？',
              points: [
                '三个信号：**堆积量逼近内存上限**（Redis 堆积是内存操作，Kafka 是磁盘顺序写）、**消费端长期落后**（内存撑不起 lag）、**需要多订阅者各自独立进度**（消费组模型不够用）。',
                '决策口吻：Redis Stream 定位是"轻量、小规模、不想引入新组件"——量级一旦上来，换专业 MQ 是架构问题不是调参问题。',
              ],
            },
          ],
        },
        {
          id: 'be-redis-progressive-rehash',
          title: 'Redis 的渐进式 rehash 具体是怎么"渐进"的？什么触发、一次迁多少？',
          difficulty: 'intermediate',
          tags: ['Redis', '哈希表', '渐进式 rehash'],
          points: [
            '**双表结构**：dict 持有 **ht[2]** 和 rehashidx。平时全写 ht[0]；rehash 时逐桶搬去 ht[1]，搬完释放旧表、ht[0]=ht[1]、ht[1] 清空、rehashidx=-1 归位。**rehash 期间查找先查 ht[0] 再查 ht[1]，删除/更新两表都顾**。（来源：极客时间·Redis源码剖析与实战 03）',
            '**触发三条件**：ht[0].size==0（初始化扩到默认大小）；**负载因子 used/size ≥ 1 且允许 resize**（扩到 used×2、向上取 2 的幂）；负载因子 **> 5 时强制扩容**（绕过 can_resize 限制——链太长读性能塌方，不扩的代价更大）。',
            '**执行粒度**：dictRehash(d, n) 按桶粒度搬 n 个桶，桶内链表逐项重算 hash 头插；**empty_visits = n×10**：连续扫到 10n 个**空桶**就收手返回——避免稀疏表时一次操作占用主线程过久。',
            '"**渐进**"的入口：增删查改等每个操作前先调 _dictRehashStep（n=1）——**每次键值操作顺带迁一个桶**；有迭代器在跑时暂停分步迁移。哈希函数是 **siphash**，且启动时随机化哈希种子——防哈希碰撞 DoS。',
            '**与持久化的联动**：存在 RDB 子进程或 AOF 重写子进程时**禁止扩容**——fork 出的子进程靠写时复制共享内存，rehash 大量搬键会让父进程写页更多、**放大 COW 内存翻倍风险**。（来源：极客时间·Redis源码剖析与实战 03/答疑）',
          ],
          followUps: [
            {
              question: '一次性 rehash 的代价具体是什么？为什么要渐进？',
              points: [
                '搬 N 个键是 **O(N) 阻塞主线程**——百万级 key 一次搬完就是百毫秒级卡顿，期间所有请求排队；分摊后单次只迁一个桶，**微秒级**，用户无感。',
                '本质是**把大任务的支付方式从"一次性结清"改成"随操作分期付款"**——与 CMS/G1 把 STW 拆小、Kafka 把大文件切成段的思路同源。',
              ],
            },
            {
              question: '为什么持久化期间干脆禁止扩容？',
              points: [
                '**fork + 写时复制**：子进程复制页表后与父进程共享物理页，父进程改一页才拷一页——rehash 把 key 搬得越散，父进程在重写期间**要改的页越多，COW 内存放大越狠**。',
                '这是"两个机制互相看不见对方，但共享同一个物理资源（内存）"的典型系统问题——Redis 用 updateDictResizePolicy 一个开关就把联动处理了。',
              ],
            },
            {
              question: '负载因子 >5 就强制扩容，这个设计说明什么？',
              points: [
                '说明**"不扩的代价更大"**：负载因子 5 意味着平均每桶挂 5 个 key，链越查越长，读性能持续塌方——即便持久化期间写时复制敏感，也要两害相权取其轻。',
                '参数设计的通用逻辑：每个阈值都是**两种代价的交叉点**——1 是常规扩容点（便宜），5 是强制扩容点（再贵也要扩）。',
              ],
            },
          ],
        },
        {
          id: 'be-redis-ziplist-listpack',
          title: 'ziplist 的连锁更新是什么缺陷？Redis 是怎么一步步把它修掉的？',
          difficulty: 'intermediate',
          tags: ['Redis', 'ziplist', 'listpack', 'quicklist'],
          points: [
            '**ziplist 布局**：头 10B 固定（zlbytes 4B 总长 + zltail 4B 尾偏移 + zllen 2B 元素数）+ entries + 尾字节 0xFF；**entry = prevlen + encoding + data**。prevlen 变长编码：前一项 **<254B 用 1 字节，否则 5 字节**（首字节 254 作标记 + 4B 实际长度）。（来源：极客时间·Redis源码剖析与实战 06）',
            '**连锁更新的成因**：插入一个 ≥254B 的元素后，后一项的 prevlen 要从 1B 扩成 5B——它自身变大又可能让再后一项的 prevlen 超限……**最坏整条链每项都要重分配**，且每次插入还伴随整块 ziplist 的 realloc + 数据拷贝。',
            '**治标——quicklist（3.2）**：双向链表串起多个 ziplist 节点，插入前判断单节点 ziplist **≤8KB**（list-max-ziplist-size）否则新建节点——**把连锁更新和 realloc 的爆炸半径限制在单个节点内**；代价是每节点多一份链表指针开销。',
            '**治本——listpack（5.0）**：头 6B（总字节数 4B + 元素数 2B）；**entry = encoding + data + backlen**——彻底不存 prevlen，**改任何一项都不影响别项**，连锁更新从根上消失；反向遍历靠从右往左逐字节解 backlen（每字节最高位是延续位）得到前一项总长。',
            '**工程配套**：hash-max-ziplist-entries / zset-max-ziplist-* 限制条目数与单值大小防 ziplist 过大；**一旦超限转 hashtable/skiplist 就不可逆**——用集合类型省内存要主动按二级编码分桶。**7.0 后 Hash/ZSet 小编码统一用 listpack，List 用 quicklist（节点内换 listpack）**。',
          ],
          followUps: [
            {
              question: 'quicklist 和 listpack 各自的取舍是什么？',
              points: [
                '**quicklist**：保住"单节点内连续内存"又限制爆炸半径，但链表指针开销回来了——适合元素总量大、可分段存储的 **List**。',
                '**listpack**：内存最省且无连锁更新，但整块连续内存仍不适合存太多/太大元素——适合"元素少而小"的 **Hash/ZSet 小编码**。7.0 的最终格局就是按这个边界分工的。',
              ],
            },
            {
              question: 'listpack 不存前项长度，反向遍历怎么实现？',
              points: [
                '**backlen 是自描述长度**：只记录当前 entry 自身的总长（1~5B 变长，每字节最高位是延续位）——从尾部即可逐字节解出前一项的总长，实现反向遍历。',
                '对照记忆：ziplist 反向靠 **zltail + prevlen**（记别人的长度），listpack 反向靠 **backlen**（记自己的长度）——一字之差，连锁更新消失。',
              ],
            },
            {
              question: '为什么 ziplist→hashtable 的转换不可逆？',
              points: [
                '连续内存布局**只有在"元素少且小"时才省内存**——元素多了之后紧凑编码反而失去意义，没有"转回去"的收益触发点。',
                'Redis 不主动做缩小转换，避免**来回抖动**（转过去又转回来反复重分配）——配置阈值本质是**单行道开关**：这也是"二级编码分桶"要提前规划容量的原因。',
              ],
            },
          ],
        },
        {
          id: 'be-redis-io-threads',
          title: 'Redis 6.0 的多 IO 线程到底并行了什么？命令执行为什么还在主线程？',
          difficulty: 'advanced',
          tags: ['Redis', '多线程', '6.0 新特性'],
          points: [
            '**定位**：6.0 前 Redis 的瓶颈在**网络 IO 而非 CPU**——多线程只用于**网络读写与协议解析**，命令执行仍是单线程，不引入并发控制复杂度。开启：io-threads-do-reads yes（读线程**默认关**）+ io-threads N（建议小于核数，如 8 核配 6），上限 IO_THREADS_MAX_NUM=128；0 号线程就是主 IO 线程。（来源：极客时间·Redis源码剖析与实战 13）',
            '**推迟读与推迟写**：读事件满足条件（io_threads_active、io-threads-do-reads=yes、非阻塞处理中、非主从复制客户端）就把客户端打上标记放进待读队列，不在事件回调里当场读；写方向同理——把"攒一批"作为多线程的前提。',
            '**分发与同步**：beforeSleep 里按 **item_id % io_threads_num 轮询**分给各线程，主线程亲自处理自己那份，然后**忙等**所有线程的 pending 计数归零——**一轮内所有线程只做同一种操作**（全局 io_threads_op = READ 或 WRITE），天然无锁。',
            '**IO 线程不执行命令**：解析阶段只解析第一条命令就把客户端标记为待执行并退出；等全部线程读完，**主线程统一执行**——SET NX / Lua 的原子性因此不受多线程影响。',
            '**弹性与停车**：待写客户端数 **< 2×线程数** 时回退单线程处理（任务少时多线程调度反而亏）；IO 线程空闲时先自旋 ~100 万次查 pending，仍无任务就互斥锁挂起，主线程唤醒——**用互斥锁当启停开关，线程常驻不销毁**。',
          ],
          followUps: [
            {
              question: '为什么 io-threads-do-reads 默认关闭？',
              points: [
                '**写回是纯 send**，多线程收益稳；读路径涉及**协议解析**且多数场景读带宽未成瓶颈——开多了白耗核。',
                '方法论：**压测确认读是瓶颈再开**——官方默认值表达的是"最常见负载下的最优解"，不是能力边界。',
              ],
            },
            {
              question: '为什么一轮内所有 IO 线程只做读、或只做写，而不是各干各的？',
              points: [
                'io_threads_op 是**全局标志**，读写分组批次执行——免掉多线程同时操作同一个 client 的**锁竞争**；批次之间由主线程忙等 pending==0 做屏障。',
                '这是"**用批处理换锁**"的并发设计：与其让 N 个线程自由竞争加锁，不如让它们每轮只做互不相干的一种操作——简单、无锁、可证明正确。',
              ],
            },
            {
              question: '如果把命令执行也放进 IO 线程会怎样？',
              points: [
                '多线程并发执行要操作共享数据结构（全局哈希表、过期字典、阻塞列表），**必须加锁**：性能被锁竞争吃掉 + 开发调试复杂度飙升——收益远小于代价。',
                'Redis 的选择是"**IO 并行、执行串行**"：执行瓶颈不靠线程解决，靠**切片集群水平扩展**——把并发问题转化为架构问题。（来源：极客时间·Redis源码剖析与实战 14/答疑）',
              ],
            },
          ],
        },
        {
          id: 'be-redis-event-loop',
          title: '从客户端连上来到收到回复，Redis 事件循环的一帧里都发生了什么？',
          difficulty: 'intermediate',
          tags: ['Redis', '事件循环', 'epoll', 'Reactor'],
          points: [
            '**骨架**：main 里注册 beforeSleep/afterSleep 钩子后进入 aeMain：`while(!stop){ beforesleep(); aeProcessEvents(); }`——每轮循环 = 一帧。aeProcessEvents 以**最近的待触发时间事件的到期时刻作为 aeApiPoll 的超时**——既不空转也不睡过头。（来源：极客时间·Redis源码剖析与实战 08~11）',
            '**IO 多路复用封装**：aeApiPoll 即 epoll_wait，ae_epoll/ae_kqueue/ae_evport/ae_select 四个实现按平台**条件编译**选择；Redis 没封装 poll——poll 相比 select 只是去掉 1024 限制、仍要 O(n) 扫描，在 Linux 有 epoll、其他平台有 select 的夹缝中没有独特价值。',
            '**连接与读**：监听 fd 注册 AE_READABLE → acceptTcpHandler → createClient 时**再注册 AE_READABLE → readQueryFromClient**（客户端发"写"请求，服务端视角都是"可读"）；一次最多读 **16KB** 进 querybuf。',
            '**写回的时序**：beforeSleep 里对命令处理完的客户端**直接 writeToClient 尽力写**；没写完才注册 AE_WRITABLE 事件继续写——**多数小回复一轮内直接写完，省一轮 epoll_wait**。AE_BARRIER 屏障事件可反转"先读后写"的默认顺序，让写盘先于回复（AOF always 场景）。',
            '**时间事件与容量**：serverCron 注册为时间事件，**hz=10（可配 1~500）每 100ms 跑一次**，内部按 run_with_period 分频：更新 lruclock、过期删除 + 渐进 rehash、RDB 触发、replicationCron（1s）、clusterCron（100ms）。事件数组大小 = maxclients + 128 决定连接上限——"max number of clients reached" 先查 maxclients。',
          ],
          followUps: [
            {
              question: 'Reactor 的三个角色在 Redis 里分别对应什么？',
              points: [
                '**reactor** = aeMain/aeProcessEvents 的事件分发；**acceptor** = acceptTcpHandler；**handler** = readQueryFromClient/sendReplyToClient——Redis 是**单 Reactor 单线程**型；Netty 是主从 Reactor 多线程型（对照服务端通用基础里的 Reactor 网络模型题）。',
                '面试价值：被问"你的项目用什么网络模型"时，能用这套角色语言把 Redis、Netty、Nginx 各自定位讲清，说明模型理解是结构化的。',
              ],
            },
            {
              question: '写回为什么放在 beforeSleep 统一做，而不是处理完立刻写？',
              points: [
                '命令处理完时回复已在输出缓冲里，**进 poll 睡觉前顺手写掉**——多数小回复一次 send 就成功，**省掉为写事件再多等一轮事件循环**；写不完的才升级为 AE_WRITABLE 事件。',
                'beforeSleep 名字的含义就在这：睡觉前把能干的活干完——事件循环的性能优化往往就是消灭"多睡一轮"这种看不见的空转。',
              ],
            },
            {
              question: 'serverCron 会不会被拖太久，导致定时任务失准？',
              points: [
                'serverCron 内部任务都有**分频与次数上限**（过期删除单轮限时、rehash 每次只迁一桶），设计上**保证单轮有限时长**——慢任务被切碎，而不是让一个任务霸占调度器。',
                'hz 调大只能**提高调度精度**（单位时间跑更多轮），救不了任务本身慢——"调度频率"与"任务耗时"是两个变量，排查定时任务不准时要分开看。',
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'be-mq',
      name: '消息队列',
      description: '选型、可靠传递、顺序与堆积——异步化架构的核心件。',
      references: [
        { label: 'Apache Kafka 官方文档', url: 'https://kafka.apache.org/documentation/' },
        { label: 'Apache RocketMQ 官方文档', url: 'https://rocketmq.apache.org/docs/' },
      ],
      questions: [
        {
          id: 'be-mq-why-and-choose',
          title: '为什么要用消息队列？Kafka、RocketMQ、RabbitMQ 怎么选？',
          difficulty: 'basic',
          tags: ['消息队列', '选型'],
          points: [
            '三大价值：**异步**（主流程只做必须同步的事，RT 下降）、**解耦**（生产者不需要知道消费者是谁，新增消费方零改动）、**削峰**（突发流量进队列，消费端按能力拉平处理）。代价同样要会说：一致性变最终一致、链路变长排查复杂、多一套中间件的运维。',
            '**Kafka**：分区日志模型 + 顺序写 + 零拷贝 + 批量压缩，**吞吐之王**；生态（流处理/连接器）最全；不适合：复杂延迟消息、事务消息弱。适合日志、埋点、大数据管道、高吞吐业务消息。',
            '**RocketMQ**：Java 生态、功能全面——**事务消息、延迟消息、顺序消息、死信队列、消息轨迹**开箱即用；吞吐略低于 Kafka 但业务语义丰富，电商交易类首选。**RabbitMQ**：AMQP 语义、路由灵活、延迟低，吞吐相对低（万级），适合中小规模业务集成、企业内异构系统。',
            '选型维度：吞吐量、功能特性（延迟/事务/顺序）、运维成本与团队栈、生态对接。一句话：**大数据管道 Kafka，业务交易 RocketMQ，轻量集成 RabbitMQ**。',
          ],
          followUps: [
            {
              question: '用了消息队列后，"发消息成功但消费失败"的一致性怎么处理？',
              points: [
                '接受**最终一致**：消费失败进重试队列（指数退避，如 10s/30s/1m/5m），多次失败进**死信队列（DLQ）**人工介入或定时补偿任务扫描。',
                '关键补充：消费端**幂等**（重试必然带来重复）、生产端**事务性投递**（本地消息表/事务消息）、**对账兜底**（定时比对主数据与下游状态，兜住一切意外）——MQ 三件套：重试、幂等、对账。',
              ],
            },
            {
              question: '哪些问题不适合用消息队列解决？选型时还有什么更本质的判据？',
              points: [
                '适用边界：MQ 的三大场景是**异步处理、流量削峰、服务解耦**，分布式锁、任务调度不是它的所长，硬套只会增加故障面；要求「流水与余额严格一致」的场景也**不适合**事务消息——正解是先在库事务里记流水、再异步更新余额，不一致时用流水校正（余额无法反推流水）。（来源：极客时间·消息队列高手课 01）',
                '选型判据：① 必须开源（出 Bug 能自己改源码救火）；② 近年流行、社区活跃（坑别人踩过、生态兼容如 Flink 对接 Kafka）；③ 及格线三特性 = **可靠传递、Cluster（水平扩展）、性能**。（来源：极客时间·消息队列高手课 02）',
                'RabbitMQ 补充短板：堆积设计理念是「管道」，大量积压后性能急剧下降（对照 Kafka/RocketMQ 的存储型设计）；Erlang 学习曲线极陡、二次开发维护性差；Exchange 灵活路由是它独有优势。（来源：极客时间·消息队列高手课 02）',
                '架构收益的一种表述：不用 MQ 时新增「送积分/优惠券」要改主流程代码再发版；引入 MQ 后**对新增消费方开放、对主流程修改关闭**——把开闭原则落到架构层。（来源：中间件核心技术与实战 13）',
              ],
            },
            {
              question: 'Kafka 和 RabbitMQ 这类传统 MQ 还有一个本质差异：消息被「消费」之后去哪了？',
              points: [
                'Kafka 是**可重演（replayable）**的：基于日志结构、消费是只读操作、位移由消费者自己控制，可以反复重放历史——传统 MQ（RabbitMQ/ActiveMQ）消费即删除（destructive），逻辑写错了只能从上游重新导数。（来源：极客时间·Kafka 核心技术与实战 30）',
                '配套选型口诀（30 讲）：处理逻辑复杂/单条处理代价高/不在乎顺序 → 传统 MQ；高吞吐/单条处理短/在乎顺序 → Kafka——回放能力正是「逻辑会改、要重算」场景（数仓、风控回溯、新下游冷启动）的底气。',
              ],
            },
            {
              question: '高频追问：Kafka 为什么不像 MySQL/Redis 那样做读写分离，让 Follower 分担读流量？',
              points: [
                '场景不对：Kafka 读写比 ≈ 1:1，不是读多写少，Follower 抗读没有收益；且 Follower 的复制是异步拉取、有滞后，开放读会破坏 Read-your-writes 与单调读——所以 Follower 只做数据冗余与高可用，不对外服务。（来源：极客时间·Kafka 核心技术与实战 23）',
                '一鱼两吃的收尾：这也解释了 Kafka 的读扩展为什么靠「分区 + 消费者组」水平扩展而不是加副本——读扩展单元是分区，不是副本；把 23 讲这两个设计理由背下来，副本机制题和选型题都能用。',
              ],
            },
          ],
        },
        {
          id: 'be-mq-no-loss',
          title: '如何保证消息不丢失？从生产、存储到消费的完整链路怎么设计？',
          difficulty: 'intermediate',
          tags: ['消息队列', '可靠性'],
          points: [
            '**生产端不丢**：同步发送 + 重试（失败重投，注意幂等）；或异步带回调确认；禁止 fire-and-forget。关键业务用**事务消息/本地消息表**：业务与"待发送消息记录"同库事务，后台任务扫描投递，发送成功才标记——把发送变成可重试动作。',
            '**存储端不丢**：Kafka **确认级别 acks=all（ISR 全部副本确认）+ min.insync.replicas≥2 + retries**，生产者幂等（enable.idempotence）防重试乱序；副本数 ≥3 且**不要把 leader/ISR 放同一机架**；禁止 unclean.leader.election（允许落后副本当 leader 会丢消息）。RocketMQ 同步刷盘 + 同步复制是最强档位（性能换可靠性按业务选）。',
            '**消费端不丢**：**先处理业务再提交位移（手动 ack）**——处理失败不 ack，重启重新消费（因此消费必须幂等）；禁止自动提交位移后崩溃（消息丢了）；消费重试 + 死信兜底。',
            '监控闭环：生产失败率、堆积量、DLQ 告警、**消息轨迹/链路追踪**（RocketMQ 自带，Kafka 配 header traceId）——"不丢"是系统属性，要靠监控证明而不是靠配置祈祷。',
          ],
          followUps: [
            {
              question: 'acks=all 就一定不丢吗？还有什么角落会丢？',
              points: [
                'acks=all 只保证"ISR 里的副本"写入，如果 ISR 收缩到只剩 leader（min.insync.replicas 没配或=1），等于异步；**正确组合是 acks=all + min.insync.replicas=2 + replication.factor=3**。',
                '其他角落：页缓存未刷盘时机器断电（Kafka 依赖副本而非 fsync，多副本同机柜可能一起丢——机架感知）；消费端先提交后处理；DLQ 无人消费；重试队列 TTL 过期丢弃。链路审计要从头到尾过一遍。',
                '配置公式的为什么：replication.factor = min.insync.replicas + 1——两者**相等**时挂一台 ISR 即小于 min.insync.replicas，整个分区直接不可写（可用性归零）；Producer 侧完整最佳实践还有 send(msg, callback) 杜绝 fire-and-forget + retries 调大。（来源：极客时间·Kafka 核心技术与实战 11）',
                '消费端隐蔽角落：Consumer 把消息交给**多线程异步处理**后，自动提交位移照常前移，某个线程处理失败 → 该消息已被「书签跳过」——多线程场景必须关自动提交、等全部处理完再手动提交位移。',
                '设计缺陷级角落：扩分区后 Producer 先于 Consumer 感知新分区，配 auto.offset.reset=latest 时，感知窗口内发到新分区的消息对消费者不可见——扩分区要评估消费端感知时序，不能只看 Broker 侧。（来源：极客时间·Kafka 核心技术与实战 期末测试）',
              ],
            },
            {
              question: '配置都拉满了，怎么证明线上真的没丢消息？',
              points: [
                '序号连续性检测：Producer 端拦截器给每条消息注入**分区级递增序号**（多个 Producer 各自编号并带 Producer 标识），Consumer 端拦截器校验连续性——断号即丢且能定位到具体消息；检测代码零侵入，验证稳定后可下线。（来源：极客时间·消息队列高手课 05）',
                '机制基础是「请求-确认」：服务端收到写入才回确认，超时/失败生产端重试；消费端**先业务后确认**，Broker 未收到确认会重发同一条——这同时是重复消息的来源，「不丢」与「幂等」是一体两面。（来源：极客时间·消息队列高手课 05）',
                '异步发送的常见丢失点：RocketMQ 同步/异步/单向统一走同一底层流程，异步只是丢给 asyncSenderExecutor 线程池——**回调里必须检查 SendResult/异常**，很多丢消息就出在异步发送不检查回调。（来源：极客时间·消息队列高手课 20）',
                '档位可以按业务放宽：允许重推的数据（如 Binlog 同步到 ES、任务支持回溯重跑）可用 acks=1 换性能，不必一律顶格配置。（来源：极客时间·消息队列高手课 22）',
              ],
            },
            {
              question: '从高水位（HWM）的视角重新表述"存储端不丢"，本质在控制什么？',
              points: [
                'leader 只把"**全部 ISR 都已复制**"的前缀暴露给消费者——所以 acks=all + min.insync.replicas≥2 的本质是**控制 HWM 的推进条件**：HWM 没推进，消息对消费者不可见，宕机切换也不会丢。（来源：Grokking Advanced System Design · Kafka）',
                '三档 ack 的标准话术：**Async fire-and-forget / Committed to Leader / Committed to Leader and Quorum**——持久性与吞吐的旋钮就三档，能按业务把档位和丢失窗口对应起来，这题就答透了。',
                '但这套保证有一个机制级缺口：Follower 的 HW 更新**天然滞后一轮 FETCH**，min.insync.replicas=1 时，Follower 带着旧 HW 重启会截掉未及标记的消息，连锁切主后**已 ack 的消息**可能被全部副本抹掉——0.11 的 Leader Epoch（重启先查 Leader LEO 再决定是否截断）堵住该窗口。把「配置组合」升级成「机制答案」是这题的分水岭，完整推导见 be-mq-kafka-hw-epoch。（来源：极客时间·Kafka 核心技术与实战 27）',
              ],
            },
            {
              question: '先消费后提交会不会影响 TPS？位移提交 API 的工程细节怎么把握？',
              points: [
                '两个 API 的分工：commitSync 阻塞且**失败自动重试**（适配瞬时错误，但阻塞拉长单轮耗时）；commitAsync 不阻塞但**失败不自动重试**——重试提交的可能早已被后续提交覆盖的过期位移，重试无意义。（来源：极客时间·Kafka 核心技术与实战 18）',
                '标准范式：消费循环内用 commitAsync 攒吞吐，finally 里最后补一次 commitSync 保兜底；大批量场景用带 Map〈分区, 位移〉参数的细粒度提交（如每处理 100 条提交一次），把「重放窗口」缩小到可控。',
                '两个细节：提交的位移是「**下一条要消费的消息的位移**」（record.offset()+1）；「先消费后提交」的重放窗口 = 上次提交到崩溃点之间的消息，靠消费幂等兜底重放，而不是幻想消灭重放——与 be-mq-idempotent 互为表里。（来源：极客时间·Kafka 核心技术与实战 18）',
              ],
            },
          ],
        },
        {
          id: 'be-mq-idempotent',
          title: '消息为什么会重复？消费端幂等的正确实现是什么？',
          difficulty: 'intermediate',
          tags: ['幂等', '消息队列'],
          points: [
            '重复的必然性：生产端超时重试（消息可能已写入）、rebalance/消费超时导致位移未提交重投、主从切换重放——**至少一次（at-least-once）语义下重复是常态**，不用纠结消除，专注幂等消费。',
            '幂等实现阶梯：① **唯一键去重**：消息带业务唯一 ID（订单号/事件 ID），消费表唯一索引 `insert ignore`，同事务完成业务写入——**最可靠，天然防并发**；② 状态机：`update ... where status=旧状态`，影响行数为 0 即已处理；③ Redis SETNX 消费标记（快但有丢失风险，需 DB 兜底）；④ 天然幂等操作（set 固定值、delete 不存在）无需处理。',
            '架构级方案：Kafka **幂等生产者 + 事务**保证"分区内精确一次"，但**跨系统（消费端写 DB/调用 RPC）永远做不到传输层精确一次**——"恰好一次"的本质是"至少一次传递 + 幂等消费"。',
            '设计要点：业务 ID 而不是 msgId 做去重键（重投的消息 msgId 相同但业务可能不同——重试链路要透传业务键）；去重记录要有生命周期（过期清理）。',
          ],
          followUps: [
            {
              question: '消费逻辑是"扣减库存"，幂等怎么做？',
              points: [
                '不能用"insert 去重表"就完事——去重和扣减必须**同库同事务**：`insert into consume_log(order_id) values(?)` + `update stock set n=n-1 where sku=?`，任一失败整体回滚。',
                '分库分表下去重表要按同一分片键路由，保证同订单的操作落在同一库；跨库用本地消息表/SAGA + 状态机（订单状态流转防重）。',
              ],
            },
            {
              question: '「查状态再更新」这种幂等写法，并发下为什么会失效？',
              points: [
                '理论锚点：**At least once + 幂等消费 = Exactly once**（从「对系统的影响」角度成立）；主流 MQ 全部只承诺 At least once——把精力花在消费端幂等，而不是寻找"零重复"的 MQ。（来源：极客时间·消息队列高手课 06）',
                '幂等三法阶梯：① 数据库唯一约束（转账单 ID + 账户 ID 联合唯一，重复 insert 直接失败）；② **前置条件更新**（"余额为 500 时才 +100"/版本号 CAS）；③ 记录并检查（Token/全局 ID）。（来源：极客时间·消息队列高手课 06）',
                '并发陷阱：「查状态→更新数据→置状态」三步必须**原子**，否则两个消费者同时查到"未处理"就会双花——必须放同一事务或加锁，这正是"去重与业务同库同事务"的原理级解释。（来源：极客时间·消息队列高手课 06）',
                'ABA 边界：前置条件用「余额判等」有 ABA 问题——余额 100→200→100 后，旧消息仍能通过校验重复扣款；**版本号单调递增**才是安全的前置条件。（来源：极客时间·消息队列高手课 06）',
              ],
            },
            {
              question: 'Kafka 默认为什么是 at-least-once？能不能退到 at-most-once？',
              points: [
                '机制级回答：消息已写入但 Broker 的 ack 在网络抖动中丢失 → Producer 无法区分「没写到」还是「写到没收到 ack」，唯一安全动作是重试 → 重复必然存在——这是 at-least-once 成为默认的根因，不是配置失误。（来源：极客时间·Kafka 核心技术与实战 14）',
                '反向选项成立：允许偶发丢失但绝不重复的场景（如 PV 统计）可关闭重试退化成 at-most-once——语义档位是可以用重试开关换的，先想清楚业务怕丢还是怕重。',
                '范围边界：Kafka 传输层幂等（enable.idempotence）只保单分区单会话，Producer 重启或跨分区都不保——Broker 端幂等替代不了消费端幂等，跨系统最终一致永远要靠消费端兜底（对照 be-mq-kafka-idempotent-tx 的会话边界分析）。（来源：极客时间·Kafka 核心技术与实战 14）',
              ],
            },
          ],
        },
        {
          id: 'be-mq-order',
          title: '如何保证消息的顺序消费？全局有序和分区有序的区别？',
          difficulty: 'advanced',
          tags: ['顺序消息', '消息队列'],
          points: [
            '顺序破坏的三个环节：**发送乱序**（重试/多线程）、**存储打散**（Kafka 轮询分区）、**消费乱序**（并发消费/rebalance）。',
            '工程答案是**分区有序**（局部有序）：**同一业务键的消息进同一分区**（Kafka 指定 key/自定义分区器；RocketMQ MessageQueueSelector）+ **该分区单线程消费**（Kafka 同一分区只会被组内一个消费者消费，天然有序；RocketMQ 用 MessageListenerOrderly + 分区锁）。全局有序 = 单分区，牺牲全部并行度，几乎不用。',
            '发送端保障：**同步发送 + 失败不切分区重试**（异步重试可能换 broker 乱序）；Kafka 开启幂等生产者后同分区重试也能保序（PID + 序列号）。',
            '消费端保障：处理失败不能跳过也不能无限阻塞——**重试会破坏顺序**（RocketMQ 顺序消费是本地阻塞重试保序）；rebalance 期间分区迁移的窗口也要防重复（幂等兜底）。**能设计成"无需顺序"就别要顺序**：比如用状态版本号（update where version=）让乱序到达也能正确收敛。',
          ],
          followUps: [
            {
              question: '为什么"状态版本号"常常比"顺序消息"更靠谱？',
              points: [
                '顺序消息把正确性压在消息系统与消费部署的每个环节（分区选择、单线程、rebalance），任何一处抖动就出 bug，且难以测试。',
                '版本号/状态机把正确性内聚在**数据本身**：到达顺序无关，旧版本更新被拒绝，天然幂等且并发安全——分布式系统设计里"让数据自带顺序"优于"让管道保证顺序"。',
              ],
            },
            {
              question: '发送端把消息选进分区/队列，算法上有什么讲究？全局顺序的真实代价有多大？',
              points: [
                '选队列算法：要同时满足「相同 Key 落同一队列」和「支持分区水平扩容」，答案是**一致性哈希**——简单取模能满足前者，但扩容时 Key→队列映射大面积漂移，顺序被成批破坏。（来源：极客时间·消息队列高手课 08）',
                '全局严格顺序的定量代价：队列数 = 1、生产者/消费者都单实例——完全放弃并行度，只有审计流水类极端场景可用。（来源：极客时间·消息队列高手课 08）',
                '顺序与高可用的互斥：顺序消息的队列固定在特定主从组上，主挂后其他主无法接管（接管即乱序）——传统主从架构下是二选一；Dledger 类方案选举时选**数据最新的从节点**为主，才能兼得。（来源：极客时间·消息队列高手课 08）',
              ],
            },
            {
              question: '真实改造案例：把全局顺序改成分区有序，能换来多大收益？怎么做？',
              points: [
                '案例：因果序业务原本用单分区保全局序、牺牲全部吞吐；改造为**按消息体业务标志位提取成 Key + 自定义 Partitioner（同 Key 同分区）**，吞吐提升 **40 多倍**——「分区有序 + 业务键提取」是顺序消息的标准落地话术。（来源：极客时间·Kafka 核心技术与实战 09）',
                '默认分区策略的准确表述：指定 Key 按 Key 哈希取模进同分区（保序），未指定 Key 轮询（均匀）；需要自定义时实现 partitioner.class 的 partition() 方法——别说成「随机」。',
                '消费端并行约束：顺序的最后防线是「同一分区同一时刻只被组内一个消费者消费」，所以实例内**不能**再开处理线程池并发消费（会破坏分区内顺序）——顺序业务的并行只能靠加分区/加实例，这与本题主答案「该分区单线程消费」互为实现级解释。（来源：极客时间·Kafka 核心技术与实战 20）',
              ],
            },
          ],
        },
        {
          id: 'be-mq-backlog',
          title: '消息大量堆积怎么办？如何设计消费端的扩容与降级？',
          difficulty: 'intermediate',
          tags: ['消息队列', '堆积'],
          points: [
            '先定位堆积原因：**消费能力不足**（慢 SQL、外部 RPC 瓶颈）还是**消费故障**（异常循环、死循环重试）还是**生产激增**——处理手段完全不同。',
            '消费能力不足的扩容：加消费者实例（**受限于分区数**，Kafka 消费者数 > 分区数是空转——先扩分区，注意扩分区的 key 路由变化）；单条慢就**批量拉取批量处理**；瓶颈在下游（DB）则扩下游或**聚合写入**；RocketMQ 可临时"搬运"：写个快速消费程序把消息搬到新 topic（更多分区）再并行消费。',
            '**降级与止损**：非关键消息可先落盘/转存（ES、HDFS），延后回放；设置堆积告警阈值（水位线）+ 消费延迟监控（Kafka lag）；**绝不能为了降级丢弃业务消息**——除非确认该类消息可弃（日志类）。',
            '预防：生产端限流 + 削峰容量评估、消费端容量压测、**死信与重试隔离**（避免重试风暴挤占正常消费）、大促前做堆积演练。',
          ],
          followUps: [
            {
              question: 'Kafka 的分区数为什么不能随意调大？',
              points: [
                '每个分区对应若干文件句柄与索引、副本同步与选举开销；分区越多 controller/broker 元数据越大，故障恢复越慢（分区是故障转移与并行的最小单位，也是开销单位）。',
                '已存在 key 的消息在新旧分区分布会变（哈希桶数变化），顺序性被破坏——所以分区规划要**预估三年后的吞吐**，宁多勿少。',
              ],
            },
            {
              question: '堆积真的来了，具体看哪些指标？排查有什么口诀和反模式？',
              points: [
                '控制台指标（RocketMQ）：**Delay = BrokerOffset − ConsumerOffset** 即积压条数；**LastConsumeTime** 是最后成功消费那条消息的存储时间——显示 1970 说明位点对应的消息已过期被删除。（来源：中间件核心技术与实战 19）',
                '判因口诀：粗因只有两种——**发送变快 or 消费变慢**；收发速率都没变却还在积压，去查「一条消息反复消费失败」；jstack 连打 5 份对比同一 ConsumeMessageThread 状态，**RUNNABLE 也要看**——HTTP 调用没设超时、线程等 DB 时就是 RUNNABLE 而不是 BLOCKED。（来源：极客时间·消息队列高手课 07）',
                '反模式警示：OnMessage 收到消息丢进内存队列就 ack、另起线程池慢慢处理——宕机即丢消息；正确方向是扩队列 + 扩实例，且 **Consumer 实例数 ≤ 分区数**（超过即空转）。（来源：极客时间·消息队列高手课 07）',
                '位点回溯兜底：RocketMQ `resetOffsetByTime` 可以**不停消费组**重放历史（位点在 Broker 侧，客户端定期拉取位点自然生效）；Kafka 必须先停组再 reset。（来源：中间件核心技术与实战 17）',
                'Kafka 侧口径：分区级 Lag = LOG-END-OFFSET − CURRENT-OFFSET，主题级要手动汇总；kafka-consumer-groups --describe 输出里 CONSUMER-ID/HOST 为空 ≠ 命令失败，只是组内无 active 成员、LAG 仍有效——告警脚本要按此写。紧急度上 **Lead（最新可用位移 − 消费位移）逼近 0 比 Lag 增大更危险**：消息即将被 retention（默认 7 天）删除，随后位移重置导致全量重放或直接跳丢；且 Lag 大有马太效应（超出页缓存后落盘读更慢）。另盯 Broker 端 UnderReplicatedPartitions > 0——副本未同步是可能丢数据的前兆，别和消费堆积混为一谈。（来源：极客时间·Kafka 核心技术与实战 22/36）',
              ],
            },
            {
              question: '止损之后要回放历史，Kafka 的位移重设有哪几种姿势？',
              points: [
                '七种重设策略按「想从哪重新开始」选：Earliest（重放全部，注意最早位移未必是 0，可能已被 retention 删掉）/ Latest（跳过全部历史）/ Current（回到已提交处）/ Specified-Offset（精确跳过毒消息）/ ShiftBy-N（相对跳 N 条）/ DateTime（回到某时间点）/ Duration（PnDTnHnMnS ISO-8601 时长）。（来源：极客时间·Kafka 核心技术与实战 30）',
                '落地方式：API 用 seek 系列逐分区设置；命令行 kafka-consumer-groups --reset-offsets——Kafka 必须先停组再重设（对照 RocketMQ 可不停组，见上一问的位点回溯兜底）。',
                '扩分区的连带提醒：分区数变更会触发订阅该主题的**所有消费者组重平衡**，扩容窗口内消费暂停——扩分区动作要与重平衡治理一起排期，别在大促前夜做。（来源：极客时间·Kafka 核心技术与实战 17）',
              ],
            },
          ],
        },
        {
          id: 'be-mq-delay-tx',
          title: '延迟消息和事务消息的实现原理是什么？',
          difficulty: 'advanced',
          tags: ['延迟消息', '事务消息', 'RocketMQ'],
          points: [
            '**延迟消息**：RocketMQ 固定 18 个级别（1s~2h），实现是 broker 内部 **SCHEDULE_TOPIC_XXX**：消息先投到内部延迟 topic，定时任务（ScheduleMessageService）扫描到期后换成真实 topic 投递——本质是"定时轮 + 二次投递"。任意时间延迟用**时间轮（TimerWheel）**方案（RocketMQ 5.x 定时消息）或 Redis ZSet（score=执行时间，轮询到期）/延迟队列中间件。',
            '为什么不用"消费者自己 sleep/轮询 DB"：把定时逻辑分散到消费者（扩容失效、重试复杂）；集中式延迟服务把"到期"变成可靠投递，消费端无感知。',
            '**事务消息（RocketMQ）**：① 发送**半消息（half message）**（对消费者不可见）；② 执行本地事务；③ 提交（commit，消息可见）或回滚（rollback，删除）；④ broker **定时回查**生产者"本地事务到底成没成"（生产者要实现 checkLocalTransaction 查本地事务状态表），防止 ②③ 之间进程挂掉。解决的是"**本地事务与发消息的原子性**"。',            '对比本地消息表：事务消息把"消息表+扫描任务"下沉到 MQ 中间件（生产者只需提供回查接口），本地消息表更通用（不依赖特定 MQ）但要在每个业务库建表。',
          ],
          followUps: [
            {
              question: '事务消息能替代分布式事务（Seata/TCC）吗？',
              points: [
                '不能：事务消息只解决"**上游动作与消息投递**"的原子性，下游消费失败靠重试 + 最终一致——适合"通知/同步类"场景（扣积分、发通知）。',
                '需要**多方同时成功或同时失败**的强一致（资金扣减跨服务），要用 TCC/SAGA/AT（Seata）做正向操作 + 补偿/回滚编排。判断标准：能接受"先成功后补偿"（最终一致）用消息；必须"同一时刻一致"用分布式事务框架，且优先重新设计边界消灭它。',
              ],
            },
            {
              question: '半消息在 Broker 里到底是怎么存的？回查有哪些工程细节？',
              points: [
                '存储级实现：Broker 收到带 `PROPERTY_TRANSACTION_PREPARED=true` 的消息后，把原 topic/queueId 存进 `REAL_TOPIC/REAL_QUEUE_ID` 属性，消息实际写入内部主题 **RMQ_SYS_TRANS_HALF_TOPIC**（对消费者不可见）；commit 时复制回真实 topic，rollback 仅标记已处理。（来源：中间件核心技术与实战 18）',
                '回查细节：`TransactionalMessageCheckService` 定时扫描半消息、逐条发反查 RPC；生产者实现 `checkLocalTransaction` 按 orderId 查库——**存在即 COMMIT，不存在返回 UNKNOW**（可能失败也可能还在执行），UNKNOW 下次继续查。（来源：中间件核心技术与实战 18）',
                '容错设计：反查查的是 DB、不依赖发送节点的本地内存——节点宕机其他实例可代答；producer 的 commit/rollback 本身是 oneway RPC、丢了就靠回查兜底——「每个环节都可能失败，靠状态可查 + 重试收敛」。（来源：中间件核心技术与实战 18）',
                '对照 Kafka 事务：Kafka 引入**事务协调器**（状态持久化在 `__transaction_state` 主题），消息**直接写业务分区**不做暂存，由消费者按控制消息过滤未提交批次，且没有反查——它解决的是流计算 read-process-write 链路内的恰好一次，与 RocketMQ「本地事务与发消息的原子性」不是同一个问题。（来源：极客时间·消息队列高手课 04）',
                'Kafka 侧使用面补全（详见 be-mq-kafka-idempotent-tx 题）：transactional.id + initTransactions/beginTransaction/send/commitTransaction 四步 API；abort 的消息**仍写入了底层日志**，只是靠控制消息与 LSO 对 read_committed 消费者隐藏——「RocketMQ 半消息的原子性在投递生命周期，Kafka 事务的原子性在消费可见性」，一句话把两者分层讲清。（来源：极客时间·Kafka 核心技术与实战 14）',
              ],
            },
            {
              question: 'Kafka 这边为什么没有延迟消息？缺了怎么补？',
              points: [
                'Kafka 原生没有延迟/定时消息能力：延迟类需求在 Kafka 生态要靠上游调度（按延迟分级 topic + 定时转发）或外层时间轮组件补——这也是「Kafka 不适合业务交易类消息、交易类选 RocketMQ」论据的机制根源。（来源：极客时间·Kafka 核心技术与实战 14）',
                '对比记忆：RocketMQ 用 Broker 内部延迟主题 + 定时任务扫描二次投递实现延迟（本题主答案），Kafka 把这类功能留给生态而不是 Broker——「Broker 精简、功能外置」与「Broker 富功能」两条路线的典型分歧。',
              ],
            },
          ],
        },
        {
          id: 'be-mq-kafka-throughput',
          title: 'Kafka 为什么吞吐这么高？从写入到消费拆解它的性能设计。',
          difficulty: 'intermediate',
          tags: ['Kafka', '高性能', '零拷贝'],
          points: [
            '顺序写：每个分区是 append-only 日志（segment 文件），磁盘顺序写可达数百 MB/s，避开随机 IO——这是与"B+ 树存储引擎"型 MQ 最本质的差异。',
            '页缓存：Kafka 不自建缓存，直接依赖 OS page cache——读写都走页缓存，缓存跟着内核不跟进程（进程重启缓存不失效），也避开 JVM 堆内缓存的 GC 压力。',
            '零拷贝：消费路径 `sendfile` 页缓存直达网卡；生产/消费靠**批量**（batch.size + linger.ms 攒批，支持 lz4/zstd 压缩）摊薄网络与 RPC 开销。',
            '并行模型：分区是并行的最小单位，多分区多 broker 分散负载，消费者组水平扩展——吞吐 ≈ 分区并行度 × 单分区顺序 IO 能力。',
            '代价与边界：依赖页缓存意味着掉电不丢消息要靠**副本而不是 fsync**（Kafka 默认几乎不刷盘）；sendfile 路径上无法对消息逐条改写——可靠性组合见 be-mq-no-loss。',
          ],
          followUps: [
            {
              question: 'sendfile 解决了什么？普通读写的拷贝路径长什么样？',
              points: [
                '传统 read+write：磁盘→页缓存→用户态缓冲→socket 缓冲→网卡，4 次拷贝 4 次切换。',
                'sendfile：页缓存→网卡（SG-DMA 下 0 次 CPU 拷贝），2 次切换；mmap+write 是另一条路（RocketMQ 用的），仍是"页缓存→socket 缓冲"两段。',
              ],
            },
            {
              question: '页缓存会带来什么运维坑？',
              points: [
                '"写入很快"是假象——刷盘异步，监控要区分写入吞吐与落盘水位。',
                '机器内存紧张、页缓存被挤时消费突然变慢（开始读磁盘），极易误判为消费端问题；内存规划要给活跃 segment 留足。',
              ],
            },
            {
              question: '「批量」在 Kafka 里是怎么做到全链路不拆包的？',
              points: [
                '全链路批消息：Producer API 只有单条 send，**攒批发生在客户端**；Broker 写盘、复制、读全程把一批当**一条批消息**处理，直到消费端才拆包——构建与解包都在客户端，Broker 每批只处理 1 次请求。压测参考值：单节点接近 2000 万条/s、600MB/s。（来源：极客时间·消息队列高手课 15）',
                '压缩即批：Kafka 的压缩以批为单位，**服务端不解压、整批存储转发**，解压在消费端——省服务端 CPU 又享受带宽/存储收益；算法选择：要速度选 LZ4/Snappy，要压缩比选 GZIP/XZ。（来源：极客时间·消息队列高手课 19）',
                '客户端组装：Kafka 在**客户端**按存储协议组织数据、Broker 直接落盘不重排——把计算下推到数据源头省 Broker CPU；`linger.ms` 攒批类似 TCP Nagle——**延迟换吞吐**。（来源：中间件核心技术与实战 14）',
                '边界：「Kafka 一定更快」不成立——主题/分区多时 IO 零散化，性能随分区数**先升后降**；SSD 下 RocketMQ 单文件顺序写反而难压满磁盘带宽。（来源：中间件核心技术与实战 14）',
              ],
            },
            {
              question: '为什么 Kafka 敢把可靠性押在页缓存上？「挖坟」读历史数据会出什么问题？',
              points: [
                '定性框架：PageCache 是**读写缓存、天然不可靠**——写入缓存即对应用返回成功、掉电即丢，`sync` 强刷会失去缓存意义；Kafka 敢用的三个前提：MQ 读写比 ≈ 1:1（只读缓存无加速价值）、可靠性靠**多副本而非 fsync**、页缓存由内核实现无需自研缓存代码。（来源：极客时间·消息队列高手课 16）',
                '挖坟问题：某个客户端从很旧的位置批量拉历史数据，**缓存被历史页填满**，其他客户端命中率骤降；JMQ 的解法是给 LRU 加「距尾部距离」权重、旧页优先淘汰（改进型 LRU/2Q 思想）。（来源：极客时间·消息队列高手课 16）',
                '理论对应：内核用 LRU 变种（2Q）管理页缓存，**冷数据扫描类负载会把热页挤出**——与"挖坟"同构；所以页缓存型 MQ 要避免大量随机回溯历史数据。（来源：极客时间·消息队列高手课 16）',
              ],
            },
            {
              question: 'acks=all 开满之后吞吐上不去，先看什么？Broker 什么时候会偷偷重压缩？',
              points: [
                '首要瓶颈常在复制层而不是网络层：acks=all 的吞吐受**副本同步速度**制约（HW 要等 ISR 全拉齐才推进），把 Follower 拉取线程数 num.replica.fetchers（默认 1）调大，Producer 吞吐常常直接上去——可靠性开到最高档后，优化对象从网络层转到复制层。（来源：极客时间·Kafka 核心技术与实战 38）',
                'Broker 意外重压缩的两个触发点（Broker CPU 飙升排查项）：① Broker 配置了与 Producer 不同的 compression.type（保持默认 producer 即尊重发送端）；② 新旧消息格式转换（兼容老客户端 V1↔V2）——后者还会丢零拷贝，客户端与 Broker 版本一致本身就是性能优化。（来源：极客时间·Kafka 核心技术与实战 38）',
                '论据弹药：京东曾提议「消息校验挪到解压之前即可免解压」可把 Broker CPU 降 50%+，被社区以正确性为由拒绝——「正确性优先于性能」的现成案例，答辩时可以直接引用。（来源：极客时间·Kafka 核心技术与实战 10）',
              ],
            },
          ],
        },
        {
          id: 'be-mq-message-model',
          title: '主题和队列有什么区别？消费模型是怎么演化到今天的消费组模式的？',
          difficulty: 'basic',
          tags: ['消息队列', '消息模型', '消费组'],
          points: [
            '**队列模型**：FIFO、出队即删除，一条消息只能被一个消费者消费；要把同一份消息给风控、分析、支付多个系统，就得为每个消费者建队列、由生产者发多份——既浪费存储，又让生产者感知消费者的存在，违背解耦初衷。',
            '**发布-订阅模型**：存储容器从队列升级为主题（Topic），「订阅」是主题在消费时的逻辑副本，每份订阅都能收到全量消息；只有一个订阅者时它与队列模型等价——两者并没有本质区别（RabbitMQ 靠 Exchange 路由到多条队列变相实现发布订阅）。（来源：极客时间·消息队列高手课 03）',
            'RocketMQ/Kafka 在主题下再引入队列（Kafka 叫分区）：「请求-确认」机制下一个队列只能串行确认、无法水平扩展——多队列才能多实例并行收发；**顺序只在队列级保证**。',
            '**消费组 = 一份订阅**：组内消费者分摊队列（同一队列同一时刻至多被组内一个消费者占用），组间互不影响、消费进度独立，积压只影响自己组——一份数据同时服务 N 个下游而不互相拖累。',
            '消费位移按「**消费组 × 队列**」在服务端维护，本质是一组整数、与消费者实例无关——消费者宕机换人位移不丢；丢消息多半是位移处理不当，而不是消息真的没了。（来源：极客时间·消息队列高手课 08）',
          ],
          followUps: [
            {
              question: '消息被"消费"之后，为什么不从队列里删掉？',
              points: [
                '因为每个消费组各要一份全量消息，服务端无法判断"所有组都消费完了"——删除时机只能交给过期策略；消费语义由此转移到**位移**上：位移之前 = 已消费，位移之后 = 可消费，队列里存的一直是全量。（来源：极客时间·消息队列高手课 08）',
              ],
            },
            {
              question: '为什么一个队列内只能串行确认、没法并行消费？',
              points: [
                '「请求-确认」要按序推进位移：同一队列并行确认就无法维护连续的位移——想并行只能加队列。',
                '消费中出现"消息空洞"（前一条失败、后面已完成）时，位移会卡住；工程上有「空洞消息复制进重试队列 + 位移越过空洞前移」的解法，但开销大，不作常规手段。（来源：极客时间·消息队列高手课 08）',
              ],
            },
            {
              question: 'RabbitMQ 坚持队列模型，换来什么、失去什么？',
              points: [
                '换来：Exchange 灵活路由（直连/主题/扇形）、队列即物理实体的简单语义；失去：多订阅要为每个消费者复制多份消息、堆积能力弱（管道理念，大量积压性能急剧下降）——发布-订阅语义要靠路由"变相"实现。（来源：极客时间·消息队列高手课 03）',
              ],
            },
          ],
        },
        {
          id: 'be-mq-nameserver',
          title: 'RocketMQ 的 NameServer 为什么不用 ZooKeeper？两种元数据协调方式怎么选？',
          difficulty: 'intermediate',
          tags: ['RocketMQ', '注册中心', 'ZooKeeper'],
          points: [
            'NameServer 设计极简：独立小进程（核心只有 RouteInfoManager 一个类 + 5 个内存 Map），**节点间零通信、互不感知**，每个节点独立提供完整服务；路由信息只存内存、不持久化。（来源：极客时间·消息队列高手课 23）',
            '一致性不靠共识靠约定：Broker 向**所有** NameServer 主动注册 + 定时全量上报（上报兼做心跳），靠「数据源单点 + 全量覆盖」收敛；心跳超时即摘除 Broker，客户端通信失败后重新拉路由自动切换——**最终一致 + 客户端容忍短暂脏路由**。',
            '客户端定时（30s 级）拉路由缓存本地。ZooKeeper 路线则是一致性存储 + **临时节点**（会话断开自动删除，天然的存活检测）+ Watcher 推送；Kafka 把元数据存 ZK，但客户端**不直连 ZK**——向任意 Broker 发 MetadataRequest 取路由，Broker 缓存全量元数据做中转。（来源：极客时间·消息队列高手课 24）',
            'ZK 的两条使用告诫：不要存大量数据（几百 MB 后性能稳定性骤降，它不是存储系统）；不要把业务可用性绑死在 ZK 上（选举慢、对网络抖动敏感）——Kafka 因此建议集群拆小、每组独立 ZK。（来源：极客时间·消息队列高手课 24）',
            '选型口径：元数据量小、变更不频繁、能容忍秒级不一致 → NameServer 这种**无共识镜像复制**极简且无单点；需要强一致协调（选主、分布式锁、临时节点语义）才值得付 ZK 的运维与可用性代价。',
          ],
          followUps: [
            {
              question: 'Broker 只向部分 NameServer 注册成功、节点间数据不一致，会怎样？客户端怎么自愈？',
              points: [
                '定时全量上报最终覆盖不一致；客户端拉到旧路由会连接失败，触发重试与重新拉路由——短暂脏路由表现为个别发送失败，靠「客户端重试 + 定时全量刷新」收敛，不需要服务端共识。',
              ],
            },
            {
              question: '为什么 Kafka 客户端不直接连 ZooKeeper 取元数据？',
              points: [
                '客户端数量巨大，ZK 的连接数与写入能力撑不住；由 Broker 缓存全量元数据做中转、客户端本地缓存削峰，ZK 只服务 Broker 集群内部协调——海量的客户端连接永远不要打到共识服务上。（来源：极客时间·消息队列高手课 24）',
              ],
            },
            {
              question: '这套设计和你了解的注册中心（Nacos/Consul）的推送 vs 轮询怎么对应？',
              points: [
                'NameServer 是「拉」：客户端定时拉 + 本地缓存；ZK + Watcher 是「推」：变更主动通知。推送低延迟但服务端要维护订阅关系，轮询简单、自愈强但有秒级不一致窗口——MQ 元数据的量级小、变更少，轮询的代价完全可接受，这是它敢不做共识的前提。',
              ],
            },
          ],
        },
        {
          id: 'be-mq-push-pull',
          title: '消费消息用 Push 还是 Pull？长轮询是怎么把两者的优点结合的？',
          difficulty: 'intermediate',
          tags: ['消息队列', '消费模型', '长轮询'],
          points: [
            'Pull 的本质：客户端主动拉，速率自主、**天然背压**（消费不动就少拉），服务端不用维护每消费者的推送状态；缺点是轮询间隔带来的延迟与空轮询浪费。',
            'Push 的两难：服务端推延迟低，但**速率失控会打垮慢消费者**（背压难做），还要为每个消费者维护推送状态——纯 Push 在消息队列里几乎没人敢用。',
            'RocketMQ 的答案是「**用 Pull 实现的 Push**」：PullMessageService 拉完一批就把 PullRequest 塞回队列循环再拉，业务代码完全无感、表现如 Push；拉不到时不立刻重试空转，而是**长轮询**——请求在 Broker 挂起，该队列一旦有新消息立即唤醒返回，超时才返回空，低延迟与不空转兼得。（来源：极客时间·消息队列高手课 21）',
            '消费端两组件：**ProcessQueue**（每队列一个，TreeMap 存已拉未确认消息，位移按其最小位点提交——保证不跳过未完成消息）+ 消费线程池，拉取与消费解耦。（来源：中间件核心技术与实战 19）',
          ],
          followUps: [
            {
              question: '长轮询、客户端定时轮询、服务端纯推，延迟和开销怎么排？',
              points: [
                '纯推延迟最低，但服务端要维护推送状态且背压难做；定时轮询服务端最简单，但延迟 = 轮询间隔、空轮询白白耗资源；长轮询用「挂起 + 有消息即唤醒」把延迟压到接近推、空轮询压到接近零——代价是 Broker 要挂住请求、维护挂起队列（都是实现复杂度，不是资源开销）。',
              ],
            },
            {
              question: '消费端处理不过来时，怎么知道该减速？背压在哪里做？',
              points: [
                'RocketMQ 客户端本地限流三条件：缓存消息 **1000 条**、最大最小 offset 跨度 **2000**、缓存 **100MB**——任一触发即暂停拉取；日志出现 `so do flow control` 就是它。本质是"伪 Push 下客户端自己踩刹车"，服务端无需感知消费速率。（来源：中间件核心技术与实战 16）',
              ],
            },
            {
              question: '让你设计一个消费客户端，拉取和消费线程怎么配合？',
              points: [
                '拉取线程 + 本地缓冲（ProcessQueue/TreeMap）+ 消费线程池：拉取与消费解耦；位移提交取缓冲区**最小位点**（不跳过未完成消息）；缓冲超限暂停拉取（背压）——这就是 RocketMQ DefaultPushConsumer 的骨架，也是消费端线程模型的通用范式。',
              ],
            },
          ],
        },
        {
          id: 'be-mq-request-reply',
          title: '只用消息队列怎么做「请求-应答」？网关发出异步消息后怎么同步拿到结果？',
          difficulty: 'intermediate',
          tags: ['消息队列', '异步转同步', '秒杀'],
          points: [
            '场景矛盾：网关把秒杀请求发进 MQ 就返回，用户端拿不到「成功/失败」；MQ 是单向异步管道，要同步结果就得在异步链路上**叠一层同步等待**。（来源：极客时间·消息队列高手课 01）',
            '方案骨架：网关为每个请求生成**全局唯一请求 ID**，消息携带「请求 ID + 网关实例 ID」；发送后在本实例的 results Map 登记等待项，用 `mutex.wait(timeout)` 限时阻塞等待。（来源：极客时间·消息队列高手课 08）',
            '结果回传：后端秒杀服务完成后按「网关实例 ID」RPC 回调原网关、携带请求 ID；网关把结果放进 results Map 并 `notify()` 唤醒等待线程取出返回；**超时按失败处理**，迟到结果因等待项已清理而直接丢弃。（来源：极客时间·消息队列高手课 08）',
            '关键细节：等待必须带超时（不能无限等）；Map 清理放 finally 防泄漏；「按网关实例路由结果」依赖消息里带实例 ID——这是一条**有状态的回传路径**，多实例网关各自只等自己的请求。',
          ],
          followUps: [
            {
              question: '这套机制和 RPC 框架的「单连接多请求」是同构的，对应关系是什么？',
              points: [
                '请求 ID ↔ requestId；results Map + wait ↔ Future Map 登记；回调放结果 + notify ↔ 响应带回原 requestId 唤醒；等待项超时清理 ↔ Future 超时移除——「请求-响应」异步转同步的通用模式，MQ 只是借消息把两半隔到了不同进程。',
              ],
            },
            {
              question: '网关在 wait 期间宕机，用户侧和后端侧各发生什么？怎么兜底？',
              points: [
                '用户侧：等待线程随进程消亡，APP 只能按超时收失败；后端侧：秒杀可能已经成功，结果无人认领。兜底靠**幂等 + 结果可查询**——APP 拿到失败后可查订单是否真的创建；等待项只放本地内存是多实例网关的固有局限，重要场景要外置等待状态或允许重查。',
              ],
            },
            {
              question: '什么时候该放弃同步返回，改成「受理成功 + 结果推送/轮询」？',
              points: [
                '同步等待占用处理线程、受 HTTP 超时预算约束；秒杀的正解是只做**风控 + 库存扣减**两步同步，其余（订单、短信、统计）全部异步进 MQ。（来源：极客时间·消息队列高手课 01）',
                '业务能接受"先拿受理回执、结果稍后推送或轮询"时，全异步化（CompletableFuture/Servlet 异步上下文）吞吐更高——同步返回是体验约束倒逼的妥协，不是默认形态。',
              ],
            },
          ],
        },
        {
          id: 'be-mq-send-timeout',
          title: '线上案例：RocketMQ 消息发送偶发超时（万分之一），你的排查和兜底思路是什么？',
          difficulty: 'advanced',
          tags: ['RocketMQ', '故障排查', '网络'],
          points: [
            '日志定性：`invokeSync: wait response timeout` + `receive response, but not matched any request`——超时后响应才到达、已找不到对应请求，说明**网络是通的、只是响应慢**，矛头指向 Broker 或传输链路。（来源：中间件核心技术与实战 18）',
            '背景原理：单一长连接并发多请求靠 **requestId + Future Map**——发送前注册 Future，响应带原 requestId 唤醒；超时后 Future 已被移除，迟到响应即 "not matched"。（来源：中间件核心技术与实战 18）',
            '排除法链路：① store.log 的 **PAGECACHERT** 指标——写 PageCache 耗时 <100ms，排除磁盘写入瓶颈；② netstat 看 **Recv-Q/Send-Q**——客户端 Recv-Q 大量积压 = 服务端写网络慢或客户端读慢；③ 客户端加 Netty 读事件统计——一次读事件大多 2 次读就抽干，排除客户端读瓶颈；④ 剩下唯一没监控的环节 = **服务端写网络**。（来源：中间件核心技术与实战 18）',
            '根因与解法：RocketMQ 网络线程参数默认偏小——`serverSelectorThreads`（Netty IO/Selector 线程，默认 3）与 `serverWorkerThreads`（编解码工作线程，默认 8）；48 核机器上调到 16/32 后，超时率降到**十万分之一**。（来源：中间件核心技术与实战 18）',
            '兜底策略（做不到零超时）：Broker 侧 `maxWaitTimeMillsInQueue=1000` 增加快速失败等待；客户端**减小单次超时（如 500ms）+ 增加重试次数**——局域网抖动是瞬时的，快速失败快速重试（RocketMQ 重试自带故障规避、换 Broker 发）；4.3+ 客户端的超时是所有重试的**总预算**，需要自行包装循环重试。（来源：中间件核心技术与实战 18）',
          ],
          followUps: [
            {
              question: '为什么「减小超时 + 加重试」反而降低整体失败率？',
              points: [
                '抖动是瞬时的：500ms 超时让"遇到抖动的请求"尽早释放，走下一次大概率健康的链路；RocketMQ 重试自带故障规避（避开上一次的 Broker）；整体成功率按重试次数乘积放大，且总耗时预算可控。前提是业务**幂等**——重试必然带来重复。',
              ],
            },
            {
              question: 'Recv-Q 积压出现在客户端侧和服务端侧，分别说明什么？',
              points: [
                '客户端 Recv-Q 积压 = 对端（服务端）写得慢、或本端读得慢——响应堆在接收缓冲区；服务端侧积压 = 本端写不动（应用层没及时 read 或下游网络拥塞）。同样的指标，位置不同指向责任链路的不同段——定位网络问题必须先问"积压在哪一端"。',
              ],
            },
            {
              question: '「参数默认值不适配大机器」这类坑，怎么在新集群上线前避免？',
              points: [
                '容量压测按目标吞吐打满验证（不是冒烟）；关键默认参数 review（IO/工作线程数、刷盘策略、超时预算）；监控先于故障铺好——本案里"服务端写网络"恰恰是唯一没监控的环节，排除法才绕了四步才找到它。',
              ],
            },
          ],
        },
        {
          id: 'be-mq-order-throughput',
          title: '顺序消费性能上不去怎么办？从 RocketMQ 的三把锁到「关联顺序性」优化。',
          difficulty: 'advanced',
          tags: ['RocketMQ', '顺序消息', '性能优化'],
          points: [
            '真实案例：订单状态机用顺序消费，64 个队列积压上千万条，消费者扩到 64 台后**无计可施只能等**——顺序消费一旦积压几乎没有补救手段，容量要按峰值提前规划。（来源：中间件核心技术与实战 16）',
            '实现三阶段各有锁：① 队列负载（rebalance 约 20s 一轮）：新分配的队列要先向 **Broker 申请队列锁**成功才能拉取，丢弃旧队列前要拿到 **ProcessQueue 锁**否则不放手（防两边同时消费）；② 拉取：拉到即放 ProcessQueue（TreeMap）并提交消费线程池；③ 消费：申请 **MessageQueue 锁** → 按 offset 从小到大取一批 → 申请 ProcessQueue 锁 → 才调业务监听器。（来源：中间件核心技术与实战 16）',
            '代价：三把锁让**并发度被队列数上限锁死**，单消费者加线程无效——扩吞吐只能扩队列，而队列数受分区规划约束。（来源：中间件核心技术与实战 16）',
            '优化洞察「**关联顺序性**」：余额变更短信场景里，同一账户的变更必须有序、**不同账户之间无需有序**——RocketMQ 内置模型做不到（整队列串行），粒度太粗。（来源：中间件核心技术与实战 16）',
            '改进模型：拉取后按**消息 Key 的 hash 对线程数取模**，投递到 N 个任务队列，每个队列绑定单线程串行消费——同 Key 串行、异 Key 并行，并发度只随线程数增长、与队列数解耦；位点提交仍取处理队列的最小 offset。（来源：中间件核心技术与实战 16）',
          ],
          followUps: [
            {
              question: '三把锁各自防住什么竞态？',
              points: [
                'Broker 队列锁防 rebalance 后新旧消费者同时消费同一队列；ProcessQueue 锁防「丢弃旧队列」时消息还在消费（丢弃必须等锁，保证不丢消息）；消费锁保证单队列内严格单线程按 offset 顺序消费——三者叠加才构成端到端的顺序保证。（来源：中间件核心技术与实战 16）',
              ],
            },
            {
              question: '按 Key hash 到线程的方案，失败重试怎么不破坏顺序？',
              points: [
                '同 Key 的消息（含重试）必须追加到同一线程的任务队列尾部；若重试跨线程，就退化为至少一次 + 幂等兜底。附带收益：某 Key 卡住只阻塞该线程的任务队列，故障按 Key 分治隔离，不扩散到整个消费组。',
              ],
            },
            {
              question: '业务上能识别「关联顺序性」时，为什么它优于盲目加队列？',
              points: [
                '加队列受分区规划与全局重排约束（Key→队列映射变化、扩容迁移代价大）；按 Key 分线程把有序粒度从「队列」细化到「业务键」，并行度与队列数解耦。另有 JMQ 的「空洞入重试队列 + 位移前移」单队列并行消费解法，开销大不作常规——要并发优先扩队列。（来源：极客时间·消息队列高手课 08）',
              ],
            },
          ],
        },
        {
          id: 'be-mq-pulsar',
          title: 'Pulsar 的存算分离架构解决什么问题？Broker 无状态化的代价是什么？',
          difficulty: 'advanced',
          tags: ['Pulsar', '架构设计', '存算分离'],
          points: [
            '传统 MQ 的 Broker 是**有状态节点**：各自存不同数据，故障后只有持有相同数据的副本才能接替，故障转移需要选举 + 同步，慢且复杂。（来源：极客时间·消息队列高手课 27）',
            'Pulsar 的拆法：Broker 不存元数据（ZooKeeper 管）也不存消息（BookKeeper 集群管），变成**纯无状态计算节点**；分区与 Broker 的归属是动态的，LoadBalancer 按负载随时调整，任一 Broker 都能替代故障节点——故障转移秒级。（来源：极客时间·消息队列高手课 27）',
            'BookKeeper 的存储单元 **Ledger ≈ 一段 WAL**（连续若干 Entry）；**单写者设计**：Ledger 只允许创建它的 Broker 写，关闭（含宕机）后永久只读、续写新建 Ledger——用「不共享资源」替代「分布式锁」，巧妙回避了分布式写锁的性能与复杂度。（来源：极客时间·消息队列高手课 27）',
            '代价（"背着抱着一样沉"）：问题没消失只是**转移到 BookKeeper**（一致性、复制、选举照样要做）；一个集群变两个集群、总体复杂度上升；消费读多一跳网络（Broker→BookKeeper）+ 多次内存拷贝，性能有损。（来源：极客时间·消息队列高手课 28）',
            '为什么说它是方向：现代 MQ 本质已是分布式存储系统，MQ（能存不能算）与流计算平台（能算不能存）互补——Kafka 在做 Streams、Pulsar 在做 Functions，都指向「存储 + 计算」的新形态，届时存算分离恰好匹配。（来源：极客时间·消息队列高手课 27）',
          ],
          followUps: [
            {
              question: 'Ledger 的单写者设计为什么等价于「免锁」？',
              points: [
                '同一时刻只有一个写者，就不存在并发写冲突——不需要锁也不需要仲裁，类比单线程写 WAL；宕机后 Ledger 立即关闭（数据已在 BookKeeper 副本中），新 Broker **新开 Ledger** 接管分区——用「关闭旧段、新开新段」代替「恢复写权限」，从设计上消除了争抢。',
              ],
            },
            {
              question: 'Broker 宕机时，它正在写的 Ledger 怎么办？',
              points: [
                'Ledger 关闭即永久只读，已写入的 Entry 靠 BookKeeper 多副本保障不丢；分区所有权转移给新 Broker，后续消息写入新 Ledger——恢复动作只是「元数据变更 + 新开 Ledger」，**没有任何数据搬迁**，这是故障转移能做到秒级的根本原因。',
              ],
            },
            {
              question: '什么业务值得引入 Pulsar？什么场景仍然选 Kafka？',
              points: [
                '海量 topic/多租户、频繁扩缩容、跨地域复制（geo-replication）场景，无状态 Broker 的调度优势明显；吞吐极致、生态（流处理/连接器）优先仍选 Kafka。引入前必须评估「计算 + 存储」双集群的运维成本——架构先进不等于总成本更低。',
              ],
            },
          ],
        },
        {
          id: 'be-mq-blue-green',
          title: '发布不止改服务：消息链路上的蓝绿/灰度怎么做？',
          difficulty: 'intermediate',
          tags: ['消息队列', '蓝绿发布', '灰度'],
          points: [
            '本质：MQ 层的蓝绿 = **消息分类隔离**——蓝消息只被蓝消费者消费；只有微服务层蓝绿不够，「上游生产 → MQ → 下游消费」整条链路必须隔离，否则灰度验证失真。（来源：中间件核心技术与实战 15）',
            '方案一「消息属性」（逻辑隔离）：同一主题，消息带 color 属性；消费端按环境改写消费组名（如 `_BLUE_xxx_consumer_group`）实现组级隔离，消费前解码属性，颜色不匹配直接返回"消费成功"跳过。（来源：中间件核心技术与实战 15）',
            '方案一的两个坑：① 未接入蓝绿的上游发的**无色消息**会被两个环境都跳过 → 丢消息——必须额外约定「无色消息归属」，归属组随蓝绿状态动态切换；② 每个消费组都全量拉取再过滤——读流量放大近 **3 倍**，压服务端。（来源：中间件核心技术与实战 15）',
            '方案二「主题隔离」（物理隔离）：发送端拦截器按系统参数改写 topic 名（如 `_BLUE_topicA`），消息物理上分主题存储；消费组只订阅本环境主题，拉取全是有效流量、无放大。（来源：中间件核心技术与实战 15）',
            '选型与沉淀：主题隔离要防拦截器嵌套改写（topic 名被改两次）、主题数量翻倍运维面变大——适合主题数可控的大链路；属性方案适合轻量灰度/全链路压测的影子流量。通用套路：**生产端拦截器注入标 + 消费端按标过滤/路由 + 元数据（消费组命名）承载环境语义**。（来源：中间件核心技术与实战 15）',
          ],
          followUps: [
            {
              question: '属性方案里「返回消费成功但跳过」，位移照常推进的后果是什么？',
              points: [
                '跳过的消息位移已推进、**不可重放**——如果它其实归属本环境（或无色且归属本环境），等于静默丢消息。所以「消费成功但跳过」必须配合无色消息的归属约定兜底，否则蓝绿切回后消息无法补消费。',
              ],
            },
            {
              question: '蓝绿回切（BLUE → 全量）怎么做才不丢消息？',
              points: [
                '先把无色消息的归属组恢复（关一个默认组、在另一环境开同名组），再摘颜色组，过渡期双组并存——保证任何时刻每条消息都至少有一个组会认领它，先补归属、再撤隔离。',
              ],
            },
            {
              question: '属性过滤 vs 主题隔离：读放大和管理成本怎么权衡？',
              points: [
                '属性方案零主题管理成本，但读放大近 3 倍、依赖每个消费端的过滤纪律（漏一个就丢消息）；主题方案读零放大，但主题翻倍、拦截器链路要防嵌套改写。主题数少且链路核心选主题隔离，轻量灰度/压测影子流量选属性方案。',
              ],
            },
          ],
        },
        {
          id: 'be-mq-kafka-hw-epoch',
          title: 'Kafka 的高水位（HW）机制是怎么推进的？它有什么缺陷，Leader Epoch 又是怎么补救的？',
          difficulty: 'advanced',
          tags: ['Kafka', '高水位', '副本机制', 'Leader Epoch'],
          points: [
            '两个位移先分清：**LEO（Log End Offset）是副本「下一条待写入消息」的位移；高水位 HW 是分区层面界定消息可见性的位移——位移小于 HW 的才是已提交消息，等于 HW 的那条也不可见**。分区 HW = Leader 副本的 HW，任何副本 HW ≤ LEO；事务消息是例外，消费可见性由 LSO（Log Stable Offset）判定，不只看 HW。（来源：极客时间·Kafka 核心技术与实战 27）',
            '推进规则：Leader 每次写入或收到 Follower 的 FETCH，取「**ISR 全体副本 LEO 的最小值**」与当前 HW 取 max 更新；Follower 端把自己的 HW 更新为 min(Leader 发来的 HW, 自己刚更新的 LEO)。Leader 所在 Broker 保存全部远程副本的 LEO，但不保存它们的 HW。',
            '反直觉的关键：**Follower 的 HW 更新天然滞后一轮 FETCH**——本轮拉取写入消息，下一轮 FETCH 才把上一轮的 HW 带回来，Leader 与 Follower 的 HW 更新在时间上错配，这是一系列「数据丢失/数据不一致」问题的根源。',
            '丢失场景（min.insync.replicas=1）：B 已写入消息但 HW 未及更新时宕机 → 重启后按旧 HW **截断日志**删掉该条 → 紧接着 A 宕机、B 被选为新 Leader → A 重启同样截断——这条**已 ack 的消息**在所有副本中被永久抹掉。',
            'Leader Epoch（0.11 引入）补救：缓存〈epoch 单调递增版本号, start offset 该版本首条消息位移〉条目（内存 + checkpoint 持久化）；副本重启后先向 Leader 发特殊请求取其当前 LEO，再结合 Epoch 条目判断**是否需要截断**，不再盲目按 HW 截断——上述场景中 B 发现无更大 Epoch 条目且 Leader LEO 不小于自己，跳过截断，消息保住；0.11 后副本数据不一致类 Bug 明显减少。',
          ],
          followUps: [
            {
              question: '手推一遍「1 Leader + 2 Follower」下一条消息的 HW 推进时序，为什么 HW 更新要多轮 FETCH？',
              points: [
                'Leader 写入后自己的 LEO +1，但 HW 要等 FETCH 请求带回两个 Follower 的 LEO 才能推进到最小值；Follower 拉到消息写入、LEO +1 后，要等**下一轮** FETCH 才能拿到 Leader 更新后的 HW——HW 永远慢一轮。',
                '所以一条消息要在 ISR 全部落地并对消费者可见，至少经历两轮 FETCH 往返——「HW 是最慢同步副本的水位线，且水位线的传递有固有延迟」，这就是它要用 Leader Epoch 兜底的机制原因。',
              ],
            },
            {
              question: 'min.insync.replicas=2 时，上面那个截断连锁丢消息的场景还成立吗？',
              points: [
                '不成立（或退化）：写入需要 ISR ≥ 2 确认，消息要成为已提交必须至少两个副本持有；任一副本带着旧 HW 截断、再怎么切主，已提交消息都不会只剩「唯一载体」被截掉。',
                '把这题答透的方式是把参数组合与机制串起来：min.insync.replicas 抬高的是「已提交的水位线由几个副本共同托底」，Leader Epoch 修的是「截断依据错误」——两层防线缺一不可。（来源：极客时间·Kafka 核心技术与实战 27/11）',
              ],
            },
            {
              question: '为什么社区不干脆改成同步复制或多数派（Quorum），一劳永逸？',
              points: [
                '同步刷盘/多数派确认都会把吞吐打下来——Kafka 用「ISR + HW」在吞吐与一致性之间取折中：正常情况异步复制、近乎攒批吞吐，出问题再靠 Epoch 修截断依据。',
                '对比 Raft 类系统的 commit index：Raft 由 Leader 单点推进提交位、语义清晰；Kafka 的 HW 是多轮 FETCH 收敛出来的「分布式协商水位」，天生有时间错配窗口——这也解释了为什么后来 KRaft 干脆采用 Raft 的方式管理元数据。',
              ],
            },
          ],
        },
        {
          id: 'be-mq-kafka-isr',
          title: 'Kafka 的 ISR 是怎么动态伸缩的？Unclean Leader 选举的开关该怎么定？',
          difficulty: 'intermediate',
          tags: ['Kafka', 'ISR', '高可用', 'CAP'],
          points: [
            'ISR（In-sync Replicas）是与 Leader 保持同步的副本集合，**必然包含 Leader 自己**，极端情况下 ISR 只剩 Leader 一个——它是动态集合，不是配置出来的静态列表。（来源：极客时间·Kafka 核心技术与实战 23）',
            '判定标准是时间不是条数：Broker 端 `replica.lag.time.max.ms`（默认 10 秒）——Follower 落后 Leader 的**时间间隔**不连续超过该值即算同步，哪怕它保存的消息条数明显少；持续慢于 Leader 写入速度、超时即被踢出（收缩），之后追上进度自动加回（扩张）。JMX 指标 `ISRShrink/ISRExpand` 频繁抖动 = 副本反复进出 ISR，要查网络与 Follower 所在 Broker 的负载。（来源：极客时间·Kafka 核心技术与实战 36）',
            '与高水位联动：分区 HW 计算要求副本「在 ISR 中」且 LEO 落后不超过 replica.lag.time.max.ms **两个条件同时成立**——刚追上进度但尚未回到 ISR 的副本不算，防止出现 HW > LEO 的矛盾状态。',
            'Unclean Leader Election：ISR 全挂（含 Leader）时，把「不在 ISR 中的存活副本」选为新 Leader，由 Broker 端 `unclean.leader.election.enable` 控制——开启换可用性、必然可能丢数据；关闭保一致性、分区不可用。课程强烈建议保持 false（新版本默认即 false）。（来源：极客时间·Kafka 核心技术与实战 11）',
          ],
          followUps: [
            {
              question: '为什么 0.9 之后用「落后时间」而不是「落后条数」判定同步？',
              points: [
                '条数阈值在瞬时高峰下会**误杀健康 Follower**：突发流量下正常副本也会短暂落后一大截，按条数判定就把它们踢出 ISR，引发无意义的收缩/扩张抖动。',
                '时间窗口天然容忍突发：「持续落后超过 10 秒」才判定真的跟不上——用时间衡量抗抖动性远好于条数，这也是绝大多数流式系统用 lag time 而不是 lag count 做存活判定的共性。（来源：极客时间·Kafka 核心技术与实战 23）',
              ],
            },
            {
              question: 'ISR 收缩到只剩 Leader 时，acks=all 意味着什么？',
              points: [
                '退化为只等 Leader 自己确认，等价于 acks=1——「all」是「当前 ISR 里的 all」，ISR 缩水保证跟着缩水。',
                '所以 acks=all 必须配合 min.insync.replicas ≥ 2：ISR 副本数小于该值时 Producer 直接抛异常拒绝写入——用「暂时不可写」换「可靠性不缩水」，这正是下一问 unclean 开关的同款取舍。（来源：极客时间·Kafka 核心技术与实战 11）',
              ],
            },
            {
              question: 'unclean.leader.election.enable 开还是关？什么业务敢开？',
              points: [
                '这是 CAP 在 Kafka 参数上的用户自选开关：开启 = 可用性优先（分区尽快恢复服务，但非同步副本当 Leader 会覆盖/丢失数据）；关闭 = 一致性优先（宁可分区不可用）。',
                '判据说出来才算答完：日志/埋点类数据可从上游重推，敢开换可用性；交易/账务类必须关（保持默认 false）——「这条数据丢了能不能补回来」是定开关的唯一标准。（来源：极客时间·Kafka 核心技术与实战 11）',
              ],
            },
          ],
        },
        {
          id: 'be-mq-kafka-controller',
          title: 'Kafka 的 Controller 是怎么选出来的？它宕机了怎么办、怎么防脑裂？',
          difficulty: 'advanced',
          tags: ['Kafka', 'Controller', 'ZooKeeper', '架构'],
          points: [
            '选举是抢占式而非投票式：集群中任意 Broker 启动时尝试在 ZooKeeper 创建 `/controller` **临时节点**，第一个创建成功的 Broker 成为 Controller——任何时刻有且只有一个。（来源：极客时间·Kafka 核心技术与实战 26）',
            '五类职责：① 主题管理（创建/删除/扩分区，kafka-topics 脚本的后台执行者）；② 分区重分配（kafka-reassign-partitions 的执行者）；③ Preferred 领导者选举（均衡 Leader 分布）；④ 集群成员管理（Watch /brokers/ids 子节点变化感知上下线，临时节点随会话消失感知宕机）；⑤ 数据服务（Controller 持有最全的集群元数据，推送给其他 Broker 更新缓存）。',
            '故障转移全自动：Controller 宕机 → ZK 会话结束、/controller 临时节点被删 → 所有存活 Broker 重新抢占 → 新 Controller **从 ZK 重读全量元数据**初始化缓存后恢复工作，无需人工介入。',
            '0.11 重构：旧版多线程（每 Broker 一条专属发送线程 + Watch 回调线程 + 主题删除 IO 线程）并发访问共享元数据缓存、靠大量 ReentrantLock、Bug 丛生；重构为**单事件处理线程 + 事件队列**，缓存只被单线程触碰、不再需要重量级同步；ZK 写入从同步 API 改异步，写入性能提升约 10 倍。',
            '2.2 请求分级：控制类请求（LeaderAndIsr/StopReplica）会令数据类请求（PRODUCE/FETCH）失效，却和普通请求一起排队——Kafka 为两类请求建**两套独立的网络线程池 + IO 线程池 + 不同 listeners 端口**，让控制请求可被立即处理（社区否决了「优先级队列」方案）。',
            '运维信号：JMX `ActiveControllerCount` 正常只能在某一台 Broker 上为 1，发现多台同时为 1 即脑裂，先查网络连通性；主题删不掉、重分区卡住时不必重启 Broker——删掉 /controller 节点触发重选举即可。（来源：极客时间·Kafka 核心技术与实战 26）',
          ],
          followUps: [
            {
              question: '为什么「ZK 临时节点抢占」就够，不需要 Raft 式多数派投票？',
              points: [
                '元数据的真相源始终是 ZooKeeper，抢占只解决「谁来当 Controller」这一件事；新 Controller 从 ZK 重读全量元数据即可无损接管，不需要靠复制日志补齐状态。',
                '对比 Raft/Dledger 用多数派投票 + 日志复制选主：它们的数据和元数据都在自己的日志里，必须靠共识选出「数据最新的那个」；Kafka 把状态外置给了 ZK，选举自然可以退化成抢占。（来源：极客时间·Kafka 核心技术与实战 26）',
              ],
            },
            {
              question: '新 Controller 接管期间，正在进行的分区重分配会怎样？',
              points: [
                '重分配任务作为运维指令持久化在 ZK 中，新 Controller 初始化时重读任务列表继续执行——不会因为 Controller 换人半途而废。',
                '「状态外置 + 重读恢复」是依托 ZK 架构的通用恢复模式：进程可以随便死，只要真相源里的任务队列还在，接管者读一遍就能续上。',
              ],
            },
            {
              question: 'KRaft（KIP-500）去 ZooKeeper 化的方向与代价是什么？',
              points: [
                '方向：Controller 元数据改为自持的 Quorum（Raft 协议）——省掉 ZK 的运维与双重写放大，Controller 切换不再依赖 ZK 会话超时，元数据以日志形式在 Controller 之间复制。',
                '代价：Controller 自身要补齐共识、元数据快照与恢复这一整套原来免费白嫖 ZK 的能力——「外部协调」换成「内置共识」的典型架构演进，面试里能用「ZK 抢占 → KRaft 内置 Raft」讲清这条演进线即可。（来源：极客时间·Kafka 核心技术与实战 26）',
              ],
            },
          ],
        },
        {
          id: 'be-mq-kafka-request-purgatory',
          title: '一个 PRODUCE 请求到达 Kafka Broker 后是怎么被处理的？Purgatory 是干什么的？',
          difficulty: 'intermediate',
          tags: ['Kafka', '请求处理', 'Reactor', 'Purgatory'],
          points: [
            'Kafka 自定义二进制请求协议（2.3 版本已定义 45 种：PRODUCE/FETCH/METADATA/LeaderAndIsr/StopReplica……），全部走 TCP——Broker 端是一套 Reactor 架构的多线程模型。（来源：极客时间·Kafka 核心技术与实战 24）',
            '线程模型四层：每 Broker 1 个 **Acceptor 线程**（只做分发，轮询公平派发）→ **网络线程池**（num.network.threads，默认 3，收发与解析）→ **共享请求队列** → **IO 线程池**（num.io.threads，默认 8，真正执行 PRODUCE 写日志 / FETCH 读页缓存）；请求队列共享，但每个网络线程有**专属响应队列**——分发线程不管回包。',
            'Purgatory（炼狱）缓存**延时请求**：一时不能满足条件、不能立刻完成的请求。典型两类：acks=all 的 PRODUCE 要等 ISR 副本全部拉取后才能回；FETCH 暂无新数据时被 hold 住等消息到达（类似长轮询）。条件满足后 IO 线程继续处理，把响应放回对应网络线程的响应队列。',
            '控制类/数据类请求分离：LeaderAndIsr 到达时，积压的 acks=all PRODUCE 只能在 Purgatory 里耗到超时；若控制请求优先处理，Broker 立刻抛 NOT_LEADER_FOR_PARTITION 让客户端快速失败——实现是**复制一套完整组件**（两套线程池 + 独立端口/listeners），而不是做优先级队列。',
            '调优落点：监控 NetworkProcessorAvgIdlePercent 与 RequestHandlerAvgIdlePercent，长期低于 30% 就要加线程或分流。（来源：极客时间·Kafka 核心技术与实战 24/36）',
          ],
          followUps: [
            {
              question: '对照 Reactor 模型，Kafka 各组件怎么对应？为什么 IO 线程不直接做网络读写？',
              points: [
                'Acceptor = 主 Reactor/分发器；网络线程池 = 从 Reactor/工作线程池（对应 Doug Lea 模型的 multiple Reactors）；IO 线程池 = 业务处理器——与 Redis 的单 Reactor 单线程、Netty 的主从 Reactor 多线程放在一起定位更清晰。',
                '网络与磁盘的慢是两种慢：网络线程等 socket 时，IO 线程可以继续处理别的请求——「收发解析」与「磁盘读写」分池，让慢网络不拖累慢磁盘、互不阻塞。',
              ],
            },
            {
              question: 'acks=all 的请求在 Purgatory 里等待期间 Leader 换人了，会怎样？',
              points: [
                '没有请求分级时：控制请求排在积压数据请求后面，等 acks=all 请求在 Purgatory 里耗到超时才被处理，客户端超时重试——一场切主要拖一个超时周期。',
                '2.2 分级后：控制请求走独立线程池立即处理，Broker 主动返回 NOT_LEADER_FOR_PARTITION，客户端**快速失败、立刻重试到新 Leader**——同样的故障，端到端延迟差一个数量级。（来源：极客时间·Kafka 核心技术与实战 24）',
              ],
            },
            {
              question: '为什么社区拒绝「优先级队列」方案，宁可复制一整套组件？',
              points: [
                '队列满时高优先级请求照样进不来——优先级形同虚设，饿死问题在共享队列模型里无解。',
                '整组件复制的代价是资源（多一套线程池与端口）与复杂度，但换来硬隔离：控制面和数据面的延迟互不影响——基础设施里「复制隔离」比「共享 + 优先级」更可控，这与「控制面/数据面分离」的通用架构直觉一致。（来源：极客时间·Kafka 核心技术与实战 24）',
              ],
            },
          ],
        },
        {
          id: 'be-mq-kafka-rebalance',
          title: 'Kafka 消费者组重平衡的完整流程是怎样的？为什么说它是一次 STW、还这么慢？',
          difficulty: 'advanced',
          tags: ['Kafka', '消费者组', '重平衡', 'Coordinator'],
          points: [
            '三个触发条件：组成员数变化（占绝大多数）、订阅主题数变化（正则订阅匹配到新主题）、订阅主题分区数增加；组每次启动必然触发一轮。（来源：极客时间·Kafka 核心技术与实战 25）',
            'Coordinator 是 Broker 端组件（每个 Broker 都有），定位算法两步：`partitionId = abs(groupId.hashCode() % 50)`（位移主题默认 50 分区）→ 该分区 Leader 副本所在的 Broker 即 Coordinator。知道算法的实际意义：排查时能直接定位承载该消费组的 Broker 日志。',
            '两阶段：**JoinGroup**——全员上报订阅信息，Coordinator 选一个成员当 Leader Consumer（通常是第一个发请求的；注意与「Leader 副本」无关），由它**制定分区分配方案**；**SyncGroup**——Leader 把方案上交，Coordinator 统一下发全体成员。分配逻辑在消费者端而非服务端执行。',
            '通知机制：Coordinator 决定重平衡后，把 REBALANCE_IN_PROGRESS 封装进**心跳响应**下发；心跳线程是 0.10.1.0 从主线程剥离的独立线程，heartbeat.interval.ms 的真实用途是控制重平衡通知的及时性。组状态机五态：Empty/Dead/PreparingRebalance/CompletingRebalance/Stable；组回到 Empty 且停超 7 天，其过期位移会被定期删除（日志常见 "Removed … expired offsets"）。',
            '为什么是 STW：重平衡期间**所有成员停止消费**等待新方案，如同 GC 的 stop-the-world；为什么慢：全量参与且默认不保留旧分配方案（无局部性），几百成员的组重平衡一次要几小时的案例都存在——0.11 的 StickyAssignor 只是缓解（尽量保留旧分配），早期 Bug 多。',
            'Broker 端四个场景：新成员入组（心跳响应强制触发全员重平衡）、主动离组（LeaveGroup 请求）、崩溃离组（等 session.timeout.ms 才感知）、重平衡前要求成员先快速上报位移再走 JoinGroup。（来源：极客时间·Kafka 核心技术与实战 25）',
          ],
          followUps: [
            {
              question: '分配方案为什么放在消费者端（Leader Consumer）算，而不是 Coordinator 算？',
              points: [
                '把分配策略的演进与 Broker 版本解耦：Range/RoundRobin/Sticky 全是客户端逻辑，升级客户端就能换策略，Broker 不用动——策略的数据面与协调的控制面分离。',
                'Coordinator 只做「收集订阅 + 收发方案」的信使，不理解分配语义——这样新分配策略可以随客户端独立灰度，老 Broker 集群照样服务。',
              ],
            },
            {
              question: '组内成员数超过分区数会怎样？Coordinator 所在的 Broker 挂了呢？',
              points: [
                '多出的实例分不到任何分区、空转——消费端并行度上限 = 分区数，扩实例前先看分区数是否够（对照堆积题「Consumer 实例数 ≤ 分区数」）。',
                'Coordinator 所在 Broker 挂了：位移主题对应分区的 Leader 迁移到别的 Broker，消费组重新 FindCoordinator 定位到新 Broker 即可，位移不丢——协调者本身也是无状态可迁移的。（来源：极客时间·Kafka 核心技术与实战 15）',
              ],
            },
            {
              question: '增量协作式重平衡（CooperativeStickyAssignor，2.4+）为什么是演进方向、又难在哪？',
              points: [
                '它允许「未受影响的分区在重平衡期间继续消费」，把全量 STW 变成局部调整——治理重平衡风暴的根治方向（对照 be-mq-kafka-rebalance-storm 的参数止血）。',
                '难在语义复杂：一轮重平衡变成两轮（先撤销受影响的分区、再分配新方案），消费者代码要正确处理 REVOKED/CURRENT 状态，新旧assignor混部时行为容易出错——性能收益对得上复杂度，才值得上。（来源：极客时间·Kafka 核心技术与实战 17）',
              ],
            },
          ],
        },
        {
          id: 'be-mq-kafka-rebalance-storm',
          title: '线上 Kafka 消费者组频繁重平衡（重平衡风暴），你会怎么排查和治理？',
          difficulty: 'intermediate',
          tags: ['Kafka', '重平衡', '故障排查', '参数调优'],
          points: [
            '先定治理目标：计划内的增减成员无法避免，要消灭的是「不必要重平衡」——绝大多数是被 Coordinator **误判死亡**或**消费超时**引发的；消费者组 join rate/sync rate 指标持续偏高就是重平衡频繁的监控印证。（来源：极客时间·Kafka 核心技术与实战 17/19/25）',
            '第一类·心跳不及时被踢：配方 `session.timeout.ms=6s`（课程推荐，默认 10s，越小越快揪出僵尸成员）+ `heartbeat.interval.ms=2s`，并保证 **session.timeout.ms ≥ 3 × heartbeat.interval.ms**——被判死前至少发出 3 轮心跳。',
            '第二类·消费太慢主动离组：max.poll.interval.ms（默认 5 分钟）内没处理完 poll 返回的一批，消费者主动离组。定量配方：单条处理最长 2s × max.poll.records 500 = 一批要 1000s，要么把 max.poll.interval.ms 调到 1000s 以上，要么把 max.poll.records 降到 150。四板斧按优先级：**缩短单条处理耗时 > 调大 max.poll.interval.ms > 调小 max.poll.records > 多线程加速消费**（最难，位移提交易错）。（来源：极客时间·Kafka 核心技术与实战 19）',
            '参数设计演进要能讲：0.10.1.0 之前「消费超时」与「存活判活」共用 session.timeout.ms，两者诉求天然冲突（判活要短、消费要长）；引入 max.poll.interval.ms 把「消费能力」从「存活性」中剥离——一个参数拆成两个各管各的。',
            '参数都对还在重平衡就去查 GC：频繁 Full GC 的长停顿会让心跳线程/主线程停摆，翻 kafkaServer-gc.log。另有冷门坑：Standalone Consumer 与消费者组撞了相同 group.id，提交位移必抛 CommitFailedException 且四板斧全部无效——多团队共用集群时按规范规划 group.id。（来源：极客时间·Kafka 核心技术与实战 19）',
          ],
          followUps: [
            {
              question: '为什么说「调大 session.timeout.ms」是双刃剑？',
              points: [
                '调大确实减少误判，但真宕机后接管时间等比例变长，消费中断窗口扩大——用「误杀率」换「恢复时间」。',
                '正解是让两个超时各管一件事：session.timeout.ms 保持小、只管「存活性」；消费慢交给 max.poll.interval.ms 承接，不要放大 session 来兜消费的底。（来源：极客时间·Kafka 核心技术与实战 17）',
              ],
            },
            {
              question: '把 max.poll.records 调小有什么副作用？',
              points: [
                '单次 poll 的批变小：消费吞吐下降、网络往返变多——这是「重平衡风险」与「消费吞吐」的折中，不是免费的。',
                '正确方向仍是缩短单条处理耗时或提高消费并行度，调参只是止血——治理重平衡的优先级永远是「改代码 > 改参数」。（来源：极客时间·Kafka 核心技术与实战 19）',
              ],
            },
            {
              question: 'Static Membership（group.instance.id）为什么能从根上减少重平衡？代价是什么？',
              points: [
                '重启后 Broker 认识老实例 ID（group.instance.id），不触发重分配——滚动发布、优雅重启不再引发全员 STW，这是参数止血做不到的根治。',
                '代价是故障接管变慢：Broker 要等 session.timeout.ms 才确认「真死了」并转移分区——用「恢复时间」换「发布期稳定」，适合实例数多、拓扑稳定的消费组。（来源：极客时间·Kafka 核心技术与实战 17）',
              ],
            },
          ],
        },
        {
          id: 'be-mq-kafka-offsets-topic',
          title: 'Kafka 的位移主题 __consumer_offsets 是怎么工作的？位移为什么要放在 Kafka 自己身上？',
          difficulty: 'intermediate',
          tags: ['Kafka', '位移主题', '消费者组', 'Compact'],
          points: [
            '演进动机：老版本 Consumer 把位移存 ZooKeeper——ZK 是协调框架、**不适合高频写**，位移提交恰恰是高频写操作，会拖垮 ZK；0.8.2.x 起改为存 Kafka 内部主题，Kafka 天然满足高持久 + 高频写——「用自己存储自己，自己吃自己的狗粮」。（来源：极客时间·Kafka 核心技术与实战 16）',
            '本质：位移主题就是普通 Kafka 主题（可创建/修改/删除），但消息格式由 Kafka 定义、**用户不可写入**——自己写 Producer 乱写会导致 Broker 解析失败崩溃。Key 是三元组〈Group ID, 主题名, 分区号〉，Value 为位移值 + 元数据；另有注册组用的消息与 **tombstone 墓碑消息**（Value 为 null，组全员停止且位移删除后写入以彻底清除组）。',
            '自动创建与规格：集群第一个 Consumer 启动时自动创建；分区数 offsets.topic.num.partitions 默认 50、副本数 offsets.topic.replication.factor 默认 3——不建议手动建（有源码硬编码 50 的历史坑）。（来源：极客时间·Kafka 核心技术与实战 16）',
            '清理策略必须用 **Compact（压实）**：自动提交下即使没有新消息也会不停写入相同位移（如永远 100），按时间 retention 删除毫无意义，只能「同 Key 只留最新一条」，由后台 Log Cleaner 线程巡检执行。位移主题无限膨胀的常见根因就是 **Log Cleaner 线程静默挂掉**——排查手段：jstack 找 kafka-log-cleaner-thread。（来源：极客时间·Kafka 核心技术与实战 16/36）',
            '位移提交的两条路径——自动（enable.auto.commit=true，默认 5s 一次）与手动（commitSync/commitAsync）——最终都是**向位移主题写消息**；提交语义的正确性（先消费后提交）由用户负责，完整链路见 be-mq-no-loss。（来源：极客时间·Kafka 核心技术与实战 18）',
          ],
          followUps: [
            {
              question: 'Compact 和 Compression 是一回事吗？为什么位移主题适合 Compact？',
              points: [
                '术语辨析本身就是考点：压实（compact）= 按 Key 只保留每个 Key 的最新值，是**日志清理策略**；压缩（compress）= 编码层减小体积，两者正交可叠加。',
                '位移主题同 Key 反复覆盖写（组 × 主题 × 分区三元组固定），且要随时能读到每个组的最新位移——天然匹配「保留最新值」语义；按时间 retention 反而可能把最新位移连同历史一起删掉。（来源：极客时间·Kafka 核心技术与实战 16）',
              ],
            },
            {
              question: '位移主题分区数为什么默认 50、为什么不能随便改？',
              points: [
                '它要承载「组数量 × 每组写入频率」的并行度，50 是社区权衡后的默认；组定位算法按 groupId 对这个分区数**取模**——改了它，存量组与 Coordinator 的映射全部重新洗牌。',
                '内部主题的参数同样是生产约定：改 offsets.topic.num.partitions 只影响新建分区，存量分区不动，结果是不对称布局——要动就趁集群初始化时定好。（来源：极客时间·Kafka 核心技术与实战 16）',
              ],
            },
            {
              question: '内部元数据放「Kafka 自家主题」vs 放外部 ZK，各牺牲了什么？',
              points: [
                '内部主题的代价：自举依赖（恢复消费进度本身要先能消费位移主题）+ Compact/Log Cleaner 的运维心智；ZK 的代价：高频写瓶颈 + 双系统运维 + 客户端不得直连的约定。',
                'Kafka 选前者——把存储问题留给自己最擅长的日志结构，代价是「吃自己的狗粮」；这条路线后来走到 KRaft：连集群元数据也全部搬进 Kafka 式日志——两条演进线在面试里可以串成一句话。（来源：极客时间·Kafka 核心技术与实战 16/26）',
              ],
            },
          ],
        },
        {
          id: 'be-mq-kafka-idempotent-tx',
          title: 'Kafka 的幂等生产者和事务生产者是一回事吗？各自解决什么问题？',
          difficulty: 'advanced',
          tags: ['Kafka', '幂等', '事务', '消息语义'],
          points: [
            '先摆交付语义三档：at most once（禁重试即可实现，宁丢不重）/ at least once（默认——消息已写入但 ack 在网络抖动中丢失时，Producer 无法区分「没写到」还是「写到没收到」，唯一安全动作是重试，必然可能重复）/ exactly once。（来源：极客时间·Kafka 核心技术与实战 14）',
            '幂等生产者（0.11+）：enable.idempotence=true 一键开启，Broker 端多存字段（业界共识为 PID + 分区内序列号）识别重复并静默丢弃，重试从此安全。**范围限制是考点：只保证单分区、单会话**——跨分区无能为力，Producer 进程重启（新会话）保证即失效。（来源：极客时间·Kafka 核心技术与实战 14）',
            '事务生产者：补齐跨分区、跨会话。配置 enable.idempotence=true + `transactional.id`（有意义的名字）；API 四步 initTransactions / beginTransaction / send / commitTransaction，异常走 abortTransaction——保证多条消息**原子地**写入多个分区，且进程重启后依然保证。（来源：极客时间·Kafka 核心技术与实战 14）',
            '消费端配合：isolation.level = read_uncommitted（默认，什么都可见）/ read_committed（只见事务成功提交的消息 + 非事务消息）。注意：事务 abort 后消息**仍写入了底层日志**，只是靠控制消息与 LSO 对 read_committed 消费者隐藏——「精确一次」是消费可见性层面的。（来源：极客时间·Kafka 核心技术与实战 14）',
            '定位：Kafka 事务 ≈ 数据库 read committed（保证无脏读脏写），主要服务 read-process-write 的流处理链路（Kafka Streams）；性能开销大于幂等生产者，普通业务消息不要无脑开启。（来源：极客时间·Kafka 核心技术与实战 14）',
          ],
          followUps: [
            {
              question: '为什么幂等只能在单分区单会话内防重，事务加一个 transactional.id 就能跨会话？',
              points: [
                '幂等的 PID 在每次会话重启后都会变，Broker 无法把新旧会话关联起来——跨会话重复在幂等机制里是「两个陌生人」各写各的。',
                'transactional.id 是用户显式指定的稳定标识：新会话 initTransactions 时，Broker 用它找回旧 PID 并 **fencing 掉旧会话**——「稳定身份 + 隔离旧身份」是跨会话精确一次的机制基础。（来源：极客时间·Kafka 核心技术与实战 14）',
              ],
            },
            {
              question: 'Kafka 事务保证的「原子写 Kafka」，和「本地事务与发消息的原子性」是同一个问题吗？',
              points: [
                '不是：Kafka 事务管不了「DB 写入 + 发消息」跨系统的原子性——那是 RocketMQ 事务消息/本地消息表要解决的问题（见 be-mq-delay-tx），两者的「原子」一个在流处理链路内、一个在上游业务与投递之间。',
                '把「流处理链路内的 EOS」与「跨系统最终一致」分清，才不会在面试里把 Kafka 事务答成事务消息——这是两套为不同问题设计的机制。（来源：极客时间·Kafka 核心技术与实战 14）',
              ],
            },
            {
              question: '什么场景值得上事务生产者？普通业务该怎么选？',
              points: [
                '真需求：Kafka Streams 的「状态变更与输出同事务」（read-process-write 链路内 EOS）——事务为此而生。',
                '普通业务消息用幂等生产者 + 消费端幂等通常已够：跨系统本来就做不到传输层精确一次（见 be-mq-idempotent），事务的吞吐代价要先压测再决定开不开——「为用不上的保证付费」是反模式。（来源：极客时间·Kafka 核心技术与实战 14）',
              ],
            },
          ],
        },
        {
          id: 'be-mq-kafka-tuning',
          title: '给你一个 Kafka 集群做性能调优，从哪几层下手？吞吐和延时的参数方向为什么常常相反？',
          difficulty: 'advanced',
          tags: ['Kafka', '性能调优', 'JVM', '容量规划'],
          points: [
            '优化漏斗（效果自上而下衰减）：**应用层代码 > 框架层参数 > JVM 层 > 操作系统层**——先改使用姿势，再动内核与虚拟机参数。（来源：极客时间·Kafka 核心技术与实战 38）',
            'OS 层：文件系统 XFS（优于 ext4）+ 挂载 noatime；**swappiness 设 1 而不是 0**——留一丝 swap 避免内存耗尽时 OOM Killer 无预警杀进程，且性能劣化可观测；ulimit -n 调大（Too many open files）；vm.max_map_count=655360（主题多时防 OutOfMemoryError: Map failed）；**页缓存 ≥ 一个日志段大小（log.segment.bytes 默认 1GB）**，保证消费命中页缓存。（来源：极客时间·Kafka 核心技术与实战 38/06）',
            'JVM 层：Broker 堆 **6-8GB 就够**（堆只放 ByteBuffer 等瞬时对象，大内存诉求在页缓存，16GB 堆的 GC 反而是灾难）、G1（0.9 起默认；Full GC 单线程极慢必须避免，-XX:+PrintAdaptiveSizePolicy 查元凶；消息体大时防 humongous allocation 调 G1HeapRegionSize）。（来源：极客时间·Kafka 核心技术与实战 38/36）',
            '应用层三法则：Producer/Consumer 实例复用（构造开销大）、用完关闭防资源泄漏、**Producer 线程安全可多线程共享而 Consumer 不行**——客户端侧最常见的三类低级错误。（来源：极客时间·Kafka 核心技术与实战 20/38）',
            '吞吐与延时方向相反的参数表：吞吐——batch.size 调大（默认 16KB 太小）+ linger.ms 攒批 + LZ4/zstd 压缩 + **num.replica.fetchers 加大**（acks=all 的首要瓶颈是副本同步速度）+ 不设 acks=all 不开重试；延时——linger.ms=0、不压缩、fetch.min.bytes=1，同样加大 num.replica.fetchers。（来源：极客时间·Kafka 核心技术与实战 38/08）',
            '版本一致性也是调优：客户端与 Broker 版本不一致会触发消息格式转换——既重压缩又丢零拷贝；1.1+ 参数分 read-only/per-broker/cluster-wide 三档，突发流量时 num.io.threads/num.network.threads 可在线调大，无需重启 Broker。（来源：极客时间·Kafka 核心技术与实战 29/38）',
          ],
          followUps: [
            {
              question: '为什么「页缓存大」比「堆大」对 Kafka 更重要？',
              points: [
                'Broker 的主要内存诉求是页缓存不是堆：堆里只放 ByteBuffer 等瞬时对象，消费读热数据全靠页缓存命中——页缓存 ≥ 活跃日志段（1GB）消费者几乎不读盘。',
                '堆调大反而有害：G1 要维护更大的堆、Full GC 更疼；「内存先喂页缓存，堆 6-8GB 够用」是 Kafka 与多数 Java 服务相反的容量观——呼应 be-mq-kafka-throughput 的页缓存设计但落点在容量分配。',
              ],
            },
            {
              question: 'swappiness=0 和 =1 的真实差别是什么？',
              points: [
                '0 在很多内核版本意味着「完全禁 swap」：内存耗尽时 OOM Killer 直接无预警杀掉 Broker——进程消失比变慢可怕得多。',
                '设 1 留一丝交换空间：极端时有可观测的性能劣化作为预警，运维有介入窗口——「要劣化、不要消失」的基础设施运维哲学。（来源：极客时间·Kafka 核心技术与实战 38）',
              ],
            },
            {
              question: '「攒批」这笔延迟换吞吐的账，定量怎么算？',
              points: [
                '典型数字：等 8ms 攒 1000 条——单条延时 2ms→10ms（×5），TPS 500→10 万（×200）。消息在客户端内存缓冲攒批是纳秒级、网络发送是毫秒级，「等一小会儿」就能攒出数量级吞吐。',
                '反过来延时敏感链路要把账倒着算：linger.ms=0 + 不压缩 + fetch.min.bytes=1，用吞吐换响应——先问业务要哪一个，再选参数方向，这组参数天然互斥不是调优失误。（来源：极客时间·Kafka 核心技术与实战 38/08）',
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'be-distributed',
      name: '分布式系统',
      description: 'CAP、一致性哈希、分布式事务与共识——中高级后端的分水岭主题。限流/熔断等稳定性主题在多个方向出现，本领域的分工：**分布式算法与机制**（限流算法、一致性、选主）；Redis 具体实现见 Redis 领域，系统设计整题见系统设计方向，发布保障见高可用领域。',
      references: [
        { label: 'MIT 6.824: Distributed Systems 课程', url: 'https://pdos.csail.mit.edu/6.824/' },
        { label: 'The Google File System 论文', url: 'https://research.google/pubs/the-google-file-system/' },
      ],
      questions: [
        {
          id: 'be-distributed-cap',
          title: 'CAP 定理到底在说什么？常见的误读有哪些？',
          difficulty: 'intermediate',
          tags: ['CAP', '一致性'],
          points: [
            '正确表述：网络**分区**发生时，系统只能在**一致性 C（线性一致）**与**可用性 A（每个请求都得到响应）**之间二选一；无分区时（P 不发生）可以同时兼顾 C 和 A。C、A 都是**狭义定义**：C 特指线性一致性，不是"数据最终一致"。',
            '误读一：**"三选二"像菜单点菜**——P 是网络现实不是选项，真正的决策只在分区发生的那一瞬间；误读二：把 C 理解成"数据一致性的任意含义"，于是得出"我的系统是 CA 的"——不存在的；误读三：CAP 是**逐请求、逐操作的局部属性**，同一系统不同接口可以不同选择。',            '工程落点：**注册中心选 AP**（Eureka/Nacos AP 模式：分区时宁可返回旧服务列表也不能全体瘫）；**配置/选主类选 CP**（ZooKeeper/etcd：宁可不可用也不能给出两个 master）；**支付扣款用强一致存储**；**商品详情/评论用最终一致**——同一公司内到处都是 CAP 的不同落点。',
            '延伸：**BASE**（基本可用、软状态、最终一致）是 AP 路线的工程方法论；**PACELC** 补充了"无分区时 Latency 与 Consistency 的取舍"，比 CAP 更贴近工程（强一致必然多一次同步往返）。',
          ],
          followUps: [
            {
              question: '为什么说"最终一致"不满足 CAP 的 C？它到底保证了什么？',
              points: [
                '线性一致的 C 要求读永远看到"最新已提交值"，最终一致只承诺"停止写入后，经过收敛时间，副本趋于一致"——收敛窗口内读到的可能是旧值。',
                '它保证的是**收敛性 + 单调性工程约束**（如读己之写、单调读——通过会话粘滞实现），是性能与可用性换来的可用语义；设计时要明确"哪些读必须强一致，哪些可以最终一致"，而不是笼统接受。',
              ],
            },
          ],
        },
        {
          id: 'be-distributed-consistent-hash',
          title: '一致性哈希解决了什么问题？虚拟节点的作用是什么？',
          difficulty: 'basic',
          tags: ['一致性哈希', '分片'],
          points: [
            '普通取模（hash % N）的问题：**节点数变化时几乎所有 key 的映射都变**（N→N+1 全量失效）——缓存集群扩容瞬间全部 miss 打穿数据库。',
            '一致性哈希：把哈希空间组织成**环（0 ~ 2^32-1）**，节点与 key 都哈希到环上，key 顺时针找**第一个节点**。增删节点只影响**相邻区间的数据**（平均 1/N），其余不动——扩容只迁移一小部分。',
            '**虚拟节点**：物理节点少或数据倾斜时，环上分布不均（热点集中在某节点）。每个物理节点映射成上百个虚拟节点打散，**既平衡负载，也让异构机器可按容量分配虚拟节点数**；节点下线时其负载也均匀散给多个节点而非全部压给下一个。',
            '应用：Redis 客户端分片（历史方案）、分布式缓存（Memcached ketama）、负载均衡（粘性会话）、CDN；现代系统多改用**有界负载一致性哈希 / slot 映射表**（Redis Cluster 的 16384 slot 是"查表式"的进一步演化——把映射显式化，迁移粒度可控）。',
          ],
          followUps: [
            {
              question: '一致性哈希在节点故障时数据就"丢"了吗？怎么和副本结合？',
              points: [
                '纯一致性哈希只是**路由算法**，不提供冗余：节点下线它名下的数据就没了——所以工程实现都是"顺时针取 N 个节点存副本"（如 ketama + 复制），或配合底层存储的主从复制。',
                'Redis Cluster 干脆放弃环哈希改用 slot 表 + 每个 slot 一主多从——**路由与复制正交**，一致性哈希负责"扩缩容迁移少"，副本机制负责"高可用"，两者组合才是完整方案。',
              ],
            },
            {
              question: 'Dynamo 为什么在一致性哈希上再引入虚拟节点（vnode）？',
              points: [
                '**三个原始动机**：① 新节点加入时**从很多现有节点各收若干 vnode**（而非只压给环上邻居一段）；② 节点重建时**多节点参与供数**，而非固定副本集扛全量恢复流量；③ **异构机器按能力配 vnode 数**（大机器多配几个）。（来源：Grokking Advanced System Design · Dynamo）',
                '**vnode 的布局约束**：环上随机分布且**相邻 vnode 不在同一物理机**——副本天然分散；对照单 token 方案的三宗罪：增删节点要重算全网 token、单段大范围易热点、重建压垮固定副本。',
                '**边界**：Merkle 树反熵在 vnode 下有代价——节点加入/离开导致 key range 重划 → **树整体重算**（Cassandra 干脆把 repair 做成手动运维动作）——反熵不是免费的，与一致性哈希的动态性冲突。',
              ],
            },
          ],
        },
        {
          id: 'be-distributed-id',
          title: '分布式 ID 有哪些生成方案？雪花算法的时钟回拨怎么解决？',
          difficulty: 'intermediate',
          tags: ['分布式 ID', '雪花算法'],
          points: [
            '需求：全局唯一、趋势递增（利于 InnoDB 主键顺序写与索引友好）、高可用低延迟、不暴露业务量。方案对比：**UUID**（无序、36 字符太长、索引差——仅日志类可用）；**数据库自增/号段模式**（DB 批量发号段到内存，双 buffer 预加载，简单高可用 Leaf-segment；但 ID 泄露业务量、依赖 DB）；**Redis INCR**（性能好，持久化与可靠性依赖 Redis）；**雪花算法**（本地生成，性能最好，主流默认）。',
            '**雪花结构**：1 位符号 + 41 位毫秒时间戳（69 年）+ 10 位机器 ID（1024 节点）+ 12 位序列号（单机单毫秒 4096 个）。特点：时间有序、去中心化、QPS 极高；弱点全部围绕**时钟与机器 ID 分配**。',
            '**时钟回拨**问题：NTP 校准导致时间倒退，重复时间戳 → ID 重复。解法：回拨小于阈值**自旋等待**追平；回拨过大**拒绝服务/报错**（保守正确）；或用**逻辑时钟**（取历史最大时间戳，回拨时沿用旧值继续发号——美团 Leaf-snowflake 的方案，配合 ZooKeeper 注册机器 ID + 启动时校验）。',
            '机器 ID 分配：写死配置易冲突，用 ZK/etcd 顺序节点分配、DB 表分配、或 K8s StatefulSet 序号；**容器弹性扩缩容让"机器 ID 唯一性"成为运维问题**——这是很多团队改用号段/Leaf 的原因。',
          ],
          followUps: [
            {
              question: '为什么 ID 要"趋势递增"而不是"严格递增"？分库分表下怎么办？',
              points: [
                '趋势递增满足 InnoDB 主键顺序插入的性能诉求；严格全局递增需要中心化协调（性能/可用性代价），一般不值。',
                '分库分表下雪花 ID 天然全局唯一无需中心；但注意**按 ID 范围分片会数据倾斜到最新分片**——分片键仍按业务键（user_id）选，ID 只当主键用。',
              ],
            },
          ],
        },
        {
          id: 'be-distributed-newsql',
          title: 'TiDB/OceanBase 这类分布式数据库的架构是什么？什么时候真的需要上？',
          difficulty: 'advanced',
          tags: ['分布式数据库', 'TiDB', 'OceanBase', 'HTAP'],
          points: [
            '**一句话定位**：NewSQL = 保留 SQL 与事务的易用性 + 内置分布式扩展与高可用——**应用层不用再自己分库分表、处理跨片查询和迁移扩容**，代价是单点性能低于精调的单机 MySQL（每层网络跳转与分布式共识的延迟税）。典型三层（以 TiDB 为例）：**无状态 SQL 层（解析/优化）+ 存储层 TiKV（Raft 多副本 + RocksDB）+ 调度层 PD（Region 分裂调度、全局时钟 TSO）**。',
            '**HTAP 的两条路线（对比题眼）**：**TiDB = 物理隔离**——TiKV 行存（OLTP）+ **TiFlash 列存副本**（OLAP，Raft learner 异步同步），分析流量走列存节点互不干扰，代价是双份存储与同步延迟；**OceanBase 4.x = 逻辑隔离（行列混存）**——同一集群内行存/列存一体化，资源占用更省但隔离靠资源管控实现。能说出"物理隔离 vs 逻辑隔离"这对术语，说明真研究过两家架构。',
            '**共识与事务的实现差异**：TiDB 用 **Raft**（多数派复制，Region 为单位分裂迁移，与 Raft 题衔接）；OceanBase 用 **Multi-Paxos** + **全局时间戳（GTS）**做分布式事务串行化；TiDB 事务走 **Percolator 模型**（两阶段提交：主锁 + 从锁，基于 PD 的 TSO 定序，冲突检测在客户端侧）——面试常追问"Percolator 的锁在哪、挂了怎么办"（主锁存活协调提交，锁内嵌在数据的 CF 里，靠超时回滚）。**外部一致性**都是 TSO/全局时钟给的"伪线性一致"（单点授时服务是可用性关键点）。',
            '**存算分离的演进方向**：经典架构仍是 Share-Nothing（数据与副本绑节点，本地盘高性能）；云原生方向是**存算分离**（计算无状态化 + 数据落共享存储/S3，TiFlash 已支持 S3 存算分离部署，Aurora/PolarDB 是这条路线的代表）——换**弹性伸缩与成本**（存算独立扩、对象存储便宜），付网络延迟的税；两条路线按负载形态选，不是新必胜旧。',
            '**什么时候真的需要它（判断力得分点）**：信号清单——数据量单机放不下**且持续增长**（TB→PB 级）、分库分表的**跨片查询与扩容迁移已经痛不可忍**、需要**实时分析 TP 数据**（HTAP 免一条同步链路）；**不该上**：单机 MySQL + 读写分离 + 合理归档能撑的场景（引入分布式数据库 = 引入运维复杂度与延迟税）、强依赖 MySQL 某些行为/插件、团队没有对应运维能力——"能不分片就别分片，能单机就别分布式"与分库分表题的克制结论一脉相承。',
          ],
          followUps: [
            {
              question: '分布式数据库的写入延迟为什么比单机 MySQL 高？这个延迟差在业务上怎么消化？',
              points: [
                '延迟账本：跨 Region 的 Raft 多数派写（1~2 次网络 RTT）+ TSO 取时间戳（一次 RTT）+ 两阶段提交的协调（再 1~2 次 RTT）——**每笔事务 3~5 次跨机往返是结构性成本**；单机 MySQL 的提交是本地 redo + binlog 组提交。所以 P99 延迟分布式普遍高几毫秒，跨机房部署再翻倍。',
                '消化手段：**就近部署共识组与 TSO**（主副本与多数派在同 AZ）、大批量写入摊薄 RTT（batch commit）、把强一致需求与最终一致需求分层（统计类读走 follower/快照读不锁不授时）；业务侧接受"TP 强一致事务 + 延迟敏感读走缓存"的组合——架构选型从来是延迟换扩展性的明码标价。',
              ],
            },
          ],
        },
        {
          id: 'be-distributed-tx',
          title: '分布式事务的方案全景：2PC、TCC、本地消息表、SAGA 分别适合什么场景？',
          difficulty: 'advanced',
          tags: ['分布式事务', '一致性'],
          points: [
            '**2PC/XA（强一致）**：协调者 prepare→commit 两阶段，参与者锁资源等待决策。问题：同步阻塞、协调者单点、第二阶段网络分区会挂起（3PC 改善有限）。数据库/XA 事务、跨库强一致且并发低的场景可用；互联网高并发基本不用。',            '**TCC（Try-Confirm-Cancel，业务层 2PC）**：Try 预留资源（冻结金额）、Confirm 确认（幂等、不允许失败）、Cancel 释放。**隔离性靠业务中间状态**（冻结），每个参与方要实现三个接口，开发成本最高；适合**资金类强一致但允许"中间可见冻结态"**的场景。',            '**本地消息表/事务消息（最终一致）**：本地事务里写业务 + 消息记录，异步投递 + 重试 + 对账。实现简单、性能好、只能保证" initiator 侧一致"——**绝大多数"跨服务通知"场景的正确选择**。',            '**SAGA（长事务编排）**：把大事务拆成本地事务序列，每步配**补偿操作**，失败逆序补偿。适合长流程（订机票+酒店+租车）、跨企业流程；无隔离性（中间态对外可见，要设计"脏读容忍"：如先到票后退款）；编排式（中央 orchestrator，如 Temporal/Seata Saga）vs 协同式（事件驱动 chained，链路难追踪）。',            '选型心法：**优先消灭分布式事务**（重新划边界/同库合并）；最终一致能接受 → 消息方案；资金核心强一致 → TCC；长流程 → SAGA 编排引擎。Seata 的 AT 模式（自动生成反向补偿，依赖 undo_log）是低侵入折中，但全局锁有吞吐代价。',
          ],
          followUps: [
            {
              question: 'TCC 的空回滚、悬挂、幂等三个经典问题怎么解决？',
              points: [
                '**空回滚**：Try 未到达（超时），Cancel 先到——Cancel 检查"有无 Try 记录"，没有则记一条空回滚标记直接返回成功。',
                '**悬挂**：Cancel 执行后，迟到的 Try 才到，预留资源无人释放——Try 执行前检查"是否已回滚"，是则拒绝。',                '实现手段：事务控制表记录（xid, 状态）与业务操作同事务；三者本质都是**用记录 + 状态机对抗网络乱序**，也是所有分布式协议的通用思路。',
              ],
            },
          ],
        },
        {
          id: 'be-distributed-raft',
          title: 'Raft 是如何选主和复制日志的？它为什么比 Paxos 流行？',
          difficulty: 'advanced',
          tags: ['Raft', '共识', '选主'],
          points: [
            '三种角色：Leader、Follower、Candidate。选主：Follower 随机超时（150-300ms，**随机化避免瓜分选票**）未收到心跳 → 递增 term 变 Candidate 拉票 → **获得多数派投票成为 Leader**（每 term 每人一票，先到先得；日志不全的候选人会被拒绝——**投票约束保证当选者拥有全部已提交日志**）。',            '日志复制：客户端请求都经 Leader → 追加本地日志 → 并行发给 Followers → **多数派写入成功才 commit** → 应用到状态机并响应 → 心跳携带 commitIndex 通知 followers 提交。**日志必须连续匹配**（AppendConsistency 检查，不一致则回退重送）——比 Paxos 的日志空洞模型简单。',            '安全性：commit 只提交**当前 term 的日志**（间接提交旧 term，防止已复制未提交的旧日志被覆盖）；脑裂下旧 Leader 分区隔离，多数派侧选出新 Leader 后，旧 Leader 恢复时看到更高 term 自动退位——**任何时刻最多一个有效 Leader**。',            '比 Paxos 流行的原因：**可理解性设计**（问题拆成选主/复制/安全三块，Paxos 直接从一致性推导难落地）、**强 Leader 简化日志流**、论文附实现指引；工业实现：etcd（Raft 库）、TiKV、Consul、RocketMQ DLedger。',          ],
          followUps: [
            {
              question: 'Raft 能提供线性一致读吗？"读走 Leader"就够了吗？',
              points: [
                '不够：网络分区下旧 Leader 可能还自认为 Leader，直接读会返回旧数据。方案：① 读请求也走一次日志（贵）；② **ReadIndex**：先确认自己仍是 Leader（与多数派换心跳）+ 等待 apply 追平，再读本地（etcd 串行读的升级）；③ **Lease Read**：Leader 依赖时间租约（租约内不选新主）直接读——最快但依赖时钟偏移有界。',
                'etcd 的 --consistency 参数正对应这套：线性一致读（ReadIndex） vs 串行读（可能旧，快）。',
              ],
            },
            {
              question: 'Raft 的安全性约束和 Kafka 的 ISR 约束是什么关系？Lease Read 的现实原型是什么？',
              points: [
                '**同一条安全性约束的两种表述**：Raft"多数派投票 + 日志不全者被拒" ≈ Kafka"只有 ISR 里的副本能当 leader"——**新 leader 必须拥有全部已提交（已复制到多数派）的日志**。（来源：Grokking Advanced System Design · Chubby/Raft）',
                '**Lease Read 的现实原型是 Chubby 会话租约**：租约内 master 保证不被单方面替换，读可走本地——但它依赖**时钟偏移有界**假设（与 linearizable read 题②③呼应）；能跨系统指出"同一机制的不同实现"，是这道题从背诵走向理解的分界。',
                '**Chubby 论文的立场**：锁定/选主只是把共识"翻译成人人会的接口"——工业界偏好把 Raft/Paxos 包成 KV/锁服务（etcd/ZK/Chubby），因为分布式锁的语义对应用者更直观。',
              ],
            },
          ],
        },
        {
          id: 'be-distributed-rate-limit',
          title: '限流算法有哪些？单机和分布式限流分别怎么实现？',
          difficulty: 'intermediate',
          tags: ['限流', '高并发'],
          points: [
            '算法对比：**计数器固定窗口**（简单、临界突刺两倍流量）→ **滑动窗口**（精度高、按窗口切片统计，Sentinel 采用）→ **漏桶**（恒定速率流出，削峰整形，不适合突发）→ **令牌桶**（恒定速率生成令牌、允许桶内突发，Guava RateLimiter/网关主流）。',
            '单机实现：内存原子计数 + 时间窗口；令牌桶用"惰性计算"：`tokens = min(cap, tokens + (now-last)*rate)`，无后台线程。分布式实现：**Redis + Lua**（固定窗口 INCR / 令牌桶脚本，见限流器专题）、**网关/中间件层**（Nginx limit_req、Sentinel 集群流控）、**配额分发**（中心发配额、本地预扣，超大规模）。',
            '限流的位置和维度：接入层（IP/全局 QPS）、服务层（接口/用户/租户维度）、依赖层（对 DB/第三方限流——**最容易被忽略却最有价值**）；响应标准是 **429 + Retry-After**，客户端配合指数退避。',
            '配套哲学：限流是**保命不是服务**——阈值来自压测（容量的 70-80% 设线），要配合熔断降级、排队、弹性扩容；"所有请求都必须成功"和"有限流"逻辑上不可兼得，先和业务对齐被限流时的体验（排队等待 vs 快速失败）。',
          ],
          followUps: [
            {
              question: 'Sentinel 和 Hystrix 的核心区别是什么？为什么熔断框架都转向滑动窗口统计？',
              points: [
                'Hystrix 用线程池隔离（资源隔离彻底但线程开销大）+ 固定窗口熔断统计；Sentinel 用**信号量/上下文计数（无线程切换）+ 滑动窗口 + 流控规则中心（动态下发）**，性能与灵活性更好，已成为主流（Resilience4j 同思路）。',
                '滑动窗口胜在**对突刺更敏感**：固定窗口在边界处"两个半满窗口"误导熔断判断；滑动窗口按桶切片，均值与 P99 都更真实。',
              ],
            },
          ],
        },
        {
          id: 'be-distributed-brain-split',
          title: '分布式系统里的"脑裂"是什么？哪些系统会脑裂，怎么防？',
          difficulty: 'advanced',
          tags: ['脑裂', '共识', '高可用'],
          points: [
            '定义：网络分区把集群劈成两半，**两边各自选主、各自接受写入**，恢复后数据冲突不可合并（或主从架构两边都认为自己是主）。危害：数据分叉、双写冲突、资金类事故。',
            '典型场景：Redis 哨兵/集群在极端分区 + 客户端配置混杂时出现双主（**防：min-replicas-to-write 限制"从库不足 N 个就拒绝写"**）；MySQL 双主 + 网络抖动双写（**防：只用一主 + fencing/Semi-sync，禁止双写架构裸奔**）；ZooKeeper/etcd **天生防脑裂——多数派共识**，少数派分区无法完成选举与写入，只会不可用（CAP 选了 C）。',            '通用防御三件套：**法定人数（quorum，多数派才有权行动）**、** fencing（旧主带旧世代号，被资源侧拒绝）**、**STONITH（封死旧主：通过电源/管理接口确保旧主真死）**——传统 HA 的"Shoot the other node in the head"与共识系统的任期号是同一思想的两种实现。',            '架构启示：**能选共识系统的就别手搓主从**；必须手搓（成本原因）时，把"谁有权写"的裁决外部化（DB 唯一约束、租约、版本号），不要相信"网络不会分区"。',
          ],
          followUps: [
            {
              question: '为什么 ZooKeeper 不保证每次读都是最新的，却能防脑裂？这矛盾吗？',
              points: [
                '不矛盾：ZK 写入走多数派（CP，防脑裂），但**读默认可以由任意 follower 服务**（可能旧）——这是 CAP 内部的再权衡：用"读的线性一致"换读吞吐；需要强一致读可 sync() 或读 leader。',
                '这说明 **CP/AP 不是系统级二选一，而是操作级配置**——把一致性需求映射到具体接口，是分布式设计的日常。',
              ],
            },
            {
              question: '工业系统是怎么具体防"旧主复活"的？——三组世代号（epoch）实例',
              points: [
                '**Kafka controller 僵尸**：controller 宕机 → ZK 选新 controller，旧 controller 若只是 GC 停顿后复活即成 zombie——做法：所有 controller 请求携带 **epoch number（存在 ZK）**，broker 只信最大 epoch。（来源：Grokking Advanced System Design · Chubby）',
                '**Chubby 新 master**：上任先取新 epoch number，拒绝一切旧 epoch 的调用——防止迟到响应发给"前任时代"的客户端；**世代号必须持久化**（可随每条 WAL 落盘），重启不回退；Cassandra 把 generation number 放进 gossip 消息，区分节点"重启前的旧状态"。',
                '**Fencing 的两分法收束**：**resource fencing**（吊销旧主对共享存储的访问/禁用网络端口）vs **node fencing（STONITH，直接断电重置）**——HDFS 对旧 NameNode 用的就是这套；答脑裂时给出"检测（epoch）+ 执行（fencing）"两段式才是完整方案。',
              ],
            },
            {
              question: 'HDFS 的 HA 切换是怎么具体防脑裂的？',
              points: [
                '**QJM（Quorum Journal Manager）用多数派写 EditLog**：active 要把编辑日志写到多数 JournalNode 才算提交——旧 active 即使活着，写不进多数派就造成不了分叉；这是"用共识防脑裂"，而不是只靠检测。（来源：Grokking Advanced System Design · HDFS）',
                '**触发场景要具体**：网络变慢/分区触发 failover，但旧 active 还活着且自认为 active——resource fencing（收回共享存储访问、远程禁网络端口）与 node fencing（STONITH）是兜底；与本题前面 epoch/世代号的"检测"段配套：**检测靠 epoch，执行靠 fencing，共识（QJM）让写冲突根本不发生**——三层讲全才算完整。',
              ],
            },
          ],
        },
        {
          id: 'be-distributed-quorum',
          title: '什么是 Quorum（W+R>N）？它保证了什么、不保证什么？',
          difficulty: 'advanced',
          tags: ['Quorum', '副本'],
          points: [
            '定义：写成功份数 W + 读份数 R > 总副本 N → 读写集合**必然相交**，读能读到至少一份最新写入——Dynamo/Cassandra 的核心参数（常 N=3, W=2, R=2）。',
            '保证：**读写不丢最新版（版本层面）**，可调可用性/延迟（W 越小写越快但越可能读到旧值需要 R 补偿）；不保证：**线性一致**——并发写没有全序（客户端 A 读到 B 的新值后，C 可能还读到旧值）、时钟偏差下"最新"判定可能错（Dynamo 用向量时钟/时间戳仲裁冲突）。',
            '衍生概念：**读修复**（读时发现旧副本回填）、**反熵同步**（后台 hash 树比对修复）、**sloppy quorum + hinted handoff**（节点不足时写到备用节点，恢复后交还——牺牲严格 quorum 换可用性）。',            '与 Raft/Paxos 的关系：quorum 是**共同的技术底座**（都是多数派交集），差别在 Raft 用它建**全序日志**（线性一致），Dynamo 用它做**无主的最终一致**——同样是多数派，组织方式决定一致性级别。',
          ],
          followUps: [
            {
              question: 'Cassandra 的 W=1, R=1 配置意味着什么？什么业务敢这么配？',
              points: [
                '写任意一个副本成功即返回、读任意一个副本——最高吞吐最低延迟，但分区/延迟窗口内可能读到旧值甚至短暂丢写（副本都挂时）。',
                '敢这么配的业务：写多读多但**单条数据可容忍回退**的场景——日志、埋点、IoT 采样、推荐特征；账务、库存一律调高 W/R 或用 LWT（轻量事务，Paxos 加持但吞吐骤降）。',
              ],
            },
            {
              question: '为什么副本数一定是奇数？R/W 还有哪些配置空间与反例？',
              points: [
                '**奇数论证**：5 节点容忍 2 故障、4 节点只容忍 1——偶数不增加容错还多一台成本（多数派大小没变）；这也是"为什么 ZK/etcd 推荐 3/5 节点"的数学根据。（来源：Grokking Advanced System Design · Quorum）',
                '**性能最优在 1 < R < W < N**：读多于写的负载微调 R；**R=1/W=N（write-all-read-one）是反例**——写完成率被最差节点绑架，一个慢盘拖垮全部写入。',
                '**Read Repair 的概率执行变体**：读一致性级别 < All 时（如抽样 10% 请求），先满足一致性级别即刻返回，修复异步后台做；摘要（digest/checksum）比对省带宽，不一致才拉全量——"修复"与"响应"解耦。',
              ],
            },
            {
              question: 'Dynamo 的 sloppy quorum 具体是怎么工作的？代价是什么？',
              points: [
                '**preference list > N 且跳过虚拟节点**：正常时前 N 个偏好节点承接读写；节点不可用时沿哈希环继续找健康节点凑数——"永远可写"的来源；hint 副本存**独立本地数据库**周期扫描，目标恢复后送达并删除，**送达前不减少系统总副本数**。（来源：Grokking Advanced System Design · Dynamo）',
                '**代价**：并发写可能落在**不相交的节点集合**上——版本冲突概率大增，所以 sloppy quorum 必须配向量时钟（客户端合并）；(N,R,W)=(3,3,1) 重读、(3,1,3) 重写的语义差异要能口算；Cassandra 的 ANY 级别允许 hint-only 写成功，但**恢复前不可读**——可用性与可读性在这里分离。',
              ],
            },
          ],
        },
        {
          id: 'be-distributed-config-registry',
          title: '配置中心和注册中心的设计要点有哪些？推送和轮询怎么选？',
          difficulty: 'intermediate',
          tags: ['配置中心', '注册中心', '服务发现'],
          points: [
            '**注册中心**：服务实例注册（心跳续约 + TTL 踢除）、发现（客户端拉取列表 + 订阅变更）、健康检查（心跳/TCP/HTTP 探测）。一致性取向：**AP**（Eureka/Nacos：分区时返回旧列表，容忍短暂脏数据换可用）vs **CP**（ZooKeeper/Consul：强一致但分区时不可用）——服务发现通常 AP，因为"列表旧 30 秒"远好于" discovery 全挂"。',            '**配置中心**（Apollo/Nacos/Consul KV）：发布审计（谁改了什么，可回滚）、**灰度发布**（按机器/机房分组生效）、敏感配置加密、**推送 + 本地快照兜底**（推送失败/断网时启动读本地缓存文件，"配置中心挂了服务还能起"是硬要求）。',            '**推送 vs 轮询**：纯推（长连接，实时但连接管理复杂、广播风暴）vs 纯轮询（简单但延迟=轮询间隔，大量无效请求）；主流是**长轮询**（客户端挂 30s 等变更，有变立即返回，无变超时重试——Nacos/Apollo 的做法）或长连接 + 心跳。配置变更的**传播延迟要纳入故障排查视角**（改了配置为什么没生效：哪个节点没收到、本地缓存没刷新）。',            '客户端容错：本地内存缓存 + 磁盘快照 + 变更回调失败重试；配置热更新要与框架集成（@RefreshScope/回调重载连接池）——"配置改了但连接池还是旧的"是经典坑。',          ],
          followUps: [
            {
              question: '服务实例下线了，为什么流量还会打过来一会儿？如何缩短这个窗口？',
              points: [
                '多级缓存叠加：注册中心推送延迟 + 消费端本地缓存刷新周期 + **负载均衡器/客户端的连接池未剔除** + 调用失败的容错重试又兜了一圈。',
                '缩短手段：**主动注销**（优雅下线：先摘流量再杀进程，kill 信号里先调 deregister）、心跳 TTL 调短、消费端失败快速剔除（熔断半开探测）；K8s 用 preStop + readinessGates 把"摘流量→等待存量→退出"编排成标准动作。',
              ],
            },
            {
              question: 'Chubby 的规模化经验对注册中心/配置中心有什么迁移价值？',
              points: [
                '**ephemeral 节点做活性标记**：客户端断连即自动删除——服务发现"实例离开"语义的原型；**心跳占实测流量 93% → 拉长租约（12s→60s）是第一扩容手段**，其次是 **proxy 聚合**（一个代理聚合 N 个客户端的 KeepAlive/读，流量除以 N，写与首次读仍回 master）。（来源：Grokking Advanced System Design · Chubby）',
                '**namespace 按目录拆分到多个 cell**（/ls/cell/foo 归 cell A、/ls/cell/bar 归 cell B）可横向扩，但 ACL 集中存储与目录删除引发的跨分区调用**拆不掉**——扩展性设计的边界案例。',
                '**负缓存**（缓存"文件不存在"）与**配额缺失**的教训（后来加 256KB 文件上限）——注册中心的"海量小 key"治理同样适用：防滥用要有硬上限，"不存在"也要缓存。',
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'be-micro',
      name: '微服务架构',
      description: '拆分边界、RPC、网关与可观测——从单体到服务化的完整决策链。',
      references: [
        { label: '微服务模式（Chris Richardson, microservices.io）', url: 'https://microservices.io/' },
        { label: 'gRPC 官方文档', url: 'https://grpc.io/docs/' },
      ],
      questions: [
        {
          id: 'be-micro-split',
          title: '微服务应该怎么拆？拆分依据和常见错误是什么？',
          difficulty: 'intermediate',
          tags: ['微服务', '架构'],
          points: [
            '拆分依据优先级：**业务能力/限界上下文（DDD）> 团队结构（康威定律：系统架构会长得像组织架构）> 变更频率与扩缩容需求 > 数据域独立性**。健康信号：一个服务一个业务负责人、一个数据库、可独立发布。',            '粒度判断："两个服务之间是否频繁同步调用、是否总是一起发布"——总是，说明拆错了；服务数量不是 KPI，**Netflix 式几百个服务是结果不是起点**。合理路径：先按大边界拆粗粒度服务（3-8 个），随业务演化再分裂。',            '常见错误：① **按技术层拆**（user-dao-service、order-dao-service）导致链式调用层层 RPC；② **共享数据库**（两个服务读同一张表——数据层耦合，改表就雪崩，服务边界形同虚设）；③ 分布式单体（拆了服务还同步强依赖，一个挂全挂）；④ 过早拆分（团队小、领域没看清就上几十个服务，运维吞没业务）。',            '拆分落地顺序：先**绞杀者模式**渐进迁移（新功能新服务，老功能逐步搬，网关路由过渡）而不是一刀切重写；同步调用能转异步事件就转；每个服务自带存储。',          ],
          followUps: [
            {
              question: '两个服务需要同一份数据，怎么办？共享库、API 同步调用、事件同步各有什么问题？',
              points: [
                '共享库/表：耦合最深，禁止（Schema 改动互相牵制）。同步 API：引入可用性传染（对方挂你就挂）与延迟叠加，适合实时性要求高的少量查询。',                '事件驱动 + **本地副本**：上游发领域事件，下游订阅并存自己关心的投影数据（如订单服务存商品快照）——读性能好、解耦彻底，代价是**最终一致 + 冗余存储**；数据编排用 outbox 保证事件不丢。多数跨服务数据需求的标准答案是"事件 + 本地投影"。',
              ],
            },
          ],
        },
        {
          id: 'be-micro-rpc',
          title: 'RPC 的完整调用过程是怎样的？gRPC/Thrift/Dubbo 的序列化怎么选？',
          difficulty: 'intermediate',
          tags: ['RPC', '序列化', 'gRPC'],
          points: [
            '一次 RPC：**动态代理拦截调用** → 方法与参数**序列化**成字节 → 协议编码（头：魔数/长度/序列化类型/请求 ID）→ **网络传输**（TCP 长连接 + 连接池/多路复用）→ 服务端解码 → 反序列化 → 反射/生成代码调用真实方法 → 结果原路返回。框架核心件：代理、序列化、协议、IO 线程模型（Netty）、负载均衡、容错、注册发现。',            '**序列化选型**：JSON（可读、通用、慢、体积大）适合对外 API；**Protobuf**（二进制、schema 强约束、体积小 1/3~1/10、编解码快、向后兼容字段规则清晰）适合内部 RPC；Hessian（Java 生态方便但跨语言弱）；Java 原生序列化（**漏洞重灾区、仅限可信内网且不推荐**）。Kryo/FST 单语言高性能场景。',            '**gRPC**：HTTP/2 多路复用（单连接并发多请求，队头阻塞缓解）、Protobuf、四种流模式（一元/服务端流/客户端流/双向流，适合推送与批量）；**Dubbo**：私有协议 + 多序列化可插拔 + Java 治理能力强（路由、熔断、泛化）。',            '工程要点：**接口兼容性治理**（Protobuf 字段只能加不能改号）、超时必须全链路传递（防上游超时下游还在算）、大对象别走 RPC（走对象存储传引用）、连接池与预热（新实例冷启动抖动）。',          ],
          followUps: [
            {
              question: 'HTTP/2 解决了 HTTP/1.1 的队头阻塞吗？HTTP/3 呢？',
              points: [
                '应用层解决了（多路复用，一个请求慢不堵其他流），但 **TCP 层的队头阻塞仍在**：丢一个包，所有流都要等重传——HTTP/2 在弱网下体验可能还不如 1.1 的多连接。',
                'HTTP/3 换 **QUIC（UDP 上重建可靠传输 + 流独立重传 + 0-RTT 建连）**，把队头阻塞消在传输层；对 RPC 的意义：高并发长连接在丢包网络下的尾延迟显著改善。',
              ],
            },
          ],
        },
        {
          id: 'be-micro-gateway',
          title: 'API 网关应该承担哪些职责？哪些逻辑不该放进网关？',
          difficulty: 'basic',
          tags: ['网关', '架构'],
          points: [
            '适合放网关的**横切能力**：路由与版本管理、认证鉴权（token 校验、签名验证）、限流熔断（全站入口统一）、灰度分流（按用户/设备百分比路由）、协议转换（外部 HTTPS ↔ 内部 RPC）、可观测（日志、trace 起点）、安全防护（WAF 基础、防重放）。',            '选择依据一句话：**"所有流量都要做的、与业务无关的"放网关；"部分业务才需要的、依赖业务语义的"放服务**。业务校验、领域逻辑、个性化聚合放进网关会让它变成单点业务上帝，变更频次与风险全压在最关键路径上。',            '实现选型：Nginx/Kong（插件生态、高性能）、Spring Cloud Gateway（Java 生态、编程灵活）、云托管网关（AWS API Gateway、阿里云 API 网关等）；自研插件要考虑**配置热更与灰度**——网关的变更影响全站，发布策略必须最保守。',            'BFF（Backend for Frontend）与网关的边界：网关做**通用横切**；BFF 是面向特定前端的**业务聚合层**（裁剪字段、编排多个服务），BFF 可以有业务逻辑，网关不应该。',          ],
          followUps: [
            {
              question: '网关自己挂了怎么办？如何做网关的高可用与多级容错？',
              points: [
                '网关是无状态集群：多实例 + 负载均衡（LVS/云 LB）横向扩展；实例分布多可用区防机房级故障。',
                '更深一层的容错：**本地路由表兜底**（配置中心不可达时用最后已知路由继续转发）、旁路鉴权降级（鉴权服务挂了按策略 fail-open/close）、按机房就近转发。网关挂 = 全站挂，所以它的每一环都比业务服务要求更高的冗余度。',
              ],
            },
          ],
        },
        {
          id: 'be-micro-tracing',
          title: '链路追踪的原理是什么？TraceID 是如何跨进程传播的？',
          difficulty: 'intermediate',
          tags: ['链路追踪', '可观测', 'OpenTelemetry'],
          points: [
            '数据模型：**Trace**（一次请求全程）= 多个 **Span**（一次调用：名称、起止时间、状态、属性）构成的树；Span 间 ParentSpanID 表达父子。**采样策略**（头部采样 1%、尾部采样保留慢/错请求）控制成本。',            '跨进程传播：**上下文注入到请求载体**——HTTP 用 W3C Trace Context 标准 header（traceparent: 00-traceid-spanid-flags），RPC 用 attachment/metadata，MQ 用消息属性；服务端提取后**延续 traceid、生成新 spanid**——树由此生长。线程池/异步要用**装饰 Runnable 传递上下文**（TransmittableThreadLocal 一类方案），异步丢上下文是断链最常见原因。',            '标准化趋势：**OpenTelemetry**（API/SDK/OTLP 协议，Trace+Metrics+Logs 三信号统一）替代各家 agent；后端存储 Jaeger/Tempo（Trace）、Prometheus（Metrics）、Loki/ES（Logs）。',            '价值闭环：入口看 p99 慢在哪（trace 树）→ 定位到某个下游 span → 关联同时间窗日志（traceid 串日志）→ 与指标联动（RED：Rate/Error/Duration）。三件套的粘合剂就是 traceid 贯穿——**日志里不打 traceid 的系统，排查都是瞎子摸象**。',          ],
          followUps: [
            {
              question: '采样会丢问题现场吗？尾部采样为什么需要消息队列？',
              points: [
                '头部采样在入口随机丢弃，可能恰好丢掉偶发问题的现场——改进：**错误与慢请求强制保留 + 尾部采样**（等请求结束再决定是否保留，需把全量 span 暂存后筛选）。',
                '尾部采样要集中决策，span 由各节点上报后按 traceid 聚合——数据量大必须经 Kafka 缓冲 + 采样器消费，这就是采样后端（Tempo/Grafana）的标准架构。',
              ],
            },
          ],
        },
        {
          id: 'be-micro-modular-monolith',
          title: '「微服务回潮」是怎么回事？单体、微服务、模块化单体在 2026 年怎么选？',
          difficulty: 'advanced',
          tags: ['架构选型', '模块化单体', '微服务'],
          points: [
            '**标志性事件先摆出来（这题的时代背景）**：Amazon Prime Video 把音视频监控服务从微服务（Lambda + Step Functions 编排）**回迁为单体部署，基础设施成本降 90%+**；随后多家公司公开"合并回单体"的案例；Martin Fowler 等也转向推荐**模块化单体**为多数新项目的默认起点——不是微服务错了，是"**为拆而拆**"的账终于算明白了：微服务的每一分收益（独立部署、独立扩容、故障隔离）都有对应成本（网络调用、分布式事务、N 倍运维面、链路排障），**收益要用得着、成本付得起**才划算。',
            '**「分布式单体」——回潮真正反对的东西（概念核心）**：拆了服务但没拆对——按技术分层（前端服务/逻辑服务/数据服务）而不是按业务领域拆、模块间改一个需求要动五个服务联调发版、共享数据库互相拖累——**拿到了微服务的全部成本，却没拿到任何独立性与隔离性**；判断自己是不是分布式单体的测试：**随便挑两个服务，能否独立部署互不等待？一个服务挂掉是否只影响一个业务域？** 两问都否，你只是把单体摊开在了网络上。',
            '**模块化单体的工程形态**：**单进程部署 + 微服务级的模块纪律**——模块按业务领域划分（模块内高内聚）、模块间**只通过公开 API/接口调用**（禁止跨模块摸表——用架构测试（ArchUnit 类工具）在 CI 里强制）、每模块独立数据 schema（逻辑隔离，为未来拆分留缝）；演进路线：**模块化单体起步 → 边界在演化中验证 → 真正出现独立扩缩/团队自治需求时按模块拆出**——"模块是拆分的预演，拆不拆取决于边界是否被证明 + 规模是否需要"，这比"上来就微服务"和"永远单体"都更工程化。',
            '**2026 的选型判断（答题收束）**：**新项目/小团队默认模块化单体**（一个代码库一条流水线，交付速度最快）；出现这些信号再拆——**某个模块的负载特征显著不同**（要独立扩缩）、**组织规模让单代码库协作成本上升**（多团队抢主干）、**故障域需要物理隔离**（支付核心）；拆的时候**按已验证的模块边界拆**（模块化时期积累的 API 边界直接变服务契约）；与微服务拆分题分工：那题讲怎么拆对，本题讲**要不要拆、什么时候拆**——面试能说"我默认不拆，除非出现这些信号"，比背微服务优点更显架构判断力。',
          ],
          followUps: [
            {
              question: '你说默认模块化单体，那面试官反问「为什么大厂都在用微服务」怎么接？',
              points: [
                '承认规模差异而不是硬扛：大厂微服务的收益**真实存在**——几百个团队并行开发需要组织对齐（康威定律：架构映射组织）、流量大到一个机房装不下（物理拆分）、模块负载特征差异巨大（推荐引擎 vs 商品页）；**大厂的成本也付得起**（平台工程把运维成本摊薄——与平台工程题衔接）。',
                '然后回到决策框架：微服务是**规模化组织与规模化流量的解**，不是技术先进性的勋章——你的团队规模与流量没到，这些收益要么用不上（没有多团队何来并行开发收益）、要么被成本吃掉（没有平台工程，N 个服务的运维全自己扛）；**选型跟着约束走**（团队规模 × 流量特征 × 运维能力），这句话就是这道反问的满分收尾。',
              ],
            },
          ],
        },
        {
          id: 'be-micro-mesh',
          title: 'Service Mesh 解决什么问题？和 Spring Cloud 这类框架怎么取舍？',
          difficulty: 'advanced',
          tags: ['Service Mesh', 'Istio', '架构'],
          points: [
            '动机：SDK 化的服务治理（Spring Cloud/Dubbo）把治理逻辑**绑进每种语言**——多语言团队要维护 N 套 SDK，升级全公司苦不堪言。Mesh 把治理下沉到**Sidecar 代理（Envoy）**：每个 Pod 两个容器，流量劫持（iptables/eBPF）经过 Sidecar，**重试、熔断、路由、mTLS、遥测全部在代理层**，业务代码零侵入。',            '**控制平面（Istio Pilot/Istiod）**下发配置 → **数据平面（Envoy 集群）**执行；特性：金丝雀按 header 精确分流、统一 mTLS（零信任网络）、L7 可观测开箱即得。',            '代价必须说透：**每一跳多两次代理转发**（延迟 +、资源 +，高 QPS 场景 CPU 开销显著）、运维复杂度陡增（Istio 升级、Envoy 配置排障）、排查链路变长。收益随**语言异构性与服务规模**增长——几个 Java 服务上 Mesh 纯属给自己找事。',            '取舍口径：**单语言中等规模 → SDK 框架**（成熟、无额外开销）；**多语言、数百服务、平台团队成熟 → Mesh**；过渡形态：**教育性 SDK 薄层 + 网格渐进**（先 mTLS 与遥测上 Mesh，流量治理后上）；国内常见 Dubbo3 的**应用级服务发现 + 可选代理**也是折中路线。',          ],
          followUps: [
            {
              question: 'Sidecar 的资源开销和延迟大概什么量级？有什么优化方向？',
              points: [
                '经验值：每跳增加约 0.5-3ms 延迟，Sidecar 常驻几十至上百 MB 内存 + 与业务相当比例的 CPU（高吞吐时可达业务的 10-30%）。',
                '优化：**eBPF 内核态直连**（同节点 Sidecar-less，如 Istio ambient/Cilium 路线）、Envoy 精简配置与连接复用、按命名空间裁剪服务发现范围——"Mesh 免费"是错觉，规划容量时要把 Sidecar 当一个服务算。',
              ],
            },
          ],
        },
        {
          id: 'be-micro-graceful-lifecycle',
          title: '微服务的优雅上线与优雅下线分别要做什么？漏一步会发生什么？',
          difficulty: 'intermediate',
          tags: ['优雅上下线', '发布', '高可用'],
          points: [
            '**优雅上线四步**：进程启动完成 → 健康检查通过（就绪探针）→ **预热**（JIT 编译、本地缓存/连接池初始化、Kafka 分区重平衡完）→ 注册中心注册/摘除 not-ready 标记接流量。漏了预热，放量瞬间的超时全来自"冷实例"。',
            '**优雅下线四步**：先摘流量（主动注销注册或 readiness 置失败）→ 等存量请求处理完（宽限期内）→ 关闭入口连接与线程池 → 按依赖逆序关闭资源（先释放 DB/Redis 连接再关 MQ 消费者，消费位移要提交干净）。',
            'K8s 落地：`preStop` 钩子 sleep 几秒等 iptables/注册中心摘流量（endpoint 更新有延迟），`terminationGracePeriodSeconds` 覆盖"存量请求最长时间 + 资源清理时间"；进程内要处理 **SIGTERM**——收到才走 drain 流程，超时或 SIGKILL 后悔药都没有。',
            '发布期兼容：滚动发布时**新老实例并存**，接口/消息/缓存结构必须向下兼容；MQ 消费者下线要等 rebalance 稳定再杀进程，否则分区重平衡期间消息堆积。',
            '漏步症状对照：不摘流量就杀进程 = 存量请求批量 502；不预热就放量 = 发布后 RT 毛刺；不等存量 = 用户请求被打断；MQ 不提交位移 = 重复消费。',
          ],
          followUps: [
            {
              question: '宽限期内存量请求就是处理不完，怎么办？',
              points: [
                '宽限期不是万能的：把单请求超时预算设计得小于宽限期（如请求超时 5s、宽限期 15s），到点让连接自然超时而不是被强杀撕开。',
                '写操作必须有**幂等兜底**——客户端对"未知结果"的请求发起重试，配合幂等键保证安全；drain 期间新请求要返回明确的可重试错误（如 503 + Retry-After）而不是挂着。',
              ],
            },
            {
              question: '为什么一定要"先摘流量、再等存量"，顺序反过来会怎样？',
              points: [
                '摘流量到负载均衡/注册中心生效有传播延迟（秒级），这期间新请求仍会打进来——所以先摘、后 sleep、再关，是用时间换"零丢失"。',
                '反过来先关服务再摘流量，摘除窗口内的请求必然失败；"摘流量 → drain → 退出"的顺序是优雅上下线的铁律，差异只在各步的时长配置。',
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'be-stability',
      name: '高可用与稳定性',
      description: '限流熔断降级、容量压测、灰度发布与故障复盘——线上系统的生存法则。',
      references: [
        { label: 'Google SRE Book（免费在线）', url: 'https://sre.google/sre-book/table-of-contents/' },
        { label: 'The Tail at Scale 论文', url: 'https://research.google/pubs/the-tail-at-scale/' },
      ],
      questions: [
        {
          id: 'be-stability-limits-degrade',
          title: '限流、熔断、降级三者如何协作？一次大促的稳定性体系怎么搭？',
          difficulty: 'intermediate',
          tags: ['限流', '熔断', '降级'],
          points: [
            '分工：**限流**是"门口保安"——超过容量的请求直接拒绝（保护自己）；**熔断**是"保险丝"——下游故障时快速失败不再傻等（保护自己不被拖死，同时给下游喘息）；**降级**是"应急预案"——非核心功能主动关闭或返回兜底数据（保核心体验）。限流面向"量"，熔断面向"故障"，降级面向"取舍"。',            '熔断器状态机：**Closed（正常，统计失败率）→ 打开（失败率/慢调用超阈值，直接拒绝一段时间）→ 半开（放少量探测请求，成功则恢复）**。阈值要看**慢调用比例**而不只看异常——超时拖死连接池的案例远多于显式报错。',            '协作链路示例（下单）：入口网关按**系统水位自适应限流**（Sentinel/BBR 思路：CPU 或 RT 升高自动收紧）→ 核心链路（创建订单/扣库存）**不降级但限流排队** → 非核心（推荐、积分、通知）**熔断或直接关闭** → 底层 DB 前**连接池与并发数限流**防止雪崩穿透到底层。',            '预案体系：每个依赖提前定义"挂了怎么办"（降级开关、兜底数据、开关平台一键操作）；**预案必须演练**（故障注入验证开关真的能关）——没演练过的开关等于没有。',          ],
          followUps: [
            {
              question: '为什么"调用方超时 + 重试"配置不当会引发雪崩？正确的重试策略是什么？',
              points: [
                '连锁放大：A 超时 1s 重试 3 次 → 下游瞬时流量 ×3，更慢 → 更多重试 → 指数放大直至全站雪崩（重试风暴）；重试还会撕大"请求在途数"，耗尽线程池与连接池。',
                '正确策略：**预算制重试**（retry budget：重试请求不超过总请求的 10%）、指数退避 + 抖动、只重试幂等接口、超时逐层收紧（入口 500ms → 下游 300ms，留出处理余量）、熔断器兜底——重试是双刃剑，必须带闸。',
              ],
            },
          ],
        },
        {
          id: 'be-stability-multi-active',
          title: '异地多活怎么设计？RTO/RPO 是什么？单元化解决什么问题？',
          difficulty: 'advanced',
          tags: ['异地多活', '容灾', '单元化', 'RTO'],
          points: [
            '**两个指标先定义清楚（一切容灾设计的度量衡）**：**RPO**（恢复点目标——能容忍丢多少数据，时间度量：RPO=0 意味着同步复制不丢）；**RTO**（恢复时间目标——多快恢复服务）。所有架构方案都是这两个数与成本的交易：冷备（RTO 小时~天、最便宜）→ 热备（分钟级切换）→ **同城双活**（RPO≈0 同步复制、RTO 分钟级、扛机房级故障）→ **异地多活**（RTO 分钟级且**扛城市级灾难**、最贵）——能报出这个阶梯与每级 RTO/RPO 数量级，是这题的基本盘。',
            '**为什么异地做"双活"这么难（本质矛盾）**：物理距离决定**网络 RTT**（同城 1~2ms，异地 20~50ms+）——**同步复制会让每次写都付异地 RTT，业务不可接受**；异步复制又有**数据不一致窗口**（RPO = 复制延迟，主站挂了未同步的数据就没了）。异地多活的核心思路由此产生：**不追求全量数据实时一致，而是让每个地域只写"自己的那份"**。',
            '**单元化（set 化）——异地多活的工程答案**：按**用户维度**（user_id 取模/基因法）把流量与数据切到对应"单元"，每个单元**闭环处理自己用户的读写**（淘宝/蚂蚁的 set 化架构）；跨单元的引用数据（商品、配置）做**异步广播同步**；单点的全局服务（序列号、风控名单）走中心化或本地缓存。**路由是地基**：接入层按用户 ID 一致路由到所属单元（与分库分表的路由思想同构——把"分片"从数据库层抬到整个机房层）；单元间流量比例可调（1:1 双活或 4:6 热备），故障时**整体切流**而不是逐服务排查。',
            '**数据同步与冲突（深水区）**：同步链路（DTS/otter 类双向往返 + **冲突检测**——同一条数据异地都改过的处理策略：时间戳仲裁/业务规则/人工）；**全局一致性事务**跨单元怎么处理（尽量避免——单元内闭环是设计纪律，跨单元交易走中心单元）；**切流演练**是异地多活的生死线：定期真切（泳道流量从 A 切 B 验证 B 真的能扛——与混沌工程题的"验证高可用"哲学衔接），**没演练过的容灾方案等于没有**（切过去才发现缓存没预热、数据缺一段的故事每个大厂都有）。',
            '收束口径：异地多活是**成本、复杂度、容灾等级**的三维决策——城市级容灾是监管/业务生死需求（金融、支付）才值得上（成本 2 倍起步 + 长期治理）；多数公司诚实的答案是**同城双活 + 异地冷备**（异步复制 + 预案），能把"我需要什么等级"倒着讲清楚，比背架构图值钱得多。',
          ],
          followUps: [
            {
              question: '单元化之后，某个用户在异地出差访问，请求怎么处理？',
              points: [
                '三种策略按业务定：① **路由回属主单元**（异地接入层把请求转发回用户数据所在单元——数据强一致但付跨地 RTT，体验打折）；② **临时迁移**（用户长期异地，后台把其数据**异步搬迁**到就近单元——搬迁期间写锁定或双写，蚂蚁叫"用户搬迁"）；③ **就近写异地同步**（短期访问：本地写 + 异步同步回属主，容忍冲突仲裁——社交类可接受，资金类不行）。',
                '这个追问考的是"**数据所有权**"意识：单元化的本质是给每条数据定唯一属主，访问模式（读多写少的可复制就近读，写多的回属主）按一致性等级分诊——能按数据等级给策略矩阵，说明真理解了单元化而不是背概念。',
              ],
            },
          ],
        },
        {
          id: 'be-stability-capacity',
          title: '容量规划怎么做？全链路压测的关键设计是什么？',
          difficulty: 'advanced',
          tags: ['容量', '压测'],
          points: [
            '容量规划流程：**流量预估**（大促倍数、业务增长）→ **容量公式**（目标 QPS ÷ 单机容量 = 机器数 × 冗余系数，一般再乘 30-50% buffer）→ **依赖分解**（每层：网关/服务/缓存/DB/MQ 的目标 QPS 与水位）→ **单点瓶颈识别**（连接数、带宽、热点 key、DB 写入）→ 压测验证。',            '单机容量怎么定：**压测到 P99 开始陡增的拐点**（而不是 QPS 峰值）——拐点前系统弹性尚存，拐点后延迟雪崩；生产压测小流量外推（看 RT 是否线性）。',
            '**全链路压测**核心设计：**影子流量标记**（压测请求带标识贯穿全链路）、**数据隔离**（影子表/影子 Redis/影子 topic——绝不能污染生产数据，这是红线）、**中间件透传**（所有框架识别压测标并路由到影子资源）、**开关与熔断**（压测可随时急停）、**施压端分布式**（单机施压能力有限，用 JMeter 分布式/自研施压平台）。',            '常态化：压测不是一次性——大促前全链路、月度单链路、变更后冒烟压测；容量数据沉淀成**容量水位看板**，核心指标长期跟踪（CPU 水位、连接池水位、缓存命中率）。',
          ],
          followUps: [
            {
              question: '为什么不能直接用测试环境压测结果推生产容量？全链路压测一定要做吗？',
              points: [
                '测试环境差异：数据量级（索引树高度、缓存命中率完全不同）、网络拓扑、机器规格与扰动（邻居负载）、依赖的真实性与负载。',
                '全链路压测成本高（影子资源、框架改造），不是每家公司都值得：流量可预测且依赖简单的系统，**分层单链路压测 + 余量冗余**就够；判断标准是"低估算容量的代价"——大促翻车一次的损失 vs 建设成本。',
              ],
            },
          ],
        },
        {
          id: 'be-stability-deploy',
          title: '重要版本的发布流程怎么设计才能安全兜底？',
          difficulty: 'intermediate',
          tags: ['发布', '灰度', '稳定性'],
          points: [
            '定位差异：滚动/蓝绿/金丝雀三种发布方式的**原理与选型**是基础设施视角的考题（见"运维与云原生 → 容器与 CI/CD"）；这里考的是**服务负责人的发布保障设计**——把一次发布从"代码上线"变成"可观测、可阻断、可回滚的受控变更"。',
            '发布安全的前提是**兼容**：接口向下兼容（新旧互调不炸）、数据库变更与代码变更解耦（加列后发代码，删列最后发——expand-contract）、消息格式兼容、缓存结构兼容——**"两阶段发布"思维贯穿所有资源**，新旧共存期是所有发布事故的高发窗口。',
            '流程设计：CI（测试 + 镜像不可变）→ 预发验证 → **灰度放量**（内部员工/白名单 → 1% → 10% → 50%，每步盯核心指标：错误率、RT、业务漏斗）→ **指标劣化自动阻断** → 一键回滚（**回滚要和发布一样快**——没演练过的回滚等于没有回滚）。',
            '配套纪律：发布窗口管理（避开高峰与节假日）、变更冻结期、**发布与配置变更分离**（混在一起出问题分不清凶手）、发布单审计——大厂稳定性复盘里"变更"永远占首位，发布纪律是性价比最高的稳定性投入。',
          ],
          followUps: [
            {
              question: 'feature flag 怎么把"部署"和"功能开放"解耦？',
              points: [
                '代码上线 ≠ 功能可用：新功能包在开关后面随版本一起发布，开放时机由配置/开关平台控制——发布风险与业务风险分离，出问题**关开关秒级止血**，不用回滚代码。',
                '工程代价要会说：开关的生命周期管理（过期开关清理）、状态爆炸（N 个开关 = 2^N 组合，测试矩阵失控）、技术债——flag 是债务工具，用完要还（及时删除死开关）。',
              ],
            },
            {
              question: '数据库 DDL 为什么不能随便直接执行？大表变更的正确姿势？',
              points: [
                '风险：MySQL 5.6+ 部分 DDL 支持 Online，但**仍有锁表窗口与主从延迟放大**（大表加列几小时，从库追不上），失败回滚代价巨大。',
                '姿势：gh-ost/pt-online-schema-change（影子表 + 增量同步 + 原子改名，可控暂停限流）、8.0 INSTANT DDL（加列秒级，元数据变更）、**变更分类分级**（instant 类直接做，大变更走工单 + 低峰 + 延迟监控 + 回滚预案）。',
              ],
            },
          ],
        },
        {
          id: 'be-stability-monitoring',
          title: '监控告警体系怎么搭？SLI/SLO 和黄金指标是什么？',
          difficulty: 'intermediate',
          tags: ['监控', 'SLO', '可观测'],
          points: [
            '三层监控：**资源层**（CPU/内存/磁盘/网络——Node Exporter）、**中间件层**（QPS/连接池/堆积/主从延迟）、**应用与业务层**（接口 RT/QPS/错误率 + **业务指标**：下单成功率、支付量——业务指标往往是故障的第一信号，机器指标可能全绿但业务已崩）。',            '**黄金四信号**（Google SRE）：**延迟**（成功与失败请求的 RT 分开看）、**流量**、**错误**（显式失败 + 隐式降级）、**饱和度**（资源水位：连接池、队列深度）。RED（Rate/Error/Duration）用于服务，USE（Utilization/Saturation/Errors）用于资源。',            '**SLI/SLO**：SLI 是指标（如"1 分钟窗口内 P99 < 200ms 的请求占比"），SLO 是目标（99.9%），**错误预算 = 1 - SLO** 是灰度/发布的刹车（预算烧完就冻结发布修稳定性）——SRE 的核心方法论：用预算量化"多可靠才算够"，避免无限追求 100%。',            '告警治理：**告警必须可行动**（收到后知道做什么，否则删）、多窗口烧速率告警（1h 窗口抓快烧、6h 窗口抓慢烧，防告警风暴与漏报）、值班 on-call 与升级链、**告警即工单闭环**（每周回顾误报率）——告警疲劳是可用性事故的温床。',          ],
          followUps: [
            {
              question: '为什么平均值会骗人？监控为什么必须看分位数？',
              points: [
                '平均值掩盖长尾：1% 的请求 10 秒、99% 的 100ms，均值仍是 200ms"健康"——但那 1% 用户可能正好全是付费用户。',
                '分位数（P95/P99/P999）才反映体验；注意**多实例分位数不能直接平均**（要 histogram 聚合后重算，Prometheus histogram_quantile 的正确用法），客户端到服务端的每一跳都有尾部放大（扇出调用让 P99 复合恶化，The Tail at Scale 的核心结论）。',
              ],
            },
          ],
        },
        {
          id: 'be-stability-postmortem',
          title: '线上故障的应急处理流程和复盘方法是什么？',
          difficulty: 'intermediate',
          tags: ['故障处理', '复盘'],
          points: [
            '应急优先级：**先恢复业务，再定位根因**。三板斧按序尝试：**回滚**（最近变更是首要嫌疑，回滚最快最有效）→ **降级/开关**（关闭嫌疑非核心功能）→ **重启/切流**（摘除故障实例机房）。处理中持续通报（时间线：发现/响应/决策/恢复），指挥权明确——**单点指挥，多人执行**。',            '定位手段：变更关联（发布/配置/运营活动时间线对齐）、监控下钻（从业务指标 → 服务 RED → 依赖 → 资源）、trace 抽样看异常请求、日志聚合检索。**避免"边定位边乱动"**：每次干预要记录，防止叠加变更把现场搅浑。',            '**复盘（Postmortem）**：24-48 小时内，时间线还原（每个决策点）、根因分析（**5 Why 挖到机制层**：不是"代码有 bug"，而是"为什么这类 bug 能上线、为什么没有监控发现、为什么花了 40 分钟才恢复"）、影响量化（时长/资损/用户量）、**Action 项必须带负责人与截止时间**并跟踪关闭。',            '文化原则：**Blameless（对事不对人）**——惩罚个人只会让人隐瞒问题；系统性改进（流程、自动化、监控）才防复发。故障是学费，复盘不落地的故障才是白交。',          ],
          followUps: [
            {
              question: '什么是 MTTR 和 MTBF？为什么现代稳定性更强调 MTTR？',
              points: [
                'MTBF 平均无故障时间、MTTR 平均恢复时间。分布式大规模系统里故障是常态（部件级故障每天发生），**追求永不故障（MTBF→∞）成本失控**，工程重心转向"快速发现、快速恢复"（MTTR 压到分钟级）。',
                '支撑手段：自动化故障检测（异常检测替代静态阈值）、一键回滚/切流、混沌工程常态化验证恢复路径、预案平台化——可用性 = 1 - 故障次数 × MTTR / 总时间，两头都要压。',
              ],
            },
          ],
        },
        {
          id: 'be-stability-rt-triage',
          title: '线上接口突然变慢，你的排查路径是什么？',
          difficulty: 'intermediate',
          tags: ['性能排查', 'RT', '稳定性'],
          points: [
            '先定性：**全局还是个例**（监控 P99 对比个别 trace）、**突变还是渐变**（突变先对齐变更时间线：发布/配置/数据量/上游流量，渐变查容量与数据增长）、**本服务还是依赖**（trace 树看耗时落在哪一跳：自身计算、下游 RPC、DB、缓存、MQ）。',
            '资源层四板斧：CPU（火焰图区分业务计算与 GC/锁自旋）、内存（GC 频次与停顿、有无 Full GC）、IO（磁盘 util、网络重传/带宽）、**连接**（DB/Redis 连接池打满等待——"慢"常常是"等"不是"算"）。',
            '依赖层逐一排除：缓存命中率是否下跌（miss 尖峰是 RT 毛刺第一嫌疑）、DB 慢查询（慢日志 + explain）、下游限流/重试放大、线程池排队。',
            '常见根因清单：发布引入（慢 SQL/序列化变化/新依赖）、缓存集体过期、定时任务抢资源、数据量越阈值、连接池配小、GC 参数不适配容器内存、TCP 重传。',
            '恢复与沉淀：先按预案止血（扩容/回滚/降级）再定位；把案例沉淀为监控项与告警（连接池等待、缓存命中率），避免二次踩坑——与故障复盘的 Action 闭环衔接。',
          ],
          followUps: [
            {
              question: '只有 1% 的请求偶发毛刺、均值看不出来，怎么抓？',
              points: [
                '分位数监控 + 按耗时排序拉慢请求明细，对比慢/正常请求的差异（缓存层级、路由实例、时间分布）。',
                '常见偶发源：GC 停顿（对齐时间线）、缓存过期重建（击穿）、定时任务、TCP 重传、容器噪声邻居、锁竞争。',
              ],
            },
          ],
        }
      ],
    },
  ],
}