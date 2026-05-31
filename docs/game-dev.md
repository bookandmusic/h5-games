# 游戏开发指南

## 跨设备适配策略

游戏需覆盖 **手机竖屏、iPad（横/竖屏）、PC 宽屏** 三种场景。采用分层适配策略：

| 层级                            | 适配方式                                                       | 职责                                 |
| ------------------------------- | -------------------------------------------------------------- | ------------------------------------ |
| 页面容器（`GameContainer.vue`） | `height: 100dvh` + padding + 背景                              | 填满视口，提供统一间距和安全区域保护 |
| 内容容器（`.game-inner`）       | `aspect-ratio: 3/4` + `max-width: 100%` + 居中，CSS 变量可覆盖 | 固定宽高比，letterbox 留白           |
| 游戏内部 UI                     | Container Queries、`cqw`/`cqh`                                 | 响应式缩放与布局重构                 |

**核心思路**：所有游戏统一使用 `GameContainer.vue` 作为外层容器，它提供左右 padding `clamp(14px, 3.5vw, 28px)` 和安全区域保护。内层按 3:4 宽高比居中显示，需要其他宽高比通过 CSS 变量（`--gc-aspect-ratio`）覆盖。宽屏 PC 两侧留白是正常行为。游戏内部通过 Container Queries 感知容器尺寸，在不同档位下调整布局和字号。**游戏根容器禁止自行添加 padding**。

## 添加新游戏

### 1. 创建目录结构

```
src/games/<game-id>/
├── index.vue              # 游戏入口（必须，对应 /game/<id>/play）
├── Home.vue               # 游戏首页（可选，对应 /game/<id>）
├── Settings.vue           # 设置页（可选，对应 /game/<id>/settings）
├── components/            # 子组件（可选）
├── gameLogic.ts           # 游戏逻辑（可选）
├── types.ts               # 类型定义（可选）
```

> **`game-id` 命名规则**：使用 kebab-case（短横线分隔小写字母），如 `chinese-chess`、`memory-match`。目录名必须与 `games.json` 中的 `id` 字段一致（除非使用 `dir` 字段做映射）。

### 2. 注册到首页列表

在 `src/data/games.json` 中添加条目：

```json
{
  "id": "<game-id>",
  "name": "游戏名称",
  "category": "分类",
  "description": "游戏描述",
  "icon": "/assets/games/<game-id>.png",
  "route": "/game/<game-id>",
  "recordType": "score"
}
```

> **`recordType` 可选值**：`"score"`（分数越高越好，默认）、`"time"`（时间越短越好）、`"boolean"`（完成/未完成）。首页排行榜会根据此字段决定排序方向。

**目录名与 `id` 不一致时**：在条目里增加 `"dir"` 字段，例如：

```json
{
  "id": "2048",
  "dir": "game2048",
  "name": "2048",
  ...
}
```

> `GameView.vue` 会自动读取 `dir` 字段加载对应目录，**无需再修改 GameView.vue**。
>
> 以下文件**已通用化，新游戏无需修改**：
>
> - `src/views/GameView.vue` — 组件动态加载、标题、主题 class、生命周期钩子均已自动适配
> - `src/router/index.ts` — 路由通配 `/game/:id` 及子路由 `/play` / `/settings` 已覆盖所有游戏

### 3. 容器布局约束

所有游戏必须使用 `GameContainer.vue` 作为外层容器。它提供统一的页面级 padding（左右 `clamp(14px, 3.5vw, 28px)`，顶部底部安全区域保护）和 3:4 宽高比约束（可通过 CSS 变量覆盖）。

```vue
<template>
  <GameContainer bg-class="my-game-bg">
    <div class="my-game">
      <!-- 游戏根容器 → 禁止 padding -->
      <!-- 游戏内容 -->
    </div>
  </GameContainer>
</template>

<script setup lang="ts">
import GameContainer from '../../components/GameContainer.vue'
</script>

<style scoped>
.my-game {
  height: 100%;
  display: flex;
  flex-direction: column;
  /* 注意：禁止自行添加 padding，由 GameContainer 统一控制 */
}
</style>
```

