# -*- coding: utf-8 -*-
"""
凡人修仙路 —— 纯文字修仙游戏
运行: python xiuxian.py
"""
import json
import os
import random
import sys
import time

SAVE_FILE = "save.json"

# ============ 数据定义 ============

REALMS = [
    ("凡人",       0),
    ("练气一层",  100),
    ("练气三层",  300),
    ("练气六层",  700),
    ("练气九层", 1200),
    ("筑基初期", 2000),
    ("筑基中期", 3500),
    ("筑基后期", 5500),
    ("筑基大圆满", 8000),
    ("金丹初期",12000),
    ("金丹中期",18000),
    ("金丹后期",26000),
    ("元婴初期",40000),
    ("元婴中期",60000),
    ("元婴后期",90000),
    ("化神期",  140000),
    ("炼虚期",  220000),
    ("合体期",  340000),
    ("大乘期",  520000),
    ("渡劫期",  800000),
    ("仙人",   1200000),
]

SPIRIT_ROOTS = [
    ("废灵根",   0.5,  "天资愚钝，修炼缓慢"),
    ("单灵根",   2.0,  "万中无一的修炼奇才"),
    ("双灵根",   1.5,  "上佳之资"),
    ("三灵根",   1.2,  "资质不错"),
    ("四灵根",   1.0,  "中规中矩"),
    ("五灵根",   0.8,  "资质平庸"),
    ("天灵根",   3.0,  "传说中的修炼至宝"),
]

# 功法: (名称, 修为加成, 攻击加成, 描述)
TECHNIQUES = {
    "引气诀":     (1.0, 0,  "最基础的入门功法"),
    "玄阴真经":   (1.3, 5,  "阴寒入骨，修为大进"),
    "烈阳剑诀":   (1.2, 12, "至阳剑意，攻伐犀利"),
    "九转玄功":   (1.6, 8,  "古老传承，威力无穷"),
    "太上忘情":   (2.0, 15, "传说仙诀，斩断七情"),
}

# 物品库
ITEMS = {
    "聚气丹":   {"type":"丹药","cult":50,  "desc":"+50修为"},
    "凝神丹":   {"type":"丹药","cult":150, "desc":"+150修为"},
    "筑基丹":   {"type":"丹药","cult":500, "desc":"+500修为"},
    "金创药":   {"type":"丹药","hp":50,    "desc":"恢复50气血"},
    "回元丹":   {"type":"丹药","hp":200,   "desc":"恢复200气血"},
    "破障丹":   {"type":"丹药","luck":20,  "desc":"突破时大幅提升成功率"},
    "灵石":     {"type":"货币","desc":"修真界通用货币"},
}

# 妖兽: (名字, 等级要求, 气血, 攻击, 修为奖励, 灵石奖励)
MONSTERS = [
    ("黑风狼",   0,   30,  5,  20,  5),
    ("赤焰狐",   3,   80,  10, 60,  15),
    ("玄铁蟒",   6,   200, 20, 150, 40),
    ("血煞修士", 9,   400, 35, 300, 80),
    ("筑基妖修", 12,  800, 55, 600, 200),
    ("化形蛟龙", 15,  2000,90, 1500,500),
    ("元婴老怪", 18,  5000,150,4000,1200),
    ("散修剑仙", 20,  10000,250,9000,3000),
]

# 奇遇事件
ADVENTURES = [
    {
        "text": "你在山间偶遇一位白发老者，他看你骨骼清奇，传你一道口诀。",
        "effect": lambda p: p.gain_cult(random.randint(50, 200), reason="老者授法")
    },
    {
        "text": "你发现一处隐秘洞府，洞中有一小瓶丹药！",
        "effect": lambda p: p.add_item("聚气丹", random.randint(1, 3))
    },
    {
        "text": "你在溪边洗剑，捡到几块灵石。",
        "effect": lambda p: p.add_item("灵石", random.randint(5, 30))
    },
    {
        "text": "天降惊雷，你被劈得外焦里嫩……不过似乎打通了一处经脉？",
        "effect": lambda p: (p.take_damage(30), p.gain_cult(80, reason="雷劫淬体"))
    },
    {
        "text": "你救下一名落难修士，他赠你一枚回元丹后离去。",
        "effect": lambda p: p.add_item("回元丹", 1)
    },
    {
        "text": "古墓深处，你看到一卷功法残篇……",
        "effect": "technique"
    },
    {
        "text": "你不慎踩中阵法，被传送到一处险地，险些殒命！",
        "effect": lambda p: p.take_damage(random.randint(20, 80))
    },
    {
        "text": "天降异象，紫气东来三万里，你心有所感，闭目顿悟。",
        "effect": lambda p: p.gain_cult(random.randint(200, 600), reason="顿悟天机")
    },
    {
        "text": "山神庙中，一位仙姑微微一笑，赠你一枚破障丹。",
        "effect": lambda p: p.add_item("破障丹", 1)
    },
    {
        "text": "你在药园中采到一株千年灵芝，炼制成筑基丹！",
        "effect": lambda p: p.add_item("筑基丹", 1)
    },
]

