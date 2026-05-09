---
name: emoji-ui-decoration
overview: 为修仙游戏界面添加克制的 emoji 点缀，覆盖按钮/属性/标签页/物品/日志/场景标题/模态框标题，每处仅单个图标前置，保持古风留白与可读性，不引入任何外部资源。
todos:
  - id: add-icon-const
    content: 在 index.html JS 顶部新增 ICON 常量对象，集中收纳全部 emoji 映射
    status: in_progress
  - id: static-buttons-tabs
    content: 改造主操作按钮 HTML（行 240~251）和侧边栏 tabs 文本，前置对应 emoji
    status: pending
    dependencies:
      - add-icon-const
  - id: dynamic-button-states
    content: 同步战斗、渡劫、默认三态按钮 textContent 切换处，全部从 ICON 读取，避免切换丢失
    status: pending
    dependencies:
      - add-icon-const
  - id: character-panel-attrs
    content: 在 refresh() 角色属性面板渲染中，为气血/修为/灵石/寿元/道心/境界等前置 emoji
    status: pending
    dependencies:
      - add-icon-const
  - id: bag-and-modals
    content: 背包渲染按 item.type 前置 emoji；11 处 showModal 的 h3 标题前置对应模态框 emoji
    status: pending
    dependencies:
      - add-icon-const
  - id: log-and-scene
    content: 扩展 log(text,type) 支持 type 前置 emoji（向后兼容）；setScene 按场景前置图标；同步道法指引文案中的按钮 emoji
    status: pending
    dependencies:
      - add-icon-const
---

## 用户需求

为修仙游戏单文件页面 `index.html` 全局加入 emoji 图标点缀，让界面更丰富，但保持克制不杂乱，且不引入外部资源、几乎不增加文件体积。

## 核心改动（全部覆盖 6 区域，但每处仅单个前置小图标，保持克制）

- **主操作按钮**：🧘 闭关 / 🗡 历练 / ⚡ 突破 / 🔥 炼丹 / 🏯 宗门 / 🏪 坊市 / 🏔 秘境 / 📜 存档 / 📖 指引；自动闭关 / 自动历练同款图标
- **战斗与渡劫动态按钮**：⚔ 出剑 / 💊 嗑药 / 🌀 遁光 / ✨ 神通 / 🛡 硬抗 / 💊 服丹 / 🔮 法宝 / ⚡ 渡劫（保留劫名）
- **侧边栏标签页**：🎒 背包 / ⚔ 装备 / ✨ 神通
- **角色面板属性**：❤ 气血 / ☯ 修为 / 💎 灵石 / ⏳ 寿元 / 🧠 道心 / 🏷 境界 等
- **背包物品**：按 type 前置 💊⚔🛡🔮📜🌿
- **事件日志**：按 type 前置 🧘⚔⚡⛈🏯💰🏔📜
- **场景标题**：单侧前置 ☯ / ⚔ / ⛈ / 🧘 等
- **模态框标题**：🔥 丹房 / 🏯 宗门 / 🏪 坊市 / 🏔 秘境 / ✨ 神通 / 🌗 入道 / 🕯 魂归黄泉

## 视觉效果

- emoji 与文字之间统一半角空格，整体节奏一致
- 保留古风纯文字基调，每处只点一个图标
- 已有的 CULT_EVENTS 档位 emoji（🟡🟢⚪🔴⚫）保持不变
- whitepaper.html 不动，保持文档纯净

## 技术栈

延续现有单文件 HTML + 原生 JS 结构，零依赖、零外部资源。仅使用 Unicode emoji 字符，文件大小增量 < 1KB。

## 实现策略

1. **集中常量映射**：在 JS 顶部新增一个 `ICON` 常量对象，统一收纳全部 emoji（按钮/属性/物品类型/日志类型/场景/模态框），便于以后调整或一键关闭。
2. **静态 DOM 直接改文本**：行 240~251 的主操作按钮、行 265 附近侧边栏 tabs 标题，直接在 HTML 文本前加 emoji + 空格。
3. **JS 文案切换点同步**：按钮文案在 `actCultivate/battle/tribulation/restoreDefaultButtons` 等 3 处切换，全部从 `ICON` 常量读取，避免 emoji 在状态切换时丢失。
4. **渲染函数注入**：

