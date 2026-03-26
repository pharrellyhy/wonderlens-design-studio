# Activity Design: Sunflower + Category 1 (Sustained Verbal Interaction)

> Generated: 2026-03-19 | Mapping-informed design | Agent: Activity Design Agent

---

## Activity: Sunny What-Happens-Next (向日葵猜猜看)

### A. Basic Info

- **Activity Name**: Sunny What-Happens-Next (向日葵猜猜看)
- **Activity Category**: 1 — Sustained Verbal Interaction (In-Device)
- **Recommended Tier**: T1 (ages 4–6)
- **Core IB Key Concepts**: **Causation** (Why is it like this?) & **Change** (How is it changing?)
- **Related Concepts (Discipline)**: Growth (mapping), Interdependence (mapping), Cycles (designed), Discovery (designed)
- **ATL Skills Focus**: Thinking Skills (critical thinking, cause-and-effect reasoning), Communication Skills (expressing ideas, listening), Research Skills (observation)
- **Game Style**: prediction_game
- **Design Version**: 1.0
- **Last Updated**: 2026-03-19
- **Trigger Entity**: Sunflower (picture or seed packet)
- **Trigger Scene**: Child photographs a sunflower picture or seed packet and predicts what sun, rain, and bees cause
- **Mapping Source**: plants_sunflower
- **IB Theme**: How the World Works (mapping: primary, weight=0.46)
- **Dimension Anchors**: emotions (engagement), relationship (engagement), function (physical)
- **Conversation Anchor Dimensions**: emotions — "Do sunflowers make you feel happy or calm? Why?"; function — sun_tracking ("young heads can turn to face the sun")

### B. Activity Overview

- **① Brief Description**: After the child photographs a sunflower picture or seed packet, the AI marvels at its bright yellow petals and strong tall stem. The child becomes a "Sunflower Scientist" who predicts what happens to a sunflower when different things occur — what happens when the sun comes out? What if it rains for days? What if a bee buzzes over? Each round, the AI describes a cause, and the child guesses the sunflower's reaction, building intuition for how plants grow and respond to the world around them.

- **② Educational Purpose (KUD)**:
  - **K (Know)**: Sunflowers have long skinny petals like sunny rays; tiny seeds are packed in swirly patterns in the brown center; a thick stem holds the flower up like a strong green straw; young sunflower heads can turn to face the sun; bees visit sunflowers for nectar and pollen
  - **U (Understand)**: When something happens to a sunflower — sunshine, rain, or a visiting bee — the flower responds in a specific way. That is **Causation** (cause and effect). A sunflower changes from a tiny seed to a tall flower over time, and each change has a reason. That is **Change** (how things transform).
  - **D (Do)**: Practice predicting outcomes based on observation (Thinking Skills — critical thinking, cause-and-effect reasoning). Practice describing plant behavior using specific words (Communication Skills — expressing ideas). Practice observing details about a living thing (Research Skills — observation).

- **③ Design Highlight**: The "Sunflower Scientist" metaphor turns a static flower picture into a dynamic prediction lab. Instead of teaching the child facts about sunflowers, the AI poses "what happens when..." scenarios — sunshine, rainstorms, visiting bees, darkness — and the child predicts how the sunflower responds. Each round reveals a cause-and-effect chain that connects to real plant biology. The child feels like a scientist running experiments, but it plays like a guessing game.

- **④ Typical Scenario**: Child photographs a sunflower picture or seed packet → AI notices the bright petals and strong stem → child becomes a Sunflower Scientist who predicts what happens to the sunflower in different situations.

### C. Interaction Flow — Detailed Design [Target Tier: T1]

**Step 1a: Transition Bridge — Warm Start** (post-conversation)

