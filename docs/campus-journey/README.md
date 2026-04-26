# Campus Journey

`Campus Journey` 的实现与验证文档放在这个目录，内容以当前仓库代码为准（`src/games/campus-journey/`）。

## 文档索引

- [PROJECT.md](./PROJECT.md)
  单文档：范围基线 + 实现现状 + 对照口径（带 TODO/Done）
- [VERIFICATION.md](./VERIFICATION.md)
  本地验证与回归说明
- [ASSET-GUIDE.md](./ASSET-GUIDE.md)
  资源补图规范（仅用于补图复用风格，不参与范围验收）
- [DATA.md](./DATA.md)
  数据汇总（当前仅维护任务按类型分组后的时长）

## 当前状态

`Campus Journey` 当前已经完成可玩主链路：

- 高中 -> 升学考试 -> 大学 / 打工 -> business -> postgame
- 点击缩时、任务内冲刺、3 个小游戏
- 17 张皮肤图鉴与通关后补完商店
- 本地存档
- 自动化回归测试

若要判断“现在该看什么文档”：优先看 [PROJECT.md](./PROJECT.md) 与 [VERIFICATION.md](./VERIFICATION.md)。

## 本地验证

当前不在全局 `package.json` 中增加 `Campus Journey` 专用脚本。

需要验证本游戏时，直接运行：

```bash
npm run test:run -- src/games/campus-journey/store.test.ts src/games/campus-journey/stateflow.test.ts src/games/campus-journey/pacing.test.ts src/games/campus-journey/balance.test.ts
```

类型检查：

```bash
npm run type-check
```

代码检查还需要执行 `lint`：

```bash
npm run lint
```

所有检查完成后，执行 `format` 统一格式化：

```bash
npm run format
```

更多覆盖范围与手测建议见 [VERIFICATION.md](./VERIFICATION.md)。
