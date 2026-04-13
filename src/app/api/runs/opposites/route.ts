import { NextRequest, NextResponse } from "next/server";

import { findOppositesFor } from "@/lib/runs-repository";

// ---------------------------------------------------------------------------
// GET /api/runs/opposites?parentIds=id1,id2,id3
// ---------------------------------------------------------------------------
//
// Batch lookup used by the gallery to decide which "Generate opposite" buttons
// to disable. Returns the subset of `parentIds` that already have a persisted
// opposite run on disk. Keeping this read endpoint isolated (instead of
// bundling more `/api/runs/*` operations together) keeps the surface minimal
// until Section 3b introduces the library view.
export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get("parentIds") ?? "";
  const parentIds = raw
    .split(",")
    .map((id) => id.trim())
    .filter((id) => id.length > 0);

  if (parentIds.length === 0) {
    return NextResponse.json({ parentIdsWithOpposite: [] });
  }

  try {
    const map = await findOppositesFor(parentIds);
    const parentIdsWithOpposite = Array.from(map.keys());
    return NextResponse.json({ parentIdsWithOpposite });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to look up opposites";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
