---
title: 什么是 MCP？它解决了什么问题？
description: MCP 用一套标准协议把模型应用和外部工具、数据源连接起来，把 N×M 的定制集成收敛成 N+M。
category: agent
tags: [MCP, 协议, 工具调用]
status: learning
difficulty: medium
frequency: high
last_reviewed: 2026-11-04
source: 'MCP 官方文档；Anthropic, 2024'
sidebar:
  order: 4
---

## 导读

读完这篇，你知道 MCP 解决的是哪一层问题，Host、Client、Server 如何分工，以及它和 Function Calling 为什么不是一回事。前置知识：Tool Call 与 Function Call。

## 基础概念

- **协议（protocol）**：双方约定的消息格式、能力和生命周期。
- **Host**：承载模型和用户的宿主应用，例如 Claude Desktop、IDE。
- **Client**：Host 内为每个 Server 建立的连接。
- **Server**：把数据库、GitHub、文件系统等外部能力包装成标准接口的服务端。
- **JSON-RPC**：MCP 使用的请求、响应和通知消息格式。
- **tools / resources / prompts**：可执行动作、只读上下文、可复用模板三类原语。
- **stdio / Streamable HTTP**：本地进程和远程服务的两种常见传输方式。

## 核心结论

MCP（Model Context Protocol）是一个开放协议，规定了 LLM 应用如何发现并调用外部能力。它把「每个应用分别对接每个工具」的 N×M 定制集成，变成「应用实现 MCP Client、工具实现 MCP Server」的 N+M 标准连接。

## 原理与机制

**三个角色：**

- **Host**：宿主应用，例如 Claude Desktop、IDE、Agent 运行时。
- **Client**：Host 内部为每个 Server 建立的一条连接，负责协议握手和消息收发。
- **Server**：把数据库、GitHub、文件系统等能力包装成标准接口。

**传输方式：** 本地进程通常用 `stdio`，远程服务用 Streamable HTTP（早期是 HTTP + SSE）。

**服务端三原语：**

| 原语 | 用途 | 典型例子 |
| --- | --- | --- |
| `tools` | 可执行的动作，可能有副作用 | 查询数据库、创建 issue |
| `resources` | 只读上下文 | 文件内容、表结构、日志 |
| `prompts` | 可复用的提示模板 | 代码审查模板、周报模板 |

**客户端能力：** `sampling`（Server 请求 Host 调模型）、`roots`（暴露工作区边界）、`elicitation`（向用户追问补充信息）。

**生命周期：** `initialize` 握手 → 协商 capabilities → 正常 JSON-RPC 2.0 调用与通知。

**和 Function Calling 的分工：** Function Calling 是模型「发出结构化调用」的能力；MCP 是工具「被发现、被连接、被传输」的协议。二者是不同层，通常配合使用。

<figure class="diagram">
	<img src="/images/diagrams/mcp.png" alt="小八通过 MCP 标准协议连接 GitHub 与数据库服务器" loading="lazy" />
	<figcaption>小八不再为每个工具写一次适配；MCP Server 负责适配具体系统，Host 只认标准协议。</figcaption>
</figure>

## 具体案例

在 Claude Code 里同时接入 GitHub 和 Postgres 两个 MCP Server。用户问：「找出最近 3 个未关闭的 P0 issue，并查一下相关订单表。」

1. Host 启动时分别与两个 Server 握手，拿到各自的工具列表：GitHub 的 `list_issues`、数据库的 `query`。
2. 模型通过 Function Calling 选择 `list_issues`，Server 用自己的凭据访问 GitHub，返回 issue 列表。
3. 模型再调用数据库 `query`，Server 执行只读 SQL 并返回结果。
4. 模型汇总答案。

后来要接 Jira，只需要新增一个 MCP Server，Host 和模型侧的调用方式都不用改。

## 追问链

1. **MCP 和普通 REST API 的区别？** REST 描述的是资源操作，MCP 面向模型：提供可发现的工具 schema、能力协商、统一传输与鉴权。它不是替代 REST，而是包在 REST 之外的一层适配。
2. **tools、resources、prompts 分别什么时候用？** tools 承载有副作用的动作；resources 提供只读上下文；prompts 把最佳实践模板交给用户主动触发。
3. **MCP 的安全风险有哪些？** 工具描述投毒、工具返回内容中的提示注入、越权访问、confused deputy、恶意 Server 供应链。对应措施是最小权限、OAuth、人工确认、审计和隔离。
4. **MCP 会取代 Agent 框架吗？** 不会。它只解决连接层；循环控制、规划、上下文管理、评测仍然属于 Harness 的职责。

## 常见误区

- MCP 不是模型，也不是「工具调用本身」，更不是 Anthropic 专属协议。
- 一次工具调用通常同时涉及 Function Calling（模型输出调用）和 MCP（工具连接与执行），不要把二者混为一谈。

## 延伸阅读

- Model Context Protocol 官方文档
- Anthropic, Introducing the Model Context Protocol (2024)
