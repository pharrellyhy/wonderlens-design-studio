import fs from "fs";
import path from "path";

import type { GenerationMode } from "@/lib/design-schema";
import type { LLMMessage } from "@/lib/llm/provider";
import type { ParsedEntity } from "@/lib/yaml-parser";

// ---------------------------------------------------------------------------
// Load data files once at module scope
// ---------------------------------------------------------------------------

const DATA_DIR = path.join(process.cwd(), "data");

const programMd = fs.readFileSync(path.join(DATA_DIR, "program.md"), "utf-8");
const templatesMd = fs.readFileSync(
  path.join(DATA_DIR, "templates.md"),
  "utf-8"
);
const entityGuidanceMd = fs.readFileSync(
  path.join(DATA_DIR, "entity_guidance.md"),
  "utf-8"
);
const gameStylesMd = fs.readFileSync(
  path.join(DATA_DIR, "game_styles.md"),
  "utf-8"
);
const conversationBridgeMd = fs.readFileSync(
  path.join(DATA_DIR, "conversation_bridge.md"),
  "utf-8"
);

// ---------------------------------------------------------------------------
// JSON schema description for the GameDesign interface
// ---------------------------------------------------------------------------

const JSON_SCHEMA_INSTRUCTIONS = `
## Output Format — JSON Schema

You MUST output ONLY raw JSON. No markdown fences, no explanation, no commentary.
The JSON must conform exactly to the following TypeScript interface (GameDesign):

{
  "basicInfo": {
    "activityName": string,
    "category": "cat1" | "cat5",
    "tier": "T0" | "T1" | "T2",
    "triggerEntity": string,
    "triggerScene": string,
    "coreKeyConcepts": string[],
    "relatedConcepts": string[],
    "atlSkills": string[],
    "gameStyle": string,
    "ibTheme": string,
    "generationMode": "freeform" | "mapping-informed"  // must match the mode given in the user-content block
  },
  "creativeVariables": {
    "metaphor": string,
    "roleTitle": string,
    "gameMechanic": string,
    "scenarioType": string,
    "targetResponseType": string,
    "escalationAxis": string,
    // Cat 5 only (omit for cat1):
    "visualFeature"?: string,
    "collectionCriterion"?: string,
    "synthesisType"?: "narrative" | "classification",
    "stuckHint"?: string,
    "reflectiveQuestion"?: string
  },
  "overview": {
    "briefDescription": string,
    "kud": {
      "know": string[],       // 2-5 items
      "understand": string[],  // 1-2 items
      "do": string[]           // 2-3 items
    },
    "designHighlight": string,
    "typicalScenario": string
  },
  "steps": [
    {
      "stepNumber": number,
      "title": string,
      "type": "bridge" | "rules" | "rounds" | "celebration" | "closing",
      // For type "bridge": provide warmStart AND coldStart (no dialogue):
      "warmStart"?: DialogueBlock,
      "coldStart"?: DialogueBlock,
      // For all other types: provide dialogue:
      "dialogue"?: DialogueBlock,
      // For type "rounds": provide rounds array:
      "rounds"?: Round[],
      // Required for type "closing":
      "conceptReinforcement"?: string, // one line explicitly naming at least one entry from basicInfo.coreKeyConcepts
      "tomorrowHook"?: string          // one-line teaser for the next session
    }
  ],
  "entityMapping": {
    "mappingSource": string,
    "anchorDimensions": string[],
    "conversationAnchorDimensions": string[],
    "themes": string[],
    "keyConcepts": string[]
  }
}

Where DialogueBlock is:
{
  "aiSays": string,           // Actual AI dialogue with tone marker
  "childResponses": {
    "ideal": string,           // Ideal child response
    "unexpected": string,      // Unexpected/off-topic response
    "silent": string           // No-response description
  },
  "aiFollowUps": {
    "ideal": string,           // AI follow-up to ideal
    "unexpected": string,      // AI follow-up to unexpected (validate then redirect)
    "silent": string           // AI follow-up to silence (gentle prompt)
  },
  "screenDescription": string  // What the screen displays
}

Where Round is:
{
  "roundNumber": number,
  "dialogue": DialogueBlock
}

Rules for the steps array:
- Step type "bridge" must have warmStart (always) and MAY have coldStart (see generation-mode rules below), no dialogue or rounds.
- Step type "rules", "celebration", "closing" must have dialogue, no warmStart/coldStart/rounds.
- Step type "rounds" must have rounds array, no dialogue/warmStart/coldStart.
- Closing steps must include \`conceptReinforcement\` (naming one Key Concept) and \`tomorrowHook\` (one-line teaser for next session).
- Cat 1 activities typically have 5 steps: bridge, rules, rounds, celebration, closing.
- Cat 5 activities typically have 5-6 steps: bridge, rules, rounds, celebration (collection complete + synthesis), celebration (discovery), closing.

Bridge step by generation mode:
- Freeform mode: Produce a single generic opener in \`warmStart\`. You MAY omit \`coldStart\` entirely (leave it undefined). Bridges do not need to be grounded in a specific mapping dimension.
- Mapping-informed mode: Produce BOTH \`warmStart\` AND \`coldStart\`. Each must be grounded in a specific dimension drawn from the entity's \`tier_guidance\` or \`conversationAnchorDimensions\`. The two bridges must target DIFFERENT dimensions. Pick a flavor (Recall / Discovery / Curiosity / Challenge) from the conversation_bridge guidance that best fits each chosen dimension.

Output ONLY the JSON object. No wrapping, no explanation.
`;

