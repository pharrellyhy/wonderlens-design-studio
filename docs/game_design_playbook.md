# WonderLens Game Design Playbook

A complete guide for designing Cat1 and Cat5 games. Read this before creating any new game.

---

## 1. How Games Fit in WonderLens

```
Child photographs entity → Entity recognition → Multi-turn conversation (5-15 turns)
    → Game selection → Game plays (3-5 minutes)
```

**Two game categories:**

| Category | Setting | What happens | Duration |
|---|---|---|---|
| **Cat1** | Indoor, in-device | Child talks with AI about their photographed entity through a game mechanic | 3-5 min verbal |
| **Cat5** | Outdoor, out-of-device | Child physically explores, finds items, photographs them, AI reacts per game mechanic | 5-8 min exploration |

**Three ways a child gets a game:**

| Tier | When | Quality | Source |
|---|---|---|---|
| **Tier A** | Entity has its own gold standard game | 10/10 | `designs/` gold standard files |
| **Tier B** | Entity matches a constellation → adapted gold standard | 8/10 | Gold standard + adaptation notes |
| **Tier P** | Entity has a detectable property → property-bridge game | 7-8/10 | Property-bridge templates |
| **No game** | No match at all → rich conversation ending | N/A | Conversation-only mode |

---

## 2. The 6 Experience Pillars × 12 Game Styles

Every game belongs to one pillar. The pillar determines the child's **emotional experience**.

| Pillar | Child feels... | Magic moment | Cat1 Style | Cat5 Style |
|---|---|---|---|---|
| **Mystery** | "I figured it out!" | Hidden truth revealed | `mystery_lens` — clues → deduction → aha! | `mystery_trail` — riddle-clues → pattern reveal |
| **Creation** | "I made this!" | Invention unveiled | `inventor_workshop` — "what if" modifications | `mix_lab` — collect → combine → invent |
| **Performance** | "They loved it!" | Audience ovation | `voice_stage` — perform → audience reacts | `ensemble_show` — assemble cast → concert |
| **Discovery** | "Was I right?!" | Prediction meets reality | `prediction_lab` — predict → commit → reveal → score | `field_experiment` — hypothesis → evidence → tally |
| **Adventure** | "Look how far we went!" | Whole journey visible | `time_traveler` — journey through time | `quest_collector` — mission with criterion |
| **Nurture** | "I helped!" | Visible transformation | `care_station` — diagnose → care → transformation | `rescue_team` — find needs → mutual aid |

### How to Choose a Pillar

Ask: "After 3 minutes of play, how should the child FEEL?"

| If you want the child to feel... | Choose | The game should have... |
|---|---|---|
| Clever, like a detective | **Mystery** | Hidden information, progressive clues, "aha!" reveal |
| Proud of something they made | **Creation** | Open-ended building, snowballing modifications, "ta-da!" moment |
| Like a star on stage | **Performance** | Expressive challenges, audience reactions, standing ovation |
| Like a scientist who tested an idea | **Discovery** | Predictions with stakes, real data, "was I right?!" moment |
| Like they went on a journey | **Adventure** | Progress, choices, visible journey at the end |
| Like they truly helped | **Nurture** | Visible needs, care solutions, transformation you can see |

---

## 3. Game Types: What to Build

### 3A. Entity Gold Standards (Tier A)

**What**: A game designed for a **specific entity** (e.g., lion, banana, playground).

**When to create**: When an entity is in the IB mind map AND is common enough to justify a hand-designed game.

**Quality**: Highest (10/10). These are the exemplars.

**Current inventory**: 12 gold standards (1 per style)

| Style | Entity | Cat | Activity Name |
|---|---|---|---|
| `mystery_lens` | toy_robot | 1 | Robot Inspector |
| `mystery_trail` | butterfly | 5 | The Butterfly World Detectives |
| `inventor_workshop` | rubber_duck | 1 | Super Duck Workshop |
| `mix_lab` | rock | 5 | Nature Inventor's Lab |
| `voice_stage` | lion | 1 | The Lion's Big Show |
| `ensemble_show` | bird | 5 | The Nature Orchestra |
| `prediction_lab` | goldfish | 1 | Goldfish Scientist |
| `field_experiment` | playground | 5 | The Playground Material Detective |
| `time_traveler` | banana | 1 | The Banana Time Machine |
| `quest_collector` | dandelion | 5 | Dandelion Quest |
| `care_station` | teddy_bear | 1 | Teddy's Care Station |
| `rescue_team` | flower | 5 | The Garden Rescue Squad |

