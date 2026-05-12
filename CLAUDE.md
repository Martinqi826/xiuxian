# 凡人修仙路 — AI Agent 开发指南

## 项目概述

单文件浏览器修仙挂机游戏。**零依赖**（纯 HTML+CSS+JS），双击 `index.html` 即玩。
当前 ~14186 行，所有逻辑在一个 `<script>` 块内。存档用 localStorage。

## 技术架构

### 单文件结构（index.html）

```
L1-500       CSS 样式（水墨主题、毛玻璃面板、浮动伤害动画）
L500-700     HTML 结构（侧栏状态+Tab面板+操作区+弹窗）
L700-960     工具函数 + 音效/特效（SFX IIFE）
L960-2300    REALMS + 夙愿(QUESTS) + 道侣(PARTNERS) + TECHS(10种功法) + ITEMS
L2300-2700   MONSTERS(15种) + MONSTER_META + 灵宠(PETS_META)
L2700-3100   装备(EQUIPS/32件) + 本命法宝(RELICS) + 节气(TERM_BUFFS)
L3100-3200   灵草(HERBS) + 种子(HERB_SEEDS) + 天象(WORLD_EVENTS) + 心魔(DEMON_TYPES)
L3200-3320   炼丹配方(RECIPES) + 宗门(SECTS) + 坊市(MARKET) + 秘境(DUNGEONS)
L3320-3500   成就(ACHIEVEMENTS) + 阵法(FORMATIONS) + 符箓(TALISMANS) + 机缘 + 悬赏令
L3500-3600   叙事文本(NARRATIVE) + 闭关选择事件(CHOICE_EVENTS)
L3600-3800   newPlayer + applyLineage + recalcStats（含阵法加成）
L3800-4100   核心工具：gainCult(含宗门/天象/阵法乘数) + passDays(含天象/弟子/灵田)
L4100-4400   战斗计算：calcDamage/attackerOf/defenderOf + battleAttack
L4400-4600   闭关(actCultivate) + 功法被动 + 闭关事件链
L4600-5000   闭关随机事件(CULT_EVENTS) + 选择事件(EVENT_CHAINS)
L5000-5100   天劫系统（分阶选择）
L5100-5400   突破(actBreakthrough) + 历练(actAdventure) + 机缘触发
L5400-5600   doBreakthroughSuccess + 飞升(actAscension) + Roguelike 传承
L5600-5700   天劫流程(startTribulation/processBolt)
L5700-6100   神通/装备/炼丹(openAlchemy)
L6100-6200   拍卖行(AUCTION_ITEMS/triggerAuction)
L6200-6400   v15: 心魔(triggerInnerDemon) + 天象 + 签到 + 灵田
L6400-6600   悬赏令(refreshBounties/bountyAdvance) + 阵法面板 + 符箓
L6600-6800   宗门(SECT_RANKS/声望/弟子) + openSect + renderSectPanel
L6800-7000   坊市(renderMarketPanel) + 道历(openCalendar)
L7000-7200   秘境(openDungeon/dungeonNextFloor)
L7200-7500   startBattle + 战斗机制(蓄力/破绽/连击/符箓加成)
L7500-7700   endBattle(掉率/种子/成就) + battleFlee(符箓逃跑)
L7700-7900   物品使用(useItem/符箓) + refresh(天象显示/灵田面板)
L7900-8100   renderStatsPanel + afterAction(拍卖触发) + 成就/仙榜
L8100-8400   gameOver + 模态框/角色创建/存档读档(含v15迁移)
L8400-8600   自动模式(autoTick/autoBattleStep)
L8600-8950   bindMainButtons + 离线结算 + bootstrap(签到触发)
L8950-9900   DEV面板 + 帮助弹窗
```

### 核心全局变量

