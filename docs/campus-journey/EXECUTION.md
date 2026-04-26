# Campus Journey 开发执行文档

## 1. 执行目标

将 `PLAN.md` 落为可开发的模块结构、状态模型和迭代顺序。

本项目优先级：

1. 先保证主循环、路线切换和通关后可玩。
2. 再保证小游戏和皮肤补完接入稳定。
3. 最后补视觉表现和事件文案量。

## 2. 建议目录结构

- `src/games/campus-journey/`
- `src/games/campus-journey/index.vue`
- `src/games/campus-journey/types.ts`
- `src/games/campus-journey/store.ts`
- `src/games/campus-journey/phases.ts`
- `src/games/campus-journey/tasks.ts`
- `src/games/campus-journey/skills.ts`
- `src/games/campus-journey/skins.ts`
- `src/games/campus-journey/events.ts`
- `src/games/campus-journey/minigames.ts`
- `src/games/campus-journey/utils/`
- `src/games/campus-journey/components/`

建议组件：

- `StatusHeader.vue`
- `CharacterStage.vue`
- `TaskPanel.vue`
- `SprintPanel.vue`
- `SkillPanel.vue`
- `StoryPanel.vue`
- `SkinGallery.vue`
- `MiniGameExamRush.vue`
- `MiniGameWorkRush.vue`
- `MiniGameBusinessRush.vue`

## 3. 数据结构

### 3.1 主状态

```ts
type RouteId = 'none' | 'college' | 'work'
type PhaseId =
  | 'highschool'
  | 'exam'
  | 'college'
  | 'work'
  | 'business'
  | 'postgame'

type MiniGameId = 'exam-rush' | 'work-rush' | 'business-rush'

type PlayerState = {
  level: number
  exp: number
  money: number
  knowledge: number
  reputation: number
  route: RouteId
  phase: PhaseId
  graduatedCollege: boolean
  currentTaskId: string | null
  currentTaskStartedAt: number | null
  currentTaskEndsAt: number | null
  currentTaskSprintCharge: number
  currentTaskSprintActiveUntil: number | null
  currentTaskClickChain: number
  unlockedTaskIds: string[]
  unlockedSkinIds: string[]
  ownedSkinIds: string[]
  equippedSkinId: string | null
  skillLevels: Record<SkillId, number>
  flags: Record<string, boolean>
  examHistory: {
    entranceExamTaken: boolean
    entranceExamPassed: boolean | null
    prepProgress: number
    lastExamBonus: number
  }
  minigameStats: Record<MiniGameId, {
    bestScore: number
    playCount: number
  }>
  meta: {
    version: number
    mainStoryCleared: boolean
    collectionCompleted: boolean
  }
}
```

### 3.2 任务定义

```ts
type TaskCategory =
  | 'study'
  | 'exam-prep'
  | 'campus'
  | 'parttime'
  | 'work'
  | 'business'
  | 'recovery'

type RewardSet = {
  exp?: number
  money?: number
  knowledge?: number
  reputation?: number
}

type TaskDefinition = {
  id: string
  name: string
  category: TaskCategory
  phase: PhaseId[]
  route?: RouteId[]
  durationSec: number
  baseSuccessRate: number
  successRewards: RewardSet
  failRewards?: RewardSet
  failPenaltySec?: number
  sprintChargePerClick: number
  sprintDurationSec: number
  sprintProgressMultiplier: number
  sprintSuccessBonus: number
  affectedBySkills: SkillId[]
  unlockRequirements?: string[]
}
```

### 3.3 技能定义

```ts
type SkillId = 'study' | 'focus' | 'action' | 'social' | 'business'

type SkillDefinition = {
  id: SkillId
  name: string
  description: string
  maxLevel: number
  baseCost: number
  costCurve: number[]
}
```

### 3.4 皮肤定义

```ts
type SkinRoute = 'common' | 'college' | 'work' | 'business'

type SkinDefinition = {
  id: string
  name: string
  phase: 'highschool' | 'college' | 'work' | 'business'
  route: SkinRoute
  rarity: 'common' | 'rare'
  image: string
  cardImage: string
  shadowImage: string
  unlockType: 'story' | 'task' | 'exam' | 'money'
  unlockRequirement?: string
  buyPrice?: number
}
```

### 3.5 小游戏定义

```ts
type MiniGameDefinition = {
  id: MiniGameId
  name: string
  rewardFormula: string
  unlockRequirements: string[]
}
```

## 4. 核心系统拆分

### 4.1 主循环系统

职责：

- 启动任务
- 推进倒计时
- 接收点击缩时
- 处理冲刺状态
- 触发结算
- 发放奖励并更新阶段条件

### 4.2 任务结算系统

需要独立封装：

- 最终成功率计算
- 成功奖励发放
- 失败奖励发放
- 失败额外耗时结算
- 备考进度累计

### 4.3 点击与冲刺系统

规则：

