# 批 7 收割种子存档（AI/机器学习增厚）

> 来源：机器学习（清华 2007/2009/2013 期末回忆卷含考生作答 + 浙大赵洲 Review 习题课系列 + 作业）+ 模式识别（homework3/6 含实验复盘）+ 人工智能导论（AI Checklist），共 14+6+4 份、36 条种子。2026-09-30 收割。
> 状态：✅ 已落地（ai.ts 的 ai-ml 领域 +7 新题 +9 追问）

## ✅ 新题 7（ai.ts，ai-ml 领域）

- ai-ml-generative-discriminative（basic）：生成 vs 判别（贝叶斯/LR 原题判断）+ 三条路 + MAP 退化为 MLE（原题）+ L2/L1 ≈ 高斯/拉普拉斯先验；追问：拉普拉斯平滑（原题）、NB 适用边界（原题判断组）
- ai-ml-em-gmm（intermediate）：三硬币隐变量视角（清华原题模型）+ 收敛性质判断组（原题四连）+ GMM vs K-Means（Checklist 遗留核心问题）+ 初值敏感；追问：HMM 三问题与 Baum-Welch（模式识别 homework6 实验复盘）
- ai-ml-ensembling-diversity（intermediate）：低相关才有效（原题选择）+ 多样性四来源 + 集成对不稳定学习器才有效（决策树 vs NB 原题）；追问：公平对比实验设计（2009 原题）
- ai-ml-dimensionality-reduction（basic）：维数灾难 + PCA 目标与先规范化（原题）+ PCA vs LDA（原题判断组）+ 线性/非线性选型（t-SNE KL 散度原题）+ SVD 实现 PCA；追问：主成分与特征值/谱定理衔接
- ai-ml-knn-clustering（intermediate）：KNN 懒学习 + 距离加权（2007 原题设问）+ 噪声/全正例鲁棒性三连（2013 原题）；追问：十字形反例与 Voronoi 边界（2007 原题）、距离度量选择（闵可夫斯基三角不等式原题）
- ai-ml-model-evaluation（basic）：K 折 k 权衡（原题"以上都对"）+ LOOCV 流程 + 1NN 100% 反例（原题）+ 时间序列前向滚动；追问：VC 维与典型值（三年连考）
- ai-ml-decision-theory（advanced）：最小错误率 = 0-1 损失特例 + 损失矩阵平移决策边界（模式识别 homework3 原题定量）+ 代价敏感的工程化 + Neyman-Pearson 延伸；追问：概率估计与决策解耦

## ✅ 追问增强（已有题）

- ai-ml-tree-ensembles ← 预剪枝 vs 后剪枝（浙大 Review 原题考点）+ "集成不剪枝"的路线对照

## 与既有题的分工

- SVM/树模型演进/梯度下降/评估指标/偏差方差/K-Means 原理/类别不平衡/过拟合正则（ai.ts 原有 10 题）未动；本批新题在正文多处互相引用（EM↔K-Means、集成↔偏差方差、决策论↔不平衡）。
- LLM/深度学习内容（ai-dl/ai-llm 领域）未动。

## ❌ 丢弃与理由

- 数学推导类（SVM 对偶、Hausdorff、EM 的 Q 函数推导、三硬币似然计算、AdaBoost α 计算）—— 公式乱码/已有题覆盖
- 层次聚类 AGNES/DIANA、外部 vs 内部指标（Jaccard/DBI/Dunn）、Parzen 窗、伪标签半监督、迁移学习两用法、dropout/数据增强（过拟合题已覆盖）、好特征清单 —— 网课细节，价值中
- BBS 个性化推荐系统设计题（2007 原题）—— 框架太大，独立成题需要推荐系统专题，暂不入库
- 语料缺口：没有免费午餐、early stopping、感知机 vs LR、时间序列 CV 专章 —— 无可读原文
- 批改标准类文件（人工神经网络实验课）中文乱码严重，无概念题可用
