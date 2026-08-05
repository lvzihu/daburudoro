# DaburuDoro v2 — Daily Usability Product Requirements Document

> Make the existing floating body-double practical to launch, position, configure,
> hide, and trust during real focus sessions.
> **Owner:** Priscilla · **Status:** Approved scope, ready to build
> **Depends on:** DaburuDoro v1.0.0

---

## 1. Purpose and versioning rule

This document is the forward-looking build specification for **DaburuDoro v2**.
It assumes v1 is already implemented. The v1 PRD is historical and must not be
edited to describe v2 behavior.

Implement only the v2 scope and acceptance criteria below. Items assigned to v3,
v4, or Non-goals must not be added opportunistically.

## 2. Problems observed in v1

V1 proves the transparent, always-on-top character and timer concept, but it is
not yet convenient enough for daily use:

1. There is no obvious application entry point or reliable way to find, hide,
   reopen, restart, or quit the widget.
2. The small drag handle is difficult to discover and use, and the widget always
   opens in the middle of the screen.
3. Focus and break durations are fixed at 35 and 5 minutes.
4. A one-cycle session stops after focus, so its final break never runs.
5. The permanent control panel is visually dominant; the character should be the
   primary presence.
6. Phase changes and session completion have no notification or sound.
7. After completing a break, the character needs a distinct idle state instead
   of continuing the break activity.

## 3. V2 goal

Turn DaburuDoro into a small macOS utility that the owner can launch without the
terminal, place anywhere, configure for her current routine, hide and recover,
and trust to complete every focus/break phase.

## 4. User and platform

- **User:** One owner using the app locally for personal focus sessions.
- **Platform:** macOS on Apple Silicon.
- **Privacy:** Fully local and offline. No accounts, network calls, telemetry, or
  data collection.
- **Implementation:** Continue with Electron and vanilla HTML/CSS/JavaScript.

## 5. V2 scope

### 5.1 Application entry point and lifecycle

- Produce a real `DaburuDoro.app` that can be placed in `/Applications` and
  launched from Applications, Spotlight, or the Dock.
- Manual launch only. Do not start automatically at macOS login.
- While running, DaburuDoro appears in both:
  - the Dock, for familiar app discovery; and
  - the macOS menu bar, as a small utility icon.
- The menu-bar menu contains:
  - **Show/Hide Widget**
  - **Restart Session**
  - **Quit DaburuDoro**
- Hiding the widget keeps the application and active timer running.
- Selecting the Dock icon or **Show Widget** makes the widget visible again.
- Restarting an active session asks for confirmation, then starts the same saved
  configuration again from the first Focus phase.
- Quitting stops the application. Reopening it returns to idle with the last
  saved configuration; it does not resume a session that was active before Quit.
- Launching DaburuDoro while it is already running must show the existing widget,
  not create a second instance.

### 5.2 Positioning and multi-monitor behavior

- The character, progress line, and controls are one window and always move
  together.
- Dragging any non-interactive area moves the entire widget, including:
  - the character area;
  - the progress-line area; and
  - empty background inside the expanded controls.
- Buttons, inputs, and other interactive elements remain clickable and are not
  drag targets.
- Persist the last window position across Hide/Show, Quit/relaunch, and app
  updates.
- If the saved position is no longer visible because a monitor was disconnected
  or its resolution changed, place the entire widget within the main display's
  visible work area.

### 5.3 Custom timer configuration

- Provide three separate whole-number inputs:
  - **Focus minutes**
  - **Break minutes**
  - **Cycles**
- Default values are **35 Focus / 5 Break / 1 Cycle**.
- Accept positive whole numbers only. Reject blank, zero, negative, decimal, and
  non-numeric values with a clear inline validation message.
- One cycle always means **one Focus followed by one Break**.
- Every requested cycle includes its Break, including the final cycle.
- All breaks use the same user-defined duration. There is no long-break rule.
- Lock Focus, Break, and Cycles inputs while a session is active.
- Keep **Pause/Resume** and **Reset** available during an active session.
- Reset during an active session asks **“End this session?”** before returning to
  idle. Reset does not erase saved configuration.