**游戏根容器禁止添加任何 padding**（包括 `padding-left`/`right`/`top`/`bottom`），间距统一由 `GameContainer.vue` 控制。

> `GameContainer` 提供背景层（`bg-image` / `bg-class` prop）和宽高比约束层（`.game-inner`，默认 3:4，可通过 `--gc-aspect-ratio` 覆盖）。
>
> 站点外部容器（`GameView.vue` 的 `.game-shell`）不做宽度约束。

#### 3.0.1 自定义背景

`GameContainer` 的 `bg-class` prop 只负责将 CSS 类名挂到 `.game-container` 和 `.game-bg` 上，**不负责定义具体样式**。具体背景样式必须在游戏自己的非 scoped CSS 中定义。

以 2048 为例，创建 `theme.css`（非 scoped import）：

```css
/* src/games/game2048/theme.css */
.theme-2048-surface {
  background: linear-gradient(...);
}
```

在组件中引入：

```vue
<script setup lang="ts">
import './theme.css'
</script>
```

> 使用非 scoped CSS 是因为 `bg-class` 作用于 `GameContainer` 内部的 DOM 元素，scoped 样式无法穿透。
>
> 也可使用 `bg-image` prop（传入图片 URL），不需要额外 CSS。

#### 3.0.2 背景装饰层（`#decoration` slot）

如果游戏需要浮动粒子、飘落元素等背景装饰，使用 `#decoration` 具名 slot 注入。装饰层渲染在 `game-bg` 之上、游戏内容之下（z-index 已处理好）。

```vue
<!-- src/games/reversi/index.vue -->
<template>
  <GameContainer bg-class="felt-bg">
    <template #decoration>
      <FloatingPieces />
    </template>
    <div class="play-inner">
      <!-- 游戏内容 -->
    </div>
  </GameContainer>
</template>

<script setup lang="ts">
import FloatingPieces from './components/FloatingPieces.vue'
import './theme.css'
</script>
```

> **禁止**直接修改 `GameContainer.vue` 来添加游戏特定的装饰。所有装饰通过 `bg-class`（背景色/纹理）或 `#decoration` slot（动态元素）由游戏自管理。
>
> 参考实现：`src/games/reversi/components/FloatingPieces.vue`

#### 自定义宽高比与间距

| 变量                  | 默认值                                   | 说明                                 |
| --------------------- | ---------------------------------------- | ------------------------------------ |
| `--gc-padding-top`    | `max(12px, env(safe-area-inset-top))`    | 顶部间距                             |
| `--gc-padding-right`  | `clamp(14px, 3.5vw, 28px)`               | 右侧间距                             |
| `--gc-padding-bottom` | `max(12px, env(safe-area-inset-bottom))` | 底部间距                             |
| `--gc-padding-left`   | `clamp(14px, 3.5vw, 28px)`               | 左侧间距                             |
| `--gc-aspect-ratio`   | `3 / 4`                                  | 内容区宽高比（设为 `none` 移除约束） |

### 3.1 容器查询（Container Queries）自适应

游戏内所有响应式样式**必须使用 CSS Container Queries**，禁止使用 `@media` 基于视口做游戏内布局适配。

**规则：**

1. **在内层容器上声明查询上下文**：

```css
.game-content {
  container-type: inline-size;
  container-name: game;
}
```

2. **使用 `cqw` / `cqh` 替代 `vw` / `vh`**：

```css
/* 错误：基于视口 */
padding: clamp(12px, 4vw, 20px);

/* 正确：基于容器 */
padding: clamp(12px, 4cqw, 20px);
```

3. **使用 `@container` 替代 `@media`**：

```css
/* 错误 */
@media (max-width: 520px) { ... }

/* 正确 */
@container game (max-width: 520px) { ... }
```

4. **棋盘/网格最大宽度用 `min()` 限制**，不再用 `clamp(..., 85vw, ...)`：

```css
/* 错误：基于视口 */
max-width: clamp(320px, 85vw, 520px);

/* 正确：填满容器，上限 520px */
max-width: min(100%, 520px);
```

