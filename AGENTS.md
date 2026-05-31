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
adb logcat -s Tauri      # 查看 Tauri Android 运行日志
```

## 开发环境

- **Android 真机调试**：通过无线调试（无模拟器），用户需要连接时，先用 `question` 工具询问 IP 地址、配对端口和配对码，执行 `adb pair <ip>:<port> <code>` 配对；再询问调试连接端口，执行 `adb connect <ip>:<port>` 连接。成功后提示「应用会自动推送到手机上」
- **Tauri 开发**：`source ~/.zshrc && npx tauri android dev`（自动通过 ADB 发现设备，devUrl 指向 `http://10.10.3.2:5173`）
- **Rust**：通过 `mise` 管理，项目根目录有 `mise.toml`
- **Android SDK**：`/opt/android-sdk`（platforms;android-34 + build-tools + NDK 27），环境变量已写入 `~/.zshrc`

## 核心原则

- **禁止未经确认直接编码**：任何代码修改必须先提出计划 → 等待用户确认 → 才能实现
- **需求不明确时严禁猜测**：必须使用 `question` 工具询问用户，不得自行假设
- **存在多个实现方案时**：必须先列出所有方案并推荐一个，说明理由和 Tradeoff
- **复杂任务必须按工作流执行**：游戏开发或架构变更等复杂任务必须遵循「游戏开发工作流」章节的 6 阶段管线，每阶段设 Gate 确认后才能继续
- **与用户交流始终使用简体中文**，保持专业简洁；代码中保持英文风格，注释写中文

## 任务处理流程

### 简单任务

```
说明计划 → 用户确认 → 实现 → 验证
```

### 复杂任务（游戏开发）

新游戏、新功能、架构变更等复杂任务必须按 6 阶段管线执行，每阶段设 Gate：

```
Phase 1: 需求分析 → 用户确认
Phase 2: 原型设计 → 用户确认
Phase 3: 资源准备 → 用户确认
Phase 4: 代码开发（红绿模式）
Phase 5: 代码审查 → 用户确认
Phase 6: 验证复盘
```

详细定义见「游戏开发工作流」章节。**禁止跳过「用户确认」步骤直接编码。** Git 提交仅在用户明确要求时执行（见 Git Commit 章节）。

## 代码检查

修改后根据变更类型选择验证方式：

