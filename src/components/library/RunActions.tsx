"use client";

import { ExternalLink, Trash2 } from "lucide-react";

interface RunActionsProps {
  runId: string;
  busy: boolean;
  anyBusy: boolean;
  onOpen: (runId: string) => void;
  onDelete: (runId: string) => void;
}

// Shared Open / Delete button pair. Used by the table row and the grid card.
// `busy` flags the row currently in flight; `anyBusy` disables both buttons
// across all rows while a sibling row is mid-fetch (avoids a delete race
// against an in-flight open).
export function RunActions({
  runId,
  busy,
  anyBusy,
  onOpen,
  onDelete,
}: RunActionsProps) {
  return (
    <div className="inline-flex items-center gap-1">
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onOpen(runId);
        }}
        disabled={anyBusy}
        title="Open in editor"
        className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs border border-gray-700 text-gray-300 hover:text-white hover:border-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <ExternalLink className="w-3 h-3" />
        {busy ? "Opening..." : "Open"}
      </button>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onDelete(runId);
        }}
        disabled={anyBusy}
        title="Delete run from disk"
        className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs border border-gray-700 text-gray-400 hover:text-red-300 hover:border-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <Trash2 className="w-3 h-3" />
      </button>
    </div>
  );
}
