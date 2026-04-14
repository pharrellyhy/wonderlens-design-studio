"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

export default function GalleryPage() {
  const router = useRouter();
  const parsedEntity = useDesignStore((s) => s.parsedEntity);
  const variants = useDesignStore((s) => s.variants);
  const setVariants = useDesignStore((s) => s.setVariants);
  const setActiveDesign = useDesignStore((s) => s.setActiveDesign);
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
  // Set of parent designIds that currently have an opposite-variant job
  // in flight. Stored as a Set (not an array) and pruned by the effect below
  // so the bookkeeping doesn't accumulate monotonically as runs complete.
  const [oppositeBusySet, setOppositeBusySet] = useState<Set<string>>(
    () => new Set(),
  );

  const isGenerating = generationJobId !== null;

  const parentsWithOppositeSet = useMemo(
    () => new Set(parentsWithOpposite),
    [parentsWithOpposite],
  );

  // Trim the busy set whenever a child variant reaches a terminal state.
  // We subscribe directly to the Zustand store (rather than diffing the
  // `variants` selector inside an effect body) so this counts as an
  // external-system subscription — the lint rule
  // `react-hooks/set-state-in-effect` flags raw setState-in-effect, but
  // setState inside a subscription callback is the documented allowed
  // pattern (synchronizing React state with an external store on change).
  useEffect(() => {
    const unsubscribe = useDesignStore.subscribe((state, prevState) => {
      if (state.variants === prevState.variants) return;
      setOppositeBusySet((prev) => {
        if (prev.size === 0) return prev;
        let next: Set<string> | null = null;
        for (const variant of state.variants) {
          if (
            variant.parentDesignId &&
            (variant.status === "complete" ||
              variant.status === "failed") &&
            prev.has(variant.parentDesignId)
          ) {
            if (!next) next = new Set(prev);
            next.delete(variant.parentDesignId);
          }
        }
        return next ?? prev;
      });
    });
    return unsubscribe;
  }, []);

  // Reset the cross-entity store key when the active entity changes — the
  // zustand `parentsWithOpposite` list is keyed by designId but persists
  // across navigations to a fresh entity, which could otherwise briefly
  // mark unrelated runs as "has opposite" until the per-entity refetch
  // below replaces it.
  useEffect(() => {
    setParentsWithOpposite([]);
  }, [parsedEntity?.name, setParentsWithOpposite]);

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
    setOppositeBusySet(new Set());

    let jobId: string;
    try {
      jobId = await startGeneration({
        entityYaml: parsedEntity.rawYaml,
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
    generationMode,
    parsedEntity,
    setGenerationJobId,
    setParentsWithOpposite,
    setVariants,
  ]);

  // Auto-kick generation when the user lands on the gallery for the first
  // time. Skips if variants already exist (back-from-editor) or a job is
  // already in flight. The ref guard prevents StrictMode's double-mount in
  // dev from firing two parallel generation jobs. The handleGenerate call
  // is deferred via queueMicrotask so its setState calls run after the
  // effect commits, satisfying react-hooks/set-state-in-effect.
  const autoKickedRef = useRef(false);
  useEffect(() => {
    if (autoKickedRef.current) return;
    if (!parsedEntity) return;
    if (variants.length > 0) return;
    if (generationJobId !== null) return;
    autoKickedRef.current = true;
    queueMicrotask(() => {
      void handleGenerate();
    });
  }, [parsedEntity, variants.length, generationJobId, handleGenerate]);

  const handleGenerateOpposite = useCallback(
    async (designId: string) => {
      clearGenerationError();
      setOppositeBusySet((prev) => {
        if (prev.has(designId)) return prev;
        const next = new Set(prev);
        next.add(designId);
        return next;
      });
      let jobId: string;
      try {
        jobId = await generateOppositeVariant({
          sourceDesignId: designId,
        });
      } catch (err) {
        setOppositeBusySet((prev) => {
          if (!prev.has(designId)) return prev;
          const next = new Set(prev);
          next.delete(designId);
          return next;
        });
        const message =
          err instanceof Error
            ? err.message
            : "Failed to start opposite generation";
        setGenerationError(message);
        return;
      }
      startOppositePolling(jobId, designId);
      // The poller writes terminal state into the `variants` array; the
      // useEffect above watches `variants` and prunes this designId from
      // `oppositeBusySet` when its child reaches complete/failed.
    },
    [],
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

      {/* Generation settings bar */}
      <div className="border-b border-gray-800 px-6 py-3 bg-gray-900/50">
        <div className="max-w-5xl mx-auto flex items-center gap-4">
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
          <span className="text-xs text-gray-600">
            Change mode and click Regenerate All to re-run.
          </span>
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
