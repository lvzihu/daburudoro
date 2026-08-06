# DaburuDoro v3 acceptance follow-up — 2026-08-06

Status: implementation and automated visual QA complete; owner recheck pending.

This is a new document. It does not modify or replace the frozen
`daburudoro-v3-prd.md` or the earlier
`daburudoro-v3-acceptance-amendment-2026-08-06.md`.

## Owner observations

1. Yellow's gaming animation is approved and remains unchanged.
2. Blue's short fishing-line frame has a translucent remnant at the rod tip.
3. Purple's raised hand has a small yellow/green finger-like fringe.
4. Red is nearly approved, but the laptop-back mark changes color and one
   moving hand develops an unnatural finger line.
5. The character-level Hide control needs only a bare cross, without a circle.
6. Sleeping is too static; all five characters need the same three moving `Z`s.
7. The compact time-remaining bar should be vertical on the left instead of
   horizontal at the bottom.

## Implemented correction

- Blue's short line is redrawn as an opaque line connected directly to the rod
  tip; the old long line and bobber remain fully cleared.
- Purple's raised-hand fringe is neutralized without changing the hand pose.
- Red frame two now starts from frame one and changes only the rear typing hand.
  The laptop, laptop-back mark, front hand, body, desk, and chair stay identical.
- Hide is a bare `×` with no border, filled circle, or shadow.
- Break overlays three staggered `Z`s that rise and fade. The same overlay is
  shared by every preset and freezes when the timer is paused.
- The progress bar is a 7-pixel vertical track at the left edge. Its 42-pixel
  interaction area preserves an easy click target and the chevron remains the
  expand/collapse control.

## Acceptance checks

1. Yellow remains visually identical to the previously approved build.
2. Blue has no gap, translucent remnant, or second line at the rod tip.
3. Purple has no colored protrusion beside the raised fingers.
4. Red's laptop mark and front hand do not change between Focus frames; the
   rear hand supplies the typing motion without a stray finger line.
5. Hide appears as only `×` and still responds reliably.
6. Three `Z`s animate during every character's Break and nowhere else.
7. The vertical progress fill tracks time remaining and still opens the panel.
8. Character dragging, click-through recovery, music, and timing remain intact.

## Verification record

- The deterministic raster build rejects changes outside each declared motion
  region and rejects an old Blue bobber in the short-line area.
- Side-by-side source evidence is regenerated in
  `artifacts/v3-focus-hands-qa/`.
- All 35 Node tests pass, including new acceptance checks for the sleeping `Z`s,
  vertical progress bar, bare Hide cross, targeted raster repairs, and reliable
  visual-QA startup.
- Electron captures passed for Blue's short line, Purple's hand, both Red Focus
  frames, three Break-animation moments, the vertical progress bar, bare Hide
  cross, and expanded timer panel.
- The Apple Silicon v3 package was rebuilt with all ten Focus frames and the new
  Break/UI behavior; the correction is ready to push to the existing pull
  request.