// ---------------------------------------------------------------------------
// Mode-specific guidance builders
// ---------------------------------------------------------------------------

/**
 * System-prompt sections to include for the given generation mode. Freeform
 * mode deliberately omits `conversation_bridge.md` because its dual-bridge
 * flavor catalogue is only relevant when each bridge is anchored to a named
 * dimension from the entity mapping.
 */
function buildSystemContent(generationMode: GenerationMode): string {
  const sections: string[] = [
    programMd,
    templatesMd,
    entityGuidanceMd,
    gameStylesMd,
  ];
  if (generationMode === "mapping-informed") {
    sections.push(conversationBridgeMd);
  }
  sections.push(JSON_SCHEMA_INSTRUCTIONS);
  return sections.join("\n\n---\n\n");
}

/**
 * Mode-specific user-content guidance block. Controls how hard `tier_guidance`
 * binds the output and how the bridge step must be constructed.
 */
function buildModeGuidance(generationMode: GenerationMode): string {
  if (generationMode === "freeform") {
    return `## Freeform Mode Guidance

- \`tier_guidance\` is PREFERRED guidance: its language complexity and dimension profile is a starting point, but you MAY diverge when it better serves the activity.
- The bridge step should produce a single generic opener in \`warmStart\`. Because generation mode is freeform, the \`coldStart\` field on the bridge step is optional. You may omit it entirely, or emit a trimmed-down version.
- Bridges do NOT need to be grounded in a specific dimension — a generic, warm opener is fine.
- \`conversation_bridge.md\` flavor patterns are not required for this mode.`;
  }

  return `## Mapping-Informed Mode Guidance

- \`tier_guidance\` is a HARD CONSTRAINT: language complexity and dimension profile must match the target tier exactly. Do not diverge.
- You MUST produce BOTH \`warmStart\` AND \`coldStart\` on the bridge step. Each must reference a specific dimension drawn from the entity's \`tier_guidance\` or \`conversationAnchorDimensions\`.
- The two bridges must target DIFFERENT dimensions.
- Pick a flavor from conversation_bridge.md (Recall / Discovery / Curiosity / Challenge) for each bridge based on the chosen dimension.`;
}

// ---------------------------------------------------------------------------
// Prompt builder
// ---------------------------------------------------------------------------

export function buildGenerateMessages(
  entity: ParsedEntity,
  category: string,
  gameStyle: string,
  generationMode: GenerationMode
): LLMMessage[] {
  const systemContent = buildSystemContent(generationMode);

  const dimensionEntries = Object.entries(entity.dimensionSummary)
    .map(([dim, count]) => `  - ${dim}: ${count} attributes`)
    .join("\n");

  const modeGuidance = buildModeGuidance(generationMode);

  const userContent = `Design a WonderLens activity with the following inputs:

## Entity YAML

\`\`\`yaml
${entity.rawYaml}
\`\`\`

## Assignment Parameters

- **Entity name**: ${entity.name}
- **Category**: ${category}
- **Game style**: ${gameStyle}
- **Generation mode**: ${generationMode}
- **IB Themes from mapping**: ${entity.themes.join(", ") || "none"}
- **Key Concepts from mapping**: ${entity.keyConcepts.join(", ") || "none"}
- **Related Concepts from mapping**: ${entity.relatedConcepts.join(", ") || "none"}
- **Available tiers**: ${entity.tiers.join(", ") || "none"}
- **Dimension summary**:
${dimensionEntries || "  (no dimensions)"}

${modeGuidance}

## Instructions

1. Follow the structural template for the assigned category from templates.md.
2. Brainstorm fresh creative variables (metaphor, role, game mechanic) specific to this entity.
3. Generate a complete GameDesign JSON object following the exact schema described in the system prompt.
4. Set \`basicInfo.generationMode\` to "${generationMode}" exactly — it must match the mode listed above.
5. Follow the mode guidance block above exactly, especially the bridge-step rules.
6. Ensure all 9 rubric dimensions pass (D1-D9). Self-evaluate and fix before outputting.
7. Output ONLY the raw JSON object. No markdown fences, no explanation.`;

  return [
    { role: "system", content: systemContent },
    { role: "user", content: userContent },
  ];
}
