/**
 * 随心记 - 弹出窗口主逻辑
 */
import { getAllSpaces, createSpace, renameSpace, deleteSpace, getSpaceNotesCount, getSpaceTree } from '../lib/spaces.js';
import { getAllNotes, getNote, createNote, updateNote, deleteNote, duplicateNote, searchNotes } from '../lib/notes.js';
import { getAllTags, createTag, addTagToNote, removeTagFromNote } from '../lib/tags.js';

// ========== 状态 ==========
let currentView = 'list'; // 'list' | 'editor'
let currentNoteId = null;
let currentSpaceId = null;
let currentTagFilter = null;
let autoSaveTimer = null;

// ========== DOM 元素 ==========
const $notesListView = document.getElementById('notes-list-view');
const $noteEditorView = document.getElementById('note-editor-view');
const $notesList = document.getElementById('notes-list');
const $spacesTree = document.getElementById('spaces-tree');
const $tagsList = document.getElementById('tags-list');
const $noteTitle = document.getElementById('note-title');
const $noteEditor = document.getElementById('note-editor');
const $noteUpdatedAt = document.getElementById('note-updated-at');
const $noteWordCount = document.getElementById('note-word-count');
const $noteTagsList = document.getElementById('note-tags-list');
const $notesCount = document.getElementById('notes-count');
const $currentSpaceName = document.getElementById('current-space-name');
const $searchInput = document.getElementById('search-input');

// ========== 初始化 ==========
document.addEventListener('DOMContentLoaded', async () => {
  await renderSpaces();
  await renderTags();
  await renderNotesList();
  setupEventListeners();
});

// ========== 事件监听 ==========
function setupEventListeners() {
  // 新建笔记
  document.getElementById('btn-new-note').addEventListener('click', () => createNewNote());
  
  // 新建空间
  document.getElementById('btn-new-space').addEventListener('click', () => showNewSpaceModal());
  document.getElementById('btn-cancel-space').addEventListener('click', () => hideModal('modal-new-space'));
  document.getElementById('btn-confirm-space').addEventListener('click', () => handleCreateSpace());
  document.getElementById('new-space-name').addEventListener('input', () => validateSpaceName());
  
  // 返回列表
  document.getElementById('btn-back').addEventListener('click', () => switchToListView());
  
  // 删除笔记
  document.getElementById('btn-delete-note').addEventListener('click', () => showDeleteNoteModal());
  document.getElementById('btn-cancel-delete').addEventListener('click', () => hideModal('modal-confirm-delete'));
  document.getElementById('btn-confirm-delete').addEventListener('click', () => handleDeleteNote());
  
  // 复制笔记
  document.getElementById('btn-duplicate-note').addEventListener('click', () => handleDuplicateNote());
  
  // 工具栏
  document.querySelectorAll('.toolbar-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const command = btn.dataset.command;
      if (command) {
        document.execCommand(command, false, null);
      }
    });
  });
  
  // 插入图片
  document.getElementById('btn-insert-image').addEventListener('click', () => insertImage());
  
  // 粘贴图片
  document.getElementById('btn-paste-image').addEventListener('click', () => handlePasteImage());
  
  // 笔记内容变化 - 自动保存
  $noteEditor.addEventListener('input', () => {
    scheduleAutoSave();
    updateWordCount();
  });
  
  $noteTitle.addEventListener('input', () => {
    scheduleAutoSave();
  });
  
  // 标签
  document.getElementById('btn-add-tag').addEventListener('click', () => showNewTagModal());
  document.getElementById('btn-cancel-tag').addEventListener('click', () => hideModal('modal-new-tag'));
  document.getElementById('btn-confirm-tag').addEventListener('click', () => handleAddTag());
  
  // 搜索
  $searchInput.addEventListener('input', debounce(() => handleSearch($searchInput.value), 300));
}

// ========== 笔记操作 ==========
async function createNewNote() {
  const note = await createNote({
    title: '',
    content: '',
    spaceId: currentSpaceId || null,
    tags: []
  });
  currentNoteId = note.id;
  switchToEditorView(note);
}