**Files**: `designs/cat{N}/{entity}_cat{N}_gold_spec.md` + `_gold_prod.md`

### 3B. Property-Bridge Templates (Tier P)

**What**: A game parameterized by a **detected visual property** (e.g., "round," "red," "metal"), not a specific entity. Works for ANY entity with that property.

**When to create**: When you want to cover a visual property that many entities share. One template serves hundreds of entities.

**Quality**: Good (7-8/10). Structured game with real mechanic, but not entity-tailored.

**Current inventory**: 18 property-bridge templates

**Cat5 (12 templates):**

| Template | Style | Pillar | Property | Example trigger |
|---|---|---|---|---|
| Shape Quest | quest_collector | Adventure | round, pointy, flat | Car → "find round things!" |
| Color Scout | quest_collector | Adventure | red, blue, green | Red toy → "find red things!" |
| Movers Quest | quest_collector | Adventure | wheels, legs, wings | Toy car → "find things that move!" |
| Material Lab | field_experiment | Discovery | metal, wood, plastic | Fork → "mostly metal or not?" |
| Size Experiment | field_experiment | Discovery | bigger/smaller | Pinecone → "bigger or smaller than your hand?" |
| Nature vs Made | field_experiment | Discovery | natural, man-made | Bench → "more natural or man-made?" |
| Shiny Experiment | field_experiment | Discovery | shiny, dull | Doorknob → "mostly shiny or dull?" |
| Old vs New | field_experiment | Discovery | worn, fresh | Old bench → "mostly old or new looking?" |
| Pattern Trail | mystery_trail | Mystery | stripes, spots, zigzag | Striped shirt → riddle-clues about patterns |
| Texture Mix | mix_lab | Creation | rough, smooth, fuzzy | Tree bark → collect textures, assign superpowers |
| Sound Stage | ensemble_show | Performance | inferred from form | Wooden spoon → collect "instruments," put on concert |
| Living Rescue | rescue_team | Nurture | alive, plant | Plant → "find living things that need help!" |

**Cat1 (6 templates):**

| Template | Style | Pillar | How property seeds the game | Example |
|---|---|---|---|---|
| Detail Detective | mystery_lens | Mystery | "I spy something [property] on your [entity]!" | Colorful truck → spy each color |
| What-If Workshop | inventor_workshop | Creation | "What if [entity] was [OPPOSITE property]?" | Shiny spoon → "what if FUZZY?" |
| Property Predictor | prediction_lab | Discovery | "What happens if [property] changes?" | Bouncy ball → predict bounce scenarios |
| Time Shifter | time_traveler | Adventure | "[Property] NOW → what was it BEFORE?" | Yellow banana → was green, was a flower |
| Fix-It Station | care_station | Nurture | "[Entity] looks [worn]! Let's help!" | Faded stuffed animal → restore it |
| Property Performer | voice_stage | Performance | "SO [property]! Perform like it!" | Bouncy ball → "show me your bounciest bounce!" |

**Files**: `designs/cat{N}/{template_name}_property_gold_spec.md` + `_property_gold_prod.md`

### 3C. Constellation-Adapted Games (Tier B)

**What**: An entity gold standard game reused for a semantically similar entity. No new game file needed — adaptation happens at runtime.

**Example**: Kitten photographs → no kitten gold standard → but kitten is in lion's constellation → lion's "The Lion's Big Show" adapted: replace "roar" with "meow," "jungle" with "neighborhood."

**When to expand**: Add entries to `constellation_map.yaml`. No game design needed — just mapping.

---

## 4. How to Design an Entity Gold Standard

### Step-by-step

1. **Choose entity + category + tier + pillar + style**
   - Entity: from IB mind map (has mapping YAML)
   - Category: Cat1 (indoor) or Cat5 (outdoor) — based on where entity is encountered
   - Tier: T0 (ages 2-4), T1 (ages 4-6), or T2 (ages 6-8)
   - Pillar: based on what emotional experience fits this entity best
   - Style: the pillar's Cat1 or Cat5 style

