# Activity Category Templates

> These templates define the **structural skeleton** for each activity category.
> The agent uses these as scaffolding — filling entity-specific content into the slots.
> This ensures consistency across activities within the same category while allowing creative variation in the entity-specific parts.

---

## How Templates Work

Each template defines:
- **Fixed structure**: Step sequence, step purposes, UI patterns — these are CONSTANT across all entities
- **Variable slots**: Marked with `{curly braces}` — these are entity-specific and must be invented fresh each time
- **Creative variables**: The METAPHOR, ROLE, and COLLECTION LOGIC change per entity — these are where originality lives

The agent should:
1. Read the template for the assigned category
2. Fill ALL `{variable}` slots with entity-specific content
3. Expand each step to full detail (dialogue, 3 response branches, screen descriptions) per program.md format
4. Ensure the creative variables (metaphor, role) are genuinely fresh — not recycled from exemplars

---

## Template A: Category 1 — Sustained Verbal Interaction (In-Device)

**Reference exemplar**: Stuffed dog → "Mood Changer" (心情变变变)

### Structural Constants

| Property | Value |
|---|---|
| Device relation | In-Device (no physical movement after initial photo) |
| Setting | Indoor, quiet environment |
| Step count | 5 |
| Round count | 3–5 in the multi-round step |
| Camera use | Initial photo only — no additional photos required |
| Core mechanic | AI presents scenarios → child responds verbally → AI validates and extends |

### Step Skeleton

```
STEP 1a: Transition Bridge — Warm Start (mapping-informed only)
  Purpose: Continue the emotional thread from the preceding conversation.
           Reference a SPECIFIC dimension topic the child explored.
  Pattern: Use 1–2 opener flavors from conversation_bridge.md §2:
    - Recall:    "Remember when we looked at {entity}'s {attribute}? {mapping_value}..."
    - Discovery: "You figured out that {entity} has {attribute}! {build_on_it}..."
    - Curiosity: "You were so curious about {dimension_topic}... let's go deeper!"
    - Challenge: "You noticed {attribute} — I bet we can play a game with that..."
  Source:  {attribute} and {dimension_topic} MUST come from tier_guidance dimensions.
           Prefer engagement dimensions: emotions, imagination, narrative, relationship.
  Screen:  {entity} photo centered, with soft "conversation recap" glow around referenced feature.

STEP 1b: Transition Bridge — Cold Start
  Purpose: Emotional hook. React to the photographed {entity} with delight.
           Ask an EMOTIONAL or IMAGINATIVE question (never knowledge-testing).
  Pattern: "Wow, {entity}! {emotional observation}. {imaginative question}?"
  Screen:  {entity} photo centered, with {ambient animation} creating atmosphere.

  Note: Steps 2+ are shared — both warm and cold paths converge at Step 2.

STEP 2: Rule Introduction + Demo
  Purpose: Establish the game mechanic through a quick DEMONSTRATION, not dry rules.
           AI models the expected behavior first, then invites child.
  Pattern: "Here's how it works: I'll {describe mechanic}. For example... {AI demos}.
            Got it? Let's go!"
  Screen:  Simple icons representing the game mechanic appear alongside {entity} photo.

STEP 3: Multi-Round Interaction (3–5 rounds)
  Purpose: Core gameplay. Each round presents a NEW {scenario/prompt} that targets a
           DIFFERENT {target_response_type}. Rounds should ESCALATE in complexity.
  Pattern per round:
    AI: "{scenario_description}. What does {entity} {do/say/feel}?"
    Child responses: ideal / unexpected / silence — each with specific AI follow-up
    AI follow-up always: validates → extends with bonus knowledge → transitions to next
  Screen:  Visual changes to match the current scenario (animations, scene shifts).
  
  ESCALATION GUIDE:
    Round 1: Simple, obvious, high-success — build confidence
    Round 2: Slightly more complex — introduce a contrasting {target}
    Round 3: Surprising or funny — peak engagement
    Round 4-5 (if child is engaged): Open-ended — child leads, AI follows

STEP 4: Celebration + Role Title
  Purpose: Celebrate the child's performance with a specific ROLE TITLE that
           summarizes what they did.
  Pattern: "You just became a {role_title}! You {summary of what child demonstrated}!"
  Screen:  Trophy/badge/medal animation with {role_title} text. Celebration sound.

STEP 5: Closing + IB Concepts
  Purpose: Naturally name Key Concepts as praise, not vocabulary lesson.
  Pattern: "Look — {concept_connection_to_activity}. That's the magic of
            {Key_Concept_1}! {optional: And {Key_Concept_2}!}"
  Screen:  Key Concept words appear artistically with icons related to {entity}.
```

