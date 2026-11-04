---
title: 为什么 Transformer 需要位置编码？
description: 自注意力对位置不敏感，必须显式注入顺序信息，否则打乱词序输出不变。
category: deep-learning
tags: [Transformer, 位置编码, 自注意力]
status: learning
difficulty: medium
frequency: high
last_reviewed: 2026-11-04
source: 面经整理
---

## 一句话答案

自注意力是置换等变的：它只计算 token 两两之间的相关性，本身不包含顺序信息。不加位置编码时，把输入序列打乱，输出也只是跟着打乱，模型无法区分「我打你」和「你打我」。

## 展开

注意力权重由 QK^T 决定，与 token 的绝对位置无关。常见做法：

- **绝对位置编码**：正弦/余弦编码（原始 Transformer）或可学习 embedding，直接加到词向量上。
- **相对位置编码**：在注意力分数里注入 token 间距离，如 T5 的相对位置桶。
- **RoPE**：把 Q、K 按位置旋转，使内积只依赖相对位置，外推性更好，是目前 LLM 的主流。
- **ALiBi**：按距离给注意力分数加线性惩罚，简单且外推性强。

## 追问链

1. **为什么用正弦余弦，而不是直接用 0、1、2… 这样的标量？** 正弦编码有界、连续，任意位置都可由线性变换表示，便于模型学习相对关系；直接加标量会随序列长度增长而无界。
2. **RoPE 相比绝对位置编码好在哪？** 注意力分数只依赖相对位置，长度外推更好，而且不额外占参数。
3. **位置编码加在输入端还是每一层？** 原始 Transformer 加在输入端；也有在每层注意力中注入相对位置的做法。

## 易错点

- 说「自注意力没有位置信息」时补一句「它是置换等变的」，这是面试官想听的精确表述。
- 位置编码的核心不是让模型知道绝对下标，而是让注意力能区分顺序和距离。

## 参考

- Attention Is All You Need (Vaswani et al., 2017)
- RoFormer: Enhanced Transformer with Rotary Position Embedding (Su et al., 2021)
