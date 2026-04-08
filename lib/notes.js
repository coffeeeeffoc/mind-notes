/**
 * 笔记管理
 */
import { dbGet, dbGetAll, dbPut, dbDelete, dbGetByIndex } from './idb.js';
import { generateId } from './utils.js';

const STORE_NAME = 'notes';

/**
 * 创建笔记
 */
export async function createNote(spaceId = null, content = '', title = '') {
  const note = {
    id: generateId(),
    title: title || '无标题笔记',
    content,
    spaceId,
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
 * 获取根空间笔记（未分类）
 */
export async function getRootNotes() {
  return dbGetByIndex(STORE_NAME, 'spaceId', null);
}

/**
 * 获取所有笔记（按更新时间倒序）
 */
export async function getAllNotes() {
  const notes = await dbGetAll(STORE_NAME);
  return notes.sort((a, b) => b.updatedAt - a.updatedAt);
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
    note.content.toLowerCase().includes(kw)
  ).sort((a, b) => b.updatedAt - a.updatedAt);
}

/**
 * 获取笔记数量（按空间）
 */
export async function getNoteCountBySpace(spaceId) {
  const notes = await dbGetByIndex(STORE_NAME, 'spaceId', spaceId);
  return notes.length;
}
