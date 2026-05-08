import fs from "fs";
import path from "path";

import type { ActivityBundle } from "@/lib/activity-bundle-schema";
import type { RubricIssue } from "@/lib/design-schema";
import type { LLMMessage } from "@/lib/llm/provider";

// ---------------------------------------------------------------------------
// Load data files once at module scope
// ---------------------------------------------------------------------------

const DATA_DIR = path.join(process.cwd(), "data");

const playbookMd = fs.readFileSync(
  path.join(process.cwd(), "docs", "game_design_playbook.md"),
  "utf-8",
);
const templatesMd = fs.readFileSync(
  path.join(DATA_DIR, "templates.md"),
  "utf-8",
);

// ---------------------------------------------------------------------------
// Fix instructions
// ---------------------------------------------------------------------------

const FIX_INSTRUCTIONS = `
## Fix Instructions

You are given a WonderLens ActivityBundle JSON that failed one or more rubric dimensions during evaluation. Your job is to fix the identified issues while preserving all parts of the bundle that already pass.

The bundle has 5 named children: \`spec\`, \`prod\`, \`tagBlock\`, \`recap\`, \`dashboard\`. Most fixes will land in \`prod\` (dialogue, screen descriptions, KUD) or in cross-doc identifiers (gameStyle, observation_angle, mechanic) that must mirror across spec / prod / tagBlock / recap / dashboard.

Rules:
1. Read each issue carefully. The issue specifies which dimension failed and what is wrong.
2. Make the MINIMUM changes necessary to fix each issue. Do not rewrite parts of the bundle that already pass.
3. Preserve the exact same JSON structure (ActivityBundle schema). Do not add or remove top-level keys.
4. After fixing, the bundle must pass ALL 10 dimensions. Consider how your fixes might affect other dimensions.
5. Maintain consistency: if you change dialogue in one step, ensure surrounding steps still flow naturally.
6. Keep all tier-appropriate language constraints (T0/T1/T2 vocabulary and sentence length).
7. Ensure every step still has complete childResponses (ideal, unexpected, silent) and aiFollowUps.
8. Tone/emotion markers on AI dialogue MUST use square brackets, e.g., [warm] — NEVER parentheses.
9. The 11 cross-doc invariants (I1–I11) MUST hold after your fix. The most common ones to break:
   - tagBlock.activity_id === bundle.activityId
   - prod.basicInfo.gameStyle === tagBlock.game_style === spec.identity.gameStyle
   - prod.basicInfo.activityCategory === tagBlock.template_type
   - prod.basicInfo.recommendedTier === tagBlock.tier_range.primary
   - spec.identity / tagBlock.activity_signature mirror on { mechanic, observation_angle, entity_role }
   - recap.payloadDefaults and dashboard.session mirror the corresponding tagBlock fields

## Output Format

You MUST output ONLY the complete fixed ActivityBundle JSON object. No markdown fences, no explanation, no commentary.
Output the ENTIRE bundle (all 5 children + schemaVersion + activityId + generationMode), not just the changed parts.
`;

// ---------------------------------------------------------------------------
// Prompt builder
// ---------------------------------------------------------------------------

export function buildFixMessages(
  bundle: ActivityBundle,
  issues: RubricIssue[],
): LLMMessage[] {
  const systemContent = [playbookMd, templatesMd, FIX_INSTRUCTIONS].join(
    "\n\n---\n\n",
  );

  const formattedIssues = issues
    .map(
      (issue, index) =>
        `${index + 1}. **${issue.dimension}**: ${issue.description}`,
    )
    .join("\n");

  const userContent = `Fix the following WonderLens activity bundle to resolve all rubric failures.

## Current ActivityBundle JSON

${JSON.stringify(bundle, null, 2)}

## Issues to Fix

${formattedIssues}

Fix all listed issues while preserving the parts of the bundle that already pass. Output ONLY the complete fixed ActivityBundle JSON object.`;

  return [
    { role: "system", content: systemContent },
    { role: "user", content: userContent },
  ];
}
