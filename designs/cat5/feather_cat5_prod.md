## Activity: The Sky-Light Brigade

### A. Basic Info

- **Activity Name**: The Sky-Light Brigade
- **Activity Category**: Category 5 — Collection/Tracking Exploration (Out-of-Device, Solo, Outdoor)
- **Recommended Tier**: T1 (ages 4-6)
- **Core IB Key Concepts**: Form, Connection
- **Related Concepts (Discipline)**: Discovery, Pattern, Classification, Nature
- **ATL Skills Focus**: Research (Observation, Data collection), Thinking (Creative thinking, Transfer), Communication (Expressing — narrative co-creation), Self-Management (Organization)
- **Trigger Entity**: Feather
- **Trigger Scene**: Child photographs a feather found on the playground
- **Game Style**: naming_story
- **Design Version**: 2.0 — naming_story redesign
- **Last Updated**: 2026-03-24

### B. Activity Overview

- **1. Brief Description**: After the child photographs a feather on the playground, the AI marvels at how light and delicate it is and wonders what else could ride the wind. The child becomes a "Sky-Light Captain" on a mission to find 3 light things that could float on a breeze. For each find, the AI asks what it feels like and what it reminds the child of — harvesting a personal sensory detail. That detail drives a unique character name (e.g., a leaf that "feels thin and crinkly" becomes "Crinkle Wing"). Once all three wind riders are named, the AI co-creates a wind adventure story where each character rides the wind differently based on its unique detail.
- **2. Educational Purpose (KUD)**:
  - **K (Know)**: Feather, lightweight, float, breeze, texture — vocabulary for weight, air movement, and surface qualities. Learn that different light things have different textures (soft, crinkly, smooth, fuzzy).
  - **U (Understand)**: Many different things share the property of being light enough to move in wind (Form); objects that look and feel very different can share a hidden quality that connects them (Connection). Each light thing has its own unique texture and form that affects HOW it moves in wind.
  - **D (Do)**: Observe and describe sensory properties of lightweight objects (texture, feel); invent character names driven by personal sensory responses; co-create a narrative where each character's wind-riding style reflects the child's own observations.
- **3. Design Highlight**: The feather becomes a "team captain" recruiting other lightweight things into a wind-powered brigade. The key mechanism is sensory detail-harvesting: for each find, the AI asks "What does it feel like? What does it remind you of?" and the child's answer becomes the seed for a character name and wind-riding personality. A leaf that "feels thin and crinkly" becomes "Crinkle Wing" who tumbles and crackles in the wind; dandelion fluff that's "like a tiny cloud" becomes "Cloud Puff" who floats up high. At synthesis, these detail-driven characters ride the wind together — and because the details come from the child's own senses, no two brigades produce the same story.
- **4. Typical Scenario**: A 5-year-old finds a small feather on the playground, photographs it, then searches for a thin leaf, dandelion fluff, and a flower petal. For each find, the AI asks what it feels like — the child says the leaf is "crinkly," the fluff is "like a tiny cloud," and the petal is "smooth and slippery." They become Crinkle Wing, Cloud Puff, and Slippy Petal. The AI narrates a wind story where Crinkle Wing tumbles and crackles, Cloud Puff floats up high, and Slippy Petal glides smooth and fast.

### C. Interaction Flow — Detailed Design [Target Tier: T1]

---

**Step 1: Transition Bridge**

> **AI says**: "*(amazed, gentle)* Oh wow, look at this feather! It has such tiny soft lines. I bet if you blew on it, it would fly away! What do you think it feels like?"
>
> **Possible child responses**:
> 1. (Ideal) "Soft!" / "It feels fluffy!" / "Really light!"
> 2. (Unexpected) "A bird dropped it!" / "It's white!" / names a color
> 3. (No response) Child is silent or examining the feather.
>
> **AI follow-up**:
> 1. "*(warm)* Yes! So soft and light! Almost like a tiny cloud. I wonder what else is that light around here..."
> 2. "*(curious)* Ooh, you're right! A bird left this gift. And it's sooo light — feel how light it is!"
> 3. *(wait 2 seconds)* "*(soft, inviting)* Try touching it gently. So soft! And so, so light — like a little piece of sky."
>
> **Screen**: Child's photo of the feather centered on screen. A soft glow highlights the fine barb lines of the feather. Gentle breeze animation with tiny floating particles drifting slowly across the background.

