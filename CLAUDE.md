# 凡人修仙路 — AI Agent 开发指南

## 项目概述

单文件浏览器修仙挂机游戏。**零依赖**（纯 HTML+CSS+JS），双击 `index.html` 即玩。
当前 ~8000 行，所有逻辑在一个 `<script>` 块内。存档用 localStorage。

## 技术架构

### 单文件结构（index.html）

```
L1-500       CSS 样式（水墨主题、毛玻璃面板）
L500-680     工具函数 + 音效/特效
L680-700     REALMS 数组（21 阶境界 + 修为门槛）
L700-2050    数据表：夙愿(QUESTS)、道侣(PARTNERS)、灵草(HERBS)、丹方(RECIPES)、物品(ITEMS)
L2050-2070   MONSTERS 数组（8 种怪物：名/等级/HP/ATK/修为奖/灵石奖/属性）
L2070-2700   灵宠系统（PETS_META、PET_PERSONALITIES）
L2700-2800   装备(EQUIPS)、本命法宝(RELICS)
L2800-2990   灵草(HERBS)、丹方(RECIPES)、市场(MARKET)
L2990-3010   MONSTER_META（怪物AI：spd/crit/special/karma）
L3010-3500   核心工具：log/newPlayer/recalcStats/gainCult/takeDmg/addItem/passDays
L3500-3740   夙愿/节庆触发器
L3740-3870   战斗计算：alive/calcDamage/attackerOf/defenderOf
L3870-4660   闭关(actCultivate) + 历练(actAdventure) + 闭关事件链
L4660-4740   历练战斗入口 + 遇怪权重
L4740-4910   突破系统：actBreakthrough/checkBreakthroughGate
L4910-5040   doBreakthroughSuccess/飞升(actAscension)
L5040-5200   天劫系统（startTribulation/processBolt）
L5200-5550   神通/装备/炼丹/宗门
L5550-5700   坊市/道历/秘境
L5700-5790   秘境战斗(dungeonNextFloor)
L5790-5940   startBattle + 战斗机制（蓄力/破绽/连击）
L5940-6100   endBattle（胜利奖励/掉率） + battleAttack + battleHeal
L6100-6170   battleFlee + useItem
L6170-6560   物品使用/装备/refresh/renderStatsPanel/afterAction
L6560-6670   gameOver（战斗死亡=复活/寿终=删档）
L6670-6860   模态框/角色创建/存档读档
L6860-7000   自动模式（autoTick/autoBattleStep/autoStart）
L7000-7150   bindMainButtons/离线结算/bootstrap
L7150-8087   DEV面板 + 帮助弹窗
```

### 核心全局变量

| 变量 | 说明 |
|------|------|
| `P` | 玩家状态对象（整个游戏状态的核心） |
| `REALMS` | 21 阶境界名 + 修为门槛数组 |
| `MONSTERS` | 8 种怪物 [名,等级,HP,ATK,修为奖,灵石奖,属性] |
| `MONSTER_META` | 怪物AI参数（index-parallel with MONSTERS） |
| `EQUIPS` | 装备字典（slot/atk/def/hp/tier） |
| `ITEMS` | 物品字典（丹药/灵草/奇物） |
| `PETS_META` | 灵宠元数据 |
| `RELICS` | 本命法宝 |

### P 对象关键字段

```javascript
{
  name, rootName, elements,       // 角色基本信息
  realmIdx, cult,                 // 境界和修为
  hp, maxHp, mp, maxMp,          // 生命/灵力
  ti, ling, wu, shen, yun, dao,  // 六根骨属性
  atk, def,                      // 派生战斗属性
  bag: {"灵石": n, ...},         // 背包
  equips: {weapon, armor, ...},  // 装备槽
  age, lifespan,                 // 年龄/寿元
  dx, maxDx,                     // 道心
  days,                          // 游戏天数
  stats: {kill, alchemy, dungeon}, // 统计
  inBattle, monster,             // 战斗状态
  _bkCooldown,                   // 突破冷却
}
```

## 数值体系

### 伤害公式

```
dmg = rawAtk * (1 - effDef / (effDef + K))    // K = 300
```

非线性防御：DEF 越高收益递减，但始终有价值。

### 突破成功率

```
baseRate = 0.45 + rootMul × 0.05
+破障丹: +0.25
-装备不足: -0.10 ~ -0.30（checkBreakthroughGate softPenalty）
clamp [0.05, 0.95]
```

### 经济循环

- 收入：战斗灵石奖励（按怪物等级）
- 支出：修炼成本（10 + realmIdx×20）、坊市购买
- 装备：战斗 12% 掉率 + 每 8 场保底

### 怪物动态缩放

```javascript
gap = max(0, P.realmIdx - monsterLevel)
HP  × 1.25^gap
ATK × 1.18^gap
```

怪物随玩家成长变强，防止秒杀低级怪。

## 开发规范

### 版本号

- 大版本（v1-v10）：新系统或重大改动
- 代码注释标记 `// v10：xxx` 方便溯源
- SAVE_VERSION 跟大改存档格式时递增（当前 8）

### 改动原则

1. **所有改动在 index.html 单文件内完成**
2. 不引入外部依赖
3. 改动前用 `node -e` 验证 JS 语法
4. 数值调整后用 headless harness 跑 300 回合验证

### Headless 测试工具

`/tmp/play-xiuxian.js` — Node.js headless playtest harness

用法：
```bash
node /tmp/play-xiuxian.js
```

功能：
- 模拟 DOM 环境在 Node.js 中运行游戏
- AI 玩家自动闭关/历练/战斗/突破
- 300 回合后输出体验报告（死亡/嗑药/装备/经济/进度）
- 天劫自动跳过（无法模拟 modal 交互）

注意事项：
- harness 中 `confirmBox` 被 override 为自动确认
- tribulation realms 通过直接调用 `doBreakthroughSuccess()` 跳过
- AI 战斗逻辑：蓄力→逃跑、低血→嗑药/逃跑、否则攻击
- 改动 MONSTERS/REALMS/核心公式后应重新运行验证

## 已知问题

1. **Headless 测试 0 死亡** — AI 善于逃跑，真人可能更激进会死。可考虑加强追击惩罚或降低逃跑成功率
2. **高境界怪物种类少** — 只有 8 种怪物，化神期以上只有 2-3 种可战。可扩充 MONSTERS 数组（注意同步 MONSTER_META 和 PETS_META）
3. **寿元压力仍偏轻** — 延寿丹（蟠桃/万年灵芝精）掉率可能需要下调
4. **天劫系统无法 headless 测试** — modal 交互无法自动化

## 扩展方向

- 更多怪物种类填补等级空档
- PvP 或排行系统
- 更丰富的秘境机制
- 成就系统
- 音效/BGM 增强
- 移动端适配优化

## 相关文件

| 文件 | 说明 |
|------|------|
| `index.html` | 游戏主文件（全部代码） |
| `CHANGELOG.md` | 版本迭代日志（含改动原因） |
| `whitepaper.html` | 19 章设计白皮书 |
| `xiuxian.py` | 早期 CLI 原型（已废弃） |
| `/tmp/play-xiuxian.js` | Headless 测试工具 |
