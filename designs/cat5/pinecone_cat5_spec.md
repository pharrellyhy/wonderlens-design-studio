## The Pattern Friends Safari

### A. Basic Info

| Field | Value |
|-------|-------|
| Activity Name | The Pattern Friends Safari |
| Activity Category | 5 — Collection/Tracking Exploration (Out-of-Device, Solo, Outdoor) |
| Recommended Tier | T1 (ages 4–6) |
| Core IB Key Concepts | Form, Connection |
| Related Concepts | Pattern (designed), Structure (designed), Discovery (designed), Nature (designed) |
| ATL Skills Focus | Research (Observation, Data collection), Thinking (Creative thinking, Interpretation), Communication (Expressing — narrative co-creation), Self-Management (Organization) |
| Game Style | naming_story |
| Design Version | 2.0 — naming_story redesign |
| Last Updated | 2026-03-24 |
| Trigger Entity | Pinecone |
| Trigger Scene | Child photographs a pinecone under a tree in the yard |
| Mapping Source | nature_objects_pinecone |
| IB Theme | How the World Works (primary, weight=0.42) — natural patterns and structures |
| Dimension Anchors | appearance — pattern (physical — "spiral scale pattern, repeating bumps" drives the wonder and collection criterion), structure — scales (physical — "overlapping woody scales in spiral arrangement"), imagination (engagement — "what does this pattern look like to you?" drives naming and story) |
| Conversation Anchor Dimensions | appearance — pattern ("spiral scale pattern going round and round"), structure — scales ("bumps that overlap in a swirly path") |

### B. Activity Overview

- **1. Brief Description**: After the child photographs a pinecone, the AI marvels at the spiral pattern on its scales and asks what the swirl looks like — harvesting a personal detail that drives a character name (e.g., "It looks like a staircase!" → "Staircase Cone"). The child then finds 3 more things with interesting patterns, describes what each pattern looks like to them, and names each one as a character. At synthesis, the AI and child co-create an adventure story featuring all the Pattern Friends, where each character's special power comes from the child's original pattern-detail interpretation.
- **2. Educational Purpose (KUD)**:
  - **K (Know)**: Learn the vocabulary "spiral," "pattern," "texture," "repeat," "lines." Learn that a pinecone's scales grow in a spiral arrangement.
  - **U (Understand)**: Understand that the same visual **Form** (repeating pattern) shows up across very different things in nature, and that interpreting pattern-details creatively reveals surprising **Connections** between unrelated things.
  - **D (Do)**: Practice close observation and creative interpretation of natural patterns (Research Skills — observation), invent character names driven by personal detail responses (Thinking Skills — creative thinking), and co-create a narrative where each character's role reflects the child's own pattern interpretations (Communication Skills — expressing).
- **3. Design Highlight**: The pinecone's spiral is framed as the first character in a story the child builds find by find. The key mechanism is detail-harvesting: instead of classifying patterns or finding a common rule, the AI asks "What does this pattern look like to you?" for each find, and the child's answer becomes the seed for a character name and personality. A flower whose petals "look like a little sun" becomes "Sun Bloom"; bark with lines that "look like a ladder" becomes "Ladder Bark." At synthesis, these detail-driven characters go on an adventure together — and because the details come from the child's own imagination, no two safaris produce the same story.
- **4. Typical Scenario**: A 5-year-old photographs a pinecone in the backyard → AI notices the swirly pattern, child says it looks like a staircase, they name it "Staircase Cone" → child searches for 3 more patterned things → per find, AI asks what the pattern reminds the child of, then they name it together → child co-creates a story where all the Pattern Friends go on an adventure, each using their special pattern-power.

### C. Interaction Flow — Detailed Design [Target Tier: T1]

---

**Step 1a: Transition Bridge — Warm Start**

> **Context**: Child has just finished a T1 conversation about the pinecone.
> **Conversation anchor**: appearance — pattern ("spiral scale pattern"); structure — scales ("bumps that overlap")
>
> **AI says**: *(warm, building on earlier)* "You noticed the pinecone's swirly bumps! They go round and round — nature drew a pattern! I wonder what other patterns are hiding in the yard..."
>
> **Possible child responses**:
> 1. (Ideal) "Yeah, let's look!" / "I see something!" / child starts looking around
> 2. (Unexpected) "I like the bumps!" / "It's like a staircase!" / "Can I keep the pinecone?"
> 3. (No response) Child holds the pinecone and looks at the screen.
>
> **AI follow-up**:
> 1. *(excited)* "Yes! Let's find more patterns! But first — those bumps going round and round... what do they look like to you?"
> 2. *(delighted, building)* "You're right — those bumps DO [look like/feel like child's word]! That swirly pattern is so cool. What does that swirl remind you of?"
> 3. *(wait 3 seconds)* *(gentle, curious)* "See the bumps on the pinecone? They go round and round — like a curly path! What does it remind you of? A staircase? A slide? A snail shell?"
>
> **Screen**: Child's pinecone photo fills the center. A soft golden glow traces the spiral pattern on the scales, slowly rotating to highlight the swirl. Tiny sparkle particles follow the spiral path. A faint "conversation recap" shimmer pulses on the spiral. Warm green leaf border frames the edges.