function switchToEditorView(note) {
  currentView = 'editor';
  $notesListView.classList.add('hidden');
  $noteEditorView.classList.remove('hidden');
  
  $noteTitle.value = note.title || '';
  $noteEditor.innerHTML = note.content || '';
  $noteUpdatedAt.textContent = note.updatedAt ? formatDate(note.updatedAt) : '';
  updateWordCount();
  renderNoteTags(note.tags || []);
  
  // 禁用链接命令（需要URL）
  const linkBtn = document.querySelector('[data-command="createLink"]');
  linkBtn.addEventListener('click', () => {
    const url = prompt('请输入链接地址：');
    if (url) {
      document.execCommand('createLink', false, url);
    }
  });
}

function switchToListView() {
  currentView = 'list';
  currentNoteId = null;
  $notesListView.classList.remove('hidden');
  $noteEditorView.classList.add('hidden');
  renderNotesList();
}

async function handleDeleteNote() {
  if (!currentNoteId) return;
  await deleteNote(currentNoteId);
  hideModal('modal-confirm-delete');
  switchToListView();
}

async function handleDuplicateNote() {
  if (!currentNoteId) return;
  const original = await getNote(currentNoteId);
  if (!original) return;
  
  const duplicated = await duplicateNote(currentNoteId);
  currentNoteId = duplicated.id;
  switchToEditorView(duplicated);
}

// ========== 自动保存 ==========
function scheduleAutoSave() {
  if (autoSaveTimer) {
    clearTimeout(autoSaveTimer);
  }
  autoSaveTimer = setTimeout(() => {
    saveCurrentNote();
  }, 1000);
}

async function saveCurrentNote() {
  if (!currentNoteId) return;
  
  const updates = {
    title: $noteTitle.value,
    content: $noteEditor.innerHTML,
    updatedAt: Date.now()
  };
  
  await updateNote(currentNoteId, updates);
  $noteUpdatedAt.textContent = formatDate(Date.now());
}

// ========== 渲染函数 ==========
async function renderSpaces() {
  const tree = await getSpaceTree();
  $spacesTree.innerHTML = renderSpaceTree(tree, 0);
  
  // 添加点击事件
  $spacesTree.querySelectorAll('.space-item').forEach(item => {
    item.addEventListener('click', (e) => {
      const spaceId = item.dataset.spaceId;
      if (spaceId === 'all') {
        currentSpaceId = null;
        currentTagFilter = null;
        $currentSpaceName.textContent = '全部笔记';
      } else {
        currentSpaceId = spaceId;
        currentTagFilter = null;
        $currentSpaceName.textContent = item.dataset.spaceName;
      }
      renderNotesList();
    });
  });
}

function renderSpaceTree(spaces, depth) {
  let html = '';
  for (const space of spaces) {
    html += `
      <div class="space-item" data-space-id="${space.id}" data-space-name="${space.name}" style="padding-left: ${16 + depth * 16}px">
        <span>📁</span>
        <span class="space-name">${escapeHtml(space.name)}</span>
        <span class="count">${space.notesCount || 0}</span>
      </div>
    `;
    if (space.children && space.children.length > 0) {
      html += renderSpaceTree(space.children, depth + 1);
    }
  }
  return html;
}

async function renderTags() {
  const tags = await getAllTags();
  $tagsList.innerHTML = tags.map(tag => `
    <span class="tag-chip" data-tag-id="${tag.id}">
      ${escapeHtml(tag.name)}
      <span class="count">${tag.notesCount || 0}</span>
    </span>
  `).join('');
  
  $tagsList.querySelectorAll('.tag-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      currentTagFilter = chip.dataset.tagId;
      currentSpaceId = null;
      $currentSpaceName.textContent = chip.textContent.trim();
      renderNotesList();
    });
  });
}

