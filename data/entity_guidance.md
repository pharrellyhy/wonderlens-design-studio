# Entity Mapping Guidance

> **Purpose**: Teaches the Activity Design Agent how to read structured entity mapping YAML files and use them to ground activity designs in entity-specific data.
> **When to read**: Before designing any activity that has a `mapping=` parameter in its assignment.

---

## §1 Schema Reference

Each entity mapping YAML file contains:

```yaml
- entity_id: food_banana          # Unique identifier — matches mapping= in assignment
  entity_name: Banana             # English display name
  entity_name_cn: 香蕉             # Chinese display name
  domain: food                    # Top-level domain
  parent_category: fruits         # Parent grouping
  subcategory: tropical_fruits    # Specific subcategory

  primary_theme:                  # Strongest IB theme (highest weight)
    theme_id: who_we_are
    weight: 0.39                  # 0–1, relative importance
    reasoning: "..."              # Why this theme fits

  secondary_themes:               # 1–3 additional themes, descending weight
  - theme_id: how_world_works
    weight: 0.27
    reasoning: "..."
    context_trigger: "..."        # When this theme becomes most relevant

  primary_key_concepts:           # Key Concepts with relevance ≥ 0.8
  - concept_id: connection
    relevance: 0.9
    reasoning: "..."

  secondary_key_concepts:         # Key Concepts with relevance 0.5–0.79
  - concept_id: form
    relevance: 0.7
    reasoning: "..."

  candidate_related_concepts:     # Post-activity badge concepts with discipline tags
  - concept_id: nutrition
    discipline: PSPE
    reasoning: "..."

  tier_guidance:                  # Per-tier conversation/activity content
    tier_0:
      dimensions:
        appearance: [...]         # Physical observation attributes
        senses: [...]             # Sensory experience attributes
        emotions: [...]           # Emotional connection prompts
    tier_1:
      dimensions:
        appearance: [...]
        context: [...]            # Where/when/how encountered
        function: [...]           # What it does / how it works
        senses: [...]
        structure: [...]          # Internal composition
        emotions: [...]
        relationship: [...]       # Comparisons to other things
    tier_2:
      dimensions:
        appearance: [...]
        change: [...]             # Transformation over time
        context: [...]
        function: [...]
        senses: [...]
        structure: [...]
        emotions: [...]
        imagination: [...]        # Creative/pretend prompts
        narrative: [...]          # Story-building prompts
        reasoning: [...]          # Cause-effect thinking
        relationship: [...]
```

**Key structural notes**:
- Physical dimensions (appearance, senses, structure) have **attribute objects** with `attribute`, `value`, and `topics` fields
- Engagement dimensions (emotions, imagination, narrative, reasoning, relationship) are **flat lists** of prompt strings
- Not all dimensions appear at all tiers — T0 is simplest, T2 is richest
- `context_trigger` on secondary themes tells you WHEN that theme is most natural to invoke

---

## §2 Key Concept Selection Rules

When choosing Key Concepts for an activity design:

### Rule 1: Primary First (MANDATORY)
- You MUST select at least **1 Key Concept** from `primary_key_concepts` (relevance ≥ 0.8)
- This ensures the activity addresses the entity's most natural conceptual lens

### Rule 2: Second Concept — Primary or Secondary
- The second Key Concept (if using 2) may come from either `primary_key_concepts` or `secondary_key_concepts`
- Prefer the concept whose `reasoning` most closely matches your activity's core mechanic

### Rule 3: Anti-Repetition Guard
- **Do NOT default to Form + Connection** without explicit justification
- Before selecting Form or Connection, check: is there a primary concept with higher relevance that you're skipping?
- If your chosen pair IS Form + Connection, you must note in the design WHY these are the best fit for this specific entity+activity, referencing the mapping's reasoning fields
- Aim for concept diversity across a batch — if the previous 3 designs all used Connection, strongly prefer a different primary concept

### Rule 4: Concept–Activity Coherence
- The selected Key Concepts must be **earned** by the activity mechanics — the child must actually DO something that demonstrates the concept
- Cross-reference: does the mapping's `reasoning` for your chosen concept align with what happens in your activity steps?

---

## §3 Theme Alignment

### Rule: Activity theme must come from the mapping

- The activity's IB Transdisciplinary Theme MUST be drawn from the entity's `primary_theme` or `secondary_themes`
- Default to `primary_theme` unless the activity's specific mechanic aligns more naturally with a secondary theme
- If using a secondary theme, check its `context_trigger` — does your activity scenario match that trigger context?
- Never assign a theme that doesn't appear in the mapping

### How to apply

In the Basic Info section of your design, after listing the theme, add a source note:
```
- **IB Theme**: How the World Works (mapping: secondary, weight=0.27)
```

