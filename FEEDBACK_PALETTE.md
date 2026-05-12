# 反馈调色板（FEEDBACK_PALETTE）

> 本文档是 **AI 与人类协作开发本项目时的强制查阅清单**。
> 任何"玩家能看到 / 听到 / 感觉到"的改动（战斗、获得、解锁、危险、剧情、突破、死亡），
> **开始编码前必读"反馈四问 + 红线"两节**，并在 PR/改动说明里勾选实际使用的反馈通道。
>
> 核心理念：**默认极简，论证才升级。菜单不是工具箱，是预算。**

---

## 〇、当前项目反馈基线（v50 · 2026-05-12 审计快照）

| 原语 | 当前用量 | 健康范围 | 状态 |
|------|---------|---------|------|
| `log("epic")` | **220** | <80 | 🔴 滥用，每场战斗都见米黄字。新增请慎重，能用 good 就别用 epic |
| `log("good")` | 197 | OK | 🟢 |
| `log("bad")` | 112 | OK | 🟢 |
| `log("hint")` | 176 | OK | 🟢 |
| `SFX.thunder()` | 9 | A/S 级专用 | 🟢 |
| `SFX.rumble()` | 11 | S 级专用 | 🟡 偏多，建议复审 |
| `SFX.chime()` | 17 | A 级专用 | 🟡 偏多 |
| `vfx("gold")` | 17 | A/S 级 | 🟢 |
| `vfx("red")` | 7 | A/S 级 | 🟢 |
| `screenShake()` | 11 | A/S 级 | 🟢 |
| `showModal(` | 113 | S/A + 决策 | 🟡 113 处需逐个审查；决策类外的应改为 log |
| `confirmBox(` | 15 | S/A 决策 | 🟢 |

**v50 已修复的红线越界**：
- 怪物破绽 `addBreakGauge` (L11393)：原 thunder+vfx(gold)+screenShake S 级排场触发频次 C 级 → 改为 chime + log(good) (B 级 2 通道)
- 战斗暴击/治疗：尚未引入 `floatDmg` 数字浮动（仅用了 5 处），未来引入时按 §四 4.2 模板

新增改动**禁止增加 `log("epic")` 的全文用量**（除非确为 A 级以上事件）；新增 `showModal()` 必须先证明是 S/A 决策。

---

## 一、反馈四问（强制清单）

每个改动开始编码前必须回答 4 个问题，写在改动说明或 commit message 里：

```
1. 事件分级：S / A / B / C  （依据见 §三）
2. 反馈预算：__ 通道           （不得超过分级上限）
3. 选用模板：TEMPLATE_xxx     （必须从 §五模板表选；自定义需说明理由）
4. 自动模式行为：完整 / 降级 / 跳过  （默认降级）
```

回答这 4 问花不了 30 秒。**填不出来说明改动还没想清楚。**

---

## 二、红线（禁止组合 / 反例）

下面是**绝对不能出现**的组合。提交前自检：

- ✗ 屏幕震动 (`screenShake`) + 全屏滤镜 (`vfx`) 同时触发 → 眩晕
- ✗ 同一事件叠 ≥3 个 `SFX.*()` 调用 → 听觉打架
- ✗ C 级事件（每秒/每场战斗都会发生）用 `showModal()` / `confirmBox()` → 破坏挂机
- ✗ C 级事件用 `vfx("gold")` / `vfx("red")` → 全屏闪光只配 A 级及以上
- ✗ C 级事件用 `SFX.thunder()` / `SFX.rumble()` / `SFX.chime()` → 这三个是"贵的"音效，只配 A 级及以上
- ✗ 同屏 >3 个 `floatDmg()` 同时存在 → 视觉过载，请合并文案
- ✗ `log(..., "epic")` 用于普通事件 → 米黄发光字稀释殆尽，玩家以后就不看了
- ✗ 自动模式下用 `showModal()` 推剧情（除非是 S 级或需要决策）→ 玩家挂机回来一堆未读弹窗

