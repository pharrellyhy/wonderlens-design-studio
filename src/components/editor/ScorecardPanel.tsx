"use client";

import { useState } from "react";
import type { RubricScores } from "@/lib/design-schema";
import { RUBRIC_DIMENSIONS } from "@/lib/design-schema";

interface ScorecardPanelProps {
  scores: RubricScores;
  onRerunRubric: () => void;
  onRegenerateWithFeedback: (feedback: string) => void;
  onExport: () => void;
  isEvaluating?: boolean;
}

export function ScorecardPanel({
  scores,
  onRerunRubric,
  onRegenerateWithFeedback,
  onExport,
  isEvaluating,
}: ScorecardPanelProps) {
  const [feedback, setFeedback] = useState("");

  return (
    <div className="w-52 bg-gray-900 border-l border-gray-700 flex-shrink-0 p-4 overflow-y-auto">
      <h4 className="text-white text-sm font-semibold mb-4">
        📊 Quality Score
      </h4>

      {/* Dimension scores */}
      <div className="space-y-2">
        {(
          Object.keys(RUBRIC_DIMENSIONS) as (keyof typeof RUBRIC_DIMENSIONS)[]
        ).map((dim) => (
          <div
            key={dim}
            className={`flex justify-between items-center px-2.5 py-1.5 rounded-md text-xs ${
              scores[dim] === "pass"
                ? "bg-green-900/30 text-green-400"
                : "bg-red-900/30 text-red-400"
            }`}
          >
            <span className="text-gray-300">
              {dim.toUpperCase()} {RUBRIC_DIMENSIONS[dim]}
            </span>
            <span className="font-semibold">
              {scores[dim] === "pass" ? "PASS" : "FAIL"}
            </span>
          </div>
        ))}
      </div>

      <button
        onClick={onRerunRubric}
        disabled={isEvaluating}
        className="w-full mt-4 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-blue-400 border border-gray-600 py-2 rounded-md text-xs"
      >
        {isEvaluating ? "Evaluating..." : "🔄 Re-run Rubric"}
      </button>

      {/* AI Comment Box */}
      <div className="mt-6 pt-4 border-t border-gray-700">
        <h4 className="text-white text-xs font-semibold mb-2">
          💬 AI Comment Box
        </h4>
        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Type feedback for AI to regenerate..."
          className="w-full bg-gray-800 border border-gray-700 rounded-md p-2 text-gray-300 text-xs resize-none"
          rows={3}
        />
        <button
          onClick={() => {
            if (feedback.trim()) {
              onRegenerateWithFeedback(feedback);
              setFeedback("");
            }
          }}
          className="w-full mt-2 bg-indigo-800 hover:bg-indigo-700 text-indigo-200 py-2 rounded-md text-xs"
        >
          ✨ Regenerate with feedback
        </button>
      </div>

      {/* Export */}
      <div className="mt-6 pt-4 border-t border-gray-700">
        <button
          onClick={onExport}
          className="w-full bg-green-900/50 hover:bg-green-800/50 text-green-400 py-2.5 rounded-md text-sm font-semibold"
        >
          📥 Export Design
        </button>
      </div>
    </div>
  );
}
