# Transform Rules: Engineering Spec → Production Format

## Reference

Match the style of `docs/WonderLens_Game_Designs.md` (Chinese reference). Output is **English only** — do NOT translate to Chinese.

---

## A. Basic Info → 7-Row Table

**Source** (bullet list with 8–12 fields):
```
- **Activity Name**: The Banana's Big Adventure (香蕉历险记)
- **Activity Category**: Category 1 — Sustained Verbal Interaction (In-Device, Indoor)
- **Recommended Tier**: T1 (ages 4–6)
- **Core IB Key Concepts**: Change, Connection
- **Related Concepts (Discipline)**: Journey, Growth, Systems, Discovery
- **ATL Skills Focus**: Thinking Skills (creative thinking, transfer), Communication Skills (expressing ideas, listening), Research Skills (observation)
- **Trigger Entity**: Banana
- **Trigger Scene**: Child photographs a banana on the kitchen table
```

**Target** (table, 7 rows):
```
| Field | Value |
|-------|-------|
| Activity Name | The Banana's Big Adventure |
| Activity Category | Sustained Verbal Interaction (In-Device) |
| Recommended Tier | T1 (ages 4–6) |
| Core IB Key Concepts | Change, Connection |
| Related Concepts | Journey, Growth, Systems, Discovery |
| ATL Skills Focus | Thinking Skills (creative, transfer), Communication Skills (expressing, listening), Research Skills (observation) |
| Game Style | storytelling_chain |
```

**Rules**:
- Drop: Trigger Entity, Trigger Scene, Mapping Source, IB Theme, Dimension Anchors, Conversation Anchor Dimensions
- Strip Chinese translations from Activity Name (e.g., remove `(香蕉历险记)`)
- Simplify Activity Category: remove "Category N —" prefix, remove "Indoor"/"Outdoor"/"Solo" qualifiers
  - "Category 1 — Sustained Verbal Interaction (In-Device, Indoor)" → "Sustained Verbal Interaction (In-Device)"
  - "5 — Collection/Tracking Exploration (Out-of-Device, Solo, Outdoor)" → "Collection/Tracking Exploration (Out-of-Device)"
- Strip "(Discipline)" from Related Concepts label
- Strip "(mapping)" and "(designed)" tags from Related Concept values
- Strip bold formatting from Key Concept values (e.g., `**Function**` → `Function`)
- Remove parenthetical sub-skill labels from ATL if they get too long; keep them short but informative
- Keep the `Game Style` row when present; do not drop it during transformation or later aggregation

---

## B. Activity Overview — Light Trim

Keep all 4 sub-sections: ① Brief Description, ② Educational Purpose (KUD), ③ Design Highlight, ④ Typical Scenario.

**Rules**:
- Keep K/U/D structure exactly
- Trim skill-mapping parentheticals from K/U/D where they add clutter (e.g., remove `(creative thinking)` after a D item if redundant with ATL row)
- Keep content substantive — do NOT over-trim

---

## C. Interaction Flow — Structural Condensation

### Step mapping

| Source | Target heading | Rule |
|--------|---------------|------|
| Step 1a (warm start) | **DROP** | Remove entirely |
| Step 1b (cold start) | `#### Step 1: Transition Bridge` | Use cold-start content only |
| Step 2 | `#### Step 2: Rule Introduction + Demo` | Keep full detail |
| Step 3 (all rounds) | `#### Step 3: Multi-Round Interaction` | Round 1 **in full**, then 1-line summaries for subsequent rounds |
| Step 4 | `#### Step 4: Celebration` | Keep, compress slightly |
| Step 5 | `#### Step 5: Closing + IB Concepts` | Keep full detail |
| Step 6 (cat5 only) | Merge into Steps 4+5 | Cat5 designs have 6 steps; fold Step 5 (Discovery Celebration) into Step 4, and Step 6 (Closing + IB) becomes Step 5 |

### Cat5 6-step → 5-step merge

Cat5 designs typically have:
- Step 4: Collection Complete + Synthesis
- Step 5: Discovery Celebration
- Step 6: Closing + IB Concepts

