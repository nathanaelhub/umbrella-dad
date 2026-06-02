/* ============ UMBRELLA DAD · game.js — engine & wiring ============ */
(function (UD) {
  'use strict';

  const Game = {
    state: 'menu',
    enemies: [], projectiles: [],
    camY: 0, shakeAmt: 0, time: 0,
    input: { left: 0, right: 0, up: 0, down: 0, swing: false, throw: false,
             throwAiming: false, throwRelease: false, aimFx: 0, aimFy: -1,
             mouseX: 480, mouseY: 270 },

    init() {
      this.canvas = document.getElementById('game');
      this.ctx = this.canvas.getContext('2d');
      this.ctx.setTransform(2, 0, 0, 2, 0, 0);   // 1920x1080 backing → 960x540 design
      this.ctx.imageSmoothingEnabled = true;
      this.menuCanvas = document.getElementById('menuArt');
      this.mctx = this.menuCanvas.getContext('2d');
      this.mctx.setTransform(2, 0, 0, 2, 0, 0);

      this.dad = new UD.Dad();
      this.level = new UD.Level();
      UD.hud.init(this);

      UD.onTweaksApplied = () => { if (this.state === 'menu') this._dirtyMenu = true; };

      this._bindInput();
      this._bindButtons();
      this.fit();
      window.addEventListener('resize', () => this.fit());

      document.getElementById('boot').classList.add('gone');
      this.last = performance.now();
      requestAnimationFrame(t => this.loop(t));
    },

    fit() {
      const s = Math.min(window.innerWidth / UD.VW, window.innerHeight / UD.VH);
      const f = document.getElementById('frame');
      f.style.transform = `scale(${s})`;
    },

    /* ---------------- input ---------------- */
    _bindInput() {
      const map = {
        ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right',
        ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down',
      };
      addEventListener('keydown', e => {
        UD.audio.unlock();   // browsers require a gesture before audio plays
        if (map[e.code]) { this.input[map[e.code]] = 1; e.preventDefault(); }
        if (e.repeat) return;
        if (e.code === 'KeyJ' || e.code === 'Space') { this.input.swing = true; e.preventDefault(); }
        if (e.code === 'KeyK') { this.input.throwAiming = true; e.preventDefault(); }
        if (e.code === 'KeyP' || e.code === 'Escape') this.togglePause();
        if (e.code === 'KeyM') UD.audio.toggleMute();
        if (e.code === 'Enter') this._enter();
      });
      addEventListener('keyup', e => {
        if (map[e.code]) this.input[map[e.code]] = 0;
        if (e.code === 'KeyK' && this.input.throwAiming) {
          this.input.throwAiming = false;
          this.input.throwRelease = true;
        }
      });
      addEventListener('blur', () => { for (const k in this.input) this.input[k] = (typeof this.input[k] === 'number') ? 0 : false; });
      addEventListener('mousemove', e => {
        const rect = this.canvas.getBoundingClientRect();
        this.input.mouseX = (e.clientX - rect.left) * (UD.VW / rect.width);
        this.input.mouseY = (e.clientY - rect.top)  * (UD.VH / rect.height);
      });
    },
    _enter() {
      if (this.state === 'menu' || this.state === 'howto') this.startGame();
      else if (this.state === 'win') this.setState('menu');
      else if (this.state === 'lose') this.startGame();
      else if (this.state === 'paused') this.togglePause();
    },
    _bindButtons() {
      document.querySelectorAll('[data-act]').forEach(el => {
        el.addEventListener('click', () => {
          UD.audio.unlock(); UD.audio.play('ui');
          const a = el.dataset.act;
          if (a === 'play') this.startGame();
          else if (a === 'menu') this.setState('menu');
          else if (a === 'threats') this.setState('threats');
          else if (a === 'map') this.setState('map');
          else if (a === 'howto') this.setState('howto');
          else if (a === 'resume') this.togglePause();
        });
      });
    },

    /* ---------------- state ---------------- */
    setState(s) {
      this.state = s;
      const map = { menu: 'scrMenu', threats: 'scrThreats', map: 'scrMap', howto: 'scrHow', win: 'scrWin', lose: 'scrLose', paused: 'scrPause' };
      document.querySelectorAll('.screen').forEach(el => el.classList.remove('show'));
      if (map[s]) document.getElementById(map[s]).classList.add('show');
      document.getElementById('hud').classList.toggle('hidden', !(s === 'playing' || s === 'paused'));
      if (s === 'menu') { this._dirtyMenu = true; UD.audio.stopAmbience(); }
      if (s === 'win') { UD.hud.showWin(); UD.audio.stopAmbience(); UD.audio.play('win'); }
      if (s === 'lose') { UD.hud.showLose(); UD.audio.stopAmbience(); UD.audio.play('lose'); }
    },

    startGame() {
      this.dad.reset();
      this.enemies.length = 0; this.projectiles.length = 0;
      UD.fx.clear();
      this.level.build(this);
      this.time = 0; this.camY = this._targetCam();
      UD.hud.refreshAll();
      this.setState('playing');
      UD.audio.startAmbience();
    },

    togglePause() {
      if (this.state === 'playing') this.setState('paused');
      else if (this.state === 'paused') { this.state = 'playing'; document.querySelectorAll('.screen').forEach(el => el.classList.remove('show')); document.getElementById('hud').classList.remove('hidden'); }
    },

    addEnemy(e) { this.enemies.push(e); },
    shake(a) { this.shakeAmt = Math.min(16, this.shakeAmt + a); },

    /* ---------------- combat ---------------- */
    umbrellaHit() {
      const d = this.dad, reach = 78, ang0 = Math.atan2(d.fy, d.fx);
      this.shake(4); UD.audio.play('swing');
      for (const e of this.enemies) {
        if (!e.alive || e.stun > 0.6) continue;
        const dx = e.x - d.x, dy = e.y - d.y, dd = Math.hypot(dx, dy);
        if (dd > reach + e.r) continue;
        let da = Math.atan2(dy, dx) - ang0;
        while (da > Math.PI) da -= Math.PI * 2; while (da < -Math.PI) da += Math.PI * 2;
        if (Math.abs(da) < 1.25) e.hit(dx, dy, this, 320);
      }
    },
    throwSoda(x, y, fx, fy) {
      const m = Math.hypot(fx, fy) || 1;
      this.projectiles.push({ x, y, vx: (fx / m) * 460, vy: (fy / m) * 460, spin: 0, r: 7, life: 1.4 });
      this.shake(2); UD.audio.play('fizz');
    },

    reachGoal() {
      if (this.state !== 'playing' || this.dad.state === 'victory') return;
      this.dad.state = 'victory'; this.dad.vx = this.dad.vy = 0;
      UD.fx.confetti(this.dad.x, this.dad.y - this.camY, 40);
      UD.fx.confetti(this.level.goal.x, this.level.goal.y - this.camY, 24);
      this.shake(8);
      setTimeout(() => { if (this.state === 'playing') this.setState('win'); }, 1400);
    },

    _targetCam() { return UD.clamp(this.dad.y - UD.VH * 0.6, 0, UD.LEVEL_H - UD.VH); },

    /* ---------------- update ---------------- */
    update(dt) {
      this.time += dt;
      const d = this.dad;
      // Recompute aim direction from mouse each frame while aiming or releasing
      if (this.input.throwAiming || this.input.throwRelease) {
        const adx = this.input.mouseX - d.x;
        const ady = this.input.mouseY - (d.y - this.camY);
        const am = Math.hypot(adx, ady) || 1;
        this.input.aimFx = adx / am;
        this.input.aimFy = ady / am;
      }
      d.update(dt, this.input, this);
      this.level.update(dt, d, this);

      // enemies
      const drillX = this.level.drillX();
      for (const e of this.enemies) {
        if (!e.alive) continue;
        if (e.type === 'football') e.update(dt, d, this, drillX);
        else e.update(dt, d, this);
      }
      for (let i = this.enemies.length - 1; i >= 0; i--) if (!this.enemies[i].alive) this.enemies.splice(i, 1);

      // projectiles
      for (let i = this.projectiles.length - 1; i >= 0; i--) {
        const p = this.projectiles[i];
        p.x += p.vx * dt; p.y += p.vy * dt; p.spin += dt * 14; p.life -= dt;
        UD.fx.fizz(p.x, p.y, 1, UD.PAL.neonB);
        let dead = p.life <= 0 || p.x < UD.MARGIN || p.x > UD.VW - UD.MARGIN;
        if (!dead) for (const e of this.enemies) {
          if (e.alive && UD.dist2(p.x, p.y, e.x, e.y) < (p.r + e.r) ** 2) {
            e.hit(p.vx, p.vy, this, 360);
            UD.fx.fizz(p.x, p.y, 16, UD.PAL.neonB); dead = true; break;
          }
        }
        if (dead) this.projectiles.splice(i, 1);
      }

      UD.fx.update(dt);

      // camera (smooth + clamp), shake decay
      this.camY = UD.lerp(this.camY, this._targetCam(), Math.min(1, dt * 6));
      this.shakeAmt *= 0.86;

      // hud
      UD.hud.updateScore(); UD.hud.updateStress(); UD.hud.updateDist();

      // lose
      if (d.stress >= 100 && this.state === 'playing') this.setState('lose');
    },

    /* ---------------- render ---------------- */
    render() {
      const ctx = this.ctx, camY = this.camY;
      ctx.save();
      const sx = (Math.random() - .5) * this.shakeAmt, sy = (Math.random() - .5) * this.shakeAmt;
      ctx.translate(sx, sy);

      this.level.drawFlat(ctx, camY);

      // depth-sorted: tall decor + enemies + dad
      const list = this.level.tallSprites();
      for (const e of this.enemies) list.push({ y: e.y, draw: (c, cy) => e.draw(c, cy) });
      list.push({ y: this.dad.y, draw: (c, cy) => this.dad.draw(c, cy) });
      list.sort((a, b) => a.y - b.y);
      for (const it of list) it.draw(ctx, camY);

      // projectiles
      for (const p of this.projectiles) UD.art.soda(ctx, { x: p.x, y: p.y - camY, spin: p.spin });

      UD.fx.draw(ctx, camY);

      // Aim arrow — shown while K is held and soda remains
      if (this.input.throwAiming && this.dad.soda > 0) {
        const d = this.dad;
        const ox = d.x, oy = d.y - camY;
        const ang = Math.atan2(this.input.aimFy, this.input.aimFx);
        const len = 72, headLen = 16, headAng = 0.42;
        const tx = ox + Math.cos(ang) * len, ty = oy + Math.sin(ang) * len;

        ctx.save();
        ctx.globalAlpha = 0.28;
        ctx.shadowColor = 'rgba(255,255,255,0.3)';
        ctx.shadowBlur = 6;
        ctx.strokeStyle = '#f0ede8';
        ctx.fillStyle   = '#f0ede8';
        ctx.lineWidth   = 3;
        ctx.lineCap     = 'round';

        // shaft
        ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(tx, ty); ctx.stroke();

        // arrowhead
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.lineTo(tx - Math.cos(ang - headAng) * headLen, ty - Math.sin(ang - headAng) * headLen);
        ctx.lineTo(tx - Math.cos(ang + headAng) * headLen, ty - Math.sin(ang + headAng) * headLen);
        ctx.closePath(); ctx.fill();

        ctx.restore();
      }

      ctx.restore();
    },

    /* ---------------- menu key art ---------------- */
    drawMenuArt(t) {
      const ctx = this.mctx, P = UD.PAL, W = UD.VW, H = UD.VH;
      ctx.clearRect(0, 0, W, H);
      const bob = Math.sin(t * 1.6) * 4;
      const HX = W * 0.71;   // hero anchor x (right third)

      // palm silhouettes
      ctx.save(); ctx.globalAlpha = .9; ctx.fillStyle = 'rgba(20,8,40,.85)';
      ctx.strokeStyle = 'rgba(20,8,40,.85)';
      [[60, H + 30], [W - 50, H + 40]].forEach(([px, py]) => {
        ctx.save(); ctx.translate(px, py); ctx.lineCap = 'round';
        ctx.lineWidth = 14; ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(20, -120, -10, -230); ctx.stroke();
        for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2 + .3; ctx.lineWidth = 16; ctx.beginPath(); ctx.moveTo(-10, -230); ctx.quadraticCurveTo(Math.cos(a) * 60, -240 + Math.sin(a) * 30, Math.cos(a) * 100, -220 + Math.sin(a) * 54); ctx.stroke(); }
        ctx.restore();
      });
      ctx.restore();

      // big decorative open umbrella behind hero
      ctx.save(); ctx.translate(HX + 70, H - 150 + bob * .5); ctx.scale(2.6, 2.6);
      UD.art.umbrellaDecor(ctx, { x: 0, y: 0, c: 0 }); ctx.restore();

      // swooping gulls
      ctx.save();
      UD.art.gull(ctx, { x: HX - 120 + Math.sin(t) * 26, y: 110 + Math.sin(t * 1.3) * 14, walk: t * 6, diving: false, carrying: true, stun: 0 });
      UD.art.gull(ctx, { x: HX + 150 + Math.cos(t * .8) * 26, y: 80 + Math.cos(t) * 12, walk: t * 6 + 2, diving: true, carrying: false, stun: 0 });
      ctx.restore();

      // arcing soda toward hero
      const sa = (t % 2) / 2;
      ctx.save(); UD.art.soda(ctx, { x: HX - 180 + sa * 120, y: 300 - Math.sin(sa * Math.PI) * 90, spin: t * 10 }); ctx.restore();

      // hero dad — big, neon-rimmed, on the right
      ctx.save(); ctx.translate(HX, H - 54 + bob); ctx.scale(2.85, 2.85);
      ctx.shadowColor = P.neonA; ctx.shadowBlur = 22;
      UD.art.dad(ctx, { x: 0, y: 0, walk: t * 2, moving: false, state: 'idle', swingT: 0, stressN: 0, squash: 1, scale: 1 });
      ctx.restore();
    },

    /* ---------------- loop ---------------- */
    loop(now) {
      let dt = (now - this.last) / 1000; this.last = now;
      if (dt > 0.05) dt = 0.05;

      if (this.state === 'playing') {
        this.update(dt);
        this.render();
        // clear edge-triggers
        this.input.swing = false; this.input.throw = false; this.input.throwRelease = false;
      } else if (this.state === 'paused') {
        this.render();
      } else if (this.state === 'menu') {
        this._menuT = (this._menuT || 0) + dt;
        this.drawMenuArt(this._menuT);
      }
      requestAnimationFrame(t => this.loop(t));
    },
  };

  window.addEventListener('DOMContentLoaded', () => {
    // wait for fonts so canvas text (numbers) renders correctly
    const start = () => { UD.applyTweaks(window.__UD_TWEAKS || {}); Game.init(); UD.GAME = Game; };
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(start).catch(start);
    else start();
  });

  UD.Game = Game;
})(window.UD);