**参考实现**：`src/games/chinese-chess/index.vue`（搜索 `container-type: inline-size` 可定位容器声明位置，全文使用 `cqw`/`cqh`/`@container`）和 `src/games/star-catcher/index.vue` / `Home.vue`。

5. **宽容器下重构布局，不止缩放**：

当容器宽度超过阈值时，部分 UI 元素应从「底部横排」变为「侧边竖排」，而非整体等比放大：

```css
/* 窄容器 ≤ 400px：底部横排 */
@container game (max-width: 400px) {
  .game-controls {
    flex-direction: row;
    justify-content: center;
    gap: 8cqw;
  }
}

/* 中等容器 400-700px：正常比例 */
@container game (min-width: 401px) and (max-width: 700px) {
  .game-controls {
    gap: 4cqw;
  }
}

/* 宽容器 ≥ 700px：侧边竖排 */
@container game (min-width: 701px) {
  .game-controls {
    flex-direction: column;
    position: absolute;
    right: 2cqw;
    top: 50%;
    transform: translateY(-50%);
    gap: 2cqw;
  }
}
```

> 具体断点值根据游戏实际内容确定，以上为参考示例。

### 3.2 跨端输入（Pointer Events）

使用 **Pointer Events** 统一处理触摸屏和鼠标输入，避免为 touch / mouse 分别注册事件：

```ts
const el = canvas.value
el.addEventListener('pointerdown', onPointerDown)
el.addEventListener('pointermove', onPointerMove)
el.addEventListener('pointerup', onPointerUp)
```

在 CSS 中禁用默认触摸行为以防止滚动干扰：

```css
.game-content {
  touch-action: none;
}
```

对于需要多点触控的游戏（如双指缩放），使用 `touch-action: manipulation` 或更细粒度的控制。

### 3.3 安全区域（Safe Area）

安全区域保护已由 `GameContainer.vue` 统一处理，**游戏内部无需关心** safe area：

```css
/* GameContainer.vue */
.game-container {
  padding-top: max(12px, env(safe-area-inset-top)); /* 顶部安全区域 */
  padding-bottom: max(12px, env(safe-area-inset-bottom)); /* 底部安全区域 */
}
```

> 如果游戏内部某个功能元素（如固定在底部的按钮）需要在 safe area 之上额外增加间距，只在该元素上追加所需 padding，不要重复处理 safe area。

### 4. 游戏首页设计

游戏首页（`Home.vue` / idle 页面）**不需要顶部导航栏/返回栏**。视觉主体推荐使用 logo/图标/特色元素，标题文字可选：

```html
<!-- 方式一：用 logo/图标作为视觉主体（推荐） -->
<div class="game-logo">
  <div class="logo-piece red">帥</div>
  <div class="logo-piece black">將</div>
</div>

<!-- 方式二：2048 风格，用游戏元素做 logo -->
<div class="logo-lockup">
  <div class="logo-row">
    <div class="logo-tile">2</div>
    <div class="logo-tile">0</div>
    <div class="logo-tile">4</div>
    <div class="logo-tile">8</div>
  </div>
</div>

<!-- 方式三：标题文字 + 图标组合（合理设计即可） -->
<h1 class="game-title">游戏名称</h1>
```

> 退出按钮必须融合游戏自身视觉风格，见下方「退出功能」章节。

### 5. 游戏生命周期注册（可选）

如果游戏需要在离开页面时执行清理（如停音乐、清定时器），使用 `useGameRouteLifecycle`：

```ts
import { useGameRouteLifecycle } from '../../composables/useGameRouteLifecycle'

const GAME_ID = '<game-id>'
const { registerCleanup } = useGameRouteLifecycle()
```

#### 5.1 页面离开清理

在游戏首页或 play 页面 `onMounted` 中注册：

```ts
onMounted(() => {
  // 启动副作用，例如背景音乐
  musicManager.play('01')
  // 注册 cleanup，GameView 会在真正离开游戏时自动调用
  registerCleanup(GAME_ID, () => musicManager.stop())
})
```

> 覆盖场景：返回站点首页、切换到其他游戏、浏览器后退导致 GameView 卸载。