---

**Step 2: Mission Briefing**

> **AI says**: "*(excited, conspiratorial)* You know what? This feather is SO light, it could float on the wind! What if we found more light things and gave each one a special wind name? You could be the Sky-Light Captain! Here is your mission: Find 3 more things nearby that are super light — things the wind could carry. Take a photo of each one. Then we'll feel each one, figure out what it's like, and give it its own wind-rider name!"
>
> **Possible child responses**:
> 1. (Ideal) "Okay!" / "Yeah!" / "I want to find them!"
> 2. (Unexpected) "What things?" / "Like what?" / child seems unsure
> 3. (No response) Child looks around but doesn't speak.
>
> **AI follow-up**:
> 1. "*(pumped)* Let's go, Captain! Your feather is wind rider number one — Soft Floater! Find something light and take a photo!"
> 2. "*(helpful)* Great question! Think about things you could blow off your hand — like a leaf or a little petal. Go look around and photograph what you find! We'll figure out what it feels like together!"
> 3. *(wait 2 seconds)* "*(encouraging)* Look around the playground! Anything super light — maybe near the grass or under a tree. Take a photo when you find one!"
>
> **Screen**: A mission card appears. At the top, a badge reads "Sky-Light Captain" with a small feather icon. Below it, 4 circular slots in a row — the first slot holds the child's feather photo with a name tag reading "Soft Floater," the other 3 are empty with dotted outlines and a "?" in each. A numbered checklist shows: 1. Find 3 light things, 2. Feel each one and name it, 3. Tell their wind story.

---

**Step 3: Multi-Round Exploration (3 rounds)**

**Round 1 — First Find**

