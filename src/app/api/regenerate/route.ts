import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { gameDesignSchema } from "@/lib/design-schema";
import { getServerLLMProvider } from "@/lib/llm/provider";
import { buildRegenerateMessages } from "@/lib/prompts/regenerate";

// ---------------------------------------------------------------------------
// POST /api/regenerate
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { design, fieldPath, comment } = body as {
      design: unknown;
      fieldPath?: string;
      comment: string;
    };
    const targetFieldPath = fieldPath ?? "";

    if (!design || !comment) {
      return NextResponse.json(
        { error: "Missing required fields: design, comment" },
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

    const messages = buildRegenerateMessages(
      validatedDesign,
      targetFieldPath,
      comment
    );

    // No jsonMode — output may be plain text (a single string value)
    const rawResponse = await provider.generate(messages, {
      temperature: 0.7,
    });

    // Try JSON.parse first, fall back to cleaned string
    let updatedValue: unknown;
    try {
      // Strip markdown fences if present
      let cleaned = rawResponse.trim();
      const fencePattern = /^```(?:json)?\s*\n?([\s\S]*?)\n?\s*```$/;
      const match = fencePattern.exec(cleaned);
      if (match) {
        cleaned = match[1].trim();
      }
      updatedValue = JSON.parse(cleaned);
    } catch {
      // Not valid JSON — treat as a plain string value
      updatedValue = rawResponse.trim();
    }

    return NextResponse.json({ updatedValue });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: `Validation error: ${error.message}` },
        { status: 400 },
      );
    }

    const message =
      error instanceof Error ? error.message : "Regeneration failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
