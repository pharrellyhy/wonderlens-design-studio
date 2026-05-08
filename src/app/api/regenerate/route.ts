import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { activityBundleSchema } from "@/lib/activity-bundle-schema";
import { getServerLLMProvider } from "@/lib/llm/provider";
import { buildRegenerateMessages } from "@/lib/prompts/regenerate";

// ---------------------------------------------------------------------------
// POST /api/regenerate
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bundle, fieldPath, comment } = body as {
      bundle: unknown;
      fieldPath?: string;
      comment: string;
    };
    const targetFieldPath = fieldPath ?? "";

    if (!bundle || !comment) {
      return NextResponse.json(
        { error: "Missing required fields: bundle, comment" },
        { status: 400 },
      );
    }

    // Reject regeneration on derived previews — recap and dashboard are
    // computed from spec/prod/tagBlock at validate time, so any user-driven
    // change must land on those source-of-truth fields instead.
    if (
      targetFieldPath.startsWith("recap.") ||
      targetFieldPath.startsWith("dashboard.") ||
      targetFieldPath === "recap" ||
      targetFieldPath === "dashboard"
    ) {
      return NextResponse.json(
        {
          error: `Field path '${targetFieldPath}' is a derived preview. Edit the corresponding spec/prod/tagBlock field instead.`,
        },
        { status: 400 },
      );
    }

    const validatedBundle = activityBundleSchema.parse(bundle);

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
      validatedBundle,
      targetFieldPath,
      comment,
    );

    // No jsonMode — output may be plain text (a single string value)
    const rawResponse = await provider.generate(messages, {
      temperature: 0.7,
    });

    let updatedValue: unknown;
    try {
      let cleaned = rawResponse.trim();
      const fencePattern = /^```(?:json)?\s*\n?([\s\S]*?)\n?\s*```$/;
      const match = fencePattern.exec(cleaned);
      if (match) {
        cleaned = match[1].trim();
      }
      updatedValue = JSON.parse(cleaned);
    } catch {
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
