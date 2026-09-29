# 批 8 收割种子存档（qa 增厚 + 软件工程过程类）

> 来源：软件工程课程试卷 12 份（浙大 2003~2007-2008 六年带答案 + 2020A 卷 + 2022 Quiz + 清华样卷带答案）+ 浙大题库 2 份 + 复习资料 2 份，30 条种子。2026-09-30 收割。
> 状态：✅ 已落地（qa.ts qa-basics 领域 +5 新题；risk-priority 追问；backend SOLID 追问）
> **范围调整说明**：批 1 计划中"大数据/移动端/运维各 +3~4"在参考库中**无对口语料**（无 Hadoop/移动开发/云原生课程材料），如实跳过不硬凑；本批聚焦有真实试卷支撑的 qa。

## ✅ 新题 5（qa.ts，qa-basics 领域）

- qa-basics-whitebox-coverage（advanced）：白盒覆盖强弱链（语句⊂判定⊂路径；条件与判定互不蕴含）+ 清华选组算例（I/II/III vs I/IV）+ 浙大复合条件最少用例两年连考（5 个/6 个）+ 圈复杂度三公式（V(G)=E-N+2=P+1=区域数）与基本路径四步法追问
- qa-basics-blackbox-complement（intermediate）：黑盒/白盒互补双向反例（NextDate 原题 + while(false) 极端例）+ 方法归属辨析（边界值黑盒/循环测试白盒原题）+ "黑盒测过可省白盒""开发者是最好的测试者"双判断（原题为错）+ 好用例四属性（原题）；追问：三角形等价类表+边界值完整算例（清华原题）
- qa-basics-vv-acceptance（basic）：V&V 经典句式（原题判断/选择）+ 确认 vs 验收测试（执行者 end users 原题）+ 单元测试也要 stub/driver（原题为错）+ 自顶向下/自底向上集成对比 + SQA 客户视角与职责边界；追问：测试 vs 调试 + 调试三法（原题）
- qa-basics-review-economics（intermediate）：FTR 目的/形式谱系（走查/审查原题填空）+ 缺陷放大模型定量（260 vs 70 原题计算）+ 会议纪律与决议 + 测试用例/计划前置时机（原题判断）；追问：配置审计与 FTR 互补 + 基线变更流程（CCA/ECO 原题）
- （集成策略 stub/driver 内容并入 vv-acceptance 第三点）

## ✅ 追问增强

- qa-basics-risk-priority ← 测试不可穷尽性 + Pareto 80/20（浙大原题判断 + 2020 卷填空）
- backend be-general-design-patterns ← 高内聚低耦合分级（内聚七级/耦合五级，浙大复习资料+判断题佐证）

## ❌ 丢弃与理由

- 软件过程类（瀑布/螺旋/XP/Scrum 站会三问/QFD/敏捷 vs 规范化）—— 过程管理向，非测试岗面试核心
- 维护四类型、LOC vs 功能点度量、McCall 质量模型、需求工程与非功能需求量化 —— 软工课程细节，价值中
- SCM 变更管理全流程（已并入 review-economics 追问）、恢复/安全/压力/性能四类系统测试辨析（压测/安全题已覆盖主干）
- 答案存疑处（2004-2005 卷答案错位、OO 集成策略两源分歧）按 agent 标注未采信
