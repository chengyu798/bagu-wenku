---
title: Agent 开发学习路线
description: 从基础概念到多 Agent 架构的 Agent 开发学习路径：先建立直觉，再学机制，最后做工程与架构。
sidebar:
  label: 学习路线
  order: 0
---

## 这条路线怎么走

Agent 开发最容易犯的错，是一上来就背「ReAct 是什么」「MCP 有几层」，但不知道 Agent 和普通聊天机器人到底差在哪。这个分类按**先概念、再机制、后工程与架构**的顺序组织，每篇卡片都从导读和基础概念开始，再给出核心结论、原理、案例和追问链。

适合已经会调用大模型 API、想系统理解 Agent 工程的人。前置知识只有：知道 LLM 是给定上下文预测下一个 token 的模型，能读懂简单的 Python 和 JSON。

<figure class="diagram">
	<img src="/images/diagrams/agent-index.png" alt="Agent 开发学习路线：从建立直觉到架构选型的五个阶段" loading="lazy" />
	<figcaption>五站路线：先知道 Agent 是什么，再学它怎么循环，最后才是工程化与架构选型。</figcaption>
</figure>

## 阶段一：建立直觉

先回答「Agent 到底是什么」和「什么时候不该用 Agent」，把 Chatbot、Workflow、Agent 三个概念分清。

- [什么是 Agent？它和 Chatbot、Workflow 有什么区别？](/agent/what-is-an-agent/) —— 最小组成、自主性光谱、三种形态对比。
- [Agent 基础术语表](/agent/glossary/) —— 模型、循环、工具、上下文、记忆、架构和评测的常用词。

## 阶段二：核心机制

理解 Agent 的心跳：它怎么一轮一轮地思考、行动和观察。

- [Agent Loop 是怎么运转的？](/agent/agent-loop/) —— 循环、状态、停止条件和常见失败模式。
- [Tool Call 和 Function Call 有什么区别？](/agent/tool-call-vs-function-call/) —— 模型能力、执行闭环和连接协议的分层。
- [什么是 ReAct？它解决了什么问题？](/agent/react-pattern/) —— 思考、行动、观察交替进行的经典范式。

## 阶段三：工程实践

把「能跑」变成「稳定、可控、可维护」，这一阶段决定产品上限。

- [什么是 Agent Harness？](/agent/agent-harness/) —— 循环、上下文、工具、权限、记忆和追踪的运行时。
- [提示词工程的核心方法有哪些？](/agent/prompt-engineering/) —— 结构、约束、示例、输出格式和评估驱动。
- [什么是上下文工程？](/agent/context-engineering/) —— 在有限窗口里选择、压缩、隔离和排序信息。
- [Agent 的记忆工程怎么做？](/agent/memory-engineering/) —— 写入、巩固、检索和遗忘。
- [什么是 MCP？](/agent/mcp/) —— Host、Client、Server 与标准连接协议。
- [Claude Skill 是什么？](/agent/skill/) —— 用渐进式披露组织流程、脚本和资料。

## 阶段四：进阶模式

当任务变长、变复杂，单次循环不够用，需要规划、反思和更强的推理结构。

- [什么是 Plan-and-Execute？](/agent/plan-and-execute/) —— 先规划、再执行、根据观察重规划。
- [什么是 Reflection？](/agent/reflection/) —— 生成、评审、修改的反馈循环。
- [CoT、ToT、GoT 有什么区别？](/agent/reasoning-cot-tot-got/) —— 链、树、图三种推理结构。

## 阶段五：架构与选型

最后再决定要不要拆多 Agent，以及怎么拆、怎么评测。

- [单 Agent 和多 Agent 架构怎么选？](/agent/single-vs-multi-agent/) —— 拓扑、成本、上下文隔离和选择原则。

## 每张卡片的结构

为了兼顾「从零理解」和「面试复习」，每张卡片统一按这个顺序展开：

1. **导读**：这篇解决什么问题、需要什么前置知识。
2. **基础概念**：先定义术语，再进入结论。
3. **核心结论**：能直接用一句话回答面试问题的版本。
4. **原理与机制**：它为什么成立、内部怎么运转，配图解。
5. **具体案例**：用一个真实任务把原理跑一遍。
6. **追问链**：面试官通常会接着问什么。
7. **常见误区**：容易答错或理解偏的地方。
8. **延伸阅读**：论文、官方文档和工程博客。

## 学习建议

- **第一遍按顺序读**：阶段一到阶段三不要跳，概念和机制是后面所有内容的地基。
- **每篇用自己的话写三句**：它解决什么问题、怎么运转、什么时候不该用。写不出来就是还没懂。
- **配一个小项目**：比如做一个「查日志 → 定位问题 → 给建议」的运维 Agent，把 Loop、Tool、Harness、上下文串起来。
- **面试前只看三块**：核心结论、追问链、常见误区；原理和案例用来支撑回答。