> **Context**: Child has just finished a tier_1 conversation about the sunflower.
> **Conversation anchor**: function — sun_tracking ("young heads can turn to face the sun"); emotions — "Do sunflowers make you feel happy or calm?"
>
> **AI says**: "*(warm, building on earlier)* You figured out that sunflowers turn their heads to follow the sun — like they are watching it move across the sky! That is so cool. I keep wondering... what ELSE happens when the sun shines on them? What if we played a guessing game about that?"
>
> **Possible child responses**:
> 1. (Ideal) "Yeah! Let's guess!" / "They get bigger!" / "Okay!"
> 2. (Unexpected) "I like sunflowers." / "They are yellow." / "I want to plant one."
> 3. (No response) Child looks at the screen silently.
>
> **AI follow-up**:
> 1. "*(excited, conspiratorial)* Ooh, bigger — that is a great guess! Let's see if you can figure out MORE things that happen. Ready, Scientist?"
> 2. "*(encouraging)* Me too! Sunflowers are so pretty and yellow. But did you know different things CHANGE them? I bet you can guess how. Want to try?"
> 3. *(waits 2 seconds)* "*(gentle, playful whisper)* Hey — I have a fun idea. What if I tell you something that happens to the sunflower... and YOU guess what it does? Like a scientist!"
>
> **Screen**: Sunflower photo centered with a soft golden glow around the petals, subtle "conversation recap" shimmer highlighting the flower head turning. A small beaker icon fades in at the bottom corner.

**Step 1b: Transition Bridge — Cold Start**

> **Context**: Child photographs a sunflower picture or seed packet with no prior conversation.
>
> **AI says**: "*(delighted gasp)* Ohhh wow, a sunflower! Look at all those bright yellow petals — they look like little sunshine rays! And that brown middle is packed with tiny seeds. If the sun came out right now, what do you think this sunflower would do?"
>
> **Possible child responses**:
> 1. (Ideal) "It would grow!" / "It looks at the sun!" / "It would be happy!"
> 2. (Unexpected) "It's pretty!" / "I saw one at grandma's house!" / "Yellow!"
> 3. (No response) Child watches the screen silently.
>
> **AI follow-up**:
> 1. "*(warm, impressed)* Yes! Sunflowers love the sun — they even turn their heads to look at it! You know a lot. I bet you can guess even MORE things about sunflowers."
> 2. "*(enthusiastic agreement)* It IS so pretty! All those sunny petals. Sunflowers do the coolest things when the sun shines or the rain falls. Want to help me figure out what happens?"
> 3. *(waits 2 seconds)* "*(soft, wondering tone)* This sunflower is so bright and tall! I bet lots of interesting things happen to it. Want to be a scientist with me and guess?"
>
> **Screen**: Sunflower photo fills the center of the screen. Gentle golden sparkle animation radiates outward from the yellow petals. Tiny sunshine ray animations pulse from behind the flower head.

**Step 2: Rule Introduction + Demo — "The Sunflower Lab"**

> **AI says**: "*(playful, science-voice tone)* Okay, here is how our game works! I tell you something that happens to the sunflower. And YOU guess — what does the sunflower DO? Watch — I will show you! If I say... 'a big rain cloud opens up and water falls on the sunflower' — hmm, what would happen? I think... the sunflower would drink up the water through its roots and grow even taller! See? Now YOUR turn to guess. Ready, Scientist?"
>
> **Possible child responses**:
> 1. (Ideal) "Ready!" / "Yeah!" / "Let's go!"
> 2. (Unexpected) "I water plants too!" / "Rain is wet!" / Repeats "grow taller"
> 3. (No response) Child is quiet, possibly processing.
>
> **AI follow-up**:
> 1. "*(excited countdown)* Okay, Scientist — here comes your first experiment! Listen carefully..."
> 2. "*(delighted)* You water plants — just like the rain! Plants drink water and grow. Let's see if you can guess even MORE. Here comes experiment number one!"
> 3. *(waits 2 seconds)* "*(encouraging, gentle)* It is easy — I say what happens, and you guess what the sunflower does. Any answer is great! Here is the first one..."
>
> **Screen**: The sunflower photo shifts to the left side of the screen. On the right, a cartoon beaker icon appears with the text "Sunflower Lab" in playful letters. A simple animation shows: rain cloud → water falling → sunflower growing taller, demonstrating the cause-and-effect pattern. A "Test 1" badge glows softly below.

**Step 3: Multi-Round Interaction (3–5 rounds)**

**Round 1: The Morning Sun** *(Simple, obvious — build confidence)*

