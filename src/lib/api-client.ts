import type {
  ActivityBundle,
  GenerationJob,
} from "./activity-bundle-schema";
import type {
  GenerationMode,
  RubricIssue,
  RubricScores,
} from "./design-schema";
import type { ParsedEntity } from "./yaml-parser";

// ── Param / Result interfaces ───────────────────────────────────────────────

export interface GenerateParams {
  entityYaml: string;
  variantConfigs?: Array<{ category: string; gameStyle: string }>;
  generationMode: GenerationMode;
}

export interface GenerateOppositeParams {
  sourceDesignId: string;
}

export interface EvaluateParams {
  bundle: ActivityBundle;
}

export interface EvaluationResult {
  rubricScores: RubricScores;
  issues: RubricIssue[];
}

export interface RegenerateParams {
  bundle: ActivityBundle;
  fieldPath: string;
  comment: string;
}

export interface ExportParams {
  bundle: ActivityBundle;
}

export interface ExportResult {
  blob: Blob;
  filename: string;
}

// ── Helper ──────────────────────────────────────────────────────────────────

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, options);

  if (!response.ok) {
    let errorMessage: string;
    try {
      const body = await response.json();
      errorMessage = body.error ?? body.message ?? response.statusText;
    } catch {
      errorMessage = response.statusText;
    }
    throw new Error(errorMessage);
  }

  return response.json() as Promise<T>;
}

// ── API functions ───────────────────────────────────────────────────────────

export async function uploadYaml(file: File): Promise<ParsedEntity> {
  const formData = new FormData();
  formData.append("file", file);

  return apiFetch<ParsedEntity>("/api/upload", {
    method: "POST",
    body: formData,
  });
}

export async function startGeneration(params: GenerateParams): Promise<string> {
  const data = await apiFetch<{ jobId: string }>("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  return data.jobId;
}

export async function generateOppositeVariant(
  params: GenerateOppositeParams,
): Promise<string> {
  const data = await apiFetch<{ jobId: string }>("/api/generate/opposite", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  return data.jobId;
}

export async function pollGenerationStatus(jobId: string): Promise<GenerationJob> {
  return apiFetch<GenerationJob>(`/api/generate/${jobId}/status`);
}

export async function fetchParentsWithOpposite(
  parentDesignIds: readonly string[],
): Promise<string[]> {
  if (parentDesignIds.length === 0) return [];
  const params = new URLSearchParams();
  params.set("parentIds", parentDesignIds.join(","));
  const data = await apiFetch<{ parentIdsWithOpposite: string[] }>(
    `/api/runs/opposites?${params.toString()}`,
  );
  return data.parentIdsWithOpposite;
}

export async function evaluateDesign(
  params: EvaluateParams,
): Promise<EvaluationResult> {
  return apiFetch<EvaluationResult>("/api/evaluate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
}

export async function regenerateField(params: RegenerateParams): Promise<unknown> {
  const data = await apiFetch<{ updatedValue: unknown }>("/api/regenerate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  return data.updatedValue;
}

/**
 * Export a bundle as a ZIP archive. Returns the blob plus the suggested
 * filename (taken from the server's content-disposition header so it
 * matches the bundle's activityId).
 */
export async function exportDesign(params: ExportParams): Promise<ExportResult> {
  const response = await fetch("/api/export", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!response.ok) {
    let message = response.statusText;
    try {
      const body = await response.json();
      message = body.error ?? message;
    } catch {
      // fall through with statusText
    }
    throw new Error(message);
  }

  const blob = await response.blob();
  const cd = response.headers.get("content-disposition") ?? "";
  const m = /filename="([^"]+)"/.exec(cd);
  const filename = m ? m[1] : `${params.bundle.activityId}.zip`;
  return { blob, filename };
}

// ── Library actions ─────────────────────────────────────────────────────────

export interface OpenRunResult {
  runId: string;
  designId: string;
  bundle: ActivityBundle;
  rubricScores: RubricScores;
}

export async function openLibraryRun(runId: string): Promise<OpenRunResult> {
  return apiFetch<OpenRunResult>(
    `/api/library/${encodeURIComponent(runId)}`,
  );
}

export async function deleteLibraryRun(runId: string): Promise<void> {
  await apiFetch<{ ok: true }>(`/api/library/${encodeURIComponent(runId)}`, {
    method: "DELETE",
  });
}
