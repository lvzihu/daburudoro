# Changelog

All notable changes to DaburuDoro are recorded here. Product requirements are
kept in separate, frozen PRDs so the intended scope and the shipped result can
be compared without rewriting history.

## [2.0.0] — 2026-08-05

Released after owner testing and acceptance in
[#1](https://github.com/lvzihu/daburudoro/pull/1).

### Added

- A normal macOS app lifecycle with Dock and menu-bar access.
- Show, hide, restart-session, and quit actions from the menu-bar icon.
- Whole-minute Focus and Break settings plus a configurable cycle count.
- Native phase-change notifications and an optional gentle chime.
- Persisted settings, sound preference, expanded state, and window position.
- Multi-monitor position recovery and single-instance behavior.
- A compact character-first view with a thin progress indicator.
- An original standing-and-waving idle animation and custom app icon.
- Automated coverage for timer, persistence, and window-position logic.
- A local Apple Silicon `.app` build workflow.

### Changed

- Replaced interval-counting with deadline timestamps so elapsed time can be
  reconciled after sleep, stalls, or hiding the widget.
- Made the entire widget draggable, including the expanded control panel.
- Changed the cycle model so every focus period has a break, including the
  final cycle.
- Added Ready and Complete idle states instead of leaving the character in an
  activity animation.

### Fixed

- Break time now runs as part of every configured cycle instead of resetting
  immediately after the final focus period.
- A hidden app can be restored without launching a duplicate process.
- Saved positions that fall outside the connected displays recover to the main
  screen.
- Expanded controls no longer clip at the bottom of the widget.
- Packaged builds show the DaburuDoro icon instead of Electron's default icon.

### Verified

- 14 automated tests pass.
- `npm audit` reports zero known vulnerabilities.
- The app source contains no network calls.
- `electron-builder` produces `DaburuDoro.app` version 2.0.0 for Apple Silicon.
- The packaged app passed hide, restore, and second-launch smoke tests.

See the [draft release notes](docs/releases/v2.0.0.md) and
[engineering build trace](docs/build-traces/v2-daily-usability.md).

## [1.0.0] — 2026-08-05

The proof-of-concept release established the core body-doubling experience:

- A transparent, always-on-top macOS desktop companion built with Electron.
- One original yellow character with focus and break animations.
- A visible countdown, phase label, and cycle progress.
- Start, pause, and reset controls.
- A deterministic timer state machine with five automated tests.
- Swappable local character frames with no account, network, or telemetry.

The original build was committed separately from the product rename so both
steps remain visible in Git history. Version tag:
[`v1.0.0`](https://github.com/lvzihu/daburudoro/tree/v1.0.0).

[2.0.0]: https://github.com/lvzihu/daburudoro/releases/tag/v2.0.0
[1.0.0]: https://github.com/lvzihu/daburudoro/tree/v1.0.0
