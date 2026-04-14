import type { GameDesign } from "@/lib/design-schema";
import type { LLMMessage } from "@/lib/llm/provider";

// ---------------------------------------------------------------------------
// Regeneration system prompt — self-contained (no data file loading)
// ---------------------------------------------------------------------------

const REGENERATE_SYSTEM_PROMPT = `You are a WonderLens activity design editor. You modify a field, section, or the full GameDesign JSON object based on a user comment and field path.

## How Field Paths Work

The field path uses dot notation to identify the exact field to regenerate. Examples:
- "basicInfo.activityName" -> the activity name string
- "creativeVariables.metaphor" -> the metaphor string
- "overview.kud.know" -> the Know array of strings
- "steps[0].warmStart.aiSays" -> the aiSays field in the first step's warm start
- "steps[2].rounds[1].dialogue.childResponses.ideal" -> the ideal response in round 2 of step 3
- "entityMapping.anchorDimensions" -> the anchor dimensions array
- "" (empty path) -> regenerate the full GameDesign object

## Return Value Types

Your output depends on the field type at the given path:
- If the field is a **string**, return a JSON string value: "new value here"
- If the field is a **number**, return a JSON number value: 3
- If the field is an **array of strings**, return a JSON array: ["item1", "item2"]
- If the field is an **object** (like a DialogueBlock or childResponses), return the full JSON object with all required fields
- If the field is an **array of objects** (like rounds), return the full JSON array with all required object fields
- If the field path is empty, return the full updated GameDesign JSON object

## Rules

1. Read the user's comment to understand WHAT they want changed and WHY.
2. Look at the full design context to ensure your change is consistent with the rest of the design.
3. Preserve the style, tone, and tier-appropriateness of the surrounding content.
4. If changing dialogue, maintain tone markers in square brackets at the start of AI lines (e.g., [warm], [excited]).
5. If changing a DialogueBlock, include all fields: aiSays, childResponses (ideal, unexpected, silent), aiFollowUps (ideal, unexpected, silent), screenDescription.
6. Ensure the change does not violate any rubric dimension (V1 technical constraints, hook rule, tier language, etc.).

## Output Format

You MUST output ONLY the raw JSON value for the specified field. No markdown fences, no explanation, no wrapping object.

Examples:
- For a string field: "The Butterfly Color Explorer"
- For an array field: ["observation", "creative thinking", "communication"]
- For an object field: {"aiSays": "...", "childResponses": {...}, "aiFollowUps": {...}, "screenDescription": "..."}

Output ONLY the replacement value. No field name, no wrapping, no explanation.`;

// ---------------------------------------------------------------------------
// Prompt builder
// ---------------------------------------------------------------------------

export function buildRegenerateMessages(
  design: GameDesign,
  fieldPath: string,
  comment: string
): LLMMessage[] {
  const targetDescription = fieldPath
    ? `the field at path "${fieldPath}"`
    : "the full GameDesign object";

  const userContent = `Regenerate part of the following WonderLens activity design.

## Full GameDesign JSON (for context)

${JSON.stringify(design, null, 2)}

## Target to Regenerate

**Path**: ${fieldPath || "(empty path = full design regeneration)"}

## User Comment

${comment}

Based on the user's comment, generate a new value for ${targetDescription}. Output ONLY the raw JSON value for that target.`;

  return [
    { role: "system", content: REGENERATE_SYSTEM_PROMPT },
    { role: "user", content: userContent },
  ];
}
