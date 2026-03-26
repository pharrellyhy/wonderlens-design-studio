# Phase 1: AI Pipeline — Spec

Covers the backend work needed to make the Design Studio functional end-to-end: API routes, multi-pass generation pipeline, prompt engineering, markdown export, and frontend wiring. All stateless (no DB) — designs live in Zustand client-side state. Persistence (Prisma, NextAuth) deferred to a later phase.

---

## 1. API Routes

Six route handlers, all returning JSON. No database. Job state held in an in-memory `Map<string, GenerationJob>`.

| Route | Method | Input | Output |
|-------|--------|-------|--------|
| `POST /api/upload` | POST | FormData (YAML file) | `ParsedEntity` JSON |
| `POST /api/generate` | POST | `{ entity, variantConfigs?, llmProvider, apiKey }` | `{ jobId }` |
| `GET /api/generate/[jobId]/status` | GET | jobId param | `{ status, currentVariant, totalVariants, variants[], error? }` |
| `POST /api/evaluate` | POST | `{ design, llmProvider, apiKey }` | `{ rubricScores: {d1..d9}, issues[] }` |
| `POST /api/regenerate` | POST | `{ design, fieldPath, comment, llmProvider, apiKey }` | `{ updatedValue }` |
| `POST /api/export` | POST | `{ design, format: 'spec'\|'prod'\|'both' }` | `{ specMd?, prodMd? }` |

### Types

```typescript
interface RubricIssue {
  dimension: string;   // e.g., "d3"
  description: string; // What failed and why
}

interface VariantResult {
  id: string;          // crypto.randomUUID()
  design: GameDesign;
  rubricScores: RubricScores;
  issues: RubricIssue[];
  category: string;
  gameStyle: string;
  status: 'complete' | 'failed';
  error?: string;
}
```

`RubricIssue` and `VariantResult` are added to `design-schema.ts` with corresponding Zod schemas.

### Mapping VariantResult to DesignVariant (Zustand store)

The existing `DesignVariant` in the store has `{ id, design, rubricScores, isGenerating, error }`. When a `VariantResult` arrives from the polling endpoint, the frontend maps it:

```typescript
const variant: DesignVariant = {
  id: result.id,
  design: result.design,
  rubricScores: result.rubricScores,
  isGenerating: false,
  error: result.status === 'failed' ? result.error : undefined,
};
```

`category` and `gameStyle` are not duplicated on `DesignVariant` — they already exist inside `design.basicInfo`.

### In-memory job store

```typescript
const jobs = new Map<string, GenerationJob>();

interface GenerationJob {
  id: string;
  status: 'queued' | 'generating' | 'evaluating' | 'fixing' | 'complete' | 'failed';
  currentVariant: number;
  totalVariants: number;
  variants: VariantResult[];
  error?: string;
  createdAt: number; // Date.now() — for TTL cleanup
}
```

**Cleanup**: A cleanup sweep runs on every `/api/generate` and `/api/generate/[jobId]/status` request. Jobs older than 30 minutes that are in `complete` or `failed` status are deleted from the map.

### Route details

**`/api/upload`** — Server-side YAML parse using existing `yaml-parser.ts`. Validates file type, returns `ParsedEntity`. Note: the frontend already does client-side parsing; this route exists for consistency and future server-side validation needs.

**`/api/generate`** — Creates a job entry in the in-memory map, returns `{ jobId }` immediately. Kicks off the multi-pass pipeline asynchronously (fire-and-forget promise wrapped in a try/catch that sets job status on failure).

Variant config selection:
- If `variantConfigs` is provided in the request, use it directly (array of `{ category, gameStyle }` pairs).
- If omitted, the server auto-generates configs: one variant per game style for both Cat 1 and Cat 5, capped at 4 variants. Selection favors variety — picks one Cat 1 style and one Cat 5 style first, then fills remaining slots from unused styles.

Error handling: If a variant pipeline throws, catch the error, mark that `VariantResult` as `failed` with the error message, and continue to the next variant. Set the job's overall status to `complete` when all variants have been attempted (even if some failed). Set job status to `failed` only if the job setup itself fails before any variant work begins.

**`/api/generate/[jobId]/status`** — Polling endpoint. Returns the current job state. Frontend polls every 3 seconds. Returns 404 if jobId not found.

