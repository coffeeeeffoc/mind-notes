/**
 * 随心记 - 内容脚本
 * 可以在任意网页上通过右键菜单快速保存内容
 */

// 创建右键菜单（Manifest V3 需要在 background 中创建，但这里做备用处理）
if (chrome.runtime?.id) {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'save-to-mindnotes') {
      handleSave(message.data);
    }
    return false;
  });
}

// 保存选中文本或页面信息
async function handleSave(data) {
  try {
    // 动态导入 notes 模块
    const { createNote } = await import('../lib/notes.js');
    
    const noteData = {
      title: data.title || '',
      content: data.content || '',
      spaceId: null,
      tags: []
    };
    
    await createNote(noteData);
    showToast('已保存到随心记 📝');
  } catch (e) {
    console.error('保存失败:', e);
    showToast('保存失败，请重试');
  }
}

// 显示提示
function showToast(message) {
  // 创建一个简单的 toast 通知
  const existingToast = document.getElementById('mindnotes-toast');
  if (existingToast) existingToast.remove();
  
  const toast = document.createElement('div');
  toast.id = 'mindnotes-toast';
  toast.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: #4a90d9;
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    font-size: 14px;
    z-index: 2147483647;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    animation: mindnotes-slideIn 0.3s ease;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  `;
  toast.textContent = message;
  document.body.appendChild(toast);
  
  // 添加动画样式
  if (!document.getElementById('mindnotes-toast-style')) {
    const style = document.createElement('style');
    style.id = 'mindnotes-toast-style';
    style.textContent = `
      @keyframes mindnotes-slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes mindnotes-slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }
  
  setTimeout(() => {
    toast.style.animation = 'mindnotes-slideOut 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 2000);
}

// 监听键盘快捷键（可选）
document.addEventListener('keydown', (e) => {
  // Ctrl/Cmd + Shift + S 保存到随心记
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'S') {
    e.preventDefault();
    const selection = window.getSelection()?.toString();
    handleSave({
      title: selection ? `"${selection.slice(0, 30)}..."` : document.title,
      content: selection || `<a href="${location.href}">${document.title}</a>`
    });
  }
});