> **AI says**: "*(bright narrator tone)* Experiment number one! Imagine... it is early morning. The sun peeks over the houses. Warm golden light lands on the sunflower. What does the sunflower do?"
>
> **Possible child responses**:
> 1. (Ideal) "It turns to the sun!" / "It looks at the sun!" / "It opens up!"
> 2. (Unexpected) "It is happy!" / "It says good morning!" / An emotional response rather than behavioral.
> 3. (No response) Child is quiet or looking at the photo.
>
> **AI follow-up**:
> 1. "*(impressed scientist voice)* Experiment SOLVED! The young sunflower turns its head to face the sun — slowly, slowly, following the light across the sky! The sunshine CAUSES the flower to turn. Like it is watching the sun! Great science!"
> 2. "*(warm validation)* Ooh, happy — yes! It loves the sun! And when the sun comes up, the sunflower slowly turns its head to face it — like saying good morning back! The sun CAUSES the flower to move. Great thinking, Scientist!"
> 3. *(waits 2 seconds)* "*(helpful, encouraging)* Here is a clue — the sunflower really likes sunshine. When the sun is over THERE... does the sunflower look this way or that way?"
>
> **Screen**: Animation shows the sunflower with a sunrise behind houses on the horizon. When the child answers (or after AI follow-up), the sunflower illustration slowly turns its head toward the sun with gentle swooping motion lines. A small "TEST 1 ✓" stamp appears in the corner. A golden star sparkles beside it.

**Round 2: The Rainy Week** *(Contrasting scenario — introduces a different cause)*

> **AI says**: "*(slightly dramatic whisper)* Experiment number two! What if... it rains and rains for a WHOLE week. Water soaks into the dirt around the sunflower. The roots drink and drink. What happens to the sunflower?"
>
> **Possible child responses**:
> 1. (Ideal) "It grows taller!" / "It gets bigger!" / "The stem gets strong!"
> 2. (Unexpected) "It gets wet!" / "It is sad!" / "The petals fall off!"
> 3. (No response) Child is quiet, possibly unsure.
>
> **AI follow-up**:
> 1. "*(excited reveal)* YES! It grows taller and taller — that thick stem pushes up like a strong green straw! The water CAUSES the roots to feed the plant, and up it goes! You really think like a scientist!"
> 2. "*(gentle, validating)* It does get wet! And guess what — the sunflower actually LIKES the water. The roots spread out underground and drink it up. Then the thick stem grows even taller and stronger. Lots of rain CAUSES the sunflower to grow! Pretty cool, right?"
> 3. *(waits 2 seconds)* "*(playful hint)* Think about it — the roots are drinking all that water. What happens when a plant gets lots to drink? Does it get smaller... or bigger?"
>
> **Screen**: The sunflower illustration is centered with rain clouds above. Blue raindrops fall gently. Underground, a simple root system glows as it absorbs water. The sunflower stem stretches taller with gentle upward animation. "TEST 2 ✓" stamp appears. The contrast between the turning Round 1 flower and the growing Round 2 flower is visually clear.

**Round 3: The Visiting Bee** *(Surprising, fun — peak engagement)*

> **AI says**: "*(curious, playful tone)* Experiment number three — this one is buzzy! What if... a fuzzy little bee flies over and lands right on the sunflower's brown middle. The bee wiggles around in there. What happens?"
>
> **Possible child responses**:
> 1. (Ideal) "The bee eats the nectar!" / "It gets pollen on it!" / "The bee helps the flower!"
> 2. (Unexpected) "The bee stings it!" / "Buzz buzz!" / "I am scared of bees!"
> 3. (No response) Child is thinking or distracted.
>
> **AI follow-up**:
> 1. "*(thrilled)* Amazing guess! The bee sips sweet nectar from the tiny flowers in the middle — yum! And sticky pollen gets all over the bee's fuzzy legs. Then the bee flies to ANOTHER sunflower and shares the pollen. The bee visiting CAUSES the sunflower to make new seeds! They help each other!"
> 2. "*(validating warmly)* Buzz buzz is right — the bee is busy! But it is not there to sting. The bee sips sweet nectar — like juice — from the brown middle. And sticky pollen gets on its fuzzy legs! Then it carries the pollen to another flower. The bee CAUSES the sunflower to make seeds. They are a team!"
> 3. *(waits 2 seconds)* "*(enticing whisper)* The bee landed right in the brown middle — where all those tiny seeds are. Is the bee there to hurt the flower... or to eat something yummy?"
>
> **Screen**: Sunflower illustration with a cute animated bee flying in and landing on the bumpy brown center. The bee wiggles, and tiny yellow pollen dots stick to its legs. A dotted trail shows the bee flying off to another small sunflower in the corner. A question mark floats above, then turns into a "!" when the connection is revealed. "TEST 3 ✓" stamp appears with an extra sparkle effect.

