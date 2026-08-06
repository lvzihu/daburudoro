# DaburuDoro v3 PRD — Characters, Activities, and Break Music

**Status:** Approved for implementation  
**Date:** 2026-08-05  
**Target release:** `v3.0.0`  
**Implementation branch:** `feat/v3-characters-audio`

## 1. Versioning instruction

This document is the frozen build specification for DaburuDoro v3. It assumes
`v2.0.0` is already released.

Do not edit the v1 or v2 PRDs to describe v3 behavior. Do not add features
assigned to v4 or the explicit non-goals below. If implementation uncovers a
material product decision, record it in a new decision note or request owner
review rather than silently changing this PRD.

## 2. Problems to solve

V2 is usable as a daily timer, but the companion experience is not yet
personalized or consistently interactive:

1. Only the yellow character exists.
2. A character cannot be changed between Focus blocks in a multi-cycle session.
3. Every character needs a recognizable activity rather than sharing one
   generic animation.
4. Break should feel like an intentional rest experience, not another activity.
5. The existing transition chime cannot provide character-specific music.
6. The thin progress bar is too difficult to click when opening the controls.
7. Hide/Show is discoverable in the menu bar and expanded panel, but not on the
   collapsed character.
8. Character dragging sometimes passes through to the desktop. Touching the
   progress bar can restore dragging, which indicates that mouse-passthrough
   state is becoming stuck.
9. The current generated animation frames redraw the entire illustration, so
   the desk, chair, lower body, and other supposedly fixed elements visibly
   shift between frames.
10. A future user may want to substitute a personal static image, such as a pet,
    without editing source code.

## 3. V3 goal

Make DaburuDoro feel like a selectable cast of dependable body-doubling
companions: one character at a time, five distinct Focus activities, a shared
sleeping Break behavior, automatic per-character local music, simple static
artwork substitution, and reliable pointer interactions.

V3 must preserve the released v2 timer, lifecycle, persistence, privacy, and
compact character-first behavior.

## 4. Product principles

- **One companion, not a crowd.** Exactly one character is visible at a time.
- **Change at a natural boundary.** Character changes happen before a session
  or during Break and apply to the next Focus block.
- **Break belongs to the outgoing character.** Changing the next character must
  not interrupt the current sleeping character or music.
- **Local by default.** Artwork and music imports stay on the device. No upload,
  account, analytics, streaming integration, or background network request.
- **Stable animation.** Only the intended moving element may change between
  animation frames.
- **Small UI additions only.** Fix discoverability and clickability in v3; save
  the comprehensive visual redesign for v4.

## 5. Character roster

V3 ships five original, non-identifiable preset characters. Public names and
file identifiers use colors only.

| Character | Focus activity | Visual direction |
|---|---|---|
| Yellow | Playing games | Interacting with a handheld controller or game screen |
| Blue | Fishing | Holding or tending a fishing rod |
| Green | Hosting a radio show | At a microphone with headphones or radio controls |
| Red | Reading books | Reading an open book |
| Purple | Directing a movie | Watching a production monitor or directing a scene |

The five colors are blue, red, green, yellow, and purple. Personality may be
communicated through generic posture, props, and color, but committed artwork
must not include a real person's name, group name, logo, trademark, or
identifiable likeness.

Reference images may be considered privately during art exploration. They are
inputs for mood, color, clothing energy, or pose—not instructions to reproduce
an identifiable person.

## 6. Character state model

Each preset character supports these states:

1. **Ready:** one static standing image.
2. **Focus:** a short activity animation using at least two aligned frames.
3. **Break:** one static sleeping image.
4. **Complete:** play one short wave sequence once, then show the static standing
   Ready image.

All selected Focus activities occur while the user's timer is in Focus. All
preset characters use the same conceptual Break activity—sleeping—but each has
their own original color-matched sleeping illustration.

Pause freezes both timer and character animation. Break is already static. A
completed wave must not loop indefinitely.

## 7. Character selection and cycle behavior

### 7.1 Initial selection

- Ready mode provides a character selector before the session begins.
- The most recently selected character is restored on the next launch.
- Starting a session uses the currently selected character.

