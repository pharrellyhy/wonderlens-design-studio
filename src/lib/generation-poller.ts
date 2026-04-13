import { pollGenerationStatus } from "@/lib/api-client";
import type { GenerationJob, VariantResult } from "@/lib/design-schema";
import { useDesignStore, type DesignVariant } from "@/store/design-store";

const POLL_INTERVAL_MS = 3000;

interface ActivePoll {
  jobId: string;
  intervalId: ReturnType<typeof setInterval>;
  seenVariantIds: Set<string>;
}

let active: ActivePoll | null = null;

// Separate poll slot for single-variant "opposite" jobs. Kept distinct from
// the main `active` slot so kicking off an opposite generation does not
// cancel an in-flight multi-variant run (or vice-versa).
interface OppositePoll {
  jobId: string;
  parentDesignId: string;
  intervalId: ReturnType<typeof setInterval>;
}

const oppositePolls = new Map<string, OppositePoll>();

/**
 * Stop the currently running poller (if any). Safe to call repeatedly.
 */
export function stopPolling(): void {
  if (active) {
    clearInterval(active.intervalId);
    active = null;
  }
}

/**
 * Whether a poller is currently running for the given job.
 */
export function isPollingJob(jobId: string): boolean {
  return active?.jobId === jobId;
}

/**
 * Begin polling /api/generate/[jobId]/status until the job is terminal.
 *
 * Survives component unmounts: the interval is held in module-level state, not
 * a React ref. The user can navigate to the editor and back without
 * interrupting in-flight generation. Updates the Zustand store directly.
 *
 * If a poller is already active, it is replaced.
 */
export function startPolling(jobId: string): void {
  stopPolling();

  const seenVariantIds = new Set<string>();
  const intervalId = setInterval(() => {
    void tick(jobId, seenVariantIds);
  }, POLL_INTERVAL_MS);

  active = { jobId, intervalId, seenVariantIds };

  // Fire one immediate poll so the first variant arrives without waiting
  // POLL_INTERVAL_MS.
  void tick(jobId, seenVariantIds);
}

async function tick(jobId: string, seen: Set<string>): Promise<void> {
  // If another startPolling() call replaced us, bail out.
  if (active?.jobId !== jobId) return;

  const store = useDesignStore.getState();

  let job: GenerationJob;
  try {
    job = await pollGenerationStatus(jobId);
  } catch (err) {
    if (active?.jobId !== jobId) return;
    stopPolling();
    store.setGenerationJobId(null);
    const message = err instanceof Error ? err.message : "Polling failed";
    setGenerationError(message);
    return;
  }

  if (active?.jobId !== jobId) return;

  const allFailures: string[] = [];

  for (const result of job.variants) {
    if (result.status === "failed") {
      const errorText =
        result.error ?? result.issues?.[0]?.description ?? "unknown error";
      allFailures.push(`${result.category}/${result.gameStyle}: ${errorText}`);
    }

    const variant: DesignVariant = {
      id: result.id,
      category: result.category,
      gameStyle: result.gameStyle,
      status: result.status,
      design: result.design,
      rubricScores: result.rubricScores,
      error: result.error,
    };

    if (seen.has(result.id)) {
      // In-place update for placeholders transitioning pending → complete/failed.
      store.updateVariant(result.id, variant);
      if (result.status === "failed") {
        console.warn(
          `[gallery] variant failed (${result.category}/${result.gameStyle}):`,
          result.error ?? result.issues,
        );
      }
    } else {
      seen.add(result.id);
      store.addVariant(variant);
    }
  }

  const totalVariants = job.variants.length;
  const successCount = job.variants.filter(
    (v) => v.status === "complete",
  ).length;
  const isTerminal = job.status === "complete" || job.status === "failed";

  if (allFailures.length > 0) {
    const header = isTerminal
      ? successCount === 0
        ? `All ${totalVariants} variant${totalVariants === 1 ? "" : "s"} failed`
        : `${allFailures.length} of ${totalVariants} variants failed`
      : `${allFailures.length} variant${allFailures.length === 1 ? "" : "s"} failed so far`;
    const jobErrorLine = job.error ? `\n${job.error}` : "";
    setGenerationError(
      `${header}:${jobErrorLine}\n• ${allFailures.join("\n• ")}`,
    );
  } else if (isTerminal && successCount === 0) {
    setGenerationError(
      job.error ?? "Generation finished but produced no variants.",
    );
  }

  if (isTerminal) {
    stopPolling();
    store.setGenerationJobId(null);
  }
}