---

## §4 Related Concept Sourcing

### Rule: At least 2 of 4 from the mapping

- Your activity must list 2–4 Related Concepts (post-activity badges)
- **At least 2** of these must come from `candidate_related_concepts` in the mapping
- The remaining 1–2 may be invented if they genuinely emerge from the activity design
- When sourcing from the mapping, check that the concept's `reasoning` aligns with what happens in your activity

### How to apply

In Basic Info, tag sourced concepts:
```
- **Related Concepts**: Nutrition (mapping), Relationships (mapping), Discovery (designed), Expression (designed)
```

---

## §5 Tier Guidance Usage

### Rule: Ground vocabulary and content in tier-specific attributes — don't invent

The mapping's `tier_guidance` section contains carefully crafted, age-appropriate content for each tier. Use it.

### For physical dimensions (appearance, senses, structure, context, function, change):

Each attribute has:
- `attribute`: a named feature (e.g., "peel_spots")
- `value`: a tier-appropriate description (e.g., "little brown freckles appear as it ripens")
- `topics`: conversation/activity prompts about this attribute

**How to use**:
- Pull **vocabulary** from `value` fields — these are pre-vetted for tier appropriateness
- Pull **facts** and **sensory details** from `value` fields — don't make up new ones
- Use `topics` as inspiration for activity prompts and AI dialogue — adapt the phrasing to fit your activity's tone and mechanic, but keep the content grounded

### For engagement dimensions (emotions, imagination, narrative, reasoning, relationship):

These are flat lists of prompt strings. Use them as:
- Inspiration for emotional hooks in Step 1
- Scaffolding for multi-round interaction prompts
- Reflection questions for closing steps

### Tier matching

- If the assignment specifies `tier=T1`, read from `tier_1.dimensions`
- If a dimension you need doesn't exist at your tier (e.g., T0 has no `structure`), you may reference the next tier up for inspiration, but simplify the language to match T0 constraints
- Never use T2 vocabulary in a T0 design

---

## §6 Dimension Anchoring

Before generating the activity, select **2–3 anchor dimensions** from the mapping that will supply the activity's core content. These dimensions determine what the child explores, collects, or discusses.

### Category 1 (Sustained Verbal Interaction) — Engagement-First

Prefer engagement dimensions as primary anchors:
- **emotions** — feelings about and connections to the entity
- **imagination** — pretend/creative prompts (T2 only, but T0/T1 can draw from emotions)
- **narrative** — story-building prompts (T2 only)
- **reasoning** — cause-effect thinking (T2 only)

Plus **1 physical dimension** as grounding:
- **appearance**, **senses**, or **function** — gives the verbal game concrete hooks

**Example**: For `banana + cat 1, tier=T1`:
- Anchor 1: `emotions` — "Do you like bananas? How do you feel when a banana is too mushy?"
- Anchor 2: `relationship` — "How is a banana like an apple? What does a banana remind you of?"
- Anchor 3 (physical): `senses` — "peel feels slipperier than the inside" / "gets softer as it ripens"

### Category 5 (Collection/Tracking Exploration) — Physical-First

Prefer physical dimensions as primary anchors:
- **appearance** — observable features that define collection criteria
- **structure** — internal composition that reveals patterns
- **senses** — tactile/olfactory features for hands-on exploration

Plus **1 engagement dimension** for synthesis:
- **relationship** — comparisons drive the "what's similar/different" synthesis step
- **reasoning** — "why" questions for the reflection/closing step

**Example**: For `goldfish + cat 5, tier=T1`:
- Anchor 1: `appearance` — "floaty fins", "fan-shaped tail", "round shiny eyes"
- Anchor 2: `structure` — "tiny overlapping scales like shiny roof tiles", "small mouth that nibbles"
- Anchor 3 (engagement): `relationship` — "How is a goldfish like a butterfly?"

### Recording your anchors

In the Basic Info section of your design, list your anchors:
```
- **Dimension Anchors**: emotions (engagement), relationship (engagement), senses (physical)
```

This makes it traceable during D9 evaluation which mapping dimensions drove the design.

---

## Quick Reference: Reading a Mapping File

```
1. Open `data/mappings_dev20_0318/_index.yaml` → find entity_id → get file path
2. Open the YAML file → find the entity block
3. Note: primary_theme, primary_key_concepts (these are your starting constraints)
4. Read tier_guidance for target tier → scan all dimensions
5. Select 2–3 anchor dimensions
6. Select Key Concepts (§2 rules)
7. Select theme (§3 rules)
8. Select Related Concepts (§4 rules)
9. Begin activity design with this grounding
```

---

*End of entity_guidance.md — consult this before every mapping-informed design.*
