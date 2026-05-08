"use client";

import { useState, useCallback } from "react";
import { MessageCircle, Sparkles, Wand2 } from "lucide-react";

interface FieldAiControlsArgs {
  fieldPath: string;
  onAskAI?: (path: string, comment: string) => void;
}

export function useFieldAiControls({
  fieldPath,
  onAskAI,
}: FieldAiControlsArgs) {
  const [showComment, setShowComment] = useState(false);
  const [comment, setComment] = useState("");

  const handleAskAI = useCallback(() => {
    if (!onAskAI) return;
    onAskAI(fieldPath, comment.trim());
    setComment("");
    setShowComment(false);
  }, [onAskAI, fieldPath, comment]);

  const handleRegen = useCallback(() => {
    if (!onAskAI) return;
    onAskAI(fieldPath, "");
    setComment("");
    setShowComment(false);
  }, [onAskAI, fieldPath]);

  if (!onAskAI) {
    return {
      actionButtons: null,
      commentRow: null,
    };
  }

  return {
    actionButtons: (
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setShowComment((current) => !current)}
          className="inline-flex items-center gap-1 text-gray-500 hover:text-gray-300 text-xs transition-colors"
        >
          <MessageCircle className="w-3 h-3" />
          comment
        </button>
        <button
          type="button"
          onClick={handleRegen}
          className="inline-flex items-center gap-1 text-gray-500 hover:text-blue-400 text-xs transition-colors"
        >
          <Wand2 className="w-3 h-3" />
          regen
        </button>
      </div>
    ),
    commentRow: showComment ? (
      <div className="mt-2 flex gap-2">
        <input
          type="text"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Describe what you want AI to change..."
          className="flex-1 bg-gray-900 border border-gray-600 rounded-md px-2 py-1 text-gray-300 text-xs"
          onKeyDown={(e) => e.key === "Enter" && handleAskAI()}
        />
        <button
          type="button"
          onClick={handleAskAI}
          className="inline-flex items-center gap-1 bg-indigo-700 hover:bg-indigo-600 text-white text-xs px-3 py-1 rounded-md transition-colors"
        >
          <Sparkles className="w-3 h-3" />
          Ask AI
        </button>
      </div>
    ) : null,
  };
}

interface EditableFieldProps {
  label: string;
  value: string;
  fieldPath: string;
  onChange: (path: string, value: string) => void;
  onAskAI?: (path: string, comment: string) => void;
  multiline?: boolean;
  className?: string;
}

export function EditableField({
  label,
  value,
  fieldPath,
  onChange,
  onAskAI,
  multiline = false,
  className = "",
}: EditableFieldProps) {
  const { actionButtons, commentRow } = useFieldAiControls({
    fieldPath,
    onAskAI,
  });

  return (
    <div className={`bg-gray-800 rounded-lg p-4 ${className}`}>
      <div className="flex justify-between items-center mb-2">
        <label className="text-gray-400 text-xs uppercase tracking-wider">
          {label}
        </label>
        {actionButtons}
      </div>

      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(fieldPath, e.target.value)}
          className="w-full bg-gray-900 border border-gray-700 rounded-md p-2 text-gray-200 text-sm leading-relaxed resize-y min-h-[60px]"
          rows={3}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(fieldPath, e.target.value)}
          className="w-full bg-gray-900 border border-gray-700 rounded-md p-2 text-gray-200 text-sm"
        />
      )}

      {commentRow}
    </div>
  );
}
