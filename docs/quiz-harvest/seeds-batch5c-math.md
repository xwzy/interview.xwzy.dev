# 批 5c 收割种子存档（数学基础 · 新领域）

> 来源：概率论与数理统计（浙大含答案卷 + 清华样题/总结/北大/南大，13 份）+ 线代（复习概要/定理总结/MIT 18.06 试卷，5 份）+ 运筹与优化（LP 对偶/非线性规划课件，4 份），2026-09-29 收割，42 条种子。
> 状态：✅ 已落地（cs-fundamentals.ts 新增 cs-math 领域，10 题）

## ✅ 新题（10，领域：cs-math）

- cs-math-bayes（basic）：贝叶斯公式 + 基础率谬误（疾病检测 32% 原题）+ 全概率"由因推果/由果溯因"
- cs-math-expectation-covariance（basic）：独立 vs 不相关 + E(XY) 条件 + 方差运算（含二维正态特权边界）
- cs-math-distributions（basic）：常见分布场景 + 泊松 E=Var 指纹（E(X²)=2Var 原题）+ 指数无记忆性 + 可加性
- cs-math-lln-clt（basic）：LLN vs CLT 分工 + 切比雪夫（Var/ε² 原题）+ √n 尺度与标准误
- cs-math-estimation（intermediate）：无偏/有效/相合（max 估计量原题）+ MLE vs 矩估计 + MSE 分解与正则化根源
- cs-math-hypothesis-testing（intermediate）：p 值正确定义 + 两类错误（螺钉原题）+ 置信区间对偶 + A/B 测试内核（对照实验原题）
- cs-math-linear-geometry（basic）：秩/特征值/行列式几何意义 + 谱定理 + 正定五判据 + 可对角化追问（幂等矩阵）
- cs-math-projection-least-squares（intermediate）：投影矩阵三件套 + 最小二乘几何 + 共线性失效（MIT 18.06 原题）
- cs-math-convex-optimization（intermediate）：凸性免死金牌 + 驻点/鞍点判别 + 之字形与牛顿/LM + KKT 影子价格
- cs-math-multivariate-normal（advanced）：边缘正态⇏联合正态（清华判断原题）+ 二维正态两特权 + 马氏距离与白化

## 与既有题的分工

- 交叉熵/LR、偏差方差分解、正则化对比、优化器（Adam）、PCA 应用 → ai.ts「AI 与大模型」（未动，正文注明）
- 洗牌/蓄水池/拒绝采样 → cs-algo-random（未动）；负载因子泊松 → cs-algo-hashmap（未动）
- FAR/FRR → net-security（未动，正文互相点名同构）

## ❌ 丢弃/留待

- χ² 拟合优度、MLE 相合性证明、全方差公式、贝叶斯因子方向性、0-1 相关系数反解、抽签原理、几何概型 —— 网课细节，口试价值中
- 合同 vs 相似惯性定理、酉对角化清单、AB=O 秩不等式、行列式=特征值积套路 —— 线代应试技巧，通用面试价值中
- 共轭方向/二次终止性、马尔可夫链/随机游走（资料未覆盖）、特征函数 —— 可作 AI 批次或后续增强
- 南大线代卷 GBK 乱码未采信；公式乱码处按上下文还原仅限"一句话可讲"级
