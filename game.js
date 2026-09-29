/* ============================================================
   game.js — движок: цикл, физика, дорога, поломки, сцены
   Тексты и баланс — в data.js, рисунки — в art.js.
   ============================================================ */
(() => {
'use strict';
const W = 1280, H = 720, C = CONFIG;
const $ = id => document.getElementById(id);
const cv = $('cv'), ctx = cv.getContext('2d');
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = a => a[Math.floor(Math.random() * a.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const sleep = ms => new Promise(r => setTimeout(r, ms));
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

/* ---------- масштабирование ---------- */
const gameEl = $('game');
function fit() {
  const s = Math.min(innerWidth / W, innerHeight / H);
  gameEl.style.transform = `translate(-50%,-50%) scale(${s})`;
}
addEventListener('resize', fit); fit();

/* ---------- реплики без повторов ---------- */
const bags = {};
function L(path) {
  const arr = path.split('.').reduce((o, k) => o && o[k], LINES);
  if (!arr || !arr.length) return '';
  let b = bags[path];
  if (!b || !b.length) b = bags[path] = arr.map((_, i) => i).sort(() => Math.random() - .5);
  return arr[b.pop()];
}
function LA(key, arr) { // из произвольного массива, с отдельной «сумкой»
  let b = bags[key];
  if (!b || !b.length) b = bags[key] = arr.map((_, i) => i).sort(() => Math.random() - .5);
  return arr[b.pop()];
}
const crewWho = () => pick(['den', 'ser']);

/* ---------- рекорд ---------- */
const REC_KEY = 'gazel-record-v1';
let best = 0;
try { best = +localStorage.getItem(REC_KEY) || 0; } catch (e) {}

/* ---------- состояние ---------- */
let G = null;
function newRun() {
  G = {
    scene: 'title', rail: 1, score: 0, hp: 100, fuel: 100, t: 0,
    stats: { rails: 0, km: 0, repairs: 0, babki: 0, shawa: 0, eden: 0, voluntary: false },
    route: null, seed: 3, camX: -360, camY: -20, shake: 0, flash: 0,
    van: mkVan(0), objs: [], parts: [], floats: [], say: null, sayQ: [], sayT: 0, chatT: 6,
    bd: null, bdTimer: 20, boost: 0, x2: 0, mud: 0, partBonus: 0, honkT: 0,
    card: null, nextSpawn: 900, spawned: {}, bugorX: null, bg: null, wheelObj: null, over: false,
    lastCp: false, paused: false, hintT: 0, lowHpSaid: false, lowFuelSaid: false,
  };
}
function mkVan(x) { return { x, y: 480, vy: 0, v: 0, air: false, airT: 0, angle: 0, wr: 0, sy: 0, sv: 0, rattle: 0 }; }

/* ---------- дорога ---------- */
function win(x, c, r1, r2) { return 1 - smooth(r1, r2, Math.abs(x - c)); }
function ground(x) {
  const A = Math.min(110, 60 + 14 * (G.rail - 1));
  const n = .55 * Math.sin(x * .0028 + G.seed) + .30 * Math.sin(x * .0061 + G.seed * 1.7) + .15 * Math.sin(x * .013 + G.seed * 2.3);
  let f = smooth(300, 900, x);
  if (G.route) f *= (1 - win(x, G.cpX, 350, 650)) * (1 - win(x, G.finX, 450, 750));
  let y = 480 + A * n * f;
  if (G.bugorX != null) { const d = (x - G.bugorX) / 480; if (Math.abs(d) < 1) y -= 240 * (.5 + .5 * Math.cos(d * Math.PI)); }
  return y;
}
const ROAD = { asphalt: '#4a4a52', gravel: '#a8926c', mud: '#6a4a2e' };

/* ---------- ввод ---------- */
const keys = {};
const KEYMAP = { ArrowRight: 'right', KeyD: 'right', ArrowLeft: 'left', KeyA: 'left', Space: 'jump', ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down', KeyR: 'repair', KeyB: 'bugor', KeyH: 'honk', Escape: 'pause', KeyP: 'pause', Enter: 'enter' };
addEventListener('keydown', e => {
  const k = KEYMAP[e.code]; if (!k) return;
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
  if (!keys[k] && !e.repeat) onPress(k);
  keys[k] = true;
});
addEventListener('keyup', e => { const k = KEYMAP[e.code]; if (k) keys[k] = false; });
addEventListener('blur', () => { for (const k in keys) keys[k] = false; });
document.querySelectorAll('#touch [data-key], #rPad [data-k]').forEach(b => {
  const k = b.dataset.key || b.dataset.k;
  b.addEventListener('pointerdown', e => { e.preventDefault(); SFX.init(); if (!keys[k]) onPress(k); keys[k] = true; });
  const up = () => { keys[k] = false; };
  b.addEventListener('pointerup', up); b.addEventListener('pointercancel', up); b.addEventListener('pointerleave', up);
});

function onPress(k) {
  SFX.init();
  if (!G) return;
  if (G.scene === 'title' && (k === 'enter' || k === 'jump')) return startRun();
  if (G.scene === 'briefing' && (k === 'enter' || k === 'jump')) return $('spinBtn').click();
  if (G.scene === 'results' && (k === 'enter' || k === 'jump')) return startRun();
  if (G.scene === 'repair') return repairKey(k);
  if (G.scene === 'drive' || G.scene === 'bugor') {
    if (k === 'pause' && G.scene === 'drive') return togglePause();
    if (G.scene !== 'drive' || G.paused || G.card) return;
    if ((k === 'jump' || k === 'up') && !G.van.air) { G.van.air = true; G.van.vy = -C.jump; G.van.airT = 0; SFX.tick(); }
    if (k === 'repair') tryRepair();
    if (k === 'honk') honk();
    if (k === 'bugor') tryVoluntaryBugor();
  }
}
function togglePause() { G.paused = !G.paused; $('pause').classList.toggle('hidden', !G.paused); if (G.paused) SFX.engine(0, { off: true }); }
$('pause').addEventListener('click', togglePause);
$('btnPause').addEventListener('click', () => { if (G.scene === 'drive') togglePause(); });
$('btnMute').addEventListener('click', () => { $('btnMute').textContent = SFX.toggleMute() ? '🔇' : '🔊'; });
$('btnMute').textContent = SFX.muted ? '🔇' : '🔊';

/* ---------- реплики в дороге ---------- */
function talk(who, text, urgent) {
  if (!text) return;
  const it = { who, text, dur: Math.max(2.8, 1.4 + text.length * .055) };
  if (urgent) { G.say = it; G.sayQ = []; G.sayT = 0; }
  else if (!G.say) { G.say = it; G.sayT = 0; }
  else if (G.sayQ.length < 2) G.sayQ.push(it);
}
function banter(pairs) { // диалог из нескольких реплик подряд
  pairs.forEach(([who, text]) => G.sayQ.push({ who, text, dur: Math.max(2.8, 1.4 + text.length * .055) }));
  if (!G.say) { G.say = G.sayQ.shift(); G.sayT = 0; }
}
function crewTalk(kind, urgent) { const w = crewWho(); talk(w, L(w + '.' + kind), urgent); }
function float(text, x, y, color = '#fff') { G.floats.push({ text, x, y, t: 0, color }); }
function addScore(n, x, y) {
  n = Math.round(n * (G.x2 > 0 ? 2 : 1)); G.score += n;
  if (x != null) float('+' + n, x, y, '#ffe27a');
}
function addHp(n) { G.hp = clamp(G.hp + n, 0, 100); }
function addFuel(n) { G.fuel = clamp(G.fuel + n, 0, 100); }
function damage(n, shake = 8) {
  G.hp = Math.max(0, G.hp - n); G.shake = Math.max(G.shake, shake);
  float('−' + Math.round(n) + ' ❤', G.van.x, G.van.y - 130, '#ff8a7a');
  if (G.hp < 25 && !G.lowHpSaid) { G.lowHpSaid = true; talk('lexa', L('lexa.lowHp')); }
}

/* ---------- частицы ---------- */
function puff(x, y, n, o) {
  for (let i = 0; i < n; i++) G.parts.push(Object.assign({
    x, y, vx: rnd(-60, 60), vy: rnd(-80, -10), life: rnd(.4, .9), t: 0, size: rnd(4, 9), color: '#ddd', g: 0, grow: 0,
  }, o || {}, o && o.spread ? { vx: rnd(-o.spread, o.spread), vy: rnd(-o.spread, o.spread * .2) } : {}));
}

/* ============================================================
   СПАВН ОБЪЕКТОВ
   ============================================================ */
const OBSTACLES = {
  pit:    { w: 150, clear: 0,  weight: r => 3,   draw: ART.drawPit,
            hit(o) { damage(12); G.van.v *= .55; G.van.vy = -280; G.van.air = true; G.van.airT = 0; SFX.hit(); puff(o.x, o.y, 10, { color: '#5a4022', spread: 200, g: 500 }); talk('lexa', L('lexa.hit')); if (Math.random() < .5) crewTalk('hit'); } },
  puddle: { w: 190, clear: 6,  weight: r => 2.5, draw: ART.drawPuddle,
            hit(o) { G.van.v *= .6; G.mud = 1.2; SFX.splash(); puff(o.x, o.y, 22, { color: '#7eb3d6', spread: 260, g: 700, size: 6 }); talk('lexa', L('lexa.puddle')); } },
  bump:   { w: 110, clear: 24, weight: r => 2,   draw: ART.drawBump,
            hit(o) { if (G.van.v > 30 * C.kmh) { damage(6, 12); G.van.vy = -380; G.van.air = true; G.van.airT = 0; G.van.v *= .8; SFX.thud(); talk('lexa', L('lexa.hit')); } else { G.van.sv += 40; SFX.thud(); } } },
  cows:   { w: 120, clear: 62, weight: r => r >= 3 ? 1.5 : 0, draw: ART.drawCow, type: 'cow',
            hit(o) { damage(15); G.van.v *= .3; SFX.moo(); SFX.hit(); float('МУУУ!', o.x, o.y - 100, '#fff'); talk('lexa', L('lexa.cow')); } },
  cones:  { w: 100, clear: 36, weight: r => r >= 4 ? 1.5 : 0, draw: ART.drawCones,
            hit(o) { damage(4); G.van.v *= .85; SFX.bang(); puff(o.x, o.y - 20, 8, { color: '#ff7a1a', spread: 240, g: 700 }); o.gone = true; } },
  dps:    { w: 60, clear: 999, weight: r => r >= 2 ? .8 : 0, draw: ART.drawDps, special: true },
  stop:   { w: 260, clear: 999, weight: r => 1.2, draw: ART.drawStop, special: true },
  bugorSign: { w: 60, clear: 999, weight: r => .35, draw: ART.drawBugorSign, special: true, once: true },
};
const PICKUPS = {
  tape:   { icon: '🩹', weight: 3,  fn() { addHp(15); talk('lexa', L('lexa.tape')); }, pts: 20 },
  fuel:   { icon: '🛢️', weight: 3,  fn() { addFuel(30); G.lowFuelSaid = false; talk('lexa', L('lexa.fuel')); }, pts: 20 },
  coffee: { icon: '☕', weight: 1.5, fn() { G.boost = 6; talk('lexa', L('lexa.coffee')); }, pts: 30 },
  part:   { icon: '🔩', weight: 1,  fn() { G.partBonus++; float('ремонт короче', G.van.x, G.van.y - 150, '#9fe0ff'); }, pts: 50 },
  shawa:  { icon: '🌯', weight: .6, fn() { addHp(10); crewTalk('eat'); }, pts: 40 },
  bonus:  { icon: '💰', weight: .25, fn() { G.x2 = 10; talk('lexa', 'ПРЕМИЯ?! Не может быть!', true); SFX.fanfare(); }, pts: 200 },
};
function weighted(map, pred) {
  const items = Object.keys(map).map(k => [k, pred(k, map[k])]).filter(a => a[1] > 0);
  const total = items.reduce((s, a) => s + a[1], 0); let r = Math.random() * total;
  for (const [k, w] of items) { if ((r -= w) <= 0) return k; }
  return items[0][0];
}
function inZone(x) {
  return Math.abs(x - G.cpX) < 700 || Math.abs(x - G.finX) < 800 || x < 1000 || x > G.finX + 300;
}
function spawnAhead() {
  while (G.nextSpawn < G.van.x + 1700) {
    const x = G.nextSpawn, rail = G.rail;
    G.nextSpawn += rnd(430, 820) / (1 + .07 * rail);
    if (x > G.finX + 200) break;
    if (inZone(x)) continue;
    const y = ground(x);
    if (Math.random() < .5) {
      const k = weighted(OBSTACLES, (k, d) => d.weight(rail) * (d.once && G.spawned[k] ? 0 : 1) * (k === 'dps' && (G.spawned.dps || 0) >= (rail >= 5 ? 2 : 1) ? 0 : 1));
      const d = OBSTACLES[k];
      G.spawned[k] = (G.spawned[k] || 0) + 1;
      G.objs.push({ kind: 'obs', k, x, y, w: d.w });
      if (k === 'pit' && Math.random() < .3) G.objs.push({ kind: 'obs', k, x: x + 260, y: ground(x + 260), w: d.w });
    } else {
      const k = weighted(PICKUPS, (k, d) => d.weight * (k === 'fuel' ? (G.fuel < 40 ? 2.5 : 1) : k === 'tape' ? (G.hp < 50 ? 2.5 : 1) : 1));
      G.objs.push({ kind: 'pick', k, x, y: y - rnd(70, 190) , gy: y });
    }
  }
}

/* ============================================================
   МАРШРУТ
   ============================================================ */
function startRoute(route) {
  G.route = route; G.seed = rnd(0, 1000);
  const secs = Math.min(C.routeSecMax, C.routeSecBase + C.routeSecPlus * (G.rail - 1));
  G.len = secs * C.pxPerSec; G.cpX = G.len * .5; G.finX = G.len;
  G.van = mkVan(0); G.van.y = ground(0);
  G.objs = [{ kind: 'cp', x: G.cpX, y: ground(G.cpX) }, { kind: 'fin', x: G.finX, y: ground(G.finX) }];
  G.parts = []; G.floats = []; G.say = null; G.sayQ = []; G.nextSpawn = 1000; G.spawned = {};
  G.bd = null; G.bdTimer = rnd(C.firstBreakdown[0], C.firstBreakdown[1]); G.boost = 0; G.x2 = 0; G.mud = 0;
  G.cpDone = false; G.cpSkipSaid = false; G.arrived = false; G.wheelObj = null; G.bugorX = null; G.bg = null;
  G.camX = -360; G.camY = G.van.y - 500; G.lowHpSaid = false; G.lowFuelSaid = false; G.chatT = 5; G.paused = false;
  G.scene = 'drive'; setScene('drive');
  G.card = { t: 2.2, title: `РЕЙС №${G.rail}`, sub: `${route.icon} ${route.name}`, icon: '🚐', done: null };
  talk('boss', LA(route.id + '.radio', route.boss), true);
}
function routeTypeRoad() { return G.route ? ROAD[G.route.road] : ROAD.asphalt; }

/* ============================================================
   ПОЛОМКИ И РЕМОНТ
   ============================================================ */
function startBreakdown() {
  const ids = Object.keys(BREAKDOWNS).filter(i => i !== (G.lastBd || ''));
  const id = pick(ids); G.lastBd = id;
  G.bd = { id, t: 0 };
  const def = BREAKDOWNS[id];
  G.shake = 14; SFX.bang(); SFX.sputter();
  talk('lexa', LA('bd.' + id, LINES.bd[id]), true);
  if (id === 'wheel') {
    G.wheelObj = { x: G.van.x + 70, v: Math.max(G.van.v, 200) + 150, t: 0, rot: 0 };
  }
  if (id === 'stall') SFX.engineOff();
  float(def.icon + ' ' + def.title, G.van.x, G.van.y - 160, '#ff6a5a');
}
function tryRepair() {
  if (!G.bd || G.bd.id === 'wheel') return;
  if (G.van.v > 15) { float('Остановись!', G.van.x, G.van.y - 150, '#ffd24a'); return; }
  startRepair();
}
const R = { active: false };
const ARROWS = { left: '⬅', right: '➡', up: '⬆', down: '⬇' };
function startRepair() {
  const id = G.bd.id, def = BREAKDOWNS[id];
  G.scene = 'repair'; $('repair').classList.remove('hidden');
  R.active = true; R.mode = def.game; R.helper = null;
  $('rTitle').textContent = def.icon + ' ' + def.title;
  $('rHint').textContent = def.hint;
  $('rCrew').textContent = '';
  $('repair').dataset.mode = R.mode;
  if (R.mode === 'seq') {
    let n = def.steps;
    if (G.partBonus > 0) { n = Math.max(2, n - 1); G.partBonus--; float('запчасть!', G.van.x, G.van.y - 150, '#9fe0ff'); }
    R.steps = Array.from({ length: n }, () => pick(['left', 'up', 'down', 'right'])); R.idx = 0;
    R.left = R.total = 2.5 + n * 1.3;
    if (Math.random() < .35) { // «полезный» совет пассажира
      const w = crewWho(); R.helper = w;
      R.steps.splice(Math.floor(rnd(1, R.steps.length)), 0, pick(['left', 'up', 'down', 'right']));
      $('rCrew').textContent = '💬 ' + L(w + '.help');
    }
  } else if (R.mode === 'mash') { R.count = 0; R.need = def.need; R.left = R.total = def.time; }
  else if (R.mode === 'push') { R.count = 0; R.need = def.need; R.left = R.total = def.time; R.next = 'left'; crewTalk('push', true); }
  renderRepair();
}
function renderRepair() {
  const box = $('rSeq');
  if (R.mode === 'seq') {
    box.innerHTML = R.steps.map((s, i) => `<span class="${i < R.idx ? 'done' : i === R.idx ? 'cur' : ''}">${ARROWS[s]}</span>`).join('');
  } else if (R.mode === 'mash') {
    box.innerHTML = `<span class="cur">${R.count} / ${R.need}</span>`;
  } else if (R.mode === 'push') {
    box.innerHTML = `<span class="cur">${R.count} / ${R.need}</span> <span>${ARROWS[R.next]}</span>`;
  }
  $('rBar').style.width = (R.left / R.total * 100) + '%';
}
function repairKey(k) {
  if (!R.active) return;
  if (k === 'pause') return cancelRepair();
  if (R.mode === 'seq' && ARROWS[k]) {
    if (k === R.steps[R.idx]) { R.idx++; SFX.step(); if (R.idx >= R.steps.length) return repaired(); }
    else { R.idx = 0; SFX.fail(); $('repair').classList.add('shake'); setTimeout(() => $('repair').classList.remove('shake'), 300); }
  } else if (R.mode === 'mash' && (k === 'jump' || k === 'enter' || k === 'repair')) {
    R.count++; SFX.step(); if (R.count >= R.need) return repaired();
  } else if (R.mode === 'push' && (k === 'left' || k === 'right')) {
    if (k === R.next) { R.count++; R.next = k === 'left' ? 'right' : 'left'; SFX.step(); if (R.count >= R.need) return repaired(); }
  }
  renderRepair();
}
$('rMash').addEventListener('pointerdown', e => { e.preventDefault(); repairKey('jump'); });
$('rCancel').addEventListener('click', () => cancelRepair());
function cancelRepair() { R.active = false; $('repair').classList.add('hidden'); G.scene = 'drive'; if (G.bd && G.bd.id === 'stall') { /* повторно предложим */ G.bd.retry = 2; } }
function repaired() {
  R.active = false; $('repair').classList.add('hidden'); G.scene = 'drive';
  const id = G.bd.id; G.bd = null; G.stats.repairs++;
  addHp(10); addScore(100 * G.rail, G.van.x, G.van.y - 150); SFX.ok();
  G.bdTimer = Math.max(10, rnd(C.nextBreakdown[0], C.nextBreakdown[1]) - 3 * (G.rail - 1));
  talk('lexa', L('lexa.ok'), true); if (Math.random() < .7) setTimeout(() => crewTalk('ok'), 1200);
  if (id === 'stall') puff(G.van.x - 120, G.van.y - 30, 10, { color: '#aaa' });
}

/* ============================================================
   ФИЗИКА ГАЗЕЛИ
   ============================================================ */
function stepVan(dt, inp) {
  const v = G.van, bd = G.bd ? G.bd.id : null;
  let maxV = C.maxSpeed * (G.boost > 0 ? 1.25 : 1);
  if (bd === 'radiator') maxV *= .6; if (bd === 'flat') maxV *= .7; if (bd === 'wheel') maxV *= .78;
  const engineOn = bd !== 'stall' && G.fuel > 0;
  const thr = inp.right && engineOn;
  const slope = (ground(v.x + 6) - ground(v.x - 6)) / 12;
  const sinT = slope / Math.sqrt(1 + slope * slope);
  if (!v.air) {
    let a = -C.drag * v.v - (v.v > 2 ? 25 : 0) + sinT * C.slopeG;
    if (thr && v.v < maxV) a += C.accel * (G.boost > 0 ? 1.4 : 1);
    if (inp.left) a -= C.brake;
    if (v.v > maxV) a -= 1.5 * (v.v - maxV);
    v.v = clamp(v.v + a * dt, 0, maxV * 1.35);
  } else v.v = Math.max(0, v.v - C.drag * .3 * v.v * dt);
  const nx = v.x + v.v * dt;
  if (!v.air) {
    const ny = ground(nx), vyg = (ny - v.y) / dt, free = v.y + v.vy * dt + .5 * C.gravity * dt * dt;
    if (ny > free + .5 && v.v > 60) { v.air = true; v.airT = 0; v.y = free; v.vy += C.gravity * dt; }
    else { v.vy = vyg; v.y = ny; }
  } else {
    v.vy += C.gravity * dt; v.y += v.vy * dt; v.airT += dt;
    const gy = ground(nx);
    if (v.y >= gy) {
      const sVy = (ground(nx + 4) - ground(nx - 4)) / 8 * v.v, impact = v.vy - sVy;
      v.y = gy; v.air = false; v.vy = sVy; onLand(impact, v.airT);
    }
  }
  v.x = nx;
  const tgt = v.air ? Math.atan2(v.vy, Math.max(120, v.v)) * .6 : Math.atan2(ground(v.x + 70) - ground(v.x - 72), 142) + (bd === 'flat' ? .05 : 0);
  v.angle += (tgt - v.angle) * Math.min(1, dt * (v.air ? 3 : 10));
  v.sv += (-120 * v.sy - 9 * v.sv) * dt; v.sy = clamp(v.sy + v.sv * dt, -14, 14);
  v.wr += v.v / 22 * dt;
  v.rattle = clamp(v.v / C.maxSpeed, 0, 1) * 1.6 + (bd === 'muffler' ? 1 : 0) + 0.3;
  return { thr, engineOn };
}
function onLand(impact, airT) {
  const v = G.van;
  if (impact > C.landDamageFrom) { damage(Math.min(14, 3 + (impact - C.landDamageFrom) / 90), 12); SFX.hit(); crewTalk('hit'); }
  else if (impact > 300) SFX.thud();
  v.sv += impact * .08;
  puff(v.x - 70, v.y, 6, { color: '#b9a37b', spread: 120 });
  if (airT > 1.0 && G.scene === 'drive') { addScore(100, v.x, v.y - 150); float('ПОЛЁТ НОРМАЛЬНЫЙ!', v.x, v.y - 190, '#ffe27a'); talk('lexa', L('lexa.fly')); }
}

/* ============================================================
   ОБНОВЛЕНИЕ СЦЕНЫ «ДОРОГА»
   ============================================================ */
function updateDrive(dt) {
  const v = G.van;
  if (G.paused) return;
  G.t += dt;
  // карточка (чекпоинт, прибытие и т.п.) — газель стоит
  const inp = G.card ? { right: false, left: true } : { right: keys.right, left: keys.left };
  const { thr, engineOn } = stepVan(dt, inp);
  if (G.card) {
    G.card.t -= dt;
    if (G.card.t <= 0) { const cb = G.card.done; G.card = null; if (cb) cb(); }
    updateFx(dt); soundEngine(thr, engineOn); return;
  }
  // расход и таймеры
  if (v.v > 1 || thr) G.fuel = Math.max(0, G.fuel - (thr ? C.fuelGas : C.fuelIdle) * dt * (G.bd && G.bd.id === 'leak' ? 2 : 1));
  if (G.boost > 0) G.boost -= dt; if (G.x2 > 0) G.x2 -= dt; if (G.mud > 0) G.mud -= dt;
  G.score += v.v * dt / 10 * (G.x2 > 0 ? 2 : 1);
  G.stats.km += v.v * dt / 1000 * 0.02;
  if (G.fuel < 20 && !G.lowFuelSaid) { G.lowFuelSaid = true; talk('lexa', L('lexa.lowFuel')); }
  // поломки
  if (!G.bd) { G.bdTimer -= dt; if (G.bdTimer <= 0 && !inZoneBd()) startBreakdown(); }
  else bdEffects(dt);
  // болтовня
  G.chatT -= dt;
  if (G.say) { G.sayT += dt; if (G.sayT > G.say.dur) { G.say = G.sayQ.shift() || null; G.sayT = 0; } }
  if (G.chatT <= 0 && !G.say && !G.sayQ.length) {
    if (Math.random() < .35) banter(LA('banter', LINES.banter));
    else {
      const r = Math.random(), w = r < .35 ? 'lexa' : r < .65 ? 'den' : r < .85 ? 'ser' : 'boss';
      talk(w, w === 'boss' ? LA(G.route.id + '.radio', G.route.boss)
        : w === 'lexa' && Math.random() < .3 ? LA(G.route.id + '.lexa', G.route.lexa)
        : w === 'den' && Math.random() < .55 ? LA(G.route.id + '.crew', G.route.crew)
        : L(w + '.drive'));
    }
    G.chatT = rnd(8, 14);
  }
  if (G.stall) G.stall = false;
  // остановка «заглохла» — сразу ремонт
  if (G.bd && G.bd.id === 'stall' && v.v < 15 && !v.air) { if (!G.bd.retry) startRepair(); else G.bd.retry -= dt * 0.0; }
  if (G.bd && G.bd.id === 'stall' && G.bd.retry && keys.repair) startRepair();
  // спавн и удаление
  spawnAhead();
  G.objs = G.objs.filter(o => o.x > v.x - 900 || o.kind === 'fin');
  updateObjects(dt);
  // колесо-беглец
  if (G.wheelObj) updateWheel(dt);
  // финиш
  if (!G.arrived && ((v.x > G.finX - 220 && v.v < 15 && !v.air) || v.x > G.finX + 500)) arrive();
  if (!G.cpDone && v.x > G.cpX + 550 && !G.cpSkipSaid) { G.cpSkipSaid = true; crewTalk('skip', true); }
  // смерть
  if (G.hp <= 0) return beginBugor(false, 'hp');
  if (G.fuel <= 0 && v.v < 25) return beginBugor(false, 'fuel');
  updateFx(dt); soundEngine(thr, engineOn);
}
function inZoneBd() { return Math.abs(G.van.x - G.cpX) < 400 || G.van.x > G.finX - 700; }
function bdEffects(dt) {
  const v = G.van, id = G.bd.id; G.bd.t += dt;
  if (id === 'muffler') { addHp(-0.5 * dt); if (Math.random() < .5 && !v.air) puff(v.x - 160, v.y - 4, 1, { color: '#ffb84a', vx: rnd(-90, -20), vy: rnd(-90, -20), g: 500, size: 3, life: .4 }); }
  if (id === 'door') { G.score = Math.max(0, G.score - 20 * dt); if (Math.random() < .04) puff(v.x - 10, v.y - 40, 1, { color: '#999', vx: rnd(-160, -60), vy: -60, g: 900, size: 5, life: 1 }); }
  if (id === 'radiator' && Math.random() < .6) puff(v.x + 112, v.y - 82, 1, { color: '#f4f4f4', vx: rnd(-20, 60), vy: rnd(-90, -40), size: 12, life: 1.1, grow: 14 });
  if (id === 'leak' && Math.random() < .5 && !v.air) puff(v.x - 80, v.y - 10, 1, { color: '#e0b030', vx: rnd(-40, 0), vy: 0, g: 600, size: 3, life: .5 });
}
function soundEngine(thr, engineOn) {
  const v = G.van, bd = G.bd ? G.bd.id : null;
  SFX.engine(clamp(v.v / C.maxSpeed, 0, 1.2), { off: !engineOn, loud: bd === 'muffler', rough: bd === 'radiator' });
}
function updateObjects(dt) {
  const v = G.van;
  for (const o of G.objs) {
    if (o.kind === 'pick') {
      if (!o.done && Math.abs(o.x - v.x) < 90 && Math.abs(o.y - (v.y - 55)) < 90) {
        o.done = true; const d = PICKUPS[o.k]; d.fn(); addScore(d.pts, o.x, o.y - 30); SFX.pickup();
        puff(o.x, o.y, 8, { color: '#ffe27a', spread: 180 });
      }
    } else if (o.kind === 'obs') {
      const d = OBSTACLES[o.k];
      if (o.k === 'cows' && o.scared) { o.sx = (o.sx || 0) + 380 * dt; if (o.sx > 600) o.done = true; }
      if (o.done || o.gone) continue;
      if (d.special) { specialObs(o, d, dt); continue; }
      const dx = Math.abs(o.x + (o.sx || 0) - v.x);
      if (o.k === 'pit') { if (dx < d.w / 2 && !v.air) { o.done = true; d.hit(o); } }
      else if (dx < d.w / 2 + 60 && !o.scared) {
        if (v.y > o.y - d.clear) { o.done = true; d.hit(o); }
      }
    }
  }
}
function specialObs(o, d, dt) {
  const v = G.van;
  if (o.k === 'dps') {
    if (!o.checked && v.x > o.x) {
      o.checked = true;
      if (v.v > 40 * C.kmh) { G.score = Math.max(0, G.score - 300); float('ШТРАФ −300', v.x, v.y - 150, '#ff8a7a'); SFX.whistle(); talk('lexa', L('lexa.dps'), true); }
      else { addScore(50, v.x, v.y - 150); }
    }
  } else if (o.k === 'stop') {
    if (!o.boarded && Math.abs(v.x - o.x) < 160 && v.v < 20 && !v.air) {
      o.stopT = (o.stopT || 0) + dt;
      if (o.stopT > .6) { o.boarded = true; G.stats.babki++; addScore(150, o.x, o.y - 120); SFX.pickup(); talk('babka', L('babka.board'), true); setTimeout(() => talk('lexa', L('lexa.board')), 2200); }
    } else if (!o.boarded && v.x > o.x + 220 && !o.angry) {
      o.angry = .01; damage(3, 6); talk('babka', L('babka.angry'), true);
    }
    if (o.angry) o.angry = Math.min(2, o.angry + dt);
  } else if (o.k === 'bugorSign') { /* подсказка рисуется в HUD */ }
}
function honk() {
  SFX.honk(); G.honkT = .4;
  G.objs.forEach(o => { if (o.kind === 'obs' && o.k === 'cows' && !o.scared && o.x > G.van.x && o.x - G.van.x < 1000) { o.scared = true; SFX.moo(); addScore(30, o.x, o.y - 100); } });
}
function updateWheel(dt) {
  const w = G.wheelObj; w.t += dt;
  w.v = Math.max(0, w.v - 60 * dt); w.x += w.v * dt; w.rot += w.v / 22 * dt;
  w.y = ground(w.x) - 22;
  const v = G.van;
  if (Math.abs(w.x - (v.x + 95)) < 60 && Math.abs(w.y - (v.y - 22)) < 70) { // поймали
    G.wheelObj = null; G.bd = null; G.stats.repairs++; addHp(5); addScore(100 * G.rail, v.x, v.y - 150); SFX.ok();
    G.bdTimer = Math.max(10, rnd(C.nextBreakdown[0], C.nextBreakdown[1]) - 3 * (G.rail - 1)); talk('lexa', L('lexa.ok'), true);
  } else if (w.t > 10) {
    G.wheelObj = null; G.bd = null; damage(25); G.bdTimer = rnd(20, 30); talk('lexa', 'Достал запаску. Колесо — на память.', true);
  }
}
function updateFx(dt) {
  const v = G.van;
  G.shake = Math.max(0, G.shake - 30 * dt); G.flash = Math.max(0, G.flash - 2 * dt); G.honkT = Math.max(0, G.honkT - dt);
  // дым из трубы и пыль
  if (G.scene === 'drive' || G.scene === 'title') {
    if (Math.random() < .35) puff(v.x - 133, v.y - 28, 1, { color: '#cfcfcf', vx: rnd(-60, -20), vy: rnd(-40, -10), size: 6, life: .8, grow: 8 });
    if (!v.air && v.v > 120 && Math.random() < .5) puff(v.x - 80, v.y - 2, 1, { color: '#b9a37b', vx: rnd(-80, -30), vy: rnd(-40, -5), size: 5, life: .5, grow: 6 });
  }
  for (const p of G.parts) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += (p.g || 0) * dt; p.size += (p.grow || 0) * dt; }
  G.parts = G.parts.filter(p => p.t < p.life);
  for (const f of G.floats) f.t += dt; G.floats = G.floats.filter(f => f.t < 1.4);
}

/* ---------- чекпоинт ---------- */
function checkCheckpoint() {
  if (G.cpDone || G.card) return;
  const v = G.van;
  if (Math.abs(v.x - G.cpX) < 260 && v.v < 15 && !v.air) {
    G.cpDone = true; const eden = G.route.checkpoint === 'eden';
    if (eden) G.stats.eden++; else G.stats.shawa++;
    G.card = { t: 3.2, title: eden ? 'КАФЕ «ЭДЕМ»' : 'ШАУРМА', sub: 'Все подкрепились. Бензин, ремонт и настроение — +', icon: eden ? '🍲' : '🌯',
      done: () => { addFuel(40); addHp(20); G.boost = 6; addScore(300, G.van.x, G.van.y - 150); talk(crewWho(), L('cp.' + (eden ? 'eden' : 'shawarma')), true); } };
    SFX.fanfare(); talk('lexa', L('lexa.eat'), true);
    setTimeout(() => crewTalk('eat', true), 1300);
  }
}

/* ---------- прибытие ---------- */
function arrive() {
  G.arrived = true; G.stats.rails++;
  const bonus = 1000 * G.rail + Math.round(G.hp) * 5;
  addScore(bonus, G.van.x, G.van.y - 160); SFX.fanfare();
  G.card = { t: 4.2, title: 'ОБЪЕКТ ' + G.route.short, sub: LA(G.route.id + '.arrive', G.route.arrive) + `  (+${bonus})`, icon: '🏁',
    done: () => { G.rail++; G.hp = Math.min(100, G.hp + 30); G.fuel = Math.max(G.fuel, 60); goBriefing(); } };
  SFX.engineOff();
}

/* ============================================================
   БУГОР
   ============================================================ */
function tryVoluntaryBugor() {
  const s = G.objs.find(o => o.kind === 'obs' && o.k === 'bugorSign' && G.van.x > o.x - 800 && G.van.x < o.x + 100);
  if (!s) return;
  G.stats.voluntary = true; addScore(1500, G.van.x, G.van.y - 160);
  beginBugor(true);
}
function beginBugor(voluntary, why) {
  if (G.scene === 'bugor') return;
  G.scene = 'bugor'; setScene('bugor'); $('repair').classList.add('hidden'); R.active = false;
  G.bugorX = G.van.x + 1250; G.card = null; G.bd = null; G.wheelObj = null;
  G.objs = []; G.say = null; G.sayQ = [];
  G.bg = { t: 0, phase: 0, people: [], parts: [], voluntary, why };
  SFX.engineOff();
  talk('lexa', voluntary ? L('lexa.bugor') : 'Всё, приехали… Только не под бугор!', true);
}
function updateBugor(dt) {
  const b = G.bg, v = G.van; b.t += dt; G.t += dt;
  if (G.say) { G.sayT += dt; if (G.sayT > G.say.dur) { G.say = G.sayQ.shift() || null; G.sayT = 0; } }
  if (b.phase === 0) { // сама забирается на бугор
    v.v = 170; v.x += v.v * dt; v.y = ground(v.x); v.vy = 0; v.air = false;
    v.angle += (Math.atan2(ground(v.x + 70) - ground(v.x - 72), 142) - v.angle) * Math.min(1, dt * 8);
    v.wr += v.v / 22 * dt; v.sy = Math.sin(G.t * 25) * 1.5;
    if (Math.random() < .5) puff(v.x - 125, v.y - 26, 1, { color: '#666', vx: rnd(-60, -20), vy: rnd(-60, -20), size: 8, life: 1, grow: 10 });
    if (Math.random() < .4) puff(v.x + 105, v.y - 70, 1, { color: '#f4f4f4', vx: rnd(0, 40), vy: -60, size: 10, life: 1, grow: 12 });
    if (v.x >= G.bugorX) { b.phase = 1; b.t = 0; v.v = 0; SFX.sputter();
      const y = ground(G.bugorX);
      b.people = ['lexa', 'den', 'ser'].map((w, i) => ({ w, x: v.x + (i - 1) * 40, y: y - 90, vx: -70 - i * 45, vy: -260 - i * 40, on: false, pose: 'jump' }));
      talk('den', L('den.bugor'), true); }
  } else if (b.phase === 1) { // выпрыгивают
    b.people.forEach(p => { if (!p.on) { p.vy += C.gravity * dt; p.x += p.vx * dt; p.y += p.vy * dt; const g = ground(p.x); if (p.y >= g) { p.y = g; p.on = true; p.pose = 'stand'; } } });
    if (b.t > 2.2) { b.phase = 2; b.t = 0; talk('ser', L('ser.bugor'), true); }
  } else if (b.phase === 2) { // Лёха пинает
    if (b.t > 1.2 && !b.kicked) { b.kicked = true; b.people[0].pose = 'kick'; v.v = 90; SFX.thud(); }
    if (b.kicked) {
      stepVan(dt, { right: false, left: false });
      if (v.v < 160) v.v += 260 * dt;
      if (b.t > 1.8 && !b.said) { b.said = true; talk('lexa', 'Ну, помчалась!', true); }
      if (b.landed || (v.x > G.bugorX + 480)) { explode(); }
      if (v.air) b.wasAir = true;
      if (b.wasAir && !v.air) { b.landed = true; }
      if (b.t > 2.6 && Math.random() < .03) throwPart();
    }
  } else if (b.phase === 3) { // взрыв
    b.parts.forEach(p => { p.vy += C.gravity * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt; const g = ground(p.x) - p.r; if (p.y > g) { p.y = g; p.vy *= -.45; p.vx *= .8; p.vr *= .8; } });
    if (b.t > 1.5 && !b.said2) { b.said2 = true; talk('lexa', 'Мечта сбылась…', true); }
    if (b.t > 3.6 && !b.said3) { b.said3 = true; talk('den', 'А обратно мы как?', true); }
    if (b.t > 5.8) showResults();
  }
  // камера
  if (b.phase >= 1) { G.camX += ((G.bugorX - 300 + (b.phase === 3 ? 260 : 0)) - G.camX) * Math.min(1, dt * 2.5); }
  updateFx(dt);
}
function throwPart() {
  const v = G.van;
  G.bg.parts.push({ x: v.x, y: v.y - 40, vx: rnd(-60, 200), vy: rnd(-500, -250), rot: 0, vr: rnd(-8, 8), r: 12, kind: 'bolt' });
}
function explode() {
  const b = G.bg, v = G.van; b.phase = 3; b.t = 0; b.boom = { x: v.x, y: v.y };
  G.shake = 34; G.flash = 1; SFX.boom(); G.hp = 0;
  for (let i = 0; i < 70; i++) G.parts.push({ x: v.x + rnd(-80, 80), y: v.y - rnd(0, 80), vx: rnd(-420, 420), vy: rnd(-600, -50), life: rnd(.7, 1.8), t: 0, size: rnd(10, 34), color: pick(['#ff9a1a', '#ffd24a', '#e5252a', '#444', '#f4f4f4']), g: 300, grow: -4 });
  b.parts.push({ x: v.x + 40, y: v.y - 22, vx: 380, vy: -700, rot: 0, vr: 9, r: 22, kind: 'wheel' });
  b.parts.push({ x: v.x - 60, y: v.y - 22, vx: -160, vy: -520, rot: 0, vr: -7, r: 22, kind: 'wheel' });
  b.parts.push({ x: v.x, y: v.y - 60, vx: 90, vy: -380, rot: 0, vr: 6, r: 14, kind: 'door' });
  b.parts.push({ x: v.x + 60, y: v.y - 40, vx: 220, vy: -300, rot: 0, vr: 4, r: 10, kind: 'bumper' });
  b.hidden = true;
}

/* ============================================================
   ИТОГИ
   ============================================================ */
function showResults() {
  if (G.scene === 'results') return;
  G.scene = 'results'; setScene('results');
  const score = Math.round(G.score), isNew = score > best;
  if (isNew) { best = score; try { localStorage.setItem(REC_KEY, String(best)); } catch (e) {} }
  const title = [...TITLES].reverse().find(t => score >= t.min).name;
  $('resTitle').textContent = G.bg && G.bg.voluntary ? '🔥 МЕЧТА ЛЁХИ!' : '💥 ГАЗЕЛЬ УШЛА ПОД БУГОР';
  $('resScore').textContent = score.toLocaleString('ru-RU');
  $('resRank').textContent = 'Звание: ' + title;
  $('resStats').innerHTML = [
    ['Рейсов выполнено', G.stats.rails], ['Ремонтов', G.stats.repairs], ['Бабок подвезено', G.stats.babki],
    ['Шаурм съедено', G.stats.shawa], ['Борщей в «Эдеме»', G.stats.eden]].map(a => `<div><b>${a[1]}</b><span>${a[0]}</span></div>`).join('');
  $('resRec').className = isNew ? 'new' : '';
  $('resRec').textContent = isNew ? '🏆 НОВЫЙ РЕКОРД!' : `Рекорд: ${best.toLocaleString('ru-RU')}`;
  $('resBoss').textContent = 'Саныч: «' + L('boss.gameover') + '»';
  SFX.engineOff();
}

/* ============================================================
   СЦЕНЫ: заставка / планёрка
   ============================================================ */
function setScene(s) {
  G.scene = s;
  $('title').classList.toggle('hidden', s !== 'title');
  $('briefing').classList.toggle('hidden', s !== 'briefing');
  $('results').classList.toggle('hidden', s !== 'results');
  $('hud').classList.toggle('hidden', s !== 'drive' && s !== 'repair' && s !== 'bugor');
  document.body.dataset.scene = s;
  $('recTitle').textContent = best ? `Рекорд: ${best.toLocaleString('ru-RU')}` : '';
}
function startRun() {
  SFX.init(); const prevTitle = G && G.scene === 'title';
  newRun(); G.scene = 'briefing';
  bag_reset(); goBriefing(true);
}
function bag_reset() { for (const k in bags) delete bags[k]; }
$('btnStart').addEventListener('click', startRun);
$('btnAgain').addEventListener('click', startRun);

/* ---------- планёрка и барабан ---------- */
const NS = 'http://www.w3.org/2000/svg';
const RCOL = ['#e63946', '#ffb703', '#1d7fd8', '#2a9d5c', '#8e44ad'];
const N = ROUTES.length, A = 360 / N;
let wrot = 0, spinning = false, chosen = null;
(function buildWheel() {
  const R0 = 188, g = $('sectors');
  const pt = deg => [R0 * Math.cos((deg - 90) * Math.PI / 180), R0 * Math.sin((deg - 90) * Math.PI / 180)];
  ROUTES.forEach((t, i) => {
    const [x0, y0] = pt(i * A), [x1, y1] = pt((i + 1) * A);
    const p = document.createElementNS(NS, 'path');
    p.setAttribute('d', `M0 0 L${x0} ${y0} A${R0} ${R0} 0 0 1 ${x1} ${y1} Z`); p.setAttribute('fill', RCOL[i % RCOL.length]);
    p.setAttribute('stroke', '#ffe6a0'); p.setAttribute('stroke-width', '2'); p.dataset.i = i; g.appendChild(p);
    const lab = document.createElementNS(NS, 'g'); lab.setAttribute('class', 'lab'); lab.dataset.i = i;
    lab.setAttribute('transform', `rotate(${i * A + A / 2})`);
    lab.innerHTML = `<text y="-150" text-anchor="middle" dominant-baseline="middle" font-size="28">${t.icon}</text>
      <text transform="translate(0,-92) rotate(-90)" text-anchor="middle" dominant-baseline="middle" font-family="Russo One,sans-serif" font-size="${t.short.length > 6 ? 14 : 17}" fill="#fff" stroke="rgba(0,0,0,.45)" stroke-width="3" paint-order="stroke">${t.short}</text>`;
    g.appendChild(lab);
  });
  const b = $('bulbs');
  for (let i = 0; i < N * 3; i++) {
    const a = (i * 360 / (N * 3) - 90) * Math.PI / 180, c = document.createElementNS(NS, 'circle');
    c.setAttribute('cx', 200 * Math.cos(a)); c.setAttribute('cy', 200 * Math.sin(a)); c.setAttribute('r', 5);
    c.setAttribute('class', 'bulb' + (i % 2 ? ' odd' : '')); b.appendChild(c);
  }
})();

const bubbleTimers = {};
function bsay(who, text, ms) {
  const id = who === 'boss' ? 'bossBubble' : who === 'lexa' ? 'lexaBubble' : 'crewBubble';
  const el = $(id); el.textContent = text; el.classList.add('show');
  if (id === 'crewBubble') el.style.left = who === 'den' ? '20%' : '82%';
  if (who === 'boss') $('boss').classList.add('talking');
  clearTimeout(bubbleTimers[id]); ms = ms || Math.max(2600, 1400 + text.length * 55);
  bubbleTimers[id] = setTimeout(() => { el.classList.remove('show'); if (who === 'boss') $('boss').classList.remove('talking'); }, ms);
  return ms;
}
const slots = () => [$('slotD'), $('lexaSlot'), $('slotS')];
function setBriefLook() {
  const lvl = Math.min(4, G.rail - 1);
  document.querySelectorAll('.lx').forEach(s => { for (let i = 1; i <= 4; i++) s.classList.toggle('l' + i, i <= lvl); });
  slots().forEach(s => { s.style.setProperty('--walk', (1 + lvl * .3) + 's'); s.classList.remove('out'); s.classList.add('in'); setTimeout(() => s.classList.add('idle'), 1200); });
}
async function goBriefing(first) {
  setScene('briefing'); SFX.engineOff();
  chosen = null; spinning = false;
  $('sectors').classList.remove('picked'); $('badge').classList.remove('show');
  document.querySelectorAll('#sectors .win').forEach(e => e.classList.remove('win'));
  $('planLabel').textContent = `РЕЙС №${G.rail}`;
  $('planText').textContent = 'Крутите барабан — куда сегодня едем?';
  $('planSub').textContent = '';
  $('bStats').textContent = `Очки: ${Math.round(G.score).toLocaleString('ru-RU')} · Газель: ${Math.round(G.hp)}% · Бензин: ${Math.round(G.fuel)}%`;
  const btn = $('spinBtn'); btn.textContent = 'КРУТИТЬ БАРАБАН!'; btn.disabled = false; btn.dataset.mode = 'spin';
  setBriefLook();
  await sleep(500);
  if (G.scene === 'briefing') bsay('boss', first ? L('boss.intro') : L('boss.spin'));
}
function spinWheel() {
  return new Promise(resolve => {
    const idx = Math.floor(Math.random() * N);
    const within = A * (.32 + Math.random() * .36), targetMod = (360 - (idx * A + within)) % 360;
    let delta = targetMod - ((wrot % 360) + 360) % 360; if (delta < 0) delta += 360; delta += 360 * (4 + Math.floor(Math.random() * 2));
    const start = wrot, dur = 2600 + Math.random() * 700, t0 = performance.now(); let lastSec = Math.floor(start / A);
    (function frame(now) {
      const t = Math.min(1, (now - t0) / dur); wrot = start + delta * (1 - Math.pow(1 - t, 3.4));
      $('rotor').setAttribute('transform', `rotate(${wrot})`);
      const s = Math.floor(wrot / A); if (s !== lastSec) { lastSec = s; SFX.tick(); const p = $('pointer'); p.classList.remove('flick'); void p.getBBox(); p.classList.add('flick'); }
      if (t < 1) requestAnimationFrame(frame); else resolve(idx);
    })(performance.now());
  });
}
$('spinBtn').addEventListener('click', async () => {
  SFX.init();
  const btn = $('spinBtn');
  if (btn.dataset.mode === 'go') { if (chosen) startRoute(chosen); return; }
  if (spinning) return; spinning = true; btn.disabled = true; btn.textContent = 'КРУТИТСЯ…';
  $('sectors').classList.remove('picked'); $('badge').classList.remove('show');
  document.querySelectorAll('#sectors .win').forEach(e => e.classList.remove('win'));
  $('wheelWrap').classList.add('spinning'); $('boss').classList.add('pointing');
  bsay('boss', L('boss.spin'));
  const idx = await spinWheel(); const r = ROUTES[idx]; chosen = r;
  $('wheelWrap').classList.remove('spinning'); SFX.fanfare();
  document.querySelectorAll(`#sectors [data-i="${idx}"]`).forEach(e => e.classList.add('win')); $('sectors').classList.add('picked');
  const badge = $('badge'); badge.style.setProperty('--sec', RCOL[idx % RCOL.length]); badge.textContent = `${r.icon} ${r.short}`; badge.classList.add('show');
  $('planLabel').textContent = `ОБЪЕКТ · РЕЙС №${G.rail}`;
  $('planText').textContent = r.name;
  $('planSub').textContent = `Чекпоинт: ${r.checkpoint === 'eden' ? '🍲 кафе «Эдем»' : '🌯 шаурма'} · Дорога: ${r.road === 'asphalt' ? 'асфальт' : r.road === 'gravel' ? 'грунтовка' : 'грязь'}`;
  // диалог
  let d = bsay('boss', LA(r.id + '.boss', r.boss)); await sleep(d + 200);
  $('boss').classList.remove('pointing');
  d = bsay('lexa', LA(r.id + '.lexa', r.lexa)); await sleep(d + 200);
  bsay('den', LA(r.id + '.crew', r.crew));
  btn.disabled = false; btn.textContent = 'ПОЕХАЛИ! ➜'; btn.dataset.mode = 'go'; spinning = false;
});

/* ============================================================
   ОТРИСОВКА
   ============================================================ */
function drawTerrain(sx0) {
  const pts = [];
  for (let x = -20; x <= W + 20; x += 8) pts.push([x, ground(G.camX + x) - G.camY]);
  // земля
  ctx.beginPath(); ctx.moveTo(-20, H + 10); pts.forEach(p => ctx.lineTo(p[0], p[1])); ctx.lineTo(W + 20, H + 10); ctx.closePath();
  const gr = ctx.createLinearGradient(0, 300, 0, H); gr.addColorStop(0, '#7a5a3a'); gr.addColorStop(1, '#4b3520'); ctx.fillStyle = gr; ctx.fill();
  // камешки
  ctx.fillStyle = 'rgba(0,0,0,.18)';
  for (let cx = Math.floor(G.camX / 60) - 1; cx < Math.floor(G.camX / 60) + W / 60 + 2; cx++) {
    for (let k = 0; k < 3; k++) {
      const h1 = hash(cx * 7 + k), x = cx * 60 - G.camX + h1 * 60, y = ground(cx * 60 + h1 * 60) - G.camY + 44 + hash(cx * 3 + k * 9) * 200;
      ctx.beginPath(); ctx.ellipse(x, y, 4 + h1 * 6, 3 + h1 * 3, 0, 0, 7); ctx.fill();
    }
  }
  // трава по краю
  ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1] - 1) : ctx.moveTo(p[0], p[1] - 1));
  ctx.strokeStyle = '#5aa845'; ctx.lineWidth = 12; ctx.lineJoin = 'round'; ctx.stroke();
  // полотно
  ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1] + 12) : ctx.moveTo(p[0], p[1] + 12));
  ctx.strokeStyle = routeTypeRoad(); ctx.lineWidth = 34; ctx.stroke();
  ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1] + 12) : ctx.moveTo(p[0], p[1] + 12));
  if (G.route && G.route.road === 'asphalt') { ctx.setLineDash([36, 34]); ctx.lineDashOffset = G.camX % 70; ctx.strokeStyle = '#eee'; ctx.lineWidth = 3; ctx.stroke(); ctx.setLineDash([]); }
  ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1] - 4) : ctx.moveTo(p[0], p[1] - 4));
  ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.stroke();
}
function drawScenery() {
  const i0 = Math.floor((G.camX - 100) / 170);
  for (let i = i0; i < i0 + W / 170 + 3; i++) {
    if (hash(i * 3.3) < .35) continue;
    const x = i * 170 + hash(i) * 60;
    if (G.route && (Math.abs(x - G.cpX) < 350 || Math.abs(x - G.finX) < 450)) continue;
    ctx.save(); ctx.translate(-G.camX, -G.camY);
    ART.drawScenery(ctx, x, ground(x) - 2, i);
    ctx.restore();
  }
}
function drawWorldObjs() {
  const t = G.t;
  ctx.save(); ctx.translate(-G.camX, -G.camY);
  for (const o of G.objs) {
    if (o.x < G.camX - 500 || o.x > G.camX + W + 500) continue;
    ctx.save();
    if (o.kind === 'obs') {
      const d = OBSTACLES[o.k];
      if (o.done && o.k !== 'cows' && !d.special) { if (o.k === 'cones') { ctx.restore(); continue; } }
      ctx.translate(o.x + (o.sx || 0), o.y);
      if (o.k === 'cows') ART.drawCow(ctx, o, t); else d.draw(ctx, o, t);
    } else if (o.kind === 'pick') {
      if (o.done) { ctx.restore(); continue; }
      ctx.translate(o.x, o.y + Math.sin(t * 3 + o.x) * 6); ART.drawPickup(ctx, PICKUPS[o.k].icon, t);
    } else if (o.kind === 'cp') {
      ctx.translate(o.x, o.y + 4); if (G.route.checkpoint === 'eden') ART.drawEden(ctx, t); else ART.drawShawarma(ctx, t);
    } else if (o.kind === 'fin') {
      ctx.translate(o.x + 260, o.y + 4); ART.drawGate(ctx, G.route.short, t);
    }
    ctx.restore();
  }
  ctx.restore();
}
function drawVanNow() {
  const v = G.van; if (G.bg && G.bg.hidden) return;
  ctx.save(); ctx.translate(v.x - G.camX, v.y - G.camY);
  ctx.rotate(v.angle);
  const jx = (Math.random() - .5) * v.rattle, jy = (Math.random() - .5) * v.rattle;
  ctx.translate(jx, jy);
  ART.drawVan(ctx, { t: G.t, wr: v.wr, sy: v.sy, bd: G.bd ? G.bd.id : null, rattle: v.rattle * .8, crew: !(G.scene === 'bugor' && G.bg && G.bg.phase >= 1) });
  ctx.restore();
}
function drawParticles() {
  ctx.save(); ctx.translate(-G.camX, -G.camY);
  for (const p of G.parts) {
    const a = 1 - p.t / p.life; ctx.globalAlpha = Math.max(0, a); ctx.fillStyle = p.color;
    ctx.beginPath(); ctx.arc(p.x, p.y, Math.max(.5, p.size), 0, 7); ctx.fill();
  }
  ctx.globalAlpha = 1;
  if (G.wheelObj) { const w = G.wheelObj; ART.wheel(ctx, w.x, w.y, 22, w.rot, false); if (Math.sin(G.t * 10) > 0) { ctx.font = '26px serif'; ctx.fillText('⬅ ловим!', w.x - 30, w.y - 40); } }
  ctx.restore();
}
function drawFloats() {
  ctx.save(); ctx.translate(-G.camX, -G.camY);
  ctx.font = 'bold 26px "Russo One",Arial'; ctx.textAlign = 'center'; ctx.lineWidth = 5; ctx.strokeStyle = INK;
  for (const f of G.floats) {
    ctx.globalAlpha = 1 - f.t / 1.4; const y = f.y - f.t * 50;
    ctx.strokeText(f.text, f.x, y); ctx.fillStyle = f.color; ctx.fillText(f.text, f.x, y);
  }
  ctx.globalAlpha = 1; ctx.restore();
}
function wrapText(text, maxW) {
  const words = text.split(' '), lines = []; let cur = '';
  for (const w of words) { const test = cur ? cur + ' ' + w : w; if (ctx.measureText(test).width > maxW && cur) { lines.push(cur); cur = w; } else cur = test; }
  lines.push(cur); return lines;
}
const BUB = { boss: '#fff3c4', den: '#ffe6cf', ser: '#dff5e0', babka: '#ffe0ee', lexa: '#fff' };
function drawBubble() {
  if (!G.say) return;
  const s = G.say, v = G.van;
  const SPK = { lexa: 50, den: -6, ser: -58, boss: 10, babka: 150 };
  let ax = v.x - G.camX + (SPK[s.who] != null ? SPK[s.who] : 10), ay = v.y - G.camY - 170;
  if (G.scene === 'bugor' && G.bg && G.bg.phase >= 1) { const p = G.bg.people[0]; ax = p.x - G.camX; ay = p.y - G.camY - 140; }
  ctx.font = 'bold 20px "PT Sans",Arial';
  const lines = wrapText(s.text, 300), lh = 24, bw = Math.min(330, Math.max(...lines.map(l => ctx.measureText(l).width)) + 28), bh = lines.length * lh + 20;
  const bx = clamp(ax - bw / 2, 10, W - bw - 10), by = Math.max(70, ay - bh);
  const pop = Math.min(1, s.dur - G.sayT > .2 ? G.sayT * 8 : (s.dur - G.sayT) * 5);
  ctx.save(); ctx.globalAlpha = clamp(pop, 0, 1); ctx.textAlign = 'left';
  ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, 14); ctx.fillStyle = BUB[s.who] || '#fff'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(clamp(ax - 8, bx + 12, bx + bw - 30), by + bh); ctx.lineTo(ax, by + bh + 16); ctx.lineTo(clamp(ax + 12, bx + 30, bx + bw - 10), by + bh);
  ctx.fillStyle = BUB[s.who] || '#fff'; ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#14203a'; ctx.font = 'bold 20px "PT Sans",Arial'; ctx.textBaseline = 'top';
  lines.forEach((l, i) => ctx.fillText(l, bx + 14, by + 10 + i * lh));
  ctx.restore();
}
function bar(x, y, w, h, frac, c1, c2, label, icon) {
  ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.beginPath(); ctx.roundRect(x, y, w, h, 9); ctx.fill();
  const f = clamp(frac, 0, 1), low = f < .25 && Math.floor(G.t * 4) % 2;
  ctx.fillStyle = low ? '#ff3b30' : c1; ctx.beginPath(); ctx.roundRect(x + 3, y + 3, Math.max(0, (w - 6) * f), h - 6, 6); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.font = 'bold 15px "Russo One",Arial'; ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
  ctx.fillText(icon + ' ' + label + ' ' + Math.round(f * 100) + '%', x + 12, y + h / 2 + 1);
}
function drawHud() {
  const v = G.van, r = G.route; if (!r) return;
  // маршрут
  ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.beginPath(); ctx.roundRect(16, 12, 500, 62, 12); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.font = 'bold 17px "Russo One",Arial'; ctx.textBaseline = 'top'; ctx.textAlign = 'left';
  ctx.fillText(`${r.icon} ${r.short} · рейс №${G.rail}`, 30, 18);
  const bx = 30, bw = 470, by = 50, p = clamp(v.x / G.finX, 0, 1);
  ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.beginPath(); ctx.roundRect(bx, by, bw, 10, 5); ctx.fill();
  ctx.fillStyle = '#ffd24a'; ctx.beginPath(); ctx.roundRect(bx, by, Math.max(10, bw * p), 10, 5); ctx.fill();
  ctx.font = '22px serif'; ctx.textBaseline = 'middle'; ctx.textAlign = 'center';
  ctx.fillText(r.checkpoint === 'eden' ? '🍲' : '🌯', bx + bw / 2, by + 5 - 16); ctx.fillText('🏁', bx + bw, by + 5 - 16);
  ctx.fillText('🚐', bx + bw * p, by + 6 + 14);
  bar(16, 84, 240, 28, G.hp / 100, '#3ad16a', '', 'Газель', '❤');
  bar(266, 84, 250, 28, G.fuel / 100, '#f2b134', '', 'Бензин', '⛽');
  // очки
  ctx.textAlign = 'right'; ctx.textBaseline = 'top'; ctx.font = 'bold 40px "Russo One",Arial'; ctx.lineWidth = 6; ctx.strokeStyle = INK;
  const sc = Math.round(G.score).toLocaleString('ru-RU'); ctx.strokeText(sc, W - 120, 14); ctx.fillStyle = G.x2 > 0 ? '#ffd24a' : '#fff'; ctx.fillText(sc, W - 120, 14);
  ctx.font = 'bold 15px "Russo One",Arial'; ctx.fillStyle = '#fff'; ctx.strokeText('очки' + (G.x2 > 0 ? ' ×2' : ''), W - 120, 58); ctx.fillText('очки' + (G.x2 > 0 ? ' ×2' : ''), W - 120, 58);
  // скорость
  ctx.textAlign = 'right'; ctx.font = 'bold 30px "Russo One",Arial'; const kmh = Math.round(v.v / C.kmh) + ' км/ч';
  ctx.strokeText(kmh, W - 20, H - 44); ctx.fillText(kmh, W - 20, H - 44);
  if (G.boost > 0) { ctx.font = '22px serif'; ctx.textAlign = 'left'; ctx.fillText('☕ ' + G.boost.toFixed(0) + ' c', 530, 90); }
  // баннер поломки
  if (G.bd) {
    const def = BREAKDOWNS[G.bd.id], pulse = .5 + .5 * Math.sin(G.t * 8);
    const msg = def.icon + ' ' + def.title + (G.bd.id === 'wheel' ? '  Догони колесо!' : G.bd.id === 'stall' ? '  Остановись — толкаем!' : v.v > 15 ? '  Остановись и жми R (🔧)' : '  Жми R (🔧) — чинить!');
    ctx.font = 'bold 22px "Russo One",Arial'; const w = ctx.measureText(msg).width + 40;
    ctx.fillStyle = `rgba(200,${Math.round(30 + pulse * 30)},30,.92)`; ctx.beginPath(); ctx.roundRect(W / 2 - w / 2, 130, w, 44, 22); ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(msg, W / 2, 153);
    $('touchRepair').classList.toggle('hidden', G.bd.id === 'wheel');
  } else $('touchRepair').classList.add('hidden');
  // подсказки
  const near = G.objs.find(o => o.kind === 'obs' && o.k === 'bugorSign' && v.x > o.x - 800 && v.x < o.x + 100);
  $('touchBugor').classList.toggle('hidden', !near);
  if (near) { ctx.font = 'bold 22px "Russo One",Arial'; ctx.fillStyle = '#ffd24a'; ctx.strokeStyle = INK; ctx.lineWidth = 5; ctx.textAlign = 'center'; ctx.strokeText('🔥 Жми B — пустить её под бугор! (+1500)', W / 2, 200); ctx.fillText('🔥 Жми B — пустить её под бугор! (+1500)', W / 2, 200); }
  const cow = G.objs.find(o => o.kind === 'obs' && o.k === 'cows' && !o.scared && o.x > v.x && o.x - v.x < 700);
  if (cow) { ctx.font = 'bold 20px "Russo One",Arial'; ctx.fillStyle = '#fff'; ctx.strokeStyle = INK; ctx.lineWidth = 5; ctx.textAlign = 'center'; ctx.strokeText('Корова! H — посигналить, Пробел — прыгнуть', W / 2, 232); ctx.fillText('Корова! H — посигналить, Пробел — прыгнуть', W / 2, 232); }
  // зона чекпоинта / ларька
  if (!G.cpDone && Math.abs(v.x - G.cpX) < 500 && Math.abs(v.x - G.cpX) >= 260) { ctx.font = 'bold 22px "Russo One",Arial'; ctx.fillStyle = '#fff'; ctx.strokeStyle = INK; ctx.lineWidth = 5; ctx.textAlign = 'center'; const m = 'Остановись у ' + (r.checkpoint === 'eden' ? 'кафе «Эдем»!' : 'шаурмы!'); ctx.strokeText(m, W / 2, 262); ctx.fillText(m, W / 2, 262); }
}
function drawCard() {
  if (!G.card) return; const c = G.card;
  ctx.fillStyle = 'rgba(5,10,30,.6)'; ctx.fillRect(0, 0, W, H);
  ctx.beginPath(); ctx.roundRect(W / 2 - 330, 200, 660, 250, 24); ctx.fillStyle = '#0e2a78'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = '#ffd24a'; ctx.stroke();
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = '70px serif'; ctx.fillText(c.icon, W / 2, 262);
  ctx.fillStyle = '#ffd24a'; ctx.font = 'bold 40px "Russo One",Arial'; ctx.fillText(c.title, W / 2, 330);
  ctx.fillStyle = '#fff'; ctx.font = 'bold 21px "PT Sans",Arial';
  wrapText(c.sub, 600).forEach((l, i) => ctx.fillText(l, W / 2, 378 + i * 28));
}
function drawBugorExtras() {
  const b = G.bg; if (!b) return;
  ctx.save(); ctx.translate(-G.camX, -G.camY);
  if (b.people) b.people.forEach(p => ART.person(ctx, p.w, p.x, p.y, .95, p.pose, p.pose === 'kick' ? b.t - 1.2 : G.t));
  b.parts.forEach(p => {
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
    if (p.kind === 'wheel') ART.wheel(ctx, 0, 0, 22, 0, false);
    else if (p.kind === 'door') { ctx.beginPath(); ctx.roundRect(-22, -30, 44, 60, 4); ctx.fillStyle = '#e4e4dc'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke(); }
    else if (p.kind === 'bumper') { ctx.fillStyle = '#444'; ctx.fillRect(-20, -6, 40, 12); }
    else { ctx.font = '26px serif'; ctx.fillText('🔩', -12, 8); }
    ctx.restore();
  });
  if (b.phase === 3) { // обгоревший кузов
    const bo = b.boom; ctx.fillStyle = '#222'; ctx.beginPath(); ctx.ellipse(bo.x, bo.y - 6, 90, 14, 0, 0, 7); ctx.fill();
    ctx.font = '60px serif'; ctx.textAlign = 'center'; ctx.fillText('🔥', bo.x - 30, bo.y - 20 + Math.sin(G.t * 12) * 4); ctx.fillText('🔥', bo.x + 40, bo.y - 30 + Math.cos(G.t * 10) * 4);
  }
  ctx.restore();
}
function hash(n) { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }

