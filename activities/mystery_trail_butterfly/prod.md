## The Butterfly World Detectives

### A. Basic Info

| Field | Value |
|-------|-------|
| Activity Name | The Butterfly World Detectives |
| Activity Category | Collection/Tracking Exploration (Out-of-Device) |
| Recommended Tier | T1 (ages 4–6) |
| Core IB Key Concepts | Form, Connection |
| Related Concepts | Habitat, Pattern, Connection, Discovery |
| ATL Skills Focus | Research Skills (observation, data collection), Thinking Skills (critical thinking, transfer), Communication Skills (expressing reasoning) |
| Game Style | mystery_trail |
| Design Version | 1.0 |
| Last Updated | 2026-04-21 |

### A.1 Entity Attributes Covered

Attribute IDs from `data/mappings_dev20_0318/animals/insects.yaml` `tier_guidance` that this activity exercises. Consumed by the upstream matcher to route photographed entities to this game.

```yaml
entity_attributes_covered:
  - tier_0.appearance.wing_color
  - tier_0.appearance.wing_shape
  - tier_0.appearance.antennae
  - tier_0.function.lands_on_flowers
  - tier_1.appearance.wing_patterns
  - tier_1.context.flower_visits
  - tier_1.context.leafy_rests
  - tier_1.context.puddle_visits
  - tier_1.function.sipping_nectar
  - tier_2.context.habitat_requirements
  - tier_2.context.host_plants_for_eggs
```

### A.2 Constellation Adaptation Notes

Recipe for running this activity when the photographed entity is a constellation
neighbor of Butterfly (e.g., other pollinator/garden insects like bee, moth,
ladybug, dragonfly) instead of a butterfly itself. The neighbor list, bridge
type, and initial bridge prompt will live in `data/constellation_map.yaml`
under `mapped_entity: butterfly` (Cat5 entry pending per that file's coverage
notes) — this section describes how The Butterfly World Detectives adapts
mechanically for a bridged entity.

**Preserve** — must not change across neighbors:
- The "Detective" role_title and the delayed-reveal structure: riddle-clues first, hidden pattern ("everything you found is [creature]'s secret world!") announced only at Step 4 — this is the Mystery pillar's payoff.
- The 3-riddle arc mapping to the creature's habitat needs (food source → shelter → water) — this is the habitat-as-checklist insight the child assembles.
- The riddle-voice cadence ("I'm thinking of something nearby. It's ___. It ___. Can you find it?") — sensory, slow, playful; flattens into scavenger hunt without it.

**Swap** — re-phrase for the bridged entity:
- Riddle-Clue #1 "bright and colorful, sweet smell, tiny creatures drink NECTAR inside" → the neighbor's food source (bee: same flower riddle works; moth: "I glow at night, and moths love me" → porch lights; ladybug: "I'm green and covered in tiny bugs the ladybug eats" → aphid-rich leaves; dragonfly: "I'm wet and full of tiny flying bugs" → pond).
- Riddle-Clue #2 "green and flat, creatures hide under it and eat it for lunch" → neighbor's shelter (moth: "dark and cool, tucked in a crack"; dragonfly: "tall and waving, a reed by the water"). Same hide-and-eat structure.
- Riddle-Clue #3 "wet on the ground, creatures visit to drink minerals" → neighbor's water source (bee: dew on leaves; dragonfly: open water). Keep "wet" as the universal theme.
- Step 5 closing "flower restaurant, leaf bedroom, puddle fountain" analogies → re-cast for the neighbor's world (bee: "flower restaurant, hive home, dew drink"; dragonfly: "buggy buffet, reed perch, pond nursery").

**Watch** — gotchas to avoid:
- Moths are nocturnal — their "secret world" is nighttime (lights, dark leaves, damp ground under logs); if the child photographs a moth in daylight, narrate that we're mapping its night-world even though we can see in the day.
- If the neighbor is a predator rather than a pollinator (ladybug eats aphids; dragonfly eats mosquitos), Clue #1 must target prey, not nectar — don't force a nectar riddle where it doesn't fit.
- Never reveal the pattern early — if the child guesses "it's about the butterfly's habitat!" in Round 1, the AI plays coy ("interesting theory, Detective — keep finding!"); premature reveal kills the Step 4 payoff.

