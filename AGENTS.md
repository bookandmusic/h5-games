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

## 开发环境

- **Android 模拟器**：`adb connect 10.10.3.6:5555`，远程查看 `http://10.10.3.6:6080/vnc.html`
- **Tauri 开发**：`source ~/.zshrc && npx tauri android dev`（自动通过 ADB 发现模拟器，devUrl 指向 `http://10.10.3.2:5173`）
- **Rust**：通过 `mise` 管理，项目根目录有 `mise.toml`
- **Android SDK**：`/opt/android-sdk`（platforms;android-34 + build-tools + NDK 27），环境变量已写入 `~/.zshrc`

## 核心原则

- **禁止未经确认直接编码**：任何代码修改必须先提出计划 → 等待用户确认 → 才能实现
- **需求不明确时严禁猜测**：必须使用 `question` 工具询问用户，不得自行假设
- **存在多个实现方案时**：必须先列出所有方案并推荐一个，说明理由和 Tradeoff
- **复杂任务必须加载 skill**：新游戏、新功能、架构变更前，先 `skill asking-questions` 或 `skill brainstorming`
- **与用户交流始终使用简体中文**，保持专业简洁；代码中保持英文风格，注释写中文

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

**如果本次修改包含 PNG 图片文件**，在上述命令通过后，提交前还必须运行[图片优化](#图片优化)命令，压缩后的文件需要一并提交。

## 游戏开发

详细开发指南（容器布局、Container Queries、添加新游戏流程、图片/音频生成、UI 校验等）：

- [`docs/game-dev.md`](docs/game-dev.md)

### 强制规则

1. **每个游戏必须自带退出按钮**（Android 返回键 + 按钮并存，Desktop 无返回键）
2. 使用 `useGameNavigation` composable 处理退出和页面跳转
3. **所有游戏页面必须使用 `GameContainer.vue` 作为外层容器**，禁止自行实现容器布局。默认 3:4 竖屏，需要其他宽高比通过 CSS 变量覆盖
4. **游戏根容器禁止添加 padding**，间距统一由 `GameContainer.vue` 控制（左右 `clamp(14px, 3.5vw, 28px)`，顶部底部安全区域保护）。极端情况下可通过 CSS 变量（`--gc-padding-*`、`--gc-aspect-ratio`）覆盖
5. 游戏内响应式**必须使用 Container Queries**，禁止 `@media` 做游戏内布局
6. 游戏内输入**必须使用 Pointer Events**，统一触摸屏和鼠标
7. 图片/音频生成**必须逐张/逐个调用**，禁止并行（会撑爆显存）
8. Vision API 分析**必须串行执行**，两次请求间隔至少 5 秒

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
