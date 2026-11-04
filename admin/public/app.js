const $ = (selector) => document.querySelector(selector);

const STATUS_LABEL = {
	new: '未学',
	learning: '学习中',
	review: '待复习',
	mastered: '已掌握',
};

const DIFFICULTY_LABEL = { easy: '简单', medium: '中等', hard: '困难' };
const FREQUENCY_LABEL = { high: '高频', medium: '中频', low: '低频' };

const state = {
	categories: [],
	cards: [],
	template: { content: '' },
	git: { isRepo: false },
	category: 'all',
	query: '',
	editing: null,
	isNew: false,
	dirty: false,
	publishing: false,
};

let previewTimer;
let toastTimer;

init();

async function init() {
	bindEvents();
	try {
		await refreshData();
		renderCategoryOptions();
		renderNav();
		renderList();
		renderGit();
	} catch (error) {
		toast(`加载失败：${error.message}`, true);
	}
}

async function api(url, options = {}) {
	const response = await fetch(url, {
		headers: { 'Content-Type': 'application/json' },
		...options,
	});
	const data = await response.json().catch(() => ({}));
	if (!response.ok) throw new Error(data.error || `请求失败（${response.status}）`);
	return data;
}

async function refreshData() {
	const data = await api('/admin/api/bootstrap');
	state.categories = data.categories;
	state.cards = data.cards;
	state.template = data.template;
	state.git = data.git;
}

function labelFor(key) {
	return state.categories.find((category) => category.key === key)?.label ?? key;
}

/* ---------- 分类导航 ---------- */

function renderCategoryOptions() {
	const select = $('#f-category');
	select.innerHTML = '';
	for (const category of state.categories) {
		const option = document.createElement('option');
		option.value = category.key;
		option.textContent = category.label;
		select.append(option);
	}
}

function renderNav() {
	const nav = $('#category-nav');
	nav.innerHTML = '';
	const total = state.cards.length;
	nav.append(navButton('all', '全部卡片', total));
	for (const category of state.categories) {
		nav.append(navButton(category.key, category.label, category.count));
	}
}

function navButton(key, label, count) {
	const button = document.createElement('button');
	button.type = 'button';
	button.className = key === state.category ? 'active' : '';
	button.addEventListener('click', () => {
		state.category = key;
		state.query = '';
		$('#search').value = '';
		renderNav();
		renderList();
	});

	const text = document.createElement('span');
	text.textContent = label;
	const badge = document.createElement('span');
	badge.className = 'count';
	badge.textContent = String(count);
	button.append(text, badge);
	return button;
}

/* ---------- 卡片列表 ---------- */

function renderList() {
	const list = $('#card-list');
	const query = state.query.trim().toLowerCase();

	let cards = state.cards.filter(
		(card) => state.category === 'all' || card.category === state.category,
	);
	if (query) {
		cards = cards.filter((card) =>
			[card.title, card.description, card.categoryLabel, ...(card.tags || [])]
				.join(' ')
				.toLowerCase()
				.includes(query),
		);
	}

	$('#view-title').textContent =
		state.category === 'all' ? '全部卡片' : labelFor(state.category);
	$('#view-subtitle').textContent = '';
	$('#list-count').textContent = `共 ${cards.length} 张卡片`;

	list.innerHTML = '';
	if (!cards.length) {
		const empty = document.createElement('div');
		empty.className = 'empty';
		const strong = document.createElement('strong');
		strong.textContent = query ? '没有匹配的卡片' : '这个分类还没有卡片';
		const span = document.createElement('span');
		span.textContent = query ? '换个关键词试试' : '点击右上角「新建卡片」开始记录';
		empty.append(strong, span);
		list.append(empty);
		return;
	}

	for (const card of cards) {
		list.append(cardRow(card));
	}
}