### B. Activity Overview

- **① Brief Description**: After the child photographs a butterfly on a flower, the AI expresses wonder at the butterfly's beautiful wings and then recruits the child as a "Butterfly World Detective." The AI gives riddle-clues one at a time — each describing something nearby without naming it — and the child searches, guesses, and photographs what they think matches. After 3–4 finds, the AI reveals the hidden connection: everything the child found is part of the butterfly's secret world — its food, shelter, water, and home. The big "aha!" is that the child has been mapping the butterfly's habitat all along without knowing it.

- **② Educational Purpose (KUD)**:
  - **K (Know)**: Learn the vocabulary "nectar," "habitat," "shelter," "wings," "antenna." Learn that butterflies need specific things to survive — flowers for nectar, leaves for resting, puddles for water, and plants for laying eggs.
  - **U (Understand)**: Understand that the Form of things in nature (bright colors, flat surfaces, wet spots) reveals clues, and that Connection links those different things into one butterfly habitat.
  - **D (Do)**: Practice deductive reasoning from riddle-clues, search for and photograph matching items outdoors, and articulate why all their finds are connected.

- **③ Design Highlight**: The "Butterfly World Detectives" frame transforms a nature scavenger hunt into a mystery investigation. The key mechanism is riddle-driven search with a delayed pattern reveal: the child doesn't know WHY they're finding these specific things until the end, when the AI reveals that every single find is something a butterfly needs. The riddles are sensory and playful ("I'm bright and I smell sweet..."), making each search feel like solving a puzzle. The magic moment — "Everything you found is part of your butterfly's secret world!" — reframes the entire activity retroactively, giving the child an "I figured it out!" rush.

- **④ Typical Scenario**: Child photographs a butterfly on a flower in the park → AI marvels at the butterfly's wings and wonders about its world → recruits the child as a Butterfly World Detective → gives riddle-clue #1 (something bright and sweet-smelling → flower) → child searches and photographs → AI confirms and gives next riddle-clue (something green and flat → leaf) → child searches and photographs → riddle-clue #3 (something wet on the ground → puddle or mud) → child searches and photographs → AI reveals the hidden pattern: "Look at everything you found — they ALL are things your butterfly needs! You just mapped its secret world!"

### C. Interaction Flow

> Recommended Tier: T1 (ages 4–6)

#### Step 1: Transition Bridge

**AI says:** [breathless, enchanted whisper] "Ohhh — look at that butterfly! Those wings are SO beautiful — like tiny painted windows! And look, it's sitting right on that flower. I wonder... why did it choose THAT flower? Do you think the butterfly likes it there?"

**Child responses:**

1. [Ideal] "Because it's pretty!" / "It likes the flower!" / "It's drinking from it!"
2. [Unexpected] "I want to catch it!" / "It's going to fly away!" / "It's a monarch!"
3. [No response] Child watches the butterfly quietly.

**AI follow-up:**

1. [excited, conspiratorial] "I think you're RIGHT — the butterfly LOVES that flower! But here's the thing — I bet there are MORE things in this park that the butterfly loves. Things that are part of its secret world. What if we could find them all?"
2. [warm, intrigued] "It IS amazing to watch! And you know what? That butterfly picked this exact spot for a reason. This flower is part of its secret world — and I bet there are MORE secret things nearby that it needs. Want to find out what they are?"
3. [wait 2s] [gentle, wondering] "That butterfly chose this flower for a reason — it's part of the butterfly's secret world. And I bet there are MORE things in this park that the butterfly loves. I have an idea — want to be a detective and find them?"

**Screen:** Butterfly photo centered with shimmering wing glow, sparkles near petals, and a pulsing magnifying glass icon with "?" in the corner.

