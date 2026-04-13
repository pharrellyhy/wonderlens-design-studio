import type { GenerationJob } from "@/lib/design-schema";

// ---------------------------------------------------------------------------
// In-memory job store
// ---------------------------------------------------------------------------
//
// Pinned to `globalThis` so every route handler that imports this file shares
// the same Map instance. Necessary because Next 16 / Turbopack evaluates each
// route handler in its own module context, which means a normal
// module-scoped `const jobs = new Map()` ends up duplicated — POST and GET
// would each get their own empty Map and never see each other's writes.

const GLOBAL_KEY = "__wonderlens_jobs__" as const;
type GlobalWithJobs = typeof globalThis & {
  [GLOBAL_KEY]?: Map<string, GenerationJob>;
};
const globalWithJobs = globalThis as GlobalWithJobs;

export const jobs: Map<string, GenerationJob> =
  globalWithJobs[GLOBAL_KEY] ?? new Map<string, GenerationJob>();
globalWithJobs[GLOBAL_KEY] = jobs;

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
