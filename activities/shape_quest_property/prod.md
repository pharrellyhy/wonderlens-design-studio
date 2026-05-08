## Activity: The Shape Scout Quest

### A. Basic Info

| Field | Value |
|-------|-------|
| Activity Name | The Shape Scout Quest |
| Activity Category | 5 -- Collection/Tracking Exploration (Out-of-Device, Solo, Indoor/Outdoor) |
| Recommended Tier | T1 (ages 4-6) |
| Core IB Key Concepts | **Form** (What is it like?) & **Connection** (How is it connected to other things?) |
| Related Concepts (Discipline) | Pattern, Similarity, Observation, Design |
| ATL Skills Focus | Research Skills (observation, collecting and recording data), Thinking Skills (creative thinking -- interpreting and imagining), Communication Skills (expressing -- narrative co-creation) |
| Experience Pillar | Adventure |
| Game Style | quest_collector |
| Trigger Entity | Any entity with detected {shape} attribute |
| Trigger Scene | Child photographs any object where AI detects a prominent shape attribute (e.g., round wheels on a car, pointy tips on a star, flat surface on a book) |
| Mapping Source | property-bridge |
| IB Theme | How We Express Ourselves |
| Design Version | 1.0 |
| Last Updated | 2026-04-08 |
| Template Parameters | `{shape}` -- detected shape property (e.g., round, pointy, flat, long, curvy). Example: **round** |

### A.1 Entity Attributes Covered

This template is **parameterized** (not bound to one entity). It matches any entity whose `tier_guidance` contains at least one of the attribute paths below. The property value (e.g., `{shape}`) is extracted from the matched entity's YAML at runtime and substituted for the template parameter. See `program.md` §1.9 "Matcher semantics" for the dual-overlap rule.

```yaml
entity_attributes_covered:
  - tier_0.appearance.shape         # most common path
  - tier_0.appearance.body_shape    # e.g., toy_robot
  - tier_0.appearance.wing_shape    # e.g., butterfly
  - tier_1.appearance.hood_shape    # e.g., raincoat (entity-specific shape features also qualify)
```

### B. Activity Overview

- **① Brief Description**: After the child photographs any object, the AI notices a prominent shape attribute -- for example, "round." The AI marvels at the shape and frames a quest: "Find 3 things that are round!" The child becomes a Shape Scout. For each find, the AI evaluates it against the quest criterion ("Is it round?"), creating a pass/fail game moment, and then harvests a personal detail ("What does it remind you of?") to generate a character name. Once 3 quest items are collected, the child co-creates a story featuring all the shape-friends rolling, bouncing, or spinning together. This template works for any detected shape: round, pointy, flat, long, curvy.

- **② Educational Purpose (KUD)**:
  - **K (Know)**: Learn the vocabulary for the detected shape (e.g., "round," "circle," "curved," "rolling," "sphere"). Learn that many different objects can share the same shape.
  - **U (Understand)**: Understand that objects have a specific **Form** -- shape is one of the most visible qualities defining what something looks like. Understand that surprising **Connections** exist between very different things that share the same shape.
  - **D (Do)**: Practice criterion-based observation (Research Skills -- observation), invent character names from personal details (Thinking Skills -- creative thinking), and co-create a narrative (Communication Skills -- expressing).

- **③ Design Highlight**: The quest criterion -- "Find 3 things that are round!" -- transforms aimless collecting into a purposeful shape hunt. Each find gets evaluated against the criterion, creating a game-like moment. Detail harvesting gives each find creative ownership. The combination of quest evaluation + detail harvesting + mission progression makes the child feel "Look how many round things I discovered!"

- **④ Typical Scenario**: Child photographs a car --> AI notices round wheels --> "Your car has ROUND wheels! I wonder how many round things we can find!" --> child becomes a Shape Scout --> searches for round things --> each find is evaluated and named --> at 3 of 3, "Quest complete!" triggers a co-created shape adventure story.

### C. Interaction Flow

> Recommended Tier: T1 (ages 4-6)

#### Step 1b: Transition Bridge -- Cold Start

**Context**: Child photographs any object (e.g., a toy car). AI detects a prominent shape attribute (e.g., round wheels).

**AI says**: [breathless wonder] "Ohhh -- look at your car! And WOW -- look at those wheels! They are SO round -- like perfect circles! I bet they roll and roll and roll. Do you know what else is round like those wheels?"

