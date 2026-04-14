import { z } from "zod";

import {
  ALL_PILLARS,
  PILLAR_STYLES,
  gameDesignSchema,
  rubricIssueSchema,
  rubricScoresSchema,
  styleToPillar,
} from "@/lib/design-schema";
import type {
  Category,
  ExperiencePillar,
  GameDesign,
  GenerationJob,
  GenerationMode,
  RubricIssue,
  RubricScores,
  VariantResult,
} from "@/lib/design-schema";
import type { LLMMessage, LLMProvider } from "@/lib/llm/provider";
import type { ParsedEntity } from "@/lib/yaml-parser";
import { jobs } from "@/lib/job-store";
import { buildEvaluateMessages } from "@/lib/prompts/evaluate";
import { buildFixMessages } from "@/lib/prompts/fix";
import { buildGenerateMessages } from "@/lib/prompts/generate";
import { applyD4Override } from "@/lib/rubric-checks";
import {
  createRunId,
  saveRun,
  slugifyEntity,
  type RunRecord,
} from "@/lib/runs-repository";

// ---------------------------------------------------------------------------
// Evaluate response schema
// ---------------------------------------------------------------------------

const evaluateResponseSchema = z.object({
  scores: rubricScoresSchema,
  issues: z.array(rubricIssueSchema),
});

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_FIX_ITERATIONS = 3;

/**
 * Canonical ordered tuple of the ten rubric dimension keys. Use this rather
 * than `Object.keys(scores)` / `Object.values(scores)` when computing totals
 * so a future stray property on the scores object can't silently inflate the
 * count.
 */
const DIMENSION_KEYS = [
  "d1","d2","d3","d4","d5","d6","d7","d8","d9","d10",
] as const;

// ---------------------------------------------------------------------------
// Helper: parseJsonResponse
// ---------------------------------------------------------------------------

/**
 * Strip markdown code fences if present, then JSON.parse the raw string.
 */
export function parseJsonResponse(raw: string): unknown {
  let cleaned = raw.trim();

  // Strip ```json ... ``` or ``` ... ``` fences
  const fencePattern = /^```(?:json)?\s*\n?([\s\S]*?)\n?\s*```$/;
  const match = fencePattern.exec(cleaned);
  if (match) {
    cleaned = match[1].trim();
  }

  return JSON.parse(cleaned);
}

// ---------------------------------------------------------------------------
// Internal: LLM call with JSON parse retry
// ---------------------------------------------------------------------------

/**
 * Send messages to the LLM, parse the response as JSON, and validate with a
 * Zod schema. If parsing or validation fails, retry ONCE by sending the error
 * back to the LLM asking for corrected JSON.
 */
async function llmJsonCall<T>(
  provider: LLMProvider,
  messages: LLMMessage[],
  schema: z.ZodType<T>,
  options: { temperature: number }
): Promise<T> {
  const llmOptions = {
    jsonMode: true,
    temperature: options.temperature,
  };

  const rawResponse = await provider.generate(messages, llmOptions);

  // First attempt to parse and validate
  try {
    const parsed = parseJsonResponse(rawResponse);
    return schema.parse(parsed);
  } catch (firstError) {
    const errorMessage =
      firstError instanceof Error ? firstError.message : String(firstError);

    // Retry: append assistant response + user correction request
    const retryMessages: LLMMessage[] = [
      ...messages,
      { role: "assistant", content: rawResponse },
      {
        role: "user",
        content: `Your previous JSON response failed validation with this error:\n\n${errorMessage}\n\nPlease output the corrected JSON. Output ONLY the raw JSON object, no markdown fences or explanation.`,
      },
    ];

    const retryResponse = await provider.generate(retryMessages, llmOptions);

    // Second attempt — if this fails, propagate the error
    const retryParsed = parseJsonResponse(retryResponse);
    return schema.parse(retryParsed);
  }
}

// ---------------------------------------------------------------------------
// Internal: check if any rubric dimension failed
// ---------------------------------------------------------------------------

function hasFailures(scores: RubricScores): boolean {
  return Object.values(scores).some((score) => score === "fail");
}

// ---------------------------------------------------------------------------
// Internal: extract failing issues from scores
// ---------------------------------------------------------------------------

