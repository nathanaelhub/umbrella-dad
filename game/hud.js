/* ============ UMBRELLA DAD · hud.js ============ */
(function (UD) {
  'use strict';
  const $ = id => document.getElementById(id);
  const hud = {};

  hud.init = function (game) {
    this.g = game;
    this.elScore = $('scoreVal');
    this.elSoda = $('sodaRow');
    this.elStress = $('stressMeter');
    this.elStressF = this.elStress.querySelector('i');
    this.elDistFill = $('distFill');
    this.elDistDad = $('distDad');
    this.buildSoda();
    this.buildThreats();
    this.buildMap();
    this.buildHowTo();
  };

  hud.buildSoda = function () {
    this.elSoda.innerHTML = '';
    this.pips = [];
    for (let i = 0; i < 6; i++) {
      const p = document.createElement('div'); p.className = 'soda-pip';
      this.elSoda.appendChild(p); this.pips.push(p);
    }
  };
  hud.updateSoda = function () {
    const n = this.g.dad.soda;
    this.pips.forEach((p, i) => p.classList.toggle('empty', i >= n));
  };
  hud.updateScore = function () { this.elScore.textContent = this.g.dad.score.toLocaleString(); };
  hud.updateStress = function () {
    const n = this.g.dad.stressN;
    this.elStressF.style.width = (n * 100) + '%';
    this.elStress.classList.toggle('high', n > 0.7);
  };
  hud.updateDist = function () {
    const n = this.g.dad.dist;
    this.elDistFill.style.width = (n * 100) + '%';
    this.elDistDad.style.left = UD.clamp(n * 100, 3, 92) + '%';
  };
  hud.flashStress = function () {
    this.elStress.animate(
      [{ filter: 'brightness(2.4)' }, { filter: 'brightness(1)' }],
      { duration: 320, easing: 'ease-out' });
  };
  hud.refreshAll = function () { this.updateScore(); this.updateSoda(); this.updateStress(); this.updateDist(); };

  /* ---- mini drawing into a card canvas ---- */
  function miniCanvas(drawFn) {
    const c = document.createElement('canvas'); c.width = 192; c.height = 192;
    const ctx = c.getContext('2d'); ctx.scale(2, 2);
    drawFn(ctx);
    return c;
  }

  const THREATS = [
    { name: 'BEACH KIDS', danger: 'CHAOS', col: '#ff2d95',
      desc: 'Sugar-charged and impossible to predict. Collide and Dad gets bounced backward — patience drops fast.',
      draw: ctx => UD.art.kid(ctx, { x: 48, y: 78, walk: 1.2, stun: 0, tint: 0 }) },
    { name: 'SAND CRABS', danger: 'ANNOYING', col: '#ff8e3c',
      desc: 'Low to the ground, scuttling sideways. A surprise pinch chips away calm. One umbrella whack ends them.',
      draw: ctx => UD.art.crab(ctx, { x: 48, y: 60, walk: 0, pinch: true, pinchT: 1 }) },
    { name: 'SEAGULLS', danger: 'THIEF', col: '#00e5ff',
      desc: 'Dive-bomb from the sky and steal a soda right out of the cooler. Swat them before they cash out.',
      draw: ctx => UD.art.gull(ctx, { x: 44, y: 52, walk: 0.6, diving: true, carrying: true, stun: 0 }) },
    { name: 'ICE-CREAM SLICKS', danger: 'SLIPPERY', col: '#ffd23f',
      desc: 'Melted cones leave glossy puddles. Step on one and Dad loses all grip — slides straight into worse.',
      draw: ctx => { ctx.fillStyle = '#ffd6ef'; ctx.beginPath(); ctx.ellipse(48, 56, 30, 18, 0, 0, 7); ctx.fill();
        ctx.fillStyle = '#c6f0ff'; ctx.beginPath(); ctx.ellipse(42, 50, 16, 10, .3, 0, 7); ctx.fill();
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
        ctx.font = '26px serif'; ctx.textAlign = 'center'; ctx.fillText('🍦', 60, 40); } },
    { name: 'HOT SAND', danger: 'PANIC', col: '#ff3b4e',
      desc: 'Sun-baked patches no flip-flop can handle. Dad breaks into uncontrollable panic hops and overheats.',
      draw: ctx => { const P = UD.PAL; ctx.fillStyle = UD.hexa(P.hotSand, .7); ctx.beginPath(); ctx.ellipse(48, 56, 32, 20, 0, 0, 7); ctx.fill();
        ctx.fillStyle = UD.hexa(P.hotSandHot, .5); ctx.beginPath(); ctx.ellipse(48, 56, 18, 11, 0, 0, 7); ctx.fill();
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(48 + i * 14, 42); ctx.quadraticCurveTo(48 + i * 14 + 4, 50, 48 + i * 14, 58); ctx.stroke(); }
        ctx.font = '22px serif'; ctx.textAlign = 'center'; ctx.fillText('🔥', 48, 30); } },
    { name: 'JUNIOR FOOTBALL', danger: 'WALL', col: '#7d5fff',
      desc: 'A coached drill marching in formation across the path. A moving wall of shoulder pads — time your gap.',
      draw: ctx => { UD.art.footballer(ctx, { x: 32, y: 80, walk: 0.5, num: 7 }); UD.art.footballer(ctx, { x: 64, y: 80, walk: 1.8, num: 22 }); } },
  ];

  hud.buildThreats = function () {
    const grid = $('threatGrid'); grid.innerHTML = '';
    for (const t of THREATS) {
      const card = document.createElement('div'); card.className = 'tcard';
      const badge = document.createElement('div'); badge.className = 'danger';
      badge.textContent = t.danger; badge.style.background = t.col; badge.style.color = '#160b2e';
      card.appendChild(badge);
      card.appendChild(miniCanvas(t.draw));
      const h = document.createElement('h4'); h.textContent = t.name; card.appendChild(h);
      const p = document.createElement('p'); p.textContent = t.desc; card.appendChild(p);
      grid.appendChild(card);
    }
  };

  /* ---- GAUNTLET MAP ---- */
  const ZONES = [
    { name: 'Parking Lot', sub: 'start · hot asphalt', col: '#9aa6b2' },
    { name: 'Towel Maze', sub: 'crabs & sandcastles', col: '#ff8e3c' },
    { name: 'Ice-Cream Alley', sub: 'slicks & wild kids', col: '#ffd23f' },
    { name: 'The Hot Sand', sub: 'panic zone + gulls', col: '#ff3b4e' },
    { name: 'Football Drill', sub: 'the moving wall', col: '#7d5fff' },
    { name: 'The Crowd', sub: 'flying beach balls', col: '#36c5f0' },
    { name: 'Final Stretch', sub: 'lifeguard & palms', col: '#2ec4a6' },
    { name: 'THE SPOT', sub: 'plant the umbrella!', col: '#ff2d95' },
  ];

  hud.buildMap = function () {
    const c = $('mapCanvas'), ctx = c.getContext('2d');
    const W = c.width, H = c.height, P = UD.PAL;
    ctx.clearRect(0, 0, W, H);
    // ocean at top
    const OL = '#1c1018';
    const drawMapUmbrella = (ux, uy) => {
      const PA = UD.PAL;
      ctx.save(); ctx.translate(ux, uy);
      // pole into the sand
      ctx.strokeStyle = '#d8d2c4'; ctx.lineWidth = 2.6; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(2, 1); ctx.lineTo(-1, -17); ctx.stroke();
      // canopy dome
      ctx.save(); ctx.translate(-1, -17); ctx.rotate(-.12);
      ctx.beginPath(); ctx.moveTo(-15, 0); ctx.arc(0, 0, 15, Math.PI, 0); ctx.closePath();
      ctx.fillStyle = PA.neonA || '#ff2d95'; ctx.fill();
      ctx.fillStyle = '#fff';
      for (let i = 0; i < 3; i++) { const a0 = Math.PI + (i * 2 / 6) * Math.PI, a1 = Math.PI + ((i * 2 + 1) / 6) * Math.PI; ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, 15, a0, a1); ctx.closePath(); ctx.fill(); }
      ctx.lineWidth = 2.2; ctx.strokeStyle = OL; ctx.beginPath(); ctx.moveTo(-15, 0); ctx.arc(0, 0, 15, Math.PI, 0); ctx.stroke();
      ctx.beginPath(); ctx.arc(0, -1, 2, 0, 7); ctx.fillStyle = '#ffe14d'; ctx.fill();
      ctx.restore(); ctx.restore();
    };

    // ===== base sand =====
    const sg = ctx.createLinearGradient(0, 0, 0, H);
    sg.addColorStop(0, '#f3d488'); sg.addColorStop(1, '#e6bd62');
    ctx.fillStyle = sg; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = UD.hexa('#c7a052', .45);
    for (let i = 0; i < 130; i++) { ctx.beginPath(); ctx.arc((i * 53) % W, (i * 89) % H, 1.2, 0, 7); ctx.fill(); }

    // ===== TOP — ocean + beach (where the umbrella goes) =====
    const og = ctx.createLinearGradient(0, 0, 0, 36);
    og.addColorStop(0, '#0d4f9e'); og.addColorStop(1, '#2b8fd6');
    ctx.fillStyle = og; ctx.fillRect(0, 0, W, 34);
    ctx.strokeStyle = UD.hexa('#bfe9ff', .5); ctx.lineWidth = 2; ctx.lineCap = 'round';
    for (let i = 0; i < 6; i++) { const y = 7 + i * 4.4, ox = (i * 47) % (W - 50); ctx.beginPath(); ctx.moveTo(14 + ox, y); ctx.lineTo(48 + ox, y); ctx.stroke(); }
    // foam waterline
    ctx.fillStyle = '#eafaff';
    for (let x = 0; x < W + 16; x += 15) { ctx.beginPath(); ctx.arc(x, 34, 8, Math.PI, 0); ctx.fill(); }
    ctx.fillStyle = UD.hexa('#bfe9ff', .7);
    for (let x = 7; x < W + 16; x += 15) { ctx.beginPath(); ctx.arc(x, 40, 5, Math.PI, 0); ctx.fill(); }
    // wet glossy sand strip
    ctx.fillStyle = '#e0bd72'; ctx.fillRect(0, 43, W, 16);
    ctx.fillStyle = UD.hexa('#ffffff', .14); ctx.fillRect(0, 43, W, 5);

    // ===== BOTTOM — parking lot (the start) =====
    const plTop = H - 58;
    ctx.fillStyle = '#3a4150'; ctx.fillRect(0, plTop, W, 58);
    ctx.fillStyle = '#d8d2c4'; ctx.fillRect(0, plTop - 3, W, 4);          // curb
    ctx.fillStyle = UD.hexa('#000', .22); ctx.fillRect(0, plTop + 1, W, 3);
    ctx.strokeStyle = UD.hexa('#f2f0e6', .72); ctx.lineWidth = 2.4;        // stall stripes
    for (let x = 26; x < W; x += 44) { ctx.beginPath(); ctx.moveTo(x, plTop + 7); ctx.lineTo(x, plTop + 30); ctx.stroke(); }
    ctx.setLineDash([6, 7]); ctx.strokeStyle = UD.hexa('#ffd23f', .85); ctx.lineWidth = 2.4;  // lane
    ctx.beginPath(); ctx.moveTo(0, plTop + 40); ctx.lineTo(W, plTop + 40); ctx.stroke(); ctx.setLineDash([]);
    const car = (cx, cy, col) => {
      ctx.save(); ctx.translate(cx, cy);
      UD.rr(ctx, -15, -9, 30, 18, 5); ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = OL; ctx.stroke();
      UD.rr(ctx, -10, -6, 20, 11, 3); ctx.fillStyle = UD.shade(col, .18); ctx.fill();
      ctx.fillStyle = '#bfe9ff'; UD.rr(ctx, -8, -4, 16, 7, 2); ctx.fill();
      ctx.restore();
    };
    car(38, plTop + 19, '#d6443f');
    car(W - 44, plTop + 17, '#3b7dd6');
    const n = ZONES.length, band = (H - 70) / (n - 1);
    // route path (zigzag)
    ctx.strokeStyle = UD.hexa('#fff', .55); ctx.lineWidth = 5; ctx.setLineDash([3, 7]); ctx.lineCap = 'round';
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const y = H - 30 - i * band, x = W / 2 + Math.sin(i * 1.3) * 60;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke(); ctx.setLineDash([]);
    // nodes
    for (let i = 0; i < n; i++) {
      const z = ZONES[i], y = H - 30 - i * band, x = W / 2 + Math.sin(i * 1.3) * 60;
      ctx.beginPath(); ctx.arc(x, y, 13, 0, 7); ctx.fillStyle = z.col; ctx.fill();
      ctx.lineWidth = 3; ctx.strokeStyle = '#1c1018'; ctx.stroke();
      ctx.fillStyle = '#160b2e'; ctx.font = 'bold 11px "Press Start 2P"'; ctx.textAlign = 'center';
      ctx.fillText(i === n - 1 ? '★' : String(i + 1), x, y + 4);
    }
    // ===== scenery markers + labels =====
    ctx.textAlign = 'center';
    const sx = W / 2 + Math.sin(0) * 60;
    ctx.fillStyle = '#fff'; ctx.font = '7px "Press Start 2P"';
    ctx.fillText('START', sx, H - 6);
    // parking-lot tag (in the sand, just above the lot)
    ctx.textAlign = 'left'; ctx.fillStyle = '#3a4150'; ctx.font = '7px "Press Start 2P"';
    ctx.fillText('P · PARKING LOT', 10, H - 68);
    // planted beach umbrella at THE SPOT (top node)
    const ex = W / 2 + Math.sin((n - 1) * 1.3) * 60, ey = H - 30 - (n - 1) * band;
    drawMapUmbrella(ex, ey);
    // beach tag (top-right)
    ctx.textAlign = 'right'; ctx.fillStyle = '#fff'; ctx.font = '7px "Press Start 2P"';
    ctx.fillText('THE BEACH', W - 8, 13);
    ctx.textAlign = 'center'; ctx.fillStyle = UD.PAL.neonC; ctx.font = '6px "Press Start 2P"';
    ctx.fillText('PLANT IT!', ex, ey + 22);

    // legend
    const leg = $('mapLegend'); leg.innerHTML = '<h4>7 ZONES · 1 SPOT</h4>';
    ZONES.forEach((z, i) => {
      const row = document.createElement('div'); row.className = 'leg';
      const tag = i + 1 === ZONES.length ? '★' : (i + 1);
      row.innerHTML =
        `<span class="dot" style="background:${z.col}"></span>
         <span class="leg-txt"><b>${tag} · ${z.name}</b><i>${z.sub}</i></span>`;
      leg.appendChild(row);
    });
  };

  hud.buildHowTo = function () {
    $('howBody').innerHTML = `
      <div class="line"><b>WASD / ARROWS</b> — jog toward the ocean (watch your stamina, he's tired)</div>
      <div class="line"><b>J / SPACE</b> — umbrella swing: wide arc, knocks kids & crabs flying</div>
      <div class="line"><b>E</b> (hold) — aim a soda with the mouse, release to hurl it: long-range stun, but you only carry 6 (grab coolers!)</div>
      <div class="line" style="margin-top:6px;opacity:.85;">Dodge the chaos, keep the <b style="color:var(--neon-c)">STRESS</b> meter down,
      and reach <b style="color:var(--neon-c)">THE SPOT</b> to plant your umbrella.</div>`;
  };

  hud.showWin = function () {
    const d = this.g.dad;
    const bonus = Math.max(0, 1200 - Math.floor(this.g.time * 10));
    const total = d.score + bonus;
    $('winStats').innerHTML =
      `<div class="row"><span>RUN SCORE</span><span>${d.score.toLocaleString()}</span></div>
       <div class="row"><span>TIME BONUS</span><span>+${bonus}</span></div>
       <div class="row"><span>SODAS LEFT</span><span>${d.soda}</span></div>
       <div class="row" style="font-size:13px;margin-top:6px;"><span>TOTAL</span><span>${total.toLocaleString()}</span></div>`;
  };
  hud.showLose = function () {
    const d = this.g.dad;
    const msgs = [
      'He went home and ordered a kiddie pool online.',
      'The car was closer than the ocean. He chose the car.',
      'Defeated by a six-year-old and a melting cone.',
      'There is always next weekend. Probably.',
    ];
    $('loseMsg').textContent = UD.pick(msgs);
    $('loseStats').innerHTML =
      `<div class="row"><span>SCORE</span><span>${d.score.toLocaleString()}</span></div>
       <div class="row"><span>GOT</span><span>${Math.round(d.dist * 100)}% THERE</span></div>`;
  };

  UD.hud = hud;
})(window.UD);
