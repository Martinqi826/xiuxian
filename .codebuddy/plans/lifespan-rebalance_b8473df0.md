---
name: lifespan-rebalance
overview: 中度改造寿元体系：废掉 LIFESPAN 大跳表（仅做初始值用），突破改为小幅累积延寿；高阶神通施放折寿、渡劫失败大损寿元；新增三档昂贵延寿丹（蟠桃/万年灵芝精/九转还魂丹）通过坊市/秘境获取；寿元剩 ≤10 年时给红字一次性警告。
todos:
  - id: data-tables
    content: 扩充 index.html 数据表：ITEMS 加三档延寿丹（含 lifespan 字段）、RECIPES 加两条丹方、MARKET.buy 加三档售价、SKILL_META 补 lifespan 字段
    status: completed
  - id: core-mechanics
    content: 使用 [subagent:code-explorer] 精确定位 castSkill / processBolt / doBreakthroughSuccess 后，改造三处核心机制：突破改为增量延寿、神通折寿校验+扣减、渡劫失败分级处理（坐化/重伤）
    status: completed
    dependencies:
      - data-tables
  - id: item-warning-save
    content: 改造 useItem 支持 it.lifespan、refresh 加寿元 ≤10 年红字警告（带 flag 幂等）、修复 L2716 存档迁移的强制拉满逻辑
    status: completed
    dependencies:
      - core-mechanics
  - id: dungeon-and-guide
    content: 秘境奖池新增三档延寿丹按概率掉落、L2888 道法指引同步寿元新规则文案
    status: completed
    dependencies:
      - data-tables
  - id: whitepaper-sync
    content: 重写 whitepaper.html 寿元体系章节，同步灵草表、丹方表、突破节点说明、派生属性表四处描述对齐新规则
    status: completed
    dependencies:
      - core-mechanics
---

## 用户需求

解决当前寿元数值溢出、形同虚设的问题。改造为"中度硬核"寿元系统：突破不再大幅拉高寿元上限，全靠**突破小幅累积 + 延寿丹消耗 + 高阶神通折寿 + 渡劫失败扣寿**形成动态平衡，让寿元真正成为后期需要主动管理的稀缺资源。

## 核心特性

- **突破回收**：废掉"突破即跳到境界寿元上限"机制，改为每次突破固定增量 `+30 + 境界×10` 年
- **神通折寿**：元婴神雷（-5/次）、化神一念（-20/次）、大乘法相（-50/次）；寿元不足时禁止施放
- **渡劫扣寿**：渡劫失败折寿 `200 + 雷劫数×15` 年；折后寿元未尽则重伤退出（hp=1，下次再渡），寿元归零才真坐化
- **延寿丹三档**：新增「蟠桃」(+30年/8000灵石)、「万年灵芝精」(+120年/50000灵石)、「九转还魂丹」(+500年/300000灵石)，对应配方与秘境掉落概率
- **寿元警告**：剩余阳寿 ≤ 10 年时一次性红字提示（不送资源）；寿元回升后允许再次触发
- **存档兼容**：移除"寿元强制拉满到境界上限"的迁移逻辑，避免新机制被旧规则覆盖
- **白皮书同步**：寿元体系章节、灵草表、丹方表、坊市表全部对齐新规则

## 技术栈

沿用现有：原生 HTML + 内联 JavaScript，无构建工具，无外部依赖。所有改动集中在 `index.html` 和 `whitepaper.html` 两个文件。

## 实现策略

**核心原则**：最小化改动面，复用现有 `useItem` 的丹药字段扩展机制（`it.cult` / `it.hp` → 新增 `it.lifespan`），不引入新模块。

### 关键技术决策

1. **保留 `LIFESPAN` 常量表但改变用途**：仅作 `newPlayer` 初始值（80岁）和 Dev 面板拉满兜底，不再参与突破时的寿元计算。删除会破坏 `newPlayer:L764` / `setLife Dev:L3167` / 存档迁移兜底，影响面大。
2. **延寿走数据驱动**：`ITEMS` 新增 `lifespan` 字段，`useItem` 加一行 `if(it.lifespan) P.lifespan += it.lifespan;`，无需新建专用函数。与现有 `it.cult` / `it.hp` 一致。
3. **神通折寿与现有 mp/cult 校验同处**：在 `castSkill` 修为/MP 检查通过后、扣资源前插入寿元校验+扣减，保持"先校验、再扣资源、再产生效果"的现有顺序。
4. **渡劫失败分级处理**：复用现有 `P.hp<=0` 分支，先扣寿元再判断 `P.lifespan - P.age <= 0`，未死则 `hp=1` 重伤退出（下次能再渡），保持游戏连贯性。
5. **警告幂等**：用 `P.flags.lifeWarned` 标记，剩余 ≤10 年触发一次；剩余 ≥30 年清除标记，允许下次再警告。

### 性能与稳定性

- 所有改动均为常数时间，无性能影响
- `refresh()` 中新增警告检查仅是两次比较 + 一次 log，可忽略
- 存档迁移去掉强制拉满逻辑后，加 `lifespan<=0` 兜底（`80 + realmIdx*30`），保证旧档载入不报错

## 改动文件清单

