# Phase 1: AI Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Design Studio functional end-to-end — upload YAML, generate AI design variants, edit with per-field AI assistance, re-score rubrics, and export markdown.

**Architecture:** Stateless backend (no DB). API routes call a pluggable LLM provider via the existing `src/lib/llm/` layer. Generation jobs tracked in an in-memory Map. Frontend polls for progressive variant rendering. Markdown export is pure string templating.

**Tech Stack:** Next.js 16 App Router API routes, existing Zustand store, existing Zod schemas, existing LLM provider (OpenAI + Anthropic adapters)

**Spec:** `docs/superpowers/specs/2026-03-26-phase1-ai-pipeline-design.md`

---

## File Map

### New files (13)

| File | Responsibility |
|------|---------------|
| `src/lib/prompts/generate.ts` | Build system + user messages for Pass 1 (design generation) |
| `src/lib/prompts/evaluate.ts` | Build rubric evaluation prompt for Pass 2/4 |
| `src/lib/prompts/fix.ts` | Build targeted fix prompt for Pass 3 |
| `src/lib/prompts/regenerate.ts` | Build per-field regeneration prompt |
| `src/lib/pipeline.ts` | Multi-pass generation pipeline (generate, evaluate, fix loop) |
| `src/lib/markdown-export.ts` | GameDesign JSON to spec.md / prod.md |
| `src/lib/api-client.ts` | Frontend fetch wrapper for all API routes |
| `src/app/api/upload/route.ts` | YAML upload + parse endpoint |
| `src/app/api/generate/route.ts` | Start async generation job |
| `src/app/api/generate/[jobId]/status/route.ts` | Poll generation progress |
| `src/app/api/evaluate/route.ts` | Run 9D rubric evaluation |
| `src/app/api/regenerate/route.ts` | Per-field AI regeneration |
| `src/app/api/export/route.ts` | Markdown export endpoint |

### Modified files (5)

| File | Change |
|------|--------|
| `src/lib/design-schema.ts` | Add `RubricIssue`, `VariantResult`, `GenerationJob` types + Zod schemas |
| `src/store/design-store.ts` | Add `llmProvider`, `apiKey`, `setLlmConfig` with localStorage persist |
| `src/app/gallery/[entityId]/page.tsx` | Add LLM settings bar, wire generation + polling |
| `src/app/editor/[designId]/page.tsx` | Wire evaluate, regenerate, export handlers |
| `src/components/editor/ScorecardPanel.tsx` | Add loading states for rubric + export |

---

## Task 1: Add new types to design-schema.ts

**Files:**
- Modify: `src/lib/design-schema.ts:109-162`

- [ ] **Step 1: Add RubricIssue type and schema**

Add after the `RubricScores` type (line 125):

```typescript
// ── Rubric Issue ───────────────────────────────────────────────────────────

export const rubricIssueSchema = z.object({
  dimension: z.string(),
  description: z.string(),
});

export type RubricIssue = z.infer<typeof rubricIssueSchema>;
```

- [ ] **Step 2: Add VariantResult type and schema**

Add after `RubricIssue`:

```typescript
// ── Variant Result ─────────────────────────────────────────────────────────

export const variantResultSchema = z.object({
  id: z.string(),
  design: gameDesignSchema.optional(), // undefined for failed variants
  rubricScores: rubricScoresSchema,
  issues: z.array(rubricIssueSchema),
  category: z.string(),
  gameStyle: z.string(),
  status: z.enum(["complete", "failed"]),
  error: z.string().optional(),
});

export type VariantResult = z.infer<typeof variantResultSchema>;
```

- [ ] **Step 3: Add GenerationJob type and schema**

Add after `VariantResult`:

```typescript
// ── Generation Job ─────────────────────────────────────────────────────────

export const generationJobSchema = z.object({
  id: z.string(),
  status: z.enum(["queued", "generating", "evaluating", "fixing", "complete", "failed"]),
  currentVariant: z.number(),
  totalVariants: z.number(),
  variants: z.array(variantResultSchema),
  error: z.string().optional(),
  createdAt: z.number(),
});

export type GenerationJob = z.infer<typeof generationJobSchema>;
```

- [ ] **Step 4: Verify build**

Run: `npm run build`
Expected: Build succeeds with no type errors

- [ ] **Step 5: Commit**

```bash
git add src/lib/design-schema.ts
git commit -m "feat(schema): add RubricIssue, VariantResult, GenerationJob types"
```

---

## Task 2: Add LLM config to Zustand store

**Files:**
- Modify: `src/store/design-store.ts`

- [ ] **Step 1: Add LLM config fields to the store interface**

Add to the `DesignStore` interface (after `setRubricScores`):

```typescript
  // LLM configuration
  llmProvider: LLMProviderType;
  apiKey: string;
  setLlmConfig: (provider: LLMProviderType, apiKey: string) => void;
```

Add the import at the top:

```typescript
import type { LLMProviderType } from "@/lib/llm/provider";
```

- [ ] **Step 2: Add persist middleware for LLM config and default values**

Wrap the store with `persist` middleware so `llmProvider` and `apiKey` survive page refresh. Import `persist` from `zustand/middleware`:

```typescript
import { create } from "zustand";
import { persist } from "zustand/middleware";
```

Change `create<DesignStore>((set) => ({` to:

```typescript
export const useDesignStore = create<DesignStore>()(
  persist(
    (set) => ({
      // ... all existing fields ...

      llmProvider: "anthropic",
      apiKey: "",
      setLlmConfig: (provider, apiKey) => set({ llmProvider: provider, apiKey }),
    }),
    {
      name: "design-studio-store",
      partialize: (state) => ({
        llmProvider: state.llmProvider,
        apiKey: state.apiKey,
      }),
    }
  )
);
```

