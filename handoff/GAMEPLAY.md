# Gameplay & Tuning

The whole of Level 1 is one continuous vertical obstacle course. The dad starts at
the bottom (parking lot, `START_Y = 5450`) and must reach the goal at the top
(the perfect spot by the ocean, `GOAL_Y = 120`). Lose if the **stress meter** fills
to 100; win by touching the goal.

---

## Player mechanics (`dad.js`)

| Action | Key | Behavior |
|--------|-----|----------|
| Move | WASD / Arrows | 8-directional jog. Accel/decel via `lerp`; base speed `168` u/s. |
| Umbrella swing | J / Space | Wide melee arc in the facing direction. Cooldown `0.45s`. Calls `game.umbrellaHit()`. |
| Throw soda | K | Fires a soda projectile in the facing direction. Costs 1 ammo (max 6). Cooldown `0.4s`. |
| Pause | P / Esc | Toggle. |

**State machine:** `idle → jog → swing / slip / hop / hurt / victory`. The
interesting reactive states:
- **slip** (on ice-cream slick): friction drops to near-zero, steering authority
  ~3% — the dad slides and can chain into other hazards.
- **hop** (on hot sand): forced fast jittery hops with randomized direction +
  continuous stress tick (`+16/s`). Hard to control on purpose.

**Combat resolution** lives in `game.js`:
- `umbrellaHit()` — arc test: any enemy within `reach=78` and within ±1.25 rad of
  facing gets `hit()` with force `320`.
- `throwSoda()` — spawns a projectile (speed `460`); on enemy overlap calls
  `hit()` with force `360` + a fizz burst.

**Scoring/combo:** `dad.addScore(n)` increments a combo (resets after `1.6s` idle);
combos ≥3 multiply score. Floating popups via `fx.popup`.

---

## Enemies & hazards (`enemies.js`, `level.js`)

| Threat | Class | Behavior | Killable? | Score |
|--------|-------|----------|-----------|-------|
| **Beach kids** | `Kid` | Chaotic random-retarget wander inside a y-band. Collide → knock dad back (+9 stress). | yes | 100 |
| **Sand crabs** | `Crab` | Sideways scuttle, lunges toward dad when near; pinch on contact (+5 stress). | yes (1 hit) | 60 |
| **Seagulls** | `Gull` | **Idle/bob near spawn until dad within ~360px**, then dive-bomb to steal a soda (or bump, +6 stress), then flee upward. | yes | 120 |
| **Beach balls** | `BeachBall` | Bounce + drift, wall-bounce; bump knocks dad (+7 stress). | no (stun only) | 70 |
| **Junior football** | `Footballer` | 4 members locked in formation; the whole drill sweeps left/right (`drillX`). A moving wall (+11 stress, big knockback). | no | 90 |
| **Coach** | `Coach` | Stands with the drill, periodic whistle. Blocks lane (+9 stress). | no | 90 |
| **Ice-cream slick** | hazard ellipse | Sets `dad.onIce` → slip state. | — | — |
| **Hot sand** | hazard ellipse | Sets `dad.onHot` → panic hops + stress drain. | — | — |

> **The gull proximity gate** (in `Gull.update`) is important and was a bug fix:
> without it, every gull on the whole 5600px-tall level homes in on the dad on the
> first frame and strips all 6 sodas before the player can move. They now idle near
> their spawn band until `Math.abs(this.y - dad.y) < 360`.

**Soda coolers** (`level.coolers`) are pickups scattered along the route; touching
one refills soda to 6 with a `+6` popup.

---

## The 7 zones (bottom → top)

Laid out deterministically in `level.build()` with a seeded RNG (seed `20260528`),
so the course is identical every run. Same order is mirrored in the GAUNTLET map
(`hud.js` `ZONES`) and the map's parking-lot-start / beach-finish art.

1. **Parking Lot** (start) — parked cars, the spawn point.
2. **Towel Maze** — towels + sandcastles + crabs. First soda cooler.
3. **Ice-Cream Alley** — vendor, ice slicks, wild kids.
4. **The Hot Sand** — hot-sand patches, palms, dive-bombing gulls. Second cooler.
5. **Football Drill** — the sweeping 4-member wall + coach. Lifeguard tower.
6. **The Crowd** — beach balls + kids + crabs, umbrellas, towels. Third cooler.
7. **Final Stretch → THE SPOT** — palms, a couple gulls, then the goal (X-marks-
   the-spot ring you must touch).

---

## Look & palette (`palette.js` + `style.css`)

**Aesthetic:** "modern 16-bit arcade" — pixel font for HUD/labels (`Press Start 2P`),
a chunky display font for headings (default `Bungee`), chunky flat-vector cartoon
art with thick dark outlines, neon HUD chrome, and a CRT scanline+vignette overlay
(`#crt`, toggleable).

**Default preset (`sunset`):** neon accents `#ff2d95` (magenta), `#00e5ff` (cyan),
`#ffd23f` (sunshine), `#b6ff3b` (lime); deep-purple ink `#160b2e`. Sea/sand/foam +
hot-sand colors are in the preset. The other presets are `noon` and `night`.

**CSS custom props** the game sets live: `--neon-a/b/c/d`, `--ink`, `--ink-2`,
`--panel`, `--font-display`. HUD and screens read these so they re-skin with the
palette.

---

## Tuning cheat-sheet — what to touch first

All in authored units / seconds. Most live in `dad.js` and `enemies.js`.

| Want to… | Change |
|----------|--------|
| Make the dad faster/slower | `base = 168` in `Dad.update`. |
| Make it easier/harder | Stress gains in each enemy's `contact()` (the last arg), and hot-sand tick `+16` in `Dad.update`. |
| Lengthen/shorten the level | `UD.LEVEL_H` in `util.js` (then re-space zones in `level.build`). |
| Change swing reach/arc | `reach=78`, `±1.25` rad in `game.umbrellaHit`. |
| Soda ammo / speed | `this.soda = 6` in `Dad.reset`; projectile speed `460` in `throwSoda`. |
| Gull aggression range | `360` in `Gull.update`. |
| Camera framing | `this.dad.y - UD.VH * 0.6` in `_targetCam`. |
| Win time bonus | `Math.max(0, 1200 - time*10)` in `hud.showWin`. |

---

## Known gameplay gaps (intentional, prototype scope)

- No audio (SFX/music) — hooks would naturally go in `game.umbrellaHit`,
  `throwSoda`, enemy `hit`/`contact`, cooler pickup, win/lose.
- Single level. The structure supports more: `level.js` is data-driven enough to
  template additional courses.
- No persistence/high-scores.
- Balance is hand-tuned for "fun chaos," not playtested.
- Mobile/touch not implemented (PC keyboard only, by request).
