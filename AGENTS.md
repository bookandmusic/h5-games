# AGENTS.md

## 项目概述

手机游戏 App，技术栈：Vue 3 + Vite + Tauri 2 + Tailwind CSS 4

- 主界面：游戏列表，支持分类搜索和标题搜索
- 游戏模块：`src/games/<game-id>/` 目录下独立运行，与外部列表完全隔离
- 数据存储：`src/data/games.json`（游戏列表配置）
- 本地持久化：`src/stores/gameStorage.ts`（Tauri 原生存储 + localStorage fallback）
- 状态管理：Pinia（`src/stores/games.ts`）
- 查看全部游戏：`ls src/games/`

## 常用命令

```bash
npm run dev              # 启动前端开发服务器
npm run tauri:dev        # 启动 Tauri 开发模式
npm run build            # 构建前端（含类型检查）
npm run tauri:build      # 构建完整应用
npm run type-check       # TypeScript 类型检查
npm run lint:fix         # ESLint 自动修复
npm run format           # Prettier 格式化
npm run test:run         # Vitest 测试（单次运行）
```

## 核心原则

- **禁止未经确认直接编码**：任何代码修改必须先提出计划 → 等待用户确认 → 才能实现
- **需求不明确时严禁猜测**：必须使用 `question` 工具询问用户
- **存在多个实现方案时**：必须先列出所有方案并推荐一个，说明理由和 Tradeoff
- **复杂任务必须加载 skill**：新游戏、新功能、架构变更前，先 `skill asking-questions` 或 `skill brainstorming`

## 任务处理流程

### 简单任务

```
说明计划 → 用户确认 → 实现 → review → 验证 → git
```

### 复杂任务

```
skill brainstorming → 输出方案（2-3 个 + 推荐）→ 用户确认 → 实现 → code-reviewer → 验证 → 用户确认 → git
```

**禁止跳过「用户确认」步骤直接编码。**

## 代码检查

修改代码后**必须依次**运行以下命令，全部通过才能提交：

```bash
npm run preflight && npm run format
```

任何一步报错都必须修复后重新从第 1 步开始。

## 游戏开发

详细开发指南（容器布局、Container Queries、添加新游戏流程、图片/音频生成、UI 校验等）：

- [`docs/game-dev.md`](docs/game-dev.md)

### 强制规则

1. **每个游戏必须自带退出按钮**（Android 返回键 + 按钮并存，Desktop 无返回键）
2. 使用 `useGameNavigation` composable 处理退出和页面跳转
3. 游戏内响应式**必须使用 Container Queries**，禁止 `@media` 做游戏内布局
4. 游戏内输入**必须使用 Pointer Events**，统一触摸屏和鼠标
5. 图片/音频生成**必须逐张/逐个调用**，禁止并行（会撑爆显存）
6. Vision API 分析**必须串行执行**，两次请求间隔至少 5 秒

## Git Commit

- 格式：`type(scope): 中文描述`
- 必须预览 commit message 等待用户确认后才能提交
- 禁止推送、禁止 force push，除非用户明确要求
