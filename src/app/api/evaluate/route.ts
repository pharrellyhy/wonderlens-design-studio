import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { gameDesignSchema, rubricScoresSchema, rubricIssueSchema } from "@/lib/design-schema";
import { getServerLLMProvider } from "@/lib/llm/provider";
import { parseJsonResponse } from "@/lib/pipeline";
import { buildEvaluateMessages } from "@/lib/prompts/evaluate";
import { applyD4Override } from "@/lib/rubric-checks";

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
    const { design } = body as { design: unknown };

    if (!design) {
      return NextResponse.json(
        { error: "Missing required field: design" },
        { status: 400 },
      );
    }

    const validatedDesign = gameDesignSchema.parse(design);

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

    const messages = buildEvaluateMessages(validatedDesign);

    const rawResponse = await provider.generate(messages, {
      jsonMode: true,
      temperature: 0.2,
    });

    const parsed = parseJsonResponse(rawResponse);
    const result = evaluateResponseSchema.parse(parsed);

    // Apply deterministic D4 pre-check override — if the closing step's
    // conceptReinforcement does not name at least one coreKeyConcept, D4 is a
    // hard fail regardless of what the LLM decided.
    const { scores, issues } = applyD4Override(
      result.scores,
      result.issues,
      validatedDesign,
    );

    return NextResponse.json({
      rubricScores: scores,
      issues,
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
