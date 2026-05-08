## Activity: The Color Scout Quest

### A. Basic Info

| Field | Value |
|-------|-------|
| Activity Name | The Color Scout Quest |
| Activity Category | 5 -- Collection/Tracking Exploration (Out-of-Device, Solo, Indoor/Outdoor) |
| Recommended Tier | T1 (ages 4-6) |
| Core IB Key Concepts | **Form** (What is it like?) & **Connection** (How is it connected to other things?) |
| Related Concepts (Discipline) | Pattern, Similarity, Observation, Identity |
| ATL Skills Focus | Research Skills (observation, collecting and recording data), Thinking Skills (creative thinking -- interpreting and imagining), Communication Skills (expressing -- narrative co-creation) |
| Experience Pillar | Adventure |
| Game Style | quest_collector |
| Trigger Entity | Any entity with detected {color} attribute |
| Trigger Scene | Child photographs any object where AI detects a prominent color (e.g., a bright red toy, a blue backpack, a green leaf) |
| Mapping Source | property-bridge |
| IB Theme | How We Express Ourselves |
| Design Version | 1.0 |
| Last Updated | 2026-04-08 |
| Template Parameters | `{color}` -- detected color property (e.g., red, blue, green, yellow, brown, orange, purple, pink). Example: **red** |

### A.1 Entity Attributes Covered

This template is **parameterized** (not bound to one entity). It matches any entity whose `tier_guidance` contains at least one of the attribute paths below. The property value (e.g., `{color}`) is extracted from the matched entity's YAML at runtime and substituted for the template parameter. See `program.md` §1.9 "Matcher semantics" for the dual-overlap rule.

```yaml
entity_attributes_covered:
  - tier_0.appearance.color         # most common path (raincoat, crayon, piano, libraries, etc.)
  - tier_0.appearance.body_color    # e.g., rubber_duck, toy_robot, goldfish, lion, bird
  - tier_0.appearance.wing_color    # e.g., butterfly
```

### B. Activity Overview

- **① Brief Description**: After the child photographs any object, the AI notices a prominent color -- for example, "red." The AI marvels at the color and frames a quest: "Find 3 red things!" The child becomes a Color Scout. For each find, the AI evaluates it against the quest criterion ("Is it red?"), creating a pass/fail game moment, and then harvests a personal detail ("What does it remind you of?") to generate a character name. Once 3 quest items are collected, the child co-creates a story featuring the "Red Team" going on an adventure together. This template works for any detected color: red, blue, green, yellow, brown, orange, purple, pink, etc.

- **② Educational Purpose (KUD)**:
  - **K (Know)**: Learn the vocabulary for the detected color and its shades (e.g., "red," "scarlet," "crimson," "bright," "dark red"). Learn that many different objects can share the same color.
  - **U (Understand)**: Understand that objects have a specific **Form** -- color is one of the most visible qualities defining what something looks like. Understand that surprising **Connections** exist between very different things that share the same color.
  - **D (Do)**: Practice criterion-based observation (Research Skills -- observation), invent character names from personal details (Thinking Skills -- creative thinking), and co-create a narrative (Communication Skills -- expressing).

- **③ Design Highlight**: The quest criterion -- "Find 3 red things!" -- transforms aimless collecting into a purposeful color hunt. Each find gets evaluated against the criterion, creating a game-like moment. Detail harvesting gives each find creative ownership. The combination of quest evaluation + detail harvesting + mission progression makes the child feel "Look at my amazing Red Team!"

- **④ Typical Scenario**: Child photographs a red toy --> AI notices bright red --> "Your toy is SO red! I wonder if there are more red things hiding around here!" --> child becomes a Color Scout --> searches for red things --> each find is evaluated and named --> at 3 of 3, "Quest complete!" triggers a co-created Red Team adventure story.

### C. Interaction Flow

> Recommended Tier: T1 (ages 4-6)

#### Step 1b: Transition Bridge -- Cold Start

**Context**: Child photographs any object (e.g., a red toy fire truck). AI detects a prominent color (e.g., bright red).

**AI says**: [breathless wonder] "Ohhh -- look at your fire truck! And WOW -- it is SO red! Like the reddest red I have ever seen! Bright and bold and beautiful. I LOVE red. Do you know what else is red like your fire truck?"

