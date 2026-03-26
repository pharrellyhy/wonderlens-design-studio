import type {
  GameDesign,
  DialogueBlock,
  Step,
  Round,
} from "@/lib/design-schema";
import { CATEGORY_LABELS, TIER_LABELS } from "@/lib/design-schema";

// ── Helpers ────────────────────────────────────────────────────────────────

/**
 * Format a single dialogue block into markdown.
 * Renders AI Says, Child Responses (ideal/unexpected/silent),
 * AI Follow-ups (ideal/unexpected/silent), and Screen Description.
 */
export function formatDialogueBlock(
  db: DialogueBlock,
  indent: string = "",
): string {
  return [
    `${indent}**AI Says:** ${db.aiSays}`,
    "",
    `${indent}**Child Responses:**`,
    `${indent}  - Ideal: ${db.childResponses.ideal}`,
    `${indent}  - Unexpected: ${db.childResponses.unexpected}`,
    `${indent}  - Silent: ${db.childResponses.silent}`,
    "",
    `${indent}**AI Follow-ups:**`,
    `${indent}  - Ideal: ${db.aiFollowUps.ideal}`,
    `${indent}  - Unexpected: ${db.aiFollowUps.unexpected}`,
    `${indent}  - Silent: ${db.aiFollowUps.silent}`,
    "",
    `${indent}**Screen:** ${db.screenDescription}`,
  ].join("\n");
}

/**
 * Format a step for the full spec format.
 * Bridge steps show warm start + cold start sub-sections.
 * Rounds steps show all rounds fully expanded.
 * Other steps show a single dialogue block.
 */
export function formatStep(step: Step): string {
  const lines: string[] = [];
  lines.push(`### Step ${step.stepNumber}: ${step.title}`);
  lines.push(`*Type: ${step.type}*\n`);

  if (step.type === "bridge") {
    if (step.warmStart) {
      lines.push("#### Step 1a — Warm Start\n");
      lines.push(formatDialogueBlock(step.warmStart));
    }
    if (step.coldStart) {
      lines.push("\n#### Step 1b — Cold Start\n");
      lines.push(formatDialogueBlock(step.coldStart));
    }
  } else if (step.type === "rounds" && step.rounds) {
    for (const round of step.rounds) {
      lines.push(`\n#### Round ${round.roundNumber}\n`);
      lines.push(formatDialogueBlock(round.dialogue));
    }
  } else if (step.dialogue) {
    lines.push(formatDialogueBlock(step.dialogue));
  }

  return lines.join("\n");
}

/**
 * Create a one-line summary for a round in prod format.
 * Truncates AI Says at ~80 characters with ellipsis.
 */
function formatRoundSummary(round: Round): string {
  const aiSaysPreview =
    round.dialogue.aiSays.length > 80
      ? round.dialogue.aiSays.slice(0, 80) + "..."
      : round.dialogue.aiSays;
  return `- **Round ${round.roundNumber}:** ${aiSaysPreview}`;
}

/**
 * Format a step for the condensed prod format.
 * Bridge steps: cold-start only (warm start is dropped per transform.md rules).
 * Rounds steps: Round 1 fully expanded, remaining rounds as 1-line summaries.
 * Other steps: single dialogue block.
 */
export function formatStepProd(step: Step): string {
  const lines: string[] = [];
  lines.push(`### Step ${step.stepNumber}: ${step.title}`);

  if (step.type === "bridge") {
    // Per transform.md Section C: Drop warm start, use cold-start content only
    if (step.coldStart) {
      lines.push("");
      lines.push(formatDialogueBlock(step.coldStart));
    }
  } else if (step.type === "rounds" && step.rounds) {
    // Round 1 fully expanded, rest condensed
    if (step.rounds.length > 0) {
      lines.push(`\n#### Round 1\n`);
      lines.push(formatDialogueBlock(step.rounds[0].dialogue));
    }
    if (step.rounds.length > 1) {
      lines.push("\n**Remaining Rounds (condensed):**");
      for (const round of step.rounds.slice(1)) {
        lines.push(formatRoundSummary(round));
      }
    }
  } else if (step.dialogue) {
    lines.push("");
    lines.push(formatDialogueBlock(step.dialogue));
  }

  return lines.join("\n");
}

// ── Spec Export ─────────────────────────────────────────────────────────────

/**
 * Export a GameDesign as full spec-format markdown.
 * Includes all fields, all rounds expanded, entity mapping, and creative variables.
 */
