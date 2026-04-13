"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowLeftRight, ArrowUp, Download } from "lucide-react";

import type { RunRecord } from "@/lib/runs-repository";
import { RUBRIC_DIMENSIONS } from "@/lib/design-schema";
import {
  flattenGroups,
  groupRunsWithOpposites,
  type FlatRow,
  type RunGroup,
} from "@/lib/run-groupings";

import { RunActions } from "./RunActions";

interface RunsTableProps {
  runs: RunRecord[];
  busyRunId: string | null;
  onOpen: (runId: string) => void;
  onDelete: (runId: string) => void;
}

type SortColumn = "entity" | "category" | "mode" | "score" | "timestamp";
type SortDir = "asc" | "desc" | "none";

interface SortState {
  column: SortColumn;
  direction: SortDir;
}

const SORTABLE_COLUMNS: ReadonlyArray<{
  column: SortColumn;
  label: string;
  alignRight?: boolean;
}> = [
  { column: "entity", label: "Entity" },
  { column: "category", label: "Category" },
  { column: "mode", label: "Mode" },
  { column: "score", label: "Score", alignRight: true },
  { column: "timestamp", label: "Timestamp", alignRight: true },
];

// ---------------------------------------------------------------------------
// Sorting
// ---------------------------------------------------------------------------
//
// Sort happens on RunGroup, not on individual runs, so parent/child pairs
// stay attached after sort. Children are NOT sorted independently — they
// always follow their parent in original (timestamp-desc) order. Orphaned
// opposites sort as if they were standalone parents.
//
// Sort column → comparator. Returns 0 to leave order unchanged.
function compareGroups(
  a: RunGroup,
  b: RunGroup,
  column: SortColumn,
): number {
  const ar = a.parent;
  const br = b.parent;
  switch (column) {
    case "entity":
      return ar.entityDisplayName.localeCompare(br.entityDisplayName);
    case "category":
      // Stable within a category by falling through to timestamp.
      if (ar.category === br.category) {
        return ar.timestamp < br.timestamp ? 1 : -1;
      }
      return ar.category.localeCompare(br.category);
    case "mode":
      if (ar.generationMode === br.generationMode) {
        return ar.timestamp < br.timestamp ? 1 : -1;
      }
      return ar.generationMode.localeCompare(br.generationMode);
    case "score":
      return ar.totalScore - br.totalScore;
    case "timestamp":
      return ar.timestamp < br.timestamp ? -1 : ar.timestamp > br.timestamp ? 1 : 0;
  }
}

function categoryPillClass(category: string): string {
  return category === "cat1"
    ? "bg-indigo-900/50 text-indigo-300"
    : "bg-green-900/50 text-green-300";
}

function modePillClass(mode: string): string {
  return mode === "mapping-informed"
    ? "bg-blue-900/60 text-blue-300"
    : "bg-gray-700 text-gray-300";
}

function modeLabel(mode: string): string {
  return mode === "mapping-informed" ? "mapping" : "freeform";
}

function formatTimestamp(iso: string): string {
  // The runs-repository writes a Zod-validated z.string().datetime() value, so
  // `new Date(iso)` always parses. Format as YYYY-MM-DD HH:mm in local time.
  const d = new Date(iso);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
    d.getDate(),
  )} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const RUBRIC_KEYS = Object.keys(RUBRIC_DIMENSIONS) as Array<
  keyof typeof RUBRIC_DIMENSIONS
>;

