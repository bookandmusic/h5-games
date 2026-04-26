# Campus Journey 验证说明

本文档只描述 `Campus Journey` 当前实现的本地验证入口与覆盖范围。

## 1. 推荐命令

### 1.1 游戏专用回归

```bash
npm run test:run -- src/games/campus-journey/store.test.ts src/games/campus-journey/stateflow.test.ts src/games/campus-journey/pacing.test.ts src/games/campus-journey/balance.test.ts
```

用途：

- 校验任务解锁与事件触发
- 校验考试分支与小游戏奖励回写
- 校验 business / postgame / 商店开启链路
- 校验失败惩罚、惩罚恢复与 store 副作用
- 校验主动点击与挂机节奏差
- 校验关键平衡阈值

### 1.2 类型检查

```bash
npm run type-check
```

用途：

- 校验 Vue 组件接口
- 校验 `store.ts` / `reducers.ts` / `progression.ts` 类型约束
- 防止调参时破坏组件 props 与状态字段

## 2. 当前测试文件

### `src/games/campus-journey/balance.test.ts`

覆盖：

- 开局资金是否足够买到首层技能
- 正常备考链路下考试通过率是否可信
- 大学线 / 打工线进入 `business` 的可达性
- 冲刺触发频率是否过高
- postgame 皮肤价格上限

### `src/games/campus-journey/pacing.test.ts`

覆盖：

- 主动点击相对挂机是否有优势
- 主动玩法是否过强到打穿放置主循环
- 大学线 / 打工线中期任务时长是否仍在同一量级

### `src/games/campus-journey/stateflow.test.ts`

覆盖：

- 高中进入考试阶段
- 考试小游戏加成与考试分支
- `business -> postgame -> 商店开启`
- 存档恢复后的惩罚、皮肤、小游戏分数

### `src/games/campus-journey/store.test.ts`

覆盖：

- 初始事件队列
- 任务失败后的惩罚窗口
- 惩罚结束后的重新开工
- 小游戏奖励回写到 store
- 考试通过事件排队与结算

## 3. 手测优先项

当前自动化测试已覆盖状态机主链路，但仍建议在每轮较大改动后补以下手测：

1. 首页进入后，任务倒计时是否持续刷新。
2. 失败任务后，是否出现恢复中状态且无法立即开启下一任务。
3. 高中推进到考试后，`Exam Rush` 是否可打开并回写通过率加成。
4. 大学线与打工线都能进入 `business`。
5. 首次完成 `biz-auto-profit` 后，是否进入 `postgame` 并打开补完商店。
6. 刷新页面或重进游戏后，任务态、惩罚态、皮肤装备与小游戏 best score 是否恢复。

## 4. 适用场景

以下改动后，必须至少运行一次本游戏专用回归命令：

- 修改任务数值
- 修改考试公式
- 修改事件条件
- 修改 business / postgame 条件
- 修改小游戏奖励回写
- 修改存档字段

推荐直接使用第 1.1 节命令。

以下改动后，建议同时运行 `npm run type-check`：

- 修改组件 props
- 修改 `types.ts`
- 修改 `store.ts`
- 修改 `reducers.ts`
- 修改 `progression.ts`
