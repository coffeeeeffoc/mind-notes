/**
 * IndexedDB 存储层 - 随心记
 * 用于存储笔记内容、图片等大文件
 */

const DB_NAME = 'mind-notes-db';
const DB_VERSION = 1;

let dbInstance = null;

function openDB() {
  if (dbInstance) return Promise.resolve(dbInstance);

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // 笔记存储
      if (!db.objectStoreNames.contains('notes')) {
        const notesStore = db.createObjectStore('notes', { keyPath: 'id' });
        notesStore.createIndex('spaceId', 'spaceId', { unique: false });
        notesStore.createIndex('createdAt', 'createdAt', { unique: false });
        notesStore.createIndex('updatedAt', 'updatedAt', { unique: false });
      }

      // 空间存储
      if (!db.objectStoreNames.contains('spaces')) {
        const spacesStore = db.createObjectStore('spaces', { keyPath: 'id' });
        spacesStore.createIndex('parentId', 'parentId', { unique: false });
        spacesStore.createIndex('order', 'order', { unique: false });
      }

      // 标签存储
      if (!db.objectStoreNames.contains('tags')) {
        const tagsStore = db.createObjectStore('tags', { keyPath: 'id' });
        tagsStore.createIndex('name', 'name', { unique: true });
      }

      // 笔记-标签关联
      if (!db.objectStoreNames.contains('noteTags')) {
        const noteTagsStore = db.createObjectStore('noteTags', { keyPath: ['noteId', 'tagId'] });
        noteTagsStore.createIndex('noteId', 'noteId', { unique: false });
        noteTagsStore.createIndex('tagId', 'tagId', { unique: false });
      }

      // 图片存储 (BLOB)
      if (!db.objectStoreNames.contains('images')) {
        db.createObjectStore('images', { keyPath: 'id' });
      }
    };
  });
}

function transaction(storeNames, mode = 'readonly') {
  return openDB().then(db => {
    const tx = db.transaction(storeNames, mode);
    const stores = Array.isArray(storeNames)
      ? storeNames.map(name => tx.objectStore(name))
      : [tx.objectStore(storeNames)];
    return { tx, stores };
  });
}

export async function dbGet(storeName, key) {
  const { stores } = await transaction(storeName);
  return new Promise((resolve, reject) => {
    const request = stores[0].get(key);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function dbGetAll(storeName) {
  const { stores } = await transaction(storeName);
  return new Promise((resolve, reject) => {
    const request = stores[0].getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function dbGetByIndex(storeName, indexName, value) {
  const { stores } = await transaction(storeName);
  return new Promise((resolve, reject) => {
    const index = stores[0].index(indexName);
    const request = index.getAll(value);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function dbPut(storeName, data) {
  const { stores } = await transaction(storeName, 'readwrite');
  return new Promise((resolve, reject) => {
    const request = stores[0].put(data);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function dbDelete(storeName, key) {
  const { stores } = await transaction(storeName, 'readwrite');
  return new Promise((resolve, reject) => {
    const request = stores[0].delete(key);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function dbClear(storeName) {
  const { stores } = await transaction(storeName, 'readwrite');
  return new Promise((resolve, reject) => {
    const request = stores[0].clear();
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}
