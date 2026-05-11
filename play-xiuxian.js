#!/usr/bin/env node
/**
 * Headless playtest harness for 凡人修仙路
 * Mocks browser DOM, evals game JS, runs an AI player through ~300 actions.
 */
const fs = require('fs');
const vm = require('vm');

// ============ DOM MOCK ============
const elements = {};
function mockEl(id) {
  if (id && elements[id]) return elements[id];
  const el = {
    id: id || '', tagName: 'DIV',
    textContent: '', innerHTML: '', className: '', value: '',
    type: '', checked: false, disabled: false, href: '',
    style: new Proxy({}, { set:()=>true, get:()=>'' }),
    classList: {
      _c: new Set(),
      add(...args){ args.forEach(a=>this._c.add(a)); },
      remove(...args){ args.forEach(a=>this._c.delete(a)); },
      contains(c){ return this._c.has(c); },
      toggle(c){ this._c.has(c)?this._c.delete(c):this._c.add(c); },
    },
    children: [], childNodes: [], childElementCount: 0,
    scrollTop: 0, scrollHeight: 100,
    appendChild(c){ this.children.push(c); this.childNodes.push(c); this.childElementCount++; if(c) c.parentNode=this; return c; },
    removeChild(c){ const i=this.children.indexOf(c); if(i>=0){this.children.splice(i,1); this.childElementCount--;} },
    get firstChild(){ return this.children[0]||null; },
    get lastChild(){ return this.children[this.children.length-1]||null; },
    insertBefore(n,r){ this.children.unshift(n); this.childElementCount++; return n; },
    replaceChild(n,o){ const i=this.children.indexOf(o); if(i>=0) this.children[i]=n; return o; },
    addEventListener(){}, removeEventListener(){},
    getBoundingClientRect(){ return {width:100,height:100,top:0,left:0,right:100,bottom:100}; },
    querySelectorAll(sel){ return []; },
    querySelector(sel){ return mockEl(); },
    closest(){ return null; },
    focus(){}, blur(){}, click(){}, select(){},
    setAttribute(k,v){ this[k]=v; },
    getAttribute(k){ return this[k]||null; },
    removeAttribute(){},
    hasAttribute(){ return false; },
    dataset: new Proxy({}, {get:()=>'', set:()=>true}),
    parentNode: null, parentElement: null, nextSibling: null, previousSibling: null,
    cloneNode(){ return mockEl(); },
    replaceWith(){}, remove(){},
    onclick: null, oninput: null, onchange: null, onkeydown: null,
    offsetWidth: 100, offsetHeight: 100, offsetTop: 0, offsetLeft: 0,
    scrollIntoView(){},
    matches(){ return false; },
    contains(){ return false; },
    getContext(){ return { fillRect(){}, clearRect(){}, fillText(){}, measureText(){ return {width:10}; }, beginPath(){}, moveTo(){}, lineTo(){}, stroke(){}, arc(){}, fill(){}, save(){}, restore(){}, translate(){}, rotate(){}, scale(){}, drawImage(){}, createLinearGradient(){ return {addColorStop(){}}; }, canvas:{width:100,height:100} }; },
  };
  if(id) elements[id] = el;
  return el;
}

// Pre-create elements
['log','scene-title','scene-sub','btn-area','status','modal','modal-box',
 'stat-detail','equip-detail','bag-detail','market-detail','sect-detail',
 'quest-detail','pet-detail','auto-status','dungeon-detail',
 'ipt-name','cr-ok','rr-ok','rr-no','m-restart','m-revive',
 'bgm-toggle','sfx-toggle','save-indicator','dev-fab','dev-drawer','dev-toast',
].forEach(id => mockEl(id));

