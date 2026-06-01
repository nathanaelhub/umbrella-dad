# The Articulated Sprite Rig (`game/sprites.js`)

This is the **second, higher-quality** dad renderer — used only by
`Dad Sprite Sheet.html`. It exists to provide proper keyframed character animation
(jog, swing, throw, slip, panic-hop, victory placement) as a motion + proportion
reference. It is **not** wired into the game yet (the game uses the simpler
`art.js` dad). Unifying them is the top roadmap item.

---

## How it works

A simple **skeletal rig posed per frame**, drawn with the same flat-vector cartoon
style as the rest of the game (thick outlines, flat fills, one shadow tone).

### Coordinate convention
Origin `(0,0)` = the point between the feet on the ground. Up is `-y`, the character
faces `+x` (right). The renderer composites in layers for correct overlap:

```
ground FX (heat shimmer, plant puff, skid)
shadow ellipse
back leg
cargo-shorts pelvis block
[hip-rotated space:] back arm + carried umbrella (back layer) + torso
front leg
[hip-rotated space:] neck + head + front arm + held item
planted umbrella (world space, victory only)
air FX (flying soda, swoosh arc, sparkles, speech bubble)
```

The torso/head/arms are drawn inside a **hip-rotated space** (translate to hip,
rotate by `lean`) so leaning forward/back rotates the whole upper body naturally.

### Rig constants
```js
HIP_Y=-42, HIP_X=13, SH_LY=-50 (shoulder), HEAD_LY=-70 (hip-space), HEAD_R=13
THIGH=19, SHIN=17, UPPER=16 (upper arm), FORE=14 (forearm)
```
`BUILDS` scales these: `classic`, `dadbod` (bigger belly, shorter), `tall`.

### Forward kinematics + IK
- **Legs** (`drawLeg`): FK — hip angle then knee angle, drawing thigh→calf→sandal.
- **Arms** (`drawArm`): FK shoulder→elbow→hand for free poses.
- **`armIK(...)`**: a 2-bone analytic IK solver so a hand can *reach a target point*
  (used to grip the carried umbrella and to plant it). `bend = ±1` picks elbow side.

### The carried umbrella (the fix that mattered)
Earlier the closed umbrella stuck straight up like an antenna through the head. Now,
in `shoulder` mode it's drawn in the **back layer** along a fixed pleasing diagonal
(`CARRY` geometry: handle at `~(27,-18)`, angle `~-2.36 rad`, length `82`), and the
umbrella arm uses **IK to reach up and grip it** (`CARRY.grip`). Other modes:
`fling` (follows the flailing arm during a slip), `wave` (brandished overhead during
panic, kept clear of the face), `open` (canopy blooms during a swing), `raise` /
`plant` (the victory hoist-and-plant).

---

## The six animations (`UD.sprites.ANIMS`)

Each entry = `{ label, frames, fps, loop, desc, pose(t) }` where `pose(t)` returns
a full pose bag for normalized time `t ∈ [0,1]`. The `seg(t, [...])` helper does
piecewise eased keyframe interpolation.

| key | label | frames·fps | loop | beats |
|-----|-------|-----------|------|-------|
| `jog` | Tired Jog | 8 · 9 | ✓ | hunched trudge, gear-laden, sweat bead |
| `swing` | Umbrella Swing | 7 · 14 | — | wind-up → canopy blooms → wide overhead sweep + swoosh |
| `throw` | Soda Throw | 7 · 13 | — | reach to cooler → wind back → whip; can releases at t≈0.5 |
| `slip` | Ice-Cream Slip | 7 · 12 | — | feet shoot out, arms windmill, "!?" lean-back |
| `hop` | Hot-Sand Panic | 6 · 14 | ✓ | alternating frantic hops, umbrella overhead, "HOT!" |
| `victory` | Umbrella Placement | 10 · 11 | — | hoist overhead → stomp-plant (sand puff) → bloom open → relax beside it |

`UD.sprites.order` defines display order. The **face** system (`drawHead`) swaps
eyes/brows/mouth by `expr`: `tired, determined, strain, panic, joy, content`.

---

## Rendering a pose yourself

```js
ctx.save();
ctx.translate(feetX, feetY);     // origin = between the feet
ctx.scale(s, s);
UD.sprites.render(ctx, 'jog', t, { build: 'classic' });  // t in [0,1]
ctx.restore();
```

To export frames as a PNG sheet, the sprite-sheet page (`spritesheet.js`) already
does this — see its export button. For a production atlas you'd render each
animation's frames into a grid canvas at a fixed cell size and `toDataURL`/`toBlob`.

---

## ⚠️ Known issues / rough edges (designer-flagged)

The rig is a **flat-vector approximation, not final art.** Honest list of what still
looks off, so you don't have to rediscover it:

- **Extreme poses overlap awkwardly.** In the most stretched frames (peak of the
  slip, the deepest panic hop, the swing follow-through) limbs can overlap the torso
  or each other in slightly unnatural ways. The IK/FK angles are hand-authored, not
  physically constrained.
- **No true joint occlusion.** Layering is fixed (back-arm vs front-arm), so when an
  arm crosses the body mid-animation the seam can read flat.
- **Proportions are stylized, not consistent across builds.** `dadbod`/`tall` scale
  the bones but not every accessory (cooler/umbrella offsets are tuned for
  `classic`), so held items can sit slightly off on the other builds.
- **The umbrella canopy is procedural** (a scalloped arc), not a designed asset — it
  reads fine small but is coarse when scaled way up.
- **Hands are implied** (rounded line caps), not drawn — fine at game scale, crude
  on a giant hero shot.

### Recommended direction
For shippable quality, treat `sprites.js` as the **animation spec** (timing, poses,
silhouette, beats) and either:
1. have an artist draw real sprite frames matching these poses, **or**
2. pre-render the rig to sprite atlases and hand-clean the worst frames, **or**
3. rebuild as a proper skeletal/mesh rig (Spine, DragonBones, or Pixi + bones) using
   these `pose(t)` curves as the reference for each bone's keyframes.
