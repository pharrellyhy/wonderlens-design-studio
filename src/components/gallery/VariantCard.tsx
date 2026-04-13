"use client";

import { Award, Drama, TrendingUp } from "lucide-react";
import type { GameDesign, RubricScores } from "@/lib/design-schema";
import {
  CATEGORY_LABELS,
  RUBRIC_DIMENSIONS,
} from "@/lib/design-schema";

interface VariantCardProps {
  design: GameDesign;
  rubricScores: RubricScores;
  isGenerating?: boolean;
  error?: string;
  onClick: () => void;
}

export function VariantCard({
  design,
  rubricScores,
  isGenerating,
  error,
  onClick,
}: VariantCardProps) {
  const passCount = Object.values(rubricScores).filter((score) => score === "pass").length;
  const allPass = passCount === 9;

  if (isGenerating) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-5 animate-pulse">
        <div className="h-4 bg-gray-700 rounded w-1/3 mb-3" />
        <div className="h-6 bg-gray-700 rounded w-2/3 mb-3" />
        <div className="h-16 bg-gray-700 rounded mb-3" />
        <p className="text-sm text-gray-500">Generating...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-800 border border-red-800 rounded-xl p-5">
        <p className="text-red-400 text-sm">Generation failed: {error}</p>
      </div>
    );
  }

  const isCat1 = design.basicInfo.category === "cat1";
  const tagClassName = isCat1
    ? "bg-indigo-900/50 text-indigo-300"
    : "bg-green-900/50 text-green-300";

  return (
    <div
      onClick={onClick}
      className="bg-gray-800 border-2 border-transparent hover:border-blue-600 rounded-xl p-5 cursor-pointer transition-all"
    >
      {/* Tags */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex gap-1.5 flex-wrap">
          <span className={`px-2 py-0.5 rounded text-xs ${tagClassName}`}>
            {CATEGORY_LABELS[design.basicInfo.category]}
          </span>
          <span className={`px-2 py-0.5 rounded text-xs ${tagClassName}`}>
            {design.basicInfo.gameStyle}
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
          )
        )}
      </div>
    </div>
  );
}