global.document = {
  getElementById: (id) => mockEl(id),
  createElement: (tag) => { const e=mockEl(); e.tagName=tag.toUpperCase(); return e; },
  createTextNode: (t) => { const e=mockEl(); e.textContent=t; return e; },
  createDocumentFragment: () => mockEl(),
  querySelector: (sel) => mockEl(),
  querySelectorAll: () => [],
  body: mockEl('body'),
  head: mockEl('head'),
  documentElement: mockEl('html'),
  addEventListener(){},
  removeEventListener(){},
  createEvent: () => ({ initEvent(){} }),
  cookie: '',
  title: '',
  readyState: 'complete',
};

global.window = global;
global.self = global;
global.navigator = { userAgent:'node', language:'zh-CN', onLine:true };
global.location = { href:'file:///test', hostname:'', search:'', hash:'' };
global.history = { pushState(){}, replaceState(){} };
global.performance = { now: Date.now };
global.matchMedia = () => ({ matches:false, addEventListener(){} });
global.getComputedStyle = () => new Proxy({},{get:()=>'0'});
global.ResizeObserver = class { observe(){} unobserve(){} disconnect(){} };
global.MutationObserver = class { observe(){} disconnect(){} };
global.IntersectionObserver = class { observe(){} disconnect(){} };
global.fetch = () => Promise.resolve({json:()=>({})});
global.XMLHttpRequest = class {};
global.Image = class { set src(v){} };
global.CSS = { supports:()=>false };

global.localStorage = {
  _d:{}, getItem(k){return this._d[k]||null;}, setItem(k,v){this._d[k]=String(v);},
  removeItem(k){delete this._d[k];}, clear(){this._d={};},
};

global.alert = () => {};
global.confirm = () => true;
global.prompt = () => '测试仙人';

// Audio mock
class MockAudioCtx {
  createOscillator(){return{connect(){},start(){},stop(){},frequency:{value:0,setValueAtTime(){},exponentialRampToValueAtTime(){},linearRampToValueAtTime(){}},type:'sine',detune:{value:0}};}
  createGain(){return{connect(){},gain:{value:1,setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}}};}
  createBiquadFilter(){return{connect(){},frequency:{value:0,setValueAtTime(){}},Q:{value:0},type:'lowpass'};}
  createConvolver(){return{connect(){},buffer:null};}
  createBuffer(){return{getChannelData(){return new Float32Array(100);}};}
  createBufferSource(){return{connect(){},start(){},stop(){},buffer:null,loop:false,playbackRate:{value:1}};}
  createDynamicsCompressor(){return{connect(){},threshold:{value:0},knee:{value:0},ratio:{value:0},attack:{value:0},release:{value:0}};}
  get destination(){return {};}
  get currentTime(){return 0;}
  get sampleRate(){return 44100;}
  resume(){return Promise.resolve();}
  close(){return Promise.resolve();}
}
global.AudioContext = MockAudioCtx;
global.webkitAudioContext = MockAudioCtx;

// ============ TIMING MOCK ============
const _timeouts = [];
let _tid = 0;
global.setTimeout = (fn, ms) => {
  const id = ++_tid;
  _timeouts.push({id, fn});
  return id;
};
global.clearTimeout = (id) => {
  const i = _timeouts.findIndex(t=>t&&t.id===id);
  if(i>=0) _timeouts.splice(i,1);
};
global.setInterval = () => ++_tid;
global.clearInterval = () => {};
global.requestAnimationFrame = (fn) => ++_tid;
global.cancelAnimationFrame = () => {};

function flushTimeouts(max=50){
  let n=0;
  while(_timeouts.length && n++<max){
    const t = _timeouts.shift();
    if(t && t.fn) try{ t.fn(); }catch(e){}
  }
}

// ============ LOAD GAME ============
const html = fs.readFileSync('/Users/martin/xiuxian/index.html','utf8');
const scripts = [];
html.replace(/<script[^>]*>([\s\S]*?)<\/script>/g, (m, code) => {
  scripts.push(code);
});
const mainScript = scripts.reduce((a,b) => a.length>b.length ? a : b);

