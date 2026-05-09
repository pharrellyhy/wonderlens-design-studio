## The Lion's Big Show

### A. Basic Info

| Field | Value |
|-------|-------|
| Activity Name | The Lion's Big Show |
| Activity Category | Sustained Verbal Interaction (In-Device) |
| Recommended Tier | T0 (ages 2–4) |
| Core IB Key Concepts | Perspective, Form |
| Related Concepts | Expression, Identity, Creativity, Discovery |
| ATL Skills Focus | Communication Skills (expressing, listening), Thinking Skills (creative), Self-Management Skills (emotional regulation) |
| Experience Pillar | Performance |
| Game Style | voice_stage |
| Design Version | 2.0 |
| Last Updated | 2026-04-01 |

### A.1 Entity Attributes Covered

Attribute IDs from `MAPPING_ROOT/animals/big_cats.yaml` `tier_guidance` that this activity exercises. Consumed by the upstream matcher to route photographed entities to this game.

```yaml
entity_attributes_covered:
  - tier_0.appearance.covering
  - tier_0.appearance.body_size
  - tier_0.senses.sound
  - tier_1.appearance.mane_look
  - tier_1.function.communication_roar
```

### A.2 Constellation Adaptation Notes

Recipe for running this activity when the photographed entity is a constellation
neighbor of Lion (e.g., cat, kitten, tiger, leopard, stuffed lion) instead of a
lion itself. The neighbor list, bridge type, and initial bridge prompt live in
`data/constellation_map.yaml` under `mapped_entity: lion` — this section
describes how The Lion's Big Show adapts mechanically for a bridged entity.

**Preserve** — must not change across neighbors:
- The talent-show frame and the three jungle judges (parrot, monkey, elephant) — the magic moment's standing ovation depends on this character cast.
- The escalation from a greeting-roar to a lullaby-roar to a whisper-roar (same vocal-variety arc; only the sound itself changes).
- The child's role_title "Roar Star" — keep the cat-family fierceness framing even when the neighbor is smaller or cuddlier.

**Swap** — re-phrase for the bridged entity:
- Round 1 prompt "Do your biggest, loudest roar!" → neighbor's most recognizable sound (cat's "meow!", tiger's "grrr!", stuffed lion's "rawr!"). Keep the superlative framing ("biggest, loudest…").
- Habitat references from "jungle" → neighbor-appropriate context (cat: "your living room stage"; tiger: "the big cats' arena"; stuffed lion: "the toy shelf stage"). The judges stay the same.
- Magic-moment line "Even the jungle trees are cheering!" → swap tree imagery to match the neighbor's setting while keeping the "audience explodes" spirit.

**Watch** — gotchas to avoid:
- If the neighbor is a stuffed toy (e.g., stuffed_lion), the child's performance is FOR the toy as audience-plus-performer — don't force the toy to roar, have the child narrate while holding it.
- Kittens and quiet cats may not vocalize loudly in real life — reframe "loud" as "most confident" or "most expressive" so a child with a quiet cat doesn't feel their entity is "wrong".
- Never drop Performance pillar — if the neighbor doesn't offer vocal range (e.g., a silent plushie), pivot to sound-imitation rather than abandoning sound entirely.

### B. Activity Overview

**① Brief Description**: The child becomes a "Roar Star" who performs AS the lion in front of a silly audience of jungle judges (a parrot, a monkey, and an elephant). Each round, the AI sets a performance challenge — roar a greeting, roar a lullaby, do a tiny whisper-roar — and the audience of judges reacts with over-the-top delight, gasps, or laughter. The challenges escalate with a surprise twist, and the finale is a standing ovation where every judge goes wild.

**② Educational Purpose (KUD)**:
- **K (Know)**: Lions have a big fuzzy mane; lions make a loud roaring sound; a roar can say different things — hello, goodnight, surprise; lions are very big cats; the word "audience" means people (or animals!) watching a show
- **U (Understand)**: The same lion can roar in many different ways depending on the situation — happy, sleepy, surprised — and each way feels different to the audience; that is Perspective. The lion has a recognizable Form — big mane, strong body, loud voice — and the child uses that form to create expressive performances.
- **D (Do)**: Express emotions through voice and sound in escalating challenges; listen to performance prompts and respond creatively with vocal variety; adapt performance style when a surprise twist changes the rules

**③ Design Highlight**: The "Jungle Talent Show" metaphor transforms voice play into a PERFORMANCE with real stakes. Three silly jungle judges (Parrot, Monkey, Elephant) react to every roar with over-the-top audience responses — "The parrot fell off the branch!" or "The monkey is doing a happy dance!" This is NOT simple voice acting. Here, there is an AUDIENCE who reacts, creating the feeling of "They loved it!" A surprise twist in Round 3 ("Now do it WHISPERING!") adds genuine challenge and delight.

**④ Typical Scenario**: A 2–4 year old photographs their toy lion. AI marvels at the mane and introduces the Jungle Talent Show: three silly judges are waiting for the lion's performance. The child performs as the lion in escalating challenges while the audience of judges reacts with increasing excitement, culminating in a standing ovation.

