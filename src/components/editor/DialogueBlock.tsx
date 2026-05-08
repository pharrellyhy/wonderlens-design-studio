"use client";

import type { ReactNode } from "react";
import { Bot, Monitor, User } from "lucide-react";
import type { DialogueBlock as DialogueBlockType } from "@/lib/design-schema";
import { useFieldAiControls } from "@/components/editor/EditableField";

interface DialogueBlockProps {
  dialogue: DialogueBlockType;
  basePath: string;
  onChange: (path: string, value: string) => void;
  onAskAI?: (path: string, comment: string) => void;
}

interface DialogueTextAreaProps {
  label: string;
  icon: ReactNode;
  value: string;
  fieldPath: string;
  onChange: (path: string, value: string) => void;
  onAskAI?: (path: string, comment: string) => void;
  labelClassName: string;
  textareaClassName: string;
  rows: number;
}

function DialogueTextArea({
  label,
  icon,
  value,
  fieldPath,
  onChange,
  onAskAI,
  labelClassName,
  textareaClassName,
  rows,
}: DialogueTextAreaProps) {
  const { actionButtons, commentRow } = useFieldAiControls({
    fieldPath,
    onAskAI,
  });

  return (
    <>
      <div className="flex justify-between items-center mb-2">
        <span
          className={`inline-flex items-center gap-1.5 text-xs font-semibold ${labelClassName}`}
        >
          {icon}
          {label}
        </span>
        {actionButtons}
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(fieldPath, e.target.value)}
        className={textareaClassName}
        rows={rows}
      />
      {commentRow}
    </>
  );
}

interface ResponseTextAreaProps {
  label: string;
  labelClassName: string;
  value: string;
  fieldPath: string;
  onChange: (path: string, value: string) => void;
  onAskAI?: (path: string, comment: string) => void;
}

function ResponseTextArea({
  label,
  labelClassName,
  value,
  fieldPath,
  onChange,
  onAskAI,
}: ResponseTextAreaProps) {
  const { actionButtons, commentRow } = useFieldAiControls({
    fieldPath,
    onAskAI,
  });

  return (
    <div className="flex gap-2 items-start">
      <span
        className={`${labelClassName} px-2 py-0.5 rounded text-xs whitespace-nowrap mt-1`}
      >
        {label}
      </span>
      <div className="flex-1 min-w-0">
        {actionButtons && (
          <div className="mb-1 flex justify-end">{actionButtons}</div>
        )}
        <textarea
          value={value}
          onChange={(e) => onChange(fieldPath, e.target.value)}
          className="w-full bg-gray-900 border border-gray-700 rounded-md p-2 text-gray-300 text-sm leading-relaxed resize-y min-h-[40px]"
          rows={2}
        />
        {commentRow}
      </div>
    </div>
  );
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
        <DialogueTextArea
          label="AI SAYS"
          icon={<Bot className="w-3.5 h-3.5" />}
          value={dialogue.aiSays}
          fieldPath={`${basePath}.aiSays`}
          onChange={onChange}
          onAskAI={onAskAI}
          labelClassName="text-indigo-400"
          textareaClassName="w-full bg-gray-900 border border-gray-700 rounded-md p-2 text-gray-200 text-sm leading-relaxed resize-y min-h-[60px]"
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
              <ResponseTextArea
                key={type}
                label={c.label}
                labelClassName={`${c.bg} ${c.text}`}
                value={dialogue.childResponses[type] ?? ""}
                fieldPath={`${basePath}.childResponses.${type}`}
                onChange={onChange}
                onAskAI={onAskAI}
              />
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
              <ResponseTextArea
                key={type}
                label={c.label}
                labelClassName={`${c.bg} ${c.text}`}
                value={dialogue.aiFollowUps[type] ?? ""}
                fieldPath={`${basePath}.aiFollowUps.${type}`}
                onChange={onChange}
                onAskAI={onAskAI}
              />
            );
          })}
        </div>
      </div>

      {/* Screen Description */}
      <div className="bg-gray-800 rounded-lg p-4 border-l-[3px] border-gray-500">
        <DialogueTextArea
          label="SCREEN DESCRIPTION"
          icon={<Monitor className="w-3.5 h-3.5" />}
          value={dialogue.screenDescription}
          fieldPath={`${basePath}.screenDescription`}
          onChange={onChange}
          onAskAI={onAskAI}
          labelClassName="text-gray-400"
          textareaClassName="w-full bg-gray-900 border border-gray-700 rounded-md p-2 text-gray-400 text-sm leading-relaxed resize-y min-h-[40px]"
          rows={2}
        />
      </div>
    </div>
  );
}
