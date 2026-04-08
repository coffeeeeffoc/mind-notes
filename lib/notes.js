/**
 * 笔记管理
 */
import { dbGet, dbGetAll, dbPut, dbDelete, dbGetByIndex } from './idb.js';
import { generateId } from './utils.js';

const STORE_NAME = 'notes';

/**
 * 创建笔记
 * @param {Object} opts - 笔记选项
 * @param {string} opts.title - 标题
 * @param {string} opts.content - 内容
 * @param {string|null} opts.spaceId - 所属空间ID
 * @param {Array} opts.tags - 标签列表
 */
export async function createNote({ title = '', content = '', spaceId = null, tags = [] } = {}) {
  const note = {
    id: generateId(),
    title: title || '无标题笔记',
    content,
    spaceId,
    tags,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isPinned: false
  };

  await dbPut(STORE_NAME, note);
  return note;
}

/**
 * 获取笔记
 */
export async function getNote(id) {
  return dbGet(STORE_NAME, id);
}

/**
 * 更新笔记
 */
export async function updateNote(id, updates) {
  const note = await dbGet(STORE_NAME, id);
  if (!note) throw new Error('笔记不存在');

  const updated = {
    ...note,
    ...updates,
    updatedAt: Date.now()
  };

  await dbPut(STORE_NAME, updated);
  return updated;
}

/**
 * 删除笔记
 */
export async function deleteNote(id) {
  await dbDelete(STORE_NAME, id);
}

/**
 * 获取某个空间下的所有笔记
 */
export async function getNotesBySpace(spaceId) {
  return dbGetByIndex(STORE_NAME, 'spaceId', spaceId);
}

/**
 * 获取所有笔记（按更新时间倒序）
 */
export async function getAllNotes({ spaceId = null } = {}) {
  let notes = await dbGetAll(STORE_NAME);
  if (spaceId !== null) {
    notes = notes.filter(n => n.spaceId === spaceId);
  }
  return notes.sort((a, b) => b.updatedAt - a.updatedAt);
}

/**
 * 根据标签获取笔记
 */
export async function getNotesByTag(tagId) {
  const notes = await dbGetAll(STORE_NAME);
  return notes.filter(note => 
    note.tags && note.tags.some(t => t.id === tagId || t.name === tagId)
  ).sort((a, b) => b.updatedAt - a.updatedAt);
}

/**
 * 移动笔记到新空间
 */
export async function moveNote(id, newSpaceId) {
  return updateNote(id, { spaceId: newSpaceId });
}

/**
 * 复制笔记
 */
export async function duplicateNote(id) {
  const original = await dbGet(STORE_NAME, id);
  if (!original) throw new Error('笔记不存在');

  const copy = {
    ...original,
    id: generateId(),
    title: `${original.title} (副本)`,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  await dbPut(STORE_NAME, copy);
  return copy;
}

/**
 * 搜索笔记
 */
export async function searchNotes(keyword) {
  const notes = await dbGetAll(STORE_NAME);
  const kw = keyword.toLowerCase();
  return notes.filter(note =>
    note.title.toLowerCase().includes(kw) ||
    (note.content && note.content.toLowerCase().includes(kw))
  ).sort((a, b) => b.updatedAt - a.updatedAt);
}

/**
 * 获取笔记数量（按空间）
 */
export async function getNoteCountBySpace(spaceId) {
  const notes = await dbGetByIndex(STORE_NAME, 'spaceId', spaceId);
  return notes.length;
}