| 变更类型                                   | 验证命令                                                   |
| ------------------------------------------ | ---------------------------------------------------------- |
| 代码变更（`.ts`/`.vue`/`.css`/`.json` 等） | `npm run preflight && npm run build && npm run format`     |
| 纯文档变更（`.md` 文件）                   | `npm run format`                                           |
| 包含 PNG 文件                              | 上述完成后额外运行[图片优化](#图片优化)                    |

任何一步报错都必须修复后重新验证。

> **为什么需要 `npm run build`**：`lint` 和 `type-check` 只能静态分析，无法检测 Vue 模板编译期错误（如 `v-else` 无对应 `v-if`、slot 嵌套不当等）。这些错误仅在 Vite 生产构建阶段暴露，必须单独验证。

## 游戏开发

详细开发指南：

- 容器布局 / 添加新游戏 / Container Queries → [`docs/game-dev.md`](docs/game-dev.md)
- 音效管理 → [`docs/game-dev.md#音效管理`](docs/game-dev.md#音效管理)
- 状态持久化 → [`docs/game-dev.md#状态持久化`](docs/game-dev.md#状态持久化)
- 游戏性能优化 → [`docs/game-dev.md#游戏性能优化`](docs/game-dev.md#游戏性能优化)
- 图片/音频生成 / UI 校验 → [`docs/game-dev.md#图片生成`](docs/game-dev.md#图片生成)

### 强制规则

1. **每个游戏必须自带退出按钮**（Android 返回键 + 按钮并存，Desktop 无返回键）
2. 使用 `useGameNavigation` composable 处理退出和页面跳转
3. **所有游戏页面必须使用 `GameContainer.vue` 作为外层容器**，禁止自行实现容器布局。默认 3:4 竖屏，需要其他宽高比通过 CSS 变量覆盖
4. **游戏根容器禁止添加 padding**，间距统一由 `GameContainer.vue` 控制（左右 `clamp(14px, 3.5vw, 28px)`，顶部底部安全区域保护）。极端情况下可通过 CSS 变量（`--gc-padding-*`、`--gc-aspect-ratio`）覆盖
5. **禁止直接修改 `GameContainer.vue` 来添加游戏特定装饰**。背景通过 `bg-class`（自管理 CSS）+ `#decoration` slot（动态装饰）由游戏自管理
6. 游戏内响应式**必须使用 Container Queries**，禁止 `@media` 做游戏内**布局**适配；系统特性查询（如 `prefers-reduced-motion`、`prefers-color-scheme`）除外
7. 游戏内输入**必须使用 Pointer Events**，统一触摸屏和鼠标
8. 音效必须通过 `soundUtils` 管理生命周期（`retainCtx`/`releaseCtx` 配对），退出前停止所有音效。参考 [`docs/game-dev.md#音效管理`](docs/game-dev.md#音效管理)
9. 游戏状态必须在退出/切换前通过 `gameStorage` 或 Tauri 命令自动持久化。参考 [`docs/game-dev.md#状态持久化`](docs/game-dev.md#状态持久化)
10. 动画优先使用 `transform`/`opacity`，禁止直接操作 `offsetTop`/`scrollTop` 等触发强制回流。参考 [`docs/game-dev.md#游戏性能优化`](docs/game-dev.md#游戏性能优化)
11. 使用 `registerCleanup` 注册所有定时器/事件监听/AudioContext 清理，游戏退出必须完整释放

## 游戏开发工作流

新游戏、新功能、架构变更等复杂任务必须按 6 阶段管线执行，每阶段设 Gate：

### Phase 1: 需求分析

加载 `skill brainstorming`，输出设计文档。

**产出：** 设计文档（功能描述、游戏规则、界面草图、状态流转）
**Gate：** 用户确认设计文档

### Phase 2: 原型设计

加载 `skill mobile-game-ui-ux`，确定游戏 UI 布局、HUD 风格、交互方式。

> `skill game-ui-design` 作为补充参考，提供跨平台（PC/主机）的通用游戏 UI 设计模式。

**约束：**

- 严格遵循 `docs/game-dev.md` 跨设备适配策略（GameContainer 3:4、Container Queries）
- 退出按钮融合游戏自身视觉风格
- 游戏首页无需顶部导航栏

**产出：** UI 设计稿 / 视觉方案描述
**Gate：** 用户确认 UI 设计

### Phase 3: 资源准备

使用 `skill comfyui-image` 生成图片（背景、棋子、图标等），`skill comfyui-audio` 生成音效。

**约束：**

- 逐张生成，禁止并行（显存限制）
- 图片 → `src/games/<game-id>/assets/images/`
- 音效 → `src/games/<game-id>/assets/audio/`
- 首页图标 → `public/assets/games/`
- 临时产物 → `docs/tmp/`
- 严格串行，详情见 `docs/game-dev.md` 的图片生成和音效生成章节

**Gate：** 用户确认资源就绪

### Phase 4: 代码开发（红绿模式）

加载 `skill test-driven-development`，遵循 TDD 红绿模式：

1. **红** — 编写测试（测试失败）
2. **绿** — 编写最小实现（测试通过）
3. **重构** — 优化代码（测试保持通过）

**同时遵守以下项目约束：**

- 所有强制规则逐一检查
- 容器布局参照 `docs/game-dev.md` 第 3 节
- 音效管理参照 `docs/game-dev.md#音效管理`
- 状态持久化参照 `docs/game-dev.md#状态持久化`
- 性能优化参照 `docs/game-dev.md#游戏性能优化`

**产出：** 完整实现 + 测试
**Gate：** 全部测试通过

### Phase 5: 代码审查

加载 `skill code-reviewer`，逐项检查：

| 检查项   | 说明                                                                                                          |
| -------- | ------------------------------------------------------------------------------------------------------------- |
| 功能性   | 是否满足设计文档需求                                                                                          |
| 容器布局 | Container Queries 禁止 `@media`，不重复处理 safe area                                                         |
| 交互     | Pointer Events 统一 touch/mouse，退出按钮齐全                                                                 |
| 生命周期 | `registerCleanup` 注册所有定时器/事件/AudioContext；`retainCtx`/`releaseCtx` 成对；退出前 stop 音效并保存状态 |
| 性能     | 动画 `transform`/`opacity`，对象池复用，无强制回流                                                            |

**Gate：** 审查通过无阻塞项

### Phase 6: 验证复盘

1. 运行 `npm run preflight && npm run format`
2. 对比 Phase 1 设计文档逐项验证功能完整性
3. 用户验收确认
4. 如需提交 → 走 Git Commit 流程
5. 如需迭代 → 回到对应 Phase

## Skill 临时产物管理

调用 skill（如 comfyui-image、comfyui-audio、vision 等）生成的临时文件（图片、音频、分析结果等）必须存放在 `docs/tmp/` 目录下，按类型创建子目录：

```
docs/tmp/
  images/     # 生成的图片
  audio/      # 生成的音频
  vision/     # Vision API 分析结果
  ...         # 其他类型按需创建
```

- 临时文件不纳入 git 版本控制（已在 `.gitignore` 中配置）
- 使用完毕后应及时清理过期临时文件
- **禁止使用系统 `/tmp` 目录**，所有临时文件必须存放在项目 `docs/tmp/` 内
- **临时产物文件名必须添加时间戳**（格式：`YYYYMMDD-HHmmss`），防止覆盖同名产物
  - 示例：`3d-cartoon-robot-20260518-143022.png`
  - 仅临时产物需要添加时间戳，游戏正式资源文件不需要

### bg-remove 去背景

使用 `rembg` 去除背景时，输出路径必须指向 `docs/tmp/images/`：

```bash
# 正确：输出到项目临时目录，添加时间戳
rembg i input.png docs/tmp/images/output-nobg-20260518-143022.png

# 错误：使用系统 /tmp 目录
rembg i input.png /tmp/output-nobg.png  # 禁止
```

- **输入和输出路径不能相同**（rembg 不支持原地覆盖）
- 每次只处理一张图片，禁止并行执行多个 rembg 进程
- **输出文件名必须添加时间戳**（格式：`YYYYMMDD-HHmmss`），防止覆盖同名产物

## 图片优化

使用 `scripts/optimize-png.mjs` 对项目图片进行压缩优化：

```bash
node scripts/optimize-png.mjs
```

- 扫描 `src/**/*.png` 和 `public/**/*.png` 目录下的所有 PNG 文件
- 使用 `pngquant` 进行有损压缩（质量范围 0.85-1.0，视觉上无损）
- 原地覆盖原文件，显示每个文件的压缩前后大小和节省百分比
- 最后输出总共节省的空间大小

## Git Commit

Git 提交仅在用户明确要求时执行，不自动包含在开发流程中。

### 提交流程

1. 分析所有未提交变更，按**最小化原则**合理划分 commit，每个 commit 一个独立逻辑单元
2. 生成 Commit Message 预览（包含 scope 和 description）
3. 展示给用户确认
4. 用户明确同意后逐个执行提交

### 格式

```
type(scope): 中文描述
```

- **type** 和 **scope** 使用英文
- **description** 使用中文

### 安全规则

以下操作必须获得用户确认：

- `git push --force` / `git reset --hard`
- `git rebase -i`（交互式变基）
- `git branch -D`（强制删除分支）
- 任何可能丢失提交历史的操作

常规操作（add、commit（含预览确认流程）、pull、checkout、merge）不需要额外确认。
