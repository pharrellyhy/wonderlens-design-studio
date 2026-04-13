import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { gameDesignSchema, rubricScoresSchema, rubricIssueSchema } from "@/lib/design-schema";
import { createLLMProvider } from "@/lib/llm/provider";
import type { LLMProviderType } from "@/lib/llm/provider";
import { parseJsonResponse } from "@/lib/pipeline";
import { buildEvaluateMessages } from "@/lib/prompts/evaluate";

// ---------------------------------------------------------------------------
// Response schema for evaluate LLM output
// ---------------------------------------------------------------------------

const evaluateResponseSchema = z.object({
  scores: rubricScoresSchema,
  issues: z.array(rubricIssueSchema),
});

// ---------------------------------------------------------------------------
// POST /api/evaluate
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { design, llmProvider, apiKey } = body as {
      design: unknown;
      llmProvider: LLMProviderType;
      apiKey: string;
    };

    if (!design || !llmProvider || !apiKey) {
      return NextResponse.json(
        { error: "Missing required fields: design, llmProvider, apiKey" },
        { status: 400 },
      );
    }

    const validatedDesign = gameDesignSchema.parse(design);
    const provider = createLLMProvider(llmProvider, apiKey);
    const messages = buildEvaluateMessages(validatedDesign);

    const rawResponse = await provider.generate(messages, {
      jsonMode: true,
      temperature: 0.2,
    });

    const parsed = parseJsonResponse(rawResponse);
    const result = evaluateResponseSchema.parse(parsed);

    return NextResponse.json({
      rubricScores: result.scores,
      issues: result.issues,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: `Validation error: ${error.message}` },
        { status: 400 },
      );
    }

    const message =
      error instanceof Error ? error.message : "Evaluation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