async function renderNotesList() {
  let notes;
  
  if ($searchInput.value) {
    notes = await searchNotes($searchInput.value);
  } else if (currentTagFilter) {
    notes = await getNotesByTag(currentTagFilter);
  } else {
    notes = await getAllNotes({ spaceId: currentSpaceId });
  }
  
  $notesCount.textContent = `${notes.length} 篇`;
  
  if (notes.length === 0) {
    $notesList.innerHTML = `
      <div style="text-align:center; padding:40px 20px; color: var(--text-muted)">
        <p>还没有笔记</p>
        <p style="font-size:12px; margin-top:8px">点击右上角"+ 新笔记"开始</p>
      </div>
    `;
    return;
  }
  
  $notesList.innerHTML = notes.map(note => `
    <div class="note-card" data-note-id="${note.id}">
      <div class="note-card-title">${escapeHtml(note.title) || '无标题笔记'}</div>
      <div class="note-card-preview">${stripHtml(note.content)}</div>
      <div class="note-card-meta">
        <span>${formatDate(note.updatedAt)}</span>
        <div class="note-card-tags">
          ${(note.tags || []).slice(0, 3).map(t => `<span class="tag-small">${escapeHtml(t.name)}</span>`).join('')}
        </div>
      </div>
    </div>
  `).join('');
  
  $notesList.querySelectorAll('.note-card').forEach(card => {
    card.addEventListener('click', async () => {
      const note = await getNote(card.dataset.noteId);
      currentNoteId = note.id;
      switchToEditorView(note);
    });
  });
}

async function renderNoteTags(tags) {
  $noteTagsList.innerHTML = tags.map(tag => `
    <span class="note-tag">
      ${escapeHtml(tag.name)}
      <span class="remove-tag" data-tag-id="${tag.id}">×</span>
    </span>
  `).join('');
  
  $noteTagsList.querySelectorAll('.remove-tag').forEach(btn => {
    btn.addEventListener('click', async () => {
      await removeTagFromNote(currentNoteId, btn.dataset.tagId);
      const note = await getNote(currentNoteId);
      renderNoteTags(note.tags || []);
    });
  });
}

// ========== 空间操作 ==========
function showNewSpaceModal() {
  document.getElementById('new-space-name').value = '';
  document.getElementById('space-name-error').classList.add('hidden');
  populateSpaceSelect();
  document.getElementById('modal-new-space').classList.remove('hidden');
}

function hideModal(id) {
  document.getElementById(id).classList.add('hidden');
}

async function populateSpaceSelect() {
  const tree = await getSpaceTree();
  const select = document.getElementById('new-space-parent');
  select.innerHTML = '<option value="">根级别</option>';
  
  function addOptions(spaces, depth, prefix = '') {
    for (const space of spaces) {
      select.innerHTML += `<option value="${space.id}">${prefix}${space.name}</option>`;
      if (space.children) {
        addOptions(space.children, depth + 1, prefix + '— ');
      }
    }
  }
  addOptions(tree, 0);
}

async function validateSpaceName() {
  const name = document.getElementById('new-space-name').value.trim();
  if (!name) return;
  
  const spaces = await getAllSpaces();
  const siblings = currentSpaceId 
    ? spaces.filter(s => s.parentId === getSpaceById(spaces, currentSpaceId)?.parentId)
    : spaces.filter(s => !s.parentId);
  
  const exists = siblings.some(s => s.name === name);
  document.getElementById('space-name-error').classList.toggle('hidden', !exists);
}

async function handleCreateSpace() {
  const name = document.getElementById('new-space-name').value.trim();
  if (!name) return;
  
  const parentId = document.getElementById('new-space-parent').value || null;
  
  // 检查重名
  const spaces = await getAllSpaces();
  const siblings = spaces.filter(s => s.parentId === parentId);
  let finalName = name;
  if (siblings.some(s => s.name === name)) {
    const suffix = Date.now().toString(36).slice(-4);
    finalName = `${name} (${suffix})`;
  }
  
  await createSpace({ name: finalName, parentId });
  hideModal('modal-new-space');
  await renderSpaces();
}

// ========== 标签操作 ==========
function showNewTagModal() {
  document.getElementById('new-tag-name').value = '';
  document.getElementById('modal-new-tag').classList.remove('hidden');
  renderTagSuggestions('');
  
  document.getElementById('new-tag-name').addEventListener('input', (e) => {
    renderTagSuggestions(e.target.value);
  });
}