2. **Read the entity mapping YAML** (if available)
   - Note primary/secondary IB themes
   - Note primary key concepts (MUST use at least 1)
   - Read tier_guidance for your target tier
   - Select 2-3 anchor dimensions (Cat1: engagement-first; Cat5: physical-first)

3. **Read the base template + pillar overlay** (`templates.md`)
   - Template A for Cat1, Template B for Cat5
   - Note the pillar-specific guidance for Steps 2-4

4. **Study the gold standard for your style** (in `designs/`)
   - Read both spec and prod to understand the mechanic in practice

5. **Fill creative variables**
   - Universal: `{metaphor}`, `{role_title}`, `{escalation_axis}`
   - Pillar-specific: see the creative variables table in templates.md
   - Must be FRESH — don't recycle from existing gold standards

6. **Write the spec** — full interaction flow
   - Step 1: Hook (emotional entry, 3 response branches)
   - Step 2: Game setup + demo (explain the mechanic through example)
   - Step 3: Core loop (3-4 rounds with escalation)
   - Step 4: Payoff / magic moment (the emotional peak)
   - Step 5: Celebration + IB concepts (name concepts as earned praise)
   - Every step: AI dialogue with tone markers, 3 child response branches, AI follow-ups, screen description

7. **Self-evaluate against 10 dimensions** (see §6 below)
   - Fix any failures, re-evaluate until ALL PASS

8. **Write the prod version** — condensed format
   - Convert bullet Basic Info → table
   - Condense rounds 2+ to summary paragraphs
   - Remove blockquotes, use inline format
   - Remove Self-Evaluation Scorecard

9. **Save with correct naming**
   - Spec: `designs/cat{N}/{entity}_cat{N}_gold_spec.md`
   - Prod: `designs/cat{N}/{entity}_cat{N}_gold_prod.md`

### Spec File Format

```markdown
# Activity Design: {Entity} + Category {N} ({Category Name})

> Generated: {date} | {style info} | Agent: Activity Design Agent

---

## Activity: {Activity Name}

### A. Basic Info
- **Activity Name**: ...
- **Activity Category**: ...
- **Recommended Tier**: ...
- **Core IB Key Concepts**: ...
- **Related Concepts (Discipline)**: ...
- **ATL Skills Focus**: ...
- **Experience Pillar**: ...
- **Game Style**: ...
- **Design Version**: 1.0
- **Last Updated**: {date}
- **Trigger Entity**: ...
- **Trigger Scene**: ...
- **Mapping Source**: ...

### B. Activity Overview
- **① Brief Description**: ...
- **② Educational Purpose (KUD)**: K/U/D
- **③ Design Highlight**: ...
- **④ Typical Scenario**: ...

### C. Interaction Flow — Detailed Design [Target Tier: {T}]
(Steps 1-5 with full dialogue, 3 response branches, screen descriptions)

## Self-Evaluation Scorecard
(10 dimensions, ALL PASS)
```

### Prod File Format

```markdown
## {Activity Name}

### A. Basic Info
| Field | Value |
|-------|-------|
| Activity Name | ... |
(table format, no scorecard)

### C. Interaction Flow
> Recommended Tier: {T}
#### Step 1: ...
(condensed, inline format)
```

---

## 5. How to Design a Property-Bridge Template

Same process as entity gold standard, with key differences:

| Aspect | Entity Gold Standard | Property-Bridge Template |
|---|---|---|
| Trigger | Specific entity (e.g., "lion") | Any entity with detected `{property}` |
| Mapping Source | Entity mapping YAML or "none" | `property-bridge` |
| Content driver | Entity's unique characteristics | The detected property + its game implications |
| Reusability | 1 entity only | Many entities |
| Creative variables | Entity-specific | Property-parameterized with `{property_value}` slots |
| Example entities | Include throughout | Show 1 example entity, note "works for any..." |

### Key Design Principle

The property must be **visually verifiable from a photo**. The AI needs to be able to detect it.

**Allowed properties** (AI can see in photos):

| Property | Examples | Reliable? |
|---|---|---|
| Color | red, blue, green, yellow, brown | Very high |
| Shape | round, pointy, flat, long, curvy | High |
| Material type | metal, wood, plastic, fabric, stone | High |
| Size (relative) | bigger/smaller than hand, shoe | High |
| Natural vs man-made | tree vs bench, rock vs plastic | High |
| Alive vs not-alive | plant, animal vs object | High |
| Pattern | stripes, spots, zigzag, plain | High |
| Shininess | reflective/glossy vs matte/rough | High |
| Age/wear | rust, cracks, fading vs bright, clean | Medium-high |
| Visible texture | rough bark, smooth glass, fuzzy moss | Medium |
| Movement capability | has wheels, legs, wings | Medium |
| Sound potential | inferred from form (stick=tap) | Creative inference |

