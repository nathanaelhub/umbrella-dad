# Umbrella Dad — Developer Handoff

> A comedic arcade beach-survival game. A tired suburban dad crosses a chaotic
> public beach (Point A: the parking lot → Point B: the perfect umbrella spot),
> swinging his umbrella, throwing sodas, and dodging kids, crabs, gulls, hot sand,
> ice-cream slicks, and a junior-football drill.

This package was designed as a **visual + interaction prototype**. It is a working,
playable vertical slice built in **vanilla JS + Canvas 2D** (no build step, no
framework for the game itself). The goal of this handoff is to let you (via Claude
Code) continue it into a real codebase.

---

## TL;DR — run it

It's static. No install, no bundler. Just serve the folder and open the HTML:

```bash
# from the project root
python3 -m http.server 8000
# then visit:
#   http://localhost:8000/Umbrella%20Dad.html      → the game
#   http://localhost:8000/Dad%20Sprite%20Sheet.html → the character animation sheet
```

(Opening the files directly with `file://` mostly works too, but a local server
avoids any canvas/CORS quirks.)

**Controls:** `WASD`/`Arrows` move · `J`/`Space` umbrella swing · `K` throw soda ·
`P` pause · `Enter` confirm.

---

## What's in the box

| File | What it is |
|------|------------|
| `Umbrella Dad.html` | The game. Loads all `game/*.js`, the CSS, and the Tweaks panel. |
| `Dad Sprite Sheet.html` | A standalone character-animation reference: 6 animations, live previews + frame strips, PNG export. |
| `style.css` | All HUD/menu/screen styling + the CRT overlay. The game world is drawn on canvas, not styled here. |
| `game/*.js` | The engine, split into small single-responsibility modules (see `ARCHITECTURE.md`). |
| `tweaks-panel.jsx` / `tweaks-app.jsx` | The in-page "Tweaks" panel (React, Babel-in-browser) for live re-skinning. **Decorative tooling, not core to the game.** |
| `screenshots/` | Working screenshots captured during the build. Safe to delete. |

The detailed docs:
- **`ARCHITECTURE.md`** — module-by-module map, the namespace pattern, render pipeline, coordinate system.
- **`GAMEPLAY.md`** — every mechanic, every enemy, and the tuning constants worth touching first.
- **`SPRITE-RIG.md`** — how the articulated character rig works, and its known rough edges.
- **`ROADMAP.md`** — suggested next steps, including the big one: unifying the two dad renderers.

---

## The single most important thing to understand

**There are TWO different "dads" in this project, drawn by two different renderers.**

1. **The game dad** — `game/art.js` (`UD.art.dad`). A fast, stubby, *procedural*
   figure. This is what runs around in `Umbrella Dad.html`.
2. **The sprite-sheet dad** — `game/sprites.js` (`UD.sprites.render`). A newer,
   fully *articulated* rig (posed joints, neck, IK arms). This is what's shown in
   `Dad Sprite Sheet.html`.

They are **not yet unified.** The sprite-sheet rig is the better-looking one and
was always intended to eventually replace the procedural game dad. That unification
is the headline task in `ROADMAP.md`. The animation *names and states already match*
between the two (`jog`, `swing`, `throw`, `slip`, `hop`, `victory`), so the seam is
clean.

> Note from the designer: the articulated rig still looks slightly "off" in some
> poses (proportions/joint overlaps in extreme frames). It's a flat-vector cartoon
> approximation, not final art — treat it as a motion/proportion reference, not
> shippable sprites. See `SPRITE-RIG.md` § Known issues.

---

## Tech posture / recommendations

- **No framework, no build** for the game. Everything attaches to one global
  namespace, `window.UD`. This was deliberate for a zero-friction prototype.
- If you're taking this to production, the natural moves are: (a) port the modules
  to ES modules or TypeScript, (b) replace the global `UD` object with real imports,
  (c) decide whether to keep Canvas 2D immediate-mode or move to a framework
  (Pixi/Phaser) or pre-rendered sprite atlases. See `ROADMAP.md`.
- The **Tweaks panel** (`tweaks-*.jsx`) is the only React in the project and is
  purely a design-time re-skinning toy. You can delete it for a real build; nothing
  in `game/*` depends on it except an optional `window.__UD_TWEAKS` hook read once
  at startup.

---

## Design system / brand

The brand for this game (palette, type, the "modern 16-bit arcade" look) was
authored from scratch and lives in `game/palette.js` + `style.css`. There is no
external design-system dependency to wire up. See `GAMEPLAY.md` § Look & palette
for the exact tokens.
