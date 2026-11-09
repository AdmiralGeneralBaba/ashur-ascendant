/* Ashur Ascendant: interface, graphics and sound. */
(function () {
  'use strict';
  const G = window.Game, ME = G.PLAYER, $ = id => document.getElementById(id);
  const svg = $('map'), SPEEDS = [0, 1, 3, 8];
  const DEFAULT_HINT = 'Click an army, then click a province to march. Scroll to zoom, drag to pan. Space pauses.';
  let S = G.newGame(), speed = 0, acc = 0, selArmy = null, selProv = null, modal = null, hint = '', hintUntil = 0;
  let vb = { x: 0, y: 0, w: 1200, h: 700 }, drag = null, floaters = [], prevOwner = {}, fights = new Set(), heard = new WeakSet(), panelAt = 0;
  const polys = {}, cache = {};
  const fmt = n => n >= 1000 ? (n / 1000).toFixed(n >= 10000 ? 0 : 1) + 'k' : String(Math.round(n));
  const xy = (lon, lat) => ((lon - 30) * 50) + ',' + ((41 - lat) * 50);
  function setHTML(id, html) { if (cache[id] !== html) { cache[id] = html; $(id).innerHTML = html; } }
  function say(t) { hint = t; hintUntil = Date.now() + 3500; }

  /* ---------- sound (synthesised, no files) ---------- */
  let ac = null, master = null, rev = null, muted = false, music = true, lastSfx = {}, musicT = 0, mIdx = 4, mCount = 0;
  const SAVE = 'ashur-save-v2';
  function audio() {
    if (!ac) {
      try {
        ac = new (window.AudioContext || window.webkitAudioContext)();
        const comp = ac.createDynamicsCompressor(); master = ac.createGain(); master.gain.value = muted ? 0 : 0.6; master.connect(comp); comp.connect(ac.destination);
        const len = Math.floor(ac.sampleRate * 2.6), ir = ac.createBuffer(2, len, ac.sampleRate);
        for (let c = 0; c < 2; c++) { const dd = ir.getChannelData(c); for (let i = 0; i < len; i++) dd[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.8); }
        const cv = ac.createConvolver(); cv.buffer = ir; rev = ac.createGain(); rev.gain.value = 0.5; rev.connect(cv); cv.connect(master);
      } catch (e) { return false; }
    }
    if (ac.state === 'suspended') ac.resume();
    return true;
  }
  function out(node, wet) { node.connect(master); if (wet) { const g = ac.createGain(); g.gain.value = wet; node.connect(g); g.connect(rev); } }
  function osc(type, f, at, a, dcy, vol, o) {
    o = o || {}; const t = ac.currentTime + at, os = ac.createOscillator(), g = ac.createGain();
    os.type = type; os.frequency.setValueAtTime(f, t); if (o.to) os.frequency.exponentialRampToValueAtTime(o.to, t + a + dcy); if (o.detune) os.detune.value = o.detune;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + dcy);
    let n = os;
    if (o.lp) { const fl = ac.createBiquadFilter(); fl.type = 'lowpass'; fl.Q.value = 1.2; fl.frequency.setValueAtTime(o.lp, t); if (o.lpTo) fl.frequency.exponentialRampToValueAtTime(o.lpTo, t + a + dcy * 0.5); os.connect(fl); n = fl; }
    n.connect(g); out(g, o.wet || 0); os.start(t); os.stop(t + a + dcy + 0.1);
  }
  function nz(at, a, dcy, vol, type, freq, wet, freqTo) {
    const dur = a + dcy, n = Math.floor(ac.sampleRate * dur), buf = ac.createBuffer(1, n, ac.sampleRate), ch = buf.getChannelData(0);
    for (let i = 0; i < n; i++) ch[i] = Math.random() * 2 - 1;
    const src = ac.createBufferSource(), fl = ac.createBiquadFilter(), g = ac.createGain(), t = ac.currentTime + at;
    src.buffer = buf; fl.type = type; fl.frequency.setValueAtTime(freq, t); if (freqTo) fl.frequency.exponentialRampToValueAtTime(freqTo, t + dur); fl.Q.value = 0.9;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(fl); fl.connect(g); out(g, wet || 0); src.start(t);
  }
  const drum = (at, vol, f) => { f = f || 78; osc('sine', f * 1.9, at, 0.004, 0.26, vol, { to: f * 0.6, wet: 0.3 }); nz(at, 0.003, 0.06, vol * 0.5, 'lowpass', 1100, 0.2); };
  const horn = (f, at, d, vol, to) => { osc('sawtooth', f, at, 0.09, d, vol, { lp: 380, lpTo: 1500, detune: -7, wet: 0.6, to: to }); osc('sawtooth', f, at, 0.09, d, vol, { lp: 380, lpTo: 1500, detune: 7, wet: 0.6, to: to }); osc('sine', f / 2, at, 0.1, d, vol * 0.8, { wet: 0.3, to: to ? to / 2 : 0 }); };
  const clash = (at, vol) => { const b = 850 + Math.random() * 700; [1, 1.48, 2.09, 2.9, 3.71].forEach((r, i) => osc(i % 2 ? 'square' : 'triangle', b * r, at, 0.002, 0.1 + Math.random() * 0.3, vol / (1 + i * 0.5), { wet: 0.5 })); nz(at, 0.002, 0.1, vol * 2.5, 'highpass', 4200, 0.4); };
  const gong = (at, f, vol) => { [1, 2.02, 2.74, 3.76, 5.1].forEach((r, i) => osc('sine', f * r, at, 0.006, 2.8 / (i + 1) + 0.6, vol / (1 + i * 0.9), { wet: 0.8, to: f * r * 0.985 })); nz(at, 0.003, 0.12, vol, 'lowpass', 420, 0.5); };
  const pluck = (f, at, vol) => { osc('triangle', f, at, 0.004, 1.2, vol, { wet: 0.6 }); osc('sine', f * 2.005, at, 0.004, 0.45, vol * 0.35, { wet: 0.5 }); nz(at, 0.001, 0.02, vol * 0.6, 'bandpass', f * 3, 0.1); };
  const roar = (at, d, vol) => { nz(at, d * 0.35, d * 0.65, vol, 'bandpass', 650, 0.6, 900); nz(at, d * 0.4, d * 0.6, vol * 0.5, 'bandpass', 1500, 0.5); };
  const SFX = {
    click: () => { nz(0, 0.001, 0.03, 0.2, 'highpass', 2600); pluck(880, 0, 0.05); },
    select: () => { pluck(587, 0, 0.14); pluck(880, 0.08, 0.11); },
    march: () => { [0, 0.22, 0.44, 0.55, 0.66].forEach((t, i) => drum(t, i === 0 || i === 2 ? 0.7 : 0.4)); for (let i = 0; i < 6; i++) nz(i * 0.13, 0.01, 0.07, 0.12, 'lowpass', 500, 0.2); },
    clash: () => { clash(0, 0.06); clash(0.07 + Math.random() * 0.15, 0.045); if (Math.random() < 0.5) nz(0.1, 0.05, 0.25, 0.1, 'bandpass', 3000, 0.3, 600); if (Math.random() < 0.4) roar(0, 0.9, 0.06); },
    win: () => { horn(196, 0, 0.45, 0.1); horn(262, 0.3, 0.45, 0.1); horn(392, 0.6, 1.4, 0.12); roar(0.2, 2, 0.22); [0, 0.3, 0.6].forEach(t => drum(t, 0.6)); },
    lose: () => { horn(175, 0, 0.9, 0.1, 160); horn(131, 0.7, 1.6, 0.1, 110); drum(0, 0.6, 60); drum(0.7, 0.6, 55); },
    capture: () => { gong(0, 98, 0.35); roar(0.1, 2.2, 0.28); clash(0.05, 0.04); horn(294, 0.5, 1, 0.07); },
    war: () => { horn(98, 0, 1.7, 0.14); horn(147, 0.2, 1.6, 0.09); [0, 0.5, 1, 1.25, 1.5].forEach(t => drum(t, 0.7, 62)); },
    alarm: () => { horn(233, 0, 0.3, 0.1); horn(233, 0.42, 0.3, 0.1); horn(311, 0.84, 0.7, 0.1); drum(0, 0.5); drum(0.42, 0.5); },
    coin: () => { [[2093, 3136], [2637, 3951]].forEach((p, i) => { osc('sine', p[0], i * 0.08, 0.002, 0.3, 0.1, { wet: 0.3 }); osc('sine', p[1], i * 0.08, 0.002, 0.2, 0.06, { wet: 0.3 }); }); },
    muster: () => { for (let i = 0; i < 7; i++) drum(i * 0.065, 0.25 + i * 0.05, 110); horn(294, 0.5, 0.45, 0.07); },
    chime: () => { [294, 370, 440, 587, 740].forEach((f, i) => pluck(f, i * 0.12, 0.13)); },
    storm: () => { roar(0, 2.2, 0.3); for (let i = 0; i < 6; i++) clash(0.2 + i * 0.22 + Math.random() * 0.1, 0.04); [0, 0.35, 0.7, 1.05].forEach(t => drum(t, 0.75, 58)); },
    build: () => { [0, 0.2, 0.4].forEach(t => { osc('square', 320, t, 0.002, 0.06, 0.07, { lp: 1800, wet: 0.3 }); nz(t, 0.002, 0.05, 0.25, 'bandpass', 1400, 0.3); }); },
    event: () => { gong(0, 147, 0.14); pluck(294, 0.25, 0.1); pluck(311, 0.5, 0.1); },
    error: () => osc('sine', 190, 0, 0.005, 0.16, 0.14, { to: 120 })
  };
  function sfx(name) {
    const now = Date.now(); if (muted || (lastSfx[name] && now - lastSfx[name] < 250) || !ac || ac.state !== 'running') return;
    lastSfx[name] = now; try { SFX[name](); } catch (e) { /* audio is optional */ }
  }
  const SCALE = [146.83, 155.56, 185, 196, 220, 233.08, 261.63, 293.66, 311.13, 370, 392, 440];
  function musicTick() {
    if (!ac || ac.state !== 'running' || muted || !music || ac.currentTime < musicT) return;
    const battle = fights.size > 0, r = Math.random();
    mIdx = Math.max(0, Math.min(SCALE.length - 1, mIdx + (r < 0.4 ? -1 : r < 0.8 ? 1 : r < 0.9 ? -2 : 2)));
    if (Math.random() < 0.82) pluck(SCALE[mIdx], 0, 0.055);
    if (mCount % 4 === 0) pluck(SCALE[mIdx % 3 === 0 ? 0 : 4] / 2, 0, 0.05);
    if (mCount % 8 === 0) { osc('sine', 73.42, 0, 1.2, 5, 0.05, { wet: 0.5 }); osc('sine', 110, 0, 1.5, 4.5, 0.025, { wet: 0.5 }); }
    if (battle) { drum(0, 0.3, 66); if (mCount % 2) drum(0.2, 0.18, 66); }
    mCount++;
    const steps = battle ? [0.4, 0.4, 0.4, 0.8] : [0.45, 0.45, 0.9, 0.9, 1.35, 1.8];
    musicT = ac.currentTime + steps[Math.floor(Math.random() * steps.length)];
  }

  /* ---------- map ---------- */
  const ICONS = {
    spear: '<path d="M2.5 10.5L9 2.5M9 2.5l-2.2.6M9 2.5l-.5 2.2"/><circle cx="4.5" cy="7.5" r="2.2"/>',
    bow: '<path d="M4 1.5Q10.5 6 4 10.5M4 1.5v9M1.5 6h7.5M9 6L7.4 4.8M9 6L7.4 7.2"/>',
    cav: '<path d="M3.5 10.5L4.5 6 7.5 2l.6 2 2 2.2-1 1.5-2.4-.9L6.5 10.5"/>',
    char: '<circle cx="6" cy="6" r="4"/><path d="M6 2v8M2 6h8M3.2 3.2l5.6 5.6M8.8 3.2L3.2 8.8"/>',
    ram: '<path d="M1.5 5h7v2.5h-7zM8.5 4.2l2 2-2 2"/><circle cx="3.5" cy="9.5" r="1.2"/><circle cx="7" cy="9.5" r="1.2"/>'
  };
  const uiIcon = t => '<svg class="ui ic" viewBox="0 0 12 12"><use href="#i-' + t + '"/></svg>';

  function build() {
    let h = '<defs>' +
      '<linearGradient id="gsea" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2d587f"/><stop offset="1" stop-color="#1c3856"/></linearGradient>' +
      '<pattern id="pwv" width="26" height="13" patternUnits="userSpaceOnUse"><path d="M0 7q6.5-5 13 0t13 0" fill="none" stroke="rgba(160,200,235,.16)"/></pattern>' +
      '<pattern id="pw" width="12" height="12" patternUnits="userSpaceOnUse"><rect width="12" height="12" fill="#dccb9f"/><path d="M1 8q3-3 6 0M7 3q2-2 4 0" fill="none" stroke="#c4af7d" stroke-width=".7"/></pattern>' +
      '<pattern id="pm" width="16" height="11" patternUnits="userSpaceOnUse"><path d="M2 9l3.5-6 3.5 6M5.5 3l1.2 2.8" fill="none" stroke="rgba(40,25,10,.3)"/></pattern>' +
      '<radialGradient id="glow"><stop offset="0" stop-color="#fff" stop-opacity=".9"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>';
    for (const t in ICONS) h += '<symbol id="i-' + t + '" viewBox="0 0 12 12">' + ICONS[t] + '</symbol>';
    h += '</defs><rect width="1200" height="700" fill="url(#gsea)"/><rect width="1200" height="700" fill="url(#pwv)"/>';
    let lab = '', mt = '', coast = '';
    for (const p of S.provs) {
      if (!p.poly.length || p.type === 'sea') continue;
      const pts = p.poly.map(v => v[0].toFixed(1) + ',' + v[1].toFixed(1)).join(' ');
      coast += '<polygon points="' + pts + '" fill="#e9dcb4" stroke="rgba(190,220,245,.35)" stroke-width="7" stroke-linejoin="round"/>';
      if (p.type === 'waste') { mt += '<polygon points="' + pts + '" fill="url(#pw)" stroke="#cdb98a" stroke-width=".6"/>'; continue; }
      h += '';
      lab += '<polygon id="p' + p.id + '" class="land" data-prov="' + p.id + '" points="' + pts + '" fill-opacity=".82"/>';
      if (p.mtn) mt += '<polygon points="' + pts + '" fill="url(#pm)" pointer-events="none"/>';
    }
    let city = '';
    for (const p of S.provs) {
      if (p.type !== 'land') continue;
      const cap = Object.values(S.facs).some(f => f.capital === p.id);
      city += (cap ? '<g transform="translate(' + p.x + ',' + p.y + ')" pointer-events="none"><path d="M-6 3h12v-2.5h-2.2v-2.5h-2.2v-2.5h-3.2v2.5h-2.2v2.5h-2.2z" fill="#f6e3a0" stroke="#2a1d0c" stroke-width=".9"/></g>'
        : '<circle cx="' + p.x + '" cy="' + p.y + '" r="2.1" fill="#2a1d0c" stroke="#f3e6c0" stroke-width=".7" pointer-events="none"/>') +
        '<text class="lbl" x="' + p.x + '" y="' + (p.y + 12.5) + '"' + (cap ? ' style="font-weight:bold;font-size:8.5px"' : '') + '>' + p.name + '</text>';
    }
    const river = pts => '<polyline points="' + pts.map(q => xy(q[0], q[1])).join(' ') + '" fill="none" stroke="#3f7fb8" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round" opacity=".8" pointer-events="none"/>';
    const rivers = river([[40.5, 38.3], [42, 37.3], [43.1, 36.4], [43.3, 35.4], [44.2, 33.8], [45.5, 32.5], [47.3, 31], [48, 30.4]]) +
      river([[39, 38.8], [38.3, 37.5], [38, 36.8], [38.8, 35.9], [40.4, 35], [41.9, 34.2], [43.5, 33.4], [44.5, 32.3], [46, 31.2], [47.4, 31]]) +
      river([[31.2, 27], [31.2, 29.9], [31.3, 31.4]]);
    svg.innerHTML = h + coast + lab + mt + rivers + '<g id="gn" pointer-events="none"></g>' + city + '<g id="gf" pointer-events="none"></g><g id="ga"></g><g id="gx" pointer-events="none"></g>';
    for (const p of S.provs) if (p.type === 'land') { polys[p.id] = $('p' + p.id); prevOwner[p.id] = p.owner; }
  }
  function applyVB() {
    vb.w = Math.max(300, Math.min(1200, vb.w)); vb.h = vb.w * 7 / 12;
    vb.x = Math.max(0, Math.min(1200 - vb.w, vb.x)); vb.y = Math.max(0, Math.min(700 - vb.h, vb.y));
    svg.setAttribute('viewBox', vb.x.toFixed(1) + ' ' + vb.y.toFixed(1) + ' ' + vb.w.toFixed(1) + ' ' + vb.h.toFixed(1));
  }

  function armyXY(a, idx) {
    const p = S.provs[a.prov]; let x = p.x, y = p.y - 7 - idx * 29;
    if (a.path.length && !(a.inCombat && !a.retreating)) {
      const d = S.provs[a.path[0]], need = (d.mtn ? 9 : 6) / S.facs[a.owner].mods.speed * (a.retreating ? 0.6 : 1);
      const f = Math.max(0, Math.min(1, (a.prog + (speed && !modal ? acc : 0)) / need));
      x += (d.x - p.x) * f; y = p.y - 7 + (d.y - p.y) * f - idx * 29 * (1 - f);
    }
    return [x, y];
  }
  function drawArmies(now) {
    const by = {}; for (const a of S.armies) (by[a.prov] = by[a.prov] || []).push(a);
    const items = [];
    for (const pid in by) by[pid].forEach((a, i) => { const q = armyXY(a, i); items.push([a, q[0], q[1]]); });
    items.sort((u, v) => u[2] - v[2]);
    let ar = '';
    for (const it of items) {
      const a = it[0], mine = a.owner === ME, sel = selArmy === a.id, col = S.facs[a.owner].color;
      const moving = a.path.length && !a.inCombat, bob = moving && speed && !modal ? Math.sin(now / 110 + a.id) * 0.9 : 0;
      const types = Object.keys(ICONS).filter(t => a.men[t] >= 50);
      let ic = ''; types.forEach((t, i) => { const cx = -(types.length - 1) * 4.6 + i * 9.2; ic += '<circle cx="' + cx + '" cy="-25.5" r="4.4" fill="rgba(18,11,3,.85)" stroke="' + col + '" stroke-width=".8"/><use href="#i-' + t + '" x="' + (cx - 3.3) + '" y="-28.8" width="6.6" height="6.6"/>'; });
      ar += '<g class="army ic" data-army="' + a.id + '" data-prov="' + a.prov + '" transform="translate(' + it[1].toFixed(1) + ',' + (it[2] + bob).toFixed(1) + ')">' +
        (sel ? '<ellipse cx="0" cy="3" rx="' + (24 + Math.sin(now / 200) * 2).toFixed(1) + '" ry="6.5" fill="rgba(255,255,255,.18)" stroke="#fff" stroke-width="1.4"/>' : '') +
        '<line x1="-19" y1="-21" x2="-19" y2="4" stroke="#24180a" stroke-width="1.6"/><circle cx="-19" cy="-21.5" r="1.5" fill="#f3d584" stroke="none"/>' +
        '<path d="M-19-20h37l-4.5 6.5 4.5 6.5h-37z" fill="' + col + '" stroke="' + (mine ? '#fff0b8' : '#170f05') + '" stroke-width="' + (mine ? 1.3 : 0.9) + '"/>' +
        '<path d="M-19-20h37l-1.4 2h-35.6z" fill="rgba(255,255,255,.25)" stroke="none"/>' +
        '<text class="n" x="-2" y="-10.3" stroke-linecap="butt">' + fmt(G.total(a)) + '</text>' + ic +
        '<rect x="-18" y="-5.6" width="35" height="2.4" rx="1" fill="rgba(0,0,0,.6)" stroke="none"/><rect x="-18" y="-5.6" width="' + (35 * Math.max(0, a.morale) / 100).toFixed(1) + '" height="2.4" rx="1" fill="' + (a.morale > 50 ? '#7fe07a' : '#f0a030') + '" stroke="none"/></g>';
    }
    setHTML('ga', ar);
    let fx = '', top = '';
    const sa = S.armies.find(x => x.id === selArmy);
    if (sa && sa.path.length) {
      const q = armyXY(sa, 0), last = S.provs[sa.path[sa.path.length - 1]];
      fx += '<polyline points="' + q[0].toFixed(1) + ',' + (q[1] + 7).toFixed(1) + ' ' + sa.path.map(i => S.provs[i].x + ',' + S.provs[i].y).join(' ') + '" fill="none" stroke="#fff" stroke-width="2" stroke-dasharray="6 5" stroke-dashoffset="' + (-(now / 60) % 11).toFixed(1) + '" stroke-linecap="round"/>' +
        '<circle cx="' + last.x + '" cy="' + last.y + '" r="' + (7 + Math.sin(now / 200) * 1.5).toFixed(1) + '" fill="none" stroke="#fff" stroke-width="1.6"/>';
    }
    for (const p of S.provs) {
      if (p.type !== 'land') continue;
      if (p.siege > 0) {
        const f = Math.min(1, p.siege / G.siegeNeed(p)), c = 2 * Math.PI * 11;
        fx += '<circle cx="' + p.x + '" cy="' + p.y + '" r="11" fill="none" stroke="rgba(0,0,0,.55)" stroke-width="3.4"/><circle cx="' + p.x + '" cy="' + p.y + '" r="11" fill="none" stroke="#ff6a3c" stroke-width="2.4" stroke-dasharray="' + (c * f).toFixed(1) + ' ' + c.toFixed(1) + '" transform="rotate(-90 ' + p.x + ' ' + p.y + ')"/>';
      }
      const here = by[p.id];
      if (here && here.some(a => a.inCombat)) {
        const t = {}; for (const a of here) if (a.inCombat) t[a.owner] = (t[a.owner] || 0) + G.total(a);
        const s = 1 + Math.sin(now / 130) * 0.16;
        top += '<circle cx="' + (p.x + 30) + '" cy="' + (p.y - 16) + '" r="' + (13 * s).toFixed(1) + '" fill="url(#glow)" opacity=".55"/>' +
          '<text x="' + (p.x + 30) + '" y="' + (p.y - 10) + '" font-size="' + (17 * s).toFixed(1) + '" text-anchor="middle" fill="#fff" stroke="#b01515" stroke-width=".7">&#9876;</text>' +
          '<text class="lbl" x="' + (p.x + 30) + '" y="' + (p.y + 1) + '" style="font-weight:bold">' + Object.keys(t).sort((x, y) => (y === ME) - (x === ME)).map(o => fmt(t[o])).join(' v ') + '</text>';
      }
    }
    floaters = floaters.filter(f => now - f.t < 2600);
    for (const f of floaters) { const k = (now - f.t) / 2600; top += '<text class="fl" x="' + f.x + '" y="' + (f.y - 30 - k * 26).toFixed(1) + '" fill="' + f.c + '" opacity="' + (1 - k * k).toFixed(2) + '">' + f.text + '</text>'; }
    setHTML('gf', fx); setHTML('gx', top);
  }

  function drawProvs() {
    const sa = S.armies.find(x => x.id === selArmy), reach = sa ? G.reach(ME, sa.prov) : null, cen = {};
    for (const p of S.provs) {
      if (p.type !== 'land') continue;
      const e = polys[p.id], col = S.facs[p.owner].color;
      if (e.getAttribute('fill') !== col) e.setAttribute('fill', col);
      const cls = 'land' + (G.atWar(ME, p.owner) ? ' foe' : '') + (selProv === p.id ? ' sel' : '');
      if (e.getAttribute('class') !== cls) e.setAttribute('class', cls);
      const op = reach && !reach.has(p.id) ? '0.4' : '1'; if (e.getAttribute('opacity') !== op) e.setAttribute('opacity', op);
      const c = cen[p.owner] = cen[p.owner] || { x: 0, y: 0, n: 0 }; c.x += p.x; c.y += p.y; c.n++;
      if (prevOwner[p.id] !== p.owner) {
        const gain = p.owner === ME, loss = prevOwner[p.id] === ME; prevOwner[p.id] = p.owner;
        floaters.push({ x: p.x, y: p.y, t: performance.now(), text: gain ? p.name + ' taken' : loss ? p.name + ' lost' : S.facs[p.owner].name, c: gain ? '#9df59a' : loss ? '#ff9a88' : '#fff' });
      }
    }
    let n = '';
    for (const id in cen) { const c = cen[id], f = S.facs[id]; if (c.n < 2) continue; n += '<text class="realm" x="' + (c.x / c.n).toFixed(0) + '" y="' + (c.y / c.n - 26).toFixed(0) + '" font-size="' + Math.min(19, 7 + 3 * Math.sqrt(c.n)).toFixed(1) + '">' + f.name + '</text>'; }
    setHTML('gn', n);
  }

  /* ---------- panels ---------- */
  function drawTop() {
    const f = S.facs[ME], e = G.econ(f), net = e.inc - e.up;
    const goals = G.GOALS.map(n => { const ok = G.provByName(n).owner === ME; return '<span class="' + (ok ? 'good' : 'muted') + '">' + (ok ? '&#10003; ' : '') + n + '</span>'; }).join(' &middot; ');
    setHTML('top', '<h1>Ashur Ascendant</h1>' +
      '<span class="stat">Silver <b>' + Math.floor(f.silver) + '</b> <span class="' + (net < 0 ? 'bad' : 'muted') + '">' + (net >= 0 ? '+' : '') + net + '/mo</span>' + (e.trib ? ' <span class="good">incl. ' + e.trib + ' tribute</span>' : '') + '</span>' +
      '<span class="stat">Manpower <b>' + fmt(f.mp) + '</b> <span class="muted">+' + fmt(e.mp) + '/mo</span></span>' +
      '<span class="stat">Army <b>' + fmt(G.menOf(ME)) + '</b></span><span>Goal: ' + goals + '</span><span class="sp"></span>' +
      '<span class="cz"><b>' + G.dateStr() + '</b>' + (G.isWinter() ? ' <span class="muted">Winter</span>' : '') + '</span><span>' +
      ['Pause', '&#9654;', '&#9654;&#9654;', '&#9654;&#9654;&#9654;'].map((t, i) => '<span class="btn' + (speed === i ? ' on' : '') + '" data-act="speed" data-v="' + i + '">' + t + '</span>').join(' ') +
      ' <span class="btn" data-act="mute">' + (muted ? 'Sound off' : 'Sound on') + '</span> <span class="btn" data-act="music">' + (music ? 'Music on' : 'Music off') + '</span></span>');
  }
  function provActions(p) {
    if (p.owner === ME) {
      let h = '<div style="margin-top:6px;line-height:2.1">';
      for (const k in G.BUILD) { const b = G.BUILD[k], lvl = k === 'w' ? p.fort : p.bld[k], ok = lvl < b.max && S.facs[ME].silver >= b.cost; h += '<span class="btn' + (ok ? '' : ' off') + '" data-act="build" data-v="' + k + '" title="' + b.desc + '">' + b.name + ' ' + (lvl >= b.max ? 'max' : b.cost) + '</span> '; }
      return h + '</div><div class="muted">Market +6 silver, Granary +300 manpower, Walls +1.</div>';
    }
    return G.atWar(ME, p.owner) ? '' : '<div style="margin-top:6px"><span class="btn" data-act="war" data-v="' + p.owner + '">Declare war</span></div>';
  }
  function musterProv() { return selProv !== null && S.provs[selProv].owner === ME ? selProv : S.facs[ME].capital; }
  function drawSide() {
    const f = S.facs[ME]; let h = '';
    const a = S.armies.find(x => x.id === selArmy), p = selProv !== null ? S.provs[selProv] : null;
    if (a) {
      const here = S.provs[a.prov];
      const st = a.retreating ? 'Retreating' : a.inCombat ? 'In battle at ' + here.name : a.path.length ? 'Marching to ' + S.provs[a.path[a.path.length - 1]].name : G.atWar(ME, here.owner) ? 'Besieging ' + here.name : 'Camped at ' + here.name;
      h += '<h3>' + a.name + '</h3><div class="card"><div class="row"><span><b>' + fmt(G.total(a)) + '</b> men</span><span class="muted">' + st + '</span></div>' +
        '<div>General ' + a.gen.name + ' <span style="color:#f3d584">' + '&#9733;'.repeat(a.gen.skill) + '</span></div><div class="muted">Veterancy ' + Math.round(a.xp) + ' &middot; Morale ' + Math.round(a.morale) + (a.attr ? ' &middot; <span class="bad">attrition</span>' : '') + '</div><div class="bar"><i style="width:' + Math.max(0, a.morale) + '%;background:' + (a.morale > 50 ? '#7fe07a' : '#f0a030') + '"></i></div>' +
        Object.keys(G.UNITS).filter(t => a.men[t] >= 1).map(t => '<div>' + uiIcon(t) + G.UNITS[t].name + ' <b>' + Math.round(a.men[t]) + '</b></div>').join('') +
        '<div style="margin-top:8px;line-height:2.1">' + (G.atWar(ME, here.owner) && !a.inCombat && !a.path.length ? '<span class="btn" data-act="storm">Storm the walls</span> ' : '') + '<span class="btn" data-act="split">Split</span> <span class="btn" data-act="merge">Merge</span> <span class="btn" data-act="halt">Halt</span> <span class="btn" data-act="desel">Close</span></div></div>';
    } else if (p) {
      const o = S.facs[p.owner];
      h += '<h3>' + p.name + '</h3><div class="card"><div class="row"><span><span class="sw" style="background:' + o.color + '"></span>' + o.name + '</span><span class="muted">' + (o.capital === p.id ? 'Capital' : '') + '</span></div>' +
        '<div class="muted">Silver ' + (p.silver + p.bld.m * 6) + ' &middot; Manpower ' + (p.mp + p.bld.g * 300) + ' &middot; Walls ' + p.fort + (p.mtn ? ' &middot; Mountains' : '') + '</div>' +
        (p.unrest > 0 ? '<div class="bad">Unrest ' + Math.round(p.unrest) + '% <span class="muted">(lowers income; fades with time, faster with an army here)</span></div>' : '') + provActions(p) + '</div>';
    }
    h += '<h3>Muster at ' + S.provs[musterProv()].name + '</h3><div class="muted">Select one of your provinces to muster there instead.</div>';
    for (const t in G.UNITS) {
      const u = G.UNITS[t], c = G.unitCost(ME, t), ok = f.silver >= c && f.mp >= u.men;
      h += '<div class="row"><span style="display:flex;align-items:center">' + uiIcon(t) + '<span>' + u.name + '<br><span class="muted">' + u.men + ' men &middot; ' + c + ' silver &middot; ' + u.days + ' days</span></span></span><span class="btn' + (ok ? '' : ' off') + '" data-act="recruit" data-v="' + t + '">Raise</span></div>';
    }
    if (f.queue.length) h += '<div class="muted" style="margin-top:4px">Training: ' + f.queue.map(q => G.UNITS[q.type].name + ' (' + q.left + 'd)').join(', ') + '</div>';
    h += '<h3>Royal Edicts</h3>';
    for (const e of G.EDICTS) {
      const done = f.done[e.id], cur = f.edict && f.edict.id === e.id, open = e.req.every(r => f.done[r]);
      const right = done ? '<span class="good">&#10003;</span>' : cur ? '<span class="muted">' + f.edict.left + ' days</span>' : open && !f.edict ? '<span class="btn" data-act="edict" data-v="' + e.id + '">Proclaim</span>' : '<span class="muted">' + (open ? 'Waiting' : 'Locked') + '</span>';
      h += '<div class="row"' + (done || open ? '' : ' style="opacity:.55"') + '><span>' + e.name + '<br><span class="muted">' + e.desc + '</span>' + (cur ? '<div class="bar"><i style="width:' + (100 - 100 * f.edict.left / e.days) + '%;background:#d9aa3f"></i></div>' : '') + '</span>' + right + '</div>';
    }
    h += '<h3>Realms</h3>';
    for (const id in S.facs) {
      if (id === ME || id === 'REB') continue; const o = S.facs[id];
      if (!o.alive) { h += '<div class="row muted"><span><span class="sw" style="background:' + o.color + '"></span><s>' + o.name + '</s></span><span>Fallen</span></div>'; continue; }
      const war = G.atWar(ME, id), ally = G.allyOf(id);
      h += '<div class="row"><span><span class="sw" style="background:' + o.color + '"></span>' + o.name + (war ? ' <span class="bad">at war</span>' : o.tributary ? ' <span class="good">tributary</span>' : '') + '<br><span class="muted">' + fmt(G.menOf(id)) + ' men' + (ally && S.facs[ally].alive ? ' &middot; allied to ' + S.facs[ally].name : '') + '</span></span>' +
        '<span style="white-space:nowrap">' + (o.tributary ? '' : '<span class="btn" data-act="tribute" data-v="' + id + '">Tribute</span> ') + (war ? '<span class="btn" data-act="peace" data-v="' + id + '">Peace</span>' : '<span class="btn" data-act="war" data-v="' + id + '">War</span>') + '</span></div>';
    }
    setHTML('side', h);
  }
  function tipFor(t) {
    const pg = t.closest && t.closest('[data-prov]'); if (!pg) return '';
    const p = S.provs[+pg.dataset.prov], o = S.facs[p.owner];
    let h = '<b>' + p.name + '</b>' + (o.capital === p.id ? ' (capital)' : '') + '<br><span class="sw" style="background:' + o.color + '"></span>' + o.name +
      (G.atWar(ME, p.owner) ? ' <span class="bad">at war</span>' : '') + '<br><span class="muted">Walls ' + p.fort + (p.mtn ? ' &middot; Mountains' : '') + ' &middot; Silver ' + p.silver + '</span>';
    if (p.unrest > 0) h += '<br><span class="bad">Unrest ' + Math.round(p.unrest) + '%</span>';
    if (p.siege > 0) h += '<br><span class="bad">Siege ' + Math.round(100 * p.siege / G.siegeNeed(p)) + '%</span>';
    for (const a of S.armies) if (a.prov === p.id) h += '<br>' + (a.owner === ME ? a.name : S.facs[a.owner].name) + ': ' + fmt(G.total(a)) + ' men';
    return h;
  }

  function listen() {
    for (const l of S.log) {
      if (heard.has(l)) continue; heard.add(l); const t = l.text;
      if (/Revolt|stopped paying|broken our oath/.test(t)) sfx('alarm'); else if (t.indexOf('Victory') === 0) sfx('win'); else if (/fallen to our|is no more/.test(t)) sfx('capture'); else if (/declared war/.test(t)) sfx('war');
      else if (/mustered/.test(t)) sfx('muster'); else if (/Edict/.test(t)) sfx('chime'); else if (l.kind === 'bad') sfx('lose');
    }
    const now = new Set(); for (const a of S.armies) if (a.owner === ME && a.inCombat) now.add(a.prov);
    for (const p of now) if (!fights.has(p)) sfx('clash');
    if (now.size && speed && !modal && Math.random() < 0.25) sfx('clash');
    fights = now;
  }
  function drawPanels() {
    if (selArmy !== null && !S.armies.some(a => a.id === selArmy)) selArmy = null;
    drawProvs(); drawTop(); drawSide(); listen();
    setHTML('log', S.log.slice(-5).map(l => '<div class="' + l.kind + '">' + l.text + '</div>').join(''));
    setHTML('hint', Date.now() < hintUntil ? hint : DEFAULT_HINT);
    if (!modal && S.events.length) {
      showModal(S.events.shift());
    }
  }
  function showModal(m) {
    modal = m; $('mt').textContent = m.title; $('mb').innerHTML = m.text;
    $('mbtn').innerHTML = m.choices ? m.choices.map((c, i) => '<span class="btn" data-act="choice" data-v="' + i + '">' + c.label + '</span>').join(' ') : '<span class="btn" data-act="close">' + (m.restart ? 'Play again' : 'Continue') + '</span>';
    $('modal').style.display = 'flex'; sfx('event');
  }
  function reset() { selArmy = selProv = null; fights = new Set(); floaters = []; for (const p of S.provs) prevOwner[p.id] = p.owner; for (const l of S.log) heard.add(l); }
  function saveGame() { try { if (S.over === 'lose') localStorage.removeItem(SAVE); else localStorage.setItem(SAVE, G.save()); } catch (e) { /* storage is optional */ } }
  function draw() { drawPanels(); drawArmies(performance.now()); }

  /* ---------- input ---------- */
  function mapClick(t, right) {
    const ag = t.closest('[data-army]'), pg = t.closest('[data-prov]');
    if (ag && !right) { const a = S.armies.find(x => x.id === +ag.dataset.army); if (a && a.owner === ME) { selArmy = selArmy === a.id ? null : a.id; selProv = null; sfx('select'); return; } }
    if (!pg) return;
    const pid = +pg.dataset.prov, a = S.armies.find(x => x.id === selArmy);
    if (a && pid !== a.prov) {
      if (G.order(a, pid)) { say(a.name + ' marches on ' + S.provs[pid].name + '.'); sfx('march'); }
      else { say('No route. You can only enter kingdoms you are at war with.'); sfx('error'); }
      return;
    }
    if (!right) { selProv = pid; selArmy = null; sfx('click'); }
  }
  function act(name, v) {
    const a = S.armies.find(x => x.id === selArmy); let snd = 'click';
    if (name === 'speed') speed = +v;
    else if (name === 'mute') { muted = !muted; if (master) master.gain.value = muted ? 0 : 0.6; }
    else if (name === 'music') music = !music;
    else if (name === 'tribute') { const r = G.demandTribute(v); if (r) { say(r); snd = 'error'; } else snd = 'chime'; }
    else if (name === 'build') snd = G.build(selProv, v) ? 'build' : 'error';
    else if (name === 'storm' && a) { if (G.storm(a)) snd = 'storm'; else { say('The men need ten days before another assault.'); snd = 'error'; } }
    else if (name === 'choice') { const c = modal.choices[+v]; $('modal').style.display = 'none'; modal = null; if (c.ui === 'load') { S = G.load(localStorage.getItem(SAVE)); reset(); } else if (c.fx) c.fx(); snd = 'coin'; }
    else if (name === 'recruit') { if (G.recruit(ME, v, musterProv())) snd = 'coin'; else { say('Not enough silver or manpower.'); snd = 'error'; } }
    else if (name === 'edict') { G.startEdict(v); snd = 'coin'; }
    else if (name === 'war') G.declareWar(ME, v);
    else if (name === 'peace') { const r = G.proposePeace(v); if (r) { say(r); snd = 'error'; } else snd = 'chime'; }
    else if (name === 'split' && a) { if (!G.split(a)) { say('Too small to split, or busy fighting.'); snd = 'error'; } }
    else if (name === 'merge' && a) { if (!G.merge(a)) { say('No other army of ours is here.'); snd = 'error'; } }
    else if (name === 'halt' && a) G.halt(a);
    else if (name === 'desel') selArmy = null;
    else if (name === 'close') {
      $('modal').style.display = 'none';
      if (modal && modal.restart) { S = G.newGame(); speed = 0; reset(); saveGame(); }
      modal = null;
    }
    sfx(snd);
  }
  document.addEventListener('pointerdown', e => {
    if (e.button !== 0) return; audio();
    const b = e.target.closest('[data-act]');
    if (b) { e.preventDefault(); if (!b.classList.contains('off')) act(b.dataset.act, b.dataset.v); draw(); return; }
    if (e.target.closest('#map')) drag = { x: e.clientX, y: e.clientY, vx: vb.x, vy: vb.y, moved: false, t: e.target };
  });
  const scale = () => { const r = svg.getBoundingClientRect(); return Math.max(vb.w / r.width, vb.h / r.height); };
  window.addEventListener('pointermove', e => {
    const tip = $('tip');
    if (drag) {
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      if (Math.abs(dx) + Math.abs(dy) > 5) drag.moved = true;
      if (drag.moved) { const k = scale(); vb.x = drag.vx - dx * k; vb.y = drag.vy - dy * k; applyVB(); tip.style.display = 'none'; }
      return;
    }
    const h = e.target.closest && e.target.closest('#map') ? tipFor(e.target) : '';
    if (!h) { tip.style.display = 'none'; return; }
    const r = $('mapwrap').getBoundingClientRect();
    tip.innerHTML = h; tip.style.display = 'block';
    tip.style.left = Math.min(e.clientX - r.left + 14, r.width - 205) + 'px'; tip.style.top = Math.min(e.clientY - r.top + 14, r.height - 120) + 'px';
  });
  window.addEventListener('pointerup', () => { if (drag && !drag.moved) { mapClick(drag.t, false); draw(); } drag = null; });
  svg.addEventListener('contextmenu', e => { e.preventDefault(); mapClick(e.target, true); draw(); });
  svg.addEventListener('wheel', e => {
    e.preventDefault();
    const m = svg.getScreenCTM().inverse(), px = m.a * e.clientX + m.c * e.clientY + m.e, py = m.b * e.clientX + m.d * e.clientY + m.f;
    const nw = Math.max(300, Math.min(1200, vb.w * (e.deltaY > 0 ? 1.15 : 1 / 1.15))), f = nw / vb.w;
    vb.x = px - (px - vb.x) * f; vb.y = py - (py - vb.y) * f; vb.w = nw; applyVB();
  }, { passive: false });
  document.addEventListener('keydown', e => {
    audio();
    if (e.code === 'Space') { e.preventDefault(); speed = speed ? 0 : 1; }
    else if (e.key >= '1' && e.key <= '3') speed = +e.key;
    else if (e.key === 'Escape') selArmy = null;
    else if (e.key === 'm') { muted = !muted; if (master) master.gain.value = muted ? 0 : 0.6; }
    draw();
  });

  build();
  try { const sv = localStorage.getItem(SAVE), dd = sv ? JSON.parse(sv).day : 0; if (dd > 30) showModal({ title: 'Resume your reign?', text: 'A saved campaign was found, last played on ' + G.dateStr(dd) + '. The game saves itself every month.', choices: [{ label: 'Continue campaign', ui: 'load' }, { label: 'New campaign', ui: 'new' }] }); } catch (e) { /* no save */ }
  draw();
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.25, (now - last) / 1000); last = now;
    if (!modal && speed) { acc += SPEEDS[speed] * dt; let n = 0; while (acc >= 1) { acc--; G.tick(); n++; if (S.day % 30 === 0) saveGame(); } if (n) panelAt = 0; }
    if (now >= panelAt) { drawPanels(); panelAt = now + 120; }
    drawArmies(now); musicTick();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  window.__ashur = { sfx, audio };
})();
