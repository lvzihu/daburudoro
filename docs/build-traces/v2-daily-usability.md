# Build trace: v2 daily usability

This record preserves how DaburuDoro moved from a proof of concept to a usable
desktop application. It is implementation evidence for future retrospectives,
release notes, and Priscilla's portfolio site; it does not replace Git history.

## Build metadata

| Item | Value |
|---|---|
| Build date | 2026-08-05 |
| Frozen scope | [`daburudoro-v2-prd.md`](../../daburudoro-v2-prd.md) |
| Branch | `feat/v2-daily-usability` |
| Pull request | [#1 — Build v2 daily usability](https://github.com/lvzihu/daburudoro/pull/1) |
| Scope commit | `26997b0 docs: define DaburuDoro v2 scope` |
| Implementation commit | `b7b0cb0 feat: make DaburuDoro usable as a daily macOS app` |
| Base release | [`v1.0.0`](https://github.com/lvzihu/daburudoro/tree/v1.0.0) |
| Release | [`v2.0.0`](https://github.com/lvzihu/daburudoro/releases/tag/v2.0.0) |
| Release state | Owner tested and accepted on 2026-08-05 |

## Starting point and observed problems

Version 1 demonstrated a transparent always-on-top animated Pomodoro widget,
but it was still a prototype:

- It had no normal app entry point or packaged macOS application.
- The window opened in the center and could not be positioned reliably.
- Hiding, restoring, restarting, and quitting were not a complete lifecycle.
- Focus and break durations were hardcoded.
- The final focus period ended the session without running its paired break.
- Interval-counting could not accurately account for sleep or event-loop stalls.
- The controls occupied too much visual attention for a body-double companion.
- There were no native notifications, sound cue, or neutral idle state.

These observations became a new v2 PRD. The v1 PRD and `v1.0.0` tag were left
unchanged so the original intent remains auditable.

## Scope boundary

V2 was intentionally limited to daily usability: application lifecycle,
configurable whole-minute timing, reliable phase progression, compact controls,
notifications, persistence, and one idle animation.

Five-character selection and activities were assigned to v3. The larger UI
redesign was assigned to v4. This prevented visual exploration from blocking
reliability work.

## Implementation sequence

1. **Freeze the requirements.** Converted the product conversation into a new
   versioned PRD with explicit acceptance tests and deferred features.
2. **Make time deterministic.** Rebuilt the timer around absolute deadlines,
   added configurable durations and cycles, and defined a final break for every
   cycle.
3. **Persist only durable state.** Added atomic storage for preferences and
   window position while deliberately starting each app launch in an idle state.
4. **Build the desktop lifecycle.** Added Dock and menu-bar access, show/hide,
   confirmed restart, quit, single-instance recovery, and monitor-aware position
   restoration.
5. **Reduce visual weight.** Made the full surface draggable and introduced a
   collapsed character-plus-progress-line state with on-demand controls.
6. **Signal transitions.** Added native notifications and a locally generated,
   optional chime.
7. **Complete the character state model.** Added original standing/waving idle
   frames alongside the existing focus and break loops.
8. **Package and test the product.** Built an Apple Silicon `.app`, inspected
   its metadata, and exercised real hide/restore/second-launch behavior.

## Architecture decisions

| Decision | Reason |
|---|---|
| Timestamp deadlines instead of decrementing a counter | Correct elapsed time survives hiding, sleep, and delayed callbacks. |
| Timer logic separated from Electron/UI | Behavior can be tested quickly without opening a desktop window. |
| Settings and window-position modules kept independent | Persistence and monitor recovery can be tested deterministically. |
| Single-instance lock | A second launch should restore the companion, not create another timer. |
| Native notifications plus Web Audio chime | Uses local OS behavior without an account, server, or downloaded sound file. |
| Settings persist, active session does not | Relaunch remains predictable and avoids silently resuming a stale session. |
| Original local character frames | Art can be swapped without code changes while keeping the public repo defensible. |

## Issues found during the build

| Finding | Resolution |
|---|---|
| V1 stopped after the final focus instead of running its five-minute break. | V2 models every cycle as Focus → Break, including the final cycle. |
| `electron-builder` detected a local developer certificate and attempted signing, which was outside v2 scope. | Packaging explicitly sets `identity: null`; signing and notarization remain a future distribution task. |
| The first packaged build used Electron's generic icon. | Added an original DaburuDoro icon and included it in the macOS build. |
| A 430px expanded window clipped the bottom controls. | Increased the expanded window height to 460px and visually rechecked the packaged app. |
| Hiding could make a desktop app feel lost. | Added a persistent menu-bar entry and verified that a second launch restores the existing instance. |

## Verification evidence

The following checks were run against the v2 implementation:

```bash
npm test
npm audit --audit-level=high
rg -n "https?://|fetch\(|XMLHttpRequest|WebSocket|net\.request" src
npm run build:mac
```

| Verification | Evidence |
|---|---|
| Timer, settings, and window logic | 14/14 automated tests passed. |
| Dependency security | `npm audit` reported zero vulnerabilities. |
| Privacy boundary | Source scan found no network-call implementation in `src/`. |
| Packaging | `dist/mac-arm64/DaburuDoro.app` built successfully. |
| Bundle identity | Display name `DaburuDoro`, ID `com.lvzihu.daburudoro`, version `2.0.0`. |
| Real app behavior | Packaged app opened in collapsed and expanded states; hide removed the window while retaining menu-bar access; a second launch restored the same instance. |

The distributable output is intentionally ignored by Git. Source, configuration,
tests, documentation, and the commands needed to reproduce it are versioned.

## Acceptance result

Automated and packaged smoke tests were completed, followed by hands-on owner
testing. On 2026-08-05, the owner confirmed that the app looked good and
approved the `v2.0.0` release. The acceptance criteria covered:

- custom focus and break values are respected;
- the final break runs;
- pause, resume, reset confirmation, hide, restore, and dragging feel correct;
- notifications and the sound toggle behave as expected;
- the compact view is useful during focused work.

No release-blocking issue was reported during acceptance.

## Portfolio narrative

**V1 proved the interaction; v2 made it dependable.** The improvement was not
just a larger feature list. It moved timing into a testable domain model, treated
desktop lifecycle as part of the product, added privacy-preserving persistence
and notifications, and established a repeatable PRD → branch → tests → packaged
smoke test → owner acceptance → release workflow.
