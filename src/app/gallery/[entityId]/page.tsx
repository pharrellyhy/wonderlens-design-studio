"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, RefreshCcw } from "lucide-react";
import { VariantCard } from "@/components/gallery/VariantCard";
import { useDesignStore } from "@/store/design-store";
import { startGeneration } from "@/lib/api-client";
import {
  clearGenerationError,
  isPollingJob,
  startPolling,
  stopPolling,
  subscribeGenerationError,
} from "@/lib/generation-poller";
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
  const resetSession = useDesignStore((s) => s.resetSession);

  const [generationError, setGenerationError] = useState<string | null>(null);

  const isGenerating = generationJobId !== null;

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

  const handleGenerate = useCallback(async () => {
    if (!parsedEntity) {
      setGenerationError("No entity loaded.");
      return;
    }

    clearGenerationError();
    setVariants([]);

    let jobId: string;
    try {
      jobId = await startGeneration({
        entityYaml: parsedEntity.rawYaml,
        llmProvider,
        apiKey,
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
    llmProvider,
    parsedEntity,
    setGenerationJobId,
    setVariants,
  ]);

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
    if (variant) {
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
                {variants.length} variants generated
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
            {isGenerating ? (
              <>
                <div className="inline-flex items-center justify-center mb-5">
                  <div className="relative w-14 h-14">
                    <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20" />
                    <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-indigo-400 border-r-indigo-400/60 animate-spin" />
                  </div>
                </div>
                <p className="text-gray-300 text-lg font-medium">
                  Generating design variants
                  <span className="inline-flex ml-1">
                    <span className="animate-bounce [animation-delay:-0.3s]">
                      .
                    </span>
                    <span className="animate-bounce [animation-delay:-0.15s]">
                      .
                    </span>
                    <span className="animate-bounce">.</span>
                  </span>
                </p>
                <p className="text-gray-600 text-sm mt-2">
                  This may take a few minutes. Each variant goes through a
                  multi-pass quality pipeline.
                </p>
              </>
            ) : (
              <>
                <p className="text-gray-500 text-lg mb-2">No variants yet.</p>
                <p className="text-gray-600 text-sm">
                  Configure your LLM provider and API key above, then click
                  &ldquo;Generate Variants&rdquo; to start.
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {variants.map((variant) => (
              <VariantCard
                key={variant.id}
                design={variant.design}
                rubricScores={variant.rubricScores}
                isGenerating={variant.isGenerating}
                error={variant.error}
                onClick={() => handleSelectVariant(variant.id)}
              />
            ))}
            {isGenerating && (
              <div className="bg-gray-800/50 border-2 border-dashed border-gray-700 rounded-xl p-5 flex items-center justify-center min-h-[160px]">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center mb-3">
                    <div className="relative w-8 h-8">
                      <div className="absolute inset-0 rounded-full border-2 border-indigo-500/20" />
                      <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-indigo-400 animate-spin" />
                    </div>
                  </div>
                  <p className="text-gray-500 text-xs">More on the way…</p>
                </div>
              </div>
            )}
          </div>
        )}

        <p className="text-center text-gray-600 text-sm mt-6">
          Click a variant to open it in the Design Studio →
        </p>
      </main>
    </div>
  );
}