function cardRow(card) {
	const row = document.createElement('button');
	row.type = 'button';
	row.className = 'card-row';
	row.addEventListener('click', () => openCard(card.category, card.slug));

	const main = document.createElement('div');
	main.className = 'row-main';

	const title = document.createElement('div');
	title.className = 'row-title';
	const titleText = document.createElement('span');
	titleText.textContent = card.title || '(无标题)';
	title.append(titleText);
	title.append(
		badge(card.status, `badge s-${card.status}`, STATUS_LABEL[card.status] ?? card.status),
	);

	const desc = document.createElement('div');
	desc.className = 'row-desc';
	desc.textContent = card.description || '暂无描述';

	const meta = document.createElement('div');
	meta.className = 'row-meta';
	meta.append(chip(card.categoryLabel));
	for (const tag of (card.tags || []).slice(0, 4)) meta.append(chip(tag, 'chip tag'));
	if (card.frequency) meta.append(chip(FREQUENCY_LABEL[card.frequency] ?? card.frequency));
	if (card.difficulty) meta.append(chip(DIFFICULTY_LABEL[card.difficulty] ?? card.difficulty));
	if (card.last_reviewed) {
		const reviewed = document.createElement('span');
		reviewed.textContent = `上次复习 ${card.last_reviewed}`;
		meta.append(reviewed);
	}

	main.append(title, desc, meta);
	const arrow = document.createElement('span');
	arrow.className = 'row-arrow';
	arrow.textContent = '→';
	row.append(main, arrow);
	return row;
}

function badge(status, className, text) {
	const span = document.createElement('span');
	span.className = className;
	span.textContent = text;
	return span;
}

function chip(text, className = 'chip') {
	const span = document.createElement('span');
	span.className = className;
	span.textContent = text;
	return span;
}

/* ---------- 打开编辑器 ---------- */

async function openCard(category, slug) {
	try {
		const card = await api(
			`/admin/api/card?category=${encodeURIComponent(category)}&slug=${encodeURIComponent(slug)}`,
		);
		state.editing = card;
		state.isNew = false;
		state.dirty = false;
		fillForm(card);
		enterEditor();
	} catch (error) {
		toast(error.message, true);
	}
}

function createCard() {
	const category = state.category === 'all' ? 'agent' : state.category;
	state.editing = {
		category,
		slug: '',
		title: '',
		description: '',
		tags: [],
		status: 'new',
		difficulty: 'medium',
		frequency: 'high',
		last_reviewed: today(),
		source: '',
		content: state.template.content,
	};
	state.isNew = true;
	state.dirty = false;
	fillForm(state.editing);
	enterEditor();
	$('#f-title').focus();
}

function fillForm(card) {
	$('#f-title').value = card.title || '';
	$('#f-description').value = card.description || '';
	$('#f-category').value = card.category;
	$('#f-slug').value = card.slug || '';
	$('#f-slug').disabled = !state.isNew;
	$('#f-tags').value = (card.tags || []).join(', ');
	$('#f-status').value = card.status || 'new';
	$('#f-difficulty').value = card.difficulty || '';
	$('#f-frequency').value = card.frequency || '';
	$('#f-last-reviewed').value = card.last_reviewed || '';
	$('#f-source').value = card.source || '';
	$('#f-content').value = card.content || '';

	$('#delete-btn').classList.toggle('hidden', state.isNew);
	$('#save-state').textContent = '';
	$('#save-state').className = 'save-state';
	updatePreview();
}

function enterEditor() {
	$('#list-view').classList.add('hidden');
	$('#editor-view').classList.remove('hidden');
	document.body.classList.add('editing');
	$('#view-title').textContent = state.isNew ? '新建卡片' : '编辑卡片';
	$('#view-subtitle').textContent = state.isNew
		? labelFor(state.editing.category)
		: `${labelFor(state.editing.category)} / ${state.editing.slug}`;
}

function leaveEditor() {
	if (state.dirty && !confirm('有未保存的修改，确定离开吗？')) return;
	state.editing = null;
	state.isNew = false;
	state.dirty = false;
	$('#editor-view').classList.add('hidden');
	$('#list-view').classList.remove('hidden');
	document.body.classList.remove('editing');
	renderList();
}

/* ---------- 表单与保存 ---------- */

function markDirty() {
	state.dirty = true;
	const status = $('#save-state');
	status.textContent = '有未保存的修改';
	status.className = 'save-state dirty';
}

function collectForm() {
	return {
		title: $('#f-title').value.trim(),
		description: $('#f-description').value.trim(),
		category: $('#f-category').value,
		slug: $('#f-slug').value.trim(),
		tags: $('#f-tags')
			.value.split(/[,，]/)
			.map((tag) => tag.trim())
			.filter(Boolean),
		status: $('#f-status').value,
		difficulty: $('#f-difficulty').value,
		frequency: $('#f-frequency').value,
		last_reviewed: $('#f-last-reviewed').value,
		source: $('#f-source').value.trim(),
		content: $('#f-content').value,
	};
}