function getFailingIssues(issues: RubricIssue[]): RubricIssue[] {
  return issues.filter((issue) => issue.dimension && issue.description);
}

// ---------------------------------------------------------------------------
// All-fail rubric scores (used for failed variants)
// ---------------------------------------------------------------------------

const ALL_FAIL_SCORES: RubricScores = Object.fromEntries(
  DIMENSION_KEYS.map((k) => [k, "fail"] as const),
) as RubricScores;

// ---------------------------------------------------------------------------
// generateVariant
// ---------------------------------------------------------------------------

/**
 * Multi-pass pipeline for a single variant:
 * 1. Generate design via LLM
 * 2. Evaluate against rubric
 * 3. Fix if any dimensions fail (up to MAX_FIX_ITERATIONS)
 * 4. Re-evaluate after each fix
 */
export async function generateVariant(
  entity: ParsedEntity,
  category: Category,
  gameStyle: string,
  generationMode: GenerationMode,
  provider: LLMProvider,
  options?: { parentDesignId?: string; designId?: string },
): Promise<VariantResult> {
  // Measure the full multi-pass duration so the persisted RunRecord can
  // carry end-to-end generation latency for later analysis.
  const startTime = Date.now();

  // Resolve experience pillar from game style
  const pillar = styleToPillar(gameStyle);
  if (!pillar) {
    throw new Error(
      `generateVariant: unknown gameStyle "${gameStyle}" — no pillar mapping`,
    );
  }

  // Pass 1 — Generate
  const generateMessages = buildGenerateMessages(
    entity,
    category,
    gameStyle,
    pillar,
    generationMode,
  );
  let design: GameDesign = await llmJsonCall(
    provider,
    generateMessages,
    gameDesignSchema,
    { temperature: 0.8 }
  );

  // Pass 2 — Evaluate (with deterministic D4 pre-check override)
  const evalMessages = buildEvaluateMessages(design);
  const llmEvaluation = await llmJsonCall(
    provider,
    evalMessages,
    evaluateResponseSchema,
    { temperature: 0.2 }
  );
  let evaluation = applyD4Override(
    llmEvaluation.scores,
    llmEvaluation.issues,
    design,
  );

  // Pass 3 & 4 — Fix loop (up to MAX_FIX_ITERATIONS)
  let fixIteration = 0;
  while (hasFailures(evaluation.scores) && fixIteration < MAX_FIX_ITERATIONS) {
    fixIteration++;

    const failingIssues = getFailingIssues(evaluation.issues);
    if (failingIssues.length === 0) {
      // Scores say fail but no issues reported — cannot fix further
      break;
    }

    // Pass 3 — Fix
    const fixMessages = buildFixMessages(design, failingIssues);
    design = await llmJsonCall(provider, fixMessages, gameDesignSchema, {
      temperature: 0.5,
    });

    // Pass 4 — Re-evaluate (same D4 override applied to the re-evaluation)
    const reEvalMessages = buildEvaluateMessages(design);
    const reLlmEvaluation = await llmJsonCall(
      provider,
      reEvalMessages,
      evaluateResponseSchema,
      { temperature: 0.2 }
    );
    evaluation = applyD4Override(
      reLlmEvaluation.scores,
      reLlmEvaluation.issues,
      design,
    );
  }

  // Callers MAY provide the target designId so that an upstream placeholder's
  // id stays in sync with the persisted RunRecord.designId. Without this the
  // placeholder id and the saved id diverge, and subsequent
  // `getRunByDesignId(placeholder.id)` lookups 404.
  const designId = options?.designId ?? crypto.randomUUID();
  const durationMs = Date.now() - startTime;

  // Persist the completed run to the dev-only filesystem store. This is the
  // ONLY place we're allowed to swallow a persistence error: a failure here
  // must not block the user receiving their successfully generated variant.
  // All other filesystem concerns live behind `runs-repository.ts`.
  const runId = createRunId();
  const totalScore = DIMENSION_KEYS.filter(
    (d) => evaluation.scores[d] === "pass",
  ).length;

  const record: RunRecord = {
    runId,
    timestamp: new Date().toISOString(),
    entity: slugifyEntity(entity.name),
    entityDisplayName: entity.name,
    category,
    gameStyle,
    generationMode,
    isOpposite: options?.parentDesignId !== undefined,
    parentRunId: options?.parentDesignId ?? null,
    rubric: evaluation.scores,
    totalScore,
    designId,
    design,
    durationMs,
    sourceEntityYaml: entity.rawYaml,
  };

  try {
    await saveRun(record);
  } catch (error) {
    console.error("[pipeline] failed to persist run", runId, error);
  }

  return {
    id: designId,
    design,
    rubricScores: evaluation.scores,
    issues: evaluation.issues,
    category,
    gameStyle,
    status: "complete",
  };
}

