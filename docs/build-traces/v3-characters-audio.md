# Build trace: v3 characters and Break music

This trace connects the v3 product conversation to implementation evidence for
future releases and Priscilla's portfolio site.

## Build metadata

| Item | Value |
|---|---|
| Build date | 2026-08-05 |
| Frozen scope | [`daburudoro-v3-prd.md`](../../daburudoro-v3-prd.md) |
| Branch | `feat/v3-characters-audio` |
| Planning commit | `70812b3 docs: define DaburuDoro v3 scope` |
| Implementation commit | `bd46c39 feat: add v3 companions and break music` |
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
| `asset-manager.js` | Validate/copy/remove private managed image and audio files |
| `audio-policy.js` | Clamp volume and calculate the final five-second fade |
| `pointer-regions.js` | Sanitize rectangles and determine cursor acceptance |
| `settings-store.js` | Migrate and persist v3 preferences without breaking v2 data |
| Electron main process | Native file dialogs, managed URLs, global cursor polling, lifecycle |
| Renderer | Character picker, playback, sprite animation, settings, timer integration |

The timer state machine was deliberately left unchanged. Character and media
state react to timer transitions instead of becoming part of timing logic.

## Important behavioral rules implemented

- Only one character is visible.
- A Break selection is queued; it does not replace the outgoing sleeper or
  interrupt that character's music.
- The queued character becomes active exactly when the next Focus begins.
- A track plays once, does not loop, follows Timer Pause/Resume, continues while
  hidden, and fades using sub-second deadline precision.
- Static custom art replaces Ready/Focus/Complete for one color slot; the preset
  still sleeps during Break.
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

The final pre-release correction:

- remove all five CSS vector cues;
- derive Focus B deterministically from an exact copy of Focus A;
- change pixels only inside one declared activity region per character;
- preserve every original sheet and load a sibling `sheet-locked.png`; and
- freeze and resume that animation with Timer Pause/Resume.

This restores the PRD's two-raster-frame behavior without repeating v2's drift.
See the
[full art-production record](../art-direction/v3-character-sprites.md).

## Issues caught during the build

| Finding | Resolution |
|---|---|
| A hard clipped overlay produced a visible horizontal seam. | Rejected the clipped-overlay approach entirely. |
| Code-native cues looked disconnected from the frozen character. | Owner acceptance caught it; removed every runtime vector cue. |
| Alternating complete generated panels made the whole character shift. | Owner acceptance caught the v2 regression; replaced full-panel swapping with pixel-locked derivative sheets. |
| A strict image-edit prompt still rescaled and redrew the locked master. | Rejected the generated edit and built a deterministic Pillow/NumPy compositor with an outside-region equality assertion. |
| The released app's single-instance lock blocked development screenshots. | Added an isolated development profile for visual QA without quitting the user's running app. |
| HTML media autoplay could vary with Chromium policy. | Set Electron's explicit no-user-gesture-required autoplay policy for local assigned music. |
| Integer countdown values made the five-second fade step once per second. | Calculate playback gain from the precise timestamp deadline every 250ms. |
| A native import dialog blurred and collapsed the popover that opened it. | Suppress blur-collapse while the native modal is active. |
| Focus animation continued while Timer Pause was active. | Bind sprite animation play-state to the timer's paused UI state. |

## Verification evidence

| Verification | Evidence |
|---|---|
| Deterministic logic | 30/30 Node tests pass, including locked-sheet loading. |
| Syntax | Main, preload, and renderer pass Node syntax checks. |
| Dependency security | `npm audit` reports zero known vulnerabilities. |
| Network boundary | Source scan finds no application network calls. |
| Visual states | Side-by-side 512px QA pairs confirm localized activity for all five characters; real Electron captures cover collapsed, expanded, picker, Ready, Focus, Break, and Complete. |
| Local audio | A managed WAV automatically loaded and played in Break at persisted volume `0.42`. |
| Packaging | `npm run build:mac` produced the Apple Silicon `.app`. |
| Bundle metadata | Name `DaburuDoro`, ID `com.lvzihu.daburudoro`, version `3.0.0`. |
| Packaged art | `app.asar` contains all five original `sheet.png` files and all five runtime `sheet-locked.png` derivatives. |
| Single instance | A second packaged launch using the same isolated profile exited and restored the existing process. |

Reproducible commands:

```bash
npm test
npm audit --audit-level=high
rg -n "https?://|fetch\(|XMLHttpRequest|WebSocket|net\.request" src
npm run build:mac
```

## Privacy and safety boundary

- No imported user music or image is committed or packaged.
- Renderer preference writes cannot inject managed asset paths; only native
  import IPC handlers can update those maps.
- The app accepts only the documented image/audio extensions and validates
  image decoding.
- Remove operations refuse files outside DaburuDoro's managed asset roots.
- The Content Security Policy permits local media but no remote connections.
- Public preset art is original and uses color identifiers only.

## Owner acceptance gate

Before merge and release, complete one five-cycle real session while changing
characters at least twice, using at least three Focus activities and two local
music files, hiding/restoring in Focus and Break, and dragging directly after
clicking the desktop. Confirm correct outgoing ownership, sleeping art, smooth
five-second fade, stable visuals, timing, and persistence.

## Portfolio narrative

**V1 proved ambient body doubling. V2 made it dependable. V3 made it personal.**
The implementation demonstrates product scoping, deterministic domain modules,
secure local-file ownership, Electron/macOS input debugging, art-pipeline QA,
and the willingness to reject a visually flawed technical approach even after
it was already built.