如果改动**必须**踩红线，在改动说明里写明"为什么 §二第 X 条不适用"，否则视为 bug。

---

## 三、事件分级 + 预算

| 级别 | 频率 | 例子 | 预算（通道数） | 允许的最大反馈强度 |
|------|------|------|----------------|---------------------|
| **S** | 一世 1~3 次 | 飞升、转世、天劫成功/失败、世界 Boss 首杀 | 5 通道，可破常规 | 全屏滤镜 + 屏幕震动 + 阻塞 modal + 专属 SFX + BGM 切换 |
| **A** | 每境界 1~N 次 | 境界突破、神器到手、传说装备、Boss 击杀、机缘大事件 | 3 通道 | `vfx` + 专属 `SFX.chime/thunder/rumble` + `log("epic")` + 可选 modal |
| **B** | 每日~每周级 | 成就解锁、稀有掉落、悬赏完成、节气/天象切换、宗门升级 | 2 通道 | `achieve-toast` 或 `log("good"/"sys")` + `SFX.milestone/achieve` + `floatDmg` |
| **C** | 每秒~每分钟级 | 普通攻击/受击、灵石获得、闭关进度、普通掉落、嗑药 | 1 通道 | 单行 `log()` 或单个 `floatDmg()` 或单个 `SFX.hit/dodge/heal`，三选一 |

**预算意思是：S 最多 5 通道，A 最多 3 通道，B 最多 2 通道，C 只有 1 通道。**
不是"必须用满"，而是"不能超过"。能用 0 通道（默默生效）也是好选择。

### 通道清单（用于计数）

每使用以下之一即视为占用 1 通道：

1. `log(text, cls)` 一次 —— 文字日志
2. `floatDmg(text, type)` 一次 —— 浮动数字
3. `SFX.xxx()` 一次 —— 音效
4. `vfx("gold"/"red"/"blue")` 一次 —— 全屏滤镜
5. `screenShake()` 一次 —— 屏幕震动
6. `showAchieveToast(name)` 一次 —— 横幅
7. `showModal()` / `confirmBox()` 一次 —— 阻塞弹窗
8. 自定义 CSS class 切换（如 `.bk-flash`、`.scene.tribulation`） —— 场景级动效

---

## 四、现有反馈原语清单（实现锚点）

> 新增反馈前**先 grep 这张表**，能复用就不要新建。

### 4.1 音效 `SFX.*` （[index.html:700-862](index.html#L700-L862)）

| 调用 | 适用级别 | 描述 | 时长 |
|------|---------|------|------|
| `SFX.thunder()` | **S/A** | 突破雷鸣，低频隆响 + 高频劈裂 | 1.5s |
| `SFX.rumble()` | **S** | 天劫持续震动 | 2.5s |
| `SFX.chime()` | **A** | 传说物品/机缘清脆钟鸣（C-E-G-C 上行） | 0.8s |
| `SFX.milestone()` | **B** | 里程碑短促上升音阶（A-C#-E） | 0.4s |
| `SFX.achieve()` | **B** | 成就解锁 5 音上行 | 0.6s |
| `SFX.fail()` | **A/B** | 失败/重伤闷响 | 0.6s |
| `SFX.hit()` | **C** | 攻击命中白噪声短促 | 0.08s |
| `SFX.heal()` | **C** | 治疗 3 音上行 | 0.3s |
| `SFX.dodge()` | **C** | 闪避下滑音 | 0.2s |

**规则**：S/A 级的 thunder/rumble/chime **不要**用于 C 级事件，否则音效廉价化。

### 4.2 浮动数字 `floatDmg(text, type)` （[index.html:283-297](index.html#L283-L297) / 实现 [index.html:12454](index.html#L12454)）

