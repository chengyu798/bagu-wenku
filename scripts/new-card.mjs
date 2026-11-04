#!/usr/bin/env node
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { CATEGORIES } from './categories.mjs';

const [category, slug, ...titleParts] = process.argv.slice(2);

if (!category || !slug) {
	console.error('用法: npm run new -- <分类> <slug> ["标题"]');
	console.error(`分类: ${Object.keys(CATEGORIES).join(', ')}`);
	process.exit(1);
}

if (!CATEGORIES[category]) {
	console.error(`未知分类 "${category}"，可选: ${Object.keys(CATEGORIES).join(', ')}`);
	process.exit(1);
}

if (!/^[a-z0-9][a-z0-9-]*$/.test(slug)) {
	console.error('slug 只能包含小写字母、数字和连字符，例如 process-vs-thread');
	process.exit(1);
}

const title = titleParts.join(' ') || slug;
const date = new Date().toISOString().slice(0, 10);
const target = path.join(process.cwd(), 'src/content/docs', category, `${slug}.md`);

if (existsSync(target)) {
	console.error(`文件已存在: ${path.relative(process.cwd(), target)}`);
	process.exit(1);
}

const templatePath = path.join(process.cwd(), 'templates/card.md');
const template = await readFile(templatePath, 'utf8');
const content = template
	.replaceAll('{{title}}', title)
	.replaceAll('{{category}}', category)
	.replaceAll('{{date}}', date);

await mkdir(path.dirname(target), { recursive: true });
await writeFile(target, content, 'utf8');

console.log(`已创建 ${path.relative(process.cwd(), target)}`);
console.log('编辑完成后运行 npm run dev 预览，或运行 npm run dev 后在 /admin 管理。');