### Creative Variables (MUST be unique per entity)

| Variable | Description | Example (stuffed dog) | Example (toy dinosaur) |
|---|---|---|---|
| `{metaphor}` | The imaginative frame that transforms education into play | "Magic spell lets you hear the dog's inner voice" | "Time machine lets you visit the dinosaur's ancient world" |
| `{role_title}` | Badge/title the child earns | "Emotion Translator" | "Dino Time Traveler" |
| `{game_mechanic}` | What the child DOES each round | Voices the dog's emotions in different scenarios | Describes what the dinosaur sees/does in different time periods |
| `{scenario_type}` | What varies across rounds | Different events triggering different emotions | Different prehistoric scenes or situations |
| `{target_response_type}` | What cognitive/emotional skill each round targets | Emotions: happy → surprised → scared → excited | Sensory descriptions: sight → sound → feeling → action |
| `{escalation_axis}` | How rounds get progressively richer | Emotional complexity: obvious → subtle → mixed feelings | Temporal complexity: concrete → abstract → cause-and-effect |

### Dimension Anchoring (mapping-informed designs)

Before brainstorming creative variables, select 2–3 **anchor dimensions** from the entity mapping that will supply the activity's core content (see entity_guidance.md §6).

**For Category 1 — Engagement-First anchoring:**

| Anchor Priority | Dimension Type | Purpose in Activity |
|----------------|----------------|---------------------|
| Primary anchor | emotions, imagination, narrative, or reasoning | Drives the game mechanic — what the child explores each round |
| Secondary anchor | relationship or another engagement dimension | Provides variety across rounds — comparison, storytelling, cause-effect |
| Physical ground | appearance, senses, or function | Gives the verbal game concrete, observable hooks from the real entity |

**How anchors shape creative variables:**
- `{game_mechanic}` should exercise the primary anchor dimension
- `{scenario_type}` should draw round content from primary + secondary anchors
- `{target_response_type}` maps to the engagement skill in the anchor dimensions
- AI dialogue vocabulary comes from the physical ground dimension's `value` fields

### Game Style Sub-Patterns (Cat 1)

The `game_style` parameter (see program.md §1.6) constrains how the creative variables should be shaped. Use the matching sub-pattern below.

#### `voice_acting`
- **Game mechanic**: AI presents a scenario with an emotion/situation → child speaks AS the entity (roars, sings, narrates feelings)
- **Scenario type**: Different situations triggering different emotions or reactions
- **Target response type**: Emotional expression — happy → surprised → scared → mixed
- **Escalation axis**: Emotional complexity (obvious → subtle → mixed feelings)
- **Role title direction**: "Reporter," "Translator," "Spokesperson" — child interprets for the entity
- **Examples**: Roar Reporter (lion), Color Feelings (crayons), Rainy Day Feelings (raincoat), Secret Song Storyteller (piano)

#### `storytelling_chain`
- **Game mechanic**: AI narrates the start of a chapter/scene → child adds what happens next
- **Scenario type**: Sequential chapters in the entity's life story or journey
- **Target response type**: Narrative continuation — what happens, who appears, how it ends
- **Escalation axis**: Narrative complexity (concrete events → abstract themes → cause-and-effect)
- **Role title direction**: "Reporter," "Storyteller," "Narrator" — child builds the story
- **Examples**: The Banana's Big Adventure (banana)