### 6. 图片资源路径

```
src/games/<game-id>/assets/images/     # 游戏内部图片
public/assets/games/                    # 首页列表图标
```

### 7. 首页卡片分类配色规则

游戏卡片（`GameCard.vue`）根据 `category` 字段使用统一配色，**同一分类所有游戏共用同一颜色**，不按列表位置分配：

| 分类   | 卡片强调色         |
| ------ | ------------------ |
| `益智` | `#6366f1` (indigo) |
| `棋类` | `#f59e0b` (amber)  |
| 其他   | `#a78bfa` (purple) |

**规则：**

- PLAY 徽章（`.cyber-card-badge`）的 `background` 直接使用上述配色
- 新增游戏时，如果 `category` 已存在，自动使用已有颜色
- 如果新增一个未定义的分类，需要在此表和 `GameCard.vue` 的 `categoryColors` 中新增颜色

## 音效管理

游戏运行时通过 `src/utils/soundUtils.ts` 管理音频生命周期。

### AudioContext 生命周期

移动端浏览器限制 AudioContext 必须在用户交互后创建。`soundUtils` 自动处理此限制：

```ts
import { getCtx, retainCtx, releaseCtx, destroyCtx } from '../../utils/soundUtils'
import { useGameRouteLifecycle } from '../../composables/useGameRouteLifecycle'

const GAME_ID = '<game-id>'
const { registerCleanup } = useGameRouteLifecycle()

onMounted(() => {
  retainCtx()
  // 启动音效...
  registerCleanup(GAME_ID, () => {
    destroyCtx()
  })
})
```

- `retainCtx` / `releaseCtx` **必须成对调用**（常规引用计数管理）
- `destroyCtx()` 用于游戏退出时的**强制彻底清理**（无视引用计数，立即关闭 AudioContext），推荐在 `registerCleanup` 中使用
- AudioContext 在首次用户交互后自动 `resume()`
- 多游戏共享同一 AudioContext，引用计数归零时自动销毁

### 播放音效

```ts
import { getCtx } from '../../utils/soundUtils'

function playTone() {
  const ctx = getCtx()
  if (!ctx) return
  const osc = ctx.createOscillator()
  osc.type = 'sine'
  osc.frequency.value = 440
  osc.connect(ctx.destination)
  osc.start()
  osc.stop(ctx.currentTime + 0.1)
}
```

`soundUtils` 也提供便捷方法 `osc(freq, duration, type, volume, startOffset)` 用于快速播放振荡器音效。

### 清理规则

- 所有音效必须在游戏退出前停止（通过 `registerCleanup` 注册）
- 长时间播放的背景音乐使用独立 `AudioBufferSourceNode`，退出时 `stop()`
- 始终通过 `getCtx()` 获取共享实例，禁止创建多个 AudioContext
- 游戏退出时调用 `destroyCtx()` 确保 AudioContext 被强制关闭，避免泄漏

## 状态持久化

游戏状态通过 Tauri 原生存储（Rust 后端）持久化，浏览器环境自动回退到 localStorage。

### 后端命令

Rust 提供三个 Tauri 命令：

| 命令               | 参数             | 说明                            |
| ------------------ | ---------------- | ------------------------------- |
| `save_game_state`  | `game_id, state` | 保存状态（JSON 字符串）         |
| `load_game_state`  | `game_id`        | 加载状态，返回 `Option<String>` |
| `clear_game_state` | `game_id`        | 清除状态                        |

### 前端使用

```ts
import { saveGameState, loadGameState } from '../../stores/gameStorage'

await saveGameState('reversi', { board, score, currentPlayer })

const state = await loadGameState<{ board: any; score: number }>('reversi')
if (state) {
  board.value = state.board
}
```

`gameStorage.ts` 自动处理 Tauri / 浏览器回退，游戏代码无需关心底层。

### 存档时机

| 时机            | 说明                                       |
| --------------- | ------------------------------------------ |
| play 页面退出时 | 保存游戏进度，下次可继续                   |
| 游戏结束时      | 保存最终结果（排行榜）                     |
| 应用切后台时    | `visibilitychange` / `beforeUnload` 中保存 |

