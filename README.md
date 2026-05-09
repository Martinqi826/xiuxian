<!--
  ╔══════════════════════════════════════════════╗
  ║    凡 人 修 仙 路  ·  Mortal Cultivation      ║
  ║         零依赖单文件浏览器挂机游戏            ║
  ╚══════════════════════════════════════════════╝
-->

<h1 align="center">☯ 凡 人 修 仙 路 ☯</h1>
<h3 align="center">Mortal Cultivation · A Zero-Dependency Browser Idle Game</h3>

<p align="center">
  <b>双击即玩 · 古风水墨 · AI 陪跑开发</b><br/>
  <i>Double-click to play · Ink-wash aesthetic · Co-developed with AI</i>
</p>

<p align="center">
  <a href="#中文">🇨🇳 中文</a> ·
  <a href="#english">🇬🇧 English</a> ·
  <a href="./whitepaper.html">📘 完整白皮书</a>
</p>

---

## 中文

### 🎮 这是什么

一个**单 HTML 文件**的修真模拟挂机游戏。从练气到仙人，21 阶境界，全程陪你走完一生——然后 Roguelike 转世再来一次。

- **双击 `index.html` 即玩**，无需安装任何东西
- 零依赖（纯 HTML + CSS + JS，单文件 ~280KB）
- 古风水墨配色，金线玉黄朱红，毛玻璃面板
- 存档走 localStorage，自动保存

### ✨ 核心系统

| 系统 | 说明 |
|---|---|
| ☯ 境界修炼 | 21 阶（凡人→练气→筑基→金丹→元婴→化神→...→仙人）|
| 🌱 灵根五行 | 7 种灵根 × 5 种五行，袍色随五行变化 |
| 🧘 闭关/历练 | 心境 6 态（天人合一 / 心神不宁 ...）|
| ⛈ 天劫系统 | 7 次大劫；硬扛折损道行，法宝抗雷采集【天劫真血】|
| 🔥 炼丹系统 | 12 种丹方（含金丹、悟道茶、法宝祭炼丹）|
| 🏯 宗门任务 | 5 大宗门 × 5 类任务，产【道行】|
| 🏪 坊市 | 灵石经济枢纽 |
| 🏔 秘境 | 6 大秘境首通独家法宝 + 灵宠蛋 |
| 🌙 夙愿系统 | 6 大开局夙愿 × 5 节点主线剧情（首发：血海深仇）|
| 🐉 灵宠契约 | 12 种灵宠 × 4 种专属蛋 × 11 种灵宠神通 |
| 🌅 飞升 | 仙人飞升触发 Roguelike 转世，传承法宝/道行/灵根重抽 |
| 📅 道历 | 紫微道历 360 天/年，24 节气 + 12 节庆 BUFF |

### 🚀 快速开始

```bash
# 克隆仓库
git clone https://github.com/Martinqi826/xiuxian.git
cd xiuxian

# 方式一：直接双击
#   双击 index.html 即可（部分浏览器 file:// 下 localStorage 受限，推荐方式二）

# 方式二：起个本地服务器（推荐）
python -m http.server 8000
# 然后访问 http://localhost:8000/index.html
```

### 📂 项目结构

```
xiuxian/
├── index.html         # 游戏主文件（单文件 ~280KB，所有逻辑）
├── whitepaper.html    # 项目白皮书（19 章详细设计文档）
├── xiuxian.py         # 早期 CLI 原型（已废弃，保留纪念）
└── .codebuddy/        # 开发过程记录（对话计划 / artifact）
```

### 🧭 迭代里程碑