async function renderTagSuggestions(query) {
  const allTags = await getAllTags();
  const filtered = query 
    ? allTags.filter(t => t.name.toLowerCase().includes(query.toLowerCase()))
    : allTags;
  
  const suggestions = document.getElementById('tags-suggestions');
  suggestions.innerHTML = filtered.map(tag => `
    <div class="tags-suggestion-item" data-tag-id="${tag.id}">${escapeHtml(tag.name)}</div>
  `).join('');
  
  suggestions.querySelectorAll('.tags-suggestion-item').forEach(item => {
    item.addEventListener('click', async () => {
      await addTagToNote(currentNoteId, item.dataset.tagId);
      const note = await getNote(currentNoteId);
      renderNoteTags(note.tags || []);
      hideModal('modal-new-tag');
    });
  });
}

async function handleAddTag() {
  const name = document.getElementById('new-tag-name').value.trim();
  if (!name || !currentNoteId) return;
  
  const tag = await createTag({ name });
  await addTagToNote(currentNoteId, tag.id);
  const note = await getNote(currentNoteId);
  renderNoteTags(note.tags || []);
  hideModal('modal-new-tag');
  await renderTags();
}

// ========== 图片操作 ==========
function insertImage() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const dataUrl = await fileToDataUrl(file);
      document.execCommand('insertImage', false, dataUrl);
    }
  };
  input.click();
}

async function handlePasteImage() {
  try {
    const items = await navigator.clipboard.read();
    for (const item of items) {
      for (const type of item.types) {
        if (type.startsWith('image/')) {
          const blob = await item.getType(type);
          const dataUrl = await fileToDataUrl(blob);
          document.execCommand('insertImage', false, dataUrl);
          return;
        }
      }
    }
    // 没有图片，粘贴文本作为内容
    document.execCommand('paste');
  } catch (e) {
    // 降级：直接粘贴
    document.execCommand('paste');
  }
}

// ========== 搜索 ==========
async function handleSearch(query) {
  if (!query.trim()) {
    renderNotesList();
    return;
  }
  const notes = await searchNotes(query);
  $notesCount.textContent = `${notes.length} 篇`;
  // 复用列表渲染逻辑
  if (notes.length === 0) {
    $notesList.innerHTML = `
      <div style="text-align:center; padding:40px 20px; color: var(--text-muted)">
        <p>没有找到匹配的笔记</p>
      </div>
    `;
    return;
  }
  $notesList.innerHTML = notes.map(note => `
    <div class="note-card" data-note-id="${note.id}">
      <div class="note-card-title">${escapeHtml(note.title) || '无标题笔记'}</div>
      <div class="note-card-preview">${stripHtml(note.content)}</div>
      <div class="note-card-meta">
        <span>${formatDate(note.updatedAt)}</span>
        <div class="note-card-tags">
          ${(note.tags || []).slice(0, 3).map(t => `<span class="tag-small">${escapeHtml(t.name)}</span>`).join('')}
        </div>
      </div>
    </div>
  `).join('');
  $notesList.querySelectorAll('.note-card').forEach(card => {
    card.addEventListener('click', async () => {
      const note = await getNote(card.dataset.noteId);
      currentNoteId = note.id;
      switchToEditorView(note);
    });
  });
}

// ========== 辅助函数 ==========
function formatDate(timestamp) {
  if (!timestamp) return '';
  const d = new Date(timestamp);
  const now = new Date();
  const diff = now - d;
  
  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)} 天前`;
  
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>"']/g, (m) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[m]));
}

function stripHtml(html) {
  if (!html) return '';
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent || div.innerText || '';
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

function updateWordCount() {
  const text = $noteEditor.innerText || '';
  const count = text.replace(/\s/g, '').length;
  $noteWordCount.textContent = `${count} 字`;
}

// 临时：获取单个空间的函数（需要完善 spaces.js 的导出）
function getSpaceById(spaces, id) {
  for (const s of spaces) {
    if (s.id === id) return s;
    if (s.children) {
      const found = getSpaceById(s.children, id);
      if (found) return found;
    }
  }
  return null;
}

async function getNotesByTag(tagId) {
  const { getNotesByTag } = await import('../lib/notes.js');
  return getNotesByTag(tagId);
}
