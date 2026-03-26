## The Shore Detective Agency

### A. Basic Info

| Field | Value |
|-------|-------|
| Activity Name | The Shore Detective Agency |
| Activity Category | 5 — Collection/Tracking Exploration (Out-of-Device) |
| Recommended Tier | T1 (ages 4–6) |
| Core IB Key Concepts | Causation, Connection |
| Related Concepts | Habitat (mapping), Diversity (mapping), Conservation (mapping), Discovery (designed) |
| ATL Skills Focus | Research Skills (observation, data collection), Thinking Skills (critical thinking), Self-Management Skills (focus) |
| Game Style | naming_story |
| Design Version | 2.0 — naming_story redesign |
| Last Updated | 2026-03-24 |
| Trigger Entity | Sandy beach |
| Trigger Scene | Child photographs the sandy shore and explores tiny treasures hidden in the sand |
| Mapping Source | nature_landscapes_sandy_beach |
| IB Theme | Sharing the Planet (mapping: primary, weight=0.42) |
| Dimension Anchors | appearance — sand_grain_sparkle (physical — "Tiny grains that can glitter" drives collection criterion of finding ocean treasures in the sand), structure — shell_bits (physical — "Mixed-in tiny shell pieces" adds depth to what children notice about each find), emotions (engagement — "Do you feel calm or excited?" drives naming and story synthesis) |
| Conversation Anchor Dimensions | appearance — wet_dry_color_change ("Wet sand looks darker than dry sand"), senses — ground_feel ("gritty and warm sand") |

### B. Activity Overview

**① Brief Description**

After photographing the sandy shore, the AI notices the mix of tiny treasures hidden in the sand — sparkly grains, dark shell bits, and smooth pebble pieces — and wonders what kind of characters are hiding on this beach. The child becomes a "Shore Detective" on a mission to find 3 ocean treasures, discover what each one looks and feels like, give each one a character name based on what they observe, and then tell the story of how their ocean characters journeyed to the beach together.

**② Educational Purpose (KUD)**

- **K (Know):** Learn that sand has tiny shell pieces mixed in. Learn that wet sand looks darker than dry sand. Learn the words "shore," "treasure," "washed up," and "tide." Learn that waves carry things from the ocean to the beach.
- **U (Understand):** Understand that things found on the beach got there because waves and tides carried them — each item has a CAUSE for being there (Causation). Understand that the ocean, sand, shells, and seaweed are all linked — they share a Connection as parts of one beach system.
- **D (Do):** Practice close observation by describing textures, shapes, and feelings of found objects (Research Skills — observation). Practice creative naming by turning observations into character names (Thinking Skills — critical thinking). Practice narrative co-creation by weaving characters into a shared story (Research Skills — data collection).

**③ Design Highlight**

The naming_story synthesis turns beachcombing into character creation and storytelling. Every shell, bit of seaweed, or smooth pebble becomes a character whose name comes from the child's own sensory description. A child who says a shell is "smooth and curved like a bowl" might name it "Captain Curvy," while a child who says it is "shiny and cold" might name it "Frosty Shine." The final story moment asks all three characters to share an ocean adventure, making the narrative wholly dependent on what the child found AND how they described it.

**④ Typical Scenario**

Child photographs the sandy shore → AI spots tiny treasures in the sand → child becomes a "Shore Detective" → finds and photographs 3 ocean treasures → describes each one's look and feel → names each as a character → tells the story of their characters' ocean journey together → celebrates as a Shore Detective.

### C. Interaction Flow — Detailed Design [Target Tier: T1]

**Step 1a: Transition Bridge — Warm Start**

> **Context**: Child has just finished a T1 conversation about the sandy beach.
> **Conversation anchor**: appearance — wet_dry_color_change ("Wet sand looks darker than dry sand"); senses — ground_feel ("gritty and warm sand")
>
> **AI says**: *(warm, building on earlier)* "You noticed wet sand looks darker! And it feels gritty! The ocean hides treasures in that sand. Want to find some?"
>
> **Possible child responses**:
> 1. (Ideal) "Yes!" / "I want to find treasures!" / "What treasures?"
> 2. (Unexpected) "I like the sand!" / "It is so warm!" / child touches the sand
> 3. (No response) Child looks at the sand quietly.
>
> **AI follow-up**:
> 1. *(excited)* "Great! The ocean leaves shells and sparkly bits in the sand. Let us go find them!"
> 2. *(warm, connecting)* "It IS warm and gritty! And guess what — hidden in those gritty grains are tiny treasures the ocean left behind!"
> 3. *(wait 2s)* *(gentle, coaxing)* "Look really close at the sand. See anything sparkly? Little shell bits? The ocean hides presents in there!"
>
> **Screen**: Child's beach photo centered with gentle wave animation along the bottom edge; soft golden glow highlighting sand grain sparkles; faint "conversation recap" shimmer on wet sand area.