### 5.4 Reliable background and sleep timing

- An active timer continues while the floating widget is hidden.
- Base progress on phase end timestamps rather than assuming that a one-second
  interval fired continuously.
- After macOS sleep or an application stall, calculate the correct current phase,
  cycle, and remaining time from elapsed wall-clock time.
- If multiple transitions elapsed during sleep, do not replay a backlog of
  sounds or notifications. On wake, show the current phase or Session Complete
  state and issue at most one relevant notification.
- Pause freezes the remaining duration; Resume creates a new phase end timestamp
  from that remaining duration.

### 5.5 Compact, character-first interface

- The character remains the primary visual element.
- In collapsed mode, show only:
  - the character; and
  - a thin progress line representing time remaining in the current phase.
- Use visually distinct progress-line colors for Focus and Break. Do not rely on
  color alone when the controls are expanded; the phase must also have a text
  label.
- Clicking the character or progress line opens a compact panel attached beneath
  the character.
- The expanded panel shows:
  - countdown in `mm:ss`;
  - current phase;
  - current cycle and total cycles;
  - Focus, Break, and Cycles inputs when idle;
  - Start, Pause/Resume, Reset, Hide, and Sound On/Off controls as applicable.
- Clicking elsewhere or selecting a collapse control closes the panel.
- Do not auto-collapse the panel on a timer.
- Dragging the widget works in both collapsed and expanded states, subject to the
  interactive-element exception in §5.2.

### 5.6 Notifications and sound

- At every phase transition, show a native macOS notification that identifies
  the phase beginning, for example **“Break started — 5 minutes.”**
- Play one short, gentle chime with each transition notification.
- After the final Break reaches zero, show **Session Complete**, play the same
  chime, and send a native completion notification.
- Provide one persisted **Sound On/Off** setting. V2 uses the same chime for all
  transitions.
- If macOS notification permission is unavailable or denied, the timer and sound
  continue to work; the UI must not fail.
- No ambient, looping, or activity audio is included in v2.

### 5.7 Character states

The single original yellow character has three states:

1. **Focus:** existing typing loop.
2. **Break:** existing piano loop.
3. **Idle/Complete:** new simple standing-and-waving loop with no speech bubble.

- Show Idle when the app launches, after Reset, and after Session Complete.
- Pause freezes the current character animation along with the timer.
- Continue loading frames from the swappable character asset directory using
  state-prefixed filenames such as `working-*`, `break-*`, and `idle-*`.
- All committed artwork remains original and generic. No real-person names,
  group names, logos, or identifiable likenesses may appear in repository
  content or public assets.

### 5.8 Persistence

Persist locally:

- last valid Focus minutes;
- last valid Break minutes;
- last valid Cycles value;
- Sound On/Off;
- collapsed or expanded display preference; and
- last valid window position.

Provide **Reset to Defaults**, which restores `35 / 5 / 1` and Sound On without
moving the window. Do not persist an active session across a full application
Quit.

### 5.9 Development and packaging

- Keep the timer state machine testable independently from Electron and the UI.
- Add automated tests for customizable durations, the final Break, sleep/stall
  reconciliation, pause/resume timestamps, completion, and validation.
- Add an Electron packaging command that produces `DaburuDoro.app` for local
  installation.
- Document installation, first launch, notification permission, Hide/Show, Quit,
  and how to replace character frames.

## 6. Explicit non-goals

Do not include these in v2:

- Multiple characters or character selection.
- Five-character artwork.
- Assigning activities to characters.
- More than the three Focus, Break, and Idle states.
- A major visual redesign or design-file implementation.
- A long-break-after-N-cycles rule.
- Launch at Login.
- Multiple notification sounds or a sound picker.
- Ambient or looping audio.
- Apple code signing, notarization, auto-update, or a polished installer.
- Windows or Linux support.
- Accounts, cloud synchronization, network access, telemetry, or analytics.

