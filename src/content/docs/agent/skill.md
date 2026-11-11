---
title: Claude Skill 是什么？它和工具、MCP 有什么区别？
description: Skill 把「一类任务怎么做」打包成按需加载的文件夹，用渐进式披露节省上下文，是流程知识而不是能力接口。
category: agent
tags: [Skill, 渐进式披露, 上下文工程]
status: learning
difficulty: medium
frequency: high
last_reviewed: 2026-11-04
source: 'Anthropic Agent Skills 文档'
sidebar:
  order: 5
---

## 导读

读完这篇，你知道 Skill 和工具、MCP 的区别，理解渐进式披露如何节省上下文，也能判断什么时候该把一套流程写成 Skill。前置知识：上下文工程、MCP。

## 基础概念

- **Skill**：把一类任务的流程、判据和资源打包成可复用的文件夹。
- **SKILL.md**：包含元数据和正文的核心文件。
- **元数据**：name 和 description，常驻上下文，用来判断是否触发。
- **渐进式披露**：元数据 → 正文 → 资源，逐层加载。
- **工具 vs Skill**：工具是能力接口，Skill 是使用这些能力的方法和步骤。
- **资源**：脚本、模板、参考文档等按需读取的文件。

## 核心结论

Skill 是把一类任务的做事方法打包成可复用的文件夹：核心是一份 `SKILL.md`，说明「什么时候用、按什么步骤做、判据是什么」，必要时附带脚本、模板和参考资料。它通过渐进式披露按需加载，避免把所有知识一次性塞进上下文。

## 原理与机制

**一个 Skill 的典型结构：**

```text
review-pr/
├── SKILL.md          # 元数据 + 正文：何时用、怎么做
├── scripts/          # 可执行脚本
├── references/       # 按需读取的参考文档
└── assets/           # 模板、示例文件
```

`SKILL.md` 的 frontmatter 至少包含 `name` 和 `description`，其中 `description` 要写清楚触发场景和边界，模型靠它判断是否启用。

**渐进式披露分三层：**

1. **元数据层**：名称和描述常驻系统提示，通常只有几十个 token。
2. **正文层**：任务命中后才加载 `SKILL.md` 的完整流程。
3. **资源层**：真正需要时才读取参考文件或执行脚本。

**和工具、MCP 的区别：**

- **Tool**：一个能力接口，告诉模型「能做什么」，带参数 schema。
- **MCP**：连接协议，解决工具和数据源「怎么被发现、怎么连上」。
- **Skill**：流程知识，告诉模型「这类任务应该按什么方法做，用哪些工具、按什么顺序、怎么判断做完了」。

三者可以叠加：一个 Skill 可以指导 Agent 调用若干 MCP 工具，并附带校验脚本。

<figure class="diagram">
	<img src="/images/diagrams/skill.png" alt="小八按渐进式披露打开 Skill 文件夹，先读元数据再加载正文与脚本" loading="lazy" />
	<figcaption>Skill 像一本按需翻开的操作手册：先看目录，命中任务才读正文，需要时才运行脚本。</figcaption>
</figure>

## 具体案例

团队把 PR 审查流程写成 `review-pr` Skill：

- `SKILL.md` 规定：先读 diff，按清单检查边界条件、并发、错误处理和测试覆盖，输出按「阻塞 / 建议 / 疑问」分组；
- `scripts/check.sh` 运行 lint 和单元测试；
- `references/checklist.md` 存放更细的检查项。

用户说「审查 #421」。模型匹配到 description 后加载正文，运行脚本，再按模板输出。没有 Skill 时，这套流程每次都要在提示词里重写，而且容易漏步骤。

## 追问链

1. **Skill 会被完整注入 system prompt 吗？** 不会。只有元数据常驻，正文和资源按需加载，这正是它节省上下文的关键。
2. **Skill 和微调的区别？** Skill 不改模型权重，本质是上下文加文件系统；微调改变参数，成本和迭代周期都更高。
3. **Skill 和 RAG 的区别？** RAG 检索事实性知识，Skill 提供程序性知识：步骤、工具用法、判断标准。
4. **怎么写出好的 description？** 明确写出「什么时候用」「解决什么任务」「不适用什么场景」，避免和其他 Skill 的触发条件重叠。

## 常见误区

- Skill 不是工具，也不是模型插件，它首先是一份给模型读的操作说明。
- 不要把 Skill 当成「万能提示词」；它真正的价值在于把流程、脚本和资源组织成可维护的文件夹。

## 延伸阅读

- Anthropic, Agent Skills 文档与工程博客