// Suppress bootstrap() — we'll init manually
let modScript = mainScript.replace(/^bootstrap\(\);/m, '// bootstrap() suppressed by test harness');

// Bridge script-scoped const/let to global for harness access
modScript += `
// == HARNESS BRIDGE ==
global.REALMS = REALMS;
global.MONSTERS = MONSTERS;
global.ITEMS = ITEMS;
global.ROOTS = ROOTS;
global.SKILLS = SKILLS;
global.EQUIPS = typeof EQUIPS !== 'undefined' ? EQUIPS : {};
global.OVERCOME = typeof OVERCOME !== 'undefined' ? OVERCOME : {};
global.BASE_STATS = typeof BASE_STATS !== 'undefined' ? BASE_STATS : [];
global._getP = () => P;
global._setP = (v) => { P = v; };
`;

// Capture logs
const gameLogs = [];

try {
  // Use vm.runInThisContext so const/let/function all bind to global scope
  vm.runInThisContext(modScript, {filename: 'xiuxian-game.js'});
} catch(e) {
  console.error('EVAL ERROR:', e.message, '\n', e.stack?.split('\n').slice(0,5).join('\n'));
}

// Verify game loaded
const funcs = ['newPlayer','recalcStats','actCultivate','actAdventure','battleAttack',
  'battleHeal','battleFlee','startBattle','gameOver','alive','actBreakthrough',
  'refresh','bindMainButtons','saveGame','log','REALMS','MONSTERS','P'];
const missing = funcs.filter(f => typeof global[f] === 'undefined');
if(missing.length) {
  console.error('Missing:', missing.join(', '));
  // If critical functions missing, bail
  if(missing.includes('newPlayer') || missing.includes('actCultivate')) {
    console.error('Critical functions missing, cannot continue.');
    process.exit(1);
  }
}

// Override log to capture
const origLog = global.log;
global.log = function(text, cls) {
  gameLogs.push({text, cls: cls||''});
  try { origLog.call(this, text, cls); } catch(e){}
};

// Auto-click confirmBox "yes" button (e.g., "use 破障丹?")
const origConfirmBox = global.confirmBox;
if(origConfirmBox) {
  global.confirmBox = function(text, onYes, onNo) {
    // Always say yes (use pills, etc.)
    if(onYes) onYes();
  };
}

// Auto-handle showModal by auto-clicking primary buttons after a flush
const origShowModal = global.showModal;
global.showModal = function(html) {
  try { origShowModal.call(this, html); } catch(e){}
  // Extract button IDs and auto-click the primary one
  const btnMatch = html.match(/id="([^"]+)"[^>]*class="primary"/);
  if(btnMatch) {
    setTimeout(() => {
      const btn = elements[btnMatch[1]];
      if(btn && btn.onclick) btn.onclick();
    }, 0);
  }
};

// ============ GAME STATE HELPERS ============
function getState() {
  const p = _getP();
  if(!p) return null;
  return {
    name: p.name, realm: p.realmIdx, cult: p.cult,
    hp: p.hp, maxHp: p.maxHp, mp: p.mp, maxMp: p.maxMp,
    atk: p.atk, def: p.def,
    age: p.age, lifespan: p.lifespan,
    stones: p.bag?.["灵石"]||0,
    inBattle: p.inBattle,
    monster: p.monster ? {
      name: p.monster.name, hp: p.monster.mhp, maxHp: p.monster.maxMhp,
      atk: p.monster.matk, healCount: p.monster.healCount||0,
      combo: p.monster.combo||0, telegraphing: p.monster.telegraphing,
      breakGauge: p.monster.breakGauge||0, breakMax: p.monster.breakMax||3,
      breakRounds: p.monster.breakRounds||0,
    } : null,
    equips: p.equips ? Object.entries(p.equips).filter(([k,v])=>v).map(([k,v])=>`${k}:${v}`) : [],
    days: p.days,
  };
}

