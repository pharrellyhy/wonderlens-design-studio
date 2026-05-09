import fs from "fs";
import path from "path";

import {
  PILLAR_LABELS,
  type ExperiencePillar,
  type GenerationMode,
} from "@/lib/design-schema";
import type { LLMMessage } from "@/lib/llm/provider";
import type { ParsedEntity } from "@/lib/yaml-parser";

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
const entityGuidanceMd = fs.readFileSync(
  path.join(DATA_DIR, "entity_guidance.md"),
  "utf-8",
);
const conversationBridgeMd = fs.readFileSync(
  path.join(DATA_DIR, "conversation_bridge.md"),
  "utf-8",
);

// ---------------------------------------------------------------------------
// Reference bundle — inlined as a few-shot example
// ---------------------------------------------------------------------------
//
// Loaded once at module scope from the canonical mystery_trail_butterfly
// activity. Provides the LLM with a complete, schema-correct example of an
// ActivityBundle so it can pattern-match the prose-section shapes (premise,
// pedagogical rationale, constellation adaptation notes, etc.) that don't
// have a strict structure beyond Markdown.

const REFERENCE_ACTIVITY_DIR = path.join(
  process.cwd(),
  "activities",
  "mystery_trail_butterfly",
);

function readReference(name: string): string {
  return fs.readFileSync(path.join(REFERENCE_ACTIVITY_DIR, name), "utf-8");
}

const referenceBundle = {
  spec: readReference("spec.md"),
  prod: readReference("prod.md"),
  tagBlock: readReference("tag_block.yaml"),
  recap: readReference("recap.template.yaml"),
  dashboard: readReference("dashboard.template.yaml"),
};

// ---------------------------------------------------------------------------
// JSON schema description for the ActivityBundle interface
// ---------------------------------------------------------------------------

