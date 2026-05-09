"use client";

import { useCallback, useRef, useState } from "react";
import { FileText, FolderOpen, PencilLine } from "lucide-react";

import {
  BundleImportError,
  importBundlesFromFiles,
  importBundlesFromZipFiles,
  type ImportedBundleResult,
} from "@/lib/bundle-import";
import { useDesignStore } from "@/store/design-store";

interface ExistingDesignImporterProps {
  onBundleImported?: (result: ImportedBundleResult) => void;
  onBundlesImported?: (results: ImportedBundleResult[]) => void;
}

export function ExistingDesignImporter({
  onBundleImported,
  onBundlesImported,
}: ExistingDesignImporterProps) {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [missingFiles, setMissingFiles] = useState<string[] | null>(null);
  const [busy, setBusy] = useState(false);
  const importedBundles = useDesignStore((s) => s.importedBundles);
  const setImportedBundles = useDesignStore((s) => s.setImportedBundles);
  const clearImportedBundles = useDesignStore((s) => s.clearImportedBundles);

  const folderInputRef = useRef<HTMLInputElement | null>(null);

  const resetImportState = useCallback(() => {
    setError(null);
    setMissingFiles(null);
  }, []);

  const finalize = useCallback(
    (results: ImportedBundleResult[]) => {
      resetImportState();
      if (results.length === 0) {
        setError("No activity bundles were found.");
        return;
      }
      if (onBundlesImported) {
        setImportedBundles(results);
        onBundlesImported(results);
        return;
      }
      if (results.length === 1) {
        clearImportedBundles();
        onBundleImported?.(results[0]);
        return;
      }
      setImportedBundles(results);
    },
    [
      clearImportedBundles,
      onBundleImported,
      onBundlesImported,
      resetImportState,
      setImportedBundles,
    ],
  );

  const reportError = useCallback((err: unknown) => {
    if (err instanceof BundleImportError) {
      setError(err.message);
      setMissingFiles(err.missingFiles ?? null);
      clearImportedBundles();
      return;
    }
    setError(err instanceof Error ? err.message : "Failed to import bundle.");
    setMissingFiles(null);
    clearImportedBundles();
  }, [clearImportedBundles]);

  const runImport = useCallback(
    async (loadBundles: () => Promise<ImportedBundleResult[]>) => {
      setBusy(true);
      clearImportedBundles();
      try {
        finalize(await loadBundles());
      } catch (err) {
        reportError(err);
      } finally {
        setBusy(false);
      }
    },
    [clearImportedBundles, finalize, reportError],
  );

  const handleZips = useCallback(
    (files: File[]) => runImport(() => importBundlesFromZipFiles(files)),
    [runImport],
  );

  const handleFolder = useCallback(
    (files: File[]) => runImport(() => importBundlesFromFiles(files)),
    [runImport],
  );

  const handleDroppedFiles = useCallback(
    (files: File[]) => {
      const zipFiles = files.filter((file) =>
        file.name.toLowerCase().endsWith(".zip"),
      );
      const folderFiles = files.filter(
        (file) => !file.name.toLowerCase().endsWith(".zip"),
      );

      if (zipFiles.length > 0 && folderFiles.length === 0) {
        void handleZips(zipFiles);
        return;
      }

      if (folderFiles.length > 0 && zipFiles.length === 0) {
        void handleFolder(folderFiles);
        return;
      }

      setError(
        "Please drop ZIP archives or activity folder files, not a mixture of both.",
      );
      setMissingFiles(null);
      clearImportedBundles();
    },
    [clearImportedBundles, handleFolder, handleZips],
  );

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      setDragActive(false);
      const files = Array.from(event.dataTransfer.files);
      if (files.length > 0) handleDroppedFiles(files);
    },
    [handleDroppedFiles],
  );

  const handleBrowseZip = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.multiple = true;
    input.accept = ".zip,application/zip";
    input.onchange = (event) => {
      const files = Array.from(
        (event.target as HTMLInputElement).files ?? [],
      );
      if (files.length > 0) void handleZips(files);
    };
    input.click();
  }, [handleZips]);

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
      void handleFolder(Array.from(list));
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
              Upload one or more 5-file activity bundles:{" "}
              <code>spec.md</code>, <code>prod.md</code>,{" "}
              <code>tag_block.yaml</code>,{" "}
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
                <FileText className="h-4 w-4" /> Pick ZIPs
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
              {busy
                ? "Importing…"
                : "Drop .zip files or folder files here, or use the buttons above."}
            </span>
          </div>
        </div>
      </div>

      {!onBundlesImported && onBundleImported && importedBundles.length > 1 && (
        <div className="mt-4 rounded-lg border border-gray-700 bg-gray-900/70 p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-white">
                {importedBundles.length} activities ready
              </h3>
              <p className="text-xs text-gray-500">
                Select one to open in the editor.
              </p>
            </div>
            <button
              type="button"
              onClick={clearImportedBundles}
              className="rounded-md border border-gray-700 px-2 py-1 text-xs text-gray-400 hover:border-gray-500 hover:text-gray-200"
            >
              Clear
            </button>
          </div>
          <div className="space-y-2">
            {importedBundles.map((result, index) => {
              const name = result.bundle.prod.basicInfo.activityName;
              const id = result.bundle.activityId;
              return (
                <div
                  key={`${id}-${index}`}
                  className="flex items-center justify-between gap-3 rounded-lg border border-gray-800 bg-gray-950/70 px-3 py-2"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-gray-100">
                      {name}
                    </div>
                    <div className="truncate text-xs text-gray-500">
                      {id} ·{" "}
                      {result.rubricEvaluated
                        ? "scorecard found"
                        : "needs rubric"}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onBundleImported(result)}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-emerald-700/70 bg-emerald-950/40 px-2.5 py-1.5 text-xs font-medium text-emerald-200 hover:border-emerald-400"
                  >
                    <PencilLine className="h-3.5 w-3.5" />
                    Open
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

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