#### `prediction_game`
- **Game mechanic**: AI describes a cause/situation → child predicts the effect/outcome
- **Scenario type**: Different cause-effect scenarios related to the entity
- **Target response type**: Predictions — what will happen, why, what changes
- **Escalation axis**: Causal complexity (obvious → hidden → chain reactions)
- **Role title direction**: "Detective," "Scientist," "Guesser" — child investigates causes
- **Examples**: Goldfish Guess-What (goldfish), The Secret Eye Detective (eye)

#### `helper_hotline`
- **Game mechanic**: AI presents a problem scenario → child proposes a solution/action
- **Scenario type**: Different problems or needs related to the entity's domain
- **Target response type**: Problem-solving — what to do, what tool to use, who to call
- **Escalation axis**: Problem complexity (simple need → tricky situation → ethical dilemma)
- **Role title direction**: "Helper," "Fixer," "Doctor" — child is the problem-solver
- **Examples**: Teddy's Bedtime Helper (teddy bear), Helper Hotline (firefighter), The Bathroom Helper Game (toothbrush holder)

### Entity Adaptation Checklist

When adapting to a new entity, verify:
- [ ] The metaphor makes sense for THIS entity (not forced/generic)
- [ ] The scenario types are plausible for THIS entity's real-world context
- [ ] The role title is specific to what the child actually DOES (not generic "explorer")
- [ ] Round escalation uses a dimension natural to THIS entity
- [ ] Screen visuals reference THIS entity's actual appearance/features
- [ ] Closing IB concepts are EARNED by what the child did, not pre-assigned
- [ ] The game style sub-pattern is followed (see above) — mechanic, scenario type, and escalation match the assigned style
- [ ] (Mapping-informed) Anchor dimensions are identified and drive the creative variables
- [ ] (Mapping-informed) Vocabulary/facts in AI dialogue are traceable to mapping attributes

### Quick Entity Brainstorm Guide

| Entity Type | Natural Metaphor Direction | Natural Game Mechanic |
|---|---|---|
| Stuffed animals / toys | "What if it came alive?" — personality, emotions, adventures | Child voices the toy's feelings/thoughts in scenarios |
| Food items | "What if it told its life story?" — journey from farm to table | Child narrates the food's journey through different stages |
| Vehicles (toy) | "What if you were the driver?" — destinations, passengers, missions | Child decides where to go, who rides, what happens |
| Household objects | "What if it had a secret life?" — nighttime adventures, hidden talents | Child imagines what the object does when no one's watching |
| Animals (real or toy) | "What if you could understand its language?" — communication, needs | Child translates the animal's sounds/body language |

---

## Template B: Category 5 — Collection/Tracking Exploration (Out-of-Device)

**Reference exemplar**: Patterned stone → "Story Creator" (故事创想家)

### Structural Constants

| Property | Value |
|---|---|
| Device relation | Out-of-Device (child physically moves and explores) |
| Setting | Outdoor — park, yard, playground, nature |
| Step count | 5–6 |
| Round count | 3–4 photo-taking rounds in the exploration step |
| Camera use | Initial photo + 2–3 additional photos during collection |
| Core mechanic | AI identifies a VISUAL FEATURE → frames a COLLECTION MISSION around it → child explores and photographs finds → AI reacts to each → child SYNTHESIZES the collection |

### Step Skeleton

