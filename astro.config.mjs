// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import { adminPlugin } from './admin/vite-plugin.mjs';

// https://astro.build/config
export default defineConfig({
	devToolbar: { enabled: false },
	// 管理后台插件通过 apply: 'serve' 只在开发服务器中生效
	vite: { plugins: [adminPlugin()] },
	integrations: [
		starlight({
			title: '个人八股文库',
			description: 'Agent 开发、大模型、深度学习、机器学习与计算机基础知识的个人复习卡片库。',
			defaultLocale: 'zh-CN',
			locales: {
				root: { label: '简体中文', lang: 'zh-CN' },
			},
			customCss: ['./src/styles/custom.css'],
			sidebar: [
				{ label: '使用说明', link: '/guide/' },
				{ label: '免费开源书籍', link: '/open-books/' },
				{
					label: 'Agent 开发',
					items: [
						{ label: '学习路线', link: '/agent/' },
						{ label: '什么是 Agent？', slug: 'agent/what-is-an-agent' },
						{ label: '基础术语表', slug: 'agent/glossary' },
						{
							label: '核心机制',
							items: [
								{ label: 'Agent Loop', slug: 'agent/agent-loop' },
								{ label: 'Tool Call 与 Function Call', slug: 'agent/tool-call-vs-function-call' },
								{ label: 'ReAct', slug: 'agent/react-pattern' },
							],
						},
						{
							label: '工程实践',
							items: [
								{ label: 'Agent Harness', slug: 'agent/agent-harness' },
								{ label: '提示词工程', slug: 'agent/prompt-engineering' },
								{ label: '上下文工程', slug: 'agent/context-engineering' },
								{ label: '记忆工程', slug: 'agent/memory-engineering' },
								{ label: 'MCP', slug: 'agent/mcp' },
								{ label: 'Skill', slug: 'agent/skill' },
							],
						},
						{
							label: '进阶模式',
							items: [
								{ label: 'Plan-and-Execute', slug: 'agent/plan-and-execute' },
								{ label: 'Reflection', slug: 'agent/reflection' },
								{ label: 'CoT / ToT / GoT', slug: 'agent/reasoning-cot-tot-got' },
							],
						},
						{
							label: '架构与选型',
							items: [{ label: '单 Agent 与多 Agent', slug: 'agent/single-vs-multi-agent' }],
						},
					],
				},
				{
					label: '大模型',
					items: [{ autogenerate: { directory: 'llm' } }],
				},
				{
					label: '深度学习',
					items: [
						{ label: '概览', link: '/deep-learning/' },
						{ label: 'Transformer 位置编码', slug: 'deep-learning/transformer-position-encoding' },
						{
							label: '花书精读',
							items: [
								{ label: '阅读指南', slug: 'deep-learning/book' },
								{
									label: '第一部分 · 应用数学与机器学习基础',
									items: [
										{ label: '第 1 章 引言', slug: 'deep-learning/book/chapter-01' },
										{ label: '第 2 章 线性代数', slug: 'deep-learning/book/chapter-02' },
										{ label: '第 3 章 概率与信息论', slug: 'deep-learning/book/chapter-03' },
										{ label: '第 4 章 数值计算', slug: 'deep-learning/book/chapter-04' },
										{ label: '第 5 章 机器学习基础', slug: 'deep-learning/book/chapter-05' },
									],
								},
								{
									label: '第二部分 · 现代实用深度网络',
									items: [
										{ label: '第 6 章 深度前馈网络', slug: 'deep-learning/book/chapter-06' },
										{ label: '第 7 章 正则化', slug: 'deep-learning/book/chapter-07' },
										{ label: '第 8 章 优化', slug: 'deep-learning/book/chapter-08' },
										{ label: '第 9 章 卷积网络', slug: 'deep-learning/book/chapter-09' },
										{ label: '第 10 章 序列建模', slug: 'deep-learning/book/chapter-10' },
										{ label: '第 11 章 实践方法论', slug: 'deep-learning/book/chapter-11' },
										{ label: '第 12 章 应用', slug: 'deep-learning/book/chapter-12' },
									],
								},
								{
									label: '第三部分 · 深度学习研究',
									items: [
										{ label: '第 13 章 线性因子模型', slug: 'deep-learning/book/chapter-13' },
										{ label: '第 14 章 自编码器', slug: 'deep-learning/book/chapter-14' },
										{ label: '第 15 章 表示学习', slug: 'deep-learning/book/chapter-15' },
										{ label: '第 16 章 结构化概率模型', slug: 'deep-learning/book/chapter-16' },
										{ label: '第 17 章 蒙特卡罗方法', slug: 'deep-learning/book/chapter-17' },
										{ label: '第 18 章 直面配分函数', slug: 'deep-learning/book/chapter-18' },
										{ label: '第 19 章 近似推断', slug: 'deep-learning/book/chapter-19' },
										{ label: '第 20 章 深度生成模型', slug: 'deep-learning/book/chapter-20' },
									],
								},
							],
						},
					],
				},
				{
					label: '机器学习',
					items: [{ autogenerate: { directory: 'machine-learning' } }],
				},
				{
					label: '数据结构',
					items: [{ autogenerate: { directory: 'data-structures' } }],
				},
				{
					label: '操作系统',
					items: [{ autogenerate: { directory: 'operating-systems' } }],
				},
				{
					label: '计算机网络',
					items: [{ autogenerate: { directory: 'computer-networks' } }],
				},
				{
					label: '计算机组成原理',
					items: [{ autogenerate: { directory: 'computer-architecture' } }],
				},
			],
		}),
	],
});