**Banned properties** (AI cannot reliably assess from photos):

| Property | Why banned |
|---|---|
| Actual texture (touch) | Can't feel through a photo |
| Weight | Can't weigh through a photo |
| Temperature | Can't sense through a photo |
| Actual sound | Can't hear through a photo |
| Smell / taste | Can't sense through a photo |
| Flexibility | Ambiguous in static image |

### field_experiment Special Rule: AI-as-Assessor

For `field_experiment` games (hypothesis testing):
- **AI assesses the property from the photo** and announces it
- **Child does NOT self-report** the property
- This preserves the "Was I right?!" surprise
- Example: AI says "Let me look closely... I can see it's SHINY!" (not "Is it shiny or dull?")

---

## 6. Quality Rubric: 10 Dimensions

Every game must pass ALL 10 dimensions. Use this scorecard during self-evaluation.

| # | Dimension | PASS when... | FAIL when... |
|---|---|---|---|
| D1 | **V1 Technical Compliance** | No OCR, face detection, IMU, or before/after comparison required | Design depends on blocked capability |
| D2 | **Hook & Transition** | Step 1 opens with emotional resonance. Activity grows naturally from conversation. | Step 1 tests knowledge or assigns a task abruptly |
| D3 | **Edge Case Coverage** | Every step has 3 response branches (ideal, unexpected, silence). Unexpected branches validate before redirecting. | Missing branches, or unexpected responses dismissed |
| D4 | **IB Completeness** | 1-2 Key Concepts named in closing. KUD fully defined. 2-3 ATL skills identified. | Concepts missing, vague, or don't match what child actually did |
| D5 | **Tier Appropriateness** | Vocabulary and complexity match target tier. T0: ≤5 words. T1: 5-8 words. T2: complex. | Language too advanced or too simple for tier |
| D6 | **Dialogue Specificity** | All AI lines are actual dialogue with tone/emotion markers. Zero "AI guides..." | Abstract descriptions instead of concrete dialogue |
| D7 | **Screen & UI Completeness** | Every step has specific screen description with layout and animations. | Vague or missing screen descriptions |
| D8 | **Entity Mapping Alignment** | (Mapping-informed only) Concepts from mapping. Vocab from tier_guidance. | Concepts or facts not traceable to mapping |
| D9 | **Game Feel** | Genuine uncertainty + satisfying resolution. Child experiences stakes. | Feels like structured Q&A with no surprise |
| D10 | **Pillar Fidelity** | Blind reader could identify which pillar. Emotional arc matches pillar promise. | Could be re-labeled to a different pillar without feeling wrong |

### Self-Evaluation Scorecard Template

```markdown
## Self-Evaluation Scorecard

| # | Dimension | Score | Notes |
|---|-----------|-------|-------|
| 1 | V1 Technical Compliance | PASS/FAIL | [specific evidence] |
| 2 | Hook & Transition | PASS/FAIL | [specific evidence] |
| 3 | Edge Case Coverage | PASS/FAIL | [specific evidence] |
| 4 | IB Completeness | PASS/FAIL | [specific evidence] |
| 5 | Tier Appropriateness | PASS/FAIL | [specific evidence] |
| 6 | Dialogue Specificity | PASS/FAIL | [specific evidence] |
| 7 | Screen & UI Completeness | PASS/FAIL | [specific evidence] |
| 8 | Entity Mapping Alignment | PASS/FAIL/N/A | [specific evidence] |
| 9 | Game Feel | PASS/FAIL | [specific evidence] |
| 10 | Pillar Fidelity | PASS/FAIL | [specific evidence] |

**Overall**: ALL PASS / [N] issues found
```

---

## 7. Game Selection Pipeline

How the system decides which game a child gets:

