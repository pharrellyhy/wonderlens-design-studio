import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { PILLAR_STYLES } from "@/lib/design-schema";
import type { Category } from "@/lib/design-schema";
import { cleanupJobs } from "@/lib/job-store";
import { getServerLLMProvider } from "@/lib/llm/provider";
import { enqueueSingleVariantJob } from "@/lib/pipeline";
import { getRunByDesignId } from "@/lib/runs-repository";
import { parseEntityYaml } from "@/lib/yaml-parser";

// ---------------------------------------------------------------------------
// Request schema
// ---------------------------------------------------------------------------

const oppositeRequestSchema = z.object({
  sourceDesignId: z.string().min(1),
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function oppositeCategory(category: Category): Category {
  return category === "cat1" ? "cat5" : "cat1";
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
  const { sourceDesignId } = parseResult.data;

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

  // Preserve the source design's experience pillar — "opposite" flips the
  // category only. PILLAR_STYLES is a total Record over all pillars so
  // both branches are statically defined.
  const targetCategory = oppositeCategory(sourceRun.category);
  const sourcePillar = sourceRun.design.basicInfo.experiencePillar;
  const targetGameStyle = PILLAR_STYLES[sourcePillar][targetCategory];
  const generationMode = sourceRun.generationMode;

  let provider;
  try {
    provider = getServerLLMProvider();
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Server LLM provider not configured";
    return NextResponse.json({ error: message }, { status: 500 });
  }

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