### 7.2 Changing during Break

- A small five-hats control appears at the bottom-right while Ready or in Break.
- Clicking it opens a compact picker containing all five color characters and
  any configured static replacement.
- The picker is not available during an active Focus block.
- A selection made during Break is queued for the next Focus block, regardless
  of the configured Focus duration or the number of cycles in the session.
- If no new character is selected, the current character continues.

### 7.3 Outgoing and incoming ownership

If Yellow completes Focus and the user chooses Blue during Break:

- Yellow remains visible and sleeping for the current Break.
- Yellow's assigned music continues unchanged.
- The picker shows Blue as the next character.
- Blue appears only when the next Focus block begins.

This rule prevents character selection from restarting or interrupting Break.

## 8. Per-character Break music

### 8.1 Source and privacy

- Each preset character can be assigned one local audio file.
- Supported v3 inputs are MP3, M4A, and WAV.
- A native file picker selects the file.
- DaburuDoro validates the format, copies the file into Electron's private
  `userData` directory, and stores only the managed local reference.
- The original file does not need to remain in its source folder after a
  successful import.
- Music files are never copied into the repository, packaged application, build
  trace, logs, telemetry, or GitHub Release.
- DaburuDoro ships no copyrighted commercial music.

### 8.2 Playback rules

- When Break begins, the outgoing character's assigned music starts
  automatically inside DaburuDoro.
- Preserve the v2 native Break notification. The existing short transition
  chime may finish before music begins so the sounds do not collide.
- Play the assigned file once. Do not loop it.
- If the file ends before Break, the remainder of Break is silent.
- If audio is still playing when five seconds remain, fade it smoothly to
  silence across those final five seconds.
- Stop the audio completely when Focus begins or the session ends.
- Timer Pause also pauses Break audio; Resume continues it. V3 does not add a
  separate music play/pause control.
- Hiding the widget does not stop Break audio.
- Reset, Restart Session, and Quit stop audio immediately.
- Sleep/wake reconciliation must not replay stale music or start multiple
  overlapping tracks.

### 8.3 Controls and failure behavior

- Provide one persisted global volume control for all character music.
- Each character setting shows whether a track is assigned and provides Replace
  and Remove actions.
- If a track is absent, missing, unsupported, or cannot be decoded, Break still
  runs correctly and the UI reports the problem without crashing.
- The existing v2 sound toggle continues to control transition chimes. Break
  music has its own global volume and an explicit mute state at zero volume.

YouTube, streaming services, embedded web players, playlists, automatic song
search, and browser automation are not part of v3.

## 9. Static custom artwork import

V3 supports a simple local image substitution without supporting custom
animation packages.

- Accept PNG, JPG/JPEG, and WEBP through a native file picker.
- Validate that the selection decodes as an image; reject SVG, HTML, executable,
  or disguised unsupported content.
- Copy the validated image into the app's private `userData` directory.
- Allow the user to attach the image to one of the five preset color slots.
- The imported image replaces that slot's Ready and Focus appearance and remains
  static in v3.
- During Break, show the underlying preset color character's sleeping image—not
  the imported image.
- A custom image remains static on Complete because v3 imports only one frame.
- The slot retains its preset color, Break music assignment, and sleeping image.
- Provide Replace, Remove, and restore-preset actions.
- Persist the replacement locally between launches.

Example: a user replaces Yellow's Ready/Focus appearance with a cat photo.
During Break, the original yellow character sleeps and Yellow's assigned music
plays. Removing the custom image restores Yellow's preset Focus animation.

## 10. Animation stability

Generated activity frames must not be independent redraws of the complete
scene.

- Build every sequence from one locked master illustration.
- Keep canvas size, character position, furniture, props, outlines, lighting,
  and transparent padding identical across frames.
- Isolate the intended moving part into a small declared motion region.
- Composite that region over the shared base to create each frame.
- Add an automated image-difference check that fails if pixels change outside
  the declared motion region, with a small documented anti-aliasing tolerance.
- Preview every sequence as a loop before acceptance.

For the existing yellow animation, rebuild or realign the sequence so the desk,
chair, legs, and lower body do not move when only the hand should move.

