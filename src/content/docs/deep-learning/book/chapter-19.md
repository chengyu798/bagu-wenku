---
title: 第 19 章 近似推断
description: 变分推断、ELBO、EM 与 MAP：后验难算时如何近似。
category: deep-learning
tags: [花书, 变分推断, ELBO, EM]
status: learning
difficulty: hard
frequency: medium
last_reviewed: 2026-11-04
source: '《深度学习》第 19 章，原创讲解笔记'
---

<div class="chapter-meta">
	<span class="chapter-part">第三部分 · 深度学习研究</span>
	<span>阅读约 20 分钟</span>
	<span>关键词：变分推断 · ELBO · EM · VAE</span>
</div>

<div class="callout key">
	<strong>一句话抓住</strong>
	<p>用可处理分布逼近后验；最大化 ELBO 等价于最小化与后验的 KL。</p>
</div>

## 后验为什么难算

有隐变量的模型，训练和预测都涉及后验 `p(h|x)`：给定观测 `x`，隐变量 `h` 的分布是什么？在复杂模型里，这个后验通常没有闭式解，也无法精确积分。

近似推断有两大家族：一类是用采样近似（MCMC），另一类是用一个可处理的分布去逼近后验（变分推断）。这一章重点讲后者。

## 变分推断的基本思路

变分推断选择一个可处理的分布族 `q(h)`，让它在 KL 意义下尽量接近真实后验：

```text
q*(h) = argmin_q D_KL(q(h) || p(h|x))
```

直接最小化这个 KL 仍然需要知道后验，所以我们换一个等价目标。利用恒等式：

```text
log p(x) = ELBO(q) + D_KL(q(h) || p(h|x))
```

因为 KL 非负，`ELBO(q)` 是 `log p(x)` 的下界。最大化 ELBO 等价于最小化 `q` 和后验的 KL。ELBO 可以写成：

```text
ELBO(q) = E_q[log p(x, h)] - E_q[log q(h)]
```

或者：

```text
ELBO(q) = E_q[log p(x|h)] - D_KL(q(h) || p(h))
```

第二项是「重构项减去 KL 正则项」，这正是 VAE 损失的结构。

## 平均场近似

最简单的变分族是平均场（mean field）：假设 `q` 各维独立：

```text
q(h) = Π_i q_i(h_i)
```

这样可以把高维后验分解成多个一维分布，用坐标上升法逐维优化。平均场计算简单，但忽略了变量之间的相关性，近似可能偏乐观（低估后验方差）。

<figure class="diagram">
	<img src="/images/diagrams/dl-chapter-19.png" alt="对数似然分解为 ELBO 和 KL 散度" loading="lazy" />
	<figcaption>ELBO 是 log p(x) 的下界；最大化 ELBO 等价于最小化近似后验与真实后验的 KL。</figcaption>
</figure>

## EM 算法

EM（期望最大化）可以看作变分推断的一个特例。它交替执行：

- **E 步**：固定参数，计算隐变量的后验（或近似后验）；
- **M 步**：固定后验，最大化期望对数似然，更新参数。

每次迭代都提升似然（或 ELBO），直到收敛。EM 适合有隐变量、后验可算或可近似的问题，比如高斯混合模型。

## MAP 与 Laplace 近似

MAP 推断取后验的众数，而不是完整分布：

```text
h_MAP = argmax p(h|x)
```

它比完整后验简单，但丢失了不确定性信息。Laplace 近似在 MAP 点用一个高斯分布逼近后验，均值为 MAP，协方差为负 Hessian 的逆。它计算量适中，适合一些贝叶斯深度学习场景。

## 学习式近似推断

传统变分推断对每个数据点单独优化 `q`，成本高。学习式推断（amortized inference）训练一个网络，直接从 `x` 预测 `q` 的参数：

```text
q(h|x) = q(h; f_φ(x))
```

这样一次前向就能得到后验近似，适合大规模数据。VAE 的编码器就是学习式推断网络。

## 变分推断 vs MCMC

- **变分推断**：把推断变成优化，通常更快，适合大数据；但受限于近似分布族，可能低估不确定性。
- **MCMC**：理论上更精确，样本渐近服从真实后验；但计算慢，收敛难判断，适合小规模或离线场景。

实践中经常混合：用变分推断快速近似，用 MCMC 做校验；或者用 Normalizing Flow 增强变分族的表达力。

## VAE 的例子

VAE 的生成过程是：

```text
h ~ p(h)          # 先验，通常 N(0, I)
x ~ p(x|h)        # 解码器
```

编码器输出 `q(h|x)` 的均值和方差，解码器根据采样出的 `h` 重建 `x`。损失是：

```text
重构误差 + KL(q(h|x) || p(h))
```

KL 项让后验接近先验，使潜在空间连续、可采样；重构项让 `h` 保留输入信息。两者的平衡决定生成质量和重构质量。

## 小结

- 后验难算是隐变量模型的核心困难。
- 变分推断用可处理分布逼近后验，最大化 ELBO。
- ELBO 可以写成重构项加 KL 正则项。
- EM、MAP、Laplace 是不同粒度的近似。
- 学习式推断用网络直接输出后验参数，是 VAE 的基础。
