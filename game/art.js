/* ============ UMBRELLA DAD · art.js ============ */
/* Chunky flat-vector cartoon drawing. Everything is paths with thick dark
   outlines + flat fills + one posterized shadow tone — modern 16-bit look. */
(function (UD) {
  'use strict';
  const OL = '#1c1018';            // universal outline ink
  const art = {};

  function fill(ctx, c) { ctx.fillStyle = c; ctx.fill(); }
  function stroke(ctx, lw, c) { ctx.lineWidth = lw; ctx.strokeStyle = c || OL; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.stroke(); }
  function fs(ctx, c, lw) { fill(ctx, c); stroke(ctx, lw); }

  function ellipse(ctx, x, y, rx, ry) { ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.closePath(); }
  function circle(ctx, x, y, r) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.closePath(); }

  function shadow(ctx, x, y, rx, ry) {
    ctx.save(); ctx.globalAlpha = 0.22; ctx.fillStyle = '#10204a';
    ellipse(ctx, x, y, rx, ry); ctx.fill(); ctx.restore();
  }

  /* ---------------------------------------------------------------- DAD */
  // dad has: .x .y (feet), .walk (phase), .build, .squash, .flash, .state
  art.dad = function (ctx, d) {
    const P = UD.PAL;
    const builds = {
      classic: { belly: 1, h: 1, },
      dadbod:  { belly: 1.28, h: 0.93 },
      tall:    { belly: 0.82, h: 1.16 },
    };
    const b = builds[UD.dadBuild] || builds.classic;
    const S = (d.scale || 1) * 1.0;
    const bob = Math.sin(d.walk) * 2.2 * (d.moving ? 1 : 0.25);
    const sq = d.squash || 1;

    ctx.save();
    ctx.translate(d.x, d.y);
    shadow(ctx, 0, 2, 22 * S, 7 * S);
    ctx.scale(S * (2 - sq), S * sq);
    ctx.translate(0, bob);

    const burn = d.state === 'hop';
    const skin = burn ? P.skinBurn : P.skin;
    const legSwing = Math.sin(d.walk) * (d.moving ? 5 : 0);

    // legs
    for (const s of [-1, 1]) {
      const off = s * legSwing;
      ctx.save(); ctx.translate(s * 7, -14);
      // leg
      ctx.beginPath();
      UD.rr(ctx, -5, 0, 10, 14 + off * 0.2, 4); fs(ctx, P.skin, 3);
      // sandal
      ctx.beginPath(); UD.rr(ctx, -7, 12 + off * 0.2, 14, 6, 3); fs(ctx, P.sandal, 3);
      ctx.restore();
    }

    // body height factor
    const bh = b.h;
    // cargo shorts
    ctx.beginPath();
    UD.rr(ctx, -15, -30 * bh, 30, 20 * bh, 7); fs(ctx, P.shortsA, 3.2);
    ctx.beginPath(); ctx.moveTo(0, -30 * bh); ctx.lineTo(0, -12 * bh); stroke(ctx, 3);
    // cargo pockets
    ctx.beginPath(); UD.rr(ctx, -14, -22 * bh, 7, 9, 2); fs(ctx, P.shortsB, 2.4);
    ctx.beginPath(); UD.rr(ctx, 7, -22 * bh, 7, 9, 2); fs(ctx, P.shortsB, 2.4);

    // belly / Hawaiian shirt
    const bw = 20 * b.belly;
    ctx.beginPath();
    ctx.moveTo(-bw, -30 * bh);
    ctx.quadraticCurveTo(-bw - 3, -52 * bh, -13, -60 * bh);
    ctx.quadraticCurveTo(0, -64 * bh, 13, -60 * bh);
    ctx.quadraticCurveTo(bw + 3, -52 * bh, bw, -30 * bh);
    ctx.quadraticCurveTo(0, -24 * bh, -bw, -30 * bh);
    ctx.closePath(); fs(ctx, P.kidB ? '#16b8a6' : '#16b8a6', 3.4); // teal hawaiian base
    // shirt coral panel + buttons
    ctx.save(); ctx.clip();
    ctx.fillStyle = '#ff6b5e';
    for (let i = 0; i < 7; i++) { circle(ctx, UD.rand(-bw, bw), -58 * bh + i * 5, 3.2); ctx.fill(); }
    ctx.fillStyle = '#ffe14d';
    for (let i = 0; i < 5; i++) { circle(ctx, UD.rand(-bw, bw), -50 * bh + i * 6, 2.2); ctx.fill(); }
    ctx.restore();
    // button placket
    ctx.beginPath(); ctx.moveTo(0, -58 * bh); ctx.lineTo(0, -28 * bh); stroke(ctx, 2.4);

    // ARMS + gear ------------------------------------------------------
    // left arm holds cooler (ranged ammo)
    ctx.save(); ctx.translate(-bw - 2, -44 * bh);
    ctx.beginPath(); UD.rr(ctx, -6, 0, 11, 16, 5); fs(ctx, skin, 3);
    // cooler
    ctx.beginPath(); UD.rr(ctx, -13, 12, 22, 16, 4); fs(ctx, P.cooler, 3.2);
    ctx.beginPath(); UD.rr(ctx, -13, 10, 22, 6, 3); fs(ctx, P.coolerLid, 3);
    ctx.beginPath(); ctx.moveTo(-6, 10); ctx.lineTo(-6, 28); stroke(ctx, 2);
    ctx.restore();

    // right arm + umbrella (melee). During swing we draw a big arc.
    if (d.state === 'swing') {
      art._umbrellaSwing(ctx, d, bh, skin, bw);
    } else {
      ctx.save(); ctx.translate(bw + 1, -46 * bh);
      ctx.beginPath(); UD.rr(ctx, -5, 0, 11, 15, 5); fs(ctx, skin, 3);
      // closed umbrella over shoulder pointing up-back
      ctx.save(); ctx.translate(2, 4); ctx.rotate(-0.5);
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -54); stroke(ctx, 4, P.umbrellaPole);
      ctx.beginPath(); UD.rr(ctx, -7, -54, 14, 26, 7); fs(ctx, P.neonA || '#ff2d95', 3.2);
      ctx.beginPath(); ctx.moveTo(-7, -40); ctx.lineTo(7, -40); stroke(ctx, 2.4, '#fff');
      ctx.beginPath(); circle(ctx, 0, -56, 3); fs(ctx, '#ffe14d', 2.4);
      ctx.restore();
      ctx.restore();
    }

    // HEAD -------------------------------------------------------------
    ctx.save(); ctx.translate(0, -62 * bh);
    circle(ctx, 0, -8, 13); fs(ctx, skin, 3.4);
    // sunburn cheeks
    ctx.save(); ctx.globalAlpha = burn ? .8 : .5; ctx.fillStyle = P.skinBurn;
    circle(ctx, -7, -5, 4); ctx.fill(); circle(ctx, 7, -5, 4); ctx.fill(); ctx.restore();
    // thinning hair
    ctx.beginPath(); ctx.arc(0, -10, 13, Math.PI * 1.08, Math.PI * 1.92); fs(ctx, P.hair, 3);
    ctx.beginPath(); ctx.moveTo(-12, -10); ctx.quadraticCurveTo(0, -16, 12, -10); stroke(ctx, 3, P.hair);
    // determined/exhausted eyes
    const stressed = d.state === 'hurt' || d.state === 'hop' || (d.stressN || 0) > .6;
    ctx.fillStyle = OL;
    if (stressed) {
      ctx.beginPath(); ctx.moveTo(-9, -10); ctx.lineTo(-3, -8); stroke(ctx, 2.4, OL);
      ctx.beginPath(); ctx.moveTo(9, -10); ctx.lineTo(3, -8); stroke(ctx, 2.4, OL);
      circle(ctx, -6, -7, 2); ctx.fill(); circle(ctx, 6, -7, 2); ctx.fill();
    } else {
      circle(ctx, -5, -8, 2.1); ctx.fill(); circle(ctx, 5, -8, 2.1); ctx.fill();
      // determined brow
      ctx.beginPath(); ctx.moveTo(-9, -12); ctx.lineTo(-2, -11); stroke(ctx, 2.2, OL);
      ctx.beginPath(); ctx.moveTo(9, -12); ctx.lineTo(2, -11); stroke(ctx, 2.2, OL);
    }
    // mouth — grimace
    ctx.beginPath();
    if (d.state === 'victory') ctx.arc(0, -2, 5, 0, Math.PI);
    else { ctx.moveTo(-5, -1); ctx.quadraticCurveTo(0, -3, 5, -1); }
    stroke(ctx, 2.4, OL);
    // mustache
    ctx.beginPath(); ctx.moveTo(-5, -3); ctx.quadraticCurveTo(0, -1, 5, -3); stroke(ctx, 3.2, '#3a2414');
    // sweat bead
    if (d.moving || stressed) {
      ctx.save(); ctx.translate(13, -13 + Math.sin(d.walk * 2) * 1.5);
      ctx.beginPath(); ctx.moveTo(0, -3); ctx.quadraticCurveTo(3, 0, 0, 3); ctx.quadraticCurveTo(-3, 0, 0, -3);
      fs(ctx, '#9fe8ff', 1.6); ctx.restore();
    }
    ctx.restore(); // head

    ctx.restore(); // dad
  };

  art._umbrellaSwing = function (ctx, d, bh, skin, bw) {
    const P = UD.PAL;
    const t = d.swingT || 0;             // 0..1 over the swing
    const ang = UD.lerp(-2.4, 0.9, t);   // sweeps across the front
    ctx.save();
    ctx.translate(0, -42 * bh);
    ctx.rotate(ang);
    // arm
    ctx.beginPath(); UD.rr(ctx, -5, -2, 11, 18, 5); fs(ctx, skin, 3);
    // pole
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -40); stroke(ctx, 4.5, P.umbrellaPole);
    // OPEN umbrella canopy (scalloped)
    const segs = 6, R = 30;
    ctx.beginPath(); ctx.moveTo(-R, -40);
    for (let i = 0; i <= segs; i++) {
      const a = Math.PI + (i / segs) * Math.PI;
      const x = Math.cos(a) * R, y = -40 + Math.sin(a) * 14;
      const mx = Math.cos(a + Math.PI / segs / 2) * R, my = -40 + Math.sin(a + Math.PI / segs / 2) * 22;
      ctx.quadraticCurveTo(mx, my, x, y);
    }
    ctx.closePath();
    const grad = ctx.createLinearGradient(-R, 0, R, 0);
    grad.addColorStop(0, P.neonA); grad.addColorStop(.5, '#fff'); grad.addColorStop(1, P.neonB);
    fill(ctx, grad); stroke(ctx, 3.4);
    // ribs
    for (let i = 1; i < segs; i++) {
      const a = Math.PI + (i / segs) * Math.PI;
      ctx.beginPath(); ctx.moveTo(0, -40); ctx.lineTo(Math.cos(a) * R, -40 + Math.sin(a) * 14); stroke(ctx, 1.6, 'rgba(0,0,0,.3)');
    }
    ctx.beginPath(); circle(ctx, 0, -56, 3); fs(ctx, '#ffe14d', 2.4);
    ctx.restore();
    // swoosh arc
    ctx.save(); ctx.globalAlpha = .5 * (1 - t);
    ctx.beginPath(); ctx.arc(0, -42 * bh, 46, -2.4, ang); stroke(ctx, 6, '#fff');
    ctx.restore();
  };

  UD.art = art;
})(window.UD);
