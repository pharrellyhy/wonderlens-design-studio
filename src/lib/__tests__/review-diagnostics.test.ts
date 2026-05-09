import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import type { ActivityBundle } from "../activity-bundle-schema";
import { importBundleFromFiles } from "../bundle-import";
import { buildReviewDiagnostics } from "../review-diagnostics";
import {
  parseActivityReviewMetadata,
  type ActivityReviewMetadata,
} from "../review-metadata";

function activityFolderFiles(directory: string): File[] {
  return [
    "spec.md",
    "prod.md",
    "tag_block.yaml",
    "recap.template.yaml",
    "dashboard.template.yaml",
  ].map((name) => new File([readFileSync(`${directory}/${name}`, "utf8")], name));
}

async function loadFixtureBundle(): Promise<ActivityBundle> {
  const parsed = await importBundleFromFiles(
    activityFolderFiles("activities/color_scout_property"),
  );
  return parsed.bundle;
}

const SPEC_WITH_REVIEW_METADATA = `# Color Scout

## Adaptation Rationale

- **Input mode:** mapping_informed
- **Canonical mechanic:** collect
- **Readiness:** ready_to_generate
- **Trigger condition:** entity color is visually detectable
- **Mapping use:** uses tier_0.appearance.color as the repeated hunt target
- **Product capability flags:** camera_upload, asset_display
- **Scaffold fit:** strong
- **Assumptions:**
  - Child can move around the room safely.
  - Lighting is good enough for color matching.

## Asset Brief

- **Asset policy:** required_prebuilt

### Asset: color_scout_badge

- **Asset type:** badge_illustration
- **Requiredness:** required
- **Generation timing:** pre_generated
- **Use step:** Step 2
- **Purpose:** Shows the child they joined the scout mission.
- **Prompt_en:** Flat friendly badge with a red magnifying glass.
- **Source:** generated
- **Display behavior:** show beside the mission title
- **Fallback behavior:** show text-only scout title
- **Safety constraints:** no faces, no readable text
`;

test("parseActivityReviewMetadata reads Adaptation Rationale and Asset Brief sections", () => {
  const metadata = parseActivityReviewMetadata(SPEC_WITH_REVIEW_METADATA);

  assert.equal(metadata.adaptation?.inputMode, "mapping_informed");
  assert.equal(metadata.adaptation?.canonicalMechanic, "collect");
  assert.equal(metadata.adaptation?.readiness, "ready_to_generate");
  assert.equal(metadata.adaptation?.triggerCondition, "entity color is visually detectable");
  assert.equal(
    metadata.adaptation?.mappingUse,
    "uses tier_0.appearance.color as the repeated hunt target",
  );
  assert.deepEqual(metadata.adaptation?.productCapabilityFlags, [
    "camera_upload",
    "asset_display",
  ]);
  assert.equal(metadata.adaptation?.scaffoldFit, "strong");
  assert.deepEqual(metadata.adaptation?.assumptions, [
    "Child can move around the room safely.",
    "Lighting is good enough for color matching.",
  ]);

  assert.equal(metadata.assetPolicy, "required_prebuilt");
  assert.equal(metadata.assets.length, 1);
  assert.deepEqual(metadata.assets[0], {
    assetId: "color_scout_badge",
    assetType: "badge_illustration",
    requiredness: "required",
    generationTiming: "pre_generated",
    useStep: "Step 2",
    purpose: "Shows the child they joined the scout mission.",
    promptEn: "Flat friendly badge with a red magnifying glass.",
    source: "generated",
    displayBehavior: "show beside the mission title",
    fallbackBehavior: "show text-only scout title",
    safetyConstraints: ["no faces", "no readable text"],
  });
  assert.match(metadata.sourceSections.adaptationRationale ?? "", /Canonical mechanic/);
  assert.match(metadata.sourceSections.assetBrief ?? "", /Asset policy/);
});

test("parseActivityReviewMetadata uses safe defaults when review sections are absent", () => {
  const metadata = parseActivityReviewMetadata("# Legacy Activity\n\n## Premise\n\nNo review metadata yet.");

  assert.equal(metadata.adaptation, undefined);
  assert.equal(metadata.assetPolicy, "unknown");
  assert.deepEqual(metadata.assets, []);
  assert.deepEqual(metadata.sourceSections, {});
});

test("buildReviewDiagnostics flags mechanic mismatches and uncertain Step 3 alignment", async () => {
  const bundle = await loadFixtureBundle();
  const metadata: ActivityReviewMetadata = {
    adaptation: {
      canonicalMechanic: "compare",
      productCapabilityFlags: [],
      assumptions: [],
    },
    assetPolicy: "no_assets",
    assets: [],
    sourceSections: {},
  };

  const diagnostics = buildReviewDiagnostics({
    bundle,
    reviewMetadata: metadata,
    prodMarkdown:
      "## Color Quest\n\n### Step 3\n\nAI says: Tell me which object is bigger and which one is smaller.",
  });

  assert.equal(
    diagnostics.find((diagnostic) => diagnostic.id === "mechanic.canonical_mismatch")?.status,
    "blocked",
  );
  assert.equal(
    diagnostics.find((diagnostic) => diagnostic.id === "mechanic.step3_action_alignment")?.status,
    "needs_review",
  );
});

