/* ============ UMBRELLA DAD · art2.js — enemies + decor ============ */
(function (UD) {
  'use strict';
  const OL = '#1c1018';
  const art = UD.art;
  const fill = (ctx, c) => { ctx.fillStyle = c; ctx.fill(); };
  const stroke = (ctx, lw, c) => { ctx.lineWidth = lw; ctx.strokeStyle = c || OL; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.stroke(); };
  const fs = (ctx, c, lw) => { fill(ctx, c); stroke(ctx, lw); };
  const circle = (ctx, x, y, r) => { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.closePath(); };
  const ellipse = (ctx, x, y, rx, ry) => { ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.closePath(); };
  function shadow(ctx, x, y, rx, ry) { ctx.save(); ctx.globalAlpha = .2; ctx.fillStyle = '#10204a'; ellipse(ctx, x, y, rx, ry); ctx.fill(); ctx.restore(); }

  /* ---- KID (chaotic runner) ---- */
  art.kid = function (ctx, e) {
    const P = UD.PAL; const col = [P.kidA, P.kidB, P.kidC][e.tint % 3];
    const bob = Math.sin(e.walk) * 2;
    ctx.save(); ctx.translate(e.x, e.y);
    shadow(ctx, 0, 2, 11, 4);
    if (e.stun > 0) ctx.rotate(Math.sin(e.stun * 30) * .25);
    ctx.translate(0, bob);
    // legs
    const sw = Math.sin(e.walk) * 4;
    ctx.beginPath(); UD.rr(ctx, -6, -8, 5, 9 + sw, 2.5); fs(ctx, P.skin, 2.4);
    ctx.beginPath(); UD.rr(ctx, 1, -8, 5, 9 - sw, 2.5); fs(ctx, P.skin, 2.4);
    // body (swimsuit)
    ctx.beginPath(); UD.rr(ctx, -8, -24, 16, 18, 6); fs(ctx, col, 2.8);
    // floatie ring
    ctx.save(); ctx.globalAlpha = .95; ellipse(ctx, 0, -16, 12, 7); stroke(ctx, 5, '#ffd23f'); ctx.restore();
    // head
    circle(ctx, 0, -30, 8); fs(ctx, P.skin, 2.8);
    ctx.fillStyle = OL; circle(ctx, -3, -31, 1.6); ctx.fill(); circle(ctx, 3, -31, 1.6); ctx.fill();
    // wild open mouth (screaming joy)
    circle(ctx, 0, -27, 2.4); fs(ctx, '#7a2030', 1.5);
    // hair tuft
    ctx.beginPath(); ctx.moveTo(0, -38); ctx.lineTo(2, -42); ctx.lineTo(-1, -39); fs(ctx, P.hair, 2);
    // arms flailing
    const fa = Math.sin(e.walk * 1.5) * .5;
    ctx.save(); ctx.translate(-8, -22); ctx.rotate(-1 + fa); ctx.beginPath(); UD.rr(ctx, -2, 0, 5, 11, 2.5); fs(ctx, P.skin, 2.2); ctx.restore();
    ctx.save(); ctx.translate(8, -22); ctx.rotate(1 - fa); ctx.beginPath(); UD.rr(ctx, -3, 0, 5, 11, 2.5); fs(ctx, P.skin, 2.2); ctx.restore();
    ctx.restore();
  };

  /* ---- CRAB ---- */
  art.crab = function (ctx, e) {
    const P = UD.PAL;
    ctx.save(); ctx.translate(e.x, e.y);
    shadow(ctx, 0, 4, 12, 4);
    const scut = Math.sin(e.walk * 2) * 1.5;
    ctx.translate(scut, 0);
    // legs
    for (const s of [-1, 1]) for (let i = 0; i < 3; i++) {
      ctx.beginPath(); ctx.moveTo(s * 8, -2 + i * 2);
      ctx.lineTo(s * (15 + i), 2 + i * 3 + Math.sin(e.walk * 2 + i) * 2);
      stroke(ctx, 2.6, P.crabDark);
    }
    // claws
    const pinch = e.pinch ? Math.abs(Math.sin(e.pinchT * 20)) * .5 : 0;
    for (const s of [-1, 1]) {
      ctx.save(); ctx.translate(s * 12, -6);
      circle(ctx, 0, 0, 5); fs(ctx, P.crab, 2.4);
      ctx.beginPath(); ctx.moveTo(s * 2, -3); ctx.lineTo(s * 8, -6 - pinch * 4); stroke(ctx, 3, P.crab);
      ctx.beginPath(); ctx.moveTo(s * 2, 1); ctx.lineTo(s * 8, 2 + pinch * 4); stroke(ctx, 3, P.crab);
      ctx.restore();
    }
    // shell
    ellipse(ctx, 0, -3, 11, 8); fs(ctx, P.crab, 3);
    ctx.save(); ctx.globalAlpha = .3; ctx.fillStyle = '#fff'; ellipse(ctx, -3, -5, 4, 2.5); ctx.fill(); ctx.restore();
    // eyes on stalks
    for (const s of [-1, 1]) {
      ctx.beginPath(); ctx.moveTo(s * 3, -8); ctx.lineTo(s * 4, -15); stroke(ctx, 2.4, P.crab);
      circle(ctx, s * 4, -16, 3); fs(ctx, '#fff', 2);
      ctx.fillStyle = OL; circle(ctx, s * 4, -16, 1.4); ctx.fill();
    }
    ctx.restore();
  };

  /* ---- SEAGULL (dive-bomber / soda thief) ---- */
  art.gull = function (ctx, e) {
    const P = UD.PAL;
    ctx.save(); ctx.translate(e.x, e.y);
    if (!e.diving) shadow(ctx, 0, 26, 12, 4);
    const flap = Math.sin(e.walk * 1.6);
    // body
    ellipse(ctx, 0, 0, 11, 8); fs(ctx, P.gull, 3);
    // wings
    for (const s of [-1, 1]) {
      ctx.save(); ctx.translate(s * 6, -2); ctx.rotate(s * (-.3 - flap * .5));
      ctx.beginPath(); ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(s * 18, -4, s * 24, -10 + flap * 6);
      ctx.quadraticCurveTo(s * 14, 2, 0, 4); ctx.closePath();
      fs(ctx, P.gullWing, 2.6); ctx.restore();
    }
    // head + angry brow
    circle(ctx, 8, -4, 6); fs(ctx, P.gull, 2.6);
    ctx.beginPath(); ctx.moveTo(14, -6); ctx.lineTo(20, -4); ctx.lineTo(14, -2); fs(ctx, P.beak, 2.2);
    ctx.fillStyle = OL; circle(ctx, 9, -5, 1.6); ctx.fill();
    ctx.beginPath(); ctx.moveTo(5, -8); ctx.lineTo(11, -6); stroke(ctx, 2, OL);
    // carrying stolen soda?
    if (e.carrying) { ctx.beginPath(); UD.rr(ctx, -3, 7, 7, 10, 2); fs(ctx, '#fff', 2.2); }
    ctx.restore();
  };

  /* ---- JUNIOR FOOTBALLER (moving wall) ---- */
  art.footballer = function (ctx, e) {
    const P = UD.PAL;
    ctx.save(); ctx.translate(e.x, e.y);
    shadow(ctx, 0, 2, 13, 5);
    const bob = Math.sin(e.walk) * 1.5; ctx.translate(0, bob);
    // legs
    ctx.beginPath(); UD.rr(ctx, -8, -10, 6, 12, 2.5); fs(ctx, P.skin, 2.6);
    ctx.beginPath(); UD.rr(ctx, 2, -10, 6, 12, 2.5); fs(ctx, P.skin, 2.6);
    // jersey body (shoulder pads = wide)
    ctx.beginPath(); ctx.moveTo(-15, -34); ctx.lineTo(15, -34);
    ctx.lineTo(11, -10); ctx.lineTo(-11, -10); ctx.closePath(); fs(ctx, P.foot, 3.2);
    // number
    ctx.fillStyle = P.footB; ctx.font = 'bold 13px "Press Start 2P", monospace'; ctx.textAlign = 'center';
    ctx.fillText(String((e.num || 7)), 0, -18);
    // helmet
    circle(ctx, 0, -40, 9); fs(ctx, P.foot, 3);
    ctx.beginPath(); ctx.arc(0, -40, 9, -.2, Math.PI * .9); stroke(ctx, 0, OL);
    // facemask
    ctx.beginPath(); ctx.moveTo(-6, -40); ctx.quadraticCurveTo(-9, -36, -4, -34); stroke(ctx, 2.2, '#dfe6ee');
    ctx.restore();
  };

  /* ---- COACH (whistle, blocks lane) ---- */
  art.coach = function (ctx, e) {
    const P = UD.PAL;
    ctx.save(); ctx.translate(e.x, e.y);
    shadow(ctx, 0, 2, 13, 5);
    ctx.beginPath(); UD.rr(ctx, -9, -12, 7, 14, 3); fs(ctx, '#2a2a2a', 2.6);
    ctx.beginPath(); UD.rr(ctx, 2, -12, 7, 14, 3); fs(ctx, '#2a2a2a', 2.6);
    ctx.beginPath(); UD.rr(ctx, -13, -36, 26, 26, 6); fs(ctx, '#e23b4e', 3.2);
    circle(ctx, 0, -44, 9); fs(ctx, P.skin, 3);
    ctx.beginPath(); ctx.arc(0, -47, 10, Math.PI, 0); fs(ctx, '#fff', 2.4); // cap
    ctx.beginPath(); ctx.moveTo(-10, -47); ctx.lineTo(-16, -45); stroke(ctx, 3, '#fff'); // brim
    ctx.fillStyle = OL; circle(ctx, -3, -44, 1.6); ctx.fill(); circle(ctx, 3, -44, 1.6); ctx.fill();
    if (e.whistle) { circle(ctx, 6, -36, 4); fs(ctx, '#ffd23f', 2); }
    ctx.restore();
  };

  /* ---- BEACH BALL (bouncing hazard) ---- */
  art.beachball = function (ctx, e) {
    ctx.save(); ctx.translate(e.x, e.y);
    shadow(ctx, 0, e.r + 6, e.r * .8, e.r * .3);
    ctx.translate(0, -(e.bounce || 0));
    ctx.rotate(e.spin || 0);
    circle(ctx, 0, 0, e.r); fs(ctx, '#fff', 3);
    const cols = ['#ff4d6d', '#ffd23f', '#36c5f0', '#7d5fff'];
    for (let i = 0; i < 4; i++) {
      ctx.beginPath(); ctx.moveTo(0, 0);
      ctx.arc(0, 0, e.r, (i / 4) * Math.PI * 2, ((i + 1) / 4) * Math.PI * 2); ctx.closePath();
      ctx.fillStyle = cols[i]; ctx.fill();
      if (i % 2) { ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.fill(); }
    }
    circle(ctx, 0, 0, e.r); stroke(ctx, 3);
    ctx.save(); ctx.globalAlpha = .4; ctx.fillStyle = '#fff'; circle(ctx, -e.r * .35, -e.r * .35, e.r * .25); ctx.fill(); ctx.restore();
    ctx.restore();
  };

  /* ---- SODA CAN projectile ---- */
  art.soda = function (ctx, p) {
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.spin);
    ctx.beginPath(); UD.rr(ctx, -5, -8, 10, 16, 3); fs(ctx, '#e23b4e', 2.4);
    ctx.fillStyle = '#fff'; ctx.beginPath(); UD.rr(ctx, -5, -2, 10, 5, 1); ctx.fill();
    ctx.beginPath(); UD.rr(ctx, -5, -8, 10, 3, 2); fs(ctx, '#d8d2c4', 2);
    ctx.restore();
  };

  /* ============ DECOR ============ */
  art.towel = function (ctx, t) {
    const P = UD.PAL; const c = P.towel[t.c % P.towel.length];
    ctx.save(); ctx.translate(t.x, t.y); ctx.rotate(t.rot);
    ctx.beginPath(); UD.rr(ctx, -t.w / 2, -t.h / 2, t.w, t.h, 4); fs(ctx, c, 2.6);
    ctx.save(); ctx.clip();
    ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 3;
    for (let y = -t.h / 2 + 4; y < t.h / 2; y += 7) { ctx.beginPath(); ctx.moveTo(-t.w / 2, y); ctx.lineTo(t.w / 2, y); ctx.stroke(); }
    ctx.restore();
    ctx.restore();
  };

  art.sandcastle = function (ctx, c) {
    const P = UD.PAL; ctx.save(); ctx.translate(c.x, c.y);
    shadow(ctx, 0, 4, 26, 7);
    ctx.beginPath(); ctx.moveTo(-24, 4); ctx.lineTo(-18, -10); ctx.lineTo(18, -10); ctx.lineTo(24, 4); ctx.closePath();
    fs(ctx, P.sandDark, 2.8);
    for (const tx of [-18, 0, 18]) {
      ctx.beginPath(); UD.rr(ctx, tx - 6, -24, 12, 18, 2); fs(ctx, P.sandLight, 2.6);
      ctx.beginPath(); ctx.moveTo(tx - 7, -24); ctx.lineTo(tx - 7, -28); ctx.lineTo(tx - 3, -24);
      ctx.lineTo(tx, -28); ctx.lineTo(tx + 3, -24); ctx.lineTo(tx + 7, -28); ctx.lineTo(tx + 7, -24); fs(ctx, P.sandLight, 2.2);
    }
    // flag
    ctx.beginPath(); ctx.moveTo(0, -42); ctx.lineTo(0, -26); stroke(ctx, 2, '#7a4a2a');
    ctx.beginPath(); ctx.moveTo(0, -42); ctx.lineTo(9, -39); ctx.lineTo(0, -36); fs(ctx, P.neonA, 1.8);
    ctx.restore();
  };

  art.umbrellaDecor = function (ctx, u) {
    const P = UD.PAL; const cols = ['#ff4d6d', '#36c5f0', '#ffd23f', '#2ec4a6', '#ff8e3c'];
    const c = cols[u.c % cols.length];
    ctx.save(); ctx.translate(u.x, u.y);
    shadow(ctx, 6, 6, 22, 6);
    ctx.beginPath(); ctx.moveTo(0, 4); ctx.lineTo(2, -34); stroke(ctx, 3, P.umbrellaPole);
    ellipse(ctx, 0, -34, 30, 13); fs(ctx, c, 3);
    ctx.save(); ctx.beginPath(); ellipse(ctx, 0, -34, 30, 13); ctx.clip();
    ctx.fillStyle = 'rgba(255,255,255,.35)';
    for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(i * 12, -47); ctx.lineTo(i * 12 + 6, -21); ctx.lineTo(i * 12 - 6, -21); ctx.fill(); }
    ctx.restore();
    ellipse(ctx, 0, -34, 30, 13); stroke(ctx, 3);
    ctx.restore();
  };

  art.palm = function (ctx, p) {
    ctx.save(); ctx.translate(p.x, p.y); shadow(ctx, 8, 4, 24, 7);
    ctx.beginPath(); ctx.moveTo(-5, 4); ctx.quadraticCurveTo(4, -30, -2, -62); stroke(ctx, 8, '#9a6a3a');
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + .3;
      ctx.beginPath(); ctx.moveTo(-2, -62);
      ctx.quadraticCurveTo(Math.cos(a) * 26, -66 + Math.sin(a) * 12, Math.cos(a) * 44, -58 + Math.sin(a) * 22);
      stroke(ctx, 9, '#2ea36b');
    }
    ctx.restore();
  };

  art.lifeguard = function (ctx, t) {
    const P = UD.PAL; ctx.save(); ctx.translate(t.x, t.y); shadow(ctx, 0, 6, 30, 8);
    for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(s * 20, 6); ctx.lineTo(s * 12, -40); stroke(ctx, 5, '#c08a4a'); }
    ctx.beginPath(); UD.rr(ctx, -26, -64, 52, 26, 4); fs(ctx, '#e23b4e', 3.4);
    ctx.beginPath(); ctx.moveTo(-30, -64); ctx.lineTo(0, -82); ctx.lineTo(30, -64); ctx.closePath(); fs(ctx, '#fff', 3.2);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 11px "Press Start 2P"'; ctx.textAlign = 'center'; ctx.fillText('★', 0, -47);
    ctx.restore();
  };

  art.vendor = function (ctx, v) {
    const P = UD.PAL; ctx.save(); ctx.translate(v.x, v.y); shadow(ctx, 0, 6, 30, 8);
    ctx.beginPath(); UD.rr(ctx, -26, -24, 52, 30, 4); fs(ctx, '#f4f0e6', 3.2);
    ctx.beginPath(); UD.rr(ctx, -30, -42, 60, 20, 3);
    const g = ctx.createLinearGradient(-30, 0, 30, 0);
    g.addColorStop(0, '#ff4d6d'); g.addColorStop(.33, '#fff'); g.addColorStop(.66, '#ff4d6d'); g.addColorStop(1, '#fff');
    fill(ctx, g); stroke(ctx, 3);
    ctx.fillStyle = OL; ctx.font = '9px "Press Start 2P"'; ctx.textAlign = 'center';
    ctx.fillText('🍦', 0, -6);
    ctx.restore();
  };

  art.parkedCar = function (ctx, c) {
    ctx.save(); ctx.translate(c.x, c.y); shadow(ctx, 0, 14, 36, 9);
    ctx.beginPath(); UD.rr(ctx, -36, -10, 72, 26, 8); fs(ctx, c.col, 3.4);
    ctx.beginPath(); UD.rr(ctx, -24, -26, 48, 20, 7); fs(ctx, UD.shade(c.col, .15), 3);
    ctx.fillStyle = '#bfe9ff'; ctx.beginPath(); UD.rr(ctx, -20, -23, 40, 14, 5); ctx.fill();
    circle(ctx, -22, 16, 8); fs(ctx, '#222', 2.8); circle(ctx, 22, 16, 8); fs(ctx, '#222', 2.8);
    circle(ctx, -22, 16, 3); fs(ctx, '#999', 1.6); circle(ctx, 22, 16, 3); fs(ctx, '#999', 1.6);
    ctx.restore();
  };

  UD.art = art;
})(window.UD);
