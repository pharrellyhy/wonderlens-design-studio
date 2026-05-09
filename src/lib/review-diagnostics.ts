import {
  TAG_BLOCK_PILLAR_TO_EXPERIENCE_PILLAR,
  type ActivityBundle,
} from "./activity-bundle-schema";
import type { Mechanic } from "./activity-bundle-schema";
import { PILLAR_STYLES } from "./design-schema";
import type { ActivityReviewMetadata, AssetRequirement } from "./review-metadata";

export type ReviewDiagnosticCategory =
  | "mechanic_fidelity"
  | "asset_dependency"
  | "technical_blocker"
  | "cross_file_alignment";

export type ReviewDiagnosticStatus =
  | "pass"
  | "needs_review"
  | "needs_product_decision"
  | "blocked"
  | "not_provided";

export type ReviewDiagnosticSeverity = "info" | "warning" | "error";

export interface ReviewDiagnostic {
  id: string;
  category: ReviewDiagnosticCategory;
  status: ReviewDiagnosticStatus;
  severity: ReviewDiagnosticSeverity;
  title: string;
  message: string;
  evidence?: string[];
}

export interface BuildReviewDiagnosticsInput {
  bundle: ActivityBundle;
  reviewMetadata: ActivityReviewMetadata;
  specMarkdown?: string;
  prodMarkdown?: string;
}

const MECHANIC_KEYWORDS: Record<Mechanic, readonly string[]> = {
  collect: ["find", "collect", "photograph", "bring back", "look for"],
  compare: ["same", "different", "compare", "which one", "bigger", "smaller"],
  deduce: ["clue", "guess", "solve", "reveal"],
  voice: ["say as", "speak as", "perform as"],
  build: ["invent", "make", "create", "combine"],
  predict: ["predict", "guess before", "reveal", "result"],
  narrate: ["story", "next happens", "choose", "sequence"],
  care: ["help", "need", "care", "rescue"],
  sort: ["group", "sort", "category"],
  enumerate: ["name", "notice", "list", "count parts"],
};

const RAW_PROMPT_IN_PROD_RE =
  /\b(?:raw\s+)?image\s+prompt\s*:|\bprompt_en\s*:|\bprompt\s*:\s*.+(?:illustration|image|photo|mascot|badge)/i;

const TECHNICAL_BLOCKER_CHECKS: Array<{
  id: string;
  title: string;
  re: RegExp;
}> = [
  {
    id: "technical_blocker.ocr_text_reading",
    title: "Likely OCR or text-reading dependency",
    re: /\b(?:ocr|read(?:s|ing)? text|text on|words on|label text)\b/i,
  },
  {
    id: "technical_blocker.face_expression_pose_detection",
    title: "Likely face, expression, or pose detection dependency",
    re: /\b(?:face|expression|pose|gesture|smile|frown)\b/i,
  },
  {
    id: "technical_blocker.imu_camera_angle_detection",
    title: "Likely IMU or camera-angle detection dependency",
    re: /\b(?:imu|tilt|camera angle|phone angle|rotate the phone)\b/i,
  },
  {
    id: "technical_blocker.before_after_object_state",
    title: "Likely before/after object-state comparison dependency",
    re: /\b(?:before and after|before\/after|changed|object state)\b/i,
  },
  {
    id: "technical_blocker.non_speech_audio_detection",
    title: "Likely non-speech audio detection dependency",
    re: /\b(?:clap|music|sound effect|non[-\s]?speech|audio detection)\b/i,
  },
  {
    id: "technical_blocker.unsupported_coloring_drawing_ui",
    title: "Likely unsupported coloring or drawing UI dependency",
    re: /\b(?:coloring|drawing|draw|paint|crayon)\b/i,
  },
  {
    id: "technical_blocker.unsupported_material_workflow",
    title: "Likely unsupported material workflow dependency",
    re: /\b(?:cut out|glue|tape|printable|worksheet|materials?)\b/i,
  },
];

