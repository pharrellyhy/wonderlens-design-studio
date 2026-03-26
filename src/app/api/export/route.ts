import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { gameDesignSchema } from "@/lib/design-schema";
import { exportSpec, exportProd } from "@/lib/markdown-export";

// ---------------------------------------------------------------------------
// POST /api/export
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { design, format } = body as {
      design: unknown;
      format: "spec" | "prod" | "both";
    };

    if (!design || !format) {
      return NextResponse.json(
        { error: "Missing required fields: design, format" },
        { status: 400 },
      );
    }

    if (!["spec", "prod", "both"].includes(format)) {
      return NextResponse.json(
        { error: 'Invalid format. Must be "spec", "prod", or "both"' },
        { status: 400 },
      );
    }

    const validatedDesign = gameDesignSchema.parse(design);

    const result: { specMd?: string; prodMd?: string } = {};

    if (format === "spec" || format === "both") {
      result.specMd = exportSpec(validatedDesign);
    }

    if (format === "prod" || format === "both") {
      result.prodMd = exportProd(validatedDesign);
    }

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: `Validation error: ${error.message}` },
        { status: 400 },
      );
    }

    const message =
      error instanceof Error ? error.message : "Export failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
