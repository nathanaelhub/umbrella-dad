/* ============ UMBRELLA DAD · dad.js — the player ============ */
(function (UD) {
  'use strict';

  class Dad {
    constructor() { this.reset(); }
    reset() {
      this.x = UD.VW / 2; this.y = UD.START_Y;
      this.vx = 0; this.vy = 0; this.r = 15;
      this.fx = 0; this.fy = -1;          // facing (default toward ocean)
      this.state = 'idle'; this.stateT = 0;
      this.walk = 0; this.moving = false;
      this.stress = 0; this.soda = 6; this.score = 0;
      this.combo = 0; this.comboT = 0;
      this.swingT = 0; this.swingCd = 0; this.throwCd = 0;
      this.invuln = 0; this.squash = 1; this.scale = 1;
      this.onIce = false; this.onHot = false;
      this.dist = 0;
    }
    get stressN() { return this.stress / 100; }

    update(dt, input, g) {
      this.stateT += dt;
      if (this.swingCd > 0) this.swingCd -= dt;
      if (this.throwCd > 0) this.throwCd -= dt;
      if (this.invuln > 0) this.invuln -= dt;
      if (this.comboT > 0) { this.comboT -= dt; if (this.comboT <= 0) this.combo = 0; }
      this.squash = UD.approach(this.squash, 1, dt * 4);

      // ---- input dir ----
      let ix = (input.right ? 1 : 0) - (input.left ? 1 : 0);
      let iy = (input.down ? 1 : 0) - (input.up ? 1 : 0);
      const mag = Math.hypot(ix, iy);
      if (mag > 0) { ix /= mag; iy /= mag; this.fx = ix; this.fy = iy; this.moving = true; }
      else this.moving = false;

      const base = 168;
      // ---- state-specific movement ----
      if (this.state === 'victory') { this.moving = false; this.walk += dt * 4; this._clamp(); return; }

      if (this.onHot && this.state !== 'swing') {
        // PANIC on hot sand — fast, jittery, hard to control + stress tick
        this.state = 'hop';
        const jx = ix + UD.rand(-.6, .6), jy = iy - UD.rand(.1, .8); // tends to hop forward
        const m = Math.hypot(jx, jy) || 1;
        const sp = base * 1.35;
        this.vx = UD.lerp(this.vx, (jx / m) * sp, .35);
        this.vy = UD.lerp(this.vy, (jy / m) * sp, .35);
        this.stress = Math.min(100, this.stress + 16 * dt);
        if (Math.random() < dt * 6) { UD.fx.sandPuff(this.x, this.y + 8, 3); UD.audio.play('panic'); }
        this.moving = true;
        this._slipSnd = false;
      } else if (this.onIce && this.state !== 'swing') {
        // SLIP — low friction slide, weak steering
        this.state = 'slip';
        if (!this._slipSnd) { UD.audio.play('slip'); this._slipSnd = true; }
        this.vx = UD.lerp(this.vx, ix * base * 1.1, .03);
        this.vy = UD.lerp(this.vy, iy * base * 1.1, .03);
      } else if (this.state === 'swing') {
        // rooted-ish during swing
        this.swingT += dt / 0.34;
        this.vx *= .8; this.vy *= .8;
        if (this.swingT >= 1) { this.state = 'idle'; this.swingT = 0; }
      } else {
        // normal jog
        const accel = mag > 0 ? 12 : 9;
        this.vx = UD.lerp(this.vx, ix * base, dt * accel);
        this.vy = UD.lerp(this.vy, iy * base, dt * accel);
        this.state = this.moving ? 'jog' : 'idle';
        if (this.state === 'hop' || this.state === 'slip') this.state = 'idle';
        this._slipSnd = false;
      }

      // hurt overrides visuals briefly but keeps momentum
      if (this.invuln > 0.45) this.state = 'hurt';

      this.x += this.vx * dt; this.y += this.vy * dt;
      this._clamp();

      // walk cycle
      const spd = Math.hypot(this.vx, this.vy);
      this.walk += dt * (6 + spd * 0.035);
      this.moving = spd > 12;

      // progress / distance
      this.dist = UD.clamp((UD.START_Y - this.y) / (UD.START_Y - UD.GOAL_Y), 0, 1);

      // ---- actions ----
      if ((input.swing) && this.swingCd <= 0 && this.state !== 'swing') {
        this.state = 'swing'; this.swingT = 0; this.swingCd = 0.45; this.stateT = 0;
        g.umbrellaHit();
      }
      if (input.throw && this.throwCd <= 0 && this.soda > 0) {
        this.throwCd = 0.4; this.soda--; this.squash = 0.8;
        g.throwSoda(this.x, this.y - 30, this.fx, this.fy);
        UD.hud.updateSoda();
      }
    }

    _clamp() {
      this.x = UD.clamp(this.x, UD.MARGIN + this.r, UD.VW - UD.MARGIN - this.r);
      this.y = UD.clamp(this.y, UD.GOAL_Y - 10, UD.START_Y + 30);
    }

    knockback(dx, dy, force, stress) {
      if (this.invuln > 0) return false;
      const m = Math.hypot(dx, dy) || 1;
      this.vx += (dx / m) * force; this.vy += (dy / m) * force;
      this.stress = Math.min(100, this.stress + (stress || 0));
      this.invuln = 0.7; this.squash = 1.3;
      this.combo = 0;
      return true;
    }
    addScore(n) {
      this.combo++; this.comboT = 1.6;
      const mult = this.combo >= 3 ? this.combo : 1;
      this.score += n * mult;
      return mult;
    }
    refillSoda(n) { this.soda = Math.min(6, this.soda + n); UD.hud.updateSoda(); }

    draw(ctx, camY) {
      const d = { x: this.x, y: this.y - camY, walk: this.walk, moving: this.moving,
        state: this.state, swingT: this.swingT, stressN: this.stressN,
        squash: this.squash, scale: this.scale };
      // blink during invuln
      if (this.invuln > 0 && Math.floor(this.invuln * 20) % 2 === 0) ctx.globalAlpha = 0.45;
      UD.art.dad(ctx, d);
      ctx.globalAlpha = 1;
    }
  }

  UD.Dad = Dad;
})(window.UD);