**Step 1b: Transition Bridge — Cold Start**

> **Context**: Child photographs the sandy shore with no prior conversation.
>
> **AI says**: *(delighted, amazed)* "Wow, look at this sandy shore! I see so many tiny treasures hiding in the sand — sparkly bits, little shell pieces, smooth spots. It is like the ocean left presents on the beach! What do you see in the sand?"
>
> **Possible child responses**:
> 1. (Ideal) "I see shells!" / "There are little shiny things!"
> 2. (Unexpected) "It is just sand" / "I see water"
> 3. (No response) Child is looking around or distracted.
>
> **AI follow-up**:
> 1. *(impressed)* "Great eyes! Those shells did not just appear. The ocean waves washed them right onto the sand. I wonder what else the ocean left here!"
> 2. *(warm, curious)* "Sand is pretty cool, right? But look really close. Wet sand looks darker than dry sand. And there are tiny pieces mixed in. The ocean hides its gifts well!"
> 3. *(wait 2s)* *(playful whisper)* "Psst — look really close at the sand. See any tiny bits that are not just sand grains?"
>
> **Screen**: Child's beach photo centered with gentle wave animation along the bottom edge and small sparkle effects on sand highlights.

#### Step 2: Rule Introduction + Demo

**AI says:** (adventurous, confident) "I have a mission for you! You are now a Shore Detective! Your job is to find ocean treasures and turn them into characters."

(counting on fingers) "Here is your mission: First, find three treasures the ocean left on the beach. Second, take a photo of each one. Third, tell me what it looks like and feels like. And then — we give each treasure a character name! At the end, we will tell the story of their big ocean adventure together!"

**Child responses:**

1. (Ideal) "Okay!" / "I want to find treasures!"
2. (Unexpected) "What should I look for?" / "I do not know what to find"
3. (No response) Child seems unsure or hesitant.

**AI follow-up:**

1. (pumped up) "Let us go, Detective! Walk along the sand and look for shells, seaweed, smooth stones, or driftwood. When you spot a treasure, take a photo!"
2. (helpful, warm) "Great question! Look for things that do not look like plain sand. Shells, seaweed, little sticks, or smooth pebbles. They are all ocean treasures! Go explore!"
3. (wait 2s) (gentle, encouraging) "Try walking along the wet sand near the water. That is where the waves drop the best treasures. You will find something!"

**Screen:** Mission card with a detective badge labeled "Shore Detective," four slots (first filled with beach photo, three empty with question marks and magnifying glass icons), and a numbered task list showing "Find → Describe → Name → Story!"

#### Step 3: Multi-Round Interaction

**Round 1:**

*(Child takes a photo of something they found — e.g., a seashell)*

**AI says:** (thrilled, detective voice) "Treasure number one! Ooh, look at that! Pick it up, Detective. What does it feel like? Is it smooth or rough? What does it remind you of?"

**Child responses:**

1. (Ideal) "It is smooth and curved like a bowl!" / "It feels bumpy and rough!"
2. (Unexpected) "A shell!" / "It is white" / gives a plain label without description
3. (No response) Child just took the photo silently.

**AI follow-up:**

1. (amazed, naming moment) "Smooth and curved like a bowl! That is so cool. This treasure needs a character name. What about... Captain Curvy? Or Bowl Shell? What do YOU want to call it?"
2. (warm, drawing out detail) "A shell, nice! But tell me MORE, Detective. Touch it! Is it smooth or rough? Heavy or light? Cold or warm? What does it remind you of?"
3. (encouraging, sensory prompt) "I see something smooth and light colored. Touch it! Is it bumpy? Smooth? Slimy? Tell me what it feels like!"

**Child names the find** (or AI suggests based on their description): "Captain Curvy! / Bumpy! / Shiny Shell!"

**AI response to naming:** (celebrating) "Hello, Captain Curvy! You are the first ocean character! One down, two more treasures to find!"

**Screen:** Photo slides into slot 2 with a bubble celebration burst; a character name tag appears below the photo with the child's chosen name; counter updates to "1 of 3 treasures found."

**Round 2 — Second Treasure:**

*(Child photographs another item — e.g., seaweed)*

**AI says:** (excited discovery) "Treasure number two! Ooh, what is this one like? Touch it carefully. What does it feel like? Slimy? Soft? Crunchy?"

**Child responses:**

1. (Ideal) "It is slimy and wiggly!" / "It feels slippery and it is dark green!"
2. (Unexpected) "Seaweed!" / "It is green" / names it without describing
3. (No response) Child looks at the seaweed quietly.

**AI follow-up:**

