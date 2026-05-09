import { Download, ExternalLink, SearchCheck } from "lucide-react";

import type { ImportedBundleResult } from "@/lib/bundle-import";
import type { ReviewStatus } from "@/store/design-store";

interface ReviewBundleListProps {
  results: ImportedBundleResult[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  onOpenEditor: (result: ImportedBundleResult) => void;
  onExport?: (result: ImportedBundleResult) => void;
  reviewStatuses?: Record<string, ReviewStatus>;
  onReviewStatusChange?: (activityId: string, status: ReviewStatus) => void;
}

const REVIEW_STATUS_LABELS: Record<ReviewStatus, string> = {
  unreviewed: "Unreviewed",
  needs_product_decision: "Needs product decision",
  ready_to_edit: "Ready to edit",
};

const REVIEW_STATUS_OPTIONS = Object.entries(REVIEW_STATUS_LABELS);

export function defaultReviewStatus(result: ImportedBundleResult): ReviewStatus {
  if (
    result.diagnostics.some(
      (diagnostic) =>
        diagnostic.status === "blocked" ||
        diagnostic.status === "needs_product_decision",
    )
  ) {
    return "needs_product_decision";
  }
  return "unreviewed";
}

export function ReviewBundleList({
  results,
  selectedIndex,
  onSelect,
  onOpenEditor,
  onExport,
  reviewStatuses = {},
  onReviewStatusChange,
}: ReviewBundleListProps) {
  return (
    <aside className="rounded-lg border border-gray-800 bg-gray-900/60">
      <div className="border-b border-gray-800 p-3">
        <h2 className="inline-flex items-center gap-2 text-sm font-semibold text-white">
          <SearchCheck className="h-4 w-4 text-emerald-300" />
          Review Queue
        </h2>
        <p className="mt-1 text-xs text-gray-500">
          {results.length} {results.length === 1 ? "activity" : "activities"}
        </p>
      </div>
      <div className="max-h-[72vh] overflow-y-auto p-2">
        {results.map((result, index) => {
          const bundle = result.bundle;
          const signature = bundle.tagBlock.activity_signature;
          const isSelected = index === selectedIndex;
          const reviewStatus =
            reviewStatuses[bundle.activityId] ?? defaultReviewStatus(result);
          return (
            <div
              key={`${bundle.activityId}-${index}`}
              className={`mb-2 rounded-md border p-3 ${
                isSelected
                  ? "border-emerald-700 bg-emerald-950/20"
                  : "border-gray-800 bg-gray-950/60"
              }`}
            >
              <button
                type="button"
                onClick={() => onSelect(index)}
                className="block w-full text-left"
              >
                <span className="block truncate text-sm font-medium text-gray-100">
                  {bundle.prod.basicInfo.activityName}
                </span>
                <span className="mt-1 block truncate text-xs text-gray-500">
                  {bundle.activityId}
                </span>
                <span className="mt-2 flex flex-wrap gap-1.5 text-[11px]">
                  <span className="rounded bg-gray-800 px-1.5 py-0.5 text-gray-300">
                    {signature.mechanic}
                  </span>
                  <span className="rounded bg-gray-800 px-1.5 py-0.5 text-gray-300">
                    {bundle.prod.basicInfo.activityCategory}
                  </span>
                  <span className="rounded bg-gray-800 px-1.5 py-0.5 text-gray-300">
                    {bundle.prod.basicInfo.recommendedTier}
                  </span>
                  <span className="rounded bg-amber-950 px-1.5 py-0.5 text-amber-200">
                    {REVIEW_STATUS_LABELS[reviewStatus]}
                  </span>
                </span>
              </button>
              {onReviewStatusChange && (
                <label className="mt-3 block text-xs text-gray-500">
                  Review status
                  <select
                    value={reviewStatus}
                    onChange={(event) =>
                      onReviewStatusChange(
                        bundle.activityId,
                        event.target.value as ReviewStatus,
                      )
                    }
                    className="mt-1 w-full rounded border border-gray-700 bg-gray-900 px-2 py-1 text-xs text-gray-200"
                  >
                    {REVIEW_STATUS_OPTIONS.map(([status, label]) => (
                      <option key={status} value={status}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => onSelect(index)}
                  className="rounded border border-emerald-700/70 px-2 py-1 text-xs text-emerald-200 hover:border-emerald-400"
                >
                  Review
                </button>
                <button
                  type="button"
                  onClick={() => onOpenEditor(result)}
                  className="inline-flex items-center gap-1 rounded border border-gray-700 px-2 py-1 text-xs text-gray-200 hover:border-gray-500"
                >
                  <ExternalLink className="h-3 w-3" />
                  Open in Editor
                </button>
                {onExport && (
                  <button
                    type="button"
                    onClick={() => onExport(result)}
                    className="inline-flex items-center gap-1 rounded border border-gray-700 px-2 py-1 text-xs text-gray-200 hover:border-gray-500"
                  >
                    <Download className="h-3 w-3" />
                    Export
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
