# 游戏开发指南

## 跨设备适配策略

游戏需覆盖 **手机竖屏、iPad（横/竖屏）、PC 宽屏** 三种场景。采用分层适配策略：

| 层级 | 适配方式 | 职责 |
|------|---------|------|
| 外层容器（`.game-page`） | `height: 100%; width: 100%` | 填满视口，无约束 |
| 内容容器（`.game-content`） | `aspect-ratio` + `max-width` + 居中 | 固定宽高比，letterbox 留白 |
| 游戏内部 UI | Container Queries、`cqw`/`cqh` | 响应式缩放与布局重构 |

**核心思路**：外层自适应不做约束，内层按游戏类型选择宽高比居中显示。宽屏 PC 两侧留白是正常行为。游戏内部通过 Container Queries 感知容器尺寸，在不同档位下调整布局和字号。

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

### 3. 容器布局约束

游戏统一使用**双层容器结构**：外层全屏背景层 + 内层宽高比约束层。

```html
<div class="game-page">           <!-- 外层：全屏背景 -->
  <div class="game-content">      <!-- 内层：宽高比约束 -->
    <!-- 游戏内容 -->
  </div>
</div>
```

**各层职责**：

| 层 | CSS | 说明 |
|----|-----|------|
| 外层（背景） | `height: 100%; width: 100%; overflow: hidden; position: relative` | 覆盖全屏，放置背景图/渐变/CSS 变量 |
| 内层（约束） | `height: 100%; aspect-ratio: X / Y; max-width: 100%; margin: 0 auto` | 约束内容宽高比，居中显示 |

> 站点外部容器（`GameView.vue` 的 `.game-shell`）不做宽度约束。

**宽高比必须在开发前与用户确认**，预设选项：

| 比例 | 适用场景 | 游戏类型举例 |
|------|---------|-------------|
| `9 / 16` | 竖屏手机（默认推荐） | 2048、记忆翻牌、竖向卷轴 |
| `3 / 4` | iPad / 通用折中 | 大屏适配的通用方案 |
| `1 / 1` | 方形棋盘 | 象棋、围棋 |
| `16 / 9` | 横屏游戏 | 弹球、射击、赛车 |

内层容器用 `:style` 绑定实现动态宽高比：

```vue
<template>
  <div class="play-page">
    <div class="play-inner" :style="{ aspectRatio: '9 / 16' }">
      <!-- 游戏内容 -->
    </div>
  </div>
</template>

<style scoped>
.play-page {
  height: 100%;
  width: 100%;
  overflow: hidden;
  position: relative;
  /* 背景在此定义 */
}
.play-inner {
  height: 100%;
  max-width: 100%;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
}
</style>
```

> 参考 `src/games/chinese-chess/index.vue` 中 `.play-page` / `.play-inner` 和 `Home.vue` 中 `.home-page` / `.home` 的实现（搜索 `position: relative; /* 背景在此定义 */` 可快速定位）。

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

在刘海屏/圆角屏设备上，外层容器需要适配安全区域：

```css
.play-page {
  padding-top: env(safe-area-inset-top, 0px);
  padding-bottom: env(safe-area-inset-bottom, 0px);
  padding-left: env(safe-area-inset-left, 0px);
  padding-right: env(safe-area-inset-right, 0px);
}
```

> 安全区域加在**外层容器**（`.play-page`），而不是内层内容容器。内层宽高比约束层的 padding 会破坏布局计算。

### 4. 游戏首页标题去重

游戏首页（`Home.vue` / idle 页面）**不应直接显示游戏标题**，建议使用 logo/图标作为视觉主体：

```html
<!-- 错误：标题重复 -->
<h1>中国象棋</h1>

<!-- 正确：用 logo/图标 作为视觉主体 -->
<div class="game-logo">
  <div class="logo-piece red">帥</div>
  <div class="logo-piece black">將</div>
</div>
```

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

### 6. 无需修改的文件

以下文件**不再需要手动编辑**（自动适配）：

- `src/views/GameView.vue` — 组件动态加载、标题、主题 class、生命周期钩子均已通用化
- `src/router/index.ts` — 路由通配 `/game/:id` 及子路由 `/play` / `/settings` 已覆盖所有游戏

### 7. 图片资源路径

```
src/games/<game-id>/assets/images/     # 游戏内部图片
public/assets/games/                    # 首页列表图标
```

### 8. 首页卡片分类配色规则

游戏卡片（`GameCard.vue`）根据 `category` 字段使用统一配色，**同一分类所有游戏共用同一颜色**，不按列表位置分配：

| 分类 | 卡片强调色 | 图标渐变 |
|------|-----------|---------|
| `益智` | `#6366f1` (indigo) | `linear-gradient(135deg, #4f46e5, #6366f1)` |
| `棋类` | `#f59e0b` (amber) | `linear-gradient(135deg, #d97706, #f59e0b)` |
| 其他 | `#a78bfa` (purple) | `linear-gradient(135deg, #7c3aed, #a78bfa)` |

**规则：**
- 卡片分类文字（`.cyber-card-category`）和 PLAY 徽章（`.cyber-card-badge`）使用 `--neon-color` CSS 变量，值来自上述配色
- 新增游戏时，如果 `category` 已存在，自动使用已有颜色
- 如果新增一个未定义的分类，需要在此表和 `GameCard.vue` 的 `categoryColors` 中新增颜色

## 图片生成

使用 `skill comfyui-image` 生成图片。

生成步骤：
1. 加载 `skill comfyui-image`，按 skill 指引生成图片，返回访问 URL
2. 通过 `curl -o <本地路径> <URL>` 下载到项目对应目录
3. 不同类型图片的保存路径：

| 图片用途 | 路径 |
|---------|------|
| 游戏内部图片 | `src/games/<game-id>/assets/images/` |
| 首页列表图标 | `public/assets/games/` |

参数：
- `prompt` (必填) — 英文文本描述
- `seed` (可选) — 随机种子
- `steps` (可选, 默认 8) — 采样步数
- `width`/`height` (可选, 默认 1024) — 图片尺寸

> **重要：必须逐张生成，每次只调用一次，等待返回后再生成下一张。禁止批量或并行调用，否则会撑爆本地 ComfyUI 的显存。

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
