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

## Runtime stability rule

Visual QA showed that even carefully prompted alternate Focus panels moved more
than the requested prop. They remain in the sheet as production evidence, but
the app does not alternate them.

V3 displays the first Focus panel as a locked base and uses a code-native cue:

- Yellow: controller lights pulse.
- Blue: bobber moves gently.
- Green: mixer levels rise and fall.
- Red: page cue turns slightly.
- Purple: clapboard cue moves.

This guarantees that the character, furniture, lower body, and transparent
padding are pixel-identical for the entire Focus loop.
