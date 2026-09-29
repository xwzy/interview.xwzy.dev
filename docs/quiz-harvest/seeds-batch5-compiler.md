# 批 5 收割种子存档（编译原理 · 新领域）

> 来源：编译原理课程课件 12 份核心 + 试卷 14 份带答案 + 作业/资料 6 份（清华，2026-09-29 收割，40 条种子）。
> 状态：✅ 已落地（cs-fundamentals.ts 新增 cs-compiler 领域，11 题）｜❌ 丢弃/留待后续

## ✅ 新题（11，领域：cs-compiler）

- cs-compiler-re-cfg-boundary：RE vs CFG 边界 + Chomsky 层次 + aⁿbⁿ（quiz1 判断 4/12）
- cs-compiler-lexer-dfa：Thompson/子集构造/最小化 + 2ⁿ 陷阱 + lex 最长匹配（Mid-term 2021 + 24 期末判断）
- cs-compiler-ambiguity：二义定义抠字眼 + 悬空 else 三解法 + 优先级文法编码（2017 期中 ×2）
- cs-compiler-ll1：LL(1) 判定 + FIRST/FOLLOW 传播 + 消左递归公式 + S→(S)S 反例 + 递归下降立场（2021 大题 4 + 24 期末判断 3）
- cs-compiler-lr-family：LR 四代谱系 + SLR 局限 var/id 例 + LALR 合并代价 + 句柄 + LL/LR 递归偏好（quiz2 + 2008 题 5 + 课件 LR(1)）
- cs-compiler-ir-cfg：三地址码三形式 + 基本块/leader + 活跃变量数据流 + 优化顺序与外提条件（24 期末 + gcx A4）
- cs-compiler-stack-frame：AR 清单 + fp 寻址 + 调用约定 + 静态链/display 追问 + 高阶函数逃逸追问（2008 题 7 + 24 期末大题 3 + 2017 题 6a）
- cs-compiler-param-passing：四种参数传递 + swap/p(a[0],a[0]) 语义 + 现代语言收敛追问（gc & param 课件 + 2020 单选）
- cs-compiler-gc-runtime：mark-sweep/复制/分代/引用计数 + BFS 局部性判断题 + 精确/保守 GC 追问（24 期末判断 19/20）
- cs-compiler-reg-alloc：干涉图着色 + Chaitin-Appel 流程 + Briggs/George 判据 + 线性扫描对照（24 期末大题 8 + chapter11-18 作业）
- cs-scene-compiler-optimization：-O0/-O2 行为差异场景题（UB 是优化器的授权）+ volatile/atomic 追问（综合，工程向）

## 与既有题的分工

- cs-algo-compiler-basics（编译六阶段/AST/JIT/ReDoS）保留在「数据结构与算法」领域，cs-compiler 的 description 已注明分工，不重复。
- JVM GC 调优、类加载在后端方向；链接加载在操作系统方向；AI 编译器 IR 在 ai-infra——均未动。

## ❌ 丢弃/留待

- 符号表组织、短路求值 backpatch（advanced，可作后续增强）、YACC $ 编号、lex 文件三段式——工具细节，口试价值中
- 指令选择 tiling/Maximal Munch、支配节点与自然循环——编译器岗位专用，通用面试价值中
- FORTRAN 全静态环境、C 变参倒序压栈、调用序列 mst/cup——stack-frame 题已点到
- 右递归与 LR 栈增长——已并入 lr-family 题正文
- 静态/动态作用域——已并入 stack-frame 静态链追问
- Chomsky 层次独立成题——并入 re-cfg-boundary 正文