```
Child photographs entity
    ↓
Entity in IB mind map? ──YES──→ Entity has gold standard game?
    │                              ├── YES → Tier A (gold standard)
    │                              └── NO  → Style Recommender → Tier B (adapt compatible game)
    │                                                           → or Tier P (property-bridge)
    │
    └── NO → Entity Bridging System
              ├── Constellation match (score ≥ 0.7)?
              │     └── YES → Bridge in conversation → Tier A/B game
              │
              ├── Property bridge available?
              │     └── YES → Tier P (property-bridge template)
              │
              └── No match → Conversation-only mode (no game)
```

### Entity Constellation Bridging

Each gold standard entity has a "constellation" — semantically related entities that can be bridged to its game through natural conversation.

**Bridge rules:**
1. One bridge attempt per conversation — never retry if child ignores it
2. Honor the original entity — bridge adds a connection, never dismisses
3. Category must match — don't bridge indoor entity to outdoor game
4. Minimum constellation score 0.7
5. The game references BOTH entities — "Since your kitten is a cousin of a lion..."

**Bridge types** (strongest → weakest):
1. Same taxonomy (kitten → lion)
2. Part-of (swing → playground)
3. Same domain (tulip → sunflower)
4. Shared affordance (toy car → bicycle)
5. Same role (stuffed bunny → teddy bear)
6. Companion (toothbrush → toothbrush holder)
7. Shared habitat (pond frog → goldfish)

---

## 8. Automated Game Design Pipeline

Games can be generated automatically using an LLM agent. The agent reads entity mapping data, applies templates, generates both spec and prod files, self-evaluates, and commits — with no human intervention needed per design.

### Setup (one-time)

The agent reads all reference files before starting:

| File | What the agent learns |
|---|---|
| `program.md` | Constraints, output format, rubric, exemplars |
| `templates.md` | Structural skeletons + pillar overlays |
| `docs/game_styles.md` | 12 game styles taxonomy |
| `entity_guidance.md` | How to read entity mapping YAMLs |
| `conversation_bridge.md` | Warm/cold start bridge patterns |
| `transform.md` | Spec → prod conversion rules |
| `assignments.md` | Work queue (what to generate) |

### The Assignment Queue

Games are queued in `assignments.md`. Each line specifies what to generate:

```markdown
## Batch N: [Description]

- [ ] goldfish + category 1, tier=T1, mapping=animals_goldfish, start=warm+cold,
      scene=child photographs their pet goldfish swimming in a glass bowl
- [ ] playground + category 5, tier=T1, mapping=buildings_places_playground, start=warm+cold,
      scene=child photographs the slide at the neighborhood playground
```

**Assignment fields:**

| Field | Required | Description |
|---|---|---|
| `entity` | Yes | The entity name |
| `category` | Yes | 1 (Cat1) or 5 (Cat5) |
| `tier` | Yes | T0, T1, or T2 |
| `pillar` | No | Experience pillar (inferred if omitted) |
| `style` | No | Game style (inferred from pillar + category if omitted) |
| `mapping` | No | Entity mapping ID (e.g., `animals_goldfish`). Enables mapping-informed design. |
| `start` | No | `warm+cold` for dual bridge (mapping-informed) or omit for cold-start only |
| `scene` | No | Trigger scene description (invented if omitted) |

### The Design Loop (per assignment)

```
Step 1: Parse assignment → extract entity, category, tier, pillar, style, mapping
    ↓
Step 1.5: Load entity mapping YAML (if mapping= specified)
    → Extract IB themes, key concepts, related concepts, tier_guidance
    → Select 2-3 anchor dimensions
    → Select key concepts, theme, related concepts per entity_guidance.md rules
    ↓
Step 2: Load base template + pillar overlay from templates.md
    → Brainstorm creative variables grounded in mapping data
    ↓
Step 3: Generate full activity design (spec format)
    → 5-6 steps, full dialogue, 3 response branches, screen descriptions
    → If mapping-informed + start=warm+cold: generate BOTH Step 1a and Step 1b
    ↓
Step 4: Self-evaluate against 10 dimensions
    → Fix failures, re-evaluate until ALL PASS
    ↓
Step 5: Save spec → designs/{entity}_cat{N}_gold_spec.md
    ↓
Step 5.5: Transform spec → prod (apply transform.md rules)
    → Save prod → designs/{entity}_cat{N}_gold_prod.md
    ↓
Step 6: Log result → results.tsv
    (entity, category, tier, pillar, style, D1-D10 scores, filename, timestamp)
    ↓
Step 7: Mark assignment [x] complete in assignments.md
    ↓
Step 8: Git commit (spec + prod + results.tsv + assignments.md)
    ↓
Step 9: Next assignment → repeat
```

