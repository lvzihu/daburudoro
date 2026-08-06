# DaburuDoro v3 acceptance amendment — 2026-08-06

Status: approved owner direction; applies to the v3 release candidate.

This is a new document. It does not modify or replace the frozen
`daburudoro-v3-prd.md`; it records changes discovered during hands-on owner
acceptance.

## 1. Scope removed from v3

Remove custom-picture import from the product UI and runtime. Existing private
files on disk are not deleted. Reconsider custom character artwork in v5,
after the dedicated v4 UI redesign establishes the right interaction model.

## 2. Animation rule

A Focus animation must communicate a real activity. The character's head,
face, torso, lower-body baseline, seat, desk, and other stationary scene pixels
remain locked. Only a working hand and the object it directly operates may
change.

Color dots, floating vector cues, whole-panel swaps, and whole-character bobbing
do not satisfy this rule.

## 3. Accepted character activities

| Character | Focus activity | Allowed motion |
|---|---|---|
| Yellow | Playing a handheld game | Hands and controller |
| Blue | Fishing | Fishing line and bobber; the long bobber must be absent in the short-line frame |
| Green | Hosting/recording at a mixer | Hand pressing the mixer pad |
| Red | Working on a computer | Typing hands and keyboard area, using the successful v1 composition as the reference |
| Purple | Directing at a monitor | Keep the approved director animation |

All five continue to sleep during Break and wave once on completion.

## 4. Implementation constraint

Use standalone `focus-1.png` and `focus-2.png` files instead of animating
positions inside the full sprite sheet. Focus frame 2 begins from Focus frame 1,
and the asset build fails if pixels change outside the declared hand/prop
region. Preserve the original generated sheets and earlier QA evidence.

## 5. Acceptance checks

1. No character or furniture shifts position during Focus.
2. Yellow visibly operates the controller rather than displaying colored dots.
3. Blue shows exactly one bobber in either line-length state.
4. Green's hand visibly presses the mixer pad; color bars alone are insufficient.
5. Red types on a computer; no reading/page-turn animation remains at runtime.
6. Purple retains the owner-approved directing behavior.
7. Pause freezes the current Focus frame; Resume continues it.
8. The companion picker contains music controls but no custom-picture controls.
9. Custom-picture import is documented as a v5 exploration, after v4 UI work.
