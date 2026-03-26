import fs from "fs";
import path from "path";

import type { GameDesign, RubricIssue } from "@/lib/design-schema";
import type { LLMMessage } from "@/lib/llm/provider";

// ---------------------------------------------------------------------------
// Load data files once at module scope
// ---------------------------------------------------------------------------

const DATA_DIR = path.join(process.cwd(), "data");

const programMd = fs.readFileSync(path.join(DATA_DIR, "program.md"), "utf-8");
const templatesMd = fs.readFileSync(
  path.join(DATA_DIR, "templates.md"),
  "utf-8"
);

// ---------------------------------------------------------------------------
// Fix instructions
// ---------------------------------------------------------------------------

const FIX_INSTRUCTIONS = `
## Fix Instructions

You are given a WonderLens GameDesign JSON that failed one or more rubric dimensions during evaluation. Your job is to fix the identified issues while preserving all parts of the design that already pass.

Rules:
1. Read each issue carefully. The issue specifies which dimension failed and what is wrong.
2. Make the MINIMUM changes necessary to fix each issue. Do not rewrite parts of the design that are already correct.
3. Preserve the exact same JSON structure (GameDesign schema). Do not add or remove fields.
4. After fixing, the design must pass ALL 9 dimensions. Consider how your fixes might affect other dimensions.
5. Maintain consistency: if you change dialogue in one step, ensure surrounding steps still flow naturally.
6. Keep all tier-appropriate language constraints (T0/T1/T2 vocabulary and sentence length).
7. Ensure every step still has complete childResponses (ideal, unexpected, silent) and aiFollowUps.

## Output Format

You MUST output ONLY the complete fixed GameDesign JSON object. No markdown fences, no explanation, no commentary.
Output the ENTIRE GameDesign object, not just the changed parts.
`;

// ---------------------------------------------------------------------------
// Prompt builder
// ---------------------------------------------------------------------------

export function buildFixMessages(
  design: GameDesign,
  issues: RubricIssue[]
): LLMMessage[] {
  const systemContent = [programMd, templatesMd, FIX_INSTRUCTIONS].join(
    "\n\n---\n\n"
  );

  const formattedIssues = issues
    .map(
      (issue, index) =>
        `${index + 1}. **${issue.dimension}**: ${issue.description}`
    )
    .join("\n");

  const userContent = `Fix the following WonderLens activity design to resolve all rubric failures.

## Current GameDesign JSON

${JSON.stringify(design, null, 2)}

## Issues to Fix

${formattedIssues}

Fix all listed issues while preserving the parts of the design that already pass. Output ONLY the complete fixed GameDesign JSON object.`;

  return [
    { role: "system", content: systemContent },
    { role: "user", content: userContent },
  ];
}