function render() {
  const s = G.scene;
  if (s === 'briefing' || s === 'results') { if (s === 'results') { renderWorld(); } return; }
  renderWorld();
}
function renderWorld() {
  ctx.save();
  if (G.shake > 0) ctx.translate((Math.random() - .5) * G.shake, (Math.random() - .5) * G.shake);
  ART.drawBackground(ctx, G.camX, G.camY, W, H, G.t);
  drawTerrain(); drawScenery(); drawWorldObjs(); drawVanNow(); drawBugorExtras(); drawParticles(); drawFloats();
  // пар от радиатора закрывает часть экрана
  if (G.bd && G.bd.id === 'radiator') { ctx.fillStyle = 'rgba(245,245,245,' + (.25 + .1 * Math.sin(G.t * 3)) + ')'; ctx.fillRect(0, 0, W, H); }
  if (G.mud > 0) { ctx.fillStyle = `rgba(90,60,30,${clamp(G.mud, 0, 1) * .55})`; ctx.fillRect(0, 0, W, H); }
  if (G.flash > 0) { ctx.fillStyle = `rgba(255,240,200,${G.flash})`; ctx.fillRect(0, 0, W, H); }
  ctx.restore();
  if (G.scene === 'drive' || G.scene === 'repair' || G.scene === 'bugor') { if (G.scene !== 'bugor') drawHud(); drawBubble(); }
  drawCard();
  if (G.paused) { /* оверлей пауз в DOM */ }
}