export function exportSpec(design: GameDesign): string {
  const bi = design.basicInfo;
  const cv = design.creativeVariables;
  const ov = design.overview;

  const sections: string[] = [];

  // Title + Basic Info table (all fields)
  sections.push(`# ${bi.activityName}\n`);
  sections.push(`| Field | Value |`);
  sections.push(`|-------|-------|`);
  sections.push(`| Activity Name | ${bi.activityName} |`);
  sections.push(`| Activity Category | ${CATEGORY_LABELS[bi.category]} |`);
  sections.push(`| Recommended Tier | ${TIER_LABELS[bi.tier]} |`);
  sections.push(`| Core IB Key Concepts | ${bi.coreKeyConcepts.join(", ")} |`);
  sections.push(`| Related Concepts | ${bi.relatedConcepts.join(", ")} |`);
  sections.push(`| ATL Skills Focus | ${bi.atlSkills.join(", ")} |`);
  sections.push(`| Game Style | ${bi.gameStyle} |`);
  sections.push(`| Trigger Entity | ${bi.triggerEntity} |`);
  sections.push(`| Trigger Scene | ${bi.triggerScene} |`);
  sections.push(`| IB Theme | ${bi.ibTheme} |`);

  // Activity Overview
  sections.push(`\n## Activity Overview\n`);
  sections.push(ov.briefDescription);
  sections.push(`\n**Design Highlight:** ${ov.designHighlight}`);
  sections.push(`\n**Typical Scenario:** ${ov.typicalScenario}`);

  // KUD
  sections.push(`\n## KUD\n`);
  sections.push(`**Know:** ${ov.kud.know.join("; ")}`);
  sections.push(`**Understand:** ${ov.kud.understand.join("; ")}`);
  sections.push(`**Do:** ${ov.kud.do.join("; ")}`);

  // Creative Variables
  sections.push(`\n## Creative Variables\n`);
  sections.push(`- **Metaphor:** ${cv.metaphor}`);
  sections.push(`- **Role Title:** ${cv.roleTitle}`);
  sections.push(`- **Game Mechanic:** ${cv.gameMechanic}`);
  sections.push(`- **Scenario Type:** ${cv.scenarioType}`);
  sections.push(`- **Target Response Type:** ${cv.targetResponseType}`);
  sections.push(`- **Escalation Axis:** ${cv.escalationAxis}`);
  if (cv.visualFeature)
    sections.push(`- **Visual Feature:** ${cv.visualFeature}`);
  if (cv.collectionCriterion)
    sections.push(`- **Collection Criterion:** ${cv.collectionCriterion}`);
  if (cv.synthesisType)
    sections.push(`- **Synthesis Type:** ${cv.synthesisType}`);
  if (cv.stuckHint) sections.push(`- **Stuck Hint:** ${cv.stuckHint}`);
  if (cv.reflectiveQuestion)
    sections.push(`- **Reflective Question:** ${cv.reflectiveQuestion}`);

  // Activity Steps
  sections.push(`\n## Activity Steps\n`);
  for (const step of design.steps) {
    sections.push(formatStep(step));
    sections.push("");
  }

  // Entity Mapping
  const em = design.entityMapping;
  sections.push(`## Entity Mapping\n`);
  sections.push(`- **Mapping Source:** ${em.mappingSource}`);
  sections.push(
    `- **Anchor Dimensions:** ${em.anchorDimensions.join(", ")}`,
  );
  sections.push(
    `- **Conversation Anchor Dimensions:** ${em.conversationAnchorDimensions.join(", ")}`,
  );
  sections.push(`- **Themes:** ${em.themes.join(", ")}`);
  sections.push(`- **Key Concepts:** ${em.keyConcepts.join(", ")}`);

  return sections.join("\n");
}

// ── Prod Export ─────────────────────────────────────────────────────────────

/**
 * Export a GameDesign as condensed prod-format markdown.
 * Follows data/transform.md rules: 7-row basic info table, simplified category
 * labels, condensed rounds (Round 1 full, rest as 1-line summaries),
 * no entity mapping, no scorecard.
 */
export function exportProd(design: GameDesign): string {
  const bi = design.basicInfo;
  const ov = design.overview;

  const sections: string[] = [];

  // 7-row Basic Info table per transform.md Section A
  sections.push(`# ${bi.activityName}\n`);
  sections.push(`| Field | Value |`);
  sections.push(`|-------|-------|`);
  sections.push(`| Activity Name | ${bi.activityName} |`);
  // Simplify category: use the label directly (already without "Category N —" prefix)
  sections.push(`| Activity Category | ${CATEGORY_LABELS[bi.category]} |`);
  sections.push(`| Recommended Tier | ${TIER_LABELS[bi.tier]} |`);
  sections.push(
    `| Core IB Key Concepts | ${bi.coreKeyConcepts.join(", ")} |`,
  );
  sections.push(`| Related Concepts | ${bi.relatedConcepts.join(", ")} |`);
  sections.push(`| ATL Skills Focus | ${bi.atlSkills.join(", ")} |`);
  sections.push(`| Game Style | ${bi.gameStyle} |`);

  // Overview (trimmed — brief description only, no design highlight / typical scenario)
  sections.push(`\n## Activity Overview\n`);
  sections.push(ov.briefDescription);

  // KUD
  sections.push(`\n## KUD\n`);
  sections.push(`**Know:** ${ov.kud.know.join("; ")}`);
  sections.push(`**Understand:** ${ov.kud.understand.join("; ")}`);
  sections.push(`**Do:** ${ov.kud.do.join("; ")}`);

  // Steps (prod format: condensed rounds, cold-start only for bridge)
  sections.push(`\n## Activity Steps\n`);
  for (const step of design.steps) {
    sections.push(formatStepProd(step));
    sections.push("");
  }

  return sections.join("\n");
}
