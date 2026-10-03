# 二期 · 批 3 · 计算机视觉新领域（来源：浙大 CV 课件 53 份）

> 语料：`structured/09-人工智能/计算机视觉与图形`（浙大 39 份：CV 导论系列 00-11 + 数字图像处理系列 + 考纲/回忆卷）。
> 收割方式：agent 通读 04 模型拟合 / 05 特征匹配 / 02 成像 / 07 SfM / 08 深度 / 考纲 / 回忆卷，产出 13+2 条种子。

## 新领域 ai-cv（ai.ts，10 题）

1. **ai-cv-image-formation**（basic）：针孔相机模型——透视投影非线性/齐次坐标、灭点与灭线、径向/切向畸变来源、F 数与景深（课件数值：50mm N=1.8 → D≈27.8mm）、虚化四条件原话。
2. **ai-cv-camera-calibration**（intermediate）：内参 4 自由度/外参 6 自由度、DLT 流程（Ap=0 → 最小特征向量 → QR 解耦）、张正友标定（H 8 自由度、≥3 姿态——回忆卷原题）。
3. **ai-cv-filtering-sampling**（basic）：卷积/高斯低通、混叠与 Nyquist、先滤波再下采样、拉普拉斯金字塔带通（考纲原题）。
4. **ai-cv-edge-canny**（basic）：Canny 四步、双阈值滞后连接的意义（回忆卷原题）、LoG 先高斯的动机与 DoG 近似、Sobel = 平滑⊗差分。
5. **ai-cv-features-harris-sift**（intermediate）：好特征标准、Harris λ1/λ2 分类与不变性账本（课件原话）、SIFT 四步、梯度直方图 vs raw patch（考纲原题）、ratio test。
6. **ai-cv-ransac**（intermediate，真题改编）：MSE 被外点主导、四步循环、迭代次数公式 K=log(1−p)/log(1−wⁿ)（回忆卷原题；课件该页缺失，按通用教材口径补）、图像拼接管线追问。
7. **ai-cv-optical-flow-lk**（intermediate）：L-K 三假设、孔径问题（1 方程 2 未知数）、可解性与 Harris 同源（KLT 选点依据）、金字塔 coarse-to-fine。
8. **ai-cv-epipolar-sfm**（advanced）：对极几何概念骨架、E=T×R 与 F=K⁻ᵀEK⁻¹、"深度不影响对极约束"（课件原话）、八点法、增量式 SfM/P3P/BA；追问 GD/Newton/GN/LM 谱系（课件原题重点）与稀疏 LM+Schur。
9. **ai-cv-stereo-depth**（intermediate）：z=fB/d 反比关系、矫正、误差五来源（课件清单）、结构光/LiDAR/双目选型、基线权衡追问（自动驾驶技术路线之争的几何根源）。
10. **ai-cv-detection-segmentation**（intermediate）：滑动窗口 58M 框不可行（课件原数值）、R-CNN→Fast→Faster 谱系、两阶段 vs 单阶段（课件原话）、NMS、FCN/U-Net/DeepLab/Mask R-CNN；追问 anchor-free 动机。

## 丢弃与留白

- 与 ai-dl 已有题重复：CNN 卷积/池化/ResNet 基础（ai-dl CNN 题已覆盖，检测题只讲检测谱系不复讲 CNN）。
- 饼干式 trivia：墨子/亚里士多德年代、ImageNet 错误率年份时间线（只取 ResNet 动机一句）。
- 课件未覆盖（记入留白，不硬写）：Canny 详细步骤在 CV 导论课件正文缺失（按数字图像处理系列考纲口径写）、
  Hough 变换、Mean-Shift、Eigenface 推导、ICP、图形学渲染管线（一期已决定仅带过）。