**Round 4 (if child is engaged): The Dark Night** *(Open-ended — chain reaction thinking)*

> **AI says**: "*(soft, wondering tone)* Bonus experiment! What if... winter comes. The days get short and cold. There is not much sun. What happens to the sunflower now?"
>
> **Possible child responses**:
> 1. (Ideal) "It droops!" / "It dies." / "The petals fall off." / "It drops seeds."
> 2. (Unexpected) "It is cold!" / "It goes to sleep!" / "Put a blanket on it!"
> 3. (No response) Child may be getting tired or losing focus.
>
> **AI follow-up**:
> 1. "*(gentle, impressed)* That is exactly right! When the cold comes and there is not enough sun, the sunflower droops and dries up. BUT — here is the amazing part — it drops all its seeds on the ground. And next year, those seeds can grow into NEW sunflowers! The cold CAUSES the flower to stop, but the seeds start everything over again. That is a cycle!"
> 2. "*(validating warmly)* Aw, that is a sweet idea — a blanket! The sunflower does get cold. It droops down and gets dry. But it leaves behind seeds in the brown middle. And those seeds can grow into brand new sunflowers next summer! The cold CAUSES an ending — but also a new beginning!"
> 3. *(waits 2 seconds)* "*(cozy whisper)* This is the trickiest one. No sunshine, cold weather... the sunflower gets tired and droopy. But it leaves a surprise behind — seeds! Seeds that can grow again."
>
> **Screen**: The sunflower illustration dims gradually — the background turns to cool gray and blue. Leaves curl down, petals droop. Then tiny seeds drop from the brown center and glow golden on the ground below. A small green sprout peeks up from one seed. "BONUS TEST ✓" stamp glows faintly in gold.

**Step 4: Celebration + Role Title**

> **AI says**: "*(proud, warm celebration)* WOW! You solved every experiment! You figured out what makes a sunflower turn, grow, share with bees, and drop its seeds. You are officially a... SUNFLOWER SCIENTIST! You watched, you guessed, and you were RIGHT. That is some seriously smart science!"
>
> **Possible child responses**:
> 1. (Ideal) "Yay!" / "I'm a scientist!" / Giggles or cheers.
> 2. (Unexpected) "Can we play again?" / "I want to plant a sunflower!" / "Bees are cool!"
> 3. (No response) Child smiles or looks pleased.
>
> **AI follow-up**:
> 1. "*(beaming)* The BEST Sunflower Scientist! I bet sunflowers everywhere would love to have you in their garden."
> 2. "*(delighted)* You want to keep going? That means you are a REAL scientist — always curious! We can play again another day. For now, let me tell you something amazing about what you just did..."
> 3. *(waits 2 seconds)* "*(warm whisper)* You know what? I think even the sunflower would be impressed. You really understand how plants work."
>
> **Screen**: A golden lab-badge animation fills the center of the screen with the text "SUNFLOWER SCIENTIST" in bold, playful letters. The sunflower photo appears inside the badge like a portrait. Confetti bursts outward in yellow and green. A cheerful chime sound plays.

**Step 5: Closing + IB Concepts**