export function buildReviewDiagnostics({
  bundle,
  reviewMetadata,
  prodMarkdown,
}: BuildReviewDiagnosticsInput): ReviewDiagnostic[] {
  return [
    ...mechanicDiagnostics(bundle, reviewMetadata, prodMarkdown),
    ...productDecisionDiagnostics(reviewMetadata),
    ...assetDiagnostics(reviewMetadata, bundle, prodMarkdown),
    ...technicalBlockerDiagnostics(prodMarkdown ?? bundleText(bundle)),
    ...crossFileDiagnostics(bundle),
    ...scorecardPlacementDiagnostics(prodMarkdown),
  ];
}

function productDecisionDiagnostics(
  reviewMetadata: ActivityReviewMetadata,
): ReviewDiagnostic[] {
  const diagnostics: ReviewDiagnostic[] = [];
  const adaptation = reviewMetadata.adaptation;

  if (adaptation?.readiness === "blocked_until_product_decision") {
    diagnostics.push({
      id: "asset.readiness_product_decision",
      category: "asset_dependency",
      status: "needs_product_decision",
      severity: "warning",
      title: "Adaptation readiness needs product decision",
      message:
        "Adaptation metadata marks this activity as blocked until a product decision is made.",
    });
  }

  for (const flag of adaptation?.productCapabilityFlags ?? []) {
    if (/runtime|generated|product|decision/i.test(flag)) {
      diagnostics.push({
        id: `asset.product_capability.${safeDiagnosticId(flag)}`,
        category: "asset_dependency",
        status: "needs_product_decision",
        severity: "warning",
        title: "Product capability flag needs review",
        message: `Adaptation metadata declares '${flag}', which needs product capability review before runtime use.`,
      });
    }
  }

  for (const asset of reviewMetadata.assets) {
    if (asset.generationTiming === "runtime_generated") {
      diagnostics.push({
        id: `asset.runtime_generated.${asset.assetId}`,
        category: "asset_dependency",
        status: "needs_product_decision",
        severity: "warning",
        title: "Runtime-generated asset needs product decision",
        message: `Asset '${asset.assetId}' uses runtime generation, which is not supported by the current V1 runtime contract.`,
      });
    }
  }

  return diagnostics;
}

function mechanicDiagnostics(
  bundle: ActivityBundle,
  reviewMetadata: ActivityReviewMetadata,
  prodMarkdown: string | undefined,
): ReviewDiagnostic[] {
  const diagnostics: ReviewDiagnostic[] = [];
  const tagMechanic = bundle.tagBlock.activity_signature.mechanic;
  const canonicalMechanic = reviewMetadata.adaptation?.canonicalMechanic;

  if (canonicalMechanic) {
    if (canonicalMechanic === tagMechanic) {
      diagnostics.push(pass(
        "mechanic.canonical_match",
        "mechanic_fidelity",
        "Canonical mechanic matches tag block",
        `Both adaptation metadata and tag_block.yaml use '${tagMechanic}'.`,
      ));
    } else {
      diagnostics.push(blocked(
        "mechanic.canonical_mismatch",
        "mechanic_fidelity",
        "Canonical mechanic does not match tag block",
        `Adaptation metadata uses '${canonicalMechanic}', but tag_block.yaml uses '${tagMechanic}'.`,
        [`adaptation: ${canonicalMechanic}`, `tag_block: ${tagMechanic}`],
      ));
    }
  } else {
    diagnostics.push({
      id: "mechanic.canonical_not_provided",
      category: "mechanic_fidelity",
      status: "not_provided",
      severity: "info",
      title: "Canonical mechanic not provided",
      message: "Adaptation Rationale did not declare a canonical mechanic.",
    });
  }

  const step3Text = prodMarkdown ? step3Markdown(prodMarkdown) : step3BundleText(bundle);
  const inferred = inferMechanic(step3Text);
  if (!inferred) {
    diagnostics.push({
      id: "mechanic.step3_action_alignment",
      category: "mechanic_fidelity",
      status: "needs_review",
      severity: "warning",
      title: "Step 3 action needs review",
      message:
        "The repeated child action in Step 3 could not be inferred confidently from conservative mechanic keywords.",
    });
  } else if (inferred === tagMechanic) {
    diagnostics.push(pass(
      "mechanic.step3_action_alignment",
      "mechanic_fidelity",
      "Step 3 action aligns with mechanic",
      `Step 3 language matches the '${tagMechanic}' mechanic.`,
    ));
  } else {
    diagnostics.push({
      id: "mechanic.step3_action_alignment",
      category: "mechanic_fidelity",
      status: "needs_review",
      severity: "warning",
      title: "Step 3 action may not align with mechanic",
      message:
        `Step 3 language looks closer to '${inferred}' than '${tagMechanic}'.`,
      evidence: [clip(step3Text)],
    });
  }

  return diagnostics;
}

