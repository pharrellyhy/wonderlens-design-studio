"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { VariantCard } from "@/components/gallery/VariantCard";
import { useDesignStore } from "@/store/design-store";
import { startGeneration, pollGenerationStatus } from "@/lib/api-client";
import type { LLMProviderType } from "@/lib/llm/provider";
import type { DesignVariant } from "@/store/design-store";

const POLL_INTERVAL_MS = 3000;

export default function GalleryPage() {
  const router = useRouter();
  const parsedEntity = useDesignStore((s) => s.parsedEntity);
  const variants = useDesignStore((s) => s.variants);
  const setVariants = useDesignStore((s) => s.setVariants);
  const addVariant = useDesignStore((s) => s.addVariant);
  const setActiveDesign = useDesignStore((s) => s.setActiveDesign);
  const llmProvider = useDesignStore((s) => s.llmProvider);
  const apiKey = useDesignStore((s) => s.apiKey);
  const setLlmConfig = useDesignStore((s) => s.setLlmConfig);

  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const seenVariantIdsRef = useRef<Set<string>>(new Set());

  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current !== null) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  const handleGenerate = useCallback(async () => {
    if (!apiKey.trim()) {
      setGenerationError("Please enter an API key before generating.");
      return;
    }

    if (!parsedEntity) {
      setGenerationError("No entity loaded.");
      return;
    }

    setIsGenerating(true);
    setGenerationError(null);
    setVariants([]);
    seenVariantIdsRef.current = new Set();

    let jobId: string;
    try {
      jobId = await startGeneration({
        entityYaml: parsedEntity.rawYaml,
        llmProvider,
        apiKey,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to start generation";
      setGenerationError(message);
      setIsGenerating(false);
      return;
    }

    pollingIntervalRef.current = setInterval(async () => {
      try {
        const job = await pollGenerationStatus(jobId);

        // Process new variants
        for (const result of job.variants) {
          if (seenVariantIdsRef.current.has(result.id)) {
            continue;
          }
          seenVariantIdsRef.current.add(result.id);

          // Skip failed variants
          if (result.status === "failed" || !result.design) {
            continue;
          }

          const variant: DesignVariant = {
            id: result.id,
            design: result.design,
            rubricScores: result.rubricScores,
            isGenerating: false,
            error: undefined,
          };
          addVariant(variant);
        }

        // Stop when job is terminal
        if (job.status === "complete" || job.status === "failed") {
          stopPolling();
          setIsGenerating(false);
          if (job.status === "failed" && job.error) {
            setGenerationError(job.error);
          }
        }
      } catch (err) {
        stopPolling();
        setIsGenerating(false);
        const message = err instanceof Error ? err.message : "Polling failed";
        setGenerationError(message);
      }
    }, POLL_INTERVAL_MS);
  }, [apiKey, parsedEntity, llmProvider, setVariants, addVariant, stopPolling]);

  if (!parsedEntity) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 mb-4">
            No entity loaded. Please upload a YAML file first.
          </p>
          <button
            onClick={() => router.push("/")}
            className="text-indigo-400 hover:text-indigo-300"
          >
            &larr; Back to Upload
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
          <div>
            <h1 className="text-lg font-bold text-white">
              {parsedEntity.name} — Generated Variants
            </h1>
            <p className="text-gray-500 text-sm">
              Entity: {parsedEntity.name} |{" "}
              {parsedEntity.tiers.join(", ")} |{" "}
              {variants.length} variants generated
            </p>
          </div>
          <div className="flex gap-3">
            <span className="bg-green-900/50 text-green-400 px-3 py-1 rounded-full text-xs">
              &#10003; YAML parsed
            </span>
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-600 px-4 py-1.5 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              &#x27F3; Regenerate All
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
                setLlmConfig(e.target.value as LLMProviderType, apiKey)
              }
              className="bg-gray-800 border border-gray-600 text-gray-200 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="anthropic">Anthropic</option>
              <option value="openai">OpenAI</option>
            </select>
          </label>

          <label className="flex items-center gap-2 text-sm text-gray-400 flex-1">
            API Key
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setLlmConfig(llmProvider, e.target.value)}
              placeholder="Enter your API key..."
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
          <div className="bg-red-900/30 border border-red-800 rounded-lg px-4 py-3 text-red-400 text-sm">
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
                <div className="text-4xl mb-4 animate-pulse">&#128260;</div>
                <p className="text-gray-400 text-lg">
                  Generating design variants...
                </p>
                <p className="text-gray-600 text-sm mt-2">
                  This may take a few minutes. Each variant goes through a
                  multi-pass quality pipeline.
                </p>
              </>
            ) : (
              <>
                <p className="text-gray-500 text-lg mb-2">
                  No variants yet.
                </p>
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
          </div>
        )}

        <p className="text-center text-gray-600 text-sm mt-6">
          Click a variant to open it in the Design Studio &rarr;
        </p>
      </main>
    </div>
  );
}