```
STEP 1a: Transition Bridge — Warm Start (mapping-informed only)
  Purpose: Continue from the conversation by connecting a PHYSICAL dimension the child explored
           to the collection mission. Reference a specific attribute from the mapping.
  Pattern: Use 1–2 opener flavors from conversation_bridge.md §2:
    - Recall:    "Remember when we noticed {entity}'s {attribute}? {mapping_value}..."
    - Discovery: "You discovered that {entity} has {attribute}! Let's find more like that..."
    - Curiosity: "You were so curious about {dimension_topic}... what if we went looking?"
    - Challenge: "You noticed {attribute} — I bet there are more hiding nearby..."
  Source:  {attribute} MUST come from tier_guidance physical dimensions: appearance, senses, structure.
           {visual_feature} for collection criterion should trace to a mapping attribute.
  Screen:  {entity} photo with {visual_feature} highlighted + "conversation recap" glow.

STEP 1b: Transition Bridge — Cold Start
  Purpose: Emotional hook. React to the {entity}'s most STRIKING VISUAL FEATURE.
           Frame that feature with wonder, then ask what it reminds the child of.
  Pattern: "Look at {specific_visual_feature} on this {entity}! It's like {imaginative_comparison}.
            What does it remind YOU of?"
  Screen:  {entity} photo with {visual_feature} area subtly highlighted (soft glow/circle).

  Note: Steps 2+ are shared — both warm and cold paths converge at Step 2.

STEP 2: Mission Briefing
  Purpose: Transform the visual feature into a COLLECTION MISSION with a clear ROLE for the child.
           Give 3 concrete sub-tasks.
  Pattern: "You are now a {role_title}! Your mission:
            Step 1: Find {N} more things nearby that have {collection_criterion}.
            Step 2: Photograph each one.
            Step 3: {synthesis_task — name them, organize them, create something with them}."
  Screen:  Mission card with {role_title} badge, {N+1} empty slots (first filled with initial photo),
           and numbered task list with icons.

STEP 3: Multi-Round Exploration (3–4 rounds)
  Purpose: Child physically explores, finds items, photographs them. AI reacts to each find
           with enthusiasm, asks the child to DESCRIBE or NAME the find, and scaffolds if needed.
  
  Per-find pattern:
    (Child takes a photo)
    AI: "{excited reaction}! What did you find? {specific question about the feature}?"
    Child responses: describes it / says nothing / item doesn't clearly match
    AI follow-up:
      - Match: "{validate + extend with knowledge}. {Assign a name/role}. {N} more to go!"
      - No match: "{find something positive about it anyway}. That could count as {stretch}.
                    {N} more to go!"
      - Silent: "I see {AI describes what it sees in the photo}! What would YOU call it?"
    Screen: New photo slides into next slot. Counter updates. Brief celebration animation.

  STUCK BRANCH (if child can't find something):
    AI: "{helpful, specific hint about WHERE to look for {collection_criterion}}.
         Try {concrete location suggestion}!"
    This is CRITICAL — never leave the child without a concrete next action.

STEP 4: Collection Complete + Synthesis
  Purpose: All items found. Now the child DOES something with the collection — 
           names it, tells a story, finds a pattern, or creates a classification.
  Pattern: "Your collection is complete! Now, {synthesis_prompt}?"
  
  {synthesis_type} varies by entity:
    - NARRATIVE: "What story would these {items} tell together?"
    - CLASSIFICATION: "Can you sort them into groups? What's similar?"
    - NAMING: "Give your collection a team name!"
    - PATTERN: "What do all of these have in common? What's different?"
  
  Screen: All photos displayed together (grid or lineup). Connection lines or grouping visuals
          appear based on {synthesis_type}.

STEP 5: Discovery Celebration
  Purpose: Celebrate the collection AND the pattern/connection the child found.
           Ask a reflective question about WHY this pattern exists.
  Pattern: "{celebration}! You found {N} different things that all {shared feature}.
            Why do you think {reflective_question}?"
  Screen:  Collection displayed as a cohesive set. Animated connections between items.

STEP 6: Closing + IB Concepts
  Purpose: Name Key Concepts naturally as praise.
  Pattern: "You discovered the {Key_Concept_1} of {feature} — {explanation}.
            And you found {Key_Concept_2} between {entity} and {other finds}.
            You earned your {badge_name}!"
  Screen:  Badge animation with collection photos as insets.
           Key Concept words styled artistically with entity-relevant imagery.
```

### Creative Variables (MUST be unique per entity)