async function save() {
	if (!state.editing) return;
	const card = collectForm();
	if (!card.title) {
		toast('标题不能为空', true);
		$('#f-title').focus();
		return;
	}
	if (state.isNew && card.slug && !/^[a-z0-9][a-z0-9-]*$/.test(card.slug)) {
		toast('slug 只能包含小写字母、数字和连字符', true);
		$('#f-slug').focus();
		return;
	}

	const payload = {
		original: state.isNew
			? null
			: { category: state.editing.category, slug: state.editing.slug },
		card,
	};

	try {
		const saved = await api('/admin/api/cards/save', {
			method: 'POST',
			body: JSON.stringify(payload),
		});
		state.editing = saved;
		state.isNew = false;
		state.dirty = false;
		$('#f-slug').value = saved.slug;
		$('#f-slug').disabled = true;
		$('#delete-btn').classList.remove('hidden');
		$('#view-subtitle').textContent = `${labelFor(saved.category)} / ${saved.slug}`;
		$('#save-state').textContent = '已保存，网站已更新';
		$('#save-state').className = 'save-state saved';
		await refreshData();
		renderNav();
		renderGit();
		toast('卡片已保存');
	} catch (error) {
		toast(error.message, true);
		$('#save-state').textContent = '保存失败';
		$('#save-state').className = 'save-state dirty';
	}
}

async function removeCard() {
	if (!state.editing || state.isNew) return;
	const label = state.editing.title || state.editing.slug;
	if (!confirm(`确定删除「${label}」吗？文件会移到 inbox/trash，可以手动恢复。`)) return;

	try {
		await api('/admin/api/cards/delete', {
			method: 'POST',
			body: JSON.stringify({
				category: state.editing.category,
				slug: state.editing.slug,
			}),
		});
		toast('卡片已移入回收站');
		state.dirty = false;
		state.editing = null;
		state.isNew = false;
		$('#editor-view').classList.add('hidden');
		$('#list-view').classList.remove('hidden');
		document.body.classList.remove('editing');
		await refreshData();
		renderNav();
		renderGit();
		renderList();
	} catch (error) {
		toast(error.message, true);
	}
}

/* ---------- 预览 ---------- */

function schedulePreview() {
	$('#preview-state').textContent = '渲染中…';
	clearTimeout(previewTimer);
	previewTimer = setTimeout(updatePreview, 350);
}

async function updatePreview() {
	const markdown = $('#f-content').value;
	try {
		const { html } = await api('/admin/api/preview', {
			method: 'POST',
			body: JSON.stringify({ markdown }),
		});
		$('#preview').innerHTML = html;
		$('#preview-state').textContent = '';
	} catch (error) {
		$('#preview-state').textContent = '预览失败';
	}
}

/* ---------- 图片上传 ---------- */

function insertAtCursor(textarea, text) {
	const start = textarea.selectionStart ?? textarea.value.length;
	const end = textarea.selectionEnd ?? start;
	textarea.value = textarea.value.slice(0, start) + text + textarea.value.slice(end);
	textarea.selectionStart = textarea.selectionEnd = start + text.length;
	textarea.focus();
}

function readAsDataUrl(file) {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve(reader.result);
		reader.onerror = () => reject(new Error('读取图片失败'));
		reader.readAsDataURL(file);
	});
}

async function uploadImage(file) {
	const dataUrl = await readAsDataUrl(file);
	const { url } = await api('/admin/api/upload', {
		method: 'POST',
		body: JSON.stringify({ filename: file.name, dataUrl }),
	});
	const alt = file.name.replace(/\.[^.]+$/, '').replace(/[[\]]/g, '');
	const textarea = $('#f-content');
	insertAtCursor(textarea, `\n![${alt}](${url})\n`);
	markDirty();
	schedulePreview();
	toast('图片已上传并插入正文');
}

/* ---------- 发布 ---------- */

function renderGit() {
	const element = $('#git-status');
	if (!state.git.isRepo) {
		element.textContent = '未初始化 Git · 发布会执行构建';
		return;
	}
	const parts = [state.git.branch || 'detached'];
	parts.push(state.git.remote ? '已配置远程' : '无远程仓库');
	parts.push(state.git.changes ? `${state.git.changes} 个改动` : '工作区干净');
	element.textContent = parts.join(' · ');
}

