/* ============ UMBRELLA DAD · level.js ============ */
(function (UD) {
  'use strict';

  class Level {
    build(g) {
      const rng = UD.mulberry32(20260528);
      const R = (a, b) => a + rng() * (b - a);
      const RI = (a, b) => Math.floor(R(a, b + 1));
      this.decorFlat = [];   // towels (drawn on ground)
      this.decorTall = [];   // sandcastles, umbrellas, palms, cars, towers
      this.hazards = [];     // ice / hot zones
      this.coolers = [];
      const W = UD.VW, ML = UD.MARGIN + 16, MR = W - UD.MARGIN - 16;

      // zone helper to scatter towels
      const towels = (y0, y1, n) => {
        for (let i = 0; i < n; i++) this.decorFlat.push({
          kind: 'towel', x: R(ML, MR), y: R(y0, y1), w: R(46, 70), h: R(64, 92),
          rot: R(-.5, .5), c: RI(0, 5),
        });
      };
      const castle = (y0, y1, n) => { for (let i = 0; i < n; i++) this.decorTall.push({ kind: 'sandcastle', x: R(ML + 20, MR - 20), y: R(y0, y1) }); };
      const umbs = (y0, y1, n) => { for (let i = 0; i < n; i++) this.decorTall.push({ kind: 'umbrellaDecor', x: R(ML + 30, MR - 30), y: R(y0, y1), c: RI(0, 4) }); };

      // ENTRANCE — parking lot
      this.decorTall.push({ kind: 'parkedCar', x: ML + 30, y: 5390, col: '#d6443f' });
      this.decorTall.push({ kind: 'parkedCar', x: MR - 30, y: 5400, col: '#3b7dd6' });
      this.decorTall.push({ kind: 'parkedCar', x: W / 2, y: 5430, col: '#f0a93c' });

      // TOWELS + CRABS
      towels(4400, 5020, 9); castle(4400, 5020, 3);
      for (let i = 0; i < 4; i++) g.addEnemy(new UD.Crab(R(ML, MR), R(4400, 5000)));
      this.coolers.push({ x: R(ML, MR), y: 4760, taken: false });

      // ICE-CREAM ALLEY + KIDS
      this.decorTall.push({ kind: 'vendor', x: ML + 20, y: 4180 });
      for (let i = 0; i < 5; i++) this.hazards.push({ type: 'ice', x: R(ML + 30, MR - 30), y: R(3720, 4280), rx: R(34, 56), ry: R(24, 38) });
      towels(3700, 4280, 5);
      for (let i = 0; i < 4; i++) g.addEnemy(new UD.Kid(R(ML, MR), R(3700, 4300), [3680, 4320]));

      // HOT SAND + GULLS
      for (let i = 0; i < 4; i++) this.hazards.push({ type: 'hot', x: R(ML + 20, MR - 20), y: R(3020, 3600), rx: R(50, 80), ry: R(34, 50) });
      this.decorTall.push({ kind: 'palm', x: ML + 6, y: 3300 });
      this.decorTall.push({ kind: 'palm', x: MR + 4, y: 3120 });
      for (let i = 0; i < 3; i++) g.addEnemy(new UD.Gull(R(ML, MR), R(2980, 3300)));
      this.coolers.push({ x: R(ML, MR), y: 3080, taken: false });

      // FOOTBALL DRILL
      this.drill = { y: 2640, x: 0, t: 0, range: (MR - ML) / 2 - 30, members: [] };
      const cy = this.drill.y, mid = (ML + MR) / 2;
      for (let i = 0; i < 4; i++) {
        const fx = ML + 40 + i * ((MR - ML - 80) / 3);
        const f = new UD.Footballer(fx, cy, [7, 22, 33, 88][i]);
        f.baseX = fx; this.drill.members.push(f); g.addEnemy(f);
      }
      this.coach = new UD.Coach(mid, cy - 70); g.addEnemy(this.coach);
      this.decorTall.push({ kind: 'lifeguard', x: MR - 6, y: 2500 });

      // CROWD + BEACH BALLS + KIDS
      towels(1500, 2300, 10); umbs(1500, 2300, 5); castle(1500, 2300, 2);
      for (let i = 0; i < 3; i++) g.addEnemy(new UD.BeachBall(R(ML + 40, MR - 40), R(1550, 2250)));
      for (let i = 0; i < 3; i++) g.addEnemy(new UD.Kid(R(ML, MR), R(1550, 2250), [1500, 2300]));
      for (let i = 0; i < 3; i++) g.addEnemy(new UD.Crab(R(ML, MR), R(1550, 2250)));
      this.coolers.push({ x: R(ML, MR), y: 1900, taken: false });

      // FINAL APPROACH
      this.decorTall.push({ kind: 'palm', x: ML + 4, y: 900 });
      umbs(640, 1300, 4); towels(700, 1300, 4);
      for (let i = 0; i < 2; i++) g.addEnemy(new UD.Gull(R(ML, MR), R(700, 1100)));

      // GOAL — the perfect spot
      this.goal = { x: W / 2, y: 360, r: 30, glow: 0 };

      // precompute sand speckle
      this.speckle = [];
      for (let i = 0; i < 520; i++) this.speckle.push({ x: rng() * W, y: rng() * UD.LEVEL_H, r: R(1, 2.6), s: rng() });

      // foam wave offsets
      this.waveT = 0;
    }

    update(dt, dad, g) {
      this.waveT += dt;
      this.goal.glow += dt;
      // football drill sweep
      if (this.drill) {
        this.drill.t += dt * 0.7;
        this.drill.x = Math.sin(this.drill.t) * this.drill.range;
      }
      // cooler pickups
      for (const c of this.coolers) {
        if (!c.taken && UD.dist2(c.x, c.y, dad.x, dad.y) < 34 * 34) {
          c.taken = true; dad.refillSoda(6);
          UD.fx.popup(c.x, c.y - g.camY - 30, 'SODA +6!', UD.PAL.neonD);
          UD.fx.stars(c.x, c.y, 8, UD.PAL.neonD);
          UD.audio.play('cooler');
        }
      }
      // hazard checks -> flags on dad
      dad.onIce = false; dad.onHot = false;
      for (const h of this.hazards) {
        const dx = (dad.x - h.x) / h.rx, dy = (dad.y - h.y) / h.ry;
        if (dx * dx + dy * dy < 1) { if (h.type === 'ice') dad.onIce = true; else dad.onHot = true; }
      }
      // win check
      if (UD.dist2(dad.x, dad.y, this.goal.x, this.goal.y) < (this.goal.r + 6) ** 2) g.reachGoal();
    }

    drillX() { return this.drill ? this.drill.x : 0; }

    // ---- ground, ocean, hazards, towels (flat) ----
    drawFlat(ctx, camY) {
      const P = UD.PAL, W = UD.VW, H = UD.VH;
      // base sand
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, P.sand); g.addColorStop(1, UD.shade(P.sand, -.06));
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

      // side dunes
      ctx.fillStyle = P.sandDark;
      ctx.fillRect(0, 0, UD.MARGIN, H); ctx.fillRect(W - UD.MARGIN, 0, UD.MARGIN, H);
      ctx.fillStyle = UD.hexa('#000', .12);
      ctx.fillRect(UD.MARGIN - 4, 0, 4, H); ctx.fillRect(W - UD.MARGIN, 0, 4, H);

      // ambient mood wash
      ctx.fillStyle = P.ambient; ctx.fillRect(0, 0, W, H);

      // sand speckle
      ctx.fillStyle = UD.hexa(P.sandDark2 || P.sandDark, .5);
      for (const s of this.speckle) {
        const sy = s.y - camY; if (sy < -4 || sy > H + 4) continue;
        ctx.beginPath(); ctx.arc(s.x, sy, s.r, 0, 7); ctx.fill();
      }

      // OCEAN band near top (goal zone)
      const oceanTop = 0 - camY, oceanBot = 520 - camY;
      if (oceanBot > 0) {
        const og = ctx.createLinearGradient(0, oceanTop, 0, oceanBot);
        og.addColorStop(0, P.seaDeep); og.addColorStop(.7, P.sea); og.addColorStop(1, UD.hexa(P.sea, 0));
        ctx.fillStyle = og; ctx.fillRect(0, oceanTop, W, oceanBot - oceanTop);
        // foam line
        ctx.strokeStyle = P.foam; ctx.lineWidth = 5;
        ctx.beginPath();
        for (let x = 0; x <= W; x += 12) {
          const yy = oceanBot - 6 + Math.sin(x * 0.04 + this.waveT * 2) * 6;
          x === 0 ? ctx.moveTo(x, yy) : ctx.lineTo(x, yy);
        }
        ctx.stroke();
        ctx.globalAlpha = .5;
        ctx.beginPath();
        for (let x = 0; x <= W; x += 12) {
          const yy = oceanBot - 26 + Math.sin(x * 0.05 - this.waveT * 1.5) * 5;
          x === 0 ? ctx.moveTo(x, yy) : ctx.lineTo(x, yy);
        }
        ctx.stroke(); ctx.globalAlpha = 1;
      }

      // hazards
      for (const h of this.hazards) {
        const sy = h.y - camY; if (sy < -60 || sy > H + 60) continue;
        ctx.save(); ctx.translate(h.x, sy);
        if (h.type === 'ice') {
          ctx.fillStyle = UD.hexa('#ffd6ef', .85);
          ctx.beginPath(); ctx.ellipse(0, 0, h.rx, h.ry, 0, 0, 7); ctx.fill();
          ctx.fillStyle = UD.hexa('#c6f0ff', .8);
          ctx.beginPath(); ctx.ellipse(-h.rx * .2, -h.ry * .15, h.rx * .6, h.ry * .55, .4, 0, 7); ctx.fill();
          ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.globalAlpha = .8; ctx.stroke(); ctx.globalAlpha = 1;
          // melting drip sheen
          ctx.fillStyle = UD.hexa('#fff', .5); ctx.beginPath(); ctx.ellipse(h.rx * .3, -h.ry * .3, 6, 3, 0, 0, 7); ctx.fill();
        } else {
          // hot sand — shimmer rings
          const pulse = .5 + Math.sin(this.waveT * 4 + h.x) * .12;
          ctx.fillStyle = UD.hexa(P.hotSand, .5 + pulse * .2);
          ctx.beginPath(); ctx.ellipse(0, 0, h.rx, h.ry, 0, 0, 7); ctx.fill();
          ctx.fillStyle = UD.hexa(P.hotSandHot, .35);
          ctx.beginPath(); ctx.ellipse(0, 0, h.rx * .6, h.ry * .6, 0, 0, 7); ctx.fill();
          ctx.strokeStyle = UD.hexa(P.hotSandHot, .6); ctx.lineWidth = 3; ctx.setLineDash([8, 6]);
          ctx.beginPath(); ctx.ellipse(0, 0, h.rx, h.ry, 0, 0, 7); ctx.stroke(); ctx.setLineDash([]);
          // shimmer marks
          ctx.strokeStyle = UD.hexa('#fff', .4); ctx.lineWidth = 2;
          for (let i = -1; i <= 1; i++) { ctx.beginPath(); const wx = i * 16; ctx.moveTo(wx, -h.ry * .3 + Math.sin(this.waveT * 5 + i) * 3); ctx.lineTo(wx + 4, h.ry * .3); ctx.stroke(); }
        }
        ctx.restore();
      }

      // towels (flat)
      for (const t of this.decorFlat) {
        const sy = t.y - camY; if (sy < -90 || sy > H + 90) continue;
        UD.art.towel(ctx, { x: t.x, y: sy, w: t.w, h: t.h, rot: t.rot, c: t.c });
      }

      // coolers (flat pickups)
      for (const c of this.coolers) {
        if (c.taken) continue;
        const sy = c.y - camY; if (sy < -40 || sy > H + 40) continue;
        ctx.save(); ctx.translate(c.x, sy);
        const fl = 1 + Math.sin(this.waveT * 4) * .06; ctx.scale(fl, fl);
        UD.fx && (ctx.shadowColor = UD.PAL.neonD, ctx.shadowBlur = 14);
        ctx.beginPath(); UD.rr(ctx, -16, -12, 32, 22, 5); ctx.fillStyle = UD.PAL.cooler; ctx.fill();
        ctx.shadowBlur = 0; ctx.lineWidth = 3; ctx.strokeStyle = '#1c1018'; ctx.stroke();
        ctx.beginPath(); UD.rr(ctx, -16, -16, 32, 8, 4); ctx.fillStyle = '#f4f0e6'; ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#fff'; ctx.font = '8px "Press Start 2P"'; ctx.textAlign = 'center'; ctx.fillText('+6', 0, 4);
        ctx.restore();
      }

      // GOAL spot
      const gy = this.goal.y - camY;
      if (gy < H + 60 && gy > -60) {
        ctx.save(); ctx.translate(this.goal.x, gy);
        const pl = .5 + Math.sin(this.goal.glow * 3) * .5;
        ctx.strokeStyle = UD.hexa(P.neonC, .9); ctx.lineWidth = 4; ctx.setLineDash([10, 8]);
        ctx.lineDashOffset = -this.goal.glow * 20;
        ctx.beginPath(); ctx.arc(0, 0, this.goal.r + 6, 0, 7); ctx.stroke(); ctx.setLineDash([]);
        ctx.globalAlpha = .25 + pl * .3; ctx.fillStyle = P.neonC;
        ctx.beginPath(); ctx.arc(0, 0, this.goal.r, 0, 7); ctx.fill(); ctx.globalAlpha = 1;
        // X marks the spot
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 5; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(-12, -12); ctx.lineTo(12, 12); ctx.moveTo(12, -12); ctx.lineTo(-12, 12); ctx.stroke();
        ctx.fillStyle = '#fff'; ctx.font = '8px "Press Start 2P"'; ctx.textAlign = 'center';
        ctx.fillText('THE SPOT', 0, this.goal.r + 22);
        ctx.restore();
      }
    }

    // tall decor sprites for the depth-sorted pass
    tallSprites() {
      return this.decorTall.map(d => ({
        y: d.y, draw: (ctx, camY) => {
          const fn = UD.art[d.kind]; if (fn) fn(ctx, { x: d.x, y: d.y - camY, c: d.c, col: d.col });
        }
      }));
    }
  }

  UD.Level = Level;
})(window.UD);
