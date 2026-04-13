import { z } from "zod";

import {
  GAME_STYLES,
  gameDesignSchema,
  rubricIssueSchema,
  rubricScoresSchema,
} from "@/lib/design-schema";
import type {
  Category,
  GameDesign,
  GenerationJob,
  GenerationMode,
  RubricIssue,
  RubricScores,
  VariantResult,
} from "@/lib/design-schema";
import type { LLMMessage, LLMProvider } from "@/lib/llm/provider";
import type { ParsedEntity } from "@/lib/yaml-parser";
import { buildEvaluateMessages } from "@/lib/prompts/evaluate";
import { buildFixMessages } from "@/lib/prompts/fix";
import { buildGenerateMessages } from "@/lib/prompts/generate";
import { applyD5Override } from "@/lib/rubric-checks";
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
 * Canonical ordered tuple of the nine rubric dimension keys. Use this rather
 * than `Object.keys(scores)` / `Object.values(scores)` when computing totals
 * so a future stray property on the scores object can't silently inflate the
 * count.
 */
const DIMENSION_KEYS = [
  "d1",
  "d2",
  "d3",
  "d4",
  "d5",
  "d6",
  "d7",
  "d8",
  "d9",
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

const ALL_FAIL_SCORES: RubricScores = {
  d1: "fail",
  d2: "fail",
  d3: "fail",
  d4: "fail",
  d5: "fail",
  d6: "fail",
  d7: "fail",
  d8: "fail",
  d9: "fail",
};

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
  provider: LLMProvider
): Promise<VariantResult> {
  // Measure the full multi-pass duration so the persisted RunRecord can
  // carry end-to-end generation latency for later analysis.
  const startTime = Date.now();

  // Pass 1 — Generate
  const generateMessages = buildGenerateMessages(
    entity,
    category,
    gameStyle,
    generationMode,
  );
  let design: GameDesign = await llmJsonCall(
    provider,
    generateMessages,
    gameDesignSchema,
    { temperature: 0.8 }
  );

  // Pass 2 — Evaluate (with deterministic D5 pre-check override)
  const evalMessages = buildEvaluateMessages(design);
  const llmEvaluation = await llmJsonCall(
    provider,
    evalMessages,
    evaluateResponseSchema,
    { temperature: 0.2 }
  );
  let evaluation: { scores: RubricScores; issues: RubricIssue[] } =
    applyD5Override(llmEvaluation.scores, llmEvaluation.issues, design);

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

    // Pass 4 — Re-evaluate (same D5 override applied to the re-evaluation)
    const reEvalMessages = buildEvaluateMessages(design);
    const reLlmEvaluation = await llmJsonCall(
      provider,
      reEvalMessages,
      evaluateResponseSchema,
      { temperature: 0.2 }
    );
    evaluation = applyD5Override(
      reLlmEvaluation.scores,
      reLlmEvaluation.issues,
      design,
    );
  }

  const designId = crypto.randomUUID();
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
    isOpposite: false,
    parentRunId: null,
    rubric: evaluation.scores,
    totalScore,
    designId,
    design,
    durationMs,
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
 * Auto-select variant configs for generation. Strategy:
 * - Pick one Cat 1 style and one Cat 5 style first (for variety)
 * - Fill remaining slots from unused styles
 * - Cap at maxVariants (default 4)
 */
export function selectVariantConfigs(
  maxVariants: number = 4
): Array<{ category: Category; gameStyle: string }> {
  const configs: Array<{ category: Category; gameStyle: string }> = [];

  const cat1Styles = [...GAME_STYLES.cat1];
  const cat5Styles = [...GAME_STYLES.cat5];

  // Shuffle each pool for variety
  shuffleArray(cat1Styles);
  shuffleArray(cat5Styles);

  // Pick one from each category first
  if (cat1Styles.length > 0 && configs.length < maxVariants) {
    configs.push({ category: "cat1", gameStyle: cat1Styles.shift()! });
  }
  if (cat5Styles.length > 0 && configs.length < maxVariants) {
    configs.push({ category: "cat5", gameStyle: cat5Styles.shift()! });
  }

  // Fill remaining from unused styles, alternating categories
  const remaining: Array<{ category: Category; gameStyle: string }> = [
    ...cat1Styles.map((style) => ({
      category: "cat1" as const,
      gameStyle: style,
    })),
    ...cat5Styles.map((style) => ({
      category: "cat5" as const,
      gameStyle: style,
    })),
  ];
  shuffleArray(remaining);

  for (const config of remaining) {
    if (configs.length >= maxVariants) break;
    configs.push(config);
  }

  return configs;
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
          provider
        );
        // Mutate the placeholder in place so its id (which the client may
        // already be tracking) is preserved.
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
