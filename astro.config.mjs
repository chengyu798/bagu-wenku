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
				{
					label: 'Agent 开发',
					items: [{ autogenerate: { directory: 'agent' } }],
				},
				{
					label: '大模型',
					items: [{ autogenerate: { directory: 'llm' } }],
				},
				{
					label: '深度学习',
					items: [{ autogenerate: { directory: 'deep-learning' } }],
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