const JSON_SCHEMA_INSTRUCTIONS = `
## Output Format — JSON Schema

You MUST output ONLY raw JSON. No markdown fences, no explanation, no commentary.
The JSON must conform exactly to the following TypeScript interface (ActivityBundle):

{
  "schemaVersion": 1,
  "activityId": string,            // lowercase snake_case, convention: <game_style>_<entity>
  "generationMode": "freeform" | "mapping-informed",
  "spec":      Spec,
  "prod":      Prod,
  "tagBlock":  TagBlock,
  "recap":     Recap,
  "dashboard": Dashboard
}

Where each child schema is:

Spec = {
  "title": string,                  // e.g. "Mystery Trail Butterfly — Authoring Spec"
  "subtitle"?: string,              // one-line categorisation, e.g. "Category 5 · Bound to butterfly · …"
  "premise": string,                // 1-3 sentence design intent (prose)
  "target": {
    "ibAxisPrimary": string,        // e.g. "Connection (primary, via habitat)"
    "ibAxisSecondary"?: string,
    "primaryTier": "T0" | "T1" | "T2",
    "tierElasticity": string,       // e.g. "T0–T2 (±1)"
    "ageNotes": string              // why this tier fits, in plain prose
  },
  "pedagogicalRationale": string,   // 2-4 sentence prose paragraph
  "selectionTrigger": {
    "description": string,                // when does the matcher fire this activity?
    "tierGuidanceAttributeIds": string[], // e.g. ["tier_0.appearance.wing_color", …] — at least one
    "constellationNotes"?: string         // optional prose on neighbour-entity adaptation
  },
  "identity": {                     // mirrors tagBlock — see invariants I5–I7
    "pillar": "Discovery" | "Performance" | "Mystery" | "Creation" | "Adventure" | "Connection",
    "gameStyle": string,
    "mechanic": Mechanic,
    "observationAngle": ObservationAngle,
    "entityRole": EntityRole
  }
}

Prod = {
  "basicInfo": {
    "activityName": string,                      // child-facing name
    "activityCategory": "cat1" | "cat5",
    "recommendedTier": "T0" | "T1" | "T2",
    "coreIbKeyConcepts": IbKeyConcept[],         // 1-2 entries (see closed enum below)
    "relatedConcepts": string[],
    "atlSkillsFocus": string[],
    "gameStyle": string,                         // must match tagBlock.game_style
    "designVersion": string,                     // "1.0" for a fresh design
    "lastUpdated": string                        // ISO date "YYYY-MM-DD"
  },
  "entityAttributesCovered": string[],           // tier_guidance attribute IDs this activity exercises (>=1)
  "constellationAdaptation": {                   // one section each — keep concise
    "preserve": string[],
    "swap":     string[],
    "watch":    string[]
  },
  "overview": {
    "briefDescription": string,
    "designHighlight": string,
    "typicalScenario": string
  },
  "kud": {
    "know":       string[],   // 1-3 prose items per slot
    "understand": string[],
    "do":         string[]
  },
  "steps": Step[]                                // ordered Step 1..5 (or 1..6 for cat5)
}

Step = {
  "stepNumber": number,
  "title": string,
  "type": "bridge" | "rules" | "rounds" | "celebration" | "closing",
  // For type "bridge": at least one of warmStart / coldStart per generation mode
  "warmStart"?: DialogueBlock,
  "coldStart"?: DialogueBlock,
  // For "rules" | "celebration" | "closing": single dialogue
  "dialogue"?: DialogueBlock,
  // For type "rounds": full DialogueBlock per round (no summary shortcuts)
  "rounds"?: { "roundNumber": number, "dialogue": DialogueBlock }[],
  // Required for type "closing":
  "conceptReinforcement"?: string,   // one line explicitly naming at least one entry from prod.basicInfo.coreIbKeyConcepts
  "tomorrowHook"?: string            // one-line teaser for the next session
}

DialogueBlock = {
  "aiSays": string,             // actual AI dialogue with tone marker in SQUARE BRACKETS, e.g. "[warm] Look at this!"
  "childResponses": {
    "ideal": string,
    "unexpected": string,
    "silent": string
  },
  "aiFollowUps": {
    "ideal": string,            // AI follow-up to ideal
    "unexpected": string,       // validate-then-redirect
    "silent": string            // gentle re-engagement
  },
  "screenDescription": string   // concrete, implementable description
}

Dialogue cue tags in any dialogue string MUST use square brackets, never
parentheses. This includes tone tags and timing tags, e.g. "[warm]",
"[excited]", "[wait 2s]". Branch labels such as Ideal / Unexpected /
No response are renderer labels, not content to include inside JSON values.

TagBlock = {
  "activity_id": string,                         // == bundle.activityId
  "version": 1,
  "source_entity_exemplar"?: string,             // e.g. "butterfly"
  "template_type": "cat1" | "cat5",
  "pillar": "Discovery" | "Performance" | "Mystery" | "Creation" | "Adventure" | "Connection",
  "game_style": string,
  "entity": string,
  "entity_class"?: string[],                     // e.g. ["insect", "animal"]
  "entity_binding": "bound" | "parameterized" | "agnostic",
  "tier_range": { "primary": Tier, "span": Tier[], "elasticity": string },
  "category"?: string,                            // freeform editorial, e.g. "animals"
  "attributes"?: string[],
  "key_concepts": IbKeyConcept[],
  "related_concepts"?: string[],
  "atl_skills"?: string[],
  "transdisciplinary_theme"?: string,            // e.g. "Sharing_The_Planet"
  "kud"?: { "know"?: string[], "understand"?: string[], "do"?: string[] },
  "progression": {
    "topic_axis": TopicAxis,
    "difficulty_level": 1 | 2 | 3,
    "next_step_hint"?: string,
    "reward_hook"?: string
  },
  "caregiver_role": ("scaffold" | "co-explorer" | "observer")[],
  "activity_signature": {
    "observation_angle": ObservationAngle,
    "mechanic": Mechanic,
    "entity_role": EntityRole,
    "focal_attribute": string,                  // canonical token, e.g. "butterfly_wing_pattern"
    "intro": string,                             // observer-facing one-liner; may use {entity} placeholder
    "bridge_prerequisites": {
      "primary": ObservationAngle[],            // 1-3 entries
      "secondary"?: string[]                    // 0-3 entries
    },
    "preview_label": string,
    "preview_prompt": string,
    "role_pivot_note": string                   // empty string when entity_role does not pivot
  },
  "matchability": {
    "entity_class_filter": string[],            // empty array = any class
    "tier_support": { "T0": boolean, "T1": boolean, "T2": boolean }
  }
}

Recap = {
  "payloadDefaults": {
    // Runtime placeholders — keep as {runtime_*} strings; they are not
    // resolved until the activity actually runs.
    "entity": string,                                  // "{runtime_entity}"
    "tier": string,                                    // "{runtime_tier}"
    "ageYears": string,                                // "{runtime_age}"
    "whatWeNoticed": ObservationAngle,                 // == tagBlock.activity_signature.observation_angle
    "whatWeDid": string,                                // past-tense mechanic verb (e.g. "collected", "voiced")
    "entityRole": EntityRole,                           // == tagBlock.activity_signature.entity_role
    "focalAttribute": {
      "token": string,
      "childLabel": string,
      "badgeEmojiNone": boolean
    },
    "highlightMoment": string,                          // child-facing, single sentence
    "finds"?: { "label": string, "photo": string }[],   // optional, with {runtime_*} placeholders
    "difficultyLevel": 1 | 2 | 3,
    "nextStepHint": string,
    "caregiverObserved": "scaffold" | "co-explorer" | "observer",
    "rewardBadge": string                                // canonical badge token
  },
  "rendered": {
    "title":  string,
    "line_1": string,
    "line_2": string,
    "line_3": string,
    "badge":  string,                                   // child-facing badge name
    "next":   string                                    // teaser for the next session
  }
}

Dashboard = {
  "session": {
    "axis":           TopicAxis,                      // == tagBlock.progression.topic_axis
    "angle":          ObservationAngle,               // == tagBlock.activity_signature.observation_angle
    "mechanic":       Mechanic,                       // == tagBlock.activity_signature.mechanic
    "entityRole":     EntityRole,                     // == tagBlock.activity_signature.entity_role
    "focalAttribute": string,                         // == tagBlock.activity_signature.focal_attribute
    "entryRung":      string,                         // "{runtime_entry_rung}"
    "exitRung":       string,                         // "{runtime_exit_rung}"
    "outcome":        string                          // "{runtime_outcome}"
  },
  "contributesTo": {
    "curiosityRadial":   { "axis": TopicAxis, "angle": ObservationAngle },
    "explorationMatrix": { "cell": string },          // "{mechanic} × {observation_angle}"
    "keyConceptsExposure": Partial<Record<IbKeyConcept, { "angle": ObservationAngle }>>,
    "atlSkillsTrail":     string[]
  }
}

## Closed Vocabularies

These enums are mirrored from \`activities/_schema/tag_block.schema.json\` and
\`docs/activity_vocabulary.md\`. NEVER substitute synonyms; the validator and
the matcher both reject unknown values.

- ObservationAngle (12): color, shape, size, quantity, texture, material, pattern, function, origin, behavior, emotion, state
- Mechanic (10):         enumerate, compare, collect, sort, deduce, voice, build, predict, narrate, care
- EntityRole (4):        subject, exemplar, catalyst, reference
- IbKeyConcept (7, TitleCase, used in BOTH prod.basicInfo.coreIbKeyConcepts AND tagBlock.key_concepts):
                         Form, Function, Causation, Change, Connection, Perspective, Responsibility
- TopicAxis (7, lowercase, used in tagBlock.progression.topic_axis and dashboard.session.axis):
                         form, function, causation, change, connection, perspective, responsibility
- Tier (3):              T0, T1, T2

## Cross-Doc Invariants (the validator enforces ALL of these — get them right or the bundle is rejected)

I1.  tagBlock.activity_id === bundle.activityId
I2.  prod.basicInfo.gameStyle === tagBlock.game_style
I3.  prod.basicInfo.activityCategory === tagBlock.template_type
I4.  prod.basicInfo.recommendedTier === tagBlock.tier_range.primary
I5.  spec.identity.pillar === tagBlock.pillar
I6.  spec.identity.gameStyle === tagBlock.game_style
I7.  spec.identity.{mechanic, observationAngle, entityRole} === tagBlock.activity_signature equivalents
I8.  recap.payloadDefaults.whatWeNoticed === tagBlock.activity_signature.observation_angle
I9.  recap.payloadDefaults.entityRole === tagBlock.activity_signature.entity_role
I10. dashboard.session {axis, angle, mechanic, entityRole, focalAttribute} mirror tagBlock equivalents
     (axis === tagBlock.progression.topic_axis)
I11. (pillar lowercased, template_type) → game_style matches PILLAR_STYLES per playbook §2

## Derived Fields — Author These Too

Even though the editor will surface dashboard.contributesTo and recap.payloadDefaults.whatWeDid
as derived/preview fields, you MUST author them in your output. The validator
enforces consistency between them and tagBlock; supplying the values up front
prevents another LLM round-trip.

- recap.payloadDefaults.whatWeDid: a past-tense verb form of the mechanic.
  Mapping: enumerate→counted, compare→compared, collect→collected, sort→sorted,
  deduce→deduced, voice→voiced, build→built, predict→predicted,
  narrate→narrated, care→cared.
- dashboard.contributesTo.explorationMatrix.cell: literally
  "{mechanic} × {observation_angle}" using the values from
  tagBlock.activity_signature.
- dashboard.contributesTo.curiosityRadial.{axis, angle}: copy from
  tagBlock.progression.topic_axis and tagBlock.activity_signature.observation_angle.
- dashboard.contributesTo.keyConceptsExposure: ONE entry per concept in
  tagBlock.key_concepts. Each maps to { "angle": <observation_angle> }.
- dashboard.contributesTo.atlSkillsTrail: copy tagBlock.atl_skills.

## Bridge step by generation mode

- Freeform mode: produce a single generic opener in \`warmStart\`. You MAY
  omit \`coldStart\` entirely. Bridges do not need to be grounded in a
  specific mapping dimension.
- Mapping-informed mode: produce BOTH \`warmStart\` AND \`coldStart\`. Each
  must be grounded in a specific dimension drawn from the entity's
  \`tier_guidance\` or the prompt's mapping context, and they must target
  DIFFERENT dimensions. Pick a flavor (Recall / Discovery / Curiosity /
  Challenge) from conversation_bridge.md that fits each chosen dimension.

Output ONLY the JSON object. No wrapping, no explanation.
`;