Only `llmProvider` and `apiKey` are persisted to localStorage. All other state (designs, variants, etc.) remains ephemeral.

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: Build succeeds

- [ ] **Step 4: Commit**

```bash
git add src/store/design-store.ts
git commit -m "feat(store): add LLM provider config to Zustand store"
```

---

## Task 3: Build prompt builders

**Files:**
- Create: `src/lib/prompts/generate.ts`
- Create: `src/lib/prompts/evaluate.ts`
- Create: `src/lib/prompts/fix.ts`
- Create: `src/lib/prompts/regenerate.ts`

- [ ] **Step 1: Create generate.ts — Pass 1 prompt builder**

Read data files at module scope via `fs.readFileSync`. Build system message from `program.md` + `templates.md` + `entity_guidance.md` + `game_styles.md` + `conversation_bridge.md`. Build user message from entity YAML + category + game style. Include JSON schema instructions matching `gameDesignSchema`.

```typescript
import fs from "fs";
import path from "path";
import type { LLMMessage } from "@/lib/llm/provider";
import type { ParsedEntity } from "@/lib/yaml-parser";

const DATA_DIR = path.join(process.cwd(), "data");

const PROGRAM_MD = fs.readFileSync(path.join(DATA_DIR, "program.md"), "utf-8");
const TEMPLATES_MD = fs.readFileSync(path.join(DATA_DIR, "templates.md"), "utf-8");
const ENTITY_GUIDANCE_MD = fs.readFileSync(path.join(DATA_DIR, "entity_guidance.md"), "utf-8");
const GAME_STYLES_MD = fs.readFileSync(path.join(DATA_DIR, "game_styles.md"), "utf-8");
const CONVERSATION_BRIDGE_MD = fs.readFileSync(path.join(DATA_DIR, "conversation_bridge.md"), "utf-8");

const JSON_SCHEMA_INSTRUCTIONS = `
You MUST output valid JSON matching this exact TypeScript interface:

interface GameDesign {
  basicInfo: {
    activityName: string;
    category: "cat1" | "cat5";
    tier: "T0" | "T1" | "T2";
    triggerEntity: string;
    triggerScene: string;
    coreKeyConcepts: string[];
    relatedConcepts: string[];
    atlSkills: string[];
    gameStyle: string;
    ibTheme: string;
  };
  creativeVariables: {
    metaphor: string;
    roleTitle: string;
    gameMechanic: string;
    scenarioType: string;
    targetResponseType: string;
    escalationAxis: string;
    visualFeature?: string;
    collectionCriterion?: string;
    synthesisType?: "narrative" | "classification";
    stuckHint?: string;
    reflectiveQuestion?: string;
  };
  overview: {
    briefDescription: string;
    kud: { know: string[]; understand: string[]; do: string[] };
    designHighlight: string;
    typicalScenario: string;
  };
  steps: Array<{
    stepNumber: number;
    title: string;
    type: "bridge" | "rules" | "rounds" | "celebration" | "closing";
    warmStart?: DialogueBlock;
    coldStart?: DialogueBlock;
    dialogue?: DialogueBlock;
    rounds?: Array<{ roundNumber: number; dialogue: DialogueBlock }>;
  }>;
  entityMapping: {
    mappingSource: string;
    anchorDimensions: string[];
    conversationAnchorDimensions: string[];
    themes: string[];
    keyConcepts: string[];
  };
}

interface DialogueBlock {
  aiSays: string;
  childResponses: { ideal: string; unexpected: string; silent: string };
  aiFollowUps: { ideal: string; unexpected: string; silent: string };
  screenDescription: string;
}

Output ONLY the JSON object, no markdown fences, no explanation.
`;

export function buildGenerateMessages(
  entity: ParsedEntity,
  category: string,
  gameStyle: string
): LLMMessage[] {
  const systemContent = [
    PROGRAM_MD,
    "\n---\n",
    TEMPLATES_MD,
    "\n---\n",
    ENTITY_GUIDANCE_MD,
    "\n---\n",
    GAME_STYLES_MD,
    "\n---\n",
    CONVERSATION_BRIDGE_MD,
    "\n---\n",
    JSON_SCHEMA_INSTRUCTIONS,
  ].join("\n");

  const userContent = [
    `Entity YAML:\n\`\`\`yaml\n${entity.rawYaml}\n\`\`\``,
    `Category: ${category}`,
    `Game Style: ${gameStyle}`,
    `Entity Name: ${entity.name}`,
    `Available Tiers: ${entity.tiers.join(", ")}`,
    `Themes: ${entity.themes.join(", ")}`,
    `Key Concepts: ${entity.keyConcepts.join(", ")}`,
    "",
    "Generate a complete GameDesign JSON for this entity, category, and game style.",
    "Pick the most appropriate tier based on the entity and game style.",
  ].join("\n");

  return [
    { role: "system", content: systemContent },
    { role: "user", content: userContent },
  ];
}
```

- [ ] **Step 2: Create evaluate.ts — Pass 2/4 rubric evaluation prompt**

```typescript
import type { LLMMessage } from "@/lib/llm/provider";
import type { GameDesign } from "@/lib/design-schema";