#### Step 2: Rule Introduction + Demo

**AI says:** [adventurous, detective tone] "Alright — you are now an official Butterfly World Detective! Here's your mission: I'm going to give you riddle-clues about things hidden in this park. Things that are part of your butterfly's secret world! You search, you guess, and you take a photo. After you find them all, I'll tell you the SECRET that connects everything. Ready, Detective?"

**Child responses:**

1. [Ideal] "Ready!" / "Yes!" / "What's the first clue?"
2. [Uncertain] "What do I look for?" / "Where do I go?"
3. [No response] Child looks around the park with curiosity.

**AI follow-up:**

1. [thrilled] "Here comes your first riddle-clue! Listen carefully, Detective..."
2. [encouraging] "Don't worry — I'll give you riddle-clues! Each one describes something nearby. You just listen, think, and search. The riddles will guide you! Here comes the first one..."
3. [wait 2s] [playful whisper] "Okay Detective, here's how it works — I describe something, you find it! Easy! Let's start with your very first riddle-clue..."

**Screen:** Detective-themed mission card with "Butterfly World Detective" badge, butterfly silhouette, magnifying glass, 3 empty circle slots, butterfly photo above with golden star, and pulsing "CLUE #1" banner.

#### Step 3: Multi-Round Interaction

**Round 1 — Riddle-Clue #1: The Flower (full detail)**

**AI says:** [mysterious, slow riddle voice] "Riddle-Clue number one! Listen closely, Detective... I'm thinking of something nearby. It's BRIGHT and colorful. It has a sweet smell. And tiny creatures visit it to drink something yummy inside. Can you find it? Go look and take a photo of what you think it is!"

**Child responses:**

1. [Ideal] Child photographs a flower. "A flower!" / "This one!" / "I found it!"
2. [Unexpected] Child photographs something else colorful. "Is it this?"
3. [No response / stuck] Child looks around but doesn't photograph.

**AI follow-up:**

1. [triumphant] "YES, Detective! A flower — that's it! Flowers are bright and colorful, and inside they have something called NECTAR — that's the sweet, yummy drink butterflies love! Your butterfly was sitting on a flower just like this one. First clue — SOLVED! Two more to go!"
2. [thoughtful, encouraging] "Ooh, interesting guess! That IS colorful! But my riddle says tiny creatures visit it to drink something sweet inside. Can you think of something that bees and butterflies land on to sip from? Something with petals? Look for one nearby!"
3. [wait 2s] [helpful whisper] "Detective hint! Think about what your butterfly was sitting on when you took that first photo. Something with petals, something colorful. Look near the bushes or in the flower bed!"

**Screen:** New photo slides into first slot with golden sparkles and "SOLVED!" animation. Flower icon appears. Counter: "Clue 1 of 3 — SOLVED!" and "CLUE #2" banner pulses.

**Round 2 — Riddle-Clue #2: The Leaf:** AI gives riddle about something "green and flat" that creatures hide under and eat for lunch. Child searches for a leaf. AI reveals leaves are butterfly shelter and caterpillar food.

**Round 3 — Riddle-Clue #3: The Puddle / Wet Spot:** AI gives riddle about something "wet on the ground" that butterflies visit to drink (not swim). Child searches for a puddle, damp mud, or wet spot. AI reveals butterflies "puddle" to drink minerals. Includes stuck branch with hints about dark/damp dirt near tree trunks.

**Round 4 (Optional Bonus):** Bonus riddle about something "small, round, and colorful" — a berry or seed that birds near butterflies eat. Only played if child is highly engaged.

#### Step 4: Celebration

**AI says:** [slow, dramatic build-up] "Okay, Butterfly World Detective — look at everything you found. A flower... a leaf... something wet on the ground... Now here's the SECRET I've been hiding... *(dramatic pause)* ...EVERYTHING you found is something your BUTTERFLY needs to live! The flower gives it nectar to drink. The leaf gives it shade to rest AND food for its babies. The wet ground gives it minerals and water. You didn't just find random things — you found your butterfly's whole SECRET WORLD! Its home, its restaurant, its water fountain, and its baby nursery — all right here in this park!"

