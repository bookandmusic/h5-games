# Campus Journey (Single Doc)

本文件作为本游戏“范围基线 + 实现现状 + 对照口径”的单一真相文档。

相关文档：

- 回归与手测：`docs/campus-journey/VERIFICATION.md`
- 资源补图规范：`docs/campus-journey/ASSET-GUIDE.md`

## 1. 产品目标

`Campus Journey` 是围绕“成长路线选择”的轻剧情放置游戏。

玩家从高中开始，通过放置任务、主动点击、任务内冲刺、技能升级和关键节点小游戏推进人生。升学考试决定先进入大学路线还是打工路线，但两条路线最终都会汇入经营阶段，并在通关后进入补完与长期赚钱循环。

## 2. V1 范围 (TODO/Done)

以下清单即 V1 的验收口径。完成的标注为已完成。

- [x] 高中阶段主循环
- [x] 升学考试节点
- [x] 大学路线中期内容
- [x] 打工路线中期内容
- [x] 经营阶段后期内容（`business` + `postgame`）
- [x] 点击加速（点击缩时）
- [x] 任务内冲刺
- [x] 5 个核心技能
- [x] 3 个小游戏
- [x] 15 到 18 张首发皮肤（当前：17）
- [x] 图鉴与通关后补完商店
- [x] 本地存档
- [x] 自动化回归测试

V1 不做（Non-Goals）：

- 男女双主角 / 多主角
- 二周目继承
- 多结局评分系统
- 复杂剧情树
- 额外长线货币

## 3. 实现现状与代码入口

代码目录：`src/games/campus-journey/`

关键入口：

- 入口组件：`src/games/campus-journey/index.vue`
- 运行时状态与操作：`src/games/campus-journey/store.ts`
- 纯状态变更：`src/games/campus-journey/reducers.ts`
- 进度与规则：`src/games/campus-journey/progression.ts`
- 内容配置：`src/games/campus-journey/tasks.ts`、`src/games/campus-journey/skills.ts`、`src/games/campus-journey/skins.ts`、`src/games/campus-journey/events.ts`、`src/games/campus-journey/minigames.ts`
- 类型基线：`src/games/campus-journey/types.ts`
- 存档：`src/games/campus-journey/save.ts`
- 资源映射：`src/games/campus-journey/assetMap.ts`（通过 `import.meta.glob` 扫描 PNG，并以文件名作为 key）

## 4. 对照口径 (Code/Tests)

“是否符合 V1 范围”以两件事为准：

1. 上面的 V1 TODO 清单是否全为完成
2. 是否能通过本游戏的专用回归（见 `VERIFICATION.md`）

建议命令：

```bash
npm run test:run -- src/games/campus-journey/store.test.ts src/games/campus-journey/stateflow.test.ts src/games/campus-journey/pacing.test.ts src/games/campus-journey/balance.test.ts
```

## 5. 资源补图与盘点

- 补图复用风格与模板：`docs/campus-journey/ASSET-GUIDE.md`

资源盘点不要依赖静态文档快照，直接从目录即时生成：

```bash
find src/games/campus-journey/assets/imgs -type f -name "*.png" | sort
```

按分类查看：

```bash
ls -1 src/games/campus-journey/assets/imgs/backgrounds | sort
ls -1 src/games/campus-journey/assets/imgs/ui | sort
ls -1 src/games/campus-journey/assets/imgs/events | sort
find src/games/campus-journey/assets/imgs/minigames -type f -name "*.png" -maxdepth 2 | sort
ls -1 src/games/campus-journey/assets/imgs/skins | sort
```

排查疑似中间产物（例如双扩展名）：

```bash
find src/games/campus-journey/assets/imgs -type f -name "*.png.png" | sort
```
