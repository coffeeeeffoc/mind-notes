/**
 * 空间管理 - 树状文件夹结构
 */
import { dbGet, dbGetAll, dbPut, dbDelete, dbGetByIndex } from './idb.js';
import { generateId } from './utils.js';

const STORE_NAME = 'spaces';

/**
 * 创建空间
 * @param {Object|string} opts - 空间名称或选项对象
 * @param {string} opts.name - 空间名称
 * @param {string|null} opts.parentId - 父空间ID
 */
export async function createSpace(nameOrOpts, parentId = null) {
  let name;
  if (typeof nameOrOpts === 'object') {
    name = nameOrOpts.name;
    parentId = nameOrOpts.parentId ?? null;
  } else {
    name = nameOrOpts;
  }
  
  // 检查同级空间是否重名
  const siblings = await getChildSpaces(parentId);
  const existingName = siblings.find(s => s.name === name);

  let finalName = name;
  if (existingName) {
    // 自动添加不重名后缀
    const suffix = Date.now().toString(36).slice(-4);
    finalName = `${name} (${suffix})`;
  }

  const space = {
    id: generateId(),
    name: finalName,
    parentId,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    order: siblings.length
  };

  await dbPut(STORE_NAME, space);
  return space;
}

/**
 * 获取所有根空间
 */
export async function getRootSpaces() {
  const allSpaces = await dbGetAll(STORE_NAME);
  return allSpaces.filter(s => s.parentId === null).sort((a, b) => a.order - b.order);
}

/**
 * 获取子空间
 */
export async function getChildSpaces(parentId) {
  return dbGetByIndex(STORE_NAME, 'parentId', parentId);
}

/**
 * 获取空间详情
 */
export async function getSpace(id) {
  return dbGet(STORE_NAME, id);
}

/**
 * 更新空间
 */
export async function updateSpace(id, updates) {
  const space = await dbGet(STORE_NAME, id);
  if (!space) throw new Error('空间不存在');

  const updated = {
    ...space,
    ...updates,
    updatedAt: Date.now()
  };

  await dbPut(STORE_NAME, updated);
  return updated;
}

/**
 * 删除空间（同时删除所有子空间）
 */
export async function deleteSpace(id) {
  // 递归删除子空间
  const children = await getChildSpaces(id);
  for (const child of children) {
    await deleteSpace(child.id);
  }
  // 删除空间本身
  await dbDelete(STORE_NAME, id);
}

/**
 * 重命名空间
 */
export async function renameSpace(id, newName) {
  const space = await dbGet(STORE_NAME, id);
  if (!space) throw new Error('空间不存在');

  // 检查同级是否重名
  const siblings = await getChildSpaces(space.parentId);
  const existing = siblings.find(s => s.name === newName && s.id !== id);

  let finalName = newName;
  if (existing) {
    const suffix = Date.now().toString(36).slice(-4);
    finalName = `${newName} (${suffix})`;
  }

  return updateSpace(id, { name: finalName });
}

/**
 * 获取空间路径（从根到该空间）
 */
export async function getSpacePath(id) {
  const path = [];
  let currentId = id;

  while (currentId) {
    const space = await dbGet(STORE_NAME, currentId);
    if (!space) break;
    path.unshift(space);
    currentId = space.parentId;
  }

  return path;
}

/**
 * 移动空间到新父空间
 */
export async function moveSpace(id, newParentId) {
  const space = await dbGet(STORE_NAME, id);
  if (!space) throw new Error('空间不存在');

  // 防止移动到自己的子空间
  if (newParentId) {
    let checkId = newParentId;
    while (checkId) {
      if (checkId === id) {
        throw new Error('不能移动到子空间');
      }
      const parent = await dbGet(STORE_NAME, checkId);
      checkId = parent?.parentId;
    }
  }

  // 检查重名
  const siblings = await getChildSpaces(newParentId);
  const existing = siblings.find(s => s.name === space.name && s.id !== id);

  let finalName = space.name;
  if (existing) {
    const suffix = Date.now().toString(36).slice(-4);
    finalName = `${space.name} (${suffix})`;
  }

  return updateSpace(id, {
    parentId: newParentId,
    name: finalName
  });
}

/**
 * 获取所有空间（扁平列表）
 */
export async function getAllSpaces() {
  return dbGetAll(STORE_NAME);
}

/**
 * 获取空间树（含笔记数量）
 */
export async function getSpaceTree() {
  const allSpaces = await dbGetAll(STORE_NAME);
  
  // 获取每个空间的笔记数量
  async function getSpaceNotesCount(spaceId) {
    const { getAllNotes } = await import('./notes.js');
    const notes = await getAllNotes();
    return notes.filter(n => n.spaceId === spaceId).length;
  }

  async function buildTree(parentId = null, depth = 0) {
    const children = allSpaces
      .filter(s => s.parentId === parentId)
      .sort((a, b) => a.order - b.order);
    
    const result = [];
    for (const space of children) {
      const notesCount = await getSpaceNotesCount(space.id);
      const node = {
        id: space.id,
        name: space.name,
        parentId: space.parentId,
        notesCount
      };
      const childSpaces = await buildTree(space.id, depth + 1);
      if (childSpaces.length > 0) {
        node.children = childSpaces;
      }
      result.push(node);
    }
    return result;
  }

  return buildTree(null);
}

/**
 * 获取指定空间的笔记数量
 */
export async function getSpaceNotesCount(spaceId) {
  const { getAllNotes } = await import('./notes.js');
  const notes = await getAllNotes();
  return notes.filter(n => n.spaceId === spaceId).length;
}
