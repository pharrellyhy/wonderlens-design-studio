# Mystery Trail Butterfly — Authoring Spec

> Category 5 (Collection/Tracking Exploration) · Bound to `butterfly` (insect class) · Mystery-trail with delayed pattern reveal

## Premise

After a child photographs a butterfly on a flower, the AI marvels at the wings and recruits the child as a "Butterfly World Detective." The AI gives riddle-clues one at a time — each describing something nearby (a flower, a leaf, a wet spot) without naming it — and the child searches, guesses, and photographs what they think matches. After 3 finds, the AI reveals the hidden connection: everything the child found is part of the butterfly's secret world — its food, shelter, and water. The big "aha!" is that the child has been mapping the butterfly's habitat all along without knowing it. That delayed reveal is the Mystery pillar's signature payoff.

## Target

- **IB axis:** Connection (primary, via habitat and interdependence) + Form (secondary, via observable clues)
- **Primary rung:** T1 (ages 4–6)
- **Tier elasticity:** T0–T2 (±1)
- **Age tier:** child can hold a riddle in working memory long enough to search, and can articulate what they found.

## Pedagogical rationale

A butterfly's wing patterns make it a natural observation target, but the deeper idea is that no creature exists in isolation — it lives inside a web of food, shelter, and water sources. This activity doesn't *tell* the child that, it *walks them through it* via three riddle-clues, then reframes the collection at the end ("Everything you found is your butterfly's secret world!"). The child assembles the habitat concept themselves, which is the IB learning-moment the Mystery pillar targets.

The delayed-reveal structure also models scientific inference: observations come first, the pattern emerges second. The riddle-voice ("I'm thinking of something nearby. It's bright and colorful, it has a sweet smell...") is sensory and concrete, keeping the inference accessible at T1. **Form** is the clue layer (bright petals, flat green leaves, wet ground); **Connection** is the reveal layer, because the flower, leaf, and wet spot become one habitat web. Pattern remains a strong related concept because wing patterns are what first drew the child's eye.

## Selection trigger

Fires when the matcher routes a photographed `butterfly` (or close constellation neighbor such as bee, moth, ladybug, or dragonfly) to this activity. Entity-bound — does **not** fire on property matches.

Drives off the insect `tier_guidance` attributes:

- `tier_0.appearance.wing_color`, `wing_shape`, `antennae`
- `tier_0.function.lands_on_flowers`
- `tier_1.appearance.wing_patterns`
- `tier_1.context.flower_visits`, `leafy_rests`, `puddle_visits`
- `tier_1.function.sipping_nectar`
- `tier_2.context.habitat_requirements`, `host_plants_for_eggs`

Constellation neighbors (bee, moth, ladybug, dragonfly) substitute via `data/constellation_map.yaml` under `mapped_entity: butterfly`; the riddle set swaps for the neighbor's food/shelter/water analogs per the `A.2 Constellation Adaptation Notes` in `prod.md`.

## Experience pillar & game style

- **Pillar:** Mystery
- **Game style:** `mystery_trail` (riddle-driven search with delayed pattern reveal)
- **Mechanic:** `collect`
- **Observation angle:** `pattern` (the butterfly's wing pattern is the entry hook; the habitat pattern is the hidden reveal)
- **Entity role:** `subject` (the butterfly IS the case to solve — no role pivot)

## Self-Evaluation Scorecard

Evaluated against `prod.md`, `tag_block.yaml`, `program.md` Phase 3, and `templates.md` Mystery + Cat5 rules.

| # | Dimension | Score | Notes |
|---|-----------|-------|-------|
| 1 | V1 Technical Compliance | PASS | The activity uses independent photos and dialogue-based riddle solving. It does not require OCR, face/pose detection, IMU sensing, non-speech audio recognition, or before/after visual comparison. |
| 2 | Hook & Transition | PASS | Step 1 opens with wonder at the butterfly's wings and flower choice, then moves naturally into "what else is part of its secret world?" |
| 3 | Edge Case Coverage | PASS | Dialogue steps include ideal, unexpected, and no-response paths with 2s waits where relevant; the search rounds include concrete stuck hints and validation before redirecting wrong guesses. |
| 4 | IB Completeness | PASS | Form + Connection now align across Basic Info, closing, and tag metadata. KUD covers nectar/habitat/shelter vocabulary, habitat connection, riddle deduction, outdoor search, and reasoning expression. |
| 5 | Tier Appropriateness | PASS | T1 riddles use concrete sensory clues and a manageable listen -> search -> photograph loop; habitat terms are introduced in context rather than tested upfront. |
| 6 | Dialogue Specificity | PASS | The riddle-clues, validations, reveal, reflection, and closing are concrete spoken lines with tone markers rather than abstract author notes. |
| 7 | Screen & UI Completeness | PASS | Each step has specific visuals: wing glow, detective badge, clue slots, solved animations, habitat map, labeled connection lines, and Butterfly World Detective badge. |
| 8 | Entity Mapping Alignment | N/A | Bound activity uses entity attributes in tag metadata, but this was not generated from a `mapping=` assignment requiring full mapping-informed D8 checks. |
| 9 | Game Feel | PASS | The child solves clue-riddles without knowing the hidden pattern, and the Step 4 habitat reveal retroactively reframes all finds as the butterfly's secret world. |
| 10 | Pillar Fidelity | PASS | Mystery is clear from the riddle-clue loop, delayed reveal, detective role, and "I figured it out" payoff. Updated tag metadata now describes the same habitat mystery as the runtime flow. |

**Overall**: ALL PASS — 2 issues found and fixed during self-evaluation: the tag block still described a generic pattern hunt, and the closing used Causation where the current Mystery/Cat5 design is Form + Connection.