function stateStr(s) {
  if(!s) return '[NO STATE]';
  const realmName = typeof REALMS!=='undefined' ? REALMS[s.realm]?.[0] : `r${s.realm}`;
  const parts = [
    `[${realmName}]`,
    `HP:${s.hp}/${s.maxHp}`,
    `ATK:${s.atk||'?'} DEF:${s.def||'?'}`,
    `修为:${s.cult}`,
    `石:${s.stones}`,
    `寿:${s.age}/${s.lifespan}`,
    `d${s.days}`,
  ];
  if(s.inBattle && s.monster) {
    parts.push(`| ⚔${s.monster.name} HP:${s.monster.hp}/${s.monster.maxHp} ATK:${s.monster.atk} 药:${s.monster.healCount}/2`);
    if(s.monster.telegraphing) parts.push('⚠蓄力');
    if(s.monster.breakRounds>0) parts.push('💥破防');
  }
  if(s.equips.length) parts.push(`[${s.equips.join(',')}]`);
  return parts.join(' ');
}

function dumpLogs(tag, filter) {
  if(!gameLogs.length) return;
  const batch = gameLogs.splice(0);
  let show;
  if(filter) {
    show = batch.filter(l =>
      l.cls === 'bad' || l.cls === 'epic' || l.cls === 'sys' ||
      /灵石|突破|折寿|丹毒|蓄力|破防|击败|道陨|重生|装备|死|寿元/.test(l.text)
    );
  } else {
    show = batch;
  }
  if(show.length) {
    console.log(`  ${tag}: ${show.map(l=>l.text.replace(/\s+/g,'')).join(' | ')}`);
  }
}

// ============ AI PLAYER ============
let stats = { deaths:0, battles:0, wins:0, bkAttempts:0, bkFails:0, heals:0, flees:0, cultActions:0, advActions:0 };
let highestRealm = 0;
let totalActions = 0;
let actionCounter = 0; // for alternation

function doBattle() {
  const p = _getP();
  const m = p.monster;
  if(!m) return;
  stats.battles++;

  // Telegraph → flee
  if(m.telegraphing) {
    stats.flees++;
    try { battleFlee(); } catch(e){}
    flushTimeouts();
    return;
  }

  // Low HP → heal or flee
  const hpRatio = p.hp / (p.maxHp||1);
  const hitsToKill = Math.ceil(p.hp / Math.max(1, m.matk));
  if(hpRatio < 0.4 || hitsToKill <= 3) {
    if((m.healCount||0) < 2) {
      const hasHeal = Object.keys(p.bag||{}).some(k => typeof ITEMS!=='undefined' && ITEMS[k] && ITEMS[k].hp);
      if(hasHeal) {
        stats.heals++;
        try { battleHeal(); } catch(e){}
        flushTimeouts();
        return;
      }
    }
    stats.flees++;
    try { battleFlee(); } catch(e){}
    flushTimeouts();
    return;
  }

  // Attack
  try { battleAttack(); } catch(e){}
  flushTimeouts();
  if(!p.inBattle) stats.wins++;
}