- 角色面板属性（`refresh()` 内部）：在每个属性 label 前加图标
- 背包列表（渲染物品 div 的位置，行 1936 附近）：根据 item.type 查 `ICON.item[type]` 前置
- 日志函数 `log(text, type)`：扩展签名，type 命中 `ICON.log[type]` 时前置图标，未传 type 时回退默认 📜（向后兼容）
- `setScene(title, sub, cls)`：根据 cls 或新加可选参数前置场景图标，老调用点不传则无图标
- 所有 `showModal(<h3>xxx</h3>...)` 处的 h3 文本前加 emoji（手动改 11 处字符串字面量）

5. **道法指引文案同步**：按钮指引中的"闭关修炼/外出历练/..."加上对应 emoji，保持与 UI 一致。

## 实现要点（防回归）

- **存档兼容**：emoji 全部是展示层，P 对象字段、CULT_EVENTS、MONSTER 数据结构不变，老存档读档零影响。
- **按钮三态同步**：默认（行 2302~2311）/ 战斗（行 1705~1714）/ 渡劫（行 1148~1152）三处 textContent 赋值必须全部走 ICON 常量，否则切换回来 emoji 会丢。
- **零样式改动**：不调 CSS，依赖系统默认 emoji 渲染；如发现 emoji 比中文偏大，后续单独再加 `.emoji{font-size:.9em}` 即可（本次先不做）。
- **不污染白皮书**：`whitepaper.html` 完全不改。
- **保留已有 emoji**：`CULT_EVENTS` 内 🟡🟢⚪🔴⚫ 档位标识不动；已有 log 文案中的 emoji 不重复前置（log 函数前置图标依赖 type 参数，纯文本调用走默认 📜，原本带 emoji 的 log 调用不传 type 即可保持不变）。

## 目录结构

```
project-root/
├── index.html        # [MODIFY] 单文件游戏，本次唯一改动：
│                     #   1) 顶部新增 ICON 常量对象（按钮/属性/物品/日志/场景/模态框分组）
│                     #   2) 行 240~251 主操作按钮 HTML 文本前置 emoji
│                     #   3) 侧边栏 tabs 文本前置 emoji
│                     #   4) 角色属性面板 refresh() 渲染前置 emoji
│                     #   5) 背包渲染函数按 item.type 前置 emoji
│                     #   6) log() 函数支持 type 参数 → 前置 emoji
│                     #   7) setScene() 根据场景前置 emoji
│                     #   8) 11 处 showModal h3 标题前置 emoji
│                     #   9) 战斗/渡劫/默认 三态按钮 textContent 切换从 ICON 读取
│                     #   10) 道法指引文案与按钮 emoji 同步
└── whitepaper.html   # 不改
```

## 关键数据结构（仅一项必要的）

```js
// 集中管理，便于统一调整或关闭
const ICON = {
  btn: { cult:"🧘", adv:"🗡", bk:"⚡", alch:"🔥", sect:"🏯", market:"🏪",
         dungeon:"🏔", save:"📜", help:"📖",
         atk:"⚔", heal:"💊", flee:"🌀", art:"✨",
         endure:"🛡", pill:"💊", relic:"🔮" },
  tab: { bag:"🎒", equip:"⚔", skill:"✨" },
  attr: { hp:"❤", cult:"☯", stone:"💎", life:"⏳", dao:"🧠", realm:"🏷" },
  item: { pill:"💊", weapon:"⚔", armor:"🛡", relic:"🔮", book:"📜", material:"🌿" },
  log: { cult:"🧘", battle:"⚔", bk:"⚡", trib:"⛈", sect:"🏯",
         market:"💰", dungeon:"🏔", sys:"📜" },
  scene:{ main:"☯", battle:"⚔", trib:"⛈", cult:"🧘" },
  modal:{ alch:"🔥", sect:"🏯", market:"🏪", dungeon:"🏔",
          art:"✨", rebirth:"🌗", death:"🕯" }
};
```