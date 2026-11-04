# 个人八股文库

一个用 [Astro](https://astro.build) + [Starlight](https://starlight.astro.build) 搭建的个人计算机八股知识库。内容以 Markdown 卡片为单元，按「一句话答案 → 展开 → 追问链 → 易错点 → 参考」组织，覆盖 Agent 开发、大模型、深度学习、机器学习、数据结构、操作系统、计算机网络和计算机组成原理。

## 本地开发

```bash
npm install
npm run dev
```

默认地址是 `http://localhost:4321`，内置全文搜索。

## 管理后台（本地）

开发服务器同时提供管理后台，打开终端提示的地址并加上 `/admin`，例如：

```text
http://localhost:4321/admin
```

后台支持：

- 按分类浏览、搜索卡片；
- 新建、编辑、移动分类；
- Markdown 实时预览，插入图片（自动上传到 `public/images/`）；
- 删除卡片时移入 `inbox/trash/`，可以手动恢复；
- 一键发布：检测到 Git 仓库时提交并推送，未初始化 Git 时执行 `npm run build`。

后台只在 `npm run dev` 时存在，不会进入生产构建，默认仅监听本机。不要在 `npm run dev -- --host` 下把它暴露到局域网或公网。

## 新增一张卡片

```bash
npm run new -- <分类> <slug> "标题"
```

例如：

```bash
npm run new -- operating-systems process-vs-thread "进程和线程的区别是什么？"
```

分类可选：`agent`、`llm`、`deep-learning`、`machine-learning`、`data-structures`、`operating-systems`、`computer-networks`、`computer-architecture`。

脚本会基于 `templates/card.md` 在对应目录生成文件，编辑后保存即可热更新。

## 目录结构

```
src/
  content/docs/
    agent/                  Agent 开发卡片
    llm/                    大模型
    deep-learning/          深度学习
    machine-learning/       机器学习
    data-structures/        数据结构
    operating-systems/      操作系统
    computer-networks/      计算机网络
    computer-architecture/  计算机组成原理
  content.config.ts         卡片元数据 schema
  styles/custom.css         主题定制
templates/card.md           卡片模板
scripts/new-card.mjs        新建卡片脚本
admin/                      本地管理后台（仅开发时可用）
inbox/                      碎片收件箱与回收站，不发布
```

## 卡片元数据

| 字段 | 取值 | 说明 |
| --- | --- | --- |
| `title` | 字符串 | 直接用问题作为标题 |
| `description` | 字符串 | 一句话答案，用于搜索结果 |
| `category` | 分类目录名 | 例如 `deep-learning` |
| `tags` | 字符串数组 | 横向检索用 |
| `status` | `new` / `learning` / `review` / `mastered` | 掌握状态 |
| `difficulty` | `easy` / `medium` / `hard` | 难度 |
| `frequency` | `high` / `medium` / `low` | 面试频率 |
| `last_reviewed` | `YYYY-MM-DD` | 上次复习日期 |
| `source` | 字符串 | 面经、论文或博客来源 |

## 部署

```bash
npm run build
```

产物在 `dist/`，可直接部署到 Vercel、Netlify 或 GitHub Pages。部署到 GitHub Pages 的项目页时，需要在 `astro.config.mjs` 里设置 `site` 和 `base`。

## 后续路线

- **P0（已完成）**：分类、搜索、Markdown 渲染、卡片模板和本地管理后台。
- **P1**：按 `status` 和 `last_reviewed` 生成每日复习队列、随机抽题、学习统计。
- **P2**：AI 生成追问、口述回答评分、语义搜索。
