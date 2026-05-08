# Voice Stage Lion — Authoring Spec

> Category 1 (Sustained Verbal Interaction) · Bound to `lion` (big_cat class) · Voice performance

## Premise

The child becomes a "Roar Star" who performs AS the lion in front of a silly audience of three jungle judges — a parrot, a monkey, and an elephant. Across three rounds, the AI sets a performance challenge (a happy greeting-roar, a sleepy lullaby-roar, and a surprise whisper-roar) and the audience reacts with over-the-top delight: the parrot falls off the branch, the monkey throws popcorn, the elephant trumpets. The surprise whisper-challenge in Round 3 adds genuine stakes ("Nobody thinks you can do it!"), and the finale is a standing ovation. The child leaves feeling "They LOVED it!" — a core Performance-pillar experience.

## Target

- **IB axis:** Perspective (primary, via taking the lion's voice) + Form (secondary, via the lion's recognizable features)
- **Primary rung:** T0 (ages 2–4); elastic to T1 (4–6) with slightly longer prompts
- **Tier elasticity:** T0–T2 (±1)
- **Age tier:** child can make simple sounds on cue and follow a short 3-round call-and-response structure with caregiver scaffolding if needed.

## Pedagogical rationale

Giving the lion a voice is a perspective-taking exercise: the child stops observing the lion from the outside and takes its point of view, producing sound AS the lion. Varying the roar across three contrasting emotional registers (happy → sleepy → whisper) makes it concrete that **the same creature expresses itself in many different ways depending on the situation** — a foundation for the IB Key Concept of perspective. The lion's distinctive **Form** (big mane, loud voice, strong body) is what anchors the activity to this specific entity; without the lion, you have no roar, no mane, no stage presence.

Audience reaction (the three judges) transforms voice play into a PERFORMANCE. The child doesn't just speak; they affect listeners. This shifts the learning from self-expression in isolation to communicative expression — closing the Communication Skills ATL loop.

## Selection trigger

Fires when the matcher routes a photographed `lion` (or close constellation neighbor such as toy lion, tiger, or stuffed lion) to this activity. Entity-bound — does **not** fire on property matches.

Drives off the big_cat `tier_guidance` attributes:

- `tier_0.appearance.covering` (mane)
- `tier_0.appearance.body_size`
- `tier_0.senses.sound`
- `tier_1.appearance.mane_look`
- `tier_1.function.communication_roar`

Constellation neighbors (cat, kitten, tiger, leopard, stuffed lion) can substitute via `data/constellation_map.yaml` under `mapped_entity: lion`; see `A.2 Constellation Adaptation Notes` in `prod.md` for preserve/swap/watch rules.

## Experience pillar & game style

- **Pillar:** Performance
- **Game style:** `voice_stage` (voice-driven, audience-reactive, 3-round escalation with surprise twist)
- **Mechanic:** `voice`
- **Observation angle:** `behavior` (how the lion sounds, how the voice varies)
- **Entity role:** `subject` (the lion IS the star — no role pivot)

## Self-Evaluation Scorecard

Evaluated against `prod.md`, `tag_block.yaml`, `program.md` Phase 3, and `templates.md` Performance + Cat1 rules.

| # | Dimension | Score | Notes |
|---|-----------|-------|-------|
| 1 | V1 Technical Compliance | PASS | The game uses the initial lion photo and spoken child responses only. It does not require OCR, face/pose detection, IMU sensing, non-speech audio recognition, or before/after comparison. |
| 2 | Hook & Transition | PASS | Step 1 starts with emotional excitement about the lion's mane and roar, then naturally escalates into the Jungle Talent Show audience frame. |
| 3 | Edge Case Coverage | PASS | Each step has ideal, unexpected, and no-response paths with 2s waits for silence. All three roar rounds now include explicit branch copy and the surprise-sound validation strategy. |
| 4 | IB Completeness | PASS | Perspective + Form are named in Basic Info, tag metadata, and closing. KUD, related concepts, and ATL skills are specific to lion form, vocal expression, listening, and emotional performance. |
| 5 | Tier Appropriateness | PASS | Runtime and metadata now target T0: short call-and-response prompts, onomatopoeia, single action per round, and caregiver scaffolding as the primary support. |
| 6 | Dialogue Specificity | PASS | AI lines are concrete spoken copy with tone markers; judge reactions are specific and playful, with no abstract "AI guides" placeholders in the runnable steps. |
| 7 | Screen & UI Completeness | PASS | The flow specifies stage layout, judge characters, round star, sun/moon/stage changes, gold stars, confetti, and the final Roar Star badge. |
| 8 | Entity Mapping Alignment | N/A | Bound activity uses entity attributes in tag metadata, but this was not generated from a `mapping=` assignment requiring full mapping-informed D8 checks. |
| 9 | Game Feel | PASS | Audience reactions, gold stars, the whisper-roar twist, and the standing ovation create uncertainty, surprise, and a clear emotional climax. |
| 10 | Pillar Fidelity | PASS | Performance is unmistakable: child performs as the lion, judges react as an audience, the third round adds a twist challenge, and Step 4 delivers the standing ovation payoff. |

**Overall**: ALL PASS — 1 issue found and fixed during self-evaluation: spec/tag metadata said primary T1 while the runtime activity and dialogue are T0.