| Variable | Description | Example (stone) | Example (ladybug) |
|---|---|---|---|
| `{visual_feature}` | The specific observable feature that anchors the mission | Patterns/lines on the stone surface | Spots/dots on the ladybug's shell |
| `{collection_criterion}` | What the child looks for | Things with interesting patterns/lines | Things with dots, spots, or circles |
| `{metaphor}` | The frame that makes collecting meaningful | "Stone Theater Troupe" — each stone is an actor | "Polka-Dot Patrol" — child is a dot detective |
| `{role_title}` | The child's mission role | "Director" | "Patrol Officer" |
| `{synthesis_type}` | What the child does with the collection | NARRATIVE — creates a story | PATTERN — notices what connects them |
| `{reflective_question}` | The "why" question at the end | "Why do you think stones get different patterns?" | "Why do so many different things have spots?" |
| `{stuck_hint}` | Where to look if the child can't find items | "Try looking near the flower bed edges" | "Look really close at tree bark or flower centers" |

### Dimension Anchoring (mapping-informed designs)

Before brainstorming creative variables, select 2–3 **anchor dimensions** from the entity mapping that will supply the activity's core content (see entity_guidance.md §6).

**For Category 5 — Physical-First anchoring:**

| Anchor Priority | Dimension Type | Purpose in Activity |
|----------------|----------------|---------------------|
| Primary anchor | appearance | Defines the collection criterion — the visual feature children look for |
| Secondary anchor | structure or senses | Adds depth to what children notice about each find |
| Engagement ground | relationship or reasoning | Drives the synthesis step — comparison, pattern-finding, "why" questions |

**How anchors shape creative variables:**
- `{visual_feature}` comes from the primary anchor's `attribute` + `value` fields
- `{collection_criterion}` generalizes the visual feature into a findable pattern
- `{synthesis_type}` maps to the engagement ground dimension
- `{reflective_question}` draws from reasoning or relationship dimension prompts
- `{stuck_hint}` should reference WHERE the attribute naturally occurs (from context dimension if available)

### Game Style Sub-Patterns (Cat 5)

The `game_style` parameter (see program.md §1.6) constrains the synthesis step and overall collection arc. Use the matching sub-pattern below.

#### `comparison_chart`
- **Synthesis type**: CLASSIFICATION or PATTERN — child sorts, compares, or categorizes finds
- **Collection focus**: Finds that have distinct, comparable properties (shape, color, size, function)
- **Synthesis prompt direction**: "Sort these by…" / "Which ones are similar?" / "What's each one's job?"
- **Reflective question direction**: "Why are they different?" / "Why does each one have its own [property]?"
- **Role title direction**: "Inspector," "Detective," "Reporter" — child investigates and categorizes
- **Examples**: The Playground Job Fair (playground), Building Detectives (city library), The Sunshine Parts Patrol (sunflower), Sign Spotter Safari (stop sign), Green Treasure Hunt (green apple)

#### `naming_story`
- **Synthesis type**: NAMING + NARRATIVE — child names finds as characters informed by harvested details, then weaves a story constrained by those details
- **Per-Find Detail Harvesting** (REQUIRED): For each find, AI asks 1-2 open-ended detail questions (visual, sensory, functional, or imaginative — NOT binary yes/no). Child's answer drives the character name. Detail types vary by entity: visual (feather texture, stone pattern), functional (raincoat protection style), imaginative (puddle reflections, cloud shapes)
- **Collection focus**: Varied finds where each one's unique detail becomes a story-driving character trait
- **Synthesis prompt direction**: "Your characters are ready! What adventure do [Name 1], [Name 2], and [Name 3] have together?" Story must reference at least 2 character-specific details harvested during collection
- **Synthesis constraint**: Each character's role in the story comes from their specific harvested detail, not a generic trait. Litmus test: "If the child found different objects, would the story be different?" → must be YES
- **Reflective question direction**: "Why do you think [items] ended up here together?" / "What made each character special?"
- **Role title direction**: "Scout," "Detective," "Explorer" — child discovers and narrates
- **Tier-appropriate depth**: T0: 1 detail Q per find + AI narrates story using child's details; T1: 1-2 detail Qs per find + child co-creates 2-3 sentence narrative with AI scaffolding
- **Examples**: The Wish Puff Safari (dandelion), The Rain Guard Patrol (raincoat), The Puddle Portal (puddle), The Shore Detective Agency (sandy beach), The Sky-Light Brigade (feather), The Color Friends Adventure (crayons), The Rainbow Color Scout (double rainbow), The Warm Color Treasure Hunt (autumn leaf), The Spiral Code Breakers (pinecone)