// ---------------------------------------------------------------------------
// CSV export
// ---------------------------------------------------------------------------
//
// Manual quote-and-join — no library needed for this small dataset. Each
// field is wrapped in double quotes and any embedded `"` is doubled per
// RFC 4180. This handles entity names with commas, quotes, or newlines
// without a CSV dependency.
function csvEscape(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

function rowsToCsv(rows: FlatRow[]): string {
  const header = [
    "entity",
    "category",
    "game_style",
    "mode",
    "is_opposite",
    "d1",
    "d2",
    "d3",
    "d4",
    "d5",
    "d6",
    "d7",
    "d8",
    "d9",
    "score",
    "timestamp",
    "run_id",
  ]
    .map(csvEscape)
    .join(",");

  const lines = [header];
  for (const { run } of rows) {
    const cells = [
      run.entityDisplayName,
      run.category,
      run.gameStyle,
      run.generationMode,
      run.isOpposite ? "true" : "false",
      ...RUBRIC_KEYS.map((k) => run.rubric[k]),
      run.totalScore.toString(),
      run.timestamp,
      run.runId,
    ];
    lines.push(cells.map(csvEscape).join(","));
  }

  return lines.join("\n");
}

function downloadCsv(rows: FlatRow[]): void {
  const csv = rowsToCsv(rows);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  a.download = `wonderlens-library-${ts}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function RunsTable({
  runs,
  busyRunId,
  onOpen,
  onDelete,
}: RunsTableProps) {
  // Default sort: timestamp descending. Clicking a sortable header cycles
  // asc → desc → none and back to asc on the next click.
  const [sort, setSort] = useState<SortState>({
    column: "timestamp",
    direction: "desc",
  });

  const rows = useMemo(() => {
    // Step 1: pair grouping uses the original input ordering (already
    // timestamp-desc from runs-repository.listRuns).
    const groups = groupRunsWithOpposites(runs);

    // Step 2: sort groups (parents) per the active sort. Children stay
    // attached because we sort the wrapper, not the underlying runs.
    if (sort.direction !== "none") {
      const sign = sort.direction === "asc" ? 1 : -1;
      groups.sort((a, b) => sign * compareGroups(a, b, sort.column));
    }

    return flattenGroups(groups);
  }, [runs, sort]);

  const cycleSort = (column: SortColumn) => {
    setSort((prev) => {
      if (prev.column !== column) return { column, direction: "asc" };
      if (prev.direction === "asc") return { column, direction: "desc" };
      if (prev.direction === "desc") return { column, direction: "none" };
      return { column, direction: "asc" };
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-gray-500">
          {rows.length} {rows.length === 1 ? "row" : "rows"} ·
          {" "}opposite siblings indented under their parent
        </p>
        <button
          type="button"
          onClick={() => downloadCsv(rows)}
          className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border border-gray-700 text-gray-300 hover:text-white hover:border-indigo-500 transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          Export CSV
        </button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-800">
        <table className="w-full text-sm">
          <thead className="bg-gray-900/60 text-gray-400 text-xs uppercase tracking-wider">
            <tr>
              {SORTABLE_COLUMNS.map(({ column, label, alignRight }) => {
                const isActive = sort.column === column && sort.direction !== "none";
                const Icon = sort.direction === "asc" ? ArrowUp : ArrowDown;
                return (
                  <th
                    key={column}
                    scope="col"
                    className={`px-4 py-3 ${alignRight ? "text-right" : "text-left"} font-medium`}
                  >
                    <button
                      type="button"
                      onClick={() => cycleSort(column)}
                      className={`inline-flex items-center gap-1 hover:text-white transition-colors ${
                        isActive ? "text-indigo-300" : ""
                      } ${alignRight ? "ml-auto" : ""}`}
                    >
                      {label}
                      {isActive && <Icon className="w-3 h-3" />}
                    </button>
                  </th>
                );
              })}
              <th
                scope="col"
                className="px-4 py-3 text-left font-medium hidden md:table-cell"
              >
                Game style
              </th>
              <th scope="col" className="px-4 py-3 text-center font-medium">
                Opp.
              </th>
              <th scope="col" className="px-4 py-3 text-left font-medium">
                D1–D9
              </th>
              <th scope="col" className="px-4 py-3 text-right font-medium">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {rows.map(({ run, isChild, isOrphan }) => {
              const isBusy = busyRunId === run.runId;
              return (
                <tr
                  key={run.runId}
                  className={`transition-colors ${
                    isChild
                      ? "bg-orange-950/10 hover:bg-orange-950/20"
                      : "hover:bg-gray-900/40"
                  }`}
                >
                  {/* Entity (with indent for children) */}
                  <td className="px-4 py-3 align-top">
                    <div
                      className={`flex items-center gap-2 ${isChild ? "pl-5" : ""}`}
                    >
                      {isChild && (
                        <ArrowLeftRight
                          className="w-3.5 h-3.5 text-orange-400 flex-shrink-0"
                          aria-label="Opposite of parent above"
                        />
                      )}
                      <span className="font-medium text-white">
                        {run.entityDisplayName}
                      </span>
                      {isOrphan && (
                        <span
                          className="text-[10px] uppercase tracking-wider text-orange-400/80"
                          title="This opposite's parent is not in the current list"
                        >
                          orphan
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Category pill */}
                  <td className="px-4 py-3 align-top">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${categoryPillClass(run.category)}`}
                    >
                      {run.category}
                    </span>
                  </td>

                  {/* Mode pill */}
                  <td className="px-4 py-3 align-top">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${modePillClass(run.generationMode)}`}
                    >
                      {modeLabel(run.generationMode)}
                    </span>
                  </td>

                  {/* Score */}
                  <td className="px-4 py-3 align-top text-right">
                    <span
                      className={`font-mono text-xs font-semibold ${
                        run.totalScore === 9
                          ? "text-green-400"
                          : "text-yellow-400"
                      }`}
                    >
                      {run.totalScore}/9
                    </span>
                  </td>

                  {/* Timestamp */}
                  <td className="px-4 py-3 align-top text-right text-gray-400 text-xs whitespace-nowrap">
                    {formatTimestamp(run.timestamp)}
                  </td>

                  {/* Game style */}
                  <td className="px-4 py-3 align-top text-gray-400 text-xs hidden md:table-cell">
                    {run.gameStyle}
                  </td>

                  {/* Opposite indicator (column dedicated to the icon when
                      child, blank otherwise; gives the eye a visual anchor
                      for sibling pairs). */}
                  <td className="px-4 py-3 align-top text-center">
                    {run.isOpposite && (
                      <ArrowLeftRight
                        className="w-3.5 h-3.5 text-orange-400 inline"
                        aria-label="Opposite-category run"
                      />
                    )}
                  </td>

                  {/* D1–D9 dot strip */}
                  <td className="px-4 py-3 align-top">
                    <div className="flex gap-1">
                      {RUBRIC_KEYS.map((k) => (
                        <span
                          key={k}
                          title={`${k.toUpperCase()} — ${RUBRIC_DIMENSIONS[k]}: ${run.rubric[k]}`}
                          className={`block w-2.5 h-2.5 rounded-full ${
                            run.rubric[k] === "pass"
                              ? "bg-green-500/80"
                              : "bg-red-500/80"
                          }`}
                        />
                      ))}
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3 align-top text-right">
                    <RunActions
                      runId={run.runId}
                      busy={isBusy}
                      anyBusy={busyRunId !== null}
                      onOpen={onOpen}
                      onDelete={onDelete}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
