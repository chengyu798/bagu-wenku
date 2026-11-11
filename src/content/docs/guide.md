---
title: 使用说明
description: 如何新增卡片、填写元数据以及组织这个知识库。
---

这个站点是一个**卡片式**的八股知识库，不是博客。每个知识点是一张可以独立复习、检索和自测的卡片。

## 用管理后台写卡片

运行 `npm run dev` 后，打开终端地址加 `/admin`（例如 `http://localhost:4321/admin`），可以在浏览器里完成新建、编辑、实时预览、上传图片和发布。后台只在本地开发服务器中存在，线上站点不会暴露它。

## 用命令行新增一张卡片

在项目根目录运行：

```bash
npm run new -- <分类> <slug> "标题"
```

例如：

```bash
npm run new -- operating-systems process-vs-thread "进程和线程的区别是什么？"
```

可用分类：`agent`、`llm`、`deep-learning`、`machine-learning`、`data-structures`、`operating-systems`、`computer-networks`、`computer-architecture`。

生成的卡片来自 `templates/card.md`，固定包含八个部分：导读、基础概念、核心结论、原理与机制、具体案例、追问链、常见误区、延伸阅读。也可以直接复制模板手动创建文件。

## 卡片元数据

| 字段 | 说明 |
| --- | --- |
| `title` | 直接用问题作为标题，方便以后抽题 |
| `description` | 一句话摘要，用于搜索结果 |
| `category` | 分类目录名 |
| `tags` | 标签数组，用于横向检索 |
| `status` | `new` / `learning` / `review` / `mastered` |
| `difficulty` | `easy` / `medium` / `hard` |
| `frequency` | 面试频率：`high` / `medium` / `low` |
| `last_reviewed` | 上次复习日期，格式 `2026-11-04` |
| `source` | 面经、论文或博客来源 |

## 碎片先丢进收件箱

看到面经、被问住、刷题遇到的知识点，先在项目根目录的 `inbox/` 里随手记，不用管格式。周末再把它们整理成正式卡片。**记录的成本越低，越容易坚持。**

## 本地预览

```bash
npm run dev
```

浏览器打开终端里提示的地址（默认 `http://localhost:4321`），管理后台在同地址的 `/admin`。

## 当前阶段

现在是 P0：分类、全文搜索、Markdown 渲染、卡片模板和本地管理后台。等内容积累到几十篇，再考虑复习队列、随机抽题和 AI 追问这些 P1/P2 功能。