**`/api/evaluate`** — Single LLM call. Sends the design JSON against the 9D rubric prompt. Returns dimension scores and identified issues.

**`/api/regenerate`** — Single LLM call. Sends the full design (for context) + the specific field path + user comment. Returns `{ updatedValue }` where the value type matches the schema at the given `fieldPath` — may be a string, string array, or nested object (e.g., a `DialogueBlock`). The pipeline validates the returned value against the appropriate Zod sub-schema for that field path before returning it. The `api-client.ts` function returns `Promise<unknown>` and the frontend casts after Zod validation.

**`/api/export`** — No LLM. Calls `exportSpec()` and/or `exportProd()` from `markdown-export.ts`. Returns markdown strings.

---

## 2. Generation Pipeline

### Multi-pass pipeline (per variant)

```
Pass 1: Generate
  System: program.md + templates.md + entity_guidance.md + game_styles.md + conversation_bridge.md
  User: entity YAML + category + game style
  Output: GameDesign JSON

Pass 2: Evaluate
  System: 9D rubric definitions (from program.md)
  User: GameDesign JSON
  Output: { scores: {d1..d9: pass|fail}, issues: RubricIssue[] }

Pass 3: Fix (only if any dimension failed)
  System: Pass 1 system prompt + failing dimensions + issue descriptions
  User: current GameDesign JSON + fix instructions
  Output: revised GameDesign JSON

Pass 4: Re-evaluate
  Same as Pass 2. Loop to Pass 3 if still failing.
  Max 3 fix iterations, then accept with current scores.
```

### Variant generation

- 2-4 variants per generation job, each with a different category x game style combination
- Variants run sequentially to avoid rate limits and keep cost predictable
- Each variant's result stored in the in-memory job as soon as its pipeline completes (progressive rendering via polling)

### Pipeline implementation

New file: `src/lib/pipeline.ts`

```typescript
async function generateVariant(
  entity: ParsedEntity,
  category: string,
  gameStyle: string,
  provider: LLMProvider
): Promise<VariantResult>

async function runGenerationJob(
  job: GenerationJob,
  entity: ParsedEntity,
  variantConfigs: Array<{ category: string; gameStyle: string }>,
  provider: LLMProvider
): Promise<void>
```

`runGenerationJob` iterates over variant configs, calls `generateVariant` for each, updates the job state after each variant completes. If a variant throws, the error is caught, that variant is marked `failed`, and the loop continues. The `/api/generate` route calls this in a fire-and-forget pattern.

---

## 3. Prompt Engineering

### Files: `src/lib/prompts/`

| File | Purpose |
|------|---------|
| `generate.ts` | Builds system + user messages for Pass 1. Loads data files, includes JSON output schema. |
| `evaluate.ts` | Builds rubric evaluation prompt for Pass 2/4. Extracts D1-D9 definitions. |
| `fix.ts` | Builds targeted fix prompt for Pass 3 using failing dimensions + issues. |
| `regenerate.ts` | Builds per-field regeneration prompt for `/api/regenerate`. |

### Data file loading

Data files are read once at module import via `fs.readFileSync` and cached in module-scope constants:
- `data/program.md`
- `data/templates.md`
- `data/entity_guidance.md`
- `data/game_styles.md`
- `data/conversation_bridge.md`
- `data/transform.md`

Not re-read per request.

### JSON output enforcement

All generation prompts include explicit JSON format instructions describing the expected shape (matching the Zod schema from `design-schema.ts`). The pipeline parses LLM output with `JSON.parse()` and validates with Zod. On parse failure, retry once with an error correction prompt before marking the variant as failed.

---

## 4. Markdown Export

### File: `src/lib/markdown-export.ts`

Two functions:

- `exportSpec(design: GameDesign): string` — Full spec format following `data/templates.md` structure: Basic Info table (fields per template), all steps with complete dialogue blocks, all rounds fully expanded, creative variables, KUD table
- `exportProd(design: GameDesign): string` — Condensed prod format per `data/transform.md` rules: condense rounds to 1-line summaries (except Round 1), compress screen descriptions, strip scorecard

Pure string templating. No LLM calls.

---

## 5. Frontend Wiring

### LLM Configuration in Zustand Store

Add to the existing design store:

