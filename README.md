# 随心记 (mind-notes)

轻量级浏览器笔记插件，随时记录想法。

## 功能特性

- 📝 支持文字、富文本、链接、图片粘贴上传
- 🏷️ 标签分类
- 📁 空间（文件夹）管理，支持多层嵌套
- 💾 本地存储，即时保存，随时关闭不丢失
- 🎨 简洁优雅的界面

## 安装

1. 下载/克隆本项目
2. 打开 Chrome/Edge，访问 `chrome://extensions/`
3. 开启「开发者模式」
4. 点击「加载已解压的扩展程序」
5. 选择本项目的 `mind-notes` 目录

## 项目结构

```
mind-notes/
├── manifest.json          # Chrome 插件配置
├── package.json           # Node.js 项目配置
├── popup/                 # 弹窗 UI
│   ├── popup.html
│   ├── popup.css
│   └── popup.js
├── background/            # 后台服务
│   └── background.js
├── content/               # 内容脚本
│   └── content.js
├── lib/                   # 核心库
│   ├── idb.js            # IndexedDB 存储层
│   ├── utils.js          # 工具函数
│   ├── spaces.js         # 空间管理
│   ├── notes.js          # 笔记管理
│   ├── tags.js           # 标签管理
│   └── images.js         # 图片存储
└── README.md
```

## 技术栈

- Chrome Extension Manifest V3
- 原生 JavaScript（无框架依赖）
- IndexedDB（存储笔记和图片）
- chrome.storage（存储配置和元数据）

## 使用方法

1. 点击浏览器工具栏的插件图标打开随手记
2. 按 `+ 新笔记` 创建新笔记
3. 在编辑器中输入内容，支持富文本格式
4. 点击 `📁 空间` 创建文件夹来组织笔记
5. 使用 `+ 标签` 为笔记添加分类标签

## 开发

```bash
# 查看文件变更
git status

# 提交变更
git add .
git commit -m "your message"
git push
```

## License

MIT
