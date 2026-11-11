---
title: 什么是 ReAct？它解决了什么问题？
description: ReAct 把推理和行动交替进行，让模型边想边调用工具。
category: agent
tags: [ReAct, 工具调用, 规划]
status: learning
difficulty: medium
frequency: high
last_reviewed: 2026-11-04
source: 面经整理
sidebar:
  order: 9
---

## 导读

读完这篇，你知道 ReAct 的 Thought / Action / Observation 循环如何工作，它和纯 CoT、纯工具调用分别差在哪。前置知识：Agent Loop、Tool Call。

## 基础概念

- **ReAct**：Reasoning + Acting，交替进行推理和行动。
- **Thought**：模型写出的下一步推理。
- **Action**：调用工具的具体请求。
- **Observation**：工具返回的结果。
- **与 CoT 的区别**：CoT 只在模型内部推理，ReAct 会与外部环境交互。
- **与 Function Calling 的关系**：Function Calling 是实现 Action 的机制之一。

## 核心结论

ReAct 让大模型在「思考—行动—观察」的循环中交替进行推理和工具调用：先输出一段推理决定下一步做什么，再执行动作拿到环境反馈，然后基于反馈继续推理，直到给出最终答案。

## 原理与机制

朴素的 Chain-of-Thought 只在模型内部推理，无法获取外部信息；只做工具调用又缺少显式规划。ReAct 把两者结合：

1. **Thought**：模型分析当前状态，决定下一步。
2. **Action**：调用工具（搜索、计算器、API）。
3. **Observation**：环境返回结果。
4. 重复 1–3，直到 **Final Answer**。

关键点：Thought 是显式写进上下文的外部化推理，因此可追踪、可中断，也方便调试。

```text
Thought: 需要知道 2026 年诺贝尔物理学奖得主
Action: search("2026 Nobel Prize in Physics")
Observation: ...
Thought: 信息足够，可以回答
Final Answer: ...
```

<figure class="diagram">
	<img src="/images/diagrams/react-pattern.png" alt="ReAct：小八思考后调用搜索工具，观察结果再继续推理" loading="lazy" />
	<figcaption>小八先想（Thought），再调用工具（Action），拿到结果（Observation）后继续想，直到信息足够。</figcaption>
</figure>

## 具体案例

用户问：「Claude 和 GPT 当前的 API 价格对比？」

1. Thought：需要最新价格，先搜索。
2. Action：`web_search("Claude API pricing")`。
3. Observation：返回官网链接和几篇二手文章。
4. Thought：二手文章可能过期，打开官网。
5. Action：`fetch(官网定价页)`。
6. Observation：拿到价格表。
7. Final Answer：整理成对比表格，并标注抓取时间。

如果搜索结果不足，循环会继续；每一步的 Action 和 Observation 都显式写回上下文，方便追踪。

## 追问链

1. **ReAct 和 Function Calling 是什么关系？** Function Calling 是模型输出结构化工具调用的能力，ReAct 是一种使用工具的循环范式；现代 Agent 通常用 Function Calling 来实现 Action 部分。
2. **ReAct 有什么缺点？** 步数多、token 消耗大、容易陷入循环或错误累积；工程上需要最大步数、动作去重、反思等约束。
3. **和 Plan-and-Execute 的区别？** ReAct 边想边做，更适合环境动态变化的任务；Plan-and-Execute 先生成完整计划再执行，更适合步骤多、依赖长的任务。

## 常见误区

- 不要把 ReAct 说成一种模型架构，它是提示词加循环的工程范式。
- Observation 必须回填到上下文，否则模型无法基于工具结果继续推理。

## 延伸阅读

- ReAct: Synergizing Reasoning and Acting in Language Models (Yao et al., 2022)
