---
title: 什么是 Plan-and-Execute 模式？
description: 先由 Planner 拆解步骤，Executor 逐步执行，Replanner 根据观察调整计划，适合步骤长、依赖多的任务。
category: agent
tags: [Plan-and-Execute, 规划, Agent 设计模式]
status: learning
difficulty: medium
frequency: high
last_reviewed: 2026-11-04
source: 面经整理
sidebar:
  order: 10
---

## 导读

读完这篇，你知道先规划再执行为什么适合长任务，Planner、Executor、Replanner 各自负责什么，以及它和 ReAct 的取舍。前置知识：Agent Loop。

## 基础概念

- **Planner**：把目标拆成有序步骤的角色。
- **Executor**：执行单个步骤并调用工具。
- **Replanner**：根据观察调整后续计划。
- **计划漂移**：执行偏离原计划却没有及时修正。
- **DAG**：把计划表示成有依赖关系的有向无环图，可并行执行。
- **与 ReAct 的区别**：先规划再执行 vs 边想边做。

## 核心结论

Plan-and-Execute 把「想」和「做」拆开：Planner 先根据目标生成一份步骤计划，Executor 逐步执行（通常配合工具），每一步的观察结果交给 Replanner，必要时修改后续计划，直到所有步骤完成或需要重新规划。

## 原理与机制

**典型流程：**

1. **Planner**：读取目标、约束和可用工具，输出有序步骤。
2. **Executor**：执行当前步骤，调用工具，产出观察结果。
3. **Replanner**：根据结果判断继续、调整剩余步骤、重试或终止。
4. **汇总**：把各步骤结果整合成最终答案。

**和 ReAct 的区别：**

| 维度 | ReAct | Plan-and-Execute |
| --- | --- | --- |
| 决策方式 | 边想边做，每步重新决策 | 先规划，再执行 |
| 全局视野 | 弱，容易局部最优 | 强，能看到完整路径 |
| 适应性 | 强，环境变化时快速调整 | 依赖 Replanner 及时修正 |
| 成本 | 每步都要模型决策 | 规划一次，执行可复用、可并行 |
| 适用场景 | 探索型、工具反馈密集 | 长任务、步骤明确、依赖多 |

**常见变体：** Plan-and-Solve（先写计划再求解）、LLM Compiler（把计划编译成 DAG 并行执行）、层级规划（高层目标 + 子任务计划）。

**优势：** 全局视角、计划可审查、执行阶段可以用更便宜或更专精的模型、步骤之间可以并行。

**风险：** 计划可能一开始就错；环境变化后计划过期；Replanner 过于频繁会退化成 ReAct，过于稀疏会一条错路走到底。

<figure class="diagram">
	<img src="/images/diagrams/plan-and-execute.png" alt="Plan-and-Execute：规划小八拆解任务，执行小八调用工具，复盘小八调整计划" loading="lazy" />
	<figcaption>计划不是写完就结束：执行结果会回到 Replanner，必要时修改后续步骤，避免一条错路走到底。</figcaption>
</figure>

## 具体案例

任务：「调研 2026 年主流 Agent 框架并写一份对比报告。」

1. Planner 拆成：确定范围 → 检索官方文档 → 对比能力矩阵 → 收集案例 → 写初稿 → 校验引用。
2. Executor 用搜索和文件工具逐步执行，每一步产出结构化结果。
3. 执行到第 3 步时发现某个框架文档缺失，Replanner 增加「查 GitHub README 和 release notes」。
4. 所有步骤完成后汇总成报告，并附上引用链接。

如果没有 Replanner，这个计划会在第 3 步卡住，或者带着错误结论继续往下写。

## 追问链

1. **Planner 和 Executor 可以用不同模型吗？** 可以。规划用更强、更贵的模型，执行用更快、更便宜的模型，是常见的成本优化。
2. **怎么避免计划漂移？** 每一步执行后做校验，把偏差显式交给 Replanner；同时设置最大重规划次数，避免无限调整。
3. **和固定 Workflow 的区别？** Workflow 的图是预先定义好的，Plan-and-Execute 的计划是运行时生成、可以随环境变化的。
4. **什么时候选它而不是 ReAct？** 任务步骤多、依赖关系明确、需要全局规划或并行执行时；如果环境反馈频繁且不可预测，ReAct 更合适。

## 常见误区

- 只规划不重规划，等于把 ReAct 的适应性丢了；Replanner 是这个模式的关键组件。
- 计划粒度太细会让 token 和协调成本飙升，太粗又无法执行；通常按「可独立验证的结果」切分。

## 延伸阅读

- Plan-and-Solve Prompting (2023)
- Anthropic, Building Effective Agents (2024)