/* ============================================================
   ГЛАВНЫЙ ЦИКЛ
   ============================================================ */
let last = performance.now(), acc = 0;
function update(dt) {
  if (G.scene === 'drive') { updateDrive(dt); checkCheckpoint(); }
  else if (G.scene === 'repair') {
    G.t += dt; R.left -= dt;
    if (R.left <= 0) { damage(5, 6); SFX.fail(); R.left = R.total; if (R.mode !== 'seq') R.count = 0; else R.idx = 0; talk('lexa', L('lexa.fail'), true); }
    renderRepair(); updateFx(dt);
    if (G.say) { G.sayT += dt; if (G.sayT > G.say.dur) { G.say = G.sayQ.shift() || null; G.sayT = 0; } }
  }
  else if (G.scene === 'bugor') updateBugor(dt);
  else if (G.scene === 'title') { G.t += dt; G.van.rattle = .6; G.van.wr += 0; updateFx(dt); SFX.engine(0.05, { rough: true }); G.van.sv += Math.sin(G.t * 40) * .6; G.van.sv += (-120 * G.van.sy - 9 * G.van.sv) * dt; G.van.sy = clamp(G.van.sy + G.van.sv * dt, -14, 14); }
}
function frame(now) {
  const dt = Math.min(.1, (now - last) / 1000); last = now; acc += dt;
  while (acc >= 1 / 60) { update(1 / 60); acc -= 1 / 60; }
  if (G.scene === 'drive' || G.scene === 'repair') {
    G.camX = G.van.x - 360;
    G.camY += (G.van.y - 500 - G.camY) * Math.min(1, dt * 3);
  } else if (G.scene === 'bugor' && G.bg && G.bg.phase === 0) { G.camX = G.van.x - 360; G.camY += (G.van.y - 500 - G.camY) * Math.min(1, dt * 3); }
  else if (G.scene === 'bugor') { G.camY += ((ground(G.bugorX) - 470) - G.camY) * Math.min(1, dt * 2); }
  else if (G.scene === 'title') { G.camX = -360; G.camY = 480 - 500; }
  render();
  requestAnimationFrame(frame);
}

/* ---------- старт ---------- */
newRun(); setScene('title');
G.van.x = 0; G.van.y = 480;
requestAnimationFrame(frame);
window.__G = () => G; window.__ground = ground; // для отладки в консоли
})();
