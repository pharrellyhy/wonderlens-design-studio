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
- Step type "bridge" must have warmStart and coldStart, no dialogue or rounds.
- Step type "rules", "celebration", "closing" must have dialogue, no warmStart/coldStart/rounds.
- Step type "rounds" must have rounds array, no dialogue/warmStart/coldStart.
- Closing steps must include \`conceptReinforcement\` (naming one Key Concept) and \`tomorrowHook\` (one-line teaser for next session).
- Cat 1 activities typically have 5 steps: bridge, rules, rounds, celebration, closing.
- Cat 5 activities typically have 5-6 steps: bridge, rules, rounds, celebration (collection complete + synthesis), celebration (discovery), closing.

Output ONLY the JSON object. No wrapping, no explanation.
`;

// ---------------------------------------------------------------------------
// Prompt builder
// ---------------------------------------------------------------------------

export function buildGenerateMessages(
  entity: ParsedEntity,
  category: string,
  gameStyle: string,
  generationMode: GenerationMode
): LLMMessage[] {
  const systemContent = [
    programMd,
    templatesMd,
    entityGuidanceMd,
    gameStylesMd,
    conversationBridgeMd,
    JSON_SCHEMA_INSTRUCTIONS,
  ].join("\n\n---\n\n");

  const dimensionEntries = Object.entries(entity.dimensionSummary)
    .map(([dim, count]) => `  - ${dim}: ${count} attributes`)
    .join("\n");

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

## Instructions

1. Follow the structural template for the assigned category from templates.md.
2. Brainstorm fresh creative variables (metaphor, role, game mechanic) specific to this entity.
3. Generate a complete GameDesign JSON object following the exact schema described in the system prompt.
4. Set \`basicInfo.generationMode\` to "${generationMode}" exactly — it must match the mode listed above.
5. Ensure all 9 rubric dimensions pass (D1-D9). Self-evaluate and fix before outputting.
6. Output ONLY the raw JSON object. No markdown fences, no explanation.`;

  return [
    { role: "system", content: systemContent },
    { role: "user", content: userContent },
  ];
}