const RUBRIC_SYSTEM = `You are a quality evaluator for WonderLens educational activity designs.

Evaluate the provided GameDesign JSON against these 9 dimensions:

D1 — Technical Constraints: Step count matches category template (Cat1: 5 steps, Cat5: 5 steps). Round count within range (3-5). All required fields present.
D2 — Hook Rule: Step 1 (bridge) references specific entity attributes from the YAML. Warm start builds on prior conversation context.
D3 — Transition Naturalness: Transitions between steps feel organic, not abrupt. Game introduction flows naturally from the bridge.
D4 — Edge Case Handling: All 3 response paths (ideal, unexpected, silent) are distinct and appropriate. Silent responses include encouraging re-engagement.
D5 — IB Alignment: Core key concepts are genuinely woven into the activity, not just name-dropped. ATL skills are exercised through gameplay.
D6 — Tier Appropriateness: Language complexity, sentence length, and cognitive demands match the target tier (T0/T1/T2).
D7 — Dialogue Quality: AI utterances are warm, age-appropriate, and varied. Avoid repetitive phrasing across rounds.
D8 — Screen Descriptions: Every step has a screen description. Descriptions are specific enough for a UI designer to implement.
D9 — Entity Mapping Alignment: Creative variables (metaphor, role, game mechanic) connect meaningfully to the entity's attributes and dimensions.

For each dimension, output "pass" or "fail".
If a dimension fails, provide a specific description of what went wrong and how to fix it.

Output ONLY valid JSON matching this format:
{
  "scores": { "d1": "pass"|"fail", "d2": "pass"|"fail", ..., "d9": "pass"|"fail" },
  "issues": [{ "dimension": "d3", "description": "Step 2 to Step 3 transition is abrupt..." }]
}

The "issues" array should only contain entries for dimensions that FAIL. If all pass, issues should be empty.
Output ONLY the JSON object, no markdown fences, no explanation.`;

export function buildEvaluateMessages(design: GameDesign): LLMMessage[] {
  return [
    { role: "system", content: RUBRIC_SYSTEM },
    { role: "user", content: JSON.stringify(design, null, 2) },
  ];
}
```

- [ ] **Step 3: Create fix.ts — Pass 3 targeted fix prompt**

```typescript
import fs from "fs";
import path from "path";
import type { LLMMessage } from "@/lib/llm/provider";
import type { GameDesign, RubricIssue } from "@/lib/design-schema";

const DATA_DIR = path.join(process.cwd(), "data");
const PROGRAM_MD = fs.readFileSync(path.join(DATA_DIR, "program.md"), "utf-8");
const TEMPLATES_MD = fs.readFileSync(path.join(DATA_DIR, "templates.md"), "utf-8");

const FIX_INSTRUCTIONS = `You are fixing a WonderLens activity design that failed quality evaluation.

Below is the current design JSON and the specific issues found. Fix ONLY the failing dimensions while preserving everything else. Return the complete revised GameDesign JSON.

Output ONLY the revised JSON object, no markdown fences, no explanation.`;

export function buildFixMessages(
  design: GameDesign,
  issues: RubricIssue[]
): LLMMessage[] {
  const systemContent = [
    PROGRAM_MD,
    "\n---\n",
    TEMPLATES_MD,
    "\n---\n",
    FIX_INSTRUCTIONS,
  ].join("\n");

  const issueList = issues
    .map((i) => `- ${i.dimension.toUpperCase()}: ${i.description}`)
    .join("\n");

  const userContent = [
    "Current design:\n```json",
    JSON.stringify(design, null, 2),
    "```\n",
    "Issues to fix:",
    issueList,
    "",
    "Return the COMPLETE revised GameDesign JSON with these issues fixed.",
  ].join("\n");

  return [
    { role: "system", content: systemContent },
    { role: "user", content: userContent },
  ];
}
```

- [ ] **Step 4: Create regenerate.ts — per-field regeneration prompt**

```typescript
import type { LLMMessage } from "@/lib/llm/provider";
import type { GameDesign } from "@/lib/design-schema";

const REGEN_SYSTEM = `You are an AI assistant helping refine a WonderLens activity design.

The user wants to regenerate a specific field in the design. You will receive:
1. The full current design (for context)
2. The specific field path being regenerated
3. The user's comment/feedback about what they want changed

Return ONLY the new value for that specific field. Match the expected type:
- If the field is a string, return a plain string (no quotes, no JSON wrapper)
- If the field is an array of strings, return a JSON array
- If the field is a DialogueBlock object, return the full JSON object
- If the field is a nested object, return the full JSON object

Do NOT return the entire design — only the value for the specified field.
No markdown fences, no explanation — just the value.`;

export function buildRegenerateMessages(
  design: GameDesign,
  fieldPath: string,
  comment: string
): LLMMessage[] {
  const userContent = [
    "Full design context:\n```json",
    JSON.stringify(design, null, 2),
    "```\n",
    `Field to regenerate: ${fieldPath}`,
    `User feedback: ${comment}`,
    "",
    "Return ONLY the new value for this field.",
  ].join("\n");

  return [
    { role: "system", content: REGEN_SYSTEM },
    { role: "user", content: userContent },
  ];
}
```

- [ ] **Step 5: Verify build**

Run: `npm run build`
Expected: Build succeeds

- [ ] **Step 6: Commit**

```bash
git add src/lib/prompts/
git commit -m "feat(prompts): add generation, evaluation, fix, and regeneration prompt builders"
```

---

## Task 4: Build the generation pipeline

**Files:**
- Create: `src/lib/pipeline.ts`

- [ ] **Step 1: Implement the pipeline**

```typescript
import { gameDesignSchema } from "@/lib/design-schema";
import type {
  GameDesign,
  RubricScores,
  RubricIssue,
  VariantResult,
  GenerationJob,
} from "@/lib/design-schema";
import type { LLMProvider, LLMMessage, LLMGenerateOptions } from "@/lib/llm/provider";
import type { ParsedEntity } from "@/lib/yaml-parser";
import { buildGenerateMessages } from "@/lib/prompts/generate";
import { buildEvaluateMessages } from "@/lib/prompts/evaluate";
import { buildFixMessages } from "@/lib/prompts/fix";
import { GAME_STYLES } from "@/lib/design-schema";

const MAX_FIX_ITERATIONS = 3;

function parseJsonResponse(raw: string): unknown {
  // Strip markdown fences if present
  const cleaned = raw.replace(/^```(?:json)?\s*/m, "").replace(/\s*```\s*$/m, "").trim();
  return JSON.parse(cleaned);
}

