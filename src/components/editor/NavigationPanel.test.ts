import assert from "node:assert/strict";
import { test } from "node:test";

import type { ActivityBundle } from "@/lib/activity-bundle-schema";
import type { DialogueBlock, Step } from "@/lib/design-schema";
import { buildNavigationSections } from "./NavigationPanel";

const dialogue: DialogueBlock = {
  aiSays: "",
  childResponses: { ideal: "", unexpected: "", silent: "" },
  aiFollowUps: { ideal: "", unexpected: "", silent: "" },
  screenDescription: "",
};

function bundleWithSteps(steps: Step[]): ActivityBundle {
  return {
    prod: {
      basicInfo: {
        activityName: "Parsed Activity",
        activityCategory: "cat5",
        recommendedTier: "T1",
        gameStyle: "quest_collector",
      },
      steps,
    },
    tagBlock: {
      game_style: "quest_collector",
    },
  } as ActivityBundle;
}

test("navigation sections reflect parsed bridge variants and round count", () => {
  const sections = buildNavigationSections(
    bundleWithSteps([
      {
        stepNumber: 1,
        title: "Transition Bridge -- Cold Start",
        type: "bridge",
        coldStart: dialogue,
      },
      {
        stepNumber: 3,
        title: "Multi-Round Exploration (3 rounds)",
        type: "rounds",
        rounds: [
          { roundNumber: 1, dialogue },
          { roundNumber: 4, dialogue },
        ],
      },
    ]),
  );

  assert.equal(
    sections.some((section) => section.id === "step-1-warm"),
    false,
  );
  assert.equal(
    sections.some((section) => section.id === "step-1-cold"),
    true,
  );
  assert.equal(
    sections.find((section) => section.id === "step-3")?.label,
    "Step 3: Multi-Round Exploration (2 rounds)",
  );
  assert.deepEqual(
    sections
      .filter((section) => section.id.startsWith("step-3-round-"))
      .map((section) => section.label),
    ["Round 1", "Round 4"],
  );
});