**Possible child responses**:
1. [Ideal] "A ball!" / "The sun!" / "A cookie!"
2. [Unexpected] "It's a race car!" / "It goes fast!" / "I love my car!"
3. [No response] Looks at the photo silently.

**AI follow-up**:
1. [delighted] "A ball -- YES! Balls are round, wheels are round -- round things are EVERYWHERE! What do those round wheels remind you of? A spinning donut? A tiny planet? A rolling coin?"
2. [warmly agreeing] "It IS an awesome car! And look at those round, round wheels -- perfect circles! What do those round wheels remind you of? A spinning coin? A donut?"
3. [waits 2s] [soft, inviting] "See those wheels? They are perfectly round -- like little circles! What do they remind you of? They remind ME of little spinning donuts!"

*(Child responds with a detail -- e.g., "Spinning donuts!")*

**AI says**: [thrilled] "Spinning donuts -- I love that! Let's call your car's wheels 'Donut Spinners'! And guess what -- Donut Spinners are round. I wonder... what ELSE around here is round?"

**Screen**: Close-up of photo with glowing circle highlight around the detected round feature. Circular pulse animation. Name tag with character name and circle icon. Shape-quest compass showing "Quest: 0 of 3."

#### Step 2: Mission Briefing -- The Shape Quest

**AI says**: [adventurous, explorer tone] "You are now an official Shape Scout! And I have a quest for you! Your mission: find 3 things around here that are ROUND. Balls, buttons, bowls, coins -- anything that makes a circle shape! For each one, you will tell me what it reminds you of, and we will give it a quest name. Then -- all your round characters go on a big rolling adventure together! Ready, Scout? Find something round!"

**Possible child responses**:
1. [Ideal] "Ready!" / "Yes, let's go!" / "I see something round!"
2. [Uncertain] "What does 'round' mean?" / "Where should I look?"
3. [No response] Glances around.

**AI follow-up**:
1. [cheering] "Quest is ON! Find something that looks like a circle or a ball -- then snap a photo! Go, Scout!"
2. [encouraging] "'Round' means it looks like a circle or a ball -- no pointy corners, no straight edges. Think of a plate, a coin, or a ball!"
3. [waits 2s] [gently] "Look for things with NO corners. Things that curve all the way around -- like a plate, a lid, or a ball!"

**Screen**: Quest mission card with "Shape Scout" badge and circle silhouette. 3 empty slots. Trigger photo above with name tag and golden checkmark. Quest scroll: "Quest: Find 3 round things!" Shape compass: "0 of 3 collected."

#### Step 3: Multi-Round Exploration (3 rounds)

**Round 1 -- First Quest Find:**

*(Child photographs something -- e.g., a bowl)*

**AI says**: [excited] "Quest find incoming! Ooh -- let me see... Is it round?"

*(Brief dramatic pause -- 1 second)*

**AI says**: [triumphant] "YES! Look at that shape -- a perfect circle going all the way around! It IS round! Quest item number one! Now, Scout -- what does it remind you of?"

**Possible child responses**:
1. [Ideal] "A hat!" / "A nest!" / "A swimming pool!"
2. [Unexpected] "A bowl." / "I don't know."
3. [No response]

**AI follow-up**:
1. [thrilled] "A nest -- perfect! Let's call this quest character... Nest Bowl! One of 3 collected -- two more to go, Scout!"
2. [looking closely] "A bowl -- yes! Does it look more like a tiny hat, a little nest, or a swimming pool?" *(names accordingly)*
3. [waits 2s] "I see something curved -- like a little nest! What does it remind YOU of?"

**Screen**: Photo slides into first slot with golden circle-sparkles. "Round? YES!" stamp in green. Name tag with character name. Shape compass: "1 of 3 collected."

**Rounds 2-3**: Same structure. Round 2 uses detective voice ("Quest report number two!"). Round 3 builds to climax ("FINAL quest find!").

**Round 3 edge cases**:

- **STUCK BRANCH**: "Scout tip! Round things are everywhere -- look for buttons on clothes, coins in a pocket, plates on a table, balls on the floor, or lids on jars!"
- **DOESN'T MATCH BRANCH** (e.g., a book): "Wellll... a book has corners and straight edges -- that makes it more of a rectangle! BUT does it have anything round ON it?" *(validates child, offers redirect or accepts if child insists)*

