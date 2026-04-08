# 随心记 (mind-notes)

> 轻量级浏览器笔记插件，随时记录想法

## 功能特性

- **📝 多种内容格式** - 支持文字、富文本、图片粘贴上传、链接插入
- **📁 空间管理** - 树状文件夹结构，支持多层嵌套
- **🏷️ 标签分类** - 为笔记添加彩色标签
- **💾 本地存储** - IndexedDB 本地存储，即时自动保存
- **🔍 快速搜索** - 按标题和内容搜索笔记
- **📌 置顶笔记** - 重要笔记可置顶显示
- **⚡ 快捷键支持** - `Ctrl/Cmd + Shift + M` 快速记笔记

## 安装使用

### Chrome / Edge

1. 打开 `chrome://extensions/` 或 `edge://extensions/`
2. 开启「开发者模式」
3. 点击「加载已解压的扩展程序」
4. 选择本项目目录
5. 点击浏览器工具栏的插件图标即可使用

## 项目结构

```
mind-notes/
├── manifest.json          # 插件配置 (Manifest V3)
├── package.json
├── README.md
├── popup/                 # 弹窗界面
│   ├── popup.html
│   ├── popup.css
│   └── popup.js
├── background/           # 后台服务脚本
│   └── background.js
├── content/              # 内容脚本
│   └── content.js
├── lib/                  # 核心库
│   ├── idb.js           # IndexedDB 存储层
│   ├── spaces.js        # 空间（文件夹）管理
│   ├── notes.js         # 笔记 CRUD
│   ├── tags.js          # 标签管理
│   ├── images.js        # 图片存储
│   └── utils.js         # 工具函数
└── styles/               # 样式文件
    └── content.css
```

## 技术栈

- **Manifest V3** - 最新 Chrome 扩展规范
- **IndexedDB** - 本地大文件存储
- **chrome.storage** - 轻量配置存储
- **原生 JavaScript** - 无框架依赖，轻量快速

## 开发说明

```bash
# 克隆项目后直接加载到 Chrome
# 无需构建步骤，直接加载目录即可
```

## License

MIT
