/**
 * 随心记 - 内容脚本
 * 可以在任意网页上通过右键菜单或快捷键快速保存内容
 */

// 监听来自后台的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'save-from-page') {
    saveSelectionOrPage(message.data);
  }
  return false;
});

// 保存选中文本或页面信息
async function saveSelectionOrPage(data) {
  const { createNote } = await import('../lib/notes.js');
  
  const noteData = {
    title: data.title || '',
    content: data.content || '',
    spaceId: null,
    tags: []
  };
  
  await createNote(noteData);
  
  // 显示保存成功提示
  showToast('已保存到随心记 📝');
}

// 显示提示
function showToast(message) {
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: #4a90d9;
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    font-size: 14px;
    z-index: 999999;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    animation: slideIn 0.3s ease;
  `;
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 2000);
}

// 添加动画样式
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  @keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
  }
`;
document.head.appendChild(style);

// 右键菜单：保存选中文本
chrome.contextMenus?.create({
  id: 'save-to-mindnotes',
  title: '保存到随心记 📝',
  contexts: ['selection', 'page']
});

chrome.contextMenus?.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'save-to-mindnotes') {
    const content = info.selectionText || info.pageUrl || '';
    const title = info.selectionText ? `"${info.selectionText.slice(0, 30)}..."` : tab.title;
    
    await saveSelectionOrPage({
      title,
      content: info.selectionText || `<a href="${info.pageUrl}">${tab.title}</a>`,
      pageUrl: info.pageUrl
    });
  }
});