**Possible child responses**:
1. [Ideal] "A strawberry!" / "An apple!" / "A ladybug!"
2. [Unexpected] "It has a ladder!" / "It goes nee-naw!" / "Firefighters ride it!"
3. [No response] Looks at the photo silently.

**AI follow-up**:
1. [delighted] "A strawberry -- YES! Strawberries are red, fire trucks are red -- red things are EVERYWHERE! What does all that bright red remind you of? A big red dragon? A fire-breathing superhero? A speedy tomato?"
2. [warmly agreeing] "It DOES go nee-naw! And it is SO bright and red! That red color is like a shout -- LOOK AT ME! What does all that bright red remind you of? A dragon? A superhero cape?"
3. [waits 2s] [soft, inviting] "Look at all that red! So bright and bold! What does it remind you of? It reminds ME of a big red dragon!"

*(Child responds with a detail -- e.g., "A big red dragon!")*

**AI says**: [thrilled] "A big red dragon -- I love that! Let's call your fire truck 'Red Dragon'! And guess what -- Red Dragon is SUPER red. I wonder... what ELSE around here is red?"

**Screen**: Close-up of photo with glowing color highlight around the most prominently red area. Red shimmer animation. Name tag with character name and red paint-drop icon. Color-quest compass showing "Quest: 0 of 3."

#### Step 2: Mission Briefing -- The Color Quest

**AI says**: [adventurous, explorer tone] "You are now an official Color Scout! And I have a quest for you! Your mission: find 3 things around here that are RED. Toys, clothes, flowers, food -- anything that is bright and red! For each one, you will tell me what it reminds you of, and we will give it a quest name. Then -- all your red characters join the Red Team and go on a big color adventure together! Ready, Scout? Find something red!"

**Possible child responses**:
1. [Ideal] "Ready!" / "Yes, let's go!" / "I see something red!"
2. [Uncertain] "What if it is only a little bit red?" / "Where should I look?"
3. [No response] Glances around.

**AI follow-up**:
1. [cheering] "Quest is ON! Find something that has red on it -- then snap a photo! Go, Scout!"
2. [encouraging] "Even if it is only a LITTLE bit red, it still counts! A red stripe, a red dot, a red button -- any red at all!"
3. [waits 2s] [gently] "Red things love to hide! Look at clothes, book covers, food packages, or toys. Even a tiny red sticker counts!"

**Screen**: Quest mission card with "Color Scout" badge and red paint-drop silhouette. 3 empty slots. Trigger photo above with name tag and golden red-bordered checkmark. Quest scroll: "Quest: Find 3 red things!" Color compass: "0 of 3 collected."

#### Step 3: Multi-Round Exploration (3 rounds)

**Round 1 -- First Quest Find:**

*(Child photographs something -- e.g., a red apple)*

**AI says**: [excited] "Quest find incoming! Ooh -- let me see... Is it red?"

*(Brief dramatic pause -- 1 second)*

**AI says**: [triumphant] "YES! Look at that beautiful bright red color -- shiny and smooth and SO red! It IS red! Quest item number one! Now, Scout -- what does it remind you of?"

**Possible child responses**:
1. [Ideal] "A planet!" / "A bouncy ball!" / "A ruby jewel!"
2. [Unexpected] "An apple." / "I don't know."
3. [No response]

**AI follow-up**:
1. [thrilled] "A ruby jewel -- perfect! Let's call this quest character... Ruby Crunch! Welcome to the Red Team! One of 3 collected -- two more to go, Scout!"
2. [looking closely] "An apple -- yes! Does it look more like a bouncy ball, a ruby jewel, or a little red planet?" *(names accordingly)*
3. [waits 2s] "I see something shiny and red -- like a little ruby! What does it remind YOU of?"

**Screen**: Photo slides into first slot with red sparkles and golden highlights. "Red? YES!" stamp in green. Name tag with character name. Color compass: "1 of 3 collected."

**Rounds 2-3**: Same structure. Round 2 uses detective voice ("Quest report number two!"). Round 3 builds to climax ("FINAL quest find!").

**Round 3 edge cases**:

- **STUCK BRANCH**: "Scout tip! Red things love to hide in plain sight! Look at your shirt -- any red? Check book covers, food labels, toy bins, or look for red buttons, red lids, or red stickers!"
- **DOESN'T MATCH BRANCH** (e.g., a blue ball): "Wellll... that looks more blue to me! But does it have anything red ON it? A red stripe? A red dot?" *(validates child, offers redirect or accepts if child insists)*

