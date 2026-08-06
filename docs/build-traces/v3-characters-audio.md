# Build trace: v3 characters and Break music

This trace connects the v3 product conversation to implementation evidence for
future releases and Priscilla's portfolio site.

## Build metadata

| Item | Value |
|---|---|
| Build date | 2026-08-05; acceptance correction 2026-08-06 |
| Frozen scope | [`daburudoro-v3-prd.md`](../../daburudoro-v3-prd.md) |
| Branch | `feat/v3-characters-audio` |
| Planning commit | `70812b3 docs: define DaburuDoro v3 scope` |
| Implementation commit | `bd46c39 feat: add v3 companions and break music` |
| Acceptance correction | `e494721 fix: rebuild v3 around hand and prop motion` |
| Base release | [`v2.0.0`](https://github.com/lvzihu/daburudoro/releases/tag/v2.0.0) |
| Release state | Implementation complete; owner acceptance pending |

## Starting evidence

Owner testing of v2 identified three concrete interaction problems:

1. the seven-pixel progress line was too difficult to click;
2. Hide was not discoverable on the collapsed character; and
3. character dragging sometimes passed through to the desktop until the pointer
   touched the progress line.

Frame inspection also confirmed that v2's independently generated Focus images
changed the desk, chair, lower body, outlines, and not only the intended hand.

The personalization direction added five preset companions, between-cycle
selection, sleeping Breaks, automatic local music per character, and private
static image substitution.

## Architecture

| Module | Responsibility |
|---|---|
| `character-catalog.js` | Stable five-color IDs, labels, and Focus activities |
| `character-session.js` | Active versus queued-next ownership across Ready, Focus, Break, and Complete |
| `asset-manager.js` | Validate, copy, and remove private managed audio files |
| `audio-policy.js` | Clamp volume and calculate the final five-second fade |
| `pointer-regions.js` | Sanitize rectangles and determine cursor acceptance |
| `settings-store.js` | Migrate and persist v3 preferences without breaking v2 data |
| Electron main process | Native file dialogs, managed URLs, global cursor polling, lifecycle |
| Renderer | Character picker, playback, raster-frame animation, settings, timer integration |

The timer state machine was deliberately left unchanged. Character and media
state react to timer transitions instead of becoming part of timing logic.

## Important behavioral rules implemented

- Only one character is visible.
- A Break selection is queued; it does not replace the outgoing sleeper or
  interrupt that character's music.
- The queued character becomes active exactly when the next Focus begins.
- A track plays once, does not loop, follows Timer Pause/Resume, continues while
  hidden, and fades using sub-second deadline precision.
- Relaunch restores preferences but clears a stale queued-next selection because
  active sessions do not survive Quit.

## Mouse-passthrough diagnosis and fix

V2 toggled Electron's whole-window `setIgnoreMouseEvents` from renderer
`mousemove` targets. When the ignored window did not receive the movement needed
to reverse that state—especially around an Electron drag region—the next click
went to the desktop. The non-drag progress control happened to restore input,
matching the owner's reproduction.

V3 moves the decision to the main process:

1. the renderer publishes current interaction rectangles;
2. the main process polls macOS's global cursor position every 50ms;
3. it converts the cursor to window-local coordinates; and
4. it accepts input inside the character, handle, or visible panel and passes
   through elsewhere.

This does not depend on an ignored window delivering its own recovery event.

## Art-production decision

Five 1536×1024 alpha sprite sheets were generated using the built-in image tool
and a shared original style reference. Each 3×2 sheet contains Ready, two Focus
concepts, sleep, completion wave, and one empty cell.

The initial implementation candidate rejected full-frame swapping after a
clipped overlay exposed seams. It froze one generated Focus panel and layered a
small code-native prop cue over it.

Owner acceptance testing caught that this did not read as character animation:
the character stayed frozen while a disconnected vector moved. The next
candidate alternated the complete generated panels, but testing caught whole-
character movement again. A prompt-constrained image edit also redrew and
rescaled its locked master, so it was rejected.

The first pre-release correction:

- remove all five CSS vector cues;
- derive Focus B deterministically from an exact copy of Focus A;
- change pixels only inside one declared activity region per character;
- preserve every original sheet and load a sibling `sheet-locked.png`; and
- freeze and resume that animation with Timer Pause/Resume.

Owner testing then found that stable-but-symbolic motion still missed the body-
doubling goal. A second acceptance amendment changed the runtime to standalone
Focus files and established a stricter rule: a working hand and the object it
operates must move; colored indicators alone do not count. It also:

- rebuilt Yellow around hands/controller motion;
- rebuilt Green around a hand pressing the mixer pad;
- fixed Blue so the short-line frame contains no long-line bobber pixels;
- replaced Red reading with the v1-inspired computer/typing composition;
- retained the approved Purple directing behavior; and
- removed custom-picture import from v3, deferring it to v5 after v4 UI work.

This restores the PRD's two-raster-frame behavior without repeating v2's drift
or substituting abstract motion for an activity. See the
[full art-production record](../art-direction/v3-character-sprites.md).

## Issues caught during the build

| Finding | Resolution |
|---|---|
| A hard clipped overlay produced a visible horizontal seam. | Rejected the clipped-overlay approach entirely. |
| Code-native cues looked disconnected from the frozen character. | Owner acceptance caught it; removed every runtime vector cue. |
| Alternating complete generated panels made the whole character shift. | Owner acceptance caught the v2 regression; replaced full-panel swapping with pixel-locked derivative sheets. |
| A strict image-edit prompt still rescaled and redrew the locked master. | Rejected the generated edit and built a deterministic Pillow/NumPy compositor with an outside-region equality assertion. |
| Stable controller/mixer color changes did not read as body doubling. | Replaced them with hand-and-prop changes derived from locked raster frames. |
| Blue's short-line state appeared to retain the old bobber. | Moved Focus to standalone files, cleared the full old line/bobber region, and added an asset-build assertion. |
| Red's page crossed the book and looked mechanically wrong. | Replaced reading with the successful v1 computer-work composition and typing-hand motion. |
| A first app-sized capture caught frame B while its data URL was still decoding, briefly revealing only part of the character. | Keep both Focus frames for every preset mounted and decoded; animation now toggles complete image elements instead of changing one image source. |
| The released app's single-instance lock blocked development screenshots. | Added an isolated development profile for visual QA without quitting the user's running app. |
| HTML media autoplay could vary with Chromium policy. | Set Electron's explicit no-user-gesture-required autoplay policy for local assigned music. |
| Integer countdown values made the five-second fade step once per second. | Calculate playback gain from the precise timestamp deadline every 250ms. |
| A native import dialog blurred and collapsed the popover that opened it. | Suppress blur-collapse while the native modal is active. |
| Focus animation continued while Timer Pause was active. | Stop the raster-frame timer while Timer Pause is active. |

## Verification evidence

| Verification | Evidence |
|---|---|
| Deterministic logic | 30/30 Node tests pass, including two standalone Focus files per character. |
| Syntax | Main, preload, and renderer pass Node syntax checks. |
| Dependency security | `npm audit` reports zero known vulnerabilities. |
| Network boundary | Source scan finds no application network calls. |
| Visual states | New side-by-side QA pairs in `artifacts/v3-focus-hands-qa/` confirm localized hand/prop activity for all five characters; real Electron captures cover collapsed, expanded, picker, Ready, Focus, Break, and Complete. |
| Local audio | A managed WAV automatically loaded and played in Break at persisted volume `0.42`. |
| Packaging | `npm run build:mac` produced the Apple Silicon `.app`. |
| Bundle metadata | Name `DaburuDoro`, ID `com.lvzihu.daburudoro`, version `3.0.0`. |
| Packaged art | `app.asar` contains `focus-1.png` and `focus-2.png` for all five presets; original and earlier derivative sheets remain as traceable source evidence. |
| Single instance | A second packaged launch using the same isolated profile exited and restored the existing process. |

Reproducible commands:

```bash
npm test
npm audit --audit-level=high
rg -n "https?://|fetch\(|XMLHttpRequest|WebSocket|net\.request" src
npm run build:mac
```

## Privacy and safety boundary

- No imported user music is committed or packaged.
- Renderer preference writes cannot inject managed asset paths; only native
  music-import IPC handlers can update those maps.
- The app accepts only the documented audio extensions.
- Remove operations refuse files outside DaburuDoro's managed audio root.
- The Content Security Policy permits local media but no remote connections.
- Public preset art is original and uses color identifiers only.

## Owner acceptance gate

Before merge and release, complete one five-cycle real session while changing
characters at least twice, using all five revised Focus activities and two
local music files, hiding/restoring in Focus and Break, and dragging directly
after clicking the desktop. Confirm hand/prop motion without body drift, exactly
one Blue bobber, correct outgoing ownership, sleeping art, smooth five-second
fade, timing, and persistence.

## Portfolio narrative

**V1 proved ambient body doubling. V2 made it dependable. V3 made it personal.**
The implementation demonstrates product scoping, deterministic domain modules,
secure local-file ownership, Electron/macOS input debugging, art-pipeline QA,
and the willingness to reject a visually flawed technical approach even after
it was already built.
