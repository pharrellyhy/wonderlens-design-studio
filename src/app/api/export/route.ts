import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { activityBundleSchema } from "@/lib/activity-bundle-schema";
import { bundleToZip } from "@/lib/bundle-export";

// ---------------------------------------------------------------------------
// POST /api/export
//
// Body: { bundle: ActivityBundle }
// Response: application/zip whose root folder is `<activityId>/` containing
// the 5 canonical files (spec.md, prod.md, tag_block.yaml,
// recap.template.yaml, dashboard.template.yaml).
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bundle } = body as { bundle: unknown };

    if (!bundle) {
      return NextResponse.json(
        { error: "Missing required field: bundle" },
        { status: 400 },
      );
    }

    const validated = activityBundleSchema.parse(bundle);
    const { bytes, filename } = await bundleToZip(validated);

    return new NextResponse(bytes as BodyInit, {
      status: 200,
      headers: {
        "content-type": "application/zip",
        "content-disposition": `attachment; filename="${filename}"`,
        "content-length": String(bytes.byteLength),
      },
    });
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
