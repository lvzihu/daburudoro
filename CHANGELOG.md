# Changelog

All notable changes to DaburuDoro are recorded here. Product requirements are
kept in separate, frozen PRDs so the intended scope and the shipped result can
be compared without rewriting history.

## [3.0.0] — pending owner acceptance

Implementation is complete on `feat/v3-characters-audio`. Publish after the
owner completes the five-cycle acceptance test and merges the v3 pull request.

### Added

- Five original color companions with gaming, fishing, radio-hosting, reading,
  and movie-directing Focus activities.
- Character selection before a session and queued selection during Break.
- Static sleeping Break art and a one-time completion wave for every preset.
- One private local Break-music assignment per color, automatic playback,
  remembered global volume, and a five-second ending fade.
- Private static PNG, JPG/JPEG, and WEBP substitution for any preset slot.
- A compact five-hats companion picker.
- A visible expand/collapse chevron with a substantially larger hit target.
- A character-level `×` that hides without stopping the session.
- Automated character-session, managed-asset, audio-policy, and pointer-region
  tests.

### Changed

- Focus animation now uses pixel-locked derivative sheets: the companion and
  furniture stay identical while only a rasterized activity detail changes.
- Mouse acceptance is determined from global cursor position and explicit
  interaction rectangles instead of renderer `mousemove` events.
- Break music stays owned by the outgoing character when the next character is
  selected.
- Character selection is also available after completion, before Start Again.

### Fixed

- Returning directly from the desktop to the character no longer depends on
  touching the progress bar before dragging.
- The progress affordance is no longer a seven-pixel-only click target.
- Timer Pause freezes the Focus artwork animation and pauses Break audio.
- Native import dialogs no longer collapse the settings popover that opened
  them.

### Verified so far

- 30 automated tests pass.
- `npm audit` reports zero known vulnerabilities.
- The application source contains no network calls.
- A real managed WAV automatically played in Break at its persisted volume.
- Electron visual captures passed for collapsed, expanded, picker, five-color
  Ready, Yellow Focus, sleeping Break, and completion-wave states.
- `electron-builder` produces `DaburuDoro.app` version 3.0.0 for Apple Silicon.
- The packaged app contains all five sheets and rejects a duplicate launch.

See the [draft release notes](docs/releases/v3.0.0.md),
[engineering build trace](docs/build-traces/v3-characters-audio.md), and
[art-production record](docs/art-direction/v3-character-sprites.md).

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

[3.0.0]: https://github.com/lvzihu/daburudoro/compare/v2.0.0...feat/v3-characters-audio
[2.0.0]: https://github.com/lvzihu/daburudoro/releases/tag/v2.0.0
[1.0.0]: https://github.com/lvzihu/daburudoro/tree/v1.0.0