function doAction() {
  const p = _getP();
  if(!p) return false;
  if(typeof alive==='function' && !alive(p)) return false;

  totalActions++;

  // In battle → fight
  if(p.inBattle && p.monster) {
    doBattle();
    dumpLogs('⚔', true);
    return true;
  }

  // Stuck in tribulation? Clear it.
  if(p.tribulation || (p.inBattle && !p.monster)) {
    // Tribulation modal — can't interact via CLI. Force-resolve.
    const beforeRealm = p.realmIdx;
    try { doBreakthroughSuccess(); } catch(e){}
    flushTimeouts(100);
    p.inBattle = false;
    p.tribulation = null;
    if(p.realmIdx > beforeRealm) {
      highestRealm = Math.max(highestRealm, p.realmIdx);
      console.log(`  ✓ 天劫渡过！→ ${REALMS[p.realmIdx][0]} | HP:${p.hp}/${p.maxHp} ATK:${p.atk} DEF:${p.def}`);
    }
    try { recalcStats(p); } catch(e){}
    dumpLogs('天劫', false);
    return true;
  }

  // Check breakthrough (skip if on cooldown or insufficient kills)
  const bkOnCooldown = p._bkCooldown && (p.days||0) < p._bkCooldown;
  const nextIdx = p.realmIdx + 1;
  const reqKills = nextIdx * 3;
  const hasKills = (p.stats?.kill||0) >= reqKills;
  if(!bkOnCooldown && hasKills && typeof REALMS!=='undefined' && p.realmIdx < REALMS.length-1) {
    const threshold = REALMS[p.realmIdx+1]?.[1] || Infinity;
    if(p.cult >= threshold && !p.inBattle) {
      stats.bkAttempts++;
      const beforeRealm = p.realmIdx;
      // Check if this is a tribulation breakthrough
      const TRIBULATION_AT_IDX = [5,9,12,15,18,19,20]; // realms that have tribulations
      const nextIdx = p.realmIdx + 1;
      const isTrib = TRIBULATION_AT_IDX.includes(nextIdx);

      console.log(`\n>>> 尝试突破 [${REALMS[p.realmIdx][0]}] → [${REALMS[p.realmIdx+1][0]}]${isTrib?' (天劫)':''} (修为 ${p.cult}/${threshold})`);

      if(isTrib) {
        // Skip tribulation modal — directly succeed (test progression)
        try { doBreakthroughSuccess(); } catch(e){ console.log('  突破异常:', e.message); }
        flushTimeouts(100);
        p.inBattle = false;
        p.tribulation = null;
      } else {
        try { actBreakthrough(); } catch(e){ console.log('  突破异常:', e.message); }
        flushTimeouts(200);
      }
      // Clear any stuck state
      if(p.inBattle && !p.monster) { p.inBattle = false; }

      if(p.realmIdx > beforeRealm) {
        highestRealm = Math.max(highestRealm, p.realmIdx);
        console.log(`  ✓ 突破成功！→ ${REALMS[p.realmIdx][0]} | HP:${p.hp}/${p.maxHp} ATK:${p.atk} DEF:${p.def}`);
      } else {
        stats.bkFails++;
        console.log(`  ✗ 突破失败 | HP:${p.hp}/${p.maxHp} 寿:${p.age}/${p.lifespan} 修为:${p.cult}`);
      }
      dumpLogs('突破', false);
      return true;
    }
  }

  // Auto-equip: check bag for equipment, equip best per slot
  if(typeof EQUIPS !== 'undefined') {
    for(const [nm, info] of Object.entries(EQUIPS)) {
      if((p.bag[nm]||0) > 0 && info.slot) {
        const cur = p.equips[info.slot];
        const curInfo = cur ? EQUIPS[cur] : null;
        const curPower = curInfo ? (curInfo.atk||0)+(curInfo.def||0)+(curInfo.hp||0) : 0;
        const newPower = (info.atk||0)+(info.def||0)+(info.hp||0);
        if(!cur || newPower > curPower) {
          p.equips[info.slot] = nm;
          p.bag[nm]--;
          if(cur) p.bag[cur] = (p.bag[cur]||0) + 1; // old item back to bag
          try { recalcStats(p); } catch(e){}
          console.log(`  ◆ 装备: ${nm} → ${info.slot}`);
        }
      }
    }
  }

  // Alternate: adventure 3x → cultivate 1x (need fights for kills & loot)
  actionCounter++;
  const cultCost = 10 + p.realmIdx * 20;
  const canCult = (p.bag?.["灵石"]||0) >= cultCost;

  if(actionCounter % 4 === 0 && canCult) {
    stats.cultActions++;
    try { actCultivate(); } catch(e){}
    flushTimeouts(100);
    dumpLogs('闭关', true);
  } else {
    stats.advActions++;
    try { actAdventure(); } catch(e){}
    flushTimeouts(100);
    // If adventure triggered battle, fight it out immediately
    while(p.inBattle && p.monster && alive(p)) {
      doBattle();
      flushTimeouts();
    }
    dumpLogs('历练', true);
  }
  return true;
}