**Step 1b: Transition Bridge — Cold Start**

> **AI says**: "*(amazed, whispering)* Ohhh! Look at this pinecone! See those little bumps going round and round? It looks like someone drew a secret swirl on it! What does that swirly shape remind you of?"
>
> **Possible child responses**:
> 1. (Ideal) "A slide!" / "A snail!" / "A staircase!" / "Stairs that go around!"
> 2. (Unexpected) "It's just a pinecone." / "I don't know." / "It's brown."
> 3. (No response) Child is silent or looking away.
>
> **AI follow-up**:
> 1. "*(delighted)* Yes! It DOES look like a [child's word]! Those bumps go round and round just like a [child's word]! Let's give this pinecone a character name — how about... [Child's Word] Cone! Welcome, [Child's Word] Cone! I have an adventure for you two..."
> 2. "*(warm, encouraging)* It IS a pinecone — and look closely at the bumps. They go around and around, like a little swirl! Does it look more like a tiny staircase, or a curly slide, or something else to you?" *(waits for child's detail, then names accordingly — e.g., "A curly slide? Then let's call it Curly Cone!")*
> 3. *(wait 3 seconds)* "*(gentle, curious)* See the bumps on the pinecone? They go round and round — like a curly path! It reminds ME of a tiny staircase. What does it remind YOU of? A staircase? A slide? A snail shell?"
>
> **Screen**: Child's pinecone photo fills the center. A soft golden glow traces the spiral pattern on the scales, slowly rotating to highlight the swirl. Tiny sparkle particles follow the spiral path. A name tag appears below the photo with the character name once chosen. Warm green leaf border frames the edges.

---

**Step 2: Mission Briefing**

> **AI says**: "*(adventurous, explorer tone)* Alright — [Character Name] needs some friends! Your mission has three parts. Part one: find 3 things in your yard with interesting patterns — stripes, dots, swirls, anything cool! Part two: tell me what each pattern looks like to you, and we'll give each one a character name. Part three: we'll make up a story about ALL your Pattern Friends together! Ready to find some friends for [Character Name]?"
>
> **Possible child responses**:
> 1. (Ideal) "Yeah!" / "I want to find them!" / "Let's go!"
> 2. (Unexpected) "What's a pattern?" / "Like stripes?" / "I see a bug!"
> 3. (No response) Child is silent.
>
> **AI follow-up**:
> 1. "*(cheering)* Pattern Friend hunt is GO! Find something with an interesting pattern, take a photo, and tell me what the pattern looks like to you. Let's go!"
> 2. "*(playful)* Yes, stripes are a pattern! And so are dots, swirls, and lines that repeat. Look around — what else has a cool pattern? Take a photo when you find one!"
> 3. *(wait 3 seconds)* "*(encouraging)* A pattern is when shapes repeat — like the swirl on this pinecone! Look around the yard. What else has lines, dots, or shapes that go again and again? Snap a photo when you spot one!"
>
> **Screen**: A safari-themed mission card slides in from the right. At the top: a badge icon reading "Pattern Friend Scout" with a magnifying glass. Below: 4 photo slots in a row — the first slot holds the pinecone photo with a small golden checkmark and its character name tag. Slots 2–4 are empty with dotted outlines and question marks. A numbered task list beneath reads: "1. Find 3 patterned things. 2. Name each character. 3. Tell their story!"

---

**Step 3: Multi-Round Exploration (3–4 finds)**

**Find 1 — First discovery (high-success, build confidence)**

> *(Child takes a photo of something — e.g., a flower with petal rings)*
>
> **AI says**: "*(gasping)* Whoa, great find! I see a cool pattern on that! What does the pattern look like to you? Does it remind you of anything?"
>
> **Possible child responses**:
> 1. (Ideal) "The petals look like a little sun!" / "It looks like a pinwheel!" / "Like a star!"
> 2. (Unexpected) "It's pretty." / "It's a flower." / random observation
> 3. (No response) Child is silent.
>
> **AI follow-up**:
> 1. "*(thrilled)* A little sun — I LOVE that! The petals go around the center just like sun rays! Let's call this character... Sun Bloom! Welcome, Sun Bloom! 2 more Pattern Friends to find!"
> 2. "*(warm)* It IS a [flower/thing]! And look at the pattern — those petals going around and around. What do they look like to you? A tiny sun? A spinning wheel? A star?" *(waits for child's detail, then names accordingly — e.g., "A spinning wheel? Then let's call it Spinner Flower!")*
> 3. *(wait 3 seconds)* "*(encouraging)* Ooh, I see a pattern — shapes going around the middle! It reminds ME of a tiny sun. What does it remind YOU of? A sun? A star? Something else?"
>
> **Screen**: The new photo slides into slot 2 with a golden checkmark animation. A brief sparkle burst around the slot. A name tag appears under the photo with the character name. The counter updates: "2 of 4 Pattern Friends found!"

**Find 2 — Second discovery (expanding the search)**

> *(Child takes a photo — e.g., tree bark with repeating ridges)*
>
> **AI says**: "*(excited whisper)* Another pattern! Ooh, look at that! What does THIS pattern look like to you?"
>
> **Possible child responses**:
> 1. (Ideal) "The lines look like a ladder!" / "Like a road!" / "Like a zipper!"
> 2. (Unexpected) "I found bark." / "It's rough." / names the object only
> 3. (No response) Child is silent.
>
> **AI follow-up**:
> 1. "*(amazed)* A ladder — yes! Those lines DO go up and up like a tiny ladder! Let's call this one... Ladder Bark! I bet Ladder Bark can help everyone climb to high places! 1 more Pattern Friend to find!"
> 2. "*(warm)* Great eye! And look at those lines and ridges — they make a cool pattern! What do they look like to you? A ladder? Train tracks? A secret map?" *(waits for child's answer, then names accordingly — e.g., "A secret map? Then it's Map Bark!")*
> 3. *(wait 3 seconds)* "*(helpful)* Look at those lines and ridges! They remind ME of a tiny ladder. What do they remind YOU of? A ladder? A road? Something else?"
>
> **Screen**: New photo slides into slot 3 with a name tag and checkmark. Counter updates: "3 of 4 Pattern Friends found!" A dotted safari trail animation shows the scout nearing the finish flag.

**Find 3 — Third discovery (peak challenge)**

> *(Child takes a photo — e.g., a leaf with branching veins, a snail shell spiral, a spiderweb)*
>
> **AI says**: "*(triumphant)* YES! The last Pattern Friend! What does THIS pattern look like to you?"
>
> **Possible child responses**:
> 1. (Ideal) "Like a fan!" / "Like rivers!" / "Like a spiderweb blanket!" / "Like lightning!"
> 2. (Unexpected) Names the object or says something unrelated.
> 3. (No response) Child is silent.
>
> **AI follow-up**:
> 1. "*(celebrating)* [Child's word] — I can totally see that! Those lines spreading out DO look like [child's word]! Let's call this character... [Name based on child's word]! All four Pattern Friends are HERE!"
> 2. "*(warm, excited)* And look — it has a really cool pattern! Those lines spreading out — do they look like a fan? Like lightning? Like tiny rivers?" *(waits for child's answer, then names accordingly)*
> 3. *(wait 3 seconds)* "*(enthusiastic)* I see lines that spread out in a really cool way! It reminds ME of a little fan. What does it remind YOU of? A fan? Lightning? Something else?"
>
> **Screen**: Final photo slides into slot 4 with a name tag. All four slots glow gold with their character names displayed. A burst of confetti rains across the screen. Text flashes: "ALL PATTERN FRIENDS FOUND!" A "Story Time!" banner starts pulsing.

**STUCK BRANCH (if child says "I can't find one" or wanders without photographing)**

> **AI says**: "*(helpful, warm)* Hmm, let me give you a clue! Look really close at a flower — see how the petals make a pattern? Or check a leaf — the lines go the same way again and again. Try near the garden or under the big tree!"
>
> **Possible child responses**:
> 1. (Ideal) Child goes to look at a flower or leaf and photographs it.
> 2. (Unexpected) "I still can't find one." / "There's nothing."
> 3. (No response) Child stands still.
>
> **AI follow-up**:
> 1. "*(encouraging)* Great, go check it out! Photograph it and tell me what the pattern looks like to you!"
> 2. "*(patient, reassuring)* That's OK! Even the grass has a pattern — each blade looks the same, over and over. Try photographing the grass up close! What does the pattern look like to you?"
> 3. *(wait 3 seconds)* "*(gentle)* Look down at your feet. See the grass? Each little blade is the same shape, repeating. That counts! Try a photo and tell me what it reminds you of!"
>
> **Screen**: A "hint card" overlay appears with a magnifying glass icon and two illustrated suggestion bubbles: one showing a simple flower drawing with an arrow circling its petals, another showing a leaf with lines highlighted. Text: "Try looking here!" A compass arrow gently spins, then points downward toward the ground.

---

**Step 4: Story Co-Creation**

> **AI says**: "*(proud, excited)* Look at your Pattern Friends! [Name 1] the pinecone, [Name 2] the [detail], [Name 3] the [detail], and [Name 4] the [detail]. Nature drew a secret pattern on each of them! Now — what adventure do they have together? What happens to them?"
>
> **Possible child responses**:
> 1. (Ideal) "They go on a trip!" / "They find treasure!" / "They help each other!" / Child starts a story.
> 2. (Unexpected) "I don't know." / "They're just plants."
> 3. (No response) Child is silent or thinking.
>
> **AI follow-up**:
> 1. "*(narrating with wonder)* Once upon a time, [Name 1] was sitting under the big tree when [Name 2] came along. 'Wow!' said [Name 1], 'Your pattern looks like a [detail]!' 'And yours looks like a [detail]!' said [Name 2]. Then [Name 3] the [detail] showed up and said, 'I can [action based on detail — e.g., shine in circles / help everyone climb / fan everyone cool]!' And [Name 4] the [detail] said, 'Let's all [child's adventure idea] together!' And they did — using their special pattern-powers! What happened at the end?"
> 2. "*(playfully)* Okay, let me start and you help! One day, [Name 1] was under the tree when [Name 2] showed up. 'Whoa!' said [Name 1], 'Your pattern looks like a [detail]! Can you [action based on detail]?' [Name 2] said, 'Yes! And YOUR pattern looks like a [detail]!' They laughed. Then who did they meet next?"
> 3. *(wait 4 seconds)* "*(gently, storytelling voice)* I'll start! Once upon a time, [Name 1] was under the big tree. Along came [Name 2] the [detail], who could [action based on detail]! Then [Name 3] the [detail] appeared, and [Name 4] the [detail]! They all had pattern-powers! What did they do together?"
>
> **Screen**: All 4 photos displayed in a storybook-style layout with character name tags below each. A soft open-book animation frames the photos. As the AI narrates, gentle spotlight effects highlight each character when mentioned. Speech bubbles appear briefly near each character. A golden "story scroll" unfurls behind the photos.

---

**Step 5: Discovery Celebration**

> **AI says**: "*(amazed and warm)* What an adventure! [Name 1], [Name 2], [Name 3], and [Name 4] — they're all so different, but they ALL had a secret pattern hiding on them! [Name 2] had a pattern that looked like a [detail], and [Name 3] had one that looked like a [detail]. Why do you think nature puts so many patterns on things?"
>
> **Possible child responses**:
> 1. (Ideal) "Because it's pretty!" / "To help them grow!" / "Nature likes it!" / a creative guess
> 2. (Unexpected) "I don't know." / "Because." / changes subject
> 3. (No response) Child is silent.
>
> **AI follow-up**:
> 1. "*(delighted)* What a great idea! Maybe nature really does use patterns to [grow/look pretty/stay strong]. Your Pattern Friends knew that all along — [Name 1]'s [detail] pattern and [Name 2]'s [detail] pattern both help nature do something special!"
> 2. "*(warm)* That is a BIG question — even scientists still wonder! Some think patterns help things grow strong. Your Pattern Friends — [Name 1], [Name 2], [Name 3], and [Name 4] — all have their own special pattern for a reason!"
> 3. *(wait 3 seconds)* "*(gentle, reflective)* Nobody knows for sure! Maybe patterns help things grow, or stay strong. Your Pattern Friends each had their own special one — and YOU gave each of them a name and a story!"
>
> **Screen**: The storybook layout remains with the four characters and their name tags displayed. Gentle animated lines trace the pattern on each photo. A soft wind animation blows tiny sparkles across the screen. The word "WHY?" floats in the center in playful, hand-drawn letters. When the child responds, the "WHY?" transforms into a lightbulb icon with rays of light.

---

**Step 6: Closing + IB Concepts**

> **AI says**: "*(warm celebration)* Congratulations, Pattern Friend Scout! You did something really special today. You looked closely at the **Form** of things — their patterns, their shapes, what they reminded you of. And you discovered an amazing **Connection** — [Name 1], [Name 2], [Name 3], and [Name 4] all had patterns hiding on them, and YOU turned them into characters with their own adventure! You earned your Pattern Friends Safari Badge!"
>
> **Possible child responses**:
> 1. (Ideal) "Yay!" / "I'm a Pattern Scout!" / child cheers
> 2. (Unexpected) "Can I find more?" / "I want to play again!" / asks a question
> 3. (No response) Child is quiet.
>
> **AI follow-up**:
> 1. "*(joyful)* Pattern Friend champion! Your yard is full of secret patterns — maybe next time you'll find even more characters for a brand new story!"
> 2. "*(warm, excited)* You can ALWAYS look for more patterns! Every new find can become a new character with a new story. Keep those scout eyes open!"
> 3. *(wait 3 seconds)* "*(gentle, warm)* You did an amazing job today, Scout. Your Pattern Friends are waiting for their next adventure. See you next time!"
>
> **Screen**: A large golden badge fills the center: "Pattern Friends Safari" written in bold, with the child's 4 collection photos arranged inside the badge as a mosaic, each with its character name tag. Below the badge, two concept words appear with artistic styling — "Form" with a magnifying glass icon tracing a spiral, and "Connection" with a golden thread linking two small nature illustrations. A storybook icon nestles between the concept words. Gentle confetti falls. After 4 seconds, the screen transitions to a closing illustration of a pinecone surrounded by swirling golden pattern lines, with "Great job, Pattern Friend Scout!" in friendly letters beneath.

---

## Self-Evaluation Scorecard

| # | Dimension | Score | Notes |
|---|-----------|-------|-------|
| 1 | V1 Technical Compliance | PASS | No OCR, face detection, IMU, or state-change comparison. Activity uses independent multi-photo workflow (each photo processed on its own). All verification is dialogue-based — child self-reports pattern interpretations. |
| 2 | Hook Rule Compliance | PASS | Both bridges open with emotional wonder — warm start builds on conversation ("You noticed the pinecone's swirly bumps!"), cold start uses amazement ("Ohhh! Look at this pinecone!"). Neither tests knowledge. |
| 3 | Transition Naturalness | PASS | The activity grows organically: admire the spiral → child says what it looks like → name it as a character → wonder if there are more pattern friends → find and name them → tell their story together. No sudden "Now let's play a game!" |
| 4 | Edge Case Coverage | PASS | Every step has 3 response branches (ideal, unexpected, silence). All "unexpected" branches validate first, then scaffold with specific detail prompts (e.g., "Does it look more like a ladder? Train tracks? A secret map?"). All "silence" branches include wait time + gentle prompt with concrete options. STUCK branch included with specific location hints. |
| 5 | IB Completeness | PASS | Key Concepts (Form, Connection) named in Step 6 closing as praise, referencing the story characters by name. KUD fully defined with 5 vocabulary words, 2 conceptual understandings, 3 skills including Communication — narrative co-creation. ATL skills updated to include creative thinking and expressing. Related Concepts (Pattern, Structure, Discovery, Nature) assigned. Concepts match what the child actually did. |
| 6 | Tier Appropriateness | PASS | AI sentences are 5–8 words per clause. Open-ended detail questions throughout ("What does it look like to you?"). 3-part mission structure. Concrete vocabulary (swirl, bumps, pattern, lines). Tasks achievable for ages 4–6. Child co-creates narrative with AI scaffolding. |
| 7 | Dialogue Specificity | PASS | Every AI line is concrete dialogue with tone/emotion markers in parentheses. Zero abstract placeholders. Detail-harvesting questions are specific and open-ended. Naming examples show detail-to-name flow (e.g., "looks like a little sun" → "Sun Bloom", "looks like a ladder" → "Ladder Bark"). |
| 8 | Screen & UI Completeness | PASS | Every step has specific screen descriptions including layout, animations (spiral glow trace, confetti bursts, name tags), visual elements (mission card with slots, hint card overlay, storybook layout with speech bubbles and spotlights, badge mosaic with character names), and transitions. |
| 9 | Entity Mapping Alignment | PASS | Key Concepts Form + Connection justified by activity mechanic (pattern observation = form, patterns across different things = connection). Theme = How the World Works (primary, 0.42) — natural patterns and structures. Related Concepts: Pattern, Structure, Discovery, Nature — all designed. Vocabulary (spiral, pattern, texture, repeat, lines) traces to T1 tier_guidance. Warm start references appearance — pattern and structure — scales dimensions. Anchors: appearance, structure, imagination. |

**Overall**: ALL PASS — naming_story with detail-harvesting. Litmus test: if child described the patterns differently, character names, personalities, and the story would all be different.
