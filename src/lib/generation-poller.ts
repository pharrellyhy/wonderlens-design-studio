import { pollGenerationStatus } from "@/lib/api-client";
import type { GenerationJob } from "@/lib/design-schema";
import { useDesignStore, type DesignVariant } from "@/store/design-store";

const POLL_INTERVAL_MS = 3000;

interface ActivePoll {
  jobId: string;
  intervalId: ReturnType<typeof setInterval>;
  seenVariantIds: Set<string>;
}

let active: ActivePoll | null = null;

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
    if (result.status === "failed" || !result.design) {
      const errorText =
        result.error ?? result.issues?.[0]?.description ?? "unknown error";
      allFailures.push(`${result.category}/${result.gameStyle}: ${errorText}`);
    }

    if (seen.has(result.id)) continue;
    seen.add(result.id);

    if (result.status === "failed" || !result.design) {
      console.warn(
        `[gallery] variant failed (${result.category}/${result.gameStyle}):`,
        result.error ?? result.issues,
      );
      continue;
    }

    const variant: DesignVariant = {
      id: result.id,
      design: result.design,
      rubricScores: result.rubricScores,
      isGenerating: false,
      error: undefined,
    };
    store.addVariant(variant);
  }

  const totalSeen = seen.size;
  const successCount = totalSeen - allFailures.length;
  const isTerminal = job.status === "complete" || job.status === "failed";

  if (allFailures.length > 0) {
    const header = isTerminal
      ? successCount === 0
        ? `All ${totalSeen} variant${totalSeen === 1 ? "" : "s"} failed`
        : `${allFailures.length} of ${totalSeen} variants failed`
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