1. (delighted, naming moment) "Slimy and wiggly! I love it! This treasure needs a name too. Wiggly Slime? Slimy Green? What is this character's name?"
2. (warm, prompting) "Seaweed, yes! But what does seaweed FEEL like? Squeeze it gently. Is it squishy? Slippery? What does it remind you of?"
3. (wait 2s) (gentle, guiding) "This one looks wet and wavy. If you touch it, is it smooth like [Name 1] or totally different?"

**Child names the find:** "Wiggly Slime! / Squishy! / Green Wiggle!"

**AI response to naming:** (celebrating) "Wiggly Slime joins the adventure! [Name 1] and Wiggly Slime — what a team! One more treasure to find!"

**Screen:** Photo slides into slot 3 with name tag; counter updates to "2 of 3 treasures found."

**Round 3 — Final Treasure:**

*(Child photographs a third item — e.g., a smooth pebble or driftwood)*

**AI says:** (thrilled) "The final treasure! Feel this one, Detective. What is special about it? Smooth? Heavy? What shape is it?"

**Child responses:**

1. (Ideal) "It is really smooth and round like an egg!" / "It is flat and heavy!"
2. (Unexpected) "A rock" / "A stick" / gives a label
3. (No response) Child holds the item quietly.

**AI follow-up:**

1. (amazed, naming moment) "Smooth and round like an egg! Perfect. What is this character's name? Egg Stone? Rolly? You pick!"
2. (warm, drawing out) "A rock — but not just any rock! The ocean made this one special. Feel it. Is it smooth or rough? Round or flat? What makes it different from a regular rock?"
3. (wait 2s) (encouraging) "I see something the ocean shaped. Touch it, Detective! Is it smooth? That means the waves tumbled it for a long time. What does it remind you of?"

**Child names the find:** "Rolly! / Smooth Sam! / Egg Stone!"

**AI response to naming:** (big celebration) "All three ocean characters are here! [Name 1], [Name 2], and [Name 3]! Now it is time for their story!"

**Screen:** All three treasure photos displayed with character name tags; counter shows "3 of 3 — Complete!" with a story-book icon glowing.

**STUCK BRANCH:** AI suggests walking to where wet sand meets dry sand — that line is where waves drop things — and looking for shells, sticks, smooth stones, or seaweed. If child finds something but struggles to describe it, AI offers sensory prompts: "Touch it! Is it smooth or bumpy? Cold or warm? Heavy or light?"

#### Step 4: Celebration

**AI says:** (proud, storytelling voice) "Your ocean characters are ready! [Name 1], [Name 2], and [Name 3]. They all washed up on the same beach today. But how did they get here? What adventure brought them together?"

(scaffolding, warm) "Maybe [Name 1] was riding a big wave. And [Name 2] was hiding in the deep water. And [Name 3] was rolling along the ocean floor. What do you think happened?"

**Child responses:**

1. (Ideal) "Captain Curvy rode a wave and bumped into Wiggly Slime!" / "They all swam together!" / child invents a journey
2. (Unexpected) "I do not know" / "The waves brought them" / gives a short factual answer
3. (No response) Child looks at the collection silently.

**AI follow-up:**

1. (amazed, narrating and weaving in details) "What a story! Captain Curvy was riding a big wave — curving through the water like a bowl scooping the sea! Then Captain Curvy bumped into Wiggly Slime, who was wiggling along. They held on tight and the wave pushed them onto the sand. And look — [Name 3] was already here, waiting! What an adventure!"
2. (warm, building from their details) "The waves — yes! Let me help you tell it. [Name 1] — the [child's description] one — was floating in the ocean. A big wave picked up [Name 2] — the [child's description] one — and they tumbled together! Then they landed right next to [Name 3] on the sand. The ocean brought your whole team together!"
3. (wait 2s) (gentle, guiding) "I will start! One day, [Name 1] was floating in the ocean, smooth and [child's detail]. A wave came and WHOOSH — [Name 2], all [child's detail], got swept up too! They landed on the beach and met [Name 3]. What happened next?"

**Screen:** All four photos (beach + 3 treasures) in a storybook layout with character name tags, animated wave carrying the characters from left to right onto the beach; speech bubbles with character names.

#### Step 5: Reflection

**AI says:** (warm, celebratory) "You are an amazing Shore Detective! You found three ocean treasures, gave them names, and told their story. Here is one more thing to wonder about — if you came back to this beach tomorrow, do you think you would meet NEW characters? Would they have different names?"

**Child responses:**

1. (Ideal) "Yes! Different ones!" / "Maybe I would find a crab!" / "They would have new names because they would feel different!"
2. (Unexpected) "I do not know" / "I want to keep these ones"
3. (No response) Child looks at the beach scene quietly.