// ---------------------------------------------------------------------------
// Mode-specific guidance builders
// ---------------------------------------------------------------------------

function buildSystemContent(generationMode: GenerationMode): string {
  const sections: string[] = [
    playbookMd,
    templatesMd,
    entityGuidanceMd,
  ];
  if (generationMode === "mapping-informed") {
    sections.push(conversationBridgeMd);
  }
  sections.push(JSON_SCHEMA_INSTRUCTIONS);
  sections.push(buildReferenceBlock());
  return sections.join("\n\n---\n\n");
}

function buildReferenceBlock(): string {
  return `## Reference Bundle (canonical \`mystery_trail_butterfly\` activity)

Use this as a structural and tonal pattern. Do NOT copy its content; brainstorm fresh metaphor and dialogue for the actual entity.

### spec.md

\`\`\`markdown
${referenceBundle.spec}
\`\`\`

### prod.md

\`\`\`markdown
${referenceBundle.prod}
\`\`\`

### tag_block.yaml

\`\`\`yaml
${referenceBundle.tagBlock}
\`\`\`

### recap.template.yaml

\`\`\`yaml
${referenceBundle.recap}
\`\`\`

### dashboard.template.yaml

\`\`\`yaml
${referenceBundle.dashboard}
\`\`\`
`;
}

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
- You MUST produce BOTH \`warmStart\` AND \`coldStart\` on the bridge step. Each must reference a specific dimension drawn from the entity's \`tier_guidance\` or the entity mapping.
- The two bridges must target DIFFERENT dimensions.
- Pick a flavor from conversation_bridge.md (Recall / Discovery / Curiosity / Challenge) for each bridge based on the chosen dimension.`;
}

