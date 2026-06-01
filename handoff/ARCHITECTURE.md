# Architecture

Vanilla JS + Canvas 2D. No build step. Every module is an IIFE that hangs its
exports off a single global namespace, `window.UD`. Scripts load in dependency
order from `Umbrella Dad.html`:

```
util.js → palette.js → art.js → art2.js → fx.js → dad.js
        → enemies.js → level.js → hud.js → sprites.js → spritesheet.js → game.js
```

`game.js` self-boots on `DOMContentLoaded` (after `document.fonts.ready`).

---

## The namespace pattern

```js
(function (UD) {
  'use strict';
  // ...
  UD.Thing = Thing;          // export
})(window.UD = window.UD || {});
```

Everything is reachable at runtime from the console as `UD.*` — handy for
debugging (`UD.GAME.dad`, `UD.GAME.setState('map')`, `UD.PAL`, etc.).

---

## Module map

### `util.js` — constants + math/helpers
The world's authored coordinate system and shared helpers.

| Constant | Value | Meaning |
|----------|-------|---------|
| `UD.VW`, `UD.VH` | 960 × 540 | **Virtual** design resolution. Everything is authored in these units. |
| `UD.LEVEL_H` | 5600 | Total course height (~10 screens tall). The level scrolls vertically. |
| `UD.GOAL_Y` | 120 | Y of the "perfect spot" (near the top / ocean). |
| `UD.START_Y` | 5450 | Y where the dad starts (bottom / parking lot). |
| `UD.MARGIN` | 70 | Side margins (dunes); playable x is `[MARGIN, VW-MARGIN]`. |

Helpers: `clamp, lerp, rand, randInt, pick, dist2, approach, mulberry32` (seeded
RNG), `hitCircle, inRect, rr` (rounded-rect path), `hexa` (hex→rgba), `shade`
(lighten/darken). **The canvas is 1920×1080 backing, scaled 2× via `setTransform`,
so 1 authored unit = 2 device px** — gives crisp rendering on HiDPI.

### `palette.js` — color system + live re-skin
- `UD.PAL` — the **active** world palette (flat object of color strings). Read by
  every draw function. Never hard-code colors in art code; pull from `UD.PAL`.
- `UD.PRESETS` — three mood presets: `sunset` (default), `noon`, `night`. Each
  defines sea/sand/hot-sand/foam + four neon accents + ink tones.
- `UD.FONTS` — four heading-font options.
- `UD.applyTweaks(t)` — swaps the active preset/font/build, pushes neon+ink colors
  into CSS custom properties (so HUD/menus reskin too), toggles CRT, sets the logo
  class. Called once at boot with `window.__UD_TWEAKS`, and again whenever the
  Tweaks panel changes.

### `art.js` — the GAME dad (procedural)
`UD.art.dad(ctx, d)` draws the simple, stubby in-game character given a state bag
`d` ( `{x,y,walk,moving,state,swingT,stressN,squash,scale}` ). Also helpers for the
open-umbrella swing. **This is the figure you see while playing.**

### `art2.js` — enemies + world decor (procedural)
All the chunky cartoon drawing for: `kid, crab, gull, footballer, coach, beachball,
soda` and decor `towel, sandcastle, umbrellaDecor, palm, lifeguard, vendor,
parkedCar`. Each takes `(ctx, entityBag)` in **screen space** (caller already
subtracted the camera). Flat fills + thick dark outlines + one posterized shadow.

### `fx.js` — particles + popups
`UD.fx` — a tiny particle system (`fizz, sandPuff, stars, confetti, ring`) plus
floating DOM score/combo `popup`s. `update(dt)` / `draw(ctx, camY)` / `clear()`.

### `dad.js` — the player entity (logic, not drawing)
`UD.Dad` class. Holds position/velocity, the **state machine**
(`idle, jog, swing, slip, hop, hurt, victory`), stress, soda count, score, combo.
`update(dt, input, game)` does movement + hazard reactions (ice = low-friction
slide, hot sand = panic hops + stress tick), and fires `game.umbrellaHit()` /
`game.throwSoda(...)`. `draw(ctx, camY)` delegates to `UD.art.dad`. Knockback,
scoring, soda refill all live here.

