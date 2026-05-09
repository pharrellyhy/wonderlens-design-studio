"use client";

import { useMemo, useState } from "react";

import type { ImportedBundleResult } from "@/lib/bundle-import";
import type { ReviewStatus } from "@/store/design-store";

import { AdaptationRationalePanel } from "./AdaptationRationalePanel";
import { AssetBriefPanel } from "./AssetBriefPanel";
import { DiagnosticsPanel } from "./DiagnosticsPanel";
import { FlowReviewPanel } from "./FlowReviewPanel";
import { defaultReviewStatus, ReviewBundleList } from "./ReviewBundleList";
import { ReviewSummaryPanel } from "./ReviewSummaryPanel";

interface ReviewConsoleProps {
  results: ImportedBundleResult[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  onOpenEditor: (result: ImportedBundleResult) => void;
  onExport?: (result: ImportedBundleResult) => void;
  reviewStatuses?: Record<string, ReviewStatus>;
  onReviewStatusChange?: (activityId: string, status: ReviewStatus) => void;
}

type FilterState = {
  mechanic: string;
  assetPolicy: string;
  category: string;
  tier: string;
  status: string;
};

const ALL_FILTERS: FilterState = {
  mechanic: "all",
  assetPolicy: "all",
  category: "all",
  tier: "all",
  status: "all",
};

const REVIEW_STATUS_OPTIONS = [
  "unreviewed",
  "needs_product_decision",
  "ready_to_edit",
];

const REVIEW_STATUS_LABELS = {
  unreviewed: "Unreviewed",
  needs_product_decision: "Needs product decision",
  ready_to_edit: "Ready to edit",
};

function reviewStatusFor(
  result: ImportedBundleResult,
  reviewStatuses: Record<string, ReviewStatus>,
): ReviewStatus {
  return (
    reviewStatuses[result.bundle.activityId] ?? defaultReviewStatus(result)
  );
}

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values)].sort();
}

function entryMatchesFilters(
  result: ImportedBundleResult,
  filters: FilterState,
  reviewStatuses: Record<string, ReviewStatus>,
): boolean {
  const bundle = result.bundle;
  const status = reviewStatusFor(result, reviewStatuses);

  return (
    (filters.mechanic === "all" ||
      bundle.tagBlock.activity_signature.mechanic === filters.mechanic) &&
    (filters.assetPolicy === "all" ||
      result.reviewMetadata.assetPolicy === filters.assetPolicy) &&
    (filters.category === "all" ||
      bundle.prod.basicInfo.activityCategory === filters.category) &&
    (filters.tier === "all" ||
      bundle.prod.basicInfo.recommendedTier === filters.tier) &&
    (filters.status === "all" || status === filters.status)
  );
}

export function ReviewConsole({
  results,
  selectedIndex,
  onSelect,
  onOpenEditor,
  onExport,
  reviewStatuses = {},
  onReviewStatusChange,
}: ReviewConsoleProps) {
  const [filters, setFilters] = useState<FilterState>(ALL_FILTERS);
  const filterOptions = useMemo(
    () => ({
      mechanics: uniqueSorted(
        results.map((result) => result.bundle.tagBlock.activity_signature.mechanic),
      ),
      assetPolicies: uniqueSorted(
        results.map((result) => result.reviewMetadata.assetPolicy),
      ),
      categories: uniqueSorted(
        results.map((result) => result.bundle.prod.basicInfo.activityCategory),
      ),
      tiers: uniqueSorted(
        results.map((result) => result.bundle.prod.basicInfo.recommendedTier),
      ),
    }),
    [results],
  );
  const visibleEntries = results
    .map((result, index) => ({ result, index }))
    .filter(({ result }) =>
      entryMatchesFilters(result, filters, reviewStatuses),
    );
  const selectedEntry =
    visibleEntries.find((entry) => entry.index === selectedIndex) ??
    visibleEntries[0];
  const selected = selectedEntry?.result;

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-gray-800 bg-gray-900/60 p-3">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <FilterSelect
            label="Mechanic"
            value={filters.mechanic}
            options={filterOptions.mechanics}
            onChange={(mechanic) => setFilters((prev) => ({ ...prev, mechanic }))}
          />
          <FilterSelect
            label="Asset policy"
            value={filters.assetPolicy}
            options={filterOptions.assetPolicies}
            onChange={(assetPolicy) =>
              setFilters((prev) => ({ ...prev, assetPolicy }))
            }
          />
          <FilterSelect
            label="Category"
            value={filters.category}
            options={filterOptions.categories}
            onChange={(category) => setFilters((prev) => ({ ...prev, category }))}
          />
          <FilterSelect
            label="Tier"
            value={filters.tier}
            options={filterOptions.tiers}
            onChange={(tier) => setFilters((prev) => ({ ...prev, tier }))}
          />
          <FilterSelect
            label="Review status"
            value={filters.status}
            options={REVIEW_STATUS_OPTIONS}
            optionLabels={REVIEW_STATUS_LABELS}
            onChange={(status) => setFilters((prev) => ({ ...prev, status }))}
          />
        </div>
      </div>
      {!selected || !selectedEntry ? (
        <div className="rounded-lg border border-gray-800 bg-gray-900/60 p-6 text-sm text-gray-400">
          No activities match the current filters.
        </div>
      ) : (
      <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)_360px]">
        <ReviewBundleList
          results={visibleEntries.map((entry) => entry.result)}
          selectedIndex={visibleEntries.findIndex(
            (entry) => entry.index === selectedEntry.index,
          )}
          onSelect={(index) => {
            const entry = visibleEntries[index];
            if (entry) onSelect(entry.index);
          }}
          onOpenEditor={onOpenEditor}
          onExport={onExport}
          reviewStatuses={reviewStatuses}
          onReviewStatusChange={onReviewStatusChange}
        />
        <div className="space-y-4">
          <ReviewSummaryPanel result={selected} />
          <FlowReviewPanel bundle={selected.bundle} />
        </div>
        <div className="space-y-4">
          <DiagnosticsPanel diagnostics={selected.diagnostics} />
          <AssetBriefPanel metadata={selected.reviewMetadata} />
          <AdaptationRationalePanel metadata={selected.reviewMetadata} />
        </div>
      </div>
      )}
    </div>
  );
}

function FilterSelect({
  label,
  value,
  options,
  optionLabels = {},
  onChange,
}: FilterSelectProps) {
  return (
    <label className="text-xs text-gray-500">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded border border-gray-700 bg-gray-950 px-2 py-1.5 text-sm text-gray-200"
      >
        <option value="all">All</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {optionLabels[option] ?? option}
          </option>
        ))}
      </select>
    </label>
  );
}

interface FilterSelectProps {
  label: string;
  value: string;
  options: string[];
  optionLabels?: Record<string, string>;
  onChange: (value: string) => void;
}
