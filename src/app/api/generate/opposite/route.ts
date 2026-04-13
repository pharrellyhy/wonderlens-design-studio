import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { GAME_STYLES } from "@/lib/design-schema";
import type {
  Category,
  GenerationJob,
  VariantResult,
} from "@/lib/design-schema";
import { cleanupJobs, jobs } from "@/lib/job-store";
import { createLLMProvider, resolveApiKey } from "@/lib/llm/provider";
import { generateVariant } from "@/lib/pipeline";
import { getRunByDesignId } from "@/lib/runs-repository";
import type { RunRecord } from "@/lib/runs-repository";
import { parseEntityYaml } from "@/lib/yaml-parser";

// ---------------------------------------------------------------------------
// Request schema
// ---------------------------------------------------------------------------

const oppositeRequestSchema = z.object({
  sourceDesignId: z.string().min(1),
  llmProvider: z.enum(["openai", "anthropic", "openai-compatible"]),
  apiKey: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Minimal snapshot of the source design needed to kick off an opposite run.
 * We only care about the source design's category, generation mode, and raw
 * YAML — the rest of the source design is persisted elsewhere.
 */
interface SourceSnapshot {
  category: Category;
  generationMode: "freeform" | "mapping-informed";
  sourceEntityYaml: string;
}

/**
 * Scan the in-memory job store for a variant whose designId matches. The
 * store is keyed by jobId, not designId, so we iterate every job and every
 * variant. n*m is small (tens of variants total), so this is fine.
 *
 * Returns null if the source isn't in memory — callers should fall back to
 * the on-disk runs-repository. A match requires that the variant is complete
 * and its embedded design carries the raw YAML via a sibling run file.
 */
function findSourceInJobStore(
  sourceDesignId: string,
): { variant: VariantResult } | null {
  for (const job of jobs.values()) {
    for (const variant of job.variants) {
      if (variant.id === sourceDesignId) {
        return { variant };
      }
    }
  }
  return null;
}

function oppositeCategory(category: Category): Category {
  return category === "cat1" ? "cat5" : "cat1";
}

function defaultGameStyleFor(category: Category): string {
  // GAME_STYLES is `as const`, so both cat1 and cat5 arrays are statically
  // non-empty — the first entry is always defined.
  return GAME_STYLES[category][0];
}

// ---------------------------------------------------------------------------
// POST /api/generate/opposite
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const parseResult = oppositeRequestSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      { error: `Invalid request body: ${parseResult.error.message}` },
      { status: 400 },
    );
  }
  const { sourceDesignId, llmProvider, apiKey } = parseResult.data;

  const resolvedKey = resolveApiKey(llmProvider, apiKey);
  if (!resolvedKey) {
    return NextResponse.json(
      {
        error: `No API key for provider "${llmProvider}". Provide one in the request or set the matching env var.`,
      },
      { status: 400 },
    );
  }

  // Resolve the source. We check the in-memory job store first to confirm
  // the design even exists, but the authoritative source for the raw YAML
  // and generationMode is the persisted run file — VariantResult does not
  // carry sourceEntityYaml. If the design is missing from BOTH the in-memory
  // store and runs-repository, return 404.
  const memoryHit = findSourceInJobStore(sourceDesignId);
  const sourceRun: RunRecord | null = await getRunByDesignId(sourceDesignId);

  if (!sourceRun) {
    if (memoryHit) {
      // Fall through: design exists in memory but no run file means we
      // cannot reconstruct a ParsedEntity (raw YAML is lost). Treat as
      // not-found rather than inventing an entity.
      return NextResponse.json(
        {
          error:
            "Source design is in-memory only and has no persisted run file — cannot derive entity YAML for opposite generation.",
        },
        { status: 404 },
      );
    }
    return NextResponse.json(
      { error: "Source design not found" },
      { status: 404 },
    );
  }

  const source: SourceSnapshot = {
    category: sourceRun.category,
    generationMode: sourceRun.generationMode,
    sourceEntityYaml: sourceRun.sourceEntityYaml,
  };

  // Re-parse the raw YAML back into a ParsedEntity so the pipeline has
  // tier_guidance + dimension summary available. The embedded design's
  // entityMapping alone is not enough for mapping-informed regeneration.
  let parsedEntity;
  try {
    parsedEntity = parseEntityYaml(source.sourceEntityYaml);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to parse source YAML";
    return NextResponse.json(
      { error: `Failed to re-parse source entity YAML: ${message}` },
      { status: 500 },
    );
  }

  const targetCategory = oppositeCategory(source.category);
  const targetGameStyle = defaultGameStyleFor(targetCategory);
  const generationMode = source.generationMode;

  const provider = createLLMProvider(llmProvider, resolvedKey);

  cleanupJobs();

  // Build a minimal single-variant job so the existing gallery polling can
  // track the opposite's progress through /api/generate/[jobId]/status.
  const jobId = crypto.randomUUID();
  const placeholder: VariantResult = {
    id: crypto.randomUUID(),
    category: targetCategory,
    gameStyle: targetGameStyle,
    status: "pending",
  };
  const job: GenerationJob = {
    id: jobId,
    status: "generating",
    currentVariant: 0,
    totalVariants: 1,
    variants: [placeholder],
    createdAt: Date.now(),
  };
  jobs.set(jobId, job);

  // Fire-and-forget: run the single opposite variant in the background and
  // mutate the placeholder in place when it completes. This mirrors the
  // main generate endpoint's pattern; the client polls the job status.
  void (async () => {
    try {
      const result = await generateVariant(
        parsedEntity,
        targetCategory,
        targetGameStyle,
        generationMode,
        provider,
        { parentDesignId: sourceDesignId },
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
      placeholder.status = "failed";
      placeholder.error = message;
      job.currentVariant = 1;
      job.status = "failed";
      job.error = message;
      console.error("[opposite] variant failed", error);
    }
  })();

  return NextResponse.json({ jobId });
}