// Handle death/revival
function handleDeath() {
  const p = _getP();
  stats.deaths++;

  if(p.age >= p.lifespan) {
    console.log(`\n☠ 永久死亡：寿元耗尽 | 年龄 ${p.age}/${p.lifespan} | 境界 ${REALMS[p.realmIdx][0]}`);
    return false; // Game over for real
  }

  console.log(`\n☠ 战斗死亡 #${stats.deaths} | HP:${p.hp} 石:${p.bag?.["灵石"]||0} 修为:${p.cult}`);
  try {
    gameOver();
    flushTimeouts();
    // Click revive
    const btn = elements['m-revive'];
    if(btn && btn.onclick) btn.onclick();
    flushTimeouts();
  } catch(e){}

  // Manual state fix
  if(p.hp <= 0) p.hp = Math.floor((p.maxHp||100)*0.3);
  p.inBattle = false;
  p.monster = null;
  try { bindMainButtons(); } catch(e){}

  console.log(`  → 重生 | HP:${p.hp}/${p.maxHp} 石:${p.bag?.["灵石"]||0} 修为:${p.cult} 寿:${p.age}/${p.lifespan}`);
  dumpLogs('死亡', false);
  return true;
}

// ============ MAIN ============
console.log('╔══════════════════════════════════════╗');
console.log('║  凡人修仙路 · 无头体验测试 v9      ║');
console.log('╚══════════════════════════════════════╝\n');

// Init game
try {
  localStorage.clear();
  const rootNames = Object.keys(ROOTS);
  // Pick 杂灵根 (mediocre root) for realistic experience
  const targetRoot = rootNames.find(r => ROOTS[r].mul <= 1.0) || rootNames[2];
  const p0 = newPlayer('测试仙人', targetRoot, ['金','水']);
  _setP(p0);
  recalcStats(_getP());
  // Skip quest system for clean test
  const pp = _getP();
  pp.quest = 'reunion'; pp.questNode = 0; pp.questFlags = {};
  console.log(`角色: ${pp.name} | 灵根: ${pp.rootName}(×${ROOTS[pp.rootName].mul}) | 五行: ${pp.elements.join(',')}`);
  console.log(`初始: ${stateStr(getState())}`);
  console.log(`背包: ${Object.entries(pp.bag).filter(([k,v])=>v>0).map(([k,v])=>`${k}×${v}`).join(', ')}`);
} catch(e) {
  console.error('初始化失败:', e.message, e.stack);
  process.exit(1);
}

console.log('\n━━━━━ 开始游玩 ━━━━━\n');

const MAX_ACTIONS = 300;
let lastReportAction = 0;
let prevRealm = 0;
let stuckCount = 0;
let prevCult = 0;

for(let i = 0; i < MAX_ACTIONS; i++) {
  const P = _getP();
  if(!P) { console.log('P is null, stopping'); break; }

  // Death check
  if(!alive(P)) {
    if(!handleDeath()) break;
    if(!alive(_getP())) { console.log('重生后仍死亡，结束。'); break; }
    continue;
  }

  const ok = doAction();
  if(!ok) break;

  const P2 = _getP();
  // Death after action
  if(!alive(P2)) {
    if(!handleDeath()) break;
    if(!alive(_getP())) { console.log('重生后仍死亡，结束。'); break; }
    continue;
  }

  // Periodic report
  const realmChanged = P2.realmIdx !== prevRealm;
  if(realmChanged || i - lastReportAction >= 50) {
    console.log(`\n─── 步 ${i+1} ─── ${stateStr(getState())}`);
    prevRealm = P2.realmIdx;
    lastReportAction = i;
  }

  // Stuck detection — if cult doesn't change for 10 steps, skip breakthrough and farm
  if(P2.cult === prevCult && !P2.inBattle) {
    stuckCount++;
    if(stuckCount > 10) {
      // Force skip breakthrough, do adventure/cultivate instead
      stuckCount = 0;
      actionCounter++; // Break the pattern
      stats.advActions++;
      try { actAdventure(); } catch(e){}
      flushTimeouts(100);
      while(P2.inBattle && P2.monster && alive(P2)) {
        doBattle();
        flushTimeouts();
      }
      dumpLogs('解卡-历练', true);
    }
  } else {
    stuckCount = 0;
    prevCult = P2.cult;
  }
}