```typescript
// LLM config (persisted in localStorage via Zustand persist middleware)
llmProvider: LLMProviderType;    // 'openai' | 'anthropic'
apiKey: string;
setLlmConfig: (provider: LLMProviderType, apiKey: string) => void;
```

The gallery page shows a settings bar (provider dropdown + API key input) above the variant grid. This is a simple inline form, not a separate page. The API key is stored client-side only (localStorage) and sent in request bodies to the API routes.

**Security note**: For this stateless/no-DB phase, API keys travel in request bodies over localhost. This is acceptable for local development. When Prisma/auth are added in a later phase, keys will be stored server-side (encrypted in the User model) and requests will authenticate via session instead.

### New file: `src/lib/api-client.ts`

Thin `fetch()` wrapper for all API routes. Handles JSON parsing, error extraction, and the polling loop for generation jobs.

```typescript
export async function uploadYaml(file: File): Promise<ParsedEntity>
export async function startGeneration(params: GenerateParams): Promise<string> // returns jobId
export async function pollGenerationStatus(jobId: string): Promise<GenerationJob>
export async function evaluateDesign(params: EvaluateParams): Promise<EvaluationResult>
export async function regenerateField(params: RegenerateParams): Promise<unknown>
export async function exportDesign(params: ExportParams): Promise<ExportResult>
```

### Component changes

**`src/app/page.tsx`** — No change. Client-side YAML parsing is sufficient.

**`src/app/gallery/[entityId]/page.tsx`:**
- Add LLM settings bar (provider dropdown + API key input) at the top
- "Generate Variants" calls `startGeneration()` → gets `jobId`
- Polls `pollGenerationStatus(jobId)` every 3 seconds
- As each variant arrives, maps `VariantResult` → `DesignVariant` and calls `addVariant()` on Zustand store
- Stops polling on `complete` or `failed`

**`src/app/editor/[designId]/page.tsx`:**
- `handleAskAI(fieldPath, comment)` → calls `regenerateField()` → validates with Zod sub-schema → updates store field
- `handleRerunRubric()` → calls `evaluateDesign()` → updates `rubricScores` in store
- `handleRegenerateWithFeedback(comment)` → calls `regenerateField()` with broader scope
- `handleExport()` → calls `exportDesign()` → triggers browser file download

**`src/components/editor/ScorecardPanel.tsx`:**
- Buttons call the same handler functions passed as props from the editor page
- Rubric issues from evaluation are not displayed in Phase 1 (only pass/fail scores). Issue display deferred to a future phase when the scorecard panel is expanded.

---

## 6. New Files Summary

| File | Type | Lines (est.) |
|------|------|-------------|
| `src/app/api/upload/route.ts` | API route | ~30 |
| `src/app/api/generate/route.ts` | API route | ~60 |
| `src/app/api/generate/[jobId]/status/route.ts` | API route | ~25 |
| `src/app/api/evaluate/route.ts` | API route | ~30 |
| `src/app/api/regenerate/route.ts` | API route | ~40 |
| `src/app/api/export/route.ts` | API route | ~25 |
| `src/lib/pipeline.ts` | Pipeline logic | ~140 |
| `src/lib/prompts/generate.ts` | Prompt builder | ~80 |
| `src/lib/prompts/evaluate.ts` | Prompt builder | ~60 |
| `src/lib/prompts/fix.ts` | Prompt builder | ~50 |
| `src/lib/prompts/regenerate.ts` | Prompt builder | ~50 |
| `src/lib/markdown-export.ts` | Export logic | ~150 |
| `src/lib/api-client.ts` | Fetch wrapper | ~90 |

**Total: ~13 new files, ~830 lines estimated**

### Modified files

| File | Change |
|------|--------|
| `src/lib/design-schema.ts` | Add `RubricIssue` and `VariantResult` types + Zod schemas |
| `src/store/design-store.ts` | Add `llmProvider`, `apiKey`, `setLlmConfig` fields with localStorage persist |
| `src/app/gallery/[entityId]/page.tsx` | Add LLM settings bar, wire generate + polling |
| `src/app/editor/[designId]/page.tsx` | Wire evaluate, regenerate, export handlers |
| `src/components/editor/ScorecardPanel.tsx` | Wire button handlers via props |
