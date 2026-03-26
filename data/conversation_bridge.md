# Conversation Bridge Guide

> **Purpose**: Defines how the activity Transition Bridge (Step 1) connects to the preceding conversation phase. Every mapping-informed design must include both a **warm start** (post-conversation) and **cold start** (standalone) bridge variant.

---

## §1 Conversation → Activity Dimension Mapping

In the real WonderLens app, a multi-turn conversation happens BEFORE the activity. That conversation explores the entity through tier_guidance dimensions. The activity should feel like a natural continuation — not a topic change.

Use this table to determine which activity categories flow naturally from which conversation dimensions:

| Conversation Dimensions Explored | Natural Activity Category | Transition Logic |
|----------------------------------|--------------------------|------------------|
| appearance + senses + structure | **Cat 5** (physical features → collection) | "You noticed so many details about {entity}'s {feature}... let's find more things like that!" |
| emotions + imagination + narrative | **Cat 1** (inner world → verbal game) | "You had such interesting ideas about how {entity} feels... let's play a game with that!" |
| function + context + reasoning | **Cat 1** (why/how → scenario reasoning) | "You figured out why {entity} does that... what if we explored more 'what if' questions?" |
| appearance + change | **Cat 5** (transformation → stage collection) | "You noticed how {entity} changes... let's collect things at different stages!" |
| senses + emotions | **Cat 1** (sensory-emotional → feelings game) | "You described how {entity} feels and what it's like to touch it... let's imagine more!" |
| structure + function | **Cat 5** (how it's built → pattern hunt) | "You discovered the parts of {entity}... let's find other things built the same way!" |

### How to use this table

1. Look at your selected **anchor dimensions** (from entity_guidance.md §6)
2. Find the row that best matches your anchor combination
3. Verify the activity category matches your assignment
4. Use the transition logic pattern as a starting point for your warm start bridge

---

## §2 Warm Start Bridge Template

A **warm start** bridge assumes the child has just finished a conversation about the entity using tier_guidance dimensions. The bridge references specific things from that conversation to create emotional continuity.

### Opener Flavors

Choose 1–2 of these flavors for your warm start bridge. Each flavor creates a different emotional tone:

#### Recall
References something the child explored during conversation, creating a sense of shared memory.

```
"Remember when we looked at {entity}'s {specific_attribute}? {observation_from_mapping_value}..."
```

**Example** (banana, T1): *"(warm, conspiratorial tone) Remember how we talked about those little brown freckles on the banana? You said they looked like tiny polka dots..."*

**Source requirement**: `{specific_attribute}` must be a real attribute name from the mapping. `{observation_from_mapping_value}` must reference or paraphrase a `value` field.

#### Discovery
Celebrates something the child figured out, positioning them as capable.

```
"You figured out that {entity} has {attribute_the_child_explored}! {build_on_that_discovery}..."
```

**Example** (goldfish, T1): *"(impressed tone) You figured out that the goldfish uses its tail like a paddle to zoom around! I wonder what else moves like that..."*

**Source requirement**: The discovery must reference a specific `topics` entry or `value` from the mapping.

#### Curiosity
Builds on a question or wonder the child expressed, honoring their natural inquiry.

```
"You were so curious about {dimension_topic}... let's go deeper!"
```

**Example** (banana, T1): *"(excited, leaning-in tone) You were so curious about why the banana gets softer as it sits on the counter... what if we explored more things that change like that?"*

**Source requirement**: The curiosity topic must come from a `topics` list in the mapping.

#### Challenge
Positions the next activity as an extension of something the child noticed — a playful dare.

```
"You noticed {attribute} — I bet there are more hiding nearby..."
```

**Example** (goldfish, T1): *"(playful challenge tone) You noticed the goldfish's scales look like tiny shiny roof tiles... I bet if we look around, we'll find other things with that same pattern!"*

**Source requirement**: `{attribute}` must reference a specific mapping `value` or `attribute` name.

### Warm Start Construction Rules

1. **Must reference a specific dimension topic from the entity mapping** — not a generic "we talked about it"
2. **Must use 1–2 of the opener flavors above** — don't invent new patterns
3. **Opens with emotional resonance** — recognition of shared experience, NOT first-encounter wonder
4. The tone marker should reflect warmth and continuity: "(warm, building on earlier)", "(excited, connecting back)", "(conspiratorial, like sharing a secret)"
5. **Must flow into the same Step 2 as the cold start** — the warm bridge is an alternative entry point, not a different activity

---

## §3 Cold Start Bridge

A **cold start** bridge is the current default behavior: the child photographs the entity with no prior conversation. This is the existing Step 1 pattern from `templates.md`.

### Cold Start Rules

- Uses the standard emotional hook pattern: react to entity with delight → imaginative question
- Does NOT reference any prior conversation (there was none)
- Follows the existing Hook Rule from program.md §1.7
- No changes from current behavior

### Cold Start Template (unchanged)

```
"(tone/emotion marker) {emotional_reaction_to_entity}! {imaginative_observation}. {open_question}?"
```

**Example** (banana, T1): *"(delighted surprise) Wow, look at this banana! It's all curvy like a big yellow smile. If this banana could talk, what do you think it would say?"*

---

## §4 Dual-Bridge Requirement

Every mapping-informed activity design MUST include both bridge variants in Step 1.

### Output Format

```
**Step 1a: Transition Bridge — Warm Start** (post-conversation)

> **Context**: Child has just finished a tier_guidance conversation about {entity}.
> **Conversation anchor**: {dimension} — {specific attribute or topic referenced}
>
> **AI says**: "(tone marker) {warm start dialogue using §2 patterns}..."
>
> [standard response branches + screen description]

**Step 1b: Transition Bridge — Cold Start** (standalone)

> **Context**: Child photographs {entity} with no prior conversation.
>
> **AI says**: "(tone marker) {cold start dialogue using §3 pattern}..."
>
> [standard response branches + screen description]

**Step 2: [Step Name]** (shared — both warm and cold paths converge here)

> [standard format continues]
```

### Rules

1. **Step 1a and Step 1b are alternatives** — in the real app, exactly one runs depending on whether a conversation preceded the activity
2. **Steps 2 onward are shared** — they must work regardless of which bridge was used
3. **Step 1a must reference at least one specific mapping dimension/attribute** — this is checked in D9 evaluation
4. **Step 1b must pass the standard Hook Rule (D2)** — no regression from current quality
5. **Both variants must lead naturally into Step 2** — the child should arrive at Step 2 in a similar emotional state regardless of entry path
6. **Screen descriptions may differ** between 1a and 1b (warm start might show a "conversation recap" visual element)

### Convergence Check

After writing both bridges, verify:
- Could a child arriving from either bridge understand Step 2 without confusion?
- Does Step 2 avoid referencing anything that only happened in one bridge?
- Is the emotional energy roughly equivalent at the start of Step 2?

---

## Quick Reference: Writing a Dual Bridge

```
1. Read your anchor dimensions from entity_guidance.md §6
2. Find the best dimension→activity row in §1 table above
3. Write Step 1a (warm):
   a. Pick 1–2 opener flavors from §2
   b. Source specific attributes/values/topics from the mapping
   c. Write dialogue + response branches + screen
4. Write Step 1b (cold):
   a. Use standard emotional hook pattern
   b. No mapping references needed
   c. Write dialogue + response branches + screen
5. Write Step 2 onward (shared):
   a. Verify convergence — both bridges lead here naturally
   b. No references to bridge-specific content
```

---

*End of conversation_bridge.md — consult this for every mapping-informed design's Step 1.*
