"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, RefreshCcw } from "lucide-react";
import { VariantCard } from "@/components/gallery/VariantCard";
import { useDesignStore } from "@/store/design-store";
import {
  fetchParentsWithOpposite,
  generateOppositeVariant,
  startGeneration,
} from "@/lib/api-client";
import {
  clearGenerationError,
  isPollingJob,
  startOppositePolling,
  startPolling,
  stopPolling,
  subscribeGenerationError,
} from "@/lib/generation-poller";
import type { GenerationMode } from "@/lib/design-schema";
import type { LLMProviderType } from "@/lib/llm/provider";

export default function GalleryPage() {
  const router = useRouter();
  const parsedEntity = useDesignStore((s) => s.parsedEntity);
  const variants = useDesignStore((s) => s.variants);
  const setVariants = useDesignStore((s) => s.setVariants);
  const setActiveDesign = useDesignStore((s) => s.setActiveDesign);
  const llmProvider = useDesignStore((s) => s.llmProvider);
  const apiKey = useDesignStore((s) => s.apiKeys[s.llmProvider]);
  const setLlmProvider = useDesignStore((s) => s.setLlmProvider);
  const setApiKey = useDesignStore((s) => s.setApiKey);
  const generationJobId = useDesignStore((s) => s.generationJobId);
  const setGenerationJobId = useDesignStore((s) => s.setGenerationJobId);
  const generationMode = useDesignStore((s) => s.generationMode);
  const setGenerationMode = useDesignStore((s) => s.setGenerationMode);
  const parentsWithOpposite = useDesignStore((s) => s.parentsWithOpposite);
  const setParentsWithOpposite = useDesignStore(
    (s) => s.setParentsWithOpposite,
  );
  const resetSession = useDesignStore((s) => s.resetSession);

  const [generationError, setGenerationError] = useState<string | null>(null);
  const [oppositeBusyParents, setOppositeBusyParents] = useState<string[]>([]);

  const isGenerating = generationJobId !== null;

  const parentsWithOppositeSet = useMemo(
    () => new Set(parentsWithOpposite),
    [parentsWithOpposite],
  );
  // The opposite child variant having reached a terminal state means the
  // per-parent "busy" flag should be cleared. We derive this during render
  // instead of pushing it through an effect so we don't trip the
  // react-hooks/set-state-in-effect rule (cascading renders).
  const oppositeBusySet = useMemo(() => {
    const result = new Set(oppositeBusyParents);
    for (const variant of variants) {
      if (
        variant.parentDesignId &&
        (variant.status === "complete" || variant.status === "failed") &&
        result.has(variant.parentDesignId)
      ) {
        result.delete(variant.parentDesignId);
      }
    }
    return result;
  }, [oppositeBusyParents, variants]);

  // Subscribe to error stream from the poller singleton.
  useEffect(() => {
    return subscribeGenerationError(setGenerationError);
  }, []);

  // If we land on the gallery while a job is still in-flight (e.g. user
  // navigated back from the editor), make sure the poller is running.
  useEffect(() => {
    if (generationJobId && !isPollingJob(generationJobId)) {
      startPolling(generationJobId);
    }
  }, [generationJobId]);

  // Fetch which parents already have a persisted opposite, so the card can
  // disable the "Generate opposite" button correctly. Keyed by a sorted
  // comma-joined string of complete, non-opposite designIds so we only
  // re-fetch when the actual set changes — not on every poll tick.
  const parentCandidateKey = useMemo(
    () =>
      variants
        .filter((v) => v.status === "complete" && !v.parentDesignId)
        .map((v) => v.id)
        .sort()
        .join(","),
    [variants],
  );

  useEffect(() => {
    if (parentCandidateKey.length === 0) return;
    const ids = parentCandidateKey.split(",");
    let cancelled = false;
    (async () => {
      try {
        const matches = await fetchParentsWithOpposite(ids);
        if (cancelled) return;
        setParentsWithOpposite(matches);
      } catch (err) {
        if (cancelled) return;
        console.warn("[gallery] failed to fetch opposites map:", err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [parentCandidateKey, setParentsWithOpposite]);

  const handleGenerate = useCallback(async () => {
    if (!parsedEntity) {
      setGenerationError("No entity loaded.");
      return;
    }

    clearGenerationError();
    setVariants([]);
    setParentsWithOpposite([]);
    setOppositeBusyParents([]);

    let jobId: string;
    try {
      jobId = await startGeneration({
        entityYaml: parsedEntity.rawYaml,
        llmProvider,
        apiKey,
        generationMode,
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to start generation";
      setGenerationError(message);
      return;
    }

    setGenerationJobId(jobId);
    startPolling(jobId);
  }, [
    apiKey,
    generationMode,
    llmProvider,
    parsedEntity,
    setGenerationJobId,
    setParentsWithOpposite,
    setVariants,
  ]);

  const handleGenerateOpposite = useCallback(
    async (designId: string) => {
      clearGenerationError();
      setOppositeBusyParents((prev) =>
        prev.includes(designId) ? prev : [...prev, designId],
      );
      let jobId: string;
      try {
        jobId = await generateOppositeVariant({
          sourceDesignId: designId,
          llmProvider,
          apiKey,
        });
      } catch (err) {
        setOppositeBusyParents((prev) => prev.filter((id) => id !== designId));
        const message =
          err instanceof Error
            ? err.message
            : "Failed to start opposite generation";
        setGenerationError(message);
        return;
      }
      startOppositePolling(jobId, designId);
      // Clear busy state after a short delay — the poller owns the terminal
      // state and will call addParentWithOpposite on success. We don't want
      // to leave the button "Generating..." forever on failure, so listen
      // for the variant transitioning to complete/failed in a watcher below.
      // (Handled by the effect that watches `variants` + `parentDesignId`.)
    },
    [apiKey, llmProvider],
  );


  const handleBackToUpload = useCallback(() => {
    stopPolling();
    resetSession();
    clearGenerationError();
    router.push("/");
  }, [resetSession, router]);

  if (!parsedEntity) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 mb-4">
            No entity loaded. Please upload a YAML file first.
          </p>
          <button
            onClick={() => router.push("/")}
            className="inline-flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Upload
          </button>
        </div>
      </div>
    );
  }

  const handleSelectVariant = (variantId: string) => {
    const variant = variants.find((v) => v.id === variantId);
    if (variant && variant.design && variant.rubricScores) {
      setActiveDesign(variantId, variant.design, variant.rubricScores);
      router.push(`/editor/${variantId}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={handleBackToUpload}
              className="inline-flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors text-sm"
              title="Back to Upload"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <div className="h-6 w-px bg-gray-700" />
            <div>
              <h1 className="text-lg font-bold text-white">
                {parsedEntity.name} — Generated Variants
              </h1>
              <p className="text-gray-500 text-sm">
                Entity: {parsedEntity.name} | {parsedEntity.tiers.join(", ")} |{" "}
                {(() => {
                  const total = variants.length;
                  const complete = variants.filter(
                    (v) => v.status === "complete",
                  ).length;
                  if (total === 0) return "no variants yet";
                  if (complete === total) return `${total} variants ready`;
                  return `${complete} of ${total} ready`;
                })()}
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <span className="inline-flex items-center gap-1.5 bg-green-900/50 text-green-400 px-3 py-1 rounded-full text-xs">
              <CheckCircle2 className="w-3.5 h-3.5" />
              YAML parsed
            </span>
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="inline-flex items-center gap-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-600 px-4 py-1.5 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCcw className="w-3.5 h-3.5" />
              Regenerate All
            </button>
          </div>
        </div>
      </header>

      {/* LLM Settings Bar */}
      <div className="border-b border-gray-800 px-6 py-3 bg-gray-900/50">
        <div className="max-w-5xl mx-auto flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-gray-400">
            Provider
            <select
              value={llmProvider}
              onChange={(e) =>
                setLlmProvider(e.target.value as LLMProviderType)
              }
              className="bg-gray-800 border border-gray-600 text-gray-200 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="anthropic">Anthropic</option>
              <option value="openai">OpenAI</option>
              <option value="openai-compatible">OpenAI-Compatible</option>
            </select>
          </label>

          <label className="flex items-center gap-2 text-sm text-gray-400 flex-1">
            API Key
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(llmProvider, e.target.value)}
              placeholder="Leave blank to use server env key"
              className="bg-gray-800 border border-gray-600 text-gray-200 rounded-md px-3 py-1.5 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-600"
            />
          </label>

          <label className="flex items-center gap-2 text-sm text-gray-400">
            Mode
            <select
              value={generationMode}
              onChange={(e) =>
                setGenerationMode(e.target.value as GenerationMode)
              }
              className="bg-gray-800 border border-gray-600 text-gray-200 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              title="Mapping-informed uses entity dimensions for grounded bridges; freeform uses tier guidance loosely."
            >
              <option value="mapping-informed">Mapping-informed</option>
              <option value="freeform">Freeform</option>
            </select>
          </label>

          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-1.5 rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isGenerating ? "Generating..." : "Generate Variants"}
          </button>
        </div>
      </div>

      {/* Generation error */}
      {generationError && (
        <div className="max-w-5xl mx-auto px-6 pt-4">
          <div className="bg-red-900/30 border border-red-800 rounded-lg px-4 py-3 text-red-400 text-sm whitespace-pre-wrap">
            {generationError}
          </div>
        </div>
      )}

      {/* Variant grid */}
      <main className="max-w-5xl mx-auto px-6 py-8">
        {variants.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg mb-2">No variants yet.</p>
            <p className="text-gray-600 text-sm">
              Configure your LLM provider and API key above, then click
              &ldquo;Generate Variants&rdquo; to start.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {variants.map((variant) => (
              <VariantCard
                key={variant.id}
                id={variant.id}
                status={variant.status}
                category={variant.category}
                gameStyle={variant.gameStyle}
                design={variant.design}
                rubricScores={variant.rubricScores}
                error={variant.error}
                parentDesignId={variant.parentDesignId}
                hasOpposite={parentsWithOppositeSet.has(variant.id)}
                oppositeBusy={oppositeBusySet.has(variant.id)}
                onClick={() => handleSelectVariant(variant.id)}
                onGenerateOpposite={handleGenerateOpposite}
              />
            ))}
          </div>
        )}

        <p className="text-center text-gray-600 text-sm mt-6">
          Click a variant to open it in the Design Studio →
        </p>
      </main>
    </div>
  );
}
