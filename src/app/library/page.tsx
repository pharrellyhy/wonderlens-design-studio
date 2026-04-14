import Link from "next/link";

import { LibraryTabs } from "@/components/library/LibraryTabs";
import { listRuns } from "@/lib/runs-repository";

// ---------------------------------------------------------------------------
// /library — persisted run history
// ---------------------------------------------------------------------------
//
// Server component: hits `runs-repository.listRuns()` directly so the client
// bundle never sees the filesystem layer. The flat record list is passed to
// LibraryTabs (client) which manages the table/grid toggle, sort state, and
// row-level actions (open / delete). Pair grouping logic lives in
// `src/lib/run-groupings.ts` and is shared between both tabs.
//
// Re-rendered fresh on every visit (no caching) — file IO is fast enough at
// the scale we expect during development. Once a real backend lands the
// caller can decide whether to add caching upstream.

export const dynamic = "force-dynamic";

export default async function LibraryPage() {
  const runs = await listRuns();

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <header className="border-b border-gray-800 px-6 py-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold text-white">Library</h1>
          <p className="text-gray-500 text-sm mt-1">
            All generated designs ·{" "}
            <span className="text-gray-400">{runs.length}</span>{" "}
            {runs.length === 1 ? "run" : "runs"} on disk
          </p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {runs.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-gray-400 text-lg mb-2">No runs yet.</p>
            <p className="text-gray-600 text-sm">
              Generate your first design from the{" "}
              <Link
                href="/"
                className="text-indigo-400 hover:text-indigo-300 underline-offset-2 hover:underline"
              >
                upload page →
              </Link>
            </p>
          </div>
        ) : (
          <LibraryTabs runs={runs} />
        )}
      </main>
    </div>
  );
}