# ============ 工具 ============

def slow_print(text, delay=0.015):
    for ch in text:
        sys.stdout.write(ch)
        sys.stdout.flush()
        time.sleep(delay)
    print()

def line(ch="─", n=44):
    print(ch * n)

def pause():
    try:
        input("\n（按回车继续……）")
    except EOFError:
        pass

# ============ 玩家 ============

class Player:
    def __init__(self, name, root_idx):
        self.name = name
        self.root_idx = root_idx
        self.cultivation = 0          # 当前修为
        self.realm_idx = 0            # 当前境界
        self.hp = 100
        self.max_hp = 100
        self.atk = 10
        self.age = 16
        self.lifespan = 80
        self.technique = "引气诀"
        self.inventory = {"灵石": 10, "聚气丹": 2, "金创药": 2}
        self.days = 0                 # 修行天数

    # ---- 属性 ----
    @property
    def root_name(self):  return SPIRIT_ROOTS[self.root_idx][0]
    @property
    def root_mul(self):   return SPIRIT_ROOTS[self.root_idx][1]
    @property
    def realm_name(self): return REALMS[self.realm_idx][0]
    @property
    def next_threshold(self):
        if self.realm_idx + 1 >= len(REALMS):
            return None
        return REALMS[self.realm_idx + 1][1]
    @property
    def tech_mul(self):   return TECHNIQUES[self.technique][0]
    @property
    def tech_atk(self):   return TECHNIQUES[self.technique][1]
    @property
    def total_atk(self):  return self.atk + self.tech_atk + self.realm_idx * 5

    # ---- 操作 ----
    def gain_cult(self, base, reason=""):
        amt = int(base * self.root_mul * self.tech_mul)
        self.cultivation += amt
        msg = f"修为 +{amt}"
        if reason:
            msg = f"【{reason}】 " + msg
        slow_print(msg)

    def take_damage(self, dmg):
        self.hp = max(0, self.hp - dmg)
        slow_print(f"你受到 {dmg} 点伤害，剩余气血 {self.hp}/{self.max_hp}")

    def heal(self, amt):
        self.hp = min(self.max_hp, self.hp + amt)
        slow_print(f"恢复 {amt} 点气血，当前 {self.hp}/{self.max_hp}")

    def add_item(self, name, n=1):
        self.inventory[name] = self.inventory.get(name, 0) + n
        slow_print(f"获得 {name} x{n}")

    def use_item(self, name):
        if self.inventory.get(name, 0) <= 0:
            print("没有这个东西。")
            return False
        info = ITEMS.get(name)
        if not info or info["type"] != "丹药":
            print("不能使用。")
            return False
        if "cult" in info:
            self.gain_cult(info["cult"], reason=f"服用{name}")
        if "hp" in info:
            self.heal(info["hp"])
        self.inventory[name] -= 1
        if self.inventory[name] <= 0:
            del self.inventory[name]
        return True

    def pass_days(self, n):
        self.days += n
        # 每 30 天长 1 岁（简化）
        years = (self.days) // 360 + 16 - self.age
        if years > 0:
            self.age += years

    def alive(self):
        return self.hp > 0 and self.age < self.lifespan

    # ---- 突破 ----
    def try_breakthrough(self):
        if self.next_threshold is None:
            slow_print("你已达修真巅峰，再无可破之境。")
            return
        if self.cultivation < self.next_threshold:
            slow_print(f"修为不足，距离 {REALMS[self.realm_idx+1][0]} 还需 "
                       f"{self.next_threshold - self.cultivation} 修为。")
            return
        # 成功率: 受灵根、丹药影响
        base = 0.45 + self.root_mul * 0.05
        bonus = 0
        if self.inventory.get("破障丹", 0) > 0:
            use = input("是否服用 破障丹 助力突破？(y/n): ").strip().lower()
            if use == "y":
                self.inventory["破障丹"] -= 1
                if self.inventory["破障丹"] <= 0:
                    del self.inventory["破障丹"]
                bonus += 0.25
                slow_print("丹药入腹，灵气如潮涌动……")
        rate = min(0.95, base + bonus)
        slow_print(f"开始冲击 {REALMS[self.realm_idx+1][0]}！成功率约 {int(rate*100)}%……")
        time.sleep(0.6)
        if random.random() < rate:
            self.realm_idx += 1
            self.max_hp += 50 + self.realm_idx * 20
            self.hp = self.max_hp
            self.atk += 5 + self.realm_idx * 2
            self.lifespan += 30 + self.realm_idx * 20
            slow_print(f"轰隆——！天地灵气倒灌，你成功突破至【{self.realm_name}】！")
            slow_print(f"气血上限提升，寿元增长，攻伐之力大涨！")
        else:
            dmg = 30 + self.realm_idx * 15
            self.take_damage(dmg)
            self.cultivation = int(self.cultivation * 0.7)
            slow_print("突破失败，经脉受损，修为倒退！")

    # ---- 状态面板 ----
    def show(self):
        line("═")
        print(f"  道号：{self.name}    境界：{self.realm_name}")
        print(f"  灵根：{self.root_name}（{SPIRIT_ROOTS[self.root_idx][2]}）")
        print(f"  修为：{self.cultivation}" +
              (f" / {self.next_threshold}" if self.next_threshold else " / 圆满"))
        print(f"  气血：{self.hp}/{self.max_hp}    攻击：{self.total_atk}")
        print(f"  寿元：{self.age}/{self.lifespan}    修行：{self.days}天")
        print(f"  功法：{self.technique}（{TECHNIQUES[self.technique][2]}）")
        bag = "，".join(f"{k}x{v}" for k, v in self.inventory.items()) or "空空如也"
        print(f"  储物袋：{bag}")
        line("═")