function assetDiagnostics(
  reviewMetadata: ActivityReviewMetadata,
  bundle: ActivityBundle,
  prodMarkdown: string | undefined,
): ReviewDiagnostic[] {
  const diagnostics: ReviewDiagnostic[] = [];
  const prodText = prodMarkdown ?? bundleText(bundle);

  if (
    reviewMetadata.assetPolicy !== "no_assets" &&
    !reviewMetadata.sourceSections.assetBrief
  ) {
    diagnostics.push({
      id: "asset.brief_not_provided",
      category: "asset_dependency",
      status: "not_provided",
      severity: "warning",
      title: "Asset Brief not provided",
      message:
        "Asset policy is not 'no_assets', but spec.md does not include an Asset Brief section.",
    });
  }

  if (reviewMetadata.assetPolicy === "runtime_generated") {
    diagnostics.push(blocked(
      "asset.runtime_generated_unsupported",
      "asset_dependency",
      "Runtime-generated assets need product decision",
      "The current studio/runtime contract does not support runtime asset generation.",
    ));
  }

  const definedAssetIds = new Set(reviewMetadata.assets.map((asset) => asset.assetId));
  for (const assetId of referencedAssetIds(prodText)) {
    if (!definedAssetIds.has(assetId)) {
      diagnostics.push(blocked(
        `asset.undefined_reference.${assetId}`,
        "asset_dependency",
        "Referenced asset is not defined",
        `prod.md references '${assetId}', but Asset Brief does not define it.`,
      ));
    }
  }

  for (const asset of reviewMetadata.assets) {
    diagnostics.push(...assetRequirementDiagnostics(asset));
  }

  if (RAW_PROMPT_IN_PROD_RE.test(prodText)) {
    diagnostics.push(blocked(
      "asset.raw_prompt_in_prod",
      "asset_dependency",
      "prod.md includes raw image prompt text",
      "Image-generation prompts belong in Asset Brief metadata, not runtime production copy.",
    ));
  }

  if (!diagnostics.some((diagnostic) => diagnostic.category === "asset_dependency")) {
    diagnostics.push(pass(
      "asset.no_blockers",
      "asset_dependency",
      "No asset dependency blockers found",
      "Asset references and metadata passed deterministic checks.",
    ));
  }

  return diagnostics;
}

function assetRequirementDiagnostics(asset: AssetRequirement): ReviewDiagnostic[] {
  const diagnostics: ReviewDiagnostic[] = [];
  const missingCoreFields = [
    ["assetType", asset.assetType],
    ["requiredness", asset.requiredness],
    ["generationTiming", asset.generationTiming],
    ["useStep", asset.useStep],
    ["displayBehavior", asset.displayBehavior],
    ["fallbackBehavior", asset.fallbackBehavior],
  ]
    .filter(([, value]) => !value)
    .map(([field]) => field);

  if (missingCoreFields.length > 0) {
    diagnostics.push(blocked(
      `asset.missing_core_fields.${asset.assetId}`,
      "asset_dependency",
      "Asset metadata is incomplete",
      `Asset '${asset.assetId}' is missing: ${missingCoreFields.join(", ")}.`,
    ));
  }

  if (
    (asset.generationTiming === "pre_generated" ||
      asset.generationTiming === "runtime_generated") &&
    !asset.promptEn
  ) {
    diagnostics.push(blocked(
      `asset.generated_missing_prompt.${asset.assetId}`,
      "asset_dependency",
      "Generated asset is missing prompt_en",
      `Asset '${asset.assetId}' is generated but does not include prompt_en metadata.`,
    ));
  }

  if (
    asset.generationTiming === "display_existing" &&
    !asset.source &&
    !asset.promptEn
  ) {
    diagnostics.push(blocked(
      `asset.existing_missing_source.${asset.assetId}`,
      "asset_dependency",
      "Displayed existing asset is missing source",
      `Asset '${asset.assetId}' needs source or prompt_en metadata.`,
    ));
  }

  return diagnostics;
}

