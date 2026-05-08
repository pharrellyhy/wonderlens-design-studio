# Shape Quest Property — Authoring Spec

> Category 5 (Collection/Tracking Exploration) · Property-bridge template · Parameterized by `{shape}`

## Premise

After a child photographs any object, the AI notices a prominent shape attribute (e.g., "round") and frames a quest: "Find 3 things that are round!" The child becomes a Shape Scout. Each find is evaluated against the criterion ("Is it round? — YES!"), creating a pass/fail game moment, and then the AI harvests a personal detail ("What does it remind you of?") to generate a character name. Once 3 quest items are collected, the child co-creates a short adventure story where all the shape-friends roll, bounce, or spin together. The quest criterion gives the collection PURPOSE; the detail harvesting gives each find PERSONALITY. Works for any detected shape: round, pointy, flat, long, curvy.

## Target

- **IB axis:** Form (primary) + Connection (secondary)
- **Primary rung:** T1 (ages 4–6)
- **Tier elasticity:** T0–T2 (±1)
- **Age tier:** child can listen to a multi-round quest, compare objects by shape, and invent short character names.

## Pedagogical rationale

Shape is one of the earliest categorization dimensions children can articulate verbally, but most T1 children still treat shape as *belonging to the object* ("the ball is a ball") rather than as an independent property that cuts across unlike things. This game decouples shape from category: a wheel, a coin, and a cookie are all round but serve completely different purposes. The quest criterion turns shape into a classifier the child practices ("Is it round? — YES!"). Comparing the finds side-by-side in the synthesis step surfaces **Form** as a property the world shares, and **Connection** as the surprising link between dissimilar things with the same shape.

## Selection trigger

Fires whenever the matcher finds a shape property on the photographed entity:

- `tier_0.appearance.shape` — most common path
- `tier_0.appearance.body_shape` — e.g., toy robot
- `tier_0.appearance.wing_shape` — e.g., butterfly
- `tier_1.appearance.hood_shape` — entity-specific shape features also qualify (e.g., raincoat)

The matched shape value is substituted into the `{shape}` template parameter at runtime. Because the trigger is a *property* rather than a specific entity, the game is entity-agnostic: the entity becomes an *exemplar* of the shape rather than the subject of the activity. This triggers the role pivot surfaced via `activity_signature.role_pivot_note`.

## Experience pillar & game style

- **Pillar:** Adventure
- **Game style:** `quest_collector` (criterion-driven collection + detail-harvest + story synthesis)
- **Mechanic:** `collect`
- **Observation angle:** `shape`
- **Entity role:** `exemplar` (parameterized — the entity becomes one example of the shape class)

## Self-Evaluation Scorecard

Evaluated against `prod.md`, `tag_block.yaml`, `program.md` Phase 3, and `templates.md` Adventure + Cat5 rules.

| # | Dimension | Score | Notes |
|---|-----------|-------|-------|
| 1 | V1 Technical Compliance | PASS | Each photo is assessed independently for a visible shape. No OCR, face/expression/pose detection, IMU sensing, non-speech audio detection, or before/after comparison is required. |
| 2 | Hook & Transition | PASS | Step 1 begins with wonder about the object's round feature, then bridges naturally from "these wheels are round" to a same-shape quest. |
| 3 | Edge Case Coverage | PASS | Each dialogue step now has ideal, unexpected, and no-response paths; no-response prompts include a 2s wait, and the Cat5 stuck/doesn't-match branches name concrete places and alternate round features. |
| 4 | IB Completeness | PASS | Form + Connection are aligned across Basic Info, tag metadata, and the closing. KUD and ATL skills target shape vocabulary, observation, classification, creative naming, and narrative expression. |
| 5 | Tier Appropriateness | PASS | T1 children can follow the 3-item hunt, use concrete shape words like round/circle/curved, and answer short open prompts about what each find reminds them of. |
| 6 | Dialogue Specificity | PASS | AI copy is spoken dialogue with tone markers, including criterion verdicts, scaffolds for "round," and concrete story prompts. |
| 7 | Screen & UI Completeness | PASS | Every step has specific UI: shape highlight, quest card and slots, "Round? YES!" stamp, completion banner, rolling trail, and Shape Quest badge. |
| 8 | Entity Mapping Alignment | N/A | Parameterized property-bridge activity; it routes from detected shape attributes rather than one mapping-informed entity assignment. |
| 9 | Game Feel | PASS | The shape verdicts and quest counter create stakes, the final collection reveal is an emotional climax, and the rolling adventure varies with every shape/entity combination. |
| 10 | Pillar Fidelity | PASS | Adventure is now aligned across spec, prod, and tag metadata. The core loop is quest criterion -> collect -> detail harvest -> journey/story synthesis, matching `quest_collector`. |

**Overall**: ALL PASS — 1 issue found and fixed during self-evaluation: package metadata/prod prose had drifted toward Discovery/field_experiment, but the actual runtime loop is Adventure/quest_collector.
