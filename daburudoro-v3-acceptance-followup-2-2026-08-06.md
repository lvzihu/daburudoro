# DaburuDoro v3 acceptance follow-up 2 — 2026-08-06

Status: implementation and automated visual QA complete; owner recheck required.

Implementation commit: `63fa1f7 fix: stabilize green selection and frames`

This is a new document. It does not modify or replace the frozen v3 PRD or
either earlier v3 acceptance document.

## Corrected owner feedback

1. The red/yellow finger-like artifact is on Green's mixer hand. The prior
   follow-up misidentified it as Purple's raised-hand fringe.
2. Selecting Green from the companion picker can blink and require multiple
   clicks before the selection registers.

## Diagnosis

- Green's generated alternate frame already contains a small natural hand
  movement. The asset builder then drew an extra synthetic finger down to the
  pad, creating the visible artifact.
- While the picker was open, the 250 ms timer render rebuilt and replaced all
  five picker buttons. A button could disappear between pointer-down and
  pointer-up, losing the click and visibly blinking.

## Implemented correction

- Remove the synthetic Green finger. Frame two now uses only the localized hand
  motion present in the original generated alternate; the body, mixer, desk,
  and microphone remain locked.
- Create the five picker buttons once, then update their selected/queued states
  in place. Timer renders no longer replace live click targets.
- Render the selected companion immediately before waiting for preference
  persistence, then reconcile once persistence completes.
- Materialize the complete RGBA composite before writing Focus frame two and
  use the standard PNG encoder. This prevents a single-character asset build
  from emitting a file that Chromium can decode as only the changed patch.

## Acceptance checks

1. Green has no long red/yellow finger extending toward the mixer.
2. Green's hand still changes naturally between the two Focus frames.
3. One click on Green selects Green without blinking.
4. Repeated timer renders do not replace picker button elements.
5. Selection and queued-next behavior remain correct in Ready, Break, and
   Complete.
6. Green frame two decodes as a complete 512×512 character, not a partial
   hand-region patch.

## Verification record

- All 38 Node tests pass.
- The asset builder confirms matching full-frame alpha bounds for Green A and B
  and verifies saved RGBA pixels against the in-memory composite.
- Electron captured both complete Green Focus frames without the synthetic
  finger.
- A real mouse-down was held on Green for 350 ms—long enough for a timer render—
  before mouse-up. One click selected Green and the picker did not blink.
- The Apple Silicon v3 package was rebuilt with all ten complete Focus files;
  this correction is ready to push to the existing pull request.