| 版本 | 主题 | 关键改动 |
|---|---|---|
| **v1** | MVP | 境界 + 修炼 + 简单战斗 |
| **v2** | 修真骨架 | 天劫/寿元/炼丹/宗门/坊市/秘境/装备/神通 |
| **v3** | 三层属性 | 六根骨 → 八派生属性管线 |
| **v4** | 道历与节气 | 360 天/年 + 24 节气 buff + 12 节庆事件 |
| **v5** | 夙愿系统 | 开局立愿 + 5 节点主线剧情 + 硬核失败 |
| **v6** | 经济再平衡 | 突破五维化（金丹/法宝/道行/天劫真血）+ Roguelike 飞升 |
| **v6.2** | 灵宠契约 | 12 种灵宠 + 协攻分担 + 图鉴 + 专属蛋 |
| **v6.3** | 自动暂停 | 弹窗时自动模式暂停等玩家决断 |
| **v6.5** | 回退形象 | SVG 形象因不符古风水墨调性，回退至无形象方案 |

### 🛠 开发控制台（DEV 面板）

右上角齿轮图标 ⚙ 打开 DEV 面板，或 F12 控制台使用：

```javascript
DEV.P()                  // 查看当前玩家完整状态
DEV.jumpRealm(15)        // 跳到指定境界（0~20）
DEV.addStat("dao", 50)   // 加道行
DEV.fullCharge()         // 满血满蓝满道心
DEV.setKarma(-80)        // 调业力（看节气/奇遇分支变化）
```

发布前把 `index.html` 里的 `const DEV_MODE = true` 改为 `false` 即可彻底隐藏。

### 📝 License

本仓库为个人学习项目，未设置开源协议（默认版权保留）。如需引用或二次开发请联系作者。

---

## English

### 🎮 What is this?

A **single-file HTML** cultivation idle game. From mortal to immortal, 21 realms, full life simulation — then Roguelike reincarnation for another run.

- **Double-click `index.html` to play**, zero installation
- Zero dependencies (pure HTML + CSS + JS, single file ~280KB)
- Ink-wash aesthetic with golden / jade / crimson highlights
- Saves via localStorage, auto-save enabled

### ✨ Core Systems

- **21-tier Cultivation**: Mortal → Qi Refining → Foundation → Golden Core → Nascent Soul → ... → Immortal
- **7 Spirit Roots × 5 Elements**: Robe color dynamically matches your element
- **Tribulations**: 7 great tribulations — hardcore mode damages your Dao if you brute-force
- **Alchemy / Sect / Market / Dungeon**: All contribute unique resources to your breakthrough requirements
- **Quest System**: 6 destiny quests × 5 plot nodes (feat. "Blood Feud of Xuanyin Sect")
- **Spirit Pet Contract**: 12 pets × 4 exclusive eggs × 11 pet skills
- **Ascension**: Reaching Immortal triggers Roguelike rebirth with inheritance

### 🚀 Quick Start

```bash
git clone https://github.com/Martinqi826/xiuxian.git
cd xiuxian

# Option 1: Double-click index.html
# Option 2 (recommended): Local server
python -m http.server 8000
# Visit http://localhost:8000/index.html
```

### 🧭 Version Milestones

| Ver | Theme | Key changes |
|---|---|---|
| v1 | MVP | Realms + cultivation + basic combat |
| v2 | Core skeleton | Tribulation / lifespan / alchemy / sects / market / dungeons |
| v3 | 3-layer attributes | 6 root stats → 8 derived stats pipeline |
| v4 | Calendar | 360-day year + 24 solar terms + 12 festivals |
| v5 | Quest system | Destiny quests with 5 plot nodes |
| v6 | Economy rebalance | 5-dimensional breakthrough + Roguelike ascension |
| v6.2 | Pet contract | 12 pets + co-combat + dex + exclusive eggs |
| v6.3 | Auto-pause | Auto mode pauses for decision modals |
| v6.5 | Portrait rollback | SVG portrait rolled back due to Q-style mismatch |

### 📝 License

Personal learning project, no open-source license set (all rights reserved). Contact author for usage.

---

<p align="center">
  <i>"此身不灭，此恨难消。"</i><br/>
  <i>"As long as I exist, my grievance remains."</i>
</p>
