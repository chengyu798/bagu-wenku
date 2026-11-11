---
title: Agent Loop 是怎么运转的？
description: 组装上下文、模型决策、执行工具、回填观察，循环往复，直到给出最终答案或触发停止条件。
category: agent
tags: [Agent Loop, 控制循环, 工具调用]
status: learning
difficulty: medium
frequency: high
last_reviewed: 2026-11-04
source: 面经整理
sidebar:
  order: 1
---

## 导读

读完这篇，你会理解一次 Agent 任务如何从输入走到答案，为什么单次模型调用不够，以及循环里每一步各自负责什么。前置知识：什么是 Agent、LLM 的基本调用方式。

## 基础概念

- **轮次（turn）**：一次模型决策，加上它引发的工具执行。
- **工具调用（tool call）**：模型请求执行某个工具，并给出参数。
- **观察（observation）**：工具返回的结果，会被回填到上下文。
- **状态（state）**：消息、计划、工具结果、草稿本等需要跨轮保留的信息。
- **停止条件**：最终答案、最大步数、预算耗尽、无进展或人工中断。
- **预算**：token、时间、工具调用次数和费用上限，用来防止循环失控。

## 核心结论

Agent Loop 是 Agent 的核心控制流：每一轮把当前状态组装成上下文交给模型，模型决定调用工具还是给出答案；如果调用工具，Harness 执行后把结果作为 observation 回填，再进入下一轮，直到完成或触发停止条件。

## 原理与机制

**最小循环可以写成这样：**

```python
while not done:
    context = assemble(state)          # 系统提示、工具、记忆、历史
    output = model(context)

    if output.tool_calls:
        results = execute(output.tool_calls)
        state.append(results)          # 把观察结果放回上下文
    else:
        done = True
        return output.text
```

**每一轮要处理四件事：**

1. **组装上下文**：系统提示、工具定义、历史消息、记忆、检索结果。
2. **模型决策**：输出文本、工具调用，或两者兼有。
3. **执行与回填**：校验参数、鉴权、执行工具、把结果追加为 observation。
4. **终止判断**：最终答案、最大轮数、token / 时间预算、无进展检测、人工中断。

**常见失败模式：**

- 工具反复失败但模型不断重试，形成死循环。
- 上下文随轮次膨胀，后面关键信息被挤出窗口。
- 工具返回错误没有结构化回填，模型误以为成功。
- 过早停止，任务只完成一半。

**和 Harness 的关系：** Loop 是 Harness 的心脏；谁负责组装上下文、谁执行工具、谁记录追踪，都是 Harness 的职责。

<figure class="diagram">
	<img src="/images/diagrams/agent-loop.png" alt="小八在 Agent Loop 中推理、调用工具、观察结果并回答用户" loading="lazy" />
	<figcaption>小八每一轮都在「想—做—看」之间循环：工具结果回到上下文，直到能给出最终回答。</figcaption>
</figure>

## 具体案例

用户问：「为什么昨晚订单服务的延迟升高？」

1. 模型决定调用 `query_logs(service="order", window="2h")`，拿到 P99 延迟和错误率。
2. 观察到数据库连接池耗尽，第二轮调用指标工具确认连接数曲线。
3. 第三轮查最近发布记录，发现一次连接池配置变更。
4. 给出结论并建议回滚，任务结束。

整个过程最多 8 步、5 分钟，超过预算就停下来请求人工介入。每一轮的观察结果都会裁剪后回填上下文，而不是原样塞回去。

## 追问链

1. **怎么防止死循环？** 同时设置最大步数、token / 时间预算、重复状态检测和「无进展」判断；连续多轮没有新信息就中止。
2. **工具报错应该怎么处理？** 把结构化的错误信息作为 observation 回填，而不是吞掉；同时给模型修复提示，并限制同一工具的重试次数。
3. **上下文越来越长怎么办？** 摘要历史、保留关键工具结果、把大结果存到外部文件按需读取，或者把子任务隔离给子 Agent。
4. **什么时候必须让人确认？** 有外部副作用、不可逆操作、高金额或高权限的动作，例如发邮件、删除数据、执行支付。

## 常见误区

- Agent Loop 不是「一次模型调用 + 一堆工具」，而是一个显式的状态机；状态设计和停止条件比提示词更重要。
- 不要把所有历史都塞回上下文；回填时应裁剪、摘要或引用，否则轮次越多越慢越贵。

## 延伸阅读

- Anthropic, Building Effective Agents (2024)
- ReAct: Synergizing Reasoning and Acting in Language Models (2022)
