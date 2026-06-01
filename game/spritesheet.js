/* ============ UMBRELLA DAD · spritesheet.js — page logic ============ */
(function (UD) {
  'use strict';

  // device pixel ratio for crisp canvases
  const DPR = Math.min(2, window.devicePixelRatio || 1);

  const state = {
    playing: true,
    speed: 1,
    bg: 'bg-checker',
    build: 'classic',
    labels: true,
    rows: [],     // {name, anim, previewCtx, previewCanvas, cells:[{ctx,canvas}], oneShot, t, holdT}
  };

  // sizing
  const FRAME_W = 132, FRAME_H = 150;     // cell drawing size (css px)
  const PREVIEW_W = 200, PREVIEW_H = 210;
  // where the dad's feet sit within a frame & how big he's drawn
  const FEET_Y = 0.86, DAD_SCALE = 1.0;

  function setupCanvas(canvas, w, h) {
    canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
    canvas.width = Math.round(w * DPR); canvas.height = Math.round(h * DPR);
    const ctx = canvas.getContext('2d');
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    return ctx;
  }

  // draw one frame of an animation into ctx of given css size
  function drawFrame(ctx, w, h, animName, t, build) {
    ctx.clearRect(0, 0, w, h);
    ctx.save();
    // center horizontally, feet near bottom; scale to fit
    const fit = Math.min(w / 150, h / 175) * DAD_SCALE;
    ctx.translate(w * 0.5, h * FEET_Y);
    ctx.scale(fit, fit);
    UD.sprites.render(ctx, animName, t, { build });
    ctx.restore();
  }

  function buildRows() {
    const sheet = document.getElementById('sheet');
    sheet.innerHTML = '';
    state.rows = [];

    UD.sprites.order.forEach((name, idx) => {
      const A = UD.sprites.ANIMS[name];

      const row = document.createElement('div'); row.className = 'row';

      // head
      const head = document.createElement('div'); head.className = 'row-head';
      head.innerHTML =
        `<div class="row-num">${idx + 1}</div>
         <div class="row-meta"><h3>${A.label}</h3><p>${A.desc}</p></div>
         <div class="row-tags">
           <span class="tag"><b>${A.frames}</b> FRAMES</span>
           <span class="tag"><b>${A.fps}</b> FPS</span>
           <span class="tag">${A.loop ? 'LOOP' : 'ONE-SHOT'}</span>
         </div>`;
      row.appendChild(head);

      const body = document.createElement('div'); body.className = 'row-body';

      // preview
      const prev = document.createElement('div'); prev.className = 'preview';
      const pcanvas = document.createElement('canvas');
      prev.appendChild(pcanvas);
      const plabel = document.createElement('div'); plabel.className = 'plabel';
      plabel.textContent = A.loop ? 'LOOPING' : 'PLAYS ONCE';
      prev.appendChild(plabel);
      if (!A.loop) {
        const rb = document.createElement('button'); rb.className = 'replay'; rb.textContent = '↻ REPLAY';
        rb.onclick = () => { rowState.t = 0; rowState.holdT = 0; };
        prev.appendChild(rb);
      }
      body.appendChild(prev);

      // strip
      const strip = document.createElement('div'); strip.className = 'strip';
      const cells = [];
      for (let i = 0; i < A.frames; i++) {
        const cell = document.createElement('div'); cell.className = 'cell ' + state.bg;
        const c = document.createElement('canvas');
        const fnum = document.createElement('div'); fnum.className = 'fnum'; fnum.textContent = String(i + 1).padStart(2, '0');
        cell.appendChild(fnum); cell.appendChild(c);
        strip.appendChild(cell);
        cells.push({ cell, canvas: c, ctx: setupCanvas(c, FRAME_W, FRAME_H), frame: i });
      }
      body.appendChild(strip);
      row.appendChild(body);
      sheet.appendChild(row);

      const pctx = setupCanvas(pcanvas, PREVIEW_W, PREVIEW_H);
      const rowState = { name, A, pctx, pcanvas, cells, t: 0, holdT: 0 };
      state.rows.push(rowState);
      // draw an initial frame so previews are never blank before rAF starts
      drawFrame(pctx, PREVIEW_W, PREVIEW_H, name, 0, state.build);
    });

    drawAllStrips();
  }

  // redraw every preview's current frame once (used when rAF is paused)
  function drawPreviews() {
    for (const r of state.rows) drawFrame(r.pctx, PREVIEW_W, PREVIEW_H, r.name, r.t, state.build);
  }

  // static strip frames (redraw on build/bg change)
  function drawAllStrips() {
    for (const r of state.rows) {
      const A = r.A;
      for (const cell of r.cells) {
        // for loops, sample across [0,1); one-shots across [0,1]
        const t = A.loop ? cell.frame / A.frames : cell.frame / (A.frames - 1);
        drawFrame(cell.ctx, FRAME_W, FRAME_H, r.name, t, state.build);
      }
    }
  }

  function applyBg() {
    document.querySelectorAll('.cell').forEach(c => {
      c.className = 'cell ' + state.bg;
    });
  }

  /* ---- animation loop for previews ---- */
  let last = performance.now();
  function loop(now) {
    let dt = (now - last) / 1000; last = now;
    if (dt > 0.05) dt = 0.05;
    if (state.playing) {
      for (const r of state.rows) {
        const A = r.A;
        const dur = A.frames / A.fps;          // seconds for full cycle
        r.t += (dt / dur) * state.speed;
        if (A.loop) { r.t %= 1; }
        else {
          if (r.t >= 1) {
            r.t = 1;
            r.holdT += dt * state.speed;
            if (r.holdT > 1.1) { r.t = 0; r.holdT = 0; }   // pause then replay
          }
        }
        drawFrame(r.pctx, PREVIEW_W, PREVIEW_H, r.name, r.t, state.build);
      }
    }
    requestAnimationFrame(loop);
  }

  /* ---- PNG sprite-sheet export ---- */
  function exportSheet() {
    const PAD = 10, SCALE = 1.6;
    const cw = Math.round(FRAME_W * SCALE), ch = Math.round(FRAME_H * SCALE);
    const cols = Math.max(...state.rows.map(r => r.A.frames));
    const rowsN = state.rows.length;
    const labelH = 30;
    const W = PAD + cols * (cw + PAD);
    const H = PAD + rowsN * (ch + labelH + PAD);
    const out = document.createElement('canvas');
    out.width = W; out.height = H;
    const ctx = out.getContext('2d');
    // transparent bg by default; paint subtle dark so labels read if opened directly
    ctx.fillStyle = '#160b2e'; ctx.fillRect(0, 0, W, H);

    state.rows.forEach((r, ri) => {
      const A = r.A;
      const y0 = PAD + ri * (ch + labelH + PAD);
      // row label
      ctx.fillStyle = '#ffd23f'; ctx.font = '12px "Press Start 2P", monospace'; ctx.textBaseline = 'top';
      ctx.fillText(`${ri + 1}. ${A.label}  [${A.frames}f @ ${A.fps}fps ${A.loop ? 'LOOP' : '1-SHOT'}]`, PAD, y0 + 4);
      for (let i = 0; i < A.frames; i++) {
        const t = A.loop ? i / A.frames : i / (A.frames - 1);
        const x = PAD + i * (cw + PAD), y = y0 + labelH;
        ctx.save(); ctx.translate(x, y);
        // cell border
        ctx.strokeStyle = 'rgba(255,255,255,.12)'; ctx.lineWidth = 1; ctx.strokeRect(.5, .5, cw - 1, ch - 1);
        // draw dad (no DPR transform here; use SCALE)
        ctx.save();
        const fit = Math.min(cw / 150, ch / 175) * SCALE * 0.62;
        ctx.translate(cw * .5, ch * FEET_Y);
        ctx.scale(fit, fit);
        UD.sprites.render(ctx, r.name, t, { build: state.build });
        ctx.restore();
        // frame number
        ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.font = '9px "Press Start 2P", monospace';
        ctx.fillText(String(i + 1).padStart(2, '0'), 4, 4);
        ctx.restore();
      }
    });

    out.toBlob(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'umbrella-dad-spritesheet.png';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }, 'image/png');
  }

  /* ---- controls wiring ---- */
  function wire() {
    const playBtn = document.getElementById('playToggle');
    playBtn.onclick = () => {
      state.playing = !state.playing;
      playBtn.textContent = state.playing ? '⏸ PAUSE' : '▶ PLAY';
      playBtn.classList.toggle('alt', state.playing);
    };
    document.getElementById('speed').oninput = e => { state.speed = parseFloat(e.target.value); };

    document.querySelectorAll('#bgSeg button').forEach(b => b.onclick = () => {
      document.querySelectorAll('#bgSeg button').forEach(x => x.classList.remove('on'));
      b.classList.add('on'); state.bg = b.dataset.bg; applyBg();
    });
    document.querySelectorAll('#buildSeg button').forEach(b => b.onclick = () => {
      document.querySelectorAll('#buildSeg button').forEach(x => x.classList.remove('on'));
      b.classList.add('on'); state.build = b.dataset.build; drawAllStrips(); drawPreviews();
    });

    const labelBtn = document.getElementById('labelToggle');
    labelBtn.onclick = () => {
      state.labels = !state.labels;
      document.body.dataset.labels = state.labels ? '1' : '0';
      labelBtn.textContent = state.labels ? 'LABELS ✓' : 'LABELS ✗';
    };
    document.getElementById('exportAll').onclick = exportSheet;
  }

  function start() {
    UD.applyTweaks({ palette: 'sunset', font: 'bungee', dadBuild: 'classic', crt: true });
    buildRows();
    wire();
    requestAnimationFrame(loop);
  }

  window.addEventListener('DOMContentLoaded', () => {
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(start).catch(start);
    else start();
  });
})(window.UD);