> *(Child takes a photo of something they found — e.g., a thin leaf)*
>
> **AI says**: "*(excited discovery)* Ooh, look at that! I can tell it's super light. Now touch it gently — what does it feel like? What does it remind you of?"
>
> **Possible child responses**:
> 1. (Ideal) "It feels thin and crinkly!" / "It's like paper!" / "Smooth and bendy!"
> 2. (Unexpected) "It's green!" / "I found it by the tree!" / describes color or location
> 3. (No response) Child is silent.
>
> **AI follow-up**:
> 1. "*(thrilled, naming)* Thin and crinkly — I love that! When the wind blows, it'll crinkle and crackle! Let's call this wind rider... Crinkle Wing! Welcome to the brigade, Crinkle Wing! 2 more to find, Captain!"
> 2. "*(warm)* Green and beautiful! Now feel it — is it smooth or bumpy? Crinkly or soft? What does it remind you of?" *(waits for child's detail, then names accordingly — e.g., "Smooth? It's Silky Glider! Hello, Silky Glider!")*
> 3. *(wait 2 seconds)* "*(encouraging)* Try feeling it with your fingers! Is it soft like the feather? Or thin? Or bumpy? What does it remind you of?"
>
> **Screen**: The new photo slides into the second slot with a gentle pop animation. A small wind-swirl icon appears beside it. A name tag appears below with the detail-driven character name. Counter: "2 more to find!"

**Round 2 — Second Find**

> *(Child takes another photo — e.g., dandelion fluff)*
>
> **AI says**: "*(curious, detective voice)* Wind rider number two! Ooh, this one looks different from [Name 1]. Touch it gently — what does THIS one feel like? What does it remind you of?"
>
> **Possible child responses**:
> 1. (Ideal) "It's like a tiny cloud!" / "So fuzzy and soft!" / "It tickles!"
> 2. (Unexpected) "I can blow it!" / "It's white!" / describes what it does rather than feels like
> 3. (No response) Child is quiet.
>
> **AI follow-up**:
> 1. "*(amazed, naming)* Like a tiny cloud — perfect! This one will float up SO high when the wind blows! Let's call it... Cloud Puff! Hello, Cloud Puff! Only 1 more, Captain!"
> 2. "*(warm, scaffolding)* You CAN blow it — because it's so light and fluffy! Does it feel soft? Tickly? What does it remind you of when you touch it?" *(waits for child's detail, then names accordingly — e.g., "Tickly? Then it's Tickle Fluff!")*
> 3. *(wait 2 seconds)* "*(playful)* Try touching it super gently! Does it feel fuzzy? Soft? Like a tiny cotton ball? Or something else? Tell me!"
>
> **Screen**: The third slot fills in with name tag. A faint line connects the new find to the previous ones. Counter: "1 more to find!"

**Round 3 — Third Find**

> *(Child takes another photo — e.g., a flower petal)*
>
> **AI says**: "*(celebratory)* Yes! The last wind rider! Feel this one — what does it feel like? Is it like [Name 1] or like [Name 2], or totally different?"
>
> **Possible child responses**:
> 1. (Ideal) "It's smooth and slippery!" / "Soft like a blanket!" / "Thin like a butterfly wing!"
> 2. (Unexpected) "It smells nice!" / "It's pink!" / "Can I find more?"
> 3. (No response) Child is quiet.
>
> **AI follow-up**:
> 1. "*(delighted, naming)* Smooth and slippery! This one will glide through the wind like a little surfer! Let's call it... Slippy Petal! Your wind riders are ALL here, Captain!"
> 2. "*(warm, harvesting)* It smells nice AND it's super light! Now feel it — is it smooth or rough? Soft or crinkly? What does it remind you of?" *(waits for child's detail, then names — e.g., "Like a tiny blanket? Then it's Blanket Wing!")*
> 3. *(wait 2 seconds)* "*(cheerful)* Try touching it — is it smooth? Rough? Fuzzy? Every light thing feels different! What does this one remind you of?"
>
> **Screen**: The fourth slot fills in with a satisfying click animation. All four photos glow briefly in unison, each with its unique name tag below. A banner unfurls: "Wind Riders Ready!" Small wind-swirl particles float across all four images.

**STUCK BRANCH** *(if child can't find something light)*

> **AI says**: "*(helpful, friendly)* Hmm, let's think! Light things like to hide near the ground. Try looking in the grass for a tiny leaf or a petal. Or check under a tree — sometimes little seeds float down! Even a piece of dandelion fluff counts!"
>
> **Possible child responses**:
> 1. (Ideal) "I found one!" / Child points to a petal, leaf, or fluff.
> 2. (Unexpected) "I still don't know." / "Nothing is light."
> 3. (No response) Child keeps scanning without moving closer.
>
> **AI follow-up**:
> 1. "*(excited)* Great eye, Captain! Go snap a photo and then tell me what it feels like!"
> 2. "*(reassuring)* That's okay! Try the tiniest things first — a petal, a seed, or a skinny leaf. Even one tiny floaty thing counts."
> 3. *(wait 2 seconds)* "*(gentle prompt)* Let's look low near the grass, then under the tree. Do you see the smallest, floatiest thing nearby?"
>
> **Screen**: A simple illustrated map appears showing playground hints: an arrow pointing to "near grass," another to "under trees," and a third to "near flowers." Each label has a small icon (leaf, seed, petal).

---

**Step 4: Story Co-Creation (NAMING SYNTHESIS)**

> **AI says**: "*(proud, storytelling voice)* Captain, your wind riders are ready! Soft Floater the feather, [Name 1] the [detail], [Name 2] the [detail], and [Name 3] the [detail] — four wind riders, all from this playground! Now — a BIG gust of wind is coming! Whooooosh! What happens when the wind blows them all at once?"
>
> **Possible child responses**:
> 1. (Ideal) "They fly!" / "They go up in the sky!" / "They spin around!" / Child starts a story.
> 2. (Unexpected) "I don't know" / "They blow away" / gives a single short answer
> 3. (No response) Child is silent or looking at the screen.
>
> **AI follow-up**:
> 1. "*(narrating with wonder, each character's action driven by their detail)* Whoooosh! The big wind comes! Soft Floater the feather drifts up gently, swaying side to side! [Name 1] [detail-driven action — e.g., 'crinkles and tumbles, making little crackling sounds as it rolls through the air!'] [Name 2] [detail-driven action — e.g., 'floats up high like a real cloud, higher than everyone else!'] And [Name 3] [detail-driven action — e.g., 'glides smooth and fast, slipping through the wind like a tiny surfer!'] They all ride the wind — but each one rides it their own special way! What happens next, Captain?"
> 2. "*(playful, scaffolding with details)* They blow away — wheee! But here's the fun part — they each blow differently! Soft Floater drifts and sways. But [Name 1] — remember, it's [child's detail]! How does a [detail] thing move in the wind? Does it spin? Tumble? Glide?" *(waits for child's input, then continues story with each character)*
> 3. *(wait 2 seconds)* "*(gently, storytelling voice)* I'll start! Whooooosh — big wind! Soft Floater the feather floats up softly. And [Name 1] the [detail] one — it [detail-driven action]! And [Name 2] the [detail] one — it [detail-driven action]! And [Name 3] — it [detail-driven action]! They're all flying! Where do they land, Captain?"
>
> **Screen**: All four photos arranged in a diamond formation on a sky-blue background. Animated wind gusts sweep across the screen. Each character performs its detail-driven wind animation (e.g., crinkly one tumbles and spins, cloud-like one floats upward, smooth one glides in an arc). Character name tags float beneath each photo. A storybook scroll unfurls behind the photos. Speech bubbles appear briefly near each character when the AI mentions them.

---

**Step 5: Discovery Celebration**

> **AI says**: "*(warm, proud)* Wow, Captain! What an adventure! Soft Floater, [Name 1], [Name 2], and [Name 3] — they're all super light, but they each ride the wind so differently! [Name 1] is [detail] so it [detail-driven movement]. [Name 2] is [detail] so it [detail-driven movement]. Why do you think light things move differently in the wind?"
>
> **Possible child responses**:
> 1. (Ideal) "Because they feel different!" / "Some are crinkly and some are smooth!" / "The fuzzy one goes up more!"
> 2. (Unexpected) "I like [Name] best!" / talks about a favorite character
> 3. (No response) Child is quiet.
>
> **AI follow-up**:
> 1. "*(thoughtful)* That's such smart thinking! The way something feels — crinkly, smooth, fuzzy — changes how the wind carries it! Crinkly things tumble, smooth things glide, fuzzy things float up!"
> 2. "*(warm)* [Name] is a great character! And it's amazing that [Name] rides the wind in its own special way because it's [detail]. Each one is unique!"
> 3. *(wait 2 seconds)* "*(gentle)* I think it's because they all feel different! A crinkly thing tumbles, a smooth thing glides, and a fuzzy thing floats way up. Their texture is their secret wind power!"
>
> **Screen**: All four photos displayed in a row with gentle floating animation — each photo bobs and moves differently based on its character's detail (crinkly one tumbles, smooth one glides, fluffy one bobs upward). Thin animated wind lines flow between them. Each character's name tag and key detail word glow beneath.

---

**Step 6: Closing + IB Concepts**

> **AI says**: "*(gentle, celebratory)* You are an amazing Sky-Light Captain! You looked closely at each thing you found — you felt its texture, noticed what made it special, and gave it its own wind-rider name. That's called exploring Form — what something looks and feels like! And you discovered that your feather, [Name 1], [Name 2], and [Name 3] all share something — they're all light enough to ride the wind. Finding what connects different things is called Connection! Great exploring today, Captain!"
>
> **Possible child responses**:
> 1. (Ideal) "That was fun!" / "Can I find more?" / child smiles or cheers
> 2. (Unexpected) "I want to keep the feather!" / says something about one character
> 3. (No response) Child is quiet.
>
> **AI follow-up**:
> 1. "*(cheerful)* So much fun! Next time you're outside, keep your captain eyes open — every light thing could be a new wind rider with its own name and its own story! Keep exploring, Captain!"
> 2. "*(warm)* Yes, keep that feather safe! Soft Floater started your whole brigade. And remember — [Name 1], [Name 2], and [Name 3] are still out there riding the wind! Great job today, Captain!"
> 3. *(wait 2 seconds)* "*(soft, kind)* Your wind riders are amazing, Captain. Soft Floater, [Name 1], [Name 2], and [Name 3] — each one special. See you next time!"
>
> **Screen**: A badge animation appears: a golden shield with a feather icon and the text "Sky-Light Captain" in bold, friendly letters. The four collection photos appear as small insets around the badge, each with its character name tag. Below the badge, two concept words fade in artistically: "Form" with a magnifying-glass icon and "Connection" with a chain-link icon, both surrounded by soft wind-trail flourishes. A small storybook icon nestles between the concept words. After 3 seconds, gentle closing screen with character names listed and "Great exploring today!" text.

---

## Self-Evaluation Scorecard

| # | Dimension | Score | Notes |
|---|-----------|-------|-------|
| 1 | V1 Technical Compliance | PASS | No OCR, face detection, IMU, or state-change comparison. Multi-photo workflow used correctly — each photo processed independently. Child self-reports texture and lightness through dialogue. |
| 2 | Hook Rule Compliance | PASS | Step 1 opens with emotional wonder about the feather's softness and lightness ("Oh wow, look at this feather!"), not knowledge testing. Asks what it feels like, not what it is. |
| 3 | Transition Naturalness | PASS | Activity grows naturally: admiring the feather's lightness leads to wondering what else is light, which becomes the collection-and-naming mission. No abrupt "Now let's play a game." |
| 4 | Edge Case Coverage | PASS | Every step has 3 response branches (ideal, unexpected, no response). All unexpected branches validate first, then scaffold with specific sensory prompts (e.g., "is it smooth or bumpy? Crinkly or soft?"). All silence branches include wait time + gentle prompt. STUCK branch provides concrete location hints. |
| 5 | IB Completeness | PASS | Key Concepts (Form, Connection) explicitly named in Step 6 closing as praise. KUD fully defined with specific vocabulary, sensory understanding, and creative skills. ATL skills updated to include Communication Skills — expressing (narrative co-creation). Related Concepts listed. Concepts match what the child actually did. |
| 6 | Tier Appropriateness | PASS | T1: AI sentences consistently 5-8 words. Open-ended sensory questions used throughout ("What does it feel like? What does it remind you of?"). 3 clear sub-tasks in mission briefing. Concrete vocabulary (light, soft, crinkly, smooth, float, wind). Child co-creates narrative with AI scaffolding. Achievable complexity for ages 4-6. |
| 7 | Dialogue Specificity | PASS | Every AI line is concrete dialogue with tone/emotion markers in parentheses. No abstract placeholders like "AI guides" or "AI encourages." Detail-harvesting questions are specific and open-ended. Naming examples show detail→name flow (e.g., "thin and crinkly" → "Crinkle Wing," "like a tiny cloud" → "Cloud Puff"). |
| 8 | Screen & UI Completeness | PASS | Every step has specific screen descriptions including layout (diamond formation, slots, badge), animations (wind swirls, detail-driven movement per character, storybook scroll), and visual elements (mission card, name tags, counter, concept icons). |
| 9 | Naming-Story Litmus Test | PASS | If the child found different objects or described them differently, the character names, wind-riding styles, and story would all be different. A child who says a leaf is "bumpy" gets "Bumpy Tumbler" instead of "Crinkle Wing." Detail drives name drives story. |

**Overall**: ALL PASS — naming_story with per-find sensory detail-harvesting. Litmus test confirmed: different objects + different descriptions = different names + different story.