### C. Interaction Flow

> Recommended Tier: T0 (ages 2–4)

#### Step 1: Transition Bridge

**AI says:** [delighted gasp] "Whoa! A LION! Big fuzzy mane! I bet this lion has the BIGGEST roar. Show me? What does your lion sound like?"

**Child responses:**

1. (Ideal) "RRRR!" or "RAWR!" — child roars enthusiastically.
2. (Unexpected) "It's my toy!" or "That's Leo!" or "It's soft!"
3. (No response) Child stares at the screen or touches the toy lion.

**AI follow-up:**

1. [amazed] "WOW! So loud! I think some jungle friends heard that roar. They want MORE! Want to put on a BIG show?"
2. [warm, excited] "Your lion! So fuzzy! I bet it has a big roar hiding inside. Want to help it do a BIG show? Some silly judges want to hear it!"
3. [wait 2s] [playful whisper] "Psst... I think your lion wants to say RRRR! Can you help? Some jungle friends are waiting!"

**Screen:** Lion photo centered with golden savanna-grass framing, soft sparkles around the mane, and three small animal silhouettes (parrot, monkey, elephant) peeking in from the right edge.

#### Step 2: Rule Introduction + Demo

**AI says:** [excited announcer] "Welcome to the Jungle Talent Show! Three judges here! Parrot... Monkey... and big Elephant! They want YOUR lion roar! I tell you HOW to roar. You roar! Judges go CRAZY! Watch — lion says HELLO! RRRR! Ohhh! Parrot fell off the branch! Ha! Your turn now!"

**Child responses:**

1. (Ideal) Child laughs, says "OK!" or roars "RRRR!" eagerly.
2. (Unexpected) "What's a judge?" or "I want monkey!" or child giggles.
3. (No response) Child watches quietly with interest.

**AI follow-up:**

1. [cheering] "YES! Here comes Round One! Judges are ready! Parrot is on her branch. Monkey has popcorn. Elephant has big ears open. Let's GO!"
2. [warm, playful] "Judges are silly friends watching the show! Monkey loves it! Ready? You roar, judges go WOW! Here comes Round One!"
3. [wait 2s] [encouraging] "It's easy! Just roar when I say! Judges love EVERY roar! Ready? Here comes the first one!"

**Screen:** "JUNGLE TALENT SHOW" banner in jungle-leaf lettering; lion photo on a small stage at center-left; three cartoon judge characters (parrot on branch, monkey with popcorn, elephant with big ears) on the right; "Round 1" star badge in corner.

#### Step 3: Multi-Round Interaction

**Round 1 — "The Happy Hello Roar":**

**AI says:** [bright announcer] "Round One! Sun is up! Lion is happy! Show the judges your HAPPIEST roar! Ready? GO!"

**Child responses:**

1. (Ideal) "RRRR!" or "RAWR!" or "Hiiiii!" — child roars or shouts happily.
2. (Unexpected) "Meow!" or a silly sound, or "I'm a cat!"
3. (No response) Child is quiet or shy.

**AI follow-up:**

1. [audience goes wild] "OHHH! Parrot fell off the branch — AGAIN! Monkey is jumping up and down! Elephant flapped his ears SO hard the popcorn flew! They LOVED that happy roar! BIG gold star!"
2. [delighted, laughing] "Meow?! Ha! The judges LOVE surprises! Parrot is giggling so hard she's spinning! Monkey says 'Do it again!' Even the elephant is smiling! Gold star for the surprise sound!"
3. [wait 2s] [gentle] "Even a tiny roar counts! Try a little one... rrrr? The judges are waiting with their big silly faces!"

**Screen:** Stage spotlight on lion photo with golden sun animation; parrot tumbles off branch, monkey bounces with popcorn flying, elephant flaps ears; gold star stamps in the score area.

**Round 2 — "The Sleepy Lullaby Roar":**

**AI says:** [soft, dreamy narrator] "Round Two! Night time! Moon is out. Lion is sooo sleepy. Can you do a sleeeepy roar? Soft and slow... like a lullaby. Ready? Go!"

**Child responses:**

1. (Ideal) "Rrrrr..." or "Shhh... rrrr" — child does a quiet, drawn-out roar.
2. (Unexpected) "RRRR!" — child does a loud roar instead, or says "Night night!"
3. (No response) Child is quiet or processing.

**AI follow-up:**

1. [hushed, amazed] "Ohhh... look! Parrot's eyes are closing. Monkey put down the popcorn and is yawning. Elephant is swaying... back and forth... back and forth. Your sleepy roar made the WHOLE audience almost fall asleep! That was beautiful! Second gold star!"
2. [laughing quietly] "A BIG roar! Ha! The judges jumped awake! Monkey spilled the popcorn everywhere! That wasn't sleepy, but the judges LOVED the surprise! Elephant says 'Whoa! Wide awake now!' Star for the wake-up call!"
3. [wait 2s] [gentle, modeling] "Try it like this... rrrrrr... nice and soft, like you're tucking the lion in. Even a tiny whisper counts. The judges have their blankets ready!"

