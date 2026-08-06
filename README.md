# DaburuDoro

A floating, always-on-top desktop **Pomodoro companion** that gives a
body-doubling feeling: choose an original cartoon companion with its own Focus
activity, then let it sleep while your local Break music plays. macOS, Electron.
Personal, non-commercial.

## How this project is specced and versioned

The build is done by an AI coding agent (Claude Code / Codex); Priscilla directs
and reviews. To keep that clean, we follow one convention:

**1. PRDs are frozen, per-version, and point *forward*.**
Each version/milestone gets its own scoped spec that assumes the previous one is
built:

- `daburudoro-v1-prd.md` — the v1 build spec (frozen; do not rewrite it).
- `daburudoro-v2-prd.md` — the frozen daily-usability build spec.
- `daburudoro-v3-prd.md` — the frozen characters, activities, and Break-music
  build spec.
- `daburudoro-v3-acceptance-amendment-2026-08-06.md` — owner-test corrections
  recorded separately without rewriting the frozen v3 PRD.
- `daburudoro-v4-prd.md` / etc. — future increments, written when we're ready
  for them.

Reason: coding agents build best from small, sharp specs and tend to over-build
from one big evolving document. Frozen per-version PRDs also leave a dated trail
of what each stage actually scoped — good portfolio narrative.

**2. Git history + `progress-log.md` are the "current state" record.**
The PRDs never track what already exists — the repo does. Each milestone becomes
a **branch → real commits → a PR you merge**. `progress-log.md` (at the
coding-ai root) is the human-readable version of the same history.

**3. The loop for each new iteration:**
say "ready for the next piece" → short grill (the `grill-me-ph` skill) →
new scoped `daburudoro-vN-prd.md` → hand to the agent on a fresh branch.

## Character assets & likeness rule

Characters are **original** cartoons, loosely inspired by five performers and
distinguished only by each one's signature color (blue, red, green, yellow,
purple). **Never** name or make identifiable any real person / group in the
code, assets, filenames, commits, or docs — the repo is portfolio material and
must stay publicly defensible. Any personal, real-person-styled asset is a
**local and untracked only**. A product-facing custom-picture workflow is
deferred to v5, after the v4 UI redesign.

## Status

- v1 released as `v1.0.0`.
- v2 implements the approved `daburudoro-v2-prd.md` scope and was owner-tested
  and accepted for the `v2.0.0` release in
  [PR #1](https://github.com/lvzihu/daburudoro/pull/1).
- v3 implements the frozen `daburudoro-v3-prd.md` scope on
  `feat/v3-characters-audio` and is awaiting owner acceptance.

## Version history and build evidence

- [`CHANGELOG.md`](CHANGELOG.md) — reader-friendly improvements by version.
- [`docs/releases/v2.0.0.md`](docs/releases/v2.0.0.md) — v2 release notes.
- [`docs/releases/v3.0.0.md`](docs/releases/v3.0.0.md) — draft v3 release notes.
- [`docs/build-traces/v2-daily-usability.md`](docs/build-traces/v2-daily-usability.md)
  — decisions, implementation sequence, verification, and acceptance gate.
- [`docs/build-traces/v3-characters-audio.md`](docs/build-traces/v3-characters-audio.md)
  — the v3 engineering and visual-production trace.
- [`docs/art-direction/v3-character-sprites.md`](docs/art-direction/v3-character-sprites.md)
  — reproducible character prompt set and asset rules.
- [`daburudoro-v1-prd.md`](daburudoro-v1-prd.md) and
  [`daburudoro-v2-prd.md`](daburudoro-v2-prd.md), and
  [`daburudoro-v3-prd.md`](daburudoro-v3-prd.md) — frozen requirements for
  comparing intent with each build.
- [`daburudoro-v3-acceptance-amendment-2026-08-06.md`](daburudoro-v3-acceptance-amendment-2026-08-06.md)
  — acceptance changes discovered without overwriting the v3 PRD.

## Run it

Requires Node.js 22+ on macOS.

```bash
npm install
npm start
```

Run all deterministic tests with `npm test`.

## Build the macOS app

```bash
npm run build:mac
```

The local app is produced at `dist/mac-arm64/DaburuDoro.app`. In Finder, drag
that app into **Applications**. It can then be launched from Applications,
Spotlight, or the Dock without opening a terminal.

This development build is not notarized. If macOS blocks its first launch,
Control-click the app in Applications, choose **Open**, then confirm **Open**.

## Use v3

- Drag the character to move the entire widget. DaburuDoro remembers the last
  visible position and recovers to the main screen if a monitor is removed.
- Click the centered chevron beneath the character to open or collapse the
  controls. Its generous hit area includes the progress line.
- Set whole-minute Focus and Break durations plus the number of Cycles. Every
  cycle includes its break, including the final cycle.
- Hide and restore the widget from either its control panel or the DaburuDoro
  menu-bar icon, or click the character-level `×`. The active timer and Break
  music continue while hidden.
- The menu-bar icon provides **Show Widget**, **Hide Widget**,
  **Restart Session**, and **Quit DaburuDoro**.
- Native notifications and one gentle chime mark phase transitions. Sound can
  be turned off in the control panel.
- Choose one of five color companions before starting. During Break, use the
  five-hats control to queue a different companion for the next Focus block.
- Each companion has one Focus activity: gaming, fishing, radio hosting,
  computer work, or directing. All five sleep during Break.
- In companion settings, assign one local MP3, M4A, or WAV file to each color.
  The outgoing character's music starts automatically, plays once, and fades
  during the final five seconds. One global volume is remembered.
- Quit ends the active session. The next launch restores settings and position,
  but begins idle.

## Character and media assets

- Original generated sprite sheets live at `assets/characters/<color>/sheet.png`.
  Runtime Focus uses standalone `focus-1.png` and `focus-2.png` assets so an
  adjacent sprite cell cannot bleed into the current frame.
- Focus locks the body and furniture pixel-for-pixel while a working hand and
  its prop change: controller, fishing line/bobber, mixer pad, keyboard, or
  director monitor.
- User-imported music is copied to Electron's private app-data directory. It
  never enters the repository, packaged app, or GitHub Release.
- Transparent areas outside active interaction rectangles pass clicks through;
  the character, controls, and panel remain reliably draggable or clickable.