# ============ 战斗 ============

def battle(player, monster):
    name, lvl, mhp, matk, cult_r, ls_r = monster
    slow_print(f"※ 一只 {name}（气血 {mhp}，攻击 {matk}）拦住了你的去路！")
    while mhp > 0 and player.hp > 0:
        line()
        print(f"  你: {player.hp}/{player.max_hp}    {name}: {mhp}")
        print("  [1] 攻击   [2] 用丹药   [3] 逃跑")
        c = input("  选择: ").strip()
        if c == "1":
            dmg = max(1, player.total_atk + random.randint(-3, 6))
            mhp -= dmg
            slow_print(f"你一击命中，造成 {dmg} 点伤害。")
            if mhp <= 0:
                break
            mdmg = max(1, matk + random.randint(-2, 4) - player.realm_idx * 2)
            player.take_damage(mdmg)
        elif c == "2":
            heals = [k for k in player.inventory if ITEMS.get(k, {}).get("hp")]
            if not heals:
                print("  没有恢复类丹药。")
                continue
            for i, k in enumerate(heals, 1):
                print(f"   {i}.{k} x{player.inventory[k]}")
            try:
                idx = int(input("  使用第几个: ")) - 1
                player.use_item(heals[idx])
            except (ValueError, IndexError):
                print("  取消。")
        elif c == "3":
            if random.random() < 0.5 + 0.05 * (player.realm_idx - lvl):
                slow_print("你脚踏遁光，成功逃离。")
                return False
            else:
                slow_print("逃跑失败！")
                player.take_damage(matk)
        else:
            print("  听不懂。")

    if player.hp <= 0:
        return False
    slow_print(f"※ 你击败了 {name}！")
    player.gain_cult(cult_r, reason="斩妖")
    player.add_item("灵石", ls_r)
    if random.random() < 0.25:
        drop = random.choice(["金创药", "聚气丹", "凝神丹", "回元丹"])
        player.add_item(drop, 1)
    return True

# ============ 行动 ============

def action_cultivate(p):
    days = 7
    base = 10 + p.realm_idx * 5
    total = 0
    for _ in range(days):
        total += base + random.randint(-2, 4)
    p.gain_cult(total, reason=f"闭关{days}日")
    p.pass_days(days)

def action_adventure(p):
    p.pass_days(3)
    if random.random() < 0.55:
        # 奇遇
        ev = random.choice(ADVENTURES)
        slow_print("✦ " + ev["text"])
        eff = ev["effect"]
        if eff == "technique":
            new = random.choice([k for k in TECHNIQUES if k != p.technique])
            old_mul = TECHNIQUES[p.technique][0]
            new_mul = TECHNIQUES[new][0]
            slow_print(f"残篇所载乃《{new}》（{TECHNIQUES[new][2]}）")
            if new_mul > old_mul:
                ans = input(f"是否替换当前的《{p.technique}》？(y/n): ").strip().lower()
                if ans == "y":
                    p.technique = new
                    slow_print(f"你改修《{new}》。")
            else:
                slow_print("此功法不及你当前所修，弃之。")
        else:
            eff(p)
    else:
        # 战斗
        candidates = [m for m in MONSTERS if m[1] <= p.realm_idx + 2]
        if not candidates:
            candidates = [MONSTERS[0]]
        m = random.choice(candidates)
        battle(p, m)

