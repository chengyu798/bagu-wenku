---
title: Agent 基础术语表
description: 把 Agent 开发里最常出现的概念先定义清楚：模型、循环、工具、上下文、记忆、协议、架构与评测。
---

## 先建立共同语言

这张表不是让你背定义，而是先建立共同语言。遇到不认识的词时回来查一下，再去看对应的卡片会顺很多。每个术语后面标了详细展开的卡片。

## 模型与推理

| 术语 | 解释 |
| --- | --- |
| **LLM（大语言模型）** | 根据上下文逐 token 预测下一个 token 的模型。它本身只输出文本，不负责执行动作或保存长期状态。 |
| **Token** | 模型处理文本的基本单位，约等于一个词或词的一部分。上下文长度、成本和延迟通常都按 token 计算。 |
| **上下文窗口（context window）** | 模型一次能看到的 token 上限，包含系统提示、工具定义、历史、检索内容和输出预留。 |
| **提示词（prompt）** | 提供给模型的输入文本，包括系统提示、用户消息、示例和工具描述。 |
| **系统提示（system prompt）** | 位于对话最前面的高优先级指令，定义角色、行为规则、工具使用方式和输出约束。 |
| **温度（temperature）** | 控制采样随机性的参数。越低越稳定、越适合结构化任务；越高越发散。 |
| **CoT（Chain-of-Thought）** | 让模型显式写出中间推理步骤的提示或训练方式，用更多串行计算换取更好的多步推理。详见 [CoT / ToT / GoT](/agent/reasoning-cot-tot-got/)。 |
| **测试时计算（test-time compute）** | 在推理阶段增加采样、搜索或验证来提升质量，而不是只训练更大的模型。 |
| **推理模型（reasoning model）** | 在内部进行较长思考再输出的模型，通常已内化 CoT，使用时不必再强行要求「一步一步想」。 |
| **幻觉（hallucination）** | 模型生成看似合理但事实错误的内容。Agent 需要通过工具、检索和校验来降低幻觉影响。 |

## Agent 基础

| 术语 | 解释 |
| --- | --- |
| **Agent（智能体）** | 以目标为输入，由模型决定下一步、调用工具并根据观察调整行动，直到完成或停止的执行体。详见 [什么是 Agent](/agent/what-is-an-agent/)。 |
| **Chatbot** | 以对话为形式、直接生成回复的系统，通常不主动调用工具，也不自己决定多步行动。 |
| **Workflow（工作流）** | 步骤、分支和调用顺序由代码预先定义的流程，LLM 只作为其中某些节点的处理函数。 |
| **自主性（autonomy）** | 模型对控制流的决定程度。从固定 pipeline 到动态规划，自主性逐步提高。 |
| **轮次（turn）** | Agent 循环中的一次「模型决策 + 工具执行（可选）」。 |
| **Agent Loop** | 「组装上下文 → 模型决策 → 执行工具 → 回填观察 → 再决策」的循环。详见 [Agent Loop](/agent/agent-loop/)。 |
| **停止条件** | 结束循环的判据，例如给出最终答案、达到最大步数、token / 时间预算耗尽、无进展或人工中断。 |
| **目标（goal）** | 用户交给 Agent 的任务和约束，是循环的起点，也是判断是否完成的依据。 |

## 工具与协议

| 术语 | 解释 |
| --- | --- |
| **工具（tool）** | Agent 可以调用的外部能力，例如搜索、读文件、执行代码、调用 API。 |
| **Tool Call** | 模型选择工具、给出参数的请求，以及 Harness 执行并把结果回填的完整过程。详见 [Tool Call 与 Function Call](/agent/tool-call-vs-function-call/)。 |
| **Function Calling** | 模型按 JSON Schema 输出「调用哪个函数、参数是什么」的能力，是 Tool Call 的实现机制之一。 |
| **JSON Schema** | 描述工具参数结构的标准格式，用于约束模型输出并做运行时校验。 |
| **MCP（Model Context Protocol）** | 把 LLM 应用与外部工具、数据源连接起来的开放协议。详见 [MCP](/agent/mcp/)。 |
| **Host / Client / Server** | MCP 的三个角色：宿主应用、Host 内为每个 Server 建立的连接、暴露能力的服务端。 |
| **tools / resources / prompts** | MCP 服务端的三类原语：可执行动作、只读上下文、可复用提示模板。 |
| **JSON-RPC** | MCP 使用的消息格式，支持请求、响应和通知。 |
| **stdio / Streamable HTTP** | MCP 的两种常见传输方式：本地进程标准输入输出、远程 HTTP 流。 |