// ============ FINAL REPORT ============
console.log('\n\n╔══════════════════════════════════════╗');
console.log('║          体 验 报 告                ║');
console.log('╚══════════════════════════════════════╝');

const s = getState();
if(s) {
  const realmName = REALMS[s.realm]?.[0]||'?';
  console.log(`\n最终状态: ${stateStr(s)}`);
  console.log(`\n行动统计:`);
  console.log(`  总行动: ${totalActions}`);
  console.log(`  闭关: ${stats.cultActions}次 | 历练: ${stats.advActions}次`);
  console.log(`  战斗: ${stats.battles}次 | 胜: ${stats.wins} 败/逃: ${stats.battles-stats.wins}`);
  console.log(`  嗑药: ${stats.heals}次 | 逃跑: ${stats.flees}次`);
  console.log(`  突破: ${stats.bkAttempts}次 成功${stats.bkAttempts-stats.bkFails} 失败${stats.bkFails}`);
  console.log(`  死亡: ${stats.deaths}次`);
  console.log(`  最高境界: ${REALMS[highestRealm]?.[0]} (idx ${highestRealm})`);

  console.log(`\n经济:`);
  console.log(`  灵石: ${s.stones} | 闭关成本: ${10+s.realm*20}/次`);
  console.log(`  装备: ${s.equips.length ? s.equips.join(', ') : '无'}`);
  const pp = _getP();
  const bagItems = Object.entries(pp.bag).filter(([k,v])=>v>0 && k!=='灵石').map(([k,v])=>`${k}×${v}`);
  console.log(`  背包: ${bagItems.length ? bagItems.join(', ') : '空'}`);

  console.log(`\n生存:`);
  console.log(`  剩余寿元: ${s.lifespan - s.age} 年`);
  console.log(`  HP: ${s.hp}/${s.maxHp} (${Math.round(s.hp/s.maxHp*100)}%)`);

  console.log(`\n平衡评估:`);
  if(stats.deaths > 0)
    console.log(`  ✓ 死亡存在感 (${stats.deaths}次) — 战斗有风险`);
  else
    console.log(`  ✗ 零死亡 — 战斗仍不够危险`);

  if(stats.heals > 0 && stats.heals < stats.battles)
    console.log(`  ✓ 嗑药有节制 (${stats.heals}/${stats.battles}场) — 丹毒系统起效`);
  else if(stats.heals === 0)
    console.log(`  △ 从未嗑药 — 要么太强要么战斗太短`);

  if(stats.bkFails > 0)
    console.log(`  ✓ 突破有失败 (${stats.bkFails}次) — 有紧张感`);

  const lifeLeft = s.lifespan - s.age;
  if(lifeLeft < 30)
    console.log(`  ✓ 寿元紧迫 (剩${lifeLeft}年) — 有压力`);
  else if(lifeLeft < 100)
    console.log(`  △ 寿元有限 (剩${lifeLeft}年) — 中等压力`);
  else
    console.log(`  ✗ 寿元充裕 (剩${lifeLeft}年) — 无压力`);
}

console.log('\n━━━━━ 测试结束 ━━━━━');
