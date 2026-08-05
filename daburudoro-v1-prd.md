# DaburuDoro — Product Requirements Document

> A floating desktop Pomodoro companion that gives a body-doubling feeling.
> **Owner:** Priscilla · **Status:** v1 spec, ready to build · **Build method:** implemented by an AI coding agent (Claude Code / Codex) with the owner directing and reviewing.

---

## 1. Purpose (read this first, agent)

This document is the build spec for **DaburuDoro v1**. Implement **only** what is in
"v1 Scope" and "Acceptance Criteria." Everything in "Non-Goals" and "Roadmap"
is explicitly **out of scope for v1** — do not build it, even if it seems easy.
When a detail is unspecified, prefer the simplest option that satisfies the
acceptance criteria, and leave a `// TODO(priscilla):` comment rather than
inventing product behavior.

## 2. Problem

The owner relies on **body doubling** (working alongside another person) to focus,
a common and effective strategy for ADHD. When a real body-double isn't
available, the existing substitutes fail: "study with me" YouTube videos are
boring, pull attention into the browser, and don't feel like company. There is
no lightweight, ambient presence that sits alongside her actual work.

## 3. Solution (one sentence)

A small, always-on-top, transparent desktop widget showing a cartoon character
who **visibly works while she works** — driven by a Pomodoro timer — so the
screen feels shared even when no one is there.

## 4. User

Single user, personal use. The owner herself: ADHD, strong analytics/PM
background, wants ambient presence + a light "someone's working too" feeling,
**not** surveillance or nagging. No other users, no accounts, no multi-tenant
concerns.

## 5. Platform & Stack (recommended)

- **Target OS:** macOS (Apple Silicon MacBook Air). macOS only for v1.
- **Framework:** **Electron** (character + timer built in HTML/CSS/JS). Chosen so
  the UI is plain web tech and the window can be transparent, frameless, and
  always-on-top.
- **Window:** a single `BrowserWindow` with
  `transparent: true`, `frame: false`, `alwaysOnTop: true`,
  `resizable: false`, `hasShadow: false`, and a small fixed size
  (~220×260 px). The window is **draggable** (via a CSS `-webkit-app-region: drag`
  handle) so she can position it, but must not block interaction with apps
  behind it outside the character's footprint.
- **Language/deps:** vanilla JS is sufficient; do not add a heavy front-end
  framework for v1. `electron` + `electron-builder` (packaging deferred — see
  Non-Goals) only.
- **Run in dev first:** `npm start` launches the widget. Do not worry about code
  signing / notarization in v1.

## 6. v1 Scope (build exactly this)

**6.1 The character**
- **One** character on screen: an **original, stylized cartoon** in a **yellow**
  color theme (this is the "yellow" character; see §9 on likeness).
- **Two visual states**, each a simple **2–3 frame loop** (frame-swap, ~0.4s per
  frame — no smooth/tweened animation required):
  - **Working** state → a **typing** animation. Shown during focus periods.
  - **Break** state → a **playing-piano** animation. Shown during break periods.
- **Swappable assets:** the character is loaded from image files in
  `assets/characters/<character-id>/` (e.g. `working-1.png`, `working-2.png`,
  `break-1.png`, `break-2.png`). The app reads whatever frames are in that
  folder. This lets the owner drop in a custom character later without code
  changes. Ship v1 with one original character folder.

**6.2 The timer (drives the character)**
- Fixed durations, **hardcoded in v1**: **35 min focus / 5 min break.**
- User sets **number of cycles** (integer, e.g. 5). One cycle = one 35-min focus
  + one 5-min break. After the last cycle's focus, the final 5-min break may be
  skipped or shown — either is acceptable; document the choice.
- On **Start**, runs focus→break for the chosen number of cycles, then **stops**.
- Character state is bound to timer phase: **focus → working/typing**,
  **break → break/piano**, **stopped/idle → working/typing at rest is fine**
  (pick one idle visual and document it).