async function publish() {
	if (state.publishing) return;
	state.publishing = true;

	const button = $('#publish-btn');
	button.disabled = true;
	button.textContent = '发布中…';

	$('#publish-title').textContent = '正在发布…';
	$('#publish-summary').textContent = '正在保存并发布卡片，这可能需要几秒钟。';
	$('#publish-log').textContent = '';
	$('#publish-modal').classList.remove('hidden');

	try {
		const result = await api('/admin/api/publish', {
			method: 'POST',
			body: '{}',
		});
		$('#publish-title').textContent = result.ok ? '发布完成' : '发布未完全成功';
		$('#publish-log').textContent = result.log || '（没有输出）';
		$('#publish-summary').textContent = summaryFor(result);
	} catch (error) {
		$('#publish-title').textContent = '发布失败';
		$('#publish-summary').textContent = error.message;
		$('#publish-log').textContent = error.stack ?? '';
	} finally {
		state.publishing = false;
		button.disabled = false;
		button.textContent = '发布';
		await refreshData();
		renderGit();
	}
}

function summaryFor(result) {
	if (result.mode === 'build') {
		return result.ok
			? '未检测到 Git 仓库，已构建到 dist/。在项目里初始化 Git 并配置远程仓库后，发布会自动提交并推送。'
			: '构建失败，请查看下方日志。';
	}
	if (!result.ok) return '发布过程中出现问题，请查看下方日志。';
	if (result.pushed) return '改动已提交并推送到远程仓库，部署平台会自动更新网站。';
	if (result.committed) return '改动已提交到本地仓库。配置远程仓库后可以一键推送部署。';
	return '没有需要提交的改动。';
}

/* ---------- 事件绑定 ---------- */

function bindEvents() {
	$('#new-btn').addEventListener('click', createCard);
	$('#back-btn').addEventListener('click', leaveEditor);
	$('#save-btn').addEventListener('click', save);
	$('#delete-btn').addEventListener('click', removeCard);
	$('#publish-btn').addEventListener('click', publish);
	$('#modal-close').addEventListener('click', () =>
		$('#publish-modal').classList.add('hidden'),
	);
	$('#publish-modal').addEventListener('click', (event) => {
		if (event.target === $('#publish-modal')) $('#publish-modal').classList.add('hidden');
	});

	$('#search').addEventListener('input', (event) => {
		state.query = event.target.value;
		renderList();
	});

	$('#card-form').addEventListener('submit', (event) => {
		event.preventDefault();
		save();
	});

	for (const id of [
		'f-title',
		'f-description',
		'f-tags',
		'f-source',
		'f-last-reviewed',
		'f-category',
		'f-status',
		'f-difficulty',
		'f-frequency',
	]) {
		$(`#${id}`).addEventListener('input', markDirty);
		$(`#${id}`).addEventListener('change', markDirty);
	}

	$('#f-content').addEventListener('input', () => {
		markDirty();
		schedulePreview();
	});

	$('#image-btn').addEventListener('click', () => $('#image-input').click());
	$('#image-input').addEventListener('change', async (event) => {
		const file = event.target.files?.[0];
		if (!file) return;
		try {
			await uploadImage(file);
		} catch (error) {
			toast(error.message, true);
		} finally {
			event.target.value = '';
		}
	});

	document.addEventListener('keydown', (event) => {
		const modifier = event.metaKey || event.ctrlKey;
		if (modifier && event.key.toLowerCase() === 's') {
			if (state.editing) {
				event.preventDefault();
				save();
			}
			return;
		}
		if (event.key === 'Escape') {
			if (!$('#publish-modal').classList.contains('hidden')) {
				$('#publish-modal').classList.add('hidden');
			} else if (!$('#editor-view').classList.contains('hidden')) {
				leaveEditor();
			}
		}
	});

	window.addEventListener('beforeunload', (event) => {
		if (!state.dirty) return;
		event.preventDefault();
		event.returnValue = '';
	});
}

/* ---------- 小工具 ---------- */

function today() {
	const date = new Date();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	return `${date.getFullYear()}-${month}-${day}`;
}

function toast(message, isError = false) {
	const element = $('#toast');
	element.textContent = message;
	element.classList.toggle('error', isError);
	element.classList.remove('hidden');
	clearTimeout(toastTimer);
	toastTimer = setTimeout(() => element.classList.add('hidden'), 3200);
}
