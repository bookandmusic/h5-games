# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

手机游戏 App，技术栈：Vue 3 + Vite + Tauri 2 + Tailwind CSS 4

### 核心架构

- **主界面**: 游戏列表，支持分类搜索和标题搜索
- **游戏模块**: 每个游戏独立运行，有自己的逻辑，与外部列表完全隔离
- **数据存储**: 游戏列表数据存储在本地 JSON 文件中 (`src/data/games.json`)
- **状态管理**: Pinia 管理游戏列表状态 (`src/stores/games.ts`)

## 常用命令

```bash
# 开发
npm run dev              # 启动前端开发服务器
npm run tauri:dev        # 启动 Tauri 开发模式（完整应用）

# 构建
npm run build            # 构建前端
npm run tauri:build      # 构建完整应用（生成安装包）

# 类型检查
npm run type-check       # TypeScript 类型检查

# 代码检查
npm run lint             # ESLint 检查
npm run lint:fix         # ESLint 自动修复

# 格式化
npm run format           # Prettier 格式化

# 测试
npm run test             # Vitest 测试（watch 模式）
npm run test:run         # Vitest 测试（单次运行）
npm run test:coverage    # Vitest 测试覆盖率
```

## 项目结构

```
src/
├── main.ts              # 应用入口（引入 router、pinia）
├── App.vue              # 根组件（仅 router-view）
├── components/          # 公共组件
│   └── GameCard.vue     # 游戏卡片组件
├── views/
│   ├── Home.vue         # 主页（包含搜索栏、分类筛选、游戏列表）
│   └── GameView.vue     # 游戏容器页面（动态加载游戏）
├── games/               # 游戏模块目录（独立）
│   └── game2048/        # 2048游戏
│       └── index.vue    # 游戏入口组件
├── data/
│   └── games.json       # 游戏列表数据
├── router/
│   └── index.ts         # Vue Router 配置
├── stores/
│   ├── games.ts         # Pinia 游戏列表状态
│   └── gameStorage.ts   # 游戏状态持久化服务（localStorage/Tauri）
├── types/
│   └── game.ts          # TypeScript 类型定义
├── style.css            # 全局样式（iOS HIG 设计系统）
src-tauri/               # Tauri 后端（Rust）
public/
└── assets/
    └── games/           # 游戏图标资源
```

## 架构设计

### 游戏隔离原则

每个游戏模块是完全独立的：
- 游戏放在 `src/games/<game-name>/` 目录下
- 游戏通过路由动态加载 (`/game/:id`)
- `GameView.vue` 根据游戏 ID 动态加载对应组件
- 游戏的状态、逻辑、样式完全自包含，不影响外部列表

### 添加新游戏

1. 在 `src/games/` 下创建新目录（如 `src/games/newgame/`）
2. 创建 `index.vue` 作为游戏入口组件
3. 在 `src/data/games.json` 中添加游戏元数据
4. 在 `src/views/GameView.vue` 的 `gameComponents` 中注册组件映射

### 游戏数据格式

```typescript
interface Game {
  id: string;           // 唯一标识，用于路由和组件映射
  name: string;         // 游戏名称
  category: string;     // 分类
  description: string;  // 描述
  icon: string;         // 图标路径
  route: string;        // 路由路径（如 /game/2048）
}
```