## 11. Compact interaction improvements

### 11.1 Expand and collapse control

- The thin line remains the phase progress indicator.
- Add a visible centered chevron/arrow attached to the line.
- Show a down chevron when collapsed and an up chevron when expanded.
- The visible arrow may remain small, but its effective click target must be at
  least 44 × 32 CSS pixels.
- Clicking the arrow or its surrounding handle area toggles the panel.
- Provide hover, pressed, pointer-cursor, tooltip, and keyboard-focus states.
- Accessible labels change between `Show timer controls` and
  `Hide timer controls`.

### 11.2 Character-level Hide control

- Add a subtle `×` at the upper-right of the character area.
- The control remains available while the widget is visible, including when the
  panel is collapsed.
- Give it a generous click target and a visible hover/focus state.
- Accessible label and tooltip: `Hide DaburuDoro`.
- Clicking it hides the widget without confirmation and without stopping the
  timer or Break music.
- It does not mean Quit or Reset. The menu-bar icon restores the widget.
- Mark the control as non-draggable so clicking it cannot move the window.

The five-hats selector, chevron, and `×` should fit the current compact visual
language. A comprehensive visual redesign is not part of v3.

## 12. Reliable mouse hit-testing and dragging

The renderer currently toggles Electron's whole-window mouse-passthrough state
from DOM `mousemove` targets. Once the window begins ignoring mouse clicks, the
drag region does not always receive the event needed to become interactive
again. The non-drag progress bar can reset the state, matching the owner-observed
failure.

Replace that fragile feedback loop with deterministic hit testing:

- Define explicit interaction rectangles for the character drag surface,
  chevron, Hide control, character selector, and expanded panel.
- Move the cursor-position decision into a layer that can observe the global
  cursor even while the BrowserWindow is ignoring clicks. On macOS/Electron,
  the main process may use the screen cursor position and current window bounds.
- Convert cursor coordinates to window-local coordinates and enable mouse input
  whenever the cursor is inside an active interaction rectangle.
- Allow click-through only outside those rectangles.
- Recompute rectangles after expand/collapse, show/restore, layout changes, and
  display-scale changes.
- Force a safe interactive state when the widget is shown or restored.
- Keep buttons and inputs in `no-drag` regions and the remaining companion/panel
  background draggable.
- Extract rectangle decisions into a deterministic module with automated tests.

Do not solve the bug by disabling transparent-area passthrough across the entire
window; doing so would create a large invisible area that blocks the desktop.

## 13. Persistence

Persist locally:

- active preset character slot;
- queued next character when relevant;
- per-character managed music reference;
- global music volume;
- per-slot custom static image reference;
- existing v2 timer settings, sound setting, expanded state, and window
  position.

Do not persist an active running session across Quit. Relaunch begins Ready, as
in v2.

If a managed asset disappears or becomes unreadable, recover to the preset art
or silent Break and show a non-blocking explanation.

## 14. Existing v2 behavior that must remain

- Whole-minute Focus and Break durations and configurable cycle count.
- Every cycle includes its final Break.
- Timestamp-based sleep/stall reconciliation.
- Pause, Resume, confirmed Reset/Restart, and session completion.
- Native notifications and optional transition chime.
- Dock and menu-bar Show, Hide, Restart Session, and Quit lifecycle.
- Single-instance restoration.
- Draggable, persisted, multi-monitor-safe positioning.
- Always-on-top transparent macOS window.
- No accounts, telemetry, or application network calls.

## 15. Explicit non-goals

Do not include these in v3:

- More than one simultaneously visible character.
- Automatic character rotation without user selection.
- Custom multi-frame animation imports.
- User-recorded voice clips or configurable notification/completion sounds.
- YouTube, Spotify, Apple Music, or other streaming integration.
- Music search, download, playlists, or cloud storage.
- A major UI redesign or implementation from a design file.
- New long-break rules or other timer-model changes.
- Accounts, sync, analytics, telemetry, or remote APIs.
- Windows or Linux distribution.
- macOS signing, notarization, or App Store distribution.

Custom animation imports, voice-clip notifications, and the comprehensive UI
redesign are candidates for v4.

