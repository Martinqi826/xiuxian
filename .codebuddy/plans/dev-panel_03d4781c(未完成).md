---
name: dev-panel
overview: 为 index.html 修仙游戏新增可视化 Dev 面板（右上角 🛠 常驻按钮触发），覆盖修为/灵石/寿元自定义、一键突破、满状态、解锁全道具、秘境跳层、全自动循环、战斗倍速、存档导入导出，加速研发期内容验证。
todos:
  - id: dev-skeleton
    content: 在 index.html 顶部新增 DEV_MODE 开关、DEV 命名空间骨架、CSS 样式与右上角 🛠 浮动按钮入口
    status: pending
  - id: dev-panel-ui
    content: 构建右侧抽屉 DOM：分组折叠的数值/境界/解锁/秘境/自动/倍速/存档七大区块
    status: pending
    dependencies:
      - dev-skeleton
  - id: dev-value-realm
    content: 实现数值速改与境界穿梭：setCult/setStone/setLife/fullHeal/clearDebuff/jumpRealm，含寿元同步与战斗中保护
    status: pending
    dependencies:
      - dev-panel-ui
  - id: dev-unlock-dungeon
    content: 实现内容解锁与秘境穿梭：unlockAll(tech/equip/item) 与 enterDungeon/clearDungeon，复用 addItem 与 dungeonNextFloor
    status: pending
    dependencies:
      - dev-panel-ui
  - id: dev-auto-loop
    content: 使用 [subagent:code-explorer] 梳理动作函数副作用，扩展 AUTO 增加 loop 模式与倍速 setSpeed，改造 autoTick 行 2283 达标分支实现全自动突破闭环
    status: pending
    dependencies:
      - dev-panel-ui
  - id: dev-save-polish
    content: 实现存档导入导出/重置/重载、toast 反馈与统一 log 前缀，所有写操作收敛到 refresh+saveGame，自测全部按钮
    status: pending
    dependencies:
      - dev-value-realm
      - dev-unlock-dungeon
      - dev-auto-loop
---

## 用户需求

研发期需要快速体验游戏全部内容并实现全面自动化。抛弃指令式控制台，改为**可视化 Dev 面板**，点按钮即生效。

## 产品概述

在 `index.html` 右上角常驻一枚 🛠 浮动按钮，点击展开侧抽屉式 Dev 面板，集中提供数值修改、境界突破、状态恢复、内容解锁、秘境穿梭、全自动循环、战斗倍速、存档管理等研发期专用工具。通过顶部 `DEV_MODE` 常量一键关闭，发布版本零侵入。

## 核心功能

1. **数值速改**：修为 / 灵石 / 寿元 一键拉满或输入自定义数值；满血满道心、清除战斗负面（shield、skillCd）
2. **境界穿梭**：下拉选择任意境界一键直达，自动跳过渡劫流程并补齐对应寿元
3. **内容解锁**：一键把全部 `TECHS` 神通、`EQUIPS` 装备、`ITEMS` 丹药 / 材料塞入背包；切换 `ROOTS` 灵根
4. **秘境穿梭**：下拉选择任意秘境与目标层数，一键传送到指定层；或一键判定通关发奖
5. **全自动循环**：扩展现有 `AUTO` 引擎新增 `loop` 模式，串联 闭关→自动突破→历练→秘境→自动炼丹，达标自动突破不再停手
6. **战斗倍速**：1x / 2x / 5x / 10x 实时切换 `AUTO.interval`，作用于自动战斗 tick
7. **存档管理**：导出 JSON 文本 / 粘贴导入 / 一键重置 / 重载当前存档
8. **可视效果**：右侧抽屉古风风格，与现有 `.panel` 同色系；分组折叠；操作后立即 `refresh()` + Toast 反馈

## 技术栈

延续 `index.html` 单文件原生 JS + 内联 CSS，零依赖、零外部资源。Dev 面板 DOM 与脚本全部追加在文件末尾，主体逻辑零侵入。

## 实现策略

### 总体思路

新增独立 `DEV` 命名空间封装全部研发期能力，对 `P` 对象**只调用现有公共 API**（`gainCult / addItem / heal / refresh / saveGame / startBattle / dungeonNextFloor` 等），避免重写业务逻辑导致与正式玩法漂移。面板通过浮动按钮触发右侧抽屉显示，单一 `DEV_MODE` 常量控制全部 DOM 与快捷键的注册。

### 关键技术决策

- **不动存档结构**：所有改动作用于运行时 `P`，再调 `saveGame(true)` 静默落盘，沿用现有 `loadGame()` 字段迁移；导出导入直接走 `localStorage.xiuxian_save` 文本，零格式发明。
- **境界穿梭走数据而非函数**：直接设 `P.realmIdx = 目标 idx` + `P.cult = REALMS[idx][1]` + `P.lifespan = LIFESPAN[idx]`，跳过 `actBreakthrough` 的概率判定与 `startTribulation` 的渡劫流程；这是研发期诉求，无需走正式数值链。
- **全自动循环复用 AUTO 引擎**：在 `AUTO.mode` 增加 `"loop"` 枚举，改造 `autoTick()` 行 2283 的"达标停手"分支——`loop` 模式下改为自动调 `actBreakthrough` + 失败则嗑破障丹重试；新增秘境/炼丹优先级判定，避免新建 timer 导致双循环。
- **战斗倍速**：仅改 `AUTO.interval` 并 `clearInterval` + 重建，不改业务 tick；非自动模式无效，符合预期。
- **秘境穿梭**：直接构造 `P.curDungeon = {def: DUNGEONS[i], floor: 目标层-1}` 后调 `dungeonNextFloor()`，复用现有奖励与首通逻辑。
- **解锁全部**：遍历 `Object.keys(TECHS/EQUIPS/ITEMS)` 调 `addItem`，神通另设 P.knownTechs 集合若不存在则装备到 `P.tech`。

