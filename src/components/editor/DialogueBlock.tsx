"use client";

import { Bot, Monitor, User, Wand2 } from "lucide-react";
import type { DialogueBlock as DialogueBlockType } from "@/lib/design-schema";

interface DialogueBlockProps {
  dialogue: DialogueBlockType;
  basePath: string;
  onChange: (path: string, value: string) => void;
  onAskAI?: (path: string, comment: string) => void;
}

export function DialogueBlockEditor({
  dialogue,
  basePath,
  onChange,
  onAskAI,
}: DialogueBlockProps) {
  return (
    <div className="space-y-3">
      {/* AI Says */}
      <div className="bg-gray-800 rounded-lg p-4 border-l-[3px] border-indigo-500">
        <div className="flex justify-between items-center mb-2">
          <span className="inline-flex items-center gap-1.5 text-indigo-400 text-xs font-semibold">
            <Bot className="w-3.5 h-3.5" />
            AI SAYS
          </span>
          {onAskAI && (
            <button
              onClick={() => onAskAI(`${basePath}.aiSays`, "")}
              className="inline-flex items-center gap-1 text-gray-500 hover:text-blue-400 text-xs transition-colors"
            >
              <Wand2 className="w-3 h-3" />
              regen
            </button>
          )}
        </div>
        <textarea
          value={dialogue.aiSays}
          onChange={(e) => onChange(`${basePath}.aiSays`, e.target.value)}
          className="w-full bg-gray-900 border border-gray-700 rounded-md p-2 text-gray-200 text-sm leading-relaxed resize-y min-h-[60px]"
          rows={3}
        />
      </div>

      {/* Child Responses */}
      <div className="bg-gray-800 rounded-lg p-4 border-l-[3px] border-green-600">
        <span className="inline-flex items-center gap-1.5 text-green-400 text-xs font-semibold">
          <User className="w-3.5 h-3.5" />
          CHILD RESPONSES
        </span>

        <div className="mt-3 space-y-2">
          {(["ideal", "unexpected", "silent"] as const).map((type) => {
            const colors = {
              ideal: {
                bg: "bg-green-900/30",
                text: "text-green-400",
                label: "Ideal",
              },
              unexpected: {
                bg: "bg-yellow-900/30",
                text: "text-yellow-400",
                label: "Unexpected",
              },
              silent: {
                bg: "bg-red-900/30",
                text: "text-red-400",
                label: "Silent",
              },
            };
            const c = colors[type];

            return (
              <div key={type} className="flex gap-2 items-start">
                <span
                  className={`${c.bg} ${c.text} px-2 py-0.5 rounded text-xs whitespace-nowrap mt-1`}
                >
                  {c.label}
                </span>
                <textarea
                  value={dialogue.childResponses[type]}
                  onChange={(e) =>
                    onChange(
                      `${basePath}.childResponses.${type}`,
                      e.target.value
                    )
                  }
                  className="flex-1 bg-gray-900 border border-gray-700 rounded-md p-2 text-gray-300 text-sm leading-relaxed resize-y min-h-[40px]"
                  rows={2}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* AI Follow-ups */}
      <div className="bg-gray-800 rounded-lg p-4 border-l-[3px] border-purple-500">
        <span className="inline-flex items-center gap-1.5 text-purple-400 text-xs font-semibold">
          <Bot className="w-3.5 h-3.5" />
          AI FOLLOW-UPS
        </span>

        <div className="mt-3 space-y-2">
          {(["ideal", "unexpected", "silent"] as const).map((type) => {
            const colors = {
              ideal: {
                bg: "bg-green-900/30",
                text: "text-green-400",
                label: "→ Ideal",
              },
              unexpected: {
                bg: "bg-yellow-900/30",
                text: "text-yellow-400",
                label: "→ Unexpected",
              },
              silent: {
                bg: "bg-red-900/30",
                text: "text-red-400",
                label: "→ Silent",
              },
            };
            const c = colors[type];

            return (
              <div key={type} className="flex gap-2 items-start">
                <span
                  className={`${c.bg} ${c.text} px-2 py-0.5 rounded text-xs whitespace-nowrap mt-1`}
                >
                  {c.label}
                </span>
                <textarea
                  value={dialogue.aiFollowUps[type]}
                  onChange={(e) =>
                    onChange(
                      `${basePath}.aiFollowUps.${type}`,
                      e.target.value
                    )
                  }
                  className="flex-1 bg-gray-900 border border-gray-700 rounded-md p-2 text-gray-300 text-sm leading-relaxed resize-y min-h-[40px]"
                  rows={2}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Screen Description */}
      <div className="bg-gray-800 rounded-lg p-4 border-l-[3px] border-gray-500">
        <span className="inline-flex items-center gap-1.5 text-gray-400 text-xs font-semibold">
          <Monitor className="w-3.5 h-3.5" />
          SCREEN DESCRIPTION
        </span>
        <textarea
          value={dialogue.screenDescription}
          onChange={(e) =>
            onChange(`${basePath}.screenDescription`, e.target.value)
          }
          className="mt-2 w-full bg-gray-900 border border-gray-700 rounded-md p-2 text-gray-400 text-sm leading-relaxed resize-y min-h-[40px]"
          rows={2}
        />
      </div>
    </div>
  );
}
