import assert from "node:assert/strict";
import { test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

import type { ActivityBundle } from "@/lib/activity-bundle-schema";
import type { ImportedBundleResult } from "@/lib/bundle-import";
import { ReviewConsole } from "./ReviewConsole";

function importedResult(overrides: Partial<ImportedBundleResult> = {}): ImportedBundleResult {
  const bundle = {
    activityId: "asset_rescue_leaf",
    generationMode: "mapping-informed",
    spec: {
      identity: {
        pillar: "Nurture",
        gameStyle: "rescue_team",
        mechanic: "care",
      },
    },
    prod: {
      basicInfo: {
        activityName: "Leaf Rescue Team",
        activityCategory: "cat5",
        recommendedTier: "T1",
        gameStyle: "rescue_team",
      },
      steps: [
        {
          stepNumber: 1,
          title: "Bridge",
          type: "bridge",
          coldStart: {
            aiSays: "This leaf needs help.",
            childResponses: { ideal: "", unexpected: "", silent: "" },
            aiFollowUps: { ideal: "", unexpected: "", silent: "" },
            screenDescription: "Leaf photo beside asset leaf_badge.",
          },
        },
        {
          stepNumber: 3,
          title: "Care Rounds",
          type: "rounds",
          rounds: [
            {
              roundNumber: 1,
              dialogue: {
                aiSays: "Find what the leaf needs.",
                childResponses: { ideal: "", unexpected: "", silent: "" },
                aiFollowUps: { ideal: "", unexpected: "", silent: "" },
                screenDescription: "Need meter fills.",
              },
            },
          ],
        },
      ],
    },
    tagBlock: {
      activity_id: "asset_rescue_leaf",
      pillar: "Nurture",
      game_style: "rescue_team",
      template_type: "cat5",
      category: "plants",
      tier_range: { primary: "T1" },
      activity_signature: {
        mechanic: "care",
        focal_attribute: "leaf_health",
      },
    },
    recap: {
      payloadDefaults: {
        whatWeDid: "cared",
        focalAttribute: { token: "leaf_health" },
      },
    },
    dashboard: {
      session: {
        focalAttribute: "leaf_health",
      },
    },
  } as ActivityBundle;

  return {
    bundle,
    rubricScores: {
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
    },
    rubricEvaluated: true,
    sourceFormat: "files",
    reviewMetadata: {
      adaptation: {
        canonicalMechanic: "care",
        readiness: "blocked_until_product_decision",
        productCapabilityFlags: ["runtime_generated_image"],
        assumptions: ["Needs a prebuilt badge fallback."],
      },
      assetPolicy: "runtime_generated",
      assets: [
        {
          assetId: "leaf_badge",
          assetType: "image",
          requiredness: "required",
          generationTiming: "runtime_generated",
          useStep: "closing",
          promptEn: "Friendly leaf rescue badge.",
          displayBehavior: "Show after final care action.",
          fallbackBehavior: "Use text badge.",
        },
      ],
      sourceSections: {
        adaptationRationale: "Mechanic-first care scaffold.",
        assetBrief: "Asset policy: runtime_generated",
      },
    },
    diagnostics: [
      {
        id: "asset-runtime-generated",
        category: "asset_dependency",
        status: "needs_product_decision",
        severity: "warning",
        title: "Runtime asset generation needs product decision",
        message: "Runtime generation is not supported in V1.",
      },
    ],
    ...overrides,
  };
}

test("review console renders bundle list, diagnostics, metadata, and editor action", () => {
  const results = [importedResult()];

  const html = renderToStaticMarkup(
    <ReviewConsole
      results={results}
      selectedIndex={0}
      onSelect={() => {}}
      onOpenEditor={() => {}}
    />,
  );

  assert.match(html, /Leaf Rescue Team/);
  assert.match(html, /asset_rescue_leaf/);
  assert.match(html, /Runtime asset generation needs product decision/);
  assert.match(html, /Mechanic-first care scaffold/);
  assert.match(html, /leaf_badge/);
  assert.match(html, /prompt_en/i);
  assert.match(html, /Care Rounds/);
  assert.match(html, /Open in Editor/);
});

test("review console exposes batch filters and reviewer status controls", () => {
  const html = renderToStaticMarkup(
    <ReviewConsole
      results={[importedResult()]}
      selectedIndex={0}
      onSelect={() => {}}
      onOpenEditor={() => {}}
      reviewStatuses={{ asset_rescue_leaf: "needs_product_decision" }}
      onReviewStatusChange={() => {}}
    />,
  );

  assert.match(html, /Mechanic/);
  assert.match(html, /Asset policy/);
  assert.match(html, /Category/);
  assert.match(html, /Tier/);
  assert.match(html, /Review status/);
  assert.match(html, /Needs product decision/);
  assert.match(html, /Ready to edit/);
});

test("review console keeps filter controls visible when no activities match", () => {
  const html = renderToStaticMarkup(
    <ReviewConsole
      results={[]}
      selectedIndex={0}
      onSelect={() => {}}
      onOpenEditor={() => {}}
    />,
  );

  assert.match(html, /Mechanic/);
  assert.match(html, /Asset policy/);
  assert.match(html, /No activities match the current filters/);
});
