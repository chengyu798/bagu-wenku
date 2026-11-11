---
title: Tool Call 和 Function Call 有什么区别？
description: Function Calling 是模型输出结构化调用的能力；Tool Calling 是选择、执行、回填的完整闭环；MCP 是连接协议。
category: agent
tags: [Tool Call, Function Calling, 工具调用]
status: learning
difficulty: easy
frequency: high
last_reviewed: 2026-11-04
source: 面经整理
sidebar:
  order: 3
---

## 导读

这三个词经常被混用。读完这篇，你能分清模型能力、执行闭环和连接协议，并在排障时判断问题出在哪一层。前置知识：Agent Loop。

## 基础概念

- **工具（tool）**：一个可被 Agent 调用的外部能力，比如搜索、读文件、调用 API。
- **函数（function）**：工具在代码里的具体实现，通常带有参数 schema。
- **JSON Schema**：描述参数类型、必填项和约束的结构化定义。
- **tool call**：模型输出的调用请求，包含工具名和参数。
- **observation**：工具执行结果回填给模型的内容。
- **MCP**：工具发现与连接的协议，不等于工具调用本身。

## 核心结论

Function Calling 是模型按 JSON Schema 输出「调用哪个函数、参数是什么」的能力；Tool Calling 是更完整的闭环：发现工具、选择工具、校验与鉴权、执行、把结果回填给模型。MCP 则是工具发现与连接的协议。三者是不同层次，经常被口语化地混用。

## 原理与机制

**三层关系：**

| 层次 | 解决的问题 | 例子 |
| --- | --- | --- |
| Function Calling | 模型如何输出结构化调用 | `get_weather({"city":"上海"})` |
| Tool Calling | 运行时如何完成一次工具使用 | 选择 → 校验 → 执行 → observation |
| MCP | 工具如何被发现和连接 | 连接 GitHub、数据库、文件系统 |

**一次完整的工具调用：**

1. Harness 把工具定义（名称、描述、JSON Schema）放进上下文。
2. 模型输出一个或多个 tool call，包含调用 id、工具名和参数。
3. Harness 校验参数、检查权限、执行工具（可能是本地函数、远程 API 或 MCP Server）。
4. 工具结果以 observation 的形式回填，模型继续推理或给出答案。

**Function Calling 的关键点：**

- 工具描述和参数 schema 本身就是提示词，描述不清会直接导致选错工具或传错参数。
- 支持并行调用时，模型可以一次返回多个 tool call，Harness 需要并发执行并正确配对结果。
- 结构化输出（strict schema）能降低参数格式错误，但不能保证语义正确。

**Tool Calling 的关键点：**

- 工具可以是普通函数、内置能力（搜索、代码执行、computer use），也可以是 MCP 暴露的工具。
- 运行时必须做参数校验、权限控制、超时、重试和幂等处理。
- 工具返回内容也可能包含提示注入，不能无条件信任。

<figure class="diagram">
	<img src="/images/diagrams/tool-call-vs-function-call.png" alt="Function Calling、Tool Calling、MCP 三层，以及小八发出调用、Harness 校验、工具执行、结果回填" loading="lazy" />
	<figcaption>小八发出结构化调用，Harness 负责校验、鉴权和执行，MCP 把外部工具接进来；结果再作为 observation 回到模型。</figcaption>
</figure>

## 具体案例

用户问：「上海明天天气怎么样？」

1. 模型输出 `get_weather({"city": "上海", "date": "明天"})`，这是 **Function Calling**。
2. Harness 校验参数、检查权限，调用天气 API 并拿到结果，这是 **Tool Calling** 的闭环。
3. 如果天气服务通过 MCP Server 接入，Host 先从 MCP 发现工具 schema，再走同样的调用链，这是 **MCP** 的连接层。

出现问题时可以分层定位：模型选错工具、Harness 参数校验失败，还是上游 API 超时。

## 追问链

1. **没有 Function Calling 能做 Agent 吗？** 能。早期 ReAct 用文本格式解析 Action，但可靠性、参数校验和多工具并行都更差。
2. **Tool Call 一定走 Function Calling 吗？** 主流商用模型大多如此；也可以由 Harness 解析模型的文本指令来触发，只是工程上更脆弱。
3. **MCP 和 Tool Calling 是什么关系？** MCP 提供工具目录和传输通道，模型仍然通过 Function Calling（或等价机制）选择并调用具体工具。
4. **工具调用失败怎么处理？** 返回结构化错误而不是抛异常，让模型能读懂；限制重试次数，必要时切换工具或请求人工。

## 常见误区

- 面试时不要把三者说成同义词。准确的表述是：Function Calling 是能力，Tool Calling 是闭环，MCP 是连接协议。
- 工具描述不是注释，而是提示词的一部分；描述模糊会直接降低工具选择准确率。

## 延伸阅读

- OpenAI Function Calling 文档
- Anthropic Tool Use 文档
- Model Context Protocol 官方文档