function technicalBlockerDiagnostics(text: string): ReviewDiagnostic[] {
  return TECHNICAL_BLOCKER_CHECKS
    .filter((check) => check.re.test(text))
    .map((check) =>
      blocked(
        check.id,
        "technical_blocker",
        check.title,
        "The activity appears to depend on a capability outside the V1 runtime contract.",
      ),
    );
}

function crossFileDiagnostics(bundle: ActivityBundle): ReviewDiagnostic[] {
  const diagnostics: ReviewDiagnostic[] = [];
  const sig = bundle.tagBlock.activity_signature;

  if (bundle.dashboard.session.focalAttribute === sig.focal_attribute) {
    diagnostics.push(pass(
      "cross_file.dashboard_focal_attribute_match",
      "cross_file_alignment",
      "Dashboard focal attribute matches tag block",
      "dashboard.template.yaml and tag_block.yaml use the same focal attribute.",
    ));
  } else {
    diagnostics.push(blocked(
      "cross_file.dashboard_focal_attribute_mismatch",
      "cross_file_alignment",
      "Dashboard focal attribute does not match tag block",
      `Dashboard uses '${bundle.dashboard.session.focalAttribute}', while tag_block.yaml uses '${sig.focal_attribute}'.`,
    ));
  }

  const recapMechanic = inferMechanic(bundle.recap.payloadDefaults.whatWeDid);
  if (!recapMechanic) {
    diagnostics.push({
      id: "cross_file.recap_action_alignment",
      category: "cross_file_alignment",
      status: "needs_review",
      severity: "warning",
      title: "Recap action needs review",
      message:
        "The recap action could not be confidently mapped to a mechanic keyword.",
    });
  } else if (recapMechanic === sig.mechanic) {
    diagnostics.push(pass(
      "cross_file.recap_action_alignment",
      "cross_file_alignment",
      "Recap action matches mechanic",
      `Recap action aligns with '${sig.mechanic}'.`,
    ));
  } else {
    diagnostics.push({
      id: "cross_file.recap_action_alignment",
      category: "cross_file_alignment",
      status: "needs_review",
      severity: "warning",
      title: "Recap action may not match mechanic",
      message:
        `Recap action looks closer to '${recapMechanic}' than '${sig.mechanic}'.`,
    });
  }

  const lowerPillar = TAG_BLOCK_PILLAR_TO_EXPERIENCE_PILLAR[bundle.tagBlock.pillar];
  const expectedStyle = PILLAR_STYLES[lowerPillar][bundle.tagBlock.template_type];
  if (bundle.tagBlock.game_style === expectedStyle) {
    diagnostics.push(pass(
      "cross_file.pillar_style_match",
      "cross_file_alignment",
      "Pillar and style pair is allowed",
      `Style '${bundle.tagBlock.game_style}' is valid for '${bundle.tagBlock.pillar}'.`,
    ));
  } else {
    diagnostics.push(blocked(
      "cross_file.pillar_style_mismatch",
      "cross_file_alignment",
      "Pillar and style pair is not allowed",
      `Expected '${expectedStyle}' for '${bundle.tagBlock.pillar}' and '${bundle.tagBlock.template_type}'.`,
    ));
  }

  if (bundle.spec.identity.mechanic === sig.mechanic) {
    diagnostics.push(pass(
      "cross_file.spec_mechanic_match",
      "cross_file_alignment",
      "Spec mechanic matches tag block",
      "spec.md and tag_block.yaml use the same mechanic.",
    ));
  } else {
    diagnostics.push(blocked(
      "cross_file.spec_mechanic_mismatch",
      "cross_file_alignment",
      "Spec mechanic does not match tag block",
      `spec.md uses '${bundle.spec.identity.mechanic}', while tag_block.yaml uses '${sig.mechanic}'.`,
    ));
  }

  return diagnostics;
}