### Results Tracking

All generated designs are logged to `results.tsv`:

```
assignment  entity  category  tier  pillar  style  status  d1_tech  d2_hook  d3_edge  d4_ib  d5_tier  d6_dialogue  d7_screen  d8_mapping  d9_game_feel  d10_pillar  filename  timestamp
```

This gives a complete audit trail of what was generated, when, and how it scored.

### Mapping-Informed vs Non-Mapping Designs

| Aspect | Mapping-informed | Non-mapping |
|---|---|---|
| Assignment has | `mapping=animals_goldfish` | No `mapping=` field |
| Entity data | Full IB mapping YAML (themes, concepts, tier_guidance) | None — agent uses general knowledge |
| Bridge type | Warm + cold start (Step 1a + 1b) | Cold start only (Step 1b) |
| D8 evaluation | Scored (concepts must trace to mapping) | N/A |
| Quality | Higher — grounded in researched IB data | Good — but less IB-grounded |

### Running the Pipeline

To generate games at scale:

1. **Add assignments** to `assignments.md` (one per entity × category × tier)
2. **Launch the agent** — it reads setup files, then loops through assignments
3. **Monitor** `results.tsv` for progress and any FAILs
4. **Review** generated designs (spot-check spec files for quality)

The agent commits after every completed design (ratchet principle — work is never lost). If interrupted, it resumes from the first uncompleted `- [ ]` assignment.

### Batch Design Tips

- **Parallelize independent styles**: Different pillars can be generated simultaneously by separate agents
- **Start with gold standards**: Generate 1 exemplar per style before scaling
- **Mix tiers**: Vary T0/T1/T2 across a batch for diversity
- **Diversify entities**: Within the same style, use different entity types (animal, object, place)

---

## 9. Expanding the Game Inventory

Three ways to expand, from easiest to hardest:

### Way 1: Expand Constellation Maps (No design needed)

**Effort**: Minutes per entity.
**Impact**: More entities get Tier B games.

Add entries to `constellation_map.yaml` mapping unmapped entities to existing gold standards:
```yaml
# Example: kitten maps to lion's voice_stage game
kitten:
  constellation_match: lion
  bridge_type: same_taxonomy
  score: 0.85
  adaptation_notes: "Replace roar with meow, jungle with neighborhood"
```

**Prioritize**: Common entities that children frequently photograph but aren't in the IB mind map.

### Way 2: Create New Property-Bridge Templates (Moderate effort)

**Effort**: ~2 hours per template (spec + prod).
**Impact**: Covers many entities at once.

Good candidates for new property-bridge templates:
- Properties not yet covered (see §5 allowed properties list)
- Styles underrepresented in the current set
- Properties commonly detected across many entities

### Way 3: Create New Entity Gold Standards (Highest effort)

**Effort**: ~4 hours per gold standard (spec + prod + evaluation).
**Impact**: One entity gets a 10/10 game.

**When to invest in a gold standard:**
- Entity is very common (children photograph it frequently)
- Entity has rich IB mapping data
- Entity has unique affordances that no existing game captures
- The entity's best pillar/style has no close constellation match

### Expansion Priority Matrix

| Priority | Action | Entities/Properties | Rationale |
|---|---|---|---|
| **High** | Constellation mapping | Common pets (cat, dog, hamster), common toys (doll, LEGO, ball) | High photo frequency, easy to map to existing gold standards |
| **High** | Entity gold standards | Entities with rich IB mappings that don't fit constellations | eye, firefighter, crayons need their own games |
| **Medium** | Property-bridge templates | Indoor-specific properties (has buttons, has screen, soft/hard) | Improve Cat1 indoor coverage |
| **Medium** | Legacy design rewrite | 25 old designs in old format | Bring existing work into new pillar system |
| **Low** | New property types | Niche properties (transparent, hollow, symmetrical) | Diminishing returns — current 12 properties cover most cases |

---

## 10. V1 Technical Constraints

What the system CANNOT do (do not design games that require these):

