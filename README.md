# DaburuDoro

A floating, always-on-top desktop **Pomodoro companion** that gives a
body-doubling feeling: a cartoon character that visibly "works" (typing) while
you work and does a break activity (piano) on breaks, mirroring your timer.
macOS, Electron. Personal, non-commercial.

## How this project is specced and versioned

The build is done by an AI coding agent (Claude Code / Codex); Priscilla directs
and reviews. To keep that clean, we follow one convention:

**1. PRDs are frozen, per-version, and point *forward*.**
Each version/milestone gets its own scoped spec that assumes the previous one is
built:

- `daburudoro-v1-prd.md` — the v1 build spec (frozen; do not rewrite it).
- `daburudoro-v2-prd.md` — the frozen daily-usability build spec.
- `daburudoro-v3-prd.md` / `daburudoro-v4-prd.md` / etc. — future increments,
  written when we're ready for them.

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
**local, untracked drop-in only** (characters load from
`assets/characters/<id>/`, so swapping art needs no code change).

## Status

- v1 released as `v1.0.0`.
- v2 implements the approved `daburudoro-v2-prd.md` scope and was owner-tested
  and accepted for the `v2.0.0` release in
  [PR #1](https://github.com/lvzihu/daburudoro/pull/1).

## Version history and build evidence

- [`CHANGELOG.md`](CHANGELOG.md) — reader-friendly improvements by version.
- [`docs/releases/v2.0.0.md`](docs/releases/v2.0.0.md) — v2 release notes.
- [`docs/build-traces/v2-daily-usability.md`](docs/build-traces/v2-daily-usability.md)
  — decisions, implementation sequence, verification, and acceptance gate.
- [`daburudoro-v1-prd.md`](daburudoro-v1-prd.md) and
  [`daburudoro-v2-prd.md`](daburudoro-v2-prd.md) — frozen requirements for
  comparing intent with each build.

## Run it

Requires Node.js 22+ on macOS.

```bash
npm install
npm start
```

Run the timer-state tests with `npm test`.

## Build the macOS app

```bash
npm run build:mac
```

The local app is produced at `dist/mac-arm64/DaburuDoro.app`. In Finder, drag
that app into **Applications**. It can then be launched from Applications,
Spotlight, or the Dock without opening a terminal.

This development build is not notarized. If macOS blocks its first launch,
Control-click the app in Applications, choose **Open**, then confirm **Open**.

## Use v2

- Drag the character to move the entire widget. DaburuDoro remembers the last
  visible position and recovers to the main screen if a monitor is removed.
- Click the thin line beneath the character to open or collapse the controls.
- Set whole-minute Focus and Break durations plus the number of Cycles. Every
  cycle includes its break, including the final cycle.
- Hide and restore the widget from either its control panel or the DaburuDoro
  menu-bar icon. The active timer continues while hidden.
- The menu-bar icon provides **Show Widget**, **Hide Widget**,
  **Restart Session**, and **Quit DaburuDoro**.
- Native notifications and one gentle chime mark phase transitions. Sound can
  be turned off in the control panel.
- Quit ends the active session. The next launch restores settings and position,
  but begins idle.

## Character assets

- Character frames are discovered by filename from
  `assets/characters/yellow/`. Replace `working-*.png`, `break-*.png`, and
  `idle-*.png` to change the art without editing code.
- Focus uses the typing loop, Break uses the piano loop, and Ready/Complete uses
  the standing-and-waving loop.
- The widget passes mouse clicks through its transparent/non-control area.
