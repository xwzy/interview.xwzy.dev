# 二期 · 批 17 · ai-cv 第三批（来源：浙大 3D 深度学习 + 计算摄影课件）

> 语料：11_3D_deep_learning.md（单目深度/MVS/NeRF/NeuS/SuperPoint）+ 12_Computational Photography.md（SRGAN）。
> agent 产出 7 条种子；课件未覆盖的主题（NeRF 位置编码/分层采样、MVSNet 概率体、ViT/DETR、
> Gaussian Splatting 细节、monodepth 自监督）明确不深究，标注（通用补充）处仅给方向。

## 新题 5（ai.ts，ai-cv 领域，每题 1 追问）

1. **ai-cv-monocular-depth-scale**：单目尺度歧义（课件原话 same object different sizes/depths same image）、
   scale-invariant loss、MegaDepth（COLMAP 对 200+ 地标产 13 万对训练数据）；追问双目为什么有绝对尺度（基线钉死）。
2. **ai-cv-implicit-representation**（advanced）：mesh 不可微两痛点、隐式连续表示（Occupancy/DeepSDF）、
   NeRF radiance field 可微体积渲染、NeuS 用 SDF 换 density 改表面重建；追问 NeRF 慢的原因与提速路线
   （Instant-NGP/Gaussian Splatting 方向，通用补充）。
3. **ai-cv-deep-matching**：SuperPoint heatmap+NMS + 度量学习（contrastive/triplet 公式）、
   合成 warp 数据与等变性；追问 SIFT/ORB 的存在价值（与第一批特征题分工：那题手工原理，本题深度训练机制）。
4. **ai-cv-mvsnet**：传统 MVS cost volume（plane sweep）+ BP/graph cut 求解、MVSNet 用 CNN 特征
   构建 cost volume 端到端化；追问 cost volume 内存账（W×H×D）与 coarse-to-fine 对策。
5. **ai-cv-srgan-perceptual**：PSNR-感知权衡（课件原数值：SRResNet 23.53dB vs SRGAN 21.15dB < bicubic 21.59dB）、
   SRGAN 损失 = content + 10⁻³·adversarial；追问对抗权重为什么是 10⁻³。

## 丢弃与边界

- NeRF 位置编码/分层采样、MVSNet 概率体 soft-argmin、ViT/DETR、monodepth 自监督——课件无素材，不出题；
  相关追问只给方向并标注（通用补充）。
- Gaussian Splatting 仅在 threestudio 链接一笔带过——只在追问提速路线里提名字，不展开机制。
