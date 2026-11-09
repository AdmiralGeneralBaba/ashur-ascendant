/* Ashur Ascendant: simulation core (no DOM). */
(function (root) {
  'use strict';
  const W = 1200, H = 700, PLAYER = 'ASS';

  const FDEF = {
    ASS: ['Assyria', '#c9962e', 'Kalhu'],
    BAB: ['Babylonia', '#3d6db3', 'Babylon'],
    ELA: ['Elam', '#8c55a8', 'Susa'],
    URA: ['Urartu', '#a8423d', 'Tushpa'],
    MED: ['Median Tribes', '#5f9160', 'Ecbatana'],
    MAN: ['Mannea', '#4f9c98', 'Izirtu'],
    HAT: ['Syro-Hittite League', '#c26f3a', 'Carchemish'],
    PHR: ['Phrygia', '#8d7a52', 'Gordion'],
    ARM: ['Aram-Damascus', '#b0567f', 'Damascus'],
    PHO: ['Phoenician Cities', '#6a4fb0', 'Tyre'],
    ISR: ['Israel', '#4a8fc4', 'Samaria'],
    JUD: ['Judah', '#7fa83c', 'Jerusalem'],
    EDM: ['Edom and Moab', '#a36a50', 'Bozrah'],
    EGY: ['Egypt', '#cdb64a', 'Memphis'],
    ARB: ['Qedarite Arabs', '#b59a78', 'Dumah'],
    REB: ['Rebels', '#3b3b3b', null]
  };
  const ALLIES = [['URA', 'HAT'], ['BAB', 'ELA'], ['ARM', 'ISR']];
  const START_MEN = { BAB: 14000, ELA: 12000, URA: 17000, MED: 8000, MAN: 5000, HAT: 10000, PHR: 10000, ARM: 9000, PHO: 4000, ISR: 5000, JUD: 4000, EDM: 3000, EGY: 15000, ARB: 4000 };
  const GOALS = ['Babylon', 'Damascus', 'Tushpa'];

  // name, lon, lat, owner, silver, manpower, walls, mountain
  const PDEF = [
    ['Kalhu', 43.6, 36.0, 'ASS', 22, 900, 3, 0], ['Nineveh', 42.9, 36.9, 'ASS', 18, 800, 2, 0],
    ['Ashur', 43.1, 35.0, 'ASS', 16, 600, 2, 0], ['Arbela', 44.6, 36.3, 'ASS', 12, 600, 1, 0],
    ['Arrapha', 44.6, 35.1, 'ASS', 10, 500, 1, 0], ['Nasibina', 41.3, 36.9, 'ASS', 10, 500, 1, 0],
    ['Harran', 39.6, 36.8, 'ASS', 12, 500, 1, 0], ['Dur-Katlimmu', 40.7, 35.6, 'ASS', 8, 400, 1, 0],
    ['Babylon', 44.4, 32.5, 'BAB', 24, 900, 3, 0], ['Sippar', 44.0, 33.6, 'BAB', 12, 500, 1, 0],
    ['Nippur', 45.4, 32.0, 'BAB', 12, 600, 1, 0], ['Uruk', 45.7, 30.9, 'BAB', 12, 600, 1, 0],
    ['Sealand', 47.0, 30.3, 'BAB', 8, 500, 1, 0], ['Der', 46.0, 33.6, 'BAB', 8, 400, 1, 0],
    ['Suhu', 41.6, 34.0, 'BAB', 6, 300, 0, 0],
    ['Susa', 48.3, 32.2, 'ELA', 20, 800, 3, 0], ['Madaktu', 47.6, 33.2, 'ELA', 8, 500, 1, 1],
    ['Awan', 50.0, 32.5, 'ELA', 8, 500, 0, 1], ['Anshan', 51.5, 30.2, 'ELA', 10, 500, 1, 1],
    ['Parsumash', 53.0, 31.5, 'ELA', 6, 400, 0, 1],
    ['Tushpa', 43.3, 38.5, 'URA', 20, 800, 3, 1], ['Musasir', 44.8, 37.6, 'URA', 12, 500, 2, 1],
    ['Arzashkun', 41.5, 38.9, 'URA', 8, 500, 1, 1], ['Ulhu', 45.6, 38.6, 'URA', 8, 500, 0, 1],
    ['Erebuni', 44.5, 40.1, 'URA', 10, 500, 1, 1], ['Etiuni', 47.0, 40.0, 'URA', 6, 400, 0, 1],
    ['Ecbatana', 48.5, 34.8, 'MED', 14, 700, 2, 1], ['Ellipi', 47.0, 34.5, 'MED', 8, 500, 0, 1],
    ['Rhagae', 51.4, 35.6, 'MED', 8, 500, 0, 0], ['Hyrcania', 52.5, 37.0, 'MED', 6, 400, 0, 1],
    ['Izirtu', 46.3, 36.6, 'MAN', 12, 600, 1, 1], ['Parsua', 47.0, 35.7, 'MAN', 8, 400, 0, 1],
    ['Andia', 48.0, 37.8, 'MAN', 6, 400, 0, 1],
    ['Carchemish', 38.0, 36.9, 'HAT', 18, 700, 2, 0], ['Arpad', 36.9, 36.1, 'HAT', 14, 600, 2, 0],
    ['Melid', 38.3, 38.4, 'HAT', 10, 500, 1, 1], ['Que', 35.3, 37.1, 'HAT', 12, 500, 0, 0],
    ['Gordion', 32.0, 39.6, 'PHR', 18, 700, 2, 0], ['Tabal', 34.8, 38.5, 'PHR', 10, 500, 0, 1],
    ['Iconium', 32.5, 37.9, 'PHR', 8, 500, 0, 0], ['Pteria', 35.5, 40.0, 'PHR', 8, 500, 0, 0],
    ['Kaska', 38.5, 40.3, 'PHR', 5, 400, 0, 1],
    ['Damascus', 36.6, 33.4, 'ARM', 20, 800, 2, 0], ['Hamath', 37.0, 35.0, 'ARM', 14, 600, 1, 0],
    ['Tadmor', 38.4, 34.5, 'ARM', 8, 300, 0, 0],
    ['Tyre', 35.1, 33.3, 'PHO', 30, 400, 3, 0], ['Arwad', 35.8, 34.7, 'PHO', 20, 400, 2, 0],
    ['Samaria', 35.3, 32.4, 'ISR', 16, 700, 2, 0],
    ['Jerusalem', 35.1, 31.5, 'JUD', 14, 600, 3, 1],
    ['Rabbah', 36.1, 31.8, 'EDM', 8, 400, 0, 0], ['Bozrah', 35.7, 30.4, 'EDM', 8, 400, 1, 1],
    ['Memphis', 31.2, 29.9, 'EGY', 28, 1000, 3, 0], ['Tanis', 31.9, 31.0, 'EGY', 18, 700, 2, 0],
    ['Sinai', 33.6, 30.6, 'EGY', 4, 200, 0, 0], ['Heracleopolis', 30.9, 28.6, 'EGY', 14, 700, 1, 0],
    ['Sais', 30.6, 31.0, 'EGY', 14, 600, 1, 0],
    ['Dumah', 39.9, 29.8, 'ARB', 10, 500, 0, 0], ['Tayma', 38.5, 27.6, 'ARB', 8, 400, 0, 0],
    ['Midian', 36.3, 28.6, 'ARB', 6, 400, 0, 0],
    // wastes
    ['', 39.5, 32.5, 'waste'], ['', 41.6, 31.6, 'waste'], ['', 43.2, 30.0, 'waste'], ['', 37.6, 31.2, 'waste'],
    ['', 45.0, 28.6, 'waste'], ['', 41.8, 28.0, 'waste'], ['', 53.0, 34.0, 'waste'], ['', 47.5, 28.0, 'waste'],
    ['', 32.8, 27.5, 'waste'],
    // seas
    ['', 31.0, 34.0, 'sea'], ['', 33.0, 35.6, 'sea'], ['', 33.6, 33.2, 'sea'], ['', 31.0, 32.4, 'sea'],
    ['', 34.3, 34.6, 'sea'], ['', 31.5, 36.5, 'sea'], ['', 33.8, 36.4, 'sea'], ['', 32.5, 32.2, 'sea'],
    ['', 34.2, 32.2, 'sea'], ['', 34.4, 33.9, 'sea'],
    ['', 33.0, 42.0, 'sea'], ['', 36.0, 42.0, 'sea'], ['', 39.0, 41.9, 'sea'], ['', 41.5, 42.0, 'sea'],
    ['', 50.5, 38.5, 'sea'], ['', 51.5, 40.0, 'sea'], ['', 50.3, 40.3, 'sea'],
    ['', 49.4, 29.2, 'sea'], ['', 51.2, 27.6, 'sea'], ['', 53.0, 27.0, 'sea'], ['', 34.6, 27.4, 'sea']
  ];

  const UNITS = {
    spear: { name: 'Spearmen', men: 1000, cost: 40, days: 20, atk: 1, def: 1.2, note: 'The levy. Holds the line.' },
    bow: { name: 'Archers', men: 1000, cost: 55, days: 25, atk: 1.5, def: 0.7, note: 'Hits hard, breaks easily.' },
    cav: { name: 'Cavalry', men: 500, cost: 90, days: 40, atk: 3, def: 2, note: 'Mounted lancers and horse archers.' },
    char: { name: 'Chariots', men: 200, cost: 110, days: 45, atk: 6, def: 3, note: 'Shock of the plains. Weak in mountains.' },
    ram: { name: 'Siege train', men: 300, cost: 100, days: 40, atk: 0.2, def: 0.4, note: 'Rams and sappers. Speeds up sieges.' }
  };

  const EDICTS = [
    { id: 'prov', name: 'Reform the Provinces', days: 70, req: [], desc: 'Break up the great governorships. Silver income +25%.', fx: m => { m.silver *= 1.25; } },
    { id: 'kisir', name: 'The Royal Cohort', days: 90, req: ['prov'], desc: 'A standing army replaces the summer levy. Attack +15%.', fx: m => { m.atk *= 1.15; } },
    { id: 'road', name: 'The Royal Road', days: 80, req: ['prov'], desc: 'Relay stations a day apart. Armies march 30% faster.', fx: m => { m.speed *= 1.3; } },
    { id: 'deport', name: 'Resettlement Decrees', days: 90, req: ['prov'], desc: 'Move conquered peoples to the heartland. Manpower +40%.', fx: m => { m.mp *= 1.4; } },
    { id: 'siege', name: 'Corps of Sappers', days: 90, req: ['kisir'], desc: 'Ramps, mines and battering rams. Sieges 60% faster.', fx: m => { m.siege *= 1.6; } },
    { id: 'iron', name: 'Iron of the North', days: 100, req: ['kisir'], desc: 'Iron scale and pointed helmets for every man. Defence +15%.', fx: m => { m.def *= 1.15; } },
    { id: 'horse', name: 'Horse Tribute', days: 80, req: ['road'], desc: 'The Zagros pays in horses. Cavalry and chariots 30% cheaper.', fx: m => { m.cav *= 0.7; } },
    { id: 'four', name: 'King of the Four Quarters', days: 120, req: ['siege', 'deport'], desc: 'Attack and defence +10%, silver +15%.', fx: m => { m.atk *= 1.1; m.def *= 1.1; m.silver *= 1.15; } }
  ];

  const MONTHS = ['Nisannu', 'Ayyaru', 'Simanu', 'Duuzu', 'Abu', 'Ululu', 'Tashritu', 'Arahsamna', 'Kislimu', 'Tebetu', 'Shabatu', 'Addaru'];
  let S = null;

  const rnd = (a, b) => a + Math.random() * (b - a);
  const total = a => a.men.spear + a.men.bow + a.men.cav + a.men.char + a.men.ram;
  const atWar = (a, b) => !!(a && b && a !== b && S.facs[a] && S.facs[a].war[b] !== undefined);
  const canEnter = (fid, p) => p.type === 'land' && (p.owner === fid || atWar(fid, p.owner));
  const provByName = n => S.provs.find(p => p.name === n);
  const countProvs = fid => S.provs.filter(p => p.owner === fid).length;
  const menOf = fid => S.armies.reduce((s, a) => s + (a.owner === fid && !a.dead ? total(a) : 0), 0);
  const siegeNeed = p => 18 + p.fort * 20;
  const isWinter = () => { const m = Math.floor(S.day % 360 / 30); return m >= 8 && m <= 10; };
  function log(text, kind) { S.log.push({ day: S.day, text, kind: kind || '' }); if (S.log.length > 60) S.log.shift(); }
  function dateStr(day) { const d = day === undefined ? S.day : day; return (d % 30 + 1) + ' ' + MONTHS[Math.floor(d % 360 / 30)] + ', ' + (745 - Math.floor(d / 360)) + ' BC'; }

  function clip(poly, ax, ay, bx, by) {
    const mx = (ax + bx) / 2, my = (ay + by) / 2, nx = bx - ax, ny = by - ay, out = [];
    for (let i = 0; i < poly.length; i++) {
      const p = poly[i], q = poly[(i + 1) % poly.length];
      const dp = (p[0] - mx) * nx + (p[1] - my) * ny, dq = (q[0] - mx) * nx + (q[1] - my) * ny;
      if (dp <= 0) out.push(p);
      if ((dp < 0 && dq > 0) || (dp > 0 && dq < 0)) { const t = dp / (dp - dq); out.push([p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]); }
    }
    return out;
  }
  function buildMap(provs) {
    for (const p of provs) {
      let poly = [[0, 0], [W, 0], [W, H], [0, H]];
      for (const q of provs) { if (q !== p && poly.length) poly = clip(poly, p.x, p.y, q.x, q.y); }
      p.poly = poly;
    }
    for (let i = 0; i < provs.length; i++) for (let j = i + 1; j < provs.length; j++) {
      let shared = 0;
      for (const a of provs[i].poly) for (const b of provs[j].poly) if (Math.abs(a[0] - b[0]) < 0.5 && Math.abs(a[1] - b[1]) < 0.5) shared++;
      if (shared >= 2) { provs[i].adj.push(j); provs[j].adj.push(i); }
    }
  }

  const GEN = ['Shamshi-ilu', 'Bel-dan', 'Nabu-etir', 'Ashur-daninanni', 'Sin-taklak', 'Ninurta-ilaya', 'Marduk-remanni', 'Nergal-eresh', 'Bel-emuranni', 'Mannu-ki-Ashur', 'Sharru-emuranni', 'Tab-shar-Ashur', 'Ashur-shallimanni', 'Nabu-dainanni', 'Adad-issiya', 'Bel-harran-shadua'];
  function mkArmy(owner, prov, men, name) {
    const a = { id: S.nextId++, owner, prov, name, men: Object.assign({ spear: 0, bow: 0, cav: 0, char: 0, ram: 0 }, men), morale: 100, path: [], prog: 0, retreating: false, inCombat: false, dead: false, xp: 0, stormCd: 0, attr: false, gen: { name: GEN[Math.floor(Math.random() * GEN.length)], skill: 1 + Math.floor(Math.pow(Math.random(), 1.8) * 5) } };
    S.armies.push(a); return a;
  }

  function newGame() {
    const provs = PDEF.map((d, i) => ({
      id: i, name: d[0], x: (d[1] - 30) * 50, y: (41 - d[2]) * 50,
      type: d[3] === 'sea' ? 'sea' : d[3] === 'waste' ? 'waste' : 'land',
      owner: (d[3] === 'sea' || d[3] === 'waste') ? null : d[3],
      silver: d[4] || 0, mp: d[5] || 0, fort: d[6] || 0, mtn: !!d[7], siege: 0, sieger: null, adj: [], poly: [], unrest: 0, bld: { m: 0, g: 0 }, core: null
    }));
    for (const p of provs) p.core = p.owner;
    buildMap(provs);
    S = { day: 0, provs, facs: {}, armies: [], nextId: 1, log: [], events: [], over: null, won: false, auto: false, levy: 1, nextEvent: 80 };
    for (const id in FDEF) {
      const d = FDEF[id];
      S.facs[id] = {
        id, name: d[0], color: d[1], capital: d[2] ? provs.find(p => p.name === d[2]).id : null, tributary: false, silver: id === PLAYER ? 300 : 150, mp: id === PLAYER ? 12000 : 6000,
        war: {}, alive: true, queue: [], edict: null, done: {}, mods: { atk: 1, def: 1, silver: 1, mp: 1, speed: 1, siege: 1, cav: 1 }, start: 0
      };
    }
    for (const id in S.facs) {
      const f = S.facs[id]; f.start = countProvs(id);
      if (id === PLAYER || id === 'REB') continue;
      const n = START_MEN[id];
      mkArmy(id, f.capital, { spear: n * 0.55, bow: n * 0.3, cav: n * 0.12, char: n * 0.03 }, 'Host of ' + f.name);
    }
    mkArmy(PLAYER, provByName('Kalhu').id, { spear: 8000, bow: 5000, cav: 1500, char: 400, ram: 300 }, 'Royal Army').gen = { name: 'Tiglath-Pileser', skill: 4 };
    mkArmy(PLAYER, provByName('Harran').id, { spear: 5000, bow: 3000, cav: 500 }, 'Army of the West');
    S.events.push({
      title: 'The Revolt at Kalhu',
      text: 'Ayyaru, 745 BC. The governor Pulu has seized the throne in Kalhu and taken the name Tiglath-Pileser. Assyria is weak: Urartu dominates the north, the western vassals have stopped paying tribute, and Babylon is restless.<br><br>Restore the empire. Take <b>Babylon</b>, <b>Damascus</b> and <b>Tushpa</b>. A kingdom falls when its capital falls. Lose Kalhu and your reign is over.<br><br>Select an army, then click a province to march. You can only enter the lands of kingdoms you are at war with.'
    });
    log('A new king sits in Kalhu.');
    return S;
  }

  function bfs(fid, from) {
    const dist = new Map([[from, 0]]), prev = new Map(), q = [from];
    while (q.length) {
      const c = q.shift();
      for (const n of S.provs[c].adj) { if (dist.has(n) || !canEnter(fid, S.provs[n])) continue; dist.set(n, dist.get(c) + 1); prev.set(n, c); q.push(n); }
    }
    return { dist, prev };
  }
  function findPath(fid, from, to) {
    if (from === to) return null;
    const r = bfs(fid, from); if (!r.dist.has(to)) return null;
    const path = []; let c = to; while (c !== from) { path.unshift(c); c = r.prev.get(c); } return path;
  }
  function order(a, to) {
    const path = findPath(a.owner, a.prov, to); if (!path) return false;
    if (a.inCombat) { a.retreating = true; a.path = [path[0]]; } else if (!a.retreating) a.path = path; else return false;
    a.prog = 0; return true;
  }
  function halt(a) { if (!a.retreating) { a.path = []; a.prog = 0; } }

  function rawPower(a) { let s = 0; for (const t in UNITS) s += a.men[t] * UNITS[t].atk; return s; }
  function power(a, p) {
    let s = 0; for (const t in UNITS) s += a.men[t] * UNITS[t].atk * (t === 'char' && p.mtn ? 0.4 : 1);
    return s * S.facs[a.owner].mods.atk * (0.5 + a.morale / 200) * (1 + 0.05 * a.gen.skill + a.xp / 400);
  }
  function tough(b, p) {
    let s = 0; for (const t in UNITS) s += b.men[t] * UNITS[t].def;
    return s / Math.max(1, total(b)) * S.facs[b.owner].mods.def * (b.owner === p.owner ? 1 + 0.08 * p.fort + (p.mtn ? 0.25 : 0) : 1);
  }
  function group() { const m = new Map(); for (const a of S.armies) { if (a.dead) continue; if (!m.has(a.prov)) m.set(a.prov, []); m.get(a.prov).push(a); } return m; }

  function retreat(a, p) {
    const hostile = q => S.armies.some(b => !b.dead && b.prov === q && atWar(a.owner, b.owner));
    const opts = p.adj.filter(q => canEnter(a.owner, S.provs[q]) && !hostile(q));
    if (!opts.length) return false;
    opts.sort((x, y) => (S.provs[y].owner === a.owner) - (S.provs[x].owner === a.owner));
    a.retreating = true; a.path = [opts[0]]; a.prog = 0; a.morale = Math.max(a.morale, 12); return true;
  }
  function report(b, p, destroyed) {
    if (b.owner === PLAYER) log(b.name + (destroyed ? ' was destroyed at ' : ' was routed at ') + p.name + '.', 'bad');
    else if ((b.foes || []).some(x => x.owner === PLAYER)) log('Victory at ' + p.name + ': the host of ' + S.facs[b.owner].name + (destroyed ? ' is annihilated.' : ' is cut down in pursuit and flees. Catch it again and it is finished.'), 'good');
  }
  function combat(p, list) {
    const act = list.filter(a => !a.retreating && !a.dead); if (act.length < 2) return;
    const pend = new Map();
    for (const a of act) {
      const en = act.filter(b => atWar(a.owner, b.owner)); if (!en.length) continue;
      a.inCombat = true; a.foes = en; a.xp = Math.min(100, a.xp + 0.4);
      const pw = power(a, p), tot = en.reduce((s, b) => s + total(b), 0);
      for (const b of en) pend.set(b, (pend.get(b) || 0) + pw * 0.01 * rnd(0.7, 1.3) * (total(b) / tot) / tough(b, p));
    }
    for (const [b, d] of pend) { const t = total(b), c = Math.min(t, d), k = (t - c) / t; for (const u in b.men) b.men[u] *= k; b.morale -= c / t * 400 + 0.3; }
    for (const b of pend.keys()) {
      if (total(b) < 50) { b.dead = true; report(b, p, true); }
      else if (b.morale < 25) {
        const fm = b.foes.reduce((s, x) => s + total(x), 0), fc = b.foes.reduce((s, x) => s + x.men.cav + x.men.char, 0);
        const k = 1 - Math.min(0.7, 0.25 + 2 * fc / Math.max(1, fm)); for (const u in b.men) b.men[u] *= k;
        const again = b.routDay !== undefined && S.day - b.routDay < 90;
        if (!again && total(b) >= 1500 && retreat(b, p)) { b.routDay = S.day; report(b, p, false); } else { b.dead = true; report(b, p, true); }
      }
    }
  }

  function checkWin() {
    if (S.won || S.over) return;
    if (GOALS.every(n => provByName(n).owner === PLAYER)) {
      S.won = true;
      S.events.push({ title: 'King of the Four Quarters', text: 'Babylon, Damascus and Tushpa bow to Ashur. From the Upper Sea to the Lower Sea there is no rival left who dares to raise an army.<br><br>You have restored the empire in ' + Math.ceil(S.day / 360) + ' years. You may keep playing.' });
    }
  }
  function capitulate(old, victor) {
    const f = S.facs[old]; f.alive = false; f.queue = []; f.tributary = false;
    for (const p of S.provs) if (p.owner === old) { p.owner = victor; p.siege = 0; p.sieger = null; p.unrest = victor === p.core ? 0 : 50; }
    for (const a of S.armies) if (a.owner === old) a.dead = true;
    for (const id in S.facs) delete S.facs[id].war[old];
    f.war = {};
    if (old === PLAYER) { S.over = 'lose'; S.events.push({ title: 'Kalhu Has Fallen', text: 'The army of ' + S.facs[victor].name + ' is inside the citadel. The palace burns, and the name of Tiglath-Pileser is chiselled from the stelae.<br><br>Your reign lasted ' + S.day + ' days.', restart: true }); }
    else if (victor === PLAYER) { log(f.name + ' is no more. Its lands are provinces of Assyria.', 'good'); S.events.push({ title: f.name + ' Has Fallen', text: 'The capital is taken and the king led away in fetters. Every city of ' + f.name + ' now sends its tribute to Kalhu.' }); }
    else log(f.name + ' has been conquered by ' + S.facs[victor].name + '.');
  }
  function capture(p, o) {
    const old = p.owner;
    if (o === 'REB' && p.core !== old && p.core !== 'REB' && S.facs[p.core].alive) { o = p.core; for (const a of S.armies) if (a.owner === 'REB' && a.prov === p.id) a.dead = true; }
    p.owner = o; p.siege = 0; p.sieger = null; p.unrest = o === p.core ? 0 : 70;
    const loot = p.silver * 5; S.facs[o].silver += loot;
    if (o === PLAYER) log(p.name + ' has fallen to our army. Plunder: ' + loot + ' silver.', 'good');
    else if (old === PLAYER) log(p.name + ' has fallen to ' + S.facs[o].name + '.', 'bad');
    if (S.facs[old].capital === p.id) capitulate(old, o);
    checkWin();
  }

  function declareWar(a, b) {
    if (a === b || atWar(a, b) || !S.facs[a].alive || !S.facs[b].alive) return;
    const set = (x, y) => { S.facs[x].war[y] = S.day; S.facs[y].war[x] = S.day; };
    set(a, b);
    if (a === PLAYER && S.facs[b].tributary) { S.facs[b].tributary = false; log('We have broken our oath to ' + S.facs[b].name + '.', 'bad'); }
    const joined = [];
    for (const pair of ALLIES) {
      const ally = pair[0] === b ? pair[1] : pair[1] === b ? pair[0] : null;
      if (ally && ally !== a && S.facs[ally].alive && !atWar(a, ally) && !(a === PLAYER && S.facs[ally].tributary)) { set(a, ally); joined.push(S.facs[ally].name); }
    }
    const extra = joined.length ? ' ' + joined.join(' and ') + ' joins the war.' : '';
    if (a === PLAYER) log('We have declared war on ' + S.facs[b].name + '.' + extra);
    else if (b === PLAYER) { log(S.facs[a].name + ' has declared war on us.' + extra, 'bad'); S.events.push({ title: 'War with ' + S.facs[a].name, text: 'Envoys from ' + S.facs[a].name + ' have thrown down the treaty tablets. Their host is marching on our border.' + extra }); }
  }
  function allyOf(fid) { for (const p of ALLIES) { if (p[0] === fid) return p[1]; if (p[1] === fid) return p[0]; } return null; }
  function makePeace(a, b) {
    delete S.facs[a].war[b]; delete S.facs[b].war[a];
    for (const x of S.armies) {
      const o = x.owner === a ? b : x.owner === b ? a : null; if (!o) continue;
      if (S.provs[x.prov].owner === o) { x.prov = S.facs[x.owner].capital; x.path = []; x.retreating = false; }
      else if (x.path.some(q => S.provs[q].owner === o)) x.path = [];
    }
    for (const p of S.provs) if ((p.owner === a && p.sieger === b) || (p.owner === b && p.sieger === a)) { p.siege = 0; p.sieger = null; }
  }
  function proposePeace(fid) {
    const f = S.facs[fid], since = S.facs[PLAYER].war[fid]; if (since === undefined) return 'We are not at war.';
    const dur = S.day - since;
    if (dur < 90) return 'They will not hear envoys so soon. Try again in ' + (90 - dur) + ' days.';
    const theirs = menOf(fid), ours = menOf(PLAYER), n = countProvs(fid);
    if (n > f.start && theirs > ours * 0.8) return f.name + ' is winning and refuses.';
    if (n < f.start || theirs < ours * 0.7 || dur > 360) { makePeace(PLAYER, fid); log('Peace with ' + f.name + '. Each side keeps what it holds.'); return null; }
    return f.name + ' refuses. They do not feel beaten.';
  }

  function recruit(fid, type, prov) {
    const f = S.facs[fid], u = UNITS[type];
    const cost = Math.round(u.cost * ((type === 'cav' || type === 'char') ? f.mods.cav : 1));
    if (f.silver < cost || f.mp < u.men) return false;
    f.silver -= cost; f.mp -= u.men; f.queue.push({ type, left: u.days, prov: prov === undefined ? null : prov }); return true;
  }
  function unitCost(fid, type) { const f = S.facs[fid]; return Math.round(UNITS[type].cost * ((type === 'cav' || type === 'char') ? f.mods.cav : 1)); }
  function muster(f, q) {
    const type = q.type, at = (q.prov !== null && q.prov !== undefined && S.provs[q.prov].owner === f.id) ? q.prov : f.capital;
    let a = S.armies.find(x => !x.dead && x.owner === f.id && x.prov === at && !x.path.length && !x.retreating);
    if (!a) a = mkArmy(f.id, at, {}, f.id === PLAYER ? 'Levy of ' + S.provs[at].name + ' ' + (S.levy++) : 'Host of ' + f.name);
    a.men[type] += UNITS[type].men;
    if (f.id === PLAYER) log(UNITS[type].name + ' mustered at ' + S.provs[at].name + ' and joined ' + a.name + '.');
  }
  function startEdict(id) {
    const f = S.facs[PLAYER], e = EDICTS.find(x => x.id === id);
    if (!e || f.edict || f.done[id] || !e.req.every(r => f.done[r])) return false;
    f.edict = { id, left: e.days }; return true;
  }
  function split(a) {
    if (total(a) < 2000 || a.inCombat || a.retreating) return null;
    const men = {}; for (const t in a.men) { men[t] = a.men[t] / 2; a.men[t] /= 2; }
    const b = mkArmy(a.owner, a.prov, men, a.name + ' II'); b.morale = a.morale; b.xp = a.xp; return b;
  }
  function merge(a) {
    let n = 0;
    for (const b of S.armies) {
      if (b === a || b.dead || b.owner !== a.owner || b.prov !== a.prov || b.retreating || a.retreating) continue;
      const ta = total(a), tb = total(b); a.morale = (a.morale * ta + b.morale * tb) / Math.max(1, ta + tb);
      for (const t in a.men) a.men[t] += b.men[t]; b.dead = true; n++;
    }
    S.armies = S.armies.filter(x => !x.dead); return n;
  }
  function econ(f) {
    const base = g => { let v = 0; for (const p of S.provs) if (p.owner === g.id) v += (p.silver + p.bld.m * 6) * (1 - p.unrest / 100); return v * g.mods.silver; };
    let inc = base(f), mp = 0, trib = 0; for (const p of S.provs) if (p.owner === f.id) mp += (p.mp + p.bld.g * 300) * (1 - p.unrest / 100);
    if (f.tributary) inc *= 0.65;
    if (f.id === PLAYER) for (const id in S.facs) if (S.facs[id].tributary && S.facs[id].alive) trib += base(S.facs[id]) * 0.35;
    return { inc: Math.round(inc + trib), trib: Math.round(trib), up: Math.round(menOf(f.id) * 0.002), mp: Math.round(mp * f.mods.mp) };
  }

  function ai(f) {
    const mine = S.armies.filter(a => a.owner === f.id && !a.dead);
    for (const a of mine) { if (!a.dead && !a.path.length && !a.inCombat && !a.retreating && mine.some(b => b !== a && !b.dead && b.prov === a.prov && !b.path.length && !b.retreating && !b.inCombat)) merge(a); }
    const enemies = Object.keys(f.war).filter(k => S.facs[k].alive);
    for (const a of S.armies.filter(x => x.owner === f.id)) {
      if (a.inCombat || a.retreating || a.path.length) continue;
      if (!enemies.length) { if (a.prov !== f.capital) order(a, f.capital); continue; }
      if (atWar(f.id, S.provs[a.prov].owner)) continue;
      const myP = rawPower(a) * (0.5 + a.morale / 200), r = bfs(f.id, a.prov);
      let best = null, bs = 1e9;
      for (const [pid, d] of r.dist) {
        if (!d || d > 7) continue;
        const p = S.provs[pid], enemyLand = atWar(f.id, p.owner);
        let foe = 0; for (const b of S.armies) if (!b.dead && b.prov === pid && atWar(f.id, b.owner)) foe += rawPower(b);
        if (!enemyLand && !foe) continue;
        if (myP < foe * (enemyLand ? 1.4 : 1.05)) continue;
        if (enemyLand && total(a) < 2500) continue;
        const sc = d - (foe && !enemyLand ? 2.5 : 0) - (enemyLand && S.facs[p.owner].capital === pid ? 1 : 0) + Math.random() * 0.6;
        if (sc < bs) { bs = sc; best = pid; }
      }
      if (best !== null) order(a, best); else if (a.prov !== f.capital) order(a, f.capital);
    }
  }
  function aiRecruit(f) {
    let men = menOf(f.id) + f.queue.reduce((s, q) => s + UNITS[q.type].men, 0);
    const cap = (countProvs(f.id) * 3000 + 3000) * (Object.keys(f.war).length ? 1.4 : 1);
    for (let n = 0; n < 3 && men < cap; n++) {
      const r = Math.random(), t = r < 0.45 ? 'spear' : r < 0.75 ? 'bow' : r < 0.9 ? 'cav' : r < 0.95 ? 'char' : 'ram';
      if (!recruit(f.id, t)) break; men += UNITS[t].men;
    }
  }
  function monthly() {
    for (const id in S.facs) {
      const f = S.facs[id]; if (!f.alive || id === 'REB') continue;
      const e = econ(f); f.silver += e.inc - e.up; f.mp = Math.min(60000, f.mp + e.mp);
      if (f.silver < 0) {
        f.silver = 0; for (const a of S.armies) if (a.owner === id) a.morale = Math.max(5, a.morale - 15);
        if (id === PLAYER) log('The treasury is empty. Unpaid soldiers are deserting.', 'bad');
      }
      if (id !== PLAYER || S.auto) aiRecruit(f);
    }
    if (S.day > 240) {
      const ours = menOf(PLAYER);
      for (const id in S.facs) {
        const f = S.facs[id]; if (id === PLAYER || id === 'REB' || f.tributary || !f.alive || atWar(id, PLAYER)) continue;
        const borders = S.provs.some(p => p.owner === id && p.adj.some(q => S.provs[q].owner === PLAYER));
        if (borders && menOf(id) > ours && Math.random() < 0.04) declareWar(id, PLAYER);
      }
    }
    world();
  }

  const BUILD = { m: { name: 'Market', cost: 120, max: 2, desc: '+6 silver' }, g: { name: 'Granary', cost: 90, max: 2, desc: '+300 manpower' }, w: { name: 'Walls', cost: 100, max: 4, desc: '+1 walls' } };
  function build(pid, k) {
    const p = S.provs[pid], f = S.facs[PLAYER], b = BUILD[k]; if (!p || p.owner !== PLAYER || !b) return false;
    if ((k === 'w' ? p.fort : p.bld[k]) >= b.max || f.silver < b.cost) return false;
    f.silver -= b.cost; if (k === 'w') p.fort++; else p.bld[k]++; return true;
  }
  function storm(a) {
    const p = S.provs[a.prov];
    if (a.inCombat || a.retreating || a.path.length || !atWar(a.owner, p.owner) || p.sieger !== a.owner || a.stormCd > S.day) return false;
    const loss = 0.04 + 0.03 * p.fort; for (const t in a.men) a.men[t] *= 1 - loss;
    a.morale = Math.max(10, a.morale - 20); a.stormCd = S.day + 10; p.siege += siegeNeed(p) * 0.35;
    if (a.owner === PLAYER) log(a.name + ' storms the walls of ' + p.name + '. ' + Math.round(loss * 100) + '% of the men fall.');
    if (p.siege >= siegeNeed(p)) capture(p, a.owner);
    S.armies = S.armies.filter(x => !x.dead); return true;
  }
  function demandTribute(fid) {
    const f = S.facs[fid]; if (!f.alive) return 'They are gone.'; if (f.tributary) return f.name + ' already pays tribute.';
    const theirs = menOf(fid), ours = menOf(PLAYER), war = atWar(PLAYER, fid);
    const ok = war ? (S.day - S.facs[PLAYER].war[fid] >= 60 && (countProvs(fid) < f.start || theirs < ours * 0.5)) : theirs * 3 < ours;
    if (!ok) return war ? f.name + ' will not bow yet. Break their army or take a province first.' : f.name + ' laughs at your envoys. Your army must be three times theirs.';
    if (war) makePeace(PLAYER, fid);
    f.tributary = true; log(f.name + ' kisses the royal feet and will pay tribute every month.', 'good'); return null;
  }
  function revolt(p) {
    const n = 2500 + Math.random() * 3000;
    mkArmy('REB', p.id, { spear: n * 0.7, bow: n * 0.3 }, 'Rebels of ' + p.name);
    S.facs.REB.war[p.owner] = S.day; S.facs[p.owner].war.REB = S.day;
    if (p.owner === PLAYER) log('Revolt in ' + p.name + '! Rebels are besieging the city.', 'bad');
  }
  function randomEvent() {
    const f = S.facs[PLAYER], mine = S.armies.filter(a => a.owner === PLAYER);
    const big = mine.slice().sort((a, b) => total(b) - total(a))[0];
    const outer = S.provs.filter(p => p.owner === PLAYER && p.id !== f.capital), X = outer[Math.floor(Math.random() * outer.length)];
    const all = fn => { for (const a of S.armies) if (a.owner === PLAYER) fn(a); };
    const pool = [
      { title: 'An Eclipse of the Sun', text: 'The sun went dark at midday over Ashur. The astrologers say the omen points at the king himself, and the soldiers are whispering.', choices: [
        { label: 'Enthrone a substitute king (80 silver)', fx: () => { if (f.silver >= 80) { f.silver -= 80; all(a => { a.morale = Math.min(100, a.morale + 15); }); log('The omen is turned aside. The army takes heart.', 'good'); } else { all(a => { a.morale = Math.max(10, a.morale - 25); }); log('The treasury could not pay for the ritual. Fear spreads.', 'bad'); } } },
        { label: 'Ignore the omen', fx: () => { all(a => { a.morale = Math.max(10, a.morale - 25); }); log('Fear spreads through the camps.', 'bad'); } }] },
      { title: 'Caravan from the Sea Coast', text: 'Merchants of Tyre and Arwad ask leave to trade in the heartland. They offer the king a gift of his choosing.', choices: [
        { label: 'Take their silver (+150)', fx: () => { f.silver += 150; } },
        { label: 'Take their engineers (free siege train)', fx: () => { muster(f, { type: 'ram', prov: null }); } }] },
      { title: 'A Bountiful Harvest', text: 'The Tigris flooded gently this year and the barley stands taller than a man.', choices: [
        { label: 'Fill the granaries (+5000 manpower)', fx: () => { f.mp += 5000; } },
        { label: 'Sell the surplus (+120 silver)', fx: () => { f.silver += 120; } }] },
      { title: 'Horse Traders of the Zagros', text: 'Mountain chiefs have driven a herd of fine horses down to the plain, with riders who know them.', choices: [
        { label: 'Buy the herd (60 silver, 500 cavalry)', fx: () => { if (f.silver >= 60) { f.silver -= 60; muster(f, { type: 'cav', prov: null }); } else log('We could not afford the horses.', 'bad'); } },
        { label: 'Send them away', fx: () => { } }] },
      { title: 'Scribes of Babylon', text: 'Scholars fleeing the troubles in the south offer their service to the king of Assyria.', choices: [
        { label: 'Set them to drafting edicts', fx: () => { if (f.edict) { f.edict.left = Math.max(1, f.edict.left - 40); log('The scribes speed the current edict by 40 days.', 'good'); } else { f.silver += 60; log('With no edict in hand, the scribes tidy the tax rolls. +60 silver.'); } } },
        { label: 'Have them school the generals', fx: () => { all(a => { a.xp = Math.min(100, a.xp + 15); }); log('Every army gains veterancy.', 'good'); } }] }
    ];
    if (X) pool.push({ title: 'A Governor Plots', text: 'The governor of ' + X.name + ' has been hoarding grain and hiring guards. Your spies say he means to make himself king.', choices: [
      { label: 'Buy his loyalty (100 silver)', fx: () => { if (f.silver >= 100) f.silver -= 100; else { X.unrest = Math.min(100, X.unrest + 55); log('We could not pay. ' + X.name + ' seethes.', 'bad'); } } },
      { label: 'Send the executioner', fx: () => { X.unrest = Math.min(100, X.unrest + 55); log('The governor is flayed. ' + X.name + ' seethes with unrest.', 'bad'); } }] });
    if (big) {
      pool.push({ title: 'Fever in the Camp', text: 'A sickness is moving through the tents of ' + big.name + '. The physicians beg the king to halt.', choices: [
        { label: 'Burn the tents and rest (40 silver)', fx: () => { f.silver = Math.max(0, f.silver - 40); for (const t in big.men) big.men[t] *= 0.95; } },
        { label: 'March on regardless', fx: () => { for (const t in big.men) big.men[t] *= 0.86; big.morale = Math.max(10, big.morale - 10); log(big.name + ' loses many men to fever.', 'bad'); } }] });
      pool.push({ title: 'A Veteran Asks to Serve', text: 'A scarred captain of the old king has come to court. He asks for a command.', choices: [
        { label: 'Give him ' + big.name, fx: () => { big.gen = { name: GEN[Math.floor(Math.random() * GEN.length)], skill: Math.min(5, big.gen.skill + 2) }; log(big.gen.name + ' takes command of ' + big.name + '.', 'good'); } },
        { label: 'Feast him and send him home', fx: () => { all(a => { a.morale = Math.min(100, a.morale + 10); }); } }] });
    }
    S.events.push(pool[Math.floor(Math.random() * pool.length)]);
  }
  function world() {
    const by = group();
    for (const p of S.provs) {
      if (p.type !== 'land' || p.owner === 'REB' || p.unrest <= 0) continue;
      const garr = (by.get(p.id) || []).some(a => a.owner === p.owner);
      p.unrest = Math.max(0, p.unrest - (garr ? 7 : 2));
    }
    purgeRebels();
    for (const id in S.facs) {
      const f = S.facs[id]; if (id === PLAYER || id === 'REB' || !f.alive) continue;
      for (const o of Object.keys(f.war)) if (o !== PLAYER && o !== 'REB' && S.day - f.war[o] > 420) { makePeace(id, o); log(f.name + ' and ' + S.facs[o].name + ' have made peace.'); }
      if (S.day > 300 && !Object.keys(f.war).length && !f.tributary && Math.random() < 0.02) {
        const mine = menOf(id), c = Object.keys(S.facs).filter(o => o !== id && o !== PLAYER && o !== 'REB' && S.facs[o].alive && allyOf(id) !== o && menOf(o) < mine * 0.8 &&
          S.provs.some(p => p.owner === id && p.adj.some(q => S.provs[q].owner === o)));
        if (c.length) { const o = c[Math.floor(Math.random() * c.length)]; declareWar(id, o); log(f.name + ' has gone to war with ' + S.facs[o].name + '.'); }
      }
      if (f.tributary && menOf(id) > menOf(PLAYER) * 0.9 && Math.random() < 0.08) { f.tributary = false; log(f.name + ' has stopped paying tribute.', 'bad'); }
    }
    if (!S.auto && S.day >= S.nextEvent) { randomEvent(); S.nextEvent = S.day + 140 + Math.floor(Math.random() * 120); }
  }
  function purgeRebels() {
    for (const a of S.armies) if (a.owner === 'REB') a.dead = true;
    S.armies = S.armies.filter(a => !a.dead);
    for (const p of S.provs) {
      if (p.owner === 'REB') p.owner = S.facs[p.core].alive ? p.core : PLAYER;
      if (p.sieger === 'REB') { p.sieger = null; p.siege = 0; }
    }
    for (const id in S.facs) delete S.facs[id].war.REB;
    S.facs.REB.war = {};
  }
  function save() { return JSON.stringify(S, (k, v) => (k === 'foes' || k === 'events') ? undefined : v); }
  function load(str) { S = JSON.parse(str); S.events = []; purgeRebels(); return S; }

  function tick() {
    if (S.over === 'lose') return;
    S.day++;
    for (const id in S.facs) {
      const f = S.facs[id]; if (!f.alive) continue;
      for (const q of f.queue) q.left--;
      const done = f.queue.filter(q => q.left <= 0); f.queue = f.queue.filter(q => q.left > 0);
      for (const q of done) muster(f, q);
      if (f.edict && --f.edict.left <= 0) {
        const e = EDICTS.find(x => x.id === f.edict.id); e.fx(f.mods); f.done[e.id] = true; f.edict = null;
        log('Edict proclaimed: ' + e.name + '.', 'good');
      }
    }
    for (const a of S.armies) a.inCombat = false;
    for (const [pid, list] of group()) combat(S.provs[pid], list);
    S.armies = S.armies.filter(a => !a.dead);
    const winter = isWinter();
    for (const a of S.armies) {
      const p = S.provs[a.prov]; a.attr = p.owner !== a.owner && ((winter && p.mtn) || total(a) > 20000);
      if (a.attr) for (const t in a.men) a.men[t] *= 0.9985;
    }
    for (const a of S.armies) {
      if (!a.path.length) { if (!a.inCombat) a.morale = Math.min(100, a.morale + 1.2); continue; }
      if (a.inCombat && !a.retreating) continue;
      const d = S.provs[a.path[0]];
      if (!canEnter(a.owner, d)) { a.path = []; a.retreating = false; continue; }
      a.prog++;
      if (a.prog >= (d.mtn ? 9 : 6) / S.facs[a.owner].mods.speed * (a.retreating ? 0.6 : 1)) {
        a.prov = d.id; a.path.shift(); a.prog = 0;
        if (a.retreating) { a.retreating = false; a.path = []; }
      }
    }
    const by = group();
    for (const p of S.provs) {
      if (p.type !== 'land') continue;
      const here = (by.get(p.id) || []).filter(a => !a.dead && !a.retreating);
      const bes = here.filter(a => !a.path.length && atWar(a.owner, p.owner));
      const blocked = here.some(a => bes.some(b => atWar(a.owner, b.owner)));
      if (bes.length && !blocked) {
        const str = {}; for (const a of bes) str[a.owner] = (str[a.owner] || 0) + total(a);
        const o = Object.keys(str).sort((x, y) => str[y] - str[x])[0];
        const rams = bes.reduce((s, a) => s + (a.owner === o ? a.men.ram : 0), 0);
        if (p.sieger !== o) { p.sieger = o; p.siege = 0; }
        p.siege += Math.min(1, str[o] / 3000) * (1 + Math.min(2, rams / 300 * 0.5)) * S.facs[o].mods.siege;
        if (p.siege >= siegeNeed(p)) capture(p, o);
      } else if (p.siege > 0) { p.siege = Math.max(0, p.siege - 1); if (!p.siege) p.sieger = null; }
    }
    S.armies = S.armies.filter(a => !a.dead);
    if (S.over === 'lose') return;
    if (S.day % 5 === 0) for (const id in S.facs) { const f = S.facs[id]; if (f.alive && (id !== PLAYER || S.auto)) ai(f); }
    if (S.day % 30 === 0) monthly();
    if (S.day === 120 && S.facs.URA.alive && !S.facs.URA.tributary && !atWar('URA', PLAYER)) declareWar('URA', PLAYER);
  }

  root.Game = {
    W, H, PLAYER, UNITS, EDICTS, GOALS, ALLIES, PDEF,
    newGame, tick, BUILD, build, storm, demandTribute, save, load, isWinter, order, halt, recruit, unitCost, startEdict, declareWar, proposePeace, split, merge, econ,
    reach: (fid, from) => bfs(fid, from).dist, total, menOf, countProvs, atWar, canEnter, findPath, siegeNeed, dateStr, provByName, allyOf,
    get S() { return S; }
  };
})(typeof window !== 'undefined' ? window : globalThis);