function scorecardPlacementDiagnostics(
  prodMarkdown: string | undefined,
): ReviewDiagnostic[] {
  if (!prodMarkdown || !/^##\s+Self-Evaluation Scorecard\b/im.test(prodMarkdown)) {
    return [];
  }

  return [
    {
      id: "cross_file.scorecard_in_prod",
      category: "cross_file_alignment",
      status: "needs_review",
      severity: "warning",
      title: "Scorecard appears in prod.md",
      message:
        "The studio can import legacy prod.md scorecards, but exported production markdown should not carry editor-only scorecard content.",
    },
  ];
}

function inferMechanic(text: string): Mechanic | null {
  const scores = Object.entries(MECHANIC_KEYWORDS).map(([mechanic, keywords]) => {
    const score = keywords.reduce((total, keyword) => {
      const pattern = new RegExp(`\\b${escapeRe(keyword)}\\b`, "gi");
      return total + [...text.matchAll(pattern)].length;
    }, 0);
    return { mechanic: mechanic as Mechanic, score };
  });
  const sorted = scores.sort((a, b) => b.score - a.score);
  const best = sorted[0];
  const second = sorted[1];
  if (!best || best.score === 0 || best.score === second?.score) return null;
  return best.mechanic;
}

function referencedAssetIds(text: string): string[] {
  const ids = new Set<string>();
  for (const match of text.matchAll(/\{asset:([a-zA-Z0-9_-]+)\}/g)) {
    ids.add(match[1]);
  }
  return [...ids];
}

function step3Markdown(markdown: string): string {
  const match = /^#{2,4}\s+Step\s+3\b[\s\S]*?(?=^#{2,4}\s+Step\s+\d+\b|$(?![\s\S]))/im.exec(markdown);
  return match?.[0] ?? markdown;
}

function step3BundleText(bundle: ActivityBundle): string {
  const step = bundle.prod.steps.find((candidate) => candidate.stepNumber === 3);
  if (!step) return "";
  return [
    step.dialogue ? dialogueText(step.dialogue) : "",
    ...(step.rounds ?? []).map((round) => dialogueText(round.dialogue)),
  ].join("\n");
}

function bundleText(bundle: ActivityBundle): string {
  return bundle.prod.steps
    .map((step) =>
      [
        step.dialogue ? dialogueText(step.dialogue) : "",
        step.coldStart ? dialogueText(step.coldStart) : "",
        step.warmStart ? dialogueText(step.warmStart) : "",
        ...(step.rounds ?? []).map((round) => dialogueText(round.dialogue)),
      ].join("\n"),
    )
    .join("\n");
}

function dialogueText(dialogue: {
  aiSays: string;
  childResponses: Record<string, string>;
  aiFollowUps: Record<string, string>;
  screenDescription: string;
}): string {
  return [
    dialogue.aiSays,
    ...Object.values(dialogue.childResponses),
    ...Object.values(dialogue.aiFollowUps),
    dialogue.screenDescription,
  ].join("\n");
}

function pass(
  id: string,
  category: ReviewDiagnosticCategory,
  title: string,
  message: string,
  evidence?: string[],
): ReviewDiagnostic {
  return {
    id,
    category,
    status: "pass",
    severity: "info",
    title,
    message,
    ...(evidence ? { evidence } : {}),
  };
}

function blocked(
  id: string,
  category: ReviewDiagnosticCategory,
  title: string,
  message: string,
  evidence?: string[],
): ReviewDiagnostic {
  return {
    id,
    category,
    status: "blocked",
    severity: "error",
    title,
    message,
    ...(evidence ? { evidence } : {}),
  };
}

function clip(text: string): string {
  const singleLine = text.replace(/\s+/g, " ").trim();
  return singleLine.length > 240 ? `${singleLine.slice(0, 237)}...` : singleLine;
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function safeDiagnosticId(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "_")
    .replace(/^_+|_+$/g, "");
}
