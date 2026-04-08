/**
 * 随心记 - 后台服务
 * 处理插件生命周期、快捷键、上下文菜单等
 */

// 监听插件安装/更新
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('随心记插件已安装');
    // 初始化默认空间
    initDefaultData();
  } else if (details.reason === 'update') {
    console.log('随心记插件已更新到新版本');
  }
});

// 初始化默认数据
async function initDefaultData() {
  const { createSpace } = await import('../lib/spaces.js');
  const { createNote } = await import('../lib/notes.js');
  
  // 创建"收件箱"默认空间
  await createSpace({ name: '收件箱', parentId: null });
  
  // 创建一篇欢迎笔记
  const spaces = await import('../lib/spaces.js').then(m => m.getAllSpaces());
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
}

// 快捷键命令
chrome.commands.onCommand.addListener((command) => {
  if (command === 'open-popup') {
    chrome.action.openPopup();
  }
});

// 监听来自 popup 或 content script 的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'get-version') {
    chrome.runtime.getManifest().version;
  }
  return false;
});