// ---------------------------------------------------------------------------
// selectVariantConfigs
// ---------------------------------------------------------------------------

/**
 * Auto-select pillar-diverse variant configs. Picks up to `maxVariants`
 * distinct experience pillars (capped at ALL_PILLARS.length), assigns each
 * a category (balanced cat1/cat5 split), and resolves the concrete game
 * style via PILLAR_STYLES.
 */
export function selectVariantConfigs(
  maxVariants: number = 4,
): Array<{ category: Category; gameStyle: string }> {
  const pillarPool: ExperiencePillar[] = [...ALL_PILLARS];
  shuffleArray(pillarPool);

  const pickCount = Math.min(maxVariants, pillarPool.length);
  const pickedPillars = pillarPool.slice(0, pickCount);

  // Balanced category split: ceil(N/2) cat1 + floor(N/2) cat5. On odd N
  // the extra slot goes to cat1 (arbitrary choice — documenting it so
  // single-variant callers know they always get cat1).
  const cat1Count = Math.ceil(pickCount / 2);
  const categories: Category[] = [
    ...Array<Category>(cat1Count).fill("cat1"),
    ...Array<Category>(pickCount - cat1Count).fill("cat5"),
  ];
  shuffleArray(categories);

  return pickedPillars.map((pillar, i) => ({
    category: categories[i],
    gameStyle: PILLAR_STYLES[pillar][categories[i]],
  }));
}

// ---------------------------------------------------------------------------
// runGenerationJob
// ---------------------------------------------------------------------------

/**
 * Maximum number of variants generated in parallel. Each variant runs the
 * full multi-pass pipeline (generate → evaluate → fix → re-evaluate), so the
 * effective concurrent request count against the LLM provider is up to this
 * value. Tuned conservatively to stay below typical free-tier QPS limits on
 * DashScope, OpenRouter, etc.
 */
const VARIANT_CONCURRENCY = 3;

/**
 * Run the full generation job: push placeholder VariantResults up front so
 * the UI can render the final layout immediately, then process configs
 * through a small concurrency pool, mutating each placeholder in place as it
 * completes or fails.
 */
export async function runGenerationJob(
  job: GenerationJob,
  entity: ParsedEntity,
  variantConfigs: Array<{ category: Category; gameStyle: string }>,
  generationMode: GenerationMode,
  provider: LLMProvider
): Promise<void> {
  job.status = "generating";

  // Push placeholders for every planned variant first.
  for (const config of variantConfigs) {
    job.variants.push({
      id: crypto.randomUUID(),
      category: config.category,
      gameStyle: config.gameStyle,
      status: "pending",
    });
  }

  await runWithConcurrency(
    variantConfigs,
    VARIANT_CONCURRENCY,
    async (config, index) => {
      const placeholder = job.variants[index];
      try {
        const result = await generateVariant(
          entity,
          config.category,
          config.gameStyle,
          generationMode,
          provider,
          { designId: placeholder.id },
        );
        // Mutate the placeholder in place. Because we passed the placeholder
        // id into generateVariant via options.designId, result.id is already
        // equal to placeholder.id and the saved RunRecord uses the same id.
        placeholder.design = result.design;
        placeholder.rubricScores = result.rubricScores;
        placeholder.issues = result.issues;
        placeholder.status = "complete";
        job.currentVariant = job.variants.filter(
          (v) => v.status === "complete" || v.status === "failed",
        ).length;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);

        console.error(
          `[pipeline] variant ${index + 1}/${variantConfigs.length} failed (${config.category}/${config.gameStyle}):`,
          error,
        );

        placeholder.rubricScores = ALL_FAIL_SCORES;
        placeholder.issues = [
          { dimension: "pipeline", description: errorMessage },
        ];
        placeholder.status = "failed";
        placeholder.error = errorMessage;
        job.currentVariant = job.variants.filter(
          (v) => v.status === "complete" || v.status === "failed",
        ).length;
      }
    },
  );

  const successCount = job.variants.filter((v) => v.status === "complete").length;
  if (successCount === 0 && job.variants.length > 0) {
    job.status = "failed";
    job.error = `All ${job.variants.length} variants failed to generate.`;
  } else {
    job.status = "complete";
  }
}

