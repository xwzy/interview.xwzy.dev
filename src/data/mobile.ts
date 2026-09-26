import type { Track } from '../types';

export const mobileTrack: Track = {
  id: 'mobile',
  name: '移动端开发',
  icon: '📱',
  tagline: 'Android / iOS / 跨端的共性与差异',
  description: '移动端面试核心考点：Android、iOS 原生开发与 React Native、Flutter 等跨端方案的原理与选型。',
  color: 'rose',
  topics: [
    {
      id: 'mo-android',
      name: 'Android',
      description: 'Android 四大组件、消息机制、事件分发与性能稳定性排查，是 Android 岗位面试的主战场。',
      references: [
        { label: 'Android 官方 · Activity 生命周期', url: 'https://developer.android.com/guide/components/activities/activity-lifecycle' },
        { label: 'Android 官方 · 任务与返回栈', url: 'https://developer.android.com/guide/components/activities/tasks-and-back-stack' },
        { label: 'Android 官方 · 性能优化指南', url: 'https://developer.android.com/topic/performance' },
      ],
      questions: [
        {
          id: 'mo-android-lifecycle',
          title: 'Activity 生命周期的完整流程是怎样的？A 启动 B 时两个 Activity 的回调顺序是什么？',
          difficulty: 'basic',
          tags: ['Activity', '生命周期'],
          points: [
            '典型流程：**onCreate → onStart → onResume** 进入前台可交互；离开时 **onPause → onStop → onDestroy**；回到前台但被部分遮挡时走 **onRestart → onStart → onResume**。',
            'A 启动 B 的顺序是：**A.onPause → B.onCreate → B.onStart → B.onResume → A.onStop**。注意 onPause 先于对方创建，所以 onPause 里做耗时操作会直接拖慢页面跳转。',
            '用户按返回键从 B 回到 A：**B.onPause → A.onRestart → A.onStart → A.onResume → B.onStop → B.onDestroy**。对比可见 A 恢复完成后 B 才销毁。',
            '两个“非常规”场景：**旋转屏幕**默认销毁重建（可用 `android:configChanges` 或 ViewModel + onSaveInstanceState 应对）；**透明/对话框样式的 Activity** 遮不住全屏时只触发 onPause 不触发 onStop，被完全遮住才会 onStop。',
            '数据保存用 **onSaveInstanceState**（保存临时 UI 状态，系统回收前回调，重建时在 onCreate/onRestoreInstanceState 恢复）；持久数据应放 ViewModel + 本地存储，不要依赖生命周期回调时机。',
          ],
          followUps: [
            {
              question: 'onSaveInstanceState 和 onDestroy 的调用时机有什么关系？为什么不能在里面保存大对象？',
              points: [
                '它在 Activity **可能被系统回收之前**回调（用户主动 finish 时通常不会调用），targetSdkVersion ≥ 28 时在 onStop 之后（与设备系统版本无必然关系，老 targetSdk 跑在新系统仍是 onStop 前），时序不完全可控，所以不能把关键逻辑绑在这里。',
                '数据通过 **Bundle 跨进程 Binder 传输，官方限制约 1MB**，放大对象会直接 TransactionTooLargeException 崩溃，且序列化本身耗时造成卡顿。',
              ],
            },
            {
              question: 'ViewModel 和 onSaveInstanceState 都能恢复数据，两者怎么分工？',
              points: [
                '**ViewModel 在配置变更（旋转屏幕）中存活，进程被杀后不存活**；数据驻留内存、不序列化，适合放网络结果、列表缓存这类大对象——旋转屏幕不丢数据靠它。',
                '**onSaveInstanceState 走 Bundle 序列化**，只放少量临时 UI 状态（滚动位置、输入框内容）；进程被杀重建时用 **SavedStateHandle** 拿回关键状态——两者组合才能覆盖完整的生命周期场景。',
              ],
            },
          ],
        },
        {
          id: 'mo-android-launchmode',
          title: 'Activity 的四种启动模式分别是什么？singleTop 和 singleTask 有什么区别？',
          difficulty: 'basic',
          tags: ['Activity', '启动模式', '任务栈'],
          points: [
            '**standard**：默认模式，每次启动都新建实例压入当前栈；**singleTop（栈顶复用）**：目标已在栈顶则复用并回调 onNewIntent，不在栈顶则照常新建。',
            '**singleTask（栈内复用）**：整个任务栈中只存在一个实例；再次启动时把它之上的 Activity 全部出栈，回调 onNewIntent。常用于应用主页面。',
            '**singleInstance（独享任务栈）**：单独占据一个任务栈，整个系统中只有这一个实例，其他 Activity 不会进入这个栈。典型如系统来电、闹钟页面。',
            'singleTop 与 singleTask 的本质区别是**复用范围**：前者只在“栈顶”复用，后者在“整个栈”复用并清除其上的实例。还有一个易错点：**A（standard）启动 B（singleTask）时，B 的栈归属由 taskAffinity 决定——singleTask 本身隐含 NEW_TASK 语义，默认同包名 affinity 时与调用方同栈**。',
            '配套手段：`onNewIntent` 中要重新 `setIntent` 并刷新数据；`FLAG_ACTIVITY_CLEAR_TOP` 可模拟部分 singleTask 行为；`allowTaskReparenting`、任务栈与最近任务列表的关系是常见追问点。',
          ],
          followUps: [
            {
              question: 'singleTask 的 Activity 一定在独立的任务栈里吗？taskAffinity 起什么作用？',
              points: [
                '不一定。**singleTask 本身隐含 NEW_TASK 语义**，栈归属由 **taskAffinity** 决定——默认同包名 affinity 时与调用方同栈，声明了不同 taskAffinity 才可能落进（或创建）自己的栈；taskAffinity 相同的 Activity 倾向于共享同一个栈。',
                '常见坑：从通知栏、桌面图标等**非 Activity 上下文**启动必须带 NEW_TASK，此时才按 affinity 找栈/建栈；栈的归属决定**返回键路径与最近任务列表的拆分展示**——跳转后按返回直接退到桌面，多半是 affinity 配置出了问题。',
              ],
            },
          ],
        },
        {
          id: 'mo-android-handler',
          title: '讲讲 Android 的 Handler 消息机制。主线程的 Looper 为什么不会导致 ANR？',
          difficulty: 'intermediate',
          tags: ['Handler', '消息机制', 'Looper'],
          points: [
            '四个角色：**Handler** 发送与处理消息、**Message** 消息载体、**MessageQueue** 按 when 排序的单链表优先队列、**Looper** 死循环不断从队列取消息分发给对应 Handler。',
            '线程绑定靠 **ThreadLocal**：`Looper.prepare()` 在当前线程的 ThreadLocalMap 里创建 Looper，主线程的 Looper 在 ActivityThread.main() 里由系统 prepare 并 loop；一个线程最多一个 Looper。',
            '**主线程不 ANR 的关键**：Looper.loop() 空闲时消息队列空，会通过 `nativePollOnce` 进入 **epoll 等待，让出 CPU 而不是空转**；有新消息时由 `nativeWake` 唤醒。ANR 的本质是“某条消息处理太慢”，而不是“没有消息在等待”。',
            '两个进阶机制：**同步屏障**（postSyncBarrier）可以让异步消息插队，View 的绘制调度（Choreographer 与 VSYNC 配合）就靠它保证渲染消息优先执行；**IdleHandler** 在队列空闲时执行，适合做延迟初始化。',
            '典型坑：子线程创建 Handler 前忘 `prepare()` 会抛异常；`obtainMessage()` 复用 Message 池而不是 new；Activity 销毁后延迟消息仍持有 Handler 引用造成内存泄漏（应 `removeCallbacksAndMessages`）。',
          ],
          followUps: [
            {
              question: '如果让你设计“线程 A 等线程 B 的结果再继续”，用消息机制怎么做？',
              points: [
                '经典做法是 **HandlerThread**：自带 Looper 的子线程，A 把任务 post 给 B 的 Handler，结果再 post 回 A 的 Handler（通过 `msg.obj` 或回调接口），本质是**两个消息队列互相投递**。',
                '也可以用 CountDownLatch 阻塞等待，但要警惕：在主线程阻塞等待子线程是 ANR 高发点，消息机制的优势正是**用回调代替阻塞**。',
              ],
            },
            {
              question: '同步屏障是什么？为什么 View 的绘制要用它？',
              points: [
                'postSyncBarrier 会在队列里插一个**优先级最高的标记**：普通同步消息全部让路，只有**异步消息**（`msg.setAsynchronous(true)`）能被取出执行——保证渲染任务不被业务消息压在队尾。',
                '**Choreographer 收到 VSYNC 信号后**以异步消息执行 measure/layout/draw，必须在一帧（16.7ms）内完成；屏障用完即移除，一旦忘记移除，主线程会“假死”只跑异步消息——这是 Handler 机制的高阶分水岭问题。',
              ],
            },
          ],
        },
        {
          id: 'mo-android-event-dispatch',
          title: 'Android 事件分发的机制是怎样的？滑动冲突怎么解决？',
          difficulty: 'intermediate',
          tags: ['事件分发', 'View', '滑动冲突'],
          points: [
            '事件从 Activity.dispatchTouchEvent 开始，经 Window 传到 DecorView，再自顶向下走每个 ViewGroup 的 **dispatchTouchEvent → onInterceptTouchEvent → 子 View 的 dispatchTouchEvent**，最终由消费方执行 **onTouchEvent**。三个方法都返回 boolean：dispatch/onTouchEvent 返回 true 表示消费，onInterceptTouchEvent 返回 true 表示拦截。',
            '**DOWN 事件决定消费链**：一旦某个 View 消费了 DOWN，后续 MOVE/UP 会沿这条确定的链直接传递，不再反复询问；父容器中途拦截时，子 View 会收到 **ACTION_CANCEL**（内部要停止动画、复位状态）。',
            'onInterceptTouchEvent 的规则：子 View 消费了 DOWN 之后，父容器每次事件序列仍可询问一次拦截；一旦父容器拦截，子 View 不会再收到后续事件。',
            '**滑动冲突两类解法**：外部拦截法——重写父容器 onInterceptTouchEvent，按规则（如水平位移 > 垂直位移且超过 touchSlop）决定拦截；内部拦截法——子 View 在 dispatchTouchEvent 中调用 `requestDisallowInterceptTouchEvent(true)` 禁止父容器拦截。典型场景：ScrollView 嵌横滑 RecyclerView、Banner 嵌在可上下滑页面里。',
            'View 处理事件的细节：clickable 的 View 会消费事件（返回 true）；onTouch 优先于 onTouchEvent，返回 true 则 onTouchEvent 不执行；长按在 DOWN 时通过 Handler 延迟触发。',
          ],
          followUps: [
            {
              question: '父容器中途拦截了 MOVE 事件，子 View 会经历什么？为什么需要 ACTION_CANCEL？',
              points: [
                '子 View 会先收到一个 **ACTION_CANCEL**，语义是“这条事件序列被剥夺”：内部要立即停止动画、复位按压态、释放临时资源——漏处理会出现按钮“卡在高亮态”、滑动状态错乱等线上问题。',
                '拦截生效后整条序列（后续 MOVE/UP）都归父容器，子 View 不再收到任何事件；所以子 View 对 CANCEL 的处理要等同 UP 收尾，父容器的拦截判定也应尽量前移（DOWN/MOVE 早期），减少双方状态撕裂。',
              ],
            },
            {
              question: '内部拦截法里的 requestDisallowInterceptTouchEvent 为什么要在 DOWN 之后持续调用？',
              points: [
                '它修改的标志位会在**每个 DOWN 事件到来时被父容器重置**——只在某一次 MOVE 里调用一次，下一个事件序列父容器又会照常询问拦截；正确姿势是消费 DOWN 之后、对后续 MOVE 持续设置。',
                '实战模板：Banner 嵌在可上下滑的页面里，子 View 在 dispatchTouchEvent 中对水平位移超过 touchSlop 的 MOVE 调用 `requestDisallowInterceptTouchEvent(true)`，垂直方向不调用、交给父容器接管——内外两层按手势方向协作解决冲突。',
              ],
            },
          ],
        },
        {
          id: 'mo-android-memory-leak',
          title: 'Android 常见的内存泄漏场景有哪些？LeakCanary 的检测原理是什么？',
          difficulty: 'intermediate',
          tags: ['内存泄漏', 'LeakCanary', '性能优化'],
          points: [
            '**静态变量持有 Context/View**：静态的 Activity、单例构造时传入 Activity，导致其无法回收；应改用 `ApplicationContext`。',
            '**非静态内部类隐式持有外部类**：Handler 的延迟消息、Thread/AsyncTask、回调接口写成匿名内部类，都在 Activity 销毁后仍被引用；解决方案是静态类 + WeakReference，或在 onDestroy 中移除消息、取消任务。',
            '**资源未释放**：BroadcastReceiver/EventBus 未注销、Cursor/流未 close、属性动画无限循环持有 View、协程/GC Target 未取消。经验法则：**谁注册谁注销，谁 start 谁 cancel**。',
            'LeakCanary 原理：在 **Activity/Fragment/ViewModel 销毁**等生命周期点，把对象放进 **WeakReference 并关联 ReferenceQueue**；触发 GC 后，若对象没有出现在 ReferenceQueue 中，说明仍有强引用链，此时 **dump hprof 并用 Shark 分析出最短引用链**，定位到持有人。',
            '排查工具链：LeakCanary 用于开发期自动发现；线上用 Matrix/KOOM 等；Profiler 里看 Java 堆、用 `Debug.dumpHprofData` 抓堆快照。看引用链时重点找**意料之外的 GC Root 路径**。',
          ],
          followUps: [
            {
              question: 'LeakCanary 为什么用 WeakReference + ReferenceQueue，而不是直接持有强引用观察？',
              points: [
                '**WeakReference 不影响对象正常回收**：Activity 该销毁销毁；注册 ReferenceQueue 后，GC 时“已回收对象”的引用会进入队列——**没进队列就说明还有强引用链攥着它**，这正是“泄漏”的判据。',
                '一次没进队列不能定罪（可能还没轮到 GC），LeakCanary 会**再触发一次 GC 并等待数秒**确认后才 dump hprof，用 **Shark 解析出最短引用链**——把“疑似泄漏”到“可归因”做成了自动闭环。',
              ],
            },
            {
              question: '什么场景该用 WeakReference？什么场景用了反而是错的？',
              points: [
                '该用：**生命周期比宿主长的对象**（单例、缓存、全局监听器）反向引用 Activity/View 时，用弱引用或改为 ApplicationContext 断开强链——弱引用是修复“生命周期错配”的手段之一。',
                '不该用：把 WeakReference 当缓存——对象随时被回收导致命中率暴跌、频繁重建；**缓存应该用 LruCache 这类带容量管理的强引用结构**，弱引用只适合“有则复用、无则重建”的可选附加数据。',
              ],
            },
          ],
        },
        {
          id: 'mo-android-performance',
          title: 'App 启动很慢、页面卡顿，你会怎么系统性地做性能优化？',
          difficulty: 'intermediate',
          tags: ['性能优化', '启动优化', '卡顿'],
          points: [
            '先度量再优化：**冷启动耗时**看 `adb shell am start -W` 或启动埋点（Application 构造到首帧）；**卡顿**看掉帧（Choreographer/FrameMetrics）与主线程消息处理耗时，用 **Systrace/Perfetto** 抓取关键函数段。',
            '启动优化三板斧：**异步并行**（子线程初始化三方 SDK，注意有依赖关系时用启动器/有向无环图编排任务）、**延迟加载**（首页渲染完成后再初始化非必需模块）、**砍与换**（去掉重复初始化、按需初始化、ContentProvider 初始化合并）。还要注意 Application 的 attachBaseContext 到首帧之间的每个阶段都有埋点可查。',
            '卡顿常见原因：主线程 IO、复杂布局测量（层级过深）、频繁 GC、序列化/JSON 解析、锁等待。布局优化手段：减少层级（ConstraintLayout、merge/ViewStub 按需加载）、降低**过度绘制**、异步 LayoutInflater（X2C 类方案）。',
            '其他高频项：Bitmap 按采样率加载（inSampleSize）与合适格式；列表用 RecyclerView 复用 + DiffUtil；启动图片资源 webp 化、R8 混淆瘦身。',
            '答题时强调 **trade-off 与防劣化**：异步初始化可能引发依赖时序 bug，需要启动任务编排框架管理；优化后必须建**启动耗时基线与 CI 门禁**，否则随版本迭代会劣化回去。',
          ],
          followUps: [
            {
              question: '启动优化时，怎么定位具体慢在哪个阶段？',
              points: [
                '**分段埋点**：Application 构造 → attachBaseContext → ContentProvider.onCreate → 首帧，各阶段打点对比；再用 **Perfetto/Systrace 抓 trace** 看主线程泳道与线程并行度，串行阻塞段一目了然。',
                '注意隐性大项：**ContentProvider 初始化发生在 Application.onCreate 之前**，三方 SDK 自动声明的 provider 是启动耗时黑洞——用启动器框架编排依赖、并行化无依赖任务，必要时按需延迟初始化。',
              ],
            },
            {
              question: '线上怎么做卡顿监控？怎么减少误报？',
              points: [
                '**Looper Printer 方案**（BlockCanary 类）：给主线程 Looper 设置 Printer，“Dispatching”与“Finished”两条日志的间隔超过阈值即判定卡顿，期间由监控线程抓取主线程堆栈与 CPU 信息上报。',
                '更贴近真实体验的是 **Choreographer 帧回调统计掉帧**；降噪三板斧：阈值分档（轻度只记录、重度才上报）、连续多帧确认（排除单次 GC 毛刺）、堆栈聚合去重——告警有公信力，卡顿平台才有人用。',
              ],
            },
          ],
        },
        {
          id: 'mo-android-coroutine',
          title: 'Kotlin 协程的挂起是什么原理？结构化并发解决了什么问题？',
          difficulty: 'intermediate',
          tags: ['Kotlin 协程', '结构化并发', 'Flow'],
          points: [
            '**挂起的本质是"回调的语法糖 + 状态机"**：suspend 函数被编译器改写成**状态机（CPS 变换）**——每个挂起点是状态机的一个分支，函数被"挂起"时其实是 `suspendCancellableCoroutine` 注册了 continuation 回调并**返回**（不阻塞线程），恢复时调度器拿着结果**重新进入状态机的下一个分支**。所以协程写起来是同步风格，跑起来是异步调度，线程没有被占用。',
            '**协程三件套的关系**：`CoroutineScope` 管生命周期，`CoroutineContext` 管调度（Dispatchers.Main/IO/Default——IO 是为阻塞 IO 优化的较大线程池，Default 对应 CPU 核数）与 Job；`launch`（不关心返回值）与 `async`（返回 Deferred 要 await）是两个启动入口。**和 Handler 的分工**：协程不替代主线程消息机制，而是替代"异步任务的编排层"——回调地狱变成顺序代码，异常与取消变成结构化的。',
            '**结构化并发（核心考点）**：协程必须在 Scope 里启动，**父子形成树**——父协程取消则所有子协程自动取消（页面销毁时 viewModelScope 自动取消全部网络请求，杜绝泄漏）；子协程异常按策略传播给父级（Job 默认一损俱损，SupervisorJob 允许子级独立失败）。它回答的问题是：**"谁负责取消和等待一个异步任务"**——在没有结构化并发的时代，这两件事全靠人肉记，漏了就是泄漏和竞态。',
            '工程配套：**Flow 是响应式数据流**（冷流，配 stateIn/sharedIn 进 ViewModel），suspend + Flow 替代 RxJava 成为主流；异常用 CoroutineExceptionHandler + runCatching；**取消是协作式的**（循环里要检查 ensureActive/isActive，不检查的 CPU 密集循环不会被取消——与 Go goroutine 的取消哲学一致）。',
          ],
          followUps: [
            {
              question: 'viewModelScope 是怎么做到"页面销毁协程全停"的？如果用 GlobalScope 会怎样？',
              points: [
                'viewModelScope 是绑定 ViewModel 的 CoroutineScope（SupervisorJob + Dispatchers.Main.immediate）；ViewModel.clear() 时调用 scope.cancel()，**Job 树整体取消**——所有挂起中的子协程收到 CancellationException 恢复并结束。这就是结构化并发的标准落地：**生命周期组件持有 Scope，而不是任务各自漂移**。',
                'GlobalScope 的问题：它没有父、永不取消——协程随进程存活，持有 Activity/ViewModel 引用就是**内存泄漏**，回调回来还可能操作已销毁的视图崩溃；"一次请求泄漏一个协程"在列表页反复刷新时是真实事故源。规范口径：**永远从有生命周期的 Scope 启动协程，GlobalScope 只留给真正全局的守护任务并单独管理**。',
              ],
            },
          ],
        },
        {
          id: 'mo-android-compose',
          title: 'Jetpack Compose 和传统 View 体系的区别是什么？声明式 UI 为什么能提效？',
          difficulty: 'intermediate',
          tags: ['Compose', '声明式 UI', 'Android'],
          points: [
            '**范式转变是第一层**：View 体系是**命令式**——开发者持有 View 引用，状态变化后手动 find/setText/notify（"怎么改"）；Compose 是**声明式**——UI 只是 `@Composable` 函数对状态的映射 `UI = f(state)`，状态变了就**重新执行相关函数**（重组 Recomposition）生成新 UI 树，框架负责 diff 出最小变更（"要什么"）。React/Vue/SwiftUI 全是同一范式，前端经验可平移。',
            '**性能模型变了**：View 体系每个控件是一个 Java 对象 + 一棵深 View 树，measure/layout 两趟递归，层级深了就慢（嵌套 layout 权重问题）；Compose 的 Composable 函数执行生成**轻量的 LayoutNode 树**，智能重组只重跑**读取了变化状态**的函数（作用域最小化），且支持**跳过未变参数**（@Stable/@Immutable 稳定性推断）。会答"**重组范围怎么缩小**"（状态下沉、lambda 延迟读取、derivedStateOf、remember 缓存）才是性能题的得分点。',
            '**为什么能提效（工程视角）**：① **无适配器/无 XML**——列表直接 `LazyColumn` 写 Kotlin，消灭 Adapter/ViewHolder 模板代码；② **状态单一数据源**——UI 状态机化（MVI 风格顺理成章），界面错乱类 bug 大幅减少；③ **组合优于继承**——复用靠函数组合而不是继承 View/自定义控件；④ **预览与工具链**——@Preview 所见即所得。代价也要会讲：学习曲线（重组心智模型）、部分老 API/库仍需 View 互操作（AndroidView/ComposeView 桥接）。',
            '与 SwiftUI/Flutter 对比收束：三者是声明式 UI 在三个平台的实现——**SwiftUI 原生绑定 Apple 生态，Compose 自绘引擎（Skia）与 Flutter 思路相同但接入 Android 系统能力更深**；跨端选型见 Flutter/RN 对比题，本题重点是把"声明式 + 重组 + 状态驱动"讲透。',
          ],
          followUps: [
            {
              question: '重组什么时候会被跳过？为什么"在组合中直接读 List 并修改它"是反模式？',
              points: [
                '跳过（skip）的条件：**参数全部稳定且未变化**——稳定类型指基本类型、String、不可变数据类等，编译器推断不出来就用 @Stable/@Immutable 注解承诺；参数是 unstable 类型（如普通 interface/可变集合）则每次都可能重组不跳过。所以**状态设计成不可变数据类 + 用 ImmutableList**，是 Compose 性能的第一原则。',
                '反模式解析：直接改 List 不会触发任何重组（**Compose 靠 State 对象的变化感知**，普通变量改了框架不知道）；正确做法是用 `mutableStateListOf`/`mutableStateMap`（快照系统的可观察容器）或改 state 驱动重算。能讲到 **Snapshot 快照系统**（全局唯一状态版本管理，类似 MVCC）就是这道题的天花板。',
              ],
            },
          ],
        },
        {
          id: 'mo-android-modular',
          title: 'Android 组件化/模块化怎么做？路由（如 ARouter）解决什么问题？',
          difficulty: 'intermediate',
          tags: ['组件化', '路由', '架构'],
          points: [
            '动机先说透：单工程膨胀的三大痛——**编译慢**（全量工程一次构建十几分钟）、**职责耦合**（模块间随手互相调用，边界名存实亡）、**协作冲突**（多人同仓同模块）；组件化按业务拆分：**app 壳工程（只做组装）+ 业务组件（登录/订单/首页…）+ 基础组件（网络/存储/UI/日志）**，依赖方向严格单向：业务 → 基础，业务之间不直接依赖。',
            '**路由解决"跨模块跳转没有类引用"的问题**：模块 A 想跳模块 B 的页面，但 A 编译期拿不到 B 的类——路由框架用**注解（@Route）+ APT 编译期生成路由表**（path → class 映射），运行时按 path 查表实例化跳转；顺带获得三个工程能力：**降级**（目标页不存在/未集成时的兜底页）、**拦截器**（登录校验、埋点、深链参数解析挂在跳转链上——思想与后端网关中间件同构）、**深链协议统一**（push/外跳与内部跳转同一套 path）。',
            '**通信解耦三板斧**：接口下沉（api 模块只放接口与 DTO，实现留在业务模块，启动时注册服务发现——依赖倒置）；事件总线（SharedFlow/LiveData 广播跨模块事件，注意生命周期与粘性事件坑）；数据模型分层（网络模型不直接暴露给 UI，防一个模块改字段全工程编译炸）。',
            '工程设施：**组件独立调试**（module 开关在 application/library 间切换，单业务起 app 秒级编译）；产物化（业务组件发 aar 到私服 + 版本管理，或 monorepo 源码集成——各自取舍：隔离好 vs 联调快）；**边界治理是长期战**：依赖检查（lint 规则/依赖矩阵 CI 卡点）防"偷偷 import"让解耦回潮——没有卡点的组件化三个月就退化回单体。',
            '权衡收束（体现判断力）：组件化的成本是真实的——路由学习成本、调试链路变长、公共代码归属扯皮；小团队 2~3 个模块足够。触发信号：编译时间成为痛点、团队分组 > 2~3 组、模块发布节奏不一致。与后端微服务拆分是**同一个决策问题在端上的投影**，但端上没有网络边界这个物理隔离，**纪律就是唯一的边界**——能说出这一点说明理解了本质。',
          ],
          followUps: [
            {
              question: 'ARouter 的路由表是怎么生成的？注解处理器做了什么？',
              points: [
                '**APT（注解处理器的编译期代码生成）**：编译器扫到 @Route 注解，生成一个映射类（path → 目标 Activity/服务 的注册代码）；运行时 `ARouter.init` 把所有生成的映射类加载注册进全局表，跳转查表实例化。本质是**把运行时反射的注册成本挪到编译期**，同时保留无直接依赖的解耦。',
                '同族技术顺带对比：Dagger/Hilt（依赖注入）、Room（ORM）、Glide（GlideModule）都是 APT 生成代码；KSP 是 kapt 的接棒者（不生成中间 Java 源码，编译更快）；编译期生成 + 运行期注册是 Java/Kotlin 系做"无依赖解耦"的通用武器——能横向串起来是架构视野分。',
              ],
            },
            {
              question: '跨组件跳转需要传一个大对象（如商品详情对象），怎么设计？',
              points: [
                '**反模式**：把对象塞进路由参数（序列化体积、版本兼容坑、本质是把 B 模块的数据定义耦合进 A）——正确姿势是**只传 id（uri 参数），目标模块按 id 自取数据**，与跨进程/跨服务传数据（HTTP 传引用不传对象）是同一条最佳实践的端上版。',
                '确实要传复杂参数时：公共 DTO 下沉到 api 模块（接口与数据契约同归属），版本兼容由契约管理；临时大对象可用中心化的跨模块数据仓库（put(id, obj) + 路由传 id + take(id)，带过期清理）——但要点明它是"妥协方案"，主答案永远是传 id。',
              ],
            },
          ],
        },
        {
          id: 'mo-android-apk-size',
          title: 'App 包体积怎么优化？从资源、代码到 so 的完整手段有哪些？',
          difficulty: 'intermediate',
          tags: ['包体积', 'APK', 'R8', 'App Bundle'],
          points: [
            '**先建度量与目标（工程纪律）**：分渠道统计**下载体积**（用户实际下载，App Bundle 动态分发后远小于 APK 全量体积）与安装体积；建立**体积基线看板**（按模块/资源类型拆解——Webpack Analyzer 思想的端上版），CI 上加**体积门禁**（增量超阈值 block 合并）——没有度量的"优化"会一周内回潮。',
            '**资源层（通常是最大头）**：图片 **WebP/AVIF 化**（PNG 转 WebP 省 25~50%，带透明通道也支持）、大图按密度删冗余（一套 xxhdpi 打底 + 按需）、**无用资源清理**（lint 检测 + 资源混淆工具 shrinkResources）、字符串与动画 XML 精简；动态表情/字体这类可后置资源走**在线下发**（首次启动后台拉取）。',
            '**代码层**：**R8 全量混淆**（代码缩减 + 优化 + 混淆三合一，ProGuard 的接替者——keep 规则要克制，keep 泛滥等于白混）；移除未使用的依赖与重复依赖（依赖树分析）；**多 module 按需拆分**（feature module 不进主包）；调试符号与行号表**剥离归档**（崩溃时用 mapping 文件反解——sourcemap 思想的端上版，与崩溃采集联动）。',
            '**so 层与平台机制**：**abiFilters 控制指令集**（只出 arm64 或用 App Bundle 按设备分发对应 abi——x86 模拟器版本不下发给真机用户）；so 裁剪（strip 符号、`-ffunction-sections` 链接期去死代码）；超大 so（如滤镜/模型）走**动态加载下发**；Android 用 **App Bundle + Play Feature Delivery**（按需/条件分发模块），iOS 对应 bitcode/符号剥离与**按需资源（ODR）**——平台机制永远优先于手工优化。',
            '**权衡与防劣化**：体积 vs 启动（动态下发换小包但增加首开网络依赖——开关由数据决定）；混淆 vs 可调试（mapping 必须归档，否则线上崩溃无法定位）；把体积纳入**每版本 release checklist**（对比上一版本 diff、解释每个增量来源）——包体积是"不管理就永远膨胀"的熵增指标，这句话是这题的工程分。',
          ],
          followUps: [
            {
              question: '优化后包体积降了 30%，但下个版本又涨回来了，怎么治理？',
              points: [
                '**门禁 + 归因**双管：CI 体积门禁（模块级 diff，超阈值要说明与豁免审批——把体积当成性能指标管理）；每次合并自动出**体积归因报告**（哪个 PR 加了哪些资源/依赖，增量到 MB 级）——让"谁引入谁负责"可追溯，而不是月底发现涨了 20MB 找不到源头。',
                '机制化节流：**图片资源强制走 CDN 校验**（超大图直接拦截，改用在线加载）、**依赖引入需评审**（新库要看传递依赖与体积贡献）、每季度做一次清理冲刺（无用资源/依赖的集中清偿——技术债的体积版，与职业方向技术债题同构）。',
              ],
            },
          ],
        },
        {
          id: 'mo-android-binder',
          title: '为什么 Android 的跨进程通信用 Binder 而不是 socket 或共享内存？Binder 一次拷贝是怎么做到的？',
          difficulty: 'advanced',
          tags: ['Binder', 'IPC', '系统底层'],
          points: [
            'Binder 是 **C/S 架构**：Client、Server、**ServiceManager**（类似 DNS，负责注册与按名字查找服务）、**Binder 驱动**（/dev/binder，实际的数据中转与协议实现）。应用通过 AIDL 定义接口，编译器生成 Stub/Proxy 完成代理转发。',
            '性能：**Binder 只需一次拷贝**。它在内核为接收进程 mmap 一块缓存，把用户空间和内核空间映射到**同一块物理内存**，数据从发送方用户空间拷入内核缓存后，接收方用户空间直接可见——省掉了传统 IPC“用户态→内核态→用户态”的第二次拷贝。socket/管道需要两次拷贝。',
            '为什么不用**共享内存**：它虽然零拷贝、最快，但**没有内建的同步与鉴权机制**，多进程并发读写要自己控制，且任何进程都能改数据，不安全。Binder 用“驱动中转 + 一次拷贝”换来了可控性和安全性。',
            '为什么不用 socket：面向网络通用场景设计，**开销大（协议栈、两次拷贝、线程切换）**，且没有身份校验机制。而 Binder 天然带 **PID/UID 身份标识**，内核层可做权限校验，这正是 Android 安全模型（权限按 UID 划分）的基础。',
            '进一步可谈：**内存映射的缓存大小约 1M-8K**，对应 Binder 传输 1MB 左右的限制（这也是 onSaveInstanceState 不宜放大对象的原因）；oneway 异步调用与同步调用的区别；匿名 Binder 通过实名 Binder 传递实现服务分发。',
          ],
          followUps: [
            {
              question: 'AIDL 生成的 Stub 和 Proxy 各做了什么？一次跨进程调用的完整链路是什么？',
              points: [
                '**Proxy（客户端）**把参数按接口顺序写入 Parcel（writeInt/writeString…），调用 `transact()` 进入驱动；**Stub（服务端）**在 `onTransact()` 里按相同顺序读出参数，回调真正的业务实现，再把返回值写回 Parcel。',
                '完整链路：客户端线程挂起 → 驱动把数据**一次拷贝**到服务端的 mmap 缓存 → 服务端 **Binder 线程池**取出事务执行 → 结果原路返回、客户端线程唤醒；in/out/inout 标记决定参数是否回传，远端异常会被封装后在客户端重抛。',
              ],
            },
            {
              question: '服务端的 Binder 线程池是怎么回事？它怎么会引发 ANR？',
              points: [
                '每个进程默认为 Binder 预留 **16 个线程**处理远程事务；服务端方法里有慢 IO 或锁等待时，16 个线程全部占满，后续同步调用只能在驱动里排队等待。',
                '排队会传染：客户端发起同步调用的线程（可能是主线程）一直挂起——系统服务响应慢时，大量应用的主线程同时卡住，这就是“**Binder 线程池耗尽导致 ANR**”的机制；所以服务接口要轻量/异步化，客户端避免在主线程同步等待重型系统服务。',
              ],
            },
          ],
        },
        {
          id: 'mo-android-anr',
          title: 'ANR 的触发条件有哪些？线上出现 ANR 你怎么排查？',
          difficulty: 'advanced',
          tags: ['ANR', '稳定性', '排查'],
          points: [
            '触发条件按场景记：**输入事件 5 秒**内没被消费；**前台 Service 20 秒 / 后台 200 秒**内没执行完；**前台广播 10 秒 / 后台 60 秒**内没处理完（onReceive 里起子线程也没用，onReceive 不返回同样超时）；ContentProvider 的 publish 超时（10 秒）。',
            'ANR 的根因不只“主线程做了耗时操作”，还包括：主线程**等锁**（子线程持锁）、**Binder 调用对端阻塞**、Binder 线程池耗尽、主线程频繁 GC、以及系统负载过高导致调度不及时。',
            '线下排查：发生 ANR 时系统会写 `/data/anr/` 下的 **traces 文件**（各线程堆栈），看主线程状态——RUNNABLE 说明在算或 IO，BLOCKED 说明等锁（顺藤摸瓜找持锁线程），Native 说明卡在系统调用。配合 logcat 中 `am_anr` 与 CPU 使用信息定位。',
            '线上方案：接入 **WatchDog 类监控**（子线程定期向主线程 post 消息，超时未执行则 dump 主线程堆栈），或者接收系统的 ApplicationExitInfo；再结合崩溃平台聚合，按主线程堆栈 top 归类修复。',
            '预防手段：主线程只做 UI 与消息分发，IO/JSON/Bitmap 全部异步；广播 onReceive 用 goAsync 或转 Service；对锁的使用控制临界区大小；建立**卡顿监控前置发现**，大部分 ANR 来源于持续的卡顿劣化。',
          ],
          followUps: [
            {
              question: '让你自己实现一个 ANR WatchDog，思路是什么？怎么防误报？',
              points: [
                '核心结构：**观测线程每隔 N 秒向主线程 post 一个带标志的任务并记录时间戳**，下次检查时若上一次任务仍未执行完，说明主线程被阻塞——立即 dump 主线程与全部线程堆栈、CPU/内存快照并上报。',
                '防误报三招：**阈值分档**（轻微阻塞只记录不告警）、**连续多次确认**（单次超时可能是 GC 毛刺）、**堆栈聚合去重**（相同堆栈合并计数），再结合触发场景（是否输入事件分发期）判断严重度。',
              ],
            },
            {
              question: '拿到一份 ANR traces 文件，你会重点看哪些信息？',
              points: [
                '先看**主线程堆栈与状态**：Blocked → 顺藤摸瓜找持锁线程、看它卡在哪一层；Native → 看卡在哪个系统调用（IO/Binder）；RUNNABLE 且停在业务代码 → 典型耗时逻辑；空闲相关状态 → 可能是输入事件未分发型 ANR。',
                '再看 **Binder 事务段与 CPU 段**：pending 事务指向哪个进程、iowait 是否高（存储 IO 瓶颈）、负载是否被其他进程吃满；线上把多份 traces 按**主线程堆栈 top 聚类**，批量修共性问题，而不是逐单打补丁。',
              ],
            },
          ],
        },
        {
          id: 'mo-android-recycler-cache',
          title: 'RecyclerView 的缓存机制是怎样的？滑动时一个 Item 是怎么被复用的？',
          difficulty: 'intermediate',
          tags: ['RecyclerView', '缓存', '性能优化'],
          points: [
            '四级缓存按查找顺序：**Scrap**（mAttachedScrap / mChangedScrap，layout 期间屏幕内临时分离的 holder，按 position 精确复用）→ **mCachedViews**（默认 2 个，缓存刚滑出屏幕的 holder，按 position 匹配、**无需重新 bind**）→ **ViewCacheExtension**（自定义扩展，几乎不用）→ **RecycledViewPool**（按 viewType 复用，每类默认 5 个，**需要重新 bind**）。',
            '两条复用路线的本质区别：mCachedViews 按 **position** 匹配，内容没变直接回填、零绑定开销；Pool 按 **viewType** 匹配，只省去 createViewHolder 的 inflate，数据仍要 bind——列表滚动卡顿排查先看是不是反复走 inflate。',
            '关键配置：`setItemViewCacheSize(n)` 调 CachedViews 容量；`getRecycledViewPool().setMaxRecycledViews(type, n)` 调 Pool（多 type 列表建议调大）；**多个 RecyclerView 可共享同一个 Pool**（ViewPager2 内部就靠这个让相邻页复用同 type 的 holder）。',
            '与 ListView 的区别（高频对比）：RecyclerView 强制 ViewHolder 模式、把布局算法抽成 **LayoutManager**（线性/网格/瀑布流可插拔）、条目动画与 ItemDecoration 内建、Pool 按 viewType 跨列表共享——缓存粒度和扩展性都更细。',
            '与刷新机制联动：`notifyDataSetChanged` 会把所有 holder 打脏、退化为全量重绑；`DiffUtil`/`ListAdapter` 做增量 diff + 动画，配合 `payload` 实现**局部 bind**（只刷新变化字段），是列表流畅度与图片闪烁问题的标准解法。',
          ],
          followUps: [
            {
              question: '一个 holder 什么时候进 mCachedViews，什么时候进 RecycledViewPool？为什么这样设计？',
              points: [
                '滑出屏幕且 cache 未满 → 进 **mCachedViews**（保留 position 与数据，随时精确回滑复用）；cache 满了挤出、或 `notifyDataSetChanged` 后被回收的 → 进 **Pool**（按 viewType 供任何同 type 位置复用）。',
                '设计动机是**命中概率分层**：用户来回滑动时按 position 命中 cache 零成本；快速长滑则靠 Pool 的 viewType 复用兜底——两层各管一种访问模式，所以默认容量小（2 和 5）也够用。',
              ],
            },
            {
              question: '列表滑动掉帧，你怎么结合缓存机制定位？图片错乱（复用串位）怎么修？',
              points: [
                '先看复用路径：`onCreateViewHolder` 高频触发说明 Pool 命中率低（viewType 太多、Pool 容量不足）；`onBindViewHolder` 高频且卡顿集中在 bind，用耗时打点找重操作（图片解码、复杂测量），再考虑预加载/prefetch。',
                '图片错乱根因是**异步回调返回时 holder 已复用给别人**：set tag / 在回调里校验 position 与 imageView 的绑定关系、用带占位与取消的图片库（Glide 自动按 View 生命周期取消请求）——本质是"异步结果与复用竞争"。',
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'mo-ios',
      name: 'iOS',
      description: 'iOS 内存管理、RunLoop、事件响应与多线程，考察对 Objective-C 运行时和系统底层机制的理解。',
      references: [
        { label: 'Apple 官方 · CFRunLoop 文档', url: 'https://developer.apple.com/documentation/corefoundation/cfrunloop' },
        { label: 'Swift 官方文档 · Automatic Reference Counting', url: 'https://docs.swift.org/swift-book/documentation/the-swift-programming-language/automaticreferencecounting/' },
        { label: 'Apple 官方 · Touches, presses, and gestures', url: 'https://developer.apple.com/documentation/uikit/touches_presses_and_gestures' },
      ],
      questions: [
        {
          id: 'mo-ios-arc',
          title: 'ARC 的原理是什么？strong、weak、copy 各自的语义和使用场景？',
          difficulty: 'basic',
          tags: ['ARC', '内存管理'],
          points: [
            'ARC 是**编译期自动引用计数**：编译器在合适的位置插入 retain/release/autorelease，配合少量运行时逻辑（weak 置 nil、autorelease pool），对象引用计数为 0 时释放。它不是 GC，**没有运行时扫描，无停顿**，但也解决不了循环引用。',
            '**strong**：持有、引用计数 +1，对象属性默认；**weak**：不持有、指向的对象释放后自动置 nil（安全）；**__unsafe_unretained**：不持有也不置 nil，野指针风险，仅在性能敏感的兼容场景使用。',
            '**copy**：赋值时复制一份不可变副本，用于 NSString/NSArray 等防止外部传入 NSMutable 子类后被外部修改；block 属性声明为 copy（ARC 下 block 赋值给强引用会自动 copy，显式写 copy 是习惯性兜底）。',
            '**weak 实现原理**（常追问）：对象存在全局的 SideTable（分离锁 + 引用计数表 + weak 表）；weak 指针注册进 weak 表，对象 **dealloc 时遍历 weak 表把所有 weak 指针置 nil**，所以访问不会野指针，但有“读到中途被释放”的窗口，多线程读时要小心。',
            '循环引用三板斧：**delegate 用 weak**；block 里用 `__weak typeof(self) weakSelf` 捕获（执行时再 `__strong` 一次防止执行中途被释放）；或手动 breakRetain/一次性 block。Retain Cycle 排查用 Instruments 的 Leaks 或 Memory Graph Debugger。',
          ],
          followUps: [
            {
              question: 'weak 指针自动置 nil 的完整流程是怎样的？为什么 weak 的读写比 strong 慢？',
              points: [
                '对象 dealloc 时走 **clearDeallocating**：从全局 **SideTable 的 weak 表**（对象地址 → 指向它的 weak 指针地址数组）取出所有弱引用逐个置 nil，再把记录从表里摘除——这就是“对象释放、weak 自动变 nil”的实现。',
                '正因为有这张全局哈希表，**weak 的赋值和读取都要查表（带分离锁）**，比 strong 的纯计数加减慢；多线程高频读写 weak 属性还要考虑锁竞争与“读到中途被置 nil”的窗口，性能敏感处可退化为 `__unsafe_unretained` + 手动清理。',
              ],
            },
          ],
        },
        {
          id: 'mo-ios-responder',
          title: 'iOS 的事件传递和响应链是怎样的？hitTest 是怎么找到目标 View 的？',
          difficulty: 'basic',
          tags: ['事件响应链', 'UIResponder', 'hitTest'],
          points: [
            '分两个阶段：**事件传递（hit-test）**找“谁该处理”，自上而下；**响应链（Responder Chain）**处理不了时“往上交”，自下而上。',
            'hitTest 逻辑：UIApplication 把触摸事件发给 UIWindow，逐层调用 `hitTest:withEvent:`，内部用 `pointInside:withEvent:` 判断触摸点是否在自己的坐标系内；在则倒序遍历子视图递归查找，返回**最内层且满足条件**的 View。隐藏、userInteractionEnabled = NO、alpha < 0.01 的 View 会被跳过。',
            '找到目标 View 后走 touchesBegan/Moved/Ended/Cancelled，处理不了就沿 **nextResponder** 上交：View → 父 View → 所在 ViewController → UIWindow → UIApplication → UIApplicationDelegate，直到有人处理或丢弃。',
            '实战细节：父 View 把子 View 超出部分裁掉后，超出区域点不到（因为 pointInside 不含子视图超出部分）——想可点需重写 hitTest 或 pointInside；点击“穿透”某控件用 `hitTest` 返回 nil 或把 userInteractionEnabled 关掉。',
            '手势（UIGestureRecognizer）与 touches 的关系常追问：手势识别成功后会给 View 发 **touchesCancelled**，事件被打断；UIButton 上加 Tap 手势后按钮高亮态可能失效，就是两者协作的结果，可用 `gestureRecognizerShouldBegin`、`cancelsTouchesInView` 调节优先级。',
          ],
          followUps: [
            {
              question: 'View 上同时挂了手势和按钮，事件先给谁？怎么精细控制两者的优先级？',
              points: [
                'hitTest 找到目标 View 后，系统会把 touch **同时送给手势识别器**：手势一旦识别成功，就向 View 发送 **touchesCancelled**，按钮的 touch 逻辑作废——“加 Tap 手势后按钮高亮失效”就是这个机制。',
                '调节手段按需选：`gestureRecognizerShouldBegin:` 返回 NO 让特定场景下手势不生效；`cancelsTouchesInView = NO` 让 View 仍能收完整序列（高亮恢复）；两个手势之间用 `requireGestureRecognizerToFail:` 声明依赖，解决单击/双击冲突。',
              ],
            },
          ],
        },
        {
          id: 'mo-ios-block',
          title: 'Block 的本质是什么？为什么会产生循环引用，怎么解决？',
          difficulty: 'intermediate',
          tags: ['Block', '循环引用', '内存管理'],
          points: [
            'Block 本质是**一个结构体类型的 Objective-C 对象**（有 isa 指针），成员包括函数指针 impl、描述信息 desc，以及**捕获的外部变量（会变成结构体的成员）**。调用 block 就是执行那个函数指针，并把捕获值作为隐式参数。',
            '三种类型：**NSGlobalBlock**（不捕获变量，存全局区）、**NSStackBlock**（捕获变量且在栈上，作用域结束即销毁）、**NSMallocBlock**（copy 后拷到堆上）。ARC 下 block 被强引用持有时会自动 copy 到堆。',
            '捕获规则：局部**基本类型是值拷贝**，block 内默认不可修改；要修改需 **__block**——它把变量包装成结构体对象，block 捕获的是这个对象的指针，所以可写；对象类型捕获的是指针（增加引用计数）。',
            '循环引用成因：**self 持有 block，block 持有 self（捕获）**，互相强引用谁也释放不了。解决方案：`__weak typeof(self) weakSelf = self;` 捕获弱引用，block 内执行时 `__strong typeof(weakSelf) strongSelf = weakSelf;` 保证执行过程中不被释放，避免多行代码中间被销毁的竞态。',
            '注意区分：block 最终**会被立即执行且不长期持有**的场景（如 `dispatch_async` 内联使用）不会造成循环引用；网络请求、动画、通知回调这类“block 被长期持有”的才危险。检测手段：Memory Graph、Dealloc 中打断点验证是否释放。',
          ],
          followUps: [
            {
              question: '__block 修饰的变量为什么能在 block 内被修改？它有什么坑？',
              points: [
                '__block 变量被包装成**栈上的结构体对象**（含 isa 与 forwarding 指针），block 捕获的是这个结构体的**指针**而不是值拷贝；block 从栈 copy 到堆时，栈上副本的 forwarding 指向堆上新副本，保证内外访问同一份数据。',
                '两个坑：__block 修饰**对象类型时 block 依旧强持有它**（同样可能循环引用，需要 __weak 配合）；基本类型用 __block 后生命周期被 block 延长，异步 block 里读到的是“最终值”而不是捕获瞬间的快照。',
              ],
            },
            {
              question: '用 weakSelf 一定安全吗？__strong strongSelf 到底解决什么问题？',
              points: [
                'weakSelf 可能在 block **执行中途被置 nil**：多行代码跑一半对象释放，出现“前半段有效、后半段静默失效”的竞态 bug；开头 `__strong strongSelf = weakSelf` 把对象钉住到 block 结束，保证执行期间引用可控。',
                'strongSelf 不是免费的：长期持有的 block（网络回调）里它会**推迟释放**直到回调完成；规范写法是 weak-strong dance，block 逻辑结束前把 strongSelf 置 nil，兼顾“执行中不中断”与“执行完就释放”。',
              ],
            },
          ],
        },
        {
          id: 'mo-ios-kvo-kvc',
          title: 'KVO 和 KVC 的底层实现原理是什么？KVO 有什么坑？',
          difficulty: 'intermediate',
          tags: ['KVO', 'KVC', 'Runtime'],
          points: [
            '**KVO 基于 isa-swizzling**：`addObserver` 时运行时动态创建原类的子类（如 `NSKVONotifying_Person`），把对象的 isa 指向子类，并重写被观察属性的 setter——先调用 `willChangeValueForKey`，再调原实现，再 `didChangeValueForKey`，由其触发 observeValueForKeyPath 回调。所以 KVO 只对“走 setter 的修改”生效，直接改 ivar 不触发。',
            '手动 KVO：重写 `automaticallyNotifiesObserversForKey` 返回 NO，然后在修改前后手动调 will/didChangeValueForKey，适合批量修改、条件触发等精细控制。',
            '**KVC 取值顺序**：`valueForKey:` 依次找 `getKey`、`key`、`isKey`、`_key` 等 getter；**赋值顺序**：`setKey:`、`_setKey:`，找不到 setter 且 `accessInstanceVariablesDirectly` 为 YES 时按 `_key`、`_isKey`、`key`、`isKey` 顺序写 ivar，都没有则抛 `setUndefinedKey` 异常（可重写兜底）。',
            'KVO 经典崩溃：**observer 重复添加**、**移除未注册的 observer**、**被观察对象 dealloc 前未移除**（旧版本系统会崩溃）。因为 KVO 机制没有任何防护，工程上常用第三方安全 KVO（FBKVOController）或 KVO 替代品：delegate、block 回调、NotificationCenter、Combine/信号流。',
            '加分项：isa-swizzling 后 `object_getClass` 返回的是中间子类，而 `-class` 被 KVO 重写返回原类名，所以“看不出来”被 swizzle；这也解释了为什么 KVO 对对象的 class 判断有迷惑性。',
          ],
          followUps: [
            {
              question: 'FBKVOController 这类“安全 KVO”是怎么把经典崩溃都挡住的？',
              points: [
                '它把 **observer 与观察关系登记在自己的容器里**（NSMapTable 持有），宿主对象释放时**统一注销观察**，根治“dealloc 忘记 removeObserver”的崩溃；内部加锁防重复添加同一个 keyPath。',
                '回调从 observeValueForKeyPath 换成 **block**，避免 controller 强引用 self 再引入新的循环引用；底层仍依赖 isa-swizzling，但把风险封装在容器管理层——一句话总结：**封装的是生命周期管理，不是替换通知机制**。',
              ],
            },
            {
              question: 'KVC 赋值会触发 KVO 吗？直接改 ivar 呢？',
              points: [
                '会。`setValue:forKey:` 在没有找到自定义 setter、走**写 ivar 的兜底路径**时，内部同样调用 willChangeValueForKey / didChangeValueForKey——所以 KVC 赋值能触发 KVO 通知。',
                '直接改 ivar 不触发任何通知；这也解释了“手动 KVO”的原理：无论什么修改路径，前后手动调 will/didChangeValueForKey 就能产生通知——批量修改、条件触发时用它精细控制通知时机。',
              ],
            },
          ],
        },
        {
          id: 'mo-ios-gcd',
          title: 'GCD 的串行/并发队列与同步/异步执行有什么区别？哪些组合会死锁？',
          difficulty: 'intermediate',
          tags: ['GCD', '多线程'],
          points: [
            '组合语义：**队列决定“在哪排队”（串行 = 同一时刻一个任务，并发 = 可多个），sync/async 决定“当前线程等不等”**。async 向并发队列提交 = 开新线程并行执行；sync 向任何队列提交 = 当前线程阻塞直到任务完成。',
            '**死锁场景一**：在主线程（主队列上）执行 `dispatch_sync(dispatch_get_main_queue())`——主队列正在执行当前任务，sync 要求等它完成才执行新任务，互相等待。同理在**自定义串行队列**的任务里 sync 到同一个队列也会死锁。',
            '不死的组合要能说清：并发队列 + sync 不会死锁（新任务可被其他线程取走）；async 嵌套永不死锁（不等）。主队列是特殊的**串行队列**，且与主 RunLoop 绑定。',
            '常用原语：`dispatch_barrier_async` 在并发队列中“栅栏”隔离读写（模拟读写锁）；`dispatch_semaphore` 控制最大并发数或同步等待（wait/signal 配对）；`DispatchGroup` 的 enter/leave + notify 聚合多个网络请求；`dispatch_once` 单例（线程安全、基于原子操作）。',
            '线程爆炸问题常追问：并发队列 + 大量 async 会无节制开线程（线程池有上限但队列间共享），要**用串行队列或 semaphore 控制并发**；`dispatch_get_global_queue` 是全局共享并发队列，QOS 决定优先级，注意优先级反转要用 `dispatch_set_target_queue` 处理。',
          ],
          followUps: [
            {
              question: 'dispatch_barrier_async 为什么能实现“多读单写”？使用前提是什么？',
              points: [
                '向**自定义并发队列**提交 barrier 任务后：它前面的任务先全部执行完，barrier **独占队列执行**，它之后的任务全部等待——读操作普通 async 并发跑、写操作用 barrier，就是一把无锁的读写锁。',
                '前提是**必须用自己创建的并发队列**：global queue 全进程共享，往里面塞 barrier 会拖累所有使用者也达不到隔离效果；串行队列上 barrier 无意义。追问常延伸到 barrier 与 sync 混用的死锁变体，要能现场推演。',
              ],
            },
            {
              question: 'dispatch_semaphore 的 wait/signal 底层在做什么？用它限流的坑是什么？',
              points: [
                '计数大于 0 时 wait 原子递减直接放行；计数为 0 时线程进入**内核态休眠**（不是自旋烧 CPU），signal 原子递增并唤醒一个等待线程——一个跨线程的精确计数同步原语。',
                '坑：wait/signal 必须**严格配对**，漏一次 signal 并发额度永久少一，最终卡死所有请求；**在主线程 wait 等待异步回调**是死锁与卡 UI 的高发点；信号量初值即最大并发数，复用时序要提前设计清楚。',
              ],
            },
          ],
        },
        {
          id: 'mo-ios-performance',
          title: 'iOS 页面滚动卡顿一般怎么排查和优化？什么是离屏渲染？',
          difficulty: 'intermediate',
          tags: ['性能优化', '离屏渲染', 'Instruments'],
          points: [
            '先分清 CPU 和 GPU 的锅：CPU 负责布局计算、文本排版、图片解码、对象创建；GPU 负责合成渲染。掉帧 = 一帧（60Hz 下 16.7ms，ProMotion 120Hz 下 8.3ms）内这两者没干完活。工具：Instruments 的 **Time Profiler / Core Animation / Allocations**，真机配合 FPS 检测、MetricKit 线上监控。',
            '**离屏渲染**：GPU 需要在屏外开辟缓冲区先合成再贴回，涉及上下文切换，开销大。常见触发：**圆角 + masksToBounds 裁剪 contents**、shadow（未指定 shadowPath）、group opacity、shouldRasterize。优化：预先处理图片圆角（服务端裁剪或绘制成新图）、用 CAShapeLayer + bezierPath 画圆角、给 shadow 指定 path。',
            'CPU 侧优化清单：Cell 高度缓存与提前计算、**图片按目标尺寸解码**（ downsampling，避免大图小显）、文本异步排版、耗时操作放子线程、减少视图层级、用轻量 View（如不用重写 drawRect 的方案）。',
            'GPU 侧：避免半透明叠加（减少 blending）、控制同屏 layer 数量、shouldRasterize 谨慎用（缓存失效反而更慢）。',
            '答题要有闭环：**量化（FPS/掉帧率/Time Profiler 火焰图）→ 定位（CPU 还是 GPU、哪个 Cell）→ 优化 → 压测验证**；再补一句滑动场景的差异：滚动时 RunLoop 切到 tracking mode，主队列默认任务不执行，可以用 CFRunLoopPerformBlock 注册到 common mode。',
          ],
          followUps: [
            {
              question: '离屏渲染为什么开销大？设置了 cornerRadius 就一定触发吗？',
              points: [
                '开销在**上下文切换与额外缓冲**：GPU 要在屏外新开一块内存做合成、再把结果贴回 framebuffer，还要清理现场；长列表里大量离屏渲染直接把单帧耗时顶过 16.7ms。',
                '不是必然触发：**cornerRadius + masksToBounds 且 contents 需要裁剪**（如带图片的 layer）才是典型场景，纯色背景的圆角在新系统已有优化；用 Instruments 的 Core Animation 模板勾选 **Color Offscreen-Rendered Yellow** 实测，优化手段是预生成圆角图、CAShapeLayer 画边或指定 shadowPath。',
              ],
            },
            {
              question: '一张大图放进小 ImageView 为什么会卡？图片解码发生在哪一步？',
              points: [
                'UIImage 持有的是**压缩数据（PNG/JPEG）**，真正占内存的是**解码后的位图**：宽 × 高 × 每像素 4 字节——4000×3000 的照片约 45MB，与显示尺寸无关；解码默认发生在**主线程提交渲染时**，大图直接顶爆单帧。',
                '优化叫 **downsampling**：按目标显示尺寸解码——`CGImageSourceCreateThumbnailAtIndex` 指定 maxPixelSize 在子线程解码，或 iOS 15+ 用 `preparingForDisplay` 预解码；SDWebImage/Kingfisher 都有对应配置，这是列表卡顿排查的高频元凶。',
              ],
            },
          ],
        },
        {
          id: 'mo-ios-runloop',
          title: 'RunLoop 的原理和运行逻辑是什么？有哪些实际应用场景？',
          difficulty: 'advanced',
          tags: ['RunLoop', '底层机制'],
          points: [
            'RunLoop 是**事件驱动的死循环**：没事件时休眠（mach_msg 内核态等待，不耗 CPU），有事件被唤醒处理，处理完继续等。**每个线程有且仅有一个 RunLoop**，子线程的默认不创建也不运行，只有主线程的由系统启动——这就是 iOS 主线程的“消息队列”，和 Android 的 Looper 异曲同工。',
            '组成部分：**Source0**（应用内部事件，需手动标记唤醒）、**Source1**（mach port 驱动，内核直接唤醒，进程间通信用）、**Timer**（NSTimer 基于 RunLoop）、**Observer**（观察状态变化）。一次循环：通知 Observer 进入 → 处理 Timer → 处理 Source0 → 被 Source1/唤醒 → 处理唤醒消息 → 通知 Observer 退出/休眠。',
            '**Mode 机制**：RunLoop 只运行在一个 Mode 下，常见 `kCFRunLoopDefaultMode` 与 `UITrackingRunLoopMode`（滑动时切换，保证滑动流畅不被其他任务打断）；`NSRunLoopCommonModes` 是“集合”，把 Timer 加进去则两种 Mode 都能跑——这就是 NSTimer 停止于滚动的原因与解法。',
            '应用场景一：**卡顿监控**——在 Observer 监听 `BeforeSources`（即将处理事件）与 `AfterWaiting`（休眠结束）两个状态，若两次回调间隔超过阈值（如连续多帧），说明主线程卡顿，dump 堆栈上报。',
            '应用场景二：**常驻子线程**——子线程开 RunLoop 处理定任务（AFN 老版本的常驻线程）；场景三：**AutoreleasePool**——主线程 RunLoop 每圈开始 push、结束 pop，解释了“for 循环里创建大量临时对象的释放时机”；场景四：滑动时把任务切回 default mode 执行，避免和滚动抢 CPU。',
          ],
          followUps: [
            {
              question: '用 RunLoop 做卡顿监控的具体实现？怎么避免把“空闲”当成卡顿？',
              points: [
                '主线程注册 **CFRunLoopObserver** 监听 kCFRunLoopBeforeSources 与 kCFRunLoopAfterWaiting：两个状态之间就是“正在处理事件”，由子线程定时检查，超过阈值即 dump 主线程堆栈上报。',
                '区分空闲与卡顿：RunLoop 无事时也走 AfterWaiting → 休眠 → BeforeSources 的循环，只看超时会误报；实践用**两次回调间隔 + 堆栈内容双重判定**（堆栈停在业务代码才算）、连续多帧确认、阈值分级上报。',
              ],
            },
            {
              question: 'NSTimer 为什么不准时？对精度有要求的计时怎么做？',
              points: [
                '两个原因：**Mode 绑定**——Timer 注册在 NSDefaultRunLoopMode，滑动时 RunLoop 切到 TrackingMode，Timer 暂停；**不补齐**——RunLoop 忙时错过的 tick 直接顺延不补发，累计误差越来越大。',
                '解法按精度选：把 Timer 加进 **NSRunLoopCommonModes** 解决暂停问题；高精度计时用 **GCD Timer（dispatch_source_t TIMER）**，由内核触发、不依赖 RunLoop；CADisplayLink 与屏幕刷新同步适合动画驱动——三者都要注意强引用循环与 invalidate。',
              ],
            },
          ],
        },
        {
          id: 'mo-ios-category',
          title: 'Category 的实现原理是什么？为什么不能直接添加属性？load 和 initialize 有什么区别？',
          difficulty: 'advanced',
          tags: ['Category', 'Runtime'],
          points: [
            'Category 在编译期是独立的结构体（**category_t**：名字、类对象、实例方法列表、类方法列表、协议、属性声明）。运行时由 **runtime 把 category 的方法列表“附加”到类的方法列表**：倒序遍历编译顺序，把后编译的 category 方法**插到方法列表前面**——所以同名方法“覆盖”只是查找顺序靠前，原方法还在，可通过遍历方法列表或 removeMethod 再 add 的方式调到原实现。',
            '多个 category 同名方法的优先级：**参与编译顺序（Build Phases 里的 Compile Sources 顺序）**决定，后编译的优先。',
            '不能直接加属性的原因：属性的**成员变量（ivar）在编译期随类结构体确定**，objc_class 的 ivar list 大小运行期不可变，category 没有承载 ivar 的位置。变通方案是**关联对象** `objc_setAssociatedObject / objc_getAssociatedObject`（本质是把值存在全局的 AssociationsManager 哈希表里，以对象指针 + key 索引，随对象 dealloc 释放）。',
            '**load**：类和 category **加载进内存时**由 runtime 直接调用（不走消息机制），调用顺序为父类 → 子类 → category，按编译顺序；适合 swizzle。**initialize**：**第一次收到消息时**才调用（走 objc_msgSend，线程安全），父类先于子类，可能被多次触发（子类未实现会调用父类的），适合全局配置。load 里应极简，大量 +load 会拖慢启动。',
            '对比 Extension（类扩展）：Extension 在**编译期**和类合为一体，可以加属性和 ivar，但必须在类的主实现文件里；category 是**运行期**合并，可为系统类扩展。Category 还能加协议实现（常用于给系统类加 delegate 默认实现）。',
          ],
          followUps: [
            {
              question: '关联对象的存储结构是什么？它的生命周期跟谁走？',
              points: [
                '值存在全局的 **AssociationsManager → AssociationsHashMap**：以**对象指针地址**为一级 key，映射到该对象的所有关联（自定义 key → 策略 + 值），读写有锁保护——所谓“加属性”本质是查这张全局哈希表。',
                '生命周期随宿主：对象 **dealloc 时 runtime 统一清空它的关联项**，不会泄漏；OBJC_ASSOCIATION_RETAIN/NONATOMIC_RETAIN 决定内存语义，用 ASSIGN 存对象会有野指针风险——关联对象不是免费的属性，读写有哈希表开销。',
              ],
            },
            {
              question: '为什么 method swizzle 通常写在 +load 里？swizzle 有哪些坑？',
              points: [
                '+load 由 runtime **直接以函数指针调用**（不走 objc_msgSend），发生在 main 之前、顺序为父类 → 子类 → category——此刻交换 IMP，能保证之后所有消息都走新实现，也不受业务代码时序影响。',
                '坑：多个库 swizzle 同一个方法会**链式覆盖**（规范是交换后必须调用原实现）；父类未实现该方法时直接 swizzle 会丢失继承链（先 `class_addMethod` 兜底）；swizzle 是全局副作用，排查问题时会造成“代码与运行行为不一致”的迷惑——要用统一工具类管理并注释清楚。',
              ],
            },
          ],
        },
        {
          id: 'mo-ios-objc-msgsend',
          title: 'objc_msgSend 的方法查找流程是怎样的？消息转发三步能做什么？',
          difficulty: 'intermediate',
          tags: ['Runtime', '消息转发', 'objc_msgSend'],
          points: [
            'OC 方法调用编译为 **objc_msgSend(receiver, sel, ...)**：先查接收者的**方法缓存**（bucket 哈希表，命中即跳转 IMP，绝大多数调用到此为止），未命中再查本类方法列表（已排序，二分查找），仍未命中沿 **父类链逐级**重复"缓存 → 方法列表"。',
            '三级都找不到进入**消息转发**：① **动态方法解析** `resolveInstanceMethod:`——运行时用 class_addMethod 补实现（@dynamic 属性的实现原理）；② **快速转发** `forwardingTargetForSelector:`——换个接收者（代理/备用对象）重发，开销小；③ **慢速转发** `forwardInvocation:`——拿到 NSInvocation 可任意改参数/目标，什么都不做则 `doesNotRecognizeSelector:` 崩溃。',
            '应用场景：多播委托与消息兜底（转发给数组内多个对象）、JS 与 OC 互调桥接、**防崩溃兜底**（线上对未实现方法的统一拦截上报）、CoreData 的 @dynamic 懒加载。',
            '与 Method Swizzling 的区别：Swizzling 在**查找阶段**交换同类方法的 IMP（影响所有调用），转发在**查找失败后**改变消息去向（只影响未实现的选择子）——hook 系统方法用 Swizzling，动态能力/兜底用转发。',
          ],
          followUps: [
            {
              question: '为什么要有方法缓存？它是怎么加速查找的？',
              points: [
                '方法列表是二分查找 O(log n)、父类链线性遍历——高频调用每次都走太慢；缓存把 sel 映射到 IMP，哈希命中直接调用，实测绝大多数调用不进慢路径。',
                '缓存扩容与桶优化：存储 bucket_t（sel + imp），开放寻址；子类第一次命中父类方法后，该方法也进子类缓存。',
              ],
            },
            {
              question: '消息转发的性能代价大吗？什么时候不该用？',
              points: [
                '动态解析每个方法只触发一次（结果会缓存）；快速转发近似一次额外函数跳转，都很便宜。',
                '慢速转发每次都要构造 **NSInvocation**（参数装箱），高频路径（如 cellForRow）慎用；热路径兜底更适合 resolve 阶段 addMethod 或直接修调用方。',
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'mo-cross',
      name: '跨端开发',
      description: 'React Native、Flutter、小程序等跨端方案的实现原理、性能取舍与选型思路。',
      references: [
        { label: 'React Native 官方 · 架构概览', url: 'https://reactnative.dev/docs/architecture-overview' },
        { label: 'Flutter 官方 · Architectural overview', url: 'https://docs.flutter.dev/resources/architectural-overview' },
        { label: '微信小程序官方 · 框架文档', url: 'https://developers.weixin.qq.com/miniprogram/dev/framework/' },
      ],
      questions: [
        {
          id: 'mo-cross-selection',
          title: 'H5、React Native、Flutter、小程序，跨端方案怎么选型？',
          difficulty: 'basic',
          tags: ['跨端选型', '架构'],
          points: [
            '先按业务形态分层：**营销活动页/内容页 → H5**（免发版、SEO、链接直达）；**微信内业务/流量入口 → 小程序**（体验优于 H5、有平台流量）；**独立 App 的功能页 → RN 或 Flutter**（接近原生的体验）；**强动效、强一致性 → Flutter**。',
            '选型的通用维度：**性能与体验**（渲染方式决定上限）、**动态化能力**（H5/小程序/RN 可热更，Flutter 原生不支持）、**团队技术栈**（Web 团队 → RN，无历史包袱 → Flutter）、**包体积与启动**（Flutter 引擎数 MB，RN 依赖原生 + JS bundle）、**生态与长期维护**（社区活跃度、大厂背书）、**与原生的混合成本**。',
            '一句话概括各家 trade-off：H5 性能下限低但部署最灵活；小程序受平台管控但换流量与稳定性；RN 用真实原生控件，平台一致性弱于 Flutter 但系统能力接入自然；Flutter 自绘，一致性最好、动效最强，代价是包体积与动态化受限。',
            '真实项目往往是**混合架构**：壳 + 原生核心模块（相机、支付、推送）+ 跨端业务页 + 活动页 H5，选型是“按页面粒度”而非“全 App 一刀切”。',
          ],
          followUps: [
            {
              question: 'App 里的 H5 页面体验差，常见原因和优化手段有哪些？',
              points: [
                '慢在加载链路：**WebView 初始化（几百 ms）→ 网络请求 → 首屏渲染**串行叠加。优化三板斧：**WebView 复用池与预创建**、**离线包**（静态资源内置/增量下发，拦截请求走本地，接口预取）、骨架屏与首屏数据缓存。',
                '体验补齐靠 **JSBridge 打通原生能力**：统一的标题栏、返回手势、下拉刷新、分享组件；长列表用虚拟滚动，弱网做降级与重试——“类原生 H5”是这一组手段的组合结果，而不是某个单点优化。',
              ],
            },
          ],
        },
        {
          id: 'mo-cross-rn-new-arch',
          title: 'React Native 的新架构（JSI/Fabric/TurboModules）解决了旧架构的什么问题？',
          difficulty: 'intermediate',
          tags: ['React Native', '新架构', 'JSI'],
          points: [
            '旧架构的核心是 **Bridge**：JS 与 Native 之间异步传递**JSON 序列化**消息。三大痛点：**异步**导致 JS 无法同步拿到布局、测量等结果（measure 回调、丢帧）；**序列化**在消息量大（快速滚动、动画）时开销明显；**消息排队**造成拥堵，状态不同步。',
            '**JSI（JavaScript Interface）**是地基：一层 C++ API，让 JS 直接持有 Native 对象的引用（HostObject），**同步、无序列化**地互相调用；它也是引擎无关的（可换 Hermes/JSC/V8），为其他模块铺路。',
            '**Fabric** 是新渲染器：C++ 实现的渲染管线，维护一棵**可同步访问的 Shadow 树**，渲染计算与 JS 同步交互，支持**优先级调度**（用户交互优先渲染）、更好的并发特性（Suspense 等 React 特性）协同。',
            '**TurboModules**：原生模块按需初始化（旧的在启动时全量注册），通过 JSI 直接暴露方法，启动更快、调用更省；**Codegen** 在构建期生成 JSI 绑定代码，带来**类型安全**并省掉运行时解析。',
            '配套的 **Hermes 引擎**：发布时预编译成字节码，省掉启动期 JS 解析，启动更快、内存更低、支持 HBC 缓存。答题时可以收在“新架构把跨进程异步消息模型，换成了进程内同步调用模型，这是质的改变”。追问延伸：Bridgeless 模式、与 Expo 的关系、Codegen 的使用成本。',
          ],
          followUps: [
            {
              question: 'JSI 的 HostObject 机制是怎么让 JS 同步调用 Native 的？',
              points: [
                'JSI 是一层 **C++ 抽象**：JS 侧拿到 HostObject 的代理引用，访问属性或调用方法时，JS 引擎回调 C++ 的 get/call，再分发到 Native 实现——**同步返回、无 JSON 序列化**，二进制数据（TypedArray）可近零拷贝共享。',
                '它是引擎无关的（Hermes/JSC/V8 都能挂接），这也是 Hermes 可替换的根基；但同步调用意味着 **Native 卡住会直接卡住 JS 线程**——重操作仍然要异步设计，JSI 解决的是通道效率，不是阻塞问题。',
              ],
            },
            {
              question: 'Hermes 为什么能显著改善启动性能？代价是什么？',
              points: [
                '发布期把 JS **预编译为字节码（HBC）**随包分发，运行时省掉整个解析编译阶段（旧引擎启动时要现场 parse 数 MB 的 bundle）；字节码 mmap 按需加载，**内存峰值更低、启动可交互时间更短**。',
                '代价：包体积略有增加、依赖旧引擎特性的库需要适配；配套的 GC 针对移动端短生命周期对象做了优化。可以顺势收一句：JSI/Fabric/TurboModules 三件套在 Hermes 上才能发挥完整收益。',
              ],
            },
          ],
        },
        {
          id: 'mo-cross-flutter-render',
          title: 'Flutter 的渲染原理是什么？Widget、Element、RenderObject 三棵树各起什么作用？',
          difficulty: 'intermediate',
          tags: ['Flutter', '渲染原理', '三棵树'],
          points: [
            'Flutter **不走原生控件，自绘一切**：Dart framework 生成 Layer 树，交给 **Impeller/Skia 图形引擎**直接调用 GPU（Metal/Vulkan/OpenGL）绘制，只有平台视图（PlatformView）与触达系统能力时才走原生通道。好处是**多端像素级一致、动画能力不受原生控件限制**，代价是包体积与原生细节差异。',
            '三棵树分工：**Widget** 是不可变的配置描述（每次 setState 重建，廉价）；**Element** 是中间层实例（持有 BuildContext 与生命周期，负责 diff 与复用，是“树”真正常驻的形态）；**RenderObject** 负责真正的布局、绘制、命中测试（重而稳定）。',
            '性能关键在于：Widget 重建并不触发 RenderObject 重建——Element 做 **canUpdate（runtimeType 与 key 相同则复用）**判断，仅把新配置更新到旧 RenderObject 上，这就是 Flutter 局部刷新的机制；所以“Widget 每帧都重建”并不等于“每帧都重绘”。',
            '**Dart 的选择**：开发期 **JIT** 支持秒级热重载，发布期 **AOT** 编译成机器码保证性能；**Isolate** 单线程 + 事件循环（无共享内存、消息传递通信），避免了锁竞争，UI 线程不被阻塞即不掉帧，重计算放独立 Isolate。',
            '追问点：着色器编译卡顿由 **Impeller**（预编译着色器，替代运行时 Skia 的 SkSL 编译）解决；布局管线是**一次 layout（约束向下、尺寸向上）**；setState 的粒度控制与 const Widget 减少重建。',
          ],
          followUps: [
            {
              question: 'setState 之后 Flutter 内部发生了什么？为什么说滥用 setState 是性能问题的头号来源？',
              points: [
                'setState 只做一件事：**把当前 Element 标记为 dirty 并注册到 BuildOwner**，下一帧 VSYNC 到来时统一 rebuild——新 Widget 树经 Element 用 **canUpdate（runtimeType + key）** 比对，复用并更新 RenderObject，而不是推倒重来。',
                '代价在标记粒度：dirty Element 的**整棵子树都会 rebuild**，动画、滚动里高频 setState 会制造海量 Widget 对象与 GC 压力；优化方向是把状态**下沉到最小子树**（拆细 StatefulWidget、ValueListenableBuilder 精确刷新），配合 const Widget 复用。',
              ],
            },
            {
              question: 'Flutter 和原生怎么通信？Platform Channel 的开销在哪？',
              points: [
                '主通道是 **MethodChannel**：Dart 与平台侧异步互发消息，参数经 **StandardMessageCodec 编码为二进制**，由 engine 的 messenger 在 Dart UI 线程与 platform 线程之间中转；另有 EventChannel（事件流）与 BasicMessageChannel。',
                '开销在**编解码与两次线程切换**，传大块数据（图片字节流、批量列表）要格外谨慎；高频或大数据用 **FFI 直调**或 Pigeon 生成类型安全代码；PlatformView（嵌原生地图/WebView）要走双渲染体系合成，是 Flutter 混合开发公认的坑点。',
              ],
            },
          ],
        },
        {
          id: 'mo-cross-miniprogram',
          title: '小程序的双线程架构是怎样的？为什么这样设计？setData 有什么性能问题？',
          difficulty: 'intermediate',
          tags: ['小程序', '双线程', 'setData'],
          points: [
            '双线程模型：**逻辑层**（JS 运行在 JsCore/V8 的独立线程，无 DOM/BOM）与**渲染层**（每个页面一个 WebView，新版有 Skyline 渲染引擎），两层之间通过 **Native 层的 Bridge 序列化通信**——`setData` 把数据从逻辑层传给渲染层，事件（bindtap 等）反向传回。',
            '为什么双线程：**安全与管控**——小程序要允许第三方开发者写代码，又不能让他们操控 DOM 随意跳转、采集数据；JS 与渲染隔离后天然形成**沙盒**，平台可以审查接口、控制权限。代价是**通信开销**：所有数据与事件都要序列化过桥。',
            'setData 的性能问题：**跨线程序列化 + 通信有延迟**，大数据量、高频调用会造成逻辑层耗时、传输耗时、渲染层 diff 渲染耗时三段叠加，表现为更新卡顿掉帧。',
            '优化手段：**只传变化的数据并带路径**（`this.setData({ \'list[3].name\': \'x\' })`）而不是整个对象；**合并高频 setData**（滚动/拖拽场景做节流或用 WXS/工作线程响应动画）；避免把不参与渲染的大数据塞进 data（放 `this` 上）；长列表用虚拟节点/recycler 视图。',
            '延伸：**分包加载**（主包限制 2MB 级，独立分包可不走主包启动）优化启动；预渲染、Skyline 把渲染层从 WebView 换成原生渲染解决 WebView 的性能天花板；对比 RN——小程序本质上是“渲染层也被平台托管”的更受控的跨端方案。',
          ],
          followUps: [
            {
              question: '为什么 setData 只能传可序列化数据？路径更新是怎么优化的？',
              points: [
                '逻辑层与渲染层是**两个隔离的 JS 环境**，数据要经 Native 层序列化过桥——函数、循环引用、DOM 对象都传不过去，所以 setData 只收纯 JSON；这也是小程序与浏览器“直接操作 DOM”思维的边界。',
                '路径更新 `this.setData({ "list[3].name": "x" })` 只把**变化的那一小片数据**序列化传输，渲染层按路径做局部更新——避免整个数组重新过桥再整树 diff，这是官方文档排第一的 setData 优化。',
              ],
            },
            {
              question: '小程序的启动性能怎么优化？分包和预下载怎么配合？',
              points: [
                '启动 = **下载 + 注入 + 首屏渲染**三段：分包把非核心业务拆出主包（主包有 2MB 级限制），**独立分包**不依赖主包可单独启动（适合广告落地页、分享页）；`preloadRule` 在用户浏览当前页时**预下载下一步分包**，把下载藏进等待时间里。',
                '再叠加：按需注入（`lazyCodeLoading: "requiredComponents"`，只注入用到的组件代码）、初始渲染缓存、骨架屏；Skyline 渲染引擎把渲染层从 WebView 换成原生渲染，解决长列表与复杂动效的天花板。',
              ],
            },
          ],
        },
        {
          id: 'mo-cross-harmonyos',
          title: '鸿蒙（HarmonyOS）应用开发与 Android 有什么异同？ArkTS/ArkUI 是什么思路？',
          difficulty: 'intermediate',
          tags: ['鸿蒙', 'HarmonyOS', 'ArkTS'],
          points: [
            '**架构层面最大的差异：分布式与统一生态**——HarmonyOS 从设计上面向"全场景"（手机/平板/手表/车机/IoT），应用天然按**多设备形态自适应**（一多开发：一套工程适配多端）；分布式软总线让跨设备协同（接续、协同调用其他设备能力）是系统级能力，而 Android 是以手机为中心、跨设备靠云同步/投屏等外挂方案。',
            '**开发范式 ArkTS/ArkUI：声明式 UI + 状态驱动**——ArkTS 是 TypeScript 的超集（静态化加强，禁用部分动态特性换取 AOT 性能），ArkUI 用 **@Component + build() + @State/@Prop/@Link** 的声明式写法，与 SwiftUI/Compose 同构（UI = f(state)），前端工程师迁移成本相对低。对比 Android：Java/Kotlin + View/XML（命令式）或 Compose（声明式）——范式演进方向一致，但鸿蒙**原生就是声明式起步**。',
            '**工程结构差异**：HarmonyOS 的应用是 **HAP 包**（Ability 是最小调度单元：UIAbility 管界面、ExtensionAbility 管后台场景），Stage 模型下由 **UIAbility + WindowStage** 组织页面路由；权限模型、后台任务管控比 Android 更收紧（重续_statless 后台策略），安全上按 ACL 精细授权。与 Android 的"四大组件"映射着学：Activity ≈ UIAbility，Service ≈ 后台任务/ExtensionAbility，但不能机械套用语义。',
            '**生态与就业视角收束**：技术决策上鸿蒙要回答"多端触达 + 国产生态要求"是否成立；工程师视角它是"**移动端第三平台**"——ArkTS 声明式、方舟编译器 AOT、ArkUI-X 跨端（同一套 ArkUI 出 Android/iOS 版），能把它与 Compose/SwiftUI/Flutter 放在同一个声明式坐标系里对比，就是这道题的完整答案。',
          ],
          followUps: [
            {
              question: 'HarmonyOS NEXT 不再兼容 Android APK，对开发与跨端策略意味着什么？',
              points: [
                '历史背景：早期 HarmonyOS 为平滑过渡**兼容 AOSP**（可装 APK），NEXT 起移除 AOSP 层、只跑**原生鸿蒙应用（HAP/ArkTS）**——意味着双端策略从"一套代码两端跑"变成**真正的第三端**：要么原生重写（ArkTS），要么依赖跨端框架覆盖（Flutter/RN 的鸿蒙适配、ArkUI-X）。',
                '工程决策框架：用户价值（鸿蒙设备覆盖率与目标人群重合度）× 维护成本（三端并行发版、特性对齐、双倍测试矩阵）× 政策/生态要求（国内应用市场与政企场景的合规驱动力）。能从"跨端矩阵从 2×N 变 3×N 的成本曲线"角度分析，是移动负责人视角的答案。',
              ],
            },
          ],
        },
        {
          id: 'mo-cross-on-device-ai',
          title: '端侧大模型（on-device AI）怎么落地？为什么上端、怎么解决算力与内存？',
          difficulty: 'intermediate',
          tags: ['端侧 AI', '大模型', '量化', 'NPU'],
          points: [
            '**为什么上端（四个真实理由）**：① **隐私**（输入不出设备——健康/输入法/通讯录场景的合规刚需）；② **延迟与离线**（本地推理首 token 不走网络，弱网/飞行可用）；③ **成本**（端侧推理"免费"占用用户算力，云端 token 费随 DAU 线性涨）；④ **个性化**（本地数据可全量做上下文，不用上传）。反面的清醒认知：端侧模型能力天花板明显（1~8B 量级），**复杂任务仍要云端——端云协同是常态而非二选一**。',
            '**模型侧：量化是生命线**：主流端侧部署 **int4 量化**（AWQ/GPTQ 类），1.8B~4B 模型压到 1~3GB 装进旗舰机内存预算；再配**词表裁剪**（中文场景砍多语种词表省几百 MB）与**投机小模型**（端侧小模型草拟 + 云端校验，省往返）；模型选型口径：按**内存预算倒推参数规模**，而不是反过来——1B 级做摘要/改写/意图识别够用，复杂推理别硬上端。',
            '**推理侧：算力栈的三层**：**NPU/神经引擎**（Core ML 在 Apple Neural Engine、骁龙 Hexagon——能效比最高但算子支持受限）；**GPU delegate**（Core ML/Metal、LiteRT 的 GPU delegate、MNN/NCNN 的 GPU 后端）；**CPU 兜底**（算子不全时回落，能效最差）；工程难点 = **算子兼容**（量化图里某个 op 不支持 NPU 就整段回落 GPU/CPU，性能断崖——要 profile 每层落点）；iOS 的 MLX、Android 的 LiteRT/MediaPipe、各厂商 SDK（MNN/NCNN/MiniCPM 部署链）是当前工具版图。',
            '**工程约束清单（显水平的部分）**：**内存峰值控制**（模型权重 + KV cache + 前台 App 预算——iOS 后台超内存直接杀进程；KV cache 随上下文线性涨，端侧上下文窗口普遍收到 4~8K）；**发热与降频**（持续推理触发温控降频，性能测试要带 30 分钟续航/温度曲线，不能只测冷启动一次的 token 速率）；**首 token 延迟**（模型加载 1~2 秒——常驻后台常量内存 or 按需加载的权衡，与 iOS 后台限制的博弈）；**电量**（每千 token 的耗电要做预算）。',
            '**端云协同路由（架构收束）**：请求进来先分类——**简单/隐私/离线任务走端**，**复杂/长上下文/需要最新知识走云**；路由可以是端上小模型做的意图分类；进阶形态是**端侧预填充 + 云端解码**、云端缓存热点 prompt 下发端侧复用。答题框架记四层：**为什么上端（隐私/延迟/成本）→ 模型怎么变小（量化/裁剪）→ 算力怎么用对（NPU 栈/算子）→ 端云怎么分工（路由）**。',
          ],
          followUps: [
            {
              question: '端侧模型的 KV cache 也会吃内存，上下文一长就爆，怎么办？',
              points: [
                '治本三招：**限制上下文窗口**（产品侧接受 4K 而不是 128K，长文档场景直接路由云端）；**KV cache 量化**（int8/int4 的 KV，省一半以上精度损失可控）；**滑动窗口 + 摘要**（老对话压缩成摘要，只保留近期轮次的完整 KV——与上下文工程题的压缩策略同源，端侧只是预算更紧）。',
                '工程兜底：**内存水位监控 + 优雅降级**（快到红线时主动截断上下文或迁移云端，而不是等系统杀进程丢用户会话）；iOS 的内存警告回调里释放推理中间态。这题实际在考"资源受限下的上下文经营"——把服务端的上下文工程思想缩到手机预算里再做一遍。',
              ],
            },
          ],
        },
        {
          id: 'mo-cross-flutter-vs-rn',
          title: 'Flutter 和 React Native 深度对比：自绘引擎和原生控件映射各自意味着什么？',
          difficulty: 'advanced',
          tags: ['Flutter', 'React Native', '技术选型'],
          points: [
            '渲染模型的根本差异：**RN 把 JS 组件映射为真实原生控件**（新架构下经 JSI/Fabric 同步操作原生视图树），观感与平台一致、系统行为（无障碍、输入法、字体渲染）免费获得；**Flutter 用 Impeller/Skia 自绘**，多端像素级一致、动效自由，但无障碍、系统控件行为要自己适配，包体积多出引擎（数 MB）。',
            '性能特征不同：Flutter 渲染在自有管线里，帧率稳定、长列表表现好；RN 的性能瓶颈历史上在 Bridge，新架构后明显改善，但复杂动效仍受原生视图合成与 JS 调度影响。',
            '**动态化**：RN 的 JS bundle 可服务端下发（热更新，需注意应用商店政策与合规）；Flutter 官方不支持动态下发代码（AOT 编译产物不可热替换，社区方案有合规风险）。这是很多强运营业务选 RN 的决定性因素。',
            '工程维度：Flutter 用 **Dart**，团队学习成本高但工具链统一（hot reload 体验好、DevTools 完善）；RN 用 **React + TypeScript**，Web 团队迁移成本最低、npm 生态可复用，但要面对“三方原生库版本兼容”的碎片化。',
            '结论话术：**没有银弹，按页面粒度混用**——核心动效页、跨品牌一致性要求高的用 Flutter；业务迭代快、需要热更新、Web 团队主导的用 RN；两者都还要配合原生壳与原生能力模块。新架构后的 RN 与 Flutter 的差距在缩小，选型更多看团队与业务约束。',
          ],
          followUps: [
            {
              question: 'Flutter 的 PlatformView 是什么？为什么说它是混合开发的性能难点？',
              points: [
                'PlatformView 让**原生视图（WebView、地图、播放器、广告 SDK）嵌入 Flutter 页面**：Android 走 Virtual Display / Hybrid Composition，iOS 走 UiKitView——本质是原生与 Flutter **两套渲染体系的合成问题**。',
                '难点：跨层合成带来额外的纹理拷贝、内存开销与手势冲突，低端机明显掉帧；架构上应尽量**把原生能力下沉为插件**（用 Flutter Canvas 重绘替代嵌原生 View），只对无法重写的组件（地图、WebView）保留 PlatformView 并控制数量。',
              ],
            },
            {
              question: 'RN 的热更新为什么受限？Flutter 真的完全不能动态化吗？',
              points: [
                'RN 的 JS bundle 本质是**资源文件**，可服务端下发实现热更；但 App Store 指南限制下载**可执行代码**改变应用行为，iOS 热更要在框架允许范围内做且有审核风险；国内 Android 生态普遍宽松——平台差异决定了合规策略。',
                'Flutter 的 Dart 发布期 **AOT 编译成机器码**，产物无法解释执行，官方不支持热更；社区的动态化方案（重新实现 Dart 解释器）有合规与稳定性双重风险——这就是强运营业务在两者之间常选 RN 的根本原因。',
              ],
            },
          ],
        },
        {
          id: 'mo-cross-jsbridge',
          title: 'JSBridge 的通信原理是什么？JS 和 Native 之间怎么互调？',
          difficulty: 'advanced',
          tags: ['JSBridge', 'WebView', 'Hybrid'],
          points: [
            'JS → Native 的通道：Android 上主流是 **addJavascriptInterface** 注入对象（API 17+ 必须加 `@JavascriptInterface` 注解，否则有远程代码执行漏洞），辅以 `shouldOverrideUrlLoading` 拦截自定义 scheme；iOS 上 WKWebView 用 **WKScriptMessageHandler**（`window.webkit.messageHandlers.xxx.postMessage`），老 UIWebView 用 scheme 拦截。scheme 拦截的缺点：URL 长度限制、需要约定编码。',
            'Native → JS 只有一条路：**执行 JS 字符串**——Android 的 `evaluateJavascript`（优于老 loadUrl，不刷新页面、有返回值）、iOS 的 `evaluateJavaScript`。所以 JS 侧要先注入全局回调函数供 Native 调用。',
            '**回调机制**是 JSBridge 的关键设计：JS 调用 Native 时生成唯一 **callbackId**，把回调存入 map，请求参数 + callbackId 一起传给 Native；Native 处理完用 evaluateJavascript 执行 `bridgeCallbacks[callbackId](result)`，JS 取出并删除回调，实现异步仿同步的调用体验。',
            '安全设计：**域名白名单**（只允许可信页面的 H5 调用敏感 API）、参数校验、敏感接口二次确认；URL scheme 通道要注意防止恶意页面伪造调用。',
            '延伸对比：小程序的Bridge = 这套机制的“平台化”（外加逻辑层/渲染层分离）；RN 新架构的 JSI 是“进程内同步”的更优解，JSBridge 是“跨进程异步”方案，WebView 里目前仍以 JSBridge 为主。答题收尾：一套成熟的 JSBridge 还要考虑**注入时机**（shouldInterceptRequest 或提前注入）、批量消息、队列化与超时处理。',
          ],
          followUps: [
            {
              question: 'JSBridge 的注入时机为什么关键？bridge 没就绪时 H5 的调用怎么不丢？',
              points: [
                '注入太晚会丢调用：页面 JS 早期就可能发起请求（埋点、鉴权），此时 bridge 对象还不存在。标准做法是 **WebView 创建后立刻注入**——Android 在 loadUrl 之前 addJavascriptInterface；iOS 用 WKUserContentController 在 document start 阶段注入。',
                '双保险是 **H5 侧调用队列**：bridge 未就绪时调用先入队，检测到就绪后批量 flush；再配 **超时兜底**（调用 N 秒无响应走失败回调），避免“点了没反应”的体验黑洞——这两点是把 JSBridge 做成熟的关键工程细节。',
              ],
            },
            {
              question: '开放给 H5 的 JSBridge 怎么防第三方页面滥用？',
              points: [
                '**域名白名单是第一道闸**：只有可信域名的页面才能调用完整 API，敏感接口（支付、用户信息、登录态）再做**接口级鉴权与二次确认**；来源不可信的调用直接拒绝并记录。',
                '纵深防御：Android 的 addJavascriptInterface 在 API 17 以下有反射 RCE 漏洞，必须**最低版本约束 + @JavascriptInterface 白名单方法**；H5 传入的参数一律当不可信输入做 schema 校验，防止构造畸形数据攻击原生层；scheme 拦截方案还要防恶意页面伪造 URL。',
              ],
            },
          ],
        },
        {
          id: 'mo-ios-swiftui',
          title: 'SwiftUI 和 UIKit 的区别是什么？声明式 UI 在 iOS 上怎么落地？',
          difficulty: 'intermediate',
          tags: ['SwiftUI', 'UIKit', '声明式 UI'],
          points: [
            '**范式差异**：UIKit 是**命令式**——UIViewController 持有 UIView 树，生命周期回调（viewDidLoad/viewWillAppear）里手动布局（Frame 或 AutoLayout 约束）、手动更新控件；SwiftUI 是**声明式**——`var body: some View` 描述"状态到界面的映射"，状态（@State/@StateObject/@Published）变化自动触发 body 重算与最小化 diff 更新（与 React/Compose 同构，前端范式可平移）。',
            '**声明式的核心机制**：**属性包装器决定数据的"所有权与流向"**——@State 组件私有可变状态，@Binding 子视图获得可写引用，@ObservableObject/@EnvironmentObject 跨组件共享（Combine 发布订阅），观测到变化就重算 body。生命周期从"回调序列"变成"任务修饰符"（.onAppear/.task——后者自动随视图销毁取消 Swift Task，结构化并发与 UI 生命周期绑定的典范）。',
            '**UIKit 没死（工程判断）**：存量代码、深度自定义（复杂转场动画、自定义容器 Controller）、底层能力（UIGestureRecognizer 细粒度手势、某些系统级 API）仍是 UIKit 主场；SwiftUI 提供 **UIViewRepresentable/UIViewControllerRepresentable** 桥接，混编是常态。选型口径：**新项目/新页面 SwiftUI 优先**（代码量减半起步、预览提效、Apple 全平台一套技术栈），复杂老页面渐进迁移。',
            '辩证收尾：SwiftUI 的短板要主动说——**细粒度性能控制不如 UIKit 直白**（黑盒 diff，Profiler 才能定位重绘）、老系统版本兼容、超大列表/复杂编辑器仍有坑（UICollectionView 在超重型场景仍是性能天花板）。能把"声明式提效"与"命令式可控"讲成权衡，比站队高一档。',
          ],
          followUps: [
            {
              question: '@State、@Binding、@StateObject、@EnvironmentObject 分别用在什么场景？选错会发生什么？',
              points: [
                '**所有权决定选型**：@State——视图私有的值类型状态（SwiftUI 自己管理存储，重算 body 不丢）；@Binding——把父视图状态的"写权限"传给子视图（双向绑定）；@StateObject——视图**创建并拥有**引用类型模型（ObservableObject，随视图生命周期初始化一次）；@EnvironmentObject——沿环境注入的共享依赖（不关心谁创建，只订阅）。',
                '选错的典型事故：把 @StateObject 写成 @ObservedObject——模型随视图重建**反复重新初始化**（列表页返回后状态丢失的经典 bug）；把 @State 存引用类型——SwiftUI 只感知值变化，对象内部属性变了不会触发刷新。这道题实际考"SwiftUI 的数据流是否真的用过"，比背概念狠得多。',
              ],
            },
          ],
        },
      ],
    },
  ],
};
