import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { readdirSync } from "node:fs";
import { test } from "node:test";

import {
  importDesignFromFileText,
  type ImportedDesignResult,
} from "./design-import";

const MINIMAL_SPEC_MARKDOWN = `# Activity Design: Sunflower + Category 1

## Activity: Sunny What-Happens-Next

### A. Basic Info

- **Activity Name**: Sunny What-Happens-Next
- **Activity Category**: 1 -- Sustained Verbal Interaction
- **Recommended Tier**: T1 (ages 4-6)
- **Core IB Key Concepts**: Causation & Change
- **Related Concepts (Discipline)**: Growth, Interdependence
- **ATL Skills Focus**: Thinking Skills, Communication Skills
- **Game Style**: prediction_game
- **Trigger Entity**: Sunflower
- **Trigger Scene**: Child photographs a sunflower picture
- **Mapping Source**: plants_sunflower
- **IB Theme**: How the World Works
- **Dimension Anchors**: emotions, function
- **Conversation Anchor Dimensions**: function -- sun_tracking

### B. Activity Overview

- **1 Brief Description**: The child predicts how a sunflower reacts to sun, rain, and bees.
- **2 Educational Purpose (KUD)**:
  - **K (Know)**: Sunflowers have petals, seeds, roots, and stems.
  - **U (Understand)**: Sunlight and rain cause sunflowers to grow and change.
  - **D (Do)**: Predict plant responses and explain observations.
- **3 Design Highlight**: The activity feels like a sunflower lab.
- **4 Typical Scenario**: Child sees a sunflower and starts guessing what happens next.

### C. Interaction Flow -- Detailed Design [Target Tier: T1]

**Step 1a: Transition Bridge -- Warm Start**

> **AI says**: "[warm] You noticed the sunflower turns to the sun. Want to guess what happens next?"
>
> **Possible child responses**:
> 1. (Ideal) "Yes!"
> 2. (Unexpected) "It is yellow."
> 3. (No response) Child is quiet.
>
> **AI follow-up**:
> 1. "[excited] Great, scientist!"
> 2. "[warm] Yellow is a great detail. Let's use that clue."
> 3. "[gentle] I can help you start."
>
> **Screen**: Sunflower photo glows.

**Step 1b: Transition Bridge -- Cold Start**

> **AI says**: "[delighted] Oh, a sunflower! What might it do in the sun?"
>
> **Possible child responses**:
> 1. (Ideal) "Grow!"
> 2. (Unexpected) "Pretty!"
> 3. (No response) Child is quiet.
>
> **AI follow-up**:
> 1. "[warm] Yes, it can grow."
> 2. "[warm] It is pretty, and it can change too."
> 3. "[gentle] Let's try one guess."
>
> **Screen**: Sunflower appears with sunshine.

**Step 2: Rule Introduction**

> **AI says**: "[playful] I tell you what happens, and you guess what the sunflower does."
>
> **Possible child responses**:
> 1. (Ideal) "Ready!"
> 2. (Unexpected) "I water plants."
> 3. (No response) Child is quiet.
>
> **AI follow-up**:
> 1. "[excited] First experiment!"
> 2. "[warm] Water helps plants. That is useful."
> 3. "[gentle] I will make it easy."
>
> **Screen**: A simple lab badge appears.

**Step 3: Multi-Round Interaction**

**Round 1: The Morning Sun**

> **AI says**: "[bright] Morning sun shines on the sunflower. What does it do?"
>
> **Possible child responses**:
> 1. (Ideal) "It turns!"
> 2. (Unexpected) "It is happy."
> 3. (No response) Child is quiet.
>
> **AI follow-up**:
> 1. "[proud] Yes, it turns toward light."
> 2. "[warm] Happy fits. It also turns."
> 3. "[gentle] It likes looking toward light."
>
> **Screen**: The sunflower turns toward the sun.

**Step 4: Celebration**

> **AI says**: "[proud] You solved the sunflower experiments."
>
> **Possible child responses**:
> 1. (Ideal) "Yay!"
> 2. (Unexpected) "Again!"
> 3. (No response) Child smiles.
>
> **AI follow-up**:
> 1. "[happy] Great science."
> 2. "[warm] Curious scientists ask again."
> 3. "[gentle] You did it."
>
> **Screen**: A scientist badge appears.

**Step 5: Closing + IB Concepts**

> **AI says**: "[warm] You saw Causation and Change with the sunflower."
>
> **Possible child responses**:
> 1. (Ideal) "Causation!"
> 2. (Unexpected) "Bye!"
> 3. (No response) Child listens.
>
> **AI follow-up**:
> 1. "[celebrating] Yes, Causation and Change."
> 2. "[warm] Bye, sunflower scientist."
> 3. "[gentle] See you next time."
>
> **Screen**: Causation and Change appear.

## Self-Evaluation Scorecard

| # | Dimension | Score | Notes |
| 1 | V1 Technical Compliance | PASS | OK |
| 2 | Hook Rule Compliance | FAIL | Needs a stronger hook |
`;