| 变量 | 说明 |
|------|------|
| `P` | 玩家状态对象（整个游戏状态的核心） |
| `REALMS` | 21 阶境界名 + 修为门槛数组 |
| `MONSTERS` | 15 种怪物 [名,等级,HP,ATK,修为奖,灵石奖,属性] |
| `MONSTER_META` | 怪物AI参数（index-parallel with MONSTERS） |
| `EQUIPS` | 装备字典（32件，slot/atk/def/hp/tier） |
| `ITEMS` | 物品字典（丹药/灵草/奇物/种子/符箓） |
| `TECHS` | 10 种功法 [cultMul, atkBonus, desc] |
| `FORMATIONS` | 6 种阵法（被动 buff） |
| `TALISMANS` | 5 种符箓（战斗消耗品） |
| `HERB_SEEDS` | 6 种灵草种子 |
| `WORLD_EVENTS` | 6 种天象事件 |
| `DEMON_TYPES` | 5 种心魔类型 |
| `BOUNTY_TEMPLATES` | 5 种悬赏令模板 |
| `FORTUNE_ENCOUNTERS` | 7 种机缘遭遇 |
| `SECT_RANKS` | 6 阶宗门声望等级 |
| `SYNTHESIS` | 16 条道具合成配方 |
| `DUNGEON_CHOICE_EVENTS` | 3 种秘境互动选择事件 |
| `ARENA_NAMES` | 15 个擂台 NPC 名 |
| `ENHANCE_COST/RATE` | 装备强化费用/成功率表 |
| `EQUIP_SETS` | 6 套tier-based装备套装效果 |
| `PET_EVOLVE_LV/PREFIX/SKILLS` | 灵宠进化数据 |
| `ACHIEVEMENTS` | 24 个成就 |
| `PETS_META` | 灵宠元数据 |
| `RELICS` | 本命法宝 |
| `DAILY_TYPES` | 5 种每日挑战类型 |
| `TALENTS` | 16 个天赋（累计里程碑被动） |
| `DISCIPLE_APTITUDES` | 5 种弟子资质 |
| `TECH_MUTATIONS` | 9 种功法突变路径 |
| `RARE_MONSTERS` | 3 种稀有变异类型 |
| `WORLD_RULES` | 8 种天道法则（每世随机） |
| `SALVAGE_YIELD` | 6 tier装备分解产出表 |
| `ENLIGHTEN_PATHS` | 4 条悟道路径 |
| `ENLIGHTEN_THRESHOLDS` | 5 个悟道解锁阈值 |
| `CAVE_FACILITIES` | 3 种洞府设施 |
| `COMBO_CHAINS` | 5 种战斗连招序列 |
| `TREASURE_MAPS` | 4 种藏宝图（多步探索） |
| `DESTINY_MISSIONS` | 8 种天命目标 |
| `PET_ACTIVES` | 4 种灵宠主动技能 |
| `REINCARNATION_SHOP` | 8 种轮回商店加成 |
| `TRIBULATION_MODS` | 6 种天劫词缀 |
| `WANDERING_NPCS` | 6 种游历NPC（仙友系统） |
| `EQUIP_AFFIXES` | 6 种装备词缀 |
| `REALM_PASSIVES` | 7 个境界被动能力 |
| `DISCIPLE_MISSIONS` | 5 种弟子出战任务 |
| `ADVENTURE_CHAINS` | 5 种江湖事件链（多步叙事） |
| `LEYLINES` | 6 种灵脉（日常被动加成） |
| `MEDITATIONS` | 4 种入定冥想事件 |
| `SKILL_UPGRADES` | 8 种神通进阶路径 |
| `TOURNEY_OPPONENTS` | 3 种宗门大比对手 |
| `DUNGEON_BOSS_ABILITIES` | 6 种秘境Boss能力 |
| `CRAFT_RECIPES` | 12 条炼器配方 |
| `RARE_RECIPES` | 5 种稀有秘方（永久属性提升） |
| `BATTLE_STANCES` | 3 种战斗姿态（攻防切换） |
| `DIVINATIONS` | 4 种天机推演（占卜预知） |
| `EQUIP_RUNES` | 6 种装备符文（战斗特效） |
| `WORLD_BOSSES` | 5 种域外妖王（Boss挑战） |
| `TRIAL_FLOORS` | 10 层天道试炼（无尽塔） |
| `WHEEL_PRIZES` | 11 种气运转盘奖品 |
| `CONSTELLATION` | 3×5 星辰图谱天赋树 |
| `SPIRIT_STAGES` | 3 阶器灵觉醒（武器积杀） |
| `FACTIONS` | 4 大江湖势力声望系统 |
| `ADV_REGIONS` | 4 大历练区域（怪物/奖励偏向） |
| `CODEX_MILESTONES` | 6 个图鉴收集里程碑奖励 |
| `COMBAT_INSIGHTS` | 6 种战斗心法领悟（击杀解锁） |
| `FORBIDDEN_ARTS` | 5 种禁术（高代价主动技） |
| `RUMOR_TEMPLATES` | 4 种江湖传闻任务模板 |
| `PET_EXPEDITIONS` | 4 种灵兽远征目的地 |

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
  // v14+ 新增
  garden: [{seed,plantDay,mature}], // 灵田
  checkin: {lastDate,streak},    // 每日签到
  // v15+ 新增
  _demonPower,                   // 心魔蓄积(>=80触发Boss)
  _totalContrib,                 // 宗门累计贡献(声望等级)
  disciples: [{name,level,joinDay}], // 门下弟子
  worldEvent: {id,endDay},       // 当前天象
  // v16+ 新增
  bounties: [{type,desc,progress,target,reward}], // 悬赏令
  // v17+ 新增
  formation,                     // 当前启用阵法名
  knownFormations: [],           // 已学阵法列表
  // v18+ 新增
  chronicle: [{day,age,realm,text}], // 修行纪要
  // v19+ 新增
  equipEnhance: {装备名: 强化等级},  // 装备强化
  arena: {pts,wins,todayDate,todayCnt}, // 天梯擂台
  // v21+ 新增
  dailies: {date,tasks:[{type,desc,progress,target,unit,done,reward}]}, // 每日挑战
  // v24+ 新增
  worldRules: [],                // 天道法则(每世随机)
  // v25+ 新增
  enlighten: {atk:0,def:0,spd:0,life:0}, // 悟道层级
  // v30+ 新增
  friends: {npcId: {fond,met,bonusApplied}}, // 仙友好感
  equipAffixes: {装备名: {id,nm,stat,val,color}}, // 装备词缀
  leyline: {id,claimDay},          // 占据的灵脉
  skillUse: {技能名: 使用次数},     // 神通使用统计
  sectTourney: {lastDay},          // 宗门大比记录
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

`play-xiuxian.js` — Node.js headless playtest harness

用法：
```bash
node play-xiuxian.js
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

1. **Headless 测试偶尔 0 死亡** — AI 善于逃跑。偶有寿终正寝死亡（RNG 依赖）
2. **寿元压力仍偏轻** — 延寿丹（蟠桃/万年灵芝精）掉率 + 长生诀功法可能需要下调
3. **天劫/拍卖系统无法 headless 测试** — modal 交互无法自动化
4. **功法平衡** — 天魔功/杀生剑意高收益需要更多测试验证

## 扩展方向

- PvP 或排行系统（在线排行榜）
- 更多秘境词缀和层间事件
- 门派战争/攻城系统
- 转世传承增强（更多可继承属性）
- 移动端进一步适配
- 多语言支持

## 相关文件

| 文件 | 说明 |
|------|------|
| `index.html` | 游戏主文件（全部代码） |
| `CHANGELOG.md` | 版本迭代日志（含改动原因） |
| `whitepaper.html` | 19 章设计白皮书 |
| `xiuxian.py` | 早期 CLI 原型（已废弃） |
| `play-xiuxian.js` | Headless 测试工具 |