| Blocked | Cannot do | Workaround |
|---|---|---|
| OCR | Read text, signs, labels | Ask child to read aloud |
| Face detection | Detect expressions, smiles | Ask child to describe emotions |
| IMU | Detect camera angle/tilt | N/A |
| State comparison | Compare before/after photos | Use single-photo designs only |
| Non-speech audio | Detect clapping, tapping, music | Ask child to self-report |

**Safe capabilities**: Object classification from photos, ASR (speech-to-text), multi-photo workflows (each photo independent), text-to-speech for AI dialogue.

---

## 11. File Structure & Naming

### Directory Layout

```
designs/
├── cat1/
│   ├── lion_cat1_gold_spec.md          # Entity gold standard (spec)
│   ├── lion_cat1_gold_prod.md          # Entity gold standard (prod)
│   ├── detail_detective_property_gold_spec.md   # Property-bridge (spec)
│   ├── detail_detective_property_gold_prod.md   # Property-bridge (prod)
│   ├── eye_cat1_spec.md                # Legacy design (spec)
│   └── eye_cat1_prod.md               # Legacy design (prod)
├── cat5/
│   ├── playground_cat5_gold_spec.md
│   ├── shape_quest_property_gold_spec.md
│   └── ...
```

### Naming Conventions

| Type | Pattern | Example |
|---|---|---|
| Entity gold standard | `{entity}_cat{N}_gold_spec.md` | `lion_cat1_gold_spec.md` |
| Entity gold standard (prod) | `{entity}_cat{N}_gold_prod.md` | `lion_cat1_gold_prod.md` |
| Property-bridge template | `{name}_property_gold_spec.md` | `shape_quest_property_gold_spec.md` |
| Property-bridge template (prod) | `{name}_property_gold_prod.md` | `shape_quest_property_gold_prod.md` |
| Legacy design | `{entity}_cat{N}_spec.md` | `eye_cat1_spec.md` |

### Spec vs Prod Differences

| Aspect | Spec | Prod |
|---|---|---|
| Title | `# Activity Design: ...` (H1) | `## Activity Name` (H2) |
| Metadata | `> Generated: ...` | None |
| Basic Info | Bullet list | Table |
| Steps | Bold inline + blockquotes | H4 headers + inline |
| Round detail | All rounds fully detailed | Rounds 2+ condensed |
| Scorecard | Included (10 dimensions) | Not included |

---

## 12. Quick Reference Checklists

### Before You Start Designing

- [ ] Read the gold standard for your target style (both spec and prod)
- [ ] Read the pillar overlay in `templates.md`
- [ ] If mapping-informed: read the entity mapping YAML
- [ ] Confirm the entity + pillar pairing makes sense (ask: "does this entity naturally evoke this pillar's feeling?")
- [ ] Check existing inventory — does a similar game already exist?

### During Design

- [ ] Step 1 opens with emotion, not knowledge testing
- [ ] Every step has 3 response branches (ideal, unexpected, silence)
- [ ] All AI dialogue has tone/emotion markers
- [ ] Screen descriptions are specific (not "an animation plays")
- [ ] Language matches the target tier
- [ ] The magic moment is clear and emotionally distinct
- [ ] Rounds escalate (don't repeat the same difficulty)

### After Design

- [ ] Run self-evaluation scorecard — ALL 10 dimensions PASS
- [ ] D9 check: Is there genuine uncertainty + a satisfying resolution?
- [ ] D10 check: Could a blind reader identify which pillar this belongs to?
- [ ] Write prod version (condensed format)
- [ ] Save with correct naming convention
- [ ] Add constellation adaptation notes (if entity gold standard)

---

## 13. Reference Files

| File | What it contains | When to read |
|---|---|---|
| `docs/game_styles.md` | 12 style definitions, lineage, distribution | Before choosing a style |
| `templates.md` | Base templates + pillar overlays + creative variables | Before writing any game |
| `program.md` | Agent instructions, format spec, rubric details | For format requirements |
| `run.md` | Execution workflow, results logging | For the end-to-end process |
| `entity_guidance.md` | How to read entity mapping YAMLs | For mapping-informed designs |
| `conversation_bridge.md` | Warm/cold start bridge patterns | For Step 1 design |
| `docs/plans/2026-04-01-style-recommender.md` | Style Recommender system design | For understanding game selection |
| `docs/plans/2026-04-08-entity-bridging.md` | Entity bridging + property-bridge system | For understanding the full pipeline |