```
project-root/
├── index.html      # [MODIFY] 5 处代码改动 + 4 处数据表新增/调整
└── whitepaper.html # [MODIFY] 寿元体系章节重写 + 灵草/丹方/坊市表补充
```

### index.html 改动点（按行号顺序）

- **L515 `ITEMS` 表**：新增「蟠桃」「万年灵芝精」「九转还魂丹」三个 type:"丹药" 条目，含 `lifespan` 字段与描述
- **L536-545 `RECIPES` 表**：新增「万年灵芝精」「九转还魂丹」两个炼丹配方（蟠桃只在坊市/秘境产出，不可炼）
- **L565-595 `MARKET.buy`**：新增三档延寿丹售价（8000 / 50000 / 300000）
- **L1505-1532 `doBreakthroughSuccess()`**：替换 L1518 寿元跳上限为 `+30 + realmIdx*10` 增量；同步 L1531 log 文案
- **L1503 附近 `castSkill`**：在修为/MP 校验后插入寿元校验+扣减分支（基于 `SKILL_META[name].lifespan`）
- **`processBolt` 渡劫陨落分支**：扣寿 `200 + tr.trib.bolts*15`，分坐化/重伤两路处理
- **L2138-2150 秘境奖池**：新增 1% 蟠桃 / 0.5% 万年灵芝精 / 0.1% 九转还魂丹（按境界门槛）
- **L2225-2240 `useItem`**：新增 `if(it.lifespan) { P.lifespan += it.lifespan; log(...) }` 分支
- **L2716-2719 存档迁移**：删除 `if(LIFESPAN[d.realmIdx] && d.lifespan < LIFESPAN[d.realmIdx]) d.lifespan = LIFESPAN[d.realmIdx];`，改为 `if(d.lifespan===undefined||d.lifespan<=0) d.lifespan = 80 + (d.realmIdx||0)*30;`
- **`refresh()` 内**：新增寿元警告分支（`P.lifespan - P.age <= 10` 且未触发 → 红字 log + `P.flags.lifeWarned=1`；差值 ≥30 时清除 flag）
- **`SKILL_META`（之前已定位）**：补 `lifespan` 字段（元婴神雷:5 / 化神一念:20 / 大乘法相:50）
- **L2888 道法指引**：寿元说明改为"突破小幅延寿；神通折寿；渡劫扣寿；天材地宝延命"

### whitepaper.html 改动点

- **L462 寿元体系开篇 `<p class="lead">`**：重写为新规则简介
- **L463-475 寿元表格**：删除"每境界固定阳寿"列表，改为「突破延寿公式 / 神通折寿表 / 渡劫扣寿规则 / 延寿丹三档表」四组数据
- **L316 派生属性表**：寿元行说明改为"突破累加；丹药延寿；神通/渡劫消耗"
- **L459 突破节点描述**：删除"寿元直接刷新至下一境界上限"，改为"寿元 +30+境界×10"
- **L617-625 灵草表**：补充蟠桃/万年灵芝精/九转还魂丹三档（实际属丹药但天材地宝同列）
- **L635-645 丹方表**：补万年灵芝精、九转还魂丹两条配方
- **L780-783 时间节奏段**：强化"必须主动延寿"的描述

## 关键数值表（最终敲定）

**神通折寿**

| 神通 | mp | 折寿 |
| --- | --- | --- |
| 元婴神雷 | 100 | 5 年 |
| 化神一念 | 200 | 20 年 |
| 大乘法相 | 400 | 50 年 |


**延寿丹**

| 名称 | 延寿 | 坊市价 | 来源 |
| --- | --- | --- | --- |
| 蟠桃 | +30 年 | 8,000 灵石 | 坊市 + 秘境 1% |
| 万年灵芝精 | +120 年 | 50,000 灵石 | 坊市 + 秘境 0.5% + 配方（万年玄参×3 + 千年灵芝×5，rate 25%，lv5） |
| 九转还魂丹 | +500 年 | 300,000 灵石 | 秘境 0.1% + 配方（九叶玄参×2 + 万年玄参×5 + 蟠桃×1，rate 15%，lv6） |


**渡劫失败**：折寿 = 200 + 雷劫数 × 15；折后阳寿仍 > 0 → hp=1 重伤退出，劫清空可再渡；阳寿 ≤ 0 → 真坐化

## 实现注意事项

- **向后兼容**：旧存档载入需平滑过渡，移除强制拉满逻辑同时加 `lifespan<=0` 兜底
- **日志风格**：复用现有 `log(text, "bad"|"good"|"hint")` 三档色阶，折寿用 "bad"，延寿用 "good"，警告用 "bad"
- **避免日志刷屏**：寿元警告用 flag 控制，仅在跨阈值时触发一次
- **Dev 面板兼容**：L3165 setLife 与 L3200 jumpRealm 保持现状（仍可手动拉满，便于研发调试）
- **xiuxian.py 不动**：用户未要求 Python 版同步，且已多版本不一致

## Agent Extensions

### SubAgent

- **code-explorer**
- Purpose: 在执行前快速核验 `castSkill` / `processBolt` / `refresh` 三处具体函数体边界与上下文，避免落地时位置漂移
- Expected outcome: 给出精确的起止行号与现有代码片段，确保替换上下文唯一匹配