/**
 * 标签管理
 */
import { dbGet, dbGetAll, dbPut, dbDelete, dbGetByIndex } from './idb.js';
import { generateId } from './utils.js';

const TAGS_STORE = 'tags';
const NOTE_TAGS_STORE = 'noteTags';

/**
 * 创建标签
 * @param {Object|string} opts - 标签名称或选项对象
 */
export async function createTag(nameOrOpts, color = '#3b82f6') {
  let name;
  if (typeof nameOrOpts === 'object') {
    name = nameOrOpts.name;
    color = nameOrOpts.color || color;
  } else {
    name = nameOrOpts;
  }
  
  // 检查是否已存在
  const existing = await dbGetAll(TAGS_STORE);
  const found = existing.find(t => t.name === name);
  if (found) return found;

  const tag = {
    id: generateId(),
    name,
    color,
    createdAt: Date.now()
  };

  await dbPut(TAGS_STORE, tag);
  return tag;
}

/**
 * 获取所有标签（带笔记数量）
 */
export async function getAllTags() {
  const tags = await dbGetAll(TAGS_STORE);
  const notes = await dbGetAll('notes');
  return tags.map(tag => ({
    ...tag,
    notesCount: notes.filter(n => n.tags?.some(t => t.id === tag.id)).length
  }));
}

/**
 * 获取标签
 */
export async function getTag(id) {
  return dbGet(TAGS_STORE, id);
}

/**
 * 更新标签
 */
export async function updateTag(id, updates) {
  const tag = await dbGet(TAGS_STORE, id);
  if (!tag) throw new Error('标签不存在');

  const updated = { ...tag, ...updates };
  await dbPut(TAGS_STORE, updated);
  return updated;
}

/**
 * 删除标签
 */
export async function deleteTag(id) {
  // 删除标签
  await dbDelete(TAGS_STORE, id);
  // 删除所有关联
  const associations = await dbGetByIndex(NOTE_TAGS_STORE, 'tagId', id);
  for (const assoc of associations) {
    await dbDelete(NOTE_TAGS_STORE, [assoc.noteId, assoc.tagId]);
  }
}

/**
 * 为笔记添加标签
 */
export async function addTagToNote(noteId, tagId) {
  const association = {
    noteId,
    tagId,
    createdAt: Date.now()
  };
  await dbPut(NOTE_TAGS_STORE, association);
}

/**
 * 从笔记移除标签
 */
export async function removeTagFromNote(noteId, tagId) {
  await dbDelete(NOTE_TAGS_STORE, [noteId, tagId]);
}

/**
 * 获取笔记的所有标签
 */
export async function getNoteTags(noteId) {
  const associations = await dbGetByIndex(NOTE_TAGS_STORE, 'noteId', noteId);
  const tags = [];
  for (const assoc of associations) {
    const tag = await dbGet(TAGS_STORE, assoc.tagId);
    if (tag) tags.push(tag);
  }
  return tags;
}

/**
 * 获取标签下的所有笔记ID
 */
export async function getNoteIdsByTag(tagId) {
  const associations = await dbGetByIndex(NOTE_TAGS_STORE, 'tagId', tagId);
  return associations.map(a => a.noteId);
}

/**
 * 搜索标签
 */
export async function searchTags(keyword) {
  const tags = await dbGetAll(TAGS_STORE);
  const kw = keyword.toLowerCase();
  return tags.filter(t => t.name.toLowerCase().includes(kw));
}
