"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";

import type { RunRecord } from "@/lib/runs-repository";
import { deleteLibraryRun, openLibraryRun } from "@/lib/api-client";
import { useDesignStore } from "@/store/design-store";

import { RunsGrid } from "./RunsGrid";
import { RunsTable } from "./RunsTable";

type Tab = "table" | "grid";

interface LibraryTabsProps {
  runs: RunRecord[];
}

// ---------------------------------------------------------------------------
// LibraryTabs — owns tab state + Open/Delete plumbing
// ---------------------------------------------------------------------------
//
// Why this component exists separate from the page server component:
//   - tab state and local row removal need useState (client-only)
//   - Open / Delete fire fetches from the browser
//   - keeping the two tab views as siblings under one parent means the
//     deletion handler can update both views via a single source of truth
//
// State design notes:
//   - `localRuns` mirrors the server-fetched runs prop. Delete mutates this
//     in-place so the row vanishes without a full router.refresh() (which
//     would re-render the whole page and feel janky for a single-row op).
//   - `busyRunId` blocks duplicate clicks while an open/delete fetch is
//     in-flight. There is no global queue — only one row can be acting at a
//     time, which is fine for a manual UI.
//   - `error` shows transient failure copy at the top of the active tab.
export function LibraryTabs({ runs }: LibraryTabsProps) {
  const router = useRouter();
  const setActiveDesign = useDesignStore((s) => s.setActiveDesign);

  const [tab, setTab] = useState<Tab>("table");
  const [localRuns, setLocalRuns] = useState<RunRecord[]>(runs);
  const [busyRunId, setBusyRunId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleOpen = useCallback(
    async (runId: string) => {
      if (busyRunId) return;
      setBusyRunId(runId);
      setError(null);
      try {
        const result = await openLibraryRun(runId);
        // Push the design back into the client zustand store so the editor
        // (which is a pure client component reading from the store) renders
        // it on mount. `setActiveDesign` also clears stale rubric issues.
        setActiveDesign(result.designId, result.design, result.rubricScores);
        router.push(`/editor/${result.designId}`);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to open run";
        setError(message);
        setBusyRunId(null);
      }
      // Note: on success we intentionally leave `busyRunId` set — the user
      // is leaving this view, no point un-flagging.
    },
    [busyRunId, router, setActiveDesign],
  );

  const handleDelete = useCallback(
    async (runId: string) => {
      if (busyRunId) return;
      // Crude but explicit; matches the plan's "simple confirm() is fine" note.
      const confirmed = window.confirm(
        "Delete this run? The file will be removed from data/runs/ and cannot be recovered.",
      );
      if (!confirmed) return;

      setBusyRunId(runId);
      setError(null);
      try {
        await deleteLibraryRun(runId);
        setLocalRuns((prev) => prev.filter((r) => r.runId !== runId));
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to delete run";
        setError(message);
      } finally {
        setBusyRunId(null);
      }
    },
    [busyRunId],
  );

  return (
    <div>
      {/* Segmented control */}
      <div className="flex items-center justify-between mb-4">
        <div
          className="inline-flex rounded-md border border-gray-700 bg-gray-900 p-0.5"
          role="tablist"
          aria-label="Library view"
        >
          <button
            type="button"
            role="tab"
            aria-selected={tab === "table"}
            onClick={() => setTab("table")}
            className={`px-4 py-1.5 text-sm rounded transition-colors ${
              tab === "table"
                ? "bg-indigo-600 text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Table
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "grid"}
            onClick={() => setTab("grid")}
            className={`px-4 py-1.5 text-sm rounded transition-colors ${
              tab === "grid"
                ? "bg-indigo-600 text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Grid
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-900/30 border border-red-800 rounded-lg px-4 py-3 text-red-400 text-sm">
          {error}
        </div>
      )}

      {tab === "table" ? (
        <RunsTable
          runs={localRuns}
          busyRunId={busyRunId}
          onOpen={handleOpen}
          onDelete={handleDelete}
        />
      ) : (
        <RunsGrid
          runs={localRuns}
          busyRunId={busyRunId}
          onOpen={handleOpen}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
