import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { GAME_STYLES } from "@/lib/design-schema";
import type { Category } from "@/lib/design-schema";
import { cleanupJobs } from "@/lib/job-store";
import { createLLMProvider, resolveApiKey } from "@/lib/llm/provider";
import { enqueueSingleVariantJob } from "@/lib/pipeline";
import { getRunByDesignId } from "@/lib/runs-repository";
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

  // Authoritative lookup: the persisted run file is the only place we can
  // recover the raw entity YAML and original generationMode. In-memory
  // VariantResult does not carry sourceEntityYaml, so an in-memory-only hit
  // is unreachable anyway — collapse directly to a single 404.
  const sourceRun = await getRunByDesignId(sourceDesignId);
  if (!sourceRun) {
    return NextResponse.json(
      {
        error:
          "Source design not found — it must be persisted before generating an opposite.",
      },
      { status: 404 },
    );
  }

  // Re-parse the raw YAML back into a ParsedEntity so the pipeline has
  // tier_guidance + dimension summary available. The embedded design's
  // entityMapping alone is not enough for mapping-informed regeneration.
  let parsedEntity;
  try {
    parsedEntity = parseEntityYaml(sourceRun.sourceEntityYaml);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to parse source YAML";
    return NextResponse.json(
      { error: `Failed to re-parse source entity YAML: ${message}` },
      { status: 500 },
    );
  }

  const targetCategory = oppositeCategory(sourceRun.category);
  const targetGameStyle = defaultGameStyleFor(targetCategory);
  const generationMode = sourceRun.generationMode;

  const provider = createLLMProvider(llmProvider, resolvedKey);

  cleanupJobs();

  // Delegate placeholder creation + background fire-and-forget to the shared
  // single-variant helper so this route stays a thin HTTP adapter.
  const { jobId } = enqueueSingleVariantJob({
    entity: parsedEntity,
    category: targetCategory,
    gameStyle: targetGameStyle,
    generationMode,
    provider,
    parentDesignId: sourceDesignId,
  });

  return NextResponse.json({ jobId });
}
