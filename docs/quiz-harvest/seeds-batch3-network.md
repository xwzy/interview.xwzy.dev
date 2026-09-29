# 批 3 收割种子存档（计算机网络）

> 来源：① 清华 912（批 1 收割，NET-1~8）；② 计算机网络课程试卷 17 份 + 作业 5 份（清华/浙大/北大，2026-09-29 收割，43 条种子）。
> 状态：✅ 已落地（network.ts，41 → 46 题）｜❌ 丢弃

## ✅ 新题（5）

- net-foundation-csmacd：CSMA/CD + 最短帧 64B 争用期推导 + 1500B 最大帧 + 二进制退避（912 NET-1 + 卢志答案卷 2013/2010 + MAC和LAN）
- net-tcp-gbn-sr：停等/GBN/SR 演进 + 利用率公式 + 序号位数窗口约束（912 NET-2/3 + 2018考题回忆 + 卢志 2010）
- net-foundation-switch-stp：交换机自学习 + 三种转发模式 + 冗余环路三灾难 + STP + VLAN 追问（MAC和LAN + 2002卷 + 试卷整理）
- net-foundation-nyquist-shannon：两大定律取小 + dB 陷阱 + 56K 猫"违反"香农追问（2002卷 + 作业二 + 往年试题整理1）
- net-engineering-token-bucket：令牌桶 vs 漏桶 + 突发容忍计算通式 + 分布式限流追问（2006卷 + 作业五）

## ✅ 追问增强（7 条进现有题）

- net-arp ← A→R1→R2→C 逐跳 IP/MAC 变化（912 NET-4 必考级综合）
- net-scene-mtu-blackhole ← IP 分片三字段 + offset 8B 单位 + DF/ICMP 闭环（912 NET-5 + 2002卷）
- net-foundation-igp ← 计数到无穷 + 水平分割/毒性逆转及其三节点环失效（912 NET-6 + 作业五）
- net-tcp-congestion ← ssthresh=400KB/rwnd=600KB 演化表 + min(rwnd,cwnd)（912 NET-7）
- net-http-l4l7-lb ← Host 头/SNI 与"域名通 IP 不通"（912 NET-8 + 08卷解答题）
- net-tcp-reliable ← 五类定时器 + 零窗口探测防死锁（tcp九问）
- net-foundation-csmacd ← ALOHA 1/2e 与 1/e 推导 + 多站容量（卢志 2013 + 作业四）

## ❌ 丢弃与理由

- 以太网 vs 802.11 端到端论据定量题（p=0.8 逐帧确认收益）——机制好但图表依赖，csmacd/wireless 已覆盖各自侧
- 二进制退避"作弊网卡"概率题、TCP 锯齿 0.75W 吞吐、序号回绕速率上限——推导优雅但口试场景窄
- 海明/CRC/成帧四法、CDMA 内积解码、SNMP、虚电路 vs 数据报、邮件/FTP 协议——网课细节，通用后端面试价值低
- 移动 IP 三角路由、NAT 抓包十六进制推演——场景过窄或依赖图表
- Jacobson EWMA——net-tcp-reliable 的 RTO 追问已含公式
- UDP 存在理由——net-tcp-vs-udp 已覆盖
- DV/LS 复杂度、CIDR 补洞、URL 结构——igp/cidr/url 题已覆盖核心，增量薄
- OCR 存疑（base64+CRLF 长度等）按 agent 提示未采信
