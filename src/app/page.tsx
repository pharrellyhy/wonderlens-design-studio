"use client";

import { useRouter } from "next/navigation";
import { ExistingDesignImporter } from "@/components/upload/ExistingDesignImporter";
import { YamlUploader } from "@/components/upload/YamlUploader";
import { useDesignStore } from "@/store/design-store";
import type { ParsedEntity } from "@/lib/yaml-parser";
import type { ImportedBundleResult } from "@/lib/bundle-import";

export default function Home() {
  const router = useRouter();
  const setParsedEntity = useDesignStore((s) => s.setParsedEntity);
  const setActiveBundle = useDesignStore((s) => s.setActiveBundle);
  const resetSession = useDesignStore((s) => s.resetSession);

  const handleEntityParsed = (entity: ParsedEntity) => {
    setParsedEntity(entity);
  };

  const handleBundleImported = (result: ImportedBundleResult) => {
    const designId = `imported-${crypto.randomUUID()}`;
    resetSession();
    // Trust the prod.md scorecard when it covers all 10 dimensions,
    // falling back to spec.md for legacy activity bundles —
    // those PASS verdicts are the author's evaluated state. Otherwise the
    // importer falls back to all-fail and the editor auto-runs the LLM
    // rubric on mount.
    setActiveBundle(
      designId,
      result.bundle,
      result.rubricScores,
      result.rubricEvaluated,
    );
    router.push(`/editor/${designId}`);
  };

  const parsedEntity = useDesignStore((s) => s.parsedEntity);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* No page-level header — the global app shell nav in `layout.tsx`
          already shows the "WonderLens Design Studio" wordmark. The hero
          headline below carries the page-specific context. */}

      {/* Main */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-white mb-3">
            Create or Review a Game Design
          </h2>
          <p className="text-gray-400 text-lg">
            Generate new variants from an entity mapping, or open an existing
            activity for review and editing
          </p>
        </div>

        <YamlUploader onEntityParsed={handleEntityParsed} />

        {/* Generate button */}
        {parsedEntity && (
          <div className="mt-8 text-center">
            <button
              onClick={() => router.push(`/gallery/${parsedEntity.name}`)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-lg text-lg font-semibold transition-colors"
            >
              Generate Design Variants →
            </button>
            <p className="text-gray-500 text-sm mt-2">
              This will generate 2-4 design variants using AI. Estimated cost:
              $1-4 depending on provider.
            </p>
          </div>
        )}

        <div className="my-10 flex items-center gap-4 text-gray-600">
          <div className="h-px flex-1 bg-gray-800" />
          <span className="text-xs uppercase tracking-wider">or</span>
          <div className="h-px flex-1 bg-gray-800" />
        </div>

        <ExistingDesignImporter onBundleImported={handleBundleImported} />
      </main>
    </div>
  );
}