**Screen at quest complete**: All slots filled. "QUEST COMPLETE!" banner with circle confetti. All 4 photos with golden borders and character names. "Shape Adventure!" banner pulsing.

#### Step 4: Synthesis -- The Shape Adventure (Magic Moment)

**AI says**: [proud and thrilled] "QUEST COMPLETE, Shape Scout! Look at your round team! Donut Spinners the [trigger], [Name 1] the [detail], [Name 2] the [detail], and [Name 3] the [detail] -- all round! Now here comes the best part. Imagine they all start ROLLING at the same time! Where do they roll? What happens on their big round adventure?"

**Possible child responses**:
1. [Ideal] "They roll down a hill!" / "They roll to the playground!" / Child narrates.
2. [Uncertain] "I don't know." / "They just roll."
3. [No response]

**AI follow-up**:
1. [narrating with wonder] "Here they go! Donut Spinners rolls first -- spinning and spinning! Then [Name 1] starts bouncing alongside! [Name 2] rolls past and calls out, 'Look how fast we are going!' And [Name 3] tumbles by and says, 'I can see [destination] from here!' They all roll together -- the greatest round adventure ever! What do they find when they stop rolling?"
2. [playfully] "They roll -- YES! Donut Spinners goes first, spinning like crazy! Then [Name 1] catches up. 'Wait for me!' calls [Name 2]. Where do they all end up?"
3. [waits 2s] [storytelling voice] "All the round things start rolling! Donut Spinners spins like a wheel -- whirrrr! Then [Name 1] bounces along! They are ALL rolling together -- where do they end up?"

**Screen**: Rolling-adventure layout with photos along a curving trail. Animated rolling motion. Speech bubbles near characters. Golden rolling-trail connecting all characters. "Look how far we rolled!" banner.

#### Step 5: Discovery Celebration

**AI says**: [amazed and warm] "Wow, Scout! Donut Spinners, [Name 1], [Name 2], and [Name 3] -- they are all SO different! But they all had one thing in common -- they were ALL round! Why do you think so many different things are the same shape?"

**Possible child responses**:
1. [Ideal] "Because round things roll!" / "They are circles!" / "They all have no corners!"
2. [Unexpected] "I like the bowl best!" / "They are friends!" / Child points to a favorite find.
3. [No response] Child looks at the completed round team.

**AI follow-up**:
1. [delighted] "Round things are great for rolling and spinning! Wheels roll, bowls hold things evenly, coins stack. The same shape shows up everywhere, doing different jobs!"
2. [warmly] "That one is a wonderful round friend! And the team has a secret connection: every friend is different, but every friend is round."
3. [waits 2s] "Look at your round team. Different jobs, different sizes, one shared shape. Round connects them like a secret rolling path!"

**Screen**: Four characters in circular formation with curve-lines connecting them. Shape-fact callouts near each character. Shape-quest trail in background.

#### Step 6: Closing + IB Concepts

**AI says**: [warm celebration] "Congratulations, Shape Scout! You completed the Shape Quest! You discovered **Form** -- you noticed that all these things share the same round shape, even though they look totally different! And you found an incredible **Connection** -- Donut Spinners, [Name 1], [Name 2], and [Name 3] are completely different things, but they are ALL round! The same shape connects them like a secret club! You earned your Shape Quest Badge!"

**Possible child responses**:
1. [Ideal] "Yay!" / "I'm a Shape Scout!" / "I want to find more round things!"
2. [Unexpected] "Can I find pointy things next?" / "I like the badge!" / Child asks for another shape.
3. [No response] Child watches the badge animation.

**AI follow-up**:
1. [encouraging] "Next time you look around, keep your shape eyes ON -- who KNOWS how many round things are hiding in plain sight! See you on the next quest, Scout!"
2. [warm] "Pointy can be your next quest shape! Your Shape Scout badge is saved, and your shape eyes are getting stronger."
3. [waits 2s] [soft] "Your Shape Quest Badge is shining. Bye for now, Scout!"

**Screen**: Golden "Shape Quest Badge" -- circular, with circle silhouette at center and 4 photos as insets with character names. **"Form"** and **"Connection"** float up artistically. Shape compass between concept words. Soft chime. Animated circles settle.