### 性能与可靠性

- 面板 DOM 仅在首次打开时构建（懒加载），关闭时 `display:none` 不销毁；下拉项基于常量数组一次性渲染。
- 所有写操作末尾统一调 `refresh()` + `saveGame(true)`，集中防遗漏；toast 用单 div 复用避免堆积。
- 倍速最低 100ms 设硬下限，防止 tick 过密锁死浏览器。
- 全自动循环每轮检查 `alive(P)` 与 `P.inBattle`，沿用现有低血保护与逃跑 AI，blast radius 局限在 `autoTick`。

## 实现要点（防回归）

- **零侵入开关**：顶部 `const DEV_MODE = true;` 一行控制，发布前改 false 即彻底不渲染按钮、不绑快捷键、不暴露 `window.DEV`。
- **不破坏现有 AUTO**：仅在 `autoTick` 行 2283 分支内根据 `AUTO.mode==="loop"` 走新逻辑，原 `cult/adv` 行为完全保留。
- **存档兼容**：不新增持久化字段；P 上若临时挂 `knownTechs` 也只用于运行时展示，不写入 save。
- **战斗中保护**：境界穿梭、秘境穿梭、解锁等高破坏操作若 `P.inBattle` 则先二次确认或自动 `endBattle(false)` 收尾，避免 monster 状态残留。
- **日志收敛**：Dev 操作统一 `log("【Dev】xxx","sys")` 前缀，避免污染正常事件流；toast 与 log 同时给，保证可追溯。
- **emoji plan 隔离**：本次只追加新代码，不回滚已落地的 ICON 改动；两套互不影响。

## 目录结构

```
project-root/
├── index.html        # [MODIFY] 唯一改动文件，追加内容：
│                     #   1) 顶部 <script> 内新增 const DEV_MODE = true 开关
│                     #   2) 新增 DEV 命名空间对象，封装：
│                     #      - DEV.setCult/setStone/setLife/fullHeal/clearDebuff
│                     #      - DEV.jumpRealm(idx) 境界穿梭（含寿元同步）
│                     #      - DEV.unlockAll(type) 神通/装备/丹药全解锁
│                     #      - DEV.enterDungeon(idx, floor) / DEV.clearDungeon(idx)
│                     #      - DEV.setSpeed(mul) 倍速切换
│                     #      - DEV.exportSave / importSave / resetGame / reloadSave
│                     #      - DEV.toast(msg) 顶部反馈条
│                     #   3) 修改 AUTO 与 autoTick：新增 mode="loop"，改造行 2283 达标分支
│                     #      达标自动突破，失败用破障丹兜底；空闲时优先秘境>炼丹>历练
│                     #   4) 新增 buildDevPanel() 构建右侧抽屉 DOM + 事件绑定
│                     #   5) bootstrap() 末尾按 DEV_MODE 决定是否插入 🛠 浮动按钮
│                     #   6) 内联 CSS 追加 .dev-fab / .dev-drawer / .dev-group / .dev-toast
└── whitepaper.html   # 不改
```

## 关键代码结构

```js
const DEV_MODE = true;  // 发布前改为 false 即彻底关闭

const DEV = {
  // 数值
  setCult(v),  setStone(v),  setLife(v),
  fullHeal(),  clearDebuff(),
  // 境界
  jumpRealm(idx),     // idx ∈ [0, REALMS.length-1]
  // 解锁
  unlockAll(type),    // "tech" | "equip" | "item" | "all"
  // 秘境
  enterDungeon(idx, floor),  // floor 从 1 开始
  clearDungeon(idx),         // 直接派发通关奖励
  // 自动 & 倍速
  startLoop(),  stopLoop(),  setSpeed(mul),  // 1/2/5/10
  // 存档
  exportSave(),  importSave(text),  resetGame(),  reloadSave(),
  // UI
  toast(msg)
};

// AUTO 扩展
const AUTO = { mode:null, timer:null, interval:700, baseInterval:700 };
// autoTick 内：if(AUTO.mode==="loop") devLoopTick();
```

## Agent Extensions

### SubAgent

- **code-explorer**
- Purpose: 在实现"全自动循环"时，精确定位 `actCultivate / actAdventure / actBreakthrough / openAlchemy / alchemyMake` 的可复用调用条件与副作用边界（如 CD、tick 内禁用项），避免新循环逻辑与现有玩法冲突
- Expected outcome: 输出每个动作函数的"前置条件 + 失败回退 + 触发的 refresh/save"清单，作为 devLoopTick 的判定依据