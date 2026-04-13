"use client";

import { useState, useCallback } from "react";
import { MessageCircle, Sparkles, Wand2 } from "lucide-react";

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
  const [showComment, setShowComment] = useState(false);
  const [comment, setComment] = useState("");

  const handleAskAI = useCallback(() => {
    if (onAskAI && comment.trim()) {
      onAskAI(fieldPath, comment);
      setComment("");
      setShowComment(false);
    }
  }, [onAskAI, fieldPath, comment]);

  return (
    <div className={`bg-gray-800 rounded-lg p-4 ${className}`}>
      <div className="flex justify-between items-center mb-2">
        <label className="text-gray-400 text-xs uppercase tracking-wider">
          {label}
        </label>
        <div className="flex gap-2">
          <button
            onClick={() => setShowComment(!showComment)}
            className="inline-flex items-center gap-1 text-gray-500 hover:text-gray-300 text-xs transition-colors"
          >
            <MessageCircle className="w-3 h-3" />
            comment
          </button>
          {onAskAI && (
            <button
              onClick={() => {
                setShowComment(true);
              }}
              className="inline-flex items-center gap-1 text-gray-500 hover:text-blue-400 text-xs transition-colors"
            >
              <Wand2 className="w-3 h-3" />
              regen
            </button>
          )}
        </div>
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

      {showComment && (
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
            onClick={handleAskAI}
            className="inline-flex items-center gap-1 bg-indigo-700 hover:bg-indigo-600 text-white text-xs px-3 py-1 rounded-md transition-colors"
          >
            <Sparkles className="w-3 h-3" />
            Ask AI
          </button>
        </div>
      )}
    </div>
  );
}