// ---------------------------------------------------------------------------
// Internal utility: bounded-concurrency worker pool
// ---------------------------------------------------------------------------

/**
 * Run `worker` over each item with at most `limit` invocations in flight.
 * Items are pulled in submission order; workers exit when the queue drains.
 * Errors thrown by `worker` are swallowed (the caller is expected to record
 * them on the item itself).
 */
async function runWithConcurrency<T>(
  items: T[],
  limit: number,
  worker: (item: T, index: number) => Promise<void>,
): Promise<void> {
  let next = 0;
  const runners = Array.from(
    { length: Math.min(limit, items.length) },
    async () => {
      while (true) {
        const i = next++;
        if (i >= items.length) return;
        try {
          await worker(items[i], i);
        } catch {
          // Worker is responsible for recording its own failures.
        }
      }
    },
  );
  await Promise.all(runners);
}

// ---------------------------------------------------------------------------
// Internal utility: Fisher-Yates shuffle
// ---------------------------------------------------------------------------

function shuffleArray<T>(array: T[]): void {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

// ---------------------------------------------------------------------------
// enqueueSingleVariantJob
// ---------------------------------------------------------------------------

/**
 * Enqueue a single-variant generation job. Creates the job placeholder,
 * stores it in the job map, fires the generate background closure, and
 * returns the jobId synchronously so the caller can respond with it.
 *
 * This is the shared path between:
 * - the opposite-category endpoint
 * - (future) any other single-variant dispatch, e.g., "retry this variant"
 *
 * For multi-variant batches, use `runGenerationJob` directly.
 *
 * The placeholder id is reused as the persisted `RunRecord.designId` by
 * forwarding it into `generateVariant` via `options.designId`. This keeps
 * the id the client tracks identical to the id on disk.
 */
export function enqueueSingleVariantJob(params: {
  entity: ParsedEntity;
  category: Category;
  gameStyle: string;
  generationMode: GenerationMode;
  provider: LLMProvider;
  parentDesignId?: string;
}): { jobId: string; job: GenerationJob } {
  const {
    entity,
    category,
    gameStyle,
    generationMode,
    provider,
    parentDesignId,
  } = params;

  const jobId = crypto.randomUUID();
  const placeholder: VariantResult = {
    id: crypto.randomUUID(),
    category,
    gameStyle,
    status: "pending",
  };
  const job: GenerationJob = {
    id: jobId,
    status: "queued",
    currentVariant: 0,
    totalVariants: 1,
    variants: [placeholder],
    createdAt: Date.now(),
  };
  jobs.set(jobId, job);

  // Fire-and-forget — the caller responds with the jobId immediately and the
  // client polls /api/generate/[jobId]/status for progress.
  void (async () => {
    job.status = "generating";
    try {
      const result = await generateVariant(
        entity,
        category,
        gameStyle,
        generationMode,
        provider,
        { parentDesignId, designId: placeholder.id },
      );
      placeholder.design = result.design;
      placeholder.rubricScores = result.rubricScores;
      placeholder.issues = result.issues;
      placeholder.status = "complete";
      job.currentVariant = 1;
      job.status = "complete";
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown generation error";
      placeholder.rubricScores = ALL_FAIL_SCORES;
      placeholder.issues = [
        { dimension: "pipeline", description: message },
      ];
      placeholder.status = "failed";
      placeholder.error = message;
      job.currentVariant = 1;
      job.status = "failed";
      job.error = message;
      console.error(
        `[pipeline] single-variant job ${jobId} failed:`,
        error,
      );
    }
  })();

  return { jobId, job };
}
