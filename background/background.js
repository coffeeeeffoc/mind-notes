/**
 * 随心记 - 后台服务 (Manifest V3 Service Worker)
 */

// 监听插件安装/更新
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    console.log('随心记插件已安装');
    await initDefaultData();
  } else if (details.reason === 'update') {
    console.log('随心记插件已更新到新版本');
  }
});

// 创建右键菜单
chrome.runtime.onStartup.addListener(() => {
  createContextMenu();
});

chrome.runtime.onInstalled.addListener(() => {
  createContextMenu();
});

function createContextMenu() {
  chrome.contextMenus?.removeAll(() => {
    chrome.contextMenus?.create({
      id: 'save-selection-to-mindnotes',
      title: '保存到随心记 📝',
      contexts: ['selection']
    });
    chrome.contextMenus?.create({
      id: 'save-page-to-mindnotes',
      title: '保存页面到随心记 📝',
      contexts: ['page']
    });
  });
}

// 右键菜单点击处理
chrome.contextMenus?.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'save-selection-to-mindnotes' && info.selectionText) {
    // 保存选中文本
    const { createNote } = await import('../lib/notes.js');
    await createNote({
      title: `"${info.selectionText.slice(0, 30)}..."`,
      content: info.selectionText,
      spaceId: null,
      tags: []
    });
    showNotification('已保存选中文本到随心记 📝');
  } else if (info.menuItemId === 'save-page-to-mindnotes' && tab) {
    // 保存页面
    const { createNote } = await import('../lib/notes.js');
    await createNote({
      title: tab.title || '无标题',
      content: `<a href="${tab.url}">${tab.title}</a>`,
      spaceId: null,
      tags: []
    });
    showNotification('已保存页面到随心记 📝');
  }
});

// 显示通知
function showNotification(message) {
  // 通知仅在支持通知的浏览器可用
  if (chrome.notifications) {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: '../assets/icons/icon48.png',
      title: '随心记',
      message: message
    });
  }
}

// 监听来自 popup 或 content script 的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'get-version') {
    sendResponse({ version: chrome.runtime.getManifest().version });
  }
  return false;
});

// 初始化默认数据
async function initDefaultData() {
  try {
    const { createSpace } = await import('../lib/spaces.js');
    const { createNote } = await import('../lib/notes.js');
    
    // 创建"收件箱"默认空间
    await createSpace({ name: '收件箱', parentId: null });
    
    // 创建一篇欢迎笔记
    const { getAllSpaces } = await import('../lib/spaces.js');
    const spaces = await getAllSpaces();
    const inbox = spaces.find(s => s.name === '收件箱');
    
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
      spaceId: inbox?.id || null,
      tags: []
    });
  } catch (e) {
    console.error('初始化默认数据失败:', e);
  }
}
