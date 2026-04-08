/**
 * Background Service Worker
 * 处理后台任务和持久化状态
 */

// 监听插件安装
chrome.runtime.onInstalled.addListener(() => {
  console.log('随心记插件已安装');
});

// 监听来自 popup 和 content script 的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_DATA') {
    // 返回存储的数据概要
    chrome.storage.local.get(['notesCount', 'spacesCount'], (result) => {
      sendResponse(result);
    });
    return true;
  }

  if (message.type === 'UPDATE_STATS') {
    chrome.storage.local.set({
      notesCount: message.notesCount,
      spacesCount: message.spacesCount
    });
    sendResponse({ success: true });
    return true;
  }
});

// 监听快捷键（在 manifest 中定义）
chrome.commands.onCommand.addListener((command) => {
  if (command === 'toggle-sidebar') {
    chrome.runtime.sendMessage({ type: 'TOGGLE_SIDEBAR' });
  }
});
