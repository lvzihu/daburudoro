# V3 character sprite production record

## Tool and mode

- Tool: built-in image generation
- Mode: `stylized-concept`
- Reference role: the original yellow Ready image was used only as a generic
  style reference for proportions, line weight, face simplicity, and finish.
- Transparency: flat chroma-key source followed by the image-generation skill's
  local soft-matte, despill, and alpha-validation workflow.
- Final project assets: `assets/characters/<color>/sheet.png`

No CLI/API fallback or external image model was used.

## Shared final prompt structure

Each character used this production prompt with the color, distinct generic
hairstyle, Focus activity, props, and key color substituted:

> Create an exact 3-column by 2-row sprite sheet on a 1536×1024 canvas. Each
> cell is 512×512 and contains the same wholly original, non-identifiable chibi
> character at a consistent scale and centered anchor. Match the reference's
> rounded proportions, clean dark outlines, simple warm face, hooded color
> outfit, and polished flat 2D sticker finish. Top row: static Ready, Focus
> frame 1, Focus frame 2 with only the activity detail changed. Bottom row:
> peaceful sleeping pose on a color-matched cushion, standing completion wave,
> empty key-color cell. Use one perfectly flat chroma-key background with no
> dividers, shadows, floor, gradients, texture, reflections, text, logos,
> brands, watermark, or real-person likeness. Keep every subject inside its
> cell with generous padding.

## Character-specific prompt set

| ID | Focus prompt | Intended alternate detail | Key |
|---|---|---|---|
| Yellow | Playing a generic handheld video game with both hands on a controller | Thumbs/controller light | `#00ff00` |
| Blue | Fishing from a small tackle box with a rod angled right | Rod tip/bobber | `#00ff00` |
| Green | Hosting radio with headphones, microphone, desk, and small mixer | Mixer hand/level indicator | `#ff00ff` |
| Red | Reading an open generic hardcover book | Page corner/hand | `#00ff00` |
| Purple | Directing at a production monitor with an unbranded clapboard | Clapboard top/hand | `#00ff00` |

Magenta was used for Green so the subject would contain no color close to its
removable background.

## Selected generated sources

The built-in tool retained its originals under the session's Codex generated
image directory. The selected source filenames were:

- `exec-150da1aa-4e77-4532-b06c-43df993b6066.png` — Yellow
- `exec-d8dd3d79-e650-4c26-8940-7070f391984d.png` — Blue
- `exec-7b92215b-8f02-427c-baf8-51d40b8b656a.png` — Green
- `exec-fc6a591d-5236-4ae7-b9af-bd97e3fe84d3.png` — Red
- `exec-f009eec6-bf96-48ce-a10c-0ca864fb8c62.png` — Purple

The project stores only the alpha-ready final sheets. Temporary chroma sources
are ignored by Git.

## Runtime animation decision

Pre-acceptance visual QA showed that carefully prompted alternate Focus panels
moved more than the requested prop. The first implementation therefore froze
the first panel and layered a code-native cue over it.

Owner acceptance testing rejected that fallback because the illustration looked
static while an unrelated vector moved over it. A second candidate alternated
the two complete generated Focus panels, but owner testing correctly found that
the full character shifted again, recreating the v2 defect.

A targeted built-in image edit was also rejected: despite an explicit locked
master and change-only-the-controller constraint, it rescaled and redrew Yellow.
The generated experiment was not copied into the project.

The first deterministic candidate still did not satisfy owner acceptance:
Yellow and Green replaced hand motion with colored indicators, Blue appeared to
retain the long-line bobber during the short-line state, and Red's synthetic
page crossed the book unnaturally.

The accepted revision is recorded separately in
[`daburudoro-v3-acceptance-amendment-2026-08-06.md`](../../daburudoro-v3-acceptance-amendment-2026-08-06.md).
`scripts/build-locked-focus-sheets.py` now writes standalone `focus-1.png` and
`focus-2.png` files instead of depending on sprite-sheet positions:

- Yellow: the generated hands and controller change together.
- Blue: one line/bobber moves upward; an assertion rejects any old bobber pixel
  in the short-line region.
- Green: the hand presses the mixer pad.
- Red: the successful v1 computer-work composition is recolored red and only
  its typing-hand region changes.
- Purple: the owner-approved director/recording state remains unchanged.

The new side-by-side evidence lives in `artifacts/v3-focus-hands-qa/`; the
earlier `artifacts/v3-focus-lock-qa/` evidence is preserved as rejected-history
evidence. The script fails if any pixel changes outside the declared hand/prop
polygon.

JavaScript keeps both standalone files mounted and decoded, toggles which
complete frame is visible, and stops advancing the frame index while Timer
Pause is active. This avoids partial paints during a data-URL source change.
Body, face, clothing, lower-body baseline, chair, desk, and monitor remain
identical between Focus frames.
