/* Ashur Ascendant: interface. */
(function () {
  'use strict';
  const G = window.Game, ME = G.PLAYER, $ = id => document.getElementById(id);
  const svg = $('map'), SPEEDS = [0, 1, 3, 8], DEFAULT_HINT = 'Click one of your armies, then click a province to march. Space pauses.';
  let S = G.newGame(), speed = 0, acc = 0, selArmy = null, selProv = null, modal = null, hint = '', hintUntil = 0;
  const polys = {}, cache = {};
  const fmt = n => n >= 1000 ? (n / 1000).toFixed(n >= 10000 ? 0 : 1) + 'k' : String(Math.round(n));
  const xy = (lon, lat) => ((lon - 30) * 50) + ',' + ((41 - lat) * 50);
  function setHTML(id, html) { if (cache[id] !== html) { cache[id] = html; $(id).innerHTML = html; } }
  function say(t) { hint = t; hintUntil = Date.now() + 3500; }

  function build() {
    let h = '<defs>' +
      '<pattern id="pw" width="10" height="10" patternUnits="userSpaceOnUse"><rect width="10" height="10" fill="#d9c79a"/><circle cx="2" cy="3" r=".8" fill="#b9a372"/><circle cx="7" cy="8" r=".8" fill="#b9a372"/></pattern>' +
      '<pattern id="pm" width="14" height="10" patternUnits="userSpaceOnUse"><path d="M2 8l3-5 3 5" fill="none" stroke="rgba(40,25,10,.3)"/></pattern></defs>';
    let lab = '', mt = '';
    for (const p of S.provs) {
      if (!p.poly.length || p.type === 'sea') continue;
      const pts = p.poly.map(v => v[0].toFixed(1) + ',' + v[1].toFixed(1)).join(' ');
      if (p.type === 'waste') { h += '<polygon points="' + pts + '" fill="url(#pw)" stroke="#c4b083"/>'; continue; }
      h += '<polygon id="p' + p.id + '" class="land" data-prov="' + p.id + '" points="' + pts + '"/>';
      if (p.mtn) mt += '<polygon points="' + pts + '" fill="url(#pm)" pointer-events="none"/>';
      const cap = Object.values(S.facs).some(f => f.capital === p.id);
      lab += '<circle cx="' + p.x + '" cy="' + p.y + '" r="' + (cap ? 3.4 : 2) + '" fill="' + (cap ? '#fff3c4' : '#2a1d0c') + '" stroke="#2a1d0c" pointer-events="none"/>' +
        '<text class="lbl" x="' + p.x + '" y="' + (p.y + 12) + '">' + p.name + '</text>';
    }
    const river = pts => '<polyline points="' + pts.map(q => xy(q[0], q[1])).join(' ') + '" fill="none" stroke="#4f86b8" stroke-width="2.2" stroke-linejoin="round" opacity=".85" pointer-events="none"/>';
    const rivers = river([[40.5, 38.3], [42, 37.3], [43.1, 36.4], [43.3, 35.4], [44.2, 33.8], [45.5, 32.5], [47.3, 31], [48, 30.4]]) +
      river([[39, 38.8], [38.3, 37.5], [38, 36.8], [38.8, 35.9], [40.4, 35], [41.9, 34.2], [43.5, 33.4], [44.5, 32.3], [46, 31.2], [47.4, 31]]) +
      river([[31.2, 27], [31.2, 29.9], [31.3, 31.4]]);
    svg.innerHTML = h + mt + rivers + lab + '<g id="gf" pointer-events="none"></g><g id="ga"></g>';
    for (const p of S.provs) if (p.type === 'land') polys[p.id] = $('p' + p.id);
  }

  function drawMap() {
    for (const p of S.provs) {
      if (p.type !== 'land') continue;
      const e = polys[p.id], col = S.facs[p.owner].color;
      if (e.getAttribute('fill') !== col) e.setAttribute('fill', col);
      e.setAttribute('class', 'land' + (selProv === p.id ? ' sel' : ''));
    }
    const by = {}; for (const a of S.armies) (by[a.prov] = by[a.prov] || []).push(a);
    let fx = '', ar = '';
    for (const pid in by) {
      const p = S.provs[pid];
      if (by[pid].some(a => a.inCombat)) fx += '<text x="' + (p.x + 26) + '" y="' + (p.y - 12) + '" font-size="15" fill="#fff" stroke="#a11" stroke-width=".6">&#9876;</text>';
      by[pid].forEach((a, i) => {
        const mine = a.owner === ME, sel = selArmy === a.id;
        ar += '<g class="army" data-army="' + a.id + '" data-prov="' + pid + '" transform="translate(' + (p.x - 17) + ',' + (p.y - 21 - i * 17) + ')">' +
          '<rect width="34" height="13" rx="2" fill="' + S.facs[a.owner].color + '" stroke="' + (sel ? '#fff' : mine ? '#ffe9a6' : '#1a1208') + '" stroke-width="' + (sel ? 2.4 : mine ? 1.4 : 1) + '"/>' +
          '<text x="17" y="9.6">' + fmt(G.total(a)) + '</text>' +
          '<rect y="13.6" width="' + (34 * Math.max(0, a.morale) / 100).toFixed(1) + '" height="2" fill="' + (a.morale > 50 ? '#7fe07a' : '#f0a030') + '"/></g>';
      });
    }
    for (const p of S.provs) if (p.type === 'land' && p.siege > 0) {
      fx += '<rect x="' + (p.x - 16) + '" y="' + (p.y + 15) + '" width="32" height="4" fill="#1a1208"/><rect x="' + (p.x - 16) + '" y="' + (p.y + 15) + '" width="' + (32 * Math.min(1, p.siege / G.siegeNeed(p))).toFixed(1) + '" height="4" fill="#f25c3c"/>';
    }
    const a = S.armies.find(x => x.id === selArmy);
    if (a && a.path.length) fx += '<polyline points="' + [a.prov].concat(a.path).map(q => S.provs[q].x + ',' + S.provs[q].y).join(' ') + '" fill="none" stroke="#fff" stroke-width="2" stroke-dasharray="5 4"/>';
    setHTML('gf', fx); setHTML('ga', ar);
  }

  function drawTop() {
    const f = S.facs[ME], e = G.econ(f), net = e.inc - e.up;
    const goals = G.GOALS.map(n => '<span class="' + (G.provByName(n).owner === ME ? 'good' : 'muted') + '">' + (G.provByName(n).owner === ME ? '&#10003; ' : '') + n + '</span>').join(' &middot; ');
    setHTML('top', '<h1>Ashur Ascendant</h1>' +
      '<span>Silver <b>' + Math.floor(f.silver) + '</b> <span class="' + (net < 0 ? 'bad' : 'muted') + '">' + (net >= 0 ? '+' : '') + net + '/mo</span></span>' +
      '<span>Manpower <b>' + fmt(f.mp) + '</b> <span class="muted">+' + fmt(e.mp) + '/mo</span></span>' +
      '<span>Army <b>' + fmt(G.menOf(ME)) + '</b></span><span>Goal: ' + goals + '</span><span class="sp"></span>' +
      '<span><b>' + G.dateStr() + '</b></span><span>' +
      ['Pause', '&#9654;', '&#9654;&#9654;', '&#9654;&#9654;&#9654;'].map((t, i) => '<span class="btn' + (speed === i ? ' on' : '') + '" data-act="speed" data-v="' + i + '">' + t + '</span>').join(' ') + '</span>');
  }

  function drawSide() {
    const f = S.facs[ME]; let h = '';
    const a = S.armies.find(x => x.id === selArmy), p = selProv !== null ? S.provs[selProv] : null;
    if (a) {
      const here = S.provs[a.prov];
      const st = a.retreating ? 'Retreating' : a.inCombat ? 'In battle' : a.path.length ? 'Marching to ' + S.provs[a.path[a.path.length - 1]].name : G.atWar(ME, here.owner) ? 'Besieging ' + here.name : 'Camped at ' + here.name;
      h += '<h3>' + a.name + '</h3><div class="row"><span>' + fmt(G.total(a)) + ' men</span><span>Morale ' + Math.round(a.morale) + '</span></div><div class="muted">' + st + '</div><div class="muted">' +
        Object.keys(G.UNITS).filter(t => a.men[t] >= 1).map(t => G.UNITS[t].name + ' ' + Math.round(a.men[t])).join(', ') + '</div><div class="row">' +
        '<span class="btn" data-act="split">Split</span><span class="btn" data-act="merge">Merge</span><span class="btn" data-act="halt">Halt</span><span class="btn" data-act="desel">Deselect</span></div>';
    } else if (p) {
      const o = S.facs[p.owner];
      h += '<h3>' + p.name + '</h3><div class="row"><span><span class="sw" style="background:' + o.color + '"></span>' + o.name + '</span><span class="muted">' + (o.capital === p.id ? 'Capital' : '') + '</span></div>' +
        '<div class="muted">Silver ' + p.silver + ' &middot; Manpower ' + p.mp + ' &middot; Walls ' + p.fort + (p.mtn ? ' &middot; Mountains' : '') + '</div>';
    }
    h += '<h3>Muster at Kalhu</h3>';
    for (const t in G.UNITS) {
      const u = G.UNITS[t], c = G.unitCost(ME, t), ok = f.silver >= c && f.mp >= u.men;
      h += '<div class="row"><span>' + u.name + '<br><span class="muted">' + u.men + ' men &middot; ' + c + ' silver &middot; ' + u.days + ' days</span></span><span class="btn' + (ok ? '' : ' off') + '" data-act="recruit" data-v="' + t + '">Raise</span></div>';
    }
    if (f.queue.length) h += '<div class="muted">Training: ' + f.queue.map(q => G.UNITS[q.type].name + ' (' + q.left + 'd)').join(', ') + '</div>';
    h += '<h3>Royal Edicts</h3>';
    for (const e of G.EDICTS) {
      const done = f.done[e.id], cur = f.edict && f.edict.id === e.id, open = e.req.every(r => f.done[r]);
      const right = done ? '<span class="good">&#10003;</span>' : cur ? '<span class="muted">' + f.edict.left + ' days</span>' : open && !f.edict ? '<span class="btn" data-act="edict" data-v="' + e.id + '">Proclaim</span>' : '<span class="muted">' + (open ? 'Waiting' : 'Locked') + '</span>';
      h += '<div class="row"><span>' + e.name + '<br><span class="muted">' + e.desc + '</span></span>' + right + '</div>';
    }
    h += '<h3>Realms</h3>';
    for (const id in S.facs) {
      if (id === ME) continue; const o = S.facs[id];
      if (!o.alive) { h += '<div class="row muted"><span><span class="sw" style="background:' + o.color + '"></span><s>' + o.name + '</s></span><span>Fallen</span></div>'; continue; }
      const war = G.atWar(ME, id), ally = G.allyOf(id);
      h += '<div class="row"><span><span class="sw" style="background:' + o.color + '"></span>' + o.name + '<br><span class="muted">' + fmt(G.menOf(id)) + ' men' + (ally && S.facs[ally].alive ? ' &middot; allied to ' + S.facs[ally].name : '') + '</span></span>' +
        (war ? '<span class="btn" data-act="peace" data-v="' + id + '">Peace</span>' : '<span class="btn" data-act="war" data-v="' + id + '">War</span>') + '</div>';
    }
    setHTML('side', h);
  }

  function draw() {
    if (selArmy !== null && !S.armies.some(a => a.id === selArmy)) selArmy = null;
    drawMap(); drawTop(); drawSide();
    setHTML('log', S.log.slice(-5).map(l => '<div class="' + l.kind + '">' + l.text + '</div>').join(''));
    setHTML('hint', Date.now() < hintUntil ? hint : DEFAULT_HINT);
    if (!modal && S.events.length) {
      modal = S.events.shift(); $('mt').textContent = modal.title; $('mb').innerHTML = modal.text;
      $('modal').querySelector('.btn').textContent = modal.restart ? 'Play again' : 'Continue'; $('modal').style.display = 'flex';
    }
  }

  function mapClick(t) {
    const ag = t.closest('[data-army]'), pg = t.closest('[data-prov]');
    if (ag) { const a = S.armies.find(x => x.id === +ag.dataset.army); if (a && a.owner === ME) { selArmy = selArmy === a.id ? null : a.id; selProv = null; return; } }
    if (!pg) return;
    const pid = +pg.dataset.prov, a = S.armies.find(x => x.id === selArmy);
    if (a && pid !== a.prov) {
      if (G.order(a, pid)) say(a.name + ' marches on ' + S.provs[pid].name + '.');
      else say('No route. You can only enter kingdoms you are at war with.');
      return;
    }
    selProv = pid; selArmy = null;
  }

  function act(name, v) {
    const a = S.armies.find(x => x.id === selArmy);
    if (name === 'speed') speed = +v;
    else if (name === 'recruit') { if (!G.recruit(ME, v)) say('Not enough silver or manpower.'); }
    else if (name === 'edict') G.startEdict(v);
    else if (name === 'war') G.declareWar(ME, v);
    else if (name === 'peace') { const r = G.proposePeace(v); if (r) say(r); }
    else if (name === 'split' && a) { if (!G.split(a)) say('Too small to split, or busy fighting.'); }
    else if (name === 'merge' && a) { if (!G.merge(a)) say('No other army of ours is here.'); }
    else if (name === 'halt' && a) G.halt(a);
    else if (name === 'desel') selArmy = null;
    else if (name === 'close') {
      $('modal').style.display = 'none';
      if (modal && modal.restart) { S = G.newGame(); selArmy = selProv = null; speed = 0; }
      modal = null;
    }
  }

  document.addEventListener('pointerdown', e => {
    if (e.button !== 0) return;
    const b = e.target.closest('[data-act]');
    if (b) { e.preventDefault(); if (!b.classList.contains('off')) act(b.dataset.act, b.dataset.v); draw(); return; }
    if (e.target.closest('#map')) { mapClick(e.target); draw(); }
  });
  document.addEventListener('keydown', e => {
    if (e.code === 'Space') { e.preventDefault(); speed = speed ? 0 : 1; }
    else if (e.key >= '1' && e.key <= '3') speed = +e.key;
    else if (e.key === 'Escape') selArmy = null;
    draw();
  });

  build(); draw();
  setInterval(() => {
    if (!modal && speed) { acc += SPEEDS[speed] * 0.1; while (acc >= 1) { acc--; G.tick(); } }
    draw();
  }, 100);
})();
