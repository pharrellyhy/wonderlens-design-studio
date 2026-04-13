"use client";

import { useState } from "react";
import {
  BarChart3,
  ChevronDown,
  ChevronRight,
  Download,
  MessageSquare,
  RotateCw,
  Sparkles,
} from "lucide-react";
import type { RubricIssue, RubricScores } from "@/lib/design-schema";
import {
  RUBRIC_DIMENSIONS,
  RUBRIC_DIMENSION_DESCRIPTIONS,
} from "@/lib/design-schema";

interface ScorecardPanelProps {
  scores: RubricScores;
  issues: RubricIssue[];
  onRerunRubric: () => void;
  onRegenerateWithFeedback: (feedback: string) => void;
  onExport: () => void;
  isEvaluating?: boolean;
}

type DimensionKey = keyof typeof RUBRIC_DIMENSIONS;

const DIMENSION_KEYS = Object.keys(RUBRIC_DIMENSIONS) as DimensionKey[];

export function ScorecardPanel({
  scores,
  issues,
  onRerunRubric,
  onRegenerateWithFeedback,
  onExport,
  isEvaluating,
}: ScorecardPanelProps) {
  const [feedback, setFeedback] = useState("");
  const [expanded, setExpanded] = useState<Set<DimensionKey>>(new Set());

  const toggle = (dim: DimensionKey) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(dim)) next.delete(dim);
      else next.add(dim);
      return next;
    });
  };

  const issueByDim = new Map<string, string>();
  for (const issue of issues) {
    if (!issueByDim.has(issue.dimension.toLowerCase())) {
      issueByDim.set(issue.dimension.toLowerCase(), issue.description);
    }
  }

  return (
    <div className="w-64 bg-gray-900 border-l border-gray-800 flex-shrink-0 p-4 overflow-y-auto">
      <h4 className="inline-flex items-center gap-2 text-white text-sm font-semibold mb-4">
        <BarChart3 className="w-4 h-4 text-indigo-400" />
        Quality Score
      </h4>

      {/* Dimension scores */}
      <div className="space-y-1.5">
        {DIMENSION_KEYS.map((dim) => {
          const isPass = scores[dim] === "pass";
          const isOpen = expanded.has(dim);
          const issueText = issueByDim.get(dim);

          return (
            <div
              key={dim}
              className={`rounded-md text-xs overflow-hidden ${
                isPass
                  ? "bg-green-950/40 border border-green-900/60"
                  : "bg-red-950/40 border border-red-900/60"
              }`}
            >
              <button
                onClick={() => toggle(dim)}
                className="w-full flex items-center justify-between gap-2 px-2.5 py-1.5 hover:bg-white/5 transition-colors"
              >
                <span className="flex items-center gap-1.5 text-gray-200 truncate">
                  {isOpen ? (
                    <ChevronDown className="w-3 h-3 flex-shrink-0" />
                  ) : (
                    <ChevronRight className="w-3 h-3 flex-shrink-0" />
                  )}
                  <span className="font-mono uppercase">{dim}</span>
                  <span className="truncate">{RUBRIC_DIMENSIONS[dim]}</span>
                </span>
                <span
                  className={`font-semibold ${
                    isPass ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {isPass ? "PASS" : "FAIL"}
                </span>
              </button>

              {isOpen && (
                <div className="px-3 pb-2.5 pt-1 text-gray-400 leading-relaxed border-t border-white/5 space-y-2">
                  <p>{RUBRIC_DIMENSION_DESCRIPTIONS[dim]}</p>
                  {!isPass && issueText && (
                    <p className="text-red-300 bg-red-950/40 rounded px-2 py-1.5">
                      <span className="font-semibold">Issue: </span>
                      {issueText}
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <button
        onClick={onRerunRubric}
        disabled={isEvaluating}
        className="w-full mt-4 inline-flex items-center justify-center gap-1.5 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-blue-400 border border-gray-700 py-2 rounded-md text-xs transition-colors"
      >
        <RotateCw
          className={`w-3.5 h-3.5 ${isEvaluating ? "animate-spin" : ""}`}
        />
        {isEvaluating ? "Evaluating..." : "Re-run Rubric"}
      </button>

      {/* AI Comment Box */}
      <div className="mt-6 pt-4 border-t border-gray-800">
        <h4 className="inline-flex items-center gap-1.5 text-white text-xs font-semibold mb-2">
          <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
          AI Comment Box
        </h4>
        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Type feedback for AI to regenerate..."
          className="w-full bg-gray-800 border border-gray-700 rounded-md p-2 text-gray-300 text-xs resize-none focus:outline-none focus:ring-1 focus:ring-indigo-500"
          rows={3}
        />
        <button
          onClick={() => {
            if (feedback.trim()) {
              onRegenerateWithFeedback(feedback);
              setFeedback("");
            }
          }}
          className="w-full mt-2 inline-flex items-center justify-center gap-1.5 bg-indigo-800 hover:bg-indigo-700 text-indigo-100 py-2 rounded-md text-xs transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Regenerate with feedback
        </button>
      </div>

      {/* Export */}
      <div className="mt-6 pt-4 border-t border-gray-800">
        <button
          onClick={onExport}
          className="w-full inline-flex items-center justify-center gap-1.5 bg-green-900/40 hover:bg-green-800/50 text-green-400 py-2.5 rounded-md text-sm font-semibold border border-green-900/60 transition-colors"
        >
          <Download className="w-4 h-4" />
          Export Design
        </button>
      </div>
    </div>
  );
}
