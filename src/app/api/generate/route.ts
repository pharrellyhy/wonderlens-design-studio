import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import type { GenerationJob } from "@/lib/activity-bundle-schema";
import { categorySchema, generationModeSchema } from "@/lib/design-schema";
import { jobs, cleanupJobs } from "@/lib/job-store";
import { getServerLLMProvider } from "@/lib/llm/provider";
import { runGenerationJob, selectVariantConfigs } from "@/lib/pipeline";
import { parseEntityYaml } from "@/lib/yaml-parser";

const variantConfigsSchema = z
  .array(
    z.object({
      category: categorySchema,
      gameStyle: z.string().min(1),
    }),
  )
  .optional();

// ---------------------------------------------------------------------------
// POST /api/generate
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      entity,
      entityYaml,
      variantConfigs: rawVariantConfigs,
      generationMode: rawGenerationMode,
    } = body as {
      entity?: string;
      entityYaml?: string;
      variantConfigs?: unknown;
      generationMode?: unknown;
    };
    const yamlSource = entityYaml ?? entity;

    if (!yamlSource) {
      return NextResponse.json(
        { error: "Missing required field: entityYaml" },
        { status: 400 },
      );
    }

    // generationMode is required — callers must send it explicitly. No
    // defaulting, so the client can never silently fall back to the wrong
    // prompt branch.
    const parseResult = generationModeSchema.safeParse(rawGenerationMode);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: `Missing or invalid generationMode — must be "freeform" or "mapping-informed".`,
        },
        { status: 400 },
      );
    }
    const generationMode = parseResult.data;

    // Narrow variantConfigs to the Category union so runGenerationJob gets a
    // strictly-typed array. Invalid entries reject the request at the boundary
    // instead of failing silently inside generateVariant. The schema is
    // `.optional()`, so an undefined raw value parses to undefined data.
    const configsResult = variantConfigsSchema.safeParse(rawVariantConfigs);
    if (!configsResult.success) {
      return NextResponse.json(
        { error: `Invalid variantConfigs: ${configsResult.error.message}` },
        { status: 400 },
      );
    }
    const variantConfigs = configsResult.data;

    cleanupJobs();

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

    const parsedEntity = parseEntityYaml(yamlSource);
    const configs = variantConfigs ?? selectVariantConfigs();

    const jobId = crypto.randomUUID();
    const job: GenerationJob = {
      id: jobId,
      status: "queued",
      currentVariant: 0,
      totalVariants: configs.length,
      variants: [],
      createdAt: Date.now(),
    };

    jobs.set(jobId, job);

    // Fire-and-forget: run the generation pipeline in the background
    runGenerationJob(
      job,
      parsedEntity,
      configs,
      generationMode,
      provider,
    ).catch((error) => {
      job.status = "failed";
      job.error =
        error instanceof Error ? error.message : "Unknown generation error";
    });

    return NextResponse.json({ jobId });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to start generation";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