async function generateWithRetry(
  messages: LLMMessage[],
  schema: typeof gameDesignSchema,
  provider: LLMProvider,
  options: LLMGenerateOptions
): Promise<GameDesign> {
  const raw = await provider.generate(messages, options);
  try {
    const parsed = parseJsonResponse(raw);
    return schema.parse(parsed);
  } catch (firstError) {
    // Retry once with error correction prompt
    const retryMessages: LLMMessage[] = [
      ...messages,
      { role: "assistant", content: raw },
      {
        role: "user",
        content: `Your previous response was not valid JSON or did not match the required schema. Error: ${firstError instanceof Error ? firstError.message : String(firstError)}\n\nPlease return ONLY a corrected JSON object matching the schema.`,
      },
    ];
    const retryRaw = await provider.generate(retryMessages, options);
    const retryParsed = parseJsonResponse(retryRaw);
    return schema.parse(retryParsed);
  }
}

async function passGenerate(
  entity: ParsedEntity,
  category: string,
  gameStyle: string,
  provider: LLMProvider
): Promise<GameDesign> {
  const messages = buildGenerateMessages(entity, category, gameStyle);
  return generateWithRetry(messages, gameDesignSchema, provider, { jsonMode: true, temperature: 0.8 });
}

interface EvaluationResult {
  scores: RubricScores;
  issues: RubricIssue[];
}

async function passEvaluate(
  design: GameDesign,
  provider: LLMProvider
): Promise<EvaluationResult> {
  const messages = buildEvaluateMessages(design);
  const raw = await provider.generate(messages, { jsonMode: true, temperature: 0.2 });
  const parsed = parseJsonResponse(raw) as { scores: RubricScores; issues: RubricIssue[] };
  return { scores: parsed.scores, issues: parsed.issues ?? [] };
}

async function passFix(
  design: GameDesign,
  issues: RubricIssue[],
  provider: LLMProvider
): Promise<GameDesign> {
  const messages = buildFixMessages(design, issues);
  return generateWithRetry(messages, gameDesignSchema, provider, { jsonMode: true, temperature: 0.5 });
}

function hasFailures(scores: RubricScores): boolean {
  return Object.values(scores).some((s) => s === "fail");
}

export async function generateVariant(
  entity: ParsedEntity,
  category: string,
  gameStyle: string,
  provider: LLMProvider
): Promise<VariantResult> {
  // Pass 1: Generate
  let design = await passGenerate(entity, category, gameStyle, provider);

  // Pass 2: Evaluate
  let evaluation = await passEvaluate(design, provider);

  // Pass 3-4: Fix loop (max 3 iterations)
  let iterations = 0;
  while (hasFailures(evaluation.scores) && iterations < MAX_FIX_ITERATIONS) {
    design = await passFix(design, evaluation.issues, provider);
    evaluation = await passEvaluate(design, provider);
    iterations++;
  }

  return {
    id: crypto.randomUUID(),
    design,
    rubricScores: evaluation.scores,
    issues: evaluation.issues,
    category,
    gameStyle,
    status: "complete",
  };
}

export function selectVariantConfigs(
  maxVariants: number = 4
): Array<{ category: string; gameStyle: string }> {
  const configs: Array<{ category: string; gameStyle: string }> = [];

  // Pick one Cat 1 and one Cat 5 first for variety
  configs.push({ category: "cat1", gameStyle: GAME_STYLES.cat1[0] });
  configs.push({ category: "cat5", gameStyle: GAME_STYLES.cat5[0] });

  // Fill remaining from unused styles
  for (const style of GAME_STYLES.cat1.slice(1)) {
    if (configs.length >= maxVariants) break;
    configs.push({ category: "cat1", gameStyle: style });
  }
  for (const style of GAME_STYLES.cat5.slice(1)) {
    if (configs.length >= maxVariants) break;
    configs.push({ category: "cat5", gameStyle: style });
  }

  return configs.slice(0, maxVariants);
}

