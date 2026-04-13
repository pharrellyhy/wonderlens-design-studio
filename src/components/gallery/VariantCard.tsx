"use client";

import { Award, Drama, TrendingUp } from "lucide-react";
import type { GameDesign, RubricScores } from "@/lib/design-schema";
import {
  CATEGORY_LABELS,
  RUBRIC_DIMENSIONS,
} from "@/lib/design-schema";

interface VariantCardProps {
  status: "pending" | "complete" | "failed";
  category: string;
  gameStyle: string;
  design?: GameDesign;
  rubricScores?: RubricScores;
  error?: string;
  onClick: () => void;
}

function categoryTagClass(category: string): string {
  return category === "cat1"
    ? "bg-indigo-900/50 text-indigo-300"
    : "bg-green-900/50 text-green-300";
}

function categoryLabel(category: string): string {
  if (category in CATEGORY_LABELS) {
    return CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS];
  }
  return category;
}

export function VariantCard({
  status,
  category,
  gameStyle,
  design,
  rubricScores,
  error,
  onClick,
}: VariantCardProps) {
  const tagClass = categoryTagClass(category);

  // ── Pending placeholder ────────────────────────────────────────────────
  if (status === "pending" || (status === "complete" && !design)) {
    return (
      <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-5 min-h-[220px] flex flex-col">
        <div className="flex gap-1.5 flex-wrap mb-4">
          <span className={`px-2 py-0.5 rounded text-xs ${tagClass}`}>
            {categoryLabel(category)}
          </span>
          <span className={`px-2 py-0.5 rounded text-xs ${tagClass}`}>
            {gameStyle}
          </span>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <div className="relative w-10 h-10 mb-3">
            <div className="absolute inset-0 rounded-full border-[3px] border-indigo-500/20" />
            <div className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-indigo-400 border-r-indigo-400/60 animate-spin" />
          </div>
          <p className="text-gray-400 text-sm">Generating…</p>
          <p className="text-gray-600 text-xs mt-1">
            Multi-pass quality pipeline
          </p>
        </div>
      </div>
    );
  }

  // ── Failed ─────────────────────────────────────────────────────────────
  if (status === "failed" || !design || !rubricScores) {
    return (
      <div className="bg-gray-800 border border-red-800/60 rounded-xl p-5 min-h-[220px] flex flex-col">
        <div className="flex gap-1.5 flex-wrap mb-3">
          <span className={`px-2 py-0.5 rounded text-xs ${tagClass}`}>
            {categoryLabel(category)}
          </span>
          <span className={`px-2 py-0.5 rounded text-xs ${tagClass}`}>
            {gameStyle}
          </span>
        </div>
        <p className="text-red-400 text-sm font-semibold mb-1">
          Generation failed
        </p>
        <p className="text-red-300/80 text-xs leading-relaxed whitespace-pre-wrap">
          {error ?? "Unknown error"}
        </p>
      </div>
    );
  }

  // ── Complete ───────────────────────────────────────────────────────────
  const passCount = Object.values(rubricScores).filter(
    (score) => score === "pass",
  ).length;
  const allPass = passCount === 9;

  return (
    <div
      onClick={onClick}
      className="bg-gray-800 border-2 border-transparent hover:border-blue-600 rounded-xl p-5 cursor-pointer transition-all"
    >
      {/* Tags */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex gap-1.5 flex-wrap">
          <span className={`px-2 py-0.5 rounded text-xs ${tagClass}`}>
            {categoryLabel(category)}
          </span>
          <span className={`px-2 py-0.5 rounded text-xs ${tagClass}`}>
            {gameStyle}
          </span>
        </div>
        <span
          className={`text-xs font-semibold ${
            allPass ? "text-green-400" : "text-yellow-400"
          }`}
        >
          {passCount}/9 PASS
        </span>
      </div>

      {/* Title + description */}
      <h4 className="text-white font-semibold mb-2">
        {design.basicInfo.activityName}
      </h4>
      <p className="text-gray-400 text-sm leading-relaxed mb-3">
        {design.overview.briefDescription}
      </p>

      {/* Creative variables */}
      <div className="text-xs text-gray-500 space-y-1.5">
        <div className="flex items-start gap-2">
          <Drama className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-indigo-400/70" />
          <span>
            <span className="text-gray-400 font-medium">Metaphor: </span>
            {design.creativeVariables.metaphor}
          </span>
        </div>
        <div className="flex items-start gap-2">
          <Award className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-amber-400/70" />
          <span>
            <span className="text-gray-400 font-medium">Badge: </span>
            {design.creativeVariables.roleTitle}
          </span>
        </div>
        <div className="flex items-start gap-2">
          <TrendingUp className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-emerald-400/70" />
          <span>
            <span className="text-gray-400 font-medium">Escalation: </span>
            {design.creativeVariables.escalationAxis}
          </span>
        </div>
      </div>

      {/* Rubric score bar */}
      <div className="flex gap-1 mt-3 flex-wrap">
        {(Object.keys(RUBRIC_DIMENSIONS) as (keyof typeof RUBRIC_DIMENSIONS)[]).map(
          (dim) => (
            <span
              key={dim}
              className={`px-1.5 py-0.5 rounded text-[10px] font-mono uppercase ${
                rubricScores[dim] === "pass"
                  ? "bg-green-900/50 text-green-400"
                  : "bg-red-900/50 text-red-400"
              }`}
              title={RUBRIC_DIMENSIONS[dim]}
            >
              {dim}
            </span>
          ),
        )}
      </div>
    </div>
  );
}
