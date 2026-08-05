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
- `daburudoro-v2-prd.md` / `daburudoro-m3-characters.md` / etc. — the *next*
  increment, written when we're ready for it.

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

- v1 implemented. See `daburudoro-v1-prd.md` for the frozen scope.

## Run it

Requires Node.js 22+ on macOS.

```bash
npm install
npm start
```

Run the timer-state tests with `npm test`.

## v1 behavior decisions

- When stopped, the companion rests on the first working frame.
- The app stops after the final focus period; it does not add a trailing break.
- Character frames are discovered by filename from
  `assets/characters/yellow/`. Replace `working-*.png` and `break-*.png` to
  change the art without editing code.
- The widget passes mouse clicks through its transparent/non-control area.
