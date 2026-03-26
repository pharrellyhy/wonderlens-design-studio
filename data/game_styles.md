# WonderLens Game Style Taxonomy

Six reusable interaction patterns for WonderLens activities. Use this reference when designing new activities: pick a style, then follow its structure.

---

## Cat 1 — In-Device Verbal (4 styles)

### `voice_acting`

- **Category**: Sustained Verbal Interaction (In-Device)
- **Child's role each round**: Speaks or performs AS the object in a scenario
- **What the AI does**: Presents a short scenario with an emotion or situation, then asks the child to voice/act as the object
- **What the child does**: Speaks, roars, sings, or emotes in character — expressing what the object feels or says
- **Example prompt → response**: "Warm sun! Happy lion!" → child roars/says feeling
- **Example designs**: lion_cat1 (Roar Reporter), crayons_cat1 (Color Feelings), raincoat_cat1 (Rainy Day Feelings), piano_cat1 (Secret Song Storyteller)

### `storytelling_chain`

- **Category**: Sustained Verbal Interaction (In-Device)
- **Child's role each round**: Adds what happens next in a narrative
- **What the AI does**: Narrates the start of a chapter or scene, then pauses for the child to continue
- **What the child does**: Tells the next part of the story, building on the AI's setup
- **Example prompt → response**: "Chapter 2: banana hangs high on the tree…" → "It sees birds flying!"
- **Example designs**: banana_cat1 (The Banana's Big Adventure)

### `prediction_game`

- **Category**: Sustained Verbal Interaction (In-Device)
- **Child's role each round**: Predicts what will happen given a cause
- **What the AI does**: Describes a situation or cause, then asks the child to guess the effect
- **What the child does**: Makes a prediction about what happens next based on the scenario
- **Example prompt → response**: "Food flakes drop in water…" → "The goldfish swims up!"
- **Example designs**: goldfish_cat1 (Goldfish Guess-What), eye_cat1 (The Secret Eye Detective)

### `helper_hotline`

- **Category**: Sustained Verbal Interaction (In-Device)
- **Child's role each round**: Decides what to do about a problem
- **What the AI does**: Presents a problem scenario and asks the child for help or a solution
- **What the child does**: Proposes an action, tool, or decision to solve the problem
- **Example prompt → response**: "Kitchen full of smoke!" → "A mask!"
- **Example designs**: teddy_bear_cat1 (Teddy's Bedtime Helper), firefighter_cat1 (Helper Hotline), toothbrush_holder_cat1 (The Bathroom Helper Game)

---

## Cat 5 — Out-of-Device Collection (2 styles)

### `comparison_chart`

- **Category**: Collection/Tracking Exploration (Out-of-Device)
- **Synthesis step**: Collect → compare properties → chart or categorize
- **What the AI does**: Guides the child to photograph real-world items, then helps them compare and categorize what they found
- **What the child does**: Explores the environment, photographs items, names properties, and sorts them into categories
- **Example**: Playground: find equipment, name each one's "job"
- **Example designs**: playground_cat5 (The Playground Job Fair), city_library_cat5 (Building Detectives), sunflower_cat5 (The Sunshine Parts Patrol), stop_sign_cat5 (Sign Spotter Safari), green_apple_cat5 (Green Treasure Hunt)

### `naming_story`

- **Category**: Collection/Tracking Exploration (Out-of-Device)
- **Synthesis step**: Collect → harvest entity-specific details per find → name as characters informed by those details → weave narrative FROM those details
- **What the AI does**: Per find, asks 1-2 detail questions (what does it look/feel/remind you of?). Helps child name each find as a character whose name reflects the harvested detail. At synthesis, scaffolds a narrative where each character's role is constrained by the detail that birthed its name.
- **What the child does**: Per find: observes a specific detail, interprets it, names the find as a character. At synthesis: co-creates a story featuring those characters using their detail-driven identities.
- **Detail type varies by entity**: Visual/sensory (feather texture, stone pattern), functional (raincoat protection style), imaginative (puddle reflections, cloud shapes)
- **Tier-appropriate depth**:
  - T0: 1 detail question per find + 1 story prompt → AI narrates incorporating child's details
  - T1: 1-2 detail questions per find → child names story title → child co-creates 2-3 sentence narrative with AI scaffolding
- **Example designs**: dandelion_cat5, raincoat_cat5, puddle_cat5, sandy_beach_cat5, feather_cat5, crayons_cat5, double_rainbow_cat5, autumn_leaf_cat5, pinecone_cat5

---

## Style Distribution

| Style | Count | Designs |
|-------|-------|---------|
| `voice_acting` | 4 | lion, crayons, raincoat, piano |
| `storytelling_chain` | 1 | banana |
| `prediction_game` | 2 | goldfish, eye |
| `helper_hotline` | 3 | teddy_bear, firefighter, toothbrush_holder |
| `comparison_chart` | 5 | playground, city_library, sunflower, stop_sign, green_apple |
| `naming_story` | 9 | dandelion, raincoat, puddle, sandy_beach, feather, crayons, double_rainbow, autumn_leaf, pinecone |
