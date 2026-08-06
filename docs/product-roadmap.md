# DaburuDoro product roadmap

Last reviewed: 2026-08-06

DaburuDoro is a playful body-doubling companion that helps people stay with a
focus session. Version 3 is the public starting point. This roadmap describes
the product direction after v3; it is not a delivery-date commitment or a
frozen PRD.

## Product principles

1. **Configure before Focus.** Companion, activity, clothing, rest behavior,
   sound, and any group scene are chosen before a session begins.
2. **Protect the session.** Focus should not require clicking, collecting, or
   playing. Optional reactions may add warmth, but should never demand
   attention.
3. **Make time visible.** Progress should eventually become something users can
   see and feel, not only a number in a timer.
4. **Prefer authored quality over unlimited combinations.** Curated activities
   and scenes are better than promising every possible character, activity,
   outfit, and pairing.
5. **Learn before expanding.** Feedback from the public v3 release should shape
   larger design investments.

## Shipped — v3.0: Choose Your Companion

V3 established the product foundation:

- five original color companions with distinct Focus activities;
- companion changes between Focus blocks;
- sleeping Break states and local Break music;
- a movable, hideable, always-visible macOS widget;
- whole-minute custom sessions, notifications, and reliable elapsed time; and
- an owner-tested public release with a documented build history.

## Planned — v3.1: Feedback & Learning

**Outcome:** make it easy for early users to shape what comes next.

- Add **Send an idea** in the expanded panel, leading to a prefilled X post.
- Add **Report a bug**, leading to a structured GitHub Issue template.
- Keep both links outside the primary Focus controls.
- Review feedback by theme before freezing the v4 PRD.

The X account, link wording, and issue fields remain implementation decisions.

**Success signal:** feedback contains enough context to identify repeated needs
and reproduce reported problems.

## Planned — v4: Visual Identity

**Outcome:** make DaburuDoro feel intentional, polished, and recognizably its
own product.

- Explore a warm pixel-art-inspired visual system.
- Redesign the compact timer bar, expanded panel, companion picker, colors,
  spacing, hierarchy, and click targets.
- Give the five companions distinct faces, silhouettes, poses, and visual
  personalities instead of differentiating them mainly by color.
- Explore optional, rate-limited hover reactions such as a gentle reminder to
  return to studying.
- Provide a way to reduce or disable character messages.
- Establish reusable art and UI foundations for later activities and clothing.

**Success signal:** users can distinguish the companions without relying only
on color and can operate the widget without hunting for controls.

## Exploring — v5: Companion Studio

**Outcome:** let users compose the body-doubling scene they want before Focus.

Potential pre-session choices include:

- one companion from the five-character cast;
- one activity from that companion's curated activity collection;
- clothing and accessories such as a hat or shirt;
- Break behavior;
- sound or music behavior; and
- one companion or a limited set of authored multi-companion scenes.

Not every companion needs to perform every activity. Multi-companion support
should begin with a few deliberate scenes rather than every possible pairing.
Once Focus begins, the configured scene runs without requiring interaction.

### Sound direction to research

Local music files remain useful but may be unfamiliar or inconvenient for many
users. Before choosing a replacement, investigate:

- original or properly licensed bundled ambient loops;
- a small preset soundscape collection;
- application size and licensing implications; and
- whether users want music, environmental sound, or only transition cues.

YouTube and commercial-song streaming are not assumed roadmap solutions.

### Advanced customization direction

Unrestricted image upload is not planned because arbitrary pictures cannot
guarantee the dimensions, transparency, poses, and animation structure the
product requires. A safer future direction is a documented developer-level
character-pack format with:

- an asset and folder specification;
- required poses and frame dimensions;
- example files;
- validation and preview tooling; and
- clear error messages when a pack is incompatible.

This would preserve configurability without promising that any uploaded image
can become a polished animated companion.

**Success signal:** users can create a satisfying session setup without making
choices during Focus, and the art workload remains maintainable.

## Exploring — v5.1: Surprise Me

**Outcome:** add ADHD-friendly novelty to the Companion Studio without removing
control.

Each setup field can contain either a specific selection or **Surprise me**.
For example, a user could keep Yellow and a blue hat while asking DaburuDoro to
surprise them with the activity and sound.

Potential behavior:

- Surprise Me for individual setup fields;
- one **Surprise Everything** action;
- exclusions for choices a user does not want; and
- repeat protection so random results continue to feel varied.

Surprise Me is a follow-up to the Companion Studio rather than a separate
foundation: it selects from content and rules that v5 establishes.

**Success signal:** users deliberately choose Surprise Me again across multiple
sessions rather than immediately replacing its selections.

## Exploring — v6: Focus History

**Outcome:** help users feel, “I built something visible with my focused time.”

- Record accurate focus minutes and completed sessions.
- Turn accumulated time into a warm visual display rather than only a chart.
- Preserve access to dates and underlying minute totals.
- Keep the display outside the active Focus interaction.

The final metaphor is intentionally open. Candidates include a growing shared
room, neighborhood, memory shelf, journey, constellation, or calendar world.
Prototypes should determine which one communicates accumulation most clearly
without becoming a distracting game.

**Success signal:** users correctly understand what their visualization
represents and return to view their progress over time.

## Explicitly not promised

- Firm delivery dates.
- Required gameplay or collecting during Focus.
- Every companion performing every activity.
- Every possible pair or group interaction.
- Arbitrary image upload through the product UI.
- YouTube integration or unlicensed commercial music.
- Features moving from this roadmap directly into development without a new,
  versioned PRD and acceptance criteria.

## How this roadmap changes

Roadmap versions express the current order of learning and product dependency,
not a permanent contract. Feedback may reorder, combine, narrow, or remove
items. Before implementation, each release receives its own frozen PRD; later
feedback is recorded in new dated documents rather than rewriting that PRD.
