import { execFile } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import {
	mkdir,
	readdir,
	readFile,
	rename,
	stat,
	unlink,
	writeFile,
} from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import YAML from 'yaml';
import { CATEGORIES } from '../scripts/categories.mjs';

const execFileAsync = promisify(execFile);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DOCS_DIR = path.join(ROOT, 'src/content/docs');
const TEMPLATE_PATH = path.join(ROOT, 'templates/card.md');

const STATUSES = new Set(['new', 'learning', 'review', 'mastered']);
const DIFFICULTIES = new Set(['easy', 'medium', 'hard']);
const FREQUENCIES = new Set(['high', 'medium', 'low']);
const KNOWN_FIELDS = new Set([
	'title',
	'description',
	'category',
	'tags',
	'status',
	'difficulty',
	'frequency',
	'last_reviewed',
	'source',
]);

const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;
const ANSI_ESCAPE = /\u001b\[[0-9;]*m/g;

export class ApiError extends Error {
	constructor(status, message) {
		super(message);
		this.status = status;
	}
}

export function parseCard(raw) {
	const match = raw.match(FRONTMATTER);
	if (!match) return { data: {}, content: raw };
	let data = {};
	try {
		data = YAML.parse(match[1]) ?? {};
	} catch {
		data = {};
	}
	return { data, content: raw.slice(match[0].length) };
}

function toDateString(value) {
	if (!value) return '';
	if (value instanceof Date) return value.toISOString().slice(0, 10);
	return String(value).slice(0, 10);
}

function fieldsFromData(data) {
	return {
		title: String(data.title ?? ''),
		description: String(data.description ?? ''),
		tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
		status: STATUSES.has(data.status) ? data.status : 'new',
		difficulty: DIFFICULTIES.has(data.difficulty) ? data.difficulty : '',
		frequency: FREQUENCIES.has(data.frequency) ? data.frequency : '',
		last_reviewed: toDateString(data.last_reviewed),
		source: data.source ? String(data.source) : '',
	};
}

function extraFields(data) {
	const extra = {};
	for (const [key, value] of Object.entries(data)) {
		if (!KNOWN_FIELDS.has(key)) extra[key] = value;
	}
	return extra;
}

function serializeCard(fields, content, extra = {}) {
	const data = {
		title: fields.title,
		description: fields.description || '',
		category: fields.category,
		tags: fields.tags || [],
		status: fields.status || 'new',
	};
	if (fields.difficulty) data.difficulty = fields.difficulty;
	if (fields.frequency) data.frequency = fields.frequency;
	if (fields.last_reviewed) data.last_reviewed = fields.last_reviewed;
	if (fields.source) data.source = fields.source;
	Object.assign(data, extra);

	const frontmatter = YAML.stringify(data, { lineWidth: 0 }).trimEnd();
	return `---\n${frontmatter}\n---\n\n${content.trim()}\n`;
}

function assertCategory(category) {
	if (!CATEGORIES[category]) throw new ApiError(400, '未知分类');
}

function assertSlug(slug) {
	if (!/^[a-z0-9][a-z0-9-]*$/.test(slug)) {
		throw new ApiError(400, 'slug 只能包含小写字母、数字和连字符');
	}
}

function cardPath(category, slug) {
	return path.join(DOCS_DIR, category, `${slug}.md`);
}

export async function listCards() {
	const cards = [];
	for (const category of Object.keys(CATEGORIES)) {
		const dir = path.join(DOCS_DIR, category);
		if (!existsSync(dir)) continue;
		let entries = [];
		try {
			entries = await readdir(dir, { withFileTypes: true });
		} catch {
			continue;
		}
		for (const entry of entries) {
			if (!entry.isFile() || !entry.name.endsWith('.md') || entry.name === 'index.md') continue;
			const file = path.join(dir, entry.name);
			try {
				const [raw, info] = await Promise.all([readFile(file, 'utf8'), stat(file)]);
				const { data } = parseCard(raw);
				cards.push({
					category,
					categoryLabel: CATEGORIES[category],
					slug: entry.name.replace(/\.md$/, ''),
					...fieldsFromData(data),
					updatedAt: info.mtime.toISOString(),
				});
			} catch {
				// 忽略无法读取的文件，避免一张坏卡片拖垮整个列表
			}
		}
	}
	return cards.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function readCard(category, slug) {
	assertCategory(category);
	assertSlug(slug);
	const file = cardPath(category, slug);
	if (!existsSync(file)) throw new ApiError(404, '卡片不存在');
	const raw = await readFile(file, 'utf8');
	const { data, content } = parseCard(raw);
	return {
		category,
		categoryLabel: CATEGORIES[category],
		slug,
		...fieldsFromData(data),
		content: content.trim(),
	};
}

export async function saveCard({ original = null, card } = {}) {
	if (!card || typeof card !== 'object') throw new ApiError(400, '缺少卡片内容');

	let category = String(card.category || '');
	let slug = String(card.slug || '').trim();
	assertCategory(category);
	if (!slug) slug = `card-${Date.now().toString(36)}`;
	assertSlug(slug);

	const title = String(card.title || '').trim();
	if (!title) throw new ApiError(400, '标题不能为空');

	const target = cardPath(category, slug);
	let extra = {};
	let sourcePath = null;

	if (original) {
		assertCategory(original.category);
		assertSlug(String(original.slug || ''));
		sourcePath = cardPath(original.category, original.slug);
		if (!existsSync(sourcePath)) throw new ApiError(404, '原卡片不存在');
		const raw = await readFile(sourcePath, 'utf8');
		extra = extraFields(parseCard(raw).data);
	} else if (existsSync(target)) {
		throw new ApiError(409, '同名卡片已存在，请换一个 slug');
	}

	if (sourcePath && sourcePath !== target && existsSync(target)) {
		throw new ApiError(409, '目标分类下已存在同名卡片');
	}

	const file = serializeCard(
		{
			...fieldsFromData({
				title,
				description: card.description,
				tags: card.tags,
				status: card.status,
				difficulty: card.difficulty,
				frequency: card.frequency,
				last_reviewed: card.last_reviewed,
				source: card.source,
			}),
			category,
		},
		String(card.content ?? ''),
		extra,
	);

	await mkdir(path.dirname(target), { recursive: true });
	await writeFile(target, file, 'utf8');
	if (sourcePath && sourcePath !== target) await unlink(sourcePath);

	return readCard(category, slug);
}

export async function deleteCard(category, slug) {
	assertCategory(category);
	assertSlug(slug);
	const file = cardPath(category, slug);
	if (!existsSync(file)) throw new ApiError(404, '卡片不存在');

	const trashDir = path.join(ROOT, 'inbox/trash');
	await mkdir(trashDir, { recursive: true });
	const stamp = new Date().toISOString().replace(/[:.]/g, '-');
	const target = path.join(trashDir, `${stamp}-${category}-${slug}.md`);
	await rename(file, target);
	return { trashed: path.relative(ROOT, target) };
}

export async function getTemplate() {
	const raw = await readFile(TEMPLATE_PATH, 'utf8');
	const { content } = parseCard(raw);
	return { content: content.trim() };
}

async function git(args) {
	return execFileAsync('git', args, {
		cwd: ROOT,
		timeout: 20000,
		maxBuffer: 4 * 1024 * 1024,
	});
}

export async function gitInfo() {
	try {
		const { stdout } = await git(['rev-parse', '--is-inside-work-tree']);
		if (stdout.trim() !== 'true') return { isRepo: false };
	} catch {
		return { isRepo: false };
	}

	let branch = '';
	let remote = '';
	let changes = 0;
	try {
		branch = (await git(['branch', '--show-current'])).stdout.trim();
	} catch {}
	try {
		remote = (await git(['remote'])).stdout.trim().split('\n').filter(Boolean)[0] ?? '';
	} catch {}
	try {
		const out = (await git(['status', '--porcelain'])).stdout.trim();
		changes = out ? out.split('\n').length : 0;
	} catch {}

	return { isRepo: true, branch, remote, changes };
}

export async function publish() {
	const info = await gitInfo();
	const logs = [];

	const run = async (command, args) => {
		logs.push(`$ ${command} ${args.join(' ')}`);
		try {
			const { stdout, stderr } = await execFileAsync(command, args, {
				cwd: ROOT,
				timeout: 180000,
				maxBuffer: 20 * 1024 * 1024,
			});
			if (stdout.trim()) logs.push(stdout.replace(ANSI_ESCAPE, '').trim());
			if (stderr.trim()) logs.push(stderr.replace(ANSI_ESCAPE, '').trim());
			return { ok: true, stdout, stderr };
		} catch (error) {
			const output = [error.stdout, error.stderr]
				.filter(Boolean)
				.join('\n')
				.replace(ANSI_ESCAPE, '')
				.trim();
			if (output) logs.push(output);
			logs.push(error.message);
			return { ok: false, stdout: error.stdout ?? '', stderr: error.stderr ?? '' };
		}
	};

	if (!info.isRepo) {
		logs.push('未检测到 Git 仓库，改为执行生产构建。');
		const build = await run('npm', ['run', 'build']);
		return { mode: 'build', ok: build.ok, log: logs.join('\n') };
	}

	const paths = ['src/content/docs'];
	if (existsSync(path.join(ROOT, 'public/images'))) paths.push('public/images');
	const added = await run('git', ['add', '-A', '--', ...paths]);
	if (!added.ok) {
		return { mode: 'git', ok: false, committed: false, pushed: false, log: logs.join('\n') };
	}

	const status = await run('git', ['status', '--porcelain']);
	let committed = false;
	if (status.stdout.trim()) {
		const commit = await run('git', ['commit', '-m', 'docs: 更新八股卡片']);
		committed = commit.ok;
		if (!committed) {
			return { mode: 'git', ok: false, committed: false, pushed: false, log: logs.join('\n') };
		}
	} else {
		logs.push('没有需要提交的改动。');
	}

	let pushed = false;
	const remote = await run('git', ['remote']);
	if (remote.stdout.trim()) {
		const push = await run('git', ['push']);
		pushed = push.ok;
		return { mode: 'git', ok: push.ok, committed, pushed, log: logs.join('\n') };
	}

	logs.push('仓库没有配置远程地址，改动已提交到本地。');
	return { mode: 'git', ok: true, committed, pushed, log: logs.join('\n') };
}

const IMAGE_TYPES = {
	'image/png': 'png',
	'image/jpeg': 'jpg',
	'image/gif': 'gif',
	'image/webp': 'webp',
	'image/avif': 'avif',
	'image/svg+xml': 'svg',
};

export async function saveImage({ filename, dataUrl } = {}) {
	const match = /^data:([^;]+);base64,([\s\S]+)$/.exec(String(dataUrl || ''));
	if (!match) throw new ApiError(400, '图片数据格式不正确');
	const ext = IMAGE_TYPES[match[1]];
	if (!ext) throw new ApiError(400, '只支持 PNG、JPEG、GIF、WebP、AVIF、SVG 图片');

	const buffer = Buffer.from(match[2], 'base64');
	if (buffer.length > 8 * 1024 * 1024) throw new ApiError(413, '图片不能超过 8MB');

	const now = new Date();
	const month = String(now.getMonth() + 1).padStart(2, '0');
	const dir = path.join(ROOT, 'public/images', String(now.getFullYear()), month);
	await mkdir(dir, { recursive: true });

	const base =
		String(filename || '')
			.replace(/\.[^.]+$/, '')
			.replace(/[^a-zA-Z0-9-_]+/g, '-')
			.replace(/^-+|-+$/g, '')
			.slice(0, 40) || 'image';
	const name = `${base}-${randomUUID().slice(0, 8)}.${ext}`;
	await writeFile(path.join(dir, name), buffer);

	return { url: `/images/${now.getFullYear()}/${month}/${name}` };
}
