"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { ReviewConsole } from "@/components/review/ReviewConsole";
import { ExistingDesignImporter } from "@/components/upload/ExistingDesignImporter";
import { exportDesign } from "@/lib/api-client";
import type { ImportedBundleResult } from "@/lib/bundle-import";
import { useDesignStore } from "@/store/design-store";

export default function ReviewPage() {
  const router = useRouter();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [exportError, setExportError] = useState<string | null>(null);
  const setActiveBundle = useDesignStore((s) => s.setActiveBundle);
  const resetSession = useDesignStore((s) => s.resetSession);
  const importedBundles = useDesignStore((s) => s.importedBundles);
  const clearImportedBundles = useDesignStore((s) => s.clearImportedBundles);
  const reviewStatuses = useDesignStore((s) => s.reviewStatuses);
  const setReviewStatus = useDesignStore((s) => s.setReviewStatus);

  const handleBundlesImported = (results: ImportedBundleResult[]) => {
    setSelectedIndex(0);
    setExportError(null);
    if (results.length === 0) {
      clearImportedBundles();
    }
  };

  const handleOpenEditor = (result: ImportedBundleResult) => {
    const designId = `imported-${crypto.randomUUID()}`;
    resetSession();
    setActiveBundle(
      designId,
      result.bundle,
      result.rubricScores,
      result.rubricEvaluated,
    );
    router.push(`/editor/${designId}`);
  };

  const handleExport = async (result: ImportedBundleResult) => {
    setExportError(null);
    try {
      const { blob, filename } = await exportDesign({ bundle: result.bundle });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      setExportError(error instanceof Error ? error.message : "Export failed");
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <main className="mx-auto max-w-5xl px-6 py-12">
        <div className="mx-auto mb-8 flex max-w-2xl flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">
              Review Existing Activities
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-400">
              Import one activity bundle or a batch of generated activity
              directories to inspect the package before opening the full editor.
            </p>
          </div>
          {importedBundles.length > 0 && (
            <button
              type="button"
              onClick={clearImportedBundles}
              className="rounded-md border border-gray-700 px-3 py-2 text-sm text-gray-300 hover:border-gray-500 hover:text-white"
            >
              Import another batch
            </button>
          )}
        </div>

        {exportError && (
          <div className="mb-4 rounded-md border border-red-700 bg-red-950/40 p-3 text-sm text-red-300">
            Export failed: {exportError}
          </div>
        )}

        {importedBundles.length > 0 ? (
          <ReviewConsole
            results={importedBundles}
            selectedIndex={selectedIndex}
            onSelect={setSelectedIndex}
            onOpenEditor={handleOpenEditor}
            onExport={handleExport}
            reviewStatuses={reviewStatuses}
            onReviewStatusChange={setReviewStatus}
          />
        ) : (
          <ExistingDesignImporter onBundlesImported={handleBundlesImported} />
        )}
      </main>
    </div>
  );
}