test("buildReviewDiagnostics flags incomplete and unsupported asset dependencies", async () => {
  const bundle = await loadFixtureBundle();
  const metadata: ActivityReviewMetadata = {
    assetPolicy: "runtime_generated",
    assets: [
      {
        assetId: "mission_badge",
        assetType: "badge",
        requiredness: "required",
        generationTiming: "runtime_generated",
        useStep: "Step 2",
        displayBehavior: "show on mission card",
        fallbackBehavior: "use text-only card",
      },
      {
        assetId: "reference_photo",
        assetType: "photo",
        requiredness: "required",
        generationTiming: "display_existing",
        useStep: "Step 3",
        displayBehavior: "show beside the prompt",
        fallbackBehavior: "skip visual support",
      },
    ],
    sourceSections: {
      assetBrief: "Asset policy: runtime_generated",
    },
  };

  const diagnostics = buildReviewDiagnostics({
    bundle,
    reviewMetadata: metadata,
    prodMarkdown:
      "Screen: Show {asset:mission_badge} next to {asset:unknown_badge}. Image prompt: cute mascot holding a crayon.",
  });

  assert.equal(
    diagnostics.find((diagnostic) => diagnostic.id === "asset.runtime_generated_unsupported")?.status,
    "blocked",
  );
  assert.equal(
    diagnostics.find((diagnostic) => diagnostic.id === "asset.undefined_reference.unknown_badge")?.status,
    "blocked",
  );
  assert.equal(
    diagnostics.find((diagnostic) => diagnostic.id === "asset.generated_missing_prompt.mission_badge")?.status,
    "blocked",
  );
  assert.equal(
    diagnostics.find((diagnostic) => diagnostic.id === "asset.existing_missing_source.reference_photo")?.status,
    "blocked",
  );
  assert.equal(
    diagnostics.find((diagnostic) => diagnostic.id === "asset.raw_prompt_in_prod")?.status,
    "blocked",
  );
});

test("buildReviewDiagnostics flags product decision risks from adaptation metadata and individual assets", async () => {
  const bundle = await loadFixtureBundle();
  const diagnostics = buildReviewDiagnostics({
    bundle,
    reviewMetadata: {
      adaptation: {
        readiness: "blocked_until_product_decision",
        productCapabilityFlags: ["runtime_generated_image"],
        assumptions: [],
      },
      assetPolicy: "optional_support",
      assets: [
        {
          assetId: "dynamic_badge",
          assetType: "image",
          requiredness: "optional",
          generationTiming: "runtime_generated",
          useStep: "Step 5",
          promptEn: "Badge based on the child's discoveries.",
          displayBehavior: "show after celebration",
          fallbackBehavior: "show text badge",
        },
      ],
      sourceSections: {
        assetBrief: "Asset policy: optional_support",
      },
    },
    prodMarkdown: "Screen: Show {asset:dynamic_badge}.",
  });

  assert.equal(
    diagnostics.find((diagnostic) => diagnostic.id === "asset.readiness_product_decision")?.status,
    "needs_product_decision",
  );
  assert.equal(
    diagnostics.find((diagnostic) => diagnostic.id === "asset.product_capability.runtime_generated_image")?.status,
    "needs_product_decision",
  );
  assert.equal(
    diagnostics.find((diagnostic) => diagnostic.id === "asset.runtime_generated.dynamic_badge")?.status,
    "needs_product_decision",
  );
});

test("buildReviewDiagnostics flags missing core asset fields even when requiredness is absent", async () => {
  const bundle = await loadFixtureBundle();
  const diagnostics = buildReviewDiagnostics({
    bundle,
    reviewMetadata: {
      assetPolicy: "required_prebuilt",
      assets: [
        {
          assetId: "incomplete_asset",
          assetType: "",
          requiredness: "" as never,
          generationTiming: "" as never,
          useStep: "",
        },
      ],
      sourceSections: {
        assetBrief: "Asset policy: required_prebuilt",
      },
    },
    prodMarkdown: "Screen: Show {asset:incomplete_asset}.",
  });

  assert.equal(
    diagnostics.find((diagnostic) => diagnostic.id === "asset.missing_core_fields.incomplete_asset")?.status,
    "blocked",
  );
});

test("buildReviewDiagnostics flags likely V1 technical blockers", async () => {
  const bundle = await loadFixtureBundle();
  const diagnostics = buildReviewDiagnostics({
    bundle,
    reviewMetadata: {
      assetPolicy: "no_assets",
      assets: [],
      sourceSections: {},
    },
    prodMarkdown:
      "The app reads text on the package, detects the child's pose, and checks whether the drawing changed before and after coloring.",
  });

  assert.equal(
    diagnostics.find((diagnostic) => diagnostic.id === "technical_blocker.ocr_text_reading")?.status,
    "blocked",
  );
  assert.equal(
    diagnostics.find((diagnostic) => diagnostic.id === "technical_blocker.face_expression_pose_detection")?.status,
    "blocked",
  );
  assert.equal(
    diagnostics.find((diagnostic) => diagnostic.id === "technical_blocker.before_after_object_state")?.status,
    "blocked",
  );
  assert.equal(
    diagnostics.find((diagnostic) => diagnostic.id === "technical_blocker.unsupported_coloring_drawing_ui")?.status,
    "blocked",
  );
});

test("buildReviewDiagnostics flags scorecards in prod markdown as review drift", async () => {
  const bundle = await loadFixtureBundle();
  const diagnostics = buildReviewDiagnostics({
    bundle,
    reviewMetadata: {
      assetPolicy: "no_assets",
      assets: [],
      sourceSections: {},
    },
    prodMarkdown: "## Activity\n\n## Self-Evaluation Scorecard\n\n| # | Dimension | Score | Notes |",
  });

  assert.equal(
    diagnostics.find((diagnostic) => diagnostic.id === "cross_file.scorecard_in_prod")?.status,
    "needs_review",
  );
});
