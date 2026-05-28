/* ============ UMBRELLA DAD · fx.js — particles + popups ============ */
(function (UD) {
  'use strict';
  const parts = [];
  const fx = { parts };

  function add(p) { parts.push(p); }

  fx.fizz = function (x, y, n, color) {
    color = color || '#fff';
    for (let i = 0; i < n; i++) {
      const a = UD.rand(0, Math.PI * 2), s = UD.rand(1.2, 4.5);
      add({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 1.5, life: 1, max: UD.rand(.4, .9),
            r: UD.rand(2, 5), color: i % 3 ? color : '#fff', g: .12, type: 'dot' });
    }
  };
  fx.sandPuff = function (x, y, n) {
    for (let i = 0; i < (n || 6); i++) {
      const a = UD.rand(-Math.PI, 0), s = UD.rand(.8, 2.6);
      add({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 1, max: UD.rand(.3, .6),
            r: UD.rand(3, 7), color: UD.PAL.sandLight, g: .05, type: 'dot' });
    }
  };
  fx.stars = function (x, y, n, color) {
    for (let i = 0; i < (n || 5); i++) {
      const a = UD.rand(0, Math.PI * 2), s = UD.rand(2, 5);
      add({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 1, life: 1, max: .5,
            r: UD.rand(4, 8), color: color || '#ffe14d', g: .15, type: 'star', rot: UD.rand(0, 6) });
    }
  };
  fx.confetti = function (x, y, n) {
    const cols = ['#ff4d6d', '#ffd23f', '#36c5f0', '#7d5fff', '#2ec4a6', '#fff'];
    for (let i = 0; i < (n || 30); i++) {
      add({ x, y, vx: UD.rand(-5, 5), vy: UD.rand(-9, -2), life: 1, max: UD.rand(1, 2),
            r: UD.rand(3, 7), color: UD.pick(cols), g: .22, type: 'confetti', rot: UD.rand(0, 6), vr: UD.rand(-.3, .3) });
    }
  };
  fx.ring = function (x, y, color) {
    add({ x, y, life: 1, max: .4, r: 6, color: color || '#fff', type: 'ring' });
  };

  fx.update = function (dt) {
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.life -= dt / p.max;
      if (p.life <= 0) { parts.splice(i, 1); continue; }
      if (p.type !== 'ring') {
        p.x += p.vx; p.y += p.vy;
        if (p.g) p.vy += p.g * dt * 60;
        p.vx *= .98;
        if (p.vr) p.rot += p.vr;
      }
    }
  };

  fx.draw = function (ctx, camY) {
    for (const p of parts) {
      const sy = p.y - camY;
      if (sy < -40 || sy > UD.VH + 40) continue;
      ctx.save(); ctx.translate(p.x, sy); ctx.globalAlpha = Math.max(0, Math.min(1, p.life));
      if (p.type === 'dot') {
        ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(0, 0, p.r * p.life, 0, 7); ctx.fill();
      } else if (p.type === 'star') {
        ctx.rotate(p.rot); ctx.fillStyle = p.color; star(ctx, p.r * p.life);
      } else if (p.type === 'confetti') {
        ctx.rotate(p.rot); ctx.fillStyle = p.color; ctx.fillRect(-p.r / 2, -p.r / 2, p.r, p.r * .6);
      } else if (p.type === 'ring') {
        ctx.strokeStyle = p.color; ctx.lineWidth = 4 * p.life;
        ctx.beginPath(); ctx.arc(0, 0, (1 - p.life) * 40 + 6, 0, 7); ctx.stroke();
      }
      ctx.restore();
    }
  };

  function star(ctx, r) {
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + i * Math.PI * 2 / 5;
      ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      const a2 = a + Math.PI / 5;
      ctx.lineTo(Math.cos(a2) * r * .45, Math.sin(a2) * r * .45);
    }
    ctx.closePath(); ctx.fill();
  }

  fx.clear = function () { parts.length = 0; };

  /* ---- DOM floating popups (combo / score / events) ---- */
  const layer = () => document.getElementById('popups');
  fx.popup = function (x, screenY, text, color) {
    const el = document.createElement('div');
    el.className = 'pop'; el.textContent = text;
    el.style.left = x + 'px'; el.style.top = screenY + 'px';
    el.style.color = color || 'var(--neon-c)';
    layer().appendChild(el);
    setTimeout(() => el.remove(), 1050);
  };

  UD.fx = fx;
})(window.UD);
