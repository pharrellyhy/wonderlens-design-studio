"use client";

import { useCallback, useState } from "react";
import { FileText, PencilLine } from "lucide-react";

import {
  importDesignFromFileText,
  type ImportedDesignResult,
} from "@/lib/design-import";

interface ExistingDesignImporterProps {
  onDesignImported: (result: ImportedDesignResult) => void;
}

export function ExistingDesignImporter({
  onDesignImported,
}: ExistingDesignImporterProps) {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleFile = useCallback(
    (file: File) => {
      setError(null);
      if (!file.name.endsWith(".md") && !file.name.endsWith(".json")) {
        setError("Please upload a WonderLens markdown spec or GameDesign JSON file.");
        return;
      }

      setBusy(true);
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const content = event.target?.result;
          if (typeof content !== "string") {
            throw new Error("File contents could not be read as text.");
          }

          const imported = importDesignFromFileText(file.name, content);
          onDesignImported(imported);
        } catch (err) {
          const message =
            err instanceof Error
              ? err.message
              : "Failed to import existing design.";
          setError(message);
        } finally {
          setBusy(false);
        }
      };
      reader.onerror = () => {
        setError("Failed to read the selected file.");
        setBusy(false);
      };
      reader.readAsText(file);
    },
    [onDesignImported],
  );

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      setDragActive(false);
      const file = event.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleBrowse = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".md,.json";
    input.onchange = (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (file) handleFile(file);
    };
    input.click();
  }, [handleFile]);

  return (
    <div className="w-full max-w-2xl mx-auto">
      <button
        type="button"
        onClick={handleBrowse}
        onDrop={handleDrop}
        onDragOver={(event) => {
          event.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        disabled={busy}
        className={`w-full border-2 border-dashed rounded-xl p-8 text-left transition-all disabled:opacity-60 disabled:cursor-wait ${
          dragActive
            ? "border-emerald-500 bg-emerald-500/10"
            : "border-gray-600 hover:border-gray-400"
        }`}
      >
        <div className="flex items-start gap-4">
          <span className="mt-1 inline-flex h-11 w-11 items-center justify-center rounded-lg bg-gray-800 text-emerald-300">
            {busy ? (
              <PencilLine className="h-5 w-5 animate-pulse" />
            ) : (
              <FileText className="h-5 w-5" />
            )}
          </span>
          <span>
            <span className="block text-lg font-semibold text-white">
              Review or modify an existing activity
            </span>
            <span className="mt-1 block text-sm text-gray-400">
              Upload a WonderLens spec markdown file or structured GameDesign JSON
              to open it directly in the editor.
            </span>
            <span className="mt-3 block text-xs text-gray-500">
              {busy ? "Importing..." : "Drop a .md or .json file here, or click to browse"}
            </span>
          </span>
        </div>
      </button>

      {error && (
        <div className="mt-4 rounded-lg border border-red-700 bg-red-900/30 p-3 text-sm text-red-300">
          {error}
        </div>
      )}
    </div>
  );
}
