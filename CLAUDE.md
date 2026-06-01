# CLAUDE.md — Umbrella Dad

You are continuing **Umbrella Dad**, a comedic arcade beach-survival game: a tired
suburban dad crosses a chaotic beach (parking lot → the perfect umbrella spot),
swinging his umbrella, throwing sodas, and dodging kids/crabs/gulls/hot-sand/
ice-cream/a football drill. It's a working **vanilla JS + Canvas 2D** prototype
(no build step) plus a separate character-animation sprite sheet.

## Read these first (in `handoff/`)
1. **`handoff/README.md`** — overview, how to run, the two-renderers gotcha.
2. **`handoff/ARCHITECTURE.md`** — module map, namespace pattern, coordinate system, render pipeline.
3. **`handoff/GAMEPLAY.md`** — mechanics, enemies, the 7 zones, tuning cheat-sheet.
4. **`handoff/SPRITE-RIG.md`** — the articulated character rig + its known rough edges.
5. **`handoff/ROADMAP.md`** — prioritized next steps (start with #1: unify the two dad renderers).

## Run it
Static — no install. Serve the folder and open:
- `Umbrella Dad.html` — the game
- `Dad Sprite Sheet.html` — the animation reference
```bash
python3 -m http.server 8000
```
Controls: WASD/Arrows move · J/Space umbrella · K soda · P pause · Enter confirm.

## Project shape
- `game/*.js` — engine, small single-responsibility modules, all hanging off a global
  `window.UD` namespace. Load order is defined in `Umbrella Dad.html`.
- `style.css` — HUD/menu/CRT styling (the world is drawn on canvas, not styled here).
- `tweaks-*.jsx` — the ONLY React; a design-time re-skin toy, safe to remove for prod.
- `screenshots/` — build-time captures, disposable.

## Most important context
There are **two dads**: the in-game procedural one (`game/art.js`) and the nicer
articulated rig (`game/sprites.js`, used only by the sprite sheet). They're not
unified yet — that's roadmap item #1. Their animation/state names already match.

## Conventions to keep
- Don't hard-code colors — pull from `UD.PAL` (see `game/palette.js`).
- World units are 960×540 (`UD.VW/VH`); canvas is 2× backing. y increases downward;
  the dad travels from high y (bottom/start) to low y (top/goal).
- Keep modules small and single-purpose; preserve the load order if you add scripts.
