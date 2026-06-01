# Roadmap / Suggested Next Steps

Ordered roughly by impact. Nothing here is started — this is the "what next" list
for continuing in a real codebase.

---

## 1. ⭐ Unify the two dad renderers (the big one)

Today the **game** draws the dad with the simple procedural `art.js`, while the
**sprite sheet** uses the nicer articulated `sprites.js`. They should be one.

The seam is already clean because the **state/animation names match**:

| game `dad.state` (`dad.js`) | sprite anim (`sprites.js`) |
|------------------------------|----------------------------|
| `idle` / `jog` | `jog` (or an `idle` you add) |
| `swing` | `swing` |
| (throw — currently no distinct state) | `throw` |
| `slip` | `slip` |
| `hop` | `hop` |
| `victory` | `victory` |
| `hurt` | (add a small hurt/stagger, or reuse `slip`) |

**Implementation sketch:**
1. In `Dad.draw()` (`dad.js`), instead of calling `UD.art.dad`, call
   `UD.sprites.render(ctx, animName, phase, {build})`.
2. Map `this.state` → `animName`. Drive `phase`:
   - looping states (`jog`, `hop`): `phase = (this.walk % TAU) / TAU`.
   - one-shots (`swing`, `throw`, `slip`, `victory`): track a per-action timer
     `0→1` (you already have `swingT`; add `throwT`, `slipT`, `victoryT`).
3. **Facing:** the rig faces `+x`. When `dad.fx < 0`, `ctx.scale(-1,1)` before
   rendering (and beware text/asymmetry). The procedural dad currently fakes
   left/right less explicitly — the rig makes this cleaner.
4. Delete `art.js`'s dad once parity is reached (keep enemies/decor in `art2.js`).
5. Re-tune the few magic offsets in `sprites.js` for non-`classic` builds (see
   `SPRITE-RIG.md` known issues) if you keep the build selector in-game.

**Performance:** the rig is heavier than the procedural dad (more paths + IK). Fine
for one player on Canvas 2D, but if you later have many characters, pre-render the
rig to a sprite atlas (see step 6) rather than drawing it live.

---

## 2. Audio

There is no sound at all. Natural hook points:
- `game.umbrellaHit()` → whoosh + (on hit) a comedic *bonk*.
- `game.throwSoda()` → can-throw *fwip*; on impact → fizz *psssh*.
- enemy `contact()` → *oof* + a stress sting.
- cooler pickup → bright *ding*.
- hot sand → rapid *hot-hot-hot* loop; ice → cartoon slip *whoop*.
- win → triumphant sting + beach ambience; lose → sad trombone.
- Menu → light synthwave loop (fits the aesthetic).

Keep a small `UD.audio` module mirroring `UD.fx`; preload, pool, respect a mute
toggle (add to the Tweaks panel).

---

## 3. Port to modules / TypeScript

The global-`UD` IIFE pattern was for zero-build prototyping. For a real project:
- Convert each `game/*.js` to an ES module with explicit `import`/`export`.
- Replace `window.UD.X` references with imports.
- Add types — the entity "bags" passed to draw functions are the main thing to
  formalize (`Pose`, `EnemyState`, `DadState`).
- Keep `util.js` constants as a `config.ts`.

---

## 4. Data-drive the levels

`level.build()` is hand-coded but already zone-structured. Extract a level
descriptor (array of zones: y-range, decor density, hazard list, enemy spawns,
cooler positions) so levels 2+ are data, not code. The GAUNTLET map (`hud.js`
`ZONES`) should read from the same descriptor.

---

## 5. Decouple from the Tweaks panel for production

`tweaks-panel.jsx` / `tweaks-app.jsx` are the only React in the project and exist
purely for live design-time re-skinning. For a shipping build:
- Drop both files and the React/Babel `<script>` tags from the HTML.
- Keep `palette.js` presets; expose palette/CRT/build as real in-game settings
  instead (Options menu).
- The only runtime coupling is `window.__UD_TWEAKS` read once in `game.js` boot —
  replace with your settings store.

---

## 6. (Optional) Sprite atlas pipeline

If you move off live procedural drawing: render each `sprites.js` animation's frames
into a grid at a fixed cell size, export PNG atlases + a JSON frame map, and have the
game blit frames instead of redrawing the rig. The sprite-sheet page already proves
the per-frame render; productionizing it is mostly bookkeeping (cell layout, trim,
pivot points). This also opens the door to hand-cleaning the rough frames called out
in `SPRITE-RIG.md`.

---

## 7. Polish / juice backlog

- More `fx` on big hits (freeze-frame, bigger shake on the football wall).
- A combo-multiplier flourish in the HUD.
- Idle/victory-dance animations (the rig can take more anims easily).
- Difficulty ramp / a visible distance-milestone callout per zone.
- Accessibility: remappable keys, reduced-motion (disable CRT + shake), colorblind-
  safe stress meter.

---

## Quick reference — debugging from the console

```js
UD.GAME.state                 // current state
UD.GAME.setState('map')       // jump to a screen: menu|threats|map|howto|win|lose
UD.GAME.startGame()           // (re)start a run
UD.GAME.dad                   // the player entity (x,y,stress,soda,score,state…)
UD.GAME.dad.y = 2700          // teleport (lower y = closer to the goal)
UD.GAME.enemies               // live enemies
UD.PAL                        // active palette
UD.applyTweaks({palette:'night', build:'dadbod'})   // live re-skin
UD.sprites.ANIMS              // the six animation defs
```
