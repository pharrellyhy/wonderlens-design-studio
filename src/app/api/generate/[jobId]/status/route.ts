import { NextRequest, NextResponse } from "next/server";

import { jobs, cleanupJobs } from "@/lib/job-store";

// ---------------------------------------------------------------------------
// GET /api/generate/[jobId]/status
// ---------------------------------------------------------------------------

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> },
) {
  try {
    const { jobId } = await params;

    cleanupJobs();

    const job = jobs.get(jobId);
    if (!job) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(job);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch job status";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