**6.3 Controls (minimal UI)**
- A **cycle-count input** (number).
- **Start**, **Pause** (toggles to Resume; can pause at any point), **Reset**.
- **Display:** current countdown (mm:ss), current phase label
  (e.g. "Focus" / "Break"), and cycle progress (e.g. "Cycle 2 / 5").

## 7. Non-Goals (do NOT build in v1)

- Multiple characters / character **selection** / multi-select on screen.
- More than two activities per character; any **activity-arrangement UI**.
- **Ambient audio** / sound.
- **Idle detection** or any **reacting to the user** (no "it notices you stopped").
- **Adjustable** focus/break durations; long-break-after-4-cycles rule.
- **Settings persistence** across launches (allowed but optional; if trivial,
  persist only the last cycle-count — nothing else).
- **Packaging / code signing / notarization**, auto-update, installers.
- **Windows / Linux** support.
- Any **accounts, network calls, telemetry, or data collection.** The app is
  fully offline and local.

## 8. Acceptance Criteria (v1 is "done" when all pass)

1. `npm start` opens a small window that is **transparent, frameless, and stays
   on top** of other apps (e.g. floats over a code editor / browser).
2. The window can be **repositioned by dragging** and does not intercept clicks
   outside the character/controls footprint.
3. The user can **enter a cycle count**, press **Start**, and the timer counts
   down 35:00 for focus, then 5:00 for break, repeating for the chosen number of
   cycles, then stopping.
4. During **focus** the character plays the **typing** loop; during **break** it
   plays the **piano** loop; the switch happens exactly at phase transitions.
5. **Pause** halts the countdown and animation mid-phase and **Resume** continues
   from the same point; **Reset** returns to the initial idle state and clears
   progress.
6. Current **countdown, phase, and cycle progress** are visible and correct at
   all times.
7. Replacing the PNG frames in `assets/characters/<id>/` changes the on-screen
   character **without code edits**.
8. Repository contains **only original art** and **no real-person names or
   likenesses** (see §9). No network calls exist in the codebase.

## 9. Character likeness — hard constraint for the repo

The character designs are **original cartoons loosely inspired** by a set of five
performers, distinguished by each performer's **signature color** (blue, red,
green, yellow, purple). v1 ships the **yellow** one. **Do not** name any real
person, real group, or use identifying likeness/logos anywhere in the code,
assets, filenames, commit messages, or docs. Keep names generic (e.g.
`yellow`, `pianist`). Any personal, real-person-styled asset the owner adds
stays a **local drop-in only** and must never be committed. Rationale: the repo
is portfolio/job-search material and must stay publicly defensible;
non-commercial personal use.

## 10. Roadmap (post-v1, for context only — not part of this build)

- **M2 — Timer flexibility:** adjustable focus/break durations; long break after
  N cycles; persist settings.
- **M3 — The five characters:** all five color-themed originals; a selection UI;
  allow **multiple** characters on screen at once.
- **M4 — Activities:** 3–5 activities per character; let the user arrange which
  character does what.
- **M5 — Ambient audio:** optional soft working/piano sounds.
- **M6 (maybe never):** idle detection / reactions.
- **Packaging:** build a distributable `.app` with `electron-builder`; handle
  Gatekeeper.
- **Private track:** owner's own custom character assets as untracked local
  drop-ins.

## 11. Open questions (unresolved during scoping — decide before/along the build)

- **Owner's weekly time / review cadence** for directing the agent — not yet set.
- **Sharper success metric than the acceptance criteria:** the real test is
  whether the owner *actually uses it for a focus session and it feels like
  company.* Consider a lightweight check-in after first real use.
- **Idle-state visual** when the timer is stopped (pick + document).
- **Final-cycle trailing break:** show it or skip it (pick + document).

## 12. Key risks

- **Transparent, frameless, always-on-top + click-through** behavior on macOS is
  the fiddliest part; verify early against the acceptance criteria before
  building out the timer/animation.
- **Asset creation / frame consistency** across the two animation states.
- macOS **packaging/signing** later (deferred, but flagged).
