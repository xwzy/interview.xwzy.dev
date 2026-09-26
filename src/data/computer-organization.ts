import type { Track } from '../types'

export const computerOrganizationTrack: Track = {
  id: 'computer-organization',
  name: '计算机组成原理',
  icon: '🔌',
  tagline: '从补码、流水线到 Cache 一致性的硬件底座',
  description:
    '向下理解硬件：数据的表示与运算、CPU 流水线与分支预测、存储层次与缓存一致性、中断与 DMA——性能优化与疑难排查的最终解释权都在这里。',
  color: 'pink',
  topics: [
    {
      id: 'co-data',
      name: '数据的表示与运算',
      description: '补码、浮点数、位运算与字节序——数字在机器里的真实样子，以及各种"精度怪谈"的根源。',
      references: [
        { label: 'IEEE 754: 2019 浮点算术标准官网', url: 'https://ieeexplore.ieee.org/document/8766229' },
        { label: 'What Every Computer Scientist Should Know About Floating-Point Arithmetic', url: 'https://docs.oracle.com/cd/E19957-01/806-3568/ncg_goldberg.html' },
      ],
      questions: [
        {
          id: 'co-data-complement',
          title: '为什么计算机用补码表示整数？补码加法溢出如何判断？',
          difficulty: 'basic',
          tags: ['补码', '溢出', '定点数'],
          points: [
            '补码一套电路同时解决三件事：**减法变加法**（a - b = a + [-b]补，无需减法器）、**0 唯一表示**（原码/反码有 +0/-0 两个 0）、**表示范围不对称且多一个负数**（8 位：-128 ~ +127）。',
            '定义：正数补码=自身；负数补码 = 反码 + 1，等价于"取反加一"，也等价于**模减绝对值**（2^n - |x|），理解成"模 2^n 的同余类"最不容易错。',
            '**溢出判断**：同号相加结果异号 → 溢出；硬件上用**双高位进位法**（次高位进位 ⊕ 最高位进位 = 1 即溢出）。无符号溢出则看最高位进位（CF 标志）。',
            'C/C++ 有符号溢出是 **UB（未定义行为）**，编译器可能依据此做强删检查等优化；无符号是模 2^n 回绕。写位运算密集代码时要清楚自己在哪个世界里。',
          ],
          followUps: [
            {
              question: '为什么 -(-128) 还是 -128？这类边界在代码审查中怎么防？',
              points: [
                '8 位下 +128 超出补码范围，回绕回 -128；C 中 `abs(INT_MIN)` 同样是 UB——负数范围比正数多 1 导致的对称性破缺。',
                '防御：对有符号极值操作前先做范围检查、升级到更宽类型再取负；静态分析器（UBSan、clang -fsanitize=signed-integer-overflow）接入 CI。',
              ],
            },
          ],
        },
        {
          id: 'co-data-float',
          title: 'IEEE 754 浮点数是怎么编码的？0.1 + 0.2 !== 0.3 的根本原因是什么？',
          difficulty: 'basic',
          tags: ['IEEE 754', '浮点数', '精度'],
          points: [
            '双精度 64 位 = **1 符号位 + 11 指数位（偏置 1023）+ 52 尾数位**（隐含前导 1，即 1.xxx × 2^e 的规格化形式）；指数全 0 表示非规格化数（渐进下溢），全 1 表示 ±Inf / NaN。',
            '根因：**二进制无法精确表示 1/10**（类似十进制写不下 1/3），0.1 存进去是无限循环被舍入，两个舍入值相加再舍入后恰好不等于 0.3 的舍入值。',
            '比较浮点要用**误差容忍**：`Math.abs(a - b) < epsilon`（或相对误差）；**相等判断、作为 Map key、金额累加**都是经典事故点。',
            '精度随数量级变化：double 有效数字约 15~16 位十进制，在 2^52 附近只能表示整数（Number.MAX_SAFE_INTEGER = 2^53 - 1）——JS 时间戳毫秒转纳秒后超界、雪花 ID 精度丢失都是这条线。',
            '金额场景用**整数最小单位（分）或 Decimal 库**，不要用浮点。',
          ],
          followUps: [
            {
              question: '为什么大数据系统里 float16/bfloat16 会流行？牺牲精度换来了什么？',
              points: [
                '深度学习对**动态范围**的敏感远大于**尾数精度**：bfloat16 保留 8 位指数（与 float32 同范围）砍尾数到 7 位，训练不发散且显存/带宽减半、矩阵吞吐翻倍。',
                '这是 IEEE 754"范围 vs 精度"权衡在体系结构上的直接应用：指数决定量级安全，尾数决定累积误差。',
              ],
            },
          ],
        },
        {
          id: 'co-data-endian',
          title: '什么是大端和小端？网络字节序为什么是大端？如何判断本机字节序？',
          difficulty: 'basic',
          tags: ['字节序', '网络编程'],
          points: [
            '**大端**：高位字节存低地址（符合人的书写习惯，网络字节序/Java 虚拟机）；**小端**：低位字节存低地址（x86/ARM 默认，利于整数截断和类型双关）。',
            '判断：`union { uint32_t i; char c; }` 看 c 是否为 1，或直接读一段已知字节的内存。跨平台**序列化/网络协议/文件格式**必须显式转换（htons/htonl）。',
            '踩坑点：直接 memcpy 结构体/位域跨机传输、按字节解析二进制协议没做 ntohl、日志按内存 dump 读数"看着不对"。',
          ],
          followUps: [
            {
              question: '字节序对数据库和缓存系统有什么现实影响？',
              points: [
                '**按字节序比较 = 按数值比较（大端）**：LSM-tree/索引里把整数编码成大端字节串，就能直接用 memcmp 排序比较（LevelDB/RocksDB 的 key 编码技巧）；小端机器上需要先翻转。',
                '这也是"序列化格式要规定字节序"的落地案例：Protocol Buffers 统一小端 varint，固化了跨平台行为。',
              ],
            },
          ],
        },
        {
          id: 'co-data-char-encoding',
          title: '字符编码是怎么回事？ASCII、GBK、Unicode、UTF-8/UTF-16 是什么关系？',
          difficulty: 'basic',
          tags: ['字符编码', 'Unicode', 'UTF-8', '乱码'],
          points: [
            '三层概念先分清（乱码问题的万恶之源就是混着说）：**字符集**（给每个字符编个号：Unicode 码点 U+4E2D）与**编码方式**（号码怎么存成字节：UTF-8/UTF-16/GBK）是两回事——Unicode 是字符集标准，UTF-8/16 是它的编码实现。',
            '**演进史一条线**：**ASCII**（7 位 128 个，英文够用）→ 各国自造扩展（中文 **GBK**：两字节表汉字，与日文 Shift-JIS 等互不兼容——"锟斤拷"这类乱码就是多字节解码错位叠加 � 产生的连锁错）→ **Unicode**（统一字符表，目前 15 万+ 字符）+ **UTF-8/16/32** 三种存储方案。',
            '**UTF-8（变长 1~4 字节）的精妙**：ASCII 完全兼容（英文 1 字节）；首字节前导位自报长度（0xxxxxxx / 110xxxxx 10xxxxxx…），**解析无歧义且容错**（错一个字节不污染后续字符）；字节序无关（无 BOM 争议）。**UTF-16**：基本平面 2 字节、增补平面（emoji、生僻字）用**代理对**4 字节；Windows/Java/JS 内部字符串是 UTF-16。选型现实：**网络与存储事实标准是 UTF-8**（HTML、JSON、协议默认）。',
            '**乱码的原理一句话：用 A 编码写入、用 B 编码解读**——文件本身没有"自带编码标签"（除非 BOM/charset 声明），解码端猜错就花。排乱码的顺序：确认**存储编码**（hexdump 看字节）→ 确认**解码声明**（HTML charset / HTTP Content-Type / DB 连接字符集 / 文件 BOM）→ 让两端对齐；"中文变问号"（有损转码丢信息）与"变锟斤拷"（可修复的双向错位）要能区分。',
          ],
          followUps: [
            {
              question: '为什么 JS 里 emoji 的 length 是 2？"𝕏".length 呢？',
              points: [
                'JS 字符串是 **UTF-16 码元序列**，`length` 数的是 16 位码元：增补平面字符（emoji、𝕏）用**代理对**（两个码元）表示，所以 length = 2——"一个字符两种长度"是 UTF-16 的历史包袱；同理 `str[i]` 取半个字符会得到乱码、`substring` 可能切在代理对中间。',
                '正确姿势：按**码点**遍历用 `for...of` 或 `[...str]`（按码点迭代），`Array.from(str).length` 才是"人眼字符数"；再进一步，组合字符（é 可由 e + 重音符号合成）与 ZWJ 组合 emoji（👨‍👩‍👧 是多个码点）连码点计数也不等于视觉字符——要 **Intl.Segmenter** 按字素簇切分。前端处理用户输入长度校验时这三个层次的事故都真实存在。',
              ],
            },
          ],
        },
        {
          id: 'co-data-bitwise',
          title: '有哪些必须掌握的位运算技巧？它们的数学原理是什么？',
          difficulty: 'intermediate',
          tags: ['位运算', '技巧'],
          points: [
            '`x & (x - 1)`：清除最低位的 1 → 判断 2 的幂（结果为 0）、统计 1 的个数（循环）；`x & (-x)`：**取出最低位的 1**（lowbit，树状数组的基础）。',
            '`x ^ x = 0`、`x ^ 0 = x`、异或满足交换结合 → **找出现一次的数**、无临时变量交换（注意同一地址自交换会清零）；异或还是奇偶校验和 RAID5 的数学基础。',
            '乘除 2 的幂用 `<<` / `>>`：**有符号数右移是算术移位（补符号位）**，`x >> 1` 对负数是向下取整（-3 >> 1 == -2），与除法向零取整不同（-3 / 2 == -1）——经典陷阱。',
            '掩码与集合：用整数的每一位表示元素有无（权限系统、状态标志），`|` 加权限、`&` 查权限、`& ~` 去权限。',
            '现代实践提醒：**优先可读性**（编译器会把 `/4` 优化成移位），位技巧留给位图、哈希、协议解析等天然位级场景。',
          ],
          followUps: [
            {
              question: '布隆过滤器为什么用位图？误判率与位数组大小的关系怎么估？',
              points: [
                '位图用 1 bit 记录"可能存在"，配合 k 个哈希函数置位；查询任一位为 0 即"一定不存在"——空间效率 O(1) 每元素。',
                '误判率 p ≈ (1 - e^(-kn/m))^k，n 元素 m 位数：m = -n·ln p / (ln 2)²，k = (m/n)·ln 2 ≈ 0.7·m/n；这是"用可控假阳性换空间"的经典设计，缓存穿透防护、爬虫去重的标配。',
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'co-cpu',
      name: '指令系统与 CPU',
      description: '流水线、分支预测、乱序执行——理解代码为什么"看起来一样快慢不同"的微架构原因。',
      references: [
        { label: 'Agner Fog 的微架构优化手册', url: 'https://www.agner.org/optimize/' },
        { label: 'Intel 64 and IA-32 Architectures Software Developer Manuals', url: 'https://www.intel.com/content/www/us/en/developer/articles/technical/intel-sdm.html' },
      ],
      questions: [
        {
          id: 'co-cpu-pipeline-hazard',
          title: '指令流水线是如何提速的？三种流水线冒险分别怎么解决？',
          difficulty: 'intermediate',
          tags: ['流水线', '冒险', '前递'],
          points: [
            '把指令执行切成**取指 IF → 译码 ID → 执行 EX → 访存 MEM → 写回 WB** 五段重叠执行，理想加速比 ≈ 级数（吞吐提升，**单条指令延迟不变甚至略增**）。',
            '**结构冒险**：硬件资源冲突（如取指与访存抢同一存储）→ 分离 I-Cache/D-Cache、增加端口。',
            '**数据冒险**：后指令依赖前指令结果 → **前递/旁路（forwarding）** 把 EX/MEM 结果直接送给下一条的输入；load-use 冒险无法完全前递，需**流水线气泡（stall 一拍）**，编译器可指令重排填充。',
            '**控制冒险**：分支改变 PC → 分支预测（静态预测 + 动态预测器），预测错了要**冲刷流水线（flush）**，代价 10~20 周期——现代分支预测错了的代价远大于一次乘法。',
            '深流水线（Netburst 31 级）频率高但冲刷代价巨大，是"频率至上"路线失败的原因之一；现代主流 14~19 级，宽度（多发射）与深度平衡。',
          ],
          followUps: [
            {
              question: '为什么有序链表遍历比有序数组慢一个数量级？用流水线语言解释。',
              points: [
                '数组连续 → **硬件预取器**按 stride 预取、Cache 行满载利用；链表节点随机分布 → 每跳一次 pointer chasing 一次 **Cache miss（200+ 周期）**，流水线因数据冒险持续空转。',
                'CPU 对"数据依赖链"无能为力：乱序执行也必须等 load 返回，这就是"局部性决定性能"的微架构解释，也是高性能代码优先数组化/结构紧凑化的原因。',
              ],
            },
          ],
        },
        {
          id: 'co-cpu-branch-prediction',
          title: '分支预测为什么能做到 95%+ 准确率？错误的代价有多大？',
          difficulty: 'advanced',
          tags: ['分支预测', '性能'],
          points: [
            '现代预测器是**两级自适应 + TAGE 式历史标签表**：用全局/局部历史寄存器索引预测表，学习"这种历史模式下该分支的走向"；调用返回用**返回栈缓冲 RSB** 预测；间接跳转用 BTB 记录目标。',
            '错误代价 = **冲刷流水线 + 重新取指**，现代 CPU 约 15~20 周期；分支密集代码错误率 1% 与 10% 的性能差距可达数倍。',
            '经典案例：有序数组比无序数组求和快——排序后分支 100% 可预测；无序时 50% 错误率让流水线反复冲刷。同一份代码，**数据分布改变性能**。',
            '优化手段：把热分支放前（likely/unlikely）、**无分支化**（条件移动 cmov、查表、位掩码选择）、减少数据依赖分支（二分→分支树展开）、C++20 [[likely]]、PGO 反馈优化。',
          ],
          followUps: [
            {
              question: 'Spectre 攻击是怎么利用分支预测的？这说明预测器的安全边界在哪？',
              points: [
                '攻击让 CPU **推测执行**越界读（预测器认为分支不发生越界），把秘密数据编码进 cache 时间侧信道，事后预测错误回滚——**架构状态回滚了，但微架构状态（cache）留下了痕迹**。',
                '教训：预测器只优化性能不做权限检查，安全边界需要额外机制（array bounds clamp、retpoline、LFENCE 屏障、微码缓解）——性能机制成为攻击面是体系结构与安全的交叉常考题。',
              ],
            },
          ],
        },
        {
          id: 'co-cpu-ooo',
          title: '乱序执行是怎么工作的？它和"程序看起来按顺序执行"如何兼容？',
          difficulty: 'advanced',
          tags: ['乱序执行', '寄存器重命名', 'ROB'],
          points: [
            '前端按序取指译码成**微操作（µop）** → **寄存器重命名**消除假依赖（WAR/WAW，物理寄存器堆 > 架构寄存器）→ 进入 **保留站（RS）**，操作数齐备即发射（乱序执行）→ 结果写入**重排序缓冲 ROB** → **按程序顺序提交（in-order retire）**。',
            '对程序员的关键承诺：**异常与外部可见状态严格按序**——提交顺序保证架构结果与顺序执行一致；乱序只是内部的调度自由。',
            '**内存序是另一回事**：load 也可以乱序提前（允许 load-load 重排），单线程内靠**内存依赖预测**判断 load 是否依赖未完成的 store；跨线程可见性需要**内存屏障**，x86(TSO) 的内存模型强于 ARM（弱内存模型，允许更多重排、需要更多屏障），也是无锁代码要 volatile/atomic 的根因。',
            '性能启发：乱序窗口有限（几百 µop），**依赖链过长会让 CPU 无事可做**——拆依赖、独立计算交错、提高 ILP；缓存 miss 才是压垮乱序收益的大头。',
          ],
          followUps: [
            {
              question: '为什么说 volatile 在 Java 和 C 里是完全不同的东西？',
              points: [
                'C 的 volatile：禁止编译器优化掉读写，**不保证原子性、不建立线程间 happens-before、不插内存屏障**——只用于 MMIO/信号 handler 场景。',
                'Java 的 volatile：除可见性外还建立 **happens-before**（插入屏障禁止特定重排）且 long/double 读写原子——是并发原语。把 C 语义带进 Java 并发代码是最常见的误用之一。',
              ],
            },
          ],
        },
        {
          id: 'co-cpu-risc-cisc',
          title: 'RISC 和 CISC 的路线之争最后走向了什么？x86 是 RISC 还是 CISC？',
          difficulty: 'intermediate',
          tags: ['RISC', 'CISC', 'ISA'],
          points: [
            '哲学差异：**RISC**（ARM/RISC-V）指令定长、Load/Store 架构（只有访存指令碰内存）、指令数少编码规整 → 译码简单、流水线友好、功耗低；**CISC**（x86）指令变长、指令可带内存操作数、指令集庞大（兼容包袱）。',
            '现代归宿：x86 前端把复杂指令**翻译成类 RISC 的微操作（µop）**再乱序执行，内部早已 RISC 化；而 ARM/RISC-V 也加入了复杂指令（SIMD、原子扩展）——**前端 ISA 与后端微架构解耦**，之争收敛为"生态与功耗的竞争"。',
            'µop cache 的出现让"译码"成本被缓存吸收：热点指令直接从 µop cache 取，绕过译码器——这是前端为乱序核供料的吞吐瓶颈解法。',
            'RISC-V 的启示：ISA 作为**开放标准 + 模块化扩展**（基础指令集 + 可选扩展），正在改变指令集的商业模式。',
          ],
          followUps: [
            {
              question: '为什么 Apple Silicon（ARM）能在功耗比上反超 x86？ISA 之外还有什么因素？',
              points: [
                'ISA 本身贡献有限，更大的差异来自**微架构与垂直整合**：超宽解码（8+ 宽）、大 ROB、统一内存（UMA 低延迟高带宽）、自研 SoC 不背多代兼容包袱、领先制程优先供应。',
                '结论口径：ISA 决定"能说什么话"，微架构决定"脑子多快"，制程决定"功率多少"——三者叠加才是最终性能功耗比。',
              ],
            },
          ],
        },
        {
          id: 'co-cpu-simd',
          title: 'SIMD 为什么能大幅加速计算？什么情况下向量化会失败？',
          difficulty: 'advanced',
          tags: ['SIMD', '向量化', 'AVX'],
          points: [
            'SIMD 一条指令处理**一个宽寄存器里的多个数据**（AVX2：256 bit = 8 个 float；AVX-512：512 bit = 16 个），配合数据并行场景（图像、矩阵、过滤求和）获得数倍~数十倍吞吐。',
            '获取途径：编译器**自动向量化**（-O3 -march=native，写"向量化友好"代码）、intrinsics 手写（_mm256_add_ps）、成熟库（Eigen、SimdJSON 的 parse 数 GB/s 靠它）。',
            '常见失败原因：**分支内部**（数据依赖 if → 改 select/掩码）、**别名/非对齐**（指针可能指向同一内存、未对齐 load）、**gather/scatter**（随机下标访问代价高）、**缩短数据宽度反而降频**（AVX-512 部分实现降频，需分块）。',
            '验证手段：编译报告（-fopt-info-vec / -Rpass=loop-vectorize）、perf 看 FP 峰值利用率——"写了向量化代码"和"真的在向量化"是两回事。',
          ],
          followUps: [
            {
              question: '为什么 GPU 和 SIMD 都是数据并行，适用边界却不同？',
              points: [
                'SIMD：**CPU 内**细粒度并行，适合规则、短向量、与控制流混合的计算，共享大缓存；GPU：**上千线程**的 SIMT + 线程级并行，靠海量并发隐藏显存延迟，要求算术强度高、分支一致性好的大规模规则计算。',
                '选择信号：数据量 MB 级、批量小 → SIMD；GB 级、独立并行、容忍传输成本 → GPU；CPU 空闲且计算规则 → SIMD 常是零架构成本的首选。',
              ],
            },
          ],
        },
        {
          id: 'co-cpu-perf-equation',
          title: '程序的性能由什么决定？用 CPU 时间公式把优化路径讲清楚。',
          difficulty: 'intermediate',
          tags: ['性能公式', 'CPI', '优化'],
          points: [
            'CPU 时间 = **指令数 IC × CPI × 时钟周期**（1/主频）。三条优化轴：减少指令数（算法、消除冗余）、降低 CPI（提高 ILP、减少分支错预测和 cache miss、向量化一条指令顶多条）、提升主频（受功耗墙限制，基本不可控）。',
            '工程推导：算法复杂度决定 IC 的数量级；**cache miss 一次 ≈ 几百周期，贡献了 CPI 的大头**——所以"先数据结构后微优化"是有公式支撑的（改善局部性直接降 CPI）。',
            '实测闭环：基准测试（防止被分支预测/缓存预热骗）→ perf stat 看 IPC、cache-misses、branch-misses → 火焰图定位热点 → 对照公式判断优化的是哪一项 → 回归验证。',
            '阿姆达尔定律兜底：优化收益 = 1 / ((1-p) + p/s)，**只优化占比大的部分**——先看 profile 再动手，避免优化 2% 的路径。',
          ],
          followUps: [
            {
              question: 'IPC 高一定代表程序快吗？什么情况下 IPC 高反而要警惕？',
              points: [
                '不一定：IPC 衡量每周期指令数，不含指令"做了多少有效工作"——一条向量指令和四条标量指令完成同样工作，IPC 反而下降但更快。',
                'IPC 异常高还可能是**在空转**（自旋锁 busy loop 指令简单流水线顺畅）；结合 wall time、retiring/LLC miss 等顶层指标（top-down analysis）判断 CPU 到底在干活还是在等数据。',
              ],
            },
          ],
        },
        {
          id: 'co-cpu-instruction-cycle',
          title: 'CPU 内部由哪些部件组成？一条指令的执行周期是怎样的？冯·诺依曼瓶颈是什么？',
          difficulty: 'basic',
          tags: ['CPU 结构', '指令周期', '冯诺依曼'],
          points: [
            '冯·诺依曼结构五大件：**运算器（ALU）**、**控制器**（PC + 译码 + 控制信号）、**存储器**、输入输出——核心思想是**存储程序**：指令与数据同存内存、按地址访问。',
            '关键寄存器分工：**PC** 存下一条指令地址、**IR** 存当前指令、通用寄存器堆放操作数、FLAGS 记录溢出/进位/零标志——“PC 取指 → IR 译码 → ALU 执行 → 写回”是所有 CPU 的最小循环。',
            '执行周期：**取指（PC 自增）→ 译码 → 取操作数 → 执行 → 写回/访存**；不同指令周期数不同（寄存器加法 1 周期、除法几十周期）——流水线就是让多条指令的阶段重叠。',
            '**冯·诺依曼瓶颈**：指令与数据共用一条内存通路，CPU 再快也要等内存——Cache 层次、L1I/L1D 分离（哈佛结构思想）都是为绕开它。',
            '衔接现代 CPU：教科书 CPU 对应真实芯片的前端（取指译码），后端还有乱序执行、分支预测、多级缓存——答基础题时点一句“真实 CPU 在这之上做了什么”，自然过渡到进阶追问。',
          ],
          followUps: [
            {
              question: 'L1 的 I-Cache/D-Cache 为什么分开？L2/L3 又为什么合一？',
              points: [
                '分开消除取指与访存抢端口的结构冒险，且指令流/数据流访问模式不同、各自命中率更高。',
                'L2/L3 求容量与利用率、取指带宽压力已被 L1 化解——“L1 求快分、L2/L3 求大合”。',
              ],
            },
            {
              question: '操作系统“陷入内核”在这台 CPU 的部件上对应什么？',
              points: [
                '系统调用/中断就是 PC 被硬件强制指向向量表/系统调用入口、特权级切 Ring 0、内核栈保存现场——“陷入”的本质是 PC 被替换。',
                '进程切换 = 保存/恢复 PC 与寄存器堆，缺页 = 访存阶段触发异常——OS 机制最终都落在“改 PC、换映射、存现场”。',
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'co-memory-cache',
      name: '存储层次与 Cache',
      description: '局部性、Cache 映射与一致性、伪共享与 NUMA——绝大多数"莫名其妙慢"的答案。',
      references: [
        { label: 'Latency Numbers Every Programmer Should Know（延迟数字速查）', url: 'https://gist.github.com/jboner/2841832' },
        { label: 'MESI / 缓存一致性 — Wikipedia', url: 'https://en.wikipedia.org/wiki/MESI_protocol' },
      ],
      questions: [
        {
          id: 'co-mem-hierarchy-locality',
          title: '存储金字塔为什么必然存在？局部性原理如何决定程序性能？',
          difficulty: 'basic',
          tags: ['存储层次', '局部性', 'Cache'],
          points: [
            '速度与容量不可兼得：寄存器 ~0.3ns / L1 ~1ns (32-64KB) / L2 ~4ns (256KB-2MB) / L3 ~15-40ns (几-几十 MB) / 内存 ~100ns (GB) / SSD ~100µs / 磁盘 ~10ms——每层差一个数量级，**金字塔是经济与物理的共同解**。',
            '可行性的根基是**局部性**：**时间局部性**（刚访问的会再访问）与**空间局部性**（邻居会被访问）——程序行为可预测，小缓存才能高效掩护大内存。',
            '对应写法：时间局部性 → 复用数据前别让缓存被踢（分块 tiling）；空间局部性 → **按内存布局顺序访问**（行遍历 vs 列遍历差数倍）、结构体按字段大小排布减少 padding、热数据紧凑（SoA vs AoS）。',
            '数量级直觉必须刻进脑子：**一次 L3 miss ≈ 上百次 L1 命中的时间**，一次磁盘寻道 ≈ 十万次内存访问——架构设计里"少一次跨网络/跨磁盘"永远优先于微优化。',
          ],
          followUps: [
            {
              question: '同样是 O(n) 遍历，为什么 int[] 比 LinkedList<Integer> 快 10 倍以上？',
              points: [
                '数组连续：每个 cache line 64B 装约 16 个 int，**一次 miss 服务 16 次访问**，预取器还按规律提前取。',
                '链表每个节点独立分配：每次 next 都可能 miss（20-200 周期），且节点头带元数据浪费缓存——"渐进复杂度相同，机器友好度天差地别"的标准案例。',
              ],
            },
          ],
        },
        {
          id: 'co-mem-tlb',
          title: '从虚拟地址到物理地址：MMU、多级页表与 TLB 是如何配合的？大页为什么快？',
          difficulty: 'intermediate',
          tags: ['MMU', 'TLB', '地址翻译'],
          points: [
            '先看没有缓存时的代价：**每一次内存访问都要先做地址翻译**——x86-64 的四级页表意味着**一次访存要额外读 4 次内存**（逐级查页目录），翻译本身比访存还贵 4 倍。这个矛盾决定了必须有硬件缓存加速，就是 **TLB（Translation Lookaside Buffer）**。',
            '**完整翻译流水线（本题的主线）**：CPU 发出虚拟地址 → **MMU 先查 TLB**（全相联的高密度缓存，存"虚拟页号 → 物理页帧 + 权限位"）→ **TLB 命中**直接拼出物理地址（几十纳秒级）→ 未命中才走**页表遍历（page walk）**：从 CR3 寄存器指向的一级页表逐级索引，最后一级才拿到页帧号，结果**写回 TLB**（驱逐按 LRU 类策略）。TLB 命中率通常 99%+，程序才能跑得快——这就是**局部性原理在地址翻译层的兑现**（与 Cache 题同源）。',
            '**多级页表解决的是页表自身的空间**：单级页表映射 48 位地址空间需要天文数字的表项；四级结构让**没用到的大段地址空间连下级表都不存在**（页目录项标记不存在即可），页表按需分配——"用多一跳查询换省 512 倍的空间"。分工注记：页表的**结构与缺页处理**见操作系统方向的页表/缺页题（软件视角），本题聚焦**硬件翻译路径与性能**（组成原理视角）。',
            '**大页（Huge Page）为什么是性能杠杆**：2MB 大页把翻译单位从 4KB 提高 512 倍——**同样的 TLB 表项覆盖 512 倍的地址范围**（TLB 覆盖度 shoot up），大内存应用（数据库、JVM 大堆）的 TLB miss 显著下降（miss 一次要走 4 级页表+访存，代价极高）；页表本身也省（一级大页项直接覆盖 2MB）。代价：内碎片变大、需要 THP（透明大页）或 hugetlbfs 显式管理，数据库部署手册里的大页配置就是这道题的工程落点。',
          ],
          followUps: [
            {
              question: '进程切换时 TLB 怎么处理？ASID 是解决什么问题的？',
              points: [
                '朴素做法：切进程**整个 TLB 作废**（flush）——因为虚拟地址是各进程私有的，旧进程的翻译对新进程是错误答案。代价是切换后 TLB 冷启动，一段时间内地址翻译全部走慢速 page walk——这也是**上下文切换真实开销**的一部分（与 OS 方向的切换成本题互相印证）。',
                '**ASID（Address Space Identifier）**给每个 TLB 表项打上进程标签，切换时不用 flush，硬件按 ASID 过滤——不同进程的翻译共存于 TLB。x86 传统上靠 PCID（近年才用起来）实现，ARM/RISC-V 则一直把 ASID 当标配——能对比出"为什么服务器切换频繁场景下 PCID 对性能敏感"，就超出了背书水平。',
              ],
            },
          ],
        },
        {
          id: 'co-mem-cache-mapping',
          title: 'Cache 的地址映射方式有哪些？组相联为什么是工程折中的胜利？',
          difficulty: 'advanced',
          tags: ['Cache', '组相联', '替换策略'],
          points: [
            '地址切三段：**Tag | 组号 Index | 块内偏移 Offset**（64B 一行）。三种映射：**直接映射**（每组 1 行：硬件最简，但两热数据映射同组会反复互踢——thrashing）、**全相联**（任意放：命中率高，但比较器爆炸只用于 TLB）、**组相联**（每组 N 路：折中，L1D 常 8~12 路，L2/L3 更多路）。',
            '命中判定：按 index 找组 → 并行比较组内 N 路的 tag 和有效位 → 命中取数；miss 则按**替换策略**选 victim（真 LRU 硬件太贵，用伪 LRU/随机；Intel 部分核可编程）。',
            'Cache 行 64B 的含义：**空间局部性的兑换单位**，也是伪共享的根源；对齐访问（alignas、CPU cache line 对齐分配）避免跨行双倍开销。',
            '经典故障模式：**数组大小是 2 的幂 × 步长相同** → 直接映射下循环互踢（改成非 2 的幂尺寸 + 填充可解）；多线程读同一"常量数组"本无竞争，映射冲突也可能拖慢。',
          ],
          followUps: [
            {
              question: 'Cache miss 分为冷、容量、冲突三类，优化手段分别是什么？',
              points: [
                '**冷启动 miss（compulsory）**：第一次访问，用预取（硬件 stride 预取、软件 __builtin_prefetch / prefetchw）与大页减少 TLB miss 叠加。',
                '**容量 miss（capacity）**：工作集超过缓存 → 分块（tiling/blocking）、减小工作集、溢出部分下沉到 L3 友好的布局。',
                '**冲突 miss（conflict）**：映射碰撞 → 数据重排、填充/对齐、换更大相联度的层级承载热点。perf c2c 和 cachegrind 能把三类 miss 量化出来。',
              ],
            },
          ],
        },
        {
          id: 'co-mem-cache-write',
          title: '写命中和写缺失分别有哪些处理策略？数据库为什么爱用 WAL？',
          difficulty: 'advanced',
          tags: ['写策略', 'write-back', 'WAL'],
          points: [
            '写命中两策略：**写直达 write-through**（同时写 cache 和下级：一致性简单、写带宽压力大）vs **写回 write-back**（只改 cache 标脏位，换出时刷回：省带宽，主流选择）。',
            '写 miss：**写分配 write-allocate**（拉进行再写，配合 write-back，适合重用）vs **非写分配 no-write-allocate**（直接写下级，适合写一次不复用）；常规组合：write-back + write-allocate。',
            '写缓冲 store buffer：store 先入缓冲异步合并下刷，让 CPU 不必等写完成——代价是**本核 store load 重排**的可见性问题，屏障（sfence/mfence）强制排空。',
            'WAL（Write-Ahead Log）把随机写转**顺序追加写**：顺序写天然对磁盘/cache/预取友好，再异步合并刷数据页——MySQL redo log、LSM-tree、Kafka 分区日志同一思想：**用顺序性购买持久化吞吐**。',
          ],
          followUps: [
            {
              question: '为什么顺序写在 HDD 和 SSD 上都快，但原因不同？',
              points: [
                'HDD：寻道 + 旋转延迟 ~10ms/次，顺序写摊薄了机械成本——瓶颈在**机械定位**。',
                'SSD：无寻道，但随机小写触发**写放大**（擦除按 block、写入按 page，GC 搬运有效页）与 FTL 映射碎片；顺序大写对齐擦除单元，写放大趋近 1——瓶颈在**闪存介质管理**。',
                '共同结论：把随机变顺序是存储优化的第一性原理。',
              ],
            },
          ],
        },
        {
          id: 'co-mem-mesi',
          title: '多核之间如何保证缓存一致？MESI 协议的状态机和性能陷阱是什么？',
          difficulty: 'advanced',
          tags: ['MESI', '缓存一致性', '伪共享'],
          points: [
            '每条 cache line 四状态：**M**odified（独有且脏）、**E**xclusive（独有且净）、**S**hared（多核共享只读）、**I**nvalid（失效）；一致性消息（Read/Invalidate/...）在核间总线上传播。',
            '关键行为：核 A 要**写**一行 → 先发 Invalidate 让其他核的副本失效，拿到 M 态才写；核 B 之后读 → A 把 M 性行降级回 S 并**提供数据**（snoop 响应，可能比内存还快）。',
            '性能陷阱一：**伪共享**——两个热变量落在同一 64B 行，两核交替写 → 行在 M/S 间乒乓（ coherence traffic 打满互联），性能掉一个数量级；解法：**每线程独占 cache line（alignas(64)、@Contended、padding）**，perf c2c 直接定位。',
            '性能陷阱二：跨核失效/数据转移有几十上百周期延迟，**共享可写数据本身就是反模式** → 改为线程本地累积、批量合并、分片计数（LongAdder 思路：基准 + 分散 cell）。',
            '工程视野：MESI 保证的是**单变量读写原子可见**，复合操作（i++）仍需锁/CAS；x86-TSO 在 MESI 之上提供较强的存储序，ARM 更弱——写跨平台无锁代码必须显式 atomic。',
          ],
          followUps: [
            {
              question: '为什么单线程 Redis 不需要考虑这些，而多线程计数器要小心伪共享？',
              points: [
                '单线程内所有数据天然只有核上的一份缓存视图，一致性协议零流量；它的并行度损失用事件驱动 + IO 多路复用弥补。',
                '多线程共享写的每一条路径都在消费一致性带宽：能"分而治之"（分片、线程本地）就不要"共享可写"，这是把 MESI 成本从设计上移除，而不是事后调优。',
              ],
            },
          ],
        },
        {
          id: 'co-mem-numa',
          title: 'NUMA 是什么？为什么跨节点的内存访问会慢？多线程服务怎么适配？',
          difficulty: 'advanced',
          tags: ['NUMA', '内存分配', '绑核'],
          points: [
            'UMA（对称多核共享一条内存总线）扩展性到头后，服务器改为 **NUMA**：每个 CPU 节点有本地内存，跨节点访问走 QPI/UPI 互联，延迟 1.5~2 倍且争用共享链路带宽。',
            '内核策略：**首次触碰（first-touch）分配**——内存归谁先写谁所在节点；线程在节点间迁移会让"本地内存"变"远端内存"，long term 的性能漂移。',
            '适配手段：**numactl 绑节点**、线程池按节点划分（每个 NUMA 节点独立处理子集数据，即"数据跟着核走"）、本地内存分配（numa_alloc_onnode）、大页 + 预触碰（初始化时摸一遍内存把页钉在本地节点）。',
            '观测：`numactl --hardware` 看拓扑、`numastat` 看远端命中率；数据库/大数据机器上"CPU 没满但吞吐上不去"很多时候是远端访存 + 互联饱和。',
          ],
          followUps: [
            {
              question: 'Kubernetes/云原生环境里 NUMA 效应会以什么形式劣化服务？',
              points: [
                '默认调度器只保证 CPU/内存数量，不感知拓扑：Pod 的 CPU 可能分散在两个节点，而内存全分在其中一个 → 一半计算永远远端访存。',
                '解法：CPU Manager 静态策略 + Topology Manager（single-numa-node）把独占型工作负载的 CPU 与设备/内存钉在同一节点；延迟敏感服务配 guaranteed QoS + 独占核。',
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'co-bus-io',
      name: '总线、中断与外设',
      description: '中断、DMA、总线与启动过程——从按下电源到内核接管之间发生了什么。',
      references: [
        { label: 'Linux 内核文档: DMA API', url: 'https://www.kernel.org/doc/html/latest/core-api/dma-api-howto.html' },
        { label: 'OSDev Wiki（启动与硬件细节）', url: 'https://wiki.osdev.org/Main_Page' },
      ],
      questions: [
        {
          id: 'co-bus-interrupt',
          title: '一次硬件中断的完整过程是怎样的？为什么网络高吞吐场景要关心中断亲和性？',
          difficulty: 'intermediate',
          tags: ['中断', '软中断', '网络'],
          points: [
            '过程链：设备产生中断信号 → **中断控制器**（APIC）裁决优先级并路由 → CPU 完成当前指令后响应，**保存现场、关中断、查中断向量表**执行 ISR → ISR 尽量短（顶半部），耗时工作抛给**软中断/工作队列（底半部）** → 恢复现场返回被打断的上下文。',
            '**顶半部/底半部**设计：硬中断要快（长时间关中断会让其他中断变迟），Linux 网络包处理中硬中断只做"标记+触发 NAPI"，收包轮询放在软中断（NET_RX）里做。',
            '高吞吐问题：网卡多队列把中断固定到 CPU0 → 一个核软中断 100% 而 others 空闲。解法：**中断亲和性（/proc/irq/*/smp_affinity）把队列分散到各核**，并与处理该队列的线程做 RSS/RPS 对齐，提高缓存命中。',
            '实时性视角：中断随时抢占进程，延迟敏感服务用 `irqbalance` 关闭 + 手动隔离（isolcpus）+ 线程化中断（threadirqs）把不确定性收敛。',
          ],
          followUps: [
            {
              question: '软中断负载过高时，为什么"加机器"有时无效？瓶颈怎么定位？',
              points: [
                '如果所有网卡的 RX 队列都亲和到少数几核，加机器（加核）不改变中断分布，软中断热点依旧——先看 `/proc/softirqs` 增速与 `mpstat -P ALL` 的 %soft 分布。',
                '定位顺序：中断是否分散（亲和性）→ 单核软中断是否顶格（NAPI budget、GRO 配置）→ 是否包数而非字节数是瓶颈（小包 pps 场景，开 RSS 多队列 + 调 budget）；容器环境还要确认宿主机层面没有热点。',
              ],
            },
          ],
        },
        {
          id: 'co-bus-dma',
          title: 'DMA 是如何工作的？为什么说"零拷贝"的一半功劳属于 DMA？',
          difficulty: 'intermediate',
          tags: ['DMA', '零拷贝', '总线'],
          points: [
            'DMA 控制器可以在**不占 CPU** 的情况下在外设与内存之间直接搬数据：CPU 配置（源、目的、长度）后启动，传输完成以**中断**通知——CPU 期间可执行其他任务。',
            '网络收包路径：网卡 DMA 数据直接写入**预注册的环形缓冲区（ring buffer）**内存 → 硬中断通知 → 协议栈处理；没有 DMA 的话每个包都要 CPU 亲自从设备端口读，吞吐骤降。',
            '约束与代价：DMA 只认**物理连续、可被设备寻址的内存** → 需要一致性/流式 DMA 映射（dma_map_*)，CPU 与设备缓存需手动同步；IOMMU 让设备看到虚拟化的 IO 地址，提供隔离（设备无法 DMA 到任意内存）。',
            '现代延伸：**RDMA** 把协议栈开销也卸载到网卡（内核旁路，微秒级延迟）；**DPDK** 完全绕过内核轮询收包；NVMe 的多队列 DMA 支撑百万 IOPS——"把数据搬运从 CPU 手里拿走"是高性能 IO 的主旋律。',
          ],
          followUps: [
            {
              question: '为什么大文件传输时 CPU 占用率反而低？如果不走 DMA 会发生什么？',
              points: [
                'sendfile 场景数据由 DMA 磁盘→页缓存、DMA（SG）→网卡，CPU 只做描述与控制，占用率自然低；程序性 copy 则 CPU 占用与带宽线性相关。',
                '无 DMA 时 CPU 需要 programed IO 逐字搬，每个字节占 CPU 若干周期：千兆网都难以打满，CPU 会先成为瓶颈——这是"协议卸载/总线带宽 vs CPU 算力"平衡的直观例子。',
              ],
            },
          ],
        },
        {
          id: 'co-bus-mmio',
          title: 'CPU 是怎么和设备"说话"的？MMIO 和端口 IO 有什么区别？',
          difficulty: 'advanced',
          tags: ['MMIO', 'PIO', '设备模型'],
          points: [
            '两种编址：**端口 IO（PIO）**：x86 独立的 I/O 地址空间，in/out 指令访问，空间小（64KB）但翻译简单；**内存映射 IO（MMIO）**：设备寄存器映射进物理地址空间，用普通 load/store 访问，地址空间大、可复用全部寻址与缓存机制，现代设备主流。',
            'MMIO 的特殊语义：这些地址**没有缓存**（映射为 uncachable/强序），每次读写直达设备寄存器——对它的"读"可能有副作用（清中断标志），编译器不得优化（C 里要 volatile）。',
            '设备交互模型：**寄存器（控制/状态/数据）+ 中断 + DMA** 三件套；轮询 vs 中断是延迟与 CPU 占用的权衡（DPDK 选轮询、普通网卡选中断）。',
            'IOMMU/VT-d 补齐安全：设备 DMA 也能走"IO 页表"，实现用户态驱动（VFIO）、设备直通虚拟机而不逃逸内存。',
          ],
          followUps: [
            {
              question: '从用户态 write 一个字节到网卡发出，中间经过哪些层？哪些在 CPU 上、哪些在设备上？',
              points: [
                '系统调用（CPU，切内核）→ 协议栈组包/skb（CPU）→ 驱动把包挂上 ring buffer 的 tx 描述符（CPU，写内存）→ **MMIO 敲门铃寄存器通知网卡**（CPU 发起，设备响应）→ 网卡 DMA 读描述符和数据（设备）→ 组帧发PHY（设备）→ 完成中断（设备→CPU）。',
                'CPU 上的开销集中在系统调用、拷贝和协议逻辑；DPDK/用户态栈、TSO/GSO（分段卸载）、checksum offload（校验卸载）都是把 CPU 环节下沉或砍掉的优化。',
              ],
            },
          ],
        },
        {
          id: 'co-bus-boot',
          title: '按下电源到操作系统内核运行，机器经历了哪些阶段？',
          difficulty: 'advanced',
          tags: ['启动流程', 'BIOS', 'Bootloader'],
          points: [
            '① **上电复位**：CPU 从固定地址执行（x86 从 BIOS/UEFI 固件映射处）；② **固件阶段（BIOS/UEFI）**：POST 自检、初始化内存/PCIe 枚举，UEFI 提供安全启动（签名校验）与 GPT；③ 固件按启动顺序加载**引导程序**到内存并移交。',
            '④ **Bootloader（GRUB/systemd-boot）**：加载内核镜像 + initramfs，传递内核参数（cmdline），设置早期环境后跳入内核入口。',
            '⑤ **内核早期启动**：解压内核 → 早期页表/模式切换（长模式）→ 解析 cmdline → **initramfs 中加载根文件系统驱动/存储模块**（RAID、LUKS、NFS root）→ 挂载真正的根 → 启动 PID 1（systemd）。',
            '⑥ **用户态初始化**：systemd 按依赖图拉起服务（网络、容器运行时、应用）。',
            '排查应用：内核启动卡住看是否缺存储/显卡驱动（nomodeset）、启动慢用 `systemd-analyze blame` 分解固件/内核/用户态耗时——面试常考"为什么要 initramfs"：**鸡生蛋问题（根文件系统在需要驱动才能读的盘上）**。',
          ],
          followUps: [
            {
              question: '容器和虚拟机的"启动"与物理机启动有什么本质区别？为什么容器毫秒级、虚拟机秒级？',
              points: [
                '物理机/虚拟机要从固件开始构建整个世界（自检、内核初始化、驱动探测）；虚拟机多一层 hypervisor 模拟硬件，开销更大。',
                '容器**不启动任何内核**：复用宿主内核，只做 namespace/cgroup 隔离和 rootfs 挂载，启动≈一个受控的 fork/exec，所以是毫秒级——"内核共享"既是容器的速度来源也是它的隔离边界。',
              ],
            },
          ],
        },
      ],
    },
  ],
}