// ---------------------------------------------------------------------------
// Pillar capitalisation map (lowercase studio pillar → TitleCase tagBlock)
// ---------------------------------------------------------------------------

const TAG_BLOCK_PILLAR_FOR: Record<ExperiencePillar, string> = {
  mystery: "Mystery",
  creation: "Creation",
  performance: "Performance",
  discovery: "Discovery",
  adventure: "Adventure",
  // Editorial vocabulary names this pillar "Connection"; the studio's
  // experience-pillar enum names it "nurture".
  nurture: "Connection",
};

// ---------------------------------------------------------------------------
// Prompt builder
// ---------------------------------------------------------------------------

export function buildGenerateMessages(
  entity: ParsedEntity,
  category: string,
  gameStyle: string,
  pillar: ExperiencePillar,
  generationMode: GenerationMode,
): LLMMessage[] {
  const systemContent = buildSystemContent(generationMode);

  const dimensionEntries = Object.entries(entity.dimensionSummary)
    .map(([dim, count]) => `  - ${dim}: ${count} attributes`)
    .join("\n");

  const modeGuidance = buildModeGuidance(generationMode);

  const tagBlockPillar = TAG_BLOCK_PILLAR_FOR[pillar];

  const userContent = `Design a WonderLens activity bundle with the following inputs:

## Entity YAML

\`\`\`yaml
${entity.rawYaml}
\`\`\`

## Assignment Parameters

- **Entity name**: ${entity.name}
- **Category (template_type)**: ${category}
- **Game style**: ${gameStyle}
- **Experience Pillar**: ${pillar} — ${PILLAR_LABELS[pillar]}
- **TagBlock pillar (TitleCase)**: ${tagBlockPillar}
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
2. Brainstorm fresh creative variables (metaphor, focal attribute, role) specific to this entity. Do NOT copy from the reference bundle.
3. Produce a complete ActivityBundle JSON object following the exact schema described in the system prompt.
4. Set \`generationMode\` to "${generationMode}" exactly — it must match the mode listed above.
5. Set \`tagBlock.pillar\` to "${tagBlockPillar}" and \`spec.identity.pillar\` to the same value (TitleCase). Use the lowercase pillar "${pillar}" only when reasoning about pillar→style mapping.
6. Set \`tagBlock.game_style\`, \`prod.basicInfo.gameStyle\`, and \`spec.identity.gameStyle\` all to "${gameStyle}".
7. Set \`tagBlock.template_type\` and \`prod.basicInfo.activityCategory\` both to "${category}".
8. Set \`activityId\` to a lowercase snake_case identifier of the form \`${gameStyle}_<entity_token>\` (e.g. \`${gameStyle}_${slugForEntity(entity.name)}\`). Use the same value for \`tagBlock.activity_id\`.
9. Follow the mode guidance block above exactly, especially the bridge-step rules.
10. Ensure all 10 rubric dimensions pass (D1–D10). Self-evaluate and fix before outputting.
11. Output ONLY the raw JSON object. No markdown fences, no explanation.`;

  return [
    { role: "system", content: systemContent },
    { role: "user", content: userContent },
  ];
}

function slugForEntity(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "") || "entity"
  );
}
