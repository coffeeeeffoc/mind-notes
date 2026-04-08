/**
 * 随心记 - 后台服务 (Manifest V3 Service Worker)
 * 注意：Service Worker 不支持 ES module import，所有存储逻辑内联在此文件
 */

// ========== 简化的存储层 (IndexedDB) ==========
const DB_NAME = 'mind-notes-db';
const DB_VERSION = 1;
let db = null;

async function openDB() {
  if (db) return db;
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };
    request.onupgradeneeded = (event) => {
      const database = event.target.result;
      if (!database.objectStoreNames.contains('notes')) {
        database.createObjectStore('notes', { keyPath: 'id' });
      }
      if (!database.objectStoreNames.contains('spaces')) {
        const store = database.createObjectStore('spaces', { keyPath: 'id' });
        store.createIndex('parentId', 'parentId', { unique: false });
      }
      if (!database.objectStoreNames.contains('tags')) {
        database.createObjectStore('tags', { keyPath: 'id' });
      }
    };
  });
}

async function dbPut(storeName, data) {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const tx = database.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const request = store.put(data);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

async function dbGet(storeName, id) {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const tx = database.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function dbGetAll(storeName) {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const tx = database.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

async function dbDelete(storeName, id) {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const tx = database.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

// ========== 笔记操作 ==========
async function createNote({ title = '', content = '', spaceId = null, tags = [] } = {}) {
  const note = {
    id: generateId(),
    title: title || '无标题笔记',
    content,
    spaceId,
    tags,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  await dbPut('notes', note);
  return note;
}

async function getAllSpaces() {
  return dbGetAll('spaces');
}

// ========== 右键菜单 ==========
chrome.runtime.onInstalled.addListener(() => {
  createContextMenu();
});

chrome.runtime.onStartup.addListener(() => {
  createContextMenu();
});

function createContextMenu() {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: 'save-selection-to-mindnotes',
      title: '保存到随心记 📝',
      contexts: ['selection']
    });
    chrome.contextMenus.create({
      id: 'save-page-to-mindnotes',
      title: '保存页面到随心记 📝',
      contexts: ['page']
    });
  });
}

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'save-selection-to-mindnotes' && info.selectionText) {
    await createNote({
      title: `"${info.selectionText.slice(0, 30)}..."`,
      content: info.selectionText,
      spaceId: null,
      tags: []
    });
    showNotification('已保存选中文本到随心记 📝');
  } else if (info.menuItemId === 'save-page-to-mindnotes' && tab) {
    await createNote({
      title: tab.title || '无标题',
      content: `<a href="${tab.url}">${tab.title}</a>`,
      spaceId: null,
      tags: []
    });
    showNotification('已保存页面到随心记 📝');
  }
});

function showNotification(message) {
  if (chrome.notifications) {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'assets/icons/icon48.png',
      title: '随心记',
      message: message
    });
  }
}

// ========== 初始化默认数据 ==========
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    console.log('随心记插件已安装');
    try {
      // 创建默认空间
      await dbPut('spaces', {
        id: generateId(),
        name: '收件箱',
        parentId: null,
        createdAt: Date.now()
      });
      
      // 创建欢迎笔记
      await createNote({
        title: '欢迎使用随心记',
        content: `<p>👋 欢迎使用随心记！</p>
<p>这是一个轻量级的浏览器笔记插件，可以帮助你随时记录想法。</p>
<p><b>功能特点：</b></p>
<ul>
<li>📝 支持文字、链接、图片记录</li>
<li>🏷️ 标签分类</li>
<li>📁 空间管理（类似文件夹）</li>
<li>💾 本地存储，随时关闭不丢失</li>
</ul>
<p>开始记录你的第一个想法吧！</p>`,
        spaceId: null,
        tags: []
      });
      console.log('默认数据初始化完成');
    } catch (e) {
      console.error('初始化默认数据失败:', e);
    }
  } else if (details.reason === 'update') {
    console.log('随心记插件已更新到新版本');
  }
});

// ========== 消息处理 ==========
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'get-version') {
    sendResponse({ version: chrome.runtime.getManifest().version });
  }
  return false;
});