**Screen at quest complete**: All slots filled. "QUEST COMPLETE!" banner with red confetti. All 4 photos with red-and-gold borders and character names. "Red Team Adventure!" banner pulsing.

#### Step 4: Synthesis -- The Red Team Adventure (Magic Moment)

**AI says**: [proud and thrilled] "QUEST COMPLETE, Color Scout! Look at your Red Team! Red Dragon the [trigger], [Name 1] the [detail], [Name 2] the [detail], and [Name 3] the [detail] -- all red! Now here comes the best part. The Red Team has a mission -- they are going on a big adventure together! What happens? Where does the Red Team go?"

**Possible child responses**:
1. [Ideal] "They go to a castle!" / "They fly to the volcano!" / "They have a race!" / Child narrates.
2. [Uncertain] "I don't know." / "They just go."
3. [No response]

**AI follow-up**:
1. [narrating with wonder] "The Red Team is GO! Red Dragon charges ahead first -- VROOM! Then [Name 1] bounces alongside! [Name 2] zooms past and calls out, 'Follow me, Red Team!' And [Name 3] dashes up and says, 'I can see [destination] from here!' They all arrive together -- the greatest Red Team adventure EVER! What do they find there?"
2. [playfully] "They go -- YES! Red Dragon leads the way -- VROOM! Then [Name 1] catches up. 'Wait for me!' calls [Name 2]. And [Name 3] says, 'Red Team forever!' Where do they all end up?"
3. [waits 2s] [storytelling voice] "The Red Team sets off! Red Dragon goes first -- VROOM! Then [Name 1] races after! They are ALL charging ahead -- the whole Red Team! Where do they end up?"

**Screen**: Team-adventure layout with photos along a swooping red trail. Animated red energy trail. Speech bubbles near characters. Golden-red trail connecting all characters. "Go, Red Team!" banner.

#### Step 5: Discovery Celebration

**AI says**: [amazed and warm] "Wow, Scout! Red Dragon, [Name 1], [Name 2], and [Name 3] -- they are all SO different! But they all had one thing in common -- they were ALL red! Why do you think so many different things are the same color?"

**Possible child responses**:
1. [Ideal] "Because red is bright!" / "They all have the same color!" / "Red helps you see them!"
2. [Unexpected] "I like Red Dragon best!" / "They are friends!" / Child points to a favorite find.
3. [No response] Child looks at the completed Red Team.

**AI follow-up**:
1. [delighted] "Red IS bright and bold! Fire trucks are red so you can see them. Strawberries are red so birds know they are ripe. Stop signs are red so drivers pay attention. Red says LOOK AT ME!"
2. [warmly] "Red Dragon is a wonderful team leader! And the team has a secret connection: every friend is different, but every friend is red."
3. [waits 2s] "Look at your Red Team. Different shapes, different jobs, one shared color. Red connects them like a secret team ribbon!"

**Screen**: Four characters in circular formation with red color-wave lines connecting them. Color-fact callouts near each character. Color-quest trail in background.

#### Step 6: Closing + IB Concepts

**AI says**: [warm celebration] "Congratulations, Color Scout! You completed the Color Quest! You discovered **Form** -- you noticed that all these things share the same red color, even though they look totally different! And you found an incredible **Connection** -- Red Dragon, [Name 1], [Name 2], and [Name 3] are completely different things, but they are ALL red! The same color connects them like a secret team! You earned your Color Quest Badge!"

**Possible child responses**:
1. [Ideal] "Yay!" / "I'm a Color Scout!" / "I want to find more red things!"
2. [Unexpected] "Can I find blue next?" / "I like the badge!" / Child asks for another color.
3. [No response] Child watches the badge animation.

**AI follow-up**:
1. [encouraging] "Next time you look around, keep your color eyes ON -- who KNOWS how many red things are hiding in plain sight! Maybe you will find a whole new Red Team! See you on the next quest, Scout!"
2. [warm] "Blue can be your next quest color! Your Color Scout badge is saved, and your color eyes are getting stronger."
3. [waits 2s] [soft] "Your Color Quest Badge is shining bright red. Bye for now, Scout!"

**Screen**: Golden "Color Quest Badge" -- circular, with red paint-drop silhouette at center and 4 photos as insets with character names. **"Form"** and **"Connection"** float up artistically. Color compass between concept words. Soft chime. Red paint-drops and color-sparkles settle.