// ---------------------------------------------------------------------------
// Generation error subscription
// ---------------------------------------------------------------------------
//
// The poller lives outside React, but consumers (the gallery) need to render
// the latest error message. We expose a tiny pub/sub so the gallery can
// subscribe and re-render on changes without re-mounting the poller.

type ErrorListener = (message: string | null) => void;

let currentError: string | null = null;
const errorListeners = new Set<ErrorListener>();

function setGenerationError(message: string | null): void {
  currentError = message;
  for (const fn of errorListeners) fn(message);
}

export function getGenerationError(): string | null {
  return currentError;
}

export function clearGenerationError(): void {
  setGenerationError(null);
}

export function subscribeGenerationError(listener: ErrorListener): () => void {
  errorListeners.add(listener);
  listener(currentError);
  return () => {
    errorListeners.delete(listener);
  };
}

// ---------------------------------------------------------------------------
// Opposite-job polling
// ---------------------------------------------------------------------------

/**
 * Poll a single-variant "opposite" generation job and merge the resulting
 * variant into the gallery store when it becomes terminal. Lives in a
 * separate poll slot from the main multi-variant poller so both can run
 * concurrently without cancelling each other.
 */
export function startOppositePolling(
  jobId: string,
  parentDesignId: string,
): void {
  // Replace any existing poll for the same jobId.
  stopOppositePolling(jobId);

  const intervalId = setInterval(() => {
    void oppositeTick(jobId);
  }, POLL_INTERVAL_MS);

  oppositePolls.set(jobId, { jobId, parentDesignId, intervalId });

  // Fire an immediate poll so the skeleton shows up without waiting for the
  // first interval tick.
  void oppositeTick(jobId);
}

export function stopOppositePolling(jobId: string): void {
  const entry = oppositePolls.get(jobId);
  if (entry) {
    clearInterval(entry.intervalId);
    oppositePolls.delete(jobId);
  }
}

async function oppositeTick(jobId: string): Promise<void> {
  const entry = oppositePolls.get(jobId);
  if (!entry) return;

  const store = useDesignStore.getState();

  let job: GenerationJob;
  try {
    job = await pollGenerationStatus(jobId);
  } catch (err) {
    stopOppositePolling(jobId);
    const message =
      err instanceof Error ? err.message : "Opposite polling failed";
    setGenerationError(message);
    return;
  }

  // Opposite jobs always carry exactly one variant (enqueueSingleVariantJob).
  const variantResult: VariantResult | undefined = job.variants[0];
  if (!variantResult) {
    // Nothing yet — wait for next tick.
    return;
  }

  const variant: DesignVariant = {
    id: variantResult.id,
    category: variantResult.category,
    gameStyle: variantResult.gameStyle,
    status: variantResult.status,
    design: variantResult.design,
    rubricScores: variantResult.rubricScores,
    error: variantResult.error,
    parentDesignId: entry.parentDesignId,
  };

  const existing = store.variants.find((v) => v.id === variant.id);
  if (existing) {
    store.updateVariant(variant.id, variant);
  } else {
    store.addVariant(variant);
  }

  const isTerminal = job.status === "complete" || job.status === "failed";
  if (isTerminal) {
    stopOppositePolling(jobId);
    if (variantResult.status === "complete") {
      // Persistence guarantees the parent → opposite link is now on disk.
      store.addParentWithOpposite(entry.parentDesignId);
    }
    if (variantResult.status === "failed") {
      const errorText =
        variantResult.error ?? job.error ?? "Opposite generation failed";
      setGenerationError(errorText);
    }
  }
}