Merge as:
- **Step 4: Celebration** — combine the synthesis question from old Step 4 with the reflection/favorite question from old Step 5. Keep the team-naming/synthesis part and the "which is your favorite" part. Compress.
- **Step 5: Closing + IB Concepts** — use old Step 6 content directly.

### Round condensation in Step 3

**Round 1**: Keep in full — AI says, Child responses (2-3 branches), AI follow-up, Screen.

**Subsequent rounds**: Condense to 1-line summary format:
```
**Round 2 — "The Big Boat Ride":** The banana is on a boat for the first time; child describes what it feels. AI reveals the banana turns yellow during the voyage.

**Round 3 — "Arriving at the Store":** The banana is on a store shelf; child imagines what it hopes someone will say. AI connects it to the child's family bringing it home.
```

Each summary: round title + 1 sentence capturing the prompt + 1 sentence capturing the key learning/reveal.

---

## D. Dialogue Format

| Source | Target |
|--------|--------|
| `> **AI says**: "*(tone)* text"` | `**AI says:** (tone) "text"` |
| `> **Possible child responses**:` | `**Child responses:**` |
| `> **AI follow-up**:` | `**AI follow-up:**` |
| Blockquote style (`> `) everywhere | Regular markdown (no blockquotes) |
| `*(tone)*` italic in quotes | `(tone)` plain parenthetical before the quote |
| Always 3 branches | 2–3 branches; drop "No response" in Steps 4/5 celebration if it adds nothing |

**Example transformation**:

Source:
```
> **AI says**: "*(warm, surprised tone)* Oh wow, a banana!"
>
> **Possible child responses**:
> 1. (Ideal) "From a tree!"
> 2. (Unexpected) "From my mom!"
> 3. (No response) Child is silent.
>
> **AI follow-up**:
> 1. "*(delighted tone)* Yes! This banana came from SO far away."
> 2. "*(playful tone)* That's true, someone did bring it home!"
> 3. *(Wait 3 seconds)* "*(gentle tone)* This banana is pretty quiet too."
```

Target:
```
**AI says:** (warm, surprised) "Oh wow, a banana!"

**Child responses:**

1. (Ideal) "From a tree!"
2. (Unexpected) "From my mom!"
3. (No response) Child is silent.

**AI follow-up:**

1. (delighted) "Yes! This banana came from SO far away."
2. (playful) "That's true, someone did bring it home!"
3. (wait 3s) "This banana is pretty quiet too."
```

**Tone format**: Simplify tone markers — `*(warm, surprised tone)*` → `(warm, surprised)`. Drop the word "tone" unless it reads awkwardly without it.

---

## E. Screen Descriptions — Compress to 1 Sentence

Source (3-5 sentences):
```
> **Screen**: The child's banana photo is centered on screen with a soft golden glow radiating outward. Tiny animated sparkles drift around the banana like travel dust. A faint dotted line — like a journey path — begins to trace from the bottom-right corner.
```

Target (1 sentence):
```
**Screen:** Banana photo centered with golden glow, sparkle animations, and a faint journey-path dotted line.
```

Capture the **key visual concept** — what the child sees and feels — not animation timing or state changes.

---

## F. Scorecard — Strip Entirely

Remove everything from `## Self-Evaluation Scorecard` onward, including the `---` separator before it.

---

## G. Section Header

Each activity starts with:
```
## Activity Name Here
```

(Use `##` heading, not `## Activity: Name` — drop the "Activity:" prefix.)

Activities are separated by `---` (horizontal rule).

---

## H. Overall Document Structure

```markdown
# WonderLens Activity Designs — Batch 2

---

## The Banana's Big Adventure

### A. Basic Info
[table]

### B. Activity Overview
[4 sub-sections]

### C. Interaction Flow

> Recommended Tier: T1 (ages 4–6)

#### Step 1: Transition Bridge
...
#### Step 2: Rule Introduction + Demo
...
#### Step 3: Multi-Round Interaction
...
#### Step 4: Celebration
...
#### Step 5: Closing + IB Concepts
...

---

## Next Activity Name
...
```