## 游戏性能优化

移动端 GPU/CPU 资源有限，遵循以下准则保证 60fps 流畅运行。

### 动画与渲染

- **优先使用 `transform` 和 `opacity`**——仅触发合成，不触发布局（Layout）和绘制（Paint）
- **禁止直接操作 `offsetTop`/`offsetLeft`/`scrollTop`**——触发强制回流（Forced Reflow），需批量读取后在下一帧写入
- **使用 `requestAnimationFrame`** 驱动游戏循环，替代 `setInterval`

```ts
function gameLoop(timestamp: number) {
  const dt = timestamp - lastTime
  lastTime = timestamp
  update(dt)
  render()
  requestAnimationFrame(gameLoop)
}
requestAnimationFrame(gameLoop)
```

### CSS 注意事项

- 动画元素使用 `will-change: transform` 或 `will-change: opacity` 提前通知浏览器
- 避免在 `@container` 块中修改容器自身尺寸
- Container Queries 性能良好，但避免过多查询条件嵌套

### 内存管理

- 定时器/事件监听通过 `registerCleanup` 注册，游戏退出自动清理
- Canvas 2D 每帧避免创建新对象，使用对象池复用
- AudioContext 使用后必须 `releaseCtx()`，防止泄漏

## 图片生成

使用 `skill comfyui-image` 生成图片。

生成步骤：

1. 加载 `skill comfyui-image`，按 skill 指引生成图片，返回访问 URL
2. 通过 `curl -o <本地路径> <URL>` 下载到项目对应目录
3. 不同类型图片的保存路径：

| 图片用途     | 路径                                 |
| ------------ | ------------------------------------ |
| 游戏内部图片 | `src/games/<game-id>/assets/images/` |
| 首页列表图标 | `public/assets/games/`               |

参数：

- `prompt` (必填) — 英文文本描述
- `seed` (可选) — 随机种子
- `steps` (可选, 默认 8) — 采样步数
- `width`/`height` (可选, 默认 1024) — 图片尺寸

> \*\*重要：必须逐张生成，每次只调用一次，等待返回后再生成下一张。禁止批量或并行调用，否则会撑爆本地 ComfyUI 的显存。

## 音乐/音效生成

使用 `skill comfyui-audio` 生成音乐或音效。

生成步骤：

1. 加载 `skill comfyui-audio`，按 skill 指引生成音频，返回访问 URL
2. 通过 `curl -o <本地路径> <URL>` 下载到项目对应目录
3. 保存路径：`src/games/<game-id>/assets/audio/`

## 图片分析（UI 校验）

分析界面截图、设计稿时始终使用 `skill vision`（OpenAI Vision）。

### 调用规则

- **严格序列执行**：所有请求必须一个一个排队，**禁止任何形式的并行/并发调用**（包括不同图片之间）
- **全局间隔**：任意两次分析请求之间必须**等待至少 5 秒**（包括失败重试后的请求）
- **超时时间**：**300 秒**
- 遇到 429 限流时，等待当前响应返回后，间隔 10 秒再重试
- 最多重试 **5 次**
- 5 次全部失败后，跳过该图片继续处理下一张

### 分析重点

优先关注以下方面（按重要性排序）：

1. **界面布局效果** — 元素对齐、间距、边距是否合理
2. **文字可读性** — 对比度、字号、字体是否清晰
3. **背景干扰** — 纹理/图案是否影响前景内容阅读
4. **视觉层次** — 主次信息是否分明，重点是否突出

### 浏览器测试

UI 校验时的浏览器操作（`skill browser-automation`）：

- 使用手机模拟模式：`node scripts/browser.js set-viewport --width 430 --height 932` 设置（`deviceScaleFactor=3, isMobile=true` 已内置于脚本）
- 导航后等待 1-2 秒确保页面渲染完成再截图
- 如需验证实际 CSS 值，使用 `node scripts/browser.js evaluate --code <js代码>` 检查 computed style
- 相邻页面跳转间等待至少 1 秒