## 7. Acceptance criteria

V2 is complete only when all of the following pass:

### Application lifecycle

1. A locally built `DaburuDoro.app` can be placed in Applications and launched
   without using the terminal.
2. While running, the app has both a Dock presence and a menu-bar icon.
3. **Hide Widget** removes the floating window while leaving an active timer
   running; **Show Widget** restores the same window and current timer state.
4. **Quit DaburuDoro** stops the application, and relaunch returns to idle with
   the last saved configuration.
5. Relaunching while already running reveals the existing instance instead of
   opening a duplicate.

### Positioning and interface

6. The complete widget can be dragged from the character, progress line, or
   non-interactive panel background, and its buttons and inputs remain usable.
7. The saved position survives Hide/Show and Quit/relaunch.
8. A position from a disconnected monitor is recovered entirely onto the main
   display.
9. Collapsed mode shows only the character and thin progress line.
10. Click opens the compact control panel; click elsewhere or the collapse
    control closes it; the panel never disappears on an automatic timer.

### Timer behavior

11. The user can enter valid whole-number Focus, Break, and Cycles values and
    complete that exact schedule.
12. Invalid values are rejected clearly and do not start a session.
13. A one-cycle `35 / 5 / 1` session runs 35 minutes of Focus, then 5 minutes of
    Break, and only then completes.
14. Every multi-cycle session includes the final Break.
15. Inputs are locked during a session; Pause/Resume and confirmed Reset work
    without changing saved configuration.
16. Hiding the widget does not pause or reset the timer.
17. After simulated sleep or a stalled interval, the displayed phase, cycle,
    and remaining time match elapsed wall-clock time without replaying multiple
    stale alerts.

### Feedback, character, and persistence

18. Focus start, Break start, and Session Complete each produce the correct
    native notification and—when Sound is on—one gentle chime.
19. Denying notification permission does not break timing, sound, or controls.
20. Focus shows typing, Break shows piano, and Idle/Complete shows the new
    standing-and-waving loop; Pause freezes the active animation.
21. Focus, Break, Cycles, Sound, display preference, and window position persist
    across relaunch.
22. **Reset to Defaults** restores `35 / 5 / 1` and Sound On without moving the
    widget.
23. Automated tests cover the deterministic timer and reconciliation behaviors,
    and the source contains no network calls.

## 8. Success test

V2 succeeds when the owner can:

1. install and find DaburuDoro without the terminal;
2. position it once and reliably hide/show it;
3. configure her preferred whole-minute routine; and
4. complete **three real sessions** without incorrect timing, missing final
   breaks, lost window position, or failed phase feedback.

After those three sessions, capture a short qualitative check: did the character
feel like ambient company without the interface becoming distracting?

## 9. Key risks

- Unsigned local macOS apps may require a documented first-launch workaround.
- Frameless dragging must not steal clicks from interactive controls.
- Menu-bar, Dock, and single-instance behavior require Electron lifecycle testing
  on macOS, not only browser/unit tests.
- Sleep/wake correctness requires timestamp-based tests and a real-device check.
- Notification permission differs by machine state and must degrade gracefully.
- The new idle frames must remain visually consistent with the existing original
  character.

## 10. Forward roadmap

### V3 — Characters and activities

- Five original characters distinguished by color theme and personality.
- Choose one or multiple characters.
- Choose or assign activities.
- Explore reference images privately, while keeping committed/public artwork
  original, generic, and non-identifiable.

### V4 — Deliberate UI redesign

- Create or provide a design file first.
- Treat the design implementation as its own scoped PRD and milestone.
- Preserve the proven v2 lifecycle and timer behavior while changing presentation.

## 11. Open questions

None. Any new behavior discovered during implementation must be deferred to a
new versioned PRD unless it is necessary to satisfy an acceptance criterion in
this document.