**Child responses:**

1. [Ideal] "Whoa!" / "The butterfly needs all of those?" / "I found its world!"
2. [Unexpected] "I knew it!" / "That's cool!" / "Butterflies eat leaves?"
3. [No response] Child looks at the screen, taking it in.

**AI follow-up:**

1. [celebrating] "You DID find its world! The flower is like the butterfly's restaurant — that's where it eats. The leaf is like its bedroom — that's where it rests and where its babies grow. And the wet spot is like its drinking fountain! Everything your butterfly needs is right here, and YOU found it all, Detective!"
2. [validating, adding detail] "It IS cool! And you know what's really amazing? The BABY butterflies — caterpillars — they eat the leaves. Then they grow up and drink nectar from the flowers. And the wet ground gives them special minerals to stay strong. It's all connected — like a circle!"
3. [wait 2s] [warm, amazed] "You mapped the butterfly's whole world! The flower feeds it, the leaf shelters it, and the wet ground gives it water. Your butterfly chose this park because EVERYTHING it needs is right here. And you, Detective — you figured it out!"

**Screen:** Collection photos in a circle around the butterfly photo. Golden connection lines with labels: "Nectar," "Shelter & Food for babies," "Water & Minerals." Shimmering "HABITAT" word above. Butterfly wing animations near connection lines.

**Reflection prompt:**

**AI says:** [amazed, reflective] "Detective, look at your map — a flower, a leaf, and a wet spot. They look SO different from each other! But they ALL ended up being things your butterfly needs. Why do you think the butterfly picked THIS park to live in?"

**Child responses:**

1. [Ideal] "Because it has flowers and leaves!" / "It has everything!" / child names a habitat element
2. [Unexpected] "Because it is pretty!" / "Because it likes it!" / child gives a general preference
3. [No response] Child looks at the habitat map.

**AI follow-up:**

1. [delighted] "Exactly! This park has EVERYTHING a butterfly needs — food, water, shelter — all in one place. That's why it lives here!"
2. [warmly] "It IS pretty — and here's a secret: pretty things like flowers aren't just pretty for US — they're USEFUL for the butterfly! The bright colors help the butterfly find the nectar."
3. [wait 2s] [sharing a wonder] "I think it's because this park has everything on the butterfly's checklist — food from flowers, shelter from leaves, and water from the ground."

#### Step 5: Closing + IB Concepts

**AI says:** [warm, proud celebration] "Congratulations, Butterfly World Detective! You did something incredible today. You looked closely at the **Form** of things — bright petals, flat green leaves, wet ground — and you figured out what they really are. And you discovered the **Connection** — the flower, the leaf, and the wet ground all link together into your butterfly's secret world. Flowers, leaves, water — they all have a job! You earned your Butterfly World Detective Badge!"

**Child responses:**

1. [Engaged] Cheers, talks about butterflies, wants to find more.
2. [Unexpected] "Can we find a bee world?" / "I liked the puddle!" / child asks about another creature or clue.
3. [No response] Smiles or says nothing.

**AI follow-up:**

1. [encouraging] "Next time you see a butterfly, look around — see if you can spot its flower restaurant, its leaf bedroom, and its puddle fountain! You'll see its whole world now. Bye for now, Detective!"
2. [warm] "A bee world would have clues too! Today you solved the butterfly world, and your detective badge is saved. Bye, Detective!"
3. [wait 2s] [warm] "Your detective badge is saved! Every butterfly you see has its own secret world — now YOU know how to find it. Bye, Detective!"

**Screen:** Golden "Butterfly World Detective Badge" — circular, butterfly silhouette center, 3 collection photos as insets with connection labels. "Form" styled with petal-shaped fills, "Connection" with linked habitat lines. Habitat icon between concepts. Soft chime. Animated butterflies drift and settle on badge.
