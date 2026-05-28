/* ============ UMBRELLA DAD · enemies.js ============ */
(function (UD) {
  'use strict';

  class Enemy {
    constructor(x, y, type) {
      this.x = x; this.y = y; this.type = type;
      this.walk = Math.random() * 6; this.stun = 0; this.alive = true;
      this.kvx = 0; this.kvy = 0; this.r = 14; this.hp = 1;
      this.contactCd = 0;
    }
    applyKnock(dt) {
      this.x += this.kvx * dt; this.y += this.kvy * dt;
      this.kvx *= 0.86; this.kvy *= 0.86;
    }
    // hit by umbrella / soda
    hit(dirx, diry, g, power) {
      if (this.stun > 0.4 && this.type !== 'crab') { /* re-hit refresh ok */ }
      const m = Math.hypot(dirx, diry) || 1;
      const f = power || 280;
      this.kvx = (dirx / m) * f; this.kvy = (diry / m) * f - 40;
      this.stun = this.type === 'football' || this.type === 'coach' ? 0.6 : 1.2;
      UD.fx.stars(this.x, this.y - 10, 6, UD.PAL.neonC);
      UD.fx.ring(this.x, this.y - 10, '#fff');
      UD.audio.play(this.type === 'gull' ? 'gull' : 'hit');
      const mult = g.dad.addScore(this.scoreVal || 80);
      g.shake(6);
      const sy = this.y - g.camY - 24;
      UD.fx.popup(this.x, sy, (mult > 1 ? 'x' + mult + ' ' : '+') + (this.scoreVal || 80) * mult,
        mult > 1 ? UD.PAL.neonA : UD.PAL.neonC);
      this.hp--;
      if (this.hp <= 0 && this.killable) { this.alive = false; UD.fx.sandPuff(this.x, this.y, 8); }
      UD.hud.updateScore();
    }
    contact(dad, g, dx, dy, force, stress) {
      if (this.contactCd > 0) return;
      if (dad.knockback(dx, dy, force, stress)) {
        this.contactCd = 0.8; g.shake(8);
        const sy = dad.y - g.camY - 40;
        UD.fx.popup(dad.x, sy, '!', UD.PAL.neonA);
        UD.hud.flashStress();
      }
    }
  }

  /* ---- KID: chaotic wanderer ---- */
  class Kid extends Enemy {
    constructor(x, y, band) {
      super(x, y, 'kid'); this.r = 13; this.killable = true; this.scoreVal = 100;
      this.tint = UD.randInt(0, 2); this.band = band; this.retarget = 0;
      this.tx = x; this.ty = y; this.spd = UD.rand(70, 115);
    }
    update(dt, dad, g) {
      this.walk += dt * (this.stun > 0 ? 2 : 11);
      if (this.contactCd > 0) this.contactCd -= dt;
      if (this.stun > 0) { this.stun -= dt; this.applyKnock(dt); this._bound(); return; }
      this.retarget -= dt;
      if (this.retarget <= 0) {
        this.retarget = UD.rand(0.45, 1.1);
        this.tx = UD.rand(UD.MARGIN + 20, UD.VW - UD.MARGIN - 20);
        this.ty = UD.clamp(this.y + UD.rand(-120, 120), this.band[0], this.band[1]);
      }
      const dx = this.tx - this.x, dy = this.ty - this.y, m = Math.hypot(dx, dy) || 1;
      this.x += (dx / m) * this.spd * dt; this.y += (dy / m) * this.spd * dt;
      this._bound();
      // contact w/ dad
      if (UD.dist2(this.x, this.y, dad.x, dad.y) < (this.r + dad.r) ** 2)
        this.contact(dad, g, dad.x - this.x, dad.y - this.y, 210, 9);
    }
    _bound() {
      this.x = UD.clamp(this.x, UD.MARGIN + 10, UD.VW - UD.MARGIN - 10);
      this.y = UD.clamp(this.y, this.band[0] - 30, this.band[1] + 30);
    }
    draw(ctx, camY) { UD.art.kid(ctx, { x: this.x, y: this.y - camY, walk: this.walk, stun: this.stun, tint: this.tint }); }
  }

  /* ---- CRAB: side-scuttle pincher ---- */
  class Crab extends Enemy {
    constructor(x, y) { super(x, y, 'crab'); this.r = 12; this.killable = true; this.scoreVal = 60;
      this.dir = Math.random() < .5 ? -1 : 1; this.spd = UD.rand(40, 75); this.baseY = y; this.pinch = false; this.pinchT = 0; }
    update(dt, dad, g) {
      this.walk += dt * 8;
      if (this.contactCd > 0) this.contactCd -= dt;
      if (this.stun > 0) { this.stun -= dt; this.applyKnock(dt); return; }
      this.x += this.dir * this.spd * dt;
      this.y = this.baseY + Math.sin(this.walk * .5) * 14;
      if (this.x < UD.MARGIN + 10 || this.x > UD.VW - UD.MARGIN - 10) this.dir *= -1;
      // lunge slightly toward dad if near
      if (Math.abs(this.y - dad.y) < 60) this.dir = Math.sign(dad.x - this.x) || this.dir;
      const near = UD.dist2(this.x, this.y, dad.x, dad.y) < (this.r + dad.r + 4) ** 2;
      this.pinch = near; if (near) this.pinchT += dt; else this.pinchT = 0;
      if (near) this.contact(dad, g, dad.x - this.x, dad.y - this.y, 120, 5);
    }
    draw(ctx, camY) { UD.art.crab(ctx, { x: this.x, y: this.y - camY, walk: this.walk, pinch: this.pinch, pinchT: this.pinchT }); }
  }

  /* ---- SEAGULL: dive-bomb soda thief ---- */
  class Gull extends Enemy {
    constructor(x, y) { super(x, y, 'gull'); this.r = 13; this.killable = true; this.scoreVal = 120;
      this.mode = 'approach'; this.diving = true; this.carrying = false; this.cool = UD.rand(0, 1); this.hover = y; }
    update(dt, dad, g) {
      this.walk += dt * 14;
      if (this.contactCd > 0) this.contactCd -= dt;
      if (this.stun > 0) { this.stun -= dt; this.diving = false; this.applyKnock(dt); return; }
      if (this.mode === 'flee') {
        this.x += this.kvx0 * dt; this.y -= 120 * dt; this.diving = true;
        if (this.y < g.camY - 60) this.alive = false; return;
      }
      // hover above dad, then dive
      this.cool -= dt;
      const tx = dad.x, ty = dad.y - 130;
      this.x = UD.lerp(this.x, tx, dt * 1.6);
      if (this.cool > 0) { this.y = UD.lerp(this.y, ty, dt * 2); this.diving = false; }
      else {
        this.diving = true;
        this.y = UD.lerp(this.y, dad.y - 4, dt * 6);
        if (UD.dist2(this.x, this.y, dad.x, dad.y) < (this.r + dad.r) ** 2) {
          // steal a soda if available
          if (dad.soda > 0 && this.contactCd <= 0) {
            dad.soda--; this.carrying = true; UD.hud.updateSoda();
            UD.fx.popup(dad.x, dad.y - g.camY - 40, 'SODA STOLEN!', UD.PAL.neonA);
            g.shake(7); UD.audio.play('steal');
          } else if (this.contactCd <= 0) {
            this.contact(dad, g, dad.x - this.x, dad.y - this.y, 150, 6);
          }
          this.mode = 'flee'; this.kvx0 = UD.rand(-80, 80);
        }
        if (this.y > dad.y + 40) { this.cool = UD.rand(.8, 1.6); } // missed, climb again
      }
    }
    draw(ctx, camY) { UD.art.gull(ctx, { x: this.x, y: this.y - camY, walk: this.walk, diving: this.diving, carrying: this.carrying, stun: this.stun }); }
  }

  /* ---- BEACH BALL: bouncing drifter ---- */
  class BeachBall extends Enemy {
    constructor(x, y) { super(x, y, 'ball'); this.r = 18; this.killable = false; this.scoreVal = 70;
      this.vx = UD.rand(-90, 90) || 60; this.vy = UD.rand(-30, 30); this.bounce = 0; this.bph = Math.random() * 6; this.spin = 0; }
    update(dt, dad, g) {
      this.bph += dt * 4; this.bounce = Math.abs(Math.sin(this.bph)) * 16;
      this.spin += this.vx * dt * 0.01;
      if (this.stun > 0) { this.stun -= dt; this.applyKnock(dt); }
      else { this.x += this.vx * dt; this.y += this.vy * dt; }
      this.x += this.kvx * dt; this.kvx *= .9;
      if (this.x < UD.MARGIN + this.r || this.x > UD.VW - UD.MARGIN - this.r) { this.vx *= -1; this.x = UD.clamp(this.x, UD.MARGIN + this.r, UD.VW - UD.MARGIN - this.r); }
      if (this.contactCd > 0) this.contactCd -= dt;
      if (UD.dist2(this.x, this.y - this.bounce, dad.x, dad.y) < (this.r + dad.r) ** 2)
        this.contact(dad, g, dad.x - this.x, dad.y - this.y, 230, 7);
    }
    draw(ctx, camY) { UD.art.beachball(ctx, { x: this.x, y: this.y - camY, r: this.r, bounce: this.bounce, spin: this.spin }); }
  }

  /* ---- FOOTBALLER: part of a moving wall ---- */
  class Footballer extends Enemy {
    constructor(x, y, num) { super(x, y, 'football'); this.r = 16; this.killable = false; this.scoreVal = 90;
      this.num = num; this.baseX = x; this.baseY = y; this.phase = Math.random() * 6; }
    update(dt, dad, g, drillX) {
      this.walk += dt * 7;
      if (this.contactCd > 0) this.contactCd -= dt;
      if (this.stun > 0) { this.stun -= dt; this.applyKnock(dt); }
      else this.x = this.baseX + drillX;
      if (UD.dist2(this.x, this.y, dad.x, dad.y) < (this.r + dad.r) ** 2)
        this.contact(dad, g, dad.x - this.x, (dad.y - this.y) * .3 - 1, 300, 11);
    }
    draw(ctx, camY) { UD.art.footballer(ctx, { x: this.x, y: this.y - camY, walk: this.walk, num: this.num }); }
  }

  class Coach extends Enemy {
    constructor(x, y) { super(x, y, 'coach'); this.r = 16; this.killable = false; this.scoreVal = 90; this.whistle = false; this.wt = 0; }
    update(dt, dad, g) {
      this.walk += dt * 5;
      const prevW = this.whistle; this.wt += dt; this.whistle = (this.wt % 2) < .25;
      if (this.whistle && !prevW && Math.abs(this.y - dad.y) < 360) UD.audio.play('whistle');
      if (this.contactCd > 0) this.contactCd -= dt;
      if (this.stun > 0) { this.stun -= dt; this.applyKnock(dt); }
      if (UD.dist2(this.x, this.y, dad.x, dad.y) < (this.r + dad.r) ** 2)
        this.contact(dad, g, dad.x - this.x, dad.y - this.y, 260, 9);
    }
    draw(ctx, camY) { UD.art.coach(ctx, { x: this.x, y: this.y - camY, walk: this.walk, whistle: this.whistle }); }
  }

  UD.Enemy = Enemy; UD.Kid = Kid; UD.Crab = Crab; UD.Gull = Gull;
  UD.BeachBall = BeachBall; UD.Footballer = Footballer; UD.Coach = Coach;
})(window.UD);