| 调用 | 用途 | 视觉 |
|------|------|------|
| `floatDmg("-1234")` | 普通伤害 | 白字 18px |
| `floatDmg("-1234", "crit")` | 暴击 | 红字 24px |
| `floatDmg("+200", "heal")` | 治疗回血 | 绿字 |
| `floatDmg("闪避", "dodge")` | 闪避 | 蓝色斜体 14px |

### 4.3 全屏视觉 `vfx(type)` + `screenShake()` （[index.html:360-364](index.html#L360-L364) / [index.html:866-885](index.html#L866-L885)）

| 调用 | 适用级别 | 描述 |
|------|---------|------|
| `vfx("gold")` | **S/A** | 金色径向闪光 1.8s — 突破/神器/机缘 |
| `vfx("red")` | **S/A** | 红色径向闪光 1.2s — 重伤/天劫/失败 |
| `vfx("blue")` | **A** | 蓝色径向闪光 1.5s — 神识/悟道/秘境 |
| `screenShake()` | **S/A** | 场景容器抖动 500ms |

**规则**：`vfx` 和 `screenShake` 同时调用会眩晕，**只能二选一**（除非 S 级）。

### 4.4 日志染色 `log(text, cls)` （[index.html:5781](index.html#L5781) + CSS [85-88](index.html#L85-L88), [330-335](index.html#L330-L335)）

| cls | 颜色 | 用途 |
|-----|------|------|
| 缺省 | 普通 | 旁白、动作描述 |
| `"sys"` | 金色 | 系统提示（境界、节气切换） |
| `"good"` | 翠绿 + ✦ | 正反馈（获得、成功） |
| `"bad"` | 朱红 + ✗ | 负反馈（失败、损伤） |
| `"hint"` | 灰色斜体 | 弱提示（不要刷屏） |
| `"epic"` | 米黄发光 + letter-spacing | **关键事件专用**（突破成功、机缘、剧情高潮） |
| `"crit"` | 浅红粗体 | 战斗暴击行 |
| `"dodge"` | 蓝色斜体 | 战斗闪避行 |

**规则**：`"epic"` 是稀缺资源。一场战斗最多出现 1~2 行。普通击杀**不要**用 epic。

### 4.5 成就横幅 `showAchieveToast(name)` （[index.html:12426](index.html#L12426)）

3.2 秒滑入式横幅，自带 SFX.achieve。复用此函数即可，不要另起灶台。

### 4.6 弹窗 `showModal(html)` / `confirmBox(text, onY, onN)` （[index.html:12700-12740](index.html#L12700-L12740)）