- 点击直接影响剩余时长
- 点击同时累积 `currentTaskSprintCharge`
- 达到阈值后可激活冲刺
- 冲刺只影响当前任务
- 任务结束后冲刺相关状态清空

### 4.4 考试系统

需要实现：

- 考试通过率计算器
- 考试小游戏加成结算
- route 切换
- 升学失败保底进入 work 路线

### 4.5 路线差异系统

需要实现：

- 高中毕业进入 work 的初始岗位
- 大学毕业进入 business/work 的更高起点
- 收益系数差异
- business 解锁门槛差异

### 4.6 图鉴与补完商店

需要实现：

- 已解锁
- 已拥有未装备
- 未获得可补买
- 未获得且尚未开放补买

### 4.7 小游戏系统

3 个小游戏共用一套基础协议：

- 进入条件
- 开始 / 结束
- 结算得分
- 奖励回写主状态
- 保存 best score

## 5. 页面结构

首页建议分为 7 区：

1. 状态栏
2. 角色展示
3. 当前任务卡
4. 冲刺与点击区
5. 技能区
6. 剧情 / 阶段提示区
7. 图鉴 / 小游戏入口区

阶段弹窗用于：

- 月考提醒
- 升学考试
- 路线结果
- business 解锁
- 主线通关

## 6. 状态流转

### 6.1 高中到考试

- 初始进入 `highschool`
- 完成指定新手任务后开放全部高中任务
- 备考进度与知识值达阈值后进入 `exam`

### 6.2 考试到中期路线

- 结算考试通过率
- 通过则进入 `college`
- 失败则进入 `work`

### 6.3 中期路线到 business

进入 `business` 的推荐条件：

- `college` 路线：完成指定大学关键事件，且声望 >= 90
- `work` 路线：完成指定职业跃迁事件，且声望 >= 120

### 6.4 business 到 postgame

- 完成第一次 business 里程碑后记为主线通关
- 主线通关后进入 `postgame`
- postgame 不关闭 business 内容，只额外开放补完商店

## 7. 任务池落地建议

### 7.1 高中阶段

- `study-class`
- `study-notes`
- `study-review`
- `study-mock-exam`
- `recover-rest`

### 7.2 大学阶段

- `college-class`
- `college-library`
- `college-lab`
- `college-project`
- `college-competition`

### 7.3 打工阶段

- `work-store`
- `work-restaurant`
- `work-delivery`
- `work-training`
- `work-overtime`

### 7.4 经营阶段

- `biz-orders`
- `biz-team`
- `biz-sales`
- `biz-auto-profit`

## 8. 事件节点

V1 至少包含：

1. 入学起步
2. 第一次月考
3. 模拟考提醒
4. 升学考试
5. 升学成功
6. 升学失败进入工作
7. 大学成果
8. 工作晋升
9. business 开启
10. 主线通关
11. 图鉴补完开启

## 9. 开发顺序

### 9.1 第一阶段：骨架

- 建立页面路由
- 建立 store
- 建立状态栏和任务区

验收：

- 页面可进入
- 基础状态可显示

### 9.2 第二阶段：任务闭环

- 任务配置
- 开始任务
- 自动倒计时
- 成功 / 失败结算

验收：

- 能完整跑通至少 5 个高中任务

### 9.3 第三阶段：点击与冲刺

- 点击缩时
- 点击衰减
- 充能累积
- 冲刺激活

验收：

- 点击和冲刺都能显著缩短任务耗时

### 9.4 第四阶段：考试与分支

- 备考进度
- 考试小游戏
- route 切换

验收：

- 升学考试能稳定导向 `college` 或 `work`

### 9.5 第五阶段：双路线中期

- 大学任务池
- 打工任务池
- 路线差异系数

验收：

- 两条路线都能进入 business 条件

### 9.6 第六阶段：经营与通关后

- business 任务池
- 主线通关判定
- postgame 商店

验收：

- 通关后仍可继续游玩并补买皮肤

### 9.7 第七阶段：皮肤与 3 个小游戏

- 图鉴接入
- 皮肤装备
- `exam-rush`
- `work-rush`
- `business-rush`

验收：

- 所有小游戏奖励都能正确回写

## 10. 测试重点

### 10.1 数值测试

- 点击收益是否过高
- 冲刺是否压过正常挂机价值
- 两条路线主线通关时长是否接近

### 10.2 状态测试

- 切阶段时任务状态是否清空
- 冲刺状态是否会跨任务残留
- 皮肤解锁和购买是否重复发放

### 10.3 存档测试

- 旧版本存档迁移
- business / postgame 边界恢复
- 小游戏 best score 恢复

## 11. 最终验收

1. 从高中到 postgame 的全链路可跑通。
2. 3 个小游戏都可用，并且奖励正确。
3. 升学考试存在明确上限与下限概率。
4. 高中毕业与大学毕业进入工作体系时存在可感知差异。
5. 17 张左右首发皮肤具备明确解锁和补买路径。