**AI follow-up:**

1. (amazed) "Yes! Every day the ocean delivers new treasures. And every treasure has its own shape and feel, so it would get its own special name! Captain Curvy is one of a kind — just like your story!"
2. (warm, encouraging) "These characters are yours forever! And next time, you might find a smooth flat stone and call it Pancake, or a spiky shell and call it Pokey! Every beach visit is a new story!"
3. (wait 2s) (gentle, guiding) "The ocean is always delivering new treasures. Each one would look and feel different — so each one would get a brand new name and a brand new story!"

**Screen:** Collection displayed as a beach storybook page with characters at different spots on the sand, name tags visible, and a "To be continued..." banner with a wave icon.

#### Step 6: Closing + IB Concepts

**AI says:** (proud, celebrating) "What an incredible Shore Detective you are! You found ocean treasures, discovered what makes each one special, named your characters, and told their story."

(warm, naming concepts naturally) "You discovered that every treasure has a reason for being here — the waves CAUSED each one to land on this beach. That is the power of Causation — understanding WHY things happen! And you saw how [Name 1], [Name 2], and [Name 3] are all connected — the ocean brought them together as part of one big beach story. That is Connection — seeing how things belong together. You earned your Shore Detective badge!"

**Child responses:**

1. (Ideal) "I did it!" / "I want to find more treasures!" / "My characters had a great adventure!"
2. (Unexpected) "Can I keep my shell?" / "I want to go in the water."
3. (No response) Child smiles or looks at the badge.

**AI follow-up:**

1. (proud, warm) "You sure did! Every time you visit a beach, you can be a detective again and meet new ocean characters with new stories."
2. (gentle, connecting) "Those are great ideas! Beaches are full of treasures and stories. Now you know how to find them, name them, and tell their tales."
3. (wait 2s) (soft closing) "Your Shore Detective badge is shining. Great detective work today, and what a story!"

**Screen:** Detective badge spinning into center labeled "Shore Detective" with collection photos as insets showing character name tags; "Causation" and "Connection" in ocean-blue lettering with shell and wave icons; storybook sparkles.

---

## Self-Evaluation Scorecard

| # | Dimension | Score | Notes |
|---|-----------|-------|-------|
| 1 | V1 Technical Compliance | PASS | No OCR, face detection, IMU, or state-change detection. Each photo processed independently. |
| 2 | Hook Rule Compliance | PASS | Both bridges open with emotional resonance (warm start builds on conversation; cold start uses amazement), not knowledge testing. |
| 3 | Transition Naturalness | PASS | Warm start bridges from conversation anchors (wet/dry color change, gritty feel) to treasure hunt. Cold start flows from admiring the sandy shore's hidden treasures to the detective mission. |
| 4 | Edge Case Coverage | PASS | Every step has 3 branches. Stuck branch gives specific hints (wet-dry line, shells, sticks, smooth stones, seaweed). Naming step includes AI-suggested names as scaffolding. |
| 5 | IB Completeness | PASS | Causation (primary, 1.0 from mapping is Connection but design uses Causation+Connection) + Connection. KUD specific. Closing names both concepts naturally as praise. Related Concepts: Habitat, Diversity, Conservation from mapping; Discovery designed. |
| 6 | Tier Appropriateness | PASS | T1 language throughout. Multi-sentence AI turns with scaffolding questions. 3 collection rounds. Sensory description + creative naming + story synthesis. |
| 7 | Dialogue Specificity | PASS | Every AI line is concrete with tone markers. No abstract descriptions. Sensory prompts are specific ("smooth or rough? Heavy or light? Cold or warm?"). |
| 8 | Screen & UI Completeness | PASS | Every step has specific screen descriptions with named animations, layouts, and elements. Name tags visible throughout. |
| 9 | Entity Mapping Alignment | PASS | Key Concepts Causation + Connection match mapping (Connection 1.0, Causation 0.9). Theme = Sharing the Planet (primary, 0.42). Related Concepts: Habitat, Diversity, Conservation from mapping; Discovery designed. Vocabulary (shore, treasure, washed up, tide, shell bits, wet/dry sand) traces to T1 tier_guidance. Warm start references wet_dry_color_change and ground_feel dimensions. Anchors: appearance — sand_grain_sparkle, structure — shell_bits, emotions. |
| 10 | Detail-Driven Naming & Story | PASS | Each find has sensory description prompts ("smooth or rough? Heavy or light?"). Child's answer drives character name (e.g., "smooth and curved like a bowl" → "Captain Curvy"). Synthesis story uses child's descriptions for each character's action — different finds produce different stories. Litmus test: if child found seaweed instead of a shell, the name and story action would be different. |

**Overall**: ALL PASS — Ready for review
