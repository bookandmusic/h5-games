# YiKe

> 跨平台手机游戏 App，支持 Windows / macOS / Linux / Android

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Vue](https://img.shields.io/badge/Vue-3-green.svg)](https://vuejs.org/)
[![Tauri](https://img.shields.io/badge/Tauri-2-FFC131.svg)](https://tauri.app/)

## ✨ 特性

- 🎮 **游戏隔离架构** — 每个游戏自包含状态、逻辑、资源，互不干扰
- 📱 **跨平台** — 一套代码，桌面端 + 移动端全覆盖
- 🎨 **自定义主题** — 紫色主题，现代化 UI 设计
- 🔍 **智能搜索** — 分类筛选 + 标题搜索，快速找到想玩的游戏
- 💾 **自动存档** — 游戏进度自动保存，随时继续
- 🖱️ **统一交互** — Pointer Events 同时支持触摸屏和鼠标

## 🚀 快速开始

### 环境要求

- Node.js >= 24
- npm >= 10
- Rust（仅桌面端构建需要）

### 安装与运行

```bash
# 克隆项目
git clone https://github.com/your-org/h5-games.git
cd h5-games

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

浏览器打开 `http://localhost:5173` 即可体验。

### 构建应用

```bash
# 构建前端
npm run build

# 构建桌面应用（Windows/macOS/Linux）
npm run tauri:build

# 构建 Android APK
npm run tauri android build
```

## 🎮 游戏列表

| 游戏 | 分类 | 简介 |
|------|------|------|
| 2048 | 益智 | 经典数字合成，合并相同数字达到 2048 |
| 中国象棋 | 棋类 | 支持人机对战与双人对战，可选难度 |
| 记忆翻牌 | 益智 | 多主题翻牌配对，挑战记忆力 |
| 星际捕手 | 益智 | 收集星辰宝石，躲避陨石，挑战连击 |

## 🏗️ 技术架构

**前端**：Vue 3 + TypeScript + Vite + Pinia + Tailwind CSS 4

**跨平台**：Tauri 2（桌面端）/ Gradle（Android）

**游戏模块**：每个游戏位于 `src/games/<game-id>/`，通过 `import.meta.glob` 自动发现和加载，无需手动注册。

详细技术文档：
- [开发指南](docs/game-dev.md) — 容器布局、Container Queries、添加新游戏流程
- [AGENTS.md](AGENTS.md) — 常用命令、代码规范、Git 工作流

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'feat: add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 提交 Pull Request

## 📄 许可证

MIT
