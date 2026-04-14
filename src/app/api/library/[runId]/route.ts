import { NextRequest, NextResponse } from "next/server";

import { deleteRun, getRun } from "@/lib/runs-repository";

// ---------------------------------------------------------------------------
// GET /api/library/[runId]
// ---------------------------------------------------------------------------
//
// Reads a single run record from disk and returns its rehydration payload:
// the full GameDesign, its rubric scores, and the original designId. The
// library "Open" button hits this endpoint, calls `setActiveDesign` on the
// client zustand store with the result, and then routes to the editor — the
// editor itself remains a pure client component reading from the store.
//
// We do NOT rehydrate into the in-memory job store: the editor never reads
// from there, and skipping that step keeps server-side state read-only.
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ runId: string }> },
) {
  const { runId } = await params;
  if (!runId) {
    return NextResponse.json({ error: "Missing runId" }, { status: 400 });
  }

  try {
    const run = await getRun(runId);
    if (!run) {
      return NextResponse.json({ error: "Run not found" }, { status: 404 });
    }
    return NextResponse.json({
      runId: run.runId,
      designId: run.designId,
      design: run.design,
      rubricScores: run.rubric,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to read run";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/library/[runId]
// ---------------------------------------------------------------------------
//
// Removes the run file from `data/runs/`. Idempotent — `deleteRun` swallows
// missing-file errors so a double-click doesn't 500.
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ runId: string }> },
) {
  const { runId } = await params;
  if (!runId) {
    return NextResponse.json({ error: "Missing runId" }, { status: 400 });
  }

  try {
    await deleteRun(runId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete run";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