## 上下文与记忆

| 术语 | 解释 |
| --- | --- |
| **提示词工程（prompt engineering）** | 通过结构、约束、示例和输出格式让模型稳定产出。详见 [提示词工程](/agent/prompt-engineering/)。 |
| **上下文工程（context engineering）** | 决定每一步模型该看到什么：选择、压缩、隔离和排序信息。详见 [上下文工程](/agent/context-engineering/)。 |
| **RAG（检索增强生成）** | 先从外部知识库检索相关内容，再放进上下文让模型基于证据回答。 |
| **压缩（compaction）** | 把长历史摘要成更短的结论或结构化状态，减少上下文占用。 |
| **上下文腐蚀（context rot）** | 上下文越长，模型对细节的注意力越分散，关键信息越容易被忽略。 |
| **工作记忆** | 当前任务的状态、计划和中间结果，通常就在上下文窗口里。 |
| **情景记忆** | 过去发生过的交互和事件，例如用户上次提到的偏好或失败经历。 |
| **语义记忆** | 稳定的事实和知识，例如项目结构、公司术语、用户画像。 |
| **程序性记忆** | 一类任务怎么做，例如 Skill、操作手册、失败教训。详见 [记忆工程](/agent/memory-engineering/)。 |
| **巩固（consolidation)** | 把原始对话摘要成事实、抽取结构化字段、去重并合并冲突版本。 |

## 工程与架构

| 术语 | 解释 |
| --- | --- |
| **Harness** | 模型之外、把一次 completion 变成 Agent 的运行时：循环、上下文、工具、权限、记忆、追踪。详见 [Agent Harness](/agent/agent-harness/)。 |
| **框架（framework）** | 开发 Agent 时使用的库和抽象，例如 LangGraph、OpenAI Agents SDK；Harness 是实际跑起来的运行时。 |
| **沙箱（sandbox）** | 限制工具能访问的文件、网络和系统资源，降低误操作和安全风险。 |
| **Human-in-the-loop（HITL）** | 在高风险或不确定的节点暂停，让人确认、补充或接管。 |
| **Orchestrator（编排器）** | 多 Agent 系统中负责拆分任务、分派 worker、汇总结果的调度角色。 |
| **Worker** | 多 Agent 系统中执行具体子任务的 Agent。 |
| **交接（handoff）** | 一个 Agent 把任务、上下文和控制权交给另一个 Agent 的过程。 |
| **多 Agent** | 多个拥有独立上下文的 Agent 通过调度、交接或共享状态协作。详见 [单 Agent 与多 Agent](/agent/single-vs-multi-agent/)。 |
| **评测（eval）** | 用一组有代表性的任务和判定标准衡量 Agent 的成功率、成本、延迟和安全表现。 |
| **追踪（trace）** | 记录每一步的输入、输出、工具调用、token 和耗时，用于调试和归因。 |

## 设计模式

| 术语 | 解释 |
| --- | --- |
| **ReAct** | 交替进行「思考 → 行动 → 观察」的循环范式，让模型边推理边调用工具。详见 [ReAct](/agent/react-pattern/)。 |
| **Plan-and-Execute** | 先由 Planner 拆解步骤，Executor 逐步执行，Replanner 根据观察调整计划。详见 [Plan-and-Execute](/agent/plan-and-execute/)。 |
| **Reflection（反思）** | 生成结果后由自己或独立评审器评估，再把反馈用于修改的循环。详见 [Reflection](/agent/reflection/)。 |
| **ToT（Tree-of-Thoughts）** | 把多个候选思路组织成树，边扩展边评估、可回溯。 |
| **GoT（Graph-of-Thoughts）** | 在 ToT 基础上允许分支合并、复用和精炼，把思考组织成图。 |

## 怎么用这张表

1. 先读[什么是 Agent](/agent/what-is-an-agent/)，建立整体图景。
2. 遇到术语时回到这里查定义，再点进对应卡片看原理和案例。
3. 复习时遮住解释，尝试用自己的话复述；说不清的就是还没掌握。
