import assert from "node:assert/strict";
import { test } from "node:test";

import type { ActivityBundle } from "@/lib/activity-bundle-schema";
import type { ImportedBundleResult } from "@/lib/bundle-import";
import type { DialogueBlock, RubricScores, Step } from "@/lib/design-schema";
import { useDesignStore } from "./design-store";

const RUBRIC: RubricScores = {
  d1: "pass",
  d2: "pass",
  d3: "pass",
  d4: "pass",
  d5: "pass",
  d6: "pass",
  d7: "pass",
  d8: "pass",
  d9: "pass",
  d10: "pass",
};

function importedResult(activityId: string): ImportedBundleResult {
  return {
    bundle: { activityId } as ActivityBundle,
    rubricScores: RUBRIC,
    rubricEvaluated: true,
    sourceFormat: "zip",
  };
}

const dialogue: DialogueBlock = {
  aiSays: "Look here.",
  childResponses: {
    ideal: "I see it.",
    unexpected: "Maybe this one.",
    silent: "...",
  },
  aiFollowUps: {
    ideal: "Exactly.",
    unexpected: "Let's check together.",
    silent: "Take your time.",
  },
  screenDescription: "A focused scene.",
};

function bundleWithSteps(steps: Step[]): ActivityBundle {
  return {
    prod: {
      steps,
    },
  } as ActivityBundle;
}

test("imported bundle batches survive activating one activity", () => {
  useDesignStore.getState().resetSession();
  const batch = [importedResult("first"), importedResult("second")];

  useDesignStore.getState().setImportedBundles(batch);
  useDesignStore.getState().resetSession();
  useDesignStore
    .getState()
    .setActiveBundle(
      "imported-first",
      batch[0].bundle,
      batch[0].rubricScores,
      batch[0].rubricEvaluated,
    );

  assert.deepEqual(
    useDesignStore
      .getState()
      .importedBundles.map((result) => result.bundle.activityId),
    ["first", "second"],
  );
});

test("addBridgeVariant creates a missing warm start without replacing cold start", () => {
  useDesignStore.getState().resetSession();
  useDesignStore
    .getState()
    .setActiveBundle(
      "bridge-test",
      bundleWithSteps([
        {
          stepNumber: 1,
          title: "Transition Bridge",
          type: "bridge",
          coldStart: dialogue,
        },
      ]),
      RUBRIC,
    );

  useDesignStore.getState().addBridgeVariant(0, "warmStart");

  const step = useDesignStore.getState().activeBundle?.prod.steps[0];
  assert.equal(step?.type, "bridge");
  assert.deepEqual(step?.coldStart, dialogue);
  assert.deepEqual(step?.warmStart, {
    aiSays: "",
    childResponses: { ideal: "", unexpected: "", silent: "" },
    aiFollowUps: { ideal: "", unexpected: "", silent: "" },
    screenDescription: "",
  });
});

test("addRound appends after the highest parsed round number", () => {
  useDesignStore.getState().resetSession();
  useDesignStore
    .getState()
    .setActiveBundle(
      "round-test",
      bundleWithSteps([
        {
          stepNumber: 3,
          title: "Multi-Round Exploration",
          type: "rounds",
          rounds: [
            { roundNumber: 1, dialogue },
            { roundNumber: 4, dialogue },
          ],
        },
      ]),
      RUBRIC,
    );

  useDesignStore.getState().addRound(0);

  const rounds = useDesignStore.getState().activeBundle?.prod.steps[0].rounds;
  assert.deepEqual(
    rounds?.map((round) => round.roundNumber),
    [1, 4, 5],
  );
  assert.deepEqual(rounds?.at(-1)?.dialogue, {
    aiSays: "",
    childResponses: { ideal: "", unexpected: "", silent: "" },
    aiFollowUps: { ideal: "", unexpected: "", silent: "" },
    screenDescription: "",
  });
});
