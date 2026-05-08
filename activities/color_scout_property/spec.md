# Color Scout Property — Authoring Spec

> Category 5 (Collection/Tracking Exploration) · Property-bridge template · Parameterized by `{color}`

## Premise

After a child photographs any object, the AI notices a prominent color (e.g., "red") and frames a quest: "Find 3 red things!" The child becomes a Color Scout. For each find, the AI evaluates it against the quest criterion ("Is it red?") — a pass/fail game moment — and then harvests a personal detail ("What does it remind you of?") to generate a character name. Once 3 quest items are collected, the child co-creates a short adventure story starring the "Red Team." The quest criterion gives the collection PURPOSE; the detail harvesting gives each find PERSONALITY. Works for any detected color: red, blue, green, yellow, brown, orange, purple, pink, white, black.

## Target

- **IB axis:** Form (primary) + Connection (secondary)
- **Primary rung:** T1 (ages 4–6)
- **Tier elasticity:** T0–T2 (±1)
- **Age tier:** child is old enough to photograph, listen to a multi-round quest, and invent short character names.

## Pedagogical rationale

Color is the most perceptually accessible of all surface properties at T1, yet children rarely experience "color" as a dimension that cuts across dissimilar things. This game makes the abstract idea of a color *property* concrete: a fire truck, a strawberry, and a ladybug are all "red" even though they share nothing else. The quest criterion ("Is it red? — YES!") turns the property into a classifier the child practices. The detail-harvest ("What does it remind you of?") keeps the activity in the imaginative/expressive register, not a rote sort. Together they scaffold the IB Key Concepts of **Form** (what it looks like) and **Connection** (surprising links between unlike things).

## Selection trigger

Fires whenever the matcher finds a color property on the photographed entity:

- `tier_0.appearance.color` — most common path (raincoat, crayon, piano, library)
- `tier_0.appearance.body_color` — e.g., rubber duck, toy robot, goldfish, lion, bird
- `tier_0.appearance.wing_color` — e.g., butterfly

The matched color value is substituted into the `{color}` template parameter at runtime. Because the trigger is a *property* rather than a specific entity, the game is entity-agnostic: the entity becomes an *exemplar* of the color rather than the subject of the activity. This triggers the role pivot surfaced via `activity_signature.role_pivot_note`.

## Experience pillar & game style

- **Pillar:** Adventure
- **Game style:** `quest_collector` (criterion-driven collection + detail-harvest + story synthesis)
- **Mechanic:** `collect`
- **Observation angle:** `color`
- **Entity role:** `exemplar` (parameterized — the entity becomes one example of the color class)

## Self-Evaluation Scorecard

Evaluated against `prod.md`, `tag_block.yaml`, `program.md` Phase 3, and `templates.md` Adventure + Cat5 rules.

| # | Dimension | Score | Notes |
|---|-----------|-------|-------|
| 1 | V1 Technical Compliance | PASS | Each photo is processed independently. No OCR, face/expression/pose detection, IMU sensing, non-speech audio detection, or before/after comparison is required. |
| 2 | Hook & Transition | PASS | Step 1 opens with color wonder around the photographed object, then naturally pivots from "this is red" to "what else is red?" before the quest begins. |
| 3 | Edge Case Coverage | PASS | Each dialogue step now has ideal, unexpected, and no-response paths; no-response prompts include a 2s wait, and the Cat5 stuck/doesn't-match branches give concrete search redirects. |
| 4 | IB Completeness | PASS | Form + Connection are named in Basic Info, tag metadata, and the closing. KUD, related concepts, and ATL skills are specific to color grouping, observation, classification, naming, and story co-creation. |
| 5 | Tier Appropriateness | PASS | T1 quest structure is concrete and achievable: find 3 same-color items, answer short open prompts, and co-create a simple Red Team adventure. |
| 6 | Dialogue Specificity | PASS | AI lines are concrete, playful dialogue with tone markers; quest verdicts, naming prompts, and celebration lines are written as spoken copy rather than abstract instructions. |
| 7 | Screen & UI Completeness | PASS | Every step includes specific visual state: color highlight, quest slots, "Red? YES!" stamp, completion banner, adventure trail, and Color Quest badge. |
| 8 | Entity Mapping Alignment | N/A | Parameterized property-bridge activity; it routes from detected color attributes rather than one mapping-informed entity assignment. |
| 9 | Game Feel | PASS | Per-find verdicts create uncertainty, the 0/3 to 3/3 quest counter gives stakes, and "QUEST COMPLETE!" unlocks an earned Red Team adventure. |
| 10 | Pillar Fidelity | PASS | Adventure is now aligned across spec, prod, and tag metadata. The core loop is quest criterion -> collect -> detail harvest -> journey/story synthesis, matching `quest_collector`. |

**Overall**: ALL PASS — 1 issue found and fixed during self-evaluation: package metadata/prod prose had drifted toward Discovery/field_experiment, but the actual runtime loop is Adventure/quest_collector.