## 16. Acceptance tests

### Character selection and states

1. Ready allows selection of any of the five preset characters.
2. Starting shows the selected character's correct Focus activity.
3. Each preset activity uses stable aligned frames; no pixels visibly shift
   outside its declared motion region.
4. Break shows the outgoing character sleeping.
5. Selecting a new character during Break does not change the sleeping character
   or current music; the new character appears when the next Focus begins.
6. With no new selection, the same character continues into the next Focus.
7. Complete plays one wave for a preset character and then holds the standing
   image without looping.

### Break music

8. Assigning valid MP3, M4A, and WAV files copies them into managed local
   storage and survives relaunch.
9. Break automatically plays the outgoing character's assigned track once.
10. A short track ends without looping.
11. A long track fades smoothly across the final five seconds and is silent when
    Focus begins.
12. Global volume is remembered and zero volume produces silence.
13. Timer Pause/Resume pauses and resumes Break music; Reset, Restart, and Quit
    stop it.
14. Hide/Show does not interrupt playback.
15. Missing, removed, or invalid audio never interrupts timer progression.
16. A sleep/wake jump does not replay stale audio or layer multiple tracks.

### Custom static artwork

17. Valid PNG, JPG/JPEG, and WEBP imports survive relaunch and display in Ready
    and Focus for the assigned slot.
18. The imported image remains static and the underlying preset character sleeps
    during Break.
19. Removing the import restores the preset Ready and Focus art.
20. Invalid or disguised files are rejected without replacing working art.

### Interaction and lifecycle

21. The chevron and surrounding 44 × 32 target reliably expand and collapse the
    panel with mouse and keyboard.
22. The character-level `×` hides the widget without stopping the timer or
    music, and the menu-bar icon restores it.
23. After clicking through a transparent region to the desktop, returning
    directly to the character allows dragging without first touching the
    progress bar.
24. Repeat test 23 after expand/collapse, Hide/Show, app blur/refocus, and
    monitor-scale changes.
25. Transparent areas outside active rectangles continue passing clicks to the
    desktop.
26. Character, panel background, selector, chevron, and Hide control behave as
    their drag/no-drag roles specify.

### Regression

27. All existing v2 automated tests remain green.
28. Source contains no application network calls.
29. A packaged Apple Silicon app passes launch, second-instance, Hide/Show,
    timer, notification, audio, import, and multi-monitor smoke tests.

## 17. V3 success test

Complete one five-cycle real session while:

1. changing characters at least twice during Break;
2. using at least three different Focus activities;
3. assigning and hearing at least two different local music files;
4. confirming the correct outgoing character sleeps and owns each Break track;
5. confirming each long track fades over the final five seconds;
6. hiding and restoring the widget during both Focus and Break;
7. dragging the character directly after interacting with the desktop; and
8. completing without incorrect timing, animation drift, overlapping music,
   missed transitions, or lost settings.

After the session, capture one qualitative result: did changing companions and
hearing their Break music increase the feeling of body doubling without making
the widget distracting?

## 18. Key risks

- **Artwork scale:** five consistent activity sequences plus sleeping and
  completion states are the largest production cost.
- **Animation drift:** independent image generation will recreate the existing
  lower-body movement bug unless frames share a locked base and motion mask.
- **Audio compatibility:** Electron/macOS decoding can differ by format details;
  imports must be tested with representative MP3, M4A, and WAV files.
- **Copyright and privacy:** only user-selected local audio is allowed; no music
  is committed or distributed.
- **Pointer reliability:** transparent click-through and draggable regions are a
  platform-specific interaction boundary and require packaged-app testing, not
  browser-only confidence.
- **Scope creep:** the five-hats picker and audio settings need functional UI,
  but visual-system exploration belongs to v4.

## 19. Definition of done

V3 is ready to release only when:

- all acceptance and regression tests pass;
- the packaged application passes the five-cycle success test;
- all committed artwork satisfies the public likeness rule;
- imported artwork and music remain private and outside Git;
- release notes and an engineering build trace are committed;
- the owner approves the result in the v3 pull request; and
- the merged commit is tagged `v3.0.0` without modifying the v1 or v2 tags.
