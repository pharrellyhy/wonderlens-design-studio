import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { generationModeSchema } from "@/lib/design-schema";
import type { GenerationJob } from "@/lib/design-schema";
import { jobs, cleanupJobs } from "@/lib/job-store";
import { createLLMProvider, resolveApiKey } from "@/lib/llm/provider";
import type { LLMProviderType } from "@/lib/llm/provider";
import { runGenerationJob, selectVariantConfigs } from "@/lib/pipeline";
import { parseEntityYaml } from "@/lib/yaml-parser";

// ---------------------------------------------------------------------------
// POST /api/generate
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      entity,
      entityYaml,
      variantConfigs,
      llmProvider,
      apiKey,
      generationMode: rawGenerationMode,
    } = body as {
      entity?: string;
      entityYaml?: string;
      variantConfigs?: Array<{ category: string; gameStyle: string }>;
      llmProvider: LLMProviderType;
      apiKey?: string;
      generationMode?: unknown;
    };
    const yamlSource = entityYaml ?? entity;

    if (!yamlSource || !llmProvider) {
      return NextResponse.json(
        { error: "Missing required fields: entityYaml, llmProvider" },
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

    const resolvedKey = resolveApiKey(llmProvider, apiKey);
    if (!resolvedKey) {
      return NextResponse.json(
        {
          error: `No API key for provider "${llmProvider}". Provide one in the request or set the matching env var.`,
        },
        { status: 400 },
      );
    }

    cleanupJobs();

    const parsedEntity = parseEntityYaml(yamlSource);
    const provider = createLLMProvider(llmProvider, resolvedKey);
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
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: `Validation error: ${error.message}` },
        { status: 400 },
      );
    }
    const message =
      error instanceof Error ? error.message : "Failed to start generation";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
