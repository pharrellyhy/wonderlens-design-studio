"use client";

import { useMemo } from "react";
import { ArrowLeftRight } from "lucide-react";

import type { RunRecord } from "@/lib/runs-repository";
import { RUBRIC_DIMENSION_COUNT } from "@/lib/design-schema";
import {
  flattenGroups,
  groupRunsWithOpposites,
} from "@/lib/run-groupings";
import { CategoryPill } from "@/components/common/CategoryPill";
import { ModePill } from "@/components/common/ModePill";
import { RubricDots } from "@/components/common/RubricDots";

import { RunActions } from "./RunActions";

interface RunsGridProps {
  runs: RunRecord[];
  busyRunId: string | null;
  onOpen: (runId: string) => void;
  onDelete: (runId: string) => void;
}

// ---------------------------------------------------------------------------
// RunsGrid — same RunRecord data, card layout
// ---------------------------------------------------------------------------
//
// Pair grouping uses the same `groupRunsWithOpposites` helper as the table,
// then `flattenGroups` produces a linear sequence with `isChild` flags. Child
// cards render with a left accent border + sibling tag so the grouping is
// visible without needing a connector line. No sort here — the grid view is
// browse-oriented.
export function RunsGrid({
  runs,
  busyRunId,
  onOpen,
  onDelete,
}: RunsGridProps) {
  const flatRows = useMemo(
    () => flattenGroups(groupRunsWithOpposites(runs)),
    [runs],
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {flatRows.map(({ run, isChild, isOrphan }) => {
        const allPass = run.totalScore === RUBRIC_DIMENSION_COUNT;
        const isBusy = busyRunId === run.runId;
        return (
          <div
            key={run.runId}
            className={`bg-gray-800 border-2 rounded-xl p-4 transition-all hover:border-blue-600 cursor-pointer ${
              isChild
                ? "border-orange-600/40 border-l-4 border-l-orange-500"
                : "border-transparent"
            }`}
            onClick={() => {
              if (busyRunId) return;
              onOpen(run.runId);
            }}
          >
            {/* Header pills */}
            <div className="flex justify-between items-start mb-3 gap-2">
              <div className="flex flex-wrap gap-1.5">
                <CategoryPill category={run.category} />
                <ModePill mode={run.generationMode} />
                {(isChild || run.isOpposite) && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-orange-900/50 text-orange-300">
                    <ArrowLeftRight className="w-3 h-3" />
                    {isOrphan ? "orphan" : "sibling"}
                  </span>
                )}
              </div>
              <span
                className={`text-xs font-mono font-semibold whitespace-nowrap ${
                  allPass ? "text-green-400" : "text-yellow-400"
                }`}
              >
                {run.totalScore}/{RUBRIC_DIMENSION_COUNT}
              </span>
            </div>

            {/* Title */}
            <h4 className="text-white font-semibold mb-1">
              {run.entityDisplayName}
            </h4>
            <p className="text-gray-500 text-xs mb-3">{run.gameStyle}</p>

            {/* D1–D10 dot strip */}
            <RubricDots rubric={run.rubric} className="mb-4" />

            {/* Footer: actions */}
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-gray-600 font-mono">
                {new Date(run.timestamp).toLocaleString()}
              </span>
              <RunActions
                runId={run.runId}
                busy={isBusy}
                anyBusy={busyRunId !== null}
                onOpen={onOpen}
                onDelete={onDelete}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