**Screen:** Stage dims to moonlit blue-purple tones; a crescent moon rises behind the lion photo. If child responds softly, parrot droops on branch with half-closed eyes, monkey yawns with popcorn lowered, and elephant sways gently. If child roars loudly, judges startle awake comically. Second gold star stamps in and "Round 2 COMPLETE" appears in soft starlight letters.

**Round 3 — "The SURPRISE Whisper-Roar!" (Twist Challenge):**

**AI says:** [dramatic, conspiratorial whisper] "Round Three! SURPRISE CHALLENGE! The judges say... can the lion do a WHISPER roar? Shhh! The tiniest, quietest, most secret roar EVER! This is the HARDEST one! Nobody thinks you can do it! Can you? Shhhh... GO!"

**Child responses:**

1. (Ideal) "...rrrr..." or "psst... rawr" — child attempts a whisper roar.
2. (Unexpected) "RRRR!" — child does a big roar instead, laughs, or says "I can't whisper!"
3. (No response) Child giggles, covers mouth, or is quiet.

**AI follow-up:**

1. [absolutely stunned, building to explosion] "Wait... did you hear that? Parrot leaned in... Monkey leaned in... Elephant put his GIANT ear right up close... and... THEY HEARD IT! A WHISPER ROAR! The crowd is going BANANAS! Monkey is doing backflips! Parrot is screeching 'ENCORE! ENCORE!' Elephant STOMPED so hard the whole jungle shook! Nobody thought it was possible! THIRD GOLD STAR!"
2. [delighted, amazed] "You did a BIG roar instead! And guess what? The judges LOVED the surprise! Parrot says 'That's NOT a whisper — that's a SUPER roar!' Monkey fell over laughing! The elephant says 'My ears are still ringing!' They give you the star for being BRAVE! Gold star number three!"
3. [wait 2s] [encouraging whisper] "The quiet... IS the whisper roar! Even silence can be a performance! Parrot is leaning in so close she almost fell off again! Try a teensy tiny one? Even just... 'rr'?"

**Screen:** Stage goes dramatic with a single spotlight narrowed on the lion photo. "SURPRISE CHALLENGE" banner flashes in bold red-gold letters. If child whispers, judges lean forward in exaggerated poses, then explode into celebration: confetti burst, parrot spirals, monkey backflips, elephant trumpets with trunk up. Third gold star stamps in with extra sparkle and "Round 3 COMPLETE — ALL STARS!" flashes.

#### Step 4: Celebration

**AI says:** [announcer crescendo] "Three rounds! Three gold stars! ALL the judges are standing up! Parrot flying in circles — 'BRAVO! BRAVO!' Monkey throwing popcorn like confetti! Elephant TRUMPETING so loud the trees are shaking! STANDING OVATION! You are the ROAR STAR!"

**Child responses:**

1. (Ideal) Child roars triumphantly, giggles, claps, or says "Yay! I did it!"
2. (Unexpected) "Again! More!" or "Encore!"
3. (No response) Child beams or watches the celebration animation with delight.

**AI follow-up:**

1. [overjoyed] "The BEST Roar Star the jungle has EVER seen! Every judge says you win! Parrot wants your autograph!"
2. [thrilled] "ENCORE? The judges are SO happy! They say 'come back anytime!' You can roar for them again another day, Roar Star!"
3. [wait 2s] [warm] "Look at that big smile! The judges see it too. Parrot says 'That smile is the best encore!' You are a real Roar Star!"

**Screen:** Full celebration — confetti rain, parrot spiraling with rainbow sparkles, monkey throwing popcorn confetti, elephant raising trunk with golden trumpet-blast rays; large golden "ROAR STAR" badge descends with lion photo framed inside, three gold stars underneath.

#### Step 5: Closing + IB Concepts

**AI says:** [warm, reflective] "Wow, Roar Star. One lion, SO many roars! Happy roar, sleepy roar, whisper roar — every one different! Same lion, different feelings. That's Perspective! And the big mane, loud voice, fuzzy shape — that's what makes a lion a lion. That's Form! You are the Roar Star of the Jungle Talent Show!"

**Child responses:**

1. (Ideal) Child roars one more time, says "Bye lion!" or "I'm a Roar Star!"
2. (Unexpected) "What's perspective?" or "I want to be a monkey!"
3. (No response) Child watches the screen, content.

**AI follow-up:**

1. [warm, proud] "RRRR! That's lion saying 'Thank you, Roar Star!' Bye bye! The judges are waving!"
2. [warm, simple] "Perspective means same lion, different roars — that's what YOU showed! Monkeys are fun too — maybe next time! Bye, Roar Star!"
3. [wait 2s] [soft, closing] "The judges are waving goodbye. Parrot says 'See you next time!' Bye bye, Roar Star. RRRR!"

**Screen:** Lion photo at center with "Perspective" (speech-bubble icon) and "Form" (lion-silhouette icon) in jungle-leaf lettering; "ROAR STAR" badge with three gold stars in the corner; three judges waving; warm golden savanna sunset fade.