def action_use_item(p):
    drugs = [k for k, v in p.inventory.items()
             if ITEMS.get(k, {}).get("type") == "丹药"]
    if not drugs:
        print("没有可服用的丹药。")
        return
    for i, k in enumerate(drugs, 1):
        print(f"  {i}. {k} x{p.inventory[k]} — {ITEMS[k]['desc']}")
    try:
        idx = int(input("使用第几个 (0 取消): ")) - 1
        if idx < 0:
            return
        p.use_item(drugs[idx])
    except (ValueError, IndexError):
        print("取消。")

# ============ 存档 ============

def save_game(p):
    data = {
        "name": p.name, "root_idx": p.root_idx,
        "cultivation": p.cultivation, "realm_idx": p.realm_idx,
        "hp": p.hp, "max_hp": p.max_hp, "atk": p.atk,
        "age": p.age, "lifespan": p.lifespan,
        "technique": p.technique, "inventory": p.inventory,
        "days": p.days,
    }
    with open(SAVE_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    slow_print("※ 已记录于玉简之中。")

def load_game():
    if not os.path.exists(SAVE_FILE):
        return None
    try:
        with open(SAVE_FILE, "r", encoding="utf-8") as f:
            d = json.load(f)
        p = Player(d["name"], d["root_idx"])
        for k, v in d.items():
            setattr(p, k, v)
        return p
    except Exception as e:
        print("读档失败：", e)
        return None

# ============ 主流程 ============

def create_role():
    line("═")
    slow_print("天地玄黄，宇宙洪荒……一缕神识自虚空降临。")
    name = input("请输入你的道号: ").strip() or "无名"
    slow_print("测灵根中……")
    time.sleep(0.5)
    # 随机灵根: 偏正态
    weights = [5, 1, 4, 8, 12, 8, 0.3]   # 对应 SPIRIT_ROOTS
    root_idx = random.choices(range(len(SPIRIT_ROOTS)), weights=weights)[0]
    sr = SPIRIT_ROOTS[root_idx]
    slow_print(f"※ 你的灵根是：【{sr[0]}】 修炼速度 x{sr[1]}")
    slow_print(f"   {sr[2]}")
    ans = input("是否接受此命？(y=接受, n=重测): ").strip().lower()
    if ans == "n":
        return create_role()
    return Player(name, root_idx)

def title():
    print()
    line("═")
    print("            《 凡 人 修 仙 路 》")
    print("       —— 一个纯文字的修仙世界 ——")
    line("═")

def main_menu():
    title()
    p = load_game()
    if p:
        print(f"  发现旧档：{p.name} · {p.realm_name}")
        print("  [1] 继续旧梦   [2] 重启轮回   [3] 退出")
    else:
        print("  [1] 踏入仙途   [2] 退出")
    c = input("> ").strip()
    if p:
        if c == "1": return p
        if c == "2":
            os.remove(SAVE_FILE)
            return create_role()
        sys.exit(0)
    else:
        if c == "1": return create_role()
        sys.exit(0)

def game_loop(p):
    slow_print(f"\n《{p.name}》自此踏上修仙之路……\n")
    while p.alive():
        line()
        print(f"  {p.name} | {p.realm_name} | 修为 {p.cultivation}"
              f" | HP {p.hp}/{p.max_hp} | 寿 {p.age}/{p.lifespan}")
        print("  [1] 闭关修炼   [2] 历练奇遇   [3] 尝试突破")
        print("  [4] 服用丹药   [5] 查看状态   [6] 存档   [0] 退出")
        c = input("> ").strip()
        if c == "1": action_cultivate(p)
        elif c == "2": action_adventure(p)
        elif c == "3": p.try_breakthrough()
        elif c == "4": action_use_item(p)
        elif c == "5": p.show()
        elif c == "6": save_game(p)
        elif c == "0":
            ans = input("是否在离开前存档？(y/n): ").strip().lower()
            if ans == "y": save_game(p)
            slow_print("仙途漫漫，他日再会。")
            return
        else:
            print("  听不懂你说啥。")

    line("═")
    if p.age >= p.lifespan:
        slow_print(f"※ 寿元已尽，{p.name} 在 {p.realm_name} 之境飘然坐化。")
    else:
        slow_print(f"※ {p.name} 道陨于此，魂归天地。")
    slow_print(f"   修行 {p.days} 天，最终境界：{p.realm_name}")
    if os.path.exists(SAVE_FILE):
        os.remove(SAVE_FILE)

def main():
    try:
        p = main_menu()
        game_loop(p)
    except KeyboardInterrupt:
        print("\n（中断离场）")

if __name__ == "__main__":
    main()
