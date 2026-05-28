/* ============ UMBRELLA DAD · util.js ============ */
/* shared namespace + math/collision/color helpers */
window.UD = window.UD || {};

(function (UD) {
  'use strict';

  // virtual design resolution (everything authored here, scaled to fit)
  UD.VW = 960;
  UD.VH = 540;
  UD.LEVEL_H = 5600;        // tall vertical course (~10 screens)
  UD.GOAL_Y = 120;          // ocean / perfect spot near the top
  UD.START_Y = UD.LEVEL_H - 150;
  UD.MARGIN = 70;           // playable side margins (dunes outside)

  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const lerp = (a, b, t) => a + (b - a) * t;
  const rand = (a, b) => a + Math.random() * (b - a);
  const randInt = (a, b) => Math.floor(rand(a, b + 1));
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  const dist2 = (ax, ay, bx, by) => { const dx = ax - bx, dy = ay - by; return dx * dx + dy * dy; };
  const approach = (v, target, step) => v < target ? Math.min(v + step, target) : Math.max(v - step, target);

  // seeded rng for deterministic level layout
  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  // circle/circle overlap
  function hitCircle(a, b, pad = 0) {
    const r = (a.r + b.r + pad);
    return dist2(a.x, a.y, b.x, b.y) < r * r;
  }

  // point in rect
  function inRect(px, py, x, y, w, h) {
    return px >= x && px <= x + w && py >= y && py <= y + h;
  }

  // rounded rect path helper
  function rr(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  // quick hex -> rgba string with alpha
  function hexa(hex, a) {
    const h = hex.replace('#', '');
    const n = parseInt(h.length === 3 ? h.replace(/./g, c => c + c) : h, 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
  }

  // shade a hex toward black(neg) or white(pos), amt -1..1
  function shade(hex, amt) {
    const h = hex.replace('#', '');
    const n = parseInt(h.length === 3 ? h.replace(/./g, c => c + c) : h, 16);
    let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    const t = amt < 0 ? 0 : 255, p = Math.abs(amt);
    r = Math.round(lerp(r, t, p)); g = Math.round(lerp(g, t, p)); b = Math.round(lerp(b, t, p));
    return `rgb(${r},${g},${b})`;
  }

  Object.assign(UD, {
    clamp, lerp, rand, randInt, pick, dist2, approach,
    mulberry32, hitCircle, inRect, rr, hexa, shade,
  });
})(window.UD);
