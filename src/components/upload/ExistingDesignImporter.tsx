"use client";

import { useCallback, useRef, useState } from "react";
import { FileText, FolderOpen, PencilLine } from "lucide-react";

import {
  BundleImportError,
  importBundleFromFiles,
  importBundleFromZip,
  type ImportedBundleResult,
} from "@/lib/bundle-import";

interface ExistingDesignImporterProps {
  onBundleImported: (result: ImportedBundleResult) => void;
}

export function ExistingDesignImporter({
  onBundleImported,
}: ExistingDesignImporterProps) {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [missingFiles, setMissingFiles] = useState<string[] | null>(null);
  const [busy, setBusy] = useState(false);

  const folderInputRef = useRef<HTMLInputElement | null>(null);

  const finalize = useCallback(
    (result: ImportedBundleResult) => {
      setError(null);
      setMissingFiles(null);
      onBundleImported(result);
    },
    [onBundleImported],
  );

  const reportError = useCallback((err: unknown) => {
    if (err instanceof BundleImportError) {
      setError(err.message);
      setMissingFiles(err.missingFiles ?? null);
      return;
    }
    setError(err instanceof Error ? err.message : "Failed to import bundle.");
    setMissingFiles(null);
  }, []);

  const handleZip = useCallback(
    async (file: File) => {
      setBusy(true);
      try {
        const buf = await file.arrayBuffer();
        finalize(await importBundleFromZip(buf));
      } catch (err) {
        reportError(err);
      } finally {
        setBusy(false);
      }
    },
    [finalize, reportError],
  );

  const handleFolder = useCallback(
    async (files: File[]) => {
      setBusy(true);
      try {
        finalize(await importBundleFromFiles(files));
      } catch (err) {
        reportError(err);
      } finally {
        setBusy(false);
      }
    },
    [finalize, reportError],
  );

  const handleSingleFile = useCallback(
    (file: File) => {
      const lower = file.name.toLowerCase();
      if (lower.endsWith(".zip")) {
        return handleZip(file);
      }
      setError(
        "Please drop a ZIP archive of the activity bundle, or use 'Pick folder' to upload an unpacked directory.",
      );
      setMissingFiles(null);
    },
    [handleZip],
  );

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      setDragActive(false);
      const file = event.dataTransfer.files[0];
      if (file) handleSingleFile(file);
    },
    [handleSingleFile],
  );

  const handleBrowseZip = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".zip,application/zip";
    input.onchange = (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (file) void handleZip(file);
    };
    input.click();
  }, [handleZip]);

  const handleBrowseFolder = useCallback(() => {
    const input = folderInputRef.current;
    if (!input) return;
    // The webkitdirectory attribute is a Chromium/WebKit/Edge extension; it's
    // not in React's HTMLInputElement typings, so set it directly via the
    // ref. Browsers that ignore it fall back to a multi-file picker.
    (input as HTMLInputElement & { webkitdirectory: boolean }).webkitdirectory =
      true;
    input.value = "";
    input.click();
  }, []);

  const handleFolderInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const list = event.target.files;
      if (!list || list.length === 0) return;
      const files: File[] = [];
      for (let i = 0; i < list.length; i++) {
        const f = list.item(i);
        if (f) files.push(f);
      }
      void handleFolder(files);
    },
    [handleFolder],
  );

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        onDrop={handleDrop}
        onDragOver={(event) => {
          event.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        className={`w-full border-2 border-dashed rounded-xl p-8 transition-all ${
          dragActive
            ? "border-emerald-500 bg-emerald-500/10"
            : "border-gray-600 hover:border-gray-400"
        } ${busy ? "opacity-60" : ""}`}
      >
        <div className="flex items-start gap-4">
          <span className="mt-1 inline-flex h-11 w-11 items-center justify-center rounded-lg bg-gray-800 text-emerald-300">
            {busy ? (
              <PencilLine className="h-5 w-5 animate-pulse" />
            ) : (
              <FileText className="h-5 w-5" />
            )}
          </span>
          <div className="flex-1">
            <span className="block text-lg font-semibold text-white">
              Review or modify an existing activity
            </span>
            <span className="mt-1 block text-sm text-gray-400">
              Upload a 5-file activity bundle: <code>spec.md</code>,{" "}
              <code>prod.md</code>, <code>tag_block.yaml</code>,{" "}
              <code>recap.template.yaml</code>,{" "}
              <code>dashboard.template.yaml</code>.
            </span>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleBrowseZip}
                disabled={busy}
                className="inline-flex items-center gap-2 rounded-md border border-gray-600 bg-gray-800 px-3 py-1.5 text-sm text-gray-100 hover:border-emerald-400 disabled:cursor-wait"
              >
                <FileText className="h-4 w-4" /> Pick ZIP
              </button>
              <button
                type="button"
                onClick={handleBrowseFolder}
                disabled={busy}
                className="inline-flex items-center gap-2 rounded-md border border-gray-600 bg-gray-800 px-3 py-1.5 text-sm text-gray-100 hover:border-emerald-400 disabled:cursor-wait"
              >
                <FolderOpen className="h-4 w-4" /> Pick folder
              </button>
              <input
                ref={folderInputRef}
                type="file"
                multiple
                onChange={handleFolderInputChange}
                className="hidden"
              />
            </div>
            <span className="mt-3 block text-xs text-gray-500">
              {busy ? "Importing…" : "Drop a .zip here, or use the buttons above."}
            </span>
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-red-700 bg-red-900/30 p-3 text-sm text-red-300">
          <div>{error}</div>
          {missingFiles && missingFiles.length > 0 && (
            <ul className="mt-2 list-disc pl-5 text-xs">
              {missingFiles.map((name) => (
                <li key={name}>
                  <code>{name}</code>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