**核武器**：弹窗会让 `autoTick` 完全暂停（[index.html:13029-13050](index.html#L13029-L13050)）。即"自动模式被强制中断"。

只在以下情况用弹窗：
- S 级事件（天劫、飞升、转世）
- A 级需要玩家**决策**的事件（机缘三选一、突破前确认）
- A 级一次性叙事高潮（剧情链关键节点）

**绝对不要**在 B/C 级用弹窗推进信息。日志足矣。

### 4.7 场景级动效

| class | 适用级别 | 触发位置 |
|-------|---------|----------|
| `.scene.tribulation` ([index.html:351-361](index.html#L351-L361)) | **S** | 天劫开始时加到 `#scene` |
| `.bk-flash` ([index.html:365-367](index.html#L365-L367)) | **A** | 突破成功的金光脉冲 2.5s |

---

## 五、反馈模板（强制复用）

新增功能**必须从下表选一个模板**。需要新模板请先在 PR 里讨论，不要自由组合。

### TEMPLATE_C_KILL — C 级普通击杀

```js
log(`击败【${m.name}】，灵石 +${gain}`, "good");
// SFX.hit() 在攻击时已经响过，不要再叠
// 这一条已经占满 C 级 1 通道预算
```

### TEMPLATE_C_HIT — C 级攻击命中

```js
SFX.hit();
floatDmg("-" + dmg, isCrit ? "crit" : "");
// 注意：crit 文案染色 + floatDmg("crit") + SFX.hit 已是 3 通道，刚好踩 A 级边界
// 普通无暴击的命中只用 SFX.hit + floatDmg = 2 通道，但因为是"复合 1 个事件"算 1 通道也可
```

### TEMPLATE_C_PICKUP — C 级普通掉落

```js
log(`获得 ${itemName} ×${n}`, "good");
// 不加音效不加 vfx — 这就是 C 级
```

### TEMPLATE_B_ACHIEVE — B 级成就解锁

```js
showAchieveToast(a.nm);
SFX.achieve();
log(`🏆 成就解锁：${a.nm} — ${a.desc}`, "epic");
// 2~3 通道：横幅 + 音效 + epic 日志 — 是 B 级允许的上限
```

### TEMPLATE_B_RARE_DROP — B 级稀有掉落

```js
log(`✦ 获得稀有：${name}`, "good");
SFX.milestone();
floatDmg("+稀有", "heal");
// 不调 vfx — 那是 A 级的事
```

### TEMPLATE_A_BREAKTHROUGH — A 级境界突破成功

```js
log(`▓▓ 突破【${nextRealm}】成功！`, "epic");
SFX.thunder();
vfx("gold");
$("scene").classList.add("bk-flash");
setTimeout(()=>$("scene").classList.remove("bk-flash"), 2500);
// 3~4 通道：epic 日志 + 雷鸣 + 金闪 + 场景脉冲 — 触顶 A 级
// 不要再叠 screenShake 或 modal
```

### TEMPLATE_A_LEGENDARY — A 级神器/传说到手

```js
log(`✧✧ ${name} ✧✧`, "epic");
SFX.chime();
vfx("gold");
// 不要叠 floatDmg/screenShake — 让金光和钟鸣独享舞台
```

### TEMPLATE_A_BOSS_DEFEAT — A 级 Boss 击杀

```js
log(`▓ 你击败了【${boss.name}】！`, "epic");
SFX.thunder();
vfx("gold");
// 同上，3 通道封顶
```

### TEMPLATE_A_DANGER — A 级重伤/失败警示

```js
log(`✗ ${reason}`, "bad");
SFX.fail();
vfx("red");
screenShake();   // 红 vfx + screenShake 在此特许同用，因为是负反馈瞬间
// 4 通道，A 级允许，但仅限失败/重伤
```

### TEMPLATE_S_TRIBULATION — S 级天劫

```js
log(`▓ 天地变色，【${trib.name}】已至！`, "epic");
SFX.rumble();
vfx("red");
screenShake();
$("scene").classList.add("tribulation");
showModal(...);  // 决策弹窗
// 5 通道，S 级专属上限
```

### TEMPLATE_S_ASCEND — S 级飞升/转世

S 级事件**逐个手写**，不复用模板，但仍遵守预算。需在改动说明里详细列出每条通道。

### TEMPLATE_NARRATIVE — 剧情/事件链节点

```js
log("（剧情正文，2~4 行）", "");           // 普通色，让正文呼吸
log("✦ 关键转折一句", "epic");              // 全段只允许 1 行 epic
// 不加 SFX/vfx，让玩家集中读字 —— 除非是剧情链的高潮节点（升级为 A 级处理）
```

---

## 六、自动模式降级规则

游戏核心体验是挂机（[index.html:13029-13110](index.html#L13029-L13110)，AUTO.interval 默认 700ms，5x 速度时降到约 140ms）。

**规则**：

1. **任何 `showModal()` 都会暂停自动循环** —— 这是核武器。C/B 级**不允许**使用。
2. **5x 速度下，C 级反馈应该考虑跳过动画**：高频 `floatDmg` 在 5x 下会糊成一片。可以加 `if(AUTO.interval < 200) return;` 提前返回，只更新数字。
3. **A 级以下，自动模式下默认不弹 modal**。剧情/事件链如果是 B 级，用 `log("epic")` 推进；要弹窗，先升级到 A。
4. **S 级强制中断挂机** —— 这是设计意图，玩家本来就该看。

---

## 七、反例归档（最重要的一节）

> AI 学反例的效率远高于学规则。提交时若看到类似反例代码，**先停下检查分级**。

### 反例 1：C 级事件用了 S 级排场

```js
// ✗ 普通击杀就这么炸
function killMobBad(m){
  screenShake();              // ✗ C 级不该屏幕震动
  vfx("red");                  // ✗ 同时震动 + 滤镜 = 红线 §二
  SFX.hit(); SFX.thunder(); SFX.milestone();  // ✗ 3 个音效叠加
  showModal("击败！");         // ✗ 自动模式被打断
  log("击杀！", "epic");       // ✗ epic 滥用，普通击杀不配
}
```

```js
// ✓ 普通击杀，1~2 通道
function killMobGood(m){
  log(`击败【${m.name}】，灵石 +${gain}`, "good");
  // 攻击时 SFX.hit + floatDmg 已经响过，结算时不再重复
}
```

### 反例 2：epic 滥用导致稀释

```js
// ✗ 一场战斗 8 行 epic
log("你拔剑出鞘", "epic");
log("剑光如电", "epic");
log("击中弱点", "epic");
log("造成 1234 伤害", "epic");
// 玩家看完一场战斗，眼前全是米黄发光字，再也认不出哪句是真的关键
```

```js
// ✓ 战斗叙事用默认色，转折用 epic
log("你拔剑出鞘，剑光如电，击中弱点。");
log("✦ 触发心法领悟！", "epic");   // 仅此一行用 epic
```

### 反例 3：高频事件用弹窗

```js
// ✗ 每场战斗结束都弹窗
function endBattle(){
  showModal(`战斗结束！获得 ${gold} 灵石`);
  // 玩家自动挂机 30 场，回来要点 30 次确认 —— 灾难
}
```

```js
// ✓ 写日志即可
function endBattle(){
  log(`战斗结束，灵石 +${gold}`, "good");
}
```

### 反例 4：忘记自动模式降级

```js
// ✗ 5x 速度下，每秒触发 7 次浮动伤害动画
function attack(){
  floatDmg("-" + dmg);
  floatDmg("元素加成", "heal");
  floatDmg("暴击!", "crit");
  // 三个浮动同时存在，5x 下糊成色块
}
```

```js
// ✓ 合并 / 节流
function attack(){
  const label = isCrit ? `-${dmg} 暴击!` : `-${dmg}`;
  floatDmg(label, isCrit ? "crit" : "");
}
```

---

## 八、改动检查清单（提交前过一遍）

```
□ 我标了 S/A/B/C 分级，写在 commit/PR 说明里
□ 我用的通道数 ≤ 分级预算
□ 我从 §五模板表选了一个，或在 PR 写明为何要自创
□ 我自检了 §二红线没有踩
□ 我考虑了自动模式行为（完整 / 降级 / 跳过）
□ 我先 grep 了 §四已有原语，能复用就没新建
□ 改动包含新 epic 日志的，全文件 epic 行数仍在合理范围
□ 改动包含新 SFX.thunder/rumble/chime 调用的，调用点是 A 级及以上
```

---

## 九、什么时候才能新增反馈原语

只有满足以下**全部**条件，才允许新增 `SFX.*`、`vfx-*` class、新动画 keyframes：

1. 现有 §四 9 种 SFX、3 种 vfx、8 种 log cls **都不合适**
2. 新原语是**可复用的**（至少 3 个独立场景会用到）
3. 在 PR 描述里说明：为什么旧的不够，新原语属于哪个分级，避免哪些红线
4. 同时更新本文档 §四 锚点表

**不满足以上的，请复用现有原语。** 哪怕觉得"略微不完美"也复用 —— 一致性 > 微优化。

---

## 附：本文档维护

- 新增 SFX/vfx/动画/模板 → 必须更新本文档对应章节
- 行号锚点过期 → grep 函数名修正
- 红线/反例发现新的 → 加入 §二 / §七