export async function runGenerationJob(
  job: GenerationJob,
  entity: ParsedEntity,
  variantConfigs: Array<{ category: string; gameStyle: string }>,
  provider: LLMProvider
): Promise<void> {
  job.status = "generating";
  job.totalVariants = variantConfigs.length;

  for (let i = 0; i < variantConfigs.length; i++) {
    job.currentVariant = i + 1;
    const config = variantConfigs[i];

    try {
      const result = await generateVariant(
        entity,
        config.category,
        config.gameStyle,
        provider
      );
      job.variants.push(result);
    } catch (err) {
      job.variants.push({
        id: crypto.randomUUID(),
        design: undefined,
        rubricScores: {
          d1: "fail", d2: "fail", d3: "fail", d4: "fail", d5: "fail",
          d6: "fail", d7: "fail", d8: "fail", d9: "fail",
        },
        issues: [],
        category: config.category,
        gameStyle: config.gameStyle,
        status: "failed",
        error: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  job.status = "complete";
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add src/lib/pipeline.ts
git commit -m "feat(pipeline): implement multi-pass generation pipeline with fix loop"
```

---

## Task 5: Build markdown export

**Files:**
- Create: `src/lib/markdown-export.ts`

- [ ] **Step 1: Implement exportSpec and exportProd**

Refer to `data/transform.md` for the production format rules. The spec format outputs the full design; the prod format condenses rounds and strips scorecard.

```typescript
import type { GameDesign, DialogueBlock, Step, Round } from "@/lib/design-schema";
import { CATEGORY_LABELS, TIER_LABELS } from "@/lib/design-schema";

function formatDialogueBlock(db: DialogueBlock, indent: string = ""): string {
  return [
    `${indent}**AI Says:** ${db.aiSays}`,
    `${indent}**Child Responses:**`,
    `${indent}  - Ideal: ${db.childResponses.ideal}`,
    `${indent}  - Unexpected: ${db.childResponses.unexpected}`,
    `${indent}  - Silent: ${db.childResponses.silent}`,
    `${indent}**AI Follow-ups:**`,
    `${indent}  - Ideal: ${db.aiFollowUps.ideal}`,
    `${indent}  - Unexpected: ${db.aiFollowUps.unexpected}`,
    `${indent}  - Silent: ${db.aiFollowUps.silent}`,
    `${indent}**Screen:** ${db.screenDescription}`,
  ].join("\n");
}

function formatStep(step: Step): string {
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

function formatRoundSummary(round: Round): string {
  const aiSaysPreview = round.dialogue.aiSays.length > 80
    ? round.dialogue.aiSays.slice(0, 80) + "..."
    : round.dialogue.aiSays;
  return `- **Round ${round.roundNumber}:** ${aiSaysPreview}`;
}

function formatStepProd(step: Step): string {
  const lines: string[] = [];
  lines.push(`### Step ${step.stepNumber}: ${step.title}`);

  if (step.type === "bridge") {
    if (step.warmStart) {
      lines.push("\n**Warm Start:**");
      lines.push(formatDialogueBlock(step.warmStart));
    }
    if (step.coldStart) {
      lines.push("\n**Cold Start:**");
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

export function exportSpec(design: GameDesign): string {
  const bi = design.basicInfo;
  const cv = design.creativeVariables;
  const ov = design.overview;

  const sections: string[] = [];

  // Basic Info
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

  // Overview
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
  if (cv.visualFeature) sections.push(`- **Visual Feature:** ${cv.visualFeature}`);
  if (cv.collectionCriterion) sections.push(`- **Collection Criterion:** ${cv.collectionCriterion}`);
  if (cv.synthesisType) sections.push(`- **Synthesis Type:** ${cv.synthesisType}`);
  if (cv.stuckHint) sections.push(`- **Stuck Hint:** ${cv.stuckHint}`);
  if (cv.reflectiveQuestion) sections.push(`- **Reflective Question:** ${cv.reflectiveQuestion}`);

  // Steps
  sections.push(`\n## Activity Steps\n`);
  for (const step of design.steps) {
    sections.push(formatStep(step));
    sections.push("");
  }

  // Entity Mapping
  const em = design.entityMapping;
  sections.push(`## Entity Mapping\n`);
  sections.push(`- **Mapping Source:** ${em.mappingSource}`);
  sections.push(`- **Anchor Dimensions:** ${em.anchorDimensions.join(", ")}`);
  sections.push(`- **Conversation Anchor Dimensions:** ${em.conversationAnchorDimensions.join(", ")}`);
  sections.push(`- **Themes:** ${em.themes.join(", ")}`);
  sections.push(`- **Key Concepts:** ${em.keyConcepts.join(", ")}`);

  return sections.join("\n");
}

export function exportProd(design: GameDesign): string {
  const bi = design.basicInfo;
  const ov = design.overview;

  const sections: string[] = [];

  // 7-row Basic Info table per transform.md
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

  // Overview (trimmed)
  sections.push(`\n## Activity Overview\n`);
  sections.push(ov.briefDescription);

  // KUD
  sections.push(`\n## KUD\n`);
  sections.push(`**Know:** ${ov.kud.know.join("; ")}`);
  sections.push(`**Understand:** ${ov.kud.understand.join("; ")}`);
  sections.push(`**Do:** ${ov.kud.do.join("; ")}`);

  // Steps (prod format: condensed rounds, compressed screen descriptions)
  sections.push(`\n## Activity Steps\n`);
  for (const step of design.steps) {
    sections.push(formatStepProd(step));
    sections.push("");
  }

  return sections.join("\n");
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add src/lib/markdown-export.ts
git commit -m "feat(export): implement spec and prod markdown export"
```

---

## Task 6: Build API routes

**Files:**
- Create: `src/app/api/upload/route.ts`
- Create: `src/app/api/generate/route.ts`
- Create: `src/app/api/generate/[jobId]/status/route.ts`
- Create: `src/app/api/evaluate/route.ts`
- Create: `src/app/api/regenerate/route.ts`
- Create: `src/app/api/export/route.ts`

- [ ] **Step 1: Create /api/upload/route.ts**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { parseEntityYaml } from "@/lib/yaml-parser";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!file.name.endsWith(".yaml") && !file.name.endsWith(".yml")) {
      return NextResponse.json({ error: "File must be .yaml or .yml" }, { status: 400 });
    }

    const content = await file.text();
    const entity = parseEntityYaml(content);
    return NextResponse.json(entity);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to parse YAML";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
```

- [ ] **Step 2: Create the in-memory job store and /api/generate/route.ts**

```typescript
import { NextRequest, NextResponse } from "next/server";
import type { GenerationJob } from "@/lib/design-schema";
import { createLLMProvider } from "@/lib/llm/provider";
import type { LLMProviderType } from "@/lib/llm/provider";
import { parseEntityYaml } from "@/lib/yaml-parser";
import { runGenerationJob, selectVariantConfigs } from "@/lib/pipeline";

// In-memory job store
const jobs = new Map<string, GenerationJob>();

// TTL cleanup: remove completed/failed jobs older than 30 minutes
function cleanupJobs() {
  const now = Date.now();
  const TTL = 30 * 60 * 1000;
  for (const [id, job] of jobs) {
    if ((job.status === "complete" || job.status === "failed") && now - job.createdAt > TTL) {
      jobs.delete(id);
    }
  }
}

// Export for the status route to access
export { jobs, cleanupJobs };

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { entity: entityYaml, variantConfigs, llmProvider, apiKey } = body as {
      entity: string;
      variantConfigs?: Array<{ category: string; gameStyle: string }>;
      llmProvider: LLMProviderType;
      apiKey: string;
    };

    if (!entityYaml || !llmProvider || !apiKey) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    cleanupJobs();

    const entity = parseEntityYaml(entityYaml);
    const provider = createLLMProvider(llmProvider, apiKey);
    const configs = variantConfigs ?? selectVariantConfigs(4);

    const job: GenerationJob = {
      id: crypto.randomUUID(),
      status: "queued",
      currentVariant: 0,
      totalVariants: configs.length,
      variants: [],
      createdAt: Date.now(),
    };

    jobs.set(job.id, job);

    // Fire-and-forget — errors caught inside runGenerationJob
    runGenerationJob(job, entity, configs, provider).catch((err) => {
      job.status = "failed";
      job.error = err instanceof Error ? err.message : "Job failed";
    });

    return NextResponse.json({ jobId: job.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to start generation";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

- [ ] **Step 3: Create /api/generate/[jobId]/status/route.ts**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { jobs, cleanupJobs } from "../../route";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  cleanupJobs();

  const { jobId } = await params;
  const job = jobs.get(jobId);

  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: job.id,
    status: job.status,
    currentVariant: job.currentVariant,
    totalVariants: job.totalVariants,
    variants: job.variants,
    error: job.error,
  });
}
```

- [ ] **Step 4: Create /api/evaluate/route.ts**

```typescript
import { NextRequest, NextResponse } from "next/server";
import type { GameDesign } from "@/lib/design-schema";
import { gameDesignSchema, rubricScoresSchema, rubricIssueSchema } from "@/lib/design-schema";
import { createLLMProvider } from "@/lib/llm/provider";
import type { LLMProviderType } from "@/lib/llm/provider";
import { buildEvaluateMessages } from "@/lib/prompts/evaluate";
import { z } from "zod";

const evaluationResponseSchema = z.object({
  scores: rubricScoresSchema,
  issues: z.array(rubricIssueSchema),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { design, llmProvider, apiKey } = body as {
      design: GameDesign;
      llmProvider: LLMProviderType;
      apiKey: string;
    };

    const validatedDesign = gameDesignSchema.parse(design);
    const provider = createLLMProvider(llmProvider, apiKey);
    const messages = buildEvaluateMessages(validatedDesign);
    const raw = await provider.generate(messages, { jsonMode: true, temperature: 0.2 });

    const cleaned = raw.replace(/^```(?:json)?\s*/m, "").replace(/\s*```\s*$/m, "").trim();
    const parsed = evaluationResponseSchema.parse(JSON.parse(cleaned));

    return NextResponse.json({
      rubricScores: parsed.scores,
      issues: parsed.issues,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Evaluation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

- [ ] **Step 5: Create /api/regenerate/route.ts**

```typescript
import { NextRequest, NextResponse } from "next/server";
import type { GameDesign } from "@/lib/design-schema";
import { gameDesignSchema } from "@/lib/design-schema";
import { createLLMProvider } from "@/lib/llm/provider";
import type { LLMProviderType } from "@/lib/llm/provider";
import { buildRegenerateMessages } from "@/lib/prompts/regenerate";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { design, fieldPath, comment, llmProvider, apiKey } = body as {
      design: GameDesign;
      fieldPath: string;
      comment: string;
      llmProvider: LLMProviderType;
      apiKey: string;
    };

    const validatedDesign = gameDesignSchema.parse(design);
    const provider = createLLMProvider(llmProvider, apiKey);
    const messages = buildRegenerateMessages(validatedDesign, fieldPath, comment);
    const raw = await provider.generate(messages, { temperature: 0.7 });

    // Try to parse as JSON first (for objects/arrays), fall back to raw string
    let updatedValue: unknown;
    const cleaned = raw.replace(/^```(?:json)?\s*/m, "").replace(/\s*```\s*$/m, "").trim();
    try {
      updatedValue = JSON.parse(cleaned);
    } catch {
      updatedValue = cleaned;
    }

    // Validate against the sub-schema for this field path if possible.
    // For known nested types (e.g., DialogueBlock at steps.*.dialogue),
    // parse with the corresponding Zod schema. For simple string fields,
    // the raw string is valid as-is.
    // Full sub-schema resolution is best-effort; malformed values will
    // be caught by the frontend or on next rubric evaluation.

    return NextResponse.json({ updatedValue });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Regeneration failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

- [ ] **Step 6: Create /api/export/route.ts**

```typescript
import { NextRequest, NextResponse } from "next/server";
import type { GameDesign } from "@/lib/design-schema";
import { gameDesignSchema } from "@/lib/design-schema";
import { exportSpec, exportProd } from "@/lib/markdown-export";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { design, format } = body as {
      design: GameDesign;
      format: "spec" | "prod" | "both";
    };

    const validatedDesign = gameDesignSchema.parse(design);

    const result: { specMd?: string; prodMd?: string } = {};

    if (format === "spec" || format === "both") {
      result.specMd = exportSpec(validatedDesign);
    }
    if (format === "prod" || format === "both") {
      result.prodMd = exportProd(validatedDesign);
    }

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Export failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

- [ ] **Step 7: Verify build**

Run: `npm run build`
Expected: Build succeeds

- [ ] **Step 8: Commit**

```bash
git add src/app/api/
git commit -m "feat(api): implement all 6 API route handlers"
```

---

## Task 7: Build the API client

**Files:**
- Create: `src/lib/api-client.ts`

- [ ] **Step 1: Implement the fetch wrapper**

```typescript
import type { ParsedEntity } from "@/lib/yaml-parser";
import type { GenerationJob, RubricScores, RubricIssue } from "@/lib/design-schema";
import type { GameDesign } from "@/lib/design-schema";
import type { LLMProviderType } from "@/lib/llm/provider";

interface ApiError {
  error: string;
}

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  const data = await res.json();
  if (!res.ok) {
    throw new Error((data as ApiError).error || `API error: ${res.status}`);
  }
  return data as T;
}

export async function uploadYaml(file: File): Promise<ParsedEntity> {
  const formData = new FormData();
  formData.append("file", file);
  return apiFetch<ParsedEntity>("/api/upload", {
    method: "POST",
    body: formData,
  });
}

export interface GenerateParams {
  entityYaml: string;
  variantConfigs?: Array<{ category: string; gameStyle: string }>;
  llmProvider: LLMProviderType;
  apiKey: string;
}

export async function startGeneration(params: GenerateParams): Promise<string> {
  const data = await apiFetch<{ jobId: string }>("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      entity: params.entityYaml,
      variantConfigs: params.variantConfigs,
      llmProvider: params.llmProvider,
      apiKey: params.apiKey,
    }),
  });
  return data.jobId;
}

export async function pollGenerationStatus(jobId: string): Promise<GenerationJob> {
  return apiFetch<GenerationJob>(`/api/generate/${jobId}/status`);
}

export interface EvaluateParams {
  design: GameDesign;
  llmProvider: LLMProviderType;
  apiKey: string;
}

export interface EvaluationResult {
  rubricScores: RubricScores;
  issues: RubricIssue[];
}

export async function evaluateDesign(params: EvaluateParams): Promise<EvaluationResult> {
  return apiFetch<EvaluationResult>("/api/evaluate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
}

export interface RegenerateParams {
  design: GameDesign;
  fieldPath: string;
  comment: string;
  llmProvider: LLMProviderType;
  apiKey: string;
}

export async function regenerateField(params: RegenerateParams): Promise<unknown> {
  const data = await apiFetch<{ updatedValue: unknown }>("/api/regenerate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  return data.updatedValue;
}

export interface ExportParams {
  design: GameDesign;
  format: "spec" | "prod" | "both";
}

export interface ExportResult {
  specMd?: string;
  prodMd?: string;
}

export async function exportDesign(params: ExportParams): Promise<ExportResult> {
  return apiFetch<ExportResult>("/api/export", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add src/lib/api-client.ts
git commit -m "feat(client): add API client fetch wrapper for all endpoints"
```

---

## Task 8: Wire gallery page to generation API

**Files:**
- Modify: `src/app/gallery/[entityId]/page.tsx`

- [ ] **Step 1: Add LLM settings bar and generation logic**

Replace the entire gallery page with the wired version. Key changes:
- Import `useDesignStore` fields for `llmProvider`, `apiKey`, `setLlmConfig`
- Add provider dropdown + API key input at the top
- "Generate Variants" button calls `startGeneration()` then polls
- Polling interval: 3 seconds, maps `VariantResult` → `DesignVariant`
- "Regenerate All" clears variants and re-triggers generation

Add these imports at the top:

```typescript
import { useState, useEffect, useRef, useCallback } from "react";
import { startGeneration, pollGenerationStatus } from "@/lib/api-client";
import type { DesignVariant } from "@/store/design-store";
```

Add LLM config state from store:

```typescript
const llmProvider = useDesignStore((s) => s.llmProvider);
const apiKey = useDesignStore((s) => s.apiKey);
const setLlmConfig = useDesignStore((s) => s.setLlmConfig);
const setVariants = useDesignStore((s) => s.setVariants);
const addVariant = useDesignStore((s) => s.addVariant);
```

Add generation state and polling:

```typescript
const [isGenerating, setIsGenerating] = useState(false);
const [generationError, setGenerationError] = useState<string | null>(null);
const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
const seenVariantIds = useRef(new Set<string>());

const stopPolling = useCallback(() => {
  if (pollingRef.current) {
    clearInterval(pollingRef.current);
    pollingRef.current = null;
  }
}, []);

useEffect(() => stopPolling, [stopPolling]);

const handleGenerate = async () => {
  if (!apiKey.trim()) {
    setGenerationError("Please enter an API key");
    return;
  }
  setIsGenerating(true);
  setGenerationError(null);
  setVariants([]);
  seenVariantIds.current.clear();

  try {
    const jobId = await startGeneration({
      entityYaml: parsedEntity.rawYaml,
      llmProvider,
      apiKey,
    });

    pollingRef.current = setInterval(async () => {
      try {
        const job = await pollGenerationStatus(jobId);

        for (const result of job.variants) {
          if (seenVariantIds.current.has(result.id)) continue;
          seenVariantIds.current.add(result.id);

          // Skip failed variants with no design data
          if (result.status === "failed" || !result.design) {
            // Optionally show a failed placeholder card
            continue;
          }

          const variant: DesignVariant = {
            id: result.id,
            design: result.design,
            rubricScores: result.rubricScores,
            isGenerating: false,
            error: undefined,
          };
          addVariant(variant);
        }

        if (job.status === "complete" || job.status === "failed") {
          stopPolling();
          setIsGenerating(false);
          if (job.status === "failed") {
            setGenerationError(job.error ?? "Generation failed");
          }
        }
      } catch {
        stopPolling();
        setIsGenerating(false);
        setGenerationError("Failed to check generation status");
      }
    }, 3000);
  } catch (err) {
    setIsGenerating(false);
    setGenerationError(err instanceof Error ? err.message : "Failed to start generation");
  }
};
```

Add LLM settings bar JSX after the header, before the variant grid:

```tsx
{/* LLM Settings */}
<div className="max-w-5xl mx-auto px-6 pt-6">
  <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 flex items-end gap-4">
    <div>
      <label className="text-gray-400 text-xs block mb-1">LLM Provider</label>
      <select
        value={llmProvider}
        onChange={(e) => setLlmConfig(e.target.value as "openai" | "anthropic", apiKey)}
        className="bg-gray-800 border border-gray-600 rounded-md px-3 py-1.5 text-gray-200 text-sm"
      >
        <option value="anthropic">Anthropic (Claude)</option>
        <option value="openai">OpenAI (GPT-4o)</option>
      </select>
    </div>
    <div className="flex-1">
      <label className="text-gray-400 text-xs block mb-1">API Key</label>
      <input
        type="password"
        value={apiKey}
        onChange={(e) => setLlmConfig(llmProvider, e.target.value)}
        placeholder="sk-..."
        className="w-full bg-gray-800 border border-gray-600 rounded-md px-3 py-1.5 text-gray-200 text-sm"
      />
    </div>
    <button
      onClick={handleGenerate}
      disabled={isGenerating || !apiKey.trim()}
      className="bg-indigo-700 hover:bg-indigo-600 disabled:opacity-50 text-white px-5 py-1.5 rounded-md text-sm font-medium"
    >
      {isGenerating ? "Generating..." : "Generate Variants"}
    </button>
  </div>
  {generationError && (
    <p className="text-red-400 text-sm mt-2">{generationError}</p>
  )}
</div>
```

Wire the "Regenerate All" button: `onClick={handleGenerate}`.

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add src/app/gallery/
git commit -m "feat(gallery): wire generation + polling with LLM settings bar"
```

---

## Task 9: Wire editor page to API

**Files:**
- Modify: `src/app/editor/[designId]/page.tsx`

- [ ] **Step 1: Wire the four handler functions**

Add imports:

```typescript
import { useState } from "react";
import { evaluateDesign, regenerateField, exportDesign } from "@/lib/api-client";
```

Add store selectors for LLM config:

```typescript
const llmProvider = useDesignStore((s) => s.llmProvider);
const apiKey = useDesignStore((s) => s.apiKey);
const setRubricScores = useDesignStore((s) => s.setRubricScores);
```

Add loading states:

```typescript
const [isEvaluating, setIsEvaluating] = useState(false);
const [isRegenerating, setIsRegenerating] = useState(false);
```

Replace `handleAskAI`:

```typescript
const handleAskAI = async (path: string, comment: string) => {
  if (!apiKey.trim() || !activeDesign) return;
  setIsRegenerating(true);
  try {
    const updatedValue = await regenerateField({
      design: activeDesign,
      fieldPath: path,
      comment: comment || `Please improve the content at ${path}`,
      llmProvider,
      apiKey,
    });
    updateField(path, updatedValue);
  } catch (err) {
    console.error("Regeneration failed:", err);
  } finally {
    setIsRegenerating(false);
  }
};
```

Replace `handleRerunRubric`:

```typescript
const handleRerunRubric = async () => {
  if (!apiKey.trim() || !activeDesign) return;
  setIsEvaluating(true);
  try {
    const result = await evaluateDesign({
      design: activeDesign,
      llmProvider,
      apiKey,
    });
    setRubricScores(result.rubricScores);
  } catch (err) {
    console.error("Evaluation failed:", err);
  } finally {
    setIsEvaluating(false);
  }
};
```

Replace `handleRegenerateWithFeedback`:

```typescript
const handleRegenerateWithFeedback = async (feedback: string) => {
  if (!apiKey.trim() || !activeDesign) return;
  setIsRegenerating(true);
  try {
    const updatedValue = await regenerateField({
      design: activeDesign,
      fieldPath: "",
      comment: feedback,
      llmProvider,
      apiKey,
    });
    if (typeof updatedValue === "object" && updatedValue !== null) {
      // If we get back a full design, replace it
      updateField("", updatedValue);
    }
  } catch (err) {
    console.error("Regeneration failed:", err);
  } finally {
    setIsRegenerating(false);
  }
};
```

Replace `handleExport`:

```typescript
const handleExport = async () => {
  if (!activeDesign) return;
  try {
    const result = await exportDesign({ design: activeDesign, format: "both" });
    // Download spec
    if (result.specMd) {
      const blob = new Blob([result.specMd], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${activeDesign.basicInfo.activityName.replace(/\s+/g, "_")}_spec.md`;
      a.click();
      URL.revokeObjectURL(url);
    }
    // Download prod
    if (result.prodMd) {
      const blob = new Blob([result.prodMd], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${activeDesign.basicInfo.activityName.replace(/\s+/g, "_")}_prod.md`;
      a.click();
      URL.revokeObjectURL(url);
    }
  } catch (err) {
    console.error("Export failed:", err);
  }
};
```

Pass `isEvaluating` to ScorecardPanel:

```tsx
<ScorecardPanel
  scores={rubricScores}
  onRerunRubric={handleRerunRubric}
  onRegenerateWithFeedback={handleRegenerateWithFeedback}
  onExport={handleExport}
  isEvaluating={isEvaluating}
/>
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add src/app/editor/ src/components/editor/ScorecardPanel.tsx
git commit -m "feat(editor): wire evaluate, regenerate, and export to API"
```

---

## Task 10: Final verification and cleanup

**Files:**
- All modified/created files

- [ ] **Step 1: Full build**

Run: `npm run build`
Expected: Build succeeds with no errors

- [ ] **Step 2: Lint check**

Run: `npm run lint`
Expected: No lint errors

- [ ] **Step 3: Manual smoke test**

Run: `npm run dev`

1. Visit `http://localhost:3000` — upload a YAML from `data/mappings_dev20_0318/animals/big_cats.yaml`
2. Confirm entity summary displays correctly
3. Navigate to gallery — verify LLM settings bar appears
4. (Optional) Enter an API key and click "Generate Variants" to test full pipeline

- [ ] **Step 4: Update HANDOFF.md**

Add a Phase 1 entry to HANDOFF.md covering all changes made.

- [ ] **Step 5: Commit**

```bash
git add HANDOFF.md
git commit -m "docs(handoff): add Phase 1 AI Pipeline entry"
```
