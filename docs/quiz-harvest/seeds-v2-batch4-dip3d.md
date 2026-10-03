# 二期 · 批 16 · ai-cv 第二批（来源：浙大数字图像处理系列 + 3D DL + 计算摄影课件）

> 语料：计算机视觉与图形目录下此前留白的《数字图像处理》系列（3/4/7/8/9 章）、06_image_stitching、
> 11_3D_deep_learning、12_Computational Photography。agent 通读产出 14 条种子。

## 新题 8（ai.ts，ai-cv 领域，每题 1 追问）

1. **ai-cv-histogram-gamma**（basic）：直方图均衡取 CDF、离散实现只能拉宽不能真正均匀（64×64 算例）、
   规定化以均衡为桥梁；伽马 2.2 的 CRT 物理来源、对数变换压傅里叶谱；追问 raw 偏灰与 sRGB 线性空间纪律。
2. **ai-cv-median-morphology**（basic）：中值滤波"脉冲短于半窗即被抑制"→ 椒盐克星；腐蚀/膨胀对偶、
   开闭运算、灰度形态学=最值滤波、顶帽校正阴影；追问结构元形状大小选择。
3. **ai-cv-frequency-domain**（intermediate）：卷积定理、理想低通 sinc 旁瓣振铃 vs 高斯不振铃、
   巴特沃斯居中、大核 FFT 小核直接卷；追问周期噪声频域尖峰与共轭对称。
4. **ai-cv-segmentation-classic**（intermediate）：Otsu 类间方差（算例 T=181、η=0.467）、
   迭代法=2-means、区域生长/分水岭、图割与 Ncut（Shi & Malik 2000）、SLIC 超像素 5 维近线性；追问标记控制分水岭。
5. **ai-cv-hough-transform**（intermediate）：极坐标参数空间投票（12×50 累加器算例）、圆三维参数空间、
   量化两难与随机 Hough；追问车道线为什么还用 Hough。
6. **ai-cv-stitching-homography**（intermediate）：H 8 自由度、成立条件两情形（纯旋转/平面）、
   逆向 warp + 多频段融合、圆柱投影与漂移校正；追问鬼影与接缝 graph-cut。
7. **ai-cv-point-cloud**（intermediate）：体素 3D CNN O(N³)、PointNet 共享 MLP + max pooling 对称函数、
   T-Net 对齐、PointNet++ FPS 分组层次化；追问 max vs average、FPS vs 随机采样。
8. **ai-cv-hdr-deconvolution**（intermediate）：曝光包围多帧合并（0.05~0.95 有效像素、除以 tᵢ）、
   逆滤波放大噪声与 Wiener 抑制、病态问题与 L1 先验、盲去卷积核先验；追问手持多帧对齐与鬼影。

## 丢弃与留白

- 与第一批重复：采样定理/混叠（ai-cv-filtering-sampling 已覆盖）、LoG/DoG、Canny。
- 低面试价值：链码/不变矩/欧拉数（表示与描述章 trivia）。
- 留白（语料可再挖）：NeRF/MVSNet/单目深度尺度歧义（11 章）、SRGAN 超分（12 章）——可作第三批。