> **AI says**: "*(warm, reflective pride)* You know what you did today? Every time I said something happened — sunshine, rain, a buzzy bee, cold winter — you figured out what the sunflower would DO. That is called Causation — when one thing CAUSES another thing to happen. And you saw how the sunflower goes from a tiny seed to a tall flower to dropping new seeds again. That is called Change — how things grow and transform over time! You are not just a scientist. You are a sunflower expert."
>
> **Possible child responses**:
> 1. (Ideal) "Causation!" / "I'm an expert!" / Repeats a word happily.
> 2. (Unexpected) "Can I grow a sunflower?" / "Bye sunflower!"
> 3. (No response) Child listens or looks at the screen.
>
> **AI follow-up**:
> 1. "*(celebrating)* That is right — Causation and Change! You earned your badge, Sunflower Scientist. Maybe next time you see a real sunflower, you will know exactly what is happening!"
> 2. "*(warm, laughing)* Growing a sunflower would be the BEST experiment! You already know what it needs — sun, rain, and bees. See you next time, Sunflower Scientist!"
> 3. *(waits 2 seconds)* "*(gentle closing)* Great job today, Scientist. The sunflower world has a really smart new friend. See you next time!"
>
> **Screen**: The scientist badge remains centered. Below it, the words **"Causation"** and **"Change"** appear one at a time in elegant, golden lettering — each word accompanied by a small icon (a sun-and-arrow for Causation, a sprouting seed for Change). The sunflower photo glows warmly behind the text. Soft sparkle animations surround the concept words. After 3 seconds, a gentle "The End" ribbon scrolls across the bottom.

---

## Self-Evaluation Scorecard

| # | Dimension | Score | Notes |
|---|-----------|-------|-------|
| 1 | V1 Technical Compliance | PASS | No OCR, face detection, IMU, state comparison, or non-speech audio detection required. All verification is dialogue-based — child self-reports predictions verbally. |
| 2 | Hook Rule Compliance | PASS | Both Step 1a (warm) and Step 1b (cold) open with emotional resonance and wonder ("bright yellow petals like sunshine rays," "look at all those petals"), not knowledge testing. |
| 3 | Transition Naturalness | PASS | The activity grows organically from marveling at the sunflower's features into predicting its reactions. Remove step labels and it reads as a flowing conversation. |
| 4 | Edge Case Coverage | PASS | Every step includes 3 response branches (ideal, unexpected, silence). All unexpected branches validate before redirecting. All silence branches wait 2 seconds then offer a gentle prompt. |
| 5 | IB Completeness | PASS | Causation and Change are explicitly named in closing as praise. KUD is specific with concrete vocabulary (petals, seeds, stem, nectar, pollen, roots). 3 ATL skills identified with sub-skills. 4 Related Concepts listed (2 from mapping). Closing celebrates first, then naturally names concepts. Concepts are earned — child actually predicted causes and observed changes. |
| 6 | Tier Appropriateness | PASS | T1: Sentences 5–8 words predominant. Open-ended prediction questions used. Vocabulary is concrete (turn, grow, drink, buzz, droop). 2–3 step reasoning tasks. Age 4–6 appropriate complexity throughout. |
| 7 | Dialogue Specificity | PASS | Every AI line is concrete dialogue with tone markers. Zero instances of "AI guides" or "AI encourages." All responses are warm, playful, child-appropriate. |
| 8 | Screen & UI Completeness | PASS | Every step has specific screen descriptions with layout, animations (sunrise turning, raindrops, bee wiggling, seeds dropping, sprout growing), and visual elements (scientist badge, test stamps, concept words with icons). |
| 9 | Entity Mapping Alignment | PASS | Key Concepts: Causation (secondary, relevance=0.9) + Change (primary, relevance=1.1) — both high-relevance, avoids Form+Connection default. IB Theme: How the World Works (primary, weight=0.46). Related Concepts: Growth + Interdependence from mapping, Cycles + Discovery designed. Vocabulary grounded in tier_1 mapping: "long skinny petals like sunny little rays," "tiny seeds packed in swirly circle patterns," "a thick stem like a strong green straw," "young heads can turn to face the sun," "giving nectar and pollen to busy bees," "roots spread out to hold the tall plant steady." Warm start references function/sun_tracking dimension using Discovery opener flavor. Anchor dimensions: emotions + relationship (engagement) + function (physical). |

**Overall**: ALL PASS — 0 issues found during self-evaluation

Ready for 教研 review.
