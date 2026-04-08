/**
 * Content Script
 * 在每个页面注入，用于快捷键和页面交互
 */

// 监听来自 background 的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'TOGGLE_SIDEBAR') {
    // 可以在这里实现页面内浮动面板
    console.log('Toggle sidebar requested');
  }
});

// 监听快捷键 (Ctrl/Cmd + Shift + M) 快速记笔记
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'M') {
    e.preventDefault();
    // 打开 popup（通过 action）
    chrome.runtime.sendMessage({ type: 'OPEN_POPUP' });
  }
});
