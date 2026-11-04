import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { marked } from 'marked';
import * as admin from './lib.mjs';
import { CATEGORIES } from '../scripts/categories.mjs';

const PUBLIC_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), 'public');

const STATIC_ROUTES = {
	'/admin': ['index.html', 'text/html; charset=utf-8'],
	'/admin/': ['index.html', 'text/html; charset=utf-8'],
	'/admin/index.html': ['index.html', 'text/html; charset=utf-8'],
	'/admin/app.js': ['app.js', 'text/javascript; charset=utf-8'],
	'/admin/style.css': ['style.css', 'text/css; charset=utf-8'],
};

export function adminPlugin() {
	return {
		name: 'bagu-admin',
		apply: 'serve',
		configureServer(server) {
			server.middlewares.use(async (req, res, next) => {
				const url = new URL(req.url ?? '/', 'http://localhost');
				if (!url.pathname.startsWith('/admin')) return next();

				try {
					if (url.pathname.startsWith('/admin/api/')) {
						await handleApi(req, res, url);
					} else {
						await serveStatic(url.pathname, res);
					}
				} catch (error) {
					const status = error instanceof admin.ApiError ? error.status : 500;
					sendJson(res, status, { error: error.message || '服务器内部错误' });
				}
			});
		},
	};
}

async function serveStatic(pathname, res) {
	const route = STATIC_ROUTES[pathname];
	if (!route) return notFound(res);
	const [file, type] = route;
	const body = await readFile(path.join(PUBLIC_DIR, file));
	res.setHeader('Content-Type', type);
	res.setHeader('Cache-Control', 'no-store');
	res.end(body);
}

function notFound(res) {
	res.statusCode = 404;
	res.setHeader('Content-Type', 'text/plain; charset=utf-8');
	res.end('Not found');
}

function sendJson(res, status, data) {
	res.statusCode = status;
	res.setHeader('Content-Type', 'application/json; charset=utf-8');
	res.setHeader('Cache-Control', 'no-store');
	res.end(JSON.stringify(data));
}

function readBody(req, limit = 12 * 1024 * 1024) {
	return new Promise((resolve, reject) => {
		let size = 0;
		const chunks = [];
		req.on('data', (chunk) => {
			size += chunk.length;
			if (size > limit) {
				reject(new admin.ApiError(413, '请求内容过大'));
				req.destroy();
				return;
			}
			chunks.push(chunk);
		});
		req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
		req.on('error', reject);
	});
}

async function readJson(req) {
	const raw = await readBody(req);
	if (!raw.trim()) return {};
	try {
		return JSON.parse(raw);
	} catch {
		throw new admin.ApiError(400, '请求 JSON 格式不正确');
	}
}

async function handleApi(req, res, url) {
	const route = url.pathname.slice('/admin/api/'.length).replace(/\/$/, '');

	if (req.method === 'GET' && route === 'bootstrap') {
		const [cards, template, git] = await Promise.all([
			admin.listCards(),
			admin.getTemplate(),
			admin.gitInfo(),
		]);
		const categories = Object.entries(CATEGORIES).map(([key, label]) => ({
			key,
			label,
			count: cards.filter((card) => card.category === key).length,
		}));
		sendJson(res, 200, { cards, categories, template, git });
		return;
	}

	if (req.method === 'GET' && route === 'card') {
		const category = url.searchParams.get('category') ?? '';
		const slug = url.searchParams.get('slug') ?? '';
		const card = await admin.readCard(category, slug);
		sendJson(res, 200, card);
		return;
	}

	if (req.method === 'POST' && route === 'cards/save') {
		const body = await readJson(req);
		const card = await admin.saveCard({ original: body.original ?? null, card: body.card ?? {} });
		sendJson(res, 200, card);
		return;
	}

	if (req.method === 'POST' && route === 'cards/delete') {
		const body = await readJson(req);
		const result = await admin.deleteCard(String(body.category ?? ''), String(body.slug ?? ''));
		sendJson(res, 200, result);
		return;
	}

	if (req.method === 'POST' && route === 'preview') {
		const body = await readJson(req);
		const html = await marked.parse(String(body.markdown ?? ''), { gfm: true });
		sendJson(res, 200, { html });
		return;
	}

	if (req.method === 'POST' && route === 'upload') {
		const body = await readJson(req);
		const result = await admin.saveImage(body);
		sendJson(res, 200, result);
		return;
	}

	if (req.method === 'POST' && route === 'publish') {
		const result = await admin.publish();
		sendJson(res, 200, result);
		return;
	}

	throw new admin.ApiError(404, '接口不存在');
}
