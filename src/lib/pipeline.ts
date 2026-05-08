import { z } from "zod";

import {
  activityBundleSchema,
  type ActivityBundle,
  type GenerationJob,
  type VariantResult,
} from "@/lib/activity-bundle-schema";
import {
  ALL_PILLARS,
  PILLAR_STYLES,
  rubricIssueSchema,
  rubricScoresSchema,
  styleToPillar,
} from "@/lib/design-schema";
import type {
  Category,
  ExperiencePillar,
  GenerationMode,
  RubricIssue,
  RubricScores,
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

const DIMENSION_KEYS = [
  "d1","d2","d3","d4","d5","d6","d7","d8","d9","d10",
] as const;

const ALL_FAIL_SCORES: RubricScores = Object.fromEntries(
  DIMENSION_KEYS.map((k) => [k, "fail"] as const),
) as RubricScores;

// ---------------------------------------------------------------------------
// Helper: parseJsonResponse
// ---------------------------------------------------------------------------

/**
 * Strip markdown code fences if present, then JSON.parse the raw string.
 */
export function parseJsonResponse(raw: string): unknown {
  let cleaned = raw.trim();

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

async function llmJsonCall<T>(
  provider: LLMProvider,
  messages: LLMMessage[],
  schema: z.ZodType<T>,
  options: { temperature: number },
): Promise<T> {
  const llmOptions = {
    jsonMode: true,
    temperature: options.temperature,
  };

  const rawResponse = await provider.generate(messages, llmOptions);

  try {
    const parsed = parseJsonResponse(rawResponse);
    return schema.parse(parsed);
  } catch (firstError) {
    const errorMessage =
      firstError instanceof Error ? firstError.message : String(firstError);

    const retryMessages: LLMMessage[] = [
      ...messages,
      { role: "assistant", content: rawResponse },
      {
        role: "user",
        content: `Your previous JSON response failed validation with this error:\n\n${errorMessage}\n\nPlease output the corrected JSON. Output ONLY the raw JSON object, no markdown fences or explanation.`,
      },
    ];

    const retryResponse = await provider.generate(retryMessages, llmOptions);
    const retryParsed = parseJsonResponse(retryResponse);
    return schema.parse(retryParsed);
  }
}

// ---------------------------------------------------------------------------
// Internal: rubric helpers
// ---------------------------------------------------------------------------

function hasFailures(scores: RubricScores): boolean {
  return Object.values(scores).some((score) => score === "fail");
}

function getFailingIssues(issues: RubricIssue[]): RubricIssue[] {
  return issues.filter((issue) => issue.dimension && issue.description);
}

// ---------------------------------------------------------------------------
// generateVariant — multi-pass pipeline for a single ActivityBundle
// ---------------------------------------------------------------------------

export async function generateVariant(
  entity: ParsedEntity,
  category: Category,
  gameStyle: string,
  generationMode: GenerationMode,
  provider: LLMProvider,
  options?: { parentDesignId?: string; designId?: string },
): Promise<VariantResult> {
  const startTime = Date.now();

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
  let bundle: ActivityBundle = await llmJsonCall(
    provider,
    generateMessages,
    activityBundleSchema,
    { temperature: 0.8 },
  );

  // Pass 2 — Evaluate (with deterministic D4 pre-check override)
  const evalMessages = buildEvaluateMessages(bundle);
  const llmEvaluation = await llmJsonCall(
    provider,
    evalMessages,
    evaluateResponseSchema,
    { temperature: 0.2 },
  );
  let evaluation = applyD4Override(
    llmEvaluation.scores,
    llmEvaluation.issues,
    bundle,
  );

  // Pass 3 & 4 — Fix loop
  let fixIteration = 0;
  while (hasFailures(evaluation.scores) && fixIteration < MAX_FIX_ITERATIONS) {
    fixIteration++;

    const failingIssues = getFailingIssues(evaluation.issues);
    if (failingIssues.length === 0) break;

    const fixMessages = buildFixMessages(bundle, failingIssues);
    bundle = await llmJsonCall(provider, fixMessages, activityBundleSchema, {
      temperature: 0.5,
    });

    const reEvalMessages = buildEvaluateMessages(bundle);
    const reLlmEvaluation = await llmJsonCall(
      provider,
      reEvalMessages,
      evaluateResponseSchema,
      { temperature: 0.2 },
    );
    evaluation = applyD4Override(
      reLlmEvaluation.scores,
      reLlmEvaluation.issues,
      bundle,
    );
  }

  const designId = options?.designId ?? crypto.randomUUID();
  const durationMs = Date.now() - startTime;

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
    bundle,
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
    bundle,
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

export function selectVariantConfigs(
  maxVariants: number = 4,
): Array<{ category: Category; gameStyle: string }> {
  const pillarPool: ExperiencePillar[] = [...ALL_PILLARS];
  shuffleArray(pillarPool);

  const pickCount = Math.min(maxVariants, pillarPool.length);
  const pickedPillars = pillarPool.slice(0, pickCount);

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

const VARIANT_CONCURRENCY = 3;

export async function runGenerationJob(
  job: GenerationJob,
  entity: ParsedEntity,
  variantConfigs: Array<{ category: Category; gameStyle: string }>,
  generationMode: GenerationMode,
  provider: LLMProvider,
): Promise<void> {
  job.status = "generating";

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
        placeholder.bundle = result.bundle;
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
      placeholder.bundle = result.bundle;
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
