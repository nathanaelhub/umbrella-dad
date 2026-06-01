/* ============================================================
   UMBRELLA DAD · sprites.js
   Fully-articulated "animation sheet" version of the dad.
   Forward-kinematics rig posed per-frame -> real keyframe motion.
   Local space: feet on ground at (0,0); up is -y; facing +x (right).
   ============================================================ */
(function (UD) {
  'use strict';
  const OL = '#1c1018';
  const P = () => UD.PAL || {};
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  // ease helpers
  const E = {
    inOut: t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
    out: t => 1 - Math.pow(1 - t, 3),
    in: t => t * t * t,
    back: t => { const c = 2.4; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); },
    bounce: t => { const n = 7.5625, d = 2.75; if (t < 1 / d) return n * t * t; if (t < 2 / d) return n * (t -= 1.5 / d) * t + .75; if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + .9375; return n * (t -= 2.625 / d) * t + .984375; },
  };
  // piecewise: segs = [[t0,t1,from,to,ease]...]
  function seg(t, segs, dflt) {
    for (const s of segs) {
      const [a, b, from, to, ez] = s;
      if (t >= a && t <= b) { const u = b === a ? 1 : (t - a) / (b - a); return lerp(from, to, (ez || E.inOut)(clamp(u, 0, 1))); }
    }
    return dflt;
  }

  /* ---------- low-level draw ---------- */
  function cap(ctx, x1, y1, x2, y2, w, col) {
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.strokeStyle = OL; ctx.lineWidth = w + 5;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    ctx.strokeStyle = col; ctx.lineWidth = w;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  }
  const segEnd = (x, y, a, l) => ({ x: x + Math.sin(a) * l, y: y + Math.cos(a) * l });
  function circle(ctx, x, y, r, fill, lw) {
    ctx.beginPath(); ctx.arc(x, y, r, 0, 7);
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (lw) { ctx.lineWidth = lw; ctx.strokeStyle = OL; ctx.stroke(); }
  }

  /* ---------- rig constants ---------- */
  const HIP_Y = -42, HIP_X = 13, SH_LY = -50, HEAD_LY = -70, HEAD_R = 13; // HEAD_LY hip-space
  const THIGH = 19, SHIN = 17, UPPER = 16, FORE = 14;

  // carried closed-umbrella geometry (hip space): handle(bottom) -> tip(top),
  // slung up-and-back over the right shoulder. Shared by back-shaft + front grip.
  const CARRY = { bh: { x: 27, y: -18 }, ang: -2.36, len: 82,
                  grip: { x: 14, y: -33 } };

  function drawLeg(ctx, hipX, hipAng, kneeAng, build) {
    const pal = P();
    const knee = segEnd(hipX, HIP_Y, hipAng, THIGH * build.h);
    const foot = segEnd(knee.x, knee.y, hipAng + kneeAng, SHIN * build.h);
    cap(ctx, hipX, HIP_Y, knee.x, knee.y, 10, pal.skin);   // thigh (bare)
    cap(ctx, knee.x, knee.y, foot.x, foot.y, 8.5, pal.skin); // calf
    // sandal: sole ahead of ankle + toe strap
    ctx.save(); ctx.translate(foot.x, foot.y);
    ctx.beginPath(); UD.rr(ctx, -5, 1, 17, 5, 2.5); ctx.fillStyle = pal.sandal; ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = OL; ctx.lineJoin = 'round'; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(3, 1); ctx.lineTo(6, -4); ctx.lineWidth = 3; ctx.strokeStyle = pal.sandal; ctx.lineCap = 'round'; ctx.stroke();
    ctx.restore();
    return foot;
  }

  // cargo-shorts pelvis block (world space, drawn between legs & torso)
  function drawShorts(ctx, build) {
    const pal = P(); const w = 15 * build.belly;
    ctx.beginPath(); UD.rr(ctx, -w, HIP_Y - 7, w * 2, 21, 7);
    ctx.fillStyle = pal.shortsA; ctx.fill(); ctx.lineWidth = 3.4; ctx.strokeStyle = OL; ctx.lineJoin = 'round'; ctx.stroke();
    // hem + leg split
    ctx.beginPath(); ctx.moveTo(0, HIP_Y + 14); ctx.lineTo(0, HIP_Y + 3);
    ctx.lineWidth = 2.6; ctx.strokeStyle = UD.shade(pal.shortsA, -.22); ctx.stroke();
    // cargo pockets
    ctx.fillStyle = pal.shortsB; ctx.lineWidth = 2; ctx.strokeStyle = OL;
    ctx.beginPath(); UD.rr(ctx, -w + 2, HIP_Y + 1, 8, 9, 2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); UD.rr(ctx, w - 10, HIP_Y + 1, 8, 9, 2); ctx.fill(); ctx.stroke();
  }

  // skin neck stub (hip-rotated space, drawn under the head)
  function drawNeck(ctx) {
    const pal = P();
    ctx.beginPath();
    ctx.moveTo(-5, SH_LY + 1); ctx.lineTo(5, SH_LY + 1);
    ctx.lineTo(4.2, SH_LY - 10); ctx.lineTo(-4.2, SH_LY - 10); ctx.closePath();
    ctx.fillStyle = pal.skin; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = OL; ctx.lineJoin = 'round'; ctx.stroke();
  }

  function drawArm(ctx, shAng, elAng, side, burn) {
    const pal = P(); const skin = burn ? pal.skinBurn : pal.skin;
    const shX = side * 4;
    const elbow = segEnd(shX, SH_LY, shAng, UPPER);
    const hand = segEnd(elbow.x, elbow.y, shAng + elAng, FORE);
    cap(ctx, shX, SH_LY, elbow.x, elbow.y, 9, skin);
    // short sleeve
    const sl = segEnd(shX, SH_LY, shAng, UPPER * .42);
    cap(ctx, shX, SH_LY, sl.x, sl.y, 11, '#16b8a6');
    cap(ctx, elbow.x, elbow.y, hand.x, hand.y, 7.5, skin);
    return hand;
  }

  // 2-bone IK: reach hand to target (tx,ty); bend = elbow side (+/-1).
  function armIK(ctx, sx, sy, tx, ty, l1, l2, bend, burn) {
    const pal = P(); const skin = burn ? pal.skinBurn : pal.skin;
    let dx = tx - sx, dy = ty - sy, d = Math.hypot(dx, dy);
    d = clamp(d, Math.abs(l1 - l2) + .5, l1 + l2 - .5);
    const a = Math.atan2(dy, dx);
    const ca = clamp((d * d + l1 * l1 - l2 * l2) / (2 * d * l1), -1, 1);
    const ea = a + bend * Math.acos(ca);
    const ex = sx + Math.cos(ea) * l1, ey = sy + Math.sin(ea) * l1;
    cap(ctx, sx, sy, ex, ey, 9, skin);
    cap(ctx, sx, sy, sx + Math.cos(ea) * l1 * .44, sy + Math.sin(ea) * l1 * .44, 11, '#16b8a6'); // sleeve
    cap(ctx, ex, ey, tx, ty, 7.5, skin);
    return { x: tx, y: ty };
  }

  /* ---------- gear ---------- */
  function drawCooler(ctx, x, y, ang) {
    const pal = P();
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
    UD.rr(ctx, -13, 0, 26, 18, 4); ctx.fillStyle = pal.cooler; ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = OL; ctx.stroke();
    UD.rr(ctx, -13, -3, 26, 7, 3); ctx.fillStyle = pal.coolerLid; ctx.fill(); ctx.stroke();
    // handle to hand
    ctx.beginPath(); ctx.moveTo(-5, -3); ctx.lineTo(-5, -10); ctx.lineWidth = 2.4; ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.font = '7px "Press Start 2P", monospace'; ctx.textAlign = 'center';
    ctx.fillText('🥤', 0, 13);
    ctx.restore();
  }
  function drawSodaCan(ctx, x, y, rot) {
    const pal = P();
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    UD.rr(ctx, -5, -8, 10, 16, 3); ctx.fillStyle = pal.cooler; ctx.fill();
    ctx.lineWidth = 2.4; ctx.strokeStyle = OL; ctx.stroke();
    ctx.fillStyle = '#fff'; UD.rr(ctx, -5, -2, 10, 5, 1); ctx.fill();
    UD.rr(ctx, -5, -8, 10, 3, 2); ctx.fillStyle = '#d8d2c4'; ctx.fill(); ctx.stroke();
    ctx.restore();
  }
  // closed umbrella as a capsule with a tip + handle along an arm vector
  function drawUmbrellaClosed(ctx, x, y, ang, len) {
    const pal = P();
    const tip = segEnd(x, y, ang, len);
    cap(ctx, x, y, tip.x, tip.y, 4.5, pal.umbrellaPole);
    // furled canopy near tip
    const c0 = segEnd(x, y, ang, len * .42), c1 = segEnd(x, y, ang, len * .92);
    cap(ctx, c0.x, c0.y, c1.x, c1.y, 11, pal.neonA);
    // binding lines
    const m = segEnd(x, y, ang, len * .66);
    circle(ctx, m.x, m.y, 2.4, '#fff', 1.6);
    circle(ctx, tip.x, tip.y, 2.6, '#ffe14d', 1.8);
  }
  // open umbrella canopy centered at (x,y), pole down to handle, tilt rot
  function drawUmbrellaOpen(ctx, x, y, rot, open, scale) {
    const pal = P(); scale = scale || 1; open = clamp(open, 0, 1);
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(scale, scale);
    const R = 34 * open, H = 15, segs = 6;
    // pole
    cap(ctx, 0, 0, 0, 40 * (open * .4 + .6), 4.5, pal.umbrellaPole);
    if (open > 0.04) {
      ctx.beginPath(); ctx.moveTo(-R, 0);
      for (let i = 0; i <= segs; i++) {
        const a = Math.PI + (i / segs) * Math.PI;
        const px = Math.cos(a) * R, py = Math.sin(a) * H;
        const mx = Math.cos(a + Math.PI / segs / 2) * R, my = Math.sin(a + Math.PI / segs / 2) * (H + 9);
        ctx.quadraticCurveTo(mx, my, px, py);
      }
      ctx.closePath();
      const g = ctx.createLinearGradient(-R, 0, R, 0);
      g.addColorStop(0, pal.neonA); g.addColorStop(.5, '#fff'); g.addColorStop(1, pal.neonB);
      ctx.fillStyle = g; ctx.fill(); ctx.lineWidth = 3.4; ctx.strokeStyle = OL; ctx.stroke();
      for (let i = 1; i < segs; i++) {
        const a = Math.PI + (i / segs) * Math.PI;
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * R, Math.sin(a) * H);
        ctx.lineWidth = 1.6; ctx.strokeStyle = 'rgba(0,0,0,.28)'; ctx.stroke();
      }
      circle(ctx, 0, -2, 3, '#ffe14d', 2.2);
    }
    ctx.restore();
  }

  /* ---------- face ---------- */
  function drawHead(ctx, hx, hy, tilt, expr, burn, sweat) {
    const pal = P(); const skin = burn ? pal.skinBurn : pal.skin;
    ctx.save(); ctx.translate(hx, hy); ctx.rotate(tilt);
    circle(ctx, 0, 0, HEAD_R, skin, 3.4);
    // sunburn cheeks
    ctx.save(); ctx.globalAlpha = burn ? .85 : .5; ctx.fillStyle = pal.skinBurn;
    circle(ctx, -7, 3, 4, pal.skinBurn); circle(ctx, 7, 3, 4, pal.skinBurn); ctx.restore();
    // thinning hair
    ctx.beginPath(); ctx.arc(0, -2, HEAD_R, Math.PI * 1.06, Math.PI * 1.94); ctx.fillStyle = pal.hair; ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = OL; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-12, -2); ctx.quadraticCurveTo(0, -8, 12, -2); ctx.lineWidth = 3; ctx.strokeStyle = pal.hair; ctx.stroke();

    ctx.fillStyle = OL; ctx.strokeStyle = OL; ctx.lineCap = 'round';
    const eye = (ex, ey, type) => {
      if (type === 'wide') { circle(ctx, ex, ey, 3.4, '#fff', 1.8); ctx.fillStyle = OL; circle(ctx, ex, ey + .5, 1.8, OL); }
      else if (type === 'squint') { ctx.lineWidth = 2.6; ctx.beginPath(); ctx.moveTo(ex - 3, ey); ctx.lineTo(ex + 3, ey - 1.5); ctx.stroke(); }
      else if (type === 'joy') { ctx.lineWidth = 2.6; ctx.beginPath(); ctx.arc(ex, ey + 1, 3, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke(); }
      else { circle(ctx, ex, ey, 2.1, OL); }
    };
    const brow = (bx, by, ang) => { ctx.lineWidth = 2.3; ctx.strokeStyle = OL; ctx.beginPath(); ctx.moveTo(bx - 4, by - ang); ctx.lineTo(bx + 3, by + ang); ctx.stroke(); };

    let mouth = 'flat';
    if (expr === 'tired') { eye(-5, 0, 'squint'); eye(5, 0, 'squint'); brow(-5, -6, -1); brow(5, -6, 1); mouth = 'frown'; }
    else if (expr === 'determined') { eye(-5, 0, 'dot'); eye(5, 0, 'dot'); brow(-5, -6, 2); brow(5, -6, -2); mouth = 'grit'; }
    else if (expr === 'strain') { eye(-5, 0, 'squint'); eye(5, 0, 'squint'); brow(-5, -7, 2.5); brow(5, -7, -2.5); mouth = 'open'; }
    else if (expr === 'panic') { eye(-5, -1, 'wide'); eye(6, -1, 'wide'); brow(-5, -8, 1); brow(6, -8, -1); mouth = 'scream'; }
    else if (expr === 'joy') { eye(-5, 0, 'joy'); eye(5, 0, 'joy'); mouth = 'smile'; }
    else if (expr === 'content') { eye(-5, 0, 'squint'); eye(5, 0, 'squint'); mouth = 'smirk'; }
    else { eye(-5, 0, 'dot'); eye(5, 0, 'dot'); }

    ctx.lineWidth = 2.4; ctx.strokeStyle = OL; ctx.fillStyle = '#7a2030';
    ctx.beginPath();
    if (mouth === 'smile') ctx.arc(0, 2, 6, .05, Math.PI - .05);
    else if (mouth === 'smirk') { ctx.moveTo(-4, 4); ctx.quadraticCurveTo(2, 7, 6, 3); }
    else if (mouth === 'frown') { ctx.moveTo(-5, 6); ctx.quadraticCurveTo(0, 3, 5, 6); }
    else if (mouth === 'grit') { ctx.moveTo(-5, 4); ctx.lineTo(5, 4); ctx.moveTo(-5, 4); ctx.lineTo(-5, 6); ctx.moveTo(5, 4); ctx.lineTo(5, 6); ctx.moveTo(0, 4); ctx.lineTo(0, 6); }
    else if (mouth === 'open') { ctx.ellipse(0, 5, 4, 4, 0, 0, 7); ctx.fillStyle = '#7a2030'; ctx.fill(); }
    else if (mouth === 'scream') { ctx.ellipse(0, 5, 5, 6, 0, 0, 7); ctx.fillStyle = '#7a2030'; ctx.fill(); }
    else { ctx.moveTo(-5, 4); ctx.quadraticCurveTo(0, 2, 5, 4); }
    ctx.stroke();
    // mustache
    ctx.beginPath(); ctx.moveTo(-5, 0); ctx.quadraticCurveTo(0, 3, 5, 0); ctx.lineWidth = 3.2; ctx.strokeStyle = '#3a2414'; ctx.stroke();
    ctx.restore();

    if (sweat) {
      ctx.save(); ctx.translate(hx + 13, hy - 6 + (sweat.y || 0));
      ctx.beginPath(); ctx.moveTo(0, -3); ctx.quadraticCurveTo(3, 1, 0, 4); ctx.quadraticCurveTo(-3, 1, 0, -3);
      ctx.fillStyle = '#9fe8ff'; ctx.fill(); ctx.lineWidth = 1.4; ctx.strokeStyle = OL; ctx.stroke(); ctx.restore();
    }
  }

  function drawTorso(ctx, belly) {
    const pal = P();
    const belW = 19 * belly, shW = 13;
    ctx.beginPath();
    ctx.moveTo(-belW, 2);
    ctx.quadraticCurveTo(-belW - 3, SH_LY + 16, -shW, SH_LY + 4);
    ctx.quadraticCurveTo(0, SH_LY - 4, shW, SH_LY + 4);
    ctx.quadraticCurveTo(belW + 3, SH_LY + 16, belW, 2);
    ctx.quadraticCurveTo(0, 8, -belW, 2); ctx.closePath();
    ctx.fillStyle = '#16b8a6'; ctx.fill(); ctx.lineWidth = 3.4; ctx.strokeStyle = OL; ctx.stroke();
    // hawaiian splotches
    ctx.save(); ctx.clip();
    ctx.fillStyle = '#ff6b5e';
    const rnd = mulberry(99);
    for (let i = 0; i < 9; i++) circle(ctx, lerp(-belW, belW, rnd()), lerp(SH_LY, 0, rnd()), 3);
    ctx.fillStyle = '#ffe14d';
    for (let i = 0; i < 7; i++) circle(ctx, lerp(-belW, belW, rnd()), lerp(SH_LY, 0, rnd()), 2);
    ctx.restore();
    // placket + buttons
    ctx.beginPath(); ctx.moveTo(0, SH_LY + 2); ctx.lineTo(0, 0); ctx.lineWidth = 2.2; ctx.strokeStyle = OL; ctx.stroke();
    ctx.fillStyle = '#fff'; for (let i = 0; i < 4; i++) circle(ctx, 0, SH_LY + 8 + i * 11, 1.4, '#fff');
  }
  function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

  /* ============================================================
     POSE RESOLUTION — one function per animation, returns pose.
     pose fields used by render(): bobY, lean, sqx, sqy, build,
       legF/legB {hip,knee}, armCooler/armUmb {sh,el}, head {x,y,tilt,expr},
       burn, sweat, umbrella {mode, ...}, fx {...}
     ============================================================ */

  const BUILDS = { classic: { belly: 1, h: 1 }, dadbod: { belly: 1.26, h: .94 }, tall: { belly: .84, h: 1.14 } };

  function base() {
    return {
      bobY: 0, lean: 0, sqx: 1, sqy: 1,
      legF: { hip: .12, knee: .06 }, legB: { hip: -.12, knee: .06 },
      armCooler: { sh: -1.9, el: .5 },   // tucked holding cooler at side
      armUmb: { sh: 2.0, el: -.4 },      // closed umbrella over shoulder
      head: { x: 1, y: HEAD_LY, tilt: 0, expr: 'determined' },
      burn: false, sweat: null,
      umbrella: { mode: 'shoulder' },    // shoulder|open|raise|plant|none
      coolerVisible: true, sodaInHand: false,
      fx: {},
    };
  }

  const ANIMS = {};

  /* --- 1. TIRED JOG (loop) --- */
  ANIMS.jog = {
    label: 'TIRED JOG', frames: 8, fps: 9, loop: true,
    desc: 'The default trudge. Heavy, hunched, arms full of gear — every step looks like effort.',
    pose(t) {
      const p = base(); const ph = t * Math.PI * 2;
      p.lean = .2; p.bobY = -Math.abs(Math.sin(ph)) * 5 - 1;
      p.legF.hip = Math.sin(ph) * .85 + .1; p.legF.knee = .25 + (Math.cos(ph) * .5 + .5) * .7;
      p.legB.hip = Math.sin(ph + Math.PI) * .85 + .1; p.legB.knee = .25 + (Math.cos(ph + Math.PI) * .5 + .5) * .7;
      p.armCooler = { sh: -2.0 + Math.sin(ph) * .12, el: .55 };
      p.armUmb = { sh: 2.05 - Math.sin(ph) * .1, el: -.45 };
      p.head.tilt = .07; p.head.x = 3; p.head.expr = 'tired';
      p.sweat = { y: Math.sin(ph * 2) * 1.5 };
      p.umbrella = { mode: 'shoulder' };
      p.fx = { motion: 'back', motionAmt: Math.abs(Math.sin(ph)) };
      return p;
    },
  };

  /* --- 2. UMBRELLA SWING (one-shot) --- */
  ANIMS.swing = {
    label: 'UMBRELLA SWING', frames: 7, fps: 14, loop: false,
    desc: 'Melee attack. Wind up, bloom the umbrella open, sweep a wide overhead arc with knockback.',
    pose(t) {
      const p = base();
      // body
      p.lean = seg(t, [[0, .25, .1, -.22, E.out], [.25, .6, -.22, .34, E.in], [.6, 1, .34, .16, E.out]]);
      p.bobY = seg(t, [[0, .3, 0, -3], [.3, .6, -3, 2], [.6, 1, 2, 0]]);
      // a small forward step
      const step = seg(t, [[.3, .65, 0, 1, E.out]], t < .3 ? 0 : 1);
      p.legF = { hip: .2 + step * .45, knee: .2 };
      p.legB = { hip: -.3 - step * .2, knee: .55 };
      // umbrella arm sweeps from up-back to down-front
      const sw = seg(t, [[0, .25, 2.5, 3.4, E.out], [.25, .65, 3.4, .5, E.in], [.65, 1, .5, 1.3, E.out]]);
      p.armUmb = { sh: sw, el: -.2 };
      p.armCooler = { sh: -2.1, el: .6 };
      p.head.expr = t < .25 ? 'determined' : (t < .65 ? 'strain' : 'determined');
      p.head.tilt = lerp(-.05, .12, t);
      // umbrella: closed during windup, open during the sweep
      const open = seg(t, [[.18, .4, 0, 1, E.out], [.65, 1, 1, .85]], t < .18 ? 0 : 1);
      p.umbrella = { mode: 'open', open, armAngle: sw };
      p.fx = { swoosh: (t > .25 && t < .8) ? (t - .25) / .55 : -1, swooshFrom: 3.4, swooshTo: .5 };
      return p;
    },
  };

  /* --- 3. SODA THROW (one-shot) --- */
  ANIMS.throw = {
    label: 'SODA THROW', frames: 7, fps: 13, loop: false,
    desc: 'Ranged attack. Reach into the cooler, wind back, and hurl a fizzing can downrange. 6 shots only.',
    pose(t) {
      const p = base();
      p.lean = seg(t, [[0, .3, .1, -.18, E.out], [.3, .55, -.18, .3, E.in], [.55, 1, .3, .12, E.out]]);
      p.bobY = -1;
      p.legF = { hip: .25, knee: .2 }; p.legB = { hip: -.32, knee: .5 };
      // cooler arm = throwing arm. windup back high, then whip forward & down
      const th = seg(t, [[0, .3, -1.9, -2.7, E.out], [.3, .5, -2.7, -.4, E.in], [.5, 1, -.4, .3, E.out]]);
      p.armCooler = { sh: th, el: seg(t, [[0, .3, .5, 1.0], [.3, .5, 1.0, -.1], [.5, 1, -.1, .2]]) };
      p.armUmb = { sh: 2.05, el: -.4 };  // umbrella stays shouldered
      p.coolerFront = true;
      p.umbrella = { mode: 'shoulder' };
      p.head.expr = 'determined'; p.head.tilt = lerp(-.06, .1, t);
      p.sodaInHand = t < .5;
      // released can flies off after t~0.5
      if (t >= .5) {
        const ft = (t - .5) / .5;
        p.fx = { soda: { x: lerp(34, 150, ft), y: lerp(-58, -36, ft) - Math.sin(ft * Math.PI) * 14, rot: ft * 12, trail: ft } };
      }
      return p;
    },
  };

  /* --- 4. SLIP (one-shot) --- */
  ANIMS.slip = {
    label: 'ICE-CREAM SLIP', frames: 7, fps: 12, loop: false,
    desc: 'Step on a melted-cone slick and grip vanishes — feet fly up, arms windmill, total loss of dignity.',
    pose(t) {
      const p = base();
      // lean back further & further
      p.lean = seg(t, [[0, .2, .1, .0], [.2, .6, 0, -.7, E.out], [.6, 1, -.7, -1.0, E.out]]);
      p.bobY = seg(t, [[0, .3, 0, -2], [.3, 1, -2, 6, E.in]]);
      // feet shoot forward
      const f = seg(t, [[.15, .6, 0, 1, E.out]], t < .15 ? 0 : 1);
      p.legF = { hip: .2 + f * 1.3, knee: -f * .3 };
      p.legB = { hip: -.1 + f * 1.0, knee: -f * .2 };
      // arms windmill up
      p.armCooler = { sh: lerp(-1.9, -3.5, E.out(clamp(t * 1.4, 0, 1))), el: lerp(.5, -.8, t) };
      p.armUmb = { sh: lerp(2.0, 3.6, E.out(clamp(t * 1.4, 0, 1))), el: lerp(-.4, .9, t) };
      p.head.tilt = lerp(0, -.4, t); p.head.expr = t < .2 ? 'determined' : 'panic';
      p.umbrella = { mode: 'fling', armAngle: p.armUmb.sh };
      p.fx = { motion: 'under', skid: t > .15 && t < .7 ? 1 : 0, exclaim: t > .25 ? '!?' : '' };
      return p;
    },
  };

  /* --- 5. HOT SAND PANIC HOP (loop) --- */
  ANIMS.hop = {
    label: 'HOT-SAND PANIC', frames: 6, fps: 14, loop: true,
    desc: 'On scorching sand the flip-flops fail. Frantic alternating hops, arms up, "HOT-HOT-HOT".',
    pose(t) {
      const p = base(); const ph = t * Math.PI * 2;
      const air = Math.abs(Math.sin(ph));
      p.bobY = -air * 9 - 1; p.sqx = 1 + (1 - air) * .12; p.sqy = 1 - (1 - air) * .12;
      p.lean = .02;
      // feet tuck up alternately, very bent
      const side = Math.sin(ph) > 0 ? 1 : -1;
      p.legF = { hip: side > 0 ? .1 : .3, knee: side > 0 ? 1.5 * air + .3 : .3 };
      p.legB = { hip: side > 0 ? .25 : .1, knee: side > 0 ? .3 : 1.5 * air + .3 };
      // arms thrown up flailing
      p.armCooler = { sh: -3.0 + Math.sin(ph * 2) * .25, el: -.5 };
      p.armUmb = { sh: 3.0 + Math.cos(ph * 2) * .25, el: .5 };
      p.head.tilt = Math.sin(ph * 2) * .12; p.head.expr = 'panic';
      p.umbrella = { mode: 'wave', armAngle: p.armUmb.sh };
      p.coolerVisible = true;
      p.fx = { heat: 1, hopSide: side, sweatFly: air, exclaim: 'HOT!' };
      return p;
    },
  };

  /* --- 6. VICTORY UMBRELLA PLACEMENT (one-shot finale) --- */
  ANIMS.victory = {
    label: 'UMBRELLA PLACEMENT', frames: 10, fps: 11, loop: false,
    desc: 'The payoff. Dad hoists the umbrella overhead, plants the pole with a triumphant stomp, it blooms open — and he finally, finally relaxes.',
    pose(t) {
      const p = base();
      p.head.expr = 'determined';
      // Phases: 0-.18 present, .18-.4 raise overhead, .4-.52 STAB down (plant),
      //         .52-.7 bloom open, .7-1 relax back with hand on hip
      if (t < .52) {
        // holding/raising the umbrella with the umbrella arm (both hands feel)
        p.lean = seg(t, [[0, .18, .1, -.05], [.18, .4, -.05, -.12], [.4, .52, -.12, .12, E.in]]);
        p.bobY = seg(t, [[0, .4, 0, -2], [.4, .52, -2, 1, E.in]]);
        p.legF = { hip: .25, knee: .2 }; p.legB = { hip: -.28, knee: .45 };
        const raise = seg(t, [[0, .18, 2.0, 2.6, E.out], [.18, .4, 2.6, 3.05, E.out], [.4, .52, 3.05, 2.7, E.in]]);
        p.armUmb = { sh: raise, el: seg(t, [[.18, .4, -.4, 0]], t < .18 ? -.4 : 0) };
        p.armCooler = { sh: seg(t, [[.18, .4, -1.9, -2.7, E.out], [.4, .52, -2.7, -2.0]], -1.9), el: .3 };
        p.head.tilt = seg(t, [[.18, .4, 0, -.18], [.4, .52, -.18, .14]], 0);
        p.head.expr = t < .4 ? 'determined' : 'strain';
        const open = seg(t, [[.4, .52, 0, .15]], t < .4 ? 0 : .15);
        p.umbrella = { mode: 'raise', open, armAngle: raise };
        if (t > .46) p.fx = { plantPuff: (t - .46) / .06 };
      } else {
        // PLANTED beside dad; he steps back & relaxes
        const u = (t - .52) / .48;
        p.lean = seg(u, [[0, .35, .12, -.06, E.out], [.35, 1, -.06, .04]], 0);
        p.bobY = seg(u, [[0, .25, 1, -1, E.out], [.25, 1, -1, 0]]);
        // step back to the right of the planted umbrella
        p.legF = { hip: seg(u, [[0, .5, .25, .35, E.out]], .35), knee: .15 };
        p.legB = { hip: seg(u, [[0, .5, -.28, -.05]], -.05), knee: .12 };
        // hand on hip + wipe brow then settle / crack a cold soda
        p.armUmb = { sh: seg(u, [[0, .4, 2.7, 1.6, E.out]], 1.6), el: seg(u, [[0, .4, 0, 1.4]], 1.4) }; // hand to hip
        p.armCooler = {
          sh: seg(u, [[0, .35, -2.0, -2.4, E.out], [.35, .7, -2.4, -1.7, E.inOut]], -1.7),
          el: seg(u, [[0, .35, .3, -1.4, E.out], [.35, .7, -1.4, .5, E.inOut]], .5)
        };
        p.head.tilt = seg(u, [[0, .5, .1, -.04]], -.04);
        p.head.expr = u < .35 ? 'content' : 'joy';
        p.sweat = u > .2 && u < .55 ? { y: u * 4 } : null;
        p.sodaInHand = u > .62;
        const open = seg(u, [[0, .3, .15, 1, E.back]], 1);
        p.umbrella = { mode: 'plant', open, sway: Math.sin(u * 6) * (1 - u) * .06 };
        p.fx = { plantPuff: u < .2 ? 1 - u / .2 : 0, sparkle: u > .25 ? (u - .25) / .75 : -1, relax: u > .6 };
      }
      return p;
    },
  };

  /* ============================================================
     RENDER — draw resolved pose. Origin = feet at (0,0).
     ============================================================ */
  function render(ctx, animName, t, opts) {
    opts = opts || {};
    const A = ANIMS[animName]; if (!A) return;
    const p = A.pose(clamp(t, 0, 1));
    const build = BUILDS[opts.build || UD.dadBuild || 'classic'];
    p.build = build;
    const pal = P();

    ctx.save();
    ctx.translate(0, p.bobY);
    ctx.scale(p.sqx, p.sqy);

    // ground-level fx behind feet
    drawGroundFx(ctx, p, pal);

    // shadow
    ctx.save(); ctx.globalAlpha = .2; ctx.fillStyle = '#10204a';
    ctx.beginPath(); ctx.ellipse(2, 3, 24, 7, 0, 0, 7); ctx.fill(); ctx.restore();

    // back leg
    drawLeg(ctx, -HIP_X * .5, p.legB.hip, p.legB.knee, build);
    // cargo-shorts pelvis (world)
    drawShorts(ctx, build);

    // ===== upper body in hip-rotated space =====
    ctx.save();
    ctx.translate(0, HIP_Y); ctx.rotate(p.lean);

    // cooler arm behind torso (unless brought forward for throw)
    if (!p.coolerFront) drawCoolerArm(ctx, p, pal);

    // carried (closed) umbrella rests in the BACK layer, slung over the shoulder
    if (p.umbrella.mode === 'shoulder') {
      drawUmbrellaClosed(ctx, CARRY.bh.x, CARRY.bh.y, CARRY.ang, CARRY.len);
    }

    drawTorso(ctx, build.belly);

    // front leg drawn from hip in this space? no—legs are world. We exit, draw front leg, re-enter for head/arms.
    ctx.restore();
    // front leg (world)
    drawLeg(ctx, HIP_X * .5, p.legF.hip, p.legF.knee, build);
    // re-enter rotated space for head + front arms
    ctx.save();
    ctx.translate(0, HIP_Y); ctx.rotate(p.lean);

    // neck + head
    drawNeck(ctx);
    drawHead(ctx, p.head.x, p.head.y, p.head.tilt, p.head.expr, p.burn, p.sweat);

    // cooler arm in front (throw)
    if (p.coolerFront) drawCoolerArm(ctx, p, pal);

    // umbrella arm + umbrella
    drawUmbrellaArm(ctx, p, pal);

    ctx.restore();

    // planted umbrella lives in world space (beside dad)
    if (p.umbrella.mode === 'plant') {
      ctx.save(); ctx.translate(-30, 0); ctx.rotate(-.08 + (p.umbrella.sway || 0));
      drawUmbrellaOpen(ctx, 0, -78, 0, p.umbrella.open, 1.15);
      cap(ctx, 0, -78, 0, 2, 4.5, pal.umbrellaPole); // pole to ground
      ctx.restore();
    }

    // flying soda + air fx
    drawAirFx(ctx, p, pal);

    ctx.restore();
  }

  function drawCoolerArm(ctx, p, pal) {
    const hand = drawArm(ctx, p.armCooler.sh, p.armCooler.el, -1, p.burn);
    if (p.sodaInHand) drawSodaCan(ctx, hand.x, hand.y, p.armCooler.sh + p.armCooler.el);
    else if (p.coolerVisible) drawCooler(ctx, hand.x, hand.y + 4, (p.armCooler.sh + p.armCooler.el) * .2);
  }
  function drawUmbrellaArm(ctx, p, pal) {
    const m = p.umbrella.mode;
    if (m === 'shoulder') {
      // umbrella already drawn in back layer; just reach the hand up to grip it
      armIK(ctx, 4, SH_LY, CARRY.grip.x, CARRY.grip.y, UPPER, FORE, 1, p.burn);
      return;
    }
    const hand = drawArm(ctx, p.armUmb.sh, p.armUmb.el, 1, p.burn);
    if (m === 'fling') {
      // follows the flailing arm (slip)
      drawUmbrellaClosed(ctx, hand.x, hand.y, p.armUmb.sh + p.armUmb.el - Math.PI, 50);
    } else if (m === 'wave') {
      // panic: brandished overhead, clear of the face
      drawUmbrellaClosed(ctx, hand.x, hand.y, -2.85 + Math.sin((p.fx && p.fx.hopSide || 0)) * .12, 46);
    } else if (m === 'open') {
      // canopy blooms at the hand, oriented along arm
      drawUmbrellaOpen(ctx, hand.x, hand.y, (p.umbrella.armAngle || p.armUmb.sh) + Math.PI, p.umbrella.open, 1);
    } else if (m === 'raise') {
      // pole rises overhead from hand
      const ang = p.armUmb.sh - Math.PI;
      drawUmbrellaClosed(ctx, hand.x, hand.y, ang, 52);
      if (p.umbrella.open > .05) drawUmbrellaOpen(ctx, hand.x + Math.sin(ang) * 50, hand.y + Math.cos(ang) * 50, 0, p.umbrella.open, 1);
    }
    // (plant handled in world space)
  }

  function drawGroundFx(ctx, p, pal) {
    const f = p.fx || {};
    if (f.heat) {
      // shimmer lines + hot patch under feet
      ctx.save();
      ctx.fillStyle = UD.hexa(pal.hotSand, .5);
      ctx.beginPath(); ctx.ellipse(0, 2, 30, 8, 0, 0, 7); ctx.fill();
      ctx.strokeStyle = UD.hexa(pal.hotSandHot, .8); ctx.lineWidth = 2.4;
      for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(i * 13 + (f.hopSide || 0) * 4, -6); ctx.quadraticCurveTo(i * 13 + 4, -14, i * 13, -22); ctx.stroke(); }
      ctx.restore();
    }
    if (f.plantPuff > 0) {
      ctx.save(); ctx.globalAlpha = clamp(f.plantPuff, 0, 1) * .8; ctx.fillStyle = pal.sandLight;
      const r = (1 - f.plantPuff) * 22 + 6;
      for (let i = -1; i <= 1; i++) circle(ctx, -30 + i * r * .9, 0, r * .5, pal.sandLight);
      ctx.restore();
    }
    if (f.skid) {
      ctx.save(); ctx.strokeStyle = '#fff'; ctx.globalAlpha = .7; ctx.lineWidth = 3; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-30, 2); ctx.lineTo(34, 2); ctx.stroke(); ctx.restore();
    }
  }

  function drawAirFx(ctx, p, pal) {
    const f = p.fx || {};
    // motion lines
    if (f.motion === 'back' && f.motionAmt > .2) {
      ctx.save(); ctx.strokeStyle = UD.hexa('#fff', .5); ctx.lineWidth = 2.4; ctx.lineCap = 'round';
      for (let i = 0; i < 3; i++) { const yy = -30 - i * 16; ctx.beginPath(); ctx.moveTo(-26, yy); ctx.lineTo(-26 - 14 * f.motionAmt, yy); ctx.stroke(); }
      ctx.restore();
    }
    // swoosh arc for swing
    if (f.swoosh >= 0) {
      ctx.save(); ctx.globalAlpha = .55 * (1 - f.swoosh);
      const a0 = f.swooshFrom, a1 = lerp(f.swooshFrom, f.swooshTo, f.swoosh);
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 7; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.arc(0, HIP_Y + 8, 50, -a0 + Math.PI / 2, -a1 + Math.PI / 2, true); ctx.stroke();
      ctx.restore();
    }
    // flying soda + fizz trail
    if (f.soda) {
      const s = f.soda;
      ctx.save(); ctx.globalAlpha = .6; ctx.fillStyle = pal.neonB;
      for (let i = 1; i <= 4; i++) circle(ctx, s.x - i * 9, s.y + i * 1.5, 4 - i * .6, pal.neonB);
      ctx.restore();
      drawSodaCan(ctx, s.x, s.y, s.rot);
    }
    // exclaim bubbles
    if (f.exclaim) {
      ctx.save(); ctx.translate(20, -96);
      ctx.fillStyle = '#fff'; ctx.strokeStyle = OL; ctx.lineWidth = 2;
      UD.rr(ctx, -2, -14, 30, 18, 6); ctx.fill(); ctx.stroke();
      ctx.fillStyle = pal.neonA; ctx.font = '9px "Press Start 2P", monospace'; ctx.textAlign = 'center';
      ctx.fillText(f.exclaim, 13, -1); ctx.restore();
    }
    // sparkles for victory
    if (f.sparkle >= 0) {
      ctx.save();
      const n = 6;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + f.sparkle * 2;
        const rr = 40 + Math.sin(f.sparkle * 6 + i) * 10;
        const x = -30 + Math.cos(a) * rr, y = -86 + Math.sin(a) * rr * .7;
        ctx.globalAlpha = clamp(1 - f.sparkle, .2, 1) * (.5 + .5 * Math.sin(f.sparkle * 8 + i));
        sparkle(ctx, x, y, 4 + (i % 2) * 2, pal.neonC);
      }
      ctx.restore();
    }
  }
  function sparkle(ctx, x, y, r, col) {
    ctx.save(); ctx.translate(x, y); ctx.fillStyle = col;
    ctx.beginPath();
    for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); ctx.lineTo(Math.cos(a + Math.PI / 4) * r * .32, Math.sin(a + Math.PI / 4) * r * .32); }
    ctx.closePath(); ctx.fill(); ctx.restore();
  }

  UD.sprites = { ANIMS, render, order: ['jog', 'swing', 'throw', 'slip', 'hop', 'victory'] };
})(window.UD);
