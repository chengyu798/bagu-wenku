---
title: 单 Agent 和多 Agent 架构怎么选？
description: 单 Agent 简单可控，多 Agent 用隔离上下文分工协作；默认选单 Agent，只有明确收益时才拆分。
category: agent
tags: [多 Agent, 架构模式, Orchestrator]
status: learning
difficulty: medium
frequency: high
last_reviewed: 2026-11-04
source: 'Anthropic 多 Agent 研究系统工程博客'
sidebar:
  order: 13
---

## 导读

读完这篇，你知道单 Agent 和多 Agent 的适用边界、常见拓扑和真实代价，能判断什么时候不该拆。前置知识：Agent Loop、Harness、上下文工程。

## 基础概念

- **单 Agent**：一个模型、一个循环、一份上下文。
- **多 Agent**：多个拥有独立上下文的 Agent 协作。
- **Orchestrator**：负责拆分任务、分派 worker、汇总结果的调度者。
- **Worker**：执行具体子任务的 Agent。
- **上下文隔离**：每个 Agent 只带自己需要的信息。
- **交接（handoff）**：任务、上下文和控制权的转移。
- **拓扑**：中心调度、层级、路由、辩论、黑板等协作结构。

## 核心结论

单 Agent 是一个模型、一个循环、一份上下文，简单、便宜、容易调试；多 Agent 把任务拆给多个拥有独立上下文的 Agent，通过调度、交接或共享状态协作。默认应该选单 Agent，只有当上下文隔离、并行探索或明确的角色分工带来足够收益时，才值得承担多 Agent 的协调成本。

## 原理与机制

**单 Agent 的优缺点：**

- 优点：状态一致、链路短、成本低、容易追踪和评测。
- 缺点：上下文容易被中间结果污染；长任务只能串行；一个模型要同时扮演规划、执行、审查多个角色。

**常见的多 Agent 拓扑：**

| 拓扑 | 结构 | 适用场景 |
| --- | --- | --- |
| Orchestrator-Worker | 中心调度器分派任务给多个 worker | 可并行的研究、检索、批处理 |
| Hierarchical | 多层管理者与执行者 | 大型任务分解 |
| Handoff / Router | 按意图把会话转交给专精 Agent | 客服、领域分流 |
| Debate | 多个角色互相评审、辩论 | 需要多视角判断 |
| Swarm / Blackboard | 去中心协作，共享黑板 | 探索型、松耦合任务 |

**多 Agent 的收益：**

- **上下文隔离**：每个子 Agent 只装自己需要的信息，避免主上下文爆炸。
- **并行**：多个子任务同时跑，缩短墙钟时间。
- **专精**：不同 Agent 用不同的提示词、工具和模型。
- **审查分离**：生成者和评审者分开，减少自我确认偏差。

**代价：**

- Token 成本成倍增加。Anthropic 曾提到其多 Agent 研究系统消耗的 token 约为普通对话的 15 倍。
- 协调失败、错误传播、状态不一致和调试困难。
- 子 Agent 之间的信息交接容易丢细节，最终答案可能「看起来完整但拼错了」。

**决策原则：** 先用单 Agent 把任务跑通；当出现上下文污染、明确的并行收益、或角色需要独立审查时再拆。拆分后必须有结构化的交接协议、共享状态、预算上限和可观测性。

<figure class="diagram">
	<img src="/images/diagrams/single-vs-multi-agent.png" alt="单 Agent 与多 Agent 架构：一个小八单干，或调度小八带三个专家" loading="lazy" />
	<figcaption>单 Agent 像一个全能选手，多 Agent 像一个调度员带专家组；后者更强，但不是默认答案。</figcaption>
</figure>

## 具体案例

竞品调研任务：

- **单 Agent**：把 20 个网页的全文都塞进同一个上下文，查到第 15 个时已经忘记前面的结论，最终答案引用混乱。
- **多 Agent**：Orchestrator 把 A、B、C 三家公司分别交给 3 个 researcher 并行调研，每个 researcher 只带自己公司的资料；最后由 reviewer 汇总并核对引用。

代价是 token 消耗约为单 Agent 的十几倍，但墙钟时间缩短，主上下文也不会互相污染。如果任务只是写一段代码，拆成多 Agent 反而会增加交接错误。

## 追问链

1. **多 Agent 一定比单 Agent 好吗？** 不一定。Anthropic 的建议是先单后多：只有当单 Agent 在上下文、并行度或角色分工上明显受限时，多 Agent 才划算。
2. **怎么防止错误在 Agent 之间传播？** 在交接点做结构化校验，要求子 Agent 返回可验证的证据和状态；给每个子任务设置预算和超时。
3. **Subagent 和多 Agent 系统的区别？** Subagent 通常只是上下文隔离手段，主 Agent 仍然掌控全局；多 Agent 系统则有独立角色、通信协议和协作拓扑。
4. **多 Agent 怎么评测？** 除了最终任务成功率，还要看每个子任务的完成率、交接错误率、总 token、墙钟时间和失败恢复能力。

## 常见误区

- 为了「看起来更智能」而上多 Agent，往往只是把一次调用拆成五次，成本和错误率一起上升。
- 多 Agent 不等于并行；很多拓扑仍然是串行交接，真正的并行需要任务之间没有依赖。

## 延伸阅读

- Anthropic, How we built our multi-agent research system (2025)
- Anthropic, Building Effective Agents (2024)