### Entity Adaptation Checklist

When adapting to a new entity, verify:
- [ ] The visual feature is something a 4–6 year old can ACTUALLY OBSERVE on this entity
- [ ] The collection criterion is broad enough to find 3+ items in a typical outdoor setting
- [ ] The collection criterion is specific enough to feel like a real mission (not just "find anything")
- [ ] The synthesis task matches the collection type (narrative for varied items, pattern for similar items)
- [ ] The stuck hint names REAL, SPECIFIC places to look (not "look around you")
- [ ] The reflective question has no single "correct" answer — it invites genuine wondering
- [ ] The game style sub-pattern is followed (see above) — synthesis type and collection focus match the assigned style
- [ ] (Mapping-informed) Anchor dimensions are identified and drive the creative variables
- [ ] (Mapping-informed) Visual feature and collection criterion trace to mapping attributes

### Quick Entity Brainstorm Guide

| Entity | Visual Feature | Collection Criterion | Mission Metaphor | Synthesis Type |
|---|---|---|---|---|
| Dandelion | Fluffy seed head / yellow petals | Things that are interesting in the park | "Wish Puff Safari" | NAMING + NARRATIVE — per find: "what does it remind you of?" → name from detail → story from named characters |
| Pinecone | Spiral scale pattern | Things with interesting shapes/textures | "Story Code Breakers" | NAMING + NARRATIVE — per find: "what does this pattern look like?" → name from detail → story from character identities |
| Puddle | Reflective surface | Things that reflect or mirror | "Portal Finder" | NAMING + NARRATIVE — per find: "what world does this reflection show?" → name portal → story of portals whispering |
| Feather | Soft texture + fine lines | Things that are light / would float in wind | "Sky-Light Brigade" | NAMING + NARRATIVE — per find: "what does it feel/look like?" → name from detail → story of wind-riding characters |
| Autumn leaf | Color (red/yellow/orange) | Things that are warm-colored | "Flame Finder" | NAMING + NARRATIVE — per find: "what does this warm thing remind you of?" → name from detail → story of flame characters |
| Flower | Symmetry / petal pattern | Things with symmetrical shapes | "Symmetry Spy Mission" | PATTERN — where else does symmetry appear |
| Mushroom | Cap shape + gills underneath | Things with hidden undersides | "Secret Underside Inspector" | DISCOVERY — what's hiding underneath |
| Snail shell | Spiral shape | Things with curves or spirals | "Spiral Safari" | PATTERN — spirals in nature |
| Butterfly | Wing pattern / symmetry | Things with matching left-right sides | "Mirror Match Detective" | PATTERN — why is symmetry everywhere |
| Bird | Movement / perching | Things at different heights | "Sky-to-Ground Survey" | CLASSIFICATION — sort by height |

---

## How the Agent Uses These Templates

1. **Read the template** for the assigned category
2. **Brainstorm creative variables** — use the Quick Entity Brainstorm Guide for inspiration, but always invent something FRESH. Never copy the example column directly.
3. **Fill the step skeleton** with entity-specific content, expanding each step to full program.md format (complete dialogue, 3 response branches, screen descriptions)
4. **Verify with the Entity Adaptation Checklist** before moving to self-evaluation
5. **Run the 9-dimension rubric** as normal (D9 only for mapping-informed designs)

The template ensures structural consistency. The creative variables ensure every activity feels unique.
