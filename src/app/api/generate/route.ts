import { NextRequest, NextResponse } from "next/server";

import type { GenerationJob } from "@/lib/design-schema";
import { createLLMProvider } from "@/lib/llm/provider";
import type { LLMProviderType } from "@/lib/llm/provider";
import { runGenerationJob, selectVariantConfigs } from "@/lib/pipeline";
import { parseEntityYaml } from "@/lib/yaml-parser";

// ---------------------------------------------------------------------------
// In-memory job store
// ---------------------------------------------------------------------------

export const jobs = new Map<string, GenerationJob>();

const CLEANUP_MAX_AGE_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Remove completed or failed jobs older than 30 minutes.
 */
export function cleanupJobs(): void {
  const now = Date.now();
  for (const [id, job] of jobs) {
    if (
      (job.status === "complete" || job.status === "failed") &&
      now - job.createdAt > CLEANUP_MAX_AGE_MS
    ) {
      jobs.delete(id);
    }
  }
}

// ---------------------------------------------------------------------------
// POST /api/generate
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { entity, variantConfigs, llmProvider, apiKey } = body as {
      entity: string;
      variantConfigs?: Array<{ category: string; gameStyle: string }>;
      llmProvider: LLMProviderType;
      apiKey: string;
    };

    if (!entity || !llmProvider || !apiKey) {
      return NextResponse.json(
        { error: "Missing required fields: entity, llmProvider, apiKey" },
        { status: 400 },
      );
    }

    const parsedEntity = parseEntityYaml(entity);
    const provider = createLLMProvider(llmProvider, apiKey);
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
    runGenerationJob(job, parsedEntity, configs, provider).catch((error) => {
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