### `enemies.js` — enemy classes (logic + draw delegation)
Base `UD.Enemy` + subclasses `Kid, Crab, Gull, BeachBall, Footballer, Coach`. Each
has `update(dt, dad, game[, drillX])`, a `hit(...)` (umbrella/soda response →
knockback + stars + score), and `contact(...)` (touch → knockback the dad + stress).
Draw delegates to `art2.js`. See `GAMEPLAY.md` for per-enemy behavior + the gull
proximity gate.

### `level.js` — the course
`UD.Level`. `build(game)` deterministically (seeded RNG) lays out the 7 zones:
towels, sandcastles, hazards (ice/hot ellipses), coolers (soda pickups), the moving
football drill, decor (palms, lifeguard towers, vendors, parked cars), and the goal.
`update(dt, dad, game)` runs the drill sweep, cooler pickups, hazard flags on the
dad, and win detection. Rendering is split: `drawFlat()` (ground, ocean, hazards,
towels, coolers, goal) draws first; `tallSprites()` returns depth-sortable sprites
(decor) that `game.js` merges with enemies + dad for correct y-sorting.

### `hud.js` — HUD + the three "deliverable" screens
`UD.hud`. Live meters (score, soda pips, stress bar, distance tracker, combo
popups). Also builds the static content for **THREATS** (enemy concept gallery —
draws mini portraits with `art2`), **THE GAUNTLET** (the level map — parking-lot
start, beach-umbrella finish), **HOW TO PLAY**, and the win/lose stat panels.

### `sprites.js` — the ARTICULATED dad (sprite sheet only)
`UD.sprites`. A separate, higher-quality posable rig used **only** by the sprite
sheet. `render(ctx, animName, t, opts)` resolves a per-frame pose (forward
kinematics + 2-bone IK arms) and draws it with origin at the feet. `UD.sprites.ANIMS`
holds the six animation definitions (frames/fps/loop/pose-fn). See `SPRITE-RIG.md`.

### `spritesheet.js` — the sprite-sheet PAGE logic
Drives `Dad Sprite Sheet.html`: builds the rows, runs the live preview loops, renders
the numbered frame thumbnails, and wires the controls (play/pause, build toggle,
background, scale, PNG export). Depends on `sprites.js`.

### `game.js` — engine + wiring
The `Game` singleton (`UD.GAME`). Owns: the canvas + 2× transform, the input map,
the **state machine** (`menu, playing, paused, threats, map, howto, win, lose`),
the fixed-timestep-ish RAF loop, the camera (smooth follow + clamp), screenshake,
combat resolution (`umbrellaHit`, `throwSoda`), the depth-sorted render pass, and
the animated key-art on the menu (`drawMenuArt`).

---

## Coordinate system & camera

- **World space:** x ∈ [0, 960], y ∈ [0, 5600], y increases *downward*. The dad
  walks from `START_Y` (bottom) up toward `GOAL_Y` (top).
- **Camera:** `game.camY` is the world-y at the top of the viewport. Draw functions
  receive `camY` and subtract it (`screenY = worldY - camY`). The camera smooth-
  follows the dad and clamps to `[0, LEVEL_H - VH]`.
- **Canvas backing:** 1920×1080, transformed `setTransform(2,0,0,2,0,0)` so all
  drawing is in 960×540 units at 2× device resolution.
- **Fit-to-viewport:** `#frame` is CSS-`transform: scale()`d to fit the window in
  `Game.fit()`; the game letterboxes on black.

---

## Render pipeline (per frame, `state === 'playing'`)

```
update(dt):
  dad.update → level.update → enemies.update → projectiles → fx.update
  → camera lerp → shake decay → hud meters → lose check
render():
  apply screenshake translate
  level.drawFlat()                      // sand, ocean, hazards, towels, coolers, goal
  build sprite list = level.tallSprites() + enemies + dad
  sort by .y, draw each                 // depth sorting
  draw projectiles (sodas)
  fx.draw()                             // particles
```

The menu state instead calls `drawMenuArt(t)` — the animated synthwave key-art
poster (hero dad, sun, palms, swooping gulls, arcing soda).