test("imports WonderLens markdown into a reviewable GameDesign", () => {
  const result = importDesignFromFileText(
    "sunflower_cat1_spec.md",
    MINIMAL_SPEC_MARKDOWN,
  );

  assert.equal(result.design.basicInfo.activityName, "Sunny What-Happens-Next");
  assert.equal(result.design.basicInfo.category, "cat1");
  assert.equal(result.design.basicInfo.tier, "T1");
  assert.equal(result.design.basicInfo.gameStyle, "prediction_lab");
  assert.equal(result.design.basicInfo.experiencePillar, "discovery");
  assert.equal(result.design.steps[0].warmStart?.aiSays.startsWith("[warm]"), true);
  assert.equal(result.design.steps[2].rounds?.[0].dialogue.aiSays.includes("Morning sun"), true);
  assert.equal(result.rubricScores.d1, "pass");
  assert.equal(result.rubricScores.d2, "fail");
  assert.equal(result.rubricScores.d10, "fail");
});

test("imports structured GameDesign JSON without rewriting it", () => {
  const first = importDesignFromFileText(
    "sunflower_cat1_spec.md",
    MINIMAL_SPEC_MARKDOWN,
  );
  const encoded = JSON.stringify(first.design);

  const second: ImportedDesignResult = importDesignFromFileText(
    "sunflower.json",
    encoded,
  );

  assert.deepEqual(second.design, first.design);
  assert.equal(second.rubricScores.d1, "fail");
  assert.equal(second.rubricScores.d10, "fail");
});

const REAL_MARKDOWN_FIXTURES = [
  {
    path: "designs/cat1/sunflower_cat1_spec.md",
    expectedCategory: "cat1",
    expectedName: "Sunny What-Happens-Next (向日葵猜猜看)",
  },
  {
    path: "designs/cat5/playground_cat5_spec.md",
    expectedCategory: "cat5",
    expectedName: "The Playground Job Fair",
  },
  {
    path: "designs/cat1/firefighter_cat1_prod.md",
    expectedCategory: "cat1",
    expectedName: "Helper Hotline",
  },
  {
    path: "designs/cat5/sunflower_cat5_prod.md",
    expectedCategory: "cat5",
    expectedName: "The Sunshine Parts Patrol",
  },
] as const;

for (const fixture of REAL_MARKDOWN_FIXTURES) {
  test(`imports real ${fixture.expectedCategory} markdown fixture ${fixture.path}`, () => {
    const markdown = readFileSync(fixture.path, "utf8");
    const result = importDesignFromFileText(fixture.path, markdown);

    assert.equal(result.sourceFormat, "markdown");
    assert.equal(result.design.basicInfo.activityName, fixture.expectedName);
    assert.equal(result.design.basicInfo.category, fixture.expectedCategory);
    assert.match(result.design.basicInfo.gameStyle, /_/);
    assert.ok(result.design.basicInfo.coreKeyConcepts.length >= 1);
    assert.ok(result.design.overview.briefDescription.length > 20);
    assert.ok(result.design.steps.length >= 5);
    assert.ok(result.design.steps[0].warmStart?.aiSays.length);
    assert.ok(result.design.steps[2].rounds?.[0]?.dialogue.aiSays.length);
    assert.ok(result.design.steps.at(-1)?.dialogue?.aiSays.length);
  });
}

test("imports every markdown fixture under designs/cat1 and designs/cat5", () => {
  const files = ["designs/cat1", "designs/cat5"].flatMap((directory) =>
    readdirSync(directory)
      .filter((fileName) => fileName.endsWith(".md"))
      .map((fileName) => `${directory}/${fileName}`),
  );

  assert.ok(files.length > 0);

  const failures: string[] = [];
  for (const file of files) {
    try {
      const result = importDesignFromFileText(
        file,
        readFileSync(file, "utf8"),
      );
      assert.ok(result.design.basicInfo.activityName.length, "activity name");
      assert.ok(result.design.basicInfo.coreKeyConcepts.length, "key concepts");
      assert.ok(result.design.overview.briefDescription.length, "overview");
      assert.ok(result.design.steps.length >= 5, "five-step flow");
      assert.ok(result.design.steps[0].warmStart?.aiSays.length, "step 1 dialogue");
      assert.ok(
        result.design.steps[2].rounds?.[0]?.dialogue.aiSays.length,
        "round 1 dialogue",
      );
    } catch (error) {
      failures.push(
        `${file}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  assert.deepEqual(failures, []);
});
